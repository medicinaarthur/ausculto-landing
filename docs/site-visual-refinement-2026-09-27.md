# Correção visual após feedback — 27/09/2026

## Escopo

Esta rodada corrige a composição dos cards da home e da Academy. Mantém fotos, livros e seus nove frames, conteúdo clínico, métricas comerciais, destinos, persistência dos leitores e taxonomia real. O app foi consultado somente para obter a marca existente da UNIFESP. Não há alteração do app ou de Functions.

## Correções

- **AusMind IA:** removido o `position:relative` indevido que sobrescrevia o posicionamento absoluto da logo e do quadro inferior. A logo volta à esquerda do título; o quadro de ECG/imagens permanece dentro do card. Marca de fundo mais discreta; brilho preservado.
- **AusFlow:** nova ilustração gerada com fundo transparente, prancheta marfim e detalhes dourados. Uso pequeno junto ao título, contrastando com navy. Ambas as fotos originais foram preservadas.
- **Curso ECG:** arte original gerada com referência no livro de Abdome: gravura anatômica, navy, marfim e dourado fosco. Sem roxo, brilho laranja ou texto incorporado. Tipografia editorial e botões compatíveis com os livros; coração inteiramente enquadrado no desktop. Mantidos os 18 módulos, CTA e independência do catálogo.
- **Bancas:** o brasão SUS-SP da faixa de marcas foi substituído pela UNIFESP. Máscara baseada no alpha da marca original, preservando janelas e letras. No celular, duas linhas de três marcas evitam redução excessiva. SUS-SP continua disponível normalmente no simulador.
- **Simulador:** Prova selecionada visivelmente ao entrar, conforme solicitado; composição, banca, assuntos e dificuldades continuam sem defaults ocultos. Etapas alinhadas ao topo, controle segmentado, duas modalidades de Prova explícitas. Seletores agora se abrem dentro do card, com busca, multisseleção temporária, confirmação, cancelamento/Escape e retorno do foco. A relação pai/filho e a limpeza de escolhas incompatíveis permanecem intactas. A prévia não gera questões nem transfere escolhas ao app.

## Geração de imagens

Ferramenta: geradora integrada `image_gen`, modo de edição com referência, sem API/CLI externo. Os prompts orientaram material e composição, não textos clínicos.

Direção do prompt ECG: usar o livro de Abdome como referência de paleta e acabamento; criar banner acadêmico original, navy profundo próximo de `#082b3d`, coração anatômico em gravura marfim/dourado fosco à direita, traçado fino, espaço negativo à esquerda; sem livro físico, títulos, logos, roxo ou estética de ficção científica.

Direção do prompt AusFlow: adaptar a prancheta/timer existente para ícone de aproximadamente 54 px sobre fundo navy; prancheta marfim, bordas e cronômetro dourados, formas claras e legíveis; alpha transparente real, sem bloco de fundo, chão, sombra externa ou texto.

Masters privados e hashes: `.local-art/visual-refinement-20260927/generated-assets.json`, `ecg-master.png`, `ausflow-master.png`. Conversão/resize WebP preservou os originais.

Assets servidos:

- `site/assets/academy/course/ecg-engraving-21c6cbcf984d-1536.webp` e variante 768.
- `site/assets/home/products/ausflow-concept-ivory-b953fdf334e5-256.webp` e variante 512.
- Marca UNIFESP e máscara versionadas em `site/assets/academy/banks/`; origem e hashes em `scripts/data/academy-correction-assets.json`.

## Arquivos de implementação

`site/index.html`; `site/assets/css/home-connected.css`; `site/assets/css/academy-corrections.css`; `site/assets/css/academy-library.css`; `site/assets/css/academy-sim-demo.css`; `site/assets/js/academy-sim-demo.js`; `scripts/academy-landing.mjs`; `scripts/academy-sim-demo.mjs`; `scripts/data/academy-correction-assets.json`.

Regressões cobertas em `scripts/test-academy-sim-demo.mjs`, novo `scripts/test-visual-refinement.mjs` e harness completo existente `scripts/test-site-correction-runtime.mjs`.

Mudanças concorrentes em `home-hero.css`/`home-hero.js` não pertencem a esta rodada e foram preservadas. O inventário de hashes anterior e o delta estão em `.local-art/visual-refinement-20260927/`.

## Evidências e limites

- Antes: `.local-art/correction-20260927/release-qa/` e `/live/`, referentes à publicação anterior.
- Depois: `.local-art/visual-refinement-20260927/context/` — ferramentas em contexto, ECG, livros, cards e lista aberta, larguras 390/768/1100/1440/1920.
- Matriz completa: `.local-art/visual-refinement-20260927/final-runtime/`, seis páginas em 360/390/768/1100/1440/1920, DPR 1/2/3, texto ampliado, teclado, persistência e consentimento.
- Testes unitários: 15/15 correção e 27/27 lapidação; tracking aprovado; sintaxe JS e manifesto verificados.
- No desktop de 1440 px: cards iniciais aproximadamente 717 px; lista de especialidades aberta aproximadamente 753 px, ambos com a mesma altura e sem corte de conteúdo.
- Primeira execução encontrou sobreposição da navegação com campos: corrigido o `flex-basis` do painel e repetidos os três percursos. A primeira captura do novo ECG também revelou corte do coração; corrigido o enquadramento e a transição do fundo.
- Chrome instalado em execução isolada. Não validado em aparelhos físicos ou Safari. Esta rodada não modifica conteúdo clínico nem representa revisão médica das artes promocionais.

## Publicação confirmada

Publicado exclusivamente em `hosting:site`, projeto `auscultoapp`, versão `f4f39a78dee05303`, com 753 arquivos. Guard e verificação de manifesto passaram antes do envio. Nenhum deploy de app, Functions, ENAMED ou parceiros.

- Matriz de regressão: **62/62 aprovadas**, 93 capturas. Após ela, somente o enquadramento/máscara do ECG foi refinado; o teste contextual completo de cinco larguras foi repetido no artefato final e em produção.
- Produção: **15/15 verificações aprovadas**, seis páginas com hash igual ao build, cache HTML correto, assets e recursos por hash, livros, notas persistentes, simulador e consentimento recusado sem chamadas de marketing. Variantes novas do AusFlow também conferidas byte a byte.
- Teste contextual em produção: 390/768/1100/1440/1920; posição da logo/chip, Prova inicial, escopo explícito, lista integrada, cancelar/aplicar, foco e limite de altura aprovados. Capturas em `.local-art/visual-refinement-20260927/live-context/`.
- Revisão independente somente leitura: sem Critical/Important. Identificou emenda horizontal no ECG em 768 px; corrigida com enquadramento específico de tablet e conferida novamente no domínio real.
- Antes/depois e resultados estruturados: `.local-art/visual-refinement-20260927/`; `deployment.json`, `live/report.json`, `live-context/report.json` e `final-runtime/report.json`.

Páginas: https://www.auscultoapp.com/ e https://www.auscultoapp.com/estudantes/.
