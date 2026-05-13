import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import DescriptionIcon from "@mui/icons-material/Description";
import FolderIcon from "@mui/icons-material/Folder";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import RefreshIcon from "@mui/icons-material/Refresh";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "valid" | "expiring" | "expired";

interface LibraryDoc {
  id: string;
  category: string;
  name: string;
  filename: string;
  uploadedAt: string;
  expiresAt?: string;
  status: DocStatus;
  size: number;
  usedIn?: number;
}

const CATEGORIES = [
  "Certidões de Regularidade Fiscal",
  "Certidões Trabalhistas",
  "Documentos Societários",
  "Qualificação Técnica",
  "Qualificação Econômica",
  "Declarações",
  "Outros",
];

const STORAGE_KEY = "licita-brasil:minha-biblioteca";

function loadDocs(): LibraryDoc[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LibraryDoc[]) : [];
  } catch {
    return [];
  }
}

function saveDocs(docs: LibraryDoc[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

function docStatus(doc: LibraryDoc): DocStatus {
  if (!doc.expiresAt) return "valid";
  const days = Math.ceil((new Date(doc.expiresAt).getTime() - Date.now()) / 86400000);
  if (days < 0) return "expired";
  if (days <= 30) return "expiring";
  return "valid";
}

function StatusChip({ status }: { status: DocStatus }) {
  if (status === "valid") return <Chip label="Válido" size="small" color="success" icon={<CheckCircleIcon fontSize="small" />} />;
  if (status === "expiring") return <Chip label="A vencer" size="small" color="warning" icon={<HourglassEmptyIcon fontSize="small" />} />;
  return <Chip label="Vencido" size="small" color="error" icon={<ErrorOutlineIcon fontSize="small" />} />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

function UploadDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (doc: LibraryDoc) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [expiresAt, setExpiresAt] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleAdd = () => {
    if (!name.trim() || !file) return;
    const doc: LibraryDoc = {
      id: `doc-${Date.now()}`,
      category,
      name: name.trim(),
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      expiresAt: expiresAt || undefined,
      status: "valid",
      size: file.size,
      usedIn: 0,
    };
    onAdded(doc);
    setName("");
    setFile(null);
    setExpiresAt("");
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Adicionar Documento</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Documentos salvos na Minha Biblioteca podem ser reutilizados em múltiplos processos sem necessidade de novo upload.
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField
            fullWidth size="small" label="Nome do documento *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: CND Federal — Janeiro 2026"
          />
          <TextField
            select fullWidth size="small" label="Categoria *"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            SelectProps={{ native: true }}
          >
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </TextField>
          <TextField
            fullWidth size="small" label="Data de validade"
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Box
            sx={{
              border: "2px dashed", borderColor: file ? "success.main" : "divider", borderRadius: 2,
              p: 2.5, textAlign: "center", cursor: "pointer",
              bgcolor: file ? "#f0fdf4" : "#fafafa",
              transition: "all 0.15s",
            }}
            onClick={() => document.getElementById("lib-file-input")?.click()}
          >
            <input
              id="lib-file-input"
              type="file"
              accept=".pdf,.jpg,.png,.docx"
              style={{ display: "none" }}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <CloudUploadIcon sx={{ fontSize: 36, color: file ? "success.main" : "text.disabled" }} />
            <Typography variant="body2" color={file ? "success.main" : "text.secondary"} fontWeight={600} sx={{ mt: 0.5 }}>
              {file ? file.name : "Clique para selecionar arquivo"}
            </Typography>
            <Typography variant="caption" color="text.disabled">PDF, JPG, PNG ou DOCX · máx. 15 MB</Typography>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!name.trim() || !file}
          startIcon={<CloudUploadIcon />}
        >
          Adicionar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MinhasBibliotecaPage() {
  const [docs, setDocs] = useState<LibraryDoc[]>(() => loadDocs().map((d) => ({ ...d, status: docStatus(d) })));
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const addDoc = (doc: LibraryDoc) => {
    const updated = [doc, ...docs];
    setDocs(updated);
    saveDocs(updated);
    setDialogOpen(false);
  };

  const removeDoc = (id: string) => {
    const updated = docs.filter((d) => d.id !== id);
    setDocs(updated);
    saveDocs(updated);
  };

  const refreshStatuses = () => {
    const updated = docs.map((d) => ({ ...d, status: docStatus(d) }));
    setDocs(updated);
    saveDocs(updated);
  };

  const categories = ["Todos", ...Array.from(new Set(docs.map((d) => d.category)))];
  const activeCategory = categories[tab] ?? "Todos";

  const filtered = docs.filter((d) => {
    const matchCat = activeCategory === "Todos" || d.category === activeCategory;
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.filename.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const expiredCount = docs.filter((d) => d.status === "expired").length;
  const expiringCount = docs.filter((d) => d.status === "expiring").length;

  return (
    <Box sx={{ maxWidth: 960, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FolderIcon sx={{ color: "#2c3f31", fontSize: 24 }} />
            <Typography variant="h6" fontWeight={700}>Minha Biblioteca</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Repositório de documentos para reutilização em múltiplos processos
          </Typography>
        </Box>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Tooltip title="Atualizar status de validade">
            <IconButton size="small" onClick={refreshStatuses}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Adicionar Documento
          </Button>
        </Box>
      </Box>

      {/* Alerts */}
      {expiredCount > 0 && (
        <Alert severity="error" sx={{ mb: 1.5 }}>
          {expiredCount} documento(s) vencido(s). Atualize-os para manter sua habilitação.
        </Alert>
      )}
      {expiringCount > 0 && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          {expiringCount} documento(s) prestes a vencer nos próximos 30 dias.
        </Alert>
      )}

      {/* Stats */}
      <Box sx={{ display: "flex", gap: 2, mb: 2, flexWrap: "wrap" }}>
        <Card elevation={0} sx={{ flex: 1, minWidth: 120, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <CardContent sx={{ p: "12px!important", textAlign: "center" }}>
            <Typography variant="h5" fontWeight={800}>{docs.length}</Typography>
            <Typography variant="caption" color="text.secondary">Documentos</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: 1, minWidth: 120, border: "1px solid", borderColor: "success.light", borderRadius: 2 }}>
          <CardContent sx={{ p: "12px!important", textAlign: "center" }}>
            <Typography variant="h5" fontWeight={800} color="success.main">{docs.filter((d) => d.status === "valid").length}</Typography>
            <Typography variant="caption" color="text.secondary">Válidos</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: 1, minWidth: 120, border: "1px solid", borderColor: "warning.light", borderRadius: 2 }}>
          <CardContent sx={{ p: "12px!important", textAlign: "center" }}>
            <Typography variant="h5" fontWeight={800} color="warning.main">{expiringCount}</Typography>
            <Typography variant="caption" color="text.secondary">A vencer</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ flex: 1, minWidth: 120, border: "1px solid", borderColor: "error.light", borderRadius: 2 }}>
          <CardContent sx={{ p: "12px!important", textAlign: "center" }}>
            <Typography variant="h5" fontWeight={800} color="error.main">{expiredCount}</Typography>
            <Typography variant="caption" color="text.secondary">Vencidos</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Search */}
      <TextField
        fullWidth size="small" placeholder="Buscar documentos..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
      />

      {/* Category tabs */}
      {categories.length > 1 && (
        <Tabs value={tab} onChange={(_, v) => setTab(v as number)} variant="scrollable" scrollButtons="auto" sx={{ borderBottom: "1px solid", borderColor: "divider", mb: 2 }}>
          {categories.map((c) => (
            <Tab key={c} label={c} sx={{ fontSize: 12 }} />
          ))}
        </Tabs>
      )}

      {/* Doc list */}
      {docs.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6, border: "2px dashed", borderColor: "divider", borderRadius: 2 }}>
          <FolderIcon sx={{ fontSize: 48, color: "text.disabled" }} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>Biblioteca vazia.</Typography>
          <Typography variant="body2" color="text.disabled" sx={{ mb: 2 }}>
            Adicione documentos para reutilizá-los em múltiplos processos sem precisar fazer upload novamente.
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Adicionar primeiro documento
          </Button>
        </Box>
      ) : (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <List disablePadding>
            {filtered.map((doc, i) => (
              <React.Fragment key={doc.id}>
                {i > 0 && <Divider />}
                <ListItem
                  disablePadding
                  sx={{ px: 2.5, py: 1.5 }}
                  secondaryAction={
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <Tooltip title="Baixar">
                        <IconButton size="small" color="primary">
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover">
                        <IconButton size="small" color="error" onClick={() => removeDoc(doc.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <DescriptionIcon sx={{ color: doc.status === "expired" ? "error.main" : doc.status === "expiring" ? "warning.main" : "primary.main" }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                        <Typography variant="body2" fontWeight={600}>{doc.name}</Typography>
                        <StatusChip status={doc.status} />
                        {doc.usedIn != null && doc.usedIn > 0 && (
                          <Chip label={`${doc.usedIn} processo(s)`} size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", mt: 0.25 }}>
                        <Typography variant="caption" color="text.secondary">{doc.filename}</Typography>
                        <Typography variant="caption" color="text.disabled">{formatSize(doc.size)}</Typography>
                        <Typography variant="caption" color="text.secondary">{doc.category}</Typography>
                        {doc.expiresAt && (
                          <Typography variant="caption" color={doc.status === "expired" ? "error.main" : doc.status === "expiring" ? "warning.main" : "text.secondary"}>
                            Vence: {new Date(doc.expiresAt).toLocaleDateString("pt-BR")}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              </React.Fragment>
            ))}
            {filtered.length === 0 && (
              <Box sx={{ py: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">Nenhum documento encontrado.</Typography>
              </Box>
            )}
          </List>
        </Card>
      )}

      <UploadDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onAdded={addDoc} />
    </Box>
  );
}
