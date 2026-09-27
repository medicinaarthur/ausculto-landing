import {publicAsset} from './academy-figure-overrides.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {presentation,renderPresentationArticles,renderPresentationIndex} from './academy-presentation.mjs';
test('readers preserve all sections and references once, with honest application CTA',()=>{
 for(const rendered of renderPresentationArticles()){
  const a=presentation.articles.find(a=>rendered.path.includes(a.summaryId));
  for(const b of a.blocks)assert.equal((rendered.html.match(new RegExp('id="'+b.id+'"','g'))||[]).length,1);
  assert.equal((rendered.html.match(/<h1[ >]/g)||[]).length,1);
  assert.doesNotMatch(rendered.html,/Trecho do tema|Retome de onde parou|Guarde a leitura/);
  assert.match(rendered.html,/Estudar este tema no app/);
  assert.match(rendered.html,/reader-toc/);
  assert.ok(rendered.html.includes(a.reviewer));
  const related=rendered.html.slice(rendered.html.indexOf('class="section related"'));
  assert.ok(!related.includes('href="/conteudos/'+a.summaryId+'/"'));
 }
});
test('portal introduces three complete readings with source images, times and next paths',()=>{
 const html=renderPresentationIndex();
 assert.match(html,/Conheça a Academy estudando/);
 assert.match(html,/sem cadastro/);
 for(const a of presentation.articles){assert.ok(html.includes(publicAsset(a.assets[0].url)));assert.ok(html.includes(a.readingMinutes+' min'));}
 assert.match(html,/estudantes\/#material/);assert.match(html,/estudantes\/#simulados-demo/);
});
