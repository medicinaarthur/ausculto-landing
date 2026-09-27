import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync,readdirSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
const dir=resolve('site/assets/academy/dossier'),masters=resolve('.local-art/academy-dossier/masters');
mkdirSync(dir,{recursive:true});mkdirSync(masters,{recursive:true});
const generated='C:/Users/medic/.codex/generated_images/01a0e1db-9c32-7351-a3ac-8c0a62b523d5';
const files={'calendar-frame':'exec-0576e056-6888-4fab-baef-fed33b0e3315.png',leaf:'exec-03024bdf-43cd-4265-9087-bfc31aebf596.png',desktop:'exec-62644816-9771-4253-87bf-9af47af4794e.png',mobile:'exec-cb773661-66ce-4da0-a634-ae1f76db034b.png',book:'exec-73b63642-8ae4-4844-a453-7728721e8cbd.png',engraving:'exec-52237457-951c-4762-a0f2-74ed13860d13.png'};
const manifest={createdAt:'2026-09-27',generator:'Built-in image_gen',sources:{},files:{}};
const digest=b=>createHash('sha256').update(b).digest('hex');
for(const [name,file] of Object.entries(files)){
 const target=join(masters,name+'.png');if(!existsSync(target))copyFileSync(join(generated,file),target);
 const meta=await sharp(target).metadata();manifest.sources[name]={width:meta.width,height:meta.height,alpha:meta.hasAlpha,sha256:digest(readFileSync(target))};
 if(name==='calendar-frame'){
  await sharp(target).trim({threshold:5}).webp({quality:88,alphaQuality:100}).toFile(join(dir,'calendar-frame.webp'));
 }else if(name==='engraving'){
  await sharp(target).resize({width:400,withoutEnlargement:true}).webp({quality:76,alphaQuality:85}).toFile(join(dir,'engraving.webp'));
 }else if(name==='leaf'){
  await sharp(target).trim({threshold:5}).resize({width:720,withoutEnlargement:true}).webp({quality:70,alphaQuality:100}).toFile(join(dir,'leaf.webp'));
 }else if(name==='book'){
  // Discard only fully transparent outer padding. Keep the leather rim and paper block intact.
  await sharp(target).trim({threshold:5}).resize({width:1440,withoutEnlargement:true}).webp({quality:83,alphaQuality:100}).toFile(join(dir,'book.webp'));
 }else for(const width of name==='mobile'?[540,780,1080]:[1280,1600,1920]){
  // Never upscale a generated master. The filename records the actual exported width.
  if(width>meta.width&&width!==(name==='mobile'?1080:1920))continue;
  const w=Math.min(width,meta.width);
  for(const format of ['avif','webp'])await sharp(target).resize({width:w}).toFormat(format,{quality:format==='avif'?47:72,effort:4}).toFile(join(dir,`${name}-${w}.${format}`));
 }
}
for(const file of readdirSync(dir)){if(!/\.(webp|avif)$/.test(file))continue;const b=readFileSync(join(dir,file));manifest.files[file]={bytes:b.length,sha256:digest(b)};}
writeFileSync(join(dir,'asset-manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(manifest,null,2));
