import { beforeEach, describe, expect, it, vi } from "vitest";

import { ChatApiError, parseRetryAfter, streamChat } from "@/api/chat";
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

// POS-274: mirrors the exact shape server PR #170's abuse gates return —
// `application/json`, never SSE. See app/blueprints/chat.py and
// app/services/chat_gates.py in the paired server change.
function jsonErrorResponse(
  status: number,
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function withCsrfStub(
  handler: (input: RequestInfo | URL, init?: RequestInit) => Response | Promise<Response>
) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (url.includes("/auth/csrf-token")) {
      return new Response(JSON.stringify({ csrf_token: "csrf-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return handler(input, init);
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

  // POS-274: the abuse gates from server PR #170 return application/json,
  // never SSE, on 429/413/503. streamChat must parse that JSON (not treat
  // it as an SSE body) and surface a structured ChatApiError so the store
  // can apply a status-specific message without ever auto-retrying.
  it("throws a ChatApiError with the parsed body and Retry-After on 429", async () => {
    const fetchMock = withCsrfStub(() =>
      jsonErrorResponse(
        429,
        { error: "Too many chat messages from this connection. Please wait a minute and try again." },
        { "Retry-After": "60" }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect(err).toBeInstanceOf(ChatApiError);
    expect((err as ChatApiError).status).toBe(429);
    expect((err as ChatApiError).retryAfter).toBe(60);
    expect((err as ChatApiError).serverMessage).toBe(
      "Too many chat messages from this connection. Please wait a minute and try again."
    );
  });

  it("throws a ChatApiError with retryAfter undefined when 429 has no Retry-After header", async () => {
    const fetchMock = withCsrfStub(() =>
      jsonErrorResponse(429, { error: "Chat is busy right now. Please try again in a minute." })
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect(err).toBeInstanceOf(ChatApiError);
    expect((err as ChatApiError).status).toBe(429);
    expect((err as ChatApiError).retryAfter).toBeUndefined();
  });

  it("throws a ChatApiError for 413 (payload too large), no Retry-After", async () => {
    const fetchMock = withCsrfStub(() =>
      jsonErrorResponse(413, { error: "A message is too long (max 4000 characters)." })
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect(err).toBeInstanceOf(ChatApiError);
    expect((err as ChatApiError).status).toBe(413);
    expect((err as ChatApiError).retryAfter).toBeUndefined();
    expect((err as ChatApiError).serverMessage).toBe(
      "A message is too long (max 4000 characters)."
    );
  });

  it("throws a ChatApiError with Retry-After on 503 (kill switch)", async () => {
    const fetchMock = withCsrfStub(() =>
      jsonErrorResponse(
        503,
        { error: "Chat is temporarily unavailable. Please email support@postcanary.com." },
        { "Retry-After": "300" }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect(err).toBeInstanceOf(ChatApiError);
    expect((err as ChatApiError).status).toBe(503);
    expect((err as ChatApiError).retryAfter).toBe(300);
  });

  it("does not throw when the error body is HTML from a proxy", async () => {
    const fetchMock = withCsrfStub(
      () =>
        new Response("<!doctype html><html><title>400 Bad Request</title></html>", {
          status: 400,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect(err).toBeInstanceOf(ChatApiError);
    expect((err as ChatApiError).status).toBe(400);
    expect((err as ChatApiError).serverMessage).toBeUndefined();
    expect((err as ChatApiError).message).toBe("Chat request failed (400)");
  });

  it("does not throw when the body is empty with a JSON content type", async () => {
    const fetchMock = withCsrfStub(
      () =>
        new Response("", {
          status: 500,
          headers: { "Content-Type": "application/json" },
        })
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect(err).toBeInstanceOf(ChatApiError);
    expect((err as ChatApiError).status).toBe(500);
    expect((err as ChatApiError).serverMessage).toBeUndefined();
    expect((err as ChatApiError).message).toBe("Chat request failed (500)");
  });

  it("leaves retryAfter undefined for a malformed Retry-After header", async () => {
    const fetchMock = withCsrfStub(() =>
      jsonErrorResponse(429, { error: "rate limited" }, { "Retry-After": "soon" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect(err).toBeInstanceOf(ChatApiError);
    expect((err as ChatApiError).retryAfter).toBeUndefined();
  });

  it("leaves retryAfter undefined for a negative Retry-After header", async () => {
    const fetchMock = withCsrfStub(() =>
      jsonErrorResponse(429, { error: "rate limited" }, { "Retry-After": "-5" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect((err as ChatApiError).retryAfter).toBeUndefined();
  });

  it("leaves retryAfter undefined for an HTTP-date Retry-After header", async () => {
    const fetchMock = withCsrfStub(() =>
      jsonErrorResponse(
        429,
        { error: "rate limited" },
        { "Retry-After": "Wed, 21 Oct 2015 07:28:00 GMT" }
      )
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect((err as ChatApiError).retryAfter).toBeUndefined();
  });

  it("parses a very large Retry-After without clamping at the API layer", async () => {
    const fetchMock = withCsrfStub(() =>
      jsonErrorResponse(429, { error: "rate limited" }, { "Retry-After": "3600" })
    );
    vi.stubGlobal("fetch", fetchMock);

    const err = await streamChat({ messages: [{ role: "user", content: "hi" }] }, () => {}).catch(
      (e) => e
    );

    expect((err as ChatApiError).retryAfter).toBe(3600);
  });
});

describe("parseRetryAfter", () => {
  function responseWithRetryAfter(value?: string) {
    return new Response(null, {
      status: 429,
      headers: value === undefined ? {} : { "Retry-After": value },
    });
  }

  it("returns undefined when the header is missing", () => {
    expect(parseRetryAfter(responseWithRetryAfter())).toBeUndefined();
  });

  it("returns undefined when the header is empty or whitespace", () => {
    expect(parseRetryAfter(responseWithRetryAfter(""))).toBeUndefined();
    expect(parseRetryAfter(responseWithRetryAfter("   "))).toBeUndefined();
  });

  it("parses a numeric delta-seconds value", () => {
    expect(parseRetryAfter(responseWithRetryAfter("60"))).toBe(60);
    expect(parseRetryAfter(responseWithRetryAfter(" 60 "))).toBe(60);
  });

  it("returns undefined for a malformed value", () => {
    expect(parseRetryAfter(responseWithRetryAfter("soon"))).toBeUndefined();
    expect(parseRetryAfter(responseWithRetryAfter("60s"))).toBeUndefined();
  });

  it("returns undefined for a negative value", () => {
    expect(parseRetryAfter(responseWithRetryAfter("-5"))).toBeUndefined();
  });

  it("returns undefined for an HTTP-date value", () => {
    expect(
      parseRetryAfter(responseWithRetryAfter("Wed, 21 Oct 2015 07:28:00 GMT"))
    ).toBeUndefined();
  });

  it("returns the raw seconds for a very large value (store clamps)", () => {
    expect(parseRetryAfter(responseWithRetryAfter("3600"))).toBe(3600);
  });

  it("returns 0 for an explicit zero", () => {
    expect(parseRetryAfter(responseWithRetryAfter("0"))).toBe(0);
  });
});
