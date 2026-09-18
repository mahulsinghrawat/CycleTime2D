import { useRef, useState } from "react";
import useMeasure from "react-use-measure";
import type { SelectedElement } from "../types/propsUI.types";
import type {
  BinType,
  EyeTravelSettings,
  FinishedBinInstance,
  LeftHandType,
  PolybagType,
  RightHandType,
  TableSize,
  WorkerPosition,
} from "../types/components.types";
import { getTableLayout } from "../utils/getTableLayout";
import { checkpointOrder } from "../utils/checkpointOrder";
import { parseTableSize } from "../utils/tablesize";
import { primaryButton, secondaryButton } from "../styles/buttonStyles";
import { useMtmCalculations } from "../db/mtm/logic/useMTMCalculation";
import { useWorkspaceHandlers } from "./workspace/useWorkspaceHandlers";

import LeftToolPanel from "./LeftToolPanel";
import WorkspaceCanvas from "./WorkSpaceCanvas";
import MotionPanel from "./MotionPanel";
import RightPanel from "./RightPanel";

export default function MainLayout() {
  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 900;
  const DEFAULT_TABLE_SIZE: TableSize = { widthCm: 75, lengthCm: 120 };

  const [selectedElement, setSelectedElement] = useState<SelectedElement>(null);
  const [layoutName, setLayoutName] = useState("");
  const [layoutNameMissing, setLayoutNameMissing] = useState(false);
  const layoutNameInputRef = useRef<HTMLInputElement>(null);

  function handleLayoutNameChange(value: string) {
    setLayoutName(value);
    setLayoutNameMissing(false);
  }

  function handleMissingLayoutName() {
    setLayoutNameMissing(true);
    layoutNameInputRef.current?.focus();
  }

  const [showTableDialog, setShowTableDialog] = useState(false);
  const [tableDraft, setTableDraft] = useState({
    lengthCm: String(DEFAULT_TABLE_SIZE.lengthCm),
    widthCm: String(DEFAULT_TABLE_SIZE.widthCm),
  });
  const [tableError, setTableError] = useState("");

  function openTableDialog() {
    setTableDraft({
      lengthCm: String(DEFAULT_TABLE_SIZE.lengthCm),
      widthCm: String(DEFAULT_TABLE_SIZE.widthCm),
    });
    setTableError("");
    setShowTableDialog(true);
  }

  const [canvasRef, bounds] = useMeasure();

  const [worker, setWorker] = useState<WorkerPosition>({
    xPercent: 0.5,
    yPercent: 0.82,
  });

  const [emptyBins, setEmptyBins] = useState<FinishedBinInstance[]>([]);
  const [forwardedBins, setForwardedBins] = useState<FinishedBinInstance[]>([]);

  const [autoSealingMachine, setAutoSealingMachine] = useState<WorkerPosition>({
    xPercent: 0.5,
    yPercent: 0.25,
  });

  const [manualSealingMachine, setManualSealingMachine] = useState<WorkerPosition>({
    xPercent: 0.65,
    yPercent: 0.25,
  });

  const [bins, setBins] = useState<BinType[]>([]);
  const [polybags, setPolybags] = useState<PolybagType[]>([]);
  const [leftHands, setLeftHands] = useState<LeftHandType[]>([]);
  const [rightHands, setRightHands] = useState<RightHandType[]>([]);
  const [table, setTable] = useState<TableSize | null>(null);
  const [workerAdded, setWorkerAdded] = useState(false);
  const [autoSealingMachineAdded, setAutoSealingMachineAdded] = useState(false);
  const [autoSealingMachineSealSeconds, setAutoSealingMachineSealSeconds] = useState<
    number | null
  >(null);
  const [autoSealingMachineOperatorWaits, setAutoSealingMachineOperatorWaits] = useState(false);
  const [manualSealingMachineAdded, setManualSealingMachineAdded] = useState(false);
  const [manualSealingMachineSealSeconds, setManualSealingMachineSealSeconds] = useState<
    number | null
  >(null);
  const [manualSealingMachineWidestOpeningCm, setManualSealingMachineWidestOpeningCm] =
    useState<number | null>(null);
  const [eyeFocusAdded, setEyeFocusAdded] = useState(false);
  const [eyeTravelAdded, setEyeTravelAdded] = useState(false);
  const [eyeTravelSettings, setEyeTravelSettings] = useState<EyeTravelSettings>({
    distanceBetweenPoints: 0,
    eyeToLineDistance: 1,
    occurrences: 1,
  });
  const [minutesPerShift, setMinutesPerShift] = useState(480);

  const [drawingHand, setDrawingHand] = useState<"left" | "right" | null>(
    null,
  );
  const drawSnapshotRef = useRef<LeftHandType[] | RightHandType[] | null>(
    null,
  );

  const tableLayout = table
    ? getTableLayout(CANVAS_WIDTH, CANVAS_HEIGHT, table)
    : null;

  const {
    canUndo,
    pushUndo,
    handleUndo,
    handleAddTable,
    handleAddBin,
    handleAddPolybag,
    handleAddWorker,
    handleClearWorker,
    handleAddEmptyBin,
    handleAddForwardedBin,
    handleAddAutoSealingMachine,
    handleClearAutoSealingMachine,
    handleAddManualSealingMachine,
    handleClearManualSealingMachine,
    handleAddEyeFocus,
    handleAddEyeTravel,
    handleClearEyeFocus,
    handleClearEyeTravel,
    handleDeleteSelected,
    handleClearHandNodes,
  } = useWorkspaceHandlers({
    tableLayout,
    selectedElement,
    setSelectedElement,
    table,
    bins,
    polybags,
    leftHands,
    rightHands,
    workerAdded,
    emptyBins,
    forwardedBins,
    autoSealingMachineAdded,
    manualSealingMachineAdded,
    eyeFocusAdded,
    eyeTravelAdded,
    setTable,
    setBins,
    setPolybags,
    setLeftHands,
    setRightHands,
    setWorker,
    setWorkerAdded,
    setEmptyBins,
    setForwardedBins,
    setAutoSealingMachine,
    setAutoSealingMachineAdded,
    setManualSealingMachine,
    setManualSealingMachineAdded,
    setEyeFocusAdded,
    setEyeTravelAdded,
  });

  function confirmAddTable() {
    const result = parseTableSize(tableDraft);
    if ("error" in result) {
      setTableError(result.error);
      return;
    }
    handleAddTable(result.table);
    setShowTableDialog(false);
  }

  function finishDrawing() {
    if (!drawingHand) return;

    const snapshot = drawSnapshotRef.current;
    if (drawingHand === "left" && snapshot) {
      const before = snapshot as LeftHandType[];
      if (before.length !== leftHands.length) {
        pushUndo(() => setLeftHands(before));
      }
    } else if (drawingHand === "right" && snapshot) {
      const before = snapshot as RightHandType[];
      if (before.length !== rightHands.length) {
        pushUndo(() => setRightHands(before));
      }
    }

    drawSnapshotRef.current = null;
    setDrawingHand(null);
  }

  function handleToggleDrawHand(side: "left" | "right") {
    if (drawingHand === side) {
      finishDrawing();
      return;
    }

    if (drawingHand) finishDrawing();

    drawSnapshotRef.current = side === "left" ? leftHands : rightHands;
    setDrawingHand(side);
  }

  function handleClearHand(side: "left" | "right") {
    if (drawingHand === side) {
      drawSnapshotRef.current = null;
      setDrawingHand(null);
    }
    handleClearHandNodes(side);
  }

  function handleAddHandNode(
    side: "left" | "right",
    xPercent: number,
    yPercent: number,
  ) {
    // A node's number can be manually renamed (e.g. LH1 -> LH4), so the next
    // new node continues from the highest number actually in use, not from
    // the array length — otherwise a renamed jump would collide with an
    // already-used number.
    if (side === "left") {
      const nextNum = Math.max(0, ...leftHands.map((h) => checkpointOrder(h.label))) + 1;
      const newLH: LeftHandType = {
        id: crypto.randomUUID(),
        xPercent,
        yPercent,
        label: `LH${nextNum}`,
      };
      setLeftHands((prev) => [...prev, newLH]);
    } else {
      const nextNum = Math.max(0, ...rightHands.map((h) => checkpointOrder(h.label))) + 1;
      const newRH: RightHandType = {
        id: crypto.randomUUID(),
        xPercent,
        yPercent,
        label: `RH${nextNum}`,
      };
      setRightHands((prev) => [...prev, newRH]);
    }
  }

  function handleRemoveLastHandNode(side: "left" | "right") {
    if (side === "left") {
      setLeftHands((prev) => prev.slice(0, -1));
    } else {
      setRightHands((prev) => prev.slice(0, -1));
    }
  }

  function handleDragHandNode(
    side: "left" | "right",
    id: string,
    xPercent: number,
    yPercent: number,
  ) {
    if (side === "left") {
      setLeftHands((prev) =>
        prev.map((lh) => (lh.id === id ? { ...lh, xPercent, yPercent } : lh)),
      );
    } else {
      setRightHands((prev) =>
        prev.map((rh) => (rh.id === id ? { ...rh, xPercent, yPercent } : rh)),
      );
    }
  }

  function toCanvasPosition(position: WorkerPosition) {
    if (tableLayout) {
      return {
        x: tableLayout.x + position.xPercent * tableLayout.width,
        y: tableLayout.y + position.yPercent * tableLayout.height,
      };
    }

    return {
      x: position.xPercent * bounds.width,
      y: position.yPercent * bounds.height,
    };
  }

  const workerPosition = toCanvasPosition(worker);
  const autoSealingMachinePosition = toCanvasPosition(autoSealingMachine);
  const manualSealingMachinePosition = toCanvasPosition(manualSealingMachine);

  const workerX = workerPosition.x;
  const workerY = workerPosition.y;
  const autoSealingMachineX = autoSealingMachinePosition.x;
  const autoSealingMachineY = autoSealingMachinePosition.y;
  const manualSealingMachineX = manualSealingMachinePosition.x;
  const manualSealingMachineY = manualSealingMachinePosition.y;

  // No snapping — a node's position for calculation always matches exactly
  // where it's drawn on the canvas (which never snaps either), so overlap
  // checks and distance math agree with what the user actually sees.
  const leftHandPoints = tableLayout
    ? leftHands.map((lh) => ({
        x: tableLayout.x + lh.xPercent * tableLayout.width,
        y: tableLayout.y + lh.yPercent * tableLayout.height,
        id: lh.id,
        label: lh.label,
        transferGrasp: lh.transferGrasp,
        simultaneous: lh.simultaneous,
        releasesPart: lh.releasesPart,
        reachCase: lh.reachCase,
        moveCase: lh.moveCase,
      }))
    : [];

  const rightHandPoints = tableLayout
    ? rightHands.map((rh) => ({
        x: tableLayout.x + rh.xPercent * tableLayout.width,
        y: tableLayout.y + rh.yPercent * tableLayout.height,
        id: rh.id,
        label: rh.label,
        transferGrasp: rh.transferGrasp,
        simultaneous: rh.simultaneous,
        releasesPart: rh.releasesPart,
        reachCase: rh.reachCase,
        moveCase: rh.moveCase,
      }))
    : [];

  const emptyBinPoints = tableLayout
    ? emptyBins.map((b) => ({
        x: tableLayout.x + b.xPercent * tableLayout.width,
        y: tableLayout.y + b.yPercent * tableLayout.height,
      }))
    : [];

  const forwardedBinPoints = tableLayout
    ? forwardedBins.map((b) => ({
        id: b.id,
        x: tableLayout.x + b.xPercent * tableLayout.width,
        y: tableLayout.y + b.yPercent * tableLayout.height,
      }))
    : [];

  const {
    motions,
    totalTMU,
    cycleTimeMinutesPerPart,
    autoSealingMachineSealMissing,
    manualSealingMachineSetupMissing,
    distanceWarnings,
  } = useMtmCalculations({
    bins,
    polybags,
    table,
    tableLayout,
    leftHands: leftHandPoints,
    rightHands: rightHandPoints,
    idlePosition: workerAdded ? { x: workerX, y: workerY } : null,
    eyeTravel: eyeTravelAdded ? eyeTravelSettings : null,
    eyeFocusAdded,
    emptyBins: emptyBinPoints,
    forwardedBins: forwardedBinPoints,
    autoSealingMachine: autoSealingMachineAdded
      ? { x: autoSealingMachineX, y: autoSealingMachineY }
      : null,
    autoSealingMachineSealSeconds,
    autoSealingMachineOperatorWaits,
    manualSealingMachine: manualSealingMachineAdded
      ? { x: manualSealingMachineX, y: manualSealingMachineY }
      : null,
    manualSealingMachineSealSeconds,
    manualSealingMachineWidestOpeningCm,
  });

  const eyeFocusCount = motions.filter((m) => m.motion === "Eye Focus").length;
  const eyeTravelCount = motions
    .filter((m) => m.motion === "Eye Travel")
    .reduce((sum, m) => sum + m.multiplier, 0);
  const eyeTravelConfigured = eyeTravelSettings.distanceBetweenPoints > 0;

  return (
    <>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr 280px",
        gridTemplateRows: "1fr 230px",
        height: "100vh",
        gap: 12,
        padding: 12,
        background: "#f3f4f6",
        boxSizing: "border-box",
        fontFamily: "Arial",
        color: "#333",
      }}
    >
      <LeftToolPanel
        table={table}
        onAddBin={handleAddBin}
        onAddPolybag={handleAddPolybag}
        autoSealingMachineAdded={autoSealingMachineAdded}
        onAddAutoSealingMachine={handleAddAutoSealingMachine}
        onClearAutoSealingMachine={handleClearAutoSealingMachine}
        manualSealingMachineAdded={manualSealingMachineAdded}
        onAddManualSealingMachine={handleAddManualSealingMachine}
        onClearManualSealingMachine={handleClearManualSealingMachine}
        drawingHand={drawingHand}
        onToggleDrawLeftHand={() => handleToggleDrawHand("left")}
        onToggleDrawRightHand={() => handleToggleDrawHand("right")}
        leftHandNodeCount={leftHands.length}
        rightHandNodeCount={rightHands.length}
        onClearLeftHandNodes={() => handleClearHand("left")}
        onClearRightHandNodes={() => handleClearHand("right")}
        workerAdded={workerAdded}
        onAddWorker={handleAddWorker}
        onClearWorker={handleClearWorker}
        onAddEmptyBin={handleAddEmptyBin}
        onAddForwardedBin={handleAddForwardedBin}
        eyeFocusAdded={eyeFocusAdded}
        onAddEyeFocus={handleAddEyeFocus}
        onClearEyeFocus={handleClearEyeFocus}
        eyeTravelAdded={eyeTravelAdded}
        onAddEyeTravel={handleAddEyeTravel}
        onClearEyeTravel={handleClearEyeTravel}
      />

      <WorkspaceCanvas
        canvasRef={canvasRef}
        layoutName={layoutName}
        onLayoutNameChange={handleLayoutNameChange}
        layoutNameMissing={layoutNameMissing}
        layoutNameInputRef={layoutNameInputRef}
        selectedElement={selectedElement}
        setSelectedElement={setSelectedElement}
        bins={bins}
        setBins={setBins}
        polybags={polybags}
        setPolybags={setPolybags}
        leftHands={leftHands}
        rightHands={rightHands}
        table={table}
        tableLayout={tableLayout}
        onOpenTableDialog={openTableDialog}
        worker={{ x: workerX, y: workerY }}
        setWorker={setWorker}
        workerAdded={workerAdded}
        emptyBins={emptyBins}
        setEmptyBins={setEmptyBins}
        forwardedBins={forwardedBins}
        setForwardedBins={setForwardedBins}
        autoSealingMachine={{ x: autoSealingMachineX, y: autoSealingMachineY }}
        setAutoSealingMachine={setAutoSealingMachine}
        autoSealingMachineAdded={autoSealingMachineAdded}
        manualSealingMachine={{ x: manualSealingMachineX, y: manualSealingMachineY }}
        setManualSealingMachine={setManualSealingMachine}
        manualSealingMachineAdded={manualSealingMachineAdded}
        eyeFocusAdded={eyeFocusAdded}
        eyeFocusCount={eyeFocusCount}
        eyeTravelAdded={eyeTravelAdded}
        eyeTravelCount={eyeTravelCount}
        eyeTravelConfigured={eyeTravelConfigured}
        onUndo={handleUndo}
        canUndo={canUndo}
        onDeleteSelected={handleDeleteSelected}
        canDeleteSelected={Boolean(selectedElement)}
        drawingHand={drawingHand}
        onAddHandNode={handleAddHandNode}
        onRemoveLastHandNode={handleRemoveLastHandNode}
        onFinishDrawing={finishDrawing}
        onDragHandNode={handleDragHandNode}
        onResumeDraw={handleToggleDrawHand}
        distanceWarnings={distanceWarnings}
      />
      <RightPanel
        selectedElement={selectedElement}
        bins={bins}
        setBins={setBins}
        polybags={polybags}
        setPolybags={setPolybags}
        leftHands={leftHands}
        setLeftHands={setLeftHands}
        rightHands={rightHands}
        setRightHands={setRightHands}
        table={table}
        setTable={setTable}
        tableLayout={tableLayout}
        totalTMU={totalTMU}
        cycleTimeMinutesPerPart={cycleTimeMinutesPerPart}
        minutesPerShift={minutesPerShift}
        setMinutesPerShift={setMinutesPerShift}
        eyeTravel={eyeTravelSettings}
        setEyeTravel={setEyeTravelSettings}
        autoSealingMachineSealSeconds={autoSealingMachineSealSeconds}
        setAutoSealingMachineSealSeconds={setAutoSealingMachineSealSeconds}
        autoSealingMachineSealMissing={autoSealingMachineSealMissing}
        autoSealingMachineOperatorWaits={autoSealingMachineOperatorWaits}
        setAutoSealingMachineOperatorWaits={setAutoSealingMachineOperatorWaits}
        manualSealingMachineSealSeconds={manualSealingMachineSealSeconds}
        setManualSealingMachineSealSeconds={setManualSealingMachineSealSeconds}
        manualSealingMachineWidestOpeningCm={manualSealingMachineWidestOpeningCm}
        setManualSealingMachineWidestOpeningCm={setManualSealingMachineWidestOpeningCm}
        manualSealingMachineSetupMissing={manualSealingMachineSetupMissing}
        motions={motions}
      />
      <MotionPanel
        motions={motions}
        layoutName={layoutName}
        onMissingLayoutName={handleMissingLayoutName}
      />
    </div>

    {showTableDialog && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}
        onClick={() => setShowTableDialog(false)}
      >
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: 24,
            width: 280,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 style={{ marginTop: 0 }}>Work Station Dimensions</h3>

          <div className="form-group">
            <label className="form-label">Length (cm)</label>
            <input
              className="form-input"
              type="number"
              autoFocus
              placeholder="Enter table length"
              value={tableDraft.lengthCm}
              onChange={(e) =>
                setTableDraft((prev) => ({ ...prev, lengthCm: e.target.value }))
              }
            />
          </div>

          <div className="form-group">
            <label className="form-label">Width (cm)</label>
            <input
              className="form-input"
              type="number"
              placeholder="Enter table width"
              value={tableDraft.widthCm}
              onChange={(e) =>
                setTableDraft((prev) => ({ ...prev, widthCm: e.target.value }))
              }
            />
          </div>

          {tableError && (
            <p style={{ color: "#dc2626", fontSize: 13, marginTop: 4 }}>{tableError}</p>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button
              className="modern-btn"
              style={{ ...secondaryButton, flex: 1, marginBottom: 0 }}
              onClick={() => setShowTableDialog(false)}
            >
              Cancel
            </button>
            <button
              className="modern-btn"
              style={{ ...primaryButton, flex: 1, marginBottom: 0 }}
              onClick={confirmAddTable}
            >
              Create
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
