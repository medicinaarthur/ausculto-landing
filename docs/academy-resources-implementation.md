# Recursos da Academy — entrega local

## Resultado e limites

### Revisão de conteúdo e interação — 27/09, segunda rodada

- Removido o painel de contexto de todos os cards: não existe mais texto translúcido sobreposto ao enunciado. A identificação permanece no rodapé.
- Mouse: hover, foco por clique e roda vertical não pausam. Foco por teclado, toque, roda horizontal, diálogo, pausa explícita e visibilidade continuam controlando o movimento.
- Trilha de entrada recomposta em HTML com a cena do arquivo original, título, descrição e progresso; não é uma captura inteira miniaturizada dentro de outra moldura.
- Caio usa o personagem original do app. Frente: enunciado resumido fiel à captura; verso: quatro alternativas completas, com D assinalada. O texto integral e a origem estão no manifesto.
- Três amostras verificadas por leitura pontual do Firestore `questions`: `usp_sp_2026_q034`, `enamed_2025_caderno_1_q034`, `einstein_2025_q072`. Banca, ano, número, enunciado, opções e gabarito vêm dos documentos. Os comentários são trechos do acervo, sem síntese clínica nova. ENAMED é identificado como ENAMED, não como prova de residência.
- Questões viram na passagem central e retornam após 6,5 s. Controle manual “Ver comentário” / “Ver alternativas” prevalece até o card sair da vitrine; também funciona com movimento reduzido. Links continuam levando à entrada do app.
- Novos arquivos: `scripts/export-academy-resource-questions.cjs`, `scripts/data/academy-resource-questions.json`, `scripts/test-academy-resource-faces.mjs`. O preparador verifica a procedência dos trechos para impedir divergência silenciosa.
- Validação: 14 testes selecionados; runtime com hover, roda vertical e foco de mouse; frente e verso de todas as novas composições em 390/1440, sem sobreposição ao rodapé. Evidências em `.local-art/resources/qa/faces/`.

24 cards: 22 Academy e dois extras identificados (AusAnatomy e AusFlow). A revisão solicitada pelo usuário aumentou a Trilha de quatro para seis cards, reduzindo Questões e simulados a três e Plano de estudos a um. As sete ferramentas permanecem representadas. A curadoria alterna interfaces claras, histologia rosa, retinografia âmbar, exames escuros e flashcards coloridos.

O card de entrada da Trilha preserva a interface completa. Caio, Helena, feedback e resultado foram recompostos como UI de atividade, não cenas cinematográficas. Masters e prompts: `art-source/academy-resources-v2/README.md`. As prévias geradas são identificadas como ilustradas. Outras interfaces compactas usam trechos e valores das capturas de demonstração, com identificação de demonstração. Nenhum exame foi sintetizado.

Dimensões: desktop 304 × 228 px, gap 24 px, desnível 56 px; celular 220 × 165 px, gap 16 px, desnível 32 px. A proporção é 4:3. A rolagem pertence apenas à vitrine; não há overflow horizontal do documento nos tamanhos testados.

Revisão final: oito colunas com três cards em cada, sem barra de rolagem visível. Movimento de 13,5 px/s no desktop e 9,8 px/s no celular; a referência Muzli foi medida em aproximadamente 13,44 px/s (animação de fundo de 180 segundos). Hover revela contexto dentro do card e não pausa. Pausa explícita, foco, toque, diálogo, aba oculta e seção fora da tela continuam disponíveis. Flashcards entram pela pergunta, só viram depois de uma passagem central observada e restauram a frente após 2,6 segundos; navegação manual, redimensionamento e reentrada na seção reiniciam a exposição. Esta revisão substitui o comportamento original de manter a resposta por toda a passagem.

Casos clínicos mostram o trecho de apresentação do caso “Edema Agudo de Pulmão no Idoso”, do atlas `desktop/academy/praticar-caso-sessao__light.png`. Questões e comentários têm grifos sobre trechos das capturas. O gráfico de desempenho usa as oito semanas da fixture `_FakePerformanceRepository`, em `test/visual_atlas/atlas_academy_part1_capture_test.dart`, com linha de acurácia em escala 0–100 e barras de volume; última semana: 26/32, 81%. São dados de demonstração, não métricas de um usuário. O plano mantém as atividades reais da captura: Missão do dia, Reforçar G.O. e Iniciar Trilha Clínica. ECG usa a imagem nativa de `ECG_V1`, sem controles da captura.

Links comuns continuam apontando para a entrada do app, com atribuição de campanha existente. Não há novas promessas de deep link. Os flashcards são locais, abrem diálogo e têm respostas nativas em `details` sem JavaScript. Nenhum visitante consulta Firestore para esta seção.

## Fontes e arquivos

- `scripts/academy-resources.mjs`: HTML, links, diálogo e fallbacks; chamado por `resourcesSection()` em `scripts/academy-product.mjs`.
- `site/assets/css/academy-resources.css` e `site/assets/js/academy-resources.js`: composição, movimento, pausa, flip e acessibilidade.
- `scripts/prepare-academy-resources.mjs`: seleção, recortes, interfaces compactas e variantes WebP.
- `scripts/data/academy-resources.json`: manifesto gerado, origens, hashes, recortes e ações por tipo.
- `scripts/data/academy-resource-compositions.json`: ordem, composição, destaques e dados das interfaces compactas, consumidos pelo preparador.
- `scripts/data/academy-resource-flashcards.json`: três documentos oficiais da coleção `flashcards`, `source=curated_flashcards_import_v1`, `is_custom=false`, com IDs e hashes; leitura remota realizada em 27/09/2026. Nenhum cartão particular foi exportado.
- `scripts/data/academy-resource-quiz-provenance.json`: origem dos exames remotos selecionados.
- `scripts/export-academy-resource-samples.cjs`: exportação pontual somente leitura; não faz parte do runtime da página.
- `scripts/academy-articles.mjs` e `scripts/build-site.mjs`: integração de assets e identidade do artefato.
- `scripts/build-academy-preview.mjs`: empacota também dependências públicas referenciadas, corrigindo omissões da lista anterior (favicon e assets compartilhados).

## Reprodução

```sh
node scripts/prepare-academy-resources.mjs
node scripts/build-site.mjs
node scripts/build-academy-preview.mjs
node scripts/build-site.mjs --verify
node --test scripts/test-academy-resources.mjs scripts/test-academy-presentation.mjs scripts/test-site-artifact.mjs
node scripts/serve-academy-preview.mjs dist/site 4196
# Em outro terminal:
node scripts/test-academy-resources-runtime.mjs
```

O preparador usa o atlas, o checkout do app, Downloads e amostras remotas locais. As três primeiras raízes podem ser configuradas por `AUSCULTO_ATLAS_ROOT`, `AUSCULTO_APP_ROOT` e `AUSCULTO_DOWNLOADS_ROOT`. Build normal usa os assets preparados e não exige credenciais. Não publicar `art-source` ou `.local-art` como conteúdo do site.

## Validação e ressalvas

Build, verificação do artefato, sintaxe dos JS tocados e 13 testes selecionados passaram. Runtime Chrome cobre 390/1440 px, movimento real, pausa manual/toque/fora da seção, entrada frontal e passagem central do flashcard, ciclo contínuo, diálogo, resposta, Escape, foco, campanha, continuidade no hover, contexto contido no card, movimento reduzido, exploração manual e ausência de JavaScript. Capturas foram produzidas em DPR 1, 2 e 3. Evidências locais: `.local-art/resources/qa/`.

O teste mais amplo `test-academy-articles.mjs` já contém uma expectativa desatualizada do hero (`academy-hero-background.png`), anterior a esta seção. Só suas expectativas referentes aos recursos foram atualizadas; a expectativa alheia ao escopo não foi mascarada.

Não houve deploy de produção. Mobile foi verificado por emulação Chrome, não em aparelho físico/Safari. Troca real de aba e todos os leitores de tela não foram validados manualmente. Histologia e ultrassom preservam a resolução original disponível; não foi inventado detalhe para compensar fontes pequenas.
# Atualização — 27/09/2026: depoimentos e publicação GitHub

- Removidos o rodapé promocional e o controle de pausa do mosaico. Hover continua sem interromper o movimento.
- Rodapés de imagens e flashcards usam navy/dourado; cartões navy usam creme/preto.
- Depoimentos após os recursos: retrato com moldura navy/dourada, nome, identificação, citação e indicadores. Rotação a cada 6,5 segundos; suporte a teclado, movimento reduzido e conteúdo sem JavaScript.
- Fontes das citações: `site/ads-estudante.html`. Publicados somente Loren Ferrarezi, Camila Menon e Guilherme de Lucio. Textos de Edivaldo e Diego e foto de Diego ainda não fornecidos; nenhuma citação inventada.
- Validação: 15 testes estáticos; runtime Chrome em 390/1440 px, hover, movimento, diálogos, faces, ausência de sobreposição, DPR 1/2/3 e fallback sem JavaScript. Build e exportação de preview conferidos. Home desktop e mobile e dependências das duas páginas conferidos também na cópia destinada ao GitHub.
- Destino: `medicinaarthur/landingpagesauscultoquadra`, branch `main`. Apenas artefatos públicos, preservando HTML das demais rotas. A home já coincide com a versão presente no repositório. Publicação no GitHub não configura hospedagem: esse repositório não possui GitHub Pages habilitado.
- Não validado em aparelho físico ou Safari. Os dois depoimentos restantes continuam pendentes de conteúdo confirmado.

