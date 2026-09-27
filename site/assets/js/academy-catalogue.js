/* Pure selection is shared with tests; enhancement never removes static links. */
(() => {
  const normalize=text=>String(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR');
  function selectCatalogue(rows,{query='',area='',limit=9}={}){
    const term=normalize(query.trim());
    const matches=rows.filter(row=>(!area||row.area===area)&&normalize(row.title).includes(term));
    return {matches,visible:matches.slice(0,limit)};
  }
  if(typeof module!=='undefined')module.exports={selectCatalogue};
  if(typeof document==='undefined')return;
  const search=document.getElementById('catalogue-search'),area=document.getElementById('catalogue-area'),more=document.getElementById('catalogue-more');
  if(!search||!area||!more)return;
  const rows=[...document.querySelectorAll('.catalogue-list li')].map(el=>({el,title:el.dataset.title,area:el.dataset.area}));
  const phone=matchMedia('(max-width:600px)');
  let pageSize=phone.matches?3:9,limit=pageSize;
  function render(){
    const {matches,visible}=selectCatalogue(rows,{query:search.value,area:area.value,limit});
    const shown=new Set(visible);
    rows.forEach(row=>row.el.hidden=!shown.has(row));
    document.getElementById('catalogue-status').textContent=`Exibindo ${visible.length} de ${matches.length} temas${area.value?' nesta área':''}.`;
    document.getElementById('catalogue-empty').hidden=matches.length>0;
    more.hidden=visible.length>=matches.length;
    more.textContent='Mostrar mais temas';
  }
  function reset(){limit=pageSize;render();}
  search.addEventListener('input',reset);area.addEventListener('change',reset);
  phone.addEventListener('change',()=>{pageSize=phone.matches?3:9;reset();});
  more.addEventListener('click',()=>{
    const before=new Set(rows.filter(r=>!r.el.hidden));limit+=pageSize;render();
    rows.find(r=>!r.el.hidden&&!before.has(r))?.el.querySelector('a').focus();
  });
  document.querySelectorAll('[data-area-shortcut]').forEach(button=>button.addEventListener('click',()=>{
    area.value=button.dataset.areaShortcut;reset();
    document.getElementById('acervo').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth',block:'start'});
    search.focus({preventScroll:true});
  }));
  document.querySelectorAll('[data-catalogue-reset]').forEach(button=>button.addEventListener('click',()=>{search.value='';area.value='';reset();search.focus();}));
  render();
})();

if(typeof document!=='undefined')document.querySelector('[data-ecg-expand]')?.addEventListener('click',()=>{document.getElementById('ecg-modules').open=true;});
