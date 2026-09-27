import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const base=process.env.SITE_QA_URL||'http://127.0.0.1:4197';
const out=resolve('.local-art/academy-dossier/delivery');mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});
const metrics=[];
try{
 for(const [width,height]of [[1448,1086],[390,844]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,recordVideo:{dir:resolve(out,'raw'),size:{width,height}}});
  await context.addInitScript(()=>{window.heroVitals={cls:0,lcp:0};new PerformanceObserver(list=>{for(const e of list.getEntries())if(!e.hadRecentInput)window.heroVitals.cls+=e.value;}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(list=>{for(const e of list.getEntries())window.heroVitals.lcp=e.startTime;}).observe({type:'largest-contentful-paint',buffered:true});});
  const page=await context.newPage();await page.goto(base+'/estudantes/');await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(750);
  metrics.push({width,...await page.evaluate(()=>({...window.heroVitals,heroResources:performance.getEntriesByType('resource').filter(e=>e.name.includes('/dossier/')).map(e=>({name:e.name,bytes:e.encodedBodySize,duration:e.duration}))}))});
  const deny=page.getByRole('button',{name:'Recusar',exact:true});if(await deny.isVisible())await deny.click();
  await page.screenshot({path:resolve(out,`${width}-viewport.png`)});await page.locator('[data-dossier]').screenshot({path:resolve(out,`${width}-hero.png`)});
  for(const id of ['usp-sp','sus-sp','einstein','unifesp','enamed']){
   await page.locator(`[data-dossier-tab="${id}"]`).click();await page.waitForFunction(id=>document.querySelector('[data-dossier]').dataset.bank===id&&!document.querySelector('[data-dossier-book]').hasAttribute('aria-busy'),id);await page.locator('[data-dossier-book]').screenshot({path:resolve(out,`${width}-${id}.png`)});await page.waitForTimeout(180);
  }
  await page.evaluate(()=>scrollTo(0,0));await page.locator('[data-dossier-tab=usp-sp]').click();await page.waitForSelector('.dossier-turn');await page.evaluate(()=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=Number(a.effect.getTiming().duration)*.42;}));await page.screenshot({path:resolve(out,`${width}-turn-midpoint.png`)});await page.evaluate(()=>document.getAnimations().forEach(a=>a.finish()));
  await page.locator('[data-dossier-text]').click();await page.screenshot({path:resolve(out,`${width}-text-version.png`)});await page.keyboard.press('Escape');
  await page.locator('[data-dossier-practice]:visible').click();await page.locator('[data-practice-confirm]').waitFor();await page.screenshot({path:resolve(out,`${width}-practice.png`)});await page.keyboard.press('Escape');
  const video=page.video();await context.close();await video.saveAs(resolve(out,`${width}-page-turn.webm`));
 }
 const home=await browser.newPage({viewport:{width:1448,height:1086}});await home.goto(base);await home.locator('[data-consent-choice=denied]').click();await home.locator('.evidence-metrics:visible').screenshot({path:resolve(out,'home-metrics.png')});await home.close();
}finally{await browser.close();}
writeFileSync(resolve(out,'lab-vitals.json'),JSON.stringify({condition:'Installed Chrome, localhost, DPR1, no network/CPU throttle. Not field data.',metrics},null,2));
const data=path=>'data:image/png;base64,'+readFileSync(path).toString('base64');
const refs={desktop:process.env.DOSSIER_DESKTOP_REFERENCE||'C:/Users/medic/Downloads/previewheroestudante.png',mobile:process.env.DOSSIER_MOBILE_REFERENCE||'C:/Users/medic/Downloads/previewmobileestudantehero.png'};
const html=`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Academy — comparação visual</title><style>body{font:16px/1.6 system-ui;margin:30px;background:#eef0f4;color:#14243a}h1{font-size:27px}h2{font-size:21px;margin-top:35px}.pair{display:flex;gap:20px;align-items:flex-start}.pair figure{margin:0;flex:1;min-width:0}.pair img{width:100%;display:block}.mobile{max-width:800px}.overlay{position:relative;max-width:1448px}.overlay img{width:100%;display:block}.overlay .candidate{position:absolute;inset:0;opacity:.5}input{width:300px}figcaption{margin:7px 0}</style><h1>Academy — referência e implementação</h1><p>Capturas reais do build local. Desktop: 1448 × 1086, DPR 1. Mobile: 390 px, DPR 1. O mobile usa a coluna legível aprovada; as imagens são normalizadas apenas pela largura, sem comprimir sua altura.</p><h2>Desktop · lado a lado</h2><div class="pair"><figure><figcaption>Referência aprovada</figcaption><img src="${data(refs.desktop)}"></figure><figure><figcaption>Implementação</figcaption><img src="${data(resolve(out,'1448-viewport.png'))}"></figure></div><h2>Desktop · sobreposição</h2><label>Opacidade da implementação <input type="range" min="0" max="100" value="50" oninput="document.querySelector('.candidate').style.opacity=this.value/100"></label><div class="overlay"><img src="${data(refs.desktop)}"><img class="candidate" src="${data(resolve(out,'1448-viewport.png'))}"></div><h2>Mobile · composição completa</h2><div class="pair mobile"><figure><figcaption>Referência de direção visual</figcaption><img src="${data(refs.mobile)}"></figure><figure><figcaption>Implementação em uma coluna</figcaption><img src="${data(resolve(out,'390-hero.png'))}"></figure></div></html>`;
writeFileSync(resolve(out,'comparison.html'),html);console.log('Captured visual comparisons, ten book states, motion and practice:',out);
