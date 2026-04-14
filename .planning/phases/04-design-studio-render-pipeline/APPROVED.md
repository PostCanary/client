# APPROVED — Phase 04: Design Studio Render Pipeline

**Approved by:** Drake
**Approved on:** 2026-04-14
**Approved in session:** 47
**Plan file:** `./PLAN.md` (v6 — final)

## Review chain

| Step | Reviewer | Finding | Result |
|---|---|---|---|
| 1 | Reilly (deep file loaded) | Vagueness audit → concrete API contracts | Applied in v2 |
| 2 | Cantrill (deep file loaded) | Abstraction leaks + stopping rule | 6 pre-execution spikes added |
| 3 | Beck (deep file loaded) | TDD + genie-trick mitigation | Golden-master + immutable snapshots |
| 4 | Hunt (deep file loaded) | IDOR on PDF delivery + HMAC | Signed URL + canonical HMAC + replay protection |
| 5 | Codex v1 | FAIL 92% — 2 CRITICAL + 5 HIGH + 5 MEDIUM + 1 LOW | Revised to v2 |
| 6 | Codex v2 | FAIL 94% — 2 HIGH + 2 MEDIUM | Revised to v3 |
| 7 | Codex v3 | FAIL 92% — 2 MEDIUM + 2 LOW | Revised to v4 |
| 8 | Codex v4 | FAIL 92% — 1 MEDIUM + 1 LOW | Revised to v5 |
| 9 | Codex v5 | FAIL 94% — 1 typed-example nit | Revised to v6 |
| 10 | **Codex v6** | **PASS 96%** | ✓ |
| 11 | Drake signoff | "whatever you recommend" + prior "ok as long as experts and codex agree" + v6 PASS summary | ✓ |

## External research used

- Figma API limitations research (Session 47 Exa+Firecrawl agent) — proved REST is read-only, plugins need active session, PDF is RGB-only
- Figma→CMYK pipeline research (Session 47 Exa+Firecrawl agent) — established Ghostscript + GRACoL2013_CRPC6 + `-dBlackPtComp=1` as post-demo path
- `experts-template-pipeline.md` (Session 43 synthesis, 47 sources) — variable data patterns, print production, font licensing

## Verification steps run before signoff

- `git status` + `git log -10` + `git branch --show-current` on both server and client repos
- `grep -r celery app/` on server — confirmed Celery+Redis don't exist (drove DB-backed decision)
- Read `campaign_drafts.py` blueprint, `CampaignDraft` model at `models.py:1273`, `Campaign` model at `:205` — confirmed distinct resources
- Read `client/src/types/campaign.ts:237-263` — confirmed exact `CardDesign.resolvedContent` and `backContent` shapes for RenderContext DTO

## Execution unlocks

This file's presence unlocks execution of Phase 04 per build-skill convention and (partially) planning-discipline-gate. First execution step is the 6-spike pre-execution phase (see PLAN.md § "Spikes Required Before Phase 4B Execution").

## Deferred work (do NOT forget — tracked in session 47 tasks)

- Ghostscript CMYK (post-demo) — task #5
- veraPDF preflight (post-demo) — task #6
- 1 Vision integration (blocked on Peter) — task #7
- Back of postcard (post-demo) — task #8
- Email Peter with 3 spec questions — task #9
- Dustin coordination on render-worker Railway service — task #10 (pre-Phase 4B)
- Celery+Redis migration (if volume requires)
- Approval artifact flow (front+back + signed/immutable proof, legal hold) — future phase
