import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto((process.env.SITE_QA_URL||'http://127.0.0.1:4268')+'/estudantes/');
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='idle');
  // A real media error can happen after play() resolves, before presentation.
  // Suppress that frame and deliver error at precisely that boundary.
  await page.evaluate(()=>{
    const look=document.querySelector('.dossier-mascot video[data-role=look]');
    look.requestVideoFrameCallback=()=>{
      window.mascotFaultInjected=true;
      queueMicrotask(()=>look.dispatchEvent(new Event('error')));
      return 0;
    };
  });
  await page.locator('[data-dossier-tab="usp-sp"]').click();
  await page.waitForFunction(()=>window.mascotFaultInjected&&!document.querySelector('[data-dossier-book]').hasAttribute('aria-busy'));
  assert.equal(await page.locator('[data-dossier-mascot]').getAttribute('data-state'),'idle');
  await page.locator('[data-dossier-tab="sus-sp"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='surprise',null,{timeout:3000});
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='idle');
  console.log('PASS: incoming decoder failure preserves idle and the next surprise still plays');
  await page.close();
  const remount=await browser.newPage({viewport:{width:1440,height:1000}});
  await remount.route('**/mascot/manifest.json',async route=>{
    await new Promise(resolve=>setTimeout(resolve,350));
    await route.continue().catch(()=>{});
  });
  const requested=remount.waitForRequest('**/mascot/manifest.json');
  await remount.goto((process.env.SITE_QA_URL||'http://127.0.0.1:4268')+'/estudantes/',{waitUntil:'domcontentloaded'});
  await requested;
  await remount.setViewportSize({width:390,height:844});
  await remount.setViewportSize({width:1440,height:1000});
  await remount.waitForFunction(()=>document.querySelector('[data-dossier-mascot]')?.dataset.state==='idle',null,{timeout:10000});
  assert.equal(await remount.locator('.dossier-mascot video').count(),3);
  console.log('PASS: aborted metadata fetch across a fast breakpoint remount recovers');
  await remount.close();
} finally {await browser.close();}
