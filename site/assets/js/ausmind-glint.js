(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('[data-ausmind-glint]').forEach(card=>{
  let visible=false,repeat,finish;
  function pause(){clearTimeout(repeat);clearTimeout(finish);card.classList.remove('is-glinting');card.dataset.glintState=reduced.matches?'static':'paused';}
  function pulse(){
   if(!visible||document.hidden||reduced.matches){pause();return;}
   card.dataset.glintState='running';card.classList.add('is-glinting');
   finish=setTimeout(()=>card.classList.remove('is-glinting'),2600);
   repeat=setTimeout(pulse,9000);
  }
  function resume(){pause();if(visible&&!document.hidden&&!reduced.matches)repeat=setTimeout(pulse,1200);}
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;resume();},{threshold:.1});observer.observe(card);
  document.addEventListener('visibilitychange',resume);reduced.addEventListener('change',resume);pause();
 });
})();
