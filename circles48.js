'use strict';
const circlesBase48={socialEncounter17,autonomousMonth,startTask05,finishTask,cancelTask,activitiesView,actionCatalog24,personSections42,decisionRecord24,decisionActive24,decisionItems24,openDecision24};
const projectTopics48={literature:['Совместный разбор рассказов','Редактура сборника'],publishing:['Подготовка книжного выпуска','Сверка макета издания'],translation:['Сверка литературного перевода','Обсуждение переводческих решений'],journalism:['Подготовка серии интервью','Проверка фактов репортажа'],finearts:['Иллюстрации для небольшого сборника','Разработка серии плакатов'],cinema:['Монтаж короткого эпизода','Разбор сценарной сцены'],theatre:['Репетиция камерной сцены','Подготовка сценического этюда'],music:['Подготовка концертной программы','Совместный разбор записи']};
const circleKinds48={meeting:'Разговор после дел',project:'Совместный проект',mentor:'Наставничество',conflict:'Разногласие'};
const circleStatuses48={offered:'Нужно ответить',active:'Запланировано',completed:'Завершено',declined:'Отказ',expired:'Приглашение истекло',cancelled:'Отменено',interrupted:'Место работы или учёбы изменилось'};
function circles48(){return s.social48??={version:1,last:-1,created:0,scopes:{},invitations:[],history:[]};}
function circleScopes48(){
 const out=[],co=company18(),st=path16().study,p=st&&prog16(st.program);
 if(co){const j=s.job;out.push({key:'work:'+co.id,kind:'work',title:co.name,country:j.workplace?.country||s.country,city:j.workplace?.city,international:j.format==='remote'&&j.workplace?.country!==undefined&&j.workplace.country!==s.country,field:profession16(j.professionId)?.field||co.field,track:roleProfiles46[j.professionId]?.tracks[0]||null,ref:co.id,active:!s.dead&&permission16(s.country,'work')&&(j.format==='remote'||s.country===(j.workplace?.country||s.country))});}
 if(p)out.push({key:'study:'+st.id,kind:'study',title:uni16(p).name+' · '+programName26(p),country:p.country,city:uni16(p).city,field:p.field,track:p.track45||null,ref:st.id,active:!s.dead&&st.status==='active'&&!st.blocked&&s.country===p.country&&permission16(p.country,'study')});
 else if(s.age>=6&&s.age<18){familySchoolState();out.push({key:'school:'+s.country+':'+residenceCity()+':'+s.school.type,kind:'school',title:schools[s.school.type].name+' · '+residenceCity(),country:s.country,field:null,track:null,ref:'school',active:!s.dead});}
 else if(s.studyTrack){const t=s.studyTrack;t.circleId48??=id16('course-circle');out.push({key:'course:'+t.circleId48,kind:'course',title:careerBy(t.id)?.title||'Учебная группа',country:s.country,field:null,track:null,ref:t.circleId48,active:!s.dead&&!t.paused&&!t.userPaused});}
 return out;
}
function circleScope48(key){return circleScopes48().find(sc=>sc.key===key);}
function circleRecord48(sc){const x=circles48();return x.scopes[sc.key]??={key:sc.key,kind:sc.kind,title:sc.title,country:sc.country,roster:[],meetings:0,lastMeeting:-1,lastNew:-100,lastInvite:s.clock.ticks,sequence:0};}
function circleHistory48(text,p=null){const x=circles48();x.history.push({tick:s.clock.ticks,text,person:p?.id||null});x.history=x.history.slice(-80);if(p)remember(p,text);}
function circleMember48(sc,mentor=false){
 const x=circles48(),rec=circleRecord48(sc),members=rec.roster.map(id=>living(id)).filter(Boolean);
 if(mentor){const old=members.find(p=>p.contexts48?.[sc.key]==='mentor');if(old)return old;}
 if(x.created>=24||members.length>=4)return mentor?members.find(p=>p.age>=s.age+5)||null:members[rec.meetings%Math.max(1,members.length)]||null;
 const age=mentor?Math.max(30,s.age+rnd(6,16)):sc.kind==='school'?Math.max(6,s.age+rnd(-1,1)):Math.max(18,s.age+rnd(-4,8));
 const city=sc.city||(sc.country===s.country?residenceCity():countries[sc.country]?.city);
 const context=sc.kind==='work'&&sc.international?'internationalWork':sc.kind;
 const p=socialPerson115('Знакомый',age,sc.country,city,context);s.people.push(p);enrichPerson(p);p.bond=35;p.inner.affection=35;p.inner.trust=40;p.lastBond=35;
 p.contexts48={[sc.key]:mentor?'mentor':sc.kind==='work'?'colleague':'classmate'};
 p.occupation=mentor?(sc.kind==='work'?'Опытный специалист · '+sc.title:'Преподаватель · '+sc.title):sc.kind==='work'?'Коллега · '+sc.title:'Учится вместе с вами';
 p.careerVariety=true;rec.roster.push(p.id);rec.lastNew=s.clock.ticks;x.created++;
 circleHistory48('Познакомились: '+sc.title,p);return p;
}
function circleTouch48(p,title){socialTouch17(p,title);p.lastBond=p.bond;rel(p,{});}
function circleEncounter48(sc){
 if(!sc?.active||s.dead)return null;const rec=circleRecord48(sc);if(rec.lastMeeting===s.clock.ticks)return null;
 rec.lastMeeting=s.clock.ticks;let members=rec.roster.map(id=>living(id)).filter(Boolean),p;
 if(!members.length||members.length<3&&s.clock.ticks-rec.lastNew>=6)p=circleMember48(sc);
 p??=members[rec.meetings%Math.max(1,members.length)];if(!p)return null;
 rec.meetings++;circleTouch48(p,sc.title);circleHistory48('Пересеклись по делам: '+sc.title,p);
 log('Знакомое лицо · '+p.name,sc.title+'. '+socialStage17(p)+'.','Общение');return p;
}
socialEncounter17=function(source='Местные мероприятия',manual=true,city=null){
 if(source!=='Работа'&&source!=='Учеба')return circlesBase48.socialEncounter17(source,manual,city);
 const wanted=source==='Работа'?'work':'study',sc=circleScopes48().find(sc=>sc.active&&(wanted==='work'?sc.kind==='work':sc.kind!=='work'));
 return sc?circleEncounter48(sc):null;
};
function circleInvite48(sc,kind=null){
 if(!sc?.active||s.dead)return null;const x=circles48(),r=circleRecord48(sc);
 if(x.invitations.some(q=>q.scope===sc.key&&['offered','active'].includes(q.status))||s.clock.ticks-r.lastInvite<6)return null;
 kind??=['meeting','project','mentor','conflict'][r.sequence%4];if(!circleKinds48[kind]||kind==='mentor'&&s.age<16)kind='project';
 let members=r.roster.map(id=>living(id)).filter(Boolean),p=kind==='mentor'?circleMember48(sc,true):members[r.sequence%Math.max(1,members.length)];
 if(kind==='mentor'&&!p){kind='project';p=members[r.sequence%Math.max(1,members.length)];}
 p??=circleEncounter48(sc);if(!p)return null;
 const project=sc.kind==='work'?(projectTopics48[sc.track]||projectOptions32())[r.sequence%(projectTopics48[sc.track]||projectOptions32()).length]:sc.kind==='school'?'Совместный школьный проект':sc.track?('Семинар · '+trackNames46[sc.track]):'Совместный учебный разбор';
 const text=kind==='meeting'?'После общих дел '+p.name+' предлагает ещё немного поговорить. Без повестки и обязательного нетворкинга.':kind==='project'?p.name+' предлагает разделить работу: «'+project+'». Нужно договориться о вкладе и довести свою часть до конца.':kind==='mentor'?p.name+' предлагает несколько встреч с разбором вашей работы. Это помощь с подготовкой, а не обещание оценки или повышения.':p.name+' считает, что вклад в общее дело распределён неравномерно. Можно обсудить конкретные задачи, ответить резко или оставить разговор на потом.';
 const q={id:id16('circle-event'),scope:sc.key,kind,person:p.id,scopeTitle:sc.title,title:circleKinds48[kind]+' · '+p.name,project,text,status:'offered',created:s.clock.ticks,expires:s.clock.ticks+3,roll:Math.random(),success:bounded(.45+(p.inner.trust||40)*.004,.45,.9)};
 x.invitations.push(q);r.sequence++;r.lastInvite=s.clock.ticks;
 log(q.title,text,'Общение',false,{kind:'circle48',id:q.id});return q;
}
function circleAvailable48(q){const sc=circleScope48(q.scope);return !!(q.status==='offered'&&q.expires>s.clock.ticks&&sc?.active&&living(q.person)&&!s.dead);}
function circleRespond48(id,choice){
 const q=circles48().invitations.find(q=>q.id===id);if(!q||!circleAvailable48(q))return false;const p=living(q.person);
 if(choice==='decline'||choice==='sharp'){
  q.status='declined';q.response=choice;
  if(q.kind==='conflict'){rel(p,choice==='sharp'?{strain:8,affection:-5,trust:-5}:{strain:3});circleHistory48(choice==='sharp'?'Разговор о совместной работе закончился ссорой':'Разногласие осталось неразобранным',p);}
  else circleHistory48('Не стали участвовать: '+circleKinds48[q.kind],p);
 }else if(choice==='accept'){
  if(s.clock.tasks.some(t=>t.kind==='circleTask48'&&!['completed','cancelled'].includes(t.state)&&t.scope48===q.scope))return false;
  q.status='active';q.task=task16('circleTask48',q.kind==='conflict'?'Обсудить распределение задач':q.title,q.kind==='project'||q.kind==='mentor'?3:1,{event48:q.id,scope48:q.scope},q.kind==='project'||q.kind==='mentor'?2:1).id;
 }else return false;
 save();return true;
}
function circleTaskValid48(t){const q=circles48().invitations.find(q=>q.id===t.event48),sc=q&&circleScope48(q.scope);return {q,sc,person:q&&living(q.person),valid:!!(q?.status==='active'&&sc?.active&&living(q.person)&&!s.dead)};}
startTask05=function(t){if(t.kind==='circleTask48'){if(['completed','cancelled','paused'].includes(t.state))return false;const check=circleTaskValid48(t);t.blocked48=check.valid?'':'Совместное занятие недоступно: проверьте место работы/учёбы, паузу или участника.';if(!check.valid)return false;}return circlesBase48.startTask05(t);};
finishTask=function(t){
 if(t.kind!=='circleTask48')return circlesBase48.finishTask(t);
 if(['completed','cancelled','paused'].includes(t.state)||t.progress<t.duration||!startTask05(t))return;
 const {q,sc,person:p}=circleTaskValid48(t);if(!q||q.status!=='active')return;
 q.status='completed';q.completed=s.clock.ticks;q.successful=q.kind==='meeting'||q.roll<q.success;
 if(q.successful){circleTouch48(p,sc.title);rel(p,{trust:q.kind==='conflict'?6:4,strain:q.kind==='conflict'?-10:-2});
  if(q.kind==='project'||q.kind==='mentor'){
   if(sc.track)specialtyState46().skills[sc.track]=Math.min(100,Math.max(specialtyState46().skills[sc.track]||0,profileScore46(sc.track))+2);
   else if(sc.field)path16().experience.skills[sc.field]=Math.min(100,(path16().experience.skills[sc.field]||s.skill)+2);
   if(sc.kind==='work'){const co=company18();co.performance=clamp(co.performance+2);co.history.push({type:'collaboration48',tick:s.clock.ticks,person:p.id,title:q.project});}
   else if(sc.kind==='study')path16().study.grades=clamp(path16().study.grades+2);
   else if(sc.kind==='school')s.school.grades=clamp(s.school.grades+2);
   else if(sc.kind==='course')s.studyTrack.grades=clamp((s.studyTrack.grades||60)+2);
  }
 }
 const result=q.successful?q.kind==='conflict'?'Удалось договориться о распределении задач.':q.kind==='meeting'?'Разговор продолжился за пределами обязательных дел.':'Совместная работа завершена. Подготовка и доверие немного выросли.':q.kind==='conflict'?'Разговор состоялся, но согласия пока нет. Новых штрафов за попытку нет.':'Работу разобрали, но результат потребовал доработки. Бонус к подготовке пока не получен.';
 q.result=result;circleHistory48(circleKinds48[q.kind]+': '+result,p);log(q.title,result,'Общение');archiveTask05(t,'completed');save();
};
cancelTask=function(id){const t=s.clock.tasks.find(t=>t.id===id);if(t?.kind==='circleTask48'){const q=circles48().invitations.find(q=>q.id===t.event48);if(q?.status==='active'){q.status='cancelled';circleHistory48('Совместное занятие отменено',living(q.person));}}return circlesBase48.cancelTask(id);};
function circlesMonth48(){
 const x=circles48();if(x.last>=s.clock.ticks)return;x.last=s.clock.ticks;const scopes=circleScopes48();scopes.forEach(circleRecord48);
 for(const q of x.invitations){
  if(!['offered','active'].includes(q.status))continue;
  if(!scopes.some(sc=>sc.key===q.scope)||!living(q.person)||s.dead){q.status='interrupted';const t=s.clock.tasks.find(t=>t.id===q.task);if(t){s.clock.tasks=s.clock.tasks.filter(t=>t.id!==q.task);archiveTask05(t,'cancelled');}continue;}
  if(q.status==='offered'&&q.expires<=s.clock.ticks)q.status='expired';
 }
 if(s.dead)return;
 if(s.clock.ticks%2===0)for(const sc of scopes.filter(sc=>sc.active))circleEncounter48(sc);
 for(const sc of scopes.filter(sc=>sc.active))circleInvite48(sc);
}
autonomousMonth=function(){circlesBase48.autonomousMonth();circlesMonth48();};
function circlePerson48(id,title,open){personDetail(id);modalParent38={title,open};modalBar38();}
function circleEventMenu48(id){
 const q=circles48().invitations.find(q=>q.id===id);if(!q)return;const p=s.people.find(p=>p.id===q.person),t=s.clock.tasks.find(t=>t.id===q.task);
 nextDetail20={sections:[section20('Общее дело',[fact20('Контекст',q.scopeTitle),fact20('Участник',p?.name||'Нет сведений'),fact20('Ситуация',q.text),fact20('Состояние',circleStatuses48[q.status]),fact20('Время',q.kind==='project'||q.kind==='mentor'?'3 месяца · 2 ч/нед.':'1 месяц · 1 ч/нед.'),fact20('Ответ',q.status==='offered'?'Ещё '+Math.max(0,q.expires-s.clock.ticks)+' мес.':'Ответ записан'),...(t?[fact20('Прогресс',t.progress.toFixed(1)+' / '+t.duration),fact20('Доступность',t.blocked48||'В расписании')]:[]),...(q.result?[fact20('Результат',q.result)]:[])])]};
 show(q.title,'',q.status==='offered'?[
  {label:q.kind==='conflict'?'Обсудить конкретные задачи':'Согласиться и запланировать',disabled:!circleAvailable48(q),fn:()=>circleRespond48(id,'accept')},
  ...(q.kind==='conflict'?[{label:'Ответить резко',disabled:!circleAvailable48(q),fn:()=>circleRespond48(id,'sharp')}]:[]),
  {label:q.kind==='conflict'?'Оставить пока без обсуждения':'Отказаться',disabled:!circleAvailable48(q),fn:()=>circleRespond48(id,'decline')},
  ...(p?[{label:'Карточка человека',fn:()=>circlePerson48(p.id,q.title,()=>circleEventMenu48(q.id))}]:[])
 ]:[...(p?[{label:'Карточка человека',fn:()=>circlePerson48(p.id,q.title,()=>circleEventMenu48(q.id))}]:[]),...(t?[{label:'Отменить совместное занятие',fn:()=>cancelTask(t.id)}]:[])]);
}
function circleRosterMenu48(key){const sc=circleScope48(key)||circles48().scopes[key];if(!sc)return;const r=circleRecord48(sc),people=r.roster.map(id=>s.people.find(p=>p.id===id)).filter(Boolean);show(sc.title,'Знакомства возникают в ходе времени. После смены места общая история и сами люди сохранятся.',people.length?people.map(p=>({label:p.name,hint:(p.contexts48?.[sc.key]==='mentor'?'Наставник':sc.kind==='work'?'Коллега':'Учебная группа')+' · '+socialStage17(p),fn:()=>circlePerson48(p.id,sc.title,()=>circleRosterMenu48(sc.key))})):[{label:'Пока только знакомитесь с окружением',disabled:true}]);}
function circlesMenu48(){
 const x=circles48(),scopes=circleScopes48();scopes.forEach(circleRecord48);
 show('Люди на работе и учёбе','Коллеги и одногруппники остаются теми же людьми при повторных встречах. Приглашения появляются не чаще раза в полгода для каждого круга; совместные занятия занимают время в расписании.',[
  ...scopes.map(sc=>({label:sc.title,hint:sc.active?'Текущий круг':'Пауза или нет доступа',fn:()=>circleRosterMenu48(sc.key)})),
  ...x.invitations.slice(-20).reverse().map(q=>({label:q.title,hint:circleStatuses48[q.status],fn:()=>circleEventMenu48(q.id)})),
  {label:'История общих дел',fn:()=>{nextDetail20={sections:[section20('Записанные встречи и события',x.history.slice(-30).reverse().map(h=>fact20('Месяц '+h.tick,h.text)))]};show('История рабочих и учебных знакомств','');}}
 ]);
}
personSections42=function(p){const sections=circlesBase48.personSections42(p),links=Object.entries(p.contexts48||{});if(links.length)sections.push(section20('Где пересекались',links.map(([key,role])=>{const r=circles48().scopes[key];return fact20(role==='mentor'?'Наставничество':role==='colleague'?'Работа':'Учебная группа',r?.title||'Прежнее место');})));return sections;};
activitiesView=function(){const html=circlesBase48.activitiesView();return html+(s.age>=6?'<section class="activity-box"><h3>Люди на работе и учёбе</h3><button onclick="circlesMenu48()">Знакомые и общие дела</button></section>':'');};
actionCatalog24=function(){return [...circlesBase48.actionCatalog24(),{id:'circles48',group:'Люди',label:'Люди на работе и учёбе',keywords:'коллеги одногруппники наставник конфликт совместный проект школа',reason:s.age<6?'Со школьного возраста':'',fn:circlesMenu48}];};
decisionRecord24=function(ref){return ref?.kind==='circle48'?circles48().invitations.find(q=>q.id===ref.id):circlesBase48.decisionRecord24(ref);};
decisionActive24=function(ref){return ref?.kind==='circle48'?!!(s&&decisionRecord24(ref)&&circleAvailable48(decisionRecord24(ref))):circlesBase48.decisionActive24(ref);};
decisionItems24=function(){return [...circlesBase48.decisionItems24(),...circles48().invitations.filter(circleAvailable48).map(q=>({ref:{kind:'circle48',id:q.id},q,title:q.title,note:q.scopeTitle,expires:q.expires}))].sort((a,b)=>(a.expires??Infinity)-(b.expires??Infinity));};
openDecision24=function(kind,id){if(kind!=='circle48')return circlesBase48.openDecision24(kind,id);if(!decisionActive24({kind,id}))return toast('Приглашение уже закрыто или недоступно.');return circleEventMenu48(id);};
if(s){circles48();render();}
