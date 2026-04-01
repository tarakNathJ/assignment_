import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Server, AlertTriangle, CheckCircle2, Loader2, Sparkles, Users, Package, ShoppingCart, Star } from "lucide-react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import * as dbApi from "../api/db";

export function ConnectPage() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [host, setHost] = useState("");
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState("");
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [ssl, setSsl] = useState(true);

  async function demo() {
    setBusy(true);
    setError(null);
    try {
      await dbApi.connectDemo();
      setSuccess("Connected to demo database!");
      setTimeout(() => nav("/app", { replace: true }), 800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect to demo database.");
    } finally {
      setBusy(false);
    }
  }

  async function custom(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await dbApi.connectCustom({ host, port, database, user, password, ssl });
      setSuccess("Connected successfully!");
      setTimeout(() => nav("/app", { replace: true }), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed. Check your credentials and try again.");
    } finally {
      setBusy(false);
    }
  }

  const connPreview =
    host && user && database
      ? `postgresql://${user}:***@${host}:${port}/${database}`
      : null;

  return (
    <div className="animate-fade-in" style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 20px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32, textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>Connect Database</h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, maxWidth: 480, margin: "0 auto" }}>
          Choose how you want to connect. Use our demo database for quick exploration or connect your own PostgreSQL instance.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="animate-slide-up"
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            background: "var(--danger-muted)",
            border: "1px solid rgba(248, 113, 113, 0.25)",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <AlertTriangle size={20} color="var(--danger)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: "var(--danger)" }}>
              Connection Error
            </div>
            <div style={{ fontSize: 13, color: "rgba(248, 113, 113, 0.9)" }}>{error}</div>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              padding: "4px 8px",
              background: "transparent",
              border: "none",
              color: "var(--danger)",
              cursor: "pointer",
              fontSize: 14,
              borderRadius: "var(--radius-sm)",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div
          className="animate-slide-up"
          style={{
            marginBottom: 24,
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            background: "rgba(52, 211, 153, 0.12)",
            border: "1px solid rgba(52, 211, 153, 0.25)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <CheckCircle2 size={20} color="var(--success)" />
          <span style={{ fontWeight: 500, color: "var(--success)", fontSize: 14 }}>{success}</span>
        </div>
      )}

      {/* Two-Card Layout */}
      <div className="grid-2" style={{ gap: 24 }}>
        {/* Demo Database Card */}
        <div className="glass-panel" style={{ padding: 28, display: "flex", flexDirection: "column" }}>
          {/* Card Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--radius-lg)",
                  background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Database size={24} color="var(--accent-primary)" />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Demo Database</div>
                <Badge variant="stable">
                  <Sparkles size={10} />
                  Recommended
                </Badge>
              </div>
            </div>
          </div>

          {/* Description */}
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Pre-seeded e-commerce data with 10K+ orders. Perfect for trying out the platform without any setup.
          </p>

          {/* Feature List */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
            {[
              { icon: Users, label: "Customers" },
              { icon: Package, label: "Products" },
              { icon: ShoppingCart, label: "Orders" },
              { icon: Star, label: "Reviews" },
            ].map((feature) => (
              <div
                key={feature.label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <feature.icon size={16} color="var(--text-muted)" />
                <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{feature.label}</span>
              </div>
            ))}
          </div>

          {/* Connect Button */}
          <Button
            variant="primary"
            onClick={demo}
            disabled={busy}
            style={{ width: "100%", padding: "14px 20px", fontSize: 15, fontWeight: 600 }}
            icon={busy ? <Loader2 size={18} className="animate-spin" /> : undefined}
          >
            {busy ? "Connecting..." : "Connect to Demo"}
          </Button>
        </div>

        {/* Custom Database Card */}
        <div className="glass-panel" style={{ padding: 28, display: "flex", flexDirection: "column" }}>
          {/* Card Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "var(--radius-lg)",
                background: "linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(167, 139, 250, 0.15) 100%)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Server size={24} color="var(--neon-cyan)" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>Custom PostgreSQL</div>
              <Badge variant="optional">Advanced</Badge>
            </div>
          </div>

          {/* Description */}
          <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
            Connect your own PostgreSQL database. All connection data is encrypted and stored securely.
          </p>

          {/* Connection Form */}
          <form onSubmit={custom} style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {/* Host + Port Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
              <Input
                label="Host"
                placeholder="db.example.com"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
              />
              <Input
                label="Port"
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                required
              />
            </div>

            {/* Database + Username Row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input
                label="Database"
                placeholder="my_database"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                required
              />
              <Input
                label="Username"
                placeholder="postgres"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* SSL Toggle */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                background: "var(--bg-surface)",
                cursor: "pointer",
                marginTop: 4,
              }}
            >
              <div>
                <div style={{ fontWeight: 500, fontSize: 13, color: "var(--text-primary)" }}>Require SSL</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                  Recommended for hosted databases
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <input
                  type="checkbox"
                  checked={ssl}
                  onChange={(e) => setSsl(e.target.checked)}
                  style={{ display: "none" }}
                />
                <div
                  style={{
                    width: 44,
                    height: 24,
                    borderRadius: 99,
                    background: ssl ? "var(--accent-primary)" : "var(--bg-hover)",
                    border: `1px solid ${ssl ? "var(--accent-primary)" : "var(--border-default)"}`,
                    position: "relative",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 3,
                      left: ssl ? 23 : 3,
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "white",
                      transition: "all 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
                <span
                  className="font-mono"
                  style={{ fontSize: 11, color: ssl ? "var(--accent-primary)" : "var(--text-muted)", minWidth: 28 }}
                >
                  {ssl ? "ON" : "OFF"}
                </span>
              </div>
            </label>

            {/* Connection Preview */}
            {connPreview && (
              <div
                style={{
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(52, 211, 153, 0.2)",
                  background: "rgba(52, 211, 153, 0.08)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <CheckCircle2 size={16} color="var(--success)" />
                <div
                  className="font-mono"
                  style={{
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {connPreview}
                </div>
              </div>
            )}

            {/* Connect Button */}
            <Button
              variant="outline"
              type="submit"
              disabled={busy}
              style={{ width: "100%", padding: "14px 20px", fontSize: 15, fontWeight: 600, marginTop: "auto" }}
              icon={busy ? <Loader2 size={18} className="animate-spin" /> : undefined}
            >
              {busy ? "Connecting..." : "Connect"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
