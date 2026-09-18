import type { FinishedBinType } from "./components.types";

//Bin Props
export type BinProps = {
  x: number;
  y: number;
  id: string;
  label: string;
  imageUrl?: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
};

//Work Table Props
export type WorkTableProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  widthCm: number;
  heightCm: number;
  selected: boolean;
  onSelect: () => void;

};

//Polybag Props
export type PolybagProps = {
  x: number;
  y: number;
  id: string;
  label: string;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
};

//Hand Path Props (shared by left hand and right hand click-to-draw checkpoint paths)
export type HandPathNode = {
  id: string;
  x: number;
  y: number;
  label: string;
};

export type HandPathProps = {
  nodes: HandPathNode[];
  color: string;
  isDrawing: boolean;
  previewPoint: { x: number; y: number } | null;
  selectedId: string | null;
  overlappingIds?: Set<string>;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  onSelectNode: (id: string) => void;
  onNodeDragEnd: (id: string, x: number, y: number) => void;
  onResumeDrawing: () => void;
};

//Idle Position Props
export type IdlePositionProps = {
  x: number;
  y: number;
  radius: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
};

//Finished Prod Bin Props
export type FinishedProdBinProps = {
  x: number;
  y: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  selected: boolean;
  binType: FinishedBinType;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
};

export type AutoSealingMachineProps = {
  x: number;
  y: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
};

export type ManualSealingMachineProps = {
  x: number;
  y: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  selected: boolean;
  onSelect: () => void;
  onDragEnd: (x: number, y: number) => void;
};