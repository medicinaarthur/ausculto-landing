# Revisão do circuito do Dr. Aus

Escopo: apenas o desenho e a composição de “Um estudo que continua”. O PRO aprovado foi preservado.

O desenho anterior reduzia a metodologia a números e títulos pequenos dentro de círculos. Faltavam os ícones, as descrições externas, a direção das setas e as anotações da referência. O personagem também não tinha a mesma relação de escala com o circuito.

Alterações:

- Ícones lineares de leitura, prática clínica, revisão e desempenho, com títulos e descrições externos aos círculos.
- Percurso SVG em segmentos direcionais e traço de seleção alinhado ao desenho de base.
- Texto introdutório e anotações da referência: “Seu desempenho orienta o que vem depois” e “Estudo hoje. Um médico melhor amanhã.”
- Tipografia e proporção editorial ajustadas; personagem maior e controles fora de sua silhueta.
- Accordion, quatro poses, navegação manual e adaptação mobile preservados. Nenhum texto funcional rasterizado.

Fontes alteradas: `scripts/academy-journey.mjs` e `site/assets/css/academy-cycle.css`. HTML gerado pelo build.

Validação: build e verificação de artefato; `node --check`; seleção das quatro etapas e ausência de overflow em 320, 390, 768, 1024, 1280, 1440, 1716 e 1920 px nos motores Chromium, Firefox e WebKit. Axe sem violações nos blocos verificados em 320, 390, 768 e 1440 px. Capturas reais revisadas. Sem teste em aparelho físico e sem publicação.

Revisão visual: `.local-art/academy-refinement/editorial-flow/review.html`.
