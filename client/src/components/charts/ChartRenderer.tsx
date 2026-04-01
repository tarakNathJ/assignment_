import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { BarChart3, AlertCircle } from "lucide-react";
import type { ChartKind } from "../../types/domain";
import { buildChartData } from "../../lib/chart-data";

// New design palette: indigo, purple, cyan, emerald, amber
const COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // purple
  "#38bdf8", // cyan
  "#34d399", // emerald
  "#fbbf24", // amber
  "#f87171", // red
  "#a78bfa", // violet
  "#22d3ee", // sky
];

const AXIS_STYLE = { 
  stroke: "rgba(148, 163, 184, 0.3)", 
  fontSize: 11,
  tick: { fill: "rgba(148, 163, 184, 0.6)" }
};
const GRID_STYLE = { stroke: "rgba(148, 163, 184, 0.1)" };
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(18, 19, 26, 0.95)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 8,
    fontSize: 12,
    boxShadow: "var(--shadow-elevation-2)",
  },
  labelStyle: { color: "var(--text-secondary)" },
  itemStyle: { color: "var(--text-primary)" },
};

interface Props {
  kind: ChartKind;
  columns: string[];
  rows: Record<string, unknown>[];
}

function ChartError({ message }: { message: string }) {
  return (
    <div className="chart-error-card">
      <AlertCircle size={24} className="chart-error-icon" />
      <span className="chart-error-text">{message}</span>
    </div>
  );
}

function ChartEmpty() {
  return (
    <div className="chart-empty-card">
      <BarChart3 size={32} className="chart-empty-icon" />
      <span className="chart-empty-text">No data to display</span>
    </div>
  );
}

export function ChartRenderer({ kind, columns, rows }: Props) {
  const { categoryKey, valueKeys, data } = buildChartData(columns, rows);
  if (!data.length) return <ChartEmpty />;

  if (kind === "table") return null;

  if (kind === "pie") {
    const vk = valueKeys[0] ?? columns[1] ?? columns[0];
    const pieData = data.map((d) => ({
      name: String(d[categoryKey] ?? ""),
      value: typeof d[vk] === "number" ? (d[vk] as number) : Number(d[vk]) || 0,
    }));
    return (
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={pieData} dataKey="value" nameKey="name" outerRadius="70%" label>
            {pieData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (kind === "scatter") {
    const sample = rows[0] ?? {};
    const nums = columns.filter((c) => {
      const v = sample[c];
      if (typeof v === "number" && Number.isFinite(v)) return true;
      if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return true;
      return false;
    });
    const xk = nums[0];
    const yk = nums[1];
    if (!xk || !yk) {
      return <ChartError message="Need two numeric columns for scatter plot" />;
    }
    const sc = rows.map((r) => ({ x: Number(r[xk]) || 0, y: Number(r[yk]) || 0 }));
    return (
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis type="number" dataKey="x" name={xk} {...AXIS_STYLE} />
          <YAxis type="number" dataKey="y" name={yk} {...AXIS_STYLE} />
          <ZAxis range={[40, 40]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Scatter name="points" data={sc} fill={COLORS[0]} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  const tickFormatter = (val: any) => {
    if (typeof val === 'string' && val.includes('T')) {
      const d = new Date(val);
      if (!isNaN(d.getTime())) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    }
    const str = String(val);
    return str.length > 15 ? str.substring(0, 12) + '...' : str;
  };

  if (kind === "line") {
    const allValueKeys = valueKeys.length
      ? valueKeys
      : columns.filter((c) => c !== categoryKey);
    return (
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data}>
          <CartesianGrid {...GRID_STYLE} />
          <XAxis dataKey={categoryKey} {...AXIS_STYLE} tickFormatter={tickFormatter} />
          <YAxis {...AXIS_STYLE} />
          <Tooltip {...TOOLTIP_STYLE} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {allValueKeys.slice(0, 4).map((k, i) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={COLORS[i % COLORS.length]}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // bar (default)
  const barKeys = valueKeys.length ? valueKeys : columns.filter((c) => c !== categoryKey);
  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data}>
        <CartesianGrid {...GRID_STYLE} />
        <XAxis dataKey={categoryKey} {...AXIS_STYLE} tickFormatter={tickFormatter} />
        <YAxis {...AXIS_STYLE} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {barKeys.slice(0, 4).map((k, i) => (
          <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[3, 3, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
