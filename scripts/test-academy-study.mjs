import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const load=createRequire(import.meta.url);
test('local study stores only affected block and isolates topic/version identities',()=>{
 let m;try{m=load('../site/assets/js/academy-study.js');}catch{}assert.ok(m?.createStore,'study persistence missing');
 const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const first=m.createStore(storage,'abdome','v1');first.update('section-001',{note:'<script>plain text</script>',done:true});
 assert.equal(m.createStore(storage,'abdome','v1').read('section-001').note,'<script>plain text</script>');
 assert.equal(m.createStore(storage,'abdome','v2').read('section-001').note,'');assert.equal(m.createStore(storage,'epi','v1').read('section-001').done,false);
 first.update('section-002',{done:true});assert.equal(first.read('section-001').note,'<script>plain text</script>');
});
test('invalid JSON and storage denial keep usable session state without claiming persisted',()=>{
 let m;try{m=load('../site/assets/js/academy-study.js');}catch{}assert.ok(m?.createStore);
 const bad={getItem:()=>'{invalid',setItem(){throw Error('denied');}};const s=m.createStore(bad,'acid','v1');
 assert.deepEqual(s.read('section-001'),{done:false,note:''});const result=s.update('section-001',{note:'Minha revisão'});assert.equal(result.persisted,false);assert.equal(s.read('section-001').note,'Minha revisão');
});
