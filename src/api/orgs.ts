// src/api/orgs.ts
import { get, postJson, del_, api } from "@/api/http";

export interface Org {
  id: string;
  name: string;
  slug: string;
  role: string;
}

export interface OrgMember {
  user_id: string;
  email: string;
  full_name: string | null;
  role: string;
  status: string;
  accepted_at: string | null;
}

export interface OrgInvitation {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export interface InvitationDetails {
  org_name: string;
  email: string;
  role: string;
  invited_by: string;
  expires_at: string;
  accepted: boolean;
  expired: boolean;
}

export async function getOrgs(): Promise<Org[]> {
  const res = await get<{ orgs: Org[] }>("/api/orgs");
  return res.orgs;
}

export async function getOrg(orgId: string): Promise<Org> {
  return get<Org>(`/api/orgs/${orgId}`);
}

export async function updateOrg(orgId: string, name: string): Promise<Org> {
  return api<Org>(`/api/orgs/${orgId}`, {
    method: "PATCH",
    data: { name },
    headers: { "Content-Type": "application/json" },
  });
}

export async function switchOrg(orgId: string): Promise<void> {
  await postJson<void>(`/api/orgs/${orgId}/switch`);
}

export async function getMembers(orgId: string): Promise<OrgMember[]> {
  const res = await get<{ members: OrgMember[] }>(`/api/orgs/${orgId}/members`);
  return res.members;
}

export async function getInvitations(orgId: string): Promise<OrgInvitation[]> {
  const res = await get<{ invitations: OrgInvitation[] }>(
    `/api/orgs/${orgId}/invitations`,
  );
  return res.invitations;
}

export async function sendInvite(
  orgId: string,
  email: string,
  role: string,
): Promise<OrgInvitation> {
  return postJson<OrgInvitation>(`/api/orgs/${orgId}/invitations`, {
    email,
    role,
  });
}

export async function removeMember(
  orgId: string,
  userId: string,
): Promise<void> {
  await del_(`/api/orgs/${orgId}/members/${userId}`);
}

export async function updateMemberRole(
  orgId: string,
  userId: string,
  role: string,
): Promise<void> {
  await api<void>(`/api/orgs/${orgId}/members/${userId}`, {
    method: "PATCH",
    data: { role },
    headers: { "Content-Type": "application/json" },
  });
}

export async function getInvitationDetails(
  token: string,
): Promise<InvitationDetails> {
  return get<InvitationDetails>(`/api/invitations/${token}`);
}

export async function acceptInvitation(token: string): Promise<void> {
  await postJson<void>(`/api/invitations/${token}/accept`);
}
