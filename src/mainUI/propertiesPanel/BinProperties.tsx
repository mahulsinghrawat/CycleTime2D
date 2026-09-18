import { useState } from "react";
import type { BinType } from "../../types/components.types";
import type { BinCanvasProps, ArrangementBinType, CylindricalBinSize } from "../../types/propsRPanel.types";

const sizeToNumber: Record<CylindricalBinSize, number> = {
  Large: 30,
  Medium: 15,
  Small: 3,
};

function inferSize(size: number): CylindricalBinSize {
  if (size < 6) return "Small";
  if (size <= 25) return "Medium";
  return "Large";
}

export default function BinProperties({ selectedBin, setBins }: BinCanvasProps) {
  const [part, setPart] = useState(selectedBin.part);
  const [quantity, setQuantity] = useState(String(selectedBin.quantity ?? 0));

  const arrangement = selectedBin.arrangement ?? "Single";
  const showPartSize = selectedBin.partlayout === "Circular" || arrangement === "Loose";
  const partSize = inferSize(selectedBin.size);

  function updateBin(patch: Partial<BinType>) {
    setBins((prev) =>
      prev.map((b) => (b.id === selectedBin.id ? { ...b, ...patch } : b)),
    );
  }

  function handlePartChange(value: string) {
    setPart(value);
    if (value.trim()) updateBin({ part: value.trim() });
  }

  function handleQuantityChange(value: string) {
    setQuantity(value);
    const parsed = Number(value);
    if (parsed > 0) updateBin({ quantity: parsed });
  }

  return (
    <>
      <h3>Part Bin Properties</h3>

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
          value={selectedBin.partlayout}
          onChange={(e) =>
            updateBin({ partlayout: e.target.value as BinType["partlayout"] })
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
            updateBin({ arrangement: e.target.value as ArrangementBinType })
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
            updateBin({ size: sizeToNumber[e.target.value as CylindricalBinSize] })
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
