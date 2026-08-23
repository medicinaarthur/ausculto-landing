/*
  Ausculto ENAMED 2026: landing (/enamed/).
  Vanilla JS, sem dependencias. Responsavel por: countdown (estados da campanha),
  variantes de hero (?angulo=), banner de consentimento, demo de questao,
  sticky CTA mobile, eventos de secao e reveals.

  Bloco de config sincronizado manualmente com scripts/configure_enamed_campaign.cjs
  (payload canonico app_config/enamed_campaign_v1).
*/
(function () {
  'use strict';

  window.AUSCULTO_ENAMED_CONFIG = {
    examDateISO: '2026-09-13T13:30:00-03:00', // America/Sao_Paulo. Edital Inep 71/2026
    postExamUntilISO: '2026-09-20T23:59:59-03:00', // pos-prova da campanha no produto
    resultDateLabel: '04/12/2026', // resultado individual (edital)
  };
  var CONFIG = window.AUSCULTO_ENAMED_CONFIG;

  function track(eventName, params) {
    if (typeof window.auscultoTrack === 'function') {
      return window.auscultoTrack(eventName, params);
    }
    return null;
  }

  /* ================= Variantes de hero (?angulo=) =================
     Dicionario fixo; aplicacao por textContent (nada de innerHTML).
     A chave ja foi resolvida no boot inline (window.auscultoEnamedHeroVariant)
     e aqui e revalidada contra o dicionario; fallback 'direcao'.
     Copy canonica: plano Secao 11.2. */
  // H1 em cinco nos (pre / pre2 / lead / tail / post) e sub em tres
  // (pre / accent / post): `pre2` e `lead` sao unidades que nao quebram no
  // celular (composicao em 5 linhas), `tail` recebe o traco dourado e
  // `accent` do sub e a data em champagne. O texto concatenado continua
  // identico a copy canonica.
  var HERO_VARIANTS = {
    direcao: {
      h1: {
        pre: 'Descubra em',
        pre2: '50 questões',
        lead: 'o que você',
        tail: 'ainda não domina',
        post: 'no ENAMED.',
      },
      sub: {
        pre: 'Diagnóstico gratuito: você responde, o Ausculto mostra suas prioridades por área e entrega uma missão de estudo possível para hoje e para cada dia até ',
        accent: '13 de setembro',
        post: '.',
      },
    },
    tempo: {
      h1: {
        pre: 'Faltam {N} dias',
        pre2: 'para o ENAMED.',
        lead: 'Saiba exatamente',
        tail: 'onde focar.',
        post: '',
      },
      sub: {
        pre: 'O diagnóstico gratuito do Ausculto mostra suas prioridades por área e transforma cada dia até ',
        accent: '13 de setembro',
        post: ' em uma missão concreta.',
      },
    },
    erros: {
      h1: {
        pre: 'Transforme',
        pre2: '',
        lead: '',
        tail: 'seus erros',
        post: 'em uma missão de estudo.',
      },
      sub: {
        pre: 'O diagnóstico gratuito revela o que você ainda não domina; o Ausculto converte isso em Mapa ENAMED e em uma missão diária, incluindo a revisão das suas próprias questões erradas.',
        accent: '',
        post: '',
      },
    },
  };

  var heroVariant = Object.prototype.hasOwnProperty.call(
    HERO_VARIANTS,
    window.auscultoEnamedHeroVariant,
  )
    ? window.auscultoEnamedHeroVariant
    : 'direcao';
  window.auscultoEnamedHeroVariant = heroVariant;

  var heroSubEl = document.getElementById('heroSub');
  // H1 e sub em nos (ver HERO_VARIANTS): aplicacao por textContent, sem
  // innerHTML; o texto final concatenado e identico ao da copy canonica.
  var H1_KEYS = ['pre', 'pre2', 'lead', 'tail', 'post'];
  var SUB_KEYS = ['pre', 'accent', 'post'];
  var heroTitleParts = {
    pre: document.querySelector('[data-h1-part="pre"]'),
    pre2: document.querySelector('[data-h1-part="pre2"]'),
    lead: document.querySelector('[data-h1-accent="lead"]'),
    tail: document.querySelector('[data-h1-accent="tail"]'),
    post: document.querySelector('[data-h1-part="post"]'),
  };
  var heroSubParts = {
    pre: document.querySelector('[data-sub-part="pre"]'),
    accent: document.querySelector('[data-sub-part="accent"]'),
    post: document.querySelector('[data-sub-part="post"]'),
  };

  function applyHeroVariant(state, days) {
    if (!heroSubEl) return;
    var copy = HERO_VARIANTS[heroVariant];
    var h1 = copy.h1;
    var joined = '';
    for (var j = 0; j < H1_KEYS.length; j += 1) joined += h1[H1_KEYS[j]];
    if (joined.indexOf('{N}') !== -1 && state !== 'pre') {
      // O {N} so existe no estado pre-prova; fora dele a variante 'tempo'
      // perde o sentido e cai para a headline default.
      h1 = HERO_VARIANTS.direcao.h1;
    }
    for (var k = 0; k < H1_KEYS.length; k += 1) {
      var el = heroTitleParts[H1_KEYS[k]];
      if (!el) continue;
      var text = h1[H1_KEYS[k]].replace('{N}', String(days));
      if (el.textContent !== text) el.textContent = text;
    }
    for (var m = 0; m < SUB_KEYS.length; m += 1) {
      var subEl = heroSubParts[SUB_KEYS[m]];
      if (!subEl) continue;
      var subText = copy.sub[SUB_KEYS[m]];
      if (subEl.textContent !== subText) subEl.textContent = subText;
    }
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

  /* ================= Countdown / estados da campanha =================
     pre      -> antes do dia da prova: "Faltam {N} dias"
     examday  -> dia 13/09/2026 (America/Sao_Paulo): "A prova é hoje"
     post     -> ate 20/09: prova aplicada, resultado em resultDateLabel
     evergreen-> apos 20/09: pagina generica, sem countdown              */
  var examDay = CONFIG.examDateISO.slice(0, 10); // '2026-09-13'
  var tzOffset = CONFIG.examDateISO.slice(-6); // '-03:00'
  var examDayStartMs = Date.parse(examDay + 'T00:00:00' + tzOffset);
  var examDayEndMs = Date.parse(examDay + 'T23:59:59.999' + tzOffset);
  var postUntilMs = Date.parse(CONFIG.postExamUntilISO);
  var DAY_MS = 86400000;

  function campaignState(nowMs) {
    if (nowMs < examDayStartMs) return 'pre';
    if (nowMs <= examDayEndMs) return 'examday';
    if (nowMs <= postUntilMs) return 'post';
    return 'evergreen';
  }

  function daysUntilExam(nowMs) {
    return Math.max(1, Math.ceil((examDayStartMs - nowMs) / DAY_MS));
  }

  var stateSpans = document.querySelectorAll('[data-state]');
  var baseSpans = document.querySelectorAll('[data-state-base]');
  var resultLabels = document.querySelectorAll('[data-result-label]');
  var ctaLinks = document.querySelectorAll(
    'a[data-label-default][data-label-inactive]',
  );

  function applyCampaignState() {
    var now = Date.now();
    var state = campaignState(now);
    var days = daysUntilExam(now);

    for (var i = 0; i < stateSpans.length; i += 1) {
      var span = stateSpans[i];
      var active = span.getAttribute('data-state') === state;
      if (active && state === 'pre') {
        var plural = span.getAttribute('data-tpl-plural');
        var singular = span.getAttribute('data-tpl-singular');
        var nEl = span.querySelector('[data-n]');
        if (plural && nEl) {
          // Countdown com o numero em destaque: o template e partido em
          // "antes {N} depois" e cada pedaco vai para o seu no (sem innerHTML).
          var tplParts = (days === 1 && singular ? singular : plural).split(
            '{N}',
          );
          var wordPre = span.querySelector('[data-tpl-word="pre"]');
          var wordPost = span.querySelector('[data-tpl-word="post"]');
          var n = String(days);
          var preWord = (tplParts[0] || '').trim();
          var postWord = (tplParts[1] || '').trim();
          if (nEl.textContent !== n) nEl.textContent = n;
          if (wordPre && wordPre.textContent !== preWord)
            wordPre.textContent = preWord;
          if (wordPost && wordPost.textContent !== postWord)
            wordPost.textContent = postWord;
        } else if (plural) {
          span.textContent = (
            days === 1 && singular ? singular : plural
          ).replace('{N}', String(days));
        }
      }
      if (active && state === 'post') {
        for (var r = 0; r < resultLabels.length; r += 1) {
          resultLabels[r].textContent = CONFIG.resultDateLabel;
        }
      }
      if (active) {
        span.removeAttribute('hidden');
        span.classList.remove('is-pending');
      } else span.setAttribute('hidden', '');
    }

    for (var b = 0; b < baseSpans.length; b += 1) {
      var base = baseSpans[b];
      var states = (base.getAttribute('data-state-base') || '').split(/\s+/);
      if (states.indexOf(state) !== -1) base.removeAttribute('hidden');
      else base.setAttribute('hidden', '');
    }

    for (var c = 0; c < ctaLinks.length; c += 1) {
      var link = ctaLinks[c];
      var suffix = state === 'pre' ? 'default' : 'inactive';
      var label = link.getAttribute('data-label-' + suffix);
      var full = link.querySelector('.lbl-full');
      var short = link.querySelector('.lbl-short');
      var target = link.querySelector('[data-label-target]');
      if (target) {
        // CTA composto (icone + titulo + sub): so o titulo recebe o rotulo.
        if (label && target.textContent !== label) target.textContent = label;
      } else if (full) {
        // CTA com rotulo duplo (ex.: header compacto no mobile)
        var shortLabel = link.getAttribute('data-label-short-' + suffix);
        if (label && full.textContent !== label) full.textContent = label;
        if (short && shortLabel && short.textContent !== shortLabel)
          short.textContent = shortLabel;
      } else if (label && link.textContent !== label) {
        link.textContent = label;
      }
    }

    applyHeroVariant(state, days);
    return state;
  }

  var currentState = applyCampaignState();
  rewriteCtaHrefs();
  window.setInterval(function () {
    currentState = applyCampaignState();
  }, 60000); // granularidade de dias: 1x/min basta, sem CLS
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) currentState = applyCampaignState();
  });

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
    // /meta_tracking.js. Hoje o valor e alfanumerico + ponto e o encode e
    // inerte, mas dois escritores com encodings diferentes para a MESMA chave
    // e uma divergencia esperando um formato futuro para quebrar.
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
      /* Mostra o banner so depois das fontes (ou 600ms): o banner e ancorado
         em bottom e sua altura muda com a troca de fonte, o que conta como
         layout shift. Com a metrica final aplicada, a altura nao muda mais.
         O flag consentVisible sobe ja, para o sticky CTA ficar suprimido. */
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

  /* ================= Sticky CTA (mobile) + compensacao de altura ================= */
  var stickyCta = document.getElementById('stickyCta');
  var stickyOn = false;
  var heroGone = false;
  var finalVisible = false;
  var demoVisible = false;
  var mobileMq = window.matchMedia('(max-width: 767px)');

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
    /* Sem compensacao de padding no body: qualquer escrita de layout aqui vira
       CLS. Banner e sticky CTA sao overlays fixos; o rodape tem padding
       estatico no mobile para nunca ficar coberto. */
  }

  function initSticky() {
    if (!stickyCta) return;
    stickyCta.removeAttribute('hidden'); // controlado por classe a partir daqui
    var heroEl = document.getElementById('hero');
    var finalEl = document.getElementById('final');
    if ('IntersectionObserver' in window) {
      var heroIO = new IntersectionObserver(
        function (entries) {
          heroGone = !entries[0].isIntersecting;
          updateFixedChrome();
        },
        { threshold: 0 },
      );
      if (heroEl) heroIO.observe(heroEl);
      var finalIO = new IntersectionObserver(
        function (entries) {
          finalVisible = entries[0].isIntersecting;
          updateFixedChrome();
        },
        { threshold: 0.12 },
      );
      if (finalEl) finalIO.observe(finalEl);
      // Sticky some durante a demo: la ja existe um CTA azul proprio no card,
      // e dois botoes empilhados com copys diferentes diluem o clique.
      var demoEl = document.getElementById('demo');
      var demoIO = new IntersectionObserver(
        function (entries) {
          demoVisible = entries[0].isIntersecting;
          updateFixedChrome();
        },
        { threshold: 0.08 },
      );
      if (demoEl) demoIO.observe(demoEl);
    } else {
      // Fallback sem IO: mostra apos rolar a altura do hero.
      window.addEventListener(
        'scroll',
        function () {
          heroGone = window.scrollY > (heroEl ? heroEl.offsetHeight : 480);
          updateFixedChrome();
        },
        { passive: true },
      );
    }
    if (typeof mobileMq.addEventListener === 'function') {
      mobileMq.addEventListener('change', updateFixedChrome);
    } else if (typeof mobileMq.addListener === 'function') {
      mobileMq.addListener(updateFixedChrome);
    }
    window.addEventListener('resize', updateFixedChrome);
  }

  /* ================= Eventos de secao (funil) ================= */
  var sectionIO = null;

  function initSectionTracking() {
    var ids = ['mecanismo', 'mapa', 'missao', 'demo', 'faq'];
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

  /* ================= Reveals ================= */
  function initReveals() {
    var items = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      for (var i = 0; i < items.length; i += 1)
        items[i].classList.add('is-visible');
      return;
    }
    // Irmaos de uma grade entram escalonados (60ms cada, teto 4): uma lista
    // aparece como lista. Secoes isoladas continuam sem atraso.
    var groups = document.querySelectorAll(
      '.proof-strip__grid, .dor__grid, .mecanismo__steps, .prova__grid, .prova__screens, .para-quem__grid, .missao__bullets',
    );
    for (var g = 0; g < groups.length; g += 1) {
      var kids = groups[g].children;
      var n = 0;
      for (var k = 0; k < kids.length; k += 1) {
        if (!kids[k].hasAttribute('data-reveal')) continue;
        kids[k].style.setProperty('--reveal-i', String(Math.min(n, 4)));
        n += 1;
      }
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
            // Depois de entrar, o atraso sai: o hover nunca espera. (setTimeout,
            // nao transitionend: em reduced-motion a transicao nao dispara.)
            (function (el) {
              window.setTimeout(function () {
                el.style.removeProperty('--reveal-i');
              }, 500);
            })(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    for (var j = 0; j < items.length; j += 1) io.observe(items[j]);
  }

  /* ================= FAQ ================= */
  function initFaq() {
    var buttons = document.querySelectorAll('.faq__q');
    for (var i = 0; i < buttons.length; i += 1) {
      buttons[i].addEventListener('click', function () {
        var item = this.closest('.faq__item');
        if (!item) return;
        var open = item.classList.toggle('is-open');
        this.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    }
  }

  /* ================= Demo de questao =================
     Conteudo autoral no HTML; aqui so o comportamento. Sem tema/conteudo da
     questao nos eventos (Secao 19.5 do plano). */
  function initDemo() {
    var demoRoot = document.getElementById('demoForm');
    if (!demoRoot) return;
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
        var label = option.querySelector('.demo__label');
        if (key === CORRECT) {
          option.classList.add('is-correct');
          if (label) {
            var tag = document.createElement('span');
            tag.className = 'demo__state';
            tag.textContent = 'Gabarito';
            label.appendChild(tag);
          }
        } else if (key === chosen) {
          option.classList.add('is-wrong');
          if (label) {
            var chosenTag = document.createElement('span');
            chosenTag.className = 'demo__state';
            chosenTag.textContent = 'Sua resposta';
            label.appendChild(chosenTag);
          }
        }
        var comment = option.querySelector('.demo__comment');
        if (comment) comment.removeAttribute('hidden');
      }

      var feedback = document.getElementById('demoFeedback');
      if (feedback) {
        feedback.classList.add(
          correct ? 'demo__feedback--correct' : 'demo__feedback--incorrect',
        );
        var text = feedback.querySelector('.demo__feedback-text');
        if (text) {
          text.textContent = correct
            ? 'Resposta correta. Veja o porquê de cada alternativa abaixo.'
            : 'Resposta incorreta. A conduta adequada é a alternativa B. Veja o porquê de cada alternativa abaixo.';
        }
        feedback.removeAttribute('hidden');
        // A recompensa aparece onde o clique aconteceu (abaixo da dobra no desktop).
        if (typeof feedback.scrollIntoView === 'function') {
          var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
          feedback.scrollIntoView({
            block: 'center',
            behavior: reduce.matches ? 'auto' : 'smooth',
          });
        }
      }

      var pne = document.getElementById('demoPne');
      if (pne) pne.removeAttribute('hidden');
    });
  }

  /* ================= Header chrome =================
     Transparente sobre o hero escuro; vira papel com hairline apos o scroll.
     Sem layout shift: o header e fixed e o hero ja compensa o padding-top. */
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

  /* ================= Video backgrounds (progressive enhancement) =================
     Estatico primeiro: o poster CSS e o primeiro paint/LCP. O <video> so toca
     quando o elemento esta visivel (media query), sem reduced-motion e sem
     save-data/2g; preload="none" garante zero bytes antes do play(). Pausa com
     a aba escondida; retoma ao voltar. Sem atributo autoplay no markup: o play
     e sempre uma decisao explicita desta funcao. */
  function initVideoBackgrounds() {
    var videos = document.querySelectorAll('.bg-video');
    if (!videos.length) return;
    var motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var mobileMqVideos = window.matchMedia('(max-width: 767px)');
    var conn = navigator.connection || null;

    function dataOk() {
      return !(
        conn &&
        (conn.saveData === true || /2g/.test(conn.effectiveType || ''))
      );
    }

    function syncPlayback() {
      var allowed = !motionMq.matches && dataOk() && !document.hidden;
      for (var i = 0; i < videos.length; i += 1) {
        var v = videos[i];
        var visible = v.getClientRects().length > 0;
        if (allowed && visible) {
          if (v.paused) {
            var p = v.play();
            if (p && typeof p.catch === 'function') p.catch(function () {});
          }
        } else if (!v.paused) {
          v.pause();
        }
      }
    }

    for (var j = 0; j < videos.length; j += 1) {
      videos[j].addEventListener('playing', function () {
        this.classList.add('is-playing');
      });
    }
    document.addEventListener('visibilitychange', syncPlayback);
    if (typeof motionMq.addEventListener === 'function')
      motionMq.addEventListener('change', syncPlayback);
    if (typeof mobileMqVideos.addEventListener === 'function')
      mobileMqVideos.addEventListener('change', syncPlayback);
    if (conn && typeof conn.addEventListener === 'function')
      conn.addEventListener('change', syncPlayback);
    syncPlayback();
  }

  /* ================= boot ================= */
  /* ================= Lightbox (ampliacao premium das telas reais) ================= */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  var lightboxSource = document.getElementById('lightboxSource');
  var lightboxCaption = document.getElementById('lightboxCaption');
  var lightboxClose = document.getElementById('lightboxClose');
  var lightboxTrigger = null;

  function openLightbox(figure) {
    if (!lightbox) return;
    var img = figure.querySelector('img');
    lightboxSource.setAttribute(
      'srcset',
      figure.getAttribute('data-zoom-src') || '',
    );
    lightboxImg.setAttribute(
      'src',
      figure.getAttribute('data-zoom-fallback') || '',
    );
    lightboxImg.setAttribute('alt', img ? img.getAttribute('alt') || '' : '');
    lightboxCaption.textContent = img ? img.getAttribute('alt') || '' : '';
    lightboxTrigger = document.activeElement;
    lightbox.removeAttribute('hidden');
    document.body.classList.add('has-lightbox');
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hasAttribute('hidden')) return;
    lightbox.setAttribute('hidden', '');
    document.body.classList.remove('has-lightbox');
    if (lightboxTrigger && lightboxTrigger.focus) lightboxTrigger.focus();
    lightboxTrigger = null;
  }

  function initLightbox() {
    if (!lightbox) return;
    var figures = document.querySelectorAll('[data-zoom]');
    for (var i = 0; i < figures.length; i += 1) {
      (function (figure) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'zoom-btn';
        btn.setAttribute('aria-label', 'Ampliar esta tela do Ausculto');
        btn.innerHTML =
          '<svg viewBox="0 0 24 24" aria-hidden="true" width="17" height="17">' +
          '<circle cx="10.5" cy="10.5" r="6.2" fill="none" stroke="currentColor" stroke-width="1.8"/>' +
          '<path d="M15.2 15.2 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>' +
          '<path d="M10.5 8v5M8 10.5h5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>' +
          '</svg>';
        btn.addEventListener('click', function (ev) {
          ev.stopPropagation();
          openLightbox(figure);
        });
        figure.appendChild(btn);
        figure.addEventListener('click', function (ev) {
          if (ev.target.closest('a, button')) return;
          openLightbox(figure);
        });
      })(figures[i]);
    }
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox
      .querySelector('[data-lightbox-close]')
      .addEventListener('click', closeLightbox);
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') closeLightbox();
    });
  }

  initConsent();
  initSticky();
  initSectionTracking();
  initReveals();
  initFaq();
  initDemo();
  initLightbox();
  initHeaderChrome();
  initVideoBackgrounds();
  updateFixedChrome();
})();
