import { query } from "../mtmDatabase";

export async function getGrasp(
  size: number,
  partlayout: "Circular" | "Cuboid" | "Flat",
  arrangement: "Single" | "Loose" | "Stacked" | "Contact"
) {
  let code: string;

  if (arrangement === "Contact") {
    code = "G5";
  } else if (arrangement === "Stacked") {
    code = "G1B";
  } else if (arrangement === "Loose") {
    if (size > 25) code = "G4A";
    else if (size >= 6) code = "G4B";
    else code = "G4C";
  } else {
    // Single
    if (partlayout === "Circular") {
      if (size > 25) code = "G1C1";
      else if (size >= 6) code = "G1C2";
      else code = "G1C3";
    } else if (partlayout === "Flat") {
      code = "G1B";
    } else {
      code = "G1A";
    }
  }

  const rows = await query(
    `
    SELECT *
    FROM mtm_grasp
    WHERE code = ?
    LIMIT 1
    `,
    [code]
  );

  if (!rows[0]) {
    return { code, tmu: 0 };
  }

  return {
    code: String(rows[0].code),
    tmu: Number(rows[0].tmu),
  };
}
