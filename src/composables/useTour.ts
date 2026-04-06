// src/composables/useTour.ts
import { ref } from "vue";
import { useRouter } from "vue-router";
import Shepherd from "shepherd.js";
import type { StepOptions, StepOptionsButton } from "shepherd.js";
import { tourSteps } from "@/config/tourSteps";
import { useAuthStore } from "@/stores/auth";
import { updateUserProfile } from "@/api/users";

let tourInstance: InstanceType<typeof Shepherd.Tour> | null = null;
const isActive = ref(false);

export function useTour() {
  const router = useRouter();
  const auth = useAuthStore();

  function waitForElement(selector: string, timeout = 3000): Promise<Element | null> {
    return new Promise((resolve) => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const start = Date.now();
      const interval = setInterval(() => {
        const el = document.querySelector(selector);
        if (el || Date.now() - start > timeout) {
          clearInterval(interval);
          resolve(el || null);
        }
      }, 100);
    });
  }

  function buildSteps(): StepOptions[] {
    const total = tourSteps.length;

    return tourSteps.map((def, index) => {
      const isFirst = index === 0;
      const isLast = index === total - 1;

      const buttons: StepOptionsButton[] = [];

      // Skip tour (text link, left-aligned)
      if (!isLast) {
        buttons.push({
          text: "Skip tour",
          classes: "shepherd-button shepherd-button-skip",
          action() {
            tourInstance?.cancel();
          },
        });
      }

      // Back button (not on first step)
      if (!isFirst) {
        buttons.push({
          text: "Back",
          classes: "shepherd-button shepherd-button-secondary",
          action() {
            tourInstance?.back();
          },
        });
      }

      // Next / Done button
      buttons.push({
        text: isLast ? "Done" : "Next",
        classes: "shepherd-button shepherd-button-primary",
        action() {
          if (isLast) {
            tourInstance?.complete();
          } else {
            tourInstance?.next();
          }
        },
      });

      return {
        id: def.id,
        title: def.title,
        text: `<div class="shepherd-step-counter">Step ${index + 1} of ${total}</div><p>${def.text}</p>`,
        attachTo: {
          element: def.attachTo.element,
          on: def.attachTo.on as any,
        },
        buttons,
        beforeShowPromise() {
          return new Promise<void>(async (resolve) => {
            const currentPath = router.currentRoute.value.path;
            if (currentPath !== def.page) {
              await router.push(def.page);
              // Wait for route + DOM to settle
              await new Promise((r) => setTimeout(r, 400));
            }
            // Wait for the target element to appear
            await waitForElement(def.attachTo.element);
            resolve();
          });
        },
      };
    });
  }

  async function markTourCompleted() {
    try {
      await updateUserProfile({ tour_completed: true });
      await auth.fetchMe();
    } catch (err) {
      console.error("[tour] Failed to persist tour_completed", err);
    }
  }

  function startTour() {
    // Destroy any existing instance
    if (tourInstance) {
      tourInstance.cancel();
      tourInstance = null;
    }

    tourInstance = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        scrollTo: { behavior: "smooth", block: "center" },
        cancelIcon: { enabled: true },
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 12,
      },
    });

    tourInstance.addSteps(buildSteps());

    tourInstance.on("complete", async () => {
      isActive.value = false;
      await markTourCompleted();
      if (router.currentRoute.value.path !== "/app/home") {
        router.push("/app/home");
      }
    });

    tourInstance.on("cancel", async () => {
      isActive.value = false;
      await markTourCompleted();
      if (router.currentRoute.value.path !== "/app/home") {
        router.push("/app/home");
      }
    });

    isActive.value = true;
    tourInstance.start();
  }

  function stopTour() {
    if (tourInstance) {
      tourInstance.cancel();
      tourInstance = null;
    }
    isActive.value = false;
  }

  return { isActive, startTour, stopTour };
}
