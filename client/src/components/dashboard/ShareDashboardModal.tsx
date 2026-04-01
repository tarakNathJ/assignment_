import { useEffect, useState } from "react";
import { X, Link2, Check, Copy, Eye, Lock } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  shareUrl: string;
}

export function ShareDashboardModal({ open, onClose, shareUrl }: Props) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  async function copy() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  if (!open) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="glass-panel w-full max-w-md mx-4 relative" style={{ padding: 24 }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--accent-glow)",
                border: "1px solid rgba(99, 102, 241, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Link2 size={18} style={{ color: "var(--accent-primary)" }} />
            </div>
            <div>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Share Dashboard</div>
              <div className="muted mono" style={{ fontSize: 11, marginTop: 2 }}>
                Generate a public link for external viewing
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

        <div className="stack" style={{ gap: 20 }}>
          {/* Access Level */}
          <div className="share-access-badge">
            <Eye size={14} />
            <span>Read Only Access</span>
          </div>

          {/* Share Link */}
          <div className="field">
            <label className="input-label">Share Link</label>
            <div className="share-link-container">
              <input
                className="cyber-input share-link-input"
                value={shareUrl}
                readOnly
                onClick={(e) => e.currentTarget.select()}
              />
              <button
                type="button"
                className={`share-copy-btn ${copied ? 'share-copy-btn-success' : ''}`}
                onClick={copy}
                aria-label={copied ? "Copied" : "Copy link"}
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            {copied && (
              <div className="share-copied-feedback">
                <Check size={12} /> Link copied to clipboard
              </div>
            )}
          </div>

          {/* Info Note */}
          <div className="share-info-box">
            <Lock size={14} className="share-info-icon" />
            <span className="share-info-text">
              Anyone with this link can view the dashboard. The link does not expire.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

