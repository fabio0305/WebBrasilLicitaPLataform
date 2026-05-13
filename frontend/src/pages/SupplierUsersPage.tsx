import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import PersonIcon from "@mui/icons-material/Person";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RefreshIcon from "@mui/icons-material/Refresh";
import GroupIcon from "@mui/icons-material/Group";
import { supplierUsersApi, type SupplierSubUser } from "../api/client";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function avatarColor(name: string) {
  const colors = ["#2c3f31", "#1976d2", "#9c27b0", "#e65100", "#00695c", "#37474f"];
  return colors[name.charCodeAt(0) % colors.length];
}

function fmtDate(d?: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR");
}

function formatCpf(cpf?: string | null) {
  if (!cpf) return null;
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// ─── Add User Dialog ──────────────────────────────────────────────────────────

function AddUserDialog({
  open,
  onClose,
  onAdded,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (user: SupplierSubUser) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SupplierSubUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [selected, setSelected] = useState<SupplierSubUser | null>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [searched, setSearched] = useState(false);

  const reset = () => {
    setQuery("");
    setResults([]);
    setSelected(null);
    setSearchError("");
    setAddError("");
    setSearched(false);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearchError("");
    setResults([]);
    setSelected(null);
    setSearched(true);
    try {
      const list = await supplierUsersApi.search(query.trim());
      setResults(list);
    } catch {
      setSearchError("Erro ao buscar usuários. Tente novamente.");
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async () => {
    if (!selected) return;
    setAdding(true);
    setAddError("");
    try {
      const created = await supplierUsersApi.add(selected.id);
      onAdded(created);
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("ALREADY_ADDED")) setAddError("Este usuário já foi adicionado.");
      else if (msg.includes("USER_NOT_CITIZEN")) setAddError("Este usuário não está cadastrado como cidadão.");
      else setAddError("Não foi possível adicionar o usuário. Tente novamente.");
    } finally {
      setAdding(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <PersonAddIcon color="primary" />
          <Box>
            <Typography variant="subtitle1" fontWeight={700}>Adicionar Usuário</Typography>
            <Typography variant="caption" color="text.secondary">
              Busque por um cidadão já cadastrado na plataforma
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" icon={<InfoOutlinedIcon />} sx={{ mb: 2 }}>
          Apenas usuários cadastrados como <strong>cidadão</strong> podem ser adicionados. O usuário deve se registrar na plataforma antes.
        </Alert>

        <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
          <TextField
            placeholder="Nome, e-mail ou CPF..."
            fullWidth
            size="small"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSearched(false); }}
            onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: "text.disabled" }} />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            size="small"
            onClick={() => void handleSearch()}
            disabled={searching || query.trim().length < 2}
            sx={{ whiteSpace: "nowrap", px: 2.5 }}
          >
            {searching ? <CircularProgress size={16} color="inherit" /> : "Buscar"}
          </Button>
        </Box>

        {searchError && <Alert severity="error" sx={{ mb: 2 }}>{searchError}</Alert>}
        {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}

        {searched && !searching && (
          results.length === 0 ? (
            <Box sx={{ textAlign: "center", py: 3 }}>
              <PersonIcon sx={{ fontSize: 40, color: "text.disabled", mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Nenhum cidadão encontrado.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                O usuário precisa estar cadastrado como cidadão na plataforma.
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
                {results.length} resultado(s) — clique para selecionar:
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}>
                {results.map((u) => {
                  const isSel = selected?.id === u.id;
                  return (
                    <Box
                      key={u.id}
                      onClick={() => { setSelected(isSel ? null : u); setAddError(""); }}
                      sx={{
                        display: "flex", alignItems: "center", gap: 1.5,
                        p: 1.5, border: "1px solid", borderRadius: 1.5, cursor: "pointer",
                        borderColor: isSel ? "primary.main" : "divider",
                        bgcolor: isSel ? "primary.50" : "transparent",
                        transition: "all 0.12s",
                        "&:hover": { borderColor: "primary.main", bgcolor: isSel ? "primary.50" : "action.hover" },
                      }}
                    >
                      <Avatar sx={{ width: 36, height: 36, bgcolor: avatarColor(u.name), fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {initials(u.name)}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{u.name}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {u.email}
                          {u.cpfNormalized && ` · CPF: ${formatCpf(u.cpfNormalized)}`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5, flexShrink: 0 }}>
                        <Chip label="Cidadão" size="small" />
                        {isSel && <CheckCircleIcon fontSize="small" sx={{ color: "primary.main" }} />}
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} color="inherit">Cancelar</Button>
        <Button
          variant="contained"
          disabled={!selected || adding}
          onClick={() => void handleAdd()}
          startIcon={adding ? <CircularProgress size={16} color="inherit" /> : <PersonAddIcon />}
        >
          {adding ? "Adicionando..." : "Adicionar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Delete Dialog ────────────────────────────────────────────────────────────

function DeleteDialog({
  user,
  onClose,
  onConfirm,
}: {
  user: SupplierSubUser | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try { await onConfirm(); onClose(); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={Boolean(user)} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <WarningAmberIcon color="error" />
          <Typography variant="subtitle1" fontWeight={700}>Remover Usuário</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Tem certeza que deseja remover <strong>{user?.name}</strong> do acesso ao painel do fornecedor?
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          O acesso será revogado imediatamente.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>Cancelar</Button>
        <Button
          variant="contained" color="error"
          disabled={loading}
          onClick={() => void handleConfirm()}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : <DeleteOutlineIcon />}
        >
          {loading ? "Removendo..." : "Remover"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SupplierUsersPage() {
  const [users, setUsers] = useState<SupplierSubUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SupplierSubUser | null>(null);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setUsers(await supplierUsersApi.list());
    } catch {
      setError("Não foi possível carregar os usuários.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleAdded = (u: SupplierSubUser) => {
    setUsers((prev) => [u, ...prev]);
    setToast(`${u.name} adicionado com acesso ao fornecedor.`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await supplierUsersApi.remove(deleteTarget.id);
    setUsers((prev) => prev.filter((u) => u.id !== deleteTarget.id));
    setToast(`${deleteTarget.name} removido com sucesso.`);
  };

  const filtered = users.filter(
    (u) => !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3, flexWrap: "wrap", gap: 1.5 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Usuários do Fornecedor</Typography>
          <Typography variant="body2" color="text.secondary">
            Gerencie quem tem acesso ao painel desta empresa
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setAddOpen(true)}>
          Adicionar Usuário
        </Button>
      </Box>

      <Alert
        severity="info"
        icon={<InfoOutlinedIcon />}
        sx={{ mb: 3 }}
        action={
          <Button size="small" color="info" onClick={() => void load()} startIcon={<RefreshIcon fontSize="small" />}>
            Atualizar
          </Button>
        }
      >
        Somente cidadãos previamente cadastrados na plataforma podem ser adicionados.
      </Alert>

      <TextField
        placeholder="Buscar por nome ou e-mail..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, maxWidth: 420 }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: "text.disabled" }} /></InputAdornment>,
        }}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 8, border: "1px dashed", borderColor: "divider", borderRadius: 2, bgcolor: "grey.50" }}>
          <GroupIcon sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }} />
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
            {search ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 380, mx: "auto" }}>
            {search ? "Tente outro termo." : "Adicione usuários para que possam acessar o painel do fornecedor."}
          </Typography>
          {!search && (
            <Button variant="contained" startIcon={<PersonAddIcon />} onClick={() => setAddOpen(true)}>
              Adicionar Primeiro Usuário
            </Button>
          )}
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto", border: "1px solid", borderColor: "divider", borderRadius: 2, bgcolor: "white" }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "grey.50" }}>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Usuário</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>E-mail</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>CPF</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Adicionado em</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id} hover sx={{ "&:last-child td": { border: 0 } }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ width: 34, height: 34, bgcolor: avatarColor(u.name), fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                        {initials(u.name)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{u.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontSize: 13 }}>{u.email}</Typography></TableCell>
                  <TableCell><Typography variant="body2" sx={{ fontSize: 13 }}>{formatCpf(u.cpfNormalized) ?? "—"}</Typography></TableCell>
                  <TableCell>
                    <Chip label={u.active ? "Ativo" : "Inativo"} size="small" color={u.active ? "success" : "default"} />
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(u.createdAt)}</Typography></TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remover usuário">
                      <IconButton size="small" color="error" onClick={() => setDeleteTarget(u)} sx={{ opacity: 0.7, "&:hover": { opacity: 1 } }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Divider />
          <Box sx={{ px: 2, py: 1.25, bgcolor: "grey.50" }}>
            <Typography variant="caption" color="text.secondary">
              {filtered.length} usuário(s) com acesso ao painel do fornecedor
            </Typography>
          </Box>
        </Box>
      )}

      <AddUserDialog open={addOpen} onClose={() => setAddOpen(false)} onAdded={handleAdded} />

      <DeleteDialog
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
