// src/composables/usePostHog.ts
// Central module for PostHog analytics integration.

import posthog from "posthog-js";

const API_KEY = import.meta.env.VITE_POSTHOG_API_KEY as string | undefined;
const API_HOST = (import.meta.env.VITE_POSTHOG_API_HOST as string) || "https://us.i.posthog.com";

let initialized = false;

/**
 * Initialize PostHog. Safe to call repeatedly — no-ops after the first call.
 */
export function initPostHog(): void {
  if (initialized || !API_KEY) return;

  posthog.init(API_KEY, {
    api_host: API_HOST,
    capture_pageview: false, // We handle pageviews manually in the router
    capture_pageleave: true,
  });

  initialized = true;
}

/**
 * Capture a pageview event with the current URL.
 */
export function capturePageview(): void {
  if (!initialized) return;
  posthog.capture("$pageview");
}

/**
 * Capture a custom event.
 */
export function captureEvent(
  eventName: string,
  properties?: Record<string, unknown>,
): void {
  if (!initialized) return;
  posthog.capture(eventName, properties);
}

/**
 * Identify a user (call after login).
 */
export function identifyUser(
  distinctId: string,
  properties?: Record<string, unknown>,
): void {
  if (!initialized) return;
  posthog.identify(distinctId, properties);
}

/**
 * Reset identity (call on logout).
 */
export function resetUser(): void {
  if (!initialized) return;
  posthog.reset();
}

export { posthog };
