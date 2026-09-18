import type { Motion } from "../types/components.types";
import { exportMtmReport } from "../utils/exportExcel";
import {
  annotateMotions,
  buildPositionGroups,
  computePosSpans,
  rowTime,
  type AnnotatedMotion,
} from "../utils/motionGrouping";
import { FiDownload } from "react-icons/fi";
import { formatTmu } from "../utils/formatTmu";

type Props = {
  motions: Motion[];
  layoutName: string;
  onMissingLayoutName: () => void;
};

function PosCell({ m, rowSpan }: { m?: AnnotatedMotion; rowSpan: number }) {
  return (
    <td style={{ ...cellStyle, textAlign: "center", fontWeight: 600 }} rowSpan={rowSpan}>
      {m ? m.checkpoint : ""}
    </td>
  );
}

const cellStyle: React.CSSProperties = {
  border: "1px solid #d1d5db",
  padding: "4px 6px",
  fontSize: 12,
  verticalAlign: "middle",
};

const headerCellStyle: React.CSSProperties = {
  ...cellStyle,
  background: "#f3f4f6",
  fontWeight: 700,
  textAlign: "center",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

// A motion opted out of the Total TMU (e.g. an Auto Sealing Machine seal
// the operator doesn't wait for) still shows here, just called out in orange.
function isExcluded(m?: AnnotatedMotion): boolean {
  return m?.countsTowardTotal === false;
}

const EXCLUDED_TEXT_COLOR = "#f97316";

function DescriptionCell({ m }: { m?: AnnotatedMotion }) {
  if (!m) return <td style={cellStyle} />;
  return (
    <td style={{ ...cellStyle, color: isExcluded(m) ? EXCLUDED_TEXT_COLOR : undefined }} title={m.motion}>
      {m.shortDescription}
    </td>
  );
}

// MTM counts repeated picks as Frequency, not Qty. — quantity raised in the
// properties panel shows up in the Frequency column, and Qty. stays blank.
function QtyCell() {
  return <td style={{ ...cellStyle, textAlign: "center" }} />;
}

function FrequencyCell({ m }: { m?: AnnotatedMotion }) {
  return (
    <td style={{ ...cellStyle, textAlign: "center", color: isExcluded(m) ? EXCLUDED_TEXT_COLOR : undefined }}>
      {m ? (m.quantity ?? m.multiplier) : ""}
    </td>
  );
}

const CODE_LH_COLOR = "#dcfce7";
const CODE_RH_COLOR = "#f3e8ff";

function CodeCell({ m, background }: { m?: AnnotatedMotion; background: string }) {
  return (
    <td
      style={{
        ...cellStyle,
        textAlign: "center",
        fontFamily: "monospace",
        background,
        color: isExcluded(m) ? EXCLUDED_TEXT_COLOR : undefined,
      }}
    >
      {m ? m.code : ""}
    </td>
  );
}

export default function MotionPanel({ motions, layoutName, onMissingLayoutName }: Props) {
  const annotated = annotateMotions(motions);
  const groups = buildPositionGroups(annotated);

  const isEmpty = groups.length === 0;

  return (
    <div
      style={{
        gridColumn: "1 / span 3",
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 16,
        height: "100%",
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <h3 style={{ margin: 0 }}>Motion Sequence</h3>
        <button
          onClick={() => {
            void (async () => {
              const exported = await exportMtmReport(motions, layoutName);
              if (!exported) onMissingLayoutName();
            })();
          }}
          className="icon-btn"
          title="Export Excel"
        >
          <FiDownload size={18} />
        </button>
      </div>

      <div
        style={{
          marginTop: 10,
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        {isEmpty ? (
          <div style={{ padding: 12, color: "#9ca3af", fontSize: 12, fontStyle: "italic" }}>
            No motions assigned
          </div>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "5%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "7%" }} />
              <col style={{ width: "5%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "5%" }} />
            </colgroup>
            <thead>
              <tr>
                <th style={headerCellStyle}>Pos.</th>
                <th style={headerCellStyle}>Short Description</th>
                <th style={headerCellStyle}>Qty.</th>
                <th style={headerCellStyle}>Frequency</th>
                <th style={{ ...headerCellStyle, background: CODE_LH_COLOR }}>Code (LH)</th>
                <th style={headerCellStyle}>Time (in TMU)</th>
                <th style={{ ...headerCellStyle, background: CODE_RH_COLOR }}>Code (RH)</th>
                <th style={headerCellStyle}>Frequency</th>
                <th style={headerCellStyle}>Qty.</th>
                <th style={headerCellStyle}>Short Description</th>
                <th style={headerCellStyle}>Pos.</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(({ pos, rows }, groupIndex) => {
                const leftSpans = computePosSpans(rows, "left");
                const rightSpans = computePosSpans(rows, "right");
                return rows.map((row, i) => (
                  <tr key={`${groupIndex}-${pos}-${i}`}>
                    {leftSpans[i] > 0 && <PosCell m={row.left} rowSpan={leftSpans[i]} />}
                    <DescriptionCell m={row.left} />
                    <QtyCell />
                    <FrequencyCell m={row.left} />
                    <CodeCell m={row.left} background={CODE_LH_COLOR} />
                    <td
                      style={{
                        ...cellStyle,
                        textAlign: "center",
                        fontWeight: 600,
                        color: isExcluded(row.left) || isExcluded(row.right) ? EXCLUDED_TEXT_COLOR : undefined,
                      }}
                    >
                      {formatTmu(rowTime(row))}
                    </td>
                    <CodeCell m={row.right} background={CODE_RH_COLOR} />
                    <FrequencyCell m={row.right} />
                    <QtyCell />
                    <DescriptionCell m={row.right} />
                    {rightSpans[i] > 0 && <PosCell m={row.right} rowSpan={rightSpans[i]} />}
                  </tr>
                ));
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
