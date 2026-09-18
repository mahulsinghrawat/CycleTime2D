import type { BinType, LeftHandType, PolybagType, RightHandType, TableSize, TableLayout, WorkerPosition, EyeTravelSettings, FinishedBinInstance, Motion } from "./components.types";

//Motion Panel Props
export type WorkspaceCanvasProps = {
  canvasRef: (element: HTMLDivElement | null) => void;
  layoutName: string;
  onLayoutNameChange: (value: string) => void;
  layoutNameMissing: boolean;
  layoutNameInputRef: React.RefObject<HTMLInputElement | null>;
  bins: BinType[];
  setBins: React.Dispatch<React.SetStateAction<BinType[]>>;
  polybags: PolybagType[];
  setPolybags: React.Dispatch<React.SetStateAction<PolybagType[]>>;
  leftHands: LeftHandType[];
  rightHands: RightHandType[];
  table: TableSize | null;
  tableLayout: TableLayout | null;
  onOpenTableDialog: () => void;
  worker: {
    x: number;
    y: number;
  };
  setWorker: React.Dispatch<React.SetStateAction<WorkerPosition>>;
  emptyBins: FinishedBinInstance[];
  setEmptyBins: React.Dispatch<React.SetStateAction<FinishedBinInstance[]>>;
  forwardedBins: FinishedBinInstance[];
  setForwardedBins: React.Dispatch<React.SetStateAction<FinishedBinInstance[]>>;
  autoSealingMachine: { x: number; y: number };
  setAutoSealingMachine: React.Dispatch<React.SetStateAction<WorkerPosition>>;
  manualSealingMachine: { x: number; y: number };
  setManualSealingMachine: React.Dispatch<React.SetStateAction<WorkerPosition>>;
  workerAdded: boolean;
  autoSealingMachineAdded: boolean;
  manualSealingMachineAdded: boolean;
  eyeFocusAdded: boolean;
  eyeFocusCount: number;
  eyeTravelAdded: boolean;
  eyeTravelCount: number;
  eyeTravelConfigured: boolean;
  selectedElement: SelectedElement;
  setSelectedElement: React.Dispatch<React.SetStateAction<SelectedElement>>;
  onUndo: () => void;
  canUndo: boolean;
  onDeleteSelected: () => void;
  canDeleteSelected: boolean;
  drawingHand: "left" | "right" | null;
  onAddHandNode: (side: "left" | "right", xPercent: number, yPercent: number) => void;
  onRemoveLastHandNode: (side: "left" | "right") => void;
  onFinishDrawing: () => void;
  onDragHandNode: (side: "left" | "right", id: string, xPercent: number, yPercent: number) => void;
  onResumeDraw: (side: "left" | "right") => void;
  distanceWarnings: string[];
};

//Right Panel Props
export type RightPanelProps = {
  selectedElement: SelectedElement;
  bins: BinType[];
  setBins: React.Dispatch<React.SetStateAction<BinType[]>>;
  polybags: PolybagType[];
  setPolybags: React.Dispatch<React.SetStateAction<PolybagType[]>>;
  leftHands: LeftHandType[];
  setLeftHands: React.Dispatch<React.SetStateAction<LeftHandType[]>>;
  rightHands: RightHandType[];
  setRightHands: React.Dispatch<React.SetStateAction<RightHandType[]>>;
  table: TableSize | null;
  setTable: React.Dispatch<React.SetStateAction<TableSize | null>>;
  tableLayout: TableLayout | null;
  totalTMU: number;
  cycleTimeMinutesPerPart: number;
  minutesPerShift: number;
  setMinutesPerShift: React.Dispatch<React.SetStateAction<number>>;
  eyeTravel: EyeTravelSettings;
  setEyeTravel: React.Dispatch<React.SetStateAction<EyeTravelSettings>>;
  autoSealingMachineSealSeconds: number | null;
  setAutoSealingMachineSealSeconds: React.Dispatch<React.SetStateAction<number | null>>;
  autoSealingMachineSealMissing: boolean;
  autoSealingMachineOperatorWaits: boolean;
  setAutoSealingMachineOperatorWaits: React.Dispatch<React.SetStateAction<boolean>>;
  manualSealingMachineSealSeconds: number | null;
  setManualSealingMachineSealSeconds: React.Dispatch<React.SetStateAction<number | null>>;
  manualSealingMachineWidestOpeningCm: number | null;
  setManualSealingMachineWidestOpeningCm: React.Dispatch<React.SetStateAction<number | null>>;
  manualSealingMachineSetupMissing: boolean;
  motions: Motion[];
};

//Left Tool Panel Props
export type LeftToolPanelProps = {
  table: TableSize | null;
  onAddBin: () => void;
  onAddPolybag: () => void;
  autoSealingMachineAdded: boolean;
  onAddAutoSealingMachine: () => void;
  onClearAutoSealingMachine: () => void;
  manualSealingMachineAdded: boolean;
  onAddManualSealingMachine: () => void;
  onClearManualSealingMachine: () => void;
  drawingHand: "left" | "right" | null;
  onToggleDrawLeftHand: () => void;
  onToggleDrawRightHand: () => void;
  leftHandNodeCount: number;
  rightHandNodeCount: number;
  onClearLeftHandNodes: () => void;
  onClearRightHandNodes: () => void;
  workerAdded: boolean;
  onAddWorker: () => void;
  onClearWorker: () => void;
  onAddEmptyBin: () => void;
  onAddForwardedBin: () => void;
  eyeFocusAdded: boolean;
  onAddEyeFocus: () => void;
  onClearEyeFocus: () => void;
  eyeTravelAdded: boolean;
  onAddEyeTravel: () => void;
  onClearEyeTravel: () => void;
};

//Canvas Controls Props
export type CanvasZoomControlsProps = {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
};

export type CanvasActionControlsProps = {
  canUndo: boolean;
  canDeleteSelected: boolean;
  onUndo: () => void;
  onDeleteSelected: () => void;
};


//Grid Lines
export type GridLines = {
  vertical: number[];
  horizontal: number[];
};

//UI Selected Element Type
export type SelectedElement =
  | { type: "table" }
  | { type: "bin"; id: string }
  | { type: "polybag"; id: string }
  | { type: "lefthand"; id: string }
  | { type: "righthand"; id: string }
  | { type: "emptybin"; id: string }
  | { type: "forwardedbin"; id: string }
  | { type: "worker" }
  | { type: "eyetravel" }
  | { type: "autosealingmachine" }
  | { type: "manualsealingmachine" }
  | null;