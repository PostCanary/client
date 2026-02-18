// src/api/auth.ts
import { AUTH_BASE } from "@/config/auth";
import type { AuthMeResponse } from "@/api/users";

/**
 * NOTE:
 * All /auth/* network calls must live here.
 * Do NOT call /auth/* via axios "api(...)" because axios baseURL is /api -> would become /api/auth/* (404).
 */


function join(base: string, path: string) {
  const b = (base || "").replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

async function readJsonSafe<T>(res: Response, fallback: T): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return fallback;
  try {
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function authMe(): Promise<AuthMeResponse> {
  const res = await fetch(join(AUTH_BASE, "/auth/me"), { credentials: "include" });
  return readJsonSafe<AuthMeResponse>(res, { authenticated: false });
}


export async function authLoginJson(email: string, password: string): Promise<Response> {
  return fetch(join(AUTH_BASE, "/auth/login-json"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function authRegisterJson(email: string, password: string): Promise<Response> {
  return fetch(join(AUTH_BASE, "/auth/register-json"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function authCheckEmailExists(email: string): Promise<boolean> {
  const params = new URLSearchParams({ email });
  const res = await fetch(join(AUTH_BASE, `/auth/check-email?${params.toString()}`), {
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await readJsonSafe<{ exists?: boolean }>(res, {});
  return !!data.exists;
}

export async function authForgotPassword(email: string): Promise<Response> {
  return fetch(join(AUTH_BASE, "/auth/forgot-password"), {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function authLogout(): Promise<void> {
  await fetch(join(AUTH_BASE, "/auth/logout"), { method: "GET", credentials: "include" });
}