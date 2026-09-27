import {publicAsset,presentationText,validateFigureOverrides} from './academy-figure-overrides.mjs';
import {book} from './academy-books.mjs';
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { renderMarkdown } from "./academy-markdown.mjs";
import { page, escapeHtml as esc, origin } from "./academy-articles.mjs";
import { validateIllustrations, renderIllustrations } from './academy-illustrations.mjs';
export const presentation = JSON.parse(
  readFileSync(
    new URL("./data/academy-presentation.json", import.meta.url),
    "utf8",
  ),
);
export const areas = {
  "ciencias-basicas": "Ciências básicas",
  cirurgia: "Cirurgia",
  "clinica-medica": "Clínica médica",
  "ginecologia-e-obstetricia": "Ginecologia e obstetrícia",
  "medicina-preventiva-e-saude-coletiva":
    "Medicina preventiva e saúde coletiva",
  pediatria: "Pediatria",
  "cirurgia-geral": "Cirurgia geral",
  ortopedia: "Ortopedia",
  "medicina-preventiva": "Medicina preventiva",
};
export const appLink = (id) =>
  "https://app.auscultoapp.com/" +
  (id ? "?returnTo=" + encodeURIComponent("academy-summary:" + id) : "");
const digest = (value) => createHash("sha256").update(value).digest("hex");
export function validatePresentation(p = presentation) {
  const entries=[...(p.catalogue||[]),...(p.ecgModules||[])];
  if(p.kind!=='public-presentation'||p.applicationPublicationChanged!==false||!p.source||entries.length!==p.source.entryCount||p.catalogue.length!==p.source.themeCount||p.ecgModules.length!==p.source.ecgCount||new Set(entries.map(s=>s.summaryId)).size!==entries.length)throw Error('Invalid presentation catalogue');
  const ordered=[...entries].sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
  if(digest(JSON.stringify(ordered))!==p.source.catalogueSha256)throw Error('Catalogue drift');
  for(const s of entries)if(!/^[a-z0-9-]+$/.test(s.summaryId)||!areas[s.largeArea]||!s.title||!s.version||s.published!==true||s.releaseId!==p.source.releaseId)throw Error('Invalid catalogue metadata');
  if(p.articles.length!==3||new Set(p.articles.map(a=>a.summaryId)).size!==3)throw Error('Invalid public selection');
  const allowed=['abdome-agudo','disturbios-eletroliticos-e-acido-base','estudos-epidemiologicos'];
  for(const a of p.articles){
    const s=p.catalogue.find(s=>s.summaryId===a.summaryId&&s.version===a.version);
    if(!s||!allowed.includes(a.summaryId)||a.author.type!=='Organization'||a.blocks.length!==s.sectionCount||a.sourceBlockHashes.length!==s.sectionCount||digest(a.referencesMarkdown)!==a.referenceSha256)throw Error('Invalid public article');
    if(new Set(a.blocks.map(b=>b.id)).size!==a.blocks.length)throw Error('Duplicate block');
    a.blocks.forEach((b,i)=>{
      if(digest(b.text)!==b.selectedTextSha256||b.sourceSha256!==a.sourceBlockHashes[i])throw Error('Selected public text drift');
      if(!/^section-\d{3}$/.test(b.id))throw Error('Invalid block ID');
      const original=b.text.replace(/\/assets\/academy\/material\/[a-z0-9-]+\.(?:png|jpe?g|webp)/g,url=>'academy-asset:'+p.assets.find(a=>a.url===url)?.sha256);
      if(digest(original)!==b.sourceSha256)throw Error('Public section drift');renderMarkdown(b.text);
    });
  }
  if(new Set(p.assets.map(a=>a.url)).size!==p.assets.length)throw Error('Duplicate asset');
  for(const a of p.assets){
    if(!/^\/assets\/academy\/material\/[a-z0-9-]+\.(?:png|jpe?g|webp)$/.test(a.url))throw Error('Unsafe public asset');
    if(digest(readFileSync(new URL('../site'+a.url,import.meta.url)))!==a.sha256)throw Error('Public asset drift');
  }
  return p;
}
export function articleLinks({excludeId}={}) {
 return `<div class="articles editorial-readings">${presentation.articles.filter(a=>a.summaryId!==excludeId).map(a=>`<article class="editorial-reading"><div class="editorial-book">${book(a)}<span class="book-disclosure">Passe o mouse ou toque para abrir o livro</span></div><div class="editorial-reading__copy"><span class="editorial-area">${esc(areas[a.largeArea])}</span><h3>${esc(a.title)}</h3><p>${esc(a.description)}</p><span class="editorial-meta">${a.readingMinutes} min de leitura · tema completo gratuito</span><a class="editorial-reading__link" href="/conteudos/${a.summaryId}/">Ler agora →</a><details class="editorial-material"><summary>Ver uma imagem do material</summary><img src="${publicAsset(a.assets[0].url)}" alt="${esc(a.title)}" loading="lazy"></details></div></article>`).join('')}</div>`;
}
function studyTools(id){return `<div class="study-review" data-study-block="${id}"><span class="study-review__label">Sua revisão</span><label><input type="checkbox" data-study-done disabled> Concluí esta seção</label><button type="button" data-study-note disabled aria-expanded="false" aria-controls="note-${id}">Anotar</button><button type="button" data-study-current disabled>Marcar como atual</button><div class="study-note" id="note-${id}" hidden><label for="textarea-${id}">Anotação desta seção</label><textarea id="textarea-${id}" data-study-text rows="4" placeholder="Registre suas conexões e pontos para revisar." disabled></textarea><span data-study-status role="status"></span></div></div>`;}
export function renderPresentationIndex(){
 return page({title:'Conheça a Academy estudando | Ausculto',description:'Três temas completos e gratuitos, com imagens, tabelas e referências. Leia sem cadastro e conheça a Ausculto Academy.',path:'/conteudos/',features:{books:true},ogImage:publicAsset(presentation.articles[0].assets[0].url),body:`<section class="academy-catalogue editorial-portal"><div class="wrap"><header class="portal-intro"><p class="kicker">AUSCULTO ACADEMY · LEITURA GRATUITA</p><h1>Conheça a Academy <em>estudando.</em></h1><p class="lead">Três temas completos e gratuitos, com imagens, tabelas e referências. Comece a ler, sem cadastro.</p><div class="portal-proof"><span>Conteúdo publicado na Academy</span><span>Referências para aprofundar</span><span>Leitura no seu ritmo</span></div></header>${articleLinks()}<section class="portal-next" aria-labelledby="portal-next-title"><p class="kicker">SEU PRÓXIMO PASSO</p><h2 id="portal-next-title">Leve a leitura para a sua rotina de estudo.</h2><div><a href="/estudantes/#material"><strong>Explore a biblioteca →</strong><span>150+ temas organizados para sua formação.</span></a><a href="/estudantes/#simulados-demo"><strong>Conheça os simulados →</strong><span>Veja como escolher modo, banca e tamanho.</span></a><a href="${appLink()}"><strong>Conheça o app ↗</strong><span>Questões, flashcards e estudo em um só lugar.</span></a></div></section></div></section>`});
}
export function renderPresentationArticles() {
 validatePresentation();
 validateIllustrations();
 validateFigureOverrides(presentation);
 return presentation.articles.map(a=>{
  const path=`/conteudos/${a.summaryId}/`;
  const toc=a.blocks.map(b=>`<li><a href="#${b.id}">${esc(b.title)}</a></li>`).join('');
  const coverText=renderMarkdown(a.blocks[0].text.replace(/^# [^\n]*\n/,""));
  const blocks=`<section id="${a.blocks[0].id}" class="reader-section">${coverText}${studyTools(a.blocks[0].id)}</section>`+a.blocks.slice(1).map(b=>`<section id="${b.id}" class="reader-section">${renderMarkdown(presentationText(a,b)).replace(/<h1>/g,'<h2>').replace(/<\/h1>/g,'</h2>')}${renderIllustrations(a.summaryId,b.id)}${studyTools(b.id)}</section>`).join('');
  const reviewed=a.reviewedAt?new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(a.reviewedAt+'T12:00:00Z')):'';
  return {path:path.slice(1)+'index.html',html:page({title:a.title,description:a.description,path,features:{books:true},ogImage:publicAsset(a.assets[0].url),structured:{'@context':'https://schema.org','@type':'Article',headline:a.title,description:a.description,mainEntityOfPage:origin+path,author:{'@type':'Organization',name:a.author.name},...(a.reviewedAt?{dateModified:a.reviewedAt}:{}),...(a.reviewer?{reviewedBy:{'@type':'Person',name:a.reviewer}}:{}),publisher:{'@type':'Organization',name:'Ausculto Academy'},image:origin+publicAsset(a.assets[0].url),isAccessibleForFree:true,inLanguage:'pt-BR'},body:`<article class="academy-article reader-article" data-study-topic="${a.summaryId}" data-study-version="${a.version}"><header class="academy-article__intro reader-intro"><div class="reader-cover-inner"><a href="/conteudos/">← Leituras gratuitas</a><p class="kicker">${esc(areas[a.largeArea])} · TEMA COMPLETO GRATUITO</p><h1>${esc(a.title)}</h1><p class="lead">${esc(a.description)}</p><p class="byline">Por <strong>${esc(a.author.name)}</strong>${a.reviewer?` · Revisão: ${esc(a.reviewer)}`:''}${a.reviewedAt?`<br>Revisado em <time datetime="${a.reviewedAt}">${reviewed}</time>`:''} · ${a.readingMinutes} min de leitura</p></div></header><div class="reader-layout"><aside class="reader-toc"><details open data-reader-toc><summary>Neste tema <span aria-hidden="true">⌄</span></summary><nav aria-label="Neste tema"><ol>${toc}</ol></nav></details></aside><div class="reader-content"><div class="study-toolbar"><label for="study-font">A−</label><input id="study-font" data-study-font type="range" min="85" max="150" step="5" value="100" aria-label="Tamanho do texto" disabled><span>A+</span><output for="study-font" data-study-font-value>100%</output></div><div class="study-notice"><span data-study-storage>Notas e progresso ficam neste navegador, sem sincronização com o app.</span><button type="button" data-study-resume hidden>Retomar leitura →</button><span data-study-progress></span></div><noscript><p>Ative o JavaScript para usar anotações e progresso local.</p></noscript><div class="article-prose">${blocks}</div><p class="note">Material educacional. Consulte as referências e protocolos aplicáveis ao contexto estudado.</p><aside class="continue reader-continue"><p>DA LEITURA AO ESTUDO</p><h2>Estude este tema no Ausculto.</h2><p>Leia com as ferramentas do app, faça anotações e organize sua revisão. O PDF e as ferramentas completas de leitura estão incluídos no PRO.</p><a class="academy-button" href="${appLink(a.summaryId)}">Estudar este tema no app ↗</a><small>O link abre este tema no app. As escolhas e os recursos dependem da sua conta; a leitura feita neste site não sincroniza progresso.</small></aside></div></div></article><section class="section related"><div class="wrap"><p class="kicker">OUTRAS LEITURAS GRATUITAS</p><h2>Continue estudando.</h2>${articleLinks({excludeId:a.summaryId})}<a class="reader-library-link" href="/estudantes/#material">Explorar a biblioteca completa →</a></div></section>`})};
 });
}
