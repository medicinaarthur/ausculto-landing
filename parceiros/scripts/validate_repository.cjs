"use strict";

/**
 * Gate de integridade do portal do parceiro.
 *
 * Espelha o espírito do validador do repositório do admin: o repo hospeda UM
 * site e nada mais, não fala com o Firestore direto, e não carrega segredo.
 * Ele existe porque este portal é público e voltado ao parceiro — um deslize
 * aqui vira vazamento ou página quebrada na mão de quem divulga o produto.
 */
const fs = require("node:fs");
const path = require("node:path");

const portalRoot = path.resolve(__dirname, "..");
const repositoryRoot = path.resolve(portalRoot, "..");
const failures = [];

function assert(condition, message) {
  if (!condition) failures.push(message);
}

function readText(relativePath) {
  const base = relativePath === "firebase.json" || relativePath === ".firebaserc" ?
    repositoryRoot : portalRoot;
  return fs.readFileSync(path.join(base, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(readText(relativePath));
}

// ── Hosting: target isolado dentro do repositorio canonico ───────────────
const firebaseJson = readJson("firebase.json");
const hostingTargets = Array.isArray(firebaseJson.hosting) ?
  firebaseJson.hosting : [firebaseJson.hosting];
const partnerHosting = hostingTargets.find((entry) =>
  entry?.target === "parceiros");
assert(partnerHosting,
    "o alvo de hosting deve ser 'parceiros'");
assert(partnerHosting?.public === "parceiros/public",
    "o diretório publicado deve ser 'parceiros/public'");

const rewrites = partnerHosting?.rewrites || [];
assert(rewrites.length === 2, "devem existir exatamente 2 rewrites");
assert(rewrites[0].source === "/r/**" &&
  rewrites[0].function === "partnerLinkRedirect",
"o primeiro rewrite deve mandar /r/** para partnerLinkRedirect");
assert(rewrites[1].source === "**" && rewrites[1].destination === "/index.html",
    "o segundo rewrite deve servir a SPA");

const headerBlock = (partnerHosting?.headers || [])
    .find((entry) => entry.source === "**");
assert(headerBlock, "faltam os cabeçalhos globais");
const headers = Object.fromEntries(
    (headerBlock?.headers || []).map((h) => [h.key, h.value]),
);
assert(headers["X-Frame-Options"] === "DENY",
    "o portal não pode ser embutido em iframe");
assert(headers["X-Content-Type-Options"] === "nosniff",
    "falta X-Content-Type-Options: nosniff");
assert(String(headers["X-Robots-Tag"] || "").includes("noindex"),
    "o portal do parceiro não deve ser indexado");

const firebaseRc = readJson(".firebaserc");
assert(firebaseRc.projects?.default === "auscultoapp",
    "o projeto padrão deve ser auscultoapp");
const targets = firebaseRc.targets?.auscultoapp?.hosting || {};
assert(targets.parceiros?.length === 1 &&
  targets.parceiros[0] === "auscultoapp-parceiros",
".firebaserc deve mapear parceiros somente para auscultoapp-parceiros");

// ── Sem dependências e sem deploy escondido em script ────────────────────
const pkg = readJson("package.json");
assert(!pkg.dependencies || Object.keys(pkg.dependencies).length === 0,
    "o portal não deve ter dependências de runtime");
for (const [name, command] of Object.entries(pkg.scripts || {})) {
  assert(!/deploy/i.test(name),
      `script de deploy não é permitido aqui: ${name}`);
  assert(!/\bfirebase\s+deploy\b/.test(command),
      `script ${name} não pode invocar firebase deploy`);
}

// ── Página ───────────────────────────────────────────────────────────────
const indexHtml = readText("public/index.html");
assert(indexHtml.includes("<title>Portal do Embaixador — Ausculto</title>"),
    "título da página divergente");
assert(/name="robots"[^>]*noindex/.test(indexHtml),
    "falta a meta robots noindex");
assert(indexHtml.includes('src="/config.js"'),
    "index.html deve carregar config.js antes do app");
assert(indexHtml.includes('type="module" src="/app.js"'),
    "index.html deve carregar app.js como módulo");

// ── Cliente não fala com o Firestore direto ──────────────────────────────
// Todo dado do portal passa por callable; as regras negam leitura direta.
// Se alguém adicionar um getFirestore aqui, o painel silenciosamente falharia
// em produção e a pessoa perderia tempo procurando o motivo.
const appJs = readText("public/app.js");
const couponUiJs = readText("public/coupon_ui.js");
assert(!/firebase-firestore/.test(appJs),
    "o portal não deve importar o SDK do Firestore");
assert(!/getFirestore|collection\(/.test(appJs),
    "o portal não deve acessar o Firestore diretamente");
assert(appJs.includes("initializeAppCheck"),
    "o App Check é obrigatório no portal");
assert(appJs.includes("coupon.shareable === true") &&
  appJs.includes('$("link-block").classList.toggle("hidden", !shareable)') &&
  appJs.includes("function resetQr()") &&
  appJs.includes('if (!activeLink) return;'),
"QR e divulgação precisam ficar ocultos quando o cupom não estiver disponível");
assert(!appJs.includes("ganhe PRO grátis") &&
  couponUiJs.includes("couponBenefitLabel"),
"o texto compartilhado deve vir do benefício retornado pelo backend");

// ── Nenhum segredo no repositório ────────────────────────────────────────
const SECRET_PATTERNS = [
  /re_[A-Za-z0-9]{20,}/, // Resend
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /"private_key"\s*:/,
  /AIzaSy[0-9A-Za-z_-]{33}[0-9A-Za-z_-]+/, // chave web mais longa que o normal
];
for (const relativePath of ["public/app.js", "public/config.js",
  "public/coupon_ui.js", "public/index.html", "public/qr.js"]) {
  const content = readText(relativePath);
  for (const pattern of SECRET_PATTERNS) {
    assert(!pattern.test(content),
        `possível segredo em ${relativePath}`);
  }
}

// As callables usadas pelo cliente precisam ser as do portal — nunca uma
// callable admin, que o parceiro não pode chamar.
const callableNames = [...appJs.matchAll(/call\("([^"]+)"\)/g)]
    .map((match) => match[1])
    .sort();
const expectedCallables = [
  "partnerGetAssets",
  "partnerGetDashboard",
  "partnerGetStatement",
  "partnerGetTimeseries",
  "partnerRequestLoginLink",
];
assert(
    JSON.stringify([...new Set(callableNames)]) ===
      JSON.stringify(expectedCallables),
    `callables do cliente divergentes: ${callableNames.join(", ")}`,
);
for (const name of callableNames) {
  assert(name.startsWith("partner"),
      `o portal só pode chamar callables partner*: ${name}`);
}

// ── Resultado ────────────────────────────────────────────────────────────
if (failures.length) {
  for (const message of failures) {
    console.error(`[validate_repository] ${message}`);
  }
  process.exit(1);
}

console.log(
    `[validate_repository] OK: target parceiros isolado, ` +
    `${expectedCallables.length} callables partner*, sem dependências, ` +
    `sem acesso direto ao Firestore.`,
);
