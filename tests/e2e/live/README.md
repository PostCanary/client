# Authenticated staging QA

The live Playwright suite uses a dedicated staging-only account. Credentials
must never be committed to the repository.

1. Copy `.env.test.local.example` to `.env.test.local`.
2. Put the rotated staging QA email and password in `.env.test.local`.
3. Run `npm run test:e2e:live`.

Both live Playwright configurations load `.env.test.local`. CI should provide
the same values through its secret store instead of creating the file.

`POSTCANARY_TEST_SEED_DEMO` defaults to off. Set it to `1` only when a test run
is intentionally allowed to reset the shared QA profile, organization, and
brand kit. Login and session creation do not otherwise modify that data.

For interactive QA, sign in through the dedicated Chrome profile and reuse its
authenticated session. Do not copy the password into scripts, task messages,
screenshots, or handoff documents.
