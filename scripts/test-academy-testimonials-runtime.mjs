import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
mkdirSync('.local-art/resources/qa/testimonials',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const width of [390,1440]){
  const p=await browser.newPage({viewport:{width,height:900}});const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4196/estudantes/');
  const consent=p.locator('[data-consent-choice=denied]');if(await consent.isVisible())await consent.click();
  const root=p.locator('[data-academy-testimonials]');await root.scrollIntoViewIfNeeded();await p.evaluate(()=>document.fonts.ready);
  await root.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
  const first=await root.locator('.is-active figcaption strong').innerText();
  await root.hover();await p.waitForFunction(name=>document.querySelector('.at-slide.is-active figcaption strong')?.textContent!==name,first,{timeout:9000});
  assert.equal(await root.locator('[aria-hidden=false]').count(),1);
  await p.emulateMedia({reducedMotion:'reduce'});await root.locator('[data-testimonial-dot]').last().click();
  assert.equal(await root.locator('[data-testimonial-dot]').last().getAttribute('aria-pressed'),'true');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await p.screenshot({path:`.local-art/resources/qa/testimonials/${width}.png`});assert.deepEqual(errors,[]);await p.close();
 }
 console.log('Testimonial autoplay on hover, selectors, reduced motion and responsive layout passed.');
}finally{await browser.close();}
