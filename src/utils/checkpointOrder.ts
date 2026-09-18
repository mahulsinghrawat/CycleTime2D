export function checkpointOrder(label: string): number {
  const match = label.match(/(\d+)$/);
  return match ? parseInt(match[1], 10) : 0;
}

// Renaming a node's checkpoint number (e.g. LH1 -> LH4) re-labels it AND
// every node after it in the sequence to stay consecutive (LH5, LH6, ...) —
// so the Motion Sequence table's ordering, which reads straight off these
// numbers, always stays gapless. Returns null when the input isn't a valid
// number greater than the previous node's own number, so the caller can
// leave the existing labels untouched instead of creating a reversed/tied
// sequence.
export function renumberFromRename<T extends { id: string; label: string }>(
  items: T[],
  id: string,
  newNumberInput: string,
  prefix: string,
): T[] | null {
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const newNum = checkpointOrder(newNumberInput);
  if (!Number.isInteger(newNum) || newNum < 1) return null;

  const prevNum = index > 0 ? checkpointOrder(items[index - 1].label) : 0;
  if (newNum <= prevNum) return null;

  const next = [...items];
  let n = newNum;
  for (let i = index; i < next.length; i++) {
    next[i] = { ...next[i], label: `${prefix}${n}` };
    n += 1;
  }
  return next;
}
