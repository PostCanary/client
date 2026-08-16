// src/api/chat.ts
import { API_BASE, ensureCsrfToken } from "@/api/http";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ChatRequest = {
  messages: ChatMessage[];
  /** Optional context: "sales" for marketing pages, "service" for app pages */
  context?: "sales" | "service";
};

export type ChatResponse = {
  reply: string;
  conversation_id?: string;
};

export type ChatSessionPayload = {
  session_id: string;
  context: "sales" | "service";
  messages: ChatMessage[];
  page_url: string;
};

export type ChatLeadPayload = {
  email: string;
  context: "sales" | "service";
  messages: ChatMessage[];
  session_id: string;
  meta_event_id?: string;
};

// Chat uses raw fetch for SSE, so the axios CSRF interceptor never runs.
async function chatHeaders(): Promise<Record<string, string>> {
  const token = await ensureCsrfToken();
  return {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(token ? { "X-CSRF-Token": token } : {}),
  };
}

function applySseLine(line: string, onChunk: (text: string) => void): boolean {
  if (!line.startsWith("data: ")) return false;
  const data = line.slice(6);
  if (data === "[DONE]") return true;
  try {
    const parsed = JSON.parse(data);
    onChunk(typeof parsed === "string" ? parsed : data);
  } catch {
    onChunk(data);
  }
  return false;
}

/**
 * Send a chat message and get a streamed response.
 * Uses fetch() directly for streaming support (Axios doesn't handle SSE well).
 */
export async function streamChat(
  request: ChatRequest,
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const base = API_BASE || "";
  const res = await fetch(`${base}/api/chat`, {
    method: "POST",
    headers: await chatHeaders(),
    credentials: "include",
    body: JSON.stringify(request),
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Chat request failed (${res.status}): ${text}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let carry = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    carry += decoder.decode(value, { stream: true });
    const lines = carry.split("\n");
    carry = lines.pop() ?? "";
    for (const line of lines) {
      if (applySseLine(line, onChunk)) return;
    }
  }
  carry += decoder.decode();
  if (carry) applySseLine(carry, onChunk);
}

/**
 * Non-streaming fallback: consume the same SSE endpoint and return the full reply.
 */
export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  let reply = "";
  await streamChat(request, (chunk) => {
    reply += chunk;
  });
  return { reply };
}

export async function saveChatSession(payload: ChatSessionPayload): Promise<void> {
  const base = API_BASE || "";
  const res = await fetch(`${base}/api/chat/session`, {
    method: "POST",
    headers: await chatHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Chat session save failed (${res.status})`);
  }
}

export async function captureChatLead(payload: ChatLeadPayload): Promise<void> {
  const base = API_BASE || "";
  const res = await fetch(`${base}/api/chat/lead`, {
    method: "POST",
    headers: await chatHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to save lead");
  }
}
