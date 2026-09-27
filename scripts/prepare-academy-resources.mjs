import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const roots={generated:join(root,'art-source/academy-resources-v2'),site:join(root,'site'),atlas:resolve(process.env.AUSCULTO_ATLAS_ROOT||join(root,'../AUSCULTO-atlas-rotas')),app:resolve(process.env.AUSCULTO_APP_ROOT||join(root,'../commit-v1-premium-backport')),downloads:resolve(process.env.AUSCULTO_DOWNLOADS_ROOT||join(root,'../../Downloads')),remote:join(root,'.local-art/resources/remote')};
const flash=JSON.parse(readFileSync(join(root,'scripts/data/academy-resource-flashcards.json'),'utf8')).cards;
const sha=b=>createHash('sha256').update(b).digest('hex');
const cards=[];
function add(id,group,title,description,source,rect=[0,0,1,1],extra={}){cards.push({id,group,title,description,family:'academy',type:'image',accent:'#305780',source,rect,...extra});}
// Order is column-major: three images per column. Bright / dark / paper alternate.
add('quiz-histologia','Quiz de imagens','Histologia','Observe estruturas, reconheça tecidos e compare sua interpretação.',['site','assets/academy/quiz-histologia.webp'],undefined,{accent:'#9a3566'});
add('flash-dermatologia','Flashcards','Dermatologia','Uma pergunta real do acervo. Abra, pense e revele a resposta.',null,undefined,{type:'flash',flashcard:flash[0],accent:'#814361',tone:'rose',badge:'cards'});
add('questao','Questões e simulados','Questões de residência','Treine com questões do acervo e acompanhe a resolução.',['atlas','mobile/academy/praticar-questao-resolucao__light.png'],[.035,.11,.93,.345],{demo:true});
add('quiz-ecg','Quiz de imagens','Leitura de ECG','Observe o traçado e exercite a interpretação dos achados.',['remote','ecg.png'],undefined,{fit:'contain',accent:'#a6484d',badge:'image'});
add('casos-arte','Casos clínicos','Da hipótese à decisão','Explore dados, exames e decisões em cenários clínicos.',['atlas','desktop/pratica/casos__light.png'],[.46,.072,.48,.46],{accent:'#23415e',badge:'stethoscope'});
add('quiz-retina','Quiz de imagens','Retinografia','Treine seu olhar para os detalhes do fundo de olho.',['remote','retina.png'],undefined,{fit:'contain',accent:'#9c5527'});
add('flash-semiologia','Flashcards','Semiologia','Reconheça as manobras e revise o que precisa de reforço.',null,undefined,{type:'flash',flashcard:flash[1],accent:'#286954',tone:'sage'});
add('ausanatomy','AusAnatomy','Anatomia em camadas','Explore o atlas anatômico interativo no Ausculto.',['downloads','app.auscultoapp.com_(iPhone 14 Pro Max) (15).png'],[.10,.15,.80,.277],{family:'ausculto',fit:'cover',accent:'#995958',badge:'books'});
add('trilha-capitulo','Trilha clínica','Primeiro atendimento','Um percurso por capítulos para aprender, reconhecer e decidir.',['downloads','app.auscultoapp.com(Pixel 9).png'],[.33,.083,.63,.205],{accent:'#4d7b72',fit:'cover'});
add('quiz-neuro','Quiz de imagens','Ressonância magnética','Exercite o reconhecimento de estruturas e achados em neuroimagem.',['remote','neuro.jpg'],undefined,{fit:'contain',accent:'#626489'});
add('questao-comentario','Questões e simulados','Entenda o raciocínio','Retome a explicação e os comentários de cada alternativa.',['atlas','mobile/pratica/questao-comentarios__light.png'],[.06,.025,.89,.335],{accent:'#487450',demo:true});
add('caso-exames','Casos clínicos','Exames na prática','Relacione imagens e dados à investigação do caso.',['site','assets/academy/quiz-ultrassom.webp'],undefined,{accent:'#697877',label:'Ultrassom · imagem de apoio'});
add('flash-anatomia','Flashcards','Anatomia','Uma revisão breve para conectar estruturas e funções.',null,undefined,{type:'flash',flashcard:flash[2],accent:'#405783',tone:'navy',badge:'cards'});
add('quiz-rx','Quiz de imagens','Radiografia de tórax','Observe o exame com atenção e compare a sua interpretação.',['site','assets/academy/quiz-torax.webp'],undefined,{accent:'#536a77',fit:'contain'});
add('desempenho','Desempenho','Seu estudo deixa pistas','Acompanhe resultados e identifique o próximo ponto de revisão.',['atlas','mobile/academy/desempenho__dark.png'],[.035,.232,.93,.35],{accent:'#344866',demo:true,badge:'chart-bar'});
add('caso-anamnese','Casos clínicos','Investigue em etapas','Escolha perguntas, reúna os dados e desenvolva o raciocínio.',['atlas','mobile/pratica/caso-anamnese__light.png'],[.038,.057,.925,.36],{accent:'#465f8a',demo:true});
add('simulado-revisao','Questões e simulados','Aprenda com a revisão','Retome acertos, erros e questões da sessão.',['atlas','mobile/academy/praticar-simulado-relatorio__light.png'],[.035,.065,.93,.35],{accent:'#347563',demo:true});
add('ausflow','AusFlow','Sinais vitais em contexto','Acompanhe a evolução das medidas ao longo do plantão.',['atlas','mobile/ausflow/vitais-pressao__light.png'],[.035,.28,.93,.322],{family:'ausculto',accent:'#236798',demo:true,badge:'chart-line-up'});
add('plano-hoje','Plano de estudos','Um próximo passo claro','Organize as atividades de hoje e retome seu estudo.',['atlas','mobile/academy/plano__light.png'],[.035,.092,.93,.35],{accent:'#8b7441',demo:true});

add('trilha-clinica','Trilha clínica','Aprenda por capítulos','O card da Trilha: capítulos, progresso e próximas atividades.',['generated','modulo-ui.png'],undefined,{accent:'#ba8730',badge:'stethoscope',presentation:'game',recreated:true,reference:'Downloads/ChatGPT Image Sep 26, 2026, 03_38_33 PM.png'});
add('trilha-caio','Trilha clínica','Observe o sinal-chave','O Enf. Caio acompanha a leitura dos sinais e as perguntas da trilha.',['generated','caio-ui.png'],undefined,{accent:'#287c65',presentation:'game',recreated:true,reference:'Downloads/app.auscultoapp.com(Pixel 9)2.png'});
add('trilha-helena','Trilha clínica','Revise com a preceptora','Personagens e feedback ajudam a retomar o raciocínio.',['generated','helena-ui.png'],undefined,{accent:'#cb706b',presentation:'game',recreated:true,reference:'assets/characters_hd/preceptora_helena/idle_happy_tablet_hd.webp'});
add('trilha-feedback','Trilha clínica','Vamos entender','Retome o raciocínio e aprenda com cada tentativa.',['generated','feedback-ui.png'],undefined,{accent:'#bd3b32',presentation:'game',recreated:true,reference:'Downloads/app.auscultoapp.com(Pixel 9)22.png'});
add('trilha-resultado','Trilha clínica','Continue praticando','XP, acertos e tempo ao concluir uma atividade.',['generated','resultado-ui.png'],undefined,{accent:'#ca9a33',presentation:'game',recreated:true,demo:true,reference:'Downloads/app.auscultoapp.com(Pixel 9)2222.png'});
// Ordered app compositions: three cards per staggered column.
const composition=JSON.parse(readFileSync(join(root,'scripts/data/academy-resource-compositions.json'),'utf8'));
const order=composition.cards.map(c=>c.id);
for(const card of cards)Object.assign(card,composition.cards.find(c=>c.id===card.id));
const officialQuestions=JSON.parse(readFileSync(join(root,'scripts/data/academy-resource-questions.json'),'utf8')).cards;
for(const card of cards.filter(c=>c.type==='question'&&c.ui.kind==='exam')){
 const question=officialQuestions.find(q=>q.documentId===card.ui.question.documentId);
 if(!question||!question.comment.includes(card.ui.commentExcerpt))throw Error('Question/comment provenance drift: '+card.id);
 card.ui.question=question;
}
Object.assign(cards.find(c=>c.id==='trilha-clinica'),{source:['downloads','ChatGPT Image Sep 26, 2026, 03_38_33 PM.png'],rect:[.054,.074,.895,.344]});
Object.assign(cards.find(c=>c.id==='trilha-caio'),{source:['app','assets/characters_hd/enf_caio/pointing_serious_checklist_hd.webp'],rect:[0,0,1,1]});
cards.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
if(cards.length!==24||new Set(order).size!==24)throw Error('Resource selection must contain 24 unique cards');
const directory=join(root,'site/assets/academy/resources');mkdirSync(directory,{recursive:true});
for(const card of cards){
 if(!card.source)continue;
 const bytes=readFileSync(join(roots[card.source[0]],card.source[1]));const metadata=await sharp(bytes).metadata();
 const [x,y,w,h]=card.rect;const crop={left:Math.round(x*metadata.width),top:Math.round(y*metadata.height),width:Math.round(w*metadata.width),height:Math.round(h*metadata.height)};
 card.provenance={root:card.source[0],file:card.source[1],sha256:sha(bytes),nativeWidth:metadata.width,nativeHeight:metadata.height,crop};
 const variants=[];
 for(const target of [456,912]){
  const width=Math.min(target,crop.width);if(variants.some(v=>v.width===width))continue;
  const name=`${card.id}-${width}.webp`;const output=await sharp(bytes).extract(crop).resize({width,withoutEnlargement:true}).webp({quality:90,effort:5}).toBuffer();
  writeFileSync(join(directory,name),output);const m=await sharp(output).metadata();variants.push({url:'/assets/academy/resources/'+name,width:m.width,height:m.height,sha256:sha(output)});
 }
 card.variants=variants;delete card.source;
}
writeFileSync(join(root,'scripts/data/academy-resources.json'),JSON.stringify({schemaVersion:1,cards},null,2)+'\n');
console.log(`Prepared ${cards.length} cards, ${cards.filter(c=>c.family==='academy').length} Academy; deterministic crops and source hashes recorded.`);
