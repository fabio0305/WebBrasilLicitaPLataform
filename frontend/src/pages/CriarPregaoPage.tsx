import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import GavelIcon from "@mui/icons-material/Gavel";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PublishIcon from "@mui/icons-material/Publish";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LotForm {
  id: string;
  title: string;
  description: string;
  startingPrice: string;
  minIncrement: string;
  quantity: string;
  unit: string;
}

const MODALITIES = [
  { value: "PREGAO", label: "Pregão Eletrônico", desc: "Lei 14.133/2021 · Menor Preço / Maior Desconto" },
  { value: "DISPENSA", label: "Dispensa Eletrônica", desc: "Art. 75 da Lei 14.133/2021" },
  { value: "CREDENCIAMENTO", label: "Credenciamento", desc: "Art. 79, IV da Lei 14.133/2021" },
  { value: "CONCORRENCIA", label: "Concorrência Eletrônica", desc: "Lei 14.133/2021" },
  { value: "INEXIGIBILIDADE", label: "Inexigibilidade", desc: "Art. 74 da Lei 14.133/2021" },
  { value: "LEILAO", label: "Leilão Eletrônico", desc: "Alienação de bens" },
];

const JUDGMENT_CRITERIA = [
  { value: "MENOR_PRECO", label: "Menor Preço" },
  { value: "MAIOR_DESCONTO", label: "Maior Desconto" },
  { value: "TECNICA_PRECO", label: "Técnica e Preço" },
  { value: "MELHOR_TECNICA", label: "Melhor Técnica" },
];

const DISPUTE_MODES = [
  { value: "OPEN", label: "Aberto", desc: "Todos os lances visíveis em tempo real" },
  { value: "OPEN_CLOSED", label: "Aberto-Fechado", desc: "Fase aberta + fase de lance fechado" },
];

const STEPS = ["Dados Gerais", "Lotes e Itens", "Publicação"];

// ─── Step 1: General Data ─────────────────────────────────────────────────────

function DadosGeraisStep({
  data,
  onChange,
}: {
  data: Record<string, string | boolean>;
  onChange: (d: Record<string, string | boolean>) => void;
}) {
  const set = (key: string, value: string | boolean) => onChange({ ...data, [key]: value });

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Dados Gerais do Processo</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Informe os dados básicos do processo licitatório.
      </Typography>

      <Grid container spacing={2.5}>
        {/* Modality */}
        <Grid item xs={12}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1.5 }}>Modalidade *</Typography>
          <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)", md: "repeat(3,1fr)" } }}>
            {MODALITIES.map((m) => (
              <Card
                key={m.value}
                elevation={0}
                onClick={() => set("modality", m.value)}
                sx={{
                  border: "2px solid",
                  borderColor: data.modality === m.value ? "primary.main" : "divider",
                  borderRadius: 2,
                  cursor: "pointer",
                  bgcolor: data.modality === m.value ? "primary.50" : "white",
                  transition: "all 0.15s",
                  "&:hover": { borderColor: "primary.light" },
                }}
              >
                <CardContent sx={{ p: "12px!important" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.25 }}>
                    <Typography variant="body2" fontWeight={700}>{m.label}</Typography>
                    {data.modality === m.value && <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />}
                  </Box>
                  <Typography variant="caption" color="text.secondary">{m.desc}</Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Título do objeto *"
            value={data.title ?? ""}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Ex: Aquisição de Equipamentos de TI"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Número do processo"
            value={data.processNumber ?? ""}
            onChange={(e) => set("processNumber", e.target.value)}
            placeholder="Ex: 001/2026"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Número do edital"
            value={data.editalNumber ?? ""}
            onChange={(e) => set("editalNumber", e.target.value)}
            placeholder="Ex: PE-001/2026"
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Valor estimado total"
            value={data.estimatedValue ?? ""}
            onChange={(e) => set("estimatedValue", e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Critério de Julgamento</InputLabel>
            <Select
              value={data.judgmentCriteria ?? "MENOR_PRECO"}
              label="Critério de Julgamento"
              onChange={(e) => set("judgmentCriteria", e.target.value)}
            >
              {JUDGMENT_CRITERIA.map((j) => (
                <MenuItem key={j.value} value={j.value}>{j.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth size="small">
            <InputLabel>Modo de Disputa</InputLabel>
            <Select
              value={data.disputeMode ?? "OPEN"}
              label="Modo de Disputa"
              onChange={(e) => set("disputeMode", e.target.value)}
            >
              {DISPUTE_MODES.map((d) => (
                <MenuItem key={d.value} value={d.value}>
                  <Box>
                    <Typography variant="body2">{d.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{d.desc}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Data/hora de abertura das propostas"
            type="datetime-local"
            value={data.proposalDeadline ?? ""}
            onChange={(e) => set("proposalDeadline", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Data/hora de início da sessão"
            type="datetime-local"
            value={data.startsAt ?? ""}
            onChange={(e) => set("startsAt", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth size="small" label="Data/hora de encerramento"
            type="datetime-local"
            value={data.endsAt ?? ""}
            onChange={(e) => set("endsAt", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth size="small" label="Descrição / Objeto detalhado"
            value={data.description ?? ""}
            onChange={(e) => set("description", e.target.value)}
            multiline rows={3}
          />
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(data.phaseInversionEnabled)}
                  onChange={(e) => set("phaseInversionEnabled", e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Inversão de Fases</Typography>
                  <Typography variant="caption" color="text.secondary">Habilita a licitação com fase de lances antes da análise documental</Typography>
                </Box>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={Boolean(data.hiddenValue)}
                  onChange={(e) => set("hiddenValue", e.target.checked)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Valor Sigiloso</Typography>
                  <Typography variant="caption" color="text.secondary">Oculta o valor de referência dos fornecedores</Typography>
                </Box>
              }
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Step 2: Lots ─────────────────────────────────────────────────────────────

function LotesStep({
  lots,
  onChange,
}: {
  lots: LotForm[];
  onChange: (lots: LotForm[]) => void;
}) {
  const addLot = () => {
    onChange([
      ...lots,
      { id: `lot-${Date.now()}`, title: "", description: "", startingPrice: "", minIncrement: "", quantity: "1", unit: "UN" },
    ]);
  };

  const updateLot = (index: number, patch: Partial<LotForm>) => {
    onChange(lots.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const removeLot = (index: number) => {
    onChange(lots.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>Lotes e Itens</Typography>
          <Typography variant="body2" color="text.secondary">Adicione os lotes com seus respectivos valores de referência.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={addLot} size="small">
          Adicionar Lote
        </Button>
      </Box>

      {lots.length === 0 && (
        <Box sx={{ textAlign: "center", py: 4, border: "2px dashed", borderColor: "divider", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">Nenhum lote adicionado.</Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addLot} sx={{ mt: 1.5 }}>
            Adicionar primeiro lote
          </Button>
        </Box>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {lots.map((lot, i) => (
          <Card key={lot.id} elevation={0} sx={{ border: "1px solid", borderColor: lot.title ? "divider" : "warning.light", borderRadius: 2 }}>
            <Box sx={{ px: 2.5, pt: 2, pb: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip label={`Lote ${i + 1}`} size="small" color="primary" sx={{ fontWeight: 700 }} />
                {lot.title && <Typography variant="body2" fontWeight={600}>{lot.title}</Typography>}
              </Box>
              <Tooltip title="Remover lote">
                <Button size="small" color="error" startIcon={<DeleteIcon fontSize="small" />} onClick={() => removeLot(i)}>
                  Remover
                </Button>
              </Tooltip>
            </Box>
            <Divider />
            <Box sx={{ p: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2,1fr)" } }}>
              <TextField
                fullWidth size="small" label="Título do lote *"
                value={lot.title}
                onChange={(e) => updateLot(i, { title: e.target.value })}
                sx={{ gridColumn: { sm: "1 / -1" } }}
              />
              <TextField
                fullWidth size="small" label="Valor de referência *"
                value={lot.startingPrice}
                onChange={(e) => updateLot(i, { startingPrice: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
              />
              <TextField
                fullWidth size="small" label="Decremento mínimo"
                value={lot.minIncrement}
                onChange={(e) => updateLot(i, { minIncrement: e.target.value })}
                InputProps={{ startAdornment: <InputAdornment position="start">R$</InputAdornment> }}
                placeholder="Ex: 0.01"
              />
              <TextField
                fullWidth size="small" label="Quantidade"
                value={lot.quantity}
                onChange={(e) => updateLot(i, { quantity: e.target.value })}
                type="number"
              />
              <TextField
                fullWidth size="small" label="Unidade"
                value={lot.unit}
                onChange={(e) => updateLot(i, { unit: e.target.value })}
                placeholder="UN, KG, M, etc."
              />
              <TextField
                fullWidth size="small" label="Descrição do objeto"
                value={lot.description}
                onChange={(e) => updateLot(i, { description: e.target.value })}
                sx={{ gridColumn: { sm: "1 / -1" } }}
                multiline rows={2}
              />
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

// ─── Step 3: Review & Publish ─────────────────────────────────────────────────

function PublicacaoStep({
  data,
  lots,
}: {
  data: Record<string, string | boolean>;
  lots: LotForm[];
}) {
  const modality = MODALITIES.find((m) => m.value === data.modality);
  const judgment = JUDGMENT_CRITERIA.find((j) => j.value === data.judgmentCriteria);
  const dispute = DISPUTE_MODES.find((d) => d.value === data.disputeMode);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Publicação</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Revise os dados e publique o processo. Após a publicação, será enviado ao PNCP (Portal Nacional de Contratações Públicas).
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Processo</Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Modalidade</Typography>
                  <Chip label={modality?.label ?? data.modality} size="small" color="primary" sx={{ fontSize: 10 }} />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Critério</Typography>
                  <Typography variant="caption" fontWeight={600}>{judgment?.label ?? data.judgmentCriteria}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="caption" color="text.secondary">Modo de Disputa</Typography>
                  <Typography variant="caption" fontWeight={600}>{dispute?.label ?? data.disputeMode}</Typography>
                </Box>
                {data.processNumber && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">Nº Processo</Typography>
                    <Typography variant="caption" fontWeight={600}>{data.processNumber}</Typography>
                  </Box>
                )}
                {data.estimatedValue && (
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="text.secondary">Valor Estimado</Typography>
                    <Typography variant="caption" fontWeight={600} color="success.main">R$ {data.estimatedValue}</Typography>
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
            <CardContent>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Lotes ({lots.length})
              </Typography>
              {lots.map((l, i) => (
                <Box key={l.id} sx={{ display: "flex", justifyContent: "space-between", py: 0.5, borderBottom: i < lots.length - 1 ? "1px solid" : "none", borderColor: "divider" }}>
                  <Typography variant="caption">Lote {i + 1}: {l.title || "(sem título)"}</Typography>
                  <Typography variant="caption" fontWeight={600} color="success.main">R$ {l.startingPrice || "0"}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity="info" sx={{ mt: 2 }}>
        Após publicar, o processo ficará visível para todos os fornecedores cadastrados na plataforma e será enviado ao PNCP.
      </Alert>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CriarPregaoPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string | boolean>>({ modality: "PREGAO", judgmentCriteria: "MENOR_PRECO", disputeMode: "OPEN" });
  const [lots, setLots] = useState<LotForm[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canProceed0 = !!(data.title && data.modality && data.endsAt);
  const canProceed1 = lots.length > 0 && lots.every((l) => l.title && l.startingPrice);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      // Create auction
      const auctionRes = await fetch("/api/auctions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          modality: data.modality,
          processNumber: data.processNumber,
          editalNumber: data.editalNumber,
          estimatedValue: data.estimatedValue,
          judgmentCriteria: data.judgmentCriteria,
          disputeMode: data.disputeMode,
          phaseInversionEnabled: data.phaseInversionEnabled,
          hiddenValue: data.hiddenValue,
        }),
      });
      if (!auctionRes.ok) throw new Error("Erro ao criar processo.");
      const auction = await auctionRes.json() as { id: string };

      // Create lots
      for (const lot of lots) {
        const lotRes = await fetch(`/api/auctions/${auction.id}/lots`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: lot.title,
            description: lot.description,
            startingPrice: lot.startingPrice,
            minIncrement: lot.minIncrement || "0.01",
          }),
        });
        if (!lotRes.ok) throw new Error("Erro ao criar lote.");
      }

      // Open / schedule
      const openRes = await fetch(`/api/auctions/${auction.id}/open`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endsAt: data.endsAt,
          startsAt: data.startsAt,
        }),
      });
      if (!openRes.ok) throw new Error("Erro ao publicar processo.");

      navigate(`/pregoes/${auction.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao criar processo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} size="small" sx={{ mb: 1, color: "text.secondary" }}>
          Voltar
        </Button>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GavelIcon sx={{ color: "#2c3f31", fontSize: 22 }} />
          <Typography variant="h6" fontWeight={700}>Novo Processo Licitatório</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">Criação de pregão, dispensa ou outra modalidade</Typography>
      </Box>

      {/* Stepper */}
      <Stepper activeStep={step} sx={{ mb: 3 }}>
        {STEPS.map((label) => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      {/* Content */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {step === 0 && <DadosGeraisStep data={data} onChange={setData} />}
          {step === 1 && <LotesStep lots={lots} onChange={setLots} />}
          {step === 2 && <PublicacaoStep data={data} lots={lots} />}
        </CardContent>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Navigation */}
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          variant="outlined"
        >
          Anterior
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            endIcon={<ArrowForwardIcon />}
            onClick={() => setStep((s) => s + 1)}
            variant="contained"
            disabled={step === 0 ? !canProceed0 : step === 1 ? !canProceed1 : false}
          >
            Próximo
          </Button>
        ) : (
          <Button
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <PublishIcon />}
            onClick={() => void handleSubmit()}
            variant="contained"
            color="success"
            disabled={submitting || !canProceed0 || !canProceed1}
          >
            Publicar Processo
          </Button>
        )}
      </Box>
    </Box>
  );
}
