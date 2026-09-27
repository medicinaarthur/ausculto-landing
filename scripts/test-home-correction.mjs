import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../site/index.html',import.meta.url),'utf8');
test('AusFlow preserves original desktop and mobile photographs, small title concept',()=>{
 assert.ok(html.includes('class="tl-plantao__photo" src="/assets/home/blocks/plantao-student.webp"'));
 assert.ok(html.includes('class="feat__photo" src="/assets/home/m/plantao-m-21.webp"'));
 assert.ok(!html.includes('class="tl-plantao__concept"'));assert.ok(!html.includes('class="feat-concept"'));
 assert.ok(html.includes('class="tl-plantao__logo" src="/assets/home/products/ausflow-concept-'));
});
test('AusMind uses supplied brand decoration and conditional edge glint',()=>{
 assert.equal((html.match(/data-ausmind-glint/g)||[]).length,2);assert.ok(html.includes('ausmind-decoration-'));
 assert.ok(html.includes('/assets/js/ausmind-glint.js'));
});
