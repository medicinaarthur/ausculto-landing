# Refinamento visual do portal de parceiros — 30/09/2026

## Escopo e contrato

Solicitação: elevar o acabamento visual, aplicar a marca atual do app e manter
integralmente a mecânica e o backend recentemente corrigidos. Implementação no
site canônico `ausculto-landing-deploy/parceiros`, não na cópia antiga
`Desktop/parceiros.ausculto` nem no app Flutter.

O HTML e CSS locais antes da edição tinham o mesmo SHA-256 do domínio público.
As três telas são estados da mesma SPA: entrada, confirmação do link e painel.
Auth, App Check e as cinco callables `partner*` continuam sendo os donos da
identidade e dos dados. Cupons, benefícios, métricas, níveis e finanças continuam
vindo do backend; nenhum fallback, payload, regra ou persistência foi alterado.

## Mudanças

- `public/index.html`: logo atual nas três telas e favicon, título separado do
  formulário, card claro, acesso ao suporte, rótulo acessível de saída e região
  financeira focável para rolagem por teclado.
- `public/styles.css`: navy `#000C1E`, superfícies coerentes, Lato local,
  hierarquia, foco, contraste, estados, espaçamento e composição responsiva.
- Corrigida a causa do overflow mobile: o tamanho mínimo da tabela expandia o
  grid inteiro. Agora a tabela rola dentro de sua região sem alargar a página.
- `public/assets/ausculto-white.png` e `ausculto-navy.png`: cópias exatas de
  `assets/branding/auth_logo.png` e `premium_v2/home_top_logo.png` do app canônico.
  Sem redesenho, filtro, recompressão ou alteração da geometria. Fontes regular
  e bold copiadas dos assets oficiais Lato. Nenhuma arte nova foi necessária.
- `scripts/verify_visual.cjs`: QA reproduzível local; não publicado no hosting.

Skills: Impeccable (polish e craft floor) e critérios de hierarquia, composição,
identidade e integridade da revisão premium. O contrato específico do AusFlow
foi consultado como referência da família navy; não aplicado como escopo de
renomeação do portal. Sem revisão independente por outro agente.

## Preservação comprovada

SHA-256 local coincide com o obtido do domínio antes da mudança:

| Arquivo preservado | SHA-256 |
| --- | --- |
| `app.js` | `9600a549befcff5f1b7d6d60994de5cc76e368dcdc01d390a2a6312244750639` |
| `config.js` | `4aee88e6caf22d784fff3430d7923852df83a11c50d3acf0b29ffdd34b1fc466` |
| `coupon_ui.js` | `29321e5ec4b6848f79be6e6720826d92a4d58fb34d17690028461b2e04fccd42` |

`qr.js` também permaneceu sem alterações. `firebase.json`, `.firebaserc`,
Functions, regras, Remote Config, Firestore e arquivos do app não foram editados.
Os elementos e IDs usados pelo JavaScript existente foram preservados.

## Validação e evidência

Antes de editar: topology e ancestralidade do app canônico aprovadas.

- `npm run validate:repo`: aprovado; target isolado, cinco callables,
  App Check, gates e ausência de Firestore direto preservados.
- `npm run test:coupon-ui`: aprovado.
- `node --check public/app.js` e `scripts/verify_visual.cjs`: aprovados.
- `node scripts/verify_visual.cjs`: aprovado. JavaScript de produção executado
  com interceptação do SDK no teste, fixture sintética e bloqueio de rede
  externa. Zero requisições ao backend real, zero erros não capturados.
- 15 cenários em Chrome, DPR 1, escala normal: login em 1440×900, 390×844 e
  360×800; painel em 1440×900, 390×844 e 768×1024; falhas parciais em desktop
  e mobile; código pendente; confirmação de e-mail; erro de carregamento;
  cupom bloqueado; gráfico vazio; código longo; carregamento.
- Verificados envio sintético do link e validação de e-mail, foco/Enter,
  períodos 30/90, QR abrir/fechar, clipboard, regras expandíveis e gates.
- Texto ampliado em 360×800: base HTML 200%, corpo 30px, controles do login
  24px. Sem overflow horizontal. Isso não substitui teste com leitor de tela
  ou acessibilidade de dispositivo físico.
- Contrastes medidos: texto do card 5,79:1; placeholder 4,95:1; texto navy
  secundário 10,74:1; metadados 6,65:1; ação secundária 12,12:1; primária 19,60:1.
- Detector Impeccable executado uma vez. Exceções justificadas: Lato é a fonte
  oficial; travessões são os placeholders originais de dado ausente; células
  financeiras têm seu próprio padding e o summary tem altura mínima de 58px.
- Diff final revisado e `git diff --check` aprovado.

As capturas são do HTML/CSS implementado e do app.js real, com dados de
demonstração. Não são mockups e não representam resultados de parceiros reais.
Capturas principais: [entrada desktop](login-1440.png), [entrada mobile](login-390.png),
[painel desktop](dashboard-1440.png), [painel mobile](dashboard-390.png),
[confirmação](finishing-390.png), [falhas parciais](partial-1440.png).
Resultados de QA: [results.json](results.json).

## Limites

Autenticação real por e-mail e leitura de dados reais não foram exercitadas.
Safari/iOS, Android físico, leitor de tela e DPR 2/3 não foram validados.
A nitidez foi inspecionada no Chrome, DPR 1, com os PNGs oficiais sem alteração.
O `--check` global do gerador de marca não pôde rodar porque o master dourado
não está em Downloads; nenhuma variante foi regenerada nesta tarefa.

## Reprodução local

Na pasta `parceiros`, iniciar `node scripts/serve_local.cjs` e executar
`node scripts/verify_visual.cjs`. O teste usa Playwright de desenvolvimento já
instalado no repositório pai. Não adiciona dependência de runtime ao portal.
Abrir `http://127.0.0.1:5055` para a entrada normal. As fixtures só existem
quando o script de QA intercepta o SDK; nunca são entregues aos usuários.

## Publicação

Alvo exclusivo: `hosting:parceiros`, projeto `auscultoapp`, site
`auscultoapp-parceiros`. Nenhuma publicação de backend ou outro site.
`firebase deploy --only hosting:parceiros --project auscultoapp --non-interactive`:
aprovado, release concluído. O CLI publicou exclusivamente o hosting
`auscultoapp-parceiros` (19 arquivos).

Depois da publicação, os 19 arquivos públicos foram baixados do domínio
`https://parceiros.auscultoapp.com` e comparados por SHA-256 com os arquivos
locais: 19 idênticos, nenhuma divergência. Os três arquivos funcionais listados
acima continuam idênticos aos servidos antes do deploy.

Smoke da entrada no domínio real, em contexto Chrome novo sem fixtures:
1440×900 e 390×844, DPR 1; logo atual e Lato carregados; nenhum overflow e
nenhum erro JavaScript não capturado. Nenhum formulário submetido.
Capturas reais: [desktop publicado](live-1440.png) e [mobile publicado](live-390.png).
