// Publicação parcial de enamed.auscultoapp.com (Firebase Hosting, site "auscultoapp-enamed") a partir
// DESTE checkout. Clona a config e o mapa de arquivos da versão ativa e troca só os caminhos pedidos.
// Simula por padrão; publica com --apply. Molde: landing-producao/scripts/publicar-site.mjs.
//
// Uso:
//   node scripts/publicar-enamed.mjs --esperada <versão ativa> <caminho> [<caminho> ...]
//   node scripts/publicar-enamed.mjs --esperada <versão ativa> --desde <commit>
//   ... [--apply] [--mensagem "texto"] [--forcar] [--sujo]
//
// Caminhos do checkout -> caminhos publicados:
//   enamed/index.html -> /index.html, enamed/404.html -> /404.html (e robots.txt, sitemap.xml)
//   assets/css/enamed.css, assets/js/enamed.js, assets/enamed/**, assets/fonts/enamed/** -> iguais
//
// Travas:
//   1. Versão esperada: recusa se a versão ativa não for a informada em --esperada (alguém publicou
//      no meio do caminho; confira antes de sobrescrever).
//   2. /meta_tracking.js NUNCA sobe: o do ar é outra versão (23/08) e é a fonte do rastreio.
//   3. Divergência: cada arquivo que já está no ar precisa ter a versão do ar em algum commit da
//      história deste checkout (--forcar ignora, com cuidado).
//   4. Árvore suja: recusa arquivo com alteração não commitada (--sujo ignora).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const SITE = 'auscultoapp-enamed';
const ORIGIN = 'https://enamed.auscultoapp.com';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PAGINAS = new Set(['enamed/index.html', 'enamed/404.html', 'enamed/robots.txt', 'enamed/sitemap.xml']);
const ASSETS = /^assets\/(css\/enamed\.css|js\/enamed\.js|enamed\/.+|fonts\/enamed\/.+)$/;

function publicado(p) {
  if (/(^|\/)meta_tracking\.js$/.test(p)) return null;
  if (PAGINAS.has(p)) return '/' + p.slice('enamed/'.length);
  if (ASSETS.test(p)) return '/' + p;
  return null;
}

const args = process.argv.slice(2);
const flag = f => args.includes(f);
const valor = f => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : undefined; };
const apply = flag('--apply');
const esperada = valor('--esperada');
const git = cmd => execSync(`git -C "${ROOT}" ${cmd}`, { encoding: 'utf8' }).trim();
const head = git('rev-parse --short HEAD');
const branch = git('rev-parse --abbrev-ref HEAD');
if (!esperada) throw Error('informe --esperada <versão ativa> (confira antes com uma simulação)');
const nomes = ['--mensagem', '--desde', '--esperada'];
let paths = args.filter((a, i) => !a.startsWith('--') && !nomes.includes(args[i - 1]));
if (valor('--desde')) paths = git(`diff --name-only --diff-filter=AMR ${valor('--desde')} HEAD`).split('\n').filter(Boolean);
paths = [...new Set(paths.map(p => p.replace(/\\/g, '/').replace(/^\/+/, '')))];
if (paths.some(p => /(^|\/)meta_tracking\.js$/.test(p))) console.log('aviso: meta_tracking.js foi ignorado (nunca sobe)');
const pares = paths.map(p => [p, publicado(p)]).filter(([, pub]) => pub);
if (!pares.length) throw Error('nenhum arquivo do site do ENAMED para publicar');
const mensagem = `${valor('--mensagem') || 'publicação parcial'} (${branch} @ ${head})`;

const token = execSync('gcloud auth print-access-token', { encoding: 'utf8' }).trim();
const auth = { Authorization: 'Bearer ' + token, 'x-goog-user-project': 'auscultoapp' };
const api = 'https://firebasehosting.googleapis.com/v1beta1/';
async function call(method, url, body) {
  const r = await fetch(url, { method, headers: { ...auth, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  const t = await r.text();
  if (!r.ok) throw Error(`${method} ${url} -> ${r.status} ${t}`);
  return t ? JSON.parse(t) : {};
}

console.log(`checkout ${ROOT}\nbranch ${branch} @ ${head}`);
const live = (await call('GET', `${api}sites/${SITE}/channels/live/releases?pageSize=1`)).releases[0];
const liveVersion = live.version;
const liveId = liveVersion.name.split('/').pop();
console.log('versão ativa', liveId, '·', live.message || '');
if (liveId !== esperada) {
  console.log(`\nnada publicado: a versão ativa é ${liveId}, não ${esperada}. Alguém publicou no meio do caminho; confira.`);
  process.exit(1);
}
const files = {};
let pageToken = '';
do {
  const r = await call('GET', `${api}${liveVersion.name}/files?pageSize=1000${pageToken ? '&pageToken=' + pageToken : ''}`);
  for (const f of r.files || []) files[f.path] = f.hash;
  pageToken = r.nextPageToken || '';
} while (pageToken);
console.log('arquivos no ar', Object.keys(files).length);

// ── travas ──
const sujos = new Set(git('status --porcelain').split('\n').filter(Boolean).map(l => l.slice(3).replace(/^"|"$/g, '')));
const blob = buf => crypto.createHash('sha1').update(`blob ${buf.length}\0`).update(buf).digest('hex');
const problemas = [];
for (const [p, pub] of pares) {
  if (!fs.existsSync(path.join(ROOT, p))) { problemas.push(`não existe no checkout: ${p}`); continue; }
  if (sujos.has(p) && !flag('--sujo')) problemas.push(`alteração não commitada: ${p}`);
  if (!files[pub]) continue;
  const r = await fetch(ORIGIN + encodeURI(pub === '/index.html' ? '/' : pub), { redirect: 'manual' });
  if (!r.ok) continue;
  const noAr = Buffer.from(await r.arrayBuffer());
  const candidatos = new Set([blob(noAr), blob(Buffer.from(noAr.toString('latin1').replace(/\r\n/g, '\n'), 'latin1'))]);
  const historia = git(`log --format=%H HEAD -- "${p}"`).split('\n').filter(Boolean);
  const visto = historia.some(c => { try { return candidatos.has(git(`rev-parse ${c}:"${p}"`)); } catch { return false; } });
  if (!visto) problemas.push(`DIVERGÊNCIA: a versão no ar de ${pub} não está na história desta branch (outra sessão publicou por fora?)`);
}
if (problemas.length) {
  console.log('\n' + problemas.join('\n'));
  if (problemas.some(x => !x.startsWith('DIVERGÊNCIA')) || !flag('--forcar')) {
    console.log('\nnada publicado. Resolva acima (merge, commit) ou use --forcar / --sujo conscientemente.');
    process.exit(1);
  }
}

const uploads = {};
let novos = 0, trocados = 0, iguais = 0;
for (const [p, pub] of pares) {
  const buf = zlib.gzipSync(fs.readFileSync(path.join(ROOT, p)), { level: 9 });
  const hash = crypto.createHash('sha256').update(buf).digest('hex');
  const atual = files[pub];
  if (atual === hash) iguais += 1; else if (atual) trocados += 1; else novos += 1;
  if (atual !== hash) console.log(atual ? 'trocar ' : 'novo   ', pub);
  uploads[hash] = buf;
  files[pub] = hash;
}
console.log(`\n${novos} novos, ${trocados} trocados, ${iguais} iguais`);
if (files['/meta_tracking.js']) console.log('/meta_tracking.js fica como está no ar');
if (!apply) { console.log(`\nsimulação: nada publicado. Mensagem seria: "${mensagem}". Use --apply para publicar.`); process.exit(0); }

const version = await call('POST', `${api}sites/${SITE}/versions`, { config: liveVersion.config, labels: { source: 'publicar-enamed', commit: head } });
const entries = Object.entries(files);
const required = new Set();
let uploadUrl;
for (let i = 0; i < entries.length; i += 1000) {
  const r = await call('POST', `${api}${version.name}:populateFiles`, { files: Object.fromEntries(entries.slice(i, i + 1000)) });
  (r.uploadRequiredHashes || []).forEach(h => required.add(h));
  uploadUrl = r.uploadUrl || uploadUrl;
}
for (const hash of required) {
  if (!uploads[hash]) throw Error('o Hosting pediu um arquivo que este script não tem: ' + hash);
  const r = await fetch(`${uploadUrl}/${hash}`, { method: 'POST', headers: { ...auth, 'Content-Type': 'application/octet-stream' }, body: uploads[hash] });
  if (!r.ok) throw Error('upload ' + hash + ' -> ' + r.status + ' ' + await r.text());
}
await call('PATCH', `${api}${version.name}?update_mask=status`, { status: 'FINALIZED' });
await call('POST', `${api}sites/${SITE}/releases?versionName=${version.name}`, { message: mensagem });
console.log(`\npublicado: versão ${version.name.split('/').pop()}\nrollback:  versão ${liveId}`);
console.log(`rollback em um passo: POST ${api}sites/${SITE}/releases?versionName=${liveVersion.name}`);
