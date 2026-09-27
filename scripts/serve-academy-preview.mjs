/** Local-only QA server. ?textScale=2 checks 200% text without changing deployable files. */
import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { resolve, join, extname, relative, isAbsolute } from "node:path";
import { gzipSync } from 'node:zlib';
const root = resolve(
  process.argv[2] || "../ausculto-academy-sites-preview/out",
);
const port = Number(process.argv[3] || 4188);
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".webm": "video/webm",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".json": "application/json",
  ".xml": "application/xml",
};
createServer((req, res) => {
  try {
    const url = new URL(req.url, "http://localhost");
    let path = resolve(root, "." + decodeURIComponent(url.pathname));
    const rel = relative(root, path);
    if (rel.startsWith("..") || isAbsolute(rel)) throw Error("Outside root");
    if (statSync(path).isDirectory()) path = join(path, "index.html");
    let bytes = readFileSync(path);
    // Match static hosting's byte ranges: Chrome cannot seek a WebM served as
    // an unbounded chunked stream, even when its entire body is buffered.
    if (extname(path) === '.webm') {
      const size = bytes.length;
      const range = req.headers.range;
      let start = 0, end = size - 1;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match && (match[1] || match[2])) {
          start = match[1] ? Number(match[1]) : Math.max(0, size-Number(match[2]));
          end = match[1] && match[2] ? Math.min(Number(match[2]), size-1) : size-1;
        } else start = NaN;
        if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= size) {
          res.writeHead(416, {'Content-Range': `bytes */${size}`});
          res.end();
          return;
        }
      }
      res.writeHead(range ? 206 : 200, {
        'Content-Type': 'video/webm', 'Accept-Ranges': 'bytes',
        'Content-Length': end-start+1, 'Cache-Control': 'no-store',
        ...(range ? {'Content-Range': `bytes ${start}-${end}/${size}`} : {}),
      });
      res.end(req.method === 'HEAD' ? undefined : bytes.subarray(start,end+1));
      return;
    }
    if (extname(path) === ".html" && url.searchParams.get("textScale") === "2")
      bytes = Buffer.from(
        bytes
          .toString()
          .replace("</head>", "<style>html{font-size:200%}</style></head>"),
      );
    // Model static hosting's text compression in local performance measurements.
    const compressed=/\.(?:html|css|js|svg|json|xml|txt)$/.test(path)&&/\bgzip\b/.test(req.headers['accept-encoding']||'');
    if(compressed)bytes=gzipSync(bytes,{level:6});
    res.writeHead(200, {
      "Content-Type": types[extname(path)] || "application/octet-stream",
      "Cache-Control": process.env.QA_HOSTING_CACHE === '1'
        ? (/\.(?:css|js)$/.test(path) ? 'public, max-age=3600, must-revalidate'
          : /\.(?:png|jpg|jpeg|webp|avif|gif|svg|ico|woff|woff2|ttf|otf)$/.test(path) ? 'public, max-age=86400' : 'no-cache, no-store, must-revalidate')
        : "no-store",
      ...(compressed?{'Content-Encoding':'gzip','Vary':'Accept-Encoding'}:{}),
    });
    res.end(bytes);
  } catch {
    res.writeHead(404);
    res.end("Not found");
  }
}).listen(port, "127.0.0.1", () =>
  console.log("Local Academy QA: http://127.0.0.1:" + port),
);
