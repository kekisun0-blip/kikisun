/**
 * prune-deploy-pngs.mjs
 * Remove PNG files when a WebP sibling exists — GitHub Pages deploys the whole site/ folder.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ASSETS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "site/_assets/v11");

let removed = 0;
let savedBytes = 0;

for (const file of fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".png"))) {
  const pngPath = path.join(ASSETS_DIR, file);
  const webpPath = path.join(ASSETS_DIR, file.replace(".png", ".webp"));
  if (!fs.existsSync(webpPath)) continue;

  const size = fs.statSync(pngPath).size;
  fs.unlinkSync(pngPath);
  removed++;
  savedBytes += size;
}

console.log(`✓ Removed ${removed} redundant PNGs (${(savedBytes / 1024 / 1024).toFixed(1)} MB)`);
