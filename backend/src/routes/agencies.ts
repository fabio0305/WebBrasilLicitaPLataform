import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Agency } from "../entities/Agency";
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
