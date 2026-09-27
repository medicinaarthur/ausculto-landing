/* Progressive enhancement: content and all catalogue links remain available without JS. */
(() => {
  const SAFE_UTM_KEYS = new Set([
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]);
  function preserveSafeUtm() {
    const incoming = new URLSearchParams(location.search);
    for (const a of document.querySelectorAll("a[href]")) {
      const url = new URL(a.href, location.href);
      if (
        ![
          location.origin,
          "https://app.auscultoapp.com",
          "https://www.auscultoapp.com",
          "https://enamed.auscultoapp.com",
        ].includes(url.origin)
      )
        continue;
      for (const [key, value] of incoming)
        if (
          SAFE_UTM_KEYS.has(key) &&
          value.length <= 160 &&
          /^[\p{L}\p{N}_. ~-]+$/u.test(value)
        )
          url.searchParams.set(key, value);
      a.href = url.href;
    }
  }
  preserveSafeUtm();
  // Top bar: navy glass once the page scrolls, gold underline on the section in view, menu sheet on small screens.
  const bar = document.querySelector('[data-atb]');
  if (bar) {
    const root = document.documentElement;
    const syncOffset = () => root.style.setProperty('--atb-offset', `${bar.offsetHeight}px`);
    if ('ResizeObserver' in window) {
      let lastHeight;
      new ResizeObserver(entries => {
        const entry = entries[0];
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height;
        if (height !== lastHeight) {
          lastHeight = height;
          root.style.setProperty('--atb-offset', `${height}px`);
        }
      }).observe(bar);
    } else {
      requestAnimationFrame(syncOffset);
      addEventListener('resize', syncOffset, { passive: true });
    }
    let queued = false;
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => { bar.classList.toggle('is-scrolled', window.scrollY > 8); queued = false; });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    const menu = bar.querySelector('.atb__menu');
    if (menu) {
      const summary = menu.querySelector('summary');
      const background = [...document.querySelectorAll('body > main, body > footer, body > .sticky-cta')];
      const priorInert = new Map();
      menu.addEventListener('toggle', () => {
        bar.classList.toggle('is-menu-open', menu.open);
        root.classList.toggle('atb-lock', menu.open);
        summary.setAttribute('aria-label', menu.open ? 'Fechar menu' : 'Abrir menu');
        summary.setAttribute('aria-expanded', String(menu.open));
        if (menu.open) background.forEach(node => { priorInert.set(node, node.inert); node.inert = true; });
        else { background.forEach(node => { node.inert = priorInert.get(node) || false; }); priorInert.clear(); }
      });
      document.addEventListener('keydown', event => {
        if (!menu.open) return;
        if (event.key === 'Escape') { menu.open = false; summary.focus(); }
        if (event.key === 'Tab') {
          const focusable = [summary, ...menu.querySelectorAll('.atb__sheet a, .atb__sheet button')];
          const index = focusable.indexOf(document.activeElement);
          if (event.shiftKey && index <= 0) { event.preventDefault(); focusable.at(-1).focus(); }
          else if (!event.shiftKey && index === focusable.length - 1) { event.preventDefault(); summary.focus(); }
        }
      });
      menu.querySelectorAll('.atb__sheet a, .atb__sheet button').forEach(el => el.addEventListener('click', () => { menu.open = false; }));
      matchMedia('(min-width: 1001px)').addEventListener('change', event => { if (event.matches) menu.open = false; });
    }
    const links = [...bar.querySelectorAll('.atb__nav a')].filter(a => a.hash && a.pathname === location.pathname);
    const targets = links.map(a => document.getElementById(a.hash.slice(1))).filter(Boolean);
    if (targets.length && 'IntersectionObserver' in window) {
      // A section is "current" while it crosses a thin band just above the middle of the viewport.
      const inView = new Set();
      const spy = new IntersectionObserver(entries => {
        entries.forEach(entry => { if (entry.isIntersecting) inView.add(entry.target.id); else inView.delete(entry.target.id); });
        const current = targets.filter(t => inView.has(t.id)).pop()?.id;
        links.forEach(a => a.classList.toggle('is-active', a.hash.slice(1) === current));
      }, { rootMargin: '-38% 0px -58% 0px' });
      targets.forEach(t => spy.observe(t));
    }
  }
  // Mobile: sticky CTA once the hero leaves the viewport (hidden while a dialog is open or the footer is visible).
  const sticky = document.querySelector('[data-sticky-cta]');
  const heroBlock = document.querySelector('.academy-hero');
  if (sticky && heroBlock && 'IntersectionObserver' in window) {
    let heroOut = false, footerIn = false;
    let update = () => sticky.classList.toggle('is-visible', heroOut && !footerIn && !document.querySelector('dialog[open]'));
    new IntersectionObserver(entries => { heroOut = !entries[0].isIntersecting; update(); }).observe(heroBlock);
    const footer = document.querySelector('.academy-footer');
    if (footer) new IntersectionObserver(entries => { footerIn = entries[0].isIntersecting; update(); }).observe(footer);
    const proBand = document.querySelector('.pro');
    let proIn = false;
    if (proBand) new IntersectionObserver(entries => { proIn = entries[0].isIntersecting; update(); }).observe(proBand);
    let downloadIn = false;
    const download = document.querySelector('.download-action');
    if (download) new IntersectionObserver(entries => { downloadIn = entries[0].isIntersecting; update(); }).observe(download);
    update = () => { const on = heroOut && !footerIn && !proIn && !downloadIn && !document.querySelector('dialog[open], .atb__menu[open]'); sticky.classList.toggle('is-visible', on); document.body.classList.toggle('has-sticky', on); };
    new MutationObserver(update).observe(document.body, { attributes: true, attributeFilter: ['open'], subtree: true });
  }
  // Mobile rails: dots follow the snapped card.
  document.querySelectorAll('[data-rail]').forEach(rail => {
    const dots = rail.parentElement.querySelector('[data-rail-dots]');
    if (!dots || !('IntersectionObserver' in window)) return;
    const cards = [...rail.children];
    dots.innerHTML = cards.map(() => '<i></i>').join('') + '<b></b>';
    const counter = dots.querySelector('b');
    const set = index => { [...dots.querySelectorAll('i')].forEach((dot, i) => dot.classList.toggle('is-active', i === index)); counter.textContent = `${index + 1} / ${cards.length}`; };
    set(0);
    const io = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) set(cards.indexOf(entry.target)); }), { root: rail, threshold: 0.6 });
    cards.forEach(card => io.observe(card));
    if (!rail.classList.contains('resource-grid')) return;
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const narrow = matchMedia('(max-width:1000px)');
    let timer = null, visible = false;
    const stop = () => { clearTimeout(timer); timer = null; };
    const schedule = () => {
      stop();
      if (!visible || !narrow.matches || document.hidden || document.querySelector("dialog[open]")) return;
      timer = setTimeout(() => {
        const width = rail.clientWidth;
        if (rail.scrollWidth <= width + 5) return;
        const current = cards.reduce((best, card, i) => Math.abs(card.offsetLeft - rail.offsetLeft - rail.scrollLeft) < Math.abs(cards[best].offsetLeft - rail.offsetLeft - rail.scrollLeft) ? i : best, 0);
        const next = cards[(current + 1) % cards.length];
        rail.scrollTo({ left: next.offsetLeft - cards[0].offsetLeft, behavior: motion.matches ? 'instant' : 'smooth' });
        schedule();
      }, 9000);
    };
    rail.addEventListener("pointerdown", schedule, { passive: true });
    rail.addEventListener("keydown", schedule);
    rail.addEventListener("wheel", schedule, { passive: true });
    new IntersectionObserver(entries => { visible = entries[0].intersectionRatio >= .55; schedule(); }, { threshold: [.55] }).observe(rail);
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', schedule); narrow.addEventListener('change', schedule);
  });
  document.querySelectorAll('[role="tablist"]:not([data-dossier-tabs])').forEach((group) => {
    const tabs = [...group.querySelectorAll('[role="tab"]')];
    function selectTab(tab) {
      for (const t of tabs) {
        const selected = t === tab;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden =
          !selected;
      }
    }
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (event) => {
        let next;
        if (["ArrowRight", "ArrowDown"].includes(event.key))
          next = (i + 1) % tabs.length;
        if (["ArrowLeft", "ArrowUp"].includes(event.key))
          next = (i + tabs.length - 1) % tabs.length;
        if (event.key === "Home") next = 0;
        if (event.key === "End") next = tabs.length - 1;
        if (next !== undefined) {
          event.preventDefault();
          selectTab(tabs[next]);
          tabs[next].focus();
        }
      });
    });
  });
})();
