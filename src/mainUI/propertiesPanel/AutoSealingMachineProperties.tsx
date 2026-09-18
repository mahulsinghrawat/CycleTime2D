import { useState } from "react";
import type { AutoSealingMachineCanvasProps } from "../../types/propsRPanel.types";
import ToggleSwitch from "../../components/ToggleSwitch";

export default function AutoSealingMachineProperties({
  sealSeconds,
  setSealSeconds,
  sealMissing,
  operatorWaits,
  setOperatorWaits,
}: AutoSealingMachineCanvasProps) {
  const [seconds, setSeconds] = useState(sealSeconds === null ? "" : String(sealSeconds));

  function handleChange(value: string) {
    setSeconds(value);
    const parsed = Number(value);
    setSealSeconds(value.trim() !== "" && parsed > 0 ? parsed : null);
  }

  return (
    <>
      <h3>Auto Sealing Machine Properties</h3>

      <div className="form-group">
        <label className="form-label">Sealing process time (sec)</label>
        <input
          className="form-input"
          type="number"
          min={0}
          step="0.1"
          value={seconds}
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>

      {sealMissing && (
        <p style={{ color: "#dc2626", fontSize: 13, marginTop: -4 }}>
          Enter the sealing process time above to calculate the seal TMU.
        </p>
      )}

      <div className="form-group">
        <label className="form-label">Operator waits for sealing to finish?</label>
        <ToggleSwitch checked={operatorWaits} onChange={setOperatorWaits} />
        {!operatorWaits && (
          <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 4 }}>
            Seal process still shows in the Motion Sequence table, grayed out, but isn't counted in the Total TMU.
          </p>
        )}
      </div>
    </>
  );
}
