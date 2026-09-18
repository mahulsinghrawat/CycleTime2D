import TableProperties from "./propertiesPanel/TableProperties";
import BinProperties from "./propertiesPanel/BinProperties";
import PolybagProperties from "./propertiesPanel/PolybagProperties";
import LeftHandProperties from "./propertiesPanel/LeftHandProperties";
import RightHandProperties from "./propertiesPanel/RightHandProperties";
import EyeTravelProperties from "./propertiesPanel/EyeTravelProperties";
import AutoSealingMachineProperties from "./propertiesPanel/AutoSealingMachineProperties";
import ManualSealingMachineProperties from "./propertiesPanel/ManualSealingMachineProperties";
import TimeCalculation from "./propertiesPanel/TimeCalculation";
import type { RightPanelProps } from "../types/propsUI.types";
import { arePointsOverlapping } from "../utils/nodeOverlap";
import { checkpointOrder } from "../utils/checkpointOrder";
import { annotateMotions } from "../utils/motionGrouping";

export default function RightPanel({
  selectedElement,
  bins,
  setBins,
  polybags,
  setPolybags,
  leftHands,
  setLeftHands,
  rightHands,
  setRightHands,
  table,
  setTable,
  tableLayout,
  totalTMU,
  cycleTimeMinutesPerPart,
  minutesPerShift,
  setMinutesPerShift,
  eyeTravel,
  setEyeTravel,
  autoSealingMachineSealSeconds,
  setAutoSealingMachineSealSeconds,
  autoSealingMachineSealMissing,
  autoSealingMachineOperatorWaits,
  setAutoSealingMachineOperatorWaits,
  manualSealingMachineSealSeconds,
  setManualSealingMachineSealSeconds,
  manualSealingMachineWidestOpeningCm,
  setManualSealingMachineWidestOpeningCm,
  manualSealingMachineSetupMissing,
  motions,
}: RightPanelProps) {
  const annotatedMotions = annotateMotions(motions);

  function hasMotion(
    side: "LEFT" | "RIGHT",
    label: string,
    motionType: string,
  ) {
    return annotatedMotions.some(
      (m) => m.side === side && m.checkpoint === label && m.motion === motionType,
    );
  }
  const selectedBin =
    selectedElement?.type === "bin"
      ? bins.find((b) => b.id === selectedElement.id)
      : null;

  const selectedPolybag =
    selectedElement?.type === "polybag"
      ? polybags.find((p) => p.id === selectedElement.id)
      : null;

  const selectedLeftHand =
    selectedElement?.type === "lefthand"
      ? leftHands.find((lh) => lh.id === selectedElement.id)
      : null;

  const selectedRightHand =
    selectedElement?.type === "righthand"
      ? rightHands.find((rh) => rh.id === selectedElement.id)
      : null;

  // No snapping — a node's pixel position always matches exactly where it's
  // drawn on the canvas, so this overlap check sees the same thing the user
  // does: circles must physically touch, nothing else.
  function toPixel(node: { xPercent: number; yPercent: number }) {
    return {
      x: tableLayout!.x + node.xPercent * tableLayout!.width,
      y: tableLayout!.y + node.yPercent * tableLayout!.height,
    };
  }

  function findOverlapPartner<T extends { xPercent: number; yPercent: number }>(
    point: { x: number; y: number },
    candidates: T[],
  ): T | undefined {
    return candidates.find((c) => arePointsOverlapping(point, toPixel(c)));
  }

  const leftOverlapPartner =
    selectedLeftHand && tableLayout
      ? findOverlapPartner(toPixel(selectedLeftHand), rightHands)
      : null;

  const rightOverlapPartner =
    selectedRightHand && tableLayout
      ? findOverlapPartner(toPixel(selectedRightHand), leftHands)
      : null;

  const leftPairedPartner = selectedLeftHand
    ? rightHands.find(
        (rh) => checkpointOrder(rh.label) === checkpointOrder(selectedLeftHand.label),
      )
    : null;

  const rightPairedPartner = selectedRightHand
    ? leftHands.find(
        (lh) => checkpointOrder(lh.label) === checkpointOrder(selectedRightHand.label),
      )
    : null;

  // Transfer Grasp is mutually exclusive within an overlapping pair: saying
  // Yes on one node is what puts the Transfer Grasp code on that node's own
  // side of the Motion Sequence, and automatically flips its overlap
  // partner to No (the other hand is the one that gets freed there).
  function setLeftTransferGrasp(leftId: string, rightPartnerId: string, value: boolean) {
    setLeftHands((prev) =>
      prev.map((lh) => (lh.id === leftId ? { ...lh, transferGrasp: value } : lh)),
    );
    if (value) {
      setRightHands((prev) =>
        prev.map((rh) => (rh.id === rightPartnerId ? { ...rh, transferGrasp: false } : rh)),
      );
    }
  }

  function setRightTransferGrasp(rightId: string, leftPartnerId: string, value: boolean) {
    setRightHands((prev) =>
      prev.map((rh) => (rh.id === rightId ? { ...rh, transferGrasp: value } : rh)),
    );
    if (value) {
      setLeftHands((prev) =>
        prev.map((lh) => (lh.id === leftPartnerId ? { ...lh, transferGrasp: false } : lh)),
      );
    }
  }

  return (
    <div
      className="right-panel-compact"
      style={{
        display: "grid",
        gridTemplateRows: "minmax(0, 1fr) auto",
        gap: 12,
        height: "100%",
        minHeight: 0,
      }}
    >
      <div className="panel" style={{ minHeight: 0, overflow: "auto" }}>
        <h2>Properties</h2>

        {!selectedElement && <p>Select a component to edit properties.</p>}

        {selectedElement?.type === "table" && table && (
          <TableProperties
            key={`${table.widthCm}-${table.lengthCm}`}
            table={table}
            setTable={setTable}
          />
        )}

        {selectedBin && (
          <BinProperties
            key={selectedBin.id}
            selectedBin={selectedBin}
            setBins={setBins}
          />
        )}

        {selectedPolybag && (
          <PolybagProperties
            key={selectedPolybag.id}
            selectedPolybag={selectedPolybag}
            setPolybags={setPolybags}
          />
        )}

        {selectedLeftHand && (
          <LeftHandProperties
            key={selectedLeftHand.id}
            selectedLeftHand={selectedLeftHand}
            setLeftHands={setLeftHands}
            overlappingPartnerLabel={leftOverlapPartner?.label ?? null}
            onSetTransferGrasp={(value) =>
              leftOverlapPartner &&
              setLeftTransferGrasp(selectedLeftHand.id, leftOverlapPartner.id, value)
            }
            pairedHandLabel={leftPairedPartner?.label ?? null}
            hasReachMotion={hasMotion("LEFT", selectedLeftHand.label, "Reach")}
            hasMoveMotion={hasMotion("LEFT", selectedLeftHand.label, "Move")}
          />
        )}
        {selectedRightHand && (
          <RightHandProperties
            key={selectedRightHand.id}
            selectedRightHand={selectedRightHand}
            setRightHands={setRightHands}
            overlappingPartnerLabel={rightOverlapPartner?.label ?? null}
            onSetTransferGrasp={(value) =>
              rightOverlapPartner &&
              setRightTransferGrasp(selectedRightHand.id, rightOverlapPartner.id, value)
            }
            pairedHandLabel={rightPairedPartner?.label ?? null}
            hasReachMotion={hasMotion("RIGHT", selectedRightHand.label, "Reach")}
            hasMoveMotion={hasMotion("RIGHT", selectedRightHand.label, "Move")}
          />
        )}

        {selectedElement?.type === "eyetravel" && (
          <EyeTravelProperties eyeTravel={eyeTravel} setEyeTravel={setEyeTravel} />
        )}

        {selectedElement?.type === "autosealingmachine" && (
          <AutoSealingMachineProperties
            sealSeconds={autoSealingMachineSealSeconds}
            setSealSeconds={setAutoSealingMachineSealSeconds}
            sealMissing={autoSealingMachineSealMissing}
            operatorWaits={autoSealingMachineOperatorWaits}
            setOperatorWaits={setAutoSealingMachineOperatorWaits}
          />
        )}

        {selectedElement?.type === "manualsealingmachine" && (
          <ManualSealingMachineProperties
            sealSeconds={manualSealingMachineSealSeconds}
            setSealSeconds={setManualSealingMachineSealSeconds}
            widestOpeningCm={manualSealingMachineWidestOpeningCm}
            setWidestOpeningCm={setManualSealingMachineWidestOpeningCm}
            setupMissing={manualSealingMachineSetupMissing}
          />
        )}
      </div>

      <div className="panel" style={{ overflow: "hidden" }}>
        <h2 style={{ marginTop: 0 }}>TMU Calculation</h2>
        <TimeCalculation
          totalTMU={totalTMU}
          cycleTimeMinutesPerPart={cycleTimeMinutesPerPart}
          minutesPerShift={minutesPerShift}
          setMinutesPerShift={setMinutesPerShift}
        />
      </div>
    </div>
  );
}