'use strict';
const creativeBase47={startTask05,finishTask,cancelTask,autonomousMonth,activitiesView,actionCatalog24,jobEligibility16,jobDetailData20};
const formats47={
 literature:['Рассказ для портфолио','Рассказ для сборника','Серия рассказов'],
 publishing:['Макет и редакторский разбор','Редактура небольшой книги','Подготовка выпуска'],
 translation:['Образец литературного перевода','Перевод рассказа','Перевод повести'],
 journalism:['Авторский репортаж','Статья для журнала','Серия интервью'],
 finearts:['Серия иллюстраций','Обложка книги','Иллюстрации к книге'],
 cinema:['Короткометражная работа','Монтаж короткого фильма','Сценарий короткого фильма'],
 theatre:['Сценическая запись','Роль в камерном спектакле','Роль в постановке'],
 music:['Демо-запись','Выступление в небольшом зале','Запись музыкальной программы']
};
const creativeRoles47={literature:'staffwriter',publishing:'bookeditor',translation:'literarytranslator',journalism:'journalist',finearts:'illustrator',cinema:'editor',theatre:'stageactor',music:'musician'};
const statusNames47={submitted:'На рассмотрении',offered:'Предложение · нужно принять',active:'В работе',completed:'Завершено',rejected:'Отказ',expired:'Предложение истекло',cancelled:'Отменено',declined:'Отклонено'};
function creative47(){
 const x=s.creative47??={version:1,works:[],offers:[],applications:[],market:null,last:-1};
 for(const p of creative27().projects){
  if(!['ready','review','rejected','published'].includes(p.status)||x.works.some(w=>w.source===p.id))continue;
  x.works.push({id:'book:'+p.id,source:p.id,story189:p.story189,title:p.title,track:'literature',quality:p.quality,tick:s.clock.ticks,kind:'book',country:s.country});
 }
 return x;
}
function portfolio47(track){
 const works=creative47().works.filter(w=>w.track===track).sort((a,b)=>b.quality-a.quality);
 return {works,count:works.length,quality:works.slice(0,3).reduce((n,w)=>n+w.quality,0)/Math.max(1,Math.min(3,works.length))};
}
function creativeTasks47(){return s.clock.tasks.filter(t=>t.kind==='creativeWork47'&&!['completed','cancelled'].includes(t.state));}
function creativeRights47(o,exclude=null){
 const why=[];
 if(s.age<18||s.dead)why.push('Оплачиваемая работа доступна с 18 лет');
 if(s.country!==o.country)why.push('Нужно находиться в стране заказа');
 const other=creativeTasks47().filter(t=>t.offer47&&t.id!==exclude).reduce((n,t)=>n+t.hours,0);
 const hours=(s.job?(s.workHours??40):0)+other+o.hours;
 const r=rights31(o.country,{profession:creativeRoles47[o.track]});
 if(!r.reside||hours>r.hours)why.push('Недостаточно разрешённых рабочих часов с учётом основной работы и заказов');
 if(!r.citizen&&r.permit&&studyPermit31(r.permit))why.push('Учебное основание не даёт права на самостоятельные творческие заказы');
 return why;
}
function creativeCheck47(o){
 const p=portfolio47(o.track),why=creativeRights47(o);
 if(profileScore46(o.track)<o.skill)why.push('Профильный навык: нужно '+o.skill+'/100');
 if(p.count<o.samples)why.push('В портфолио нужно работ: '+o.samples);
 if(p.quality<o.quality)why.push('Качество портфолио: нужно '+o.quality+'/100');
 if(level16(country16[o.country][0])<o.language)why.push('Язык страны: '+cefr16[o.language]);
 return {why,probability:bounded(.25+profileScore46(o.track)*.004+p.quality*.002+Math.min(3,p.count)*.03,.1,.9)};
}
function creativeMarket47(track){
 const x=creative47(),period=Math.floor(s.clock.ticks/3),key=s.country+':'+period;
 // Keep country-period catalogues so changing countries cannot reroll an earlier brief.
 x.markets??={};
 if(!x.markets[key]){
  x.markets[key]=[];
  for(const k of Object.keys(formats47))for(let tier=0;tier<2;tier++){
   const casting=['theatre','music'].includes(k);
   const brief={id:id16('brief47'),track:k,kind:casting?'casting':'commission',title:formats47[k][tier+1],country:s.country,created:s.clock.ticks,expires:(period+1)*3,skill:tier?45:15,samples:tier?2:0,quality:tier?40:0,language:casting?3:2,hours:tier?8:4,duration:tier?3:2,fee:Math.round(c().wage*(tier?.035:.012)*(.9+Math.random()*.2))};
   x.markets[key].push(typeof creativeBrief184==='function'?creativeBrief184(brief,tier):brief);
  }
  for(const name of Object.keys(x.markets))if(Number(name.split(':')[1])<period)delete x.markets[name];
  x.market=key;x.offers=x.markets[key];save();
 }
 x.market=key;x.offers=x.markets[key];
 return x.offers.filter(o=>!track||o.track===track);
}
function sampleWork47(track){
 if(!formats47[track]||s.age<16||s.dead||creativeTasks47().length>=3)return false;
 task16('creativeWork47',formats47[track][0],3,{track,title47:formats47[track][0],country47:s.country},4);save();return true;
}
function applyCreative47(id){
 const x=creative47(),o=x.offers.find(o=>o.id===id);
 if(!o||o.expires<=s.clock.ticks||x.applications.some(a=>a.offer.id===id)||creativeCheck47(o).why.length)return false;
 const a={id:id16('creativeApp47'),offer:{...o},status:'submitted',roll:Math.random(),probability:creativeCheck47(o).probability,tick:s.clock.ticks};
 x.applications.push(a);task16('creativeReview47',o.kind==='casting'?'Пробы · '+o.title:'Заявка · '+o.title,1,{application47:a.id},2);save();return true;
}
function acceptCreative47(id){
 const a=creative47().applications.find(a=>a.id===id);
 if(!a||a.status!=='offered'||s.clock.ticks>=a.until||(a.offer.bridge193?creativeCheck47(a.offer).why.length:creativeRights47(a.offer).length)||creativeTasks47().length>=3)return false;
 a.status='active';const o=a.offer;
 const t=task16('creativeWork47',o.title,o.duration,{track:o.track,title47:o.title,country47:o.country,offer47:o,application47:a.id},o.hours);a.task=t.id;
 log('Творческий договор принят',o.title+' · '+o.hours+' ч/нед. · '+o.duration+' мес. · '+money(o.fee)+' после завершения.','Работа');save();return true;
}
startTask05=function(t){
 if(t.kind==='creativeWork47'){
  if(['completed','cancelled','paused'].includes(t.state)||s.dead)return false;
  t.blocked47=t.offer47?creativeRights47(t.offer47,t.id).join('; '):'';
  if(t.blocked47)return false;
 }
 return creativeBase47.startTask05(t);
};
finishTask=function(t){
 if(!['creativeWork47','creativeReview47'].includes(t.kind))return creativeBase47.finishTask(t);
 if(['completed','cancelled','paused'].includes(t.state)||t.progress<t.duration||!startTask05(t))return;
 const x=creative47(),a=x.applications.find(a=>a.id===t.application47);
 if(t.kind==='creativeReview47'){
  if(a?.status==='submitted'){
   a.status=a.roll<a.probability?'offered':'rejected';a.until=s.clock.ticks+3;
   log(a.status==='offered'?'Предложение по творческому проекту':'Отказ по творческой заявке',a.offer.title+(a.status==='offered'?': условия доступны в разделе «Портфолио и заказы». Принять можно в течение трёх месяцев.':': работа в портфолио и навык сохранены.'),'Работа');
  }
 }else{
  if(t.offer47&&a?.status!=='active')return;
  const quality=Math.round(clamp(profileScore46(t.track)*.8+10+Math.random()*10));
  x.works.push({id:t.id,title:t.title47,track:t.track,quality,tick:s.clock.ticks,kind:t.offer47?'paid':'sample',country:t.country47,specialty184:t.offer47?.specialty184||t.specialty184,level184:t.offer47?.level184,story189:t.story189});
  specialtyState46().skills[t.track]=Math.min(100,Math.max(specialtyState46().skills[t.track]||0,profileScore46(t.track))+3);
  if(t.offer47){a.status='completed';a.paid=t.offer47.fee;a.completed=s.clock.ticks;s.cash+=a.paid;s.clock.income+=a.paid;}
  const completed=x.works.at(-1),offerCount=x.applications.length;
  if(typeof cinemaInvitation191==='function')cinemaInvitation191(completed);
  if(x.applications.length===offerCount&&typeof creativeBridge193==='function')creativeBridge193(completed);
  if(typeof masterClassOffer194==='function')masterClassOffer194(completed);
  log('Работа добавлена в портфолио',t.title47+' · качество '+quality+'/100'+(a?.paid?' · выплачено '+money(a.paid):''),'Творчество');
 }
 archiveTask05(t,'completed');save();
};
cancelTask=function(id){
 const t=s.clock.tasks.find(t=>t.id===id);
 if(t&&['creativeReview47','creativeWork47'].includes(t.kind)){
  const a=creative47().applications.find(a=>a.id===t.application47);
  if(a&&['submitted','active'].includes(a.status))a.status='cancelled';
 }
 return creativeBase47.cancelTask(id);
};
function creativeMonth47(){
 const x=creative47();if(x.last>=s.clock.ticks)return;x.last=s.clock.ticks;
 for(const a of x.applications)if(a.status==='offered'&&s.clock.ticks>=a.until)a.status='expired';
}
autonomousMonth=function(){creativeBase47.autonomousMonth();creativeMonth47();};
function offerMenu47(id,application=false){
 const x=creative47(),a=application?x.applications.find(a=>a.id===id):null,o=a?.offer||x.offers.find(o=>o.id===id);if(!o)return;
 const q=creativeCheck47(o),task=a&&s.clock.tasks.find(t=>t.id===a.task),p=portfolio47(o.track);
 nextDetail20={sections:[...(typeof clientSections50==='function'?clientSections50(o):[]),section20('Условия',[
  fact20('Формат',o.sourceWork191?'Прямое приглашение':o.kind==='casting'?'Кастинг и срочное участие в проекте':'Самостоятельный заказ'),fact20('Профиль',trackNames46[o.track]),...(o.sourceWork191?[fact20('Предыдущая работа',x.works.find(w=>w.id===o.sourceWork191)?.title||'Работа из портфолио')]:[]),fact20('Страна',countries[o.country].name),
  fact20('Объём',o.duration+' мес. · '+o.hours+' ч/нед.'),fact20('Гонорар',money(o.fee)+' · один раз после завершения'),
  fact20('Требования','Навык '+o.skill+' · работ '+o.samples+' · качество '+o.quality+' · язык '+cefr16[o.language]),
  fact20('Ваше портфолио','Работ: '+p.count+' · качество '+Math.round(p.quality)),
  fact20('Статус',a?statusNames47[a.status]:'Приём заявок: ещё '+Math.max(0,o.expires-s.clock.ticks)+' мес.'),
  ...(task?[fact20('Прогресс',task.progress.toFixed(1)+' / '+task.duration),fact20('Ограничения',task.blocked47||'Нет')]:[]),...(a?.paid?[fact20('Выплачено',money(a.paid))]:[])
 ]),section20('Допуск',q.why.length?q.why.map(w=>fact20('Требование',w)):[fact20('Условия выполнены',o.network50||o.sourceWork191?'Заказчик уже прислал предложение; нужно отдельно принять условия':'Ответ после месяца рассмотрения; результат не гарантирован')])]};
 /* 273: текст окна снова виден (windows273), без «игрового кошелька» */show(o.title,'Гонорар назначен в валюте ваших денег. Смена страны или потеря права на работу приостанавливает оплачиваемый проект; накопленный прогресс сохраняется.',a?[
  ...(o.clientId50?[{label:'Заказчик и история',fn:()=>openClientFromOffer50(o,id,application)}]:[]),
  ...(a.status==='offered'?[{label:'Принять предложение',disabled:s.clock.ticks>=a.until||(o.network50||o.bridge193?creativeCheck47(o).why.length>0:creativeRights47(o).length>0)||creativeTasks47().length>=3,fn:()=>acceptCreative47(a.id)},{label:'Отклонить',fn:()=>{a.status='declined';save();}}]:[]),
  ...(task?[{label:'Отменить работу',fn:()=>cancelTask(task.id)}]:[])
 ]:[{label:o.kind==='casting'?'Записаться на пробы · 2 ч/нед.':'Подать заявку · 2 ч/нед.',disabled:q.why.length>0||o.expires<=s.clock.ticks||x.applications.some(a=>a.offer.id===id),fn:()=>applyCreative47(id)}]);
}
function creativeTrackMenu47(track){
 const p=portfolio47(track);
 show(trackNames46[track],'Навык '+Math.round(profileScore46(track))+'/100 · закончено работ: '+p.count+' · качество лучших трёх: '+Math.round(p.quality)+'/100. Своя работа занимает 3 месяца и 4 ч/нед.; перегрузка замедляет её.',[
  {label:'Создать работу для портфолио',hidden:s.age<16,disabled:s.age<16||creativeTasks47().length>=3,fn:()=>sampleWork47(track)},
  {label:'Заказы и кастинги этого профиля',fn:()=>show('Предложения · '+trackNames46[track],'Подборка обновляется раз в три месяца. Первая ступень доступна без готового портфолио; более крупные проекты требуют законченных работ.',creativeMarket47(track).map(o=>({label:o.title+' · '+money(o.fee),hint:(o.clientId50&&s.clients50?.clients[o.clientId50]?s.clients50.clients[o.clientId50].name+' · ':'')+o.duration+' мес. · '+o.hours+' ч/нед.',fn:()=>offerMenu47(o.id)})))},
  ...p.works.map(w=>({label:w.title+' · '+Math.round(w.quality)+'/100',hint:w.kind==='paid'?'Выполненный заказ':w.kind==='book'?'Законченная рукопись':'Самостоятельная работа',fn:()=>show(w.title,'Профиль: '+trackNames46[w.track]+'. Качество '+Math.round(w.quality)+'/100. Завершено в месяце '+w.tick+'.')})),
  {label:'Обучение и практика',fn:()=>profileEducation46(track)}
 ]);
}
function creativeMenu47(){
 const x=creative47();creativeMarket47();
 show('Портфолио и заказы','Работы сохраняются по профилям. До трёх проектов одновременно; гонорар выплачивается после завершения. Учебная практика развивает навык, но сама по себе не создаёт работу в портфолио.',[
  ...(typeof clientsMenu50==='function'?[{label:'Заказчики и рекомендации',fn:openClients50}]:[]),
  {label:'Мои работы и новые проекты',fn:()=>show('Профили портфолио','Выберите направление.',Object.entries(trackNames46).map(([k,name])=>({label:name+' · работ: '+portfolio47(k).count,fn:()=>creativeTrackMenu47(k)})))},
  ...creativeTasks47().map(t=>({label:t.label+' · '+t.progress.toFixed(1)+'/'+t.duration,hint:t.blocked47||t.hours+' ч/нед.',fn:()=>t.application47?offerMenu47(t.application47,true):show(t.label,'Самостоятельная работа для портфолио. Прогресс '+t.progress.toFixed(1)+'/'+t.duration+' месяцев.',[{label:'Отменить проект',fn:()=>cancelTask(t.id)}])})),
  ...x.applications.slice(-20).reverse().filter(a=>a.status!=='active').map(a=>({label:a.offer.title,hint:statusNames47[a.status],fn:()=>offerMenu47(a.id,true)})),
  {label:'Рукописи и публикации',fn:booksMenu27}
 ]);
}
jobEligibility16=function(v){
 const out=creativeBase47.jobEligibility16(v);
 if(v.profile46&&!out.why.length){const bonus=Math.max(...v.profile46.tracks.map(k=>Math.min(3,portfolio47(k).count)*portfolio47(k).quality/3000));out.probability=Math.min(.95,out.probability+Math.min(.08,bonus));}
 return out;
};
jobDetailData20=function(v,a){
 const d=creativeBase47.jobDetailData20(v,a);
 if(v.profile46){d.sections.push(section20('Портфолио',[fact20('Подходящие работы',v.profile46.tracks.map(k=>trackNames46[k]+': '+portfolio47(k).count).join(' · ')),fact20('Влияние','Законченные работы своего профиля повышают шанс до 8 процентных пунктов; обязательные требования сохраняются')]));d.actions.push({label:'Портфолио и творческие заказы',fn:creativeMenu47});}
 return d;
};
activitiesView=function(){return creativeBase47.activitiesView()+'<section class="activity-box"><h3>Портфолио и творческая работа</h3><p>Закончено работ: '+creative47().works.length+' · в работе: '+creativeTasks47().length+'</p><button onclick="creativeMenu47()">Портфолио, заказы и кастинги</button></section>';};
actionCatalog24=function(){return [...creativeBase47.actionCatalog24(),{id:'creative47',group:'Работа',label:'Портфолио, заказы и кастинги',keywords:'иллюстрация музыка театр актёр перевод журналист фриланс творчество',reason:s.age<16?'С 16 лет':'',fn:creativeMenu47}];};
const creativeDecisions47={decisionItems24,decisionRecord24,decisionActive24,openDecision24};
decisionRecord24=function(ref){return ref?.kind==='creative47'?creative47().applications.find(a=>a.id===ref.id):creativeDecisions47.decisionRecord24(ref);};
decisionActive24=function(ref){if(ref?.kind!=='creative47')return creativeDecisions47.decisionActive24(ref);const a=decisionRecord24(ref);return !!(s&&!s.dead&&a?.status==='offered'&&s.clock.ticks<a.until);};
decisionItems24=function(){return [...creativeDecisions47.decisionItems24(),...creative47().applications.filter(a=>decisionActive24({kind:'creative47',id:a.id})).map(a=>({ref:{kind:'creative47',id:a.id},q:{...a,expires:a.until},title:a.offer.title,note:'Творческий проект · принять или отклонить',expires:a.until}))].sort((a,b)=>(a.expires??Infinity)-(b.expires??Infinity));};
openDecision24=function(kind,id){if(kind!=='creative47')return creativeDecisions47.openDecision24(kind,id);if(!decisionActive24({kind,id}))return toast('Предложение уже закрыто или истекло.');return offerMenu47(id,true);};

if(s){creative47();render();}
