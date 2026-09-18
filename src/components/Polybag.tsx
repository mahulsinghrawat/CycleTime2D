import { Text, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";
import PolybagPng from "../assets/poly.png";
import type { PolybagProps } from "../types/uiComponentsProps.types";

export default function Polybag({
  x,
  y,
  id,
  label,
  minX,
  minY,
  maxX,
  maxY,
  selected,
  onSelect,
  onDragEnd,
}: PolybagProps) {
  const [image] = useImage(PolybagPng);

  return (
    <>
      <KonvaImage
        x={x}
        y={y}
        width={100}
        height={75}
        image={image}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        dragBoundFunc={(pos) => ({
          x: Math.max(minX, Math.min(pos.x, maxX)),
          y: Math.max(minY, Math.min(pos.y, maxY)),
        })}
        onDragEnd={(e) => onDragEnd(e.target.x(), e.target.y())}
      />

      {selected && (
        <Rect
          x={x + 12}
          y={y + 9}
          width={76}
          height={57}
          stroke="#f59e0b"
          strokeWidth={2}
          listening={false}
        />
      )}

      <Text
        x={x}
        y={y + 80}
        width={100}
        align="center"
        text={label || id}
        fill="#111"
        fontSize={14}
        fontStyle="bold"
        onClick={onSelect}
        onTap={onSelect}
      />
    </>
  );
}
