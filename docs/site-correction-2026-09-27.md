# Correção Ausculto — 27/09/2026

Implementação no projeto `ausculto-landing-deploy`; app usado apenas como referência. Nenhuma publicação do app ou de Functions integra esta entrega. O checkout tinha mudanças locais anteriores: baseline e delta por SHA separam esta correção sem reset, stash ou commit amplo.

## Experiência entregue

- Simulador com quatro etapas, Treino, Prova Focada e Mista; seleção múltipla, busca, hierarquia dependente, dificuldades e quantidades reais. Usa exportação da publicação remota e o mapeador Dart canônico do app. ENAMED/ENARE unificados. A prévia não gera questões nem transfere escolhas. O CTA abre o aplicativo.
- Cards de residência e simulados com silhuetas iguais no desktop, naturalmente dimensionadas. Marcas oficiais em dourado sobre navy, preservando geometria e identificadas como bancas presentes no banco. Métricas legíveis no celular; banco de 70 mil+ separado das 14.345 oficiais.
- Curso de ECG destacado de forma independente,18 módulos reais, artes originais responsivas e acesso ao primeiro módulo. Catálogo editorial compacto com152 temas; busca/filtros não escondem o curso.
- Leitores navy/dourado, DM Serif Display e Montserrat, sumário e imagens ampliáveis. Notas, conclusão explícita, posição marcada e fonte de 85–150% salvos somente neste navegador, por tema/versão/seção. Armazenamento indisponível mantém controles na sessão com aviso.
- Livros originais preservados, inclusive animação:3 destaques, 3 no portal e 2 relacionados por leitor. Hover, toque e teclado funcionam.
- Sete figuras com logo navy incorporada aos pixels, dentro da área ilustrada. Novo fluxograma gasométrico vetorial, com ramificações reais e continuidade mesmo com pH normal. Legenda incongruente corrigida por errata de apresentação protegida por versão/bloco/hash. Conteúdo canônico permanece intacto. Referências conceituais: [ATS](https://www.thoracic.org/professionals/clinical-resources/critical-care/clinical-education/abgs.php) e [Merck](https://www.merckmanuals.com/professional/nephrology/acid-base-regulation-and-disorders/acid-base-disorders). Não foi realizada revisão clínica humana adicional.
- Foto original do AusFlow desktop/celular restaurada; ícone pequeno junto ao título. AusMind mantém a composição aprovada, PNG fornecido no fundo e brilho discreto pausado fora da tela, com página oculta e em reduced motion.

## Fontes e rastreabilidade

Catálogo editorial publicado: `academy-temas-20260925`,170 entradas = 152 temas + 18 ECG. Taxonomia: documento publicado +sete documentos de disponibilidade, publicação de 15/05/2026, 313 caminhos canônicos (5 áreas, 59 especialidades, 191 temas, 58 subtemas). Essa fotografia não promete estoque atual. Dados públicos não contêm contagens por tema, questões ou configurações operacionais.

Fontes imutáveis conferidas: `academy-presentation.json`, `academy-product.json`, `academy-qdemo.html` e todos os assets originais dos livros. Fontes/derivados/manifesto juntos; arquivos substituídos ficam fora do artefato público, masters e SVG editável em área privada.

## Validação e evidências

-27/27 testes existentes;15/15 testes de correção;6/6 de conteúdo; tracking OK; sintaxe de todos os JS/MJS alterados OK; build e manifesto verificados.
- Matriz Chrome isolado de 6 páginas × 6 larguras(360,390,768,1100,1440,1920), fluxos reais, teclado/toque, fonte/progresso após reload, armazenamento negado, DPR 1/2/3, texto 200% e reflow equivalente a zoom 200%.
- Revisão independente em contexto independente (gpt-6-astra): sem Critical; altura do wizard e números móveis corrigidos pelo executor. Capturas de figuras aguardam decode para eliminar evidência vazia.
- Evidence workspace: `.local-art/correction-20260927/`; antes: `before-live`; depois aprovado: `release-qa`; relatórios/logs, baseline/delta e ledger preservados.
- Build público: 728 arquivos, incluindo as 6 páginas afetadas. Estado final de QA e release será registrado abaixo.

## Decisões de execução e limites

1. Trabalho no checkout indicado, preservando alterações anteriores; não criada worktree limpa que perderia a implementação a corrigir. Custo se incorreto: revisão exige delta por SHA, não somente Git.
2. Não criado commit amplo nem removidas evidências. Custo: o histórico desta entrega depende dos hashes/ledger preservados até integração seletiva.
3. Fluxograma e marca composta produzidos com SVG/canvas determinístico, preservando artes acadêmicas aprovadas. Custo: a qualidade depende da inspeção direta dos arquivos finais, realizada em Chrome.
4. Solicitação posterior de alturas iguais prevalece sobre a regra inicial de não esticar cards. Custo: etapas curtas distribuem espaço interno; nenhuma altura corta conteúdo.
5. Limites da revisão: iPhone/Android físicos e Safari não testados, revisão clínica completa do material publicado não incluída, geração autenticada do app não executada. A taxonomia publicada pode estar desatualizada em relação ao estoque instantâneo. Verificação de visibilidade usa evento document.hidden controlado, não uma alegação de teste de background em aparelho real.

Não há pendências menores de produto deliberadamente adiadas. A entrega preserva as fontes em edição e o resultado gerado; não depende de uma edição manual apenas em dist.

QA final aprovado: **62/62 verificações de navegador**, **93 capturas** com imagens decodificadas. Demonstração da questão respondida e corrigida em 390 e 1440 px. Após formatação do exporter Dart, rebuild comparado byte a byte com o artefato testado: nenhuma mudança pública. Manifesto verificado.


## Publicação e comprovação

Publicado exclusivamente em **hosting:site**, projeto auscultoapp: versão **44d5e0fca67a515b**, release **1790496713972000**, 27/09/2026 às 05:11:53 (Brasília). Rollback anterior: 4f29cdf744d03047 /1790489875305000.

**17/17 verificações pós-publicação passaram.** Seis páginas em 390 e 1440 px, hashes dosHTMLs iguais ao artefato aprovado, assets das sete figuras, seis marcas, três artes ECG e recursos dos componentes idênticos ao manifesto, cache de HTML e cache busting verificados. Domínio com e sem www corretos. Livros, seletor do simulador, curso e persistência dos leitores funcionam no domínio real. Recusa de cookies produziu referência assinada em ambos os domínios e não carregou tracking de terceiros.

- [Site](https://www.auscultoapp.com/)
- [Academy e simulador](https://www.auscultoapp.com/estudantes/#duvidas)
- [Curso de ECG](https://www.auscultoapp.com/estudantes/#curso-ecg)
- [Portal de leituras](https://www.auscultoapp.com/conteudos/)
- [Abdome agudo](https://www.auscultoapp.com/conteudos/abdome-agudo/)
- [Distúrbios eletrolíticos e ácido-base](https://www.auscultoapp.com/conteudos/disturbios-eletroliticos-e-acido-base/)
- [Estudos epidemiológicos](https://www.auscultoapp.com/conteudos/estudos-epidemiologicos/)

Evidências: `.local-art/correction-20260927/live/report.json` e 12 capturas pós-deploy; `release-qa/report.json` e 93 capturas pré-deploy; `before-live` conserva 14 capturas anteriores. O log privado do CLI não integra o artefato público. Alterações do app encontradas em vitais/teste visual durante a execução pertencem a trabalho concorrente; não foram editadas ou revertidas.
