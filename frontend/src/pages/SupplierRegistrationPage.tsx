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
  FormControlLabel,
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
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SearchIcon from "@mui/icons-material/Search";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import { useNavigate } from "react-router-dom";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  "Identificação",
  "Endereço",
  "Dados bancários",
  "Representante legal",
  "Segmentos",
  "Documentos",
];

const BANKS = [
  { code: "001", name: "Banco do Brasil" },
  { code: "033", name: "Santander" },
  { code: "104", name: "Caixa Econômica Federal" },
  { code: "237", name: "Bradesco" },
  { code: "341", name: "Itaú Unibanco" },
  { code: "260", name: "Nu Pagamentos (Nubank)" },
  { code: "077", name: "Banco Inter" },
  { code: "756", name: "Sicoob" },
  { code: "748", name: "Sicredi" },
  { code: "422", name: "Banco Safra" },
  { code: "070", name: "BRB – Banco de Brasília" },
  { code: "655", name: "Votorantim" },
  { code: "212", name: "Banco Original" },
  { code: "290", name: "PagBank" },
  { code: "336", name: "C6 Bank" },
  { code: "389", name: "Banco Mercantil" },
  { code: "380", name: "PicPay" },
  { code: "745", name: "Citibank" },
  { code: "041", name: "Banrisul" },
  { code: "004", name: "BNB – Banco do Nordeste" },
];

const SEGMENTS_DATA = [
  { id: 1, name: "Tecnologia da Informação e Software", cnae: "CNAE 62.01-5" },
  { id: 2, name: "Consultoria e Serviços Profissionais", cnae: "CNAE 70.20-4" },
  { id: 3, name: "Obras e Construção Civil", cnae: "CNAE 41.10-7" },
  { id: 4, name: "Material de Escritório e Papelaria", cnae: "CNAE 46.47-8" },
  { id: 5, name: "Equipamentos de Informática", cnae: "CNAE 46.51-6" },
  { id: 6, name: "Saúde e Produtos Médicos", cnae: "CNAE 46.44-3" },
  { id: 7, name: "Alimentação e Refeições Coletivas", cnae: "CNAE 56.11-2" },
  { id: 8, name: "Limpeza, Higiene e Conservação", cnae: "CNAE 81.21-4" },
  { id: 9, name: "Segurança Patrimonial e Eletrônica", cnae: "CNAE 80.11-1" },
  { id: 10, name: "Transporte e Logística", cnae: "CNAE 49.30-2" },
  { id: 11, name: "Comunicação, Marketing e Publicidade", cnae: "CNAE 73.11-4" },
  { id: 12, name: "Engenharia e Projetos Técnicos", cnae: "CNAE 71.12-0" },
  { id: 13, name: "Meio Ambiente e Sustentabilidade", cnae: "CNAE 74.90-1" },
  { id: 14, name: "Energia, Elétrica e Utilidades", cnae: "CNAE 35.14-6" },
  { id: 15, name: "Educação e Treinamento", cnae: "CNAE 85.99-6" },
  { id: 16, name: "Financeiro, Contábil e Jurídico", cnae: "CNAE 69.20-6" },
  { id: 17, name: "Vestuário, EPIs e Uniformes", cnae: "CNAE 46.42-7" },
  { id: 18, name: "Móveis, Equipamentos e Decoração", cnae: "CNAE 47.54-7" },
  { id: 19, name: "Veículos, Locação e Manutenção", cnae: "CNAE 45.20-0" },
  { id: 20, name: "Telecomunicações e Internet", cnae: "CNAE 61.10-8" },
  { id: 21, name: "Impressão, Gráfica e Editorial", cnae: "CNAE 18.21-1" },
  { id: 22, name: "Pesquisa, Desenvolvimento e Inovação", cnae: "CNAE 72.10-0" },
  { id: 23, name: "Turismo, Hospedagem e Eventos", cnae: "CNAE 55.10-8" },
  { id: 24, name: "Cultura, Arte e Entretenimento", cnae: "CNAE 90.01-9" },
];

const DOCUMENTS_DATA = [
  { id: "contrato-social", name: "Contrato Social / Estatuto / CCMEI", required: true, desc: "Documento de constituição com última alteração registrada" },
  { id: "cartao-cnpj", name: "Cartão CNPJ", required: true, desc: "Comprovante de inscrição e situação cadastral (CNPJ)" },
  { id: "cnd-federal", name: "CND Federal / PGFN", required: true, desc: "Certidão Negativa de Débitos Federais válida" },
  { id: "cnd-estadual", name: "CND Estadual", required: true, desc: "Certidão Negativa de Débitos com a Fazenda Estadual" },
  { id: "cnd-municipal", name: "CND Municipal", required: true, desc: "Certidão Negativa de Débitos com a Fazenda Municipal" },
  { id: "fgts", name: "CRF – Certificado de Regularidade FGTS", required: true, desc: "Emitido pela Caixa Econômica Federal" },
  { id: "cndt", name: "CNDT – Certidão Trabalhista", required: true, desc: "Certidão Negativa de Débitos Trabalhistas" },
  { id: "balanco", name: "Balanço Patrimonial", required: false, desc: "Último exercício social (quando exigido pelo edital)" },
  { id: "atestado", name: "Atestado de Capacidade Técnica", required: false, desc: "Comprovação de execução de objeto compatível" },
];

const PORTES = [
  "Microempreendedor Individual (MEI)",
  "Microempresa (ME)",
  "Empresa de Pequeno Porte (EPP)",
  "Empresa de Médio Porte",
  "Grande Empresa",
];

const NATUREZAS = [
  "Empresário Individual",
  "Sociedade Empresária Limitada (LTDA)",
  "Sociedade Anônima (S/A)",
  "Empresa Individual de Responsabilidade Limitada (EIRELI)",
  "Microempreendedor Individual (MEI)",
  "Cooperativa",
  "Fundação Privada",
  "Associação",
  "Outros",
];

const ESTADOS = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG",
  "PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
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

function maskCPFOrCNPJ(v: string) {
  const d = v.replace(/\D/g, "");
  return d.length <= 11 ? maskCPF(v) : maskCNPJ(v);
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

interface FormData {
  // Step 1
  tipo: "PJ" | "PF";
  cnpj: string;
  abertura: string;
  razaoSocial: string;
  nomeFantasia: string;
  porte: string;
  natureza: string;
  ie: string;
  ieIsento: boolean;
  im: string;
  imIsento: boolean;
  telefone: string;
  email: string;
  site: string;
  // Step 2
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  pais: string;
  // Step 3
  banco: string;
  tipoConta: "corrente" | "poupanca";
  agencia: string;
  agenciaDigito: string;
  conta: string;
  contaDigito: string;
  titular: string;
  cpfCnpjTitular: string;
  pixTipo: string;
  pixValor: string;
  // Step 4
  repNome: string;
  repCpf: string;
  repRg: string;
  repOrgao: string;
  repNasc: string;
  repCargo: string;
  repTelefone: string;
  repEmail: string;
  repMandatoInicio: string;
  repMandatoFim: string;
  // Step 5
  selectedSegments: number[];
  // Step 6
  uploadedDocs: Record<string, boolean>;
}

const INITIAL: FormData = {
  tipo: "PJ",
  cnpj: "", abertura: "", razaoSocial: "", nomeFantasia: "",
  porte: "", natureza: "", ie: "", ieIsento: false, im: "", imIsento: false,
  telefone: "", email: "", site: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", municipio: "", uf: "", pais: "Brasil",
  banco: "", tipoConta: "corrente", agencia: "", agenciaDigito: "", conta: "", contaDigito: "",
  titular: "", cpfCnpjTitular: "", pixTipo: "", pixValor: "",
  repNome: "", repCpf: "", repRg: "", repOrgao: "", repNasc: "", repCargo: "",
  repTelefone: "", repEmail: "", repMandatoInicio: "", repMandatoFim: "",
  selectedSegments: [],
  uploadedDocs: {},
};

// ─── Step 1 Component ─────────────────────────────────────────────────────────

function Step1({ data, set, errors }: { data: FormData; set: (p: Partial<FormData>) => void; errors: Record<string, string> }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block" }}>
          Tipo de pessoa
        </Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          {(["PJ", "PF"] as const).map((t) => (
            <Button
              key={t}
              variant={data.tipo === t ? "contained" : "outlined"}
              onClick={() => set({ tipo: t })}
              sx={{ flex: 1, py: 1 }}
            >
              {t === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
            </Button>
          ))}
        </Box>
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label={data.tipo === "PJ" ? "CNPJ" : "CPF"}
            fullWidth size="small"
            value={data.cnpj}
            onChange={(e) => set({ cnpj: data.tipo === "PJ" ? maskCNPJ(e.target.value) : maskCPF(e.target.value) })}
            error={Boolean(errors.cnpj)}
            helperText={errors.cnpj}
            placeholder={data.tipo === "PJ" ? "00.000.000/0000-00" : "000.000.000-00"}
          />
        </Grid>
        {data.tipo === "PJ" && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Data de abertura"
              type="date"
              fullWidth size="small"
              value={data.abertura}
              onChange={(e) => set({ abertura: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        )}
        <Grid item xs={12} sm={6}>
          <TextField
            label={data.tipo === "PJ" ? "Razão Social" : "Nome Completo"}
            fullWidth size="small"
            value={data.razaoSocial}
            onChange={(e) => set({ razaoSocial: e.target.value })}
            error={Boolean(errors.razaoSocial)}
            helperText={errors.razaoSocial}
          />
        </Grid>
        {data.tipo === "PJ" && (
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nome Fantasia"
              fullWidth size="small"
              value={data.nomeFantasia}
              onChange={(e) => set({ nomeFantasia: e.target.value })}
            />
          </Grid>
        )}
        {data.tipo === "PJ" && (
          <>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Porte da Empresa</InputLabel>
                <Select label="Porte da Empresa" value={data.porte} onChange={(e) => set({ porte: e.target.value })}>
                  {PORTES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Natureza Jurídica</InputLabel>
                <Select label="Natureza Jurídica" value={data.natureza} onChange={(e) => set({ natureza: e.target.value })}>
                  {NATUREZAS.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Inscrição Estadual"
                fullWidth size="small"
                value={data.ie}
                onChange={(e) => set({ ie: e.target.value })}
                disabled={data.ieIsento}
              />
              <FormControlLabel
                control={<Switch size="small" checked={data.ieIsento} onChange={(e) => set({ ieIsento: e.target.checked, ie: e.target.checked ? "ISENTO" : "" })} />}
                label={<Typography variant="caption">Isento</Typography>}
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Inscrição Municipal"
                fullWidth size="small"
                value={data.im}
                onChange={(e) => set({ im: e.target.value })}
                disabled={data.imIsento}
              />
              <FormControlLabel
                control={<Switch size="small" checked={data.imIsento} onChange={(e) => set({ imIsento: e.target.checked, im: e.target.checked ? "ISENTO" : "" })} />}
                label={<Typography variant="caption">Isento</Typography>}
                sx={{ mt: 0.5 }}
              />
            </Grid>
          </>
        )}
        <Grid item xs={12} sm={6}>
          <TextField
            label="Telefone"
            fullWidth size="small"
            value={data.telefone}
            onChange={(e) => set({ telefone: maskPhone(e.target.value) })}
            error={Boolean(errors.telefone)}
            helperText={errors.telefone}
            placeholder="(00) 00000-0000"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="E-mail"
            fullWidth size="small"
            type="email"
            value={data.email}
            onChange={(e) => set({ email: e.target.value })}
            error={Boolean(errors.email)}
            helperText={errors.email}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            label="Site / Website (opcional)"
            fullWidth size="small"
            value={data.site}
            onChange={(e) => set({ site: e.target.value })}
            placeholder="https://"
          />
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Step 2 Component ─────────────────────────────────────────────────────────

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
        uf: json.uf ?? "",
        complemento: json.complemento ?? "",
      });
    } catch {
      setCepError("Erro ao buscar CEP. Verifique a conexão.");
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
                  size="small"
                  variant="contained"
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
        <FormControl fullWidth size="small" error={Boolean(errors.uf)}>
          <InputLabel>UF</InputLabel>
          <Select label="UF" value={data.uf} onChange={(e) => set({ uf: e.target.value })}>
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

// ─── Step 3 Component ─────────────────────────────────────────────────────────

function Step3({ data, set, errors }: { data: FormData; set: (p: Partial<FormData>) => void; errors: Record<string, string> }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={8}>
        <FormControl fullWidth size="small" error={Boolean(errors.banco)}>
          <InputLabel>Banco</InputLabel>
          <Select label="Banco" value={data.banco} onChange={(e) => set({ banco: e.target.value })}>
            {BANKS.map((b) => (
              <MenuItem key={b.code} value={b.code}>{b.code} – {b.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={4}>
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 1, display: "block" }}>
            Tipo de conta
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            {(["corrente", "poupanca"] as const).map((t) => (
              <Button
                key={t}
                variant={data.tipoConta === t ? "contained" : "outlined"}
                onClick={() => set({ tipoConta: t })}
                size="small"
                sx={{ flex: 1 }}
              >
                {t === "corrente" ? "Corrente" : "Poupança"}
              </Button>
            ))}
          </Box>
        </Box>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Agência"
          fullWidth size="small"
          value={data.agencia}
          onChange={(e) => set({ agencia: e.target.value.replace(/\D/g, "").slice(0, 6) })}
          error={Boolean(errors.agencia)}
          helperText={errors.agencia}
        />
      </Grid>
      <Grid item xs={12} sm={2}>
        <TextField
          label="Dígito"
          fullWidth size="small"
          value={data.agenciaDigito}
          onChange={(e) => set({ agenciaDigito: e.target.value.slice(0, 2) })}
          placeholder="X"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Conta"
          fullWidth size="small"
          value={data.conta}
          onChange={(e) => set({ conta: e.target.value.replace(/\D/g, "").slice(0, 12) })}
          error={Boolean(errors.conta)}
          helperText={errors.conta}
        />
      </Grid>
      <Grid item xs={12} sm={2}>
        <TextField
          label="Dígito"
          fullWidth size="small"
          value={data.contaDigito}
          onChange={(e) => set({ contaDigito: e.target.value.slice(0, 2) })}
          placeholder="X"
        />
      </Grid>
      <Grid item xs={12} sm={8}>
        <TextField
          label="Nome do titular"
          fullWidth size="small"
          value={data.titular}
          onChange={(e) => set({ titular: e.target.value })}
          error={Boolean(errors.titular)}
          helperText={errors.titular}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="CPF / CNPJ do titular"
          fullWidth size="small"
          value={data.cpfCnpjTitular}
          onChange={(e) => set({ cpfCnpjTitular: maskCPFOrCNPJ(e.target.value) })}
        />
      </Grid>

      <Grid item xs={12}>
        <Divider sx={{ my: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Chave PIX (opcional)</Typography>
        </Divider>
      </Grid>
      <Grid item xs={12} sm={4}>
        <FormControl fullWidth size="small">
          <InputLabel>Tipo de chave</InputLabel>
          <Select label="Tipo de chave" value={data.pixTipo} onChange={(e) => set({ pixTipo: e.target.value, pixValor: "" })}>
            <MenuItem value="">Sem chave PIX</MenuItem>
            <MenuItem value="cpf">CPF</MenuItem>
            <MenuItem value="cnpj">CNPJ</MenuItem>
            <MenuItem value="email">E-mail</MenuItem>
            <MenuItem value="telefone">Telefone</MenuItem>
            <MenuItem value="aleatoria">Chave aleatória</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      {data.pixTipo && (
        <Grid item xs={12} sm={8}>
          <TextField
            label="Valor da chave PIX"
            fullWidth size="small"
            value={data.pixValor}
            onChange={(e) => {
              let v = e.target.value;
              if (data.pixTipo === "cpf") v = maskCPF(v);
              else if (data.pixTipo === "cnpj") v = maskCNPJ(v);
              else if (data.pixTipo === "telefone") v = maskPhone(v);
              set({ pixValor: v });
            }}
          />
        </Grid>
      )}
    </Grid>
  );
}

// ─── Step 4 Component ─────────────────────────────────────────────────────────

function Step4({ data, set, errors }: { data: FormData; set: (p: Partial<FormData>) => void; errors: Record<string, string> }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} sm={8}>
        <TextField
          label="Nome completo"
          fullWidth size="small"
          value={data.repNome}
          onChange={(e) => set({ repNome: e.target.value })}
          error={Boolean(errors.repNome)}
          helperText={errors.repNome}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Cargo / Função"
          fullWidth size="small"
          value={data.repCargo}
          onChange={(e) => set({ repCargo: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="CPF"
          fullWidth size="small"
          value={data.repCpf}
          onChange={(e) => set({ repCpf: maskCPF(e.target.value) })}
          error={Boolean(errors.repCpf)}
          helperText={errors.repCpf}
          placeholder="000.000.000-00"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="RG"
          fullWidth size="small"
          value={data.repRg}
          onChange={(e) => set({ repRg: e.target.value })}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Órgão emissor"
          fullWidth size="small"
          value={data.repOrgao}
          onChange={(e) => set({ repOrgao: e.target.value })}
          placeholder="SSP/UF"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Data de nascimento"
          type="date"
          fullWidth size="small"
          value={data.repNasc}
          onChange={(e) => set({ repNasc: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Telefone"
          fullWidth size="small"
          value={data.repTelefone}
          onChange={(e) => set({ repTelefone: maskPhone(e.target.value) })}
          placeholder="(00) 00000-0000"
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="E-mail"
          fullWidth size="small"
          type="email"
          value={data.repEmail}
          onChange={(e) => set({ repEmail: e.target.value })}
        />
      </Grid>
      <Grid item xs={12}>
        <Divider sx={{ my: 0.5 }}>
          <Typography variant="caption" color="text.secondary">Mandato (opcional)</Typography>
        </Divider>
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Início do mandato"
          type="date"
          fullWidth size="small"
          value={data.repMandatoInicio}
          onChange={(e) => set({ repMandatoInicio: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
      <Grid item xs={12} sm={4}>
        <TextField
          label="Fim do mandato"
          type="date"
          fullWidth size="small"
          value={data.repMandatoFim}
          onChange={(e) => set({ repMandatoFim: e.target.value })}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );
}

// ─── Step 5 Component ─────────────────────────────────────────────────────────

function Step5({ data, set, errors }: { data: FormData; set: (p: Partial<FormData>) => void; errors: Record<string, string> }) {
  const [filter, setFilter] = useState("");
  const filtered = SEGMENTS_DATA.filter((s) =>
    s.name.toLowerCase().includes(filter.toLowerCase()) || s.cnae.toLowerCase().includes(filter.toLowerCase())
  );

  const toggle = (id: number) => {
    const sel = data.selectedSegments;
    set({ selectedSegments: sel.includes(id) ? sel.filter((s) => s !== id) : [...sel, id] });
  };

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Selecione os segmentos de atuação da sua empresa. Isso permite que os órgãos públicos encontrem você em licitações relevantes.
      </Alert>

      {errors.selectedSegments && <Alert severity="error" sx={{ mb: 2 }}>{errors.selectedSegments}</Alert>}

      <TextField
        placeholder="Filtrar segmentos..."
        fullWidth size="small"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        }}
      />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1,
          maxHeight: 360,
          overflowY: "auto",
          pr: 0.5,
        }}
      >
        {filtered.map((seg) => {
          const selected = data.selectedSegments.includes(seg.id);
          return (
            <Paper
              key={seg.id}
              variant="outlined"
              onClick={() => toggle(seg.id)}
              sx={{
                p: 1.5,
                cursor: "pointer",
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected ? "primary.main" : "transparent",
                color: selected ? "white" : "text.primary",
                transition: "all 0.15s",
                "&:hover": { borderColor: "primary.main", bgcolor: selected ? "primary.dark" : "action.hover" },
                userSelect: "none",
              }}
            >
              <Typography variant="body2" fontWeight={selected ? 600 : 400} sx={{ lineHeight: 1.3 }}>
                {seg.name}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, fontSize: 11 }}>
                {seg.cnae}
              </Typography>
            </Paper>
          );
        })}
      </Box>

      {data.selectedSegments.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
            {data.selectedSegments.length} segmento(s) selecionado(s):
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {data.selectedSegments.map((id) => {
              const seg = SEGMENTS_DATA.find((s) => s.id === id);
              return (
                <Chip
                  key={id}
                  label={seg?.name}
                  size="small"
                  onDelete={() => toggle(id)}
                  color="primary"
                />
              );
            })}
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ─── Step 6 Component ─────────────────────────────────────────────────────────

function Step6({ data, set }: { data: FormData; set: (p: Partial<FormData>) => void }) {
  const handleUpload = (docId: string) => {
    set({ uploadedDocs: { ...data.uploadedDocs, [docId]: true } });
  };

  const requiredCount = DOCUMENTS_DATA.filter((d) => d.required).length;
  const uploadedRequired = DOCUMENTS_DATA.filter((d) => d.required && data.uploadedDocs[d.id]).length;

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Faça upload dos documentos para habilitar sua empresa nas licitações. Documentos obrigatórios precisam ser enviados agora; os opcionais podem ser adicionados depois.
      </Alert>

      <Box sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          {uploadedRequired} de {requiredCount} obrigatório(s) enviado(s)
        </Typography>
        <Box sx={{ height: 4, bgcolor: "divider", borderRadius: 2, mt: 0.5 }}>
          <Box
            sx={{
              height: "100%",
              width: `${(uploadedRequired / requiredCount) * 100}%`,
              bgcolor: "primary.main",
              borderRadius: 2,
              transition: "width 0.3s",
            }}
          />
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {DOCUMENTS_DATA.map((doc) => {
          const uploaded = Boolean(data.uploadedDocs[doc.id]);
          return (
            <Paper
              key={doc.id}
              variant="outlined"
              sx={{
                p: 2,
                display: "flex",
                alignItems: "center",
                gap: 2,
                borderColor: uploaded ? "success.main" : "divider",
                bgcolor: uploaded ? "success.50" : "transparent",
              }}
            >
              <InsertDriveFileIcon
                sx={{ color: uploaded ? "success.main" : "text.disabled", flexShrink: 0 }}
              />
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
                  size="small"
                  variant="outlined"
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

export default function SupplierRegistrationPage() {
  const navigate = useNavigate();
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
      if (!data.cnpj) errs.cnpj = "Campo obrigatório";
      else if (data.tipo === "PJ" && !isCNPJValid(data.cnpj)) errs.cnpj = "CNPJ inválido";
      if (!data.razaoSocial.trim()) errs.razaoSocial = "Campo obrigatório";
      if (!data.email.trim() || !data.email.includes("@")) errs.email = "E-mail inválido";
      if (!data.telefone.trim()) errs.telefone = "Campo obrigatório";
    }

    if (activeStep === 1) {
      if (!data.cep) errs.cep = "Campo obrigatório";
      if (!data.logradouro.trim()) errs.logradouro = "Campo obrigatório";
      if (!data.numero.trim()) errs.numero = "Campo obrigatório";
      if (!data.municipio.trim()) errs.municipio = "Campo obrigatório";
      if (!data.uf) errs.uf = "Campo obrigatório";
    }

    if (activeStep === 2) {
      if (!data.banco) errs.banco = "Selecione o banco";
      if (!data.agencia.trim()) errs.agencia = "Campo obrigatório";
      if (!data.conta.trim()) errs.conta = "Campo obrigatório";
      if (!data.titular.trim()) errs.titular = "Campo obrigatório";
    }

    if (activeStep === 3) {
      if (!data.repNome.trim()) errs.repNome = "Campo obrigatório";
      if (!data.repCpf.trim()) errs.repCpf = "Campo obrigatório";
    }

    if (activeStep === 4) {
      if (data.selectedSegments.length === 0) errs.selectedSegments = "Selecione pelo menos um segmento.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    if (activeStep < STEPS.length - 1) setActiveStep((s) => s + 1);
    else setCompleted(true);
  };

  const handleBack = () => {
    setActiveStep((s) => Math.max(0, s - 1));
  };

  if (completed) {
    return (
      <Box sx={{ maxWidth: 560, mx: "auto", textAlign: "center", py: 6 }}>
        <CheckCircleIcon sx={{ fontSize: 72, color: "success.main", mb: 2 }} />
        <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
          Cadastro enviado com sucesso!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Seu cadastro foi registrado e está em análise. Você receberá um e-mail de confirmação em breve.
          Após aprovação, você poderá participar de licitações públicas.
        </Typography>
        <Box sx={{ display: "flex", gap: 1.5, justifyContent: "center", flexWrap: "wrap" }}>
          <Button variant="contained" onClick={() => navigate("/dashboard")}>
            Voltar ao Painel
          </Button>
          <Button variant="outlined" onClick={() => { setCompleted(false); setActiveStep(0); setData(INITIAL); }}>
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
        <IconButton onClick={() => navigate("/dashboard")} size="small" sx={{ border: "1px solid", borderColor: "divider" }}>
          <ArrowBackIcon fontSize="small" />
        </IconButton>
        <Box>
          <Typography variant="h6" fontWeight={700}>Cadastrar Fornecedor</Typography>
          <Typography variant="caption" color="text.secondary">
            Passo {activeStep + 1} de {STEPS.length} — {STEPS[activeStep]}
          </Typography>
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
          {activeStep === 4 && <Step5 {...stepProps} />}
          {activeStep === 5 && <Step6 {...stepProps} />}
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
        >
          {activeStep === STEPS.length - 1 ? "Finalizar Cadastro" : "Próximo"}
        </Button>
      </Box>
    </Box>
  );
}
