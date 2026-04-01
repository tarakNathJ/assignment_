export type LlmProvider = "openai" | "anthropic" | "google" | "groq";

export type ChartKind = "bar" | "line" | "pie" | "scatter" | "table";

export interface SchemaSummary {
  tables: {
    schema: string;
    name: string;
    columns: {
      name: string;
      dataType: string;
      udtName: string;
      isNullable: boolean;
      defaultValue: string | null;
    }[];
    foreignKeys: {
      column: string;
      referencedTable: string;
      referencedColumn: string;
    }[];
    sampleRows: Record<string, unknown>[];
  }[];
}

export interface QueryResponse {
  sql: string;
  explanation?: string | null;
  columns: string[];
  rows: Record<string, unknown>[];
  rowCount: number;
  chart: ChartKind;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
  sql?: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  sql: string;
  chartType: string;
  snapshotColumns: string[];
  snapshotRows: Record<string, unknown>[];
  layout: { x: number; y: number; w: number; h: number };
  createdAt: string;
}

export interface DashboardRecord {
  id: string;
  title: string;
  shareToken: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}
