/**
 * ensure-cms-stubs.mjs
 * Figma Sites runtime probes /_json/{bundleId}/_cms/*.json on every navigation.
 * This portfolio has no CMS bindings; empty stubs avoid noisy 404s on GitHub Pages.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_DIR = path.join(__dirname, "site/_json/c09d50a1-ac94-435c-b4e5-c08318bfc599");
const CMS_DIR = path.join(JSON_DIR, "_cms");
const STUB = "{}\n";

if (!fs.existsSync(JSON_DIR)) {
  console.warn("⚠️  JSON dir missing, skipping CMS stubs");
  process.exit(0);
}

fs.mkdirSync(CMS_DIR, { recursive: true });

let created = 0;
for (const name of fs.readdirSync(JSON_DIR)) {
  if (!name.endsWith(".json")) continue;
  const out = path.join(CMS_DIR, name);
  if (!fs.existsSync(out)) {
    fs.writeFileSync(out, STUB);
    created++;
    console.log(`✓ ${name}`);
  }
}

console.log(`✅ CMS stubs: ${created} created, ${fs.readdirSync(CMS_DIR).length} total`);
