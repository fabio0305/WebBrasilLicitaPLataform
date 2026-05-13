import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GavelIcon from "@mui/icons-material/Gavel";
import EventIcon from "@mui/icons-material/Event";
import EventBusyIcon from "@mui/icons-material/EventBusy";
import ListAltIcon from "@mui/icons-material/ListAlt";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SendIcon from "@mui/icons-material/Send";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import { auctionsApi } from "../api/client";
import type { AuctionDetail } from "../data/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function centsToReal(cents?: string | number | null): string {
  if (cents == null) return "—";
  const value = typeof cents === "string" ? parseInt(cents, 10) : cents;
  if (isNaN(value)) return "—";
  return (value / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusLabel(s: string): string {
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

// ─── Stat card ────────────────────────────────────────────────────────────────

function InfoCard({
  label, value, icon, color = "#2c3f31",
}: { label: string; value: React.ReactNode; icon: React.ReactNode; color?: string }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Box
          sx={{
            width: 44, height: 44, borderRadius: 2,
            bgcolor: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
          <Typography variant="body1" fontWeight={700} noWrap>{value}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PregaoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    auctionsApi
      .get(id)
      .then(setAuction)
      .catch(() => setError("Pregão não encontrado ou indisponível."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !auction) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          Voltar
        </Button>
        <Alert severity="error">{error || "Pregão não encontrado."}</Alert>
      </Box>
    );
  }

  const totalBids = auction.lots.reduce((sum, l) => sum + (l.bidCount ?? 0), 0);

  return (
    <Box>
      {/* Back + header */}
      <Box sx={{ mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          size="small"
          sx={{ mb: 1.5, color: "text.secondary" }}
        >
          Voltar aos Pregões
        </Button>

        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <GavelIcon sx={{ color: "#2c3f31", fontSize: 22 }} />
              <Typography variant="h6" fontWeight={700} sx={{ wordBreak: "break-word" }}>
                {auction.title}
              </Typography>
            </Box>
            {auction.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {auction.description}
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
            <Chip
              label={statusLabel(auction.status)}
              color={statusColor(auction.status)}
              sx={{ fontWeight: 700, fontSize: 13, height: 28, flexShrink: 0 }}
            />
            {auction.status === "OPEN" && (
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<PlayArrowIcon />}
                onClick={() => navigate(`/pregoes/${auction.id}/disputa`)}
              >
                Sala de Disputa
              </Button>
            )}
            {(auction.status === "OPEN" || auction.status === "SCHEDULED") && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SendIcon />}
                onClick={() => navigate(`/pregoes/${auction.id}/proposta`)}
              >
                Enviar Proposta
              </Button>
            )}
            <Button
              variant="outlined"
              size="small"
              startIcon={<QuestionMarkIcon />}
              onClick={() => navigate(`/pregoes/${auction.id}/solicitacoes`)}
            >
              Solicitações
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Info cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard
            label="Data de Abertura"
            value={formatDate(auction.startsAt)}
            icon={<EventIcon />}
            color="#2c3f31"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard
            label="Data de Encerramento"
            value={formatDate(auction.endsAt)}
            icon={<EventBusyIcon />}
            color="#e65100"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard
            label="Lotes"
            value={auction.lots.length}
            icon={<ListAltIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <InfoCard
            label="Total de Lances"
            value={totalBids}
            icon={<HowToVoteIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Lots table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <Box sx={{ px: 2.5, py: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <ListAltIcon sx={{ color: "#2c3f31", fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700}>
            Lotes do Pregão
          </Typography>
          <Chip
            label={auction.lots.length}
            size="small"
            sx={{ bgcolor: "#2c3f3118", color: "#2c3f31", fontWeight: 700 }}
          />
        </Box>
        <Divider />

        {auction.lots.length === 0 ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <ListAltIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Nenhum lote cadastrado neste pregão.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", width: 56 }}>
                    Nº
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>
                    OBJETO DO LOTE
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }} align="right">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                      <AttachMoneyIcon sx={{ fontSize: 14 }} />
                      VALOR INICIAL
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }} align="right">
                    LANCE ATUAL
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }} align="center">
                    LANCES
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {auction.lots.map((lot, i) => {
                  const hasMaxBid = lot.currentMaxBidCents != null;
                  return (
                    <TableRow
                      key={lot.id}
                      hover
                      sx={{ "&:last-child td": { border: 0 } }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                          {lot.number ?? i + 1}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 0 }}>
                        <Tooltip title={lot.title} placement="top-start">
                          <Typography variant="body2" fontWeight={600} noWrap>
                            {lot.title}
                          </Typography>
                        </Tooltip>
                        {lot.description && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                            {lot.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                          {centsToReal(lot.startingPriceCents)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {hasMaxBid ? (
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            color="success.main"
                            sx={{ whiteSpace: "nowrap" }}
                          >
                            {centsToReal(lot.currentMaxBidCents)}
                          </Typography>
                        ) : (
                          <Typography variant="body2" color="text.disabled">
                            Sem lances
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={lot.bidCount}
                          size="small"
                          color={lot.bidCount > 0 ? "primary" : "default"}
                          variant={lot.bidCount > 0 ? "filled" : "outlined"}
                          sx={{ fontSize: 11, height: 22, fontWeight: 700 }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </Box>
  );
}
