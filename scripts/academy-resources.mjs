import {readFileSync} from 'node:fs';
import {escapeHtml as esc} from './academy-articles.mjs';
export const resourceManifest=JSON.parse(readFileSync(new URL('./data/academy-resources.json',import.meta.url),'utf8'));
export const resourceAssets=['assets/css/academy-resources.css','assets/js/academy-resources.js',...resourceManifest.cards.flatMap(c=>(c.variants||[]).map(v=>v.url.slice(1)))];
const arrow='<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>';
function media(c){
 const v=c.variants.at(-1);
 return `<img src="${v.url}" srcset="${c.variants.map(v=>`${v.url} ${v.width}w`).join(', ')}" sizes="(max-width: 700px) 220px, 304px" width="${v.width}" height="${v.height}" alt="${esc(c.title)}" loading="lazy" decoding="async" style="object-fit:${c.fit||'cover'};object-position:${c.position||'50% 50%'}">`;
}
function trajectory(u){
 const latest=u.weekly.at(-1),accuracy=Math.round(latest.correct/latest.answers*100);
 const points=u.weekly.map((p,i)=>({x:24+i*34,y:18+(1-p.correct/p.answers)*70,...p}));
 const path=points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y.toFixed(2)}`).join(' ');
 return `<span class="am-chart-summary"><strong>${accuracy}<span>%</span></strong><span>acurácia<br><b>na última semana</b></span><span class="am-chart-volume"><b>${latest.answers}</b> questões<br><b>${latest.correct}</b> acertos</span></span><svg class="am-trajectory" viewBox="0 0 284 134" role="img" aria-label="Oito semanas de demonstração, acurácia entre 79 e 83 por cento; última semana 26 acertos em 32 questões."><g stroke="#c5d0df" stroke-width=".65" stroke-dasharray="2 4"><path d="M24 18H265M24 53H265M24 88H265"/></g><g fill="#61738d" font-family="Inter,sans-serif" font-size="7"><text x="0" y="20">100</text><text x="5" y="55">50</text><text x="9" y="90">0</text></g><path d="${path} L262 88H24Z" fill="#537edc" fill-opacity=".10"/><path d="${path}" fill="none" stroke="#325b9c" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>${points.map((p,i)=>`<circle cx="${p.x}" cy="${p.y}" r="${i===7?3.7:2.1}" fill="${i===7?'#be903a':'#325b9c'}" stroke="#f4f7fb" stroke-width="1"/><rect x="${p.x-8}" y="${118-p.answers*.55}" width="16" height="${p.answers*.55}" rx="2" fill="${i===7?'#be903a':'#759bcb'}" opacity="${i===7?1:.52}"/>`).join('')}<g fill="#53677f" font-family="Inter,sans-serif" font-size="7"><text x="16" y="131">29 jun</text><text x="231" y="131">17 ago</text><text x="109" y="131">VOLUME SEMANAL</text></g></svg>`;
}
function compactUI(c){
 const u=c.ui;
 let text=esc(u.text||'');
 for(const term of u.highlights||[])text=text.replace(esc(term),`<mark>${esc(term)}</mark>`);
 const rows=(u.rows||[]).map((value,i)=>`<span class="am-ui-row"><i>${u.kind==='review'?(i===1?'×':'✓'):u.kind==='plan'?(i===0?'✓':'○'):'□'}</i><span>${esc(value)}</span>${u.kind==='plan'?`<small>${String(i+1).padStart(2,'0')}</small>`:''}</span>`).join('');
 let body=`<strong class="am-ui-heading">${esc(u.heading)}</strong>${text?`<span class="am-ui-text">${text}</span>`:''}${rows}`;
 if(u.kind==='plan')body=`<strong class="am-ui-heading">${esc(u.heading)}</strong><span class="am-planner-progress"><i></i></span><span class="am-planner-meta">1 de 3 atividades concluídas</span>${u.rows.map((value,i)=>`<span class="am-agenda-row ${i===0?'is-complete':''}"><i>${i===0?'✓':String(i+1).padStart(2,'0')}</i><strong>${esc(value)}</strong><small>${esc(u.durations[i])}</small></span>`).join('')}`;
 if(u.kind==='dossier')body=`<strong class="am-ui-heading">${esc(u.heading)}</strong><span class="am-patient-meta">68 anos <i></i> Hipertensão <i></i> Diabetes</span><span class="am-ui-text">${text}</span>`;
 if(u.kind==='chapter')body=`<span class="am-chapter-media">${media(c)}</span><strong class="am-ui-heading">${esc(u.heading)}</strong><span class="am-chapter-progress"><span>0 de 7 etapas</span><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><span class="am-chapter-steps">Reconheça <b>→</b> Decida <b>→</b> Integre</span>`;
 if(u.kind==='performance')body=trajectory(u);
 if(u.kind==='trailmodule')body=`<span class="am-module-scene">${media(c)}</span><span class="am-module-copy"><strong>Trilha clínica</strong><span>Capítulos, casos-chefe<br>e questões autorais.</span><span class="am-module-progress"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span><small>12 capítulos para explorar</small></span>`;
 if(u.kind==='review')body=`<span class="am-review-score"><b>67<small>%</small></b><span>Revisão<br>da sessão</span></span><span class="am-review-counts"><span>✓ <b>2</b> acertos</span><span>× <b>1</b> erro</span></span>${rows}`;
 return `<span class="am-ui am-ui--${u.kind} am-ui--${u.tone}" aria-hidden="true"><span class="am-ui-paper"><span class="am-ui-eyebrow">${esc(u.eyebrow)}</span>${body}${u.foot&&u.kind!=='plan'?`<span class="am-ui-foot">${esc(u.foot)}</span>`:''}</span></span>`;
}
function questionPreview(c){
 const u=c.ui,q=u.question;
 const options=Object.entries(q.options).sort(([a],[b])=>a.localeCompare(b));
 const rows=options.map(([key,value])=>`<span class="am-exam-option ${key===q.answer?'is-correct':''}"><b>${esc(key)}</b><span>${esc(value)}</span>${key===q.answer?'<i>✓</i>':''}</span>`).join('');
 let stem=esc(u.excerpt||q.statement);
 for(const term of u.highlights||[])stem=stem.replace(esc(term),`<mark>${esc(term)}</mark>`);
 const isCaio=u.kind==='caio';
 const front=isCaio?`<span class="am-caio-art">${media(c)}</span><span class="am-caio-prompt"><small>Enf. Caio</small><strong>Qual é o ritmo?</strong><span>${stem}</span></span>`:`<span class="am-exam-type">${q.bank==='ENAMED'?'QUESTÃO DO ENAMED':'QUESTÃO DE RESIDÊNCIA'}</span><span class="am-exam-bank"><strong>${esc(q.bank)}</strong><span>${esc(q.year)} <i>·</i> Q${esc(q.number)}</span></span><span class="am-exam-stem">${stem}</span>${u.showOptions?`<span class="am-exam-choices">${options.map(([k,v])=>`<span><b>${esc(k)}</b> ${esc(v)}</span>`).join('')}</span>`:''}`;
 const back=isCaio?`<span class="am-exam-type">TRILHA CLÍNICA · GABARITO</span><strong class="am-answer-title">Qual é o ritmo?</strong><span class="am-exam-options">${rows}</span>`:`<span class="am-exam-type">${esc(q.bank)} ${esc(q.year)} · COMENTÁRIO</span><span class="am-answer-key">${esc(q.answer)} <span>${esc(q.options[q.answer])}</span><i>✓</i></span><span class="am-exam-comment">${esc(u.commentExcerpt)}</span><small class="am-exam-source">Trecho do comentário do acervo</small>`;
 return `<span class="am-flip am-exam-flip"><span class="am-face am-front am-exam-front ${isCaio?'am-caio-front':''}">${front}</span><span class="am-face am-back am-exam-back">${back}</span></span>`;
}
function renderCard(c){
 let inside;
 if(c.type==='flash')inside=`<span class="am-flip"><span class="am-face am-front"><span class="am-flash-topic">${esc(c.title)}</span><span class="am-flash-text">${esc(c.flashcard.question)}</span><span class="am-flash-hint">Pense. Depois, descubra. ${arrow}</span></span><span class="am-face am-back"><span class="am-flash-topic">A resposta</span><span class="am-flash-answer">${esc(c.flashcard.answer)}</span><span class="am-flash-hint">Abra para revisar ${arrow}</span></span></span>`;
 else if(c.type==='question')inside=questionPreview(c);
 else if(c.type==='ui')inside=compactUI(c);
 else inside=media(c);
 const href=c.type==='flash'?`#resource-answer-${c.id}`:'https://app.auscultoapp.com/';
 const accessible=c.type==='flash'?`Abrir flashcard: ${c.flashcard.question}`:`${c.group}: ${c.title}. Abrir no Ausculto`;
 return `<article class="am-card am-card--${c.type} ${c.presentation?'am-card--'+c.presentation:''} ${c.tone?'am-tone--'+c.tone:''}" role="listitem" data-mosaic-card="${c.id}" data-family="${c.family}" data-group="${esc(c.group)}" style="--am-accent:${c.accent}"${c.id==='trilha-clinica'?' id="trilha-clinica"':''}>
 <a class="am-action" href="${href}" aria-label="${esc(accessible)}" data-title="${esc(c.title)}" data-description="${esc(c.description)}"${c.type==='flash'?` data-flash-open="${c.id}"`:''}>
 <span class="am-art"${c.type==='flash'?' aria-hidden="true"':''}>${inside}</span>
 ${['anatomy','ultrasound','scan'].includes(c.presentation)?`<span class="am-medical-finish" aria-hidden="true"><i></i>${c.presentation==='anatomy'?'ATLAS 3D':c.presentation==='ultrasound'?'ULTRASSOM':'NEUROIMAGEM'}</span>`:''}
 <span class="am-card-label" aria-hidden="true"><i></i><span>${esc(c.type==='flash'?'Flashcards':c.group)}</span>${arrow}</span>
 ${c.badge?`<span class="am-badge" aria-hidden="true"><img src="/assets/academy/icons/${c.badge}.svg" width="20" height="20" alt=""></span>`:''}
 ${c.family==='ausculto'?'<span class="am-extra">Também no Ausculto</span>':''}
 ${c.recreated?'<span class="am-demo">Prévia ilustrada</span>':c.demo?'<span class="am-demo">Demonstração</span>':''}
 </a>${c.type==='question'?`<button type="button" class="am-turn" data-card-turn aria-pressed="false" aria-label="Virar ${esc(c.title)}" data-front-label="${c.ui.kind==='caio'?'Ver alternativas':'Ver comentário'}"><span>${c.ui.kind==='caio'?'Ver alternativas':'Ver comentário'}</span> ↻</button>`:''}</article>`;
}
export function renderResources(){
 const {cards}=resourceManifest;
 const columns=Array.from({length:8},(_,i)=>`<div class="am-column" role="presentation">${cards.slice(i*3,i*3+3).map(renderCard).join('')}</div>`).join('');
 const fallback=cards.filter(c=>c.type==='flash').map(c=>`<section data-flash-fallback id="resource-answer-${c.id}"><h3>${esc(c.flashcard.question)}</h3><details><summary>Revelar resposta</summary><p>${esc(c.flashcard.answer)}</p></details><a href="https://app.auscultoapp.com/">Continuar no Ausculto ${arrow}</a></section>`).join('');
 const payload=JSON.stringify(cards.filter(c=>c.type==='flash').map(c=>({id:c.id,...c.flashcard,sampleId:c.id}))).replace(/</g,'\\u003c');
 return `<section class="section academy-toolbox academy-mosaic" id="plataforma" aria-labelledby="resources-title" data-academy-mosaic>
 <div class="wrap"><div class="toolbox-heading"><p class="kicker toolbox-kicker">RECURSOS DA ACADEMY</p><h2 id="resources-title">Para aprender de <em>verdade.</em></h2><p><strong>Sete ferramentas no mesmo app</strong>, para aprender, fixar e aplicar.</p></div></div>
 <div class="am-viewport" tabindex="0" role="region" aria-label="Explore as ferramentas da Academy. Use as setas ou deslize para navegar." data-mosaic-viewport><div class="am-track" role="list" aria-label="Ferramentas e experiências" data-mosaic-track>${columns}</div></div>
 <div class="am-fallback wrap">${fallback}</div>
 <script type="application/json" data-resource-flashcards>${payload}</script>
 <dialog class="am-dialog" id="resource-flash-dialog" aria-labelledby="resource-flash-title"><button type="button" class="am-close" data-flash-close aria-label="Fechar flashcard"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button><span class="am-dialog-category" data-flash-category></span><p class="am-dialog-overline">Uma pausa para lembrar.</p><h2 id="resource-flash-title"></h2><button class="am-reveal" type="button" data-flash-reveal aria-expanded="false" aria-controls="resource-flash-answer">Revelar resposta ${arrow}</button><div id="resource-flash-answer" class="am-dialog-answer" hidden><span>Resposta do acervo</span><p data-flash-answer></p></div><div class="am-dialog-footer"><span>Uma amostra dos flashcards do Ausculto.</span><a href="https://app.auscultoapp.com/">Continuar no Ausculto ${arrow}</a></div></dialog>
 </section>`;
}
