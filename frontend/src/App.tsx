import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { ThemeProvider, createTheme, CssBaseline, Box, CircularProgress, Container, Alert, Chip, Typography } from "@mui/material";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProfileProvider } from "./auth/ProfileContext";
import Layout from "./components/Layout";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import { auctionsApi, authApi, publicApi } from "./api/client";
import type { Auction, AuthUser } from "./data/types";
import CitizenDashboardPage from "./pages/CitizenDashboardPage";
import OrganDashboardPage from "./pages/OrganDashboardPage";
import OrganMeusPregaoPage from "./pages/OrganMeusPregaoPage";
import OrganContratosPage from "./pages/OrganContratosPage";
import OrganEquipePage from "./pages/OrganEquipePage";
import OrganIntegracoesPage from "./pages/OrganIntegracoesPage";
import OrganOrganizacaoPage from "./pages/OrganOrganizacaoPage";
import OrganDocumentosPage from "./pages/OrganDocumentosPage";
import OrganContratosAtasPage from "./pages/OrganContratosAtasPage";
import OrganDeclaracoesPage from "./pages/OrganDeclaracoesPage";
import SupplierRegistrationPage from "./pages/SupplierRegistrationPage";
import PregaoDetailPage from "./pages/PregaoDetailPage";
import SupplierDashboardPage from "./pages/SupplierDashboardPage";
import SupplierDocumentsPage from "./pages/SupplierDocumentsPage";
import SupplierProposalsPage from "./pages/SupplierProposalsPage";
import SupplierContractsPage from "./pages/SupplierContractsPage";
import SupplierCompanyPage from "./pages/SupplierCompanyPage";
import SupplierUsersPage from "./pages/SupplierUsersPage";
import NotificationsPage from "./pages/NotificationsPage";
import OrganizacaoCadastroPage from "./pages/OrganizacaoCadastroPage";
import SalaDeDisputaPage from "./pages/SalaDeDisputaPage";
import PropostaPage from "./pages/PropostaPage";
import SolicitacoesPage from "./pages/SolicitacoesPage";
import CriarPregaoPage from "./pages/CriarPregaoPage";
import MinhasBibliotecaPage from "./pages/MinhasBibliotecaPage";
import BancoDePrecoPage from "./pages/BancoDePrecoPage";
import RegisterPage from "./pages/RegisterPage";
import ContatoPage from "./pages/ContatoPage";

const theme = createTheme({
  palette: {
    primary: { main: "#2c3f31" },
    secondary: { main: "#4caf50" },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiCard: { defaultProps: { elevation: 0 } },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
});

// ─── Pending Approval Screen ──────────────────────────────────────────────────

function PendingApprovalScreen() {
  const { user, logout } = useAuth();
  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Box sx={{ p: 4, bgcolor: "white", borderRadius: 2, boxShadow: 2, textAlign: "center" }}>
        <Box sx={{ fontSize: 52, mb: 2 }}>⏳</Box>
        <Box component="h2" sx={{ fontWeight: 700, fontSize: 22, mb: 1 }}>
          Conta aguardando aprovação
        </Box>
        <Box sx={{ color: "text.secondary", mb: 2 }}>
          Olá, <strong>{user?.name}</strong>! Sua conta foi criada com sucesso e está aguardando
          aprovação pelo administrador da plataforma.
        </Box>
        <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
          Assim que o administrador aprovar seu cadastro, você poderá acessar a plataforma
          normalmente. Em caso de dúvidas, entre em contato com o suporte.
        </Alert>
        <Box
          component="button"
          onClick={logout}
          sx={{
            px: 3, py: 1.2, bgcolor: "primary.main", color: "white",
            border: "none", borderRadius: 1.5, fontSize: 15,
            cursor: "pointer", "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          Sair
        </Box>
      </Box>
    </Container>
  );
}

// ─── Rejected Screen ──────────────────────────────────────────────────────────

function RejectedScreen() {
  const { logout } = useAuth();
  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Box sx={{ p: 4, bgcolor: "white", borderRadius: 2, boxShadow: 2, textAlign: "center" }}>
        <Box sx={{ fontSize: 52, mb: 2 }}>❌</Box>
        <Box component="h2" sx={{ fontWeight: 700, fontSize: 22, mb: 1 }}>
          Cadastro não aprovado
        </Box>
        <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
          Seu cadastro foi revisado e não foi aprovado pelo administrador da plataforma.
          Entre em contato com o suporte para mais informações.
        </Alert>
        <Box
          component="button"
          onClick={logout}
          sx={{
            px: 3, py: 1.2, bgcolor: "primary.main", color: "white",
            border: "none", borderRadius: 1.5, fontSize: 15,
            cursor: "pointer", "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          Sair
        </Box>
      </Box>
    </Container>
  );
}

// ─── Login Page ───────────────────────────────────────────────────────────────

function LoginPage() {
  const { setUser } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPendingApproval(false);
    try {
      const user = await authApi.login(identifier, password);
      setUser(user);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("ACCOUNT_PENDING_APPROVAL")) {
        setPendingApproval(true);
      } else if (msg.includes("ACCOUNT_REJECTED")) {
        setError("Seu cadastro não foi aprovado pelo administrador. Entre em contato com o suporte.");
      } else {
        setError("Credenciais inválidas.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 10 }}>
      <Box sx={{ p: 4, bgcolor: "white", borderRadius: 2, boxShadow: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: "primary.main", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "white", fontSize: 18 }}>🏛</span>
          </Box>
          <Box>
            <Box component="span" sx={{ fontWeight: 700, fontSize: 16 }}>Licita Brasil Web</Box>
          </Box>
        </Box>
        {pendingApproval ? (
          <Box sx={{ textAlign: "center", py: 1 }}>
            <Box sx={{ fontSize: 40, mb: 1.5 }}>⏳</Box>
            <Alert severity="info" sx={{ mb: 2, textAlign: "left" }}>
              Sua conta está <strong>aguardando aprovação</strong> pelo administrador da plataforma.
              Você será notificado assim que sua conta for ativada.
            </Alert>
            <Box
              component="button"
              type="button"
              onClick={() => setPendingApproval(false)}
              sx={{ background: "none", border: "none", color: "primary.main", cursor: "pointer", fontSize: 14, textDecoration: "underline" }}
            >
              Voltar ao login
            </Box>
          </Box>
        ) : (
        <>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <input
              placeholder="E-mail ou CPF"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              style={{ padding: "12px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", outline: "none" }}
              autoComplete="username"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: "12px", fontSize: "16px", borderRadius: "8px", border: "1px solid #ccc", outline: "none" }}
              autoComplete="current-password"
            />
            <Box
              component="button"
              type="submit"
              disabled={loading}
              sx={{
                p: "12px", bgcolor: "primary.main", color: "white",
                border: "none", borderRadius: 1.5, fontSize: 16,
                cursor: loading ? "default" : "pointer",
                display: "flex", justifyContent: "center", alignItems: "center",
                "&:hover": { bgcolor: "primary.dark" },
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Entrar"}
            </Box>
            <Box sx={{ textAlign: "center", fontSize: 14, color: "text.secondary" }}>
              Não tem conta?{" "}
              <Link to="/cadastro" style={{ color: "#2c3f31", fontWeight: 600, textDecoration: "none" }}>
                Criar conta
              </Link>
            </Box>
          </Box>
        </form>
        </>
        )}
      </Box>
    </Container>
  );
}

// ─── Auctions Page ────────────────────────────────────────────────────────────

const statusLabel: Record<string, string> = {
  DRAFT: "Rascunho", SCHEDULED: "Agendado", OPEN: "Em disputa", CLOSED: "Encerrado",
};
const statusColor: Record<string, "default" | "primary" | "success" | "error"> = {
  DRAFT: "default", SCHEDULED: "primary", OPEN: "success", CLOSED: "error",
};

function AuctionsPage() {
  const [auctions, setAuctions] = useState<Auction[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    auctionsApi.list().then(setAuctions).catch(() => setError("Erro ao carregar pregões."));
  }, []);

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {auctions.length === 0 && !error && (
        <Box sx={{ color: "text.secondary", fontSize: 14 }}>Nenhum pregão encontrado.</Box>
      )}
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(320px,1fr))" }}>
        {auctions.map((a) => (
          <Box
            key={a.id}
            sx={{ p: 2.5, bgcolor: "white", borderRadius: 2, border: "1px solid", borderColor: "divider" }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
              <Box sx={{ fontWeight: 700, fontSize: 15, flex: 1, mr: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.title}
              </Box>
              <Chip label={statusLabel[a.status] ?? a.status} color={statusColor[a.status] ?? "default"} size="small" />
            </Box>
            <Box sx={{ fontSize: 13, color: "text.secondary", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {a.description ?? "Sem descrição"}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// ─── Agencias Públicas Page ───────────────────────────────────────────────────

function AgenciasPublicasPage() {
  const [agencies, setAgencies] = useState<{ id: string; name: string; state?: string; city?: string; sphere?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    publicApi
      .agencies()
      .then(setAgencies)
      .catch(() => setError("Erro ao carregar órgãos."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Órgãos públicos cadastrados na plataforma.
      </Alert>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {loading ? (
        <CircularProgress />
      ) : (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(280px,1fr))" }}>
          {agencies.length === 0 && (
            <Box sx={{ color: "text.secondary", fontSize: 14 }}>Nenhum órgão encontrado.</Box>
          )}
          {agencies.map((ag) => (
            <Box
              key={ag.id}
              sx={{ p: 2, bgcolor: "white", borderRadius: 2, border: "1px solid", borderColor: "divider" }}
            >
              <Box sx={{ fontWeight: 700, fontSize: 14, mb: 0.5 }}>{ag.name}</Box>
              {(ag.city || ag.state) && (
                <Box sx={{ fontSize: 12, color: "text.secondary", mb: 0.5 }}>
                  {ag.city}{ag.city && ag.state ? "/" : ""}{ag.state}
                </Box>
              )}
              {ag.sphere && <Chip label={ag.sphere} size="small" color="primary" />}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ─── Protected wrapper ────────────────────────────────────────────────────────

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Block access for non-admin users awaiting or denied approval
  if (user && user.role !== "ADMIN") {
    if (user.onboardingStatus === "PENDING") return <PendingApprovalScreen />;
    if (user.onboardingStatus === "REJECTED") return <RejectedScreen />;
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/cadastro" element={user ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/" element={user
        ? user.permissions?.includes("agencies.dashboard.read") && user.agency
          ? <Navigate to="/orgao" replace />
          : <Navigate to="/dashboard" replace />
        : <LandingPage />}
      />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/contato" element={<ContatoPage />} />

      {/* ── Órgão routes ───────────────────────────────────────────────── */}
      <Route
        path="/orgao"
        element={
          <RequireAuth>
            <Layout><OrganDashboardPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgao/pregoes"
        element={
          <RequireAuth>
            <Layout><OrganMeusPregaoPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgao/contratos"
        element={
          <RequireAuth>
            <Layout><OrganContratosPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgao/equipe"
        element={
          <RequireAuth>
            <Layout><OrganEquipePage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgao/integracoes"
        element={
          <RequireAuth>
            <Layout><OrganIntegracoesPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgao/organizacao"
        element={
          <RequireAuth>
            <Layout><OrganOrganizacaoPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgao/documentos"
        element={
          <RequireAuth>
            <Layout><OrganDocumentosPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgao/contratos-atas"
        element={
          <RequireAuth>
            <Layout><OrganContratosAtasPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgao/declaracoes"
        element={
          <RequireAuth>
            <Layout><OrganDeclaracoesPage /></Layout>
          </RequireAuth>
        }
      />

      {/* Authenticated */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            {user?.permissions?.includes("agencies.dashboard.read") && user?.agency
              ? <Navigate to="/orgao" replace />
              : <Layout><DashboardPage /></Layout>}
          </RequireAuth>
        }
      />
      <Route
        path="/auctions"
        element={
          <RequireAuth>
            <Layout><AuctionsPage /></Layout>
          </RequireAuth>
        }
      />
      {/* Keep "/" for authenticated = pregões list */}
      <Route
        path="/pregoes"
        element={
          <RequireAuth>
            <Layout><AuctionsPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <Layout><ProfilePage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <Layout><AdminDashboardPage /></Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/pregoes/:id"
        element={
          <RequireAuth>
            <Layout><PregaoDetailPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/orgaos"
        element={
          <RequireAuth>
            <Layout><AgenciasPublicasPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/denuncias"
        element={
          <RequireAuth>
            <Layout><CitizenDashboardPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/fornecedor/cadastro"
        element={
          <RequireAuth>
            <Layout><SupplierRegistrationPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/fornecedor"
        element={
          <RequireAuth>
            <Layout><SupplierDashboardPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/fornecedor/documentos"
        element={
          <RequireAuth>
            <Layout><SupplierDocumentsPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/fornecedor/propostas"
        element={
          <RequireAuth>
            <Layout><SupplierProposalsPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/fornecedor/contratos"
        element={
          <RequireAuth>
            <Layout><SupplierContractsPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/fornecedor/empresa"
        element={
          <RequireAuth>
            <Layout><SupplierCompanyPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/fornecedor/usuarios"
        element={
          <RequireAuth>
            <Layout><SupplierUsersPage /></Layout>
          </RequireAuth>
        }
      />
      <Route
        path="/organizacao/cadastro"
        element={
          <RequireAuth>
            <Layout><OrganizacaoCadastroPage /></Layout>
          </RequireAuth>
        }
      />

      <Route
        path="/notifications"
        element={
          <RequireAuth>
            <Layout><NotificationsPage /></Layout>
          </RequireAuth>
        }
      />

      {/* ── Sala de Disputa ── */}
      <Route
        path="/pregoes/:id/disputa"
        element={
          <RequireAuth>
            <Layout><SalaDeDisputaPage /></Layout>
          </RequireAuth>
        }
      />

      {/* ── Proposta ── */}
      <Route
        path="/pregoes/:id/proposta"
        element={
          <RequireAuth>
            <Layout><PropostaPage /></Layout>
          </RequireAuth>
        }
      />

      {/* ── Solicitações ── */}
      <Route
        path="/pregoes/:id/solicitacoes"
        element={
          <RequireAuth>
            <Layout><SolicitacoesPage /></Layout>
          </RequireAuth>
        }
      />

      {/* ── Criar Pregão ── */}
      <Route
        path="/pregoes/novo"
        element={
          <RequireAuth>
            <Layout><CriarPregaoPage /></Layout>
          </RequireAuth>
        }
      />

      {/* ── Minha Biblioteca ── */}
      <Route
        path="/fornecedor/biblioteca"
        element={
          <RequireAuth>
            <Layout><MinhasBibliotecaPage /></Layout>
          </RequireAuth>
        }
      />

      {/* ── Banco de Preços ── */}
      <Route
        path="/banco-de-precos"
        element={
          <RequireAuth>
            <Layout><BancoDePrecoPage /></Layout>
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <ProfileProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ProfileProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
