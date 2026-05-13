import type { NextFunction, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Role } from "../entities/Role";
import { OnboardingStatus, UserRole } from "../entities/User";

export async function getPermissionsForRole(roleKey: string): Promise<Set<string>> {
  const repo = AppDataSource.getRepository(Role);
  const role = await repo.findOne({ where: { key: roleKey }, relations: ["permissions"] });
  const keys = (role?.permissions ?? []).map((p) => p.key);
  return new Set(keys);
}

export function requirePermission(...permissionKeys: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.auth) return res.status(401).json({ error: "UNAUTHENTICATED" });

      if (req.auth.role === UserRole.ADMIN) return next();

      const roleKeys = new Set([req.auth.role]);
      if (req.auth.requestedRole && req.auth.onboardingStatus === OnboardingStatus.APPROVED) {
        roleKeys.add(req.auth.requestedRole);
      }

      const permissionSets = await Promise.all(
        Array.from(roleKeys).map((roleKey) => getPermissionsForRole(roleKey))
      );
      const perms = new Set(permissionSets.flatMap((entries) => Array.from(entries)));
      const ok = permissionKeys.some((k) => perms.has(k));
      if (!ok) return res.status(403).json({ error: "FORBIDDEN" });
      return next();
    } catch (err) {
      return next(err);
    }
  };
}
