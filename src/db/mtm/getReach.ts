import { query } from "../mtmDatabase";

// MTM-1 Reach cases: A = to a fixed location or object in the other hand,
// B = to a single object whose location varies slightly cycle to cycle,
// C = to an object jumbled with others (search + select), D = to a very
// small object requiring an accurate grasp, E = to an indefinite location
// for body balance or the next motion. C and D share one TMU column in the
// standard table (the seed data reflects that).
export type ReachCase = "A" | "B" | "C" | "D" | "E";

export async function getReach(distance: number, reachCase: ReachCase = "B") {
  let rows = await query(
    `
    SELECT *
    FROM mtm_reach
    WHERE CAST(motion_length_cm AS REAL) >= ?
    ORDER BY CAST(motion_length_cm AS REAL) ASC
    LIMIT 1
    `,
    [distance]
  );

  // No row covers this distance — the MTM-1 Reach table tops out at 80 cm,
  // so anything past that falls back to the largest bucket's TMU with no
  // real value behind it. Flagged so the caller can warn instead of
  // silently under-costing a reach that's actually longer than the table
  // supports.
  const exceedsLimit = !rows[0];

  if (exceedsLimit) {
    rows = await query(`
      SELECT *
      FROM mtm_reach
      ORDER BY CAST(motion_length_cm AS REAL) DESC
      LIMIT 1
    `);
  }

  const row = rows[0];

  const tmuByCase: Record<ReachCase, number> = {
    A: Number(row.r_a),
    B: Number(row.r_b),
    C: Number(row.r_c_r_d),
    D: Number(row.r_c_r_d),
    E: Number(row.r_e),
  };

  return {
    code: `R${row.motion_length_cm}${reachCase}`,
    tmu: tmuByCase[reachCase],
    exceedsLimit,
  };
}
