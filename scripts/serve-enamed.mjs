// Servidor local do enamed.auscultoapp.com, com os MESMOS cabeçalhos do Hosting
// (CSP incluso, lido do firebase.json, target "enamed"), para que um script,
// fonte ou imagem de fora do site falhe aqui do mesmo jeito que falharia no ar.
//
//   node scripts/serve-enamed.mjs [--port 8790] [--meta-tracking caminho/do/meta_tracking.js]
//
// - "/" e "/404.html" saem de enamed/; "/assets/**" sai de assets/.
// - "/meta_tracking.js": por padrão o da raiz; use --meta-tracking para servir a
//   cópia baixada do ar (o arquivo que a publicação NUNCA substitui).
// - "/_consent/reference" (POST) e "/_bridge/appstore-click" respondem localmente,
//   como os rewrites do ar, sem tocar nas Functions.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = fileURLToPath(new URL('..', import.meta.url));
const arg = (name, fallback) => {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : fallback;
};
const port = Number(arg('--port', '8790'));
const metaTracking = arg('--meta-tracking', join(root, 'meta_tracking.js'));

const hosting = JSON.parse(readFileSync(join(root, 'firebase.json'), 'utf8')).hosting;
const target = (Array.isArray(hosting) ? hosting : [hosting]).find(h => h.target === 'enamed');
const headers = {};
for (const rule of target.headers || []) {
  if (rule.source !== '**') continue;
  for (const h of rule.headers) if (h.key !== 'Strict-Transport-Security') headers[h.key] = h.value;
}

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.avif': 'image/avif', '.mp4': 'video/mp4', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml',
};

function resolvePath(urlPath) {
  if (urlPath === '/' || urlPath === '/index.html') return join(root, 'enamed', 'index.html');
  if (urlPath === '/404.html') return join(root, 'enamed', '404.html');
  if (urlPath === '/meta_tracking.js') return metaTracking;
  if (urlPath === '/robots.txt' || urlPath === '/sitemap.xml') return join(root, 'enamed', urlPath.slice(1));
  if (urlPath === '/favicon.ico' || urlPath === '/favicon.png') return join(root, urlPath.slice(1));
  if (urlPath.startsWith('/assets/')) return join(root, normalize(urlPath).replace(/^[\\/]+/, ''));
  return null;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`);
  if (url.pathname === '/_consent/reference') {
    res.writeHead(req.method === 'POST' ? 200 : 405, { ...headers, 'Content-Type': 'application/json' });
    res.end(req.method === 'POST' ? JSON.stringify({ ok: true, reference: 'REFERENCIA_LOCAL' }) : '');
    return;
  }
  if (url.pathname === '/_bridge/appstore-click') { res.writeHead(204, headers); res.end(); return; }
  const file = resolvePath(url.pathname);
  if (!file || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404, { ...headers, 'Content-Type': 'text/html; charset=utf-8' });
    res.end(readFileSync(join(root, 'enamed', '404.html')));
    return;
  }
  const type = TYPES[extname(file).toLowerCase()] || 'application/octet-stream';
  const body = readFileSync(file);
  // como o Hosting: texto vai comprimido quando o navegador aceita (o peso medido fica igual ao do ar)
  if (/^(text\/|application\/(json|javascript))/.test(type) && /gzip/.test(req.headers['accept-encoding'] || '')) {
    res.writeHead(200, { ...headers, 'Content-Type': type, 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
    res.end(gzipSync(body));
    return;
  }
  res.writeHead(200, { ...headers, 'Content-Type': type });
  res.end(body);
});
server.listen(port, '127.0.0.1', () => console.log(`enamed local em http://127.0.0.1:${port}/ (meta_tracking: ${metaTracking})`));
