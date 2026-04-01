import type { Request, Response } from "express";
import { z } from "zod";
import {
  createCustomPool,
  createDemoPool,
  disconnectSession,
  setPool,
} from "../services/connection-registry.js";
import { introspectSchema } from "../services/schema-introspection.js";
import { setSchema, clearSchema } from "../services/schema-cache.js";

const customSchema = z.object({
  host: z.string().min(1),
  port: z.coerce.number().int().min(1).max(65535),
  database: z.string().min(1),
  user: z.string().min(1),
  password: z.string(),
  ssl: z.boolean().optional(),
});

export async function connectDemoHandler(req: Request, res: Response): Promise<void> {
  try {
    await disconnectSession(req.sessionID);
    clearSchema(req.sessionID);
    const pool = createDemoPool();
    await pool.query("SELECT 1");
    setPool(req.sessionID, pool);
    const summary = await introspectSchema(pool);
    setSchema(req.sessionID, summary);
    req.session.db = { mode: "demo", label: "Demo ecommerce" };
    res.json({ ok: true, db: req.session.db, schemaSummary: summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Connect failed";
    res.status(400).json({ error: msg });
  }
}

export async function connectCustomHandler(req: Request, res: Response): Promise<void> {
  const parsed = customSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  try {
    await disconnectSession(req.sessionID);
    clearSchema(req.sessionID);
    const pool = createCustomPool(parsed.data);
    await pool.query("SELECT 1");
    setPool(req.sessionID, pool);
    const summary = await introspectSchema(pool);
    setSchema(req.sessionID, summary);
    req.session.db = {
      mode: "custom",
      label: `${parsed.data.host}/${parsed.data.database}`,
    };
    res.json({ ok: true, db: req.session.db, schemaSummary: summary });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Connect failed";
    res.status(400).json({ error: msg });
  }
}

export async function disconnectDbHandler(req: Request, res: Response): Promise<void> {
  try {
    await disconnectSession(req.sessionID);
    clearSchema(req.sessionID);
    req.session.db = undefined;
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Disconnect failed";
    res.status(500).json({ error: msg });
  }
}
