import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
  for(const [width,dpr] of [[1440,1],[1440,2],[1440,3],[1920,3],[1254,1]]) {
    const page=await browser.newPage({viewport:{width,height:1000},deviceScaleFactor:dpr});
    if(process.env.MASCOT_OLD_COLOR==='1')await page.route('**/mascot/surprise*.webm',route=>route.fulfill({
      contentType:'video/webm',body:readFileSync('.local-art/mascot-v2/before/site/assets/academy/dossier/mascot/surprise.webm'),
    }));
    const requests=[];page.on('request',r=>{if(r.url().includes('/mascot/')&&r.url().endsWith('.webm'))requests.push(r.url());});
    await page.goto((process.env.SITE_QA_URL||'http://127.0.0.1:4268')+'/estudantes/');
    await page.waitForFunction(()=>document.querySelector('[data-dossier-mascot]')?.dataset.state==='idle'&&[...document.querySelectorAll('.dossier-mascot video')].every(v=>v.readyState>=2));
    const samples=await page.evaluate(async()=>{
      const samples={};
      for(const video of document.querySelectorAll('.dossier-mascot video')) {
        video.pause();
        if(video.currentTime!==0)await new Promise(resolve=>{video.addEventListener('seeked',resolve,{once:true});video.currentTime=0;});
        const canvas=document.createElement('canvas');canvas.width=360;canvas.height=640;
        const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(video,0,0,360,640);
        const data=ctx.getImageData(116,240,100,133).data,colors=[[],[],[]];
        for(let i=0;i<data.length;i+=4)if(data[i+3]>250&&data[i+2]>data[i]*1.6&&data[i+2]>data[i+1]*1.2)
          for(let c=0;c<3;c++)colors[c].push(data[i+c]);
        const rgb=colors.map(v=>v.sort((a,b)=>a-b)[Math.floor(v.length/2)]);
        samples[video.dataset.role]={rgb,videoWidth:video.videoWidth,src:video.currentSrc};
      }
      return samples;
    });
    for(const role of ['look','surprise'])for(let c=0;c<3;c++)
      assert.ok(Math.abs(samples[role].rgb[c]-samples.idle.rgb[c])<=12,`${role} changes scrub color at DPR ${dpr}: ${samples[role].rgb} versus idle ${samples.idle.rgb}`);
    const physicalWidth=await page.locator('.dossier-mascot').evaluate(e=>e.getBoundingClientRect().width*devicePixelRatio);
    const expected=physicalWidth<=180?180:physicalWidth<=360?360:540;
    assert.ok(Object.values(samples).every(s=>s.videoWidth===expected));
    assert.equal(new Set(requests).size,3,'Only one resolution per clip is downloaded');
    results.push({width,dpr,physicalWidth,samples});
    await page.close();
  }
  console.log('PASS: consistent decoded colors and one correctly sized tier across DPR 1/2/3');
} finally {
  await browser.close();
  mkdirSync('.local-art/mascot-v2',{recursive:true});
  writeFileSync('.local-art/mascot-v2/browser-color-report.json',JSON.stringify(results,null,2)+'\n');
}
