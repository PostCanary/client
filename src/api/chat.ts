// src/api/chat.ts
import { http, API_BASE } from "@/api/http";

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
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
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
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });

    // Parse SSE lines: "data: ...\n\n"
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const data = line.slice(6);
        if (data === "[DONE]") return;
        try { onChunk(JSON.parse(data)); } catch { onChunk(data); }
      }
    }
  }
}

/**
 * Non-streaming fallback: send a chat message and get a full response.
 */
export async function sendChat(request: ChatRequest): Promise<ChatResponse> {
  const res = await http.post<ChatResponse>("/api/chat", request);
  return res.data;
}
