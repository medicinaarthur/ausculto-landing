import {test} from 'node:test';
import assert from 'node:assert/strict';
import {studentLanding} from './academy-landing.mjs';
import {renderPresentationArticles,renderPresentationIndex,presentation} from './academy-presentation.mjs';
test('books are shared across highlights, portal and every related reading',()=>{
 assert.equal((studentLanding().match(/ data-book /g)||[]).length,3);
 assert.equal((renderPresentationIndex().match(/ data-book /g)||[]).length,3);
 for(const r of renderPresentationArticles())assert.equal((r.html.match(/ data-book /g)||[]).length,2);
});
test('ECG is an independent course before the full catalogue, with 18 ordered modules',()=>{
 const html=studentLanding();assert.match(html,/Curso de ECG · 18 módulos/);assert.match(html,/Eletrocardiograma, do traçado à decisão/);
 assert.ok(html.indexOf('id="curso-ecg"')<html.indexOf('id="catalogue-list"'));
 assert.match(html,/returnTo=academy-summary%3Aecg-01-do-impulso-ao-tracado/);
 for(const module of presentation.ecgModules)assert.ok(html.includes(module.summaryId));
});
test('readers expose real local study controls with topic and version identities',()=>{
 for(const r of renderPresentationArticles()){
  const a=presentation.articles.find(a=>r.path.includes(a.summaryId));
  assert.ok(r.html.includes('data-study-topic="'+a.summaryId+'"'));assert.ok(r.html.includes('data-study-version="'+a.version+'"'));
  assert.equal((r.html.match(/data-study-done/g)||[]).length,a.blocks.length);
  assert.match(r.html,/data-study-font/);assert.match(r.html,/neste navegador/);
 }
});
