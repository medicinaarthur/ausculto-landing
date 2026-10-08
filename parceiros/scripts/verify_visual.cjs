"use strict";

// QA local: executa app.js real com SDK/respostas sintéticos. Bloqueia toda
// requisição externa. Nada deste arquivo é incluído em parceiros/public.
// Pré-requisito: servidor local ativo em 5055 e Playwright de desenvolvimento.
const {chromium} = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const out = path.resolve(__dirname, "../docs/visual-2026-09-30");
const origin = "http://127.0.0.1:5055";

const fixture = {
  partner: {name: "Mariana Oliveira · Conta de demonstração", code: "DEMONSTRACAO", trackedLink: "https://example.com/r/DEMONSTRACAO"},
  coupon: {shareable: true, benefit: {kind: "pro_days", proDays: 7}},
  funnel: {clicksAvailable: true, clicks: 1280, signupsAttributed: 164, redemptions: 86, paidCustomers: 21, redemptionToPaidPct: 24.4},
  earnings: {couponRevenueBrl: 1047.9, attributedMrrBrl: 627.9},
  tier: {tier: {id: "prata", label: "Prata"}, nextTier: {id: "ouro", label: "Ouro"}, progressPct: 64, missing: [{metric: "paidCustomers", need: 9}], tiers: [{id: "bronze", label: "Bronze", reached: true}, {id: "prata", label: "Prata", reached: true}, {id: "ouro", label: "Ouro", reached: false}]},
  compensationPlan: {kind: "commission", ratePercent: 10},
  commissionProgram: {engineEnabled: true, holdbackDays: 30},
  scope: {paidCustomerRule: "Dados sintéticos para conferir a interface. Nenhum registro de produção foi consultado.", attributionRule: "Aquisição pelo link e uso do cupom são medidos separadamente."},
  dataAsOf: "2026-09-30T17:00:00-03:00",
};

const authStub = `
const mode=new URL(location.href).searchParams.get('qa');
export const getAuth=()=>({});
export const isSignInWithEmailLink=()=>mode==='finishing';
export const onAuthStateChanged=(a,cb)=>cb(mode==='login'||mode==='finishing'?null:{uid:'synthetic'});
export const signInWithEmailLink=async()=>{throw Error('Synthetic expired link')};
export const signOut=async()=>{};
`;
const functionsStub = `
export const getFunctions=()=>({});
export const httpsCallable=(f,name)=>async payload=>{
  window.__calls.push({name,payload});
  const mode=new URL(location.href).searchParams.get('qa');
  if(mode==='loading')await new Promise(()=>{});
  if(mode==='error')throw Error('Synthetic network error');
  if(mode==='partial'&&name!=='partnerGetDashboard')throw Error('Synthetic section failure');
  if(name==='partnerRequestLoginLink')return {data:{}};
  if(name==='partnerGetDashboard'){
    const d=structuredClone(window.__fixture);
    d.dateRange={windowDays:payload.dateRange.windowDays};
    if(mode==='pending')d.pendingCode=true;
    if(mode==='blocked'){d.coupon.shareable=false;d.coupon.message='Este cupom está pausado.';}
    if(mode==='partial'){d.funnel.clicksAvailable=false;d.availability={signups:false};}
    if(mode==='long')d.partner.code='CODIGO_DE_DEMONSTRACAO_COM_TEXTO_LONGO';
    return {data:d};
  }
  if(name==='partnerGetStatement')return {data:{commissions:[{periodKey:'2026-08',basisRevenueBrl:580,ratePercent:10,amountDueBrl:58,status:'paid',statusLabel:'Pago'}],totals:{pendingBrl:32,provisionalBrl:0,approvedBrl:18,paidBrl:58}}};
  if(name==='partnerGetTimeseries')return {data:{series:mode==='empty'?[]:Array.from({length:30},(_,i)=>({day:'2026-09-'+String(i+1).padStart(2,'0'),redemptions:i%6}))}};
  if(name==='partnerGetAssets')return {data:{assets:[]}};
  return {data:{}};
};
`;

async function main() {
  fs.mkdirSync(out, {recursive: true});
  const browser = await chromium.launch({headless: true, channel: "chrome"});
  const context = await browser.newContext({deviceScaleFactor: 1});
  const page = await context.newPage();
  const errors = [];
  const blocked = [];
  page.on("pageerror", e => errors.push(e.message));
  await context.addInitScript(f => {
    window.__fixture=f;
    window.__calls=[];
    // Cada cenário começa independente do e-mail salvo pelo teste de login.
    localStorage.removeItem("ausculto_partner_email");
  }, fixture);
  await context.route("**/*", async route => {
    const u = route.request().url();
    if (u.startsWith(origin + "/")) return route.continue();
    let body;
    if (u === "https://www.gstatic.com/firebasejs/10.12.0/firebase-app-check.js") body="export class ReCaptchaV3Provider {} export const initializeAppCheck=()=>({});";
    else if (u === "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js") body="export const initializeApp=()=>({});";
    else if (u === "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js") body=authStub;
    else if (u === "https://www.gstatic.com/firebasejs/10.12.0/firebase-functions.js") body=functionsStub;
    else {blocked.push(u);return route.abort();}
    return route.fulfill({contentType: "text/javascript", body});
  });
  const results = [];
  try {
    for (const [mode,width,height] of [
      ["login",1440,900],["login",390,844],["login",360,800],
      ["dashboard",1440,900],["dashboard",390,844],["dashboard",768,1024],
      ["partial",1440,900],["partial",360,800],["pending",390,844],
      ["finishing",390,844],["error",390,844],["blocked",390,844],
      ["empty",390,844],["long",360,800],["loading",390,844],
    ]) {
      await page.setViewportSize({width,height});
      await page.goto(origin + "/?qa=" + mode);
      await page.evaluate(() => document.fonts.ready);
      const selector = {login:"#email", finishing:"#confirm-email", pending:"#pending:not(.hidden)", error:"#dash-status:not(.hidden)", loading:"#dash-loading:not(.hidden)"}[mode] || "#kit-empty:not(.hidden),#kit-error:not(.hidden)";
      await page.locator(selector).first().waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,mode+" overflow at "+width);
      assert.equal(await page.evaluate(()=>[...document.images].filter(x=>x.getBoundingClientRect().width>0).every(x=>x.complete&&x.naturalWidth>0)),true,"Missing image");
      await page.screenshot({path:path.join(out, mode+"-"+width+".png"),fullPage:true});
      if(mode==="dashboard") {
        await page.getByRole("button",{name:"90 dias",exact:true}).click();
        await page.waitForFunction(()=>document.getElementById('range-note').textContent.includes('90 dias'));
        assert.equal(await page.locator('[data-period="90"]').getAttribute("aria-pressed"),"true");
        await page.getByRole("button",{name:"Gerar QR code"}).click();
        assert.equal(await page.locator("#qr-mount canvas").count(),1);
        await page.getByRole("button",{name:"Gerar QR code"}).click();
        assert.equal(await page.locator("#qr-panel").isVisible(),false);
        await page.getByRole("button",{name:"Copiar código"}).click();
        await page.getByRole("status").filter({hasText:"Código copiado"}).waitFor();
        assert.equal(await page.locator("#toast").textContent(),"Código copiado");
        await page.locator(".rules-panel summary").click();
        assert.equal(await page.locator("#rules").isVisible(),true);
        assert.equal(await page.locator("#statement-wrap").evaluate(e=>e.scrollWidth>e.clientWidth),width<700);
      }
      if(mode==="blocked") {
        assert.equal(await page.locator("#link-block").isVisible(),false);
        assert.equal(await page.locator("#code-copy").isVisible(),false);
        assert.equal(await page.locator("#qr-panel").isVisible(),false);
      }
      if(mode==="login") {
        await page.locator("#login-submit").click();
        assert.match(await page.locator("#login-msg").textContent(),/e-mail válido/);
        assert.equal(await page.evaluate(()=>window.__calls.length),0);
        await page.locator("#email").fill("synthetic@example.com");
        await page.locator("#email").focus();
        await page.keyboard.press("Tab");
        assert.equal(await page.locator("#login-submit").evaluate(e=>e===document.activeElement),true);
        await page.keyboard.press("Enter");
        await page.waitForFunction(()=>document.getElementById('login-msg').textContent.includes('link chega'));
        const calls=await page.evaluate(()=>window.__calls);
        assert.deepEqual(calls,[{name:"partnerRequestLoginLink",payload:{email:"synthetic@example.com"}}]);
        await page.screenshot({path:path.join(out,"login-success-"+width+".png"),fullPage:true});
      }
      if(mode==="finishing") {
        await page.locator("#confirm-email").fill("synthetic@example.com");
        await page.locator("#confirm-submit").click();
        await page.locator("#finishing-error:not(.hidden)").waitFor();
        await page.screenshot({path:path.join(out,"finishing-error-"+width+".png"),fullPage:true});
      }
      results.push({mode,width,height,dpr:1,overflow:false});
    }
    // Browser text enlargement: font-relative content at twice the base size.
    await page.setViewportSize({width:360,height:800});
    for(const mode of ["login","dashboard"]) {
      await page.goto(origin+"/?qa="+mode);
      await page.locator(mode==="login"?"#email":"#kit-empty:not(.hidden)").waitFor();
      await page.addStyleTag({content:"html {font-size:200%} body {font-size:30px} .login-panel input,.login-panel .button--primary {font-size:24px}"});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,"Enlarged text overflow");
      await page.screenshot({path:path.join(out,mode+"-360-enlarged.png"),fullPage:true});
    }
    assert.deepEqual(errors,[],"Uncaught browser errors");
    assert.deepEqual(blocked,[],"Unexpected external requests");
    fs.writeFileSync(path.join(out,"results.json"),JSON.stringify({results,errors,blocked,realBackendRequests:0},null,2)+"\n");
    console.log("[verify_visual] OK: 15 layouts, enlarged text, login, periods, QR, clipboard, rules, coupon gates; zero real backend requests.");
  } finally {
    await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
