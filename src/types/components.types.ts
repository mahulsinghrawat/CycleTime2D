export type BinType = {
  id: string;
  xPercent: number;
  yPercent: number;
  part: string;
  size: number;
  partlayout: "Circular" | "Cuboid" | "Flat";
  assignedHand: "left" | "right";
  quantity: number;
  imageType?: string;
  imageUrl?: string;
  arrangement?: "Loose" | "Stacked" | "Single" | "Contact";
};

export type TableSize = {
  widthCm: number;
  lengthCm: number;
};

export type WorkerPosition = {
  xPercent: number;
  yPercent: number;
};

export type Motion = {
  motion: string;
  code: string;
  baseTmu: number;
  // "Frequency" in the Motion Sequence table — how many times this motion
  // repeats for reasons other than part quantity (e.g. Eye Travel
  // occurrences). Quantity-driven repeats live in `quantity` instead, so the
  // table can show both columns; tmu is always baseTmu * quantity * multiplier.
  multiplier: number;
  // "Qty." in the Motion Sequence table — how many parts this motion covers
  // in one visit (Grasp/Regrasp/Release scale with bin quantity; Eye Focus
  // stays 1 regardless — one look per bin visit, not per part picked).
  // Defaults to 1 when absent.
  quantity?: number;
  tmu: number;
  description: string;
  shortDescription: string;
  simultaneous?: boolean;
  // Ties motions together that must render on the same Motion Sequence row
  // despite belonging to different checkpoints (e.g. a polybag interaction
  // spanning two different-numbered LH/RH nodes) — each side still shows its
  // own true checkpoint in the Pos. column.
  linkId?: string;
  // False only for the Auto Sealing Machine's Seal Process when the
  // operator doesn't have to wait for it — the row still renders (grayed
  // out) so the sealing step is visible, but its TMU is left out of the
  // Total TMU / Cycle Time sum. Absent/true means it counts normally.
  countsTowardTotal?: boolean;
};

export type TableLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type LeftHandType = {
  id: string;
  xPercent: number;
  yPercent: number;
  label: string;
  transferGrasp?: boolean;
  simultaneous?: boolean;
  releasesPart?: boolean;
  reachCase?: "A" | "B" | "C" | "D" | "E";
  moveCase?: "A" | "B" | "C";
};

export type RightHandType = {
  id: string;
  xPercent: number;
  yPercent: number;
  label: string;
  transferGrasp?: boolean;
  simultaneous?: boolean;
  releasesPart?: boolean;
  reachCase?: "A" | "B" | "C" | "D" | "E";
  moveCase?: "A" | "B" | "C";
};

export type PolybagType = {
  id: string;
  xPercent: number;
  yPercent: number;
  label: string;
  part: string;
  size: number;
  partlayout: "Circular" | "Cuboid" | "Flat";
  arrangement?: "Loose" | "Stacked" | "Single" | "Contact";
  quantity: number;
};

export type EyeTravelSettings = {
  distanceBetweenPoints: number;
  eyeToLineDistance: number;
  occurrences: number;
};

export type FinishedBinType = "empty" | "forwarded";

// One placed instance of the "Bin" (empty) or "Forwarded Bin" tool — which
// array it lives in (see MainLayout's emptyBins/forwardedBins state) decides
// its type; multiple of either can coexist independently on the canvas.
export type FinishedBinInstance = {
  id: string;
  xPercent: number;
  yPercent: number;
};