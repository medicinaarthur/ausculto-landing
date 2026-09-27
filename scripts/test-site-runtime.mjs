/** Reproducible regression/visual QA in an isolated installed Chrome. */
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { presentation } from './academy-presentation.mjs';
import { figures } from './academy-illustrations.mjs';

const base = process.env.SITE_QA_URL || 'http://127.0.0.1:4188';
const evidence = resolve('.local-art/site-lapidacao-20260927/after/runtime');
mkdirSync(evidence, { recursive: true });
const routes = ['/', '/estudantes/', '/conteudos/', ...presentation.articles.map(a => `/conteudos/${a.summaryId}/`)];
const report = { base, browser: 'installed Chrome, isolated headless test process', limitations: ['The static local server has no /_consent/reference Function; its expected 404 is recorded separately. Live consent integration is checked after release.', '200% zoom uses the equivalent 720 CSS px / DPR2 reflow of a 1440px window; it does not claim to change the user browser zoom.'], checks: [], issues: [], localFunctionUnavailable: [] };
const browser = await chromium.launch({ executablePath: process.env.SITE_QA_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const name = route => route === '/' ? 'home' : route.split('/').filter(Boolean).at(-1);
const marketing = /connect\.facebook|facebook\.com\/tr|google-analytics|googletagmanager/;

async function check(label, fn) {
  if(process.env.SITE_QA_CHECK&&!new RegExp(process.env.SITE_QA_CHECK).test(label))return;
  try { await fn(); report.checks.push({ label, pass: true }); console.log('PASS', label); }
  catch (error) { report.issues.push({ label, error: error.message }); console.error('FAIL', label, error.message); }
}
async function open(context, route) {
  const page = await context.newPage();
  page.qa = { errors: [], badResponses: [], marketing: [], requests: [] };
  page.on('pageerror', e => page.qa.errors.push(e.message));
  page.on('request', r => { page.qa.requests.push(r.url()); if (marketing.test(r.url())) page.qa.marketing.push(r.url()); });
  page.on('response', r => {
    if (!r.url().startsWith(base) || r.status() < 400) return;
    if (base.startsWith('http://127.0.0.1:') && new URL(r.url()).pathname === '/_consent/reference' && r.status() === 404) report.localFunctionUnavailable.push(route);
    else page.qa.badResponses.push(r.status() + ' ' + r.url());
  });
  const response = await page.goto(base + route, { waitUntil: 'load' });
  assert.equal(response.status(), 200);
  await page.evaluate(() => document.fonts.ready);
  const deny = page.locator('[data-consent-choice="denied"]');
  if (await deny.isVisible()) await deny.click();
  return page;
}
async function noOverflow(page) {
  const sizes = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
  assert.ok(sizes.document <= sizes.viewport + 1, JSON.stringify(sizes));
}
async function loadedImages(page, selector = 'main img') {
  for (const img of await page.locator(selector).all()) {
    if (!await img.isVisible()) continue;
    await img.scrollIntoViewIfNeeded();
    await img.evaluate(el => el.decode());
    assert.ok(await img.evaluate(el => el.complete && el.naturalWidth > 0));
  }
}
async function shot(page, suffix, target) {
  const path = resolve(evidence, suffix + '.png');
  if (target) { await target.scrollIntoViewIfNeeded(); await target.screenshot({ path, animations: 'disabled' }); }
  else await page.screenshot({ path, animations: 'disabled' });
}

try {
  for (const width of [360, 390, 768, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: 1, reducedMotion: 'reduce', hasTouch: width < 600 });
    for (const route of routes) await check(`layout ${name(route)} ${width}`, async () => {
      const page = await open(context, route);
      await loadedImages(page);
      await noOverflow(page);
      assert.equal(await page.locator('h1:visible').count(), 1);
      assert.deepEqual(page.qa.errors, []);
      assert.deepEqual(page.qa.badResponses, []);
      assert.deepEqual(page.qa.marketing, [], 'third party loaded before consent');
      if (route.startsWith('/conteudos/') && route !== '/conteudos/') {
        const a = presentation.articles.find(a => route.includes(a.summaryId));
        assert.equal(await page.locator('.reader-section').count(), a.blocks.length);
        assert.equal(await page.locator('.reader-figure').count(), figures.filter(f => f.summaryId === a.summaryId).length);
        assert.equal(await page.locator('[data-reader-toc]').getAttribute('open') !== null, width >= 1100);
        for (const fig of await page.locator('.reader-figure').all()) await shot(page, `${name(route)}-${width}-${await fig.getAttribute('data-figure')}`, fig);
      }
      await page.evaluate(() => scrollTo(0, 0));
      await shot(page, `${name(route)}-${width}-top`);
      if ([390, 1440].includes(width) && !route.includes('/conteudos/')) await page.screenshot({ path: resolve(evidence, `${name(route)}-${width}-full.png`), fullPage: true, animations: 'disabled' });
      await page.close();
    });
    await context.close();
  }

  for (const width of [390, 1440]) await check(`library + sim + books ${width}`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, hasTouch: width === 390, reducedMotion: 'reduce' });
    const page = await open(context, '/estudantes/');
    const rows = page.locator('.catalogue-list li:visible');
    assert.equal(await rows.count(), width === 390 ? 3 : 9);
    await page.locator('#catalogue-more').click();
    assert.equal(await rows.count(), width === 390 ? 6 : 18);
    await page.locator('#catalogue-search').fill('abdome');
    assert.ok(await page.locator('.catalogue-list a:visible[href*="/conteudos/abdome-agudo/"]').count());
    await page.locator('#catalogue-area').selectOption('pediatria');
    assert.equal(await rows.count(), 0);
    assert.ok(await page.locator('#catalogue-empty').isVisible());
    await page.locator('[data-catalogue-reset]').click();
    assert.equal(await rows.count(), width === 390 ? 3 : 9);
    assert.ok((await page.locator('#catalogue-status').innerText()).includes('152'));
    const book = page.locator('[data-book]').first();
    if(width===390){
      assert.equal(await page.locator('.reading-cover:visible').count(),3);
      assert.equal(new URL(await page.locator('.reading-cover').first().getAttribute('href'),base).pathname,'/conteudos/abdome-agudo/');
    }else{
    await book.scrollIntoViewIfNeeded();
    if (width === 390) await book.tap(); else await book.hover();
    await page.waitForFunction(() => document.querySelector('[data-book]').getAttribute('aria-pressed') === 'true');
    await page.waitForFunction(() => document.querySelector('[data-book] img.is-active')?.src.endsWith('book-abdome-open.webp'));
    assert.equal(await book.locator('img.is-active').getAttribute('src'), '/assets/academy/book-abdome-open.webp');
    await shot(page, `students-book-open-${width}`, book.locator('..'));
    await page.mouse.move(0, 0);
    await book.focus();
    await book.press('Escape');
    await book.press('Enter');
    await page.waitForFunction(() => document.querySelector('[data-book]').getAttribute('aria-pressed') === 'true');
    assert.equal(await book.getAttribute('aria-pressed'), 'true');
    }
    await page.locator('[data-studio-tab="sim"]').click();
    const before = page.qa.requests.length;
    // Current four-step preview: visible exam mode; scope, bank and difficulty require a choice.
    assert.equal(await page.locator('[data-sim-choice=mode][data-value=exam]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-sim-choice=scope][aria-pressed=true]').count(), 0);
    assert.equal(await page.locator('[data-sim-next]').isDisabled(), true);
    await page.locator('[data-sim-choice=mode][data-value=exam]').click();
    await page.locator('[data-sim-choice=scope][data-value=mixed]').click();
    await page.locator('[data-sim-next]').click();
    assert.equal(await page.locator('.sim-banks [aria-pressed=true]').count(), 0);
    await page.locator('[data-sim-bank="SUS-SP"]').click();
    await page.locator('[data-sim-next]').click();
    assert.equal(await page.locator('.sim-mix li').count(), 5);
    await page.locator('[data-sim-next]').click();
    assert.equal(await page.locator('[data-sim-difficulty][aria-pressed=true]').count(), 0);
    await page.locator('[data-sim-difficulty=facil]').click();
    await page.locator('[data-sim-quantity="20"]').click();
    assert.equal(await page.locator('.sim-demo__cta').isVisible(), true);
    assert.ok(!page.qa.requests.slice(before).some(url => /simulado|residencyQuestion|generate/.test(url)), 'preview called generator');
    const cta = await page.locator('.sim-demo__cta').getAttribute('href');
    assert.equal(new URL(cta).hostname, 'app.auscultoapp.com');
    assert.equal(new URL(cta).searchParams.has('returnTo'), false);
    await shot(page, `students-sim-${width}`, page.locator('#simulados-demo'));
    const preview = page.locator('[data-reading-open]');
    await preview.focus(); await preview.press('Enter');
    assert.equal(await page.locator('#reading-dialog').evaluate(el => el.open), true);
    await page.keyboard.press('Escape');
    assert.equal(await preview.evaluate(el => el === document.activeElement), true);
    await noOverflow(page);
    assert.deepEqual(page.qa.errors, []);
    await context.close();
  });

  await check('reader TOC, image zoom, Escape and focus return', async () => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
    const page = await open(context, '/conteudos/estudos-epidemiologicos/');
    await page.locator('.reader-toc a[href*="#section-017"]').click();
    await page.waitForFunction(() => document.querySelector('.reader-toc a[aria-current]')?.hash === '#section-017');
    const top = await page.locator('#section-017').evaluate(el => el.getBoundingClientRect().top);
    assert.ok(top >= 60 && top <= 130, String(top));
    const zoom = page.locator('[data-figure="epidemiologia-agregados"] .zoom-button');
    await zoom.focus(); await zoom.press('Enter');
    assert.equal(await page.locator('#material-zoom').evaluate(el => el.open), true);
    assert.ok((await page.locator('#zoom-image').getAttribute('src')).includes('epidemiologia-agregados'));
    await shot(page, 'epidemiology-zoom-watermark');
    await page.keyboard.press('Escape');
    assert.equal(await zoom.evaluate(el => el === document.activeElement), true);
    await context.close();
  });

  for (const dpr of [1, 2, 3]) for (const width of [390, 1440]) await check(`product marks DPR${dpr} ${width}`, async () => {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, deviceScaleFactor: dpr, reducedMotion: 'reduce' });
    const page = await open(context, '/');
    // The selector is resolved against the actual visible marketing surface.
    const logos = page.locator('img[src*="products/"]:visible');
    assert.ok(await logos.count() >= 3);
    await loadedImages(page, 'img[src*="products/"]');
    await shot(page, `home-products-${width}-dpr${dpr}`, page.locator(width === 390 ? '#m-meu-plantao' : '.tl-plantao'));
    await shot(page, `home-ausmind-${width}-dpr${dpr}`, page.locator(width === 390 ? '.ausmind-feature' : '.tcard--ausmind'));
    await noOverflow(page);
    await context.close();
  });

  await check('no-JS reading links, books, catalogue and app CTA', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, javaScriptEnabled: false });
    const page = await open(context, '/estudantes/');
    assert.equal(await page.locator('.catalogue-list li').count(), 152);
    assert.equal(await page.locator('[data-book]').count(), 3);
    assert.ok(await page.locator('a[href="/conteudos/abdome-agudo/"]').count());
    assert.equal(await page.locator('.sim-demo__cta').getAttribute('href'), 'https://app.auscultoapp.com/');
    await page.goto(base + '/conteudos/estudos-epidemiologicos/');
    assert.equal(await page.locator('.reader-section').count(), 39);
    assert.equal(await page.locator('.reader-figure').count(), 2);
    await noOverflow(page);
    await context.close();
  });

  for (const route of routes) await check(`200% text ${name(route)}`, async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 1000 }, reducedMotion: 'reduce' });
    const page = await open(context, route);
    // Snapshot first, then double all computed font sizes once (including fixed px).
    await page.evaluate(() => {
      const sizes = [...document.querySelectorAll('body *')].map(el => [el, parseFloat(getComputedStyle(el).fontSize)]);
      for (const [el, size] of sizes) el.style.setProperty('font-size', `${size * 2}px`, 'important');
    });
    const brandBounds = await page.locator('.atb__name').evaluateAll(elements => elements.map(el => ({top:el.getBoundingClientRect().top,bottom:el.getBoundingClientRect().bottom,barBottom:el.closest('.atb').getBoundingClientRect().bottom})));
    for(const rect of brandBounds) assert.ok(rect.top >= 0 && rect.bottom <= rect.barBottom + 1, `brand clipped: ${JSON.stringify(rect)}`);
    await noOverflow(page);
    await shot(page, `text200-${name(route)}`);
    await context.close();
  });
  for (const route of routes) await check(`200% zoom reflow equivalent ${name(route)}`, async () => {
    const context = await browser.newContext({ viewport: { width: 720, height: 500 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
    const page = await open(context, route);
    await noOverflow(page);
    await shot(page, `zoom200-reflow-${name(route)}`);
    await context.close();
  });
} finally {
  await browser.close();
  writeFileSync(resolve(evidence, 'report.json'), JSON.stringify(report, null, 2) + '\n');
}
console.log(`${report.checks.length} passed; ${report.issues.length} failed. Evidence: ${evidence}`);
if (report.issues.length) process.exitCode = 1;
