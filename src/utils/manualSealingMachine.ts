// The source artwork is ~2560x2559 (effectively square) — sized down to a
// smaller on-canvas footprint while keeping that ratio.
export const MANUAL_SEALING_MACHINE_WIDTH = 96;
export const MANUAL_SEALING_MACHINE_HEIGHT = Math.round(
  (MANUAL_SEALING_MACHINE_WIDTH * 2559) / 2560,
);
