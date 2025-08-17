// src/config/axios.ts
import axios from "axios";

// Base URL: usa proxy /api en dev, o VITE_API_URL si la tenés
axios.defaults.baseURL = import.meta.env.VITE_API_URL ?? "/api";

// ---- Request: Authorization con JWT (solo en browser) ----
axios.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    else delete config.headers.Authorization;
  }
  return config;
});

// ---- Response: 401 => limpiar y mandar a /login (solo en browser) ----
axios.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status;
    const url = err?.config?.url ?? "";
    const isAuthRoute = /\/auth\/(login|register)/.test(url);
    if (typeof window !== "undefined" && status === 401 && !isAuthRoute) {
      localStorage.clear();
      window.location.assign("/login");
    }
    return Promise.reject(err);
  }
);
