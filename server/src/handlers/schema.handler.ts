import type { Request, Response } from "express";
import { getPool } from "../services/connection-registry.js";
import { getSchema, setSchema } from "../services/schema-cache.js";
import { introspectSchema } from "../services/schema-introspection.js";

export function getSchemaHandler(req: Request, res: Response): void {
  const cached = getSchema(req.sessionID);
  if (!cached) {
    res.status(400).json({ error: "No schema cached; connect again" });
    return;
  }
  res.json(cached);
}

export async function refreshSchemaHandler(req: Request, res: Response): Promise<void> {
  const pool = getPool(req.sessionID);
  if (!pool) {
    res.status(400).json({ error: "No connection" });
    return;
  }
  try {
    const summary = await introspectSchema(pool);
    setSchema(req.sessionID, summary);
    res.json(summary);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Introspection failed";
    res.status(500).json({ error: msg });
  }
}
