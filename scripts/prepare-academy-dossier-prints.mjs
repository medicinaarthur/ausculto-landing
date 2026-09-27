import sharp from 'sharp';
import {readFileSync,writeFileSync,existsSync,copyFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import config from './data/academy-dossier-prints.json' with {type:'json'};
import dossiers from './data/academy-dossiers.json' with {type:'json'};
import {dossierPrintCopyHash} from './academy-print-contract.mjs';
const masters='.local-art/academy-dossier/masters',out='site/assets/academy/dossier';
mkdirSync(masters,{recursive:true});mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const manifest={generator:config.generator,revision:config.revision,files:[]};
for(const e of config.entries){
 const bank=dossiers.banks.find(b=>b.id===e.id);
 const copyHash=dossierPrintCopyHash(bank);
 if(copyHash!==e.copyHash||!e.visuallyReviewed)throw Error(`Printed copy needs regeneration/review: ${e.id} ${e.layout}`);
 const stem=`print-${e.id}-${e.layout}`,master=join(masters,stem+'.png');
 const generated=join(config.generatedDirectory,e.generatedFile);
 if(existsSync(generated))copyFileSync(generated,master);
 const meta=await sharp(master).metadata();
 const file=join(out,stem+'.webp');
 await sharp(master).resize({width:Math.min(meta.width,e.layout==='mobile'?1080:1800),withoutEnlargement:true}).webp({quality:90,effort:6}).toFile(file);
 const b=readFileSync(file);manifest.files.push({id:e.id,layout:e.layout,filename:stem+'.webp',nativeWidth:meta.width,nativeHeight:meta.height,bytes:b.length,sha256:sha(b),masterSha256:sha(readFileSync(master))});
}
writeFileSync(join(out,'print-manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log(manifest.files);
