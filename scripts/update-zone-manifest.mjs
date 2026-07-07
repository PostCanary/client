// Regenerates src/data/templateEditZones.manifest.json — the drift guard
// for the hand-mirrored click-zone geometry in templateEditZones.ts.
//
// Each zone map in templateEditZones.ts is a set of percentage boxes copied
// by hand from a render-worker template's CSS. This manifest records a
// sha256 of every worker template file the zone maps mirror (plus the shared
// _base.html). templateEditZones.mirror.spec.ts fails when a worker template
// changes without this manifest being regenerated — i.e. without someone
// re-verifying the zone geometry still matches.
//
// After changing a worker template AND re-verifying/updating the zones, run:
//     node scripts/update-zone-manifest.mjs
//
// Server repo location: sibling checkout ../server, or POSTCANARY_SERVER_DIR.

import { createHash } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const CLIENT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SERVER_DIR =
  process.env.POSTCANARY_SERVER_DIR ?? resolve(CLIENT_ROOT, "..", "server");
const TEMPLATES_DIR = join(
  SERVER_DIR,
  "render_worker",
  "templates",
  "postcard",
);
const MANIFEST_PATH = join(
  CLIENT_ROOT,
  "src",
  "data",
  "templateEditZones.manifest.json",
);

// renderTemplateId (zone-map key) → worker template file it mirrors.
// Front ids drop the trailing -v1; back ids keep the version in the name.
// standard-back-v1 aliases the standard-back-v2 zone map, so both files
// are tracked. Keep in sync with TEMPLATE_EDIT_ZONES / BACK_EDIT_ZONES keys
// in src/data/templateEditZones.ts.
export const TEMPLATE_SOURCES = {
  "hac-1000-front-v1": "hac-1000-front.html",
  "side-split-front-v1": "side-split-front.html",
  "photo-top-front-v1": "photo-top-front.html",
  "photo-hero-front-v1": "photo-hero-front.html",
  "new-mover-front-v1": "new-mover-front.html",
  "before-after-front-v1": "before-after-front.html",
  "tips-card-front-v1": "tips-card-front.html",
  "letter-note-front-v1": "letter-note-front.html",
  "bold-graphic-front-v1": "bold-graphic-front.html",
  "review-forward-front-v1": "review-forward-front.html",
  "service-checklist-front-v1": "service-checklist-front.html",
  "urgency-notice-front-v1": "urgency-notice-front.html",
  "neighborhood-map-front-v1": "neighborhood-map-front.html",
  "standard-back-v2": "standard-back-v2.html",
  "standard-back-v1": "standard-back-v1.html",
  "testimonial-back-v1": "testimonial-back-v1.html",
  "service-area-back-v1": "service-area-back-v1.html",
  "photo-back-v1": "photo-back-v1.html",
  "brand-bold-back-v1": "brand-bold-back-v1.html",
};

// Shared geometry: every template inherits _base.html layout CSS.
export const SHARED_SOURCES = ["_base.html"];

export function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function main() {
  if (!existsSync(TEMPLATES_DIR)) {
    console.error(
      `Server templates dir not found: ${TEMPLATES_DIR}\n` +
        "Check out the server repo as a sibling of client/, or set POSTCANARY_SERVER_DIR.",
    );
    process.exit(1);
  }

  const manifest = {
    _readme:
      "sha256 of each render-worker template file that templateEditZones.ts " +
      "geometry was hand-mirrored from. Regenerate with " +
      "`node scripts/update-zone-manifest.mjs` AFTER re-verifying zone " +
      "geometry against the changed template. Do not hand-edit hashes.",
    shared: Object.fromEntries(
      SHARED_SOURCES.map((f) => [f, sha256File(join(TEMPLATES_DIR, f))]),
    ),
    templates: Object.fromEntries(
      Object.entries(TEMPLATE_SOURCES).map(([id, file]) => [
        id,
        { file, sha256: sha256File(join(TEMPLATES_DIR, file)) },
      ]),
    ),
  };

  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(
    `Wrote ${MANIFEST_PATH} (${Object.keys(manifest.templates).length} templates + ${SHARED_SOURCES.length} shared)`,
  );
}

// Allow importing TEMPLATE_SOURCES/sha256File from the spec without running.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
