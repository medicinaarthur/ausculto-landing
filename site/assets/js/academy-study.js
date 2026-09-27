(() => {
  function createStore(storage,topic,version){
    const prefix=`ausculto.study.v1:${encodeURIComponent(topic)}:${encodeURIComponent(version)}:`;
    const memory=new Map(),failed=new Set();
    let available=!!storage;
    function get(id){
      if(failed.has(id)||!storage)return memory.get(id)||{};
      try {const value=JSON.parse(storage.getItem(prefix+id)||'{}');return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
      catch{return memory.get(id)||{};}
    }
    function save(id,value){
      memory.set(id,value);
      try{if(!storage)throw Error('Storage unavailable');storage.setItem(prefix+id,JSON.stringify(value));failed.delete(id);return {persisted:true};}
      catch{available=false;failed.add(id);return {persisted:false};}
    }
    function read(id){const v=get(id);return {done:v.done===true,note:typeof v.note==='string'?v.note:''};}
    return {read,update(id,patch){const old=read(id);return save(id,{done:typeof patch.done==='boolean'?patch.done:old.done,note:typeof patch.note==='string'?patch.note:old.note});},position(){const v=get('position');return typeof v.current==='string'?v.current:'';},mark(id){return save('position',{current:id});},get persistent(){return available;}};
  }
  if(typeof module!=='undefined')module.exports={createStore};
  if(typeof document==='undefined')return;
  const article=document.querySelector('[data-study-topic]');if(!article)return;
  let storage;try{storage=localStorage;const probe='ausculto.study.storage-probe';storage.setItem(probe,'1');storage.removeItem(probe);}catch{storage=null;}
  const store=createStore(storage,article.dataset.studyTopic,article.dataset.studyVersion);
  const blocks=[...article.querySelectorAll('[data-study-block]')];
  const notice=article.querySelector('[data-study-storage]'),progress=article.querySelector('[data-study-progress]'),resume=article.querySelector('[data-study-resume]');
  const fallback=()=>{notice.textContent='O armazenamento está indisponível. Suas notas e marcações ficam apenas nesta sessão.';notice.setAttribute('role','status');};
  if(!storage)fallback();
  function updateProgress(){progress.textContent=`${blocks.filter(b=>b.querySelector('[data-study-done]').checked).length} de ${blocks.length} seções concluídas`;}
  const pending=new Map();
  function saveNote(block){
    const id=block.dataset.studyBlock;clearTimeout(pending.get(id));pending.delete(id);
    const result=store.update(id,{note:block.querySelector('textarea').value});
    block.querySelector('[data-study-status]').textContent=result.persisted?'Salvo neste navegador.':'Guardado apenas nesta sessão.';
    if(!result.persisted)fallback();
  }
  function current(){const id=store.position();if(!blocks.some(b=>b.dataset.studyBlock===id))return '';
    blocks.forEach(b=>{const active=b.dataset.studyBlock===id;const button=b.querySelector('[data-study-current]');button.textContent=active?'Seção atual ✓':'Marcar como atual';button.setAttribute('aria-pressed',String(active));});resume.hidden=false;return id;
  }
  blocks.forEach(block=>{
    const id=block.dataset.studyBlock,record=store.read(id),done=block.querySelector('[data-study-done]'),text=block.querySelector('textarea'),note=block.querySelector('[data-study-note]');
    block.querySelectorAll('button,input,textarea').forEach(el=>el.disabled=false);
    done.checked=record.done;text.value=record.note;if(record.note)note.textContent='Ver anotação';
    done.addEventListener('change',()=>{if(!store.update(id,{done:done.checked}).persisted)fallback();updateProgress();});
    note.addEventListener('click',()=>{const panel=block.querySelector('.study-note');panel.hidden=!panel.hidden;note.setAttribute('aria-expanded',String(!panel.hidden));if(!panel.hidden)text.focus();});
    text.addEventListener('input',()=>{block.querySelector('[data-study-status]').textContent='Salvando…';clearTimeout(pending.get(id));pending.set(id,setTimeout(()=>saveNote(block),350));});
    text.addEventListener('blur',()=>{if(pending.has(id))saveNote(block);});
    block.querySelector('[data-study-current]').addEventListener('click',()=>{if(!store.mark(id).persisted)fallback();current();});
  });
  addEventListener('pagehide',()=>blocks.forEach(b=>{if(pending.has(b.dataset.studyBlock))saveNote(b);}));
  resume.addEventListener('click',()=>{const id=current();const section=document.getElementById(id);if(section){section.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});section.setAttribute('tabindex','-1');section.focus({preventScroll:true});}});
  const font=article.querySelector('[data-study-font]'),value=article.querySelector('[data-study-font-value]');font.disabled=false;
  function applyFont(raw){const n=Number(raw);const scale=Number.isInteger(n)&&n>=85&&n<=150&&n%5===0?n:100;font.value=String(scale);article.style.setProperty('--study-scale',String(scale/100));value.textContent=scale+'%';return scale;}
  let savedFont;try{savedFont=storage?.getItem('ausculto.study.font.v1');}catch{}applyFont(savedFont);
  font.addEventListener('input',()=>{const n=applyFont(font.value);try{if(!storage)throw Error('Storage unavailable');storage.setItem('ausculto.study.font.v1',String(n));}catch{fallback();}});
  current();updateProgress();
})();
