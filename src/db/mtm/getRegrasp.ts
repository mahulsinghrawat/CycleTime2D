import { query } from "../mtmDatabase";

export async function getRegrasp() {
  const rows = await query(`
    SELECT *
    FROM mtm_grasp
    WHERE code = 'G2'
    LIMIT 1
  `);

  if (!rows[0]) {
    return {
      code: "G2",
      tmu: 0,
    };
  }

  return {
    code: String(rows[0].code),
    tmu: Number(rows[0].tmu),
  };
}
