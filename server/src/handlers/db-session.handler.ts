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
import { encryptSession } from "../services/crypto-session.js";

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
    const sid = req.session?.sid;
    if (!sid) throw new Error("No session ID");
    await disconnectSession(sid);
    clearSchema(sid);
    const pool = createDemoPool();
    await pool.query("SELECT 1");
    setPool(sid, pool);
    const summary = await introspectSchema(pool);
    setSchema(sid, summary);
    
    req.session.db = { mode: "demo", label: "Demo ecommerce" };
    const token = encryptSession(req.session);
    res.json({ ok: true, db: req.session.db, schemaSummary: summary, token });
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
    const sid = req.session?.sid;
    if (!sid) throw new Error("No session ID");
    await disconnectSession(sid);
    clearSchema(sid);
    const pool = createCustomPool(parsed.data);
    await pool.query("SELECT 1");
    setPool(sid, pool);
    const summary = await introspectSchema(pool);
    setSchema(sid, summary);
    
    req.session.db = {
      mode: "custom",
      label: `${parsed.data.host}/${parsed.data.database}`,
      payload: parsed.data,
    };
    const token = encryptSession(req.session);
    res.json({ ok: true, db: { mode: "custom", label: req.session.db.label }, schemaSummary: summary, token });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Connect failed";
    res.status(400).json({ error: msg });
  }
}

export async function disconnectDbHandler(req: Request, res: Response): Promise<void> {
  try {
    const sid = req.session?.sid;
    if (sid) {
      await disconnectSession(sid);
      clearSchema(sid);
    }
    // No need to manually clear dbInfo, disconnectSession handles it
    res.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Disconnect failed";
    res.status(500).json({ error: msg });
  }
}
