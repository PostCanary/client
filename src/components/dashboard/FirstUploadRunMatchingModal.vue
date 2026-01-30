<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="first-upload-modal-overlay"
      @click.self="handleClose"
    >
      <div class="first-upload-modal">
        <div class="modal-header">
          <h2 class="modal-title">Ready to Run Matching?</h2>
          <p class="modal-subtitle">
            Your data has been uploaded and normalized. Run matching to see your results.
          </p>
        </div>

        <div class="modal-body">
          <div class="info-section">
            <div class="info-item">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Data normalized successfully</span>
            </div>
            <div class="info-item">
              <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              <span>Ready for matching</span>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button
            type="button"
            class="btn-secondary"
            @click="handleClose"
          >
            Skip for now
          </button>
          <button
            type="button"
            class="btn-primary"
            :disabled="loading"
            @click="handleRunMatching"
          >
            <span v-if="!loading">Run Matching</span>
            <span v-else>Running...</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">

const props = withDefaults(
  defineProps<{
    open: boolean;
    loading?: boolean;
  }>(),
  {
    loading: false,
  }
);

const emit = defineEmits<{
  (e: "close"): void;
  (e: "run-matching"): void;
}>();

function handleClose() {
  if (!props.loading) {
    emit("close");
  }
}

function handleRunMatching() {
  if (!props.loading) {
    emit("run-matching");
  }
}
</script>

<style scoped>
.first-upload-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.first-upload-modal {
  position: relative;
  z-index: 10001;
  max-width: 520px;
  width: 90%;
  margin: 0 16px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 24px 70px rgba(11, 45, 80, 0.25);
  padding: 32px;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-title {
  font-size: 24px;
  font-weight: 600;
  color: #0b2d4f;
  margin: 0 0 8px 0;
}

.modal-subtitle {
  font-size: 16px;
  color: #64748b;
  margin: 0;
  line-height: 1.5;
}

.modal-body {
  margin-bottom: 24px;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  font-size: 14px;
  color: #475569;
}

.info-icon {
  width: 20px;
  height: 20px;
  color: #47bfa9;
  flex-shrink: 0;
}

.modal-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn-primary {
  padding: 10px 24px;
  border-radius: 8px;
  border: none;
  background: #47bfa9;
  color: #ffffff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #3aa893;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 10px 24px;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
  background: #ffffff;
  color: #475569;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover:not(:disabled) {
  background: #f8fafc;
}

@media (max-width: 640px) {
  .first-upload-modal {
    padding: 24px;
  }

  .modal-title {
    font-size: 20px;
  }

  .modal-subtitle {
    font-size: 14px;
  }

  .modal-footer {
    flex-direction: column-reverse;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
