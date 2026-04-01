import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { disconnectSession, getDbInfo } from "../services/connection-registry.js";
import { clearSchema } from "../services/schema-cache.js";

export function loginHandler(req: Request, res: Response): void {
  const username = String(req.body?.username ?? "");
  const password = String(req.body?.password ?? "");
  if (username === env.demoAuthUser && password === env.demoAuthPassword) {
    req.session.authed = true;
    const sid = uuidv4();
    req.session.sid = sid;
    res.json({ ok: true, token: sid });
    return;
  }
  res.status(401).json({ error: "Invalid credentials" });
}

export async function logoutHandler(req: Request, res: Response): Promise<void> {
  const sid = req.session?.sid;
  if (sid) {
    await disconnectSession(sid);
    clearSchema(sid);
  }
  req.session = null;
  res.json({ ok: true });
}

export function meHandler(req: Request, res: Response): void {
  const sid = req.session?.sid;
  res.json({
    authed: Boolean(req.session?.authed),
    db: sid ? getDbInfo(sid) ?? null : null,
  });
}
