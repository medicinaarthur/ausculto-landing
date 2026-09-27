import { product } from "./academy-product.mjs";
/** One-way, allowlisted assembly. Canonical implementation stays in this repository. */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  copyFileSync,
  existsSync,
  rmSync,
  readdirSync,
  lstatSync,
} from "node:fs";
import { resolve, join, dirname, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { presentation, validatePresentation } from "./academy-presentation.mjs";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const target = resolve(
  process.argv[2] || join(root, "../ausculto-academy-sites-preview"),
);
const out = join(target, "out");
const hash = (b) => createHash("sha256").update(b).digest("hex");
validatePresentation();
if (!existsSync(join(target, ".openai/hosting.json")))
  throw Error("Register the private Site before assembly");
if (relative(target, out) !== "out" || lstatSync(target).isSymbolicLink())
  throw Error("Unsafe preview target");
if (existsSync(out) && lstatSync(out).isSymbolicLink())
  throw Error("Symbolic preview target");
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
const routes = [
  "estudantes/index.html",
  "conteudos/index.html",
  ...presentation.articles.map((a) => `conteudos/${a.summaryId}/index.html`),
];
const manifest = {
  schemaVersion: 1,
  source: "ausculto-landing-deploy",
  files: {},
};
function save(name, bytes) {
  const path = join(out, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, bytes);
  manifest.files[name] = hash(bytes);
}
function previewHtml(html) {
  return html
    .replace(
      /(<head>)/,
      '$1<meta name="robots" content="noindex,nofollow,noarchive">',
    )
    .replace(
      /href="https:\/\/enamed\.auscultoapp\.com\/(?![^"\s]*\.(?:woff|png))([^"\s]*)"/g,
      'href="/enamed/$1"',
    )
    .replace(
      /href="https:\/\/www\.auscultoapp\.com\/(estudantes|conteudos)([^"\s]*)"/g,
      'href="/$1$2"',
    );
}
// Link rewrites must never touch canonical metadata.
function rewrite(html) {
  const canonical = html.match(/<link rel="canonical"[^>]+>/)?.[0];
  let result = previewHtml(html);
  if (canonical)
    result = result.replace(/<link rel="canonical"[^>]+>/, canonical);
  return result;
}
for (const route of routes)
  save(route, rewrite(readFileSync(join(root, "dist/site", route), "utf8")));
save("index.html", readFileSync(join(out, "estudantes/index.html")));
save(
  "enamed/index.html",
  rewrite(
    readFileSync(join(root, "dist/enamed-continuous/index.html"), "utf8"),
  ),
);
const assets = [
  ...product.assets,
  "assets/css/academy-content.css",
  "assets/js/academy.js",
  "assets/academy/academy_logo_mark.png",
  "assets/fonts/enamed/inter-var-latin.woff2",
  "assets/fonts/enamed/montserrat-var-latin.woff2",
  "favicon.png",
  ...presentation.assets.map((a) => a.url.slice(1)),
];
for (const asset of assets)
  save(asset, readFileSync(join(root, "site", asset)));
// Complete the explicit asset list with dependencies actually referenced by the
// generated public pages (favicons, shared brand assets, srcsets and CSS fonts).
// Resolve only inside the already-validated public build, never private sources.
const inspected = new Set();
for (;;) {
  const pending = Object.keys(manifest.files).filter(p => /\.(html|css|js)$/.test(p) && !inspected.has(p));
  if (!pending.length) break;
  for (const name of pending) {
    inspected.add(name);
    const text = readFileSync(join(out, name), "utf8");
    const refs = [...text.matchAll(/\/(?:assets\/[A-Za-z0-9_./-]+\.(?:ico|png|jpe?g|webp|avif|svg|woff2?|css|json|js|mp4|webm)|meta_tracking\.js)/g)].map(m => m[0].slice(1));
    for (const ref of new Set(refs)) {
      if (manifest.files[ref]) continue;
      if (ref.split('/').includes('..')) throw Error('Unsafe preview dependency '+ref);
      const built = join(root, 'dist/site', ref);
      if (!existsSync(built)) throw Error('Missing public preview dependency '+ref);
      save(ref, readFileSync(built));
    }
  }
}
save("robots.txt", "User-agent: *\nDisallow: /\n");
save(
  "_headers",
  "/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  X-Content-Type-Options: nosniff\n",
);
for (const route of [...routes, "index.html", "enamed/index.html"]) {
  const html = readFileSync(join(out, route), "utf8");
  if (
    /(?:file:|\b[A-Z]:[\\/]|academy_summary_assets|academy_summary_pdfs|\.local-demo|candidate\.json)/i.test(
      html,
    )
  )
    throw Error("Private data in preview");
  for (const m of html.matchAll(/(?:src|href)="(\/[^"?#]*)(?:[^" ]*)"/g)) {
    const ref = m[1];
    if (!ref) continue;
    const path = join(out, ref) + (ref.endsWith("/") ? "index.html" : "");
    if (!existsSync(path))
      throw Error("Broken preview URL " + ref + " in " + route);
  }
}
writeFileSync(
  join(target, "preview-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
writeFileSync(
  join(target, "README.md"),
  "# Ausculto Academy — private preview\n\nGenerated from ausculto-landing-deploy by scripts/build-academy-preview.mjs. Do not maintain a second implementation here. The out directory is the exact static source for Sites. Regenerate in the canonical repository before each deployment. Production canonicals are retained; preview indexing is disabled. No application data or complete PDFs are included.\n",
);
writeFileSync(join(target, ".gitignore"), "dist/\n*.tar.gz\nnode_modules/\n");
console.log(
  `Private preview assembled: ${Object.keys(manifest.files).length} files; ${routes.length + 2} pages.`,
);
