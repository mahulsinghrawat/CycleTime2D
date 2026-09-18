export function parseTableSize(
  tableDraft: { widthCm: string; lengthCm: string },
): { table: { widthCm: number; lengthCm: number } } | { error: string } {
  const width = Number(tableDraft.widthCm);
  const length = Number(tableDraft.lengthCm);

  if (!length || length < 100) {
    return { error: "Not ergonomically viable — increase the dimensions." };
  }

  if (!width || width < 75) {
    return { error: "Not ergonomically viable — increase the dimensions." };
  }

  if (length > 200) {
    return { error: "Max table length is 200 cm" };
  }

  if (width > 100) {
    return { error: "Max table width is 100 cm" };
  }

  return { table: { widthCm: width, lengthCm: length } };
}

export function saveTableSize(tableDraft: { widthCm: string; lengthCm: string }, setTableError: (error: string) => void, setTable: (table: { widthCm: number; lengthCm: number }) => void) {
  const result = parseTableSize(tableDraft);

  if ("error" in result) {
    setTableError(result.error);
    return;
  }

  setTableError("");
  setTable(result.table);
}