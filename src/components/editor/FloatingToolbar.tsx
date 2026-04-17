import { RefObject } from "react";
import { Bold, Italic, Underline, Link, AlignLeft, AlignCenter, AlignRight } from "lucide-react";

interface FloatingToolbarProps {
  position: { top: number; left: number };
  targetRef: RefObject<HTMLElement>;
}

const FloatingToolbar = ({ position, targetRef }: FloatingToolbarProps) => {
  const exec = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    targetRef.current?.focus();
  };

  const insertLink = () => {
    const url = prompt("Enter relative URL (e.g., /shop):");
    if (url) {
      exec("createLink", url);
    }
  };

  const buttons = [
    { icon: Bold, action: () => exec("bold"), label: "Bold" },
    { icon: Italic, action: () => exec("italic"), label: "Italic" },
    { icon: Underline, action: () => exec("underline"), label: "Underline" },
    { icon: Link, action: insertLink, label: "Link" },
    { icon: AlignLeft, action: () => exec("justifyLeft"), label: "Align Left" },
    { icon: AlignCenter, action: () => exec("justifyCenter"), label: "Center" },
    { icon: AlignRight, action: () => exec("justifyRight"), label: "Align Right" },
  ];

  return (
    <div
      className="fixed z-[9999] flex items-center gap-0.5 bg-popover border border-border rounded-lg shadow-lg px-1 py-1 animate-in fade-in-0 zoom-in-95"
      style={{ top: `${position.top}px`, left: `${position.left}px`, transform: "translateX(-50%)" }}
    >
      {buttons.map(({ icon: Icon, action, label }) => (
        <button
          key={label}
          type="button"
          onMouseDown={(e) => { e.preventDefault(); action(); }}
          className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
        </button>
      ))}
    </div>
  );
};

export default FloatingToolbar;
