// Portal do Embaixador — lógica do cliente.
//
// Tudo aparece a partir de callables com App Check + assertPartner no
// servidor. O cliente não lê Firestore (as regras negam) e nunca envia o
// código do cupom: o servidor o deriva do e-mail autenticado. Não há aqui
// nada que valha a pena adulterar.

import {initializeApp} from
  "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js";
import {
  getAuth,
  isSignInWithEmailLink,
  onAuthStateChanged,
  signInWithEmailLink,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js";

import {drawQr} from "/qr.js";
import {couponBenefitLabel, couponShareText} from "/coupon_ui.js";

const CONFIG = window.AUSCULTO_PARTNER_CONFIG || {};
const EMAIL_KEY = "ausculto_partner_email";

const $ = (id) => document.getElementById(id);

function view(id) {
  for (const v of ["view-gate", "view-finishing", "view-dash"]) {
    $(v).classList.toggle("hidden", v !== id);
  }
}

function say(el, text, kind) {
  el.textContent = text;
  el.className = `note note--${kind}`;
}

const money = (v) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", {style: "currency", currency: "BRL"});
};

const count = (v) => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString("pt-BR") : null;
};

const pct = (v) => (v === null || v === undefined ? null : `${v}%`);

// ── Arranque ────────────────────────────────────────────────────────────
const app = initializeApp(CONFIG.firebase || {});

let appCheckOk = false;
if (CONFIG.recaptchaSiteKey) {
  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(CONFIG.recaptchaSiteKey),
      isTokenAutoRefreshEnabled: true,
    });
    appCheckOk = true;
  } catch (error) {
    console.warn("App Check não ativou", error);
  }
}

const auth = getAuth(app);
const fns = getFunctions(app, CONFIG.functionsRegion || "us-central1");
const call = (name) => httpsCallable(fns, name);

// ── Entrada ─────────────────────────────────────────────────────────────
const form = $("login-form");
const msg = $("login-msg");
const submit = $("login-submit");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("email").value.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    say(msg, "Digite um e-mail válido.", "bad");
    return;
  }

  submit.disabled = true;
  submit.textContent = "Enviando…";
  try {
    await call("partnerRequestLoginLink")({email});
    try {
      localStorage.setItem(EMAIL_KEY, email);
    } catch (error) {
      // Navegação privada pode bloquear; pedimos o e-mail de novo depois.
    }
    // Resposta idêntica para e-mail cadastrado ou não: o portal não serve
    // para descobrir quem é embaixador do programa.
    say(msg, "Se este e-mail estiver no programa, o link chega em " +
      "instantes. Confira também o spam.", "ok");
    form.reset();
  } catch (error) {
    say(msg, "Não conseguimos enviar agora. Tente de novo em alguns " +
      "minutos.", "bad");
    console.error(error);
  } finally {
    submit.disabled = false;
    submit.textContent = "Receber link de acesso";
  }
});

// ── Conclusão do login pelo link ────────────────────────────────────────
async function finishSignIn(email, link) {
  await signInWithEmailLink(auth, email, link);
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch (error) {
    // sem problema
  }
  // Tira os parâmetros da barra de endereços para o link, ainda válido,
  // não ser recompartilhado sem querer.
  window.history.replaceState({}, document.title, "/");
}

async function handleLink() {
  view("view-finishing");
  const href = window.location.href;
  let email = "";
  try {
    email = localStorage.getItem(EMAIL_KEY) || "";
  } catch (error) {
    email = "";
  }

  if (!email) {
    $("finishing-msg").textContent =
      "Confirme o e-mail em que você recebeu este link.";
    $("finishing-extra").classList.remove("hidden");
    $("confirm-submit").addEventListener("click", async () => {
      const typed = $("confirm-email").value.trim().toLowerCase();
      if (!typed) return;
      try {
        await finishSignIn(typed, href);
      } catch (error) {
        say($("finishing-error"),
            "Não foi possível entrar com este link. Peça um novo acesso.",
            "bad");
        $("finishing-error").classList.remove("hidden");
        console.error(error);
      }
    });
    return;
  }

  try {
    await finishSignIn(email, href);
  } catch (error) {
    say($("finishing-error"),
        "Este link expirou ou já foi usado. Peça um novo acesso.", "bad");
    $("finishing-error").classList.remove("hidden");
    console.error(error);
  }
}

// ── Painel ──────────────────────────────────────────────────────────────
function renderIdentity(data) {
  $("who-name").textContent = data.partner?.name || "Embaixador(a)";
  const tier = data.tier?.tier;
  if (!tier) return;
  const medal = $("medal");
  $("medal-label").textContent = tier.label;
  medal.classList.remove("hidden");
  medal.classList.toggle("medal--ouro", tier.id === "ouro");
}

function renderCredential(data) {
  const coupon = data.coupon || {};
  const shareable = coupon.shareable === true;
  const code = data.partner?.code || "";
  const link = shareable ?
    (data.partner?.trackedLink || data.partner?.link || "") : "";
  $("code").textContent = code || "—";
  $("coupon-benefit").textContent = couponBenefitLabel(coupon);
  const url = $("link");
  url.textContent = link || "—";
  url.title = link || "";
  url.dataset.value = link;

  const warning = $("coupon-warning");
  const unavailable = !shareable;
  warning.classList.toggle("hidden", !unavailable);
  warning.textContent = unavailable ?
    `${coupon.message || "Este cupom não está disponível."} ` +
      "O seu histórico continua visível, mas a divulgação está bloqueada." :
    "";
  $("code-copy").classList.toggle("hidden", unavailable);
  $("link-block").classList.toggle("hidden", unavailable);
  $("qr-block").classList.toggle("hidden", unavailable);

  if (link) drawQr($("qr"), link);

  const share = $("share");
  share.classList.add("hidden");
  share.onclick = null;
  const shareText = couponShareText(coupon, code);
  if (navigator.share && link && shareText) {
    share.classList.remove("hidden");
    share.onclick = () => {
      navigator.share({
        title: "Ausculto",
        text: shareText,
        url: link,
      }).catch(() => {});
    };
  }
}

// O funil é o coração do painel. Barras proporcionais mostram onde perde;
// quatro placas de tamanho igual esconderiam exatamente isso.
function renderFunnel(data) {
  const f = data.funnel || {};
  const box = $("funnel");
  box.textContent = "";

  const clicksKnown = f.clicksAvailable === true;
  const stages = [
    {
      key: "clicks",
      name: "Cliques no seu link",
      sub: clicksKnown ? "abriram o seu link" :
        "medição indisponível no momento",
      value: clicksKnown ? Number(f.clicks) || 0 : null,
    },
    {
      key: "signups",
      name: "Cadastros pelo link",
      sub: "chegaram e criaram conta",
      value: Number(f.signupsAttributed) || 0,
      dropFrom: clicksKnown && Number(f.clicks) > 0 ?
        `${f.clickToSignupPct}% dos cliques` : null,
    },
    {
      key: "redemptions",
      name: "Resgates do cupom",
      sub: "digitaram o seu código",
      value: Number(f.redemptions) || 0,
    },
    {
      key: "paid",
      name: "Assinantes PRO",
      sub: "viraram clientes pagos",
      value: Number(f.paidCustomers) || 0,
      paid: true,
      dropFrom: f.signupToPaidPct === null || f.signupToPaidPct === undefined ?
        null : `${f.signupToPaidPct}% de quem você trouxe`,
    },
  ];

  const max = Math.max(1, ...stages.map((s) => s.value || 0));

  for (const stage of stages) {
    if (stage.dropFrom) {
      const drop = document.createElement("p");
      drop.className = "drop";
      drop.textContent = stage.dropFrom;
      box.appendChild(drop);
    }

    const row = document.createElement("div");
    row.className = stage.paid ? "stage stage--paid" : "stage";

    const fill = document.createElement("span");
    fill.className = "stage__fill";
    row.appendChild(fill);

    const label = document.createElement("div");
    label.className = "stage__name";
    label.textContent = stage.name;
    if (stage.sub) {
      const sub = document.createElement("span");
      sub.className = "stage__sub";
      sub.textContent = stage.sub;
      label.appendChild(sub);
    }
    row.appendChild(label);

    const figure = document.createElement("div");
    if (stage.value === null) {
      figure.className = "stage__unknown";
      figure.textContent = "indisponível";
    } else {
      figure.className = "stage__figure tnum";
      figure.textContent = count(stage.value);
    }
    row.appendChild(figure);
    box.appendChild(row);

    // Único momento de movimento do painel: as barras crescem até o valor
    // medido. Conta um estado, não decora. A largura final é estática; o
    // que anima é a escala, que ao repouso vale 1.
    fill.style.width = stage.value === null ?
      "0%" :
      `${Math.max(2, (stage.value / max) * 100)}%`;
    requestAnimationFrame(() => {
      fill.style.transform = "scaleX(1)";
    });
  }

  const range = data.dateRange || {};
  $("range-note").textContent = range.windowDays ?
    `Números dos últimos ${range.windowDays} dias.` : "";
}

function renderMoney(data, statement) {
  const e = data.earnings || {};
  $("m-revenue").textContent = money(e.attributedRevenueBrl);
  $("m-mrr").textContent = money(e.attributedMrrBrl);
  $("m-commission").textContent = money(e.commissionDueBrl);
  $("m-open").textContent = money(statement?.totals?.openBrl || 0);

  const paid = Number(data.funnel?.paidCustomers) || 0;
  $("m-revenue-note").textContent = paid > 0 ?
    `De ${count(paid)} ${paid === 1 ? "assinante" : "assinantes"} que ` +
      "vieram por você." :
    "Ainda não houve assinatura atribuída ao seu código no período.";

  const rate = Number(e.commissionRatePercent) || 0;
  $("commission-note").textContent = rate > 0 ?
    `Comissão de ${rate}% sobre a receita atribuída no período.` :
    "A comissão do programa ainda não está ativa para o seu código. Os " +
    "resultados seguem sendo contados normalmente.";
}

function renderTier(data) {
  const t = data.tier;
  if (!t) return;
  $("tier-now").textContent = t.tier?.label || "—";

  const nomes = {redemptions: "resgates", paidCustomers: "assinantes"};
  const falta = (Array.isArray(t.missing) ? t.missing : [])
      .map((m) => `${m.need} ${nomes[m.metric] || m.metric}`)
      .join(" e ");
  $("tier-gap").textContent = t.nextTier ?
    `faltam ${falta} para ${t.nextTier.label}` :
    "nível máximo alcançado";

  const fill = $("tier-fill");
  const gold = t.nextTier?.id === "ouro" || t.tier?.id === "ouro";
  fill.classList.toggle("track__fill--gold", gold);
  fill.style.width = `${t.progressPct || 0}%`;
  requestAnimationFrame(() => {
    fill.style.transform = "scaleX(1)";
  });

  const rungs = $("rungs");
  rungs.textContent = "";
  for (const entry of t.tiers || []) {
    const chip = document.createElement("span");
    chip.className = "medal";
    // Dourado é dinheiro e código. Um nível alcançado que não seja o Ouro
    // usa azul; só o Ouro é dourado.
    if (entry.reached) {
      chip.classList.add(entry.id === "ouro" ? "medal--ouro" : "medal--on");
    }
    const dot = document.createElement("span");
    dot.className = "medal__dot";
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(entry.label));
    rungs.appendChild(chip);
  }
}

function renderChart(series) {
  const rows = Array.isArray(series) ? series : [];
  if (!rows.length) {
    $("sec-chart").classList.add("hidden");
    return;
  }
  const box = $("chart");
  box.textContent = "";
  const max = Math.max(1, ...rows.map((r) => Number(r.redemptions) || 0));
  rows.forEach((row, i) => {
    const value = Number(row.redemptions) || 0;
    const bar = document.createElement("div");
    bar.className = value > 0 ? "chart__bar" : "chart__bar chart__bar--zero";
    bar.title = `${row.day}: ${value} resgate(s)`;
    bar.style.height = `${Math.max(4, (value / max) * 100)}%`;
    bar.style.transitionDelay = `${Math.min(i * 12, 260)}ms`;
    box.appendChild(bar);
    requestAnimationFrame(() => {
      bar.style.transform = "scaleY(1)";
    });
  });
  const total = rows.reduce((n, r) => n + (Number(r.redemptions) || 0), 0);
  $("chart-note").textContent =
    `${count(total)} resgates nos últimos ${rows.length} dias.`;
}

function renderStatement(statement) {
  const body = $("statement");
  body.textContent = "";
  const rows = statement?.commissions || [];
  if (!rows.length) {
    $("sec-statement").querySelector(".scroller").classList.add("hidden");
    $("statement-empty").textContent =
      "Ainda não há período apurado. Quando houver receita atribuída ao " +
      "seu código, o extrato aparece aqui.";
    return;
  }
  for (const row of rows) {
    const tr = document.createElement("tr");
    const cells = [
      [row.periodKey, ""],
      [money(row.basisRevenueBrl), "num tnum"],
      [`${row.ratePercent}%`, "num tnum"],
      [money(row.amountDueBrl), "num tnum"],
      [null, ""],
    ];
    cells.forEach(([text, cls], i) => {
      const td = document.createElement("td");
      if (cls) td.className = cls;
      if (i === 4) {
        const pill = document.createElement("span");
        pill.className = row.status === "paid" ? "pill pill--paid" : "pill";
        pill.textContent = row.statusLabel;
        td.appendChild(pill);
      } else {
        td.textContent = text;
      }
      tr.appendChild(td);
    });
    body.appendChild(tr);
  }
}

function renderKit(assets) {
  const box = $("kit");
  box.textContent = "";
  const rows = Array.isArray(assets) ? assets : [];
  if (!rows.length) {
    $("kit-empty").textContent =
      "As artes de divulgação chegam por aqui em breve. Enquanto isso, " +
      "chame a gente no Instagram que enviamos.";
    return;
  }
  for (const asset of rows) {
    const item = document.createElement("a");
    item.className = "kit__item";
    item.href = asset.url;
    item.target = "_blank";
    item.rel = "noopener";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "icon");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#i-open");
    svg.appendChild(use);
    item.appendChild(svg);

    const text = document.createElement("div");
    const title = document.createElement("div");
    title.className = "kit__title";
    title.textContent = asset.title;
    text.appendChild(title);
    if (asset.description) {
      const desc = document.createElement("div");
      desc.className = "kit__desc";
      desc.textContent = asset.description;
      text.appendChild(desc);
    }
    item.appendChild(text);
    box.appendChild(item);
  }
}

function renderRules(scope) {
  const box = $("rules");
  box.textContent = "";
  const ordem = ["paidCustomerRule", "attributionRule", "clicksRule",
    "mrrRule", "privacyNote", "historyNote"];
  for (const key of ordem) {
    const text = scope?.[key];
    if (!text) continue;
    const p = document.createElement("p");
    p.className = "rule";
    p.textContent = text;
    box.appendChild(p);
  }
}

async function loadDashboard() {
  view("view-dash");

  if (!appCheckOk) {
    say($("dash-error"), "Configuração de segurança incompleta neste " +
      "endereço. Avise o time do Ausculto: nenhum dado foi carregado.",
    "warn");
    $("dash-error").classList.remove("hidden");
    return;
  }

  let data;
  try {
    data = (await call("partnerGetDashboard")({})).data;
  } catch (error) {
    const negado = error?.code === "functions/permission-denied";
    say($("dash-error"), negado ?
      "Esta conta não tem acesso ao portal de parceiros. Se você acha que " +
        "é engano, fale com a gente." :
      "Não conseguimos carregar seus dados agora. Tente de novo em " +
        "instantes.", "bad");
    $("dash-error").classList.remove("hidden");
    console.error(error);
    return;
  }

  renderIdentity(data);
  renderRules(data.scope);

  if (data.pendingCode) {
    $("pending").classList.remove("hidden");
    $("dash-body").classList.add("hidden");
    return;
  }

  renderCredential(data);
  renderFunnel(data);
  renderTier(data);

  // Complementares: se uma falhar, o painel principal continua de pé.
  const [statement, series, assets] = await Promise.all([
    call("partnerGetStatement")({}).then((r) => r.data).catch(() => null),
    call("partnerGetTimeseries")({days: 30}).then((r) => r.data)
        .catch(() => null),
    call("partnerGetAssets")({}).then((r) => r.data).catch(() => null),
  ]);

  renderMoney(data, statement);
  renderStatement(statement);
  renderChart(series?.series);
  renderKit(assets?.assets);
}

// ── Copiar ──────────────────────────────────────────────────────────────
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const el = $(button.dataset.copy);
  const value = el?.dataset?.value || el?.textContent || "";
  if (!value || value === "—") return;
  try {
    await navigator.clipboard.writeText(value);
    const original = button.innerHTML;
    button.textContent = "Copiado";
    setTimeout(() => {
      button.innerHTML = original;
    }, 1600);
  } catch (error) {
    console.warn("Não foi possível copiar", error);
  }
});

$("logout").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/";
});

// ── Estado ──────────────────────────────────────────────────────────────
const chegouPorLink = isSignInWithEmailLink(auth, window.location.href);
if (chegouPorLink) handleLink();

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadDashboard();
  } else if (!chegouPorLink) {
    view("view-gate");
  }
});
