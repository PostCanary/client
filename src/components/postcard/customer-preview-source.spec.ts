/// <reference types="node" />

// Tombstone guard for the legacy client-side postcard renderer.
//
// PostcardFront/PostcardBack/PostcardPreview (plus their stubs and the
// StepDesignStub host) were a DOM/CSS re-implementation of the render
// worker's templates. They drifted visually from the worker output and were
// removed 2026-07-07. The ONLY customer-facing postcard rendering is the
// server-rendered preview PNG (see useCardPreview.ts — "ONE RENDERING
// RULE"). This spec keeps a second renderer from being reintroduced.

import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC_ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));

// Matches an import of, or a template usage of, any legacy renderer
// component. Prose mentions in comments are fine; imports and tags are not.
const LEGACY_RENDERER_PATTERN =
  /import\s+Postcard(Front|Back|Preview)(Stub)?\b|from\s+["']@\/components\/postcard\/Postcard(Front|Back|Preview)(Stub)?\.vue["']|<Postcard(Front|Back|Preview)(Stub)?\b/;

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
  it("keeps the legacy client-side postcard renderer deleted", () => {
    const offenders = sourceFiles(SRC_ROOT)
      .filter((path) => path !== fileURLToPath(import.meta.url))
      .filter((path) => LEGACY_RENDERER_PATTERN.test(readFileSync(path, "utf8")))
      .map((path) => relative(SRC_ROOT, path));

    expect(offenders).toEqual([]);
  });
});
