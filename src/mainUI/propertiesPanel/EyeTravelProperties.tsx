import { useState } from "react";
import type { EyeTravelProps } from "../../types/propsRPanel.types";

export default function EyeTravelProperties({ eyeTravel, setEyeTravel }: EyeTravelProps) {
  const [distanceBetweenPoints, setDistanceBetweenPoints] = useState(
    String(eyeTravel.distanceBetweenPoints),
  );
  const [eyeToLineDistance, setEyeToLineDistance] = useState(
    String(eyeTravel.eyeToLineDistance),
  );
  const [occurrences, setOccurrences] = useState(String(eyeTravel.occurrences));

  function handleDistanceChange(value: string) {
    setDistanceBetweenPoints(value);
    const parsed = Number(value);
    if (parsed >= 0) setEyeTravel((prev) => ({ ...prev, distanceBetweenPoints: parsed }));
  }

  function handleEyeToLineChange(value: string) {
    setEyeToLineDistance(value);
    const parsed = Number(value);
    if (parsed > 0) setEyeTravel((prev) => ({ ...prev, eyeToLineDistance: parsed }));
  }

  function handleOccurrencesChange(value: string) {
    setOccurrences(value);
    const parsed = Number(value);
    if (parsed >= 1) setEyeTravel((prev) => ({ ...prev, occurrences: parsed }));
  }

  return (
    <>
      <h3>Eye Travel Properties</h3>

      <div className="form-group">
        <label className="form-label">Distance between travel points 'D' (cm)</label>
        <input
          className="form-input"
          type="number"
          min={0}
          value={distanceBetweenPoints}
          onChange={(e) => handleDistanceChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Distance from eyes to the line of travel 'T' (cm)</label>
        <input
          className="form-input"
          type="number"
          min={0.1}
          step="0.1"
          value={eyeToLineDistance}
          onChange={(e) => handleEyeToLineChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Number of times</label>
        <input
          className="form-input"
          type="number"
          min={1}
          value={occurrences}
          onChange={(e) => handleOccurrencesChange(e.target.value)}
        />
      </div>
    </>
  );
}
