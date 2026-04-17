import { useRef, useState, useCallback, useEffect } from "react";
import { useEditMode } from "@/contexts/EditModeContext";
import FloatingToolbar from "./FloatingToolbar";

interface EditableTextProps {
  fieldKey: string;
  value: string;
  fallback?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  className?: string;
  richText?: boolean;
}

const EditableText = ({ fieldKey, value, fallback = "", as: Tag = "p", className = "", richText = false }: EditableTextProps) => {
  const { isEditMode, pendingChanges, updateField } = useEditMode();
  const ref = useRef<HTMLElement>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

  const displayValue = pendingChanges[fieldKey] ?? (value || fallback);

  const handleInput = useCallback(() => {
    if (!ref.current) return;
    const newValue = richText ? ref.current.innerHTML : ref.current.textContent || "";
    updateField(fieldKey, newValue);
  }, [fieldKey, updateField, richText]);

  const handleFocus = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setToolbarPos({ top: rect.top - 48, left: rect.left + rect.width / 2 });
    setShowToolbar(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Delay to allow toolbar clicks
    setTimeout(() => setShowToolbar(false), 200);
  }, []);

  // Sync external changes
  useEffect(() => {
    if (ref.current && !isEditMode) {
      if (richText) {
        ref.current.innerHTML = displayValue;
      } else {
        ref.current.textContent = displayValue;
      }
    }
  }, [displayValue, isEditMode, richText]);

  if (!isEditMode) {
    if (richText && displayValue) {
      return <Tag className={className} dangerouslySetInnerHTML={{ __html: displayValue }} />;
    }
    return <Tag className={className}>{displayValue}</Tag>;
  }

  return (
    <>
      <Tag
        ref={ref as any}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        className={`${className} outline-none border-2 border-dashed border-transparent focus:border-blue-500 hover:border-blue-300 rounded-sm cursor-text transition-all`}
        dangerouslySetInnerHTML={richText ? { __html: displayValue } : undefined}
      >
        {!richText ? displayValue : undefined}
      </Tag>
      {showToolbar && <FloatingToolbar position={toolbarPos} targetRef={ref} />}
    </>
  );
};

export default EditableText;
