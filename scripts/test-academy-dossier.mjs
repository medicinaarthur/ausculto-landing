import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {academyHero,academyBridge} from './academy-hero.mjs';
import dossiers from './data/academy-dossiers.json' with {type:'json'};
import provenance from './data/academy-practice-provenance.json' with {type:'json'};
import facts from './data/academy-product.json' with {type:'json'};
import prints from './data/academy-dossier-prints.json' with {type:'json'};
import inep from './data/academy-inep-audit.json' with {type:'json'};
import {dossierPrintCopyHash} from './academy-print-contract.mjs';
const practice=JSON.parse(readFileSync(new URL('../site/assets/academy/dossier/practice.json',import.meta.url),'utf8'));

test('ENAMED chart counts the complete 2026 edition once, with separate historical evidence',()=>{
 const bank=dossiers.banks.find(b=>b.id==='enamed');
 assert.equal(bank.distribution.year,2026);assert.equal(bank.distribution.total,100);
 assert.equal(bank.distribution.areas.reduce((n,a)=>n+a.count,0),100);
 assert.equal(bank.distribution.areas.reduce((n,a)=>n+a.percent,0),100);
 const numbers=inep.areas.flatMap(a=>a.questions);assert.equal(new Set(numbers).size,100);
 assert.deepEqual([...numbers].sort((a,b)=>a-b),Array.from({length:100},(_,i)=>i+1));
 assert.equal(inep.files.length,5);assert.equal(inep.pdfs.length,4);
 assert.ok(inep.overlaps.some(x=>x.exactNormalizedStatementMatches>0));
 assert.equal(bank.practiceYear,2026);assert.ok(bank.studyEvidence.every(x=>x.references.length>1));
});
test('five distinct dossiers have sourced facts and explicitly editorial guidance',()=>{
 assert.deepEqual(dossiers.banks.map(b=>b.id),['enamed','usp-sp','sus-sp','einstein','unifesp']);
 for(const b of dossiers.banks){assert.equal(b.insights.length,3);assert.equal(b.themes.length,3);assert.ok(b.sources.length);for(const s of b.sources)assert.equal(new URL(s.url).protocol,'https:');assert.ok(b.sourceNote);}
 assert.match(dossiers.editorialNote,/Não representam incidência/);
});
test('the 15 selected questions remain identical to their reviewed content hashes',()=>{
 const ids=new Set();
 for(const bank of dossiers.banks){const questions=practice.banks[bank.id];assert.equal(questions.length,3);
  for(const q of questions){assert.ok(!ids.has(q.id));ids.add(q.id);assert.equal(q.year,bank.practiceYear);assert.ok(q.statement.length>30);assert.ok(q.comment.length>50);assert.equal(q.options.filter(o=>o.key===q.correct).length,1);assert.equal(new Set(q.options.map(o=>o.key)).size,q.options.length);
   const source=provenance.questions.find(p=>p.id===q.id);assert.ok(source);assert.equal(source.bankId,bank.id);if(source.sourceStatus==='preliminary'){assert.equal(q.answerStatus,'preliminary');assert.match(q.answerSource,/preliminar/);}
   assert.equal(createHash('sha256').update(JSON.stringify({statement:q.statement,options:q.options,correct:q.correct})).digest('hex'),source.contentHash);
  }
 }assert.equal(ids.size,15);
});
test('initial HTML contains the dossiers and app fallback; practice is not embedded',()=>{
 const html=academyHero();assert.equal((html.match(/data-dossier-panel=/g)||[]).length,5);assert.equal((html.match(/data-dossier-tab=/g)||[]).length,5);assert.match(html,/<noscript>/);assert.match(html,/https:\/\/app\.auscultoapp\.com\/#\/signup/);assert.ok(!html.includes(practice.banks.enamed[0].statement));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
});
test('each bank has reviewed desktop/mobile printing tied to the factual snapshot',()=>{
 assert.equal(prints.entries.length,10);
 for(const b of dossiers.banks)for(const layout of ['desktop','mobile']){
  const p=prints.entries.find(p=>p.id===b.id&&p.layout===layout);assert.ok(p?.visuallyReviewed);
  assert.equal(p.copyHash,dossierPrintCopyHash(b));
  assert.ok(readFileSync(new URL(`../site/assets/academy/dossier/print-${b.id}-${layout}.webp`,import.meta.url)).length>10000);
 }
});
test('commercial floors do not exceed reconciled sources or mislabel students',()=>{
 assert.ok(facts.pathologiesMinimum<=facts.pathologiesObserved);assert.ok(facts.drugInteractionsMinimum<=facts.drugInteractionsObserved);assert.ok(facts.commentedResidencyQuestionsMinimum<=facts.residencyQuestionsUniqueExamNumbers);assert.match(academyBridge(),/questões no banco/);assert.ok(!academyBridge().includes('estudantes em todo'));
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');for(const name of ['pathologiesMinimum','drugInteractionsMinimum'])assert.ok(html.includes(`data-product-fact="${name}"`));
});
