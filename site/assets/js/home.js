/* ============================================================
   AUSCULTO · homepage 2026 — interações (sem dependências)
   ============================================================ */
(function () {
  'use strict';
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.prototype.slice.call((c || document).querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /* vista desktop (>= 1024 px). Abaixo disso ela fica escondida (.v-desk) e a vista mobile (.v-mob, home-m.js) assume:
     este arquivo só toca elementos da vista desktop e não reage a rolagem enquanto ela está escondida. */
  const desk = matchMedia('(min-width: 1024px)');
  const onDesk = fn => { if (desk.addEventListener) desk.addEventListener('change', fn); else if (desk.addListener) desk.addListener(fn); };
  const view = $('main.v-desk') || $('main');

  /* ---------- nav scroll ---------- */
  const nav = $('#nav');
  if (nav) {
    const onScrollNav = () => { if (desk.matches) nav.classList.toggle('scrolled', window.scrollY > 24); };
    addEventListener('scroll', onScrollNav, { passive: true });
    onDesk(onScrollNav);
    onScrollNav();
  }

  /* ---------- menu mobile ---------- */
  const mmenu = $('#mmenu'), burger = $('#burger'), mclose = $('#mclose');
  if (mmenu && burger && mclose) {
    function setMenu(open) {
      mmenu.classList.toggle('open', open);
      mmenu.setAttribute('aria-hidden', open ? 'false' : 'true');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
      if (open) setTimeout(() => mclose.focus(), 60); else burger.focus();
    }
    burger.addEventListener('click', () => setMenu(true));
    mclose.addEventListener('click', () => setMenu(false));
    $$('#mmenu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && mmenu.classList.contains('open')) setMenu(false); });
  }

  /* ---------- reveal ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver(es => es.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      }), { threshold: .12, rootMargin: '0px 0px -6% 0px' })
    : null;
  $$('.rv').filter(el => !el.closest('.v-mob')).forEach(el => io ? io.observe(el) : el.classList.add('in'));

  /* ---------- B3a · estudantes da Academy em rotação (crossfade + zoom lento, barras de progresso, pausa no hover/foco) ---------- */
  function studentsRotator(box) {
    const noop = { start() {}, stop() {}, warm() {} };
    if (!box) return noop;
    const imgs = $$('[data-stu-img]', box), caps = $$('[data-stu-cap]', box), bars = $$('[data-stu-bar]', box);
    const n = imgs.length;
    if (!n) return noop;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    let idx = 0, on = false;
    const eagerAll = () => imgs.forEach(img => { if (img.loading === 'lazy') img.loading = 'eager'; });
    function paint() {
      imgs.forEach((el, k) => el.classList.toggle('is-on', k === idx));
      caps.forEach((el, k) => { el.classList.toggle('is-on', k === idx); el.setAttribute('aria-hidden', k === idx ? 'false' : 'true'); });
      bars.forEach((b, k) => {
        b.classList.remove('run');
        b.classList.toggle('is-done', k < idx || (rm.matches && k === idx));
        b.setAttribute('aria-current', k === idx ? 'true' : 'false');
      });
      const cur = bars[idx];
      if (cur && on && !rm.matches) { void cur.offsetWidth; cur.classList.add('run'); }
    }
    const go = i => { idx = (i + n) % n; paint(); };
    bars.forEach((b, k) => {
      b.addEventListener('click', () => go(k));
      const bar = b.querySelector('i');
      if (bar) bar.addEventListener('animationend', () => { if (on && k === idx) go(idx + 1); });
    });
    const pause = v => box.classList.toggle('is-paused', v);
    box.addEventListener('mouseenter', () => pause(true));
    box.addEventListener('mouseleave', () => pause(false));
    box.addEventListener('focusin', () => pause(true));
    box.addEventListener('focusout', () => pause(false));
    document.addEventListener('visibilitychange', () => pause(document.hidden));
    return {
      start() { on = true; eagerAll(); box.inert = false; box.removeAttribute('aria-hidden'); go(0); },
      stop() { on = false; box.inert = true; box.setAttribute('aria-hidden', 'true'); bars.forEach(b => b.classList.remove('run')); },
      warm: eagerAll
    };
  }

  /* ---------- B3 · contextos: médico ⇄ estudante (tela real, lista e aba da janela) ---------- */
  (function contextos() {
    const root = $('#contextos');
    if (!root) return;
    const btns = $$('.ctx__mode button[data-mode]', root);
    const panels = $$('.ctx__panel[data-ctx]', root);
    const shots = $$('.ctx-win__shot img[data-ctx]', root);
    const win = $('.ctx-win', root);
    const tabLabel = $('.ctx-win__tab-label', root);
    const photo = $('.ctx-photo', root);
    const rot = studentsRotator(photo && photo.querySelector('[data-stu-box]'));
    const LABELS = { med: 'Ausculto Clínico', stu: 'Ausculto Academy' };
    const eager = img => { if (img.loading === 'lazy') img.loading = 'eager'; };
    function setMode(mode) {
      if (!LABELS[mode]) return;
      btns.forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === mode ? 'true' : 'false'));
      panels.forEach(p => { p.hidden = p.dataset.ctx !== mode; });
      shots.forEach(img => {
        const on = img.dataset.ctx === mode;
        if (on) { eager(img); img.removeAttribute('data-off'); img.removeAttribute('aria-hidden'); }
        else { img.setAttribute('data-off', ''); img.setAttribute('aria-hidden', 'true'); }
      });
      if (win) win.dataset.mode = mode;
      if (tabLabel) tabLabel.textContent = LABELS[mode];
      if (photo) {
        photo.dataset.mode = mode;
        const med = photo.querySelectorAll('.ctx-photo__img, .ctx-photo__body');
        med.forEach(el => { if (mode === 'stu') el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
      }
      if (mode === 'stu') rot.start(); else rot.stop();
    }
    btns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
    /* "Para estudantes" (topo e rodapé) rola até este bloco já no Ausculto Academy */
    $$('a[data-ctx-link]').filter(a => !a.closest('.v-mob')).forEach(a => a.addEventListener('click', () => setMode(a.dataset.ctxLink)));
    /* carrega a outra tela quando a seção se aproxima, para a troca não piscar */
    if ('IntersectionObserver' in window) {
      const warm = new IntersectionObserver(es => {
        if (!es.some(e => e.isIntersecting)) return;
        shots.forEach(eager);
        rot.warm();
        warm.disconnect();
      }, { rootMargin: '400px 0px' });
      warm.observe(root);
    }
  })();

  /* ---------- B4 · "Conheça todas as ferramentas" abre a lista completa (fechada e fora do fluxo) ---------- */
  (function allTools() {
    const link = $('#allToolsLink'), det = $('#todas-ferramentas');
    if (!link || !det) return;
    link.setAttribute('aria-expanded', det.open ? 'true' : 'false');
    det.addEventListener('toggle', () => link.setAttribute('aria-expanded', det.open ? 'true' : 'false'));
    link.addEventListener('click', e => {
      e.preventDefault();
      det.open = true;
      det.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      const sum = det.querySelector('summary');
      if (sum) sum.focus({ preventScroll: true });
    });
  })();

  /* ---------- B5 · demo: tabs com teclado e autoplay pausável ---------- */
  (function demo() {
    const root = $('#demo');
    if (!root) return;
    const tabs = $$('[role="tab"]', root);
    const panels = $$('.demo__panel', root);
    if (!tabs.length) return;
    const DUR = 6000;
    let idx = 0, timer = null, paused = false;

    function show(i, focus) {
      idx = (i + tabs.length) % tabs.length;
      tabs.forEach((t, k) => {
        const on = k === idx;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        const prog = t.querySelector('.tabs__prog');
        if (prog) { prog.classList.remove('run'); void prog.offsetWidth; if (on && !paused && !reduced) prog.classList.add('run'); }
      });
      panels.forEach((p, k) => {
        p.hidden = k !== idx;
        if (k === idx) $$('img[data-src]', p).forEach(img => { img.src = img.dataset.src; delete img.dataset.src; });
      });
      if (focus) tabs[idx].focus();
      restart();
    }
    function restart() {
      clearTimeout(timer);
      if (paused || reduced) return;
      timer = setTimeout(() => show(idx + 1), DUR);
    }
    function pause(on) {
      paused = on;
      tabs.forEach(t => { const prog = t.querySelector('.tabs__prog'); if (prog) prog.classList.toggle('run', !on && t.getAttribute('aria-selected') === 'true' && !reduced); });
      restart();
    }
    tabs.forEach((t, k) => {
      t.addEventListener('click', () => show(k));
      t.addEventListener('keydown', e => {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + 1, true); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - 1, true); }
        else if (e.key === 'Home') { e.preventDefault(); show(0, true); }
        else if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
      });
    });
    root.addEventListener('pointerenter', () => pause(true));
    root.addEventListener('pointerleave', () => pause(false));
    root.addEventListener('focusin', () => pause(true));
    root.addEventListener('focusout', e => { if (!root.contains(e.relatedTarget)) pause(false); });
    /* só roda o autoplay quando a seção está visível */
    if ('IntersectionObserver' in window) {
      const vio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { paused = false; restart(); } else { clearTimeout(timer); } }), { threshold: .3 });
      vio.observe(root);
      clearTimeout(timer);
    }
    show(0);
    if (!matchMedia('(min-width: 601px)').matches) { paused = true; clearTimeout(timer); }
  })();

  /* ---------- B9 · planos: período ---------- */
  (function pricing() {
    const PLANS = {
      monthly:    { price: 'R$ 29,90', label: '/ mês', note: 'Cobrança mensal, sem fidelidade.', cta: 'Escolher PRO mensal', badge: 'Mais flexível', term: 'monthly' },
      semiannual: { price: 'R$ 149,90', label: '/ semestre', note: 'Equivalente a R$ 24,98/mês, em cobrança semestral.', cta: 'Escolher PRO semestral', badge: 'Melhor equilíbrio', term: 'semiannual' },
      annual:     { price: 'R$ 239,90', label: '/ ano', note: 'Equivalente a R$ 19,99/mês — 33% de economia.', cta: 'Escolher PRO anual', badge: 'Mais escolhido', term: 'annual' }
    };
    const proPrice = $('#proPrice'), proLabel = $('#proLabel'), proNote = $('#proNote'),
          proCta = $('#proCta'), proCtaText = $('#proCtaText'), proBadge = $('#proBadge');
    const btns = $$('.periods button');
    if (!btns.length || !proPrice) return;
    btns.forEach(btn => btn.addEventListener('click', () => {
      btns.forEach(b => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
      const p = PLANS[btn.dataset.period]; if (!p) return;
      proPrice.style.opacity = 0;
      setTimeout(() => {
        proPrice.textContent = p.price; proLabel.textContent = p.label; proNote.textContent = p.note;
        if (proBadge) proBadge.textContent = p.badge;
        if (proCtaText) proCtaText.textContent = p.cta;
        if (proCta) proCta.href = 'https://app.auscultoapp.com/?utm_source=landing&utm_medium=site_pricing&utm_content=pro_' + p.term + '&utm_campaign=site_2026';
        proPrice.style.opacity = 1;
      }, 140);
    }));
  })();

  /* ---------- B8 · questão interativa ---------- */
  (function qdemo() {
    const root = $('#qdemo');
    if (!root) return;
    const CORRECT = 'd';
    const alts = $$('[data-qdemo-alt]', root);
    const strips = $$('.qdemo-strip', root);
    const verify = $('[data-qdemo-verify]', root);
    const cta = $('[data-qdemo-cta]', root);
    const editorial = $('[data-qdemo-editorial]', root);
    let phase = 'idle', selected = null;

    alts.forEach(btn => btn.addEventListener('click', () => {
      if (phase === 'answered') return;
      const key = btn.dataset.qdemoAlt;
      if (phase === 'idle') {
        phase = 'selected'; selected = key;
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        if (verify) verify.hidden = false;
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
      if (verify) verify.hidden = true;
      alts.forEach(b => {
        b.disabled = true;
        b.classList.remove('is-selected');
        const k = b.dataset.qdemoAlt;
        if (k === CORRECT) b.classList.add('is-correct');
        else if (k === key) b.classList.add('is-wrong');
      });
      strips.forEach(s => { const k = s.dataset.for; if (k === CORRECT || k === key) s.hidden = false; });
      if (editorial) { editorial.hidden = false; requestAnimationFrame(() => editorial.classList.add('is-in')); }
      if (cta) cta.hidden = false;
      setTimeout(() => {
        const target = editorial || root;
        if (target) target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
      }, 300);
    }
  })();

  /* ---------- navegação: scroll-spy ---------- */
  (function spy() {
    const links = $$('.nav__links a[href^="#"]:not([data-ctx-link])');
    const map = new Map();
    links.forEach(a => { const sec = document.querySelector(a.getAttribute('href')); if (sec) map.set(sec, a); });
    if (!map.size || !('IntersectionObserver' in window)) return;
    const hero = $('[data-home-hero]', view);
    const obs = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { links.forEach(a => a.classList.remove('on')); const l = map.get(e.target); if (l) l.classList.add('on'); }
    }), { rootMargin: '-38% 0px -52% 0px' });
    map.forEach((a, sec) => obs.observe(sec));
    /* no topo da página nenhum link fica marcado */
    addEventListener('scroll', () => { if (desk.matches && hero && window.scrollY < hero.offsetHeight * .5) links.forEach(a => a.classList.remove('on')); }, { passive: true });
  })();

  /* ---------- CTA fixo (mobile) ---------- */
  (function sticky() {
    const el = $('#sticky');
    if (!el || !('IntersectionObserver' in window)) return;
    const visible = new Set();
    let scrolled = false;
    const apply = () => {
      const show = desk.matches && scrolled && visible.size === 0;
      el.classList.toggle('show', show);
      document.body.classList.toggle('has-sticky', show);
      el.setAttribute('aria-hidden', show ? 'false' : 'true');
    };
    const obs = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) visible.add(e.target.id); else visible.delete(e.target.id); apply(); }), { rootMargin: '-8% 0px -8% 0px' });
    ['planos', 'cta', 'questao', 'faq'].forEach(id => { const s = document.getElementById(id); if (s) obs.observe(s); });
    const foot = $('footer.v-desk') || $('footer'); if (foot) { foot.id = foot.id || 'rodape'; obs.observe(foot); }
    const onScroll = () => { if (!desk.matches && !el.classList.contains('show')) return; scrolled = window.scrollY > innerHeight * .9; apply(); };
    addEventListener('scroll', onScroll, { passive: true });
    onDesk(onScroll);
    onScroll();
  })();
})();
