import type { TableLayout, TableSize } from "../types/components.types";

const PX_PER_CM = 6;

export function getTableLayout(
  canvasWidth: number,
  canvasHeight: number,
  table: TableSize
): TableLayout {
  const width = table.lengthCm * PX_PER_CM;
  const height = table.widthCm * PX_PER_CM;

  return {
    x: Math.max((canvasWidth - width) / 2, 0),
    y: Math.max((canvasHeight - height) / 2, 0),
    width,
    height,
  };
}