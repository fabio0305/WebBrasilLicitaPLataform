import { AppDataSource } from "../data-source";
import { Permission } from "../entities/Permission";
import { Role } from "../entities/Role";
import { PERMISSIONS } from "./permissions";

const DEFAULT_ROLES = [
  { key: "ADMIN", name: "Administrador", system: true },
  { key: "AGENCY_ADMIN", name: "Administrador de Órgão", system: true },
  { key: "AUCTIONEER", name: "Pregoeiro", system: true },
  { key: "AUTHORITY", name: "Autoridade Competente", system: true },
  { key: "PUBLIC_AGENCY", name: "Órgão Público", system: true },
  { key: "SUPPORT", name: "Suporte", system: true },
  { key: "SUPPLIER", name: "Fornecedor", system: true },
  { key: "CITIZEN", name: "Cidadão", system: true },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: Object.values(PERMISSIONS),
  AGENCY_ADMIN: [
    PERMISSIONS.AUCTIONS_READ, PERMISSIONS.AUCTIONS_WRITE,
    PERMISSIONS.AGENCIES_DASHBOARD_READ,
    PERMISSIONS.ADMIN_CONTRACTS_READ, PERMISSIONS.ADMIN_CONTRACTS_WRITE,
  ],
  AUCTIONEER: [
    PERMISSIONS.AUCTIONS_READ, PERMISSIONS.AUCTIONS_WRITE,
    PERMISSIONS.AGENCIES_DASHBOARD_READ,
  ],
  AUTHORITY: [PERMISSIONS.AUCTIONS_READ, PERMISSIONS.AGENCIES_DASHBOARD_READ],
  PUBLIC_AGENCY: [PERMISSIONS.AUCTIONS_READ, PERMISSIONS.AGENCIES_DASHBOARD_READ],
  SUPPORT: [
    PERMISSIONS.ADMIN_USERS_READ, PERMISSIONS.AUCTIONS_READ,
    PERMISSIONS.AGENCIES_DASHBOARD_READ,
  ],
  SUPPLIER: [
    PERMISSIONS.AUCTIONS_READ, PERMISSIONS.BIDS_PLACE,
    PERMISSIONS.SUPPLIERS_DASHBOARD_READ,
  ],
  CITIZEN: [PERMISSIONS.AUCTIONS_READ],
};

export async function seedRbacDefaults() {
  const permRepo = AppDataSource.getRepository(Permission);
  const roleRepo = AppDataSource.getRepository(Role);

  for (const [, key] of Object.entries(PERMISSIONS)) {
    const existing = await permRepo.findOne({ where: { key } });
    if (!existing) await permRepo.save(permRepo.create({ key }));
  }

  for (const roleDef of DEFAULT_ROLES) {
    let role = await roleRepo.findOne({ where: { key: roleDef.key }, relations: ["permissions"] });
    if (!role) {
      role = roleRepo.create({ ...roleDef, permissions: [] });
      await roleRepo.save(role);
    }

    const permKeys = ROLE_PERMISSIONS[roleDef.key] ?? [];
    for (const permKey of permKeys) {
      const alreadyHas = role.permissions.some((p) => p.key === permKey);
      if (!alreadyHas) {
        const perm = await permRepo.findOne({ where: { key: permKey } });
        if (perm) {
          role.permissions.push(perm);
          await roleRepo.save(role);
        }
      }
    }
  }
}
