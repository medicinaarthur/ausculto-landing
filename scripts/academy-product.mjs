import {renderTestimonials,testimonialAssets} from './academy-testimonials.mjs';
import {renderResources, resourceAssets} from './academy-resources.mjs';
import {objectives,practiceStudio,bankGallery,learningJourney,closingPdf} from './academy-experience.mjs';
import correctionAssets from './data/academy-correction-assets.json' with {type:'json'};
import {renderSimDemo} from "./academy-sim-demo.mjs";
import { presentation } from "./academy-presentation.mjs";
import { academyHero } from "./academy-hero.mjs";
import { readFileSync } from "node:fs";
export const product = { ...JSON.parse(
  readFileSync(new URL("./data/academy-product.json", import.meta.url), "utf8"),
), academyThemes:presentation.catalogue.length, ecgModules:presentation.ecgModules.length };
product.assets = [...new Set([...product.assets, ...resourceAssets, ...testimonialAssets])];
const app = "https://app.auscultoapp.com/";
const icon = (name, size = 24) => `<img src="/assets/academy/icons/${name}.svg" alt="" width="${size}" height="${size}">`;
const svg = {
  magnifier: '<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.6-4.6"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><path d="M6 3h12v18l-6-4-6 4z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12 5 5 9-10"/></svg>',
  play: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5z"/></svg>',
  bookOpen: '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M4 7h8a4 4 0 0 1 4 4v15a3 3 0 0 0-3-3H4zM28 7h-8a4 4 0 0 0-4 4v15a3 3 0 0 1 3-3h9z"/><path d="M8 12h4M8 16h4M20 12h4M20 16h4"/></svg>',
  brain: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4.5a3 3 0 0 0-5.6 1.3 3 3 0 0 0-1.9 4.6A3.2 3.2 0 0 0 5.4 16a3 3 0 0 0 5.4 1.5H12zM12 4.5a3 3 0 0 1 5.6 1.3 3 3 0 0 1 1.9 4.6 3.2 3.2 0 0 1-.9 5.6 3 3 0 0 1-5.4 1.5H12zM12 4.5v13M8 9.5c1.2.2 2.2.9 2.8 1.9M16 9.5c-1.2.2-2.2.9-2.8 1.9M7.5 14c1.5-.2 2.8.3 3.5 1.2M16.5 14c-1.5-.2-2.8.3-3.5 1.2"/></svg>',
};
export function productHero() { return academyHero(); }

export function objectivesSection(course = "") { return objectives(product, course); }

export function resourcesSection() { return renderResources()+renderTestimonials(); }
export function productSections() { return objectivesSection() + resourcesSection(); }

// ---------------------------------------------------------------------------------------------------------------------------
// "Sobre a Academy": the Academy logo beside the title, then everything the Academy offers and how it works.
// Figures come from data/academy-product.json. Simulado details mirror the app (lib/features/simulados):
// curated bancas with their profiles, "Prova mista" with the validated distribution of each banca, 20/50/100 questions,
// Modo Prova (timer, answer key only at the end) and Modo Treino (commented answer after each question).
// ---------------------------------------------------------------------------------------------------------------------------
const aboutArrow = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const aboutNumber = (n) => n.toLocaleString("pt-BR");
// The preview is the interactive question itself (the same app replica used on ads-estudante): any alternative or the
// button opens it in a dialog, where the student answers, sees the comment for each alternative and can redo it.
const aboutQuestion = `<div class="q-demo q-demo--try"><div class="q-demo__top"><span class="q-demo__tag">Einstein 2026 · Clínica médica</span><span class="q-demo__badge">${svg.check} Comentada</span></div><p class="q-demo__case">Homem de 58 anos, não tabagista, sem antecedentes familiares de fratura por fragilidade, apresenta fratura de rádio distal após queda da própria altura. Relata fadiga crônica e diminuição da libido nos últimos anos. Não faz uso de corticoides, álcool em excesso ou outras medicações sabidamente relacionadas a osteoporose. Exames laboratoriais prévios mostram função renal normal.</p><p class="q-demo__stem">De acordo com as recomendações para investigação de osteoporose em homens, qual é a conduta diagnóstica mais adequada?</p><ol><li><button class="q-demo__alt" type="button" data-qdemo-open="a"><b>A</b><span>Considerar que a presença de fratura por fragilidade, mesmo sem densitometria prévia, já configura diagnóstico de osteoporose e, portanto, iniciar tratamento farmacológico empírico; a investigação de causas secundárias poderia ser adiada para um segundo momento, apenas em caso de falha terapêutica.</span></button></li><li><button class="q-demo__alt" type="button" data-qdemo-open="b"><b>B</b><span>Direcionar a investigação inicial para neoplasias ocultas, como mieloma múltiplo ou câncer de próstata, com exames como PSA, eletroforese de proteínas séricas/urinárias e, eventualmente, imagem avançada, uma vez que, em homens, a osteoporose frequentemente representa manifestação secundária de doenças malignas subjacentes.</span></button></li><li><button class="q-demo__alt" type="button" data-qdemo-open="c"><b>C</b><span>Realizar densitometria óssea (DXA) como exame inicial isolado, visto que a confirmação de baixa densidade mineral já direciona a conduta terapêutica, sendo a pesquisa laboratorial de causas secundárias opcional e geralmente restrita a casos refratários ao tratamento.</span></button></li><li><button class="q-demo__alt" type="button" data-qdemo-open="d"><b>D</b><span>Solicitar densitometria óssea (DXA) associada a uma investigação laboratorial inicial abrangente, incluindo testosterona total, cálcio sérico e urinário, fósforo, fosfatase alcalina, vitamina D e função renal, reconhecendo que até metade dos casos em homens adultos está relacionada a etiologias secundárias.</span></button></li></ol><button class="q-demo__try" type="button" data-qdemo-open>Responder esta questão ${aboutArrow}</button><span class="q-demo__hint">Correção e comentário na hora</span></div>`;
const aboutQuestionDialog = readFileSync(new URL("./data/academy-qdemo.html", import.meta.url), "utf8");

const aboutFaq = [
  ["O que está incluído na Academy?", "<strong>A Academy reúne banco de questões, questões de residência comentadas, provas, simulados, flashcards, casos clínicos e Quiz de imagens.</strong> Para o ENAMED, você também encontra temas com subtemas, leitura completa e o PDF de cada tema, incluídos no PRO."],
  ["Quanto custa?", "<strong>R$ 239,90 por ano, equivalente a R$ 19,99 por mês,</strong> com 7 dias para testar e cancelamento quando quiser, sem fidelidade. Os valores são confirmados no checkout. O Ausculto PRO cobre tudo que está nesta página, sem assinatura separada por módulo."],
  ["Dá para ler alguma coisa antes de criar conta?", "<strong>Sim.</strong> Três temas completos estão abertos, com as tabelas, imagens e referências originais. Eles estão em destaque na Biblioteca."],
  ["Como continuo no mesmo tema?", "<strong>O botão ao final de cada tema abre o tema correspondente no Ausculto.</strong> Se precisar entrar na sua conta, o destino é preservado após a autenticação."],
  ["E o PDF de cada tema?", "<strong>Esse é outro PDF.</strong> Além do ENAMED 2026 Comentado, que é gratuito, quem tem PRO pode baixar qualquer tema em PDF. Todas as páginas recebem seu e-mail como identificação."],
  ["O ENAMED fica separado do resto do app?", "<strong>Não.</strong> É o mesmo Ausculto e a mesma conta. Suas leituras e o seu progresso continuam integrados."],
];

export function aboutSection() {
  const faqItems = aboutFaq.map(([q, a]) => `<details name="academy-faq"><summary><span class="about-faq__q">${q}</span><span class="about-faq__icon" aria-hidden="true"></span></summary><div class="about-faq__a"><p>${a}</p></div></details>`);
  const half = Math.ceil(faqItems.length / 2);
  return `<section class="section about-academy" id="duvidas" aria-labelledby="about-title"><div class="wrap">
    <header class="about-head">
      <div class="about-lockup">
        <img class="about-logo about-logo--tile" src="/assets/academy/academy-app-icon-192.webp" srcset="/assets/academy/academy-app-icon-144.webp 144w, /assets/academy/academy-app-icon-192.webp 192w, /assets/academy/academy-app-icon-288.webp 288w" sizes="(max-width: 600px) 64px, 88px" width="192" height="192" alt="" loading="lazy">
        <h2 id="about-title">Sobre a <em>Academy.</em></h2>
      </div>
      <p class="about-lead">Conhecimento, prática e revisão conectados. Veja como o Ausculto acompanha sua formação, da faculdade à residência.</p>
    </header>

    ${practiceStudio({question:aboutQuestion,sim:renderSimDemo(),product})}


    ${learningJourney()}

    <div class="about-faq">
      <div class="about-faq__head"><h3>Perguntas <em>frequentes</em></h3><p>Ainda tem dúvidas? Escreva para <a href="mailto:suporte@auscultoapp.com">suporte@auscultoapp.com</a></p></div>
      <div class="about-faq__cols"><div class="about-faq__list">${faqItems.slice(0, half).join("")}</div><div class="about-faq__list">${faqItems.slice(half).join("")}</div></div>
    </div>
  </div><div class="wrap">${closingPdf()}</div>${aboutQuestionDialog}</section>`;
}
