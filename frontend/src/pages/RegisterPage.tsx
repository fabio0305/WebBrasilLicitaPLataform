import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  TextField,
  Typography,
} from "@mui/material";
import { authApi } from "../api/client";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    cpf: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await authApi.register({
        name: form.name,
        email: form.email,
        cpf: form.cpf || undefined,
        phone: form.phone || undefined,
        password: form.password,
      });
      setRegisteredEmail(form.email);
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, mb: 6 }}>
        <Box sx={{ p: 4, bgcolor: "white", borderRadius: 2, boxShadow: 2, textAlign: "center" }}>
          <Box sx={{ fontSize: 56, mb: 2 }}>⏳</Box>
          <Typography variant="h5" fontWeight={700} mb={1}>
            Cadastro enviado com sucesso!
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Seu cadastro foi recebido e está sendo <strong>analisado</strong> pela nossa equipe.
          </Typography>
          <Box
            sx={{
              bgcolor: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: 2,
              p: 2,
              mb: 3,
              textAlign: "left",
            }}
          >
            <Typography variant="body2" color="#92400e">
              Assim que sua conta for <strong>aprovada</strong>, você receberá uma notificação no
              e-mail: <strong>{registeredEmail}</strong>
            </Typography>
          </Box>
          <Button variant="contained" onClick={() => navigate("/login")} fullWidth>
            Ir para o Login
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 6, mb: 6 }}>
      <Box sx={{ p: 4, bgcolor: "white", borderRadius: 2, boxShadow: 2 }}>
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: "primary.main",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "white", fontSize: 18 }}>🏛</span>
          </Box>
          <Box component="span" sx={{ fontWeight: 700, fontSize: 16 }}>
            Licita Brasil Web
          </Box>
        </Box>

        <Typography variant="h6" fontWeight={700} mb={0.5}>
          Criar conta
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Cadastre-se como cidadão para acompanhar licitações públicas.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nome completo"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            size="small"
            fullWidth
            autoComplete="name"
          />
          <TextField
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            size="small"
            fullWidth
            autoComplete="email"
          />
          <TextField
            label="CPF"
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
            size="small"
            fullWidth
            placeholder="000.000.000-00"
            inputProps={{ maxLength: 14 }}
          />
          <TextField
            label="Telefone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            size="small"
            fullWidth
            placeholder="(00) 00000-0000"
          />
          <TextField
            label="Senha"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            size="small"
            fullWidth
            autoComplete="new-password"
            helperText="Mínimo de 6 caracteres"
          />
          <TextField
            label="Confirmar senha"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            size="small"
            fullWidth
            autoComplete="new-password"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{ mt: 1, py: 1.2 }}
          >
            {loading ? <CircularProgress size={22} color="inherit" /> : "Criar conta"}
          </Button>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Já tem uma conta?{" "}
              <Link to="/login" style={{ color: "#2c3f31", fontWeight: 600, textDecoration: "none" }}>
                Entrar
              </Link>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Container>
  );
}
