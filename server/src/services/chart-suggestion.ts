export type ChartKind = "bar" | "line" | "pie" | "scatter" | "table";

function isDateLike(v: unknown): boolean {
  if (v instanceof Date) return true;
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return true;
  return false;
}

function isNumeric(v: unknown): boolean {
  if (typeof v === "number" && Number.isFinite(v)) return true;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return true;
  return false;
}

export function suggestChart(
  columns: string[],
  rows: Record<string, unknown>[],
  llmHint?: string,
): ChartKind {
  const h = (llmHint ?? "").toLowerCase();
  if (h.includes("pie")) return "pie";
  if (h.includes("line")) return "line";
  if (h.includes("scatter")) return "scatter";
  if (h.includes("bar")) return "bar";
  if (h.includes("table")) return "table";

  if (columns.length === 0 || rows.length === 0) return "table";
  if (rows.length > 200 || columns.length > 8) return "table";

  const sample = rows[0];
  const types = columns.map((c) => {
    const val = sample[c];
    if (isDateLike(val)) return "date";
    if (isNumeric(val)) return "num";
    return "cat";
  });

  const numCols = columns.filter((_, i) => types[i] === "num");
  const dateCols = columns.filter((_, i) => types[i] === "date");
  const catCols = columns.filter((_, i) => types[i] === "cat");

  if (dateCols.length >= 1 && numCols.length >= 1) return "line";
  if (numCols.length >= 2 && rows.length > 1) return "scatter";
  if (catCols.length === 1 && numCols.length === 1 && rows.length <= 24) return "pie";
  if (catCols.length >= 1 && numCols.length >= 1) return "bar";
  return "table";
}
