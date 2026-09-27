# Academy: dossiês impressos no livro

Implementação local em 27/09/2026. Sem publicação em produção e sem alterações no app Flutter, nas Functions ou no Firestore.

## Resultado e revisão pedida pelo usuário

O livro agora usa escrita gerada diretamente na superfície das páginas. São dez artes finais: uma abertura desktop e uma folha mobile para cada banca. O gerador recebeu o texto previamente definido; números e afirmações não foram delegados à invenção da imagem.

As páginas foram inspecionadas visualmente depois da geração. A primeira folha mobile do ENAMED foi rejeitada por recuo excessivo e texto pequeno; a versão final usa a largura da folha com maior legibilidade. As páginas não são fotografias do produto: são a apresentação editorial dos dossiês.

O folheio continua em DOM/CSS 3D/Web Animations API. As imagens são aplicadas às faces da folha, com máscaras e recorte no miolo. Capa, mesa e sombra de contato permanecem imóveis. Corrigido também o vazamento da metade estacionária sobre a página seguinte durante a virada.

Headline, navegação, cinco marcadores, CTAs, fontes e prática são HTML. Cada arte possui um conteúdo equivalente em HTML para leitor de tela e o controle **Versão em texto** abre uma leitura selecionável e ampliável. Na ausência da imagem, esse texto aparece no lugar dela. Sem JavaScript, os cinco dossiês continuam disponíveis.

O mobile é uma coluna legível e, por isso, a seção tem mais altura que a preview artística. Não há redução da seção inteira para caber em uma tela.

## Comportamento entregue

- Bancas na ordem ENAMED, USP-SP, SUS-SP, Einstein e UNIFESP; ENAMED inicial.
- Troca manual, com 780 ms no desktop e 560 ms no mobile. O último pedido prevalece em cliques rápidos. Resize conclui a troca; reduced motion remove o folheio.
- Tabs com navegação por setas/Home/End e ativação por Enter/Espaço. Sem autoplay.
- Prática com três questões por banca, confirmação da alternativa, comentário, progresso, resultado, revisão e retorno ao cadastro real do app.
- Estado temporário em memória. Não promete salvar respostas na conta ou prever aprovação.
- Conteúdo da prática buscado somente ao abrir o diálogo. Outras artes de banca carregadas quando solicitadas; nenhum Firestore é consultado pelo navegador.
- Tracking pelo mecanismo existente, sujeito ao consentimento. Parâmetros de campanha permitidos são preservados; respostas não vão para a URL.

## Home

Preservada a composição aprovada do hero. Foram alterados os indicadores e a explicação da Biblioteca:

| Indicador | Legenda |
|---|---|
| 70 mil+ | questões no banco |
| 280+ | calculadoras médicas |
| 5.255 | bulas |
| 10 mil+ | doenças catalogadas |
| 140 mil+ | interações medicamentosas |

A Biblioteca é descrita como conteúdo clínico estruturado com referências científicas. DOI é mencionado com a ressalva de disponibilidade, sem afirmar revisão editorial uniforme ou equivalência pública com outro produto.

## Dados e fontes

Os dados de produto remotos foram consultados em modo somente leitura. A landing recebe snapshots estáticos, sem credenciais. Exportações brutas permanecem em `.local-art`, fora de `dist/site`.

- Biblioteca: 10.038 registros; interações: 141.118 registros.
- Questões de residência: 14.345 documentos e 14.111 combinações distintas de prova/número. O novo hero apresenta o piso conservador **14 mil+ questões comentadas**, sem transformar duplicatas em aumento do indicador.
- Einstein 2026 tem 145 documentos e 75 números distintos. A prática usa a edição 2025 para não escolher silenciosamente entre duplicatas conflitantes.
- O número comercial de 70 mil+ é o banco mais amplo informado pelo responsável pelo produto, não a contagem da coleção de questões de residência e não o número de usuários.
- ENAMED 2026: 100 questões, cinco horas. O status preliminar dessa edição está registrado nas fontes; a prática usa questões de 2025 com gabarito definitivo.
- Não há barras de incidência ou pesos empíricos apresentados como regras oficiais. “Como cobra” e “Comece por” são orientações editoriais, sem promessa estatística.
- A presença de UNIFESP no acervo não é apresentada como integração com o catálogo curado do gerador.

Fontes institucionais usadas incluem a [comunicação oficial do ENAMED 2026](https://www.gov.br/hubrasil/pt-br/comunicacao/noticias/provas-objetivas-do-enare-e-enamed-serao-aplicadas-neste-domingo-13), o [edital USP/FUVEST 2026](https://www.fuvest.br/wp-content/uploads/rm2026_edital_03-2025.pdf) e o [edital Einstein/Vunesp](https://documento.vunesp.com.br/documento/stream/NzE1MDkyMA%3D%3D). As fontes por banca constam em `scripts/data/academy-dossiers.json` e no diálogo público.

As quinze amostras são identificadas por banca, edição, número e ID no manifesto. Enunciados e alternativas foram preservados. Os comentários são trechos contínuos do acervo; não foi realizada revisão médica independente. Hashes do conteúdo selecionado estão em `scripts/data/academy-practice-provenance.json`.

## Assets e manutenção

Foi usado o gerador/editor nativo `image_gen.imagegen` para cenário, material do livro e impressão das páginas. Prompts completos das dez impressões, arquivos de origem, estado de revisão e hash do texto estão em **`scripts/data/academy-dossier-prints.json`**. Os scripts de preparação recusam texto alterado sem atualização da arte correspondente.

| Arte | Fonte nativa final | Saída publicada |
|---|---|---|
| Cenário desktop | 1586 × 992 | AVIF/WebP responsivos |
| Cenário mobile | 941 × 1672 | AVIF/WebP responsivos |
| Aberturas impressas | 1495 × 1052 | `print-{banca}-desktop.webp` |
| Folhas impressas mobile | aproximadamente 726–735 × 2139–2167 | `print-{banca}-mobile.webp` |
| Capa e folha | masters com transparência | `book.webp`, `leaf.webp` |

Os masters estão em `.local-art/academy-dossier/masters`; os derivados em `site/assets/academy/dossier/`. A resolução nativa foi preservada, sem declarar upscale como detalhe real. As folhas mobile têm aproximadamente 2× a resolução de uso usual; teste em DPR 3 não significa que o master contém detalhe nativo 3×.

Decisão de manutenção: textos impressos não podem mudar apenas no JSON. É necessário regenerar a página afetada, conferir conteúdo e legibilidade e atualizar o manifesto. A versão textual permanece a alternativa adequada para seleção de texto e ampliação tipográfica.

## Arquivos

Fontes principais alteradas: `scripts/academy-hero.mjs`, `scripts/academy-articles.mjs`, `scripts/build-site.mjs`, `scripts/data/academy-product.json`, `site/index.html`, `site/assets/css/academy-hero.css`, `site/assets/js/academy.js`, `scripts/test-site-facts.mjs` e `package.json`.

Novos módulos: `site/assets/js/academy-dossier.js`, `scripts/data/academy-dossiers.json`, `scripts/data/academy-practice-provenance.json`, `scripts/data/academy-dossier-prints.json`, `scripts/export-dossier-source.mjs`, os três scripts `prepare-academy-*` específicos do dossiê/prática, `scripts/test-academy-dossier.mjs`, `scripts/test-academy-dossier-runtime.mjs` e `scripts/capture-academy-dossier.mjs`.

O servidor local `scripts/serve-academy-preview.mjs` recebeu MIME AVIF e gzip para textos, para não medir a página inteira artificialmente sem compressão. Isso não modifica o Hosting.

O repositório já tinha numerosas alterações e arquivos não rastreados. A base anterior deste trabalho está em `.local-art/academy-dossier/baseline`; o diff foi comparado com essa base, sem reset, limpeza ampla ou reversão de trabalho anterior. O HTML gerado não foi editado manualmente.

## Validação realizada

| Verificação | Resultado |
|---|---|
| `node --check` nos 13 scripts JS/MJS tocados/adicionados | passou |
| `test:academy-dossier` | 5/5 |
| Runtime específico Chromium | 21/21 |
| Runtime específico Firefox | 14/14 |
| Runtime específico WebKit | 14/14 |
| `test:tracking` | passou |
| `test:site-correction` | 15/15 |
| `test:site-lapidacao` | 27/27 |
| `test:site-correction-runtime` | 62/62; 93 capturas |
| `build:site` e `verify:site` | passaram; artefato verificado |
| axe no novo hero e diálogo de fontes | nenhuma violação encontrada nos escopos testados |

Foram verificados 320, 360, 375, 390, 430, 768, 1024, 1280, 1448 e 1920 px; DPR 1/2/3 em larguras representativas; cinco bancas; quinze questões; acertos e erros; review; reabertura; foco; teclado; resize durante virada; reduced motion; falha de fetch da prática e recuperação; JavaScript desativado; ausência de overflow. A folha impressa não refluí tipografia: ampliação textual usa a versão HTML.

**Falha preexistente conhecida:** `test:site-runtime` tem 44 aprovações e duas falhas que procuram o seletor antigo `#sim-bank`. O gerador atual usa o contrato de quatro etapas com `data-sim-bank`. A mesma falha já está documentada em `docs/home-hero-implementation.md`. Não foi ocultada nem atribuída ao novo hero; a suíte atual de correções do site validou o fluxo vigente.

## Performance: medições e limite ainda existente

Payload dos três assets selecionados do hero em DPR 1: aproximadamente **297 KB no mobile** e **364 KB no desktop**. Não inclui CSS/fontes/JS nem os outros blocos da página. As outras nove artes não são baixadas no carregamento inicial. A versão de prática não é carregada antecipadamente.

Captura local sem limitação de rede/CPU: LCP 520 ms e CLS 0 em 390 px; LCP 1036 ms e CLS 0,035 em 1448 px. Esses valores são de localhost, não dados de usuários nem prova de desempenho em rede móvel.

Lighthouse mobile 13.5, viewport 412 × 823, DPR 1,75, CPU 4×, rede simulada de aproximadamente 1,6 Mbps e RTT 150 ms, servidor local com gzip e cache desativado:

- Performance: **62**; acessibilidade da página completa: **97**.
- LCP: **7,7 s**; TBT: **340 ms**; CLS: **0**.

**A meta de carregamento móvel rápido ainda não está comprovada.** O relatório aponta atraso de renderização, dez folhas CSS bloqueantes e trabalho de layout da página completa, além de imagens dos blocos seguintes. Foram adicionadas descoberta antecipada do material do livro e prioridades apropriadas; não foi feita uma reestruturação ampla dos blocos antigos para maquiar essa medição. A publicação precisa considerar essa limitação. A medição inicial sem gzip (9,9 s de LCP) foi preservada e identificada como condição diferente; não é um baseline de produto antes da implementação.

As falhas de acessibilidade restantes do Lighthouse estão em componentes anteriores fora do novo hero (contraste de cards demonstrativos e nome acessível da marca). O hero passou na verificação axe de seu próprio escopo.

## Entrega local

- Preview: `http://127.0.0.1:4197/estudantes/`.
- Home: `http://127.0.0.1:4197/`.
- Comparação interativa lado a lado/sobreposição: `.local-art/academy-dossier/delivery/comparison.html`.
- Capturas: `1448-viewport.png`, `390-hero.png`, dez estados das bancas, versão em texto, prática e midpoint da virada no mesmo diretório.
- Gravações: `1448-page-turn.webm` e `390-page-turn.webm`.
- Relatórios de navegador: `.local-art/academy-dossier/qa/`.
- Lighthouse e métricas locais: `.local-art/academy-dossier/delivery/`.

Não testado: iPhone/Android físicos, métricas de campo, criação real de conta ou eventos recebidos em produção. WebKit emulado não foi tratado como iPhone real. Nenhum deploy foi executado.
