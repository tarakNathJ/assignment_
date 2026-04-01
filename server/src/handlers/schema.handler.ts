import type { Request, Response } from "express";
import { ensureConnectionAndSchema } from "../services/connection-registry.js";
import { introspectSchema } from "../services/schema-introspection.js";
import { setSchema } from "../services/schema-cache.js";

export async function getSchemaHandler(req: Request, res: Response): Promise<void> {
  const connection = await ensureConnectionAndSchema(req.session);
  if (!connection) {
    res.status(400).json({ error: "No schema cached; connect again" });
    return;
  }
  res.json(connection.schema);
}

export async function refreshSchemaHandler(req: Request, res: Response): Promise<void> {
  const connection = await ensureConnectionAndSchema(req.session);
  if (!connection) {
    res.status(400).json({ error: "No connection" });
    return;
  }
  try {
    const summary = await introspectSchema(connection.pool);
    setSchema(req.session?.sid, summary);
    res.json(summary);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Introspection failed";
    res.status(500).json({ error: msg });
  }
}
