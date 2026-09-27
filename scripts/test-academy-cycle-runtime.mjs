import {chromium,firefox,webkit} from 'playwright';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const engine=process.env.CYCLE_BROWSER||'chromium',out=`.local-art/academy-refinement/cycle-qa/${engine}`;
await fs.mkdir(out,{recursive:true});
const browser=await({chromium,firefox,webkit}[engine]).launch({headless:true,...(engine==='chromium'?{channel:'chrome'}:{})});
const results=[];
async function setup(width,options={}){const context=await browser.newContext({viewport:{width,height:1000},...options}),page=await context.newPage();page.setDefaultTimeout(15000);await page.goto('http://127.0.0.1:4197/estudantes/');if(options.javaScriptEnabled!==false)await page.evaluate(()=>document.fonts.ready);const reject=page.getByRole('button',{name:'Recusar',exact:true});if(options.javaScriptEnabled!==false&&await reject.isVisible())await reject.click();return {context,page};}
try{
 for(const width of process.env.CYCLE_EXTRAS_ONLY?[]:[320,375,390,430,768,1024,1280,1440,1920]){
  const {context,page}=await setup(width,{reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const cycle=page.locator('[data-study-cycle]');await cycle.scrollIntoViewIfNeeded();
  assert.equal(await cycle.getAttribute('data-stage'),'0');
  for(let i=0;i<4;i++){
   const button=page.locator(`${width>=1200?'.cycle-nodes':'.cycle-mobile-steps'} [data-cycle-select="${i}"]`);
   await button.click();await page.waitForFunction(i=>document.querySelector(`[data-cycle-pose="${i}"]`).classList.contains('is-active'),i);
   assert.equal(await page.locator('.journey-step[open]').count(),1);assert.equal(await cycle.getAttribute('data-stage'),String(i));
   assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await button.evaluate(e=>e===document.activeElement),true);
  }
  if(width<1200){assert.equal(await page.locator('[data-cycle-next]').innerText(),'Recomeçar ↻');await page.locator('[data-cycle-next]').click();assert.equal(await page.locator('[data-cycle-prev]').isDisabled(),true);}
  await page.evaluate(()=>{for(const i of [2,0,3,1])document.querySelector(`.cycle-mobile-steps [data-cycle-select="${i}"]`).click();});
  await page.waitForFunction(()=>document.querySelector('[data-cycle-pose="1"]').classList.contains('is-active'));assert.equal(await cycle.getAttribute('data-stage'),'1');
  await page.setViewportSize({width:width>=1200?390:1440,height:1000});assert.equal(await cycle.getAttribute('data-stage'),'1');await page.setViewportSize({width,height:1000});
  assert.equal(await page.locator('#curso-ecg').count(),1);assert.equal(await page.locator('#ecg-modules ol a').count(),18);
  assert.equal(await page.locator('#curso-ecg').evaluate(e=>e.previousElementSibling.classList.contains('library-features')),true);
  await page.locator('[data-ecg-expand]').click();assert.equal(await page.locator('#ecg-modules').evaluate(e=>e.open),true);
  assert.equal(await page.locator('.tool-float-card').count(),7);
  assert.equal(await page.locator('.clinical-tools-link').getAttribute('href'),'https://app.auscultoapp.com/');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(errors,[]);
  results.push({width,pass:true});console.log('PASS',engine,width);await context.close();
 }
 // Forward-only campaign, exact asymmetric holds and restart. Mutation times observed in runtime.
 {
  const {context,page}=await setup(1440);await page.locator('.pro-grid').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>document.querySelector('[data-pro-sequence]').dataset.playing==='true');
  const sequence=await page.evaluate(()=>new Promise(resolve=>{const el=document.querySelector('[data-pro-sequence]'),events=[],start=performance.now();const observer=new MutationObserver(()=>{const frame=el.dataset.frame;if(events.at(-1)?.frame!==frame)events.push({frame,t:performance.now()-start});});observer.observe(el,{attributes:true,attributeFilter:['data-frame']});setTimeout(()=>{observer.disconnect();resolve(events);},10400);}));
  assert.ok(sequence.length>=8);for(let i=1;i<sequence.length;i++)assert.equal(Number(sequence[i].frame),(Number(sequence[i-1].frame)+1)%4);
  const first=sequence.findIndex(e=>e.frame==='0');if(first>=0&&sequence[first+3]){const durations=[1820,220,220];for(let j=0;j<3;j++)assert.ok(Math.abs(sequence[first+j+1].t-sequence[first+j].t-durations[j])<180);}
  await fs.writeFile(`${out}/pro-timeline.json`,JSON.stringify(sequence,null,2));
  await page.evaluate(()=>scrollTo(0,0));await page.waitForFunction(()=>document.querySelector('[data-pro-sequence]').dataset.playing==='false');
  await page.locator('.pro-grid').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('[data-pro-sequence]').dataset.playing==='true');assert.equal(await page.locator('[data-pro-sequence]').getAttribute('data-frame'),'0');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await page.locator('[data-pro-sequence]').getAttribute('data-playing'),'false');
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForFunction(()=>document.querySelector('[data-pro-sequence]').dataset.playing==='true');
  await context.close();console.log('PASS',engine,'timeline and visibility');
 }
 for(const width of [390,1440]){const {context,page}=await setup(width,{javaScriptEnabled:false});assert.equal(await page.locator('.journey-step[open]').count(),4);assert.equal(await page.locator('#curso-ecg').count(),1);await context.close();console.log('PASS',engine,'no-JS',width);}
 {const {context,page}=await setup(390,{reducedMotion:'reduce'});await page.locator('.pro-grid').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('[data-pro-sequence]').dataset.playing==='reduced-motion');assert.equal(await page.locator('[data-pro-sequence]').evaluate(e=>getComputedStyle(e).transform),'none');await context.close();}
 {
  const context=await browser.newContext({viewport:{width:390,height:1000}});await context.route('**/pro-motion/pose-3*',r=>r.abort());await context.route('**/study-cycle/pose-2*',r=>r.abort());const page=await context.newPage();await page.goto('http://127.0.0.1:4197/estudantes/');await page.locator('.pro-grid').scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('[data-pro-sequence]').dataset.playing==='asset-unavailable');assert.equal(await page.locator('.pro-pose.is-current img').evaluate(e=>e.naturalWidth>0),true);await page.evaluate(()=>document.querySelector('.cycle-mobile-steps [data-cycle-select="1"]').click());await page.waitForFunction(()=>document.querySelector('[data-study-cycle]').dataset.poseUnavailable==='true');assert.equal(await page.locator('.journey-step[open]').count(),1);await context.close();
 }
 console.log('PASS',engine,'campaign, hidden tab, offscreen, no-JS, missing assets');
}finally{await browser.close();await fs.writeFile(`${out}/report.json`,JSON.stringify(results,null,2));}
