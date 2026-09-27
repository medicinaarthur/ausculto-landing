import {publicAsset} from './academy-figure-overrides.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {presentation} from './academy-presentation.mjs';
import {studentLanding} from './academy-landing.mjs';
const {selectCatalogue}=createRequire(import.meta.url)('../site/assets/js/academy-catalogue.js');
const rows=presentation.catalogue.map(s=>({id:s.summaryId,title:s.title,area:s.largeArea}));
test('mobile search includes featured free themes and accent-insensitive terms',()=>{
  const result=selectCatalogue(rows,{query:'acido',area:'',limit:3});
  assert.ok(result.matches.some(r=>r.id==='disturbios-eletroliticos-e-acido-base'));
  assert.ok(selectCatalogue(rows,{query:'abdome',area:'cirurgia',limit:3}).visible.some(r=>r.id==='abdome-agudo'));
});
test('combined filters and paging keep canonical areas and every result',()=>{
  const selected=selectCatalogue(rows,{query:'',area:'pediatria',limit:3});
  assert.equal(selected.visible.length,3);
  assert.ok(selected.matches.every(r=>r.area==='pediatria'));
  assert.equal(selectCatalogue(rows,{query:'',area:'',limit:9}).matches.length,presentation.catalogue.length);
  assert.equal(selectCatalogue(rows,{query:'zzzzzzzzz',area:'',limit:3}).visible.length,0);
  assert.equal(selectCatalogue(rows,{query:'abdome',area:'pediatria',limit:3}).matches.length,0);
});
test('static fallback contains entire catalogue, real previews and correct destinations',()=>{
  const html=studentLanding();
  assert.equal((html.match(/<li data-title=/g)||[]).length,presentation.catalogue.length);
  assert.equal((html.match(/data-book data-book-name=/g)||[]).length,3);
  for(const a of presentation.articles){assert.ok(html.includes(publicAsset(a.assets[0].url)));assert.ok(html.includes('/conteudos/'+a.summaryId+'/'));}
  assert.match(html,/150\+ temas/);
  assert.match(html,new RegExp('Curso de ECG · '+presentation.ecgModules.length+' módulos'));
});
