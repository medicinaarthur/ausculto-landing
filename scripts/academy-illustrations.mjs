import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { escapeHtml as esc } from './academy-articles.mjs';

export const figures = JSON.parse(readFileSync(new URL('./data/academy-illustrations.json', import.meta.url), 'utf8'));
const digest = data => createHash('sha256').update(data).digest('hex');
const placement = {
  'abdome-mecanismos': ['abdome-agudo', 'section-003'],
  'acidobase-disturbios': ['disturbios-eletroliticos-e-acido-base', 'section-016'],
  'epidemiologia-agregados': ['estudos-epidemiologicos', 'section-017'],
  'epidemiologia-desenhos': ['estudos-epidemiologicos', 'section-029'],
};
export function validateIllustrations(entries = figures) {
  if (entries.length !== 4 || new Set(entries.map(f => f.id)).size !== 4) throw Error('Invalid illustration selection');
  const brand = readFileSync(new URL('../site/assets/brand/ausculto-a-navy-240.png', import.meta.url));
  for (const f of entries) {
    if (!placement[f.id] || placement[f.id][0] !== f.summaryId || placement[f.id][1] !== f.afterSection) throw Error('Invalid illustration placement');
    if (!/^\/assets\/academy\/illustrations\/[a-z0-9-]+\.png$/.test(f.url)) throw Error('Invalid illustration asset');
    const bytes = readFileSync(new URL('../site' + f.url, import.meta.url));
    if (digest(bytes) !== f.sha256 || digest(brand) !== f.watermarkSha256) throw Error('Illustration/brand drift');
    if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||f.watermark?.flattened!==true)throw Error('Invalid flattened branded composition');
    if (!f.title || !f.alt || !f.caption || !f.references.length) throw Error('Incomplete illustration metadata');
    for (const ref of f.references) if (!ref.label || !/^(?:https:\/\/|#section-\d{3}$)/.test(ref.url)) throw Error('Invalid illustration reference');
  }
  return entries;
}
export function renderIllustrations(summaryId, afterSection) {
  return figures.filter(f => f.summaryId === summaryId && f.afterSection === afterSection).map(f => `<figure class="reader-figure" data-figure="${f.id}" aria-labelledby="${f.id}-caption"><img src="${f.url}" width="${f.width}" height="${f.height}" alt="${esc(f.alt)}" loading="lazy" decoding="async"><figcaption id="${f.id}-caption"><strong>${esc(f.title)}</strong><span>${esc(f.caption)}</span><small>Ilustração complementar original, criada com IA para esta leitura. Conceitos conferidos nas referências abaixo.</small><span class="reader-figure__sources">Referências conceituais: ${f.references.map(r => `<a href="${esc(r.url)}">${esc(r.label)}</a>`).join(' · ')}.</span></figcaption></figure>`).join('');
}
