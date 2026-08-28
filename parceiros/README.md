# Portal do Embaixador — parceiros.auscultoapp.com

Site estático que mostra ao embaixador os resultados do próprio código:
cliques, cadastros, resgates, assinantes, receita gerada, nível e extrato de
comissão.

## Por que estático

O público é influenciador e estudante abrindo no celular, muitas vezes em rede
ruim. O portal carrega alguns KB; o painel administrativo, em Flutter, custa
vários MB de primeira pintura. Também é um produto **voltado à marca** — ele
usa a identidade navy + dourado do Kit do Embaixador, não o cinza do painel
interno.

## Regras de arquitetura

- **Target isolado.** O `firebase.json` da landing possui três targets; o
  bloco `parceiros` publica somente `parceiros/public` e não hospeda Functions.
- **Sem dependências de runtime.** Nenhum bundler, nenhum framework.
- **Zero acesso direto ao Firestore.** Todas as coleções do programa são
  negadas nas regras; o portal fala exclusivamente com callables `partner*`,
  que rodam com Admin SDK e escopo do parceiro autenticado.
- **O código do cupom nunca sai do cliente.** O servidor o deriva do e-mail
  autenticado (`assertPartner`), então não há payload a adulterar.
- **Só agregados.** Nenhuma resposta traz nome, e-mail ou uid de quem usou o
  cupom. Isso é minimização de dados (LGPD) e está coberto por
  `functions/tests/partner_portal_privacy_test.js` no repositório do backend.

## Sistema visual

O mundo vem dos dois assets da marca: o fundo médico em navy (coração e
cérebro em wireframe, centro limpo) e o glifo "a" em vidro gelo.

**Disciplina de cor** — azul é ação e estado, verde é assinante, e **dourado
é só dinheiro e o código do cupom**. Ouro decorativo é o erro clássico deste
programa; um nível alcançado usa azul, e apenas o tier Ouro é dourado.

**Assets** (`public/assets/`, gerados com ffmpeg a partir dos originais):
logo recortada na bounding box e exportada em WebP **lossless** (512 e 256);
fundo em WebP 1672/1200/800 — 1,6 MB viraram 45 KB — mais uma miniatura de
32px embutida como data URI para cobrir o instante antes da arte chegar.
Nunca reamostre a logo com perda: o alfa dela é anti-aliased de verdade.

**Funil** — barras proporcionais com a queda entre etapas, não quatro placas
de tamanho igual. O ponto é mostrar onde perde.

**Movimento** — a geometria final é estática e o que anima é `transform`
(escala 0→1). Ao repouso a escala vale 1, então nada distorce, e não há
layout thrash. Respeita `prefers-reduced-motion`.

## Estrutura

```
parceiros/public/index.html   três estados: entrar → concluindo login → painel
parceiros/public/app.js       Firebase JS SDK, App Check e callables
parceiros/public/coupon_ui.js benefício e compartilhamento testáveis
parceiros/public/qr.js        QR próprio (byte mode, correção M, v1–10)
parceiros/public/styles.css   identidade do Kit do Embaixador
parceiros/public/config.js    configuração pública do App Check
parceiros/scripts/            validação, testes e servidor local
```

## Comandos

```bash
npm run verify:parceiros   # gate de integridade + contrato de benefício
npm run serve:parceiros    # http://127.0.0.1:5055 para revisar layout
npm run verify:partner-qr  # compara o QR com a referência, 216 casos
```

O verificador de QR precisa da referência somente em desenvolvimento:

```bash
npm --prefix parceiros install --no-save qrcode
npm run verify:partner-qr
```

## Estado da infraestrutura

Revalidado sem mutações remotas em 28/ago/2026:

- [x] Site de hosting `auscultoapp-parceiros` criado e publicado
- [x] **Email link (passwordless)** habilitado no Firebase Auth
- [x] `parceiros.auscultoapp.com` e `auscultoapp-parceiros.web.app` nos
      **Authorized domains** do Auth
- [x] `recaptchaSiteKey` preenchido em `public/config.js`
- [x] Configs de runtime criadas em `admin_private`:
      `partner_attribution_v1`, `partner_commission_v1` (desligada),
      `partner_tiers_v1`, `partner_assets_v1`
- [x] DNS, domínio customizado e certificado TLS ativos
- [x] Índices, regras e as functions `partner*` publicados

### Pendências operacionais

**1. Materiais (opcional).** Preencher `admin_private/partner_assets_v1`:

```json
{"assets": [
  {"title": "Story Pack", "description": "6 artes para Stories",
   "kind": "download", "url": "https://..."}
]}
```

Só URLs `https` são aceitas. Enquanto estiver vazio, a seção mostra um
estado vazio honesto.

**2. Provisionar e aprovar embaixadores.** Defina o e-mail de acesso, crie o
cupom principal e confirme a prontidão no Admin. Só entram no portal inscrições
com status
`aprovado`, `aguardando_aceite`, `onboarding` ou `ativo`. Quem está em
`nova`/`em_analise` ainda não passou pela sua avaliação e é bloqueado.

## Publicação

O deploy é um passo manual e autorizado, fora dos scripts do repositório:

```bash
firebase hosting:channel:deploy preview --only hosting:parceiros   # revisar
firebase deploy --only hosting:parceiros                           # publicar
```

O backend correspondente (callables `partner*` e `partnerLinkRedirect`) vive
no repositório canônico do app e é publicado separadamente. **Os índices do
Firestore precisam estar no ar antes das functions.**

## Link rastreado

O link publicado pelo embaixador é `https://parceiros.auscultoapp.com/r/CODIGO`.
A rewrite `/r/**` chama `partnerLinkRedirect`, que conta o clique e redireciona
para o link canônico com os UTMs. Cliques são **brutos**, não únicos — contar
únicos exigiria identificar visitantes.

O ideal seria `auscultoapp.com/r/CODIGO`, mas essa rewrite pertence ao
repositório da landing. Enquanto isso, apontar `go.auscultoapp.com` para este
mesmo site resolve a estética do link sem tocar na landing.
