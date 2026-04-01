import type { Request, Response } from "express";
import { z } from "zod";
import { getPool } from "../services/connection-registry.js";
import { runGuardedSelect } from "../services/query-runner.js";
import { suggestChart } from "../services/chart-suggestion.js";

const bodySchema = z.object({
  sql: z.string().min(1),
});

export async function sqlQueryHandler(req: Request, res: Response): Promise<void> {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const pool = getPool(req.sessionID);
  if (!pool) {
    res.status(400).json({ error: "No connection" });
    return;
  }
  try {
    const exec = await runGuardedSelect(pool, parsed.data.sql);
    const chart = suggestChart(exec.columns, exec.rows);
    res.json({
      sql: exec.sqlExecuted,
      columns: exec.columns,
      rows: exec.rows,
      rowCount: exec.rowCount,
      chart,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(400).json({ error: msg });
  }
}
