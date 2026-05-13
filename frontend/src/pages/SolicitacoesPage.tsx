import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import QuestionMarkIcon from "@mui/icons-material/QuestionMark";
import GavelIcon from "@mui/icons-material/Gavel";
import ReportIcon from "@mui/icons-material/Report";
import AppealIcon from "@mui/icons-material/Policy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CancelIcon from "@mui/icons-material/Cancel";
import { auctionsApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { AuctionDetail } from "../data/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Solicitation {
  id: string;
  auctionId: string;
  userId: string;
  type: string;
  subject: string;
  content: string;
  status: string;
  answer?: string | null;
  answeredAt?: string | null;
  createdAt: string;
  user?: { id: string; name: string } | null;
}

const TYPE_LABELS: Record<string, { label: string; color: "default" | "warning" | "error" | "info" | "primary" }> = {
  IMPUGNACAO: { label: "Impugnação", color: "error" },
  ESCLARECIMENTO: { label: "Esclarecimento", color: "info" },
  RECURSO: { label: "Recurso", color: "warning" },
  CONTRARRAZAO: { label: "Contrarrazão", color: "primary" },
};

const STATUS_LABELS: Record<string, { label: string; color: "default" | "success" | "error" | "warning" }> = {
  PENDING: { label: "Pendente", color: "warning" },
  ANSWERED: { label: "Respondida", color: "success" },
  REJECTED: { label: "Indeferida", color: "error" },
};

function TypeIcon({ type }: { type: string }) {
  if (type === "IMPUGNACAO") return <ReportIcon fontSize="small" sx={{ color: "error.main" }} />;
  if (type === "RECURSO") return <AppealIcon fontSize="small" sx={{ color: "warning.main" }} />;
  return <QuestionMarkIcon fontSize="small" sx={{ color: "info.main" }} />;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "ANSWERED") return <CheckCircleIcon fontSize="small" sx={{ color: "success.main" }} />;
  if (status === "REJECTED") return <CancelIcon fontSize="small" sx={{ color: "error.main" }} />;
  return <HourglassEmptyIcon fontSize="small" sx={{ color: "warning.main" }} />;
}

// ─── New Solicitation Dialog ──────────────────────────────────────────────────

function NewSolicitationDialog({
  open,
  auctionId,
  onClose,
  onCreated,
}: {
  open: boolean;
  auctionId: string;
  onClose: () => void;
  onCreated: (s: Solicitation) => void;
}) {
  const [type, setType] = useState("ESCLARECIMENTO");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!subject.trim() || !content.trim()) {
      setError("Assunto e conteúdo são obrigatórios.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/solicitations/auction/${auctionId}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, content }),
      });
      if (!res.ok) throw new Error("Erro ao enviar solicitação.");
      const data = await res.json();
      onCreated(data);
      setSubject("");
      setContent("");
      setType("ESCLARECIMENTO");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao enviar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Nova Solicitação</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <FormControl fullWidth size="small" sx={{ mb: 2, mt: 1 }}>
          <InputLabel>Tipo</InputLabel>
          <Select value={type} label="Tipo" onChange={(e) => setType(e.target.value)}>
            <MenuItem value="ESCLARECIMENTO">Esclarecimento</MenuItem>
            <MenuItem value="IMPUGNACAO">Impugnação</MenuItem>
            <MenuItem value="RECURSO">Recurso</MenuItem>
            <MenuItem value="CONTRARRAZAO">Contrarrazão</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          size="small"
          label="Assunto *"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          size="small"
          label="Conteúdo *"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          rows={5}
          placeholder="Descreva detalhadamente sua solicitação..."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancelar</Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={loading || !subject.trim() || !content.trim()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
        >
          Enviar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SolicitacoesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [solicitations, setSolicitations] = useState<Solicitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Solicitation | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      auctionsApi.get(id),
      fetch(`/api/solicitations/auction/${id}`, { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([a, d]) => {
        setAuction(a as AuctionDetail);
        setSolicitations((d as { solicitations: Solicitation[] }).solicitations ?? []);
      })
      .catch(() => setError("Erro ao carregar dados."))
      .finally(() => setLoading(false));
  }, [id]);

  const myRequests = solicitations.filter((s) => s.userId === user?.id);
  const allRequests = solicitations;
  const displayed = tab === 0 ? myRequests : allRequests;

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !auction) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Voltar</Button>
        <Alert severity="error">{error || "Pregão não encontrado."}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} size="small" sx={{ mb: 0.5, color: "text.secondary" }}>
            Voltar ao Pregão
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GavelIcon sx={{ color: "#2c3f31", fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700}>Solicitações</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">{auction.title}</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
        >
          Nova Solicitação
        </Button>
      </Box>

      {/* Type guide */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ p: "12px 16px!important" }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <QuestionMarkIcon fontSize="small" sx={{ color: "info.main" }} />
              <Typography variant="caption"><strong>Esclarecimento</strong> — dúvidas sobre o edital</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ReportIcon fontSize="small" sx={{ color: "error.main" }} />
              <Typography variant="caption"><strong>Impugnação</strong> — contestação do edital</Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <AppealIcon fontSize="small" sx={{ color: "warning.main" }} />
              <Typography variant="caption"><strong>Recurso</strong> — após decisão do pregoeiro</Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onChange={(_, v) => setTab(v as number)} sx={{ mb: 2, borderBottom: "1px solid", borderColor: "divider" }}>
        <Tab label={`Minhas Solicitações (${myRequests.length})`} />
        <Tab label={`Todas (${allRequests.length})`} />
      </Tabs>

      {displayed.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <QuestionMarkIcon sx={{ fontSize: 48, color: "text.disabled" }} />
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>Nenhuma solicitação encontrada.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} sx={{ mt: 2 }} onClick={() => setDialogOpen(true)}>
            Criar Solicitação
          </Button>
        </Box>
      ) : (
        <List disablePadding>
          {displayed.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <Divider />}
              <ListItem
                disablePadding
                sx={{ py: 1.5, px: 0, cursor: "pointer", "&:hover": { bgcolor: "action.hover" } }}
                onClick={() => setSelected(selected?.id === s.id ? null : s)}
              >
                <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start", width: "100%", px: 1 }}>
                  <TypeIcon type={s.type} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap", mb: 0.25 }}>
                      <Chip
                        label={TYPE_LABELS[s.type]?.label ?? s.type}
                        size="small"
                        color={TYPE_LABELS[s.type]?.color ?? "default"}
                        sx={{ fontSize: 10, height: 18 }}
                      />
                      <Typography variant="body2" fontWeight={600}>{s.subject}</Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                      {s.user?.name && ` · ${s.user.name}`}
                    </Typography>
                    {selected?.id === s.id && (
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", mb: 1.5 }}>{s.content}</Typography>
                        {s.answer && (
                          <Box sx={{ bgcolor: "#f0fdf4", borderLeft: "3px solid", borderColor: "success.main", pl: 2, py: 1, borderRadius: 1 }}>
                            <Typography variant="caption" fontWeight={700} color="success.main" sx={{ display: "block", mb: 0.5 }}>
                              Resposta do Pregoeiro — {s.answeredAt ? new Date(s.answeredAt).toLocaleDateString("pt-BR") : ""}
                            </Typography>
                            <Typography variant="body2">{s.answer}</Typography>
                          </Box>
                        )}
                        {!s.answer && (
                          <Alert severity="info" sx={{ py: 0.5 }}>
                            Aguardando resposta do pregoeiro.
                          </Alert>
                        )}
                      </Box>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
                    <StatusIcon status={s.status} />
                    <Chip
                      label={STATUS_LABELS[s.status]?.label ?? s.status}
                      size="small"
                      color={STATUS_LABELS[s.status]?.color ?? "default"}
                      sx={{ fontSize: 10, height: 18 }}
                    />
                  </Box>
                </Box>
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      )}

      <NewSolicitationDialog
        open={dialogOpen}
        auctionId={id!}
        onClose={() => setDialogOpen(false)}
        onCreated={(s) => {
          setSolicitations((prev) => [s, ...prev]);
          setDialogOpen(false);
        }}
      />
    </Box>
  );
}
