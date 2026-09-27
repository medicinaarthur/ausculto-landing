# Execução da lapidação — 27/09/2026

Autoridade: plano integral do ASTRA, mensagem anterior desta conversa (Tarefas 0–7), e goal-objective.md anexado. Não existe segundo arquivo de plano no diretório de anexos. O plano foi lido integralmente no contexto antes de editar.

## Checklist
- [x] Tarefa 0 — raízes, regras, baseline técnico e capturas.
- [x] Tarefa 1 — snapshot remoto e exportação integral fiel.
- [x] Tarefa 2 — números, nomes e navegação.
- [x] Tarefa 3 — marcas e cards.
- [x] Tarefa 4 — biblioteca.
- [x] Tarefa 5 — portal e leitores.
- [x] Tarefa 6 — demonstração de simulados.
- [x] Tarefa 7 — build, validação, revisão e publicação.

## Baseline
Site em feat/unified-site-tracking, já modificado; app limpo. Nenhum reset, clean, stash ou commit realizado. Status/diff e hashes de arquivos preexistentes em .local-art/site-lapidacao-20260927/baseline/. Todo delta será comparado a esses hashes, não apenas ao HEAD.
App: verify:repo-topology OK; ancestralidade 894513e57c9f OK.
Site: test:academy-content 6/6; test:academy-presentation 6/6; test:tracking OK; build:site 685 arquivos/3 artigos; verify:site OK. Nenhuma falha preexistente nesses gates.
12 capturas em .local-art/site-lapidacao-20260927/before/, 1440 e 390 px. Última captura mobile de epidemiologia em viewport (full-page excedeu o capturador); demais full-page. Preview vivo em http://127.0.0.1:4188, session 35779.

## Regras de execução
Ruling: trabalho no checkout nomeado pelo usuário, preservando arquivos não rastreados — criar worktree descartaria a fonte atual do site, majoritariamente não rastreada. Registro único requerido pelo plano usado como ledger; sem commits automáticos.
Ruling: executar diretamente as Tarefas 0–7 do plano em conversa; scripts shell de bookkeeping da skill não substituem o registro nem impõem replanejamento. Revisão independente final prevista pela skill após implementação.
Fontes somente leitura no app e Firebase. Publicação autorizada somente após todos os gates do plano, hosting:site com firebase.site-release.json.

## Arquivos previstos
Geradores/exportação: scripts/{snapshot-academy-published.cjs,export-academy-presentation.mjs,academy-presentation.mjs,academy-markdown.mjs,academy-articles.mjs,academy-product.mjs,academy-hero.mjs,academy-landing.mjs,academy-sim-demo.mjs,build-site.mjs}; scripts/data/{academy-presentation.json,academy-product.json,academy-sim-demo.json}; testes correspondentes; package.json apenas para comandos novos.
Site: site/index.html, site/ads-medico.html, folhas da home e Academy envolvidas, novos academy-reader.css/js e academy-sim-demo.js, academy.js; assets novos versionados em site/assets/home e material. Docs: este ledger e evidências. ENAMED, embaixadores, parceiros e app permanecem fora de edição.

## Dependências entre tarefas
T1 → T2/T4/T5: snapshot publicado fornece contagem, metadados, blocos e assets. T2 usa contagem derivada; T4 não mistura ECG no catálogo de temas; T5 usa textos integrais.
T3 → T7: assets conceituais e logos precisam de revisão real em DPR1/2/3.
T4/T5/T6 → T7: carregar scripts apenas nas superfícies próprias e incluir fontes indiretas no manifesto.

## Tarefa 1 — aceite satisfeito
Snapshot consultado ao vivo: academy-temas-20260925, 170 entradas (152 temas + 18 ECG). Foram lidos somente metadados gerais e corpos dos três IDs autorizados. Ponteiro verificado antes/depois. Flags published/publicationAllowed/clinicalReviewed/rightsCleared verdadeiras nos três.
Exportação: 27 + 25 + 39 blocos completos, 3 imagens por hash, sem PDFs ou storage paths no JSON público. Imagens locais corroboradas por SHA remoto; conteúdo publicado tomado como autoridade.
Ruling: candidatos locais diferem na forma dos blocos após sanitização do backend; fonte final são versões publicadas. Conteúdo clínico não reescrito.
RED: testes novos falharam por ausência do snapshot/contrato dinâmico e exportação incompleta. GREEN: node --test scripts/test-academy-export.mjs scripts/test-academy-presentation.mjs 8/8. Testes legados de ocultar seções dos três temas atualizados para autorização integral explícita; preservado teste de renderArticles para releases de seleção parcial.

## Tarefa 2 — aceite satisfeito
Home, FAQs/acessibilidade e página médica usam AusFlow, 10.000 patologias e 280+ calculadoras. Banco total 70 mil+ diferenciado das 14.345 oficiais comentadas; proveniência comercial registrada em academy-product.json, sem alegar auditoria remota do banco. Temas e ECG derivados do snapshot vigente, sem constante 69. Ambos os cards ENAMED da home abrem /estudantes/, mantendo a escolha subsequente na Academy.
Adaptação: ads-medico.html carrega bundle React e seu JSX original não está disponível. medico-copy.mjs aplica substituições comerciais literais auditáveis durante o build, gera bundle com hash e preserva a lógica e o bundle original. Nenhuma correção exclusiva em dist. Título/descrição da fonte HTML atualizados.
Validação: node --test scripts/test-site-facts.mjs 4/4; test:academy-content 6/6; build:site 689 arquivos/3 artigos. Nomes e números antigos ausentes nos caminhos comerciais envolvidos. Runtime e demais gates na T7.

## Tarefa 3 — aceite satisfeito; DPR concluído em T7
Logos originais de Downloads preservadas em masters privados; derivados WebP lossless 96/192 sem tint/crop. Ilustração conceitual criada pelo imagegen embutido, alpha confirmado, sem texto/paciente/UI, em produtos por hash; master privado preservado. Prompt: prancheta navy, dois cartões brancos vazios e timer dourado, fundo transparente; sem logos, letras, números ou informação clínica.
Cards desktop/mobile usam marcas em 36–40 px, benefícios reais de registros/timers/passagem e leitura educacional de ECG/imagens. Fontes conferidas no app: meu_plantao_home_page.dart (timer/registro/passagem), ausmind_home.dart e workspace visual. Nenhuma alteração no app. Conceito identificado como ilustração. Capturas T3 em after; Chrome DPR1 desktop1440/mobile390 sem overflow. DPR2/3 concluídos pelo runner Chrome isolado na T7; a API viewport da extensão não permitia configurar DPR.
Build 696 arquivos; testes fatos 4/4. No smoke foi reforçado o destaque do total70mil+ nas métricas e cards (14mil+ fica claramente identificado como subconjunto oficial).

## Tarefa 4 — aceite funcional satisfeito
152 temas publicados, 150+ comercial; 18 ECG em coleção separada. Três destaques integrais usam título/descrição e leitura publicados. Abdome em destaque, dois complementares. Livros, nove frames e animação premium preservados por determinação posterior do usuário; imagem real disponível em disclosure próprio. Fontes: academy-landing, academy-articles, academy.js, academy-book.js; novos academy-library.css e academy-catalogue.js. O comportamento PRO permanece no handler original; nenhum academy-pro.js separado foi entregue.
Busca agora inclui todos os temas e os três gratuitos; área canônica + busca combinadas, normalização de acentos, 9 desktop/3 mobile, reset e aria-live Exibindo X de Y. Destinos gratuitos locais; demais app. Todos os links permanecem no HTML sem JS.
RED módulo ausente; GREEN test-academy-catalogue 3/3 e fatos4/4. Smoke Chrome: busca abdome retorna4 inclusive gratuito; filtro pediatria+abdome retorna0; limpar retorna3de152; desktop9de152. Build699arquivos. Matriz completa na T7.

### Correção explícita do usuário durante T5
O usuário pediu preservar o hover premium dos livros. Esta instrução prevalece sobre a remoção prevista no plano: restaurados os três livros/frames originais e hover/toque/teclado, sem alterar as artes. Títulos, metadados e links integrais continuam corretos. Imagem real disponível em disclosure complementar, sem apresentar capa ilustrativa como captura do app. academy-book.js novamente carregado em estudantes; apenas shortcuts de área retirados porque agora pertencem ao catalogue.js. PRO dialog permanece no handler original; novo academy-pro.js não é carregado. Testes adaptados ao contrato corrigido pelo usuário.

## Tarefa 5 — aceite implementado e smoke realizado
/conteudos/ agora apresenta três temas completos sem cadastro, Abdome em destaque, imagens originais, tempo real e caminhos para biblioteca/simulados/app. Leitores preservam IDs e os 27/25/39 blocos publicados, referências uma vez, autoria/revisão/data reais. Primeiro bloco (título+Resumo de estudo) integrado ao cabeçalho para evitar título repetido; nenhum texto clínico removido. Sumário240px sticky desktop>=1100, leitura max760px, fonte18px/1.7; mobile sumário recolhível, tabelas com scroll próprio e imagem ampliável. Relacionados excluem tema atual. CTA abre o tema existente no app, sem promessa de sincronização. Canonical/OG/Article gratuito/sitemap corretos; PDFs/questões não exportados.
RED export renderPresentationIndex ausente; GREEN reader2/presentation6/content6 =14/14. Teste legado de livros adaptado à correção expressa do usuário, agora exige três livros. Smoke Chrome:27 seções, 1H1, fonte18/30.6px, sem overflow; zoom por Enter abre modal e Escape devolve foco. Encontrado e corrigido: academy.js normaliza anchors para URLs absolutas, e seletor reader[href^=#] impedia spy. Agora usa hash+pathname e marca aria-current. Matriz final/click/touch em T7.
Adaptação QA: viewport da extensão Chrome não expõe DPR e a escala da janela ficou inconsistente; runner de regressão isolado em Chrome real será usado para matriz reproduzível, sem depender da janela do usuário.

## Tarefa 6 — aceite satisfeito; smoke no runner T7
Card aria-hidden substituído por form HTML: rádioTreino/Prova, banca e quantidade. Nenhum modo/banca/quantidade pré-selecionado. Quantidade bloqueada até ambos escolhidos; contratos5/10/15/20/25/30 Treino e20/50/100 Prova, mudanças limpam escolha incompatível. Dados das sete identidades em destaque conferidos nos dois configs do app, sem afirmar estoque/ disponibilidade atual. Hierarquia grandeárea→especialidade→tema→subtema apenas explicada, sem replicar taxonomia. CTA genéricoMontar no app sempre disponível e noJS; disclosure de demonstração e ausência de handoff. Não geraquestões/não chama backend.
RED módulo ausente; GREEN test-academy-sim-demo3/3 (teste afinado para permitir aria-hidden apenas na seta decorativa). Smoke de teclado, escolhas e tráfego concluído em 390/1440 na T7, sem chamada ao gerador.

## Adendos — livros e ilustrações acadêmicas

Ruling: o pedido posterior de manter os livros prevalece sobre a remoção originalmente planejada. Os nove frames originais e o comportamento premium foram preservados. Toque, hover, Enter/Escape e reduced motion verificados no Chrome. Sem cópia de capa como screenshot do app.

Ruling: o usuário autorizou novas figuras acadêmicas nos três temas. Elas são suplementos separados, sem alterar snapshot, blocos, referências ou revisão do conteúdo original. Quatro figuras originais geradas pela ferramenta integrada: duas em Epidemiologia, uma de mecanismos do Abdome e uma de distúrbios primários ácido-base. Conceitos e setas conferidos em CDC/IARC/MSD e na tabela publicada. Estrutura molecular decorativa da primeira versão de ácido-base removida por edição dirigida na geradora.

Ruling: aplicar a logo original em composição SVG, incorporada byte a byte, evita que a geradora recrie a marca. Fundo branco, bitmap WebP lossless e marca navy em margem inferior direita com opacidade0,4. A marca faz parte do arquivo ampliável. Sem alteração de logo; original preservado. Risco residual: não houve contratação de novo revisor clínico humano, nem auditoria clínica integral do material original. Doc completo: docs/academy/illustrations-20260927.md e prompts ao lado.

RED illustrations: módulo ausente. GREEN: dois testes de quatro assets/posição/marca e rejeição de drift, junto de apresentação/leitores10/10. Revisão de imagens reais no Chrome confirmou fundo, tipografia, as oito setas de gasometria, direções opostas de coorte/caso-controle, falácia ecológica e mecanismos de Abdome. Novas figuras em section003/016/017/029, preservando91blocos.

## Tarefa 7 — validação e revisão

Runner isolado Playwright em Chrome instalado. Matriz360/390/768/1440 nas seis rotas; testes interativos de busca/área/paginação/reset, três livros, demo sem seleção silenciosa, mudanças de modo/tamanho, sumário, zoom, Escape/foco, noJS e bloqueio de terceiros antes do consentimento. Capturas completas1440/390 home/estudantes, capturas das figuras nas quatro larguras e marcas em DPR1/2/3. Texto200% dobra uma vez cada tamanho computado, inclusive px. Zoom200% é equivalência de reflow de janela1440 para720CSSpx/DPR2, sem alegar teste de zoom nativo ou aparelho físico.

Falhas encontradas/corrigidas: sumário somava scroll-padding global a scroll-margin de header, resultando em173px e spy na seção anterior; margin agora12px, utilizando padding global. Texto200% precisava quebra de PRO/CTA/e-mail e reserva do menu. Header da home transbordava14px com wordmark e ações: min-width0, quebra de palavra e altura automática. Marca Academy quebrava em duas linhas com topo negativo8,8px; teste vertical RED, barra agora cresce e menu usa offset medido. Falhas de timing do harness de livro corrigidas para aguardar decode/frame aberto, preservando renderer original.

Servidor estático não contém Function /_consent/reference. O404 local esperado é registrado à parte; não convertido em comprovação de integração live. Essa integração será conferida após publicação. Testes de consentimento/tracking continuam intactos.

Build708arquivos/3leitores. Node --check28arquivos passou; test:site-lapidacao25/25, test:academy-content6/6, test:trackingOK. Uma execução paralela indevida de test:academy-content (que chama build-site) e verify:site provocou inventário transitório; rerun sequencial aprovado, sem drift final. Não é falha preexistente nem problema mascarado.

Revisão independente final por GPT-6 Astra, somente leitura: confirmou91blocos exatamente iguais ao snapshot, deep links compatíveis e quatro figuras sem erro conceitual visível. Achado Important: faltavam fontes indiretas academy-account.mjs e academy-qdemo.html no manifesto. Teste ampliado RED→fontes incluídas→GREEN3/3 e suíte25/25. Achado de marca cortada em200% tratado como obrigatório pelo gate visual: teste verticalRED→CSS de altura automática. Sem Critical; não houve segunda revisão redundante.

Ruling: itens deixados fora da revisão permanecem fora de alegação de validação: reauditoria clínica integral, recontagem remota dos números comerciais, autenticidade de depoimentos anteriores, Safari/iOS/aparelho físico e zoom nativo. Integração de consentimento e publicação dependem da checagem live prevista. Somente fidelidade de fonte, contratos locais e Chrome foram comprovados até aqui.

Baseline de rollback antes do deploy: site auscultoapp, live release1790449585285000, versão d739f00dddd7bf79 (26/09/2026). Se necessário, restaurar essa versão no histórico de releases do targetsite pelo Firebase Console; nenhum rollback executado. App limpo; delta dos hashes de ENAMED/embaixadores/parceiros vazio. Não houve exclusão de arquivo do baseline, reset/clean/stash/commit.

### Gate final anterior à publicação

Última execução (após correção da barra com fonte ampliada): 46/46 checks de Chrome aprovados, zero issues em after/runtime/report.json. Tracking e verify:site repetidos sequencialmente: OK. O artefato de 708 arquivos permaneceu íntegro. Inspeção da captura text200-conteudos confirmou a marca inteira; ilustração epidemiológica final confirmada em tamanho real. Diff comparado ao baseline da tarefa: 20 fontes alteradas, 37 novas, zero arquivos removidos e zero mudanças nos subtrees protegidos. App permanece limpo. Delta completo em .local-art/site-lapidacao-20260927/task-delta.json. Todos os gates aplicáveis anteriores à publicação satisfeitos; resta exclusivamente publicar hosting:site e executar a verificação live.

## Publicação e verificação final — concluídas

Comando exclusivo executado (ALLOW_SITE_DEPLOY removido em finally):

```powershell
$env:ALLOW_SITE_DEPLOY='1'
firebase deploy --only hosting:site --config firebase.site-release.json --project auscultoapp
```

Predeploy guard aprovado; verify:site aprovado. Versão publicada **4f29cdf744d03047**, release **1790489875305000**, em 27/09/2026 às 06:17:55 UTC. 708 arquivos. Registro mínimo sem credenciais: .local-art/site-lapidacao-20260927/deploy-summary.json. Apenas target site alcançado; app, Functions e target ENAMED não publicados. O rewrite de consentimento já existente foi preservado, não houve deploy da Function.

Verificação live: **20 checks aprovados, zero issues**; seis HTMLs com SHA idêntico ao artefato e no-cache; variantes www e sem www servem a mesma versão. **111 assets** referenciados (CSS/JS/imagens) com HTTP200, bytes por SHA iguais ao build e max-age3600/must-revalidate. Seis rotas renderizadas em390/1440 no Chrome, sem overflow, erroJS ou asset quebrado. Recusa retornou referência assinada (HTTP200/ok/reference) nos dois domínios e nenhum terceiro de marketing foi carregado. Tokens não foram registrados. Ambos os cards ENAMED foram clicados e chegaram a /estudantes/. CTA de simulados navegou ao app sem handoff fictício; CTA do leitor navegou ao app com intenção academy-summary:estudos-epidemiologicos. Nenhum cadastro/pagamento/geração real foi iniciado. Livro na janela do usuário abriu com book-abdome-open.webp e imagem decodificada. Preview publicado ficou aberto no Chrome.

Falha inicial do harness live: contagem procurava data-book=, mas o atributo correto é booleano data-book. O HTML já era idêntico ao build e os três livros existiam; corrigida somente a asserção para a sintaxe real e repetida a verificação. Não houve mudança de produto nem segundo deploy. Resultado final20/20. Relatório: .local-art/site-lapidacao-20260927/after/live/report.json.

`npm run verify:site` após a publicação: OK. Sem rebuild ou alteração de fonte de produto após o deploy. App permanece limpo; hashes dos subtrees protegidos intactos; nenhuma exclusão do baseline. Alterações locais anteriores preservadas. O histórico de rollback anterior permanece identificado acima.

## Segunda passagem dos critérios T0–T7 / Definition of Done

| Tarefa | Evidência do aceite | Status |
| --- | --- | --- |
| 0 | Regras/raízes, app topology+linhagem, Git/diff+hashes, baseline aprovado,12 capturas | Satisfeito |
| 1 | Release vigente,170 metadados,152 temas+18ECG; somente3 corpos autorizados;91 blocos integrais/flags/IDs/versões/imagens/referências preservados | Satisfeito |
| 2 | 10.000 patologias,280+ calculadoras,AusFlow;70mil+ total distinto14.345 oficiais; contagens editoriais derivadas;2 cards ENAMED→estudantes | Satisfeito |
| 3 | Logos fornecidas sem tint/redesenho; conceito identificado; benefícios conferidos; inspeçãoDPR1/2/3 | Satisfeito |
| 4 | Biblioteca152 temas,ECG separado,3 gratuitos, busca/área/paginação/reset/noJS; livros premium preservados pelo adendo | Satisfeito |
| 5 | Portal e3 leitores integrais, sumário/tabelas/zoom/foco/relacionados/deep link/canonical/OG/schema/sitemap;4 figuras complementares corretas e marca exata | Satisfeito |
| 6 | Preview interativo sem defaults invisíveis, bloqueio contextual, invalidação de quantidade, bancos verificados, disclosure e CTA real sem geração/handoff | Satisfeito |
| 7 | 25+6 testes,tracking,28node checks,build/manifest,46runtime+20live, revisão independente/diff/rollback,deployexclusivo | Satisfeito |

Definition of Done satisfeita. Sem bloqueio remanescente ou requisito necessário pendente. Limites de validação: Chrome real em processo isolado e janela do usuário; não Safari/iOS/aparelho físico. Zoom200% validado por reflow equivalente, não zoom nativo. Não houve nova auditoria clínica humana dos textos/figuras nem recontagem remota do banco comercial; preservação editorial e conferência conceitual documentadas, sem simular esse trabalho. Login, paywall e geração no app não foram exercitados porque o app é fonte somente leitura e não recebeu alteração.

## Arquivos da execução agrupados por tarefa

Comparação com o baseline próprio: **20 fontes modificadas,37 novas,0 removidas** nos diretórios inventariados. Configuração raiz e documentação listadas separadamente. Inventário exato: [.local-art/site-lapidacao-20260927/task-delta.json](../.local-art/site-lapidacao-20260927/task-delta.json). O diff contra HEAD inclui trabalho anterior; ele não foi tratado como sendo todo desta execução.

- T0: este registro, baseline e capturas privadas; nenhum arquivo de produto alterado nessa fase.
- T1: scripts/snapshot-academy-published.cjs, export-academy-presentation.mjs, academy-presentation.mjs, academy-markdown.mjs; scripts/data/academy-presentation.json;3 imagens originais por hash em site/assets/academy/material; test-academy-export.mjs e test-academy-presentation.mjs.
- T2: site/index.html, ads-medico.html, assets/js/home-m.js; scripts/academy-product.mjs, academy-hero.mjs, medico-copy.mjs; scripts/data/academy-product.json; test-site-facts.mjs.
- T3: home.css,home-m.css,home-mobile-refresh.css;7 derivados por hash em site/assets/home/products, masters/prompt privados. index.html compartilhado comT2.
- T4: scripts/academy-landing.mjs; site/assets/css/academy-library.css; site/assets/js/academy-catalogue.js e academy-book.js; test-academy-catalogue.mjs. Frames de livros existentes intactos.
- T5: scripts/academy-articles.mjs, academy-presentation.mjs, academy-illustrations.mjs, package-academy-illustrations.py; scripts/data/academy-illustrations.json; academy-reader.css,academy-editorial.css,academy-accessibility.css; academy-reader.js e academy.js;4SVGs por hash em site/assets/academy/illustrations; test-academy-reader.mjs, test-academy-illustrations.mjs, test-academy-articles.mjs; docs/academy/illustrations-20260927.md e illustration-prompts-20260927.json.
- T6: scripts/academy-sim-demo.mjs, scripts/data/academy-sim-demo.json; academy-sim-demo.css/js; test-academy-sim-demo.mjs.
- T7: scripts/build-site.mjs, test-site-artifact.mjs, test-site-runtime.mjs; package.json e package-lock.json (QA e Playwright1.63.0); evidências runtime/live e script privado postdeploy.mjs. dist/site regenerado pelos geradores, sem correções manuais.

## Comandos e resultados finais

```text
npm run test:site-lapidacao                 25/25
npm run test:academy-content                6/6
npm run test:tracking                       OK
node --check nos28JS tocados/novos          OK
npm run build:site                         708arquivos,3artigos
npm run verify:site                        OK (sequencial e após deploy)
npm run test:site-runtime                   46/46
node .local-art/site-lapidacao-20260927/postdeploy.mjs   18/18
+ consentimento domínio semwww e livroCua   20/20 totais live
```

## Acesso e capturas

Preview publicado, sem instalação: [Estudantes](https://www.auscultoapp.com/estudantes/#material), [Portal de conteúdos](https://www.auscultoapp.com/conteudos/), [Estudos epidemiológicos](https://www.auscultoapp.com/conteudos/estudos-epidemiologicos/). Basta abrir; os três temas são integrais e não exigem cadastro. Biblioteca publicada aberta no Chrome com livro disponível. Preview local opcional: http://127.0.0.1:4188 enquanto o servidor35779 estiver ativo.

| Superfície | Antes | Depois |
| --- | --- | --- |
| Home1440 | [Captura](../.local-art/site-lapidacao-20260927/before/0-1440.png) | [Captura](../.local-art/site-lapidacao-20260927/after/runtime/home-1440-full.png) |
| Estudantes1440 | [Captura](../.local-art/site-lapidacao-20260927/before/1-1440.png) | [Captura](../.local-art/site-lapidacao-20260927/after/runtime/estudantes-1440-full.png) |
| Estudantes390 | [Captura](../.local-art/site-lapidacao-20260927/before/1-390.png) | [Captura](../.local-art/site-lapidacao-20260927/after/runtime/estudantes-390-full.png) |
| Portal1440 | [Captura](../.local-art/site-lapidacao-20260927/before/2-1440.png) | [Captura](../.local-art/site-lapidacao-20260927/after/runtime/conteudos-1440-top.png) |
| Epidemiologia1440 | [Captura](../.local-art/site-lapidacao-20260927/before/5-1440.png) | [Ilustração de desenhos](../.local-art/site-lapidacao-20260927/after/runtime/estudos-epidemiologicos-1440-epidemiologia-desenhos.png) |
| Livro preservado | Frames originais por hash intactos | [Aberto](../.local-art/site-lapidacao-20260927/after/runtime/students-book-open-1440.png) |

Capturas das seis rotas no domínio real: after/live/. Relatórios de QA não contêm referências assinadas ou dados de paciente. As capturas e masters privados não foram publicados no Hosting.
