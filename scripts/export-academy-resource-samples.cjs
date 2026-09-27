// Read-only remote export. Only the three explicitly selected official cards are published.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {createRequire}=require('node:module');
const root=path.resolve(__dirname,'..');
const app=path.resolve(process.env.AUSCULTO_APP_ROOT||path.join(root,'../commit-v1-premium-backport'));
const admin=createRequire(path.join(app,'functions/package.json'))('firebase-admin');
const ids=['anki_000c4f3da5d5161f','anki_000a693e8f31e765','anki_0009425197ddbb03'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){
 const adc=process.env.FIREBASE_SERVICE_ACCOUNT_PATH||process.env.GOOGLE_APPLICATION_CREDENTIALS||path.join(require('node:os').homedir(),'.firebase_adc.json');
 if(fs.existsSync(adc))process.env.GOOGLE_APPLICATION_CREDENTIALS=adc;
 admin.initializeApp({projectId:'auscultoapp',storageBucket:'auscultoapp.firebasestorage.app'});
 try{
  const db=admin.firestore(),cards=[];
  for(const id of ids){
   const doc=await db.collection('flashcards').doc(id).get(),d=doc.data();
   if(!d||d.source!=='curated_flashcards_import_v1'||d.is_custom!==false||d.owner_id||!d.question||!d.answer)throw Error('Not an official public sample: '+id);
   const card={id,question:d.question,answer:d.answer,specialty:d.specialty,topic:d.topic,source:d.source,isCustom:false};
   cards.push({...card,sha256:sha(JSON.stringify(card))});
  }
  fs.writeFileSync(path.join(root,'scripts/data/academy-resource-flashcards.json'),JSON.stringify({schemaVersion:1,collection:'flashcards',collectedAt:new Date().toISOString(),cards},null,2)+'\n');
  const dir=path.join(root,'.local-art/resources/remote');fs.mkdirSync(dir,{recursive:true});const images=[];
  for(const [id,session] of [['neuro','NEUROIMAGEM_RM_TUMORES_V1'],['retina','OFTALMO_RETINOGRAFIA_DR_V1'],['ecg','ECG_V1']]){
   const snap=await db.collection('quiz_questions').where('session_id','==',session).limit(1).get();
   if(snap.empty)throw Error('Missing quiz session '+session);
   const doc=snap.docs[0],d=doc.data(),storagePath=d.image?.storage_path;
   if(!storagePath?.startsWith('sessions/'+session+'/'))throw Error('Unexpected quiz asset');
   const bytes=(await admin.storage().bucket().file(storagePath).download())[0];
   const file=id+path.extname(storagePath);fs.writeFileSync(path.join(dir,file),bytes);
   images.push({id,documentId:doc.id,session,storagePath,file,sha256:sha(bytes)});
  }
  fs.writeFileSync(path.join(root,'scripts/data/academy-resource-quiz-provenance.json'),JSON.stringify(images,null,2)+'\n');
  console.log('Exported 3 official flashcards and 3 quiz images; no remote writes.');
 }finally{await admin.app().delete();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
