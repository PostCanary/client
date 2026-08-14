# Client release gate and production policy

POS-210 adds a required client release gate. Repository branch protection must require both GitHub Actions jobs before a paired client and server promotion.

## Release checks

The static gate runs TypeScript checks, all unit tests, focused API-contract and tenant-isolation tests, and the production build. The build also checks the final artifact for public source maps and QA route paths.

The browser gate runs the same mock release flows in desktop Chromium, mobile Chromium, and WebKit. It covers authentication, organization switching, upload and matching, review and approval, billing and payment recovery, campaign status, keyboard focus, and automated WCAG A and AA checks.

These tests do not call PrintCom or another live vendor.

## QA routes

QA routes are present in local Vite development only. A protected QA preview can set `VITE_ENABLE_QA_ROUTES=1`. Normal production builds must not set this value. The production-policy check fails if a QA route path is in `dist`.

## Source maps and Sentry

Public production source maps are disabled. Runtime Sentry reporting stays active when `VITE_SENTRY_DSN` is set.

Do not enable production source maps until the release workflow has a private Sentry upload step with an organization, project, and scoped auth token. That future step must upload hidden maps and remove them before deployment.

## Content Security Policy

Vercel applies CSP and standard browser security headers to all routes. The allowlist contains the APIs, map tiles, fonts, Sentry, PostHog, Google Tag Manager, ActiveCampaign, and Meta endpoints used by the client.

The current tracker bootstrap in `index.html` needs inline script permission. This is a known limit. Move those bootstraps to external first-party files or add per-response nonces before removing `'unsafe-inline'`.
