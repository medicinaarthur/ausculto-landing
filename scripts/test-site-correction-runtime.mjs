import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {presentation} from './academy-presentation.mjs';
import {figureOverrides} from './academy-figure-overrides.mjs';
const base=process.env.SITE_QA_URL||'http://127.0.0.1:4188';
const folder=resolve(process.env.SITE_QA_EVIDENCE||'.local-art/correction-20260927/after');mkdirSync(folder,{recursive:true});
const routes=['/','/estudantes/','/conteudos/',...presentation.articles.map(a=>'/conteudos/'+a.summaryId+'/')];
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const report={base,checks:[],issues:[],captures:[],limitations:['Isolated installed Chrome; no physical iPhone/Android validation.','200% text uses doubled computed sizes; zoom reflow uses CSS viewport equivalence.','Static server lacks the consent reference Function; expected local 404 excepted.']};
const short=r=>r==='/'?'home':r.split('/').filter(Boolean).at(-1);
async function check(label,fn){if(process.env.SITE_QA_CHECK&&!new RegExp(process.env.SITE_QA_CHECK).test(label))return;try{await fn();report.checks.push({label,pass:true});console.log('PASS',label);}catch(e){report.issues.push({label,error:e.message});console.error('FAIL',label,e.message);}}
async function open(ctx,route){
 const page=await ctx.newPage();page.qa={errors:[],bad:[],requests:[],marketing:[]};
 page.on('pageerror',e=>page.qa.errors.push(e.message));page.on('request',r=>{page.qa.requests.push(r.url());if(/facebook\.com|connect\.facebook|google-analytics|googletagmanager/.test(r.url()))page.qa.marketing.push(r.url());});
 page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400&&!(base.startsWith('http://127.')&&r.url().includes('/_consent/reference')&&r.status()===404))page.qa.bad.push(r.status()+' '+r.url());});
 const response=await page.goto(base+route,{waitUntil:'load'});assert.equal(response.status(),200);await page.evaluate(()=>document.fonts.ready);
 const deny=page.locator('[data-consent-choice="denied"]');if(await deny.isVisible())await deny.click();return page;
}
async function overflow(page){const size=await page.evaluate(()=>[innerWidth,document.documentElement.scrollWidth]);assert.ok(size[1]<=size[0]+1,'page overflow '+size);}
async function capture(page,label,selector){
 const target=selector?page.locator(selector).first():page;const path=folder+'/'+label+'.png';
 if(selector){await target.scrollIntoViewIfNeeded();for(const img of await target.locator('img').all()){if(!await img.evaluate(el=>el.getBoundingClientRect().width>0&&el.getBoundingClientRect().height>0))continue;await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert.ok(await img.evaluate(el=>el.complete&&el.naturalWidth>0));}await target.scrollIntoViewIfNeeded();}
 else for(const img of await page.locator('img').all()){if(await img.evaluate(el=>{const r=el.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth;}))await img.evaluate(el=>el.decode());}
 await target.screenshot({path,animations:'disabled'});report.captures.push({label,path,viewport:page.viewportSize()});
}
async function clean(page){await overflow(page);assert.deepEqual(page.qa.errors,[]);assert.deepEqual(page.qa.bad,[]);assert.deepEqual(page.qa.marketing,[]);}
async function choose(page,kind,index=0){
 await page.locator(`[data-sim-select="${kind}"]`).click();const box=page.locator('#sim-selector input[type=checkbox]').nth(index);await box.check();const id=await box.getAttribute('value');await page.locator('[data-sim-apply]').click();return id;
}
async function cardHeights(page){
 const studio=page.locator('.practice-studio');assert.equal(await studio.count(),1);
 const panels=studio.locator('.studio-panel:visible');assert.equal(await panels.count(),1,'only the selected mode occupies space');
 const bounds=await panels.boundingBox(),container=await studio.boundingBox();assert.ok(bounds.width<=container.width&&bounds.height>0,'selected practice stays inside its shared card');
}

try{
 for(const width of [360,390,768,1100,1440,1920]){
  const ctx=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:1,reducedMotion:'reduce',hasTouch:width<600});
  for(const route of routes)await check(`matrix ${short(route)} ${width}`,async()=>{
   const page=await open(ctx,route);await capture(page,`${short(route)}-${width}-top`);
   const books=page.locator('[data-book]');assert.equal(await books.count(),route==='/estudantes/'||route==='/conteudos/'?3:route.startsWith('/conteudos/')?2:0);
   for(const img of await page.locator('main img:visible').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(el=>el.decode());assert.ok(await img.evaluate(el=>el.naturalWidth>0));}
   if(route==='/estudantes/'){
    if(width<=390)assert.deepEqual(await page.locator('.showcase-stats strong').evaluateAll(es=>es.map(e=>[e.clientWidth,e.scrollWidth]).filter(([a,b])=>b>a+1)),[],'mobile metric overflow');
    await cardHeights(page);if([390,1440].includes(width)){await capture(page,`students-about-${width}`,'.practice-studio');await capture(page,`students-ecg-${width}`,'#curso-ecg');await capture(page,`students-books-${width}`,'.library-features');}
    await page.locator('#catalogue-search').fill('abdome');assert.equal(await page.locator('#curso-ecg').count(),1);assert.ok(await page.locator('#curso-ecg').isVisible());
    await page.locator('[data-ecg-expand]').click();assert.equal(await page.locator('#ecg-modules').evaluate(el=>el.open),true);assert.equal(await page.locator('#ecg-modules li').count(),18);
   }
   if(route.startsWith('/conteudos/')&&route!=='/conteudos/'){
    const a=presentation.articles.find(a=>route.includes(a.summaryId));assert.equal(await page.locator('.reader-section').count(),a.blocks.length);assert.equal(await page.locator('.article-prose img').count(),a.assets.length+figureOverrides.derivatives.filter(d=>d.id.startsWith(a.summaryId==='estudos-epidemiologicos'?'epidemiologia-':a.summaryId==='abdome-agudo'?'abdome-mecanismos':'acidobase-disturbios')).length);
    assert.equal(await page.locator('.article-prose').evaluate(el=>getComputedStyle(el).fontFamily).then(f=>f.includes('Montserrat')),true);
    const title=await page.locator('h1').evaluate(el=>({family:getComputedStyle(el).fontFamily,color:getComputedStyle(el).color}));assert.ok(title.family.includes('DM Serif'));assert.equal(title.color,'rgb(255, 255, 255)');
    if([390,1440].includes(width)){await capture(page,`${a.summaryId}-${width}-study`,'.reader-content .reader-section');await capture(page,`${a.summaryId}-${width}-related`,'.related');}
   }
   if(route==='/'&&[390,1440].includes(width)){await capture(page,`home-flow-${width}`,width<600?'#m-meu-plantao':'.tl-plantao');await capture(page,`home-mind-${width}`,width<600?'.ausmind-feature':'.tcard--ausmind');}
   await clean(page);await page.close();
  });await ctx.close();
 }
 for(const width of [390,1440])await check(`simulator all journeys ${width}`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height:1000},reducedMotion:'reduce'});const page=await open(ctx,'/estudantes/');
  await page.locator('[data-studio-tab=sim]').click();
  await page.locator('[data-sim-choice=mode][data-value=training]').click();await page.locator('[data-sim-next]').click();await cardHeights(page);
  await page.locator('[data-sim-bank=ENAMED]').click();await page.locator('[data-sim-bank="SUS-SP"]').click();assert.equal(await page.locator('.sim-banks [aria-pressed=true]').count(),2);
  await page.locator('[data-sim-next]').click();assert.equal(await page.locator('[data-sim-select=specialties]').isDisabled(),true);
  await cardHeights(page);const area=await choose(page,'areas');assert.equal(await page.locator('[data-sim-select=specialties]').isDisabled(),false);await choose(page,'specialties');
  await page.locator('[data-sim-select=themes]').click();const available=await page.locator('#sim-selector input[type=checkbox]').count();assert.ok(available>0);await page.locator('#sim-selector input[type=checkbox]').first().check();await page.locator('[data-sim-apply]').click();
  if(!await page.locator('[data-sim-select=subthemes]').isDisabled())await choose(page,'subthemes');
  await page.locator('[data-sim-select=areas]').click();await page.locator('[data-sim-clear]').click();await page.locator('[data-sim-apply]').click();assert.equal(await page.locator('[data-sim-select=specialties]').isDisabled(),true);assert.equal(await page.locator('[data-sim-select=themes]').isDisabled(),true);
  await choose(page,'areas');await choose(page,'specialties');await page.locator('[data-sim-next]').click();await cardHeights(page);
  await page.locator('[data-sim-difficulty=facil]').click();await page.locator('[data-sim-difficulty=r2]').click();await page.locator('#sim-quantity').fill('30');assert.equal(await page.locator('.sim-demo__cta').isVisible(),true);
  await page.locator('#sim-quantity').fill('31');assert.equal(await page.locator('.sim-demo__cta').isVisible(),false);await page.locator('#sim-quantity').fill('10');
  await cardHeights(page);await capture(page,`sim-training-${width}`,'#simulados-demo');{const url=new URL(await page.locator('.sim-demo__cta').getAttribute('href'));assert.equal(url.origin,'https://app.auscultoapp.com');assert.equal(url.pathname,'/');assert.equal(url.searchParams.has('returnTo'),false);assert.equal(url.searchParams.has('preset'),false);}
  for(let i=0;i<3;i++)await page.locator('[data-sim-back]').click();await page.locator('[data-sim-choice=mode][data-value=exam]').click();await page.locator('[data-sim-choice=scope][data-value=mixed]').click();await page.locator('[data-sim-next]').click();assert.equal(await page.locator('.sim-banks [aria-pressed=true]').count(),1);
  await page.locator('[data-sim-bank=EINSTEIN]').click();await page.locator('[data-sim-next]').click();assert.equal(await page.locator('[data-sim-select]').count(),0);assert.equal(await page.locator('.sim-mix li').count(),5);await page.locator('[data-sim-next]').click();await page.locator('[data-sim-quantity="100"]').click();assert.equal(await page.locator('#sim-quantity').count(),0);await cardHeights(page);
  for(let i=0;i<3;i++)await page.locator('[data-sim-back]').click();await page.locator('[data-sim-choice=scope][data-value=focused]').click();await page.locator('[data-sim-next]').click();await page.locator('[data-sim-next]').click();assert.equal(await page.locator('[data-sim-select=specialties]').isDisabled(),true);await choose(page,'areas');await choose(page,'specialties');await page.locator('[data-sim-next]').click();await page.locator('#sim-quantity').fill('1');assert.equal(await page.locator('.sim-demo__cta').isVisible(),true);
  assert.ok(!page.qa.requests.some(r=>/residencyQuestion|generateSimulado|simuladoGeneration/.test(r)));await clean(page);await ctx.close();
 });
 await check('book touch/keyboard/hover and final decoded frames in all surfaces',async()=>{
  for(const route of routes.filter(r=>r!=='/')){
   const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await open(ctx,route);
   for(const book of await page.locator('[data-book]').all()){
    await book.scrollIntoViewIfNeeded();await book.focus();await book.press('Enter');await page.waitForFunction(el=>el.querySelector('img.is-active')?.src.includes('-open.webp'),await book.elementHandle());await book.press('Escape');assert.equal(await book.getAttribute('aria-pressed'),'false');
    await book.hover();await page.waitForFunction(el=>el.querySelector('img.is-active')?.src.includes('-open.webp'),await book.elementHandle());await page.mouse.move(0,0);
   }await clean(page);await ctx.close();
  }
  const ctx=await browser.newContext({viewport:{width:390,height:1000},hasTouch:true,isMobile:true,reducedMotion:'reduce'});const page=await open(ctx,'/conteudos/');const book=page.locator('[data-book]').first();await book.tap();await page.waitForFunction(()=>document.querySelector('[data-book] img.is-active')?.src.includes('-open.webp'));await book.tap();assert.equal(await book.getAttribute('aria-pressed'),'false');await ctx.close();
 });
 await check('notes/progress/position/font persist after reload and stay isolated',async()=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const route=routes[3],page=await open(ctx,route),block=page.locator('[data-study-block="section-002"]');
  await block.locator('[data-study-note]').click();await block.locator('textarea').fill('<script>Minha anotação é texto</script>');await block.locator('textarea').blur();await block.locator('[data-study-done]').check();await block.locator('[data-study-current]').click();await page.locator('[data-study-font]').fill('150');await page.reload();
  assert.equal(await block.locator('[data-study-done]').isChecked(),true);assert.equal(await block.locator('textarea').inputValue(),'<script>Minha anotação é texto</script>');assert.equal(await block.locator('[data-study-current]').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('[data-study-font]').inputValue(),'150');assert.equal(await page.locator('.article-prose').evaluate(el=>getComputedStyle(el).fontSize),'27px');
  await page.locator('[data-study-resume]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'section-002');
  await page.goto(base+routes[4]);assert.equal(await page.locator('[data-study-block="section-002"] [data-study-done]').isChecked(),false);assert.equal(await page.locator('[data-study-block="section-002"] textarea').inputValue(),'');assert.ok(!page.qa.requests.some(r=>r.includes('Minha')));await clean(page);await ctx.close();
 });
 await check('storage denial leaves working controls and session-only disclosure',async()=>{
  const ctx=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'});await ctx.addInitScript(()=>{Storage.prototype.setItem=function(){throw new DOMException('Denied','SecurityError');};});const page=await open(ctx,routes[5]);const b=page.locator('[data-study-block="section-002"]');await b.locator('[data-study-note]').click();await b.locator('textarea').fill('Sessão apenas');await b.locator('textarea').blur();await b.locator('[data-study-done]').check();assert.ok((await page.locator('[data-study-storage]').textContent()).includes('apenas nesta sessão'));assert.ok((await b.locator('[data-study-status]').textContent()).includes('apenas nesta sessão'));await clean(page);await ctx.close();
 });
 await check('all flattened figures served byte-identical, correct flow, retired assets excluded',async()=>{
  const manifest=JSON.parse(readFileSync('dist/site-manifest.json'));
  for(const f of figureOverrides.derivatives){const response=await fetch(base+f.url);assert.equal(response.status,200);const bytes=Buffer.from(await response.arrayBuffer());assert.equal(createHash('sha256').update(bytes).digest('hex'),f.sha256);assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');}
  for(const url of figureOverrides.retiredPublicAssets)assert.ok(!manifest.files[url.slice(1)],url);
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await open(ctx,routes[4]);const section=page.locator('#section-024');assert.ok(!(await section.textContent()).includes('causas de hiponatremia'));await capture(page,'gasometry-flow-1440','#section-024');const zoom=section.locator('.zoom-button');await zoom.focus();await zoom.press('Enter');assert.equal(await page.locator('#material-zoom').evaluate(el=>el.open),true);await page.keyboard.press('Escape');assert.equal(await zoom.evaluate(el=>el===document.activeElement),true);
  await page.goto(base+routes[5]);for(const f of await page.locator('.reader-figure').all())await capture(page,'epidemiology-'+await f.getAttribute('data-figure'),`[data-figure="${await f.getAttribute('data-figure')}"]`);await ctx.close();
 });
 for(const dpr of [1,2,3])for(const width of [390,1440])await check(`assets DPR${dpr} ${width}`,async()=>{
  const ctx=await browser.newContext({viewport:{width,height:1000},deviceScaleFactor:dpr,reducedMotion:'reduce'});const page=await open(ctx,'/');const photo=page.locator(width<600?'#m-meu-plantao .feat__photo':'.tl-plantao__photo');assert.ok((await photo.getAttribute('src')).includes(width<600?'plantao-m-21':'plantao-student'));await capture(page,`ausflow-${width}-dpr${dpr}`,width<600?'#m-meu-plantao':'.tl-plantao');await capture(page,`ausmind-${width}-dpr${dpr}`,width<600?'.ausmind-feature':'.tcard--ausmind');await page.goto(base+'/estudantes/');await capture(page,`ecg-${width}-dpr${dpr}`,'#curso-ecg');await clean(page);await ctx.close();
 });
 await check('AusMind edge sweep pauses offscreen/hidden and respects reduced motion',async()=>{
  const ctx=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const page=await open(ctx,'/');const card=page.locator('.tcard--ausmind');await card.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.tcard--ausmind').dataset.glintState==='running');assert.ok(await card.evaluate(el=>getComputedStyle(el,'::after').animationName.includes('ausmind-edge-sweep')));await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});assert.equal(await card.getAttribute('data-glint-state'),'paused');await page.evaluate(()=>{Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));scrollTo(0,0);});await page.waitForFunction(()=>document.querySelector('.tcard--ausmind').dataset.glintState==='paused');await page.emulateMedia({reducedMotion:'reduce'});await card.scrollIntoViewIfNeeded();await page.waitForFunction(()=>document.querySelector('.tcard--ausmind').dataset.glintState==='static');assert.equal(await card.evaluate(el=>getComputedStyle(el,'::after').display),'none');await ctx.close();
 });
 for(const route of routes)await check(`200% zoom reflow ${short(route)}`,async()=>{const ctx=await browser.newContext({viewport:{width:720,height:500},deviceScaleFactor:2,reducedMotion:'reduce'});const page=await open(ctx,route);await clean(page);await capture(page,'zoom200-'+short(route));await ctx.close();});
 for(const route of routes)await check(`200% text ${short(route)}`,async()=>{
  const ctx=await browser.newContext({viewport:{width:390,height:1000},reducedMotion:'reduce'});const page=await open(ctx,route);await page.evaluate(()=>{const sizes=[...document.querySelectorAll('body *')].map(el=>[el,parseFloat(getComputedStyle(el).fontSize)]);for(const [el,size]of sizes)el.style.setProperty('font-size',size*2+'px','important');});await overflow(page);await capture(page,'text200-'+short(route));await ctx.close();
 });
 await check('no-JS full reading/catalogue/books/app links',async()=>{
  const ctx=await browser.newContext({viewport:{width:390,height:1000},javaScriptEnabled:false});const page=await open(ctx,'/estudantes/');assert.equal(await page.locator('.catalogue-list li').count(),152);assert.equal(await page.locator('[data-book]').count(),3);{const url=new URL(await page.locator('.sim-demo__cta').getAttribute('href'));assert.equal(url.origin,'https://app.auscultoapp.com');assert.equal(url.pathname,'/');assert.equal(url.searchParams.has('returnTo'),false);assert.equal(url.searchParams.has('preset'),false);}await page.goto(base+routes[3]);assert.equal(await page.locator('.reader-section').count(),27);assert.equal(await page.locator('[data-book]').count(),2);await overflow(page);await ctx.close();
 });
}finally{await browser.close();writeFileSync(folder+'/report.json',JSON.stringify(report,null,2)+'\n');}
console.log(report.checks.length+' passed; '+report.issues.length+' failed; '+report.captures.length+' captures. '+folder);if(report.issues.length)process.exitCode=1;
