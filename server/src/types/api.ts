import type { LlmProvider } from "./llm.js";
import type { SchemaSummary } from "./schema.js";

export interface CustomDbPayload {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  ssl?: boolean;
}

export interface SessionDbState {
  mode: "demo" | "custom";
  label: string;
  schema?: SchemaSummary;
}

export interface NlQueryBody {
  message: string;
  provider: LlmProvider;
  apiKey: string;
  model?: string;
  conversation?: { role: "user" | "assistant"; content: string; sql?: string }[];
}

export interface RawQueryBody {
  sql: string;
}
