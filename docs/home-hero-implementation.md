# Hero Ausculto — implementação e revisão visual

## Resultado atual

Último refinamento: “10.000 patologias” foi substituído nas quatro ocorrências da Home. Na faixa: “Biblioteca clínica / Ciência aplicada à prática”; no catálogo: “Diagnóstico e tratamento com referências científicas, links e DOI”. O modelo local `PatologiaReference` tem campos `doi` e `url`; não foi auditada a cobertura de referências de todo o acervo remoto e a copy não afirma universalidade. Ajustado o tamanho do título qualitativo na faixa desktop.

A sobreposição da questão teve o canto superior direito recuado de x=1157 para x=1154 nas coordenadas do master. Adicionado reflexo âmbar difuso, estático, em SVG restrito à borda do aparelho; sem nova imagem, movimento ou camada sobre o texto. Teste inicial com borda marcada foi rejeitado por parecer um segundo contorno. Pesquisa: [Apple, materialidade e reflexos](https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/). Evidências antes/depois em `.local-art/home-hero-light/`. Build, tracking, testes estruturais, smoke Chromium/WebKit e axe passaram nesta rodada; layout da nova copy conferido em 360, 390, 1280, 1672 e 2250 px. Sem deploy ou teste físico.

Refinamento desta rodada: telas desktop originais sobrepostas à arte por projeção determinística, preservando chassis, notch e sombras de contato; faixa inferior removida do HTML e do bitmap (corte em y=866). O mobile mantém exatamente as imagens e o crossfade aprovados, com maior entrelinha e espaçamento, CTA “Começar grátis”, “Sem cartão” secundário e seletor com superfície deslizante de 320 ms. A legenda demonstrativa foi retirada.

As capturas originais estão em `design/home-hero-v2/plantao.png` e `prova.png`. `python scripts/prepare-home-hero-screens.py` (Pillow e numpy) faz a projeção em coordenadas da arte, quatro pixels por unidade, antes de `node scripts/prepare-home-hero-assets.mjs`. O script preserva integralmente os textos das capturas. Os interiores são WebP separados: até 996/952 px de largura, 167/237 KB; cenário 106 KB. As versões menores servem DPR 1. O orçamento desktop Retina passou a 550 KB para priorizar a nitidez solicitada; mobile não recebe essas camadas.

Referências de refinamento: [Linear — hierarquia mais calma e separações sutis](https://linear.app/now/behind-the-latest-design-refresh) e [Apple — controles segmentados](https://developer.apple.com/design/human-interface-guidelines/segmented-controls). A identidade e a composição continuam derivadas das previews do Ausculto.

Baseline específico desta rodada: `.local-art/home-hero-polish/`. Captura desktop 2250 px em DPR 2 e detalhe sem redimensionamento: `desktop-retina.png` e `retina-detail.png` nessa pasta. Inspeção ampliada eliminou o resíduo do cabeçalho gerado na transição para a barra de status. A moldura física permanece no cenário e tem sua resolução original; a interface dentro dela é a captura real em alta resolução.

Implementado em `site/index.html`, `site/assets/css/home-hero.css` e `site/assets/js/home-hero.js`. Build estático em `dist/site`. Sem commit e sem publicação.

Após a revisão do usuário, o cenário, a perspectiva dos aparelhos e suas sombras de contato passaram a ser uma composição artística única. A versão desktop deriva diretamente da preview aprovada: aparelhos no mesmo enquadramento e apoiados na mesa, caneca na borda e área livre para os benefícios. O conector central é SVG real, com textos em arco e linhas douradas. Headline, navegação, CTAs e benefícios continuam HTML.

Mobile usa dois cenários específicos com painéis de interface sem chassis de telefone. As tabs fazem crossfade voluntário de 240 ms e trocam os benefícios. Estado inicial: Na prova. Sem autoplay, sem swipe obrigatório, sem ampliação e sem modal. O segundo contexto permanece visível dentro de cada composição.

Os cenários e painéis mobile foram produzidos no gerador incorporado usando as previews e as capturas do produto como entradas. No desktop, a UI gerada é coberta pelas capturas reais. O texto completo da questão HCPA é consideravelmente mais longo que o da interface ilustrada na referência; nessa escala, o hero comunica o contexto e não serve como leitor integral da questão.

## Arquivos e procedência

- Masters finais: `design/home-hero-v3/`.
- Exportações publicadas: `site/assets/home/hero-v3/`, com manifesto de hashes, dimensões e peso.
- Exportação reproduzível: `scripts/prepare-home-hero-assets.mjs`.
- Pacientes: captura fornecida de `02-pacientes__celular-escuro.png`, com paciente demonstrativo e sepse urinária.
- Questão: `questions/IZgMmZL68YM3a4eDCx2e`, HCPA 2024/74, alternativa C. Conteúdo remoto foi congelado em fixture de captura no repositório Flutter.
- Captura Flutter: `test/visual_atlas/atlas_home_hero_capture_test.dart` e `test/visual_atlas/fixtures/hero_hcpa_2024_74.json`. Não houve alteração da interface de produção do app.
- Imagens rejeitadas e exports anteriores foram preservados fora da pasta publicada, em `design/retired-public-hero-v2/` e `.local-art/home-hero-v2/rejected/`.
- Backups anteriores ao trabalho: `.local-art/home-hero-v2/baseline/`. Diff contra essa base: `.local-art/home-hero-v2/implementation.diff`.
- Integração pontual: seletores do hero nos controladores existentes `home.js` e `home-m.js`; scripts de preparação/QA e dependências de desenvolvimento no `package.json`.

## Comportamento e carregamento

Tabs com teclado, `aria-selected`, `tabpanel` e foco estável. Conteúdo sem JavaScript continua disponível. `prefers-reduced-motion` elimina a transição. Imagens com falha exibem descrição e podem recuperar-se quando a conexão retorna. O espaço das tabs e das cenas já fica reservado antes de o script chegar, evitando mudança de altura na inicialização.

Fontes locais DM Serif Display e Inter. Imagens AVIF/WebP com `srcset` e fontes condicionadas ao breakpoint, sem download da composição desktop no mobile. Preload foi direcionado à imagem identificada como LCP na medição; os assets antigos não são mais referenciados.

Pesos máximos AVIF: cenário desktop 107 KB; mobile: atmosfera 44 KB e os dois estados 133/139 KB. Não há biblioteca de animação em runtime. O desktop estreito reorganiza textos acima de uma cena central; os aparelhos permanecem apoiados na mesma superfície.

## Validação

- JavaScript alterado: `node --check`, aprovado.
- Testes estruturais e de orçamento do hero: 3 aprovados.
- Tracking: aprovado.
- Correções do site: 15 aprovadas.
- Build e verificação do artefato: aprovados.
- Chromium: 15 viewports de 320 a 2250 px; dois estados mobile; DPR 1/2/3; teclado; menu; retenção do estado; falha/recuperação de imagens; ausência de JavaScript; movimento reduzido; estabilidade com script atrasado.
- Firefox e WebKit: quatro viewports representativos, estados e os mesmos fluxos principais. Nenhuma violação nos audits axe do hero/header em 390 e 1672 px.
- Capturas reais e relatórios: `.local-art/home-hero-v2/qa/`.
- Comparação lado a lado e overlay desktop de 50%: `.local-art/home-hero-v2/review/`.
- Revisão visual independente: sem bloqueador para os defeitos apontados pelo usuário; confirmou apoio/sombras, ângulos, benefícios afastados da caneca, conector central e remoção da ampliação.
- Flutter: captura e análise pontual aprovadas. O teste emitiu aviso de cache de Montserrat-Black; a captura foi inspecionada. Sem alteração de assets empacotados ou renderer de produção do app.

## Limites reais da validação

Medição Lighthouse anterior a este refinamento (não repetida nesta rodada): servidor local com gzip de texto, preset mobile padrão/Slow 4G e CPU simulada: performance 90, acessibilidade 100, FCP 1,7 s, LCP 3,5 s, CLS 0, TBT 60 ms. **A meta de LCP de 2,5 s não foi atingida.** O resultado não representa dados de usuários reais nem comprova performance do hosting em produção. Há CSS compartilhado da Home ainda bloqueando a renderização; uma otimização adicional desse carregamento é necessária para fechar a meta.

A suíte geral do site teve 44 aprovações e duas falhas nos testes de simulados que ainda procuram `#sim-bank`; o gerador atual usa outro contrato. Essa área não foi alterada neste trabalho. Os testes específicos do hero passaram.

Firefox sem JavaScript teve o comportamento verificado; sua captura sem JS foi omitida porque a promessa de fontes do driver não resolve nesse modo. Há capturas sem JS em Chromium e WebKit. Não houve teste em iPhone/Android físico nem deploy de hosting. A Home preserva o fluxo existente de consentimento; a Function de consentimento não roda no servidor estático local.
