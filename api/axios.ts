// src/lib/axios.ts  (o src/config/axios.ts)
import axios from "axios";

const API = axios.create({
  // Usa env en dev/prod y caé a "/api" si tenés proxy en Vite
  baseURL: import.meta.env.VITE_API_URL ?? "/api",
  // withCredentials: false, // 👉 dejar en false salvo que use cookies
});

// ---- Request: agrega Authorization cuando haya token ----
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    // por las dudas, limpiamos si no hay token
    delete config.headers.Authorization;
  }
  return config;
});

// ---- Response: si el token es inválido/expiró, logout y a /login ----
API.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url ?? "";
    const isAuthRoute = /\/auth\/(login|register)/.test(url);
    if (status === 401 && !isAuthRoute) {
      localStorage.clear();
      // si tenés un AuthContext con logout(), podés emitir un evento y escucharlo
      // window.dispatchEvent(new Event("app:logout"));
      window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);

export default API;
