import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const out=resolve('.local-art/academy-refinement/qa');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
const results=[];
try{
 for(const width of [320,360,390,430,768,1024,1448,1920]){
  const context=await browser.newContext({viewport:{width,height:width<768?844:1086},reducedMotion:'reduce'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4197/estudantes/',{waitUntil:'load'});await page.evaluate(()=>document.fonts.ready);
  const reject=page.getByRole('button',{name:'Recusar',exact:true});if(await reject.isVisible())await reject.click();
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`overflow ${width}`);
  await page.locator('[data-dossier]').screenshot({path:resolve(out,`hero-${width}.png`)});
  const graphic=await page.locator('#dossier-enamed .dossier-chart').boundingBox();
  const paper=await page.locator('#dossier-enamed .dossier-spread').boundingBox();
  const last=await page.locator('#dossier-enamed .dossier-chart li').last().boundingBox();
  if(width<768){assert.ok(paper.height<610,`paper too tall: ${paper.height}`);assert.ok(last.y+last.height<paper.y+paper.height*.658,`chart crosses printed rule ${width}`);}
  if(width>=1200){
   const tabs=await page.locator('.dossier-tabs').boundingBox(),phrase=await page.locator('.dossier-handwritten').boundingBox();
   assert.ok(tabs.x>=paper.x+paper.width-8,'rail must sit beside paper');
   assert.ok(phrase.y+phrase.height<tabs.y||phrase.x+phrase.width<tabs.x,'rail covers handwritten note');
  }
  assert.equal(await page.locator('.dossier-tab img').count(),5);
  for(const id of ['usp-sp','sus-sp','einstein','unifesp']){
   await page.locator(`[data-dossier-tab="${id}"]`).click();
   await page.waitForFunction(id=>document.querySelector('[data-dossier]').dataset.bank===id&&!document.querySelector('[data-dossier-book]').hasAttribute('aria-busy'),id);
   if(width===390||width===1448)await page.locator('[data-dossier]').screenshot({path:resolve(out,`${id}-${width}.png`)});
  }
  if(width===390||width===1448){
   for(const [name,selector] of [['shelf','[data-bookshelf]'],['ecg','.ecg-course'],['pro','.pro'],['footer','.academy-footer'],['resources','.resource-grid']]){
    await page.locator(selector).scrollIntoViewIfNeeded();await page.locator(selector).screenshot({path:resolve(out,`${name}-${width}.png`)});
   }
  }
  if(width<=600){
   assert.equal(await page.locator('.library-copy:visible').count(),3);
   assert.equal(await page.locator('.reading-cover:visible').count(),3);
   assert.equal(await page.locator('.library-copy>p:visible').count(),0);
   const covers=await page.locator('.reading-cover img').evaluateAll(imgs=>imgs.map(el=>({height:el.getBoundingClientRect().height,center:el.getBoundingClientRect().x+el.getBoundingClientRect().width/2})));
   assert.ok(Math.max(...covers.map(x=>x.height))-Math.min(...covers.map(x=>x.height))<1,'cover heights differ');
   assert.ok(Math.max(...covers.map(x=>x.center))-Math.min(...covers.map(x=>x.center))<1,'cover axes differ');
   const ecg=await page.locator('.ecg-course').boundingBox();assert.ok(ecg.height<430,`ECG too tall ${ecg.height}`);
   const footer=await page.locator('.academy-footer').boundingBox();assert.ok(footer.height<455,`footer too tall ${footer.height}`);
   const menu=page.locator('.atb__menu summary');await menu.click();await page.waitForFunction(()=>document.querySelector('.atb__menu').open&&document.querySelector('main').inert);
   assert.equal(await page.locator('main').getAttribute('inert'),'');
   assert.equal(await page.locator('.atb__sheet').isVisible(),true);
   if(width===390)await page.screenshot({path:resolve(out,'menu-390.png')});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('.atb__menu').open&&!document.querySelector('main').inert);assert.equal(await page.locator('.atb__menu').getAttribute('open'),null);
   assert.equal(await page.locator('main').getAttribute('inert'),null);
  }
  assert.deepEqual(errors,[]);results.push({width,pass:true,paperHeight:paper.height,chartHeight:graphic.height});
  await context.close();console.log('PASS refinement',width);
 }
}finally{await browser.close();writeFileSync(resolve(out,'report.json'),JSON.stringify(results,null,2));}
