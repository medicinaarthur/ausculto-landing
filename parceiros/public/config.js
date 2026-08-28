// Configuracao publica do portal do parceiro.
//
// Nada aqui e segredo: a config web do Firebase e o site key do reCAPTCHA sao
// valores publicos por natureza (o app web ja os embute no bundle). O que
// protege os dados nao e o segredo desta chave e sim, do lado do servidor,
// assertPartner + as regras do Firestore, que negam leitura direta a tudo.
//
// PASSO MANUAL: preencha recaptchaSiteKey com a chave reCAPTCHA v3 do
// projeto e cadastre parceiros.auscultoapp.com nos dominios permitidos dessa
// chave. Sem isso, o App Check nao emite token e toda callable responde
// failed-precondition.
window.AUSCULTO_PARTNER_CONFIG = {
  firebase: {
    apiKey: "AIzaSyC1H6p7M1rPTL5LmlSlK8Ie9_tOy_e4CD0",
    appId: "1:510161004194:web:d4c7de819ca0426aa019fb",
    messagingSenderId: "510161004194",
    projectId: "auscultoapp",
    authDomain: "auscultoapp.firebaseapp.com",
    storageBucket: "auscultoapp.firebasestorage.app",
  },
  functionsRegion: "us-central1",
  // Site key reCAPTCHA v3 do projeto. Valor publico por natureza: o proprio
  // app web ja o embute no bundle, e o validador de release do repo canonico
  // exige que ele apareca em main.dart.js. O que protege os dados nao e esta
  // chave e sim, no servidor, assertPartner + o default-deny do Firestore.
  recaptchaSiteKey: "6LdcZcgsAAAAAF7zkepCt93xUaV9omYRgjrAgm5E",
};
