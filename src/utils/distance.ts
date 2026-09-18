export function getTableDistanceCm(
  workerX: number,
  workerY: number,
  targetX: number,
  targetY: number,
  tableX: number,
  tableY: number,
  tableWidthPx: number,
  tableHeightPx: number,
  tableWidthCm: number,
  tableHeightCm: number
) {
  const workerCmX = ((workerX - tableX) / tableWidthPx) * tableWidthCm;
  const workerCmY = ((workerY - tableY) / tableHeightPx) * tableHeightCm;

  const targetCmX = ((targetX - tableX) / tableWidthPx) * tableWidthCm;
  const targetCmY = ((targetY - tableY) / tableHeightPx) * tableHeightCm;

  return Math.round(
    Math.sqrt((targetCmX - workerCmX) ** 2 + (targetCmY - workerCmY) ** 2)
  );
}