import { useState, useEffect, type FormEvent } from "react";
import { X, BarChart2, Plus, LayoutDashboard, Loader2, Check } from "lucide-react";
import * as dashApi from "../../api/dashboard";
import type { DashboardRecord, ChartKind } from "../../types/domain";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (dashId: string, title: string) => Promise<void>;
  chartKind: ChartKind;
}

export function SaveWidgetModal({ open, onClose, onSave, chartKind }: Props) {
  const [title, setTitle] = useState("New Widget");
  const [dashboards, setDashboards] = useState<DashboardRecord[]>([]);
  const [selectedDashId, setSelectedDashId] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [newDashTitle, setNewDashTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setErr(null);
    setCreating(false);
    setNewDashTitle("");
    dashApi
      .listDashboards()
      .then((list) => {
        setDashboards(list);
        setSelectedDashId(list[0]?.id ?? "");
      })
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load dashboards"))
      .finally(() => setLoading(false));
  }, [open]);

  async function handleCreateDash() {
    if (!newDashTitle.trim()) return;
    setLoading(true);
    setErr(null);
    try {
      const d = await dashApi.createDashboard(newDashTitle.trim());
      setDashboards((prev: DashboardRecord[]) => [...prev, d]);
      setSelectedDashId(d.id);
      setCreating(false);
      setNewDashTitle("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!selectedDashId) {
      setErr("Select or create a dashboard first.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      await onSave(selectedDashId, title.trim() || "Widget");
      onClose();
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  const chartTypeLabel = chartKind.charAt(0).toUpperCase() + chartKind.slice(1);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass-panel w-full max-w-md mx-4" style={{ padding: 24 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: "var(--neon-cyan-muted)",
                border: "1px solid rgba(56, 189, 248, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <BarChart2 size={20} style={{ color: "var(--neon-cyan)" }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Save Widget</div>
              <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>
                {chartTypeLabel} chart
              </div>
            </div>
          </div>
          <button type="button" className="sidebar-icon-btn" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Chart Preview */}
        <div className="save-widget-preview">
          <div className="save-widget-preview-icon">
            <BarChart2 size={24} />
          </div>
          <div className="save-widget-preview-text">
            <div className="save-widget-preview-title">{title || "Untitled Widget"}</div>
            <div className="save-widget-preview-type">{chartTypeLabel} Chart</div>
          </div>
        </div>

        <form onSubmit={handleSave} className="stack" style={{ gap: 16, marginTop: 20 }}>
          {/* Widget title */}
          <div className="field">
            <label className="input-label">Widget Title</label>
            <input
              className="cyber-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Revenue by Month"
              required
            />
          </div>

          {/* Dashboard picker */}
          <div className="field">
            <label className="input-label">Dashboard</label>
            {loading ? (
              <div className="save-widget-loading">
                <Loader2 size={16} className="animate-spin" />
                <span>Loading dashboards…</span>
              </div>
            ) : dashboards.length === 0 && !creating ? (
              <div className="save-widget-empty">
                <LayoutDashboard size={20} />
                <span>No dashboards yet. Create one below.</span>
              </div>
            ) : !creating ? (
              <div className="save-widget-dashboard-list">
                {dashboards.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={`save-widget-dashboard-item ${selectedDashId === d.id ? 'save-widget-dashboard-item-active' : ''}`}
                    onClick={() => setSelectedDashId(d.id)}
                  >
                    <LayoutDashboard size={16} />
                    <span className="save-widget-dashboard-title">{d.title}</span>
                    {selectedDashId === d.id && <Check size={14} className="save-widget-check" />}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          {/* Create new dashboard inline */}
          {!creating ? (
            <button
              type="button"
              className="save-widget-new-btn"
              onClick={() => setCreating(true)}
            >
              <Plus size={16} />
              <span>Create New Dashboard</span>
            </button>
          ) : (
            <div className="save-widget-create-form">
              <input
                className="cyber-input"
                style={{ flex: 1 }}
                placeholder="Dashboard title…"
                value={newDashTitle}
                onChange={(e) => setNewDashTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDash()}
                autoFocus
              />
              <button
                type="button"
                className="cyber-btn cyber-btn-primary"
                onClick={handleCreateDash}
                disabled={loading || !newDashTitle.trim()}
              >
                Create
              </button>
              <button
                type="button"
                className="sidebar-icon-btn"
                onClick={() => setCreating(false)}
                aria-label="Cancel"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {err && <div className="save-widget-error">{err}</div>}

          <button
            type="submit"
            className="cyber-btn cyber-btn-primary"
            disabled={saving || !selectedDashId}
            style={{ width: "100%", padding: "12px 16px", fontWeight: 700, marginTop: 4 }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <Check size={16} />
                <span>Save Widget</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
