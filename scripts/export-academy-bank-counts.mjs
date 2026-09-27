/** Remote read only. Writes aggregate counts locally; never exports question text or credentials. */
import {createRequire}from 'node:module';
import {readFileSync,writeFileSync}from 'node:fs';
import {resolve}from 'node:path';
import {homedir}from 'node:os';
import {createHash}from 'node:crypto';
import {countBanks,readFormatter}from './academy-bank-counts.mjs';
const appRoot=resolve('../commit-v1-premium-backport'),require=createRequire(import.meta.url);
const admin=require(appRoot+'/functions/node_modules/firebase-admin');
process.env.GOOGLE_APPLICATION_CREDENTIALS=process.env.GOOGLE_APPLICATION_CREDENTIALS||resolve(homedir(),'.firebase_adc.json');
admin.initializeApp({credential:admin.credential.applicationDefault(),projectId:'auscultoapp'});
const {residencyCatalogInternals:canonical}=require(appRoot+'/functions/residencyCatalog.js');
try{
 const snapshot=await admin.firestore().collection('questions').select(...new Set([...canonical.PROJECTED_FIELDS,'question_number','number','explanation','option_comments'])).get();
 const result=countBanks(snapshot.docs.map(d=>({id:d.id,data:d.data()})),{formatterSource:readFormatter(appRoot),exclude:canonical.shouldExcludeFromResidencyViews});
 const directory=JSON.parse(readFileSync('scripts/data/academy-bank-directory.json','utf8'));
 const banks=result.banks.map(bank=>{const mark=directory.find(d=>d.name.replaceAll('-',' ')===bank.bankKey);if(!mark)throw Error('No approved bank logo: '+bank.bankKey);return {...mark,...bank};});
 const report={schemaVersion:1,verifiedAt:new Date().toISOString(),source:'Firestore auscultoapp/questions (read-only projection)',exclusionContract:'functions/residencyCatalog.js',groupingContract:'ExamNameFormatter.bankGroupKey',commentContract:'Nonempty explanation or option_comments string; unique exam_folder/question_number',formatterSha256:createHash('sha256').update(readFormatter(appRoot)).digest('hex'),documents:result.documents,excluded:result.excluded,duplicates:result.duplicates,missingNumber:result.missingNumber,banks};
 if(result.missingNumber)throw Error('Question numbering incomplete; publication blocked');
 writeFileSync('scripts/data/academy-bank-counts.json',JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({banks:banks.length,documents:result.documents,duplicates:result.duplicates,commented:banks.reduce((n,b)=>n+b.commentedQuestionCount,0)}));
}finally{await admin.app().delete();}
