import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL('../dist/site/'+p,import.meta.url),'utf8');
const manifest=JSON.parse(readFileSync(new URL('../dist/site-manifest.json',import.meta.url),'utf8'));
test('component scripts load only on intended surfaces',()=>{
 const student=read('estudantes/index.html'),portal=read('conteudos/index.html'),reader=read('conteudos/abdome-agudo/index.html');
 for(const script of ['academy-catalogue','academy-sim-demo','academy-qdemo','academy-account-loader']){assert.ok(student.includes(script+'.js'));assert.ok(!portal.includes(script+'.js'));assert.ok(!reader.includes(script+'.js'));}
 for(const html of [student,portal,reader])assert.ok(html.includes('academy-book.js'));
 assert.ok(reader.includes('academy-reader.js'));assert.ok(!student.includes('academy-reader.js'));assert.ok(!portal.includes('academy-reader.js'));
});
test('existing and new stylesheet/script references use content hashes',()=>{
 for(const path of ['index.html','estudantes/index.html','conteudos/index.html','conteudos/abdome-agudo/index.html']){
  for(const m of read(path).matchAll(/['"](\/assets\/(?:css|js)\/[\w.-]+\.(?:css|js))\?v=([^'"]+)['"]/g)){
   const hash=createHash('sha256').update(readFileSync(new URL('../dist/site'+m[1],import.meta.url))).digest('hex').slice(0,10);
   assert.equal(m[2],hash,`${path}: ${m[1]}`);
  }
 }
 for(const p of ['scripts/academy-hero.mjs','scripts/academy-account.mjs','scripts/data/academy-qdemo.html','scripts/academy-sim-demo.mjs','scripts/data/academy-sim-demo.json'])assert.ok(manifest.sources[p],p);
});
test('published package identifies editorial release and excludes private sources',()=>{
 assert.equal(manifest.releaseId,manifest.editorialSource.releaseId);
 assert.equal(manifest.editorialSource.entryCount,manifest.editorialSource.themeCount+manifest.editorialSource.ecgCount);
 for(const p of Object.keys(manifest.files))assert.doesNotMatch(p,/\.local-art|candidate|snapshot\.json|\.pdf$|\.map$/);
 for(const p of ['conteudos/abdome-agudo/','conteudos/disturbios-eletroliticos-e-acido-base/','conteudos/estudos-epidemiologicos/']){
  assert.ok(read('sitemap.xml').includes('https://www.auscultoapp.com/'+p));
  assert.ok(read(p+'index.html').includes('isAccessibleForFree'));
 }
});
