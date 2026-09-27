import fs from 'node:fs/promises';
import sharp from 'sharp';
import crypto from 'node:crypto';
const root='C:/Users/medic/Desktop/commit-v1-premium-backport/.local-demo/v1-atlas/tools-refresh';
const out='site/assets/academy/clinical-tools';await fs.mkdir(out,{recursive:true});
const captures=[{file:'tools-refresh__1024x2000_light__pro.png',name:'tablet',crop:{left:0,top:0,width:2048,height:1536},width:1440},{file:'tools-refresh__390x2600_light__free.png',name:'mobile',crop:{left:0,top:0,width:780,height:1400},width:780}];
const manifest=[];
for(const c of captures){const input=await fs.readFile(`${root}/${c.file}`);await sharp(input).extract(c.crop).resize({width:c.width}).webp({quality:92,effort:6}).toFile(`${out}/${c.name}.webp`);manifest.push({...c,sha256:crypto.createHash('sha256').update(input).digest('hex')});}
await fs.writeFile(`${out}/manifest.json`,JSON.stringify({capturedAt:new Date().toISOString(),source:'Current canonical app source via atlas_tools_refresh_capture_test.dart',captureType:'Flutter component runtime, synthetic account, no remote mutation',fontWarning:'Montserrat-Black cache warning; visible typography inspected',artifacts:manifest},null,2));
