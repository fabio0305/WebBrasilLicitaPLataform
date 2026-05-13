import { AppDataSource } from "../data-source";
import { Agency } from "../entities/Agency";
import { SupplierProfile } from "../entities/SupplierProfile";
import { User, UserRole } from "../entities/User";
import { PERMISSIONS } from "../rbac/permissions";
import { getPermissionsForRole } from "../middlewares/rbac";

export async function serializeAuthUser(user: User) {
  const roleKeys = new Set([user.role]);
  if (user.requestedRole) roleKeys.add(user.requestedRole);

  const permissionSets = await Promise.all(
    Array.from(roleKeys).map((roleKey) => getPermissionsForRole(roleKey))
  );
  let permissions = Array.from(
    new Set(permissionSets.flatMap((s) => Array.from(s)))
  ).sort();

  if (permissions.length === 0 && user.role === UserRole.ADMIN) {
    permissions = Object.values(PERMISSIONS);
  }

  let agency: Agency | null = null;
  if (user.agencyId) {
    agency = await AppDataSource.getRepository(Agency).findOne({
      where: { id: user.agencyId },
    });
  }

  const isSupplierRole =
    user.role === UserRole.SUPPLIER || user.requestedRole === UserRole.SUPPLIER;

  let supplierProfile: SupplierProfile | null = null;
  if (isSupplierRole) {
    supplierProfile = await AppDataSource.getRepository(SupplierProfile).findOne({
      where: { userId: user.id },
    });
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone ?? null,
    cpfNormalized: user.cpfNormalized ?? null,
    authProvider: user.authProvider,
    govBrLevel: user.govBrLevel ?? null,
    mustChangePassword: user.mustChangePassword,
    role: user.role,
    requestedRole: user.requestedRole ?? null,
    onboardingStatus: user.onboardingStatus,
    agencyId: user.agencyId ?? null,
    organAccessProfiles: user.organAccessProfiles ?? [],
    agreedToTermsAt: user.agreedToTermsAt ?? null,
    agreedToPrivacyAt: user.agreedToPrivacyAt ?? null,
    permissions,
    agency: agency
      ? {
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
        }
      : null,
    supplierProfile: supplierProfile
      ? {
          id: supplierProfile.id,
          cnpj: supplierProfile.cnpj ?? null,
          stateRegistration: supplierProfile.stateRegistration ?? null,
          taxRegime: supplierProfile.taxRegime ?? null,
          supplierEntityType: supplierProfile.supplierEntityType ?? null,
          companyName: supplierProfile.companyName ?? null,
          tradeName: supplierProfile.tradeName ?? null,
          supplierEmail: supplierProfile.supplierEmail ?? null,
          isMei: supplierProfile.isMei,
          meiBirthDate: supplierProfile.meiBirthDate ?? null,
          meiEducationLevel: supplierProfile.meiEducationLevel ?? null,
          meiProfession: supplierProfile.meiProfession ?? null,
          address: {
            postalCode: supplierProfile.addressPostalCode ?? null,
            street: supplierProfile.addressStreet ?? null,
            number: supplierProfile.addressNumber ?? null,
            complement: supplierProfile.addressComplement ?? null,
            neighborhood: supplierProfile.addressNeighborhood ?? null,
            city: supplierProfile.addressCity ?? null,
            state: supplierProfile.addressState ?? null,
          },
          bankName: supplierProfile.bankName ?? null,
          bankBranch: supplierProfile.bankBranch ?? null,
          bankAccount: supplierProfile.bankAccount ?? null,
          bankAccountType: supplierProfile.bankAccountType ?? null,
          pixKey: supplierProfile.pixKey ?? null,
          legalRepName: supplierProfile.legalRepName ?? null,
          legalRepCpf: supplierProfile.legalRepCpf ?? null,
          legalRepEmail: supplierProfile.legalRepEmail ?? null,
          legalRepPhone: supplierProfile.legalRepPhone ?? null,
          segments: supplierProfile.segments ?? [],
          cnbsClasses: supplierProfile.cnbsClasses ?? [],
          requiredDocumentTemplates: supplierProfile.requiredDocumentTemplates ?? [],
          financeContactName: supplierProfile.financeContactName ?? null,
          financeContactEmail: supplierProfile.financeContactEmail ?? null,
          financeContactPhone: supplierProfile.financeContactPhone ?? null,
          linkedCitizenUserId: supplierProfile.linkedCitizenUserId ?? null,
        }
      : null,
  };
}
