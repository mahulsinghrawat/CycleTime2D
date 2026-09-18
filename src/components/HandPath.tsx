import { Fragment } from "react";
import { Arrow, Circle, Line, Text } from "react-konva";
import type { HandPathProps } from "../types/uiComponentsProps.types";
import { HAND_NODE_RADIUS as NODE_RADIUS, NODE_OVERLAP_COLOR } from "../utils/nodeOverlap";
import { checkpointOrder } from "../utils/checkpointOrder";

// Pull the arrow's tip back off the target node's center so the arrowhead
// stays visible instead of disappearing under the circle drawn on top of it.
function shortenTowards(
  from: { x: number; y: number },
  to: { x: number; y: number },
  distance: number,
) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  return {
    x: to.x - (dx / length) * distance,
    y: to.y - (dy / length) * distance,
  };
}

export default function HandPath({
  nodes,
  color,
  isDrawing,
  previewPoint,
  selectedId,
  overlappingIds,
  minX,
  minY,
  maxX,
  maxY,
  onSelectNode,
  onNodeDragEnd,
  onResumeDrawing,
}: HandPathProps) {
  const lastNode = nodes[nodes.length - 1];

  return (
    <>
      {nodes.slice(0, -1).map((node, i) => {
        const next = nodes[i + 1];
        const tip = shortenTowards(node, next, NODE_RADIUS + 2);
        return (
          <Arrow
            key={`segment-${node.id}-${next.id}`}
            points={[node.x, node.y, tip.x, tip.y]}
            stroke={color}
            fill={color}
            strokeWidth={2}
            pointerLength={8}
            pointerWidth={7}
          />
        );
      })}

      {isDrawing && lastNode && previewPoint && (
        <Line
          points={[lastNode.x, lastNode.y, previewPoint.x, previewPoint.y]}
          stroke={color}
          strokeWidth={2}
          dash={[6, 4]}
        />
      )}

      {nodes.map((node) => {
        const isOverlapping = overlappingIds?.has(node.id) ?? false;
        return (
          <Fragment key={node.id}>
            <Circle
              x={node.x}
              y={node.y}
              radius={NODE_RADIUS}
              fill={isOverlapping ? NODE_OVERLAP_COLOR : color}
              stroke={selectedId === node.id ? "#f59e0b" : "#111"}
              strokeWidth={selectedId === node.id ? 3 : 1}
              listening={!isDrawing}
              draggable={!isDrawing}
              dragBoundFunc={(pos) => ({
                x: Math.max(minX, Math.min(pos.x, maxX)),
                y: Math.max(minY, Math.min(pos.y, maxY)),
              })}
              onClick={() => onSelectNode(node.id)}
              onTap={() => onSelectNode(node.id)}
              onDragEnd={(e) => onNodeDragEnd(node.id, e.target.x(), e.target.y())}
              onDblClick={() => {
                if (!isDrawing && node.id === lastNode?.id) onResumeDrawing();
              }}
              onDblTap={() => {
                if (!isDrawing && node.id === lastNode?.id) onResumeDrawing();
              }}
            />
            <Text
              x={node.x - NODE_RADIUS}
              y={node.y - 5}
              width={NODE_RADIUS * 2}
              align="center"
              text={String(checkpointOrder(node.label))}
              fontSize={9}
              fontStyle="bold"
              fill="#fff"
              listening={false}
            />
          </Fragment>
        );
      })}
    </>
  );
}
