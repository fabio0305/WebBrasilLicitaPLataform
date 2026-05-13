import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  InputAdornment,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import GroupIcon from "@mui/icons-material/Group";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GavelIcon from "@mui/icons-material/Gavel";
import { organApi } from "../api/client";
import type { AgencyMember } from "../data/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  AGENCY_ADMIN: "Adm. do Órgão",
  AUCTIONEER: "Pregoeiro",
  AUTHORITY: "Autoridade Competente",
  PUBLIC_AGENCY: "Órgão Público",
  SUPPORT: "Suporte",
  SUPPLIER: "Fornecedor",
  CITIZEN: "Cidadão",
};

const ROLE_COLOR: Record<string, "default" | "primary" | "secondary" | "error" | "warning" | "success"> = {
  ADMIN: "error",
  AGENCY_ADMIN: "primary",
  AUCTIONEER: "secondary",
  AUTHORITY: "warning",
  PUBLIC_AGENCY: "primary",
};

function roleAvatar(role: string) {
  switch (role) {
    case "ADMIN": return <AdminPanelSettingsIcon fontSize="small" />;
    case "AUCTIONEER": return <GavelIcon fontSize="small" />;
    default: return <PersonIcon fontSize="small" />;
  }
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function avatarColor(name: string) {
  const colors = ["#2c3f31", "#1565c0", "#7b1fa2", "#c62828", "#00838f", "#558b2f", "#e65100"];
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return colors[Math.abs(hash) % colors.length];
}

function fmtDate(d?: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

// ─── Stat Badge ───────────────────────────────────────────────────────────────

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Box sx={{ textAlign: "center", px: 2, py: 1, bgcolor: `${color}10`, borderRadius: 2, border: `1px solid ${color}30` }}>
      <Typography variant="h5" fontWeight={800} color={color}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
    </Box>
  );
}

// ─── Member Card ──────────────────────────────────────────────────────────────

function MemberCard({ member }: { member: AgencyMember }) {
  const color = avatarColor(member.name);
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 2,
        height: "100%",
        transition: "box-shadow 0.2s",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ bgcolor: color, width: 44, height: 44, fontSize: 16, fontWeight: 700 }}>
            {initials(member.name)}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              fontWeight={700}
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              title={member.name}
            >
              {member.name}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}
              title={member.email}
            >
              {member.email}
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ mb: 1.25 }} />
        <Stack spacing={0.75}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">Perfil</Typography>
            <Chip
              label={ROLE_LABEL[member.role] ?? member.role}
              color={ROLE_COLOR[member.role] ?? "default"}
              size="small"
              icon={roleAvatar(member.role)}
              sx={{ fontSize: 10, height: 20, fontWeight: 600 }}
            />
          </Box>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary">Situação</Typography>
            {member.active ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CheckCircleIcon sx={{ fontSize: 13, color: "success.main" }} />
                <Typography variant="caption" color="success.main" fontWeight={700}>Ativo</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <CancelIcon sx={{ fontSize: 13, color: "error.main" }} />
                <Typography variant="caption" color="error.main" fontWeight={700}>Inativo</Typography>
              </Box>
            )}
          </Box>
          {member.createdAt && (
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="caption" color="text.secondary">Membro desde</Typography>
              <Typography variant="caption" color="text.secondary">{fmtDate(member.createdAt)}</Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganEquipePage() {
  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    organApi
      .members()
      .then(setMembers)
      .catch(() => setError("Não foi possível carregar a equipe."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = members.filter(
    (m) =>
      !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      (ROLE_LABEL[m.role] ?? m.role).toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = members.filter((m) => m.active).length;
  const inactiveCount = members.filter((m) => !m.active).length;
  const roleCount = [...new Set(members.map((m) => m.role))].length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GroupIcon /> Equipe do Órgão
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Usuários vinculados ao seu órgão
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Summary */}
      <Stack direction="row" spacing={1.5} sx={{ mb: 3 }} flexWrap="wrap" useFlexGap>
        <StatBadge label="Total" value={members.length} color="#2c3f31" />
        <StatBadge label="Ativos" value={activeCount} color="#4caf50" />
        <StatBadge label="Inativos" value={inactiveCount} color="#9e9e9e" />
        <StatBadge label="Perfis distintos" value={roleCount} color="#1976d2" />
      </Stack>

      {/* Search */}
      <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ pb: "16px !important" }}>
          <TextField
            size="small"
            placeholder="Buscar por nome, e-mail ou perfil..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            fullWidth
          />
        </CardContent>
      </Card>

      {/* Info notice */}
      <Alert severity="info" sx={{ mb: 3 }}>
        Os membros da equipe são gerenciados pelo administrador do sistema. Para adicionar ou remover membros, entre em contato com o suporte.
      </Alert>

      {/* Content */}
      {loading ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <CircularProgress size={36} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <GroupIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="body1" color="text.secondary" fontWeight={600}>
            {members.length === 0 ? "Nenhum membro cadastrado." : "Nenhum membro encontrado."}
          </Typography>
        </Box>
      ) : (
        <>
          {/* Card grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {filtered.map((member) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
                <MemberCard member={member} />
              </Grid>
            ))}
          </Grid>

          {/* Compact list for mobile / overflow */}
          <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, display: { xs: "none", md: "block" } }}>
            <CardContent sx={{ pb: "0 !important" }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                Lista Completa ({filtered.length})
              </Typography>
              <List disablePadding dense>
                {filtered.map((m, i) => (
                  <React.Fragment key={m.id}>
                    {i > 0 && <Divider />}
                    <ListItem
                      disablePadding
                      sx={{ py: 1, gap: 1 }}
                    >
                      <ListItemAvatar sx={{ minWidth: 40 }}>
                        <Avatar sx={{ bgcolor: avatarColor(m.name), width: 32, height: 32, fontSize: 12, fontWeight: 700 }}>
                          {initials(m.name)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={m.name}
                        secondary={m.email}
                        primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                      <Box sx={{ display: "flex", gap: 1, flexShrink: 0, alignItems: "center" }}>
                        <Chip
                          label={ROLE_LABEL[m.role] ?? m.role}
                          color={ROLE_COLOR[m.role] ?? "default"}
                          size="small"
                          sx={{ fontSize: 10, height: 20 }}
                        />
                        <Tooltip title={m.active ? "Ativo" : "Inativo"}>
                          {m.active
                            ? <CheckCircleIcon sx={{ fontSize: 16, color: "success.main" }} />
                            : <CancelIcon sx={{ fontSize: 16, color: "error.main" }} />}
                        </Tooltip>
                      </Box>
                    </ListItem>
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </>
      )}

      {!loading && filtered.length > 0 && (
        <Typography variant="caption" color="text.disabled" sx={{ mt: 1.5, display: "block", textAlign: "right" }}>
          Exibindo {filtered.length} de {members.length} membros
        </Typography>
      )}
    </Box>
  );
}
