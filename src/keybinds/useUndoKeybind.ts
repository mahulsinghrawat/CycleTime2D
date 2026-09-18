import { useEffect } from "react";

type Options = {
  enabled?: boolean;
};

export function useUndoKeybind(onUndo: () => void, options: Options = {}) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const isUndoCombo = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z";
      if (!isUndoCombo || event.shiftKey) return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName;
      const isTypingTarget =
        target?.isContentEditable ||
        tagName === "INPUT" ||
        tagName === "TEXTAREA" ||
        tagName === "SELECT";

      if (isTypingTarget) return;

      event.preventDefault();
      onUndo();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onUndo]);
}
