import type { LlmProvider, SqlGenerationResult, LlmMessage } from "../../types/llm.js";
import { generateWithOpenAI, generateWithGroq } from "./openai-provider.js";
import { generateWithAnthropic } from "./anthropic-provider.js";
import { generateWithGoogle } from "./google-provider.js";

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function runProvider(
  provider: LlmProvider,
  apiKey: string,
  model: string | undefined,
  messages: LlmMessage[],
): Promise<SqlGenerationResult> {
  if (provider === "openai") return generateWithOpenAI(apiKey, model, messages);
  if (provider === "groq") return generateWithGroq(apiKey, model, messages);
  if (provider === "anthropic") return generateWithAnthropic(apiKey, model, messages);
  return generateWithGoogle(apiKey, model, messages);
}

export async function generateSqlWithRetry(
  provider: LlmProvider,
  apiKey: string,
  model: string | undefined,
  messages: LlmMessage[],
): Promise<SqlGenerationResult> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await runProvider(provider, apiKey, model, messages);
    } catch (e) {
      lastErr = e;
      await sleep(350 * (attempt + 1));
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("LLM failed after retries");
}
