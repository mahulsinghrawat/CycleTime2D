import { query } from "../mtmDatabase";

// MTM-1 Move cases: A = to the other hand or against a stop, B = to an
// approximate location (clearance > 25 mm), C = to an exact location
// (clearance 12–25 mm).
export type MoveCase = "A" | "B" | "C";

export async function getMove(distance: number, moveCase: MoveCase = "B") {
  let rows = await query(
    `
    SELECT *
    FROM mtm_move
    WHERE CAST(motion_length_cm AS REAL) >= ?
    ORDER BY CAST(motion_length_cm AS REAL) ASC
    LIMIT 1
    `,
    [distance]
  );

  // No row covers this distance — the MTM-1 Move table tops out at 80 cm, so
  // anything past that falls back to the largest bucket's TMU with no real
  // value behind it. Flagged so the caller can warn instead of silently
  // under-costing a move that's actually longer than the table supports.
  const exceedsLimit = !rows[0];

  if (exceedsLimit) {
    rows = await query(`
      SELECT *
      FROM mtm_move
      ORDER BY CAST(motion_length_cm AS REAL) DESC
      LIMIT 1
    `);
  }

  const tmuByCase: Record<MoveCase, number> = {
    A: Number(rows[0].m_a),
    B: Number(rows[0].m_b_value),
    C: Number(rows[0].m_c),
  };

  return {
    code: `M${rows[0].motion_length_cm}${moveCase}`,
    tmu: tmuByCase[moveCase],
    exceedsLimit,
  };
}
