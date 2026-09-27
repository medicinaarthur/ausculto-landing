import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { collectPublished, publicMetadata } = require('./snapshot-academy-published.cjs');
test('snapshot rejects a pointer changed during collection', async () => {
  let calls = 0;
  await assert.rejects(collectPublished({
    config: async () => ({ enabled:true, corpusReleaseId: ++calls === 1 ? 'release-a' : 'release-b' }),
    catalog: async () => [], release:async () => {},
  }), /changed/);
});
test('public metadata omits administrative fields and preserves canonical identity', () => {
  const clean = publicMetadata({summaryId:'theme',themeId:'canonical',version:'v1',title:'Title',largeArea:'ortopedia',specialty:'ortopedia',published:true,releaseId:'r',pdfStoragePath:'private',blocks:[{text:'private'}]});
  assert.equal(clean.themeId,'canonical'); assert.equal(clean.largeArea,'ortopedia');
  assert.equal(clean.pdfStoragePath,undefined); assert.equal(clean.blocks,undefined);
});
