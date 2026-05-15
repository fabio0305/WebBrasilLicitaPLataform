import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import GroupIcon from "@mui/icons-material/Group";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeIcon from "@mui/icons-material/Badge";
import BusinessIcon from "@mui/icons-material/Business";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import ScheduleIcon from "@mui/icons-material/Schedule";
import DescriptionIcon from "@mui/icons-material/Description";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ArticleIcon from "@mui/icons-material/Article";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { organApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { AgencyDashboard, Auction, ContractAlert } from "../data/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currency(cents?: string | number | null) {
  if (cents == null || cents === "") return "—";
  const n = Number(cents) / 100;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function daysUntil(dateStr?: string | null) {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendado",
  OPEN: "Em Disputa",
  CLOSED: "Encerrado",
  ACTIVE: "Ativo",
  EXPIRING: "Vencendo",
  EXPIRED: "Expirado",
  TERMINATED: "Rescindido",
};

const AUCTION_STATUS_COLOR: Record<string, "default" | "primary" | "success" | "error" | "warning"> = {
  DRAFT: "default",
  SCHEDULED: "primary",
  OPEN: "success",
  CLOSED: "error",
};

const CONTRACT_STATUS_COLOR: Record<string, "default" | "success" | "warning" | "error"> = {
  ACTIVE: "success",
  EXPIRING: "warning",
  EXPIRED: "error",
  TERMINATED: "default",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentColor: string;
  sublabel?: string;
}

function StatCard({ label, value, icon, accentColor, sublabel }: StatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        height: "100%",
        borderTop: `3px solid ${accentColor}`,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 3 },
      }}
    >
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "flex-start", pb: "16px !important" }}>
        <Box
          sx={{
            width: 44, height: 44, borderRadius: 2,
            bgcolor: `${accentColor}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, mt: 0.25,
          }}
        >
          <Box sx={{ color: accentColor, display: "flex" }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800} lineHeight={1.1} color={accentColor}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mt={0.25}>
            {label}
          </Typography>
          {sublabel && (
            <Typography variant="caption" color="text.disabled" display="block">
              {sublabel}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Quick Action Button ──────────────────────────────────────────────────────

interface QuickActionProps {
  label: string;
  icon: React.ReactNode;
  to: string;
  color?: string;
}

function QuickAction({ label, icon, to, color = "#2c3f31" }: QuickActionProps) {
  return (
    <Button
      component={Link}
      to={to}
      variant="outlined"
      startIcon={icon}
      sx={{
        flex: 1,
        minWidth: 120,
        py: 1.25,
        borderColor: `${color}40`,
        color,
        fontWeight: 600,
        fontSize: 13,
        textTransform: "none",
        borderRadius: 2,
        "&:hover": { bgcolor: `${color}08`, borderColor: color },
      }}
    >
      {label}
    </Button>
  );
}

// ─── Contract Alerts Section ──────────────────────────────────────────────────

function ContractAlertsCard({ alerts }: { alerts: ContractAlert[] }) {
  if (!alerts || alerts.length === 0) return null;
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "warning.light", borderRadius: 2, bgcolor: "#fffbf0" }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <WarningAmberIcon color="warning" fontSize="small" />
          <Typography variant="subtitle2" fontWeight={700} color="warning.dark">
            Contratos Vencendo em Breve
          </Typography>
          <Chip label={alerts.length} color="warning" size="small" sx={{ ml: "auto" }} />
        </Box>
        <List disablePadding>
          {alerts.map((c, i) => {
            const days = daysUntil(c.endsAt);
            return (
              <React.Fragment key={c.id}>
                {i > 0 && <Divider sx={{ my: 0.75 }} />}
                <ListItem disablePadding sx={{ py: 0.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="body2" fontWeight={600}>{c.title}</Typography>
                        <Chip label={c.contractNumber} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                      </Box>
                    }
                    secondary={c.supplierName ?? "Sem fornecedor"}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                  <Box sx={{ textAlign: "right", flexShrink: 0, ml: 1 }}>
                    <Typography variant="caption" fontWeight={700} color={days != null && days <= 15 ? "error.main" : "warning.dark"} display="block">
                      {days != null && days >= 0 ? `${days} dias` : "Vencido"}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">{fmtDate(c.endsAt)}</Typography>
                  </Box>
                </ListItem>
              </React.Fragment>
            );
          })}
        </List>
        <Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
          <Button
            component={Link}
            to="/orgao/contratos"
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            Ver todos os contratos
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Recent Auctions Table ────────────────────────────────────────────────────

function RecentAuctionsCard({ auctions }: { auctions?: Auction[] }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <CardContent sx={{ pb: "0 !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>Pregões Recentes</Typography>
          <Button
            component={Link}
            to="/orgao/pregoes"
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            Ver todos
          </Button>
        </Box>
        {!auctions || auctions.length === 0 ? (
          <Box sx={{ py: 3, textAlign: "center" }}>
            <GavelIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Nenhum pregão cadastrado ainda.</Typography>
            <Button
              component={Link}
              to="/pregoes/novo"
              variant="contained"
              size="small"
              sx={{ mt: 2, textTransform: "none" }}
            >
              Criar primeiro pregão
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Título</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Processo</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Valor Est.</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Abertura</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Status</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {auctions.map((a) => (
                  <TableRow
                    key={a.id}
                    hover
                    sx={{ "& td": { fontSize: 13, py: 1 } }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{a.processNumber ?? "—"}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {a.estimatedValue != null ? currency(a.estimatedValue * 100) : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>{fmtDate(a.startsAt ?? a.openingDate)}</TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[a.status] ?? a.status}
                        color={AUCTION_STATUS_COLOR[a.status] ?? "default"}
                        size="small"
                        sx={{ fontSize: 11, height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Ver detalhes">
                        <Button
                          component={Link}
                          to={`/pregoes/${a.id}`}
                          size="small"
                          sx={{ minWidth: 0, p: 0.5, fontSize: 11, textTransform: "none" }}
                        >
                          Abrir
                        </Button>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Status Distribution Mini Chart ──────────────────────────────────────────

function StatusDistribution({ metrics }: { metrics: AgencyDashboard["metrics"] }) {
  if (!metrics) return null;
  const items = [
    { label: "Rascunho", value: metrics.draftAuctions ?? 0, color: "#9e9e9e" },
    { label: "Agendados", value: metrics.scheduledAuctions ?? 0, color: "#1976d2" },
    { label: "Em Disputa", value: metrics.openAuctions ?? 0, color: "#4caf50" },
    { label: "Encerrados", value: metrics.closedAuctions ?? 0, color: "#ef5350" },
  ];
  const total = items.reduce((s, i) => s + i.value, 0);

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Status dos Pregões
        </Typography>
        {total === 0 ? (
          <Typography variant="body2" color="text.secondary">Nenhum pregão registrado.</Typography>
        ) : (
          <>
            <Box sx={{ display: "flex", height: 10, borderRadius: 1, overflow: "hidden", mb: 1.5, bgcolor: "grey.100" }}>
              {items.filter((i) => i.value > 0).map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    width: `${(item.value / total) * 100}%`,
                    bgcolor: item.color,
                    transition: "width 0.4s",
                  }}
                />
              ))}
            </Box>
            <Stack spacing={0.75}>
              {items.map((item) => (
                <Box key={item.label} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: item.color, flexShrink: 0 }} />
                  <Typography variant="caption" flex={1} color="text.secondary">{item.label}</Typography>
                  <Typography variant="caption" fontWeight={700}>{item.value}</Typography>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Contract Summary Card ────────────────────────────────────────────────────

function ContractSummaryCard({ metrics }: { metrics: AgencyDashboard["metrics"] }) {
  if (!metrics) return null;
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={700}>Contratos</Typography>
          <Button
            component={Link}
            to="/orgao/contratos"
            size="small"
            endIcon={<ArrowForwardIcon />}
            sx={{ textTransform: "none", fontSize: 12 }}
          >
            Gerenciar
          </Button>
        </Box>
        <Stack spacing={1}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
              <Typography variant="body2" color="text.secondary">Ativos</Typography>
            </Box>
            <Typography variant="body2" fontWeight={700}>{metrics.activeContracts ?? 0}</Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <WarningAmberIcon sx={{ fontSize: 16, color: "warning.main" }} />
              <Typography variant="body2" color="text.secondary">Vencendo (60d)</Typography>
            </Box>
            <Typography variant="body2" fontWeight={700} color={metrics.expiringContracts ? "warning.dark" : "text.primary"}>
              {metrics.expiringContracts ?? 0}
            </Typography>
          </Box>
          <Divider />
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">Valor total em contratos</Typography>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              {currency(metrics.totalContractValueCents)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganDashboardPage() {
  const { user } = useAuth();
  const isOrgAdmin = user?.permissions?.includes("agencies.team.manage") ?? false;

  const [data, setData] = useState<AgencyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    organApi
      .dashboard()
      .then(setData)
      .catch(() => setError("Não foi possível carregar o painel do órgão."))
      .finally(() => setLoading(false));
  }, []);

  const greeting = user?.name ? `Olá, ${user.name.split(" ")[0]}` : "Painel do Órgão";

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={36} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={280} height={20} sx={{ mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  const m = data?.metrics ?? {};

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>{greeting}</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {data?.agency?.name && ` · ${data.agency.name}`}
          </Typography>
        </Box>
        <Chip
          icon={isOrgAdmin
            ? <AdminPanelSettingsIcon sx={{ fontSize: "16px !important" }} />
            : <BadgeIcon sx={{ fontSize: "16px !important" }} />}
          label={isOrgAdmin ? "Administrador do Órgão" : "Membro do Órgão"}
          color={isOrgAdmin ? "primary" : "success"}
          variant="outlined"
          size="small"
          sx={{ fontWeight: 600, mt: 0.5 }}
        />
      </Box>

      {/* Admin-only section */}
      {isOrgAdmin && (
        <Paper
          elevation={0}
          sx={{ p: 2, mb: 3, border: "1px solid", borderColor: "primary.light", borderRadius: 2, bgcolor: "#f0f4ff" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 1.25 }}>
            <AdminPanelSettingsIcon sx={{ fontSize: 15, color: "primary.main" }} />
            <Typography variant="caption" fontWeight={700} color="primary.main" sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
              Administração
            </Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <QuickAction label="Gerenciar Equipe" icon={<PersonAddIcon fontSize="small" />} to="/orgao/equipe" color="#1565c0" />
            <QuickAction label="Dados da Organização" icon={<BusinessIcon fontSize="small" />} to="/orgao/organizacao" color="#7b1fa2" />
          </Stack>
        </Paper>
      )}

      {/* Quick Actions */}
      <Paper
        elevation={0}
        sx={{ p: 2, mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "#f8faf9" }}
      >
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", mb: 1.25 }}>
          Ações Rápidas
        </Typography>
        <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
          <QuickAction label="Novo Pregão" icon={<AddCircleOutlineIcon fontSize="small" />} to="/pregoes/novo" color="#2c3f31" />
          <QuickAction label="Meus Pregões" icon={<GavelIcon fontSize="small" />} to="/orgao/pregoes" color="#1565c0" />
          <QuickAction label="Contratos" icon={<AssignmentTurnedInIcon fontSize="small" />} to="/orgao/contratos" color="#e65100" />
          <QuickAction label="Equipe" icon={<GroupIcon fontSize="small" />} to="/orgao/equipe" color="#7b1fa2" />
        </Stack>
      </Paper>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="Total de Pregões"
            value={m.totalAuctions ?? 0}
            icon={<GavelIcon />}
            accentColor="#2c3f31"
            sublabel={`${m.draftAuctions ?? 0} rascunhos`}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="Em Disputa"
            value={m.openAuctions ?? 0}
            icon={<HowToVoteIcon />}
            accentColor="#4caf50"
            sublabel={`${m.scheduledAuctions ?? 0} agendados`}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="Contratos Ativos"
            value={m.activeContracts ?? 0}
            icon={<AssignmentTurnedInIcon />}
            accentColor="#1976d2"
            sublabel={m.expiringContracts ? `${m.expiringContracts} vencendo` : "Todos em dia"}
          />
        </Grid>
        <Grid item xs={6} sm={6} md={3}>
          <StatCard
            label="Membros da Equipe"
            value={m.totalMembers ?? 0}
            icon={<PeopleAltIcon />}
            accentColor="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Contract alerts */}
      {data?.contractAlerts && data.contractAlerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <ContractAlertsCard alerts={data.contractAlerts} />
        </Box>
      )}

      {/* Main content grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <RecentAuctionsCard auctions={data?.recentAuctions} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Grid container spacing={2} sx={{ height: "100%" }}>
            <Grid item xs={12}>
              <StatusDistribution metrics={data?.metrics} />
            </Grid>
            <Grid item xs={12}>
              <ContractSummaryCard metrics={data?.metrics} />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Agency info */}
      {data?.agency && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <CardContent>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>{data.agency.name}</Typography>
                {data.agency.officialName && (
                  <Typography variant="caption" color="text.secondary" display="block">{data.agency.officialName}</Typography>
                )}
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {data.agency.sphere && <Chip label={data.agency.sphere} size="small" color="primary" variant="outlined" />}
                {data.agency.entityType && <Chip label={data.agency.entityType?.replace(/_/g, " ")} size="small" variant="outlined" />}
                {data.agency.city && data.agency.state && (
                  <Chip label={`${data.agency.city}/${data.agency.state}`} size="small" variant="outlined" />
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
