'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {createRequire} = require('node:module');
const PUBLIC_IDS = ['abdome-agudo','disturbios-eletroliticos-e-acido-base','estudos-epidemiologicos'];
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
const fields = ['summaryId','version','title','description','largeArea','specialty','themeId','author','reviewer','reviewedAt','readingMinutes','sectionCount','releaseId','published'];
const publicMetadata = raw => Object.fromEntries(fields.filter(k => raw[k] !== undefined).map(k => [k,raw[k]]));
async function collectPublished(source) {
  const first = await source.config();
  if (!first?.enabled || !first.corpusReleaseId) throw Error('Published Academy disabled');
  const releaseId = first.corpusReleaseId;
  const catalogue = (await source.catalog(releaseId)).map(publicMetadata).sort((a,b)=>a.title.localeCompare(b.title,'pt-BR'));
  if (new Set(catalogue.map(x=>x.summaryId)).size !== catalogue.length || catalogue.some(x=>x.published!==true || x.releaseId!==releaseId)) throw Error('Inconsistent catalogue');
  const summaries = [];
  for (const id of PUBLIC_IDS) {
    const meta = catalogue.find(x=>x.summaryId===id);
    if (!meta) { if (catalogue.length===0) continue; throw Error('Missing public theme '+id); }
    const raw = await source.release(id,meta.version);
    if (raw.version!==meta.version || raw.releaseId!==releaseId || raw.summaryId!==id || !raw.published || !raw.publicationAllowed || !raw.clinicalReviewed || !raw.rightsCleared || raw.blocks?.length!==meta.sectionCount) throw Error('Unapproved or divergent release '+id);
    summaries.push({...meta,blocks:raw.blocks,assets:raw.assets||[],sourceBlocksSha256:hash(JSON.stringify(raw.blocks))});
  }
  const last = await source.config();
  if (!last?.enabled || last.corpusReleaseId!==releaseId) throw Error('Active release changed during collection');
  return {schemaVersion:1,kind:'published-source',releaseId,collectedAt:new Date().toISOString(),catalogue,catalogueSha256:hash(JSON.stringify(catalogue)),summaries};
}
async function main() {
  const root = path.resolve(__dirname,'..');
  const app = path.resolve(process.argv[2]||path.join(root,'../commit-v1-premium-backport'));
  const output = path.join(root,'.local-art/academy-source');
  const admin = createRequire(path.join(app,'functions/package.json'))('firebase-admin');
  admin.initializeApp({projectId:'auscultoapp',storageBucket:'auscultoapp.firebasestorage.app'});
  const db = admin.firestore();
  const snapshot = await collectPublished({
    config: async () => (await db.doc('app_config/academy_summaries_v1').get()).data(),
    catalog: async id => (await db.collection('academy_summary_catalog').where('published','==',true).where('releaseId','==',id).get()).docs.map(d=>({...d.data(),summaryId:d.id})),
    release: async (id,v) => (await db.doc(`academy_summary_releases/${id}/versions/${v}`).get()).data(),
  });
  if (!snapshot.catalogue.length || snapshot.summaries.length!==PUBLIC_IDS.length) throw Error('Empty publication');
  fs.mkdirSync(path.join(output,'assets'),{recursive:true});
  const candidateRoot = path.join(app,'.local-demo/academy-release/reviewed-exports-171');
  const candidates = fs.existsSync(path.join(candidateRoot,'candidate.json')) ? JSON.parse(fs.readFileSync(path.join(candidateRoot,'candidate.json'),'utf8')).summaries : [];
  const corroboration = [];
  for (const s of snapshot.summaries) {
    const candidate = candidates.find(x=>x.summaryId===s.summaryId&&x.version===s.version);
    corroboration.push({summaryId:s.summaryId,version:s.version,localBlocksMatch:!!candidate&&hash(JSON.stringify(candidate.blocks))===s.sourceBlocksSha256});
    for (const asset of s.assets) {
      const match = /^academy_summary_assets\/([a-z0-9-]+)\/([A-Za-z0-9._-]+)\/([a-f0-9]{64})\.(png|jpg|jpeg|webp)$/.exec(asset.storagePath);
      if (!match || match[1]!==s.summaryId || match[2]!==s.version || match[3]!==asset.sha256 || asset.id!==asset.sha256) throw Error('Unsafe asset binding');
      const local = path.join(candidateRoot,'assets',s.summaryId,s.version,path.basename(asset.storagePath));
      let bytes = fs.existsSync(local) ? fs.readFileSync(local) : (await admin.storage().bucket().file(asset.storagePath).download())[0];
      if (hash(bytes)!==asset.sha256) throw Error('Asset hash mismatch');
      fs.writeFileSync(path.join(output,'assets',path.basename(asset.storagePath)),bytes);
    }
  }
  // Files are outside public site; only the authorized bodies have been read.
  fs.writeFileSync(path.join(output,'snapshot.json'),JSON.stringify(snapshot,null,2)+'\n');
  fs.writeFileSync(path.join(output,'corroboration.json'),JSON.stringify(corroboration,null,2)+'\n');
  console.log(JSON.stringify({releaseId:snapshot.releaseId,entries:snapshot.catalogue.length,ecg:snapshot.catalogue.filter(x=>/^ecg-\d{2}-/.test(x.summaryId)).length,articles:snapshot.summaries.length,localCorroboration:corroboration}));
}
module.exports = {collectPublished,publicMetadata,PUBLIC_IDS};
if (require.main===module) main().catch(e=>{console.error(e.message);process.exitCode=1;});
