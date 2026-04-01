import type { ConversationTurn, LlmProvider, QueryResponse } from "../types/domain";
import { apiFetch } from "./http";

export function nlQuery(body: {
  message: string;
  provider: LlmProvider;
  apiKey: string;
  model?: string;
  conversation?: ConversationTurn[];
}): Promise<QueryResponse> {
  return apiFetch("/query/nl", { method: "POST", body: JSON.stringify(body) });
}

export function sqlQuery(sql: string): Promise<QueryResponse> {
  return apiFetch("/query/sql", { method: "POST", body: JSON.stringify({ sql }) });
}
