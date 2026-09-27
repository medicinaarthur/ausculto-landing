import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
export const figureOverrides=JSON.parse(readFileSync(new URL('./data/academy-figure-overrides.json',import.meta.url),'utf8'));
const digest=b=>createHash('sha256').update(b).digest('hex');
export function publicAsset(url){return figureOverrides.derivatives.find(d=>d.oldUrl===url)?.url||url;}
export function validateFigureOverrides(presentation){
 for(const erratum of figureOverrides.errata){
  const a=presentation.articles.find(a=>a.summaryId===erratum.summaryId&&a.version===erratum.version);
  const b=a?.blocks.find(b=>b.id===erratum.blockId);
  if(!b||b.selectedTextSha256!==erratum.selectedTextSha256||digest(b.text)!==erratum.selectedTextSha256||!b.text.includes(erratum.from))throw Error('Presentation erratum source/version drift');
 }
 const brand=readFileSync(new URL('../site/assets/brand/ausculto-a-navy-240.png',import.meta.url));
 for(const d of figureOverrides.derivatives){
  if(!/^\/assets\/academy\/illustrations\/[a-z0-9-]+\.png$/.test(d.url))throw Error('Unsafe derivative asset');
  const bytes=readFileSync(new URL('../site'+d.url,import.meta.url));
  if(digest(bytes)!==d.sha256||digest(brand)!==d.watermarkSha256)throw Error('Flattened figure/brand drift');
  if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||!d.watermark.flattened)throw Error('Figure is not flattened PNG');
 }
}
export function presentationText(article,block){
 let text=block.text;
 for(const erratum of figureOverrides.errata.filter(e=>e.summaryId===article.summaryId&&e.blockId===block.id)){
  if(article.version!==erratum.version||block.selectedTextSha256!==erratum.selectedTextSha256)throw Error('Erratum source drift');
  text=text.replace(erratum.from,erratum.to).replace('Interpretação da gasometria arterial em 4 etapas e Ânion Gap.','Fluxograma de interpretação gasométrica: avaliação do pH, componentes metabólico e respiratório, compensação, ânion gap e distúrbios mistos.');
  text+='\n\nFluxograma vetorial original para esta leitura. Referências conceituais: '+erratum.references.map(r=>`[${r.label}](${r.url})`).join(' · ')+'.\n';
 }
 for(const d of figureOverrides.derivatives)text=text.replaceAll(d.oldUrl,d.url);
 return text;
}
