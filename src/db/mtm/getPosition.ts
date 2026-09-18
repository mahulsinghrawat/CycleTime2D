import { query } from "../mtmDatabase";

export async function getPosition() {
  const rows = await query(`
    SELECT *
    FROM mtm_position
    WHERE code = 'P1SSE'
    LIMIT 1
  `);

  if (!rows[0]) {
    return {
      code: "P1SSE",
      tmu: 0,
    };
  }

  return {
    code: String(rows[0].code),
    tmu: Number(rows[0].tmu),
  };
}
