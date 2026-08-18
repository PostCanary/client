import { describe, expect, it } from "vitest";
import { hasSignedOutQuery, logoutRedirectUrl } from "./sessionLogout";

describe("sessionLogout", () => {
  it("builds a top-level logout URL that returns to marketing home", () => {
    expect(logoutRedirectUrl("https://client.example")).toBe(
      "/auth/logout?next=https%3A%2F%2Fclient.example%2F",
    );
  });

  it("detects the signed_out query used to keep /login off setup", () => {
    expect(hasSignedOutQuery({ signed_out: "1" })).toBe(true);
    expect(hasSignedOutQuery({ signed_out: ["true"] })).toBe(true);
    expect(hasSignedOutQuery({})).toBe(false);
  });
});
