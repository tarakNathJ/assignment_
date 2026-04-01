import type { Pool } from "pg";
import { env } from "../config/env.js";
import { assertReadOnlySql, applyRowCap, SqlGuardError } from "./sql-guard.js";

export interface QueryRunResult {
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  sqlExecuted: string;
}

export async function runGuardedSelect(pool: Pool, rawSql: string): Promise<QueryRunResult> {
  const safe = assertReadOnlySql(rawSql);
  const capped = applyRowCap(safe, env.maxResultRows);
  const client = await pool.connect();
  try {
    await client.query("BEGIN READ ONLY");
    await client.query(`SET LOCAL statement_timeout = ${env.statementTimeoutMs}`);
    const res = await client.query<Record<string, unknown>>(capped);
    await client.query("COMMIT");
    const columns = res.fields?.map((f) => f.name) ?? Object.keys(res.rows[0] ?? {});
    return {
      columns,
      rows: res.rows,
      rowCount: res.rowCount ?? res.rows.length,
      sqlExecuted: capped,
    };
  } catch (e) {
    try {
      await client.query("ROLLBACK");
    } catch {
      /* ignore */
    }
    if (e instanceof SqlGuardError) throw e;
    throw e;
  } finally {
    client.release();
  }
}
