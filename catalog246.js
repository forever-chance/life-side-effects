'use strict';
// Concrete v32 operations; the editorial numeric ranges are intentionally not executed.
const base246={valid:catalogValid245,choice:catalogChoice245,resolve:catalogResolve245,month:catalogMonth245,open:openDecision24,finish:finishTask,items:decisionItems24};
const eventIds246=['E0001','E0003','E0009','E0015','E0020','E0052','E0057'];
function data246(id){return catalog245.events.find(e=>e.id===id);}
function study246(){const t=path16().study,p=t&&prog16(t.program);return t?.status==='active'&&!t.blocked&&p&&s.country===p.country&&residenceCity()===p.city&&permission16(p.country,'study')?t:null;}
function employer246(){return s.job&&permission16(s.country,'work')?company18():null;}
function binding246(id){
 if(s.age<18)return null;
 if(id.startsWith('E000')){const t=study246(),a=t&&path16().applications.find(a=>a.id===t.application);if(!t||id==='E0003'&&(!a||a.status!=='enrolled'||a.scholarship||t.grades<60))return null;return {study:t.id,program:t.program,application:t.application};}
 if(['E0015','E0020'].includes(id)){
  const co=employer246(),j=s.job;if(!co)return null;
  if(id==='E0015')return ['remote','hybrid'].includes(j.format)&&j.workplace?.country===s.country&&j.workplace?.city===residenceCity()?{employer:co.id,oldFormat:j.format}:null;
  const a=path16().jobApplications.find(a=>a.status==='offered'&&a.expires>=s.clock.ticks&&a.vacancy.salary>j.salary&&a.vacancy.profession===j.professionId&&!a.vacancy.entry45&&a.vacancy.employer!==co.name&&!jobEligibility16(a.vacancy).why.length);
  return a?{employer:co.id,offer:a.id}:null;
 }
 const p=currentPartner();if(!coupleLocal54(p))return null;
 if(id==='E0052'){const a=householdDeal54();if(!a||a.chores>=.5||s.clock.ticks<(family54().retry[p.id+':chores']||0))return null;return {person:p.id,oldChores:a.chores};}
 return {person:p.id};
}
catalogValid245=function(q){
 if(!eventIds246.includes(q.event))return base246.valid(q);
 if(!catalogAvailable245()||s.age<18||q.country!==s.country||q.city!==residenceCity())return false;
 if(q.study){const t=study246();return !!t&&t.id===q.study&&t.program===q.program&&t.application===q.application;}
 if(q.employer){if(employer246()?.id!==q.employer)return false;if(q.event==='E0015')return s.job.format===q.oldFormat;
  const a=path16().jobApplications.find(a=>a.id===q.offer);return !!a&&(q.status==='waiting'||a.status==='offered'&&a.expires>=s.clock.ticks&&!jobEligibility16(a.vacancy).why.length);}
 return currentPartner()?.id===q.person&&coupleLocal54(living(q.person))&&(q.event!=='E0052'||!!householdDeal54());
};
function why246(q,n){
 if(!catalogActive245(q))return 'Ситуация больше не действует';
 if(q.phase==='review')return q.event==='E0009'&&n===1&&capacity()-totalHours()<2?'Нужно 2 ч/нед. для консультации':'';
 if(q.event==='E0001'&&q.phase==='extended'&&n===3)return 'Срок уже пересмотрен';
 if(['E0001','E0009'].includes(q.event)&&n===1&&capacity()-totalHours()<(q.event==='E0001'?3:2))return 'Не хватает времени для занятий';
 if(q.event==='E0003'&&n===1){if(path16().applications.find(a=>a.id===q.application)?.scholarship)return 'Заявка уже подана';if(expenseAvailable231()<c().cost*.001)return 'Не хватает средств на заявку';}
 if(q.event==='E0020'&&n===2)return careerChance18('conditions21').why.join('; ');
 if(q.event==='E0052'&&n===1){if(householdDeal54()?.chores!==q.oldChores)return 'Распределение уже изменилось';if(s.clock.ticks<(family54().retry[q.person+':chores']||0))return 'Нужно дождаться следующего разговора';}
 return '';
}
function commit246(q,n){q.commits??=[];q.commits.push({phase:q.phase||'initial',choice:q.event+'_C0'+n,tick:s.clock.ticks});q.status='resolved';q.committed=s.clock.ticks;}
function text246(q,n,primary){const o=data246(q.event).choices[n-1].outcomes[primary?0:1];q.outcome=o.id;return o.text;}
function schedule246(q,months,hours,operation){q.status='scheduled';q.due=s.clock.ticks+months;q.hours=hours;q.operation=operation;q.roll=Math.random();}
function follow246(q,title,text){q.phase='review';q.title246=title;q.text246=text;q.status='offered';q.expires=s.clock.ticks+2;s.clock.running=false;log(title,text,'События',false,{kind:'catalog245',id:q.id});}
function review246(q,n){
 if(![1,2].includes(n))return false;
 if(n===1&&q.event==='E0015'){
  const before=s.job.format;s.job.format=q.formatProposal;company18().history.push({tick:s.clock.ticks,type:'format246',before,title:s.job.title,salary:s.job.salary,note:'Формат работы: '+q.formatProposal});q.status='resolved';
  log('Рабочий график согласован','Дорога: '+commuteMinutes()+' мин. Условия оплаты сохранены.','Работа');
 }else if(n===1&&q.event==='E0009')schedule246(q,1,2,'consultation');
 else if(n===1&&q.event==='E0052'){
  const same=householdDeal54().chores===q.agreedChores;if(same){rel(living(q.person),{trust:2,strain:-3});remember(living(q.person),'Через месяц подтвердили распределение домашних дел.');}q.status='resolved';
  log('Распределение дел проверено',same?'Договорённость сохранилась. Вы подтвердили её вместе.':'Распределение уже изменилось; прежние условия не возвращены.','Быт');
 }else q.status='resolved';
 q.commits??=[];q.commits.push({phase:'review',action:n,tick:s.clock.ticks});save();render();return true;
}
catalogChoice245=function(id,choice){
 const q=catalogState245().events.find(q=>q.id===id);if(!q||!eventIds246.includes(q.event))return base246.choice(id,choice);
 const c=data246(q.event).choices.find(c=>c.id===choice),n=c?Number(choice.slice(-2)):0;if(!n||why246(q,n))return false;if(q.phase==='review')return review246(q,n);
 let text='',primary=true;
 if(q.event==='E0003'&&n===1){
  scholarshipApply16(q.application);const a=path16().applications.find(a=>a.id===q.application),t=s.clock.tasks.find(t=>t.kind==='pathScholarship'&&t.application===q.application);if(a.scholarship?.status!=='submitted'||!t)return false;
  commit246(q,n);q.status='waiting';q.nativeTask=t.id;text=text246(q,n,true);
 }else if(q.event==='E0020'){
  const a=path16().jobApplications.find(a=>a.id===q.offer);
  if(n===1){acceptJob16(a.id);if(a.status!=='accepted')return false;commit246(q,n);text='Оффер принят. Текущая работа сохранена; дата выхода и переход оформляются отдельно в разделе заявок.';}
  if(n===2){const co=company18(),before=co.requests.length;requestWork21('conditions','pay');if(co.requests.length===before)return false;commit246(q,n);q.status='waiting';q.request=co.requests.at(-1).id;text=text246(q,n,true);}
  if(n===3){a.status='declined';commit246(q,n);text=text246(q,n,true);}
 }else if(q.event==='E0052'&&n===1){primary=requestHousehold54('chores',.5);commit246(q,n);text=text246(q,n,primary);if(primary){q.agreedChores=.5;schedule246(q,1,0,'choresReview');}}
 else{
  commit246(q,n);primary=chance(c.outcomes[0].p);text=text246(q,n,primary);
  if(q.event==='E0001'){
   if(n===1&&primary)schedule246(q,2,3,'studyProject');
   if(n===3){q.phase='extended';q.status='offered';if(primary)q.expires=s.clock.ticks+2;}
  }
  if(q.event==='E0009'){
   const t=path16().study;t.missedTopics246=(t.missedTopics246||0)+1;
   if(n===1)schedule246(q,1,2,primary?'studyCatchup':'studyConsult');
   else{t.grades=clamp(t.grades-1);text='Тема пока остаётся непройденной. Подготовка к следующей оценке снизилась.';}
  }
  if(q.event==='E0015'){
   if(n===1){q.formatProposal='near';follow246(q,'Новый график работы','Офис в городе проживания. Дорога: '+commuteFor16({...s.job,...s.job.workplace,format:'near'})+' мин.; транспорт '+money(transport16({...s.job,...s.job.workplace,format:'near'}))+'/мес. Зарплата сохраняется. Применить условия?');text='Условия подготовлены для согласования.';}
   if(n===2){schedule246(q,1,0,'workFormat');text='Руководитель рассматривает индивидуальный график. Пока действуют прежние условия.';}
   if(n===3){if(!path16().search)toggleSearch16();text='Поиск другого работодателя включён. Текущая работа и её условия сохраняются.';}
  }
  if(q.event==='E0052'&&n===2){schedule246(q,1,0,'choresTalk');text='Вы договорились вернуться к распределению дел через месяц. Пока действует прежнее соглашение.';}
  if(q.event==='E0052'&&n===3){rel(living(q.person),{strain:primary?1:3});remember(living(q.person),'Разговор о распределении домашних дел остался без ответа.');}
  if(q.event==='E0057'){rel(living(q.person),n===1?{affection:primary?3:1,strain:-1}:{strain:primary?1:2});remember(living(q.person),n===1?'Благодарность за небольшой сюрприз.':'Сдержанная реакция на небольшой сюрприз.');}
 }
 log(data246(q.event).title,text,'События');save();render();return true;
};
catalogResolve245=function(q){
 if(!eventIds246.includes(q.event))return base246.resolve(q);
 if(!['scheduled','waiting'].includes(q.status))return;
 if(!catalogValid245(q)){q.status='cancelled';q.hours=0;const t=s.clock.tasks.find(t=>t.id===q.nativeTask);if(t)cancelTask(t.id);log('Продолжение отменено','Связанный вуз, работа или отношения изменились. Последствия прежнего решения не применены.','События');return;}
 if(q.status==='waiting'){
  if(q.event==='E0003'){const sc=path16().applications.find(a=>a.id===q.application)?.scholarship;if(sc&&sc.status!=='submitted'){q.status='resolved';q.nativeResult=sc.status;}}
  if(q.event==='E0020'){const r=company18().requests.find(r=>r.id===q.request);if(r&&r.status!=='pending'){q.status='resolved';q.nativeResult=r.outcome||r.status;log('Переговоры о зарплате',r.outcome==='offer'?'Работодатель подготовил предложение. Новая зарплата вступит в силу только после принятия условий.':'Ответ работодателя получен. Проверить результат можно в условиях текущей работы.','Работа');}}
  return;
 }
 if(q.due>s.clock.ticks)return;q.status='resolved';q.hours=0;q.finished=s.clock.ticks;
 if(q.operation==='studyProject'){
  const t=path16().study;if(s.clock.fatigue>85||q.roll>.75){log('Исследовательский проект завершён без результата','Не удалось довести материал до готовой работы. Диплом и исследовательские этапы не начислены.','Учёба');return;}
  t.projects246??=[];t.projects246.push({event:q.id,tick:s.clock.ticks,program:q.program});t.grades=clamp(t.grades+1);s.clock.fatigue=clamp(s.clock.fatigue+3);log('Исследовательский проект завершён','Результат сохранён в истории текущей программы. Подготовка улучшилась.','Учёба');
 }else if(q.operation==='studyConsult')follow246(q,'Нужна консультация','Самостоятельно разобраться в теме не удалось. Выделить ещё месяц по 2 ч/нед. на консультацию и подготовку?');
 else if(['studyCatchup','consultation'].includes(q.operation)){const t=path16().study;t.missedTopics246=Math.max(0,(t.missedTopics246||0)-1);t.grades=clamp(t.grades+1);log('Пропущенная тема разобрана','Занятия завершены, подготовка к оценке улучшилась.','Учёба');}
 else if(q.operation==='workFormat'){q.formatProposal=q.roll<.65?'hybrid':'near';follow246(q,'Ответ о рабочем графике',(q.formatProposal==='hybrid'?'Согласован вариант гибридной работы.':'Индивидуальное исключение не согласовано; предложена работа из офиса.')+' Дорога: '+commuteFor16({...s.job,...s.job.workplace,format:q.formatProposal})+' мин. Применить условия?');}
 else if(q.operation==='choresReview')follow246(q,'Как работает распределение дел','Прошёл месяц. Сохранить действующее распределение обязанностей?');
 else if(q.operation==='choresTalk'){q.phase='extended';q.status='offered';q.expires=s.clock.ticks+2;q.oldChores=householdDeal54().chores;q.text246='Вы вернулись к разговору о быте. Предлагается делить домашние дела поровну.';s.clock.running=false;}
};
finishTask=function(t){const q=s.catalog245?.events.find(q=>q.nativeTask===t.id);if(q&&q.status!=='waiting')return;if(q&&!catalogValid245(q)){catalogResolve245(q);return;}const result=base246.finish(t);if(q)catalogResolve245(q);return result;};
catalogMonth245=function(){
 const before=catalogState245().lastMonth;base246.month();if(before===s.clock.ticks||!catalogAvailable245()||s.age<18)return;
 const scale={rare:.55,normal:1,frequent:1.65}[catalogState245().frequency]||1,offset=s.clock.ticks%eventIds246.length;
 for(const id of eventIds246.slice(offset).concat(eventIds246.slice(0,offset))){const b=binding246(id);if(b&&chance(data246(id).p*scale)&&catalogOffer245(id,b))break;}
};
decisionItems24=function(){return base246.items().map(i=>i.ref.kind==='catalog245'&&i.q.title246?{...i,title:i.q.title246}:i);};
openDecision24=function(kind,id){
 const q=kind==='catalog245'&&decisionRecord24({kind,id});if(!q||!eventIds246.includes(q.event))return base246.open(kind,id);if(!catalogActive245(q))return toast('Ситуация больше не действует.');
 const e=data246(q.event),review=q.phase==='review',labels=review?[q.event==='E0009'?'Запланировать консультацию':q.event==='E0052'?'Подтвердить договорённость':'Принять условия','Оставить без изменений']:e.choices.map(c=>c.title);
 const offer=q.offer&&path16().jobApplications.find(a=>a.id===q.offer);
 const offerInfo=offer?'\n'+offer.vacancy.title+' · '+offer.vacancy.employer+' · '+money(offer.vacancy.salary)+'/год':'';
 const context=q.study?uni16(prog16(q.program)).name:q.employer?company18().name:living(q.person)?.name;
 show(q.title246||e.title,context+offerInfo+'\n'+(q.text246||e.text),labels.map((label,i)=>{const n=i+1,why=why246(q,n);return {label:q.event==='E0052'&&n===1&&!review?'Предложить разделить дела поровну':q.event==='E0003'&&n===1&&!review?label+' · '+money(c().cost*.001):label,hint:why||(!review&&q.event==='E0001'&&n===1?'2 месяца · 3 ч/нед.':!review&&q.event==='E0009'&&n===1?'1 месяц · 2 ч/нед.':''),disabled:!!why,fn:()=>catalogChoice245(id,e.choices[i].id)};}));
};
