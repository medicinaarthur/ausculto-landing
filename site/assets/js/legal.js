/* Páginas legais: sombra da barra ao rolar, seção ativa no sumário, botão "voltar ao topo"
   e fechamento do sumário recolhível depois de escolher uma seção. Sem dependências;
   sem JS a página continua completa (sumário, âncoras e rodapé são HTML estático). */
(function (d, w) {
  var root = d.documentElement;
  var bar = d.querySelector('.bar');
  var toTop = d.querySelector('.to-top');
  var fold = d.querySelector('.toc-fold');
  var heads = [].slice.call(d.querySelectorAll('.doc-body > h2[id]'));
  var links = [].slice.call(d.querySelectorAll('.toc__list a[href^="#"], .toc-fold a[href^="#"]'));
  var reduced = !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var current = null;
  var queued = false;

  function update() {
    queued = false;
    var y = w.pageYOffset || root.scrollTop;
    if (bar) bar.classList.toggle('is-scrolled', y > 4);
    if (toTop) toTop.classList.toggle('is-visible', y > w.innerHeight * 0.9);

    var line = (bar ? bar.offsetHeight : 0) + 48;
    var active = null;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i].getBoundingClientRect().top <= line) active = heads[i].id;
      else break;
    }
    // no fim do documento, a última seção fica marcada mesmo que o título não chegue ao topo
    if (heads.length && w.innerHeight + y >= root.scrollHeight - 2) active = heads[heads.length - 1].id;
    if (active === current) return;
    current = active;
    for (var j = 0; j < links.length; j++) {
      if (active && links[j].getAttribute('href') === '#' + active) links[j].setAttribute('aria-current', 'true');
      else links[j].removeAttribute('aria-current');
    }
  }

  function queue() {
    if (queued) return;
    queued = true;
    w.requestAnimationFrame(update);
  }

  w.addEventListener('scroll', queue, { passive: true });
  w.addEventListener('resize', queue);

  // Sumário recolhível: fecha primeiro e só então rola, para o destino não "pular" com a lista recolhendo.
  if (fold) {
    fold.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!a) return;
      var target = d.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (!target) return;
      e.preventDefault();
      fold.open = false;
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      if (w.history && w.history.pushState) w.history.pushState(null, '', a.getAttribute('href'));
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    });
  }

  update();
})(document, window);
