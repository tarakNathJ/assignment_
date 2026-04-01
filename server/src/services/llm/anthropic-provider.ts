import Anthropic from "@anthropic-ai/sdk";
import type { LlmMessage, SqlGenerationResult } from "../../types/llm.js";
import { extractJsonObject } from "./json-extract.js";

const DEFAULT_MODEL = "claude-3-5-haiku-20241022";

export async function generateWithAnthropic(
  apiKey: string,
  model: string | undefined,
  messages: LlmMessage[],
): Promise<SqlGenerationResult> {
  const client = new Anthropic({ apiKey });
  const system = messages.find((m) => m.role === "system")?.content ?? "";
  const rest = messages.filter((m) => m.role !== "system");
  const userContent = rest.map((m) => `${m.role}: ${m.content}`).join("\n\n");

  const res = await client.messages.create({
    model: model?.trim() || DEFAULT_MODEL,
    max_tokens: 1024,
    temperature: 0.1,
    system,
    messages: [{ role: "user", content: userContent }],
  });
  const block = res.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text : "";
  const obj = extractJsonObject(text);
  if (!obj || typeof obj.sql !== "string") {
    throw new Error("Anthropic response missing valid JSON with sql");
  }
  return {
    sql: String(obj.sql).trim(),
    explanation: typeof obj.explanation === "string" ? obj.explanation : undefined,
    chartHint: typeof obj.chart_hint === "string" ? obj.chart_hint : undefined,
  };
}
