// src/api/orgs.ts
import { get, postJson, putJson, del_, api } from "@/api/http";

export interface Org {
  id: string;
  name: string;
  slug: string;
  role: string;
  business_name: string | null;
  location: string | null;
  service_types: string[] | null;
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

export interface UpdateOrgPayload {
  name?: string;
  business_name?: string;
  location?: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip?: string;
  service_types?: string[];
}

export async function updateOrg(
  orgId: string,
  data: UpdateOrgPayload,
): Promise<Org> {
  return api<Org>(`/api/orgs/${orgId}`, {
    method: "PATCH",
    data,
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

// ---------------------------------------------------------------------------
// Org return address (POS-161) — account-level default for postcard mailing.
// Path is one-line-changeable if the server settles on a different route.
// ---------------------------------------------------------------------------

/** Server shape for GET/PUT /api/organizations/return-address */
export interface OrgReturnAddress {
  name: string | null;
  address: string;
  address2: string | null;
  city: string;
  state: string;
  zip: string;
}

export async function getReturnAddress(): Promise<OrgReturnAddress | null> {
  const res = await get<{ return_address: OrgReturnAddress | null }>(
    "/api/organizations/return-address",
  );
  return res.return_address ?? null;
}

export async function updateReturnAddress(
  returnAddress: OrgReturnAddress,
): Promise<OrgReturnAddress | null> {
  const res = await putJson<{ return_address: OrgReturnAddress | null }>(
    "/api/organizations/return-address",
    { return_address: returnAddress },
  );
  return res.return_address ?? null;
}
