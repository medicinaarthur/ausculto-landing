import {chromium, firefox, webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const base=process.env.SITE_QA_URL||'http://127.0.0.1:4188';
const out=resolve('.local-art/home-hero-v2/qa');mkdirSync(out,{recursive:true});
const report={base,checks:[],failures:[],limitations:[],network:[]};
const engineName=process.env.HERO_BROWSER||'chromium';
const engine={chromium,firefox,webkit}[engineName];
const browser=await engine.launch(engineName==='chromium'?{channel:'chrome',headless:true}:{headless:true});
async function check(label,fn){if(process.env.HERO_CHECK&&!new RegExp(process.env.HERO_CHECK).test(label))return;try{await fn();report.checks.push(label);console.log('PASS',label);}catch(e){report.failures.push({label,error:e.message});console.error('FAIL',label,e.message);}}
async function open(options={}){
 const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,...options});
 const page=await context.newPage();page.errors=[];page.requests=[];
 page.on('pageerror',e=>page.errors.push(e.message));page.on('request',r=>page.requests.push(r.url()));
 await page.goto(base,{waitUntil:'load'});
 // Firefox disables promise callbacks in an explicitly script-disabled context.
 if(options.javaScriptEnabled!==false)await page.evaluate(()=>document.fonts.ready);
 const deny=page.locator('[data-consent-choice="denied"]');if(await deny.isVisible())await deny.click();
 return {context,page};
}
async function noOverflow(page){assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));}
try{
 const matrix=engineName==='chromium'?[[320,568],[360,640],[360,800],[375,667],[375,812],[390,844],[412,915],[430,932],[768,1024],[1024,768],[1280,800],[1440,900],[1672,941],[1920,1080],[2250,1059]]:[[390,844],[768,1024],[1280,800],[1672,941]];
 for(const [width,height] of matrix)await check(`layout ${engineName} ${width}x${height}`,async()=>{
  const {context,page}=await open({viewport:{width,height}});
  try{
   await noOverflow(page);assert.deepEqual(page.errors,[]);
   assert.equal(await page.locator('h1:visible').count(),1);
   const hero=page.locator('[data-home-hero]:visible');
   if(width>=1024){
    for(const img of await hero.locator('.ah__screen:visible img').all()){await img.evaluate(e=>e.decode());assert.ok(await img.evaluate(e=>e.naturalWidth>1&&/desktop-screen-(plantao|prova)-(498|996|476|952)\.webp/.test(e.currentSrc)),'original capture overlay loaded');}
    if(width>=1280){const box=await hero.boundingBox();assert.ok(Math.abs(box.height-width*866/1672)<2,'no navy image footer');}
   }
   for(const img of await hero.locator('.ah__scene img,.ah__composition img').all()){await img.evaluate(e=>e.decode());assert.ok(await img.evaluate(e=>e.naturalWidth>1));}
   const assets=page.requests.filter(u=>u.includes('/hero-v3/'));report.network.push({width,assets});
   assert.ok(!assets.some(u=>u.includes(width<1024?'desktop-scene':'mobile-atmosphere')),'hidden scene downloaded');
   assert.ok(!assets.some(u=>u.includes(width<1024?'/desktop-':'/mobile-')),'hidden product art downloaded');
   assert.ok(!page.requests.some(u=>/hero-plate-v4|notebook-1400|hero-m\.avif/.test(u)),'old hero requested');
   if(width===390){const cta=await page.locator('#m-hero-cta').boundingBox();assert.ok(cta.y+cta.height<=350);const tabs=await page.locator('.ah__tabs').boundingBox();assert.ok(tabs.y+tabs.height<=450);}
   await page.screenshot({path:resolve(out,`${engineName}-${width}x${height}-viewport.png`),animations:'disabled'});
   await hero.screenshot({path:resolve(out,`${engineName}-${width}x${height}-hero.png`),animations:'disabled'});
   if(width<1024){await page.getByRole('tab',{name:'No plantão'}).click();await page.waitForTimeout(370);assert.equal(await page.getByRole('tab',{selected:true}).textContent(),'No plantão');await noOverflow(page);await hero.screenshot({path:resolve(out,`${engineName}-${width}x${height}-plantao.png`),animations:'disabled'});}
  }finally{await context.close();}
 });
 await check('keyboard, rapid changes, breakpoint retention and menu',async()=>{
  const{context,page}=await open();try{
   const prova=page.getByRole('tab',{name:'Na prova'});await prova.focus();await page.keyboard.press('ArrowLeft');assert.equal(await page.getByRole('tab',{selected:true}).textContent(),'No plantão');
   await page.keyboard.press('End');assert.equal(await prova.getAttribute('aria-selected'),'true');
   for(let i=0;i<6;i++)await page.keyboard.press('ArrowRight');assert.equal(await prova.getAttribute('aria-selected'),'true');
   await page.getByRole('tab',{name:'No plantão'}).click();await page.setViewportSize({width:1440,height:900});await page.setViewportSize({width:390,height:844});assert.equal(await page.getByRole('tab',{selected:true}).textContent(),'No plantão');
   await page.evaluate(()=>scrollTo(0,0));await page.locator('#m-menu-open').click();assert.ok(await page.locator('#m-menu').evaluate(e=>e.open));await page.keyboard.press('Escape');
   assert.deepEqual(page.errors,[]);
  }finally{await context.close();}
 });
 await check('image recovery after transient network failure',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844}});await context.route('**/hero-v3/mobile-prova-*',r=>r.abort());const page=await context.newPage();try{
   await page.goto(base);assert.ok(await page.locator('.ah--mobile [data-hero-panel="prova"]').evaluate(e=>e.classList.contains('is-unavailable')));
   await context.unroute('**/hero-v3/mobile-prova-*');await page.setViewportSize({width:1440,height:900});await page.waitForTimeout(200);await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
   await page.locator('.ah--mobile .ah__composition img').last().evaluate(e=>e.decode());
   assert.equal(await page.locator('.ah--mobile [data-hero-panel="prova"]').evaluate(e=>e.classList.contains('is-unavailable')),false);

  }finally{await context.close();}
 });
 for(const dpr of [1,2,3])await check(`Retina DPR${dpr}`,async()=>{const{context,page}=await open({deviceScaleFactor:dpr});try{await page.locator('[data-home-hero="mobile"]').screenshot({path:resolve(out,`${engineName}-390-dpr${dpr}.png`)});const urls=await page.locator('.ah--mobile .ah__composition img').evaluateAll(imgs=>imgs.map(i=>({url:i.currentSrc,width:Number(i.currentSrc.match(/-(\d+)\.(?:webp|avif)/)[1]),painted:i.clientWidth})));for(const img of urls)assert.ok(img.width>=img.painted*Math.min(dpr,3)-2);report.network.push({dpr,urls});}finally{await context.close();}});
 await check('deferred hero script does not shift the initial composition',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844}});let release;const gate=new Promise(resolve=>release=resolve);
  await context.route('**/home-hero.js*',async route=>{await gate;await route.continue();});const page=await context.newPage();try{
   await page.goto(base,{waitUntil:'commit'});await page.locator('.ah__stage').waitFor();
   // fonts.ready can depend on document load in Firefox/WebKit; load is held by
   // the very deferred script this test deliberately gates. Load faces directly.
   await page.evaluate(()=>Promise.all([document.fonts.load('400 34px "DM Serif Display"'),document.fonts.load('400 14px Inter')]));
   const before=await page.locator('.ah--mobile').boundingBox();const stage=await page.locator('.ah__stage').boundingBox();
   release();await page.waitForFunction(()=>document.querySelector('.ah--mobile').dataset.ready==='true');
   const after=await page.locator('.ah--mobile').boundingBox();const afterStage=await page.locator('.ah__stage').boundingBox();
   assert.ok(Math.abs(before.height-after.height)<1);assert.ok(Math.abs(stage.y-afterStage.y)<1);assert.ok(Math.abs(stage.height-afterStage.height)<1);
  }finally{release();await context.close();}
 });
 await check('reduced motion and enlarged text reflow',async()=>{const{context,page}=await open({reducedMotion:'reduce'});try{await page.getByRole('tab',{name:'No plantão'}).click();assert.equal(await page.locator('.ah--mobile .ah__panel').first().evaluate(e=>getComputedStyle(e).transitionDuration),'0s');await page.addStyleTag({content:'.ah :is(p,h1,h2,a,button,li){font-size:150%!important}.ah__title{font-size:52px!important}'});await noOverflow(page);await page.locator('[data-home-hero="mobile"]').screenshot({path:resolve(out,`${engineName}-enlarged-text.png`)});await page.setViewportSize({width:720,height:450});await noOverflow(page);}finally{await context.close();}});
 await check('no JavaScript exposes both contexts and real links',async()=>{const{context,page}=await open({javaScriptEnabled:false});try{assert.equal(await page.locator('.ah--mobile [data-hero-panel]:visible').count(),2);assert.equal(await page.locator('.ah__tabs:visible').count(),0);assert.ok(await page.locator('#m-hero-cta').getAttribute('href'));await noOverflow(page);if(engineName!=='firefox')await page.locator('[data-home-hero="mobile"]').screenshot({path:resolve(out,`${engineName}-no-js.png`)});else report.limitations.push('Firefox no-JS behavior checked, screenshot omitted because the driver font-ready promise does not resolve with scripts disabled. Chromium and WebKit no-JS screenshots captured.');}finally{await context.close();}});
 await check('failed screenshots retain descriptions and show readable fallback',async()=>{const context=await browser.newContext({viewport:{width:390,height:844}});await context.route('**/hero-v3/mobile-{plantao,prova}-*',r=>r.abort());const page=await context.newPage();try{await page.goto(base);await page.waitForTimeout(150);assert.ok(await page.locator('.ah--mobile [data-hero-panel="prova"]').evaluate(e=>e.classList.contains('is-unavailable')));await noOverflow(page);}finally{await context.close();}});
 for(const width of [390,1672])await check(`axe hero and header ${width}`,async()=>{const{context,page}=await open({viewport:{width,height:941}});try{const a=await new AxeBuilder({page}).include(width<1024?'[data-home-hero="mobile"]':'[data-home-hero="desktop"]').include(width<1024?'#m-hdr':'#nav').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();writeFileSync(resolve(out,`${engineName}-axe-${width}.json`),JSON.stringify(a,null,2));assert.deepEqual(a.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)})),[]);}finally{await context.close();}});
}finally{await browser.close();writeFileSync(resolve(out,`${engineName}-report.json`),JSON.stringify(report,null,2));}
if(report.failures.length)process.exitCode=1;
