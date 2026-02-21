// src/stores/chat.ts
import { defineStore } from "pinia";
import { streamChat, sendChat, type ChatMessage, type ChatRole } from "@/api/chat";

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
  }),

  getters: {
    hasMessages: (s) => s.messages.length > 0,
  },

  actions: {
    toggle() {
      this.open = !this.open;
    },

    setContext(ctx: "sales" | "service") {
      this.context = ctx;
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
      const assistantMsg: DisplayMessage = {
        id: nextId++,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        streaming: true,
      };
      this.messages.push(assistantMsg);

      // Try streaming first, fall back to non-streaming
      const controller = new AbortController();
      this._abortController = controller;

      try {
        await streamChat(
          { messages: apiMessages, context: this.context },
          (chunk) => {
            assistantMsg.content += chunk;
          },
          controller.signal
        );
      } catch (e: any) {
        if (e.name === "AbortError") return;

        // Fallback to non-streaming if streaming isn't supported
        try {
          assistantMsg.content = "";
          const res = await sendChat({ messages: apiMessages, context: this.context });
          assistantMsg.content = res.reply;
        } catch (fallbackErr: any) {
          this.error = "Sorry, I'm having trouble connecting. Please try again.";
          // Remove the empty assistant message
          this.messages = this.messages.filter((m) => m.id !== assistantMsg.id);
        }
      } finally {
        assistantMsg.streaming = false;
        this.loading = false;
        this._abortController = null;
      }
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
    },
  },
});
