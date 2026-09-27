# Academy paths v2 — implementação e validação concluídas

Requested sequence: Residence → audited bank cards → ENAMED book → clinical tools; then full-width PRO and refined learning orbit.

Checkpoint before further visual corrections, requested by owner. This snapshot is not a production release. The deployable baseline is generated in dist/site, which is intentionally ignored by Git. Build scripts and source assets are preserved here.

Completed: read-only Firestore bank audit (40 banks, 14345 documents, 234 duplicate exam numbers, 14022 unique commented questions); original doctor/hand/book and tool icons packaged; imagegen book half/open, device and PRO plate generated; path markup/styles/controllers drafted.

Concluído: três seções independentes, faixa única de bancas auditadas, livro com índice HTML e controle por hover/foco/teclado/toque/scroll, ferramentas com captura independente e sete cards, PRO amplo com quatro poses preservadas e órbita regular com acessos às lojas. Os estilos antigos desses componentes foram consolidados. Hero, autenticação, paywall, consentimento e contratos de analytics foram preservados.

Preview em execução: http://127.0.0.1:4197/estudantes/. Comparação local: `docs/academy-paths-v2-captures/comparacao.html`. Relatórios: `academy-paths-v2-data-report.json`, `academy-paths-v2-banks.md` e `academy-paths-v2-validation.json` neste diretório.

Validação: 19 combinações de viewport/DPR — 360, 390 e 430 px em DPR 1/2/3; 768, 1024, 1280, 1440 e 1920 px em DPR 1/2. Sem overflow horizontal e sem violações Axe nos componentes alterados. Teclado, toque, abertura por scroll, pausa/foco/hover/offscreen, falhas de imagem e fonte ampliada a 200% passaram. A sequência PRO, no-JS, perda de imagens e sincronização de etapas também passaram nos testes pertinentes existentes.

Checks finais: 19 módulos em `node --check`; 27 testes de regressão da landing; três testes de caminhos/auditoria; contrato de tracking; build e integridade do artefato. Revisão independente encerrada sem achados pendentes. Nenhuma publicação em produção foi feita. Não houve validação em aparelho físico; a matriz foi executada no Chrome real controlado pelo Playwright neste computador.

Ruling: a entrada da mão usa geometria explícita do centro da seção em um listener passivo limitado por requestAnimationFrame, removido após a entrada única. Margens percentuais do IntersectionObserver não entregaram o ponto central esperado em todas as proporções. A entrada de 800 ms e a posição na transição mobile permanecem preservadas.

Ruling: as páginas contêm os seis títulos canônicos, inclusive as versões extensas de Abdome Agudo e Aleitamento Materno. Uma seleção expansível repete esses títulos para leitura confortável em telas pequenas. Os tópicos de semiologia continuam registrados como `needs_review`; a landing não os anuncia como revisados.

Ruling: imagegen returned opaque studio backdrops despite transparent prompts. Preserve original generated masters and use measured CSS geometry masks for the book frames, rather than painting/editing raster pixels or regenerating repeatedly.

Local audit exports and captures remain in .local-art and are excluded from Git. No credential material belongs in the backup.
