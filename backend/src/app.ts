import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { env } from "./config/env";
import { router } from "./routes/index";
import { requireTrustedOrigin } from "./middlewares/csrf";
import { appendAuditLog } from "./middlewares/auditLog";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors({
    origin: env.app.corsOrigin || env.app.publicUrl,
    credentials: true,
  }));

  const generalLimiter = rateLimit({ windowMs: 60_000, max: 300 });
  const writeLimiter = rateLimit({
    windowMs: 60_000,
    max: 60,
    skip: (req) => !["POST", "PUT", "PATCH", "DELETE"].includes(req.method),
  });
  // Strict limiter for sensitive auth operations (login, register, password recovery, OTP)
  const authSensitiveLimiter = rateLimit({
    windowMs: 60_000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "TOO_MANY_REQUESTS" },
  });

  app.use(generalLimiter);
  app.use("/api/auctions", writeLimiter);
  app.use("/api/dashboards", writeLimiter);
  app.use("/api/lots", writeLimiter);
  app.use("/api/auth/login", authSensitiveLimiter);
  app.use("/api/auth/password-recovery", authSensitiveLimiter);
  app.use("/api/auth/email-verify", authSensitiveLimiter);
  app.use("/api/auth/register", authSensitiveLimiter);

  app.use(express.json({ limit: "10mb" }));
  app.use(requireTrustedOrigin);
  app.use(appendAuditLog);

  app.use("/api", router);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const statusCode = (err as { status?: number })?.status ?? 500;
    const message = (err as Error)?.message ?? "ERROR";
    if (statusCode >= 500) console.error("Server error:", err);
    const safeMessage = message === message.toUpperCase() ? message : "ERROR";
    res.status(statusCode).json({ error: safeMessage });
  });

  return app;
}
