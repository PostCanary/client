// src/api/http.ts
import axios from "axios";
import type {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
} from "axios";
import { AUTH_BASE } from "@/config/auth";
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

// ---- CSRF token (module-scope; fetched once per session, injected on state-changing requests)
let _csrfToken: string | null = null;
const _CSRF_STATE_METHODS = new Set(["post", "put", "patch", "delete"]);

export async function ensureCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  // Use raw fetch (not axios) to avoid triggering this interceptor recursively
  try {
    const res = await fetch(`${AUTH_BASE}/auth/csrf-token`, { credentials: "include" });
    if (res.ok) {
      const data = await res.json();
      _csrfToken = data.csrf_token as string;
    }
  } catch {
    // Non-fatal — requests proceed without the token; server will reject state-changing ones
  }
  return _csrfToken ?? "";
}

export function clearCsrfToken() {
  _csrfToken = null;
}

// ---- Request interceptor
http.interceptors.request.use(async (cfg) => {
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

  if (_CSRF_STATE_METHODS.has(cfg.method?.toLowerCase() ?? "")) {
    const token = await ensureCsrfToken();
    if (token) {
      (cfg.headers as any)["X-CSRF-Token"] = token;
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
  async (err: AxiosError) => {
    inflight = Math.max(0, inflight - 1);
    notify();

    const status = err.response?.status ?? 0;
    let data: any = err.response?.data;
    // Blob endpoints (preview-card/preview-back use responseType:"blob")
    // receive ERROR bodies as Blobs too, which blinded the CSRF-retry
    // check below — the rotating token made the back preview fail
    // permanently after ~2min idle (S77, Dustin). Parse JSON error blobs
    // so retry + message normalization work for every endpoint.
    if (
      data instanceof Blob &&
      (data.type.includes("json") || status === 403)
    ) {
      try {
        data = JSON.parse(await data.text());
      } catch {
        /* not JSON — keep the original blob */
      }
    }
    const url = err.config?.url;
    const method = err.config?.method;

    log.error("HTTP ← error", {
      url,
      status,
      data,
      message: err.message,
    });

    // CSRF token expired: clear cached token and retry once
    if (
      status === 403 &&
      data?.error?.code === "csrf_token_invalid" &&
      !(err.config as any)?._csrfRetried
    ) {
      clearCsrfToken();
      const retryConfig = { ...(err.config as any), _csrfRetried: true };
      return http.request(retryConfig);
    }

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

    // Normalize to Error with status/data for call-sites that do try/catch.
    // Flask's error handlers return `{error: {code, message}}` — interpolating
    // the object directly produces "[object Object]" and hides the real reason.
    let msg = "Network error";
    if (status) msg = `${status} ${err.response?.statusText || ""}`.trim();
    const errField = data?.error;
    const errStr =
      typeof errField === "string"
        ? errField
        : errField && typeof errField === "object"
          ? (errField.message ?? errField.code ?? "")
          : "";
    if (errStr) msg = `${msg}: ${errStr}`;
    if (typeof data?.message === "string" && data.message) {
      msg = `${msg} — ${data.message}`;
    }

    const e = new Error(msg) as Error & { status?: number; data?: any; code?: string };
    e.status = status;
    e.data = data;
    // Preserve axios-internal codes (ECONNABORTED on timeout, ERR_CANCELED on
    // abort) so call-sites can distinguish timeout from generic network error.
    // S382 strike-1 HIGH fold; useCardPreview.ts:87 already expected this.
    if (err.code) e.code = err.code;

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

/**
 * POST multipart/form-data. Same error-handling path as postJson/postForm
 * (401/402 gate events, CSRF retry, normalized Error with status/data).
 * Do not set Content-Type manually — axios/browser attach the boundary.
 * Pass `onUploadProgress` via cfg for upload progress UI.
 */
export const postMultipart = <T = any>(
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
