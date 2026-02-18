// src/api/http.ts
import axios from "axios";
import type {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { log, getReq } from "@/utils/logger";

// ---- Base URL
// Production backend - using subdomain for cookie sharing
// NOTE: Do NOT append /api here — API paths already include the /api/ prefix.
const PROD_API_BASE = "https://api.postcanary.com";

const rawBase = import.meta.env.VITE_API_BASE as string | undefined;
const base = (rawBase ?? "").trim();

// Use explicit env var if set, else backend origin in prod or same-origin in dev.
// NOTE: API paths already include /api/ prefix, so baseURL should NOT include /api.
export const API_BASE = base.length
  ? base
  : import.meta.env.PROD
    ? PROD_API_BASE
    : "";

if (import.meta.env.DEV) {
  log.info("API_BASE resolved", { API_BASE });
}

// ---- Global "inflight" loader signal
let inflight = 0;
const listeners = new Set<(n: number) => void>();

function notify() {
  document.body.toggleAttribute("data-loading", inflight > 0);
  for (const fn of listeners) fn(inflight);
}

export function onInflightChange(fn: (n: number) => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getInflight() {
  return inflight;
}

// ---- Events
export const HTTP_EVENT_AUTH_REQUIRED = "mt:http:auth-required";
export const HTTP_EVENT_SUBSCRIPTION_REQUIRED = "mt:http:subscription-required";

export type HttpGateEventDetail = {
  status: number;
  url?: string;
  method?: string;
  data?: any;
};

function emitGateEvent(name: string, detail: HttpGateEventDetail) {
  window.dispatchEvent(new CustomEvent<HttpGateEventDetail>(name, { detail }));
}

// ---- Axios instance
export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 60_000,
  headers: { "X-Requested-With": "XMLHttpRequest" },

  validateStatus: (status) => status >= 200 && status < 300,
});

// ---- Request interceptor
http.interceptors.request.use((cfg) => {
  inflight++;
  notify();

  const reqId = getReq();
  if (reqId) {
    const headers = cfg.headers as any;

    // Axios 1.x sometimes uses AxiosHeaders
    if (headers && typeof (headers as AxiosHeaders).set === "function") {
      (headers as AxiosHeaders).set("X-Request-ID", reqId);
    } else {
      cfg.headers = { ...(cfg.headers as any), "X-Request-ID": reqId } as any;
    }
  }

  const url = (cfg.baseURL || "") + (cfg.url || "");
  log.info("HTTP → request", { method: cfg.method, url, reqId });

  if (cfg.method?.toUpperCase() !== "GET" && cfg.data !== undefined) {
    log.debug("HTTP → payload", { data: cfg.data });
  }

  return cfg;
});

// ---- Response interceptor
http.interceptors.response.use(
  (res: AxiosResponse) => {
    inflight = Math.max(0, inflight - 1);
    notify();

    log.info("HTTP ← response", { url: res.config?.url, status: res.status });
    return res;
  },
  (err: AxiosError) => {
    inflight = Math.max(0, inflight - 1);
    notify();

    const status = err.response?.status ?? 0;
    const data: any = err.response?.data;
    const url = err.config?.url;
    const method = err.config?.method;

    log.error("HTTP ← error", {
      url,
      status,
      data,
      message: err.message,
    });

    // Fire “gate” events that main.ts can handle
    if (status === 401) {
      emitGateEvent(HTTP_EVENT_AUTH_REQUIRED, { status, url, method, data });
    } else if (status === 402) {
      emitGateEvent(HTTP_EVENT_SUBSCRIPTION_REQUIRED, {
        status,
        url,
        method,
        data,
      });
    }

    // Normalize to Error with status/data for call-sites that do try/catch
    let msg = "Network error";
    if (status) msg = `${status} ${err.response?.statusText || ""}`.trim();
    if (data?.error) msg = `${msg}: ${data.error}`;
    if (data?.message) msg = `${msg} — ${data.message}`;

    const e = new Error(msg) as Error & { status?: number; data?: any };
    e.status = status;
    e.data = data;

    return Promise.reject(e);
  }
);

// ---- data-only helpers (return response.data)
export async function api<T = any>(
  path: string,
  cfg?: AxiosRequestConfig
): Promise<T> {
  const res = await http.request<T>({ url: path, method: "GET", ...cfg });
  return res.data as T;
}

export const get = <T = any>(path: string, cfg?: AxiosRequestConfig) =>
  api<T>(path, { ...cfg, method: "GET" });

export const postJson = <T = any>(
  path: string,
  body?: any,
  cfg?: AxiosRequestConfig
) =>
  api<T>(path, {
    method: "POST",
    data: body ?? {},
    headers: { "Content-Type": "application/json", ...(cfg?.headers || {}) },
    ...cfg,
  });

export const postForm = <T = any>(
  path: string,
  form: FormData,
  cfg?: AxiosRequestConfig
) => api<T>(path, { method: "POST", data: form, ...cfg });

export const putJson = <T = any>(
  path: string,
  body?: any,
  cfg?: AxiosRequestConfig
) =>
  api<T>(path, {
    method: "PUT",
    data: body ?? {},
    headers: { "Content-Type": "application/json", ...(cfg?.headers || {}) },
    ...cfg,
  });

export const del_ = <T = any>(path: string, cfg?: AxiosRequestConfig) =>
  api<T>(path, { ...cfg, method: "DELETE" });

// Raw helpers (still reject on non-2xx because validateStatus is forced)
export const getRaw = <T = any>(path: string, cfg?: AxiosRequestConfig) =>
  http.get<T>(path, cfg);
export const post = <T = any>(path: string, body?: any, cfg?: AxiosRequestConfig) =>
  http.post<T>(path, body ?? {}, cfg);
export const putRaw = <T = any>(path: string, body?: any, cfg?: AxiosRequestConfig) =>
  http.put<T>(path, body ?? {}, cfg);
export const deleteRaw = <T = any>(path: string, cfg?: AxiosRequestConfig) =>
  http.delete<T>(path, cfg);