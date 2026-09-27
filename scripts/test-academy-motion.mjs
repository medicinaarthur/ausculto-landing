import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,renameSync} from 'node:fs';
import {resolve} from 'node:path';
const out=resolve('.local-art/academy-refinement/motion');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true}),report=[];
try{
 for(const width of [390,1448]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:1086},recordVideo:{dir:out,size:{width,height:width===390?844:1086}}});
  const page=await context.newPage();await page.goto('http://127.0.0.1:4197/estudantes/');await page.evaluate(()=>document.fonts.ready);
  const reject=page.getByRole('button',{name:'Recusar',exact:true});if(await reject.isVisible())await reject.click();
  await page.locator('[data-dossier-book]').scrollIntoViewIfNeeded();
  await page.locator('[data-dossier-tab=usp-sp]').click();
  await page.waitForSelector('.dossier-turn');
  await page.evaluate(()=>document.querySelectorAll('.dossier-turn *').forEach(e=>e.getAnimations().forEach(a=>{a.pause();a.currentTime=Number(a.effect.getTiming().duration)*.48;})));
  assert.equal(await page.locator('.dossier-turn').getAttribute('aria-hidden'),'true');
  if(width===390)assert.equal(await page.locator('.dossier-gliding-sheet>.dossier-panel').evaluate(el=>getComputedStyle(el).contentVisibility),'visible','decorative sheet must remain painted while excluded from accessibility');
  await page.screenshot({path:resolve(out,`turn-${width}.png`)});
  await page.evaluate(()=>document.querySelectorAll('.dossier-turn *').forEach(e=>e.getAnimations().forEach(a=>a.play())));
  await page.waitForFunction(()=>!document.querySelector('[data-dossier-book]').hasAttribute('aria-busy'));
  await page.locator('[data-dossier-tab=einstein]').click();
  await page.waitForFunction(()=>!document.querySelector('[data-dossier-book]').hasAttribute('aria-busy'));
  if(width===390){
   const rail=page.locator('.resource-grid');await rail.scrollIntoViewIfNeeded();await page.mouse.move(0,0);
   await page.waitForFunction(()=>document.querySelector('.resource-grid').scrollLeft>50,{timeout:13000});
   await page.getByRole('button',{name:'Pausar apresentação',exact:true}).click();
   assert.equal(await page.getByRole('button',{name:'Retomar apresentação',exact:true}).getAttribute('aria-pressed'),'true');
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('.resource-playback').hidden);assert.equal(await page.locator('.resource-playback').isVisible(),false);
  }
  const video=page.video();await context.close();renameSync(await video.path(),resolve(out,`academy-${width}.webm`));report.push({width,turn:true,autoplay:width===390?'passed':'not applicable'});
 }
}finally{await browser.close();writeFileSync(resolve(out,'report.json'),JSON.stringify(report,null,2));}
console.log(report);
