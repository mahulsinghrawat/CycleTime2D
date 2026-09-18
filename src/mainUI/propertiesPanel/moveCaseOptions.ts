export type MoveCase = "A" | "B" | "C";

export const MOVE_CASE_OPTIONS: { value: MoveCase; label: string }[] = [
  { value: "A", label: "To other hand or against stop" },
  { value: "B", label: "To approximate location (clearance > 25 mm)" },
  { value: "C", label: "To exact location (clearance 12–25 mm)" },
];
