import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Database, MessageSquare, LayoutDashboard, Settings, User, LogOut } from "lucide-react";
import { LlmSettingsModal } from "../ui/LlmSettingsModal";
import * as authApi from "../../api/auth";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  end?: boolean;
}

function NavItem({ to, icon, label, end }: NavItemProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `sidebar-nav-item ${isActive ? "active" : ""}`
      }
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {icon}
      {showTooltip && (
        <div className="sidebar-tooltip">
          {label}
        </div>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const accountDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target as Node)) {
        setShowAccountDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // ignore errors
    }
    navigate("/login", { replace: true });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        {/* App Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">Q</div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <NavItem
            to="/app"
            end
            icon={<MessageSquare className="sidebar-icon" size={22} />}
            label="Workspace"
          />
          <NavItem
            to="/app/connect"
            icon={<Database className="sidebar-icon" size={22} />}
            label="Connect"
          />
          <NavItem
            to="/app/dashboards"
            icon={<LayoutDashboard className="sidebar-icon" size={22} />}
            label="Dashboards"
          />
        </nav>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          <div className="sidebar-divider" />
          
          {/* Settings Button */}
          <button
            type="button"
            className="sidebar-icon-btn"
            aria-label="Settings"
            onClick={() => setShowSettings(true)}
          >
            <Settings size={20} />
          </button>

          {/* Account Button with Dropdown */}
          <div className="sidebar-account-wrapper" ref={accountDropdownRef}>
            <button
              type="button"
              className={`sidebar-icon-btn ${showAccountDropdown ? "active" : ""}`}
              aria-label="Account"
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
            >
              <User size={20} />
            </button>

            {showAccountDropdown && (
              <div className="sidebar-account-dropdown">
                <div className="sidebar-account-header">
                  <div className="sidebar-account-avatar">
                    <User size={16} />
                  </div>
                  <div className="sidebar-account-info">
                    <div className="sidebar-account-name">Demo User</div>
                    <div className="sidebar-account-email">user@example.com</div>
                  </div>
                </div>
                <div className="sidebar-account-divider" />
                <button
                  type="button"
                  className="sidebar-account-logout"
                  onClick={handleLogout}
                >
                  <LogOut size={14} />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LLM Settings Modal */}
      <LlmSettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </aside>
  );
}
