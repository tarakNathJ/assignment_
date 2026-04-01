import type { SchemaSummary } from "../types/domain";
import { apiFetch } from "./http";

export interface ConnectResponse {
  ok: boolean;
  db: { mode: "demo" | "custom"; label: string };
  schemaSummary: SchemaSummary;
}

export function connectDemo(): Promise<ConnectResponse> {
  return apiFetch("/db/demo", { method: "POST", body: JSON.stringify({}) });
}

export function connectCustom(payload: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}): Promise<ConnectResponse> {
  return apiFetch("/db/custom", { method: "POST", body: JSON.stringify(payload) });
}

export function disconnectDb(): Promise<{ ok: boolean }> {
  return apiFetch("/db/disconnect", { method: "POST", body: JSON.stringify({}) });
}

export function getSchema(): Promise<SchemaSummary> {
  return apiFetch("/schema");
}

export function refreshSchema(): Promise<SchemaSummary> {
  return apiFetch("/schema/refresh", { method: "POST", body: JSON.stringify({}) });
}
