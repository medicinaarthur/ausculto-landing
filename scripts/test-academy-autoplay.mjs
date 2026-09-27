import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
const engine=process.env.EXPERIENCE_BROWSER||'chromium';
const browser=await({chromium,firefox,webkit}[engine]).launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
try{
 for(const width of [390,1448]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'no-preference'});
  await page.clock.install();await page.goto('http://127.0.0.1:4197/estudantes/');
  const deny=page.locator('[data-consent-choice=denied]');if(await deny.isVisible())await deny.click();
  await page.mouse.move(0,0);await page.locator('[data-dossier-book]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);await page.clock.fastForward(12500);
  await page.waitForFunction(()=>document.querySelector('[data-dossier]').dataset.bank==='usp-sp'&&!document.querySelector('[data-dossier-book]').hasAttribute('aria-busy'));
  const root=page.locator('[data-dossier]');
  await page.locator('[data-dossier-tab=unifesp]').click();
  await page.waitForFunction(()=>document.querySelector('[data-dossier]').dataset.bank==='unifesp'&&!document.querySelector('[data-dossier-book]').hasAttribute('aria-busy'));
  assert.equal(await root.getAttribute('data-autoplay'),'enabled');assert.equal(await page.locator('[data-dossier-autoplay]').count(),0);
  await page.locator('[data-dossier-book]').scrollIntoViewIfNeeded();await page.waitForTimeout(100);await page.clock.fastForward(12500);
  await page.waitForFunction(()=>document.querySelector('[data-dossier]').dataset.bank==='enamed'&&!document.querySelector('[data-dossier-book]').hasAttribute('aria-busy'));
  await page.locator('.academy-footer').scrollIntoViewIfNeeded();await page.waitForTimeout(100);await page.clock.fastForward(30000);assert.equal(await root.getAttribute('data-bank'),'enamed');
  await page.emulateMedia({reducedMotion:'reduce'});await page.locator('[data-dossier-book]').scrollIntoViewIfNeeded();await page.waitForTimeout(100);await page.clock.fastForward(12500);await page.waitForFunction(()=>document.querySelector('[data-dossier]').dataset.bank==='usp-sp');
  await page.locator('[data-pro-sequence]').scrollIntoViewIfNeeded();await page.evaluate(()=>Promise.all([...document.querySelectorAll('.pro-pose img')].map(img=>img.decode())));await page.waitForTimeout(200);
  const portrait=page.locator('[data-pro-sequence]');const frame=await portrait.getAttribute('data-frame');await page.clock.fastForward(4400);await page.waitForFunction(frame=>document.querySelector('[data-pro-sequence]').dataset.frame!==frame,frame);
  assert.equal(await portrait.locator('.is-current').count(),1);
  console.log('PASS automatic bank rotation, manual selection, wrap, offscreen, reduced motion and PRO sequence',engine,width);await page.close();
 }
}finally{await browser.close();}
