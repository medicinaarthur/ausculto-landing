(() => {
  const shelf = document.querySelector('[data-bookshelf]');
  const compactShelf = matchMedia('(max-width:600px)');
  const bookControllers = new Map();
  let selectedBook = 0;
  function selectBook(index, animate = true) {
    if (!shelf) return;
    selectedBook = index;
    shelf.classList.toggle('is-reading-stack', compactShelf.matches);
    shelf.querySelectorAll('[data-shelf-item]').forEach((item, i) => {
      const button = item.querySelector('[data-book]');
      item.classList.toggle('is-selected', i === index);
      item.querySelector('.library-copy').hidden = false;
      if (animate && compactShelf.matches) bookControllers.get(button)?.(i === index);
    });
  }
  document.querySelectorAll('[data-book]').forEach(button => {
    const frames = [...button.querySelectorAll('img')];
    const name = button.dataset.bookName || 'material';
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const hover = matchMedia('(hover: hover) and (pointer: fine)');
    let open = false, generation = 0;
    const show = index => frames.forEach((frame, i) => frame.classList.toggle('is-active', i === index));
    const label = value => {
      button.setAttribute('aria-pressed', String(value));
      button.setAttribute('aria-label', `${value ? 'Fechar' : 'Abrir'} o tema ${name}`);
    };
    async function setOpen(value) {
      const current = ++generation;
      open = value;
      label(value);
      if (!value) {
        if (reduced.matches) { show(0); return; }
        show(1);
        await new Promise(resolve => setTimeout(resolve, 145));
        if (current === generation) show(0);
        return;
      }
      try {
        await Promise.all(frames.slice(1).map(img => img.decode()));
        if (current !== generation) return;
        if (!reduced.matches) { show(1); await new Promise(resolve => setTimeout(resolve, 150)); }
        if (current === generation) show(2);
      } catch { if (current === generation) { open = false; show(0); label(false); } }
    }
    bookControllers.set(button, setOpen);
    button.addEventListener('pointerenter', event => { if (hover.matches && event.pointerType === 'mouse') setOpen(true); });
    button.addEventListener('pointerleave', event => { if (hover.matches && event.pointerType === 'mouse') setOpen(false); });
    button.addEventListener('click', event => {
      const item = button.closest('[data-shelf-item]');
      if (item && compactShelf.matches) { setOpen(!open); return; }
      if (!hover.matches || event.detail === 0 || event.pointerType === 'touch') setOpen(!open);
    });
    button.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } });
  });
  if (shelf) {
    selectBook(0, false);
    compactShelf.addEventListener('change', () => selectBook(selectedBook, false));
  }
  // Reading-experience dialog on the PRO band: opens the three approved captures without leaving the page.
  const reading = document.getElementById('reading-dialog');
  if (reading) {
    let opener;
    document.querySelectorAll('[data-reading-open]').forEach(button => button.addEventListener('click', () => {
      opener = button;
      if (typeof reading.showModal === 'function') reading.showModal(); else { reading.setAttribute('open', ''); reading.scrollIntoView({ block: 'start' }); }
      reading.querySelector('[data-reading-close]')?.focus();
    }));
    const close = () => { if (typeof reading.showModal === 'function') reading.close(); else { reading.removeAttribute('open'); opener?.focus(); } };
    reading.querySelector('[data-reading-close]')?.addEventListener('click', close);
    reading.addEventListener('click', event => { if (event.target === reading) reading.close(); });
    reading.addEventListener('close', () => opener?.focus());
  }
})();
