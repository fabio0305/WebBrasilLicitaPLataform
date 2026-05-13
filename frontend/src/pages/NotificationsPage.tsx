import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  Divider,
  TextField,
  Typography,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import GavelOutlinedIcon from "@mui/icons-material/GavelOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import ReplyIcon from "@mui/icons-material/Reply";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PersonIcon from "@mui/icons-material/Person";
import { notificationsApi } from "../api/client";
import type { PlatformNotification } from "../data/types";

// ─── Category metadata ────────────────────────────────────────────────────────

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  FINANCEIRO: { label: "Financeiro", icon: <AttachMoneyIcon fontSize="small" />, color: "#e65100" },
  SEGURANCA:  { label: "Segurança",  icon: <SecurityIcon fontSize="small" />,   color: "#c62828" },
  PREGAO:     { label: "Pregão",     icon: <GavelOutlinedIcon fontSize="small" />, color: "#2c3f31" },
  DOCUMENTOS: { label: "Documentos", icon: <DescriptionOutlinedIcon fontSize="small" />, color: "#6a1b9a" },
  GERAL:      { label: "Geral",      icon: <InfoOutlinedIcon fontSize="small" />, color: "#1976d2" },
};

function meta(cat: string) {
  return CATEGORY_META[cat] ?? CATEGORY_META["GERAL"];
}

// ─── Notification Card ────────────────────────────────────────────────────────

function NotificationCard({
  notif,
  onReplied,
}: {
  notif: PlatformNotification;
  onReplied: (id: string, msg: string) => void;
}) {
  const m = meta(notif.category);
  const isPersonal = notif.targetRole === "USER";
  const hasReplied = Boolean(notif.myReplyId);

  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    setError("");
    try {
      await notificationsApi.reply(notif.id, replyText.trim());
      onReplied(notif.id, replyText.trim());
      setReplyOpen(false);
      setReplyText("");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      setError(msg === "ALREADY_REPLIED" ? "Você já respondeu este aviso." : "Erro ao enviar resposta.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "white",
        borderRadius: 2,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
        transition: "box-shadow 0.15s",
        "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.07)" },
      }}
    >
      <Box sx={{ p: 2.5 }}>
        {/* Header row */}
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          {/* Category icon */}
          <Box
            sx={{
              width: 44, height: 44, borderRadius: 2, flexShrink: 0,
              bgcolor: `${m.color}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: m.color, mt: 0.25,
            }}
          >
            {m.icon}
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Chips row */}
            <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mb: 0.75 }}>
              <Chip
                label={m.label}
                size="small"
                sx={{ bgcolor: `${m.color}15`, color: m.color, fontWeight: 700, fontSize: 10.5, height: 20 }}
              />
              {isPersonal && (
                <Chip
                  icon={<PersonIcon sx={{ fontSize: "12px !important" }} />}
                  label="Mensagem pessoal"
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: 10.5, height: 20 }}
                />
              )}
              {hasReplied && (
                <Chip
                  icon={<CheckCircleIcon sx={{ fontSize: "12px !important" }} />}
                  label="Respondido"
                  size="small"
                  color="success"
                  sx={{ fontSize: 10.5, height: 20 }}
                />
              )}
            </Box>

            {/* Title */}
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.3 }}>
              {notif.title}
            </Typography>

            {/* Message */}
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              {notif.message}
            </Typography>

            {/* Date */}
            <Typography variant="caption" color="text.disabled" sx={{ display: "block", mt: 1 }}>
              {new Date(notif.createdAt).toLocaleString("pt-BR", {
                day: "2-digit", month: "long", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </Typography>
          </Box>
        </Box>

        {/* Reply section */}
        {!hasReplied && (
          <Box sx={{ mt: 2, pl: 7 }}>
            {!replyOpen ? (
              <Button
                size="small"
                startIcon={<ReplyIcon fontSize="small" />}
                variant="outlined"
                onClick={() => setReplyOpen(true)}
                sx={{ fontSize: 12.5, borderRadius: 1.5 }}
              >
                Responder ao administrador
              </Button>
            ) : (
              <Box>
                {error && <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>{error}</Alert>}
                <TextField
                  multiline
                  minRows={3}
                  fullWidth
                  size="small"
                  placeholder="Digite sua resposta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  autoFocus
                />
                <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                  <Button
                    size="small"
                    variant="contained"
                    disabled={sending || !replyText.trim()}
                    onClick={() => void handleReply()}
                    startIcon={sending ? <CircularProgress size={13} color="inherit" /> : <ReplyIcon fontSize="small" />}
                  >
                    {sending ? "Enviando..." : "Enviar resposta"}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => { setReplyOpen(false); setReplyText(""); setError(""); }}
                  >
                    Cancelar
                  </Button>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {/* Show sent reply */}
        {hasReplied && notif.myReplyMessage && (
          <Collapse in>
            <Box sx={{ mt: 2, pl: 7 }}>
              <Divider sx={{ mb: 1.5 }} />
              <Box sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                <CheckCircleIcon sx={{ color: "success.main", fontSize: 16, mt: 0.25, flexShrink: 0 }} />
                <Box>
                  <Typography variant="caption" color="success.main" fontWeight={700}>
                    Sua resposta
                    {notif.myReplyAt && (
                      <Box component="span" sx={{ fontWeight: 400, color: "text.disabled", ml: 0.75 }}>
                        — {new Date(notif.myReplyAt).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </Box>
                    )}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.25, color: "text.secondary", fontStyle: "italic" }}>
                    "{notif.myReplyMessage}"
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Collapse>
        )}
      </Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const FILTER_TABS = [
  { value: "ALL", label: "Todos" },
  { value: "GERAL", label: "Geral" },
  { value: "FINANCEIRO", label: "Financeiro" },
  { value: "SEGURANCA", label: "Segurança" },
  { value: "PREGAO", label: "Pregão" },
  { value: "DOCUMENTOS", label: "Documentos" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  // Mark all as seen in localStorage on mount
  useEffect(() => {
    localStorage.setItem("lb_notif_last_seen", new Date().toISOString());
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    notificationsApi.list()
      .then(setNotifications)
      .catch(() => setError("Erro ao carregar avisos."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleReplied = (id: string, msg: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, myReplyId: "local", myReplyMessage: msg, myReplyAt: new Date().toISOString() }
          : n
      )
    );
  };

  const filtered = filter === "ALL" ? notifications : notifications.filter((n) => n.category === filter);

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Meus Avisos</Typography>
        <Typography variant="body2" color="text.secondary">
          Avisos e comunicados enviados pela plataforma
        </Typography>
      </Box>

      {/* Category filter chips */}
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 3 }}>
        {FILTER_TABS.map((f) => {
          const count = f.value === "ALL"
            ? notifications.length
            : notifications.filter((n) => n.category === f.value).length;
          return (
            <Chip
              key={f.value}
              label={`${f.label}${count > 0 ? ` (${count})` : ""}`}
              onClick={() => setFilter(f.value)}
              variant={filter === f.value ? "filled" : "outlined"}
              color={filter === f.value ? "primary" : "default"}
              sx={{ fontWeight: filter === f.value ? 700 : 400 }}
            />
          );
        })}
      </Box>

      {/* Content */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 10, color: "text.secondary" }}>
          <NotificationsNoneIcon sx={{ fontSize: 64, opacity: 0.25, mb: 1.5 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>Nenhum aviso encontrado</Typography>
          <Typography variant="body2">
            {filter === "ALL"
              ? "Você não possui avisos no momento."
              : `Nenhum aviso na categoria "${FILTER_TABS.find((f) => f.value === filter)?.label}".`}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {filtered.map((n) => (
            <NotificationCard key={n.id} notif={n} onReplied={handleReplied} />
          ))}
        </Box>
      )}
    </Box>
  );
}
