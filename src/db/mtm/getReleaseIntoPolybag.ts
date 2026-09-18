import { query } from "../mtmDatabase";

// Short "little adjustment" move (case B) to place a part already at the
// polybag's mouth inside it — always the 4cm bucket, not the measured
// distance, since the triggering nodes are overlapping (same spot).
export async function getReleaseIntoPolybag() {
  const rows = await query(`
    SELECT *
    FROM mtm_move
    WHERE motion_length_cm = '4'
    LIMIT 1
  `);

  if (!rows[0]) {
    return {
      code: "M4B",
      tmu: 0,
    };
  }

  return {
    code: "M4B",
    tmu: Number(rows[0].m_b_value),
  };
}
