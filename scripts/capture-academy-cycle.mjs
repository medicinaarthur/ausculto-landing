import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const out='.local-art/academy-refinement/delivery';await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
for(const width of [390,1440]){
 const context=await browser.newContext({viewport:{width,height:width===390?1600:1080},deviceScaleFactor:2}),page=await context.newPage();
 await page.goto('http://127.0.0.1:4197/estudantes/');await page.evaluate(()=>document.fonts.ready);const reject=page.getByRole('button',{name:'Recusar',exact:true});if(await reject.isVisible())await reject.click();
 await page.addStyleTag({content:'.atb,.sticky-cta,.skip-link{visibility:hidden!important}.about-academy,.academy-library{content-visibility:visible!important}'});
 for(const [name,selector] of [['clinical','.clinical-tools-card'],['ecg','#curso-ecg']]){await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(400);await page.locator(selector).screenshot({path:`${out}/${name}-${width}.png`});}
 await page.locator('.pro-grid').scrollIntoViewIfNeeded();
 for(let i=0;i<4;i++){
  await page.waitForFunction(i=>document.querySelector('[data-pro-sequence]').dataset.frame===String(i),i);
  // Freeze only the captured pose, keeping the live controller intact in the actual page.
  const style=await page.addStyleTag({content:`.pro-pose{opacity:0!important}.pro-pose[data-pro-pose="${i}"]{opacity:1!important}[data-pro-sequence]{opacity:1!important;transform:none!important}`});
  await page.locator('.pro--animated').screenshot({path:`${out}/pro-${width}-${i+1}.png`});await style.evaluate(e=>e.remove());
 }
 for(let i=0;i<4;i++){
  await page.locator(`${width<1200?'.cycle-mobile-steps':'.cycle-nodes'} [data-cycle-select="${i}"]`).click();await page.waitForTimeout(750);await page.locator('.study-cycle').screenshot({path:`${out}/cycle-${width}-${i+1}.png`});
 }
 await context.close();
 // Proof video starts at the actual component and covers two complete PRO cycles.
 for(const section of ['pro','cycle']){
  const videoContext=await browser.newContext({viewport:{width,height:width===390?1050:1080},recordVideo:{dir:out,size:{width,height:width===390?1050:1080}}}),p=await videoContext.newPage();
  await p.goto('http://127.0.0.1:4197/estudantes/');const r=p.getByRole('button',{name:'Recusar',exact:true});if(await r.isVisible())await r.click();await p.addStyleTag({content:'.atb,.sticky-cta,.skip-link{visibility:hidden!important}'});
  await p.locator(section==='pro'?'.pro--animated':'.study-cycle').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY));await p.waitForTimeout(600);
  if(section==='pro')await p.waitForTimeout(10500);
  else for(let i=0;i<4;i++){await p.locator(`${width<1200?'.cycle-mobile-steps':'.cycle-nodes'} [data-cycle-select="${i}"]`).click();await p.waitForTimeout(1500);}
  const video=p.video();await videoContext.close();await video.saveAs(`${out}/${section}-${width}.webm`);
 }
 await fs.writeFile(`${out}/README.txt`,'Capturas do build local em DPR 2. Vídeos de prova em DPR 1. Cabeçalho fixo, cookies e CTA flutuante ocultos somente nas capturas para não cobrir os componentes. Quatro fotografias originais, sem substituição da interface.\n');
}
await browser.close();
