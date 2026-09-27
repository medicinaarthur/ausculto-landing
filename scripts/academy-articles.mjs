import { accountPanel } from "./academy-account.mjs";
import { renderMarkdown } from "./academy-markdown.mjs";
import { createHash } from "node:crypto";

export const origin = "https://www.auscultoapp.com";
const slug = /^[a-z0-9][a-z0-9-]{0,95}$/;
const version = /^[A-Za-z0-9][A-Za-z0-9._-]{0,95}$/;
export const escapeHtml = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const jsonScript = (value) => JSON.stringify(value).replace(/</g, "\\u003c");
const httpsUrl = (value) => {
  const u = new URL(value);
  if (u.protocol !== "https:" || u.username || u.password)
    throw Error("HTTPS URL required");
  return u.href;
};

const MAIN_SITE = "https://www.auscultoapp.com/";
const APP = "https://app.auscultoapp.com/";
const svgIcon = (d, cls = "") =>
  `<svg${cls ? ` class="${cls}"` : ""} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${d}"/></svg>`;
const ICON = {
  back: "M15 5l-7 7 7 7",
  next: "M9 5l7 7-7 7",
  arrow: "M5 12h14M13 6l6 6-6 6",
  external: "M8 16L16 8M9 8h7v7",
};

// Top bar shared by /estudantes/ and the reading pages. Same design as the doctors page (/ads-medico.html)
// and the auscultoapp.com nav: 64 px, transparent over the dark hero, ivory glass on scroll,
// brand + "ACADEMY" tag, 13.5 px links with a sliding underline, "← Site do Ausculto" | Entrar | pill CTA.
const ICON_UP_RIGHT = "M7 7h10v10M7 17 17 7";
function topBar({ isStudents, brandAssets }) {
  const links = [
    ["/estudantes/#residencia", "Residência"],
    ["https://enamed.auscultoapp.com/", "ENAMED"],
    ["/estudantes/#enamed-comentado", "PDF gratuito"],
    ["/estudantes/#plataforma", "O que tem no app"],
  ];
  const mark = brandAssets
    ? '<span class="atb__logo"><img class="atb__mark atb__mark--bare" src="/assets/home/academy-icon-64.webp" srcset="/assets/home/academy-icon-64.webp 1x, /assets/home/academy-icon-96.webp 2x" width="32" height="32" alt=""><img class="atb__mark atb__mark--tile" src="/assets/academy/academy-app-icon-72.webp" srcset="/assets/academy/academy-app-icon-72.webp 1x, /assets/academy/academy-app-icon-144.webp 2x" width="28" height="28" alt=""></span>'
    : '<img class="atb__mark" src="/assets/academy/academy_logo_mark.png" width="28" height="28" alt="">';
  const login = isStudents
    ? '<button class="atb__login" type="button" data-account-open>Entrar</button>'
    : `<a class="atb__login" href="${APP}">Entrar</a>`;
  const sheetLogin = isStudents
    ? '<button class="atb__sheet-login" type="button" data-account-open>Entrar</button>'
    : `<a class="atb__sheet-login" href="${APP}">Entrar</a>`;
  return `<header class="atb" data-atb><div class="atb__bar">`
    + `<a class="atb__home" href="/estudantes/" aria-label="Ausculto Academy: início"${isStudents ? ' aria-current="page"' : ""}>${mark}<span class="atb__name">Ausculto</span> <span class="atb__tag">Academy</span></a>`
    + `<nav class="atb__nav" aria-label="Navegação principal">${links.map(([href, label]) => `<a href="${href}">${label}</a>`).join("")}</nav>`
    + `<div class="atb__actions"><a class="atb__site" href="${MAIN_SITE}">${svgIcon(ICON.back, "atb__site-icon")}Site do Ausculto</a><span class="atb__divider" aria-hidden="true"></span>${login}<a class="atb__cta" href="${APP}">Começar grátis ${svgIcon(ICON_UP_RIGHT, "atb__cta-icon")}</a></div>`
    + `<details class="atb__menu"><summary class="atb__menu-button" aria-label="Abrir menu"><span class="atb__burger" aria-hidden="true"></span></summary>`
    + `<div class="atb__sheet"><p class="atb__sheet-intro">Seu próximo passo na medicina.</p><nav aria-label="Navegação mobile">${links.map(([href, label], i) => `<a href="${href}"><span>${label}</span><small>${['Conheça as provas e pratique por banca','Estude com foco na avaliação','Leve o ENAMED comentado com você','Descubra as ferramentas de estudo'][i]}</small>${svgIcon(ICON_UP_RIGHT, 'atb__sheet-arrow')}</a>`).join("")}</nav>`
    + `<div class="atb__sheet-actions"><a class="atb__sheet-cta" href="${APP}">Começar grátis</a>${sheetLogin}</div>`
    + `<div class="atb__sheet-foot"><a class="atb__sheet-site" href="${MAIN_SITE}">${svgIcon(ICON.back)}Site do Ausculto</a></div></div></details>`
    + `</div></header>`;
}

export function page({ title, description, path, body, structured, ogImage, features = {} }) {
  const isStudents = path === "/estudantes/";
  const isReader=path.startsWith("/conteudos/") && path!=="/conteudos/";
  const isPortal=path==="/conteudos/";
  // The retained ENAMED entry (scripts/render-enamed-source.mjs) ships without /assets/brand and /assets/home.
  const brandAssets = !path.startsWith("/enamed");
  const brand =
    '<a class="academy-brand" href="/estudantes/" aria-label="Ausculto Academy: início"><img src="/assets/academy/academy_logo_mark.png" width="62" height="62" alt="" loading="lazy"><span>AUSCULTO <strong>ACADEMY</strong></span></a>';
  const back = `<a class="footer-back" href="${MAIN_SITE}"><span class="footer-back__mark">${brandAssets ? '<img src="/assets/brand/ausculto-a-white.svg" width="22" height="22" alt="">' : ""}</span><span class="footer-back__text"><strong>Voltar para o Ausculto</strong><small>auscultoapp.com</small></span>${svgIcon(ICON.arrow)}</a>`;
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(/^Ausculto\b/.test(title) ? title : `${title} | Ausculto`)}</title><meta name="description" content="${escapeHtml(description)}"><link rel="canonical" href="${origin}${path}"><meta property="og:type" content="${structured ? "article" : "website"}"><meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${origin}${path}">${ogImage ? `<meta property="og:image" content="${origin}${escapeHtml(ogImage)}"><meta name="twitter:card" content="summary_large_image">` : ""}${brandAssets ? '<link rel="icon" href="/assets/academy/favicon-academy.ico?v=20260917b" sizes="48x48"><link rel="icon" type="image/png" sizes="192x192" href="/assets/academy/favicon-academy-192.png?v=20260917b"><link rel="apple-touch-icon" href="/assets/academy/favicon-academy-180.png?v=20260917b">' : '<link rel="icon" href="/favicon.png">'}<link rel="preload" href="/assets/fonts/enamed/montserrat-var-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/css/academy-content.css"><script src="/assets/js/academy.js" defer></script>${isStudents ? '<link rel="preload" as="image" href="/assets/academy/dossier/calendar-frame.webp" media="(max-width:767px)" fetchpriority="high"><link rel="preload" as="image" href="/assets/academy/dossier/book.webp" media="(min-width:768px)" fetchpriority="high"><link rel="preload" as="font" type="font/woff2" crossorigin href="/assets/fonts/enamed/inter-var-latin.woff2"><link rel="stylesheet" href="/assets/css/academy-redesign.css"><link rel="stylesheet" href="/assets/css/academy-hero.css"><link rel="stylesheet" href="/assets/css/academy-type.css"><link rel="stylesheet" href="/assets/css/academy-qdemo.css"><link rel="preload" href="/assets/fonts/enamed/instrument-serif-400-normal-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/assets/fonts/enamed/instrument-serif-400-italic-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/assets/css/academy-library.css"><script src="/assets/js/academy-catalogue.js" defer></script><link rel="stylesheet" href="/assets/css/academy-sim-demo.css"><script src="/assets/js/academy-sim-demo.js" defer></script><script src="/assets/js/academy-qdemo.js" defer></script><script src="/assets/js/academy-dossier.js" defer></script><script src="/assets/js/academy-mascot.js" defer></script><script src="/assets/js/academy-account-loader.js" defer></script>' : ""}${features.books ? '<link rel="stylesheet" href="/assets/css/academy-books.css"><script src="/assets/js/academy-book.js" defer></script>' : ""}${isReader ? '<link rel="stylesheet" href="/assets/css/academy-reader.css"><script src="/assets/js/academy-reader.js" defer></script><script src="/assets/js/academy-study.js" defer></script>' : ""}${(isStudents || isReader || isPortal) ? '<link rel="stylesheet" href="/assets/css/academy-accessibility.css">' : ""}${(isReader || isPortal) ? '<link rel="stylesheet" href="/assets/css/academy-editorial.css">' : ""}${isStudents ? '<link rel="stylesheet" href="/assets/css/academy-corrections.css"><link rel="stylesheet" href="/assets/css/academy-refinements.css"><link rel="stylesheet" href="/assets/css/academy-mascot.css"><link rel="stylesheet" href="/assets/css/academy-experience.css"><script src="/assets/js/academy-experience.js" defer></script><script src="/assets/js/academy-pro.js" defer></script><script src="/assets/js/academy-journey.js" defer></script><link rel="stylesheet" href="/assets/css/academy-cycle.css"><link rel="stylesheet" href="/assets/css/academy-paths.css"><script src="/assets/js/academy-paths.js" defer></script><link rel="stylesheet" href="/assets/css/academy-resources.css"><script src="/assets/js/academy-resources.js" defer></script><link rel="stylesheet" href="/assets/css/academy-testimonials.css"><script src="/assets/js/academy-testimonials.js" defer></script>' : ""}${structured ? `<script type="application/ld+json">${jsonScript(structured)}</script>` : ""}</head><body class="academy-public ${isStudents ? "academy-students" : "academy-reading"}"><a class="skip-link" href="#conteudo">Ir para o conteúdo</a>${topBar({ isStudents, brandAssets })}<main id="conteudo">${body}</main>${isStudents ? accountPanel() + '<a class="sticky-cta" href="#enamed-comentado" data-sticky-cta>Baixar o PDF gratuito <span aria-hidden="true">→</span></a>' : ""}<footer class="academy-footer"><div class="wrap footer-grid"><div class="footer-brand">${brand}${back}</div><p>Questões, provas, flashcards e ENAMED<br>no mesmo aplicativo.</p><nav aria-label="Links institucionais"><a href="https://www.auscultoapp.com/">Conheça o Ausculto</a><a href="/conteudos/">Leituras gratuitas</a><a href="https://www.auscultoapp.com/politica-de-privacidade.html">Privacidade</a><a href="https://www.auscultoapp.com/termos-de-uso.html">Termos de uso</a></nav></div><div class="wrap footer-bottom">AUSCULTO PLATAFORMA MEDICA LTDA · CNPJ 67.097.849/0001-04 · <a href="mailto:suporte@auscultoapp.com">suporte@auscultoapp.com</a>${isStudents ? '<span class="campaign-credit">Personagens e capas de apresentação criados com IA. Conteúdo de estudo do Ausculto.</span>' : ""}</div></footer>${isReader ? `<dialog id="material-zoom" aria-labelledby="zoom-title"><div class="zoom-toolbar"><h2 id="zoom-title">Esquema do tema</h2><button id="zoom-close" aria-label="Fechar ampliação">Fechar ×</button></div><div class="zoom-scroll"><img id="zoom-image" alt=""></div><p>Use a rolagem para percorrer a imagem. Escape fecha a ampliação.</p></dialog>` : ""}</body></html>`;
}

function arrow() {
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>';
}

export function validateRelease(release) {
  if (
    release.schemaVersion !== 1 ||
    !slug.test(release.releaseId) ||
    !Array.isArray(release.summaries) ||
    !release.summaries.length
  )
    throw Error("Invalid complete release");
  const seen = new Set();
  for (const s of release.summaries) {
    if (
      !slug.test(s.summaryId) ||
      !version.test(s.version) ||
      seen.has(s.summaryId)
    )
      throw Error("Invalid/duplicate summary identity");
    seen.add(s.summaryId);
    if (
      s.releaseId !== release.releaseId ||
      s.publicationAllowed !== true ||
      s.clinicalReviewed !== true ||
      s.rightsCleared !== true ||
      s.published !== true
    )
      throw Error("Unapproved release");
    if (
      !s.author ||
      (s.author?.type !== "Organization" &&
        (!s.reviewer || !/^\d{4}-\d{2}-\d{2}$/.test(s.reviewedAt))) ||
      !s.title ||
      !s.description
    )
      throw Error("Editorial byline, date and description required");
    if (
      !Array.isArray(s.blocks) ||
      !Array.isArray(s.publicSectionIds) ||
      !s.publicSectionIds.length
    )
      throw Error("Explicit public sections required");
    const ids = new Set(s.blocks.map((b) => b.id));
    if (
      ids.size !== s.blocks.length ||
      s.publicSectionIds.some((id) => !ids.has(id))
    )
      throw Error("Invalid public section selection");
    if (!Array.isArray(s.references) || !s.references.length)
      throw Error("References required");
    s.references.forEach((r) => httpsUrl(r.url));
  }
}

function renderBlock(block) {
  if (block.type === "markdown")
    return `<section id="${escapeHtml(block.id)}">${renderMarkdown(block.text)}</section>`;
  const heading = `<h2 id="${escapeHtml(block.id)}">${escapeHtml(block.title)}</h2>`;
  const text = block.text
    ? `<p>${escapeHtml(block.text).replace(/\n/g, "<br>")}</p>`
    : "";
  const items = Array.isArray(block.items)
    ? `<ul>${block.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`
    : "";
  const steps = Array.isArray(block.steps)
    ? `<ol>${block.steps.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ol>`
    : "";
  if (block.type === "table")
    return `<section>${heading}${text}<div class="table-scroll" role="region" tabindex="0" aria-label="${escapeHtml(block.title)}"><table><thead><tr>${(block.columns || []).map((c) => `<th scope="col">${escapeHtml(c)}</th>`).join("")}</tr></thead><tbody>${(block.rows || []).map((row) => `<tr>${row.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
  if (["image", "graph"].includes(block.type))
    return `<section>${heading}${text}<figure><img loading="lazy" src="${escapeHtml(httpsUrl(block.imageUrl))}" alt="${escapeHtml(block.alt)}"><figcaption>${escapeHtml(block.alt)}</figcaption></figure></section>`;
  if (
    !["concept", "warning", "callout", "flow", "recall", "case"].includes(
      block.type,
    )
  )
    throw Error("Unsupported public block");
  return `<section class="${block.type === "warning" ? "warning" : ""}">${heading}${text}${items}${steps}</section>`;
}

export function renderArticles(release) {
  validateRelease(release);
  return release.summaries.map((s) => {
    const institutional = s.author?.type === "Organization";
    const path = `/conteudos/${s.summaryId}/`;
    const selected = s.blocks.filter((b) => s.publicSectionIds.includes(b.id));
    const app = `https://app.auscultoapp.com/?returnTo=${encodeURIComponent(`academy-summary:${s.summaryId}`)}`;
    const body = `<article class="academy-article"><header class="academy-article__intro"><p class="eyebrow">BIBLIOTECA DE ESTUDO · ${escapeHtml(s.specialty)}</p><h1>${escapeHtml(s.title)}</h1><p class="lead">${escapeHtml(s.description)}</p><p class="byline">Por ${institutional ? escapeHtml(s.author.name) : `${escapeHtml(s.author)} · Revisão: ${escapeHtml(s.reviewer)}<br>Revisado em <time datetime="${s.reviewedAt}">${escapeHtml(s.reviewedAt)}</time>`} · Versão ${escapeHtml(s.version)}</p></header><nav class="contents" aria-label="Neste artigo"><strong>Neste artigo</strong><ol>${selected.map((b) => `<li><a href="#${escapeHtml(b.id)}">${escapeHtml(b.title)}</a></li>`).join("")}</ol></nav>${selected.map(renderBlock).join("")}<aside class="continue"><p class="eyebrow">CONTINUE ESTE TEMA</p><h2>Da leitura à próxima sessão de estudo.</h2><p>O resumo completo e o PDF identificado com seu e-mail estão incluídos no Ausculto PRO. Você também pode continuar pelo navegador.</p><a class="btn btn--primary" href="${app}">Abrir este resumo no Ausculto</a><small>O acesso completo requer conta com PRO ativo. Ao baixar, o PDF recebe seu e-mail como marca-d’água.</small></aside><section><h2>Referências</h2><ol>${s.references.map((r) => `<li><a href="${escapeHtml(httpsUrl(r.url))}" rel="noopener noreferrer">${escapeHtml(r.label)}</a></li>`).join("")}</ol></section><p class="note">Material educacional. Consulte as referências e protocolos aplicáveis ao contexto estudado.</p></article>`;
    return {
      path: `conteudos/${s.summaryId}/index.html`,
      html: page({
        title: s.title,
        description: s.description,
        path,
        body,
        structured: {
          "@context": "https://schema.org",
          "@type": "Article",
          headline: s.title,
          description: s.description,
          mainEntityOfPage: origin + path,
          ...(institutional
            ? { author: { "@type": "Organization", name: s.author.name } }
            : {
                dateModified: s.reviewedAt,
                author: { "@type": "Person", name: s.author },
                reviewedBy: { "@type": "Person", name: s.reviewer },
              }),
          publisher: { "@type": "Organization", name: "Ausculto" },
        },
      }),
    };
  });
}

export function renderIndex(summaries = []) {
  const listing = summaries.length
    ? `<div class="articles">${summaries.map((s) => `<a href="/conteudos/${s.summaryId}/"><span>${escapeHtml(s.displayArea ?? s.specialty)}</span><h2>${escapeHtml(s.title)}</h2><p>${escapeHtml(s.description)}</p><strong>Ler artigo →</strong></a>`).join("")}</div>`
    : '<p class="note">Os primeiros artigos estão em revisão editorial. Enquanto isso, conheça os recursos de estudo disponíveis no Ausculto.</p><a class="btn btn--primary" href="/estudantes/">Conhecer a Academy</a>';
  return page({
    title: "Conteúdos para estudar medicina",
    description:
      "Leituras de medicina com referências, revisão editorial e continuidade no Ausculto.",
    path: "/conteudos/",
    body: `<section class="academy-catalogue"><div class="wrap wrap--editorial"><p class="eyebrow">AUSCULTO ACADEMY</p><h1>Uma boa leitura.<br><em>Um próximo passo claro.</em></h1><p class="lead">Explore os temas, consulte as referências e leve seu estudo adiante.</p>${listing}</div></section>`,
  });
}

export const releaseHash = (release) =>
  createHash("sha256").update(JSON.stringify(release)).digest("hex");
