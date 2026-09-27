import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const model=createRequire(import.meta.url)('../site/assets/js/academy-sim-demo.js');
const config={banks:[{id:'ENAMED',label:'ENAMED / ENARE'},{id:'SUS-SP',label:'SUS-SP'}],difficulties:['facil','intermediario','dificil','r2'].map(id=>({id})),examQuantities:[20,50,100],focusedRange:{min:1,max:30},nodes:[
 {id:'A',kind:'areas',parent:null,banks:['ENAMED','SUS-SP']},
 {id:'A/S',kind:'specialties',parent:'A',banks:['ENAMED','SUS-SP']},
 {id:'A/S/T',kind:'themes',parent:'A/S',banks:['ENAMED']},
 {id:'A/S/T/U',kind:'subthemes',parent:'A/S/T',banks:['ENAMED']},
 {id:'B',kind:'areas',parent:null,banks:['SUS-SP']},
 {id:'B/S',kind:'specialties',parent:'B',banks:['SUS-SP']} ]};
test('four-step builder starts without implicit scope or difficulty',()=>{
 const s=model.initialState();assert.equal(s.step,0);for(const key of ['banks','areas','specialties','themes','subthemes','difficulties'])assert.deepEqual(s[key],[]);
 assert.equal(s.mode,'exam');assert.equal(s.scope,'');assert.equal(s.quantity,null);assert.equal(model.canContinue(s,config),false);
});
test('hierarchy requires parents; changing a parent clears descendants',()=>{
 assert.equal(typeof model.options,'function');
 let s=model.changeState(model.initialState(),{mode:'training',banks:['ENAMED']},config);
 assert.deepEqual(model.options('themes',s,config),[]);
 s=model.changeState(s,{areas:['A'],specialties:['A/S'],themes:['A/S/T'],subthemes:['A/S/T/U']},config);assert.deepEqual(s.subthemes,['A/S/T/U']);
 s=model.changeState(s,{areas:['B']},config);assert.deepEqual(s.specialties,[]);assert.deepEqual(s.subthemes,[]);
});
test('bank change preserves compatible paths; training allows multiple banks',()=>{
 let s=model.changeState(model.initialState(),{mode:'training',banks:['ENAMED'],areas:['A'],specialties:['A/S'],themes:['A/S/T'],subthemes:['A/S/T/U']},config);
 s=model.changeState(s,{banks:['SUS-SP']},config);assert.deepEqual(s.areas,['A']);assert.deepEqual(s.specialties,['A/S']);assert.deepEqual(s.themes,[]);assert.deepEqual(s.subthemes,[]);
 s=model.changeState(s,{banks:['ENAMED','SUS-SP']},config);assert.equal(s.banks.length,2);
 s=model.changeState(s,{mode:'exam',scope:'mixed'},config);assert.equal(s.banks.length,1);assert.deepEqual(s.areas,[]);
});
test('focused integer quantity 1..30; mixed 20/50/100 and no hidden scope',()=>{
 let s=model.changeState(model.initialState(),{mode:'training',quantity:1},config);assert.equal(s.quantity,1);
 assert.equal(model.changeState(s,{quantity:31},config).quantity,null);assert.equal(model.changeState(s,{quantity:2.5},config).quantity,null);
 s=model.changeState(s,{mode:'exam',scope:'mixed'},config);assert.equal(s.quantity,null);
 s=model.changeState(s,{quantity:100,areas:['A']},config);assert.equal(s.quantity,100);assert.deepEqual(s.areas,[]);
 s=model.changeState(s,{scope:'focused'},config);assert.equal(s.quantity,null);
});
test('theme and subtheme optional; at least one explicit difficulty',()=>{
 let s=model.changeState(model.initialState(),{step:2,mode:'training',banks:['ENAMED'],areas:['A'],specialties:['A/S']},config);assert.equal(model.canContinue(s,config),true);
 s=model.changeState(s,{step:3,quantity:10},config);assert.equal(model.canContinue(s,config),false);
 s=model.changeState(s,{difficulties:['facil','r2']},config);assert.equal(model.canContinue(s,config),true);
});
