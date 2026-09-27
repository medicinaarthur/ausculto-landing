# Ausculto Academy — continuação no Antigravity / Gemini 3.8 Flash

**Data:** 14/09/2026. **Estado:** implementação interrompida a pedido do usuário para entrega imediata deste documento. Desktop e mobile ainda NÃO foram concluídos nem validados nesta rodada. Não publique como final sem cumprir as verificações abaixo.

---

# ATUALIZAÇÃO KIMI — 14/09/2026 (segunda sessão, estado real ao parar)

**Estado:** trabalho interrompido a pedido do usuário ("pode parar") para registrar o que falta. A prévia local reflete o código atual; a prévia PUBLICADA continua sendo a versão anterior (nada foi publicado nesta sessão).

## Feito e validado nesta sessão (Kimi)

**Bloqueios da seção "Bloqueios e defeitos conhecidos" — todos resolvidos:**
- 6 assets copiados de `academy-layered-assets` → `site/assets/academy/` (hero-shapes desktop/mobile, hero-people-01/02, navy-background-mobile-1/2).
- `scripts/academy-product.mjs` reescrito em UTF-8 (mojibake real eliminado); dims intrínsecas corrigidas; classes mortas `overview-people reference-hero` removidas do hero.
- `scripts/academy-account.mjs`: URLs `/termos-de-uso.html` e `/politica-de-privacidade.html` corrigidas.
- `scripts/academy-landing.mjs`: rótulos "Ler amostra →"; ações PRO ("Conhecer o Ausculto PRO" + "Já sou PRO: acessar"); subtítulo do FAQ; helper morto removido.
- `site/assets/js/academy-account.js`: init idempotente do Firebase app; novas mensagens de erro; `failed-precondition` re-sincroniza perfil. `node --check` OK.
- `scripts/build-site.mjs`: `.json` adicionado à allowlist (era o bloqueio real de build: `account-config.json`).
- `site/assets/css/academy-redesign.css`: pseudos legados neutralizados; estilos do hero portados; card branco legado do PRO removido; scale-grid 2×2 mobile; `header-cta` visível ≤800px; margens mobile 20px/16px.
- `site/assets/js/academy-book.js`: fechamento simétrico do livro.
- `scripts/test-academy-articles.mjs`: contrato atualizado (inclui guarda anti-mojibake).

**Pedidos do usuário implementados nesta sessão:**
1. Hero par 1: foto nova (polo navy + morena de jaleco) → `hero-people-01.png`. Escala corrigida (`campaign-person--landscape: 112%/-6%`) após feedback de braços cortados/personagens grandes.
2. Hero par 2: foto nova (dupla dos flashcards, 1122×1402) → `hero-people-02.png`, com classe `campaign-person--portrait` (92%/4%).
3. Card do hero sincronizado com as duplas: dois `.benefit-panel` empilhados (`grid-area:1/1`, crossfade .8s) — par 1 "Sua próxima etapa: residência." (Provas por banca · Simulados · Acompanhamento do desempenho); par 2 "Do primeiro tema ao ENAMED." (Temas e subtemas · Flashcards · Questões comentadas). Ícones Phosphor em `site/assets/academy/icons/`. Rotação sincronizada em `academy.js`.
4. "Comece por um tema": desktop com livros grandes centralizados, categoria, título e botão azul (sem descrição ≥601px); mobile mantém layout compacto.
5. Bloco PRO redesenhado conforme referência do usuário: painel navy mais baixo (`.wrap.pro-panel`), kicker "DO PRIMEIRO TEMA AO ENAMED", "A mesma assinatura." em Instrument Serif dourado `#e8bf7e`, sub "Temas e subtemas · Flashcards · Questões comentadas", botão dourado `#e8b45c` + link sublinhado; assets novos `pro-student.png` (1098×1433) à frente do `pro-laptop.png` (1536×1024), estudante transpassando o topo do painel; `pro-ecosystem.png` removido. Mobile: composição empilhada abaixo do texto (v2: `margin-top:64px`, estudante `calc(100% + 40px)`).
6. Allowlist `scripts/data/academy-product.json` atualizada (pro-student/pro-laptop; 39 assets).

**Testes e build (última execução):** `test:academy-content` 6/6 ✓, `test:academy-presentation` 6/6 ✓, `test:tracking` ✓, `test:enamed-continuous` ✓. `npm run build:academy-preview` → 380 arquivos públicos; prévia 61 arquivos/7 páginas ✓.

**Validação visual no navegador (screenshots em `.local-art/qa-round3/`):** desktop 1440 (hero p1/p2, PRO) ✓; mobile 390 (hero p1/p2, PRO v2) ✓; 1920 PRO ✓; overflow horizontal = 0 em 360/390/1440/1920 ✓. ATENÇÃO: a última captura mobile do PRO (m390-pro-v2, após o ajuste do overlap do link) foi gerada mas a revisão visual final dela foi interrompida — reconferir antes de publicar.

## O que FALTA (retomar daqui)

1. **Reconferir `m390-pro-v2.png` e `m360-pro-v2.png`** (`.local-art/qa-round3/`): validar que o link "Já sou PRO" não é mais coberto pela estudante e que o notebook tem presença suficiente; se necessário, ajuste fino em `@media(max-width:600px)` do `.pro-visual` em `academy-redesign.css` e rebuild.
2. **Desktop 1920 e 2800 do hero** (só o PRO foi capturado em 1920): conferir escala dos personagens/faixas conforme seção 3 (não crescer indefinidamente).
3. **Livro interativo e catálogo no navegador:** hover abre/fecha (3 frames), toque alterna, Escape fecha; busca, filtro por área, 9 temas iniciais, "Mostrar mais", estado vazio, 69 IDs. CSS do livro foi tocado nesta rodada — revalidar.
4. **Fluxo cadastro/download ponta a ponta** (exigência da matriz de aceite): depende de remoto — IAM `roles/iam.serviceAccountTokenCreator` (concedido, mas signBlob ainda retornava 403 na verificação imediata; revalidar propagação), App Check reCAPTCHA no domínio da prévia, login Google/Apple. Provavelmente exige a prévia publicada (Auth authorized domains); localhost pode falhar. Registrar honestamente o que não der para validar. PDF esperado: `Ausculto_ENAMED_2026_Comentado.pdf`, 22.866.737 bytes.
5. **Rede/performance:** Firebase SDK só ao abrir o dialog; backgrounds desktop/mobile não devem baixar juntos (conferir aba Network).
6. **Texto a 200%** sem overflow (`?textScale=2` no servidor de prévia).
7. **Publicação:** conector Sites não disponível neste ambiente; último Site publicado segue no commit `f43634d7` do checkout `ausculto-academy-sites-preview`. Publicar só após os itens 1–6.
8. **Relatório de saída** (seção 10) ao concluir.

## Notas técnicas para o próximo agente

- Servidor QA: `node scripts/serve-academy-preview.mjs ../ausculto-academy-sites-preview/out 4189` — serve o pacote GERADO; **rebuild obrigatório após cada mudança** (`npm run build:academy-preview`).
- Screenshots: CLI `playwright` que funciona é o do Python 3.10 (`~/AppData/Local/Programs/Python/Python310`). Para scripts Node, importar `playwright` de `C:/Users/medic/AppData/Roaming/npm/node_modules/@playwright/cli/node_modules/playwright/index.mjs` E passar `executablePath` para `~/AppData/Local/ms-playwright/chromium_headless_shell-1234/.../chrome-headless-shell.exe` (o bundle espera a build 1232, ausente). Scripts prontos em `.local-art/qa-round3/capture.mjs` e `capture2.mjs`.
- O usuário fornece assets novos em `C:\Users\medic\Downloads\` (nomes "ChatGPT Image ..."); os já consumidos foram copiados para `site/assets/academy/`. Atenção: na mensagem do bloco PRO o usuário inverteu os paths estudante/tela — o mapeamento foi feito pelo conteúdo (estudante = 04_32_47, laptop = 04_42_03).
- Ambiente: Windows/Git Bash, node v24; `python` (3.12) NÃO tem playwright; usar o Python 3.10 ou o truque do executablePath acima.

---

## Instrução inicial ao agente

Continue a implementação existente. Não reinicie o site, não redesenhe novamente a identidade e não substitua a Academy por uma landing genérica. Primeiro leia este arquivo, os AGENTS.md aplicáveis e os fontes indicados. Descubra o estado real antes de editar. Corrija os bloqueios imediatos, conclua a composição desktop e depois o mobile. Preserve o conteúdo clínico, o catálogo, os contratos do app e os trabalhos não relacionados que já estão no checkout.

O usuário autorizou a execução do plano e pediu esta transferência antes da conclusão do desktop. Não assuma que o que está escrito no plano já está implementado ou testado. A prévia publicada ainda é a versão anterior. Não confunda deploy das Functions com validação do fluxo de cadastro/download no navegador.

## 1. Onde trabalhar

| Finalidade | Caminho / destino |
| --- | --- |
| Fonte principal do site estático | `C:\Users\medic\Desktop\ausculto-landing-deploy` |
| App Flutter e backend Firebase canônicos | `C:\Users\medic\Desktop\commit-v1-premium-backport` |
| Pacote gerado para o único Site privado | `C:\Users\medic\Desktop\ausculto-academy-sites-preview` |
| Novas camadas de arte, fora do site | `C:\Users\medic\Desktop\academy-layered-assets` |
| Checkout isolado usado no deploy das duas novas Functions | `C:\Users\medic\Desktop\ausculto-academy-free-release-20260914` |
| Prévia privada anterior | `https://ausculto-academy.arthurfe.chatgpt.site` |
| Projeto Sites existente | `appgprj_6aa7da717b508191a16c283f36801b6f` |
| Firebase existente | `auscultoapp`, número `510161004194`, região das novas Functions `us-central1` |

O `index.html` da raiz do repositório de marketing NÃO é a fonte atual da Academy. Não mantenha uma segunda implementação manual em `out/` ou `dist/`.

Rotas: Academy `/estudantes/`; na prévia também `/`. ENAMED contínuo `/enamed/` na prévia. Artigos `/conteudos/`. Produção mantém seus canonicals e domínio ENAMED.

## 2. O que o produto comunica

A Academy é a aba oficial do produto Ausculto para estudantes de medicina e médicos. A oferta inclui **40 bancas de residência, 160+ provas, 14.345 questões de residência comentadas, mais de 70 mil questões no banco, flashcards, casos clínicos e Quiz de Imagens**. ENAMED contém **69 temas com vários subtemas**. Não retomar o marketing principal de “69 resumos médicos”.

Material de estudo ENAMED incluído no PRO atual, sem assinatura adicional. PDF personalizado PRO continua exigindo PRO e e-mail verificado. O **ENAMED 2026 Comentado gratuito é outro material**: exige conta, não PRO e não uma etapa obrigatória de verificação de e-mail.

Cadastro/login/download gratuitos devem acontecer dentro da Academy. “Abrir o app” é ação separada, com a mesma conta; não prometer sessão automática entre domínios.

## 3. Fontes visuais e ordem de prioridade

1. Hero: referências individuais desktop **1672×941** e mobile **942×1672** anexadas na conversa.
2. Demais blocos mobile: prompt textual anexado; prevalece sobre a imagem longa.
3. Demais blocos desktop: referência longa anexada.
4. Dados e funcionalidades reais prevalecem sobre textos ilustrativos presentes nos mockups.

Texto original anexo: `C:\Users\medic\.codex\attachments\9e1aa944-4086-4d0e-b45b-e294833de654\pasted-text.txt`.

Se o Antigravity não receber as imagens da conversa, use os assets e registros locais como ponto de partida e solicite especificamente as referências ausentes; não invente outra direção para preencher essa lacuna. Há histórico visual também em `site/assets/academy/hero-reference-*.png`, `hero-natural-*.png`, `.local-art/` e `docs/`. As versões natural/reference antigas não são a implementação final por camadas.

### Hero: não reinterpretar novamente

- Navy `#07182F`, fundo com textura fina e iluminação azul discreta atrás das pessoas; título à esquerda permanece em área tranquila.
- Painel azul inclinado e arcos dourados finos, como na referência, separados do fundo.
- Duas pessoas de cada vez; alternância automática apenas da camada das pessoas a cada aproximadamente 6,5 segundos. Sem botão de pausa; respeitar `prefers-reduced-motion` e falhas de carregamento.
- Primeira dupla recupera o estudante de polo navy e a médica de jaleco da referência. Segunda dupla: adulta de cerca de 20 anos, blusa casual marfim, com médico. A estudante não usa jaleco nem estetoscópio.
- Fotografia suave, natural, exposição equilibrada. Não usar dramatic lighting, moody portrait, volumetric lighting, high contrast, HDR, nitidez artificial ou pele plástica.
- Logo oficial, textos, CTA, menu e benefícios em HTML funcional. Não rasterizar o hero inteiro.
- Título: “Seu próximo / passo na / medicina.”, com “medicina.” em dourado fosco.
- Card do hero: **70 mil+ questões / 40 bancas / Flashcards**. Manter também a faixa dos quatro indicadores completos abaixo.
- Desktop: largura máxima do conjunto aproximadamente 1400 px; pessoas dimensionadas pelo conjunto, fundo em toda a tela. Em 1920/2800 px não aumentar indefinidamente os personagens nem deixar faixas chapadas nas laterais.
- Mobile: cabeçalho → título → apoio → CTA → pessoas → card → assinatura. Reservar espaço real da fotografia; não usar margem arbitrária em vw para simular sua altura.
- Conferência por camadas: fundo isolado; fundo + shapes; pessoas; interface. Corrigir a camada divergente antes de avançar.

### Demais blocos

1. Indicadores navy: quatro colunas desktop; 2×2 mobile.
2. Objetivos: Residência e ENAMED lado a lado desktop; cards horizontais inteiros, empilhados no mobile. Texto à esquerda, arte à direita; um link por card.
3. ENAMED Comentado: desktop texto/CTA à esquerda, livro interativo à direita. Mobile título inteiro, descrição e livro lado a lado, CTA inteiro abaixo.
4. Recursos: quatro entradas desktop; uma lista agrupada de quatro linhas no mobile.
5. Leituras: três cards desktop. Mobile Abdome em destaque e Gasometria/Epidemiologia compactos, capas à esquerda, sem carrossel.
6. Catálogo **antes do PRO no DOM e nos dois layouts**: busca, área e resultados progressivos; sem acordeões aninhados.
7. PRO: desktop captura real aprovada e material; mobile principalmente tipográfico, captura apenas na expansão da experiência de leitura. Não inserir tablet fictício ou capa gigante no mobile.
8. FAQ e rodapé: uma coluna no mobile; apenas links reais. Sem frases decorativas laterais nos blocos mobile posteriores ao hero.

Seis áreas canônicas do catálogo; não transformar Cardiologia em grande área porque apareceu em mockup. Não inventar “mais acessados”, offline ou ligação automática de questões por tema.

## 4. Assets prontos e cópias que FALTAM

Os arquivos em `academy-layered-assets` foram gerados e inspecionados individualmente. **Não houve validação da composição final no navegador.** `prompts.json` registra as gerações; `asset-manifest.json` registra dimensões e transparência.

| Origem em `academy-layered-assets` | Destino esperado em `site/assets/academy` | Estado no momento da transferência |
| --- | --- | --- |
| `hero-background-desktop-01.png` | mesmo nome | Copiado |
| `hero-background-mobile-01.png` | mesmo nome | Copiado |
| `hero-shape-desktop-01.png` | `hero-shapes-desktop.png` | **Falta copiar** |
| `hero-shape-mobile-01.png` | `hero-shapes-mobile.png` | **Falta copiar** |
| `hero-people-pair-a-01.png` | `hero-people-01.png` | **Falta copiar** |
| `hero-people-pair-b-01.png` | `hero-people-02.png` | **Falta copiar** |
| `background-212-1-mobile-01.png` | `navy-background-mobile-1.png` | **Falta copiar** |
| `background-212-2-mobile-01.png` | `navy-background-mobile-2.png` | **Falta copiar** |

Os pares são RGBA 1254×1254. Shapes também têm alpha real. O shape desktop contém bastante área transparente à esquerda; o mobile tem espaço transparente acima. CSS de posicionamento precisa levar essa área em conta. O shape mobile veio mais claro que a referência; o CSS inicial reduz opacidade, mas ainda precisa de comparação visual. Não ampliar a dupla inteira para compensar posição errada do shape.

Originais fornecidos: `C:\Users\medic\Downloads\212 (1).png` e `212 (2).png`, ambos 1672×941. Já copiados como `navy-background-1.png` / `navy-background-2.png`. (1) indicadores/rodapé; (2) PRO/base do card de residência. O estetoscópio usa o asset existente do card. Derivações verticais prontas, pendentes de cópia.

Livro original: `C:\Users\medic\Downloads\Ausculto_ENAMED_hover_pronto_v2.html`. Três PNGs incorporados já extraídos como `enamed-book-0.png`, `1.png`, `2.png`. Preservar os três. Não incorporar HTML inteiro, iframe, regras globais de body/overflow nem base64 de 4 MB.

Capturas reais aprovadas: `C:\Users\medic\Desktop\commit-v1-premium-backport\.local-demo\academy-capture\approved\`. O site já contém `reading-reader_intro-r06.png` e demais capturas listadas em `scripts/data/academy-product.json`. Não gerar interfaces fictícias.

## 5. Arquivos de implementação e estado

Todos os caminhos abaixo são relativos a `ausculto-landing-deploy`, salvo indicação.

| Arquivo | Papel / estado |
| --- | --- |
| `scripts/academy-product.mjs` | Hero em camadas e blocos objetivos, material gratuito, recursos. Reescrito, mas contém **corrupção real de caracteres `?` em português** que precisa ser corrigida. |
| `scripts/academy-landing.mjs` | Leituras, catálogo antes do PRO, PRO com captura, FAQ. Alterado; revisar texto e estrutura. |
| `scripts/academy-articles.mjs` | Shell compartilhado. Inclui CSS/scripts/painel de conta somente na Academy; outras rotas preservadas. |
| `scripts/academy-account.mjs` | Novo HTML do dialog de conta; revisar contratos e acessibilidade. |
| `site/assets/css/academy-content.css` | CSS anterior compartilhado; tem várias camadas históricas de overrides. |
| `site/assets/css/academy-redesign.css` | Novo CSS de reconstrução, adicionado nesta rodada; **ainda não conferido em navegador**. Tem desktop e base mobile. |
| `site/assets/js/academy.js` | Interações existentes: catálogo, zoom, menu, alternância. Preservar contratos. |
| `site/assets/js/academy-book.js` | Novo livro mouse/toque/teclado com decode, fallback fechado e redução de movimento. Não testado em navegador ainda. |
| `site/assets/js/academy-account-loader.js` | Abre dialog e importa Firebase somente sob demanda. |
| `site/assets/js/academy-account.js` | Nova integração Firebase modular CDN 12.19.0; persistência local, senha/Google/Apple, completar perfil, preparar PDF, logout, recuperação. **Sem teste real ainda**. |
| `site/assets/academy/account-config.json` | Configuração pública do projeto existente e chave pública reCAPTCHA local. Não contém credenciais administrativas. |
| `scripts/data/academy-product.json` | Oferta, capturas e allowlist de assets; já referencia os seis arquivos ainda não copiados. |
| `scripts/academy-presentation.mjs` + `scripts/data/` | Catálogo canônico e seleção pública; preservar IDs, metadados e hashes. |
| `scripts/academy-markdown.mjs` | Renderização segura do conteúdo clínico existente. |
| `scripts/build-site.mjs` | Build site principal. |
| `scripts/render-enamed-source.mjs`, `enamed/continuous.html` | Fonte ENAMED contínuo e geração. |
| `scripts/build-enamed-continuous.mjs` | Build ENAMED contínuo. |
| `scripts/build-academy-preview.mjs` | Monta pacote isolado com allowlist, links internos, canonicals e noindex. |

### Bloqueios e defeitos conhecidos — resolver primeiro

- **Build atual não deve ser considerado íntegro:** seis assets referenciados ainda não foram copiados. Execute o build depois das cópias e trate o resultado real.
- Corrigir `scripts/academy-product.mjs`: exemplos reais “Seu pr?ximo”, “resid?ncia”, “quest?es”, “forma??o”, setas substituídas por `?`. Não é apenas exibição do terminal. Escrever em UTF-8 de forma segura; `Get-Content` sem `-Encoding UTF8` no Windows pode ainda mostrar mojibake separado desse defeito. Verificar bytes/texto com Python UTF-8 ou Node.
- `scripts/academy-account.mjs` aponta termos/privacidade para URLs **erradas** (`/termos.html`, `/privacidade.html`). Corrigir para `/termos-de-uso.html` e `/politica-de-privacidade.html`, como no rodapé existente.
- A tentativa anterior de substituir os rótulos das leituras por “Ler amostra →” não foi aplicada; há rótulos antigos em `academy-landing.mjs`. Ajustar conforme layout aprovado.
- Revisar `academy-account.js`: inicialização após erro parcial, observador Auth concorrente com submit, conta autenticada sem perfil e recuperação após falha App Check. Não criar perfil cliente com valores de plano/créditos.
- SDK lazy precisa ser observado em rede: ausência de Firebase na visita inicial; carregar somente ao abrir conta.
- Conferir o alinhamento do livro: fechado é 1448×1086, os outros 1200×900. Proporção igual não implica a mesma posição da lombada. O CSS inicial usa o mesmo contain para todos e pode produzir salto. Ajustar por frame sem cortar capa ou colidir com texto/CTA.
- O CSS novo é inicial e convive com overrides antigos. Corrigir a causa da disputa de seletores em vez de acumular remendos indiscriminados.
- Ainda não houve execução dos testes do site, build completo, revisão de diff ou validação visual desta rodada.

## 6. Backend: já houve mudanças remotas

Arquivos no app canônico:

- `functions/academyFreeMaterial.js`: `completeAcademySignup` e `prepareAcademyFreeDownload`.
- `functions/index.js`: exporta somente essas duas novas operações em acréscimo ao conteúdo já existente.
- `functions/tests/academy_free_material_test.js` e `functions/tests/stage_academy_free_material_test.js`: dez testes no total, com dependências injetadas.
- `functions/scripts/stage_academy_free_material.js`: staging privado idempotente por hash.

**Verificado pelo agente de backend:** dez testes passaram, syntax checks passaram, guard de topologia e linhagem passaram. Um checkout de release isolado foi criado a partir de HEAD descendente do baseline, commit `7aa09605`; guard `--release` e predeploy editorial passaram. O log registrou criação bem-sucedida de ambas as Functions e `Deploy complete!` em 14/09/2026. Log local: `C:\Users\medic\Desktop\academy-free-functions-deploy.log`.

Confirmação final do agente: ambas estão `ACTIVE`, runtime Node.js 24. Smoke remoto retornou OPTIONS 204 com CORS para Sites e chamadas sem Auth/App Check retornaram 401 UNAUTHENTICATED. Endpoints: `https://us-central1-auscultoapp.cloudfunctions.net/completeAcademySignup` e `https://us-central1-auscultoapp.cloudfunctions.net/prepareAcademyFreeDownload`.

Não exponha o log completo publicamente; contém detalhes operacionais. Não imprima tokens de Firebase/gcloud. `firebase login:list --json` pode retornar credenciais: não enviar sua saída bruta para logs ou conversa.

### Contrato implantado

- `completeAcademySignup`: Auth + App Check; recebe nome, role explícita `student`/`doctor`, `acceptedTerms: true`, `marketingConsent` opcional. Cria `users/{uid}` em transação apenas se ausente. Conta existente não tem plano, créditos ou histórico redefinidos.
- `prepareAcademyFreeDownload`: recebe somente `{ materialId: "enamed-2026-comentado" }`. Auth não anônimo, conta habilitada, sessão não revogada, perfil existente. Não exige PRO nem e-mail verificado.
- Config remota: `app_config/academy_free_materials_v1`, publicada habilitada.
- Limite: seis autorizações por usuário em 15 minutos; URL assinada com validade de cinco minutos. Path e arquivo são definidos pelo backend, nunca pelo cliente.
- Material privado já enviado, sem token público de Firebase Storage. Leituras anônimas via GCS e Firebase retornaram 403.
- PDF original: `C:\Users\medic\Downloads\AUSCULTO_ENAMED_2026.pdf`.
- Nome de download: `Ausculto_ENAMED_2026_Comentado.pdf`.
- Tamanho: **22.866.737 bytes**; 124 páginas informadas e usadas na apresentação.
- SHA256: `7d68fef9b145d69b185bb8e435ca860fae57e36cb1ac8208cfdafd02cadc8172`.
- Objeto: `academy_free_materials/enamed-2026-comentado/7d68fef9b145d69b185bb8e435ca860fae57e36cb1ac8208cfdafd02cadc8172.pdf` no bucket `auscultoapp.firebasestorage.app`.

### Remoto confirmado e pendente

- Domínio `ausculto-academy.arthurfe.chatgpt.site` adicionado aos domínios autorizados de Auth preservando existentes.
- Email/senha, Google e Apple habilitados, confirmado por API.
- Config App Check reCAPTCHA V3 existente, TTL 24 horas. Chave pública usada veio da configuração local: confirmar correspondência e allowlist de domínio reCAPTCHA pelo teste real. **Não desativar App Check para a prévia passar.**
- **Bloqueio IAM ainda aberto:** runtime Gen2 usa `510161004194-compute@developer.gserviceaccount.com`; teste inicial de `signBlob` retornou 403. Antes de receber a instrução de parada, o agente concedeu `roles/iam.serviceAccountTokenCreator` **somente no recurso dessa própria service account, para ela mesma**, preservando bindings e etag existentes. A alteração retornou 200; a verificação imediatamente posterior ainda retornou 403. Revalidar após propagação e investigar se persistir. Não duplicar a concessão nem ampliar para todo o projeto por conveniência. Não houve download autenticado validado após essa alteração.
- Login real, popup Google/Apple, conta gratuita nova, recuperação de senha, App Check no domínio Sites e download real **NÃO foram confirmados ponta a ponta**. Deploy bem-sucedido não resolve essa pendência.
- Preservar operações PRO existentes e suas regras de e-mail verificado. Não tocar assinatura/histórico/persistência do app para facilitar o novo fluxo.

## 7. Guardas do repositório e arquivos alheios

Antes de editar app/Functions, no diretório canônico:

```powershell
npm run verify:repo-topology
git merge-base --is-ancestor 894513e57c9f4912482836af000557b9406b260a HEAD
```

Se a linhagem falhar, parar nesse checkout. Antes de build/deploy app/Functions executar também `npm run verify:repo-topology -- --release`. Não desativar guardas nem falsificar marcador de raiz. Usar checkout limpo isolado quando necessário; o release existente merece inspeção, não deve virar nova fonte canônica silenciosa.

Há alterações anteriores NÃO relacionadas em ambos os repositórios. No site: `embaixadores/`, `firebase.json`, documentação de deploy e outros. No app: regras, lifecycle, arquivos de app e outras features. Não usar `git add .`, não limpar/resetar tudo, não publicar Functions indiscriminadamente e não reverter trabalho de terceiros. Muitos fontes do site estão untracked; “untracked” não significa descartável.

## 8. Sequência sugerida de conclusão

1. Ler fontes e instruções; registrar `git status` e diferença inicial. Não reconstruir a página do zero.
2. Resolver os bloqueios da seção 5 e copiar os seis assets conforme tabela.
3. Rodar syntax checks e build. Corrigir estrutura HTML, allowlist e links antes da inspeção visual.
4. Desktop: comparar em 1440 e no enquadramento da referência; validar 1920 e 2800 para escala. Primeiro background, depois shapes, pessoas, HTML. Não gerar novos personagens se os atuais puderem ser corretamente integrados.
5. Mobile: aplicar a organização fechada, com 16–20 px de margens, corpo 16 px, secundário 14 px, títulos 26–30 px, CTA de pelo menos 52 px. Não usar alturas rígidas que cortem texto.
6. Livro: mouse abre/fecha, toque alterna com indicação, Enter/Espaço alternam, Escape fecha, estado/nome acessível. Download é ação separada. Falha de frame mantém capa e CTA funcionais.
7. Resolver e validar a integração remota de conta/download, incluindo IAM e App Check. Exercitar usuário novo, existente, gratuita sem e-mail verificado, sessão expirada, revogada/desabilitada, link vencido, logout, recarga e provedores existentes.
8. Rodar testes relevantes e revisar o diff. Registrar evidência local separada da remota.
9. Regenerar o pacote do mesmo Site e atualizar somente a prévia privada. Conferir todas as rotas/assets e fluxo publicado antes de entregar como concluído.

### Comandos existentes do site

No diretório `ausculto-landing-deploy`:

```powershell
npm run test:academy-content
npm run test:academy-presentation
npm run test:enamed-continuous
npm run test:tracking
npm run build:academy-preview
npm run verify:site
npm run verify:enamed-continuous
node --check scripts/academy-product.mjs
node --check scripts/academy-landing.mjs
node --check scripts/academy-account.mjs
node --check site/assets/js/academy-book.js
node --check site/assets/js/academy-account-loader.js
node --check site/assets/js/academy-account.js
```

Se o Node tratar o último arquivo ESM como CommonJS devido ao package.json, verificar sintaxe pelo parser em modo módulo; não converter o SDK para scripts globais apenas para contornar o comando.

Teste backend no app canônico: `node --test functions/tests/academy_free_material_test.js functions/tests/stage_academy_free_material_test.js` e syntax check dos JS tocados. Não repetir upload/deploy só para executar teste local. O `npm ci` do release reportou 29 vulnerabilidades herdadas; não foram feitos upgrades de dependências fora do escopo.

Servidor de QA próprio, após build: `node scripts/serve-academy-preview.mjs ../ausculto-academy-sites-preview/out 4189`. Verificar a URL/porta anunciada pelo script. No Windows, se iniciado em background com Start-Process, usar `-WindowStyle Hidden`. O script suporta `?textScale=2` para inspeção de texto ampliado; isso não substitui teste de zoom/acessibilidade.

### Matriz de aceite

- 320, 360, 375, 390, 414, 430, 768, 1440, 1920 e 2800 px; texto 200%; sem overflow horizontal da página. Tabelas clínicas com rolagem própria.
- Menu, foco, seleção/busca/área canônica, nove resultados iniciais, expansão progressiva e vazio honesto; 69 IDs preservados.
- Zoom de imagens por teclado, Escape, retorno de foco, FAQ.
- Capas inteiras: espiral, base, lombada; sem cortes acidentais.
- Não carregar simultaneamente background desktop/mobile nem os dois SDKs; observar rede. Se otimizar formato de imagem, preservar fontes originais e alpha.
- Contratos `?returnTo=academy-summary:<summaryId>`, UTMs e consentimentos preservados.
- Artigos clínicos, tabelas/referências e conteúdo ENAMED permanecem intactos. Nenhum PDF privado, candidato editorial ou caminho local no pacote público.

## 9. Publicação e próximo passo após finalizar

O último Site publicado continua na versão anterior, commit **`f43634d77dcaef8a618174a11fe1248c489f901d`** do checkout `ausculto-academy-sites-preview`. A reconstrução atual NÃO foi montada/publicada no Sites.

O pacote é gerado por `npm run build:academy-preview`, com `out/` e `preview-manifest.json`. `.openai/hosting.json` já identifica o único projeto e `static.directory: out`. Reutilizar. Preservar noindex e canonicals de produção.

Se ferramentas Sites estiverem disponíveis no Antigravity, ler as skills locais `C:\Users\medic\.codex\plugins\cache\openai-bundled\sites\0.1.57\skills\sites-building\SKILL.md` e `sites-hosting\SKILL.md`; usar o fluxo oficial de credencial temporária, push do SHA, save version, deploy **privado** e confirmação de status terminal. Nunca colocar credenciais em arquivos, URLs Git ou neste documento.

Se o Antigravity não tiver o conector Sites, concluir/testar localmente, gerar pacote e registrar o SHA/manifesto. Entregar ao Codex para atualizar o mesmo Site. Não criar hospedagem ou projeto substituto para contornar ferramenta ausente. O build local não equivale à publicação.

Após prévia aprovada e fluxo real validado, o próximo passo é revisar acesso real ao catálogo/leitura/download no aplicativo e então preparar a divulgação pública em ação separada. Preservar Firebase Hosting atual, domínio principal, embaixadores e campanhas. Não substituir a campanha ENAMED antiga silenciosamente. Não reabrir revisão clínica já concluída.

## 10. Relatório de saída esperado do próximo agente

Entregar link da prévia (ou pacote pronto, caso conector ausente), arquivos alterados, testes executados com resultados, screenshots desktop/mobile, verificação do fluxo de conta/download, riscos restantes e próximo passo. Informar claramente o que não foi validado em runtime. Não usar “concluído” enquanto houver asset ausente, login não funcional ou download apenas ilustrativo.
