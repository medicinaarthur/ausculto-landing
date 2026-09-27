import {arrow as editorialArrow} from './academy-experience.mjs';
import {publicAsset} from './academy-figure-overrides.mjs';
import {book} from './academy-books.mjs';
import correctionAssets from './data/academy-correction-assets.json' with {type:'json'};
import { productHero, objectivesSection, resourcesSection, aboutSection, product } from "./academy-product.mjs";
import { academyBridge } from "./academy-hero.mjs";
import { presentation, areas, appLink } from "./academy-presentation.mjs";
import { escapeHtml as e } from "./academy-articles.mjs";

const icon = (name, size = 24) => `<img src="/assets/academy/icons/${name}.svg" alt="" width="${size}" height="${size}">`;
const featured = ['abdome-agudo','disturbios-eletroliticos-e-acido-base','estudos-epidemiologicos'].map(id => presentation.articles.find(a => a.summaryId === id));
const publicIds = new Set(featured.map(a => a.summaryId));
function featuredReadings(){
 const coverKeys=['abdome','gasometria','epidemiologia'];
 const shortTitles=['Abdome agudo','Gasometria','Epidemiologia'];
 return `<div class="library-features" data-bookshelf>${featured.map((a,i)=>`<article class="library-feature" data-shelf-item="${i}"><div class="library-book">${book(a)}<a class="reading-cover" href="/conteudos/${a.summaryId}/" aria-label="Ler ${e(a.title)}"><img src="/assets/academy/book-${coverKeys[i]}-cover.webp" alt="" width="460" height="640" loading="lazy"></a><span class="shelf-short-title">${shortTitles[i]}</span><span class="book-disclosure">Selecione o livro para conhecer o tema</span></div><div class="library-copy" id="shelf-detail-${i}"><span class="library-area">${e(areas[a.largeArea])}</span><h3>${e(a.title)}</h3><p>${e(a.description)}</p><span class="study-free">Tema completo · acesso gratuito</span><span class="study-meta">${a.readingMinutes} min de leitura · tabelas, imagem e referências</span><a class="library-link" href="/conteudos/${a.summaryId}/"><span class="reading-link-full">Ler tema completo grátis</span><span class="reading-link-short">Ler mais</span> <span aria-hidden="true">→</span></a><details class="study-real-preview"><summary>Ver uma imagem do material</summary><figure class="study-preview"><img src="${publicAsset(a.assets[0].url)}" alt="Imagem do material publicado: ${e(a.title)}" loading="lazy"><figcaption>Imagem original do material de estudo</figcaption></figure></details></div></article>`).join('')}</div>`;
}
// The catalogue carries production placeholders in some topic lists; they must never reach the page.
const PLACEHOLDER = /^\s*\d{2}[.:]|^(Quadro Comparativo|Tópico Clínico)|^[A-Z][A-Z0-9 _-]{2,}\s\d{2}$|sem confirmação|\bmaterial\b/i;
const previewTopics = (topics = []) => {
  const clean = topics.filter((t) => !PLACEHOLDER.test(t));
  return clean.length >= 2 ? clean.slice(0, 3).join(" · ") : "";
};
const areaIcons = { "ciencias-basicas": "books", cirurgia: "exam", "clinica-medica": "stethoscope", "ginecologia-e-obstetricia": "users-three", "medicina-preventiva-e-saude-coletiva": "chart-bar", pediatria: "graduation-cap" };

// Kept for the ENAMED continuous page (scripts/render-enamed-source.mjs); not used on the Academy landing.
export function materialComposition() {
  return `<div class="collection-stage"><div class="collection-heading"><span>AUSCULTO ACADEMY</span><span>ACERVO PRO</span></div><div class="collection-quantity"><strong>${presentation.catalogue.length}</strong><div>temas do ENAMED<span>Conteúdo organizado em subtemas.</span></div></div><div class="collection-covers"><img class="collection-cover collection-cover--one" src="/assets/academy/material/abdome-agudo-cover.png" width="1200" height="1698" alt="Capa real do resumo Abdome Agudo" fetchpriority="high"><img class="collection-cover collection-cover--two" src="/assets/academy/material/estudos-epidemiologicos-cover.png" width="1200" height="1698" alt="Capa real do resumo Estudos epidemiológicos"><img class="collection-cover collection-cover--three" src="/assets/academy/material/disturbios-eletroliticos-e-acido-base-cover.png" width="1200" height="1698" alt="Capa real do resumo Distúrbios Eletrolíticos e Ácido-Base"></div><a class="collection-link" href="https://www.auscultoapp.com/estudantes/#material">Conheça o material por dentro <span aria-hidden="true">↗</span></a></div>`;
}

function ecgCourse(){return `<section class="ecg-course" id="curso-ecg" aria-labelledby="ecg-title"><picture class="ecg-course__art"><source media="(max-width:600px)" srcset="${correctionAssets.ecg.mobile}"><source media="(max-width:1000px)" srcset="${correctionAssets.ecg.tablet}"><img src="${correctionAssets.ecg.desktop}" width="1536" height="1024" alt="" loading="lazy"></picture><div class="ecg-course__copy"><p class="ecg-course__eyebrow">Curso de ECG · ${presentation.ecgModules.length} módulos</p><h3 id="ecg-title">Eletrocardiograma, do traçado à decisão</h3><p>Diretrizes da SBC, traçados reais do Aehlert e do Hampton e questões de residência comentadas.</p><div class="ecg-course__actions"><a href="${appLink('ecg-01-do-impulso-ao-tracado')}">Começar no app ↗</a><a href="#ecg-modules" data-ecg-expand>Conhecer os módulos ↓</a></div><span class="ecg-course__access">Uma coleção própria da Academy · acesso PRO no app</span></div></section><details id="ecg-modules" class="ecg-modules"><summary>Conhecer os ${presentation.ecgModules.length} módulos</summary><ol>${[...presentation.ecgModules].sort((a,b)=>a.summaryId.localeCompare(b.summaryId)).map(m=>`<li><a href="${appLink(m.summaryId)}">${e(m.title)} ↗</a></li>`).join('')}</ol></details>`;}

function library() {
  return `<section class="section academy-library" id="material"><div class="wrap">
    <div class="library-heading">
      <div class="library-intro"><p class="kicker library-kicker">BIBLIOTECA AUSCULTO ACADEMY</p><h2>Estude por tema, <br><em>do básico à prova.</em></h2><p>150+ temas para estudar com leitura estruturada, imagens e referências. Em três deles, a leitura completa está aberta: <strong>leia agora, sem cadastro.</strong></p><span class="library-count">${presentation.catalogue.length} temas publicados no acervo atual · ECG em uma coleção própria</span></div>
      <ul class="library-promises">
        <li>${icon("books")}<div><strong>Leitura estruturada</strong><span>Com tabelas, imagens e referências</span></div></li>
        <li>${icon("graduation-cap")}<div><strong>Do básico ao avançado</strong><span>Para cada etapa da sua formação</span></div></li>
        <li>${icon("chart-bar")}<div><strong>Foco na prática</strong><span>Casos, questões e aplicação clínica</span></div></li>
      </ul>
    </div>
    <div class="catalogue-controls" id="acervo">
      <label class="catalogue-search"><span class="visually-hidden">Buscar um tema</span><input id="catalogue-search" type="search" placeholder="Qual tema você quer estudar?" autocomplete="off"></label>
      <label class="catalogue-filter"><span class="visually-hidden">Grande área</span><select id="catalogue-area"><option value="">Todas as áreas</option>${Object.entries(areas).map(([id, label]) => `<option value="${id}">${label}</option>`).join("")}</select></label>
      
      <p id="catalogue-status" role="status" aria-live="polite">${presentation.catalogue.length} temas disponíveis para explorar.</p><button class="catalogue-reset" type="button" data-catalogue-reset>Limpar filtros</button>
    </div>
    <div class="library-row"><p class="kicker library-row-kicker">TEMAS EM DESTAQUE</p><a class="library-row-link" href="#catalogue-list">Ver todos os temas <span aria-hidden="true">→</span></a></div>
    ${featuredReadings()}
    ${ecgCourse()}

    <div class="library-row"><p class="kicker library-row-kicker">EXPLORAR POR ÁREA</p><a class="library-row-link" href="#catalogue-list">Ver todas as áreas <span aria-hidden="true">→</span></a></div>
    <div class="library-areas">${Object.entries(areas).map(([id, label]) => `<button class="library-area-card" type="button" data-area-shortcut="${id}"><span class="library-area-icon">${icon(areaIcons[id] || "books")}</span><span>${e(label)}</span><span class="library-area-arrow" aria-hidden="true">›</span></button>`).join("")}</div>
    <div class="library-row library-row--list"><p class="kicker library-row-kicker">TODOS OS TEMAS</p><p class="library-row-note">Os temas completos abrem no app. Três deles estão completos e gratuitos aqui.</p></div>
    <ul class="catalogue-list" id="catalogue-list">${presentation.catalogue.map((s) => `<li data-title="${e([s.title, ...(s.topics || []).filter((t) => !PLACEHOLDER.test(t))].join(" "))}" data-area="${s.largeArea}"${publicIds.has(s.summaryId) ? " data-featured" : ""}><a href="${publicIds.has(s.summaryId) ? `/conteudos/${s.summaryId}/` : appLink(s.summaryId)}"><span>${e(areas[s.largeArea])}</span><h3>${e(s.title)}</h3>${previewTopics(s.topics) ? `<p class="catalogue-topics">${e(previewTopics(s.topics))}</p>` : ""}<span class="catalogue-open">${publicIds.has(s.summaryId) ? "Ler tema completo grátis" : "Abrir o tema no app"} <span aria-hidden="true">↗</span></span></a></li>`).join("")}</ul>
    <p id="catalogue-empty" hidden>Nenhum tema com esse termo. Limpe a busca ou escolha “Todas as áreas”.</p>
    <button id="catalogue-more" class="outline-button" hidden>Mostrar mais temas</button>

    <p class="library-motto"><span>Os temas completos, as anotações e o PDF de cada tema vêm com o PRO.</span></p>
  </div></section>`;
}

function pro() {
  const captures = product.approvedReadingCaptures.map((c) => `<figure class="reading-capture"><img src="${c.url}" width="1179" height="2556" alt="${e(c.label)} no Ausculto" loading="lazy"><figcaption>${e(c.label)}</figcaption></figure>`).join("");
  return `<section class="section pro pro--animated pro--campaign" id="pro"><div class="wrap pro-grid">
    <div class="pro-copy"><header class="pro-heading"><p class="kicker pro-kicker">AUSCULTO PRO</p><h2>Mais preparo na prova.<br><em>Mais confiança na prática.</em></h2><p class="pro-promise">O Ausculto acompanha cada etapa da sua formação.</p></header><dl class="pro-benefits"><div><dt>Estude com foco</dt><dd>Questões explicadas, simulados por banca, casos clínicos, Trilha Clínica, curso de ECG e Atlas.</dd></div><div><dt>Aplique na prática</dt><dd>AusMind, biblioteca clínica, calculadoras, bulas, interações e organização dos pacientes no AusFlow.</dd></div><div><dt>Evolua com segurança</dt><dd>Flashcards, quiz de imagens, Resumaker, plano de estudos e temas completos com anotações e PDF.</dd></div></dl><p class="pro-price"><strong>R$ 239,90 por ano</strong><span>Equivale a R$ 19,99/mês. 7 dias para testar.</span></p><div class="pro-actions"><a class="academy-button academy-button--gold" href="https://www.auscultoapp.com/#planos">Quero ser PRO ${editorialArrow}</a><button class="pro-reading-button" type="button" data-reading-open>Veja a leitura por dentro</button></div><a class="pro-catalogue-link" href="${appLink()}">Já sou PRO: acessar →</a></div>
    <div class="pro-portrait" aria-hidden="true" data-pro-sequence>${[1,2,3,4].map((n,i)=>`<picture class="pro-pose${i===0?' is-current':''}" data-pro-pose="${i}"><source media="(max-width:600px)" srcset="/assets/academy/pro-motion/pose-${n}-m.webp 480w, /assets/academy/pro-motion/pose-${n}.webp 900w" sizes="(max-width:360px) 280px, 320px"><img src="/assets/academy/pro-motion/pose-${n}.webp" width="900" height="1200" alt="" loading="lazy" decoding="async"></picture>`).join('')}</div>
  </div>
  <dialog class="reading-dialog" id="reading-dialog" aria-labelledby="reading-title"><div class="reading-dialog__inner"><button class="reading-close" type="button" data-reading-close aria-label="Fechar">×</button><p class="kicker">AUSCULTO PRO</p><h2 id="reading-title">Como é ler no Ausculto</h2><dl class="reader-benefits"><div><dt>Leia no seu ritmo</dt><dd>Ajuste a fonte e amplie imagens para observar os detalhes.</dd></div><div><dt>Retome sem se perder</dt><dd>Continue de onde parou, acompanhe o progresso e marque favoritos.</dd></div><div><dt>Guarde seu raciocínio</dt><dd>Faça anotações por seção e retome suas conexões na próxima revisão.</dd></div></dl><div class="reading-captures">${captures}</div><p class="small">Capturas reais do aplicativo, sem mockup. A leitura completa dos temas requer PRO ativo.</p><div class="reading-dialog__footer"><a class="academy-button academy-button--gold" href="https://www.auscultoapp.com/#planos">Ver planos e preços →</a></div></div></dialog>
  </section>`;
}


export function studentLanding() {
  return `<div class="academy-stage">${productHero()}${academyBridge()}${objectivesSection()}</div>${resourcesSection()}${library()}${pro()}${aboutSection()}`;
}

