import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
// Offscreen rendering must not change navigation, catalogue access or focus.
const engine=process.env.EXPERIENCE_BROWSER||'chromium';
const browser=await({chromium,firefox,webkit}[engine]).launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
try{
 for(const width of [390,1448]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  for(const [hash,selector] of [['material','.academy-library'],['plataforma','.academy-toolbox'],['enamed-comentado','.closing-pdf']]){
   await page.goto(`http://127.0.0.1:4197/estudantes/#${hash}`);await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(selector=>{const r=document.querySelector(selector).getBoundingClientRect();return r.top<innerHeight&&r.bottom>0;},selector);
   assert.equal(await page.locator(selector).isVisible(),true);
  }
  await page.goto('http://127.0.0.1:4197/estudantes/#acervo');
  const deny=page.locator('[data-consent-choice=denied]');if(await deny.isVisible())await deny.click();
  await page.locator('#catalogue-search').fill('epidemiolog');
  assert.ok(await page.locator('#catalogue-list li:visible').count()>0);
  await page.locator('[data-catalogue-reset]').click();
  const count=await page.locator('#catalogue-list li:visible').count();
  await page.locator('#catalogue-more').click();assert.ok(await page.locator('#catalogue-list li:visible').count()>count);
  assert.ok(await page.evaluate(()=>document.activeElement.closest('#catalogue-list')));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  await page.close();console.log('PASS offscreen anchors, search, pagination and focus',engine,width);
 }
}finally{await browser.close();}
