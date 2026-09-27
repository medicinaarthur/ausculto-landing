#!/usr/bin/env node
/**
 * Contrato da entrada publica continua do ENAMED.
 *
 * O teste le a fonte e o artefato para impedir que a pagina volte a parecer
 * uma campanha datada ou que o build publique algo fora da allowlist.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagePath = join(root, "enamed", "continuous.html");
const buildPath = join(root, "scripts", "build-enamed-continuous.mjs");
const out = join(root, "dist", "enamed-continuous");
const node = process.execPath;

assert.ok(existsSync(pagePath), "a pagina continua deve existir");
assert.ok(existsSync(buildPath), "o build continuo deve existir");

const page = readFileSync(pagePath, "utf8");

assert.match(
  page,
  /<link\s+rel="canonical"\s+href="https:\/\/enamed\.auscultoapp\.com\/">/,
  "a URL canonica deve apontar para o subdominio publico",
);
assert.match(
  page,
  /<details\b[^>]*class="mobile-menu"/,
  "o menu mobile deve usar details nativo",
);
const interactions = readFileSync(
  join(root, "site/assets/js/academy.js"),
  "utf8",
);
assert.match(interactions, /const SAFE_UTM_KEYS/);
assert.match(interactions, /function preserveSafeUtm/);
assert.match(page, /collection-stage/);
assert.match(
  page,
  /01 \/ LEITURA[\s\S]*02 \/ REVISÃO[\s\S]*03 \/ PRÁTICA[\s\S]*04 \/ ACOMPANHAMENTO/,
);
assert.match(page, /69 temas/);
assert.match(page, /PRO atual/);
assert.doesNotMatch(page, /campaign-materials-v1|study-object/);
assert.match(
  page,
  /https:\/\/app\.auscultoapp\.com\//,
  "a entrada do app deve ser absoluta",
);
assert.match(
  page,
  /https:\/\/www\.auscultoapp\.com\/estudantes\//,
  "a rota de estudantes deve ser absoluta",
);
assert.match(
  page,
  /https:\/\/www\.auscultoapp\.com\/conteudos\//,
  "a rota de conteudos deve ser absoluta",
);

for (const forbidden of [
  /contagem regressiva/i,
  /faltam\s+\d+/i,
  /prova oficial/i,
  /\b202[0-9]\b/,
  /ao vivo/i,
  /\blive\b/i,
  /videoaulas?/i,
  /depoimentos?/i,
  /testemunhais?/i,
  /\.pdf\b/i,
  /editorial privado/i,
  /4\s*semanas/i,
  /programa de 4/i,
]) {
  assert.doesNotMatch(page, forbidden, `a pagina nao pode conter ${forbidden}`);
}

for (const rawHref of page.matchAll(/\shref="([^"]+)"/g)) {
  const href = rawHref[1];
  if (!href.startsWith("http")) continue;
  const origin = new URL(href).origin;
  assert.ok(
    [
      "https://app.auscultoapp.com",
      "https://www.auscultoapp.com",
      "https://enamed.auscultoapp.com",
    ].includes(origin),
    `link externo nao permitido: ${href}`,
  );
}

execFileSync(node, [buildPath], { cwd: root, stdio: "inherit" });
execFileSync(node, [buildPath, "--verify"], { cwd: root, stdio: "inherit" });

const sourceBeforeDriftCheck = readFileSync(pagePath, "utf8");
try {
  writeFileSync(
    pagePath,
    `${sourceBeforeDriftCheck}\n<!-- test source drift -->\n`,
  );
  assert.throws(
    () =>
      execFileSync(node, [buildPath, "--verify"], { cwd: root, stdio: "pipe" }),
    "a verificacao deve recusar uma fonte alterada depois do build",
  );
} finally {
  writeFileSync(pagePath, sourceBeforeDriftCheck);
}
execFileSync(node, [buildPath, "--verify"], { cwd: root, stdio: "inherit" });

const manifestPath = join(out, "release-manifest.json");
assert.ok(existsSync(manifestPath), "o artefato deve ter manifesto");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
assert.equal(manifest.artifact, "enamed-continuous");
assert.ok(manifest.aggregateSha256, "o manifesto deve ter hash agregado");
assert.ok(
  manifest.files.every((file) => !/\.pdf$|private|editorial/i.test(file.path)),
);
assert.ok(
  manifest.files.every((file) => !/campaign-materials-v1/i.test(file.path)),
);
assert.ok(manifest.files.some((file) => file.path === "/robots.txt"));
assert.ok(manifest.files.some((file) => file.path === "/sitemap.xml"));

console.log("ENAMED continuous contract passed");
