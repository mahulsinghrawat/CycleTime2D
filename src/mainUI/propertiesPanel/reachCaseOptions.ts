export type ReachCase = "A" | "B" | "C" | "D" | "E";

export const REACH_CASE_OPTIONS: { value: ReachCase; label: string }[] = [
  { value: "A", label: "Fixed location or object in other hand" },
  { value: "B", label: "Single object, slight variation" },
  { value: "C", label: "Jumbled with others, search & select" },
  { value: "D", label: "Very small object, accurate grasp" },
  { value: "E", label: "Indefinite location, body balance / next motion" },
];
