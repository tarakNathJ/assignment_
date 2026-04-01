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
        /* ─── Win2K Workspace ─── */
        .workspace-container {
          height: 100%;
          width: 100%;
          display: flex;
          background: #d4d0c8;
          overflow: hidden;
        }

        /* ─── Schema Panel ─── */
        .schema-panel {
          width: 220px;
          flex-shrink: 0;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
          margin: 4px 0 4px 4px;
        }

        .schema-panel.collapsed {
          width: 22px;
          margin: 4px 0 4px 4px;
        }

        /* ─── Results Panel ─── */
        .results-panel {
          width: 38%;
          min-width: 300px;
          max-width: 480px;
          flex-shrink: 0;
          background: #d4d0c8;
          display: flex;
          flex-direction: column;
          border-left: 2px solid #808080;
        }

        .results-panel.collapsed {
          width: 22px;
          min-width: 22px;
        }

        /* ─── Panel Header ─── */
        .panel-header {
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 4px;
          background: linear-gradient(90deg, #0a246a 0%, #3a6ea8 100%);
          flex-shrink: 0;
        }

        .panel-title {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #ffffff;
        }

        .panel-title svg {
          color: #ffffff;
        }

        .panel-actions {
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .icon-btn {
          width: 16px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: #d4d0c8;
          color: #000000;
          cursor: pointer;
          font-size: 9px;
          font-weight: 700;
          border-top: 1px solid #ffffff;
          border-left: 1px solid #ffffff;
          border-bottom: 1px solid #808080;
          border-right: 1px solid #808080;
          padding: 0;
        }

        .icon-btn:hover {
          background: #e8e4dc;
        }

        .icon-btn:active {
          border-top: 1px solid #808080;
          border-left: 1px solid #808080;
          border-bottom: 1px solid #ffffff;
          border-right: 1px solid #ffffff;
        }

        .icon-btn.expand-btn {
          width: 18px;
          flex-direction: column;
          gap: 1px;
          padding: 2px 0;
          height: auto;
        }

        .panel-content {
          flex: 1;
          overflow-y: auto;
          padding: 4px;
          background: #ffffff;
        }

        .panel-error {
          margin: 6px;
          padding: 4px 6px;
          border: 1px solid #cc0000;
          background: #fff0f0;
          color: #cc0000;
          font-size: 11px;
        }

        /* ─── Chat Panel ─── */
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #d4d0c8;
          min-width: 0;
        }

        /* AI Warning Banner */
        .ai-warning-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 8px;
          background: #ffffc0;
          border-bottom: 1px solid #cc6600;
        }

        .ai-warning-content {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #cc6600;
        }

        .ai-warning-content svg {
          flex-shrink: 0;
        }

        .ai-warning-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          background: #d4d0c8;
          color: #000000;
          font-size: 11px;
          font-weight: 400;
          cursor: pointer;
          min-height: 21px;
        }

        .ai-warning-btn:hover {
          background: #e8e4dc;
        }

        /* Chat Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
          background: #d4d0c8;
        }

        /* Empty State - Win2K dialog style */
        .empty-state {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
          gap: 10px;
        }

        .empty-state-icon {
          width: 48px;
          height: 48px;
          background: #d4d0c8;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }

        .empty-state-icon svg {
          color: #0a246a;
        }

        .empty-state h2 {
          font-size: 14px;
          font-weight: 700;
          color: #000000;
          margin-bottom: 4px;
        }

        .empty-state-subtitle {
          font-size: 11px;
          color: #444444;
          margin-bottom: 12px;
        }

        .example-queries {
          display: flex;
          flex-direction: column;
          gap: 2px;
          width: 100%;
          max-width: 320px;
          margin-bottom: 10px;
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
          background: #ffffff;
          padding: 2px;
        }

        .example-query-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 6px;
          border: none;
          background: transparent;
          color: #000000;
          font-size: 11px;
          text-align: left;
          cursor: pointer;
        }

        .example-query-btn:hover {
          background: #0a246a;
          color: #ffffff;
        }

        .example-query-btn:hover svg {
          color: #ffffff;
        }

        .example-query-btn svg {
          color: #0a246a;
          flex-shrink: 0;
        }

        .configure-ai-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          background: #d4d0c8;
          color: #000000;
          font-size: 11px;
          font-weight: 700;
          cursor: pointer;
          min-height: 23px;
        }

        .configure-ai-btn:hover {
          background: #e8e4dc;
        }

        /* Messages List */
        .messages-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          width: 100%;
        }

        .message {
          display: flex;
          gap: 6px;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .message-avatar {
          width: 24px;
          height: 24px;
          background: #d4d0c8;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .message-avatar svg {
          color: #0a246a;
        }

        .message-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 80%;
        }

        .message.user .message-content {
          align-items: flex-end;
        }

        .message-bubble {
          padding: 4px 8px;
          font-size: 11px;
          line-height: 1.5;
        }

        .message.assistant .message-bubble {
          background: #ffffff;
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
          color: #000000;
        }

        .message.user .message-bubble {
          background: #0a246a;
          color: #ffffff;
          border: 1px solid #04154a;
        }

        .message-bubble p {
          margin: 0;
        }

        .message-bubble.loading {
          padding: 8px 12px;
        }

        .loading-dots {
          display: flex;
          gap: 4px;
          align-items: center;
        }

        .loading-dots span {
          width: 6px;
          height: 6px;
          background: #0a246a;
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
          background: #ffffff;
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
          overflow: hidden;
        }

        .sql-header {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px 6px;
          background: #d4d0c8;
          border-bottom: 1px solid #808080;
          font-size: 10px;
          font-weight: 700;
          color: #000000;
          text-transform: none;
          letter-spacing: 0;
        }

        .sql-header svg {
          color: #0a246a;
        }

        .sql-code {
          margin: 0;
          padding: 6px 8px;
          font-family: "Courier New", Courier, monospace;
          font-size: 11px;
          line-height: 1.5;
          color: #000000;
          overflow-x: auto;
          white-space: pre-wrap;
          word-break: break-word;
          background: #ffffff;
        }

        /* Chat Input Area */
        .chat-input-area {
          padding: 6px 8px 8px;
          border-top: 2px solid #808080;
          background: #d4d0c8;
          flex-shrink: 0;
        }

        .input-error {
          margin-bottom: 6px;
          padding: 3px 6px;
          background: #fff0f0;
          border: 1px solid #cc0000;
          color: #cc0000;
          font-size: 11px;
        }

        .chat-input-wrapper {
          display: flex;
          gap: 4px;
          align-items: flex-end;
          background: #ffffff;
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
          padding: 4px 6px;
        }

        .chat-input-wrapper:focus-within {
          border-top: 2px solid #0a246a;
          border-left: 2px solid #0a246a;
        }

        .chat-textarea {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          color: #000000;
          font-size: 11px;
          line-height: 1.5;
          resize: none;
          min-height: 20px;
          max-height: 80px;
          font-family: "MS Sans Serif", "Microsoft Sans Serif", Tahoma, Arial, sans-serif;
        }

        .chat-textarea::placeholder {
          color: #808080;
        }

        .chat-input-actions {
          display: flex;
          gap: 3px;
          flex-shrink: 0;
          align-items: flex-end;
        }

        .settings-btn {
          width: 26px;
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          background: #d4d0c8;
          color: #000000;
          cursor: pointer;
        }

        .settings-btn:hover {
          background: #e8e4dc;
        }

        .settings-btn:active {
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
        }

        .send-btn {
          width: 26px;
          height: 23px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          background: #d4d0c8;
          color: #000000;
          cursor: pointer;
        }

        .send-btn:hover:not(:disabled) {
          background: #e8e4dc;
        }

        .send-btn:active:not(:disabled) {
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
        }

        .send-btn:disabled {
          color: #808080;
          cursor: default;
        }

        .chat-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 4px 0 0;
          padding: 0 2px;
        }

        .provider-badge {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 1px 6px;
          background: #d4d0c8;
          border: 1px solid #808080;
          color: #0a246a;
          font-size: 10px;
          font-weight: 700;
        }

        .keyboard-hint {
          font-size: 10px;
          color: #808080;
        }

        /* ─── Results Panel Content ─── */
        .results-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 3px 6px;
          border-bottom: 2px solid #808080;
          background: #d4d0c8;
          flex-shrink: 0;
        }

        .view-toggle {
          display: flex;
          gap: 2px;
        }

        .view-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          background: #d4d0c8;
          color: #000000;
          font-size: 11px;
          font-weight: 400;
          cursor: pointer;
          min-height: 21px;
        }

        .view-btn:hover {
          background: #e8e4dc;
        }

        .view-btn.active {
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
          background: #c8c4b8;
          font-weight: 700;
        }

        .exec-time {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 10px;
          color: #808080;
          font-family: "Courier New", monospace;
        }

        .chart-type-toolbar {
          padding: 4px 6px;
          border-bottom: 1px solid #808080;
          background: #d4d0c8;
        }

        .results-content {
          flex: 1;
          overflow: auto;
          padding: 6px;
          background: #d4d0c8;
        }

        .results-empty {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }

        .results-empty-icon {
          width: 48px;
          height: 48px;
          background: #d4d0c8;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 10px;
        }

        .results-empty-icon svg {
          color: #808080;
        }

        .results-empty-title {
          font-size: 11px;
          font-weight: 700;
          color: #000000;
          margin: 0 0 4px;
        }

        .results-empty-subtitle {
          font-size: 10px;
          color: #808080;
          margin: 0;
        }

        .results-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 8px;
          border-top: 2px solid #808080;
          background: #d4d0c8;
          flex-shrink: 0;
        }

        .results-stats {
          display: flex;
          gap: 16px;
        }

        .stat {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .stat-label {
          font-size: 9px;
          font-weight: 700;
          color: #808080;
          text-transform: none;
          letter-spacing: 0;
        }

        .stat-value {
          font-size: 12px;
          font-weight: 700;
          color: #000000;
          font-family: "Courier New", monospace;
        }

        .save-widget-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 10px;
          border-top: 2px solid #ffffff;
          border-left: 2px solid #ffffff;
          border-bottom: 2px solid #808080;
          border-right: 2px solid #808080;
          background: #d4d0c8;
          color: #000000;
          font-size: 11px;
          font-weight: 400;
          cursor: pointer;
          min-height: 23px;
        }

        .save-widget-btn:hover {
          background: #e8e4dc;
        }

        .save-widget-btn:active {
          border-top: 2px solid #808080;
          border-left: 2px solid #808080;
          border-bottom: 2px solid #ffffff;
          border-right: 2px solid #ffffff;
        }

        .save-widget-btn:disabled {
          color: #808080;
          cursor: default;
        }

        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
