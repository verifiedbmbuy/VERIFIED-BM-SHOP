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
  const blurTimeoutRef = useRef<number | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPos, setToolbarPos] = useState({ top: 0, left: 0 });

  const updateToolbarPosition = useCallback(() => {
    if (!ref.current) return;

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
      const rangeRect = selection.getRangeAt(0).getBoundingClientRect();
      setToolbarPos({
        top: Math.max(12, rangeRect.top - 44),
        left: rangeRect.left + rangeRect.width / 2,
      });
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    setToolbarPos({
      top: Math.max(12, rect.top - 44),
      left: rect.left + rect.width / 2,
    });
  }, []);

  const displayValue = pendingChanges[fieldKey] ?? (value || fallback);

  const syncCurrentValue = useCallback(() => {
    if (!ref.current) return;
    const newValue = richText ? ref.current.innerHTML : ref.current.textContent || "";
    updateField(fieldKey, newValue);
  }, [fieldKey, updateField, richText]);

  const handleInput = useCallback(() => {
    syncCurrentValue();
  }, [syncCurrentValue]);

  const handleFocus = useCallback(() => {
    if (blurTimeoutRef.current) {
      window.clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    updateToolbarPosition();
    setShowToolbar(true);
  }, [updateToolbarPosition]);

  const handleSelection = useCallback(() => {
    window.requestAnimationFrame(() => {
      updateToolbarPosition();
      setShowToolbar(true);
    });
  }, [updateToolbarPosition]);

  const handleKeyUp = useCallback(() => {
    handleInput();
    handleSelection();
  }, [handleInput, handleSelection]);

  const handleBlur = useCallback(() => {
    syncCurrentValue();
    // Delay to allow toolbar clicks
    blurTimeoutRef.current = window.setTimeout(() => setShowToolbar(false), 240);
  }, [syncCurrentValue]);

  useEffect(() => {
    if (!isEditMode || !ref.current) return;

    const handleSelectionChange = () => {
      const el = ref.current;
      if (!el) return;

      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      const anchorInTarget = selection.anchorNode ? el.contains(selection.anchorNode) : false;
      const focusInTarget = selection.focusNode ? el.contains(selection.focusNode) : false;
      if (!anchorInTarget && !focusInTarget) return;

      updateToolbarPosition();
      setShowToolbar(true);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [isEditMode, updateToolbarPosition]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        window.clearTimeout(blurTimeoutRef.current);
      }
    };
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
        onKeyUp={handleKeyUp}
        onPaste={handleInput}
        onMouseUp={handleSelection}
        onFocus={handleFocus}
        onBlur={handleBlur}
        data-editable-field={fieldKey}
        data-managed-editable="true"
        title="Click and type to edit"
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
