import { useEffect } from "react";

type Options = {
  enabled?: boolean;
};

export function useCancelDrawKeybind(onCancel: () => void, options: Options = {}) {
  const { enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      onCancel();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, onCancel]);
}
