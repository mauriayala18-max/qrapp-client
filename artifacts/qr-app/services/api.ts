import axios from "axios";
import { API_BASE_URL, TOKEN_KEY } from "@/constants/config";
import { secureStorage } from "@/utils/secureStorage";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await secureStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let _onUnauthorized: (() => void) | null = null;

export const setUnauthorizedHandler = (handler: () => void) => {
  _onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await secureStorage.deleteItem(TOKEN_KEY);
      _onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const msg =
      error.response?.data?.message ?? error.response?.data?.detail ?? null;
    if (msg) return msg;
    if (error.code === "ECONNABORTED") return "Tiempo de espera agotado";
    if (!error.response) return "Sin conexión a internet";
    return "Error del servidor";
  }
  return "Error desconocido";
};
