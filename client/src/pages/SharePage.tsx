import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Hexagon, BarChart2, AlertCircle, Loader2, Eye } from "lucide-react";
import * as dashApi from "../api/dashboard";
import type { ChartKind, DashboardRecord } from "../types/domain";
import { ChartRenderer } from "../components/charts/ChartRenderer";
import { ResultTable } from "../components/query/ResultTable";

export function SharePage() {
  const { token } = useParams();
  const [dash, setDash] = useState<DashboardRecord | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) return;
      try {
        const d = await dashApi.getPublicDashboard(token);
        if (!cancelled) setDash(d);
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : "Failed to load dashboard");
      }
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="share-page">
      {/* Branded Header */}
      <header className="share-header">
        <div className="share-header-brand">
          <div className="share-header-logo">
            <Hexagon size={18} />
          </div>
          <div className="share-header-title">
            <span className="text-gradient">Query</span>
            <span>Mind</span>
          </div>
          <div className="share-header-badge">
            <Eye size={12} />
            <span>Shared View</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="share-main">
        {err ? (
          <div className="share-error">
            <AlertCircle size={48} className="share-error-icon" />
            <h2 className="share-error-title">Dashboard Not Found</h2>
            <p className="share-error-message">{err}</p>
          </div>
        ) : !dash ? (
          <div className="share-loading">
            <Loader2 size={32} className="animate-spin" />
            <span>Loading dashboard…</span>
          </div>
        ) : (
          <>
            {/* Dashboard Title Section */}
            <div className="share-dashboard-header">
              <h1 className="share-dashboard-title">{dash.title}</h1>
              <div className="share-dashboard-meta">
                <span className="share-meta-item">
                  {dash.widgets.length} widget{dash.widgets.length !== 1 ? "s" : ""}
                </span>
                <span className="share-meta-dot">·</span>
                <span className="share-meta-badge">Read Only</span>
              </div>
            </div>

            {/* Widgets Grid */}
            {dash.widgets.length === 0 ? (
              <div className="share-empty">
                <div className="share-empty-icon">
                  <BarChart2 size={40} />
                </div>
                <h3 className="share-empty-title">No widgets in this dashboard</h3>
                <p className="share-empty-message">
                  The dashboard owner hasn't added any charts yet.
                </p>
              </div>
            ) : (
              <div className="share-widgets-grid">
                {dash.widgets.map((w) => (
                  <div key={w.id} className="share-widget-card">
                    <div className="share-widget-header">
                      <h3 className="share-widget-title">{w.title}</h3>
                      <span className="share-widget-type">{w.chartType}</span>
                    </div>
                    <div className="share-widget-content">
                      {w.chartType === "table" ? (
                        <ResultTable 
                          columns={w.snapshotColumns} 
                          rows={w.snapshotRows}
                          maxHeight="320px"
                        />
                      ) : (
                        <ChartRenderer
                          kind={w.chartType as ChartKind}
                          columns={w.snapshotColumns}
                          rows={w.snapshotRows}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="share-footer">
        <div className="share-footer-content">
          <span className="share-footer-brand">
            <span className="text-gradient">Query</span>Mind
          </span>
          <span className="share-footer-dot">·</span>
          <span className="share-footer-text">Powered by intelligent data visualization</span>
        </div>
      </footer>
    </div>
  );
}
