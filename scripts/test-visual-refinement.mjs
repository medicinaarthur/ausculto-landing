import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const base=process.env.SITE_QA_URL||'http://127.0.0.1:4195';
const folder=process.env.VISUAL_EVIDENCE||'.local-art/visual-refinement-20260927/context';
mkdirSync(folder,{recursive:true});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const results=[];
try {
 for(const width of [390,768,1100,1440,1920]){
  const ctx=await browser.newContext({viewport:{width,height:1100},reducedMotion:'reduce'});
  const page=await ctx.newPage();
  async function open(route){await page.goto(base+route);await page.evaluate(()=>document.fonts.ready);const deny=page.locator('[data-consent-choice="denied"]');if(await deny.isVisible())await deny.click();}
  async function shot(name,selector){const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();for(const img of await el.locator('img').all())await img.evaluate(i=>i.decode().catch(()=>{}));await el.screenshot({path:`${folder}/${name}-${width}.png`,animations:'disabled'});}
  await open('/');
  if(width>=1100){
   await shot('tools','#ferramentas');
   const card=page.locator('.tcard--ausmind');
   const boxes=await card.evaluate(el=>Object.fromEntries(['.tcard__ic','.tcard__title','.tcard__chip'].map(s=>{const r=el.querySelector(s).getBoundingClientRect();return [s,{x:r.x,y:r.y,right:r.right,bottom:r.bottom}];})));
   assert.ok(boxes['.tcard__ic'].right<=boxes['.tcard__title'].x+1,'logo must remain left of title');
   assert.ok(boxes['.tcard__chip'].y>boxes['.tcard__title'].bottom,'feature chip below title');
   results.push({width,logoPlacement:boxes});
  }else if(width===390){await shot('flow','#m-meu-plantao');await shot('mind','.ausmind-feature');}
  await open('/estudantes/');
  assert.equal(await page.locator('[data-sim-choice=mode][data-value=exam]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-sim-next]').isDisabled(),true,'scope must be explicit');
  await shot('about','.about-proof');await shot('ecg','#curso-ecg');
  await page.locator('.library-features').scrollIntoViewIfNeeded();
  await page.screenshot({path:`${folder}/book-context-${width}.png`,fullPage:false,animations:'disabled'});
  await page.locator('[data-sim-choice=scope][data-value=focused]').click();await page.locator('[data-sim-next]').click();
  await page.locator('[data-sim-bank=ENAMED]').click();await page.locator('[data-sim-next]').click();
  await page.locator('[data-sim-select=areas]').click();
  assert.equal(await page.locator('#sim-selector').evaluate(el=>el.tagName),'SECTION');
  assert.equal(await page.locator('dialog:modal').count(),0);
  await page.locator('#sim-selector input[type=checkbox]').first().check();
  await page.locator('#sim-selector input[type=search]').press('Escape');
  assert.equal(await page.locator('[data-sim-select=specialties]').isDisabled(),true,'cancel must discard draft');
  assert.equal(await page.locator('[data-sim-select=areas]').evaluate(el=>el===document.activeElement),true);
  await page.locator('[data-sim-select=areas]').click();await page.locator('#sim-selector input[type=checkbox]').first().check();await page.locator('[data-sim-apply]').click();
  await page.locator('[data-sim-select=specialties]').click();
  await page.locator('#sim-selector input[type=checkbox]').first().check();
  await shot('inline-selector','.about-proof');
  const sizes=await page.locator('.about-proof>article').evaluateAll(els=>els.map(el=>el.getBoundingClientRect().height));
  if(width===1440)assert.ok(sizes.every(h=>h<=760),'expanded selector heights '+sizes);
  await page.locator('[data-sim-apply]').click();
  assert.equal(await page.locator('[data-sim-select=themes]').isDisabled(),false);
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  results.push({width,inlineSelector:true,heights:sizes});await ctx.close();
 }
 console.log(JSON.stringify(results,null,2));
}finally{writeFileSync(`${folder}/report.json`,JSON.stringify({base,results},null,2));await browser.close();}
