import OpenAI from "openai";
import type { LlmMessage, SqlGenerationResult } from "../../types/llm.js";
import { extractJsonObject } from "./json-extract.js";

const OPENAI_DEFAULT_MODEL = "gpt-4o-mini";
const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
const GROQ_DEFAULT_MODEL = "llama-3.3-70b-versatile";

async function completionToSqlResult(
  client: OpenAI,
  model: string,
  messages: LlmMessage[],
): Promise<SqlGenerationResult> {
  const res = await client.chat.completions.create({
    model,
    temperature: 0.1,
    messages: messages.map((x) => ({ role: x.role, content: x.content })),
  });
  const text = res.choices[0]?.message?.content ?? "";
  const obj = extractJsonObject(text);
  if (!obj || typeof obj.sql !== "string") {
    throw new Error("Model response missing valid JSON with sql");
  }
  return {
    sql: String(obj.sql).trim(),
    explanation: typeof obj.explanation === "string" ? obj.explanation : undefined,
    chartHint: typeof obj.chart_hint === "string" ? obj.chart_hint : undefined,
  };
}

export async function generateWithOpenAI(
  apiKey: string,
  model: string | undefined,
  messages: LlmMessage[],
): Promise<SqlGenerationResult> {
  const client = new OpenAI({ apiKey });
  const m = model?.trim() || OPENAI_DEFAULT_MODEL;
  return completionToSqlResult(client, m, messages);
}

export async function generateWithGroq(
  apiKey: string,
  model: string | undefined,
  messages: LlmMessage[],
): Promise<SqlGenerationResult> {
  const client = new OpenAI({
    apiKey,
    baseURL: GROQ_BASE_URL,
  });
  const m = model?.trim() || GROQ_DEFAULT_MODEL;
  return completionToSqlResult(client, m, messages);
}
