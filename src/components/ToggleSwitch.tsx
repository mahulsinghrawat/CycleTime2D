type ToggleSwitchProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  onLabel?: string;
  offLabel?: string;
};

export default function ToggleSwitch({
  checked,
  onChange,
  onLabel = "Yes",
  offLabel = "No",
}: ToggleSwitchProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: "relative",
          width: 40,
          height: 22,
          borderRadius: 11,
          border: "none",
          padding: 0,
          cursor: "pointer",
          background: checked ? "#2563eb" : "#d1d5db",
          transition: "background 0.2s",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 20 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "white",
            transition: "left 0.2s",
            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
          }}
        />
      </button>
      <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
        {checked ? onLabel : offLabel}
      </span>
    </div>
  );
}
