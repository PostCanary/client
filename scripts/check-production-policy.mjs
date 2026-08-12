import { readFile, readdir } from "node:fs/promises";
import { extname, join, relative } from "node:path";

const root = process.cwd();
const distDir = join(root, "dist");
const vercelConfig = JSON.parse(await readFile(join(root, "vercel.json"), "utf8"));

function fail(message) {
  console.error(`[production-policy] ${message}`);
  process.exitCode = 1;
}

const globalHeaders = vercelConfig.headers?.find(({ source }) => source === "/(.*)")?.headers ?? [];
const headerMap = new Map(globalHeaders.map(({ key, value }) => [key.toLowerCase(), value]));

for (const requiredHeader of [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "x-frame-options",
]) {
  if (!headerMap.has(requiredHeader)) fail(`vercel.json is missing ${requiredHeader}`);
}

const csp = headerMap.get("content-security-policy") ?? "";
for (const directive of ["default-src 'self'", "object-src 'none'", "frame-ancestors 'none'", "base-uri 'self'"]) {
  if (!csp.includes(directive)) fail(`Content-Security-Policy is missing: ${directive}`);
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );
  return nested.flat();
}

const files = await listFiles(distDir);
for (const file of files) {
  if (extname(file) === ".map") fail(`public source map found: ${relative(root, file)}`);
  if (![".js", ".css", ".html"].includes(extname(file))) continue;

  const contents = await readFile(file, "utf8");
  if (contents.includes("sourceMappingURL=")) {
    fail(`source map reference found: ${relative(root, file)}`);
  }
  for (const qaPath of [
    "/dev/sttl-step2-preview",
    "/dev/step-review-approval-flow",
    "/dev/step-design-fold",
    "/dev/wizard-shell-strips",
  ]) {
    if (contents.includes(qaPath)) fail(`QA route leaked into production: ${qaPath}`);
  }
}

if (!process.exitCode) console.log("[production-policy] production artifact passed");
