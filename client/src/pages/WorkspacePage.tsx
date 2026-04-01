import { useEffect, useState, useRef, type KeyboardEvent } from "react";
import { useNavigate } from "react-router-dom";
import { 
  SendHorizontal, 
  Settings2, 
  RefreshCw, 
  Clock, 
  Save, 
  Database, 
  Bot, 
  ChevronLeft,
  ChevronRight,
  Table2,
  BarChart3,
  AlertCircle,
  Sparkles,
  Code2,
  MessageSquare
} from "lucide-react";
import * as dbApi from "../api/db";
import * as queryApi from "../api/query";
import * as dashApi from "../api/dashboard";
import type { ChartKind, ConversationTurn, QueryResponse, SchemaSummary } from "../types/domain";
import { getLlmSettings } from "../lib/llm-settings";
import { SchemaTree } from "../components/schema/SchemaTree";
import { ResultTable } from "../components/query/ResultTable";
import { ChartToolbar } from "../components/query/ChartToolbar";
import { ChartRenderer } from "../components/charts/ChartRenderer";
import * as authApi from "../api/auth";
import { LlmSettingsModal } from "../components/ui/LlmSettingsModal";
import { SaveWidgetModal } from "../components/ui/SaveWidgetModal";

const EXAMPLE_QUERIES = [
  "Top 5 products by revenue",
  "Order count by day for past 30 days",
  "Average order value by customer segment",
  "Monthly sales trend this year",
];

export function WorkspacePage() {
  const nav = useNavigate();
  const [schema, setSchema] = useState<SchemaSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [msg, setMsg] = useState("");
  const [conv, setConv] = useState<ConversationTurn[]>([]);
  const [result, setResult] = useState<QueryResponse | null>(null);
  const [chartKind, setChartKind] = useState<ChartKind>("table");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [execMs, setExecMs] = useState<number | null>(null);

  const [llmOpen, setLlmOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  
  // Panel collapse states
  const [schemaCollapsed, setSchemaCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const llm = getLlmSettings();
  const isLlmConfigured = llm.apiKey || llm.provider === "groq";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await authApi.me();
        if (!me.authed) { nav("/login", { replace: true }); return; }
        if (!me.db) { nav("/app/connect", { replace: true }); return; }
        const s = await dbApi.getSchema();
        if (!cancelled) setSchema(s);
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load schema");
      }
    })();
    return () => { cancelled = true; };
  }, [nav]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [msg]);

  async function runNl() {
    if (!msg.trim()) return;
    const settings = getLlmSettings();
    if (!settings.apiKey && settings.provider !== "groq") {
      setLlmOpen(true);
      return;
    }
    setBusy(true);
    setErr(null);
    const userTurn: ConversationTurn = { role: "user", content: msg.trim() };
    const newConv = [...conv, userTurn];
    setConv(newConv);
    setMsg("");
    const t0 = Date.now();
    try {
      const res = await queryApi.nlQuery({
        message: userTurn.content,
        provider: settings.provider,
        apiKey: settings.apiKey,
        model: settings.model.trim() || undefined,
        conversation: conv,
      });
      setExecMs(Date.now() - t0);
      setResult(res);
      setChartKind(res.chart);
      setConv([
        ...newConv,
        { role: "assistant", content: res.explanation ?? "Results ready.", sql: res.sql },
      ]);
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Query failed";
      setErr(errMsg);
      setConv([...newConv, { role: "assistant", content: "Error: " + errMsg }]);
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void runNl(); }
  }

  async function refreshSchema() {
    setLoadError(null);
    try {
      const s = await dbApi.refreshSchema();
      setSchema(s);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Refresh failed");
    }
  }

  async function handleSaveWidget(dashId: string, title: string) {
    if (!result) return;
    await dashApi.addWidget(dashId, {
      title,
      sql: result.sql,
      chartType: chartKind,
      snapshotColumns: result.columns,
      snapshotRows: result.rows,
      layout: { x: 0, y: 0, w: 6, h: 4 },
    });
  }

  function handleExampleClick(query: string) {
    setMsg(query);
    textareaRef.current?.focus();
  }

  const providerLabel = { openai: "OpenAI", anthropic: "Anthropic", google: "Gemini", groq: "Groq" }[llm.provider] ?? llm.provider;

  return (
    <div className="workspace-container">
      {/* ─── Left: Schema Panel ─── */}
      <aside className={`schema-panel ${schemaCollapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          {!schemaCollapsed && (
            <>
              <div className="panel-title">
                <Database size={16} />
                <span>Schema</span>
              </div>
              <div className="panel-actions">
                <button
                  type="button"
                  onClick={refreshSchema}
                  className="icon-btn"
                  title="Refresh schema"
                >
                  <RefreshCw size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setSchemaCollapsed(true)}
                  className="icon-btn"
                  title="Collapse panel"
                >
                  <ChevronLeft size={14} />
                </button>
              </div>
            </>
          )}
          {schemaCollapsed && (
            <button
              type="button"
              onClick={() => setSchemaCollapsed(false)}
              className="icon-btn expand-btn"
              title="Expand schema panel"
            >
              <Database size={16} />
              <ChevronRight size={14} />
            </button>
          )}
        </div>

        {!schemaCollapsed && (
          <>
            {loadError ? (
              <div className="panel-error">
                {loadError}
              </div>
            ) : null}
            <div className="panel-content">
              <SchemaTree schema={schema} />
            </div>
          </>
        )}
      </aside>

      {/* ─── Center: Chat Panel ─── */}
      <main className="chat-panel">
        {/* AI Configuration Warning */}
        {!isLlmConfigured && (
          <div className="ai-warning-banner">
            <div className="ai-warning-content">
              <AlertCircle size={16} />
              <span>Configure your AI provider to start querying</span>
            </div>
            <button
              type="button"
              onClick={() => setLlmOpen(true)}
              className="ai-warning-btn"
            >
              <Settings2 size={14} />
              Open Settings
            </button>
          </div>
        )}

        {/* Chat Messages */}
        <div className="chat-messages">
          {conv.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <Sparkles size={32} />
              </div>
              <h2>What would you like to know?</h2>
              <p className="empty-state-subtitle">
                Ask questions about your data in natural language
              </p>
              <div className="example-queries">
                {EXAMPLE_QUERIES.map((query) => (
                  <button
                    key={query}
                    type="button"
                    className="example-query-btn"
                    onClick={() => handleExampleClick(query)}
                  >
                    <MessageSquare size={12} />
                    {query}
                  </button>
                ))}
              </div>
              {!isLlmConfigured && (
                <button
                  type="button"
                  className="configure-ai-btn"
                  onClick={() => setLlmOpen(true)}
                >
                  <Settings2 size={14} />
                  Configure AI Provider
                </button>
              )}
            </div>
          ) : (
            <div className="messages-list">
              {conv.map((c, i) => (
                <div
                  key={i}
                  className={`message ${c.role === "user" ? "user" : "assistant"}`}
                >
                  {c.role === "assistant" && (
                    <div className="message-avatar">
                      <Bot size={16} />
                    </div>
                  )}
                  <div className="message-content">
                    <div className="message-bubble">
                      <p>{c.content}</p>
                    </div>
                    {c.sql && (
                      <div className="sql-block">
                        <div className="sql-header">
                          <Code2 size={12} />
                          <span>Generated SQL</span>
                        </div>
                        <pre className="sql-code">{c.sql}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {busy && (
                <div className="message assistant">
                  <div className="message-avatar">
                    <Bot size={16} />
                  </div>
                  <div className="message-content">
                    <div className="message-bubble loading">
                      <div className="loading-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="chat-input-area">
          {err && (
            <div className="input-error">
              {err}
            </div>
          )}
          <div className="chat-input-wrapper">
            <textarea
              ref={textareaRef}
              autoFocus
              className="chat-textarea"
              placeholder="Ask your data anything..."
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={busy}
              rows={1}
            />
            <div className="chat-input-actions">
              <button
                type="button"
                onClick={() => setLlmOpen(true)}
                className="settings-btn"
                title="AI Settings"
              >
                <Settings2 size={18} />
              </button>
              <button
                type="button"
                onClick={() => void runNl()}
                disabled={busy || !msg.trim()}
                className="send-btn"
                title="Send message"
              >
                <SendHorizontal size={18} />
              </button>
            </div>
          </div>
          <div className="chat-footer">
            <span className="provider-badge">
              <Sparkles size={10} />
              {providerLabel}
            </span>
            <span className="keyboard-hint">Enter to send, Shift+Enter for new line</span>
          </div>
        </div>
      </main>

      {/* ─── Right: Results Panel ─── */}
      <aside className={`results-panel ${resultsCollapsed ? 'collapsed' : ''}`}>
        <div className="panel-header">
          {!resultsCollapsed && (
            <>
              <div className="panel-title">
                {result ? (
                  <>
                    <BarChart3 size={16} />
                    <span>Results</span>
                  </>
                ) : (
                  <>
                    <Table2 size={16} />
                    <span>Results</span>
                  </>
                )}
              </div>
              <div className="panel-actions">
                <button
                  type="button"
                  onClick={() => setResultsCollapsed(true)}
                  className="icon-btn"
                  title="Collapse panel"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </>
          )}
          {resultsCollapsed && (
            <button
              type="button"
              onClick={() => setResultsCollapsed(false)}
              className="icon-btn expand-btn"
              title="Expand results panel"
            >
              <ChevronLeft size={14} />
              <BarChart3 size={16} />
            </button>
          )}
        </div>

        {!resultsCollapsed && (
          <>
            {/* View Toggle */}
            <div className="results-toolbar">
              <div className="view-toggle">
                <button
                  type="button"
                  className={`view-btn ${chartKind === "table" ? "active" : ""}`}
                  onClick={() => setChartKind("table")}
                >
                  <Table2 size={14} />
                  Table
                </button>
                <button
                  type="button"
                  className={`view-btn ${chartKind !== "table" ? "active" : ""}`}
                  onClick={() => setChartKind(chartKind === "table" ? "bar" : chartKind)}
                >
                  <BarChart3 size={14} />
                  Chart
                </button>
              </div>
              {execMs !== null && (
                <div className="exec-time">
                  <Clock size={12} />
                  {execMs}ms
                </div>
              )}
            </div>

            {/* Chart Type Selector (only when chart view is active) */}
            {chartKind !== "table" && (
              <div className="chart-type-toolbar">
                <ChartToolbar value={chartKind} onChange={setChartKind} />
              </div>
            )}

            {/* Results Content */}
            <div className="results-content">
              {result ? (
                <>
                  {chartKind !== "table" ? (
                    <ChartRenderer kind={chartKind} columns={result.columns} rows={result.rows} />
                  ) : (
                    <ResultTable columns={result.columns} rows={result.rows} />
                  )}
                </>
              ) : (
                <div className="results-empty">
                  <div className="results-empty-icon">
                    <BarChart3 size={32} />
                  </div>
                  <p className="results-empty-title">No results yet</p>
                  <p className="results-empty-subtitle">
                    Run a query to see your data visualized here
                  </p>
                </div>
              )}
            </div>

            {/* Results Footer */}
            {result && (
              <div className="results-footer">
                <div className="results-stats">
                  <div className="stat">
                    <span className="stat-label">Rows</span>
                    <span className="stat-value">{result.rowCount.toLocaleString()}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Columns</span>
                    <span className="stat-value">{result.columns.length}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSaveOpen(true)}
                  disabled={!result}
                  className="save-widget-btn"
                >
                  <Save size={14} />
                  Save to Dashboard
                </button>
              </div>
            )}
          </>
        )}
      </aside>

      {/* Modals */}
      <LlmSettingsModal open={llmOpen} onClose={() => setLlmOpen(false)} />
      <SaveWidgetModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        onSave={handleSaveWidget}
        chartKind={chartKind}
      />

      <style>{`
        .workspace-container {
          height: 100%;
          width: 100%;
          display: flex;
          background: var(--bg-dark);
          overflow: hidden;
        }

        /* ─── Schema Panel ─── */
        .schema-panel {
          width: 250px;
          flex-shrink: 0;
          background: var(--bg-panel);
          display: flex;
          flex-direction: column;
          border-right: 1px solid var(--border-subtle);
          transition: width 0.2s ease;
        }

        .schema-panel.collapsed {
          width: 44px;
        }

        /* ─── Results Panel ─── */
        .results-panel {
          width: 40%;
          min-width: 320px;
          max-width: 500px;
          flex-shrink: 0;
          background: var(--bg-panel);
          display: flex;
          flex-direction: column;
          border-left: 1px solid var(--border-subtle);
          transition: width 0.2s ease, min-width 0.2s ease;
        }

        .results-panel.collapsed {
          width: 44px;
          min-width: 44px;
        }

        /* ─── Panel Header ─── */
        .panel-header {
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-surface);
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .panel-title svg {
          color: var(--accent-primary);
        }

        .panel-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .icon-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .icon-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .icon-btn.expand-btn {
          width: 100%;
          flex-direction: column;
          gap: 2px;
          padding: 6px 0;
          height: auto;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }

        .panel-error {
          margin: 12px;
          padding: 10px 12px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(248, 113, 113, 0.3);
          background: var(--danger-muted);
          color: var(--danger);
          font-size: 12px;
        }

        /* ─── Chat Panel ─── */
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: var(--bg-dark);
          min-width: 0;
        }

        /* AI Warning Banner */
        .ai-warning-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          background: linear-gradient(90deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05));
          border-bottom: 1px solid rgba(251, 191, 36, 0.2);
        }

        .ai-warning-content {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: var(--warning);
        }

        .ai-warning-content svg {
          flex-shrink: 0;
        }

        .ai-warning-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(251, 191, 36, 0.3);
          background: rgba(251, 191, 36, 0.1);
          color: var(--warning);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .ai-warning-btn:hover {
          background: rgba(251, 191, 36, 0.15);
          border-color: rgba(251, 191, 36, 0.4);
        }

        /* Chat Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px 20px;
        }

        .empty-state-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-lg);
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
          box-shadow: 0 8px 32px rgba(99, 102, 241, 0.3);
        }

        .empty-state-icon svg {
          color: white;
        }

        .empty-state h2 {
          font-size: 20px;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 8px;
        }

        .empty-state-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 24px;
        }

        .example-queries {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
          max-width: 320px;
          margin-bottom: 20px;
        }

        .example-query-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-subtle);
          background: var(--bg-panel);
          color: var(--text-secondary);
          font-size: 13px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .example-query-btn:hover {
          background: var(--bg-hover);
          border-color: var(--border-default);
          color: var(--text-primary);
        }

        .example-query-btn svg {
          color: var(--accent-primary);
          flex-shrink: 0;
        }

        .configure-ai-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          background: transparent;
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .configure-ai-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        /* Messages List */
        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 800px;
          margin: 0 auto;
          width: 100%;
        }

        .message {
          display: flex;
          gap: 12px;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background: var(--accent-glow);
          border: 1px solid rgba(99, 102, 241, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-avatar svg {
          color: var(--accent-primary);
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-width: 70%;
        }

        .message.user .message-content {
          align-items: flex-end;
        }

        .message-bubble {
          padding: 12px 16px;
          border-radius: var(--radius-lg);
          font-size: 14px;
          line-height: 1.6;
        }

        .message.assistant .message-bubble {
          background: var(--bg-panel);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          border-top-left-radius: 4px;
        }

        .message.user .message-bubble {
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          color: white;
          border-top-right-radius: 4px;
        }

        .message-bubble p {
          margin: 0;
        }

        .message-bubble.loading {
          padding: 16px 20px;
        }

        .loading-dots {
          display: flex;
          gap: 6px;
        }

        .loading-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-primary);
          animation: bounce 1.4s ease-in-out infinite both;
        }

        .loading-dots span:nth-child(1) {
          animation-delay: -0.32s;
        }

        .loading-dots span:nth-child(2) {
          animation-delay: -0.16s;
        }

        /* SQL Block */
        .sql-block {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          overflow: hidden;
        }

        .sql-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: var(--bg-hover);
          border-bottom: 1px solid var(--border-subtle);
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .sql-header svg {
          color: var(--accent-primary);
        }

        .sql-code {
          margin: 0;
          padding: 12px;
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 12px;
          line-height: 1.6;
          color: var(--text-secondary);
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Chat Input Area */
        .chat-input-area {
          padding: 16px 20px 20px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-panel);
        }

        .input-error {
          margin-bottom: 12px;
          padding: 10px 14px;
          border-radius: var(--radius-md);
          background: var(--danger-muted);
          border: 1px solid rgba(248, 113, 113, 0.25);
          color: var(--danger);
          font-size: 13px;
        }

        .chat-input-wrapper {
          display: flex;
          gap: 10px;
          align-items: flex-end;
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 10px 12px;
          transition: all 0.15s ease;
          max-width: 800px;
          margin: 0 auto;
        }

        .chat-input-wrapper:focus-within {
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 3px var(--accent-glow);
        }

        .chat-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 14px;
          line-height: 1.5;
          resize: none;
          min-height: 24px;
          max-height: 120px;
          font-family: inherit;
        }

        .chat-textarea::placeholder {
          color: var(--text-muted);
        }

        .chat-input-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        .settings-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          border: none;
          background: transparent;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .settings-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .send-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          border: none;
          background: var(--accent-primary);
          color: white;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .send-btn:hover:not(:disabled) {
          background: var(--accent-primary-hover);
          transform: translateY(-1px);
        }

        .send-btn:disabled {
          opacity: 0.5;
          cursor: default;
        }

        .chat-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 10px auto 0;
          max-width: 800px;
          padding: 0 4px;
        }

        .provider-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: var(--radius-full);
          background: var(--accent-glow);
          color: var(--accent-primary);
          font-size: 11px;
          font-weight: 500;
        }

        .keyboard-hint {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* ─── Results Panel Content ─── */
        .results-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-surface);
        }

        .view-toggle {
          display: flex;
          gap: 4px;
          padding: 4px;
          background: var(--bg-panel);
          border-radius: var(--radius-md);
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .view-btn:hover {
          color: var(--text-primary);
        }

        .view-btn.active {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .exec-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted);
          font-family: "JetBrains Mono", ui-monospace, monospace;
        }

        .chart-type-toolbar {
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .results-content {
          flex: 1;
          overflow: auto;
          padding: 16px;
        }

        .results-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          opacity: 0.6;
        }

        .results-empty-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          background: var(--bg-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .results-empty-icon svg {
          color: var(--text-muted);
        }

        .results-empty-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px;
        }

        .results-empty-subtitle {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
        }

        .results-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-top: 1px solid var(--border-subtle);
          background: var(--bg-surface);
        }

        .results-stats {
          display: flex;
          gap: 20px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .stat-label {
          font-size: 10px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          font-family: "JetBrains Mono", ui-monospace, monospace;
        }

        .save-widget-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: var(--radius-md);
          border: 1px solid var(--border-default);
          background: var(--bg-panel);
          color: var(--text-secondary);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .save-widget-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
          border-color: var(--accent-primary);
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .results-panel {
            width: 35%;
            min-width: 280px;
          }
        }

        @media (max-width: 768px) {
          .workspace-container {
            flex-direction: column;
          }
          
          .schema-panel,
          .results-panel {
            width: 100%;
            max-width: none;
            min-width: auto;
            max-height: 200px;
          }
          
          .schema-panel.collapsed,
          .results-panel.collapsed {
            width: 100%;
            max-height: 44px;
          }
        }
      `}</style>
    </div>
  );
}
