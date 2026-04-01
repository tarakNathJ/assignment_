import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Database, Unplug, Cpu } from "lucide-react";
import * as dbApi from "../../api/db";
import * as authApi from "../../api/auth";

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isConnected, setIsConnected] = useState(false);
  const [dbLabel, setDbLabel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock — ticks every second
  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Check connection status on mount and when location changes
  useEffect(() => {
    async function checkStatus() {
      try {
        const me = await authApi.me();
        setIsConnected(me.authed && !!me.db);
        setDbLabel(me.db?.label || null);
      } catch {
        setIsConnected(false);
        setDbLabel(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkStatus();
  }, [location.pathname]);

  async function handleDisconnect() {
    try {
      await dbApi.disconnectDb();
    } catch {
      // ignore
    }
    await authApi.logout();
    navigate("/login", { replace: true });
  }

  function getPageTitle(): string {
    const path = location.pathname;
    if (path === "/app" || path === "/app/") return "Workspace";
    if (path.includes("/app/connect")) return "Connect Database";
    if (path.includes("/app/dashboards")) return "Dashboards";
    if (path.includes("/app/dashboard/")) return "Dashboard Editor";
    return "QueryMind";
  }

  const timeStr = currentTime.toLocaleTimeString("en-US", { hour12: false });

  return (
    <header className="top-nav">
      {/* Left: Page Title */}
      <div className="top-nav-left">
        <h1 className="top-nav-title">{getPageTitle()}</h1>
      </div>

      {/* Right: Clock + Status Indicators + Actions */}
      <div className="top-nav-right">
        {/* Live Clock */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px",
          fontFamily: "monospace", fontSize: 12,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.06em",
        }}>
          {timeStr}
        </div>

        {/* Database Connection Status */}
        <div
          className={`top-nav-status ${isConnected ? "connected" : "disconnected"}`}
          title={dbLabel || undefined}
        >
          <span className="status-dot" />
          <Database size={12} />
          <span className="status-text">
            {isLoading ? "Checking..." : isConnected ? "Connected" : "Not connected"}
          </span>
        </div>

        {/* AI Provider Status — GROQ always shown as configured (server-side key) */}
        <div
          className="top-nav-status ai-configured"
          title="GROQ configured (server-side)"
        >
          <Cpu size={12} />
          <span className="status-text">GROQ</span>
        </div>

        {/* Disconnect Button */}
        {isConnected && (
          <button
            type="button"
            className="top-nav-disconnect-btn"
            onClick={handleDisconnect}
            title="Disconnect from database"
          >
            <Unplug size={14} />
            <span>Disconnect</span>
          </button>
        )}
      </div>
    </header>
  );
}
