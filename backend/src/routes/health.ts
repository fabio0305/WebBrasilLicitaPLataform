import { Router } from "express";
import { env } from "../config/env";

export const healthRouter = Router();
healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "licitabrasil-backend",
    timestamp: new Date().toISOString(),
    authProvider: "LOCAL_CREDENTIALS",
    pncp: { enabled: env.pncp.enabled, configured: !!(env.pncp.enabled && env.pncp.baseUrl) },
  });
});
