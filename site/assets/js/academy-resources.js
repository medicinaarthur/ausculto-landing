/* Local samples, native links and native scrolling. No API calls or study-state writes. */
(() => {
 const root=document.querySelector('[data-academy-mosaic]');if(!root)return;
 const viewport=root.querySelector('[data-mosaic-viewport]'),track=root.querySelector('[data-mosaic-track]');
 const dialog=root.querySelector('#resource-flash-dialog');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:700px)');
 const samples=JSON.parse(root.querySelector('[data-resource-flashcards]').textContent);
 const originals=[...track.children];const copies=originals.map(column=>{
  const copy=column.cloneNode(true);copy.dataset.mosaicCopy='';copy.setAttribute('aria-hidden','true');
  copy.querySelectorAll('[id]').forEach(el=>el.removeAttribute('id'));
  copy.querySelectorAll('a,button,[tabindex]').forEach(el=>el.setAttribute('tabindex','-1'));
  track.append(copy);return copy;
 });
 const cards=[...track.querySelectorAll('[data-mosaic-card]')];
 const flashes=cards.filter(c=>c.querySelector('.am-flip'));
 const previous=new WeakMap(),crossed=new WeakSet(),seenAt=new WeakMap(),flippedAt=new WeakMap(),manualCards=new WeakSet(),reasons=new Set();
 let visible=false,frame=0,lastTime=0,position=0,lastWritten=0,cycle=0,inputTimer=0,opener=null;
 function running(){return visible&&!reduced.matches&&!document.hidden&&!reasons.size&&cycle>0;}
 function sync(){
  const active=running();root.dataset.motion=active?'running':'paused';
  if(!active){cancelAnimationFrame(frame);frame=0;lastTime=0;}
  else if(!frame){position=viewport.scrollLeft;lastWritten=position;frame=requestAnimationFrame(tick);}
 }
 function reason(name,value){if(value)reasons.add(name);else reasons.delete(name);sync();}
 function reflectTurn(card){const b=card.querySelector('[data-card-turn]');if(b){const flipped=card.classList.contains('is-flipped');b.setAttribute('aria-pressed',String(flipped));b.querySelector('span').textContent=flipped?'Ver questão':b.dataset.frontLabel;}}
 function resetFlash(card){card.classList.remove('is-flipped');crossed.delete(card);previous.delete(card);seenAt.delete(card);flippedAt.delete(card);manualCards.delete(card);reflectTurn(card);}
 function checkCrossings(){
  const view=viewport.getBoundingClientRect(),middle=view.left+view.width/2;
  for(const card of flashes){
   const r=card.getBoundingClientRect(),center=r.left+r.width/2;
   if(r.right<=view.left||r.left>=view.right){resetFlash(card);continue;}
   if(manualCards.has(card))continue;
   const now=performance.now();if(!seenAt.has(card))seenAt.set(card,now);
   if(flippedAt.has(card)&&now-flippedAt.get(card)>(card.matches('.am-card--question')?6500:2600)){card.classList.remove('is-flipped');reflectTurn(card);}
   const prior=previous.get(card);
   if(prior!==undefined&&prior>middle&&center<=middle&&!crossed.has(card)&&now-seenAt.get(card)>800){
    crossed.add(card);card.classList.add('is-flipped');flippedAt.set(card,now);reflectTurn(card);
   }
   previous.set(card,center);
  }
 }
 function tick(now){
  frame=0;if(!running()){lastTime=0;return;}
  if(lastTime){
   position+=Math.min(now-lastTime,50)/1000*(mobile.matches?9.8:13.5);
   if(position>=cycle){
    position-=cycle;
    // Copies and originals occupy the same visual slot across the seam.
    // Preserve the reveal timer across the seam.
    const originalFlashes=flashes.filter(c=>!c.closest('[data-mosaic-copy]'));
    for(const original of originalFlashes){
     const copy=flashes.find(c=>c.closest('[data-mosaic-copy]')&&c.dataset.mosaicCard===original.dataset.mosaicCard);
     resetFlash(original);
     if(copy?.classList.contains('is-flipped')){original.classList.add('is-flipped');crossed.add(original);}
     if(copy&&previous.has(copy))previous.set(original,previous.get(copy));
     if(copy&&seenAt.has(copy))seenAt.set(original,seenAt.get(copy));
     if(copy&&flippedAt.has(copy))flippedAt.set(original,flippedAt.get(copy));
     if(copy&&manualCards.has(copy))manualCards.add(original);reflectTurn(original);
    }
    flashes.filter(c=>c.closest('[data-mosaic-copy]')).forEach(resetFlash);
   }
   viewport.scrollLeft=position;lastWritten=viewport.scrollLeft;
   checkCrossings();
  }
  lastTime=now;frame=requestAnimationFrame(tick);
 }
 function measure(){
  const oldCycle=cycle,phase=oldCycle?viewport.scrollLeft/oldCycle:0;
  copies.forEach(c=>{c.hidden=reduced.matches;});
  cycle=reduced.matches?0:copies[0].offsetLeft-originals[0].offsetLeft;
  viewport.scrollLeft=cycle?phase*cycle:0;position=viewport.scrollLeft;lastWritten=position;
  flashes.forEach(resetFlash);sync();
 }
 function pauseInput(){clearTimeout(inputTimer);reason('input',true);}
 function releaseInput(){clearTimeout(inputTimer);inputTimer=setTimeout(()=>reason('input',false),1800);}
 let keyboardNavigation=false;
 document.addEventListener('keydown',e=>{if(e.key==='Tab'||e.key.startsWith('Arrow'))keyboardNavigation=true;});
 document.addEventListener('pointerdown',()=>{keyboardNavigation=false;reason('focus',false);},{passive:true});
 viewport.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')pauseInput();},{passive:true});
 window.addEventListener('pointerup',e=>{if(e.pointerType==='touch')releaseInput();},{passive:true});
 window.addEventListener('pointercancel',e=>{if(e.pointerType==='touch')releaseInput();},{passive:true});
 viewport.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>Math.abs(e.deltaY)){pauseInput();releaseInput();}},{passive:true});
 viewport.addEventListener('scroll',()=>{
  if(Math.abs(viewport.scrollLeft-lastWritten)>1.1){position=viewport.scrollLeft;lastWritten=position;flashes.forEach(resetFlash);}
 },{passive:true});
 viewport.addEventListener('focusin',e=>{reason('focus',keyboardNavigation);const a=e.target.closest('.am-action');if(a&&keyboardNavigation){a.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'});}});
 viewport.addEventListener('focusout',()=>queueMicrotask(()=>{reason('focus',keyboardNavigation&&viewport.contains(document.activeElement));}));
 const reveal=root.querySelector('[data-flash-reveal]'),answer=root.querySelector('#resource-flash-answer');
 root.addEventListener('click',event=>{
  const turn=event.target.closest('[data-card-turn]');
  if(turn){const card=turn.closest('[data-mosaic-card]');card.classList.toggle('is-flipped');manualCards.add(card);reflectTurn(card);return;}
  const link=event.target.closest('[data-flash-open]');if(!link)return;
  const sample=samples.find(s=>s.sampleId===link.dataset.flashOpen);if(!sample)return;
  event.preventDefault();opener=link;root.querySelector('[data-flash-category]').textContent=sample.specialty;
  root.querySelector('#resource-flash-title').textContent=sample.question;root.querySelector('[data-flash-answer]').textContent=sample.answer;
  answer.hidden=true;reveal.setAttribute('aria-expanded','false');reveal.firstChild.textContent='Revelar resposta ';
  dialog.showModal();reason('dialog',true);reveal.focus({preventScroll:true});
 });
 reveal.addEventListener('click',()=>{answer.hidden=!answer.hidden;reveal.setAttribute('aria-expanded',String(!answer.hidden));reveal.firstChild.textContent=answer.hidden?'Revelar resposta ':'Ocultar resposta ';});
 root.querySelector('[data-flash-close]').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))dialog.close();});
 dialog.addEventListener('close',()=>{opener?.focus({preventScroll:true});reason('dialog',Boolean(document.querySelector('dialog[open]')));});
 document.addEventListener('visibilitychange',()=>{sync();});
 new MutationObserver(()=>reason('dialog',Boolean(document.querySelector('dialog[open]')))).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{const next=entries[0].isIntersecting;if(next!==visible)flashes.forEach(resetFlash);visible=next;sync();},{threshold:0}).observe(viewport);else visible=true;
 let resizeTimer;new ResizeObserver(()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(measure,100);}).observe(viewport);
 reduced.addEventListener('change',measure);mobile.addEventListener('change',measure);
 // Fallback answers disappear only after the dialog and handlers are installed.
 root.classList.add('am-enhanced');measure();
})();
