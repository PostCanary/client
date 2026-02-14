// src/api/users.ts
import { api, get, postForm } from "@/api/http";
import type { BillingState } from "@/api/billing";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  website_url: string | null;
  industry: string | null;
  crm: string | null;
  mail_provider: string | null;
  avatar_url: string | null;
  role: string | null;
  profile_complete: boolean;
  created_at: string | null;
}

export type UpdateUserProfilePayload = Partial<
  Pick<UserProfile, "full_name" | "website_url" | "industry" | "crm" | "mail_provider">
>;

// GET /api/users/me
export async function fetchUserProfile(): Promise<UserProfile> {
  return get<UserProfile>("/api/users/me");
}

// PATCH /api/users/me
export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
  return api<UserProfile>("/api/users/me", {
    method: "PATCH",
    data: payload,
    headers: { "Content-Type": "application/json" },
  });
}

// POST /api/users/me/avatar-upload
export async function uploadUserAvatar(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("avatar", file);

  const res = await postForm<{ ok: boolean; avatar_url: string }>(
    "/api/users/me/avatar-upload",
    formData
  );

  return res.avatar_url;
}

// DELETE /api/users/me
export async function deleteCurrentUser(): Promise<void> {
  await api<unknown>("/api/users/me", { method: "DELETE" });
}

/* ============================================================
 * Session/auth shapes (served by /auth/*, NOT /api/*)
 * Keep these here so all "who is the user" types live together.
 * ============================================================ */

export type SessionUser = Pick<
  UserProfile,
  "id" | "email" | "full_name" | "role" | "avatar_url"
>;

export type AuthMeResponse =
  | {
      authenticated: false;
    }
  | {
      authenticated: true;
      user_id: string; // backend may send this even if id exists elsewhere
      email?: string;
      full_name?: string | null;
      role?: string | null;
      avatar_url?: string | null;
      billing?: BillingState | null;
    };
