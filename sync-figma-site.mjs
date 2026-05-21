/**
 * Full sync from Figma preview site → ./site
 * Usage: node sync-figma-site.mjs
 */
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.FIGMA_BASE_URL || "https://quirky-patio-23444944.figma.site";
const OUT = path.join(__dirname, "site");
const JSON_ID = "c09d50a1-ac94-435c-b4e5-c08318bfc599";
const JSON_DIR = `_json/${JSON_ID}`;
const CONCURRENCY = 12;

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = res.headers.location.startsWith("http")
          ? res.headers.location
          : BASE + res.headers.location;
        return get(next).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    }).on("error", reject);
    setTimeout(() => reject(new Error("timeout")), 60000);
  });
}

function writeLocal(urlPath, body) {
  const local = path.join(OUT, urlPath.replace(/^\//, ""));
  fs.mkdirSync(path.dirname(local), { recursive: true });
  fs.writeFileSync(local, body);
  return local;
}

async function download(urlPath) {
  const clean = urlPath.split("?")[0];
  const url = BASE + clean;
  try {
    const { status, body } = await get(url);
    if (status === 200 && body.length) {
      writeLocal(clean, body);
      return true;
    }
  } catch (e) {
    console.warn("FAIL", clean, e.message);
  }
  return false;
}

async function pool(items, worker, concurrency) {
  let i = 0;
  const runners = Array.from({ length: concurrency }, async () => {
    while (i < items.length) {
      const idx = i++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
}

function preserveAskKiki(html) {
  html = html.replace(/ask-kiki-only\.css\?v=\d+/g, "ask-kiki-only.css?v=40");
  html = html.replace(/ask-kiki-only\.js\?v=\d+/g, "ask-kiki-only.js?v=40");
  if (!html.includes("kiki-ask-kiki-inject")) {
    const cssTag = `<link rel="stylesheet" href="/_custom/ask-kiki-only.css?v=40"/><!-- kiki-ask-kiki-inject -->`;
    const jsTag = `<script src="/_custom/ask-kiki-only.js?v=40" defer></script>`;
    html = html.replace("</head>", cssTag + "\n</head>");
    html = html.replace("</body>", jsTag + "\n</body>");
  }
  return html;
}

function collectAssetsFromText(text) {
  const assets = new Set();
  for (const a of text.match(/\/_assets\/v11\/[a-zA-Z0-9._-]+\.(?:png|svg|jpg|jpeg|webp|gif)/gi) || [])
    assets.add(a.split("?")[0]);
  for (const h of text.match(/[a-f0-9]{32,64}\.(?:png|svg|jpg|jpeg|webp|gif)/gi) || [])
    assets.add(`/_assets/v11/${h}`);
  // srcset: /_assets/...png 3840w
  for (const m of text.match(/\/_assets\/v11\/[a-zA-Z0-9]+\.(?:png|svg|jpg|jpeg|webp|gif)/gi) || [])
    assets.add(m.split(/\s/)[0]);
  return assets;
}

function isMissing(assetPath) {
  const local = path.join(OUT, assetPath.replace(/^\//, ""));
  return !fs.existsSync(local) || fs.statSync(local).size === 0;
}

function audit(label) {
  const sources = [];
  sources.push(fs.readFileSync(path.join(OUT, "index.html"), "utf8"));
  if (fs.existsSync(path.join(OUT, "about/index.html")))
    sources.push(fs.readFileSync(path.join(OUT, "about/index.html"), "utf8"));
  const jsonDir = path.join(OUT, JSON_DIR);
  for (const f of fs.readdirSync(jsonDir).filter((x) => x.endsWith(".json"))) {
    sources.push(fs.readFileSync(path.join(jsonDir, f), "utf8"));
  }
  const all = new Set();
  for (const t of sources) for (const a of collectAssetsFromText(t)) all.add(a);
  const missing = [...all].filter(isMissing);
  console.log(`📊 ${label}: ${all.size} refs, ${missing.length} missing, ${all.size - missing.length} on disk`);
  return missing;
}

console.log("🔄 Sync from", BASE);

// 1) Core HTML
for (const p of ["/", "/about"]) {
  const { status, body } = await get(BASE + p);
  if (status === 200) {
    let html = body.toString("utf8");
    if (p === "/") html = preserveAskKiki(html);
    const out = p === "/" ? "index.html" : "about/index.html";
    const local = path.join(OUT, out);
    fs.mkdirSync(path.dirname(local), { recursive: true });
    fs.writeFileSync(local, html, "utf8");
    console.log("✅", out);
  }
}

// 2) All JSON
const projectIds = ["project", ...Array.from({ length: 11 }, (_, i) => `project-${i + 2}`)];
for (const id of [...projectIds, "_index", "about"]) {
  const rel = `/${JSON_DIR}/${id}.json`;
  if (await download(rel)) console.log("✅", rel);
}

// 3) Static deps from index
const indexHtml = fs.readFileSync(path.join(OUT, "index.html"), "utf8");
const staticPaths = new Set();
const re = /["'](\/(?:_assets|_components|_runtimes|_woff)[^"'?]+)["']/g;
let m;
while ((m = re.exec(indexHtml)) !== null) staticPaths.add(m[1].split("?")[0]);
for (const p of staticPaths) await download(p);

// 4) Download ALL missing assets (2 passes)
for (let pass = 1; pass <= 2; pass++) {
  const missing = audit(`pass ${pass}`);
  if (!missing.length) break;
  let done = 0;
  await pool(missing, async (asset) => {
    if (await download(asset)) {
      done++;
      if (done % 50 === 0) console.log(`  … ${done}/${missing.length}`);
    }
  }, CONCURRENCY);
  console.log(`✅ pass ${pass}: downloaded ${done}/${missing.length}`);
}

const finalMissing = audit("final");
if (finalMissing.length) {
  console.warn("⚠️ Still missing", finalMissing.length, "— first 10:");
  finalMissing.slice(0, 10).forEach((a) => console.warn(" ", a));
}

// 5) SPA 404 + nojekyll
const idx = preserveAskKiki(fs.readFileSync(path.join(OUT, "index.html"), "utf8"));
fs.writeFileSync(path.join(OUT, "index.html"), idx, "utf8");
fs.writeFileSync(path.join(OUT, "404.html"), idx, "utf8");
if (!fs.existsSync(path.join(OUT, ".nojekyll"))) fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}
console.log(`✅ Done. ${walk(OUT).length} files, ${fs.readdirSync(path.join(OUT, "_assets/v11")).length} assets in v11/`);
