import { GoogleGenerativeAI } from "@google/generative-ai";
import type { LlmMessage, SqlGenerationResult } from "../../types/llm.js";
import { extractJsonObject } from "./json-extract.js";

const DEFAULT_MODEL = "gemini-1.5-flash";

export async function generateWithGoogle(
  apiKey: string,
  model: string | undefined,
  messages: LlmMessage[],
): Promise<SqlGenerationResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const m = genAI.getGenerativeModel({ model: model?.trim() || DEFAULT_MODEL });
  const textIn = messages.map((x) => `${x.role.toUpperCase()}:\n${x.content}`).join("\n\n");
  const res = await m.generateContent({
    contents: [{ role: "user", parts: [{ text: textIn }] }],
    generationConfig: { temperature: 0.1 },
  });
  const text = res.response.text();
  const obj = extractJsonObject(text);
  if (!obj || typeof obj.sql !== "string") {
    throw new Error("Gemini response missing valid JSON with sql");
  }
  return {
    sql: String(obj.sql).trim(),
    explanation: typeof obj.explanation === "string" ? obj.explanation : undefined,
    chartHint: typeof obj.chart_hint === "string" ? obj.chart_hint : undefined,
  };
}
