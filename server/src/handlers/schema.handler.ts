import type { Request, Response } from "express";
import { getPool } from "../services/connection-registry.js";
import { getSchema, setSchema } from "../services/schema-cache.js";
import { introspectSchema } from "../services/schema-introspection.js";

export function getSchemaHandler(req: Request, res: Response): void {
  const sid = req.session?.sid;
  if (!sid) {
    res.status(401).json({ error: "No session" });
    return;
  }
  const cached = getSchema(sid);
  if (!cached) {
    res.status(400).json({ error: "No schema cached; connect again" });
    return;
  }
  res.json(cached);
}

export async function refreshSchemaHandler(req: Request, res: Response): Promise<void> {
  const sid = req.session?.sid;
  if (!sid) {
    res.status(401).json({ error: "No session" });
    return;
  }
  const pool = getPool(sid);
  if (!pool) {
    res.status(400).json({ error: "No connection" });
    return;
  }
  try {
    const summary = await introspectSchema(pool);
    setSchema(sid, summary);
    res.json(summary);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Introspection failed";
    res.status(500).json({ error: msg });
  }
}
