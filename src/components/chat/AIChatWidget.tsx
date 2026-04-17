import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Send, Loader2, MessageCircle, User, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant" | "admin"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vbb-chat`;
const TELEGRAM_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/telegram-notify`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages: messages.filter(m => m.role !== 'admin').map(m => ({ role: m.role === 'admin' ? 'assistant' : m.role, content: m.content })) }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Network error" }));
    throw new Error(err.error || `Error ${resp.status}`);
  }
  if (!resp.body) throw new Error("No response body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim() || !line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const p = JSON.parse(json);
        const c = p.choices?.[0]?.delta?.content as string | undefined;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }
  onDone();
}

const SESSION_STORAGE_KEY = "vbb_chat_session";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function saveSession(sessionId: string, visitorName: string) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({ sessionId, visitorName, ts: Date.now() }));
}

function loadSession(): { sessionId: string; visitorName: string } | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > SESSION_TTL_MS) { localStorage.removeItem(SESSION_STORAGE_KEY); return null; }
    return data;
  } catch { return null; }
}

const AIChatWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);
  useEffect(() => { if (open && formSubmitted) inputRef.current?.focus(); }, [open, formSubmitted]);

  // Restore session from localStorage on mount
  useEffect(() => {
    const saved = loadSession();
    if (saved) {
      setSessionId(saved.sessionId);
      setVisitorName(saved.visitorName);
      setFormSubmitted(true);
      // Fetch message history
      supabase
        .from("chat_messages")
        .select("role, content")
        .eq("session_id", saved.sessionId)
        .order("created_at", { ascending: true })
        .then(({ data }) => {
          if (data && data.length > 0) {
            setMessages(data.map((m) => ({ role: m.role as Msg["role"], content: m.content })));
          }
        });
    }
  }, []);

  // Listen for mobile nav trigger
  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("open-ai-chat", handler);
    return () => window.removeEventListener("open-ai-chat", handler);
  }, []);

  // Realtime: listen for admin messages & typing indicator
  useEffect(() => {
    if (!sessionId) return;

    const msgChannel = supabase
      .channel(`chat-messages-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${sessionId}` },
        (payload) => {
          const newMsg = payload.new as any;
          if (newMsg.role === "admin") {
            setMessages((prev) => [...prev, { role: "admin", content: newMsg.content }]);
          }
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`chat-session-typing-${sessionId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_sessions", filter: `id=eq.${sessionId}` },
        (payload) => {
          setAdminTyping((payload.new as any).admin_typing || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [sessionId]);

  const startSession = async () => {
    if (!visitorName.trim()) return;
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ visitor_name: visitorName.trim(), visitor_email: visitorEmail.trim() || null })
      .select()
      .single();
    if (error || !data) {
      toast({ variant: "destructive", title: "Error", description: "Could not start session" });
      return;
    }
    setSessionId(data.id);
    setFormSubmitted(true);
    saveSession(data.id, visitorName.trim());
  };

  const sendTelegramNotification = async (message: string) => {
    try {
      await fetch(TELEGRAM_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          visitor_name: visitorName,
          message,
          session_id: sessionId,
        }),
      });
    } catch {
      // Silent fail for telegram
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading || !sessionId) return;
    setInput("");
    const userMsg: Msg = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Save user message to DB
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: text,
    });

    // Update session timestamp
    await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", sessionId);

    // Send Telegram notification
    sendTelegramNotification(text);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: async () => {
          setLoading(false);
          // Save assistant response to DB
          if (assistantSoFar) {
            await supabase.from("chat_messages").insert({
              session_id: sessionId,
              role: "assistant",
              content: assistantSoFar,
            });
          }
        },
      });
    } catch (e: any) {
      setLoading(false);
      toast({ variant: "destructive", title: "Chat Error", description: e.message });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <>
      {/* Floating toggle */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-[76px] lg:bottom-6 right-4 lg:right-6 z-50 flex w-12 h-12 lg:w-14 lg:h-14 bg-[#25D366] rounded-full items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="w-7 h-7 text-white" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[10000] w-[380px] max-w-[calc(100vw-2rem)] h-[460px] lg:h-[520px] max-h-[calc(100vh-8rem)] flex flex-col rounded-2xl border border-border bg-background shadow-2xl animate-fade-in">
          {/* Header */}
          <div className="border-b border-border bg-primary rounded-t-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary-foreground" />
                <div>
                  <span className="text-sm font-semibold text-primary-foreground">Verified BM Shop</span>
                  <span className="flex items-center gap-1 text-xs text-primary-foreground/70">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Online
                  </span>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex gap-2 px-4 pb-3">
              <a
                href="https://wa.me/8801302669333"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] transition-colors text-white text-xs font-medium"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                WhatsApp
              </a>
              <a
                href="https://t.me/Verifiedbmbuy"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-[hsl(200,100%,45%)] hover:bg-[hsl(200,100%,40%)] transition-colors text-white text-xs font-medium"
              >
                <Send className="w-3.5 h-3.5" />
                Telegram
              </a>
            </div>
          </div>

          {/* Pre-chat form or Messages */}
          {!formSubmitted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Welcome! 👋</h3>
                <p className="text-xs text-muted-foreground">Please enter your name to start chatting</p>
              </div>
              <div className="w-full space-y-3">
                <Input
                  placeholder="Your Name *"
                  value={visitorName}
                  onChange={(e) => setVisitorName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startSession()}
                  className="text-sm border-primary/30 focus-visible:ring-primary"
                />
                <Input
                  placeholder="Email (optional)"
                  type="email"
                  value={visitorEmail}
                  onChange={(e) => setVisitorEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startSession()}
                  className="text-sm border-primary/30 focus-visible:ring-primary"
                />
                <Button onClick={startSession} disabled={!visitorName.trim()} className="w-full">
                  Start Chat
                </Button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <div className="text-center py-8 space-y-3">
                    <MessageCircle className="w-10 h-10 mx-auto text-primary/50" />
                    <p className="text-sm text-muted-foreground">Hello! Welcome to Verified BM Shop. How can I help you today?</p>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { icon: "🛒", q: "What products do you sell?" },
                        { icon: "📱", q: "Tell me about WhatsApp API" },
                        { icon: "📦", q: "How do I order?" },
                        { icon: "💰", q: "What are the prices?" },
                      ].map(({ icon, q }) => (
                        <button
                          key={q}
                          onClick={() => sendMessage(q)}
                          className="flex items-start gap-2 text-left p-2.5 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all text-xs leading-snug"
                        >
                          <span className="text-base shrink-0">{icon}</span>
                          <span className="text-foreground">{q}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {messages.map((m, i) => {
                  // Extract product links for "Buy Now" buttons
                  const productLinks: { label: string; href: string }[] = [];
                  // Extract WhatsApp/Telegram links for contact buttons
                  const contactLinks: { label: string; href: string; type: "whatsapp" | "telegram" }[] = [];
                  if (m.role !== "user") {
                    const linkRegex = /\[([^\]]*(?:Buy|buy|BM|WhatsApp|API)[^\]]*)\]\((https?:\/\/[^)]*\/shop\/[^)]+)\)/g;
                    let match;
                    while ((match = linkRegex.exec(m.content)) !== null) {
                      productLinks.push({ label: match[1].replace(/^Buy\s+/i, "").replace(/\s+here$/i, ""), href: match[2] });
                    }
                    // Match WhatsApp links
                    const waRegex = /\[([^\]]*)\]\((https?:\/\/wa\.me\/[^)]+)\)/g;
                    while ((match = waRegex.exec(m.content)) !== null) {
                      contactLinks.push({ label: "WhatsApp", href: match[2], type: "whatsapp" });
                    }
                    // Also match bare wa.me URLs
                    if (contactLinks.filter(c => c.type === "whatsapp").length === 0) {
                      const bareWa = m.content.match(/https?:\/\/wa\.me\/\S+/);
                      if (bareWa) contactLinks.push({ label: "WhatsApp", href: bareWa[0], type: "whatsapp" });
                    }
                    // Match Telegram links
                    const tgRegex = /\[([^\]]*)\]\((https?:\/\/t\.me\/[^)]+)\)/g;
                    while ((match = tgRegex.exec(m.content)) !== null) {
                      contactLinks.push({ label: "Telegram", href: match[2], type: "telegram" });
                    }
                    if (contactLinks.filter(c => c.type === "telegram").length === 0) {
                      const bareTg = m.content.match(/https?:\/\/t\.me\/\S+/);
                      if (bareTg) contactLinks.push({ label: "Telegram", href: bareTg[0], type: "telegram" });
                    }
                  }

                  const isExternal = (href: string) =>
                    href.includes("wa.me") || href.includes("t.me") || href.includes("telegram") || href.includes("whatsapp");

                  return (
                    <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[85%] space-y-1.5">
                        <div
                          className={`px-3 py-1.5 rounded-2xl text-sm ${
                            m.role === "user"
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : m.role === "admin"
                              ? "bg-[hsl(210,100%,95%)] text-[hsl(210,50%,20%)] rounded-bl-md border border-[hsl(210,100%,85%)]"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                        >
                          {m.role === "admin" && (
                            <span className="text-[10px] font-semibold text-[hsl(210,100%,50%)] block mb-0.5">Admin</span>
                          )}
                          {m.role === "user" ? (
                            m.content
                          ) : (
                            <div className="chat-markdown">
                              <ReactMarkdown
                                components={{
                                  a: ({ href, children }) => {
                                    const external = isExternal(href || "");
                                    return (
                                      <a
                                        href={href}
                                        target={external ? "_blank" : "_self"}
                                        rel={external ? "noopener noreferrer" : undefined}
                                        className="text-[#007AFF] underline decoration-[#007AFF] decoration-1 hover:decoration-2 font-semibold transition-all"
                                      >
                                        {children}
                                      </a>
                                    );
                                  },
                                  p: ({ children }) => <span className="block mb-1 last:mb-0">{children}</span>,
                                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                  ul: ({ children }) => <ul className="list-disc pl-4 my-1 space-y-0.5">{children}</ul>,
                                  li: ({ children }) => <li className="text-sm">{children}</li>,
                                }}
                              >
                                {m.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        {/* Buy Now Product Buttons */}
                        {productLinks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-1">
                            {productLinks.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.href}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shadow-sm"
                              >
                                🛒 Buy Now
                              </a>
                             ))}
                          </div>
                        )}
                        {/* WhatsApp / Telegram contact buttons */}
                        {contactLinks.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pl-1">
                            {contactLinks.map((link, idx) => (
                              <a
                                key={idx}
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition-colors shadow-sm ${
                                  link.type === "whatsapp"
                                    ? "bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)]"
                                    : "bg-[hsl(200,100%,45%)] hover:bg-[hsl(200,100%,40%)]"
                                }`}
                              >
                                {link.type === "whatsapp" ? (
                                  <MessageCircle className="w-3.5 h-3.5" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                {link.label}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {adminTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[hsl(210,100%,95%)] border border-[hsl(210,100%,85%)] px-3 py-2 rounded-2xl rounded-bl-md text-xs text-[hsl(210,50%,40%)] italic">
                      Admin is typing...
                    </div>
                  </div>
                )}
                {loading && messages[messages.length - 1]?.role !== "assistant" && (
                  <div className="flex justify-start">
                    <div className="bg-muted px-3 py-2 rounded-2xl rounded-bl-md">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="p-3 border-t border-border">
                <div className="flex gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                  <Button size="icon" onClick={() => sendMessage(input)} disabled={!input.trim() || loading} className="rounded-xl shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default AIChatWidget;
