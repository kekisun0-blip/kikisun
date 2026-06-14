/**
 * compress-images.mjs
 * Converts PNG assets to WebP, resizes oversized images, recompresses existing WebPs.
 * GitHub Pages is static — production HTML/JSON must reference .webp directly.
 */
import sharp from "./node_modules/sharp/lib/index.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, "site/_assets/v11");
const MAX_DIMENSION = 2560; // preserve 2x for ~1280px content column UI screenshots
const QUALITY = 90;
const FORCE = process.argv.includes("--force");

function sizeMB(bytes) {
  return (bytes / 1024 / 1024).toFixed(2);
}

async function toWebp(srcPath) {
  const meta = await sharp(srcPath).metadata();
  let pipeline = sharp(srcPath);

  if ((meta.width ?? 0) > MAX_DIMENSION || (meta.height ?? 0) > MAX_DIMENSION) {
    pipeline = pipeline.resize({
      width: (meta.width ?? 0) >= (meta.height ?? 0) ? MAX_DIMENSION : undefined,
      height: (meta.height ?? 0) > (meta.width ?? 0) ? MAX_DIMENSION : undefined,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  return pipeline.webp({ quality: QUALITY, effort: 4, smartSubsample: false }).toBuffer();
}

// Skip lossy WebP → WebP re-encode (causes generation loss on UI screenshots).
const SKIP_WEBP_RECOMPRESS = true;

const pngFiles = fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".png"));
console.log(`Found ${pngFiles.length} PNG files in ${ASSETS_DIR}`);

let converted = 0;
let recompressed = 0;
let skipped = 0;
let savedBytes = 0;

for (const file of pngFiles) {
  const src = path.join(ASSETS_DIR, file);
  const dest = path.join(ASSETS_DIR, file.replace(".png", ".webp"));
  const origSize = fs.statSync(src).size;
  const existingWebp = fs.existsSync(dest) ? fs.statSync(dest).size : 0;

  if (existingWebp > 0 && !FORCE && existingWebp < origSize * 0.5) {
    skipped++;
    continue;
  }

  try {
    const webpBuf = await toWebp(src);
    const prevSize = existingWebp || origSize;
    if (webpBuf.length < prevSize || FORCE || !existingWebp) {
      fs.writeFileSync(dest, webpBuf);
      savedBytes += prevSize - webpBuf.length;
      if (existingWebp) recompressed++;
      else converted++;
      const pct = Math.round((1 - webpBuf.length / origSize) * 100);
      console.log(
        `[${converted + recompressed}] ${file.slice(0, 12)}… ${sizeMB(origSize)}MB → ${sizeMB(webpBuf.length)}MB (-${pct}%)`
      );
    } else {
      skipped++;
    }
  } catch (e) {
    console.warn(`[SKIP] ${file}: ${e.message}`);
    skipped++;
  }
}

// Recompress orphan WebPs (no PNG source) that are still large
if (!SKIP_WEBP_RECOMPRESS) for (const file of fs.readdirSync(ASSETS_DIR).filter((f) => f.endsWith(".webp"))) {
  const png = file.replace(".webp", ".png");
  if (fs.existsSync(path.join(ASSETS_DIR, png))) continue;

  const dest = path.join(ASSETS_DIR, file);
  const size = fs.statSync(dest).size;
  if (size < 80 * 1024 && !FORCE) continue;

  try {
    const webpBuf = await toWebp(dest);
    if (webpBuf.length < size - 1024 || FORCE) {
      fs.writeFileSync(dest, webpBuf);
      savedBytes += size - webpBuf.length;
      recompressed++;
      console.log(`[recompress] ${file.slice(0, 12)}… ${sizeMB(size)}MB → ${sizeMB(webpBuf.length)}MB`);
    }
  } catch {
    /* keep original */
  }
}

const pngTotal = pngFiles.reduce((s, f) => s + fs.statSync(path.join(ASSETS_DIR, f)).size, 0);
const webpTotal = fs
  .readdirSync(ASSETS_DIR)
  .filter((f) => f.endsWith(".webp"))
  .reduce((s, f) => s + fs.statSync(path.join(ASSETS_DIR, f)).size, 0);

console.log(`\n✓ Done: ${converted} converted, ${recompressed} recompressed, ${skipped} skipped`);
console.log(`  Saved this run: ${sizeMB(savedBytes)} MB`);
console.log(`  Assets now: PNG ${sizeMB(pngTotal)} MB, WebP ${sizeMB(webpTotal)} MB`);
