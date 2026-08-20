import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { defineComponent, nextTick } from "vue";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import {
  REGENERATE_TIMEOUT_MS,
  useAnalytics,
} from "./useAnalytics";

vi.mock("@/api/analytics", () => ({
  getAnalyticsInsights: vi.fn(),
  regenerateInsights: vi.fn(),
}));

import {
  getAnalyticsInsights,
  regenerateInsights,
} from "@/api/analytics";

const sampleInsights = {
  executive_summary: "Summary",
  sections: [],
  top_recommendations: [],
};

function mountAnalytics() {
  let api: ReturnType<typeof useAnalytics> | null = null;
  const Comp = defineComponent({
    setup() {
      api = useAnalytics();
      return () => null;
    },
  });
  const wrapper = mount(Comp);
  return { wrapper, api: api! };
}

describe("useAnalytics", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(getAnalyticsInsights).mockReset();
    vi.mocked(regenerateInsights).mockReset();
    vi.mocked(getAnalyticsInsights).mockResolvedValue({
      data: null,
      message: "none",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("keeps existing insights and surfaces regenerate errors", async () => {
    vi.mocked(getAnalyticsInsights).mockResolvedValue({
      run_id: "run-1",
      insights: sampleInsights,
      model_used: "test",
      generated_at: "2026-01-01T00:00:00Z",
    });

    const { wrapper, api } = mountAnalytics();
    await flushPromises();

    expect(api.hasData.value).toBe(true);

    const err = new Error("500 Failed to generate insights. Please try again later.");
    vi.mocked(regenerateInsights).mockRejectedValueOnce(err);

    await api.regenerate();
    await flushPromises();

    expect(api.hasData.value).toBe(true);
    expect(api.insights.value).toEqual(sampleInsights);
    expect(api.error.value).toContain("Failed to generate insights");
    expect(api.regenerating.value).toBe(false);

    wrapper.unmount();
  });

  it("invalidates an in-flight refresh so a stale null GET cannot clear regenerate", async () => {
    let resolveGet!: (value: unknown) => void;
    const pendingGet = new Promise((resolve) => {
      resolveGet = resolve;
    });

    vi.mocked(getAnalyticsInsights).mockReturnValueOnce(pendingGet as any);

    const { wrapper, api } = mountAnalytics();
    await nextTick();

    vi.mocked(regenerateInsights).mockResolvedValueOnce({
      run_id: "run-2",
      insights: {
        ...sampleInsights,
        executive_summary: "Fresh",
      },
      model_used: "test",
      generated_at: "2026-02-01T00:00:00Z",
    });

    await api.regenerate();
    await flushPromises();

    expect(api.insights.value?.executive_summary).toBe("Fresh");

    resolveGet({ data: null, message: "stale" });
    await flushPromises();

    expect(api.insights.value?.executive_summary).toBe("Fresh");
    expect(api.error.value).toBeNull();

    wrapper.unmount();
  });

  it("passes an extended timeout to regenerateInsights", async () => {
    const { wrapper, api } = mountAnalytics();
    await flushPromises();

    vi.mocked(regenerateInsights).mockResolvedValueOnce({
      run_id: "run-3",
      insights: sampleInsights,
      model_used: "test",
      generated_at: "2026-03-01T00:00:00Z",
    });

    await api.regenerate();
    await flushPromises();

    expect(regenerateInsights).toHaveBeenCalledWith(null, {
      timeout: REGENERATE_TIMEOUT_MS,
    });
    expect(REGENERATE_TIMEOUT_MS).toBe(180_000);

    wrapper.unmount();
  });

  it("maps client timeouts to a clear regenerate error", async () => {
    const { wrapper, api } = mountAnalytics();
    await flushPromises();

    const timeoutErr = Object.assign(new Error("timeout of 60000ms exceeded"), {
      code: "ECONNABORTED",
    });
    vi.mocked(regenerateInsights).mockRejectedValueOnce(timeoutErr);

    await api.regenerate();
    await flushPromises();

    expect(api.error.value).toBe(
      "Insight generation timed out. Please try again.",
    );

    wrapper.unmount();
  });

  it("treats a 200 {data:null} regenerate body as an error", async () => {
    const { wrapper, api } = mountAnalytics();
    await flushPromises();

    vi.mocked(regenerateInsights).mockResolvedValueOnce({
      data: null,
      message: "No completed run found to regenerate insights for.",
    });

    await api.regenerate();
    await flushPromises();

    expect(api.hasData.value).toBe(false);
    expect(api.error.value).toContain("No completed run found");

    wrapper.unmount();
  });
});
