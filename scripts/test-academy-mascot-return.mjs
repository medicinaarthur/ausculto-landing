import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';

const out='.local-art/mascot-v3';
mkdirSync(out,{recursive:true});
const manifest=JSON.parse(readFileSync('site/assets/academy/dossier/mascot/manifest.json','utf8'));
const browser=await chromium.launch({channel:'chrome',headless:true});
const base=process.env.SITE_QA_URL||'http://127.0.0.1:4268';
const report=[];
try {
  // Real bank controls, with different idle phases before each pair of reactions.
  const context=await browser.newContext({viewport:{width:1550,height:960},
    recordVideo:{dir:out+'/recordings',size:{width:1550,height:960}}});
  const page=await context.newPage();
  await page.goto(base+'/estudantes/');
  await page.getByRole('button',{name:'Recusar',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]')?.dataset.state==='idle');
  const targets=['usp-sp','sus-sp','einstein','unifesp'];
  for(let i=0;i<targets.length;i++) {
    await page.waitForTimeout(i%2?700:180);
    const role=i%2?'surprise':'look';
    await page.locator(`[data-dossier-tab="${targets[i]}"]`).click();
    await page.waitForFunction(role=>document.querySelector('[data-dossier-mascot]').dataset.state===role,role);
    await page.waitForTimeout(150);
    const prepared=await page.locator('video[data-role="idle"]').evaluate(v=>({time:v.currentTime,paused:v.paused}));
    const entry=manifest.clips[role].transition.idleEntryTime;
    assert.ok(prepared.paused,'Hidden idle stays paused after seeking');
    assert.ok(Math.abs(prepared.time-entry)<1/48,`Idle prepared for ${role}`);
    await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]').dataset.state==='idle');
    const returned=Number(await page.locator('[data-dossier-mascot]').getAttribute('data-return-time'));
    assert.equal(returned,entry);
    report.push({role,prepared,entry,returned});
  }
  const video=page.video();
  await context.close();
  await video.saveAs(out+'/retorno-chrome.webm');

  for(const [width,dpr] of [[1200,1],[1366,1],[1440,1],[1440,2],[1440,3],[1920,1],[1920,3]]) {
    const p=await browser.newPage({viewport:{width,height:Math.ceil(width*992/1586)+80},deviceScaleFactor:dpr});
    await p.goto(base+'/estudantes/');
    await p.getByRole('button',{name:'Recusar',exact:true}).click();
    await p.evaluate(()=>document.fonts.ready);
    await p.waitForFunction(()=>document.querySelector('[data-dossier-mascot]')?.dataset.state==='idle');
    await p.locator('video[data-role="idle"]').evaluate(async v=>{
      v.pause(); await new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=.5;});
    });
    await p.screenshot({path:`${out}/after-${width}-dpr${dpr}.png`});
    if(width===1440&&dpr===1)await p.locator('[data-dossier-mascot]').screenshot({path:out+'/after-detail.png'});
    await p.close();
  }
  // Before uses exact backed-up bytes, in the same live page/browser/viewport.
  const before=await browser.newPage({viewport:{width:1440,height:981}});
  for(const [pattern,file,type] of [
    ['**/academy-mascot.js*',out+'/before/academy-mascot.js','text/javascript'],
    ['**/academy-mascot.css*',out+'/before/academy-mascot.css','text/css'],
  ])await before.route(pattern,r=>r.fulfill({body:readFileSync(file),contentType:type}));
  await before.route('**/mascot/*',r=>{
    const name=new URL(r.request().url()).pathname.split('/').pop();
    const body=readFileSync(out+'/before/assets/'+name);
    if(name.endsWith('.webm')) {
      const match=/bytes=(\d+)-(\d*)/.exec(r.request().headers().range||'');
      const start=match?Number(match[1]):0,end=match?.[2]?Number(match[2]):body.length-1;
      return r.fulfill({status:match?206:200,body:body.subarray(start,end+1),contentType:'video/webm',
        headers:{'Accept-Ranges':'bytes','Content-Length':String(end-start+1),...(match?{'Content-Range':`bytes ${start}-${end}/${body.length}`}:{})}});
    }
    return r.fulfill({body,contentType:name.endsWith('.png')?'image/png':'application/json'});
  });
  await before.goto(base+'/estudantes/');
  await before.getByRole('button',{name:'Recusar',exact:true}).click();
  await before.evaluate(()=>document.fonts.ready);
  await before.waitForFunction(()=>document.querySelector('[data-dossier-mascot]')?.dataset.state==='idle');
  await before.locator('video[data-role="idle"]').evaluate(async v=>{
    v.pause();await new Promise(r=>{v.addEventListener('seeked',r,{once:true});v.currentTime=.5;});
  });
  await before.screenshot({path:out+'/before-1440-dpr1.png'});
  await before.close();
  console.log('PASS: prepared pose-specific idle entries, four real reactions, Chrome video and DPR atlas');
} finally {
  writeFileSync(out+'/return-report.json',JSON.stringify(report,null,2)+'\n');
  await browser.close();
}
