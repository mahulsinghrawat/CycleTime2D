import { query } from "../mtmDatabase";

export async function getTransferGrasp() {
  const rows = await query(`
    SELECT *
    FROM mtm_grasp
    WHERE code = 'G3'
    LIMIT 1
  `);

  if (!rows[0]) {
    return {
      code: "G3",
      tmu: 0,
    };
  }

  return {
    code: String(rows[0].code),
    tmu: Number(rows[0].tmu),
  };
}
