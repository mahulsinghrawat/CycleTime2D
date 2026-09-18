import { useEffect, useState } from "react";

import type { BinType, PolybagType, Motion, TableSize, TableLayout, EyeTravelSettings } from "../../../types/components.types";

import { getTableDistanceCm } from "../../../utils/distance";
import { arePointsOverlapping } from "../../../utils/nodeOverlap";
import { calculateTMU } from "./calculations";
import { getTransferGrasp } from "../getTransferGrasp";
import { getRelease } from "../getRelease";
import { getReach } from "../getReach";
import { getMove } from "../getMove";
import { getRegrasp } from "../getRegrasp";
import { getPosition } from "../getPosition";
import { getReleaseIntoPolybag } from "../getReleaseIntoPolybag";
import { getMachineHandleGrasp } from "../getMachineHandleGrasp";
import { IDLE_POSITION_RADIUS } from "../../../utils/idlePosition";
import {
  AUTO_SEALING_MACHINE_WIDTH,
  AUTO_SEALING_MACHINE_HEIGHT,
} from "../../../utils/autoSealingMachine";
import {
  MANUAL_SEALING_MACHINE_WIDTH,
  MANUAL_SEALING_MACHINE_HEIGHT,
} from "../../../utils/manualSealingMachine";
import { calculateTotalTMU } from "../../../utils/motionGrouping";

type HandPoint = { x: number; y: number; label: string; side: "LEFT" | "RIGHT"; simultaneous?: boolean; releasesPart?: boolean; transferGrasp?: boolean; reachCase?: "A" | "B" | "C" | "D" | "E"; moveCase?: "A" | "B" | "C" };
type HandNodeInput = { id: string; x: number; y: number; label: string; transferGrasp?: boolean; simultaneous?: boolean; releasesPart?: boolean; reachCase?: "A" | "B" | "C" | "D" | "E"; moveCase?: "A" | "B" | "C" };

type Props = {
  bins: BinType[];
  polybags: PolybagType[];
  table: TableSize | null;
  tableLayout: TableLayout | null;
  leftHands: HandNodeInput[];
  rightHands: HandNodeInput[];
  idlePosition: { x: number; y: number } | null;
  eyeTravel: EyeTravelSettings | null;
  eyeFocusAdded: boolean;
  emptyBins: { x: number; y: number }[];
  forwardedBins: { id: string; x: number; y: number }[];
  autoSealingMachine: { x: number; y: number } | null;
  autoSealingMachineSealSeconds: number | null;
  autoSealingMachineOperatorWaits: boolean;
  manualSealingMachine: { x: number; y: number } | null;
  manualSealingMachineSealSeconds: number | null;
  manualSealingMachineWidestOpeningCm: number | null;
};

function nearestHand(hands: HandPoint[], binCx: number, binCy: number): HandPoint | null {
  if (hands.length === 0) return null;
  let best = hands[0];
  let bestDist = (hands[0].x - binCx) ** 2 + (hands[0].y - binCy) ** 2;
  for (let i = 1; i < hands.length; i++) {
    const d = (hands[i].x - binCx) ** 2 + (hands[i].y - binCy) ** 2;
    if (d < bestDist) { bestDist = d; best = hands[i]; }
  }
  return best;
}

function checkpointNum(label: string): number {
  const m = label.match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

function isPolybagKind(bin: BinType | PolybagType): boolean {
  return !("assignedHand" in bin);
}

// Shared rectangular hit-test for a hand's position against an element's
// footprint (bin, output box, sealing machine).
function isWithinBox(
  px: number,
  py: number,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
): boolean {
  return px >= boxX && px <= boxX + boxWidth && py >= boxY && py <= boxY + boxHeight;
}

// Id prefix for each Forwarded Bin instance's polybag stand-in — lets labels
// read "to forwarded bin" instead of "to polybag" while still using
// isPolybagKind(). Prefixed (not a single constant) since multiple Forwarded
// Bins can exist, each needing its own unique synthetic id.
const FORWARDED_BIN_ID_PREFIX = "__forwarded-bin__";

function polybagShortLabel(bin: BinType | PolybagType): string {
  return bin.id.startsWith(FORWARDED_BIN_ID_PREFIX) ? "to forwarded bin" : "to polybag";
}

type ActiveBin = {
  bin: BinType | PolybagType;
  hand: HandPoint;
  binCX: number;
  binCY: number;
};

type FreedCheckpoint = { num: number; x: number; y: number; label: string };

export function useMtmCalculations({
  bins,
  polybags,
  table,
  tableLayout,
  leftHands,
  rightHands,
  idlePosition,
  eyeTravel,
  eyeFocusAdded,
  emptyBins,
  forwardedBins,
  autoSealingMachine,
  autoSealingMachineSealSeconds,
  autoSealingMachineOperatorWaits,
  manualSealingMachine,
  manualSealingMachineSealSeconds,
  manualSealingMachineWidestOpeningCm,
}: Props) {
  const [motions, setMotions] = useState<Motion[]>([]);
  const [autoSealingMachineSealMissing, setAutoSealingMachineSealMissing] = useState(false);
  const [manualSealingMachineSetupMissing, setManualSealingMachineSetupMissing] = useState(false);
  // A Reach/Move past 80 cm has no real MTM-1 table value to draw from — see
  // getReach/getMove's exceedsLimit flag — so this collects one message per
  // occurrence instead of silently under-costing it.
  const [distanceWarnings, setDistanceWarnings] = useState<string[]>([]);

  const hasTable = Boolean(table && tableLayout);

  const tableHorizontalCm = table?.lengthCm ?? 0;
  const tableVerticalCm = table?.widthCm ?? 0;

  const tableX = tableLayout?.x ?? 0;
  const tableY = tableLayout?.y ?? 0;
  const tableWidthPx = tableLayout?.width ?? 0;
  const tableHeightPx = tableLayout?.height ?? 0;

  const leftHandsKey = JSON.stringify(leftHands);
  const rightHandsKey = JSON.stringify(rightHands);
  const idleKey = JSON.stringify(idlePosition);
  const eyeTravelKey = JSON.stringify(eyeTravel);
  const emptyBinsKey = JSON.stringify(emptyBins);
  const forwardedBinsKey = JSON.stringify(forwardedBins);
  const autoSealingMachineKey = JSON.stringify(autoSealingMachine);
  const manualSealingMachineKey = JSON.stringify(manualSealingMachine);

  // Depend on serialized keys, not array refs, so this doesn't rerun when
  // parent renders pass new array identities with unchanged values.
  useEffect(() => {
    let cancelled = false;

    async function runCalculations() {
      if (!hasTable || (leftHands.length === 0 && rightHands.length === 0)) {
        setMotions([]);
        setAutoSealingMachineSealMissing(false);
        setManualSealingMachineSetupMissing(false);
        setDistanceWarnings([]);
        return;
      }

      const BIN_SIZE = 100;
      const MAX_MTM_DISTANCE_CM = 80;

      // A Reach/Move whose measured distance is past the MTM-1 table's
      // 80 cm ceiling still gets a TMU (getReach/getMove fall back to the
      // largest bucket), but that number no longer reflects a real reading —
      // record it here instead of silently using it.
      const distanceWarningMessages: string[] = [];
      function noteIfExceedsLimit(
        result: { exceedsLimit: boolean },
        motionType: "Reach" | "Move",
        distance: number,
        checkpoint: string,
      ) {
        if (result.exceedsLimit) {
          distanceWarningMessages.push(
            `${motionType} exceeds the ${MAX_MTM_DISTANCE_CM} cm limit (${Math.round(distance)} cm) at ${checkpoint}`,
          );
        }
      }

      // Empty Bin stays a plain waypoint (bare Move) — every one placed.
      const outputBoxWaypoints = emptyBins;

      const leftHandsSide: HandPoint[] = leftHands.map((h) => ({ ...h, side: "LEFT" as const }));
      const rightHandsSide: HandPoint[] = rightHands.map((h) => ({ ...h, side: "RIGHT" as const }));

      function isInBin(hand: HandPoint | null, x: number, y: number): hand is HandPoint {
        return hand !== null && isWithinBox(hand.x, hand.y, x, y, BIN_SIZE, BIN_SIZE);
      }

      // Active bins/polybags: hand center inside the element's box. Left/right
      // matched independently so one side can't steal the other's bin.
      const leftActive: ActiveBin[] = [];
      const rightActive: ActiveBin[] = [];

      // Forwarded Bin behaves exactly like a polybag (same codes, Regrasp
      // skipped at qty 1, no Eye Focus) by entering the pipeline as a
      // synthetic polybag-shaped entry per instance — isPolybagKind() just
      // checks for a missing assignedHand. Empty Bin never enters this list.
      const forwardedBinElements: PolybagType[] =
        tableWidthPx > 0 && tableHeightPx > 0
          ? forwardedBins.map((b) => ({
              id: `${FORWARDED_BIN_ID_PREFIX}${b.id}`,
              xPercent: (b.x - tableX) / tableWidthPx,
              yPercent: (b.y - tableY) / tableHeightPx,
              label: "Forwarded Bin",
              part: "Forwarded Bin",
              size: 30,
              partlayout: "Flat",
              arrangement: "Stacked",
              quantity: 1,
            }))
          : [];

      const allElements = [...bins, ...polybags, ...forwardedBinElements];

      for (const bin of allElements) {
        const x = tableX + bin.xPercent * tableWidthPx;
        const y = tableY + bin.yPercent * tableHeightPx;
        const binCX = x + BIN_SIZE / 2;
        const binCY = y + BIN_SIZE / 2;

        const leftHand = nearestHand(leftHandsSide, binCX, binCY);
        if (isInBin(leftHand, x, y)) {
          leftActive.push({ bin, hand: leftHand, binCX, binCY });
        }

        const rightHand = nearestHand(rightHandsSide, binCX, binCY);
        if (isInBin(rightHand, x, y)) {
          rightActive.push({ bin, hand: rightHand, binCX, binCY });
        }
      }

      // Sort each side by checkpoint number (ascending)
      leftActive.sort((a, b) => checkpointNum(a.hand.label) - checkpointNum(b.hand.label));
      rightActive.sort((a, b) => checkpointNum(a.hand.label) - checkpointNum(b.hand.label));

      const allMotions: Motion[] = [];
      let sealSecondsMissing = false;
      let manualSetupMissing = false;

      // Needed early: polybag follow-up detection below must recognize a
      // hand's starting checkpoint sitting at idle.
      const idleX = idlePosition?.x ?? tableX + tableWidthPx / 2;
      const idleY = idlePosition?.y ?? tableY + tableHeightPx / 2;

      // Every overlapping LEFT/RIGHT pair with the toggle on, found ONCE up
      // front — segment-freeing and the Transfer Grasp motion itself both
      // read from this same list, so they can never disagree about which
      // pair overlaps or which side keeps the part. Circles must physically
      // touch (the default NODE_OVERLAP_THRESHOLD) — no extra slack, no
      // snapping — positions here match exactly what's drawn on the canvas.
      function findOverlapPartner<T extends { x: number; y: number }>(
        point: { x: number; y: number },
        candidates: T[],
      ): T | undefined {
        return candidates.find((c) => arePointsOverlapping(point, c));
      }

      type TransferGraspPair = { lh: HandPoint; rh: HandPoint; leftKeeps: boolean };
      const transferGraspPairs: TransferGraspPair[] = [];
      const matchedRightLabels = new Set<string>();
      for (const lh of leftHandsSide) {
        const rh = findOverlapPartner(lh, rightHandsSide);
        if (!rh) continue;
        if (!lh.transferGrasp && !rh.transferGrasp) continue;
        transferGraspPairs.push({ lh, rh, leftKeeps: Boolean(lh.transferGrasp) });
        matchedRightLabels.add(rh.label);
      }
      for (const rh of rightHandsSide) {
        if (matchedRightLabels.has(rh.label)) continue;
        const lh = findOverlapPartner(rh, leftHandsSide);
        if (!lh) continue;
        if (!lh.transferGrasp && !rh.transferGrasp) continue;
        transferGraspPairs.push({ lh, rh, leftKeeps: Boolean(lh.transferGrasp) });
      }

      const autoSealingMachineCenterX = autoSealingMachine
        ? autoSealingMachine.x + AUTO_SEALING_MACHINE_WIDTH / 2
        : 0;
      const autoSealingMachineCenterY = autoSealingMachine
        ? autoSealingMachine.y + AUTO_SEALING_MACHINE_HEIGHT / 2
        : 0;

      const manualSealingMachineCenterX = manualSealingMachine
        ? manualSealingMachine.x + MANUAL_SEALING_MACHINE_WIDTH / 2
        : 0;
      const manualSealingMachineCenterY = manualSealingMachine
        ? manualSealingMachine.y + MANUAL_SEALING_MACHINE_HEIGHT / 2
        : 0;

      // A hand that just picked a polybag, then continues to a checkpoint
      // overlapping the other hand, is opening the bag and seating that
      // hand's part — detected from geometry alone. Replaces the normal
      // Grasp/Move there with Open Polybag (G2) + insert move (M4B).
      function polybagFollowUpMatches(
        activeSide: ActiveBin[],
        sideHands: HandPoint[],
        oppositeHands: HandPoint[],
      ): Map<string, HandPoint> {
        const sorted = [...sideHands].sort(
          (a, b) => checkpointNum(a.label) - checkpointNum(b.label),
        );
        const polybagLabels = new Set(
          activeSide.filter((a) => isPolybagKind(a.bin)).map((a) => a.hand.label),
        );
        // LH1/RH1 snaps to idle when dragged near it, meaning "not started
        // yet" — exclude it as a candidate when it's actually at idle.
        // Later checkpoints stay eligible even near idle.
        const candidateOppositeHands = oppositeHands.filter((oh, idx) => {
          if (idx !== 0) return true;
          const dx = oh.x - idleX;
          const dy = oh.y - idleY;
          return Math.sqrt(dx * dx + dy * dy) > IDLE_POSITION_RADIUS;
        });
        const result = new Map<string, HandPoint>();
        for (let i = 0; i < sorted.length - 1; i++) {
          if (!polybagLabels.has(sorted[i].label)) continue;
          const nextHand = sorted[i + 1];
          // Pick the actually-closest opposite-hand node, not just the
          // first in-range one in array order.
          const nearestOpposite = nearestHand(candidateOppositeHands, nextHand.x, nextHand.y);
          if (nearestOpposite && arePointsOverlapping(nextHand, nearestOpposite)) {
            result.set(nextHand.label, nearestOpposite);
          }
        }
        return result;
      }

      const leftPolybagFollowUps = polybagFollowUpMatches(leftActive, leftHandsSide, rightHandsSide);
      const rightPolybagFollowUps = polybagFollowUpMatches(rightActive, rightHandsSide, leftHandsSide);

      // Hand that picked the polybag opens it (G2); the other hand moves its
      // part over the open bag (M4B) in parallel, releasing it if enabled.
      async function polybagOpenAndInsertMotions(
        hand: HandPoint,
        otherHand: HandPoint,
      ): Promise<Motion[]> {
        const openPolybag = await getRegrasp();
        const insertMove = await getReleaseIntoPolybag();

        // Each node keeps its own true checkpoint for the Pos. column;
        // linkId forces them onto the same row despite differing checkpoints.
        const linkId = `polybag-${hand.label}-${otherHand.label}`;

        const motions: Motion[] = [
          {
            motion: "Regrasp",
            code: openPolybag.code,
            baseTmu: openPolybag.tmu,
            multiplier: 1,
            tmu: openPolybag.tmu,
            description: `Open Polybag • ${hand.side} • - • ${hand.label}`,
            shortDescription: "Open Polybag",
            simultaneous: hand.simultaneous ?? true,
            linkId,
          },
          {
            motion: "Move",
            code: insertMove.code,
            baseTmu: insertMove.tmu,
            multiplier: 1,
            tmu: insertMove.tmu,
            description: `Move over Polybag • ${otherHand.side} • - • ${otherHand.label}`,
            shortDescription: "Move over Polybag",
            simultaneous: otherHand.simultaneous ?? true,
            linkId,
          },
        ];

        if (otherHand.releasesPart) {
          const release = await getRelease();
          motions.push({
            motion: "Release",
            code: release.code,
            baseTmu: release.tmu,
            multiplier: 1,
            tmu: release.tmu,
            description: `Release into Polybag • ${otherHand.side} • - • ${otherHand.label}`,
            shortDescription: "Release",
            simultaneous: otherHand.simultaneous ?? true,
            linkId,
          });
        }

        return motions;
      }

      // Any point within the idle radius counts as "at idle" and snaps to
      // the exact center here — the one place all distance math funnels
      // through — so dragging a node around inside the circle can't change
      // the computed cm/TMU.
      function snapToIdle(x: number, y: number): { x: number; y: number } {
        const dx = x - idleX;
        const dy = y - idleY;
        return Math.sqrt(dx * dx + dy * dy) <= IDLE_POSITION_RADIUS
          ? { x: idleX, y: idleY }
          : { x, y };
      }

      // Sequential distance: hand's own start point → first bin → next bin → ...
      function distanceBetween(x1: number, y1: number, x2: number, y2: number): number {
        const from = snapToIdle(x1, y1);
        const to = snapToIdle(x2, y2);
        return Math.max(
          2,
          getTableDistanceCm(
            from.x,
            from.y,
            to.x,
            to.y,
            tableX,
            tableY,
            tableWidthPx,
            tableHeightPx,
            tableHorizontalCm,
            tableVerticalCm,
          ),
        );
      }

      // A hand goes empty-handed the moment it hands off in a transfer grasp.
      // Split into segments at each hand-off: each segment starts with its
      // own Reach; the prior segment ends with a Move to the transfer point.
      function splitIntoSegments(activeBins: ActiveBin[], freedCheckpoints: FreedCheckpoint[]) {
        const freed = [...freedCheckpoints].sort((a, b) => a.num - b.num);

        type Segment = { bins: ActiveBin[]; endFreed: FreedCheckpoint | null };
        const segments: Segment[] = [];

        let segBins: ActiveBin[] = [];
        let freedIdx = 0;
        // True for the first bin and reset after every split — a hand fresh
        // at a segment's start hasn't carried anything in, so release there
        // is moot.
        let isSegmentStart = true;
        // Checkpoint number of the last bin actually placed into a segment,
        // so a freed checkpoint can be judged against "since then" rather
        // than against the bin about to be added.
        let prevNum = -Infinity;

        for (let i = 0; i < activeBins.length; i++) {
          const curNum = checkpointNum(activeBins[i].hand.label);

          while (freedIdx < freed.length && freed[freedIdx].num <= prevNum) freedIdx++;

          // The hand is free from the transfer-grasp point onward — whatever
          // bin it visits at or after that point is a fresh pickup (Reach),
          // never a continuation of what it was carrying before. Split
          // BEFORE adding this bin whenever a freed checkpoint's number is
          // at or before it, so this override always wins regardless of
          // whether the overlap happens to land on this bin's own node or
          // on a bare waypoint strictly before it.
          if (segBins.length > 0 && freedIdx < freed.length && freed[freedIdx].num <= curNum) {
            segments.push({ bins: segBins, endFreed: freed[freedIdx] });
            segBins = [];
            freedIdx++;
            isSegmentStart = true;
          }

          segBins.push(activeBins[i]);

          const releasesHere = activeBins[i].hand.releasesPart && !isSegmentStart;
          isSegmentStart = false;

          // Releasing here means empty-handed from now on — what follows
          // starts fresh with its own Reach instead of continuing as a carry.
          if (releasesHere) {
            segments.push({ bins: segBins, endFreed: null });
            segBins = [];
            isSegmentStart = true;
          }

          prevNum = curNum;
        }
        segments.push({ bins: segBins, endFreed: null });

        return segments.filter((s) => s.bins.length > 0);
      }

      async function processSide(
        activeBins: ActiveBin[],
        startX: number,
        startY: number,
        usedLabels: Set<string>,
        freedCheckpoints: FreedCheckpoint[],
        polybagFollowUps: Map<string, HandPoint>,
        eyeTravelSettings: EyeTravelSettings | null,
        sideHands: HandPoint[],
        includeEyeFocus: boolean,
        otherSideUsedLabels: Set<string>,
      ) {
        if (activeBins.length === 0) return;

        const segments = splitIntoSegments(activeBins, freedCheckpoints);
        const sortedSideHands = [...sideHands].sort(
          (a, b) => checkpointNum(a.label) - checkpointNum(b.label),
        );

        // If the path swings through idle or the output box between two bin
        // visits, the Move must route through it, not skip straight ahead.
        function findMidWaypoint(
          fromLabel: string,
          toLabel: string,
        ): { point: HandPoint; label: string } | null {
          const fromNum = checkpointNum(fromLabel);
          const toNum = checkpointNum(toLabel);

          for (const h of sortedSideHands) {
            const n = checkpointNum(h.label);
            if (n <= fromNum || n >= toNum) continue;

            const dx = h.x - idleX;
            const dy = h.y - idleY;
            if (Math.sqrt(dx * dx + dy * dy) <= IDLE_POSITION_RADIUS) {
              // Within the idle radius counts as "at idle" even though it
              // isn't pre-snapped like the first node — measure from idle's
              // true center so this leg's cm doesn't drift with the node's
              // exact position.
              return { point: { ...h, x: idleX, y: idleY }, label: "to idle position" };
            }

            const box = outputBoxWaypoints.find((b) =>
              isWithinBox(h.x, h.y, b.x, b.y, BIN_SIZE, BIN_SIZE),
            );
            if (box) {
              // Same as the idle case: measure from the output box's own
              // center, not wherever the node sits inside it, so dragging
              // it doesn't drift the TMU.
              return {
                point: {
                  ...h,
                  x: box.x + BIN_SIZE / 2,
                  y: box.y + BIN_SIZE / 2,
                },
                label: "to empty bin",
              };
            }
          }

          return null;
        }

        let segmentStartX = startX;
        let segmentStartY = startY;

        for (let segIdx = 0; segIdx < segments.length; segIdx++) {
          const segment = segments[segIdx];
          const isLastSegment = segIdx === segments.length - 1;
          // Only the leg to a segment's first bin is a true Reach (hand
          // starts empty); every leg after that carries the part, so it's
          // a Move.
          const firstEntry = segment.bins[0];
          const reachDistance = distanceBetween(segmentStartX, segmentStartY, firstEntry.binCX, firstEntry.binCY);
          const reach = await getReach(reachDistance, firstEntry.hand.reachCase ?? "B");
          noteIfExceedsLimit(reach, "Reach", reachDistance, firstEntry.hand.label);
          const reachDescription = isPolybagKind(firstEntry.bin)
            ? polybagShortLabel(firstEntry.bin)
            : `to ${firstEntry.bin.part}`;

          allMotions.push({
            motion: "Reach",
            code: reach.code,
            baseTmu: reach.tmu,
            multiplier: 1,
            tmu: reach.tmu,
            description: `${firstEntry.bin.part} • ${firstEntry.hand.side} • ${reachDistance} cm • ${firstEntry.hand.label}`,
            shortDescription: reachDescription,
            simultaneous: firstEntry.hand.simultaneous ?? true,
          });

          for (let i = 0; i < segment.bins.length; i++) {
            const { bin, hand, binCX, binCY } = segment.bins[i];
            usedLabels.add(hand.label);

            const isLastInSegment = i === segment.bins.length - 1;
            const next = isLastInSegment ? null : segment.bins[i + 1];

            // A hand fresh off its Reach into this bin has nothing to
            // release yet, so a release toggle here is ignored.
            const isFirstInSegment = i === 0;
            const releasesPart = (hand.releasesPart ?? false) && !isFirstInSegment;

            // A transfer point sitting at idle is still idle — label/distance
            // should read "to idle position", not "to transfer point".
            const endFreedIsIdle =
              segment.endFreed &&
              Math.sqrt(
                (segment.endFreed.x - idleX) ** 2 + (segment.endFreed.y - idleY) ** 2,
              ) <= IDLE_POSITION_RADIUS;
            const endFreedTarget = segment.endFreed && !endFreedIsIdle ? segment.endFreed : null;

            // The trailing leg normally falls back to idle, but if the path
            // lands on the output box, that's the real destination. A
            // transfer-grasp-at-idle ending is eligible too, but only on the
            // LAST segment — otherwise the same output box gets detected
            // twice.
            const trailingOutputWaypoint =
              !next &&
              (!segment.endFreed || (endFreedIsIdle && isLastSegment)) &&
              outputBoxWaypoints.length > 0
                ? (() => {
                    let foundHand: HandPoint | null = null;
                    let foundBox: { x: number; y: number } | null = null;
                    for (const h of sortedSideHands) {
                      const n = checkpointNum(h.label);
                      if (n <= checkpointNum(hand.label)) continue;
                      const box = outputBoxWaypoints.find((b) =>
                        isWithinBox(h.x, h.y, b.x, b.y, BIN_SIZE, BIN_SIZE),
                      );
                      if (box) {
                        foundHand = h;
                        foundBox = box;
                        break;
                      }
                    }
                    // Measure from the box's own center, not the node's
                    // exact spot inside it, so dragging within the box
                    // doesn't drift the TMU.
                    return foundHand && foundBox
                      ? {
                          ...foundHand,
                          x: foundBox.x + BIN_SIZE / 2,
                          y: foundBox.y + BIN_SIZE / 2,
                        }
                      : null;
                  })()
                : null;

            // A hand swinging through idle/output box mid-route still has
            // the part in hand — no transfer grasp happened, so both legs
            // stay Moves.
            const waypoint = next
              ? findMidWaypoint(hand.label, next.hand.label)
              : trailingOutputWaypoint
                ? findMidWaypoint(hand.label, trailingOutputWaypoint.label)
                : null;

            // Without an output box, the "back to idle" leg still needs a
            // target point — whether it ends there because there's no
            // transfer/release split at all, or because that split happens
            // to land at idle. Either way it's tagged with THIS node's own
            // checkpoint — whatever object it was actually responsible for
            // (bin, polybag, sealing machine, ...) — never a later node's,
            // so it always stays glued to this same node's own row instead
            // of jumping to wherever some other, unrelated later checkpoint
            // happens to sit. Snapped to idle's true center, same as
            // findMidWaypoint's idle branch.
            const trailingIdleWaypoint =
              !next && !trailingOutputWaypoint && (!segment.endFreed || endFreedIsIdle)
                ? { ...hand, x: idleX, y: idleY }
                : null;

            const nextX = waypoint
              ? waypoint.point.x
              : next
                ? next.binCX
                : endFreedTarget
                  ? endFreedTarget.x
                  : trailingIdleWaypoint
                    ? trailingIdleWaypoint.x
                    : idleX;
            const nextY = waypoint
              ? waypoint.point.y
              : next
                ? next.binCY
                : endFreedTarget
                  ? endFreedTarget.y
                  : trailingIdleWaypoint
                    ? trailingIdleWaypoint.y
                    : idleY;
            const moveDistance = distanceBetween(binCX, binCY, nextX, nextY);

            const targetsIdle = !next && !segment.endFreed && !releasesPart;

            const moveDescription = releasesPart
              ? "to the part bin"
              : waypoint
                ? waypoint.label
                : next
                  ? isPolybagKind(next.bin)
                    ? polybagShortLabel(next.bin)
                    : `to ${next.bin.part}`
                  : "to idle position";

            // Grasp/Regrasp always show once a bin's been visited, but the
            // final "back to idle" Move only belongs once the hand has
            // actually been drawn somewhere past this bin — otherwise a
            // half-drawn path (nothing clicked yet after the last bin) gets
            // a phantom "back to idle" Move. "Somewhere past" means ANY
            // later node on this hand's path, not just one that happens to
            // land at idle — a later node could just as easily be a fresh
            // successor checkpoint or one pushPolybagFollowUps is about to
            // consume as the other side's arrival target, and the leg to
            // reach it still needs to exist. When the trailing destination
            // is the output box instead, that leg is its own separate Move
            // below, so this bin's Move is skipped here.
            const hasLaterNode = sortedSideHands.some(
              (h) => checkpointNum(h.label) > checkpointNum(hand.label),
            );
            const includeMove = waypoint
              ? true
              : trailingOutputWaypoint
                ? false
                : !targetsIdle || hasLaterNode;

            // Grasp/Regrasp/Eye Focus/Release happen AT this checkpoint, so
            // they stay tagged here. Move travels TO the next checkpoint, so
            // its label and case come from that destination — or from the
            // waypoint, if one sits in between, since the leg only travels
            // that far.
            const moveTargetHand = next
              ? (waypoint ? waypoint.point : next.hand)
              : trailingOutputWaypoint
                ? (waypoint ? waypoint.point : trailingOutputWaypoint)
                : trailingIdleWaypoint
                  ? trailingIdleWaypoint
                  : hand;

            if (polybagFollowUps.has(hand.label)) {
              const otherHand = polybagFollowUps.get(hand.label)!;
              allMotions.push(...(await polybagOpenAndInsertMotions(hand, otherHand)));
              otherSideUsedLabels.add(otherHand.label);

              // The polybag interaction never carries the hand onward — a
              // further leg after it is a plain Move, same as any bin visit,
              // just not folded into calculateTMU's own output.
              if (includeMove) {
                const move = await getMove(moveDistance, moveTargetHand.moveCase ?? "B");
                noteIfExceedsLimit(move, "Move", moveDistance, hand.label);
                allMotions.push({
                  motion: "Move",
                  code: move.code,
                  baseTmu: move.tmu,
                  multiplier: 1,
                  tmu: move.tmu,
                  description: `${bin.part} • ${hand.side} • ${moveDistance} cm • ${moveTargetHand.label}`,
                  shortDescription: moveDescription,
                  simultaneous: moveTargetHand.simultaneous ?? true,
                });
              }
            } else {
              const binMotions = await calculateTMU(
                moveDistance,
                bin.size,
                bin.partlayout,
                bin.quantity,
                bin.arrangement ?? "Single",
                releasesPart,
                moveDescription,
                includeMove,
                eyeTravelSettings,
                includeEyeFocus && !isPolybagKind(bin),
                moveTargetHand.moveCase ?? "B",
                isPolybagKind(bin),
              );

              const binMove = binMotions.find((m) => m.motion === "Move") as
                | { exceedsLimit?: boolean }
                | undefined;
              noteIfExceedsLimit(
                { exceedsLimit: Boolean(binMove?.exceedsLimit) },
                "Move",
                moveDistance,
                hand.label,
              );

              // A Move travels TO the checkpoint it's tagged with, so its
              // simultaneous flag comes from that destination node — every
              // other motion (Grasp/Regrasp/etc.) happens AT this bin, so it
              // keeps using this bin's own flag.
              allMotions.push(
                ...binMotions.map((m) => ({
                  ...m,
                  description: `${bin.part} • ${hand.side} • ${moveDistance} cm • ${
                    m.motion === "Move" ? moveTargetHand.label : hand.label
                  }`,
                  simultaneous:
                    m.motion === "Move"
                      ? (moveTargetHand.simultaneous ?? true)
                      : (hand.simultaneous ?? true),
                })),
              );
            }

            // Leg back out of idle/output box to the next bin — a plain
            // Move (hand still carrying), tagged by the checkpoint it lands
            // on to keep rows in strict checkpoint order.
            if (waypoint && next) {
              const waypointToNextDistance = distanceBetween(
                waypoint.point.x,
                waypoint.point.y,
                next.binCX,
                next.binCY,
              );
              const move = await getMove(waypointToNextDistance, next.hand.moveCase ?? "B");
              noteIfExceedsLimit(move, "Move", waypointToNextDistance, next.hand.label);

              allMotions.push({
                motion: "Move",
                code: move.code,
                baseTmu: move.tmu,
                multiplier: 1,
                tmu: move.tmu,
                description: `${next.bin.part} • ${hand.side} • ${waypointToNextDistance} cm • ${next.hand.label}`,
                shortDescription: isPolybagKind(next.bin) ? polybagShortLabel(next.bin) : `to ${next.bin.part}`,
                simultaneous: hand.simultaneous ?? true,
              });
            }

            // Final drop-off at the output box gets its own row, tagged
            // with its own checkpoint, instead of being buried in the last
            // bin's row.
            if (trailingOutputWaypoint) {
              // If the path swings through idle first, this leg starts
              // from idle's actual position rather than skipping straight
              // from the last bin.
              const outputFromX = waypoint ? waypoint.point.x : binCX;
              const outputFromY = waypoint ? waypoint.point.y : binCY;
              const outputDistance = distanceBetween(
                outputFromX,
                outputFromY,
                trailingOutputWaypoint.x,
                trailingOutputWaypoint.y,
              );
              const move = await getMove(outputDistance, trailingOutputWaypoint.moveCase ?? "B");
              noteIfExceedsLimit(move, "Move", outputDistance, trailingOutputWaypoint.label);

              allMotions.push({
                motion: "Move",
                code: move.code,
                baseTmu: move.tmu,
                multiplier: 1,
                tmu: move.tmu,
                description: `${bin.part} • ${hand.side} • ${outputDistance} cm • ${trailingOutputWaypoint.label}`,
                shortDescription: "to empty bin",
                simultaneous: hand.simultaneous ?? true,
              });
            }
          }

          if (segment.endFreed) {
            segmentStartX = segment.endFreed.x;
            segmentStartY = segment.endFreed.y;
          }
        }
      }

      const leftStartX = leftHands[0]?.x ?? idleX;
      const leftStartY = leftHands[0]?.y ?? idleY;
      const rightStartX = rightHands[0]?.x ?? idleX;
      const rightStartY = rightHands[0]?.y ?? idleY;

      const leftUsedLabels = new Set<string>();
      const rightUsedLabels = new Set<string>();

      // Checkpoints where a transfer grasp frees this side's hand — its next
      // leg starts fresh with a Reach. Mutually exclusive within a pair: the
      // node marked Yes keeps the part; its overlapping partner gets freed.
      // Reads the SAME transferGraspPairs list the motion itself is built
      // from, instead of re-deriving the overlap independently.
      function isFreedByTransfer(hand: HandPoint): boolean {
        return transferGraspPairs.some((p) =>
          p.leftKeeps ? p.rh.label === hand.label : p.lh.label === hand.label,
        );
      }

      // A release on a plain waypoint (not a bin visit) frees the hand too,
      // but never appears in activeBins, so it needs its own path into the
      // freed-checkpoint list. Output-box nodes are excluded — that's the
      // segment's real destination, and flagging it as freed would block
      // trailingOutputWaypoint from ever finding it.
      const leftActiveLabels = new Set(leftActive.map((a) => a.hand.label));
      const rightActiveLabels = new Set(rightActive.map((a) => a.hand.label));

      function isOnOutputBox(h: HandPoint): boolean {
        return outputBoxWaypoints.some((b) => isWithinBox(h.x, h.y, b.x, b.y, BIN_SIZE, BIN_SIZE));
      }

      const leftFreedCheckpoints: FreedCheckpoint[] = leftHandsSide
        .filter(
          (h) =>
            isFreedByTransfer(h) ||
            (h.releasesPart && !leftActiveLabels.has(h.label) && !isOnOutputBox(h)),
        )
        .map((h) => ({ num: checkpointNum(h.label), x: h.x, y: h.y, label: h.label }));
      const rightFreedCheckpoints: FreedCheckpoint[] = rightHandsSide
        .filter(
          (h) =>
            isFreedByTransfer(h) ||
            (h.releasesPart && !rightActiveLabels.has(h.label) && !isOnOutputBox(h)),
        )
        .map((h) => ({ num: checkpointNum(h.label), x: h.x, y: h.y, label: h.label }));

      await processSide(leftActive, leftStartX, leftStartY, leftUsedLabels, leftFreedCheckpoints, leftPolybagFollowUps, eyeTravel, leftHandsSide, eyeFocusAdded, rightUsedLabels);
      await processSide(rightActive, rightStartX, rightStartY, rightUsedLabels, rightFreedCheckpoints, rightPolybagFollowUps, eyeTravel, rightHandsSide, eyeFocusAdded, leftUsedLabels);

      // A follow-up node not sitting over any bin still gets its Open
      // Polybag + Insert motions — geometry-driven, not bin-visit-driven.
      // Must run before pushStandaloneReleases so the other hand's release
      // is already marked used.
      async function pushPolybagFollowUps(
        hands: HandPoint[],
        followUps: Map<string, HandPoint>,
        usedLabels: Set<string>,
        otherSideUsedLabels: Set<string>,
      ) {
        for (const hand of hands) {
          if (usedLabels.has(hand.label) || !followUps.has(hand.label)) continue;
          const otherHand = followUps.get(hand.label)!;
          allMotions.push(...(await polybagOpenAndInsertMotions(hand, otherHand)));
          otherSideUsedLabels.add(otherHand.label);
        }
      }

      await pushPolybagFollowUps(leftHandsSide, leftPolybagFollowUps, leftUsedLabels, rightUsedLabels);
      await pushPolybagFollowUps(rightHandsSide, rightPolybagFollowUps, rightUsedLabels, leftUsedLabels);

      // A checkpoint on the Auto Sealing Machine gets a fixed sequence —
      // Move, Position, 4cm adjust Move, Release — regardless of any bin
      // visit. Only the initial Move's distance/case varies.
      async function pushAutoSealingMachineVisits(
        hands: HandPoint[],
        startX: number,
        startY: number,
        usedLabels: Set<string>,
      ) {
        if (!autoSealingMachine) return;

        const sorted = [...hands].sort(
          (a, b) => checkpointNum(a.label) - checkpointNum(b.label),
        );

        for (let i = 0; i < sorted.length; i++) {
          const hand = sorted[i];
          if (usedLabels.has(hand.label)) continue;

          const onMachine = isWithinBox(
            hand.x,
            hand.y,
            autoSealingMachine.x,
            autoSealingMachine.y,
            AUTO_SEALING_MACHINE_WIDTH,
            AUTO_SEALING_MACHINE_HEIGHT,
          );
          if (!onMachine) continue;

          const prev = i > 0 ? sorted[i - 1] : null;
          const fromX = prev ? prev.x : startX;
          const fromY = prev ? prev.y : startY;
          const distance = distanceBetween(
            fromX,
            fromY,
            autoSealingMachineCenterX,
            autoSealingMachineCenterY,
          );

          const move = await getMove(distance, hand.moveCase ?? "B");
          noteIfExceedsLimit(move, "Move", distance, hand.label);
          allMotions.push({
            motion: "Move",
            code: move.code,
            baseTmu: move.tmu,
            multiplier: 1,
            tmu: move.tmu,
            description: `Auto Sealing Machine • ${hand.side} • ${distance} cm • ${hand.label}`,
            shortDescription: "move to sealing machine",
            simultaneous: hand.simultaneous ?? true,
          });

          const position = await getPosition();
          allMotions.push({
            motion: "Position",
            code: position.code,
            baseTmu: position.tmu,
            multiplier: 1,
            tmu: position.tmu,
            description: `Auto Sealing Machine • ${hand.side} • - • ${hand.label}`,
            shortDescription: "position",
            simultaneous: hand.simultaneous ?? true,
          });

          const adjustMove = await getMove(4, "C");
          allMotions.push({
            motion: "Move",
            code: adjustMove.code,
            baseTmu: adjustMove.tmu,
            multiplier: 1,
            tmu: adjustMove.tmu,
            description: `Auto Sealing Machine • ${hand.side} • 4 cm • ${hand.label}`,
            shortDescription: "adjust move",
            simultaneous: hand.simultaneous ?? true,
          });

          const release = await getRelease();
          allMotions.push({
            motion: "Release",
            code: release.code,
            baseTmu: release.tmu,
            multiplier: 1,
            tmu: release.tmu,
            description: `Auto Sealing Machine • ${hand.side} • - • ${hand.label}`,
            shortDescription: "release",
            simultaneous: hand.simultaneous ?? true,
          });

          // Seal time (seconds, from the properties bar) converts to TMU at
          // 1 TMU = 0.036s (≈27.8), shown below Release. If unset, flag it.
          if (autoSealingMachineSealSeconds && autoSealingMachineSealSeconds > 0) {
            const sealTmu =
              Math.round(autoSealingMachineSealSeconds * 27.8 * 10) / 10;
            allMotions.push({
              motion: "Seal Process",
              code: "PTUSEC",
              baseTmu: sealTmu,
              multiplier: 1,
              tmu: sealTmu,
              description: `Auto Sealing Machine • ${hand.side} • - • ${hand.label}`,
              shortDescription: autoSealingMachineOperatorWaits ? "seal process" : "seal process (excluded)",
              simultaneous: hand.simultaneous ?? true,
              countsTowardTotal: autoSealingMachineOperatorWaits,
            });
          } else {
            sealSecondsMissing = true;
          }

          usedLabels.add(hand.label);
        }
      }

      await pushAutoSealingMachineVisits(leftHandsSide, leftStartX, leftStartY, leftUsedLabels);
      await pushAutoSealingMachineVisits(rightHandsSide, rightStartX, rightStartY, rightUsedLabels);

      // Manual Sealing Machine needs BOTH hands present, unlike the auto
      // machine. The material hand drops its part in; the free hand grasps
      // the handle and works the press. All five steps share one linkId,
      // like the polybag interaction.
      async function pushManualSealingMachineInteraction() {
        if (!manualSealingMachine) return;

        const inBounds = (h: HandPoint) =>
          isWithinBox(
            h.x,
            h.y,
            manualSealingMachine.x,
            manualSealingMachine.y,
            MANUAL_SEALING_MACHINE_WIDTH,
            MANUAL_SEALING_MACHINE_HEIGHT,
          );

        const leftCandidate = leftHandsSide.find(inBounds);
        const rightCandidate = rightHandsSide.find(inBounds);
        if (!leftCandidate || !rightCandidate) return;
        if (leftUsedLabels.has(leftCandidate.label) || rightUsedLabels.has(rightCandidate.label)) {
          return;
        }

        // "Occupied" is read from the drawn path, not a toggle: whether the
        // hand picked up a Polybag earlier. The other hand is the free one.
        function visitedPolybagBefore(activeBins: ActiveBin[], label: string): boolean {
          const num = checkpointNum(label);
          return activeBins.some(
            (a) => isPolybagKind(a.bin) && checkpointNum(a.hand.label) < num,
          );
        }

        const leftOccupied = visitedPolybagBefore(leftActive, leftCandidate.label);
        const rightOccupied = visitedPolybagBefore(rightActive, rightCandidate.label);
        // Exactly one side must carry the polybag, or there's no way to
        // tell which hand is free — skip rather than guess.
        if (leftOccupied === rightOccupied) return;

        const leftSorted = [...leftHandsSide].sort(
          (a, b) => checkpointNum(a.label) - checkpointNum(b.label),
        );
        const rightSorted = [...rightHandsSide].sort(
          (a, b) => checkpointNum(a.label) - checkpointNum(b.label),
        );

        function prevOf(sorted: HandPoint[], label: string, startX: number, startY: number) {
          const idx = sorted.findIndex((h) => h.label === label);
          const prev = idx > 0 ? sorted[idx - 1] : null;
          return { x: prev ? prev.x : startX, y: prev ? prev.y : startY };
        }

        const leftPrev = prevOf(leftSorted, leftCandidate.label, leftStartX, leftStartY);
        const rightPrev = prevOf(rightSorted, rightCandidate.label, rightStartX, rightStartY);

        const materialHand = leftOccupied ? leftCandidate : rightCandidate;
        const materialPrev = leftOccupied ? leftPrev : rightPrev;
        const freeHand = leftOccupied ? rightCandidate : leftCandidate;
        const freePrev = leftOccupied ? rightPrev : leftPrev;

        const linkId = `manual-sealing-${materialHand.label}-${freeHand.label}`;

        const materialDistance = distanceBetween(
          materialPrev.x,
          materialPrev.y,
          manualSealingMachineCenterX,
          manualSealingMachineCenterY,
        );
        const materialMove = await getMove(materialDistance, materialHand.moveCase ?? "B");
        noteIfExceedsLimit(materialMove, "Move", materialDistance, materialHand.label);
        allMotions.push({
          motion: "Move",
          code: materialMove.code,
          baseTmu: materialMove.tmu,
          multiplier: 1,
          tmu: materialMove.tmu,
          description: `Manual Sealing Machine • ${materialHand.side} • ${materialDistance} cm • ${materialHand.label}`,
          shortDescription: "to sealing machine with polybag",
          simultaneous: materialHand.simultaneous ?? true,
          linkId,
        });

        const freeDistance = distanceBetween(
          freePrev.x,
          freePrev.y,
          manualSealingMachineCenterX,
          manualSealingMachineCenterY,
        );
        const freeReach = await getReach(freeDistance, freeHand.reachCase ?? "B");
        noteIfExceedsLimit(freeReach, "Reach", freeDistance, freeHand.label);
        allMotions.push({
          motion: "Reach",
          code: freeReach.code,
          baseTmu: freeReach.tmu,
          multiplier: 1,
          tmu: freeReach.tmu,
          description: `Manual Sealing Machine • ${freeHand.side} • ${freeDistance} cm • ${freeHand.label}`,
          shortDescription: "to sealing machine handle",
          simultaneous: freeHand.simultaneous ?? true,
          linkId,
        });

        const placeMove = await getReleaseIntoPolybag();
        allMotions.push({
          motion: "Move",
          code: placeMove.code,
          baseTmu: placeMove.tmu,
          multiplier: 1,
          tmu: placeMove.tmu,
          description: `Manual Sealing Machine • ${materialHand.side} • 4 cm • ${materialHand.label}`,
          shortDescription: "to place in machine",
          simultaneous: materialHand.simultaneous ?? true,
          linkId,
        });

        const handleGrasp = await getMachineHandleGrasp();
        allMotions.push({
          motion: "Grasp",
          code: handleGrasp.code,
          baseTmu: handleGrasp.tmu,
          multiplier: 1,
          tmu: handleGrasp.tmu,
          description: `Manual Sealing Machine • ${freeHand.side} • - • ${freeHand.label}`,
          shortDescription: "grasp machine handle",
          simultaneous: freeHand.simultaneous ?? true,
          linkId,
        });

        // Seal press/return both travel the machine's widest opening; the
        // hold between is the sealing time as TMU. If either input is
        // missing, stop here (arrival steps stay scored) and flag it.
        if (
          manualSealingMachineWidestOpeningCm &&
          manualSealingMachineWidestOpeningCm > 0 &&
          manualSealingMachineSealSeconds &&
          manualSealingMachineSealSeconds > 0
        ) {
          const sealMove = await getMove(manualSealingMachineWidestOpeningCm, "A");
          noteIfExceedsLimit(sealMove, "Move", manualSealingMachineWidestOpeningCm, freeHand.label);
          allMotions.push({
            motion: "Move",
            code: sealMove.code,
            baseTmu: sealMove.tmu,
            multiplier: 1,
            tmu: sealMove.tmu,
            description: `Manual Sealing Machine • ${freeHand.side} • ${manualSealingMachineWidestOpeningCm} cm • ${freeHand.label}`,
            shortDescription: "to seal",
            simultaneous: freeHand.simultaneous ?? true,
            linkId,
          });

          const sealTmu = Math.round(manualSealingMachineSealSeconds * 27.8 * 10) / 10;
          allMotions.push({
            motion: "Seal Process",
            code: "PTBSEC",
            baseTmu: sealTmu,
            multiplier: 1,
            tmu: sealTmu,
            // Tagged to the free hand's checkpoint, like the rest of its
            // press sequence — the block still sorts by the material
            // hand's position.
            description: `Manual Sealing Machine • ${freeHand.side} • - • ${freeHand.label}`,
            shortDescription: "hold for small moment",
            simultaneous: freeHand.simultaneous ?? true,
            linkId,
          });

          const returnMove = await getMove(manualSealingMachineWidestOpeningCm, "B");
          noteIfExceedsLimit(returnMove, "Move", manualSealingMachineWidestOpeningCm, freeHand.label);
          allMotions.push({
            motion: "Move",
            code: returnMove.code,
            baseTmu: returnMove.tmu,
            multiplier: 1,
            tmu: returnMove.tmu,
            description: `Manual Sealing Machine • ${freeHand.side} • ${manualSealingMachineWidestOpeningCm} cm • ${freeHand.label}`,
            shortDescription: "handle to original position",
            simultaneous: freeHand.simultaneous ?? true,
            linkId,
          });

          // The free hand's own Release toggle adds one more row, same as
          // any standalone release.
          if (freeHand.releasesPart) {
            const freeRelease = await getRelease();
            allMotions.push({
              motion: "Release",
              code: freeRelease.code,
              baseTmu: freeRelease.tmu,
              multiplier: 1,
              tmu: freeRelease.tmu,
              description: `Manual Sealing Machine • ${freeHand.side} • - • ${freeHand.label}`,
              shortDescription: "release",
              simultaneous: freeHand.simultaneous ?? true,
              linkId,
            });
          }
        } else {
          manualSetupMissing = true;
        }

        leftUsedLabels.add(leftCandidate.label);
        rightUsedLabels.add(rightCandidate.label);
      }

      await pushManualSealingMachineInteraction();

      // A hand with no bin nearby still gets its opted-in Release — release
      // doesn't require a bin visit.
      async function pushStandaloneReleases(hands: HandPoint[], usedLabels: Set<string>) {
        for (const hand of hands) {
          if (usedLabels.has(hand.label) || !hand.releasesPart) continue;

          const release = await getRelease();
          allMotions.push({
            motion: "Release",
            code: release.code,
            baseTmu: release.tmu,
            multiplier: 1,
            tmu: release.tmu,
            description: `${hand.label} • ${hand.side} • - • ${hand.label}`,
            shortDescription: "Release",
            simultaneous: hand.simultaneous ?? true,
          });
        }
      }

      await pushStandaloneReleases(leftHandsSide, leftUsedLabels);
      await pushStandaloneReleases(rightHandsSide, rightUsedLabels);

      // The checkpoint a motion is tagged to — same "last • segment" parsed
      // by annotateMotions in motionGrouping.ts.
      function motionCheckpoint(m: Motion): string {
        const parts = m.description.split("•").map((p) => p.trim());
        return parts[3] ?? "";
      }

      // A hand's own "back to idle" trailing Move can land on the same
      // checkpoint a linked interaction (polybag follow-up, sealing machine)
      // already claimed for it there. That interaction is generated during
      // the OTHER hand's pass, which runs first — and its own first row is
      // often tagged to a DIFFERENT checkpoint (e.g. the hand that opened a
      // polybag), so the whole group ends up ahead of this hand's own
      // arrival. Move the trailing idle Move in front of the group's very
      // first row, not just in front of its own leg within that group, so
      // the order reads as the hand actually travels: arrive, then interact.
      for (let i = 0; i < allMotions.length; i++) {
        const m = allMotions[i];
        if (m.motion !== "Move" || m.shortDescription !== "to idle position") continue;

        const checkpoint = motionCheckpoint(m);
        const linkedAtCheckpoint = allMotions.find(
          (other, idx) => idx < i && Boolean(other.linkId) && motionCheckpoint(other) === checkpoint,
        );
        if (!linkedAtCheckpoint) continue;

        const groupStart = allMotions.findIndex((other) => other.linkId === linkedAtCheckpoint.linkId);
        if (groupStart === -1 || groupStart >= i) continue;

        const [idleMove] = allMotions.splice(i, 1);
        allMotions.splice(groupStart, 0, idleMove);
      }

      // Transfer Grasp: a left/right pair marked in the properties panel
      // (only offered when the nodes overlap). Saying Yes on one puts the
      // code on that side; the overlapping partner is freed.
      for (const { lh, rh, leftKeeps } of transferGraspPairs) {
        const transferGrasp = await getTransferGrasp();
        const keepingCheckpoint = leftKeeps ? lh.label : rh.label;
        const transferGraspMotion: Motion = {
          motion: "Transfer Grasp",
          code: transferGrasp.code,
          baseTmu: transferGrasp.tmu,
          multiplier: 1,
          tmu: transferGrasp.tmu,
          description: leftKeeps
            ? `Transfer Grasp (${rh.label}) • LEFT • - • ${lh.label}`
            : `Transfer Grasp (${lh.label}) • RIGHT • - • ${rh.label}`,
          shortDescription: "Transfer Grasp",
          simultaneous: (leftKeeps ? lh.simultaneous : rh.simultaneous) ?? true,
        };

        // The keeping hand must actually arrive at this checkpoint before it
        // can transfer-grasp there — if its own "back to idle" Move landed
        // on this same checkpoint, the transfer goes right after it,
        // regardless of where either motion happened to get pushed.
        const idleMoveIndex = allMotions.findIndex(
          (m) =>
            m.motion === "Move" &&
            m.shortDescription === "to idle position" &&
            motionCheckpoint(m) === keepingCheckpoint,
        );

        // Both Release paths run earlier than this loop, so a Release here
        // would otherwise land ahead of its own Transfer Grasp — the hand
        // must receive the part before setting it down.
        const releaseIndex = allMotions.findIndex(
          (m) => m.motion === "Release" && motionCheckpoint(m) === keepingCheckpoint,
        );

        if (idleMoveIndex !== -1) {
          allMotions.splice(idleMoveIndex + 1, 0, transferGraspMotion);
        } else if (releaseIndex === -1) {
          allMotions.push(transferGraspMotion);
        } else {
          allMotions.splice(releaseIndex, 0, transferGraspMotion);
        }
      }

      if (!cancelled) {
        setMotions(allMotions);
        setAutoSealingMachineSealMissing(sealSecondsMissing);
        setManualSealingMachineSetupMissing(manualSetupMissing);
        setDistanceWarnings(Array.from(new Set(distanceWarningMessages)));
      }
    }

    runCalculations();

    return () => {
      cancelled = true;
    };
  },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [
    bins,
    polybags,
    hasTable,
    leftHandsKey,
    rightHandsKey,
    idleKey,
    eyeTravelKey,
    eyeFocusAdded,
    emptyBinsKey,
    forwardedBinsKey,
    autoSealingMachineKey,
    autoSealingMachineSealSeconds,
    autoSealingMachineOperatorWaits,
    manualSealingMachineKey,
    manualSealingMachineSealSeconds,
    manualSealingMachineWidestOpeningCm,
    tableHorizontalCm,
    tableVerticalCm,
    tableX,
    tableY,
    tableWidthPx,
    tableHeightPx,
  ]);

  const totalTMU = calculateTotalTMU(motions);

  // 1 TMU = 0.036s = 0.0006 min. Kept as minutes-per-part so callers can
  // derive output-per-shift (shift length is a user setting).
  const cycleTimeMinutesPerPart = totalTMU * 0.0006;

  return {
    motions,
    totalTMU,
    cycleTimeMinutesPerPart,
    autoSealingMachineSealMissing,
    manualSealingMachineSetupMissing,
    distanceWarnings,
  };
}
