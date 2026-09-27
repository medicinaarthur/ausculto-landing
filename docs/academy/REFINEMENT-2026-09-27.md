# Academy — refinamento e correção da base INEP

## Resultado

Preservada a landing existente. Hero com cinco folhas impressas diferentes, marcas reais das bancas, seletor lateral no desktop e folha de calendário no mobile. Dados percentuais continuam em HTML, no mesmo plano da folha durante a animação. Texto integral acessível em “Versão em texto”.

Prateleira mobile com três capas e um detalhamento selecionado, abertura demonstrativa uma vez ao entrar na tela (desativada com movimento reduzido), ECG compacto, bloco PRO com fundo contínuo, rodapé reduzido e menu com descrição dos destinos. Imagens dos recursos e conteúdo da Trilha Clínica preservados. Recursos têm apresentação opcional de nove segundos, pausada por interação, foco, invisibilidade da aba ou preferência de movimento reduzido.

## Correção da análise ENAMED

O recorte exclusivo de 2025 foi retirado. Consulta remota somente leitura, em 27/09/2026:

| Coleção/caderno no índice do app | Registros exportados | Uso |
| --- | ---: | --- |
| ENAMED 2025, caderno 1 | 90 | Comparação de temas; dez itens excluídos/anulados conforme manifesto oficial do app |
| ENAMED 2026, caderno 1 | 100 | Gráfico da edição completa; temas e subtemas presentes; gabarito preliminar |
| Revalida 2025/1 | 86 | Evidência qualitativa; acervo parcial |
| Revalida 2025/2 | 100 | Evidência qualitativa, com sobreposição ao ENAMED 2025 |
| Revalida 2024 | 87 | Evidência qualitativa; acervo parcial |

Não há soma dessas contagens como número de itens independentes. Foram detectados 37 enunciados exatamente iguais após normalização entre ENAMED 2025 e Revalida 2025/2; diferenças de transcrição podem esconder outros. O edital INEP 76/2026, item 3.1.1, estabelece que Revalida 2026/2 usa as mesmas questões do ENAMED 2026. Essa edição não é contada novamente.

O gráfico conta o campo `specialty` dos 100 documentos de 2026, uma vez por questão:

| Classificação editorial do acervo | Questões / percentual |
| --- | ---: |
| Clínica Médica | 20 / 20% |
| Pediatria | 16 / 16% |
| Cirurgia | 14 / 14% |
| Ginecologia e Obstetrícia | 14 / 14% |
| Saúde Coletiva | 14 / 14% |
| Saúde Mental | 11 / 11% |
| Medicina de Família | 11 / 11% |

Esses percentuais não são pesos oficiais, probabilidade futura nem ranking plurianual. A matriz, a organização normativa dos blocos e a classificação editorial são conceitos diferentes. O diálogo “Fontes e edição” explica a metodologia e lista questões que fundamentam as dicas.

“Comece por”: imunizações e prevenção; saúde da mulher; APS e saúde mental. São orientações de revisão sustentadas por exemplos de diferentes edições, não uma promessa de maior pontuação. O mobile imprime os dois primeiros títulos; a versão textual mantém os três e suas explicações.

Quatro PDFs conferidos integralmente por extração e com inspeção visual das páginas de identificação/prioridades:

- `AUSCULTO_ENAMED_2026.pdf`: 124 páginas, caderno comentado de 100 questões. Seu gabarito editorial não substitui o preliminar oficial já incorporado ao app.
- `ENAMED%20CHECKLIST%20AUSCULTO%202026.pdf`: 24 páginas; explicita prioridades editoriais, sem frequência plurianual auditada.
- `Checklist_ENAMED_Ausculto_2_paginas.pdf`: 2 páginas; decisões e temas de revisão.
- `Checklist_Vespera_ENAMED_Revalida_2026_2.pdf`: 22 páginas; deriva de transcrição de aula, com limitações declaradas.

Prática do ENAMED: questões 19, 45 e 64 de 2026, sem alterações de enunciado, alternativas ou resposta. Aviso de gabarito preliminar aparece antes da resposta e na correção.

### Lacunas encontradas no app, sem alterações remotas

- ENAMED 2025 não tem `theme`/`subtheme` nos 90 documentos exportados; o manifesto da trilha possui vínculos adicionais, muitos ainda propostos.
- Revalida 2024 e 2025/1 têm taxonomia canônica incompleta.
- Em Revalida 2025/2, `canonical_theme = Diarreia Aguda` inclui questões de fimose, convulsão e outros assuntos. Esse campo não foi usado para fabricar uma incidência.
- O índice consultado não possui uma pasta separada de Revalida 2026/1. Não se presume ausência em todo o sistema por isso.

## Arte e engenharia

Gerador nativo `image_gen` para os impressos e suporte do calendário; sem CLI de geração. Prompts, arquivos de origem e hashes em `scripts/data/academy-dossier-prints.json`, `print-manifest.json` e `asset-manifest.json`. Masters em `.local-art/academy-dossier/masters/`; derivados publicados em `site/assets/academy/dossier/`. Logos derivadas dos arquivos reais, sem redesenho, com 180 px para uso de até 60 CSS px em DPR 3. Manifesto próprio registra as origens.

Skills usadas em passes específicos: direção e preservação do projeto; tipografia/material; motion com Emil; revisão final com Impeccable. A identidade das referências prevalece. O detector final apontou apenas o uso de Inter; foi mantida deliberadamente por ser a fonte funcional existente, combinada à serif editorial.

| Antes | Depois | Motivo |
| --- | --- | --- |
| Barra sobre a anotação manuscrita | Seletor vertical ao lado do livro | Preservar a composição e igualar áreas de clique |
| Mesma gravura/frase em todas as bancas | Cinco gravuras e frases próprias | Dar identidade a cada dossiê |
| Folha mobile sobreposta com transparência durante a saída | Papel opaco até quase sair, seguido de fade final curto | Evitar mistura ilegível de textos |
| Folheio também no teclado | Troca imediata no teclado | Resposta direta sem espera ornamental |
| Cards mobile longos em sequência | Capas lado a lado, detalhe do selecionado | Mostrar variedade sem exigir hover |
| Logos originais grandes no seletor | Derivados lossless da mesma arte | Reduzir transferência sem inventar marcas |

## Reprodução e evidências

- `node scripts/audit-academy-inep.mjs`: audita snapshots e hashes dos PDFs; não conecta ao backend.
- `node scripts/prepare-academy-dossier-analysis.mjs`: prepara os dados com origem explícita.
- `node scripts/prepare-academy-practice.mjs`: prepara a prática estática.
- `node scripts/prepare-academy-dossier-prints.mjs`: impede publicação de cópia impressa divergente do conteúdo aprovado.
- `node scripts/prepare-academy-bank-marks.mjs`: gera derivados das logos.
- `npm run build:site` e `npm run verify:site`: fonte e artefato.

Capturas: `.local-art/academy-refinement/qa/`. Movimento e vídeos: `.local-art/academy-refinement/motion/`. Auditoria: `scripts/data/academy-inep-audit.json`. Testes dos três motores: `.local-art/academy-dossier/qa/*-report.json`.

Sem publicação em produção, sem alteração do Flutter/Firestore. WebKit emulado não equivale a iPhone físico. Performance local é medição de laboratório, não dados de usuários reais.

## Resultado da validação final

- Build e verificação do site aprovados; contratos do dossiê: 6/6; correções do site: 15/15; tracking aprovado.
- Dossiê validado em Chromium, Firefox e WebKit, incluindo as quinze questões, teclado, reduced motion e falhas de carregamento. Refinamentos verificados de 320 a 1920 px.
- Runtime geral: 44 verificações aprovadas na execução ampla. Duas expectativas antigas do simulador foram atualizadas para o fluxo atual e passaram na reexecução dirigida (2/2); não representam uma nova execução integral de 46 testes.
- Movimento, pausa da rotação dos recursos e vídeos de 390/1448 px verificados. Nenhum aparelho físico foi utilizado.
- Lighthouse mobile isolado: acessibilidade 100, performance 56, LCP 6,5 s, TBT 584 ms e CLS 0. Arquivo: `.local-art/academy-refinement/lighthouse-mobile-isolated.json`.

O carregamento ainda não atinge a meta de LCP de 2,5 s. A redução das logos preservou a arte original, mas não resolveu o custo total da página. A auditoria aponta atraso de renderização do livro e tarefas de layout associadas à inicialização; essa pendência não deve ser apresentada como performance aprovada nem como medição de produção.

### Passe de performance subsequente

- Header e observação de largura do livro passaram a usar os valores entregues pelo `ResizeObserver`, sem leituras síncronas de geometria na inicialização. O rastreamento seguinte não apontou forced reflow nesses pontos.
- Máscaras das seis marcas em “Sobre a Academy”: SVGs com bitmaps embutidos substituídos por WebP lossless contendo o mesmo alfa, na resolução original. Total de arquivos: 588.972 → 100.514 bytes. A versão inicialmente reduzida foi descartada por afetar traços finos. Comparação de alfa e screenshot DPR 3 em `gold-mask-quality.json` e `gold-masks-dpr3.png`.
- Logo do rodapé com carregamento lazy; imagens dos cards de recursos preservadas.
- Corrigida acentuação no título das evidências, na nota UNIFESP e no método de análise, incluindo os artefatos gerados.
- `QA_HOSTING_CACHE=1` no servidor local reproduz os cabeçalhos de cache do target `site`; o modo padrão continua `no-store` para revisão visual. Não altera o Firebase.
- Nova validação dirigida: teclado/resize/reduced motion e fontes do dossiê (2/2); leitor e marcas DPR 1–3 (7/7); contratos do dossiê (6/6); build e verificação aprovados.

Medições não intercambiáveis, ambas a frio:

| Medição | Performance | Acessibilidade | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | ---: |
| Lighthouse simulated, cache equivalente ao Hosting, máscaras intermediárias | 74 | 100 | 6,48 s | 14 ms | 0 |
| Lighthouse DevTools, máscaras finais, rede/CPU limitadas diretamente | 47 | 100 | 3,99 s | 3.687 ms | 0 |

Arquivos: `lighthouse-hosting-cold.json` e `lighthouse-hosting-devtools.json`, em `.local-art/academy-refinement/`. O segundo aplica CPU 4× e throughput de download de aproximadamente 1.475 Kbps. Não escolher a melhor nota entre métodos como prova de conclusão: a carga inicial e as tarefas de renderização sob limitação continuam pendentes.

## Correção após revisão do usuário — cards, títulos e descoberta do dossiê

Esta revisão substitui as decisões anteriores de objetivos apenas tipográficos, livros sem subtítulo e questão compactada em navy.

- Restaurados os cards de Residência e ENAMED com os mesmos assets originais: médico, caderno, fundos e composição com imagens saindo da superfície. Faculdade e ECG permanecem como dois acessos discretos abaixo deles. O PDF continua no encerramento, sem duplicar seu ID.
- Livros mobile no mesmo card, três linhas simétricas, capas de mesma altura e eixo, título + subtítulo + Ler mais. Descrições e metadados de leitura não ocupam essas linhas. Subtítulo local em Instrument Serif, 17 px, corrigindo a herança de 10 px.
- Questão Einstein recupera superfície branca, alternativas interativas A–D e botão dourado. Perguntas e simulador continuam no componente compartilhado; trocar a aba mantém a seleção do simulador.
- Fundo do PDF mobile recebe máscara gradual nas bordas superior/inferior, sem linha horizontal de recorte. Arte original preservada.
- A pedido explícito do usuário, o hero agora troca a banca a cada 12 segundos enquanto o livro estiver visível. Botão Pausar/Retomar. Interação manual interrompe a rotação até retomada explícita; foco, hover sobre o livro, aba oculta e livro fora da tela suspendem o temporizador. Reduced motion não inicia a rotação. Trocas automáticas não geram anúncios repetitivos para leitores de tela.

Fontes desta rodada: `scripts/academy-experience.mjs`, `academy-product.mjs`, `academy-landing.mjs`, `academy-hero.mjs`; `site/assets/css/academy-experience.css`; `site/assets/js/academy-dossier.js`. Testes próprios: `scripts/test-academy-autoplay.mjs`, `test-academy-experience-runtime.mjs`; expectativas do runtime amplo migradas de dois cards removidos para o card compartilhado.

Validação desta revisão: build e verify aprovados; contratos do dossiê 6/6, correções 15/15 e tracking aprovados; experiência e autoplay em Chromium, Firefox e WebKit em 390/1448 px; regressão de layout em 320, 360, 390, 430, 768, 1024, 1448 e 1920 px. Quinze questões, correção, resultado, revisão, foco e parâmetros de campanha revalidados no Chromium. Axe sem violações nos componentes revisados nos três engines. Não foi utilizado aparelho físico.

Capturas atuais em `.local-art/academy-refinement/revision/`, nomes `books`, `objectives`, `studio`, `pdf`, `hero` com sufixos `390` e `1448`. As capturas isoladas removem header/CTA fixos e seu backdrop apenas no contexto de QA; o produto mantém esses controles. A revisão também foi inspecionada com header e CTA ativos pelo Chrome DevTools MCP.

A execução ampla mais recente passou em 61/62 verificações. A falha remanescente era overflow de 27 px ao duplicar todas as fontes da Academy; corrigido com colunas `minmax(0,1fr)`, quebra dos acessos e limite de escala das imagens dos objetivos. A reexecução dirigida cobre Academy em 360/390 px e texto 200%; não equivale a uma nova rodada integral. Um ensaio anterior foi invalidado por reconstrução concorrente de `dist/site`; os erros temporários de 404/decode desse ensaio não são contabilizados como evidência final. Relatórios separados em `.local-art/correction-20260927/after/` e `.local-art/academy-refinement/final-reflow/`.

As medições históricas de performance acima não foram substituídas por uma alegação de desempenho em produção. Nesta sessão, um trace DevTools com CPU 4×, Fast 4G, viewport 390×844 DPR 2 e servidor local sem cache registrou LCP 2.495 ms e CLS 0; método distinto dos Lighthouse anteriores, sem comparação direta de melhoria. O último Lighthouse DevTools disponível registrou acessibilidade 100, boas práticas 92 e SEO 100, antes desta correção final de cards. A nota de performance continua dependendo do protocolo e não foi usada como prova de aceite visual. Nenhuma publicação foi executada.
