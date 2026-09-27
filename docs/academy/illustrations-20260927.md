# Ilustrações complementares — 27/09/2026

Quatro artes originais criadas com a geradora integrada do ChatGPT. Não são cópias de figuras de livros nem capturas do app. Os blocos e as imagens publicados na Academy permanecem íntegros.

| Figura | Tema e posição | Revisão conceitual |
|---|---|---|
| Cinco mecanismos | Abdome agudo, após `section-003` | Categorias da tabela publicada; obstrução proximal/distal, isquemia sem extravasamento e sangramento distintos. Esquema sem escala anatômica. |
| Quatro distúrbios | Eletrólitos/ácido-base, após `section-016` | HCO₃⁻↓/pH↓, HCO₃⁻↑/pH↑, PaCO₂↑/pH↓, PaCO₂↓/pH↑. Compensação e mistos separados. Figura corrigida para retirar uma estrutura molecular decorativa imprecisa. |
| Dados agregados | Epidemiologia, após `section-017` | Associação de grupos não autoriza inferência individual; pessoas e documentos são símbolos sem dados reais. |
| Desenhos de estudo | Epidemiologia, após `section-029` | Coorte exposição→desfecho; caso-controle desfecho→exposição anterior; transversal mesmo recorte. Nota de coorte retrospectiva preserva a distinção entre direção analítica e cronologia. |

Referências consultadas: [CDC — Analytic Epidemiology](https://archive.cdc.gov/www_cdc_gov/csels/dsepd/ss1978/lesson1/section7.html), [IARC/OMS — Studies based on routine data, capítulo 11](https://publications.iarc.who.int/_publications/media/download/4118/a71dca0e43d2c356f8d810b83e419aa30c8472eb.pdf), [MSD/Merck — Primary Changes and Compensations in Simple Acid-Base Disorders](https://www.merckmanuals.com/professional/multimedia/table/primary-changes-and-compensations-in-simple-acid-base-disorders?ruleredirectid=747) e tabela do tema publicado de Abdome. Os conceitos foram conferidos; não foi contratado um novo revisor clínico humano.

Os prompts completos estão em `illustration-prompts-20260927.json`. Edição final de ácido-base: retirar apenas os dois conjuntos de esferas decorativas e substituí-los por um medalhão conceitual HCO₃⁻; manter as oito setas e o restante da figura. Revisão visual confirmou a correção.

Arquivos finais e SHA-256: `scripts/data/academy-illustrations.json`; artes públicas em `site/assets/academy/illustrations/`. Masters privados em `.local-art/site-lapidacao-20260927/academic-figures/`.

A marca navy `site/assets/brand/ausculto-a-navy-240.png` foi incorporada byte a byte na composição SVG, com opacidade 0,4 no canto inferior direito, dentro de margem própria. A geradora não redesenhou a logo. O bitmap original é convertido para WebP lossless e incorporado em SVG com fundo branco; a composição pode ser ampliada e salva com a marca. Não há alteração de pixels da logo, tint ou recorte. Comando reproduzível: `python -X utf8 scripts/package-academy-illustrations.py .local-art/site-lapidacao-20260927/academic-inputs.json`.

Legendas, texto alternativo, referências e ampliação por teclado disponíveis em cada leitor. Capturas reais estão em `.local-art/site-lapidacao-20260927/after/runtime/`, incluindo telas de 360, 390, 768 e 1440 px. O teste `test-academy-illustrations.mjs` bloqueia drift de bytes, marca e posição e não modifica a publicação no app.
