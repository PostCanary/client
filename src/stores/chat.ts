// src/stores/chat.ts
import { defineStore } from "pinia";
import { streamChat, sendChat, type ChatMessage, type ChatRole } from "@/api/chat";
import { API_BASE } from "@/api/http";

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
      if (!trimmed || this.loading) return;

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

      // Index into the reactive array so Vue detects mutations
      const msgIndex = this.messages.length - 1;
      const reactiveMsg = () => this.messages[msgIndex]!;

      // Try streaming first, fall back to non-streaming
      const controller = new AbortController();
      this._abortController = controller;

      try {
        await streamChat(
          { messages: apiMessages, context: this.context },
          (chunk) => {
            reactiveMsg().content += chunk;
          },
          controller.signal
        );
      } catch (e: any) {
        if (e.name === "AbortError") return;

        // Fallback to non-streaming if streaming isn't supported
        try {
          reactiveMsg().content = "";
          const res = await sendChat({ messages: apiMessages, context: this.context });
          reactiveMsg().content = res.reply;
        } catch (fallbackErr: any) {
          this.error = "Sorry, I'm having trouble connecting. Please try again.";
          // Remove the empty assistant message
          this.messages = this.messages.filter((m) => m.id !== assistantId);
        }
      } finally {
        reactiveMsg().streaming = false;
        this.loading = false;
        this._abortController = null;
        this._saveSession();
      }
    },

    /** Fire-and-forget save of the current session to the server. */
    _saveSession() {
      if (this.messages.length === 0) return;
      fetch(`${API_BASE}/api/chat/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: this.sessionId,
          context: this.context,
          messages: this.messages.map((m) => ({ role: m.role, content: m.content })),
          page_url: window.location.pathname,
        }),
      }).catch(() => {});
    },

    /** Capture a lead email after a good sales conversation. */
    async captureLeadEmail(email: string, metaEventId?: string) {
      const payload: Record<string, unknown> = {
        email,
        context: this.context,
        messages: this.messages.map((m) => ({ role: m.role, content: m.content })),
        session_id: this.sessionId,
      };
      if (metaEventId) payload.meta_event_id = metaEventId;
      const res = await fetch(`${API_BASE}/api/chat/lead`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error("Failed to save lead");
      }
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
      this.messages = [];
      this.error = null;
      this.leadCaptured = false;
      this.sessionId = crypto.randomUUID();
    },
  },
});
