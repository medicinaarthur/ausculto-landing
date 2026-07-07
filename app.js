/* ══════════════════════════════════════════════════════════════
   Ausculto Landing — Vanilla JS (no build, no deps)
   ══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* --- GTM / dataLayer hook --- */
  window.dataLayer = window.dataLayer || [];

  function trackCTA(ctaName, location) {
    var payload = { event: 'cta_click', cta: ctaName, location: location };
    window.dataLayer.push(payload);
    /* Debug log — remove in production or gate behind flag */
    if (location) {
      console.log('[Ausculto CTA]', payload);
    }
  }

  /* --- CTA click tracking via data-attributes --- */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-cta]');
    if (el) {
      trackCTA(el.getAttribute('data-cta'), el.getAttribute('data-location') || 'unknown');
    }
  });

  /* --- Sticky header shadow --- */
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('header--scrolled', window.scrollY > 10);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* --- Mobile menu toggle --- */
  var menuBtn = document.querySelector('.header__menu');
  var nav = document.querySelector('.header__nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(isOpen));
    });
    /* Close menu on nav link click */
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* --- Persona tab switcher --- */
  var tabs = document.querySelectorAll('.persona__tab');
  function activatePersonaTab(tab) {
    if (!tab) return;
    /* Deactivate all */
    tabs.forEach(function (t) {
      t.classList.remove('persona__tab--active');
      t.setAttribute('aria-selected', 'false');
    });
    /* Activate clicked */
    tab.classList.add('persona__tab--active');
    tab.setAttribute('aria-selected', 'true');

    /* Show/hide panels */
    var targetId = tab.getAttribute('aria-controls');
    document.querySelectorAll('.persona__panel').forEach(function (panel) {
      if (panel.id === targetId) {
        panel.hidden = false;
        panel.classList.add('persona__panel--active');
      } else {
        panel.hidden = true;
        panel.classList.remove('persona__panel--active');
      }
    });
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      activatePersonaTab(tab);
      trackCTA('persona_switch', tab.getAttribute('data-persona'));
    });
  });

  /* --- Scroll animations (IntersectionObserver) --- */
  var fadeEls = document.querySelectorAll('.fade-up');
  if ('IntersectionObserver' in window && fadeEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(function (el) { observer.observe(el); });
  } else {
    /* Fallback: show everything */
    fadeEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* --- Stats counter animation --- */
  var statCounters = document.querySelectorAll('.stat__num[data-target]');
  function animateCounter(el) {
    var target = parseInt(el.getAttribute('data-target') || '0', 10);
    if (!target || target < 1) return;
    var duration = 1200;
    var start = null;
    var hasPlus = true;

    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var value = Math.floor(progress * target);
      el.textContent = String(value) + (hasPlus ? '+' : '');
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = String(target) + (hasPlus ? '+' : '');
      }
    }
    window.requestAnimationFrame(step);
  }

  if ('IntersectionObserver' in window && statCounters.length) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    statCounters.forEach(function (el) { counterObserver.observe(el); });
  } else {
    statCounters.forEach(function (el) {
      var finalValue = parseInt(el.getAttribute('data-target') || '0', 10);
      if (finalValue > 0) el.textContent = String(finalValue) + '+';
    });
  }

  /* --- Email form handler (placeholder) --- */
  var emailForm = document.querySelector('.email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = emailForm.querySelector('input[type="email"]').value;
      if (email) {
        trackCTA('waitlist_submit', 'cta-final');
        /* TODO: integrate with backend/Mailchimp/Firebase */
        console.log('[Ausculto Waitlist] Email captured:', email);
        var btn = emailForm.querySelector('button');
        var originalText = btn.textContent;
        btn.textContent = 'Cadastrado!';
        btn.disabled = true;
        emailForm.querySelector('input').disabled = true;
        setTimeout(function () {
          btn.textContent = originalText;
          btn.disabled = false;
          emailForm.querySelector('input').disabled = false;
          emailForm.querySelector('input').value = '';
        }, 3000);
      }
    });
  }

  /* --- Smooth scroll for anchor links (polyfill for older browsers) --- */
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var targetId = this.getAttribute('href');
      if (targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        /* Update URL without jumping */
        if (history.pushState) {
          history.pushState(null, '', targetId);
        }
      }
    });
  });

})();
