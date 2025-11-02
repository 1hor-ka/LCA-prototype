import { useState, useEffect, Suspense, lazy } from "react";
import { calculate } from "./api";
import LinesEditor, { type LineDraft, MATERIALS } from "./components/LinesEditor";

const ResultsChart = lazy(() => import("./components/ResultsChart"));

type ResultLine = { material_name: string; gwp_a1a3_total: number };
type CalcResponse = { sum_gwp_a1a3: number; lines: ResultLine[] };

const STORAGE_KEY = "lca-tool-session";

export default function AppInner() {
  const [lines, setLines] = useState<LineDraft[]>([
    { epd_id: MATERIALS[0].epd_id, input_qty: 11, input_unit: MATERIALS[0].default_unit },
    { epd_id: MATERIALS[1].epd_id, input_qty: 4, input_unit: MATERIALS[1].default_unit },
  ]);
  const [data, setData] = useState<CalcResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-save
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ lines }));
    } catch {}
  }, [lines]);

  // Restore
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (Array.isArray(saved?.lines)) setLines(saved.lines);
      }
    } catch {}
  }, []);

  async function onCalculate() {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const cleaned = lines
        .map((l) => ({
          epd_id: l.epd_id,
          input_qty: Number(l.input_qty),
          input_unit: l.input_unit,
          ...(l.thickness_mm !== undefined && l.thickness_mm !== ""
            ? { thickness_mm: Number(l.thickness_mm) }
            : {}),
        }))
        .filter((l) => isFinite(l.input_qty) && l.input_qty > 0);

      if (cleaned.length === 0) throw new Error("Please add at least one valid line.");

      const res = await calculate({ lines: cleaned });
      if (!res || !Array.isArray(res.lines)) throw new Error("Invalid API response.");

      setData({
        sum_gwp_a1a3: Number(res.sum_gwp_a1a3),
        lines: res.lines.map((l: any) => ({
          material_name: String(l.material_name ?? "Unknown"),
          gwp_a1a3_total: Number(l.gwp_a1a3_total ?? 0),
        })),
      });
    } catch (e: any) {
      setError(e?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  // --- Robust CSV (RFC-4180 + BOM) ---
  function downloadCSV() {
    if (!data) return;

    const rows: (string | number)[][] = [
      ["Material", "A1–A3 (kgCO2e)", "Share (%)"],
      ...data.lines.map((l) => [
        l.material_name,
        l.gwp_a1a3_total.toFixed(2),
        ((l.gwp_a1a3_total / data.sum_gwp_a1a3) * 100).toFixed(1),
      ]),
      ["Total", data.sum_gwp_a1a3.toFixed(2), "100.0"],
    ];

    // Escape each field, wrap with quotes, double internal quotes
    const encode = (val: string | number) =>
      `"${String(val).replace(/"/g, '""')}"`;

    const csvBody = rows.map((r) => r.map(encode).join(",")).join("\n");

    // BOM to make Numbers/Excel read UTF-8 correctly
    const csv = "\uFEFF" + csvBody;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "lca_results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Header */}
      <header style={header}>
        <div style={headerInner}>
          <div style={{ fontWeight: 700 }}>LCA Tool — Prototype</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>v0.1 • A1–A3</div>
        </div>
      </header>

      <div style={{ padding: 32, maxWidth: 1040, margin: "72px auto 40px" }}>
        {/* Inputs */}
        <div style={card}>
          <h3 style={cardTitle}>Inputs</h3>
          <LinesEditor lines={lines} onChange={setLines} />

          {/* Buttons row (wider, wrap, spacing) */}
          <div
            style={{
              marginTop: 20,
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "flex-start",
            }}
          >
            <button
              onClick={onCalculate}
              disabled={loading}
              style={{ ...btnPrimary, minWidth: 130, padding: "10px 18px" }}
            >
              {loading ? "Calculating…" : "Calculate"}
            </button>

            <button
              onClick={() => setData(null)}
              disabled={loading}
              style={{ ...btnSecondary, minWidth: 130, padding: "10px 18px" }}
            >
              Clear Result
            </button>

            <button
              onClick={downloadCSV}
              disabled={!data}
              style={{ ...btnGhost, minWidth: 130, padding: "10px 18px" }}
            >
              Export CSV
            </button>
          </div>
        </div>

        {error && <div style={alert}>{error}</div>}

        {/* Results */}
        {data && (
          <div style={card}>
            <h3 style={cardTitle}>Results</h3>
            <h2 style={{ margin: "6px 0 12px" }}>
              Total: {data.sum_gwp_a1a3.toFixed(2)} kgCO₂e
            </h2>

            <Suspense fallback={<div>Loading chart…</div>}>
              <ResultsChart
                lines={data.lines.map((l) => ({
                  name: l.material_name,
                  value: l.gwp_a1a3_total,
                }))}
              />
            </Suspense>

            <div style={{ marginTop: 16 }}>
              <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                  <tr>
                    <th style={tth}>#</th>
                    <th style={tth}>Material</th>
                    <th style={tth}>A1–A3 (kgCO₂e)</th>
                    <th style={tth}>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lines.map((l, i) => {
                    const share =
                      data.sum_gwp_a1a3 > 0
                        ? (l.gwp_a1a3_total / data.sum_gwp_a1a3) * 100
                        : 0;
                    return (
                      <tr key={i}>
                        <td style={ttd}>{i + 1}</td>
                        <td style={ttd}>{l.material_name}</td>
                        <td style={{ ...ttd, fontVariantNumeric: "tabular-nums" }}>
                          {l.gwp_a1a3_total.toFixed(2)}
                        </td>
                        <td style={ttd}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div
                              style={{
                                flex: 1,
                                background: "#f1f5f9",
                                borderRadius: 6,
                                height: 8,
                              }}
                            >
                              <div
                                style={{
                                  width: `${share}%`,
                                  height: "100%",
                                  background: "#60a5fa",
                                  borderRadius: 6,
                                }}
                              />
                            </div>
                            <div style={{ width: 54, textAlign: "right" }}>
                              {share.toFixed(1)}%
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

/* ---------- Styles ---------- */

const header: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  background: "white",
  borderBottom: "1px solid #e5e7eb",
};

const headerInner: React.CSSProperties = {
  maxWidth: 1040,
  margin: "0 auto",
  padding: "12px 16px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const card: React.CSSProperties = {
  background: "white",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
  padding: 16,
  marginBottom: 20,
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
  marginBottom: 12,
};

const alert: React.CSSProperties = {
  marginTop: 12,
  background: "#fee2e2",
  color: "#991b1b",
  border: "1px solid #fecaca",
  borderRadius: 10,
  padding: 12,
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  background: "#111827",
  color: "white",
  borderRadius: 8,
  border: "none",
  cursor: "pointer",
};

const btnSecondary: React.CSSProperties = {
  padding: "10px 14px",
  background: "white",
  color: "#111827",
  borderRadius: 8,
  border: "1px solid #cbd5e1",
  cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  padding: "10px 14px",
  background: "white",
  color: "#111827",
  borderRadius: 8,
  border: "1px dashed #cbd5e1",
  cursor: "pointer",
};

const tth: React.CSSProperties = {
  textAlign: "left",
  padding: "8px 10px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
};

const ttd: React.CSSProperties = {
  padding: "8px 10px",
  borderBottom: "1px solid #f1f5f9",
};
