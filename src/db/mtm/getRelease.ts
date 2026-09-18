import { query } from "../mtmDatabase";

export async function getRelease() {
  const rows = await query(`
    SELECT *
    FROM mtm_release
    WHERE code = 'RL1'
    LIMIT 1
  `);

  if (!rows[0]) {
    return {
      code: "RL1",
      tmu: 0,
    };
  }

  return {
    code: String(rows[0].code),
    tmu: Number(rows[0].tmu),
  };
}