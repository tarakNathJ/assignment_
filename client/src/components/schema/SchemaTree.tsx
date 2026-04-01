import { Table2, Columns3, Key, ChevronRight, ChevronDown } from "lucide-react";
import type { SchemaSummary } from "../../types/domain";

interface Props {
  schema: SchemaSummary | null;
}

export function SchemaTree({ schema }: Props) {
  if (!schema) return <div className="muted">Connect to load schema.</div>;
  return (
    <div className="schema-tree">
      {schema.tables.map((t) => (
        <details key={`${t.schema}.${t.name}`} open className="schema-table-details">
          <summary className="schema-table-summary">
            <span className="schema-summary-content">
              <ChevronRight size={14} className="schema-chevron schema-chevron-right" />
              <ChevronDown size={14} className="schema-chevron schema-chevron-down" />
              <Table2 size={14} className="schema-icon schema-icon-table" />
              <span className="schema-table-name">{t.schema}.{t.name}</span>
            </span>
          </summary>
          <div className="schema-cols">
            {t.columns.map((c) => (
              <div key={c.name} className="schema-col-item">
                <Columns3 size={12} className="schema-icon schema-icon-column" />
                <span className="schema-col-name">{c.name}</span>
                <span className="schema-col-type">
                  {c.dataType}
                  {c.isNullable ? "" : " not null"}
                </span>
              </div>
            ))}
            {t.foreignKeys.length ? (
              <div className="schema-fk-section">
                <div className="schema-fk-header">
                  <Key size={12} className="schema-icon schema-icon-key" />
                  <span className="schema-fk-label">Foreign Keys</span>
                </div>
                {t.foreignKeys.map((fk) => (
                  <div key={`${fk.column}-${fk.referencedTable}`} className="schema-fk-item">
                    <span className="schema-fk-column">{fk.column}</span>
                    <span className="schema-fk-arrow">→</span>
                    <span className="schema-fk-ref">{fk.referencedTable}.{fk.referencedColumn}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </details>
      ))}
    </div>
  );
}
