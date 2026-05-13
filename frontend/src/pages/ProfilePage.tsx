import React, { useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Snackbar,
  TextField,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import BusinessIcon from "@mui/icons-material/Business";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import SecurityIcon from "@mui/icons-material/Security";
import { useAuth } from "../auth/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCpf(cpf?: string) {
  if (!cpf) return "—";
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatCnpj(cnpj?: string) {
  if (!cnpj) return "—";
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function roleName(role?: string) {
  const m: Record<string, string> = {
    ADMIN: "Administrador",
    AGENCY_MEMBER: "Membro do Órgão",
    AGENCY_MANAGER: "Gestor do Órgão",
    SUPPLIER: "Fornecedor",
    CITIZEN: "Cidadão",
  };
  return m[role ?? ""] ?? role ?? "—";
}

function roleColor(role?: string): "default" | "primary" | "success" | "error" | "warning" {
  const m: Record<string, "default" | "primary" | "success" | "error" | "warning"> = {
    ADMIN: "error",
    AGENCY_MANAGER: "primary",
    AGENCY_MEMBER: "primary",
    SUPPLIER: "success",
    CITIZEN: "default",
  };
  return m[role ?? ""] ?? "default";
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <Box sx={{ color: "primary.main" }}>{icon}</Box>
          <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        </Box>
        <Divider sx={{ mb: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, mb: 1.5, gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 160 }}>
        {label}
      </Typography>
      <Typography variant="body2">{value || "—"}</Typography>
    </Box>
  );
}

// ─── Password Change Form ─────────────────────────────────────────────────────

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next !== confirm) { setError("As senhas não coincidem."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/password", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      if (!res.ok) throw new Error("Senha atual incorreta ou requisitos não atendidos.");
      setSuccess(true); setCurrent(""); setNext(""); setConfirm("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar senha.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Section title="Segurança" icon={<SecurityIcon fontSize="small" />}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Senha atual"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Nova senha"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Confirmar nova senha"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              fullWidth
              size="small"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <Button type="submit" variant="contained" disabled={loading} size="small">
              {loading ? <CircularProgress size={18} color="inherit" /> : "Alterar Senha"}
            </Button>
          </Grid>
        </Grid>
      </Box>
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        message="Senha alterada com sucesso!"
      />
    </Section>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  const sp = user.supplierProfile;
  const ag = user.agency;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <Box maxWidth={720}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
        <Avatar
          sx={{
            width: 64, height: 64,
            bgcolor: "primary.main",
            fontSize: 22, fontWeight: 700,
          }}
        >
          {initials}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight={700}>{user.name}</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
            <Chip label={roleName(user.role)} color={roleColor(user.role)} size="small" />
            {user.onboardingStatus && user.onboardingStatus !== "APPROVED" && (
              <Chip label={user.onboardingStatus} size="small" variant="outlined" />
            )}
          </Box>
        </Box>
      </Box>

      {/* Personal info */}
      <Section title="Dados Pessoais" icon={<PersonIcon fontSize="small" />}>
        <InfoRow label="Nome completo" value={user.name} />
        <InfoRow label="E-mail" value={user.email} />
        <InfoRow label="CPF" value={formatCpf(user.cpfNormalized ?? user.cpf)} />
        <InfoRow label="Telefone" value={user.phone} />
        <InfoRow label="Provedor de login" value={user.authProvider} />
        {user.govBrLevel && <InfoRow label="Nível gov.br" value={user.govBrLevel} />}
      </Section>

      {/* Permissions */}
      {user.permissions && user.permissions.length > 0 && (
        <Section title="Permissões" icon={<SecurityIcon fontSize="small" />}>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {user.permissions.map((p) => (
              <Chip key={p} label={p} size="small" variant="outlined" />
            ))}
          </Box>
        </Section>
      )}

      {/* Agency info */}
      {ag && (
        <Section title="Órgão" icon={<AccountBalanceIcon fontSize="small" />}>
          <InfoRow label="Nome" value={ag.name} />
          <InfoRow label="Nome oficial" value={ag.officialName} />
          <InfoRow label="CNPJ" value={formatCnpj(ag.cnpj)} />
          <InfoRow label="Código" value={ag.code} />
          <InfoRow label="Município / UF" value={ag.city && ag.state ? `${ag.city} / ${ag.state}` : ag.city ?? ag.state} />
          <InfoRow label="Esfera" value={ag.sphere} />
          <InfoRow label="Tipo" value={ag.entityType} />
          <InfoRow label="Marco legal" value={ag.legalFramework} />
        </Section>
      )}

      {/* Supplier profile */}
      {sp && (
        <Section title="Empresa (Fornecedor)" icon={<BusinessIcon fontSize="small" />}>
          <InfoRow label="Razão social" value={sp.companyName} />
          <InfoRow label="Nome fantasia" value={sp.tradeName} />
          <InfoRow label="CNPJ" value={formatCnpj(sp.cnpj)} />
          <InfoRow label="Tipo de entidade" value={sp.entityType} />
          <InfoRow label="Regime tributário" value={sp.taxRegime} />
          <Divider sx={{ my: 1.5 }} />
          <InfoRow label="Endereço" value={[sp.street, sp.number].filter(Boolean).join(", ")} />
          <InfoRow label="Bairro" value={sp.district} />
          <InfoRow label="Município / UF" value={sp.city && sp.state ? `${sp.city} / ${sp.state}` : sp.city ?? sp.state} />
          <InfoRow label="CEP" value={sp.postalCode} />
          <Divider sx={{ my: 1.5 }} />
          <InfoRow label="Banco" value={sp.bankName} />
          <InfoRow label="Agência" value={sp.bankBranch} />
          <InfoRow label="Tipo de conta" value={sp.bankAccountType} />
          <InfoRow label="Chave Pix" value={sp.pixKey} />
          <Divider sx={{ my: 1.5 }} />
          <InfoRow label="E-mail financeiro" value={sp.financeEmail} />
          <InfoRow label="Telefone financeiro" value={sp.financePhone} />
          {sp.segments && sp.segments.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
                Segmentos
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                {sp.segments.map((s) => (
                  <Chip key={s} label={s} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          )}
        </Section>
      )}

      {/* Password change */}
      <PasswordSection />
    </Box>
  );
}
