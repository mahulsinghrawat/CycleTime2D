import { useState } from "react";
import type { LHProps } from "../../types/propsRPanel.types";
import { primaryButton } from "../../styles/buttonStyles";
import { REACH_CASE_OPTIONS, type ReachCase } from "./reachCaseOptions";
import { MOVE_CASE_OPTIONS, type MoveCase } from "./moveCaseOptions";
import ToggleSwitch from "../../components/ToggleSwitch";
import { checkpointOrder, renumberFromRename } from "../../utils/checkpointOrder";

export default function LeftHandProperties({
  selectedLeftHand,
  setLeftHands,
  overlappingPartnerLabel,
  onSetTransferGrasp,
  pairedHandLabel,
  hasReachMotion,
  hasMoveMotion,
}: LHProps) {
  const [label, setLabel] = useState(selectedLeftHand.label);
  const [labelError, setLabelError] = useState<string | null>(null);

  // Renaming this node's checkpoint number renumbers it and every LH node
  // after it to stay consecutive — see renumberFromRename.
  function save() {
    let renamed = false;
    setLeftHands((prev) => {
      const next = renumberFromRename(prev, selectedLeftHand.id, label, "LH");
      if (!next) return prev;
      renamed = true;
      return next;
    });
    setLabelError(renamed ? null : "Must be a number greater than the previous LH node's.");
  }

  const transferGrasp = selectedLeftHand.transferGrasp ?? false;
  const simultaneous = selectedLeftHand.simultaneous ?? true;
  const releasesPart = selectedLeftHand.releasesPart ?? false;
  const reachCase = selectedLeftHand.reachCase ?? "B";
  const moveCase = selectedLeftHand.moveCase ?? "B";

  function setSimultaneous(value: boolean) {
    setLeftHands((prev) =>
      prev.map((lh) =>
        lh.id === selectedLeftHand.id ? { ...lh, simultaneous: value } : lh
      )
    );
  }

  function setReleasesPart(value: boolean) {
    setLeftHands((prev) =>
      prev.map((lh) =>
        lh.id === selectedLeftHand.id ? { ...lh, releasesPart: value } : lh
      )
    );
  }

  function setReachCase(value: ReachCase) {
    setLeftHands((prev) =>
      prev.map((lh) =>
        lh.id === selectedLeftHand.id ? { ...lh, reachCase: value } : lh
      )
    );
  }

  function setMoveCase(value: MoveCase) {
    setLeftHands((prev) =>
      prev.map((lh) =>
        lh.id === selectedLeftHand.id ? { ...lh, moveCase: value } : lh
      )
    );
  }

  return (
    <>
      <h3>Left Hand Properties</h3>

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
            <span style={{ color: "#9ca3af" }}> (no matching right-hand position)</span>
          )}
        </label>
        <ToggleSwitch checked={simultaneous} onChange={setSimultaneous} />
      </div>

      {checkpointOrder(selectedLeftHand.label) !== 1 && (
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
