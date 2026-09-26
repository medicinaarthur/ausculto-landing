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
    // GA4 so existe quando a pagina informa o measurement id (o build do site
    // injeta o do app web). Sem id, nenhum comando GA4 e emitido.
    ga4MeasurementId: '',
    // Banner compartilhado. Paginas com banner proprio (#consentBanner, como
    // o ENAMED) sao detectadas e ficam com o delas.
    consentBanner: true,
    privacyPolicyUrl: '/politica-de-privacidade.html',
    // Provider token da conta na App Store Connect (Campaign Links).
    appStoreProviderToken: '128571619',
  };

  var config = Object.assign({}, defaults, window.AUSCULTO_META_CONFIG || {});
  window.AUSCULTO_META_CONFIG = config;
  window.dataLayer = window.dataLayer || [];

  var pixelId = String(config.pixelId || '').trim();
  var capiEndpoint = String(config.capiEndpoint || '').trim();
  // O host do preview entra na lista de hosts "do app" para que os CTAs sejam
  // classificados e receberem atribuicao igual aos de producao.
  var appHostnames = (Array.isArray(config.appHostnames) && config.appHostnames.length
    ? config.appHostnames
    : defaults.appHostnames).concat(['auscultoapp-webapp--gate-c-mcyyb19w.web.app']);
  var pixelInitialized = false;
  var ga4Id = String(config.ga4MeasurementId || '').trim();
  var ga4Initialized = false;
  var ga4ScriptInserted = false;

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
  // antes de carregar este script. Hoje: /enamed/ e TODAS as paginas do site
  // principal (o build-site.mjs injeta a flag). Sem a flag, o comportamento e
  // o antigo: Pixel no load.
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

  // O webapp de destino, tambem por hostname. Num preview da landing, os CTAs
  // tem de levar ao PREVIEW do webapp: apontar para producao faria o QA testar
  // um bundle que nao tem nada do que esta sendo validado — o `returnTo`, o
  // resgate da referencia, a interface de consentimento. E o clique cairia
  // numa home generica, que e exatamente o beco sem saida que esta rodada
  // existe para nao criar.
  var STAGING_APP_HOST = 'auscultoapp-webapp--gate-c-mcyyb19w.web.app';
  var PRODUCTION_APP_HOST = 'app.auscultoapp.com';

  function resolveEndpoints() {
    var host = String(window.location.hostname || '').toLowerCase();
    if (STAGING_PREVIEW_HOSTS.indexOf(host) !== -1) {
      return {
        environment: 'staging',
        consentReference: STAGING_FUNCTIONS_BASE + '/issueMarketingConsentReference',
        appStoreBridge: STAGING_FUNCTIONS_BASE + '/recordAppStoreClick',
        appHost: STAGING_APP_HOST,
      };
    }
    // Producao e qualquer outro host: same-origin. O default e o caminho que
    // NAO fala com um projeto de teste.
    return {
      environment: 'production',
      consentReference: '/_consent/reference',
      appStoreBridge: '/_bridge/appstore-click',
      appHost: PRODUCTION_APP_HOST,
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

  function requestConsentReference(decision, attribution) {
    if (!requireConsent) return;
    try {
      window.fetch(endpoints.consentReference, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Sem cookies: este endpoint nao autentica ninguem e nao deve receber
        // sessao. `omit` tambem evita preflight com credenciais.
        credentials: 'omit',
        body: JSON.stringify({
          decision: decision,
          // Atribuicao so atravessa depois do aceite e dentro da assinatura.
          // O servidor reaplica uma allowlist fechada antes de assinar.
          attribution: decision === 'granted' ? attribution : undefined,
        }),
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

  // Apaga o que o marketing deixou. Espelha `purgeMarketingState` do webapp.
  //
  // Encontrado no QA em navegador real, e nao pelo teste no DOM sintetico —
  // que nunca exercitou conceder-e-depois-recusar na landing. Ate aqui,
  // `deny()` so parava de escrever: o `_fbp` ja gravado permanecia no
  // navegador e o script do Pixel, ja carregado, continuava vivo. Parar de
  // chamar `track` nao e o mesmo que revogar.
  var MARKETING_COOKIES = ['_fbp', '_fbc'];

  // Os escopos de dominio em que um cookie de marketing pode ter sido gravado.
  //
  // Apagar um cookie exige casar o Domain com que ele foi criado. O `_fbc` e
  // nosso e e host-only, entao `path=/` sem Domain basta — mas o `_fbp` e
  // gravado pelo PROPRIO script do Pixel, com Domain explicito, e uma delecao
  // host-only simplesmente nao o alcanca. Foi assim que ele sobreviveu a
  // recusa no QA: a purga rodava e nao apagava nada.
  //
  // A escada cobre: host-only, o host exato, o host com ponto, e cada dominio
  // pai ate o registravel.
  function cookieDomainScopes() {
    var host = String(window.location.hostname || '');
    var escopos = ['', host, '.' + host];
    var partes = host.split('.');
    for (var i = 1; i < partes.length - 1; i += 1) {
      escopos.push('.' + partes.slice(i).join('.'));
    }
    return escopos;
  }

  function purgeMarketingCookies() {
    // A ORDEM IMPORTA, e foi medida. Revogar PRIMEIRO, apagar DEPOIS.
    //
    // O Pixel tem revogacao propria — o script ja carregado continua ativo se
    // apenas pararmos de chamar `track`. E enquanto ele estiver ativo, ele
    // REESCREVE o `_fbp` que acabamos de apagar: no QA, a purga rodava, o
    // cookie sumia, e ele reaparecia antes da proxima leitura.
    if (typeof window.fbq === 'function') {
      try { window.fbq('consent', 'revoke'); } catch (e) { /* estado parcial */ }
    }
    // Mesma regra para o GA4: revoga no consent mode e desliga o gtag antes
    // de apagar, senao ele regrava o `_ga` na proxima batida.
    revokeGa4();
    var nomes = MARKETING_COOKIES.concat(googleCookieNames());
    var dominios = cookieDomainScopes();
    for (var i = 0; i < nomes.length; i += 1) {
      for (var j = 0; j < dominios.length; j += 1) {
        document.cookie = nomes[i] +
          '=; Max-Age=0; path=/' +
          (dominios[j] ? '; Domain=' + dominios[j] : '');
      }
    }
    pixelInitialized = false;
    pageViewSent = false;
  }

  // Cookies do Google (GA4 e conversao): nomes fixos mais os que existirem
  // no navegador com os prefixos conhecidos (`_ga_<container>`, `_gcl_*`).
  function googleCookieNames() {
    var nomes = ['_ga', '_gid', '_gat', '_gcl_au'];
    if (ga4Id) nomes.push('_ga_' + ga4Id.replace(/^G-/, ''));
    var existentes = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < existentes.length; i += 1) {
      var nome = existentes[i].split('=')[0].trim();
      if (/^(_ga|_gid|_gat|_gcl_)/.test(nome) && nomes.indexOf(nome) === -1) {
        nomes.push(nome);
      }
    }
    return nomes;
  }

  function setConsentDecision(decision) {
    consentDecision = decision;
    writeConsentDecision(decision);
    if (decision === 'granted') {
      // A ordem e contratual: primeiro materializa os identificadores do clique,
      // depois pede a referencia que os assina. Pedir antes produzia uma
      // referencia valida, mas vazia, e o cadastro virava falsamente "nativo".
      prepareAttributionCookies();
      requestConsentReference(decision, consentReferenceAttribution());
      initMetaPixel();
      initGa4();
      sendBootPageView();
      hideConsentBanner();
      return;
    }
    hideConsentBanner();
    purgeMarketingCookies();
    // Uma recusa tambem atravessa, mas jamais leva atribuicao junto.
    requestConsentReference(decision);
  }

  if (requireConsent) {
    consentDecision = readConsentDecision();
    window.auscultoConsent = {
      state: function () { return consentDecision; },
      grant: function () { setConsentDecision('granted'); return consentDecision; },
      deny: function () { setConsentDecision('denied'); return consentDecision; },
      // Reabre o banner para rever a escolha (LGPD: revogar tem de ser tao
      // facil quanto consentir). Qualquer elemento com [data-consent-open]
      // chama isto.
      open: function () { showConsentBanner(true); return consentDecision; },
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

    // O fbclid vem da URL ou, se a pessoa navegou antes de decidir, do cookie
    // first-party do clique, com o instante em que o clique foi visto.
    var fbclid = cleanText(new URLSearchParams(window.location.search).get('fbclid'));
    var clickTime = unixTime();
    if (!fbclid) {
      fbclid = persistedMarketingParams().fbclid || '';
      clickTime = persistedClickTime() || clickTime;
    }
    // So grava quando ha um fbclid NOVO. Regravar a cada chamada
    // (a funcao roda no load, em todo auscultoTrack e no grant de consent)
    // trocava o timestamp do clique original do visitante recorrente e podia
    // sobrescrever o _fbc que o proprio Pixel gravou.
    if (fbclid) {
      var currentFbc = getCookie('_fbc');
      var sameClick = currentFbc && currentFbc.split('.').slice(3).join('.') === fbclid;
      if (!sameClick) {
        setCookie('_fbc', 'fb.1.' + clickTime + '.' + fbclid, 90);
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

  // Allowlist FECHADA dos parametros de campanha. Nada fora dela e lido,
  // persistido ou propagado.
  var MARKETING_PARAM_KEYS = [
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

  function pickMarketingParams(params, maxLength) {
    var out = {};
    MARKETING_PARAM_KEYS.forEach(function (key) {
      var value = cleanText(params.get(key));
      if (value) out[key] = value.slice(0, maxLength);
    });
    return out;
  }

  function urlMarketingParams() {
    return pickMarketingParams(new URLSearchParams(window.location.search), 512);
  }

  // === Atribuicao first-party, ANTES do consentimento =====================
  //
  // Os parametros da campanha pela qual a pessoa chegou ficam num cookie
  // PROPRIO (`ausculto_attr_v1`) no dominio raiz, por 90 dias. E dado tecnico
  // de origem da visita: nenhum script de terceiro e carregado para isso, e o
  // cookie nao e lido por ninguem alem deste script e do webapp. Sem isso,
  // quem chega por anuncio, navega para /estudantes/ e so entao clica no CTA
  // chegava ao app como organico.
  //
  // Ultimo toque vence: uma nova visita COM parametros substitui o conjunto
  // inteiro (misturar campanhas de cliques diferentes seria inventar origem).
  // Visita sem parametros nao apaga nada.
  var ATTRIBUTION_COOKIE = 'ausculto_attr_v1';
  var ATTRIBUTION_DAYS = 90;

  function rootDomainAttribute() {
    var hostname = window.location.hostname || '';
    return /(^|\.)auscultoapp\.com$/i.test(hostname) ? '; Domain=.auscultoapp.com' : '';
  }

  function persistCampaignParams() {
    if (config.enabled === false) return;
    var fromUrl = pickMarketingParams(new URLSearchParams(window.location.search), 200);
    var keys = Object.keys(fromUrl);
    if (!keys.length) return;
    var stored = new URLSearchParams();
    keys.forEach(function (key) { stored.set(key, fromUrl[key]); });
    stored.set('ts', String(unixTime()));
    var value = encodeURIComponent(stored.toString());
    if (value.length > 3500) return; // nunca estoura o limite de 4 KB do cookie
    var secure = window.location.protocol === 'https:' ? '; Secure' : '';
    var expires = new Date(Date.now() + ATTRIBUTION_DAYS * 864e5).toUTCString();
    document.cookie = ATTRIBUTION_COOKIE + '=' + value + '; expires=' + expires +
      '; path=/; SameSite=Lax' + rootDomainAttribute() + secure;
  }

  function persistedMarketingParams() {
    var raw = getCookie(ATTRIBUTION_COOKIE);
    if (!raw) return {};
    try {
      return pickMarketingParams(new URLSearchParams(raw), 512);
    } catch (error) {
      return {};
    }
  }

  function persistedClickTime() {
    var raw = getCookie(ATTRIBUTION_COOKIE);
    if (!raw) return 0;
    try {
      var ts = parseInt(new URLSearchParams(raw).get('ts'), 10);
      return ts > 0 ? ts : 0;
    } catch (error) {
      return 0;
    }
  }

  // Parametros da URL atual; sem eles, os persistidos do ultimo clique.
  function currentMarketingParams() {
    var fromUrl = urlMarketingParams();
    return Object.keys(fromUrl).length ? fromUrl : persistedMarketingParams();
  }

  function consentReferenceAttribution() {
    return {
      url: sanitizedUrl(window.location.href),
      query: currentMarketingParams(),
      fbc: getCookie('_fbc'),
      fbp: getCookie('_fbp'),
    };
  }

  // Cada passada reconstroi o link a partir do href ORIGINAL do HTML. Sem
  // isso, a segunda passada (pageshow, chegada da referencia, clique) lia o
  // `utm_medium` que a primeira acabara de injetar e o gravava como
  // `landing_cta`, inventando uma UTM propria que o CTA nunca teve. Se o href
  // mudar por fora (re-render), o novo valor vira o original.
  function originalHref(link) {
    var href = link.getAttribute('href');
    var original = link.getAttribute('data-ausculto-original-href');
    if (!original || href !== link.getAttribute('data-ausculto-rewritten-href')) {
      original = href;
    }
    return original;
  }

  function writeAppHref(link, original, url) {
    link.setAttribute('data-ausculto-original-href', original);
    link.setAttribute('href', url.href);
    link.setAttribute('data-ausculto-rewritten-href', url.href);
  }

  function mergeAppAttribution(link) {
    var href = originalHref(link);
    if (!href) return null;

    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return null;
    }

    if (appHostnames.indexOf(url.hostname) === -1) return null;

    // Reescreve o host para o do ambiente. O HTML sempre traz o host de
    // producao; num preview, o clique tem de ir ao preview.
    if (url.hostname !== endpoints.appHost) {
      url.hostname = endpoints.appHost;
    }

    // Superficie de origem do clique: so o caminho da pagina, nunca a query.
    // Vale tambem para quem chegou sem campanha (ex.: os `returnTo` do
    // /estudantes/), que antes atravessava sem marca nenhuma.
    if (!url.searchParams.get('landing_page')) {
      url.searchParams.set('landing_page', window.location.pathname || '/');
    }

    var incoming = currentMarketingParams();
    var hasIncomingAttribution = Object.keys(incoming).length > 0;
    if (!hasIncomingAttribution) {
      // Sem parametros de campanha na entrada nao ha o que propagar — mas a
      // referencia de consentimento nao depende de campanha nenhuma, e quem
      // chegou organicamente e consentiu tem o mesmo direito de atravessar
      // com a decisao dele.
      attachConsentReference(url);
      writeAppHref(link, href, url);
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
    writeAppHref(link, href, url);
    return url;
  }

  // === Links das lojas =====================================================
  //
  // Nenhuma loja le cookie da landing: a origem so chega ao console se vier
  // no proprio link. Google Play: `referrer` com o conjunto UTM codificado
  // (Install Referrer). App Store: Campaign Link (`pt` + `ct` + `mt=8`), que
  // aparece em App Analytics > Sources. So UTMs atravessam; identificadores
  // de clique (fbclid, gclid...) nao vao para as lojas.
  var PLAY_PACKAGE = 'br.com.ausculto.app';
  var APP_STORE_ID = '6760672276';

  function storeKind(url) {
    if (url.hostname === 'play.google.com' && url.searchParams.get('id') === PLAY_PACKAGE) {
      return 'google_play';
    }
    if (/(^|\.)(apps|itunes)\.apple\.com$/i.test(url.hostname) &&
        url.pathname.indexOf('id' + APP_STORE_ID) !== -1) {
      return 'app_store';
    }
    return null;
  }

  function storeUtm() {
    var params = currentMarketingParams();
    var out = {
      utm_source: (params.utm_source || 'site').slice(0, 100),
      utm_medium: (params.utm_medium || 'organic').slice(0, 100),
    };
    if (params.utm_campaign) out.utm_campaign = params.utm_campaign.slice(0, 100);
    if (params.utm_content) out.utm_content = params.utm_content.slice(0, 100);
    return out;
  }

  // `ct` aceita ate 40 caracteres; fica so o que o painel da Apple mostra bem.
  function appStoreCampaignToken(utm) {
    var raw = utm.utm_campaign || (utm.utm_source + '_' + utm.utm_medium);
    return String(raw).replace(/[^A-Za-z0-9_.-]+/g, '_').slice(0, 40);
  }

  function prepareStoreLink(link) {
    var href = link.getAttribute('href');
    if (!href) return null;
    var url;
    try {
      url = new URL(href, window.location.href);
    } catch (error) {
      return null;
    }
    var kind = storeKind(url);
    if (!kind) return null;
    var utm = storeUtm();
    if (kind === 'google_play') {
      var referrer = new URLSearchParams();
      Object.keys(utm).forEach(function (key) { referrer.set(key, utm[key]); });
      url.searchParams.set('referrer', referrer.toString());
    } else {
      url.searchParams.set('pt', String(config.appStoreProviderToken || ''));
      url.searchParams.set('ct', appStoreCampaignToken(utm));
      url.searchParams.set('mt', '8');
    }
    link.setAttribute('href', url.href);
    return kind;
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

  // === GA4 (gtag), com consent mode ========================================
  //
  // O mesmo measurement id do app web: site e app ficam na mesma propriedade,
  // e o `_ga` no dominio raiz faz a sessao atravessar para app.auscultoapp.com.
  //
  // Antes do aceite, so existe o default "denied" empilhado no dataLayer,
  // sem rede: o gtag.js (terceiro) so e inserido depois do aceite, como o
  // Pixel.
  function hasUsableGa4Id() {
    return /^G-[A-Z0-9]{4,}$/.test(ga4Id);
  }

  function gtag() {
    window.dataLayer.push(arguments);
  }

  var GA4_DENIED = {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  };
  var GA4_GRANTED = {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: 'granted',
  };

  if (hasUsableGa4Id()) {
    if (typeof window.gtag !== 'function') window.gtag = gtag;
    gtag('consent', 'default', GA4_DENIED);
  }

  // page_location sem a query inteira: esquema + host + caminho e so os
  // parametros de campanha allowlisted da URL atual, que e de onde o GA4 tira
  // a origem da sessao.
  function ga4PageLocation() {
    var base = window.location.protocol + '//' + window.location.hostname + window.location.pathname;
    var params = urlMarketingParams();
    var query = new URLSearchParams();
    Object.keys(params).forEach(function (key) { query.set(key, params[key]); });
    var qs = query.toString();
    return qs ? base + '?' + qs : base;
  }

  function initGa4() {
    if (ga4Initialized || !marketingAllowed() || !hasUsableGa4Id()) return false;
    window['ga-disable-' + ga4Id] = false;
    gtag('consent', 'update', GA4_GRANTED);
    if (!ga4ScriptInserted) {
      var script = document.createElement('script');
      script.async = true;
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ga4Id);
      var first = document.getElementsByTagName('script')[0];
      first.parentNode.insertBefore(script, first);
      ga4ScriptInserted = true;
    }
    gtag('js', new Date());
    gtag('config', ga4Id, {
      page_location: ga4PageLocation(),
      page_title: document.title,
      send_page_view: true,
    });
    ga4Initialized = true;
    debug('[Ausculto GA4] initialized', ga4Id);
    return true;
  }

  function revokeGa4() {
    if (!hasUsableGa4Id()) return;
    gtag('consent', 'update', GA4_DENIED);
    window['ga-disable-' + ga4Id] = true;
    ga4Initialized = false;
  }

  // Parametros do evento no formato do GA4: escalares, ate 100 caracteres.
  // page_title/source_url ja vem do proprio gtag.
  function ga4Params(params, id) {
    var out = { event_id: id };
    Object.keys(params || {}).forEach(function (key) {
      if (key === 'page_title' || key === 'source_url') return;
      var value = params[key];
      if (Array.isArray(value)) value = value.join(',');
      if (typeof value === 'number' || typeof value === 'boolean') {
        out[key] = value;
      } else if (value !== undefined && value !== null && value !== '') {
        out[key.slice(0, 40)] = String(value).slice(0, 100);
      }
    });
    return out;
  }

  function sendGa4(eventName, params, id) {
    // O PageView do Pixel corresponde ao page_view que o `config` ja envia.
    if (eventName === 'PageView' || !hasUsableGa4Id() || !marketingAllowed()) return;
    initGa4();
    if (!ga4Initialized) return;
    gtag('event', snakeCase(eventName).slice(0, 40), ga4Params(params, id));
  }

  // === Banner de consentimento compartilhado ===============================
  //
  // Dois botoes do mesmo tamanho e peso, sem caixa pre-marcada, sem fechar
  // pelo X como se fosse aceite. Sem decisao, nada de terceiro carrega.
  // Paginas com banner proprio (#consentBanner) seguem com o delas.
  var BANNER_ID = 'auscultoConsentBanner';
  var BANNER_STYLE_ID = 'auscultoConsentBannerStyle';
  var BANNER_CSS =
    '#' + BANNER_ID + '{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:2147483000;' +
    'margin:0 auto;max-width:720px;box-sizing:border-box;padding:16px;border-radius:14px;border:1px solid rgba(201,164,94,.55);' +
    'background:#07182f;color:#fdfaf7;box-shadow:0 18px 48px rgba(7,24,47,.35);font:400 14px/1.5 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;text-align:left}' +
    '#' + BANNER_ID + ' *{box-sizing:border-box}' +
    '#' + BANNER_ID + ' p{margin:0 0 12px;color:#fdfaf7;font:inherit}' +
    '#' + BANNER_ID + ' a{color:#ecd095;text-decoration:underline;text-underline-offset:2px}' +
    '#' + BANNER_ID + ' .ac-consent__actions{display:flex;gap:10px}' +
    '#' + BANNER_ID + ' button{flex:1 1 0;min-height:44px;margin:0;padding:10px 16px;border-radius:10px;border:1px solid #ecd095;' +
    'font:600 15px/1.2 Inter,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;cursor:pointer;color:#07182f}' +
    '#' + BANNER_ID + ' button[data-consent-choice="denied"]{background:#fdfaf7}' +
    '#' + BANNER_ID + ' button[data-consent-choice="granted"]{background:#ecd095}' +
    '#' + BANNER_ID + ' button:focus-visible,#' + BANNER_ID + ' a:focus-visible{outline:3px solid #fdfaf7;outline-offset:2px}' +
    '@media (min-width:720px){#' + BANNER_ID + '{display:flex;align-items:center;gap:20px;padding:16px 20px}' +
    '#' + BANNER_ID + ' p{margin:0;flex:1 1 auto}#' + BANNER_ID + ' .ac-consent__actions{flex:0 0 auto}' +
    '#' + BANNER_ID + ' button{flex:0 0 auto;min-width:120px}}' +
    '@media print{#' + BANNER_ID + '{display:none}}';

  function pageHasOwnBanner() {
    return !!(document.getElementById && document.getElementById('consentBanner'));
  }

  function bannerAllowed() {
    return requireConsent && config.consentBanner !== false && config.enabled !== false &&
      !blocksMarketingSignals() && !pageHasOwnBanner() &&
      !!(document.body && document.createElement);
  }

  function showConsentBanner(force) {
    if (!bannerAllowed()) return;
    if (!force && consentDecision !== 'undecided') return;
    if (document.getElementById(BANNER_ID)) return;

    if (!document.getElementById(BANNER_STYLE_ID)) {
      var style = document.createElement('style');
      style.id = BANNER_STYLE_ID;
      style.textContent = BANNER_CSS;
      (document.head || document.body).appendChild(style);
    }

    var banner = document.createElement('section');
    banner.id = BANNER_ID;
    banner.className = 'ac-consent';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Preferências de cookies');

    var text = document.createElement('p');
    text.appendChild(document.createTextNode(
      'Usamos cookies de medição e publicidade (Meta e Google) para entender o uso do site ' +
      'e avaliar nossos anúncios, somente se você aceitar. Os cookies essenciais ao ' +
      'funcionamento continuam ativos. Saiba mais na '));
    var policy = document.createElement('a');
    policy.href = config.privacyPolicyUrl;
    policy.appendChild(document.createTextNode('Política de Privacidade'));
    text.appendChild(policy);
    text.appendChild(document.createTextNode('.'));

    var actions = document.createElement('div');
    actions.className = 'ac-consent__actions';
    [['denied', 'Recusar'], ['granted', 'Aceitar']].forEach(function (choice) {
      var button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('data-consent-choice', choice[0]);
      button.appendChild(document.createTextNode(choice[1]));
      button.addEventListener('click', function () {
        if (choice[0] === 'granted') window.auscultoConsent.grant();
        else window.auscultoConsent.deny();
      });
      actions.appendChild(button);
    });

    banner.appendChild(text);
    banner.appendChild(actions);
    // Primeiro no DOM (a leitura e o Tab chegam nele cedo); fixo embaixo na tela.
    document.body.insertBefore(banner, document.body.firstChild);
    if (document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.add('ausculto-consent-open');
    }
  }

  function hideConsentBanner() {
    if (!document.getElementById) return;
    var banner = document.getElementById(BANNER_ID);
    if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    if (document.documentElement && document.documentElement.classList) {
      document.documentElement.classList.remove('ausculto-consent-open');
    }
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
    sendGa4(eventName, eventParams, id);
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
      if (!mergeAppAttribution(link)) prepareStoreLink(link);
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

    var reopen = target.closest('[data-consent-open]');
    if (reopen && window.auscultoConsent && window.auscultoConsent.open) {
      if (event.preventDefault) event.preventDefault();
      window.auscultoConsent.open();
      return;
    }

    var link = target.closest('a[href]');
    if (link) {
      // Lojas: o link ganha a origem da campanha antes de o navegador segui-lo
      // e o clique vira `store_click` (nunca conversao: instalar e outra coisa).
      var store = prepareStoreLink(link);
      if (store || isAppStoreLink(link)) {
        if (isAppStoreLink(link)) handleAppStoreClick();
        window.auscultoTrack('store_click', {
          store: store || 'app_store',
          cta: cleanText(link.textContent) || link.getAttribute('aria-label') || '',
          cta_position: link.getAttribute('data-cta-position') || '',
        });
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

  // Primeiro o dado tecnico first-party; depois, e so com aceite, terceiros.
  persistCampaignParams();
  prepareAttributionCookies();
  function onReady() {
    prepareAppLinks();
    showConsentBanner(false);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady, { once: true });
  } else {
    onReady();
  }
  window.addEventListener('pageshow', prepareAppLinks);
  initMetaPixel();
  initGa4();
  sendBootPageView();
})();
