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

/**
 * Thrown by streamChat/sendChat for the abuse-gate responses added in
 * POS-234 (server PR #170): 429 rate-limited, 413 payload too large, 503
 * kill switch. These come back as `application/json` (never SSE), so
 * callers must check `instanceof ChatApiError` before falling back to any
 * retry logic — retrying a 429 burns the same per-IP budget that got the
 * visitor rate-limited in the first place.
 */
export class ChatApiError extends Error {
  readonly status: number;
  /** Seconds to wait before retrying, from the `Retry-After` header (429/503). */
  readonly retryAfter?: number;
  /** Raw `error` (or `message`) field from the JSON body, if present. */
  readonly serverMessage?: string;

  constructor(
    status: number,
    message: string,
    opts?: { retryAfter?: number; serverMessage?: string }
  ) {
    super(message);
    this.name = "ChatApiError";
    this.status = status;
    this.retryAfter = opts?.retryAfter;
    this.serverMessage = opts?.serverMessage;
  }
}

function parseRetryAfter(res: Response): number | undefined {
  const header = res.headers.get("Retry-After");
  if (!header) return undefined;
  const seconds = Number(header);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

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
    // POS-274: the abuse gates added in server PR #170 (429/413/503) return
    // `application/json`, never SSE — parse them as JSON instead of the raw
    // text a streaming caller would otherwise expect. A generic network/5xx
    // error without a JSON body just falls through to `serverMessage`
    // undefined below.
    const retryAfter = parseRetryAfter(res);
    let serverMessage: string | undefined;
    const contentType = res.headers.get("Content-Type") || "";
    if (contentType.includes("json")) {
      try {
        const data = await res.json();
        serverMessage =
          typeof data?.error === "string"
            ? data.error
            : typeof data?.message === "string"
              ? data.message
              : undefined;
      } catch {
        // Malformed JSON body — fall through with no serverMessage.
      }
    }
    throw new ChatApiError(
      res.status,
      serverMessage || `Chat request failed (${res.status})`,
      { retryAfter, serverMessage }
    );
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
