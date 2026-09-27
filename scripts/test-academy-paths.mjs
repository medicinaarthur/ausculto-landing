import {test}from 'node:test';
import assert from 'node:assert/strict';
import {studentLanding}from './academy-landing.mjs';
import {readFileSync}from 'node:fs';
test('three independent paths and counted banks appear in the approved order',()=>{
 const html=studentLanding(),selectors=['id="residencia"','data-bank-gallery','id="enamed"','id="ferramentas-academy"'];
 const offsets=selectors.map(s=>html.indexOf(s));assert.ok(offsets.every(n=>n>=0));assert.deepEqual([...offsets].sort((a,b)=>a-b),offsets);
 assert.equal((html.match(/data-bank-gallery/g)||[]).length,1);assert.ok(!html.includes('PROVAS COM IDENTIDADE'));
 assert.match(html,/500 exames/);assert.match(html,/22 tópicos/);assert.match(html,/1\.005 protocolos/);assert.match(html,/CID-10 e CID-11/);assert.match(html,/data-enamed-book/);
 assert.match(html,/Mais confiança na prática/);assert.match(html,/play\.google\.com/);assert.match(html,/apps\.apple\.com/);
});
test('bank metrics are audited unique counts, not duplicated raw question documents',()=>{
 const snapshot=JSON.parse(readFileSync(new URL('./data/academy-bank-counts.json',import.meta.url)));
 assert.equal(snapshot.missingNumber,0);assert.equal(snapshot.banks.length,40);assert.ok(snapshot.duplicates>0);
 for(const b of snapshot.banks){assert.ok(b.examCount>0);assert.ok(b.commentedQuestionCount<=b.questionCount);assert.ok(b.url&&b.bankKey);}
});
