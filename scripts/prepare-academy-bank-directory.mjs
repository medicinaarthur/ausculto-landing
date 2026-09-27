import sharp from 'sharp';
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve,basename} from 'node:path';
import {createHash} from 'node:crypto';
const appRoot=resolve(process.argv[2]||'../commit-v1-premium-backport');
const source=JSON.parse(readFileSync(resolve(appRoot,'assets/residency/bancas/manifest.json'),'utf8'));
const records=[];
for(const [name,item]of Object.entries(source.bancas)){
 const raw=readFileSync(resolve(appRoot,item.asset)),filename=`directory-${basename(item.asset,'.png')}.webp`;
 await sharp(raw).trim({threshold:1}).resize({width:210,height:126,fit:'inside',withoutEnlargement:true}).webp({quality:92,alphaQuality:100,effort:6}).toFile('site/assets/academy/banks/'+filename);
 records.push({name,institution:item.instituicao,url:'/assets/academy/banks/'+filename,source:item.asset,sha256:createHash('sha256').update(raw).digest('hex')});
}
writeFileSync('scripts/data/academy-bank-directory.json',JSON.stringify(records,null,2)+'\n');
console.log(`Prepared ${records.length} authentic app marks; app source read only.`);
