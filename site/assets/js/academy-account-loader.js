(() => {
  const panel = document.getElementById('academy-account');
  if (!panel) return;
  let opener, modulePromise;
  async function load() {
    const status = document.getElementById('account-status');
    status.textContent = 'Carregando acesso seguro…';
    try {
      modulePromise ||= import('./academy-account.js').then(module => module.startAccount(panel));
      await modulePromise;
    } catch {
      modulePromise = null;
      status.textContent = 'Não foi possível carregar o acesso. Confira sua conexão e tente novamente.';
      document.getElementById('account-retry').hidden = false;
    }
  }
  document.querySelectorAll('[data-account-open]').forEach(button => button.addEventListener('click', () => {
    opener = button;
    // One dialog serves the header login and the free-PDF button; the copy follows the trigger.
    const wantsDownload = !!(button.closest('.enamed-download') || button.hasAttribute('data-sticky-cta'));
    panel.dataset.intent = wantsDownload ? 'download' : 'login';
    const title = panel.querySelector('[data-account-title]');
    const intro = panel.querySelector('[data-account-intro]');
    if (title && intro) {
      title.textContent = wantsDownload ? 'Crie sua conta gratuita.' : 'Entre na sua conta.';
      intro.textContent = wantsDownload
        ? 'Para baixar o ENAMED 2026 Comentado: 124 páginas, 100 questões e 400 alternativas comentadas. Não exige PRO.'
        : 'É a mesma conta do aplicativo Ausculto.';
    }
    panel.showModal();
    panel.querySelector('[data-account-close]').focus();
    if (!modulePromise) load();
  }));
  panel.querySelector('[data-account-close]').addEventListener('click', () => panel.close());
  panel.addEventListener('click', event => { if (event.target === panel) { const r = panel.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) panel.close(); } });
  panel.addEventListener('close', () => opener?.focus());
  document.getElementById('account-retry').addEventListener('click', () => { if (!modulePromise) load(); });
})();
