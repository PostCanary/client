import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
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

vi.mock("vue-router", () => ({
  useRoute: () => ({ meta: { marketing: true } }),
}));

vi.mock("@/api/http", () => ({
  ensureCsrfToken: vi.fn().mockResolvedValue("csrf-token"),
}));

vi.mock("@/composables/useMetaPixel", () => ({
  generateEventId: () => "evt-1",
  trackLead: vi.fn(),
}));

import { ChatApiError } from "@/api/chat";
import { useChatStore } from "@/stores/chat";
import ChatWidget from "./ChatWidget.vue";

describe("ChatWidget handleSend", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.restoreAllMocks();
    streamChatMock.mockReset();
    sendChatMock.mockReset();
    saveChatSessionMock.mockReset().mockResolvedValue(undefined);
    captureChatLeadMock.mockReset().mockResolvedValue(undefined);
    useChatStore().clearConversation();
  });

  it("restores the typed text after a 429 gate error", async () => {
    streamChatMock.mockRejectedValue(
      new ChatApiError(429, "rate limited", { retryAfter: 60 })
    );

    const pinia = createPinia();
    setActivePinia(pinia);
    const store = useChatStore();
    store.open = true;

    const wrapper = mount(ChatWidget, {
      attachTo: document.body,
      global: {
        plugins: [pinia],
        stubs: {
          ChatMessage: true,
          Teleport: { template: "<div><slot /></div>" },
        },
      },
    });

    const textarea = wrapper.find("textarea");
    expect(textarea.exists()).toBe(true);
    await textarea.setValue("please restore this");
    await wrapper.find(".chat-panel__send").trigger("click");
    await flushPromises();

    expect((textarea.element as HTMLTextAreaElement).value).toBe(
      "please restore this"
    );
    expect(store.retryAfter).toBe(60);

    wrapper.unmount();
  });
});
