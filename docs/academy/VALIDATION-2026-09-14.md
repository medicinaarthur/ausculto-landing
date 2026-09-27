# Validação — Academy

## Alteração atual, validada localmente

- Base CSS da última página publicada restaurada byte a byte (normalização LF), seguida apenas de regras de hero composto, cadernos e bloco de download.
- Duas imagens completas: pessoas dentro dos shapes, sem recortes posicionados separadamente. Alternância observada no navegador; nenhuma opção de pausa na UI. Ambas imagens carregaram.
- Visualização em 390, 768 e 1440 px, sem overflow horizontal. Em 390 px com fonte raiz 200%, sem overflow e título abaixo do cabeçalho.
- Bloco do ENAMED Comentado inspecionado em mobile: capa inteira, título, descrição e CTA de cadastro. PDF original conferido: 124 páginas, 100 questões e 400 alternativas comentadas, gabarito não oficial.
- 12 testes de conteúdo e apresentação aprovados; contratos ENAMED e tracking aprovados. Builds e integridade aprovados. Sintaxe JS/MJS conferida e diff sem erros de whitespace.
- Pacote isolado: 37 arquivos, 7 páginas, nenhum PDF completo. Canônicas e noindex preservados. Arquivo de download não colocado em URL pública.

## Limites

O CTA do novo material abre atualmente o app. A liberação automática do ENAMED 2026 após cadastro ainda não existe no app e não foi apresentada como validada. Há uma pergunta pendente sobre ampliar o escopo para app/backend, pois a instrução original excluía alterações Firebase. Não foram editados ou publicados app, Functions, domínio principal ou campanhas.

A disponibilidade autenticada de catálogo, leitor e PDF PRO em produção continua não validada nesta entrega. A revisão do PDF neste trabalho foi de identidade e estrutura, não uma nova revisão clínica.

## Sites privado

Versão 5 publicada com sucesso em https://ausculto-academy.arthurfe.chatgpt.site/. Navegador autenticado confirmou as duas artes completas carregadas, ausência de controle de pausa, título anterior de leituras restaurado e novo bloco ENAMED 2026 Comentado. Nenhum fluxo de download do app foi confirmado.

## Revisão atual do hero por referência

Artes completas distintas em desktop/mobile, duas duplas, texto e botões em HTML. Visual conferido em 1440 e 390 px; seleção mobile e ausência de overflow conferidas em 768 px. Em 390 px com texto 200%, sem overflow; cabeçalho termina em171.8px e conteúdo inicia em178px, card empilha sem corte horizontal. 12 testes aprovados novamente, contratos ENAMED/tracking e integridade dos builds confirmados. Conteúdo depois do hero idêntico à versão privada5. Sintaxe de JS/MJS e diff conferidos. Não há mudança no estado pendente da entrega do PDF após cadastro.


### Publica??o privada da revis?o por refer?ncia

Sites vers?o 6 publicada com sucesso em https://ausculto-academy.arthurfe.chatgpt.site. Fonte: 50415dd8b87d0fd6df5a48b29cc67bab42e03c19. Arquivo validado por SHA-256 contra o manifesto (41 arquivos, sem PDFs). No endere?o publicado, confirmados o hero reference-hero, ambas as imagens desktop carregadas e aus?ncia de overflow horizontal. Mobile, tablet e texto 200% validados localmente nesta revis?o. Nenhuma disponibilidade do app ou fluxo de download autenticado foi confirmada por esta publica??o.


### Corre??o de escala em telas largas

CSS do hero limita o canvas fotogr?fico a 1687 px, acompanhando o conte?do limitado a 1400 px, e limita a altura e o espa?amento vertical. Valida??o visual local em 2800 x 1500: rostos abaixo do cabe?alho e card alinhado ? base das pessoas; sem overflow. Mobile 390 x 844: composi??o pr?pria preservada, sem overflow. Build completo, verify:site e diff --check passaram. Apenas CSS e manifesto do pacote alterados.


### Natural portraits revision

Four new imagegen assets: desktop1672x941 and mobile941x1672 for two fictional adult pairs, including a20-year-old student. Full prompts in hero-natural-prompts.json. Inspected every selected asset. Runtime visual checks at390x844,1440x900 and2800x1500: loaded matching responsive images, no horizontal overflow, people below header and CTA, smoother navy edge integration. CSS contain preserves framing; mobile top transition blends background tones. Automatic pair alternation observed. Content afterhero matches prior HTML exactly. Academy content6/6 andpresentation6/6 tests passed; build andverify:site passed. No app runtime or authenticated PDF availability confirmed.

Sites private version8 deployed successfully: https://ausculto-academy.arthurfe.chatgpt.site. Exact source f43634d77dcaef8a618174a11fe1248c489f901d. Archive41files verified against SHA256manifest; noPDF. ENAMED andtracking tests also passed. Existing browser tab handed back to hosted URL; visual QA described above was local.
