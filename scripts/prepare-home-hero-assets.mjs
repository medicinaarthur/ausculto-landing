import sharp from 'sharp';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const source = new URL('../design/home-hero-v3/', import.meta.url);
const output = new URL('../site/assets/home/hero-v3/', import.meta.url);
await mkdir(output, {recursive:true});
const manifest = {version:5, generation:'Grounded artwork with original desktop captures projected deterministically over screen interiors at 4x scene coordinates. Physical frames and shadows retained. Desktop bottom strip cropped. Mobile artwork unchanged. Functional text remains HTML/SVG.', question:'HCPA 2024 / 74 / IZgMmZL68YM3a4eDCx2e', assets:[]};
const specs = [
  {name:'desktop-scene', widths:[1280,1672], formats:['avif','webp'], quality:80},
  {name:'desktop-screen-plantao', widths:[498,996], formats:['webp'], quality:95},
  {name:'desktop-screen-prova', widths:[476,952], formats:['webp'], quality:95},
  {name:'mobile-atmosphere', widths:[480,780,941], formats:['avif','webp'], quality:65},
  {name:'mobile-plantao', widths:[480,780,1170], formats:['avif','webp'], quality:80},
  {name:'mobile-prova', widths:[480,780,1170], formats:['avif','webp'], quality:80},
];
for (const spec of specs) {
  const bytes=await readFile(new URL(spec.name+'.png',source));
  const meta=await sharp(bytes).metadata();
  for (const width of spec.widths.filter(w=>w<=meta.width)) for (const format of spec.formats) {
    const name=`${spec.name}-${width}.${format}`;
    let pipeline=sharp(bytes);
    if(spec.name==='desktop-scene')pipeline=pipeline.extract({left:0,top:0,width:1672,height:866});
    pipeline=pipeline.resize({width,withoutEnlargement:true});
    pipeline=format==='avif'?pipeline.avif({quality:spec.quality,effort:6}):pipeline.webp({quality:spec.quality,effort:6,smartSubsample:true});
    const {data,info}=await pipeline.toBuffer({resolveWithObject:true});
    await writeFile(new URL(name,output),data);
    manifest.assets.push({file:name,width:info.width,height:info.height,bytes:data.length,sha256:createHash('sha256').update(data).digest('hex'),source:spec.name+'.png',sourceWidth:meta.width,sourceHeight:meta.height,sourceSha256:createHash('sha256').update(bytes).digest('hex'),crop:spec.name==='desktop-scene'?'0,0,1672,866; removed navy footer':'continuous source; see capture and screen projection provenance'});
  }
}
await writeFile(new URL('manifest.json',output),JSON.stringify(manifest,null,2)+'\n');
console.log(`Prepared ${manifest.assets.length} assets in ${fileURLToPath(output)}`);
for (const asset of manifest.assets) console.log(asset.file,Math.round(asset.bytes/1024)+' KB');
