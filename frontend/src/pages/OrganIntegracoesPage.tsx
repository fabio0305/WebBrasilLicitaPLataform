import React, { useEffect, useState } from "react";
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
  LinearProgress,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from "@mui/material";
import ApiIcon from "@mui/icons-material/Api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import LaunchIcon from "@mui/icons-material/Launch";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import GavelIcon from "@mui/icons-material/Gavel";
import SecurityIcon from "@mui/icons-material/Security";
import PeopleIcon from "@mui/icons-material/People";
import PublicIcon from "@mui/icons-material/Public";
import CodeIcon from "@mui/icons-material/Code";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { organApi } from "../api/client";
import type { Integration, IntegrationStatus } from "../data/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<IntegrationStatus, { label: string; color: "success" | "default" | "warning" | "error"; icon: React.ReactElement }> = {
  active:      { label: "Ativo",       color: "success", icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
  inactive:    { label: "Inativo",     color: "default", icon: <RadioButtonUncheckedIcon sx={{ fontSize: 14 }} /> },
  coming_soon: { label: "Em breve",    color: "warning", icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} /> },
  error:       { label: "Erro",        color: "error",   icon: <ErrorOutlineIcon sx={{ fontSize: 14 }} /> },
};

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode }> = {
  governo:      { label: "Governo Federal",    icon: <AccountBalanceIcon fontSize="small" /> },
  controle:     { label: "Órgãos de Controle", icon: <GavelIcon fontSize="small" /> },
  autenticacao: { label: "Autenticação",       icon: <SecurityIcon fontSize="small" /> },
  fornecedores: { label: "Fornecedores",       icon: <PeopleIcon fontSize="small" /> },
  regional:     { label: "Plataformas Regionais", icon: <PublicIcon fontSize="small" /> },
  desenvolvedor:{ label: "Desenvolvedor",      icon: <CodeIcon fontSize="small" /> },
};

// ─── Integration Card ─────────────────────────────────────────────────────────

function IntegrationCard({ integration }: { integration: Integration }) {
  const status = STATUS_META[integration.status];
  const isActive = integration.status === "active";
  const isSoon = integration.status === "coming_soon";

  const successRate =
    integration.stats && integration.stats.totalJobs > 0
      ? Math.round((integration.stats.succeeded / integration.stats.totalJobs) * 100)
      : null;

  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: isActive ? "success.light" : "divider",
        borderRadius: 2.5,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        transition: "box-shadow 0.2s, border-color 0.2s",
        "&:hover": { boxShadow: isSoon ? 0 : 3 },
        opacity: isSoon ? 0.75 : 1,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Color bar */}
      <Box
        sx={{
          height: 4,
          bgcolor: isActive ? "success.main" : isSoon ? "warning.light" : `${integration.logoColor}60`,
        }}
      />

      <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
        {/* Header */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: 2,
              bgcolor: `${integration.logoColor}18`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <ApiIcon sx={{ color: integration.logoColor, fontSize: 26 }} />
          </Box>
          <Chip
            icon={status.icon}
            label={status.label}
            color={status.color}
            size="small"
            sx={{ fontSize: 11, fontWeight: 700, height: 24 }}
          />
        </Box>

        {/* Name + description */}
        <Box sx={{ flex: 1 }}>
          <Typography variant="subtitle2" fontWeight={800} lineHeight={1.2}>
            {integration.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.3} sx={{ mt: 0.25 }}>
            {integration.fullName}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: 12.5, lineHeight: 1.5 }}>
            {integration.description}
          </Typography>
        </Box>

        {/* Stats (only for active with stats) */}
        {isActive && integration.stats && (
          <>
            <Divider />
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                <Typography variant="caption" color="text.secondary">Taxa de sucesso</Typography>
                <Typography variant="caption" fontWeight={700} color={successRate != null && successRate >= 90 ? "success.main" : "warning.dark"}>
                  {successRate ?? 0}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={successRate ?? 0}
                color={successRate != null && successRate >= 90 ? "success" : "warning"}
                sx={{ height: 6, borderRadius: 3 }}
              />
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Publicações</Typography>
                  <Typography variant="caption" fontWeight={700}>{integration.stats.totalJobs}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Sucesso</Typography>
                  <Typography variant="caption" fontWeight={700} color="success.main">{integration.stats.succeeded}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Pendente</Typography>
                  <Typography variant="caption" fontWeight={700} color="warning.dark">{integration.stats.pending}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">Falha</Typography>
                  <Typography variant="caption" fontWeight={700} color="error.main">{integration.stats.failed}</Typography>
                </Box>
              </Stack>
            </Box>
          </>
        )}

        {/* Footer */}
        <Box sx={{ display: "flex", gap: 1, mt: "auto", pt: 0.5 }}>
          {integration.docsUrl && (
            <Button
              href={integration.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              variant="outlined"
              endIcon={<LaunchIcon sx={{ fontSize: 13 }} />}
              sx={{ fontSize: 11, textTransform: "none", px: 1.25, py: 0.5 }}
            >
              Documentação
            </Button>
          )}
          {isSoon && (
            <Tooltip title="Esta integração está em desenvolvimento e será disponibilizada em breve.">
              <Button
                size="small"
                variant="outlined"
                disabled
                startIcon={<HourglassEmptyIcon sx={{ fontSize: 13 }} />}
                sx={{ fontSize: 11, textTransform: "none", px: 1.25, py: 0.5 }}
              >
                Em breve
              </Button>
            </Tooltip>
          )}
          {isActive && (
            <Chip
              label="Configurado"
              color="success"
              size="small"
              icon={<CheckCircleIcon sx={{ fontSize: 13 }} />}
              sx={{ fontSize: 11, height: 24 }}
            />
          )}
          {integration.status === "inactive" && (
            <Button
              size="small"
              variant="contained"
              sx={{ fontSize: 11, textTransform: "none", px: 1.25, py: 0.5 }}
              onClick={() => alert("Entre em contato com o suporte para configurar esta integração.")}
            >
              Configurar
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({ category, integrations }: { category: string; integrations: Integration[] }) {
  const meta = CATEGORY_META[category] ?? { label: category, icon: <ApiIcon fontSize="small" /> };
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Box sx={{ color: "text.secondary" }}>{meta.icon}</Box>
        <Typography variant="subtitle1" fontWeight={700} color="text.primary">
          {meta.label}
        </Typography>
        <Chip label={integrations.length} size="small" sx={{ height: 20, fontSize: 11 }} />
      </Box>
      <Grid container spacing={2}>
        {integrations.map((it) => (
          <Grid item xs={12} sm={6} md={4} key={it.id}>
            <IntegrationCard integration={it} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ─── Summary Bar ──────────────────────────────────────────────────────────────

function SummaryBar({ integrations }: { integrations: Integration[] }) {
  const active = integrations.filter((i) => i.status === "active").length;
  const soon   = integrations.filter((i) => i.status === "coming_soon").length;
  const total  = integrations.length;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 3,
        flexWrap: "wrap",
        p: 2.5,
        mb: 3,
        bgcolor: "#f8faf9",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Box>
        <Typography variant="h5" fontWeight={800} color="primary.main">{active}</Typography>
        <Typography variant="caption" color="text.secondary" display="block">Ativas</Typography>
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box>
        <Typography variant="h5" fontWeight={800} color="warning.dark">{soon}</Typography>
        <Typography variant="caption" color="text.secondary" display="block">Em breve</Typography>
      </Box>
      <Divider orientation="vertical" flexItem />
      <Box>
        <Typography variant="h5" fontWeight={800}>{total}</Typography>
        <Typography variant="caption" color="text.secondary" display="block">Total disponíveis</Typography>
      </Box>
      <Box sx={{ ml: "auto", display: "flex", alignItems: "center" }}>
        <Alert
          icon={<InfoOutlinedIcon fontSize="small" />}
          severity="info"
          sx={{ py: 0.25, px: 1.25, fontSize: 12, "& .MuiAlert-message": { py: 0.5 } }}
        >
          Para ativar integrações, entre em contato com o suporte ou configure via painel do administrador.
        </Alert>
      </Box>
    </Box>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CATEGORY_ORDER = ["governo", "controle", "autenticacao", "fornecedores", "regional", "desenvolvedor"];

const TAB_ALL = "__all__";

export default function OrganIntegracoesPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<string>(TAB_ALL);

  useEffect(() => {
    organApi
      .integrations()
      .then(setIntegrations)
      .catch(() => setError("Não foi possível carregar as integrações."))
      .finally(() => setLoading(false));
  }, []);

  const categories = CATEGORY_ORDER.filter((c) => integrations.some((i) => i.category === c));

  const filtered = tab === TAB_ALL
    ? integrations
    : integrations.filter((i) => i.category === tab);

  const groupedByCategory: Record<string, Integration[]> = {};
  for (const cat of categories) {
    const items = filtered.filter((i) => i.category === cat);
    if (items.length > 0) groupedByCategory[cat] = items;
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ApiIcon /> Integrações
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Conecte a plataforma a sistemas externos de governo, controle e autenticação
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ textAlign: "center", py: 8 }}>
          <CircularProgress size={36} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Carregando integrações...
          </Typography>
        </Box>
      ) : (
        <>
          <SummaryBar integrations={integrations} />

          {/* Category tabs */}
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              mb: 3,
              borderBottom: "1px solid",
              borderColor: "divider",
              "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 13, minHeight: 44 },
            }}
          >
            <Tab label="Todas" value={TAB_ALL} />
            {categories.map((c) => {
              const meta = CATEGORY_META[c] ?? { label: c };
              const count = integrations.filter((i) => i.category === c).length;
              return (
                <Tab
                  key={c}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                      {meta.label}
                      <Chip label={count} size="small" sx={{ height: 18, fontSize: 10 }} />
                    </Box>
                  }
                  value={c}
                />
              );
            })}
          </Tabs>

          {/* Grouped content */}
          {tab === TAB_ALL ? (
            categories.map((cat) =>
              groupedByCategory[cat] ? (
                <CategorySection key={cat} category={cat} integrations={groupedByCategory[cat]} />
              ) : null
            )
          ) : (
            <Grid container spacing={2}>
              {filtered.map((it) => (
                <Grid item xs={12} sm={6} md={4} key={it.id}>
                  <IntegrationCard integration={it} />
                </Grid>
              ))}
            </Grid>
          )}

          {filtered.length === 0 && (
            <Box sx={{ textAlign: "center", py: 6 }}>
              <ApiIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
              <Typography variant="body1" color="text.secondary">Nenhuma integração nesta categoria.</Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
