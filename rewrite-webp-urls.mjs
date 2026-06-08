/**
 * rewrite-webp-urls.mjs
 * Rewrites .png → .webp in HTML/JSON when a WebP sibling exists under site/_assets/.
 * GitHub Pages is static — server.mjs content-negotiation does not apply in production.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.join(__dirname, "site");
const ASSETS = path.join(SITE, "_assets/v11");

const webpCache = new Map();

function hasWebp(pngRef) {
  const hash = pngRef.match(/([a-f0-9]{40})\.png/i)?.[1];
  if (!hash) return false;
  if (webpCache.has(hash)) return webpCache.get(hash);
  const ok = fs.existsSync(path.join(ASSETS, `${hash}.webp`));
  webpCache.set(hash, ok);
  return ok;
}

function rewriteText(text) {
  return text.replace(/([a-f0-9]{40})\.png/gi, (match, hash) =>
    hasWebp(match) ? `${hash}.webp` : match
  );
}

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (/\.(html|json)$/i.test(e.name)) out.push(p);
  }
  return out;
}

const LCP_HASH = "32cd3f42feaa1b4267546885f7d5037388555298";
const PRELOAD_TAG = `<link rel="preload" href="/_assets/v11/${LCP_HASH}.webp" as="image" type="image/webp" fetchpriority="high"/>`;

let filesChanged = 0;
let refsRewritten = 0;

for (const file of walk(SITE)) {
  const orig = fs.readFileSync(file, "utf8");
  const pngBefore = (orig.match(/[a-f0-9]{40}\.png/gi) || []).length;
  let next = rewriteText(orig);

  if (file.endsWith("index.html") && hasWebp(`${LCP_HASH}.png`)) {
    if (!next.includes(`${LCP_HASH}.webp" as="image"`)) {
      next = next.replace(
        /<link rel="preload" href="\/_json/,
        `${PRELOAD_TAG}\n    <link rel="preload" href="/_json`
      );
    }
    const marker = `src="/_assets/v11/${LCP_HASH}.webp"`;
    const pos = next.indexOf(marker);
    if (pos !== -1 && !next.slice(Math.max(0, pos - 80), pos).includes("fetchpriority")) {
      const imgStart = next.lastIndexOf("<img", pos);
      if (imgStart !== -1) {
        next = next.slice(0, imgStart + 4) + ' fetchpriority="high"' + next.slice(imgStart + 4);
      }
    }
  }

  const pngAfter = (next.match(/[a-f0-9]{40}\.png/gi) || []).length;
  if (next !== orig) {
    fs.writeFileSync(file, next);
    filesChanged++;
    refsRewritten += pngBefore - pngAfter;
    console.log(`✓ ${path.relative(SITE, file)}: ${pngBefore - pngAfter} png → webp`);
  }
}

console.log(`\n✅ Done: ${filesChanged} files, ${refsRewritten} references rewritten`);
