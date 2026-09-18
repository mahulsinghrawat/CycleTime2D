import type { GridLines } from "../types/propsUI.types";

export const GRID_SIZE = 25;
export const GRID_STROKE = "#cae2ff";
export const GRID_STROKE_WIDTH = 1;
export const TABLE_GRID_STROKE = "#ffc7c7";
export const TABLE_GRID_STROKE_WIDTH = 1;

export function getGridLines(
  canvasWidth: number,
  canvasHeight: number,
  gridSize: number = GRID_SIZE,
): GridLines {
  const vertical = Array.from(
    { length: Math.floor(canvasWidth / gridSize) + 1 },
    (_, i) => i * gridSize,
  );

  const horizontal = Array.from(
    { length: Math.floor(canvasHeight / gridSize) + 1 },
    (_, i) => i * gridSize,
  );

  return { vertical, horizontal };
}