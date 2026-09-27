import {chromium,firefox,webkit} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
const engine=process.env.EXPERIENCE_BROWSER||'chromium';
const out='.local-art/academy-refinement/experience';mkdirSync(out,{recursive:true});
const browser=await({chromium,firefox,webkit}[engine]).launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
const results=[];
try{
 for(const width of [390,1448]){
  const context=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4197/estudantes/');await page.evaluate(()=>document.fonts.ready);
  const reject=page.getByRole('button',{name:'Recusar',exact:true});if(await reject.isVisible())await reject.click();
  const studio=page.locator('[data-practice-studio]');
  assert.equal(await page.locator('.moment-paths .path-figure--doctor').isVisible(),true);
  assert.equal(await page.locator('.moment-paths .path-figure--notebook').isVisible(),true);
  assert.equal(await page.locator('.studio-demo .q-demo__alt:visible').count(),4);
  assert.equal(await page.locator('.studio-demo .q-demo').evaluate(el=>getComputedStyle(el).backgroundColor),'rgb(255, 255, 255)');
  if(width===390){
   assert.deepEqual(await page.locator('.library-features .library-copy h3').allTextContents(),['Abdome Agudo: Diagnóstico Sindrômico e Condutas Cirúrgicas de Emergência','Distúrbios Eletrolíticos e Ácido-Base','Estudos epidemiológicos']);
   assert.ok(await page.locator('.library-features .library-copy h3').first().evaluate(el=>parseFloat(getComputedStyle(el).fontSize))>=22);
  }
  assert.equal(await studio.locator('[data-studio-panel]:visible').count(),1);
  await page.locator('[data-studio-tab=question]').focus();await page.keyboard.press('ArrowRight');
  assert.equal(await page.locator('[data-studio-tab=sim]').evaluate(e=>e===document.activeElement),true);
  assert.equal(await page.locator('[data-studio-tab=question]').getAttribute('aria-selected'),'true');
  await page.keyboard.press('Enter');assert.equal(await page.locator('#studio-sim').isVisible(),true);
  await page.locator('[data-sim-choice=mode][data-value=training]').click();
  await page.locator('[data-sim-next]').click();await page.locator('[data-sim-bank=ENAMED]').click();
  await page.locator('[data-studio-tab=question]').click();await page.locator('[data-studio-tab=sim]').click();
  assert.equal(await page.locator('[data-sim-bank=ENAMED]').getAttribute('aria-pressed'),'true','tab swap loses simulator choice');
  await page.locator('[data-studio-tab=question]').click();
  const opener=page.locator('.q-demo__try');await opener.click();
  assert.equal(await page.locator('#qdemo').evaluate(e=>e.open),true);
  await page.locator('[data-qdemo-alt=d]').click();await page.locator('[data-qdemo-verify]').click();
  assert.equal(await page.locator('[data-qdemo-editorial]').isVisible(),true);
  await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement===document.querySelector('.q-demo__try'));assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
  for(let i=0;i<4;i++){await page.locator(`${width<1200?'.cycle-mobile-steps':'.cycle-nodes'} [data-cycle-select="${i}"]`).click();assert.equal(await page.locator('.journey-step[open]').count(),1);}
  const track=page.locator('.bank-gallery-window');await page.locator('[data-bank-next]').click();
  assert.ok(await track.evaluate(e=>e.scrollLeft)>0);assert.equal(await page.locator('.bank-gallery-track li').count(),40);
  assert.equal(await page.locator('[data-bank-pause]').isVisible(),false);
  assert.equal(await page.locator('.closing-pdf').count(),1);assert.equal(await page.locator('.moment-grid .closing-pdf').count(),0);
  const pdf=await page.locator('.closing-pdf').boundingBox(),faq=await page.locator('.about-faq').boundingBox();assert.ok(pdf.y>faq.y+faq.height);
  const audit=await new AxeBuilder({page}).include('.moment-paths').include('.practice-studio').include('.bank-gallery').include('.learning-journey').include('.closing-pdf').include('.pro').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  writeFileSync(`${out}/${engine}-${width}-axe.json`,JSON.stringify(audit,null,2));assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);
  results.push({engine,width,pass:true});console.log('PASS Academy experience',engine,width);await context.close();
 }
}finally{await browser.close();writeFileSync(`${out}/${engine}-report.json`,JSON.stringify(results,null,2));}
