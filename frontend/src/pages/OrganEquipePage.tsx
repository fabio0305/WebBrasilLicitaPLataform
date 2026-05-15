import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Alert,
  Avatar,
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
  Grid,
  IconButton,
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
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonRemoveIcon from "@mui/icons-material/PersonRemove";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import GavelIcon from "@mui/icons-material/Gavel";
import { organApi } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import type { AgencyMember } from "../data/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administrador",
  AGENCY_ADMIN: "Adm. do Órgão",
  AGENCY_MEMBER: "Membro do Órgão",
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
  AGENCY_MEMBER: "success",
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

function MemberCard({
  member,
  canRemove,
  onRemove,
  removing,
}: {
  member: AgencyMember;
  canRemove: boolean;
  onRemove: () => void;
  removing: boolean;
}) {
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
          {canRemove && member.role !== "AGENCY_ADMIN" && (
            <Tooltip title="Remover da organização">
              <IconButton
                size="small"
                color="error"
                onClick={onRemove}
                disabled={removing}
                sx={{ flexShrink: 0 }}
              >
                {removing ? <CircularProgress size={16} /> : <PersonRemoveIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
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

// ─── Add Member Dialog ────────────────────────────────────────────────────────

function AddMemberDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (member: AgencyMember) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: string; name: string; email: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setAddError("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 2) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const found = await organApi.searchCitizens(val.trim());
        setResults(found);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleAdd = async (citizenId: string) => {
    setAddingId(citizenId);
    setAddError("");
    try {
      const member = await organApi.addMember(citizenId);
      onAdded(member);
      setQuery("");
      setResults([]);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("USER_NOT_CITIZEN")) {
        setAddError("Este usuário já pertence a uma organização ou não pode ser adicionado.");
      } else {
        setAddError("Não foi possível adicionar o usuário. Tente novamente.");
      }
    } finally {
      setAddingId(null);
    }
  };

  const handleClose = () => {
    setQuery("");
    setResults([]);
    setAddError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>Adicionar Membro</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Busque um usuário cadastrado na plataforma para adicioná-lo à sua organização.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          size="small"
          placeholder="Buscar por nome ou e-mail..."
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                {searching ? <CircularProgress size={16} /> : <SearchIcon fontSize="small" />}
              </InputAdornment>
            ),
          }}
          sx={{ mb: 1.5 }}
        />

        {addError && <Alert severity="error" sx={{ mb: 1.5 }}>{addError}</Alert>}

        {results.length > 0 && (
          <List dense disablePadding sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1, overflow: "hidden" }}>
            {results.map((u, i) => (
              <React.Fragment key={u.id}>
                {i > 0 && <Divider />}
                <ListItem
                  sx={{ py: 1 }}
                  secondaryAction={
                    <Button
                      size="small"
                      variant="contained"
                      disabled={addingId !== null}
                      onClick={() => handleAdd(u.id)}
                      sx={{ minWidth: 80 }}
                    >
                      {addingId === u.id ? <CircularProgress size={14} /> : "Adicionar"}
                    </Button>
                  }
                >
                  <ListItemAvatar sx={{ minWidth: 40 }}>
                    <Avatar sx={{ bgcolor: avatarColor(u.name), width: 32, height: 32, fontSize: 12, fontWeight: 700 }}>
                      {initials(u.name)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={u.name}
                    secondary={u.email}
                    primaryTypographyProps={{ variant: "body2", fontWeight: 600 }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                </ListItem>
              </React.Fragment>
            ))}
          </List>
        )}

        {!searching && query.trim().length >= 2 && results.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: "center", py: 2 }}>
            Nenhum usuário encontrado para "{query}".
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function OrganEquipePage() {
  const { user } = useAuth();
  const canManageTeam = user?.permissions?.includes("agencies.team.manage") ?? false;

  const [members, setMembers] = useState<AgencyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    organApi
      .members()
      .then(setMembers)
      .catch(() => setError("Não foi possível carregar a equipe."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleMemberAdded = (member: AgencyMember) => {
    setMembers((prev) => [member, ...prev]);
  };

  const handleRemove = async (memberId: string) => {
    setRemovingId(memberId);
    setRemoveError("");
    try {
      await organApi.removeMember(memberId);
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
    } catch {
      setRemoveError("Não foi possível remover o membro. Tente novamente.");
    } finally {
      setRemovingId(null);
    }
  };

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
      <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GroupIcon /> Equipe do Órgão
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Usuários vinculados ao seu órgão
          </Typography>
        </Box>
        {canManageTeam && (
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ bgcolor: "#2c3f31", "&:hover": { bgcolor: "#1e2c22" }, flexShrink: 0 }}
          >
            Adicionar Membro
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {removeError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setRemoveError("")}>{removeError}</Alert>}

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
          {members.length === 0 && canManageTeam && (
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              sx={{ mt: 2 }}
              onClick={() => setDialogOpen(true)}
            >
              Adicionar primeiro membro
            </Button>
          )}
        </Box>
      ) : (
        <>
          {/* Card grid */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {filtered.map((member) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={member.id}>
                <MemberCard
                  member={member}
                  canRemove={canManageTeam}
                  onRemove={() => handleRemove(member.id)}
                  removing={removingId === member.id}
                />
              </Grid>
            ))}
          </Grid>

          {/* Compact list */}
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
                      secondaryAction={
                        canManageTeam && m.role !== "AGENCY_ADMIN" ? (
                          <Tooltip title="Remover da organização">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleRemove(m.id)}
                              disabled={removingId === m.id}
                            >
                              {removingId === m.id
                                ? <CircularProgress size={14} />
                                : <PersonRemoveIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        ) : undefined
                      }
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
                      <Box sx={{ display: "flex", gap: 1, flexShrink: 0, alignItems: "center", mr: canManageTeam ? 4 : 0 }}>
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

      <AddMemberDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onAdded={handleMemberAdded}
      />
    </Box>
  );
}
