(() => {
 'use strict';
 const root=document.querySelector('[data-study-cycle]');if(!root)return;
 const steps=[...root.querySelectorAll('[data-cycle-step]')],poses=[...root.querySelectorAll('[data-cycle-pose]')],controls=[...root.querySelectorAll('[data-cycle-select]')],paths=[...root.querySelectorAll('[data-cycle-path]')];
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),prev=root.querySelector('[data-cycle-prev]'),next=root.querySelector('[data-cycle-next]');
 let selected=0,request=0,animations=[];
 const flow=root.querySelector('.journey-flow');let measuredWidth=0;
 function reserveContent(){
  if(innerWidth>=1200){flow.style.minHeight='';return;}
  let maximum=0;
  for(const step of steps){
   const clone=step.cloneNode(true);clone.open=true;clone.classList.add('is-active');clone.setAttribute('aria-hidden','true');clone.inert=true;
   clone.style.cssText=`position:absolute;visibility:hidden;pointer-events:none;display:block;width:${flow.clientWidth}px`;
   flow.append(clone);maximum=Math.max(maximum,clone.getBoundingClientRect().height);clone.remove();
  }
  flow.style.minHeight=`${Math.ceil(maximum)}px`;
 }
 const ease='cubic-bezier(.22,1,.36,1)';
 function animate(element,frames,duration){if(!reduced.matches)animations.push(element.animate(frames,{duration,easing:ease}));}
 function select(index,initial=false){
  const token=++request;selected=index;animations.forEach(a=>a.cancel());animations=[];
  steps.forEach((step,i)=>{step.open=i===index;step.classList.toggle('is-active',i===index);step.querySelector('summary').setAttribute('aria-expanded',String(i===index));});
  controls.forEach(button=>button.setAttribute('aria-pressed',String(Number(button.dataset.cycleSelect)===index)));
  paths.forEach((path,i)=>path.classList.toggle('is-active',i<=index));
  root.dataset.stage=String(index);root.querySelector('[data-cycle-count]').textContent=`Etapa 0${index+1} de 04`;
  const name=steps[index].querySelector('[data-stage-name]').firstChild.textContent;
  root.querySelector('[data-cycle-name]').textContent=name;root.querySelector('[data-cycle-subtitle]').textContent=steps[index].querySelector('[data-stage-subtitle]').textContent;
  prev.disabled=index===0;next.innerHTML=index===3?'Recomeçar ↻':'Próxima →';root.querySelector('[data-cycle-return]').hidden=index!==3;
  if(!initial)animate(steps[index].querySelector('.journey-content'),[{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'none'}],320);
  const img=poses[index];img.loading='eager';
  img.decode().then(()=>{if(token!==request)return;poses.forEach((p,i)=>{p.classList.toggle('is-active',i===index);p.setAttribute('aria-hidden',String(i!==index));});root.removeAttribute('data-pose-unavailable');if(!initial)animate(img,[{opacity:0},{opacity:1}],420);}).catch(()=>{if(token!==request)return;poses.forEach(p=>{p.classList.remove('is-active');p.setAttribute('aria-hidden','true');});root.dataset.poseUnavailable='true';});
 }
 root.classList.add('is-enhanced');root.querySelector('.cycle-navigation').hidden=false;
 controls.forEach(button=>button.addEventListener('click',()=>{button.focus({preventScroll:true});select(Number(button.dataset.cycleSelect));}));
 steps.forEach((step,i)=>step.querySelector('summary').addEventListener('click',event=>{event.preventDefault();select(i);}));
 prev.addEventListener('click',()=>select(Math.max(0,selected-1)));next.addEventListener('click',()=>select((selected+1)%4));
 reduced.addEventListener('change',()=>{animations.forEach(a=>a.cancel());animations=[];});
 matchMedia('(min-width:1200px)').addEventListener('change',()=>{
  reserveContent();
  const focused=document.activeElement;
  if(root.contains(focused)&&!focused.getClientRects().length){
   controls.find(button=>Number(button.dataset.cycleSelect)===selected&&button.getClientRects().length)?.focus({preventScroll:true});
  }
 });
 new ResizeObserver(()=>{if(root.clientWidth!==measuredWidth){measuredWidth=root.clientWidth;reserveContent();}}).observe(root);
 document.fonts.ready.then(reserveContent);
 select(0,true);
})();
