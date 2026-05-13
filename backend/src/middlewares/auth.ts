import type { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entities/User";
import { getCookie } from "../auth/cookies";
import { getSession } from "../auth/sessions";
import { env } from "../config/env";

export type AuthContext = {
  userId: string;
  email: string;
  cpfNormalized: string | null;
  role: string;
  requestedRole: string | null;
  onboardingStatus: string;
  agencyId: string | null;
};

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sid = getCookie(req, env.session.cookieName);
    if (!sid) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const session = await getSession(sid);
    if (!session) return res.status(401).json({ error: "UNAUTHENTICATED" });

    const user = await AppDataSource.getRepository(User).findOne({
      where: { id: session.userId, active: true },
    });
    if (!user) return res.status(401).json({ error: "UNAUTHENTICATED" });

    req.auth = {
      userId: user.id,
      email: user.email,
      cpfNormalized: user.cpfNormalized ?? null,
      role: user.role,
      requestedRole: user.requestedRole ?? null,
      onboardingStatus: user.onboardingStatus,
      agencyId: user.agencyId ?? null,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}
