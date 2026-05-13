import type { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { AuditLog } from "../entities/AuditLog";

const SENSITIVE_KEYS = new Set(["password", "passwordHash", "token", "secret", "recoveryTokenHash"]);

function sanitize(obj: unknown): unknown {
  if (typeof obj !== "object" || obj === null) return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    result[k] = SENSITIVE_KEYS.has(k) ? "[REDACTED]" : sanitize(v);
  }
  return result;
}

declare global {
  namespace Express {
    interface Request {
      auditTrail?: { previousPayload?: unknown };
    }
  }
}

export function appendAuditLog(req: Request, res: Response, next: NextFunction) {
  const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
  if (!MUTATING.has(req.method)) return next();

  res.on("finish", async () => {
    try {
      const repo = AppDataSource.getRepository(AuditLog);
      const log = repo.create({
        userId: req.auth?.userId ?? null,
        agencyId: req.auth?.agencyId ?? null,
        actorRole: req.auth?.role ?? null,
        method: req.method,
        endpoint: req.path,
        ipAddress: (req.headers["x-forwarded-for"] as string ?? req.ip ?? "").split(",")[0]?.trim() ?? null,
        statusCode: res.statusCode,
        action: `${req.method} ${req.path}`,
        previousPayload: req.auditTrail?.previousPayload
          ? (sanitize(req.auditTrail.previousPayload) as Record<string, unknown>)
          : null,
        nextPayload: req.body
          ? (sanitize(req.body) as Record<string, unknown>)
          : null,
      });
      await repo.save(log);
    } catch (err) {
      console.error("Audit log error:", err);
    }
  });
  return next();
}
