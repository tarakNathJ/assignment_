import { env } from "../config/env.js";

const FORBIDDEN = new Set([
  "insert",
  "update",
  "delete",
  "drop",
  "truncate",
  "alter",
  "create",
  "grant",
  "revoke",
  "copy",
  "comment",
  "vacuum",
  "analyze",
  "reindex",
  "cluster",
]);

export class SqlGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SqlGuardError";
  }
}

function stripSqlComments(sql: string): string {
  let s = sql.replace(/\/\*[\s\S]*?\*\//g, " ");
  s = s.replace(/--.*$/gm, " ");
  return s;
}

function normalize(sql: string): string {
  return stripSqlComments(sql).trim();
}

function stripStringLiterals(sql: string): string {
  return sql.replace(/'(?:''|[^'])*'/g, " ");
}

export function assertReadOnlySql(rawSql: string): string {
  const sql = normalize(rawSql).replace(/;\s*$/g, "");
  if (!sql) throw new SqlGuardError("Empty SQL");

  const semis = sql.split(";").map((p) => p.trim());
  const parts = semis.filter(Boolean);
  if (parts.length > 1) {
    throw new SqlGuardError("Only a single SQL statement is allowed");
  }

  const lowered = sql.toLowerCase();
  const bare = stripStringLiterals(lowered);
  if (/\bselect\b/.test(bare) && /\binto\b/.test(bare)) {
    throw new SqlGuardError("SELECT ... INTO is not allowed");
  }

  const tokens = bare.replace(/[\n\r\t]+/g, " ").split(/[^a-z0-9_]+/);
  for (const t of tokens) {
    if (!t) continue;
    if (FORBIDDEN.has(t)) {
      throw new SqlGuardError(`Statement may not contain: ${t.toUpperCase()}`);
    }
  }

  if (!/^(with|select)\b/i.test(sql)) {
    throw new SqlGuardError("Only SELECT or WITH … SELECT queries are allowed");
  }

  return sql;
}

function hasLimitClause(sql: string): boolean {
  return /\blimit\s+\d+/i.test(sql);
}

export function applyRowCap(sql: string, maxRows: number = env.maxResultRows): string {
  if (hasLimitClause(sql)) {
    return sql.replace(/\blimit\s+(\d+)/i, (_, n) => {
      const v = Math.min(parseInt(n, 10), maxRows);
      return `LIMIT ${v}`;
    });
  }
  return `${sql}\nLIMIT ${maxRows}`;
}
