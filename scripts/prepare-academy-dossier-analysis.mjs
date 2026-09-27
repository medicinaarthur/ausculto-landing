import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import analysis from './data/academy-dossier-analysis.json' with {type:'json'};
import inep from './data/academy-inep-audit.json' with {type:'json'};
const path='scripts/data/academy-dossiers.json';
const dossiers=JSON.parse(readFileSync(path,'utf8'));
const quotes={enamed:'Conhecimento ganha sentido quando orienta uma decisão.','usp-sp':'Aprofundar o raciocínio também é preparar a resposta.','sus-sp':'Revisar com método torna o conhecimento mais disponível.',einstein:'O dado decisivo merece atenção.',unifesp:'Conectar conceitos transforma a maneira de resolver.'};
const shortDescriptions={enamed:'Da atenção primária à urgência: diagnóstico, cuidado e decisão.', 'usp-sp':'Detalhes clínicos, interpretação de exames e a escolha do próximo passo.','sus-sp':'Cinco grandes áreas com o mesmo peso. Revisão equilibrada faz diferença.',einstein:'Leia os dados do caso, compare alternativas e justifique sua escolha.',unifesp:'Conecte fundamentos, exames e condutas em diferentes cenários clínicos.'};
const themes={
 enamed:[['Imunizações e prevenção','Revise calendário, hesitação vacinal e prevenção de infecções.'],['Saúde da mulher','Conecte contracepção, rastreamento e cuidado na gestação.'],['APS e saúde mental','Treine acolhimento, continuidade e articulação da rede.']],
 'usp-sp':[['Oncologia e estadiamento','Organize a investigação antes da decisão terapêutica.'],['Epidemiologia clínica','Compare vieses e limites dos desenhos de estudo.'],['Desenvolvimento infantil','Revise marcos, sinais de alerta e investigação.']],
 'sus-sp':[['Urgências pediátricas','Treine a ordem das medidas no atendimento inicial.'],['Anatomia aplicada','Relacione a estrutura anatômica ao procedimento.'],['Rastreamento e seguimento','Diferencie teste inicial, confirmação e acompanhamento.']],
 einstein:[['Emergências cardiovasculares','Identifique os dados que mudam a prioridade.'],['Pré-natal e rastreamento','Compare indicações e limites dos exames.'],['Estudos clínicos','Revise ensaios, revisões sistemáticas e metanálises.']],
 unifesp:[['Urologia e abdome agudo','Use localização, tamanho e gravidade na resolução.'],['Contracepção','Revise elegibilidade e interações medicamentosas.'],['Epidemiologia e bioestatística','Diferencie associação, causalidade e incerteza.']]
};
const provenance=[];
for(const bank of dossiers.banks){
 bank.quote=quotes[bank.id];bank.shortDescription=shortDescriptions[bank.id];bank.themes=themes[bank.id].map(([title,text])=>({title,text}));
 const a=analysis.banks[bank.id];
 if(bank.id==='enamed'){
  const source=inep.files.find(x=>x.folder==='enamed_2026_caderno_1');
  const raw=readFileSync(`.local-art/academy-dossier/sources/${source.folder}.json`);
  if(createHash('sha256').update(raw).digest('hex')!==source.sha256)throw Error('Re-run INEP audit: source changed');
  bank.distribution={kind:'editorial',year:2026,total:100,label:'ENAMED 2026 · 100 questões',note:'Distribuição por especialidade cadastrada no Ausculto nas 100 questões do caderno 1 de 2026. Cada item é contado uma vez. Os agrupamentos são editoriais, não pesos oficiais do INEP nem previsão da próxima prova. Saúde Mental e atenção primária também atravessam outras áreas. Gabarito de 2026: preliminar.',areas:inep.areas.map(({label,count,percent})=>({label,count,percent}))};
  bank.sourceNote='Perfil e gráfico: ENAMED 2026 completo. Orientação de estudo confrontada com ENAMED 2025, Revalida 2024 e 2025/1–2 e os checklists Ausculto fornecidos. Questões compartilhadas não são somadas como evidências independentes. Revalida 2026/2 utiliza as mesmas questões do ENAMED 2026. A prática identifica o ano e o status do gabarito de cada questão.';
  bank.practiceFolder='enamed_2026_caderno_1';bank.practiceYear=2026;bank.practiceNumbers=[19,45,64];bank.practiceThemes=['Alimentação e prevenção','Imunizações','Rede de Atenção Psicossocial'];
  bank.studyEvidence=[{title:'Imunizações e prevenção',references:['ENAMED 2025: 47, 55','ENAMED 2026: 26, 45, 73','Revalida 2025/1: 81, 90','Revalida 2024: 28, 80']},{title:'Saúde da mulher',references:['ENAMED 2025: 49, 54, 75','ENAMED 2026: 32, 49, 61, 84','Revalida 2025/1: 65','Revalida 2025/2: 68, 69']},{title:'APS e saúde mental',references:['ENAMED 2025: 71','ENAMED 2026: 7, 13, 64, 71, 85','Checklist ENAMED Ausculto 2026: prioridades de APS, ética e saúde mental']}];
  const url='https://mecnormas.mec.gov.br/pesquisa/detalhar/12400';
  if(!bank.sources.some(x=>x.url===url))bank.sources.push({label:'Revalida 2026/2 · edital, item 3.1.1',url});
  provenance.push({bank:bank.id,...source,classificationField:'specialty',comparisonSources:inep.files.filter(x=>x!==source),overlapAudit:inep.overlaps,studyEvidence:bank.studyEvidence});
 }else if(a){
  const raw=readFileSync(`.local-art/academy-dossier/sources/${a.folder}.json`);
  const rows=JSON.parse(raw),byNumber=new Map();
  for(const row of rows){const n=Number(row.number??row.question_number);if(byNumber.has(n))throw Error(`Duplicate source ${a.folder}/${n}`);byNumber.set(n,row);}
  const seen=new Set(),groups=[];
  for(const [label,numbers] of Object.entries(a.groups)){
   for(const n of numbers){const row=byNumber.get(n);if(!row||seen.has(n)||row.cancelled||row.is_graded===false)throw Error(`Invalid reviewed item ${a.folder}/${n}`);seen.add(n);}
   groups.push({label,count:numbers.length});
  }
  const eligible=rows.filter(r=>!r.cancelled&&r.is_graded!==false);
  if(seen.size!==eligible.length)throw Error(`Incomplete review ${a.folder}`);
  bank.distribution={kind:'editorial',year:a.year,total:seen.size,label:`Acervo ${a.year} · ${seen.size} itens`,note:a.note,areas:groups.map(g=>({...g,percent:Math.round(g.count/seen.size*1000)/10}))};
  provenance.push({bank:bank.id,folder:a.folder,sha256:createHash('sha256').update(raw).digest('hex'),items:[...seen].sort((a,b)=>a-b),excluded:rows.filter(r=>r.cancelled||r.is_graded===false).map(r=>r.number)});
 }else{
  const total=bank.id==='usp-sp'?120:100;
  bank.distribution={kind:'official',year:2026,total,label:'Distribuição do edital · 2026',note:bank.id==='usp-sp'?'Edital COREME/FM 03/2025, seção V, item 1.1. Cinco blocos básicos, com Preventiva, MFC e Saúde Coletiva agrupadas. Saúde Mental e Urgência também integram o conteúdo.':'Edital SES-SP 2026, capítulo 9, tabela de acesso direto: 20 questões por grande área.',areas:['Clínica Médica','Cirurgia','Pediatria','Ginecologia e Obstetrícia','Preventiva e MFC'].map(label=>({label,count:total/5,percent:20}))};
 }
}
dossiers.analysisMethod=analysis.method;
writeFileSync(path,JSON.stringify(dossiers,null,2)+'\n');
writeFileSync('scripts/data/academy-dossier-analysis-provenance.json',JSON.stringify({reviewedAt:analysis.reviewedAt,method:analysis.method,files:provenance},null,2)+'\n');
console.log('Validated ENAMED 2026 and historical evidence, two reviewed samples and two official distributions; app data unchanged.');
