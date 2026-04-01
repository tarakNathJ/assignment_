import type { Pool } from "pg";
import type { SchemaSummary, TableInfo } from "../types/schema.js";

const SAMPLE_LIMIT = 3;

export async function introspectSchema(pool: Pool): Promise<SchemaSummary> {
  const client = await pool.connect();
  try {
    const tablesRes = await client.query<{ table_schema: string; table_name: string }>(
      `SELECT table_schema, table_name
       FROM information_schema.tables
       WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         AND table_type = 'BASE TABLE'
       ORDER BY table_schema, table_name`,
    );

    const tables: TableInfo[] = [];

    for (const row of tablesRes.rows) {
      const cols = await client.query<{
        column_name: string;
        data_type: string;
        udt_name: string;
        is_nullable: string;
        column_default: string | null;
      }>(
        `SELECT column_name, data_type, udt_name, is_nullable, column_default
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [row.table_schema, row.table_name],
      );

      const fks = await client.query<{
        kcu_column: string;
        ccu_table: string;
        ccu_column: string;
      }>(
        `SELECT
           kcu.column_name AS kcu_column,
           ccu.table_name AS ccu_table,
           ccu.column_name AS ccu_column
         FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu
           ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage ccu
           ON ccu.constraint_name = tc.constraint_name
           AND ccu.table_schema = tc.table_schema
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND tc.table_schema = $1
           AND tc.table_name = $2`,
        [row.table_schema, row.table_name],
      );

      const colNames = cols.rows.map((c) => `"${c.column_name.replace(/"/g, '""')}"`);
      let sampleRows: Record<string, unknown>[] = [];
      if (colNames.length > 0) {
        const safeIdent = `"${row.table_schema.replace(/"/g, '""')}"."${row.table_name.replace(/"/g, '""')}"`;
        try {
          const sample = await client.query(
            `SELECT ${colNames.join(", ")} FROM ${safeIdent} LIMIT ${SAMPLE_LIMIT}`,
          );
          sampleRows = sample.rows as Record<string, unknown>[];
        } catch {
          sampleRows = [];
        }
      }

      tables.push({
        schema: row.table_schema,
        name: row.table_name,
        columns: cols.rows.map((c) => ({
          name: c.column_name,
          dataType: c.data_type,
          udtName: c.udt_name,
          isNullable: c.is_nullable === "YES",
          defaultValue: c.column_default,
        })),
        foreignKeys: fks.rows.map((fk) => ({
          column: fk.kcu_column,
          referencedTable: fk.ccu_table,
          referencedColumn: fk.ccu_column,
        })),
        sampleRows,
      });
    }

    return { tables };
  } finally {
    client.release();
  }
}
