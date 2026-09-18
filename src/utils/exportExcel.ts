import { Workbook } from "exceljs";
import type { Motion } from "../types/components.types";
import {
  annotateMotions,
  buildPositionGroups,
  calculateTotalTMU,
  computePosSpans,
  rowTime,
} from "./motionGrouping";
import { formatTmu } from "./formatTmu";

// Windows/macOS/Linux all forbid these in filenames; strip them so the
// layout name always turns into a valid default file name.
function sanitizeFileName(name: string): string {
  return name.trim().replace(/[\\/:*?"<>|]/g, "").trim();
}

const HEADER = [
  "Pos.",
  "Short Description",
  "Qty.",
  "Frequency",
  "Code (LH)",
  "Time (in TMU)",
  "Code (RH)",
  "Frequency",
  "Qty.",
  "Short Description",
  "Pos.",
];

// exceljs columns/rows are 1-indexed. Column A and row 1 are left blank as a
// one-row/one-column margin around the table, so every real column shifts
// right by COL_OFFSET.
const COL_OFFSET = 1;
const POS_LH_COL = 1 + COL_OFFSET;
const QTY_LH_COL = 3 + COL_OFFSET;
const FREQ_LH_COL = 4 + COL_OFFSET;
const CODE_LH_COL = 5 + COL_OFFSET;
const TMU_COL = 6 + COL_OFFSET;
const CODE_RH_COL = 7 + COL_OFFSET;
const FREQ_RH_COL = 8 + COL_OFFSET;
const QTY_RH_COL = 9 + COL_OFFSET;
const POS_RH_COL = 11 + COL_OFFSET;
const TOTAL_COLS = 11;

// Same hex values as the Code (LH)/Code (RH) columns in MotionPanel.tsx.
const CODE_LH_ARGB = "FFDCFCE7";
const CODE_RH_ARGB = "FFF3E8FF";
const HEADER_ARGB = "FFF3F4F6";
// Same orange used in MotionPanel.tsx for a motion excluded from the Total
// TMU (e.g. an Auto Sealing Machine seal the operator doesn't wait for).
const EXCLUDED_FONT_ARGB = "FFF97316";

function solidFill(argb: string) {
  return { type: "pattern" as const, pattern: "solid" as const, fgColor: { argb } };
}

const THIN_BORDER = { style: "thin" as const, color: { argb: "FF000000" } };
const CELL_BORDER = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };

// Returns false when the export was blocked (missing layout name) so the
// caller can prompt inline — a blocking window.alert() in Electron can leave
// the renderer unable to accept focus/clicks afterward, so we avoid it here.
export async function exportMtmReport(motions: Motion[], layoutName: string): Promise<boolean> {
  const fileBaseName = sanitizeFileName(layoutName);
  if (!fileBaseName) {
    return false;
  }

  const groups = buildPositionGroups(annotateMotions(motions));

  const workbook = new Workbook();
  const worksheet = workbook.addWorksheet("MTM Report");
  worksheet.views = [{ showGridLines: false }];

  worksheet.columns = [4, 6, 26, 6, 10, 10, 8, 10, 10, 6, 26, 6].map((width) => ({ width }));

  worksheet.addRow([]);
  const headerRow = worksheet.addRow(["", ...HEADER]);
  headerRow.eachCell((cell, colNumber) => {
    if (colNumber <= COL_OFFSET) return;
    cell.font = { bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.fill = solidFill(
      colNumber === CODE_LH_COL ? CODE_LH_ARGB : colNumber === CODE_RH_COL ? CODE_RH_ARGB : HEADER_ARGB,
    );
    cell.border = CELL_BORDER;
  });

  // Collect merge instructions and apply them after every row has been
  // added — merging a cell before its later rows are written can make
  // exceljs reject/ignore the values written into the merged range.
  const merges: { top: number; bottom: number; col: number }[] = [];

  for (const { rows } of groups) {
    const leftSpans = computePosSpans(rows, "left");
    const rightSpans = computePosSpans(rows, "right");

    rows.forEach((row, i) => {
      const excelRow = worksheet.addRow([
        "",
        leftSpans[i] > 0 ? (row.left?.checkpoint ?? "") : "",
        row.left?.shortDescription ?? "",
        "",
        row.left ? (row.left.quantity ?? row.left.multiplier) : "",
        row.left?.code ?? "",
        formatTmu(rowTime(row)),
        row.right?.code ?? "",
        row.right ? (row.right.quantity ?? row.right.multiplier) : "",
        "",
        row.right?.shortDescription ?? "",
        rightSpans[i] > 0 ? (row.right?.checkpoint ?? "") : "",
      ]);

      excelRow.getCell(CODE_LH_COL).fill = solidFill(CODE_LH_ARGB);
      excelRow.getCell(CODE_RH_COL).fill = solidFill(CODE_RH_ARGB);
      excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= COL_OFFSET) return;
        cell.border = CELL_BORDER;
      });
      [POS_LH_COL, CODE_LH_COL, CODE_RH_COL, POS_RH_COL, TMU_COL, QTY_LH_COL, FREQ_LH_COL, FREQ_RH_COL, QTY_RH_COL].forEach((col) => {
        excelRow.getCell(col).alignment = { horizontal: "center", vertical: "middle" };
      });

      // A motion excluded from the Total TMU still shows here, just in
      // orange — matches MotionPanel.tsx.
      const leftExcluded = row.left?.countsTowardTotal === false;
      const rightExcluded = row.right?.countsTowardTotal === false;
      if (leftExcluded) {
        [POS_LH_COL, 2 + COL_OFFSET, QTY_LH_COL, FREQ_LH_COL, CODE_LH_COL].forEach((col) => {
          excelRow.getCell(col).font = { color: { argb: EXCLUDED_FONT_ARGB } };
        });
      }
      if (rightExcluded) {
        [CODE_RH_COL, FREQ_RH_COL, QTY_RH_COL, 10 + COL_OFFSET, POS_RH_COL].forEach((col) => {
          excelRow.getCell(col).font = { color: { argb: EXCLUDED_FONT_ARGB } };
        });
      }
      if (leftExcluded || rightExcluded) {
        excelRow.getCell(TMU_COL).font = { color: { argb: EXCLUDED_FONT_ARGB } };
      }

      if (leftSpans[i] > 1) {
        merges.push({ top: excelRow.number, bottom: excelRow.number + leftSpans[i] - 1, col: POS_LH_COL });
      }
      if (rightSpans[i] > 1) {
        merges.push({ top: excelRow.number, bottom: excelRow.number + rightSpans[i] - 1, col: POS_RH_COL });
      }
    });
  }

  for (const { top, bottom, col } of merges) {
    worksheet.mergeCells(top, col, bottom, col);
  }

  // Same formula as the Cycle Time shown in the properties panel: total TMU
  // -> minutes per part (x0.0006) -> minutes per 100 cycles (x100).
  const cycleTimePer100Cycles = formatTmu(calculateTotalTMU(motions) * 0.0006 * 100);
  const cycleTimeRow = worksheet.addRow(["", `Cycle Time : ${cycleTimePer100Cycles} min / 100 cycles`]);
  worksheet.mergeCells(cycleTimeRow.number, COL_OFFSET + 1, cycleTimeRow.number, COL_OFFSET + TOTAL_COLS);
  cycleTimeRow.getCell(COL_OFFSET + 1).alignment = { horizontal: "center", vertical: "middle" };
  cycleTimeRow.getCell(COL_OFFSET + 1).font = { bold: true };
  for (let col = COL_OFFSET + 1; col <= COL_OFFSET + TOTAL_COLS; col++) {
    cycleTimeRow.getCell(col).border = CELL_BORDER;
  }

  const fileName = `${fileBaseName}.xlsx`;
  const buffer = await workbook.xlsx.writeBuffer();

  if (window.electronAPI?.saveExcelFile) {
    await window.electronAPI.saveExcelFile(fileName, new Uint8Array(buffer));
    return true;
  }

  // Browser fallback (e.g. running via `vite dev` without Electron) — no
  // native save dialog is available, so fall back to a normal download.
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}
