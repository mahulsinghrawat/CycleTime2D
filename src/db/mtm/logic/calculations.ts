import { getMove, type MoveCase } from "../getMove";
import { getRelease } from "../getRelease";
import { getGrasp } from "../getGrasp";
import { getRegrasp } from "../getRegrasp";
import { getEyeFocus } from "../getEyeFocus";
import { getEyeTravel } from "../getEyeTravel";
import type { EyeTravelSettings } from "../../../types/components.types";

export async function calculateTMU(
  moveDistance: number,
  size: number,
  partlayout: "Circular" | "Cuboid" | "Flat",
  quantity: number,
  arrangement: "Single" | "Loose" | "Stacked" | "Contact",
  releasePart: boolean = false,
  moveDescription: string = "Move",
  includeMove: boolean = true,
  eyeTravel: EyeTravelSettings | null = null,
  includeEyeFocus: boolean = false,
  moveCase: MoveCase = "B",
  isPolybag: boolean = false,
) {
  const motions = [];
  const qty = Math.max(1, quantity);

  // Picking multiple parts from the same bin visit is one Grasp and one
  // Regrasp, each scaled by quantity — not a separate short reach + pair
  // repeated per part, since the hand never actually leaves the bin between
  // picks.
  const grasp = await getGrasp(size, partlayout, arrangement);

  motions.push({
    motion: "Grasp",
    code: grasp.code,
    baseTmu: grasp.tmu,
    multiplier: 1,
    quantity: qty,
    tmu: grasp.tmu * qty,
    shortDescription: "Grasp",
  });

  // A polybag picked up on its own (quantity 1) doesn't need a regrasp —
  // only repeated picks from the same spot, or a bin, do.
  if (!isPolybag || qty > 1) {
    const regrasp = await getRegrasp();

    motions.push({
      motion: "Regrasp",
      code: regrasp.code,
      baseTmu: regrasp.tmu,
      multiplier: 1,
      quantity: qty,
      tmu: regrasp.tmu * qty,
      shortDescription: "Regrasp",
    });
  }

  if (includeEyeFocus) {
    const eyeFocus = await getEyeFocus();

    motions.push({
      motion: "Eye Focus",
      code: eyeFocus.code,
      baseTmu: eyeFocus.tmu,
      multiplier: 1,
      // Eye Focus happens once per bin visit, not once per part picked.
      quantity: 1,
      tmu: eyeFocus.tmu,
      shortDescription: "Eye Focus",
    });
  }

  if (eyeTravel) {
    const eyeTravelResult = getEyeTravel(eyeTravel.distanceBetweenPoints, eyeTravel.eyeToLineDistance);
    const multiplier = Math.max(1, eyeTravel.occurrences);

    motions.push({
      motion: "Eye Travel",
      code: eyeTravelResult.code,
      baseTmu: eyeTravelResult.tmu,
      multiplier,
      tmu: eyeTravelResult.tmu * multiplier,
      shortDescription: "Eye Travel",
    });
  }

  if (includeMove) {
    const move = await getMove(moveDistance, moveCase);

    motions.push({
      motion: "Move",
      code: move.code,
      baseTmu: move.tmu,
      multiplier: 1,
      tmu: move.tmu,
      shortDescription: moveDescription,
      // Flagged when moveDistance is past the MTM-1 table's 80 cm ceiling —
      // read by the caller to raise a distance warning, not rendered.
      exceedsLimit: move.exceedsLimit,
    });
  }

  if (releasePart) {
    const release = await getRelease();

    motions.push({
      motion: "Release",
      code: release.code,
      baseTmu: release.tmu,
      multiplier: 1,
      quantity,
      tmu: release.tmu * quantity,
      shortDescription: "Release",
    });
  }

  return motions;
}
