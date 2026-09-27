/* ============================================================
   AUSCULTO · homepage — VISTA MOBILE (< 1024 px), sem dependências.
   Porte do protótipo A aprovado. Só toca elementos .v-mob / ids m-*;
   não faz nada enquanto a vista desktop (>= 1024 px) está ativa.
   ============================================================ */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var desk = matchMedia('(min-width: 1024px)');
  function active() { return !desk.matches; }
  function onViewChange(fn) { if (desk.addEventListener) desk.addEventListener('change', fn); else if (desk.addListener) desk.addListener(fn); }
  var CHROME = 'ausculto:m-chrome'; /* avisa a barra fixa quando o header ou o menu mudam */
  function chromeChanged() { document.dispatchEvent(new Event(CHROME)); }
  var main = $('main.v-mob');
  if (!main) return;

  /* ---------- menu: <dialog> modal em folha cheia ---------- */
  (function menu() {
    var dlg = $('#m-menu'), open = $('#m-menu-open');
    if (!dlg || !open || typeof dlg.showModal !== 'function') return;
    function setOpen(on) {
      open.setAttribute('aria-expanded', on ? 'true' : 'false');
      root.classList.toggle('menu-open', on);
      chromeChanged();
    }
    open.addEventListener('click', function () { if (!active()) return; dlg.showModal(); setOpen(true); });
    dlg.addEventListener('close', function () { setOpen(false); });
    $$('[data-close]', dlg).forEach(function (el) { el.addEventListener('click', function () { dlg.close(); }); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    /* a vista desktop não pode ficar inerte atrás de um modal escondido */
    onViewChange(function () { if (!active() && dlg.open) dlg.close(); });
  })();

  /* ---------- header: fora do fluxo no topo; reaparece só ao rolar para cima ---------- */
  (function header() {
    var hdr = $('#m-hdr');
    if (!hdr) return;
    var lastY = 0, ticking = false; /* sem ler scrollY na carga: evita layout forçado durante a avaliação do script */
    function update() {
      ticking = false;
      if (!active()) { lastY = window.scrollY; return; }
      var before = hdr.className;
      var y = window.scrollY, dy = y - lastY;
      if (y <= 4) { hdr.classList.remove('is-pinned', 'is-shown'); }
      else if (y > 320) {
        if (dy < -6) { hdr.classList.add('is-pinned', 'is-shown'); }
        else if (dy > 6) { if (hdr.classList.contains('is-pinned')) hdr.classList.remove('is-shown'); }
      } else if (!hdr.classList.contains('is-shown')) { hdr.classList.remove('is-pinned'); }
      if (Math.abs(dy) > 6) lastY = y;
      if (hdr.className !== before) chromeChanged();
    }
    addEventListener('scroll', function () { if (!ticking && active()) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  })();

  /* ---------- texturas de fundo sob demanda: [data-bg] recebe .bg-in a ~300 px de entrar na tela ---------- */
  (function lazyBackgrounds() {
    var els = $$('[data-bg]', main);
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('bg-in'); }); return; }
    /* elementos escondidos (vista desktop) nunca cruzam a tela: nada é baixado no desktop */
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('bg-in'); io.unobserve(e.target); } });
    }, { rootMargin: '300px 0px' });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- estudantes da Academy em rotação no card do médico (crossfade, barras, pausa) ---------- */
  function studentsRotator(box) {
    var noop = { start: function () {}, stop: function () {}, warm: function () {} };
    if (!box) return noop;
    var imgs = $$('[data-stu-img]', box), caps = $$('[data-stu-cap]', box), bars = $$('[data-stu-bar]', box);
    var n = imgs.length;
    if (!n) return noop;
    var rm = window.matchMedia('(prefers-reduced-motion: reduce)');
    var idx = 0, on = false;
    function eagerAll() { imgs.forEach(function (img) { if (img.loading === 'lazy') img.loading = 'eager'; }); }
    function paint() {
      imgs.forEach(function (el, k) { el.classList.toggle('is-on', k === idx); });
      caps.forEach(function (el, k) { el.classList.toggle('is-on', k === idx); el.setAttribute('aria-hidden', k === idx ? 'false' : 'true'); });
      bars.forEach(function (b, k) {
        b.classList.remove('run');
        b.classList.toggle('is-done', k < idx || (rm.matches && k === idx));
        b.setAttribute('aria-current', k === idx ? 'true' : 'false');
      });
      var cur = bars[idx];
      if (cur && on && !rm.matches) { void cur.offsetWidth; cur.classList.add('run'); }
    }
    function go(i) { idx = (i + n) % n; paint(); }
    bars.forEach(function (b, k) {
      b.addEventListener('click', function () { go(k); });
      var bar = b.querySelector('i');
      if (bar) bar.addEventListener('animationend', function () { if (on && k === idx) go(idx + 1); });
    });
    function pause(v) { box.classList.toggle('is-paused', v); }
    box.addEventListener('focusin', function () { pause(true); });
    box.addEventListener('focusout', function () { pause(false); });
    document.addEventListener('visibilitychange', function () { pause(document.hidden); });
    return {
      start: function () { on = true; eagerAll(); box.inert = false; box.removeAttribute('aria-hidden'); go(0); },
      stop: function () { on = false; box.inert = true; box.setAttribute('aria-hidden', 'true'); bars.forEach(function (b) { b.classList.remove('run'); }); },
      warm: eagerAll
    };
  }

  /* ---------- contextos: radio group médico ⇄ estudante + aria-live ---------- */
  (function contextos() {
    var sec = $('#m-contextos');
    if (!sec) return;
    var radios = $$('input[name="m-ctx-mode"]', sec);
    /* "Para estudantes" (menu e rodapé) rola até este bloco já no Ausculto Academy */
    $$('a[data-ctx-link]').filter(function (a) { return a.closest('.v-mob'); }).forEach(function (a) {
      a.addEventListener('click', function () {
        var r = radios.filter(function (x) { return x.value === a.getAttribute('data-ctx-link'); })[0];
        if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      });
    });
    var live = $('#m-ctx-live');
    var doc = $('.doc', sec);
    var rot = studentsRotator(doc && doc.querySelector('[data-stu-box]'));
    var MSG = {
      med: 'Ausculto Clínico: gestão de pacientes, protocolos, bulas e escores. Tela do AusFlow.',
      stu: 'Ausculto Academy: questões, casos clínicos, flashcards e Raio-X Acadêmico. Tela de Desempenho da Academy.'
    };
    function setMode(mode) {
      $$('[data-ctx]', sec).forEach(function (el) {
        var on = el.getAttribute('data-ctx') === mode;
        el.hidden = !on;
        if (on && el.tagName === 'IMG' && el.loading === 'lazy') el.loading = 'eager';
      });
      if (live) live.textContent = MSG[mode] || '';
      if (doc) {
        doc.classList.toggle('is-stu', mode === 'stu');
        $$('.doc__photo, .doc__body', doc).forEach(function (el) { if (mode === 'stu') el.setAttribute('aria-hidden', 'true'); else el.removeAttribute('aria-hidden'); });
      }
      if (mode === 'stu') rot.start(); else rot.stop();
    }
    radios.forEach(function (r) { r.addEventListener('change', function () { if (r.checked) setMode(r.value); }); });
    /* pré-carrega a outra tela quando a seção se aproxima, para a troca não piscar */
    if ('IntersectionObserver' in window) {
      var warm = new IntersectionObserver(function (es) {
        if (!active() || !es.some(function (e) { return e.isIntersecting; })) return;
        /* eager faz a tela escondida baixar já, escolhendo a mesma variante do srcset/sizes que vai aparecer na troca */
        $$('img[data-ctx]', sec).forEach(function (img) { img.loading = 'eager'; });
        rot.warm();
        warm.disconnect();
      }, { rootMargin: '0px' });
      warm.observe(sec);
    }
    var checked = radios.filter(function (r) { return r.checked; })[0];
    if (checked && checked.value !== 'med') setMode(checked.value);
  })();

  /* ---------- "Conheça todas as ferramentas" (tablet) abre a lista completa ---------- */
  (function allTools() {
    var link = $('#m-all-tools-link'), det = $('#m-todas-ferramentas');
    if (!link || !det) return;
    link.setAttribute('aria-expanded', det.open ? 'true' : 'false');
    det.addEventListener('toggle', function () { link.setAttribute('aria-expanded', det.open ? 'true' : 'false'); });
    link.addEventListener('click', function (e) {
      e.preventDefault();
      det.open = true;
      det.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      var sum = det.querySelector('summary');
      if (sum) sum.focus({ preventScroll: true });
    });
  })();

  /* ---------- rodapé: acordeões no celular, colunas abertas a partir de 601 px ---------- */
  (function footer() {
    var dets = $$('footer.v-mob .foot__acc');
    if (!dets.length) return;
    var mq = matchMedia('(min-width: 601px)');
    function sync() { if (!active()) return; dets.forEach(function (d) { if (mq.matches) d.open = true; }); }
    sync();
    if (mq.addEventListener) mq.addEventListener('change', sync); else if (mq.addListener) mq.addListener(sync);
    onViewChange(sync);
  })();

  /* ---------- planos: período como radio group (mesmos valores de home.js PLANS) ---------- */
  (function pricing() {
    var PLANS = {
      monthly:    { price: 'R$ 29,90', label: '/ mês', note: 'Cobrança mensal, sem fidelidade.', cta: 'Escolher PRO mensal', badge: 'Mais flexível', term: 'monthly' },
      semiannual: { price: 'R$ 149,90', label: '/ semestre', note: 'Equivalente a R$ 24,98/mês, em cobrança semestral.', cta: 'Escolher PRO semestral', badge: 'Melhor equilíbrio', term: 'semiannual' },
      annual:     { price: 'R$ 239,90', label: '/ ano', note: 'Equivalente a R$ 19,99/mês — 33% de economia.', cta: 'Escolher PRO anual', badge: 'Mais escolhido', term: 'annual' }
    };
    var price = $('#m-pro-price'), label = $('#m-pro-label'), note = $('#m-pro-note'), cta = $('#m-pro-cta'), ctaText = $('#m-pro-cta-text'), badge = $('#m-pro-badge');
    var sec = $('#m-planos');
    var radios = sec ? $$('input[name="m-period"]', sec) : [];
    if (!price || !radios.length) return;
    function apply(p) {
      price.textContent = p.price; if (label) label.textContent = p.label; if (note) note.textContent = p.note;
      if (badge) badge.textContent = p.badge;
      if (ctaText) ctaText.textContent = p.cta;
      if (cta) cta.href = 'https://app.auscultoapp.com/?utm_source=landing&utm_medium=site_pricing&utm_content=m_pro_' + p.term + '&utm_campaign=site_2026';
    }
    radios.forEach(function (r) {
      r.addEventListener('change', function () {
        var p = PLANS[r.value]; if (!p || !r.checked) return;
        if (reduced) { apply(p); return; }
        price.style.opacity = '0';
        setTimeout(function () { apply(p); price.style.opacity = ''; }, 140);
      });
    });
    /* período restaurado pelo navegador (voltar/avançar) */
    var checked = radios.filter(function (r) { return r.checked; })[0];
    if (checked && checked.value !== 'annual' && PLANS[checked.value]) apply(PLANS[checked.value]);
  })();

  /* ---------- CTA fixo: depois que o CTA do hero sai da tela; some em planos, CTA final, rodapé,
     com teclado aberto e enquanto o header fixo estiver visível (nunca 56 + 64 px de cromo juntos) ---------- */
  (function sticky() {
    var bar = $('#m-sticky'), heroCta = $('main.v-mob [data-home-hero]'), hdr = $('#m-hdr');
    if (!bar || !heroCta || !('IntersectionObserver' in window)) return;
    var pastHero = false, blockers = new Set(), typing = false;
    function apply() {
      var hdrShown = !!(hdr && hdr.classList.contains('is-shown'));
      var show = active() && pastHero && blockers.size === 0 && !typing && !hdrShown && !root.classList.contains('menu-open');
      if (bar.classList.contains('is-on') === show) return;
      bar.classList.toggle('is-on', show);
      bar.setAttribute('aria-hidden', show ? 'false' : 'true');
      if (show) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
    }
    document.addEventListener(CHROME, apply);
    onViewChange(apply);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { pastHero = !e.isIntersecting && e.boundingClientRect.bottom < 0; });
      apply();
    }).observe(heroCta);
    var hide = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) blockers.add(e.target); else blockers.delete(e.target); });
      apply();
    }, { rootMargin: '0px 0px -12% 0px' });
    ['#m-planos', '#m-cta', 'footer.v-mob'].forEach(function (s) { var el = $(s); if (el) hide.observe(el); });
    document.addEventListener('focusin', function (e) {
      if (!active()) return;
      var t = e.target; typing = !!(t && t.matches && (t.matches('textarea, select, [contenteditable="true"]') || (t.matches('input') && !/^(radio|checkbox|button|submit)$/.test(t.type))));
      apply();
      if (bar.classList.contains('is-on') && t && !bar.contains(t) && t.getBoundingClientRect) {
        var bounds = t.getBoundingClientRect();
        if (bounds.bottom > bar.getBoundingClientRect().top) t.scrollIntoView({block:'center', behavior:'auto'});
      }
    });
    document.addEventListener('focusout', function () { if (!active()) return; typing = false; apply(); });
    if (window.visualViewport) visualViewport.addEventListener('resize', function () { if (!active()) return; typing = visualViewport.height < innerHeight * 0.72; apply(); });
  })();

  /* ---------- links externos para as âncoras do desktop (#planos, #faq…) caem no bloco equivalente da vista mobile ---------- */
  (function deepLinks() {
    function go(smooth) {
      if (!active()) return;
      var id = decodeURIComponent((location.hash || '').slice(1));
      if (!id || id.indexOf('m-') === 0 || !/^[\w-]+$/.test(id)) return;
      var alias = { top: 'conteudo' };
      var target = document.getElementById('m-' + (alias[id] || id));
      if (target) target.scrollIntoView({ behavior: smooth && !reduced ? 'smooth' : 'auto', block: 'start' });
    }
    if (location.hash) {
      if (document.readyState === 'complete') go(false); else addEventListener('load', function () { go(false); });
    }
    addEventListener('hashchange', function () { go(true); });
  })();
})();
