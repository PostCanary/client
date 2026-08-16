import { beforeEach, describe, expect, it, vi } from "vitest";

import { streamChat } from "@/api/chat";
import { clearCsrfToken } from "@/api/http";

function sseResponse(chunks: string[]) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

describe("streamChat", () => {
  beforeEach(() => {
    clearCsrfToken();
    vi.restoreAllMocks();
  });

  it("attaches X-CSRF-Token before the first /api/chat POST", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/auth/csrf-token")) {
        return new Response(JSON.stringify({ csrf_token: "csrf-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return sseResponse([
        `data: ${JSON.stringify("Hello")}\n\n`,
        "data: [DONE]\n\n",
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const chunks: string[] = [];
    await streamChat({ messages: [{ role: "user", content: "hi" }] }, (text) => {
      chunks.push(text);
    });

    expect(chunks.join("")).toBe("Hello");
    const chatCall = fetchMock.mock.calls.find((call) =>
      String(call[0]).includes("/api/chat"),
    );
    expect(chatCall).toBeTruthy();
    const headers = chatCall?.[1]?.headers as Record<string, string> | undefined;
    expect(headers?.["X-CSRF-Token"]).toBe("csrf-token");
  });

  it("reassembles an SSE data line split across reads", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      const url = String(input);
      if (url.includes("/auth/csrf-token")) {
        return new Response(JSON.stringify({ csrf_token: "csrf-token" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return sseResponse(['data: "Hel', 'lo"\n\ndata: [DONE]\n\n']);
    });
    vi.stubGlobal("fetch", fetchMock);

    const chunks: string[] = [];
    await streamChat({ messages: [{ role: "user", content: "hi" }] }, (text) => {
      chunks.push(text);
    });

    expect(chunks.join("")).toBe("Hello");
  });
});
