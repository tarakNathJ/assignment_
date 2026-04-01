export interface DashboardWidget {
  id: string;
  title: string;
  sql: string;
  chartType: string;
  snapshotColumns: string[];
  snapshotRows: Record<string, unknown>[];
  layout: { x: number; y: number; w: number; h: number };
  createdAt: string;
}

export interface DashboardRecord {
  id: string;
  title: string;
  shareToken: string;
  widgets: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}
