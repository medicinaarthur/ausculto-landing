import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {studentLanding} from './academy-landing.mjs';
test('commercial pages replace obsolete counts and product names',()=>{
  for(const file of ['site/index.html']){
    const html=readFileSync(new URL('../'+file,import.meta.url),'utf8');
    assert.ok(!/4\.700\+|250\+|50\.000\+|Meu Plantão/i.test(html),file+" contains stale copy");
    assert.match(html,/10 mil\+/);assert.match(html,/140 mil\+/);assert.match(html,/280\+/);assert.match(html,/AusFlow/);
  }
});
test('home ENAMED paths go first to students in both views',()=>{
 const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
 const cards=[...html.matchAll(/<a\b[^>]*class="[^"]*routine-card[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]).filter(s=>s.includes('Para o ENAMED'));
 assert.equal(cards.length,2);for(const card of cards)assert.match(card,/href="\/estudantes\/"/);
});
test('Academy differentiates official questions, totals and complete free themes',()=>{
 const html=studentLanding();assert.ok(!/69 temas|Ler trecho grátis/.test(html),"stale Academy copy");assert.match(html,/14 mil\+ questões oficiais/);assert.match(html,/70 mil\+/);assert.ok(!html.includes('14.345 questões'),'raw duplicate document count must not be advertised as unique questions');
});

test('doctor bundle gets updated without changing compiled logic',async()=>{
 const {updateMedicoCopy}=await import('./medico-copy.mjs');
 const facts=JSON.parse(readFileSync(new URL('./data/academy-product.json',import.meta.url),'utf8'));
 const source=readFileSync(new URL('../site/ads-medico-assets/ads-medico-Bz1YGakL.js',import.meta.url),'utf8');
 const updated=updateMedicoCopy(source,facts);
 assert.ok(updated.includes('AusFlow'));assert.ok(!/Meu Plantão|250\+/.test(updated));
});
