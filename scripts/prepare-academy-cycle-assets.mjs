import fs from 'node:fs/promises';
import sharp from 'sharp';
const root='C:/Users/medic/.codex/generated_images/01a0e1db-9c32-7351-a3ac-8c0a62b523d5';
const ids=['080bccd2-0da8-4915-b00f-b8db2c38c6c6','9ea406ea-ceb1-491e-b366-3f85dce699b0','6f17d345-2809-4355-81a4-f493e358f928','32643d9a-18d3-41a4-b873-7891c87b6213'];
const out='site/assets/academy/study-cycle';
await fs.mkdir(out,{recursive:true});await fs.mkdir('.local-art/academy-refinement/masters',{recursive:true});
for(const [i,id] of ids.entries()){
 const source=`${root}/exec-${id}.png`,meta=await sharp(source).metadata();
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 console.log(i+1,meta.width,meta.height,'corner alpha',data[3],'body alpha',data[(700*info.width+500)*4+3]);
 if(data[3]>0)throw Error('Asset background must be transparent');
 await fs.copyFile(source,`.local-art/academy-refinement/masters/dr-aus-${i+1}.png`);
 // Preserve the native pixels and alpha. The character is displayed on high-DPR
 // screens; shrinking to 680px discarded detail before the browser could sample it.
 await sharp(source).webp({lossless:true,effort:6}).toFile(`${out}/pose-${i+1}.webp`);
}
await fs.writeFile(`${out}/manifest.json`,JSON.stringify({reference:'Inspected image.png',master:[1024,1536],poses:ids.map((id,i)=>({stage:i+1,source:`exec-${id}.png`,export:`pose-${i+1}.webp`}))},null,2));
