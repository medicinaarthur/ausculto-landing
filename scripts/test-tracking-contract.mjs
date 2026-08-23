#!/usr/bin/env node
/**
 * Contrato de tracking da landing, exercitado num DOM sintetico.
 *
 * `meta_tracking.js` roda no navegador e nao exporta nada — ele e um IIFE que
 * so fala com `window`. Este arquivo o carrega num contexto falso e verifica o
 * COMPORTAMENTO: o que dispara, o que nao dispara, e para onde as chamadas
 * vao.
 *
 * Cada bloco corresponde a um defeito concreto:
 *
 *   * clique no plano PRO emitia `InitiateCheckout` (evento de compra);
 *   * clique no app emitia `Lead` (evento de conversao);
 *   * `source_url` levava a query string inteira para dentro do evento;
 *   * a ponte da App Store nao mandava prova de consentimento;
 *   * o endpoint era fixo, e um rewrite nao atravessa projetos Firebase;
 *   * `utm_campaign=site_2026` podia sobrescrever a campanha paga de entrada.
 *
 * Uso: node scripts/test-tracking-contract.mjs
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = fs.readFileSync(path.join(ROOT, "meta_tracking.js"), "utf8");

/** Um `<a href>` falso, com os atributos que o classificador consulta. */
function makeLink(href, attrs = {}) {
  const map = {href, ...attrs};
  return {
    _tag: "a",
    textContent: attrs.text || "Comecar",
    getAttribute: (name) => (name in map ? map[name] : null),
    setAttribute: (name, value) => {
      map[name] = value;
    },
    closest(selector) {
      if (selector === "a[href]") return this;
      if (selector === "button[data-event]") return null;
      return null;
    },
    _map: map,
  };
}

function makeEnv({
  url = "https://enamed.auscultoapp.com/",
  consent = null,
  requireConsent = true,
  links = [],
} = {}) {
  const log = {
    fbq: [], fetch: [], beacon: [], cookies: [], dataLayer: [],
  };
  const cookies = new Map();
  const storage = new Map();
  if (consent) {
    storage.set("ausculto_consent_v1",
        JSON.stringify({decision: consent, ts: 1756000000, v: 1}));
  }
  const loc = new URL(url);
  const listeners = {};

  const win = {
    AUSCULTO_REQUIRE_CONSENT: requireConsent,
    AUSCULTO_META_CONFIG: {pixelId: "4322848531306781", debug: false},
    location: {
      href: loc.href, hostname: loc.hostname, pathname: loc.pathname,
      search: loc.search, protocol: loc.protocol, origin: loc.origin,
    },
    navigator: {
      sendBeacon: (endpoint, body) => {
        log.beacon.push({endpoint, body});
        return true;
      },
    },
    localStorage: {
      getItem: (k) => (storage.has(k) ? storage.get(k) : null),
      setItem: (k, v) => storage.set(k, v),
    },
    crypto: {randomUUID: () => "00000000-0000-4000-8000-00000000000" +
      (log.fbq.length % 10)},
    fetch: (endpoint, init) => {
      log.fetch.push({endpoint, init});
      return Promise.resolve({ok: false, json: () => Promise.resolve(null)});
    },
    addEventListener: (name, fn) => {
      listeners[name] = fn;
    },
    console: {log: () => {}},
    URL, URLSearchParams, Date, Math, JSON, String, Object, Array, Boolean,
    Number, RegExp, Error, Promise, encodeURIComponent, decodeURIComponent,
  };
  win.window = win;
  win.dataLayer = log.dataLayer;

  const docListeners = {};
  win.document = {
    title: "ENAMED 2026",
    readyState: "complete",
    get cookie() {
      return [...cookies.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
    },
    set cookie(raw) {
      const [pair] = String(raw).split(";");
      const idx = pair.indexOf("=");
      log.cookies.push({name: pair.slice(0, idx).trim(),
        value: pair.slice(idx + 1)});
      cookies.set(pair.slice(0, idx).trim(), pair.slice(idx + 1));
    },
    addEventListener: (name, fn) => {
      docListeners[name] = fn;
    },
    querySelectorAll: () => links,
    getElementById: () => null,
    createElement: () => ({}),
    getElementsByTagName: () => [{parentNode: {insertBefore: () => {}}}],
  };
  Object.defineProperty(win, "fbq", {
    configurable: true,
    get: () => win.__fbq,
    set: (value) => {
      win.__fbq = (...args) => {
        log.fbq.push(args);
        return value.apply(win, args);
      };
    },
  });

  vm.runInContext(SCRIPT, vm.createContext(win));
  return {win, log, cookies, click: (link) => docListeners.click({target: link})};
}

// ── 1. Clique nao e conversao ────────────────────────────────────────────
function testClicksAreNotConversions() {
  const {win, log, click} = makeEnv({consent: "granted"});
  const proLink = makeLink(
      "https://app.auscultoapp.com/?utm_medium=pricing&utm_content=pro",
      {text: "Assinar o PRO"});
  click(proLink);

  const eventos = log.fbq.filter((a) =>
    (a[0] === "track" || a[0] === "trackCustom") && a[1] !== "PageView");
  const nomes = eventos.map((a) => a[1]);
  assert.ok(!nomes.includes("InitiateCheckout"),
      "clicar em 'Assinar' NAO e iniciar um checkout");
  assert.ok(!nomes.includes("Lead"), "clicar num link NAO qualifica um lead");
  assert.ok(nomes.includes("pricing_cta_click"),
      "o clique vira um evento PROPRIO");
  // E ele e enviado como custom, nao como evento padrao da Meta.
  const proprio = eventos.find((a) => a[1] === "pricing_cta_click");
  assert.equal(proprio[0], "trackCustom",
      "evento proprio nao pode ir como evento padrao");

  // Link generico para o app: `app_cta_click`, nunca `Lead`.
  const {log: log2, click: click2} = makeEnv({consent: "granted"});
  click2(makeLink("https://app.auscultoapp.com/?utm_medium=hero"));
  const nomes2 = log2.fbq.filter((a) => a[0] === "trackCustom").map((a) => a[1]);
  assert.ok(nomes2.includes("app_cta_click"));
  assert.ok(!log2.fbq.some((a) => a[1] === "Lead"));

  // Um clique, UM evento. Os CTAs do ENAMED satisfazem as duas
  // classificacoes ao mesmo tempo (data-event e utm_medium=ads_enamed).
  const {log: log3, click: click3} = makeEnv({consent: "granted"});
  // O PageView de boot ja disparou (consentimento concedido). Contamos so o
  // que o CLIQUE produz.
  const antes = log3.fbq.length;
  click3(makeLink(
      "https://app.auscultoapp.com/?utm_medium=ads_enamed&returnTo=enamed-diagnostico",
      {"data-event": "enamed_cta_click", "data-cta-position": "hero"}));
  const disparos = log3.fbq.slice(antes).filter(
      (a) => a[0] === "track" || a[0] === "trackCustom");
  assert.equal(disparos.length, 1,
      `um clique tem de gerar UM evento (gerou ${disparos.length})`);
  assert.equal(disparos[0][1], "enamed_cta_click");

  // E o PageView de boot e UM so.
  const pageViews = log3.fbq.filter((a) => a[1] === "PageView");
  assert.equal(pageViews.length, 1, "um unico PageView por carga");
  void win;
}

// ── 2. Sem consentimento, nada ───────────────────────────────────────────
function testDenyByDefault() {
  for (const consent of [null, "denied"]) {
    const {log, click} = makeEnv({consent});
    click(makeLink("https://app.auscultoapp.com/?utm_medium=ads_enamed",
        {"data-event": "enamed_cta_click"}));
    assert.equal(log.fbq.length, 0,
        `consent=${consent}: nenhum evento pode ser disparado`);
    const fbCookies = log.cookies.filter((c) => c.name === "_fbc" ||
      c.name === "_fbp");
    assert.equal(fbCookies.length, 0,
        `consent=${consent}: nenhum cookie de atribuicao`);
  }
}

// ── 3. A URL do evento nao carrega query ─────────────────────────────────
function testSourceUrlHasNoQuery() {
  const {win, log, click} = makeEnv({
    consent: "granted",
    url: "https://enamed.auscultoapp.com/?utm_source=meta&fbclid=ABC&token=x",
  });
  click(makeLink("https://app.auscultoapp.com/?utm_medium=ads_enamed",
      {"data-event": "enamed_cta_click"}));

  const evento = log.fbq.find((a) => a[0] === "trackCustom");
  const params = evento[2];
  assert.equal(params.source_url, "https://enamed.auscultoapp.com/",
      "source_url e esquema + host + caminho");
  assert.ok(!String(params.source_url).includes("?"));
  assert.ok(!JSON.stringify(params).includes("token=x"),
      "nenhum parametro nao-allowlisted pode entrar no evento");
  void win;
}

// ── 4. Endpoints por hostname ────────────────────────────────────────────
function testEndpointsResolveByHostname() {
  // Preview: rewrite nao atravessa projetos, entao chama a URL direta.
  const preview = makeEnv({
    url: "https://auscultoapp-enamed--qa-3tldakhp.web.app/",
    consent: null,
  });
  preview.win.auscultoConsent.grant();
  assert.equal(preview.log.fetch.length, 1,
      "conceder tem de pedir a referencia assinada");
  assert.match(preview.log.fetch[0].endpoint,
      /^https:\/\/us-central1-auscultoapp-meta-staging\.cloudfunctions\.net\//,
      "no preview o endpoint e o das Functions de staging");
  assert.equal(preview.log.fetch[0].init.method, "POST");
  assert.equal(preview.log.fetch[0].init.credentials, "omit",
      "o endpoint publico nao recebe sessao");

  // Producao: same-origin, e o rewrite resolve.
  const prod = makeEnv({url: "https://enamed.auscultoapp.com/", consent: null});
  prod.win.auscultoConsent.grant();
  assert.equal(prod.log.fetch[0].endpoint, "/_consent/reference",
      "em producao a chamada e same-origin");

  // Host desconhecido cai no caminho que NAO fala com o projeto de teste.
  const outro = makeEnv({url: "https://exemplo.test/", consent: null});
  outro.win.auscultoConsent.grant();
  assert.ok(!outro.log.fetch[0].endpoint.includes("meta-staging"),
      "host desconhecido nunca aponta para staging");
}

// ── 5. A recusa TAMBEM viaja ─────────────────────────────────────────────
function testDenialAlsoRequestsReference() {
  const {win, log} = makeEnv({consent: null});
  win.auscultoConsent.deny();
  assert.equal(log.fetch.length, 1,
      "recusar tambem pede referencia: sem isso a pessoa e perguntada de novo");
  assert.equal(JSON.parse(log.fetch[0].init.body).decision, "denied");
  // E nenhum evento foi disparado por ter recusado.
  assert.equal(log.fbq.length, 0);
}

// ── 6. A ponte da App Store manda prova de consentimento ─────────────────
function testBridgeCarriesConsentReference() {
  const script = SCRIPT;
  assert.match(script, /consentReference: consentReference/,
      "o payload da ponte tem de carregar a referencia assinada");
  assert.match(script, /endpoints\.appStoreBridge/,
      "a ponte tem de usar o endpoint resolvido em runtime");
  assert.ok(!/APP_STORE_BRIDGE_ENDPOINT = '/.test(script),
      "endpoint fixo nao pode voltar");
}

// ── 7. UTM propria da landing nao sobrescreve midia paga ─────────────────
function testLandingUtmDoesNotOverwritePaid() {
  const link = makeLink(
      "https://app.auscultoapp.com/?utm_source=landing&utm_medium=ads_enamed" +
      "&utm_campaign=site_2026&returnTo=enamed-diagnostico",
      {"data-event": "enamed_cta_click"});
  const {click} = makeEnv({
    consent: "granted",
    url: "https://enamed.auscultoapp.com/?utm_source=meta" +
      "&utm_medium=paid_social&utm_campaign=fb_v04&campaign_id=120&ad_id=987" +
      "&fbclid=CLICK",
    links: [link],
  });
  click(link);

  const destino = new URL(link._map.href);
  assert.equal(destino.searchParams.get("utm_campaign"), "fb_v04",
      "a campanha PAGA de entrada vence a UTM propria da landing");
  assert.equal(destino.searchParams.get("utm_source"), "meta");
  assert.equal(destino.searchParams.get("fbclid"), "CLICK");
  // E a UTM da landing e PRESERVADA, sob um nome proprio.
  assert.equal(destino.searchParams.get("landing_campaign"), "site_2026");
  assert.equal(destino.searchParams.get("landing_cta"), "ads_enamed");
  // returnTo sobrevive: e a promessa da pagina.
  assert.equal(destino.searchParams.get("returnTo"), "enamed-diagnostico");
}

// ── 8. A referencia atravessa nos links do app ───────────────────────────
async function testReferenceReachesAppLinks() {
  const link = makeLink(
      "https://app.auscultoapp.com/?utm_medium=ads_enamed" +
      "&returnTo=enamed-diagnostico",
      {"data-event": "enamed_cta_click"});
  const referencia = "v2.cGF5bG9hZA.bWFj";
  const env = makeEnv({consent: null, links: [link]});
  // Resposta bem-sucedida da emissao.
  env.win.fetch = () => Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ok: true, reference: referencia}),
  });
  env.win.auscultoConsent.grant();
  await new Promise((r) => setTimeout(r, 0));
  await new Promise((r) => setTimeout(r, 0));

  const destino = new URL(link._map.href);
  assert.equal(destino.searchParams.get("ac_ref"), referencia,
      "a referencia assinada tem de chegar ao link do app");
  assert.equal(destino.searchParams.get("returnTo"), "enamed-diagnostico",
      "e returnTo continua intacto");
}

const main = async () => {
  testClicksAreNotConversions();
  testDenyByDefault();
  testSourceUrlHasNoQuery();
  testEndpointsResolveByHostname();
  testDenialAlsoRequestsReference();
  testBridgeCarriesConsentReference();
  testLandingUtmDoesNotOverwritePaid();
  await testReferenceReachesAppLinks();
  console.log("test-tracking-contract: OK");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
