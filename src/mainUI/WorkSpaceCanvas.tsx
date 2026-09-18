import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { Stage, Layer, Line, Text } from "react-konva";
import type { WorkspaceCanvasProps } from "../types/propsUI.types";
import type {
  BinType,
  FinishedBinInstance,
  TableLayout,
} from "../types/components.types";

import WorkTable from "../components/WorkTable";
import IdlePosition from "../components/IdlePosition";
import Bin from "../components/Bin";
import Polybag from "../components/Polybag";
import HandPath from "../components/HandPath";
import FinishedProdBin from "../components/FinishedProdBin";
import AutoSealingMachine from "../components/AutoSealingMachine";
import ManualSealingMachine from "../components/ManualSealingMachine";
import {
  AUTO_SEALING_MACHINE_WIDTH,
  AUTO_SEALING_MACHINE_HEIGHT,
} from "../utils/autoSealingMachine";
import {
  MANUAL_SEALING_MACHINE_WIDTH,
  MANUAL_SEALING_MACHINE_HEIGHT,
} from "../utils/manualSealingMachine";
import { getTableDistanceCm } from "../utils/distance";
import { IDLE_POSITION_RADIUS } from "../utils/idlePosition";
import { arePointsOverlapping } from "../utils/nodeOverlap";
import { useCanvasCtrlWheelZoom } from "../keybinds/useCanvasCtrlWheelZoom";
import { useCanvasSpaceCenter } from "../keybinds/useCanvasSpaceCenter";
import { useUndoKeybind } from "../keybinds/useUndoKeybind";
import { useDeleteKeybind } from "../keybinds/useDeleteKeybind";
import { useCancelDrawKeybind } from "../keybinds/useCancelDrawKeybind";
import {
  CanvasActionControls,
  CanvasZoomControls,
} from "./workspace/workspaceCanvas/CanvasControls";
import { useCanvasMenuActions } from "./workspace/workspaceCanvas/useCanvasMenuActions";
import {
  getGridLines,
  GRID_STROKE,
  GRID_STROKE_WIDTH,
  TABLE_GRID_STROKE,
  TABLE_GRID_STROKE_WIDTH,
} from "../styles/grid";

export default function WorkspaceCanvas({
  canvasRef,
  layoutName,
  onLayoutNameChange,
  layoutNameMissing,
  layoutNameInputRef,
  bins,
  setBins,
  polybags,
  setPolybags,
  leftHands,
  rightHands,
  table,
  tableLayout,
  onOpenTableDialog,
  worker,
  setWorker,
  emptyBins,
  setEmptyBins,
  forwardedBins,
  setForwardedBins,
  autoSealingMachine,
  setAutoSealingMachine,
  manualSealingMachine,
  setManualSealingMachine,
  workerAdded,
  autoSealingMachineAdded,
  manualSealingMachineAdded,
  eyeFocusAdded,
  eyeFocusCount,
  eyeTravelAdded,
  eyeTravelCount,
  eyeTravelConfigured,
  selectedElement,
  setSelectedElement,
  onUndo,
  canUndo,
  onDeleteSelected,
  canDeleteSelected,
  drawingHand,
  onAddHandNode,
  onRemoveLastHandNode,
  onFinishDrawing,
  onDragHandNode,
  onResumeDraw,
  distanceWarnings,
}: WorkspaceCanvasProps) {
  // Must equal IDLE_POSITION_RADIUS exactly — drawing this any larger than
  // the actual snap radius used in useMTMCalculation.ts creates a visual
  // "dead zone" where a node looks safely inside the circle but distance
  // calculations still treat it as a plain, un-snapped point.
  const WORKER_RADIUS = IDLE_POSITION_RADIUS;
  const ELEMENT_SIZE = 100;
  const ELEMENT_CENTER_OFFSET = ELEMENT_SIZE / 2;
  const CANVAS_WIDTH = 1400;
  const CANVAS_HEIGHT = 900;
  const HAND_COLORS = { left: "#16a34a", right: "#9333ea" } as const;

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [isCanvasHovered, setIsCanvasHovered] = useState(false);
  const [isCanvasFocused, setIsCanvasFocused] = useState(false);
  const [previewPoint, setPreviewPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [zoom, setZoom] = useState(1);
  const isCanvasActive = isCanvasHovered || isCanvasFocused;

  const zoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.1, 2));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => Math.max(z - 0.1, 0.4));
  }, []);

  const resetZoom = useCallback(() => {
    setZoom(1);
  }, []);

  useCanvasCtrlWheelZoom(scrollContainerRef, setZoom, {
    minZoom: 0.4,
    maxZoom: 2,
    step: 0.1,
    enabled: isCanvasActive,
  });

  useUndoKeybind(onUndo, { enabled: canUndo && isCanvasActive });
  useDeleteKeybind(onDeleteSelected, {
    enabled: canDeleteSelected && isCanvasActive,
  });
  useCancelDrawKeybind(
    () => {
      onFinishDrawing();
      setPreviewPoint(null);
    },
    { enabled: Boolean(drawingHand) },
  );

  useCanvasMenuActions({ canUndo, onUndo, zoomIn, zoomOut, resetZoom });

  const centerCanvasView = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const scaledCanvasWidth = CANVAS_WIDTH * zoom;
    const scaledCanvasHeight = CANVAS_HEIGHT * zoom;

    container.scrollLeft = Math.max(
      0,
      (scaledCanvasWidth - container.clientWidth) / 2,
    );
    container.scrollTop = Math.max(
      0,
      (scaledCanvasHeight - container.clientHeight) / 2,
    );
  }, [zoom]);

  useEffect(() => {
    centerCanvasView();
  }, [tableLayout, centerCanvasView]);

  useCanvasSpaceCenter(centerCanvasView, { enabled: isCanvasHovered });

  const setContainerRef = (node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;
    canvasRef(node);
  };

  const gridLines = getGridLines(CANVAS_WIDTH, CANVAS_HEIGHT);

  const clampToTableBounds = (pos: { x: number; y: number }) => {
    if (!tableLayout) return pos;
    return {
      x: Math.max(
        tableLayout.x,
        Math.min(pos.x, tableLayout.x + tableLayout.width),
      ),
      y: Math.max(
        tableLayout.y,
        Math.min(pos.y, tableLayout.y + tableLayout.height),
      ),
    };
  };

  const renderGrid = () => (
    <>
      {gridLines.vertical.map((x) => (
        <Line
          key={`grid-v-${x}`}
          points={[x, 0, x, CANVAS_HEIGHT]}
          stroke={GRID_STROKE}
          strokeWidth={GRID_STROKE_WIDTH}
        />
      ))}
      {gridLines.horizontal.map((y) => (
        <Line
          key={`grid-h-${y}`}
          points={[0, y, CANVAS_WIDTH, y]}
          stroke={GRID_STROKE}
          strokeWidth={GRID_STROKE_WIDTH}
        />
      ))}
    </>
  );

  const renderTableGrid = (layout: TableLayout) => {
    const tableLeft = layout.x;
    const tableTop = layout.y;
    const tableRight = layout.x + layout.width;
    const tableBottom = layout.y + layout.height;

    return (
      <>
        {gridLines.vertical
          .filter((x) => x >= tableLeft && x <= tableRight)
          .map((x) => (
            <Line
              key={`table-grid-v-${x}`}
              points={[x, tableTop, x, tableBottom]}
              stroke={TABLE_GRID_STROKE}
              strokeWidth={TABLE_GRID_STROKE_WIDTH}
            />
          ))}
        {gridLines.horizontal
          .filter((y) => y >= tableTop && y <= tableBottom)
          .map((y) => (
            <Line
              key={`table-grid-h-${y}`}
              points={[tableLeft, y, tableRight, y]}
              stroke={TABLE_GRID_STROKE}
              strokeWidth={TABLE_GRID_STROKE_WIDTH}
            />
          ))}
      </>
    );
  };

  if (!table || !tableLayout) {
    return (
      <div
        className="workspace-canvas-shell"
        tabIndex={0}
        onMouseEnter={() => setIsCanvasHovered(true)}
        onMouseLeave={() => setIsCanvasHovered(false)}
        onFocus={() => setIsCanvasFocused(true)}
        onBlur={() => setIsCanvasFocused(false)}
      >
        <input
          type="text"
          className={
            layoutNameMissing
              ? "workspace-canvas-name-input workspace-canvas-name-input-missing"
              : "workspace-canvas-name-input"
          }
          placeholder={
            layoutNameMissing ? "Enter a name before exporting" : "Name this workstation layout"
          }
          value={layoutName}
          onChange={(e) => onLayoutNameChange(e.target.value)}
          ref={layoutNameInputRef}
        />
        <CanvasActionControls
          canUndo={canUndo}
          canDeleteSelected={canDeleteSelected}
          onUndo={onUndo}
          onDeleteSelected={onDeleteSelected}
        />
        <CanvasZoomControls
          zoom={zoom}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetZoom={resetZoom}
        />
        <div ref={setContainerRef} className="workspace-canvas-viewport">
          <div
            className="workspace-canvas-content-frame"
            style={{
              width: CANVAS_WIDTH * zoom,
              height: CANVAS_HEIGHT * zoom,
            }}
          >
            <div
              className="workspace-canvas-content"
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
            >
              <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
                <Layer>{renderGrid()}</Layer>
                <Layer>
                  <Text
                    x={0}
                    y={CANVAS_HEIGHT / 2 + 40}
                    width={CANVAS_WIDTH}
                    text="Click + to set up your Work Station"
                    align="center"
                    fontSize={16}
                    fill="#9ca3af"
                  />
                </Layer>
              </Stage>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenTableDialog}
          aria-label="Set up Work Station"
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "none",
            background: "#2563eb",
            color: "white",
            fontSize: 32,
            lineHeight: 1,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.4)",
          }}
        >
          +
        </button>
      </div>
    );
  }

  const autoSealingMachineCenterX =
    autoSealingMachine.x + AUTO_SEALING_MACHINE_WIDTH / 2;
  const autoSealingMachineCenterY =
    autoSealingMachine.y + AUTO_SEALING_MACHINE_HEIGHT / 2;

  const manualSealingMachineCenterX =
    manualSealingMachine.x + MANUAL_SEALING_MACHINE_WIDTH / 2;
  const manualSealingMachineCenterY =
    manualSealingMachine.y + MANUAL_SEALING_MACHINE_HEIGHT / 2;

  const leftHandPixels = leftHands.map((lh) => ({
    id: lh.id,
    x: tableLayout.x + lh.xPercent * tableLayout.width,
    y: tableLayout.y + lh.yPercent * tableLayout.height,
  }));
  const rightHandPixels = rightHands.map((rh) => ({
    id: rh.id,
    x: tableLayout.x + rh.xPercent * tableLayout.width,
    y: tableLayout.y + rh.yPercent * tableLayout.height,
  }));

  const overlappingLeftIds = new Set<string>();
  const overlappingRightIds = new Set<string>();
  for (const lh of leftHandPixels) {
    for (const rh of rightHandPixels) {
      if (arePointsOverlapping(lh, rh)) {
        overlappingLeftIds.add(lh.id);
        overlappingRightIds.add(rh.id);
      }
    }
  }

  return (
    <div
      className="workspace-canvas-shell"
      tabIndex={0}
      onMouseEnter={() => setIsCanvasHovered(true)}
      onMouseLeave={() => setIsCanvasHovered(false)}
      onFocus={() => setIsCanvasFocused(true)}
      onBlur={() => setIsCanvasFocused(false)}
    >
      <input
        type="text"
        className={
          layoutNameMissing
            ? "workspace-canvas-name-input workspace-canvas-name-input-missing"
            : "workspace-canvas-name-input"
        }
        placeholder={
          layoutNameMissing ? "Enter a name before exporting" : "Name this workstation layout"
        }
        value={layoutName}
        onChange={(e) => onLayoutNameChange(e.target.value)}
        ref={layoutNameInputRef}
      />
      <CanvasActionControls
        canUndo={canUndo}
        canDeleteSelected={canDeleteSelected}
        onUndo={onUndo}
        onDeleteSelected={onDeleteSelected}
      />
      <CanvasZoomControls
        zoom={zoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
      />

      <div ref={setContainerRef} className="workspace-canvas-viewport">
        <div
          className="workspace-canvas-content-frame"
          style={{
            width: CANVAS_WIDTH * zoom,
            height: CANVAS_HEIGHT * zoom,
          }}
        >
          <div
            className="workspace-canvas-content"
            style={{
              width: CANVAS_WIDTH,
              height: CANVAS_HEIGHT,
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            <Stage
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              onMouseMove={(e) => {
                if (!drawingHand) return;
                const pos = e.target.getStage()?.getPointerPosition();
                if (pos) setPreviewPoint(clampToTableBounds(pos));
              }}
              onClick={(e) => {
                if (!drawingHand || !tableLayout) return;
                const pos = e.target.getStage()?.getPointerPosition();
                if (!pos) return;
                const clamped = clampToTableBounds(pos);
                onAddHandNode(
                  drawingHand,
                  (clamped.x - tableLayout.x) / tableLayout.width,
                  (clamped.y - tableLayout.y) / tableLayout.height,
                );
              }}
              onDblClick={() => {
                if (!drawingHand) return;
                onRemoveLastHandNode(drawingHand);
                onFinishDrawing();
                setPreviewPoint(null);
              }}
            >
              <Layer>{renderGrid()}</Layer>
              <Layer>
                <WorkTable
                  x={tableLayout.x}
                  y={tableLayout.y}
                  width={tableLayout.width}
                  height={tableLayout.height}
                  widthCm={table.lengthCm}
                  heightCm={table.widthCm}
                  selected={selectedElement?.type === "table"}
                  onSelect={() =>
                    setSelectedElement({
                      type: "table",
                    })
                  }
                />
                {renderTableGrid(tableLayout)}

                {eyeFocusAdded && (
                  <Text
                    x={tableLayout.x}
                    y={tableLayout.y - 22}
                    width={120}
                    align="left"
                    text={`Eye Focus : ${eyeFocusCount}`}
                    fill={eyeFocusCount === 0 ? "#9ca3af" : "#111"}
                    fontSize={14}
                    fontStyle="bold"
                  />
                )}

                {eyeTravelAdded && (
                  <Text
                    x={tableLayout.x + 130}
                    y={tableLayout.y - 22}
                    width={110}
                    align="left"
                    text={`Eye Travel : ${eyeTravelCount}`}
                    fill={
                      selectedElement?.type === "eyetravel"
                        ? "#f59e0b"
                        : eyeTravelCount === 0
                          ? "#9ca3af"
                          : "#111"
                    }
                    fontSize={14}
                    fontStyle="bold"
                    onClick={() => setSelectedElement({ type: "eyetravel" })}
                    onTap={() => setSelectedElement({ type: "eyetravel" })}
                  />
                )}

                {eyeTravelAdded && !eyeTravelConfigured && (
                  <Text
                    x={tableLayout.x + 242}
                    y={tableLayout.y - 20}
                    width={180}
                    align="left"
                    text="(Set D & T below — distance is 0)"
                    fill="#dc2626"
                    fontSize={11}
                    fontStyle="italic"
                    onClick={() => setSelectedElement({ type: "eyetravel" })}
                    onTap={() => setSelectedElement({ type: "eyetravel" })}
                  />
                )}

                {emptyBins.map((finishedBin, index) => {
                  const x = tableLayout.x + finishedBin.xPercent * tableLayout.width;
                  const y = tableLayout.y + finishedBin.yPercent * tableLayout.height;
                  const binCenterX = x + ELEMENT_CENTER_OFFSET;
                  const binCenterY = y + ELEMENT_CENTER_OFFSET;

                  const isSelected =
                    selectedElement?.type === "emptybin" &&
                    selectedElement.id === finishedBin.id;

                  type NearEntry = {
                    line: number[];
                    label: { x: number; y: number; text: string };
                  };
                  const nearEntries: NearEntry[] = [];

                  if (isSelected && emptyBins.length > 1) {
                    const others = emptyBins.filter((other) => other.id !== finishedBin.id);

                    let nearestBin: FinishedBinInstance | null = null;
                    let nearestDistSq = Infinity;
                    for (const other of others) {
                      const dx = (other.xPercent - finishedBin.xPercent) * table.lengthCm;
                      const dy = (other.yPercent - finishedBin.yPercent) * table.widthCm;
                      const distSq = dx * dx + dy * dy;
                      if (distSq < nearestDistSq) {
                        nearestDistSq = distSq;
                        nearestBin = other;
                      }
                    }

                    if (nearestBin) {
                      const nx =
                        tableLayout.x +
                        nearestBin.xPercent * tableLayout.width +
                        ELEMENT_CENTER_OFFSET;
                      const ny =
                        tableLayout.y +
                        nearestBin.yPercent * tableLayout.height +
                        ELEMENT_CENTER_OFFSET;
                      nearEntries.push({
                        line: [binCenterX, binCenterY, nx, ny],
                        label: {
                          x: (binCenterX + nx) / 2,
                          y: (binCenterY + ny) / 2,
                          text: `${Math.round(Math.sqrt(nearestDistSq))} cm`,
                        },
                      });
                    }
                  }

                  return (
                    <Fragment key={finishedBin.id}>
                      {nearEntries.map((entry, i) => (
                        <Fragment key={i}>
                          <Line
                            points={entry.line}
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            dash={[8, 5]}
                          />
                          <Text
                            x={entry.label.x - 24}
                            y={entry.label.y - 10}
                            text={entry.label.text}
                            fill="#f59e0b"
                            fontSize={13}
                            fontStyle="bold"
                          />
                        </Fragment>
                      ))}

                      {isSelected &&
                        (() => {
                          const distLeft = binCenterX - tableLayout.x;
                          const distRight =
                            tableLayout.x + tableLayout.width - binCenterX;
                          const distTop = binCenterY - tableLayout.y;
                          const distBottom =
                            tableLayout.y + tableLayout.height - binCenterY;

                          const nearX =
                            distLeft <= distRight
                              ? tableLayout.x
                              : tableLayout.x + tableLayout.width;
                          const nearY =
                            distTop <= distBottom
                              ? tableLayout.y
                              : tableLayout.y + tableLayout.height;

                          const xCm = Math.round(
                            Math.min(distLeft, distRight) *
                              (table.lengthCm / tableLayout.width),
                          );
                          const yCm = Math.round(
                            Math.min(distTop, distBottom) *
                              (table.widthCm / tableLayout.height),
                          );

                          return (
                            <>
                              <Line
                                points={[binCenterX, binCenterY, nearX, binCenterY]}
                                stroke="#2563eb"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={(binCenterX + nearX) / 2 - 20}
                                y={binCenterY - 20}
                                text={`${xCm} cm`}
                                fill="#2563eb"
                                fontSize={13}
                                fontStyle="bold"
                              />
                              <Line
                                points={[binCenterX, binCenterY, binCenterX, nearY]}
                                stroke="#2563eb"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={binCenterX + 8}
                                y={(binCenterY + nearY) / 2 - 8}
                                text={`${yCm} cm`}
                                fill="#2563eb"
                                fontSize={13}
                                fontStyle="bold"
                              />
                            </>
                          );
                        })()}

                      {isSelected &&
                        workerAdded &&
                        (() => {
                          const dist = getTableDistanceCm(
                            worker.x,
                            worker.y,
                            binCenterX,
                            binCenterY,
                            tableLayout.x,
                            tableLayout.y,
                            tableLayout.width,
                            tableLayout.height,
                            table.lengthCm,
                            table.widthCm,
                          );
                          return (
                            <>
                              <Line
                                points={[binCenterX, binCenterY, worker.x, worker.y]}
                                stroke="#6b7280"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={(binCenterX + worker.x) / 2 - 24}
                                y={(binCenterY + worker.y) / 2 - 14}
                                text={`${dist} cm`}
                                fill="#6b7280"
                                fontSize={13}
                                fontStyle="bold"
                              />
                            </>
                          );
                        })()}

                      <FinishedProdBin
                        x={x}
                        y={y}
                        minX={tableLayout.x - 50}
                        minY={tableLayout.y - 50}
                        maxX={tableLayout.x + tableLayout.width - 50}
                        maxY={tableLayout.y + tableLayout.height - 50}
                        selected={isSelected}
                        binType="empty"
                        onSelect={() => setSelectedElement({ type: "emptybin", id: finishedBin.id })}
                        onDragEnd={(newX, newY) => {
                          const clampedX = Math.max(
                            tableLayout.x - 50,
                            Math.min(newX, tableLayout.x + tableLayout.width - 50),
                          );
                          const clampedY = Math.max(
                            tableLayout.y - 50,
                            Math.min(newY, tableLayout.y + tableLayout.height - 50),
                          );
                          setEmptyBins((prev) =>
                            prev.map((b, i) =>
                              i === index
                                ? {
                                    ...b,
                                    xPercent: (clampedX - tableLayout.x) / tableLayout.width,
                                    yPercent: (clampedY - tableLayout.y) / tableLayout.height,
                                  }
                                : b,
                            ),
                          );
                        }}
                      />
                    </Fragment>
                  );
                })}

                {forwardedBins.map((finishedBin, index) => {
                  const x = tableLayout.x + finishedBin.xPercent * tableLayout.width;
                  const y = tableLayout.y + finishedBin.yPercent * tableLayout.height;
                  const binCenterX = x + ELEMENT_CENTER_OFFSET;
                  const binCenterY = y + ELEMENT_CENTER_OFFSET;

                  const isSelected =
                    selectedElement?.type === "forwardedbin" &&
                    selectedElement.id === finishedBin.id;

                  type NearEntry = {
                    line: number[];
                    label: { x: number; y: number; text: string };
                  };
                  const nearEntries: NearEntry[] = [];

                  if (isSelected && forwardedBins.length > 1) {
                    const others = forwardedBins.filter((other) => other.id !== finishedBin.id);

                    let nearestBin: FinishedBinInstance | null = null;
                    let nearestDistSq = Infinity;
                    for (const other of others) {
                      const dx = (other.xPercent - finishedBin.xPercent) * table.lengthCm;
                      const dy = (other.yPercent - finishedBin.yPercent) * table.widthCm;
                      const distSq = dx * dx + dy * dy;
                      if (distSq < nearestDistSq) {
                        nearestDistSq = distSq;
                        nearestBin = other;
                      }
                    }

                    if (nearestBin) {
                      const nx =
                        tableLayout.x +
                        nearestBin.xPercent * tableLayout.width +
                        ELEMENT_CENTER_OFFSET;
                      const ny =
                        tableLayout.y +
                        nearestBin.yPercent * tableLayout.height +
                        ELEMENT_CENTER_OFFSET;
                      nearEntries.push({
                        line: [binCenterX, binCenterY, nx, ny],
                        label: {
                          x: (binCenterX + nx) / 2,
                          y: (binCenterY + ny) / 2,
                          text: `${Math.round(Math.sqrt(nearestDistSq))} cm`,
                        },
                      });
                    }
                  }

                  return (
                    <Fragment key={finishedBin.id}>
                      {nearEntries.map((entry, i) => (
                        <Fragment key={i}>
                          <Line
                            points={entry.line}
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            dash={[8, 5]}
                          />
                          <Text
                            x={entry.label.x - 24}
                            y={entry.label.y - 10}
                            text={entry.label.text}
                            fill="#f59e0b"
                            fontSize={13}
                            fontStyle="bold"
                          />
                        </Fragment>
                      ))}

                      {isSelected &&
                        (() => {
                          const distLeft = binCenterX - tableLayout.x;
                          const distRight =
                            tableLayout.x + tableLayout.width - binCenterX;
                          const distTop = binCenterY - tableLayout.y;
                          const distBottom =
                            tableLayout.y + tableLayout.height - binCenterY;

                          const nearX =
                            distLeft <= distRight
                              ? tableLayout.x
                              : tableLayout.x + tableLayout.width;
                          const nearY =
                            distTop <= distBottom
                              ? tableLayout.y
                              : tableLayout.y + tableLayout.height;

                          const xCm = Math.round(
                            Math.min(distLeft, distRight) *
                              (table.lengthCm / tableLayout.width),
                          );
                          const yCm = Math.round(
                            Math.min(distTop, distBottom) *
                              (table.widthCm / tableLayout.height),
                          );

                          return (
                            <>
                              <Line
                                points={[binCenterX, binCenterY, nearX, binCenterY]}
                                stroke="#2563eb"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={(binCenterX + nearX) / 2 - 20}
                                y={binCenterY - 20}
                                text={`${xCm} cm`}
                                fill="#2563eb"
                                fontSize={13}
                                fontStyle="bold"
                              />
                              <Line
                                points={[binCenterX, binCenterY, binCenterX, nearY]}
                                stroke="#2563eb"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={binCenterX + 8}
                                y={(binCenterY + nearY) / 2 - 8}
                                text={`${yCm} cm`}
                                fill="#2563eb"
                                fontSize={13}
                                fontStyle="bold"
                              />
                            </>
                          );
                        })()}

                      {isSelected &&
                        workerAdded &&
                        (() => {
                          const dist = getTableDistanceCm(
                            worker.x,
                            worker.y,
                            binCenterX,
                            binCenterY,
                            tableLayout.x,
                            tableLayout.y,
                            tableLayout.width,
                            tableLayout.height,
                            table.lengthCm,
                            table.widthCm,
                          );
                          return (
                            <>
                              <Line
                                points={[binCenterX, binCenterY, worker.x, worker.y]}
                                stroke="#6b7280"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={(binCenterX + worker.x) / 2 - 24}
                                y={(binCenterY + worker.y) / 2 - 14}
                                text={`${dist} cm`}
                                fill="#6b7280"
                                fontSize={13}
                                fontStyle="bold"
                              />
                            </>
                          );
                        })()}

                      <FinishedProdBin
                        x={x}
                        y={y}
                        minX={tableLayout.x - 50}
                        minY={tableLayout.y - 50}
                        maxX={tableLayout.x + tableLayout.width - 50}
                        maxY={tableLayout.y + tableLayout.height - 50}
                        selected={isSelected}
                        binType="forwarded"
                        onSelect={() => setSelectedElement({ type: "forwardedbin", id: finishedBin.id })}
                        onDragEnd={(newX, newY) => {
                          const clampedX = Math.max(
                            tableLayout.x - 50,
                            Math.min(newX, tableLayout.x + tableLayout.width - 50),
                          );
                          const clampedY = Math.max(
                            tableLayout.y - 50,
                            Math.min(newY, tableLayout.y + tableLayout.height - 50),
                          );
                          setForwardedBins((prev) =>
                            prev.map((b, i) =>
                              i === index
                                ? {
                                    ...b,
                                    xPercent: (clampedX - tableLayout.x) / tableLayout.width,
                                    yPercent: (clampedY - tableLayout.y) / tableLayout.height,
                                  }
                                : b,
                            ),
                          );
                        }}
                      />
                    </Fragment>
                  );
                })}

                {autoSealingMachineAdded && (
                  <AutoSealingMachine
                    x={autoSealingMachine.x}
                    y={autoSealingMachine.y}
                    minX={tableLayout.x - AUTO_SEALING_MACHINE_WIDTH / 2}
                    minY={tableLayout.y - AUTO_SEALING_MACHINE_HEIGHT / 2}
                    maxX={
                      tableLayout.x + tableLayout.width - AUTO_SEALING_MACHINE_WIDTH / 2
                    }
                    maxY={
                      tableLayout.y + tableLayout.height - AUTO_SEALING_MACHINE_HEIGHT / 2
                    }
                    selected={selectedElement?.type === "autosealingmachine"}
                    onSelect={() => setSelectedElement({ type: "autosealingmachine" })}
                    onDragEnd={(newX, newY) => {
                      const clampedX = Math.max(
                        tableLayout.x - AUTO_SEALING_MACHINE_WIDTH / 2,
                        Math.min(
                          newX,
                          tableLayout.x + tableLayout.width - AUTO_SEALING_MACHINE_WIDTH / 2,
                        ),
                      );

                      const clampedY = Math.max(
                        tableLayout.y - AUTO_SEALING_MACHINE_HEIGHT / 2,
                        Math.min(
                          newY,
                          tableLayout.y + tableLayout.height - AUTO_SEALING_MACHINE_HEIGHT / 2,
                        ),
                      );

                      setAutoSealingMachine({
                        xPercent:
                          (clampedX - tableLayout.x) / tableLayout.width,
                        yPercent:
                          (clampedY - tableLayout.y) / tableLayout.height,
                      });
                    }}
                  />
                )}

                {autoSealingMachineAdded &&
                  selectedElement?.type === "autosealingmachine" &&
                  (() => {
                    const distLeft = autoSealingMachineCenterX - tableLayout.x;
                    const distRight =
                      tableLayout.x + tableLayout.width - autoSealingMachineCenterX;
                    const distTop = autoSealingMachineCenterY - tableLayout.y;
                    const distBottom =
                      tableLayout.y + tableLayout.height - autoSealingMachineCenterY;

                    const nearX =
                      distLeft <= distRight
                        ? tableLayout.x
                        : tableLayout.x + tableLayout.width;
                    const nearY =
                      distTop <= distBottom
                        ? tableLayout.y
                        : tableLayout.y + tableLayout.height;

                    const xCm = Math.round(
                      Math.min(distLeft, distRight) *
                        (table.lengthCm / tableLayout.width),
                    );
                    const yCm = Math.round(
                      Math.min(distTop, distBottom) *
                        (table.widthCm / tableLayout.height),
                    );

                    return (
                      <>
                        <Line
                          points={[
                            autoSealingMachineCenterX,
                            autoSealingMachineCenterY,
                            nearX,
                            autoSealingMachineCenterY,
                          ]}
                          stroke="#2563eb"
                          strokeWidth={1.5}
                          dash={[6, 4]}
                        />
                        <Text
                          x={(autoSealingMachineCenterX + nearX) / 2 - 20}
                          y={autoSealingMachineCenterY - 20}
                          text={`${xCm} cm`}
                          fill="#2563eb"
                          fontSize={13}
                          fontStyle="bold"
                        />
                        <Line
                          points={[
                            autoSealingMachineCenterX,
                            autoSealingMachineCenterY,
                            autoSealingMachineCenterX,
                            nearY,
                          ]}
                          stroke="#2563eb"
                          strokeWidth={1.5}
                          dash={[6, 4]}
                        />
                        <Text
                          x={autoSealingMachineCenterX + 8}
                          y={(autoSealingMachineCenterY + nearY) / 2 - 8}
                          text={`${yCm} cm`}
                          fill="#2563eb"
                          fontSize={13}
                          fontStyle="bold"
                        />

                        {workerAdded &&
                          (() => {
                            const dist = getTableDistanceCm(
                              worker.x,
                              worker.y,
                              autoSealingMachineCenterX,
                              autoSealingMachineCenterY,
                              tableLayout.x,
                              tableLayout.y,
                              tableLayout.width,
                              tableLayout.height,
                              table.lengthCm,
                              table.widthCm,
                            );
                            return (
                              <>
                                <Line
                                  points={[
                                    autoSealingMachineCenterX,
                                    autoSealingMachineCenterY,
                                    worker.x,
                                    worker.y,
                                  ]}
                                  stroke="#6b7280"
                                  strokeWidth={1.5}
                                  dash={[6, 4]}
                                />
                                <Text
                                  x={(autoSealingMachineCenterX + worker.x) / 2 - 24}
                                  y={(autoSealingMachineCenterY + worker.y) / 2 - 14}
                                  text={`${dist} cm`}
                                  fill="#6b7280"
                                  fontSize={13}
                                  fontStyle="bold"
                                />
                              </>
                            );
                          })()}
                      </>
                    );
                  })()}

                {manualSealingMachineAdded && (
                  <ManualSealingMachine
                    x={manualSealingMachine.x}
                    y={manualSealingMachine.y}
                    minX={tableLayout.x - MANUAL_SEALING_MACHINE_WIDTH / 2}
                    minY={tableLayout.y - MANUAL_SEALING_MACHINE_HEIGHT / 2}
                    maxX={
                      tableLayout.x + tableLayout.width - MANUAL_SEALING_MACHINE_WIDTH / 2
                    }
                    maxY={
                      tableLayout.y + tableLayout.height - MANUAL_SEALING_MACHINE_HEIGHT / 2
                    }
                    selected={selectedElement?.type === "manualsealingmachine"}
                    onSelect={() => setSelectedElement({ type: "manualsealingmachine" })}
                    onDragEnd={(newX, newY) => {
                      const clampedX = Math.max(
                        tableLayout.x - MANUAL_SEALING_MACHINE_WIDTH / 2,
                        Math.min(
                          newX,
                          tableLayout.x + tableLayout.width - MANUAL_SEALING_MACHINE_WIDTH / 2,
                        ),
                      );

                      const clampedY = Math.max(
                        tableLayout.y - MANUAL_SEALING_MACHINE_HEIGHT / 2,
                        Math.min(
                          newY,
                          tableLayout.y + tableLayout.height - MANUAL_SEALING_MACHINE_HEIGHT / 2,
                        ),
                      );

                      setManualSealingMachine({
                        xPercent:
                          (clampedX - tableLayout.x) / tableLayout.width,
                        yPercent:
                          (clampedY - tableLayout.y) / tableLayout.height,
                      });
                    }}
                  />
                )}

                {manualSealingMachineAdded &&
                  selectedElement?.type === "manualsealingmachine" &&
                  (() => {
                    const distLeft = manualSealingMachineCenterX - tableLayout.x;
                    const distRight =
                      tableLayout.x + tableLayout.width - manualSealingMachineCenterX;
                    const distTop = manualSealingMachineCenterY - tableLayout.y;
                    const distBottom =
                      tableLayout.y + tableLayout.height - manualSealingMachineCenterY;

                    const nearX =
                      distLeft <= distRight
                        ? tableLayout.x
                        : tableLayout.x + tableLayout.width;
                    const nearY =
                      distTop <= distBottom
                        ? tableLayout.y
                        : tableLayout.y + tableLayout.height;

                    const xCm = Math.round(
                      Math.min(distLeft, distRight) *
                        (table.lengthCm / tableLayout.width),
                    );
                    const yCm = Math.round(
                      Math.min(distTop, distBottom) *
                        (table.widthCm / tableLayout.height),
                    );

                    return (
                      <>
                        <Line
                          points={[
                            manualSealingMachineCenterX,
                            manualSealingMachineCenterY,
                            nearX,
                            manualSealingMachineCenterY,
                          ]}
                          stroke="#2563eb"
                          strokeWidth={1.5}
                          dash={[6, 4]}
                        />
                        <Text
                          x={(manualSealingMachineCenterX + nearX) / 2 - 20}
                          y={manualSealingMachineCenterY - 20}
                          text={`${xCm} cm`}
                          fill="#2563eb"
                          fontSize={13}
                          fontStyle="bold"
                        />
                        <Line
                          points={[
                            manualSealingMachineCenterX,
                            manualSealingMachineCenterY,
                            manualSealingMachineCenterX,
                            nearY,
                          ]}
                          stroke="#2563eb"
                          strokeWidth={1.5}
                          dash={[6, 4]}
                        />
                        <Text
                          x={manualSealingMachineCenterX + 8}
                          y={(manualSealingMachineCenterY + nearY) / 2 - 8}
                          text={`${yCm} cm`}
                          fill="#2563eb"
                          fontSize={13}
                          fontStyle="bold"
                        />

                        {workerAdded &&
                          (() => {
                            const dist = getTableDistanceCm(
                              worker.x,
                              worker.y,
                              manualSealingMachineCenterX,
                              manualSealingMachineCenterY,
                              tableLayout.x,
                              tableLayout.y,
                              tableLayout.width,
                              tableLayout.height,
                              table.lengthCm,
                              table.widthCm,
                            );
                            return (
                              <>
                                <Line
                                  points={[
                                    manualSealingMachineCenterX,
                                    manualSealingMachineCenterY,
                                    worker.x,
                                    worker.y,
                                  ]}
                                  stroke="#6b7280"
                                  strokeWidth={1.5}
                                  dash={[6, 4]}
                                />
                                <Text
                                  x={(manualSealingMachineCenterX + worker.x) / 2 - 24}
                                  y={(manualSealingMachineCenterY + worker.y) / 2 - 14}
                                  text={`${dist} cm`}
                                  fill="#6b7280"
                                  fontSize={13}
                                  fontStyle="bold"
                                />
                              </>
                            );
                          })()}
                      </>
                    );
                  })()}

                {workerAdded &&
                  selectedElement?.type === "worker" &&
                  (() => {
                    const distLeft = worker.x - tableLayout.x;
                    const distRight =
                      tableLayout.x + tableLayout.width - worker.x;
                    const distTop = worker.y - tableLayout.y;
                    const distBottom =
                      tableLayout.y + tableLayout.height - worker.y;

                    const nearX =
                      distLeft <= distRight
                        ? tableLayout.x
                        : tableLayout.x + tableLayout.width;
                    const nearY =
                      distTop <= distBottom
                        ? tableLayout.y
                        : tableLayout.y + tableLayout.height;

                    const xCm = Math.round(
                      Math.min(distLeft, distRight) *
                        (table.lengthCm / tableLayout.width),
                    );
                    const yCm = Math.round(
                      Math.min(distTop, distBottom) *
                        (table.widthCm / tableLayout.height),
                    );

                    return (
                      <>
                        <Line
                          points={[worker.x, worker.y, nearX, worker.y]}
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          dash={[6, 4]}
                        />
                        <Text
                          x={(worker.x + nearX) / 2 - 20}
                          y={worker.y - 20}
                          text={`${xCm} cm`}
                          fill="#f59e0b"
                          fontSize={13}
                          fontStyle="bold"
                        />
                        <Line
                          points={[worker.x, worker.y, worker.x, nearY]}
                          stroke="#f59e0b"
                          strokeWidth={1.5}
                          dash={[6, 4]}
                        />
                        <Text
                          x={worker.x + 8}
                          y={(worker.y + nearY) / 2 - 8}
                          text={`${yCm} cm`}
                          fill="#f59e0b"
                          fontSize={13}
                          fontStyle="bold"
                        />
                      </>
                    );
                  })()}

                {workerAdded && (
                  <IdlePosition
                    x={worker.x}
                    y={worker.y}
                    radius={WORKER_RADIUS}
                    minX={tableLayout.x}
                    minY={tableLayout.y}
                    maxX={tableLayout.x + tableLayout.width}
                    maxY={tableLayout.y + tableLayout.height}
                    selected={selectedElement?.type === "worker"}
                    onSelect={() => setSelectedElement({ type: "worker" })}
                    onDragEnd={(x, y) => {
                      const clampedX = Math.max(
                        tableLayout.x,
                        Math.min(x, tableLayout.x + tableLayout.width),
                      );

                      const clampedY = Math.max(
                        tableLayout.y,
                        Math.min(y, tableLayout.y + tableLayout.height),
                      );

                      setWorker({
                        xPercent:
                          (clampedX - tableLayout.x) / tableLayout.width,
                        yPercent:
                          (clampedY - tableLayout.y) / tableLayout.height,
                      });
                    }}
                  />
                )}

                {bins.map((bin, index) => {
                  const x = tableLayout.x + bin.xPercent * tableLayout.width;
                  const y = tableLayout.y + bin.yPercent * tableLayout.height;
                  const binCenterX = x + ELEMENT_CENTER_OFFSET;
                  const binCenterY = y + ELEMENT_CENTER_OFFSET;

                  const isSelected =
                    selectedElement?.type === "bin" &&
                    selectedElement.id === bin.id;

                  type NearEntry = {
                    line: number[];
                    label: { x: number; y: number; text: string };
                  };
                  const nearEntries: NearEntry[] = [];

                  if (isSelected && bins.length > 1) {
                    const others = bins.filter((other) => other.id !== bin.id);

                    // Single closest other bin, by actual distance — not one
                    // neighbor on each side.
                    let nearestBin: BinType | null = null;
                    let nearestDistSq = Infinity;
                    for (const other of others) {
                      const dx = (other.xPercent - bin.xPercent) * table.lengthCm;
                      const dy = (other.yPercent - bin.yPercent) * table.widthCm;
                      const distSq = dx * dx + dy * dy;
                      if (distSq < nearestDistSq) {
                        nearestDistSq = distSq;
                        nearestBin = other;
                      }
                    }

                    if (nearestBin) {
                      const nx =
                        tableLayout.x +
                        nearestBin.xPercent * tableLayout.width +
                        ELEMENT_CENTER_OFFSET;
                      const ny =
                        tableLayout.y +
                        nearestBin.yPercent * tableLayout.height +
                        ELEMENT_CENTER_OFFSET;
                      nearEntries.push({
                        line: [binCenterX, binCenterY, nx, ny],
                        label: {
                          x: (binCenterX + nx) / 2,
                          y: (binCenterY + ny) / 2,
                          text: `${Math.round(Math.sqrt(nearestDistSq))} cm`,
                        },
                      });
                    }
                  }

                  return (
                    <Fragment key={bin.id}>
                      {nearEntries.map((entry, i) => (
                        <Fragment key={i}>
                          <Line
                            points={entry.line}
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            dash={[8, 5]}
                          />
                          <Text
                            x={entry.label.x - 24}
                            y={entry.label.y - 10}
                            text={entry.label.text}
                            fill="#f59e0b"
                            fontSize={13}
                            fontStyle="bold"
                          />
                        </Fragment>
                      ))}

                      {isSelected &&
                        (() => {
                          const distLeft = binCenterX - tableLayout.x;
                          const distRight =
                            tableLayout.x + tableLayout.width - binCenterX;
                          const distTop = binCenterY - tableLayout.y;
                          const distBottom =
                            tableLayout.y + tableLayout.height - binCenterY;

                          const nearX =
                            distLeft <= distRight
                              ? tableLayout.x
                              : tableLayout.x + tableLayout.width;
                          const nearY =
                            distTop <= distBottom
                              ? tableLayout.y
                              : tableLayout.y + tableLayout.height;

                          const xCm = Math.round(
                            Math.min(distLeft, distRight) *
                              (table.lengthCm / tableLayout.width),
                          );
                          const yCm = Math.round(
                            Math.min(distTop, distBottom) *
                              (table.widthCm / tableLayout.height),
                          );

                          return (
                            <>
                              <Line
                                points={[binCenterX, binCenterY, nearX, binCenterY]}
                                stroke="#2563eb"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={(binCenterX + nearX) / 2 - 20}
                                y={binCenterY - 20}
                                text={`${xCm} cm`}
                                fill="#2563eb"
                                fontSize={13}
                                fontStyle="bold"
                              />
                              <Line
                                points={[binCenterX, binCenterY, binCenterX, nearY]}
                                stroke="#2563eb"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={binCenterX + 8}
                                y={(binCenterY + nearY) / 2 - 8}
                                text={`${yCm} cm`}
                                fill="#2563eb"
                                fontSize={13}
                                fontStyle="bold"
                              />
                            </>
                          );
                        })()}

                      {isSelected &&
                        workerAdded &&
                        (() => {
                          const dist = getTableDistanceCm(
                            worker.x,
                            worker.y,
                            binCenterX,
                            binCenterY,
                            tableLayout.x,
                            tableLayout.y,
                            tableLayout.width,
                            tableLayout.height,
                            table.lengthCm,
                            table.widthCm,
                          );
                          return (
                            <>
                              <Line
                                points={[
                                  binCenterX,
                                  binCenterY,
                                  worker.x,
                                  worker.y,
                                ]}
                                stroke="#6b7280"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={(binCenterX + worker.x) / 2 - 24}
                                y={(binCenterY + worker.y) / 2 - 14}
                                text={`${dist} cm`}
                                fill="#6b7280"
                                fontSize={13}
                                fontStyle="bold"
                              />
                            </>
                          );
                        })()}

                      <Bin
                        x={x}
                        y={y}
                        id={bin.id}
                        label={bin.part}
                        imageUrl={bin.imageUrl}
                        minX={tableLayout.x - 50}
                        minY={tableLayout.y - 50}
                        maxX={tableLayout.x + tableLayout.width - 50}
                        maxY={tableLayout.y + tableLayout.height - 50}
                        selected={
                          selectedElement?.type === "bin" &&
                          selectedElement.id === bin.id
                        }
                        onSelect={() =>
                          setSelectedElement({
                            type: "bin",
                            id: bin.id,
                          })
                        }
                        onDragEnd={(newX, newY) => {
                          const clampedX = Math.max(
                            tableLayout.x - 50,
                            Math.min(
                              newX,
                              tableLayout.x + tableLayout.width - 50,
                            ),
                          );

                          const clampedY = Math.max(
                            tableLayout.y - 50,
                            Math.min(
                              newY,
                              tableLayout.y + tableLayout.height - 50,
                            ),
                          );

                          setBins((prev) =>
                            prev.map((b, i) =>
                              i === index
                                ? {
                                    ...b,
                                    xPercent:
                                      (clampedX - tableLayout.x) /
                                      tableLayout.width,
                                    yPercent:
                                      (clampedY - tableLayout.y) /
                                      tableLayout.height,
                                  }
                                : b,
                            ),
                          );
                        }}
                      />
                    </Fragment>
                  );
                })}

                {polybags.map((pb, index) => {
                  const x = tableLayout.x + pb.xPercent * tableLayout.width;
                  const y = tableLayout.y + pb.yPercent * tableLayout.height;
                  const pbCenterX = x + ELEMENT_CENTER_OFFSET;
                  const pbCenterY = y + ELEMENT_CENTER_OFFSET;

                  const isSelected =
                    selectedElement?.type === "polybag" &&
                    selectedElement.id === pb.id;

                  type NearEntry = {
                    line: number[];
                    label: { x: number; y: number; text: string };
                  };
                  const pbNearEntries: NearEntry[] = [];

                  if (isSelected) {
                    const allNeighbors = [
                      ...bins.map((b) => ({
                        xPercent: b.xPercent,
                        yPercent: b.yPercent,
                      })),
                      ...polybags
                        .filter((p) => p.id !== pb.id)
                        .map((p) => ({
                          xPercent: p.xPercent,
                          yPercent: p.yPercent,
                        })),
                    ];

                    // Single closest other tool, by actual distance — not one
                    // neighbor on each side.
                    let nearestEl: { xPercent: number; yPercent: number } | null = null;
                    let nearestDistSq = Infinity;
                    for (const neighbor of allNeighbors) {
                      const dx = (neighbor.xPercent - pb.xPercent) * table.lengthCm;
                      const dy = (neighbor.yPercent - pb.yPercent) * table.widthCm;
                      const distSq = dx * dx + dy * dy;
                      if (distSq < nearestDistSq) {
                        nearestDistSq = distSq;
                        nearestEl = neighbor;
                      }
                    }

                    if (nearestEl) {
                      const nx =
                        tableLayout.x +
                        nearestEl.xPercent * tableLayout.width +
                        ELEMENT_CENTER_OFFSET;
                      const ny =
                        tableLayout.y +
                        nearestEl.yPercent * tableLayout.height +
                        ELEMENT_CENTER_OFFSET;
                      pbNearEntries.push({
                        line: [pbCenterX, pbCenterY, nx, ny],
                        label: {
                          x: (pbCenterX + nx) / 2,
                          y: (pbCenterY + ny) / 2,
                          text: `${Math.round(Math.sqrt(nearestDistSq))} cm`,
                        },
                      });
                    }
                  }

                  return (
                    <Fragment key={pb.id}>
                      {pbNearEntries.map((entry, i) => (
                        <Fragment key={i}>
                          <Line
                            points={entry.line}
                            stroke="#f59e0b"
                            strokeWidth={1.5}
                            dash={[8, 5]}
                          />
                          <Text
                            x={entry.label.x - 24}
                            y={entry.label.y - 10}
                            text={entry.label.text}
                            fill="#f59e0b"
                            fontSize={13}
                            fontStyle="bold"
                          />
                        </Fragment>
                      ))}

                      {isSelected &&
                        (() => {
                          const distLeft = pbCenterX - tableLayout.x;
                          const distRight =
                            tableLayout.x + tableLayout.width - pbCenterX;
                          const distTop = pbCenterY - tableLayout.y;
                          const distBottom =
                            tableLayout.y + tableLayout.height - pbCenterY;

                          const nearX =
                            distLeft <= distRight
                              ? tableLayout.x
                              : tableLayout.x + tableLayout.width;
                          const nearY =
                            distTop <= distBottom
                              ? tableLayout.y
                              : tableLayout.y + tableLayout.height;

                          const xCm = Math.round(
                            Math.min(distLeft, distRight) *
                              (table.lengthCm / tableLayout.width),
                          );
                          const yCm = Math.round(
                            Math.min(distTop, distBottom) *
                              (table.widthCm / tableLayout.height),
                          );

                          return (
                            <>
                              <Line
                                points={[pbCenterX, pbCenterY, nearX, pbCenterY]}
                                stroke="#2563eb"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={(pbCenterX + nearX) / 2 - 20}
                                y={pbCenterY - 20}
                                text={`${xCm} cm`}
                                fill="#2563eb"
                                fontSize={13}
                                fontStyle="bold"
                              />
                              <Line
                                points={[pbCenterX, pbCenterY, pbCenterX, nearY]}
                                stroke="#2563eb"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={pbCenterX + 8}
                                y={(pbCenterY + nearY) / 2 - 8}
                                text={`${yCm} cm`}
                                fill="#2563eb"
                                fontSize={13}
                                fontStyle="bold"
                              />
                            </>
                          );
                        })()}

                      {isSelected &&
                        workerAdded &&
                        (() => {
                          const dist = getTableDistanceCm(
                            worker.x,
                            worker.y,
                            pbCenterX,
                            pbCenterY,
                            tableLayout.x,
                            tableLayout.y,
                            tableLayout.width,
                            tableLayout.height,
                            table.lengthCm,
                            table.widthCm,
                          );
                          return (
                            <>
                              <Line
                                points={[
                                  pbCenterX,
                                  pbCenterY,
                                  worker.x,
                                  worker.y,
                                ]}
                                stroke="#6b7280"
                                strokeWidth={1.5}
                                dash={[6, 4]}
                              />
                              <Text
                                x={(pbCenterX + worker.x) / 2 - 24}
                                y={(pbCenterY + worker.y) / 2 - 14}
                                text={`${dist} cm`}
                                fill="#6b7280"
                                fontSize={13}
                                fontStyle="bold"
                              />
                            </>
                          );
                        })()}

                      <Polybag
                        x={x}
                        y={y}
                        id={pb.id}
                        label={pb.label}
                        minX={tableLayout.x - 50}
                        minY={tableLayout.y - 50}
                        maxX={tableLayout.x + tableLayout.width - 50}
                        maxY={tableLayout.y + tableLayout.height - 50}
                        selected={isSelected}
                        onSelect={() =>
                          setSelectedElement({ type: "polybag", id: pb.id })
                        }
                        onDragEnd={(newX, newY) => {
                          const clampedX = Math.max(
                            tableLayout.x - 50,
                            Math.min(
                              newX,
                              tableLayout.x + tableLayout.width - 50,
                            ),
                          );
                          const clampedY = Math.max(
                            tableLayout.y - 50,
                            Math.min(
                              newY,
                              tableLayout.y + tableLayout.height - 50,
                            ),
                          );
                          setPolybags((prev) =>
                            prev.map((p, i) =>
                              i === index
                                ? {
                                    ...p,
                                    xPercent:
                                      (clampedX - tableLayout.x) /
                                      tableLayout.width,
                                    yPercent:
                                      (clampedY - tableLayout.y) /
                                      tableLayout.height,
                                  }
                                : p,
                            ),
                          );
                        }}
                      />
                    </Fragment>
                  );
                })}

                <HandPath
                  color={HAND_COLORS.left}
                  isDrawing={drawingHand === "left"}
                  previewPoint={drawingHand === "left" ? previewPoint : null}
                  selectedId={
                    selectedElement?.type === "lefthand"
                      ? selectedElement.id
                      : null
                  }
                  overlappingIds={overlappingLeftIds}
                  minX={tableLayout.x}
                  minY={tableLayout.y}
                  maxX={tableLayout.x + tableLayout.width}
                  maxY={tableLayout.y + tableLayout.height}
                  nodes={leftHands.map((lh) => ({
                    id: lh.id,
                    label: lh.label,
                    x: tableLayout.x + lh.xPercent * tableLayout.width,
                    y: tableLayout.y + lh.yPercent * tableLayout.height,
                  }))}
                  onSelectNode={(id) =>
                    setSelectedElement({ type: "lefthand", id })
                  }
                  onNodeDragEnd={(id, x, y) =>
                    onDragHandNode(
                      "left",
                      id,
                      (x - tableLayout.x) / tableLayout.width,
                      (y - tableLayout.y) / tableLayout.height,
                    )
                  }
                  onResumeDrawing={() => onResumeDraw("left")}
                />

                <HandPath
                  color={HAND_COLORS.right}
                  isDrawing={drawingHand === "right"}
                  previewPoint={drawingHand === "right" ? previewPoint : null}
                  selectedId={
                    selectedElement?.type === "righthand"
                      ? selectedElement.id
                      : null
                  }
                  overlappingIds={overlappingRightIds}
                  minX={tableLayout.x}
                  minY={tableLayout.y}
                  maxX={tableLayout.x + tableLayout.width}
                  maxY={tableLayout.y + tableLayout.height}
                  nodes={rightHands.map((rh) => ({
                    id: rh.id,
                    label: rh.label,
                    x: tableLayout.x + rh.xPercent * tableLayout.width,
                    y: tableLayout.y + rh.yPercent * tableLayout.height,
                  }))}
                  onSelectNode={(id) =>
                    setSelectedElement({ type: "righthand", id })
                  }
                  onNodeDragEnd={(id, x, y) =>
                    onDragHandNode(
                      "right",
                      id,
                      (x - tableLayout.x) / tableLayout.width,
                      (y - tableLayout.y) / tableLayout.height,
                    )
                  }
                  onResumeDrawing={() => onResumeDraw("right")}
                />
              </Layer>
            </Stage>
          </div>
        </div>
      </div>

      {distanceWarnings.length > 0 && (
        <div
          style={{
            background: "#fef3c7",
            border: "1px solid #f59e0b",
            borderRadius: 6,
            padding: "6px 10px",
            margin: "4px 0",
            fontSize: 12,
            color: "#92400e",
          }}
        >
          {distanceWarnings.map((message) => (
            <div key={message}>⚠ {message}</div>
          ))}
        </div>
      )}
    </div>
  );
}