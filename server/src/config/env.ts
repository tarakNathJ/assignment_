import { config } from "dotenv";

config();

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const env = {
  port: parseInt(process.env.PORT ?? "4000", 10),
  nodeEnv: process.env.NODE_ENV ?? "development",
  sessionSecret: required("SESSION_SECRET", "dev-only-change-in-production"),
  demoAuthUser: process.env.DEMO_AUTH_USER ?? "demo",
  demoAuthPassword: process.env.DEMO_AUTH_PASSWORD ?? "demo",
  corsOrigin: "*",
  demoDatabaseUrl: process.env.DEMO_DATABASE_URL ?? process.env.DATABASE_URL ?? "",
  statementTimeoutMs: parseInt(process.env.STATEMENT_TIMEOUT_MS ?? "25000", 10),
  maxResultRows: parseInt(process.env.MAX_RESULT_ROWS ?? "500", 10),
  groqApiKey: (process.env.GROQ_API_KEY ?? "").trim(),
};
