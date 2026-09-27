// Selected published exam samples only. No remote writes and no visitor fetches.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..');
const admin=createRequire(path.resolve(root,'../commit-v1-premium-backport/functions/package.json'))('firebase-admin');
const adc=process.env.FIREBASE_SERVICE_ACCOUNT_PATH||process.env.GOOGLE_APPLICATION_CREDENTIALS||path.join(require('node:os').homedir(),'.firebase_adc.json');
if(fs.existsSync(adc))process.env.GOOGLE_APPLICATION_CREDENTIALS=adc;
admin.initializeApp({projectId:'auscultoapp'});
(async()=>{try{
 const selected=[['usp_sp_2026_q034','USP-SP'],['enamed_2025_caderno_1_q034','ENAMED'],['einstein_2025_q072','Einstein']],cards=[];
 for(const [id,bank] of selected){
  const doc=await admin.firestore().collection('questions').doc(id).get(),d=doc.data();
  if(!d||d.cancelled||d.excluded_from_residency_views||!d.options?.[d.answer_official]||!d.statement||!d.explanation)throw Error('Invalid official sample '+id);
  const sample={documentId:id,collection:'questions',bank,year:d.exam_year,number:d.question_number||d.number,examFolder:d.exam_folder,statement:d.statement,options:d.options,answer:d.answer_official,comment:d.explanation,sourceLabel:d.source_label||d.display_title};
  cards.push({...sample,sha256:crypto.createHash('sha256').update(JSON.stringify(sample)).digest('hex')});
 }
 fs.writeFileSync(path.join(root,'scripts/data/academy-resource-questions.json'),JSON.stringify({readAt:new Date().toISOString(),cards},null,2)+'\n');
 console.log('Verified three exam questions and official answer keys; no remote writes.');
}finally{await admin.app().delete();}})().catch(e=>{console.error(e.message);process.exitCode=1;});
