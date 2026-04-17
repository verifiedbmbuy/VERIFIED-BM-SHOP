import { useState } from "react";
import { MessageCircle } from "lucide-react";
import ChatMenu from "./ChatMenu";

const WhatsAppButton = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
      <ChatMenu open={menuOpen} onClose={() => setMenuOpen(false)} position="desktop" />
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="w-14 h-14 bg-[hsl(142,70%,45%)] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all hover:scale-110"
        aria-label="Chat support"
      >
        <MessageCircle className="w-7 h-7 text-white" />
      </button>
    </div>
  );
};

export default WhatsAppButton;
