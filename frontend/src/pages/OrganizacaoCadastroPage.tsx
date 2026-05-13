import React, { useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import LockIcon from "@mui/icons-material/Lock";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../auth/ProfileContext";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "Identificação",
  "Endereço",
  "Responsável",
  "Acesso ao Sistema",
  "Documentos",
];

const TIPOS_ORGANIZACAO = [
  "Órgão Público Federal",
  "Órgão Público Estadual",
  "Órgão Público Municipal",
  "Autarquia Federal",
  "Autarquia Estadual",
  "Autarquia Municipal",
  "Fundação Pública",
  "Empresa Pública",
  "Sociedade de Economia Mista",
  "Consórcio Público",
  "Entidade Paraestatal",
  "Agência Reguladora",
  "Outro",
];

const ESFERAS = ["Federal", "Estadual", "Municipal", "Distrital"];

const PODERES = [
  "Executivo",
  "Legislativo",
  "Judiciário",
  "Ministério Público",
  "Defensoria Pública",
  "Tribunal de Contas",
  "Não se aplica",
];

const NATUREZAS_JURIDICAS = [
  "Administração Direta",
  "Autarquia",
  "Fundação Pública",
  "Empresa Pública",
  "Sociedade de Economia Mista",
  "Consórcio Público de Direito Público",
  "Consórcio Público de Direito Privado",
  "Outros",
];

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

const PERFIS_ACESSO = [
  { value: "GESTOR", label: "Gestor" },
  { value: "PREGOEIRO", label: "Pregoeiro" },
  { value: "EQUIPE_APOIO", label: "Equipe de Apoio" },
  { value: "AUTORIDADE_COMPETENTE", label: "Autoridade Competente" },
  { value: "VISUALIZADOR", label: "Visualizador" },
];

const DOCUMENTOS_ORG = [
  { id: "cnpj-cartao", name: "Cartão CNPJ", required: true, desc: "Comprovante de inscrição CNPJ com situação ativa" },
  { id: "ato-criacao", name: "Ato de Criação / Lei de Criação", required: true, desc: "Lei ou decreto que criou o órgão / entidade" },
  { id: "regimento-interno", name: "Regimento Interno / Estatuto", required: true, desc: "Regimento interno vigente do órgão" },
  { id: "portaria-gestor", name: "Portaria de Designação do Gestor", required: true, desc: "Portaria que designa o responsável pelas licitações" },
  { id: "doc-responsavel", name: "Documento de Identidade do Responsável", required: true, desc: "RG, CNH ou outro documento com foto do responsável" },
  { id: "cpf-responsavel", name: "CPF do Responsável", required: true, desc: "Comprovante de CPF do responsável designado" },
  { id: "comprovante-endereco", name: "Comprovante de Endereço do Órgão", required: false, desc: "Conta de água, luz ou correspondência oficial recente" },
  { id: "plano-contratacoes", name: "Plano de Contratações Anual (PCA)", required: false, desc: "Quando exigido pela administração superior" },
];

// ─── Input Masks ──────────────────────────────────────────────────────────────

function maskCNPJ(v: string) {
  return v.replace(/\D/g, "").slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function maskCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

// ─── Validators ───────────────────────────────────────────────────────────────

function isCNPJValid(cnpj: string) {
  const d = cnpj.replace(/\D/g, "");
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
  const calc = (s: string, w: number[]) => s.split("").reduce((a, c, i) => a + parseInt(c) * w[i], 0);
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2];
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2];
  const r1 = calc(d.slice(0,12), w1) % 11;
  const r2 = calc(d.slice(0,13), w2) % 11;
  return parseInt(d[12]) === (r1 < 2 ? 0 : 11 - r1) && parseInt(d[13]) === (r2 < 2 ? 0 : 11 - r2);
}

// ─── Form State ───────────────────────────────────────────────────────────────

interface UsuarioAcesso {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  perfil: string;
}

interface FormData {
  // Step 1 — Identificação
  cnpj: string;
  nomeOficial: string;
  nomePopular: string;
  tipo: string;
  esfera: string;
  poder: string;
  natureza: string;
  codigoIbge: string;
  uf: string;
  telefone: string;
  email: string;
  site: string;
  // Step 2 — Endereço
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  endUf: string;
  pais: string;
  // Step 3 — Responsável
  respNome: string;
  respCpf: string;
  respRg: string;
  respOrgaoEmissor: string;
  respNasc: string;
  respCargo: string;
  respTelefone: string;
  respEmail: string;
  respPortaria: string;
  respPortariaData: string;
  // Step 4 — Acesso
  usuarios: UsuarioAcesso[];
  // Step 5 — Documentos
  uploadedDocs: Record<string, boolean>;
}

const INITIAL: FormData = {
  cnpj: "", nomeOficial: "", nomePopular: "",
  tipo: "", esfera: "", poder: "", natureza: "",
  codigoIbge: "", uf: "", telefone: "", email: "", site: "",
  cep: "", logradouro: "", numero: "", complemento: "",
  bairro: "", municipio: "", endUf: "", pais: "Brasil",
  respNome: "", respCpf: "", respRg: "", respOrgaoEmissor: "",
  respNasc: "", respCargo: "", respTelefone: "", respEmail: "",
  respPortaria: "", respPortariaData: "",
  usuarios: [],
  uploadedDocs: {},
};

// ─── Step 1 — Identificação ───────────────────────────────────────────────────

function Step1({ data, set, errors }: { data: FormData; set: (p: Partial<FormData>) => void; errors: Record<string, string> }) {
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjMsg, setCnpjMsg] = useState("");

  const buscarCNPJ = async () => {
    const clean = data.cnpj.replace(/\D/g, "");
    if (clean.length !== 14) { setCnpjMsg("CNPJ inválido."); return; }
    setCnpjLoading(true);
    setCnpjMsg("");
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      set({
        nomeOficial: json.razao_social ?? "",
        nomePopular: json.nome_fantasia ?? "",
        telefone: json.ddd_telefone_1 ? maskPhone(json.ddd_telefone_1) : data.telefone,
        email: json.email ?? data.email,
        cep: json.cep ? maskCEP(json.cep) : data.cep,
        logradouro: json.logradouro ?? data.logradouro,
        numero: json.numero ?? data.numero,
        complemento: json.complemento ?? data.complemento,
        bairro: json.bairro ?? data.bairro,
        municipio: json.municipio ?? data.municipio,
        endUf: json.uf ?? data.endUf,
      });
    } catch {
      setCnpjMsg("CNPJ não encontrado. Preencha os dados manualmente.");
    } finally {
      setCnpjLoading(false);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Alert severity="info" icon={<CorporateFareIcon />}>
        Informe o CNPJ do órgão ou entidade para preencher automaticamente os dados cadastrais.
      </Alert>

      <Grid container spacing={2}>
        {/* CNPJ */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="CNPJ do Órgão / Entidade"
            fullWidth size="small"
            value={data.cnpj}
            onChange={(e) => { setCnpjMsg(""); set({ cnpj: maskCNPJ(e.target.value) }); }}
            placeholder="00.000.000/0000-00"
            error={Boolean(errors.cnpj)}
            helperText={errors.cnpj || cnpjMsg}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    variant="contained"
                    onClick={buscarCNPJ}
                    disabled={cnpjLoading}
                    sx={{ minWidth: 0, px: 1.5, py: 0.5, fontSize: 12 }}
                  >
                    {cnpjLoading ? <CircularProgress size={14} color="inherit" /> : "Buscar"}
                  </Button>
                </InputAdornment>
              ),
            }}
          />
        </Grid>

        {/* Nome Oficial */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Nome Oficial / Razão Social"
            fullWidth size="small"
            value={data.nomeOficial}
            onChange={(e) => set({ nomeOficial: e.target.value })}
            error={Boolean(errors.nomeOficial)}
            helperText={errors.nomeOficial}
          />
        </Grid>

        {/* Nome Popular */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Nome Popular / Sigla"
            fullWidth size="small"
            value={data.nomePopular}
            onChange={(e) => set({ nomePopular: e.target.value })}
            placeholder="Ex: PREFEITURA DE SP, TCU, ANATEL"
          />
        </Grid>

        {/* Tipo de Organização */}
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small" error={Boolean(errors.tipo)}>
            <InputLabel>Tipo de Organização</InputLabel>
            <Select label="Tipo de Organização" value={data.tipo} onChange={(e) => set({ tipo: e.target.value })}>
              {TIPOS_ORGANIZACAO.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        {/* Esfera */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small" error={Boolean(errors.esfera)}>
            <InputLabel>Esfera</InputLabel>
            <Select label="Esfera" value={data.esfera} onChange={(e) => set({ esfera: e.target.value })}>
              {ESFERAS.map((e) => <MenuItem key={e} value={e}>{e}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        {/* Poder */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Poder</InputLabel>
            <Select label="Poder" value={data.poder} onChange={(e) => set({ poder: e.target.value })}>
              {PODERES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        {/* Natureza Jurídica */}
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth size="small">
            <InputLabel>Natureza Jurídica</InputLabel>
            <Select label="Natureza Jurídica" value={data.natureza} onChange={(e) => set({ natureza: e.target.value })}>
              {NATUREZAS_JURIDICAS.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        {/* UF */}
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small" error={Boolean(errors.uf)}>
            <InputLabel>UF</InputLabel>
            <Select label="UF" value={data.uf} onChange={(e) => set({ uf: e.target.value })}>
              {ESTADOS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>

        {/* Código IBGE */}
        <Grid item xs={12} sm={3}>
          <TextField
            label="Código IBGE"
            fullWidth size="small"
            value={data.codigoIbge}
            onChange={(e) => set({ codigoIbge: e.target.value.replace(/\D/g, "").slice(0, 7) })}
            placeholder="7 dígitos"
            helperText="Município (se aplicável)"
          />
        </Grid>

        {/* Telefone */}
        <Grid item xs={12} sm={3}>
          <TextField
            label="Telefone"
            fullWidth size="small"
            value={data.telefone}
            onChange={(e) => set({ telefone: maskPhone(e.target.value) })}
            error={Boolean(errors.telefone)}
            helperText={errors.telefone}
            placeholder="(00) 0000-0000"
          />
        </Grid>

        {/* E-mail */}
        <Grid item xs={12} sm={3}>
          <TextField
            label="E-mail institucional"
            fullWidth size="small"
            type="email"
            value={data.email}
            onChange={(e) => set({ email: e.target.value })}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
        </Grid>

        {/* Site */}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Site oficial (opcional)"
            fullWidth size="small"
            value={data.site}
            onChange={(e) => set({ site: e.target.value })}
            placeholder="https://www.orgao.gov.br"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Step 2 — Endereço ────────────────────────────────────────────────────────

function Step2({ data, set, errors }: { data: FormData; set: (p: Partial<FormData>) => void; errors: Record<string, string> }) {
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState("");

  const buscarCEP = async () => {
    const clean = data.cep.replace(/\D/g, "");
    if (clean.length !== 8) { setCepError("CEP inválido."); return; }
    setCepLoading(true);
    setCepError("");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const json = await res.json();
      if (json.erro) { setCepError("CEP não encontrado."); return; }
      set({
        logradouro: json.logradouro ?? "",
        bairro: json.bairro ?? "",
        municipio: json.localidade ?? "",
        endUf: json.uf ?? "",
        complemento: json.complemento ?? "",
      });
    } catch {
      setCepError("Erro ao buscar CEP. Preencha manualmente.");
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={5}>
        <TextField
          label="CEP"
          fullWidth size="small"
          value={data.cep}
          onChange={(e) => { setCepError(""); set({ cep: maskCEP(e.target.value) }); }}
          placeholder="00000-000"
          error={Boolean(errors.cep || cepError)}
          helperText={errors.cep || cepError}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Button
                  size="small" variant="contained"
                  onClick={buscarCEP}
                  disabled={cepLoading}
                  sx={{ minWidth: 0, px: 1.5, py: 0.5, fontSize: 12 }}
                >
                  {cepLoading ? <CircularProgress size={14} color="inherit" /> : "Buscar"}
                </Button>
              </InputAdornment>
            ),
          }}
        />
      </Grid>

      <Grid item xs={12} sm={7}>
        <TextField
          label="Logradouro"
          fullWidth size="small"
          value={data.logradouro}
          onChange={(e) => set({ logradouro: e.target.value })}
          error={Boolean(errors.logradouro)}
          helperText={errors.logradouro}
        />
      </Grid>

      <Grid item xs={12} sm={3}>
        <TextField
          label="Número"
          fullWidth size="small"
          value={data.numero}
          onChange={(e) => set({ numero: e.target.value })}
          error={Boolean(errors.numero)}
          helperText={errors.numero}
        />
      </Grid>

      <Grid item xs={12} sm={5}>
        <TextField
          label="Complemento (opcional)"
          fullWidth size="small"
          value={data.complemento}
          onChange={(e) => set({ complemento: e.target.value })}
        />
      </Grid>

      <Grid item xs={12} sm={4}>
        <TextField
          label="Bairro"
          fullWidth size="small"
          value={data.bairro}
          onChange={(e) => set({ bairro: e.target.value })}
        />
      </Grid>

      <Grid item xs={12} sm={6}>
        <TextField
          label="Município"
          fullWidth size="small"
          value={data.municipio}
          onChange={(e) => set({ municipio: e.target.value })}
          error={Boolean(errors.municipio)}
          helperText={errors.municipio}
        />
      </Grid>

      <Grid item xs={12} sm={3}>
        <FormControl fullWidth size="small" error={Boolean(errors.endUf)}>
          <InputLabel>UF</InputLabel>
          <Select label="UF" value={data.endUf} onChange={(e) => set({ endUf: e.target.value })}>
            {ESTADOS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
        </FormControl>
      </Grid>

      <Grid item xs={12} sm={3}>
        <TextField
          label="País"
          fullWidth size="small"
          value={data.pais}
          onChange={(e) => set({ pais: e.target.value })}
        />
      </Grid>
    </Grid>
  );
}

// ─── Step 3 — Responsável ─────────────────────────────────────────────────────

function Step3({ data, set, errors }: { data: FormData; set: (p: Partial<FormData>) => void; errors: Record<string, string> }) {
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2.5 }}>
        Informe os dados do responsável legal designado para representar a organização no sistema. Deve ser o mesmo indicado na portaria de designação.
      </Alert>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={8}>
          <TextField
            label="Nome completo"
            fullWidth size="small"
            value={data.respNome}
            onChange={(e) => set({ respNome: e.target.value })}
            error={Boolean(errors.respNome)}
            helperText={errors.respNome}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="Cargo / Função"
            fullWidth size="small"
            value={data.respCargo}
            onChange={(e) => set({ respCargo: e.target.value })}
            error={Boolean(errors.respCargo)}
            helperText={errors.respCargo}
            placeholder="Ex: Secretário, Diretor..."
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="CPF"
            fullWidth size="small"
            value={data.respCpf}
            onChange={(e) => set({ respCpf: maskCPF(e.target.value) })}
            error={Boolean(errors.respCpf)}
            helperText={errors.respCpf}
            placeholder="000.000.000-00"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="RG"
            fullWidth size="small"
            value={data.respRg}
            onChange={(e) => set({ respRg: e.target.value })}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="Órgão emissor do RG"
            fullWidth size="small"
            value={data.respOrgaoEmissor}
            onChange={(e) => set({ respOrgaoEmissor: e.target.value })}
            placeholder="SSP/UF"
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="Data de nascimento"
            type="date"
            fullWidth size="small"
            value={data.respNasc}
            onChange={(e) => set({ respNasc: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="Telefone"
            fullWidth size="small"
            value={data.respTelefone}
            onChange={(e) => set({ respTelefone: maskPhone(e.target.value) })}
            placeholder="(00) 00000-0000"
            error={Boolean(errors.respTelefone)}
            helperText={errors.respTelefone}
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="E-mail"
            fullWidth size="small"
            type="email"
            value={data.respEmail}
            onChange={(e) => set({ respEmail: e.target.value })}
            error={Boolean(errors.respEmail)}
            helperText={errors.respEmail}
          />
        </Grid>

        <Grid item xs={12}>
          <Divider sx={{ my: 0.5 }}>
            <Typography variant="caption" color="text.secondary">Portaria de Designação</Typography>
          </Divider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Nº da Portaria / Ato de Designação"
            fullWidth size="small"
            value={data.respPortaria}
            onChange={(e) => set({ respPortaria: e.target.value })}
            placeholder="Ex: Portaria nº 001/2024"
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            label="Data da Portaria"
            type="date"
            fullWidth size="small"
            value={data.respPortariaData}
            onChange={(e) => set({ respPortariaData: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Step 4 — Acesso ao Sistema ───────────────────────────────────────────────

function Step4({ data, set, errors }: { data: FormData; set: (p: Partial<FormData>) => void; errors: Record<string, string> }) {
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState({ nome: "", cpf: "", email: "", perfil: "" });
  const [draftErrors, setDraftErrors] = useState<Record<string, string>>({});

  const handleAdd = () => {
    const errs: Record<string, string> = {};
    if (!draft.nome.trim()) errs.nome = "Obrigatório";
    if (!draft.cpf.trim()) errs.cpf = "Obrigatório";
    if (!draft.email.trim() || !draft.email.includes("@")) errs.email = "E-mail inválido";
    if (!draft.perfil) errs.perfil = "Selecione o perfil";
    setDraftErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const novo: UsuarioAcesso = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      nome: draft.nome,
      cpf: draft.cpf,
      email: draft.email,
      perfil: draft.perfil,
    };
    set({ usuarios: [...data.usuarios, novo] });
    setDraft({ nome: "", cpf: "", email: "", perfil: "" });
    setDraftErrors({});
    setShowForm(false);
  };

  const handleRemove = (id: string) => {
    set({ usuarios: data.usuarios.filter((u) => u.id !== id) });
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2.5 }}>
        Cadastre os usuários que terão acesso ao sistema de licitações em nome desta organização. O responsável designado no passo anterior será o usuário principal (Gestor).
      </Alert>

      {errors.usuarios && <Alert severity="error" sx={{ mb: 2 }}>{errors.usuarios}</Alert>}

      {/* Lista de usuários */}
      {data.usuarios.length > 0 && (
        <Box sx={{ mb: 2 }}>
          {data.usuarios.map((u, i) => (
            <React.Fragment key={u.id}>
              {i > 0 && <Divider />}
              <Box
                sx={{
                  display: "flex", alignItems: "center", gap: 1.5,
                  py: 1.5, px: 0.5,
                }}
              >
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: "50%",
                    bgcolor: "primary.main", color: "white",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 15, flexShrink: 0,
                  }}
                >
                  {u.nome.charAt(0).toUpperCase()}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{u.nome}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>{u.email} · CPF: {u.cpf}</Typography>
                </Box>
                <Chip
                  label={PERFIS_ACESSO.find((p) => p.value === u.perfil)?.label ?? u.perfil}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <IconButton
                  size="small"
                  onClick={() => handleRemove(u.id)}
                  sx={{ color: "error.main" }}
                >
                  ✕
                </IconButton>
              </Box>
            </React.Fragment>
          ))}
        </Box>
      )}

      {/* Formulário de novo usuário */}
      {showForm ? (
        <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>
            Novo Usuário
          </Typography>
          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nome completo"
                fullWidth size="small"
                value={draft.nome}
                onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))}
                error={Boolean(draftErrors.nome)}
                helperText={draftErrors.nome}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="CPF"
                fullWidth size="small"
                value={draft.cpf}
                onChange={(e) => setDraft((d) => ({ ...d, cpf: maskCPF(e.target.value) }))}
                placeholder="000.000.000-00"
                error={Boolean(draftErrors.cpf)}
                helperText={draftErrors.cpf}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="E-mail"
                fullWidth size="small"
                type="email"
                value={draft.email}
                onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                error={Boolean(draftErrors.email)}
                helperText={draftErrors.email}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" error={Boolean(draftErrors.perfil)}>
                <InputLabel>Perfil de Acesso</InputLabel>
                <Select
                  label="Perfil de Acesso"
                  value={draft.perfil}
                  onChange={(e) => setDraft((d) => ({ ...d, perfil: e.target.value }))}
                >
                  {PERFIS_ACESSO.map((p) => (
                    <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
          <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
            <Button size="small" onClick={() => { setShowForm(false); setDraft({ nome: "", cpf: "", email: "", perfil: "" }); setDraftErrors({}); }}>
              Cancelar
            </Button>
            <Button size="small" variant="contained" onClick={handleAdd} startIcon={<PersonAddIcon />}>
              Adicionar Usuário
            </Button>
          </Box>
        </Paper>
      ) : (
        <Button
          variant="outlined"
          startIcon={<PersonAddIcon />}
          onClick={() => setShowForm(true)}
          sx={{ mt: data.usuarios.length > 0 ? 1 : 0 }}
        >
          Adicionar Usuário
        </Button>
      )}
    </Box>
  );
}

// ─── Step 5 — Documentos ──────────────────────────────────────────────────────

function Step5({ data, set }: { data: FormData; set: (p: Partial<FormData>) => void }) {
  const handleUpload = (docId: string) => {
    set({ uploadedDocs: { ...data.uploadedDocs, [docId]: true } });
  };

  const requiredCount = DOCUMENTOS_ORG.filter((d) => d.required).length;
  const uploadedRequired = DOCUMENTOS_ORG.filter((d) => d.required && data.uploadedDocs[d.id]).length;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Faça upload dos documentos obrigatórios para concluir o cadastro. Os documentos opcionais podem ser enviados posteriormente.
      </Alert>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {uploadedRequired} de {requiredCount} obrigatório(s) enviado(s)
        </Typography>
        <Box sx={{ height: 4, bgcolor: "divider", borderRadius: 2, mt: 0.5 }}>
          <Box
            sx={{
              height: "100%",
              width: `${requiredCount > 0 ? (uploadedRequired / requiredCount) * 100 : 0}%`,
              bgcolor: "primary.main",
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {DOCUMENTOS_ORG.map((doc) => {
          const uploaded = Boolean(data.uploadedDocs[doc.id]);
          return (
            <Paper
              key={doc.id}
              variant="outlined"
              sx={{
                p: 2, display: "flex", alignItems: "center", gap: 2,
                borderColor: uploaded ? "success.main" : "divider",
                bgcolor: uploaded ? "success.50" : "transparent",
              }}
            >
              <InsertDriveFileIcon sx={{ color: uploaded ? "success.main" : "text.disabled", flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{doc.name}</Typography>
                  {doc.required
                    ? <Chip label="Obrigatório" size="small" color="error" variant="outlined" sx={{ fontSize: 10 }} />
                    : <Chip label="Opcional" size="small" variant="outlined" sx={{ fontSize: 10 }} />
                  }
                </Box>
                <Typography variant="caption" color="text.secondary">{doc.desc}</Typography>
              </Box>
              {uploaded ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: "success.main", flexShrink: 0 }}>
                  <CheckCircleIcon fontSize="small" />
                  <Typography variant="caption" fontWeight={600}>Enviado</Typography>
                </Box>
              ) : (
                <Button
                  size="small" variant="outlined"
                  startIcon={<UploadFileIcon />}
                  onClick={() => handleUpload(doc.id)}
                  sx={{ flexShrink: 0, fontSize: 12 }}
                >
                  Upload
                </Button>
              )}
            </Paper>
          );
        })}
      </Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganizacaoCadastroPage() {
  const navigate = useNavigate();
  const { activeProfile } = useProfile();

  const [activeStep, setActiveStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);

  const set = useCallback((patch: Partial<FormData>) => {
    setData((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (activeStep === 0) {
      if (!data.cnpj || !isCNPJValid(data.cnpj)) errs.cnpj = "CNPJ inválido ou não informado";
      if (!data.nomeOficial.trim()) errs.nomeOficial = "Campo obrigatório";
      if (!data.tipo) errs.tipo = "Selecione o tipo de organização";
      if (!data.esfera) errs.esfera = "Selecione a esfera";
      if (!data.uf) errs.uf = "Selecione o estado";
      if (!data.telefone.trim()) errs.telefone = "Campo obrigatório";
      if (!data.email.trim() || !data.email.includes("@")) errs.email = "E-mail inválido";
    }

    if (activeStep === 1) {
      if (!data.cep.trim()) errs.cep = "Campo obrigatório";
      if (!data.logradouro.trim()) errs.logradouro = "Campo obrigatório";
      if (!data.numero.trim()) errs.numero = "Campo obrigatório";
      if (!data.municipio.trim()) errs.municipio = "Campo obrigatório";
      if (!data.endUf) errs.endUf = "Campo obrigatório";
    }

    if (activeStep === 2) {
      if (!data.respNome.trim()) errs.respNome = "Campo obrigatório";
      if (!data.respCpf.trim()) errs.respCpf = "Campo obrigatório";
      if (!data.respCargo.trim()) errs.respCargo = "Campo obrigatório";
      if (!data.respTelefone.trim()) errs.respTelefone = "Campo obrigatório";
      if (!data.respEmail.trim() || !data.respEmail.includes("@")) errs.respEmail = "E-mail inválido";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (activeStep < STEPS.length - 1) setActiveStep((s) => s + 1);
    else setCompleted(true);
  };

  const handleBack = () => setActiveStep((s) => Math.max(0, s - 1));

  // Bloqueio quando não está no perfil cidadão (após todos os hooks)
  if (activeProfile !== "citizen") {
    return (
      <Box sx={{ maxWidth: 480, mx: "auto", textAlign: "center", py: 8 }}>
        <Box
          sx={{
            width: 72, height: 72, borderRadius: "50%",
            bgcolor: "warning.50", display: "flex", alignItems: "center",
            justifyContent: "center", mx: "auto", mb: 2,
          }}
        >
          <LockIcon sx={{ fontSize: 36, color: "warning.main" }} />
        </Box>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
          Acesso restrito ao perfil Cidadão
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          O cadastro de organização só pode ser realizado pelo perfil <strong>Cidadão</strong>.
          Troque de perfil no menu superior para continuar.
        </Typography>
        <Button variant="contained" onClick={() => navigate("/dashboard")}>
          Voltar ao Painel
        </Button>
      </Box>
    );
  }

  if (completed) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", textAlign: "center", py: 6 }}>
        <CheckCircleIcon sx={{ fontSize: 72, color: "success.main", mb: 2 }} />
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Cadastro enviado com sucesso!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          O cadastro de <strong>{data.nomeOficial || "sua organização"}</strong> foi registrado e está em análise pela equipe da plataforma.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Você receberá um e-mail de confirmação em breve. Após aprovação, os usuários cadastrados poderão acessar o sistema de licitações em nome da organização.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="contained" onClick={() => navigate("/dashboard")}>
            Voltar ao Painel
          </Button>
          <Button
            variant="outlined"
            onClick={() => { setCompleted(false); setActiveStep(0); setData(INITIAL); setErrors({}); }}
          >
            Novo Cadastro
          </Button>
        </Box>
      </Box>
    );
  }

  const stepProps = { data, set, errors };

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconButton
          onClick={() => navigate("/dashboard")}
          size="small"
          sx={{ border: "1px solid", borderColor: "divider" }}
        >
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight={700}>Cadastrar Organização</Typography>
          <Typography variant="caption" color="text.secondary">
            Passo {activeStep + 1} de {STEPS.length} — {STEPS[activeStep]}
          </Typography>
        </Box>
        <Box sx={{ ml: "auto" }}>
          <Chip
            icon={<CorporateFareIcon sx={{ fontSize: 15 }} />}
            label="Perfil Cidadão"
            size="small"
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      {/* Stepper */}
      <Box sx={{ mb: 3, overflowX: "auto" }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {STEPS.map((label, i) => (
            <Step key={label} completed={i < activeStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Form card */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5 }}>
            {STEPS[activeStep]}
          </Typography>

          {activeStep === 0 && <Step1 {...stepProps} />}
          {activeStep === 1 && <Step2 {...stepProps} />}
          {activeStep === 2 && <Step3 {...stepProps} />}
          {activeStep === 3 && <Step4 {...stepProps} />}
          {activeStep === 4 && <Step5 data={data} set={set} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2.5 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          Anterior
        </Button>
        <Button
          variant="contained"
          endIcon={activeStep === STEPS.length - 1 ? <CheckCircleIcon /> : <ArrowForwardIcon />}
          onClick={handleNext}
          sx={{ bgcolor: "#2c3f31", "&:hover": { bgcolor: "#1e2c22" } }}
        >
          {activeStep === STEPS.length - 1 ? "Finalizar Cadastro" : "Próximo"}
        </Button>
      </Box>
    </Box>
  );
}
