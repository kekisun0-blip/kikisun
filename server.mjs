import http from "http";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { promisify } from "util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(__dirname, "site");
const PORT = Number(process.env.PORT || 3344);
const UPSTREAM = "https://www.kikisun.site";
const gzip = promisify(zlib.gzip);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif":  "image/gif",
  ".svg":  "image/svg+xml",
  ".ico":  "image/x-icon",
  ".woff": "font/woff",
  ".woff2":"font/woff2",
  ".ttf":  "font/ttf",
  ".pdf":  "application/pdf",
  ".webp": "image/webp",
  ".mp4":  "video/mp4",
  ".webm": "video/webm",
  ".otf":  "font/otf",
  ".eot":  "application/vnd.ms-fontobject",
};

// Text types that benefit from gzip
const GZIP_TYPES = new Set([
  "text/html; charset=utf-8",
  "text/css; charset=utf-8",
  "application/javascript; charset=utf-8",
  "application/json; charset=utf-8",
  "image/svg+xml",
]);

// In-memory cache: stores {data, gzipped, mime, cacheHeader} for files < 2 MB
const memCache = new Map();
const MEM_CACHE_MAX = 2 * 1024 * 1024;

function getCacheControl(urlPath, ext) {
  // HTML pages: no-cache (always check for fresh version, use ETag)
  if (ext === ".html") return "no-cache";
  // Versioned assets (?v=N in query or hash-named files in _assets)
  if (/\/v\d+\/|[?&]v=\d+/.test(urlPath) || /[a-f0-9]{40}\.(png|webp|jpg|js|css|woff2?)$/i.test(urlPath)) {
    return "public, max-age=31536000, immutable";
  }
  // Fonts & images: 7-day cache
  if ([".woff", ".woff2", ".ttf", ".otf", ".eot", ".png", ".jpg", ".webp", ".gif", ".svg"].includes(ext)) {
    return "public, max-age=604800";
  }
  // JS/CSS without versioning: 1-day
  if (ext === ".js" || ext === ".css") return "public, max-age=86400";
  // JSON project data: 1-hour
  if (ext === ".json") return "public, max-age=3600";
  return "public, max-age=300";
}

function getFileCacheKey(filePath, overrideMime) {
  try {
    const st = fs.statSync(filePath);
    return `${filePath}|${overrideMime || ""}|${st.mtimeMs}|${st.size}`;
  } catch {
    return filePath + (overrideMime || "");
  }
}

async function serveFile(req, res, filePath, overrideMime) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = overrideMime || MIME[ext] || "application/octet-stream";
  const cacheHeader = getCacheControl(req.url, ext);
  const acceptsGzip = /gzip/.test(req.headers["accept-encoding"] || "");
  const canGzip = GZIP_TYPES.has(mime);

  const cacheKey = getFileCacheKey(filePath, overrideMime);
  if (ext !== ".html" && memCache.has(cacheKey)) {
    const cached = memCache.get(cacheKey);
    const body = (acceptsGzip && canGzip) ? cached.gzipped : cached.data;
    const headers = {
      "Content-Type": mime,
      "Cache-Control": cacheHeader,
      "Vary": canGzip ? "Accept-Encoding" : undefined,
    };
    if (acceptsGzip && canGzip) headers["Content-Encoding"] = "gzip";
    res.writeHead(200, Object.fromEntries(Object.entries(headers).filter(([, v]) => v != null)));
    res.end(body);
    return;
  }

  const data = fs.readFileSync(filePath);
  const headers = { "Content-Type": mime, "Cache-Control": cacheHeader };
  const cacheable = ext !== ".html" && data.length < MEM_CACHE_MAX;

  if (canGzip) headers["Vary"] = "Accept-Encoding";

  if (canGzip && acceptsGzip) {
    const gz = await gzip(data);
    headers["Content-Encoding"] = "gzip";
    if (cacheable) {
      try {
        const gz2 = gz.length > 0 ? gz : await gzip(data);
        memCache.set(cacheKey, { data, gzipped: gz2, mime });
      } catch {}
    }
    res.writeHead(200, headers);
    res.end(gz);
  } else {
    if (cacheable) {
      const gz2 = canGzip ? await gzip(data).catch(() => data) : data;
      memCache.set(cacheKey, { data, gzipped: gz2, mime });
    }
    res.writeHead(200, headers);
    res.end(data);
  }
}

// WebP content negotiation for PNG requests
function resolveFilePath(req, localPath) {
  const ext = path.extname(localPath).toLowerCase();
  if (ext === ".png") {
    const acceptsWebP = /image\/webp/.test(req.headers["accept"] || "");
    if (acceptsWebP) {
      const webpPath = localPath.replace(/\.png$/i, ".webp");
      if (fs.existsSync(webpPath) && fs.statSync(webpPath).isFile()) {
        return { filePath: webpPath, mime: "image/webp" };
      }
    }
  }
  return { filePath: localPath, mime: null };
}

async function proxyToUpstream(req, res) {
  const { default: https } = await import("https");
  const url = UPSTREAM + req.url;
  const proto = url.startsWith("https") ? https : (await import("http")).default;
  const upReq = proto.get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Encoding": "gzip" } }, (upRes) => {
    const chunks = [];
    upRes.on("data", (c) => chunks.push(c));
    upRes.on("end", () => {
      const body = Buffer.concat(chunks);
      res.writeHead(upRes.statusCode, {
        "Content-Type": upRes.headers["content-type"] || "application/octet-stream",
        "Cache-Control": "public, max-age=3600",
      });
      res.end(body);
    });
  });
  upReq.on("error", () => { res.writeHead(502); res.end("Bad Gateway"); });
}

const server = http.createServer(async (req, res) => {
  try {
    const urlPath = req.url.split("?")[0];
    const hasExt = /\.[a-zA-Z0-9]+$/.test(urlPath);
    const localPath = path.join(SITE_DIR, urlPath);

    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      const { filePath, mime } = resolveFilePath(req, localPath);
      return serveFile(req, res, filePath, mime);
    }

    if (hasExt) return proxyToUpstream(req, res);

    // SPA route → index.html
    const indexPath = path.join(SITE_DIR, "index.html");
    if (fs.existsSync(indexPath)) return serveFile(req, res, indexPath);

    await proxyToUpstream(req, res);
  } catch (e) {
    console.error(e);
    res.writeHead(500);
    res.end("Internal Server Error");
  }
});

server.listen(PORT, () => {
  console.log(`✅  kikisun-prod-clone running at http://127.0.0.1:${PORT}/`);
});
