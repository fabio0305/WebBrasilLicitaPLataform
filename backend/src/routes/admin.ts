import { Router } from "express";
import { AppDataSource } from "../data-source";
import { Agency } from "../entities/Agency";
import { Auction } from "../entities/Auction";
import { Contract, ContractStatus } from "../entities/Contract";
import { Notification } from "../entities/Notification";
import { NotificationReply } from "../entities/NotificationReply";
import { OnboardingDecision } from "../entities/OnboardingDecision";
import { PasswordRecoveryRequest, PasswordRecoveryRequestStatus, PasswordRecoveryDeliveryChannel } from "../entities/PasswordRecoveryRequest";
import { Permission } from "../entities/Permission";
import { Role } from "../entities/Role";
import { User, UserRole, OnboardingStatus } from "../entities/User";
import { requireAuth } from "../middlewares/auth";
import { requirePermission } from "../middlewares/rbac";
import { PERMISSIONS } from "../rbac/permissions";
import { asyncHandler } from "../utils/asyncHandler";
import { roleRequiresAgencyContext } from "../auth/onboarding";
import { generateRecoveryToken, buildPasswordRecoveryLink } from "../utils/passwordRecovery";
import { sendPasswordRecoveryEmail, sendAccountApprovedEmail } from "../notifications/mailer";
import { env } from "../config/env";
import { hashPassword } from "../auth/password";
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "../utils/passwordPolicy";

export const adminRouter = Router();

// All admin routes require auth
adminRouter.use(requireAuth);

// ── Onboarding ───────────────────────────────────────────────────────────────
adminRouter.get("/onboarding", requirePermission(PERMISSIONS.ADMIN_USERS_READ), asyncHandler(async (req, res) => {
  const { status, search, page = "1", limit = "20" } = req.query as Record<string, string>;
  const userRepo = AppDataSource.getRepository(User);
  const qb = userRepo.createQueryBuilder("u").leftJoinAndSelect("u.agency", "agency");
  if (status) qb.where("u.onboardingStatus = :status", { status });
  else qb.where("u.onboardingStatus = :status", { status: OnboardingStatus.PENDING });
  if (search) qb.andWhere("(u.name ILIKE :s OR u.email ILIKE :s)", { s: `%${search}%` });
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(5, parseInt(limit, 10)));
  qb.orderBy("u.createdAt", "ASC").skip((pageNum - 1) * limitNum).take(limitNum);
  const [users, total] = await qb.getManyAndCount();
  return res.json({ users, total, page: pageNum, limit: limitNum });
}));

adminRouter.patch("/onboarding/:id", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};
  const decision = typeof body.decision === "string" ? body.decision.toUpperCase() : "";
  if (decision !== "APPROVED" && decision !== "REJECTED") return res.status(400).json({ error: "INVALID_DECISION" });

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id } });
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });

  await AppDataSource.transaction(async (em) => {
    if (decision === "APPROVED") {
      const agencyId = body.agencyId ?? null;
      const role = user.requestedRole ?? UserRole.CITIZEN;
      if (roleRequiresAgencyContext(role) && !agencyId) throw new Error("AGENCY_REQUIRED");
      user.role = role;
      user.requestedRole = null;
      user.onboardingStatus = OnboardingStatus.APPROVED;
      if (agencyId) user.agencyId = agencyId;
    } else {
      user.onboardingStatus = OnboardingStatus.REJECTED;
    }
    await em.getRepository(User).save(user);

    const decisionRecord = em.getRepository(OnboardingDecision).create({
      targetUserId: user.id,
      targetEmail: user.email,
      targetName: user.name,
      requestedRole: user.requestedRole ?? undefined,
      decision,
      resultingRole: decision === "APPROVED" ? user.role : undefined,
      resultingAgencyId: decision === "APPROVED" && user.agencyId ? user.agencyId : undefined,
      decidedByUserId: req.auth!.userId,
      decidedByEmail: req.auth!.email,
    });
    await em.getRepository(OnboardingDecision).save(decisionRecord);
  });

  if (decision === "APPROVED") {
    sendAccountApprovedEmail({ to: user.email, userName: user.name }).catch(() => {});
  }

  return res.json({ ok: true });
}));

// ── Users ────────────────────────────────────────────────────────────────────
adminRouter.get("/users", requirePermission(PERMISSIONS.ADMIN_USERS_READ), asyncHandler(async (_req, res) => {
  const users = await AppDataSource.getRepository(User)
    .createQueryBuilder("u")
    .leftJoinAndSelect("u.agency", "agency")
    .orderBy("u.createdAt", "DESC")
    .getMany();
  return res.json({ users });
}));

adminRouter.post("/users", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const body = req.body ?? {};

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = typeof body.role === "string" ? body.role : UserRole.CITIZEN;

  if (!name) return res.status(400).json({ error: "NAME_REQUIRED" });
  if (!email || !email.includes("@")) return res.status(400).json({ error: "INVALID_EMAIL" });
  if (!password) return res.status(400).json({ error: "PASSWORD_REQUIRED" });
  if (!isStrongPassword(password)) return res.status(422).json({ error: "WEAK_PASSWORD", message: PASSWORD_POLICY_MESSAGE });

  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: "EMAIL_ALREADY_EXISTS" });

  const user = userRepo.create({
    name,
    email,
    passwordHash: await hashPassword(password),
    role,
    onboardingStatus: OnboardingStatus.APPROVED,
    active: true,
    agencyId: body.agencyId ?? null,
    phone: body.phone ?? null,
    cpfNormalized: body.cpf ?? null,
    organAccessProfiles: body.organAccessProfiles ?? null,
  });
  await userRepo.save(user);
  return res.status(201).json(user);
}));

adminRouter.patch("/users/:id", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id } });
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });
  if (typeof body.role === "string") user.role = body.role;
  if (typeof body.agencyId === "string" || body.agencyId === null) user.agencyId = body.agencyId;
  if (typeof body.active === "boolean") user.active = body.active;
  if (typeof body.onboardingStatus === "string") user.onboardingStatus = body.onboardingStatus;
  if (typeof body.password === "string" && body.password.length > 0) {
    if (!isStrongPassword(body.password)) {
      return res.status(422).json({ error: "WEAK_PASSWORD", message: PASSWORD_POLICY_MESSAGE });
    }
    user.passwordHash = await hashPassword(body.password);
    user.mustChangePassword = false;
  }
  await userRepo.save(user);
  return res.json(user);
}));

adminRouter.delete("/users/:id", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (id === req.auth!.userId) return res.status(400).json({ error: "CANNOT_DELETE_SELF" });
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id } });
  if (!user) return res.status(404).json({ error: "USER_NOT_FOUND" });
  await userRepo.remove(user);
  return res.json({ ok: true });
}));

// ── Password Recovery ─────────────────────────────────────────────────────────
adminRouter.get("/password-recovery", requirePermission(PERMISSIONS.ADMIN_USERS_READ), asyncHandler(async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const repo = AppDataSource.getRepository(PasswordRecoveryRequest);
  const qb = repo.createQueryBuilder("r");
  if (status) qb.where("r.status = :status", { status });
  const requests = await qb.orderBy("r.createdAt", "DESC").take(100).getMany();
  return res.json({ requests });
}));

adminRouter.post("/password-recovery/:id/issue-link", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};
  const repo = AppDataSource.getRepository(PasswordRecoveryRequest);
  const request = await repo.findOne({ where: { id } });
  if (!request) return res.status(404).json({ error: "NOT_FOUND" });

  const { token, hash } = generateRecoveryToken();
  const expiresAt = new Date(Date.now() + env.passwordRecovery.tokenTtlSeconds * 1000);
  const link = buildPasswordRecoveryLink(env.app.publicUrl, token);

  await repo.update(id, {
    recoveryTokenHash: hash,
    tokenExpiresAt: expiresAt,
    status: PasswordRecoveryRequestStatus.LINK_READY,
    deliveryChannel: body.sendEmail ? PasswordRecoveryDeliveryChannel.EMAIL : PasswordRecoveryDeliveryChannel.MANUAL_LINK,
  });

  if (body.sendEmail && request.userId) {
    const user = await AppDataSource.getRepository(User).findOne({ where: { id: request.userId } });
    if (user) {
      await sendPasswordRecoveryEmail({ to: user.email, cpfNormalized: request.cpfNormalized, link, expiresAt });
      await repo.update(id, { status: PasswordRecoveryRequestStatus.EMAIL_SENT });
    }
  }

  return res.json({ ok: true, link });
}));

adminRouter.patch("/password-recovery/:id", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};
  const repo = AppDataSource.getRepository(PasswordRecoveryRequest);
  const request = await repo.findOne({ where: { id } });
  if (!request) return res.status(404).json({ error: "NOT_FOUND" });
  if (typeof body.status === "string") await repo.update(id, { status: body.status, resolvedByUserId: req.auth!.userId, resolutionNotes: body.notes ?? null });
  return res.json({ ok: true });
}));

// ── Agencies ─────────────────────────────────────────────────────────────────
adminRouter.get("/agencies", requirePermission(PERMISSIONS.ADMIN_AGENCIES_READ), asyncHandler(async (_req, res) => {
  const agencies = await AppDataSource.getRepository(Agency)
    .createQueryBuilder("a")
    .loadRelationCountAndMap("a.userCount", "a.users")
    .orderBy("a.name", "ASC")
    .getMany();
  return res.json({ agencies });
}));

adminRouter.post("/agencies", requirePermission(PERMISSIONS.ADMIN_AGENCIES_WRITE), asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.name) return res.status(400).json({ error: "NAME_REQUIRED" });
  if (body.code) {
    const existing = await AppDataSource.getRepository(Agency).findOne({ where: { code: body.code } });
    if (existing) return res.status(409).json({ error: "CODE_TAKEN" });
  }
  const agency = AppDataSource.getRepository(Agency).create({
    name: body.name,
    officialName: body.officialName ?? null,
    cnpj: body.cnpj ?? null,
    code: body.code ?? null,
    city: body.city ?? null,
    state: body.state ?? null,
    description: body.description ?? null,
    sphere: body.sphere ?? null,
    entityType: body.entityType ?? null,
    legalFramework: body.legalFramework ?? null,
    contractAlertWindowDays: body.contractAlertWindowDays ?? 60,
    active: true,
  });
  await AppDataSource.getRepository(Agency).save(agency);
  return res.status(201).json(agency);
}));

adminRouter.patch("/agencies/:id", requirePermission(PERMISSIONS.ADMIN_AGENCIES_WRITE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};
  const repo = AppDataSource.getRepository(Agency);
  const agency = await repo.findOne({ where: { id } });
  if (!agency) return res.status(404).json({ error: "NOT_FOUND" });
  Object.assign(agency, {
    name: body.name ?? agency.name,
    officialName: body.officialName ?? agency.officialName,
    city: body.city ?? agency.city,
    state: body.state ?? agency.state,
    sphere: body.sphere ?? agency.sphere,
    entityType: body.entityType ?? agency.entityType,
    legalFramework: body.legalFramework ?? agency.legalFramework,
    contractAlertWindowDays: body.contractAlertWindowDays ?? agency.contractAlertWindowDays,
    active: typeof body.active === "boolean" ? body.active : agency.active,
  });
  await repo.save(agency);
  return res.json(agency);
}));

// ── Contracts ────────────────────────────────────────────────────────────────
adminRouter.get("/contracts", requirePermission(PERMISSIONS.ADMIN_CONTRACTS_READ), asyncHandler(async (_req, res) => {
  const contracts = await AppDataSource.getRepository(Contract).find({ order: { createdAt: "DESC" } });
  return res.json({ contracts });
}));

adminRouter.post("/contracts", requirePermission(PERMISSIONS.ADMIN_CONTRACTS_WRITE), asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.agencyId || !body.contractNumber || !body.title || !body.startsAt || !body.endsAt) {
    return res.status(400).json({ error: "MISSING_FIELDS" });
  }
  const existing = await AppDataSource.getRepository(Contract).findOne({
    where: { agencyId: body.agencyId, contractNumber: body.contractNumber },
  });
  if (existing) return res.status(409).json({ error: "CONTRACT_NUMBER_TAKEN" });

  const contract = AppDataSource.getRepository(Contract).create({
    agencyId: body.agencyId,
    contractNumber: body.contractNumber,
    title: body.title,
    supplierName: body.supplierName ?? null,
    managerName: body.managerName ?? null,
    startsAt: body.startsAt,
    endsAt: body.endsAt,
    status: ContractStatus.ACTIVE,
    totalValueCents: body.totalValueCents ?? null,
  });
  await AppDataSource.getRepository(Contract).save(contract);
  return res.status(201).json(contract);
}));

adminRouter.patch("/contracts/:id", requirePermission(PERMISSIONS.ADMIN_CONTRACTS_WRITE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const body = req.body ?? {};
  const repo = AppDataSource.getRepository(Contract);
  const contract = await repo.findOne({ where: { id } });
  if (!contract) return res.status(404).json({ error: "NOT_FOUND" });
  Object.assign(contract, {
    title: body.title ?? contract.title,
    supplierName: body.supplierName ?? contract.supplierName,
    managerName: body.managerName ?? contract.managerName,
    status: body.status ?? contract.status,
    endsAt: body.endsAt ?? contract.endsAt,
  });
  await repo.save(contract);
  return res.json(contract);
}));

// ── Platform Stats ────────────────────────────────────────────────────────────
adminRouter.get("/stats", requirePermission(PERMISSIONS.ADMIN_USERS_READ), asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    activeUsers,
    pendingOnboarding,
    totalAgencies,
    activeAgencies,
    totalAuctions,
    openAuctions,
    totalContracts,
  ] = await Promise.all([
    AppDataSource.getRepository(User).count(),
    AppDataSource.getRepository(User).count({ where: { active: true } }),
    AppDataSource.getRepository(User).count({ where: { onboardingStatus: OnboardingStatus.PENDING } }),
    AppDataSource.getRepository(Agency).count(),
    AppDataSource.getRepository(Agency).count({ where: { active: true } }),
    AppDataSource.getRepository(Auction).count(),
    AppDataSource.getRepository(Auction).count({ where: { status: "OPEN" } }),
    AppDataSource.getRepository(Contract).count(),
  ]);

  return res.json({ totalUsers, activeUsers, pendingOnboarding, totalAgencies, activeAgencies, totalAuctions, openAuctions, totalContracts });
}));

// ── RBAC ─────────────────────────────────────────────────────────────────────
adminRouter.get("/permissions", requirePermission(PERMISSIONS.ADMIN_PERMISSIONS_READ), asyncHandler(async (_req, res) => {
  const permissions = await AppDataSource.getRepository(Permission).find({ order: { key: "ASC" } });
  return res.json({ permissions });
}));

adminRouter.post("/permissions", requirePermission(PERMISSIONS.ADMIN_PERMISSIONS_WRITE), asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.key) return res.status(400).json({ error: "KEY_REQUIRED" });
  const existing = await AppDataSource.getRepository(Permission).findOne({ where: { key: body.key } });
  if (existing) return res.status(409).json({ error: "KEY_TAKEN" });
  const perm = AppDataSource.getRepository(Permission).create({ key: body.key, description: body.description ?? null });
  await AppDataSource.getRepository(Permission).save(perm);
  return res.status(201).json(perm);
}));

adminRouter.get("/roles", requirePermission(PERMISSIONS.ADMIN_ROLES_READ), asyncHandler(async (_req, res) => {
  const roles = await AppDataSource.getRepository(Role).find({ relations: ["permissions"], order: { key: "ASC" } });
  return res.json({ roles });
}));

adminRouter.post("/roles", requirePermission(PERMISSIONS.ADMIN_ROLES_WRITE), asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.key || !body.name) return res.status(400).json({ error: "MISSING_FIELDS" });
  const existing = await AppDataSource.getRepository(Role).findOne({ where: { key: body.key } });
  if (existing) return res.status(409).json({ error: "KEY_TAKEN" });
  const role = AppDataSource.getRepository(Role).create({ key: body.key, name: body.name, description: body.description ?? null, permissions: [] });
  await AppDataSource.getRepository(Role).save(role);
  return res.status(201).json(role);
}));

adminRouter.put("/roles/:key/permissions", requirePermission(PERMISSIONS.ADMIN_ROLES_WRITE), asyncHandler(async (req, res) => {
  const { key } = req.params;
  const body = req.body ?? {};
  const permKeys: string[] = Array.isArray(body.permissions) ? body.permissions : [];
  const roleRepo = AppDataSource.getRepository(Role);
  const permRepo = AppDataSource.getRepository(Permission);
  const role = await roleRepo.findOne({ where: { key }, relations: ["permissions"] });
  if (!role) return res.status(404).json({ error: "ROLE_NOT_FOUND" });
  const perms = await Promise.all(permKeys.map((k) => permRepo.findOne({ where: { key: k } })));
  role.permissions = perms.filter(Boolean) as Permission[];
  await roleRepo.save(role);
  return res.json(role);
}));

// ── Notifications ─────────────────────────────────────────────────────────────

adminRouter.get("/notifications", requirePermission(PERMISSIONS.ADMIN_USERS_READ), asyncHandler(async (_req, res) => {
  const rows = await AppDataSource.query(`
    SELECT
      n.id, n.title, n.message, n.category,
      n."targetRole", n."targetUserId", n."sentByUserId", n."createdAt",
      tu.name  AS "targetUserName",
      tu.email AS "targetUserEmail",
      COALESCE(rc.total, 0)::int   AS "replyCount",
      COALESCE(rc.unread, 0)::int  AS "unreadReplyCount"
    FROM notifications n
    LEFT JOIN users tu ON tu.id = n."targetUserId"
    LEFT JOIN (
      SELECT "notificationId",
        COUNT(*)                                               AS total,
        COUNT(*) FILTER (WHERE "readByAdminAt" IS NULL)       AS unread
      FROM notification_replies
      GROUP BY "notificationId"
    ) rc ON rc."notificationId" = n.id
    ORDER BY n."createdAt" DESC
    LIMIT 100
  `);
  return res.json({ notifications: rows });
}));

adminRouter.get("/notifications/users/search", requirePermission(PERMISSIONS.ADMIN_USERS_READ), asyncHandler(async (req, res) => {
  const q = typeof req.query["q"] === "string" ? req.query["q"].trim() : "";
  if (q.length < 2) return res.json({ users: [] });
  const users = await AppDataSource.getRepository(User)
    .createQueryBuilder("u")
    .where("u.active = true")
    .andWhere("(u.name ILIKE :q OR u.email ILIKE :q OR u.cpfNormalized ILIKE :q)", { q: `%${q}%` })
    .select(["u.id", "u.name", "u.email", "u.role"])
    .orderBy("u.name", "ASC")
    .take(15)
    .getMany();
  return res.json({ users });
}));

adminRouter.post("/notifications", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  if (!body.title || !body.message) return res.status(400).json({ error: "MISSING_FIELDS" });

  const allowed = ["FINANCEIRO", "SEGURANCA", "PREGAO", "DOCUMENTOS", "GERAL"];
  const category = allowed.includes(body.category) ? body.category : "GERAL";

  // If targeting a specific user, set targetRole = "USER" as sentinel
  const targetUserId: string | null = typeof body.targetUserId === "string" && body.targetUserId ? body.targetUserId : null;
  const validRoles = ["ALL", "CITIZEN", "SUPPLIER", "AGENCY_ADMIN", "AUCTIONEER", "SUPPORT"];
  const targetRole = targetUserId ? "USER" : (validRoles.includes(body.targetRole) ? body.targetRole : "ALL");

  if (targetUserId) {
    const exists = await AppDataSource.getRepository(User).findOne({ where: { id: targetUserId } });
    if (!exists) return res.status(404).json({ error: "TARGET_USER_NOT_FOUND" });
  }

  const n = AppDataSource.getRepository(Notification).create({
    title: body.title,
    message: body.message,
    category,
    targetRole,
    targetUserId,
    sentByUserId: req.auth?.userId ?? null,
  });
  await AppDataSource.getRepository(Notification).save(n);
  return res.status(201).json(n);
}));

adminRouter.delete("/notifications/:id", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const repo = AppDataSource.getRepository(Notification);
  const n = await repo.findOne({ where: { id } });
  if (!n) return res.status(404).json({ error: "NOT_FOUND" });
  await repo.remove(n);
  return res.json({ ok: true });
}));

// ── Notification Replies (admin) ──────────────────────────────────────────────

adminRouter.get("/notifications/:id/replies", requirePermission(PERMISSIONS.ADMIN_USERS_READ), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const replies = await AppDataSource.query(`
    SELECT
      r.id, r."notificationId", r."userId", r.message,
      r."readByAdminAt", r."createdAt",
      u.name  AS "userName",
      u.email AS "userEmail",
      u.role  AS "userRole"
    FROM notification_replies r
    JOIN users u ON u.id = r."userId"
    WHERE r."notificationId" = $1
    ORDER BY r."createdAt" ASC
  `, [id]);
  return res.json({ replies });
}));

// All replies across all notifications (inbox view)
adminRouter.get("/notification-replies", requirePermission(PERMISSIONS.ADMIN_USERS_READ), asyncHandler(async (_req, res) => {
  const replies = await AppDataSource.query(`
    SELECT
      r.id, r."notificationId", r."userId", r.message,
      r."readByAdminAt", r."createdAt",
      u.name  AS "userName",
      u.email AS "userEmail",
      u.role  AS "userRole",
      n.title AS "notificationTitle",
      n.category AS "notificationCategory"
    FROM notification_replies r
    JOIN users u ON u.id = r."userId"
    JOIN notifications n ON n.id = r."notificationId"
    ORDER BY r."createdAt" DESC
    LIMIT 200
  `);
  return res.json({ replies });
}));

adminRouter.patch("/notification-replies/:replyId/read", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  const repo = AppDataSource.getRepository(NotificationReply);
  const reply = await repo.findOne({ where: { id: replyId } });
  if (!reply) return res.status(404).json({ error: "NOT_FOUND" });
  reply.readByAdminAt = reply.readByAdminAt ?? new Date();
  await repo.save(reply);
  return res.json({ ok: true });
}));

adminRouter.patch("/notification-replies/:replyId/unread", requirePermission(PERMISSIONS.ADMIN_USERS_WRITE), asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  const repo = AppDataSource.getRepository(NotificationReply);
  const reply = await repo.findOne({ where: { id: replyId } });
  if (!reply) return res.status(404).json({ error: "NOT_FOUND" });
  reply.readByAdminAt = null;
  await repo.save(reply);
  return res.json({ ok: true });
}));
