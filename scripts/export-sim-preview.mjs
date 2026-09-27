// Read published metadata only. No generator/rebuild Functions are invoked.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
const app = resolve(process.argv[2] || '../commit-v1-premium-backport');
const admin = createRequire(app + '/functions/package.json')('firebase-admin');
admin.initializeApp({ projectId: 'auscultoapp' });
const db = admin.firestore();
const ids = ['residency_taxonomy_cache_v1', 'residency_taxonomy_availability_v1', ...['einstein','enamed','enare','fuvest_usp','revalida','sirio_libanes','sus_sp'].map(b=>'residency_taxonomy_availability_v1__'+b)];
const snapshots = await db.getAll(...ids.map(id=>db.collection('app_config').doc(id)));
const documents = Object.fromEntries(snapshots.map(s=>{if(!s.exists)throw Error('Missing published metadata '+s.id); return [s.id,s.data()];}));
const hash = b => createHash('sha256').update(b).digest('hex');
const source = { exportedAt:new Date().toISOString(), documents:Object.fromEntries(Object.entries(documents).map(([id,d])=>[id,{sha256:hash(JSON.stringify(d)),generatedAt:d.generatedAt,updatedAt:d.updatedAt}])), appFiles:Object.fromEntries(['lib/features/simulados/data/canonical_taxonomy.dart','lib/features/simulados/data/simulado_bank_catalog.dart','lib/features/simulados/presentation/pt_br_label_formatter.dart'].map(p=>[p,hash(readFileSync(app+'/'+p))])) };
const out=resolve('.local-art/correction-20260927');mkdirSync(out,{recursive:true});
writeFileSync(out+'/taxonomy-private.json',JSON.stringify({source,documents},null,2)+'\n');
console.log('Read '+snapshots.length+' published metadata documents; private snapshot recorded.');
await admin.app().delete();
