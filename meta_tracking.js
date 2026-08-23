/*
  Ausculto landing Meta bridge.

  Configure pixelId before paid traffic. Configure capiEndpoint only with a
  server endpoint that owns the Meta access token. Never expose that token here.
*/
(function () {
  'use strict';

  var defaults = {
    enabled: true,
    pixelId: '4322848531306781',
    capiEndpoint: '',
    testEventCode: '',
    debug: false,
    respectPrivacySignals: true,
    appHostnames: ['app.auscultoapp.com'],
    contentName: 'landing_v14',
    eventSource: 'landing_v14',
  };

  var config = Object.assign({}, defaults, window.AUSCULTO_META_CONFIG || {});
  window.AUSCULTO_META_CONFIG = config;
  window.dataLayer = window.dataLayer || [];

  var pixelId = String(config.pixelId || '').trim();
  var capiEndpoint = String(config.capiEndpoint || '').trim();
  var appHostnames = Array.isArray(config.appHostnames) && config.appHostnames.length
    ? config.appHostnames
    : defaults.appHostnames;
  var pixelInitialized = false;

  function debug() {
    if (!config.debug || !window.console) return;
    window.console.log.apply(window.console, arguments);
  }

  function blocksMarketingSignals() {
    if (config.respectPrivacySignals === false) return false;
    var dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
    return navigator.globalPrivacyControl === true || dnt === '1' || dnt === 'yes';
  }

  // === Consent gate (opt-in) ===
  // Ativo somente quando a pagina define window.AUSCULTO_REQUIRE_CONSENT === true
  // antes de carregar este script (hoje: /enamed/). Sem a flag, o comportamento
  // e identico ao de sempre nas demais paginas.
  var CONSENT_KEY = 'ausculto_consent_v1';
  var requireConsent = window.AUSCULTO_REQUIRE_CONSENT === true;
  var consentDecision = 'undecided';

  function readConsentDecision() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && (parsed.decision === 'granted' || parsed.decision === 'denied')) {
          return parsed.decision;
        }
      }
    } catch (error) { /* storage indisponivel: cai para o cookie */ }
    var cookie = getCookie(CONSENT_KEY);
    if (cookie) {
      var head = cookie.split('.')[0];
      if (head === 'granted' || head === 'denied') return head;
    }
    return 'undecided';
  }

  function writeConsentDecision(decision) {
    var ts = unixTime();
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ decision: decision, ts: ts, v: 1 }));
    } catch (error) { /* segue com o cookie */ }
    // Cookie first-party no dominio raiz: legivel pelo webapp (app.auscultoapp.com),
    // que suprime o Pixel quando denied (propagacao ponta a ponta do consent).
    // Fora de *.auscultoapp.com (localhost/IP), cai para cookie host-only.
    var hostname = window.location.hostname || '';
    var domain = /(^|\.)auscultoapp\.com$/i.test(hostname) ? '; Domain=.auscultoapp.com' : '';
    var secure = window.location.protocol === 'https:' ? '; Secure' : '';
    var expires = new Date(Date.now() + 365 * 864e5).toUTCString();
    document.cookie = CONSENT_KEY + '=' + encodeURIComponent(decision + '.' + ts) +
      '; expires=' + expires + '; path=/; SameSite=Lax' + domain + secure;
  }

  function marketingAllowed() {
    if (config.enabled === false || blocksMarketingSignals()) return false;
    // Sem decisao ou com recusa: nada de Pixel/CAPI/cookies de atribuicao.
    if (requireConsent && consentDecision !== 'granted') return false;
    return true;
  }

  var pageViewSent = false;

  function bootPageViewParams() {
    var params = {
      content_name: config.contentName,
      content_category: 'page_view',
    };
    if (window.auscultoEnamedHeroVariant) {
      params.hero_variant = String(window.auscultoEnamedHeroVariant);
    }
    return params;
  }

  function sendBootPageView() {
    if (pageViewSent || !marketingAllowed()) return;
    pageViewSent = true;
    window.auscultoTrack('PageView', bootPageViewParams());
  }

  // === Endpoints, resolvidos em RUNTIME pelo hostname ======================
  //
  // O mesmo artefato roda no preview e em producao. A diferenca nao pode estar
  // no build — senao o que for aprovado no preview nao e o que vai para o ar.
  //
  // Por que o preview precisa de endpoints diferentes: um rewrite de Hosting
  // so alcanca Functions do MESMO projeto Firebase. O site do ENAMED vive em
  // `auscultoapp`; as Functions desta rodada vivem em
  // `auscultoapp-meta-staging`. Nenhum rewrite atravessa essa fronteira. No
  // preview, portanto, as chamadas vao direto para a URL HTTPS das Functions
  // de staging; em producao, elas voltam a ser same-origin, e o rewrite as
  // resolve sem CORS e sem terceiro dominio no CSP.
  var STAGING_PREVIEW_HOSTS = [
    'auscultoapp-enamed--qa-3tldakhp.web.app',
  ];
  var STAGING_FUNCTIONS_BASE =
    'https://us-central1-auscultoapp-meta-staging.cloudfunctions.net';

  function resolveEndpoints() {
    var host = String(window.location.hostname || '').toLowerCase();
    if (STAGING_PREVIEW_HOSTS.indexOf(host) !== -1) {
      return {
        environment: 'staging',
        consentReference: STAGING_FUNCTIONS_BASE + '/issueMarketingConsentReference',
        appStoreBridge: STAGING_FUNCTIONS_BASE + '/recordAppStoreClick',
      };
    }
    // Producao e qualquer outro host: same-origin. O default e o caminho que
    // NAO fala com um projeto de teste.
    return {
      environment: 'production',
      consentReference: '/_consent/reference',
      appStoreBridge: '/_bridge/appstore-click',
    };
  }

  var endpoints = resolveEndpoints();

  // === Referencia assinada do consentimento ================================
  //
  // A decisao tomada aqui acontece ANTES de existir um usuario. Ela atravessa
  // para o app por uma referencia assinada pelo servidor, de uso unico e com
  // dez minutos de validade — e nao por cookie, query string ou clipboard, que
  // sao escritos pelo proprio cliente e nao provam nada. Um consentimento
  // forjado e pior do que consentimento nenhum.
  //
  // A referencia nao carrega identidade: nem uid, nem e-mail, nem telefone.
  // Ela afirma "uma decisao X, para a finalidade P, sob as versoes V/PV, no
  // ambiente E, no instante T". Quem a liga a uma pessoa e o app, depois do
  // Auth, chamando uma callable protegida por App Check.
  var consentReference = '';

  function requestConsentReference(decision) {
    if (!requireConsent) return;
    try {
      window.fetch(endpoints.consentReference, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Sem cookies: este endpoint nao autentica ninguem e nao deve receber
        // sessao. `omit` tambem evita preflight com credenciais.
        credentials: 'omit',
        body: JSON.stringify({ decision: decision }),
      }).then(function (response) {
        return response.ok ? response.json() : null;
      }).then(function (data) {
        if (!data || data.ok !== true || !data.reference) return;
        consentReference = String(data.reference);
        // Os links ja renderizados precisam receber a referencia agora: quem
        // consentiu no banner costuma clicar no CTA em seguida.
        prepareAppLinks();
      }).catch(function () {
        // Falhar aqui NAO pode custar produto. Sem referencia, o app
        // simplesmente pergunta de novo depois do cadastro.
      });
    } catch (error) { /* idem */ }
  }

  // Anexa a referencia a um link para o app. `ac_ref` e transporte, nao
  // autoridade — o servidor confere assinatura, ambiente, finalidade, versoes,
  // validade e o nonce de uso unico. O script do webapp a remove da barra de
  // endereco no primeiro boot, para que ela nao fique no historico nem no
  // `Referer`.
  function attachConsentReference(url) {
    if (!consentReference) return;
    url.searchParams.set('ac_ref', consentReference);
  }

  function setConsentDecision(decision) {
    consentDecision = decision;
    writeConsentDecision(decision);
    // A referencia e pedida para GRANTED e para DENIED. Registrar uma recusa
    // vale tanto quanto registrar um aceite: sem isso, a pessoa que recusou na
    // landing chega ao app como "sem decisao" e e perguntada de novo, o que e
    // uma forma educada de ignorar o que ela disse.
    requestConsentReference(decision);
    if (decision === 'granted') {
      // Bootstrap tardio: Pixel, cookies de atribuicao e o PageView que ficou
      // suprimido enquanto nao havia decisao.
      prepareAttributionCookies();
      initMetaPixel();
      sendBootPageView();
    }
  }

  if (requireConsent) {
    consentDecision = readConsentDecision();
    window.auscultoConsent = {
      state: function () { return consentDecision; },
      grant: function () { setConsentDecision('granted'); return consentDecision; },
      deny: function () { setConsentDecision('denied'); return consentDecision; },
    };
  }

  function hasUsablePixelId() {
    return /^[0-9]{5,}$/.test(pixelId);
  }

  function unixTime() {
    return Math.floor(Date.now() / 1000);
  }

  function getCookie(name) {
    var prefix = name + '=';
    var cookies = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < cookies.length; i += 1) {
      var cookie = cookies[i].trim();
      if (cookie.indexOf(prefix) === 0) {
        return decodeURIComponent(cookie.slice(prefix.length));
      }
    }
    return '';
  }

  function setCookie(name, value, days) {
    var expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) +
      '; expires=' + expires + '; path=/; SameSite=Lax; Secure';
  }

  function prepareAttributionCookies() {
    if (!marketingAllowed()) return;

    var params = new URLSearchParams(window.location.search);
    var fbclid = params.get('fbclid');
    // So grava quando ha um fbclid NOVO na URL. Regravar a cada chamada
    // (a funcao roda no load, em todo auscultoTrack e no grant de consent)
    // trocava o timestamp do clique original do visitante recorrente e podia
    // sobrescrever o _fbc que o proprio Pixel gravou.
    if (fbclid) {
      var currentFbc = getCookie('_fbc');
      var sameClick = currentFbc && currentFbc.split('.').slice(3).join('.') === fbclid;
      if (!sameClick) {
        setCookie('_fbc', 'fb.1.' + unixTime() + '.' + fbclid, 90);
      }
    }

    if (capiEndpoint && !getCookie('_fbp')) {
      setCookie('_fbp', 'fb.1.' + unixTime() + '.' + Math.floor(Math.random() * 10000000000000000), 90);
    }
  }

  function eventId(eventName) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return [
      'ausculto',
      String(eventName).toLowerCase(),
      Date.now(),
      Math.random().toString(36).slice(2, 10),
    ].join('_');
  }

  function cleanText(value) {
    return String(value || '').replace(/\s+/g, ' ').trim();
  }

  function currentMarketingParams() {
    var params = new URLSearchParams(window.location.search);
    var keys = [
      'fbclid',
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_content',
      'utm_term',
      'utm_id',
      'campaign_id',
      'adset_id',
      'ad_id',
      'meta_campaign_id',
      'meta_adset_id',
      'meta_ad_id',
      'gclid',
      'gbraid',
      'wbraid',
      'ttclid',
      'msclkid',
      'li_fat_id',
    ];
    var out = {};

    keys.forEach(function (key) {
      var value = cleanText(params.get(key));
      if (value) out[key] = value.slice(0, 512);
    });

    return out;
  }

  function mergeAppAttribution(link) {
    var href = link.getAttribute('href');
    if (!href) return null;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return null;
    }

    if (appHostnames.indexOf(url.hostname) === -1) return null;

    var incoming = currentMarketingParams();
    var hasIncomingAttribution = Object.keys(incoming).length > 0;
    if (!hasIncomingAttribution) {
      // Sem parametros de campanha na entrada nao ha o que propagar — mas a
      // referencia de consentimento nao depende de campanha nenhuma, e quem
      // chegou organicamente e consentiu tem o mesmo direito de atravessar
      // com a decisao dele.
      attachConsentReference(url);
      link.setAttribute('href', url.href);
      return url;
    }

    // IDEMPOTENTE. Esta funcao roda no load (prepareAppLinks), de novo em
    // `pageshow`, de novo quando a referencia de consentimento chega, e mais
    // uma vez no proprio clique. Na segunda passada `utm_campaign` ja e a da
    // campanha PAGA — e sem esta guarda, `landing_campaign` era sobrescrito
    // com ela, apagando a unica copia da UTM propria da landing.
    //
    // A primeira gravacao vence: ela e a que viu os valores originais.
    var preserve = function (target, source) {
      if (url.searchParams.get(target)) return;
      var value = cleanText(url.searchParams.get(source));
      if (value) url.searchParams.set(target, value);
    };
    preserve('landing_cta', 'utm_medium');
    preserve('landing_content', 'utm_content');
    preserve('landing_campaign', 'utm_campaign');

    Object.keys(incoming).forEach(function (key) {
      url.searchParams.set(key, incoming[key]);
    });

    attachConsentReference(url);
    link.setAttribute('href', url.href);
    return url;
  }

  function snakeCase(value) {
    return String(value || '')
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }

  // Hosts cujo caminho pode ser reportado. Qualquer outro vira string vazia.
  var URL_HOSTS = [
    'auscultoapp.com',
    'www.auscultoapp.com',
    'enamed.auscultoapp.com',
    'app.auscultoapp.com',
  ];

  // Esquema + host allowlisted + caminho. A QUERY NUNCA ENTRA.
  //
  // `window.location.href` arrasta a query string inteira para dentro do
  // evento: UTMs, fbclid, e o que a proxima feature acrescentar sem se lembrar
  // disto. Os parametros que importam ja viajam em campos proprios e
  // allowlisted; repeti-los dentro da URL entrega um blob que ninguem revisou.
  function sanitizedUrl(raw) {
    var value = String(raw || '').trim();
    if (!value) return '';
    try {
      var parsed = new URL(value, window.location.origin);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
      if (URL_HOSTS.indexOf(parsed.hostname) === -1) return '';
      return parsed.protocol + '//' + parsed.hostname + parsed.pathname;
    } catch (error) {
      return '';
    }
  }

  function currentPageUrl() {
    return sanitizedUrl(window.location.href);
  }

  function normalizeParams(params) {
    var out = {
      page_title: document.title,
      page_path: window.location.pathname,
      source_url: currentPageUrl(),
    };

    Object.keys(params || {}).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === '') return;
      out[key] = Array.isArray(value) ? value.map(function (item) { return String(item); }) : value;
    });

    return out;
  }

  function initMetaPixel() {
    if (pixelInitialized || !marketingAllowed() || !hasUsablePixelId()) return false;

    (function (f, b, e, v, n, t, s) {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', pixelId);
    pixelInitialized = true;
    debug('[Ausculto Meta] Pixel initialized', pixelId);
    return true;
  }

  var standardPixelEvents = {
    AddPaymentInfo: true,
    AddToCart: true,
    AddToWishlist: true,
    CompleteRegistration: true,
    Contact: true,
    CustomizeProduct: true,
    Donate: true,
    FindLocation: true,
    InitiateCheckout: true,
    Lead: true,
    PageView: true,
    Purchase: true,
    Schedule: true,
    Search: true,
    StartTrial: true,
    SubmitApplication: true,
    Subscribe: true,
    ViewContent: true,
  };

  function sendPixel(eventName, params, id) {
    if (!hasUsablePixelId() || !marketingAllowed()) return;
    initMetaPixel();
    if (typeof window.fbq === 'function') {
      window.fbq(standardPixelEvents[eventName] ? 'track' : 'trackCustom', eventName, params, { eventID: id });
    }
  }

  function buildCapiPayload(eventName, params, id) {
    var event = {
      event_name: eventName,
      event_time: unixTime(),
      event_id: id,
      action_source: 'website',
      event_source_url: currentPageUrl(),
      user_data: {
        client_user_agent: navigator.userAgent,
        fbc: getCookie('_fbc'),
        fbp: getCookie('_fbp'),
      },
      custom_data: params,
    };

    var payload = { data: [event] };
    if (hasUsablePixelId()) payload.pixel_id = pixelId;
    if (config.testEventCode) payload.test_event_code = String(config.testEventCode);
    return payload;
  }

  function sendCapi(eventName, params, id) {
    if (!capiEndpoint || !marketingAllowed()) return;

    var body = JSON.stringify(buildCapiPayload(eventName, params, id));
    var blob = new Blob([body], { type: 'application/json' });
    if (navigator.sendBeacon && navigator.sendBeacon(capiEndpoint, blob)) return;

    window.fetch(capiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body,
      keepalive: true,
      credentials: 'omit',
    }).catch(function (error) {
      debug('[Ausculto Meta] CAPI failed', error);
    });
  }

  window.auscultoTrack = function (eventName, params) {
    if (!marketingAllowed()) return null;

    prepareAttributionCookies();
    var id = eventId(eventName);
    var eventParams = normalizeParams(params);

    window.dataLayer.push(Object.assign({
      event: 'meta_' + snakeCase(eventName),
      meta_event_name: eventName,
      meta_event_id: id,
      event_source: config.eventSource,
    }, eventParams));

    sendPixel(eventName, eventParams, id);
    sendCapi(eventName, eventParams, id);
    debug('[Ausculto Meta] Event', eventName, id, eventParams);
    return id;
  };

  // "pricing" (index) e "<pagina>_pricing" (ads-estudante/ads-medico) sao a mesma
  // superficie de planos: precisam classificar igual, senao o PRO vira Lead generico.
  function isPricingMedium(medium) {
    return medium === 'pricing' || /_pricing$/.test(medium);
  }

  function classifyLandingLink(link) {
    var href = link.getAttribute('href');
    if (!href) return null;

    if (href === '#pricing') {
      return {
        eventName: 'ViewContent',
        params: {
          content_name: 'pricing',
          content_category: 'landing_section',
          cta: cleanText(link.textContent) || 'Ver planos PRO',
          destination: href,
        },
      };
    }

    if (href.charAt(0) === '#') return null;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return null;
    }

    if (appHostnames.indexOf(url.hostname) === -1) return null;

    var medium = url.searchParams.get('landing_cta') || url.searchParams.get('utm_medium') || '';
    var content = url.searchParams.get('landing_content') || url.searchParams.get('utm_content') || '';
    var label = cleanText(link.textContent) || link.getAttribute('aria-label') || 'Ausculto App';

    // Funil ENAMED (/enamed/): o clique no app com medium ads_enamed e intencao
    // de diagnostico, nao Lead generico. Substitui o default SOMENTE aqui.
    if (medium === 'ads_enamed') {
      return {
        eventName: 'enamed_diagnostic_intent',
        params: {
          hero_variant: String(window.auscultoEnamedHeroVariant || 'direcao'),
          cta_position: link.getAttribute('data-cta-position') || '',
        },
      };
    }

    // CLIQUE NAO E CONVERSAO.
    //
    // Este bloco emitia `InitiateCheckout` quando alguem clicava no botao do
    // plano PRO, e `Lead` em qualquer outro clique para o app. Nenhum dos dois
    // era verdade: `InitiateCheckout` significa "checkout iniciado", e a
    // autoridade dele e o backend, quando um pedido e criado de verdade;
    // `Lead` significa que existe um lead qualificado, e um clique num link
    // nao qualifica ninguem.
    //
    // O custo disso nao era so semantico: eram os DOIS eventos padrao da Meta
    // mais proximos de compra sendo alimentados com cliques, o que treina a
    // otimizacao a buscar quem clica em vez de quem paga.
    //
    // O que sobra sao eventos PROPRIOS, que descrevem o que de fato
    // aconteceu — um clique — e que nao podem ser confundidos com conversao
    // por nenhum painel.
    if (isPricingMedium(medium)) {
      return {
        eventName: 'pricing_cta_click',
        params: {
          plan: content === 'pro' ? 'pro' : (content === 'free' ? 'free' : 'unknown'),
          cta_position: link.getAttribute('data-cta-position') || '',
        },
      };
    }

    return {
      eventName: 'app_cta_click',
      params: {
        surface: content === 'free' ? 'free_plan' : 'web_app',
        cta_position: link.getAttribute('data-cta-position') || '',
      },
    };
  }

  function prepareAppLinks() {
    if (!document.querySelectorAll) return;
    document.querySelectorAll('a[href]').forEach(function (link) {
      mergeAppAttribution(link);
    });
  }

  // === Ponte de atribuicao App Store -> cadastro ===
  // Endpoint same-origin (rewrite de hosting -> Cloud Function recordAppStoreClick).
  // Resolvido em runtime junto com os demais (ver resolveEndpoints).

  function isAppStoreLink(link) {
    if (link.getAttribute('data-event') === 'app_store_click') return true;
    var href = link.getAttribute('href') || '';
    return /apps\.apple\.com|itunes\.apple\.com/i.test(href);
  }

  function appStoreBridgePayload() {
    var params = currentMarketingParams();
    return {
      // A ponte SO grava com referencia assinada e concedida. Sem ela o
      // servidor recusa — cookie e query string nao provam consentimento.
      consentReference: consentReference,
      fbc: getCookie('_fbc'),
      fbp: getCookie('_fbp'),
      utm_source: params.utm_source || '',
      utm_medium: params.utm_medium || '',
      utm_campaign: params.utm_campaign || '',
      utm_content: params.utm_content || '',
      t: Date.now(),
    };
  }

  // Disparado quando o usuario clica "Baixar na App Store". Frente A: registra
  // fbc+IP no backend pra casar com o cadastro nativo depois. Frente B (base):
  // deixa o fbc no clipboard pro app ler o fbc REAL no primeiro open.
  function handleAppStoreClick() {
    if (!marketingAllowed()) return;
    var payload = appStoreBridgePayload();
    if (!payload.fbc) return; // sem fbc o usuario nao veio de anuncio Meta
    try {
      var body = JSON.stringify(payload);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(endpoints.appStoreBridge, body);
      } else {
        window.fetch(endpoints.appStoreBridge, {
          method: 'POST',
          body: body,
          keepalive: true,
          headers: { 'Content-Type': 'text/plain' },
          credentials: 'omit',
        }).catch(function () {});
      }
    } catch (e) { /* nunca quebra o clique */ }
    try {
      var token = 'ausculto-attr::fbc=' + encodeURIComponent(payload.fbc || '') +
        '|fbp=' + encodeURIComponent(payload.fbp || '') +
        '|utm_content=' + encodeURIComponent(payload.utm_content || '') +
        '|ts=' + payload.t;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(token).catch(function () {});
      }
    } catch (e) { /* clipboard pode ser negado; ok, Frente A cobre */ }
  }

  // === Botoes rastreados (sem href, invisiveis ao fluxo de <a>) ===
  // Allowlist explicita: so estes data-event disparam. Outros botoes com
  // data-event (ex.: abas do index.html) seguem sem evento, como antes.
  // Excecao de forma: `enamed_cta_click` mora em <a> reais (os CTAs da pagina
  // /enamed/ sao links de verdade); o handler de clique consulta a mesma
  // allowlist para links — comportamento das demais paginas inalterado porque
  // nenhum data-event delas consta aqui.
  var buttonEvents = {
    cta_ver_planos_click: {
      eventName: 'ViewContent',
      params: { content_name: 'pricing', content_category: 'landing_section' },
    },
    cta_bancas_expand_click: {
      eventName: 'ViewContent',
      params: { content_name: 'bancas_list', content_category: 'landing_engagement' },
    },
    cta_demo_questao_open: {
      eventName: 'ViewContent',
      params: { content_name: 'questoes_demo', content_category: 'product_demo' },
    },
    cta_demo_treino_open: {
      eventName: 'ViewContent',
      params: { content_name: 'treino_demo', content_category: 'product_demo' },
    },
    enamed_cta_click: {
      eventName: 'enamed_cta_click',
      params: function (el) {
        return {
          cta_position: el.getAttribute('data-cta-position') || '',
          hero_variant: String(window.auscultoEnamedHeroVariant || 'direcao'),
        };
      },
    },
  };

  function classifyTrackedButton(el) {
    var name = el.getAttribute('data-event');
    if (!name || !buttonEvents[name]) return null;

    // toggles: so contabiliza a ABERTURA (aria-expanded ainda e "false" na captura)
    if (el.getAttribute('aria-expanded') === 'true') return null;

    var tracked = buttonEvents[name];
    var baseParams = typeof tracked.params === 'function' ? tracked.params(el) : tracked.params;
    return {
      eventName: tracked.eventName,
      params: Object.assign({}, baseParams, {
        cta: cleanText(el.textContent) || el.getAttribute('aria-label') || name,
        landing_event: name,
      }),
    };
  }

  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var link = target.closest('a[href]');
    if (link) {
      if (isAppStoreLink(link)) {
        handleAppStoreClick();
        return;
      }
      mergeAppAttribution(link);
      // UM evento por clique. Os CTAs do ENAMED satisfazem as duas
      // classificacoes ao mesmo tempo (`data-event` e `utm_medium=ads_enamed`);
      // emitir as duas gerava dois event_id distintos para a mesma acao, que o
      // Meta conta como dois cliques. O `data-event` explicito vence, porque e
      // a intencao declarada no HTML; a classificacao por URL e o fallback.
      var linkEvent = classifyTrackedButton(link) || classifyLandingLink(link);
      if (linkEvent) window.auscultoTrack(linkEvent.eventName, linkEvent.params);
      return;
    }

    var button = target.closest('button[data-event]');
    if (!button) return;
    var buttonTracked = classifyTrackedButton(button);
    if (buttonTracked) window.auscultoTrack(buttonTracked.eventName, buttonTracked.params);
  }, true);

  prepareAttributionCookies();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareAppLinks, { once: true });
  } else {
    prepareAppLinks();
  }
  window.addEventListener('pageshow', prepareAppLinks);
  initMetaPixel();
  sendBootPageView();
})();
