<!-- src/components/chat/ChatMessage.vue -->
<script setup lang="ts">
import type { DisplayMessage } from "@/stores/chat";

defineProps<{ message: DisplayMessage }>();

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
</script>

<template>
  <div class="chat-msg" :class="[`chat-msg--${message.role}`]">
    <!-- Avatar -->
    <div v-if="message.role === 'assistant'" class="chat-msg__avatar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 2a4 4 0 0 1 4 4v2a4 4 0 0 1-8 0V6a4 4 0 0 1 4-4Z" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M4 21v-2a4 4 0 0 1 3-3.87" />
        <circle cx="12" cy="14" r="4" />
      </svg>
    </div>

    <div class="chat-msg__body">
      <!-- Bubble -->
      <div class="chat-msg__bubble" :class="{ 'chat-msg__bubble--streaming': message.streaming }">
        <span>{{ message.content }}</span>
        <span v-if="message.streaming && !message.content" class="chat-msg__typing">
          <span class="dot" /><span class="dot" /><span class="dot" />
        </span>
      </div>

      <!-- Timestamp -->
      <div class="chat-msg__time">{{ formatTime(message.timestamp) }}</div>
    </div>
  </div>
</template>

<style scoped>
.chat-msg {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  align-items: flex-end;
}

.chat-msg--user {
  flex-direction: row-reverse;
}

.chat-msg__avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--app-teal, #47bfa9);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.chat-msg__body {
  max-width: 80%;
  display: flex;
  flex-direction: column;
}

.chat-msg--user .chat-msg__body {
  align-items: flex-end;
}

.chat-msg__bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.chat-msg--assistant .chat-msg__bubble {
  background: #f0f2f5;
  color: #1e293b;
  border-bottom-left-radius: 4px;
}

.chat-msg--user .chat-msg__bubble {
  background: var(--app-navy, #0b2d50);
  color: #ffffff;
  border-bottom-right-radius: 4px;
}

.chat-msg__bubble--streaming {
  border: 1px solid var(--app-teal, #47bfa9);
}

.chat-msg__time {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
  padding: 0 4px;
}

/* Typing indicator dots */
.chat-msg__typing {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 2px 0;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #94a3b8;
  animation: bounce 1.2s infinite;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-4px); }
}
</style>
