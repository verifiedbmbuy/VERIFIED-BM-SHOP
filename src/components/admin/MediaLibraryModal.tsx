import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import MediaLibrary, { type MediaFile } from "@/components/admin/MediaLibrary";

interface MediaLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: MediaFile) => void;
  uploadPathPrefix?: string;
}

const MediaLibraryModal = ({ open, onOpenChange, onSelect, uploadPathPrefix }: MediaLibraryModalProps) => {
  const handleSelect = (file: MediaFile) => {
    onSelect(file);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto">
          <MediaLibrary mode="modal" onSelect={handleSelect} uploadPathPrefix={uploadPathPrefix} />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MediaLibraryModal;
