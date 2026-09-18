import { query } from "../mtmDatabase";

export async function getEyeFocus() {
  const rows = await query(`
    SELECT *
    FROM mtm_eye_focus
    WHERE code = 'EF'
    LIMIT 1
  `);

  if (!rows[0]) {
    return {
      code: "EF",
      tmu: 0,
    };
  }

  return {
    code: String(rows[0].code),
    tmu: Number(rows[0].tmu),
  };
}
