import React from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import { useNavigate } from "react-router-dom";
import {
  cancelAppointment,
  getAppointments,
  getPaymentsSummary,
  markAppointmentPaid,
} from "../api";

function today() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function money(cents) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({ received: 0, pending: 0 });

  async function load() {
    try {
      setLoading(true);
      setError("");
      const currentDate = today();
      const data = await getAppointments({ date: currentDate });
      setAppointments(Array.isArray(data) ? data : data.appointments || []);

      const month = currentDate.slice(0, 7);
      const summaryData = await getPaymentsSummary(month);
      setSummary({
        received: Number(
          summaryData?.received_cents ??
            summaryData?.collected_cents ??
            summaryData?.received ??
            summaryData?.collected ??
            0,
        ),
        pending: Number(
          summaryData?.pending_cents ?? summaryData?.pending ?? 0,
        ),
      });
    } catch (e) {
      setError(
        e.response?.data?.error || "Não foi possível carregar os agendamentos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function pay(id) {
    try {
      setPaying(id);
      await markAppointmentPaid(id, true);
      await load();
    } catch (e) {
      setError(
        e.response?.data?.error || "Não foi possível registrar o pagamento.",
      );
    } finally {
      setPaying(null);
    }
  }

  const handleCancelAppointment = async (id) => {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar este agendamento?",
    );

    if (!confirmed) return;

    try {
      await cancelAppointment(id);

      // Atualiza a lista depois do cancelamento
      await load();
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ||
          "Não foi possível cancelar o agendamento.",
      );
    }
  };

  return (
    <Box>
      <Paper elevation={8} className="dashboard-financial-bar">
        <Box padding={1}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total recebido
            </Typography>
            <Typography variant="h6" fontWeight={800} color="success.main">
              {money(summary.received)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              Total a receber
            </Typography>
            <Typography variant="h6" fontWeight={800} color="warning.dark">
              {money(summary.pending)}
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ sm: "center" }}
        justifyContent="space-between"
        gap={2}
        mb={3}
      >
        <Box marginTop={2}>
          <Typography variant="h4" fontWeight={800}>
            Agenda de hoje
          </Typography>
          <Typography color="text.secondary">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<AddRoundedIcon />}
          onClick={() => navigate("/agendar")}
        >
          Agendar
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box className="center">
          <CircularProgress />
        </Box>
      ) : appointments.length === 0 ? (
        <Paper className="empty-card" elevation={0}>
          <Typography variant="h6" fontWeight={700}>
            Nenhum agendamento hoje
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Clique em "Agendar" para adicionar um atendimento.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {appointments.map((item) => (
            <AppointmentItem
              key={item.id}
              item={item}
              paying={paying === item.id}
              onPay={pay}
              onCancel={handleCancelAppointment}
            />
          ))}
        </Stack>
      )}
    </Box>
  );
}

function AppointmentItem({ item, paying, onPay, onCancel }) {
  const clientName = item.client?.name || item.client_name || "Cliente";
  const isPackage = item.is_package === true;
  return (
    <Paper elevation={0} className="appointment-card">
      <Box flex={1} padding={2}>
        <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
          <Typography variant="h6" fontWeight={800}>
            {item.start_time?.slice(0, 5)}
          </Typography>
          <Typography fontWeight={700}>{clientName}</Typography>
          {isPackage && <Chip label="Pacote" size="small" />}
          {item.status === "cancelado" && (
            <Chip label="Cancelado" size="small" color="error" />
          )}
        </Stack>
        <Typography color="text.secondary" mt={0.5}>
          {item.address} · {money(item.value_cents)}
        </Typography>
      </Box>
      {item.paid ? (
        <div style={{ padding: '0.5rem' }}>
          <Chip icon={<PaidRoundedIcon />} label="Pago" color="success" />
        </div>
      ) : item.status !== "cancelado" && (
        <div style={{ display: "flex", justifyContent: "flex-end", padding: '0.5rem' }}>
          <Button
            variant="contained"
            color="success"
            disabled={paying}
            startIcon={
              paying ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <PaymentRoundedIcon />
              )
            }
            onClick={() => onPay(item.id)}
          >
            Já pagou
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => onCancel(item.id)}
            disabled={item.status === "cancelado"}
          >
            Cancelar
          </Button>
        </div>
      )}
    </Paper>
  );
}
