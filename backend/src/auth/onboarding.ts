import { UserRole } from "../entities/User";

export const SELF_SERVICE_ROLES = new Set<string>([UserRole.SUPPLIER]);
export const APPROVAL_ROLES = new Set<string>([
  UserRole.CITIZEN,
  UserRole.PUBLIC_AGENCY, UserRole.AGENCY_ADMIN, UserRole.AUCTIONEER,
  UserRole.AUTHORITY, UserRole.SUPPORT, UserRole.ADMIN,
]);
export const AGENCY_CONTEXT_ROLES = new Set<string>([
  UserRole.PUBLIC_AGENCY, UserRole.AGENCY_ADMIN, UserRole.AUCTIONEER,
  UserRole.AUTHORITY, UserRole.SUPPORT,
]);

export function roleRequiresAgencyContext(role: string) { return AGENCY_CONTEXT_ROLES.has(role); }
export function roleRequiresApproval(role: string) { return APPROVAL_ROLES.has(role); }
export function isSupportedOnboardingRole(role: string) {
  return SELF_SERVICE_ROLES.has(role) || APPROVAL_ROLES.has(role);
}
