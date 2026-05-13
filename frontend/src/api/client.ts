import type { AgencyDashboard, AgencyContract, AgencyMember, AgencyAuctionSummary, AgencySetup, DocumentTemplate, Declaration, Integration, Auction, AuctionDetail, AuthUser, SupplierDashboard, AdminStats, AdminUser, AdminAgency, AdminContract, AdminPasswordRecovery, AdminRole, CitizenDashboard, PublicAuction, Denuncia, PlatformNotification, NotificationReply } from "../data/types";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: "include", ...options });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  me: () => apiFetch<AuthUser>("/api/auth/me"),
  login: (identifier: string, password: string) =>
    apiFetch<AuthUser>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    }),
  register: (body: { name: string; email: string; password: string; cpf?: string; phone?: string }) =>
    apiFetch<{ ok: boolean; user?: AuthUser }>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, role: "CITIZEN" }),
    }),
  logout: () =>
    fetch("/api/auth/logout", { method: "POST", credentials: "include" }),
};

// ─── Auctions ─────────────────────────────────────────────────────────────────

export const auctionsApi = {
  list: () =>
    apiFetch<{ auctions: Auction[] }>("/api/auctions").then(
      (d) => d.auctions ?? []
    ),
  get: (id: string) => apiFetch<AuctionDetail>(`/api/auctions/${id}`),
};

// ─── Admin ────────────────────────────────────────────────────────────────────

export const adminApi = {
  stats: () => apiFetch<AdminStats>("/api/admin/stats"),

  // Users
  users: () => apiFetch<{ users: AdminUser[] }>("/api/admin/users"),
  updateUser: (id: string, body: Partial<Pick<AdminUser, "role" | "agencyId" | "active" | "onboardingStatus"> & { password?: string }>) =>
    apiFetch<AdminUser>(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteUser: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/users/${id}`, { method: "DELETE" }),
  createUser: (body: { name: string; email: string; password: string; role: string; agencyId?: string | null; cpf?: string; phone?: string }) =>
    apiFetch<AdminUser>("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // Onboarding
  onboarding: (params?: { status?: string; search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    return apiFetch<{ users: AdminUser[]; total: number; page: number; limit: number }>(`/api/admin/onboarding?${qs}`);
  },
  decideOnboarding: (id: string, decision: "APPROVED" | "REJECTED", agencyId?: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/onboarding/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, agencyId }),
    }),

  // Agencies
  agencies: () => apiFetch<{ agencies: AdminAgency[] }>("/api/admin/agencies"),
  createAgency: (body: Partial<AdminAgency>) =>
    apiFetch<AdminAgency>("/api/admin/agencies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  updateAgency: (id: string, body: Partial<AdminAgency>) =>
    apiFetch<AdminAgency>(`/api/admin/agencies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // Contracts
  contracts: () => apiFetch<{ contracts: AdminContract[] }>("/api/admin/contracts"),
  createContract: (body: Partial<AdminContract>) =>
    apiFetch<AdminContract>("/api/admin/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  updateContract: (id: string, body: Partial<AdminContract>) =>
    apiFetch<AdminContract>(`/api/admin/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // Password recovery
  passwordRecovery: (status?: string) => {
    const qs = status ? `?status=${status}` : "";
    return apiFetch<{ requests: AdminPasswordRecovery[] }>(`/api/admin/password-recovery${qs}`);
  },
  issueRecoveryLink: (id: string, sendEmail: boolean) =>
    apiFetch<{ ok: boolean; link: string }>(`/api/admin/password-recovery/${id}/issue-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sendEmail }),
    }),
  updateRecovery: (id: string, status: string, notes?: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/password-recovery/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, notes }),
    }),

  // Roles
  roles: () => apiFetch<{ roles: AdminRole[] }>("/api/admin/roles"),

  // Notifications
  notifications: () => apiFetch<{ notifications: PlatformNotification[] }>("/api/admin/notifications").then((d) => d.notifications ?? []),
  sendNotification: (body: { title: string; message: string; category: string; targetRole?: string; targetUserId?: string | null }) =>
    apiFetch<PlatformNotification>("/api/admin/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  deleteNotification: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/notifications/${id}`, { method: "DELETE" }),
  searchNotificationUsers: (q: string) =>
    apiFetch<{ users: { id: string; name: string; email: string; role: string }[] }>(
      `/api/admin/notifications/users/search?q=${encodeURIComponent(q)}`
    ).then((d) => d.users ?? []),

  // Reply management (admin)
  notificationReplies: (notificationId: string) =>
    apiFetch<{ replies: NotificationReply[] }>(`/api/admin/notifications/${notificationId}/replies`).then((d) => d.replies ?? []),
  allReplies: () =>
    apiFetch<{ replies: NotificationReply[] }>("/api/admin/notification-replies").then((d) => d.replies ?? []),
  markReplyRead: (replyId: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/notification-replies/${replyId}/read`, { method: "PATCH" }),
  markReplyUnread: (replyId: string) =>
    apiFetch<{ ok: boolean }>(`/api/admin/notification-replies/${replyId}/unread`, { method: "PATCH" }),
};

// ─── Dashboards ───────────────────────────────────────────────────────────────

export const organApi = {
  dashboard: () => apiFetch<AgencyDashboard>("/api/dashboards/agency"),

  auctions: (status?: string) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return apiFetch<{ auctions: AgencyAuctionSummary[] }>(`/api/dashboards/agency/auctions${qs}`).then((d) => d.auctions ?? []);
  },

  contracts: (recordType?: string) => {
    const qs = recordType ? `?recordType=${encodeURIComponent(recordType)}` : "";
    return apiFetch<{ contracts: AgencyContract[] }>(`/api/dashboards/agency/contracts${qs}`).then((d) => d.contracts ?? []);
  },

  createContract: (body: Omit<AgencyContract, "id" | "agencyId" | "createdAt">) =>
    apiFetch<AgencyContract>("/api/dashboards/agency/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  updateContract: (id: string, body: Partial<Omit<AgencyContract, "id" | "agencyId" | "createdAt">>) =>
    apiFetch<AgencyContract>(`/api/dashboards/agency/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  deleteContract: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/dashboards/agency/contracts/${id}`, { method: "DELETE" }),

  members: () => apiFetch<{ members: AgencyMember[] }>("/api/dashboards/agency/members").then((d) => d.members ?? []),

  integrations: () =>
    apiFetch<{ integrations: Integration[] }>("/api/dashboards/agency/integrations").then((d) => d.integrations ?? []),

  // Org data
  orgSetup: () =>
    apiFetch<{ agency: AgencySetup }>("/api/dashboards/agency/setup").then((d) => d.agency),

  updateOrgSetup: (body: Partial<AgencySetup & { phone?: string; email?: string; website?: string; zipCode?: string; street?: string; addressNumber?: string; district?: string }>) =>
    apiFetch<AgencySetup>("/api/dashboards/agency/setup", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  // Document templates
  documents: () =>
    apiFetch<{ documents: DocumentTemplate[] }>("/api/dashboards/agency/documents").then((d) => d.documents ?? []),

  createDocument: (body: Pick<DocumentTemplate, "name" | "category" | "content">) =>
    apiFetch<DocumentTemplate>("/api/dashboards/agency/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  updateDocument: (id: string, body: Partial<Pick<DocumentTemplate, "name" | "category" | "content">>) =>
    apiFetch<DocumentTemplate>(`/api/dashboards/agency/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  deleteDocument: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/dashboards/agency/documents/${id}`, { method: "DELETE" }),

  // Declarations
  declarations: () =>
    apiFetch<{ declarations: Declaration[] }>("/api/dashboards/agency/declarations").then((d) => d.declarations ?? []),

  createDeclaration: (body: Pick<Declaration, "name" | "type" | "status" | "content">) =>
    apiFetch<Declaration>("/api/dashboards/agency/declarations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  updateDeclaration: (id: string, body: Partial<Pick<Declaration, "name" | "type" | "status" | "content">>) =>
    apiFetch<Declaration>(`/api/dashboards/agency/declarations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),

  deleteDeclaration: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/dashboards/agency/declarations/${id}`, { method: "DELETE" }),
};

export const dashboardApi = {
  agency: () => organApi.dashboard(),
  supplier: () => apiFetch<SupplierDashboard>("/api/dashboards/supplier"),

  citizen: async (): Promise<CitizenDashboard> => {
    const [auctionsData, agenciesData] = await Promise.all([
      apiFetch<{ auctions: PublicAuction[] }>("/api/auctions"),
      apiFetch<{ agencies: { id: string; name: string; state?: string; city?: string }[] }>("/api/agencies"),
    ]);
    const auctions = auctionsData.auctions ?? [];
    const agencies = agenciesData.agencies ?? [];
    const open = auctions.filter((a) => a.status === "OPEN");
    return {
      totalOpenAuctions: open.length,
      totalAgencies: agencies.length,
      totalContracts: auctions.filter((a) => a.status === "CLOSED").length,
      totalSavingsPercent: 28,
      recentAuctions: auctions.slice(0, 6),
      highlightedAuctions: open.slice(0, 6),
    };
  },
};

// ─── Supplier Users ───────────────────────────────────────────────────────────

export interface SupplierSubUser {
  id: string;
  name: string;
  email: string;
  cpfNormalized?: string | null;
  active: boolean;
  createdAt?: string;
}

export const supplierUsersApi = {
  list: () =>
    apiFetch<{ users: SupplierSubUser[] }>("/api/dashboards/supplier/users").then((d) => d.users ?? []),

  search: (q: string) =>
    apiFetch<{ users: SupplierSubUser[] }>(`/api/dashboards/supplier/users/search?q=${encodeURIComponent(q)}`).then((d) => d.users ?? []),

  add: (citizenId: string) =>
    apiFetch<SupplierSubUser>("/api/dashboards/supplier/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citizenId }),
    }),

  remove: (id: string) =>
    apiFetch<{ ok: boolean }>(`/api/dashboards/supplier/users/${id}`, { method: "DELETE" }),
};

// ─── User Notifications ───────────────────────────────────────────────────────

export const notificationsApi = {
  list: () =>
    apiFetch<{ notifications: PlatformNotification[] }>("/api/notifications").then((d) => d.notifications ?? []),
  reply: (id: string, message: string) =>
    apiFetch<NotificationReply>(`/api/notifications/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }),
};

// ─── Public / Citizen ─────────────────────────────────────────────────────────

export const publicApi = {
  searchAuctions: async (params?: {
    q?: string;
    state?: string;
    modality?: string;
    segment?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ auctions: PublicAuction[]; total: number }> => {
    const data = await apiFetch<{ auctions: PublicAuction[] }>("/api/auctions");
    let list = data.auctions ?? [];

    if (params?.q) {
      const q = params.q.toLowerCase();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.description?.toLowerCase().includes(q) ||
          a.agency?.name?.toLowerCase().includes(q)
      );
    }
    if (params?.status) list = list.filter((a) => a.status === params.status);
    if (params?.state) list = list.filter((a) => a.agency?.state === params.state);
    if (params?.modality) list = list.filter((a) => a.modality === params.modality);
    if (params?.segment) list = list.filter((a) => a.segment === params.segment);

    const limit = params?.limit ?? 20;
    const page = params?.page ?? 1;
    const start = (page - 1) * limit;
    return { auctions: list.slice(start, start + limit), total: list.length };
  },

  agencies: () =>
    apiFetch<{ agencies: { id: string; name: string; state?: string; city?: string; sphere?: string }[] }>(
      "/api/agencies"
    ).then((d) => d.agencies ?? []),

  submitDenuncia: (_body: Denuncia): Promise<{ ok: boolean; id: string }> =>
    Promise.resolve({ ok: true, id: `DEN-${Date.now()}` }),

  stats: async (): Promise<{ totalAuctions: number; totalAgencies: number; totalContracts: number; savingsPercent: number }> => {
    const [auctionsData, agenciesData] = await Promise.all([
      apiFetch<{ auctions: PublicAuction[] }>("/api/auctions"),
      apiFetch<{ agencies: unknown[] }>("/api/agencies"),
    ]);
    return {
      totalAuctions: (auctionsData.auctions ?? []).filter((a) => a.status === "OPEN").length,
      totalAgencies: (agenciesData.agencies ?? []).length,
      totalContracts: (auctionsData.auctions ?? []).filter((a) => a.status === "CLOSED").length,
      savingsPercent: 28,
    };
  },
};
