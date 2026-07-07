/// <reference types="node" />

// Drift guard for the hand-mirrored click-zone geometry.
//
// templateEditZones.ts zone boxes are percentage coordinates copied by hand
// from the render worker's template CSS (server repo,
// render_worker/templates/postcard/*.html). Nothing ties the two together
// at runtime — if a worker template moves a slot, the client's click
// targets silently land on the wrong region of the preview PNG.
//
// This spec compares the current worker template files against the hashes
// recorded in templateEditZones.manifest.json. A failure means a worker
// template changed since the zones were last verified: re-check the zone
// geometry for the listed template ids, update templateEditZones.ts if
// needed, then run `node scripts/update-zone-manifest.mjs`.
//
// The server repo is a sibling checkout (../server) or POSTCANARY_SERVER_DIR.
// When it isn't present (e.g. client-only CI), the comparison is skipped —
// the guard runs in every local/workspace dev loop, which is where worker
// template edits happen.

import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  TEMPLATE_EDIT_ZONES,
  BACK_EDIT_ZONES,
} from "./templateEditZones";
import manifest from "./templateEditZones.manifest.json";

const CLIENT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const SERVER_DIR =
  process.env.POSTCANARY_SERVER_DIR ?? resolve(CLIENT_ROOT, "..", "server");
const TEMPLATES_DIR = join(SERVER_DIR, "render_worker", "templates", "postcard");
const serverAvailable = existsSync(TEMPLATES_DIR);

function sha256File(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

describe("templateEditZones ↔ render-worker template mirror", () => {
  it("has a manifest entry for every zone map (and vice versa)", () => {
    const zoneIds = new Set([
      ...Object.keys(TEMPLATE_EDIT_ZONES),
      ...Object.keys(BACK_EDIT_ZONES),
    ]);
    const manifestIds = new Set(Object.keys(manifest.templates));
    expect([...zoneIds].filter((id) => !manifestIds.has(id))).toEqual([]);
    expect([...manifestIds].filter((id) => !zoneIds.has(id))).toEqual([]);
  });

  it.skipIf(!serverAvailable)(
    "worker templates are unchanged since zone geometry was last verified",
    () => {
      const stale: string[] = [];

      for (const [file, expected] of Object.entries(manifest.shared)) {
        const path = join(TEMPLATES_DIR, file);
        if (!existsSync(path) || sha256File(path) !== expected) {
          stale.push(`${file} (shared — affects ALL zone maps)`);
        }
      }
      for (const [id, entry] of Object.entries(manifest.templates)) {
        const path = join(TEMPLATES_DIR, entry.file);
        if (!existsSync(path) || sha256File(path) !== entry.sha256) {
          stale.push(`${id} (${entry.file})`);
        }
      }

      expect(
        stale,
        "Render-worker template(s) changed since their click-zone geometry " +
          "was last verified. Re-check the zone boxes in templateEditZones.ts " +
          "for the ids above, then run `node scripts/update-zone-manifest.mjs`.",
      ).toEqual([]);
    },
  );
});
