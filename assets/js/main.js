/* ============================================================
   AUSCULTO · página principal — interações
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav scroll ---------- */
  const nav = $('#nav');
  const onScrollNav = () => nav.classList.toggle('scrolled', window.scrollY > 24);
  addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ---------- mobile menu ---------- */
  const mmenu = $('#mmenu'), burger = $('#burger'), mclose = $('#mclose');
  function setMenu(open) {
    mmenu.classList.toggle('open', open);
    mmenu.setAttribute('aria-hidden', open ? 'false' : 'true');
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setMenu(true));
  mclose.addEventListener('click', () => setMenu(false));
  $$('#mmenu a[href^="#"]').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  /* ---------- ticker: duplicate for seamless loop ---------- */
  const tt = $('#tickerTrack');
  if (tt) tt.innerHTML += tt.innerHTML;

  /* ---------- reveal ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: .12, rootMargin: '0px 0px -6% 0px' })
    : null;
  $$('.rv').forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- hero video: emenda do loop ----------
     A versão anterior levava a opacidade a zero no fim de cada volta, então o
     laço piscava preto a cada 10s em vez de emendar. Agora o vale para num
     piso e a curva é cosseno, não linear: a virada some. E o laço de animação
     dorme com o herói fora da tela ou com a aba oculta, em vez de girar
     eternamente gastando bateria no celular. */
  const hv = $('#heroVideo');
  if (hv && !reduced) {
    hv.play().catch(() => {});
    const TETO = .62, PISO = .38, RAMPA = .85;
    const suave = x => (1 - Math.cos(Math.PI * Math.min(1, Math.max(0, x)))) / 2;
    let raf = 0, ativo = false;
    const tick = () => {
      const d = hv.duration || 10, t = hv.currentTime;
      const k = Math.min(suave(t / RAMPA), suave((d - t) / RAMPA));
      hv.style.opacity = (PISO + (TETO - PISO) * k).toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    const liga = () => { if (!ativo) { ativo = true; raf = requestAnimationFrame(tick); hv.play().catch(() => {}); } };
    const desliga = () => { ativo = false; cancelAnimationFrame(raf); };
    liga();
    if (window.IntersectionObserver) {
      new IntersectionObserver(es => es[0].isIntersecting ? liga() : desliga(), { threshold: 0 }).observe(hv);
    }
    addEventListener('visibilitychange', () => document.hidden ? desliga() : liga());
  } else if (hv) { hv.pause(); hv.style.opacity = .62; }

  /* ---------- hero tilt (desktop) ---------- */
  const tilt = $('#tilt');
  const fine = matchMedia('(pointer:fine)').matches && matchMedia('(min-width:981px)').matches;
  if (tilt && fine && !reduced) {
    const frame = tilt.querySelector('.stage-frame');
    if (frame) {
      tilt.addEventListener('mousemove', e => {
        const r = tilt.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        frame.style.transform = `rotateX(${6 - y * 4}deg) rotateY(${x * 6}deg)`;
      });
      tilt.addEventListener('mouseleave', () => { frame.style.transform = 'rotateX(6deg)'; });
    }
  }

  /* ---------- hero: modo médico ⇄ estudante + carrossel estudante ---------- */
  const heroDuo = $('#heroDuo');
  const heroUrl = $('#heroUrl');
  /* palco: Meu Plantão em crossfade com o hub (modo médico) */
  const mcarSlides = $$('#medCar .mcar__slide');
  let mcarTimer = null, mcarIdx = 0;
  function mcarStart() {
    if (mcarSlides.length < 2 || mcarTimer) return;
    mcarTimer = setInterval(() => {
      mcarIdx = (mcarIdx + 1) % mcarSlides.length;
      mcarSlides.forEach((s, k) => s.classList.toggle('on', k === mcarIdx));
    }, 4200);
  }
  function mcarStop() { clearInterval(mcarTimer); mcarTimer = null; }
  mcarStart();

  const modeBtns = $$('.hero__mode button');

  const scar = $('#stuCar');
  const scarSlides = scar ? $$('.scar__slide', scar) : [];
  const scarTabs = scar ? $$('.scar__tab', scar) : [];
  const phCar = $('#stuPhCar');
  const phSlides = phCar ? $$('img', phCar) : [];
  const SCAR_DUR = 4600;
  let scarIdx = 0, scarTimer = null, scarHover = false;

  function scarGo(i, user) {
    if (!scarSlides.length) return;
    scarIdx = (i + scarSlides.length) % scarSlides.length;
    scarSlides.forEach((s, k) => s.classList.toggle('on', k === scarIdx));
    phSlides.forEach((s, k) => s.classList.toggle('on', k === scarIdx));
    scarTabs.forEach((t, k) => {
      const on = k === scarIdx;
      if (on && !t.classList.contains('on')) {
        t.classList.remove('on'); void t.offsetWidth; // reinicia a barra de progresso
      }
      t.classList.toggle('on', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    if (user) scarRestart();
  }
  function scarNext() { if (!scarHover) scarGo(scarIdx + 1); }
  function scarStart() {
    scarStop();
    if (!reduced) scarTimer = setInterval(scarNext, SCAR_DUR);
  }
  function scarStop() { if (scarTimer) { clearInterval(scarTimer); scarTimer = null; } }
  function scarRestart() { if (heroDuo && heroDuo.classList.contains('stu')) scarStart(); }
  if (scar) {
    scar.style.setProperty('--scar-dur', (SCAR_DUR / 1000) + 's');
    scarTabs.forEach(t => t.addEventListener('click', () => scarGo(+t.dataset.slide, true)));
    const frame = scar.closest('.stage-frame');
    if (frame) {
      frame.addEventListener('mouseenter', () => scarHover = true);
      frame.addEventListener('mouseleave', () => scarHover = false);
    }
  }

  function setMode(mode) {
    if (!heroDuo) return;
    const stu = mode === 'stu';
    heroDuo.classList.toggle('stu', stu);
    modeBtns.forEach(b => {
      const on = b.dataset.mode === mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    if (heroUrl) heroUrl.textContent = stu ? 'app.auscultoapp.com/estudo' : 'app.auscultoapp.com/ferramentas';
    if (stu) { scarGo(0); scarStart(); mcarStop(); } else { scarStop(); mcarStart(); }
  }
  modeBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  /* ---------- ferramentas: filtro por momento ---------- */
  const filBtns = $$('.tfil');
  const toolCards = $$('#toolsGrid [data-cat]');
  /* contador por filtro — e desativa grupo sem itens */
  filBtns.forEach(btn => {
    const f = btn.dataset.fil;
    const c = f === 'all' ? toolCards.length : toolCards.filter(card => (card.dataset.cat || '').split(' ').includes(f)).length;
    const n = document.createElement('sup');
    n.className = 'tfil__n'; n.textContent = c;
    btn.appendChild(n);
    if (!c) { btn.style.opacity = '.45'; btn.style.pointerEvents = 'none'; btn.setAttribute('aria-disabled', 'true'); }
  });
  filBtns.forEach(btn => btn.addEventListener('click', () => {
    filBtns.forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const f = btn.dataset.fil;
    toolCards.forEach(card => {
      const show = f === 'all' || (card.dataset.cat || '').split(' ').includes(f);
      if (show) {
        card.hidden = false;
        requestAnimationFrame(() => requestAnimationFrame(() => card.classList.remove('fil-off')));
      } else {
        card.classList.add('fil-off');
        setTimeout(() => { if (card.classList.contains('fil-off')) card.hidden = true; }, 260);
      }
    });
  }));

  /* ---------- meu plantão: etapas com autoplay ---------- */
  const flowImg = $('#flowImg');
  const fsteps = $$('.fstep2');
  let flowIdx = 0, flowTimer = null, flowHold = null;
  const FLOW_DUR = 5600;

  function flowActivate(i, user) {
    if (!fsteps.length) return;
    flowIdx = (i + fsteps.length) % fsteps.length;
    fsteps.forEach((b, k) => {
      const on = k === flowIdx;
      if (on && !b.classList.contains('on')) { b.classList.remove('on'); void b.offsetWidth; }
      b.classList.toggle('on', on);
      b.classList.toggle('auto', on && !reduced && !user);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    const btn = fsteps[flowIdx];
    const src = btn.dataset.img;
    if (flowImg && flowImg.getAttribute('src') !== src) {
      flowImg.style.opacity = 0;
      setTimeout(() => {
        flowImg.src = src; flowImg.alt = btn.dataset.alt || '';
        flowImg.onload = () => flowImg.style.opacity = 1;
      }, 180);
    }
    if (user) {
      flowStop();
      if (flowHold) clearTimeout(flowHold);
      flowHold = setTimeout(flowStart, 14000);
    }
  }
  function flowStart() {
    flowStop();
    if (!reduced && fsteps.length) {
      fsteps[flowIdx] && fsteps[flowIdx].classList.add('auto');
      flowTimer = setInterval(() => flowActivate(flowIdx + 1), FLOW_DUR);
    }
  }
  function flowStop() {
    if (flowTimer) { clearInterval(flowTimer); flowTimer = null; }
    fsteps.forEach(b => b.classList.remove('auto'));
  }
  fsteps.forEach((b, i) => b.addEventListener('click', () => flowActivate(i, true)));
  if (fsteps.length && flowImg) {
    fsteps.forEach(b => { const i = new Image(); i.src = b.dataset.img; });
    if (!reduced) flowStart();
  }

  /* ---------- registry modes ---------- */
  const regTitle = $('#regTitle'), regDesc = $('#regDesc');
  $$('.rmode').forEach(btn => btn.addEventListener('click', () => {
    $$('.rmode').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    regTitle.style.opacity = 0; regDesc.style.opacity = 0;
    setTimeout(() => {
      regTitle.textContent = btn.dataset.t; regDesc.textContent = btn.dataset.d;
      regTitle.style.opacity = 1; regDesc.style.opacity = 1;
    }, 150);
  }));

  /* ---------- documentos: fichas selecionáveis + lightbox ---------- */
  const lb = $('#fichaLb'), lbImg = $('#fichaLbImg'), lbCap = $('#fichaLbCap'), lbClose = $('#fichaLbClose');
  function openLb(src, alt) {
    if (!lb) return;
    lbImg.src = src; lbImg.alt = alt || '';
    lbCap.textContent = alt || '';
    lb.classList.add('open');
    lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    if (!lb) return;
    lb.classList.remove('open');
    lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  if (lb) {
    lbClose.addEventListener('click', closeLb);
    lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
    addEventListener('keydown', e => { if (e.key === 'Escape') closeLb(); });
  }
  function initFichaStage(thumbSel, mainImgSel, mainBtnSel) {
    const thumbs = $$(thumbSel);
    const mainImg = $(mainImgSel);
    const mainBtn = $(mainBtnSel);
    if (!thumbs.length || !mainImg || !mainBtn) return;
    thumbs.forEach(t => {
      if (t.dataset.tint) t.style.setProperty('--tint', t.dataset.tint);
      t.addEventListener('click', () => {
        thumbs.forEach(x => { x.classList.remove('on'); x.setAttribute('aria-selected', 'false'); });
        t.classList.add('on'); t.setAttribute('aria-selected', 'true');
        if (t.dataset.tint) mainBtn.style.setProperty('--tint', t.dataset.tint);
        if (mainImg.getAttribute('src') !== t.dataset.src) {
          mainImg.style.opacity = 0;
          setTimeout(() => {
            mainImg.src = t.dataset.src; mainImg.alt = t.dataset.alt || '';
            mainImg.onload = () => mainImg.style.opacity = 1;
          }, 200);
        }
      });
    });
    mainBtn.addEventListener('click', () => openLb(mainImg.getAttribute('src'), mainImg.alt));
  }

  /* screenshots com moldura de navegador abrem no mesmo lightbox */
  $$('.shot-frame').forEach(f => f.addEventListener('click', () => openLb(f.dataset.full, f.dataset.cap || f.querySelector('img')?.alt || '')));
  initFichaStage('.ficha-thumbs:not(.ficha-thumbs--m) .ficha-thumb', '#fichaMainImg', '#fichaMain');
  initFichaStage('.ficha-thumbs--m .ficha-thumb', '#fichaMainImgM', '.ficha-main--m');

  /* ---------- estudantes: ciclo das folhas de vidro ---------- */
  const gstack = $('#gstack');
  if (gstack) gstack.addEventListener('click', () => {
    gstack.classList.add('fanned');
    clearTimeout(gstack._ft);
    gstack._ft = setTimeout(() => gstack.classList.remove('fanned'), 2400);
  });
  const gfSlides = $$('#gframeMain .gf-slide');
  if (gfSlides.length > 1 && !reduced) {
    let gi = 0;
    setInterval(() => {
      gi = (gi + 1) % gfSlides.length;
      gfSlides.forEach((s, k) => s.classList.toggle('on', k === gi));
    }, 4200);
  }

  /* ---------- APOIO: 5 módulos + rail affordances ---------- */
  const MODS = {
    protocolos:   { img: 'assets/ads-medico/shot-protocolos.webp', url: 'app.auscultoapp.com/protocolos', kicker: 'Fonte primária brasileira', title: 'Conduta com base no que se pratica aqui', desc: 'Protocolos de sociedades brasileiras como fonte primária, prontos para o leito. Referência internacional entra como complemento — nunca como dose principal.', stats: ['Vigente', 'Fonte brasileira', 'Uso com alerta'], alt: 'Lista de protocolos clínicos com selos de vigência e fonte brasileira' },
    calculadoras: { img: 'assets/ads-medico/shot-calculadoras.webp', url: 'app.auscultoapp.com/calculadoras', kicker: '150+ calculadoras e escores', title: 'O cálculo certo, sem sair do caso', desc: 'Escores organizados por especialidade para encontrar rápido o que o momento pede — do clearance à gravidade da sepse.', stats: ['Por especialidade', 'Resultado na hora'], alt: 'Calculadoras clínicas organizadas por especialidade' },
    smartbulas:   { img: 'assets/ads-medico/shot-smartbulas.webp', url: 'app.auscultoapp.com/smartbulas', kicker: '5.255 bulas estruturadas', title: 'A bula que responde, não a que atrapalha', desc: 'Resumos inteligentes de bulas para decisões mais seguras — dose, ajuste renal, gestação e alertas direto ao ponto.', stats: ['Dose e ajuste', 'Alertas diretos'], alt: 'SmartBulas com resumos estruturados de medicamentos' },
    interacoes:   { img: 'assets/ads-medico/shot-interacoes.webp', url: 'app.auscultoapp.com/interacoes', kicker: '24.145 interações mapeadas', title: 'Cheque a prescrição inteira de uma vez', desc: 'Interações medicamentosas mapeadas e classificadas por gravidade — antes de o paciente receber a primeira dose.', stats: ['Por gravidade', 'Prescrição inteira'], alt: 'Checagem de interações medicamentosas com classificação de gravidade' },
    ausmind:      { img: 'assets/landing/ausmind-new.webp', url: 'app.auscultoapp.com/ausmind', kicker: 'Inteligência clínica do Ausculto', title: 'A IA que mostra a fonte e admite o limite', desc: 'Analise casos, revise condutas e consulte protocolos com fontes rastreáveis. O AusMind gera fluxogramas, resumos e flashcards — e deixa claro onde a decisão continua sendo sua.', stats: ['Fontes rastreáveis', 'Fluxogramas e flashcards', 'Protocolo BR primeiro'], alt: 'AusMind IA: inteligência clínica com ações, fontes relacionadas e contexto do caso' }
  };
  const modImg = $('#modImg'), modK = $('#modKicker'), modT = $('#modTitle'), modD = $('#modDesc'), modS = $('#modStats'), modU = $('#modUrl'), modF = $('#modFrame');
  $$('.mtab').forEach(btn => btn.addEventListener('click', () => {
    $$('.mtab').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-selected', 'false'); });
    btn.classList.add('on'); btn.setAttribute('aria-selected', 'true');
    const m = MODS[btn.dataset.mod]; if (!m) return;
    modImg.style.opacity = 0; modImg.style.transform = 'translateY(8px)';
    modT.style.opacity = 0; modD.style.opacity = 0;
    setTimeout(() => {
      modImg.src = m.img; modImg.alt = m.alt;
      modImg.onload = () => { modImg.style.opacity = 1; modImg.style.transform = 'none'; };
      modK.textContent = m.kicker; modT.textContent = m.title; modD.textContent = m.desc;
      modT.style.opacity = 1; modD.style.opacity = 1;
      modS.innerHTML = m.stats.map(s => '<span><svg><use href="#i-check"/></svg>' + s + '</span>').join('');
      if (modU) modU.textContent = m.url;
      if (modF) { modF.dataset.full = m.img; modF.dataset.cap = m.alt; }
    }, 200);
  }));
  Object.values(MODS).forEach(m => { const i = new Image(); i.src = m.img; });

  // rail affordances: fade masks, progress line, hint chevron (mobile)
  const rail = $('#apoioRail'), hint = $('#apoioHint'), prog = $('#apoioProg');
  if (rail) {
    const upd = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const left = rail.scrollLeft > 8, right = rail.scrollLeft < max - 8;
      rail.classList.toggle('mask-start', left && !right);
      rail.classList.toggle('mask-end', !left && right);
      rail.classList.toggle('mask-both', left && right);
      if (prog) prog.style.width = (18 + (max > 0 ? rail.scrollLeft / max : 0) * 82) + '%';
      if (hint) hint.style.opacity = (right && !left) ? 1 : 0;
    };
    rail.addEventListener('scroll', upd, { passive: true });
    addEventListener('resize', upd);
    upd();
  }

  /* ---------- documentos: carrossel mobile autoplay ---------- */
  const track = $('#docsTrack');
  if (track) {
    const dots = $$('#docsDots button');
    let idx = 0, paused = false, resume = null;
    const AUTO = 4800;
    const goTo = i => {
      const el = track.children[i];
      if (el) track.scrollTo({ left: el.offsetLeft - 28, behavior: 'smooth' });
    };
    const setIdx = i => {
      idx = i;
      dots.forEach((d, k) => {
        d.classList.toggle('on', k === i);
        const f = d.querySelector('.dot-fill');
        if (f) f.style.animation = 'none', void f.offsetWidth, f.style.animation = '';
      });
    };
    track.addEventListener('scroll', () => {
      const x = track.scrollLeft; let best = 0, bd = Infinity;
      Array.from(track.children).forEach((c, i) => {
        const d = Math.abs(c.offsetLeft - 28 - x);
        if (d < bd) { bd = d; best = i; }
      });
      if (best !== idx) setIdx(best);
    }, { passive: true });
    const hold = () => {
      paused = true;
      if (resume) clearTimeout(resume);
      resume = setTimeout(() => paused = false, 6000);
    };
    track.addEventListener('pointerdown', hold);
    track.addEventListener('touchstart', hold, { passive: true });
    dots.forEach((d, i) => d.addEventListener('click', () => { hold(); goTo(i); }));
    if (!reduced) setInterval(() => { if (!paused) goTo((idx + 1) % track.children.length); }, AUTO);
  }

  /* ---------- pricing ---------- */
  const PLANS = {
    monthly:    { price: 'R$ 29,90', label: '/ mês', note: 'Cobrança mensal, sem fidelidade.', cta: 'Escolher PRO mensal', badge: 'Mais flexível', term: 'monthly' },
    semiannual: { price: 'R$ 149,90', label: '/ semestre', note: 'Equivalente a R$ 24,98/mês, em cobrança semestral.', cta: 'Escolher PRO semestral', badge: 'Melhor equilíbrio', term: 'semiannual' },
    annual:     { price: 'R$ 239,90', label: '/ ano', note: 'Equivalente a R$ 19,99/mês — 33% de economia.', cta: 'Escolher PRO anual', badge: 'Mais escolhido', term: 'annual' }
  };
  const proPrice = $('#proPrice'), proLabel = $('#proLabel'), proNote = $('#proNote'),
        proCta = $('#proCta'), proBadge = $('#proBadge');
  $$('.periods button').forEach(btn => btn.addEventListener('click', () => {
    $$('.periods button').forEach(b => b.classList.remove('on'));
    btn.classList.add('on');
    const p = PLANS[btn.dataset.period]; if (!p) return;
    proPrice.style.opacity = 0;
    setTimeout(() => {
      proPrice.textContent = p.price; proLabel.textContent = p.label; proNote.textContent = p.note;
      proBadge.textContent = p.badge;
      proCta.innerHTML = p.cta + ' <svg><use href="#i-arrow"/></svg>';
      proCta.href = 'https://app.auscultoapp.com/?utm_source=landing&utm_medium=site_pricing&utm_content=pro_' + p.term + '&utm_campaign=site_2026';
      proPrice.style.opacity = 1;
    }, 160);
  }));

  /* ---------- QDEMO: questão interativa ---------- */
  (function qdemo() {
    const root = $('#qdemo'), toggle = $('#qdemoToggle');
    if (!root || !toggle) return;
    const CORRECT = 'd';
    const alts = $$('[data-qdemo-alt]', root);
    const strips = $$('.qdemo-strip', root);
    const verify = $('[data-qdemo-verify]', root);
    const cta = $('[data-qdemo-cta]', root);
    const editorial = $('[data-qdemo-editorial]', root);
    const closeBtn = $('[data-qdemo-close]', root);
    let phase = 'idle', selected = null, isOpen = false;

    function openDemo() {
      if (isOpen) return;
      isOpen = true;
      root.hidden = false;
      root.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => requestAnimationFrame(() => {
        root.classList.add('is-open');
        setTimeout(() => root.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' }), 260);
      }));
    }
    function closeDemo() {
      isOpen = false;
      root.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      setTimeout(() => { root.hidden = true; root.setAttribute('aria-hidden', 'true'); }, 480);
    }
    toggle.addEventListener('click', () => isOpen ? closeDemo() : openDemo());
    if (closeBtn) closeBtn.addEventListener('click', closeDemo);

    alts.forEach(btn => btn.addEventListener('click', () => {
      if (phase === 'answered') return;
      const key = btn.dataset.qdemoAlt;
      if (phase === 'idle') {
        phase = 'selected'; selected = key;
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        verify.hidden = false;
      } else if (selected === key) {
        answer(key);
      } else {
        alts.forEach(b => { b.classList.remove('is-selected'); b.setAttribute('aria-pressed', 'false'); });
        selected = key;
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
      }
    }));

    if (verify) verify.addEventListener('click', () => { if (selected) answer(selected); });

    function answer(key) {
      phase = 'answered';
      verify.hidden = true;
      alts.forEach(b => {
        b.disabled = true;
        b.classList.remove('is-selected');
        const k = b.dataset.qdemoAlt;
        if (k === CORRECT) b.classList.add('is-correct');
        else if (k === key) b.classList.add('is-wrong');
      });
      strips.forEach(s => s.hidden = false);
      if (editorial) {
        editorial.hidden = false;
        requestAnimationFrame(() => editorial.classList.add('is-in'));
      }
      if (cta) cta.hidden = false;
      setTimeout(() => {
        const target = key === CORRECT ? editorial : root.querySelector('.qdemo-alt.is-' + (key === CORRECT ? 'correct' : 'wrong'));
        if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      }, 300);
    }
  })();

  /* ---------- navegação: scroll-spy ---------- */
  const spyLinks = $$('.nav__links a[href^="#"]');
  const spyMap = new Map();
  spyLinks.forEach(a => { const sec = document.querySelector(a.getAttribute('href')); if (sec) spyMap.set(sec, a); });
  if (spyMap.size) {
    const spy = new IntersectionObserver(es => {
      es.forEach(e => {
        if (e.isIntersecting) {
          spyLinks.forEach(a => a.classList.remove('on'));
          const link = spyMap.get(e.target);
          if (link) link.classList.add('on');
        }
      });
    }, { rootMargin: '-38% 0px -52% 0px' });
    spyMap.forEach((a, sec) => spy.observe(sec));
  }


  /* ---------- efeito cinematográfico V17 (scale-reveal do herói) ---------- */
  (function () {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    if (!matchMedia('(min-width: 941px)').matches) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const hero = document.querySelector('.hero');
    if (!hero) return;
    gsap.registerPlugin(ScrollTrigger);

    /* o efeito fixa o herói e faz a seção seguinte deslizar por cima — só fecha
       se o herói couber inteiro na tela. Mais alto que a viewport, o mockup fica
       na parte que nunca aparece e é encoberto pela metade. Nesse caso cai no
       comportamento normal, o mesmo de ≤940px. */
    const cabeNaTela = () => hero.offsetHeight <= innerHeight;
    if (!cabeNaTela()) return;
    document.documentElement.classList.add('cinematic');
    addEventListener('resize', () => {
      document.documentElement.classList.toggle('cinematic', cabeNaTela());
    }, { passive: true });

    gsap.to(hero, {
      scale: 0.93, ease: 'none',
      scrollTrigger: { trigger: '#top', start: 'top top', end: '+=90%', scrub: 1 }
    });
    gsap.to('.hero__band-in', {
      yPercent: -7, ease: 'none',
      scrollTrigger: { trigger: '#top', start: 'top top', end: '+=90%', scrub: 1 }
    });
    gsap.to('.hero__in', {
      yPercent: -6, opacity: 0.4, ease: 'none',
      scrollTrigger: { trigger: '#top', start: 'top top', end: '+=70%', scrub: 1 }
    });
  })();

  /* ---------- sticky CTA ---------- */
  const sticky = $('#sticky');
  if (sticky) {
    const state = { planos: false, cta: false, qdemo: false, scrolled: false };
    const apply = () => sticky.classList.toggle('show', state.scrolled && !state.planos && !state.cta && !state.qdemo);
    const onScroll = () => { state.scrolled = window.scrollY > innerHeight * .9; apply(); };
    const sio = new IntersectionObserver(es => es.forEach(e => {
      if (e.target.id === 'planos') state.planos = e.isIntersecting;
      if (e.target.id === 'cta') state.cta = e.isIntersecting;
      if (e.target.id === 'qdemo') state.qdemo = e.isIntersecting;
      apply();
    }), { rootMargin: '-8% 0px -8% 0px' });
    ['planos', 'cta', 'qdemo'].forEach(id => { const el = document.getElementById(id); if (el) sio.observe(el); });
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
