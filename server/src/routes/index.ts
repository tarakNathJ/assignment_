import { Router } from "express";
import { healthHandler } from "../handlers/health.handler.js";
import { loginHandler, logoutHandler, meHandler } from "../handlers/auth.handler.js";
import { requireAuth } from "../middleware/require-auth.js";
import { requireDb } from "../middleware/require-db.js";
import {
  connectCustomHandler,
  connectDemoHandler,
  disconnectDbHandler,
} from "../handlers/db-session.handler.js";
import { getSchemaHandler, refreshSchemaHandler } from "../handlers/schema.handler.js";
import { nlQueryHandler } from "../handlers/nl-query.handler.js";
import { sqlQueryHandler } from "../handlers/sql-query.handler.js";
import {
  addWidgetHandler,
  createDashboardHandler,
  deleteDashboardHandler,
  deleteWidgetHandler,
  getDashboardHandler,
  listDashboardsHandler,
  publicDashboardHandler,
  updateDashboardHandler,
  updateLayoutsHandler,
} from "../handlers/dashboard.handler.js";

export const router = Router();

router.get("/health", healthHandler);

router.post("/auth/login", loginHandler);
router.post("/auth/logout", logoutHandler);
router.get("/auth/me", meHandler);

router.get("/public/dashboards/:token", publicDashboardHandler);

router.use(requireAuth);

router.post("/db/demo", connectDemoHandler);
router.post("/db/custom", connectCustomHandler);
router.post("/db/disconnect", disconnectDbHandler);

router.get("/schema", requireDb, getSchemaHandler);
router.post("/schema/refresh", requireDb, refreshSchemaHandler);

router.post("/query/nl", requireDb, nlQueryHandler);
router.post("/query/sql", requireDb, sqlQueryHandler);

router.get("/dashboards", listDashboardsHandler);
router.post("/dashboards", createDashboardHandler);
router.get("/dashboards/:id", getDashboardHandler);
router.patch("/dashboards/:id", requireAuth, updateDashboardHandler);
router.delete("/dashboards/:id", requireAuth, deleteDashboardHandler);
router.post("/dashboards/:id/widgets", addWidgetHandler);
router.delete("/dashboards/:id/widgets/:widgetId", requireAuth, deleteWidgetHandler);
router.patch("/dashboards/:id/layouts", updateLayoutsHandler);
