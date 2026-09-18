import { useEffect } from "react";

type Options = {
  canUndo: boolean;
  onUndo: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
};

export function useCanvasMenuActions({
  canUndo,
  onUndo,
  zoomIn,
  zoomOut,
  resetZoom,
}: Options) {
  useEffect(() => {
    const handleMenuUndo = () => {
      if (!canUndo) return;
      onUndo();
    };

    window.addEventListener("app:canvas-undo", handleMenuUndo);
    window.addEventListener("app:canvas-zoom-in", zoomIn);
    window.addEventListener("app:canvas-zoom-out", zoomOut);
    window.addEventListener("app:canvas-zoom-reset", resetZoom);

    return () => {
      window.removeEventListener("app:canvas-undo", handleMenuUndo);
      window.removeEventListener("app:canvas-zoom-in", zoomIn);
      window.removeEventListener("app:canvas-zoom-out", zoomOut);
      window.removeEventListener("app:canvas-zoom-reset", resetZoom);
    };
  }, [canUndo, onUndo, zoomIn, zoomOut, resetZoom]);
}
