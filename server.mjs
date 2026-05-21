import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SITE_DIR = path.join(__dirname, "site");
const PORT = Number(process.env.PORT || 3344);
const UPSTREAM = "https://www.kikisun.site";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".otf": "font/otf",
  ".eot": "application/vnd.ms-fontobject",
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || "application/octet-stream";
  const data = fs.readFileSync(filePath);
  res.writeHead(200, { "Content-Type": mime, "Cache-Control": "no-store" });
  res.end(data);
}

async function proxyToUpstream(req, res) {
  const { default: https } = await import("https");
  const url = UPSTREAM + req.url;
  console.log("[proxy]", url);
  const proto = url.startsWith("https") ? https : (await import("http")).default;
  const upReq = proto.get(url, { headers: { "User-Agent": "Mozilla/5.0" } }, (upRes) => {
    const chunks = [];
    upRes.on("data", (c) => chunks.push(c));
    upRes.on("end", () => {
      const body = Buffer.concat(chunks);
      res.writeHead(upRes.statusCode, {
        "Content-Type": upRes.headers["content-type"] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(body);
    });
  });
  upReq.on("error", () => { res.writeHead(502); res.end("Bad Gateway"); });
}

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = req.url.split("?")[0];

    const hasExt = /\.[a-zA-Z0-9]+$/.test(urlPath);
    const localPath = path.join(SITE_DIR, urlPath);

    // If the file exists locally, serve it
    if (fs.existsSync(localPath) && fs.statSync(localPath).isFile()) {
      return serveFile(res, localPath);
    }

    // Asset (has extension) but not local → proxy to upstream
    if (hasExt) {
      return proxyToUpstream(req, res);
    }

    // SPA route (no extension) → serve index.html
    const indexPath = path.join(SITE_DIR, "index.html");
    if (fs.existsSync(indexPath)) {
      return serveFile(res, indexPath);
    }

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
