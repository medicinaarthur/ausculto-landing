import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {renderPresentationArticles,presentation} from './academy-presentation.mjs';
import {renderMarkdown} from './academy-markdown.mjs';
test('flattened illustration URLs render as images rather than Markdown literals',()=>{
 const data=JSON.parse(readFileSync(new URL('./data/academy-figure-overrides.json',import.meta.url)));
 const flow=data.derivatives.find(f=>f.id==='gasometria-fluxograma');
 assert.ok(renderMarkdown(`![Fluxograma](${flow.url})`).includes('<img src="'+flow.url+'"'));
});
test('canonical gasometry block no longer shows hyponatremia caption or column table',()=>{
 const a=presentation.articles.find(a=>a.summaryId==='disturbios-eletroliticos-e-acido-base');
 const html=renderPresentationArticles().find(r=>r.path.includes(a.summaryId)).html;
 const section=html.slice(html.indexOf('id="section-024"'),html.indexOf('</section>',html.indexOf('id="section-024"')));
 assert.ok(!section.includes('investigar as causas de hiponatremia'),'incongruent caption still visible');
 assert.ok(section.includes('gasometria-fluxograma'));
 assert.ok(a.blocks[23].text.includes('hiponatremia'),'raw snapshot must be preserved');
});
test('every final figure is a flattened image with in-area brand provenance',()=>{
 const path=new URL('./data/academy-figure-overrides.json',import.meta.url);assert.ok(existsSync(path),'flattened derivatives missing');
 const data=JSON.parse(readFileSync(path));assert.equal(data.derivatives.length,7);
 for(const f of data.derivatives){assert.ok(f.url.endsWith('.png'));assert.equal(f.watermark.flattened,true);assert.ok(f.watermark.central.opacity>0);assert.equal(f.watermark.central.widthFraction,.2);}
});
