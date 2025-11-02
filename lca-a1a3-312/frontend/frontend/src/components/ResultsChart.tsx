import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

/**
 * Simple pie chart for A1–A3 totals by material.
 */
type Item = { name: string; value: number };

export default function ResultsChart({ lines }: { lines: Item[] }) {
  const total = lines.reduce((s, x) => s + x.value, 0) || 1;
  const data = lines.map(x => ({ ...x, pct: (x.value / total) * 100 }));

  const colors = ["#22c55e", "#60a5fa", "#f59e0b", "#ef4444", "#a78bfa", "#10b981", "#f472b6"];

  return (
    <div style={{ height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" label>
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v: number) => `${v.toFixed(2)} kgCO₂e`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
