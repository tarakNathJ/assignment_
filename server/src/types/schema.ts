export interface ColumnInfo {
  name: string;
  dataType: string;
  udtName: string;
  isNullable: boolean;
  defaultValue: string | null;
}

export interface ForeignKeyInfo {
  column: string;
  referencedTable: string;
  referencedColumn: string;
}

export interface TableInfo {
  schema: string;
  name: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKeyInfo[];
  sampleRows: Record<string, unknown>[];
}

export interface SchemaSummary {
  tables: TableInfo[];
}
