import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  lstatSync,
} from "node:fs";
import { dirname, join, relative, resolve, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  page,
  renderArticles,
  renderIndex,
  origin,
  releaseHash,
} from "./academy-articles.mjs";

import { studentLanding } from "./academy-landing.mjs";
import {
  presentation,
  areas,
  renderPresentationArticles,
} from "./academy-presentation.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "site"),
  out = join(root, "dist", "site");
const allowed = new Set([
  ".html",
  ".css",
  ".js",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".ico",
  ".svg",
  ".mp4",
  ".woff",
  ".woff2",
  ".txt",
  ".xml",
  ".json",
]);
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
// Tracking unificado: TODA pagina HTML publicada recebe o mesmo include, com o
// consentimento obrigatorio. O script so carrega terceiros (Pixel, GA4) depois
// do aceite; antes disso guarda apenas a origem da campanha em cookie proprio.
// Measurement id publico do app web (lib/firebase_options.dart, web).
const GA4_MEASUREMENT_ID = "G-J3TVNV426H";
const trackingSource = join(root, "meta_tracking.js");
const TRACKING_TAG =
  /<script\b[^>]*\bsrc=["'][^"']*meta_tracking\.js[^"']*["'][^>]*>\s*<\/script>\s*/gi;
const trackingInclude = (version) =>
  `<script>window.AUSCULTO_REQUIRE_CONSENT=true;window.AUSCULTO_META_CONFIG=Object.assign({ga4MeasurementId:"${GA4_MEASUREMENT_ID}"},window.AUSCULTO_META_CONFIG||{});</script>` +
  `<script src="/meta_tracking.js?v=${version}" defer></script>`;
const sameText = (a, b) =>
  readFileSync(a, "utf8").replace(/\r\n/g, "\n") ===
  readFileSync(b, "utf8").replace(/\r\n/g, "\n");
// Minificação conservadora de CSS: tira comentários e espaços redundantes fora de
// strings e url(); não reescreve nenhum valor (o CSSOM resultante é o mesmo).
function minifyCss(css) {
  let out = "",
    i = 0,
    space = false;
  const n = css.length;
  const emit = (s) => {
    if (space && out && !"{};,:(".includes(out.at(-1)) && !"{};,)".includes(s[0]))
      out += " ";
    space = false;
    if (s === "}" && out.at(-1) === ";") out = out.slice(0, -1);
    out += s;
  };
  while (i < n) {
    const c = css[i];
    if (c === "/" && css[i + 1] === "*") {
      const end = css.indexOf("*/", i + 2);
      if (end < 0) throw Error("Unclosed CSS comment");
      i = end + 2;
      space = true;
    } else if (/\s/.test(c)) {
      i++;
      space = true;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < n && css[j] !== c) j += css[j] === "\\" ? 2 : 1;
      if (j >= n) throw Error("Unclosed CSS string");
      emit(css.slice(i, j + 1));
      i = j + 1;
    } else if (/^url\(\s*[^"'\s)]/i.test(css.slice(i, i + 6))) {
      const end = css.indexOf(")", i);
      emit(css.slice(i, end + 1));
      i = end + 1;
    } else {
      emit(c);
      i++;
    }
  }
  return out + "\n";
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (lstatSync(p).isSymbolicLink())
      throw Error("Symlinks cannot enter public output");
    return e.isDirectory() ? files(p) : [p];
  });
}
const manifestPath = join(root, "dist", "site-manifest.json");
if (process.argv.includes("--verify")) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  for (const [name, sha] of Object.entries(manifest.sources || {}))
    if (hash(readFileSync(join(root, name))) !== sha)
      throw Error("Source changed: " + name);
  if (
    JSON.stringify(
      files(source)
        .map((p) => relative(root, p).replaceAll("\\", "/"))
        .sort(),
    ) !== JSON.stringify(manifest.sourceInventory)
  )
    throw Error("Source inventory changed");
  const actual = files(out)
    .map((p) => relative(out, p).replaceAll("\\", "/"))
    .sort();
  if (
    JSON.stringify(actual) !==
    JSON.stringify(Object.keys(manifest.files).sort())
  )
    throw Error("Output file list changed");
  for (const [name, sha] of Object.entries(manifest.files))
    if (hash(readFileSync(join(out, name))) !== sha)
      throw Error("Output changed: " + name);
  for (const name of actual.filter((n) => n.endsWith(".html"))) {
    const html = readFileSync(join(out, name), "utf8");
    if (
      (html.match(/src="\/meta_tracking\.js\?v=/g) || []).length !== 1 ||
      !html.includes("window.AUSCULTO_REQUIRE_CONSENT=true")
    )
      throw Error("Tracking include missing: " + name);
  }
  console.log("Site artifact verified");
} else {
  const flag = process.argv.indexOf("--release");
  const release =
    flag >= 0
      ? JSON.parse(readFileSync(resolve(process.argv[flag + 1]), "utf8"))
      : null;
  const articles = release
    ? renderArticles(release)
    : renderPresentationArticles(); // Validate entire release BEFORE writing.
  const sourceFiles = files(source);
  for (const p of sourceFiles)
    if (
      !allowed.has(extname(p).toLowerCase()) ||
      relative(source, p)
        .split(/[\\/]/)
        .some((s) => s.startsWith(".")) ||
      /\.map$|\.log$|credential|secret/i.test(p)
    )
      throw Error("Forbidden public file: " + p);
  if (resolve(out) !== resolve(root, "dist", "site"))
    throw Error("Unsafe output");
  // Uma unica fonte do script: a copia em site/ tem de ser a mesma da raiz
  // (a que o test-tracking-contract exercita).
  if (!sameText(join(source, "meta_tracking.js"), trackingSource))
    throw Error(
      "site/meta_tracking.js differs from meta_tracking.js; copy the root script into site/",
    );
  if (existsSync(out)) rmSync(out, { recursive: true });
  mkdirSync(out, { recursive: true });
  for (const p of sourceFiles) {
    const target = join(out, relative(source, p));
    mkdirSync(dirname(target), { recursive: true });
    cpSync(p, target);
  }
  // home-m.css é a única folha que bloqueia a render da homepage no celular: sai minificada.
  // (home.css, da vista desktop, segue byte a byte igual à fonte.)
  const mobileHomeCss = join(out, "assets", "css", "home-m.css");
  if (existsSync(mobileHomeCss))
    writeFileSync(mobileHomeCss, minifyCss(readFileSync(mobileHomeCss, "utf8")));
  // Preserve the independently maintained ambassador routes and their exact local assets.
  const pending = existsSync(join(root, "embaixadores"))
    ? files(join(root, "embaixadores"))
    : [];
  const visited = new Set();
  while (pending.length) {
    const p = pending.pop();
    if (visited.has(p)) continue;
    visited.add(p);
    const rel = relative(root, p);
    if (
      rel.startsWith("..") ||
      !allowed.has(extname(p).toLowerCase()) ||
      lstatSync(p).isSymbolicLink()
    )
      throw Error("Unsafe ambassador dependency");
    const target = join(
      out,
      rel === "meta_tracking.js" ? "embaixadores/meta_tracking.js" : rel,
    );
    if (
      existsSync(target) &&
      hash(readFileSync(target)) !== hash(readFileSync(p))
    )
      throw Error("Shared ambassador asset differs from live site: " + rel);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(p, target);
    if ([".html", ".css"].includes(extname(p))) {
      const text = readFileSync(p, "utf8");
      if (extname(p) === ".html")
        writeFileSync(
          target,
          text.replace(
            /(?:\.\.\/)+meta_tracking\.js/g,
            "/embaixadores/meta_tracking.js",
          ),
        );
      for (const match of text.matchAll(
        /(?:src|href)=["']([^"']+)["']|url\(["']?([^)'" ]+)/g,
      )) {
        const ref = (match[1] || match[2]).split(/[?#]/)[0];
        if (!ref || /^(?:[a-z]+:|\/\/)/i.test(ref)) continue;
        let dep = ref.startsWith("/")
          ? resolve(root, ref.slice(1))
          : resolve(dirname(p), ref);
        if (!dep.startsWith(root + "\\") && !dep.startsWith(root + "/"))
          throw Error("Escaping local dependency");
        if (existsSync(dep) && lstatSync(dep).isDirectory())
          dep = join(dep, "index.html");
        if (
          existsSync(dep) &&
          [
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".svg",
            ".ico",
            ".css",
            ".js",
            ".woff2",
            ".woff",
            ".mp4",
          ].includes(extname(dep))
        )
          pending.push(dep);
      }
    }
  }
  const save = (name, html) => {
    const target = join(out, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html);
  };
  for (const a of articles) save(a.path, a.html);
  save(
    "conteudos/index.html",
    renderIndex(
      release?.summaries ??
        presentation.articles.map((a) => ({
          ...a,
          displayArea: areas[a.largeArea],
        })),
    ),
  );
  save(
    "estudantes/index.html",
    page({
      title: "Ausculto Academy | Residência, ENAMED e questões comentadas",
      description:
        "40 bancas, 160+ provas, 14.345 questões de residência comentadas e mais de 70 mil questões. ENAMED, flashcards e casos clínicos reais na Ausculto Academy.",
      path: "/estudantes/",
      body: studentLanding(),
    }),
  );
  const studentsPage = join(out, "estudantes", "index.html");
  writeFileSync(
    studentsPage,
    readFileSync(studentsPage, "utf8").replace(
      /<video\b[^>]*>[\s\S]*?<\/video>/g,
      "",
    ),
  );
  const index = readFileSync(join(out, "index.html"), "utf8");
  const canonical = /<link\b[^>]*rel=["']canonical["']/i.test(index)
    ? index
    : index.replace(
        "</head>",
        `<link rel="canonical" href="${origin}/"></head>`,
      );
  // Injeta os links das páginas geradas só se o rodapé ainda não os tiver
  // (a homepage 2026 já lista /estudantes/ e /conteudos/ no próprio rodapé).
  const footerHasLinks = /<footer[\s\S]*?href=["']\/estudantes\/["'][\s\S]*?<\/footer>/i.test(canonical);
  save(
    "index.html",
    footerHasLinks
      ? canonical
      : canonical.replace(
          "</footer>",
          '<p><a href="/estudantes/">Para estudantes</a> · <a href="/conteudos/">Conteúdos de medicina</a></p></footer>',
        ),
  );
  const urls = [
    "/",
    "/estudantes/",
    "/conteudos/",
    ...articles.map((a) => "/" + a.path.replace("index.html", "")),
  ];
  save(
    "sitemap.xml",
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map((p) => `<url><loc>${origin}${p}</loc></url>`).join("")}</urlset>`,
  );
  save(
    "robots.txt",
    `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`,
  );
  // CSS e JS ficam até 1 h no cache do navegador (Cache-Control do Hosting), mas o HTML é sempre revalidado.
  // Cada referência local a /assets/css|js ganha ?v=<hash do conteúdo>: HTML novo nunca combina com folha velha.
  const assetVersion = new Map();
  const versionOf = (ref) => {
    if (!assetVersion.has(ref)) {
      const f = join(out, ref.slice(1));
      assetVersion.set(ref, existsSync(f) ? hash(readFileSync(f)).slice(0, 10) : null);
    }
    return assetVersion.get(ref);
  };
  for (const p of files(out)) {
    const rel = relative(out, p).replaceAll("\\", "/");
    if (extname(p) !== ".html" || rel.startsWith("embaixadores/")) continue;
    const text = readFileSync(p, "utf8");
    const next = text.replace(
      /(["'])(\/assets\/(?:css|js)\/[\w.-]+\.(?:css|js))\1/g,
      (whole, q, ref) => {
        const v = versionOf(ref);
        return v ? `${q}${ref}?v=${v}${q}` : whole;
      },
    );
    if (next !== text) writeFileSync(p, next);
  }
  const trackingVersion = hash(readFileSync(join(out, "meta_tracking.js"))).slice(0, 10);
  for (const p of files(out)) {
    if (extname(p) !== ".html") continue;
    const rel = relative(out, p).replaceAll("\\", "/");
    const text = readFileSync(p, "utf8").replace(TRACKING_TAG, "");
    if (/meta_tracking\.js/.test(text))
      throw Error("Unrecognized tracking reference: " + rel);
    if ((text.match(/<\/head>/gi) || []).length !== 1)
      throw Error("Expected exactly one </head>: " + rel);
    writeFileSync(
      p,
      text.replace(/<\/head>/i, () => trackingInclude(trackingVersion) + "</head>"),
    );
  }
  const manifest = {
    schemaVersion: 1,
    releaseId: release?.releaseId ?? null,
    releaseSha256: release ? releaseHash(release) : null,
    files: {},
    sources: {},
    sourceInventory: sourceFiles
      .map((p) => relative(root, p).replaceAll("\\", "/"))
      .sort(),
  };
  for (const p of new Set([
    ...sourceFiles,
    ...visited,
    ...[
      "build-site.mjs",
      "academy-articles.mjs",
      "academy-landing.mjs",
      "academy-presentation.mjs",
      "academy-markdown.mjs",
      "academy-product.mjs",
      "data/academy-presentation.json",
      "data/academy-product.json",
    ].map((f) => join(root, "scripts", f)),
    join(root, "package-lock.json"),
    trackingSource,
  ]))
    manifest.sources[relative(root, p).replaceAll("\\", "/")] = hash(
      readFileSync(p),
    );
  for (const p of files(out).sort())
    manifest.files[relative(out, p).replaceAll("\\", "/")] = hash(
      readFileSync(p),
    );
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `Built ${Object.keys(manifest.files).length} public files; ${articles.length} reviewed articles. No publication performed.`,
  );
}
