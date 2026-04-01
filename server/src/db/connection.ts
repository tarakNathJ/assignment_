import { Pool, type PoolConfig } from "pg";
import { config } from "dotenv";

config();

export function buildPoolConfig(connectionString: string): PoolConfig {
  const isLocal =
    connectionString.includes("localhost") ||
    connectionString.includes("127.0.0.1");
  return {
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  };
}

export function buildPoolFromParts(parts: {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl: boolean;
}): PoolConfig {
  return {
    host: parts.host,
    port: parts.port,
    database: parts.database,
    user: parts.user,
    password: parts.password,
    ssl: parts.ssl ? { rejectUnauthorized: false } : false,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 15_000,
  };
}
