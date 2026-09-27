import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const out='.local-art/resources/qa/faces';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4196/estudantes/#plataforma');
  await page.locator('.am-enhanced').waitFor({state:'attached'});
  const consent=page.locator('[data-consent-choice=denied]');if(await consent.isVisible())await consent.click();
  await page.evaluate(()=>document.fonts.ready);
  for(const id of ['trilha-clinica','trilha-caio','questao','questao-comentario','simulado-revisao','casos-arte']){
   const card=page.locator(`.am-column:not([data-mosaic-copy]) [data-mosaic-card="${id}"]`);
   await card.scrollIntoViewIfNeeded();await card.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await card.screenshot({path:`${out}/${id}-${width}-front.png`});
   if(await card.locator('.am-exam-front').count())assert.equal(await card.locator('.am-exam-front').evaluate(e=>{const label=e.closest('article').querySelector('.am-card-label').getBoundingClientRect();return [...e.children].every(c=>c.getBoundingClientRect().bottom<=label.top+1)}),true,`${id} front must not overlap footer at ${width}`);
   const turn=card.locator('[data-card-turn]');
   if(await turn.count()){
    await turn.click();assert.equal(await turn.getAttribute('aria-pressed'),'true');
    await card.screenshot({path:`${out}/${id}-${width}-back.png`});
    const dimensions=await card.locator('.am-back').evaluate(e=>({height:e.clientHeight,scroll:e.scrollHeight}));
    assert(dimensions.scroll<=dimensions.height+1,`${id} answer must fit at ${width}`);
    assert.equal(await card.locator('.am-back').evaluate(e=>{const label=e.closest('article').querySelector('.am-card-label').getBoundingClientRect();return [...e.children].every(c=>c.getBoundingClientRect().bottom<=label.top+1)}),true,`${id} content must not overlap footer at ${width}`);
    await turn.click();assert.equal(await turn.getAttribute('aria-pressed'),'false');
   }
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 console.log('Front/back previews fit at 390/1440; four manual flips, reduced motion and no footer overlap passed.');
}finally{await browser.close();}
