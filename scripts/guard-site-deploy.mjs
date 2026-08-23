#!/usr/bin/env node
/**
 * Trava de deploy do site PRINCIPAL (auscultoapp.com).
 *
 * Por que existe: ate 2026-08-23 este repositorio tinha `public: "."` sem
 * target algum, entao um `firebase deploy` distraido publicava a raiz do
 * repositorio em producao — incluindo o firebase-debug.log de 1,2 MB com o
 * inventario de Cloud Functions, o appId, e-mails de service account e os
 * nomes dos secrets. Os targets explicitos resolvem metade do problema; esta
 * trava resolve a outra metade, porque um `firebase deploy` sem `--only`
 * ainda alcancaria os dois sites.
 *
 * Como e um `predeploy` do bloco "site", ele roda ANTES da publicacao e um
 * exit diferente de zero aborta o deploy inteiro. O deploy do target `enamed`
 * nao passa por aqui.
 *
 * Para publicar o site principal de proposito:
 *   ALLOW_SITE_DEPLOY=1 firebase deploy --only hosting:site
 */

const ENV_FLAG = "ALLOW_SITE_DEPLOY";

if (process.env[ENV_FLAG] === "1") {
  console.log(
    `[guard-site-deploy] ${ENV_FLAG}=1 — deploy do site principal autorizado explicitamente.`,
  );
  process.exit(0);
}

console.error(
  [
    "",
    "  ┌──────────────────────────────────────────────────────────────────┐",
    "  │  DEPLOY DO SITE PRINCIPAL BLOQUEADO                              │",
    "  └──────────────────────────────────────────────────────────────────┘",
    "",
    "  Este comando publicaria em auscultoapp.com (producao).",
    "",
    "  Se a intencao era publicar apenas a landing ENAMED, use:",
    "      npm run deploy:enamed:preview",
    "",
    `  Se a intencao era MESMO publicar o site principal, repita com ${ENV_FLAG}=1:`,
    `      ${ENV_FLAG}=1 firebase deploy --only hosting:site`,
    "",
  ].join("\n"),
);
process.exit(1);
