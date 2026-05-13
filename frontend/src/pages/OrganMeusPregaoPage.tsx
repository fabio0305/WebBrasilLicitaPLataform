import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import { organApi } from "../api/client";
import type { AgencyAuctionSummary } from "../data/types";

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

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  SCHEDULED: "Agendado",
  OPEN: "Em Disputa",
  CLOSED: "Encerrado",
};

const STATUS_COLOR: Record<string, "default" | "primary" | "success" | "error"> = {
  DRAFT: "default",
  SCHEDULED: "primary",
  OPEN: "success",
  CLOSED: "error",
};

const MODALITY_LABEL: Record<string, string> = {
  PREGAO: "Pregão Eletrônico",
  CONCORRENCIA: "Concorrência",
  TOMADA_PRECOS: "Tomada de Preços",
  CONVITE: "Convite",
  LEILAO: "Leilão",
  CONCURSO: "Concurso",
  DISPENSA: "Dispensa",
  INEXIGIBILIDADE: "Inexigibilidade",
};

// ─── Summary Row ─────────────────────────────────────────────────────────────

function SummaryBadge({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <Box sx={{ textAlign: "center", px: 2, py: 1, bgcolor: `${color}10`, borderRadius: 2, border: `1px solid ${color}30` }}>
      <Typography variant="h5" fontWeight={800} color={color}>{count}</Typography>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganMeusPregaoPage() {
  const [auctions, setAuctions] = useState<AgencyAuctionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    organApi
      .auctions()
      .then(setAuctions)
      .catch(() => setError("Não foi possível carregar os pregões."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = auctions.filter((a) => {
    const matchSearch =
      !search ||
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.processNumber ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const byStatus = (s: string) => auctions.filter((a) => a.status === s).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GavelIcon /> Meus Pregões
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie todos os pregões do seu órgão
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/pregoes/novo"
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Novo Pregão
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary badges */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
        <SummaryBadge label="Total" count={auctions.length} color="#2c3f31" />
        <SummaryBadge label="Em Disputa" count={byStatus("OPEN")} color="#4caf50" />
        <SummaryBadge label="Agendados" count={byStatus("SCHEDULED")} color="#1976d2" />
        <SummaryBadge label="Rascunhos" count={byStatus("DRAFT")} color="#9e9e9e" />
        <SummaryBadge label="Encerrados" count={byStatus("CLOSED")} color="#ef5350" />
      </Stack>

      {/* Filters */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ pb: "16px !important" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              placeholder="Buscar por título ou processo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 180 }}>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="DRAFT">Rascunho</MenuItem>
                <MenuItem value="SCHEDULED">Agendado</MenuItem>
                <MenuItem value="OPEN">Em Disputa</MenuItem>
                <MenuItem value="CLOSED">Encerrado</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Atualizar">
              <Button variant="outlined" onClick={load} sx={{ minWidth: 0, px: 1.5 }}>
                <RefreshIcon fontSize="small" />
              </Button>
            </Tooltip>
          </Stack>
        </CardContent>
      </Card>

      {/* Table */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <CircularProgress size={32} />
          </Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <GavelIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={600}>
              {auctions.length === 0 ? "Nenhum pregão cadastrado." : "Nenhum pregão encontrado com esses filtros."}
            </Typography>
            {auctions.length === 0 && (
              <Button
                component={Link}
                to="/pregoes/novo"
                variant="contained"
                startIcon={<AddIcon />}
                sx={{ mt: 2, textTransform: "none" }}
              >
                Criar primeiro pregão
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", py: 1.5 }}>Título</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", py: 1.5 }}>Modalidade</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", py: 1.5 }}>Nº Processo</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", py: 1.5 }}>Valor Estimado</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", py: 1.5 }}>Abertura</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", py: 1.5 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", py: 1.5 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((a) => (
                  <TableRow
                    key={a.id}
                    hover
                    sx={{ "& td": { py: 1.25, fontSize: 13 } }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                        title={a.title}
                      >
                        {a.title}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                      {MODALITY_LABEL[a.modality ?? ""] ?? a.modality ?? "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {a.processNumber ?? "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                      {a.estimatedValueCents ? currency(a.estimatedValueCents) : "—"}
                    </TableCell>
                    <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>
                      {fmtDate(a.startsAt)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={STATUS_LABEL[a.status] ?? a.status}
                        color={STATUS_COLOR[a.status] ?? "default"}
                        size="small"
                        sx={{ fontSize: 11, height: 22, fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Ver detalhes">
                          <Button
                            component={Link}
                            to={`/pregoes/${a.id}`}
                            size="small"
                            variant="outlined"
                            sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: 11, textTransform: "none" }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </Button>
                        </Tooltip>
                        {a.status === "OPEN" && (
                          <Tooltip title="Sala de Disputa">
                            <Button
                              component={Link}
                              to={`/pregoes/${a.id}/disputa`}
                              size="small"
                              variant="contained"
                              color="success"
                              sx={{ minWidth: 0, px: 1, py: 0.5, fontSize: 11, textTransform: "none" }}
                            >
                              <HowToVoteIcon sx={{ fontSize: 14 }} />
                            </Button>
                          </Tooltip>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block", textAlign: "right" }}>
          Exibindo {filtered.length} de {auctions.length} pregões
        </Typography>
      )}
    </Box>
  );
}
