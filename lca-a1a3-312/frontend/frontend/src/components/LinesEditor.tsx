import { useMemo, useRef, useState, useEffect } from "react";

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type Unit = "m3" | "m2" | "kg" | "unit";

export type LineDraft = {
  epd_id: string;
  input_qty: number | "";
  input_unit: Unit;
  thickness_mm?: number | "";
};

export type Material = {
  epd_id: string;
  label: string;
  allowed_units: Unit[];
  default_unit: Unit;
  needs_thickness?: boolean;
};

/* ------------------------------------------------------------------ */
/* Style tokens                                                        */
/* ------------------------------------------------------------------ */

const inputStyle: React.CSSProperties = {
  padding: "6px 10px",
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  backgroundColor: "#f9fafb",
  fontSize: 14,
  lineHeight: "20px",
  color: "#111827",
  outline: "none",
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  transition: "all 0.15s ease",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f1f5f9",
};

const btnPrimary: React.CSSProperties = {
  padding: "8px 12px",
  background: "#111827",
  color: "white",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "6px 10px",
  background: "transparent",
  color: "#ef4444",
  borderRadius: 6,
  border: "1px solid #fecaca",
  cursor: "pointer",
};

/* ------------------------------------------------------------------ */
/* Pretty custom select (no libs)                                      */
/* ------------------------------------------------------------------ */

function NiceSelect({
  value,
  options,
  onChange,
  placeholder = "Select…",
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          ...inputStyle,
          width: "100%",
          textAlign: "left",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
        }}
      >
        <span style={{ color: selected ? "#111827" : "#6b7280" }}>
          {selected ? selected.label : placeholder}
        </span>
        <span style={{ marginLeft: 8, opacity: 0.6 }}>▾</span>
      </button>

      {/* menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            zIndex: 20,
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 10,
            boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
            maxHeight: 260,
            overflow: "auto",
          }}
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  padding: "8px 10px",
                  cursor: "pointer",
                  background: active ? "#eef2ff" : "white",
                  color: active ? "#1f2937" : "#111827",
                  borderBottom: "1px solid #f3f4f6",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = active ? "#eef2ff" : "white")
                }
                title={opt.label}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Materials (match backend EPD_DB ids)                                */
/* ------------------------------------------------------------------ */

export const MATERIALS: Material[] = [
  {
    epd_id: "concrete_c16_20",
    label: "Ready-mixed concrete C16/20 CEM II/B-M (X0, XC1)",
    allowed_units: ["m3", "kg"],
    default_unit: "m3",
  },
  {
    epd_id: "window_lyssand_120",
    label:
      "Lyssand 120 side-hung window (wood & aluminium), 1230x1480, two opening sashes",
    allowed_units: ["unit"],
    default_unit: "unit",
  },
  {
    epd_id: "eps_bewi_30mm",
    label: "BEWI Step impact sound insulation (EPS) 30 mm",
    allowed_units: ["m2"],
    default_unit: "m2",
    needs_thickness: true,
  },
  {
    epd_id: "timber_sca_spruce_pine",
    label: "Sawn timber made of spruce or pine (u = 16%)",
    allowed_units: ["m3", "kg"],
    default_unit: "m3",
  },
  {
    epd_id: "door_harmonie_massiv_glass",
    label: "Harmonie 'Massiv' interior door with glass",
    allowed_units: ["unit"],
    default_unit: "unit",
  },
  {
    epd_id: "floor_nordanger_lvt",
    label: "Nordanger LVT click vinyl flooring",
    allowed_units: ["m2"],
    default_unit: "m2",
  },
  {
    epd_id: "plaster_heydi_fiberpuss",
    label: "Heydi Fiberpuss cement-based render",
    allowed_units: ["kg"],
    default_unit: "kg",
  },
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

type Props = {
  lines: LineDraft[];
  onChange(lines: LineDraft[]): void;
};

export default function LinesEditor({ lines, onChange }: Props) {
  const byId = useMemo(
    () => Object.fromEntries(MATERIALS.map((m) => [m.epd_id, m] as const)),
    []
  );

  const update = (i: number, patch: Partial<LineDraft>) => {
    const next = [...lines];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };

  const addLine = () => {
    const first = MATERIALS[0];
    onChange([
      ...lines,
      {
        epd_id: first.epd_id,
        input_qty: "",
        input_unit: first.default_unit,
        thickness_mm: "",
      },
    ]);
  };

  const removeLine = (i: number) => {
    const next = lines.slice();
    next.splice(i, 1);
    onChange(next);
  };

  const onPickMaterial = (i: number, epd_id: string) => {
    const m = byId[epd_id];
    if (!m) return;
    update(i, {
      epd_id,
      input_unit: m.default_unit,
      thickness_mm: m.needs_thickness ? lines[i].thickness_mm ?? "" : undefined,
    });
  };

  return (
    <div style={{ marginTop: 20 }}>
      <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: 960 }}>
        <thead>
          <tr>
            <th style={thStyle}>Material (EPD)</th>
            <th style={thStyle}>Quantity</th>
            <th style={thStyle}>Unit</th>
            <th style={thStyle}>Thickness (mm)</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((ln, i) => {
            const meta = byId[ln.epd_id] ?? MATERIALS[0];
            return (
              <tr key={i}>
                {/* Material (custom select) */}
                <td style={tdStyle}>
                  <NiceSelect
                    value={ln.epd_id}
                    onChange={(v) => onPickMaterial(i, v)}
                    options={MATERIALS.map((m) => ({ value: m.epd_id, label: m.label }))}
                    placeholder="Select material…"
                  />
                </td>

                {/* Quantity */}
                <td style={tdStyle}>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ln.input_qty}
                    onChange={(e) =>
                      update(i, {
                        input_qty: e.target.value === "" ? "" : Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    style={inputStyle}
                  />
                </td>

                {/* Unit */}
                <td style={tdStyle}>
                  <select
                    value={ln.input_unit}
                    onChange={(e) => update(i, { input_unit: e.target.value as Unit })}
                    style={inputStyle}
                  >
                    {meta.allowed_units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </td>

                {/* Thickness */}
                <td style={tdStyle}>
                  {meta.needs_thickness ? (
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={ln.thickness_mm ?? ""}
                      onChange={(e) =>
                        update(i, {
                          thickness_mm: e.target.value === "" ? "" : Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 30"
                      style={inputStyle}
                    />
                  ) : (
                    <span style={{ color: "#888" }}>—</span>
                  )}
                </td>

                {/* Remove */}
                <td style={tdStyle}>
                  <button onClick={() => removeLine(i)} style={btnGhost}>
                    Remove
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 12 }}>
        <button onClick={addLine} style={btnPrimary}>
          + Add line
        </button>
      </div>
    </div>
  );
}
