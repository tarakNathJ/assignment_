interface Props {
  columns: string[];
  rows: Record<string, unknown>[];
  maxHeight?: string;
}

export function ResultTable({ columns, rows, maxHeight = "400px" }: Props) {
  if (!columns.length) return <div className="muted">No columns.</div>;
  return (
    <div className="result-table-container" style={{ maxHeight }}>
      <div className="result-table-scroll">
        <table className="result-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className={i % 2 === 1 ? 'row-zebra' : ''}>
                {columns.map((c) => (
                  <td key={c}>{formatCell(r[c])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCell(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString();
  return String(v);
}
