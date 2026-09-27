/* Academy · questão interativa (mesma réplica da página do app usada na ads-estudante), aberta num <dialog>. */
(function () {
  var dialog = document.getElementById('qdemo');
  var openers = Array.prototype.slice.call(document.querySelectorAll('[data-qdemo-open]'));
  if (!dialog || !openers.length || typeof dialog.showModal !== 'function') return;

  var root = dialog.querySelector('[data-qdemo]');
  var body = dialog.querySelector('.qdemo-body');
  var closeBtn = dialog.querySelector('[data-qdemo-close]');
  var vignette = dialog.querySelector('[data-qdemo-vignette]');
  var grifarBtn = dialog.querySelector('[data-qdemo-grifar]');
  var swatchWrap = dialog.querySelector('.qdemo-swatches');
  var swatches = Array.prototype.slice.call(dialog.querySelectorAll('[data-qdemo-color]'));
  var eraser = dialog.querySelector('[data-qdemo-eraser]');
  var alts = Array.prototype.slice.call(dialog.querySelectorAll('[data-qdemo-alt]'));
  var strips = Array.prototype.slice.call(dialog.querySelectorAll('.qdemo-strip'));
  var actions = dialog.querySelector('[data-qdemo-actions]');
  var editorial = dialog.querySelector('[data-qdemo-editorial]');
  var verifyBtn = dialog.querySelector('[data-qdemo-verify]');
  var redoBtn = dialog.querySelector('[data-qdemo-redo]');
  var cta = dialog.querySelector('[data-qdemo-cta]');
  var panels = Array.prototype.slice.call(dialog.querySelectorAll('[data-qdemo-panel]'));
  var thumbs = Array.prototype.slice.call(dialog.querySelectorAll('[data-qdemo-thumb]'));

  var CORRECT = 'd';
  var reduceMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var phase = 'idle'; /* idle | selected | answered */
  var selected = null;
  var armed = null;
  var barOpen = false;
  var returnFocus = null;

  function scrollBehavior() { return reduceMq.matches ? 'auto' : 'smooth'; }

  function select(btn) {
    if (phase === 'answered' || !btn) return;
    alts.forEach(function (b) { b.classList.remove('is-selected'); b.setAttribute('aria-pressed', 'false'); });
    btn.classList.add('is-selected');
    btn.setAttribute('aria-pressed', 'true');
    selected = btn.getAttribute('data-qdemo-alt');
    phase = 'selected';
    if (verifyBtn) verifyBtn.hidden = false;
  }

  function reset() {
    phase = 'idle';
    selected = null;
    root.classList.remove('is-answered');
    alts.forEach(function (b) {
      b.disabled = false;
      b.classList.remove('is-selected', 'is-correct', 'is-wrong');
      b.setAttribute('aria-pressed', 'false');
      var ic = b.querySelector('.qdemo-alt-ic');
      if (ic) ic.hidden = true;
    });
    strips.forEach(function (s) { s.hidden = true; });
    if (actions) actions.hidden = true;
    thumbs.forEach(function (t) { t.classList.remove('is-active'); t.setAttribute('aria-pressed', 'false'); });
    panels.forEach(function (head) {
      head.parentNode.classList.remove('is-open');
      head.setAttribute('aria-expanded', 'false');
      var panelBody = document.getElementById(head.getAttribute('aria-controls'));
      if (panelBody) { try { panelBody.inert = true; } catch (e) {} }
    });
    if (editorial) { editorial.classList.remove('is-in'); editorial.hidden = true; }
    if (verifyBtn) verifyBtn.hidden = true;
    if (redoBtn) redoBtn.hidden = true;
    if (cta) cta.hidden = true;
  }

  function open(preselect) {
    if (!dialog.open) {
      document.documentElement.classList.add('qdemo-lock');
      dialog.showModal();
      if (body) body.scrollTop = 0;
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }
    if (preselect && phase !== 'answered') {
      select(alts.filter(function (b) { return b.getAttribute('data-qdemo-alt') === preselect; })[0]);
    }
  }

  openers.forEach(function (btn) {
    btn.addEventListener('click', function () { returnFocus = btn; open(btn.getAttribute('data-qdemo-open')); });
  });
  if (closeBtn) closeBtn.addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('click', function (ev) { if (ev.target === dialog) dialog.close(); });
  dialog.addEventListener('close', function () {
    document.documentElement.classList.remove('qdemo-lock');
    setArmed(null);
    if (returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
  });

  /* --- alternativas: idle -> selected -> answered --- */
  alts.forEach(function (btn) { btn.addEventListener('click', function () { select(btn); }); });

  if (verifyBtn) verifyBtn.addEventListener('click', function () {
    if (phase !== 'selected') return;
    phase = 'answered';
    root.classList.add('is-answered');
    alts.forEach(function (b) {
      var key = b.getAttribute('data-qdemo-alt');
      b.disabled = true;
      b.classList.remove('is-selected');
      var ic = b.querySelector('.qdemo-alt-ic');
      if (key === CORRECT) {
        b.classList.add('is-correct');
        if (ic) ic.hidden = false;
      } else if (key === selected) {
        b.classList.add('is-wrong');
        if (ic) ic.hidden = false;
      }
    });
    strips.forEach(function (s) { s.hidden = false; });
    if (actions) actions.hidden = false;
    verifyBtn.hidden = true;
    if (redoBtn) redoBtn.hidden = false;
    if (cta) cta.hidden = false;
    if (editorial) {
      editorial.hidden = false;
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { editorial.classList.add('is-in'); });
      });
      window.setTimeout(function () {
        editorial.scrollIntoView({ behavior: scrollBehavior(), block: 'nearest' });
      }, 340);
    }
  });

  if (redoBtn) redoBtn.addEventListener('click', function () {
    reset();
    if (body) body.scrollTo({ top: 0, behavior: scrollBehavior() });
    var first = alts[0];
    if (first) first.focus({ preventScroll: true });
  });

  /* --- polegares (cosmético, mutuamente exclusivos) --- */
  thumbs.forEach(function (t) {
    t.addEventListener('click', function () {
      var active = t.classList.contains('is-active');
      thumbs.forEach(function (o) { o.classList.remove('is-active'); o.setAttribute('aria-pressed', 'false'); });
      if (!active) { t.classList.add('is-active'); t.setAttribute('aria-pressed', 'true'); }
    });
  });

  /* --- acordeões da explicação editorial --- */
  panels.forEach(function (head) {
    var panel = head.parentNode;
    var panelBody = document.getElementById(head.getAttribute('aria-controls'));
    if (panelBody) { try { panelBody.inert = true; } catch (e) {} }
    head.addEventListener('click', function () {
      var isOpen = panel.classList.toggle('is-open');
      head.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (panelBody) { try { panelBody.inert = !isOpen; } catch (e) {} }
    });
  });

  /* --- grifar: armar cor + selecionar texto no enunciado --- */
  function setArmed(color) {
    armed = color;
    swatches.forEach(function (s) {
      var on = s.getAttribute('data-qdemo-color') === color;
      s.classList.toggle('is-armed', on);
      s.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  if (grifarBtn) grifarBtn.addEventListener('click', function () {
    barOpen = !barOpen;
    grifarBtn.classList.toggle('is-on', barOpen);
    grifarBtn.setAttribute('aria-pressed', barOpen ? 'true' : 'false');
    if (swatchWrap) swatchWrap.hidden = !barOpen;
    if (!barOpen) setArmed(null);
  });
  swatches.forEach(function (s) {
    s.addEventListener('click', function () {
      var c = s.getAttribute('data-qdemo-color');
      setArmed(armed === c ? null : c);
    });
  });

  var applyTimer = null;
  function applyHighlight() {
    if (!armed || !dialog.open || !vignette) return;
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    var range = sel.getRangeAt(0);
    if (!vignette.contains(range.startContainer) || !vignette.contains(range.endContainer)) return;
    var mark = document.createElement('mark');
    mark.className = 'qdemo-hl qdemo-hl-' + armed;
    try {
      range.surroundContents(mark);
    } catch (e) {
      try {
        mark.appendChild(range.extractContents());
        range.insertNode(mark);
      } catch (e2) { return; }
    }
    sel.removeAllRanges();
    if (eraser) eraser.hidden = false;
  }
  document.addEventListener('pointerup', function () {
    if (!armed) return;
    window.setTimeout(applyHighlight, 0);
  });
  document.addEventListener('selectionchange', function () {
    if (!armed) return;
    if (applyTimer) window.clearTimeout(applyTimer);
    applyTimer = window.setTimeout(applyHighlight, 250);
  });
  if (eraser) eraser.addEventListener('click', function () {
    var marks = Array.prototype.slice.call(vignette.querySelectorAll('mark.qdemo-hl'));
    marks.forEach(function (m) {
      while (m.firstChild) m.parentNode.insertBefore(m.firstChild, m);
      m.parentNode.removeChild(m);
    });
    vignette.normalize();
    eraser.hidden = true;
  });
})();
