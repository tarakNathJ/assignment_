import type { Request, Response, NextFunction } from "express";
import { getPool } from "../services/connection-registry.js";

export function requireDb(req: Request, res: Response, next: NextFunction): void {
  const sid = req.session?.sid;
  if (!sid) {
    res.status(401).json({ error: "No session" });
    return;
  }
  const pool = getPool(sid);
  if (!pool) {
    res.status(400).json({ error: "Connect a database first" });
    return;
  }
  next();
}
