import { query } from "../mtmDatabase";

// The free hand grasping the sealing machine's own handle is always a
// simple pick-up grasp, independent of whatever part/bin properties happen
// to be nearby — always G1A.
export async function getMachineHandleGrasp() {
  const rows = await query(`
    SELECT *
    FROM mtm_grasp
    WHERE code = 'G1A'
    LIMIT 1
  `);

  if (!rows[0]) {
    return {
      code: "G1A",
      tmu: 0,
    };
  }

  return {
    code: String(rows[0].code),
    tmu: Number(rows[0].tmu),
  };
}
