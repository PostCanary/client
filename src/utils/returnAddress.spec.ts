import { describe, expect, it } from "vitest";
import {
  isCompleteReturnAddress,
  returnAddressFieldsEqual,
  toReturnAddressPayload,
  validateReturnAddressForm,
} from "./returnAddress";

describe("validateReturnAddressForm", () => {
  it("requires street, city, 2-letter state, and ZIP", () => {
    expect(
      validateReturnAddressForm({
        address: "",
        city: "Scottsdale",
        state: "AZ",
        zip: "85251",
      }),
    ).toMatch(/street/i);
    expect(
      validateReturnAddressForm({
        address: "1 Main",
        city: "Scottsdale",
        state: "Arizona",
        zip: "85251",
      }),
    ).toMatch(/state/i);
    expect(
      validateReturnAddressForm({
        address: "1 Main",
        city: "Scottsdale",
        state: "AZ",
        zip: "852",
      }),
    ).toMatch(/zip/i);
    expect(
      validateReturnAddressForm({
        address: "1 Main",
        city: "Scottsdale",
        state: "az",
        zip: "85251-1234",
      }),
    ).toBeNull();
  });
});

describe("isCompleteReturnAddress / payload", () => {
  it("rejects a city-only location", () => {
    expect(
      isCompleteReturnAddress({
        name: null,
        address: "",
        address2: null,
        city: "Scottsdale",
        state: "AZ",
        zip: "",
      }),
    ).toBe(false);
  });

  it("normalizes state and optional fields", () => {
    expect(
      toReturnAddressPayload({
        name: "  Acme  ",
        address: " 1 Main ",
        address2: "",
        city: " Scottsdale ",
        state: "az",
        zip: "85251",
      }),
    ).toEqual({
      name: "Acme",
      address: "1 Main",
      address2: null,
      city: "Scottsdale",
      state: "AZ",
      zip: "85251",
    });
  });

  it("treats equivalent payloads as unchanged", () => {
    const saved = {
      name: "Acme",
      address: "1 Main",
      address2: null,
      city: "Scottsdale",
      state: "AZ",
      zip: "85251",
    };
    expect(
      returnAddressFieldsEqual(
        saved,
        toReturnAddressPayload({
          name: "Acme",
          address: "1 Main",
          address2: "",
          city: "Scottsdale",
          state: "az",
          zip: "85251",
        }),
      ),
    ).toBe(true);
    expect(
      returnAddressFieldsEqual(saved, {
        ...saved,
        address: "2 Main",
      }),
    ).toBe(false);
  });
});
