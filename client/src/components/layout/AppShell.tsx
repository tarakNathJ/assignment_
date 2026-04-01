import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { TopNav } from "./TopNav";

export function AppShell() {
  const location = useLocation();
  const isWorkspace = location.pathname === "/app" || location.pathname === "/app/";
  
  return (
    <div className="app-container">
      <Sidebar />
      <div className="main-content">
        <TopNav />
        <main className={isWorkspace ? "flex-1 overflow-hidden" : "content-scroll"}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
