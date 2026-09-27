(() => {
  const levels=['areas','specialties','themes','subthemes'];
  const initialState=()=>({step:0,mode:'exam',scope:'',banks:[],areas:[],specialties:[],themes:[],subthemes:[],difficulties:[],quantity:null});
  const isMixed=s=>s.mode==='exam'&&s.scope==='mixed';
  function options(kind,state,config){
    const index=levels.indexOf(kind);
    return config.nodes.filter(n=>n.kind===kind&&n.banks.some(b=>state.banks.includes(b))&&(index===0||state[levels[index-1]].includes(n.parent)));
  }
  function changeState(previous,patch,config){
    const s={...previous,...patch};
    s.mode=['training','exam'].includes(s.mode)?s.mode:'';
    s.scope=s.mode==='exam'&&['mixed','focused'].includes(s.scope)?s.scope:'';
    s.banks=[...new Set(s.banks)].filter(id=>config.banks.some(b=>b.id===id));
    if(s.mode!=='training')s.banks=s.banks.slice(0,1);
    s.difficulties=[...new Set(s.difficulties)].filter(id=>config.difficulties.some(d=>d.id===id));
    s.step=Math.max(0,Math.min(3,Number(s.step)||0));
    for(let i=0;i<levels.length;i++){
      const key=levels[i];
      const parentChanged=i>0&&levels.slice(0,i).some(k=>patch[k]&&JSON.stringify(previous[k])!==JSON.stringify(patch[k])&&!Object.hasOwn(patch,key));
      s[key]=isMixed(s)||parentChanged?[]:[...new Set(s[key])].filter(id=>options(key,s,config).some(n=>n.id===id));
    }
    const q=s.quantity;
    s.quantity=Number.isInteger(q)&&(isMixed(s)?config.examQuantities.includes(q):q>=config.focusedRange.min&&q<=config.focusedRange.max)?q:null;
    return s;
  }
  function canContinue(s){
    if(s.step===0)return !!s.mode&&(s.mode!=='exam'||!!s.scope);
    if(s.step===1)return s.banks.length>0;
    if(s.step===2)return isMixed(s)||(s.areas.length>0&&s.specialties.length>0);
    return s.difficulties.length>0&&s.quantity!==null;
  }
  if(typeof module!=='undefined')module.exports={initialState,changeState,options,canContinue,isMixed};
  if(typeof document==='undefined')return;
  const form=document.querySelector('[data-sim-demo]');if(!form)return;
  const config=JSON.parse(document.getElementById('sim-preview-data').textContent);
  const e=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state=initialState(),opener,draft=new Set(),activeKind='';
  const titles=['Escolha como praticar','Selecione a banca','Defina seus assuntos','Ajuste sua prova'];
  const labels={areas:'Grande Área',specialties:'Especialidade',themes:'Tema',subthemes:'Subtema'};
  const panel=form.querySelector('[data-sim-panel]'),back=form.querySelector('[data-sim-back]'),next=form.querySelector('[data-sim-next]'),cta=form.querySelector('.sim-demo__cta'),status=form.querySelector('[data-sim-status]');
  const dialog=document.getElementById('sim-selector'),search=dialog.querySelector('input[type=search]'),list=dialog.querySelector('[data-sim-options]');
  const toggle=(arr,id)=>arr.includes(id)?arr.filter(v=>v!==id):[...arr,id];
  const segmented=(name,items,selected)=>`<div class="sim-segments" role="group" aria-label="${name==='mode'?'Modo de estudo':'Composição da prova'}">${items.map(([id,label,detail])=>`<button type="button" data-sim-choice="${name}" data-value="${id}" aria-pressed="${selected===id}"><strong>${label}</strong>${detail?`<small>${detail}</small>`:''}</button>`).join('')}</div>`;
  function path(n){const parts=[n.label];let p=n.parent;while(p){const parent=config.nodes.find(v=>v.id===p);if(!parent)break;parts.unshift(parent.label);p=parent.parent;}return parts.join(' → ');}
  function selection(kind){const names=state[kind].map(id=>config.nodes.find(n=>n.id===id)?.label).filter(Boolean);return names.slice(0,2).join(' · ')+(names.length>2?' · +'+(names.length-2):'');}
  function render(focus=false){
    form.querySelector('[data-sim-heading]').textContent=`${state.step+1}. ${titles[state.step]}`;
    form.querySelectorAll('[data-sim-step]').forEach((el,i)=>{el.setAttribute('aria-current',i===state.step?'step':'false');el.classList.toggle('is-done',i<state.step);});
    let html='';
    if(state.step===0){
      html=segmented('mode',[['exam','Prova','Cronômetro e gabarito ao final'],['training','Treino','Comentário a cada resposta']],state.mode);
      if(state.mode==='exam')html+=`<p class="sim-field-title">Qual é o seu objetivo?</p>`+segmented('scope',[['mixed','Prova mista','Distribuição da banca'],['focused','Prova focada','Você escolhe os assuntos']],state.scope);
      html+=`<p class="sim-help sim-journey-help">${state.mode==='exam'?'Pratique nas condições da prova: cronômetro ativo, gabarito e comentários ao concluir.':'Aprenda a cada questão: receba a correção e o comentário logo após responder.'}</p>`;
    }else if(state.step===1){
      html=`<p class="sim-help">${state.mode==='training'?'Você pode combinar bancas nesta prévia. No app, a combinação é um recurso PRO.':'Escolha uma banca para orientar sua prova.'}</p><div class="sim-banks">${config.banks.map(b=>`<button type="button" data-sim-bank="${b.id}" aria-pressed="${state.banks.includes(b.id)}"><span>${e(b.label)}</span><small>${e(b.description)}</small></button>`).join('')}</div>`;
    }else if(state.step===2){
      if(isMixed(state))html=`<p class="sim-help">Prova mista · composição orientada pelo perfil de ${e(config.banks.find(b=>b.id===state.banks[0])?.label||'sua banca')}.</p><ul class="sim-mix">${config.nodes.filter(n=>n.kind==='areas').map(n=>`<li>${e(n.label)}</li>`).join('')}</ul><p class="sim-help">A distribuição e a cobertura são confirmadas no app.</p>`;
      else html=levels.map((kind,i)=>{
        const enabled=i===0||state[levels[i-1]].length>0;const available=options(kind,state,config);
        return `<div class="sim-scope-field"><span>${i+1}. ${labels[kind]}${i>1?' <small>opcional</small>':''}</span><button type="button" data-sim-select="${kind}" ${!enabled||!available.length?'disabled':''} aria-controls="sim-selector" aria-expanded="false"><span>${e(selection(kind)||(!enabled?'Selecione '+labels[levels[i-1]].toLowerCase()+' primeiro':available.length?'Selecionar':'Sem opções nesta publicação'))}</span><span aria-hidden="true">⌄</span></button></div>`;
      }).join('');
    }else{
      html=`<p class="sim-field-title">Níveis de dificuldade</p><div class="sim-difficulties" role="group" aria-label="Dificuldade">${config.difficulties.map(d=>`<button type="button" data-sim-difficulty="${d.id}" aria-pressed="${state.difficulties.includes(d.id)}">${e(d.label)}</button>`).join('')}</div><p class="sim-field-title">Número de questões</p>`;
      if(isMixed(state))html+=`<div class="sim-difficulties" role="group" aria-label="Número de questões">${config.examQuantities.map(n=>`<button type="button" data-sim-quantity="${n}" aria-pressed="${state.quantity===n}">${n}</button>`).join('')}</div>`;
      else html+=`<div class="sim-quantity"><button type="button" data-sim-delta="-1" aria-label="Diminuir questões">−</button><input type="number" id="sim-quantity" aria-label="Número de questões" min="1" max="30" step="1" placeholder="1 a 30" value="${state.quantity??''}"><button type="button" data-sim-delta="1" aria-label="Aumentar questões">+</button></div>`;
      html+=`<div class="sim-review"><strong>Sua configuração</strong><p>${e(state.mode==='training'?'Treino':'Prova '+(isMixed(state)?'mista':'focada'))} · ${e(state.banks.map(id=>config.banks.find(b=>b.id===id)?.label).join(' + '))}</p>${!isMixed(state)?`<details class="sim-review-scope"><summary>Ver escopo selecionado</summary><p>${e(levels.map(selection).filter(Boolean).join(' → '))}</p></details>`:''}<p data-sim-review-volume></p></div>`;
    }
    panel.innerHTML=html;back.hidden=state.step===0;next.hidden=state.step===3;cta.hidden=state.step!==3||!canContinue(state);
    next.disabled=!canContinue(state);updateVolume();
    if(focus)form.querySelector('[data-sim-heading]').focus();
  }
  function updateVolume(){
    const text=form.querySelector('[data-sim-review-volume]');if(text)text.textContent=`${state.quantity??'Escolha o volume'}${state.quantity?' questões':''} · ${state.difficulties.map(id=>config.difficulties.find(d=>d.id===id).label).join(', ')||'Escolha a dificuldade'}`;
    cta.hidden=state.step!==3||!canContinue(state);
  }
  function set(patch){const active=document.activeElement;const focusKey=['simChoice','simBank','simDifficulty','simQuantity','simDelta'].find(key=>active?.dataset?.[key]);const focusValue=focusKey?active.dataset[focusKey]:null;const choiceValue=active?.dataset?.value;const old=state;state=changeState(state,patch,config);if(patch.banks&&levels.some(k=>old[k].length!==state[k].length))status.textContent='Filtros incompatíveis com as novas bancas foram removidos.';else status.textContent='';render();if(focusKey){const attribute='data-'+focusKey.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());form.querySelector(`[${attribute}="${CSS.escape(focusValue)}"]${choiceValue?`[data-value="${CSS.escape(choiceValue)}"]`:''}`)?.focus({preventScroll:true});}}
  form.addEventListener('submit',event=>event.preventDefault());
  form.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.simChoice)set({[b.dataset.simChoice]:b.dataset.value});
    else if(b.dataset.simBank)set({banks:state.mode==='training'?toggle(state.banks,b.dataset.simBank):[b.dataset.simBank]});
    else if(b.dataset.simDifficulty)set({difficulties:toggle(state.difficulties,b.dataset.simDifficulty)});
    else if(b.dataset.simQuantity)set({quantity:Number(b.dataset.simQuantity)});
    else if(b.dataset.simDelta)set({quantity:Math.min(30,Math.max(1,(state.quantity??0)+Number(b.dataset.simDelta)))});
    else if(b.dataset.simSelect){opener=b;activeKind=b.dataset.simSelect;draft=new Set(state[activeKind]);dialog.querySelector('h5').textContent=labels[activeKind];search.value='';renderOptions();dialog.hidden=false;panel.hidden=true;form.dataset.selecting='true';b.setAttribute('aria-expanded','true');search.focus({preventScroll:true});}
  });
  form.addEventListener('input',event=>{if(event.target.id==='sim-quantity'){state=changeState(state,{quantity:event.target.value===''?null:Number(event.target.value)},config);updateVolume();}});
  next.addEventListener('click',()=>{if(canContinue(state)){state.step++;render(true);}});
  back.addEventListener('click',()=>{state.step--;render(true);});
  function renderOptions(){
    const norm=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
    const found=options(activeKind,state,config).filter(n=>norm(path(n)).includes(norm(search.value)));
    list.innerHTML=found.length?found.map(n=>`<label class="sim-option"><input type="checkbox" value="${e(n.id)}" ${draft.has(n.id)?'checked':''}><span><strong>${e(n.label)}</strong>${n.parent?`<small>${e(path(n))}</small>`:''}</span></label>`).join(''):'<p>Nenhuma opção com essa busca.</p>';
    dialog.querySelector('[data-sim-selection-count]').textContent=`${draft.size} selecionado${draft.size===1?'':'s'}`;
  }
  search.addEventListener('input',renderOptions);
  list.addEventListener('change',event=>{if(event.target.checked)draft.add(event.target.value);else draft.delete(event.target.value);dialog.querySelector('[data-sim-selection-count]').textContent=`${draft.size} ${draft.size===1?'selecionado':'selecionados'}`;});
  dialog.querySelector('[data-sim-apply]').addEventListener('click',()=>{set({[activeKind]:[...draft]});closeSelector();});
  dialog.querySelector('[data-sim-clear]').addEventListener('click',()=>{draft.clear();renderOptions();});
  function closeSelector(){dialog.hidden=true;panel.hidden=false;delete form.dataset.selecting;const field=form.querySelector(`[data-sim-select="${activeKind}"]`);field?.setAttribute('aria-expanded','false');(field||opener)?.focus({preventScroll:true});}
  dialog.querySelector('[data-sim-cancel]').addEventListener('click',closeSelector);
  dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();closeSelector();}});
  render();
})();
