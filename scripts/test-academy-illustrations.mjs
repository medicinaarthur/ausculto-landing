import { test } from 'node:test';
import assert from 'node:assert/strict';
import { figures, validateIllustrations, renderIllustrations } from './academy-illustrations.mjs';
import { renderPresentationArticles } from './academy-presentation.mjs';

test('four supplementary figures have exact brand, local hashes and verified placement', () => {
  assert.equal(validateIllustrations().length, 4);
  assert.equal(figures.filter(f => f.summaryId === 'estudos-epidemiologicos').length, 2);
  for (const f of figures) {
    const article = renderPresentationArticles().find(a => a.path.includes(f.summaryId));
    const start = article.html.indexOf(`id="${f.afterSection}"`);
    const end = article.html.indexOf('</section>', start);
    assert.ok(article.html.indexOf(`data-figure="${f.id}"`, start) < end);
    assert.ok(renderIllustrations(f.summaryId, f.afterSection).includes(f.url));
    assert.ok(f.references.length);
  }
});

test('illustrations reject hash drift, foreign paths and invalid section ownership', () => {
  const clone = () => structuredClone(figures);
  let bad = clone(); bad[0].sha256 = '0'.repeat(64);
  assert.throws(() => validateIllustrations(bad), /drift/);
  bad = clone(); bad[0].url = 'https://example.com/figure.svg';
  assert.throws(() => validateIllustrations(bad), /asset/);
  bad = clone(); bad[0].afterSection = 'section-999';
  assert.throws(() => validateIllustrations(bad), /placement/);
});
