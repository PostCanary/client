// src/stores/chat.ts
import { defineStore } from "pinia";
import {
  streamChat,
  sendChat,
  saveChatSession,
  captureChatLead,
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

        try {
          const msg = assistantMsg();
          if (msg) msg.content = "";
          const res = await sendChat({ messages: apiMessages, context: this.context });
          if (msg) msg.content = res.reply;
        } catch {
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
      this.messages = [];
      this.error = null;
      this.leadCaptured = false;
      this.sessionId = crypto.randomUUID();
    },
  },
});
