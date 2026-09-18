import { useRef, useState } from "react";

import type {
  BinType,
  FinishedBinInstance,
  LeftHandType,
  PolybagType,
  RightHandType,
  TableLayout,
  TableSize,
  WorkerPosition,
} from "../../types/components.types";

import type { SelectedElement } from "../../types/propsUI.types";
import { checkpointOrder } from "../../utils/checkpointOrder";

type Identifiable = { id: string };

type Params = {
  tableLayout: TableLayout | null;
  selectedElement: SelectedElement;
  setSelectedElement: React.Dispatch<React.SetStateAction<SelectedElement>>;
  table: TableSize | null;
  bins: BinType[];
  polybags: PolybagType[];
  leftHands: LeftHandType[];
  rightHands: RightHandType[];
  workerAdded: boolean;
  emptyBins: FinishedBinInstance[];
  forwardedBins: FinishedBinInstance[];
  autoSealingMachineAdded: boolean;
  manualSealingMachineAdded: boolean;
  eyeFocusAdded: boolean;
  eyeTravelAdded: boolean;
  setTable: React.Dispatch<React.SetStateAction<TableSize | null>>;
  setBins: React.Dispatch<React.SetStateAction<BinType[]>>;
  setPolybags: React.Dispatch<React.SetStateAction<PolybagType[]>>;
  setLeftHands: React.Dispatch<React.SetStateAction<LeftHandType[]>>;
  setRightHands: React.Dispatch<React.SetStateAction<RightHandType[]>>;
  setWorker: React.Dispatch<React.SetStateAction<WorkerPosition>>;
  setWorkerAdded: React.Dispatch<React.SetStateAction<boolean>>;
  setEmptyBins: React.Dispatch<React.SetStateAction<FinishedBinInstance[]>>;
  setForwardedBins: React.Dispatch<React.SetStateAction<FinishedBinInstance[]>>;
  setAutoSealingMachine: React.Dispatch<React.SetStateAction<WorkerPosition>>;
  setAutoSealingMachineAdded: React.Dispatch<React.SetStateAction<boolean>>;
  setManualSealingMachine: React.Dispatch<React.SetStateAction<WorkerPosition>>;
  setManualSealingMachineAdded: React.Dispatch<React.SetStateAction<boolean>>;
  setEyeFocusAdded: React.Dispatch<React.SetStateAction<boolean>>;
  setEyeTravelAdded: React.Dispatch<React.SetStateAction<boolean>>;
};

export function useWorkspaceHandlers({
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
}: Params) {
  const undoStack = useRef<(() => void)[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  function pushUndo(fn: () => void) {
    undoStack.current.push(fn);
    setCanUndo(true);
  }

  function handleUndo() {
    const fn = undoStack.current.pop();
    if (fn) fn();
    setCanUndo(undoStack.current.length > 0);
  }

  function handleAddTable(size: TableSize) {
    setTable(size);
    pushUndo(() => {
      setTable(null);
      setBins([]);
      setPolybags([]);
      setWorkerAdded(false);
      setEmptyBins([]);
      setForwardedBins([]);
      setAutoSealingMachineAdded(false);
      setManualSealingMachineAdded(false);
      setEyeFocusAdded(false);
      setEyeTravelAdded(false);
    });
  }

  function handleAddBin() {
    const newBin: BinType = {
      id: crypto.randomUUID(),
      xPercent: 0.25,
      yPercent: 0.25,
      part: `Part ${bins.length + 1} bin`,
      assignedHand: "left",
      size: 15,
      partlayout: "Circular",
      arrangement: "Loose",
      quantity: 1,
    };
    setBins((prev) => [...prev, newBin]);
    pushUndo(() => setBins((prev) => prev.filter((b) => b.id !== newBin.id)));
  }

  function handleAddPolybag() {
    const newPolybag: PolybagType = {
      id: crypto.randomUUID(),
      xPercent: 0.35,
      yPercent: 0.25,
      label: `Polybag ${polybags.length + 1}`,
      part: "Polybag",
      size: 30,
      partlayout: "Flat",
      arrangement: "Stacked",
      quantity: 1,
    };
    setPolybags((prev) => [...prev, newPolybag]);
    pushUndo(() =>
      setPolybags((prev) => prev.filter((p) => p.id !== newPolybag.id)),
    );
  }

  function handleAddWorker() {
    if (tableLayout) {
      setWorker({
        xPercent: 0.5,
        yPercent: 0.5,
      });
    }
    setWorkerAdded(true);
    pushUndo(() => setWorkerAdded(false));
  }

  function handleClearWorker() {
    if (!workerAdded) return;
    setWorkerAdded(false);
    if (selectedElement?.type === "worker") setSelectedElement(null);
    pushUndo(() => setWorkerAdded(true));
  }

  function handleAddEmptyBin() {
    const newBin: FinishedBinInstance = {
      id: crypto.randomUUID(),
      xPercent: 0.75,
      yPercent: 0.25,
    };
    setEmptyBins((prev) => [...prev, newBin]);
    pushUndo(() => setEmptyBins((prev) => prev.filter((b) => b.id !== newBin.id)));
  }

  function handleAddForwardedBin() {
    const newBin: FinishedBinInstance = {
      id: crypto.randomUUID(),
      xPercent: 0.75,
      yPercent: 0.4,
    };
    setForwardedBins((prev) => [...prev, newBin]);
    pushUndo(() => setForwardedBins((prev) => prev.filter((b) => b.id !== newBin.id)));
  }

  function handleAddAutoSealingMachine() {
    if (tableLayout) {
      setAutoSealingMachine({
        xPercent: 0.5,
        yPercent: 0.25,
      });
    }
    setAutoSealingMachineAdded(true);
    pushUndo(() => setAutoSealingMachineAdded(false));
  }

  function handleClearAutoSealingMachine() {
    if (!autoSealingMachineAdded) return;
    setAutoSealingMachineAdded(false);
    if (selectedElement?.type === "autosealingmachine") setSelectedElement(null);
    pushUndo(() => setAutoSealingMachineAdded(true));
  }

  function handleAddManualSealingMachine() {
    if (tableLayout) {
      setManualSealingMachine({
        xPercent: 0.65,
        yPercent: 0.25,
      });
    }
    setManualSealingMachineAdded(true);
    pushUndo(() => setManualSealingMachineAdded(false));
  }

  function handleClearManualSealingMachine() {
    if (!manualSealingMachineAdded) return;
    setManualSealingMachineAdded(false);
    if (selectedElement?.type === "manualsealingmachine") setSelectedElement(null);
    pushUndo(() => setManualSealingMachineAdded(true));
  }

  function handleAddEyeFocus() {
    setEyeFocusAdded(true);
    pushUndo(() => setEyeFocusAdded(false));
  }

  function handleAddEyeTravel() {
    setEyeTravelAdded(true);
    pushUndo(() => setEyeTravelAdded(false));
  }

  function handleClearEyeFocus() {
    if (!eyeFocusAdded) return;
    setEyeFocusAdded(false);
    pushUndo(() => setEyeFocusAdded(true));
  }

  function handleClearEyeTravel() {
    if (!eyeTravelAdded) return;
    setEyeTravelAdded(false);
    if (selectedElement?.type === "eyetravel") setSelectedElement(null);
    pushUndo(() => setEyeTravelAdded(true));
  }

  function removeByIdWithUndo<T extends Identifiable>(
    items: T[],
    id: string,
    setItems: React.Dispatch<React.SetStateAction<T[]>>,
  ) {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return false;

    const removedItem = items[index];
    setItems((prev) => prev.filter((item) => item.id !== id));
    pushUndo(() =>
      setItems((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, removedItem);
        return next;
      }),
    );

    return true;
  }

  function handleDeleteSelected() {
    if (!selectedElement) return;

    if (selectedElement.type === "bin") {
      if (removeByIdWithUndo(bins, selectedElement.id, setBins)) {
        setSelectedElement(null);
      }
      return;
    }

    if (selectedElement.type === "polybag") {
      if (removeByIdWithUndo(polybags, selectedElement.id, setPolybags)) {
        setSelectedElement(null);
      }
      return;
    }

    if (selectedElement.type === "lefthand") {
      const index = leftHands.findIndex((lh) => lh.id === selectedElement.id);
      if (index < 0) return;
      const snapshot = [...leftHands];
      // Shift only the numbers AFTER the removed node down by one, closing
      // just that gap — a manually renamed jump earlier in the sequence
      // (LH1 -> LH4) stays intact instead of being reset to 1,2,3,...
      const removedNum = checkpointOrder(leftHands[index].label);
      const renumbered = leftHands
        .filter((lh) => lh.id !== selectedElement.id)
        .map((lh) => {
          const num = checkpointOrder(lh.label);
          return num > removedNum ? { ...lh, label: `LH${num - 1}` } : lh;
        });
      setLeftHands(renumbered);
      setSelectedElement(null);
      pushUndo(() => setLeftHands(snapshot));
      return;
    }

    if (selectedElement.type === "righthand") {
      const index = rightHands.findIndex((rh) => rh.id === selectedElement.id);
      if (index < 0) return;
      const snapshot = [...rightHands];
      const removedNum = checkpointOrder(rightHands[index].label);
      const renumbered = rightHands
        .filter((rh) => rh.id !== selectedElement.id)
        .map((rh) => {
          const num = checkpointOrder(rh.label);
          return num > removedNum ? { ...rh, label: `RH${num - 1}` } : rh;
        });
      setRightHands(renumbered);
      setSelectedElement(null);
      pushUndo(() => setRightHands(snapshot));
      return;
    }

    if (selectedElement.type === "emptybin") {
      if (removeByIdWithUndo(emptyBins, selectedElement.id, setEmptyBins)) {
        setSelectedElement(null);
      }
      return;
    }

    if (selectedElement.type === "forwardedbin") {
      if (removeByIdWithUndo(forwardedBins, selectedElement.id, setForwardedBins)) {
        setSelectedElement(null);
      }
      return;
    }

    if (selectedElement.type === "autosealingmachine") {
      if (!autoSealingMachineAdded) return;
      setAutoSealingMachineAdded(false);
      pushUndo(() => setAutoSealingMachineAdded(true));
      setSelectedElement(null);
      return;
    }

    if (selectedElement.type === "manualsealingmachine") {
      if (!manualSealingMachineAdded) return;
      setManualSealingMachineAdded(false);
      pushUndo(() => setManualSealingMachineAdded(true));
      setSelectedElement(null);
      return;
    }

    if (selectedElement.type === "eyetravel") {
      if (!eyeTravelAdded) return;
      setEyeTravelAdded(false);
      pushUndo(() => setEyeTravelAdded(true));
      setSelectedElement(null);
      return;
    }

    if (selectedElement.type === "table") {
      const snapshot = {
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
      };

      setTable(null);
      setBins([]);
      setPolybags([]);
      setLeftHands([]);
      setRightHands([]);
      setWorkerAdded(false);
      setEmptyBins([]);
      setForwardedBins([]);
      setAutoSealingMachineAdded(false);
      setManualSealingMachineAdded(false);
      setEyeFocusAdded(false);
      setEyeTravelAdded(false);
      pushUndo(() => {
        setTable(snapshot.table);
        setBins(snapshot.bins);
        setPolybags(snapshot.polybags);
        setLeftHands(snapshot.leftHands);
        setRightHands(snapshot.rightHands);
        setWorkerAdded(snapshot.workerAdded);
        setEmptyBins(snapshot.emptyBins);
        setForwardedBins(snapshot.forwardedBins);
        setAutoSealingMachineAdded(snapshot.autoSealingMachineAdded);
        setManualSealingMachineAdded(snapshot.manualSealingMachineAdded);
        setEyeFocusAdded(snapshot.eyeFocusAdded);
        setEyeTravelAdded(snapshot.eyeTravelAdded);
      });
      setSelectedElement(null);
    }
  }

  function handleClearHandNodes(side: "left" | "right") {
    if (side === "left") {
      if (leftHands.length === 0) return;
      const snapshot = leftHands;
      setLeftHands([]);
      if (selectedElement?.type === "lefthand") setSelectedElement(null);
      pushUndo(() => setLeftHands(snapshot));
    } else {
      if (rightHands.length === 0) return;
      const snapshot = rightHands;
      setRightHands([]);
      if (selectedElement?.type === "righthand") setSelectedElement(null);
      pushUndo(() => setRightHands(snapshot));
    }
  }

  return {
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
  };
}
