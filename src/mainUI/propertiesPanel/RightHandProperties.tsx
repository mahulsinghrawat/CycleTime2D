import { useState } from "react";
import type { RHProps } from "../../types/propsRPanel.types";
import { primaryButton } from "../../styles/buttonStyles";
import { REACH_CASE_OPTIONS, type ReachCase } from "./reachCaseOptions";
import { MOVE_CASE_OPTIONS, type MoveCase } from "./moveCaseOptions";
import ToggleSwitch from "../../components/ToggleSwitch";
import { checkpointOrder, renumberFromRename } from "../../utils/checkpointOrder";

export default function RightHandProperties({
  selectedRightHand,
  setRightHands,
  overlappingPartnerLabel,
  onSetTransferGrasp,
  pairedHandLabel,
  hasReachMotion,
  hasMoveMotion,
}: RHProps) {
  const [label, setLabel] = useState(selectedRightHand.label);
  const [labelError, setLabelError] = useState<string | null>(null);

  // Renaming this node's checkpoint number renumbers it and every RH node
  // after it to stay consecutive — see renumberFromRename.
  function save() {
    let renamed = false;
    setRightHands((prev) => {
      const next = renumberFromRename(prev, selectedRightHand.id, label, "RH");
      if (!next) return prev;
      renamed = true;
      return next;
    });
    setLabelError(renamed ? null : "Must be a number greater than the previous RH node's.");
  }

  const transferGrasp = selectedRightHand.transferGrasp ?? false;
  const simultaneous = selectedRightHand.simultaneous ?? true;
  const releasesPart = selectedRightHand.releasesPart ?? false;
  const reachCase = selectedRightHand.reachCase ?? "B";
  const moveCase = selectedRightHand.moveCase ?? "B";

  function setSimultaneous(value: boolean) {
    setRightHands((prev) =>
      prev.map((rh) =>
        rh.id === selectedRightHand.id ? { ...rh, simultaneous: value } : rh
      )
    );
  }

  function setReleasesPart(value: boolean) {
    setRightHands((prev) =>
      prev.map((rh) =>
        rh.id === selectedRightHand.id ? { ...rh, releasesPart: value } : rh
      )
    );
  }

  function setReachCase(value: ReachCase) {
    setRightHands((prev) =>
      prev.map((rh) =>
        rh.id === selectedRightHand.id ? { ...rh, reachCase: value } : rh
      )
    );
  }

  function setMoveCase(value: MoveCase) {
    setRightHands((prev) =>
      prev.map((rh) =>
        rh.id === selectedRightHand.id ? { ...rh, moveCase: value } : rh
      )
    );
  }

  return (
    <>
      <h3>Right Hand Properties</h3>

      <div className="form-group">
        <label className="form-label">Label</label>
        <input
          className="form-input"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
        {labelError && (
          <span style={{ color: "#dc2626", fontSize: 12 }}>{labelError}</span>
        )}
      </div>

      <button className="modern-btn" style={primaryButton} onClick={save}>
        Save
      </button>

      {hasReachMotion && (
        <div className="form-group">
          <label className="form-label">Reach Case</label>
          <select
            className="form-select"
            value={reachCase}
            onChange={(e) => setReachCase(e.target.value as ReachCase)}
          >
            {REACH_CASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {hasMoveMotion && (
        <div className="form-group">
          <label className="form-label">Move Case</label>
          <select
            className="form-select"
            value={moveCase}
            onChange={(e) => setMoveCase(e.target.value as MoveCase)}
          >
            {MOVE_CASE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-group">
        <label className="form-label">
          Simultaneous Motion
          {pairedHandLabel ? (
            <> (paired with {pairedHandLabel})</>
          ) : (
            <span style={{ color: "#9ca3af" }}> (no matching left-hand position)</span>
          )}
        </label>
        <ToggleSwitch checked={simultaneous} onChange={setSimultaneous} />
      </div>

      {checkpointOrder(selectedRightHand.label) !== 1 && (
        <div className="form-group">
          <label className="form-label">Release Part/Item</label>
          <ToggleSwitch checked={releasesPart} onChange={setReleasesPart} />
        </div>
      )}

      {overlappingPartnerLabel && (
        <div className="form-group">
          <label className="form-label">
            Transfer Grasp (overlapping {overlappingPartnerLabel})
          </label>
          <ToggleSwitch checked={transferGrasp} onChange={onSetTransferGrasp} />
        </div>
      )}
    </>
  );
}
