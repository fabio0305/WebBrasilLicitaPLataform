import React, { useEffect, useState, useMemo } from "react";
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
  Skeleton,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PrintIcon from "@mui/icons-material/Print";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import SearchIcon from "@mui/icons-material/Search";
import ArticleIcon from "@mui/icons-material/Article";
import { organApi } from "../api/client";
import type { Declaration, DeclarationStatus } from "../data/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DECLARATION_TYPES: { value: string; label: string; description: string }[] = [
  {
    value: "HABILITACAO",
    label: "Habilitação",
    description: "Declaração de que o proponente atende aos requisitos de habilitação do edital.",
  },
  {
    value: "CUMPRIMENTO_SOCIAL",
    label: "Cumprimento ao Art. 7º CF/88",
    description: "Declaração de que não emprega menores em trabalho noturno, perigoso ou insalubre (art. 7º, XXXIII da CF).",
  },
  {
    value: "NAO_IMPEDIMENTO",
    label: "Inexistência de Impedimento",
    description: "Declaração de inexistência de fatos impeditivos à habilitação e participação na licitação.",
  },
  {
    value: "ME_EPP",
    label: "Microempresa / EPP",
    description: "Declaração de enquadramento como Microempresa ou Empresa de Pequeno Porte (LC 123/2006).",
  },
  {
    value: "IDONEIDADE",
    label: "Idoneidade",
    description: "Declaração de que a empresa não foi declarada inidônea por nenhum ente público.",
  },
  {
    value: "NAO_PARENTESCO",
    label: "Não Parentesco",
    description: "Declaração de ausência de vínculo de parentesco com servidores ou autoridades do órgão licitante.",
  },
  {
    value: "REGULARIDADE_TRABALHISTA",
    label: "Regularidade Trabalhista",
    description: "Declaração de que cumpre as obrigações trabalhistas e previdenciárias perante seus empregados.",
  },
  {
    value: "PERSONALIZADO",
    label: "Personalizado",
    description: "Modelo de declaração personalizado criado pelo órgão.",
  },
];

const TYPE_COLORS: Record<string, string> = {
  HABILITACAO: "#1565C0",
  CUMPRIMENTO_SOCIAL: "#2E7D32",
  NAO_IMPEDIMENTO: "#6A1B9A",
  ME_EPP: "#E65100",
  IDONEIDADE: "#00695C",
  NAO_PARENTESCO: "#AD1457",
  REGULARIDADE_TRABALHISTA: "#F57F17",
  PERSONALIZADO: "#455A64",
};

const DEFAULT_CONTENTS: Record<string, string> = {
  HABILITACAO: `DECLARAÇÃO DE HABILITAÇÃO

Declaro, sob as penas da lei, que a empresa [RAZÃO SOCIAL], inscrita no CNPJ sob nº [CNPJ], representada pelo(a) Sr.(a) [NOME DO REPRESENTANTE], portador(a) do CPF nº [CPF], atende a todos os requisitos de habilitação exigidos no Edital nº [NÚMERO DO EDITAL], do processo licitatório [NÚMERO DO PROCESSO] promovido pelo [NOME DO ÓRGÃO].

[Local], [Data]

___________________________________
[NOME DO REPRESENTANTE LEGAL]
[CARGO]
[CNPJ DA EMPRESA]`,

  CUMPRIMENTO_SOCIAL: `DECLARAÇÃO DE CUMPRIMENTO AO ART. 7º, XXXIII DA CF/88

Declaro, sob as penas da lei, que a empresa [RAZÃO SOCIAL], inscrita no CNPJ sob nº [CNPJ], em conformidade com o disposto no inciso XXXIII do art. 7º da Constituição Federal de 1988, não emprega menor de dezoito anos em trabalho noturno, perigoso ou insalubre, nem menor de dezesseis anos em qualquer trabalho, salvo na condição de aprendiz, a partir dos quatorze anos.

[Local], [Data]

___________________________________
[NOME DO REPRESENTANTE LEGAL]
[CARGO]
[CNPJ DA EMPRESA]`,

  NAO_IMPEDIMENTO: `DECLARAÇÃO DE INEXISTÊNCIA DE FATOS IMPEDITIVOS

Declaro, sob as penas da lei, que a empresa [RAZÃO SOCIAL], inscrita no CNPJ sob nº [CNPJ], não possui qualquer fato impeditivo à sua habilitação e/ou participação na presente licitação, comprometendo-se a comunicar ao [NOME DO ÓRGÃO], qualquer ocorrência futura que possa impedir a contratação.

[Local], [Data]

___________________________________
[NOME DO REPRESENTANTE LEGAL]
[CARGO]
[CNPJ DA EMPRESA]`,

  ME_EPP: `DECLARAÇÃO DE MICROEMPRESA / EMPRESA DE PEQUENO PORTE

Declaro, sob as penas da lei, que a empresa [RAZÃO SOCIAL], inscrita no CNPJ sob nº [CNPJ], é [ ] Microempresa (ME) / [ ] Empresa de Pequeno Porte (EPP), nos termos da Lei Complementar nº 123/2006 e suas alterações, e que não se enquadra em nenhuma das hipóteses de exclusão previstas no § 4º do art. 3º da referida Lei.

[Local], [Data]

___________________________________
[NOME DO REPRESENTANTE LEGAL]
[CARGO]
[CNPJ DA EMPRESA]`,

  IDONEIDADE: `DECLARAÇÃO DE IDONEIDADE

Declaro, sob as penas da lei, que a empresa [RAZÃO SOCIAL], inscrita no CNPJ sob nº [CNPJ], não foi declarada inidônea para licitar ou contratar com a Administração Pública, por nenhum ente público federal, estadual ou municipal, e que não está suspensa temporariamente de participar de licitação ou contratar com [NOME DO ÓRGÃO] ou com qualquer órgão público.

[Local], [Data]

___________________________________
[NOME DO REPRESENTANTE LEGAL]
[CARGO]
[CNPJ DA EMPRESA]`,

  NAO_PARENTESCO: `DECLARAÇÃO DE AUSÊNCIA DE PARENTESCO

Declaro, sob as penas da lei, que não possuo em meu quadro societário, nem como representante desta empresa, servidor público ou cônjuge, companheiro(a) ou parente em linha reta ou colateral, por consanguinidade ou afinidade, até o terceiro grau, de servidor ou autoridade do [NOME DO ÓRGÃO] que seja responsável pela licitação, pela homologação ou pela assinatura do respectivo contrato.

Empresa: [RAZÃO SOCIAL]
CNPJ: [CNPJ]

[Local], [Data]

___________________________________
[NOME DO REPRESENTANTE LEGAL]
[CARGO]`,

  REGULARIDADE_TRABALHISTA: `DECLARAÇÃO DE REGULARIDADE TRABALHISTA

Declaro, sob as penas da lei, que a empresa [RAZÃO SOCIAL], inscrita no CNPJ sob nº [CNPJ], cumpre integralmente as obrigações trabalhistas e previdenciárias decorrentes dos contratos de trabalho celebrados com seus empregados, estando em dia com o pagamento de salários, FGTS, INSS e demais encargos sociais.

[Local], [Data]

___________________________________
[NOME DO REPRESENTANTE LEGAL]
[CARGO]
[CNPJ DA EMPRESA]`,

  PERSONALIZADO: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeLabel(type: string) {
  return DECLARATION_TYPES.find((t) => t.value === type)?.label ?? type;
}

function typeColor(type: string) {
  return TYPE_COLORS[type] ?? "#455A64";
}

// ─── FormDialog ───────────────────────────────────────────────────────────────

interface FormDialogProps {
  open: boolean;
  initial?: Declaration | null;
  onClose: () => void;
  onSave: (data: Pick<Declaration, "name" | "type" | "status" | "content">) => Promise<void>;
}

function FormDialog({ open, initial, onClose, onSave }: FormDialogProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState("HABILITACAO");
  const [status, setStatus] = useState<DeclarationStatus>("draft");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setType(initial?.type ?? "HABILITACAO");
      setStatus(initial?.status ?? "draft");
      setContent(initial?.content ?? DEFAULT_CONTENTS["HABILITACAO"] ?? "");
      setError("");
    }
  }, [open, initial]);

  const handleTypeChange = (newType: string) => {
    setType(newType);
    if (!initial && !content.trim()) {
      setContent(DEFAULT_CONTENTS[newType] ?? "");
    } else if (!initial) {
      setContent(DEFAULT_CONTENTS[newType] ?? "");
    }
    if (!name.trim()) {
      const lbl = DECLARATION_TYPES.find((t) => t.value === newType)?.label ?? "";
      setName(lbl ? `Declaração de ${lbl}` : "");
    }
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Nome obrigatório."); return; }
    setSaving(true);
    setError("");
    try {
      await onSave({ name: name.trim(), type, status, content });
      onClose();
    } catch {
      setError("Erro ao salvar declaração.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {initial ? "Editar Declaração" : "Nova Declaração"}
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Tipo de Declaração</InputLabel>
              <Select
                label="Tipo de Declaração"
                value={type}
                onChange={(e) => handleTypeChange(e.target.value)}
              >
                {DECLARATION_TYPES.map((t) => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              label="Nome / Título"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth size="small"
              placeholder="Ex: Declaração de Habilitação"
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as DeclarationStatus)}
              >
                <MenuItem value="draft">Rascunho</MenuItem>
                <MenuItem value="ready">Pronto</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
              Conteúdo da Declaração
            </Typography>
            <TextField
              value={content}
              onChange={(e) => setContent(e.target.value)}
              fullWidth
              multiline
              rows={16}
              InputProps={{
                sx: { fontFamily: "monospace", fontSize: 13, lineHeight: 1.6 },
              }}
              placeholder="Texto completo da declaração. Use [CAMPO] para campos a preencher."
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
              Use colchetes para campos variáveis: [RAZÃO SOCIAL], [CNPJ], [DATA], [NOME DO REPRESENTANTE]
            </Typography>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {saving ? "Salvando..." : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── DeleteDialog ─────────────────────────────────────────────────────────────

function DeleteDialog({ open, name, onClose, onConfirm }: { open: boolean; name: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Excluir Declaração</DialogTitle>
      <DialogContent>
        <Typography>Deseja excluir permanentemente a declaração <strong>{name}</strong>?</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button variant="contained" color="error" onClick={onConfirm} sx={{ textTransform: "none", fontWeight: 600 }}>Excluir</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── PreviewDialog ────────────────────────────────────────────────────────────

function PreviewDialog({ open, decl, onClose }: { open: boolean; decl: Declaration | null; onClose: () => void }) {
  if (!decl) return null;

  const handlePrint = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>${decl.name}</title>
<style>body{font-family:Arial,sans-serif;padding:40px;max-width:800px;margin:0 auto;font-size:13pt;line-height:1.8}pre{white-space:pre-wrap;font-family:inherit}@media print{button{display:none}}</style>
</head><body><h2>${decl.name}</h2><hr/><pre>${decl.content}</pre></body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: 700 }}>
        {decl.name}
        <Chip
          size="small"
          label={typeLabel(decl.type)}
          sx={{ bgcolor: typeColor(decl.type), color: "white", fontWeight: 600 }}
        />
      </DialogTitle>
      <DialogContent dividers>
        <Box
          component="pre"
          sx={{
            fontFamily: "inherit",
            fontSize: 13,
            lineHeight: 1.8,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            m: 0,
            p: 0,
          }}
        >
          {decl.content || <Typography color="text.secondary" fontStyle="italic">Sem conteúdo.</Typography>}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Fechar</Button>
        <Button
          variant="outlined"
          startIcon={<ContentCopyIcon />}
          onClick={() => navigator.clipboard.writeText(decl.content)}
          sx={{ textTransform: "none" }}
        >
          Copiar
        </Button>
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Declaration Card ─────────────────────────────────────────────────────────

function DeclarationCard({
  decl,
  onEdit,
  onDelete,
  onPreview,
}: {
  decl: Declaration;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const color = typeColor(decl.type);
  const isReady = decl.status === "ready";
  const preview = decl.content.trim().slice(0, 120).replace(/\n/g, " ");

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderLeft: `4px solid ${color}`,
        borderRadius: 2,
        cursor: "pointer",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: 3 },
      }}
      onClick={onPreview}
    >
      <CardContent sx={{ pb: "12px !important" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.75 }}>
          <Box sx={{ flex: 1, mr: 1 }}>
            <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>
              {decl.name}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
            <Chip
              size="small"
              label={typeLabel(decl.type)}
              sx={{ bgcolor: color, color: "white", fontWeight: 600, fontSize: 10.5, height: 20 }}
            />
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1 }}>
          {isReady ? (
            <CheckCircleIcon sx={{ fontSize: 14, color: "success.main" }} />
          ) : (
            <RadioButtonUncheckedIcon sx={{ fontSize: 14, color: "text.disabled" }} />
          )}
          <Typography variant="caption" color={isReady ? "success.main" : "text.secondary"} fontWeight={600}>
            {isReady ? "Pronto" : "Rascunho"}
          </Typography>
        </Box>

        {preview && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              mb: 1.25,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontFamily: "monospace",
              fontSize: 11,
            }}
          >
            {preview}…
          </Typography>
        )}

        <Divider sx={{ mb: 1 }} />

        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <Tooltip title="Copiar texto">
            <IconButton size="small" onClick={() => navigator.clipboard.writeText(decl.content)}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={onEdit}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton size="small" color="error" onClick={onDelete}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganDeclaracoesPage() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const [tabType, setTabType] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Declaration | null>(null);
  const [deleting, setDeleting] = useState<Declaration | null>(null);
  const [previewing, setPreviewing] = useState<Declaration | null>(null);

  const load = () => {
    setLoading(true);
    organApi.declarations()
      .then(setDeclarations)
      .catch(() => setError("Não foi possível carregar as declarações."))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(() => {
    let list = declarations;
    if (tabType !== "ALL") list = list.filter((d) => d.type === tabType);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (d) => d.name.toLowerCase().includes(q) || d.content.toLowerCase().includes(q)
      );
    }
    return list;
  }, [declarations, tabType, search]);

  const usedTypes = useMemo(() => {
    const set = new Set(declarations.map((d) => d.type));
    return DECLARATION_TYPES.filter((t) => set.has(t.value));
  }, [declarations]);

  const readyCount = declarations.filter((d) => d.status === "ready").length;
  const draftCount = declarations.filter((d) => d.status === "draft").length;

  const handleSave = async (data: Pick<Declaration, "name" | "type" | "status" | "content">) => {
    if (editing) {
      const updated = await organApi.updateDeclaration(editing.id, data);
      setDeclarations((prev) => prev.map((d) => (d.id === editing.id ? updated : d)));
      setToast("Declaração atualizada.");
    } else {
      const created = await organApi.createDeclaration(data);
      setDeclarations((prev) => [...prev, created]);
      setToast("Declaração criada.");
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    await organApi.deleteDeclaration(deleting.id);
    setDeclarations((prev) => prev.filter((d) => d.id !== deleting.id));
    setDeleting(null);
    setToast("Declaração excluída.");
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={220} height={36} sx={{ mb: 0.5 }} />
        <Skeleton variant="text" width={300} height={20} sx={{ mb: 3 }} />
        <Grid container spacing={2}>
          {[...Array(6)].map((_, i) => <Grid item xs={12} sm={6} md={4} key={i}><Skeleton variant="rounded" height={160} /></Grid>)}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GavelIcon /> Declarações
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Modelos de declarações para processos licitatórios
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditing(null); setFormOpen(true); }}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Nova Declaração
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary bar */}
      <Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
        {[
          { label: "Total", count: declarations.length, color: "primary.main" },
          { label: "Prontas", count: readyCount, color: "success.main" },
          { label: "Rascunhos", count: draftCount, color: "text.secondary" },
        ].map(({ label, count, color }) => (
          <Box
            key={label}
            sx={{ px: 2, py: 1, bgcolor: "white", border: "1px solid", borderColor: "divider", borderRadius: 2, minWidth: 80, textAlign: "center" }}
          >
            <Typography variant="h6" fontWeight={800} color={color}>{count}</Typography>
            <Typography variant="caption" color="text.secondary">{label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Buscar declarações..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 360 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
        }}
      />

      {/* Type tabs */}
      {usedTypes.length > 0 && (
        <Tabs
          value={tabType}
          onChange={(_, v) => setTabType(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ mb: 2.5, borderBottom: "1px solid", borderColor: "divider" }}
        >
          <Tab label="Todas" value="ALL" sx={{ textTransform: "none", fontWeight: 600 }} />
          {usedTypes.map((t) => (
            <Tab key={t.value} label={t.label} value={t.value} sx={{ textTransform: "none" }} />
          ))}
        </Tabs>
      )}

      {/* Empty state */}
      {declarations.length === 0 && (
        <Card
          elevation={0}
          sx={{ border: "1px dashed", borderColor: "divider", borderRadius: 2, p: 5, textAlign: "center" }}
        >
          <ArticleIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>Nenhuma declaração cadastrada</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Crie modelos de declarações para agilizar seus processos licitatórios.
          </Typography>

          {/* Quick-start cards */}
          <Grid container spacing={1.5} justifyContent="center" sx={{ maxWidth: 720, mx: "auto" }}>
            {DECLARATION_TYPES.slice(0, 6).map((t) => (
              <Grid item xs={12} sm={6} md={4} key={t.value}>
                <Card
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderLeft: `3px solid ${typeColor(t.value)}`,
                    borderRadius: 1.5,
                    p: 1.5,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "box-shadow 0.15s",
                    "&:hover": { boxShadow: 2 },
                  }}
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Typography variant="caption" fontWeight={700} display="block" sx={{ mb: 0.25 }}>
                    {t.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                    {t.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Card>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <Grid container spacing={2}>
          {filtered.map((d) => (
            <Grid item xs={12} sm={6} md={4} key={d.id}>
              <DeclarationCard
                decl={d}
                onEdit={() => { setEditing(d); setFormOpen(true); }}
                onDelete={() => setDeleting(d)}
                onPreview={() => setPreviewing(d)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {filtered.length === 0 && declarations.length > 0 && (
        <Typography color="text.secondary" sx={{ mt: 2 }}>Nenhuma declaração encontrada para o filtro selecionado.</Typography>
      )}

      {/* Dialogs */}
      <FormDialog
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
      />
      <DeleteDialog
        open={Boolean(deleting)}
        name={deleting?.name ?? ""}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
      <PreviewDialog
        open={Boolean(previewing)}
        decl={previewing}
        onClose={() => setPreviewing(null)}
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
