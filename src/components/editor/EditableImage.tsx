import { useState } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import { ImagePlus } from "lucide-react";
import MediaLibraryModal from "@/components/admin/MediaLibraryModal";
import type { MediaFile } from "@/components/admin/MediaLibrary";
import { toBrandedUrl } from "@/lib/imageUtils";

interface EditableImageProps {
  fieldKey: string;
  src: string;
  alt?: string;
  className?: string;
}

const EditableImage = ({ fieldKey, src, alt = "", className = "" }: EditableImageProps) => {
  const { isEditMode, pendingChanges, updateField } = useEditMode();
  const [showMedia, setShowMedia] = useState(false);

  const displaySrc = pendingChanges[fieldKey] ?? src;

  const handleSelect = (file: MediaFile) => {
    // Store relative path
    const url = new URL(file.url, window.location.origin);
    const relativePath = url.pathname;
    updateField(fieldKey, relativePath);
  };

  if (!isEditMode) {
    return <img src={toBrandedUrl(displaySrc)} alt={alt} className={className} />;
  }

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setShowMedia(true)}>
        <img src={toBrandedUrl(displaySrc)} alt={alt} className={`${className} ring-2 ring-primary/30 ring-offset-2 rounded-sm`} />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-sm">
          <div className="bg-popover text-foreground px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium shadow-lg">
            <ImagePlus className="w-4 h-4" /> Change Image
          </div>
        </div>
      </div>
      <MediaLibraryModal open={showMedia} onOpenChange={setShowMedia} onSelect={handleSelect} />
    </>
  );
};

export default EditableImage;
