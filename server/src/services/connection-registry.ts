import { Pool } from "pg";
import type { CustomDbPayload } from "../types/api.js";
import { buildPoolConfig, buildPoolFromParts } from "../db/connection.js";
import { env } from "../config/env.js";

const pools = new Map<string, Pool>();

export function registryKey(sessionId: string): string {
  return sessionId;
}

export function setPool(sessionId: string, pool: Pool): void {
  const key = registryKey(sessionId);
  const prev = pools.get(key);
  if (prev) void prev.end().catch(() => undefined);
  pools.set(key, pool);
}

export function getPool(sessionId: string): Pool | undefined {
  return pools.get(registryKey(sessionId));
}

export async function disconnectSession(sessionId: string): Promise<void> {
  const key = registryKey(sessionId);
  const p = pools.get(key);
  if (p) {
    pools.delete(key);
    await p.end().catch(() => undefined);
  }
}

export function createDemoPool(): Pool {
  if (!env.demoDatabaseUrl) {
    throw new Error("DEMO_DATABASE_URL or DATABASE_URL is not configured");
  }
  return new Pool(buildPoolConfig(env.demoDatabaseUrl));
}

export function createCustomPool(payload: CustomDbPayload): Pool {
  return new Pool(
    buildPoolFromParts({
      host: payload.host,
      port: payload.port,
      database: payload.database,
      user: payload.user,
      password: payload.password,
      ssl: payload.ssl ?? true,
    }),
  );
}

// Added to securely rehydrate DB connections on Vercel cold starts
import { introspectSchema } from "./schema-introspection.js";
import { getSchema, setSchema } from "./schema-cache.js";

export async function ensureConnectionAndSchema(session: any): Promise<{ pool: Pool; schema: any } | undefined> {
  const sid = session?.sid;
  if (!sid) return undefined;

  let pool = getPool(sid);
  if (!pool) {
    if (session?.db?.mode === "demo") {
      pool = createDemoPool();
    } else if (session?.db?.mode === "custom" && session?.db?.payload) {
      pool = createCustomPool(session.db.payload);
    }
    if (pool) setPool(sid, pool);
  }

  if (!pool) return undefined;

  let schema = getSchema(sid);
  if (!schema) {
    try {
      schema = await introspectSchema(pool);
      setSchema(sid, schema);
    } catch (e) {
      return undefined;
    }
  }

  return { pool, schema };
}
