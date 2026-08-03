import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";

const apiMocks = vi.hoisted(() => ({
  listDesigns: vi.fn(),
  getDesign: vi.fn(),
  uploadDesignAsset: vi.fn(),
  createDesign: vi.fn(),
  deleteDesign: vi.fn(),
}));
const createDraftMock = vi.hoisted(() => vi.fn());
const messageMocks = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock("@/api/designs", () => apiMocks);
vi.mock("@/api/campaignDrafts", () => ({ createDraft: createDraftMock }));
vi.mock("@/composables/usePostHog", () => ({ captureEvent: vi.fn() }));
vi.mock("naive-ui", () => ({ useMessage: () => messageMocks }));
vi.mock("vue-router", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import Designs from "./Designs.vue";

const design = {
  id: "design-1",
  name: "Neighborhood offer",
  front_asset: {
    url: "/media/design-uploads/org/front.png",
    file_name: "front.png",
    mime_type: "image/png",
    file_size_bytes: 1234,
    width_px: 1875,
    height_px: 2775,
  },
  back_asset: null,
  blank_back: true,
  uploaded_asset: {
    fileName: "front.png",
    mimeType: "image/png",
    fileSizeBytes: 1234,
    widthPx: 1875,
    heightPx: 2775,
    frontUrl: "/media/design-uploads/org/front.png",
    backUrl: null,
  },
  created_at: "2026-07-23T12:00:00Z",
  updated_at: "2026-07-23T12:00:00Z",
};

function setFile(wrapper: ReturnType<typeof mount>, testId: string, file: File) {
  const input = wrapper.get(`[data-testid="${testId}"]`);
  Object.defineProperty(input.element, "files", {
    configurable: true,
    value: [file],
  });
  return input.trigger("change");
}

describe("Designs library", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.listDesigns.mockResolvedValue([]);
    apiMocks.getDesign.mockResolvedValue(design);
    apiMocks.uploadDesignAsset.mockResolvedValue(design.front_asset);
    apiMocks.createDesign.mockResolvedValue(design);
    apiMocks.deleteDesign.mockResolvedValue(undefined);
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("defaults the editable name to today and uploads without creating a campaign draft", async () => {
    const wrapper = mount(Designs);
    await flushPromises();
    await wrapper.get('[data-testid="upload-design"]').trigger("click");

    const expectedName = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(new Date());
    expect(wrapper.get('[data-testid="design-name-input"]').element).toHaveProperty(
      "value",
      expectedName,
    );

    await wrapper.get('[data-testid="design-name-input"]').setValue("Edited design name");
    await setFile(
      wrapper,
      "design-front-input",
      new File(["front"], "front.png", { type: "image/png" }),
    );
    await wrapper.get("form").trigger("submit");
    await flushPromises();

    expect(apiMocks.uploadDesignAsset).toHaveBeenCalledTimes(1);
    expect(apiMocks.createDesign).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Edited design name",
        blank_back: true,
        back_asset: null,
      }),
    );
    expect(createDraftMock).not.toHaveBeenCalled();
  });

  it("shows the front thumbnail, blank-back detail, and deletes the library entry", async () => {
    apiMocks.listDesigns.mockResolvedValue([design]);
    const wrapper = mount(Designs);
    await flushPromises();

    expect(wrapper.get('[data-testid="design-front-thumbnail"]').attributes("src")).toContain(
      "/media/design-uploads/org/front.png",
    );

    await wrapper.get(".thumbnail").trigger("click");
    await flushPromises();
    expect(wrapper.get('[data-testid="design-detail"]').text()).toContain("Neighborhood offer");
    expect(wrapper.get('[data-testid="blank-back-state"]').text()).toBe("Blank back");

    await wrapper.get(".detail-delete").trigger("click");
    await flushPromises();
    expect(apiMocks.deleteDesign).toHaveBeenCalledWith("design-1");
    expect(wrapper.find('[data-testid="design-front-thumbnail"]').exists()).toBe(false);
  });
});
