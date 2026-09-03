import React from "react";
import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import { useNavigate } from "react-router-dom";
import { createAppointment, createClient, searchClients } from "../api";

export default function Agendar() {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientOptions, setClientOptions] = useState([]);
  const [searchingClients, setSearchingClients] = useState(false);
  const [form, setForm] = useState({
    is_package: false,
    massage_count: 1,
    value_cents: 60,
    address: "",
    appointment_date: "",
    start_time: "",
  });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isPackageAvailable, setIsPackageAvailable] = useState(false);

  useEffect(() => {
    if (
      selectedClient &&
      selectedClient.id &&
      selectedClient.massage_count > 1
    ) {
      setIsPackageAvailable(true);
      setForm((current) => ({ ...current, massage_count: 1, value_cents: 0, address: selectedClient.address }));
    }
    if (
      selectedClient &&
      selectedClient.id
    ) {
      setForm((current) => ({ ...current, address: selectedClient.address }));
    }
  }, [clientOptions, selectedClient]);
  useEffect(() => {
    const term = clientName.trim();
    if (selectedClient && term === selectedClient.name) {
      setClientOptions([selectedClient]);
      return undefined;
    }
    if (term.length < 3) {
      setClientOptions([]);
      setSearchingClients(false);
      return undefined;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        setSearchingClients(true);
        const clients = await searchClients(term);
        if (!cancelled)
          setClientOptions(
            Array.isArray(clients)
              ? clients.length > 0
                ? [...clients]
                : [{ name: clientName }]
              : [{ name: clientName }],
          );
      } catch (error) {
        if (!cancelled) {
          setClientOptions([]);
          setMessage({
            severity: "error",
            text:
              error.response?.data?.error ||
              "Não foi possível pesquisar os clientes.",
          });
        }
      } finally {
        if (!cancelled) setSearchingClients(false);
      }
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [clientName, selectedClient]);

  function change(e) {
    const { name, value } = e.target;
    if(name === "is_package" && value === "true") {
      setForm((current) => ({ ...current, [name]: value, value_cents: 0 }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  function selectClient(_event, client) {
    setSelectedClient(client);
    if (client) {
      setClientName(client.name);
      setForm((current) => ({
        ...current,
        address: current.address || client.address || "",
      }));
    } else {
      setClientName("");
    }
  }

  async function submit(e) {
    e.preventDefault();
    setMessage(null);
    if (
      !clientName.trim() ||
      !form.address ||
      !form.appointment_date ||
      !form.start_time
    ) {
      setMessage({
        severity: "error",
        text: "Informe o cliente, endereço, data e horário.",
      });
      return;
    }
    try {
      setLoading(true);
      let client = selectedClient;
      if (!client.id) {
        const result = await createClient({
          name: clientName.trim(),
          address: form.address.trim(),
        });
        client = result.client;
        if (!client)
          throw new Error("A API não retornou o cliente cadastrado.");
      }
      await createAppointment({
        client_id: Number(client.id),
        is_package: form.is_package === true || form.is_package === "true",
        massage_count: Number(form.massage_count),
        value_cents: Math.round(Number(form.value_cents) * 100),
        address: form.address.trim(),
        appointment_date: form.appointment_date,
        start_time: form.start_time,
      });
      navigate("/");
    } catch (error) {
      setMessage({
        severity: "error",
        text:
          error.response?.data?.error ||
          error.message ||
          "Não foi possível criar o agendamento.",
      });
    } finally {
      setLoading(false);
    }
  }

  const hasSearch = clientName.trim().length >= 3;
  const noResults =
    hasSearch &&
    !searchingClients &&
    clientOptions.length === 0 &&
    !selectedClient;
  console.log("@@@", form.is_package, form.is_package === true);
  return (
    <Box>
      <Button
        startIcon={<ArrowBackRoundedIcon />}
        onClick={() => navigate("/")}
        sx={{ mb: 1 }}
      >
        Voltar
      </Button>
      <Typography variant="h4" fontWeight={800} mb={2}>
        Novo agendamento
      </Typography>
      <Paper elevation={0} className="form-card">
        {message && (
          <Alert severity={message.severity} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        <Box component="form" onSubmit={submit}>
          <Stack spacing={2}>
            <Autocomplete
              options={clientOptions}
              value={selectedClient}
              inputValue={clientName}
              onInputChange={(_event, value, reason) => {
                setClientName(value);
                // if (reason === "input") setSelectedClient(null);
              }}
              onChange={selectClient}
              getOptionLabel={(option) => option.name || ""}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              loading={searchingClients}
              noOptionsText={
                hasSearch
                  ? "Nenhum cliente encontrado. Ele será cadastrado ao salvar."
                  : "Digite pelo menos 3 caracteres."
              }
              renderOption={(props, option) => (
                <Box component="li" {...props} key={option.id}>
                  <Box sx={{ width: "100%" }}>
                    <Typography fontWeight={700}>{option.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {option.phone || option.email || "Sem telefone/e-mail"}
                      {option.package_available
                        ? ` • ${option.massage_count} massagem(ns) no pacote`
                        : " • Sem massagens disponíveis no pacote"}
                    </Typography>
                  </Box>
                </Box>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Cliente"
                  placeholder="Digite o nome do cliente"
                  required
                  helperText={
                    selectedClient
                      ? selectedClient.package_available
                        ? `Cliente selecionado • ${selectedClient.massage_count} massagem(ns) disponíveis no pacote`
                        : "Cliente selecionado • sem massagens disponíveis no pacote"
                      : noResults
                        ? "Novo cliente: será cadastrado automaticamente ao salvar."
                        : "A busca começa automaticamente a partir do 3º caractere."
                  }
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {searchingClients ? (
                          <CircularProgress color="inherit" size={20} />
                        ) : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
            {isPackageAvailable && (
              <Typography variant="h6" fontWeight={800} mb={2}>
                {selectedClient.massage_count - 1} massagens disponíveis
              </Typography>
            )}
            <TextField
              label="Endereço"
              name="address"
              value={form.address}
              onChange={change}
              required
              helperText={
                selectedClient?.address
                  ? "Endereço preenchido a partir do cadastro do cliente."
                  : ""
              }
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label="Data"
                name="appointment_date"
                type="date"
                value={form.appointment_date}
                onChange={change}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Horário"
                name="start_time"
                type="time"
                value={form.start_time}
                onChange={change}
                required
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
            <TextField
              disabled={isPackageAvailable}
              select
              label="É pacote?"
              name="is_package"
              value={String(form.is_package)}
              onChange={change}
            >
              <MenuItem value="false">Não</MenuItem>
              <MenuItem value="true">Sim</MenuItem>
            </TextField>
            <TextField
              disabled={isPackageAvailable || !form.is_package}
              label="Quantidade de massagens"
              name="massage_count"
              type="number"
              value={form.massage_count}
              onChange={change}
              inputProps={{ min: 1 }}
              required
            />
            <TextField
              disabled={isPackageAvailable}
              label="Valor (centavos)"
              name="value_cents"
              type="number"
              value={form.value_cents}
              onChange={change}
              inputProps={{ min: 0 }}
              required
              helperText="Ex.: R$ 100,00 = 10000 centavos"
            />
            {noResults && (
              <Alert severity="info" icon={<PersonAddAlt1RoundedIcon />}>
                Nenhum cliente foi encontrado. Ao clicar em{" "}
                <strong>Agendar</strong>, um novo cliente será cadastrado
                automaticamente com o nome informado.
              </Alert>
            )}
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !clientName.trim()}
              startIcon={<SaveRoundedIcon />}
            >
              {loading ? "Salvando..." : "Agendar"}
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
}
