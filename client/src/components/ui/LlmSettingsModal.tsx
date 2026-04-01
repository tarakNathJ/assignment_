import { useState, useEffect, type FormEvent } from "react";
import { X, Eye, EyeOff, Zap, Key } from "lucide-react";
import { getLlmSettings, setLlmSettings } from "../../lib/llm-settings";
import type { LlmProvider } from "../../types/domain";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PROVIDERS: { value: LlmProvider; label: string; models: string[] }[] = [
  {
    value: "openai",
    label: "OpenAI",
    models: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  },
  {
    value: "anthropic",
    label: "Anthropic",
    models: ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"],
  },
  {
    value: "google",
    label: "Google Gemini",
    models: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  },
  {
    value: "groq",
    label: "Groq",
    models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  },
];

export function LlmSettingsModal({ open, onClose }: Props) {
  const saved = getLlmSettings();
  const [provider, setProvider] = useState<LlmProvider>(saved.provider);
  const [apiKey, setApiKey] = useState(saved.apiKey);
  const [model, setModel] = useState(saved.model);
  const [showKey, setShowKey] = useState(false);
  const [saved2, setSaved2] = useState(false);

  useEffect(() => {
    if (open) {
      const s = getLlmSettings();
      setProvider(s.provider);
      setApiKey(s.apiKey);
      setModel(s.model);
      setSaved2(false);
    }
  }, [open]);

  const providerInfo = PROVIDERS.find((p) => p.value === provider)!;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLlmSettings({ provider, apiKey, model });
    setSaved2(true);
    setTimeout(() => {
      setSaved2(false);
      onClose();
    }, 800);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-panel w-full max-w-md mx-4 relative"
        style={{ padding: 24 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "rgba(181,0,255,0.1)",
                border: "1px solid rgba(181,0,255,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Key size={18} style={{ color: "var(--neon-purple)" }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>AI Model Settings</div>
              <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>
                Configure your LLM provider
              </div>
            </div>
          </div>
          <button
            type="button"
            className="sidebar-icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="stack" style={{ gap: 16 }}>
          {/* Provider tabs */}
          <div className="field">
            <label>Provider</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 4 }}>
              {PROVIDERS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`provider-btn ${provider === p.value ? 'provider-btn-active' : ''}`}
                  onClick={() => {
                    setProvider(p.value);
                    setModel(p.models[0] ?? "");
                  }}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1px solid ${provider === p.value ? "rgba(0,240,255,0.5)" : "rgba(255,255,255,0.08)"}`,
                    background:
                      provider === p.value
                        ? "rgba(0,240,255,0.1)"
                        : "rgba(255,255,255,0.03)",
                    color: provider === p.value ? "var(--neon-cyan)" : "var(--text-secondary)",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* API Key */}
          <div className="field">
            <label>API Key</label>
            <div style={{ position: "relative" }}>
              <input
                className="cyber-input"
                type={showKey ? "text" : "password"}
                placeholder={`Enter your ${providerInfo.label} API key...`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                style={{ paddingRight: 44 }}
                required={provider !== "groq"}
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {provider === "groq" && (
              <div className="muted mono" style={{ fontSize: 11, marginTop: 4 }}>
                Set GROQ_API_KEY in server/.env for server-side Groq, or enter here.
              </div>
            )}
          </div>

          {/* Model override */}
          <div className="field">
            <label>Model <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional override)</span></label>
            <select
              className="cyber-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
            >
              <option value="">— Default for provider —</option>
              {providerInfo.models.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Storage note */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(0,0,0,0.2)",
            }}
          >
            <div className="mono muted" style={{ fontSize: 11, lineHeight: 1.5 }}>
              Keys are stored in browser <strong style={{ color: "var(--text-secondary)" }}>localStorage</strong> only — never sent to our servers.
            </div>
          </div>

          <button
            type="submit"
            className="cyber-btn cyber-btn-primary"
            style={{ width: "100%", padding: "12px 16px", fontWeight: 900 }}
          >
            {saved2 ? (
              <span style={{ color: "var(--neon-cyan)" }}>✓ Saved!</span>
            ) : (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <Zap size={15} /> Save Settings
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
