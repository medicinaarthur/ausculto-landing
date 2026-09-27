import {chromium} from 'playwright';
import {mkdirSync,copyFileSync,existsSync,writeFileSync} from 'node:fs';
const out='docs/academy-paths-v2-captures';mkdirSync(out,{recursive:true});
const browser=await chromium.launch({headless:true,channel:'chrome'});
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:2400},deviceScaleFactor:2,reducedMotion:'reduce',hasTouch:width<768}),page=await context.newPage();
  await page.goto('http://127.0.0.1:4197/estudantes/');await page.evaluate(()=>document.fonts.ready);
  const reject=page.getByRole('button',{name:'Recusar',exact:true});if(await reject.isVisible())await reject.click();
  // Dedicated export context; the preview retains its navigation and controllers.
  await page.evaluate(()=>document.querySelectorAll('.atb,.sticky-cta,.skip-link').forEach(el=>el.remove()));
  await page.addStyleTag({content:'body.has-sticky::after{display:none!important}*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'});
  const book=page.locator('[data-enamed-book]');await book.scrollIntoViewIfNeeded();if(width>=768)await book.focus();
  await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='open');
  for(const [name,selector]of Object.entries({residence:'#residencia',banks:'[data-bank-gallery]',enamed:'#enamed',tools:'#ferramentas-academy',pro:'#pro',journey:'.study-cycle'})){
   await page.locator(selector).scrollIntoViewIfNeeded();await page.waitForTimeout(120);
   if(name==='enamed'&&width>=768){await page.mouse.move(0,0);await book.evaluate(el=>el.blur());await book.focus();await page.waitForFunction(()=>document.querySelector('[data-enamed-book]').dataset.state==='open');}
   await page.locator(selector).screenshot({path:`${out}/${name}-${width}.png`});
  }
  await page.locator('[data-enamed-book]').evaluate(el=>el.focus());await page.waitForTimeout(120);
  await page.locator('.academy-paths-v2').screenshot({path:`${out}/after-paths-${width}.png`});
  for(const name of ['paths','pro','journey']){const original=`.local-art/academy-paths-v2/before-${name}-${width}.png`;if(existsSync(original))copyFileSync(original,`${out}/before-${name}-${width}.png`);}
  await context.close();
 }
}finally{await browser.close();}
const rows=[390,1440].map(width=>`<h2>${width}px</h2>${['paths','pro','journey'].map(name=>`<section><h3>${name}</h3><div class="pair"><figure><figcaption>Antes</figcaption><a href="before-${name}-${width}.png"><img src="before-${name}-${width}.png" alt="Antes: ${name}"></a></figure><figure><figcaption>Depois</figcaption><a href="${name==='paths'?'after-paths':name}-${width}.png"><img src="${name==='paths'?'after-paths':name}-${width}.png" alt="Depois: ${name}"></a></figure></div></section>`).join('')}`).join('');
writeFileSync(`${out}/comparacao.html`,`<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Academy: capturas comparativas</title><style>body{margin:0;background:#fcfaf6;color:#09243b;font:16px/1.6 system-ui;padding:32px}main{max-width:1440px;margin:auto}h1{font-size:32px}h2{margin-top:60px}.pair{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:start}figure{margin:0}img{display:block;max-width:100%;height:auto;border:1px solid #dccdad}figcaption{margin:10px 0}a{color:inherit}@media(max-width:700px){.pair{grid-template-columns:1fr}}</style><main><h1>Academy: antes e depois</h1><p>Capturas reais do build local. Depois em DPR 2, com movimento reduzido e a pose final da estudante. Navegação fixa retirada somente neste contexto de exportação para não cobrir o conteúdo. Clique para examinar o PNG original. Não substitui validação em aparelho físico.</p>${rows}</main></html>`);
console.log('Exported comparable desktop and mobile captures to '+out);
