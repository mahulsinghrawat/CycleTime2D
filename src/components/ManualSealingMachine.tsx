import { Text, Image as KonvaImage, Rect } from "react-konva";
import useImage from "use-image";
import manualSealingMachinePng from "../assets/manual_sealing_machine.png";
import type { ManualSealingMachineProps } from "../types/uiComponentsProps.types";
import {
  MANUAL_SEALING_MACHINE_WIDTH,
  MANUAL_SEALING_MACHINE_HEIGHT,
} from "../utils/manualSealingMachine";

export default function ManualSealingMachine({
  x,
  y,
  minX,
  minY,
  maxX,
  maxY,
  selected,
  onSelect,
  onDragEnd,
}: ManualSealingMachineProps) {
  const [image] = useImage(manualSealingMachinePng);

  return (
    <>
      <KonvaImage
        x={x}
        y={y}
        width={MANUAL_SEALING_MACHINE_WIDTH}
        height={MANUAL_SEALING_MACHINE_HEIGHT}
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
          width={MANUAL_SEALING_MACHINE_WIDTH - 8}
          height={MANUAL_SEALING_MACHINE_HEIGHT - 8}
          stroke="#f59e0b"
          strokeWidth={2}
          listening={false}
        />
      )}

      <Text
        x={x - 10}
        y={y + MANUAL_SEALING_MACHINE_HEIGHT + 5}
        width={MANUAL_SEALING_MACHINE_WIDTH + 20}
        align="center"
        text="Manual Sealing Machine"
        fill="#111"
        fontSize={14}
        fontStyle="bold"
      />
    </>
  );
}
