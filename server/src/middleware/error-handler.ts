import type { Request, Response, NextFunction } from "express";
import { SqlGuardError } from "../services/sql-guard.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof SqlGuardError) {
    res.status(400).json({ error: err.message });
    return;
  }
  const msg = err instanceof Error ? err.message : "Internal error";
  const code = msg.includes("Unauthorized") ? 401 : 500;
  res.status(code).json({ error: msg });
}
