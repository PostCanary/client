// src/stores/useCampaignDraftStore.ts
import { defineStore } from "pinia";
import type {
  CampaignDraft,
  WizardStep,
  GoalSelection,
  TargetingSelection,
  DesignSelection,
  ReviewSelection,
} from "@/types/campaign";
import {
  saveDraft,
  loadDraft,
  createDraft,
  deleteDraft,
} from "@/api/campaignDrafts";

// Module-level — NOT in Pinia state (avoids HMR/serialization issues)
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingSave = false;
let _retryCount = 0;
const MAX_RETRIES = 3;

export const useCampaignDraftStore = defineStore("campaignDraft", {
  state: () => ({
    draft: null as CampaignDraft | null,
    saving: false,
    loading: false,
    error: null as string | null,
    lastSavedAt: null as string | null,
  }),

  getters: {
    currentStep: (state) => state.draft?.currentStep ?? 1,
    isStepComplete:
      (state) =>
      (step: WizardStep): boolean =>
        state.draft?.completedSteps.includes(step) ?? false,
    needsReview:
      (state) =>
      (step: WizardStep): boolean =>
        state.draft?.needsReviewSteps.includes(step) ?? false,
    canProceed:
      (state) =>
      (step: WizardStep): boolean => {
        if (!state.draft) return false;
        return state.draft.completedSteps.includes(step);
      },
    progressPercent: (state): number => {
      if (!state.draft) return 0;
      return (state.draft.completedSteps.length / 4) * 100;
    },
  },

  actions: {
    // --- Lifecycle ---
    async startNew() {
      this.loading = true;
      this.error = null;
      try {
        const draft = await createDraft();
        this.draft = draft;
      } catch (e: any) {
        this.error = "Failed to start campaign. Please try again.";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async resume(draftId: string) {
      this.loading = true;
      this.error = null;
      try {
        this.draft = await loadDraft(draftId);
      } catch (e: any) {
        this.error = "Failed to load draft. Please try again.";
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async discard() {
      if (this.draft) {
        await deleteDraft(this.draft.id);
        this.draft = null;
      }
    },

    // --- Step Updates ---
    setGoal(goal: GoalSelection) {
      if (!this.draft) return;
      const goalChanged = this.draft.goal?.goalType !== goal.goalType;
      this.draft.goal = goal;
      this._markComplete(1);

      if (goalChanged && this.draft.completedSteps.length > 1) {
        // Flag later steps for review but DON'T wipe data
        this.draft.needsReviewSteps = [2, 3].filter((s) =>
          this.draft!.completedSteps.includes(s as WizardStep),
        ) as WizardStep[];
      }
      this._debounceSave();
    },

    setTargeting(targeting: TargetingSelection) {
      if (!this.draft) return;
      this.draft.targeting = targeting;
      this._markComplete(2);
      this._clearReview(2);
      if (this.draft.completedSteps.includes(3 as WizardStep)) {
        if (!this.draft.needsReviewSteps.includes(3 as WizardStep)) {
          this.draft.needsReviewSteps.push(3 as WizardStep);
        }
      }
      this._debounceSave();
    },

    setDesign(design: DesignSelection) {
      if (!this.draft) return;
      this.draft.design = design;
      this._markComplete(3);
      this._clearReview(3);
      this._debounceSave();
    },

    setReview(review: ReviewSelection) {
      if (!this.draft) return;
      this.draft.review = review;
      this._markComplete(4);
      this._debounceSave();
    },

    goToStep(step: WizardStep) {
      if (!this.draft) return;
      const maxStep = Math.min(
        Math.max(...this.draft.completedSteps, 0) + 1,
        4,
      ) as WizardStep;
      if (step <= maxStep) {
        this.draft.currentStep = step;
      }
    },

    // --- Internal ---
    _markComplete(step: WizardStep) {
      if (!this.draft) return;
      if (!this.draft.completedSteps.includes(step)) {
        this.draft.completedSteps.push(step);
        this.draft.completedSteps.sort();
      }
    },

    _clearReview(step: WizardStep) {
      if (!this.draft) return;
      this.draft.needsReviewSteps = this.draft.needsReviewSteps.filter(
        (s) => s !== step,
      );
    },

    _debounceSave() {
      if (_saveTimer) clearTimeout(_saveTimer);
      _saveTimer = setTimeout(() => this._save(), 5000);
    },

    async _save() {
      if (!this.draft) return;
      if (this.saving) {
        _pendingSave = true;
        return;
      }
      this.saving = true;
      try {
        await saveDraft(this.draft);
        this.lastSavedAt = new Date().toISOString();
        this.error = null;
        _retryCount = 0;
      } catch {
        if (_retryCount < MAX_RETRIES) {
          _retryCount++;
          this.error = "Save failed — retrying...";
          setTimeout(() => this._save(), 10000 * _retryCount);
        } else {
          this.error =
            "Unable to save. Your work may be lost if you leave this page.";
          _pendingSave = false;
        }
      } finally {
        this.saving = false;
        if (_pendingSave) {
          _pendingSave = false;
          await this._save();
        }
      }
    },

    async saveNow() {
      if (_saveTimer) clearTimeout(_saveTimer);
      await this._save();
    },
  },
});
