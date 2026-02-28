// src/composables/useMetaPixel.ts
// Central module for all Meta Pixel (client-side) event firing.

const PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

let initialized = false;

/**
 * Initialize the Meta Pixel. Safe to call repeatedly — no-ops after the first call.
 */
export function initMetaPixel(): void {
  if (initialized || !PIXEL_ID || typeof window.fbq !== "function") return;
  window.fbq("init", PIXEL_ID);
  initialized = true;
}

/**
 * Generate a unique event ID for client/server deduplication.
 */
export function generateEventId(): string {
  return crypto.randomUUID();
}

/**
 * Core tracker — fires a Pixel event. Returns the event_id used.
 * Gracefully no-ops when the pixel is missing or blocked.
 */
export function trackMetaEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string,
): string | undefined {
  if (!PIXEL_ID || typeof window.fbq !== "function") return undefined;

  const eid = eventId ?? generateEventId();
  const options: Record<string, string> = { eventID: eid };

  if (params) {
    window.fbq("track", eventName, params, options);
  } else {
    window.fbq("track", eventName, {}, options);
  }
  return eid;
}

// ── Convenience wrappers ──────────────────────────────────────────

export function trackPageView(): string | undefined {
  return trackMetaEvent("PageView");
}

export function trackViewContent(params?: Record<string, unknown>): string | undefined {
  return trackMetaEvent("ViewContent", params);
}

export function trackLead(params?: Record<string, unknown>, eventId?: string): string | undefined {
  return trackMetaEvent("Lead", params, eventId);
}

export function trackCompleteRegistration(
  params?: Record<string, unknown>,
  eventId?: string,
): string | undefined {
  return trackMetaEvent("CompleteRegistration", params, eventId);
}

export function trackInitiateCheckout(
  params?: Record<string, unknown>,
  eventId?: string,
): string | undefined {
  return trackMetaEvent("InitiateCheckout", params, eventId);
}

export function trackSchedule(params?: Record<string, unknown>): string | undefined {
  return trackMetaEvent("Schedule", params);
}
