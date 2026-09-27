(() => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const studio=document.querySelector('[data-practice-studio]');
 if(studio){
  const tabs=[...studio.querySelectorAll('[data-studio-tab]')],panels=[...studio.querySelectorAll('[data-studio-panel]')];
  const bar=studio.querySelector('[data-studio-tabs]');bar.hidden=false;bar.setAttribute('role','tablist');
  const select=i=>{tabs.forEach((t,n)=>{t.setAttribute('aria-selected',String(i===n));t.tabIndex=i===n?0:-1;panels[n].hidden=i!==n;});};
  tabs.forEach((t,i)=>{t.setAttribute('role','tab');t.setAttribute('aria-controls',panels[i].id);panels[i].setAttribute('role','tabpanel');panels[i].setAttribute('aria-labelledby',t.id);t.addEventListener('click',()=>select(i));t.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();select(i);}});});
  select(0);
 }
})();
