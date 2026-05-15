export const PERMISSIONS = {
  AUCTIONS_READ: "auctions.read",
  AUCTIONS_WRITE: "auctions.write",
  BIDS_PLACE: "bids.place",
  ADMIN_AGENCIES_READ: "admin.agencies.read",
  ADMIN_AGENCIES_WRITE: "admin.agencies.write",
  ADMIN_CONTRACTS_READ: "admin.contracts.read",
  ADMIN_CONTRACTS_WRITE: "admin.contracts.write",
  ADMIN_USERS_READ: "admin.users.read",
  ADMIN_USERS_WRITE: "admin.users.write",
  ADMIN_ROLES_READ: "admin.roles.read",
  ADMIN_ROLES_WRITE: "admin.roles.write",
  ADMIN_PERMISSIONS_READ: "admin.permissions.read",
  ADMIN_PERMISSIONS_WRITE: "admin.permissions.write",
  AGENCIES_DASHBOARD_READ: "agencies.dashboard.read",
  AGENCIES_TEAM_MANAGE: "agencies.team.manage",
  SUPPLIERS_DASHBOARD_READ: "suppliers.dashboard.read",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
