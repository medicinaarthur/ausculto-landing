# Dr. Aus no hero desktop — 27/09/2026

Implementação local em `ausculto-landing-deploy`, sem publicação. A landing é
gerada em `dist/site/estudantes/index.html`; o app Flutter não foi alterado.

## Descoberta e contrato

O HTML do hero vem de `scripts/academy-hero.mjs`. O visual existente vem de
`site/assets/css/academy-hero.css` e `academy-refinements.css`; a banca atual é
owned por `site/assets/js/academy-dossier.js`. Não há fonte remota nova,
persistência, paywall ou alteração de conteúdo/analytics nesta microinteração.

A fotografia desktop tem 1586 × 992. Antes, `object-fit: cover` recortava a
fotografia numa altura determinada pelo conteúdo. A composição parava de crescer
em 1440 px, enquanto a fotografia continuava crescendo. Isso explicava o drift.

A partir do breakpoint **existente de 1200 px** (seletor vertical), o hero agora
tem a proporção intrínseca da arte. A composição existente de 1440 px é escalada
pelo mesmo fator `largura do hero / 1586`, preservando um corredor à direita.
O mascote fica em x=88,4%, base=75,5%, largura=7,7% do artboard. Isso representa
92,4 / 105,2 / 110,9 / 147,8 px em 1200 / 1366 / 1440 / 1920 px.

O seletor continua HTML funcional e mantém estilo, ordem, navegação e semântica.
Arte, textos, tipografia, navbar e CTAs não foram substituídos. A escala do
conjunto muda com a largura, conforme o contrato solicitado. O Firefox usa um
ResizeObserver para o mesmo fator quando a divisão tipada em CSS não existe.

Mobile até 767 px e a composição intermediária de 768–1199 px permanecem com as
regras e assets existentes. A camada e os pedidos de mídia do mascote não existem
nessas larguras. O código novo não depende de providers ou backend Flutter.

## Inspeção dos seis originais

Todos: MP4 H.264, 1080 × 1920, 24 fps, 96 frames/4 s, faixa AAC estéreo, sem
alpha e com fundo verde. Conferidos início, 1 s, 2 s, 3 s e último frame.
Corpo inteiro, tablet, braços, cabelo e pés preservados; mesma identidade e
enquadramento próximos. O final retorna à pose frontal; pequenas variações
geradas na pose ainda existem. O tamanho discreto reduz sua percepção.

| Final do nome do original | Comportamento observado | Decisão |
| --- | --- | --- |
| `idle_loop_1080p_20260927151203.mp4` | Piscar e micromovimentos, dedo levantado, sem gesto amplo | Idle |
| `UI_element_20260927151919.mp4` | Cabeça gira para a esquerda, mão/dedo gesticulam mais | Não usado |
| `UI_change_20260927152217.mp4` | Olhar à esquerda e retorno, mão praticamente estável | Look |
| `UI_change_20260927152639.mp4` | Variação do olhar lateral, com mais mudança de pose | Não usado |
| `UI_change_20260927153545.mp4` | Surpresa clara, mas uniforme, pele e cabelo dessaturados | Descartado após revisão de cor |
| `subtle_surprise_1080p_20260927151542.mp4` | Reação com olhos abertos e boca, preservando a paleta do idle | Surprise |

`scripts/prepare-academy-mascot.py` remove chroma e spill em resolução original,
elimina áudio e gera três resoluções VP9 alpha: 180 × 320, 360 × 640 e 540 × 960,
todas CRF 22. O PNG estático é 540 × 960. O manifest registra fontes, hashes e
variantes. Os originais permanecem intactos em Downloads. Não há recoloração,
blend modes ou keying via CSS.

A escolha anterior de `153545` causava a mudança de cor. No navegador, a mediana
RGB de uma região azul do uniforme era [47,116,185], enquanto idle era [7,108,208].
Com `151542`, surpresa fica [7,109,209]. O teste de regressão detecta o original
inadequado e aprova a correção em DPR 1, 2 e 3.

O compositor de vídeo do Chrome mostrou contornos serrilhados ao reduzir 360 ou
540 px para aproximadamente 111 px em DPR 1. A comparação no browser favoreceu
180 px nesse caso. Na montagem, o controlador escolhe a menor variante que cobre
largura pintada × DPR real, limitada a 540 px. Carrega somente três arquivos,
um de cada reação, e não nove. Download total dos vídeos: 509.139 bytes na
variante menor, 1.518.918 na intermediária ou 2.806.939 na maior. CRF 22 preserva
melhor os detalhes que CRF 30 usado na primeira versão.

## Estado e reprodução

- `setCurrent` emite `dossier:bankchange` somente quando a banca realmente muda.
  Inicialização, resize sem mudança e clique na mesma banca não incrementam.
- Contagem desktop: mudanças ímpares usam look; pares usam surprise. A rotação
  automática existente de 12 segundos usa o mesmo caminho.
- Os três vídeos são criados uma vez por montagem desktop, muted, playsInline,
  sem controles, preload auto. Idle faz loop; as reações retornam via `ended`.
- O frame atual permanece visível até `play()` e a apresentação do primeiro
  frame do próximo vídeo. Opacidade troca atomicamente, sem crossfade longo.
  Os vídeos invisíveis ficam na árvore de render para o Firefox preparar frames.
- Cliques rápidos preservam a contagem, não reiniciam a reação em andamento e
  mantêm no máximo uma reação pendente; surprise tem prioridade sobre look.
- Fora do hero, aba oculta e pagehide pausam os vídeos. Ao voltar, idle retoma.
  Reduced motion mostra somente o estático; se já ativo ao abrir a página, não
  solicita os WebM. Cruzar para tablet/mobile desmonta e libera os vídeos.
- Falha de mídia mantém o estático ou idle já válido. Erro no vídeo entrante
  também encerra a espera pelo primeiro frame e permite a próxima reação.
  Há limpeza de observers, callbacks e listeners no descarte.

## Arquivos da alteração

Novos:

- `site/assets/css/academy-mascot.css`
- `site/assets/js/academy-mascot.js`
- `site/assets/academy/dossier/mascot/{idle,look,surprise}{,-2x,-3x}.webm`
- `site/assets/academy/dossier/mascot/still.png` e `manifest.json`
- `scripts/prepare-academy-mascot.py`
- `scripts/test-academy-mascot-runtime.mjs`
- `scripts/test-academy-mascot-recovery.mjs`
- `scripts/test-academy-mascot-color.mjs`
- este relatório.

Integrações pequenas:

- `scripts/academy-articles.mjs`: inclui CSS e JS só na landing Academy.
- `site/assets/js/academy-dossier.js`: evento de mudança confirmada de banca.
- `scripts/build-site.mjs`: permite WebM e registra o preparador no manifest.
- `scripts/build-academy-preview.mjs`: reconhece dependências WebM.
- `scripts/serve-academy-preview.mjs`: MIME `video/webm` para QA local.

`dist/site` e seu manifest foram regenerados pelo build existente. As alterações
preexistentes de ambos os repositórios foram preservadas. Backups dos cinco
arquivos de integração antes desta tarefa estão em `.local-art/mascot/source-before`.

## Validação e evidências

QA local: `node scripts/serve-academy-preview.mjs dist/site 4268`.

- `node --check` nos JS/MJS tocados.
- `node scripts/build-site.mjs` e `node scripts/build-site.mjs --verify`.
- Seis testes editoriais existentes de `test-academy-dossier.mjs`.
- Smoke existente: 15 questões, respostas/resultados/revisão, fontes/foco e
  recuperação de falha na prática.
- `node scripts/test-academy-mascot-runtime.mjs` em Chrome e Firefox: reação 1/2,
  retorno, mesmo seletor, alpha real decodificado, muted/inline, pause/resume,
  reduced motion, breakpoint, falhas de download e geometria em
  1920/1440/1366/1200. Também 390/767/768/1199 sem camada/pedidos de mídia.
- Auditoria frame a frame durante as transições: sem frame vazio, vídeo não
  preparado ou reaparecimento do estático.
- Regressão da falha durante preparação: teste vermelho antes da correção e
  verde depois; revisão independente confirmou a correção.
- Inspeção das capturas reais, incluindo sequência da surpresa e retorno,
  automação do carrossel, cliques rápidos e resize durante mudança de banca.
- Mobile 390 px: screenshot exatamente igual ao baseline. Em 768 px, a primeira
  comparação também foi idêntica; execuções posteriores apresentaram ruído
  mínimo de rasterização do livro rotacionado, sem mudança de geometria.

Evidências: `.local-art/mascot/final-1440.png`, `final-1366.png`,
`chromium-desktop-*.png`, `surprise-browser-sheet.jpg`,
`chromium-runtime-report.json`, `firefox-runtime-report.json` e baselines.

Limites: teste estático em WebKit passou, mas o WebKit automatizado neste Windows
não carregou os vídeos; animação em Safari/macOS e aparelho físico não validada.
Chrome/Firefox testados em desktop local; não houve deploy nem verificação em
hosting remoto. O intervalo permitido de 768–1199 px foi preservado como tablet,
sem mascote, porque a coluna vertical existente começa em 1200 px.

## Correção visual após feedback

A mecânica foi preservada. Esta revisão mudou a seleção da surpresa, os encodes
por resolução, a escolha da variante na montagem, o PNG estático e o tamanho do
mascote (+18,5%, ligeiramente mais à esquerda). A linha dos pés permaneceu igual;
nenhum outro layout foi alterado.

Comparação controlada: Chrome servindo os arquivos atuais versus a versão
anterior guardada em `.local-art/mascot-v2/before`, mantendo o resto do site igual.
Capturas do hero em 1254/1440/1920/1200, DPR 1, 2 e 3. Mobile 390 px exatamente
igual antes/depois. Nova validação Chrome e Firefox, recuperação de falha do
decoder, continuidade de cor e apenas uma variante solicitada por reação.
Revisão independente abriu as capturas e confirmou melhora de cor, contorno e
proporção sem sobreposição.

Evidências: `.local-art/mascot-v2/after-1254-dpr1-idle.png`,
`after-1254-dpr1-surprise.png`, `after-1440-dpr2-detail.png`,
`after-1440-dpr3-detail.png`, `decode-dpr1.png`, `browser-color-report.json` e
`capture-manifest.json`. As capturas e os arquivos anteriores foram preservados.

Limite adicional: a resolução é escolhida na montagem e permanece durante essa
sessão desktop. Mudar de monitor/DPR sem remontagem não troca o arquivo em
reprodução; adaptação contínua entre monitores não foi implementada. As
comparações DPR 1/2/3 representam montagens reais em cada DPR. Sem deploy.

## Acabamento e retorno preparado - revisao 3

A largura passou a 8,2% (left 88,15%), preservando centro e base. Duas sombras
sob as solas e uma projecao ambiente suave ancoram o personagem na mesa. A
pos-producao comprime apenas realces proximos do branco em ate 4,5%, com uma
contribuicao quente lateral maxima de 1,2%; o azul e a identidade permanecem.

O preparador trabalha em 1080x1920, com intermediario lossless temporario e
uma unica reducao final por variante. Faz registro uniforme pelos pes e busca
a pose de idle mais proxima; nos takes atuais o registro encontrado e identidade
(escala 1 e deslocamento zero), portanto nao se introduz deformacao artificial.
As ancoras encontradas sao os frames 62 (look) e 71 (surprise). Os dois frames
finais viram uma ponte linear-light com alfa premultiplicado (50%, 100%), seguida
por seis frames reais do idle. O retorno continua nos frames 69/78 (2,875/3,25 s).
As reacoes completas duram 4,25 s. Nao ha fade CSS, optical flow ou morphing.

O controlador le o manifesto, prepara o idle pausado durante a reacao e valida
seu frame por rVFC ou seeked + HAVE_CURRENT_DATA antes de retomar. Watchdogs
tratam falhas; troca de aba, breakpoint e pagehide cancelam listeners e callbacks.
O servidor local de QA agora atende byte ranges de WebM (206/416, Content-Length,
Accept-Ranges); sem isso Chrome mantinha seekable=[0,0] e descartava a busca.

Arquivos adicionais desta revisao: scripts/test-academy-mascot-return.mjs,
scripts/test-academy-mascot-assets.py e scripts/serve-academy-preview.mjs.
Evidencias em .local-art/mascot-v3: antes/depois, atlas DPR 1/2/3, return-report.json
e retorno-chrome.webm. Testes de assets conferem hashes, dimensoes, ausencia de
audio, alfa, continuidade real e opacidade da ponte. As capturas sao do Chrome
real; nao foi realizada validacao em aparelho fisico ou Safari/macOS.
Sem publicacao. Nenhum arquivo do app Flutter foi alterado.
