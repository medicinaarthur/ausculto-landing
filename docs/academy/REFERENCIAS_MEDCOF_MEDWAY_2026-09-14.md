# Referências visuais: MedCof e Medway

Inspeção em 14/09/2026. Objetivo: entender direção de arte, assets, informação e interação das homepages para orientar uma conversa posterior sobre Ausculto Academy. Este documento não aprova um redesign e não substitui DESIGN.md.

Fontes primárias: https://www.grupomedcof.com.br/ e https://www.medway.com.br/.

## Evidência e limites

- Navegação real no Chrome, leitura do DOM, estilos computados e inventário de assets observados.
- Desktop observado em viewport de aproximadamente 1061 × 928; mobile confirmado por DOM em 390 × 844. As primeiras capturas imediatamente após mudar o viewport estavam atrasadas e foram descartadas da interpretação responsiva.
- Inspeção visual de hero, resultados, metodologia e catálogo; leitura da sequência de professores, depoimentos, estrutura presencial e rodapé. Nem todos os slides, páginas internas ou estados foram inspecionados visualmente.
- Os dois arquivos de hero foram baixados para diretórios temporários do navegador e examinados separadamente. Não foram incorporados ao site da Academy.
- Alegações de aprovação, liderança, reconhecimento e quantidade de alunos são mensagens publicadas pelos próprios sites. Não houve auditoria independente dessas alegações, nem medição de conversão.
- Conteúdo dinâmico importa: na MedCof, a primeira leitura continha basicamente o hero; seções posteriores ficaram disponíveis depois. A Medway possui carrosséis automáticos, e capturas durante transições podem exibir dois slides parcialmente.

## MedCof: contexto e organização

A homepage vende preparação para residência e provas de título. Apresenta uma promessa de desempenho, oferece exploração de produtos ou experimentação do método e pergunta quando o visitante fará a prova. O visitante é encaminhado por objetivo e etapa.

Sequência observada no DOM:

1. Navegação institucional e comercial; acesso do aluno em destaque.
2. Hero com promessa de aprovação, explicação breve, duas ações e seletor de ano.
3. Indicadores de resultados e galeria de primeiros lugares.
4. Catálogo com categorias R1, R+, títulos e busca.
5. Preparatórios específicos para provas de título.
6. Metodologia com oito entradas: material, inteligência, unidade, professores, flexibilidade, retenção, conteúdo e questões.
7. Campanha e cursos destacados.
8. Corpo docente e credenciais.
9. Diferenciais, CofBot e apresentação institucional.
10. Depoimentos, unidades presenciais e rodapé.

### Direção visual

Base muito clara, texto quase preto e vermelho como acento dominante. O vermelho conecta trechos dos títulos, CTA, ícones, seleção ativa e as artes de aprovação. Há amplo espaço vazio, divisórias finas, controles arredondados e sombras suaves em superfícies brancas.

O hero coloca o argumento à esquerda e uma composição de aprovados à direita. A assimetria dos retratos é intencional, mas existe uma unidade repetível: recorte humano + campo vermelho + instituição/especialidade + pequenos quadrados decorativos. Um selo com avatares e contagem fica separado no layout.

O catálogo muda de linguagem dentro dessa identidade: thumbnails escuras de campanhas, marcas dos cursos, categoria, avaliação, descrição e matrícula. Nem toda imagem é clínica; há metáforas de conquista e alto rendimento.

### Tipografia e cores verificadas

- Corpo observado: Inter, 18 px no parágrafo do hero; navegação em torno de 14 px.
- H1 do hero observado: pilha `ui-sans-serif, system-ui`, 61,6 px e peso 600 no desktop inspecionado.
- Switzer aparece declarado em outro heading e é carregado como recurso. Não assumir que todos os títulos visíveis usam Switzer.
- CTA principal observado: `rgb(226, 38, 60)` / `#E2263C`.
- Texto principal observado: `rgb(23, 23, 23)` / `#171717`.
- Texto de apoio observado: `rgb(82, 82, 82)` / `#525252`.

Esses valores são amostras do estado renderizado, não uma extração completa do design system.

### Assets relevantes

| Asset | Dimensão natural observada | Papel |
|---|---:|---|
| `/img1.webp` | 2400 × 1760 | Dupla de aprovados, campos vermelhos, nomes e instituições já compostos na imagem |
| `/img2.webp` | 2528 × 1696 | Outra arte do conjunto rotativo do hero |
| `/img3.webp` | 2560 × 1656 | Outra arte do conjunto rotativo do hero |
| `/img4.webp` | 2528 × 1696 | Outra arte do conjunto rotativo do hero |
| `/images/home/methodology/material-books-light-v2.webp` | 1672 × 941 | Apresentação de livros/fichas em cena com dispositivo e ambiente de estudo |
| `/hiit-25.webp` | 782 × 307 | Arte de campanha de curso em destaque |
| `/internato.webp` | 519 × 204 | Arte de curso em destaque |
| `/arenas/arena-sp.webp` | 1200 × 1600 | Fotografia do espaço presencial |
| `/images/aprovados_2026/…` | Variável | Retratos da galeria de resultados |
| `/institutions/…` | Variável | Marcas das instituições associadas aos resultados |

Prefixo dos caminhos: `https://www.grupomedcof.com.br`.

O ponto técnico decisivo: o hero não monta cada pessoa, nome e quadrado com elementos HTML independentes. Cada `/imgN.webp` já contém uma composição. O layout usa `object-fit: contain` para preservar a arte. Já a cena de material usa `cover` em um quadro com proporção definida. A aparência de recorte não prova por si só a existência de alpha; este levantamento não fez auditoria de canais de transparência.

### Mobile e interação

Em 390 px, a navegação vira logo e menu. O argumento aparece primeiro, depois dois botões empilhados de largura ampla, seletor de ano e arte de aprovados. O seletor abre opções para final de 2026, 2027 e 2028. A composição não é simplesmente a tela desktop reduzida.

Foi observada rotação das artes do hero e da galeria, navegação por tabs e presença de contato fixo por WhatsApp. O contato flutuante sobrepõe parte do conteúdo inferior da viewport.

## Medway: contexto e organização

A homepage combina campanha de aquisição com apresentação da plataforma, metodologia e catálogo. Na data da inspeção, o hero promovia lista de espera dos Extensivos 2027 com benefícios, prazo e segmentação pelo ano de prova; havia também uma entrada ENAMED para o quarto ano.

Sequência observada:

1. Barra utilitária, menu de cursos, marca central, busca e faixa de resultados.
2. Hero de campanha: urgência, oferta, arte dos benefícios, seleção de etapa e CTAs.
3. Resultados nacionais, mapa do Brasil e indicadores.
4. Galeria de aprovados com nome, especialidade e instituição.
5. Metodologia: MedBrain, aulas, questões, material e Casa Medway.
6. Reconhecimento institucional e chamada para experimentar a plataforma.
7. Professores e suas especialidades/instituições.
8. Depoimentos e chamada para ex-alunos.
9. Catálogo por R1, R+, provas de título e Revalida.
10. Newsletter, aplicativo e navegação institucional.

### Direção visual

Azul profundo estabelece o campo de marca; turquesa destaca ações e benefícios. Seções alternam fundos escuros com branco ou azul muito claro. Títulos têm peso elevado; o desenho das letras é consistente entre navegação, campanha e seções.

O hero possui duas camadas de composição: o fundo da seção com variações luminosas de azul e a arte de campanha colocada à direita. Essa arte tem fundo próprio escuro e cantos arredondados. Dentro dela, livros, bolsa, garrafa e representações de cursos formam um conjunto com sobreposição, escala e iluminação relacionadas.

A metodologia também utiliza assets específicos para cada benefício: interface/planejamento, professora com recurso didático, banco de questões, coleção de livros e fotografia do espaço presencial. A função das imagens acompanha o conteúdo do slide.

### Tipografia e cores verificadas

- Montserrat no título, corpo, navegação e botões examinados; nomes internos do Next incluem sufixos gerados.
- H1 no desktop inspecionado: 32 px, peso 700. É um título longo de campanha, por isso não deve ser comparado apenas pelo tamanho ao hero da MedCof.
- Texto de oferta acima do H1: 24 px, peso 400.
- Azul de texto/navegação observado: `rgb(0, 32, 91)` / `#00205B`.
- Turquesa de ação observado: `rgb(1, 195, 170)` / `#01C3AA`.
- Seletores de ano: fundo turquesa translúcido e texto branco no hero.

### Assets relevantes

Os arquivos editoriais observados vêm de `site-medway.s3.sa-east-1.amazonaws.com/wp-content/uploads/sites/5/` e são entregues pelo otimizador `https://www.medway.com.br/_next/image/`.

| Caminho relativo no armazenamento | Papel |
|---|---|
| `2026/08/18090800/2-hero-lista-espera_ext-27-6-1.png` | Arte única dos benefícios da campanha |
| `2026/01/27142223/2-Medbrain.png` | Visual de planejamento/tecnologia |
| `2026/05/22102532/3-aulas-ultradidaticas-2.png` | Demonstração da experiência de aula |
| `2026/01/27142216/4-ultrabanco-questoes.png` | Apresentação do banco de questões |
| `2026/01/27144810/5-material.png` | Coleção de material didático |
| `2026/03/17172301/Group-1505.png` | Visual da Casa Medway |

A versão entregue do hero foi identificada como WebP, 535 × 559, mesmo que o nome da fonte termine em PNG. A dimensão observada é do recurso entregue, não uma prova da dimensão do arquivo original no armazenamento. Os quatro primeiros assets de metodologia apareceram em 469 × 438 no desktop e 384 × 359 no mobile; a Casa Medway em 439 × 422 na instância carregada.

Título promocional superior, contorno e etiquetas de benefícios já estão rasterizados na arte do hero. O título principal, seleção de ano e CTAs da página continuam em HTML. Isso ajuda a entender o que exigiria uma nova arte quando a campanha muda.

### Mobile e interação

Em 390 px, a navegação fica compacta, a busca vira ícone e o hero é empilhado. O título centralizado precede a arte, que ocupa grande parte da largura. A imagem ganha prioridade sobre os seletores/CTAs que ficam mais abaixo. Isso difere da MedCof, que coloca as ações antes da arte.

O catálogo mobile usa navegação horizontal por grupos. Foram observadas seleção de categorias, galeria/carrossel de metodologia com avanço automático, depoimentos com paginação e contato fixo. Em algumas capturas o WhatsApp cobriu a base da arte ou conteúdo; é um trade-off visível, não uma prova de melhora de conversão.

## Síntese para a futura conversa sobre Academy

As duas referências usam direção de arte ligada à oferta. Pessoas podem representar resultado ou docência; materiais tornam uma entrega tangível; telas e cenas explicam o método; marcas institucionais sustentam o argumento de autoridade. O papel de cada imagem precede sua decoração.

Princípios transferíveis, sujeitos ao próximo pedido do usuário:

- Definir um objetivo para cada seção e um papel para cada asset.
- Criar composição visual antes de tentar resolver tudo com posicionamento CSS.
- Relacionar escala, luz, perspectiva, recorte e cor entre os elementos de uma mesma arte.
- Dar à escolha do visitante uma estrutura clara, por objetivo ou etapa.
- Associar cada recurso a uma representação própria e informativa.
- Reorganizar a sequência no mobile de acordo com a prioridade, preservando textos e ações em HTML.
- Usar alternância de densidade e fundos para marcar capítulos da página.

O contexto de produto da Academy continua sendo recursos digitais do app. Livros físicos, corpo docente, videoaulas, aprovações, brindes e espaços presenciais dos concorrentes não estabelecem ofertas equivalentes da Academy. O estado editorial dos resumos e as condições de acesso PRO continuam sendo contratos do produto.

A documentação anterior registra rejeição de montagens incoerentes e de screenshots nesta landing. Esta pesquisa não revoga essas decisões, tampouco proíbe nova direção caso o usuário a solicite explicitamente. Sua contribuição é entender por que as composições de referência têm unidade e função.

## Estado após a pesquisa

Nenhuma fonte HTML, CSS ou JavaScript da Academy foi alterada. Nenhum build ou deploy foi executado nesta etapa. As referências não foram copiadas para a árvore pública. Este arquivo é um registro de observações e interpretações de design, não uma auditoria técnica completa dos sites concorrentes.
