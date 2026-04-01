import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth";
import { Button } from "../components/ui/Button";
import {
  Hexagon,
  Lock,
  User as UserIcon,
  MessageSquare,
  BarChart3,
  LayoutDashboard,
  Database,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";

export function LoginPage() {
  const nav = useNavigate();
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.login(username, password);
      nav("/app/connect", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  const features = [
    {
      icon: <MessageSquare size={18} />,
      title: "Natural Language Queries",
      description: "Ask questions in plain English",
    },
    {
      icon: <BarChart3 size={18} />,
      title: "Auto Visualizations",
      description: "Smart charts from your data",
    },
    {
      icon: <LayoutDashboard size={18} />,
      title: "Instant Dashboards",
      description: "Build dashboards in seconds",
    },
    {
      icon: <Database size={18} />,
      title: "Schema Analysis",
      description: "AI-powered schema insights",
    },
  ];

  return (
    <div className="login-page">
      {/* Background Pattern */}
      <div className="login-bg-pattern" />

      {/* Main Container */}
      <div className="login-container">
        {/* Brand Header */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <Hexagon size={28} />
          </div>
          <div className="login-brand-text">
            <h1 className="login-brand-name">
              <span className="text-gradient">Query</span>Mind
            </h1>
            <p className="login-brand-tagline">
              Conversational BI Platform — Ask your data anything
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="login-content">
          {/* Login Card */}
          <div className="login-card glass-panel">
            <div className="login-card-header">
              <Sparkles size={20} className="login-card-icon" />
              <h2>Welcome Back</h2>
              <p>Sign in to access your workspace</p>
            </div>

            <form onSubmit={onSubmit} className="login-form">
              <div className="login-field">
                <label htmlFor="username">Username</label>
                <div className="login-input-wrapper">
                  <UserIcon size={16} className="login-input-icon" />
                  <input
                    id="username"
                    type="text"
                    className="cyber-input"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    placeholder="Enter username"
                    required
                  />
                </div>
              </div>

              <div className="login-field">
                <label htmlFor="password">Password</label>
                <div className="login-input-wrapper">
                  <Lock size={16} className="login-input-icon" />
                  <input
                    id="password"
                    type="password"
                    className="cyber-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="Enter password"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={18} />
                  </>
                )}
              </Button>
            </form>

            <div className="login-footer">
              <p>Demo credentials: <span>demo / demo</span></p>
            </div>
          </div>

          {/* Features Section */}
          <div className="login-features">
            <h3 className="login-features-title">Powerful Features</h3>
            <div className="login-features-grid">
              {features.map((feature) => (
                <div key={feature.title} className="login-feature-card">
                  <div className="login-feature-icon">{feature.icon}</div>
                  <div className="login-feature-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .login-bg-pattern {
          position: absolute;
          inset: 0;
          background-image: url('/grid-pattern.svg');
          background-size: 40px;
          background-repeat: repeat;
          opacity: 0.4;
          pointer-events: none;
        }

        .login-page::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.08), transparent 50%),
                      radial-gradient(circle at 70% 80%, rgba(139, 92, 246, 0.06), transparent 50%);
          pointer-events: none;
        }

        .login-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1000px;
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-bottom: 40px;
        }

        .login-brand-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
          color: white;
          box-shadow: 0 8px 24px rgba(99, 102, 241, 0.35);
        }

        .login-brand-text {
          text-align: left;
        }

        .login-brand-name {
          font-size: 32px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
          color: var(--text-primary);
        }

        .login-brand-tagline {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 4px 0 0;
          font-weight: 400;
        }

        .login-content {
          display: grid;
          grid-template-columns: 420px 1fr;
          gap: 32px;
          align-items: start;
        }

        .login-card {
          padding: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .login-card-header {
          text-align: center;
        }

        .login-card-icon {
          color: var(--accent-primary);
          margin-bottom: 16px;
        }

        .login-card-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px;
          color: var(--text-primary);
        }

        .login-card-header p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-field label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .login-input-wrapper {
          position: relative;
        }

        .login-input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }

        .login-input-wrapper .cyber-input {
          padding-left: 42px;
          width: 100%;
        }

        .login-error {
          padding: 12px 16px;
          border-radius: var(--radius-md);
          border: 1px solid rgba(248, 113, 113, 0.3);
          background: var(--danger-muted);
          color: var(--danger);
          font-size: 13px;
          font-weight: 500;
        }

        .login-submit-btn {
          width: 100%;
          padding: 14px 20px !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          margin-top: 8px;
        }

        .login-footer {
          text-align: center;
          padding-top: 8px;
        }

        .login-footer p {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
        }

        .login-footer span {
          color: var(--neon-cyan);
          font-weight: 500;
          font-family: "JetBrains Mono", monospace;
        }

        .login-features {
          padding-top: 8px;
        }

        .login-features-title {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 20px;
        }

        .login-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .login-feature-card {
          padding: 20px;
          border-radius: var(--radius-lg);
          border: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          transition: all 0.2s ease;
        }

        .login-feature-card:hover {
          border-color: var(--border-default);
          background: var(--bg-hover);
          transform: translateY(-2px);
        }

        .login-feature-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--accent-glow);
          color: var(--accent-primary);
          margin-bottom: 14px;
        }

        .login-feature-content h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 4px;
        }

        .login-feature-content p {
          font-size: 12px;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.5;
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        /* Responsive */\n        @media (max-width: 900px) {
          .login-content {
            grid-template-columns: 1fr;
            max-width: 420px;
            margin: 0 auto;
          }

          .login-features {
            order: -1;
            padding-top: 0;
            padding-bottom: 8px;
          }

          .login-features-grid {
            grid-template-columns: 1fr 1fr;
          }
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 28px 24px;
          }

          .login-brand-name {
            font-size: 26px;
          }

          .login-brand-tagline {
            font-size: 12px;
          }

          .login-features-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
