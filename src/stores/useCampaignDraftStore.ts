// src/stores/useCampaignDraftStore.ts
import { defineStore } from "pinia";
import type {
  CampaignDraft,
  CardDesign,
  TemplateLayoutType,
  WizardStep,
  GoalSelection,
  TargetingSelection,
  DesignSelection,
  ReviewSelection,
  AudienceWizardState,
} from "@/types/campaign";
import type {
  AudienceCostPreview,
  AudienceSuppressionResult,
} from "@/types/audiences";
import {
  saveDraft,
  loadDraft,
  createDraft,
  deleteDraft,
} from "@/api/campaignDrafts";
import { API_BASE } from "@/api/http";
import { generateCards } from "@/composables/usePostcardGenerator";
import {
  getRecommendedTemplateSet,
  getTemplateSetsForGoal,
  renderTemplateIdForLayout,
} from "@/data/templates";
import type { CampaignGoalType } from "@/types/campaign";
import { disarmScrapeRegenWatcher } from "@/composables/scrapeRegenState";

// Module-level — NOT in Pinia state (avoids HMR/serialization issues)
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
let _pendingSave = false;
let _retryCount = 0;
let _dirty = false;
let _generatingCards = false;
// Bumped on every setDesign. generateCardsForDraft captures it before its
// AI calls and refuses to stomp a design the user modified meanwhile —
// generation completing late used to silently revert e.g. a layout switch
// made during the generation window (S73 live-observed race).
let _designRevision = 0;
let _saveChain: Promise<void> | null = null;
let _saveRevision = 0;
const MAX_RETRIES = 3;
const KEEPALIVE_MAX_BYTES = 60000; // 60KB conservative limit (browser spec is 64KB)

export const useCampaignDraftStore = defineStore("campaignDraft", {
  state: () => ({
    draft: null as CampaignDraft | null,
    saving: false,
    loading: false,
    error: null as string | null,
    lastSavedAt: null as string | null,
    audienceId: null as string | null,
    audienceSource: null as "csv" | "existing" | null,
    suppressionResult: null as AudienceSuppressionResult | null,
    costPreview: null as AudienceCostPreview | null,
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
    isDirty: (): boolean => _dirty,
  },

  actions: {
    /** Exposes the module-level generation-in-flight flag so callers
     * outside this store (useScrapeRegenWatcher's precondition check and
     * its "disable Refresh / never drop the click" backstop) don't need
     * their own tracking. Deliberately an ACTION, not a getter: Pinia
     * getters are Vue `computed()`s, which cache forever once read if
     * they touch zero reactive dependencies — exactly the case here,
     * since `_generatingCards` is a plain module closure variable (kept
     * out of Pinia state on purpose, see the comment up top). A cached
     * getter would freeze at whatever value it saw on its first read,
     * which silently broke a polling loop that reads it every 200ms.
     * A plain function call always re-reads the live value. */
    isGeneratingCards(): boolean {
      return _generatingCards;
    },

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
    setCampaignType(type: 'targeted' | 'eddm') {
      if (!this.draft) return;
      this.draft.campaignType = type;
      this._debounceSave();
    },

    setGoal(goal: GoalSelection) {
      if (!this.draft) return;
      const goalChanged = this.draft.goal?.goalType !== goal.goalType;
      this.draft.goal = goal;
      this._markComplete(1);

      if (goalChanged && this.draft.completedSteps.length > 1) {
        // Flag later steps for review but DON'T wipe data
        // Include step 4 (Review) — cost/schedule data depends on goal
        this.draft.needsReviewSteps = [2, 3, 4].filter((s) =>
          this.draft!.completedSteps.includes(s as WizardStep),
        ) as WizardStep[];
      }
      this._debounceSave();
      this.generateCardsForDraft();
    },

    setTargeting(targeting: TargetingSelection) {
      if (!this.draft) return;
      this.draft.targeting = targeting;
      this._markComplete(2);
      this._clearReview(2);
      // Flag steps 3 and 4 for review — cost/schedule data depends on targeting
      for (const step of [3, 4] as WizardStep[]) {
        if (this.draft.completedSteps.includes(step)) {
          if (!this.draft.needsReviewSteps.includes(step)) {
            this.draft.needsReviewSteps.push(step);
          }
        }
      }
      this._debounceSave();
    },

    setAudienceState(audience: Partial<AudienceWizardState>) {
      if (!this.draft) return;
      const current: AudienceWizardState = this.draft.audience ?? {
        audienceId: null,
        audienceSource: null,
        suppressionResult: null,
        costPreview: null,
      };
      this.draft.audience = { ...current, ...audience };
      this._debounceSave();
    },

    approveAudienceState(audience: Partial<AudienceWizardState>) {
      if (!this.draft) return;
      this.setAudienceState(audience);
      this._markComplete(2);
      this._clearReview(2);
      for (const step of [3, 4] as WizardStep[]) {
        if (this.draft.completedSteps.includes(step) && !this.draft.needsReviewSteps.includes(step)) {
          this.draft.needsReviewSteps.push(step);
        }
      }
      this._debounceSave();
    },

    /**
     * `opts.source` distinguishes a customer edit ("user", the default)
     * from a system/AI mutation ("system" — full (re)generation and the
     * review-defaults auto-fill in StepDesign's onMounted/hydration
     * watchers). Only a "user" source marks the draft as no-longer-
     * pristine (`designUserEdited`); "system" deliberately leaves the
     * flag alone so a review-defaults touch-up on top of an already-
     * edited design doesn't erase that the user edited it (AI-scrape-
     * triggers spec edge case #11 vs #9). generateCardsForDraft() is
     * responsible for explicitly clearing the flag back to false on a
     * full regeneration — see there.
     *
     * Step 3's completion checkmark follows the same "user" vs "system"
     * split (POS-138): a system write (auto-generation, review-defaults
     * touch-up) populates the cards but must NOT complete the step —
     * Pete's bug was a brand-new campaign showing step 3 complete before
     * the customer ever looked at it. Only an actual customer edit here
     * completes it; the explicit "I looked at this" path for someone who
     * never edits anything is `markDesignReviewed()`, called from
     * WizardShell's goNext when leaving step 3 forward.
     */
    setDesign(design: DesignSelection, opts?: { source?: "user" | "system" }) {
      if (!this.draft) return;
      _designRevision++;
      this.draft.design = design;
      if ((opts?.source ?? "user") === "user") {
        this.draft.designUserEdited = true;
        this._markComplete(3);
      }
      this._clearReview(3);
      this._debounceSave();
    },

    /**
     * Single-owner write path for the design step's card sequence
     * (StepDesign refactor 2026-07-07). StepDesign no longer keeps a local
     * `cards` mirror — it reads `draft.design.sequenceCards` through a
     * computed and every mutation lands here, so a store write from any
     * other source (AI generation, hydration) can never be clobbered by a
     * stale local copy (POS-121/123/119.2 bug class).
     *
     * `opts.layout` updates templateLayoutType in the same write (template
     * switches); omitted, the current layout is preserved. `opts.source`
     * forwards to setDesign's user/system pristine-tracking split.
     */
    setSequenceCards(
      cards: CardDesign[],
      opts?: { source?: "user" | "system"; layout?: TemplateLayoutType },
    ) {
      if (!this.draft) return;
      this.setDesign(
        {
          templateId: cards[0]?.templateId ?? "",
          templateLayoutType:
            opts?.layout ??
            this.draft.design?.templateLayoutType ??
            "full-bleed",
          isCustomUpload: false,
          customUploadUrl: null,
          sequenceCards: cards,
        },
        opts,
      );
    },

    /** Explicit "I reviewed step 3" signal for the case where the user
     * never edits a card — completes the step and clears it from review
     * without requiring a real design change. Fired by WizardShell's
     * goNext when advancing past step 3 (POS-138). */
    markDesignReviewed() {
      if (!this.draft) return;
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

    setAudienceSource(source: "csv" | "existing") {
      this.audienceSource = source;
    },

    setAudienceId(audienceId: string | null) {
      this.audienceId = audienceId;
    },

    setSuppressionResult(result: AudienceSuppressionResult | null) {
      this.suppressionResult = result;
    },

    setCostPreview(preview: AudienceCostPreview | null) {
      this.costPreview = preview;
    },

    clearAudienceState() {
      this.audienceId = null;
      this.audienceSource = null;
      this.suppressionResult = null;
      this.costPreview = null;
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
      _dirty = true;
      _saveRevision++;
      if (_saveTimer) clearTimeout(_saveTimer);
      // 500ms < useCardPreview's 1500ms preview debounce so the server
      // has the latest card content before `preview-card` fetches. Prior
      // value (5000ms) caused the preview endpoint to render stale DB
      // rows after edits (Session 57 — edit headline did not propagate
      // to the rendered PNG until the component remounted).
      _saveTimer = setTimeout(() => this._save(), 500);
    },

    async _save() {
      if (!this.draft) return;
      // MOCK MODE: skip API save
      if (import.meta.env.VITE_SKIP_AUTH === "true") {
        this.lastSavedAt = new Date().toISOString();
        return;
      }
      if (this.saving) {
        _pendingSave = true;
        if (_saveChain) await _saveChain;
        return;
      }
      const draftToSave = this.draft;
      this.saving = true;
      const saveRevisionAtStart = _saveRevision;
      const savePromise = (async () => {
      try {
        await saveDraft(draftToSave);
        this.lastSavedAt = new Date().toISOString();
        this.error = null;
        _retryCount = 0;
        if (_saveRevision === saveRevisionAtStart) {
          _dirty = false;
        } else {
          _pendingSave = true;
        }
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
      })();
      _saveChain = savePromise;
      try {
        await savePromise;
      } finally {
        if (_saveChain === savePromise) {
          _saveChain = null;
        }
      }
    },

    async saveNow() {
      if (_saveTimer) clearTimeout(_saveTimer);
      await this._save();
    },

    async generateCardsForDraft() {
      if (!this.draft || _generatingCards) return;
      // Captured before ANY await so every design edit after this call
      // starts counts as a mid-generation modification.
      const revisionAtStart = _designRevision;

      const { useBrandKitStore } = await import("@/stores/useBrandKitStore");
      const brandKitStore = useBrandKitStore();
      if (!brandKitStore.hydrated || !brandKitStore.brandKit) return;

      _generatingCards = true;
      try {
        // S89 Fix B ordering: goal selection (Step 1) fires generation
        // before Step 3's backfill scrape has a chance to run, so the
        // first campaign was always built from a sparse kit. If a scan
        // is already in flight, wait for it to settle (or time out) so
        // `brandKitStore.brandKit` below reflects the fresh kit — the
        // reference is read live, AFTER the await, never cached stale.
        // Disarm useScrapeRegenWatcher's own handling of this same run's
        // settle transition — this call is already consuming it, so the
        // watcher must not ALSO auto-refresh/prompt for it.
        if (brandKitStore.brandKit?.scrapeStatus === "scraping") {
          disarmScrapeRegenWatcher();
          await brandKitStore.waitForScrapeSettled();
        }

        const goalType = (this.draft.goal?.goalType ?? "neighbor_marketing") as CampaignGoalType;
        const seqLen = this.draft.goal?.sequenceLength ?? 3;
        const breakdown = this.draft.targeting?.recipientBreakdown ?? {
          newProspects: 400,
          pastCustomers: 30,
          pastCustomersIncluded: false,
        };

        const cards = await generateCards(
          brandKitStore.brandKit,
          goalType,
          seqLen,
          breakdown,
        );

        // S73 race fix: the user edited the design while the AI calls were
        // in flight. Their cards are what's on screen — never replace them
        // silently. (Pre-fix this reverted e.g. a layout switch made
        // during the generation window.)
        const userModified = _designRevision !== revisionAtStart;
        const currentCards = this.draft.design?.sequenceCards ?? [];
        if (userModified && currentCards.length > 0) {
          console.warn(
            "generateCardsForDraft: design edited during generation — keeping the user's cards",
          );
          return;
        }

        const templates = getRecommendedTemplateSet(
          goalType,
          brandKitStore.brandKit?.industry,
        );
        let layoutType = templates[0]?.layoutType ?? "full-bleed";
        let outCards = cards;
        // A card-less mid-generation edit is a layout pick (selectTemplate
        // over zero cards stores only templateLayoutType): apply the
        // generated cards but remap them onto the user's chosen layout.
        if (userModified && this.draft.design?.templateLayoutType) {
          const keptLayout = this.draft.design.templateLayoutType;
          const set = getTemplateSetsForGoal(
            goalType,
            brandKitStore.brandKit?.industry,
          ).find(
            (s) => s.layout === keptLayout,
          );
          const renderTemplateId = renderTemplateIdForLayout(keptLayout);
          if (set) {
            layoutType = keptLayout;
            outCards = cards.map((card) => ({
              ...card,
              templateId:
                set.templates.find(
                  (template) => template.cardPosition === card.cardPurpose,
                )?.id ?? card.templateId,
              ...(renderTemplateId ? { renderTemplateId } : {}),
            }));
          }
        }
        this.setDesign(
          {
            templateId: outCards[0]?.templateId ?? "",
            templateLayoutType: layoutType,
            isCustomUpload: false,
            customUploadUrl: null,
            sequenceCards: outCards,
          },
          { source: "system" },
        );
        // A full (re)generation produces system content — pristine by
        // definition, including the "Refresh designs" banner path where
        // this explicitly un-does a prior user edit's flag. EXCEPT the
        // remap path just above: a card-less mid-generation layout pick
        // is a real customer choice, and marking the draft pristine here
        // would let a later post-scrape auto-refresh silently revert
        // their layout to the recommended one. Keep them "edited" so
        // that case prompts instead.
        this.draft.designUserEdited = userModified;
      } catch (err) {
        console.error("Card generation failed in store:", err);
      } finally {
        _generatingCards = false;
      }
    },

    /** Best-effort save that survives tab close via fetch keepalive. */
    beaconSave() {
      if (!this.draft || !_dirty) return;
      // Mirror _save() guards
      if (import.meta.env.VITE_SKIP_AUTH === "true") {
        this.lastSavedAt = new Date().toISOString();
        _dirty = false;
        return;
      }
      const payload = {
        current_step: this.draft.currentStep,
        completed_steps: this.draft.completedSteps,
        needs_review_steps: this.draft.needsReviewSteps,
        data: {
          campaignType: this.draft.campaignType,
          goal: this.draft.goal,
          targeting: this.draft.targeting,
          audience: this.draft.audience,
          design: this.draft.design,
          review: this.draft.review,
        },
      };
      const body = JSON.stringify(payload);
      // If payload exceeds keepalive limit, skip — debounce/route-leave covers most cases
      if (body.length > KEEPALIVE_MAX_BYTES) return;
      fetch(`${API_BASE}/api/campaign-drafts/${this.draft.id}`, {
        method: "PUT",
        keepalive: true,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        body,
      });
      // Don't clear _dirty — no success confirmation from keepalive fetch
    },
  },
});
