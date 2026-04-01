import type { ChartKind, DashboardRecord, DashboardWidget } from "../types/domain";
import { apiFetch } from "./http";

export function listDashboards(): Promise<DashboardRecord[]> {
  return apiFetch("/dashboards");
}

export function createDashboard(title: string): Promise<DashboardRecord> {
  return apiFetch("/dashboards", { method: "POST", body: JSON.stringify({ title }) });
}

export function getDashboard(id: string): Promise<DashboardRecord> {
  return apiFetch(`/dashboards/${encodeURIComponent(id)}`);
}

export function addWidget(
  dashboardId: string,
  payload: {
    title: string;
    sql: string;
    chartType: ChartKind;
    snapshotColumns: string[];
    snapshotRows: Record<string, unknown>[];
    layout: DashboardWidget["layout"];
  },
): Promise<DashboardWidget> {
  return apiFetch(`/dashboards/${encodeURIComponent(dashboardId)}/widgets`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function saveLayout(
  dashboardId: string,
  layouts: { widgetId: string; layout: DashboardWidget["layout"] }[],
): Promise<DashboardRecord> {
  return apiFetch(`/dashboards/${encodeURIComponent(dashboardId)}/layouts`, {
    method: "PATCH",
    body: JSON.stringify({ layouts }),
  });
}

export function getPublicDashboard(token: string): Promise<DashboardRecord> {
  return apiFetch(`/public/dashboards/${encodeURIComponent(token)}`);
}

export function deleteDashboard(id: string): Promise<void> {
  return apiFetch(`/dashboards/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
  return apiFetch(`/dashboards/${encodeURIComponent(dashboardId)}/widgets/${encodeURIComponent(widgetId)}`, {
    method: "DELETE",
  });
}

export function updateDashboard(id: string, title: string): Promise<DashboardRecord> {
  return apiFetch(`/dashboards/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}
