# Publicação da home — 28/09/2026

Publicação autorizada exclusivamente da nova página principal de `auscultoapp.com`. A reformulação de `/estudantes/` permanece inédita em produção.

- Projeto/site Firebase Hosting: `auscultoapp`; nenhum deploy do app Flutter, Functions, ENAMED ou parceiros.
- Versão publicada: `ee1ec49f9219190f`.
- Release: `1790611699362000`.
- Versão anterior / rollback: `f4f39a78dee05303`.
- Fonte local validada: commit `54ab2468412000fe97851578438ea28caa689052`.

O inventário da versão anterior foi reutilizado integralmente, substituindo apenas `/index.html`. As 96 dependências da nova home foram isoladas em `/releases/home-20260928/`, evitando alterar recursos usados pela Academy. A versão final contém 851 arquivos, incluindo os dois recursos internos do Firebase. Os outros 754 arquivos do inventário anterior mantêm exatamente seus hashes. Headers, rewrites e endpoints existentes foram preservados.

## Validação

- `npm run verify:site`, `npm run test:home-hero`, `npm run test:tracking`: aprovados.
- Runtime da hero em 390, 768 e 1440 px; teclado, troca de abas, mudança de breakpoint e menu: aprovado.
- Candidato e produção: 97 hashes da home conferidos por HTTP, imagens decodificadas, ausência de erros JavaScript e overflow em 390 e 1440 px, ausência de tracking antes do consentimento.
- `/estudantes/` permanece byte a byte igual nos domínios com e sem `www`; inventário publicado confirma preservação de todas as dependências antigas.
- Configuração do Hosting comparada com a anterior: idêntica.
- Capturas e evidências: `.local-art/home-only-release-20260928/` (`deployment.json`, `live-validation.json`, `preservation-validation.json`, `live-390.png`, `live-1440.png`).

Nenhum aparelho físico foi utilizado; checagens de navegador executadas no Chrome instalado, em contextos isolados.

## Próxima publicação

`dist/site` continua contendo a reformulação ainda não autorizada de Estudantes. **Não publicar esse diretório integralmente enquanto a restrição do usuário persistir.** Esta publicação parcial foi criada pela API do Firebase Hosting usando a autenticação do CLI, o guard `ALLOW_SITE_DEPLOY=1`, a verificação do build e hashes imutáveis da versão anterior. Os scripts exatos e os manifestos estão junto às evidências locais.
