import { useState } from "react";
import type { ManualSealingMachineCanvasProps } from "../../types/propsRPanel.types";

export default function ManualSealingMachineProperties({
  sealSeconds,
  setSealSeconds,
  widestOpeningCm,
  setWidestOpeningCm,
  setupMissing,
}: ManualSealingMachineCanvasProps) {
  const [seconds, setSeconds] = useState(sealSeconds === null ? "" : String(sealSeconds));
  const [widestOpening, setWidestOpening] = useState(
    widestOpeningCm === null ? "" : String(widestOpeningCm),
  );

  function handleSecondsChange(value: string) {
    setSeconds(value);
    const parsed = Number(value);
    setSealSeconds(value.trim() !== "" && parsed > 0 ? parsed : null);
  }

  function handleWidestOpeningChange(value: string) {
    setWidestOpening(value);
    const parsed = Number(value);
    setWidestOpeningCm(value.trim() !== "" && parsed > 0 ? parsed : null);
  }

  return (
    <>
      <h3>Manual Sealing Machine Properties</h3>

      <div className="form-group">
        <label className="form-label">Sealing process time (sec)</label>
        <input
          className="form-input"
          type="number"
          min={0}
          step="0.1"
          value={seconds}
          onChange={(e) => handleSecondsChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Widest opening (cm)</label>
        <input
          className="form-input"
          type="number"
          min={0}
          step="0.1"
          value={widestOpening}
          onChange={(e) => handleWidestOpeningChange(e.target.value)}
        />
      </div>

      {setupMissing && (
        <p style={{ color: "#dc2626", fontSize: 13, marginTop: -4 }}>
          Enter both the sealing process time and widest opening above to calculate the seal sequence.
        </p>
      )}
    </>
  );
}
