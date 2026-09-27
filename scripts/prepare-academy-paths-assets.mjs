import sharp from 'sharp';
import {readFileSync,writeFileSync,mkdirSync,copyFileSync,existsSync}from 'node:fs';
import {createHash}from 'node:crypto';
import {resolve}from 'node:path';
const root='site/assets/academy/paths-v2',masters='art-source/academy-paths-v2';
mkdirSync(root,{recursive:true});mkdirSync(masters,{recursive:true});
const app='../commit-v1-premium-backport/assets/branding/premium_v2/';
const inputs=[
 ['residency-doctor','C:/Users/medic/Downloads/DRJASSONIO.png',[640,1280]],
 ['scroll-hand','C:/Users/medic/Downloads/mao.png',[400,800]],
 ['enamed-closed','C:/Users/medic/Downloads/ChatGPT Image Sep 27, 2026, 05_46_06 PM.png',[640,1280]],
 ['tools-screen','C:/Users/medic/Desktop/AUSCULTO-atlas-rotas/desktop/ferramentas/hub__light.png',[900,1800]],
 ...[['protocolos','protocolos'],['semiologia','semiologia'],['cid','cid10'],['exames','exames'],['calculadoras','calculadoras'],['ausflow','ausflow_2026_09'],['ausmind','ausmind_2026_09']].map(([name,file])=>['icon-'+name,app+'clinical_tool_icon_'+file+'.png',[160,320]])
];
const generated='art-source/academy-paths-v2/generated-inputs.json';
if(existsSync(generated))inputs.push(...Object.entries(JSON.parse(readFileSync(generated,'utf8'))).map(([name,file])=>[name,file,name==='pro-background'?[1000,2000]:[900,1800]]));
const manifest={preparedAt:new Date().toISOString(),generation:'Built-in imagegen; generated prompts in prompts.md',files:[]};
for(const [name,file,widths]of inputs){
 const restored=existsSync(file)?file:resolve(masters,name+'.png');
 const bytes=readFileSync(restored),meta=await sharp(bytes).metadata();
 const master=resolve(masters,name+'.png');if(resolve(restored)!==master)copyFileSync(restored,master);
 for(const width of widths){
  const filename=name+'-'+width+'.webp',target=root+'/'+filename;
  await sharp(bytes).resize({width,withoutEnlargement:true}).webp({quality:94,alphaQuality:100,effort:6}).toFile(target);
  const output=readFileSync(target),dimensions=await sharp(output).metadata();
  manifest.files.push({filename,width:dimensions.width,height:dimensions.height,alpha:dimensions.hasAlpha,bytes:output.length,sha256:createHash('sha256').update(output).digest('hex'),masterSha256:createHash('sha256').update(bytes).digest('hex'),source:file});
 }
}
writeFileSync(root+'/asset-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log('Prepared '+manifest.files.length+' responsive assets; source pixels retained in masters.');
