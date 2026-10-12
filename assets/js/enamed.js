/*
  Ausculto ENAMED (enamed.auscultoapp.com): "ENAMED o ano todo" (11/10/2026).
  Vanilla JS, sem dependencias. Responsavel por: variantes do topo (?angulo=),
  banner de consentimento, sticky CTA mobile, eventos de secao, perguntas
  frequentes, a questao do Caso-Chefe (demo) e as cenas interativas:
    - cenas com areas clicaveis (topo, Provas) que abrem um cartao; no celular
      viram selos dentro da cena;
    - reacoes das miniaturas (videos curtos sobre a imagem fiel): tocam uma vez,
      em sequencia, quando a cena aparece, e de novo no mouse ou no toque;
    - Desempenho: o mapa de exemplo enche as barras e abre a primeira lacuna;
    - Temas: a lista de areas acende a lombada do volume (e vice-versa);
    - Para quem e: o perfil acende o palco da miniatura;
    - Trilha: o video toca uma vez quando o bloco aparece e descansa no ultimo
      quadro; no Mapa os aneis acendem nas medalhas e abrem cartoes; na Jornada
      as tres paradas iluminam a cena e disparam a reacao do personagem.
  O contrato de rastreio (eventos, posicoes, UTMs, consentimento) e o mesmo da
  campanha; ver scripts/test-enamed-tracking.mjs.
*/
(function () {
  'use strict';

  var reducedMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var mobileMq = window.matchMedia('(max-width: 1023px)');
  var touchMq = window.matchMedia('(hover: none)');
  var conn = navigator.connection || null;
  function lowData() {
    return !!(conn && (conn.saveData === true || /2g/.test(conn.effectiveType || '')));
  }
  function motionOk() {
    return !reducedMq.matches && !lowData();
  }

  function track(eventName, params) {
    if (typeof window.auscultoTrack === 'function') {
      return window.auscultoTrack(eventName, params);
    }
    return null;
  }

  /* ================= Variantes do topo (?angulo=) =================
     Dicionario fixo; aplicacao por textContent/createElement (nada de innerHTML).
     A chave ja foi resolvida no boot inline (window.auscultoEnamedHeroVariant)
     e aqui e revalidada contra o dicionario; fallback 'direcao'. Sem datas:
     o ENAMED e o ano todo. */
  var HERO_VARIANTS = {
    direcao: {
      h1: { pre: 'ENAMED:', lead: 'do primeiro tema', tail: 'à prova oficial.' },
      sub: [
        ['Trilha com '],
        ['54 capítulos, 170 temas', true],
        [' para ler e as provas oficiais do '],
        ['Inep', true],
        [' para medir onde você está. Tudo no app da Ausculto Academy.'],
      ],
    },
    tempo: {
      h1: { pre: 'ENAMED:', lead: 'no seu ritmo,', tail: 'o ano todo.' },
      sub: [
        ['Sem correr contra o calendário: '],
        ['54 capítulos, 170 temas', true],
        [' e as provas oficiais do '],
        ['Inep', true],
        [' abertos o ano todo, no app da Ausculto Academy.'],
      ],
    },
    erros: {
      h1: { pre: 'ENAMED:', lead: 'erre aqui,', tail: 'acerte na prova.' },
      sub: [
        ['Cada capítulo da Trilha termina num '],
        ['Caso-Chefe', true],
        [', com o raciocínio de cada alternativa. Depois, meça onde você está com as provas oficiais do '],
        ['Inep', true],
        ['.'],
      ],
    },
  };

  var heroVariant = Object.prototype.hasOwnProperty.call(
    HERO_VARIANTS,
    window.auscultoEnamedHeroVariant,
  )
    ? window.auscultoEnamedHeroVariant
    : 'direcao';
  window.auscultoEnamedHeroVariant = heroVariant;

  function applyHeroVariant() {
    var copy = HERO_VARIANTS[heroVariant];
    ['pre', 'lead', 'tail'].forEach(function (key) {
      var el = document.querySelector('[data-h1-part="' + key + '"]');
      if (el && el.textContent !== copy.h1[key]) el.textContent = copy.h1[key];
    });
    var sub = document.getElementById('heroSub');
    if (!sub || heroVariant === 'direcao') return;
    while (sub.firstChild) sub.removeChild(sub.firstChild);
    copy.sub.forEach(function (part) {
      if (part[1]) {
        var strong = document.createElement('strong');
        strong.textContent = part[0];
        sub.appendChild(strong);
      } else {
        sub.appendChild(document.createTextNode(part[0]));
      }
    });
  }

  function rewriteCtaHrefs() {
    if (heroVariant === 'direcao') return;
    // Substitui apenas o prefixo do utm_content default ('direcao_'); allowlist
    // propria, sem refletir input do usuario.
    var links = document.querySelectorAll('a[href*="app.auscultoapp.com"]');
    for (var i = 0; i < links.length; i += 1) {
      var href = links[i].getAttribute('href');
      var next = href
        .split('utm_content=direcao_')
        .join('utm_content=' + heroVariant + '_')
        .split('landing_content=direcao_')
        .join('landing_content=' + heroVariant + '_');
      if (next !== href) links[i].setAttribute('href', next);
    }
  }

  /* ================= Consentimento (LGPD) =================
     O gate canonico vive em /meta_tracking.js (window.auscultoConsent). Se o
     script for bloqueado, a pagina grava a mesma chave no mesmo formato. */
  var consentBanner = document.getElementById('consentBanner');
  var consentVisible = false;
  var CONSENT_KEY = 'ausculto_consent_v1';

  function consentState() {
    if (window.auscultoConsent) return window.auscultoConsent.state();
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      if (raw) {
        var decision = JSON.parse(raw).decision;
        if (decision === 'granted' || decision === 'denied') return decision;
      }
    } catch (error) {
      /* storage indisponivel: trata como indeciso */
    }
    return 'undecided';
  }

  function persistConsentFallback(decision) {
    var ts = Math.floor(Date.now() / 1000);
    try {
      window.localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({ decision: decision, ts: ts, v: 1 }),
      );
    } catch (error) {
      /* segue com o cookie */
    }
    var hostname = window.location.hostname || '';
    var domain = /(^|\.)auscultoapp\.com$/i.test(hostname)
      ? '; Domain=.auscultoapp.com'
      : '';
    var secure = window.location.protocol === 'https:' ? '; Secure' : '';
    var expires = new Date(Date.now() + 365 * 864e5).toUTCString();
    // encodeURIComponent para casar byte a byte com o escritor canonico de
    // /meta_tracking.js.
    document.cookie =
      CONSENT_KEY +
      '=' +
      encodeURIComponent(decision + '.' + ts) +
      '; expires=' +
      expires +
      '; path=/; SameSite=Lax' +
      domain +
      secure;
  }

  function decideConsent(decision) {
    if (window.auscultoConsent) {
      if (decision === 'granted') window.auscultoConsent.grant();
      else window.auscultoConsent.deny();
    } else {
      persistConsentFallback(decision);
    }
    consentVisible = false;
    if (consentBanner) consentBanner.setAttribute('hidden', '');
    if (decision === 'denied') disconnectSectionObserver();
    updateFixedChrome();
  }

  function initConsent() {
    if (!consentBanner) return;
    if (consentState() === 'undecided') {
      /* Mostra o banner so depois das fontes (ou 600ms): a altura do banner
         muda com a troca de fonte, o que contaria como layout shift. */
      consentVisible = true;
      var shown = false;
      var showOnce = function () {
        if (shown) return;
        shown = true;
        if (consentState() !== 'undecided') return;
        consentBanner.removeAttribute('hidden');
        updateFixedChrome();
      };
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(showOnce, showOnce);
        setTimeout(showOnce, 600);
      } else {
        showOnce();
      }
    }
    var accept = document.getElementById('consentAccept');
    var essential = document.getElementById('consentEssential');
    if (accept)
      accept.addEventListener('click', function () {
        decideConsent('granted');
      });
    if (essential)
      essential.addEventListener('click', function () {
        decideConsent('denied');
      });
  }

  /* ================= Sticky CTA (mobile) ================= */
  var stickyCta = document.getElementById('stickyCta');
  var stickyOn = false;
  var heroGone = false;
  var finalVisible = false;
  var demoVisible = false;

  function updateFixedChrome() {
    var wantSticky =
      !!stickyCta &&
      heroGone &&
      !finalVisible &&
      !demoVisible &&
      !consentVisible &&
      mobileMq.matches;
    if (wantSticky !== stickyOn) {
      stickyOn = wantSticky;
      stickyCta.classList.toggle('is-on', stickyOn);
    }
  }

  function observeOnce(el, threshold, fn) {
    if (!el || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (entries) {
      fn(entries[0]);
    }, { threshold: threshold }).observe(el);
  }

  function initSticky() {
    if (!stickyCta) return;
    stickyCta.removeAttribute('hidden'); // controlado por classe a partir daqui
    observeOnce(document.getElementById('hero'), 0, function (e) {
      heroGone = !e.isIntersecting;
      updateFixedChrome();
    });
    observeOnce(document.getElementById('final'), 0.12, function (e) {
      finalVisible = e.isIntersecting;
      updateFixedChrome();
    });
    // Sticky some durante a demo: la ja existe o botao do proprio card.
    observeOnce(document.getElementById('demo'), 0.08, function (e) {
      demoVisible = e.isIntersecting;
      updateFixedChrome();
    });
    if (typeof mobileMq.addEventListener === 'function') {
      mobileMq.addEventListener('change', updateFixedChrome);
    }
    window.addEventListener('resize', updateFixedChrome);
  }

  /* ================= Eventos de secao (funil) ================= */
  var sectionIO = null;

  function initSectionTracking() {
    var ids = ['trilha', 'jornada', 'temas', 'provas', 'desempenho', 'demo', 'para-quem', 'faq'];
    if (!('IntersectionObserver' in window)) return;
    sectionIO = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute('id');
          var sent = track('enamed_section_viewed', {
            section_id: id,
            hero_variant: heroVariant,
          });
          if (sent !== null) sectionIO.unobserve(entry.target);
          // sent === null: consentimento pendente; tenta de novo na proxima intersecao
        });
      },
      { threshold: 0.3 },
    );
    ids.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) sectionIO.observe(el);
    });
  }

  function disconnectSectionObserver() {
    if (sectionIO) sectionIO.disconnect();
  }

  /* ================= Perguntas frequentes (uma aberta por vez) ================= */
  function initFaq() {
    var items = document.querySelectorAll('.faq__item');
    for (var i = 0; i < items.length; i += 1) {
      (function (item) {
        var btn = item.querySelector('.faq__q');
        if (!btn) return;
        btn.addEventListener('click', function () {
          var open = !item.classList.contains('is-open');
          for (var j = 0; j < items.length; j += 1) {
            items[j].classList.remove('is-open');
            var b = items[j].querySelector('.faq__q');
            if (b) b.setAttribute('aria-expanded', 'false');
          }
          item.classList.toggle('is-open', open);
          btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
      })(items[i]);
    }
  }

  /* ================= Caso-Chefe (demo) =================
     ENAMED 2025, Caderno 1, Questao 34; gabarito definitivo B. Conteudo no HTML;
     aqui so o comportamento. Sem tema/conteudo da questao nos eventos. */
  function initDemo() {
    var demoRoot = document.getElementById('demoForm');
    if (!demoRoot) return;
    var section = document.getElementById('demo');
    var started = false;
    var answered = false;
    var CORRECT = 'b';

    function markStarted() {
      if (started) return;
      started = true;
      track('enamed_demo_question_started', { hero_variant: heroVariant });
    }

    demoRoot.addEventListener('pointerdown', markStarted);
    demoRoot.addEventListener('focusin', markStarted);

    demoRoot.addEventListener('change', function (event) {
      if (answered) return;
      var input = event.target;
      if (!input || input.name !== 'demo-questao') return;
      answered = true;
      markStarted();

      var chosen = input.value;
      var correct = chosen === CORRECT;
      track('enamed_demo_question_answered', {
        correct: correct ? 1 : 0,
        hero_variant: heroVariant,
      });

      demoRoot.classList.add('is-answered');
      var inputs = demoRoot.querySelectorAll('input[name="demo-questao"]');
      for (var i = 0; i < inputs.length; i += 1) inputs[i].disabled = true;

      var options = demoRoot.querySelectorAll('.demo__option');
      for (var j = 0; j < options.length; j += 1) {
        var option = options[j];
        var key = option.getAttribute('data-option');
        var text = option.querySelector('.demo__text');
        option.classList.add('is-locked');
        if (key === CORRECT || key === chosen) {
          option.classList.add(key === CORRECT ? 'is-correct' : 'is-wrong');
          if (text) {
            var tag = document.createElement('span');
            tag.className = 'demo__state';
            tag.textContent = key === CORRECT ? 'Gabarito' : 'Sua resposta';
            text.appendChild(tag);
          }
        }
        // comentario so da resposta escolhida e do gabarito: o card nao vira um muro de texto
        var comment = option.querySelector('.demo__comment');
        if (comment && (key === CORRECT || key === chosen)) comment.removeAttribute('hidden');
      }

      var feedback = document.getElementById('demoFeedback');
      if (feedback) {
        feedback.classList.add(
          correct ? 'demo__feedback--correct' : 'demo__feedback--incorrect',
        );
        var fbText = feedback.querySelector('.demo__feedback-text');
        if (fbText) {
          fbText.textContent = correct
            ? 'Resposta correta. Veja o comentário de cada alternativa.'
            : 'Resposta incorreta. O gabarito oficial é a alternativa B. Veja o comentário de cada alternativa.';
        }
        feedback.removeAttribute('hidden');
      }
      if (section && correct) {
        section.classList.add('is-won');
        var demoScene = section.querySelector('.cena--demo');
        if (demoScene && demoScene.rxPlayer) demoScene.rxPlayer.play('residente');
      }
    });
  }

  /* ================= Cabecalho ================= */
  function initHeaderChrome() {
    var header = document.getElementById('siteHeader');
    if (!header) return;
    var ticking = false;
    var update = function () {
      ticking = false;
      header.classList.toggle('is-solid', window.scrollY > 24);
    };
    window.addEventListener(
      'scroll',
      function () {
        if (!ticking) {
          ticking = true;
          window.requestAnimationFrame(update);
        }
      },
      { passive: true },
    );
    update();
  }

  /* ================= Cenas com areas clicaveis =================
     Mouse: passar sobre a area acende e abre o cartao (que fica aberto enquanto o
     mouse estiver nele). Toque: o toque abre/fecha. Teclado: o foco abre. */
  function buildCard(box, spec) {
    var parts = spec.split('|');
    while (box.firstChild) box.removeChild(box.firstChild);
    var b = document.createElement('b');
    b.textContent = parts[0];
    var strong = document.createElement('strong');
    strong.textContent = parts[1];
    var span = document.createElement('span');
    span.textContent = parts[2];
    box.appendChild(b);
    box.appendChild(strong);
    box.appendChild(span);
    if (parts[3] && parts[4]) {
      var a = document.createElement('a');
      a.href = parts[3];
      a.textContent = parts[4] + ' ↓';
      box.appendChild(a);
    }
  }

  function initScenes() {
    var scenes = document.querySelectorAll('[data-cena]');
    for (var s = 0; s < scenes.length; s += 1) {
      (function (cena) {
        var section = cena.closest('section');
        var box = section ? section.querySelector('[data-card-box]') : null;
        var hots = Array.prototype.slice.call(cena.querySelectorAll('.hot'));
        var hint = cena.querySelector('.cena__hint');
        if (hint) {
          hint.textContent = touchMq.matches
            ? cena.getAttribute('data-hint-touch') || ''
            : cena.getAttribute('data-hint-mouse') || '';
        }
        var rx = reactionPlayer(cena);
        cena.rxPlayer = rx;
        if (rx.count && 'IntersectionObserver' in window) {
          // os videos da cena baixam quando ela chega a uma tela de distancia
          var near = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            near.disconnect();
            // depois do load: o video nunca disputa banda com a imagem principal (LCP)
            if (document.readyState === 'complete') rx.preload();
            else window.addEventListener('load', rx.preload, { once: true });
          }, { rootMargin: '700px 0px' });
          near.observe(cena);
        }
        observeOnce(cena, 0.45, function (e) {
          if (!e.isIntersecting || cena.classList.contains('is-seen')) return;
          cena.classList.add('is-seen');
          if (reducedMq.matches) {
            cena.classList.add('is-hinting', 'no-intro');
            return;
          }
          window.setTimeout(function () {
            cena.classList.add('is-intro', 'is-hinting');
            if (rx.count) window.setTimeout(function () { rx.sequence(700); }, 900);
          }, 500);
        });
        // areas que so fazem o personagem reagir (sem cartao)
        Array.prototype.forEach.call(cena.querySelectorAll('.fig[data-rx-play]'), function (f) {
          var key = f.getAttribute('data-rx-play');
          f.addEventListener('pointerenter', function (ev) {
            if (ev.pointerType === 'mouse' && !rx.busy()) rx.play(key);
          });
          f.addEventListener('click', function () {
            cena.classList.add('is-touched');
            rx.play(key);
          });
        });
        if (!box || !hots.length) return;

        var open = null;
        var hideTimer = 0;

        function place(h) {
          if (mobileMq.matches) {
            box.style.left = '';
            box.style.top = '';
            return;
          }
          var r = h.getBoundingClientRect();
          var R = section.getBoundingClientRect();
          var w = box.offsetWidth;
          var hh = box.offsetHeight;
          var at = h.getAttribute('data-card-at');
          if (at === 'inside' || at === 'left') {
            var lx = at === 'inside' ? r.left - R.left + 28 : r.left - R.left - w - 12;
            var ly = at === 'inside' ? r.top - R.top + 28 : r.top - R.top + r.height / 2 - hh / 2;
            box.style.left = Math.max(16, Math.min(R.width - w - 16, lx)) + 'px';
            box.style.top = Math.max(88, Math.min(R.height - hh - 16, ly)) + 'px';
            return;
          }
          if (cena.getAttribute('data-card-place') === 'above') {
            // etiqueta acima do objeto (ou abaixo, se nao couber sob o cabecalho)
            var cx = r.left - R.left + r.width / 2 - w / 2;
            var ty = r.top - R.top - hh - 12;
            if (ty < 88) ty = r.bottom - R.top + 12;
            box.style.left = Math.max(16, Math.min(R.width - w - 16, cx)) + 'px';
            box.style.top = Math.min(R.height - hh - 16, ty) + 'px';
            return;
          }
          var left = r.right - R.left + 14;
          if (left + w > R.width - 16) left = r.left - R.left - w - 14;
          if (left < 16) left = Math.max(16, Math.min(R.width - w - 16, r.left - R.left + r.width / 2 - w / 2));
          var top = r.top - R.top + r.height / 2 - hh / 2;
          top = Math.max(16, Math.min(R.height - hh - 16, top));
          box.style.left = left + 'px';
          box.style.top = top + 'px';
        }

        function show(h) {
          window.clearTimeout(hideTimer);
          var key = h.getAttribute('data-rx-play');
          if (key && !rx.busy()) rx.play(key);
          if (mobileMq.matches) {
            // no celular nao ha cartao: o anel acende e o personagem reage
            for (var j = 0; j < hots.length; j += 1) hots[j].classList.toggle('is-open', hots[j] === h);
            open = h;
            cena.classList.add('is-touched');
            return;
          }
          if (open !== h) buildCard(box, h.getAttribute('data-card'));
          for (var i = 0; i < hots.length; i += 1) hots[i].classList.toggle('is-open', hots[i] === h);
          open = h;
          box.removeAttribute('hidden');
          place(h);
          cena.classList.add('is-touched');
        }

        function hide() {
          open = null;
          for (var i = 0; i < hots.length; i += 1) hots[i].classList.remove('is-open');
          box.setAttribute('hidden', '');
        }

        function hideSoon() {
          window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(hide, 220);
        }

        hots.forEach(function (h) {
          var viaPointer = false;
          h.addEventListener('pointerenter', function (e) {
            if (e.pointerType === 'mouse') show(h);
          });
          h.addEventListener('pointerleave', function (e) {
            if (e.pointerType === 'mouse') hideSoon();
          });
          h.addEventListener('pointerdown', function () {
            viaPointer = true;
          });
          h.addEventListener('focus', function () {
            if (!viaPointer) show(h);
          });
          h.addEventListener('blur', function () {
            viaPointer = false;
          });
          h.addEventListener('click', function (e) {
            viaPointer = false;
            if (e.pointerType === 'mouse') show(h);
            else if (open === h) hide();
            else show(h);
          });
        });
        box.addEventListener('pointerenter', function () {
          window.clearTimeout(hideTimer);
        });
        box.addEventListener('pointerleave', function (e) {
          if (e.pointerType === 'mouse') hideSoon();
        });
        document.addEventListener('pointerdown', function (e) {
          if (!open || e.pointerType === 'mouse') return;
          if (cena.contains(e.target) || box.contains(e.target)) return;
          hide();
        });
        window.addEventListener('resize', function () {
          if (open) place(open);
        });
      })(scenes[s]);
    }
  }

  /* ================= Temas: area na lista <-> lombada do volume ================= */
  function initTemas() {
    var list = document.getElementById('temasAreas');
    if (!list) return;
    var rows = Array.prototype.slice.call(list.querySelectorAll('li[data-area]'));
    var spines = Array.prototype.slice.call(document.querySelectorAll('.lombada'));
    var current = null;
    spines.forEach(function (el, i) {
      el.style.setProperty('--i', String(i));
    });
    function lit(key) {
      current = key;
      rows.forEach(function (r) {
        r.classList.toggle('is-on', r.getAttribute('data-area') === key);
      });
      spines.forEach(function (sp) {
        sp.classList.toggle('is-on', sp.getAttribute('data-area') === key);
      });
    }
    rows.concat(spines).forEach(function (el) {
      var key = el.getAttribute('data-area');
      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'mouse') lit(key);
      });
      el.addEventListener('pointerleave', function (e) {
        if (e.pointerType === 'mouse') lit(null);
      });
      el.addEventListener('click', function () {
        lit(current === key ? null : key);
      });
    });
  }

  /* ================= Para quem e: perfil <-> palco ================= */
  function initPerfis() {
    var items = Array.prototype.slice.call(document.querySelectorAll('.perfis li[data-perfil]'));
    var stages = Array.prototype.slice.call(document.querySelectorAll('.palco'));
    var quem = document.querySelector('.cena--quem');
    function lit(key) {
      if (key !== null && quem && quem.rxPlayer && !quem.rxPlayer.busy()) quem.rxPlayer.play(key);
      items.forEach(function (li) {
        li.classList.toggle('is-on', li.getAttribute('data-perfil') === key);
      });
      stages.forEach(function (p) {
        p.classList.toggle('is-on', p.getAttribute('data-perfil') === key);
      });
    }
    items.forEach(function (li) {
      var key = li.getAttribute('data-perfil');
      li.addEventListener('pointerenter', function () {
        lit(key);
      });
      li.addEventListener('pointerleave', function () {
        lit(null);
      });
      li.addEventListener('focus', function () {
        lit(key);
      });
      li.addEventListener('blur', function () {
        lit(null);
      });
    });
  }

  /* ================= Reacoes (videos curtos sobre a imagem fiel) =================
     Cada <video class="rx" data-rx="chave"> cobre so a regiao do personagem; comeca
     igual a imagem parada e termina perto dela, com fade de 0,3 s nas duas pontas.
     play(chave, fim) toca uma; sequence() toca todas, uma por vez. */
  function reactionPlayer(root) {
    var vids = Array.prototype.slice.call(root.querySelectorAll('video.rx'));
    var current = null;
    var onDone = null;
    var suffix = window.innerWidth < 768 ? '-960' : '';
    function load(v) {
      if (!v.getAttribute('src')) v.src = v.getAttribute('data-src') + suffix + '.mp4';
    }
    function stop(v) {
      v.classList.remove('is-on');
      window.setTimeout(function () {
        if (!v.classList.contains('is-on')) v.pause();
      }, 340);
      if (current === v) {
        current = null;
        var cb = onDone;
        onDone = null;
        if (cb) cb();
      }
    }
    vids.forEach(function (v) {
      v.addEventListener('playing', function () {
        if (current === v) v.classList.add('is-on');
      });
      v.addEventListener('timeupdate', function () {
        var dur = parseFloat(v.getAttribute('data-dur')) || 6;
        if (current === v && v.currentTime >= dur - 0.35) stop(v);
      });
      v.addEventListener('ended', function () {
        stop(v);
      });
    });
    function find(key) {
      for (var i = 0; i < vids.length; i += 1) if (vids[i].getAttribute('data-rx') === String(key)) return vids[i];
      return null;
    }
    var api = {
      count: vids.length,
      busy: function () {
        return !!current;
      },
      preload: function () {
        if (!motionOk()) return;
        vids.forEach(function (v) {
          v.preload = 'auto';
          load(v);
        });
      },
      play: function (key, done) {
        var v = find(key);
        if (!v || !motionOk()) {
          if (done) done();
          return;
        }
        if (current && current !== v) stop(current);
        if (current === v) return;
        current = v;
        onDone = done || null;
        load(v);
        try {
          v.currentTime = 0;
        } catch (e) {
          /* metadados ainda nao carregados: comeca do inicio de qualquer jeito */
        }
        var p = v.play();
        if (p && typeof p.catch === 'function') p.catch(function () { stop(v); });
      },
      sequence: function (gap) {
        var keys = vids.map(function (v) { return v.getAttribute('data-rx'); });
        var i = 0;
        function next() {
          if (i >= keys.length) return;
          var k = keys[i];
          i += 1;
          api.play(k, function () {
            window.setTimeout(next, gap || 600);
          });
        }
        next();
      },
    };
    return api;
  }

  function initVideoBlocks() {
    var blocks = document.querySelectorAll('[data-video-block]');
    for (var b = 0; b < blocks.length; b += 1) {
      (function (block) {
        var video = block.querySelector('video:not(.rx)');
        var replay = block.querySelector('[data-replay]');
        var hint = block.querySelector('.tv-hint');
        var rx = reactionPlayer(block);
        block.reactions = rx;
        if (hint) {
          hint.textContent = touchMq.matches
            ? hint.getAttribute('data-hint-touch')
            : hint.getAttribute('data-hint-mouse');
        }
        function rest() {
          block.classList.add('is-rest');
          if (!mobileMq.matches) rx.preload();
        }
        block.addEventListener('pointerdown', function () {
          block.classList.add('is-touched');
        }, { passive: true });
        block.addEventListener('focusin', function (e) {
          if (e.target.matches && e.target.matches('.spot, .stage')) block.classList.add('is-touched');
        });
        if (reducedMq.matches || !video) {
          rest();
          return;
        }
        video.src = video.getAttribute('data-src') + (window.innerWidth < 768 ? '-960' : '') + '.mp4';
        var played = false;
        video.addEventListener('loadeddata', function () {
          block.classList.add('is-ready');
        }, { once: true });
        video.addEventListener('ended', rest);
        function play() {
          block.classList.remove('is-rest');
          try {
            video.currentTime = 0;
          } catch (e) {
            /* ainda sem metadados */
          }
          var p = video.play();
          if (p && typeof p.catch === 'function') p.catch(rest);
        }
        if (replay) replay.addEventListener('click', play);
        if ('IntersectionObserver' in window) {
          new IntersectionObserver(function (entries) {
            if (entries[0].intersectionRatio >= 0.5 && !played) {
              played = true;
              video.preload = 'auto';
              play();
            }
          }, { threshold: [0, 0.5] }).observe(block);
        } else {
          rest();
        }
      })(blocks[b]);
    }

    /* ---- Mapa-ilha: cartao no mouse, foco ou toque ---- */
    var ta = document.querySelector('.tv.ta');
    if (ta) {
      var tip = ta.querySelector('[data-tip-box]');
      var spots = Array.prototype.slice.call(ta.querySelectorAll('.spot'));
      var openSpot = null;
      var placeTip = function (el) {
        if (mobileMq.matches) return;
        var r = el.getBoundingClientRect();
        var R = ta.getBoundingClientRect();
        var w = tip.offsetWidth;
        var h = tip.offsetHeight;
        var left = r.right - R.left + 12;
        if (left + w > R.width - 14) left = r.left - R.left - w - 12;
        tip.style.left = left + 'px';
        tip.style.top = Math.max(14, Math.min(R.height - h - 14, r.top - R.top + r.height / 2 - h / 2)) + 'px';
      };
      var showTip = function (el) {
        var parts = el.getAttribute('data-tip').split('|');
        while (tip.firstChild) tip.removeChild(tip.firstChild);
        if (parts[3]) {
          var img = document.createElement('img');
          img.src = '/assets/enamed/v2/insignia-' + parts[3] + '.webp';
          img.alt = '';
          img.width = 52;
          img.height = 52;
          tip.appendChild(img);
        }
        var kicker = document.createElement('b');
        kicker.textContent = parts[1];
        var title = document.createElement('strong');
        title.textContent = parts[0];
        var text = document.createElement('span');
        text.textContent = parts[2];
        tip.appendChild(kicker);
        tip.appendChild(title);
        tip.appendChild(text);
        spots.forEach(function (x) {
          x.classList.toggle('is-open', x === el);
        });
        openSpot = el;
        tip.classList.add('on');
        placeTip(el);
      };
      var hideTip = function () {
        openSpot = null;
        spots.forEach(function (x) {
          x.classList.remove('is-open');
        });
        tip.classList.remove('on');
      };
      spots.forEach(function (el) {
        el.setAttribute('aria-label', el.getAttribute('data-tip').split('|')[0]);
        var viaPointer = false;
        el.addEventListener('pointerenter', function (e) {
          if (e.pointerType === 'mouse') showTip(el);
        });
        el.addEventListener('pointerleave', function (e) {
          if (e.pointerType === 'mouse') hideTip();
        });
        el.addEventListener('pointerdown', function () {
          viaPointer = true;
        });
        el.addEventListener('focus', function () {
          if (!viaPointer) showTip(el);
        });
        el.addEventListener('blur', function () {
          viaPointer = false;
          hideTip();
        });
        el.addEventListener('click', function (e) {
          viaPointer = false;
          if (e.pointerType === 'mouse') showTip(el);
          else if (openSpot === el) hideTip();
          else showTip(el);
        });
      });
      window.addEventListener('resize', function () {
        if (openSpot) placeTip(openSpot);
      });
    }

    /* ---- Jornada: paradas que iluminam a cena e fazem o personagem reagir ---- */
    var tb = document.querySelector('.tv.tb');
    if (tb) {
      var focus = tb.querySelector('[data-focus]');
      var note = tb.querySelector('[data-note]');
      var stages = Array.prototype.slice.call(tb.querySelectorAll('.stage'));
      var NOTES = [
        ['Caso', 'Você atende o caso', 'Cada etapa é um caso com personagem. Você escolhe a conduta e vê o raciocínio de cada alternativa.'],
        ['Caso-Chefe', 'A questão de prova', 'No fim do capítulo, a Dra. Helena traz o Caso-Chefe, como a questão 34 do Caderno 1 do ENAMED 2025, que você pode responder aqui embaixo.'],
        ['Insígnia', 'Medir para decidir', 'Vença o Caso-Chefe e leve a insígnia do capítulo. São 54 para colecionar, uma por capítulo.'],
      ];
      var current = -1;
      var pick = function (i) {
        if (current === i) {
          current = -1;
          stages.forEach(function (x) {
            x.setAttribute('aria-pressed', 'false');
          });
          focus.classList.remove('on');
          note.classList.remove('on');
          return;
        }
        current = i;
        var btn = stages[i];
        stages.forEach(function (x, j) {
          x.setAttribute('aria-pressed', String(i === j));
        });
        focus.style.setProperty('--fx', btn.getAttribute('data-fx'));
        focus.style.setProperty('--fy', btn.getAttribute('data-fy'));
        focus.style.setProperty('--cy', btn.getAttribute('data-cy'));
        focus.classList.add('on');
        while (note.firstChild) note.removeChild(note.firstChild);
        var k = document.createElement('b');
        k.textContent = NOTES[i][0];
        var t = document.createElement('strong');
        t.textContent = NOTES[i][1];
        var x = document.createElement('span');
        x.textContent = NOTES[i][2];
        note.appendChild(k);
        note.appendChild(t);
        note.appendChild(x);
        note.style.left = btn.getAttribute('data-nx');
        note.style.top = btn.getAttribute('data-ny');
        note.classList.add('on');
        if (tb.classList.contains('is-rest') && tb.reactions) tb.reactions.play(i);
      };
      stages.forEach(function (btn, i) {
        btn.addEventListener('click', function () {
          pick(i);
        });
      });
    }
  }

  /* ================= Desempenho: mapa de exemplo ================= */
  function initEvid() {
    var card = document.querySelector('.evid');
    if (!card) return;
    var rows = Array.prototype.slice.call(card.querySelectorAll('.evid__row'));
    var touched = false;
    function toggle(row, force) {
      var btn = row.querySelector('.evid__btn');
      var next = row.querySelector('.evid__next');
      var open = typeof force === 'boolean' ? force : btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) next.removeAttribute('hidden');
      else next.setAttribute('hidden', '');
    }
    rows.forEach(function (row, i) {
      var bar = row.querySelector('.evid__bar i');
      if (bar) bar.style.setProperty('--k', String(i));
      row.querySelector('.evid__btn').addEventListener('click', function () {
        touched = true;
        rows.forEach(function (r) {
          if (r !== row) toggle(r, false);
        });
        toggle(row);
      });
    });
    observeOnce(card, 0.35, function (e) {
      if (!e.isIntersecting || card.classList.contains('is-in')) return;
      card.classList.add('is-in');
      // a primeira lacuna abre sozinha: o bloco se explica sem precisar de toque
      window.setTimeout(function () {
        if (!touched && rows[0]) toggle(rows[0], true);
      }, reducedMq.matches ? 0 : 1500);
    });
  }

  /* ================= boot ================= */
  applyHeroVariant();
  rewriteCtaHrefs();
  initConsent();
  initSticky();
  initSectionTracking();
  initFaq();
  initDemo();
  initHeaderChrome();
  initScenes();
  initTemas();
  initPerfis();
  initEvid();
  initVideoBlocks();
  updateFixedChrome();
})();
