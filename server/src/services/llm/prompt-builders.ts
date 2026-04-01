import type { SchemaSummary } from "../../types/schema.js";
import type { LlmMessage } from "../../types/llm.js";

export function schemaPrompt(summary: SchemaSummary): string {
  return JSON.stringify(summary, null, 2);
}

export function systemPrompt(schemaJson: string): string {
  return `You are a senior analytics engineer for PostgreSQL.
You receive JSON describing tables, columns, types, foreign keys, and sample rows.

Rules:
- Output a single JSON object only, no markdown fences.
- Keys: "sql" (string, required), "explanation" (string), "chart_hint" (one of: bar, line, pie, scatter, table).
- Generate exactly one read-only SELECT (or WITH ... SELECT). No semicolons after the query inside the string.
- Use only identifiers that exist in the schema. Quote mixed-case identifiers if needed.
- Prefer aggregations in SQL rather than returning huge raw tables.
- For dates, assume created_at, delivered_at columns are timestamptz where present.
- Customer US state is in customers.state; order shipping state in orders.shipping_state.

Schema:
${schemaJson}`;
}

export function userBlocks(
  message: string,
  history: { role: "user" | "assistant"; content: string; sql?: string }[],
): string {
  const lines: string[] = [];
  for (const h of history.slice(-8)) {
    if (h.role === "user") lines.push(`User: ${h.content}`);
    else {
      lines.push(`Assistant: ${h.content}`);
      if (h.sql) lines.push(`Previous SQL: ${h.sql}`);
    }
  }
  lines.push(`User: ${message}`);
  return lines.join("\n");
}

export function toMessages(system: string, userContent: string): LlmMessage[] {
  return [
    { role: "system", content: system },
    { role: "user", content: userContent },
  ];
}
