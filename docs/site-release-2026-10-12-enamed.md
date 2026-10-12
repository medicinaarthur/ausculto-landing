# Publicação de 12/10/2026: enamed.auscultoapp.com, "ENAMED o ano todo"

- **Versão no ar:** `792bd1a1ca6fc683`
- **Rollback:** `6699675345998f8f`
  - `POST https://firebasehosting.googleapis.com/v1beta1/sites/auscultoapp-enamed/releases?versionName=sites/auscultoapp-enamed/versions/6699675345998f8f`
- **Commit:** `493548b` em `feat/enamed-o-ano-todo-20261011`.
- **Publicado com:** `scripts/publicar-enamed.mjs`, que clona a versão ativa e troca só os caminhos do ENAMED. **Não sobe o `/meta_tracking.js`**, que continua sendo a versão do ar de 23/08.
- **Ordem do dono:** implementar direto no HTML do ENAMED, conferir celular e desktop e publicar ao final, sem perder o rastreio.

## O que mudou

A página da campanha de 25 dias, que terminou com a prova de 13/09, virou a página permanente do ENAMED, com a identidade da Academy (marfim, navy e ouro) e "enamed" sem o ano.

**Seções, na ordem:**
1. **Topo "Na mesa de estudo":** as miniaturas da Academy sobre uma mesa de verdade.
   - A ficha do Caso-Chefe traz a questão 34 do Caderno 1 do ENAMED 2025.
   - Passar o mouse nos objetos abre etiquetas com atalho para cada bloco.
   - No celular, a cena vem depois do título, com selos dentro dela.
2. **Trilha, Mapa-ilha:** o vídeo toca uma vez; depois os anéis acendem nas medalhas e abrem os cartões das áreas.
3. **Trilha, como é um capítulo:** cada parada (Caso, Caso-Chefe, Insígnia) ilumina a cena e faz o personagem reagir.
4. **Temas:** 170 temas, com a contagem por área. A lista acende o volume.
5. **Provas oficiais:** ENAMED 2026 e 2025, com o gabarito; "Como o Enamed dá a nota" aparece só como fato do Inep.
6. **Desempenho real (novo):**
   - a tela real da página Desempenho do app;
   - um mapa de exemplo por especialidade, com os rótulos do app (FRAQUEZA, FORÇA, SINAL INICIAL);
   - o botão "Ver meu desempenho real" (`desempenho`).
7. **Experimente um Caso-Chefe:** a questão 34 é interativa; quem acerta vê a insígnia brilhar e a residente comemorar.
8. **Para quem é**, as **perguntas frequentes** (com uma nova: "Como vejo meu desempenho?") e a **chamada final**.

**Personagens vivos:** as miniaturas das cenas reagem quando a cena aparece e no mouse ou no toque.
- **Corpo:** Grok `image_to_video`, com o personagem grande no quadro.
- **Rosto:** LivePortrait local, que anima a própria imagem.
- Com movimento reduzido ou economia de dados, a imagem fica parada e nenhum vídeo é baixado.

**Celular primeiro:**
- Cada cena tem um recorte próprio para o celular e o tablet (`*-cel-780/1170.webp`).
- O preload da imagem principal é separado por `media`.
- Os vídeos de reação só baixam depois do `load`.

## Rastreio (o que não mudou)

- `contentName`/`eventSource` = `landing_enamed_2026` e `AUSCULTO_REQUIRE_CONSENT = true`.
- `?angulo=` continua aceitando `direcao`, `tempo` e `erros`, agora com títulos sem data.
- Cada botão tem `data-event="enamed_cta_click"`, `data-cta-position` e os UTMs da landing (`utm_content=<variante>_<posição>`).
  - Posições: `header`, `hero`, `trilha`, `jornada`, `temas`, `provas`, `desempenho`, `demo`, `final` e `sticky`, mais `login` sem evento.
  - Os principais abrem `?open=academy`; os da Trilha abrem `?open=trail`.
- `enamed_section_viewed`: `trilha`, `jornada`, `temas`, `provas`, `desempenho`, `demo`, `para-quem` e `faq`.
- Eventos da questão: `enamed_demo_question_started` e `enamed_demo_question_answered`.

## Conferência

- **Antes de publicar**, no servidor local com o CSP do ar e o `meta_tracking.js` baixado do ar:
  - `test-enamed-tracking.mjs` passou: contrato íntegro;
  - nenhuma rolagem lateral e nenhum erro de JS em 360, 390, 430, 768, 1024, 1280, 1440 e 1920 px;
  - movimento reduzido: nenhum vídeo baixado;
  - sem JS: todo o texto visível.
- **Lighthouse de celular** no local, com texto comprimido como no Hosting:
  - Performance 89 a 90, Acessibilidade 97, Boas práticas 100, SEO 100;
  - CLS 0, LCP 3,3 s simulado;
  - a referência do /estudantes/ (27/09) é Performance 51, com LCP de 6,4 s.
- **Publicação:** `publicar-enamed.mjs --esperada 6699675345998f8f`; 102 arquivos novos e 4 trocados.
- **No ar, depois de publicar:**
  - 106 de 106 arquivos iguais ao commit;
  - `/meta_tracking.js` intacto (sha256 `ce669f7f…`);
  - `test-enamed-tracking.mjs` contra `https://enamed.auscultoapp.com/`: contrato íntegro;
  - canário sem consentimento em 390 e 1440 px: sem 4xx e sem erro de JS, e todos os links do app com UTM.

## 12/10, correções e lapidação

**Correção rápida:** versão `f55b76027a943a03`, commit `2924274`, rollback `792bd1a1ca6fc683`.
- Saíram as 14 reações de rosto do LivePortrait; o dono as reprovou ("filme de terror").
- A cena do Caso-Chefe no celular passou a usar a proporção do recorte.

**Lapidação:** versão `b163495b9583942f`, commit `5fca195`, rollback `f55b76027a943a03`.
- **Holofote pela silhueta exata:**
  - recortes do Segment Anything com o objeto acendendo e um véu marfim sobre o resto;
  - área de clique pelo contorno;
  - no celular, pinos em pontos vazios de cada objeto.
- **Cartões novos:** marfim com moldura dourada, a tela real do app, números e linha-guia. A posição evita os outros objetos e o texto.
- **Stop-motion:** quadros-chave gerados a partir da mesma base; só o corpo muda e o rosto é sempre o da imagem original. São 14 personagens em sprites WebP.
- **Revisão independente:**
  - sem halo dourado;
  - card do Desempenho na paleta;
  - ritmo vertical do celular;
  - botão fixo que some quando um botão de seção está na tela;
  - figura das Perguntas sem fundo.
- **Desempenho:** recortes e quadros de animação baixam depois do load.
- **Conferência:**
  - rastreio íntegro no local e no ar;
  - 138 de 138 arquivos iguais ao commit, e `meta_tracking.js` intacto;
  - larguras de 360 a 1920 px sem rolagem lateral;
  - Lighthouse de celular local: Performance 88 a 89, Acessibilidade 100, CLS 0.

## 12/10, holofote suave, cartão de folha de ouro e stop-motion com alfa

**Versão `3a7a9bc2599dea8e`**, commit `579fb08`, rollback `b163495b9583942f`.

O dono reprovou três coisas na lapidação anterior:
- animações que "bugavam o fundo";
- o contorno desenhado no hover ("falho e amador");
- o cartão simples. Pediu a arte do cartão feita no Codex.

**O que mudou:**
- **Destaque sem contorno:**
  - uma elipse de luz suave fica sobre o objeto e desliza de um para o outro;
  - o resto recua sob um véu marfim;
  - a câmera se aproxima 2,2% centrada no objeto;
  - saíram os recortes de silhueta. O contorno do Segment Anything segue só como área de clique e para posicionar o cartão.
- **Cartão:**
  - a moldura é arte do Codex (variação C entre três), com borda de folha de ouro, fio navy e estrelas de quatro pontas;
  - entra como `border-image` de 9 fatias (`card-frame-c.webp`), no desktop e no celular;
  - a posição evita sobretudo o objeto aceso e o texto da seção; cobrir objetos recuados pesa pouco.
- **Stop-motion:**
  - cada quadro agora é RGBA e só o corpo que mexe é opaco, limitado à silhueta do personagem. Fundo, tela e texto nunca são redesenhados;
  - os sprites ganharam nomes novos (`sma-*`), porque as imagens têm cache imutável;
  - o Dr. Aus e o leitor do topo passaram a stop-motion, no lugar dos vídeos do Grok;
  - a residente do Desempenho ficou parada: o quadro gerado tinha o braço solto atrás da medalha.
- **Correções:**
  - Perguntas: o `multiply` passou para o grupo (imagem + quadros). No quadro, ele deixava os braços cruzados aparecendo sob o aceno;
  - toque: rolar a página não fecha mais o cartão aberto pelo pino. O Chrome simula a saída do mouse no ponto do toque.

**Conferência:**
- quadros compostos sobre a cena, um a um, antes de subir, e de novo na página em 390 e 1440 px;
- rastreio íntegro no local e no ar;
- sem rolagem lateral de 360 a 1920 px;
- movimento reduzido sem baixar animação, e sem JS todo o texto visível;
- nenhum 4xx;
- Lighthouse de celular local: Performance 88 a 89, Acessibilidade 100, CLS 0,002;
- no ar: página, CSS, JS, moldura e sprites com hash igual ao commit; `meta_tracking.js` intacto (`ce669f7f…`); canário em 390 e 1440 px sem 4xx e sem erro de JS.
