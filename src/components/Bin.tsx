import { Text, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";
import type { BinProps } from "../types/uiComponentsProps.types";
import binPng from "../assets/bin.png";
import bin1Png from "../assets/bin_1.png";
import bin2Png from "../assets/bin_2.png";

const BIN_IMAGES = [binPng, bin1Png, bin2Png];

// Picks one of the bin art variants per instance, stable for that bin's
// lifetime since it's derived from its id, rather than re-randomizing (and
// visibly flickering) on every re-render.
function pickBinImage(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return BIN_IMAGES[Math.abs(hash) % BIN_IMAGES.length];
}

export default function Bin({
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
}: BinProps) {
  const [image] = useImage(pickBinImage(id));

  return (
    <>
      <KonvaImage
        x={x}
        y={y}
        width={100}
        height={100}
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
          y={y + 12}
          width={76}
          height={76}
          stroke="#f59e0b"
          strokeWidth={2}
          listening={false}
        />
      )}

      <Text
        x={x}
        y={y + 105}
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
