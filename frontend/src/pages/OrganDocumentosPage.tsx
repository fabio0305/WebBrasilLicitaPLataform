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
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import SearchIcon from "@mui/icons-material/Search";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import ArticleIcon from "@mui/icons-material/Article";
import { organApi } from "../api/client";
import type { DocumentTemplate } from "../data/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: { value: string; label: string; color: string }[] = [
  { value: "EDITAL",          label: "Edital",                   color: "#1565c0" },
  { value: "CONTRATO",        label: "Contrato",                 color: "#2e7d32" },
  { value: "ARP",             label: "Ata de Registro de Preço", color: "#6a1b9a" },
  { value: "AVISO",           label: "Aviso de Licitação",       color: "#e65100" },
  { value: "ATA_REUNIAO",     label: "Ata de Reunião",           color: "#00695c" },
  { value: "TERMO_REFERENCIA",label: "Termo de Referência",      color: "#37474f" },
  { value: "IMPUGNACAO",      label: "Resposta a Impugnação",    color: "#c62828" },
  { value: "OUTRO",           label: "Outro",                    color: "#616161" },
];

function catMeta(value: string) {
  return CATEGORIES.find((c) => c.value === value) ?? { value, label: value, color: "#616161" };
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

// ─── Document Editor Dialog ───────────────────────────────────────────────────

interface EditorProps {
  open: boolean;
  initial?: DocumentTemplate;
  onClose: () => void;
  onSaved: (d: DocumentTemplate) => void;
}

const EMPTY_FORM = { name: "", category: "EDITAL", content: "" };

function EditorDialog({ open, initial, onClose, onSaved }: EditorProps) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setForm(initial
        ? { name: initial.name, category: initial.category, content: initial.content }
        : { ...EMPTY_FORM }
      );
      setErr("");
    }
  }, [open, initial]);

  const handleSave = async () => {
    if (!form.name.trim()) return setErr("Nome do documento é obrigatório.");
    setSaving(true);
    setErr("");
    try {
      let saved: DocumentTemplate;
      if (initial?.id) {
        saved = await organApi.updateDocument(initial.id, form);
      } else {
        saved = await organApi.createDocument(form);
      }
      onSaved(saved);
    } catch {
      setErr("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 2, height: "90vh", display: "flex", flexDirection: "column" } }}
    >
      <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
        {initial ? "Editar Modelo" : "Novo Modelo de Documento"}
      </DialogTitle>
      <DialogContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        {err && <Alert severity="error">{err}</Alert>}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={7}>
            <TextField
              label="Nome do Modelo *"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              fullWidth size="small"
              placeholder="Ex: Edital Padrão Pregão Eletrônico"
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <FormControl fullWidth size="small">
              <InputLabel>Categoria *</InputLabel>
              <Select
                label="Categoria *"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              >
                {CATEGORIES.map((c) => (
                  <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Text editor area */}
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.75 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              CONTEÚDO DO MODELO
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {form.content.length} caracteres
            </Typography>
          </Box>
          <TextField
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            multiline
            fullWidth
            placeholder={"Insira o texto do modelo aqui.\n\nVocê pode usar marcadores como {{ORGAO}}, {{DATA}}, {{NUMERO_PROCESSO}} para campos dinâmicos que serão preenchidos automaticamente."}
            sx={{
              flex: 1,
              "& .MuiInputBase-root": {
                fontFamily: "monospace",
                fontSize: 13,
                alignItems: "flex-start",
                height: "100%",
              },
              "& .MuiInputBase-input": {
                height: "100% !important",
                overflow: "auto !important",
                resize: "none",
              },
            }}
            InputProps={{
              sx: { height: "100%", minHeight: 260 },
            }}
          />
        </Box>

        {/* Dynamic fields hint */}
        <Alert severity="info" icon={false} sx={{ py: 0.5, px: 1.5, fontSize: 12 }}>
          <strong>Marcadores dinâmicos:</strong> Use{" "}
          {["{{ORGAO}}", "{{CNPJ}}", "{{DATA}}", "{{NUMERO_PROCESSO}}", "{{OBJETO}}"].map((t) => (
            <Chip key={t} label={t} size="small" sx={{ mx: 0.25, fontSize: 10, height: 18, fontFamily: "monospace" }} />
          ))}
          {" "}para preenchimento automático ao gerar documentos.
        </Alert>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {saving ? <CircularProgress size={18} color="inherit" /> : "Salvar Modelo"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────

function DeleteDialog({ open, doc, onClose, onDeleted }: {
  open: boolean; doc?: DocumentTemplate; onClose: () => void; onDeleted: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    if (!doc) return;
    setLoading(true);
    try { await organApi.deleteDocument(doc.id); onDeleted(doc.id); } catch { /* ignore */ } finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ fontWeight: 700 }}>Excluir Modelo</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Tem certeza que deseja excluir o modelo <strong>"{doc?.name}"</strong>? Esta ação não pode ser desfeita.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ textTransform: "none" }}>Cancelar</Button>
        <Button onClick={handleDelete} variant="contained" color="error" disabled={loading} sx={{ textTransform: "none" }}>
          {loading ? <CircularProgress size={18} color="inherit" /> : "Excluir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Document Card ────────────────────────────────────────────────────────────

function DocCard({ doc, onEdit, onDelete, onCopy }: {
  doc: DocumentTemplate;
  onEdit: (d: DocumentTemplate) => void;
  onDelete: (d: DocumentTemplate) => void;
  onCopy: (d: DocumentTemplate) => void;
}) {
  const meta = catMeta(doc.category);
  const preview = doc.content.slice(0, 140).replace(/\n/g, " ");

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.18s",
        "&:hover": { boxShadow: 3 },
        borderLeft: `3px solid ${meta.color}`,
      }}
    >
      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box
            sx={{
              width: 38, height: 38, borderRadius: 1.5,
              bgcolor: `${meta.color}18`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <ArticleIcon sx={{ color: meta.color, fontSize: 22 }} />
          </Box>
          <Stack direction="row" spacing={0.25}>
            <Tooltip title="Copiar conteúdo">
              <IconButton size="small" onClick={() => onCopy(doc)}>
                <ContentCopyIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(doc)}>
                <EditIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Excluir">
              <IconButton size="small" color="error" onClick={() => onDelete(doc)}>
                <DeleteIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={700} lineHeight={1.3} sx={{ mb: 0.5 }}>
            {doc.name}
          </Typography>
          <Chip
            label={meta.label}
            size="small"
            sx={{ fontSize: 10, height: 20, mb: 0.75, bgcolor: `${meta.color}15`, color: meta.color, fontWeight: 600 }}
          />
          {preview && (
            <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.4}
              sx={{ overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
              {preview}{doc.content.length > 140 ? "…" : ""}
            </Typography>
          )}
          {!preview && (
            <Typography variant="caption" color="text.disabled" fontStyle="italic">Sem conteúdo</Typography>
          )}
        </Box>

        <Divider />
        <Typography variant="caption" color="text.disabled">
          Criado em {fmtDate(doc.createdAt)}
          {doc.updatedAt && doc.updatedAt !== doc.createdAt && ` · Editado em ${fmtDate(doc.updatedAt)}`}
        </Typography>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const TAB_ALL = "__all__";

export default function OrganDocumentosPage() {
  const [docs, setDocs] = useState<DocumentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState(TAB_ALL);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DocumentTemplate | undefined>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentTemplate | undefined>();
  const [toast, setToast] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    organApi.documents()
      .then(setDocs)
      .catch(() => setError("Não foi possível carregar os documentos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = docs.filter((d) => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === TAB_ALL || d.category === tab;
    return matchSearch && matchTab;
  });

  const usedCategories = [...new Set(docs.map((d) => d.category))];

  const handleSaved = (saved: DocumentTemplate) => {
    setDocs((prev) => {
      const idx = prev.findIndex((d) => d.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    setEditorOpen(false);
    setEditTarget(undefined);
    setToast(editTarget ? "Modelo atualizado!" : "Modelo criado!");
  };

  const handleDeleted = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setDeleteOpen(false);
    setToast("Modelo excluído.");
  };

  const handleCopy = (doc: DocumentTemplate) => {
    navigator.clipboard.writeText(doc.content).then(() => setToast("Conteúdo copiado!")).catch(() => {});
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 3, flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <DescriptionIcon /> Documentos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Modelos de documentos para editais, contratos, atas e outros
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => { setEditTarget(undefined); setEditorOpen(true); }}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Novo Modelo
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Search + category tabs */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ pb: "0 !important" }}>
          <TextField
            size="small"
            fullWidth
            placeholder="Buscar modelos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ mb: 1.5 }}
          />
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 40,
              "& .MuiTab-root": { textTransform: "none", fontSize: 12.5, fontWeight: 600, minHeight: 40, py: 0 },
            }}
          >
            <Tab label={`Todos (${docs.length})`} value={TAB_ALL} />
            {CATEGORIES.filter((c) => usedCategories.includes(c.value)).map((c) => {
              const cnt = docs.filter((d) => d.category === c.value).length;
              return <Tab key={c.value} label={`${c.label} (${cnt})`} value={c.value} />;
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Content */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}><CircularProgress size={32} /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 7 }}>
          <FolderOpenIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={600}>
            {docs.length === 0 ? "Nenhum modelo cadastrado." : "Nenhum modelo encontrado."}
          </Typography>
          {docs.length === 0 && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setEditorOpen(true)}
              sx={{ mt: 2, textTransform: "none" }}
            >
              Criar primeiro modelo
            </Button>
          )}
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <DocCard
                doc={doc}
                onEdit={(d) => { setEditTarget(d); setEditorOpen(true); }}
                onDelete={(d) => { setDeleteTarget(d); setDeleteOpen(true); }}
                onCopy={handleCopy}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && filtered.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1.5, display: "block", textAlign: "right" }}>
          {filtered.length} de {docs.length} modelos
        </Typography>
      )}

      <EditorDialog
        open={editorOpen}
        initial={editTarget}
        onClose={() => { setEditorOpen(false); setEditTarget(undefined); }}
        onSaved={handleSaved}
      />
      <DeleteDialog
        open={deleteOpen}
        doc={deleteTarget}
        onClose={() => setDeleteOpen(false)}
        onDeleted={handleDeleted}
      />
      <Snackbar open={Boolean(toast)} autoHideDuration={3000} onClose={() => setToast("")} message={toast} />
    </Box>
  );
}
