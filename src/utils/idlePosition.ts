// Must match the circle actually drawn on canvas (see WORKER_RADIUS in
// WorkSpaceCanvas.tsx) — any gap between the drawn radius and this one
// creates a "dead zone" where a node looks like it's safely inside the
// idle circle but every distance/snap check here still treats it as a
// normal, un-snapped point, so its computed cm keeps drifting as it's
// dragged around in that gap.
export const IDLE_POSITION_RADIUS = 75;
