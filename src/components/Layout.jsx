import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AppBar, Box, Button, Container, Toolbar, Typography
} from "@mui/material";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PendingActionsRoundedIcon from "@mui/icons-material/PendingActionsRounded";
import AddCircleOutlineRoundedIcon from "@mui/icons-material/AddCircleOutlineRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("auth_user") || "null");

  function logout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    navigate("/login");
  }

  return (
    <Box minHeight="100vh">
      <AppBar position="static" elevation={0}>
        <Toolbar sx={{ gap: 1, flexWrap: "wrap", py: 1 }}>
          <Typography variant="h6" fontWeight={800} sx={{ mr: "auto" }}>
            Agendamentos
          </Typography>
          <Button color="inherit" startIcon={<EventAvailableRoundedIcon />}
            onClick={() => navigate("/")} variant={location.pathname === "/" ? "outlined" : "text"}>
            Hoje
          </Button>
          <Button color="inherit" startIcon={<PendingActionsRoundedIcon />}
            onClick={() => navigate("/pendentes")}
            variant={location.pathname === "/pendentes" ? "outlined" : "text"}>
            Pendentes
          </Button>
          <Button color="inherit" startIcon={<AddCircleOutlineRoundedIcon />}
            onClick={() => navigate("/todos-agendamentos")}
            variant={location.pathname === "/agendar" ? "outlined" : "text"}>
            Todos agendamentos
          </Button>
          <Button color="inherit" startIcon={<LogoutRoundedIcon />} onClick={logout}>
            Sair
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="md" sx={{ py: { xs: 2, sm: 4 } }}>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Olá, {user?.name || "usuário"}
        </Typography>
        {children}
      </Container>
    </Box>
  );
}
