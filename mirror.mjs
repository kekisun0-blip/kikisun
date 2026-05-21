/**
 * Mirror www.kikisun.site into ./site
 * Then inject ONLY ask-kiki-only.css + ask-kiki-only.js (minimal chat widget)
 * No layout overrides, no translations — just Ask Kiki + CV download
 */
import https from "https";
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = "https://www.kikisun.site";
const OUT_DIR = path.join(__dirname, "site");
const MAX_FILES = 3000;

const visited = new Set();
const queue = [BASE_URL + "/"];
let fetched = 0;

function fetch(urlStr) {
  return new Promise((resolve, reject) => {
    const proto = urlStr.startsWith("https") ? https : http;
    const req = proto.get(urlStr, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        "Accept": "*/*",
        "Accept-Encoding": "identity",
      },
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const location = res.headers.location;
        const target = location.startsWith("http") ? location : BASE_URL + location;
        return fetch(target).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
    });
    req.on("error", reject);
    req.setTimeout(20000, () => { req.destroy(); reject(new Error("timeout: " + urlStr)); });
  });
}

function urlToLocalPath(urlPath) {
  const clean = urlPath.split("?")[0].replace(/^\//, "");
  if (!clean || clean.endsWith("/")) return path.join(OUT_DIR, clean || "", "index.html");
  const ext = path.extname(clean);
  if (!ext) return path.join(OUT_DIR, clean, "index.html");
  return path.join(OUT_DIR, clean);
}

function extractUrls(html, base) {
  const urls = new Set();
  const patterns = [
    /href=["']([^"']+)["']/g,
    /src=["']([^"']+)["']/g,
    /url\(["']?([^"')]+)["']?\)/g,
    /["'](\/_assets\/[^"']+)["']/g,
    /["'](\/[^"' ]+\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico|webp|otf|eot|json))["']/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(html)) !== null) {
      const u = m[1].trim();
      if (!u || u.startsWith("data:") || u.startsWith("mailto:") || u.startsWith("#") || u.startsWith("javascript:")) continue;
      if (u.startsWith("//")) { urls.add("https:" + u); continue; }
      if (u.startsWith("http")) { if (u.startsWith(BASE_URL)) urls.add(u); continue; }
      if (u.startsWith("/")) { urls.add(BASE_URL + u); continue; }
      try { urls.add(new URL(u, base).href); } catch {}
    }
  }
  return [...urls].filter((u) => u.startsWith(BASE_URL));
}

async function mirrorOne(urlStr) {
  if (visited.has(urlStr) || fetched >= MAX_FILES) return;
  visited.add(urlStr);

  let result;
  try { result = await fetch(urlStr); }
  catch (e) { console.warn("FETCH ERR", urlStr, e.message); return; }

  if (result.status !== 200) return;

  const urlPath = new URL(urlStr).pathname;
  const localPath = urlToLocalPath(urlPath);
  fs.mkdirSync(path.dirname(localPath), { recursive: true });

  const ct = result.headers["content-type"] || "";
  const isHtml = ct.includes("text/html");
  const isText = ct.includes("text") || ct.includes("json") || ct.includes("javascript") || ct.includes("xml");

  let body = result.body;
  let bodyStr = isText ? body.toString("utf8") : null;

  if (isHtml && bodyStr) {
    // Find all linked assets and add to queue
    const linked = extractUrls(bodyStr, urlStr);
    for (const u of linked) {
      if (!visited.has(u)) queue.push(u);
    }
    fs.writeFileSync(localPath, bodyStr, "utf8");
  } else if (isText && bodyStr) {
    const linked = extractUrls(bodyStr, urlStr);
    for (const u of linked) {
      if (!visited.has(u)) queue.push(u);
    }
    fs.writeFileSync(localPath, bodyStr, "utf8");
  } else {
    fs.writeFileSync(localPath, body);
  }

  fetched++;
  if (fetched % 50 === 0) console.log(`  … ${fetched} files`);
}

/**
 * Inject ask-kiki-only.css and ask-kiki-only.js into index.html
 */
function injectAskKikiIntoIndex() {
  const indexPath = path.join(OUT_DIR, "index.html");
  if (!fs.existsSync(indexPath)) { console.warn("index.html not found, skipping injection"); return; }

  let html = fs.readFileSync(indexPath, "utf8");
  if (html.includes("kiki-ask-kiki-inject")) { console.log("  Already injected, skipping."); return; }

  const cssTag = '<link rel="stylesheet" href="/_custom/ask-kiki-only.css?v=1"/><!-- kiki-ask-kiki-inject -->';
  const jsTag = '<script src="/_custom/ask-kiki-only.js?v=1" defer></script>';

  // Inject CSS before </head>
  if (html.includes("</head>")) {
    html = html.replace("</head>", cssTag + "\n</head>");
  } else {
    html = cssTag + "\n" + html;
  }

  // Inject JS before </body>
  if (html.includes("</body>")) {
    html = html.replace("</body>", jsTag + "\n</body>");
  } else {
    html = html + "\n" + jsTag;
  }

  fs.writeFileSync(indexPath, html, "utf8");
  console.log("  ✅ Injected ask-kiki-only.{css,js} into index.html");
}

async function main() {
  console.log("🔄 Mirroring", BASE_URL, "→", OUT_DIR);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Start with homepage
  while (queue.length > 0 && fetched < MAX_FILES) {
    const batch = queue.splice(0, 8);
    await Promise.all(batch.map((u) => mirrorOne(u)));
  }

  console.log(`✅ Mirrored ${fetched} files`);

  // Inject minimal Ask Kiki
  injectAskKikiIntoIndex();
}

main().catch(console.error);
