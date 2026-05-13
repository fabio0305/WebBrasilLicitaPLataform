import { createHash, randomBytes } from "crypto";
import { PasswordRecoveryRequestStatus } from "../entities/PasswordRecoveryRequest";

export function generateRecoveryToken(): { token: string; hash: string } {
  const token = randomBytes(24).toString("base64url");
  const hash = hashRecoveryToken(token);
  return { token, hash };
}

export function hashRecoveryToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildPasswordRecoveryLink(baseUrl: string, token: string): string {
  return `${baseUrl}/recuperar-senha?token=${encodeURIComponent(token)}`;
}

export function isDeliverableRecoveryEmail(email: string): boolean {
  return !email.endsWith("@invalid.local");
}

export function resolveRecoveryStatus(
  status: string,
  tokenExpiresAt: Date | null
): string {
  if (tokenExpiresAt && tokenExpiresAt.getTime() < Date.now()) {
    return PasswordRecoveryRequestStatus.EXPIRED;
  }
  return status;
}

const OPEN_STATUSES = new Set([
  PasswordRecoveryRequestStatus.REQUESTED,
  PasswordRecoveryRequestStatus.LINK_READY,
  PasswordRecoveryRequestStatus.EMAIL_SENT,
  PasswordRecoveryRequestStatus.COMPLETED,
]);

export function isRecoveryRequestOpen(status: string): boolean {
  return OPEN_STATUSES.has(status as PasswordRecoveryRequestStatus) &&
    status !== PasswordRecoveryRequestStatus.COMPLETED;
}

export function getPasswordRecoveryChannelLabel(channel: string | null): string {
  if (channel === "EMAIL") return "email";
  if (channel === "MANUAL_LINK") return "link-manual";
  return "interno";
}
