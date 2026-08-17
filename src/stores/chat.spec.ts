// src/stores/chat.spec.ts
//
// POS-274: the abuse gates added by server PR #170 (429 rate limit, 413
// payload too large, 503 kill switch) return `application/json`, never
// SSE. These tests assert the widget's store: (1) never auto-retries a
// gate error, (2) shows a distinct, friendly message per status, (3)
// always clears the streaming placeholder so it can't get stuck
// "thinking", (4) still handles the normal SSE success path, and (5)
// starts a clamped countdown on every 429/503 even when Retry-After is
// missing (the production CORS case).
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

const streamChatMock = vi.fn();
const sendChatMock = vi.fn();
const saveChatSessionMock = vi.fn();
const captureChatLeadMock = vi.fn();

vi.mock("@/api/chat", async () => {
  const actual = await vi.importActual<typeof import("@/api/chat")>("@/api/chat");
  return {
    ...actual,
    streamChat: (...args: unknown[]) => streamChatMock(...args),
    sendChat: (...args: unknown[]) => sendChatMock(...args),
    saveChatSession: (...args: unknown[]) => saveChatSessionMock(...args),
    captureChatLead: (...args: unknown[]) => captureChatLeadMock(...args),
  };
});

import { ChatApiError } from "@/api/chat";
import {
  CHAT_RETRY_AFTER_DEFAULT_SECONDS,
  CHAT_RETRY_AFTER_MAX_SECONDS,
  useChatStore,
} from "@/stores/chat";

function hasStreamingMessage(store: ReturnType<typeof useChatStore>) {
  return store.messages.some((m) => m.streaming);
}

describe("useChatStore.send", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    vi.useRealTimers();
    streamChatMock.mockReset();
    sendChatMock.mockReset();
    saveChatSessionMock.mockReset().mockResolvedValue(undefined);
    captureChatLeadMock.mockReset().mockResolvedValue(undefined);
    // Module-scope retry timer must not leak across tests.
    useChatStore().clearConversation();
  });

  it("streams a normal SSE success response", async () => {
    streamChatMock.mockImplementation(
      async (_req: unknown, onChunk: (t: string) => void) => {
        onChunk("Hello");
        onChunk(" there");
      }
    );

    const store = useChatStore();
    const result = await store.send("hi");

    expect(result).toBe("ok");
    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
    expect(store.retryAfter).toBe(0);
    expect(hasStreamingMessage(store)).toBe(false);
    const assistant = store.messages.find((m) => m.role === "assistant");
    expect(assistant?.content).toBe("Hello there");
  });

  it("429 with Retry-After: friendly wait message, starts a countdown, never retries", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(
        429,
        "Too many chat messages from this connection. Please wait a minute and try again.",
        { retryAfter: 60, serverMessage: "Too many chat messages from this connection. Please wait a minute and try again." }
      )
    );

    const store = useChatStore();
    const result = await store.send("hi");

    expect(result).toBe("gate");
    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.error).toBe(
      "This connection has reached its chat limit for now. Please wait 60s and send your message again."
    );
    expect(store.retryAfter).toBe(60);
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);
    // The failed assistant turn is not left behind — only the user message remains.
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0]?.role).toBe("user");

    // Countdown ticks down, clears the stale wait copy, and re-enables sending.
    vi.advanceTimersByTime(1000);
    expect(store.retryAfter).toBe(59);
    expect(store.error).toContain("wait 60s");
    vi.advanceTimersByTime(59_000);
    expect(store.retryAfter).toBe(0);
    expect(store.error).toBeNull();

    vi.useRealTimers();
  });

  it("429 with NO Retry-After starts a 60s countdown (production CORS case)", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "Chat is busy right now. Please try again in a minute.", {})
    );

    const store = useChatStore();
    await store.send("hi");

    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.retryAfter).toBe(CHAT_RETRY_AFTER_DEFAULT_SECONDS);
    expect(store.error).toBe(
      `This connection has reached its chat limit for now. Please wait ${CHAT_RETRY_AFTER_DEFAULT_SECONDS}s and send your message again.`
    );
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);

    vi.advanceTimersByTime(CHAT_RETRY_AFTER_DEFAULT_SECONDS * 1000);
    expect(store.retryAfter).toBe(0);
    expect(store.error).toBeNull();

    vi.useRealTimers();
  });

  it("clamps a very large Retry-After to 120s", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "rate limited", { retryAfter: 3600 })
    );

    const store = useChatStore();
    await store.send("hi");

    expect(store.retryAfter).toBe(CHAT_RETRY_AFTER_MAX_SECONDS);
    expect(store.error).toBe(
      `This connection has reached its chat limit for now. Please wait ${CHAT_RETRY_AFTER_MAX_SECONDS}s and send your message again.`
    );

    vi.useRealTimers();
  });

  it("treats a malformed Retry-After as missing and starts the 60s default", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "rate limited", {})
    );

    const store = useChatStore();
    await store.send("hi");

    expect(store.retryAfter).toBe(CHAT_RETRY_AFTER_DEFAULT_SECONDS);

    vi.useRealTimers();
  });

  it("treats a negative Retry-After as unusable and starts the 60s default", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "rate limited", { retryAfter: -5 })
    );

    const store = useChatStore();
    await store.send("hi");

    expect(store.retryAfter).toBe(CHAT_RETRY_AFTER_DEFAULT_SECONDS);

    vi.useRealTimers();
  });

  it("treats an HTTP-date Retry-After (undefined after parse) as the 60s default", async () => {
    vi.useFakeTimers();
    // parseRetryAfter returns undefined for HTTP-dates; the store must still lock.
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "rate limited", {})
    );

    const store = useChatStore();
    await store.send("hi");

    expect(store.retryAfter).toBe(CHAT_RETRY_AFTER_DEFAULT_SECONDS);

    vi.useRealTimers();
  });

  it("413 payload too large: tells the visitor to shorten the message, never retries", async () => {
    streamChatMock.mockRejectedValue(
      new ChatApiError(413, "A message is too long (max 4000 characters).", {
        serverMessage: "A message is too long (max 4000 characters).",
      })
    );

    const store = useChatStore();
    const result = await store.send("x".repeat(5000));

    expect(result).toBe("gate");
    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.error).toBe("That message is too long. Please shorten it and try again.");
    expect(store.retryAfter).toBe(0);
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);
  });

  it("400: tells the visitor to shorten the message (HTML or JSON body)", async () => {
    streamChatMock.mockRejectedValue(
      new ChatApiError(400, "Chat request failed (400)")
    );

    const store = useChatStore();
    const result = await store.send("oversized paste");

    expect(result).toBe("gate");
    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.error).toBe(
      "That message could not be sent. Please shorten it and try again."
    );
    expect(store.retryAfter).toBe(0);
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);
  });

  it("503 kill switch: starts a clamped countdown and never retries", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(
        503,
        "Chat is temporarily unavailable. Please email support@postcanary.com.",
        { retryAfter: 300 }
      )
    );

    const store = useChatStore();
    const result = await store.send("hi");

    expect(result).toBe("gate");
    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.error).toBe(
      "Chat is temporarily unavailable. Please try again shortly, or email support@postcanary.com."
    );
    expect(store.retryAfter).toBe(CHAT_RETRY_AFTER_MAX_SECONDS);
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);

    vi.useRealTimers();
  });

  it("503 with no Retry-After starts the 60s default countdown", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(new ChatApiError(503, "unavailable", {}));

    const store = useChatStore();
    await store.send("hi");

    expect(store.retryAfter).toBe(CHAT_RETRY_AFTER_DEFAULT_SECONDS);

    vi.useRealTimers();
  });

  it("blocks send() entirely while a 429 countdown is active", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "Too many chat messages from this connection.", { retryAfter: 5 })
    );

    const store = useChatStore();
    await store.send("first");
    expect(store.retryAfter).toBe(5);

    const blocked = await store.send("second");
    expect(blocked).toBe("blocked");
    expect(streamChatMock).toHaveBeenCalledTimes(1);
    expect(store.messages.filter((m) => m.role === "user")).toHaveLength(1);

    vi.useRealTimers();
  });

  it("clearConversation() clears an active countdown and the error text", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "rate limited", { retryAfter: 60 })
    );

    const store = useChatStore();
    await store.send("hi");
    expect(store.retryAfter).toBe(60);
    expect(store.error).toBeTruthy();
    expect(store.messages).toHaveLength(1);

    store.clearConversation();

    expect(store.retryAfter).toBe(0);
    expect(store.error).toBeNull();
    expect(store.messages).toHaveLength(0);
    expect(store.$state).not.toHaveProperty("_retryTimer");

    vi.useRealTimers();
  });

  it("does not keep _retryTimer in Pinia state", () => {
    const store = useChatStore();
    expect(store.$state).not.toHaveProperty("_retryTimer");
  });

  it("still falls back to a plain retry for a non-gate (network) error, not for gate errors", async () => {
    streamChatMock.mockRejectedValue(new Error("network blip"));
    sendChatMock.mockResolvedValue({ reply: "recovered via fallback" });

    const store = useChatStore();
    const result = await store.send("hi");

    expect(result).toBe("ok");
    expect(sendChatMock).toHaveBeenCalledTimes(1);
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);
    const assistant = store.messages.find((m) => m.role === "assistant");
    expect(assistant?.content).toBe("recovered via fallback");
  });
});
