#!/usr/bin/env node
/**
 * Artefato da landing ENAMED — reproduzivel e por allowlist.
 *
 * Duas decisoes que valem registro:
 *
 *  * **Allowlist, nunca `public: "."`.** O que nao esta na lista abaixo nao
 *    chega ao Hosting. E o oposto de uma denylist de `ignore`: esquecer de
 *    ignorar um arquivo novo publica o arquivo; esquecer de permitir um
 *    arquivo novo quebra o build, que e a falha segura.
 *  * **Manifest com hash por arquivo.** A regra de release do projeto e
 *    promover o MESMO artefato aprovado no preview, sem rebuild. Sem um hash
 *    agregado nao ha como provar que preview e producao sao iguais.
 *
 * Uso:  node scripts/build-enamed.mjs            (limpa e reconstroi dist/enamed)
 *       node scripts/build-enamed.mjs --verify   (so confere o manifest existente)
 */

import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, posix, relative, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "dist", "enamed");

/**
 * O que vai ao ar. `from` e relativo a raiz do repositorio; `to` e o caminho
 * publicado. Diretorios sao copiados inteiros e depois auditados por extensao.
 */
const FILES = [
  { from: "enamed/index.html", to: "index.html" },
  { from: "enamed/404.html", to: "404.html" },
  { from: "enamed/robots.txt", to: "robots.txt" },
  { from: "enamed/sitemap.xml", to: "sitemap.xml" },
  { from: "assets/css/enamed.css", to: "assets/css/enamed.css" },
  { from: "assets/js/enamed.js", to: "assets/js/enamed.js" },
  { from: "meta_tracking.js", to: "meta_tracking.js" },
  { from: "favicon.ico", to: "favicon.ico" },
  { from: "favicon.png", to: "favicon.png" },
];

const DIRS = [
  { from: "assets/enamed", to: "assets/enamed" },
  { from: "assets/fonts/enamed", to: "assets/fonts/enamed" },
];

/** Extensoes aceitas dentro dos diretorios copiados. Qualquer outra aborta. */
const ALLOWED_EXT = new Set([
  ".avif", ".webp", ".png", ".jpg", ".jpeg", ".svg", ".ico", ".gif",
  ".mp4", ".woff2", ".woff",
]);

/** Nomes que nunca podem entrar no artefato, venham de onde vierem. */
const FORBIDDEN = [/\.log$/i, /(^|\/)\.env/i, /firebase-debug/i, /\.map$/i, /(^|\/)\.DS_Store$/];

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

function walk(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else out.push(relative(base, full).split(sep).join(posix.sep));
  }
  return out;
}

function gitCommit() {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function gitDirty() {
  try {
    return execFileSync("git", ["status", "--porcelain"], { cwd: ROOT, encoding: "utf8" })
      .trim().length > 0;
  } catch {
    return true;
  }
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });

  const missing = [];

  for (const { from, to } of FILES) {
    const src = join(ROOT, from);
    if (!existsSync(src)) { missing.push(from); continue; }
    const dest = join(OUT, to);
    mkdirSync(dirname(dest), { recursive: true });
    cpSync(src, dest);
  }

  for (const { from, to } of DIRS) {
    const src = join(ROOT, from);
    if (!existsSync(src) || !statSync(src).isDirectory()) { missing.push(from + "/"); continue; }
    cpSync(src, join(OUT, to), { recursive: true });
  }

  if (missing.length) {
    console.error("[build-enamed] ABORTADO — arquivos da allowlist ausentes:");
    for (const m of missing) console.error("   -", m);
    process.exit(1);
  }

  // Auditoria do que efetivamente foi para o artefato.
  const published = walk(OUT).sort();
  const offenders = [];
  for (const rel of published) {
    if (FORBIDDEN.some((re) => re.test(rel))) { offenders.push(`${rel} (proibido)`); continue; }
    const declared = FILES.some((f) => f.to === rel);
    if (declared) continue;
    const ext = rel.slice(rel.lastIndexOf("."));
    const inDir = DIRS.some((d) => rel.startsWith(d.to + "/"));
    if (!inDir) offenders.push(`${rel} (fora da allowlist)`);
    else if (!ALLOWED_EXT.has(ext.toLowerCase())) offenders.push(`${rel} (extensao ${ext})`);
  }
  if (offenders.length) {
    console.error("[build-enamed] ABORTADO — artefato contem arquivos indevidos:");
    for (const o of offenders) console.error("   -", o);
    process.exit(1);
  }

  const files = published.map((rel) => ({
    path: "/" + rel,
    bytes: statSync(join(OUT, rel)).size,
    sha256: sha256(readFileSync(join(OUT, rel))),
  }));

  const aggregate = sha256(Buffer.from(files.map((f) => `${f.path}:${f.sha256}`).join("\n")));
  const manifest = {
    artifact: "enamed-landing",
    commit: gitCommit(),
    workingTreeDirty: gitDirty(),
    builtAt: new Date().toISOString(),
    fileCount: files.length,
    totalBytes: files.reduce((a, f) => a + f.bytes, 0),
    aggregateSha256: aggregate,
    files,
  };

  writeFileSync(join(OUT, "release-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

  console.log(`[build-enamed] ${files.length} arquivos, ${(manifest.totalBytes / 1048576).toFixed(2)} MB`);
  console.log(`[build-enamed] commit ${manifest.commit.slice(0, 12)}${manifest.workingTreeDirty ? " (arvore suja)" : ""}`);
  console.log(`[build-enamed] aggregateSha256 ${aggregate}`);
  console.log(`[build-enamed] artefato em dist/enamed`);
}

function verify() {
  const path = join(OUT, "release-manifest.json");
  if (!existsSync(path)) {
    console.error("[build-enamed] sem release-manifest.json — rode o build primeiro.");
    process.exit(1);
  }
  const manifest = JSON.parse(readFileSync(path, "utf8"));
  const bad = [];
  for (const f of manifest.files) {
    const disk = join(OUT, f.path.slice(1));
    if (!existsSync(disk)) { bad.push(`${f.path} ausente`); continue; }
    if (sha256(readFileSync(disk)) !== f.sha256) bad.push(`${f.path} divergente`);
  }
  const onDisk = walk(OUT).filter((p) => p !== "release-manifest.json");
  for (const rel of onDisk) {
    if (!manifest.files.some((f) => f.path === "/" + rel)) bad.push(`/${rel} nao esta no manifest`);
  }
  if (bad.length) {
    console.error("[build-enamed] VERIFICACAO FALHOU:");
    for (const b of bad) console.error("   -", b);
    process.exit(1);
  }
  console.log(`[build-enamed] verificado: ${manifest.fileCount} arquivos batem com o manifest`);
  console.log(`[build-enamed] aggregateSha256 ${manifest.aggregateSha256}`);
}

process.argv.includes("--verify") ? verify() : build();
