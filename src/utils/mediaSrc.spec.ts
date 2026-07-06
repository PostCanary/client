import { describe, it, expect } from "vitest";
import { mediaSrc } from "./mediaSrc";

describe("mediaSrc", () => {
  it("passes through absolute URLs unchanged", () => {
    expect(mediaSrc("https://cdn.example.com/a.png")).toBe(
      "https://cdn.example.com/a.png",
    );
    expect(mediaSrc("http://cdn.example.com/a.png")).toBe(
      "http://cdn.example.com/a.png",
    );
    expect(mediaSrc("blob:http://localhost/abc-123")).toBe(
      "blob:http://localhost/abc-123",
    );
    expect(mediaSrc("data:image/png;base64,AAAA")).toBe(
      "data:image/png;base64,AAAA",
    );
  });

  it("prefixes root-relative server paths with API_BASE", () => {
    const url = mediaSrc("/api/render-jobs/job-1/cards/1?sig=abc");
    // API_BASE in the test env resolves from @/api/http; assert the
    // relative path is preserved verbatim, including the signed querystring.
    expect(url.endsWith("/api/render-jobs/job-1/cards/1?sig=abc")).toBe(true);
  });

  it("returns empty string for empty input instead of rendering a broken src", () => {
    expect(mediaSrc("")).toBe("");
  });
});
