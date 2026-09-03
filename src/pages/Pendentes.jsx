import React from "react";
import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import { getAppointments, markAppointmentPaid } from "../api";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

function money(cents) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency", currency: "BRL"
  });
}

export default function Pendentes() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function load() {
    try {
      setLoading(true); setError("");
      const data = await getAppointments({ paid: "false" });
      const list = Array.isArray(data) ? data : data.appointments || [];
      setItems(list.filter((item) => item.status !== "cancelado" && !item.paid));
      setTotal(list.reduce((sum, item) => sum + Number(item.value_cents || 0), 0));
    } catch (e) {
      setError(e.response?.data?.error || "Não foi possível carregar os pagamentos pendentes.");
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function pay(id) {
    try {
      setPaying(id);
      await markAppointmentPaid(id, true);
      await load();
    } catch (e) {
      setError(e.response?.data?.error || "Não foi possível registrar o pagamento.");
    } finally { setPaying(null); }
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 1 }}
      >
        Voltar
      </Button>
      <Typography variant="h4" fontWeight={800}>Pagamentos pendentes</Typography>
      <Typography color="text.secondary" mb={2}>Todos os agendamentos ainda não pagos.</Typography>

      <Paper elevation={0} className="summary-card">
        <Typography color="text.secondary">Total a receber</Typography>
        <Typography variant="h5" fontWeight={800}>{money(total)}</Typography>
      </Paper>

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {loading ? <Box className="center"><CircularProgress /></Box> :
        items.length === 0 ? (
          <Paper className="empty-card" elevation={0}>
            <PaidRoundedIcon color="success" sx={{ fontSize: 42 }} />
            <Typography variant="h6" fontWeight={700} mt={1}>Nenhum pagamento pendente</Typography>
          </Paper>
        ) : (
          <Stack spacing={1.5} mt={2}>
            {items.map((item) => (
              <Paper key={item.id} elevation={0} className="appointment-card">
                <Box flex={1}>
                  <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                    <Typography variant="h6" fontWeight={800}>
                      {item.start_time?.slice(0, 5)}
                    </Typography>
                    <Typography fontWeight={700}>
                      {item.client?.name || item.client_name || "Cliente"}
                    </Typography>
                    <Chip label={item.appointment_date?.split("-").reverse().join("/")} size="small" />
                  </Stack>
                  <Typography color="text.secondary" mt={0.5}>
                    {item.address} · {money(item.value_cents)}
                  </Typography>
                </Box>
                <Button variant="contained" color="success" disabled={paying === item.id}
                  startIcon={paying === item.id ? <CircularProgress size={18} color="inherit" /> : <PaymentRoundedIcon />}
                  onClick={() => pay(item.id)}>
                  Já pagou
                </Button>
              </Paper>
            ))}
          </Stack>
        )}
    </Box>
  );
}
