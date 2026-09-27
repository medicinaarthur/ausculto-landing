# PRO, ciclo de estudo e ferramentas clínicas

Implementação local do plano aprovado. Produção não publicada.

## Resultado

- PRO usa exclusivamente `1.png`, `3.png`, `4.png`, `5 (2).png`, sem alterar a tela dos celulares. Cortes de 1600/220/220/2400 ms, reinício de 160/60/220 ms, sem reprodução reversa. Imagens decodificadas antes do ciclo; suspensão fora da tela e em aba oculta. Texto e CTA preservados.
- Quatro poses do Dr. Aus geradas a partir de `Inspected image.png`. Masters 1024 × 1536 preservados na pasta local de produção, exports WebP transparentes de 680 px.
- Ciclo manual com estado único para pose, conteúdo, nós e circuito. Desktop em duas colunas; mobile/tablet com uma etapa, indicadores e anterior/próxima/recomeçar. Quatro conteúdos disponíveis sem JavaScript.
- Card clínico abaixo de Residência e ENAMED, que foram preservados. Indicadores usam `academy-product.json`. CTA acompanha o breakpoint real da Home: abaixo de 1024 px usa `#m-ferramentas`; a partir de 1024 px usa `#ferramentas`.
- ECG retorna imediatamente depois dos três temas em destaque, uma única vez, com os 18 módulos e destinos originais.

## Arquivos

- Renderizadores alterados: `scripts/academy-experience.mjs`, `scripts/academy-landing.mjs`, `scripts/academy-articles.mjs`.
- Renderizadores novos: `scripts/academy-journey.mjs`, `scripts/academy-clinical-card.mjs`.
- Controladores separados: `site/assets/js/academy-pro.js`, `site/assets/js/academy-journey.js`. Controladores antigos desses dois blocos removidos de `academy-experience.js`.
- Estilos específicos: `site/assets/css/academy-cycle.css`.
- Preparação reproduzível: `prepare-academy-pro-motion.mjs`, `prepare-academy-cycle-assets.mjs`, `prepare-academy-clinical-captures.mjs`.
- Assets: `site/assets/academy/pro-motion`, `study-cycle`, `clinical-tools`, cada conjunto com manifesto de origem.
- QA: `scripts/test-academy-cycle-runtime.mjs`, atualização do smoke `test-academy-experience-runtime.mjs`, captura `capture-academy-cycle.mjs` e revisão `build-academy-refinement-review.mjs`.

## Capturas atuais do app

Fonte: checkout canônico `commit-v1-premium-backport`, HEAD `46602081784000d56fb2368e52ee8279c58d4ded`, com o estado de trabalho existente do usuário.

Comando: `npm run flutter:canonical -- test --no-pub test/visual_atlas/atlas_tools_refresh_capture_test.dart`.

O teste renderizou o componente Flutter real de Ferramentas, com estado sintético de conta e sem operações remotas de assinatura. Tablet: captura lógica 1024 × 2000 em DPR 2, recorte superior 2048 × 1536. Celular: 390 × 2600 em DPR 2, recorte superior 780 × 1400. O enquadramento e a exportação não redesenham a interface.

O runner emitiu um aviso de checksum do cache de Montserrat-Black; concluiu com sucesso. A tipografia visível e os ícones das duas capturas foram inspecionados. Não houve mudança no app para esconder números da tela real.

## Validações

- Guard de topologia e linhagem do checkout canônico passaram.
- `node --check` nos renderizadores, preparadores, controladores e testes tocados.
- Build estático e verificação de correspondência entre fontes e artefato.
- Tracking passou; 27 testes de lapidação e 15 de correções passaram.
- Smoke existente de questões, simulados, bancas, navegação e modais passou em 390 e 1448 px.
- Matriz de 320, 375, 390, 430, 768, 1024, 1280, 1440 e 1920 px em Chromium, Firefox e WebKit.
- Sequência completa do PRO, ordem e tempos observados, saída/retorno à tela, evento de aba oculta, falha de imagem e retomada.
- Quatro etapas, cliques rápidos, resize, foco, movimento reduzido e conteúdo sem JavaScript.
- ECG único, 18 links de módulos, indicadores canônicos e destinos dos CTAs.
- Axe: zero violações nos três blocos em 320, 390, 768 e 1440 px. Altura do ciclo varia no máximo 1 px entre estados nessas larguras.
- Inspeção visual de todas as poses; tablet conferido separadamente para evitar personagem baixa demais dentro do card.

## Evidências e limites

Preview: http://127.0.0.1:4197/estudantes/

Revisão: `.local-art/academy-refinement/delivery/review.html`, com comparações, todas as poses, vídeos e capturas dos aparelhos. A comparação anterior usa registros já guardados na auditoria, identificados como tal.

Sem publicação, alteração de backend ou contrato de assinatura. Não foram testados aparelhos físicos, Safari em iPhone real ou autenticação/pagamento em produção. Firefox e WebKit foram executados pelos motores disponíveis no Playwright. A visibilidade da aba foi exercitada pelo evento e propriedade de documento em teste controlado; a saída da tela foi feita por rolagem real.

Os testes legados do hero/carrossel que ainda esperam controles removidos em rodadas anteriores não integram o aceite deste escopo. O novo teste cobre explicitamente o comportamento aprovado aqui.
