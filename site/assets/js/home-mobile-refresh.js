/* Progressive enhancement: the original five metrics remain natively scrollable. */
(() => {
  const root = document.querySelector('.metric-ticker');
  if (!root) return;
  const viewport = root.querySelector('.metric-ticker__viewport');
  const track = root.querySelector('.metric-ticker__track');
  const list = root.querySelector('.metric-ticker__items');
  const toggle = root.querySelector('button');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 1023px)');
  let animation, copy, paused = false, visible = false, hover = false, focused = false;
  function sync() {
    if (!animation) return;
    const stop = paused || !visible || hover || focused || document.hidden;
    stop ? animation.pause() : animation.play();
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.setAttribute('aria-label', paused ? 'Retomar indicadores' : 'Pausar indicadores');
    toggle.querySelector('path').setAttribute('d', paused ? 'M8 5l10 7-10 7Z' : 'M9 6v12M15 6v12');
  }
  function setup() {
    const progress = animation ? (Number(animation.currentTime) || 0) : 0;
    animation?.cancel(); animation = null; copy?.remove(); copy = null;
    viewport.classList.remove('is-animated'); toggle.hidden = true;
    if (reduced.matches || !mobile.matches || !track.animate) return;
    copy = list.cloneNode(true); copy.setAttribute('aria-hidden', 'true');
    copy.removeAttribute('aria-label'); track.append(copy);
    viewport.classList.add('is-animated');
    const distance = list.getBoundingClientRect().width;
    if (!distance) return;
    animation = track.animate([{transform:'translateX(0)'},{transform:`translateX(-${distance}px)`}], {duration:distance / 24 * 1000, iterations:Infinity, easing:'linear'});
    animation.currentTime = progress;
    toggle.hidden = false; sync();
  }
  function pauseManually() {
    if (!animation || paused) return;
    const width = list.getBoundingClientRect().width;
    const offset = ((Number(animation.currentTime) || 0) * 24 / 1000) % width;
    paused = true; animation.pause(); animation.currentTime = 0;
    viewport.scrollLeft += offset; sync();
  }
  toggle.addEventListener('click', () => {
    if (!paused) pauseManually();
    else {
      if (animation) animation.currentTime = viewport.scrollLeft / 24 * 1000;
      viewport.scrollLeft = 0; paused = false; sync();
    }
  });
  viewport.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') { hover = true; sync(); } });
  viewport.addEventListener('pointerleave', () => { hover = false; sync(); });
  viewport.addEventListener('pointerdown', pauseManually);
  viewport.addEventListener('focusin', () => { focused = true; sync(); });
  viewport.addEventListener('focusout', () => { focused = false; sync(); });
  viewport.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault(); pauseManually();
      viewport.scrollBy({left:e.key === 'ArrowRight' ? 160 : -160, behavior:'auto'});
    }
  });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(root);
  reduced.addEventListener('change', setup); mobile.addEventListener('change', setup);
  new ResizeObserver(setup).observe(list);
  document.fonts.ready.then(setup);
})();
