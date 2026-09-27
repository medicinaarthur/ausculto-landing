import {chromium, firefox, webkit} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync, writeFileSync} from 'node:fs';
import sharp from 'sharp';
const engine=process.env.MASCOT_BROWSER||'chromium';
const browser=await ({chromium,firefox,webkit}[engine]).launch(engine==='chromium'?{channel:'chrome',headless:true}:{headless:true});
const base=process.env.SITE_QA_URL||'http://127.0.0.1:4268';
const output='.local-art/mascot';
mkdirSync(output,{recursive:true});
const report={engine,checks:[],errors:[]};
async function open(options={}) {
  const page=await browser.newPage({viewport:{width:1440,height:1000},...options});
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto(base+'/estudantes/');
  await page.evaluate(()=>document.fonts.ready);
  return page;
}
async function state(page,value) {
  await page.waitForFunction(value=>document.querySelector('[data-dossier-mascot]')?.dataset.state===value,value);
}
const pass=name=>{report.checks.push(name);console.log('PASS:',name);};
try {
  const page=await open();
  await page.locator('[data-dossier]').waitFor();
  assert.equal(await page.locator('[data-dossier-mascot]').count(),1,'Desktop mounts one mascot');
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='idle');
  await page.evaluate(()=>{
    window.mascotFrameAudit={frames:0,empty:0,unready:0,still:0};
    const audit=()=>{
      const layer=document.querySelector('[data-dossier-mascot]');
      const video=[...layer.querySelectorAll('video')].find(v=>!v.hidden);
      const a=window.mascotFrameAudit;a.frames++;if(!video)a.empty++;else if(video.readyState<2)a.unready++;
      if(!layer.querySelector('img').hidden)a.still++;
      window.mascotAuditFrame=requestAnimationFrame(audit);
    };audit();
  });
  await page.locator('[data-dossier-tab="usp-sp"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='look');
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='idle');
  await page.locator('[data-dossier-tab="sus-sp"]').click();
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='surprise');
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='idle');
  assert.equal(await page.locator('[data-dossier-mascot]').getAttribute('data-changes'),'2');
  const frames=await page.evaluate(()=>{cancelAnimationFrame(window.mascotAuditFrame);return window.mascotFrameAudit;});
  assert.ok(frames.frames>20);assert.equal(frames.empty+frames.unready+frames.still,0);
  report.frameAudit=frames;
  await page.locator('[data-dossier-tab="sus-sp"]').click();
  assert.equal(await page.locator('[data-dossier-mascot]').getAttribute('data-changes'),'2');
  pass('committed changes alternate look/surprise and return to idle; same bank does not count');
  assert.ok(await page.locator('.dossier-mascot video').evaluateAll(videos=>videos.length===3&&videos.every(v=>v.muted&&v.defaultMuted&&v.playsInline&&!v.controls)));
  // Actual frames and alpha in the browser, not only the VP9 metadata.
  assert.ok(await page.locator('.dossier-mascot video[data-role=idle]').evaluate(v=>{
    const c=document.createElement('canvas');c.width=360;c.height=640;const ctx=c.getContext('2d');ctx.drawImage(v,0,0,360,640);
    // YUVA conversion can quantize transparent zero to 1/255.
    return ctx.getImageData(0,0,1,1).data[3]<=2&&ctx.getImageData(180,300,1,1).data[3]>240;
  }));
  pass('three muted inline videos; transparent corner and opaque character decoded');
  await page.evaluate(()=>scrollTo(0,document.querySelector('[data-dossier]').offsetHeight+150));
  await state(page,'still');
  assert.ok(await page.locator('.dossier-mascot video').evaluateAll(v=>v.every(x=>x.paused)));
  await page.evaluate(()=>scrollTo(0,0));await state(page,'idle');
  pass('offscreen pauses every decoder and returning resumes idle');
  await page.emulateMedia({reducedMotion:'reduce'});await state(page,'still');
  await page.locator('[data-dossier-tab="einstein"]').click();
  assert.equal(await page.locator('[data-dossier-mascot]').getAttribute('data-state'),'still');
  await page.emulateMedia({reducedMotion:'no-preference'});await state(page,'idle');
  pass('reduced motion suppresses reactions and resumes cleanly');
  await page.setViewportSize({width:390,height:844});
  assert.equal(await page.locator('[data-dossier-mascot]').count(),0);
  await page.setViewportSize({width:1440,height:1000});await state(page,'idle');
  assert.equal(await page.locator('.dossier-mascot video').count(),3);
  pass('crossing breakpoint removes the layer and remounts without duplicates');
  await page.close();

  // Constant normalized geometry proves resizing does not move independent
  // layers. Includes a viewport-height-only change and the exact desktop edge.
  const layout=await open({reducedMotion:'reduce'});let reference;
  for(const width of [1920,1440,1366,1200]) {
    await layout.setViewportSize({width,height:900});
    await layout.waitForTimeout(80);
    const geometry=await layout.evaluate(()=>{
      const root=document.querySelector('[data-dossier]'),hero=root.getBoundingClientRect();
      const rect=s=>{const r=root.querySelector(s).getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
      return{hero:{w:hero.width,h:hero.height},book:rect('.dossier-book'),tabs:rect('.dossier-tabs'),mascot:rect('.dossier-mascot'),copy:rect('.dossier-copy')};
    });
    assert.ok(Math.abs(geometry.hero.w/geometry.hero.h-1586/992)<.001);
    assert.ok(geometry.mascot.x>geometry.tabs.right);
    assert.ok(geometry.mascot.x>geometry.book.right);
    assert.ok(geometry.mascot.right<width&&geometry.mascot.bottom<geometry.hero.h);
    const normalized=Object.fromEntries(['book','tabs','mascot','copy'].flatMap(k=>['x','y','w','h'].map(v=>[k+'.'+v,geometry[k][v]/width])));
    if(reference)for(const key of Object.keys(normalized))assert.ok(Math.abs(normalized[key]-reference[key])<.0001,`${width}: drift in ${key}`);
    reference=normalized;
    await layout.locator('[data-dossier]').screenshot({path:`${output}/${engine}-desktop-${width}.png`});
  }
  await layout.setViewportSize({width:1200,height:700});
  const heroHeight=await layout.locator('[data-dossier]').evaluate(e=>e.getBoundingClientRect().height);
  assert.ok(Math.abs(heroHeight-1200*992/1586)<.1);
  pass('1920/1440/1366/1200: intrinsic ratio, stable coordinates, no mascot overlaps; viewport height independent');
  await layout.close();

  for(const width of [390,767,768,1199]) {
    const mobile=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
    const requested=[];mobile.on('request',r=>requested.push(r.url()));
    await mobile.goto(base+'/estudantes/');await mobile.evaluate(()=>document.fonts.ready);
    assert.equal(await mobile.locator('[data-dossier-mascot]').count(),0);
    assert.equal(requested.some(url=>url.includes('/dossier/mascot/')),false);
    const image=await mobile.locator('[data-dossier]').screenshot({path:`${output}/${engine}-unchanged-${width}.png`});
    if(engine==='chromium'&&[390,768].includes(width)) {
      const a=await sharp(`${output}/before-${width}.png`).raw().toBuffer();
      const b=await sharp(image).raw().toBuffer();assert.equal(a.length,b.length);
      if(width===390) assert.ok(a.equals(b),'390: mobile baseline differs');
      else {
        // The rotated tablet book can take a different GPU sampling path after
        // desktop resizes. Bound that raster-only noise; geometry is unchanged.
        let delta=0;for(let i=0;i<a.length;i++)delta+=Math.abs(a[i]-b[i]);
        report.tabletMeanChannelDifference=delta/a.length;
        assert.ok(delta/a.length<.1,'768: material visual difference');
      }
    }
    await mobile.close();
  }
  pass('390/767/768/1199: no layer or media requests'+(engine==='chromium'?'; mobile pixel-identical; tablet raster difference <0.1/255':''));

  const failure=await browser.newPage({viewport:{width:1440,height:1000}});
  await failure.route('**/mascot/*.webm',r=>r.abort());
  await failure.goto(base+'/estudantes/');
  await failure.locator('.dossier-mascot img').waitFor();
  await failure.locator('[data-dossier-tab="usp-sp"]').click();
  await failure.waitForFunction(()=>document.querySelector('[data-dossier]').dataset.bank==='usp-sp');
  assert.equal(await failure.locator('.dossier-mascot img').isVisible(),true);
  await failure.close();pass('failed video requests retain static character and working bank selector');
  assert.deepEqual(report.errors,[]);
} finally {
  await browser.close();
  writeFileSync(`${output}/${engine}-runtime-report.json`,JSON.stringify(report,null,2)+'\n');
}
