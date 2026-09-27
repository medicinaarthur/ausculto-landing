import sharp from 'sharp';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {bankMarkSources,bankHeroMark} from './academy-bank-marks.mjs';
import correctionAssets from './data/academy-correction-assets.json' with {type:'json'};
const root='site/assets/academy/banks/',files=[];
for(const [id,source] of Object.entries(bankMarkSources)){
 const filename=bankHeroMark(id),raw=readFileSync(root+source);
 // Remove transparent padding only; preserve every visible contour of the authentic mark.
 await sharp(raw).trim({threshold:1}).resize({width:180,height:110,fit:'inside',withoutEnlargement:true}).webp({lossless:true,effort:6}).toFile(root+filename);
 files.push({id,source,sourceSha256:createHash('sha256').update(raw).digest('hex'),filename,bytes:readFileSync(root+filename).length});
}
writeFileSync(root+'hero-marks-manifest.json',JSON.stringify(files,null,2)+'\n');console.log(files);
const masks=[];
for(const bank of correctionAssets.banks){
 const source='site'+bank.goldMarkUrl,raw=readFileSync(source);
 const filename=source.replace(/\.svg$/,'.webp');
 // These SVGs contain the authentic cropped bitmap. CSS consumes only alpha.
 const {data,info}=await sharp(raw).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4)data[i]=data[i+1]=data[i+2]=255;
 await sharp(data,{raw:info}).webp({lossless:true,effort:6}).toFile(filename);
 masks.push({label:bank.label,source,sourceSha256:createHash('sha256').update(raw).digest('hex'),filename,bytes:readFileSync(filename).length});
}
writeFileSync(root+'gold-masks-manifest.json',JSON.stringify(masks,null,2)+'\n');console.log(masks);
