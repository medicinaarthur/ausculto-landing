(() => {
 const root=document.querySelector('[data-academy-testimonials]');if(!root)return;
 const slides=[...root.querySelectorAll('[data-testimonial-slide]')],dots=[...root.querySelectorAll('[data-testimonial-dot]')];
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');let index=0,timer=0,visible=false;
 function schedule(){clearTimeout(timer);if(visible&&!document.hidden&&!reduced.matches)timer=setTimeout(()=>show((index+1)%slides.length),6500);}
 function show(next){index=next;slides.forEach((s,i)=>{s.classList.toggle('is-active',i===index);s.setAttribute('aria-hidden',String(i!==index));});dots.forEach((d,i)=>d.setAttribute('aria-pressed',String(i===index)));schedule();}
 dots.forEach((d,i)=>d.addEventListener('click',()=>show(i)));
 root.addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();show((index+(e.key==='ArrowRight'?1:slides.length-1))%slides.length);dots[index].focus();}});
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.2}).observe(root);
 document.addEventListener('visibilitychange',schedule);reduced.addEventListener('change',schedule);
 root.classList.add('at-enhanced');root.querySelector('.at-dots').hidden=false;show(0);
})();
