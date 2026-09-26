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

/** Um `<button data-event>` falso (demos, "ver planos"...). */
function makeButton(dataEvent, text = "Abrir demo") {
  const map = {"data-event": dataEvent};
  return {
    textContent: text,
    getAttribute: (name) => (name in map ? map[name] : null),
    closest(selector) {
      return selector === "button[data-event]" ? this : null;
    },
  };
}

function makeClassList() {
  const set = new Set();
  return {
    add: (c) => set.add(c),
    remove: (c) => set.delete(c),
    contains: (c) => set.has(c),
  };
}

/** Elemento minimo: o suficiente para o banner montar e ser inspecionado. */
function makeElement(tag, registry) {
  const el = {
    tagName: String(tag).toUpperCase(),
    children: [],
    attrs: {},
    listeners: {},
    parentNode: null,
    firstChild: null,
    classList: makeClassList(),
    setAttribute(name, value) {
      this.attrs[name] = String(value);
    },
    getAttribute(name) {
      return name in this.attrs ? this.attrs[name] : null;
    },
    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      this.firstChild = this.children[0];
      if (child.id) registry.set(child.id, child);
      return child;
    },
    insertBefore(child) {
      child.parentNode = this;
      this.children.unshift(child);
      this.firstChild = this.children[0];
      if (child.id) registry.set(child.id, child);
      return child;
    },
    removeChild(child) {
      this.children = this.children.filter((c) => c !== child);
      this.firstChild = this.children[0] || null;
      if (child.id) registry.delete(child.id);
      child.parentNode = null;
      return child;
    },
    addEventListener(name, fn) {
      this.listeners[name] = fn;
    },
  };
  return el;
}

function textOf(node) {
  if (!node) return "";
  if (node.nodeType === 3) return node.textContent;
  return (node.children || []).map(textOf).join("");
}

function findAll(node, predicate, out = []) {
  if (!node || node.nodeType === 3) return out;
  if (predicate(node)) out.push(node);
  (node.children || []).forEach((c) => findAll(c, predicate, out));
  return out;
}

/** Chamadas `gtag(...)` empilhadas no dataLayer, como arrays. */
function gtagCalls(log) {
  return log.dataLayer
      .filter((entry) => entry && typeof entry.length === "number")
      .map((entry) => Array.from(entry));
}

const GA4 = "G-J3TVNV426H";
const THIRD_PARTY = /connect\.facebook\.net|googletagmanager\.com|google-analytics\.com/;

function makeEnv({
  url = "https://enamed.auscultoapp.com/",
  consent = null,
  requireConsent = true,
  links = [],
  ga4 = "",
  initialCookies = {},
  ownBanner = false,
} = {}) {
  const log = {
    fbq: [], fetch: [], beacon: [], cookies: [], cookieWrites: [],
    cookieDeletes: [], dataLayer: [], scripts: [], cookieRaw: [], seq: [],
  };
  const cookies = new Map(Object.entries(initialCookies));
  const storage = new Map();
  if (consent) {
    storage.set("ausculto_consent_v1",
        JSON.stringify({decision: consent, ts: 1756000000, v: 1}));
  }
  const loc = new URL(url);
  const listeners = {};

  const win = {
    AUSCULTO_REQUIRE_CONSENT: requireConsent,
    AUSCULTO_META_CONFIG: {
      pixelId: "4322848531306781", debug: false, ga4MeasurementId: ga4,
    },
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
      log.seq.push("fetch");
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
      const nome = pair.slice(0, idx).trim();
      const valor = pair.slice(idx + 1);
      log.cookies.push({name: nome, value: valor});
      log.cookieRaw.push(String(raw));
      // `Max-Age=0` e como um navegador apaga um cookie.
      if (/Max-Age=0/i.test(raw)) {
        log.cookieDeletes.push(nome);
        cookies.delete(nome);
        return;
      }
      log.cookieWrites.push({name: nome, value: valor});
      log.seq.push("cookie:" + nome);
      cookies.set(nome, valor);
    },
    addEventListener: (name, fn) => {
      docListeners[name] = fn;
    },
    querySelectorAll: () => links,
    getElementById: (id) => registry.get(id) || null,
    createElement: (tag) => makeElement(tag, registry),
    createTextNode: (text) => ({nodeType: 3, textContent: String(text)}),
    // Todo <script> de terceiro entra por aqui: e o que o navegador baixaria.
    getElementsByTagName: () => [{parentNode: {insertBefore: (el) => {
      log.scripts.push(el.src);
    }}}],
    head: null,
    body: null,
    documentElement: {classList: makeClassList()},
  };
  const registry = new Map();
  win.document.head = makeElement("head", registry);
  win.document.body = makeElement("body", registry);
  if (ownBanner) registry.set("consentBanner", makeElement("section", registry));
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
  return {
    win, log, cookies,
    click: (link) => docListeners.click({target: link}),
    pageshow: () => listeners.pageshow && listeners.pageshow(),
  };
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
    const fbCookies = log.cookieWrites.filter((c) => c.name === "_fbc" ||
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

  // Site principal: tambem same-origin, resolvido pelo rewrite do target site.
  for (const host of ["auscultoapp.com", "www.auscultoapp.com"]) {
    const site = makeEnv({url: `https://${host}/estudantes/`, consent: null});
    site.win.auscultoConsent.grant();
    assert.equal(site.log.fetch[0].endpoint, "/_consent/reference",
        `${host}: a referencia e pedida same-origin`);
  }

  // E o rewrite existe no target `site` das DUAS configs, apontando para a
  // mesma Function (e regiao) do target enamed.
  const enamedRewrite = JSON.parse(fs.readFileSync(
      path.join(ROOT, "firebase.json"), "utf8")).hosting
      .find((h) => h.target === "enamed").rewrites
      .find((r) => r.source === "/_consent/reference");
  for (const config of ["firebase.json", "firebase.site-release.json"]) {
    const siteTarget = JSON.parse(fs.readFileSync(path.join(ROOT, config), "utf8"))
        .hosting.find((h) => h.target === "site");
    const rewrite = (siteTarget.rewrites || [])
        .find((r) => r.source === "/_consent/reference");
    assert.deepEqual(rewrite, enamedRewrite,
        `${config}: target site reescreve /_consent/reference para a mesma Function`);
  }

  // Host desconhecido cai no caminho que NAO fala com o projeto de teste.
  const outro = makeEnv({url: "https://exemplo.test/", consent: null});
  outro.win.auscultoConsent.grant();
  assert.ok(!outro.log.fetch[0].endpoint.includes("meta-staging"),
      "host desconhecido nunca aponta para staging");
}

function testGrantedReferenceCarriesAttributionAfterCookies() {
  const {win, log} = makeEnv({
    consent: null,
    url: "https://enamed.auscultoapp.com/diagnostico" +
      "?utm_source=meta&utm_medium=paid_social" +
      "&utm_campaign=enamed_2026_launch&campaign_id=120247802060210560" +
      "&adset_id=120247802143580560&ad_id=120000000000000001" +
      "&fbclid=CLIQUE_ASSINADO&email=nao%40pode.test",
  });

  win.auscultoConsent.grant();
  const body = JSON.parse(log.fetch[0].init.body);
  assert.equal(body.decision, "granted");
  assert.equal(body.attribution.url,
      "https://enamed.auscultoapp.com/diagnostico");
  assert.equal(body.attribution.query.utm_campaign, "enamed_2026_launch");
  assert.equal(body.attribution.query.ad_id, "120000000000000001");
  assert.match(body.attribution.fbc, /^fb\.1\.\d+\.CLIQUE_ASSINADO$/,
      "o fbc precisa existir antes de a referencia ser solicitada");
  assert.ok(!JSON.stringify(body).includes("nao@pode.test"),
      "query nao allowlisted nao atravessa");

  const denied = makeEnv({
    consent: null,
    url: "https://enamed.auscultoapp.com/?utm_source=meta&fbclid=NEGADO",
  });
  denied.win.auscultoConsent.deny();
  const deniedBody = JSON.parse(denied.log.fetch[0].init.body);
  assert.equal(deniedBody.decision, "denied");
  assert.equal(deniedBody.attribution, undefined,
      "recusa nunca transporta atribuicao");
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

// ── 9. O CTA aponta para o webapp do AMBIENTE ────────────────────────────
function testAppHostFollowsEnvironment() {
  const fazerLink = () => makeLink(
      "https://app.auscultoapp.com/?utm_medium=ads_enamed" +
      "&returnTo=enamed-diagnostico",
      {"data-event": "enamed_cta_click"});

  // Producao: o host do HTML permanece.
  const prodLink = fazerLink();
  const prod = makeEnv({
    consent: "granted", url: "https://enamed.auscultoapp.com/",
    links: [prodLink],
  });
  prod.click(prodLink);
  assert.equal(new URL(prodLink._map.href).hostname, "app.auscultoapp.com",
      "em producao o CTA vai para o webapp de producao");

  // Preview: o CTA tem de ir ao PREVIEW do webapp. Apontar para producao
  // faria o QA validar um bundle que nao tem o Gate C.
  const previewLink = fazerLink();
  const preview = makeEnv({
    consent: "granted",
    url: "https://auscultoapp-enamed--qa-3tldakhp.web.app/",
    links: [previewLink],
  });
  preview.click(previewLink);
  const destino = new URL(previewLink._map.href);
  assert.equal(destino.hostname, "auscultoapp-webapp--gate-c-mcyyb19w.web.app",
      "no preview o CTA vai para o preview do webapp");
  assert.equal(destino.searchParams.get("returnTo"), "enamed-diagnostico",
      "e returnTo sobrevive a reescrita do host");
}

// ── 10. Recusar DEPOIS de conceder apaga o que ficou ─────────────────────
//
// Encontrado no QA em navegador real. O teste anterior nunca exercitou a
// sequencia conceder→recusar na landing, e `deny()` apenas parava de
// escrever: o `_fbp` ja gravado permanecia, e o script do Pixel continuava
// carregado. Parar de chamar `track` nao e revogar.
function testDenyAfterGrantPurges() {
  // Com um `fbclid` na URL, conceder escreve `_fbc` — e `_fbp` quem escreve e
  // o proprio script do Pixel, nao o nosso. Por isso a purga precisa APAGAR os
  // dois, e nao apenas deixar de escreve-los.
  const {win, log} = makeEnv({
    consent: null,
    url: "https://enamed.auscultoapp.com/?fbclid=CLIQUE123",
  });

  win.auscultoConsent.grant();
  const escritos = log.cookieWrites.map((c) => c.name);
  assert.ok(escritos.includes("_fbc"),
      `conceder escreve _fbc a partir do fbclid (escreveu: ${escritos})`);

  win.auscultoConsent.deny();
  assert.ok(log.cookieDeletes.includes("_fbp"),
      "recusar tem de APAGAR _fbp, nao so parar de escrever");
  assert.ok(log.cookieDeletes.includes("_fbc"), "e _fbc tambem");
  // E o Pixel recebe a revogacao — o script ja carregado continuaria vivo.
  assert.ok(log.fbq.some((a) => a[0] === "consent" && a[1] === "revoke"),
      "o Pixel tem de receber consent/revoke");
}

// ── 11. Antes do aceite: nenhum terceiro, so o cookie proprio ─────────────
function testNoThirdPartyBeforeConsent() {
  for (const consent of [null, "denied"]) {
    const {log} = makeEnv({
      consent,
      ga4: GA4,
      url: "https://auscultoapp.com/?utm_source=meta&utm_medium=paid_social" +
        "&utm_campaign=site_q4&fbclid=CLIQUE&gclid=GCLID",
    });
    assert.deepEqual(log.scripts, [],
        `consent=${consent}: nenhum script de terceiro antes do aceite`);
    assert.equal(log.fbq.length, 0);
    const chamadas = gtagCalls(log);
    assert.deepEqual(chamadas.map((c) => c.slice(0, 2).join(":")),
        ["consent:default"], "antes do aceite so o default do consent mode");
    assert.equal(chamadas[0][2].analytics_storage, "denied");
    assert.equal(chamadas[0][2].ad_storage, "denied");
    assert.equal(chamadas[0][2].ad_user_data, "denied");
    assert.equal(chamadas[0][2].ad_personalization, "denied");
    const terceiros = log.cookieWrites.filter((c) =>
      /^(_fbc|_fbp|_ga|_gid|_gcl)/.test(c.name));
    assert.deepEqual(terceiros, [], "nenhum cookie de terceiro");
  }
}

// ── 12. Parametros de campanha persistem antes do consentimento ─────────
function testParamsPersistedBeforeConsent() {
  const {log} = makeEnv({
    consent: null,
    url: "https://auscultoapp.com/?utm_source=google&utm_medium=cpc" +
      "&utm_campaign=residencia_2027&utm_id=77&gclid=GC1&ttclid=TT1" +
      "&campaign_id=120&email=nao%40pode.test",
  });
  const escrito = log.cookieWrites.find((c) => c.name === "ausculto_attr_v1");
  assert.ok(escrito, "o cookie first-party de atribuicao e gravado sem consentimento");
  const valor = new URLSearchParams(decodeURIComponent(escrito.value));
  assert.equal(valor.get("utm_campaign"), "residencia_2027");
  assert.equal(valor.get("utm_id"), "77");
  assert.equal(valor.get("gclid"), "GC1");
  assert.equal(valor.get("ttclid"), "TT1");
  assert.equal(valor.get("campaign_id"), "120");
  assert.ok(Number(valor.get("ts")) > 0);
  assert.equal(valor.get("email"), null, "fora da allowlist nao persiste");
  const raw = log.cookieRaw.find((r) => r.startsWith("ausculto_attr_v1="));
  assert.match(raw, /Domain=\.auscultoapp\.com/, "no dominio raiz, legivel pelo app");
  assert.match(raw, /SameSite=Lax/);
  const expira = Date.parse(/expires=([^;]+)/.exec(raw)[1]);
  const dias = (expira - Date.now()) / 864e5;
  assert.ok(dias > 89 && dias <= 90, `90 dias (foi ${dias.toFixed(1)})`);

  // Visita sem parametros nao apaga o ultimo clique.
  const organico = makeEnv({consent: null, url: "https://auscultoapp.com/estudantes/"});
  assert.ok(!organico.log.cookieWrites.some((c) => c.name === "ausculto_attr_v1"));
}

// ── 13. Aceite carrega Pixel e GA4; eventos espelhados ───────────────────
function testThirdPartyAfterAccept() {
  const cta = makeLink(
      "https://app.auscultoapp.com/?utm_source=landing&utm_medium=site" +
      "&utm_content=hero_start&utm_campaign=site_2026");
  const {win, log, click} = makeEnv({
    consent: null,
    ga4: GA4,
    url: "https://auscultoapp.com/?utm_source=meta&utm_campaign=q4&token=segredo",
    links: [cta],
  });
  win.auscultoConsent.grant();

  assert.ok(log.scripts.some((s) => /connect\.facebook\.net\/.*fbevents\.js/.test(s)),
      "o Pixel carrega depois do aceite");
  assert.ok(log.scripts.includes(
      "https://www.googletagmanager.com/gtag/js?id=" + GA4),
  "o gtag carrega depois do aceite");
  assert.ok(log.fbq.some((a) => a[0] === "init"));

  const chamadas = gtagCalls(log);
  const update = chamadas.find((c) => c[0] === "consent" && c[1] === "update");
  assert.equal(update[2].analytics_storage, "granted");
  const config = chamadas.find((c) => c[0] === "config");
  assert.equal(config[1], GA4);
  assert.equal(config[2].page_location,
      "https://auscultoapp.com/?utm_source=meta&utm_campaign=q4",
      "page_location leva so a campanha allowlisted, nunca a query inteira");
  assert.equal(config[2].send_page_view, true);

  // Clique no CTA: o mesmo evento no Pixel e no GA4, com o mesmo id.
  click(cta);
  const pixel = log.fbq.find((a) => a[1] === "app_cta_click");
  const ga = gtagCalls(log).find((c) => c[0] === "event" && c[1] === "app_cta_click");
  assert.ok(pixel && ga, "CTA espelhado no Pixel e no GA4");
  assert.equal(ga[2].event_id, pixel[3].eventID);
  assert.ok(!JSON.stringify(ga[2]).includes("segredo"));

  // Demo: ViewContent no Pixel, view_content no GA4.
  log.dataLayer.length = 0;
  const demo = makeButton("cta_demo_questao_open");
  // O handler e o mesmo do documento.
  click(demo);
  const demoGa = gtagCalls(log).find((c) => c[0] === "event");
  assert.equal(demoGa[1], "view_content");
  assert.equal(demoGa[2].content_name, "questoes_demo");
  // PageView do Pixel nao duplica o page_view do config.
  assert.ok(!gtagCalls(log).some((c) => c[1] === "page_view"));
}

// ── 14. Recusa apaga Meta E Google ───────────────────────────────────────
function testDenyPurgesGoogleToo() {
  const {win, log} = makeEnv({
    consent: null,
    ga4: GA4,
    url: "https://auscultoapp.com/?fbclid=CLIQUE9",
    initialCookies: {_ga: "GA1.1.1.1", "_ga_J3TVNV426H": "GS1", "_gcl_aw": "x"},
  });
  win.auscultoConsent.grant();
  win.auscultoConsent.deny();
  for (const nome of ["_fbp", "_fbc", "_ga", "_ga_J3TVNV426H", "_gcl_aw"]) {
    assert.ok(log.cookieDeletes.includes(nome), `recusar apaga ${nome}`);
  }
  const ultimo = gtagCalls(log).filter((c) => c[0] === "consent").pop();
  assert.equal(ultimo[1], "update");
  assert.equal(ultimo[2].analytics_storage, "denied");
  assert.equal(win["ga-disable-" + GA4], true, "o gtag e desligado");
  // O dado tecnico proprio nao e cookie de terceiro: fica.
  assert.ok(!log.cookieDeletes.includes("ausculto_attr_v1"));
}

// ── 15. /estudantes/: returnTo, lojas e parametros persistidos ──────────
function persistedCookie(extra = "") {
  return {
    ausculto_attr_v1: encodeURIComponent(
        "utm_source=meta&utm_medium=paid_social&utm_campaign=academy_q4" +
        "&utm_content=video_a&fbclid=FB_PERSIST&ts=1758000000" + extra),
  };
}

function testEstudantesLinksCarryPersistedParams() {
  const tema = makeLink("https://app.auscultoapp.com/?returnTo=" +
      encodeURIComponent("academy-summary:abdome-agudo"));
  const play = makeLink(
      "https://play.google.com/store/apps/details?id=br.com.ausculto.app");
  const apple = makeLink("https://apps.apple.com/br/app/ausculto/id6760672276");
  const env = makeEnv({
    consent: null,
    url: "https://auscultoapp.com/estudantes/",
    initialCookies: persistedCookie(),
    links: [tema, play, apple],
  });
  // Idempotente: pageshow e o proprio clique repassam pelo link.
  env.pageshow();
  env.click(tema);

  const destino = new URL(tema._map.href);
  assert.equal(destino.searchParams.get("returnTo"),
      "academy-summary:abdome-agudo", "returnTo intacto");
  assert.equal(destino.searchParams.get("utm_campaign"), "academy_q4");
  assert.equal(destino.searchParams.get("fbclid"), "FB_PERSIST");
  assert.equal(destino.searchParams.get("landing_page"), "/estudantes/");
  assert.equal(destino.searchParams.get("landing_cta"), null,
      "repassar pelo link nao inventa UTM propria a partir da paga");
  assert.equal(destino.searchParams.get("landing_campaign"), null);
  assert.equal(destino.searchParams.getAll("utm_campaign").length, 1);

  const playUrl = new URL(play._map.href);
  assert.equal(playUrl.searchParams.get("id"), "br.com.ausculto.app");
  const referrer = new URLSearchParams(playUrl.searchParams.get("referrer"));
  assert.equal(referrer.get("utm_source"), "meta");
  assert.equal(referrer.get("utm_medium"), "paid_social");
  assert.equal(referrer.get("utm_campaign"), "academy_q4");
  assert.equal(referrer.get("utm_content"), "video_a");
  assert.equal(referrer.get("fbclid"), null, "identificador de clique nao vai a loja");
  assert.match(play._map.href, /referrer=utm_source%3Dmeta%26/,
      "o referrer vai codificado dentro do link");

  const appleUrl = new URL(apple._map.href);
  assert.equal(appleUrl.searchParams.get("pt"), "128571619");
  assert.equal(appleUrl.searchParams.get("ct"), "academy_q4");
  assert.equal(appleUrl.searchParams.get("mt"), "8");
}

function testHomeLinksDefaultsAndLandingMarkers() {
  const hero = makeLink(
      "https://app.auscultoapp.com/?utm_source=landing&utm_medium=site" +
      "&utm_content=hero_start&utm_campaign=site_2026");
  const play = makeLink(
      "https://play.google.com/store/apps/details?id=br.com.ausculto.app");
  const apple = makeLink("https://apps.apple.com/br/app/id6760672276");
  const outraLoja = makeLink(
      "https://play.google.com/store/apps/details?id=com.outro.app");
  makeEnv({
    consent: null,
    url: "https://auscultoapp.com/",
    links: [hero, play, apple, outraLoja],
  });
  // Organico: as lojas recebem o default.
  const referrer = new URLSearchParams(
      new URL(play._map.href).searchParams.get("referrer"));
  assert.equal(referrer.get("utm_source"), "site");
  assert.equal(referrer.get("utm_medium"), "organic");
  assert.equal(new URL(apple._map.href).searchParams.get("ct"), "site_organic");
  assert.equal(outraLoja._map.href,
      "https://play.google.com/store/apps/details?id=com.outro.app",
      "so os links do Ausculto sao reescritos");
  // Sem campanha de entrada, a UTM propria do CTA fica como esta.
  const destino = new URL(hero._map.href);
  assert.equal(destino.searchParams.get("utm_campaign"), "site_2026");
  assert.equal(destino.searchParams.get("landing_page"), "/");

  // Com campanha persistida, ela vence e a da landing vira landing_*.
  const hero2 = makeLink(
      "https://app.auscultoapp.com/?utm_source=landing&utm_medium=site" +
      "&utm_content=hero_start&utm_campaign=site_2026");
  makeEnv({
    consent: null,
    url: "https://auscultoapp.com/",
    initialCookies: persistedCookie(),
    links: [hero2],
  });
  const pago = new URL(hero2._map.href);
  assert.equal(pago.searchParams.get("utm_campaign"), "academy_q4");
  assert.equal(pago.searchParams.get("landing_campaign"), "site_2026");
  assert.equal(pago.searchParams.get("landing_content"), "hero_start");
  assert.equal(pago.searchParams.get("landing_cta"), "site");
}

// ── 16. Clique em loja: evento proprio, so com consentimento ─────────────
function testStoreClickEvent() {
  const play = makeLink(
      "https://play.google.com/store/apps/details?id=br.com.ausculto.app",
      {text: "Google Play", "data-cta-position": "estudantes_hero"});
  const aceito = makeEnv({consent: "granted", ga4: GA4,
    url: "https://auscultoapp.com/estudantes/", links: [play]});
  aceito.click(play);
  const evento = aceito.log.fbq.find((a) => a[1] === "store_click");
  assert.equal(evento[0], "trackCustom", "loja e evento proprio, nao conversao");
  assert.equal(evento[2].store, "google_play");
  assert.equal(evento[2].cta_position, "estudantes_hero");
  assert.ok(gtagCalls(aceito.log).some((c) => c[0] === "event" && c[1] === "store_click"));

  const semDecisao = makeEnv({consent: null, ga4: GA4,
    url: "https://auscultoapp.com/estudantes/", links: [play]});
  semDecisao.click(play);
  assert.equal(semDecisao.log.fbq.length, 0);
  assert.ok(!gtagCalls(semDecisao.log).some((c) => c[0] === "event"));
  assert.match(play._map.href, /referrer=/, "mas o link segue com a origem");
}

// ── 17. Banner compartilhado ─────────────────────────────────────────────
function testSharedBanner() {
  const {win, log} = makeEnv({consent: null, ga4: GA4, url: "https://auscultoapp.com/"});
  const banner = win.document.getElementById("auscultoConsentBanner");
  assert.ok(banner, "sem decisao, o banner aparece");
  assert.equal(banner.getAttribute("aria-label"), "Preferências de cookies");
  assert.equal(win.document.body.firstChild, banner,
      "primeiro no DOM: o teclado e o leitor de tela chegam nele cedo");
  const botoes = findAll(banner, (n) => n.tagName === "BUTTON");
  assert.deepEqual(botoes.map(textOf), ["Recusar", "Aceitar"]);
  assert.ok(botoes.every((b) => b.type === "button"));
  const link = findAll(banner, (n) => n.tagName === "A")[0];
  assert.equal(link.href, "/politica-de-privacidade.html");
  assert.ok(win.document.getElementById("auscultoConsentBannerStyle"));

  botoes[1].listeners.click();
  assert.equal(win.auscultoConsent.state(), "granted");
  assert.equal(win.document.getElementById("auscultoConsentBanner"), null,
      "decidiu, o banner sai");
  assert.ok(log.scripts.length > 0);

  // Recusar pelo banner: nada carrega.
  const recusa = makeEnv({consent: null, ga4: GA4, url: "https://auscultoapp.com/"});
  const recusar = findAll(recusa.win.document.getElementById("auscultoConsentBanner"),
      (n) => n.tagName === "BUTTON")[0];
  recusar.listeners.click();
  assert.equal(recusa.win.auscultoConsent.state(), "denied");
  assert.deepEqual(recusa.log.scripts, []);

  // Rever a escolha reabre o banner.
  recusa.win.auscultoConsent.open();
  assert.ok(recusa.win.document.getElementById("auscultoConsentBanner"));

  // Ja decidido: sem banner. Pagina com banner proprio (ENAMED): sem banner.
  const decidido = makeEnv({consent: "denied", url: "https://auscultoapp.com/"});
  assert.equal(decidido.win.document.getElementById("auscultoConsentBanner"), null);
  const enamed = makeEnv({consent: null, ownBanner: true});
  assert.equal(enamed.win.document.getElementById("auscultoConsentBanner"), null);
}

// ── 18. Ordem: cookie do clique persistido ANTES da referencia ───────────
function testReferenceOrderingWithPersistedClick() {
  const {win, log} = makeEnv({
    consent: null,
    url: "https://auscultoapp.com/estudantes/",
    initialCookies: persistedCookie(),
  });
  win.auscultoConsent.grant();
  const fbc = log.seq.indexOf("cookie:_fbc");
  const fetch = log.seq.indexOf("fetch");
  assert.ok(fbc !== -1 && fetch !== -1 && fbc < fetch,
      `o _fbc e gravado antes do pedido da referencia (${log.seq})`);
  const body = JSON.parse(log.fetch[0].init.body);
  assert.equal(body.attribution.query.fbclid, "FB_PERSIST",
      "o clique persistido atravessa na referencia");
  assert.equal(body.attribution.query.utm_campaign, "academy_q4");
  assert.equal(body.attribution.fbc, "fb.1.1758000000.FB_PERSIST",
      "o _fbc usa o instante do clique, nao o do aceite");
  assert.equal(body.attribution.url, "https://auscultoapp.com/estudantes/");
}

// ── 19. O build injeta o mesmo include em toda pagina ────────────────────
function testBuiltPagesCarryTrackingInclude() {
  const semCr = (p) => fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
  assert.equal(semCr(path.join(ROOT, "site", "meta_tracking.js")), semCr(
      path.join(ROOT, "meta_tracking.js")),
  "site/meta_tracking.js tem de ser a copia do script testado aqui");
  const build = fs.readFileSync(path.join(ROOT, "scripts", "build-site.mjs"), "utf8");
  assert.match(build, /window\.AUSCULTO_REQUIRE_CONSENT=true/);
  assert.match(build, /ga4MeasurementId:"\$\{GA4_MEASUREMENT_ID\}"/);
  assert.match(build, /const GA4_MEASUREMENT_ID = "G-J3TVNV426H"/);

  // Se ha artefato, as paginas que importam tem o include (uma vez so).
  const dist = path.join(ROOT, "dist", "site");
  if (!fs.existsSync(path.join(dist, "index.html"))) return;
  for (const page of ["index.html", "estudantes/index.html", "ads-medico.html",
    "conteudos/index.html", "embaixadores/index.html"]) {
    const html = fs.readFileSync(path.join(dist, page), "utf8");
    assert.equal((html.match(/src="\/meta_tracking\.js\?v=[0-9a-f]{10}"/g) || []).length,
        1, `${page}: um include de /meta_tracking.js`);
    assert.ok(html.indexOf("AUSCULTO_REQUIRE_CONSENT=true") <
      html.indexOf("/meta_tracking.js?v="), `${page}: a flag vem antes do script`);
    assert.ok(!/connect\.facebook\.net|googletagmanager\.com/.test(html),
        `${page}: nenhum terceiro no HTML`);
  }
}

const main = async () => {
  testClicksAreNotConversions();
  testDenyByDefault();
  testSourceUrlHasNoQuery();
  testEndpointsResolveByHostname();
  testGrantedReferenceCarriesAttributionAfterCookies();
  testDenialAlsoRequestsReference();
  testBridgeCarriesConsentReference();
  testLandingUtmDoesNotOverwritePaid();
  await testReferenceReachesAppLinks();
  testAppHostFollowsEnvironment();
  testDenyAfterGrantPurges();
  testNoThirdPartyBeforeConsent();
  testParamsPersistedBeforeConsent();
  testThirdPartyAfterAccept();
  testDenyPurgesGoogleToo();
  testEstudantesLinksCarryPersistedParams();
  testHomeLinksDefaultsAndLandingMarkers();
  testStoreClickEvent();
  testSharedBanner();
  testReferenceOrderingWithPersistedClick();
  testBuiltPagesCarryTrackingInclude();
  console.log("test-tracking-contract: OK");
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
