import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Grid,
  InputAdornment,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GavelIcon from "@mui/icons-material/Gavel";
import SendIcon from "@mui/icons-material/Send";
import { auctionsApi } from "../api/client";
import type { AuctionDetail } from "../data/types";

// ─── Declarations list ────────────────────────────────────────────────────────

const DECLARATIONS = [
  { id: "lei_14133", label: "Declaro que conheço e cumpro as exigências da Lei 14.133/2021 (Nova Lei de Licitações).", required: true },
  { id: "habilitacao", label: "Declaro que possuo documentação de habilitação em situação regular.", required: true },
  { id: "trabalho_infantil", label: "Declaro que não emprego menor de 18 anos em trabalho noturno, perigoso ou insalubre.", required: true },
  { id: "mei_epp", label: "Declaro, para os fins do artigo 3º da LC 123/2006, que sou microempresa ou empresa de pequeno porte.", required: false },
  { id: "nao_impedido", label: "Declaro que não estou impedido ou suspenso de licitar ou contratar com a Administração Pública.", required: true },
  { id: "veracidade", label: "Declaro que todas as informações prestadas nesta proposta são verdadeiras.", required: true },
];

// ─── Steps ────────────────────────────────────────────────────────────────────

const STEPS = ["Declarações", "Materiais/Serviços", "Revisão e Envio"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function centsToReal(c?: string | number | null): string {
  if (c == null) return "—";
  const v = typeof c === "string" ? parseInt(c, 10) : c;
  if (isNaN(v)) return "—";
  return (v / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface LotProposal {
  lotId: string;
  lotTitle: string;
  startingPriceCents: string;
  amount: string;
  brand: string;
  manufacturer: string;
  model: string;
  description: string;
  complete: boolean;
}

// ─── Step 1: Declarations ─────────────────────────────────────────────────────

function DeclarationsStep({
  declarations,
  onChange,
}: {
  declarations: Record<string, boolean>;
  onChange: (d: Record<string, boolean>) => void;
}) {
  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Declarações Legais</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Leia e aceite as declarações obrigatórias para prosseguir com o envio da proposta.
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
        {DECLARATIONS.map((d) => (
          <Card key={d.id} elevation={0} sx={{ border: "1px solid", borderColor: declarations[d.id] ? "success.main" : "divider", borderRadius: 2, bgcolor: declarations[d.id] ? "#f0fdf4" : "white" }}>
            <CardContent sx={{ p: "12px 16px!important" }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={declarations[d.id] ?? false}
                    onChange={(e) => onChange({ ...declarations, [d.id]: e.target.checked })}
                    color="success"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                    <Typography variant="body2">{d.label}</Typography>
                    {d.required && <Chip label="Obrigatória" size="small" color="warning" sx={{ fontSize: 10, height: 18 }} />}
                  </Box>
                }
              />
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

// ─── Step 2: Items ────────────────────────────────────────────────────────────

function ItemsStep({
  lots,
  onChange,
}: {
  lots: LotProposal[];
  onChange: (lots: LotProposal[]) => void;
}) {
  const updateLot = (index: number, patch: Partial<LotProposal>) => {
    const updated = lots.map((l, i) => {
      if (i !== index) return l;
      const merged = { ...l, ...patch };
      const complete = !!(merged.amount && parseFloat(merged.amount) > 0 && merged.brand && merged.manufacturer);
      return { ...merged, complete };
    });
    onChange(updated);
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Materiais e Serviços</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Preencha os campos para cada lote. Marca e fabricante são obrigatórios.
      </Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {lots.map((lot, i) => (
          <Card key={lot.lotId} elevation={0} sx={{ border: "1px solid", borderColor: lot.complete ? "success.main" : "divider", borderRadius: 2 }}>
            <Box sx={{ px: 2.5, pt: 2, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>{lot.lotTitle}</Typography>
                <Typography variant="caption" color="text.secondary">Valor de referência: {centsToReal(lot.startingPriceCents)}</Typography>
              </Box>
              <Chip
                icon={lot.complete ? <CheckCircleIcon fontSize="small" /> : undefined}
                label={lot.complete ? "Completo" : "Pendente"}
                size="small"
                color={lot.complete ? "success" : "default"}
              />
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
              <TextField
                label="Valor unitário *"
                size="small"
                value={lot.amount}
                onChange={(e) => updateLot(i, { amount: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
              />
              <TextField
                label="Marca *"
                size="small"
                value={lot.brand}
                onChange={(e) => updateLot(i, { brand: e.target.value })}
                placeholder="Ex: Samsung, Intelbras..."
              />
              <TextField
                label="Fabricante *"
                size="small"
                value={lot.manufacturer}
                onChange={(e) => updateLot(i, { manufacturer: e.target.value })}
              />
              <TextField
                label="Modelo / Versão"
                size="small"
                value={lot.model}
                onChange={(e) => updateLot(i, { model: e.target.value })}
              />
              <TextField
                label="Descrição complementar"
                size="small"
                value={lot.description}
                onChange={(e) => updateLot(i, { description: e.target.value })}
                sx={{ gridColumn: { sm: "1 / -1" } }}
                multiline
                rows={2}
              />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function ReviewStep({
  auction,
  lots,
  declarations,
}: {
  auction: AuctionDetail;
  lots: LotProposal[];
  declarations: Record<string, boolean>;
}) {
  const acceptedDeclarations = DECLARATIONS.filter((d) => declarations[d.id]);
  const completeLots = lots.filter((l) => l.complete);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Revisão e Envio</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Confira todos os dados antes de enviar. Após o envio, a proposta só pode ser excluída antes do início da sessão.
      </Typography>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Pregão</Typography>
          <Typography variant="body2">{auction.title}</Typography>
          {auction.processNumber && (
            <Typography variant="caption" color="text.secondary">Processo: {auction.processNumber}</Typography>
          )}
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Declarações Aceitas ({acceptedDeclarations.length}/{DECLARATIONS.length})
          </Typography>
          {acceptedDeclarations.map((d) => (
            <Box key={d.id} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <CheckCircleIcon fontSize="small" sx={{ color: "success.main" }} />
              <Typography variant="caption">{d.label}</Typography>
            </Box>
          ))}
        </CardContent>
      </Card>

      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Lotes ({completeLots.length}/{lots.length} completo{lots.length !== 1 ? "s" : ""})
          </Typography>
          {lots.map((l, i) => (
            <Box key={l.lotId} sx={{ py: 1, borderBottom: i < lots.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" fontWeight={600}>{l.lotTitle}</Typography>
                <Chip
                  icon={l.complete ? <CheckCircleIcon fontSize="small" /> : undefined}
                  label={l.complete ? `R$ ${l.amount}` : "Incompleto"}
                  size="small"
                  color={l.complete ? "success" : "warning"}
                />
              </Box>
              {l.complete && (
                <Typography variant="caption" color="text.secondary">
                  {l.brand} · {l.manufacturer}{l.model ? ` · ${l.model}` : ""}
                </Typography>
              )}
            </Box>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PropostaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [auction, setAuction] = useState<AuctionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const [declarations, setDeclarations] = useState<Record<string, boolean>>({});
  const [lots, setLots] = useState<LotProposal[]>([]);

  useEffect(() => {
    if (!id) return;
    auctionsApi
      .get(id)
      .then((a) => {
        setAuction(a);
        setLots(
          a.lots.map((l) => ({
            lotId: l.id,
            lotTitle: l.title,
            startingPriceCents: l.startingPriceCents ?? "0",
            amount: "",
            brand: "",
            manufacturer: "",
            model: "",
            description: "",
            complete: false,
          }))
        );
      })
      .catch(() => setError("Pregão não encontrado."))
      .finally(() => setLoading(false));
  }, [id]);

  const canProceedStep0 = DECLARATIONS.filter((d) => d.required).every((d) => declarations[d.id]);
  const canProceedStep1 = lots.every((l) => l.complete);

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep((s) => s + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!id) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      // Save each lot proposal then submit
      for (const lot of lots) {
        const saveRes = await fetch(`/api/proposals/auction/${id}`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lotId: lot.lotId,
            amountCents: (parseFloat(lot.amount) * 100).toString(),
            brand: lot.brand,
            manufacturer: lot.manufacturer,
            model: lot.model,
            description: lot.description,
            declarations,
          }),
        });
        if (!saveRes.ok) throw new Error("Erro ao salvar proposta.");
        const saved = await saveRes.json();
        const submitRes = await fetch(`/api/proposals/${saved.id}/submit`, {
          method: "POST",
          credentials: "include",
        });
        if (!submitRes.ok) throw new Error("Erro ao finalizar proposta.");
      }
      setSubmitted(true);
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Erro ao enviar proposta.");
    } finally {
      setSubmitting(false);
    }
  };

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

  if (submitted) {
    return (
      <Box sx={{ maxWidth: 600, mx: "auto", textAlign: "center", mt: 6 }}>
        <CheckCircleIcon sx={{ fontSize: 72, color: "success.main", mb: 2 }} />
        <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>Proposta Enviada!</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Sua proposta foi enviada com sucesso. Você pode acompanhar o status em "Minhas Propostas".
        </Typography>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="outlined" onClick={() => navigate("/fornecedor/propostas")}>
            Ver Minhas Propostas
          </Button>
          <Button variant="contained" onClick={() => navigate(`/pregoes/${id}/disputa`)}>
            Ir para Sala de Disputa
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} size="small" sx={{ mb: 1, color: "text.secondary" }}>
          Voltar ao Pregão
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GavelIcon sx={{ color: "#2c3f31", fontSize: 22 }} />
          <Typography variant="h6" fontWeight={700}>Envio de Proposta</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">{auction.title}</Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={step} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step content */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {step === 0 && (
            <DeclarationsStep declarations={declarations} onChange={setDeclarations} />
          )}
          {step === 1 && (
            <ItemsStep lots={lots} onChange={setLots} />
          )}
          {step === 2 && (
            <ReviewStep auction={auction} lots={lots} declarations={declarations} />
          )}
        </CardContent>
      </Card>

      {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          disabled={step === 0}
          variant="outlined"
        >
          Anterior
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={handleNext}
            variant="contained"
            disabled={step === 0 ? !canProceedStep0 : step === 1 ? !canProceedStep1 : false}
          >
            Próximo
          </Button>
        ) : (
          <Button
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <SendIcon />}
            onClick={() => void handleSubmit()}
            variant="contained"
            color="success"
            disabled={submitting || !canProceedStep0 || !canProceedStep1}
          >
            Finalizar e Enviar
          </Button>
        )}
      </Box>
    </Box>
  );
}
