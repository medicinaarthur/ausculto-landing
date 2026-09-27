/* Four original photographs, edited as a forward-only product campaign. */
(() => {
 'use strict';
 const stage=document.querySelector('[data-pro-sequence]');if(!stage)return;
 const frames=[...stage.querySelectorAll('[data-pro-pose]')],reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const holds=[1600,220,220,2400];let visible=false,ready=false,generation=0,timer=null,animation=null;
 const paint=index=>{frames.forEach((frame,i)=>frame.classList.toggle('is-current',i===index));stage.dataset.frame=String(index);};
 const active=()=>visible&&!document.hidden&&ready;
 function stop(){generation++;clearTimeout(timer);animation?.cancel();animation=null;stage.style.opacity='';stage.style.transform='';paint(0);stage.dataset.playing='false';}
 function later(fn,ms,token){timer=setTimeout(()=>{if(token===generation&&active())fn();},ms);}
 async function effect(keyframes,duration,token){
  if(token!==generation||!active())return false;
  animation?.cancel();
  animation=stage.animate(keyframes,{duration,easing:'cubic-bezier(.22,1,.36,1)',fill:'forwards'});
  try{await animation.finished;}catch{return false;}return token===generation&&active();
 }
 function run(index,token){
  if(token!==generation||!active())return;paint(index);stage.dataset.playing='true';
  later(async()=>{
   if(index<3){run(index+1,token);return;}
   if(!await effect([{opacity:1,transform:'translateY(0)'},{opacity:0,transform:reduced.matches?'none':'translateY(6px)'}],160,token))return;
   later(async()=>{
    paint(0);
    if(!await effect([{opacity:0,transform:reduced.matches?'none':'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],220,token))return;
    animation?.cancel();animation=null;run(0,token);
   },60,token);
  },holds[index],token);
 }
 async function start(){
  stop();if(!visible||document.hidden)return;const token=generation;
  try{
   await Promise.all(frames.map(async frame=>{const image=frame.querySelector('img');image.loading='eager';await image.decode();}));ready=true;
  }catch{
   const available=await Promise.all(frames.map(async frame=>{try{await frame.querySelector('img').decode();return true;}catch{return false;}}));
   if(token!==generation)return;
   const fallback=available.indexOf(true);if(fallback>=0)paint(fallback);
   stage.dataset.playing='asset-unavailable';return;
  }
  if(token===generation&&active())run(0,token);
 }
 document.addEventListener('visibilitychange',start);reduced.addEventListener('change',start);
 if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{const next=entry.isIntersecting;if(next!==visible){visible=next;start();}},{threshold:0}).observe(stage.closest('.pro-grid'));
 else{visible=true;start();}
})();
