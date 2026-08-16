import { describe, expect, it } from "vitest"
import {
  extractOverRecipientCapError,
  formatOverRecipientCapPurchaseError,
  formatRecipientCapWarning,
  isOverRecipientCap,
  parsePurchaseRecordsMaxQty,
} from "./recipientCap"

describe("recipient cap helpers", () => {
  it("accepts only a positive integer from the server field", () => {
    const fromServer = 37
    expect(parsePurchaseRecordsMaxQty(fromServer)).toBe(fromServer)
    expect(parsePurchaseRecordsMaxQty(String(fromServer))).toBe(fromServer)
    expect(parsePurchaseRecordsMaxQty(0)).toBeNull()
    expect(parsePurchaseRecordsMaxQty(-1)).toBeNull()
    expect(parsePurchaseRecordsMaxQty(1.5)).toBeNull()
    expect(parsePurchaseRecordsMaxQty(true)).toBeNull()
    expect(parsePurchaseRecordsMaxQty(undefined)).toBeNull()
    expect(parsePurchaseRecordsMaxQty(null)).toBeNull()
  })

  it("treats a count at the cap as allowed and a count above the cap as blocked", () => {
    const maxQty = 12
    expect(isOverRecipientCap(maxQty, maxQty)).toBe(false)
    expect(isOverRecipientCap(maxQty - 1, maxQty)).toBe(false)
    expect(isOverRecipientCap(maxQty + 1, maxQty)).toBe(true)
    expect(isOverRecipientCap(maxQty + 1, null)).toBe(false)
  })

  it("interpolates the live cap into the targeting warning", () => {
    const maxQty = 18
    expect(formatRecipientCapWarning(maxQty)).toContain(maxQty.toLocaleString())
    expect(formatRecipientCapWarning(maxQty)).toMatch(/narrow your filters/i)
  })

  it("matches OverRecipientCap in the Flask APIError envelope", () => {
    const maxQty = 21
    const requestedQty = 44
    expect(
      extractOverRecipientCapError({
        status: 400,
        data: {
          error: {
            type: "OverRecipientCap",
            message: "Quantity exceeds the current recipient cap",
            details: { max_qty: maxQty, requested_qty: requestedQty },
          },
        },
      }),
    ).toEqual({ maxQty, requestedQty })
  })

  it("matches OverRecipientCap in the flat string-error envelope", () => {
    const maxQty = 9
    const requestedQty = 30
    expect(
      extractOverRecipientCapError({
        status: 400,
        data: {
          error: "OverRecipientCap",
          message: "over cap",
          max_qty: maxQty,
          requested_qty: requestedQty,
        },
      }),
    ).toEqual({ maxQty, requestedQty })
  })

  it("does not treat other 400s as an over-cap error", () => {
    expect(
      extractOverRecipientCapError({
        status: 400,
        data: {
          error: { type: "BadRequest", message: "Campaign has no valid approved household quantity" },
        },
      }),
    ).toBeNull()
  })

  it("interpolates requested and max qty into the purchase error copy", () => {
    const maxQty = 15
    const requestedQty = 40
    const copy = formatOverRecipientCapPurchaseError({ maxQty, requestedQty })
    expect(copy).toContain(requestedQty.toLocaleString())
    expect(copy).toContain(maxQty.toLocaleString())
    expect(copy).toMatch(/Go back to Targeting/i)
  })
})
