import React from "react";
import { useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Paper, Stack, Typography
} from "@mui/material";
import PaymentRoundedIcon from "@mui/icons-material/PaymentRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import { getAppointments, markAppointmentPaid, cancelAppointment } from "../api";
import { useNavigate } from "react-router-dom";

function today() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

function formatDate(date) {
  if (!date) return "";
  return date.split("-").reverse().join("/");
}

function formatWeekday(date) {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    weekday: "long"
  });
}

function money(cents) {
  return (Number(cents || 0) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function statusLabel(status) {
  const labels = {
    agendado: "Agendado",
    confirmado: "Confirmado",
    concluido: "Concluído",
    cancelado: "Cancelado"
  };
  return labels[status] || status || "Agendado";
}

function statusColor(status) {
  if (status === "cancelado") return "error";
  if (status === "concluido") return "success";
  if (status === "confirmado") return "info";
  return "default";
}

export default function TodosAgendamentos() {
      const navigate = useNavigate();
    
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState("");
  

  async function load() {
    try {
      setLoading(true);
      setError("");

      // Lista todos os agendamentos de hoje em diante.
      const data = await getAppointments({ from: today() });
      const list = Array.isArray(data) ? data : data.appointments || [];

      setAppointments(list);
    } catch (e) {
      setError(
        e.response?.data?.error ||
        "Não foi possível carregar os agendamentos."
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
      setError("");
      await markAppointmentPaid(id, true);
      await load();
    } catch (e) {
      setError(
        e.response?.data?.error ||
        "Não foi possível registrar o pagamento."
      );
    } finally {
      setPaying(null);
    }
  }

  async function cancel(id) {
    const confirmed = window.confirm(
      "Tem certeza que deseja cancelar este agendamento?"
    );

    if (!confirmed) return;

    try {
      setCancelling(id);
      setError("");
      await cancelAppointment(id);
      await load();
    } catch (e) {
      setError(
        e.response?.data?.error ||
        "Não foi possível cancelar o agendamento."
      );
    } finally {
      setCancelling(null);
    }
  }

  const groupedAppointments = appointments.reduce((groups, item) => {
    const date = item.appointment_date || "sem-data";
    if (!groups[date]) groups[date] = [];
    groups[date].push(item);
    return groups;
  }, {});

  const dates = Object.keys(groupedAppointments).sort();

  return (
    <Box>
        <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 1 }}
      >
        Voltar
      </Button>
      <Box mb={3}>
        <Typography variant="h5" fontWeight={800}>
          Agendamentos de hoje e dos próximos dias
        </Typography>
      </Box>

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
          <EventAvailableRoundedIcon sx={{ fontSize: 42 }} />
          <Typography variant="h6" fontWeight={700} mt={1}>
            Nenhum agendamento a partir de hoje
          </Typography>
          <Typography color="text.secondary" mt={1}>
            Crie um novo agendamento para ele aparecer nesta lista.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {dates.map((date) => (
            <Box key={date}>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{ textTransform: "capitalize", mb: 1.5 }}
              >
                {date === "sem-data"
                  ? "Data não informada"
                  : `${formatDate(date)} — ${formatWeekday(date)}`}
              </Typography>

              <Stack spacing={1.5}>
                {groupedAppointments[date].map((item) => {
                  const clientName = item.client?.name || item.client_name || "Cliente";
                  const isCancelled = item.status === "cancelado";
                  const isPackage = item.is_package === true;

                  return (
                    <Paper key={item.id} style={{margin: '0.5rem', padding: '0.5rem'}} elevation={0} className="appointment-card">
                      <Box flex={1} width="100%">
                        <Stack
                          direction="row"
                          gap={1}
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Typography variant="h6" fontWeight={800}>
                            {item.start_time?.slice(0, 5)}
                          </Typography>

                          <Typography fontWeight={700}>
                            {clientName}
                          </Typography>

                          {isPackage && <Chip label="Pacote" size="small" />}

                          <Chip
                            label={statusLabel(item.status)}
                            size="small"
                            color={statusColor(item.status)}
                          />

                          {item.paid && (
                            <Chip
                              icon={<PaidRoundedIcon />}
                              label="Pago"
                              size="small"
                              color="success"
                            />
                          )}
                        </Stack>

                        <Typography color="text.secondary" mt={0.5}>
                          {item.address} · {money(item.value_cents)}
                        </Typography>
                      </Box>

                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        width={{ xs: "100%", sm: "auto" }}
                      >
                        {!item.paid && !isCancelled && (
                          <Button
                            variant="contained"
                            color="success"
                            disabled={paying === item.id || cancelling === item.id}
                            startIcon={
                              paying === item.id ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <PaymentRoundedIcon />
                              )
                            }
                            onClick={() => pay(item.id)}
                          >
                            Já pagou
                          </Button>
                        )}

                        {!item.paid && !isCancelled && (
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={paying === item.id || cancelling === item.id}
                            startIcon={
                              cancelling === item.id ? (
                                <CircularProgress size={18} color="inherit" />
                              ) : (
                                <CancelRoundedIcon />
                              )
                            }
                            onClick={() => cancel(item.id)}
                          >
                            {cancelling === item.id ? "Cancelando..." : "Cancelar"}
                          </Button>
                        )}
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}
