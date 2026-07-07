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

  function marketingAllowed() {
    return config.enabled !== false && !blocksMarketingSignals();
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
    if (fbclid) {
      setCookie('_fbc', 'fb.1.' + unixTime() + '.' + fbclid, 90);
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
    if (!hasIncomingAttribution) return url;

    var landingMedium = cleanText(url.searchParams.get('utm_medium'));
    var landingContent = cleanText(url.searchParams.get('utm_content'));
    var landingCampaign = cleanText(url.searchParams.get('utm_campaign'));
    if (landingMedium) url.searchParams.set('landing_cta', landingMedium);
    if (landingContent) url.searchParams.set('landing_content', landingContent);
    if (landingCampaign) url.searchParams.set('landing_campaign', landingCampaign);

    Object.keys(incoming).forEach(function (key) {
      url.searchParams.set(key, incoming[key]);
    });

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

  function normalizeParams(params) {
    var out = {
      page_title: document.title,
      page_path: window.location.pathname,
      source_url: window.location.href,
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
      event_source_url: window.location.href,
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
      event_source: 'landing_v14',
    }, eventParams));

    sendPixel(eventName, eventParams, id);
    sendCapi(eventName, eventParams, id);
    debug('[Ausculto Meta] Event', eventName, id, eventParams);
    return id;
  };

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

    if (medium === 'pricing' && content === 'pro') {
      return {
        eventName: 'InitiateCheckout',
        params: {
          content_name: 'pro_plan',
          content_category: 'subscription',
          currency: 'BRL',
          cta: label,
          destination: url.href,
          plan_period: url.searchParams.get('utm_term') || 'annual',
        },
      };
    }

    return {
      eventName: 'Lead',
      params: {
        content_name: content === 'free' ? 'free_plan' : 'web_app',
        content_category: medium === 'pricing' ? 'pricing' : 'landing_to_app',
        cta: label,
        destination: url.href,
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
  var APP_STORE_BRIDGE_ENDPOINT = '/_bridge/appstore-click';

  function isAppStoreLink(link) {
    if (link.getAttribute('data-event') === 'app_store_click') return true;
    var href = link.getAttribute('href') || '';
    return /apps\.apple\.com|itunes\.apple\.com/i.test(href);
  }

  function appStoreBridgePayload() {
    var params = currentMarketingParams();
    return {
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
        navigator.sendBeacon(APP_STORE_BRIDGE_ENDPOINT, body);
      } else {
        window.fetch(APP_STORE_BRIDGE_ENDPOINT, {
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

  document.addEventListener('click', function (event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    if (isAppStoreLink(link)) {
      handleAppStoreClick();
      return;
    }
    mergeAppAttribution(link);
    var tracked = classifyLandingLink(link);
    if (tracked) window.auscultoTrack(tracked.eventName, tracked.params);
  }, true);

  prepareAttributionCookies();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prepareAppLinks, { once: true });
  } else {
    prepareAppLinks();
  }
  window.addEventListener('pageshow', prepareAppLinks);
  initMetaPixel();
  window.auscultoTrack('PageView', {
    content_name: 'landing_v14',
    content_category: 'page_view',
  });
})();
