import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {gzipSync} from 'node:zlib';
const html = readFileSync(new URL('../site/index.html', import.meta.url), 'utf8');
test('both responsive hero compositions contain real content and usable destinations', () => {
  assert.equal((html.match(/data-home-hero=/g)||[]).length, 2);
  assert.ok(html.includes('Hoje no plantão.'));
  assert.ok(html.includes('Viu no plantão.'));
  assert.ok(html.includes('Caiu na prova.'));
  assert.ok(html.includes('m_hero_start'));
  assert.ok(html.includes('href="/estudantes/"'));
});
test('old hero preload is removed and image sources isolate hidden composition', () => {
  assert.ok(!html.includes('hero-plate-v4-'));
  assert.ok(!html.includes('notebook-1400.webp'));
  assert.ok(html.includes('data-hero-panel="prova"'));
  assert.ok(html.includes('data-hero-panel="plantao"'));
});
test('publishable assets have provenance and fit image budgets', () => {
  const p=new URL('../site/assets/home/hero-v3/manifest.json',import.meta.url);
  assert.ok(existsSync(p));
  const manifest=JSON.parse(readFileSync(p));
  for(const asset of manifest.assets) {
    assert.ok(asset.sha256 && asset.width && asset.height && asset.bytes);
    assert.ok(asset.width <= asset.sourceWidth, 'no invented resolution');
  }
  const bytes = file => manifest.assets.find(asset=>asset.file===file).bytes;
  assert.ok(bytes('mobile-atmosphere-941.avif')+bytes('mobile-plantao-1170.avif')+bytes('mobile-prova-1170.avif') < 480*1024, 'mobile visible art budget');
  assert.ok(bytes('desktop-scene-1672.avif') < 320*1024, 'desktop grounded art budget');
  assert.ok(!html.includes('data-hero-enlarge')&&!html.includes('hero-screen-dialog'),'no enlargement action or modal');
  assert.ok(!html.includes('ah__demo-note'),'no mobile demonstration caption');
  assert.ok(!html.includes('Da sala de'),'no desktop footer strip copy');
  assert.equal(manifest.assets.find(a=>a.file==='desktop-scene-1672.avif').height,866,'baked footer also removed');
  assert.equal((html.match(/class="ah__screen ah__screen--/g)||[]).length,4,'original screen overlays in both desktop layouts');
  assert.ok(bytes('desktop-scene-1672.avif')+bytes('desktop-screen-plantao-996.webp')+bytes('desktop-screen-prova-952.webp')<550*1024,'desktop Retina composition budget');
  const codeBytes=['css/home-hero.css','js/home-hero.js'].reduce((total,path)=>total+gzipSync(readFileSync(new URL('../site/assets/'+path,import.meta.url))).length,0);
  assert.ok(codeBytes<25*1024,'hero CSS and JS compressed budget');
});
