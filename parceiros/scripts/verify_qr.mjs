// Verifica o gerador de QR do portal contra a biblioteca de referência
// "qrcode", módulo a módulo, para TODO tamanho de 1 a 215 bytes.
//
// Por que existe: um QR quebrado não dá erro — ele só não abre no celular de
// quem tentou usar. É o tipo de defeito que passa despercebido até um
// embaixador reclamar num evento. Este script transforma isso em teste.
//
// A referência é uma dependência de desenvolvimento opcional, para o portal
// continuar sem dependências de runtime:
//   npm install --no-save qrcode && npm run verify:qr
import {createRequire} from "node:module";
import {fileURLToPath} from "node:url";
import path from "node:path";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
const qrModuleUrl = new URL(
    "file:///" + path.join(here, "..", "public", "qr.js").replace(/\\/g, "/"),
);

let QRCode;
try {
  QRCode = require("qrcode");
} catch (error) {
  console.log("[verify_qr] referência ausente. Rode:");
  console.log("  npm install --no-save qrcode && npm run verify:qr");
  process.exit(0);
}

const {buildQrMatrix} = await import(qrModuleUrl);

const NAMED_CASES = [
  "https://parceiros.auscultoapp.com/r/MARIA10",
  "https://auscultoapp.com/?utm_source=embaixador&utm_medium=parceria" +
    "&utm_campaign=embaixadores_2026&utm_content=LACARDIOUSP",
  "acentuação e emoji ✅ para testar UTF-8",
];

let failures = 0;
let checked = 0;

function compare(text, label) {
  const mine = buildQrMatrix(text);
  let reference;
  try {
    reference = QRCode.create([{data: text, mode: "byte"}],
        {errorCorrectionLevel: "M"});
  } catch (error) {
    return; // acima da capacidade da referência
  }

  const size = reference.modules.size;
  const version = (size - 17) / 4;

  // Acima da versão 10 o gerador do portal recusa de propósito.
  if (version > 10) {
    if (mine !== null) {
      console.log(`FALHA ${label}: deveria recusar (v${version})`);
      failures += 1;
    }
    return;
  }

  if (!mine) {
    console.log(`FALHA ${label}: retornou null mas cabe em v${version}`);
    failures += 1;
    return;
  }
  if (mine.length !== size) {
    console.log(`FALHA ${label}: v${(mine.length - 17) / 4} != v${version}`);
    failures += 1;
    return;
  }

  let diff = 0;
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if (mine[r][c] !== (reference.modules.data[r * size + c] ? 1 : 0)) {
        diff += 1;
      }
    }
  }
  checked += 1;
  if (diff) {
    console.log(`FALHA ${label}: ${diff} módulos divergentes (v${version})`);
    failures += 1;
  }
}

for (const text of NAMED_CASES) compare(text, `"${text.slice(0, 42)}"`);
for (let n = 1; n <= 215; n += 1) compare("a".repeat(n), `${n} bytes`);

if (failures) {
  console.error(`[verify_qr] ${failures} divergência(s)`);
  process.exit(1);
}
console.log(`[verify_qr] OK: ${checked} casos idênticos à referência ` +
  "(versões 1–10, byte mode, correção M).");
