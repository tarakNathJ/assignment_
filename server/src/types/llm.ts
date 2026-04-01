export type LlmProvider = "openai" | "anthropic" | "google" | "groq";

export interface LlmMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface SqlGenerationResult {
  sql: string;
  explanation?: string;
  chartHint?: string;
}
