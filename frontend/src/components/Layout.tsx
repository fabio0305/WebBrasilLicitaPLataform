import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  Drawer,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GavelIcon from "@mui/icons-material/Gavel";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SearchIcon from "@mui/icons-material/Search";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import StoreIcon from "@mui/icons-material/Store";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import BusinessIcon from "@mui/icons-material/Business";
import GroupIcon from "@mui/icons-material/Group";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CheckIcon from "@mui/icons-material/Check";
import FolderIcon from "@mui/icons-material/Folder";
import BarChartIcon from "@mui/icons-material/BarChart";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ApiIcon from "@mui/icons-material/Api";
import { useAuth } from "../auth/AuthContext";
import { useProfile } from "../auth/ProfileContext";
import { notificationsApi } from "../api/client";
import type { PlatformNotification } from "../data/types";

const DRAWER_WIDTH = 240;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  sectionLabel?: string;
}

const baseNavItems: NavItem[] = [
  { label: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { label: "Pregões", icon: <GavelIcon />, path: "/pregoes" },
  { label: "Meu Perfil", icon: <PersonIcon />, path: "/profile" },
];

const agencyNavItems: NavItem[] = [
  { label: "Painel do Órgão", icon: <DashboardIcon />, path: "/orgao" },
  { label: "Meus Pregões", icon: <GavelIcon />, path: "/orgao/pregoes", sectionLabel: "Licitações" },
  { label: "Criar Pregão", icon: <AddCircleIcon />, path: "/pregoes/novo" },
  { label: "Banco de Preços", icon: <BarChartIcon />, path: "/banco-de-precos" },
  { label: "Contratos", icon: <AssignmentTurnedInIcon />, path: "/orgao/contratos", sectionLabel: "Gestão" },
  { label: "Equipe", icon: <GroupIcon />, path: "/orgao/equipe" },
  { label: "Integrações", icon: <ApiIcon />, path: "/orgao/integracoes", sectionLabel: "Consultas" },
  { label: "Dados da Organização", icon: <BusinessIcon />, path: "/orgao/organizacao", sectionLabel: "Cadastro" },
  { label: "Documentos", icon: <DescriptionIcon />, path: "/orgao/documentos" },
  { label: "Contratos e Atas", icon: <AssignmentTurnedInIcon />, path: "/orgao/contratos-atas" },
  { label: "Declarações", icon: <GavelIcon />, path: "/orgao/declaracoes" },
  { label: "Meu Perfil", icon: <PersonIcon />, path: "/profile", sectionLabel: "Conta" },
];

const citizenNavItems: NavItem[] = [
  { label: "Painel Cidadão", icon: <DashboardIcon />, path: "/dashboard" },
  { label: "Buscar Licitações", icon: <SearchIcon />, path: "/pregoes" },
  { label: "Órgãos Públicos", icon: <AccountBalanceIcon />, path: "/orgaos" },
  { label: "Denúncias", icon: <ReportProblemIcon />, path: "/denuncias" },
  { label: "Meu Perfil", icon: <PersonIcon />, path: "/profile" },
  { label: "Cadastrar Fornecedor", icon: <StoreIcon />, path: "/fornecedor/cadastro", sectionLabel: "Minha Empresa" },
  { label: "Cadastrar Organização", icon: <CorporateFareIcon />, path: "/organizacao/cadastro" },
];

const supplierNavItems: NavItem[] = [
  { label: "Painel do Fornecedor", icon: <DashboardIcon />, path: "/fornecedor" },
  { label: "Buscar Licitações", icon: <GavelIcon />, path: "/pregoes", sectionLabel: "Licitações" },
  { label: "Minhas Propostas", icon: <HowToVoteIcon />, path: "/fornecedor/propostas" },
  { label: "Meus Contratos", icon: <AssignmentTurnedInIcon />, path: "/fornecedor/contratos" },
  { label: "Banco de Preços", icon: <BarChartIcon />, path: "/banco-de-precos" },
  { label: "Certidões e Docs", icon: <DescriptionIcon />, path: "/fornecedor/documentos", sectionLabel: "Minha Empresa" },
  { label: "Minha Biblioteca", icon: <FolderIcon />, path: "/fornecedor/biblioteca" },
  { label: "Dados da Empresa", icon: <BusinessIcon />, path: "/fornecedor/empresa" },
  { label: "Usuários", icon: <GroupIcon />, path: "/fornecedor/usuarios" },
  { label: "Meu Perfil", icon: <PersonIcon />, path: "/profile" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { activeProfile, canSwitchProfile, switchProfile } = useProfile();
  const location = useLocation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);

  const loadNotifications = useCallback(() => {
    notificationsApi.list().then(setNotifications).catch(() => {});
  }, []);

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  // Count notifications received after last visit to /notifications page
  const lastSeen = localStorage.getItem("lb_notif_last_seen") ?? "";
  const unseenCount = lastSeen
    ? notifications.filter((n) => new Date(n.createdAt) > new Date(lastSeen)).length
    : notifications.length;

  const isAdmin = user?.role === "ADMIN";
  const isAgency = user?.permissions?.includes("agencies.dashboard.read") && Boolean(user?.agency);
  const isSupplier = !isAdmin && !isAgency && user?.permissions?.includes("suppliers.dashboard.read");
  const isCitizen = user?.role === "CITIZEN" || (
    !isAdmin &&
    !isAgency &&
    !user?.permissions?.includes("agencies.dashboard.read") &&
    !user?.permissions?.includes("suppliers.dashboard.read")
  );

  const showingSupplierNav = isSupplier && activeProfile === "supplier";

  const navItems: NavItem[] = isAdmin
    ? [
        ...baseNavItems,
        { label: "Criar Pregão", icon: <AddCircleIcon />, path: "/pregoes/novo" },
        { label: "Banco de Preços", icon: <BarChartIcon />, path: "/banco-de-precos" },
        { label: "Administração", icon: <AdminPanelSettingsIcon />, path: "/admin" },
      ]
    : (isAgency && activeProfile !== "citizen")
    ? agencyNavItems
    : showingSupplierNav
    ? supplierNavItems
    : (isCitizen || isSupplier || (isAgency && activeProfile === "citizen"))
    ? citizenNavItems
    : baseNavItems;

  const handleSwitchProfile = (p: "citizen" | "supplier" | "organization") => {
    switchProfile(p);
    setProfileMenuAnchor(null);
    if (p === "supplier") navigate("/fornecedor", { replace: true });
    else if (p === "organization") navigate("/orgao", { replace: true });
    else navigate("/dashboard", { replace: true });
  };

  const initials = user?.name
    ? user.name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "?";

  const drawer = (
    <Box sx={{ width: DRAWER_WIDTH, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2.5, py: 2.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 36, height: 36, borderRadius: 1.5,
            bgcolor: "primary.main", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <GavelIcon sx={{ color: "white", fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1}>Licita Brasil</Typography>
          <Typography variant="caption" color="text.secondary">Web</Typography>
        </Box>
      </Box>
      <Divider />
      <List sx={{ px: 1, pt: 1, flex: 1 }}>
        {navItems.map((item) => {
          const active = item.path === "/fornecedor"
            ? location.pathname === "/fornecedor"
            : item.path === "/orgao"
            ? location.pathname === "/orgao"
            : location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <React.Fragment key={item.path}>
              {item.sectionLabel && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ px: 1.5, py: 0.5, display: "block", textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10 }}
                  >
                    {item.sectionLabel}
                  </Typography>
                </>
              )}
              <ListItemButton
                component={Link}
                to={item.path}
                onClick={() => setDrawerOpen(false)}
                selected={active}
                sx={{
                  borderRadius: 1.5,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "white",
                    "& .MuiListItemIcon-root": { color: "white" },
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }} />
              </ListItemButton>
            </React.Fragment>
          );
        })}
      </List>
      <Divider />
      <Box sx={{ p: 1.5 }}>
        <ListItemButton
          onClick={logout}
          sx={{ borderRadius: 1.5, color: "error.main" }}
        >
          <ListItemIcon sx={{ minWidth: 36, color: "error.main" }}><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: 14 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#f5f6fa" }}>
      {/* Sidebar desktop */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH, boxSizing: "border-box",
            borderRight: "1px solid", borderColor: "divider",
          },
        }}
        open
      >
        {drawer}
      </Drawer>

      {/* Sidebar mobile */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      {/* Main content */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", ml: { md: `${DRAWER_WIDTH}px` } }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            bgcolor: "white", color: "text.primary",
            borderBottom: "1px solid", borderColor: "divider",
          }}
        >
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
              {navItems.find((i) =>
                i.path === "/fornecedor"
                  ? location.pathname === "/fornecedor"
                  : i.path === "/orgao"
                  ? location.pathname === "/orgao"
                  : location.pathname === i.path || location.pathname.startsWith(i.path + "/")
              )?.label ?? "Licita Brasil"}
            </Typography>

            {/* ── Notification Bell ────────────────────────────────────── */}
            <Tooltip title="Meus Avisos">
              <IconButton
                component={Link}
                to="/notifications"
                size="small"
                sx={{ mr: 1 }}
              >
                <Badge badgeContent={unseenCount > 0 ? unseenCount : undefined} color="error" max={9}>
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </IconButton>
            </Tooltip>

            {/* ── Profile Switcher ─────────────────────────────────────── */}
            {canSwitchProfile && (
              <>
                <Tooltip title="Alternar perfil">
                  <Box
                    onClick={(e) => setProfileMenuAnchor(e.currentTarget as HTMLElement)}
                    sx={{
                      display: "flex", alignItems: "center", gap: 0.75,
                      px: 1.5, py: 0.75, mr: 1.5,
                      borderRadius: 2,
                      border: "1px solid", borderColor: "divider",
                      cursor: "pointer",
                      userSelect: "none",
                      transition: "background 0.15s",
                      "&:hover": { bgcolor: "grey.50" },
                    }}
                  >
                    {activeProfile === "supplier" ? (
                      <StoreIcon sx={{ fontSize: 17, color: "primary.main" }} />
                    ) : activeProfile === "organization" ? (
                      <CorporateFareIcon sx={{ fontSize: 17, color: "warning.main" }} />
                    ) : (
                      <PersonIcon sx={{ fontSize: 17, color: "success.main" }} />
                    )}
                    <Typography variant="body2" fontWeight={600} sx={{ fontSize: 12.5 }}>
                      {activeProfile === "supplier" ? "Fornecedor" : activeProfile === "organization" ? "Organização" : "Cidadão"}
                    </Typography>
                    <SwapHorizIcon sx={{ fontSize: 15, color: "text.disabled" }} />
                  </Box>
                </Tooltip>

                <Menu
                  anchorEl={profileMenuAnchor}
                  open={Boolean(profileMenuAnchor)}
                  onClose={() => setProfileMenuAnchor(null)}
                  transformOrigin={{ horizontal: "right", vertical: "top" }}
                  anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                  PaperProps={{
                    elevation: 3,
                    sx: { mt: 0.75, width: 256, borderRadius: 2, overflow: "hidden" },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.25, borderBottom: "1px solid", borderColor: "divider", bgcolor: "grey.50" }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontSize: 10.5 }}>
                      Alternar Perfil
                    </Typography>
                  </Box>

                  {/* Citizen profile option */}
                  <MenuItem
                    onClick={() => handleSwitchProfile("citizen")}
                    sx={{ py: 1.5, gap: 1.5, alignItems: "flex-start" }}
                  >
                    <Avatar
                      sx={{
                        width: 36, height: 36, flexShrink: 0, mt: 0.25,
                        bgcolor: activeProfile === "citizen" ? "success.main" : "grey.200",
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 20, color: activeProfile === "citizen" ? "white" : "text.secondary" }} />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" fontWeight={600} lineHeight={1.3}>Perfil Cidadão</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.4}>
                        Buscar e acompanhar licitações
                      </Typography>
                    </Box>
                    {activeProfile === "citizen" && (
                      <CheckIcon fontSize="small" sx={{ color: "success.main", mt: 0.5 }} />
                    )}
                  </MenuItem>

                  {/* Supplier profile option — only for supplier users */}
                  {isSupplier && (
                    <MenuItem
                      onClick={() => handleSwitchProfile("supplier")}
                      sx={{ py: 1.5, gap: 1.5, alignItems: "flex-start" }}
                    >
                      <Avatar
                        sx={{
                          width: 36, height: 36, flexShrink: 0, mt: 0.25,
                          bgcolor: activeProfile === "supplier" ? "primary.main" : "grey.200",
                        }}
                      >
                        <StoreIcon sx={{ fontSize: 20, color: activeProfile === "supplier" ? "white" : "text.secondary" }} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} lineHeight={1.3}>Perfil Fornecedor</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.4}>
                          Gerenciar empresa e propostas
                        </Typography>
                      </Box>
                      {activeProfile === "supplier" && (
                        <CheckIcon fontSize="small" sx={{ color: "primary.main", mt: 0.5 }} />
                      )}
                    </MenuItem>
                  )}

                  {/* Organization profile option — only for agency users */}
                  {isAgency && (
                    <MenuItem
                      onClick={() => handleSwitchProfile("organization")}
                      sx={{ py: 1.5, gap: 1.5, alignItems: "flex-start" }}
                    >
                      <Avatar
                        sx={{
                          width: 36, height: 36, flexShrink: 0, mt: 0.25,
                          bgcolor: activeProfile === "organization" ? "warning.main" : "grey.200",
                        }}
                      >
                        <CorporateFareIcon sx={{ fontSize: 20, color: activeProfile === "organization" ? "white" : "text.secondary" }} />
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} lineHeight={1.3}>Perfil Organização</Typography>
                        <Typography variant="caption" color="text.secondary" display="block" lineHeight={1.4}>
                          Gerenciar órgão e licitações
                        </Typography>
                      </Box>
                      {activeProfile === "organization" && (
                        <CheckIcon fontSize="small" sx={{ color: "warning.main", mt: 0.5 }} />
                      )}
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}

            {/* ── User avatar menu ─────────────────────────────────────── */}
            <Tooltip title={user?.name ?? ""}>
              <IconButton onClick={(e) => setMenuAnchor(e.currentTarget)} size="small">
                <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: 13 }}>
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu
              anchorEl={menuAnchor}
              open={Boolean(menuAnchor)}
              onClose={() => setMenuAnchor(null)}
              transformOrigin={{ horizontal: "right", vertical: "top" }}
              anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
            >
              <MenuItem
                component={Link}
                to="/profile"
                onClick={() => setMenuAnchor(null)}
              >
                <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                Meu Perfil
              </MenuItem>
              <Divider />
              <MenuItem
                onClick={() => { setMenuAnchor(null); void logout(); }}
                sx={{ color: "error.main" }}
              >
                <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                Sair
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, p: { xs: 2, md: 3 } }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
