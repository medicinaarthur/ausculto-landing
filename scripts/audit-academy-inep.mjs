/** Local, deterministic audit of read-only Firestore snapshots. No remote writes. */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root='.local-art/academy-dossier/sources/';
const folders=['ENAMED_2025_CADERNO_1','enamed_2026_caderno_1','REVALIDA 2025 - 1 MD','REVALIDA_2025_2','REVALIDA 2024 MD'];
const rows=new Map(),files=[];
const counts=values=>Object.fromEntries([...values.reduce((m,v)=>m.set(v,(m.get(v)||0)+1),new Map())].sort((a,b)=>b[1]-a[1]));
for(const folder of folders){
 const raw=readFileSync(root+folder+'.json'),items=JSON.parse(raw),numbers=items.map(x=>Number(x.number??x.question_number));
 if(new Set(numbers).size!==items.length)throw Error(`Duplicate question numbers: ${folder}`);
 rows.set(folder,items);
 files.push({folder,records:items.length,sha256:createHash('sha256').update(raw).digest('hex'),missingNumbers:Array.from({length:100},(_,i)=>i+1).filter(n=>!numbers.includes(n)),canonicalAreaCoverage:items.filter(x=>x.canonical_large_area).length,themeCoverage:items.filter(x=>x.theme_canonical||x.canonical_theme).length,answerStatuses:counts(items.map(x=>x.official_answer_status||'not_declared'))});
}
const current=rows.get('enamed_2026_caderno_1');
const pdfs=JSON.parse(readFileSync('.local-art/academy-refinement/enamed-evidence/manifest.json','utf8')).map(({file,pages,sha256})=>({file,pages,sha256}));
for(const pdf of pdfs)if(createHash('sha256').update(readFileSync(pdf.file)).digest('hex')!==pdf.sha256)throw Error(`PDF changed: ${pdf.file}`);
if(current.length!==100||current.some(x=>!x.specialty||!x.theme_canonical||!x.subtheme_canonical))throw Error('Incomplete ENAMED 2026 classification');
const areaLabels={'Clínica Médica':'Clínica Médica','Pediatria':'Pediatria','Cirurgia Geral':'Cirurgia','Ginecologia e Obstetrícia':'Ginecologia e Obstetrícia','Medicina Preventiva e Social':'Saúde Coletiva','Psiquiatria':'Saúde Mental','Medicina de Família e Comunidade':'Medicina de Família'};
const areas=Object.entries(counts(current.map(x=>x.specialty))).map(([sourceLabel,count])=>{if(!areaLabels[sourceLabel])throw Error(`Unknown specialty ${sourceLabel}`);return {label:areaLabels[sourceLabel],sourceLabel,count,percent:count,questions:current.filter(x=>x.specialty===sourceLabel).map(x=>x.number).sort((a,b)=>a-b)};});
const normalize=s=>String(s||'').normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[^a-z0-9]/g,'');
const overlaps=[];
for(let i=0;i<folders.length;i++)for(let j=i+1;j<folders.length;j++){
 const right=new Map(rows.get(folders[j]).map(x=>[normalize(x.statement),x.number]));
 const pairs=rows.get(folders[i]).filter(x=>right.has(normalize(x.statement))).map(x=>[x.number,right.get(normalize(x.statement))]);
 if(pairs.length)overlaps.push({left:folders[i],right:folders[j],exactNormalizedStatementMatches:pairs.length,pairs,note:'Lower bound only; transcription differences are not automatically treated as distinct items.'});
}
const report={reviewedAt:'2026-09-27',files,areas,overlaps,method:'Chart: the specialty field of all 100 ENAMED 2026 items, one label per item. Editorial catalog classification, not an official INEP allocation or forecast. Historical collections inform reviewed study suggestions, never a pooled incidence denominator.',limitations:['ENAMED 2025 has 90 loadable scored items; ten numbers were annulled or excluded, according to the app official-item source manifest.','Revalida 2024 and 2025/1 exports are incomplete; their absent numbers are not assumed to be annulled.','Revalida 2025/2 canonical theme Diarreia Aguda incorrectly includes items 2, 14, 30, 59 and 95, among others. No incidence is derived from that field.','ENAMED 2026 and Revalida 2026/2 share the same items (Edital INEP 76/2026, 3.1.1); do not double-count.','The supplied checklists describe editorial study priorities, not audited incidence percentages.']};
report.pdfs=pdfs;
writeFileSync('scripts/data/academy-inep-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({files:files.map(({folder,records})=>({folder,records})),areas:areas.map(({label,count})=>({label,count})),overlaps:overlaps.map(({pairs,...x})=>x)},null,2));
