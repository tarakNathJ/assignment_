import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { LoginPage } from "./pages/LoginPage";
import { ConnectPage } from "./pages/ConnectPage";
import { WorkspacePage } from "./pages/WorkspacePage";
import { DashboardListPage } from "./pages/DashboardListPage";
import { DashboardEditorPage } from "./pages/DashboardEditorPage";
import { SharePage } from "./pages/SharePage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/share/:token" element={<SharePage />} />
      <Route path="/app" element={<AppShell />}>
        <Route index element={<WorkspacePage />} />
        <Route path="connect" element={<ConnectPage />} />
        <Route path="dashboards" element={<DashboardListPage />} />
        <Route path="dashboards/:id" element={<DashboardEditorPage />} />
      </Route>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
