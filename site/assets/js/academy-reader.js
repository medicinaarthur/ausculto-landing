(() => {
  const toc=document.querySelector('[data-reader-toc]');
  if(toc){
    const wide=matchMedia('(min-width:1100px)');
    const adapt=()=>toc.open=wide.matches;adapt();wide.addEventListener('change',adapt);
    // academy.js preserves campaign parameters and normalizes links to absolute URLs.
    const links=[...toc.querySelectorAll('a[href]')].filter(a=>a.hash&&a.pathname===location.pathname);
    const sections=links.map(a=>document.getElementById(a.hash.slice(1))).filter(Boolean);
    let scheduled=false,current;
    function sync(){
      scheduled=false;
      const threshold=(document.querySelector('[data-atb]')?.offsetHeight||64)+40;
      const active=sections.filter(s=>s.getBoundingClientRect().top<=threshold).pop()||sections[0];
      if(!active||active.id===current)return;
      current=active.id;
      links.forEach(a=>{
        if(a.hash.slice(1)===current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');
      });
      if(wide.matches){
        const link=links.find(a=>a.hasAttribute('aria-current')),nav=toc.querySelector('nav');
        const y=link.offsetTop-nav.offsetTop;
        if(y<nav.scrollTop)nav.scrollTop=y;
        else if(y+link.offsetHeight>nav.scrollTop+nav.clientHeight)nav.scrollTop=y+link.offsetHeight-nav.clientHeight;
      }
    }
    addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(sync);}},{passive:true});
    addEventListener('resize',sync);sync();
  }
  const dialog=document.getElementById('material-zoom');
  if(!dialog||typeof dialog.showModal!=='function')return;
  let opener;
  document.querySelectorAll('.article-prose img').forEach(img=>{
    const button=document.createElement('button');
    button.type='button';button.className='zoom-button';button.textContent='Ampliar imagem ⤢';button.setAttribute('aria-haspopup','dialog');
    button.setAttribute('aria-controls','material-zoom');
    img.after(button);
    button.addEventListener('click',()=>{
      opener=button;
      const zoom=document.getElementById('zoom-image');zoom.src=img.currentSrc||img.src;zoom.alt=img.alt;
      document.getElementById('zoom-title').textContent=img.alt||'Imagem do tema';
      dialog.showModal();document.getElementById('zoom-close').focus();
    });
  });
  document.getElementById('zoom-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  dialog.addEventListener('close',()=>opener?.focus());
})();
