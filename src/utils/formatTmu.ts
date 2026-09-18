// Rounds to at most 2 decimal places and drops trailing zeros, so 16.80
// displays as 16.8 and 16.00 displays as 16, instead of always padding to
// a fixed 2 decimals.
export function formatTmu(value: number): string {
  return Number(value.toFixed(2)).toString();
}
