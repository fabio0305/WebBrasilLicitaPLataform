import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Autocomplete,
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
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Skeleton,
  Snackbar,
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
import PeopleIcon from "@mui/icons-material/People";
import BusinessIcon from "@mui/icons-material/Business";
import GavelIcon from "@mui/icons-material/Gavel";
import ArticleIcon from "@mui/icons-material/Article";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LinkIcon from "@mui/icons-material/Link";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import AddIcon from "@mui/icons-material/Add";
import RefreshIcon from "@mui/icons-material/Refresh";
import SendIcon from "@mui/icons-material/Send";
import NotificationsIcon from "@mui/icons-material/Notifications";
import MarkEmailReadIcon from "@mui/icons-material/MarkEmailRead";
import MarkEmailUnreadIcon from "@mui/icons-material/MarkEmailUnread";
import ForumIcon from "@mui/icons-material/Forum";
import SecurityIcon from "@mui/icons-material/Security";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { adminApi } from "../api/client";
import type { AdminStats, AdminUser, AdminAgency, AdminContract, AdminPasswordRecovery, AdminRole, PlatformNotification, NotificationReply } from "../data/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  AGENCY_ADMIN: "Adm. Órgão",
  AUCTIONEER: "Pregoeiro",
  AUTHORITY: "Assessor Jur.",
  PUBLIC_AGENCY: "Órgão Público",
  SUPPORT: "Suporte",
  SUPPLIER: "Fornecedor",
  CITIZEN: "Cidadão",
};

const ONBOARDING_LABELS: Record<string, string> = {
  APPROVED: "Aprovado",
  PENDING: "Pendente",
  REJECTED: "Rejeitado",
};

const STATUS_COLORS: Record<string, "default" | "success" | "error" | "warning" | "primary"> = {
  APPROVED: "success",
  PENDING: "warning",
  REJECTED: "error",
  ACTIVE: "success",
  EXPIRED: "error",
  TERMINATED: "error",
  OPEN: "success",
  CLOSED: "error",
  DRAFT: "default",
  SCHEDULED: "primary",
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function fmtDateTime(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR");
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color = "#2c3f31", subtitle }: {
  label: string; value: number | string; icon: React.ReactNode; color?: string; subtitle?: string;
}) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
        <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: `${color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Box sx={{ color }}>{icon}</Box>
        </Box>
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
          {subtitle && <Typography variant="caption" color="text.disabled">{subtitle}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    adminApi.stats()
      .then(setStats)
      .catch(() => setError("Erro ao carregar estatísticas."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return (
    <Grid container spacing={2}>
      {[...Array(6)].map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={96} /></Grid>)}
    </Grid>
  );

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button startIcon={<RefreshIcon />} size="small" onClick={load}>Atualizar</Button>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Usuários Totais" value={stats?.totalUsers ?? 0} icon={<PeopleIcon />} color="#2c3f31" subtitle={`${stats?.activeUsers ?? 0} ativos`} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Aprovações Pendentes" value={stats?.pendingOnboarding ?? 0} icon={<HourglassEmptyIcon />} color="#f57c00" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Órgãos Cadastrados" value={stats?.totalAgencies ?? 0} icon={<BusinessIcon />} color="#1976d2" subtitle={`${stats?.activeAgencies ?? 0} ativos`} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Total de Pregões" value={stats?.totalAuctions ?? 0} icon={<GavelIcon />} color="#4caf50" subtitle={`${stats?.openAuctions ?? 0} em disputa`} />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard label="Contratos" value={stats?.totalContracts ?? 0} icon={<ArticleIcon />} color="#9c27b0" />
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Password requirements helper ─────────────────────────────────────────────

const PWD_RULES = [
  { label: "Mínimo 8 caracteres",     test: (p: string) => p.length >= 8 },
  { label: "1 letra maiúscula",        test: (p: string) => /[A-Z]/.test(p) },
  { label: "1 letra minúscula",        test: (p: string) => /[a-z]/.test(p) },
  { label: "1 número",                 test: (p: string) => /[0-9]/.test(p) },
  { label: "1 caractere especial",     test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function isStrongPwd(p: string) { return PWD_RULES.every(r => r.test(p)); }

function PwdRequirements({ password }: { password: string }) {
  if (!password) return null;
  return (
    <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.4 }}>
      {PWD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <Box key={r.label} sx={{ display: "flex", alignItems: "center", gap: 0.8, fontSize: 12 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: ok ? "success.main" : "error.main", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Box component="span" sx={{ color: "white", fontSize: 9, fontWeight: 900 }}>{ok ? "✓" : "×"}</Box>
            </Box>
            <Box component="span" sx={{ color: ok ? "success.dark" : "error.main" }}>{r.label}</Box>
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────

const ORG_ROLES = ["PUBLIC_AGENCY", "AGENCY_ADMIN", "AUCTIONEER", "AUTHORITY", "SUPPORT", "SUPPLIER", "CITIZEN"] as const;
const ORG_ROLES_NEEDING_AGENCY = new Set(["PUBLIC_AGENCY", "AGENCY_ADMIN", "AUCTIONEER", "AUTHORITY"]);

function CreateUserDialog({ agencies, open, onClose, onCreated }: {
  agencies: AdminAgency[]; open: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "PUBLIC_AGENCY", agencyId: "", cpf: "", phone: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleClose = () => {
    setForm({ name: "", email: "", password: "", role: "PUBLIC_AGENCY", agencyId: "", cpf: "", phone: "" });
    setError("");
    onClose();
  };

  const needsAgency = ORG_ROLES_NEEDING_AGENCY.has(form.role);

  const save = async () => {
    if (!form.name.trim()) { setError("Nome é obrigatório."); return; }
    if (!form.email.includes("@")) { setError("E-mail inválido."); return; }
    if (!form.password) { setError("Senha é obrigatória."); return; }
    if (!isStrongPwd(form.password)) { setError("A senha não atende aos requisitos mínimos."); return; }
    setSaving(true);
    setError("");
    try {
      await adminApi.createUser({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        agencyId: form.agencyId || null,
        cpf: form.cpf || undefined,
        phone: form.phone || undefined,
      });
      onCreated();
      handleClose();
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("EMAIL_ALREADY_EXISTS")) setError("Este e-mail já está em uso.");
      else if (msg.includes("WEAK_PASSWORD")) setError("A senha não atende aos requisitos mínimos.");
      else setError("Erro ao criar usuário. Verifique os dados e tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <AddIcon fontSize="small" /> Criar Usuário
      </DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField label="Nome completo *" value={form.name} onChange={(e) => set("name", e.target.value)} fullWidth size="small" autoFocus />
        <TextField label="E-mail *" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} fullWidth size="small" />
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField label="CPF" value={form.cpf} onChange={(e) => set("cpf", e.target.value)} fullWidth size="small" placeholder="000.000.000-00" />
          <TextField label="Telefone" value={form.phone} onChange={(e) => set("phone", e.target.value)} fullWidth size="small" placeholder="(11) 99999-9999" />
        </Box>

        <FormControl fullWidth size="small">
          <InputLabel>Perfil *</InputLabel>
          <Select value={form.role} label="Perfil *" onChange={(e) => set("role", e.target.value)}>
            {ORG_ROLES.map((r) => <MenuItem key={r} value={r}>{ROLE_LABELS[r] ?? r}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Órgão{needsAgency ? " *" : ""}</InputLabel>
          <Select value={form.agencyId} label={`Órgão${needsAgency ? " *" : ""}`} onChange={(e) => set("agencyId", e.target.value)}>
            <MenuItem value="">— Nenhum —</MenuItem>
            {agencies.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </Select>
        </FormControl>

        <Divider sx={{ my: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LockResetIcon sx={{ fontSize: 14 }} /> Senha
          </Typography>
        </Divider>

        <TextField
          label="Senha *"
          type={showPwd ? "text" : "password"}
          value={form.password}
          onChange={(e) => { set("password", e.target.value); setError(""); }}
          fullWidth
          size="small"
          InputProps={{
            endAdornment: (
              <IconButton size="small" onClick={() => setShowPwd((v) => !v)} tabIndex={-1} edge="end">
                {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            ),
          }}
        />
        <PwdRequirements password={form.password} />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving || !form.name || !form.email || !isStrongPwd(form.password)}
          startIcon={saving ? <CircularProgress size={14} color="inherit" /> : undefined}
        >
          Criar Usuário
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function EditUserDialog({ user, agencies, open, onClose, onSaved }: {
  user: AdminUser; agencies: AdminAgency[]; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [agencyId, setAgencyId] = useState(user.agencyId ?? "");
  const [active, setActive] = useState(user.active);
  const [newPassword, setNewPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (newPassword && !isStrongPwd(newPassword)) {
      setError("A nova senha não atende aos requisitos mínimos.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminApi.updateUser(user.id, {
        role,
        agencyId: agencyId || null,
        active,
        ...(newPassword ? { password: newPassword } : {}),
      });
      onSaved();
      onClose();
    } catch {
      setError("Erro ao salvar usuário.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Usuário</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}

        <TextField label="Nome" value={user.name} disabled fullWidth size="small" />
        <TextField label="E-mail" value={user.email} disabled fullWidth size="small" />

        <FormControl fullWidth size="small">
          <InputLabel>Perfil</InputLabel>
          <Select value={role} label="Perfil" onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ROLE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Órgão</InputLabel>
          <Select value={agencyId} label="Órgão" onChange={(e) => setAgencyId(e.target.value)}>
            <MenuItem value="">— Nenhum —</MenuItem>
            {agencies.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl fullWidth size="small">
          <InputLabel>Status</InputLabel>
          <Select value={active ? "true" : "false"} label="Status" onChange={(e) => setActive(e.target.value === "true")}>
            <MenuItem value="true">Ativo</MenuItem>
            <MenuItem value="false">Inativo</MenuItem>
          </Select>
        </FormControl>

        <Divider sx={{ my: 0.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <LockResetIcon sx={{ fontSize: 14 }} /> Nova senha (opcional)
          </Typography>
        </Divider>

        <TextField
          label="Nova senha"
          type={showPwd ? "text" : "password"}
          value={newPassword}
          onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
          fullWidth
          size="small"
          placeholder="Deixe em branco para não alterar"
          InputProps={{
            endAdornment: (
              <IconButton size="small" onClick={() => setShowPwd(v => !v)} tabIndex={-1} edge="end">
                {showPwd ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
              </IconButton>
            ),
          }}
        />
        <PwdRequirements password={newPassword} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={save}
          disabled={saving || (!!newPassword && !isStrongPwd(newPassword))}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DeleteUserDialog({ user, open, onClose, onDeleted }: {
  user: AdminUser; open: boolean; onClose: () => void; onDeleted: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setDeleting(true);
    setError("");
    try {
      await adminApi.deleteUser(user.id);
      onDeleted();
      onClose();
    } catch (e: unknown) {
      const msg = (e as Error).message ?? "";
      if (msg.includes("CANNOT_DELETE_SELF")) setError("Não é possível excluir seu próprio usuário.");
      else setError("Erro ao excluir usuário. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "error.main", display: "flex", alignItems: "center", gap: 1 }}>
        <DeleteIcon fontSize="small" /> Excluir Usuário
      </DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="body2">
          Tem certeza que deseja excluir <strong>{user.name}</strong>?
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {user.email}
        </Typography>
        <Alert severity="warning" sx={{ mt: 2 }} icon={false}>
          Esta ação é <strong>irreversível</strong>. Todos os dados do usuário serão removidos permanentemente.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={deleting}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
          {deleting ? <CircularProgress size={18} color="inherit" /> : "Excluir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [agencies, setAgencies] = useState<AdminAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminApi.users(), adminApi.agencies()])
      .then(([u, a]) => { setUsers(u.users); setAgencies(a.agencies); })
      .catch(() => setError("Erro ao carregar usuários."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = users.filter((u) =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <TextField size="small" placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 400 }} />
        <Button startIcon={<AddIcon />} variant="contained" size="small" onClick={() => setCreateOpen(true)}>Criar Usuário</Button>
        <Button startIcon={<RefreshIcon />} size="small" onClick={load}>Atualizar</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Perfil</TableCell>
                <TableCell>Órgão</TableCell>
                <TableCell>Onboarding</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Cadastro</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{u.email}</TableCell>
                  <TableCell><Chip label={ROLE_LABELS[u.role] ?? u.role} size="small" /></TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{u.agency?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Chip
                      label={ONBOARDING_LABELS[u.onboardingStatus] ?? u.onboardingStatus}
                      color={STATUS_COLORS[u.onboardingStatus] ?? "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip label={u.active ? "Ativo" : "Inativo"} color={u.active ? "success" : "default"} size="small" />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{fmtDate(u.createdAt)}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="Editar / Alterar senha">
                      <IconButton size="small" onClick={() => setEditUser(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir usuário">
                      <IconButton size="small" color="error" onClick={() => setDeleteUser(u)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>Nenhum usuário encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <CreateUserDialog
        agencies={agencies}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => { load(); setToast("Usuário criado com sucesso."); }}
      />

      {editUser && (
        <EditUserDialog
          user={editUser}
          agencies={agencies}
          open={Boolean(editUser)}
          onClose={() => setEditUser(null)}
          onSaved={() => { load(); setToast("Usuário atualizado com sucesso."); }}
        />
      )}

      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          open={Boolean(deleteUser)}
          onClose={() => setDeleteUser(null)}
          onDeleted={() => { load(); setToast("Usuário excluído com sucesso."); }}
        />
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}

// ─── Onboarding Tab ───────────────────────────────────────────────────────────

function OnboardingTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [agencies, setAgencies] = useState<AdminAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [decideUser, setDecideUser] = useState<AdminUser | null>(null);
  const [decideAgencyId, setDecideAgencyId] = useState("");
  const [decideSaving, setDecideSaving] = useState(false);
  const [decideAction, setDecideAction] = useState<"APPROVED" | "REJECTED">("APPROVED");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminApi.onboarding({ status: "PENDING" }), adminApi.agencies()])
      .then(([o, a]) => { setUsers(o.users); setAgencies(a.agencies); })
      .catch(() => setError("Erro ao carregar aprovações pendentes."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDecide = (u: AdminUser, action: "APPROVED" | "REJECTED") => {
    setDecideUser(u);
    setDecideAction(action);
    setDecideAgencyId("");
  };

  const confirmDecide = async () => {
    if (!decideUser) return;
    setDecideSaving(true);
    try {
      await adminApi.decideOnboarding(decideUser.id, decideAction, decideAgencyId || undefined);
      setToast(`Usuário ${decideAction === "APPROVED" ? "aprovado" : "rejeitado"} com sucesso.`);
      setDecideUser(null);
      load();
    } catch {
      setToast("Erro ao processar decisão.");
    } finally {
      setDecideSaving(false);
    }
  };

  const needsAgency = decideAction === "APPROVED" && ["AGENCY_ADMIN", "AUCTIONEER", "AUTHORITY", "PUBLIC_AGENCY"].includes(decideUser?.requestedRole ?? "");

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button startIcon={<RefreshIcon />} size="small" onClick={load}>Atualizar</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : users.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
          <CheckCircleIcon sx={{ fontSize: 48, mb: 1, color: "success.light" }} />
          <Typography>Nenhum cadastro pendente de aprovação.</Typography>
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>E-mail</TableCell>
                <TableCell>Perfil Solicitado</TableCell>
                <TableCell>Cadastro</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((u) => {
                const profileKey = u.requestedRole ?? u.role;
                const profileLabel = ROLE_LABELS[profileKey ?? ""] ?? profileKey ?? "—";
                return (
                <TableRow key={u.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{u.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={profileLabel}
                      size="small"
                      color={profileKey === "CITIZEN" ? "default" : "primary"}
                      variant={profileKey === "CITIZEN" ? "outlined" : "filled"}
                    />
                  </TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{fmtDateTime(u.createdAt)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Aprovar">
                      <IconButton size="small" color="success" onClick={() => openDecide(u, "APPROVED")}><CheckCircleIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Rejeitar">
                      <IconButton size="small" color="error" onClick={() => openDecide(u, "REJECTED")}><CancelIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}

      {/* Decision dialog */}
      <Dialog open={Boolean(decideUser)} onClose={() => setDecideUser(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {decideAction === "APPROVED" ? "Aprovar Cadastro" : "Rejeitar Cadastro"}
        </DialogTitle>
        <DialogContent sx={{ pt: "12px !important", display: "flex", flexDirection: "column", gap: 2 }}>
          <Typography variant="body2">
            Usuário: <strong>{decideUser?.name}</strong> ({decideUser?.email})
          </Typography>
          {needsAgency && (
            <FormControl fullWidth size="small">
              <InputLabel>Órgão *</InputLabel>
              <Select value={decideAgencyId} label="Órgão *" onChange={(e) => setDecideAgencyId(e.target.value)}>
                <MenuItem value="">— Selecione —</MenuItem>
                {agencies.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDecideUser(null)} disabled={decideSaving}>Cancelar</Button>
          <Button
            variant="contained"
            color={decideAction === "APPROVED" ? "success" : "error"}
            onClick={confirmDecide}
            disabled={decideSaving || (needsAgency && !decideAgencyId)}
          >
            {decideSaving ? <CircularProgress size={18} color="inherit" /> : (decideAction === "APPROVED" ? "Aprovar" : "Rejeitar")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}

// ─── Agencies Tab ─────────────────────────────────────────────────────────────

const SPHERE_OPTIONS = [
  { value: "FEDERAL", label: "Federal" },
  { value: "ESTADUAL", label: "Estadual" },
  { value: "MUNICIPAL", label: "Municipal" },
];

const FRAMEWORK_OPTIONS = [
  { value: "LEI_8666", label: "Lei 8.666/93" },
  { value: "LEI_14133", label: "Lei 14.133/21" },
  { value: "LEI_13303", label: "Lei 13.303/16" },
];

function AgencyFormDialog({ agency, open, onClose, onSaved }: {
  agency?: AdminAgency; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = Boolean(agency);
  const [form, setForm] = useState({
    name: agency?.name ?? "",
    officialName: agency?.officialName ?? "",
    cnpj: agency?.cnpj ?? "",
    code: agency?.code ?? "",
    city: agency?.city ?? "",
    state: agency?.state ?? "",
    sphere: agency?.sphere ?? "",
    legalFramework: agency?.legalFramework ?? "",
    active: agency?.active !== false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      if (isEdit && agency) {
        await adminApi.updateAgency(agency.id, form);
      } else {
        await adminApi.createAgency(form);
      }
      onSaved();
      onClose();
    } catch {
      setError("Erro ao salvar órgão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Editar Órgão" : "Novo Órgão"}</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Nome *" value={form.name} onChange={(e) => set("name", e.target.value)} fullWidth size="small" />
        <TextField label="Razão Social" value={form.officialName} onChange={(e) => set("officialName", e.target.value)} fullWidth size="small" />
        <TextField label="CNPJ" value={form.cnpj} onChange={(e) => set("cnpj", e.target.value)} fullWidth size="small" />
        <TextField label="Código" value={form.code} onChange={(e) => set("code", e.target.value)} fullWidth size="small" />
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField label="Cidade" value={form.city} onChange={(e) => set("city", e.target.value)} fullWidth size="small" />
          <TextField label="UF" value={form.state} onChange={(e) => set("state", e.target.value)} fullWidth size="small" inputProps={{ maxLength: 2 }} />
        </Box>
        <FormControl fullWidth size="small">
          <InputLabel>Esfera</InputLabel>
          <Select value={form.sphere} label="Esfera" onChange={(e) => set("sphere", e.target.value)}>
            <MenuItem value="">— Selecione —</MenuItem>
            {SPHERE_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth size="small">
          <InputLabel>Marco Legal</InputLabel>
          <Select value={form.legalFramework} label="Marco Legal" onChange={(e) => set("legalFramework", e.target.value)}>
            <MenuItem value="">— Selecione —</MenuItem>
            {FRAMEWORK_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
          </Select>
        </FormControl>
        {isEdit && (
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select value={form.active ? "true" : "false"} label="Status" onChange={(e) => set("active", e.target.value === "true")}>
              <MenuItem value="true">Ativo</MenuItem>
              <MenuItem value="false">Inativo</MenuItem>
            </Select>
          </FormControl>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={save} disabled={saving || !form.name}>
          {saving ? <CircularProgress size={18} color="inherit" /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AgenciesTab() {
  const [agencies, setAgencies] = useState<AdminAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ open: boolean; agency?: AdminAgency }>({ open: false });

  const load = useCallback(() => {
    setLoading(true);
    adminApi.agencies()
      .then((r) => setAgencies(r.agencies))
      .catch(() => setError("Erro ao carregar órgãos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = agencies.filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || (a.cnpj ?? "").includes(search)
  );

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <TextField size="small" placeholder="Buscar por nome ou CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 400 }} />
        <Button startIcon={<RefreshIcon />} size="small" onClick={load}>Atualizar</Button>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setDialog({ open: true })}>Novo Órgão</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nome</TableCell>
                <TableCell>CNPJ</TableCell>
                <TableCell>Cidade/UF</TableCell>
                <TableCell>Esfera</TableCell>
                <TableCell>Marco Legal</TableCell>
                <TableCell>Membros</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{a.name}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{a.cnpj ?? "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{a.city && a.state ? `${a.city}/${a.state}` : "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{a.sphere ?? "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{a.legalFramework ?? "—"}</TableCell>
                  <TableCell>{(a as { userCount?: number }).userCount ?? "—"}</TableCell>
                  <TableCell><Chip label={a.active ? "Ativo" : "Inativo"} color={a.active ? "success" : "default"} size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => setDialog({ open: true, agency: a })}><EditIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>Nenhum órgão encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <AgencyFormDialog
        open={dialog.open}
        agency={dialog.agency}
        onClose={() => setDialog({ open: false })}
        onSaved={load}
      />
    </Box>
  );
}

// ─── Contracts Tab ────────────────────────────────────────────────────────────

function ContractFormDialog({ agencies, open, onClose, onSaved }: {
  agencies: AdminAgency[]; open: boolean; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ agencyId: "", contractNumber: "", title: "", supplierName: "", managerName: "", startsAt: "", endsAt: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      await adminApi.createContract(form);
      onSaved();
      onClose();
    } catch {
      setError("Erro ao salvar contrato.");
    } finally {
      setSaving(false);
    }
  };

  const valid = form.agencyId && form.contractNumber && form.title && form.startsAt && form.endsAt;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Novo Contrato</DialogTitle>
      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "16px !important" }}>
        {error && <Alert severity="error">{error}</Alert>}
        <FormControl fullWidth size="small">
          <InputLabel>Órgão *</InputLabel>
          <Select value={form.agencyId} label="Órgão *" onChange={(e) => set("agencyId", e.target.value)}>
            <MenuItem value="">— Selecione —</MenuItem>
            {agencies.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField label="Nº do Contrato *" value={form.contractNumber} onChange={(e) => set("contractNumber", e.target.value)} fullWidth size="small" />
        <TextField label="Título *" value={form.title} onChange={(e) => set("title", e.target.value)} fullWidth size="small" />
        <TextField label="Fornecedor" value={form.supplierName} onChange={(e) => set("supplierName", e.target.value)} fullWidth size="small" />
        <TextField label="Gestor" value={form.managerName} onChange={(e) => set("managerName", e.target.value)} fullWidth size="small" />
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField label="Início *" type="date" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
          <TextField label="Fim *" type="date" value={form.endsAt} onChange={(e) => set("endsAt", e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="contained" onClick={save} disabled={saving || !valid}>
          {saving ? <CircularProgress size={18} color="inherit" /> : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ContractsTab() {
  const [contracts, setContracts] = useState<AdminContract[]>([]);
  const [agencies, setAgencies] = useState<AdminAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([adminApi.contracts(), adminApi.agencies()])
      .then(([c, a]) => { setContracts(c.contracts); setAgencies(a.agencies); })
      .catch(() => setError("Erro ao carregar contratos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const agencyMap = Object.fromEntries(agencies.map((a) => [a.id, a.name]));

  const filtered = contracts.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.contractNumber.includes(search)
  );

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 2, alignItems: "center" }}>
        <TextField size="small" placeholder="Buscar por título ou número..." value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, maxWidth: 400 }} />
        <Button startIcon={<RefreshIcon />} size="small" onClick={load}>Atualizar</Button>
        <Button variant="contained" startIcon={<AddIcon />} size="small" onClick={() => setDialogOpen(true)}>Novo Contrato</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Nº</TableCell>
                <TableCell>Título</TableCell>
                <TableCell>Órgão</TableCell>
                <TableCell>Fornecedor</TableCell>
                <TableCell>Início</TableCell>
                <TableCell>Fim</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontSize: 13, fontFamily: "monospace" }}>{c.contractNumber}</TableCell>
                  <TableCell sx={{ fontWeight: 600, maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{agencyMap[c.agencyId] ?? "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{c.supplierName ?? "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{fmtDate(c.startsAt)}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{fmtDate(c.endsAt)}</TableCell>
                  <TableCell><Chip label={c.status} color={STATUS_COLORS[c.status] ?? "default"} size="small" /></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 3, color: "text.secondary" }}>Nenhum contrato encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <ContractFormDialog
        open={dialogOpen}
        agencies={agencies}
        onClose={() => setDialogOpen(false)}
        onSaved={load}
      />
    </Box>
  );
}

// ─── Password Recovery Tab ────────────────────────────────────────────────────

const RECOVERY_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  LINK_READY: "Link Gerado",
  EMAIL_SENT: "E-mail Enviado",
  RESOLVED: "Resolvido",
  EXPIRED: "Expirado",
};

function PasswordRecoveryTab() {
  const [requests, setRequests] = useState<AdminPasswordRecovery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [link, setLink] = useState<{ id: string; url: string } | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.passwordRecovery()
      .then((r) => setRequests(r.requests))
      .catch(() => setError("Erro ao carregar solicitações."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const issueLink = async (id: string, sendEmail: boolean) => {
    try {
      const res = await adminApi.issueRecoveryLink(id, sendEmail);
      if (!sendEmail) setLink({ id, url: res.link });
      setToast(sendEmail ? "E-mail enviado com sucesso." : "Link gerado.");
      load();
    } catch {
      setToast("Erro ao gerar link.");
    }
  };

  const markResolved = async (id: string) => {
    try {
      await adminApi.updateRecovery(id, "RESOLVED");
      setToast("Marcado como resolvido.");
      load();
    } catch {
      setToast("Erro ao atualizar.");
    }
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button startIcon={<RefreshIcon />} size="small" onClick={load}>Atualizar</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Link dialog */}
      {link && (
        <Alert severity="info" sx={{ mb: 2 }} onClose={() => setLink(null)}>
          <Typography variant="body2" fontWeight={700} gutterBottom>Link de recuperação gerado:</Typography>
          <Box sx={{ fontFamily: "monospace", fontSize: 13, wordBreak: "break-all", bgcolor: "#f5f5f5", p: 1, borderRadius: 1 }}>{link.url}</Box>
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ overflowX: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>CPF</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Canal</TableCell>
                <TableCell>Solicitado em</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {requests.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell sx={{ fontSize: 13, fontFamily: "monospace" }}>{r.cpfNormalized ?? "—"}</TableCell>
                  <TableCell><Chip label={RECOVERY_STATUS_LABELS[r.status] ?? r.status} color={STATUS_COLORS[r.status] ?? "default"} size="small" /></TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{r.deliveryChannel ?? "—"}</TableCell>
                  <TableCell sx={{ fontSize: 13 }}>{fmtDateTime(r.createdAt)}</TableCell>
                  <TableCell align="right">
                    {r.status === "PENDING" && <>
                      <Tooltip title="Gerar Link Manual">
                        <IconButton size="small" onClick={() => issueLink(r.id, false)}><LinkIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Enviar por E-mail">
                        <IconButton size="small" onClick={() => issueLink(r.id, true)}>
                          <CheckCircleIcon fontSize="small" color="primary" />
                        </IconButton>
                      </Tooltip>
                    </>}
                    {["PENDING", "LINK_READY", "EMAIL_SENT"].includes(r.status) && (
                      <Tooltip title="Marcar como Resolvido">
                        <IconButton size="small" color="success" onClick={() => markResolved(r.id)}><CheckCircleIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {requests.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: "text.secondary" }}>Nenhuma solicitação encontrada.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      )}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}

// ─── Roles Tab ────────────────────────────────────────────────────────────────

function RolesTab() {
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.roles()
      .then((r) => setRoles(r.roles))
      .catch(() => setError("Erro ao carregar perfis."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={2}>
          {roles.map((role) => (
            <Grid item xs={12} sm={6} md={4} key={role.id}>
              <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={700}>{role.name}</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>{role.key}</Typography>
                  {role.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>{role.description}</Typography>
                  )}
                  <Divider sx={{ mb: 1 }} />
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                    {role.permissions.length} permissão(ões)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                    {role.permissions.map((p) => (
                      <Chip key={p.id} label={p.key} size="small" variant="outlined" sx={{ fontSize: 11 }} />
                    ))}
                    {role.permissions.length === 0 && (
                      <Typography variant="caption" color="text.disabled">Nenhuma permissão.</Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

// ─── Notifications Tab ────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "GERAL", label: "Geral", icon: <InfoOutlinedIcon fontSize="small" />, color: "#1976d2" },
  { value: "FINANCEIRO", label: "Financeiro", icon: <AttachMoneyIcon fontSize="small" />, color: "#e65100" },
  { value: "SEGURANCA", label: "Segurança", icon: <SecurityIcon fontSize="small" />, color: "#c62828" },
  { value: "PREGAO", label: "Pregão", icon: <GavelOutlinedIcon fontSize="small" />, color: "#2c3f31" },
  { value: "DOCUMENTOS", label: "Documentos", icon: <DescriptionOutlinedIcon fontSize="small" />, color: "#6a1b9a" },
];

const TARGET_OPTIONS = [
  { value: "ALL", label: "Todos os usuários" },
  { value: "CITIZEN", label: "Cidadãos" },
  { value: "SUPPLIER", label: "Fornecedores" },
  { value: "AGENCY_ADMIN", label: "Administradores de Órgão" },
  { value: "AUCTIONEER", label: "Pregoeiros" },
  { value: "SUPPORT", label: "Suporte" },
];

function categoryMeta(cat: string) {
  return CATEGORY_OPTIONS.find((c) => c.value === cat) ?? CATEGORY_OPTIONS[0];
}

// ─── Reply Management Dialog ──────────────────────────────────────────────────

function RepliesDialog({
  open,
  notification,
  onClose,
}: {
  open: boolean;
  notification: PlatformNotification | null;
  onClose: () => void;
}) {
  const [replies, setReplies] = useState<NotificationReply[]>([]);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !notification) return;
    setLoading(true);
    adminApi.notificationReplies(notification.id)
      .then(setReplies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, notification]);

  const handleToggleRead = async (reply: NotificationReply) => {
    setMarking(reply.id);
    try {
      if (reply.readByAdminAt) {
        await adminApi.markReplyUnread(reply.id);
        setReplies((prev) => prev.map((r) => r.id === reply.id ? { ...r, readByAdminAt: null } : r));
      } else {
        await adminApi.markReplyRead(reply.id);
        setReplies((prev) => prev.map((r) => r.id === reply.id ? { ...r, readByAdminAt: new Date().toISOString() } : r));
      }
    } catch { /* ignore */ } finally {
      setMarking(null);
    }
  };

  const markAll = async () => {
    const unread = replies.filter((r) => !r.readByAdminAt);
    for (const r of unread) {
      await adminApi.markReplyRead(r.id);
    }
    setReplies((prev) => prev.map((r) => ({ ...r, readByAdminAt: r.readByAdminAt ?? new Date().toISOString() })));
  };

  const unreadCount = replies.filter((r) => !r.readByAdminAt).length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ForumIcon color="primary" />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} noWrap>
              Respostas ao aviso
            </Typography>
            {notification && (
              <Typography variant="caption" color="text.secondary" noWrap display="block">
                {notification.title}
              </Typography>
            )}
          </Box>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<MarkEmailReadIcon />} onClick={() => void markAll()} sx={{ flexShrink: 0 }}>
              Marcar todas ({unreadCount})
            </Button>
          )}
        </Box>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 0, minHeight: 160 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}><CircularProgress size={28} /></Box>
        ) : replies.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6, color: "text.secondary" }}>
            <ForumIcon sx={{ fontSize: 40, opacity: 0.25, mb: 1 }} />
            <Typography variant="body2">Nenhuma resposta recebida.</Typography>
          </Box>
        ) : (
          replies.map((r, i) => (
            <Box
              key={r.id}
              sx={{
                px: 2.5, py: 2,
                borderBottom: i < replies.length - 1 ? "1px solid" : "none",
                borderColor: "divider",
                bgcolor: r.readByAdminAt ? "transparent" : "warning.50",
                display: "flex", gap: 2, alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.25 }}>
                  <Typography variant="body2" fontWeight={700}>{r.userName}</Typography>
                  {!r.readByAdminAt && (
                    <Chip label="Novo" size="small" color="warning" sx={{ fontSize: 10, height: 18 }} />
                  )}
                  <Typography variant="caption" color="text.disabled" sx={{ ml: "auto" }}>
                    {new Date(r.createdAt).toLocaleString("pt-BR")}
                  </Typography>
                </Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
                  {r.userEmail} · {ROLE_LABELS[r.userRole ?? ""] ?? r.userRole}
                </Typography>
                <Box
                  sx={{
                    p: 1.5, borderRadius: 1.5, bgcolor: "grey.100",
                    border: "1px solid", borderColor: "divider",
                  }}
                >
                  <Typography variant="body2">{r.message}</Typography>
                </Box>
                {r.readByAdminAt && (
                  <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 0.5 }}>
                    Lida em {new Date(r.readByAdminAt).toLocaleString("pt-BR")}
                  </Typography>
                )}
              </Box>
              <Tooltip title={r.readByAdminAt ? "Marcar como não lida" : "Marcar como lida"}>
                <IconButton
                  size="small"
                  disabled={marking === r.id}
                  onClick={() => void handleToggleRead(r)}
                  sx={{ mt: 0.5, flexShrink: 0 }}
                >
                  {r.readByAdminAt
                    ? <MarkEmailUnreadIcon fontSize="small" color="action" />
                    : <MarkEmailReadIcon fontSize="small" color="success" />}
                </IconButton>
              </Tooltip>
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── All Replies Inbox ────────────────────────────────────────────────────────

function RepliesInboxTab() {
  const [replies, setReplies] = useState<NotificationReply[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    adminApi.allReplies()
      .then(setReplies)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleRead = async (reply: NotificationReply) => {
    setMarking(reply.id);
    try {
      if (reply.readByAdminAt) {
        await adminApi.markReplyUnread(reply.id);
        setReplies((prev) => prev.map((r) => r.id === reply.id ? { ...r, readByAdminAt: null } : r));
      } else {
        await adminApi.markReplyRead(reply.id);
        setReplies((prev) => prev.map((r) => r.id === reply.id ? { ...r, readByAdminAt: new Date().toISOString() } : r));
      }
    } catch { /* ignore */ } finally {
      setMarking(null);
    }
  };

  const markAll = async () => {
    const unread = replies.filter((r) => !r.readByAdminAt);
    for (const r of unread) await adminApi.markReplyRead(r.id);
    setReplies((prev) => prev.map((r) => ({ ...r, readByAdminAt: r.readByAdminAt ?? new Date().toISOString() })));
  };

  const unreadCount = replies.filter((r) => !r.readByAdminAt).length;

  const catColor: Record<string, string> = {
    FINANCEIRO: "#e65100", SEGURANCA: "#c62828", PREGAO: "#2c3f31", DOCUMENTOS: "#6a1b9a", GERAL: "#1976d2",
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ForumIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>Caixa de Respostas</Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} não lida(s)`} size="small" color="warning" />
          )}
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          {unreadCount > 0 && (
            <Button size="small" startIcon={<MarkEmailReadIcon />} onClick={() => void markAll()}>
              Marcar todas
            </Button>
          )}
          <Tooltip title="Atualizar">
            <IconButton size="small" onClick={load}><RefreshIcon fontSize="small" /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress size={28} /></Box>
      ) : replies.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, color: "text.secondary" }}>
          <ForumIcon sx={{ fontSize: 48, opacity: 0.25, mb: 1 }} />
          <Typography variant="body2">Nenhuma resposta recebida ainda.</Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {replies.map((r) => (
            <Box
              key={r.id}
              sx={{
                p: 2, borderRadius: 2,
                border: "1px solid", borderColor: "divider",
                bgcolor: r.readByAdminAt ? "grey.50" : "warning.50",
                display: "flex", gap: 2, alignItems: "flex-start",
              }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                  <Typography variant="body2" fontWeight={700}>{r.userName}</Typography>
                  <Typography variant="caption" color="text.secondary">({r.userEmail})</Typography>
                  {!r.readByAdminAt && <Chip label="Novo" size="small" color="warning" sx={{ fontSize: 10, height: 18 }} />}
                  <Chip
                    label={r.notificationTitle ?? "Aviso"}
                    size="small"
                    sx={{
                      bgcolor: `${catColor[r.notificationCategory ?? "GERAL"] ?? "#1976d2"}15`,
                      color: catColor[r.notificationCategory ?? "GERAL"] ?? "#1976d2",
                      fontWeight: 600, fontSize: 10, height: 18, ml: "auto",
                    }}
                  />
                </Box>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: "white", border: "1px solid", borderColor: "divider", mb: 0.5 }}>
                  <Typography variant="body2">{r.message}</Typography>
                </Box>
                <Typography variant="caption" color="text.disabled">
                  {new Date(r.createdAt).toLocaleString("pt-BR")}
                  {r.readByAdminAt && ` · Lida em ${new Date(r.readByAdminAt).toLocaleString("pt-BR")}`}
                </Typography>
              </Box>
              <Tooltip title={r.readByAdminAt ? "Marcar como não lida" : "Marcar como lida"}>
                <IconButton size="small" disabled={marking === r.id} onClick={() => void handleToggleRead(r)}>
                  {r.readByAdminAt
                    ? <MarkEmailUnreadIcon fontSize="small" color="action" />
                    : <MarkEmailReadIcon fontSize="small" color="success" />}
                </IconButton>
              </Tooltip>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

type TargetMode = "all" | "role" | "user";

interface UserOption { id: string; name: string; email: string; role: string; }

function resolveTargetLabel(n: PlatformNotification): string {
  if (n.targetRole === "USER") {
    return n.targetUserName ? `${n.targetUserName} (${n.targetUserEmail ?? ""})` : "Usuário específico";
  }
  return TARGET_OPTIONS.find((t) => t.value === n.targetRole)?.label ?? n.targetRole;
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [repliesNotif, setRepliesNotif] = useState<PlatformNotification | null>(null);

  // Targeting state
  const [targetMode, setTargetMode] = useState<TargetMode>("all");
  const [selectedRole, setSelectedRole] = useState("CITIZEN");
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  const [form, setForm] = useState({ title: "", message: "", category: "GERAL" });

  const load = useCallback(() => {
    setLoading(true);
    adminApi.notifications()
      .then(setNotifications)
      .catch(() => setError("Erro ao carregar avisos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debounced user search
  useEffect(() => {
    if (targetMode !== "user" || userSearch.length < 2) { setUserOptions([]); return; }
    const t = setTimeout(() => {
      setUserSearchLoading(true);
      adminApi.searchNotificationUsers(userSearch)
        .then(setUserOptions)
        .catch(() => {})
        .finally(() => setUserSearchLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch, targetMode]);

  const buildPayload = () => {
    const base = { ...form };
    if (targetMode === "all") return { ...base, targetRole: "ALL" };
    if (targetMode === "role") return { ...base, targetRole: selectedRole };
    return { ...base, targetUserId: selectedUser?.id ?? null };
  };

  const isSendDisabled = () => {
    if (sending || !form.title.trim() || !form.message.trim()) return true;
    if (targetMode === "user" && !selectedUser) return true;
    return false;
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSendDisabled()) return;
    setSending(true);
    try {
      await adminApi.sendNotification(buildPayload());
      setForm({ title: "", message: "", category: "GERAL" });
      setSelectedUser(null);
      setUserSearch("");
      setToast("Aviso enviado com sucesso!");
      load();
    } catch {
      setError("Erro ao enviar aviso.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteNotification(id);
      setToast("Aviso excluído.");
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError("Erro ao excluir aviso.");
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>{error}</Alert>}

      <Grid container spacing={3}>
        {/* Compose Form */}
        <Grid item xs={12} md={5}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                <NotificationsIcon color="primary" />
                <Typography variant="subtitle1" fontWeight={700}>Novo Aviso</Typography>
              </Box>

              <Box component="form" onSubmit={(e) => { void handleSend(e); }} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  label="Título"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  required size="small" fullWidth
                />

                <TextField
                  label="Mensagem"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required multiline minRows={3} fullWidth
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Categoria</InputLabel>
                  <Select
                    value={form.category}
                    label="Categoria"
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ color: opt.color, display: "flex" }}>{opt.icon}</Box>
                          {opt.label}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* ── Targeting mode ── */}
                <Box sx={{ p: 1.5, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ mb: 0.5, display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}>
                    Destinatário
                  </Typography>
                  <RadioGroup
                    value={targetMode}
                    onChange={(_, v) => { setTargetMode(v as TargetMode); setSelectedUser(null); setUserSearch(""); }}
                    sx={{ gap: 0.25 }}
                  >
                    <FormControlLabel
                      value="all"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">Todos os usuários</Typography>}
                    />
                    <FormControlLabel
                      value="role"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">Por perfil</Typography>}
                    />
                    <FormControlLabel
                      value="user"
                      control={<Radio size="small" />}
                      label={<Typography variant="body2">Usuário específico</Typography>}
                    />
                  </RadioGroup>

                  {targetMode === "role" && (
                    <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                      <InputLabel>Perfil</InputLabel>
                      <Select
                        value={selectedRole}
                        label="Perfil"
                        onChange={(e) => setSelectedRole(e.target.value)}
                      >
                        {TARGET_OPTIONS.filter((o) => o.value !== "ALL").map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  {targetMode === "user" && (
                    <Autocomplete
                      sx={{ mt: 1 }}
                      size="small"
                      options={userOptions}
                      loading={userSearchLoading}
                      value={selectedUser}
                      onChange={(_, v) => setSelectedUser(v)}
                      inputValue={userSearch}
                      onInputChange={(_, v) => setUserSearch(v)}
                      getOptionLabel={(o) => `${o.name} (${o.email})`}
                      isOptionEqualToValue={(a, b) => a.id === b.id}
                      noOptionsText={userSearch.length < 2 ? "Digite pelo menos 2 caracteres..." : "Nenhum usuário encontrado"}
                      renderOption={(props, o) => (
                        <Box component="li" {...props} key={o.id}>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={600} noWrap>{o.name}</Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">{o.email}</Typography>
                          </Box>
                          <Chip label={ROLE_LABELS[o.role] ?? o.role} size="small" sx={{ ml: 1, fontSize: 10 }} />
                        </Box>
                      )}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Buscar usuário"
                          placeholder="Nome, e-mail ou CPF..."
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {userSearchLoading ? <CircularProgress size={14} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                    />
                  )}
                </Box>

                {/* Quick templates */}
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.75, display: "block" }}>
                    Modelos rápidos
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                    {[
                      { label: "Fatura vencendo", cat: "FINANCEIRO", title: "Fatura vencendo", msg: "Sua fatura está prestes a vencer. Regularize seu pagamento para evitar interrupções no acesso à plataforma." },
                      { label: "Doc. irregular", cat: "DOCUMENTOS", title: "Documento irregular ou faltando", msg: "Identificamos que um ou mais documentos da sua conta estão irregulares ou ausentes. Por favor, acesse a plataforma e regularize seus documentos." },
                      { label: "Pregão aberto", cat: "PREGAO", title: "Novo pregão disponível", msg: "Um novo pregão está disponível na plataforma. Acesse agora para verificar as condições e enviar sua proposta." },
                      { label: "Alerta de segurança", cat: "SEGURANCA", title: "Alerta de segurança", msg: "Detectamos atividade incomum na sua conta. Se não foi você, entre em contato com o suporte imediatamente e altere sua senha." },
                    ].map((tmpl) => (
                      <Chip
                        key={tmpl.label}
                        label={tmpl.label}
                        size="small"
                        variant="outlined"
                        clickable
                        onClick={() => setForm((f) => ({ ...f, title: tmpl.title, message: tmpl.msg, category: tmpl.cat }))}
                      />
                    ))}
                  </Box>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
                  disabled={isSendDisabled()}
                  sx={{ alignSelf: "flex-start" }}
                >
                  {sending ? "Enviando..." : "Enviar Aviso"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sent Notifications List */}
        <Grid item xs={12} md={7}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700}>Avisos Enviados</Typography>
                <Tooltip title="Atualizar">
                  <IconButton size="small" onClick={load}><RefreshIcon fontSize="small" /></IconButton>
                </Tooltip>
              </Box>

              {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress size={28} /></Box>
              ) : notifications.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4, color: "text.secondary" }}>
                  <NotificationsIcon sx={{ fontSize: 48, mb: 1, opacity: 0.3 }} />
                  <Typography variant="body2">Nenhum aviso enviado ainda.</Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                  {notifications.map((n) => {
                    const meta = categoryMeta(n.category);
                    const targetLabel = resolveTargetLabel(n);
                    const isPersonal = n.targetRole === "USER";
                    const hasUnreadReplies = (n.unreadReplyCount ?? 0) > 0;
                    return (
                      <Box
                        key={n.id}
                        sx={{ p: 2, borderRadius: 2, border: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}
                      >
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 36, height: 36, borderRadius: 1.5, flexShrink: 0,
                              bgcolor: `${meta.color}18`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: meta.color,
                            }}
                          >
                            {meta.icon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mb: 0.25 }}>
                              <Typography variant="body2" fontWeight={700} noWrap>{n.title}</Typography>
                              <Chip label={meta.label} size="small" sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontWeight: 600, fontSize: 10 }} />
                              <Chip
                                label={isPersonal ? `👤 ${targetLabel}` : targetLabel}
                                size="small"
                                variant="outlined"
                                color={isPersonal ? "primary" : "default"}
                                sx={{ fontSize: 10 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12.5, mb: 0.75 }}>
                              {n.message}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                              <Typography variant="caption" color="text.disabled">
                                {new Date(n.createdAt).toLocaleString("pt-BR")}
                              </Typography>
                              {(n.replyCount ?? 0) > 0 && (
                                <Chip
                                  icon={<ForumIcon sx={{ fontSize: "12px !important" }} />}
                                  label={hasUnreadReplies ? `${n.replyCount} resp. (${n.unreadReplyCount} nova${(n.unreadReplyCount ?? 0) > 1 ? "s" : ""})` : `${n.replyCount} resposta${(n.replyCount ?? 0) > 1 ? "s" : ""}`}
                                  size="small"
                                  color={hasUnreadReplies ? "warning" : "default"}
                                  variant={hasUnreadReplies ? "filled" : "outlined"}
                                  clickable
                                  onClick={() => setRepliesNotif(n)}
                                  sx={{ fontSize: 10, fontWeight: hasUnreadReplies ? 700 : 400 }}
                                />
                              )}
                              {(n.replyCount ?? 0) === 0 && (
                                <Typography variant="caption" color="text.disabled">· sem respostas</Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "flex-end" }}>
                            {(n.replyCount ?? 0) > 0 && (
                              <Tooltip title="Ver respostas">
                                <IconButton size="small" color={hasUnreadReplies ? "warning" : "default"} onClick={() => setRepliesNotif(n)}>
                                  <ForumIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Excluir">
                              <IconButton size="small" color="error" onClick={() => setDeleteId(n.id)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Delete confirm dialog */}
      <Dialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Excluir aviso?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">Esta ação não pode ser desfeita.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={() => deleteId && void handleDelete(deleteId)}>Excluir</Button>
        </DialogActions>
      </Dialog>

      {/* Replies dialog */}
      <RepliesDialog
        open={Boolean(repliesNotif)}
        notification={repliesNotif}
        onClose={() => setRepliesNotif(null)}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { label: "Visão Geral", value: "overview" },
  { label: "Aprovações", value: "onboarding" },
  { label: "Usuários", value: "users" },
  { label: "Órgãos", value: "agencies" },
  { label: "Contratos", value: "contracts" },
  { label: "Recuperação de Senha", value: "recovery" },
  { label: "Perfis & Permissões", value: "roles" },
  { label: "Avisos & Alertas", value: "notifications" },
  { label: "Caixa de Respostas", value: "replies" },
];

export default function AdminDashboardPage() {
  const [tab, setTab] = useState("overview");

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Painel Administrativo</Typography>
        <Typography variant="body2" color="text.secondary">Gestão centralizada da plataforma Licita Brasil</Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {TABS.map((t) => <Tab key={t.value} label={t.label} value={t.value} />)}
        </Tabs>
      </Box>

      {tab === "overview" && <OverviewTab />}
      {tab === "onboarding" && <OnboardingTab />}
      {tab === "users" && <UsersTab />}
      {tab === "agencies" && <AgenciesTab />}
      {tab === "contracts" && <ContractsTab />}
      {tab === "recovery" && <PasswordRecoveryTab />}
      {tab === "roles" && <RolesTab />}
      {tab === "notifications" && <NotificationsTab />}
      {tab === "replies" && <RepliesInboxTab />}
    </Box>
  );
}
