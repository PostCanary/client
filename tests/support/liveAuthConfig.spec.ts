import { describe, expect, it } from "vitest";

import { readLiveAuthConfig } from "./liveAuthConfig";

describe("readLiveAuthConfig", () => {
  it("fails closed when either credential is missing", () => {
    expect(() => readLiveAuthConfig({})).toThrow(
      "Missing required POSTCANARY_TEST_EMAIL",
    );
    expect(() =>
      readLiveAuthConfig({ POSTCANARY_TEST_EMAIL: "qa@example.com" }),
    ).toThrow("Missing required POSTCANARY_TEST_PASSWORD");
  });

  it("rejects whitespace-only credential values", () => {
    expect(() =>
      readLiveAuthConfig({
        POSTCANARY_TEST_EMAIL: "  ",
        POSTCANARY_TEST_PASSWORD: "secret",
      }),
    ).toThrow("Missing required POSTCANARY_TEST_EMAIL");
  });

  it("does not seed shared demo data unless explicitly enabled", () => {
    const baseEnvironment = {
      POSTCANARY_TEST_EMAIL: " qa@example.com ",
      POSTCANARY_TEST_PASSWORD: " secret with spaces ",
    };

    expect(readLiveAuthConfig(baseEnvironment)).toEqual({
      email: "qa@example.com",
      password: " secret with spaces ",
      seedDemoData: false,
    });
    expect(
      readLiveAuthConfig({
        ...baseEnvironment,
        POSTCANARY_TEST_SEED_DEMO: "1",
      }).seedDemoData,
    ).toBe(true);
  });
});
