import type { ReactNode } from "react";
import type { LeftToolPanelProps } from "../types/propsUI.types";
import { primaryButton, dangerButton, disabledButtonStyle, leftHandButton, rightHandButton } from "../styles/buttonStyles";
import leftHandIcon from "../assets/left_hand_icon.png";
import rightHandIcon from "../assets/right_hand_icon.png";

const activeButtonStyle = {
  background: "#f59e0b",
};

// Tool Box has a lot of buttons stacked vertically — trim the shared
// button padding/margin here so the whole list fits with less scrolling.
const compactButtonStyle = {
  padding: "7px 12px",
  marginBottom: 6,
  fontSize: 13,
};

function SectionHeader({ children }: { children: ReactNode }) {
  return (
    <h3
      style={{
        margin: "6px 0 4px",
        fontSize: 12,
        fontWeight: 700,
        color: "#374151",
        textTransform: "uppercase",
        letterSpacing: 0.5,
      }}
    >
      {children}
    </h3>
  );
}

export default function LeftToolPanel({
  table,
  onAddBin,
  onAddPolybag,
  autoSealingMachineAdded,
  onAddAutoSealingMachine,
  onClearAutoSealingMachine,
  manualSealingMachineAdded,
  onAddManualSealingMachine,
  onClearManualSealingMachine,
  drawingHand,
  onToggleDrawLeftHand,
  onToggleDrawRightHand,
  leftHandNodeCount,
  rightHandNodeCount,
  onClearLeftHandNodes,
  onClearRightHandNodes,
  workerAdded,
  onAddWorker,
  onClearWorker,
  onAddEmptyBin,
  onAddForwardedBin,
  eyeFocusAdded,
  onAddEyeFocus,
  onClearEyeFocus,
  eyeTravelAdded,
  onAddEyeTravel,
  onClearEyeTravel,
}: LeftToolPanelProps) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #ddd",
        borderRadius: 12,
        padding: 14,
        overflow: "auto",
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Tool Box</h2>
      </div>

      <SectionHeader>Operator</SectionHeader>

      {(drawingHand === "left" || drawingHand === "right") && (
        <div style={{ fontSize: 12, color: "#92400e", marginTop: -8, marginBottom: 4 }}>
          Drawing {drawingHand === "left" ? "Left" : "Right"} Hand… (double-click to finish)
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        {drawingHand === "left" || leftHandNodeCount === 0 ? (
          <button
            className="modern-btn"
            style={{
              ...leftHandButton,
              ...compactButtonStyle,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              ...(!workerAdded ? disabledButtonStyle : {}),
              ...(drawingHand === "left" ? activeButtonStyle : {}),
            }}
            disabled={!workerAdded}
            onClick={onToggleDrawLeftHand}
          >
            <img src={leftHandIcon} alt="" style={{ width: 18, height: 18 }} />
            Left
          </button>
        ) : (
          <button
            className="modern-btn"
            style={{
              ...dangerButton,
              ...compactButtonStyle,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onClick={onClearLeftHandNodes}
          >
            <img src={leftHandIcon} alt="" style={{ width: 18, height: 18 }} />
            Left
          </button>
        )}

        {drawingHand === "right" || rightHandNodeCount === 0 ? (
          <button
            className="modern-btn"
            style={{
              ...rightHandButton,
              ...compactButtonStyle,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              ...(!workerAdded ? disabledButtonStyle : {}),
              ...(drawingHand === "right" ? activeButtonStyle : {}),
            }}
            disabled={!workerAdded}
            onClick={onToggleDrawRightHand}
          >
            <img src={rightHandIcon} alt="" style={{ width: 18, height: 18 }} />
            Right
          </button>
        ) : (
          <button
            className="modern-btn"
            style={{
              ...dangerButton,
              ...compactButtonStyle,
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
            onClick={onClearRightHandNodes}
          >
            <img src={rightHandIcon} alt="" style={{ width: 18, height: 18 }} />
            Right
          </button>
        )}
      </div>

      {!workerAdded ? (
      <button
        className="modern-btn"
        style={{
          ...primaryButton,
          ...compactButtonStyle,
          ...(!table || workerAdded ? disabledButtonStyle : {}),
        }}
        disabled={!table || workerAdded}
        onClick={onAddWorker}
      >
        Idle Position
      </button>
      ) : (
      <button
        className="modern-btn"
        style={{ ...dangerButton, ...compactButtonStyle }}
        onClick={onClearWorker}
      >
        Remove Idle Position
      </button>
      )}

      <SectionHeader>Parts &amp; Containers</SectionHeader>

      <button
        className="modern-btn"
        style={{
          ...primaryButton,
          ...compactButtonStyle,
          ...(!table ? disabledButtonStyle : {}),
        }}
        disabled={!table}
        onClick={onAddBin}
      >
        Part Bin
      </button>

      <button
        className="modern-btn"
        style={{
          ...primaryButton,
          ...compactButtonStyle,
          ...(!table ? disabledButtonStyle : {}),
        }}
        disabled={!table}
        onClick={onAddPolybag}
      >
        Polybag
      </button>

      <button
        className="modern-btn"
        style={{
          ...primaryButton,
          ...compactButtonStyle,
          ...(!table ? disabledButtonStyle : {}),
        }}
        disabled={!table}
        onClick={onAddEmptyBin}
      >
        Empty Bin
      </button>

      <button
        className="modern-btn"
        style={{
          ...primaryButton,
          ...compactButtonStyle,
          ...(!table ? disabledButtonStyle : {}),
        }}
        disabled={!table}
        onClick={onAddForwardedBin}
      >
        Forwarded Bin
      </button>

      <SectionHeader>Equipment</SectionHeader>

      {!autoSealingMachineAdded ? (
        <button
          className="modern-btn"
          style={{
            ...primaryButton,
            ...compactButtonStyle,
            ...(!table ? disabledButtonStyle : {}),
          }}
          disabled={!table}
          onClick={onAddAutoSealingMachine}
        >
          Auto Sealing Machine
        </button>
      ) : (
        <button
          className="modern-btn"
          style={{ ...dangerButton, ...compactButtonStyle }}
          onClick={onClearAutoSealingMachine}
        >
          Remove Auto Sealing Machine
        </button>
      )}

      {!manualSealingMachineAdded ? (
        <button
          className="modern-btn"
          style={{
            ...primaryButton,
            ...compactButtonStyle,
            ...(!table ? disabledButtonStyle : {}),
          }}
          disabled={!table}
          onClick={onAddManualSealingMachine}
        >
          Manual Sealing Machine
        </button>
      ) : (
        <button
          className="modern-btn"
          style={{ ...dangerButton, ...compactButtonStyle }}
          onClick={onClearManualSealingMachine}
        >
          Remove Manual Sealing Machine
        </button>
      )}

      <SectionHeader>Visual Elements</SectionHeader>

      {!eyeFocusAdded ? (
        <button
          className="modern-btn"
          style={{
            ...primaryButton,
            ...compactButtonStyle,
            ...(!table ? disabledButtonStyle : {}),
          }}
          disabled={!table}
          onClick={onAddEyeFocus}
        >
          Eye Focus
        </button>
      ) : (
        <button
          className="modern-btn"
          style={{ ...dangerButton, ...compactButtonStyle }}
          onClick={onClearEyeFocus}
        >
          Clear Eye Focus
        </button>
      )}

      {!eyeTravelAdded ? (
        <button
          className="modern-btn"
          style={{
            ...primaryButton,
            ...compactButtonStyle,
            ...(!table ? disabledButtonStyle : {}),
          }}
          disabled={!table}
          onClick={onAddEyeTravel}
        >
          Eye Travel
        </button>
      ) : (
        <button
          className="modern-btn"
          style={{ ...dangerButton, ...compactButtonStyle }}
          onClick={onClearEyeTravel}
        >
          Clear Eye Travel
        </button>
      )}

    </div>
  );
}
