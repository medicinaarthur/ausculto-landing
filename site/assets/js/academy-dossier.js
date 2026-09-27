/* Five editorial dossiers. Static HTML is authoritative; moving copies are decorative. */
(() => {
 'use strict';
 const root=document.querySelector('[data-dossier]');if(!root)return;
 const book=root.querySelector('[data-dossier-book]');
 const tabs=[...root.querySelectorAll('[data-dossier-tab]')];
 const panels=[...book.querySelectorAll('[data-dossier-panel]')];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:767px)');
 const live=root.querySelector('[data-dossier-live]'),counter=root.querySelector('[data-dossier-counter]');
 const track=(name,params)=>window.auscultoTrack?.(name,{content_category:'academy_dossier',...params});
 let current=0,requested=0,requestedAnimation=true,busy=false,generation=0,animations=[],turnLayer=null;
 const printLoads=new Map();
 async function loadPrint(index){
  const panel=panels[index],spread=panel.querySelector('.dossier-spread');
  const url=spread.dataset[mobile.matches?'printMobile':'printDesktop'];
  if(!printLoads.has(url))printLoads.set(url,new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(true);image.onerror=()=>{printLoads.delete(url);resolve(false);};image.src=url;}));
  const ok=await printLoads.get(url);
  panel.classList.toggle('is-print-unavailable',!ok);
  if(ok){panel.querySelectorAll('source[data-print-mobile]').forEach(s=>s.srcset=s.dataset.printMobile);const images=[...panel.querySelectorAll('img[data-print-desktop]')];images.forEach(img=>img.src=img.dataset.printDesktop);await Promise.all(images.map(img=>img.decode().catch(()=>{})));}
  return ok;
 }
 const cleanClone=node=>{const c=node.cloneNode(true);c.removeAttribute('id');c.querySelectorAll('[id]').forEach(x=>x.removeAttribute('id'));c.querySelectorAll('[tabindex],a,button,input').forEach(x=>{x.tabIndex=-1;});c.inert=true;c.setAttribute('aria-hidden','true');return c;};
 const setCurrent=index=>{
  const previousBank=root.dataset.bank;
  current=index;
  panels.forEach((panel,i)=>{panel.setAttribute('aria-hidden',String(i!==index));panel.inert=i!==index;});
  tabs.forEach((tab,i)=>{tab.classList.toggle('is-selected',i===index);tab.setAttribute('aria-selected',String(i===index));tab.tabIndex=i===index?0:-1;});
  counter.textContent=`${index+1} / ${panels.length}`;
  root.querySelector('[data-dossier-prev]').disabled=index===0;root.querySelector('[data-dossier-next]').disabled=index===panels.length-1;
  root.dataset.bank=panels[index].dataset.dossierPanel;
  if(previousBank!==undefined&&previousBank!==root.dataset.bank)root.dispatchEvent(new CustomEvent('dossier:bankchange',{detail:{bank:root.dataset.bank,previousBank}}));
 };
 function clearTurn(){animations.forEach(a=>a.cancel());animations=[];turnLayer?.remove();turnLayer=null;book.removeAttribute('aria-busy');}
 function createTurn(from,to,forward){
  const portrait=mobile.matches,oldPanel=panels[from],newPanel=panels[to];
  if(portrait){
   const layer=document.createElement('div');layer.className='dossier-turn dossier-turn--glide';layer.inert=true;layer.setAttribute('aria-hidden','true');
   const sheet=document.createElement('div');sheet.className='dossier-gliding-sheet';
   sheet.style.cssText=`left:${oldPanel.offsetLeft}px;top:${oldPanel.offsetTop}px;width:${oldPanel.offsetWidth}px;height:${oldPanel.offsetHeight}px;`;
   sheet.append(cleanClone(oldPanel));layer.append(sheet);book.append(layer);turnLayer=layer;
   const direction=forward?-1:1;
   const turn=sheet.animate([
    {transform:'translate3d(0,0,0) rotateX(0deg) rotateZ(0deg)',opacity:1},
    {transform:`translate3d(${direction*3}%, -6%, 35px) rotateX(12deg) rotateZ(${direction*2}deg)`,opacity:1,offset:.3},
    {transform:`translate3d(${direction*46}%, -16%, 45px) rotateX(18deg) rotateZ(${direction*9}deg)`,opacity:1,offset:.7},
    {transform:`translate3d(${direction*73}%, -23%, 25px) rotateX(22deg) rotateZ(${direction*13}deg)`,opacity:1,offset:.9},
    {transform:`translate3d(${direction*86}%, -26%, 15px) rotateX(24deg) rotateZ(${direction*15}deg)`,opacity:0}
   ],{duration:620,easing:'cubic-bezier(.22,.61,.36,1)',fill:'forwards'});
   animations.push(turn);return turn.finished.catch(()=>{});
  }
  const oldFace=portrait?oldPanel:oldPanel.querySelector(forward?'.dossier-page--right':'.dossier-page--left');
  const newFace=portrait?newPanel:newPanel.querySelector(forward?'.dossier-page--left':'.dossier-page--right');
  const width=oldFace.offsetWidth,height=oldFace.offsetHeight;
  const x=oldPanel.offsetLeft+(portrait?0:oldFace.offsetLeft),y=oldPanel.offsetTop+(portrait?0:oldFace.offsetTop);
  const layer=document.createElement('div');layer.className='dossier-turn';layer.setAttribute('aria-hidden','true');layer.inert=true;
  const leaf=document.createElement('div');leaf.className='dossier-turn-leaf';leaf.style.cssText=`left:${x}px;top:${y}px;width:${width}px;height:${height}px;transform-origin:${forward?'left':'right'} center`;
  const strips=8,stripWidth=width/strips;
  const duration=portrait?560:780,options={duration,easing:'cubic-bezier(.4,0,.2,1)',fill:'forwards'};
  // Keep the non-turning old half visible until the leaf settles over it.
  if(!portrait){const stationary=oldPanel.querySelector(forward?'.dossier-page--left':'.dossier-page--right');const hold=cleanClone(stationary);hold.style.cssText=`position:absolute;left:${oldPanel.offsetLeft+stationary.offsetLeft}px;top:${y}px;width:${stationary.offsetWidth}px;height:${height}px;background:linear-gradient(${forward?'90':'270'}deg,#eee5d5,#e9dfce);`;layer.append(hold);}
  let parent=leaf;
  for(let i=0;i<strips;i++){
   const strip=document.createElement('div');strip.className='dossier-turn-strip';
   strip.style.width=`${stripWidth+1.2}px`;strip.style.left=i?`${stripWidth}px`:'0';
   for(const [back,node]of [[false,oldFace],[true,newFace]]){
    const face=document.createElement('div');face.className='dossier-turn-face'+(back?' dossier-turn-face--back':'');
    const copy=document.createElement('div');copy.className='dossier-turn-copy';copy.style.cssText=`width:${width}px;height:${height}px;left:${-(back?strips-i-1:i)*stripWidth}px;`;
    const clone=cleanClone(node);clone.style.margin='0';clone.style.width=`${width}px`;clone.style.height=`${height}px`;copy.append(clone);face.append(copy);
    const shade=document.createElement('div');shade.className='dossier-turn-shade';face.append(shade);strip.append(face);
    animations.push(shade.animate([{opacity:0},{opacity:back?.18:.34,offset:.5},{opacity:0}],options));
   }
   parent.append(strip);parent=strip;
   const bend=(forward?-1:1)*(portrait?3.2:4.5);
   animations.push(strip.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${bend}deg)`,offset:.42},{transform:'rotateY(0deg)'}],options));
  }
  layer.append(leaf);book.append(layer);turnLayer=layer;
  const shadow=document.createElement('div');shadow.className='dossier-turn-shadow';shadow.style.left=`${oldPanel.offsetLeft+(portrait?0:oldPanel.offsetWidth/2)}px`;if(!forward)shadow.style.transform='scaleX(-1)';layer.insertBefore(shadow,leaf);
  animations.push(shadow.animate([{opacity:0},{opacity:.5,offset:.45},{opacity:0}],options));
  const angle=forward?-180:180;
  const main=leaf.animate([{transform:'rotateY(0deg)'},{transform:`rotateY(${angle*.48}deg) translateZ(10px)`,offset:.5},{transform:`rotateY(${angle}deg)`}],options);
  animations.push(main);return main.finished.catch(()=>{});
 }
 async function navigate(index,animate=true){
  requested=Math.max(0,Math.min(index,panels.length-1));
  requestedAnimation=animate;
  if(busy||requested===current)return;
  const destination=requested,from=current,token=++generation,animateDestination=requestedAnimation;
  busy=true;book.setAttribute('aria-busy','true');
  const printed=await loadPrint(destination);if(token!==generation)return;
  const canAnimate=animateDestination&&printed&&!panels[from].classList.contains('is-print-unavailable')&&!reduced.matches&&typeof book.animate==='function'&&CSS.supports('transform-style','preserve-3d');
  try{
   if(canAnimate){const complete=createTurn(from,destination,destination>from);setCurrent(destination);await complete;}
   else{setCurrent(destination);if(animateDestination&&!reduced.matches&&typeof book.animate==='function'){const fade=panels[destination].animate([{opacity:0},{opacity:1}],{duration:140});animations.push(fade);await fade.finished.catch(()=>{});}}
  }catch{setCurrent(destination);}
  if(token!==generation)return;
  clearTurn();busy=false;live.textContent=`Dossiê ${panels[current].dataset.bankName} selecionado.`;
  track('DossierBankSelected',{content_name:panels[current].dataset.dossierPanel});
  if(requested!==current)navigate(requested,requestedAnimation);
 }
 function settle(){if(!busy)return;generation++;clearTurn();busy=false;setCurrent(requested);loadPrint(requested);}
 root.classList.add('is-enhanced');
 root.querySelector('[data-dossier-tabs]').setAttribute('role','tablist');
 tabs.forEach((tab,i)=>{tab.setAttribute('role','tab');tab.setAttribute('aria-controls',panels[i].id);panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',tab.id);
  tab.addEventListener('click',event=>{event.preventDefault();navigate(i,event.detail!==0);});
  tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight')next=(i+1)%tabs.length;if(event.key==='ArrowLeft')next=(i+tabs.length-1)%tabs.length;if(event.key==='Home')next=0;if(event.key==='End')next=tabs.length-1;if(next!==undefined){event.preventDefault();tabs.forEach((t,n)=>t.tabIndex=n===next?0:-1);tabs[next].focus();}else if(event.key===' '){event.preventDefault();navigate(i,false);}});
 });
 root.querySelector('[data-dossier-pagination]').hidden=false;
 root.querySelector('[data-dossier-prev]').addEventListener('click',event=>navigate(requested-1,event.detail!==0));
 root.querySelector('[data-dossier-next]').addEventListener('click',event=>navigate(requested+1,event.detail!==0));
 root.querySelector('[data-dossier-explore]').addEventListener('click',event=>{event.preventDefault();root.querySelector('#dossie').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'start'});tabs[current].focus({preventScroll:true});});
 reduced.addEventListener('change',settle);mobile.addEventListener('change',settle);
 // Measured corners of the paper in calendar-frame.webp (1048 x 1196).
 // One projective plane carries both the printed image and the live chart.
 function fitPaper(width,height){
  if(!mobile.matches){book.style.removeProperty('--paper-transform');return;}
  const [x0,y0,x1,y1,x2,y2,x3,y3]=[.120,.078,.916,.083,.930,.958,.045,.936];
  const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3;
  const det=dx1*dy2-dx2*dy1,g=(dx3*dy2-dx2*dy3)/det,h=(dx1*dy3-dx3*dy1)/det;
  const a=x1-x0+g*x1,b=(y1-y0+g*y1)*height/width,c=(x3-x0+h*x3)*width/height,d=y3-y0+h*y3;
  book.style.setProperty('--paper-transform',`matrix3d(${a},${b},0,${g/width},${c},${d},0,${h/height},0,0,1,0,${x0*width},${y0*height},0,1)`);
 }
 let previousWidth;
 if('ResizeObserver'in window)new ResizeObserver(entries=>{const {width,height}=entries[0].contentRect;if(previousWidth!==undefined&&width!==previousWidth)settle();previousWidth=width;fitPaper(width,height);}).observe(book);
 let pointer=null;
 book.addEventListener('pointerdown',event=>{if(!mobile.matches||event.pointerType!=='touch'||event.target.closest('a,button,input'))return;const r=book.getBoundingClientRect();if(event.clientX-r.left>24&&r.right-event.clientX>24)return;pointer={x:event.clientX,y:event.clientY,id:event.pointerId};});
 book.addEventListener('pointerup',event=>{if(!pointer||event.pointerId!==pointer.id)return;const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;pointer=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.8)navigate(requested+(dx<0?1:-1));});
 book.addEventListener('pointercancel',()=>{pointer=null;});
 setCurrent(0);
 loadPrint(0);mobile.addEventListener('change',()=>loadPrint(current));
 // Automatic discovery. Manual input starts a fresh reading interval.
 let rotationTimer=null,bookVisible=false;
 function rotationReady(){return bookVisible&&!document.hidden&&!document.querySelector('dialog[open]');}
 function scheduleRotation(){
  clearTimeout(rotationTimer);rotationTimer=null;
  if(!rotationReady())return;
  rotationTimer=setTimeout(async()=>{rotationTimer=null;if(!rotationReady())return;if(!busy)await navigate((current+1)%panels.length);scheduleRotation();},12000);
 }
 root.dataset.autoplay='enabled';live.setAttribute('aria-live','off');
 root.addEventListener('pointerdown',scheduleRotation,{passive:true});
 root.addEventListener('keydown',scheduleRotation);
 document.addEventListener('visibilitychange',scheduleRotation);
 new MutationObserver(scheduleRotation).observe(document.body,{attributes:true,attributeFilter:['open'],subtree:true});
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{bookVisible=entries[0].isIntersecting&&entries[0].intersectionRatio>=.2;scheduleRotation();},{threshold:[0,.2]}).observe(book);
 const checkMaterial=()=>{const probe=new Image();probe.onload=()=>book.classList.remove('is-unavailable');probe.onerror=()=>book.classList.add('is-unavailable');probe.src=mobile.matches?'/assets/academy/dossier/calendar-frame.webp':'/assets/academy/dossier/book.webp';};
 checkMaterial();mobile.addEventListener('change',checkMaterial);
 // A single native dialog per purpose; focus is returned to its actual opener.
 const sources=document.getElementById('dossier-sources'),practice=document.getElementById('dossier-practice');
 let opener=null;
 const openDialog=(dialog,trigger)=>{opener=trigger;dialog.showModal();document.documentElement.classList.add('dossier-dialog-open');dialog.querySelector('[data-dossier-close]').focus();};
 [sources,practice].forEach(dialog=>{dialog.querySelector('[data-dossier-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});dialog.addEventListener('close',()=>{document.documentElement.classList.remove('dossier-dialog-open');opener?.focus({preventScroll:true});});});
 const sourcesTitle=sources.querySelector('#dossier-sources-title'),reading=document.createElement('div');reading.className='dossier-text-version';reading.hidden=true;sources.querySelector('.dossier-dialog__body').append(reading);
 root.querySelector('[data-dossier-source-current]').addEventListener('click',event=>{reading.hidden=true;sourcesTitle.textContent='Fontes e edição';sources.querySelectorAll('[data-source-bank]').forEach(section=>section.hidden=section.dataset.sourceBank!==panels[current].dataset.dossierPanel);openDialog(sources,event.currentTarget);});
 root.querySelector('[data-dossier-text]').addEventListener('click',event=>{sourcesTitle.textContent=`Dossiê ${panels[current].dataset.bankName}`;sources.querySelectorAll('[data-source-bank]').forEach(section=>section.hidden=true);const copy=panels[current].querySelector('[data-dossier-reading]').cloneNode(true);copy.classList.remove('visually-hidden');copy.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));reading.replaceChildren(copy);reading.hidden=false;openDialog(sources,event.currentTarget);});
 const content=practice.querySelector('[data-practice-content]'),title=practice.querySelector('#dossier-practice-title'),body=practice.querySelector('[data-practice-body]');
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const sessions=new Map();let dataPromise=null,practiceBank=null,practiceEpoch=0;
 const appUrl=signup=>{const url=new URL('https://app.auscultoapp.com/');const params=new URLSearchParams(location.search);for(const key of ['utm_source','utm_medium','utm_campaign','utm_content','utm_term']){const value=params.get(key);if(value&&value.length<=160&&/^[\p{L}\p{N}_. ~-]+$/u.test(value))url.searchParams.set(key,value);}if(signup)url.hash='/signup';return url.href;};
 function loadData(){return dataPromise||=(fetch('/assets/academy/dossier/practice.json').then(r=>{if(!r.ok)throw Error('Unable to load practice');return r.json();}).then(data=>{if(data.schemaVersion!==1||!data.banks)throw Error('Invalid practice schema');for(const bank of Object.values(data.banks)){if(!Array.isArray(bank)||bank.length!==3||bank.some(q=>!q.statement||!q.comment||!Array.isArray(q.options)||!q.options.some(o=>o.key===q.correct)))throw Error('Incomplete practice');}return data;}).catch(error=>{dataPromise=null;throw error;}));}
 function focusTitle(){body.scrollTop=0;title.focus({preventScroll:true});}
 function renderPractice(data,focus=true){
  const qs=data.banks[practiceBank],session=sessions.get(practiceBank),q=qs[session.index];
  practice.querySelector('[data-practice-bank]').textContent=`${qs[0].bank} · PRÁTICA AUSCULTO`;
  if(session.complete&&!session.review){renderResult(data);if(focus)focusTitle();return;}
  const answer=session.answers[session.index],answered=!!answer;
  title.textContent=session.review?'Revisar respostas':'Praticar 3 questões';
  content.innerHTML=`<ol class="practice-progress" aria-label="Questão ${session.index+1} de 3">${qs.map((_,i)=>`<li class="${i<=session.index?'is-done':''}"></li>`).join('')}</ol><p class="practice-meta"><span>${escape(q.bank)} ${q.year} · Questão ${q.number}</span><span>${session.index+1} de 3</span></p>${q.answerStatus==='preliminary'?'<p class="practice-key-note">Gabarito preliminar do INEP — sujeito a revisão</p>':''}<p class="practice-statement">${escape(q.statement)}</p><fieldset class="practice-options"><legend class="visually-hidden">Escolha uma alternativa</legend>${q.options.map(o=>`<label class="practice-option${answered&&o.key===q.correct?' is-correct':''}${answered&&answer!==q.correct&&answer===o.key?' is-wrong':''}"><input type="radio" name="practice-answer" value="${o.key}"${answer===o.key?' checked':''}${answered?' disabled':''}><span><b>${o.key}</b> ${escape(o.text)}</span></label>`).join('')}</fieldset>${answered?`<div class="practice-feedback" role="status"><strong>${answer===q.correct?'Resposta correta.':`Resposta correta: alternativa ${q.correct}.`}</strong><p>${escape(q.comment)}</p><small>${escape(q.commentSource)} · ${escape(q.answerSource)}</small></div>`:''}<div class="practice-actions">${session.review&&session.index>0?'<button class="dossier-button dossier-button--plain" data-practice-back>Anterior</button>':''}<button type="button" class="dossier-button" ${answered?'data-practice-next':'data-practice-confirm disabled'}>${answered?(session.index===2?'Ver resultado':'Próxima questão'):'Conferir resposta'}</button></div>`;
  content.querySelectorAll('input').forEach(input=>input.addEventListener('change',()=>{content.querySelector('[data-practice-confirm]').disabled=false;}));
  content.querySelector('[data-practice-confirm]')?.addEventListener('click',()=>{const selected=content.querySelector('input:checked');if(!selected||session.answers[session.index])return;session.answers[session.index]=selected.value;renderPractice(data,false);content.querySelector('[data-practice-next]').focus({preventScroll:true});content.querySelector('.practice-feedback').scrollIntoView({behavior:reduced.matches?'instant':'smooth',block:'nearest'});});
  content.querySelector('[data-practice-next]')?.addEventListener('click',()=>{if(session.index<2)session.index++;else{const first=!session.complete;session.complete=true;session.review=false;if(first)track('DossierPracticeCompleted',{content_name:practiceBank,num_items:3});}renderPractice(data);});
  content.querySelector('[data-practice-back]')?.addEventListener('click',()=>{session.index--;renderPractice(data);});
  if(focus)focusTitle();
 }
 function renderResult(data){
  const qs=data.banks[practiceBank],session=sessions.get(practiceBank),score=qs.filter((q,i)=>q.correct===session.answers[i]).length;
  title.textContent='Seu próximo passo começa aqui.';
  content.innerHTML=`<div class="practice-score"><b>${score}<small> / 3</small></b><span>${score===1?'acerto':'acertos'} nesta prática</span></div><p class="practice-summary">Você praticou três questões de ${escape(qs[0].bank)}. Este resultado descreve esta amostra, sem estimar sua nota na prova.</p><ul class="practice-themes">${qs.map((q,i)=>`<li>${escape(q.theme)}<span>${q.correct===session.answers[i]?'Acertou':'Para revisar'}</span></li>`).join('')}</ul><div class="practice-conversion"><p>Continue estudando com questões comentadas e provas por banca no Ausculto.</p><a class="dossier-button" data-practice-signup data-cta-position="dossier_practice_complete" href="${escape(appUrl(true))}">Criar conta grátis <span aria-hidden="true">↗</span></a><div class="practice-links"><button type="button" data-practice-review>Rever respostas</button><a href="${escape(appUrl(false))}">Já tenho conta</a></div></div>`;
  content.querySelector('[data-practice-review]').addEventListener('click',()=>{session.review=true;session.index=0;renderPractice(data);});
  content.querySelector('[data-practice-signup]').addEventListener('click',()=>track('DossierSignupClicked',{content_name:practiceBank}));
 }
 async function startPractice(trigger,retry=false){
  if(!retry){practiceBank=panels[current].dataset.dossierPanel;openDialog(practice,trigger);}
  const epoch=++practiceEpoch;title.textContent='Praticar 3 questões';content.innerHTML='<p role="status">Preparando suas questões…</p>';
  try{const data=await loadData();if(epoch!==practiceEpoch||!practice.open)return;if(!data.banks[practiceBank])throw Error('Missing bank');if(!sessions.has(practiceBank)){sessions.set(practiceBank,{index:0,answers:[],complete:false,review:false});track('DossierPracticeStarted',{content_name:practiceBank});}renderPractice(data);}catch{if(epoch!==practiceEpoch||!practice.open)return;content.innerHTML=`<div class="practice-error"><p>Não foi possível carregar as questões. Tente novamente ou continue no aplicativo.</p><button class="dossier-button" data-practice-retry>Tentar novamente</button><div class="practice-links"><a href="${escape(appUrl(false))}">Abrir o Ausculto</a></div></div>`;content.querySelector('[data-practice-retry]').addEventListener('click',()=>startPractice(null,true));}
 }
 practice.addEventListener('close',()=>{practiceEpoch++;});
 root.querySelectorAll('[data-dossier-practice]').forEach(link=>link.addEventListener('click',event=>{if(typeof practice.showModal!=='function')return;event.preventDefault();startPractice(link);}));
})();
