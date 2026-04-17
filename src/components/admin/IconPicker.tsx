import { useState, useMemo } from "react";
import { icons } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X } from "lucide-react";

interface IconPickerProps {
  value: string | null;
  onChange: (iconName: string | null) => void;
}

const POPULAR_ICONS = [
  "Home", "ShoppingCart", "Mail", "Phone", "Star", "Heart", "Shield",
  "FileText", "HelpCircle", "Info", "ExternalLink", "BookOpen", "Users",
  "MessageCircle", "Send", "Globe", "Lock", "CreditCard", "Package",
  "CheckCircle", "AlertCircle", "Settings", "Search", "ArrowRight",
];

const IconPicker = ({ value, onChange }: IconPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const iconNames = useMemo(() => {
    const allNames = Object.keys(icons).filter(
      (name) => name !== "createLucideIcon" && name !== "default"
    );
    if (!search.trim()) return POPULAR_ICONS.filter((n) => allNames.includes(n));
    const q = search.toLowerCase();
    return allNames.filter((name) => name.toLowerCase().includes(q)).slice(0, 60);
  }, [search]);

  const SelectedIcon = value && (icons as Record<string, any>)[value];

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2 h-9">
            {SelectedIcon ? (
              <>
                <SelectedIcon className="w-4 h-4" />
                <span className="text-xs">{value}</span>
              </>
            ) : (
              <span className="text-xs text-muted-foreground">Pick icon…</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <Input
            placeholder="Search icons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="mb-2 h-8 text-sm"
            autoFocus
          />
          <ScrollArea className="h-48">
            <div className="grid grid-cols-6 gap-1">
              {iconNames.map((name) => {
                const Icon = (icons as Record<string, any>)[name];
                if (!Icon) return null;
                return (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    className={`p-2 rounded hover:bg-accent flex items-center justify-center ${
                      value === name ? "bg-accent ring-1 ring-primary" : ""
                    }`}
                    onClick={() => {
                      onChange(name);
                      setOpen(false);
                      setSearch("");
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
            {iconNames.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No icons found</p>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>
      {value && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(null)}>
          <X className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
};

export default IconPicker;
