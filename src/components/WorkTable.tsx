import { Rect, Text } from "react-konva";
import type { WorkTableProps } from "../types/uiComponentsProps.types";

export default function WorkTable({
  x,
  y,
  width,
  height,
  widthCm,
  heightCm, 
  selected,
  onSelect,
}: WorkTableProps) {
  return (
    <>
      <Rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#ffffff"
        stroke={selected ? "#f59e0b" : "#111827"}
        strokeWidth={selected ? 5 : 3}
        cornerRadius={8}
        onClick={onSelect}
        onTap={onSelect}
      />

      <Text
        x={x + 20}
        y={y + 15}
        text={`Table: ${widthCm}cm × ${heightCm}cm`}
        fill="#333"
        fontSize={16}
      />
    </>
  );
}