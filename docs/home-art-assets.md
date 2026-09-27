# Homepage 2026 — proveniência das imagens

Atualizado em 2026-09-16. Regra geral: pessoas geradas são ilustrativas e ficam sem nome, credencial ou depoimento; depoimentos usam apenas pessoas reais que já autorizaram a publicação em `ads-estudante.html` e na homepage anterior. Nenhum logo de sociedade médica implica parceria: o texto é "conteúdo baseado em diretrizes de", conforme a moldura legal documentada em `commit-v1-premium-backport/lib/features/home/presentation/premium/premium_home_guidelines.dart`.

## Assets em `site/assets/home/`

| Arquivo | Origem | Observações |
|---|---|---|
| `notebook-1400.webp`, `notebook-900.webp` | `C:\Users\medic\Downloads\notebook.png` (composição fornecida pelo dono, gerada no ChatGPT) | trim pelo alfa (1415×1037) → WebP lossless com alfa |
| `logos/{ms,sbc,sbp,febrasgo,sbcm,sbr,aha}.png` | `commit-v1-premium-backport/assets/branding/premium_v2/guideline_*.png` (originais baixados dos sites oficiais, autorização do dono em 2026-08-05) | brancos sobre alfa, altura 96 px; tintados em navy por `mask-image` |
| `hero-doctor.webp` | Grok `image_gen`, 16:9, 2026-09-16, script `.local-art/home-art/run-hero-doctor.sh` | médica fictícia ao notebook; terço direito; sem rosto para a câmera |
| `cta-doctor.webp` | Grok `image_gen`, 16:9, 2026-09-16, script `.local-art/home-art/run-cta-doctor.sh` | médico fictício em corredor ao entardecer; metade direita |
| `academy-scene.webp` | `site/assets/academy/academy-study-scene-v1.webp` (ver `docs/academy-art-assets.md`) | redimensionada para 1200 px |
| `people/{maria,loren,gui,camila}-{160,320}.webp` | fotos reais já publicadas (`assets/testimonials/`, `site/assets/testimonials/`) | recorte quadrado com foco no rosto |
| `brand-{navy,white}-{64,128}.webp`, `icon-{192,512,180}.png` | `assets/icons/auscultologonova.png` (branco) e `auscultologonovaazul.png` | marca tintada; ícones PWA/Apple |
| `og-home.jpg` | `site/assets/og-image.png` | JPEG 1200×630 q82 |

## Prompts (Grok)

### hero-doctor
Editorial documentary photograph for a premium Brazilian medical platform website, landscape 16:9. A Brazilian woman physician around 35 years old, medium-brown skin, dark hair tied back, wearing a clean white coat over a navy top with a stethoscope around her neck, seated at a desk in a bright modern clinic office, looking down at an open laptop (the laptop is seen from behind, its screen is NOT visible), calm concentrated expression with a faint natural smile, real skin texture and pores, no retouching. Soft natural window light from the right side. COMPOSITION IS CRITICAL: the physician occupies only the RIGHT third of the frame; the LEFT two thirds are a clean, bright, nearly empty ivory-white wall and desk surface in very soft focus, leaving large quiet negative space. Muted palette of ivory, white, navy and warm wood. Shot on a 50mm lens at f/2.8. No text, no logos, no visible user interface, no floating objects, no stock-photo grin, she does not look at the camera, no CGI look.

### cta-doctor
Editorial documentary photograph, landscape 16:9, for a premium Brazilian medical platform website. A Brazilian male physician in his early forties, short dark hair with a little grey, wearing a white coat over dark navy scrubs, standing in a quiet hospital corridor at dusk, looking down at his smartphone (the screen is NOT visible), thoughtful and calm expression. Cool deep-navy and blue tones, low ambient light with soft cyan window light coming from the right, gentle film grain, real skin texture, no retouching. COMPOSITION IS CRITICAL: the physician stands in the RIGHT half of the frame; the LEFT half is a dark, nearly empty deep-navy corridor wall in deep shadow, leaving large negative space for a headline. Shot on a 35mm lens at f/2.8. No text, no logos, no visible user interface, not smiling at the camera, no CGI look.

## Fonte

`site/assets/fonts/home/dm-serif-display-400-latin.woff2`: subset latino de `commit-v1-premium-backport/assets/fonts/DMSerifDisplay-Regular.ttf` (SIL Open Font License, `DMSerifDisplay-OFL.txt`), gerado com fontTools 4.64 + brotli.

## Rodada 2 (2026-09-16, fidelidade ao conceito)

| Arquivo | Origem | Observações |
|---|---|---|
| `hero-scene.webp`, `hero-scene-900.webp` | composição em Pillow (`scratchpad/compose-hero.py`): fundo `.local-art/home-art/hero-desk.jpg` (Grok `image_edit` sobre `hero-scene.jpg`, que por sua vez veio de `image_edit` com `notebook.png` + `hero-doctor.jpg`) + `Downloads/notebook.png` colado por cima com sombra | a médica é fictícia; as telas são o mockup original (o Grok redesenha texto de tela, por isso a colagem) |
| `student.webp` | Grok `image_gen`, 3:4, script `.local-art/home-art/run-student.sh` | estudante fictícia, card Academy |
| `people/maria-card.webp` | recorte 4:3 de `assets/testimonials/maria.png` (foto real) | card "Na rotina real" |
| `fonts/home/caveat-var-latin.woff2` | Google Fonts (Caveat, OFL), subconjunto latino | nota manuscrita do hero |
| `cta`: `site/assets/academy/navy-background-1.webp` | já existia (Academy) | fundo do CTA final |

## Rodada 3 (2026-09-16): imagens literais do conceito

O dono pediu exatamente as imagens do conceito 3 (`Downloads/e121b428-b002-4044-9d87-f054a7d1a7a9.png`). Recortes em `.local-art/home-art/concept/{hero,academy,rotina,avatar}.png` (script `scratchpad/crop-concept.py`), reampliados pelo Grok `image_edit` com instrução de manter tudo idêntico e remover só textos sobrepostos (`run-upscale.sh`). Resultado em `site/assets/home/`: `hero-scene.webp` (1280x800, telas do mock do conceito, nao do app real), `student.webp` (card Academy), `rotina-doctor.webp` (card "Na rotina real", sem nome: o "Dr. Rafael Mendes, CRM" do conceito era ficticio), `people/avatar-cta.webp` (CTA final, com a frase do conceito e sem o nome/CRM ficticios "Dra. Juliana Pires"). Todas as pessoas sao geradas por IA e ilustrativas.


- 2026-09-17: Dr. Jassonio photo replaced by the owner-provided image (uploads/d6287bd2-image.png, 1122x1402). Crops: site/assets/home/blocks/ctx-doctor-jassonio{,-card,-card-400}.webp; mobile .local-art/home-mobile/assets/jassonio-{m,m-dim,m-1x1,96}.webp and proto/img/jassonio-144.webp (script scratchpad jassonio-new.py). Dra. Maria Julia Gomes Ferreira Santos photo from uploads/f3bc4c02-image.jpg (owner-provided).
