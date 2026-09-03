import React from "react";
import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Pendentes from "./pages/Pendentes";
import Agendar from "./pages/Agendar";
import Layout from "./components/Layout";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import { login, register } from "./api";
import TodosAgendamentos from "./pages/TodosAgendamentos";

function LoginPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const isRegister = mode === "register";

  function changeMode(nextMode) {
    setMode(nextMode);
    setMessage(null);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  const handleLogin = async () => {
    try {
      const response = await login(email, password);

      // Salva o token
      localStorage.setItem("auth_token", response.token);

      // Salva os dados do usuário, se retornados pela API
      if (response.user) {
        localStorage.setItem("auth_user", JSON.stringify(response.user));
      }

      // Vai para a tela de agendamentos
      navigate("/");
    } catch (error) {
      console.error(error);
      setError(error.response?.data?.message || "E-mail ou senha inválidos.");
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);

    if (isRegister && form.name.trim().length < 2) {
      setMessage({ severity: "error", text: "Informe seu nome." });
      return;
    }
    if (!form.email.trim()) {
      setMessage({ severity: "error", text: "Informe seu e-mail." });
      return;
    }
    if (form.password.length < 6) {
      setMessage({
        severity: "error",
        text: "A senha deve possuir pelo menos 6 caracteres.",
      });
      return;
    }

    try {
      setLoading(true);
      const data = isRegister
        ? await register(form.name.trim(), form.email.trim(), form.password)
        : await handleLogin();

      localStorage.setItem("auth_token", data.token);
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      setMessage({
        severity: "success",
        text: isRegister
          ? "Cadastro realizado com sucesso!"
          : "Login realizado com sucesso!",
      });
      console.log("Autenticado:", data);
    } catch (error) {
      setMessage({
        severity: "error",
        text:
          error.response?.data?.error ||
          error.response?.data?.message ||
          "Não foi possível realizar a operação.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box className="page">
      <Paper elevation={0} className="login-card">
        <Box className="brand">
          <Box className="brand-icon">A</Box>
          <Typography variant="h5" fontWeight={800}>
            Agendamentos
          </Typography>
          <Typography color="text.secondary" mt={0.5}>
            {isRegister
              ? "Crie sua conta para começar"
              : "Entre para gerenciar seus agendamentos"}
          </Typography>
        </Box>

        <Stack direction="row" spacing={1} className="mode-buttons">
          <Button
            fullWidth
            variant={mode === "login" ? "contained" : "outlined"}
            startIcon={<LoginRoundedIcon />}
            onClick={() => changeMode("login")}
          >
            Login
          </Button>
          <Button
            fullWidth
            variant={mode === "register" ? "contained" : "outlined"}
            startIcon={<PersonAddAlt1RoundedIcon />}
            onClick={() => changeMode("register")}
          >
            Registrar
          </Button>
        </Stack>

        {message && (
          <Alert severity={message.severity} sx={{ mt: 2 }}>
            {message.text}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} mt={3}>
          <Stack spacing={2}>
            {isRegister && (
              <TextField
                label="Nome"
                name="name"
                value={form.name}
                onChange={handleChange}
                autoComplete="name"
                fullWidth
                required
              />
            )}
            <TextField
              label="E-mail"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              fullWidth
              required
            />
            <TextField
              label="Senha"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              autoComplete={isRegister ? "new-password" : "current-password"}
              fullWidth
              required
              helperText="Mínimo de 6 caracteres"
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ py: 1.4, fontWeight: 700 }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : isRegister ? (
                "Criar conta"
              ) : (
                "Entrar"
              )}
            </Button>
          </Stack>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          display="block"
          mt={3}
        >
          Conexão segura com a API de agendamentos
        </Typography>
      </Paper>
    </Box>
  );
}

function PrivateRoutes() {
  const token = localStorage.getItem("auth_token");
  if (!token) return <Navigate to="/login" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pendentes" element={<Pendentes />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/todos-agendamentos" element={<TodosAgendamentos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default function App() {
  const token = localStorage.getItem("auth_token");
  return (
    <Routes>
      <Route
        path="/login"
        element={token ? <Navigate to="/" replace /> : <LoginPage />}
      />
      <Route path="/*" element={<PrivateRoutes />} />
    </Routes>
  );
}
