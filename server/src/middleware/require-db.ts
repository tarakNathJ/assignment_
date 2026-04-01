import type { Request, Response, NextFunction } from "express";
import { getPool } from "../services/connection-registry.js";

export function requireDb(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionID) {
    res.status(400).json({ error: "No session" });
    return;
  }
  const pool = getPool(req.sessionID);
  if (!pool) {
    res.status(400).json({ error: "Connect a database first" });
    return;
  }
  next();
}
