// src/stores/chat.ts
import { defineStore } from "pinia";
import {
  streamChat,
  sendChat,
  saveChatSession,
  captureChatLead,
  ChatApiError,
  type ChatMessage,
  type ChatRole,
} from "@/api/chat";

export type DisplayMessage = {
  id: number;
  role: ChatRole;
  content: string;
  timestamp: number;
  streaming?: boolean;
};

let nextId = 1;

export const useChatStore = defineStore("chat", {
  state: () => ({
    open: false,
    messages: [] as DisplayMessage[],
    loading: false,
    error: null as string | null,
    /** Current context based on route */
    context: "sales" as "sales" | "service",
    /** Abort controller for in-flight requests */
    _abortController: null as AbortController | null,
    /** Whether a lead email has been captured this session */
    leadCaptured: false,
    /** Unique ID for this chat session, rotated on clear */
    sessionId: crypto.randomUUID(),
    /** Whether the user has dismissed the chat this session */
    dismissed: sessionStorage.getItem("chat_dismissed") === "1",
    /** Whether the teaser tooltip is showing (mobile auto-open) */
    teaser: false,
    /**
     * Seconds remaining before the visitor may send again, set from a 429's
     * `Retry-After` header (POS-274). Ticks down once per second; the send
     * control stays disabled while this is > 0.
     */
    retryAfter: 0,
    /** Interval driving the retryAfter countdown. */
    _retryTimer: null as ReturnType<typeof setInterval> | null,
  }),

  getters: {
    hasMessages: (s) => s.messages.length > 0,
  },

  actions: {
    toggle() {
      if (this.open) {
        this.dismissed = true;
        sessionStorage.setItem("chat_dismissed", "1");
      }
      this.teaser = false;
      this.open = !this.open;
    },

    /** Open the chat without marking it as user-initiated (for auto-open). */
    autoOpen() {
      this.open = true;
    },

    /** Show the teaser tooltip (mobile auto-open). */
    showTeaser() {
      this.teaser = true;
    },

    /** Dismiss the teaser tooltip without opening the chat. */
    dismissTeaser() {
      this.teaser = false;
      this.dismissed = true;
      sessionStorage.setItem("chat_dismissed", "1");
    },

    setContext(ctx: "sales" | "service") {
      this.context = ctx;
    },

    /** Add a user message without sending to the API. */
    addUserMessage(text: string) {
      this.messages.push({
        id: nextId++,
        role: "user",
        content: text,
        timestamp: Date.now(),
      });
    },

    /** Add a canned assistant message without calling the API. */
    addAssistantMessage(text: string) {
      this.messages.push({
        id: nextId++,
        role: "assistant",
        content: text,
        timestamp: Date.now(),
      });
    },

    /** Send a user message and get an AI response. */
    async send(text: string) {
      const trimmed = text.trim();
      if (!trimmed || this.loading || this.retryAfter > 0) return;

      // Add user message
      this.messages.push({
        id: nextId++,
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      });

      this.loading = true;
      this.error = null;

      // Prepare conversation history for the API
      const apiMessages: ChatMessage[] = this.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      // Create placeholder for assistant response
      const assistantId = nextId++;
      this.messages.push({
        id: assistantId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      });

      const assistantMsg = () => this.messages.find((m) => m.id === assistantId);

      // Try streaming first, fall back to a second full-read of the same SSE endpoint
      const controller = new AbortController();
      this._abortController = controller;

      try {
        await streamChat(
          { messages: apiMessages, context: this.context },
          (chunk) => {
            const msg = assistantMsg();
            if (msg) msg.content += chunk;
          },
          controller.signal
        );
      } catch (e: any) {
        if (e.name === "AbortError") return;

        // POS-274: the abuse-gate statuses (429/413/503) must never trigger
        // the plain-fetch fallback below — retrying a 429 burns the same
        // per-IP budget that caused the 429, and 413/503 will never
        // succeed on an identical retry either. Apply the friendly message
        // and stop; no second request goes out.
        if (e instanceof ChatApiError) {
          this._applyChatApiError(e, assistantId);
          return;
        }

        try {
          const msg = assistantMsg();
          if (msg) msg.content = "";
          const res = await sendChat({ messages: apiMessages, context: this.context });
          if (msg) msg.content = res.reply;
        } catch (fallbackErr: any) {
          if (fallbackErr instanceof ChatApiError) {
            this._applyChatApiError(fallbackErr, assistantId);
            return;
          }
          this.error = "Sorry, I'm having trouble connecting. Please try again.";
          this.messages = this.messages.filter((m) => m.id !== assistantId);
        }
      } finally {
        const msg = assistantMsg();
        if (msg) msg.streaming = false;
        this.loading = false;
        this._abortController = null;
        this._saveSession();
      }
    },

    /**
     * Apply a friendly, status-specific message for an abuse-gate error
     * (POS-274) and clean up the in-flight assistant placeholder so the
     * widget never gets stuck "thinking". Never auto-retries.
     */
    _applyChatApiError(e: ChatApiError, assistantId: number) {
      this.messages = this.messages.filter((m) => m.id !== assistantId);
      this.error = this._chatApiErrorMessage(e);
      if (e.status === 429 && e.retryAfter) {
        this._startRetryCountdown(e.retryAfter);
      }
    },

    _chatApiErrorMessage(e: ChatApiError): string {
      switch (e.status) {
        case 429:
          // Wording avoids "you" / "your" — the limit is per-IP, not
          // per-session, so office NAT or mobile CGNAT visitors can share
          // a budget with strangers and shouldn't be told they personally
          // sent too many messages.
          return e.retryAfter
            ? `This connection has reached its chat limit for now. Please wait ${Math.ceil(e.retryAfter)}s and send your message again.`
            : "This connection has reached its chat limit for now. Please wait a moment and send your message again.";
        case 413:
          return "That message is too long. Please shorten it and try again.";
        case 503:
          return "Chat is temporarily unavailable. Please try again shortly, or email support@postcanary.com.";
        default:
          return "Sorry, I'm having trouble connecting. Please try again.";
      }
    },

    /** Start (or restart) the post-429 send-lockout countdown. */
    _startRetryCountdown(seconds: number) {
      this._clearRetryCountdown();
      this.retryAfter = Math.max(0, Math.ceil(seconds));
      if (this.retryAfter <= 0) return;
      this._retryTimer = setInterval(() => {
        this.retryAfter = Math.max(0, this.retryAfter - 1);
        if (this.retryAfter <= 0) this._clearRetryCountdown();
      }, 1000);
    },

    _clearRetryCountdown() {
      if (this._retryTimer) {
        clearInterval(this._retryTimer);
        this._retryTimer = null;
      }
      this.retryAfter = 0;
    },

    /** Fire-and-forget save of the current session to the server. */
    _saveSession() {
      if (this.messages.length === 0) return;
      saveChatSession({
        session_id: this.sessionId,
        context: this.context,
        messages: this.messages.map((m) => ({ role: m.role, content: m.content })),
        page_url: window.location.pathname,
      }).catch(() => {});
    },

    /** Capture a lead email after a good sales conversation. */
    async captureLeadEmail(email: string, metaEventId?: string) {
      await captureChatLead({
        email,
        context: this.context,
        messages: this.messages.map((m) => ({ role: m.role, content: m.content })),
        session_id: this.sessionId,
        ...(metaEventId ? { meta_event_id: metaEventId } : {}),
      });
      this.leadCaptured = true;
    },

    /** Cancel an in-flight request */
    cancelRequest() {
      this._abortController?.abort();
      this._abortController = null;
      this.loading = false;
    },

    /** Clear conversation and start fresh */
    clearConversation() {
      this.cancelRequest();
      this._clearRetryCountdown();
      this.messages = [];
      this.error = null;
      this.leadCaptured = false;
      this.sessionId = crypto.randomUUID();
    },
  },
});
