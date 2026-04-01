function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return null;
}

function toStr(v: unknown): string {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

function isDateLike(v: unknown): boolean {
  if (v instanceof Date) return true;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return true;
  return false;
}

export function buildChartData(
  columns: string[],
  rows: Record<string, unknown>[],
): {
  categoryKey: string;
  valueKeys: string[];
  data: Record<string, string | number>[];
} {
  if (!columns.length || !rows.length) {
    return { categoryKey: "x", valueKeys: [], data: [] };
  }

  const sample = rows[0];
  const dateCols = columns.filter((c) => isDateLike(sample[c]));
  const numCols = columns.filter((c) => toNum(sample[c]) !== null);
  const catCols = columns.filter(
    (c) => !dateCols.includes(c) && !numCols.includes(c),
  );

  let categoryKey = catCols[0] ?? dateCols[0] ?? columns[0];
  const valueKeys =
    numCols.length > 0 ? numCols : columns.filter((c) => c !== categoryKey);

  const data = rows.map((r) => {
    const row: Record<string, string | number> = {};
    row[categoryKey] = toStr(r[categoryKey]);
    for (const k of valueKeys) {
      if (k === categoryKey) continue;
      const n = toNum(r[k]);
      row[k] = n != null ? n : toStr(r[k]);
    }
    return row;
  });

  return { categoryKey, valueKeys, data };
}
