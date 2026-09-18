import { Text, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";
import autoSealingMachinePng from "../assets/auto_sealing_machine.png";
import type { AutoSealingMachineProps } from "../types/uiComponentsProps.types";
import {
  AUTO_SEALING_MACHINE_WIDTH,
  AUTO_SEALING_MACHINE_HEIGHT,
} from "../utils/autoSealingMachine";

export default function AutoSealingMachine({
  x,
  y,
  minX,
  minY,
  maxX,
  maxY,
  selected,
  onSelect,
  onDragEnd,
}: AutoSealingMachineProps) {
  const [image] = useImage(autoSealingMachinePng);

  return (
    <>
      <KonvaImage
        x={x}
        y={y}
        width={AUTO_SEALING_MACHINE_WIDTH}
        height={AUTO_SEALING_MACHINE_HEIGHT}
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
          x={x + 4}
          y={y + 4}
          width={AUTO_SEALING_MACHINE_WIDTH - 8}
          height={AUTO_SEALING_MACHINE_HEIGHT - 8}
          stroke="#f59e0b"
          strokeWidth={2}
          listening={false}
        />
      )}

      <Text
        x={x - 10}
        y={y + AUTO_SEALING_MACHINE_HEIGHT + 5}
        width={AUTO_SEALING_MACHINE_WIDTH + 20}
        align="center"
        text="Auto Sealing Machine"
        fill="#111"
        fontSize={14}
        fontStyle="bold"
      />
    </>
  );
}
