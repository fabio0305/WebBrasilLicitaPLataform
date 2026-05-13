import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SendIcon from "@mui/icons-material/Send";
import GavelIcon from "@mui/icons-material/Gavel";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import PeopleIcon from "@mui/icons-material/People";
import ChatIcon from "@mui/icons-material/Chat";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { auctionsApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { io as socketIO } from "socket.io-client";
import type { AuctionDetail } from "../data/types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centsToReal(c?: string | number | null): string {
  if (c == null) return "—";
  const v = typeof c === "string" ? parseInt(c, 10) : c;
  if (isNaN(v)) return "—";
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function padTwo(n: number) {
  return String(n).padStart(2, "0");
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${padTwo(h)}:${padTwo(m)}:${padTwo(sec)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChatMsg {
  id: string;
  senderName: string;
  content: string;
  type: "USER" | "SYSTEM" | "AUCTIONEER";
  createdAt: string;
}

interface BidEvent {
  bidId: string;
  lotId: string;
  amountCents: string;
  userId: string;
  createdAt: string;
}

interface LotState {
  id: string;
  title: string;
  description?: string | null;
  startingPriceCents: string;
  minIncrementCents: string;
  currentMaxBidCents?: string | null;
  bidCount: number;
  leadingUserId?: string;
}

// ─── Countdown ───────────────────────────────────────────────────────────────

function Countdown({ endsAt, onExpire }: { endsAt: string | null; onExpire?: () => void }) {
  const [ms, setMs] = useState(() => endsAt ? new Date(endsAt).getTime() - Date.now() : 0);

  useEffect(() => {
    if (!endsAt) return;
    const tick = () => {
      const remaining = new Date(endsAt).getTime() - Date.now();
      setMs(remaining);
      if (remaining <= 0) onExpire?.();
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [endsAt, onExpire]);

  const isUrgent = ms > 0 && ms < 60000;
  const isExpired = ms <= 0;

  return (
    <Box sx={{ textAlign: "center" }}>
      <Typography
        variant="h3"
        fontWeight={800}
        fontFamily="monospace"
        sx={{
          color: isExpired ? "text.disabled" : isUrgent ? "error.main" : "success.main",
          letterSpacing: 2,
        }}
      >
        {isExpired ? "Encerrado" : formatCountdown(ms)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {isExpired ? "Sessão encerrada" : isUrgent ? "Atenção: tempo esgotando!" : "Tempo restante da sessão"}
      </Typography>
    </Box>
  );
}

// ─── Brasília clock ───────────────────────────────────────────────────────────

function BrasiliaTime() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);
  const brt = time.toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
      <AccessTimeIcon sx={{ fontSize: 14, color: "text.secondary" }} />
      <Typography variant="caption" color="text.secondary" fontFamily="monospace" fontWeight={600}>
        Brasília {brt}
      </Typography>
    </Box>
  );
}

// ─── Lot Card ─────────────────────────────────────────────────────────────────

function LotCard({
  lot,
  selected,
  onSelect,
}: {
  lot: LotState;
  selected: boolean;
  onSelect: () => void;
}) {
  const hasBid = lot.currentMaxBidCents != null;
  return (
    <Card
      elevation={0}
      onClick={onSelect}
      sx={{
        border: "2px solid",
        borderColor: selected ? "primary.main" : "divider",
        borderRadius: 2,
        cursor: "pointer",
        transition: "all 0.15s",
        bgcolor: selected ? "primary.50" : "white",
        "&:hover": { borderColor: "primary.light", boxShadow: "0 2px 8px rgba(0,0,0,0.08)" },
      }}
    >
      <CardContent sx={{ p: "12px!important" }}>
        <Typography variant="body2" fontWeight={700} noWrap>{lot.title}</Typography>
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Lance atual</Typography>
            <Typography variant="body2" fontWeight={700} color={hasBid ? "success.main" : "text.secondary"}>
              {hasBid ? centsToReal(lot.currentMaxBidCents) : "Sem lances"}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="caption" color="text.secondary">Lances</Typography>
            <Typography variant="body2" fontWeight={700} color="primary.main">{lot.bidCount}</Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SalaDeDisputaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [selectedLotIndex, setSelectedLotIndex] = useState(0);
  const [lots, setLots] = useState<LotState[]>([]);

  const [bidInput, setBidInput] = useState("");
  const [bidLoading, setBidLoading] = useState(false);
  const [bidError, setBidError] = useState("");
  const [bidSuccess, setBidSuccess] = useState("");

  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<ReturnType<typeof socketIO> | null>(null);

  const selectedLot = lots[selectedLotIndex] ?? null;

  // ── Load auction ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    auctionsApi
      .get(id)
      .then((a) => {
        setAuction(a);
        setLots(
          a.lots.map((l) => ({
            id: l.id,
            title: l.title,
            description: l.description,
            startingPriceCents: l.startingPriceCents ?? "0",
            minIncrementCents: l.minIncrementCents ?? "1",
            currentMaxBidCents: l.currentMaxBidCents != null ? String(l.currentMaxBidCents) : null,
            bidCount: l.bidCount ?? 0,
          }))
        );
      })
      .catch(() => setError("Sessão não encontrada."))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Load chat history ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    fetch(`/api/chat/auction/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setChatMessages(d.messages ?? []))
      .catch(() => {});
  }, [id]);

  // ── Socket.io ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    const socket = socketIO({ path: "/socket.io", transports: ["websocket"] });
    socketRef.current = socket;

    socket.emit("auction:join", { auctionId: id });

    socket.on("bid:new", (event: BidEvent) => {
      setLots((prev) =>
        prev.map((l) => {
          if (l.id !== event.lotId) return l;
          const newBid = BigInt(event.amountCents);
          const cur = l.currentMaxBidCents ? BigInt(l.currentMaxBidCents) : 0n;
          return {
            ...l,
            currentMaxBidCents: newBid > cur ? event.amountCents : l.currentMaxBidCents,
            bidCount: l.bidCount + 1,
            leadingUserId: newBid > cur ? event.userId : l.leadingUserId,
          };
        })
      );
      const systemMsg: ChatMsg = {
        id: `sys-${Date.now()}`,
        senderName: "Sistema",
        type: "SYSTEM",
        content: `Novo lance: ${centsToReal(event.amountCents)}`,
        createdAt: event.createdAt,
      };
      setChatMessages((prev) => [...prev, systemMsg]);
    });

    socket.on("chat:message", (msg: ChatMsg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    socket.on("auction:statusChanged", ({ status }: { auctionId: string; status: string }) => {
      setAuction((prev) => prev ? { ...prev, status: status as import("../data/types").AuctionStatus } : prev);
    });

    socket.on("auction:extended", ({ endsAt }: { auctionId: string; endsAt: string }) => {
      setAuction((prev) => prev ? { ...prev, endsAt } : prev);
      const extMsg: ChatMsg = {
        id: `ext-${Date.now()}`,
        senderName: "Sistema",
        type: "SYSTEM",
        content: "Prazo prorrogado por lance de último minuto (anti-sniping).",
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, extMsg]);
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  // ── Scroll chat to bottom ──────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ── Submit bid ────────────────────────────────────────────────────────────
  const handleBid = useCallback(async () => {
    if (!selectedLot || !bidInput.trim()) return;
    setBidLoading(true);
    setBidError("");
    setBidSuccess("");
    try {
      const res = await fetch(`/api/lots/${selectedLot.id}/bids`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: bidInput }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        const msgs: Record<string, string> = {
          BID_TOO_LOW: `Lance muito baixo. Mínimo: ${centsToReal(d.minValidCents)}`,
          AUCTION_NOT_OPEN: "Pregão não está aberto.",
          AUCTION_CLOSED: "Pregão encerrado.",
        };
        setBidError(msgs[d.error] ?? "Erro ao enviar lance.");
      } else {
        setBidSuccess("Lance enviado com sucesso!");
        setBidInput("");
      }
    } catch {
      setBidError("Erro de conexão ao enviar lance.");
    } finally {
      setBidLoading(false);
    }
  }, [selectedLot, bidInput]);

  // ── Send chat message ─────────────────────────────────────────────────────
  const handleChat = useCallback(async () => {
    if (!chatInput.trim() || !id) return;
    const content = chatInput.trim();
    setChatInput("");
    try {
      await fetch(`/api/chat/auction/${id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, senderName: user?.name ?? "Fornecedor" }),
      });
    } catch {
      setChatMessages((prev) => [...prev, {
        id: `err-${Date.now()}`, senderName: "Erro", type: "SYSTEM",
        content: "Falha ao enviar mensagem.", createdAt: new Date().toISOString(),
      }]);
    }
  }, [chatInput, id, user]);

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
        <Alert severity="error">{error || "Sessão não encontrada."}</Alert>
      </Box>
    );
  }

  const isOpen = auction.status === "OPEN";
  const minNextBid = selectedLot
    ? selectedLot.currentMaxBidCents
      ? BigInt(selectedLot.currentMaxBidCents) + BigInt(selectedLot.minIncrementCents)
      : BigInt(selectedLot.startingPriceCents)
    : 0n;

  return (
    <Box sx={{ maxWidth: 1400, mx: "auto" }}>
      {/* ── Header ── */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
        <Box>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} size="small" sx={{ mb: 0.5, color: "text.secondary" }}>
            Voltar ao Pregão
          </Button>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GavelIcon sx={{ color: "#2c3f31", fontSize: 22 }} />
            <Typography variant="h6" fontWeight={700}>{auction.title}</Typography>
            <Chip
              label={isOpen ? "Em Disputa" : auction.status === "SCHEDULED" ? "Agendado" : "Encerrado"}
              color={isOpen ? "success" : "default"}
              size="small"
              sx={{ fontWeight: 700 }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2, mt: 0.5 }}>
            <BrasiliaTime />
            {auction.processNumber && (
              <Typography variant="caption" color="text.secondary">
                Processo: {auction.processNumber}
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
          <Chip icon={<PeopleIcon />} label={`${lots.length} lote(s)`} size="small" variant="outlined" />
        </Box>
      </Box>

      <Grid container spacing={2}>
        {/* ── Left: Lots + Bidding ── */}
        <Grid item xs={12} md={8}>

          {/* Countdown */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: isOpen ? "success.main" : "divider", borderRadius: 2, mb: 2, bgcolor: isOpen ? "#f0fdf4" : "#f9fafb" }}>
            <CardContent sx={{ py: 2, textAlign: "center" }}>
              <Countdown
                endsAt={auction.endsAt ?? null}
                onExpire={() => setAuction((p) => p ? { ...p, status: "CLOSED" } : p)}
              />
            </CardContent>
          </Card>

          {/* Lot Tabs */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
            <Tabs
              value={selectedLotIndex}
              onChange={(_, v) => setSelectedLotIndex(v as number)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ borderBottom: "1px solid", borderColor: "divider", px: 1, minHeight: 40 }}
            >
              {lots.map((l, i) => (
                <Tab
                  key={l.id}
                  label={`Lote ${i + 1}`}
                  sx={{ fontSize: 12, minHeight: 40, py: 0 }}
                />
              ))}
            </Tabs>

            {selectedLot && (
              <Box sx={{ p: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>{selectedLot.title}</Typography>
                    {selectedLot.description && (
                      <Typography variant="body2" color="text.secondary">{selectedLot.description}</Typography>
                    )}
                  </Box>
                  <Box sx={{ textAlign: "right" }}>
                    <Typography variant="caption" color="text.secondary" display="block">Valor inicial</Typography>
                    <Typography variant="body2" fontWeight={600}>{centsToReal(selectedLot.startingPriceCents)}</Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Current Best Bid */}
                <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 2 }}>
                  <Card elevation={0} sx={{ flex: 1, minWidth: 140, border: "1px solid", borderColor: "success.light", bgcolor: "#f0fdf4", borderRadius: 2 }}>
                    <CardContent sx={{ p: "12px!important" }}>
                      <Typography variant="caption" color="text.secondary">Melhor lance</Typography>
                      <Typography variant="h5" fontWeight={800} color="success.main">
                        {selectedLot.currentMaxBidCents ? centsToReal(selectedLot.currentMaxBidCents) : "Sem lances"}
                      </Typography>
                    </CardContent>
                  </Card>
                  <Card elevation={0} sx={{ flex: 1, minWidth: 120, border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
                    <CardContent sx={{ p: "12px!important" }}>
                      <Typography variant="caption" color="text.secondary">Total de lances</Typography>
                      <Typography variant="h5" fontWeight={800} color="primary.main">{selectedLot.bidCount}</Typography>
                    </CardContent>
                  </Card>
                  <Card elevation={0} sx={{ flex: 1, minWidth: 140, border: "1px solid", borderColor: "primary.light", borderRadius: 2 }}>
                    <CardContent sx={{ p: "12px!important" }}>
                      <Typography variant="caption" color="text.secondary">Próximo mínimo</Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">{centsToReal(minNextBid.toString())}</Typography>
                    </CardContent>
                  </Card>
                </Box>

                {/* Bid Input */}
                {isOpen && (
                  <Box>
                    {bidError && <Alert severity="error" sx={{ mb: 1.5 }}>{bidError}</Alert>}
                    {bidSuccess && <Alert severity="success" sx={{ mb: 1.5 }}>{bidSuccess}</Alert>}
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder={`Mínimo: ${centsToReal(minNextBid.toString())}`}
                        value={bidInput}
                        onChange={(e) => setBidInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") void handleBid(); }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                        }}
                        disabled={bidLoading}
                      />
                      <Button
                        variant="contained"
                        startIcon={bidLoading ? <CircularProgress size={16} color="inherit" /> : <TrendingDownIcon />}
                        onClick={() => void handleBid()}
                        disabled={bidLoading || !bidInput.trim()}
                        sx={{ whiteSpace: "nowrap", minWidth: 130 }}
                      >
                        Dar Lance
                      </Button>
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                      Disputa aberta · Menor preço · Anti-sniping ativo
                    </Typography>
                  </Box>
                )}
                {!isOpen && (
                  <Alert severity="info" icon={<CheckCircleIcon />}>
                    A sessão de disputa está encerrada para este lote.
                  </Alert>
                )}
              </Box>
            )}
          </Card>

          {/* Lots overview grid */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
              <ListAltIcon sx={{ fontSize: 18, color: "text.secondary" }} />
              <Typography variant="subtitle2" fontWeight={700}>Todos os Lotes</Typography>
            </Box>
            <Divider />
            <Box sx={{ p: 1.5, display: "grid", gap: 1.5, gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))" }}>
              {lots.map((l, i) => (
                <LotCard
                  key={l.id}
                  lot={l}
                  selected={i === selectedLotIndex}
                  onSelect={() => setSelectedLotIndex(i)}
                />
              ))}
            </Box>
          </Card>
        </Grid>

        {/* ── Right: Chat & Info ── */}
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, height: "100%", display: "flex", flexDirection: "column" }}>
            <Tabs value={tab} onChange={(_, v) => setTab(v as number)} sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
              <Tab icon={<ChatIcon fontSize="small" />} label="Chat" iconPosition="start" sx={{ fontSize: 12, minHeight: 44, py: 0 }} />
              <Tab icon={<EmojiPeopleIcon fontSize="small" />} label="Participantes" iconPosition="start" sx={{ fontSize: 12, minHeight: 44, py: 0 }} />
            </Tabs>

            {tab === 0 && (
              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
                {/* Messages */}
                <Box sx={{ flex: 1, overflowY: "auto", p: 1.5, display: "flex", flexDirection: "column", gap: 1, maxHeight: { xs: 300, md: 480 } }}>
                  {chatMessages.length === 0 && (
                    <Box sx={{ textAlign: "center", mt: 4 }}>
                      <ChatIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Sem mensagens ainda.
                      </Typography>
                    </Box>
                  )}
                  {chatMessages.map((msg) => {
                    const isSystem = msg.type === "SYSTEM";
                    const isAuctioneer = msg.type === "AUCTIONEER";
                    return (
                      <Box key={msg.id} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
                        {!isSystem && (
                          <Box
                            sx={{
                              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                              bgcolor: isAuctioneer ? "#2c3f31" : "#1976d2",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "white", fontSize: 11, fontWeight: 700,
                            }}
                          >
                            {msg.senderName.charAt(0).toUpperCase()}
                          </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          {isSystem ? (
                            <Box sx={{ bgcolor: "#f3f4f6", borderRadius: 1, px: 1.5, py: 0.75, textAlign: "center" }}>
                              <Typography variant="caption" color="text.secondary" fontStyle="italic">{msg.content}</Typography>
                            </Box>
                          ) : (
                            <Box>
                              <Box sx={{ display: "flex", gap: 1, alignItems: "baseline" }}>
                                <Typography variant="caption" fontWeight={700} color={isAuctioneer ? "primary.main" : "text.primary"}>
                                  {isAuctioneer ? "Pregoeiro" : msg.senderName}
                                </Typography>
                                <Typography variant="caption" color="text.disabled" sx={{ fontSize: 10 }}>
                                  {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </Typography>
                              </Box>
                              <Typography variant="body2" sx={{ wordBreak: "break-word" }}>{msg.content}</Typography>
                            </Box>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={chatEndRef} />
                </Box>

                <Divider />
                <Box sx={{ p: 1.5, display: "flex", gap: 1 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enviar mensagem..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void handleChat(); } }}
                    disabled={!isOpen}
                  />
                  <Tooltip title="Enviar">
                    <span>
                      <IconButton onClick={() => void handleChat()} disabled={!chatInput.trim() || !isOpen} color="primary">
                        <SendIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            )}

            {tab === 1 && (
              <Box sx={{ p: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Fornecedores classificados nesta sessão
                </Typography>
                <List disablePadding>
                  {lots.reduce<string[]>((acc, l) => {
                    if (l.leadingUserId && !acc.includes(l.leadingUserId)) acc.push(l.leadingUserId);
                    return acc;
                  }, []).length === 0 ? (
                    <Box sx={{ textAlign: "center", py: 3 }}>
                      <PeopleIcon sx={{ fontSize: 36, color: "text.disabled" }} />
                      <Typography variant="body2" color="text.secondary">Nenhum participante ainda.</Typography>
                    </Box>
                  ) : (
                    lots
                      .filter((l) => l.leadingUserId)
                      .map((l, i) => (
                        <ListItem key={l.id} disablePadding sx={{ py: 0.5 }}>
                          <Box sx={{ width: 24, height: 24, borderRadius: "50%", bgcolor: "#4caf5020", display: "flex", alignItems: "center", justifyContent: "center", mr: 1, flexShrink: 0 }}>
                            <Typography variant="caption" fontWeight={700} color="success.main">{i + 1}</Typography>
                          </Box>
                          <ListItemText
                            primary={`Lote ${i + 1}: ${l.title}`}
                            secondary={`Lance: ${centsToReal(l.currentMaxBidCents)}`}
                            primaryTypographyProps={{ variant: "body2", fontWeight: 600, noWrap: true }}
                            secondaryTypographyProps={{ variant: "caption" }}
                          />
                          <Chip label="1º" size="small" color="success" sx={{ fontSize: 10 }} />
                        </ListItem>
                      ))
                  )}
                </List>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
