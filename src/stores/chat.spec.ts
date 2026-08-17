// src/stores/chat.spec.ts
//
// POS-274: the abuse gates added by server PR #170 (429 rate limit, 413
// payload too large, 503 kill switch) return `application/json`, never
// SSE. These tests assert the widget's store: (1) never auto-retries a
// gate error, (2) shows a distinct, friendly message per status, (3)
// always clears the streaming placeholder so it can't get stuck
// "thinking", and (4) still handles the normal SSE success path.
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
import { useChatStore } from "@/stores/chat";

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
  });

  it("streams a normal SSE success response", async () => {
    streamChatMock.mockImplementation(
      async (_req: unknown, onChunk: (t: string) => void) => {
        onChunk("Hello");
        onChunk(" there");
      }
    );

    const store = useChatStore();
    await store.send("hi");

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
    await store.send("hi");

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

    // Countdown ticks down and re-enables sending once it expires.
    vi.advanceTimersByTime(1000);
    expect(store.retryAfter).toBe(59);
    vi.advanceTimersByTime(59_000);
    expect(store.retryAfter).toBe(0);

    vi.useRealTimers();
  });

  it("429 without Retry-After: generic wait message, no countdown lockout", async () => {
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "Chat is busy right now. Please try again in a minute.", {})
    );

    const store = useChatStore();
    await store.send("hi");

    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.error).toBe(
      "This connection has reached its chat limit for now. Please wait a moment and send your message again."
    );
    expect(store.retryAfter).toBe(0);
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);
  });

  it("413 payload too large: tells the visitor to shorten the message, never retries", async () => {
    streamChatMock.mockRejectedValue(
      new ChatApiError(413, "A message is too long (max 4000 characters).", {
        serverMessage: "A message is too long (max 4000 characters).",
      })
    );

    const store = useChatStore();
    await store.send("x".repeat(5000));

    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.error).toBe("That message is too long. Please shorten it and try again.");
    expect(store.retryAfter).toBe(0);
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);
  });

  it("503 kill switch: tells the visitor chat is unavailable, never retries", async () => {
    streamChatMock.mockRejectedValue(
      new ChatApiError(
        503,
        "Chat is temporarily unavailable. Please email support@postcanary.com.",
        { retryAfter: 300 }
      )
    );

    const store = useChatStore();
    await store.send("hi");

    expect(sendChatMock).not.toHaveBeenCalled();
    expect(store.error).toBe(
      "Chat is temporarily unavailable. Please try again shortly, or email support@postcanary.com."
    );
    // The 429 send-lockout affordance is intentionally scoped to 429 only.
    expect(store.retryAfter).toBe(0);
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);
  });

  it("blocks send() entirely while a 429 countdown is active", async () => {
    vi.useFakeTimers();
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "Too many chat messages from this connection.", { retryAfter: 5 })
    );

    const store = useChatStore();
    await store.send("first");
    expect(store.retryAfter).toBe(5);

    await store.send("second");
    expect(streamChatMock).toHaveBeenCalledTimes(1);
    expect(store.messages.filter((m) => m.role === "user")).toHaveLength(1);

    vi.useRealTimers();
  });

  it("still falls back to a plain retry for a non-gate (network) error, not for gate errors", async () => {
    streamChatMock.mockRejectedValue(new Error("network blip"));
    sendChatMock.mockResolvedValue({ reply: "recovered via fallback" });

    const store = useChatStore();
    await store.send("hi");

    expect(sendChatMock).toHaveBeenCalledTimes(1);
    expect(store.error).toBeNull();
    expect(store.loading).toBe(false);
    expect(hasStreamingMessage(store)).toBe(false);
    const assistant = store.messages.find((m) => m.role === "assistant");
    expect(assistant?.content).toBe("recovered via fallback");
  });
});
