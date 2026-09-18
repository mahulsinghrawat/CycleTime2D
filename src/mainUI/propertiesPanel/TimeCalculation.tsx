import { useState } from "react";
import type { TimeCalculationProps } from "../../types/propsRPanel.types";
import { formatTmu } from "../../utils/formatTmu";

export default function TimeCalculationPanel({
  totalTMU,
  cycleTimeMinutesPerPart,
  minutesPerShift,
  setMinutesPerShift,
}: TimeCalculationProps) {
  const [minutesPerShiftDraft, setMinutesPerShiftDraft] = useState(String(minutesPerShift));

  const cycleTimePer100Parts = formatTmu(cycleTimeMinutesPerPart * 100);
  const outputPerShift =
    cycleTimeMinutesPerPart > 0 ? Math.floor(minutesPerShift / cycleTimeMinutesPerPart) : 0;

  function handleMinutesPerShiftChange(value: string) {
    setMinutesPerShiftDraft(value);
    const parsed = Number(value);
    if (parsed > 0) setMinutesPerShift(parsed);
  }

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <h2
        style={{
          margin: 0,
          fontSize: 14,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Total Time (in TMU) : {formatTmu(totalTMU)}
      </h2>

      <h2
        style={{
          margin: 0,
          fontSize: 14,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        Cycle Time : {cycleTimePer100Parts} min / 100 cycles
      </h2>

      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Minutes / Shift</label>
        <input
          className="form-input"
          type="number"
          min={1}
          value={minutesPerShiftDraft}
          onChange={(e) => handleMinutesPerShiftChange(e.target.value)}
        />
      </div>

      <p>Output / Shift</p>
      <h2 style={{ margin: 0, fontSize: 20 }}>{outputPerShift}</h2>
    </div>
  );
}
