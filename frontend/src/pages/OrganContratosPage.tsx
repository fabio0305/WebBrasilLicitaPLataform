import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
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
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { organApi } from "../api/client";
import type { AgencyContract } from "../data/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currency(cents?: string | number | null) {
  if (cents == null || cents === "") return "—";
  const n = Number(cents) / 100;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d.includes("T") ? d : `${d}T00:00:00`).toLocaleDateString("pt-BR");
}

function daysUntil(dateStr?: string | null) {
  if (!dateStr) return null;
  const d = dateStr.includes("T") ? dateStr : `${dateStr}T23:59:59`;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo",
  EXPIRING: "Vencendo",
  EXPIRED: "Expirado",
  TERMINATED: "Rescindido",
};

const STATUS_COLOR: Record<string, "default" | "success" | "warning" | "error"> = {
  ACTIVE: "success",
  EXPIRING: "warning",
  EXPIRED: "error",
  TERMINATED: "default",
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Box sx={{ textAlign: "center", px: 2.5, py: 1.25, bgcolor: `${color}10`, borderRadius: 2, border: `1px solid ${color}30` }}>
      <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    </Box>
  );
}

// ─── Contract Form Dialog ─────────────────────────────────────────────────────

interface ContractFormProps {
  open: boolean;
  initial?: Partial<AgencyContract>;
  onClose: () => void;
  onSaved: (c: AgencyContract) => void;
}

const EMPTY: Partial<AgencyContract> = {
  contractNumber: "",
  title: "",
  supplierName: "",
  managerName: "",
  startsAt: "",
  endsAt: "",
  status: "ACTIVE",
  totalValueCents: "",
};

function ContractFormDialog({ open, initial, onClose, onSaved }: ContractFormProps) {
  const [form, setForm] = useState<Partial<AgencyContract>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) setForm(initial ? { ...EMPTY, ...initial } : { ...EMPTY });
    setErr("");
  }, [open, initial]);

  const set = (k: keyof AgencyContract) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.contractNumber?.trim()) return setErr("Número do contrato obrigatório.");
    if (!form.title?.trim()) return setErr("Título obrigatório.");
    if (!form.startsAt || !form.endsAt) return setErr("Datas de início e término obrigatórias.");
    setSaving(true);
    setErr("");
    try {
      const valueCents = form.totalValueCents
        ? String(Math.round(parseFloat(String(form.totalValueCents).replace(",", ".")) * 100))
        : null;
      const payload = { ...form, totalValueCents: valueCents };
      let saved: AgencyContract;
      if (initial?.id) {
        saved = await organApi.updateContract(initial.id, payload);
      } else {
        saved = await organApi.createContract(payload as Omit<AgencyContract, "id" | "agencyId" | "createdAt">);
      }
      onSaved(saved);
    } catch {
      setErr("Erro ao salvar contrato. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {initial?.id ? "Editar Contrato" : "Novo Contrato"}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Número do Contrato *"
              value={form.contractNumber ?? ""}
              onChange={set("contractNumber")}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status *</InputLabel>
              <Select
                label="Status *"
                value={form.status ?? "ACTIVE"}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              >
                <MenuItem value="ACTIVE">Ativo</MenuItem>
                <MenuItem value="EXPIRING">Vencendo</MenuItem>
                <MenuItem value="EXPIRED">Expirado</MenuItem>
                <MenuItem value="TERMINATED">Rescindido</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Título / Objeto *"
              value={form.title ?? ""}
              onChange={set("title")}
              fullWidth
              size="small"
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fornecedor"
              value={form.supplierName ?? ""}
              onChange={set("supplierName")}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Gestor do Contrato"
              value={form.managerName ?? ""}
              onChange={set("managerName")}
              fullWidth
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Data de Início *"
              type="date"
              value={form.startsAt ?? ""}
              onChange={set("startsAt")}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Data de Término *"
              type="date"
              value={form.endsAt ?? ""}
              onChange={set("endsAt")}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Valor Total (R$)"
              value={form.totalValueCents
                ? (Number(form.totalValueCents) / 100).toFixed(2).replace(".", ",")
                : ""}
              onChange={(e) => {
                const raw = e.target.value.replace(",", ".");
                const n = parseFloat(raw);
                setForm((f) => ({ ...f, totalValueCents: isNaN(n) ? "" : String(Math.round(n * 100)) }));
              }}
              fullWidth
              size="small"
              placeholder="0,00"
              InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

function DeleteDialog({ open, contract, onClose, onDeleted }: {
  open: boolean;
  contract?: AgencyContract;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!contract) return;
    setLoading(true);
    try {
      await organApi.deleteContract(contract.id);
      onDeleted(contract.id);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Excluir Contrato</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Tem certeza que deseja excluir o contrato <strong>{contract?.contractNumber}</strong>?
          Esta ação não pode ser desfeita.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button
          onClick={handleDelete}
          variant="contained"
          color="error"
          disabled={loading}
          sx={{ textTransform: "none" }}
        >
          {loading ? <CircularProgress size={18} color="inherit" /> : "Excluir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganContratosPage() {
  const [contracts, setContracts] = useState<AgencyContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgencyContract | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<AgencyContract | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    organApi
      .contracts()
      .then(setContracts)
      .catch(() => setError("Não foi possível carregar os contratos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = contracts.filter((c) => {
    const matchSearch =
      !search ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
      (c.supplierName ?? "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const byStatus = (s: string) => contracts.filter((c) => c.status === s).length;
  const totalValue = contracts.reduce((sum, c) => sum + (c.totalValueCents ? Number(c.totalValueCents) : 0), 0);

  const handleSaved = (saved: AgencyContract) => {
    setContracts((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setFormOpen(false);
    setEditTarget(undefined);
    setToast(editTarget ? "Contrato atualizado!" : "Contrato criado com sucesso!");
  };

  const handleDeleted = (id: string) => {
    setContracts((prev) => prev.filter((c) => c.id !== id));
    setDeleteOpen(false);
    setToast("Contrato excluído.");
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentTurnedInIcon /> Contratos
          </Typography>
          <Typography variant="body2" color="text.secondary">Gerencie os contratos administrativos do seu órgão</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(undefined); setFormOpen(true); }}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Novo Contrato
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
        <StatBadge label="Total" value={contracts.length} color="#2c3f31" />
        <StatBadge label="Ativos" value={byStatus("ACTIVE")} color="#4caf50" />
        <StatBadge label="Vencendo" value={byStatus("EXPIRING")} color="#f57c00" />
        <StatBadge label="Expirados" value={byStatus("EXPIRED")} color="#d32f2f" />
        <Box sx={{ px: 2.5, py: 1.25, bgcolor: "#1976d210", borderRadius: 2, border: "1px solid #1976d230" }}>
          <Typography variant="body2" fontWeight={800} color="#1976d2">{currency(totalValue)}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">Valor Total</Typography>
        </Box>
      </Stack>

      {/* Filters */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ pb: "16px !important" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              placeholder="Buscar por título, nº contrato ou fornecedor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ flex: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel>Status</InputLabel>
              <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="ACTIVE">Ativo</MenuItem>
                <MenuItem value="EXPIRING">Vencendo</MenuItem>
                <MenuItem value="EXPIRED">Expirado</MenuItem>
                <MenuItem value="TERMINATED">Rescindido</MenuItem>
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
          <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={32} /></Box>
        ) : filtered.length === 0 ? (
          <Box sx={{ p: 5, textAlign: "center" }}>
            <AssignmentTurnedInIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography variant="body1" color="text.secondary" fontWeight={600}>
              {contracts.length === 0 ? "Nenhum contrato cadastrado." : "Nenhum contrato encontrado."}
            </Typography>
            {contracts.length === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setFormOpen(true)}
                sx={{ mt: 2, textTransform: "none" }}
              >
                Cadastrar primeiro contrato
              </Button>
            )}
          </Box>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: "grey.50" }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Nº Contrato</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Objeto</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Fornecedor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Gestor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Início</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Término</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Vigência</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Valor</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map((c) => {
                  const days = daysUntil(c.endsAt);
                  const expiring = days != null && days >= 0 && days <= 60;
                  return (
                    <TableRow key={c.id} hover sx={{ "& td": { fontSize: 13, py: 1.25 } }}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{c.contractNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          sx={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          title={c.title}
                        >
                          {c.title}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{c.supplierName ?? "—"}</TableCell>
                      <TableCell sx={{ color: "text.secondary" }}>{c.managerName ?? "—"}</TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{fmtDate(c.startsAt)}</TableCell>
                      <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{fmtDate(c.endsAt)}</TableCell>
                      <TableCell>
                        {expiring ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <WarningAmberIcon sx={{ fontSize: 14, color: "warning.main" }} />
                            <Typography variant="caption" color="warning.dark" fontWeight={700}>
                              {days} dias
                            </Typography>
                          </Box>
                        ) : days != null && days < 0 ? (
                          <Typography variant="caption" color="error.main" fontWeight={700}>Vencido</Typography>
                        ) : days != null ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                            <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
                            <Typography variant="caption" color="text.secondary">{days} dias</Typography>
                          </Box>
                        ) : "—"}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>
                        {currency(c.totalValueCents)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABEL[c.status] ?? c.status}
                          color={STATUS_COLOR[c.status] ?? "default"}
                          size="small"
                          sx={{ fontSize: 11, height: 22, fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Editar">
                            <IconButton
                              size="small"
                              onClick={() => { setEditTarget(c); setFormOpen(true); }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Excluir">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => { setDeleteTarget(c); setDeleteOpen(true); }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {!loading && filtered.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block", textAlign: "right" }}>
          {filtered.length} de {contracts.length} contratos
        </Typography>
      )}

      <ContractFormDialog
        open={formOpen}
        initial={editTarget}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        onSaved={handleSaved}
      />

      <DeleteDialog
        open={deleteOpen}
        contract={deleteTarget}
        onClose={() => setDeleteOpen(false)}
        onDeleted={handleDeleted}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
      />
    </Box>
  );
}
