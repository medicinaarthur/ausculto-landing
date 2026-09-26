// The photographs, the supplied backdrop and the interface share a 1672 × 941 canvas. People stand in front of the desk.
// The hero is clipped by a curve (objectBoundingBox clipPath) so the next block's background shows through — no filled wave, no seam.
// Phones get WebP variants (~900 px) through <picture>; desktop keeps the original PNGs.
const icon = name => `<img src="/assets/academy/icons/${name}.svg" alt="" width="24" height="24">`;
const items = values => `<ul class="ah-benefit-items">${values.map(([name, label]) => `<li><span class="ah-icon">${icon(name)}</span><span>${label}</span></li>`).join("")}</ul>`;
const picture = (base, attrs) => `<picture><source media="(max-width:1000px)" type="image/webp" srcset="/assets/academy/${base}-m.webp"><source type="image/webp" srcset="/assets/academy/${base}.webp"><img src="/assets/academy/${base}.png" ${attrs}></picture>`;

export function academyHero() {
  return `<div class="ah-frame">
  <section class="academy-hero" aria-label="Ausculto Academy">
    <div class="ah-background" aria-hidden="true"><picture><source media="(max-width:600px)" type="image/webp" srcset="/assets/academy/academy-hero-backdrop-mobile.webp"><source media="(max-width:1000px)" type="image/webp" srcset="/assets/academy/academy-hero-background-m.webp"><source type="image/webp" srcset="/assets/academy/academy-hero-background.webp"><img src="/assets/academy/academy-hero-background.png" alt="" width="1672" height="941" fetchpriority="high"></picture></div>
    <div class="ah-scene" data-people-campaign aria-hidden="true">
      <div class="ah-person ah-person--couple is-active" data-people-pair>${picture("academy-hero-people-01", 'class="campaign-person" alt="" width="1122" height="1402" fetchpriority="high"')}</div>
      <div class="ah-person ah-person--doctor" data-people-pair>${picture("academy-hero-doctor", 'class="campaign-person" alt="" width="1069" height="1471" decoding="async"')}</div>
    </div>
    <div class="ah-copy">
      <p class="ah-eyebrow">CONHECIMENTO TRANSFORMA</p>
      <h1><span>Seu próximo</span><span>passo na</span><em>medicina.</em></h1>
      <p class="ah-subtitle"><span class="acad-accent">14.345 questões</span> de residência comentadas,<br> ENAMED e a biblioteca por tema no mesmo app.</p>
      <a class="ah-cta ah-cta--2l" href="#caminhos"><span class="ah-cta__main">Explorar a Academy <span aria-hidden="true">→</span></span><span class="ah-cta__sub">Residência · ENAMED · PDF gratuito</span></a>
      <p class="ah-stores"><span>Também no celular:</span><a class="ah-store" href="https://play.google.com/store/apps/details?id=br.com.ausculto.app" target="_blank" rel="noopener" data-cta-position="estudantes_hero" aria-label="Ausculto para Android no Google Play">Google Play</a><a class="ah-store" href="https://apps.apple.com/br/app/ausculto/id6760672276" target="_blank" rel="noopener" data-cta-position="estudantes_hero" aria-label="Ausculto para iPhone na App Store">App Store</a></p>
    </div>
    <div class="ah-benefits" aria-label="O que você encontra no Ausculto">
      <div class="ah-indicators" aria-hidden="true"><span class="is-active" data-hero-indicator></span><span data-hero-indicator></span></div>
      <strong class="ah-benefit-title">O que você encontra no Ausculto.</strong>
      <div class="ah-benefit-stack">
        <div class="ah-benefit-panel is-active" data-benefit-panel>${items([["files", "Provas<br>por banca"], ["note-pencil", "Questões<br>comentadas"], ["chart-line-up", "Acompanhamento<br>do desempenho"]])}</div>
        <div class="ah-benefit-panel" data-benefit-panel aria-hidden="true">${items([["books", "ENAMED<br>por tema"], ["cards", "Flashcards"], ["stethoscope", "Casos<br>clínicos"]])}</div>
      </div>
    </div>
    <p class="ah-signature">MAIS MÉDICOS<br>PARA UM AMANHÃ MELHOR</p>
  </section>
  <svg class="ah-wave" viewBox="0 0 1672 210" preserveAspectRatio="none" aria-hidden="true">
    <defs><linearGradient id="ah-wave-gold" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#c9a45e"/><stop offset=".55" stop-color="#e9d3a4"/><stop offset="1" stop-color="#b8924c"/></linearGradient></defs>
    <path d="M0 78 C300 20 560 200 960 196 C1240 193 1470 150 1672 122" fill="none" stroke="url(#ah-wave-gold)" stroke-width="2.4" vector-effect="non-scaling-stroke"/>
  </svg>
  <svg class="ah-clip-defs" width="0" height="0" aria-hidden="true" focusable="false">
    <defs>
      <clipPath id="ah-clip" clipPathUnits="objectBoundingBox"><path d="M0 0H1V.9065C.8792 .9362 .7416 .982 .5742 .9851C.3349 .9894 .1794 .7981 0 .8597Z"/></clipPath>
      <clipPath id="ah-clip-mobile" clipPathUnits="objectBoundingBox"><path d="M0 0H1V.962C.78 .984 .42 .996 0 .972Z"/></clipPath>
    </defs>
  </svg>
  </div>`;
}

export function academyBridge() {
  return `<section class="academy-bridge" aria-label="A Academy em números">
    <p>A ACADEMY EM NÚMEROS</p>
    <div class="ab-metrics">
      <div>${icon("note-pencil")}<strong>14.345</strong><span>questões comentadas</span></div>
      <div>${icon("files")}<strong>70 mil+</strong><span>questões no banco</span></div>
      <div>${icon("users-three")}<strong>160+</strong><span>provas de residência</span></div>
      <div>${icon("graduation-cap")}<strong>40</strong><span>bancas de residência</span></div>
    </div>
  </section>`;
}
