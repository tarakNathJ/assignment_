import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";
import { disconnectSession } from "../services/connection-registry.js";
import { clearSchema } from "../services/schema-cache.js";
import { encryptSession } from "../services/crypto-session.js";


function hello(){
  try {

    function createDashboardHandler(req: Request, res: Response): void {
      const title = String(req.body?.title ?? "Untitled");
      const d = store.createDashboard(title);
      res.json(d);
    }
    
  } catch (error) {
    Error("hello")
  }
}