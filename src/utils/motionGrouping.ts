import type { Motion } from "../types/components.types";
import { checkpointOrder } from "./checkpointOrder";

export type Side = "LEFT" | "RIGHT";

export type AnnotatedMotion = Motion & {
  side: Side;
  binName: string;
  checkpoint: string;
};

export type PositionRow = {
  left?: AnnotatedMotion;
  right?: AnnotatedMotion;
};

export type PositionGroup = {
  pos: number;
  rows: PositionRow[];
};

export function annotateMotions(motions: Motion[]): AnnotatedMotion[] {
  return motions.map((m) => {
    const parts = m.description.split("•").map((p) => p.trim());
    const binName = parts[0] ?? "";
    const side: Side = parts[1] === "LEFT" ? "LEFT" : "RIGHT";
    const checkpoint = parts[3] ?? "";
    return { ...m, side, binName, checkpoint };
  });
}

// Eye Travel is a shared, single-person resource — it always renders in the
// right-hand column, one row per occurrence, regardless of which hand's
// checkpoint actually triggered it, and is kept out of the normal left/right
// index-pairing so it can never silently shift a real left+right pairing out
// of alignment. Eye Focus, unlike Eye Travel, stays on whichever hand's
// column actually triggered it (LH or RH respectively).
const FORCE_RIGHT_MOTIONS = new Set(["Eye Travel"]);

// Certain grasp/reach/move case combinations are physically hard to perform
// with both hands at once, regardless of the manual Simultaneous Motion
// toggle: G4 (any variant) with Reach case C/D, Move case C with Reach case
// C/D, G4 with Move case C, G1B/G1C (any variant) with G1B/G1C, and G4 with
// G4.
function isG4(m?: AnnotatedMotion): boolean {
  return !!m && m.motion === "Grasp" && m.code.startsWith("G4");
}

function isG1BorG1C(m?: AnnotatedMotion): boolean {
  return !!m && m.motion === "Grasp" && (m.code.startsWith("G1B") || m.code.startsWith("G1C"));
}

function isReachCD(m?: AnnotatedMotion): boolean {
  return !!m && m.motion === "Reach" && (m.code.endsWith("C") || m.code.endsWith("D"));
}

function isMoveC(m?: AnnotatedMotion): boolean {
  return !!m && m.motion === "Move" && m.code.endsWith("C");
}

function isForcedNonParallel(left?: AnnotatedMotion, right?: AnnotatedMotion): boolean {
  if (!left || !right) return false;
  return (
    (isG4(left) && isReachCD(right)) ||
    (isReachCD(left) && isG4(right)) ||
    (isMoveC(left) && isReachCD(right)) ||
    (isReachCD(left) && isMoveC(right)) ||
    (isG4(left) && isMoveC(right)) ||
    (isMoveC(left) && isG4(right)) ||
    (isG1BorG1C(left) && isG1BorG1C(right)) ||
    (isG4(left) && isG4(right))
  );
}

// Motions tagged with the same linkId (e.g. a polybag interaction spanning
// two different-numbered LH/RH checkpoints) must render on one shared row
// even though their checkpoints put them in different positions — each side
// still shows its own true checkpoint in the Pos. column, so they're built
// as their own dedicated row group rather than merged into either position.
function buildLinkedGroups(linked: AnnotatedMotion[]): PositionGroup[] {
  const byLink = new Map<string, AnnotatedMotion[]>();
  for (const m of linked) {
    const key = m.linkId!;
    const arr = byLink.get(key) ?? [];
    arr.push(m);
    byLink.set(key, arr);
  }

  return Array.from(byLink.values()).map((items) => {
    const leftItems = items.filter((m) => m.side === "LEFT");
    const rightItems = items.filter((m) => m.side === "RIGHT");
    const rowCount = Math.max(leftItems.length, rightItems.length, 1);
    const rows: PositionRow[] = Array.from({ length: rowCount }, (_, i) => ({
      left: leftItems[i],
      right: rightItems[i],
    }));
    // Anchor to the triggering checkpoint (Open Polybag) so the interaction
    // shows up where that hand's own sequence reaches this point, not
    // wherever the lower-numbered side of the pair happens to sit.
    const anchor = items.find((m) => m.shortDescription === "Open Polybag") ?? items[0];
    const pos = checkpointOrder(anchor.checkpoint);
    return { pos, rows };
  });
}

export function buildPositionGroups(allMotions: AnnotatedMotion[]): PositionGroup[] {
  const linked = allMotions.filter((m) => m.linkId);
  const motions = allMotions.filter((m) => !m.linkId);

  // A hand reaching idle carries its own checkpoint, but when both hands are
  // marked simultaneous it's really one shared moment — merge that pair onto
  // one row below instead of leaving them stranded in two different
  // checkpoints' groups. A hand can pass through idle more than once (idle,
  // then a bin, then idle again before e.g. a polybag), so rather than
  // guessing which occurrence is "the" one, pick whichever LEFT/RIGHT pair
  // of idle Moves sits CLOSEST together in checkpoint number — that's the
  // pair that's actually simultaneous; anything else stays in its own
  // ordinary checkpoint group, undisturbed by events elsewhere in the cycle.
  const isIdleMove = (m: AnnotatedMotion) =>
    m.motion === "Move" && m.shortDescription === "to idle position" && (m.simultaneous ?? true);
  const leftIdleCandidates = motions.filter((m) => m.side === "LEFT" && isIdleMove(m));
  const rightIdleCandidates = motions.filter((m) => m.side === "RIGHT" && isIdleMove(m));

  const IDLE_PAIR_MAX_CHECKPOINT_GAP = 1;
  let leftIdle: AnnotatedMotion | undefined;
  let rightIdle: AnnotatedMotion | undefined;
  let bestGap = Infinity;
  for (const l of leftIdleCandidates) {
    for (const r of rightIdleCandidates) {
      const gap = Math.abs(checkpointOrder(l.checkpoint) - checkpointOrder(r.checkpoint));
      if (gap < bestGap) {
        bestGap = gap;
        leftIdle = l;
        rightIdle = r;
      }
    }
  }
  const pairIdleMoves = Boolean(leftIdle && rightIdle && bestGap <= IDLE_PAIR_MAX_CHECKPOINT_GAP);

  const unpairedMotions = pairIdleMoves
    ? motions.filter((m) => m !== leftIdle && m !== rightIdle)
    : motions;

  const left = unpairedMotions.filter((m) => m.side === "LEFT" && !FORCE_RIGHT_MOTIONS.has(m.motion));
  const right = unpairedMotions.filter((m) => m.side === "RIGHT" && !FORCE_RIGHT_MOTIONS.has(m.motion));
  const forcedRightItems = unpairedMotions.filter((m) => FORCE_RIGHT_MOTIONS.has(m.motion));

  const positions = new Set<number>();
  left.forEach((m) => positions.add(checkpointOrder(m.checkpoint)));
  right.forEach((m) => positions.add(checkpointOrder(m.checkpoint)));
  forcedRightItems.forEach((m) => positions.add(checkpointOrder(m.checkpoint)));

  const sortedPositions = Array.from(positions).sort((a, b) => a - b);

  const groups = sortedPositions.map((pos) => {
    const leftItems = left.filter((m) => checkpointOrder(m.checkpoint) === pos);
    const rightItems = right.filter((m) => checkpointOrder(m.checkpoint) === pos);
    const forcedRightItemsAtPos = forcedRightItems.filter(
      (m) => checkpointOrder(m.checkpoint) === pos,
    );

    const canPair =
      leftItems.every((m) => m.simultaneous ?? true) &&
      rightItems.every((m) => m.simultaneous ?? true);

    let rows: PositionRow[];
    if (canPair) {
      const rowCount = Math.max(leftItems.length, rightItems.length, 1);
      rows = Array.from({ length: rowCount }, (_, i) => ({
        left: leftItems[i],
        right: rightItems[i],
      }));
    } else {
      // Non-simultaneous nodes never share a row with the opposite hand.
      rows = [
        ...leftItems.map((m) => ({ left: m, right: undefined })),
        ...rightItems.map((m) => ({ left: undefined, right: m })),
      ];
      if (rows.length === 0) rows = [{}];
    }

    // A worker has one pair of eyes — left and right Eye Focus can never
    // happen at once, even when everything else at this checkpoint is
    // marked simultaneous. Split any row that paired them up (purely from
    // index alignment) into two sequential single-hand rows.
    rows = rows.flatMap((row) => {
      if (row.left?.motion === "Eye Focus" && row.right?.motion === "Eye Focus") {
        return [{ left: row.left }, { right: row.right }];
      }
      return [row];
    });

    // Split any row whose left+right combination is physically difficult to
    // perform simultaneously into two sequential single-hand rows.
    rows = rows.flatMap((row) => {
      if (isForcedNonParallel(row.left, row.right)) {
        return [{ left: row.left }, { right: row.right }];
      }
      return [row];
    });

    if (forcedRightItemsAtPos.length > 0) {
      // Drop the placeholder empty row so it doesn't leave a blank line
      // ahead of the forced-right rows.
      if (rows.length === 1 && !rows[0].left && !rows[0].right) rows = [];

      // Eye Travel belongs directly above the Eye Focus row from the same
      // grasp+regrasp event (same checkpoint) — insert it there instead of
      // tacking it onto the end of the position.
      for (const forcedItem of forcedRightItemsAtPos) {
        const matchIndex = rows.findIndex(
          (row) =>
            (row.left?.motion === "Eye Focus" && row.left.checkpoint === forcedItem.checkpoint) ||
            (row.right?.motion === "Eye Focus" && row.right.checkpoint === forcedItem.checkpoint),
        );

        if (matchIndex >= 0) {
          rows.splice(matchIndex, 0, { right: forcedItem });
        } else {
          rows.push({ right: forcedItem });
        }
      }
    }

    return { pos, rows };
  });

  let pairedIdleGroup: PositionGroup[] = [];
  // A tie with a normal group at the same checkpoint needs to resolve in
  // opposite directions depending on what that checkpoint actually is: work
  // done AT a bin (Reach/Grasp/Regrasp/etc.) always happens BEFORE the hand
  // leaves for idle, so the merged idle row sorts after it — but a Transfer
  // Grasp only happens once both hands have already arrived at idle, so the
  // merged idle row must sort before that instead.
  let pairedIdleBeforeTies = false;
  if (pairIdleMoves) {
    const pos = Math.max(checkpointOrder(leftIdle!.checkpoint), checkpointOrder(rightIdle!.checkpoint));
    pairedIdleGroup = [{ pos, rows: [{ left: leftIdle, right: rightIdle }] }];
    const idleCheckpoint = checkpointOrder(leftIdle!.checkpoint) === pos ? leftIdle!.checkpoint : rightIdle!.checkpoint;
    pairedIdleBeforeTies = motions.some(
      (m) => m.checkpoint === idleCheckpoint && m.motion === "Transfer Grasp",
    );
  }

  // Stable sort keeps equal-pos entries in array order, so which side of
  // `groups` the merged idle row is concatenated on decides the tie-break.
  const orderedGroups = pairedIdleBeforeTies
    ? [...pairedIdleGroup, ...groups]
    : [...groups, ...pairedIdleGroup];

  return [...orderedGroups, ...buildLinkedGroups(linked)].sort((a, b) => a.pos - b.pos);
}

// Returns, per row, the rowSpan to render for that side's Pos. cell (0 = skip;
// covered by an earlier row's rowSpan). Consecutive rows sharing the same
// checkpoint merge into one spanning cell, and any blank rows in between (no
// motion on this side, e.g. a row that only has content on the other hand's
// column) are absorbed into that same span rather than breaking it — so
// LH2, blank, LH2 renders as a single merged LH2 cell.
export function computePosSpans(rows: PositionRow[], side: "left" | "right"): number[] {
  const spans = new Array(rows.length).fill(1);
  let i = 0;
  while (i < rows.length) {
    const key = rows[i][side]?.checkpoint;
    let j = i + 1;
    if (key) {
      while (j < rows.length) {
        const nextKey = rows[j][side]?.checkpoint;
        if (!nextKey || nextKey === key) {
          j++;
        } else {
          break;
        }
      }
    }
    spans[i] = j - i;
    for (let k = i + 1; k < j; k++) spans[k] = 0;
    i = j;
  }
  return spans;
}

// A row's real duration: when both hands act simultaneously they overlap in
// time, so the row costs whichever side takes longer, not the sum of both.
export function rowTime(row: PositionRow): number {
  return Math.max(row.left?.tmu ?? 0, row.right?.tmu ?? 0);
}

// The Total TMU shown in the TMU Calc panel must equal the sum of the "Time"
// column the Motion Sequence table actually renders — so it's derived from
// the exact same position/row grouping instead of a flat sum over all
// individual motions (which would double-count simultaneous left+right pairs).
// A motion explicitly opted out (countsTowardTotal: false — e.g. an Auto
// Sealing Machine seal the operator doesn't wait for) still shows its own
// TMU in the table, but contributes 0 here.
export function calculateTotalTMU(motions: Motion[]): number {
  const groups = buildPositionGroups(annotateMotions(motions));
  return groups.reduce(
    (sum, group) =>
      sum +
      group.rows.reduce((rowSum, row) => {
        const left = row.left?.countsTowardTotal === false ? 0 : (row.left?.tmu ?? 0);
        const right = row.right?.countsTowardTotal === false ? 0 : (row.right?.tmu ?? 0);
        return rowSum + Math.max(left, right);
      }, 0),
    0,
  );
}
