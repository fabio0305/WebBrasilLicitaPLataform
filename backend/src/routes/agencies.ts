import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Agency } from "../entities/Agency";
import { User, UserRole } from "../entities/User";
import { requireAuth } from "../middlewares/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const agenciesRouter = Router();

agenciesRouter.get("/", asyncHandler(async (_req, res) => {
  const agencies = await AppDataSource.getRepository(Agency).find({
    where: { active: true },
    order: { name: "ASC" },
  });
  return res.json({
    agencies: agencies.map((a) => ({
      id: a.id,
      name: a.name,
      code: a.code ?? null,
      city: a.city ?? null,
      state: a.state ?? null,
      description: a.description ?? null,
    })),
  });
}));

// ── POST /api/agencies/register ───────────────────────────────────────────────
// Qualquer cidadão autenticado pode registrar uma organização e torna-se AGENCY_ADMIN.
agenciesRouter.post(
  "/register",
  requireAuth,
  asyncHandler(async (req, res) => {
    const { userId, role } = req.auth!;

    if (role !== UserRole.CITIZEN) {
      return res.status(403).json({ error: "CITIZEN_ONLY" });
    }

    const body = req.body ?? {};
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return res.status(400).json({ error: "NAME_REQUIRED" });

    const cnpjRaw = typeof body.cnpj === "string" ? body.cnpj.replace(/\D/g, "") : "";

    if (cnpjRaw) {
      const existing = await AppDataSource.getRepository(Agency).findOne({
        where: { cnpj: cnpjRaw },
      });
      if (existing) return res.status(409).json({ error: "CNPJ_ALREADY_REGISTERED" });
    }

    const str = (v: unknown) =>
      typeof v === "string" ? v.trim() || null : null;

    let agencyId: string;

    await AppDataSource.transaction(async (em) => {
      const agency = em.create(Agency, {
        name,
        officialName: str(body.officialName),
        cnpj: cnpjRaw || null,
        city: str(body.city),
        state: str(body.state),
        sphere: str(body.sphere),
        entityType: str(body.entityType),
      });
      const saved = await em.save(Agency, agency);
      agencyId = saved.id;

      const user = await em.findOneBy(User, { id: userId });
      user!.role = UserRole.AGENCY_ADMIN;
      user!.agencyId = agencyId;
      await em.save(User, user!);
    });

    return res.status(201).json({ agencyId: agencyId! });
  })
);
