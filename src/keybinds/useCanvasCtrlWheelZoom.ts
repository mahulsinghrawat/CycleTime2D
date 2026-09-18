import { useEffect } from "react";
import type React from "react";

type Options = {
  minZoom?: number;
  maxZoom?: number;
  step?: number;
  enabled?: boolean;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function useCanvasCtrlWheelZoom(
  containerRef: React.RefObject<HTMLDivElement | null>,
  setZoom: React.Dispatch<React.SetStateAction<number>>,
  options: Options = {},
) {
  const { minZoom = 0.4, maxZoom = 2, step = 0.1, enabled = true } = options;

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;

      event.preventDefault();

      setZoom((currentZoom) => {
        const delta = event.deltaY < 0 ? step : -step;
        return clamp(currentZoom + delta, minZoom, maxZoom);
      });
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
    };
  }, [containerRef, enabled, maxZoom, minZoom, setZoom, step]);
}
