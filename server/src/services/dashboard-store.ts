import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { v4 as uuid } from "uuid";
import type { DashboardRecord, DashboardWidget } from "../types/dashboard.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const isVercel = process.env.VERCEL === "1";
const DATA_DIR = isVercel ? tmpdir() : join(__dirname, "..", "..", "data");
const STORE_PATH = join(DATA_DIR, "dashboards.json");

interface StoreFile {
  byId: Record<string, DashboardRecord>;
  byShare: Record<string, string>;
}

function emptyStore(): StoreFile {
  return { byId: {}, byShare: {} };
}

function load(): StoreFile {
  if (!existsSync(STORE_PATH)) return emptyStore();
  try {
    const raw = readFileSync(STORE_PATH, "utf8");
    return JSON.parse(raw) as StoreFile;
  } catch {
    return emptyStore();
  }
}

function save(data: StoreFile): void {
  mkdirSync(dirname(STORE_PATH), { recursive: true });
  writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export function createDashboard(title: string): DashboardRecord {
  const data = load();
  const id = uuid();
  const shareToken = uuid();
  const now = new Date().toISOString();
  const rec: DashboardRecord = {
    id,
    title,
    shareToken,
    widgets: [],
    createdAt: now,
    updatedAt: now,
  };
  data.byId[id] = rec;
  data.byShare[shareToken] = id;
  save(data);
  return rec;
}

export function getDashboard(id: string): DashboardRecord | undefined {
  return load().byId[id];
}

export function getDashboardByShareToken(token: string): DashboardRecord | undefined {
  const data = load();
  const id = data.byShare[token];
  if (!id) return undefined;
  return data.byId[id];
}

export function addWidget(dashboardId: string, widget: Omit<DashboardWidget, "id" | "createdAt">): DashboardWidget | undefined {
  const data = load();
  const d = data.byId[dashboardId];
  if (!d) return undefined;
  const w: DashboardWidget = {
    ...widget,
    id: uuid(),
    createdAt: new Date().toISOString(),
  };
  d.widgets.push(w);
  d.updatedAt = new Date().toISOString();
  save(data);
  return w;
}

export function updateLayouts(
  dashboardId: string,
  layouts: { widgetId: string; layout: DashboardWidget["layout"] }[],
): DashboardRecord | undefined {
  const data = load();
  const d = data.byId[dashboardId];
  if (!d) return undefined;
  const map = new Map(layouts.map((l) => [l.widgetId, l.layout]));
  for (const w of d.widgets) {
    const L = map.get(w.id);
    if (L) w.layout = L;
  }
  d.updatedAt = new Date().toISOString();
  save(data);
  return d;
}

export function listDashboards(): DashboardRecord[] {
  const data = load();
  return Object.values(data.byId).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function updateTitle(id: string, title: string): DashboardRecord | undefined {
  const data = load();
  const d = data.byId[id];
  if (!d) return undefined;
  d.title = title;
  d.updatedAt = new Date().toISOString();
  save(data);
  return d;
}

export function remove(id: string): boolean {
  const data = load();
  if (!data.byId[id]) return false;
  const token = data.byId[id].shareToken;
  delete data.byId[id];
  delete data.byShare[token];
  save(data);
  return true;
}

export function removeWidget(dashboardId: string, widgetId: string): boolean {
  const data = load();
  const d = data.byId[dashboardId];
  if (!d) return false;
  const initialLength = d.widgets.length;
  d.widgets = d.widgets.filter(w => w.id !== widgetId);
  if (d.widgets.length === initialLength) return false;
  d.updatedAt = new Date().toISOString();
  save(data);
  return true;
}
