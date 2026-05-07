---
tracker:
  kind: linear
  project_slug: "postcanary-design-studio-r2-stabilization-19d727e52059"
  active_states:
    - Ready for Symphony
  terminal_states:
    - Done
    - Canceled
    - Cancelled
    - Duplicate
polling:
  interval_ms: 30000
workspace:
  root: ~/repos/work/PostCanary/symphony-workspaces/client
hooks:
  after_create: |
    git clone --branch feat/design-studio-r2 --single-branch https://github.com/PostCanary/client.git .
    npm install
  before_run: |
    git fetch origin feat/design-studio-r2
agent:
  max_concurrent_agents: 1
  max_turns: 8
  max_retry_backoff_ms: 300000
codex:
  command: CODEX_HOME=/Users/dustinthompson/repos/work/PostCanary/symphony-codex-home codex --config shell_environment_policy.inherit=all app-server
  approval_policy: never
  thread_sandbox: workspace-write
  turn_sandbox_policy:
    type: workspaceWrite
  turn_timeout_ms: 3600000
  stall_timeout_ms: 300000
---

You are running as an unattended Codex agent for the PostCanary `client` repository.

Linear issue: `{{ issue.identifier }}`
Title: {{ issue.title }}
Current status: {{ issue.state }}
Labels: {{ issue.labels }}
URL: {{ issue.url }}

Issue description:
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

## Mission

Implement exactly the Linear issue scope in this isolated client repository workspace.

This project is stabilizing `feat/design-studio-r2`. Treat Linear as the source of truth and open a focused PR back into `feat/design-studio-r2`.

## Eligibility gate

Only work issues that are explicitly queued in Linear state `Ready for Symphony`. Human operators decide whether an issue is safe enough to move into that state.

The issue must be client-scoped and must not involve any restricted work category. If it is outside this eligibility policy, do not edit code. Leave a concise Linear blocker note explaining why it is not agent-safe, then move it back to `In Progress`.

Restricted work categories:

- purchase, billing, Stripe, Melissa, payment, invoicing, or refund behavior
- database migrations, schema ownership changes, or production data changes
- production credentials, secrets, API keys, OAuth app settings, or deploy-provider configuration
- cross-repo client/server contract changes unless the issue explicitly names this client workflow as the owner
- Render worker contracts, background job orchestration, or queue semantics
- legal approval artifacts, compliance decisions, or user-facing policy copy that needs human approval
- direct production deploys, merges, or release promotion
- broad refactors without explicit file boundaries

## Hard guardrails

- Work only inside this workspace.
- Do not modify the user's normal checkout.
- Do not direct-push to `feat/design-studio-r2`.
- Do not target PRs at `main` unless the issue explicitly says so.
- Do not merge PRs.
- Do not change server code from this client workflow.
- If the issue is not client-scoped or is restricted by the eligibility gate, stop after leaving a concise blocker note in Linear and move the issue to `In Progress`; do not move it to `In Review` without a PR.

## Branch and PR policy

1. Start from a clean `origin/feat/design-studio-r2`.
2. Create a focused branch named from the Linear branch when available, otherwise use `dthompson/{{ issue.identifier }}-client`.
3. Keep commits logically grouped by behavior or decision.
4. Push the branch and open a draft PR targeting `feat/design-studio-r2`.
5. PR title must include the Linear issue ID.
6. PR description must include:
   - Linear issue URL
   - branch/workspace used
   - files touched
   - shared-file risk
   - validation commands and results
   - known follow-up

## Shared-file protocol

Treat these client files as shared-risk files:

- `src/components/wizard/StepReview.vue`
- `src/components/wizard/StepDesign.vue`
- `src/types/campaign.ts`
- `package.json`
- `package-lock.json`
- build/test config files

If you touch any of them, mention the risk in the PR description and Linear handoff.

## Validation

Run the narrowest meaningful checks for the issue. For build/type work, `npm run build` is required. For UI behavior, add or run the relevant Playwright check when practical. Do not weaken TypeScript strictness to make the build pass unless the Linear issue explicitly asks for that.

## Completion

Review-ready means all of these are true:

- the changes are committed on an issue-specific branch
- the branch is pushed to GitHub
- a PR is open against `feat/design-studio-r2`
- the PR URL is attached to or commented on the Linear issue
- required validation has run and the result is included in the PR/Linear handoff

Only when the branch is pushed and a PR is open:

1. Update Linear with the PR link and validation summary.
2. Move the issue to `In Review`.
3. Final response should only summarize what changed, what was verified, and blockers.

If you complete code changes but cannot push the branch or open the PR, do not move the issue to `In Review`. Leave the workspace dirty or committed locally as appropriate, add a Linear blocker note with the branch/workspace path and validation results, and move the issue to `In Progress`.
