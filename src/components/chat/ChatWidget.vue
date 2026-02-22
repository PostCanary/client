<!-- src/components/chat/ChatWidget.vue -->
<script setup lang="ts">
import { ref, nextTick, watch, computed, onMounted, onBeforeUnmount } from "vue";
import { useRoute } from "vue-router";
import { useChatStore } from "@/stores/chat";
import { BRAND } from "@/config/brand";
import ChatMessage from "./ChatMessage.vue";

const chat = useChatStore();
const route = useRoute();
const input = ref("");
const messagesEl = ref<HTMLElement | null>(null);

// Auto-detect context from route
const isAppRoute = computed(() => route.path.startsWith("/app") || route.path.startsWith("/dashboard"));

watch(isAppRoute, (inApp) => {
  chat.setContext(inApp ? "service" : "sales");
}, { immediate: true });

// Auto-scroll on new messages
watch(
  () => chat.messages.length,
  () => nextTick(() => scrollToBottom())
);

// Also scroll when streaming content updates
watch(
  () => chat.messages[chat.messages.length - 1]?.content,
  () => nextTick(() => scrollToBottom())
);

function scrollToBottom() {
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight;
  }
}

function handleSend() {
  if (!input.value.trim() || chat.loading) return;
  chat.send(input.value);
  input.value = "";
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
}

// Escape to close
function onGlobalKeydown(e: KeyboardEvent) {
  if (e.key === "Escape" && chat.open) {
    chat.toggle();
  }
}

onMounted(() => window.addEventListener("keydown", onGlobalKeydown));
onBeforeUnmount(() => window.removeEventListener("keydown", onGlobalKeydown));

const greeting = computed(() =>
  isAppRoute.value
    ? `Hi! I'm ${BRAND.name}'s AI assistant. How can I help you today?`
    : `Welcome to ${BRAND.name}! I can answer questions about our direct mail analytics platform, pricing, and features. How can I help?`
);

// ── Suggested starter questions ──────────────────────────────────────────────
const salesQuestions = [
  "What is PostCanary?",
  "How does matching work?",
  "Show me pricing",
  "How do I get started?",
];

const serviceQuestions = [
  "How do I upload my data?",
  "What do the KPIs mean?",
  "Why is my match rate low?",
  "How do I read the heatmap?",
];

const suggestedQuestions = computed(() =>
  isAppRoute.value ? serviceQuestions : salesQuestions
);

function sendSuggestion(question: string) {
  chat.send(question);
}

// ── Lead capture ─────────────────────────────────────────────────────────────
const leadEmail = ref("");
const leadSubmitting = ref(false);
const leadError = ref("");
const requestedHuman = ref(false);

const showLeadCapture = computed(() => {
  if (isAppRoute.value) return false;
  if (chat.leadCaptured) return false;
  if (chat.loading) return false;
  return chat.messages.length >= 4 || requestedHuman.value;
});

async function submitLead() {
  const email = leadEmail.value.trim();
  if (!email) return;
  leadSubmitting.value = true;
  leadError.value = "";
  try {
    await chat.captureLeadEmail(email);
    leadEmail.value = "";
  } catch {
    leadError.value = "Couldn't save — please try again.";
  } finally {
    leadSubmitting.value = false;
  }
}

// ── Human handoff ─────────────────────────────────────────────────────────────
function requestHuman() {
  requestedHuman.value = true;
  chat.send("I'd like to speak with a human");
}
</script>

<template>
  <Teleport to="body">
    <!-- Chat window -->
    <Transition name="chat-panel">
      <div v-if="chat.open" class="chat-panel">
        <!-- Header -->
        <div class="chat-panel__header">
          <div class="chat-panel__header-info">
            <div class="chat-panel__header-dot" />
            <div>
              <div class="chat-panel__header-title">{{ BRAND.name }} Assistant</div>
              <div class="chat-panel__header-sub">AI-powered help</div>
            </div>
          </div>
          <div class="chat-panel__header-actions">
            <button
              v-if="chat.hasMessages"
              class="chat-panel__icon-btn"
              title="Clear conversation"
              @click="chat.clearConversation()"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
            <button class="chat-panel__icon-btn" title="Close" @click="chat.toggle()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages area -->
        <div ref="messagesEl" class="chat-panel__messages">
          <!-- Welcome message + suggested questions (if no conversation yet) -->
          <div v-if="!chat.hasMessages" class="chat-panel__welcome">
            <div class="chat-panel__welcome-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <p class="chat-panel__welcome-text">{{ greeting }}</p>
            <!-- Suggested starter questions -->
            <div class="chat-panel__suggestions">
              <button
                v-for="q in suggestedQuestions"
                :key="q"
                class="chat-panel__chip"
                @click="sendSuggestion(q)"
              >
                {{ q }}
              </button>
            </div>
          </div>

          <ChatMessage
            v-for="msg in chat.messages"
            :key="msg.id"
            :message="msg"
          />

          <!-- Error message -->
          <div v-if="chat.error" class="chat-panel__error">
            {{ chat.error }}
          </div>
        </div>

        <!-- Lead capture (sales only, after real conversation or human handoff) -->
        <div v-if="showLeadCapture" class="chat-panel__lead">
          <p class="chat-panel__lead-prompt">Want us to follow up with more info?</p>
          <div class="chat-panel__lead-row">
            <input
              v-model="leadEmail"
              type="email"
              class="chat-panel__lead-input"
              placeholder="your@email.com"
              :disabled="leadSubmitting"
              @keydown.enter.prevent="submitLead"
            />
            <button
              class="chat-panel__lead-btn"
              :disabled="!leadEmail.trim() || leadSubmitting"
              @click="submitLead"
            >
              {{ leadSubmitting ? "…" : "Send" }}
            </button>
          </div>
          <p v-if="leadError" class="chat-panel__lead-error">{{ leadError }}</p>
        </div>

        <!-- Lead captured thank-you -->
        <div v-if="chat.leadCaptured && !isAppRoute" class="chat-panel__lead chat-panel__lead--thanks">
          <p class="chat-panel__lead-prompt">✓ Thanks! We'll be in touch soon.</p>
        </div>

        <!-- Input area -->
        <div class="chat-panel__input-area">
          <textarea
            v-model="input"
            class="chat-panel__textarea"
            :placeholder="isAppRoute ? 'Ask about your account, data, or features...' : 'Ask about PostCanary, pricing, features...'"
            rows="1"
            :disabled="chat.loading"
            @keydown="handleKeydown"
          />
          <button
            class="chat-panel__send"
            :disabled="!input.trim() || chat.loading"
            @click="handleSend"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4z" />
            </svg>
          </button>
        </div>

        <!-- Powered by footer -->
        <div class="chat-panel__footer">
          <span>Powered by {{ BRAND.name }} AI</span>
          <button
            v-if="!isAppRoute"
            class="chat-panel__human-link"
            @click="requestHuman"
          >
            Talk to a human →
          </button>
        </div>
      </div>
    </Transition>

    <!-- Floating trigger button -->
    <button
      class="chat-fab"
      :class="{ 'chat-fab--open': chat.open }"
      :aria-label="chat.open ? 'Close chat' : 'Open chat'"
      @click="chat.toggle()"
    >
      <Transition name="fab-icon" mode="out-in">
        <!-- Chat icon -->
        <svg v-if="!chat.open" key="chat" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <!-- Close icon -->
        <svg v-else key="close" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6L6 18" /><path d="M6 6l12 12" />
        </svg>
      </Transition>
    </button>
  </Teleport>
</template>

<style scoped>
/* ---- Floating Action Button ---- */
.chat-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: none;
  background: var(--app-navy, #0b2d50);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(11, 45, 80, 0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
}

.chat-fab:hover {
  transform: scale(1.08);
  box-shadow: 0 6px 24px rgba(11, 45, 80, 0.45);
}

.chat-fab--open {
  background: var(--app-teal, #47bfa9);
}

/* FAB icon transition */
.fab-icon-enter-active,
.fab-icon-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.fab-icon-enter-from { opacity: 0; transform: rotate(-90deg) scale(0.8); }
.fab-icon-leave-to { opacity: 0; transform: rotate(90deg) scale(0.8); }

/* ---- Chat Panel ---- */
.chat-panel {
  position: fixed;
  bottom: 96px;
  right: 24px;
  z-index: 9998;
  width: 380px;
  max-height: calc(100vh - 140px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(11, 45, 80, 0.18), 0 0 0 1px rgba(11, 45, 80, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: var(--font-family, "Instrument Sans", system-ui, sans-serif);
}

/* Panel slide-up transition */
.chat-panel-enter-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}
.chat-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.chat-panel-enter-from {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}
.chat-panel-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

/* ---- Header ---- */
.chat-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  background: var(--app-navy, #0b2d50);
  color: #ffffff;
}

.chat-panel__header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-panel__header-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #34d399;
  box-shadow: 0 0 6px rgba(52, 211, 153, 0.5);
}

.chat-panel__header-title {
  font-size: 15px;
  font-weight: 600;
}

.chat-panel__header-sub {
  font-size: 12px;
  opacity: 0.7;
}

.chat-panel__header-actions {
  display: flex;
  gap: 4px;
}

.chat-panel__icon-btn {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, background 0.15s;
}

.chat-panel__icon-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12);
}

/* ---- Messages ---- */
.chat-panel__messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 280px;
  max-height: 400px;
  scroll-behavior: smooth;
}

/* ---- Welcome ---- */
.chat-panel__welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 12px;
  color: #64748b;
}

.chat-panel__welcome-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--app-teal, #47bfa9);
  margin-bottom: 12px;
}

.chat-panel__welcome-text {
  font-size: 14px;
  line-height: 1.6;
  margin: 0 0 16px;
}

/* ---- Suggested question chips ---- */
.chat-panel__suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 4px;
}

.chat-panel__chip {
  background: transparent;
  border: 1.5px solid var(--app-teal, #47bfa9);
  color: var(--app-navy, #0b2d50);
  border-radius: 999px;
  padding: 5px 14px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  white-space: nowrap;
}

.chat-panel__chip:hover {
  background: var(--app-teal, #47bfa9);
  color: #ffffff;
}

/* ---- Error ---- */
.chat-panel__error {
  background: #fef2f2;
  color: #dc2626;
  font-size: 13px;
  padding: 8px 12px;
  border-radius: 8px;
  margin-top: 8px;
}

/* ---- Lead capture ---- */
.chat-panel__lead {
  border-top: 1px solid #e2e8f0;
  padding: 10px 16px 12px;
  background: #f8fafc;
}

.chat-panel__lead--thanks {
  background: #f0fdf4;
  border-top-color: #bbf7d0;
}

.chat-panel__lead-prompt {
  font-size: 12px;
  color: #475569;
  margin: 0 0 8px;
  font-weight: 500;
}

.chat-panel__lead--thanks .chat-panel__lead-prompt {
  color: #16a34a;
  margin: 0;
}

.chat-panel__lead-row {
  display: flex;
  gap: 6px;
}

.chat-panel__lead-input {
  flex: 1;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 12px;
  font-family: inherit;
  color: #1e293b;
  outline: none;
  transition: border-color 0.15s;
}

.chat-panel__lead-input:focus {
  border-color: var(--app-teal, #47bfa9);
}

.chat-panel__lead-btn {
  background: var(--app-navy, #0b2d50);
  color: #ffffff;
  border: none;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.15s;
  white-space: nowrap;
}

.chat-panel__lead-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.chat-panel__lead-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.chat-panel__lead-error {
  font-size: 11px;
  color: #dc2626;
  margin: 6px 0 0;
}

/* ---- Input ---- */
.chat-panel__input-area {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
}

.chat-panel__textarea {
  flex: 1;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-family: inherit;
  color: #1e293b;
  resize: none;
  outline: none;
  max-height: 80px;
  line-height: 1.4;
  transition: border-color 0.15s;
}

.chat-panel__textarea:focus {
  border-color: var(--app-teal, #47bfa9);
}

.chat-panel__textarea:disabled {
  background: #f8fafc;
  cursor: not-allowed;
}

.chat-panel__send {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: none;
  background: var(--app-teal, #47bfa9);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, opacity 0.15s;
}

.chat-panel__send:hover:not(:disabled) {
  background: var(--app-teal-hover, #3aa893);
}

.chat-panel__send:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---- Footer ---- */
.chat-panel__footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 6px 16px 10px;
  font-size: 11px;
  color: #94a3b8;
}

.chat-panel__human-link {
  background: none;
  border: none;
  padding: 0;
  font-size: 11px;
  font-family: inherit;
  color: var(--app-teal, #47bfa9);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  transition: color 0.15s;
}

.chat-panel__human-link:hover {
  color: var(--app-navy, #0b2d50);
}

/* ---- Mobile responsive ---- */
@media (max-width: 480px) {
  .chat-panel {
    inset: 0;
    width: 100%;
    max-height: none;
    border-radius: 0;
    box-shadow: none;
  }

  .chat-panel__messages {
    min-height: 0;
    max-height: none;
    flex: 1;
  }

  .chat-fab {
    bottom: 16px;
    right: 16px;
    width: 52px;
    height: 52px;
  }
}
</style>
