// Portal do Embaixador — cliente sem acesso direto ao Firestore. Código,
// métricas e extrato sempre são derivados da identidade autenticada no backend.

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

const money = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ?
    number.toLocaleString("pt-BR", {style: "currency", currency: "BRL"}) :
    "—";
};

const count = (value) => {
  if (value === null || value === undefined) return "—";
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("pt-BR") : "—";
};

function view(id) {
  for (const candidate of ["view-gate", "view-finishing", "view-dash"]) {
    $(candidate).classList.toggle("hidden", candidate !== id);
  }
}

function notice(element, text, kind = "bad") {
  element.textContent = text;
  element.className = `notice notice--${kind}`;
}

let toastTimer = null;
function toast(text) {
  const element = $("toast");
  element.textContent = text;
  element.classList.remove("hidden");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element.classList.add("hidden"), 1800);
}

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
const functions = getFunctions(app, CONFIG.functionsRegion || "us-central1");
const call = (name) => httpsCallable(functions, name);

// Entrada por link de e-mail.
const loginForm = $("login-form");
const loginMessage = $("login-msg");
const loginSubmit = $("login-submit");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const email = $("email").value.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    notice(loginMessage, "Digite um e-mail válido.", "bad");
    return;
  }

  loginSubmit.disabled = true;
  loginSubmit.textContent = "Enviando…";
  try {
    await call("partnerRequestLoginLink")({email});
    try {
      localStorage.setItem(EMAIL_KEY, email);
    } catch (_) {
      // O fluxo pede o e-mail novamente se o armazenamento estiver bloqueado.
    }
    notice(loginMessage,
        "Se este e-mail estiver no programa, o link chega em instantes. Confira também o spam.",
        "ok");
    loginForm.reset();
  } catch (error) {
    notice(loginMessage,
        "Não conseguimos enviar o link agora. Aguarde alguns minutos e tente novamente.",
        "bad");
    console.error(error);
  } finally {
    loginSubmit.disabled = false;
    loginSubmit.textContent = "Receber link de acesso";
  }
});

async function finishSignIn(email, link) {
  await signInWithEmailLink(auth, email, link);
  try {
    localStorage.removeItem(EMAIL_KEY);
  } catch (_) {
    // Sem impacto no login concluído.
  }
  window.history.replaceState({}, document.title, "/");
}

async function handleLink() {
  view("view-finishing");
  const href = window.location.href;
  let email = "";
  try {
    email = localStorage.getItem(EMAIL_KEY) || "";
  } catch (_) {
    email = "";
  }

  if (!email) {
    $("finishing-msg").textContent =
      "Confirme o e-mail em que você recebeu este link.";
    $("finishing-extra").classList.remove("hidden");
    $("confirm-submit").addEventListener("click", async () => {
      const typed = $("confirm-email").value.trim().toLowerCase();
      if (!typed || !typed.includes("@")) return;
      try {
        await finishSignIn(typed, href);
      } catch (error) {
        notice($("finishing-error"),
            "Não foi possível entrar com este link. Solicite um novo acesso.",
            "bad");
        console.error(error);
      }
    });
    return;
  }

  try {
    await finishSignIn(email, href);
  } catch (error) {
    notice($("finishing-error"),
        "Este link expirou ou já foi usado. Solicite um novo acesso.", "bad");
    console.error(error);
  }
}

let selectedPeriod = 30;
let currentDashboard = null;
let dashboardRequest = 0;
let activeLink = "";

function setPrimaryError(text, showRetry = true) {
  $("dash-status-text").textContent = text;
  $("retry-dashboard").classList.toggle("hidden", !showRetry);
  $("dash-status").className = "notice notice--bad";
}

function clearPrimaryError() {
  $("dash-status").classList.add("hidden");
}

function setLoading(initial) {
  $("dash-loading").classList.toggle("hidden", !initial);
  $("dash-loading").setAttribute("aria-busy", initial ? "true" : "false");
  document.querySelectorAll("[data-period]").forEach((button) => {
    button.disabled = true;
  });
}

function finishLoading() {
  $("dash-loading").classList.add("hidden");
  $("dash-loading").setAttribute("aria-busy", "false");
  document.querySelectorAll("[data-period]").forEach((button) => {
    button.disabled = false;
  });
}

function renderIdentity(data) {
  $("who-name").textContent = data.partner?.name || "Embaixador(a)";
  const plan = data.compensationPlan || {};
  $("plan-label").textContent = plan.kind === "commission" ?
    `Plano com comissão${plan.ratePercent ? ` · ${plan.ratePercent}%` : ""}` :
    "Benefícios do programa";

  const tier = data.tier?.tier;
  const medal = $("medal");
  medal.classList.toggle("hidden", !tier);
  if (tier) {
    $("medal-label").textContent = tier.label;
    medal.classList.toggle("level-badge--gold", tier.id === "ouro");
  }
}

function resetQr() {
  activeLink = "";
  $("qr-mount").replaceChildren();
  $("qr-panel").classList.add("hidden");
  $("show-qr").textContent = "Gerar QR code";
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("class", "icon");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("aria-hidden", "true");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", "#i-qr");
  icon.appendChild(use);
  $("show-qr").prepend(icon);
}

function renderCredential(data) {
  const coupon = data.coupon || {};
  const shareable = coupon.shareable === true;
  const code = data.partner?.code || "";
  const link = shareable ?
    (data.partner?.trackedLink || data.partner?.link || "") : "";
  $("code").textContent = code || "—";
  $("code").dataset.value = code;
  $("coupon-benefit").textContent = couponBenefitLabel(coupon);
  $("share-summary").textContent = shareable ?
    `${couponBenefitLabel(coupon)} para quem usar o seu código.` :
    "Seu histórico permanece disponível, mas este cupom não pode ser divulgado agora.";

  const linkElement = $("link");
  linkElement.textContent = link || "—";
  linkElement.title = link;
  linkElement.dataset.value = link;
  const warning = $("coupon-warning");
  warning.classList.toggle("hidden", shareable);
  if (!shareable) {
    warning.textContent = `${coupon.message || "Este cupom não está disponível."} A cópia, o compartilhamento e o QR code foram bloqueados.`;
  }
  $("code-copy").classList.toggle("hidden", !shareable);
  $("link-block").classList.toggle("hidden", !shareable);
  resetQr();
  activeLink = link;

  const share = $("share");
  share.classList.add("hidden");
  share.onclick = null;
  const shareText = couponShareText(coupon, code);
  if (navigator.share && link && shareText) {
    share.classList.remove("hidden");
    share.onclick = () => navigator.share({
      title: "Ausculto",
      text: shareText,
      url: link,
    }).catch(() => {});
  }
}

$("show-qr").addEventListener("click", () => {
  if (!activeLink) return;
  const panel = $("qr-panel");
  if (!panel.classList.contains("hidden")) {
    panel.classList.add("hidden");
    return;
  }
  const mount = $("qr-mount");
  if (!mount.firstChild) {
    const canvas = document.createElement("canvas");
    canvas.width = 150;
    canvas.height = 150;
    canvas.setAttribute("aria-label", "QR code do seu link de divulgação");
    mount.appendChild(canvas);
    drawQr(canvas, activeLink);
  }
  panel.classList.remove("hidden");
});

function renderMetrics(data) {
  const funnel = data.funnel || {};
  $("k-clicks").textContent = funnel.clicksAvailable === true ?
    count(funnel.clicks || 0) : "Indisponível";
  $("k-clicks-note").textContent = funnel.clicksAvailable === true ?
    "aberturas do seu link rastreado" :
    "a medição desta seção falhou";
  $("k-signups").textContent = data.availability?.signups === false ?
    "Indisponível" : count(funnel.signupsAttributed || 0);
  $("k-redemptions").textContent = count(funnel.redemptions || 0);
  $("k-paid").textContent = count(funnel.paidCustomers || 0);
  const conversion = funnel.redemptionToPaidPct ?? data.couponConversionPct;
  $("k-conversion").textContent = funnel.redemptions > 0 ?
    `${Number(conversion || 0).toLocaleString("pt-BR")}% dos resgates pagaram` :
    "a conversão começa no primeiro resgate";
  $("range-note").textContent =
    `Indicadores dos últimos ${data.dateRange?.windowDays || selectedPeriod} dias.`;
  if (data.dataAsOf) {
    const date = new Date(data.dataAsOf);
    $("data-as-of").textContent = Number.isNaN(date.getTime()) ? "" :
      `Atualizado às ${date.toLocaleTimeString("pt-BR", {hour: "2-digit", minute: "2-digit"})}`;
  }
}

function renderFunnel(data) {
  const funnel = data.funnel || {};
  const stages = [
    ["Visitas", funnel.clicksAvailable ? Number(funnel.clicks) || 0 : null,
      "alcance pelo link"],
    ["Cadastros", data.availability?.signups === false ? null :
      Number(funnel.signupsAttributed) || 0, "aquisição pelo link"],
    ["Resgates", Number(funnel.redemptions) || 0,
      "uso efetivo do cupom"],
    ["Assinantes pagos", Number(funnel.paidCustomers) || 0,
      "assinatura após o resgate"],
  ];
  const maximum = Math.max(1, ...stages.map((stage) => stage[1] || 0));
  const box = $("funnel");
  box.replaceChildren();
  stages.forEach(([label, value, description], index) => {
    const row = document.createElement("div");
    row.className = index === stages.length - 1 ?
      "funnel-row funnel-row--paid" : "funnel-row";
    const fill = document.createElement("span");
    fill.className = "funnel-row__fill";
    fill.style.setProperty("--fill", value === null ? "0%" :
      `${Math.max(2, (value / maximum) * 100)}%`);
    const text = document.createElement("span");
    text.className = "funnel-row__text";
    text.textContent = label;
    const small = document.createElement("small");
    small.textContent = description;
    text.appendChild(small);
    const figure = document.createElement("strong");
    figure.className = value === null ?
      "funnel-row__value funnel-row__value--unknown" :
      "funnel-row__value";
    figure.textContent = value === null ? "indisponível" : count(value);
    row.append(fill, text, figure);
    box.appendChild(row);
    requestAnimationFrame(() => { fill.style.transform = "scaleX(1)"; });
  });
}

function renderTier(data) {
  const tier = data.tier;
  if (!tier) {
    $("tier-now").textContent = "Sem nível definido";
    $("tier-gap").textContent = "A progressão ainda não foi configurada.";
    return;
  }
  $("tier-now").textContent = tier.tier?.label || "—";
  const metricNames = {redemptions: "resgates", paidCustomers: "assinantes"};
  const missing = (tier.missing || [])
      .map((item) => `${item.need} ${metricNames[item.metric] || item.metric}`)
      .join(" e ");
  $("tier-gap").textContent = tier.nextTier ?
    `Faltam ${missing} para ${tier.nextTier.label}.` :
    "Nível máximo alcançado.";
  const fill = $("tier-fill");
  const progress = Math.max(0, Math.min(100, Number(tier.progressPct) || 0));
  fill.style.transform = `scaleX(${progress / 100})`;
  fill.classList.toggle("gold", tier.nextTier?.id === "ouro" || tier.tier?.id === "ouro");
  const rungs = $("rungs");
  rungs.replaceChildren();
  for (const entry of tier.tiers || []) {
    const item = document.createElement("span");
    item.className = "rung";
    if (entry.reached) item.classList.add("reached");
    if (entry.reached && entry.id === "ouro") item.classList.add("gold");
    item.textContent = entry.label;
    rungs.appendChild(item);
  }
}

function renderResults(data) {
  const earnings = data.earnings || {};
  const couponRevenue = earnings.couponRevenueBrl ??
    earnings.attributedRevenueBrl;
  $("m-revenue").textContent = money(couponRevenue);
  $("m-mrr").textContent = money(earnings.attributedMrrBrl);
  const paid = Number(data.funnel?.paidCustomers) || 0;
  $("m-revenue-note").textContent = paid > 0 ?
    `Resultado de ${count(paid)} ${paid === 1 ? "assinante" : "assinantes"} que resgataram o cupom e pagaram uma assinatura.` :
    "Nenhuma assinatura paga foi atribuída ao cupom neste período.";
}

function sumStatementByStatus(rows, status) {
  return (rows || []).filter((row) => row.status === status)
      .reduce((sum, row) => sum + (Number(row.amountDueBrl) || 0), 0);
}

function renderFinance(data, statementResult) {
  const plan = data.compensationPlan || {};
  const program = data.commissionProgram || {};
  const hasFinancialAccess = plan.kind === "commission" ||
    program.hasHistory === true || program.planEnded === true;
  $("sec-finance").classList.toggle("hidden", !hasFinancialAccess);
  if (!hasFinancialAccess) return;

  if (!statementResult.ok) {
    $("statement-error").textContent =
      "Não foi possível carregar o extrato. Os indicadores acima continuam válidos; tente atualizar a página para consultar pagamentos.";
    $("statement-error").classList.remove("hidden");
    $("statement-wrap").classList.add("hidden");
    $("statement-empty").classList.add("hidden");
    for (const id of ["m-pending", "m-review", "m-approved", "m-paid"]) {
      $(id).textContent = "—";
    }
    return;
  }

  $("statement-error").classList.add("hidden");
  const statement = statementResult.value || {};
  const rows = statement.commissions || [];
  const totals = statement.totals || {};
  $("m-pending").textContent = money(totals.pendingBrl ??
    sumStatementByStatus(rows, "pending"));
  $("m-review").textContent = money(totals.provisionalBrl || 0);
  $("m-approved").textContent = money(totals.approvedBrl ??
    sumStatementByStatus(rows, "approved"));
  $("m-paid").textContent = money(totals.paidBrl ??
    sumStatementByStatus(rows, "paid"));

  if (program.planEnded || (plan.kind !== "commission" && rows.length)) {
    $("commission-note").textContent =
      "O plano financeiro foi encerrado. Novas cobranças não acumulam comissão; o histórico permanece disponível.";
  } else if (program.engineEnabled !== true) {
    $("commission-note").textContent =
      "O motor financeiro está temporariamente pausado. Nenhum novo valor será acumulado enquanto estiver desligado.";
  } else {
    $("commission-note").textContent =
      `Plano ativo a ${Number(plan.ratePercent || 0).toLocaleString("pt-BR")}% · retenção mínima de ${program.holdbackDays || 30} dias · aprovação manual.`;
  }

  const body = $("statement");
  body.replaceChildren();
  $("statement-wrap").classList.toggle("hidden", rows.length === 0);
  $("statement-empty").classList.toggle("hidden", rows.length > 0);
  if (!rows.length) {
    $("statement-empty").textContent =
      "Ainda não há períodos financeiros apurados. Eles aparecem após uma cobrança elegível e o fechamento mensal.";
    return;
  }

  for (const row of rows) {
    const tr = document.createElement("tr");
    const values = [
      row.periodKey,
      money(row.basisRevenueBrl),
      row.ratePercent ? `${row.ratePercent}%` : "Taxas variadas",
      money(row.amountDueBrl),
    ];
    values.forEach((value) => {
      const td = document.createElement("td");
      td.textContent = value;
      tr.appendChild(td);
    });
    const statusCell = document.createElement("td");
    const pill = document.createElement("span");
    pill.className = row.status === "paid" ?
      "status-pill status-pill--paid" : "status-pill";
    pill.textContent = row.statusLabel || row.status;
    statusCell.appendChild(pill);
    tr.appendChild(statusCell);
    body.appendChild(tr);
  }
}

function renderChart(seriesResult) {
  const error = $("chart-error");
  const wrap = $("chart-wrap");
  if (!seriesResult.ok) {
    error.textContent =
      "O histórico diário não pôde ser carregado agora. Isso não transforma os resgates em zero.";
    error.classList.remove("hidden");
    wrap.classList.add("hidden");
    return;
  }
  error.classList.add("hidden");
  wrap.classList.remove("hidden");
  const rows = Array.isArray(seriesResult.value?.series) ?
    seriesResult.value.series : [];
  const chart = $("chart");
  chart.replaceChildren();
  const total = rows.reduce((sum, row) => sum + (Number(row.redemptions) || 0), 0);
  if (!rows.length || total === 0) {
    const empty = document.createElement("div");
    empty.className = "chart-empty";
    empty.textContent = "Ainda não houve resgates neste período.";
    chart.appendChild(empty);
    $("chart-note").textContent = "O gráfico começa a ser desenhado no primeiro uso do cupom.";
    return;
  }
  const maximum = Math.max(...rows.map((row) => Number(row.redemptions) || 0));
  rows.forEach((row) => {
    const value = Number(row.redemptions) || 0;
    const bar = document.createElement("span");
    bar.className = value > 0 ? "chart-bar" : "chart-bar zero";
    bar.style.setProperty("--height", `${Math.max(3, (value / maximum) * 100)}%`);
    bar.title = `${row.day}: ${value} resgate(s)`;
    chart.appendChild(bar);
    requestAnimationFrame(() => { bar.style.transform = "scaleY(1)"; });
  });
  $("chart-note").textContent =
    `${count(total)} resgates distribuídos em ${rows.length} dias.`;
}

function renderAssets(assetsResult) {
  const error = $("kit-error");
  const empty = $("kit-empty");
  const box = $("kit");
  box.replaceChildren();
  if (!assetsResult.ok) {
    error.textContent =
      "Os materiais não puderam ser carregados. Seu código e link continuam prontos para divulgação.";
    error.classList.remove("hidden");
    empty.classList.add("hidden");
    return;
  }
  error.classList.add("hidden");
  const assets = Array.isArray(assetsResult.value?.assets) ?
    assetsResult.value.assets : [];
  empty.classList.toggle("hidden", assets.length > 0);
  if (!assets.length) {
    empty.textContent =
      "Ainda não há artes oficiais publicadas. Você já pode divulgar o código e o link acima; para uma peça específica, fale com o suporte.";
    return;
  }
  for (const asset of assets) {
    const link = document.createElement("a");
    link.className = "kit-item";
    link.href = asset.url;
    link.target = "_blank";
    link.rel = "noopener";
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.setAttribute("class", "icon");
    icon.setAttribute("viewBox", "0 0 24 24");
    icon.setAttribute("aria-hidden", "true");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", "#i-open");
    icon.appendChild(use);
    const text = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = asset.title;
    text.appendChild(title);
    if (asset.description) {
      const description = document.createElement("small");
      description.textContent = asset.description;
      text.appendChild(description);
    }
    link.append(icon, text);
    box.appendChild(link);
  }
}

function renderRules(scope) {
  const box = $("rules");
  box.replaceChildren();
  for (const key of ["paidCustomerRule", "attributionRule", "commissionRule",
    "clicksRule", "mrrRule", "privacyNote", "historyNote"]) {
    if (!scope?.[key]) continue;
    const paragraph = document.createElement("p");
    paragraph.textContent = scope[key];
    box.appendChild(paragraph);
  }
}

function settledResult(result) {
  return result.status === "fulfilled" ?
    {ok: true, value: result.value.data} :
    {ok: false, error: result.reason};
}

async function loadDashboard({initial = currentDashboard === null} = {}) {
  const requestId = ++dashboardRequest;
  view("view-dash");
  clearPrimaryError();
  setLoading(initial);
  if (initial) {
    $("dash-body").classList.add("hidden");
    $("pending").classList.add("hidden");
  }

  if (!appCheckOk) {
    finishLoading();
    setPrimaryError(
        "A proteção deste endereço não foi inicializada. Nenhum dado foi carregado; avise o suporte do Ausculto.",
        false);
    return;
  }

  let data;
  try {
    data = (await call("partnerGetDashboard")({
      dateRange: {windowDays: selectedPeriod},
    })).data;
  } catch (error) {
    if (requestId !== dashboardRequest) return;
    finishLoading();
    const denied = error?.code === "functions/permission-denied";
    setPrimaryError(denied ?
      "Esta conta não tem acesso ao portal de embaixadores. Confira se entrou com o e-mail cadastrado." :
      "Não conseguimos carregar o painel agora. Seus dados não foram convertidos em zero; tente novamente.",
    true);
    console.error(error);
    return;
  }

  if (requestId !== dashboardRequest) return;
  currentDashboard = data;
  renderIdentity(data);
  renderRules(data.scope);
  finishLoading();
  if (data.pendingCode) {
    $("pending").classList.remove("hidden");
    $("dash-body").classList.add("hidden");
    return;
  }

  $("pending").classList.add("hidden");
  $("dash-body").classList.remove("hidden");
  renderCredential(data);
  renderMetrics(data);
  renderFunnel(data);
  renderTier(data);
  renderResults(data);

  const companionResults = await Promise.allSettled([
    call("partnerGetStatement")({}),
    call("partnerGetTimeseries")({days: selectedPeriod}),
    call("partnerGetAssets")({}),
  ]);
  if (requestId !== dashboardRequest) return;
  const [statement, series, assets] = companionResults.map(settledResult);
  renderFinance(data, statement);
  renderChart(series);
  renderAssets(assets);
}

document.querySelectorAll("[data-period]").forEach((button) => {
  button.addEventListener("click", () => {
    const next = Number(button.dataset.period);
    if (![30, 90].includes(next) || next === selectedPeriod) return;
    selectedPeriod = next;
    document.querySelectorAll("[data-period]").forEach((candidate) => {
      candidate.setAttribute("aria-pressed",
          candidate === button ? "true" : "false");
    });
    loadDashboard({initial: false});
  });
});

$("retry-dashboard").addEventListener("click", () => {
  loadDashboard({initial: currentDashboard === null});
});

document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-copy]");
  if (!button) return;
  const element = $(button.dataset.copy);
  const value = element?.dataset?.value || element?.textContent || "";
  if (!value || value === "—") return;
  try {
    await navigator.clipboard.writeText(value);
    toast(button.dataset.copy === "code" ? "Código copiado" : "Link copiado");
  } catch (error) {
    toast("Não foi possível copiar automaticamente");
    console.warn(error);
  }
});

$("logout").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "/";
});

const arrivedByLink = isSignInWithEmailLink(auth, window.location.href);
if (arrivedByLink) handleLink();

onAuthStateChanged(auth, (user) => {
  if (user) {
    loadDashboard({initial: true});
  } else if (!arrivedByLink) {
    view("view-gate");
  }
});
