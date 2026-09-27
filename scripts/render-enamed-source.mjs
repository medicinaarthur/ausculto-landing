/** Regenerate the retained continuous.html entry using the shared presentation. */
import { writeFileSync } from "node:fs";
import { page } from "./academy-articles.mjs";
import { materialComposition } from "./academy-landing.mjs";
import { articleLinks, appLink } from "./academy-presentation.mjs";
const cta = `<a class="academy-button" href="${appLink()}">Continuar no Ausculto ↗</a>`;
const body = `<section class="academy-hero enamed-hero"><div class="wrap hero-grid"><div class="hero-copy"><p class="kicker">AUSCULTO ACADEMY · ENAMED</p><h1>Prepare-se para o ENAMED <em>com continuidade.</em></h1><p class="lead">Compreenda com os resumos, revise o que aprendeu e pratique ao longo da sua formação. Seu estudo e seu histórico continuam no mesmo Ausculto.</p><div class="hero-actions">${cta}<a class="text-link" href="#ciclo">Conhecer o percurso ↓</a></div><p class="hero-note">69 temas com subtemas incluídos no PRO atual.<br>Sem uma assinatura adicional.</p></div>${materialComposition()}</div><div class="wrap hero-bottom"><span>Leitura com contexto</span><span>Revisão e prática</span><span>Acompanhamento contínuo</span></div></section><section class="section" id="ciclo"><div class="wrap"><p class="kicker">O PRÓXIMO PASSO COMEÇA NO QUE VOCÊ APRENDEU</p><h2>Um ciclo para continuar estudando.</h2><div class="enamed-cycle">${[
  [
    "01 / LEITURA",
    "Compreenda o tema.",
    "Estude com os resumos, tabelas e imagens. Amplie os detalhes e ajuste a fonte no app.",
  ],
  [
    "02 / REVISÃO",
    "Volte ao que importa.",
    "Retome favoritos e anotações. Use os recursos de revisão disponíveis no Ausculto.",
  ],
  [
    "03 / PRÁTICA",
    "Exercite o raciocínio.",
    "Pratique questões e casos clínicos para colocar o conhecimento em uso.",
  ],
  [
    "04 / ACOMPANHAMENTO",
    "Escolha como continuar.",
    "Acompanhe seu progresso de leitura e desempenho nas práticas. Preserve seu histórico.",
  ],
]
  .map(
    ([n, t, p]) =>
      `<article><span>${n}</span><h3>${t}</h3><p>${p}</p></article>`,
  )
  .join(
    "",
  )}</div></div></section><section class="section continuity"><div class="wrap reader-grid"><div><p class="kicker">SEU ESTUDO TEM UMA HISTÓRIA</p><h2>Você continua.<br>Seu histórico também.</h2></div><div><p class="lead">A preparação contínua faz parte do Ausculto. Suas leituras, favoritos e anotações permanecem na sua conta, junto dos recursos de estudo e prática.</p><p>Retome a leitura de onde parou. Veja seu progresso e use o desempenho nas sessões para decidir o que estudar a seguir.</p>${cta}</div></div></section><section class="section"><div class="wrap"><div class="section-heading"><div><p class="kicker">MATERIAL REAL, PARA ESTUDAR AGORA</p><h2>Comece por um tema.</h2></div><p>Três leituras gratuitas para conhecer o material. Ao terminar, continue no resumo correspondente no app.</p></div>${articleLinks()}</div></section><section class="section pro"><div class="wrap pro-grid"><div><p class="kicker">INCLUÍDO NO AUSCULTO PRO</p><h2>69 temas.<br>Aprofundamento em cada etapa.</h2></div><div><p class="lead">Tabelas, imagens, leitura organizada e download do PDF personalizado com seu e-mail verificado em todas as páginas.</p><p>Sem uma assinatura separada. Acesse com sua conta PRO atual.</p><a class="academy-button academy-button--light" href="https://www.auscultoapp.com/estudantes/">Explorar a Academy ↗</a></div></div></section><section class="section closing"><div class="wrap"><h2>Um tema hoje.<br>Mais clareza no próximo passo.</h2>${cta}</div></section>`;
let html = page({
  title: "Prepare-se para o ENAMED com continuidade",
  description:
    "69 temas com subtemas, leitura, revisão e prática com histórico preservado. Incluídos no Ausculto PRO atual.",
  path: "/enamed/",
  body,
});
html = html
  .replaceAll(
    "https://www.auscultoapp.com/enamed/",
    "https://enamed.auscultoapp.com/",
  )
  .replaceAll(
    'href="/estudantes/',
    'href="https://www.auscultoapp.com/estudantes/',
  )
  .replaceAll(
    'href="/conteudos/',
    'href="https://www.auscultoapp.com/conteudos/',
  );
writeFileSync(new URL("../enamed/continuous.html", import.meta.url), html);
console.log("ENAMED continuous source rendered. Campaign unchanged.");
