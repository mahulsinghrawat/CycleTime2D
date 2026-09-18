import { useState } from "react";
import type { ArrangementPbType, CylindricalPbSize, PolybagCanvasProps } from "../../types/propsRPanel.types";
import type { PolybagType } from "../../types/components.types";

const sizeToNumber: Record<CylindricalPbSize, number> = {
  Large: 30,
  Medium: 15,
  Small: 3,
};

function inferSize(size: number): CylindricalPbSize {
  if (size < 6) return "Small";
  if (size <= 25) return "Medium";
  return "Large";
}

export default function PolybagProperties({ selectedPolybag, setPolybags }: PolybagCanvasProps) {
  const [part, setPart] = useState(selectedPolybag.part);
  const [quantity, setQuantity] = useState(String(selectedPolybag.quantity ?? 0));

  const arrangement = selectedPolybag.arrangement ?? "Single";
  const showPartSize = selectedPolybag.partlayout === "Circular" || arrangement === "Loose";
  const partSize = inferSize(selectedPolybag.size);

  function updatePolybag(patch: Partial<PolybagType>) {
    setPolybags((prev) =>
      prev.map((p) => (p.id === selectedPolybag.id ? { ...p, ...patch } : p)),
    );
  }

  function handlePartChange(value: string) {
    setPart(value);
    if (value.trim()) updatePolybag({ part: value.trim() });
  }

  function handleQuantityChange(value: string) {
    setQuantity(value);
    const parsed = Number(value);
    if (parsed > 0) updatePolybag({ quantity: parsed });
  }

  return (
    <>
      <h3>Polybag Properties</h3>

      <div className="form-group">
        <label className="form-label">Part Name</label>
        <input
          className="form-input"
          value={part}
          onChange={(e) => handlePartChange(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Part Shape</label>
        <select
          className="form-select"
          value={selectedPolybag.partlayout}
          onChange={(e) =>
            updatePolybag({ partlayout: e.target.value as PolybagType["partlayout"] })
          }
        >
          <option value="Circular">Circular / cylindrical</option>
          <option value="Cuboid">Standard / blocky</option>
          <option value="Flat">Flat / thin</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Arrangement Type</label>
        <select
          className="form-select"
          value={arrangement}
          onChange={(e) =>
            updatePolybag({ arrangement: e.target.value as ArrangementPbType })
          }
        >
          <option value="Single">Single / by itself</option>
          <option value="Loose">Loose (Random)</option>
          <option value="Stacked">Stacked / flat on surface</option>
          <option value="Contact">Contact / slide only</option>
        </select>
      </div>

      <div className="form-group" style={{ opacity: showPartSize ? 1 : 0.4 }}>
        <label className="form-label">Part Size</label>
        <select
          className="form-select"
          value={partSize}
          disabled={!showPartSize}
          onChange={(e) =>
            updatePolybag({ size: sizeToNumber[e.target.value as CylindricalPbSize] })
          }
        >
          <option value="Large">Large (greater than 25 mm)</option>
          <option value="Medium">Medium (6–25 mm)</option>
          <option value="Small">Small (less than 6 mm)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">Quantity</label>
        <input
          className="form-input"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
        />
      </div>
    </>
  );
}
