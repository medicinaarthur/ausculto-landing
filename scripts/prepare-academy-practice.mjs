import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {join,resolve} from 'node:path';
const root=resolve('.');
const config=JSON.parse(readFileSync(join(root,'scripts/data/academy-dossiers.json'),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const output={schemaVersion:1,reviewedAt:config.reviewedAt,banks:{}};
const provenance={schemaVersion:1,reviewedAt:config.reviewedAt,source:'Firestore questions; read-only export',questions:[]};
for(const bank of config.banks){
 const raw=readFileSync(join(root,'.local-art/academy-dossier/sources',bank.practiceFolder+'.json'),'utf8');
 const docs=JSON.parse(raw);
 output.banks[bank.id]=bank.practiceNumbers.map((number,i)=>{
  const candidates=docs.filter(d=>Number(d.question_number??d.number)===number);
  if(candidates.length!==1)throw Error(`${bank.id} #${number}: needs duplicate review`);
  const d=candidates[0];
  if(d.cancelled||d.is_graded===false||d.published===false||d.publication_review_required===true||d.images?.length)throw Error(`Invalid public sample: ${d.documentId}`);
  const correct=String(d.answer_official||'').toUpperCase();
  const options=Object.entries(d.options).sort(([a],[b])=>a.localeCompare(b)).map(([key,text])=>({key:key.toUpperCase(),text}));
  if(!options.some(o=>o.key===correct)||options.length<4)throw Error(`Missing answer ${d.documentId}`);
  const comment=d.option_comments?.[correct.toLowerCase()]||d.option_comments?.[correct];
  if(typeof comment!=='string'||comment.length<50)throw Error(`Missing commentary ${d.documentId}`);
  // The first paragraph is a continuous excerpt of the app commentary. Later update notes stay in the app.
  let excerpt=comment.split(/\n\s*\n/)[0].replace(/^correta\.?\s*/i,'').replace(/^Perfeito\.\s*/,'').trim();
  if(excerpt.length<70)excerpt=comment.replace(/^correta\.?\s*/i,'').trim();
  const preliminary=d.official_answer_status==='preliminary';
  if(preliminary&&!d.answer_key_source_url)throw Error(`Missing preliminary source: ${d.documentId}`);
  const q={id:d.documentId,bank:bank.name,year:bank.practiceYear,number,theme:bank.practiceThemes[i],statement:[d.shared_text,d.statement].filter(Boolean).join('\n\n'),options,correct,comment:excerpt,answerStatus:preliminary?'preliminary':'final',answerSource:preliminary?'Gabarito preliminar do INEP · sujeito a revisão':'Gabarito da prova no acervo Ausculto',commentSource:'Comentário do Ausculto'};
  provenance.questions.push({id:q.id,bankId:bank.id,examFolder:bank.practiceFolder,number,sourceFileHash:sha(raw),contentHash:sha(JSON.stringify({statement:q.statement,options:q.options,correct:q.correct})),sourceStatus:d.official_answer_status||'answer_official in imported exam',review:'Statement, alternatives and correct commentary inspected; cancelled and image-dependent questions excluded.'});
  return q;
 });
}
mkdirSync(join(root,'site/assets/academy/dossier'),{recursive:true});
writeFileSync(join(root,'site/assets/academy/dossier/practice.json'),JSON.stringify(output)+'\n');
writeFileSync(join(root,'scripts/data/academy-practice-provenance.json'),JSON.stringify(provenance,null,2)+'\n');
console.log('Prepared 15 reviewed questions across 5 banks. Original statements and alternatives preserved.');
