/** Read-only Firestore export for reviewed landing content. Never writes to the app. */
import {createRequire} from 'node:module';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join} from 'node:path';
import {createHash} from 'node:crypto';
const arg=name=>process.argv.includes(name)?process.argv[process.argv.indexOf(name)+1]:undefined;
if(!process.argv.includes('--credentials')) throw Error('Provide --credentials pointing to an external service account.');
const appRoot=resolve(arg('--app-root')||'../commit-v1-premium-backport');
const require=createRequire(import.meta.url);
const admin=require(join(appRoot,'functions/node_modules/firebase-admin'));
const credential=JSON.parse(readFileSync(arg('--credentials'),'utf8'));
if(credential.project_id!=='auscultoapp')throw Error('Unexpected Firebase project');
admin.initializeApp({credential:admin.credential.cert(credential),projectId:'auscultoapp'});
const db=admin.firestore();
const out=resolve('.local-art/academy-dossier/sources');mkdirSync(out,{recursive:true});
const folders=['ENAMED_2025_CADERNO_1','EINSTEIN_2025','USP_SP_2026','SUS_SP_2026','UNIFESP_2026'];
try {
 for(const folder of folders){
  const s=await db.collection('questions').where('exam_folder','==',folder).get();
  const rows=s.docs.map(d=>({documentId:d.id,...d.data()}));
  writeFileSync(join(out,folder+'.json'),JSON.stringify(rows,null,2));
  console.log(folder+': '+rows.length+' records exported locally');
 }
 // Lightweight reconciliation; duplicate numbering is reported, never silently treated as a new question.
 const meta=await db.collection('questions').select('exam_folder','examFolder','number','question_number','cancelled','excluded_from_residency_views','sanitized_meta_question').get();
 const groups=new Map();let excluded=0;
 for(const doc of meta.docs){const d=doc.data();if(d.excluded_from_residency_views||d.sanitized_meta_question){excluded++;continue;}
  const folder=d.exam_folder||d.examFolder;const number=d.question_number??d.number;
  if(!folder)continue;
  const key=folder+'::'+(number??doc.id);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(doc.id);
 }
 const duplicates=[...groups].filter(([,ids])=>ids.length>1);
 const report={checkedAt:new Date().toISOString(),project:'auscultoapp',documents:meta.size,excluded,uniqueExamNumbers:groups.size,duplicateNumberGroups:duplicates.length,duplicates:Object.fromEntries(duplicates)};
 writeFileSync(join(out,'reconciliation.json'),JSON.stringify(report,null,2));
 const manifest=Object.fromEntries(folders.map(f=>[f,createHash('sha256').update(readFileSync(join(out,f+'.json'))).digest('hex')]));
 writeFileSync(join(out,'manifest.json'),JSON.stringify({checkedAt:report.checkedAt,manifest},null,2));
 console.log(JSON.stringify({documents:report.documents,uniqueExamNumbers:report.uniqueExamNumbers,duplicateNumberGroups:report.duplicateNumberGroups}));
} finally {await admin.app().delete();}
