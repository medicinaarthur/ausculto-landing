import { academyHero } from "./academy-hero.mjs";
import { readFileSync } from "node:fs";
export const product = JSON.parse(
  readFileSync(new URL("./data/academy-product.json", import.meta.url), "utf8"),
);
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
const resource = ({ n, name, title, text, demo, action, wide = false }) =>
  `<article class="resource-card${wide ? " resource-card--wide" : ""}"><span class="resource-number" aria-hidden="true">0${n}</span><div class="resource-head"><span class="resource-icon">${icon(name, 28)}</span><h3>${title}</h3></div><p class="resource-text">${text}</p><div class="resource-demo" aria-hidden="true">${demo}</div><a class="resource-link" href="${app}">${action} <span aria-hidden="true">→</span></a></article>`;

// Demo components mirror the reference mock-ups; content comes from real app material (flashcard on arrhythmias) or app features.
const demos = {
  question: `<div class="demo-question"><p>Arritmias: qual é a diferença entre cardioversão e desfibrilação?</p><ol><li><b>A</b>Cardioversão não sincronizada; desfibrilação sincronizada</li><li class="is-correct"><b>B</b>Cardioversão sincronizada; desfibrilação não sincronizada</li><li><b>C</b>Ambas não sincronizadas</li><li><b>D</b>Ambas sincronizadas</li></ol></div>`,
  flashcard: `<div class="demo-flashcards"><div class="demo-card demo-card--back"></div><div class="demo-card demo-card--front"><span class="demo-cat">GASOMETRIA</span><p>Acidose metabólica com ânion gap normal: qual a causa mais comum?</p><span class="demo-rule"></span><span class="demo-flip">VIRAR CARTÃO <i>${svg.chevron}</i></span></div></div>`,
  case: `<div class="demo-case"><img src="/assets/academy/caso-torax.webp" alt="" width="800" height="800" loading="lazy"><span class="demo-bookmark">${svg.bookmark}</span><span class="demo-pill">CASO CLÍNICO</span><strong>Dor torácica aos esforços, com sinais que mudam a conduta…</strong><span class="demo-note">Qual a hipótese mais provável?</span><span class="demo-button">Ver caso completo <i>→</i></span></div>`,
  quiz: `<div class="demo-quiz"><img class="demo-shot demo-shot--3" src="/assets/academy/quiz-ultrassom.webp" alt="" width="389" height="292" loading="lazy"><img class="demo-shot demo-shot--2" src="/assets/academy/quiz-histologia.webp" alt="" width="354" height="266" loading="lazy"><img class="demo-shot demo-shot--1" src="/assets/academy/quiz-torax.webp" alt="" width="900" height="675" loading="lazy"><span class="demo-pill demo-pill--light">${svg.magnifier} Radiografia de tórax</span></div>`,
  performance: `<div class="demo-performance"><div class="demo-perf__head"><span>EVOLUÇÃO</span><span class="demo-tag">ÚLTIMOS 30 DIAS</span></div><div class="demo-stats"><div><strong>72%</strong><span>ACURÁCIA</span></div><div><strong>372</strong><span>QUESTÕES</span></div><div><strong>12h</strong><span>TEMPO</span></div></div><div class="demo-chart"><div class="demo-bars">${[42, 58, 50, 66, 54, 74, 62, 70, 56, 80, 64, 76, 68, 88].map((h, i) => `<i style="height:${h}%"${i >= 9 ? ' class="is-week"' : ""}></i>`).join("")}</div><div class="demo-axis"><span>S1</span><span>S2</span><span>S3</span><span>S4</span></div></div></div>`,
  plan: `<div class="demo-plan"><div class="demo-plan__head"><span>PLANO DE HOJE</span><em>${svg.check} 32 min</em></div><ul><li class="is-done"><i>${svg.check}</i>Missão do dia<span>10 min</span></li><li><i></i>Reforço: Cirurgia<span>12 min</span></li><li><i></i>Trilha Clínica<span>10 min</span></li></ul></div>`,
  trail: `<div class="demo-trail"><img src="/assets/academy/trilha-clinica.webp" alt="" width="1000" height="709" loading="lazy"></div>`,
};

export function productHero() { return academyHero(); }

export function objectivesSection() {
  return `<section class="section academy-paths" id="caminhos"><div class="wrap">
    <div class="paths-heading">
      <div><p class="kicker paths-kicker">ESCOLHA POR ONDE COMEÇAR</p><h2>Qual é <em>seu objetivo?</em></h2><p>Residência, ENAMED ou o PDF gratuito: <strong>os três abrem no mesmo app.</strong></p></div>
      
    </div>
    <div class="path-grid">
      <a class="path-card path-card--residency" id="residencia" href="${app}">
        <img class="path-background" src="/assets/academy/card-navy.webp" alt="" width="1280" height="720" loading="lazy">
        <div class="path-copy"><span class="path-icon">${icon("stethoscope")}</span><span class="path-kicker">RESIDÊNCIA</span><h3>Residência <br>médica</h3><p><strong>14.345 questões comentadas</strong>, provas e simulados para a sua banca.</p><span class="path-action path-action--gold">Explorar residência →</span><span class="path-motto">MAIS PRÁTICA.<br>MAIS CONQUISTAS.</span></div>
        <img class="path-figure path-figure--doctor" src="/assets/academy/academy-hero-doctor-m.webp" alt="" width="900" height="1238" loading="lazy">
      </a>
      <a class="path-card path-card--enamed" id="enamed" href="https://enamed.auscultoapp.com/">
        <img class="path-background" src="/assets/academy/card-cream.webp" alt="" width="1280" height="720" loading="lazy">
        <div class="path-copy"><span class="path-icon path-icon--light">${icon("note-pencil")}</span><span class="path-kicker">ENAMED</span><h3>ENAMED</h3><p>Leitura por tema, com imagens <br>e questões <strong>no formato da prova.</strong></p><span class="path-action path-action--outline">Explorar ENAMED →</span></div>
        <picture><source type="image/webp" srcset="/assets/academy/notebook-enamed.webp"><img class="path-figure path-figure--notebook" src="/assets/academy/notebook-enamed.png" alt="Caderno ENAMED: temas e subtemas" width="1024" height="1536" loading="lazy"></picture>
      </a>
      <article class="path-card enamed-download" id="enamed-comentado">
        <picture><img class="download-art" src="/assets/academy/enamed-commented.webp" alt="" width="1800" height="600" loading="lazy"></picture>
        <div class="download-copy">
          <p class="download-eyebrow">PDF GRATUITO</p>
          <h3>ENAMED 2026 <em>Comentado.</em></h3>
          <p class="download-lead">Entenda o raciocínio por trás de cada resposta.</p>
          <p class="download-text"><strong>100 questões e 400 alternativas comentadas.</strong> <br>Para ler no celular ou imprimir. <br><span class="download-detail">PDF · 124 páginas</span></p>
        </div>
        <img class="download-thumb" src="/assets/academy/thumb-comentado.webp" alt="" width="640" height="480" loading="lazy">
        <div class="download-action"><button class="academy-button academy-button--gold" type="button" data-account-open>Baixar gratuitamente →</button><p><strong>Cadastro gratuito, sem PRO.</strong> Gabarito próprio do Ausculto, não é o gabarito oficial.</p></div>
        <ul class="download-benefits">
          <li><span class="download-icon">${icon("books")}</span><div><strong>Questões comentadas</strong><span>Aprenda com o raciocínio.</span></div></li>
          <li><span class="download-icon">${icon("image")}</span><div><strong>Imagens de alta qualidade</strong><span>Visualize e memorize.</span></div></li>
          <li><span class="download-icon">${icon("files")}</span><div><strong>PDF completo</strong><span>124 páginas para estudar.</span></div></li>
        </ul>
        
      </article>
    </div>
  </div></section>`;
}

const trailCard = `
<article class="trail-card" id="trilha-clinica" aria-label="Trilha clínica">
  <div class="trail-media"><img src="/assets/academy/trilha-clinica-card.webp" srcset="/assets/academy/trilha-clinica-card-720.webp 720w, /assets/academy/trilha-clinica-card.webp 1200w" sizes="(max-width: 1000px) 84vw, 320px" alt="Mascote do Ausculto de jaleco apresentando uma clínica: prevenção, diagnóstico, tratamento e acompanhamento" width="1200" height="671" loading="lazy"></div>
  <div class="trail-body">
    <div class="trail-head"><span class="trail-medal" aria-hidden="true"><span>${icon("stethoscope", 34)}</span></span><div class="trail-title"><p class="trail-kicker">MÓDULO</p><h3>Trilha clínica</h3></div></div>
    <p class="trail-lead">Aprenda por capítulos, casos‑chefe e questões autorais.</p>
    <div class="trail-progress"><p class="trail-count">0 de 12 capítulos</p><ol class="trail-bar" aria-hidden="true">${Array.from({ length: 12 }, (_, i) => `<li${i === 0 ? ' class="is-current"' : ""}></li>`).join("")}</ol></div>
    <div class="trail-actions"><a class="trail-btn trail-btn--start" href="${app}">${svg.play}Começar</a><a class="trail-btn trail-btn--guide" href="${app}">${svg.bookOpen}Guia da trilha</a></div>
    <p class="trail-footer"><span>ESTUDO</span><i aria-hidden="true">•</i><span>PRÁTICA</span><i aria-hidden="true">•</i><span>DECISÃO</span><i aria-hidden="true">•</i><span>MELHOR CUIDADO</span></p>
  </div>
</article>
`;

export function resourcesSection() {
  const cards = [
    { n: 1, name: "files", title: "Questões e simulados", text: "Pratique com provas reais de 40 bancas e entenda o raciocínio alternativa por alternativa.", demo: demos.question, action: "Explorar questões" },
    { n: 2, name: "cards", title: "Flashcards", text: "Revise os conceitos que realmente importam e fixe o conteúdo com repetição espaçada.", demo: demos.flashcard, action: "Explorar flashcards" },
    { n: 3, name: "stethoscope", title: "Casos clínicos", text: "Conecte sinais, hipóteses e conduta em casos clínicos comentados, do primeiro dado à decisão.", demo: demos.case, action: "Explorar casos clínicos" },
    { n: 4, name: "image", title: "Quiz de imagens", text: "Exercite sua interpretação com imagens reais e aprenda a reconhecer os achados que fazem a diferença.", demo: demos.quiz, action: "Explorar quiz de imagens" },
    { n: 5, name: "chart-bar", title: "Desempenho", text: "Veja acurácia, volume e tempo por tema e descubra onde você ainda perde ponto.", demo: demos.performance, action: "Explorar desempenho", wide: true },
    { n: 6, name: "timer", title: "Plano de estudos", text: "Estude de forma direcionada com um plano personalizado, baseado nas suas metas, disponibilidade e desempenho.", demo: demos.plan, action: "Explorar plano de estudos", wide: true },
  ];
  return `<section class="section academy-toolbox" id="plataforma"><div class="wrap">
    <div class="toolbox-heading"><p class="kicker toolbox-kicker">RECURSOS DA ACADEMY</p><h2>Para aprender de <em>verdade.</em></h2><p><strong>Sete ferramentas no mesmo app</strong>, para aprender, fixar e aplicar.</p></div>
    <div class="resource-grid" data-rail>${cards.map(resource).join("")}${trailCard}</div><div class="resource-dots" data-rail-dots aria-hidden="true"></div>
    <div class="toolbox-footer"><span class="toolbox-line"></span><div class="toolbox-steps"><span>${icon("graduation-cap")}APRENDER</span><span>${svg.brain}FIXAR</span><span>${icon("chart-bar")}APLICAR</span></div><span class="toolbox-line"></span></div>
  </div></section>`;
}
export function productSections() { return objectivesSection() + resourcesSection(); }

// ---------------------------------------------------------------------------------------------------------------------------
// "Sobre a Academy": the Academy logo beside the title, then everything the Academy offers and how it works.
// Figures come from data/academy-product.json. Simulado details mirror the app (lib/features/simulados):
// curated bancas with their profiles, "Prova mista" with the validated distribution of each banca, 20/50/100 questions,
// Modo Prova (timer, answer key only at the end) and Modo Treino (commented answer after each question).
// ---------------------------------------------------------------------------------------------------------------------------
const aboutArrow = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const aboutDevices = '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4" width="14" height="10.5" rx="1.6"/><path d="M6.5 18h6M9.5 14.5V18"/><rect x="17" y="8" width="4.5" height="12" rx="1.2"/><path d="M19.2 17.6h.1"/></svg>';
const aboutNumber = (n) => n.toLocaleString("pt-BR");
// The preview is the interactive question itself (the same app replica used on ads-estudante): any alternative or the
// button opens it in a dialog, where the student answers, sees the comment for each alternative and can redo it.
const aboutQuestion = `<div class="q-demo q-demo--try"><div class="q-demo__top"><span class="q-demo__tag">Einstein 2026 · Clínica médica</span><span class="q-demo__badge">${svg.check} Comentada</span></div><p class="q-demo__case">Homem de 58 anos, não tabagista, sem antecedentes familiares de fratura por fragilidade, apresenta fratura de rádio distal após queda da própria altura. Relata fadiga crônica e diminuição da libido nos últimos anos. Não faz uso de corticoides, álcool em excesso ou outras medicações sabidamente relacionadas a osteoporose. Exames laboratoriais prévios mostram função renal normal.</p><p class="q-demo__stem">De acordo com as recomendações para investigação de osteoporose em homens, qual é a conduta diagnóstica mais adequada?</p><ol><li><button class="q-demo__alt" type="button" data-qdemo-open="a"><b>A</b><span>Considerar que a presença de fratura por fragilidade, mesmo sem densitometria prévia, já configura diagnóstico de osteoporose e, portanto, iniciar tratamento farmacológico empírico; a investigação de causas secundárias poderia ser adiada para um segundo momento, apenas em caso de falha terapêutica.</span></button></li><li><button class="q-demo__alt" type="button" data-qdemo-open="b"><b>B</b><span>Direcionar a investigação inicial para neoplasias ocultas, como mieloma múltiplo ou câncer de próstata, com exames como PSA, eletroforese de proteínas séricas/urinárias e, eventualmente, imagem avançada, uma vez que, em homens, a osteoporose frequentemente representa manifestação secundária de doenças malignas subjacentes.</span></button></li><li><button class="q-demo__alt" type="button" data-qdemo-open="c"><b>C</b><span>Realizar densitometria óssea (DXA) como exame inicial isolado, visto que a confirmação de baixa densidade mineral já direciona a conduta terapêutica, sendo a pesquisa laboratorial de causas secundárias opcional e geralmente restrita a casos refratários ao tratamento.</span></button></li><li><button class="q-demo__alt" type="button" data-qdemo-open="d"><b>D</b><span>Solicitar densitometria óssea (DXA) associada a uma investigação laboratorial inicial abrangente, incluindo testosterona total, cálcio sérico e urinário, fósforo, fosfatase alcalina, vitamina D e função renal, reconhecendo que até metade dos casos em homens adultos está relacionada a etiologias secundárias.</span></button></li></ol><button class="q-demo__try" type="button" data-qdemo-open>Responder esta questão ${aboutArrow}</button><span class="q-demo__hint">Correção e comentário na hora</span></div>`;
const aboutQuestionDialog = readFileSync(new URL("./data/academy-qdemo.html", import.meta.url), "utf8");

const aboutBancas = [
  ["ENAMED / ENARE", "Acesso direto"],
  ["SUS-SP", "Saúde coletiva"],
  ["FUVEST-USP", "Perfil FMUSP"],
  ["Einstein", "Perfil hospitalar"],
  ["Sírio-Libanês", "Perfil terciário"],
  ["Revalida", "Perfil assistencial"],
];

// Every residency board in the app question bank (ResidencyBankBrands in the app repo: 40 boards).
const allBancas = ["AMP-PR", "Einstein", "ENAMED", "ENARE", "ENARE Clínica Médica", "FAMEMA", "FAMERP", "FM USP", "FMABC", "FMJ", "HAOC", "HCPA", "HPP", "HRAC-USP", "HUV", "IAMSPE", "PSU-GO", "PSU-MG", "Revalida", "SCMBH", "SCMCG", "SCML", "SCMSP", "SES-DF", "SES-GO", "Sírio-Libanês", "SMS-SP", "SUS-BA", "SUS-SP", "UEL", "UEM", "UEPA", "UERJ", "UFCSPA", "UFRJ", "UNESP", "UNIFESP", "UNIP", "USP-RP", "USP-SP"];
const profileBancas = new Set(["ENAMED", "ENARE", "SUS-SP", "FM USP", "Einstein", "Sírio-Libanês", "Revalida"]);
const aboutChevron = '<svg class="about-bancas__chev" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 9.5 12 15l5.5-5.5"/></svg>';

const aboutGroups = [
  {
    kicker: "Estude",
    title: "Conteúdo por tema",
    items: [
      ["books", "ENAMED por tema", `${product.enamedThemes} temas com subtemas, leitura completa e o PDF de cada tema no PRO.`],
      ["graduation-cap", "Trilha Clínica", "Os temas essenciais numa ordem que faz sentido clínico, do conceito ao caso."],
      ["stethoscope", "Casos clínicos", "Sinais, hipóteses e conduta em casos comentados, do primeiro dado à decisão."],
    ],
  },
  {
    kicker: "Fixe",
    title: "Memória de prova",
    items: [
      ["cards", "Flashcards", "Repetição espaçada para revisar o que importa no tempo certo, sem decoreba."],
      ["image", "Quiz de imagens", "Imagens reais para treinar o olhar e reconhecer os achados que fazem a diferença."],
      ["files", "Questões comentadas", "Cada alternativa explicada: você entende por que errou e por que acertou."],
    ],
  },
  {
    kicker: "Evolua",
    title: "Estudo com direção",
    items: [
      ["chart-bar", "Raio-X Acadêmico", "Acurácia, volume e tempo por tema, para ver onde você ainda perde ponto."],
      ["timer", "Plano de estudos", "Um plano personalizado pelas suas metas, pela sua disponibilidade e pelo seu desempenho."],
      ["__devices", "Web, iPhone e Android", "A mesma conta e o mesmo progresso no navegador e nos apps."],
    ],
  },
];

const aboutFaq = [
  ["O que está incluído na Academy?", "<strong>A Academy reúne banco de questões, questões de residência comentadas, provas, simulados, flashcards, casos clínicos e Quiz de imagens.</strong> Para o ENAMED, você também encontra temas com subtemas, leitura completa e o PDF de cada tema, incluídos no PRO."],
  ["Quanto custa?", "<strong>R$ 239,90 por ano, equivalente a R$ 19,99 por mês,</strong> com 7 dias para testar e cancelamento quando quiser, sem fidelidade. Os valores são confirmados no checkout. O Ausculto PRO cobre tudo que está nesta página, sem assinatura separada por módulo."],
  ["Dá para ler alguma coisa antes de criar conta?", "<strong>Sim.</strong> Três temas têm um trecho aberto, com as tabelas, imagens e referências originais. Eles estão em destaque na Biblioteca."],
  ["Como continuo no mesmo tema?", "<strong>O botão ao final de cada trecho abre o tema correspondente no Ausculto.</strong> Se precisar entrar na sua conta, o destino é preservado após a autenticação."],
  ["E o PDF de cada tema?", "<strong>Esse é outro PDF.</strong> Além do ENAMED 2026 Comentado, que é gratuito, quem tem PRO pode baixar qualquer tema em PDF. Todas as páginas recebem seu e-mail como identificação."],
  ["O ENAMED fica separado do resto do app?", "<strong>Não.</strong> É o mesmo Ausculto e a mesma conta. Suas leituras e o seu progresso continuam integrados."],
];

export function aboutSection() {
  const pdf = product.enamed2026Download;
  const groupIcon = (name) => (name === "__devices" ? aboutDevices : icon(name, 22));
  const groups = aboutGroups.map((g) => `<div class="about-group"><p class="about-group__kicker">${g.kicker}</p><h3 class="about-group__title">${g.title}</h3><ul>${g.items.map(([ic, t, d]) => `<li><span class="about-item__icon">${groupIcon(ic)}</span><div><strong>${t}</strong><span>${d}</span></div></li>`).join("")}</ul></div>`).join("");
  const faqItems = aboutFaq.map(([q, a]) => `<details name="academy-faq"><summary><span class="about-faq__q">${q}</span><span class="about-faq__icon" aria-hidden="true"></span></summary><div class="about-faq__a"><p>${a}</p></div></details>`);
  const half = Math.ceil(faqItems.length / 2);
  return `<section class="section about-academy" id="duvidas" aria-labelledby="about-title"><div class="wrap">
    <header class="about-head">
      <div class="about-lockup">
        <img class="about-logo about-logo--tile" src="/assets/academy/academy-app-icon-192.webp" srcset="/assets/academy/academy-app-icon-144.webp 144w, /assets/academy/academy-app-icon-192.webp 192w, /assets/academy/academy-app-icon-288.webp 288w" sizes="(max-width: 600px) 64px, 88px" width="192" height="192" alt="" loading="lazy">
        <h2 id="about-title">Sobre a <em>Academy.</em></h2>
      </div>
      <p class="about-lead">Tudo o que a Ausculto Academy reúne para a residência e o ENAMED, com os números da plataforma e como cada recurso funciona no app.</p>
    </header>

    <div class="about-proof">
      <article class="showcase-hero">
        <div class="showcase-hero__copy">
          <p class="showcase-label">Questões de residência</p>
          <h3 class="showcase-number"><strong>70 mil+</strong><span>questões no banco</span></h3>
          <p class="showcase-hero__text">Provas reais de residência, atualizadas e <span class="acad-accent">comentadas alternativa por alternativa</span>, para você entender o raciocínio de cada questão.</p>
          <ul class="about-checks"><li>Comentário em cada alternativa</li><li>Pontos-chave para revisar</li><li>Provas reais, sempre atualizadas</li></ul>
        </div>
        <div class="showcase-hero__demo">${aboutQuestion}</div>
        <div class="showcase-hero__foot">
          <ul class="showcase-stats"><li><strong>${aboutNumber(product.commentedResidencyQuestions)}</strong><span>questões comentadas</span></li><li><strong>${product.residencyExamsMinimum}+</strong><span>provas de residência</span></li><li><strong>${product.residencyBoards}</strong><span>bancas de residência</span></li></ul>
          <a class="showcase-link" href="${app}">Explorar questões ${aboutArrow}</a>
        </div>
      </article>

      <article class="showcase-sim about-sim">
        <p class="showcase-label">Simulados</p>
        <h3>Com os critérios <em>da sua prova.</em></h3>
        <p class="showcase-sim__text">Questões de provas reais organizadas na <strong>distribuição validada de cada banca</strong> entre Clínica, Cirurgia, Pediatria, G.O. e Preventiva.</p>
        <ul class="about-modes">
          <li><b>Modo Prova</b><span>Cronômetro e gabarito só no final, como no dia da prova.</span></li>
          <li><b>Modo Treino</b><span>Comentário logo após cada resposta.</span></li>
        </ul>
        <div class="sim-mock" aria-hidden="true">
          <div class="sim-toggle"><span>Treino</span><span class="is-on">Prova</span></div>
          <ul><li><span>Banca</span><b>SUS-SP</b></li><li><span>Composição</span><b>Distribuição da banca</b></li><li><span>Tamanho</span><b>20 · 50 · 100 questões</b></li></ul>
          <span class="sim-button">Gerar simulado</span>
        </div>
        <a class="showcase-link" href="${app}">Montar um simulado ${aboutArrow}</a>
      </article>
    </div>

    <div class="about-bancas">
      <p class="about-bancas__title"><span>Cada banca, o seu perfil</span></p>
      <ul>${aboutBancas.map(([b, p]) => `<li><strong>${b}</strong><span>${p}</span></li>`).join("")}</ul>
      <details class="about-bancas__all">
        <summary><span class="about-bancas__label-open">Ver todas as bancas</span><span class="about-bancas__label-close">Ocultar bancas</span><span class="about-bancas__count">${allBancas.length}</span>${aboutChevron}</summary>
        <div class="about-bancas__panel">
          <ul class="about-bancas__grid">${allBancas.map((b) => `<li${profileBancas.has(b) ? ' class="is-profile"' : ""}>${b}</li>`).join("")}</ul>
          <p class="about-bancas__note"><i aria-hidden="true"></i>Em destaque, as bancas com perfil próprio nos simulados.</p>
        </div>
      </details>
    </div>

    <div class="about-included">
      <div class="about-included__head"><p class="kicker">TUDO INCLUÍDO</p><h3>Estude, fixe e evolua <em>no mesmo app.</em></h3></div>
      <div class="about-groups">${groups}</div>
    </div>

    <div class="showcase-close about-close">
      <div class="about-free"><span class="showcase-extras__icon">${icon("files", 22)}</span><div><strong>${pdf.title} <span class="acad-tag">Grátis</span></strong><span>PDF com <b>${pdf.questions} questões</b> e <b>${pdf.commentedAlternatives} alternativas comentadas</b>, em ${pdf.pages} páginas. Basta criar sua conta.</span></div><a class="about-free__link" href="#enamed-comentado">Baixar o PDF ${aboutArrow}</a></div>
      <div class="showcase-actions"><a class="showcase-cta" href="${app}">Começar grátis ${aboutArrow}</a><a class="showcase-plans" href="https://www.auscultoapp.com/#planos">Ver planos e preços</a></div>
    </div>

    <div class="about-faq">
      <div class="about-faq__head"><h3>Perguntas <em>frequentes</em></h3><p>Ainda tem dúvidas? Escreva para <a href="mailto:suporte@auscultoapp.com">suporte@auscultoapp.com</a></p></div>
      <div class="about-faq__cols"><div class="about-faq__list">${faqItems.slice(0, half).join("")}</div><div class="about-faq__list">${faqItems.slice(half).join("")}</div></div>
    </div>
  </div>${aboutQuestionDialog}</section>`;
}
