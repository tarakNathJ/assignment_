import type { LlmProvider } from "../types/domain";

const K_PROVIDER = "bi_llm_provider";
const K_KEY = "bi_llm_api_key";
const K_MODEL = "bi_llm_model";

export function getLlmSettings(): {
  provider: LlmProvider;
  apiKey: string;
  model: string;
} {
  const provider = (localStorage.getItem(K_PROVIDER) ?? "openai") as LlmProvider;
  const apiKey = localStorage.getItem(K_KEY) ?? "";
  const model = localStorage.getItem(K_MODEL) ?? "";
  return { provider, apiKey, model };
}

export function setLlmSettings(partial: {
  provider?: LlmProvider;
  apiKey?: string;
  model?: string;
}): void {
  if (partial.provider) localStorage.setItem(K_PROVIDER, partial.provider);
  if (partial.apiKey !== undefined) localStorage.setItem(K_KEY, partial.apiKey);
  if (partial.model !== undefined) localStorage.setItem(K_MODEL, partial.model);
}
