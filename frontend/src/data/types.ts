// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  cpf?: string;
  cpfNormalized?: string;
  identifier?: string;
  email: string;
  name: string;
  phone?: string;
  role: string;
  requestedRole?: string;
  permissions: string[];
  effectivePermissions?: string[];
  active?: boolean;
  mustChangePassword?: boolean;
  onboardingStatus?: string;
  authProvider?: string;
  govBrLevel?: string;
  organAccessProfiles?: unknown[];
  requestedAgencyName?: string;
  // Supplier profile
  supplierProfile?: SupplierProfile;
  // Agency
  agency?: AgencySummary;
}

export interface SupplierProfile {
  country?: string;
  entityType?: string;
  cnpj?: string;
  companyName?: string;
  tradeName?: string;
  taxRegime?: string;
  postalCode?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  district?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountType?: string;
  pixKey?: string;
  financeEmail?: string;
  financePhone?: string;
  segments?: string[];
}

export interface AgencySummary {
  id: string;
  name: string;
  officialName?: string;
  cnpj?: string;
  code?: string;
  city?: string;
  state?: string;
  sphere?: string;
  entityType?: string;
  legalFramework?: string;
}

// ─── Auctions ────────────────────────────────────────────────────────────────

export type AuctionStatus = "DRAFT" | "SCHEDULED" | "OPEN" | "CLOSED";

export interface Auction {
  id: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  openingDate?: string;
  closingDate?: string;
  startsAt?: string;
  endsAt?: string;
  estimatedValue?: number;
  modality?: string;
  processNumber?: string | null;
  agency?: { name: string; state?: string };
}

export interface AuctionLot {
  id: string;
  auctionId: string;
  number?: number;
  title: string;
  description?: string;
  startingPriceCents?: string;
  minIncrementCents?: string;
  createdAt?: string;
  updatedAt?: string;
  bidCount: number;
  currentMaxBidCents?: number | null;
}

export interface AuctionDetail {
  id: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  startsAt?: string;
  endsAt?: string;
  phaseInversionEnabled?: boolean;
  modality?: string;
  phase?: string;
  disputeMode?: string;
  judgmentCriteria?: string;
  processNumber?: string | null;
  editalNumber?: string | null;
  agencyId?: string | null;
  estimatedValueCents?: string | null;
  hiddenValue?: boolean;
  proposalDeadline?: string | null;
  createdAt?: string;
  updatedAt?: string;
  lots: AuctionLot[];
}

// ─── Agency Dashboard ─────────────────────────────────────────────────────────

export interface AgencyMetrics {
  totalAuctions?: number;
  openAuctions?: number;
  closedAuctions?: number;
  draftAuctions?: number;
  scheduledAuctions?: number;
  totalBids?: number;
  totalMembers?: number;
  totalContracts?: number;
  activeContracts?: number;
  expiringContracts?: number;
  totalContractValueCents?: string;
}

export interface DashboardAlert {
  type: string;
  message: string;
  level?: "info" | "warning" | "error";
}

export interface DashboardTodo {
  id: string;
  title: string;
  done?: boolean;
}

export interface ContractAlert {
  id: string;
  contractNumber: string;
  title: string;
  supplierName?: string | null;
  endsAt: string;
  status: string;
  totalValueCents?: string | null;
}

export interface AgencyAuctionSummary {
  id: string;
  title: string;
  status: AuctionStatus;
  modality?: string | null;
  processNumber?: string | null;
  estimatedValueCents?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt?: string;
}

export interface AgencyDashboard {
  agency?: AgencySummary;
  metrics?: AgencyMetrics;
  alerts?: DashboardAlert[];
  todos?: DashboardTodo[];
  contractAlerts?: ContractAlert[];
  recentAuctions?: Auction[];
}

export interface AgencyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  createdAt?: string;
}

// ─── Agency Org Setup ─────────────────────────────────────────────────────────

export interface AgencySetup {
  id: string;
  name: string;
  officialName?: string | null;
  cnpj?: string | null;
  city?: string | null;
  state?: string | null;
  sphere?: string | null;
  entityType?: string | null;
  legalFramework?: string | null;
  description?: string | null;
  contractAlertWindowDays?: number;
  tenantSettings?: Record<string, unknown> | null;
}

// ─── Document Templates ───────────────────────────────────────────────────────

export interface DocumentTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Declarations ────────────────────────────────────────────────────────────

export type DeclarationStatus = "draft" | "ready";

export interface Declaration {
  id: string;
  name: string;
  type: string;
  status: DeclarationStatus;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Integrations ─────────────────────────────────────────────────────────────

export type IntegrationStatus = "active" | "inactive" | "coming_soon" | "error";

export interface IntegrationStats {
  totalJobs: number;
  succeeded: number;
  pending: number;
  failed: number;
}

export interface Integration {
  id: string;
  name: string;
  fullName: string;
  description: string;
  category: string;
  status: IntegrationStatus;
  configured: boolean;
  official: boolean;
  stats?: IntegrationStats | null;
  docsUrl?: string | null;
  logoColor: string;
}

export interface AgencyContract {
  id: string;
  agencyId?: string;
  auctionId?: string | null;
  contractNumber: string;
  title: string;
  supplierName?: string | null;
  managerName?: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  recordType?: string;
  totalValueCents?: string | null;
  createdAt?: string;
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  pendingOnboarding: number;
  totalAgencies: number;
  activeAgencies: number;
  totalAuctions: number;
  openAuctions: number;
  totalContracts: number;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  cpfNormalized?: string | null;
  role: string;
  onboardingStatus: string;
  active: boolean;
  createdAt: string;
  requestedRole?: string | null;
  agency?: { id: string; name: string } | null;
  agencyId?: string | null;
}

export interface AdminAgency {
  id: string;
  name: string;
  officialName?: string | null;
  cnpj?: string | null;
  code?: string | null;
  city?: string | null;
  state?: string | null;
  sphere?: string | null;
  entityType?: string | null;
  legalFramework?: string | null;
  active: boolean;
  userCount?: number;
}

export interface AdminContract {
  id: string;
  contractNumber: string;
  title: string;
  supplierName?: string | null;
  managerName?: string | null;
  startsAt: string;
  endsAt: string;
  status: string;
  totalValueCents?: number | null;
  agencyId: string;
}

export interface AdminPasswordRecovery {
  id: string;
  cpfNormalized?: string | null;
  userId?: string | null;
  status: string;
  deliveryChannel?: string | null;
  createdAt: string;
  resolvedByUserId?: string | null;
  resolutionNotes?: string | null;
}

export interface AdminRole {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  permissions: { id: string; key: string; description?: string | null }[];
}

// ─── Citizen Dashboard ────────────────────────────────────────────────────────

export interface PublicAuction {
  id: string;
  title: string;
  description?: string;
  status: AuctionStatus;
  openingDate?: string;
  closingDate?: string;
  estimatedValue?: number;
  agency?: { id?: string; name: string; state?: string; city?: string; sphere?: string };
  modality?: string;
  object?: string;
  segment?: string;
  state?: string;
}

export interface CitizenDashboard {
  totalOpenAuctions?: number;
  totalAgencies?: number;
  totalContracts?: number;
  totalSavingsPercent?: number;
  recentAuctions?: PublicAuction[];
  highlightedAuctions?: PublicAuction[];
}

export interface Denuncia {
  id?: string;
  subject: string;
  description: string;
  auctionId?: string;
  agencyId?: string;
  anonymous?: boolean;
  status?: string;
  createdAt?: string;
}

// ─── Supplier Dashboard ───────────────────────────────────────────────────────

export interface BidSummary {
  id: string;
  amount: number;
  status?: string;
  lot?: { title?: string; number?: number };
  auction?: { title?: string; id?: string };
  createdAt?: string;
}

// ─── Notifications ───────────────────────────────────────────────────────────

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  category: string;
  targetRole: string;
  targetUserId?: string | null;
  targetUserName?: string | null;
  targetUserEmail?: string | null;
  sentByUserId?: string | null;
  createdAt: string;
  // user view
  myReplyId?: string | null;
  myReplyMessage?: string | null;
  myReplyAt?: string | null;
  // admin view
  replyCount?: number;
  unreadReplyCount?: number;
}

export interface NotificationReply {
  id: string;
  notificationId: string;
  userId: string;
  message: string;
  readByAdminAt?: string | null;
  createdAt: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  notificationTitle?: string;
  notificationCategory?: string;
}

export interface SupplierDashboard {
  totalBids?: number;
  lotsParticipated?: number;
  auctionsJoined?: number;
  highestBidAmount?: number;
  totalBidAmount?: number;
  recentBids?: BidSummary[];
}
