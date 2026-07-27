export type LiveAuthEnvironment = Record<string, string | undefined>;

function requireEnvironmentValue(
  name: string,
  environment: LiveAuthEnvironment,
): string {
  const value = environment[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required ${name}. Configure the staging QA credential through the environment; no repository fallback is available.`,
    );
  }
  return value;
}

export function readLiveAuthConfig(
  environment: LiveAuthEnvironment = process.env,
) {
  return {
    email: requireEnvironmentValue(
      "POSTCANARY_TEST_EMAIL",
      environment,
    ).trim(),
    password: requireEnvironmentValue(
      "POSTCANARY_TEST_PASSWORD",
      environment,
    ),
    seedDemoData: environment.POSTCANARY_TEST_SEED_DEMO?.trim() === "1",
  };
}
