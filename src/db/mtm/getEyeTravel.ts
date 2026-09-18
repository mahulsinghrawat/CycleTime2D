// Eye Travel Time, MTM-1 formula: ET = 15.2 * (distance between the two
// travel points / perpendicular distance from the eye to the line of
// travel), capped at 20 TMU. This app labels those two inputs 'D' and 'T'
// respectively (matching the properties panel), which is the reverse of the
// standard's own T/D lettering — the quantities are the same, just relabeled.
export function getEyeTravel(distanceBetweenPoints: number, eyeToLineDistance: number) {
  const safeEyeToLineDistance = eyeToLineDistance > 0 ? eyeToLineDistance : 1;
  const tmu = Math.min(15.2 * (distanceBetweenPoints / safeEyeToLineDistance), 20);

  return {
    code: "ET",
    tmu,
  };
}
