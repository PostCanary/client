# Symphony Pilot

This repository is prepared for a cautious Symphony pilot against the Linear project `PostCanary Design Studio R2 Stabilization`.

## What Symphony Should Do Here

- Watch the Linear project for `Ready for Symphony` issues.
- Create an isolated workspace per issue under `~/repos/work/PostCanary/symphony-workspaces/client`.
- Clone `PostCanary/client` from `feat/design-studio-r2`.
- Run Codex in app-server mode against the issue.
- Push a focused branch and open a PR targeting `feat/design-studio-r2`.
- Move the issue to `In Review` for human review.

## First Pilot Issue

Use a single client-only issue first:

- `POS-70 Restore client build on feat/design-studio-r2`

Move only that issue to `Ready for Symphony` when ready. Leave unrelated issues in `Backlog` or `In Progress` so the pilot daemon does not pick them up.

## Local Setup

Symphony's reference implementation currently expects Elixir/Erlang managed by `mise`. If `mise` is missing:

```bash
brew install mise
```

Then install and build Symphony:

```bash
git clone https://github.com/openai/symphony ~/repos/work/PostCanary/symphony
cd ~/repos/work/PostCanary/symphony/elixir
mise trust
mise install
mise exec -- mix setup
mise exec -- mix build
```

Set a Linear personal API key:

```bash
export LINEAR_API_KEY=...
```

Run the client pilot daemon:

```bash
cd ~/repos/work/PostCanary/symphony/elixir
mise exec -- ./bin/symphony ~/repos/work/PostCanary/client/WORKFLOW.md --logs-root ~/repos/work/PostCanary/symphony-logs/client --port 4051
```

If testing before this branch is merged, point the workflow path at the setup worktree:

```bash
mise exec -- ./bin/symphony ~/repos/work/PostCanary/client-symphony-setup/WORKFLOW.md --logs-root ~/repos/work/PostCanary/symphony-logs/client --port 4051
```

## Operating Rules

- Run only one PostCanary Symphony daemon at a time until repo filtering is proven.
- Put exactly one issue into `Ready for Symphony` for the first pilot.
- Do not use Symphony for migrations, billing, Melissa purchase behavior, render-worker contract changes, or legal approval artifact decisions until the pilot has produced a clean reviewed PR.
- Keep human review as the merge gate.
