import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearCsrfToken, postJson } from "@/api/http";

describe("http csrf helper", () => {
  beforeEach(() => {
    clearCsrfToken();
    vi.restoreAllMocks();
  });

  it("fetches CSRF tokens from /auth instead of /api/auth", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) =>
      new Response(JSON.stringify({ csrf_token: "csrf-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await postJson("/api/audiences", {}, {
      adapter: async (config) => ({
        data: { ok: true },
        status: 200,
        statusText: "OK",
        headers: {},
        config,
        request: {},
      }),
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const firstCall = fetchMock.mock.calls[0];
    if (!firstCall) throw new Error("fetch was not called");
    expect(String(firstCall[0])).toBe("/auth/csrf-token");
  });
});
