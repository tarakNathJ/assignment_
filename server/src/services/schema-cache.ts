import type { SchemaSummary } from "../types/schema.js";

const map = new Map<string, SchemaSummary>();

export function setSchema(sessionId: string, s: SchemaSummary): void {
  map.set(sessionId, s);
}

export function getSchema(sessionId: string): SchemaSummary | undefined {
  return map.get(sessionId);
}

export function clearSchema(sessionId: string): void {
  map.delete(sessionId);
}
