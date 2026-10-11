// Contrato de rastreio do enamed.auscultoapp.com, medido no navegador.
//
//   PLAYWRIGHT_PATH=.../node_modules/playwright node scripts/test-enamed-tracking.mjs <base> [<base> ...]
//   ex.: ... https://enamed.auscultoapp.com http://127.0.0.1:8790
//
// Roda o MESMO roteiro em cada endereço e imprime o contrato de cada um, para
// comparar o ar (base) com a página nova. Nada sai do navegador: o Pixel é
// substituído por um arquivo vazio (as chamadas ficam na fila do fbq), o envio
// para facebook.com é bloqueado e /_consent/reference responde localmente.
//
// Falha (exit 1) quando um invariante quebra:
//   - terceiros antes da decisão de consentimento;
//   - boot sem contentName/eventSource 'landing_enamed_2026' ou sem consentimento obrigatório;
//   - Pixel ausente depois do aceite, PageView sem hero_variant;
//   - botão com data-event="enamed_cta_click" sem evento, sem cta_position, fora de
//     app.auscultoapp.com ou sem ac_ref depois do aceite;
//   - atribuição dos links (regra do meta_tracking.js):
//       chegada por anúncio -> utm_* do anúncio + landing_cta=ads_enamed,
//         landing_content=<variante>_<posição>, landing_campaign=site_2026;
//       chegada orgânica -> utm_source=landing, utm_medium=ads_enamed,
//         utm_campaign=site_2026, utm_content=<variante>_<posição>;
//   - ?angulo=tempo|erros sem trocar o prefixo da variante (utm_content ou landing_content);
//   - demo sem enamed_demo_question_started/answered;
//   - erro de JavaScript ou violação de CSP.
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const bases = process.argv.slice(2);
if (!bases.length) { console.error('uso: node scripts/test-enamed-tracking.mjs <base> [<base> ...]'); process.exit(2); }

const REF = 'REFERENCIA_DE_TESTE';
const CAMPAIGN = 'utm_source=meta&utm_medium=paid_social&utm_campaign=coorte_teste&utm_content=AD_TESTE&fbclid=CLIQUE_TESTE';
const THIRD = /facebook\.(net|com)|googletagmanager|google-analytics|doubleclick|analytics\.google/;

async function open(browser, base, query, mobile = false) {
  const context = await browser.newContext(mobile ? { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } : { viewport: { width: 1440, height: 900 } });
  const third = [];
  const errors = [];
  const csp = [];
  await context.route('**/*', route => {
    const url = route.request().url();
    if (url.includes('/_consent/reference')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, reference: REF }) });
    }
    if (url.includes('/_bridge/appstore-click')) return route.fulfill({ status: 204, body: '' });
    if (THIRD.test(url)) {
      third.push(url.split('?')[0]);
      return route.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    }
    return route.continue();
  });
  const page = await context.newPage();
  page.on('pageerror', e => errors.push(String(e).slice(0, 200)));
  page.on('console', m => { if (/Content Security Policy|Refused to/i.test(m.text())) csp.push(m.text().slice(0, 200)); });
  await page.goto(`${base.replace(/\/$/, '')}/?${query}`, { waitUntil: 'networkidle' });
  return { context, page, third, errors, csp };
}

const layer = page => page.evaluate(() => (window.dataLayer || []).filter(i => i && i.event).map(i => ({ ...i })));

async function contract(browser, base) {
  const c = { base, problems: [] };
  const fail = msg => c.problems.push(msg);

  // 1. Antes da decisão: nada de terceiros; boot e banner.
  const { context, page, third, errors, csp } = await open(browser, base, CAMPAIGN);
  if (third.length) fail(`terceiros antes do aceite: ${third.join(', ')}`);
  c.boot = await page.evaluate(() => ({
    contentName: (window.AUSCULTO_META_CONFIG || {}).contentName,
    eventSource: (window.AUSCULTO_META_CONFIG || {}).eventSource,
    requireConsent: window.AUSCULTO_REQUIRE_CONSENT === true,
    heroVariant: window.auscultoEnamedHeroVariant,
    banner: !!document.getElementById('consentBanner') && !!document.getElementById('consentAccept') && !!document.getElementById('consentEssential'),
  }));
  if (c.boot.contentName !== 'landing_enamed_2026' || c.boot.eventSource !== 'landing_enamed_2026') fail(`boot: ${JSON.stringify(c.boot)}`);
  if (!c.boot.requireConsent) fail('boot: consentimento não é obrigatório');
  if (!c.boot.banner) fail('banner de consentimento sem consentBanner/consentAccept/consentEssential');

  // 2. Aceite: Pixel carrega, PageView com hero_variant, referência nos links.
  await page.locator('#consentAccept').click();
  await page.waitForTimeout(1200);
  if (!third.some(u => /fbevents/.test(u))) fail('Pixel não carregou depois do aceite');
  const afterAccept = await layer(page);
  const pv = afterAccept.find(i => i.event === 'meta_page_view');
  c.pageView = pv ? { content_name: pv.content_name, hero_variant: pv.hero_variant } : null;
  if (!pv || !pv.hero_variant) fail('PageView ausente ou sem hero_variant');

  // 3. Cada botão rastreado: evento no clique, posição, destino e parâmetros.
  c.ctas = await page.evaluate(() => [...document.querySelectorAll('a[data-event="enamed_cta_click"]')].map((a, i) => ({ i, position: a.getAttribute('data-cta-position'), href: a.href, text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) })));
  if (!c.ctas.length) fail('nenhum botão com data-event="enamed_cta_click"');
  for (const cta of c.ctas) {
    const before = (await layer(page)).length;
    await page.evaluate(i => {
      const a = document.querySelectorAll('a[data-event="enamed_cta_click"]')[i];
      a.addEventListener('click', e => e.preventDefault(), { once: true });
      a.click();
    }, cta.i);
    const ev = (await layer(page)).slice(before).find(e => e.event === 'meta_enamed_cta_click');
    const url = new URL(await page.evaluate(i => document.querySelectorAll('a[data-event="enamed_cta_click"]')[i].href, cta.i));
    const q = Object.fromEntries(url.searchParams);
    cta.event = ev ? { cta_position: ev.cta_position, hero_variant: ev.hero_variant } : null;
    cta.query = { utm_campaign: q.utm_campaign, fbclid: q.fbclid, landing_cta: q.landing_cta, landing_content: q.landing_content, landing_campaign: q.landing_campaign, returnTo: q.returnTo, open: q.open, ac_ref: q.ac_ref ? 'sim' : 'não' };
    const tag = `botão "${cta.text}" (${cta.position})`;
    if (!cta.position) fail(`${tag}: sem data-cta-position`);
    if (!ev) fail(`${tag}: clique sem meta_enamed_cta_click`);
    else if (ev.cta_position !== cta.position) fail(`${tag}: evento com cta_position ${ev.cta_position}`);
    if (url.hostname !== 'app.auscultoapp.com') fail(`${tag}: destino ${url.hostname}`);
    if (q.utm_campaign !== 'coorte_teste' || q.fbclid !== 'CLIQUE_TESTE') fail(`${tag}: campanha do anúncio não chegou ao link ${JSON.stringify(cta.query)}`);
    if (q.landing_cta !== 'ads_enamed' || q.landing_campaign !== 'site_2026' || q.landing_content !== `direcao_${cta.position}`) fail(`${tag}: landing_* ${JSON.stringify(cta.query)}`);
    if (q.ac_ref !== REF) fail(`${tag}: sem ac_ref depois do aceite`);
  }

  // 4. Demo: começar e responder.
  const hasDemo = await page.locator('#demoForm input[name="demo-questao"]').count();
  if (hasDemo) {
    const before = (await layer(page)).length;
    await page.locator('#demoForm').scrollIntoViewIfNeeded();
    await page.locator('#demoForm label').first().click();
    await page.waitForTimeout(300);
    const evs = (await layer(page)).slice(before).map(e => e.event);
    c.demo = { started: evs.includes('meta_enamed_demo_question_started'), answered: evs.includes('meta_enamed_demo_question_answered') };
    if (!c.demo.started || !c.demo.answered) fail(`demo: ${JSON.stringify(c.demo)}`);
  } else fail('demo ausente (#demoForm com name="demo-questao")');

  // 5. Seções vistas, rolando a página inteira.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
  });
  await page.waitForTimeout(500);
  c.sections = [...new Set((await layer(page)).filter(e => e.event === 'meta_enamed_section_viewed').map(e => e.section_id))];

  // 6. Links de login.
  c.login = await page.evaluate(() => [...document.querySelectorAll('a[href*="app.auscultoapp.com"]:not([data-event])')].map(a => ({ position: a.getAttribute('data-cta-position'), utm_content: new URL(a.href).searchParams.get('utm_content') })));

  c.errors = errors;
  c.csp = csp;
  if (errors.length) fail(`erros de JS: ${errors.join(' | ')}`);
  if (csp.length) fail(`violações de CSP: ${csp.join(' | ')}`);
  await context.close();

  // 7. Chegada orgânica: os UTMs da própria landing ficam no link.
  {
    const o = await open(browser, base, '');
    await o.page.locator('#consentAccept').click();
    await o.page.waitForTimeout(900);
    c.organic = await o.page.evaluate(() => [...document.querySelectorAll('a[data-event="enamed_cta_click"]')].map(a => {
      const q = new URL(a.href).searchParams;
      return { position: a.getAttribute('data-cta-position'), utm_source: q.get('utm_source'), utm_medium: q.get('utm_medium'), utm_campaign: q.get('utm_campaign'), utm_content: q.get('utm_content'), ac_ref: q.get('ac_ref') };
    }));
    for (const b of c.organic) {
      if (b.utm_source !== 'landing' || b.utm_medium !== 'ads_enamed' || b.utm_campaign !== 'site_2026' || b.utm_content !== `direcao_${b.position}`) fail(`orgânico ${b.position}: ${JSON.stringify(b)}`);
      if (b.ac_ref !== REF) fail(`orgânico ${b.position}: sem ac_ref`);
    }
    if (o.errors.length) fail(`orgânico: erros de JS ${o.errors.join(' | ')}`);
    await o.context.close();
  }

  // 8. Variantes do topo: o prefixo acompanha o ?angulo= (utm_content no orgânico,
  //    landing_content na chegada por anúncio).
  c.variants = {};
  for (const v of ['tempo', 'erros']) {
    for (const [nome, query, key] of [['orgânico', `angulo=${v}`, 'utm_content'], ['anúncio', `${CAMPAIGN}&angulo=${v}`, 'landing_content']]) {
      const o = await open(browser, base, query);
      const r = await o.page.evaluate(key => ({
        variant: window.auscultoEnamedHeroVariant,
        prefixes: [...new Set([...document.querySelectorAll('a[data-event="enamed_cta_click"]')].map(a => (new URL(a.href).searchParams.get(key) || '').split('_')[0]))],
        h1: (document.querySelector('h1') || {}).textContent?.trim().replace(/\s+/g, ' ').slice(0, 90),
      }), key);
      c.variants[`${v} (${nome})`] = r;
      if (r.variant !== v || r.prefixes.length !== 1 || r.prefixes[0] !== v) fail(`?angulo=${v} ${nome}: ${JSON.stringify(r)}`);
      if (o.errors.length) fail(`?angulo=${v} ${nome}: erros de JS ${o.errors.join(' | ')}`);
      await o.context.close();
    }
  }
  return c;
}

const browser = await chromium.launch({ headless: true });
let failed = false;
for (const base of bases) {
  const c = await contract(browser, base);
  console.log(`\n=== ${base}`);
  console.log('boot', JSON.stringify(c.boot));
  console.log('pageView', JSON.stringify(c.pageView));
  console.log('botões:');
  for (const b of c.ctas || []) console.log(`  ${String(b.position).padEnd(8)} ${JSON.stringify(b.query)} evento=${b.event ? 'ok' : 'NÃO'}  "${b.text}"`);
  console.log('orgânico', JSON.stringify((c.organic || []).map(b => `${b.position}:${b.utm_content}`)));
  console.log('login', JSON.stringify(c.login));
  console.log('demo', JSON.stringify(c.demo), '| seções', JSON.stringify(c.sections));
  console.log('variantes', JSON.stringify(c.variants));
  if (c.problems.length) { failed = true; console.log('FALHOU:'); for (const p of c.problems) console.log('  - ' + p); }
  else console.log('ok: contrato íntegro');
}
await browser.close();
process.exit(failed ? 1 : 0);
