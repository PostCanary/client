import { describe, expect, it } from "vitest";
import { hasSignedOutQuery } from "./sessionLogout";

describe("sessionLogout", () => {
  it("detects the signed_out query used to keep /login off setup", () => {
    expect(hasSignedOutQuery({ signed_out: "1" })).toBe(true);
    expect(hasSignedOutQuery({ signed_out: ["true"] })).toBe(true);
    expect(hasSignedOutQuery({})).toBe(false);
  });
});
