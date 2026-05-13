import React, { useEffect, useState } from "react";
import {
  Alert,
  Badge,
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
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Snackbar,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import GavelIcon from "@mui/icons-material/Gavel";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import VerifiedIcon from "@mui/icons-material/Verified";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import BusinessIcon from "@mui/icons-material/Business";
import StoreIcon from "@mui/icons-material/Store";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EmailIcon from "@mui/icons-material/Email";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useNavigate } from "react-router-dom";
import { dashboardApi, publicApi, auctionsApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { CitizenDashboard, PublicAuction, Denuncia } from "../data/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const MODALITIES = [
  { value: "PREGAO_ELETRONICO", label: "Pregão Eletrônico" },
  { value: "CONCORRENCIA", label: "Concorrência" },
  { value: "TOMADA_PRECOS", label: "Tomada de Preços" },
  { value: "CONVITE", label: "Convite" },
  { value: "LEILAO", label: "Leilão" },
  { value: "CONCURSO", label: "Concurso" },
];

const SEGMENTS = [
  "TI e Tecnologia","Obras e Construção","Saúde","Educação","Transporte",
  "Alimentação","Limpeza e Conservação","Segurança","Consultoria","Outros",
];

const LICITAR_DIGITAL_SUPPLIER_URL = "https://app2.licitardigital.com.br/painel-fornecedor/";

// ─── Alerta types & hook ──────────────────────────────────────────────────────

interface AlertaItem {
  id: string;
  label: string;
  keyword?: string;
  state?: string;
  segment?: string;
  modality?: string;
  channels: { email: boolean; whatsapp: boolean; whatsappNumber?: string };
  active: boolean;
  createdAt: string;
}

function useAlertas(userId?: string) {
  const key = `licita-alertas-${userId ?? "guest"}`;

  const load = (): AlertaItem[] => {
    try { return JSON.parse(localStorage.getItem(key) ?? "[]"); }
    catch { return []; }
  };

  const [alertas, setAlertasState] = useState<AlertaItem[]>(load);

  const persist = (items: AlertaItem[]) => {
    localStorage.setItem(key, JSON.stringify(items));
    setAlertasState(items);
  };

  const addAlerta = (draft: Omit<AlertaItem, "id" | "createdAt">) =>
    persist([...alertas, { ...draft, id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, createdAt: new Date().toISOString() }]);

  const removeAlerta = (id: string) => persist(alertas.filter((a) => a.id !== id));

  const toggleAlerta = (id: string) =>
    persist(alertas.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));

  return { alertas, addAlerta, removeAlerta, toggleAlerta };
}

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

function formatDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, color = "#2c3f31", loading }: StatCardProps) {
  if (loading) return <Skeleton variant="rounded" height={92} />;
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
      <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
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
        <Box>
          <Typography variant="h5" fontWeight={700} lineHeight={1.2}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Auction Card ─────────────────────────────────────────────────────────────

function AuctionCard({ auction }: { auction: PublicAuction }) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid", borderColor: "divider", borderRadius: 2,
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: "0 2px 12px rgba(44,63,49,0.12)" },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
          <Typography variant="body2" fontWeight={700} sx={{ flex: 1, mr: 1 }} noWrap>
            {auction.title}
          </Typography>
          <Chip label={statusLabel(auction.status)} color={statusColor(auction.status)} size="small" sx={{ flexShrink: 0 }} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
          <BusinessIcon sx={{ fontSize: 13, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" noWrap>
            {auction.agency?.name ?? "Órgão não informado"}
            {auction.agency?.city && ` — ${auction.agency.city}/${auction.agency.state}`}
          </Typography>
        </Box>

        {auction.estimatedValue && (
          <Typography variant="caption" color="primary.main" fontWeight={600}>
            Valor estimado: {currency(auction.estimatedValue)}
          </Typography>
        )}

        <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
          {auction.modality && (
            <Chip label={auction.modality.replace(/_/g, " ")} size="small" variant="outlined" />
          )}
          {auction.openingDate && (
            <Chip label={`Abertura: ${formatDate(auction.openingDate)}`} size="small" variant="outlined" color="info" />
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Denuncia Dialog ──────────────────────────────────────────────────────────

function DenunciaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [form, setForm] = useState<Denuncia>({ subject: "", description: "", anonymous: false });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      setError("Preencha o assunto e a descrição.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await publicApi.submitDenuncia(form);
      setSuccess(true);
      setForm({ subject: "", description: "", anonymous: false });
      setTimeout(onClose, 1500);
    } catch {
      setError("Erro ao enviar denúncia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <ReportProblemIcon color="warning" />
        Fazer Denúncia / Ouvidoria
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 1 }}>
            Denúncia registrada com sucesso! Número de protocolo será enviado ao seu e-mail.
          </Alert>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Assunto"
              fullWidth
              size="small"
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="Ex: Irregularidade em pregão nº 001/2024"
            />
            <TextField
              label="Descrição detalhada"
              fullWidth
              multiline
              rows={4}
              size="small"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Descreva a irregularidade, com datas, valores e demais informações relevantes..."
            />
            <TextField
              label="Nº do Pregão / Processo (opcional)"
              fullWidth
              size="small"
              value={form.auctionId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, auctionId: e.target.value }))}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.anonymous}
                  onChange={(e) => setForm((f) => ({ ...f, anonymous: e.target.checked }))}
                  color="primary"
                />
              }
              label="Denúncia anônima (seus dados não serão compartilhados)"
            />
          </Box>
        )}
      </DialogContent>
      {!success && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSubmit}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <ReportProblemIcon />}
          >
            Enviar Denúncia
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

// ─── Alertas Dialog ───────────────────────────────────────────────────────────

interface AlertasDialogProps {
  open: boolean;
  onClose: () => void;
  alertas: AlertaItem[];
  onAdd: (draft: Omit<AlertaItem, "id" | "createdAt">) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  userEmail?: string;
}

const EMPTY_DRAFT = {
  label: "",
  keyword: "",
  state: "",
  segment: "",
  modality: "",
  channels: { email: true, whatsapp: false, whatsappNumber: "" },
  active: true,
};

function AlertasDialog({ open, onClose, alertas, onAdd, onRemove, onToggle, userEmail }: AlertasDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT });
  const [formError, setFormError] = useState("");

  const buildLabel = (d: typeof EMPTY_DRAFT) => {
    const parts = [];
    if (d.keyword) parts.push(`"${d.keyword}"`);
    if (d.state) parts.push(d.state);
    if (d.segment) parts.push(d.segment);
    if (d.modality) {
      const m = MODALITIES.find((x) => x.value === d.modality);
      if (m) parts.push(m.label);
    }
    return parts.length ? parts.join(" · ") : "Todas as licitações";
  };

  const handleAdd = () => {
    if (!draft.channels.email && !draft.channels.whatsapp) {
      setFormError("Selecione ao menos um canal de notificação.");
      return;
    }
    if (draft.channels.whatsapp && !draft.channels.whatsappNumber?.trim()) {
      setFormError("Informe o número do WhatsApp para receber alertas.");
      return;
    }
    if (!draft.keyword && !draft.state && !draft.segment && !draft.modality) {
      setFormError("Configure ao menos um filtro para o alerta.");
      return;
    }
    onAdd({ ...draft, label: buildLabel(draft) });
    setDraft({ ...EMPTY_DRAFT });
    setShowForm(false);
    setFormError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setDraft({ ...EMPTY_DRAFT });
    setFormError("");
  };

  const channelChips = (a: AlertaItem) => {
    const chips = [];
    if (a.channels.email) chips.push({ icon: <EmailIcon sx={{ fontSize: 13 }} />, label: "E-mail", color: "#1976d2" });
    if (a.channels.whatsapp) chips.push({ icon: <WhatsAppIcon sx={{ fontSize: 13 }} />, label: "WhatsApp", color: "#25d366" });
    return chips;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <NotificationsActiveIcon color="success" />
          <Box>
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1}>Meus Alertas</Typography>
            <Typography variant="caption" color="text.secondary">
              {alertas.length === 0 ? "Nenhum alerta configurado" : `${alertas.filter((a) => a.active).length} ativo(s) de ${alertas.length}`}
            </Typography>
          </Box>
        </Box>
        {!showForm && (
          <Button
            size="small"
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => setShowForm(true)}
            color="success"
          >
            Novo Alerta
          </Button>
        )}
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {/* ─── Form ─── */}
        {showForm && (
          <Box sx={{ p: 2.5, bgcolor: "success.50", borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
              Configurar Novo Alerta
            </Typography>

            {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

            <Grid container spacing={1.5}>
              <Grid item xs={12}>
                <TextField
                  label="Palavra-chave (objeto, órgão...)"
                  fullWidth size="small"
                  value={draft.keyword}
                  onChange={(e) => setDraft((d) => ({ ...d, keyword: e.target.value }))}
                  placeholder='Ex: "equipamentos hospitalares", "prefeitura de SP"'
                />
              </Grid>
              <Grid item xs={6}>
                <Select
                  size="small" fullWidth displayEmpty
                  value={draft.state}
                  onChange={(e) => setDraft((d) => ({ ...d, state: e.target.value }))}
                >
                  <MenuItem value="">Todos os estados</MenuItem>
                  {STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </Grid>
              <Grid item xs={6}>
                <Select
                  size="small" fullWidth displayEmpty
                  value={draft.modality}
                  onChange={(e) => setDraft((d) => ({ ...d, modality: e.target.value }))}
                >
                  <MenuItem value="">Qualquer modalidade</MenuItem>
                  {MODALITIES.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <Select
                  size="small" fullWidth displayEmpty
                  value={draft.segment}
                  onChange={(e) => setDraft((d) => ({ ...d, segment: e.target.value }))}
                >
                  <MenuItem value="">Todos os segmentos</MenuItem>
                  {SEGMENTS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">Canais de notificação</Typography>
                </Divider>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.channels.email}
                      onChange={(e) => setDraft((d) => ({ ...d, channels: { ...d.channels, email: e.target.checked } }))}
                      color="primary"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <EmailIcon fontSize="small" sx={{ color: "#1976d2" }} />
                      <Typography variant="body2">
                        E-mail{userEmail ? ` (${userEmail})` : ""}
                      </Typography>
                    </Box>
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={draft.channels.whatsapp}
                      onChange={(e) => setDraft((d) => ({ ...d, channels: { ...d.channels, whatsapp: e.target.checked } }))}
                      color="success"
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <WhatsAppIcon fontSize="small" sx={{ color: "#25d366" }} />
                      <Typography variant="body2">WhatsApp</Typography>
                    </Box>
                  }
                />
                {draft.channels.whatsapp && (
                  <TextField
                    size="small" fullWidth
                    label="Número WhatsApp (com DDD)"
                    value={draft.channels.whatsappNumber ?? ""}
                    onChange={(e) => setDraft((d) => ({ ...d, channels: { ...d.channels, whatsappNumber: e.target.value } }))}
                    placeholder="Ex: 11999887766"
                    sx={{ mt: 1, ml: 4, width: "calc(100% - 32px)" }}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">+55</InputAdornment>,
                    }}
                  />
                )}
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
              <Button onClick={handleCancel} size="small">Cancelar</Button>
              <Button
                variant="contained"
                color="success"
                size="small"
                startIcon={<AddCircleOutlineIcon />}
                onClick={handleAdd}
              >
                Salvar Alerta
              </Button>
            </Box>
          </Box>
        )}

        {/* ─── Lista de alertas ─── */}
        {alertas.length === 0 && !showForm ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Você ainda não tem alertas configurados.
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Clique em "Novo Alerta" para receber notificações de novas licitações.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {alertas.map((a, i) => (
              <React.Fragment key={a.id}>
                {i > 0 && <Divider />}
                <ListItem
                  sx={{
                    py: 1.5, px: 2.5,
                    opacity: a.active ? 1 : 0.5,
                    transition: "opacity 0.2s",
                  }}
                >
                  <Box sx={{ flex: 1, pr: 10 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                      <Typography variant="body2" fontWeight={600}>{a.label}</Typography>
                      <Chip
                        label={a.active ? "Ativo" : "Pausado"}
                        size="small"
                        color={a.active ? "success" : "default"}
                        variant="outlined"
                      />
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 0.5 }}>
                      {channelChips(a).map((c) => (
                        <Chip
                          key={c.label}
                          icon={c.icon}
                          label={c.label}
                          size="small"
                          sx={{ bgcolor: `${c.color}18`, color: c.color, "& .MuiChip-icon": { color: c.color } }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.disabled">
                      Criado em {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                    </Typography>
                  </Box>
                  <ListItemSecondaryAction>
                    <Tooltip title={a.active ? "Pausar alerta" : "Reativar alerta"}>
                      <Switch
                        size="small"
                        checked={a.active}
                        onChange={() => onToggle(a.id)}
                        color="success"
                      />
                    </Tooltip>
                    <Tooltip title="Remover alerta">
                      <IconButton
                        size="small"
                        onClick={() => onRemove(a.id)}
                        sx={{ color: "error.main", ml: 0.5 }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItemSecondaryAction>
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5 }}>
        <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
          Os alertas são enviados assim que novas licitações forem publicadas.
        </Typography>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Todos os Pregões Section ─────────────────────────────────────────────────

const STATUS_TABS = [
  { value: "ALL",       label: "Todos"       },
  { value: "OPEN",      label: "Em Disputa"  },
  { value: "SCHEDULED", label: "Agendados"   },
  { value: "CLOSED",    label: "Encerrados"  },
  { value: "DRAFT",     label: "Rascunhos"   },
];

function TodosPregoesSection() {
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState<PublicAuction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("ALL");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    auctionsApi
      .list()
      .then((list) => setAuctions(list as unknown as PublicAuction[]))
      .catch(() => setError("Não foi possível carregar os pregões."))
      .finally(() => setLoading(false));
  }, []);

  const counts = STATUS_TABS.reduce<Record<string, number>>((acc, t) => {
    acc[t.value] = t.value === "ALL"
      ? auctions.length
      : auctions.filter((a) => a.status === t.value).length;
    return acc;
  }, {});

  const filtered = auctions.filter((a) => {
    const matchStatus = tab === "ALL" || a.status === tab;
    const q = query.toLowerCase();
    const matchQuery = !q ||
      a.title?.toLowerCase().includes(q) ||
      a.agency?.name?.toLowerCase().includes(q) ||
      a.description?.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleTabChange = (_: React.SyntheticEvent, v: string) => {
    setTab(v);
    setPage(0);
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setPage(0);
  };

  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2.5, pb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GavelIcon sx={{ color: "#2c3f31" }} />
            <Typography variant="subtitle1" fontWeight={700}>Todos os Pregões</Typography>
            <Chip
              label={loading ? "…" : auctions.length}
              size="small"
              sx={{ bgcolor: "#2c3f3118", color: "#2c3f31", fontWeight: 700 }}
            />
          </Box>
          <TextField
            size="small"
            placeholder="Filtrar por título, órgão..."
            value={query}
            onChange={handleQueryChange}
            sx={{ minWidth: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Status Tabs */}
        <Tabs
          value={tab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": { minHeight: 36, py: 0, fontSize: 13, textTransform: "none" },
            "& .MuiTabs-indicator": { bgcolor: "#2c3f31" },
            "& .Mui-selected": { color: "#2c3f31 !important", fontWeight: 700 },
          }}
        >
          {STATUS_TABS.map((t) => (
            <Tab
              key={t.value}
              value={t.value}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  {t.label}
                  {!loading && (
                    <Chip
                      label={counts[t.value] ?? 0}
                      size="small"
                      sx={{
                        height: 18, fontSize: 11, fontWeight: 600,
                        bgcolor: tab === t.value ? "#2c3f3120" : "action.hover",
                      }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
      </Box>

      <Divider />

      {/* Content */}
      {loading ? (
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={44} sx={{ mb: 1 }} />
          ))}
        </Box>
      ) : error ? (
        <Box sx={{ p: 2 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ p: 4, textAlign: "center" }}>
          <GavelIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="body2" color="text.secondary">
            Nenhum pregão encontrado{query ? ` para "${query}"` : ""}.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={0}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8f9fa" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", width: "40%" }}>
                  OBJETO / TÍTULO
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }}>
                  ÓRGÃO
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }} align="center">
                  STATUS
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }} align="right">
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                    <AttachMoneyIcon sx={{ fontSize: 14 }} />
                    VALOR EST.
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary" }} align="right">
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 13 }} />
                    ABERTURA
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, color: "text.secondary", width: 90 }} align="center">
                  ACESSAR
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map((a) => (
                <TableRow
                  key={a.id}
                  hover
                  onClick={() => navigate(`/pregoes/${a.id}`)}
                  sx={{ "&:last-child td": { border: 0 }, cursor: "pointer" }}
                >
                  <TableCell sx={{ maxWidth: 0 }}>
                    <Tooltip title={a.title} placement="top-start">
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        noWrap
                        sx={{ overflow: "hidden", textOverflow: "ellipsis" }}
                      >
                        {a.title}
                      </Typography>
                    </Tooltip>
                    {a.description && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {a.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                      {a.agency?.name ?? "—"}
                    </Typography>
                    {(a.agency?.city || a.agency?.state) && (
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: "block" }}>
                        {[a.agency?.city, a.agency?.state].filter(Boolean).join("/")}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={statusLabel(a.status)}
                      color={statusColor(a.status)}
                      size="small"
                      sx={{ fontSize: 11, height: 22 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                      {currency(a.estimatedValue)}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(a.openingDate)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Ver detalhes do pregão">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/pregoes/${a.id}`)}
                        sx={{
                          color: "#2c3f31",
                          border: "1px solid",
                          borderColor: "#2c3f3140",
                          borderRadius: 1.5,
                          "&:hover": { bgcolor: "#2c3f3112", borderColor: "#2c3f31" },
                        }}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50]}
            labelRowsPerPage="por página"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
            sx={{ borderTop: "1px solid", borderColor: "divider" }}
          />
        </TableContainer>
      )}
    </Card>
  );
}

// ─── Search Section ───────────────────────────────────────────────────────────

function SearchSection() {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [modality, setModality] = useState("");
  const [segment, setSegment] = useState("");
  const [status, setStatus] = useState("OPEN");
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<PublicAuction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setSearched(true);
    try {
      const data = await publicApi.searchAuctions({ q: query, state, modality, segment, status, limit: 20 });
      setResults(data.auctions ?? []);
      setTotal(data.total ?? 0);
    } catch {
      setError("Erro ao buscar licitações. Verifique a conexão.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Search bar */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Buscar Licitações Públicas
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <TextField
              placeholder="Buscar por objeto, órgão, número..."
              size="small"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              sx={{ flex: 1, minWidth: 240 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
                ),
              }}
            />
            <Select
              size="small"
              displayEmpty
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{ minWidth: 140 }}
            >
              <MenuItem value="">Todos os status</MenuItem>
              <MenuItem value="OPEN">Em disputa</MenuItem>
              <MenuItem value="SCHEDULED">Agendados</MenuItem>
              <MenuItem value="CLOSED">Encerrados</MenuItem>
            </Select>
            <Tooltip title="Filtros avançados">
              <IconButton
                onClick={() => setShowFilters((v) => !v)}
                color={showFilters ? "primary" : "default"}
                size="small"
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
              >
                <FilterListIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <SearchIcon />}
              onClick={handleSearch}
              disabled={loading}
              sx={{ bgcolor: "#2c3f31", "&:hover": { bgcolor: "#1e2c22" } }}
            >
              Buscar
            </Button>
          </Box>

          {/* Advanced filters */}
          {showFilters && (
            <Box sx={{ display: "flex", gap: 1.5, mt: 2, flexWrap: "wrap" }}>
              <Select
                size="small"
                displayEmpty
                value={state}
                onChange={(e) => setState(e.target.value)}
                sx={{ minWidth: 100 }}
              >
                <MenuItem value="">Estado</MenuItem>
                {STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
              <Select
                size="small"
                displayEmpty
                value={modality}
                onChange={(e) => setModality(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Modalidade</MenuItem>
                {MODALITIES.map((m) => <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>)}
              </Select>
              <Select
                size="small"
                displayEmpty
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                sx={{ minWidth: 180 }}
              >
                <MenuItem value="">Segmento</MenuItem>
                {SEGMENTS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
              <Button
                size="small"
                onClick={() => { setState(""); setModality(""); setSegment(""); setStatus(""); }}
                color="inherit"
              >
                Limpar filtros
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading && (
        <Grid container spacing={2}>
          {[...Array(4)].map((_, i) => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && searched && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
            {total > 0 ? `${total} licitação(ões) encontrada(s)` : "Nenhuma licitação encontrada com os filtros selecionados."}
          </Typography>
          <Grid container spacing={2}>
            {results.map((a) => (
              <Grid item xs={12} md={6} key={a.id}>
                <AuctionCard auction={a} />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CitizenDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashData, setDashData] = useState<CitizenDashboard | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [denunciaOpen, setDenunciaOpen] = useState(false);
  const [alertasOpen, setAlertasOpen] = useState(false);
  const [snackbar, setSnackbar] = useState("");
  const { alertas, addAlerta, removeAlerta, toggleAlerta } = useAlertas(user?.id);

  useEffect(() => {
    dashboardApi
      .citizen()
      .then(setDashData)
      .catch(() => {
        // Fallback with public stats
        publicApi.stats().then((s) =>
          setDashData({
            totalOpenAuctions: s.totalAuctions,
            totalAgencies: s.totalAgencies,
            totalContracts: s.totalContracts,
            totalSavingsPercent: s.savingsPercent,
          })
        ).catch(() => setDashData(null));
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Cidadão";

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Olá, {firstName}! 👋
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Painel Cidadão — Transparência e controle social das licitações públicas
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Atualizar dados">
              <IconButton
                size="small"
                onClick={() => window.location.reload()}
                sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5 }}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            loading={statsLoading}
            label="Licitações Abertas"
            value={dashData?.totalOpenAuctions?.toLocaleString("pt-BR") ?? "—"}
            icon={<GavelIcon />}
            color="#2c3f31"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            loading={statsLoading}
            label="Órgãos Públicos"
            value={dashData?.totalAgencies?.toLocaleString("pt-BR") ?? "—"}
            icon={<AccountBalanceIcon />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            loading={statsLoading}
            label="Contratos Ativos"
            value={dashData?.totalContracts?.toLocaleString("pt-BR") ?? "—"}
            icon={<AssignmentIcon />}
            color="#9c27b0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            loading={statsLoading}
            label="Economia Gerada"
            value={dashData?.totalSavingsPercent ? `${dashData.totalSavingsPercent}%` : "—"}
            icon={<TrendingDownIcon />}
            color="#e65100"
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            Acesso Rápido
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<GavelIcon />}
                onClick={() => document.getElementById("busca-section")?.scrollIntoView({ behavior: "smooth" })}
                sx={{ py: 1.5, borderRadius: 2, justifyContent: "flex-start", textAlign: "left" }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>Buscar Licitações</Typography>
                  <Typography variant="caption" color="text.secondary">Consulta pública de processos</Typography>
                </Box>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="warning"
                startIcon={<ReportProblemIcon />}
                onClick={() => setDenunciaOpen(true)}
                sx={{ py: 1.5, borderRadius: 2, justifyContent: "flex-start" }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>Fazer Denúncia</Typography>
                  <Typography variant="caption" color="text.secondary">Irregularidades / Ouvidoria</Typography>
                </Box>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="outlined"
                color="success"
                onClick={() => setAlertasOpen(true)}
                sx={{ py: 1.5, borderRadius: 2, justifyContent: "flex-start" }}
              >
                <Badge
                  badgeContent={alertas.filter((a) => a.active).length}
                  color="success"
                  sx={{ mr: 1.5 }}
                >
                  <NotificationsActiveIcon />
                </Badge>
                <Box>
                  <Typography variant="body2" fontWeight={600}>Meus Alertas</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {alertas.length === 0 ? "Monitorar órgãos e segmentos" : `${alertas.length} alerta(s) configurado(s)`}
                  </Typography>
                </Box>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<StoreIcon />}
                onClick={() => navigate("/fornecedor/cadastro")}
                sx={{
                  py: 1.5, borderRadius: 2, justifyContent: "flex-start",
                  bgcolor: "#2c3f31", "&:hover": { bgcolor: "#1e2c22" },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={600}>Cadastrar Fornecedor</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.85 }}>Habilitar empresa em licitações</Typography>
                </Box>
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Minha Empresa */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            Minha Empresa
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<StoreIcon />}
                onClick={() => navigate("/fornecedor/cadastro")}
                sx={{
                  py: 2, borderRadius: 2, justifyContent: "flex-start",
                  borderColor: "#2c3f31", color: "#2c3f31",
                  "&:hover": { bgcolor: "#2c3f3108", borderColor: "#2c3f31" },
                }}
              >
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="body2" fontWeight={600}>Cadastrar Fornecedor</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Habilitação, CNPJ, segmentos e documentos
                  </Typography>
                </Box>
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<CorporateFareIcon />}
                onClick={() => navigate("/organizacao/cadastro")}
                sx={{
                  py: 2, borderRadius: 2, justifyContent: "flex-start",
                  borderColor: "#1976d2", color: "#1976d2",
                  "&:hover": { bgcolor: "#1976d208", borderColor: "#1976d2" },
                }}
              >
                <Box sx={{ textAlign: "left" }}>
                  <Typography variant="body2" fontWeight={600}>Cadastrar Organização</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Órgão público, consórcio ou entidade
                  </Typography>
                </Box>
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Todos os Pregões */}
      <Box sx={{ mb: 3 }}>
        <TodosPregoesSection />
      </Box>

      {/* Search Section */}
      <Box id="busca-section">
        <SearchSection />
      </Box>

      {/* Licitar Digital Integration Banner */}
      <Card
        elevation={0}
        sx={{
          mt: 3,
          border: "1px solid",
          borderColor: "#1976d2",
          borderRadius: 2,
          background: "linear-gradient(135deg, #1565c018 0%, #1976d208 100%)",
        }}
      >
        <CardContent sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <VerifiedIcon sx={{ fontSize: 40, color: "#1976d2" }} />
          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography variant="subtitle1" fontWeight={700}>
              É fornecedor do governo?
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Acesse o painel completo de fornecedor na plataforma Licitar Digital para participar de pregões,
              enviar propostas e gerenciar seus contratos.
            </Typography>
          </Box>
          <Button
            variant="contained"
            endIcon={<OpenInNewIcon />}
            href={LICITAR_DIGITAL_SUPPLIER_URL}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#1565c0" }, flexShrink: 0 }}
          >
            Acessar Painel Fornecedor
          </Button>
        </CardContent>
      </Card>

      {/* Transparency Info */}
      <Card elevation={0} sx={{ mt: 3, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
            Sobre a Transparência Pública
          </Typography>
          <List disablePadding>
            {[
              { text: "Todos os processos licitatórios são publicados conforme a Lei nº 14.133/2021 (Nova Lei de Licitações).", icon: <GavelIcon fontSize="small" /> },
              { text: "Dados integrados ao Portal Nacional de Contratações Públicas (PNCP).", icon: <VerifiedIcon fontSize="small" /> },
              { text: "Cidadãos podem acompanhar sessões públicas em tempo real.", icon: <NotificationsActiveIcon fontSize="small" /> },
              { text: "Denúncias são tratadas com sigilo e encaminhadas aos órgãos competentes.", icon: <ReportProblemIcon fontSize="small" /> },
            ].map((item, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Divider />}
                <ListItem disablePadding sx={{ py: 0.75 }}>
                  <Box sx={{ color: "primary.main", mr: 1.5, display: "flex", alignItems: "center", flexShrink: 0 }}>{item.icon}</Box>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Denuncia Dialog */}
      <DenunciaDialog open={denunciaOpen} onClose={() => setDenunciaOpen(false)} />

      {/* Alertas Dialog */}
      <AlertasDialog
        open={alertasOpen}
        onClose={() => setAlertasOpen(false)}
        alertas={alertas}
        onAdd={addAlerta}
        onRemove={removeAlerta}
        onToggle={toggleAlerta}
        userEmail={user?.email}
      />

      {/* Snackbar */}
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        message={snackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
