/* Voluntary context swap; the artwork owns physical perspective and shadows. */
(() => {
  const root=document.querySelector('[data-home-hero="mobile"]');
  if(!root||root.dataset.ready)return;
  const controls=root.querySelector('[data-hero-tabs]');
  const tabs=[...root.querySelectorAll('[data-hero-tab]')];
  const panels=[...root.querySelectorAll('[data-hero-panel]')];
  const proofs=[...root.querySelectorAll('[data-hero-proof]')];
  let state='prova';
  function select(next,focus=false){
    if(!['prova','plantao'].includes(next))return;
    state=next;root.dataset.state=state;
    tabs.forEach(tab=>{const active=tab.dataset.heroTab===state;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&focus)tab.focus({preventScroll:true});});
    panels.forEach(panel=>{const active=panel.dataset.heroPanel===state;panel.classList.toggle('is-secondary',!active);panel.setAttribute('aria-hidden',String(!active));panel.inert=!active;});
    proofs.forEach(proof=>{const inactive=proof.dataset.heroProof!==state;proof.classList.toggle('is-inactive',inactive);proof.setAttribute('aria-hidden',String(inactive));});
  }
  controls.setAttribute('role','tablist');controls.setAttribute('aria-label','Conheça o Ausculto em cada momento');
  tabs.forEach(tab=>{
    tab.setAttribute('role','tab');tab.setAttribute('aria-controls','m-hero-panel-'+tab.dataset.heroTab);
    tab.addEventListener('click',()=>select(tab.dataset.heroTab));
    tab.addEventListener('keydown',event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();select(event.key==='Home'?'plantao':event.key==='End'?'prova':state==='prova'?'plantao':'prova',true);});
  });
  panels.forEach(panel=>{
    panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby','m-hero-tab-'+panel.dataset.heroPanel);
    const img=panel.querySelector('img');const fail=()=>panel.classList.add('is-unavailable');
    img.addEventListener('error',fail);img.addEventListener('load',()=>{if(img.naturalWidth>1)panel.classList.remove('is-unavailable');});
    if(img.complete&&!img.naturalWidth)fail();
  });
  select(state);root.classList.add('is-enhanced');root.dataset.ready='true';controls.hidden=false;
  function retry(){
    if(!root.getClientRects().length)return;
    root.querySelectorAll('.is-unavailable picture source[srcset]').forEach(source=>{
      if(source.srcset.startsWith('data:'))return;
      source.srcset=source.srcset.split(',').map(candidate=>{
        const[path,size]=candidate.trim().split(/\s+/);const url=new URL(path,location.href);url.searchParams.set('retry',Date.now());return url.href+' '+size;
      }).join(', ');
    });
  }
  addEventListener('online',retry);matchMedia('(max-width:1023.98px)').addEventListener('change',retry);
})();
