import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle, Send, User, Bot, Shield, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChatSession {
  id: string;
  visitor_name: string;
  visitor_email: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  unread_count?: number;
}

interface ChatMessage {
  id: string;
  session_id: string;
  role: string;
  content: string;
  created_at: string;
}

const AdminMessages = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(searchParams.get("session"));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }, []);

  // Fetch sessions
  const fetchSessions = useCallback(async () => {
    const { data: sessionsData } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false });

    if (sessionsData) {
      // Get last message for each session
      const enriched = await Promise.all(
        sessionsData.map(async (s: any) => {
          const { data: lastMsg } = await supabase
            .from("chat_messages")
            .select("content, role")
            .eq("session_id", s.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();
          return {
            ...s,
            last_message: lastMsg?.content || "No messages yet",
          } as ChatSession;
        })
      );
      setSessions(enriched);
    }
  }, []);

  useEffect(() => { fetchSessions(); }, [fetchSessions]);

  // Realtime sessions
  useEffect(() => {
    const channel = supabase
      .channel("admin-chat-sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, () => fetchSessions())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, () => fetchSessions())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSessions]);

  // Fetch messages for selected session
  const fetchMessages = useCallback(async () => {
    if (!selectedSession) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", selectedSession)
      .order("created_at", { ascending: true });
    if (data) {
      setMessages(data as ChatMessage[]);
      scrollToBottom();
    }
  }, [selectedSession, scrollToBottom]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime messages for selected session
  useEffect(() => {
    if (!selectedSession) return;
    const channel = supabase
      .channel(`admin-chat-msg-${selectedSession}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `session_id=eq.${selectedSession}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
          scrollToBottom();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedSession, scrollToBottom]);

  const selectSession = (id: string) => {
    setSelectedSession(id);
    setSearchParams({ session: id });
  };

  // Admin typing indicator
  const setAdminTyping = async (typing: boolean) => {
    if (!selectedSession) return;
    await supabase
      .from("chat_sessions")
      .update({ admin_typing: typing })
      .eq("id", selectedSession);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selectedSession || sending) return;
    setSending(true);
    await setAdminTyping(false);

    await supabase.from("chat_messages").insert({
      session_id: selectedSession,
      role: "admin",
      content: replyText.trim(),
    });

    await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() }).eq("id", selectedSession);

    setReplyText("");
    setSending(false);
  };

  const handleTyping = (value: string) => {
    setReplyText(value);
    if (value.trim()) {
      setAdminTyping(true);
    } else {
      setAdminTyping(false);
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  const filteredSessions = sessions.filter((s) =>
    s.visitor_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.visitor_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSession = sessions.find((s) => s.id === selectedSession);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-background rounded-xl border border-border overflow-hidden">
      {/* Left sidebar - Sessions list */}
      <div className="w-80 border-r border-border flex flex-col bg-background">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground mb-3">Chat Sessions</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search visitors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-sm h-9"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center">
              <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No chat sessions yet</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => selectSession(session.id)}
                className={cn(
                  "w-full text-left px-4 py-3 border-b border-border hover:bg-accent/50 transition-colors",
                  selectedSession === session.id && "bg-[hsl(210,100%,97%)] border-l-2 border-l-[hsl(210,100%,50%)]"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[hsl(210,100%,92%)] flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-[hsl(210,100%,45%)]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground truncate">{session.visitor_name}</p>
                      <span className="text-[11px] text-muted-foreground shrink-0">{timeAgo(session.updated_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{session.last_message}</p>
                  </div>
                </div>
              </button>
            ))
          )}
        </ScrollArea>
      </div>

      {/* Right chat window */}
      <div className="flex-1 flex flex-col">
        {selectedSession && currentSession ? (
          <>
            {/* Chat header */}
            <div className="h-14 px-4 border-b border-border flex items-center gap-3 bg-background">
              <div className="w-8 h-8 rounded-full bg-[hsl(210,100%,92%)] flex items-center justify-center">
                <User className="w-4 h-4 text-[hsl(210,100%,45%)]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{currentSession.visitor_name}</p>
                {currentSession.visitor_email && (
                  <p className="text-xs text-muted-foreground">{currentSession.visitor_email}</p>
                )}
              </div>
              <div className="ml-auto">
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[11px] font-medium",
                  currentSession.status === "active" ? "bg-[hsl(142,70%,92%)] text-[hsl(142,70%,30%)]" : "bg-muted text-muted-foreground"
                )}>
                  {currentSession.status}
                </span>
              </div>
            </div>

            {/* Messages area */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                    <div className="flex items-end gap-1.5 max-w-[75%]">
                      {msg.role !== "user" && (
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                          msg.role === "admin" ? "bg-[hsl(210,100%,92%)]" : "bg-muted"
                        )}>
                          {msg.role === "admin" ? (
                            <Shield className="w-3 h-3 text-[hsl(210,100%,45%)]" />
                          ) : (
                            <Bot className="w-3 h-3 text-muted-foreground" />
                          )}
                        </div>
                      )}
                      <div
                        className={cn(
                          "px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap",
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : msg.role === "admin"
                            ? "bg-[hsl(210,100%,95%)] text-[hsl(210,50%,20%)] rounded-bl-md border border-[hsl(210,100%,85%)]"
                            : "bg-muted text-foreground rounded-bl-md"
                        )}
                      >
                        {msg.role === "admin" && (
                          <span className="text-[10px] font-semibold text-[hsl(210,100%,50%)] block mb-0.5">Admin Reply</span>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply input */}
            <div className="p-4 border-t border-border bg-background">
              <div className="flex gap-2 max-w-3xl mx-auto">
                <Input
                  value={replyText}
                  onChange={(e) => handleTyping(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                  placeholder="Type a reply as Admin..."
                  className="text-sm"
                  onBlur={() => setAdminTyping(false)}
                />
                <Button onClick={sendReply} disabled={!replyText.trim() || sending} size="icon" className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-3">
              <MessageCircle className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">Select a chat session to view messages</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMessages;
