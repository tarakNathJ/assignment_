import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Share2,
  Trash2,
  X,
  Loader2,
  Filter,
  Zap,
  Shield,
  TrendingUp,
  Globe,
  Cpu,
  BarChart3,
  Clock,
  ChevronRight,
  Terminal,
  RefreshCw,
} from "lucide-react";
import * as dashApi from "../api/dashboard";
import type { DashboardRecord } from "../types/domain";
import { Button } from "../components/ui/Button";

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// Category config cycling per index
const CATEGORIES = [
  { label: "PRODUCTION", tags: ["CRITICAL", "K8S CORE"], metricLabel: "LATENCY", metricValue: "24ms", Icon: Zap, color: "#00d4ff", tagColors: ["#ec4899", "#6366f1"] },
  { label: "MARKETING", tags: ["GLOBAL", "Q3 TARGET"], metricLabel: "CONVERSION", metricValue: "14.2%", Icon: TrendingUp, color: "#a855f7", tagColors: ["#38bdf8", "#38bdf8"] },
  { label: "LOGISTICS", tags: ["LIVE"], metricLabel: "ACTIVE ROUTES", metricValue: "1,402", Icon: Globe, color: "#34d399", tagColors: ["#34d399"] },
  { label: "SECURITY", tags: ["HIGH RISK"], metricLabel: "BLOCKED IPS", metricValue: "8.2k", Icon: Shield, color: "#f87171", tagColors: ["#f87171"] },
  { label: "FINANCE", tags: ["EBITDA"], metricLabel: "MONTHLY GROWTH", metricValue: "+22.4%", Icon: BarChart3, color: "#fbbf24", tagColors: ["#fbbf24"] },
  { label: "AI LAB", tags: ["GPT-40", "API V2"], metricLabel: "DAILY AVG", metricValue: "1.2M", Icon: Cpu, color: "#818cf8", tagColors: ["#818cf8", "#818cf8"] },
];

// LOG messages rotating in Query Optimizer
const LOG_MESSAGES = [
  "LOG: Executing sub-query heuristics for #real-time-cluster-metrics...",
  "INFO: Redundant joins detected in schema 'schema_prod_v2'.",
  "WARN: Suggesting index optimization on \"latency_logs\" column [12.4% perf gain estimated].",
  "LOG: Materialized view refresh complete — 847ms.",
  "INFO: Query cache hit ratio: 94.2% ↑",
  "LOG: Partition pruning applied to telemetry_stream table.",
  "DEBUG: Connection pool utilization: 67%",
  "LOG: Auto-vacuum triggered on widgets_snapshots table.",
  "INFO: Read replica selected for analytical query routing.",
];

function DropdownMenu({ isOpen, onClose, onRename, onShare, onDelete }: {
  isOpen: boolean; onClose: () => void; onRename: () => void; onShare: () => void; onDelete: () => void;
}) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isOpen) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  return (
    <div ref={menuRef} style={{
      position: "absolute", right: 0, top: 32, zIndex: 50,
      minWidth: 148, background: "#0d1117", border: "1px solid rgba(0,212,255,0.15)",
      borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,255,0.05)",
      padding: "4px 0",
    }}>
      {[
        { icon: Edit3, label: "Rename", action: onRename },
        { icon: Share2, label: "Share", action: onShare },
      ].map(({ icon: Icon, label, action }) => (
        <button key={label} onClick={(e) => { e.stopPropagation(); action(); onClose(); }}
          style={{
            width: "100%", display: "flex", alignItems: "center", gap: 8,
            padding: "8px 14px", background: "none", border: "none",
            color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: "0.04em",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,212,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#00d4ff"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.6)"; }}
        >
          <Icon size={12} /> {label}
        </button>
      ))}
      <div style={{ height: 1, background: "rgba(0,212,255,0.08)", margin: "4px 0" }} />
      <button onClick={(e) => { e.stopPropagation(); onDelete(); onClose(); }}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", background: "none", border: "none",
          color: "#f87171", fontSize: 12, cursor: "pointer", fontFamily: "monospace",
          transition: "all 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(248,113,113,0.08)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "none"; }}
      >
        <Trash2 size={12} /> Delete
      </button>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!isOpen) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0d1117", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 12,
        width: "100%", maxWidth: 440, boxShadow: "0 24px 64px rgba(0,0,0,0.8), 0 0 40px rgba(0,212,255,0.05)",
        animation: "scaleIn 0.2s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid rgba(0,212,255,0.1)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#00d4ff", fontFamily: "monospace", letterSpacing: "0.06em", textTransform: "uppercase" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", display: "flex" }}>
            <X size={16} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// Live animated progress bar
function LiveProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const [current, setCurrent] = useState(value);
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(v => {
        const delta = (Math.random() - 0.4) * max * 0.04;
        return Math.max(max * 0.05, Math.min(max * 0.96, v + delta));
      });
    }, 1800);
    return () => clearInterval(interval);
  }, [max]);

  const pct = Math.round((current / max) * 100);
  const displayVal = max >= 10000
    ? `${(current / 1000).toFixed(1)}k`
    : current < 500
      ? `${Math.round(current)} MS [STABLE]`
      : `${Math.round(current).toLocaleString()} [OPTIMAL]`;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>
          {max >= 10000 ? "DATABASE WRITE IOPS" : "API ENDPOINT LATENCY"}
        </span>
        <span style={{ fontSize: 11, fontFamily: "monospace", color, letterSpacing: "0.04em" }}>{displayVal}</span>
      </div>
      <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{
          height: "100%", width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}, ${color}aa)`,
          borderRadius: 99, transition: "width 1.2s ease",
          boxShadow: `0 0 8px ${color}66`,
        }} />
      </div>
    </div>
  );
}

// Scrolling log terminal
function LogTerminal({ extraEntries }: { extraEntries?: string[] }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [idx, setIdx] = useState(0);
  const termRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const all = [...(extraEntries || []), ...LOG_MESSAGES];
    // Seed with a few logs immediately
    setLogs(all.slice(0, 3));
    setIdx(3);
  }, []);

  useEffect(() => {
    const all = [...(extraEntries || []), ...LOG_MESSAGES];
    const interval = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, all[idx % all.length]];
        return next.slice(-12); // keep last 12 lines
      });
      setIdx(i => i + 1);
    }, 2200);
    return () => clearInterval(interval);
  }, [idx, extraEntries]);

  useEffect(() => {
    if (termRef.current) {
      termRef.current.scrollTop = termRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div ref={termRef} style={{
      background: "#060a0f", border: "1px solid rgba(0,212,255,0.12)",
      borderRadius: 6, padding: "10px 12px", height: 100,
      fontFamily: "monospace", fontSize: 10, lineHeight: 1.7,
      color: "#00d4ff", overflow: "hidden", position: "relative",
    }}>
      {logs.map((log, i) => (
        <div key={i} style={{
          color: i === logs.length - 1 ? "#00d4ff" : "rgba(0,212,255,0.55)",
          opacity: Math.max(0.3, 1 - (logs.length - 1 - i) * 0.12),
        }}>
          {log}
        </div>
      ))}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 32,
        background: "linear-gradient(to top, #060a0f, transparent)",
      }} />
    </div>
  );
}

export function DashboardListPage() {
  const [items, setItems] = useState<DashboardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; dashboard: DashboardRecord | null }>({ isOpen: false, dashboard: null });
  const [renameModal, setRenameModal] = useState<{ isOpen: boolean; dashboard: DashboardRecord | null }>({ isOpen: false, dashboard: null });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const nav = useNavigate();

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  async function load() {
    setLoading(true);
    setErr(null);
    try {
      setItems(await dashApi.listDashboards());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load dashboards");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(d => d.title.toLowerCase().includes(q));
  }, [items, searchQuery]);

  // Collect all widget titles/SQL for log terminal
  const widgetLogEntries = useMemo(() =>
    items.flatMap(d => d.widgets.map(w =>
      `LOG: [${d.title}] Query executed — "${w.title}" (${w.snapshotRows?.length ?? 0} rows)`
    )).slice(-8),
    [items]
  );

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setActionLoading(true);
    try {
      const d = await dashApi.createDashboard(newTitle.trim());
      setCreateModalOpen(false);
      setNewTitle("");
      nav(`/app/dashboards/${d.id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to create dashboard");
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteModal.dashboard) return;
    setActionLoading(true);
    try {
      await dashApi.deleteDashboard(deleteModal.dashboard.id);
      setDeleteModal({ isOpen: false, dashboard: null });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to delete");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRename() {
    if (!renameModal.dashboard || !newTitle.trim()) return;
    setActionLoading(true);
    try {
      await dashApi.updateDashboard(renameModal.dashboard.id, newTitle.trim());
      setRenameModal({ isOpen: false, dashboard: null });
      setNewTitle("");
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to rename");
    } finally {
      setActionLoading(false);
    }
  }

  const timeStr = currentTime.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = currentTime.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }).toUpperCase();

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px 80px", minHeight: "100%", fontFamily: "'Inter', monospace" }}>
      <style>{`
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .ent-card:hover {
          border-color: rgba(0,212,255,0.3) !important;
          box-shadow: 0 0 24px rgba(0,212,255,0.08), 0 8px 32px rgba(0,0,0,0.5) !important;
          transform: translateY(-2px);
        }
        .ent-card { transition: all 0.2s ease !important; }
        .new-stream-btn:hover {
          border-color: rgba(0,212,255,0.4) !important;
          background: rgba(0,212,255,0.04) !important;
        }
        .filter-btn:hover { background: rgba(0,212,255,0.08) !important; color: #00d4ff !important; }
        .tag-chip {
          display: inline-flex; align-items: center;
          padding: 2px 8px; border-radius: 3px;
          font-size: 9px; font-weight: 700;
          font-family: monospace; letter-spacing: 0.08em;
          border: 1px solid; margin-right: 4px;
        }
      `}</style>

      {/* ── TOP HEADER ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)", borderRadius: 3,
              fontSize: 9, fontFamily: "monospace", color: "#00d4ff",
              letterSpacing: "0.1em", fontWeight: 700,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#00d4ff", animation: "glowPulse 2s ease infinite" }} />
              ENTERPRISE SYSTEM
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
              {dateStr} · {timeStr}
            </span>
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#fff", letterSpacing: "-0.02em", marginBottom: 4 }}>
            Enterprise Dashboards
          </h1>
          <p style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            VIEWING {loading ? "—" : items.length} ACTIVE TELEMETRY STREAMS
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.3)" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search data points..."
              style={{
                width: 220, padding: "8px 12px 8px 30px",
                background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 6, color: "#fff", fontSize: 12, outline: "none",
                fontFamily: "monospace", letterSpacing: "0.02em",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)")}
            />
          </div>
          <button className="filter-btn" style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 14px", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
            color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer",
            fontFamily: "monospace", letterSpacing: "0.04em", transition: "all 0.15s",
          }}>
            <Filter size={12} /> Filter
          </button>
          <button
            onClick={() => { setNewTitle(""); setCreateModalOpen(true); }}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", borderRadius: 6, border: "none",
              background: "linear-gradient(135deg, #a855f7, #6366f1)",
              color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: "monospace",
              cursor: "pointer", letterSpacing: "0.04em",
              boxShadow: "0 0 20px rgba(168,85,247,0.3)",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(168,85,247,0.5)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(168,85,247,0.3)"; (e.currentTarget as HTMLElement).style.transform = ""; }}
          >
            <Plus size={13} /> New Stream
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {err && (
        <div style={{
          marginBottom: 20, padding: "10px 16px",
          background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.25)",
          borderRadius: 6, color: "#f87171", fontSize: 12, fontFamily: "monospace",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {err}
          <button onClick={() => setErr(null)} style={{ background: "none", border: "none", color: "#f87171", cursor: "pointer" }}><X size={14} /></button>
        </div>
      )}

      {/* ── DASHBOARD GRID ── */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              height: 200, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)",
              background: "#0d1117", animation: "glowPulse 2s ease infinite",
            }} />
          ))}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginBottom: 28 }}>
          {/* New Dashboard Card */}
          {!searchQuery.trim() && (
            <button
              className="new-stream-btn"
              onClick={() => { setNewTitle(""); setCreateModalOpen(true); }}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                minHeight: 200, borderRadius: 8, cursor: "pointer",
                border: "1.5px dashed rgba(0,212,255,0.2)",
                background: "rgba(0,212,255,0.02)",
                gap: 12, transition: "all 0.2s ease",
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 8,
                border: "1px solid rgba(0,212,255,0.3)",
                background: "rgba(0,212,255,0.06)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Plus size={22} color="rgba(0,212,255,0.5)" />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>New Dashboard</div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(0,212,255,0.4)", letterSpacing: "0.1em" }}>INITIALIZE STREAM</div>
              </div>
            </button>
          )}

          {/* Real Dashboard Cards */}
          {(searchQuery.trim() ? filteredItems : items).map((d, i) => {
            const cat = CATEGORIES[i % CATEGORIES.length];
            const CatIcon = cat.Icon;
            return (
              <Link key={d.id} to={`/app/dashboards/${d.id}`} className="ent-card" style={{
                textDecoration: "none", display: "block",
                background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 8,
                padding: 0, overflow: "hidden",
                minHeight: 200, position: "relative",
                boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
              }}>
                {/* Top accent line */}
                <div style={{ height: 2, background: `linear-gradient(90deg, ${cat.color}, transparent)` }} />

                <div style={{ padding: "14px 16px" }}>
                  {/* Category + menu row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                    <span style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 700, color: cat.color, letterSpacing: "0.1em" }}>
                      {cat.label}
                    </span>
                    <div style={{ position: "relative" }}>
                      <button
                        onClick={e => { e.preventDefault(); e.stopPropagation(); setOpenMenuId(openMenuId === d.id ? null : d.id); }}
                        style={{
                          background: "none", border: "none", color: "rgba(255,255,255,0.3)",
                          cursor: "pointer", display: "flex", padding: 3,
                        }}
                      >
                        <MoreVertical size={14} />
                      </button>
                      <DropdownMenu
                        isOpen={openMenuId === d.id}
                        onClose={() => setOpenMenuId(null)}
                        onRename={() => { setNewTitle(d.title); setRenameModal({ isOpen: true, dashboard: d }); }}
                        onShare={() => nav(`/app/dashboards/${d.id}/share`)}
                        onDelete={() => setDeleteModal({ isOpen: true, dashboard: d })}
                      />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 style={{
                    fontSize: 18, fontWeight: 700, color: "#fff",
                    marginBottom: 12, lineHeight: 1.3,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {d.title}
                  </h3>

                  {/* Tags */}
                  <div style={{ marginBottom: 14, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {d.widgets.length > 0 ? (
                      cat.tags.map((tag, ti) => (
                        <span key={tag} className="tag-chip" style={{
                          color: cat.tagColors[ti % cat.tagColors.length],
                          borderColor: `${cat.tagColors[ti % cat.tagColors.length]}40`,
                          background: `${cat.tagColors[ti % cat.tagColors.length]}12`,
                        }}>● {tag}</span>
                      ))
                    ) : (
                      <span className="tag-chip" style={{ color: "rgba(255,255,255,0.3)", borderColor: "rgba(255,255,255,0.1)", background: "transparent" }}>EMPTY</span>
                    )}
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "rgba(255,255,255,0.05)", marginBottom: 14 }} />

                  {/* Metric row */}
                  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em", marginBottom: 4 }}>
                        {d.widgets.length > 0 ? cat.metricLabel : "WIDGETS"}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: cat.color, fontFamily: "monospace", letterSpacing: "-0.01em" }}>
                        {d.widgets.length > 0 ? cat.metricValue : d.widgets.length.toString()}
                      </div>
                    </div>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: `${cat.color}14`, border: `1px solid ${cat.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <CatIcon size={16} color={cat.color} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={10} color="rgba(255,255,255,0.25)" />
                      <span style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(255,255,255,0.3)" }}>
                        {formatRelativeTime(d.updatedAt)}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3, color: cat.color }}>
                      <span style={{ fontSize: 10, fontFamily: "monospace", opacity: 0.7 }}>Open</span>
                      <ChevronRight size={11} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* No results */}
      {!loading && searchQuery.trim() && filteredItems.length === 0 && (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "monospace" }}>
          No streams match "{searchQuery}"
        </div>
      )}

      {/* ── BOTTOM PANELS ── */}
      {!loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* System Health */}
          <div style={{
            background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: "3px solid #a855f7",
            borderRadius: 8, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: "rgba(168,85,247,0.12)", border: "1px solid rgba(168,85,247,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap size={15} color="#a855f7" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>System Health</div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
                  DIAGNOSTIC REPORT ID: QM-{Math.random().toString(16).slice(2, 7).toUpperCase()}-X
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <LiveProgressBar value={80} max={400} color="#a855f7" />
              <LiveProgressBar value={12492} max={20000} color="#00d4ff" />
            </div>
          </div>

          {/* Query Optimizer */}
          <div style={{
            background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)",
            borderLeft: "3px solid #00d4ff",
            borderRadius: 8, padding: "18px 20px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 7,
                background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Terminal size={15} color="#00d4ff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>Query Optimizer</div>
                <div style={{ fontSize: 9, fontFamily: "monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>
                  AI ANALYSIS ENGINE V4.2.1
                </div>
              </div>
              <button
                onClick={() => void load()}
                style={{ background: "none", border: "none", color: "rgba(0,212,255,0.5)", cursor: "pointer", display: "flex" }}
                title="Refresh"
              >
                <RefreshCw size={12} />
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <LogTerminal extraEntries={widgetLogEntries} />
            </div>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Initialize New Stream">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,212,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8, fontFamily: "monospace" }}>
              Stream / Dashboard Name
            </label>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newTitle.trim()) void handleCreate(); }}
              placeholder="e.g. Production Metrics"
              style={{
                width: "100%", padding: "10px 12px",
                background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: 6, color: "#fff", fontSize: 13, outline: "none",
                fontFamily: "monospace", transition: "border-color 0.15s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)")}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <Button variant="outline" onClick={() => setCreateModalOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" onClick={() => void handleCreate()} disabled={actionLoading || !newTitle.trim()}>
              {actionLoading ? <><Loader2 size={13} style={{ marginRight: 6, animation: "spin 1s linear infinite" }} />Creating...</> : "Initialize Stream"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Rename Modal ── */}
      <Modal isOpen={renameModal.isOpen} onClose={() => setRenameModal({ isOpen: false, dashboard: null })} title="Rename Stream">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: "rgba(0,212,255,0.7)", textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8, fontFamily: "monospace" }}>
              New Name
            </label>
            <input
              autoFocus
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && newTitle.trim()) void handleRename(); }}
              style={{
                width: "100%", padding: "10px 12px",
                background: "rgba(0,0,0,0.4)", border: "1px solid rgba(0,212,255,0.2)",
                borderRadius: 6, color: "#fff", fontSize: 13, outline: "none",
                fontFamily: "monospace",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.5)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(0,212,255,0.2)")}
            />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
            <Button variant="outline" onClick={() => setRenameModal({ isOpen: false, dashboard: null })} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" onClick={() => void handleRename()} disabled={actionLoading || !newTitle.trim()}>
              {actionLoading ? <><Loader2 size={13} style={{ marginRight: 6 }} />Saving...</> : "Save"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({ isOpen: false, dashboard: null })} title="Delete Stream">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "monospace", lineHeight: 1.6 }}>
            Permanently delete <span style={{ color: "#f87171" }}>"{deleteModal.dashboard?.title}"</span>? This action cannot be undone.
          </p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, dashboard: null })} disabled={actionLoading}>Cancel</Button>
            <Button variant="outline" onClick={() => void handleDelete()} disabled={actionLoading}
              style={{ borderColor: "rgba(248,113,113,0.3)", color: "#f87171" }}>
              {actionLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
