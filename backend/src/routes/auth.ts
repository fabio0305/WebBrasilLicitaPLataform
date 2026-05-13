import { Router } from "express";
import { randomInt } from "crypto";
import { AppDataSource } from "../data-source";
import { SupplierProfile } from "../entities/SupplierProfile";
import { User, UserRole, OnboardingStatus } from "../entities/User";
import { createSession, deleteSession, deleteAllSessionsForUser } from "../auth/sessions";
import { getCookie } from "../auth/cookies";
import { getSession } from "../auth/sessions";
import { requireAuth } from "../middlewares/auth";
import { serializeAuthUser } from "../auth/serializeAuthUser";
import { hashPassword, verifyPassword } from "../auth/password";
import { isStrongPassword, PASSWORD_POLICY_MESSAGE } from "../utils/passwordPolicy";
import { normalizeCpf, isValidCpf, buildSyntheticEmailForCpf } from "../utils/cpf";
import { normalizeCnpj, isValidCnpj } from "../utils/cnpj";
import { normalizePhone, isValidPhone } from "../utils/phone";
import { asyncHandler } from "../utils/asyncHandler";
import {
  roleRequiresApproval,
  isSupportedOnboardingRole,
} from "../auth/onboarding";
import {
  generateRecoveryToken,
  hashRecoveryToken,
  buildPasswordRecoveryLink,
  resolveRecoveryStatus,
  isRecoveryRequestOpen,
  isDeliverableRecoveryEmail,
} from "../utils/passwordRecovery";
import { PasswordRecoveryRequest, PasswordRecoveryRequestStatus, PasswordRecoveryDeliveryChannel } from "../entities/PasswordRecoveryRequest";
import {
  sendPasswordRecoveryEmail,
  sendEmailVerificationCode,
  sendNewUserRegistrationNotification,
  sendRegistrationConfirmationToUser,
} from "../notifications/mailer";
import { env } from "../config/env";
import { getSessionRedis } from "../auth/session-store";

export const authRouter = Router();

const VALID_BR_STATES = new Set([
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
]);

function normalizeEmail(s: string) { return s.trim().toLowerCase(); }

// ── GET /api/auth/me ────────────────────────────────────────────────────────
authRouter.get("/me", requireAuth, asyncHandler(async (req, res) => {
  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo.findOne({ where: { id: req.auth!.userId } });
  if (!user || !user.active) return res.status(401).json({ error: "UNAUTHENTICATED" });
  return res.json(await serializeAuthUser(user));
}));

// ── POST /api/auth/login ────────────────────────────────────────────────────
authRouter.post("/login", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!identifier || !password) return res.status(400).json({ error: "MISSING_FIELDS" });

  const userRepo = AppDataSource.getRepository(User);

  let user: User | null = null;
  const normalized = normalizeCpf(identifier);
  if (/^\d{11}$/.test(normalized)) {
    user = await userRepo
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.cpfNormalized = :cpf", { cpf: normalized })
      .getOne();
  } else {
    user = await userRepo
      .createQueryBuilder("u")
      .addSelect("u.passwordHash")
      .where("u.email = :email", { email: normalizeEmail(identifier) })
      .getOne();
  }

  if (!user || !user.active) return res.status(401).json({ error: "INVALID_CREDENTIALS" });
  if (!user.passwordHash) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "INVALID_CREDENTIALS" });

  if (user.onboardingStatus === OnboardingStatus.PENDING) {
    return res.status(403).json({ error: "ACCOUNT_PENDING_APPROVAL" });
  }
  if (user.onboardingStatus === OnboardingStatus.REJECTED) {
    return res.status(403).json({ error: "ACCOUNT_REJECTED" });
  }

  const sid = await createSession(user.id);
  res.cookie(env.session.cookieName, sid, {
    httpOnly: true,
    secure: env.session.secure,
    sameSite: "lax",
    maxAge: env.session.ttlSeconds * 1000,
  });
  return res.json(await serializeAuthUser(user));
}));

// ── POST /api/auth/logout ───────────────────────────────────────────────────
authRouter.post("/logout", asyncHandler(async (req, res) => {
  const sid = getCookie(req, env.session.cookieName);
  if (sid) await deleteSession(sid);
  res.clearCookie(env.session.cookieName);
  return res.json({ ok: true });
}));

// ── Email verification helpers ───────────────────────────────────────────────

const EMAIL_VERIFY_TTL = 300;          // 5 minutes
const EMAIL_VERIFIED_TTL = 900;        // 15 min window to finish registration
const MAX_VERIFY_ATTEMPTS = 5;

function evKey(email: string)      { return `ev:${email}`; }
function evDoneKey(email: string)  { return `ev_ok:${email}`; }

// ── POST /api/auth/email-verify/send ─────────────────────────────────────────
authRouter.post("/email-verify/send", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "EMAIL_INVALID" });
  }

  const userRepo = AppDataSource.getRepository(User);
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) return res.status(409).json({ error: "EMAIL_TAKEN" });

  const code = String(randomInt(100000, 1000000));
  const redis = await getSessionRedis();
  await redis.set(evKey(email), JSON.stringify({ code, attempts: 0 }), { EX: EMAIL_VERIFY_TTL });

  const sent = await sendEmailVerificationCode({ to: email, code });

  // Expose devCode only in non-production environments using Mailpit (local mail catcher).
  // Never expose the code when NODE_ENV=production, even if delivery fails.
  const usingMailpit = env.smtp.host === "mailpit";
  const isDevMode = env.nodeEnv !== "production";
  const exposeDevCode = isDevMode && usingMailpit;

  return res.json({
    ok: true,
    expiresIn: EMAIL_VERIFY_TTL,
    ...(exposeDevCode ? { devCode: code } : {}),
    emailSent: sent,
  });
}));

// ── POST /api/auth/email-verify/check ────────────────────────────────────────
authRouter.post("/email-verify/check", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const code  = typeof body.code  === "string" ? body.code.trim() : "";

  const redis = await getSessionRedis();
  const raw = await redis.get(evKey(email));
  if (!raw) return res.status(410).json({ error: "CODE_EXPIRED" });

  let entry: { code: string; attempts: number };
  try { entry = JSON.parse(raw); } catch { return res.status(500).json({ error: "ERROR" }); }

  if (entry.attempts >= MAX_VERIFY_ATTEMPTS) {
    await redis.del(evKey(email));
    return res.status(429).json({ error: "TOO_MANY_ATTEMPTS" });
  }

  if (entry.code !== code) {
    entry.attempts += 1;
    const ttl = await redis.ttl(evKey(email));
    await redis.set(evKey(email), JSON.stringify(entry), { EX: ttl > 0 ? ttl : EMAIL_VERIFY_TTL });
    const remaining = MAX_VERIFY_ATTEMPTS - entry.attempts;
    return res.status(400).json({ error: "CODE_INVALID", attemptsLeft: remaining });
  }

  await redis.del(evKey(email));
  await redis.set(evDoneKey(email), "1", { EX: EMAIL_VERIFIED_TTL });
  return res.json({ ok: true });
}));

// ── POST /api/auth/register/citizen/validate ────────────────────────────────
authRouter.post("/register/citizen/validate", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const cpf = typeof body.cpf === "string" ? normalizeCpf(body.cpf) : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";

  const errors: Record<string, string> = {};
  if (!isValidCpf(cpf)) errors.cpf = "CPF_INVALID";

  const userRepo = AppDataSource.getRepository(User);
  if (isValidCpf(cpf)) {
    const existing = await userRepo.findOne({ where: { cpfNormalized: cpf } });
    if (existing) errors.cpf = "CPF_TAKEN";
  }
  if (email) {
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) errors.email = "EMAIL_TAKEN";
  }

  if (Object.keys(errors).length > 0) return res.status(422).json({ errors });
  return res.json({ ok: true });
}));

// ── POST /api/auth/register/citizen ─────────────────────────────────────────
authRouter.post("/register/citizen", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const cpf = typeof body.cpf === "string" ? normalizeCpf(body.cpf) : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  const errors: Record<string, string> = {};
  if (!isValidCpf(cpf)) errors.cpf = "CPF_INVALID";
  if (name.length < 3) errors.name = "NAME_TOO_SHORT";
  if (!isValidPhone(phone)) errors.phone = "PHONE_INVALID";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "EMAIL_INVALID";
  if (!isStrongPassword(password)) errors.password = PASSWORD_POLICY_MESSAGE;

  if (Object.keys(errors).length > 0) return res.status(422).json({ errors });

  // Require e-mail to have been verified via /email-verify/send + /email-verify/check
  const redis = await getSessionRedis();
  const verified = await redis.get(evDoneKey(email));
  if (!verified) return res.status(403).json({ error: "EMAIL_NOT_VERIFIED" });

  const userRepo = AppDataSource.getRepository(User);

  const existingCpf = await userRepo.findOne({ where: { cpfNormalized: cpf } });
  if (existingCpf) return res.status(409).json({ error: "CPF_TAKEN" });
  const existingEmail = await userRepo.findOne({ where: { email } });
  if (existingEmail) return res.status(409).json({ error: "EMAIL_TAKEN" });

  const passwordHash = await hashPassword(password);
  const user = userRepo.create({
    email,
    name,
    phone,
    cpfNormalized: cpf,
    passwordHash,
    role: UserRole.CITIZEN,
    onboardingStatus: OnboardingStatus.PENDING,
    active: true,
    agreedToTermsAt: new Date(),
    agreedToPrivacyAt: new Date(),
  });
  await userRepo.save(user);

  // Consume the verified flag
  await redis.del(evDoneKey(email));

  // Send notifications (fire-and-forget — never block the response)
  sendNewUserRegistrationNotification({
    adminEmail: "administrador@licitabrasilweb.com.br",
    userName: user.name,
    userEmail: user.email,
    userCpf: user.cpfNormalized ?? undefined,
    registeredAt: user.createdAt,
  }).catch(() => {});

  sendRegistrationConfirmationToUser({
    to: user.email,
    userName: user.name,
  }).catch(() => {});

  // Do not auto-login: account requires admin approval before first access
  return res.status(201).json({ ok: true, pendingApproval: true });
}));

// ── GET /api/auth/register/supplier/cnpj/:cnpj ──────────────────────────────
authRouter.get("/register/supplier/cnpj/:cnpj", asyncHandler(async (req, res) => {
  const cnpj = normalizeCnpj(req.params.cnpj ?? "");
  if (!isValidCnpj(cnpj)) return res.status(400).json({ error: "CNPJ_INVALID" });

  try {
    const r = await fetch(`https://minhareceita.org/${cnpj}`);
    if (!r.ok) return res.status(404).json({ error: "CNPJ_NOT_FOUND" });
    const data = await r.json() as Record<string, unknown>;
    return res.json({
      cnpj,
      companyName: data.razao_social ?? null,
      tradeName: data.nome_fantasia ?? null,
      situation: data.descricao_situacao_cadastral ?? null,
    });
  } catch {
    return res.status(502).json({ error: "CNPJ_LOOKUP_FAILED" });
  }
}));

// ── POST /api/auth/register ──────────────────────────────────────────────────
// Unified registration: SUPPLIER or PUBLIC_AGENCY roles
authRouter.post("/register", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const requestedRole = typeof body.role === "string" ? body.role.toUpperCase() : "";

  if (!isSupportedOnboardingRole(requestedRole)) {
    return res.status(400).json({ error: "UNSUPPORTED_ROLE" });
  }

  const errors: Record<string, string> = {};
  const cpf = typeof body.cpf === "string" ? normalizeCpf(body.cpf) : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";
  const phone = typeof body.phone === "string" ? normalizePhone(body.phone) : "";

  if (!isValidCpf(cpf)) errors.cpf = "CPF_INVALID";
  if (name.length < 3) errors.name = "NAME_TOO_SHORT";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "EMAIL_INVALID";
  if (!isStrongPassword(password)) errors.password = PASSWORD_POLICY_MESSAGE;

  if (requestedRole === UserRole.SUPPLIER) {
    const cnpj = typeof body.cnpj === "string" ? normalizeCnpj(body.cnpj) : "";
    if (!isValidCnpj(cnpj)) errors.cnpj = "CNPJ_INVALID";

    const addressState = typeof body.addressState === "string" ? body.addressState.toUpperCase() : "";
    if (!VALID_BR_STATES.has(addressState)) errors.addressState = "STATE_INVALID";

    const postalCode = typeof body.addressPostalCode === "string" ? body.addressPostalCode.replace(/\D/g, "") : "";
    if (postalCode.length !== 8) errors.addressPostalCode = "POSTAL_CODE_INVALID";
  }

  if (Object.keys(errors).length > 0) return res.status(422).json({ errors });

  const userRepo = AppDataSource.getRepository(User);
  const supplierRepo = AppDataSource.getRepository(SupplierProfile);

  const existingCpf = await userRepo.findOne({ where: { cpfNormalized: cpf } });
  if (existingCpf) return res.status(409).json({ error: "CPF_TAKEN" });
  const existingEmail = await userRepo.findOne({ where: { email } });
  if (existingEmail) return res.status(409).json({ error: "EMAIL_TAKEN" });

  const requiresApproval = roleRequiresApproval(requestedRole);
  const passwordHash = await hashPassword(password);

  const user = userRepo.create({
    email,
    name,
    phone: phone || undefined,
    cpfNormalized: cpf,
    passwordHash,
    role: requiresApproval ? UserRole.CITIZEN : requestedRole,
    requestedRole: requiresApproval ? requestedRole : undefined,
    onboardingStatus: requiresApproval ? OnboardingStatus.PENDING : OnboardingStatus.APPROVED,
    active: true,
    agreedToTermsAt: new Date(),
    agreedToPrivacyAt: new Date(),
  });
  await userRepo.save(user);

  // Create SupplierProfile for SUPPLIER registrations
  if (requestedRole === UserRole.SUPPLIER) {
    const cnpj = normalizeCnpj(body.cnpj ?? "");
    const sp = supplierRepo.create({
      userId: user.id,
      cnpj,
      stateRegistration: body.stateRegistration ?? null,
      taxRegime: body.taxRegime ?? null,
      supplierEntityType: body.supplierEntityType ?? null,
      companyName: body.companyName ?? null,
      tradeName: body.tradeName ?? null,
      supplierEmail: body.supplierEmail ?? null,
      isMei: body.taxRegime === "MEI",
      meiBirthDate: body.meiBirthDate ?? null,
      meiEducationLevel: body.meiEducationLevel ?? null,
      meiProfession: body.meiProfession ?? null,
      addressPostalCode: body.addressPostalCode ? body.addressPostalCode.replace(/\D/g, "") : null,
      addressStreet: body.addressStreet ?? null,
      addressNumber: body.addressNumber ?? null,
      addressComplement: body.addressComplement ?? null,
      addressNeighborhood: body.addressNeighborhood ?? null,
      addressCity: body.addressCity ?? null,
      addressState: body.addressState ? body.addressState.toUpperCase() : null,
      bankName: body.bankName ?? null,
      bankBranch: body.bankBranch ?? null,
      bankAccount: body.bankAccount ?? null,
      bankAccountType: body.bankAccountType ?? null,
      pixKey: body.pixKey ?? null,
      legalRepName: body.legalRepName ?? null,
      legalRepCpf: body.legalRepCpf ? normalizeCpf(body.legalRepCpf) : null,
      legalRepEmail: body.legalRepEmail ? normalizeEmail(body.legalRepEmail) : null,
      legalRepPhone: body.legalRepPhone ? normalizePhone(body.legalRepPhone) : null,
      segments: Array.isArray(body.segments) ? body.segments : null,
      cnbsClasses: Array.isArray(body.cnbsClasses) ? body.cnbsClasses : null,
      requiredDocumentTemplates: Array.isArray(body.requiredDocumentTemplates)
        ? body.requiredDocumentTemplates
        : null,
      financeContactName: body.financeContactName ?? null,
      financeContactEmail: body.financeContactEmail ? normalizeEmail(body.financeContactEmail) : null,
      financeContactPhone: body.financeContactPhone ? normalizePhone(body.financeContactPhone) : null,
    });
    await supplierRepo.save(sp);
  }

  if (requiresApproval) {
    sendNewUserRegistrationNotification({
      adminEmail: "administrador@licitabrasilweb.com.br",
      userName: user.name,
      userEmail: user.email,
      userCpf: user.cpfNormalized ?? undefined,
      registeredAt: user.createdAt,
    }).catch(() => {});
    sendRegistrationConfirmationToUser({
      to: user.email,
      userName: user.name,
    }).catch(() => {});
    return res.status(201).json({ ok: true, pendingApproval: true });
  }

  const sid = await createSession(user.id);
  res.cookie(env.session.cookieName, sid, {
    httpOnly: true,
    secure: env.session.secure,
    sameSite: "lax",
    maxAge: env.session.ttlSeconds * 1000,
  });
  return res.status(201).json(await serializeAuthUser(user));
}));

// ── POST /api/auth/password-recovery ────────────────────────────────────────
authRouter.post("/password-recovery", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const cpf = typeof body.cpf === "string" ? normalizeCpf(body.cpf) : "";
  if (!isValidCpf(cpf)) return res.status(400).json({ error: "CPF_INVALID" });

  const userRepo = AppDataSource.getRepository(User);
  const recoveryRepo = AppDataSource.getRepository(PasswordRecoveryRequest);

  const user = await userRepo.findOne({ where: { cpfNormalized: cpf, active: true } });
  if (!user) return res.json({ ok: true }); // Don't reveal existence

  const { token, hash } = generateRecoveryToken();
  const expiresAt = new Date(Date.now() + env.passwordRecovery.tokenTtlSeconds * 1000);

  const request = recoveryRepo.create({
    cpfNormalized: cpf,
    userId: user.id,
    status: PasswordRecoveryRequestStatus.REQUESTED,
    recoveryTokenHash: hash,
    tokenExpiresAt: expiresAt,
    deliveryChannel: isDeliverableRecoveryEmail(user.email)
      ? PasswordRecoveryDeliveryChannel.EMAIL
      : PasswordRecoveryDeliveryChannel.INTERNAL,
  });
  await recoveryRepo.save(request);

  if (isDeliverableRecoveryEmail(user.email)) {
    const link = buildPasswordRecoveryLink(env.app.publicUrl, token);
    const sent = await sendPasswordRecoveryEmail({
      to: user.email,
      cpfNormalized: cpf,
      link,
      expiresAt,
    });
    if (sent) {
      await recoveryRepo.update(request.id, {
        status: PasswordRecoveryRequestStatus.EMAIL_SENT,
      });
    }
  }

  return res.json({ ok: true, requestId: request.id });
}));

// ── POST /api/auth/password-recovery/verify-token ───────────────────────────
authRouter.post("/password-recovery/verify-token", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const token = typeof body.token === "string" ? body.token.trim() : "";
  if (!token) return res.status(400).json({ error: "MISSING_TOKEN" });

  const hash = hashRecoveryToken(token);
  const recoveryRepo = AppDataSource.getRepository(PasswordRecoveryRequest);
  const request = await recoveryRepo
    .createQueryBuilder("r")
    .addSelect("r.recoveryTokenHash")
    .where("r.recoveryTokenHash = :hash", { hash })
    .getOne();

  if (!request) return res.status(404).json({ error: "TOKEN_NOT_FOUND" });

  const status = resolveRecoveryStatus(request.status, request.tokenExpiresAt ?? null);
  if (!isRecoveryRequestOpen(status)) return res.status(410).json({ error: "TOKEN_EXPIRED_OR_USED" });

  return res.json({ ok: true, requestId: request.id });
}));

// ── POST /api/auth/password-recovery/reset ──────────────────────────────────
authRouter.post("/password-recovery/reset", asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const token = typeof body.token === "string" ? body.token.trim() : "";
  const newPassword = typeof body.password === "string" ? body.password : "";

  if (!token || !newPassword) return res.status(400).json({ error: "MISSING_FIELDS" });
  if (!isStrongPassword(newPassword)) return res.status(422).json({ error: PASSWORD_POLICY_MESSAGE });

  const hash = hashRecoveryToken(token);
  const recoveryRepo = AppDataSource.getRepository(PasswordRecoveryRequest);
  const request = await recoveryRepo
    .createQueryBuilder("r")
    .addSelect("r.recoveryTokenHash")
    .where("r.recoveryTokenHash = :hash", { hash })
    .getOne();

  if (!request) return res.status(404).json({ error: "TOKEN_NOT_FOUND" });

  const status = resolveRecoveryStatus(request.status, request.tokenExpiresAt ?? null);
  if (!isRecoveryRequestOpen(status)) return res.status(410).json({ error: "TOKEN_EXPIRED_OR_USED" });
  if (!request.userId) return res.status(400).json({ error: "NO_USER_LINKED" });

  const userRepo = AppDataSource.getRepository(User);
  const passwordHash = await hashPassword(newPassword);
  await userRepo.update(request.userId, { passwordHash, mustChangePassword: false });
  await recoveryRepo.update(request.id, {
    status: PasswordRecoveryRequestStatus.COMPLETED,
    resolvedByUserId: request.userId,
  });
  await deleteAllSessionsForUser(request.userId);

  return res.json({ ok: true });
}));

// ── POST /api/auth/password/change ───────────────────────────────────────────
authRouter.post("/password/change", requireAuth, asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!currentPassword || !newPassword) return res.status(400).json({ error: "MISSING_FIELDS" });
  if (!isStrongPassword(newPassword)) return res.status(422).json({ error: PASSWORD_POLICY_MESSAGE });

  const userRepo = AppDataSource.getRepository(User);
  const user = await userRepo
    .createQueryBuilder("u")
    .addSelect("u.passwordHash")
    .where("u.id = :id", { id: req.auth!.userId })
    .getOne();

  if (!user || !user.passwordHash) return res.status(401).json({ error: "UNAUTHENTICATED" });

  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "WRONG_PASSWORD" });

  const passwordHash = await hashPassword(newPassword);
  await userRepo.update(user.id, { passwordHash, mustChangePassword: false });

  // Invalidate all sessions except the current one
  const currentSid = getCookie(req, env.session.cookieName);
  await deleteAllSessionsForUser(user.id);
  if (currentSid) {
    const newSid = await createSession(user.id);
    res.cookie(env.session.cookieName, newSid, {
      httpOnly: true,
      secure: env.session.secure,
      sameSite: "lax",
      maxAge: env.session.ttlSeconds * 1000,
    });
  }

  return res.json({ ok: true });
}));
