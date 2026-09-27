#!/usr/bin/env node
/** Build reproduzivel da entrada publica e continua do ENAMED. */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import {
  dirname,
  isAbsolute,
  join,
  posix,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist");
const OUT = join(ROOT, "dist", "enamed-continuous");
const FILES = [
  ...JSON.parse(
    readFileSync(join(ROOT, "scripts/data/academy-presentation.json"), "utf8"),
  ).assets.map((a) => ({ from: "site" + a.url, to: a.url.slice(1) })),
  { from: "site/assets/js/academy.js", to: "assets/js/academy.js" },
  { from: "site/favicon.png", to: "favicon.png" },
  { from: "enamed/continuous.html", to: "index.html" },
  {
    from: "site/assets/css/academy-content.css",
    to: "assets/css/academy-content.css",
  },
  {
    from: "site/assets/academy/academy_logo_mark.png",
    to: "assets/academy/academy_logo_mark.png",
  },
  {
    from: "site/assets/fonts/enamed/inter-var-latin.woff2",
    to: "assets/fonts/enamed/inter-var-latin.woff2",
  },
  {
    from: "site/assets/fonts/enamed/montserrat-var-latin.woff2",
    to: "assets/fonts/enamed/montserrat-var-latin.woff2",
  },
  {
    from: "site/assets/fonts/enamed/instrument-serif-400-italic-latin.woff2",
    to: "assets/fonts/enamed/instrument-serif-400-italic-latin.woff2",
  },
  { from: "favicon.ico", to: "favicon.ico" },
];
const GENERATED = {
  "robots.txt":
    "User-agent: *\nAllow: /\nSitemap: https://enamed.auscultoapp.com/sitemap.xml\n",
  "sitemap.xml":
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://enamed.auscultoapp.com/</loc><changefreq>monthly</changefreq><priority>1.0</priority></url></urlset>\n',
};
const ALLOWED_PATHS = new Set([
  ...FILES.map(({ to }) => to),
  ...Object.keys(GENERATED),
]);
const FORBIDDEN_PATH =
  /(?:^|\/)(?:\.env|node_modules|private|editorial)(?:\/|$)|\.pdf$|\.map$|\.log$/i;
const FORBIDDEN_TEXT = /\.pdf\b|editorial\s+privado/i;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function walk(directory, base = directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isSymbolicLink())
      throw new Error(`Symlink recusado: ${relative(ROOT, full)}`);
    if (entry.isDirectory()) files.push(...walk(full, base));
    else files.push(relative(base, full).split(sep).join(posix.sep));
  }
  return files.sort();
}

function assertSafeOutput() {
  const relativeOut = relative(DIST, OUT);
  if (
    !relativeOut ||
    relativeOut === "." ||
    isAbsolute(relativeOut) ||
    relativeOut === ".." ||
    relativeOut.startsWith(`..${sep}`)
  )
    throw new Error("Diretorio de saida fora de dist recusado.");
  if (existsSync(OUT) && lstatSync(OUT).isSymbolicLink())
    throw new Error("Diretorio de saida simbolico recusado.");
}

function sourceFiles() {
  const physical = FILES.map(({ from, to }) => {
    const source = join(ROOT, from);
    if (!existsSync(source) || lstatSync(source).isSymbolicLink())
      throw new Error(`Fonte ausente ou insegura: ${from}`);
    return { from, to, sha256: sha256(readFileSync(source)) };
  });
  const generated = Object.entries(GENERATED).map(([to, content]) => ({
    from: `generated:${to}`,
    to,
    sha256: sha256(Buffer.from(content)),
  }));
  return [...physical, ...generated];
}

function commit() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: ROOT,
      encoding: "utf8",
    }).trim();
  } catch {
    return "unknown";
  }
}

function dirty() {
  try {
    return (
      execFileSync("git", ["status", "--porcelain"], {
        cwd: ROOT,
        encoding: "utf8",
      }).trim().length > 0
    );
  } catch {
    return true;
  }
}

function audit(paths) {
  const unexpected = paths.filter(
    (path) => !ALLOWED_PATHS.has(path) || FORBIDDEN_PATH.test(path),
  );
  if (unexpected.length)
    throw new Error(`Artefato fora da allowlist: ${unexpected.join(", ")}`);
  for (const path of paths) {
    const extension = path.slice(path.lastIndexOf(".")).toLowerCase();
    if (![".html", ".css", ".txt", ".xml"].includes(extension)) continue;
    if (FORBIDDEN_TEXT.test(readFileSync(join(OUT, path), "utf8")))
      throw new Error(`Conteudo proibido: ${path}`);
  }
}

function makeManifest(paths, sources) {
  const files = paths.map((path) => ({
    path: `/${path}`,
    bytes: statSync(join(OUT, path)).size,
    sha256: sha256(readFileSync(join(OUT, path))),
  }));
  const aggregateSha256 = sha256(
    Buffer.from(files.map((file) => `${file.path}:${file.sha256}`).join("\n")),
  );
  return {
    schemaVersion: 1,
    artifact: "enamed-continuous",
    commit: commit(),
    workingTreeDirty: dirty(),
    fileCount: files.length,
    totalBytes: files.reduce((total, file) => total + file.bytes, 0),
    aggregateSha256,
    sourceFiles: sources,
    files,
  };
}

function build() {
  assertSafeOutput();
  const sources = sourceFiles();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  for (const { from, to } of FILES) {
    const source = join(ROOT, from);
    const target = join(OUT, to);
    mkdirSync(dirname(target), { recursive: true });
    cpSync(source, target);
  }
  for (const [to, content] of Object.entries(GENERATED))
    writeFileSync(join(OUT, to), content);
  const paths = walk(OUT);
  audit(paths);
  const manifest = makeManifest(paths, sources);
  writeFileSync(
    join(OUT, "release-manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(
    `[build-enamed-continuous] ${manifest.fileCount} arquivos; ${manifest.aggregateSha256}`,
  );
}

function verify() {
  assertSafeOutput();
  const manifestPath = join(OUT, "release-manifest.json");
  if (!existsSync(manifestPath))
    throw new Error("Sem release-manifest.json; rode o build primeiro.");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const paths = walk(OUT).filter((path) => path !== "release-manifest.json");
  audit(paths);
  const sources = sourceFiles();
  const recalculated = makeManifest(paths, sources);
  if (manifest.artifact !== "enamed-continuous")
    throw new Error("Manifesto de outro artefato.");
  if (
    JSON.stringify(manifest.sourceFiles) !==
    JSON.stringify(recalculated.sourceFiles)
  )
    throw new Error("Fontes do manifesto divergiram.");
  if (JSON.stringify(manifest.files) !== JSON.stringify(recalculated.files))
    throw new Error("Arquivos do manifesto divergiram.");
  for (const source of sources) {
    const artifact = recalculated.files.find(
      (file) => file.path === `/${source.to}`,
    );
    if (!artifact || artifact.sha256 !== source.sha256)
      throw new Error(`Fonte e artefato divergiram: ${source.to}`);
  }
  if (manifest.aggregateSha256 !== recalculated.aggregateSha256)
    throw new Error("Hash agregado divergente.");
  if (
    manifest.fileCount !== recalculated.fileCount ||
    manifest.totalBytes !== recalculated.totalBytes
  )
    throw new Error("Metadados do manifesto divergiram.");
  console.log(
    `[build-enamed-continuous] manifesto verificado; ${manifest.aggregateSha256}`,
  );
}

try {
  if (process.argv.includes("--verify")) verify();
  else build();
} catch (error) {
  console.error(`[build-enamed-continuous] ${error.message}`);
  process.exit(1);
}
