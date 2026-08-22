#!/usr/bin/env node
/**
 * Match Strip token lever: rewrite old teal SaaS classes to navy/canary/2px.
 * Dry-run by default. Pass --write to apply.
 *
 * Scope: authenticated app pages + shared components (not marketing).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WRITE = process.argv.includes("--write");

const GLOBS = [
  "src/pages/Team.vue",
  "src/pages/Settings.vue",
  "src/pages/History.vue",
  "src/pages/FirstRunSetup.vue",
  "src/pages/Campaigns.vue",
  "src/pages/CampaignDetail.vue",
  "src/pages/Designs.vue",
  "src/pages/PrintJobStatus.vue",
  "src/pages/AcceptInvite.vue",
  "src/pages/SttLStep2Route.vue",
  "src/pages/SendWizard.vue",
  "src/pages/Demographics.vue",
  "src/pages/Heatmap.vue",
  "src/pages/DoNotMail.vue",
];

const DIRS = [
  "src/components/campaigns",
  "src/components/wizard",
  "src/components/targeting",
  "src/components/chat",
  "src/components/billing",
  "src/components/demographics",
  "src/components/dashboard",
];

const EXTRA = [
  "src/components/OnboardingModal.vue",
  "src/components/OrgSwitcher.vue",
  "src/components/IndustryPicker.vue",
  "src/components/CampaignSelector.vue",
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.name.endsWith(".vue") || ent.name.endsWith(".css")) out.push(p);
  }
  return out;
}

const files = new Set([
  ...GLOBS.map((g) => path.join(ROOT, g)),
  ...EXTRA.map((g) => path.join(ROOT, g)),
]);
for (const d of DIRS) walk(path.join(ROOT, d), []).forEach((f) => files.add(f));

/** Ordered replacements: opacity/variants BEFORE solid fills. */
const REPLACEMENTS = [
  // Teal wash selected states (must precede solid bg-[#47bfa9])
  [/group-hover:border-\[#47bfa9\]\/80/g, "group-hover:border-[rgba(250,207,65,0.8)]"],
  [/group-hover:bg-\[#47bfa9\]\/10/g, "group-hover:bg-[rgba(250,207,65,0.16)]"],
  [/hover:bg-\[#47bfa9\]\/10/g, "hover:bg-[rgba(250,207,65,0.16)]"],
  [/hover:bg-\[#47bfa9\]\/5/g, "hover:bg-[rgba(250,207,65,0.10)]"],
  [/hover:border-\[#47bfa9\]/g, "hover:border-[var(--pc-canary,#facf41)]"],
  [/hover:bg-\[#47bfa9\]/g, "hover:bg-[var(--app-btn-bg,#1c2430)]"],
  [/bg-\[#47bfa9\]\/20/g, "bg-[rgba(250,207,65,0.22)]"],
  [/bg-\[#47bfa9\]\/10/g, "bg-[rgba(250,207,65,0.16)]"],
  [/bg-\[#47bfa9\]\/5/g, "bg-[rgba(250,207,65,0.10)]"],
  [/border-\[#47bfa9\]\/80/g, "border-[rgba(250,207,65,0.8)]"],
  [/border-\[#47bfa9\]\/30/g, "border-[rgba(250,207,65,0.45)]"],

  // Primary CTA fills (white-on-teal → navy)
  [/bg-\[#47bfa9\]/g, "bg-[var(--app-btn-bg,#1c2430)]"],
  [/hover:bg-\[#3aa893\]/g, "hover:bg-[var(--app-btn-bg-hover,#2a3544)]"],
  [/hover:bg-\[#3aa68f\]/g, "hover:bg-[var(--app-btn-bg-hover,#2a3544)]"],
  [/hover:bg-\[#3aad97\]/g, "hover:bg-[var(--app-btn-bg-hover,#2a3544)]"],

  // Teal text links → navy
  [/text-\[#47bfa9\]/g, "text-[var(--pc-navy,#1c2430)]"],
  [/hover:text-\[#47bfa9\]/g, "hover:text-[var(--pc-navy,#1c2430)]"],
  [/hover:text-\[#3aa893\]/g, "hover:text-[var(--pc-navy,#1c2430)]"],

  // Borders / focus / accent checks
  [/focus:border-\[#47bfa9\]/g, "focus:border-[var(--pc-navy,#1c2430)]"],
  [/border-\[#47bfa9\]/g, "border-[var(--pc-canary,#facf41)]"],
  [/accent-\[#47bfa9\]/g, "accent-[var(--pc-canary,#facf41)]"],

  // Soft card radius → Match Strip 2px
  [/rounded-xl/g, "rounded-[2px]"],
  [/rounded-2xl/g, "rounded-[2px]"],
  // CTA pills → sharp (keep rounded-full for true circular avatars/spinners elsewhere)
  [/rounded-full bg-\[var\(--app-btn-bg/g, "rounded-[2px] bg-[var(--app-btn-bg"],
  [/rounded-full bg-\[#e4e7eb\]/g, "rounded-[2px] bg-[#e4e7eb]"],
  [/rounded-lg bg-\[var\(--app-btn-bg/g, "rounded-[2px] bg-[var(--app-btn-bg"],
  [/rounded-lg hover:bg-\[var\(--app-btn-bg/g, "rounded-[2px] hover:bg-[var(--app-btn-bg"],

  // Soft elevation → flat Match Strip panels
  [/ shadow-sm/g, ""],
  [/ shadow-md/g, ""],
  [/ hover:shadow-md/g, ""],
  [/ shadow-xl/g, ""],
  [/ shadow-2xl/g, ""],

  // Legacy navy hex in app UI → brand navy
  [/text-\[#0b2d50\]/g, "text-[var(--pc-navy,#1c2430)]"],
  [/text-\[#0c2d50\]/g, "text-[var(--pc-navy,#1c2430)]"],
  [/hover:text-\[#0b2d50\]/g, "hover:text-[var(--pc-navy,#1c2430)]"],

  // Raw CSS hex teal (common in scoped styles)
  [/#47bfa9/g, "var(--pc-canary, #facf41)"],
  [/#3aa893/g, "var(--app-btn-bg-hover, #2a3544)"],
  [/#3aa68f/g, "var(--app-btn-bg-hover, #2a3544)"],
  [/#3aad97/g, "var(--app-btn-bg-hover, #2a3544)"],
  [/#178e7c/g, "var(--pc-navy, #1c2430)"],
  [/#0f766e/g, "var(--pc-navy, #1c2430)"],
];

// Post-pass: after #47bfa9 → canary, primary btn backgrounds that became canary need navy.
// Re-fix common broken patterns from CSS replacement of CTA backgrounds.
const POST = [
  // CSS: background: var(--pc-canary) that was a solid CTA with white text
  [/background:\s*var\(--pc-canary,\s*#facf41\);\s*\n(\s*)color:\s*(#fff|white|#ffffff)/gi,
    "background: var(--app-btn-bg, #1c2430);\n$1color: $2"],
  // border-radius soft cards in CSS
  [/border-radius:\s*16px/g, "border-radius: var(--app-card-radius, 2px)"],
  [/border-radius:\s*14px/g, "border-radius: var(--app-card-radius, 2px)"],
  [/border-radius:\s*12px/g, "border-radius: var(--app-card-radius, 2px)"],
  [/border-radius:\s*10px/g, "border-radius: var(--app-card-radius, 2px)"],
  [/border-radius:\s*8px/g, "border-radius: var(--app-card-radius, 2px)"],
  // fallbacks still saying 12px
  [/--app-card-radius,\s*12px/g, "--app-card-radius, 2px"],
];

let changedFiles = 0;
let totalHits = 0;

for (const file of [...files].sort()) {
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, "utf8");
  const before = src;
  let hits = 0;
  for (const [re, to] of REPLACEMENTS) {
    const n = (src.match(re) || []).length;
    if (n) {
      hits += n;
      src = src.replace(re, to);
    }
  }
  for (const [re, to] of POST) {
    const n = (src.match(re) || []).length;
    if (n) {
      hits += n;
      src = src.replace(re, to);
    }
  }
  if (src !== before) {
    changedFiles++;
    totalHits += hits;
    const rel = path.relative(ROOT, file);
    console.log(`${WRITE ? "WRITE" : "DRY"} ${rel} (${hits} hits)`);
    if (WRITE) fs.writeFileSync(file, src);
  }
}

console.log(`\n${WRITE ? "Wrote" : "Would write"} ${changedFiles} files, ~${totalHits} replacements`);
if (!WRITE) console.log("Re-run with --write to apply.");
