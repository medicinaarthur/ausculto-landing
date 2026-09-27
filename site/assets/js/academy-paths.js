(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion:reduce)'),desktop=matchMedia('(hover:hover) and (pointer:fine) and (min-width:768px)');
 document.documentElement.classList.add('paths-enhanced');
 const residency=document.querySelector('[data-residency-block]');
 if(residency){
  const reveal=()=>residency.classList.add('is-hand-visible');
  if(reduced.matches||!('IntersectionObserver'in window))reveal();
  else{const marker=document.createElement('span');marker.style.cssText='position:absolute;top:50%;left:0;width:1px;height:1px;pointer-events:none';residency.append(marker);const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){reveal();observer.disconnect();}},{rootMargin:'-49% 0px -49% 0px'});observer.observe(marker);}
 }
 const book=document.querySelector('[data-enamed-book]');
 if(book){
  let token=0,open=false;
  const images=[...book.querySelectorAll('.enamed-book-half>img,.enamed-book-open>img')];
  const paint=value=>{book.dataset.state=value?'open':'closed';book.setAttribute('aria-pressed',String(value));book.setAttribute('aria-label',`${value?'Fechar':'Abrir'} livro: seleção de temas da Academy`);};
  async function setOpen(value){const request=++token;open=value;if(!value){paint(false);return;}
   try{images.forEach(i=>i.loading='eager');await Promise.all(images.map(i=>i.decode()));if(request!==token)return;if(!reduced.matches){book.dataset.state='half';await new Promise(resolve=>setTimeout(resolve,180));}if(request===token){paint(true);book.removeAttribute('data-asset-unavailable');}}
   catch{if(request===token){open=false;paint(false);book.dataset.assetUnavailable='true';book.setAttribute('aria-label','Apresentação do livro indisponível; explore ENAMED pelo botão abaixo');}}
  }
  book.addEventListener('pointerenter',e=>{if(desktop.matches&&e.pointerType==='mouse')setOpen(true);});
  book.addEventListener('pointerleave',e=>{if(desktop.matches&&e.pointerType==='mouse'&&!book.matches(':focus-visible'))setOpen(false);});
  book.addEventListener('focus',()=>{if(desktop.matches)setOpen(true);});book.addEventListener('blur',()=>{if(desktop.matches&&!book.matches(':hover'))setOpen(false);});
  book.addEventListener('click',e=>{if(!desktop.matches||e.detail===0||e.pointerType==='touch')setOpen(!open);});
  book.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();setOpen(false);}});
  if('IntersectionObserver'in window){const observer=new IntersectionObserver(([entry])=>{if(!desktop.matches&&entry.intersectionRatio>=.5){setOpen(true);observer.disconnect();}},{threshold:.5});observer.observe(book);}
 }
 const gallery=document.querySelector('[data-bank-gallery]');
 if(gallery){
  const viewport=gallery.querySelector('.bank-gallery-window'),track=gallery.querySelector('[data-bank-track]'),pause=gallery.querySelector('[data-bank-pause]');
  let visible=false,paused=false,hovered=false,frame=0,last=0,loopWidth=0;
  const mayRun=()=>desktop.matches&&!reduced.matches&&visible&&!document.hidden&&!paused&&!hovered&&!gallery.contains(document.activeElement);
  function stop(){cancelAnimationFrame(frame);frame=0;last=0;}
  function tick(now){if(!mayRun()){stop();return;}if(last)viewport.scrollLeft+=(now-last)*.026;last=now;if(loopWidth&&viewport.scrollLeft>=loopWidth)viewport.scrollLeft-=loopWidth;frame=requestAnimationFrame(tick);}
  function sync(){pause.hidden=!desktop.matches||reduced.matches;if(mayRun()&&!frame)frame=requestAnimationFrame(tick);else if(!mayRun())stop();}
  function clones(){track.querySelectorAll('[data-bank-clone]').forEach(n=>n.remove());if(desktop.matches&&!reduced.matches){const originals=[...track.children];for(const item of originals){const clone=item.cloneNode(true);clone.dataset.bankClone='true';clone.setAttribute('aria-hidden','true');clone.inert=true;clone.querySelectorAll('a').forEach(a=>a.tabIndex=-1);track.append(clone);}loopWidth=track.querySelector('[data-bank-clone]').offsetLeft-track.firstElementChild.offsetLeft;}else loopWidth=0;sync();}
  gallery.querySelector('[data-bank-prev]').addEventListener('click',()=>viewport.scrollBy({left:-viewport.clientWidth*.8,behavior:reduced.matches?'instant':'smooth'}));
  gallery.querySelector('[data-bank-next]').addEventListener('click',()=>viewport.scrollBy({left:viewport.clientWidth*.8,behavior:reduced.matches?'instant':'smooth'}));
  pause.addEventListener('click',()=>{paused=!paused;pause.setAttribute('aria-pressed',String(paused));pause.textContent=paused?'Retomar':'Pausar';pause.setAttribute('aria-label',`${paused?'Retomar':'Pausar'} apresentação das bancas`);sync();});
  gallery.addEventListener('pointerenter',()=>{hovered=true;sync();});gallery.addEventListener('pointerleave',()=>{hovered=false;sync();});gallery.addEventListener('focusin',sync);gallery.addEventListener('focusout',()=>queueMicrotask(sync));document.addEventListener('visibilitychange',sync);desktop.addEventListener('change',clones);reduced.addEventListener('change',clones);
  if('IntersectionObserver'in window)new IntersectionObserver(([e])=>{visible=e.isIntersecting;sync();}).observe(gallery);else visible=true;
  new ResizeObserver(()=>{const clone=track.querySelector('[data-bank-clone]');if(clone)loopWidth=clone.offsetLeft-track.firstElementChild.offsetLeft;}).observe(viewport);clones();
 }
 // Measured screen corners on the generated 1453×1086 device plate. Project the real capture, untouched.
 const screen=document.querySelector('.tools-live-screen'),plate=document.querySelector('.tools-device-plate');
 if(screen&&plate){const position=()=>{const W=plate.clientWidth,H=plate.clientHeight;if(!W||!H)return;const [[x0,y0],[x1,y1],[x2,y2],[x3,y3]]=[[.357,.231],[.872,.214],[.854,.696],[.326,.677]].map(([x,y])=>[x*W,y*H]);const dx1=x1-x2,dx2=x3-x2,dx3=x0-x1+x2-x3,dy1=y1-y2,dy2=y3-y2,dy3=y0-y1+y2-y3,den=dx1*dy2-dx2*dy1,g=(dx3*dy2-dx2*dy3)/den,h=(dx1*dy3-dx3*dy1)/den;const a=x1-x0+g*x1,b=x3-x0+h*x3,d=y1-y0+g*y1,e=y3-y0+h*y3;screen.style.width=W+'px';screen.style.height=H+'px';screen.style.transform=`matrix3d(${a/W},${d/W},0,${g/W},${b/H},${e/H},0,${h/H},0,0,1,0,${x0},${y0},0,1)`;screen.classList.add('is-positioned');};plate.addEventListener('load',position);new ResizeObserver(position).observe(plate);position();}
})();
