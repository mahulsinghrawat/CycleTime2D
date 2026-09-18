import { Circle, Text } from "react-konva";
import type { IdlePositionProps } from "../types/uiComponentsProps.types";

export default function IdlePosition({
  x,
  y,
  radius,
  minX,
  minY,
  maxX,
  maxY,
  selected,
  onSelect,
  onDragEnd,
}: IdlePositionProps) {
  return (
    <>
      <Circle
        x={x}
        y={y}
        radius={radius}
        fill="transparent"
        stroke={selected ? "#f59e0b" : "#2563eb"}
        strokeWidth={selected ? 3 : 3}
        dash={[2, 6]}
        lineCap="round"
        draggable
        onClick={onSelect}
        onTap={onSelect}
        dragBoundFunc={(pos) => ({
          x: Math.max(minX, Math.min(pos.x, maxX)),
          y: Math.max(minY, Math.min(pos.y, maxY)),
        })}
        onDragEnd={(e) => {
          onDragEnd(e.target.x(), e.target.y());
        }}
      />

      <Text
        x={x - 50}
        y={y + radius + 10}
        width={100}
        align="center"
        text="Idle Position"
        fill="#111"
        fontSize={14}
        fontStyle="bold"
      />
    </>
  );
}
