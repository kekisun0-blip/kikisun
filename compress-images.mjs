/**
 * compress-images.mjs
 * Converts large PNG assets to WebP alongside originals.
 * Server does content-negotiation: if Accept includes image/webp, serve .webp.
 */
import sharp from "./node_modules/sharp/lib/index.js";
import fs from "fs";
import path from "path";

const ASSETS_DIR = path.join(path.dirname(new URL(import.meta.url).pathname), "site/_assets/v11");
const MIN_SIZE = 100 * 1024; // only compress >100KB
const QUALITY = 80;

const files = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith(".png"));
console.log(`Found ${files.length} PNG files`);

let savedBytes = 0;
let processed = 0;
let skipped = 0;

for (const file of files) {
  const src = path.join(ASSETS_DIR, file);
  const dest = path.join(ASSETS_DIR, file.replace(".png", ".webp"));
  const origSize = fs.statSync(src).size;

  if (origSize < MIN_SIZE) { skipped++; continue; }
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
    // Already converted — skip to save time
    skipped++;
    continue;
  }

  try {
    const webpBuf = await sharp(src).webp({ quality: QUALITY }).toBuffer();
    if (webpBuf.length < origSize) {
      fs.writeFileSync(dest, webpBuf);
      savedBytes += origSize - webpBuf.length;
      processed++;
      const pct = Math.round((1 - webpBuf.length / origSize) * 100);
      const origMB = (origSize / 1024 / 1024).toFixed(1);
      const newMB = (webpBuf.length / 1024 / 1024).toFixed(1);
      console.log(`[${processed}] ${file.slice(0, 16)}… ${origMB}MB → ${newMB}MB (-${pct}%)`);
    } else {
      skipped++;
    }
  } catch (e) {
    console.warn(`[SKIP] ${file}: ${e.message}`);
    skipped++;
  }
}

console.log(`\n✓ Done: ${processed} converted, ${skipped} skipped`);
console.log(`  Total saved: ${(savedBytes / 1024 / 1024).toFixed(0)} MB`);
