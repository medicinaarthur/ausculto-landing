// Deterministic rendering of existing native compositions and the new vector flow.
// Original editorial bitmaps are not redrawn. Brand marks are flattened in PNGs.
import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
const root=resolve('.'),privateDir=root+'/.local-art/correction-20260927/figures';mkdirSync(privateDir,{recursive:true});
const dest=root+'/site/assets/academy/illustrations';mkdirSync(dest,{recursive:true});
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
const data=JSON.parse(readFileSync(root+'/scripts/data/academy-presentation.json'));
const figures=JSON.parse(readFileSync(root+'/scripts/data/academy-illustrations.json'));
const brand=readFileSync(root+'/site/assets/brand/ausculto-a-navy-240.png');
const serif=readFileSync(root+'/site/assets/fonts/home/dm-serif-display-400-latin.woff2').toString('base64');
const sans=readFileSync(root+'/site/assets/fonts/enamed/montserrat-var-latin.woff2').toString('base64');
const svg=[];
const text=(x,y,lines,size=27,color='#001a3d',anchor='middle',weight=400)=>`<text x="${x}" y="${y}" fill="${color}" text-anchor="${anchor}" font-family="Montserrat,Arial,sans-serif" font-size="${size}" font-weight="${weight}">${lines.map((line,i)=>`<tspan x="${x}" dy="${i?size*1.5:0}">${line.replaceAll('&','&amp;').replaceAll('<','&lt;')}</tspan>`).join('')}</text>`;
const box=(x,y,w,h,title,lines,{dark=false}={})=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="${dark?'#001a3d':'#ffffff'}" stroke="${dark?'#001a3d':'#d8dfe9'}" stroke-width="2"/>${text(x+w/2,y+43,[title],29,dark?'#ffffff':'#001a3d','middle',700)}${text(x+w/2,y+85,lines,25,dark?'#c6d4e8':'#415675')}`;
const edge=(d)=>`<path d="${d}" fill="none" stroke="#a77420" stroke-width="3" marker-end="url(#arrow)"/>`;
svg.push(`<svg xmlns="http://www.w3.org/2000/svg" width="1500" height="2040" viewBox="0 0 1500 2040"><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#a77420"/></marker><style>@font-face{font-family:Montserrat;src:url(data:font/woff2;base64,${sans})}@font-face{font-family:DMSerif;src:url(data:font/woff2;base64,${serif})}</style></defs><rect width="1500" height="2040" fill="#fdfaf7"/><rect width="1500" height="170" fill="#001a3d"/><rect y="170" width="1500" height="5" fill="#e7b64d"/>${text(65,52,['AUSCULTO ACADEMY · RACIOCÍNIO ÁCIDO-BASE'],18,'#e7b64d','start',700)}<text x="65" y="117" fill="white" font-family="DMSerif,Georgia,serif" font-size="49">Roteiro gasométrico canônico</text>${text(65,149,['Percorra todas as etapas; o pH isolado não encerra a interpretação.'],22,'#bdcbe0','start')}`);
svg.push(box(350,215,800,120,'1 · Valide a amostra e os valores',['Correlacione gasometria, eletrólitos e contexto clínico.'],{dark:true}));
svg.push(edge('M750 335V365'),box(480,375,540,112,'2 · Qual é o pH?',['Compare com a faixa de 7,35 a 7,45.']));
svg.push(edge('M750 487V515H265V548'),edge('M750 487V548'),edge('M750 487V515H1235V548'));
svg.push(box(65,558,400,185,'pH < 7,35 · Acidemia',['HCO₃⁻ ↓ → metabólico','PaCO₂ ↑ → respiratório']),box(550,558,400,185,'pH 7,35–7,45',['Não exclui distúrbio misto.','Examine PaCO₂ e HCO₃⁻.']),box(1035,558,400,185,'pH > 7,45 · Alcalemia',['HCO₃⁻ ↑ → metabólico','PaCO₂ ↓ → respiratório']));
svg.push(edge('M265 743V780H750V812'),edge('M750 743V812'),edge('M1235 743V780H750V812'));
svg.push(box(300,822,900,157,'3 · Relacione PaCO₂ e HCO₃⁻',['Identifique o processo primário e alterações associadas.','As direções acima sugerem componentes, não diagnóstico isolado.'],{dark:true}));
svg.push(edge('M750 979V1012'),box(300,1022,900,165,'4 · Compare a compensação esperada',['Use a regra do distúrbio primário e o tempo de evolução.','Compensação fora do esperado → procure outro distúrbio.']));
svg.push(edge('M750 1187V1220'),box(300,1230,900,156,'5 · Há acidose metabólica?',['Se houver, calcule o ânion gap (AG).','Considere albumina e o intervalo de referência do laboratório.']));
svg.push(edge('M750 1386V1412H370V1445'),edge('M750 1386V1412H1130V1445'));
svg.push(box(65,1455,610,153,'AG elevado',['Compare ΔAG com a queda do HCO₃⁻.','Investigue componente metabólico adicional.']),box(825,1455,610,153,'Sem AG elevado / sem acidose',['Mantenha a análise da compensação.','Integre as alterações e o contexto clínico.']));
svg.push(edge('M370 1608V1637H750V1668'),edge('M1130 1608V1637H750V1668'));
svg.push(box(300,1678,900,155,'6 · Integre a interpretação',['Distúrbio simples ou misto? Os dados são coerentes?','Não descarte distúrbios apenas porque o pH está na faixa normal.'],{dark:true}));
svg.push(text(65,1910,['AG = Na⁺ − (Cl⁻ + HCO₃⁻) · Use eletrólitos da mesma avaliação.'],24,'#415675','start'),text(65,1950,['Esquema educacional original · Referências conceituais: ATS e Merck Manual.'],21,'#415675','start'),text(65,1986,['Sem condutas terapêuticas. Detalhes e fórmulas: consulte o texto e as referências.'],21,'#415675','start'),'</svg>');
const flow=Buffer.from(svg.join(''));writeFileSync(privateDir+'/gasometria-fluxograma-source.svg',flow);
const jobs=figures.map(f=>({id:f.id,source:readFileSync(root+'/.local-art/site-lapidacao-20260927/academic-figures/'+f.id+'-master.png'),mime:'image/png',oldUrl:f.oldUrl||f.url}));
for(const a of data.articles.filter(a=>a.summaryId!=='disturbios-eletroliticos-e-acido-base'))jobs.push({id:a.summaryId+'-material',source:readFileSync(root+'/site'+a.assets[0].url),mime:'image/png',oldUrl:a.assets[0].url});
jobs.push({id:'gasometria-fluxograma',source:flow,mime:'image/svg+xml',oldUrl:data.articles.find(a=>a.summaryId==='disturbios-eletroliticos-e-acido-base').assets[0].url});
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
const page=await browser.newPage();const derivatives=[];
try{for(const job of jobs){
 const rendered=await page.evaluate(async({source,mime,brand})=>{
  const load=src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;});
  const img=await load(`data:${mime};base64,${source}`),mark=await load('data:image/png;base64,'+brand);
  const canvas=document.createElement('canvas');canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0);
  const w=canvas.width*.2,h=w*mark.naturalHeight/mark.naturalWidth;ctx.globalAlpha=.085;ctx.drawImage(mark,(canvas.width-w)/2,(canvas.height-h)/2,w,h);
  const sw=canvas.width*.055,sh=sw*mark.naturalHeight/mark.naturalWidth;ctx.globalAlpha=.42;ctx.drawImage(mark,canvas.width-sw-canvas.width*.025,canvas.height-sh-canvas.width*.025,sw,sh);ctx.globalAlpha=1;
  return {width:canvas.width,height:canvas.height,png:canvas.toDataURL('image/png').split(',')[1]};
 },{source:job.source.toString('base64'),mime:job.mime,brand:brand.toString('base64')});
 const bytes=Buffer.from(rendered.png,'base64'),sha=hash(bytes),url='/assets/academy/illustrations/'+job.id+'-'+sha.slice(0,16)+'.png';writeFileSync(root+'/site'+url,bytes);
 const derivative={id:job.id,url,sha256:sha,masterSha256:hash(job.source),watermarkSha256:hash(brand),width:rendered.width,height:rendered.height,oldUrl:job.oldUrl,watermark:{flattened:true,central:{widthFraction:.2,opacity:.085},corner:{widthFraction:.055,opacity:.42}}};derivatives.push(derivative);
 const f=figures.find(f=>f.id===job.id);if(f)Object.assign(f,derivative,{creationMethod:'AI illustration preserved; deterministic in-area branding flattened in PNG'});
 console.log(job.id,rendered.width+'x'+rendered.height,bytes.length+' bytes');
}}finally{await browser.close();}
const acid=data.articles.find(a=>a.summaryId==='disturbios-eletroliticos-e-acido-base'),block=acid.blocks.find(b=>b.id==='section-024');
const result={schemaVersion:1,derivatives,retiredPublicAssets:derivatives.map(d=>d.oldUrl),errata:[{summaryId:acid.summaryId,version:acid.version,blockId:block.id,selectedTextSha256:block.selectedTextSha256,from:'Fluxograma diagnóstico prático para investigar as causas de hiponatremia com base na osmolaridade e volemia.',to:'Fluxograma de interpretação gasométrica: pH, PaCO₂ e HCO₃⁻, compensação esperada, ânion gap e investigação de distúrbios mistos.',reason:'Caption described hyponatremia although this section concerns arterial blood gas interpretation.',references:[{label:'American Thoracic Society — interpretação da gasometria',url:'https://www.thoracic.org/professionals/clinical-resources/critical-care/clinical-education/abgs.php'},{label:'Merck Manual — distúrbios ácido-base',url:'https://www.merckmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/acid-base-disorders'}]}]};
writeFileSync(root+'/scripts/data/academy-figure-overrides.json',JSON.stringify(result,null,2)+'\n');writeFileSync(root+'/scripts/data/academy-illustrations.json',JSON.stringify(figures,null,2)+'\n');
