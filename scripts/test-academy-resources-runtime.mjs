import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const url=process.env.ACADEMY_QA_URL||'http://127.0.0.1:4196';
const out='.local-art/resources/qa';mkdirSync(out,{recursive:true});
async function dismissConsent(page){const button=page.locator('[data-consent-choice=denied]');if(await button.isVisible())await button.click();}
async function decodeVisible(page){await page.locator('.am-column:not([data-mosaic-copy]) img').evaluateAll(imgs=>Promise.all(imgs.filter(i=>{const r=i.getBoundingClientRect();return r.left<innerWidth&&r.right>0;}).map(i=>i.decode())));}
const browser=await chromium.launch({channel:'chrome',headless:true});const report=[];
async function ready(page){
 await page.goto(url+'/estudantes/?utm_source=mosaic-test#plataforma');
 await page.locator('[data-academy-mosaic].am-enhanced').waitFor({state:'attached'});await dismissConsent(page);
 await page.locator('#resources-title').scrollIntoViewIfNeeded();await page.mouse.move(0,0);
 await page.waitForFunction(()=>document.querySelector('[data-academy-mosaic]').dataset.motion==='running');
}
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},hasTouch:width===390,isMobile:width===390});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));await ready(page);
  const root=page.locator('[data-academy-mosaic]'),vp=page.locator('[data-mosaic-viewport]');
  assert.equal(await page.locator('.am-column:not([data-mosaic-copy]) [data-mosaic-card]').count(),24);
  assert.equal(await page.locator('.am-column:not([data-mosaic-copy]) [data-family=academy]').count(),22);
  assert.equal(await page.locator('.am-column:not([data-mosaic-copy])').count(),8);
  assert.equal(await page.locator('.am-column:not([data-mosaic-copy])').first().locator('[data-mosaic-card]').count(),3);
  assert.equal(await vp.evaluate(e=>getComputedStyle(e).scrollbarWidth),'none');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'No document horizontal overflow');
  const before=await vp.evaluate(e=>e.scrollLeft);await page.waitForTimeout(850);const after=await vp.evaluate(e=>e.scrollLeft);
  assert(after>before+4,'Autoplay advances in real time');
  const originalWidth=width;
  await page.setViewportSize({width:width===390?430:1280,height:1000});await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-mosaic-card]').first().evaluate(e=>Math.round(e.getBoundingClientRect().width)),width===390?220:304,'Card dimensions survive resize');
  await page.setViewportSize({width:originalWidth,height:1000});await page.waitForTimeout(250);
  assert.equal(await page.locator('[data-mosaic-toggle]').count(),0,'No pause control');
  // Position an unflipped sample just to the right of centre, then let real autoplay cross.
  await vp.evaluate(e=>{const card=document.querySelector('.am-column:not([data-mosaic-copy]) [data-mosaic-card="flash-semiologia"]');const r=card.getBoundingClientRect(),v=e.getBoundingClientRect();e.scrollLeft+=r.left+r.width/2-(v.left+v.width/2)-25;});
  const flash=page.locator('.am-column:not([data-mosaic-copy]) [data-mosaic-card="flash-semiologia"]');
  assert.equal(await flash.evaluate(e=>e.classList.contains('is-flipped')),false,'Flashcard enters on its question side');
  await page.waitForFunction(()=>document.querySelector('.am-column:not([data-mosaic-copy]) [data-mosaic-card="flash-semiologia"]').classList.contains('is-flipped'),{timeout:6000});
  await flash.locator('a').click();assert.equal(await page.locator('#resource-flash-dialog').evaluate(e=>e.open),true);
  assert.equal(await page.locator('#resource-flash-answer').isVisible(),false);
  await page.locator('[data-flash-reveal]').click();assert.equal(await page.locator('#resource-flash-answer').isVisible(),true);
  assert.match(await page.locator('[data-flash-answer]').innerText(),/Gerber/);
  assert.match(await page.locator('.am-dialog-footer a').getAttribute('href'),/utm_source=mosaic-test/);
  const inDialog=await vp.evaluate(e=>e.scrollLeft);await page.waitForTimeout(300);assert.equal(await vp.evaluate(e=>e.scrollLeft),inDialog);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#resource-flash-dialog').evaluate(e=>e.open),false);
  assert.equal(await flash.locator('a').evaluate(e=>document.activeElement===e),true,'Focus returns to opener');
  await page.evaluate(()=>document.activeElement.blur());await page.mouse.move(0,0);await page.waitForTimeout(2000);
  // Native touch/wheel scrolling does not mutate card content or leave an immortal pause.
  await vp.dispatchEvent('pointerdown',{pointerType:'touch'});assert.equal(await root.getAttribute('data-motion'),'paused');
  await page.evaluate(()=>window.dispatchEvent(new PointerEvent('pointerup',{pointerType:'touch'})));
  await page.waitForFunction(()=>document.querySelector('[data-academy-mosaic]').dataset.motion==='running');
  // Infinite wrap: last and first columns keep the same cadence.
  await vp.evaluate(e=>{const cols=e.querySelectorAll('.am-column');e.scrollLeft=cols[8].offsetLeft-cols[0].offsetLeft-3;});
  await page.waitForFunction(()=>document.querySelector('[data-mosaic-viewport]').scrollLeft<100,{timeout:6000});
  await page.locator('.academy-footer').scrollIntoViewIfNeeded();await page.waitForTimeout(150);assert.equal(await root.getAttribute('data-motion'),'paused','Offscreen motion stops');
  await page.locator('#resources-title').scrollIntoViewIfNeeded();await page.mouse.move(0,0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>getComputedStyle(document.querySelector('[data-mosaic-copy]')).display==='none');
  assert.equal(await page.locator('[data-mosaic-toggle]').count(),0);
  assert.equal(await page.locator('[data-mosaic-copy]:visible').count(),0,'Reduced motion removes duplicates');
  assert.equal(await page.locator('.am-flip').first().evaluate(e=>getComputedStyle(e).transform),'none');
  await vp.evaluate(e=>e.scrollLeft=450);assert((await vp.evaluate(e=>e.scrollLeft))>0,'Reduced gallery remains manually scrollable');
  await page.emulateMedia({reducedMotion:'no-preference'});await page.mouse.move(0,0);await page.waitForTimeout(200);
  if(width===1440){
   await vp.evaluate(e=>e.scrollLeft=0);
   const action=page.locator('.am-column:not([data-mosaic-copy]) .am-action').first();
   await action.hover();const hoverStart=await vp.evaluate(e=>e.scrollLeft);await page.waitForTimeout(850);
   assert((await vp.evaluate(e=>e.scrollLeft))>hoverStart+4,'Hover leaves continuous motion running');
   assert.equal(await page.locator('.am-tooltip').count(),0,'No floating tooltip bubble');
   assert.equal(await page.locator('.am-context').count(),0,'No text-on-text overlay on any card');
   await vp.dispatchEvent('wheel',{deltaY:120,deltaX:0});
   await vp.dispatchEvent('pointerdown',{pointerType:'mouse'});await vp.focus();
   const mouseStart=await vp.evaluate(e=>e.scrollLeft);await page.waitForTimeout(500);
   assert((await vp.evaluate(e=>e.scrollLeft))>mouseStart+2,'Vertical wheel and mouse focus do not pause');
   await page.evaluate(()=>document.activeElement.blur());
  }
  assert.deepEqual(errors,[],'No JS runtime errors');report.push({width,autoplay:true,noPauseControl:true,centerFlip:true,dialog:true,focus:true,wrap:true,reducedMotion:true,offscreen:true});await page.close();
 }
 // Visual and image-loading coverage at physical pixel densities 1, 2 and 3.
 for(const width of [390,1440])for(const deviceScaleFactor of [1,2,3]){
  const page=await browser.newPage({viewport:{width,height:width===390?844:1080},deviceScaleFactor,reducedMotion:'reduce'});
  await page.goto(url+'/estudantes/#plataforma');await page.locator('.am-enhanced').waitFor({state:'attached'});await dismissConsent(page);await page.locator('#resources-title').scrollIntoViewIfNeeded();
  await page.evaluate(()=>document.fonts.ready);await page.locator('.am-column:not([data-mosaic-copy]) img').evaluateAll(imgs=>Promise.all(imgs.filter(i=>i.getBoundingClientRect().left<innerWidth).map(i=>i.decode())));
  await page.screenshot({path:`${out}/mosaic-${width}-dpr${deviceScaleFactor}.png`});
  await page.locator('[data-mosaic-viewport]').evaluate(e=>e.scrollLeft=1400);await decodeVisible(page);await page.screenshot({path:`${out}/mosaic-later-${width}-dpr${deviceScaleFactor}.png`});
  report.push({width,deviceScaleFactor,screenshot:true});await page.close();
 }
 const nojs=await browser.newPage({javaScriptEnabled:false,viewport:{width:390,height:844}});await nojs.goto(url+'/estudantes/#plataforma');
 assert.equal(await nojs.locator('[data-mosaic-card]').count(),24);assert.equal(await nojs.locator('[data-flash-fallback]').count(),3);
 await nojs.locator('[data-flash-fallback] summary').first().press('Enter');assert.match(await nojs.locator('[data-flash-fallback] details[open]').innerText(),/Carcinoma/);await nojs.close();
 report.push({noJavaScript:true});console.log(JSON.stringify(report,null,2));
}finally{await browser.close();writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');}
