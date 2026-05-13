import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Typography,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import GroupIcon from "@mui/icons-material/Group";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { dashboardApi, auctionsApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { useProfile } from "../auth/ProfileContext";
import type { AgencyDashboard, Auction, SupplierDashboard } from "../data/types";
import CitizenDashboardPage from "./CitizenDashboardPage";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currency(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function statusLabel(s: string) {
  const m: Record<string, string> = {
    DRAFT: "Rascunho", SCHEDULED: "Agendado",
    OPEN: "Em disputa", CLOSED: "Encerrado",
  };
  return m[s] ?? s;
}

function statusColor(s: string): "default" | "primary" | "success" | "error" {
  const m: Record<string, "default" | "primary" | "success" | "error"> = {
    DRAFT: "default", SCHEDULED: "primary", OPEN: "success", CLOSED: "error",
  };
  return m[s] ?? "default";
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

function StatCard({ label, value, icon, color = "#2c3f31" }: StatCardProps) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: 2,
            bgcolor: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Agency Dashboard ─────────────────────────────────────────────────────────

function AgencyDashboardView() {
  const [data, setData] = useState<AgencyDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .agency()
      .then(setData)
      .catch(() => setError("Não foi possível carregar o dashboard do órgão."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={88} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  const m = data?.metrics ?? {};

  return (
    <Box>
      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total de Pregões" value={m.totalAuctions ?? 0} icon={<GavelIcon />} color="#2c3f31" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Em Disputa" value={m.openAuctions ?? 0} icon={<HowToVoteIcon />} color="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Agendados" value={m.scheduledAuctions ?? 0} icon={<TrendingUpIcon />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Membros" value={m.totalMembers ?? 0} icon={<GroupIcon />} color="#9c27b0" />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Alerts */}
        {data?.alerts && data.alerts.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Alertas
                </Typography>
                <List disablePadding>
                  {data.alerts.map((a, i) => (
                    <ListItem key={i} disablePadding sx={{ mb: 1 }}>
                      <WarningAmberIcon
                        fontSize="small"
                        sx={{ mr: 1, color: a.level === "error" ? "error.main" : "warning.main", flexShrink: 0 }}
                      />
                      <ListItemText
                        primary={a.message}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Todos */}
        {data?.todos && data.todos.length > 0 && (
          <Grid item xs={12} md={4}>
            <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
              <CardContent>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Pendências
                </Typography>
                <List disablePadding>
                  {data.todos.map((t) => (
                    <ListItem key={t.id} disablePadding sx={{ mb: 0.5 }}>
                      <CheckCircleOutlineIcon
                        fontSize="small"
                        sx={{ mr: 1, color: t.done ? "success.main" : "text.disabled", flexShrink: 0 }}
                      />
                      <ListItemText
                        primary={t.title}
                        primaryTypographyProps={{
                          variant: "body2",
                          sx: { textDecoration: t.done ? "line-through" : "none", color: t.done ? "text.disabled" : "text.primary" },
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Recent Auctions */}
        <Grid item xs={12} md={data?.alerts?.length || data?.todos?.length ? 8 : 12}>
          <RecentAuctionsCard auctions={data?.recentAuctions} />
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Supplier Dashboard ───────────────────────────────────────────────────────

function SupplierDashboardView() {
  const [data, setData] = useState<SupplierDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi
      .supplier()
      .then(setData)
      .catch(() => setError("Não foi possível carregar o dashboard do fornecedor."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Grid container spacing={2}>
        {[...Array(4)].map((_, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Skeleton variant="rounded" height={88} />
          </Grid>
        ))}
      </Grid>
    );
  }

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Lances Enviados" value={data?.totalBids ?? 0} icon={<HowToVoteIcon />} color="#2c3f31" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Lotes Participados" value={data?.lotsParticipated ?? 0} icon={<GavelIcon />} color="#4caf50" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Pregões Participados" value={data?.auctionsJoined ?? 0} icon={<TrendingUpIcon />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Maior Lance" value={currency(data?.highestBidAmount)} icon={<TrendingUpIcon />} color="#e65100" />
        </Grid>
      </Grid>

      {/* Recent bids */}
      {data?.recentBids && data.recentBids.length > 0 && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <CardContent>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
              Últimos Lances
            </Typography>
            <List disablePadding>
              {data.recentBids.map((bid, i) => (
                <React.Fragment key={bid.id}>
                  {i > 0 && <Divider />}
                  <ListItem disablePadding sx={{ py: 1 }}>
                    <ListItemText
                      primary={bid.lot?.title ?? `Lote ${bid.lot?.number ?? i + 1}`}
                      secondary={bid.auction?.title ?? ""}
                      primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: "caption" }}
                    />
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      {currency(bid.amount)}
                    </Typography>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}

// ─── Default Dashboard (fallback: auction list) ───────────────────────────────

function DefaultDashboardView() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    auctionsApi
      .list()
      .then(setAuctions)
      .catch(() => setError("Erro ao carregar pregões."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <CircularProgress />;

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <RecentAuctionsCard auctions={auctions} />
    </Box>
  );
}

// ─── Shared: Recent Auctions Card ─────────────────────────────────────────────

function RecentAuctionsCard({ auctions }: { auctions?: Auction[] }) {
  if (!auctions || auctions.length === 0) {
    return (
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Pregões Recentes</Typography>
          <Typography variant="body2" color="text.secondary">Nenhum pregão encontrado.</Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <CardContent>
        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Pregões Recentes</Typography>
        <List disablePadding>
          {auctions.slice(0, 8).map((a, i) => (
            <React.Fragment key={a.id}>
              {i > 0 && <Divider />}
              <ListItem disablePadding sx={{ py: 1, gap: 1 }}>
                <ListItemText
                  primary={a.title}
                  secondary={a.agency?.name}
                  primaryTypographyProps={{ variant: "body2", fontWeight: 600, noWrap: true }}
                  secondaryTypographyProps={{ variant: "caption", noWrap: true }}
                />
                <Chip
                  label={statusLabel(a.status)}
                  color={statusColor(a.status)}
                  size="small"
                  sx={{ flexShrink: 0 }}
                />
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { user } = useAuth();
  const { activeProfile } = useProfile();

  const isAdmin = user?.role === "ADMIN";
  const isAgency = !isAdmin && user?.permissions?.includes("agencies.dashboard.read") && Boolean(user?.agency);
  const isSupplier = !isAdmin && user?.permissions?.includes("suppliers.dashboard.read");
  const isCitizen = user?.role === "CITIZEN" || (!isAdmin && !isAgency && !isSupplier);

  if (isAdmin) return <Navigate to="/admin" replace />;
  // Redirect to supplier dashboard only when the user is actively in supplier mode
  if (isSupplier && activeProfile !== "citizen") return <Navigate to="/fornecedor" replace />;
  if (isCitizen || (isSupplier && activeProfile === "citizen")) return <CitizenDashboardPage />;

  const greeting = user?.name ? `Olá, ${user.name.split(" ")[0]}` : "Dashboard";

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{greeting}</Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date().toLocaleDateString("pt-BR", {
            weekday: "long", year: "numeric", month: "long", day: "numeric",
          })}
        </Typography>
      </Box>

      {isAgency ? (
        <AgencyDashboardView />
      ) : isSupplier ? (
        <SupplierDashboardView />
      ) : (
        <DefaultDashboardView />
      )}
    </Box>
  );
}
