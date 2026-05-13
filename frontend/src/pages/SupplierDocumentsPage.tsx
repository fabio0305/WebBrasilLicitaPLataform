import React, { useState, useEffect } from "react";
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
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = "valid" | "expiring" | "expired" | "pending";

interface DocTemplate {
  id: string;
  name: string;
  abbrev: string;
  required: boolean;
  description: string;
  issuedBy: string;
  validityDays: number;
}

interface CertDoc extends DocTemplate {
  status: DocStatus;
  uploadedAt?: string;
  expiresAt?: string;
  daysLeft?: number;
}

// ─── Document Templates ───────────────────────────────────────────────────────

const DOC_TEMPLATES: DocTemplate[] = [
  {
    id: "cnd-federal",
    name: "Certidão Negativa de Débitos Federais",
    abbrev: "CND Federal / PGFN",
    required: true,
    description: "Comprova regularidade fiscal perante a Receita Federal e PGFN.",
    issuedBy: "Receita Federal do Brasil",
    validityDays: 180,
  },
  {
    id: "cnd-estadual",
    name: "Certidão Negativa de Débitos Estaduais",
    abbrev: "CND Estadual",
    required: true,
    description: "Comprova regularidade com a Fazenda do Estado.",
    issuedBy: "Secretaria de Estado da Fazenda",
    validityDays: 180,
  },
  {
    id: "cnd-municipal",
    name: "Certidão Negativa de Débitos Municipais",
    abbrev: "CND Municipal",
    required: true,
    description: "Comprova regularidade com a Fazenda do Município.",
    issuedBy: "Prefeitura Municipal",
    validityDays: 180,
  },
  {
    id: "fgts",
    name: "Certificado de Regularidade do FGTS",
    abbrev: "CRF / FGTS",
    required: true,
    description: "Emitido pela Caixa Econômica Federal. Comprova regularidade com o FGTS.",
    issuedBy: "Caixa Econômica Federal",
    validityDays: 30,
  },
  {
    id: "cndt",
    name: "Certidão Negativa de Débitos Trabalhistas",
    abbrev: "CNDT",
    required: true,
    description: "Comprova a inexistência de débitos inadimplidos perante a Justiça do Trabalho.",
    issuedBy: "Tribunal Superior do Trabalho (TST)",
    validityDays: 180,
  },
  {
    id: "contrato-social",
    name: "Contrato Social / Estatuto / CCMEI",
    abbrev: "Contrato Social",
    required: true,
    description: "Documento de constituição da empresa com última alteração registrada.",
    issuedBy: "Junta Comercial / Cartório",
    validityDays: 99999,
  },
  {
    id: "cartao-cnpj",
    name: "Comprovante de Inscrição e Situação Cadastral",
    abbrev: "Cartão CNPJ",
    required: true,
    description: "Emitido pela Receita Federal. Deve estar com situação ATIVA.",
    issuedBy: "Receita Federal do Brasil",
    validityDays: 30,
  },
  {
    id: "balanco",
    name: "Balanço Patrimonial",
    abbrev: "Balanço Patrimonial",
    required: false,
    description: "Último exercício social. Pode ser exigido em determinados editais.",
    issuedBy: "Contador / Auditoria",
    validityDays: 365,
  },
  {
    id: "atestado",
    name: "Atestado de Capacidade Técnica",
    abbrev: "Atestado Técnico",
    required: false,
    description: "Comprovação de execução de objeto compatível com o certame.",
    issuedBy: "Contratante anterior",
    validityDays: 99999,
  },
  {
    id: "cnd-previdenciaria",
    name: "Certidão de Regularidade Previdenciária",
    abbrev: "CND Previdenciária",
    required: false,
    description: "Comprova regularidade com o INSS / Previdência Social.",
    issuedBy: "Receita Federal do Brasil",
    validityDays: 180,
  },
];

// ─── Persistence ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "licita-brasil:supplier-docs";

interface StoredDoc {
  status: DocStatus;
  uploadedAt?: string;
  expiresAt?: string;
}

function loadStored(): Record<string, StoredDoc> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, StoredDoc>) : {};
  } catch {
    return {};
  }
}

function saveStored(data: Record<string, StoredDoc>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function buildDocs(stored: Record<string, StoredDoc>): CertDoc[] {
  return DOC_TEMPLATES.map((t) => {
    const s = stored[t.id];
    if (!s) return { ...t, status: "pending" as DocStatus };
    const exp = s.expiresAt ? new Date(s.expiresAt) : undefined;
    const today = new Date();
    let daysLeft: number | undefined;
    let status: DocStatus = s.status;
    if (exp) {
      daysLeft = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
      if (daysLeft < 0) status = "expired";
      else if (daysLeft <= 30) status = "expiring";
      else status = "valid";
    }
    return { ...t, status, uploadedAt: s.uploadedAt, expiresAt: s.expiresAt, daysLeft };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: DocStatus }) {
  if (status === "valid") return <CheckCircleIcon sx={{ color: "success.main" }} />;
  if (status === "expiring") return <HourglassEmptyIcon sx={{ color: "warning.main" }} />;
  if (status === "expired") return <ErrorOutlineIcon sx={{ color: "error.main" }} />;
  return <InsertDriveFileIcon sx={{ color: "text.disabled" }} />;
}

function StatusChip({ status, daysLeft }: { status: DocStatus; daysLeft?: number }) {
  if (status === "valid") return <Chip label="Válida" color="success" size="small" />;
  if (status === "expiring") return <Chip label={daysLeft != null ? `Vence em ${daysLeft}d` : "A vencer"} color="warning" size="small" />;
  if (status === "expired") return <Chip label="Vencida" color="error" size="small" />;
  return <Chip label="Pendente" variant="outlined" size="small" />;
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

interface UploadDialogProps {
  doc: CertDoc | null;
  onClose: () => void;
  onSave: (docId: string, expiresAt: string) => void;
}

function UploadDialog({ doc, onClose, onSave }: UploadDialogProps) {
  const [expiresAt, setExpiresAt] = useState("");
  const [fileSelected, setFileSelected] = useState(false);

  useEffect(() => {
    if (doc) {
      setExpiresAt(doc.expiresAt ?? "");
      setFileSelected(doc.status !== "pending");
    }
  }, [doc]);

  if (!doc) return null;

  const handleFileChange = () => setFileSelected(true);

  const canSave = fileSelected && (doc.validityDays >= 99999 || expiresAt);

  return (
    <Dialog open={Boolean(doc)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <UploadFileIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>{doc.abbrev}</Typography>
            <Typography variant="caption" color="text.secondary">{doc.name}</Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
          <strong>Emitido por:</strong> {doc.issuedBy}
          {doc.validityDays < 99999 && (
            <><br /><strong>Validade típica:</strong> {doc.validityDays} dias</>
          )}
        </Alert>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{doc.description}</Typography>

        {/* Simulated file upload */}
        <Box
          sx={{
            border: "2px dashed",
            borderColor: fileSelected ? "success.main" : "divider",
            borderRadius: 2,
            p: 3,
            textAlign: "center",
            cursor: "pointer",
            bgcolor: fileSelected ? "success.50" : "background.paper",
            transition: "all 0.15s",
            "&:hover": { borderColor: "primary.main", bgcolor: "action.hover" },
            mb: 2,
          }}
          onClick={handleFileChange}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && handleFileChange()}
        >
          {fileSelected ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <CheckCircleOutlineIcon sx={{ color: "success.main", fontSize: 36 }} />
              <Typography variant="body2" fontWeight={600} color="success.main">Arquivo selecionado</Typography>
              <Typography variant="caption" color="text.secondary">Clique para trocar o arquivo</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.5 }}>
              <UploadFileIcon sx={{ color: "text.disabled", fontSize: 36 }} />
              <Typography variant="body2" fontWeight={600}>Clique para selecionar o arquivo</Typography>
              <Typography variant="caption" color="text.secondary">PDF, JPG ou PNG · Máx. 10MB</Typography>
            </Box>
          )}
        </Box>

        {doc.validityDays < 99999 && (
          <TextField
            label="Data de vencimento do documento"
            type="date"
            fullWidth
            size="small"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
            helperText="Informe a data de validade impressa no documento"
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button
          variant="contained"
          disabled={!canSave}
          onClick={() => {
            if (doc) {
              const expiry = doc.validityDays >= 99999
                ? new Date(Date.now() + 365 * 10 * 86400000).toISOString().split("T")[0]
                : expiresAt;
              onSave(doc.id, expiry);
              onClose();
            }
          }}
          startIcon={<CheckCircleIcon />}
        >
          Confirmar Envio
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupplierDocumentsPage() {
  const [stored, setStored] = useState<Record<string, StoredDoc>>(loadStored());
  const [uploadTarget, setUploadTarget] = useState<CertDoc | null>(null);
  const [filter, setFilter] = useState<"all" | "required" | "pending" | "attention">("all");

  const docs = buildDocs(stored);

  const required = docs.filter((d) => d.required);
  const optional = docs.filter((d) => !d.required);
  const validCount = docs.filter((d) => d.status === "valid").length;
  const attentionCount = docs.filter((d) => d.status === "expired" || d.status === "expiring").length;
  const pendingCount = docs.filter((d) => d.status === "pending").length;
  const requiredDone = required.filter((d) => d.status === "valid" || d.status === "expiring").length;

  const handleSave = (docId: string, expiresAt: string) => {
    const next: Record<string, StoredDoc> = {
      ...stored,
      [docId]: {
        status: "valid",
        uploadedAt: new Date().toISOString(),
        expiresAt,
      },
    };
    setStored(next);
    saveStored(next);
  };

  const handleDelete = (docId: string) => {
    const next = { ...stored };
    delete next[docId];
    setStored(next);
    saveStored(next);
  };

  const filterDoc = (d: CertDoc): boolean => {
    if (filter === "required") return d.required;
    if (filter === "pending") return d.status === "pending";
    if (filter === "attention") return d.status === "expired" || d.status === "expiring";
    return true;
  };

  const filteredRequired = required.filter(filterDoc);
  const filteredOptional = optional.filter(filterDoc);

  const overallScore = Math.round((requiredDone / required.length) * 100);

  return (
    <Box>
      {/* ── Summary bar ── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>Situação dos Documentos</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {requiredDone} de {required.length} obrigatórios em dia
                  </Typography>
                </Box>
                <Typography variant="h5" fontWeight={700} color={overallScore === 100 ? "success.main" : overallScore >= 70 ? "warning.main" : "error.main"}>
                  {overallScore}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={overallScore}
                sx={{
                  height: 8, borderRadius: 4, mb: 1.5,
                  bgcolor: "divider",
                  "& .MuiLinearProgress-bar": {
                    bgcolor: overallScore === 100 ? "success.main" : overallScore >= 70 ? "warning.main" : "error.main",
                    borderRadius: 4,
                  },
                }}
              />
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                  <Typography variant="caption" fontWeight={600} color="success.main">{validCount} Válidas</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <WarningAmberIcon sx={{ fontSize: 16, color: "warning.main" }} />
                  <Typography variant="caption" fontWeight={600} color="warning.main">{attentionCount} Atenção</Typography>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <InsertDriveFileIcon sx={{ fontSize: 16, color: "text.disabled" }} />
                  <Typography variant="caption" fontWeight={600} color="text.secondary">{pendingCount} Pendentes</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%", bgcolor: overallScore === 100 ? "success.50" : "warning.50" }}>
            <CardContent>
              {overallScore === 100 ? (
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", height: "100%", justifyContent: "center" }}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: "success.main", mb: 1 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="success.dark">Empresa Habilitada</Typography>
                  <Typography variant="caption" color="success.dark">Todos os documentos obrigatórios estão em dia.</Typography>
                </Box>
              ) : (
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    <WarningAmberIcon sx={{ color: "warning.main" }} />
                    <Typography variant="subtitle2" fontWeight={700}>Regularização pendente</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {attentionCount > 0 && `${attentionCount} documento(s) com atenção. `}
                    {pendingCount > 0 && `${pendingCount} documento(s) não enviado(s).`}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Documentos irregulares impedem a participação em licitações.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── Filter tabs ── */}
      <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
        {(["all", "required", "pending", "attention"] as const).map((f) => (
          <Chip
            key={f}
            label={f === "all" ? "Todos" : f === "required" ? "Obrigatórios" : f === "pending" ? "Pendentes" : "Atenção"}
            onClick={() => setFilter(f)}
            color={filter === f ? "primary" : "default"}
            variant={filter === f ? "filled" : "outlined"}
            size="small"
          />
        ))}
      </Box>

      {/* ── Required Documents ── */}
      {filteredRequired.length > 0 && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
          <CardContent sx={{ p: "0!important" }}>
            <Box sx={{ px: 2.5, py: 1.75, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" fontWeight={700}>Documentos Obrigatórios</Typography>
              <Typography variant="caption" color="text.secondary">Necessários para participar de qualquer licitação</Typography>
            </Box>
            <List disablePadding>
              {filteredRequired.map((doc, i) => (
                <React.Fragment key={doc.id}>
                  {i > 0 && <Divider />}
                  <DocRow
                    doc={doc}
                    onUpload={() => setUploadTarget(doc)}
                    onDelete={() => handleDelete(doc.id)}
                  />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* ── Optional Documents ── */}
      {filteredOptional.length > 0 && (
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
          <CardContent sx={{ p: "0!important" }}>
            <Box sx={{ px: 2.5, py: 1.75, bgcolor: "grey.50", borderBottom: "1px solid", borderColor: "divider" }}>
              <Typography variant="subtitle2" fontWeight={700}>Documentos Complementares</Typography>
              <Typography variant="caption" color="text.secondary">Podem ser exigidos em editais específicos</Typography>
            </Box>
            <List disablePadding>
              {filteredOptional.map((doc, i) => (
                <React.Fragment key={doc.id}>
                  {i > 0 && <Divider />}
                  <DocRow
                    doc={doc}
                    onUpload={() => setUploadTarget(doc)}
                    onDelete={() => handleDelete(doc.id)}
                  />
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {filteredRequired.length === 0 && filteredOptional.length === 0 && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CheckCircleIcon sx={{ fontSize: 56, color: "success.main", mb: 1 }} />
          <Typography variant="h6" fontWeight={700}>Nenhum documento encontrado para este filtro.</Typography>
        </Box>
      )}

      {/* Upload dialog */}
      <UploadDialog
        doc={uploadTarget}
        onClose={() => setUploadTarget(null)}
        onSave={handleSave}
      />
    </Box>
  );
}

// ─── Doc Row ──────────────────────────────────────────────────────────────────

function DocRow({
  doc,
  onUpload,
  onDelete,
}: {
  doc: CertDoc;
  onUpload: () => void;
  onDelete: () => void;
}) {
  return (
    <ListItem
      disablePadding
      sx={{
        px: 2.5, py: 1.5,
        bgcolor:
          doc.status === "expired" ? "rgba(244,67,54,0.04)"
          : doc.status === "expiring" ? "rgba(255,152,0,0.04)"
          : "transparent",
        alignItems: "flex-start",
      }}
    >
      <ListItemIcon sx={{ minWidth: 40, mt: 0.25 }}>
        <StatusIcon status={doc.status} />
      </ListItemIcon>
      <ListItemText
        primary={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            <Typography variant="body2" fontWeight={600}>{doc.abbrev}</Typography>
            <StatusChip status={doc.status} daysLeft={doc.daysLeft} />
            {!doc.required && <Chip label="Opcional" size="small" variant="outlined" sx={{ fontSize: 10, height: 18 }} />}
          </Box>
        }
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">{doc.description}</Typography>
            <Box sx={{ display: "flex", gap: 2, mt: 0.25, flexWrap: "wrap" }}>
              {doc.uploadedAt && (
                <Typography variant="caption" color="text.secondary">
                  Enviado: {new Date(doc.uploadedAt).toLocaleDateString("pt-BR")}
                </Typography>
              )}
              {doc.expiresAt && (
                <Typography
                  variant="caption"
                  fontWeight={600}
                  color={doc.status === "expired" ? "error.main" : doc.status === "expiring" ? "warning.main" : "text.secondary"}
                >
                  Vencimento: {new Date(doc.expiresAt).toLocaleDateString("pt-BR")}
                </Typography>
              )}
            </Box>
          </Box>
        }
      />
      <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0, ml: 1, mt: 0.25 }}>
        {doc.status !== "pending" && (
          <Tooltip title="Remover documento">
            <IconButton size="small" color="error" onClick={onDelete} sx={{ opacity: 0.6, "&:hover": { opacity: 1 } }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <Button
          size="small"
          variant={doc.status === "pending" ? "contained" : "outlined"}
          startIcon={<UploadFileIcon fontSize="small" />}
          onClick={onUpload}
          sx={{ fontSize: 12, whiteSpace: "nowrap" }}
        >
          {doc.status === "pending" ? "Enviar" : "Atualizar"}
        </Button>
      </Box>
    </ListItem>
  );
}
