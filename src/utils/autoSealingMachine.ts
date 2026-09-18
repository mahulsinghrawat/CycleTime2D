// The source artwork is 761x358 (native aspect ratio) — sized down to a
// smaller on-canvas footprint while keeping that same ratio, so it never
// gets squashed into a square like a forced 100x100 would do.
export const AUTO_SEALING_MACHINE_WIDTH = 96;
export const AUTO_SEALING_MACHINE_HEIGHT = Math.round(
  (AUTO_SEALING_MACHINE_WIDTH * 358) / 761,
);
