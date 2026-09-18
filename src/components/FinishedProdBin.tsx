import { Text, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";
import emptyBinPng from "../assets/output_bin.png";
import forwardedBinPng from "../assets/Forwarded_bin.png";
import type { FinishedProdBinProps } from "../types/uiComponentsProps.types";

export default function FinishedProdBin({ x, y, minX, minY, maxX, maxY, selected, binType, onSelect, onDragEnd }: FinishedProdBinProps) {
  const isForwarded = binType === "forwarded";
  const [image] = useImage(isForwarded ? forwardedBinPng : emptyBinPng);

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
        text={isForwarded ? "FORWARDED BIN" : "EMPTY BIN"}
        fill="#111"
        fontSize={12}
        fontStyle="bold"
      />
    </>
  );
}
