import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import SaveIcon from "@mui/icons-material/Save";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import GavelIcon from "@mui/icons-material/Gavel";
import { organApi } from "../api/client";
import type { AgencySetup } from "../data/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const SPHERES = [
  { value: "MUNICIPAL",  label: "Municipal" },
  { value: "ESTADUAL",   label: "Estadual" },
  { value: "FEDERAL",    label: "Federal" },
];

const ENTITY_TYPES = [
  { value: "ADMINISTRACAO_DIRETA", label: "Administração Direta" },
  { value: "AUTARQUIA",            label: "Autarquia" },
  { value: "FUNDACAO",             label: "Fundação Pública" },
  { value: "EMPRESA_PUBLICA",      label: "Empresa Pública" },
  { value: "SOCIEDADE_MISTA",      label: "Sociedade de Economia Mista" },
  { value: "SISTEMA_S",            label: "Sistema S" },
];

const LEGAL_FRAMEWORKS = [
  { value: "LEI_14133",           label: "Lei 14.133/2021 (Nova LICITAÇÕES)" },
  { value: "LEI_13303",           label: "Lei 13.303/2016 (Estatais)" },
  { value: "REGULAMENTO_PROPRIO", label: "Regulamento Próprio" },
];

const BR_STATES = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS",
  "MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC",
  "SP","SE","TO",
];

// ─── Section wrapper ──────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2.5 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5 }}>
          <Box sx={{ color: "primary.main" }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        </Box>
        <Grid container spacing={2}>
          {children}
        </Grid>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganOrganizacaoPage() {
  const [agency, setAgency] = useState<AgencySetup | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // form fields
  const [form, setForm] = useState({
    officialName: "",
    description: "",
    city: "",
    state: "",
    sphere: "",
    entityType: "",
    legalFramework: "",
    contractAlertWindowDays: 60,
    // tenantSettings extras
    phone: "",
    email: "",
    website: "",
    zipCode: "",
    street: "",
    addressNumber: "",
    district: "",
  });

  useEffect(() => {
    organApi.orgSetup()
      .then((a) => {
        setAgency(a);
        const ts = a.tenantSettings ?? {};
        setForm({
          officialName: a.officialName ?? "",
          description: a.description ?? "",
          city: a.city ?? "",
          state: a.state ?? "",
          sphere: a.sphere ?? "",
          entityType: a.entityType ?? "",
          legalFramework: a.legalFramework ?? "",
          contractAlertWindowDays: a.contractAlertWindowDays ?? 60,
          phone: (ts.phone as string) ?? "",
          email: (ts.email as string) ?? "",
          website: (ts.website as string) ?? "",
          zipCode: (ts.zipCode as string) ?? "",
          street: (ts.street as string) ?? "",
          addressNumber: (ts.addressNumber as string) ?? "",
          district: (ts.district as string) ?? "",
        });
      })
      .catch(() => setError("Não foi possível carregar os dados da organização."))
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const saved = await organApi.updateOrgSetup({
        ...form,
        contractAlertWindowDays: Number(form.contractAlertWindowDays),
      });
      setAgency(saved);
      setToast("Dados salvos com sucesso!");
    } catch {
      setError("Erro ao salvar os dados. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={220} height={36} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={300} height={20} sx={{ mb: 3 }} />
        {[...Array(3)].map((_, i) => <Skeleton key={i} variant="rounded" height={180} sx={{ mb: 2 }} />)}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BusinessIcon /> Dados da Organização
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mantenha os dados do seu órgão atualizados
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Read-only fields */}
      {agency && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "info.light", borderRadius: 2, mb: 2.5, bgcolor: "#f0f7ff" }}>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
              <InfoOutlinedIcon color="info" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="info.dark">Informações Cadastrais</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" display="block">Nome do Órgão</Typography>
                <Typography variant="body2" fontWeight={600}>{agency.name}</Typography>
              </Grid>
              {agency.cnpj && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary" display="block">CNPJ</Typography>
                  <Typography variant="body2" fontWeight={600}>{agency.cnpj}</Typography>
                </Grid>
              )}
            </Grid>
            <Typography variant="caption" color="info.dark" sx={{ mt: 1, display: "block" }}>
              Nome e CNPJ são alterados apenas pelo administrador do sistema.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Identificação */}
      <SectionCard title="Identificação" icon={<AccountBalanceIcon />}>
        <Grid item xs={12}>
          <TextField
            label="Nome Oficial Completo"
            value={form.officialName}
            onChange={set("officialName")}
            fullWidth size="small"
            placeholder="Ex: Prefeitura Municipal de São Paulo"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Descrição / Missão do Órgão"
            value={form.description}
            onChange={set("description")}
            fullWidth size="small"
            multiline rows={3}
            placeholder="Descreva brevemente a missão ou objeto do órgão..."
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Esfera</InputLabel>
            <Select label="Esfera" value={form.sphere} onChange={(e) => setForm((f) => ({ ...f, sphere: e.target.value }))}>
              <MenuItem value=""><em>Selecione</em></MenuItem>
              {SPHERES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Tipo de Entidade</InputLabel>
            <Select label="Tipo de Entidade" value={form.entityType} onChange={(e) => setForm((f) => ({ ...f, entityType: e.target.value }))}>
              <MenuItem value=""><em>Selecione</em></MenuItem>
              {ENTITY_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Marco Legal</InputLabel>
            <Select label="Marco Legal" value={form.legalFramework} onChange={(e) => setForm((f) => ({ ...f, legalFramework: e.target.value }))}>
              <MenuItem value=""><em>Selecione</em></MenuItem>
              {LEGAL_FRAMEWORKS.map((l) => <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </SectionCard>

      {/* Localização */}
      <SectionCard title="Endereço e Localização" icon={<LocationOnIcon />}>
        <Grid item xs={12} sm={3}>
          <TextField
            label="CEP"
            value={form.zipCode}
            onChange={set("zipCode")}
            fullWidth size="small"
            placeholder="00000-000"
            inputProps={{ maxLength: 9 }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Logradouro"
            value={form.street}
            onChange={set("street")}
            fullWidth size="small"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <TextField
            label="Número"
            value={form.addressNumber}
            onChange={set("addressNumber")}
            fullWidth size="small"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Bairro"
            value={form.district}
            onChange={set("district")}
            fullWidth size="small"
          />
        </Grid>
        <Grid item xs={12} sm={5}>
          <TextField
            label="Município"
            value={form.city}
            onChange={set("city")}
            fullWidth size="small"
          />
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>UF</InputLabel>
            <Select label="UF" value={form.state} onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}>
              <MenuItem value=""><em>UF</em></MenuItem>
              {BR_STATES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
      </SectionCard>

      {/* Contato */}
      <SectionCard title="Contato" icon={<PhoneIcon />}>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Telefone"
            value={form.phone}
            onChange={set("phone")}
            fullWidth size="small"
            placeholder="(00) 0000-0000"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="E-mail institucional"
            value={form.email}
            onChange={set("email")}
            fullWidth size="small"
            type="email"
            placeholder="contato@municipio.gov.br"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField
            label="Site / Portal"
            value={form.website}
            onChange={set("website")}
            fullWidth size="small"
            placeholder="https://www.municipio.gov.br"
          />
        </Grid>
      </SectionCard>

      {/* Configurações de Gestão */}
      <SectionCard title="Configurações de Gestão" icon={<GavelIcon />}>
        <Grid item xs={12} sm={5}>
          <Tooltip title="Quantos dias antes do vencimento o sistema emite alertas de contratos">
            <TextField
              label="Janela de Alerta de Contratos (dias)"
              value={form.contractAlertWindowDays}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10);
                setForm((f) => ({ ...f, contractAlertWindowDays: isNaN(n) ? 60 : n }));
              }}
              fullWidth size="small"
              type="number"
              inputProps={{ min: 1, max: 365 }}
              helperText="O painel mostrará alertas para contratos com vencimento neste prazo."
            />
          </Tooltip>
        </Grid>
      </SectionCard>

      {/* Bottom save */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
          onClick={handleSave}
          disabled={saving}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </Box>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3500}
        onClose={() => setToast("")}
        message={toast}
      />
    </Box>
  );
}
