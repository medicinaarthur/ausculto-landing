import {readFileSync} from 'node:fs';

// Read the app's exact bank grouping rules, rather than maintaining a second taxonomy.
export function appBankKey(name, formatterSource) {
  const normalized=String(name||'').trim().toUpperCase().replace(/\s+/g,' ');
  const block=formatterSource.match(/const knownPrefixes = <String, String>\{([\s\S]*?)\};/);
  if(!block)throw Error('Canonical bank formatter changed');
  for(const [,prefix,key] of block[1].matchAll(/'([^']+)': '([^']+)'/g))if(normalized.startsWith(prefix))return key;
  return normalized.replace(/\b20\d{2}(?:\s*\/\s*\d{2})?\b/g,'').replace(/\s*[-–—]\s*$/,'').replace(/\s+/g,' ').trim();
}
export function hasComment(data) {
  if(typeof data.explanation==='string'&&data.explanation.trim())return true;
  const comments=data.option_comments;
  return !!comments&&typeof comments==='object'&&Object.values(comments).some(v=>typeof v==='string'&&v.trim());
}
export function countBanks(rows,{formatterSource,exclude}) {
  const exams=new Map();let excluded=0,duplicates=0,missingNumber=0;
  for(const {id,data} of rows){
    const folder=String(data.exam_folder||data.examFolder||'').trim();
    if(!folder||exclude(data)){excluded++;continue;}
    const bankKey=appBankKey(data.exam_name||data.source_label||folder.replaceAll('_',' '),formatterSource);
    if(!bankKey)throw Error('Missing bank identity: '+folder);
    if(!exams.has(folder))exams.set(folder,{bankKey,questions:new Map()});
    const exam=exams.get(folder);
    if(exam.bankKey!==bankKey)throw Error('Bank drift inside exam '+folder);
    const rawNumber=data.question_number??data.number;
    const number=rawNumber==null||String(rawNumber).trim()===''?null:String(rawNumber).trim().replace(/^0+(?=\d)/,'');
    if(number===null)missingNumber++;
    const key=number??'document:'+id;
    if(exam.questions.has(key))duplicates++;
    exam.questions.set(key,(exam.questions.get(key)||false)||hasComment(data));
  }
  const banks=new Map();
  for(const [folder,exam]of exams){
    if(!banks.has(exam.bankKey))banks.set(exam.bankKey,{bankKey:exam.bankKey,examCount:0,questionCount:0,commentedQuestionCount:0,examFolders:[]});
    const bank=banks.get(exam.bankKey);bank.examCount++;bank.questionCount+=exam.questions.size;bank.commentedQuestionCount+=[...exam.questions.values()].filter(Boolean).length;bank.examFolders.push(folder);
  }
  return {banks:[...banks.values()].sort((a,b)=>a.bankKey.localeCompare(b.bankKey)),documents:rows.length,excluded,duplicates,missingNumber};
}
export const readFormatter=appRoot=>readFileSync(appRoot+'/lib/features/residency_questions/domain/exam_name_formatter.dart','utf8');
