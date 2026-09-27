/** Export only published metadata and the three owner-authorized complete themes. */
import {readFileSync,writeFileSync,mkdirSync,renameSync} from 'node:fs';
import {resolve,dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const input=resolve(process.argv[2]||join(root,'.local-art/academy-source/snapshot.json'));
const sha=b=>createHash('sha256').update(b).digest('hex');
const source=JSON.parse(readFileSync(input,'utf8'));
const allowed=['abdome-agudo','disturbios-eletroliticos-e-acido-base','estudos-epidemiologicos'];
if(source.kind!=='published-source'||source.catalogueSha256!==sha(JSON.stringify(source.catalogue))||source.summaries.length!==allowed.length) throw Error('Invalid published snapshot');
const isEcg=s=>/^ecg-\d{2}-/.test(s.summaryId);
const result={schemaVersion:2,kind:'public-presentation',applicationPublicationChanged:false,
 source:{releaseId:source.releaseId,collectedAt:source.collectedAt,catalogueSha256:source.catalogueSha256,entryCount:source.catalogue.length,themeCount:source.catalogue.filter(s=>!isEcg(s)).length,ecgCount:source.catalogue.filter(isEcg).length},
 catalogue:source.catalogue.filter(s=>!isEcg(s)),ecgModules:source.catalogue.filter(isEcg),articles:[],assets:[]};
const bytesToWrite=new Map();
for(const s of source.summaries){
 const meta=source.catalogue.find(x=>x.summaryId===s.summaryId);
 if(!allowed.includes(s.summaryId)||!meta||s.version!==meta.version||s.releaseId!==source.releaseId||s.sourceBlocksSha256!==sha(JSON.stringify(s.blocks))||s.blocks.length!==s.sectionCount) throw Error('Published body mismatch');
 const assets=s.assets.map(a=>{
  const ext=/\.(png|jpg|jpeg|webp)$/.exec(a.storagePath)?.[1];
  if(!ext||a.id!==a.sha256||!/^[a-f0-9]{64}$/.test(a.id)) throw Error('Invalid asset');
  const bytes=readFileSync(join(dirname(input),'assets',a.sha256+'.'+ext));
  if(sha(bytes)!==a.sha256) throw Error('Asset drift');
  const url='/assets/academy/material/'+s.summaryId+'-'+a.sha256+'.'+ext;
  bytesToWrite.set(url,bytes);
  return {url,sha256:a.sha256,summaryId:s.summaryId,version:s.version};
 });
 const replace=text=>text.replace(/academy-asset:([a-f0-9]{64})/g,(_,hash)=>{
  const asset=assets.find(a=>a.sha256===hash);if(!asset)throw Error('Unbound image');return asset.url;
 });
 const blocks=s.blocks.map(b=>({...b,title:b.title||b.text.split('\n')[0].replace(/^#+\s*/,''),text:replace(b.text),sourceSha256:sha(b.text),selectedTextSha256:sha(replace(b.text))}));
 const ref=blocks.find(b=>/^Referências/i.test(b.title));
 result.articles.push({...meta,author:{type:'Organization',name:s.author},blocks,assets,
  sourceBlockHashes:s.blocks.map(b=>sha(b.text)),referencesMarkdown:ref?.text||'',referenceSha256:sha(ref?.text||'')});
 result.assets.push(...assets);
}
// Validate all inputs and bindings before replacing any public JSON or asset.
if(new Set(result.catalogue.concat(result.ecgModules).map(s=>s.summaryId)).size!==source.catalogue.length)throw Error('Duplicate identity');
for(const [url,bytes] of bytesToWrite){const target=join(root,'site'+url);mkdirSync(dirname(target),{recursive:true});writeFileSync(target,bytes);}
const output=join(root,'scripts/data/academy-presentation.json');
writeFileSync(output+'.next',JSON.stringify(result,null,2)+'\n');renameSync(output+'.next',output);
console.log(`Exported ${result.catalogue.length} themes, ${result.ecgModules.length} ECG modules, 3 full themes, ${result.assets.length} images (${source.releaseId}).`);
