import { BarChart3, LineChart, PieChart, ScatterChart, Table2 } from "lucide-react";
import type { ChartKind } from "../../types/domain";

const ALL: { kind: ChartKind; label: string; icon: React.ReactNode }[] = [
  { kind: "bar", label: "Bar", icon: <BarChart3 size={16} /> },
  { kind: "line", label: "Line", icon: <LineChart size={16} /> },
  { kind: "pie", label: "Pie", icon: <PieChart size={16} /> },
  { kind: "scatter", label: "Scatter", icon: <ScatterChart size={16} /> },
  { kind: "table", label: "Table", icon: <Table2 size={16} /> },
];

interface Props {
  value: ChartKind;
  onChange: (k: ChartKind) => void;
}

export function ChartToolbar({ value, onChange }: Props) {
  return (
    <div className="chart-toolbar">
      <div className="chart-toolbar-label">
        Visualization
      </div>
      <div className="chart-toolbar-options">
        {ALL.map((item) => (
          <button
            key={item.kind}
            type="button"
            className={`chart-toolbar-btn ${value === item.kind ? "chart-toolbar-btn-active" : ""}`}
            onClick={() => onChange(item.kind)}
            title={item.label}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
