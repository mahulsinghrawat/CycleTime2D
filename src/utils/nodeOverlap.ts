export const HAND_NODE_RADIUS = 7;
// Circles must physically touch — no extra slack. Transfer Grasp (and
// anything else keyed off node overlap) should only ever be offered when
// the two node circles actually meet on screen, nothing looser.
export const NODE_OVERLAP_THRESHOLD = HAND_NODE_RADIUS * 2;
export const NODE_OVERLAP_COLOR = "#dc2626";

// Two hand-path checkpoints count as "overlapping" once their circles visually touch.
export function arePointsOverlapping(
  a: { x: number; y: number },
  b: { x: number; y: number },
  threshold: number = NODE_OVERLAP_THRESHOLD,
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy) <= threshold;
}
