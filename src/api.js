import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.API_URL || "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function searchClients(name) {
  const { data } = await api.get("/clients/search", { params: { name } });
  return data;
}

export async function getPaymentsSummary(month) {
  const { data } = await api.get("/payments/summary", { params: { month } });
  return data;
}

export async function cancelAppointment(id) {
  const response = await api.patch(`/appointments/${id}/status`, {
    status: "cancelado",
  });

  return response.data;
}

export async function createClient(payload) {
  const { data } = await api.post("/clients", payload);
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/auth/login", { email, password });
  return data;
}

export async function register(name, email, password) {
  const { data } = await api.post("/auth/register", { name, email, password });
  return data;
}
export async function getAppointments(params = {}) {
  const { data } = await api.get("/appointments", { params });
  return data;
}

export async function markAppointmentPaid(id, paid = true) {
  const { data } = await api.patch(`/appointments/${id}/payment`, { paid });
  return data;
}

export async function createAppointment(payload) {
  const { data } = await api.post("/appointments", payload);
  return data;
}

export default api;
