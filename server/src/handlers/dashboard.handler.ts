








































































































import type { Request, Response } from "express";
import { z } from "zod";
import * as store from "../services/dashboard-store.js";

export function listDashboardsHandler(_req: Request, res: Response): void {
  res.json(store.listDashboards());
}

export function createDashboardHandler(req: Request, res: Response): void {
  const title = String(req.body?.title ?? "Untitled");
  const d = store.createDashboard(title);
  res.json(d);
}

export function getDashboardHandler(req: Request, res: Response): void {
  const d = store.getDashboard(req.params.id);
  if (!d) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(d);
}

export function publicDashboardHandler(req: Request, res: Response): void {
  const d = store.getDashboardByShareToken(req.params.token);
  if (!d) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(d);
}

const widgetSchema = z.object({
  title: z.string(),
  sql: z.string(),
  chartType: z.string(),
  snapshotColumns: z.array(z.string()),
  snapshotRows: z.array(z.record(z.string(), z.unknown())),
  layout: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
});

export function addWidgetHandler(req: Request, res: Response): void {
  const parsed = widgetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const w = store.addWidget(req.params.id, parsed.data);
  if (!w) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }
  res.json(w);
}

const layoutsSchema = z.object({
  layouts: z.array(
    z.object({
      widgetId: z.string(),
      layout: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      }),
    }),
  ),
});

export function updateLayoutsHandler(req: Request, res: Response): void {
  const parsed = layoutsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const d = store.updateLayouts(req.params.id, parsed.data.layouts);
  if (!d) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }
  res.json(d);
}

export function deleteDashboardHandler(req: Request, res: Response): void {
  const success = store.remove(req.params.id);
  if (!success) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }
  res.status(204).send();
}

export function deleteWidgetHandler(req: Request, res: Response): void {
  const success = store.removeWidget(req.params.id, req.params.widgetId);
  if (!success) {
    res.status(404).json({ error: "Dashboard or widget not found" });
    return;
  }
  res.status(204).send();
}

const updateDashboardSchema = z.object({
  title: z.string(),
});

export function updateDashboardHandler(req: Request, res: Response): void {
  const parsed = updateDashboardSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const d = store.updateTitle(req.params.id, parsed.data.title);
  if (!d) {
    res.status(404).json({ error: "Dashboard not found" });
    return;
  }
  res.json(d);
}
