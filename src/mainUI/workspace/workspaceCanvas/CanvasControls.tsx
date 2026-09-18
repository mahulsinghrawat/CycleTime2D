import { FiTrash2 } from "react-icons/fi";
import { LuUndo2 } from "react-icons/lu";
import type { CanvasActionControlsProps, CanvasZoomControlsProps } from "../../../types/propsUI.types";

export function CanvasZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: CanvasZoomControlsProps) {
  return (
    <div className="workspace-canvas-zoom-controls">
      <button
        type="button"
        className="workspace-canvas-zoom-btn"
        onClick={onZoomOut}
        aria-label="Zoom out"
      >
        -
      </button>
      <button
        type="button"
        className="workspace-canvas-zoom-btn workspace-canvas-zoom-label"
        onClick={onResetZoom}
        aria-label="Reset zoom"
      >
        {Math.round(zoom * 100)}%
      </button>
      <button
        type="button"
        className="workspace-canvas-zoom-btn"
        onClick={onZoomIn}
        aria-label="Zoom in"
      >
        +
      </button>
    </div>
  );
}

export function CanvasActionControls({
  canUndo,
  canDeleteSelected,
  onUndo,
  onDeleteSelected,
}: CanvasActionControlsProps) {
  return (
    <div className="workspace-canvas-action-controls">
      <button
        type="button"
        className="workspace-canvas-action-btn"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
        title="Undo"
      >
        <LuUndo2 size={16} />
      </button>
      <button
        type="button"
        className="workspace-canvas-action-btn workspace-canvas-action-btn-delete"
        onClick={onDeleteSelected}
        disabled={!canDeleteSelected}
        aria-label="Delete selected"
        title="Delete selected"
      >
        <FiTrash2 size={16} />
      </button>
    </div>
  );
}
