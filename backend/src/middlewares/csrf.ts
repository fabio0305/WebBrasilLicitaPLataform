import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function normalizeOrigin(raw: string): string | null {
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    return null;
  }
}

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  if (!MUTATING_METHODS.has(req.method)) return next();

  const rawOrigin = req.headers.origin ?? req.headers.referer;
  if (!rawOrigin) return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });

  const incoming = normalizeOrigin(rawOrigin);
  if (!incoming) return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });

  const allowed = new Set<string>();
  const pub = normalizeOrigin(env.app.publicUrl);
  if (pub) allowed.add(pub);
  if (env.app.corsOrigin) {
    const cors = normalizeOrigin(env.app.corsOrigin);
    if (cors) allowed.add(cors);
  }
  const host = req.headers.host;
  if (host) {
    allowed.add(`http://${host}`);
    allowed.add(`https://${host}`);
  }

  if (!allowed.has(incoming)) return res.status(403).json({ error: "FORBIDDEN_ORIGIN" });
  return next();
}
