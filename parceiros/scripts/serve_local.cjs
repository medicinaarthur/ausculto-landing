"use strict";

/**
 * Servidor estático mínimo para conferir o portal localmente.
 *
 * Não substitui o `firebase serve`: aqui as rewrites não existem e as
 * callables só respondem se o domínio local estiver autorizado no Firebase.
 * Serve para revisar layout, textos e o QR sem subir nada.
 *
 *   node scripts/serve_local.cjs   →   http://127.0.0.1:5055
 */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "public");
const port = Number(process.env.PORT) || 5055;

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json; charset=utf-8",
};

http.createServer((req, res) => {
  const requested = decodeURIComponent((req.url || "/").split("?")[0]);
  let filePath = path.join(root, requested);

  // Sem path traversal: só servimos de dentro de public/.
  if (!filePath.startsWith(root)) {
    res.writeHead(403).end("Forbidden");
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(root, "index.html"); // espelha a rewrite da SPA
  }

  const type = TYPES[path.extname(filePath)] || "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": type,
    "Cache-Control": "no-store",
  });
  fs.createReadStream(filePath).pipe(res);
}).listen(port, "127.0.0.1", () => {
  console.log(`Portal em http://127.0.0.1:${port}`);
});
