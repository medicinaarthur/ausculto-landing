import { initializeApp, getApp } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, OAuthProvider, signOut } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import { getFunctions, httpsCallable } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-functions.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js';

const messages = {
  'auth/invalid-credential': 'E-mail ou senha incorretos. Confira os dados ou recupere sua senha.',
  'auth/email-already-in-use': 'Este e-mail já tem uma conta. Entre com sua senha ou com o provedor usado no cadastro.',
  'auth/account-exists-with-different-credential': 'Este e-mail já usa outra forma de acesso. Entre pelo método utilizado no cadastro.',
  'auth/weak-password': 'Escolha uma senha com pelo menos 6 caracteres.',
  'auth/invalid-email': 'Confira o endereço de e-mail.',
  'auth/popup-blocked': 'Seu navegador bloqueou a janela de acesso. Permita pop-ups para esta página e tente novamente.',
  'auth/popup-closed-by-user': 'A janela de acesso foi fechada. Você pode tentar novamente.',
  'auth/cancelled-popup-request': 'Uma janela de acesso já está aberta.',
  'auth/network-request-failed': 'A conexão falhou. Confira sua rede e tente novamente.',
  'auth/too-many-requests': 'Muitas tentativas seguidas. Aguarde alguns minutos e tente novamente.',
  'auth/user-disabled': 'Esta conta está desabilitada. Escreva para suporte@auscultoapp.com.',
  'functions/resource-exhausted': 'Você já solicitou vários links. Aguarde alguns minutos para renovar.',
  'functions/unavailable': 'O PDF está temporariamente indisponível. Tente novamente em alguns instantes.',
  'functions/unauthenticated': 'Não foi possível validar o acesso. Entre novamente e tente mais uma vez.',
  'functions/permission-denied': 'Não foi possível autorizar esta conta. Escreva para suporte@auscultoapp.com.',
  'functions/failed-precondition': 'Conclua seu cadastro para baixar o PDF.',
  'functions/invalid-argument': 'Os dados enviados não foram aceitos. Confira as informações e tente novamente.',
  'functions/internal': 'O serviço encontrou um erro temporário. Tente novamente em alguns instantes.',
  'app-check/unavailable': 'A verificação de segurança não respondeu. Confira sua conexão e tente novamente.',
};

export async function startAccount(panel) {
  const response = await fetch('/assets/academy/account-config.json');
  if (!response.ok) throw new Error('Account configuration unavailable');
  const config = await response.json();
  let app;
  try { app = getApp('academy'); } catch { app = initializeApp(config.firebase, 'academy'); }
  initializeAppCheck(app, { provider: new ReCaptchaV3Provider(config.recaptchaSiteKey), isTokenAutoRefreshEnabled: true });
  const auth = getAuth(app);
  auth.languageCode = 'pt-BR';
  await setPersistence(auth, browserLocalPersistence);
  const functions = getFunctions(app, config.functionsRegion);
  const complete = httpsCallable(functions, 'completeAcademySignup');
  const prepare = httpsCallable(functions, 'prepareAcademyFreeDownload');
  const byId = id => panel.querySelector('#' + id);
  const form = byId('account-form'), status = byId('account-status');
  const controls = byId('account-controls'), ready = byId('account-ready');
  let mode = 'login', busy = false, expiryTimer;
  function setBusy(value) {
    busy = value;
    panel.setAttribute('aria-busy', String(value));
    panel.querySelectorAll('button:not([data-account-close])').forEach(button => { button.disabled = value; });
  }
  function clearDownload() {
    clearTimeout(expiryTimer);
    byId('account-file').hidden = true;
    byId('account-file').removeAttribute('href');
    byId('account-expiry').textContent = '';
    byId('account-download').hidden = false;
  }
  function setMode(next) {
    mode = next;
    controls.hidden = false;
    ready.hidden = true;
    const profile = next !== 'login';
    panel.querySelectorAll('[data-signup-fields]').forEach(fieldset => { fieldset.hidden = !profile; fieldset.disabled = !profile; });
    panel.querySelectorAll('[data-account-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.accountMode === next)));
    panel.querySelector('.account-modes').hidden = next === 'profile';
    panel.querySelector('[data-credentials]').hidden = next === 'profile';
    form.elements.email.disabled = next === 'profile';
    form.elements.password.disabled = next === 'profile';
    form.elements.password.autocomplete = next === 'signup' ? 'new-password' : 'current-password';
    panel.querySelector('.account-providers').hidden = next === 'profile';
    byId('account-reset').hidden = next !== 'login';
    byId('account-submit').textContent = next === 'profile' ? 'Concluir cadastro' : next === 'signup' ? 'Criar minha conta' : 'Entrar';
    byId('account-title').textContent = next === 'profile' ? 'Complete seu cadastro.' : next === 'signup' ? 'Crie sua conta gratuita.' : panel.dataset.intent === 'download' ? 'Crie sua conta gratuita.' : 'Entre na sua conta.';
  }
  function error(error) {
    status.textContent = messages[error.code] || 'Não foi possível concluir agora. Tente novamente; sua conta não precisa ser recriada.';
    byId('account-retry').hidden = !auth.currentUser;
  }
  async function finishProfile(input = {}) {
    const user = auth.currentUser;
    if (!user) return;
    byId('account-logout').hidden = false;
    try {
      await complete(input);
      if (auth.currentUser?.uid !== user.uid) return;
      controls.hidden = true;
      ready.hidden = false;
      byId('account-title').textContent = 'Seu PDF está pronto.';
      byId('account-identity').textContent = user.email;
      byId('account-retry').hidden = true;
      status.textContent = 'Conta pronta. Agora é só gerar seu PDF.';
    } catch (problem) {
      if (problem.code === 'functions/invalid-argument') {
        setMode('profile');
        form.elements.name.value ||= user.displayName || '';
        status.textContent = 'Escolha seu perfil e aceite os termos para liberar o PDF.';
      } else error(problem);
    }
  }
  panel.querySelectorAll('[data-account-mode]').forEach(button => button.addEventListener('click', () => { setMode(button.dataset.accountMode); status.textContent = ''; }));
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    const input = { name: form.elements.name.value.trim(), role: form.elements.role.value, acceptedTerms: form.elements.terms.checked, marketingConsent: form.elements.marketing.checked };
    setBusy(true);
    status.textContent = 'Validando seu acesso…';
    try {
      if (mode === 'signup') await createUserWithEmailAndPassword(auth, form.elements.email.value.trim(), form.elements.password.value);
      else if (mode === 'login') await signInWithEmailAndPassword(auth, form.elements.email.value.trim(), form.elements.password.value);
      form.elements.password.value = '';
      await finishProfile(input);
    } catch (problem) { error(problem); }
    finally { setBusy(false); }
  });
  panel.querySelectorAll('[data-account-provider]').forEach(button => button.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    status.textContent = 'Continue na janela de acesso…';
    try {
      const provider = button.dataset.accountProvider === 'google' ? new GoogleAuthProvider() : new OAuthProvider('apple.com');
      provider.addScope('email');
      if (button.dataset.accountProvider === 'apple') provider.addScope('name');
      await signInWithPopup(auth, provider);
      await finishProfile();
    } catch (problem) { error(problem); }
    finally { setBusy(false); }
  }));
  byId('account-reset').addEventListener('click', async () => {
    if (!form.elements.email.reportValidity() || busy) return;
    setBusy(true);
    try {
      await httpsCallable(functions, 'requestPasswordReset')({ email: form.elements.email.value.trim() });
      status.textContent = 'Se houver uma conta com este e-mail, você receberá as instruções de recuperação.';
    } catch (problem) { error(problem); }
    finally { setBusy(false); }
  });
  byId('account-download').addEventListener('click', async () => {
    if (busy) return;
    clearDownload();
    setBusy(true);
    const uid = auth.currentUser?.uid;
    status.textContent = 'Preparando seu PDF…';
    try {
      const {data} = await prepare({ materialId: config.materialId });
      if (!uid || auth.currentUser?.uid !== uid) return;
      const url = new URL(data.url);
      if (url.protocol !== 'https:' || url.hostname !== 'storage.googleapis.com' || data.materialId !== config.materialId || data.expiresAt <= Date.now()) throw new Error('Invalid download response');
      const link = byId('account-file');
      link.href = data.url;
      link.download = data.fileName;
      link.hidden = false;
      byId('account-download').hidden = true;
      byId('account-expiry').textContent = 'O link vale por 5 minutos. Se vencer, você pode gerar outro.';
      status.textContent = 'PDF pronto para baixar.';
      link.focus();
      expiryTimer = setTimeout(() => { clearDownload(); byId('account-download').textContent = 'Gerar outro link'; status.textContent = 'O link venceu. Gere outro para continuar.'; }, data.expiresAt - Date.now());
    } catch (problem) {
      if (problem.code === 'functions/failed-precondition') {
        status.textContent = messages[problem.code];
        await finishProfile();
      } else error(problem);
    }
    finally { setBusy(false); }
  });
  byId('account-logout').addEventListener('click', async () => { setBusy(true); try { await signOut(auth); clearDownload(); setMode('login'); status.textContent = 'Você saiu da sua conta.'; byId('account-logout').hidden = true; } catch (problem) { error(problem); } finally { setBusy(false); } });
  byId('account-retry').addEventListener('click', async () => { if (!busy && auth.currentUser) { setBusy(true); await finishProfile(); setBusy(false); } });
  onAuthStateChanged(auth, async user => {
    clearDownload();
    if (busy) return;
    if (user) { setBusy(true); await finishProfile(); setBusy(false); }
    else { setMode(panel.dataset.intent === 'download' ? 'signup' : 'login'); byId('account-logout').hidden = true; status.textContent = panel.dataset.intent === 'download' ? 'Crie a conta para liberar o PDF. Não exige PRO.' : 'Use a mesma conta do aplicativo.'; }
  });
}
