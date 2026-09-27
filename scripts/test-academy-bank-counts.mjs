import {test}from 'node:test';
import assert from 'node:assert/strict';
import {countBanks,hasComment,readFormatter}from './academy-bank-counts.mjs';
const formatterSource=readFormatter('../commit-v1-premium-backport');
test('bank audit deduplicates exam numbers, accepts real comments and respects exclusions',()=>{
 const row=(id,number,extra={})=>({id,data:{exam_folder:'USP_SP_2026',exam_name:'USP SP 2026',question_number:number,...extra}});
 const r=countBanks([row('a',1),row('b','01',{explanation:'Raciocínio'}),row('c',2,{option_comments:{a:'',b:'Explicação'}}),row('d',3,{excluded_from_residency_views:true}),row('e',4,{explanation:'  '})],{formatterSource,exclude:d=>d.excluded_from_residency_views});
 assert.equal(r.banks[0].bankKey,'USP SP');assert.equal(r.banks[0].examCount,1);assert.equal(r.banks[0].questionCount,3);assert.equal(r.banks[0].commentedQuestionCount,2);assert.equal(r.duplicates,1);assert.equal(r.excluded,1);
 assert.equal(hasComment({option_comments:{a:null}}),false);
});
