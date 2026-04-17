import { useEditMode } from "@/contexts/EditModeContext";
import { Save, X, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FloatingEditBarProps {
  slug: string;
}

const FloatingEditBar = ({ slug }: FloatingEditBarProps) => {
  const { isEditMode, hasChanges, publishChanges, discardChanges, saving, pendingChanges } = useEditMode();

  if (!isEditMode) return null;

  const changesCount = Object.keys(pendingChanges).length;

  return (
    <div data-floating-bar className="fixed bottom-0 left-0 right-0 z-[9998] animate-in slide-in-from-bottom-4">
      <div className="max-w-3xl mx-auto px-4 pb-4">
        <div className="bg-popover border border-border rounded-xl shadow-2xl px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Pencil className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Edit Mode</p>
              <p className="text-xs text-muted-foreground">
                {hasChanges ? `${changesCount} unsaved change${changesCount > 1 ? "s" : ""}` : "Click any text to edit"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={discardChanges}
              disabled={!hasChanges || saving}
              className="gap-1.5"
            >
              <X className="w-3.5 h-3.5" /> Discard
            </Button>
            <Button
              size="sm"
              onClick={() => publishChanges(slug)}
              disabled={!hasChanges || saving}
              className="gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Publish Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingEditBar;
