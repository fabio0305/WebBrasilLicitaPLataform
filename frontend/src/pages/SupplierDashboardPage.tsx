import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Tooltip,
  Typography,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import ArticleIcon from "@mui/icons-material/Article";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import StarIcon from "@mui/icons-material/Star";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import RefreshIcon from "@mui/icons-material/Refresh";
import { dashboardApi, auctionsApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { SupplierDashboard, Auction } from "../data/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currency(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function auctionStatusLabel(s: string) {
  const m: Record<string, string> = {
    DRAFT: "Rascunho", SCHEDULED: "Agendado",
    OPEN: "Em disputa", CLOSED: "Encerrado",
  };
  return m[s] ?? s;
}

function auctionStatusColor(s: string): "default" | "primary" | "success" | "error" {
  const m: Record<string, "default" | "primary" | "success" | "error"> = {
    DRAFT: "default", SCHEDULED: "primary", OPEN: "success", CLOSED: "error",
  };
  return m[s] ?? "default";
}

// ─── Document / Certidão types ────────────────────────────────────────────────

type DocStatus = "valid" | "expiring" | "expired" | "pending";

interface CertDoc {
  id: string;
  name: string;
  abbrev: string;
  required: boolean;
  status: DocStatus;
  expiresAt?: string;
  daysLeft?: number;
}

const CERTIDOES_TEMPLATE: Omit<CertDoc, "status" | "expiresAt" | "daysLeft">[] = [
  { id: "cnd-federal", name: "Certidão Negativa Federal / PGFN", abbrev: "CND Federal", required: true },
  { id: "cnd-estadual", name: "Certidão Negativa Estadual", abbrev: "CND Estadual", required: true },
  { id: "cnd-municipal", name: "Certidão Negativa Municipal", abbrev: "CND Municipal", required: true },
  { id: "fgts", name: "Certificado de Regularidade do FGTS", abbrev: "CRF/FGTS", required: true },
  { id: "cndt", name: "Certidão Negativa de Débitos Trabalhistas", abbrev: "CNDT", required: true },
  { id: "contrato-social", name: "Contrato Social / CCMEI", abbrev: "Contrato Social", required: true },
  { id: "cartao-cnpj", name: "Comprovante de CNPJ", abbrev: "Cartão CNPJ", required: true },
  { id: "balanco", name: "Balanço Patrimonial (último exercício)", abbrev: "Balanço Patrimonial", required: false },
];

const STORAGE_KEY = "licita-brasil:supplier-docs";

function loadDocStatuses(): Record<string, { status: DocStatus; expiresAt?: string }> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, { status: DocStatus; expiresAt?: string }>) : {};
  } catch {
    return {};
  }
}

function buildCertidoes(): CertDoc[] {
  const stored = loadDocStatuses();
  return CERTIDOES_TEMPLATE.map((t) => {
    const saved = stored[t.id];
    if (!saved) return { ...t, status: "pending" as DocStatus };
    const exp = saved.expiresAt ? new Date(saved.expiresAt) : undefined;
    const today = new Date();
    let daysLeft: number | undefined;
    let status: DocStatus = saved.status;
    if (exp) {
      daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
      if (daysLeft < 0) status = "expired";
      else if (daysLeft <= 30) status = "expiring";
      else status = "valid";
    }
    return { ...t, status, expiresAt: saved.expiresAt, daysLeft };
  });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  sub?: string;
  onClick?: () => void;
}

function StatCard({ label, value, icon, color = "#2c3f31", sub, onClick }: StatCardProps) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        height: "100%",
        cursor: onClick ? "pointer" : "default",
        transition: "box-shadow 0.15s",
        "&:hover": onClick ? { boxShadow: "0 2px 12px rgba(0,0,0,0.10)" } : {},
      }}
    >
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center", p: "16px!important" }}>
        <Box
          sx={{
            width: 52, height: 52, borderRadius: 2,
            bgcolor: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.3, display: "block" }}>{label}</Typography>
          {sub && <Typography variant="caption" color={color} fontWeight={600} sx={{ fontSize: 11 }}>{sub}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Document Status Icon ─────────────────────────────────────────────────────

function DocStatusIcon({ status }: { status: DocStatus }) {
  if (status === "valid") return <CheckCircleIcon fontSize="small" sx={{ color: "success.main" }} />;
  if (status === "expiring") return <HourglassEmptyIcon fontSize="small" sx={{ color: "warning.main" }} />;
  if (status === "expired") return <ErrorOutlineIcon fontSize="small" sx={{ color: "error.main" }} />;
  return <WarningAmberIcon fontSize="small" sx={{ color: "text.disabled" }} />;
}

function DocStatusChip({ status, daysLeft }: { status: DocStatus; daysLeft?: number }) {
  if (status === "valid") return <Chip label="Válida" size="small" color="success" />;
  if (status === "expiring") return <Chip label={daysLeft != null ? `Vence em ${daysLeft}d` : "A vencer"} size="small" color="warning" />;
  if (status === "expired") return <Chip label="Vencida" size="small" color="error" />;
  return <Chip label="Pendente" size="small" variant="outlined" />;
}

// ─── Profile Completeness ────────────────────────────────────────────────────

function profileCompleteness(user: ReturnType<typeof useAuth>["user"]): number {
  const sp = user?.supplierProfile;
  if (!sp) return 10;
  const fields = [
    sp.cnpj, sp.companyName, sp.tradeName,
    sp.postalCode, sp.street, sp.city, sp.state,
    sp.bankName, sp.bankBranch, sp.pixKey || sp.bankAccountType,
    sp.segments && sp.segments.length > 0,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round(10 + (filled / fields.length) * 70);
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function SupplierDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashData, setDashData] = useState<SupplierDashboard | null>(null);
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [certidoes, setCertidoes] = useState<CertDoc[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const sp = user?.supplierProfile;
  const companyName = sp?.companyName || sp?.tradeName || user?.name || "Minha Empresa";
  const cnpj = sp?.cnpj;
  const completeness = profileCompleteness(user);

  const loadData = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const [dash, aucts] = await Promise.all([
        dashboardApi.supplier().catch(() => null),
        auctionsApi.list().catch(() => []),
      ]);
      setDashData(dash);
      setAuctions(aucts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadData();
    setCertidoes(buildCertidoes());
  }, []);

  const openAuctions = auctions.filter((a) => a.status === "OPEN");
  const scheduledAuctions = auctions.filter((a) => a.status === "SCHEDULED");

  const docsExpired = certidoes.filter((c) => c.status === "expired");
  const docsExpiring = certidoes.filter((c) => c.status === "expiring");
  const docsPending = certidoes.filter((c) => c.status === "pending" && c.required);
  const docsValid = certidoes.filter((c) => c.status === "valid");

  const docAlerts = [...docsExpired, ...docsExpiring, ...docsPending];

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={100} sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[...Array(4)].map((_, i) => <Grid item xs={12} sm={6} md={3} key={i}><Skeleton variant="rounded" height={90} /></Grid>)}
        </Grid>
        <Grid container spacing={2}>
          <Grid item xs={12} md={5}><Skeleton variant="rounded" height={320} /></Grid>
          <Grid item xs={12} md={7}><Skeleton variant="rounded" height={320} /></Grid>
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* ── Header ── */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3, bgcolor: "primary.main", color: "white" }}>
        <CardContent sx={{ p: { xs: 2, md: 3 }, "&:last-child": { pb: { xs: 2, md: 3 } } }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 56, height: 56, borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <BusinessIcon sx={{ fontSize: 28, color: "white" }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} sx={{ color: "white", lineHeight: 1.2 }}>
                  {companyName}
                </Typography>
                {cnpj && (
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.25 }}>
                    CNPJ: {cnpj}
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
                  <Chip
                    label={docAlerts.length === 0 ? "Habilitado" : "Atenção necessária"}
                    size="small"
                    sx={{
                      bgcolor: docAlerts.length === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,193,7,0.35)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: 11,
                    }}
                    icon={docAlerts.length === 0
                      ? <CheckCircleIcon sx={{ fontSize: "14px!important", color: "white!important" }} />
                      : <WarningAmberIcon sx={{ fontSize: "14px!important", color: "white!important" }} />}
                  />
                  {sp?.taxRegime && (
                    <Chip
                      label={sp.taxRegime}
                      size="small"
                      sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.9)", fontSize: 11 }}
                    />
                  )}
                </Box>
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Tooltip title="Atualizar dados">
                <IconButton
                  size="small"
                  onClick={() => void loadData(true)}
                  disabled={refreshing}
                  sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { bgcolor: "rgba(255,255,255,0.1)" } }}
                >
                  {refreshing ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon fontSize="small" />}
                </IconButton>
              </Tooltip>
              <Button
                variant="outlined"
                size="small"
                onClick={() => navigate("/fornecedor/empresa")}
                sx={{ color: "white", borderColor: "rgba(255,255,255,0.5)", "&:hover": { borderColor: "white", bgcolor: "rgba(255,255,255,0.1)" }, fontSize: 12 }}
              >
                Editar Empresa
              </Button>
            </Box>
          </Box>

          {/* Profile Completeness */}
          <Box sx={{ mt: 2.5 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                Perfil da Empresa
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.9)", fontWeight: 700 }}>
                {completeness}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={completeness}
              sx={{
                height: 6, borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.2)",
                "& .MuiLinearProgress-bar": { bgcolor: completeness >= 80 ? "#69f0ae" : "#ffeb3b", borderRadius: 3 },
              }}
            />
            {completeness < 80 && (
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5, display: "block", fontSize: 11 }}>
                Complete seu perfil para aparecer em mais licitações
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* ── KPI Cards ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Licitações Abertas"
            value={openAuctions.length}
            icon={<GavelIcon />}
            color="#2c3f31"
            sub={scheduledAuctions.length > 0 ? `+${scheduledAuctions.length} agendadas` : undefined}
            onClick={() => navigate("/pregoes")}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Propostas Enviadas"
            value={dashData?.totalBids ?? 0}
            icon={<HowToVoteIcon />}
            color="#1976d2"
            sub={dashData?.lotsParticipated ? `${dashData.lotsParticipated} lote(s)` : undefined}
            onClick={() => navigate("/fornecedor/propostas")}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Contratos Ativos"
            value={0}
            icon={<AssignmentTurnedInIcon />}
            color="#4caf50"
            onClick={() => navigate("/fornecedor/contratos")}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <StatCard
            label="Docs Pendentes"
            value={docAlerts.length}
            icon={<ArticleIcon />}
            color={docAlerts.length > 0 ? "#e65100" : "#9c27b0"}
            sub={docAlerts.length > 0 ? "Ação necessária" : "Tudo em dia"}
            onClick={() => navigate("/fornecedor/documentos")}
          />
        </Grid>
      </Grid>

      {/* ── Alerts row ── */}
      {docAlerts.length > 0 && (
        <Box sx={{ mb: 3, display: "flex", flexDirection: "column", gap: 1 }}>
          {docsExpired.map((d) => (
            <Alert
              key={d.id}
              severity="error"
              action={<Button size="small" color="error" onClick={() => navigate("/fornecedor/documentos")}>Regularizar</Button>}
            >
              <strong>{d.abbrev}</strong> está vencida. Regularize para participar de licitações.
            </Alert>
          ))}
          {docsExpiring.map((d) => (
            <Alert
              key={d.id}
              severity="warning"
              action={<Button size="small" color="warning" onClick={() => navigate("/fornecedor/documentos")}>Renovar</Button>}
            >
              <strong>{d.abbrev}</strong> vence em <strong>{d.daysLeft} dia(s)</strong>. Providencie a renovação.
            </Alert>
          ))}
          {docsPending.slice(0, 2).map((d) => (
            <Alert
              key={d.id}
              severity="info"
              action={<Button size="small" onClick={() => navigate("/fornecedor/documentos")}>Enviar</Button>}
            >
              <strong>{d.abbrev}</strong> ainda não foi enviada. Documentos pendentes limitam sua participação.
            </Alert>
          ))}
        </Box>
      )}

      {/* ── Main grid ── */}
      <Grid container spacing={2}>
        {/* ── Certidões e Documentos ── */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
            <CardContent sx={{ p: "0!important" }}>
              <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Certidões e Documentos</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {docsValid.length} válida(s) · {docsExpired.length + docsExpiring.length} atenção · {docsPending.length} pendente(s)
                  </Typography>
                </Box>
                <Button
                  size="small"
                  endIcon={<ArrowForwardIcon fontSize="small" />}
                  onClick={() => navigate("/fornecedor/documentos")}
                  sx={{ fontSize: 12 }}
                >
                  Gerenciar
                </Button>
              </Box>
              <Divider />
              <List disablePadding>
                {certidoes.map((doc, i) => (
                  <React.Fragment key={doc.id}>
                    {i > 0 && <Divider />}
                    <ListItem
                      disablePadding
                      sx={{
                        px: 2.5, py: 1.25,
                        bgcolor: doc.status === "expired" ? "error.50" : doc.status === "expiring" ? "warning.50" : "transparent",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => navigate("/fornecedor/documentos")}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <DocStatusIcon status={doc.status} />
                      </ListItemIcon>
                      <ListItemText
                        primary={doc.abbrev}
                        secondary={doc.expiresAt ? `Vence: ${new Date(doc.expiresAt).toLocaleDateString("pt-BR")}` : undefined}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 500 }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <DocStatusChip status={doc.status} daysLeft={doc.daysLeft} />
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
              <Box sx={{ px: 2.5, py: 2, borderTop: "1px solid", borderColor: "divider" }}>
                <Button
                  fullWidth
                  variant="outlined"
                  size="small"
                  startIcon={<DescriptionIcon fontSize="small" />}
                  onClick={() => navigate("/fornecedor/documentos")}
                >
                  Enviar / Atualizar Documentos
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Right column ── */}
        <Grid item xs={12} md={7}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Licitações Abertas */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <CardContent sx={{ p: "0!important" }}>
                <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Licitações Abertas</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Oportunidades disponíveis agora
                    </Typography>
                  </Box>
                  <Button size="small" endIcon={<ArrowForwardIcon fontSize="small" />} onClick={() => navigate("/pregoes")} sx={{ fontSize: 12 }}>
                    Ver todas
                  </Button>
                </Box>
                <Divider />
                {openAuctions.length === 0 ? (
                  <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
                    <GavelIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Nenhuma licitação aberta no momento.</Typography>
                    {scheduledAuctions.length > 0 && (
                      <Typography variant="caption" color="primary.main" fontWeight={600}>
                        {scheduledAuctions.length} licitação(ões) agendada(s) em breve
                      </Typography>
                    )}
                  </Box>
                ) : (
                  <List disablePadding>
                    {openAuctions.slice(0, 5).map((a, i) => (
                      <React.Fragment key={a.id}>
                        {i > 0 && <Divider />}
                        <ListItem
                          disablePadding
                          sx={{ px: 2.5, py: 1.25, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                        >
                          <ListItemText
                            primary={a.title}
                            secondary={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                                {a.agency?.name && (
                                  <Typography variant="caption" color="text.secondary">{a.agency.name}</Typography>
                                )}
                                {a.estimatedValue && (
                                  <Typography variant="caption" color="success.main" fontWeight={600}>
                                    {currency(a.estimatedValue)}
                                  </Typography>
                                )}
                              </Box>
                            }
                            primaryTypographyProps={{ variant: "body2", fontWeight: 600, noWrap: true }}
                          />
                          <Chip label={auctionStatusLabel(a.status)} color={auctionStatusColor(a.status)} size="small" sx={{ ml: 1, flexShrink: 0 }} />
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>

            {/* Últimas Propostas */}
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
              <CardContent sx={{ p: "0!important" }}>
                <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Últimas Propostas</Typography>
                    <Typography variant="caption" color="text.secondary">Histórico de lances enviados</Typography>
                  </Box>
                  <Button size="small" endIcon={<ArrowForwardIcon fontSize="small" />} onClick={() => navigate("/fornecedor/propostas")} sx={{ fontSize: 12 }}>
                    Ver todas
                  </Button>
                </Box>
                <Divider />
                {!dashData?.recentBids || dashData.recentBids.length === 0 ? (
                  <Box sx={{ px: 2.5, py: 3, textAlign: "center" }}>
                    <HowToVoteIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">Você ainda não enviou propostas.</Typography>
                    <Button
                      variant="contained"
                      size="small"
                      sx={{ mt: 1.5 }}
                      onClick={() => navigate("/pregoes")}
                      startIcon={<GavelIcon fontSize="small" />}
                    >
                      Participar de Licitações
                    </Button>
                  </Box>
                ) : (
                  <List disablePadding>
                    {dashData.recentBids.slice(0, 5).map((bid, i) => (
                      <React.Fragment key={bid.id}>
                        {i > 0 && <Divider />}
                        <ListItem disablePadding sx={{ px: 2.5, py: 1.25 }}>
                          <ListItemText
                            primary={bid.lot?.title ?? `Lote ${bid.lot?.number ?? i + 1}`}
                            secondary={bid.auction?.title ?? ""}
                            primaryTypographyProps={{ variant: "body2", fontWeight: 600, noWrap: true }}
                            secondaryTypographyProps={{ variant: "caption", noWrap: true }}
                          />
                          <Box sx={{ textAlign: "right", flexShrink: 0, ml: 1 }}>
                            <Typography variant="body2" fontWeight={700} color="primary.main">
                              {currency(bid.amount)}
                            </Typography>
                            {bid.createdAt && (
                              <Typography variant="caption" color="text.secondary">
                                {new Date(bid.createdAt).toLocaleDateString("pt-BR")}
                              </Typography>
                            )}
                          </Box>
                        </ListItem>
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>

      {/* ── Quick Actions ── */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mt: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Acesso Rápido</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<GavelIcon fontSize="small" />}
              onClick={() => navigate("/pregoes")}
            >
              Buscar Licitações
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<DescriptionIcon fontSize="small" />}
              onClick={() => navigate("/fornecedor/documentos")}
            >
              Meus Documentos
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<HowToVoteIcon fontSize="small" />}
              onClick={() => navigate("/fornecedor/propostas")}
            >
              Minhas Propostas
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<AssignmentTurnedInIcon fontSize="small" />}
              onClick={() => navigate("/fornecedor/contratos")}
            >
              Meus Contratos
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<BusinessIcon fontSize="small" />}
              onClick={() => navigate("/fornecedor/empresa")}
            >
              Dados da Empresa
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<StarIcon fontSize="small" />}
              onClick={() => navigate("/fornecedor/segmentos")}
            >
              Segmentos de Atuação
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<MonetizationOnIcon fontSize="small" />}
              onClick={() => navigate("/fornecedor/banco")}
            >
              Dados Bancários
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
