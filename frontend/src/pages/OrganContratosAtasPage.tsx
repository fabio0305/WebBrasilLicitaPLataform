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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ArticleIcon from "@mui/icons-material/Article";
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
  return (Number(cents) / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d.includes("T") ? d : `${d}T00:00:00`).toLocaleDateString("pt-BR");
}

function daysUntil(d?: string | null) {
  if (!d) return null;
  return Math.ceil((new Date(d.includes("T") ? d : `${d}T23:59:59`).getTime() - Date.now()) / 86400000);
}

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Ativo", EXPIRING: "Vencendo", EXPIRED: "Expirado", TERMINATED: "Rescindido",
};
const STATUS_COLOR: Record<string, "default" | "success" | "warning" | "error"> = {
  ACTIVE: "success", EXPIRING: "warning", EXPIRED: "error", TERMINATED: "default",
};

// ─── Summary badges ───────────────────────────────────────────────────────────

function Badge({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Box sx={{ textAlign: "center", px: 2.5, py: 1.25, bgcolor: `${color}10`, borderRadius: 2, border: `1px solid ${color}30` }}>
      <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    </Box>
  );
}

// ─── Shared Form Dialog ───────────────────────────────────────────────────────

interface FormProps {
  open: boolean;
  initial?: Partial<AgencyContract>;
  recordType: "CONTRACT" | "ARP";
  onClose: () => void;
  onSaved: (c: AgencyContract) => void;
}

const EMPTY_CONTRACT: Partial<AgencyContract> = {
  contractNumber: "", title: "", supplierName: "", managerName: "",
  startsAt: "", endsAt: "", status: "ACTIVE", totalValueCents: "",
};

function FormDialog({ open, initial, recordType, onClose, onSaved }: FormProps) {
  const [form, setForm] = useState<Partial<AgencyContract>>(EMPTY_CONTRACT);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) { setForm(initial ? { ...EMPTY_CONTRACT, ...initial } : { ...EMPTY_CONTRACT }); setErr(""); }
  }, [open, initial]);

  const set = (k: keyof AgencyContract) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.contractNumber?.trim()) return setErr("Número obrigatório.");
    if (!form.title?.trim()) return setErr("Título/objeto obrigatório.");
    if (!form.startsAt || !form.endsAt) return setErr("Datas obrigatórias.");
    setSaving(true); setErr("");
    try {
      const valueCents = form.totalValueCents
        ? String(Math.round(parseFloat(String(form.totalValueCents).replace(",", ".")) * 100))
        : null;
      const payload = { ...form, totalValueCents: valueCents, recordType };
      const saved = initial?.id
        ? await organApi.updateContract(initial.id, payload)
        : await organApi.createContract(payload as Omit<AgencyContract, "id" | "agencyId" | "createdAt">);
      onSaved(saved);
    } catch { setErr("Erro ao salvar. Tente novamente."); } finally { setSaving(false); }
  };

  const isArp = recordType === "ARP";
  const numberLabel = isArp ? "Número da ARP *" : "Número do Contrato *";
  const titleLabel  = isArp ? "Objeto da ARP *" : "Objeto do Contrato *";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {initial?.id
          ? `Editar ${isArp ? "ARP" : "Contrato"}`
          : `Nova ${isArp ? "Ata de Registro de Preço" : "Contrato"}`}
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField label={numberLabel} value={form.contractNumber ?? ""} onChange={set("contractNumber")} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small">
              <InputLabel>Status *</InputLabel>
              <Select label="Status *" value={form.status ?? "ACTIVE"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <MenuItem value="ACTIVE">Ativo</MenuItem>
                <MenuItem value="EXPIRING">Vencendo</MenuItem>
                <MenuItem value="EXPIRED">Expirado</MenuItem>
                <MenuItem value="TERMINATED">Rescindido</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField label={titleLabel} value={form.title ?? ""} onChange={set("title")} fullWidth size="small" multiline rows={2} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={isArp ? "Fornecedor(es)" : "Fornecedor"}
              value={form.supplierName ?? ""} onChange={set("supplierName")} fullWidth size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Gestor" value={form.managerName ?? ""} onChange={set("managerName")} fullWidth size="small" />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField label="Vigência Inicial *" type="date" value={form.startsAt ?? ""} onChange={set("startsAt")} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={isArp ? "Validade *" : "Vigência Final *"}
              type="date" value={form.endsAt ?? ""} onChange={set("endsAt")} fullWidth size="small" InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label={isArp ? "Valor Total Registrado (R$)" : "Valor Total (R$)"}
              value={form.totalValueCents ? (Number(form.totalValueCents) / 100).toFixed(2).replace(".", ",") : ""}
              onChange={(e) => {
                const n = parseFloat(e.target.value.replace(",", "."));
                setForm((f) => ({ ...f, totalValueCents: isNaN(n) ? "" : String(Math.round(n * 100)) }));
              }}
              fullWidth size="small" placeholder="0,00"
              InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button onClick={handleSave} variant="contained" disabled={saving} sx={{ textTransform: "none", fontWeight: 600 }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({ open, item, onClose, onDeleted }: {
  open: boolean; item?: AgencyContract; onClose: () => void; onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const isArp = item?.recordType === "ARP";
  const handle = async () => {
    if (!item) return; setLoading(true);
    try { await organApi.deleteContract(item.id); onDeleted(item.id); } catch { /* ignore */ } finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Excluir {isArp ? "ARP" : "Contrato"}</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Excluir <strong>{item?.contractNumber}</strong>? Esta ação não pode ser desfeita.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button onClick={handle} variant="contained" color="error" disabled={loading} sx={{ textTransform: "none" }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Excluir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Records Table ────────────────────────────────────────────────────────────

function RecordsTable({ items, isArp, onEdit, onDelete }: {
  items: AgencyContract[];
  isArp: boolean;
  onEdit: (c: AgencyContract) => void;
  onDelete: (c: AgencyContract) => void;
}) {
  if (items.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        {isArp
          ? <ArticleIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          : <AssignmentTurnedInIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />}
        <Typography variant="body1" color="text.secondary" fontWeight={600}>
          Nenhum{isArp ? "a ARP" : " contrato"} encontrado.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "grey.50" }}>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Nº</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Objeto</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>
              {isArp ? "Fornecedor(es)" : "Fornecedor"}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Gestor</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Início</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>
              {isArp ? "Validade" : "Término"}
            </TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Vigência</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Valor</TableCell>
            <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>Status</TableCell>
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((c) => {
            const days = daysUntil(c.endsAt);
            const expiring = days != null && days >= 0 && days <= 60;
            return (
              <TableRow key={c.id} hover sx={{ "& td": { fontSize: 13, py: 1.25 } }}>
                <TableCell><Typography variant="body2" fontWeight={700}>{c.contractNumber}</Typography></TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={c.title}>
                    {c.title}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{c.supplierName ?? "—"}</TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{c.managerName ?? "—"}</TableCell>
                <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{fmtDate(c.startsAt)}</TableCell>
                <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{fmtDate(c.endsAt)}</TableCell>
                <TableCell>
                  {expiring
                    ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><WarningAmberIcon sx={{ fontSize: 14, color: "warning.main" }} /><Typography variant="caption" color="warning.dark" fontWeight={700}>{days}d</Typography></Box>
                    : days != null && days < 0
                    ? <Typography variant="caption" color="error.main" fontWeight={700}>Vencido</Typography>
                    : days != null
                    ? <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}><CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} /><Typography variant="caption" color="text.secondary">{days}d</Typography></Box>
                    : "—"}
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 600 }}>{currency(c.totalValueCents)}</TableCell>
                <TableCell>
                  <Chip label={STATUS_LABEL[c.status] ?? c.status} color={STATUS_COLOR[c.status] ?? "default"} size="small" sx={{ fontSize: 11, height: 22, fontWeight: 600 }} />
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={0.25}>
                    <Tooltip title="Editar"><IconButton size="small" onClick={() => onEdit(c)}><EditIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                    <Tooltip title="Excluir"><IconButton size="small" color="error" onClick={() => onDelete(c)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton></Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganContratosAtasPage() {
  const [contracts, setContracts] = useState<AgencyContract[]>([]);
  const [atas, setAtas] = useState<AgencyContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"CONTRACT" | "ARP">("CONTRACT");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AgencyContract | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AgencyContract | undefined>();
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([organApi.contracts("CONTRACT"), organApi.contracts("ARP")])
      .then(([c, a]) => { setContracts(c); setAtas(a); })
      .catch(() => setError("Não foi possível carregar os dados."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const isArp = tab === "ARP";
  const source = isArp ? atas : contracts;

  const filtered = source.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch = !search ||
      c.title.toLowerCase().includes(q) ||
      c.contractNumber.toLowerCase().includes(q) ||
      (c.supplierName ?? "").toLowerCase().includes(q);
    const matchStatus = !statusFilter || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const byStatus = (arr: AgencyContract[], s: string) => arr.filter((c) => c.status === s).length;
  const totalValue = (arr: AgencyContract[]) => arr.reduce((s, c) => s + (c.totalValueCents ? Number(c.totalValueCents) : 0), 0);

  const handleSaved = (saved: AgencyContract) => {
    const setter = saved.recordType === "ARP" ? setAtas : setContracts;
    setter((prev) => {
      const idx = prev.findIndex((c) => c.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setFormOpen(false); setEditTarget(undefined);
    setToast(editTarget ? "Atualizado!" : "Criado com sucesso!");
  };

  const handleDeleted = (id: string) => {
    setContracts((p) => p.filter((c) => c.id !== id));
    setAtas((p) => p.filter((c) => c.id !== id));
    setDeleteOpen(false); setToast("Excluído.");
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AssignmentTurnedInIcon /> Contratos e Atas
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie contratos administrativos e atas de registro de preços
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(undefined); setFormOpen(true); }}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {isArp ? "Nova ARP" : "Novo Contrato"}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Tabs */}
      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); setSearch(""); setStatusFilter(""); }}
        sx={{
          mb: 2.5,
          borderBottom: "1px solid",
          borderColor: "divider",
          "& .MuiTab-root": { textTransform: "none", fontWeight: 700, fontSize: 14, minHeight: 44 },
        }}
      >
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AssignmentTurnedInIcon fontSize="small" />
              Contratos
              <Chip label={contracts.length} size="small" sx={{ height: 20, fontSize: 11 }} />
            </Box>
          }
          value="CONTRACT"
        />
        <Tab
          label={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ArticleIcon fontSize="small" />
              Atas de Registro de Preço
              <Chip label={atas.length} size="small" sx={{ height: 20, fontSize: 11 }} />
            </Box>
          }
          value="ARP"
        />
      </Tabs>

      {/* Summary */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 2.5 }} flexWrap="wrap" useFlexGap>
        <Badge label="Total" value={source.length} color="#2c3f31" />
        <Badge label="Ativos" value={byStatus(source, "ACTIVE")} color="#4caf50" />
        <Badge label="Vencendo" value={byStatus(source, "EXPIRING")} color="#f57c00" />
        <Badge label="Expirados" value={byStatus(source, "EXPIRED")} color="#d32f2f" />
        <Box sx={{ px: 2.5, py: 1.25, bgcolor: "#1976d210", borderRadius: 2, border: "1px solid #1976d230" }}>
          <Typography variant="body2" fontWeight={800} color="#1976d2">
            {currency(totalValue(source))}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">Valor Total</Typography>
        </Box>
      </Stack>

      {/* Filters */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ pb: "16px !important" }}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              size="small"
              placeholder={`Buscar ${isArp ? "ARP" : "contratos"}...`}
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
        {loading
          ? <Box sx={{ p: 4, textAlign: "center" }}><CircularProgress size={32} /></Box>
          : <RecordsTable
              items={filtered}
              isArp={isArp}
              onEdit={(c) => { setEditTarget(c); setFormOpen(true); }}
              onDelete={(c) => { setDeleteTarget(c); setDeleteOpen(true); }}
            />}
      </Card>

      {!loading && filtered.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: "block", textAlign: "right" }}>
          {filtered.length} de {source.length} registros
        </Typography>
      )}

      <FormDialog
        open={formOpen}
        initial={editTarget}
        recordType={tab}
        onClose={() => { setFormOpen(false); setEditTarget(undefined); }}
        onSaved={handleSaved}
      />
      <DeleteDialog
        open={deleteOpen}
        item={deleteTarget}
        onClose={() => setDeleteOpen(false)}
        onDeleted={handleDeleted}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}
