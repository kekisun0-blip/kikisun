/**
 * verify-deploy-assets.mjs
 * CI gate: compressed WebP assets must be present in git before deploy.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "site/_assets/v11");

if (!fs.existsSync(ASSETS_DIR)) {
  console.error("Missing assets directory:", ASSETS_DIR);
  process.exit(1);
}

const pngs = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".png"));
const webps = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".webp"));

if (pngs.length > 0) {
  console.error(`Found ${pngs.length} PNG files — run optimize-images locally and commit WebP only.`);
  process.exit(1);
}

if (webps.length < 100) {
  console.error(`Expected many WebP assets, found ${webps.length}`);
  process.exit(1);
}

let totalBytes = 0;
let over500k = 0;
for (const file of webps) {
  const size = fs.statSync(path.join(ASSETS_DIR, file)).size;
  totalBytes += size;
  if (size > 500 * 1024) over500k++;
}

const totalMB = totalBytes / 1024 / 1024;
console.log(`✓ ${webps.length} WebP files, ${totalMB.toFixed(1)} MB total, ${over500k} over 500KB`);

if (totalMB > 35) {
  console.error("Asset bundle too large for deploy — re-run npm run optimize-images");
  process.exit(1);
}

// Spot-check a homepage hero that must be compressed (not pre-optimization ~750KB)
const sample = "1cba39f0b7dfbb1de16ccacc8580d5cd2852f916.webp";
const samplePath = path.join(ASSETS_DIR, sample);
if (!fs.existsSync(samplePath)) {
  console.error("Missing sample asset:", sample);
  process.exit(1);
}
const sampleSize = fs.statSync(samplePath).size;
if (sampleSize > 300 * 1024) {
  console.error(`Sample ${sample} is ${(sampleSize / 1024).toFixed(0)}KB — compression not applied`);
  process.exit(1);
}

console.log(`✓ Sample ${sample}: ${(sampleSize / 1024).toFixed(0)}KB`);
