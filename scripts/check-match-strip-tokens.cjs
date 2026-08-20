#!/usr/bin/env node
/**
 * Gate: fail if authenticated app UI still uses white-on-teal CTAs
 * or soft teal primary fills that violate Match Strip / WCAG rules.
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const patterns = [
  { name: "hardcoded-teal-fill-cta", re: /bg-\[#47bfa9\]/ },
  { name: "hardcoded-teal-hex-cta", re: /bg-\[#47bfa9\]|background:\s*#47bfa9/i },
  { name: "white-on-teal-tailwind", re: /bg-\[#47bfa9\][^\n]*text-white|text-white[^\n]*bg-\[#47bfa9\]/ },
];

const roots = [
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
  "src/components/campaigns",
  "src/components/wizard",
  "src/components/chat",
  "src/components/billing",
  "src/components/OnboardingModal.vue",
  "src/components/OrgSwitcher.vue",
];

function walk(p, out = []) {
  const abs = path.join(ROOT, p);
  if (!fs.existsSync(abs)) return out;
  const st = fs.statSync(abs);
  if (st.isFile()) {
    out.push(abs);
    return out;
  }
  for (const ent of fs.readdirSync(abs, { withFileTypes: true })) {
    const child = path.join(p, ent.name);
    if (ent.isDirectory()) walk(child, out);
    else if (ent.name.endsWith(".vue") || ent.name.endsWith(".css")) out.push(path.join(ROOT, child));
  }
  return out;
}

const files = roots.flatMap((r) => walk(r));
const failures = [];

for (const file of files) {
  const src = fs.readFileSync(file, "utf8");
  for (const { name, re } of patterns) {
    if (re.test(src)) {
      failures.push(`${path.relative(ROOT, file)} :: ${name}`);
    }
  }
}

if (failures.length) {
  console.error("Match Strip gate FAILED:");
  failures.forEach((f) => console.error(" -", f));
  process.exit(1);
}
console.log(`Match Strip gate OK (${files.length} files)`);
