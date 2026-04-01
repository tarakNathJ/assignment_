import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Trash2,
  BarChart,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Activity,
  X,
  AlertCircle,
  Cpu,
  Zap,
  Shield,
  Server,
  TrendingUp,
  Terminal,
  Filter,
  RefreshCw,
} from "lucide-react";
import * as dashApi from "../api/dashboard";
import type { DashboardRecord, ChartKind, DashboardWidget } from "../types/domain";
import { ChartRenderer } from "../components/charts/ChartRenderer";
import { Button } from "../components/ui/Button";
import { ShareDashboardModal } from "../components/dashboard/ShareDashboardModal";

const CHART_TYPES: ChartKind[] = ["bar", "line", "pie", "scatter"];

const CHART_ICONS: Record<string, React.ReactNode> = {
  bar: <BarChart size={14} />,
  line: <LineChartIcon size={14} />,
  pie: <PieChartIcon size={14} />,
  scatter: <Activity size={14} />,
};

// Simulated system services
const SYSTEM_SERVICES = [
  { name: "Gateway Alpha", status: "OPTIMAL", color: "#34d399" },
  { name: "Query Engine v4", status: "OPTIMAL", color: "#34d399" },
  { name: "Storage Shard B", status: "RE-INDEXING", color: "#f87171" },
  { name: "Auth Bridge", status: "OPTIMAL", color: "#34d399" },
];

// Random hex-like query IDs
function fakeHex() {
  return `0x${Math.random().toString(16).slice(2, 10).toUpperCase()}`;
}

const SOURCES = ["Production-API", "Batch-Scheduler", "Internal-CLI", "Web-Interface", "Analytics-SDK"];
const RESOURCES = ["8 Core / 32GB", "16 Core / 64GB", "1 Core / 2GB", "4 Core / 16GB", "8 Core / 32GB"];





// Throughput sparkline (cyan)
function ThroughputChart() {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 1, height: 32 }}>
      {Array.from({ length: 16 }, (_, i) => (
        <div key={i} style={{
          flex: 1, borderRadius: 1,
          height: `${30 + Math.sin(i * 0.8) * 25 + Math.random() * 20}%`,
          background: "rgba(0,212,255,0.35)",
        }} />
      ))}
    </div>
  );
}

export function DashboardEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dash, setDash] = useState<DashboardRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [widgetToDelete, setWidgetToDelete] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        setLoading(true);
        const d = await dashApi.getDashboard(id);
        if (!cancelled) {
          setDash(d);
          setTitleValue(d.title);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  async function handleTitleSave() {
    if (!id || !dash) return;
    const newTitle = titleValue.trim();
    if (!newTitle || newTitle === dash.title) {
      setTitleValue(dash.title);
      setIsEditingTitle(false);
      return;
    }
    try {
      const updated = await dashApi.updateDashboard(id, newTitle);
      setDash(updated);
      setIsEditingTitle(false);
    } catch {
      setTitleValue(dash.title);
      setIsEditingTitle(false);
    }
  }

  function handleTitleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleTitleSave();
    else if (e.key === "Escape") {
      setTitleValue(dash?.title || "");
      setIsEditingTitle(false);
    }
  }

  async function handleDeleteDashboard() {
    if (!id) return;
    try {
      await dashApi.deleteDashboard(id);
      navigate("/app/dashboards");
    } catch { /* silent */ }
  }

  async function handleDeleteWidget(widgetId: string) {
    if (!id) return;
    try {
      await dashApi.deleteWidget(id, widgetId);
      setDash(prev => prev ? { ...prev, widgets: prev.widgets.filter(w => w.id !== widgetId) } : null);
    } catch { /* silent */ } finally {
      setWidgetToDelete(null);
    }
  }

  function toggleChartType(widget: DashboardWidget) {
    if (!dash) return;
    const currentIndex = CHART_TYPES.indexOf(widget.chartType as ChartKind);
    const nextType = CHART_TYPES[(currentIndex + 1) % CHART_TYPES.length];
    setDash({ ...dash, widgets: dash.widgets.map(w => w.id === widget.id ? { ...w, chartType: nextType } : w) });
  }



  const timeStr = currentTime.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = currentTime.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", flexDirection: "column", gap: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "spin 1s linear infinite",
        }}>
          <RefreshCw size={22} color="#a855f7" />
        </div>
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>LOADING STREAM...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (err || !dash) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", textAlign: "center", gap: 16 }}>
        <AlertCircle size={40} color="#f87171" />
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>Dashboard Not Found</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{err || "Dashboard does not exist."}</p>
        <Link to="/app/dashboards" style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px",
          background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.3)",
          borderRadius: 6, color: "#a855f7", fontSize: 12, textDecoration: "none", fontFamily: "monospace",
        }}>
          <ArrowLeft size={14} /> Back to Dashboards
        </Link>
      </div>
    );
  }

  const shareUrl = `${window.location.origin}/share/${dash.shareToken}`;
  const widgetCount = dash.widgets.length;

  // Build fake execution query rows from widgets (or placeholder)
  const execRows = widgetCount > 0
    ? dash.widgets.map((w, i) => ({
        id: fakeHex(),
        runtime: `${(Math.random() * 1.5 + 0.1).toFixed(3)}s`,
        resources: RESOURCES[i % RESOURCES.length],
        source: SOURCES[i % SOURCES.length],
        sql: w.title,
        status: i % 5 === 3 ? "RUNNING" : "SUCCESS",
      }))
    : Array.from({ length: 4 }, (_, i) => ({
        id: fakeHex(),
        runtime: `${(Math.random() * 1.5 + 0.1).toFixed(3)}s`,
        resources: RESOURCES[i % RESOURCES.length],
        source: SOURCES[i % SOURCES.length],
        sql: ["SELECT * FROM telemetry", "SELECT COUNT(*) FROM logs", "SELECT latency FROM metrics", "SELECT * FROM nodes"][i],
        status: i === 2 ? "RUNNING" : "SUCCESS",
      }));

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px 80px", minHeight: "100%", fontFamily: "'Inter', monospace" }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes glowPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }
        @keyframes scanAnim { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .kpi-card:hover { border-color: rgba(0,212,255,0.3) !important; transform: translateY(-2px); }
        .kpi-card { transition: all 0.2s ease !important; }
        .widget-card:hover { border-color: rgba(168,85,247,0.3) !important; }
        .widget-card { transition: all 0.2s ease !important; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/app/dashboards" style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            width: 32, height: 32, borderRadius: 6,
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)",
            color: "rgba(255,255,255,0.6)", textDecoration: "none", transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#00d4ff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "2px 8px", background: "rgba(0,212,255,0.08)",
                border: "1px solid rgba(0,212,255,0.2)", borderRadius: 3,
                fontSize: 9, fontFamily: "monospace", color: "#00d4ff",
                letterSpacing: "0.1em", fontWeight: 700,
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00d4ff", animation: "glowPulse 2s ease infinite" }} />
                SHARED DASHBOARD
              </span>
              <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
                {dateStr} · {timeStr}
              </span>
            </div>
            {isEditingTitle ? (
              <input
                ref={titleInputRef}
                type="text"
                value={titleValue}
                onChange={e => setTitleValue(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={handleTitleKeyDown}
                style={{
                  fontSize: 24, fontWeight: 700, color: "#fff", background: "transparent",
                  border: "none", borderBottom: "1px solid rgba(0,212,255,0.4)", outline: "none",
                  minWidth: 300, padding: "2px 0",
                }}
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                title="Click to edit"
                style={{ fontSize: 24, fontWeight: 700, color: "#fff", cursor: "pointer", letterSpacing: "-0.02em", lineHeight: 1.2 }}
              >
                {dash.title}
              </h1>
            )}
            <p style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", marginTop: 2 }}>
              REAL-TIME TELEMETRY • VIEW ONLY MODE
            </p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setShareOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 6, color: "rgba(255,255,255,0.7)", fontSize: 12, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: "0.04em", transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#00d4ff"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
          >
            <Share2 size={13} /> Share
          </button>
          <button onClick={() => setDeleteConfirmOpen(true)} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 14px",
            background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.2)",
            borderRadius: 6, color: "#f87171", fontSize: 12, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: "0.04em", transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.12)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.06)"; }}
          >
            <Trash2 size={13} /> Delete
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        {[
          {
            label: "CPU UTILIZATION",
            value: widgetCount > 0 ? `${Math.min(99, widgetCount * 12 + 50).toFixed(1)}%` : "74.2%",
            icon: Cpu, color: "#00d4ff",
            sublabel: "PROCESSING LOAD",
            subvalue: <div style={{ height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 99, marginTop: 6 }}>
              <div style={{ width: "74%", height: "100%", background: "linear-gradient(90deg, #00d4ff, #00d4ff88)", borderRadius: 99, boxShadow: "0 0 6px #00d4ff66" }} />
            </div>,
          },
          {
            label: "TOPS LATENCY",
            value: "1.2ms",
            icon: Zap, color: "#a855f7",
            sublabel: "AVG RESPONSE TIME",
            subvalue: <div style={{ height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 99, marginTop: 6 }}>
              <div style={{ width: "35%", height: "100%", background: "linear-gradient(90deg, #a855f7, #a855f788)", borderRadius: 99, boxShadow: "0 0 6px #a855f766" }} />
            </div>,
          },
          {
            label: "ACTIVE NODES",
            value: widgetCount > 0 ? `${widgetCount}/128` : "128/128",
            icon: Server, color: "#34d399",
            sublabel: "NODE CLUSTER",
            subvalue: <div style={{ height: 2, background: "rgba(255,255,255,0.1)", borderRadius: 99, marginTop: 6 }}>
              <div style={{ width: widgetCount > 0 ? `${Math.min(100, (widgetCount / 128) * 100)}%` : "100%", height: "100%", background: "linear-gradient(90deg, #34d399, #34d39988)", borderRadius: 99, boxShadow: "0 0 6px #34d39966" }} />
            </div>,
          },
          {
            label: "THROUGHPUT",
            value: "4.2 GB/s",
            icon: TrendingUp, color: "#fbbf24",
            sublabel: "DATA TRANSFER RATE",
            subvalue: <ThroughputChart />,
          },
        ].map(({ label, value, icon: Icon, color, sublabel, subvalue }) => (
          <div key={label} className="kpi-card" style={{
            background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8, padding: "14px 16px",
            position: "relative", overflow: "hidden",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 6 }}>
                  {label}
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color, fontFamily: "monospace", letterSpacing: "-0.02em" }}>
                  {value}
                </div>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: `${color}14`, border: `1px solid ${color}30`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon size={15} color={color} />
              </div>
            </div>
            {subvalue}
            <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)", marginTop: 6, letterSpacing: "0.06em" }}>
              {sublabel}
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN CONTENT AREA ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginBottom: 16 }}>

        {/* Traffic Refraction Map */}
        <div style={{
          background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 8, padding: "16px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 2 }}>Traffic Refraction Map</div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
                TEMPORAL ANALYSIS · {widgetCount > 0 ? `${widgetCount} ACTIVE STREAMS` : "0 STREAMS"}
              </div>
            </div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 8px", background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)", borderRadius: 3,
              fontSize: 9, fontFamily: "monospace", color: "#00d4ff", letterSpacing: "0.08em",
            }}>
              <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#00d4ff", animation: "glowPulse 1.5s ease infinite" }} />
              LIVE
            </span>
          </div>

          {/* Bar chart - uses real widgets or placeholder */}
          {widgetCount > 0 ? (
            <div style={{ height: 200 }}>
              <ChartRenderer
                kind="bar"
                columns={dash.widgets[0].snapshotColumns}
                rows={dash.widgets[0].snapshotRows}
              />
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 180, padding: "0 8px" }}>
              {Array.from({ length: 16 }, (_, i) => {
                const isHighlighted = i >= 6 && i <= 8;
                const h = isHighlighted ? 65 + Math.random() * 25 : 20 + Math.random() * 50;
                return (
                  <div key={i} style={{ flex: 1, borderRadius: "3px 3px 0 0", height: `${h}%`, position: "relative", overflow: "hidden" }}>
                    <div style={{
                      position: "absolute", inset: 0,
                      background: isHighlighted
                        ? "linear-gradient(to top, #a855f7, #6366f1)"
                        : "rgba(168,85,247,0.18)",
                      boxShadow: isHighlighted ? "0 0 12px rgba(168,85,247,0.4)" : "none",
                    }} />
                    {isHighlighted && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: "100%",
                        background: "linear-gradient(180deg, rgba(255,255,255,0.15), transparent)",
                      }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* System Health Status */}
        <div style={{
          background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 8, padding: "16px 18px",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: 14 }}>
            SYSTEM HEALTH STATUS
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {SYSTEM_SERVICES.map(svc => (
              <div key={svc.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontFamily: "monospace" }}>{svc.name}</span>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "2px 8px", borderRadius: 3, fontSize: 9,
                  fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em",
                  background: `${svc.color}14`, border: `1px solid ${svc.color}30`, color: svc.color,
                }}>
                  {svc.status}
                </span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button
              onClick={() => { /* noop – placeholder */ }}
              style={{
                width: "100%", padding: "8px", borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.5)",
                fontSize: 11, fontFamily: "monospace", cursor: "pointer", letterSpacing: "0.06em",
                transition: "all 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,212,255,0.3)"; (e.currentTarget as HTMLElement).style.color = "#00d4ff"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.5)"; }}
            >
              VIEW SYSTEM LOGS
            </button>
          </div>
        </div>
      </div>

      {/* ── WIDGETS (if any) ── */}
      {widgetCount > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>PINNED WIDGETS</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(400px, 1fr))", gap: 14 }}>
            {dash.widgets.map(w => (
              <div key={w.id} className="widget-card" style={{
                background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8, overflow: "hidden",
              }}>
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#fff", fontFamily: "monospace" }}>{w.title}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button onClick={() => toggleChartType(w)} style={{
                      padding: "5px", borderRadius: 5, background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)",
                      cursor: "pointer", display: "flex",
                    }}>
                      {CHART_ICONS[w.chartType] || <BarChart size={13} />}
                    </button>
                    <button onClick={() => setWidgetToDelete(w.id)} style={{
                      padding: "5px", borderRadius: 5, background: "rgba(248,113,113,0.06)",
                      border: "1px solid rgba(248,113,113,0.15)", color: "#f87171",
                      cursor: "pointer", display: "flex",
                    }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ height: Math.max(220, w.layout.h * 80) }}>
                    <ChartRenderer kind={w.chartType as ChartKind} columns={w.snapshotColumns} rows={w.snapshotRows} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RECENT EXECUTION QUERIES ── */}
      <div style={{
        background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 8, marginBottom: 16, overflow: "hidden",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}>
          <span style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em" }}>
            RECENT EXECUTION QUERIES
          </span>
          <Filter size={12} color="rgba(255,255,255,0.3)" />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {["QUERY HASH", "RUNTIME", "RESOURCES", "SOURCE", "STATUS"].map(h => (
                  <th key={h} style={{
                    padding: "8px 14px", textAlign: "left",
                    fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.25)",
                    letterSpacing: "0.08em", fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {execRows.map((row, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "#00d4ff" }}>
                    {row.id}...
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    {row.runtime}
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    {row.resources}
                  </td>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                    {row.source}
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "2px 8px", borderRadius: 3, fontSize: 9,
                      fontFamily: "monospace", fontWeight: 700, letterSpacing: "0.06em",
                      background: row.status === "SUCCESS" ? "rgba(52,211,153,0.1)" : "rgba(251,191,36,0.1)",
                      border: `1px solid ${row.status === "SUCCESS" ? "rgba(52,211,153,0.25)" : "rgba(251,191,36,0.25)"}`,
                      color: row.status === "SUCCESS" ? "#34d399" : "#fbbf24",
                    }}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BOTTOM PANELS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Neural Prediction Layer */}
        <div style={{
          background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
          borderLeft: "2px solid #a855f7", borderRadius: 8, padding: "20px",
          position: "relative", overflow: "hidden",
        }}>
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 80, opacity: 0.08,
            background: "linear-gradient(to left, #a855f7, transparent)",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 6, background: "rgba(168,85,247,0.12)",
              border: "1px solid rgba(168,85,247,0.25)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Cpu size={14} color="#a855f7" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Neural Prediction Layer</div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 16 }}>
            Our AI forecasting models anticipate a <span style={{ color: "#a855f7", fontWeight: 600 }}>15% surge</span> in
            compute demand over the next 4 hours based on historical cluster patterns.
          </p>
          <button style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 16px", background: "rgba(168,85,247,0.1)",
            border: "1px solid rgba(168,85,247,0.3)", borderRadius: 6,
            color: "#a855f7", fontSize: 11, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: "0.06em", fontWeight: 700,
            transition: "all 0.15s",
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(168,85,247,0.1)"; }}
          >
            <Zap size={12} /> OPTIMIZE NOW
          </button>
        </div>

        {/* Security Overview */}
        <div style={{
          background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
          borderLeft: "2px solid #00d4ff", borderRadius: 8, padding: "20px",
        }}>
          <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", marginBottom: 12 }}>
            SECURITY OVERVIEW
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8, background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Shield size={18} color="#00d4ff" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>End-to-End Encrypted</div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>
                TLS1.3/{Math.random().toString(16).slice(2, 12).toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{
            background: "#060a0f", border: "1px solid rgba(0,212,255,0.12)",
            borderRadius: 6, padding: "8px 10px",
            fontFamily: "monospace", fontSize: 10, color: "#00d4ff", lineHeight: 1.6,
          }}>
            "All telemetry data is anonymized at the edge before visualization."
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button onClick={() => navigate("/app")} style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              gap: 6, padding: "8px", background: "rgba(0,212,255,0.06)",
              border: "1px solid rgba(0,212,255,0.2)", borderRadius: 6,
              color: "#00d4ff", fontSize: 11, cursor: "pointer",
              fontFamily: "monospace", letterSpacing: "0.04em",
              transition: "all 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.12)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.06)"; }}
            >
              <Terminal size={12} /> Go to Workspace
            </button>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ textAlign: "center", paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.15)", letterSpacing: "0.1em" }}>
          POWERED BY QUERYMIND
        </div>
        <div style={{ fontSize: 8, fontFamily: "monospace", color: "rgba(255,255,255,0.1)", marginTop: 4, letterSpacing: "0.06em" }}>
          SYSTEM VERSION 2.1.0-PROD · LAST SYNC: {dateStr} {timeStr} · BUILD ID: QM-{Math.random().toString(16).slice(2, 8).toUpperCase()}
        </div>
      </div>

      {/* ── Share Modal ── */}
      <ShareDashboardModal open={shareOpen} onClose={() => setShareOpen(false)} shareUrl={shareUrl} />

      {/* ── Delete Dashboard Confirm ── */}
      {deleteConfirmOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
          <div style={{ width: 400, maxWidth: "92vw", background: "#0d1117", border: "1px solid rgba(248,113,113,0.2)", borderRadius: 12, padding: 24 }}>
            <button onClick={() => setDeleteConfirmOpen(false)} style={{ position: "absolute", right: "calc(50% - 188px)", marginTop: -12, background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer" }}>
              <X size={16} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trash2 size={16} color="#f87171" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#fff", fontFamily: "monospace" }}>DELETE DASHBOARD?</h3>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20, lineHeight: 1.6, fontFamily: "monospace" }}>
              This will permanently delete "{dash.title}" and all its widgets.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button variant="outline" onClick={handleDeleteDashboard} style={{ borderColor: "rgba(248,113,113,0.3)", color: "#f87171" }}>Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Widget Confirm ── */}
      {widgetToDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)" }}>
          <div style={{ width: 360, maxWidth: "92vw", background: "#0d1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", marginBottom: 10, fontFamily: "monospace" }}>REMOVE WIDGET?</h3>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 16, fontFamily: "monospace" }}>This widget will be removed from the dashboard.</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setWidgetToDelete(null)} style={{ padding: "7px 14px", background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>Cancel</button>
              <button onClick={() => void handleDeleteWidget(widgetToDelete)} style={{ padding: "7px 14px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 6, color: "#f87171", fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
