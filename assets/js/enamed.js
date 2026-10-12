/*
  Ausculto ENAMED (enamed.auscultoapp.com): "ENAMED o ano todo" (11/10/2026).
  Vanilla JS, sem dependencias. Responsavel por: variantes do topo (?angulo=),
  banner de consentimento, sticky CTA mobile, eventos de secao, perguntas
  frequentes, a questao do Caso-Chefe (demo) e as cenas interativas:
    - holofote: cada objeto tem a silhueta exata; mouse/foco/toque acende o objeto,
      recua o resto e abre o cartao com a tela real do app (pinos no celular);
    - reacoes das miniaturas (videos curtos sobre a imagem fiel): tocam uma vez,
      em sequencia, quando a cena aparece, e de novo no mouse ou no toque;
    - Desempenho: o mapa de exemplo enche as barras e abre a primeira lacuna;
    - Temas e Para quem e: a lista acende o objeto (e vice-versa);
    - stop-motion das miniaturas (sprites gerados quadro a quadro);
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
  // depois do load e de uma folga: nada da animacao disputa banda com a primeira pintura
  function afterSettle(fn) {
    var go = function () {
      window.setTimeout(function () {
        if ('requestIdleCallback' in window) window.requestIdleCallback(fn, { timeout: 1500 });
        else fn();
      }, 1800);
    };
    if (document.readyState === 'complete') go();
    else window.addEventListener('load', go, { once: true });
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
  var ctaVisible = false;

  function updateFixedChrome() {
    var wantSticky =
      !!stickyCta &&
      heroGone &&
      !finalVisible &&
      !demoVisible &&
      !ctaVisible &&
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
    // e enquanto o botao dourado de uma secao estiver na tela (nunca dois iguais juntos)
    if ('IntersectionObserver' in window) {
      var seen = new Set();
      var ctaIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) seen.add(en.target);
          else seen.delete(en.target);
        });
        ctaVisible = seen.size > 0;
        updateFixedChrome();
      }, { threshold: 0.6 });
      Array.prototype.forEach.call(document.querySelectorAll('main .btn--gold'), function (b) { ctaIO.observe(b); });
    }
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

  /* ================= Cenas: entrada, dica e reacoes =================
     A cena aparece: os objetos acendem um de cada vez (uma volta rapida) e os
     personagens reagem em sequencia. O resto e do holofote (initLit). */
  function initScenes() {
    var scenes = document.querySelectorAll('[data-cena]');
    for (var s = 0; s < scenes.length; s += 1) {
      (function (cena) {
        var hint = cena.querySelector('.cena__hint');
        if (hint) {
          hint.textContent = touchMq.matches
            ? cena.getAttribute('data-hint-touch') || ''
            : cena.getAttribute('data-hint-mouse') || '';
        }
        var rx = reactionPlayer(cena);
        cena.rxPlayer = rx;
        if (rx.count && 'IntersectionObserver' in window) {
          // as reacoes baixam quando a cena chega a uma tela de distancia, depois do load
          var near = new IntersectionObserver(function (entries) {
            if (!entries[0].isIntersecting) return;
            near.disconnect();
            afterSettle(rx.preload);
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
            // o holofote passeia pelos objetos (sem cartao) e depois os personagens reagem
            var took = cena.litTour ? cena.litTour() : 0;
            if (rx.count) window.setTimeout(function () { rx.sequence(650); }, took + 300);
          }, 450);
        });
      })(scenes[s]);
    }
  }

  /* ================= Holofote e cartoes =================
     Cada objeto interativo tem a area de clique pelo contorno exato (path SVG). Mouse,
     foco ou toque acendem o objeto: um holofote eliptico e suave fica sobre ele, o resto
     recua sob um veu marfim e a camera se aproxima de leve. Abre o cartao com a tela real
     do app, ligado ao objeto por uma linha-guia. Nada de contorno desenhado.
     No celular o cartao vem logo abaixo da cena e os pinos marcam os objetos. */
  var PUSH = 1.022;
  var CARD_DATA = {};
  try {
    CARD_DATA = JSON.parse(document.getElementById('cardData').textContent) || {};
  } catch (err) {
    CARD_DATA = {};
  }
  var ASSET = '/assets/enamed/v2/';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function renderCard(box, d) {
    while (box.firstChild) box.removeChild(box.firstChild);
    box.classList.toggle('card--compact', !!d.compact && !d.thumb && !d.medal);
    if (d.thumb || d.medal) {
      var t = el('span', 'card__thumb' + (d.medal ? ' card__thumb--medal' : ''));
      var img = el('img');
      img.src = ASSET + (d.medal ? 'insignia-' + d.medal : 'thumb-' + d.thumb) + '.webp';
      img.alt = '';
      img.width = d.medal ? 92 : 100;
      img.height = d.medal ? 92 : 133;
      t.appendChild(img);
      box.appendChild(t);
    }
    var body = el('div', 'card__body');
    body.appendChild(el('b', 'card__kick', d.kick));
    body.appendChild(el('strong', 'card__title', d.title));
    body.appendChild(el('p', 'card__text', d.text));
    if (d.stats && d.stats.length) {
      var ul = el('ul', 'card__stats');
      d.stats.forEach(function (st) {
        var li = el('li');
        li.appendChild(el('b', null, st[0]));
        li.appendChild(el('span', null, st[1]));
        ul.appendChild(li);
      });
      body.appendChild(ul);
    }
    if (d.href && d.link) {
      var a = el('a', 'card__link');
      a.href = d.href;
      a.appendChild(document.createTextNode(d.link + ' '));
      a.appendChild(el('span', null, '→'));
      body.appendChild(a);
    }
    box.appendChild(body);
    box.style.animation = 'none';
    void box.offsetWidth;
    box.style.animation = '';
  }

  function initLit() {
    var roots = document.querySelectorAll('[data-scene]');
    for (var r = 0; r < roots.length; r += 1) {
      (function (root) {
        var scene = root.getAttribute('data-scene');
        var section = root.closest('section');
        var frame = root.querySelector('.cena__frame') || root;
        var box = section.querySelector('[data-card-for="' + scene + '"]');
        var lead = section.querySelector('[data-lead-for="' + scene + '"]');
        var data = CARD_DATA[scene] || {};
        var hits = Array.prototype.slice.call(root.querySelectorAll('.hit'));
        var pins = Array.prototype.slice.call(root.querySelectorAll('.pin'));
        var links = Array.prototype.slice.call(document.querySelectorAll('[data-link^="' + scene + ':"]'));
        var veil = root.querySelector('.veil');
        // pontos do contorno de cada objeto e a caixa dele (viewBox 0..1000 da cena)
        var outline = {};
        var bbox = {};
        hits.forEach(function (h) {
          var pts = (h.getAttribute('d') || '').replace(/[MZ]/g, '').split('L').map(function (pair) {
            var xy = pair.trim().split(',');
            return [parseFloat(xy[0]), parseFloat(xy[1])];
          }).filter(function (q) { return !isNaN(q[0]) && !isNaN(q[1]); });
          var b = [1000, 1000, 0, 0];
          pts.forEach(function (q) {
            b[0] = Math.min(b[0], q[0]);
            b[1] = Math.min(b[1], q[1]);
            b[2] = Math.max(b[2], q[0]);
            b[3] = Math.max(b[3], q[1]);
          });
          outline[h.getAttribute('data-k')] = pts;
          bbox[h.getAttribute('data-k')] = b;
        });
        var keys = Object.keys(bbox);
        var canPush = frame !== root; // o Mapa (video) nao aproxima
        var minX0 = parseFloat(root.getAttribute('data-card-min-x') || '0');
        var open = null;
        var hideTimer = 0;
        var touring = false;

        function ready() {
          return scene !== 'mapa' || section.classList.contains('is-rest');
        }

        // a cena sem a aproximacao (offset* ignora transform): a conta do cartao e da linha
        // usa a posicao final, nao a do meio da transicao
        function frameBox() {
          var R = root.getBoundingClientRect();
          if (frame === root) return { left: R.left, top: R.top, width: R.width, height: R.height };
          return { left: R.left + frame.offsetLeft, top: R.top + frame.offsetTop, width: frame.offsetWidth, height: frame.offsetHeight };
        }
        function pushed() {
          return canPush && open !== null && !reducedMq.matches;
        }
        // ponto da cena (0..1000) em px da secao, com a aproximacao centrada no objeto aceso
        function toSec(F, S, q, k) {
          var x = q[0];
          var y = q[1];
          if (k != null && pushed()) {
            var b = bbox[k];
            var cx = (b[0] + b[2]) / 2;
            var cy = (b[1] + b[3]) / 2;
            x = cx + (x - cx) * PUSH;
            y = cy + (y - cy) * PUSH;
          }
          return [F.left - S.left + (F.width * x) / 1000, F.top - S.top + (F.height * y) / 1000];
        }

        // holofote: elipse suave sobre a caixa do objeto (as variaveis deslizam pelo CSS)
        function spot(k, soft) {
          if (!veil || !bbox[k]) return;
          var b = bbox[k];
          var hw = (b[2] - b[0]) / 20;
          var hh = (b[3] - b[1]) / 20;
          veil.style.setProperty('--lx', ((b[0] + b[2]) / 20).toFixed(2) + '%');
          veil.style.setProperty('--ly', ((b[1] + b[3]) / 20).toFixed(2) + '%');
          veil.style.setProperty('--rx', (hw * 1.45 + 2.5).toFixed(2) + '%');
          veil.style.setProperty('--ry', (hh * 1.45 + 3.5).toFixed(2) + '%');
          root.classList.toggle('is-touring', !!soft);
        }
        function push(k) {
          if (!canPush) return;
          if (k == null || reducedMq.matches) {
            frame.classList.remove('is-pushed');
            return;
          }
          var b = bbox[k];
          frame.style.transformOrigin = ((b[0] + b[2]) / 20).toFixed(2) + '% ' + ((b[1] + b[3]) / 20).toFixed(2) + '%';
          frame.classList.add('is-pushed');
        }

        // entrada da cena: a luz passa por cada objeto, sem abrir cartao; devolve a duracao
        root.litTour = function () {
          if (!keys.length || !veil || !ready()) return 0;
          var step = keys.length > 5 ? 380 : 620;
          touring = true;
          keys.forEach(function (k, i) {
            window.setTimeout(function () {
              if (!touring || open !== null) return;
              spot(k, true);
              root.classList.add('is-lit');
            }, i * step);
          });
          window.setTimeout(function () {
            if (!touring) return;
            touring = false;
            if (open === null) {
              root.classList.remove('is-lit', 'is-touring');
            }
          }, keys.length * step + 200);
          return keys.length * step + 200;
        };

        function place(k, d) {
          if (!box) return;
          if (mobileMq.matches || !d || d.ax == null) {
            box.style.left = '';
            box.style.top = '';
            if (lead) lead.classList.remove('on');
            return;
          }
          var S = section.getBoundingClientRect();
          var F = frameBox();
          var rel = function (q) { return { l: q.left - S.left, t: q.top - S.top, r: q.right - S.left, b: q.bottom - S.top }; };
          var boxOf = function (key) {
            var b = bbox[key];
            var p0 = toSec(F, S, [b[0], b[1]], k);
            var p1 = toSec(F, S, [b[2], b[3]], k);
            return { l: p0[0], t: p0[1], r: p1[0], b: p1[1] };
          };
          var o = bbox[k] ? boxOf(k) : rel(F);
          var a0 = toSec(F, S, [d.ax * 10, d.ay * 10], k);
          var ax = a0[0];
          var ay = a0[1];
          var w = box.offsetWidth;
          var h = box.offsetHeight;
          var gap = 28;
          var minY = Math.max(16, 96 - S.top);
          var maxY = Math.min(S.height - h - 16, window.innerHeight - S.top - h - 16);
          var minX = Math.max(16, S.width * minX0);
          var maxX = S.width - w - 16;
          // o que o cartao nao pode cobrir: os outros objetos (peso 1) e o texto (peso 4)
          // os outros objetos estao recuados sob o veu: cobri-los pesa pouco; o objeto aceso e o
          // texto da secao pesam muito
          var avoid = [];
          keys.forEach(function (key) {
            if (key !== k) avoid.push([boxOf(key), 0.5]);
          });
          Array.prototype.forEach.call(root.querySelectorAll('.sm, video.rx'), function (n) {
            avoid.push([rel(n.getBoundingClientRect()), 1]);
          });
          Array.prototype.forEach.call(section.querySelectorAll('.hero__copy > *, .bloco__copy > *, .ta-card, .hero__facts'), function (n) {
            avoid.push([rel(n.getBoundingClientRect()), 8]);
          });
          var cx = (o.l + o.r) / 2;
          var cy = (o.t + o.b) / 2;
          var cand = [
            [o.r + gap, cy - h / 2], [o.l - gap - w, cy - h / 2],
            [cx - w / 2, o.t - gap - h], [cx - w / 2, o.b + gap],
            [o.r + gap, o.t], [o.l - gap - w, o.t], [o.r + gap, o.b - h], [o.l - gap - w, o.b - h],
          ];
          var best = null;
          cand.forEach(function (c) {
            var x = Math.max(minX, Math.min(maxX, c[0]));
            var y = Math.max(minY, Math.min(maxY, c[1]));
            var cost = Math.abs(x - c[0]) + Math.abs(y - c[1]);
            avoid.forEach(function (av) {
              var q = av[0];
              var ix = Math.max(0, Math.min(x + w, q.r) - Math.max(x, q.l));
              var iy = Math.max(0, Math.min(y + h, q.b) - Math.max(y, q.t));
              cost += (ix * iy * av[1]) / 40;
            });
            // a linha-guia nao atravessa personagens nem outros objetos
            var lx = Math.max(x, Math.min(x + w, ax));
            var ly = Math.max(y, Math.min(y + h, ay));
            avoid.forEach(function (av) {
              if (av[1] > 3) return;
              var q = av[0];
              for (var t = 0.15; t < 0.9; t += 0.15) {
                var px2 = lx + (ax - lx) * t;
                var py2 = ly + (ay - ly) * t;
                if (px2 > q.l && px2 < q.r && py2 > q.t && py2 < q.b) cost += 900 * av[1];
              }
            });
            // o proprio objeto coberto pesa mais ainda
            var ox = Math.max(0, Math.min(x + w, o.r) - Math.max(x, o.l));
            var oy = Math.max(0, Math.min(y + h, o.b) - Math.max(y, o.t));
            cost += (ox * oy * 14) / 40;
            if (!best || cost < best[2]) best = [x, y, cost];
          });
          box.style.left = Math.round(best[0]) + 'px';
          box.style.top = Math.round(best[1]) + 'px';
          if (!lead) return;
          // linha-guia: do contorno do objeto (ponto mais proximo do cartao) ate a borda do cartao
          var cxm = best[0] + w / 2;
          var cym = best[1] + h / 2;
          var pts = outline[k] || [];
          var bestD = Infinity;
          pts.forEach(function (q) {
            var qq = toSec(F, S, q, k);
            var dd = Math.hypot(qq[0] - cxm, qq[1] - cym);
            if (dd < bestD) { bestD = dd; ax = qq[0]; ay = qq[1]; }
          });
          var ex = Math.max(best[0], Math.min(best[0] + w, ax));
          var ey = Math.max(best[1], Math.min(best[1] + h, ay));
          var path = lead.querySelector('path');
          var dot = lead.querySelector('circle');
          path.setAttribute('d', 'M' + ax + ' ' + ay + ' L' + ex + ' ' + ey);
          lead.style.setProperty('--len', String(Math.ceil(Math.hypot(ex - ax, ey - ay)) + 2));
          dot.setAttribute('cx', String(ax));
          dot.setAttribute('cy', String(ay));
          lead.classList.remove('on');
          void lead.getBoundingClientRect();
          lead.classList.toggle('on', Math.hypot(ex - ax, ey - ay) > 12);
        }

        function activate(k) {
          if (!ready()) return;
          window.clearTimeout(hideTimer);
          if (open === k) return;
          open = k;
          touring = false;
          root.classList.add('is-lit');
          spot(k, false);
          push(k);
          pins.forEach(function (p) {
            p.classList.toggle('is-on', p.getAttribute('data-k') === k);
          });
          links.forEach(function (l) {
            l.classList.toggle('is-on', l.getAttribute('data-link') === scene + ':' + k);
          });
          var d = data[k];
          if (box && d) {
            renderCard(box, d);
            box.hidden = false;
            place(k, d);
          }
          var rx = root.rxPlayer;
          var rk = d && d.rx ? d.rx : scene === 'quem' ? k : null;
          if (rx && rk != null && !rx.busy()) rx.play(rk);
        }

        function deactivate() {
          open = null;
          root.classList.remove('is-lit', 'is-touring');
          push(null);
          pins.forEach(function (p) { p.classList.remove('is-on'); });
          links.forEach(function (l) { l.classList.remove('is-on'); });
          if (box) box.hidden = true;
          if (lead) lead.classList.remove('on');
        }

        function soon() {
          window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(deactivate, 260);
        }

        function go(k) {
          var d = data[k];
          if (!d || !d.href) return;
          var target = document.querySelector(d.href);
          if (target) target.scrollIntoView({ behavior: reducedMq.matches ? 'auto' : 'smooth', block: 'start' });
        }

        // em tela de toque o navegador simula mouse no ponto do toque; ao rolar, ele "sai" do
        // objeto e fecharia o cartao. La so o toque abre e fecha.
        function hover(e) {
          return e.pointerType === 'mouse' && !touchMq.matches;
        }

        function bind(n, k, opts) {
          var viaPointer = false;
          n.addEventListener('pointerenter', function (e) {
            if (hover(e)) activate(k);
          });
          n.addEventListener('pointerleave', function (e) {
            if (hover(e)) soon();
          });
          n.addEventListener('pointerdown', function () {
            viaPointer = true;
          });
          n.addEventListener('focus', function () {
            if (!viaPointer) activate(k);
          });
          n.addEventListener('blur', function () {
            viaPointer = false;
            soon();
          });
          n.addEventListener('click', function (e) {
            viaPointer = false;
            root.classList.add('is-touched');
            if (e.pointerType === 'mouse') {
              activate(k);
              if (opts && opts.follow) go(k);
            } else if (open === k) {
              deactivate();
            } else {
              activate(k);
            }
          });
          n.addEventListener('keydown', function (e) {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            activate(k);
            if (opts && opts.follow) go(k);
          });
        }

        // celular: o pino fica dentro do trecho visivel da cena (o recorte), sobre a parte
        // visivel do objeto, mesmo quando o centro do objeto cai fora do recorte
        function fitPins() {
          pins.forEach(function (p) {
            p.style.left = '';
            p.style.top = '';
          });
          if (!mobileMq.matches || !pins.length) return;
          var R = root.getBoundingClientRect();
          var F = frame.getBoundingClientRect();
          pins.forEach(function (p) {
            var pw = p.offsetWidth;
            var ph = p.offsetHeight;
            var px = (parseFloat(p.style.getPropertyValue('--px')) || 0) / 100;
            var py = (parseFloat(p.style.getPropertyValue('--py')) || 0) / 100;
            var x = F.width * px;
            var y = F.height * py;
            var minX = R.left - F.left + 8 + 15;
            var maxX = R.right - F.left - pw + 15 - 8;
            var minY = R.top - F.top + 8 + ph / 2;
            var maxY = R.bottom - F.top - 8 - ph / 2;
            p.style.left = Math.round(Math.max(minX, Math.min(maxX, x))) + 'px';
            p.style.top = Math.round(Math.max(minY, Math.min(maxY, y))) + 'px';
          });
        }
        fitPins();
        window.addEventListener('resize', fitPins);
        window.addEventListener('load', fitPins);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitPins);

        hits.forEach(function (h) { bind(h, h.getAttribute('data-k'), { follow: true }); });
        pins.forEach(function (p) { bind(p, p.getAttribute('data-k')); });
        links.forEach(function (l) { bind(l, l.getAttribute('data-link').split(':')[1]); });
        if (box) {
          box.addEventListener('pointerenter', function () { window.clearTimeout(hideTimer); });
          box.addEventListener('pointerleave', function (e) { if (hover(e)) soon(); });
        }
        document.addEventListener('pointerdown', function (e) {
          if (open === null || e.pointerType === 'mouse') return;
          if (root.contains(e.target) || (box && box.contains(e.target))) return;
          if (links.some(function (l) { return l.contains(e.target); })) return;
          deactivate();
        });
        window.addEventListener('resize', function () {
          if (open !== null) place(open, data[open]);
        });
      })(roots[r]);
    }
  }

  /* ================= Reacoes =================
     Videos curtos (<video class="rx">) e stop-motion (<span class="sm">: sprite com os
     quadros lado a lado; o quadro 0 e a propria cena). Os dois comecam e terminam na
     imagem fiel. play(chave, fim) toca um; sequence() toca todos, um por vez. */
  var SM_STEPS = [[1, 110], [2, 110], [3, 240], [2, 110], [3, 240], [2, 110], [1, 110], [0, 60]];

  function reactionPlayer(root) {
    var items = Array.prototype.slice.call(root.querySelectorAll('video.rx, .sm'));
    var current = null;
    var onDone = null;
    var suffix = window.innerWidth < 768 ? '-960' : '';
    var small = window.innerWidth < 1024;
    function isSprite(n) {
      return n.classList.contains('sm');
    }
    function load(n) {
      if (isSprite(n)) {
        if (n.getAttribute('data-state')) return;
        n.setAttribute('data-state', 'loading');
        var url = n.getAttribute(small ? 'data-bg-cel' : 'data-bg');
        var img = new Image();
        img.onload = function () {
          n.style.backgroundImage = 'url("' + url + '")';
          n.setAttribute('data-state', 'ready');
        };
        img.src = url;
        return;
      }
      if (!n.getAttribute('src')) n.src = n.getAttribute('data-src') + suffix + '.mp4';
    }
    function finish(n) {
      if (current !== n) return;
      current = null;
      var cb = onDone;
      onDone = null;
      if (cb) cb();
    }
    function stopVideo(v) {
      v.classList.remove('is-on');
      window.setTimeout(function () {
        if (!v.classList.contains('is-on')) v.pause();
      }, 340);
      finish(v);
    }
    items.forEach(function (n) {
      if (isSprite(n)) return;
      n.addEventListener('playing', function () {
        if (current === n) n.classList.add('is-on');
      });
      n.addEventListener('timeupdate', function () {
        var dur = parseFloat(n.getAttribute('data-dur')) || 6;
        if (current === n && n.currentTime >= dur - 0.35) stopVideo(n);
      });
      n.addEventListener('ended', function () {
        stopVideo(n);
      });
    });
    function playSprite(n) {
      var frames = parseInt(n.getAttribute('data-frames'), 10) || 4;
      if (n.getAttribute('data-state') !== 'ready') {
        load(n);
        window.setTimeout(function () { finish(n); }, 50);
        return;
      }
      var i = 0;
      n.style.backgroundPosition = '0 0';
      n.classList.add('is-on');
      (function next() {
        if (current !== n) {
          n.classList.remove('is-on');
          return;
        }
        if (i >= SM_STEPS.length) {
          n.style.backgroundPosition = '0 0';
          n.classList.remove('is-on');
          finish(n);
          return;
        }
        var f = Math.min(frames - 1, SM_STEPS[i][0]);
        n.style.backgroundPosition = (frames > 1 ? (f / (frames - 1)) * 100 : 0) + '% 0';
        var wait = SM_STEPS[i][1];
        i += 1;
        window.setTimeout(next, wait);
      })();
    }
    function find(key) {
      for (var i = 0; i < items.length; i += 1) if (items[i].getAttribute('data-rx') === String(key)) return items[i];
      return null;
    }
    var api = {
      count: items.length,
      busy: function () {
        return !!current;
      },
      preload: function () {
        if (!motionOk()) return;
        items.forEach(function (n) {
          if (!isSprite(n)) n.preload = 'auto';
          load(n);
        });
      },
      play: function (key, done) {
        var n = find(key);
        if (!n || !motionOk()) {
          if (done) done();
          return;
        }
        if (current && current !== n) {
          if (isSprite(current)) current.classList.remove('is-on');
          else stopVideo(current);
        }
        if (current === n) return;
        current = n;
        onDone = done || null;
        if (isSprite(n)) {
          playSprite(n);
          return;
        }
        load(n);
        try {
          n.currentTime = 0;
        } catch (e) {
          /* metadados ainda nao carregados: comeca do inicio de qualquer jeito */
        }
        var p = n.play();
        if (p && typeof p.catch === 'function') p.catch(function () { stopVideo(n); });
      },
      sequence: function (gap) {
        var keys = items.map(function (n) { return n.getAttribute('data-rx'); });
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
          if (e.target.matches && e.target.matches('.hit, .stage, .pin')) block.classList.add('is-touched');
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

    /* ---- Jornada: paradas que iluminam a cena e fazem o personagem reagir ---- */
    var tb = document.querySelector('.tv.tb');
    if (tb) {
      var focus = tb.querySelector('[data-focus]');
      var note = tb.querySelector('[data-note]');
      var stages = Array.prototype.slice.call(tb.querySelectorAll('.stage'));
      var NOTES = CARD_DATA.jornada || {};
      var current = -1;
      var pick = function (i) {
        if (current === i) {
          current = -1;
          stages.forEach(function (x) {
            x.setAttribute('aria-pressed', 'false');
          });
          focus.classList.remove('on');
          note.classList.remove('on');
          note.hidden = true;
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
        if (NOTES[i]) renderCard(note, NOTES[i]);
        note.hidden = false;
        note.style.left = btn.getAttribute('data-nx');
        note.style.top = btn.getAttribute('data-ny');
        note.classList.remove('on');
        void note.offsetWidth;
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
      if (mobileMq.matches) return;
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
  initLit();
  initEvid();
  initVideoBlocks();
  updateFixedChrome();
})();
