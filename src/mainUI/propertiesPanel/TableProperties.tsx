import { useState } from "react";
import type { TableProps } from "../../types/propsRPanel.types";
import { saveTableSize } from "../../utils/tablesize";
import { primaryButton } from "../../styles/buttonStyles";

export default function TableProperties({
  table,
  setTable,
}: TableProps) {
  const [tableDraft, setTableDraft] = useState({
    widthCm: String(table.widthCm),
    lengthCm: String(table.lengthCm),
  });

  const [tableError, setTableError] = useState("");

  return (
    <>
      <h3>Table Dimensions</h3>

      <div className="form-group">
        <label className="form-label">
          Length (cm)
        </label>

        <input
          className="form-input"
          type="number"
          placeholder="Enter table length"
          value={tableDraft.lengthCm}
          onChange={(e) =>
            setTableDraft((prev) => ({
              ...prev,
              lengthCm: e.target.value,
            }))
          }
        />
      </div>

      <div className="form-group">
        <label className="form-label">
          Width (cm)
        </label>

        <input
          className="form-input"
          type="number"
          placeholder="Enter table width"
          value={tableDraft.widthCm}
          onChange={(e) =>
            setTableDraft((prev) => ({
              ...prev,
              widthCm: e.target.value,
            }))
          }
        />
      </div>

      <button
        className="modern-btn"
        style={primaryButton}
        onClick={() =>
          saveTableSize(
            tableDraft,
            setTableError,
            setTable
          )
        }
      >
        Save Size
      </button>

      {tableError && (
        <p
          style={{
            color: "#dc2626",
            fontSize: 13,
            marginTop: 10,
          }}
        >
          {tableError}
        </p>
      )}
    </>
  );
}