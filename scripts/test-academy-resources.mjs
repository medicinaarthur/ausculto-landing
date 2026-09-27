import test from 'node:test';
import assert from 'node:assert/strict';
import {resourcesSection} from './academy-product.mjs';
import {resourceManifest} from './academy-resources.mjs';

test('resources expose 24 distinct cards, 22 Academy cards and 2 labelled extras', () => {
  const html=resourcesSection();
  const ids=[...html.matchAll(/data-mosaic-card="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,24);
  assert.equal(new Set(ids).size,24);
  assert.equal((html.match(/data-family="academy"/g)||[]).length,22);
  assert.equal((html.match(/data-family="ausculto"/g)||[]).length,2);
  assert.match(html,/Para aprender de <em>verdade/);
});

test('curation preserves all seven tools and includes six clinical trail previews', () => {
 const cards=resourceManifest.cards;
 assert.equal(new Set(cards.filter(c=>c.family==='academy').map(c=>c.group)).size,7);
 assert.equal(cards.filter(c=>c.group==='Trilha clínica').length,6);
 assert(cards.some(c=>c.id==='trilha-helena'&&c.recreated));
 for(const c of cards){
  assert.doesNotMatch(JSON.stringify(c),/[\p{L}]\?[\p{L}]/u,'No damaged accents');
  if(c.type==='flash'){
   assert.equal(c.flashcard.isCustom,false);
   assert.equal(c.flashcard.source,'curated_flashcards_import_v1');
  }
 }
});

test('three flashcards have accessible native answer fallbacks and a shared dialog', () => {
  const html=resourcesSection();
  assert.equal((html.match(/data-flash-open/g)||[]).length,3);
  assert.equal((html.match(/data-flash-fallback/g)||[]).length,3);
  assert.match(html,/<dialog[^>]+id="resource-flash-dialog"/);
  assert.doesNotMatch(html,/data-mosaic-toggle|Conhecimento que/);
  assert.doesNotMatch(html,/data-rail[\s>]/);
});

test('three-row gallery uses written cases, highlighted questions and the atlas chart series', () => {
 const html=resourcesSection();
 assert.equal((html.match(/class="am-column"/g)||[]).length,8);
 assert.match(html,/Edema agudo de pulmão/);
 assert.match(html,/<mark>dispneia súbita<\/mark>/);
 assert.match(html,/<mark>retossigmoidectomia<\/mark>/);
 assert.doesNotMatch(html,/am-dossier-media|am-ui-ring|am-tooltip/);
 const chart=resourceManifest.cards.find(c=>c.id==='desempenho').ui;
 assert.equal(chart.weekly.length,8);
 assert.deepEqual(chart.weekly.at(-1),{week:'17 ago',answers:32,correct:26});
 assert.match(chart.source,/atlas_academy_part1_capture_test/);
 const ecg=resourceManifest.cards.find(c=>c.id==='quiz-ecg');
 assert.equal(ecg.provenance.root,'remote');
 assert.equal(ecg.provenance.file,'ecg.png');
});

test('exam flips preserve verified banks, dates, answers and all four Caio alternatives',()=>{
 const html=resourcesSection();
 assert.doesNotMatch(html,/class="am-context"/);
 const qs=resourceManifest.cards.filter(c=>c.type==='question');
 assert.equal(qs.length,4);
 assert.equal((html.match(/data-card-turn /g)||[]).length,4);
 for(const bank of ['USP-SP','ENAMED','Einstein']){
  const c=qs.find(c=>c.ui.question.bank===bank);assert(c);
  assert.match(String(c.ui.question.year),/^202[56]$/);
  assert.equal(Object.keys(c.ui.question.options).length,4);
  assert(c.ui.question.options[c.ui.question.answer]);
 }
 const caio=qs.find(c=>c.id==='trilha-caio');
 assert.deepEqual(Object.keys(caio.ui.question.options),['A','B','C','D']);
 assert.equal(caio.ui.question.answer,'D');
 assert.match(html,/am-exam-option is-correct/);
});
