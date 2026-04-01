import type { Request, Response } from "express";
import { z } from "zod";
import { getPool } from "../services/connection-registry.js";
import { getSchema } from "../services/schema-cache.js";
import { generateSqlWithRetry } from "../services/llm/llm-router.js";
import {
  schemaPrompt,
  systemPrompt,
  userBlocks,
  toMessages,
} from "../services/llm/prompt-builders.js";
import { runGuardedSelect } from "../services/query-runner.js";
import { suggestChart } from "../services/chart-suggestion.js";
import type { LlmProvider } from "../types/llm.js";
import { env } from "../config/env.js";

const bodySchema = z.object({
  message: z.string().min(1),
  provider: z.enum(["openai", "anthropic", "google", "groq"]),
  apiKey: z.string().optional().default(""),
  model: z.string().optional(),
  conversation: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
        sql: z.string().optional(),
      }),
    )
    .optional(),
});

export async function nlQueryHandler(req: Request, res: Response): Promise<void> {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const sid = req.session?.sid;
  const pool = sid ? getPool(sid) : undefined;
  const schema = sid ? getSchema(sid) : undefined;
  if (!pool || !schema) {
    res.status(400).json({ error: "Connect a database first" });
    return;
  }

  const { message, provider, apiKey: rawKey, model, conversation } = parsed.data;
  const fromEnv = provider === "groq" ? env.groqApiKey : "";
  const apiKey = (rawKey.trim() || fromEnv).trim();
  if (apiKey.length < 8) {
    res.status(400).json({
      error:
        provider === "groq"
          ? "Missing Groq API key. Paste it in the UI or set GROQ_API_KEY in server/.env."
          : "Missing API key.",
    });
    return;
  }

  const schemaJson = schemaPrompt(schema);
  const sys = systemPrompt(schemaJson);
  const userContent = userBlocks(message, conversation ?? []);
  const messages = toMessages(sys, userContent);

  try {
    const gen = await generateSqlWithRetry(provider as LlmProvider, apiKey, model, messages);
    const exec = await runGuardedSelect(pool, gen.sql);
    const chart = suggestChart(exec.columns, exec.rows, gen.chartHint);
    res.json({
      sql: exec.sqlExecuted,
      explanation: gen.explanation ?? null,
      columns: exec.columns,
      rows: exec.rows,
      rowCount: exec.rowCount,
      chart,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Query failed";
    res.status(400).json({ error: msg });
  }
}
