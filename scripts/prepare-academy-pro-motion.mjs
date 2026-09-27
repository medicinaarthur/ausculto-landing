import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const sources=['1.png','3.png','4.png','5 (2).png'];
const directory='site/assets/academy/pro-motion';
await fs.mkdir(directory,{recursive:true});
const manifest=[];
for(const [i,name] of sources.entries()){
 const source=path.join('C:/Users/medic/Downloads',name),input=await fs.readFile(source);
 const metadata=await sharp(input).metadata();
 for(const [suffix,width] of [['',900],['-m',480]])await sharp(input).resize({width}).webp({quality:88,alphaQuality:100,effort:6}).toFile(`${directory}/pose-${i+1}${suffix}.webp`);
 if(!metadata.hasAlpha)throw Error('Sequence asset needs transparency: '+source);
 manifest.push({order:i+1,source,edit:'None',holdMs:[1600,220,220,2400][i],sha256:crypto.createHash('sha256').update(input).digest('hex'),width:metadata.width,height:metadata.height,alpha:metadata.hasAlpha});
}
await fs.writeFile(`${directory}/manifest.json`,JSON.stringify({description:'Original poses, sequence requested by user. Lossy WebP export only; source pixels and alpha retained. Color matching is applied non-destructively with CSS.',poses:manifest},null,2)+'\n');
console.log(manifest);
