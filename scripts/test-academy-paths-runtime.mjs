import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const out='.local-art/academy-paths-v2/qa',url='http://127.0.0.1:4197/estudantes/';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'}),results=(process.env.PATHS_QA_WIDTHS||process.env.PATHS_QA_EXTRAS_ONLY)?JSON.parse(readFileSync(out+'/report.json')):[];
async function setup(width,dpr=1,extra={}){
 const context=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:dpr,hasTouch:width<768,...extra});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.evaluate(()=>document.fonts.ready);
 const reject=page.getByRole('button',{name:'Recusar',exact:true});if(await reject.isVisible())await reject.click();
 return{context,page,errors};
}
const selectors={residence:'#residencia',enamed:'#enamed',tools:'#ferramentas-academy',pro:'#pro',journey:'.study-cycle'};
try{
 for(const width of process.env.PATHS_QA_EXTRAS_ONLY?[]:process.env.PATHS_QA_WIDTHS?process.env.PATHS_QA_WIDTHS.split(',').map(Number):[360,390,430,768,1024,1280,1440,1920])for(const dpr of width<768?[1,2,3]:[1,2]){
  const {context,page,errors}=await setup(width,dpr,{reducedMotion:'reduce'});
  for(const [name,selector]of Object.entries(selectors)){
   await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(100);
   if(name==='enamed'&&width>=768){await page.locator('[data-enamed-book]').focus();await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='open');}
   if(name==='tools'){
    assert.equal(await page.locator('.tool-float-card').count(),7);
    assert.equal(await page.locator('.tool-float-card--glow').count(),2);
    const cards=await page.locator('.tool-float-card').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return{x:r.x,right:r.right,y:r.y,bottom:r.bottom};}));
    for(const card of cards)assert.ok(card.x>=-1&&card.right<=width+1,'tool card cut by viewport');
    const copy=await page.locator('.clinical-tools-copy').boundingBox();
    if(width>=1200)for(const card of cards)assert.ok(card.x>=copy.x+copy.width-1,'tool card covers copy');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'horizontal overflow');
   // Fixed navigation is omitted only from export, to avoid covering taller component captures.
   const style=await page.addStyleTag({content:'.atb,.sticky-cta,.skip-link,.academy-header,body.has-sticky::after{display:none!important}'});
   await page.locator(selector).screenshot({path:`${out}/${name}-${width}-dpr${dpr}.png`});await style.evaluate(e=>e.remove());
  }
  assert.equal(await page.locator('.bank-gallery-track>li').count(),40);
  assert.equal(await page.locator('[data-bank-pause]').isVisible(),false);
  assert.equal(await page.locator('[data-pro-sequence]').getAttribute('data-playing'),'reduced-motion');
  const book=page.locator('[data-enamed-book]');await book.scrollIntoViewIfNeeded();
  if(width>=768){await book.focus();await page.keyboard.press('Escape');assert.equal(await book.getAttribute('aria-pressed'),'false');await page.keyboard.press('Enter');}
  else{await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='open');await book.tap();assert.equal(await book.getAttribute('aria-pressed'),'false');await book.tap();}
  await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='open');
  await page.locator('.enamed-index summary').click();assert.equal(await page.locator('.enamed-index li').count(),6);
  const control=width>=1200?'.cycle-nodes':'.cycle-mobile-steps';
  for(let i=0;i<4;i++){await page.locator(`${control} [data-cycle-select="${i}"]`).click();await page.waitForFunction(i=>document.querySelector(`[data-cycle-pose="${i}"]`).classList.contains('is-active'),i);assert.equal(await page.locator('.journey-step[open]').count(),1);assert.equal(await page.locator('.cycle-orbit-track .is-active').count(),1);}
  if(dpr===1){const audit=await new AxeBuilder({page}).include('.academy-paths-v2').include('.pro').include('.study-cycle').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();writeFileSync(`${out}/axe-${width}.json`,JSON.stringify(audit,null,2));assert.deepEqual(audit.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),[]);}
  assert.deepEqual(errors,[]);results.push({width,dpr,pass:true});console.log('PASS layout, input, accessibility',width,dpr);await context.close();
 }
 // Motion contracts: hand trigger once, rail hover/focus/pause/offscreen, keyboard book.
 {
  const {context,page}=await setup(1440);const residency=page.locator('[data-residency-block]');
  assert.equal(await residency.getAttribute('class').then(c=>c.includes('is-hand-visible')),false);
  await residency.evaluate(el=>scrollTo(0,scrollY+el.getBoundingClientRect().top+el.clientHeight/2-innerHeight/2));
  await page.waitForFunction(()=>document.querySelector('[data-residency-block]').classList.contains('is-hand-visible'));await page.waitForTimeout(850);
  const hand=await page.locator('.residency-hand').boundingBox(),actions=await page.locator('.residency-copy .path-actions').boundingBox();assert.ok(hand.y>=actions.y+actions.height,'hand covers actions');
  await page.evaluate(()=>scrollTo(0,0));assert.equal(await residency.evaluate(el=>el.classList.contains('is-hand-visible')),true);
  const rail=page.locator('.bank-gallery-window');await rail.scrollIntoViewIfNeeded();await page.mouse.move(0,0);await page.evaluate(()=>document.activeElement.blur());
  const x=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(600);assert.ok(await rail.evaluate(e=>e.scrollLeft)>x+5,'rail does not advance');
  await rail.hover();const hovered=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(300);assert.ok(Math.abs(await rail.evaluate(e=>e.scrollLeft)-hovered)<2);
  await page.mouse.move(0,0);await rail.focus();const focused=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(300);assert.ok(Math.abs(await rail.evaluate(e=>e.scrollLeft)-focused)<2);
  await page.locator('[data-bank-pause]').click();await page.evaluate(()=>document.activeElement.blur());await page.mouse.move(0,0);const paused=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(300);assert.ok(Math.abs(await rail.evaluate(e=>e.scrollLeft)-paused)<2);
  assert.equal(await page.locator('[data-bank-clone]').count(),40);assert.equal(await page.locator('[data-bank-clone]').evaluateAll(els=>els.every(el=>el.inert&&el.getAttribute('aria-hidden')==='true')),true);
  await page.locator('[data-bank-pause]').click();const resumed=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(300);assert.ok(await rail.evaluate(e=>e.scrollLeft)>resumed+3,'Retomar must work while its control retains focus');await page.evaluate(()=>scrollTo(0,0));const off=await rail.evaluate(e=>e.scrollLeft);await page.waitForTimeout(300);assert.ok(Math.abs(await rail.evaluate(e=>e.scrollLeft)-off)<2);
  const book=page.locator('[data-enamed-book]');await book.hover();await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='open');await page.mouse.move(0,0);await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='closed');
  await book.focus();await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='open');await page.keyboard.press(' ');assert.equal(await book.getAttribute('aria-pressed'),'false');await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='open');
  await context.close();results.push({motion:true,pass:true});console.log('PASS motion, rail pause, keyboard');
 }
 // Failed art must preserve useful text and actions.
 {
  const context=await browser.newContext({viewport:{width:390,height:1000},hasTouch:true});await context.route('**/paths-v2/enamed-open*',r=>r.abort());await context.route('**/paths-v2/tools-screen*',r=>r.abort());const page=await context.newPage();await page.goto(url);await page.locator('[data-enamed-book]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.assetUnavailable==='true');assert.equal(await page.locator('.enamed-cta').isVisible(),true);await page.locator('#ferramentas-academy').scrollIntoViewIfNeeded();assert.equal(await page.locator('.tool-float-card').count(),7);await context.close();results.push({imageFailure:true,pass:true});console.log('PASS failed images');
 }
 {
  const {context,page}=await setup(360,1,{reducedMotion:'reduce'});await page.evaluate(()=>document.documentElement.style.fontSize='200%');for(const selector of Object.values(selectors)){await page.locator(selector).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);}await context.close();results.push({enlargedText:true,pass:true});console.log('PASS enlarged text');
 }
}finally{await browser.close();writeFileSync(`${out}/report.json`,JSON.stringify(results,null,2));}
