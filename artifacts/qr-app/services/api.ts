import axios from "axios";
import { API_BASE_URL, TOKEN_KEY } from "@/constants/config";
import { secureStorage } from "@/utils/secureStorage";

// Allow callers to opt individual requests out of the global 401-logout flow.
// Use { _skipAuthError: true } for background/polling requests (e.g. notification
// unread-count) whose 401 must NOT invalidate a freshly-established session.
declare module "axios" {
  interface AxiosRequestConfig {
    _skipAuthError?: boolean;
  }
}

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
// Guard: prevent a burst of simultaneous 401s from each triggering logout.
// Reset whenever any request succeeds (proof the session is still alive).
let _logoutInProgress = false;

export const setUnauthorizedHandler = (handler: () => void) => {
  _onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => {
    _logoutInProgress = false; // session confirmed alive
    return response;
  },
  async (error) => {
    const skip = error.config?._skipAuthError === true;
    if (error.response?.status === 401 && !skip && !_logoutInProgress) {
      _logoutInProgress = true;
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
