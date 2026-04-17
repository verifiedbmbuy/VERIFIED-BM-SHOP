import { useEffect, useRef } from "react";
import { MessageCircle, Send } from "lucide-react";

interface ChatMenuProps {
  open: boolean;
  onClose: () => void;
  /** Anchor the menu above a specific position. Defaults to bottom-right. */
  position?: "desktop" | "mobile";
}

const ChatMenu = ({ open, onClose, position = "desktop" }: ChatMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const positionClasses =
    position === "mobile"
      ? "bottom-[68px] left-1/2 -translate-x-1/2"
      : "bottom-[72px] right-6";

  return (
    <div
      ref={menuRef}
      className={`fixed z-[10000] w-64 rounded-xl bg-background border border-border shadow-xl animate-fade-in ${positionClasses}`}
    >
      <div className="p-3 space-y-2">
        <a
          href="https://wa.me/8801302669333"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[hsl(142,70%,45%)] flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">Chat on WhatsApp</span>
              <span className="w-2 h-2 rounded-full bg-[hsl(142,70%,45%)] shrink-0" />
            </div>
            <span className="text-xs text-muted-foreground">We are Online</span>
          </div>
        </a>

        <a
          href="https://t.me/Verifiedbmbuy"
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors group"
        >
          <div className="w-10 h-10 rounded-full bg-[hsl(200,100%,45%)] flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-foreground">Join on Telegram</span>
              <span className="w-2 h-2 rounded-full bg-[hsl(142,70%,45%)] shrink-0" />
            </div>
            <span className="text-xs text-muted-foreground">We are Online</span>
          </div>
        </a>
      </div>
    </div>
  );
};

export default ChatMenu;
