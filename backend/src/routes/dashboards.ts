import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Agency } from "../entities/Agency";
import { Auction } from "../entities/Auction";
import { Bid } from "../entities/Bid";
import { Contract } from "../entities/Contract";
import { Lot } from "../entities/Lot";
import { SupplierProfile } from "../entities/SupplierProfile";
import { User, UserRole } from "../entities/User";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/rbac";
import { PERMISSIONS } from "../rbac/permissions";
import { asyncHandler } from "../utils/asyncHandler";
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "../utils/passwordPolicy";
import { hashPassword } from "../auth/password";
import { env } from "../config/env";
import { PncpPublicationJob, PncpJobStatus } from "../entities/PncpPublicationJob";

export const dashboardsRouter = Router();

// ── Agency dashboard ─────────────────────────────────────────────────────────
dashboardsRouter.get(
  "/agency",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });

    const auctionRepo = AppDataSource.getRepository(Auction);
    const bidRepo = AppDataSource.getRepository(Bid);
    const contractRepo = AppDataSource.getRepository(Contract);
    const userRepo = AppDataSource.getRepository(User);
    const agencyRepo = AppDataSource.getRepository(Agency);

    const [agency, members, draftAuctions, openAuctions, scheduledAuctions, closedAuctions] =
      await Promise.all([
        agencyRepo.findOne({ where: { id: agencyId } }),
        userRepo.count({ where: { agencyId, active: true } }),
        auctionRepo.count({ where: { status: "DRAFT", agencyId } }),
        auctionRepo.count({ where: { status: "OPEN", agencyId } }),
        auctionRepo.count({ where: { status: "SCHEDULED", agencyId } }),
        auctionRepo.count({ where: { status: "CLOSED", agencyId } }),
      ]);

    const totalBids = await bidRepo
      .createQueryBuilder("b")
      .innerJoin("b.lot", "lot")
      .innerJoin("lot.auction", "a", "a.agencyId = :agencyId", { agencyId })
      .getCount();

    const contracts = await contractRepo.find({ where: { agencyId }, order: { createdAt: "DESC" } });

    const today = new Date();
    const alertWindowMs = 60 * 24 * 60 * 60 * 1000;
    const alertContracts = contracts.filter((c) => {
      const end = new Date(`${c.endsAt}T23:59:59Z`);
      return (
        c.status === "ACTIVE" &&
        end.getTime() > today.getTime() &&
        end.getTime() <= today.getTime() + alertWindowMs
      );
    });

    const recentAuctions = await auctionRepo.find({
      where: { agencyId },
      order: { createdAt: "DESC" },
      take: 8,
    });

    const totalValueCents = contracts.reduce((sum, c) => {
      const val = c.totalValueCents ? BigInt(c.totalValueCents) : 0n;
      return sum + val;
    }, 0n);

    return res.json({
      agency: agency ? {
        id: agency.id,
        name: agency.name,
        officialName: agency.officialName ?? null,
        cnpj: agency.cnpj ?? null,
        city: agency.city ?? null,
        state: agency.state ?? null,
        sphere: agency.sphere ?? null,
        entityType: agency.entityType ?? null,
        legalFramework: agency.legalFramework ?? null,
      } : null,
      metrics: {
        totalAuctions: draftAuctions + openAuctions + scheduledAuctions + closedAuctions,
        openAuctions,
        scheduledAuctions,
        closedAuctions,
        draftAuctions,
        totalMembers: members,
        totalBids,
        totalContracts: contracts.length,
        activeContracts: contracts.filter((c) => c.status === "ACTIVE").length,
        expiringContracts: alertContracts.length,
        totalContractValueCents: totalValueCents.toString(),
      },
      contractAlerts: alertContracts.map((c) => ({
        id: c.id,
        contractNumber: c.contractNumber,
        title: c.title,
        supplierName: c.supplierName ?? null,
        endsAt: c.endsAt,
        status: c.status,
        totalValueCents: c.totalValueCents ?? null,
      })),
      recentAuctions: recentAuctions.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        modality: a.modality ?? null,
        processNumber: a.processNumber ?? null,
        estimatedValueCents: a.estimatedValueCents ?? null,
        startsAt: a.startsAt ?? null,
        endsAt: a.endsAt ?? null,
        createdAt: a.createdAt,
      })),
    });
  })
);

// ── Agency contracts ──────────────────────────────────────────────────────────
dashboardsRouter.get(
  "/agency/contracts",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const { recordType } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { agencyId };
    if (recordType) where.recordType = recordType;
    const contracts = await AppDataSource.getRepository(Contract).find({
      where,
      order: { createdAt: "DESC" },
    });
    return res.json({ contracts });
  })
);

dashboardsRouter.post(
  "/agency/contracts",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const body = req.body ?? {};
    if (!body.contractNumber?.trim()) return res.status(400).json({ error: "CONTRACT_NUMBER_REQUIRED" });
    if (!body.title?.trim()) return res.status(400).json({ error: "TITLE_REQUIRED" });
    if (!body.startsAt || !body.endsAt) return res.status(400).json({ error: "DATES_REQUIRED" });

    const contract = AppDataSource.getRepository(Contract).create({
      agencyId,
      contractNumber: body.contractNumber.trim(),
      title: body.title.trim(),
      supplierName: body.supplierName?.trim() ?? null,
      managerName: body.managerName?.trim() ?? null,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      status: body.status ?? "ACTIVE",
      recordType: body.recordType ?? "CONTRACT",
      totalValueCents: body.totalValueCents ? String(Math.round(Number(body.totalValueCents))) : null,
    });
    await AppDataSource.getRepository(Contract).save(contract);
    return res.status(201).json(contract);
  })
);

dashboardsRouter.patch(
  "/agency/contracts/:id",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const repo = AppDataSource.getRepository(Contract);
    const contract = await repo.findOne({ where: { id: req.params.id, agencyId } });
    if (!contract) return res.status(404).json({ error: "NOT_FOUND" });
    const body = req.body ?? {};
    if (body.contractNumber !== undefined) contract.contractNumber = body.contractNumber.trim();
    if (body.title !== undefined) contract.title = body.title.trim();
    if (body.supplierName !== undefined) contract.supplierName = body.supplierName?.trim() ?? null;
    if (body.managerName !== undefined) contract.managerName = body.managerName?.trim() ?? null;
    if (body.startsAt !== undefined) contract.startsAt = body.startsAt;
    if (body.endsAt !== undefined) contract.endsAt = body.endsAt;
    if (body.status !== undefined) contract.status = body.status;
    if (body.recordType !== undefined) contract.recordType = body.recordType;
    if (body.totalValueCents !== undefined) {
      contract.totalValueCents = body.totalValueCents ? String(Math.round(Number(body.totalValueCents))) : null;
    }
    await repo.save(contract);
    return res.json(contract);
  })
);

dashboardsRouter.delete(
  "/agency/contracts/:id",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const repo = AppDataSource.getRepository(Contract);
    const contract = await repo.findOne({ where: { id: req.params.id, agencyId } });
    if (!contract) return res.status(404).json({ error: "NOT_FOUND" });
    await repo.remove(contract);
    return res.json({ ok: true });
  })
);

// ── Agency members ────────────────────────────────────────────────────────────
dashboardsRouter.get(
  "/agency/members",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const users = await AppDataSource.getRepository(User).find({
      where: { agencyId },
      order: { createdAt: "DESC" },
    });
    return res.json({
      members: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        createdAt: u.createdAt,
      })),
    });
  })
);

// ── Agency members: search citizens ──────────────────────────────────────────
dashboardsRouter.get(
  "/agency/members/search",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_TEAM_MANAGE),
  asyncHandler(async (req, res) => {
    const { q } = req.query as Record<string, string>;
    if (!q || q.trim().length < 2) return res.json({ users: [] });
    const term = q.trim();
    const ineligibleRoles = [UserRole.ADMIN, UserRole.AGENCY_ADMIN, UserRole.AGENCY_MEMBER];
    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder("u")
      .where("u.active = true")
      .andWhere("u.agencyId IS NULL")
      .andWhere("u.role NOT IN (:...ineligible)", { ineligible: ineligibleRoles })
      .andWhere("(u.name ILIKE :q OR u.email ILIKE :q)", { q: `%${term}%` })
      .orderBy("u.name", "ASC")
      .take(10)
      .getMany();
    return res.json({
      users: users.map((u) => ({ id: u.id, name: u.name, email: u.email })),
    });
  })
);

// ── Agency members: add citizen ───────────────────────────────────────────────
dashboardsRouter.post(
  "/agency/members",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_TEAM_MANAGE),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    const adminUserId = req.auth!.userId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });

    const body = req.body ?? {};
    const citizenId = typeof body.citizenId === "string" ? body.citizenId.trim() : "";
    if (!citizenId) return res.status(400).json({ error: "CITIZEN_ID_REQUIRED" });
    if (citizenId === adminUserId) return res.status(400).json({ error: "CANNOT_ADD_SELF" });

    const ineligibleRoles = [UserRole.ADMIN, UserRole.AGENCY_ADMIN, UserRole.AGENCY_MEMBER];
    const userRepo = AppDataSource.getRepository(User);
    const citizen = await userRepo.findOne({ where: { id: citizenId, active: true } });
    if (!citizen) return res.status(404).json({ error: "USER_NOT_FOUND" });
    if (ineligibleRoles.includes(citizen.role as UserRole)) return res.status(422).json({ error: "USER_NOT_ELIGIBLE" });
    if (citizen.agencyId) return res.status(422).json({ error: "USER_ALREADY_IN_AGENCY" });

    citizen.role = UserRole.AGENCY_MEMBER;
    citizen.agencyId = agencyId;
    await userRepo.save(citizen);

    return res.status(201).json({
      id: citizen.id,
      name: citizen.name,
      email: citizen.email,
      role: citizen.role,
      active: citizen.active,
      createdAt: citizen.createdAt,
    });
  })
);

// ── Agency members: remove member ─────────────────────────────────────────────
dashboardsRouter.delete(
  "/agency/members/:userId",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_TEAM_MANAGE),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    const adminUserId = req.auth!.userId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });

    const { userId } = req.params;
    if (userId === adminUserId) return res.status(400).json({ error: "CANNOT_REMOVE_SELF" });

    const userRepo = AppDataSource.getRepository(User);
    const member = await userRepo.findOne({ where: { id: userId, agencyId } });
    if (!member) return res.status(404).json({ error: "MEMBER_NOT_FOUND" });
    if (member.role === UserRole.AGENCY_ADMIN) return res.status(403).json({ error: "CANNOT_REMOVE_ADMIN" });

    member.role = UserRole.CITIZEN;
    member.agencyId = null;
    await userRepo.save(member);

    return res.json({ ok: true });
  })
);

// ── Agency auctions (own) ─────────────────────────────────────────────────────
dashboardsRouter.get(
  "/agency/auctions",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const { status } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { agencyId };
    if (status) where.status = status;
    const auctions = await AppDataSource.getRepository(Auction).find({
      where,
      order: { createdAt: "DESC" },
    });
    return res.json({ auctions });
  })
);

// ── Agency integrations status ────────────────────────────────────────────────
dashboardsRouter.get(
  "/agency/integrations",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });

    const pncpJobRepo = AppDataSource.getRepository(PncpPublicationJob);
    const [pncpTotal, pncpSucceeded, pncpPending, pncpFailed] = await Promise.all([
      pncpJobRepo.count({ where: { agencyId } }),
      pncpJobRepo.count({ where: { agencyId, status: PncpJobStatus.SUCCEEDED } }),
      pncpJobRepo.count({ where: { agencyId, status: PncpJobStatus.PENDING } }),
      pncpJobRepo.count({ where: { agencyId, status: PncpJobStatus.FAILED } }),
    ]);

    return res.json({
      integrations: [
        {
          id: "pncp",
          name: "PNCP",
          fullName: "Portal Nacional de Contratações Públicas",
          description: "Publicação automática de pregões e contratos no portal federal obrigatório para órgãos da Administração Pública.",
          category: "governo",
          status: env.pncp.enabled ? "active" : "inactive",
          configured: env.pncp.enabled,
          official: true,
          stats: env.pncp.enabled ? {
            totalJobs: pncpTotal,
            succeeded: pncpSucceeded,
            pending: pncpPending,
            failed: pncpFailed,
          } : null,
          docsUrl: "https://www.gov.br/compras/pncp",
          logoColor: "#1565C0",
        },
        {
          id: "comprasnet",
          name: "ComprasNet",
          fullName: "Portal de Compras do Governo Federal",
          description: "Integração com o portal de compras governamentais federais para publicação de editais e resultados.",
          category: "governo",
          status: "coming_soon",
          configured: false,
          official: true,
          stats: null,
          docsUrl: "https://www.comprasgovernamentais.gov.br",
          logoColor: "#388E3C",
        },
        {
          id: "tce",
          name: "TCE",
          fullName: "Tribunal de Contas do Estado",
          description: "Envio automático de dados de licitações e contratos para o Tribunal de Contas Estadual conforme legislação vigente.",
          category: "controle",
          status: "coming_soon",
          configured: false,
          official: true,
          stats: null,
          docsUrl: null,
          logoColor: "#6A1B9A",
        },
        {
          id: "tcu",
          name: "TCU",
          fullName: "Tribunal de Contas da União",
          description: "Integração para envio de dados ao TCU via sistema SICONV e demais plataformas de controle federal.",
          category: "controle",
          status: "coming_soon",
          configured: false,
          official: true,
          stats: null,
          docsUrl: null,
          logoColor: "#BF360C",
        },
        {
          id: "govbr",
          name: "Gov.br",
          fullName: "Autenticação Gov.br",
          description: "Permite que usuários façam login com suas contas Gov.br, aumentando a segurança e simplificando o acesso.",
          category: "autenticacao",
          status: "coming_soon",
          configured: false,
          official: true,
          stats: null,
          docsUrl: "https://acesso.gov.br",
          logoColor: "#1976D2",
        },
        {
          id: "sicaf",
          name: "SICAF",
          fullName: "Sistema de Cadastramento Unificado de Fornecedores",
          description: "Consulta automática de habilitação e regularidade fiscal de fornecedores diretamente no SICAF.",
          category: "fornecedores",
          status: "coming_soon",
          configured: false,
          official: true,
          stats: null,
          docsUrl: "https://www.comprasgovernamentais.gov.br/sicaf",
          logoColor: "#00695C",
        },
        {
          id: "bec_sp",
          name: "BEC/SP",
          fullName: "Bolsa Eletrônica de Compras do Estado de SP",
          description: "Integração com a BEC-SP para publicação e consulta de cotações eletrônicas para órgãos do Estado de São Paulo.",
          category: "regional",
          status: "coming_soon",
          configured: false,
          official: true,
          stats: null,
          docsUrl: "https://www.bec.sp.gov.br",
          logoColor: "#E65100",
        },
        {
          id: "webhook",
          name: "Webhooks",
          fullName: "Webhooks Personalizados",
          description: "Envie notificações em tempo real para sistemas externos sempre que ocorrer um evento na plataforma (lance, abertura, encerramento).",
          category: "desenvolvedor",
          status: "coming_soon",
          configured: false,
          official: false,
          stats: null,
          docsUrl: null,
          logoColor: "#37474F",
        },
      ],
    });
  })
);

dashboardsRouter.get(
  "/agency/setup",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });

    const agency = await AppDataSource.getRepository(Agency).findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });

    return res.json({
      agency: {
        id: agency.id,
        name: agency.name,
        officialName: agency.officialName ?? null,
        cnpj: agency.cnpj ?? null,
        city: agency.city ?? null,
        state: agency.state ?? null,
        sphere: agency.sphere ?? null,
        entityType: agency.entityType ?? null,
        legalFramework: agency.legalFramework ?? null,
        contractAlertWindowDays: agency.contractAlertWindowDays,
        tenantSettings: agency.tenantSettings ?? null,
      },
    });
  })
);

dashboardsRouter.post(
  "/agency/setup/timeline-validation",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });

    const agency = await AppDataSource.getRepository(Agency).findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });

    const body = req.body ?? {};
    const startsAt = typeof body.startsAt === "string" ? new Date(body.startsAt) : null;

    if (!startsAt || isNaN(startsAt.getTime())) {
      return res.status(400).json({ error: "INVALID_DATE" });
    }

    const minDays = agency.legalFramework === "LEI_14133" ? 8
      : agency.legalFramework === "LEI_13303" ? 5
      : 3;

    const nowMs = Date.now();
    const diffMs = startsAt.getTime() - nowMs;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const valid = diffDays >= minDays;

    return res.json({
      valid,
      minDays,
      diffDays: Math.round(diffDays * 10) / 10,
      errorCode: valid ? null : "TIMELINE_TOO_SHORT",
      phaseInversionEnabled: agency.legalFramework === "LEI_13303",
    });
  })
);

// ── Agency org data edit ──────────────────────────────────────────────────────
dashboardsRouter.patch(
  "/agency/setup",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const repo = AppDataSource.getRepository(Agency);
    const agency = await repo.findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const body = req.body ?? {};

    if (typeof body.officialName === "string") agency.officialName = body.officialName.trim() || null;
    if (typeof body.description === "string") agency.description = body.description.trim() || null;
    if (typeof body.city === "string") agency.city = body.city.trim() || null;
    if (typeof body.state === "string") agency.state = body.state.trim() || null;
    if (typeof body.sphere === "string") agency.sphere = body.sphere || null;
    if (typeof body.entityType === "string") agency.entityType = body.entityType || null;
    if (typeof body.legalFramework === "string") agency.legalFramework = body.legalFramework || null;
    if (typeof body.contractAlertWindowDays === "number") {
      agency.contractAlertWindowDays = Math.max(1, Math.min(365, body.contractAlertWindowDays));
    }
    // Merge extra fields (phone, email, website, zipCode, street, number, district) into tenantSettings
    const extraKeys = ["phone", "email", "website", "zipCode", "street", "addressNumber", "district"];
    const extra: Record<string, unknown> = {};
    for (const k of extraKeys) {
      if (body[k] !== undefined) extra[k] = typeof body[k] === "string" ? body[k].trim() : body[k];
    }
    if (Object.keys(extra).length > 0) {
      agency.tenantSettings = { ...(agency.tenantSettings ?? {}), ...extra };
    }

    await repo.save(agency);
    return res.json({
      id: agency.id,
      name: agency.name,
      officialName: agency.officialName ?? null,
      cnpj: agency.cnpj ?? null,
      city: agency.city ?? null,
      state: agency.state ?? null,
      sphere: agency.sphere ?? null,
      entityType: agency.entityType ?? null,
      legalFramework: agency.legalFramework ?? null,
      description: agency.description ?? null,
      contractAlertWindowDays: agency.contractAlertWindowDays,
      tenantSettings: agency.tenantSettings ?? null,
    });
  })
);

// ── Agency document templates (stored in tenantSettings) ─────────────────────
function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

dashboardsRouter.get(
  "/agency/documents",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const agency = await AppDataSource.getRepository(Agency).findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const docs = (agency.tenantSettings?.documentTemplates as unknown[]) ?? [];
    return res.json({ documents: docs });
  })
);

dashboardsRouter.post(
  "/agency/documents",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const body = req.body ?? {};
    if (!body.name?.trim()) return res.status(400).json({ error: "NAME_REQUIRED" });
    const repo = AppDataSource.getRepository(Agency);
    const agency = await repo.findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const now = new Date().toISOString();
    const doc = { id: genId(), name: body.name.trim(), category: body.category ?? "OUTRO", content: body.content ?? "", createdAt: now, updatedAt: now };
    const existing = (agency.tenantSettings?.documentTemplates as unknown[]) ?? [];
    agency.tenantSettings = { ...(agency.tenantSettings ?? {}), documentTemplates: [...existing, doc] };
    await repo.save(agency);
    return res.status(201).json(doc);
  })
);

dashboardsRouter.patch(
  "/agency/documents/:docId",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const repo = AppDataSource.getRepository(Agency);
    const agency = await repo.findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const docs = ((agency.tenantSettings?.documentTemplates as Record<string, unknown>[]) ?? []);
    const idx = docs.findIndex((d) => d.id === req.params.docId);
    if (idx < 0) return res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
    const body = req.body ?? {};
    docs[idx] = {
      ...docs[idx],
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.content !== undefined ? { content: body.content } : {}),
      updatedAt: new Date().toISOString(),
    };
    agency.tenantSettings = { ...(agency.tenantSettings ?? {}), documentTemplates: docs };
    await repo.save(agency);
    return res.json(docs[idx]);
  })
);

dashboardsRouter.delete(
  "/agency/documents/:docId",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const repo = AppDataSource.getRepository(Agency);
    const agency = await repo.findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const docs = ((agency.tenantSettings?.documentTemplates as Record<string, unknown>[]) ?? []);
    agency.tenantSettings = { ...(agency.tenantSettings ?? {}), documentTemplates: docs.filter((d) => d.id !== req.params.docId) };
    await repo.save(agency);
    return res.json({ ok: true });
  })
);

// ── Agency declarations (stored in tenantSettings) ───────────────────────────
dashboardsRouter.get(
  "/agency/declarations",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const agency = await AppDataSource.getRepository(Agency).findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const declarations = (agency.tenantSettings?.declarations as unknown[]) ?? [];
    return res.json({ declarations });
  })
);

dashboardsRouter.post(
  "/agency/declarations",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const body = req.body ?? {};
    if (!body.name?.trim()) return res.status(400).json({ error: "NAME_REQUIRED" });
    const repo = AppDataSource.getRepository(Agency);
    const agency = await repo.findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const now = new Date().toISOString();
    const decl = { id: genId(), name: body.name.trim(), type: body.type ?? "PERSONALIZADO", status: body.status ?? "draft", content: body.content ?? "", createdAt: now, updatedAt: now };
    const existing = (agency.tenantSettings?.declarations as unknown[]) ?? [];
    agency.tenantSettings = { ...(agency.tenantSettings ?? {}), declarations: [...existing, decl] };
    await repo.save(agency);
    return res.status(201).json(decl);
  })
);

dashboardsRouter.patch(
  "/agency/declarations/:declId",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const repo = AppDataSource.getRepository(Agency);
    const agency = await repo.findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const decls = ((agency.tenantSettings?.declarations as Record<string, unknown>[]) ?? []);
    const idx = decls.findIndex((d) => d.id === req.params.declId);
    if (idx < 0) return res.status(404).json({ error: "DECLARATION_NOT_FOUND" });
    const body = req.body ?? {};
    decls[idx] = {
      ...decls[idx],
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.type !== undefined ? { type: body.type } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.content !== undefined ? { content: body.content } : {}),
      updatedAt: new Date().toISOString(),
    };
    agency.tenantSettings = { ...(agency.tenantSettings ?? {}), declarations: decls };
    await repo.save(agency);
    return res.json(decls[idx]);
  })
);

dashboardsRouter.delete(
  "/agency/declarations/:declId",
  requireAuth,
  requirePermission(PERMISSIONS.AGENCIES_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const agencyId = req.auth!.agencyId;
    if (!agencyId) return res.status(403).json({ error: "NO_AGENCY" });
    const repo = AppDataSource.getRepository(Agency);
    const agency = await repo.findOne({ where: { id: agencyId } });
    if (!agency) return res.status(404).json({ error: "AGENCY_NOT_FOUND" });
    const decls = ((agency.tenantSettings?.declarations as Record<string, unknown>[]) ?? []);
    agency.tenantSettings = { ...(agency.tenantSettings ?? {}), declarations: decls.filter((d) => d.id !== req.params.declId) };
    await repo.save(agency);
    return res.json({ ok: true });
  })
);

// ── Supplier dashboard ────────────────────────────────────────────────────────
dashboardsRouter.get(
  "/supplier",
  requireAuth,
  requirePermission(PERMISSIONS.SUPPLIERS_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;

    const bidRepo = AppDataSource.getRepository(Bid);

    const bids = await bidRepo
      .createQueryBuilder("b")
      .where("b.userId = :userId", { userId })
      .leftJoinAndSelect("b.lot", "lot")
      .leftJoinAndSelect("lot.auction", "auction")
      .orderBy("b.createdAt", "DESC")
      .take(20)
      .getMany();

    const totalBids = await bidRepo.count({ where: { userId } });
    const uniqueLots = new Set(bids.map((b) => b.lotId)).size;
    const uniqueAuctions = new Set(bids.map((b) => b.lot?.auctionId)).size;

    const amounts = bids.map((b) => BigInt(b.amountCents));
    const highestBid = amounts.length > 0 ? amounts.reduce((a, b) => (a > b ? a : b)).toString() : "0";
    const totalOffered = amounts.reduce((a, b) => a + b, 0n).toString();

    return res.json({
      totalBids,
      lotsParticipated: uniqueLots,
      auctionsJoined: uniqueAuctions,
      highestBidCents: highestBid,
      totalOfferedCents: totalOffered,
      recentBids: bids.map((b) => ({
        id: b.id,
        amountCents: b.amountCents,
        createdAt: b.createdAt,
        lot: b.lot ? { id: b.lot.id, title: b.lot.title } : null,
        auction: b.lot?.auction ? { id: b.lot.auction.id, title: b.lot.auction.title, status: b.lot.auction.status } : null,
      })),
    });
  })
);

dashboardsRouter.get(
  "/supplier/users",
  requireAuth,
  requirePermission(PERMISSIONS.SUPPLIERS_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const userId = req.auth!.userId;
    // Sub-users have a SupplierProfile where linkedCitizenUserId = this user's id
    const linkedProfiles = await AppDataSource.getRepository(SupplierProfile).find({
      where: { linkedCitizenUserId: userId },
    });
    const linkedUserIds = linkedProfiles.map((p) => p.userId);
    const users = linkedUserIds.length > 0
      ? await AppDataSource.getRepository(User)
          .createQueryBuilder("u")
          .where("u.id IN (:...ids)", { ids: linkedUserIds })
          .orderBy("u.createdAt", "DESC")
          .getMany()
      : [];
    return res.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        cpfNormalized: u.cpfNormalized ?? null,
        active: u.active,
        createdAt: u.createdAt,
      })),
    });
  })
);

// Search existing citizens to add as sub-users
dashboardsRouter.get(
  "/supplier/users/search",
  requireAuth,
  requirePermission(PERMISSIONS.SUPPLIERS_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const { q } = req.query as Record<string, string>;
    if (!q || q.trim().length < 2) return res.json({ users: [] });
    const term = q.trim();
    const users = await AppDataSource.getRepository(User)
      .createQueryBuilder("u")
      .where("u.role = :role", { role: UserRole.CITIZEN })
      .andWhere(
        "(u.name ILIKE :q OR u.email ILIKE :q OR u.cpfNormalized ILIKE :q)",
        { q: `%${term}%` }
      )
      .orderBy("u.name", "ASC")
      .take(10)
      .getMany();
    return res.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        cpfNormalized: u.cpfNormalized ?? null,
        active: u.active,
      })),
    });
  })
);

// Add an existing citizen as a sub-user of this supplier
dashboardsRouter.post(
  "/supplier/users",
  requireAuth,
  requirePermission(PERMISSIONS.SUPPLIERS_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const parentUserId = req.auth!.userId;
    const body = req.body ?? {};

    const citizenId = typeof body.citizenId === "string" ? body.citizenId.trim() : "";
    if (!citizenId) return res.status(400).json({ error: "CITIZEN_ID_REQUIRED" });
    if (citizenId === parentUserId) return res.status(400).json({ error: "CANNOT_ADD_SELF" });

    const userRepo = AppDataSource.getRepository(User);
    const spRepo = AppDataSource.getRepository(SupplierProfile);

    // Must be an existing citizen (or a supplier stuck without a profile from a prior failed attempt)
    const citizen = await userRepo.findOne({ where: { id: citizenId } });
    if (!citizen) return res.status(404).json({ error: "CITIZEN_NOT_FOUND" });

    const existingProfile = await spRepo.findOne({ where: { userId: citizenId } });

    if (citizen.role === UserRole.SUPPLIER && existingProfile) {
      // Already fully promoted — check if already linked to this supplier
      if (existingProfile.linkedCitizenUserId === parentUserId) {
        return res.status(409).json({ error: "ALREADY_ADDED" });
      }
      return res.status(422).json({ error: "USER_NOT_CITIZEN" });
    }

    if (citizen.role !== UserRole.CITIZEN && !(citizen.role === UserRole.SUPPLIER && !existingProfile)) {
      return res.status(422).json({ error: "USER_NOT_CITIZEN" });
    }

    // Already a sub-user of this supplier?
    const alreadyLinked = await spRepo.findOne({ where: { userId: citizenId, linkedCitizenUserId: parentUserId } });
    if (alreadyLinked) return res.status(409).json({ error: "ALREADY_ADDED" });

    const parentSp = await spRepo.findOne({ where: { userId: parentUserId } });

    // Wrap in a transaction so role change + profile creation are atomic
    await AppDataSource.transaction(async (em) => {
      citizen.role = UserRole.SUPPLIER;
      await em.save(User, citizen);

      const sp = em.create(SupplierProfile, {
        userId: citizen.id,
        linkedCitizenUserId: parentUserId,
        // Do NOT copy cnpj — it has a unique constraint; sub-users share the company but not the CNPJ record
        companyName: parentSp?.companyName ?? null,
      });
      await em.save(SupplierProfile, sp);
    });

    return res.status(201).json({
      id: citizen.id,
      name: citizen.name,
      email: citizen.email,
      cpfNormalized: citizen.cpfNormalized ?? null,
      active: citizen.active,
      createdAt: citizen.createdAt,
    });
  })
);

dashboardsRouter.patch(
  "/supplier/users/:id",
  requireAuth,
  requirePermission(PERMISSIONS.SUPPLIERS_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const callerUserId = req.auth!.userId;
    if (id === callerUserId) return res.status(400).json({ error: "CANNOT_MODIFY_SELF" });

    const body = req.body ?? {};
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id } });
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    if (typeof body.name === "string" && body.name.trim().length >= 3) {
      user.name = body.name.trim();
    }
    if (typeof body.active === "boolean") {
      user.active = body.active;
    }
    if (typeof body.password === "string" && body.password.length > 0) {
      if (!isStrongPassword(body.password)) {
        return res.status(422).json({ error: PASSWORD_POLICY_MESSAGE });
      }
      user.passwordHash = await hashPassword(body.password);
    }

    await userRepo.save(user);
    return res.json({ id: user.id, name: user.name, active: user.active });
  })
);

dashboardsRouter.delete(
  "/supplier/users/:id",
  requireAuth,
  requirePermission(PERMISSIONS.SUPPLIERS_DASHBOARD_READ),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const callerUserId = req.auth!.userId;
    if (id === callerUserId) return res.status(400).json({ error: "CANNOT_DELETE_SELF" });

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id } });
    if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

    await userRepo.remove(user);
    return res.json({ ok: true });
  })
);

