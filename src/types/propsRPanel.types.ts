import type { BinType, TableSize, LeftHandType, RightHandType, PolybagType, EyeTravelSettings } from "./components.types";


//Table Canvas Properties Props
export type TableProps = {
  table: TableSize;
  setTable: React.Dispatch<React.SetStateAction<TableSize | null>>;
};

//Bins Canvas Properties
export type BinCanvasProps = {
  selectedBin: BinType;
  setBins: React.Dispatch<React.SetStateAction<BinType[]>>;
};

export type CylindricalBinSize = "Large" | "Medium" | "Small";
export type ArrangementBinType = "Single" | "Loose" | "Stacked" | "Contact";

//Left Hand Canvas Properties Props
export type LHProps = {
  selectedLeftHand: LeftHandType;
  setLeftHands: React.Dispatch<React.SetStateAction<LeftHandType[]>>;
  overlappingPartnerLabel: string | null;
  onSetTransferGrasp: (value: boolean) => void;
  pairedHandLabel: string | null;
  hasReachMotion: boolean;
  hasMoveMotion: boolean;
};

//Right Hand Canvas Properties Props
export type RHProps = {
  selectedRightHand: RightHandType;
  setRightHands: React.Dispatch<React.SetStateAction<RightHandType[]>>;
  overlappingPartnerLabel: string | null;
  onSetTransferGrasp: (value: boolean) => void;
  pairedHandLabel: string | null;
  hasReachMotion: boolean;
  hasMoveMotion: boolean;
};

//Polybag Canvas Properties Props
export type PolybagCanvasProps = {
  selectedPolybag: PolybagType;
  setPolybags: React.Dispatch<React.SetStateAction<PolybagType[]>>;
};

export type CylindricalPbSize = "Large" | "Medium" | "Small";
export type ArrangementPbType = "Single" | "Loose" | "Stacked" | "Contact";

//Time Calculation Props
export type TimeCalculationProps = {
  totalTMU: number;
  cycleTimeMinutesPerPart: number;
  minutesPerShift: number;
  setMinutesPerShift: React.Dispatch<React.SetStateAction<number>>;
};

//Eye Travel Canvas Properties Props
export type EyeTravelProps = {
  eyeTravel: EyeTravelSettings;
  setEyeTravel: React.Dispatch<React.SetStateAction<EyeTravelSettings>>;
};

//Auto Sealing Machine Canvas Properties Props
export type AutoSealingMachineCanvasProps = {
  sealSeconds: number | null;
  setSealSeconds: React.Dispatch<React.SetStateAction<number | null>>;
  sealMissing: boolean;
  operatorWaits: boolean;
  setOperatorWaits: React.Dispatch<React.SetStateAction<boolean>>;
};

//Manual Sealing Machine Canvas Properties Props
export type ManualSealingMachineCanvasProps = {
  sealSeconds: number | null;
  setSealSeconds: React.Dispatch<React.SetStateAction<number | null>>;
  widestOpeningCm: number | null;
  setWidestOpeningCm: React.Dispatch<React.SetStateAction<number | null>>;
  setupMissing: boolean;
};