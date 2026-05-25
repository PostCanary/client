/// <reference types="node" />

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

const CUSTOMER_PREVIEW_DIRS = [
  "components/campaigns",
  "components/design",
  "components/review",
  "components/wizard",
  "pages",
];

const ALLOWED_POSTCARD_PREVIEW_REFERENCES = new Set([
  "components/postcard/PostcardPreview.vue",
  "components/wizard/StepDesignStub.vue",
  "pages/dev/PostcardPreview.vue",
]);

function sourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  return entries.flatMap((entry) => {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return sourceFiles(path);
    if (/\.(ts|vue)$/.test(entry)) return [path];
    return [];
  });
}

describe("customer postcard preview source of truth", () => {
  it("keeps customer-facing surfaces off the client-side PostcardPreview mockup", () => {
    const offenders = CUSTOMER_PREVIEW_DIRS
      .flatMap((dir) => sourceFiles(join(SRC_ROOT, dir)))
      .filter((path) => {
        const rel = relative(SRC_ROOT, path);
        if (ALLOWED_POSTCARD_PREVIEW_REFERENCES.has(rel)) return false;
        const source = readFileSync(path, "utf8");
        return /import\s+PostcardPreview\b|<PostcardPreview\b/.test(source);
      })
      .map((path) => relative(SRC_ROOT, path));

    expect(offenders).toEqual([]);
  });
});
