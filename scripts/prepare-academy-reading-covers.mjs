import sharp from 'sharp';
import {writeFileSync} from 'node:fs';
const entries=[];
for(const key of ['abdome','gasometria','epidemiologia']){
 const source=`site/assets/academy/book-${key}-closed.webp`;
 const {data,info}=await sharp(source).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let left=info.width,top=info.height,right=0,bottom=0;
 for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>16){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 const crop={left,top,width:right-left+1,height:bottom-top+1};
 const target=`site/assets/academy/book-${key}-cover.webp`;
 await sharp(source).extract(crop).resize({height:640,withoutEnlargement:true}).webp({quality:94,alphaQuality:100,effort:6}).toFile(target);
 entries.push({source,target,crop,...await sharp(target).metadata()});
}
writeFileSync('site/assets/academy/reading-covers-manifest.json',JSON.stringify(entries,null,2)+'\n');
console.log(entries.map(({target,crop})=>({target,crop})));
