'use strict';
// Сборка 276: одна неделя на всё.
//
// Было: три разных счёта времени. Обязательства schedule23 (работа, дорога, учёба, дети, питомцы, уход), «планы»
// totalHours (дела, клубы, рукописи, события) и capacity() — каждый модуль решал о перегрузке по-своему: clock.js
// (+5 к усталости, если планы больше свободного), life23 (+0,3·перебор, запись раз в полгода), сводка (планы больше
// свободного). Перегрузку из одних обязательств почти никто не видел: 40 ч работы в другом районе + очный бакалавр —
// усталость 15→21 за год, а учёба шла на минимальном темпе 0,25 и оценки −3 за квартал. Часы своего дела жили делом
// в расписании (business263) — его можно было «приостановить». Отдых, отклики и документы замирали при нуле свободных
// часов. Большие обязательства (работа, учёба, своё дело) брались без проверки времени.
// Стало:
// 1. week276() — один журнал недели: бюджет, строки (работа с дорогой, учёба, дети и няни, питомцы, уход за близкими,
//    домашние дела, своё дело по каждому делу и режиму, болезнь/хроника/травма/суд/усталость, дела, клубы, рукописи,
//    события), обязательства, здоровье, планы, свободно = бюджет − обязательства − здоровье − планы (бывает < 0).
//    capacity() и totalHours() остаются прежними по смыслу (их читают около 40 мест); своё дело теперь обязательство
//    (schedule23), а не дело в расписании.
// 2. Месяц (clock.js, точечно): усталость — от нехватки часов; у каждого дела свой темп: отдых, документы, отклики,
//    переговоры и дела на 0 ч идут всегда (отдых при большой нехватке — медленнее), отдых не добавляет усталости за
//    перегрузку. Давно замершие дела из старых сохранений не завершаются пачкой: по два в месяц.
// 3. Нехватка часов раскладывается по «Чем жертвовать первым» (по умолчанию: планы → клубы → своё дело → учёба →
//    близкие → работа) и понемногу бьёт по конкретному: темп планов и клубов, смены владельца в своём деле (business272),
//    темп и оценки учёбы (вместо +1/−3 за квартал), отношения дома, результаты на работе и риск сокращения. Работа
//    больше ~45 ч в неделю (работа + своё дело) снижает отдачу. Первый месяц перегрузки — запись в «Истории» с цифрами,
//    дальше — в «Буднях».
// 4. Новое обязательство по вашему решению (работа, учёба, своё дело, режим дела, часы работы, клуб, питомец, уход
//    за близким, курсы, наставник, творческий заказ): если неделя не сходится — окно «Неделя не сходится» с тем, что
//    добавляется, сколько не хватает, и чем облегчить неделю; «Взять всё равно» и «Отказаться». Для автоматических путей
//    (события каталога, фоновые предложения, переезд семьи, декрет, продолжение жизни) окна нет.
// 5. Баги: двойной счёт часов дела (уже снят в 270) — теперь дело одно обязательство; «пауза» дела — нет; часы
//    работы не сбрасываются на 40 при смене названия должности; часы учёбы в карточке программы — те, что в неделе.
// 6. Решения владелицы после исправлений: пока неделя не сходится, отдых снимает усталость только до границы
//    (fatigueFloor276: растёт с нехваткой, не выше 45); пока неделя не сходится, здоровье теряет понемногу, тем больше,
//    чем дольше (strainMonth276), — вместо прежнего «ничего при 70–80, сразу −1 выше 80» (clock.js). Неделя сошлась, а
//    усталость ещё выше 80 — как месяц перегрузки (strainLoss80_276; 276: решение владелицы 28.11 — и при счёте 0
//    это −0,3, а не прежнее −1, дальше как strainLoss276, не больше max): облегчить неделю не дороже, чем оставить.
//    «Не сходится» везде с получаса нехватки (time276.shortMin) — как «не хватает 1 ч» на экране.
// 7. Решения владелицы по проверке баланса (27.11): потеря здоровья зависит не только от усталости, но и от самой
//    нехватки часов (strainShare276) — отдых в расписании её смягчает, но не отменяет; отдых, закончившийся в неделе с
//    нехваткой или вскоре после долгой перегрузки, прибавляет здоровью меньше (restHealth276), и восстановление здоровья
//    при нехватке медленнее, как при переутомлении (healthBlockers259). Память перегрузки — не дальше места, где потеря уже max;
//    после 12 месяцев без нехватки — новая перегрузка и новая запись в «Истории».
// 8. Вторая проверка баланса (27.11): пока усталость ниже 70, доля перегрузки не больше strain.soft (0,75) при любой
//    нехватке — отдых в расписании смягчает потерю здоровья всегда, а не только пока не хватает меньше 12 ч; доля
//    считается по усталости в тот же момент, что и потеря выше 80 (strainLoss80_276, до отдыха этого месяца), — облегчить неделю не
//    дороже и в месяц, когда кончается отдых. Полчаса — граница везде: и для настроения, и для того, кто отдаёт часы
//    (squeeze276). На экране одно число нехватки — с отдыхом, и если часть его — отдых, это сказано: «не хватает 3 ч,
//    из них 2 ч — отдых»; запись «Неделя не помещается» — только когда неделя не сходится и без отдыха. Окно «Неделя не
//    сходится» считает так же, как панель после того, как вы возьмёте новое.

const timeBase276={schedule23,capacity,totalHours,autonomousMonth,finishTask,loadMenu29,toast,activitiesView,schedulePanel59,healthNotices58,
 businessTasks263,startJob16,studyStart16,startEnterprise152,setBusinessMode263,hoursMenu,joinClub19,changeClub19,setElderCare58,
 tuition16,programDetailData20,advanceMonth,rollYear,start};
const time276={
 // Неделя не сходится — с получаса нехватки (без запланированного отдыха). Одна граница на всё: на экране это уже
 // «не хватает 1 ч», с неё растёт усталость, держит граница отдыха и считается здоровье при перегрузке.
 shortMin:.5,
 order:['plans','clubs','business','study','family','work'],
 names:{plans:'планы',clubs:'клубы',business:'своё дело',study:'учёба',family:'близкие',work:'работа'},
 on:{plans:'на планы',clubs:'на клубы',business:'на своё дело',study:'на учёбу',family:'на близких',work:'на работу',sleep:'на сон и отдых'},
 what:{plans:'планы встанут',clubs:'занятия в клубах будут пропадать',business:'в деле будет меньше смен',study:'оценки и темп учёбы снизятся',family:'дома станет меньше тепла',work:'результаты на работе снизятся',sleep:'придётся недосыпать'},
 // Ждут ответа или идут сами: продвигаются при любой нагрузке (отклики на вакансии и поиск работы — тоже).
 always:new Set(['rest','queuedAction','search','pathPermit','pathMove','pathJob','pathInterview','pathAdmission','pathScholarship','pathLicense',
  'workTerms21','familyTerms21','careerNegotiation18','sponsor22','workRenew45','contractRenew45','studyRenew68','naturalize45',
  'familyCitizenship231','return29','familyMove17','inviteMove','creativeReview47']),
 units:{self:1,partial:.45,manager:0},
 force:0,auto:0,swallow:false,gate:null,fullFee:0,
 // Усталость при долгой нехватке: доля набранной, которая уходит за месяц (равновесие — около 25 × прирост за месяц).
 recover:.04,planBase:null,
 // Решение владелицы (276): пока неделя не сходится, отдых снижает усталость, но не ниже границы — она растёт с нехваткой
 // (часы без запланированного отдыха): base + per × нехватка, не выше cap. Неделя сошлась — границы нет. CALIB_FLOOR
 floor:{base:10,per:2,cap:45},
 // Решения владелицы (276): здоровье при долгой перегрузке. Пока неделя не сходится, здоровье за месяц теряет base и ещё
 // grow за каждый год такой жизни, не больше max, — в полную силу при усталости от fatigue, а при меньшей усталости — долю
 // нехватка / hours, но не больше soft (strainShare276): отдых снимает усталость, но не саму нехватку часов, — и при любой
 // нехватке смягчает потерю хотя бы на 1 − soft. Счёт месяцев растёт на эту долю и не дальше того, где потеря уже max
 // (strainTop276). Месяц без нехватки снимает decay со счёта; после gap месяцев без
 // неё новая перегрузка — снова запись в «Истории» (когда потеря за месяц дойдёт до note). Это вместо прежнего: при
 // усталости 70–80 — ничего, выше 80 — сразу −1 в месяц (clock.js; 276: при неделе, которая сходится, вместо −1 —
 // strainLoss276 по счёту, не меньше месяца перегрузки, strainLoss80_276). Отдых, закончившийся в неделе с нехваткой, прибавляет здоровью меньше: долю
 // 1 − нехватка / hours, а пока перегрузка помнится — не больше 1 − счёт / strainTop276 (restHealth276); восстановление
 // здоровья ниже потолка — медленнее на долю 0,5 × нехватка / hours, как при переутомлении (healthBlockers259).
 // Подобрано прогоном calibrate_death (RNG=1, одни и те же сиды): цель владелицы — перегруженный работник (работа 40 ч
 // в другом районе и своё дело «сам» с 30 до 65 лет, нехватка 20–35 ч) живёт в среднем 70–73; с «Восстановить силы» в
 // расписании — чуть дольше, но меньше обычного игрока. max .65 (было .8 — 67–68 лет); hours 12: с отдыхом нехватка
 // у такого работника около 12 ч, и при hours 24 отдых всё ещё давал ему 8–10 лет. soft .75 — вторая проверка: при
 // нехватке от 12 ч отдых здоровью уже ничего не давал (при .9 — около полугода жизни). Итог — в отчёте сборки.
 strain:{fatigue:70,hours:12,soft:.75,base:.3,grow:.15,max:.65,decay:1,gap:12,note:.1}
};
function timeState276(){return s.time276??={v:1,order:null,month:null,episode:null,workStrain:0,studyF:[0,0],applied:-1,format:null};}
function timeOrder276(){const o=s?.time276?.order;return Array.isArray(o)&&o.length===6&&time276.order.every(k=>o.includes(k))?o:time276.order;}
function hours276(n){const r=Math.round(Math.abs(n));return r+' ч';}
function plural276(n,one,few,many){const a=Math.abs(Math.round(n))%100,d=a%10;return a>10&&a<20?many:d===1?one:d>=2&&d<=4?few:many;}
function cleanTitle276(t){return String(t||'').replace(/\s*·\s*\d+([.,]\d+)?\s*ч\/нед\.?$/,'');}
function alive276(){return !!s&&!!s.clock&&!s.dead;}

// ---------- своё дело: часы владельца — обязательство по режиму ----------
function bizList276(){try{return typeof ownedEnterprises168==='function'&&s?ownedEnterprises168().filter(b=>b.status==='active'):[];}catch(e){return [];}}
function bizMode276(b){return typeof bzMode272==='function'?bzMode272(b):typeof business263!=='undefined'&&business263.modes[b?.mode263]?b.mode263:'partial';}
function bizPresent276(b){try{return typeof businessPresent263==='function'?businessPresent263(b):b.country===s.country;}catch(e){return false;}}
// Владелец один: «сам» в двух делах делит одно рабочее место (как bzOwnerShares272), часы — тоже.
function bizHours276(mod=null){
 if(typeof business263==='undefined')return [];
 const list=bizList276().filter(bizPresent276).map(b=>({b,id:b.id,title:b.title,mode:mod&&mod.id===b.id?mod.mode:bizMode276(b)}));
 if(mod?.add)list.push({b:null,id:'new276',title:mod.title||'Новое дело',mode:mod.add});
 const U=time276.units,R=list.reduce((n,x)=>n+(U[x.mode]||0),0),k=R>1?1/R:1;
 for(const x of list){const h=business263.modes[x.mode]?.hours||0;x.hours=(U[x.mode]||0)>0?Math.max(1,Math.round(h*k)):h;}
 return list;
}
function bizTotal276(mod){return bizHours276(mod).reduce((n,x)=>n+x.hours,0);}

schedule23=function(...args){
 const q=timeBase276.schedule23.apply(this,args);
 if(!s||!s.clock)return q;
 // Заочная учёба: половина часов.
 const t=typeof path16==='function'?path16().study:null;
 const prog=t&&t.status!=='paused'&&typeof prog16==='function'&&prog16(t.program);
 if(prog&&t.partTime276&&q.study>0){const cut=q.study/2;q.study-=cut;q.total-=cut;q.partTime276=cut;}
 // Старый курс (studyTrack): в неделе столько же часов, сколько показано в его карточке (было 20 ч при 5–8 в карточке),
 // а при учёбе в вузе — оба.
 const tr=s.studyTrack;
 if(tr&&!tr.userPaused&&Number.isFinite(tr.hours)){
  const d=!prog&&!s.study?tr.hours-20:tr.hours;
  q.total+=d;q.study+=d;
 }
 const biz=bizHours276(),h=biz.reduce((n,x)=>n+x.hours,0);
 q.business276=h;q.businessLines276=biz.map(x=>({id:x.id,title:x.title,mode:x.mode,hours:x.hours}));
 q.total+=h;
 if(!Number.isFinite(q.total))q.total=['work','road','study','care','chores54','childTransport55','childHealth55'].reduce((n,k)=>n+(Number.isFinite(q[k])?q[k]:0),0)+h+(typeof petHours==='function'?petHours():0);
 return q;
};
// Дела «своё дело» из старых сохранений больше не нужны: часы дела — в обязательствах.
function migrateBusiness276(){
 if(!s?.clock?.tasks)return;
 if(s.clock.tasks.some(t=>t.kind==='business263'))s.clock.tasks=s.clock.tasks.filter(t=>t.kind!=='business263');
}
businessTasks263=function(...args){
 const out=timeBase276.businessTasks263.apply(this,args);
 migrateBusiness276();
 return out;
};
totalHours=function(...args){
 const n=timeBase276.totalHours.apply(this,args);
 // Пока старое дело ещё лежит в расписании (до первой миграции), его часы не считаем: они в обязательствах.
 const old=(s?.clock?.tasks||[]).filter(t=>t.kind==='business263'&&!['cancelled','completed'].includes(t.state)).reduce((a,t)=>a+(t.hours||0),0);
 return n-old;
};
// Подсказки business272 про часы дела читали дело в расписании; теперь — те же числа из недели.
if(typeof bzCardText272==='function'){
 const cardBase276=bzCardText272;
 bzCardText272=function(b,text,...rest){
  let out=cardBase276.call(this,b,text,...rest);
  try{
   const x=bizHours276().find(x=>x.id===b?.id),sh=typeof bzOwnerShares272==='function'?bzOwnerShares272():null;
   if(x&&sh&&sh.k<1)out=String(out).replace(/\((\d+) ч\/нед\.\)\./,'(около '+x.hours+' ч/нед.: вас делят '+sh.count+' '+plural276(sh.count,'дело','дела','дел')+').');
  }catch(e){}
  return out;
 };
}

// ---------- учёба: часы, заочно ----------
function studyHours276(p,part=false){if(!p)return 0;const h=p.level==='certificate'?12:p.level==='phd'?36:28+(p.difficulty||0)/20;return part?h/2:h;}
// Заочно — вдвое меньше платёж за месяц, а месяцев вдвое больше: итоговая цена та же. Поэтому половина — только там,
// где платят помесячно. Кредит на остаток курса и договорённость с родителями считают полную цену месяца
// (иначе кредит покрывал бы половину остатка, а после возвращения на очное учёба шла бы за полцены).
tuition16=function(p,a,...rest){
 const fee=timeBase276.tuition16.call(this,p,a,...rest),t=s&&typeof path16==='function'?path16().study:null;
 return t?.partTime276&&a&&t.application===a.id&&!(time276.fullFee>0)?fee/2:fee;
};
function fullFee276(base){return function(...args){time276.fullFee=(time276.fullFee||0)+1;try{return base.apply(this,args);}finally{time276.fullFee--;}};}
for(const name of ['financeRemaining17','educationSupport17'])if(typeof window[name]==='function')window[name]=fullFee276(window[name]);
programDetailData20=function(p,...rest){
 const d=timeBase276.programDetailData20.call(this,p,...rest);
 try{for(const g of d?.sections||[])for(const r of g.rows||[])if(r.label==='Нагрузка')r.value=Math.round(studyHours276(p))+' ч/нед.';}catch(e){}
 return d;
};

/* 276: окно программы и предложения (windows273.js, study2733.js) берут срок и «всего» из studyLoad273 — копии прежней
   формулы monthPath16 (свободные часы / (планы + часы программы), не меньше 0,25). С 276 темп учёбы — studyPace276:
   нехватку первыми отдают планы, клубы и своё дело («Чем жертвовать первым»), учёбе — 1 − 0,75 × доля её недостающих
   часов, заочно вдвое; оценки за квартал — 1 − 8 × доля (studyGrade276). Окно считает по той же неделе. */
function wrapStudyLoad276(){
 if(typeof studyLoad273!=='function'||studyLoad273.time276)return;
 const loadBase276=studyLoad273;
 studyLoad273=function(p,...rest){
  const out=loadBase276.call(this,p,...rest);
  if(!p||!s?.clock||typeof path16!=='function')return out;
  const x=path16(),old=x.study,mine=old&&old.program===p.id&&old.status!=='paused';
  try{
   if(!mine)x.study={id:'hours273',program:p.id,status:'active',payer:'self',progress:0,grades:70,badTerms:0,startedAt:s.clock.ticks};
   const f=squeeze276(week276()).f.study||0;
   // 276: pace — только нехватка часов (окна 273 читают pace < 1 как «не хватает часов»); заочно — отдельный множитель
   // part276: срок вдвое дольше, но это не перегрузка.
   out.pace=1-.75*f;
   out.part276=x.study.partTime276?.5:1;
   out.falls=1-8*f<0;
   out.f276=f;
  }catch(e){console.error(e);}finally{x.study=old;}
  out.months=Math.max(1,Math.ceil(out.left/(out.pace*(out.part276||1))-1e-9));
  return out;
 };
 studyLoad273.time276=true;
}
/* 276: «Моя учёба» (study2733.js) — те же прежние формулы: темп studyPace2733 (capacity / (планы + часы)) и оценки
   «+1, если capacity() > totalHours(), иначе −3». Темп — как в окне программы (studyLoad273), оценки к ближайшей
   проверке — как studyGrade276 по нынешней неделе: +1 − 8 × доля недостающих учёбе часов, не ниже −4.
   276: studyPace2733 — ход учёбы целиком (нехватка × заочно), им считается срок; заметка в «Осталось» у заочника
   говорит «заочно — вдвое дольше», а «не хватает часов» — только при настоящей нехватке. */
function wrapStudyTop276(){
 if(typeof studyPace2733==='function'&&!studyPace2733.time276){studyPace2733=function(p){const l=studyLoad273(p);return l.pace*(l.part276||1);};studyPace2733.time276=true;}
 if(typeof studyTop2733!=='function'||studyTop2733.time276)return;
 const topBase276=studyTop2733;
 studyTop2733=function(t,p,...rest){
  const rows=topBase276.call(this,t,p,...rest);
  try{
   const o=rows.find(r=>r.label==='Осталось'),load=t&&p&&t.partTime276?studyLoad273(p):null;
   if(o&&load&&load.part276<1&&typeof o.note==='string'&&/: не хватает часов/.test(o.note)){
    const was=slower2733(load.pace*load.part276)+': не хватает часов',now=['заочно — вдвое дольше',load.pace<1?slower2733(load.pace)+': не хватает часов':''].filter(Boolean).join(' · ');
    o.note=o.note.replace(was,now);
    if(!(load.pace<1))o.value=o.value.replace(/^≈ /,'');
   }
   const r=rows.find(r=>r.label==='Оценки');
   if(r&&t&&/ → \d+ /.test(r.value)){
    const f=squeeze276(week276()).f.study||0,d=Math.max(-4,Math.round((1-8*f)*10)/10);
    r.value=r.value.replace(/ → \d+ /,' → '+Math.max(0,Math.min(100,Math.round(t.grades+d)))+' ');
   }
  }catch(e){console.error(e);}
  return rows;
 };
 studyTop2733.time276=true;
}
function wrapStudy276(){wrapStudyLoad276();wrapStudyTop276();}
// Порядок подключения не важен: если windows273.js и study2733.js подключены позже, обёртки встают, когда загружены все скрипты.
wrapStudy276();
if(typeof document!=='undefined'&&document.readyState==='loading')document.addEventListener('DOMContentLoaded',wrapStudy276);

// ---------- журнал недели ----------
function lineLabelWork276(q){
 const j=s.job,f=typeof formats16!=='undefined'&&j.format?formats16[j.format]:'';
 return 'Работа · '+cleanTitle276(j.title)+' · '+Math.round(q.work)+' ч'+(q.road>.05?' и дорога '+Math.round(q.road)+' ч':'')+(f?' · '+f.toLowerCase():'');
}
function week276(){
 if(!s||!s.clock)return {budget:0,lines:[],commitments:0,plans:0,health:0,free:0,capacity:0};
 const budget=weekBudget29(),q=schedule23(),lines=[];
 const add=(key,label,h,kind,lighten='',more={})=>{if(Number.isFinite(h)&&Math.abs(h)>=.05)lines.push({key,label,hours:h,kind,lighten,...more});return Number.isFinite(h)?h:0;};
 let com=0;
 // Работа с дорогой (удалёнка — дорога 0, гибрид — меньше).
 if(s.job&&(q.work>0||q.road>0))com+=add('work',lineLabelWork276(q),q.work+q.road,'commitment','Сократить ставку или попросить гибрид, удалёнку',{area:'work',work:q.work,road:q.road,format:s.job.format||null});
 const duty=s.job?.company18?.duties21?.load||0;
 if(duty)com+=add('duties','Работа · дополнительные обязанности',duty,'commitment','Обсудить с руководителем',{area:'work'});
 // Учёба (за вычетом часов, которые оплачивает работодатель).
 const t=typeof path16==='function'?path16().study:null;
 const grant=t&&t.status!=='paused'&&String(t.payer||'').startsWith('employer')&&typeof sponsor22==='function'?sponsor22(t.program):null;
 const study=q.study-(grant?.studyHours||0);
 if(q.study>0){
  const p=t&&typeof prog16==='function'?prog16(t.program):null;
  const label=p?'Учёба · '+(typeof programName26==='function'?programName26(p):p.id)+(t.partTime276?' · заочно':''):s.studyTrack?'Учёба · курс':s.age<18?'Школа':'Учёба';
  com+=add('study',label,study,'commitment',p?(t.partTime276?'Академический отпуск':'Заочно или академический отпуск'):'',{area:'study'});
 }
 // Дети, больной ребёнок, секции, близкие в возрасте, дом, питомцы.
 const elder=q.elder58||0,kids=Math.max(0,(q.care||0)-elder);
 if(kids>0){
  const cl=typeof careLoad54==='function'?careLoad54():null,help=cl?.help||0;
  com+=add('children','Дети · уход'+(help>=.5?' · няня и помощь берут '+Math.round(help)+' ч из '+Math.round(cl.total):''),kids,'commitment','Няня, помощь родных, отпуск другого родителя',{area:'family'});
 }
 if(q.childHealth55)com+=add('childHealth','Больной ребёнок',q.childHealth55,'commitment','',{area:'family'});
 if(q.childTransport55)com+=add('childTransport','Дети · секции и дорога',q.childTransport55,'commitment','Меньше секций',{area:'family'});
 if(elder>0)com+=add('elder','Уход за близкими',elder,'commitment','Помощник или договорённость с родными',{area:'family'});
 if(q.chores54)com+=add('chores','Домашние дела',q.chores54,'commitment','Договориться дома иначе',{area:'family'});
 const pets=typeof petHours==='function'?petHours():0;
 if(pets>0)com+=add('pets','Питомцы',pets,'commitment','Передержка или помощь с выгулом',{area:'family'});
 for(const x of q.businessLines276||[])com+=add('business:'+x.id,'Своё дело · '+x.title+' · '+(business263.modes[x.mode]?.name||'').toLowerCase(),x.hours,'commitment',
  x.mode==='self'?'Режим «частично» или управляющий':x.mode==='partial'?'Управляющий':'',{area:'business',businessId:x.id,mode:x.mode});
 const rest=q.total-com;
 if(Math.abs(rest)>=.05)com+=add('other','Прочие обязанности',rest,'commitment');
 // Здоровье: то, что вычитает capacity().
 let hl=0;
 const custody=typeof courtCustody94==='function'&&courtCustody94();
 if(s.illness)hl+=add('illness','Болезнь · '+s.illness.name,6,'health','Лечение');
 const chronic=typeof chronicCostHours25==='function'?chronicCostHours25():0;
 if(chronic)hl+=add('chronic','Хроническое состояние и режим',chronic,'health','Регулярная помощь');
 const tired=Math.floor((s.clock.fatigue||0)/30);
 if(tired)hl+=add('fatigue','Усталость',tired,'health','Отдых');
 if(typeof incidents56==='function'&&incidents56().injury)hl+=add('injury','Восстановление после травмы',4,'health');
 if(!custody&&typeof courtSentenceActive94==='function'&&courtSentenceActive94('service'))hl+=add('court','Общественные работы',5,'health');
 if(custody)hl+=add('custody','Под стражей',Math.max(0,budget-q.total-hl),'health');
 // Планы: дела, клубы, рукописи, события.
 let pl=0;
 for(const t of s.clock.tasks||[]){
  if(['paused','cancelled','completed'].includes(t.state)||t.kind==='business263'||!(t.hours>0))continue;
  pl+=add('task:'+t.id,t.label||'Дело',t.hours,'plan',t.kind==='rest'?'':'Поставить на паузу',{area:'plans',taskId:t.id,rest:t.kind==='rest',always:time276.always.has(t.kind)});
 }
 if(typeof clubState19==='function')for(const m of clubState19().memberships||[]){
  if(m.status!=='active'||!clubLocal19(m)||typeof clubParticipation245==='function'&&!clubParticipation245(m))continue;
  pl+=add('club:'+m.id,'Клуб · '+(clubsCatalog19[m.type]?.name||m.type),clubsCatalog19[m.type]?.hours||0,'plan','Пауза в клубе',{area:'clubs',clubId:m.id});
 }
 if(typeof creative27==='function')for(const p of creative27().projects||[])if(p.status==='active')pl+=add('book:'+p.id,'Рукопись · '+p.title,p.hours||0,'plan','Отложить рукопись',{area:'plans'});
 for(const e of s.catalog245?.events||[])if(e.status==='scheduled'&&e.due>=s.clock.ticks&&e.hours>0){
  const c=typeof catalog245!=='undefined'?catalog245.events?.find(x=>x.id===e.event):null;
  pl+=add('event:'+e.id,'Встреча · '+(c?.title||'по приглашению'),e.hours,'plan','',{area:'plans'});
 }
 const total=totalHours(),left=total-pl;
 if(Math.abs(left)>=.05)pl+=add('otherPlans','Другие планы',left,'plan','',{area:'plans'});
 const free=budget-com-hl-pl;
 return {budget,lines,commitments:com,health:hl,plans:pl,free,capacity:capacity(),custody};
}
function free276(){return Math.round(week276().free);}
function rest276(L){return (L?.lines||[]).filter(l=>l.rest).reduce((n,l)=>n+l.hours,0);}
// Нехватка недели — одно число на всех экранах (панель, сводка, «Ожидают ответа», «Нагрузка», запись в «Истории», окно):
// сколько не хватает до «бюджет − обязательства − здоровье − планы». Запланированный отдых — тоже часы недели.
function short276(L){return L?.custody?0:Math.max(0,-(L?.free||0));}
function shortH276(L){const d=short276(L);return d>=time276.shortMin?Math.round(d):0;}
// Нехватка без запланированного отдыха (по ней — граница отдыха, здоровье, настроение, запись «Неделя не помещается»).
function shortNoRestW276(L){return L?.custody?0:Math.max(0,-((L?.free||0)+rest276(L)));}
// Одно число на экране — нехватка с отдыхом (N); если часть её — сам отдых, это сказано: R = N − нехватка без отдыха.
// N и Nn округлены одинаково (с получаса), поэтому R не бывает меньше нуля и N = Nn + R.
function shortParts276(L){
 const n=shortH276(L),d=shortNoRestW276(L),nn=d>=time276.shortMin?Math.round(d):0;
 return {N:n,Nn:Math.min(n,nn),R:Math.max(0,n-nn)};
}
// « (из них 2 ч — отдых)» / « — это отдых»; пусто, если отдыха в нехватке нет.
function restPart276(P,tail=false){return P.R>=1?(P.Nn>=1?(tail?', из них ':' (из них ')+P.R+' ч — отдых'+(tail?'':')'):' — это отдых'):'';}

// ---------- нехватка: кто отдаёт часы ----------
function areaHours276(L){
 const a={plans:0,clubs:0,business:0,study:0,family:0,work:0},p=s&&currentPartner();
 for(const l of L.lines){
  if(!l.area||!(l.hours>0))continue;
  if(l.area==='plans'&&(l.rest||l.always))continue;
  a[l.area]+=l.hours;
 }
 // Время с партнёром — не строка недели, но первое, что уходит у занятого человека.
 if(p&&p.country===s.country)a.family+=4;
 return a;
}
// opt.noRest — без часов запланированного отдыха (для усталости: отдых не добавляет усталости за перегрузку).
// opt.floors — нижние границы смен владельца по делам (bizFloors276), чтобы не считать их заново.
function squeeze276(L,extra=null,opt={}){
 const area=areaHours276(L),cap={...area};
 let free=L.free+(opt.noRest?rest276(L):0);
 // Своё дело отдаёт не больше, чем позволяет нижняя граница смен: перегрузка не уводит прибыльное дело в минус.
 const floors=opt.floors||bizFloors276(),biz=L.lines.filter(l=>l.area==='business'&&l.hours>0);
 cap.business=biz.reduce((n,l)=>n+l.hours*(1-(floors[l.businessId]??0)),0);
 if(extra){free-=extra.hours;if(extra.area&&area[extra.area]!=null){area[extra.area]+=extra.hours;if(extra.area!=='business')cap[extra.area]+=extra.hours;}}
 // Полчаса — граница везде: меньше — неделя сходится, часы ни у кого не забираются (на экране это «0 ч»).
 const missing=L.custody||-free<time276.shortMin?0:-free,order=timeOrder276(),taken={},f={},fb={};
 let left=missing;
 for(const k of order){const t=Math.min(left,cap[k]);taken[k]=t;f[k]=area[k]>0?t/area[k]:0;left-=t;}
 // По делам: нехватка делится пропорционально тому, что каждое может отдать.
 for(const l of biz){const room=l.hours*(1-(floors[l.businessId]??0));fb[l.businessId]=cap.business>0&&l.hours>0?taken.business*room/cap.business/l.hours:0;}
 return {missing,taken,f,fb,floors,unabsorbed:Math.max(0,left),area,order,free};
}
function paidHours276(L){return L.lines.filter(l=>l.area==='work'||l.area==='business').reduce((n,l)=>n+(l.key==='work'?l.work:l.hours),0);}
// Целые часы по частям так, чтобы в сумме вышло показанное «не хватает N ч» (наибольшие остатки).
function splitHours276(vals,total){
 const fl=vals.map(v=>Math.max(0,Math.floor(v))),fr=vals.map((v,i)=>[v-fl[i],i]).sort((a,b)=>b[0]-a[0]);
 let r=total-fl.reduce((n,v)=>n+v,0);
 for(const [,i] of fr){if(r<=0)break;if(vals[i]>0){fl[i]++;r--;}}
 for(const [,i] of [...fr].reverse()){if(r>=0)break;if(fl[i]>0){fl[i]--;r++;}}
 return fl;
}
function sufferText276(sq){
 const keys=[...sq.order,'sleep'],vals=keys.map(k=>k==='sleep'?sq.unabsorbed:sq.taken[k]||0);
 const n=splitHours276(vals,Math.round(sq.missing));
 const parts=keys.map((k,i)=>n[i]>=1?time276.on[k]+' ('+n[i]+' ч)':'').filter(Boolean);
 return parts.length>1?parts.slice(0,-1).join(', ')+' и '+parts.at(-1):parts[0]||'';
}

// ---------- своё дело: нижняя граница смен владельца ----------
// Решение владелицы (276): от одной перегрузки дело не закрывается. Смены владельца не опускаются ниже уровня, при
// котором дело, прибыльное при полном присмотре, уходит в минус только из-за нехватки часов. Уровень — по последним
// месяцам дела (спрос, мощность, выручка, расходы), с запасом в десятую часть маржи. Дело, которое и при полном
// присмотре в минусе (первые месяцы, неудачное место), перегрузка не трогает вовсе: часы уходят дальше по списку.
function bizFloor276(b){
 try{
  const base=time276.planBase;if(!base||!b||b.status!=='active')return 1;
  const p=base(b);
  if(!p||!p.present||!(p.own>0))return 1;
  const hist=(b.history||[]).slice(-3).filter(h=>h&&h.sales>0&&h.cover272>0&&h.demand263>0&&h.capacity263>0);
  if(!hist.length)return 1;
  const sp=typeof enterpriseSpace157==='function'?enterpriseSpace157(b):null,per=(sp?.capacity||1)*(b.equipment156?1.12:1);
  const v=enterpriseMarket165(b)?.variable??.3,other=p.main-p.own,mult=c=>c<=0?0:typeof bzMult272==='function'?bzMult272(Math.min(1,c)):Math.min(1,c);
  const effAt=(D,k)=>Math.min(D*mult((p.own*k+other)/p.need),(p.share*k+p.mainIds.length+p.mgr)*per);
  const rows=hist.map(h=>{const D=h.demand263/(h.cover272<1?mult(h.cover272):1),eff=Math.min(h.demand263,h.capacity263);
   return {D,eff,S:h.sales-(h.branchSales||0)-(h.books272||0),P:h.sales-h.costs};});
  const profit=k=>rows.reduce((n,r)=>n+r.P+r.S*(effAt(r.D,k)/r.eff-1)*(1-v),0)/rows.length;
  const S1=rows.reduce((n,r)=>n+r.S*effAt(r.D,1)/r.eff,0)/rows.length,P1=profit(1);
  if(!(P1>0)||!Number.isFinite(P1))return 1;
  const target=Math.min(P1,.1*S1*(1-v));
  let lo=0,hi=1;
  if(profit(0)>=target)return 0;
  for(let i=0;i<24;i++){const mid=(lo+hi)/2;if(profit(mid)>=target)hi=mid;else lo=mid;}
  return Math.min(1,Math.ceil(hi*100)/100);
 }catch(e){return 1;}
}
function bizFloors276(){const out={};for(const b of bizList276())out[b.id]=bizFloor276(b);return out;}

// ---------- месяц: усталость и темп ----------
// Нижняя граница усталости при нехватке d ч (без запланированного отдыха); 0 — границы нет.
function fatigueFloor276(d){const F=time276.floor;return Number.isFinite(d)&&d>=time276.shortMin?Math.min(F.cap,F.base+F.per*d):0;}
function monthWeek276(){
 if(!s||!s.clock)return null;
 const x=s.clock,st=timeState276();
 migrateBusiness276();
 thaw276();
 const L=week276(),floors=bizFloors276(),sq=squeeze276(L,null,{floors}),sqF=squeeze276(L,null,{floors,noRest:true}),paid=paidHours276(L),M=sq.missing,rest=rest276(L);
 let fatigue;
 // Усталость — от нехватки: недоделанные планы тянут слабее, урезанные обязательства сильнее, недосып — сильнее всего.
 // Запланированный отдых сюда не входит. При долгой нехватке (и при неделе, занятой почти целиком) усталость не растёт
 // без конца, а держится на уровне, который зависит от нагрузки: за месяц уходит time276.recover от набранной,
 // равновесие — около 25 × месячный прирост (нехватка 3 ч и 73 ч работы с делом — около 45; 40 ч и больше — 100).
 // Шкала одна и не ломается: неделя с нехваткой утомляет не меньше, чем почти занятая (+1 в месяц, если в неделе есть
 // планы), а восстановление не быстрее, чем в свободной неделе (−3 в месяц).
 const over=paid>45?Math.min(2,.05*(paid-45)):0,F=x.fatigue||0;
 const plans=L.lines.filter(l=>l.kind==='plan'&&!l.rest).reduce((n,l)=>n+l.hours,0),near=plans>.8*(plans+Math.max(0,L.free+rest));
 let drive;
 if(sqF.missing>=time276.shortMin)drive=Math.min(6,Math.max(near?1:0,.1*(sqF.taken.plans+sqF.taken.clubs)+.15*(sqF.taken.business+sqF.taken.study+sqF.taken.family+sqF.taken.work)+.3*sqF.unabsorbed));
 else drive=near?1:-3;
 fatigue=(drive>-3?Math.max(-3,drive-time276.recover*F):-3)+over;
 if(L.custody)fatigue=Math.min(fatigue,1);
 // Пока неделя не сходится, усталость не уходит ниже границы (сама по себе — тоже); отдых и прочее — в afterMonth276.
 const floor=fatigueFloor276(sqF.missing);
 if(floor>0&&fatigue<0)fatigue=Math.max(fatigue,Math.min(0,floor-F));
 // Отдых идёт всегда, но в неделе, где не хватает часов, на него их тоже меньше: каждые 3 ч нехватки — на четверть
 // медленнее, не медленнее чем вчетверо. Иначе 2 ч отдыха (−25 усталости раз в два месяца) гасили бы любую перегрузку.
 const restPace=Math.max(.25,1-sqF.missing/12);
 const tired=x.fatigue>75,planPace=Math.max(0,1-sq.f.plans)*(tired?.65:1);
 const r2=v=>+v.toFixed(2);
 st.month={tick:x.ticks,missing:r2(M),missingNoRest:r2(sqF.missing),free:r2(L.free),budget:r2(L.budget),need:r2(L.commitments+L.health+L.plans),
  f:Object.fromEntries(Object.entries(sq.f).map(([k,v])=>[k,+v.toFixed(3)])),taken:Object.fromEntries(Object.entries(sq.taken).map(([k,v])=>[k,r2(v)])),
  fb:Object.fromEntries(Object.entries(sq.fb).map(([k,v])=>[k,+v.toFixed(3)])),floors,
  unabsorbed:r2(sq.unabsorbed),paid:+paid.toFixed(1),fatigue:r2(fatigue),restPace:r2(restPace),custody:!!L.custody,tired,
  floor:r2(floor),F1:clamp(F+fatigue),short:!L.custody&&sqF.missing>=time276.shortMin};
 st.workStrain=+(st.workStrain*.8+.2*sq.f.work).toFixed(4);
 // short — неделя не сходится (без отдыха): здоровье при перегрузке считает strainMonth276, а не clock.js.
 // loss80 — сколько здоровья clock.js снимает за месяц при усталости выше 80 (strainLoss80_276).
 const loss80=strainLoss80_276(st.month.short);st.month.loss80=loss80;
 return {fatigue,pace:t=>taskPace276(t,planPace,L.custody,restPace),week:L,squeeze:sq,short:st.month.short,loss80};
}
function taskPace276(t,planPace,custody,restPace=1){
 if((t.wait276??-1)>s.clock.ticks)return 0;
 /* 276: календарные дела (calendarKinds68 в safeguards68.js: разрешения, переезд, продления) идут по календарю — прогресс
    им ставит calendarMonth68 (месяцев с подачи). Прибавка ещё и здесь закрывала разрешение на 3 мес. за 2 месяца. */
 if(typeof calendarKinds68!=='undefined'&&calendarKinds68.includes(t.kind)&&Number.isFinite(t.calendarStart68))return 0;
 if(t.kind==='rest')return restPace;
 if(!(t.hours>0)||time276.always.has(t.kind))return 1;
 return custody?0:planPace;
}
// Старые сохранения: дела, которые давно стояли из-за нулевого темпа, продолжаются по два в месяц — без залпа окон.
function thaw276(){
 const st=timeState276();if(st.thaw===1)return;st.thaw=1;
 const now=s.clock.ticks;
 const frozen=(s.clock.tasks||[]).filter(t=>t.kind!=='queuedAction'&&t.kind!=='business263'&&!['paused','cancelled','completed'].includes(t.state)&&
  Number.isFinite(t.startedAtTick)&&Number.isFinite(t.duration)&&t.duration<1e6&&t.progress<t.duration&&now-t.startedAtTick>t.duration+2)
  .sort((a,b)=>a.startedAtTick-b.startedAtTick);
 frozen.forEach((t,i)=>{if(i>=2)t.wait276=now+Math.floor(i/2);});
}
function monthNow276(){const m=s?.time276?.month;return m&&m.tick===s.clock.ticks?m:null;}
function monthAny276(){const m=s?.time276?.month;return m&&s.clock.ticks-m.tick<=1?m:null;}
function areaF276(k){const m=monthNow276()||monthAny276();if(m)return m.f[k]||0;const L=week276();return squeeze276(L).f[k]||0;}
// Темп клубов и рукописей (точечно в clubs19.js и creative27.js).
function planPace276(area,tiredFactor){
 const m=monthNow276();
 if(m?.custody)return 0;
 return Math.max(0,1-(m?m.f[area]||0:areaF276(area)))*((s.clock.fatigue||0)>75?tiredFactor:1);
}
// Учёба (точечно в trajectory16.js): темп и оценки — от доли часов, которых учёбе не досталось.
function studyPace276(t){
 const f=areaF276('study'),st=timeState276();
 if(st.studyTick!==s.clock.ticks){st.studyTick=s.clock.ticks;st.studyF=[(st.studyF?.[0]||0)+f,(st.studyF?.[1]||0)+1];}
 return (1-.75*f)*(t?.partTime276?.5:1);
}
// Оценки за квартал: +1 − 8·доля, но не ниже −4 (было −3 при любой перегрузке): учёба, которой не досталось ни часа,
// за два года опускает оценки с 60 до 30, а не до 10.
function studyGrade276(t){
 const st=timeState276(),[sum,n]=st.studyF||[0,0],f=n?sum/n:areaF276('study');
 st.studyF=[0,0];
 return Math.max(-4,Math.round((1-8*f)*10)/10);
}
// Своё дело: перегруженный владелец закрывает меньше смен — ровно на долю часов, которых этому делу не хватило
// (не ниже нижней границы bizFloor276).
function ownerFactor276(b){const m=monthAny276();if(!m)return 1;const f=m.fb&&b&&m.fb[b.id]!=null?m.fb[b.id]:m.fb?0:m.f.business||0;return Math.max(0,1-f);}
if(typeof bzPlan272==='function'){
 const planBase276=bzPlan272;time276.planBase=planBase276;
 bzPlan272=function(b,...rest){
  const p=planBase276.call(this,b,...rest);
  const k=s?ownerFactor276(b):1;
  if(p&&k<1&&p.present&&p.own>0){
   const own=p.own*k;
   p.main+=own-p.own;p.own=own;p.share*=k;p.squeeze276=+k.toFixed(3);
   p.covMain=Math.min(1,p.main/p.need);p.multMain=typeof bzMult272==='function'?bzMult272(p.covMain):p.covMain;
  }
  return p;
 };
}
// Риск сокращения растёт, когда работе долго не хватает часов.
if(typeof layoffRisk231==='function'){
 const layoffBase276=layoffRisk231;
 layoffRisk231=function(...args){const r=layoffBase276.apply(this,args);return r*(1+2*(s?.time276?.workStrain||0));};
}

// ---------- после месяца: работа, близкие, запись ----------
autonomousMonth=function(...args){
 if(alive276()){
  // Часы работы не сбрасываются на 40, когда меняется только название должности (everyday.js сбрасывал).
  const j=s.job;
  if(j&&s.hoursJob!==j.title&&Number.isFinite(j.hours28)&&Number.isFinite(s.workHours))s.hoursJob=j.title;
 }
 const out=timeBase276.autonomousMonth.apply(this,args);
 if(alive276())afterMonth276();
 return out;
};
// Отдых и перегрузка за месяц (решения владелицы, 276).
// 1. Пока неделя не сходится, отдых (и «вечер без планов», и всё прочее за месяц) снимает усталость только до границы
//    fatigueFloor276: выше того, что было после месячного прироста, она не поднимается — граница только не даёт упасть.
// 2. Пока неделя не сходится, здоровье понемногу уходит: тем больше, чем дольше это тянется, — в полную силу при высокой
//    усталости, а при меньшей — по доле нехватки (strainShare276): отдых смягчает перегрузку, но не отменяет её.
//    Запланированный отдых не считается нехваткой (m.short — по нехватке без отдыха); под стражей — ни того, ни другого.
//    Пока неделя не сходится, прежнее −1 в месяц при усталости выше 80 (clock.js) не действует — вместо него это правило.
function strainMonth276(m){
 const st=timeState276(),S=time276.strain;
 if(m.floor>0&&Number.isFinite(m.F1)){
  const lower=Math.min(m.F1,m.floor);
  if(s.clock.fatigue<lower-1e-9){m.floorHeld=+(lower-s.clock.fatigue).toFixed(2);s.clock.fatigue=lower;}
 }
 // Доля — по усталости в тот же момент, когда clock.js смотрит «выше 80» (после прироста месяца, до отдыха): иначе в месяц,
 // когда кончается отдых, неделя на полчаса сверх сил стоила бы меньше, чем неделя, которая сходится (вторая проверка).
 const F=Number.isFinite(m.F1)?m.F1:s.clock.fatigue||0,w=m.short?strainShare276(m.missingNoRest,F):0,top=strainTop276();
 const before=Math.min(top,st.strain||0);
 // Без нехватки счёт убывает; после gap месяцев подряд без неё следующая — новая перегрузка, с новой записью.
 if(!(w>0)){st.strain=Math.max(0,before-S.decay);st.strainCool=(st.strainCool||0)+1;if(st.strain===0||st.strainCool>=S.gap)st.strainEp=null;return;}
 st.strainCool=0;
 st.strain=+Math.min(top,before+w).toFixed(4);
 const pen=strainLoss276(st.strain)*w;
 s.health=clamp(s.health-pen);
 m.strainPen=+pen.toFixed(3);m.strainShare=+w.toFixed(3);
 // Одна запись в «Истории» на каждую долгую перегрузку: когда здоровье заметно начинает сдавать (потеря от note в месяц).
 const ep=st.strainEp??={start:s.clock.ticks};
 if(!ep.logged&&pen>=S.note-1e-9&&s.clock.ticks-(st.strainLog??-99)>=12){
  ep.logged=true;st.strainLog=s.clock.ticks;
  const P=monthParts276(m);
  log('Перегрузка сказывается на здоровье','Неделе не хватает около '+P.N+' ч'+restPart276(P,true)+(F>=S.fatigue?', а сил почти не осталось: здоровье':', и даже без сильной усталости здоровье')+' начинает сдавать. Облегчить неделю можно в «Нагрузке».','Здоровье');
 }
}
// Доля перегрузки за месяц: 1 при усталости от strain.fatigue, иначе нехватка / strain.hours, но не больше strain.soft:
// пока отдых держит усталость ниже 70, потеря здоровья при любой нехватке хоть немного меньше полной. Неделя сходится
// (нехватка меньше получаса) — 0.
function strainShare276(d,F){
 const S=time276.strain;
 if(!(Number.isFinite(d)&&d>=time276.shortMin))return 0;
 return F>=S.fatigue?1:Math.min(S.soft??1,d/S.hours);
}
// Нехватка месяца на экране (N — с отдыхом, Nn — без него), так же, как shortParts276 для недели.
function monthParts276(m){
 const a=Number.isFinite(m?.missing)?m.missing:0,b=Number.isFinite(m?.missingNoRest)?m.missingNoRest:a;
 const N=a>=time276.shortMin?Math.round(a):0,nn=b>=time276.shortMin?Math.round(b):0;
 return {N,Nn:Math.min(N,nn),R:Math.max(0,N-nn)};
}
// Сколько здоровья даёт отдых: в неделе с нехваткой d ч — 1 − d / strain.hours; и после долгой перегрузки, пока она
// помнится (счёт k месяцев, strainMonth276), — 1 − k / strainTop276(): сразу после многих лет перегрузки отдых снимает
// усталость, но здоровье возвращает не сразу, а с каждым спокойным месяцем всё больше (через strainTop276 месяцев — как
// обычно). Иначе месяцы, когда неделя ненадолго сошлась, с отдыхом в расписании почти отменяли перегрузку (27.11).
function restHealth276(){
 const m=monthNow276()||monthAny276(),d=m&&m.short?m.missingNoRest:0,k=s?.time276?.strain||0;
 const short=Number.isFinite(d)&&d>=time276.shortMin?Math.min(1,d/time276.strain.hours):0;
 return Math.max(0,1-Math.max(short,Math.min(1,k/strainTop276())));
}
finishTask=function(t,...args){
 const rest=t?.kind==='rest'&&alive276(),h0=rest?s.health:null;
 const out=timeBase276.finishTask.call(this,t,...args);
 if(rest&&Number.isFinite(h0)&&s.health>h0){const k=restHealth276();if(k<1){s.health=h0+(s.health-h0)*k;const m=monthNow276();if(m)m.restHealth=+k.toFixed(3);}}
 return out;
};
// Нехватка недели без запланированного отдыха — за этот месяц, а вне месяца (экран) — по неделе как она есть.
function shortNoRest276(){
 const m=monthNow276();if(m)return m.short?m.missingNoRest:0;
 const L=week276();return L.custody?0:squeeze276(L,null,{noRest:true}).missing;
}
// Восстановление здоровья ниже потолка (health259) при переутомлении идёт вдвое медленнее. Пока неделе не хватает
// часов, оно медленнее и при меньшей усталости — по той же доле нехватки (strainShare276): от strain.hours — тоже вдвое.
// Иначе «Восстановить силы» в расписании держит усталость ниже 70 и возвращает полную скорость восстановления —
// и перегрузка почти не сказывается (проверка баланса 27.11).
if(typeof healthBlockers259==='function'){
 const blockBase276=healthBlockers259;
 healthBlockers259=function(...args){
  const out=blockBase276.apply(this,args);
  try{
   if(alive276()&&!out.some(b=>b[0]==='переутомление')){
    const d=shortNoRest276();
    if(Number.isFinite(d)&&d>=time276.shortMin)out.push(['неделе не хватает часов',1-.5*Math.min(1,d/time276.strain.hours)]);
   }
  }catch(e){}
  return out;
 };
}
function strainLoss276(k){const S=time276.strain;return k>0?Math.min(S.max,S.base+S.grow*Math.max(0,k-1)/12):0;}
// Месяц, с которого потеря уже max: дальше счёт не растёт — после долгой перегрузки и нескольких спокойных лет
// новая начинается мягче, а не сразу с max.
function strainTop276(){const S=time276.strain;return S.grow>0&&S.max>S.base?Math.ceil(1+12*(S.max-S.base)/S.grow-1e-9):1;}
// Неделя сошлась, а усталость ещё выше 80: вместо прежнего −1 в месяц (clock.js) — столько, сколько стоил бы месяц
// перегрузки (strainLoss276), не больше max. Иначе облегчить неделю без отдыха стоило бы здоровья больше, чем оставить
// перегрузку. Пока неделя не сходится — 0: здоровье считает strainMonth276.
// 276: решение владелицы 28.11 — и без перегрузки до этого (счёт 0) это −0,3, как первый месяц перегрузки, а не −1;
// прежнее −1 больше не действует нигде.
function strainLoss80_276(short){if(short)return 0;const k=timeState276().strain||0;return strainLoss276(Math.max(1,k));}
// Потеря за последний месяц — когда она уже заметна (от strain.note), для «Ожидают ответа».
function strainNow276(){const m=monthAny276();return m&&m.strainPen>=time276.strain.note-1e-9?m.strainPen:0;}
function afterMonth276(){
 const st=timeState276(),m=monthNow276();
 if(!m||st.applied===m.tick)return;
 st.applied=m.tick;
 strainMonth276(m);
 const f=m.f;
 // Работа: результаты понемногу падают, когда ей не хватает часов или вы работаете сверх сил.
 if(s.job&&typeof company18==='function'){
  const c=company18();
  if(c&&c.lastMonth===s.clock.ticks){
   const drop=3*(f.work||0)+(m.paid>45?Math.min(.4,.02*(m.paid-45)):0);
   if(drop>0)c.performance=clamp(c.performance-drop);
  }
 }
 // Близкие: меньше времени — меньше тепла.
 const fam=f.family||0;
 if(fam>0){
  const p=currentPartner();
  if(p)rel(p,{affection:-2*fam,strain:2*fam});
  if(typeof children54==='function')for(const c of children54())if(!c.city18||c.city18===residenceCity())rel(c,{affection:-2*fam});
  for(const pet of (s.pets||[]).filter(x=>x.alive&&(typeof petAtHome183!=='function'||petAtHome183(x))))pet.bond=clamp((pet.bond||0)-fam);
 }
 if(m.paid>45){const p=currentPartner();if(p)rel(p,{strain:Math.min(1,.04*(m.paid-45))});}
 // Настроение: как раньше в life23 (−перебор/5, не больше 4 в месяц); запланированный отдых настроения не портит.
 const moodMiss=m.missingNoRest??m.missing;
 if(moodMiss>=time276.shortMin)s.mood=clamp(s.mood-Math.min(4,moodMiss/5));
 overloadNote276(m);
}
function overloadNote276(m){
 // «Неделя не помещается» — когда неделя не сходится и без запланированного отдыха (как для здоровья и усталости);
 // число — то же, что на панели (с отдыхом), и если часть его — отдых, это сказано.
 const st=timeState276(),now=s.clock.ticks,ep=st.episode,P=monthParts276(m),N=P.N,B=Math.round(m.budget);
 if(m.short&&N>=1){
  if(!ep||ep.end!=null&&now-ep.end>2){
   st.episode={start:now,months:1,end:null};
   const what=sufferText276({order:timeOrder276(),taken:m.taken,unabsorbed:m.unabsorbed,missing:m.missing});
   // Числа сходятся: нужно = сил + не хватает.
   log('Неделя не помещается','Нужно около '+(B+N)+' ч в неделю, а сил хватает на '+B+' ч. Не хватает '+N+' ч'+restPart276(P)+
    (what?': меньше времени остаётся '+what+'.':'.')+' Пересмотреть неделю можно в «Нагрузке».','Нагрузка',true);
  }else{
   ep.months++;ep.end=null;
   log('Неделя снова не сходится','Не хватает '+N+' ч'+restPart276(P)+'.','Нагрузка');
  }
 }else if(ep&&ep.end==null)ep.end=now;
}
if(typeof routine267!=='undefined')routine267['Неделя снова не сходится']='тяжёлые недели';

// ---------- что видно: свободно, сводка ----------
// Во время одной отрисовки неделя не меняется: панель, сводка и «Ожидают ответа» берут один и тот же расчёт.
let renderWeek276=null;
if(typeof render==='function'){
 const renderBase276=render;
 render=function(...args){time276.rendering=(time276.rendering||0)+1;try{return renderBase276.apply(this,args);}finally{if(--time276.rendering<=0){time276.rendering=0;renderWeek276=null;}}};
}
function weekView276(){
 if(!(time276.rendering>0))return week276();
 if(renderWeek276?.s!==s)renderWeek276={s,L:week276()};
 return renderWeek276.L;
}
// «Свободно для планов» = бюджет − обязательства − здоровье − планы, округлено до часа; меньше нуля — «не хватает N».
function freeText276(L){const P=shortParts276(L);return P.N>=1?'не хватает '+P.N+' ч/нед.'+restPart276(P,true):Math.max(0,Math.round(L.free))+' ч/нед.';}
function patchFree276(html){
 if(!alive276()||typeof html!=='string')return html;
 const L=weekView276(),biz=L.lines.filter(l=>l.area==='business').reduce((n,l)=>n+l.hours,0);
 return html
  .replace(/Свободно для планов: -?\d+ ч\/нед\./g,'Свободно для планов: '+freeText276(L))
  .replace(/Доступно для планов: -?\d+ ч\/нед\./g,'Свободно для планов: '+freeText276(L))
  .replace(/Свободно примерно -?\d+ ч\/нед\./g,'Свободно для планов: '+freeText276(L))
  .replace(/(Работа -?[\d.]+ · учёба -?[\d.]+ · дорога -?[\d.]+)( ч\/нед\.)/g,(a,head,tail)=>head+(biz?' · своё дело '+Math.round(biz):'')+tail);
}
activitiesView=function(...args){return patchFree276(timeBase276.activitiesView.apply(this,args));};
schedulePanel59=function(...args){return patchFree276(timeBase276.schedulePanel59.apply(this,args));};
healthNotices58=function(...args){
 const items=timeBase276.healthNotices58.apply(this,args);
 if(!alive276())return items;
 // Пункт о нехватке — когда неделя не сходится и без отдыха (иначе отвечать не на что: не хватает только часов отдыха).
 const L=weekView276(),P=shortParts276(L),miss=P.Nn>=1?P.N:0,fatigue=Math.round(s.clock.fatigue||0);
 const i=items.findIndex(x=>x.ref?.id==='fatigue');
 const item={ref:{kind:'health58',id:'fatigue'},q:{id:'fatigue'},title:'Усталость · '+fatigue+'/100',note:miss>=1?'Неделе не хватает '+miss+' ч'+restPart276(P)+' · '+(strainNow276()>0?'здоровье сдаёт':'пересмотреть нагрузку'):'Отдых и восстановление'};
 if(miss>=1||fatigue>=40){if(i>=0)items[i]=item;else items.splice(Math.min(items.length,s.illness?1:0),0,item);}
 else if(i>=0)items.splice(i,1);
 return items;
};
// «Самочувствие»: граница усталости и здоровье при долгой перегрузке — по неделе как она есть сейчас.
if(typeof healthNotes259==='function'){
 const notesBase276=healthNotes259;
 healthNotes259=function(...args){
  const lines=notesBase276.apply(this,args);
  try{
   if(!alive276())return lines;
   const L=week276(),d=L.custody?0:squeeze276(L,null,{noRest:true}).missing,floor=fatigueFloor276(d),S=time276.strain,F=s.clock.fatigue||0;
   // Отдых при нехватке от четверти strain.hours заметно меньше прибавляет здоровью (restHealth276) — об этом тоже.
   // Число нехватки — то же, что на панели (с отдыхом); граница отдыха и здоровье — по нехватке без него.
   const P=shortParts276(L);
   if(floor>0)lines.push('Пока неделе не хватает '+P.N+' ч'+restPart276(P)+', отдых снимает усталость только до '+Math.round(floor)+(d>=S.hours/4?' и меньше прибавляет здоровью':'')+'.');
   // Что будет в следующем месяце, если неделя останется такой: доля перегрузки и счёт месяцев (strainMonth276).
   const w=strainShare276(d,F),k=Math.min(strainTop276(),(timeState276().strain||0)+w),pen=strainLoss276(k)*w;
   if(!(d>=time276.shortMin)&&restHealth276()<.75)lines.push('После долгой перегрузки отдых пока меньше прибавляет здоровью: с каждым спокойным месяцем — больше.');
   if(w>0&&pen>=S.note-1e-9)lines.push((F>=S.fatigue?'Неделя не сходится, а усталость высокая':'Неделя не сходится')+': здоровье теряет около '+String(Math.max(.1,Math.round(pen*10)/10)).replace('.',',')+' в месяц'+(k<strainTop276()?', и чем дольше так, тем больше.':'.'));
  }catch(e){}
  return lines;
 };
}

// ---------- облегчить неделю ----------
function jobFull276(){return s.job?.fullHours28||40;}
function workRoad276(h){
 if(!s.job)return 0;
 const v={...s.job,country:s.job.workplace?.country??s.country,city:s.job.workplace?.city??residenceCity(),area:s.job.workplace?.area??s.housing?.area};
 const raw=s.job.format?commuteFor16(v):(typeof commuteMinutes==='function'?commuteMinutes():0);
 return raw*10/60*Math.min(1,h/40);
}
function setWorkHours276(h){
 const job=s.job;if(!job)return false;
 const cur=s.workHours||jobFull276(),full=jobFull276();
 if(h===cur)return false;
 job.salary*=h/cur;
 s.workHours=job.hours28=h;job.fraction28=h/full;s.hoursJob=job.title;
 log('Новая рабочая неделя',h+' ч в неделю. Доход '+money(job.salary)+' в год.','Работа');
 save();return true;
}
function formatAsk276(){const f=s.time276?.format;return f&&s.clock.ticks-f.tick<12&&f.job===s.job?.title?f:null;}
function canAskFormat276(target){
 const j=s.job,p=j&&typeof profession16==='function'?profession16(j.professionId):null;
 return !!j&&!!p?.remote&&j.format!=='remote'&&!(target==='hybrid'&&j.format==='hybrid');
}
function askFormat276(target){
 const j=s.job;if(!canAskFormat276(target)||formatAsk276())return false;
 const st=timeState276(),c=typeof company18==='function'?company18():null,perf=c?.performance??60;
 const chance0=(target==='hybrid'?.7:.45)+(perf-60)/200+Math.min(.1,(j.tenure||0)*.02);
 const yes=Math.random()<Math.max(.1,Math.min(.9,chance0));
 st.format={tick:s.clock.ticks,job:j.title,target,yes};
 if(yes){
  const before=hours276(workRoad276(s.workHours||40));
  j.format=target;
  log(target==='remote'?'Работа из дома':'Два дня в офисе','Руководитель соглашается: '+(target==='remote'?'теперь вы работаете из дома, дорога больше не нужна.':'часть недели вы работаете из дома. Дорога занимает '+hours276(workRoad276(s.workHours||40))+' в неделю вместо '+before+'.'),'Работа');
 }else log('Пока без изменений','Руководитель просит остаться в прежнем формате: '+(perf<55?'«Сначала давайте подтянем результаты».':'«Команде нужно, чтобы вы были рядом. Вернёмся к этому через год».'),'Работа');
 save();return yes;
}
function setPartTime276(on){
 const t=path16().study;if(!t||t.status==='paused')return false;
 t.partTime276=!!on;
 log(on?'Учёба заочно':'Снова очно',on?'Вы переходите на заочную форму: лекции по вечерам и сессии. Учиться дольше, зато платёж за месяц меньше.':'Вы возвращаетесь на очную форму: снова каждый день на занятиях.','Учёба');
 save();return true;
}
function pauseClubs276(){
 let n=0;for(const m of clubState19().memberships.filter(m=>m.status==='active'&&clubLocal19(m))){changeClub19(m.id,'paused');n++;}
 return n;
}
function pausablePlans276(){return (s.clock.tasks||[]).filter(t=>!['paused','cancelled','completed'].includes(t.state)&&t.hours>0&&t.kind!=='rest'&&t.kind!=='queuedAction'&&t.kind!=='business263'&&!time276.always.has(t.kind));}
function pausePlans276(){const list=pausablePlans276();for(const t of list)t.state='paused';if(list.length){log('Планы на паузе',list.map(t=>t.label).slice(0,4).join(', ')+(list.length>4?' и ещё '+(list.length-4):'')+'. Продолжить можно в списке планов.','Расписание');save();}return list.length;}
// Варианты облегчить неделю. gate — только то, что срабатывает сразу (для окна «Неделя не сходится»).
// Сколько часов освободит изменение — по самой неделе (больной ребёнок, гибрид, оплата учёбы компанией и всё прочее,
// что считает schedule23): изменение применяется на время расчёта и сразу откатывается.
function freedBy276(L,change){
 let undo=null;
 try{undo=change();return Math.max(0,week276().free-L.free);}catch(e){return 0;}finally{try{if(undo)undo();}catch(e){}}
}
function tempSet276(o,vals){const old={};for(const k in vals){old[k]=Object.hasOwn(o,k)?{v:o[k]}:null;o[k]=vals[k];}return ()=>{for(const k in old){if(old[k])o[k]=old[k].v;else delete o[k];}};}
// Академический отпуск из окна «Неделя не сходится»: то же, что «Подтвердить отпуск» в pauseConfirm29, без второго
// окна, — и назад к пересчитанному окну.
function leaveStudy276(back){
 const showBase=show;let picked=null;
 show=function(title,text,opts=[],...rest){show=showBase;picked=(opts||[]).find(o=>/^Подтвердить отпуск/.test(o.label||''));if(!picked)return showBase.call(this,title,text,opts,...rest);};
 try{pauseConfirm29();}finally{show=showBase;}
 if(picked){picked.fn();back();}
}
function lightenOptions276(L,back,gate=false,skip={}){
 const out=[],q=L.lines;
 const workLine=q.find(l=>l.key==='work');
 if(s.job&&workLine&&s.age>=16&&!skip.work){
  const cur=s.workHours||jobFull276(),full=jobFull276(),limit=typeof workLimit28==='function'?workLimit28(s.country):80;
  for(const fr of [.75,.5]){
   const h=Math.round(full*fr);if(h>=cur)continue;
   const freed=freedBy276(L,()=>{const a=tempSet276(s,{workHours:h}),b=tempSet276(s.job,{hours28:h,fraction28:h/full});return ()=>{b();a();};}),lost=s.job.salary*(1-h/cur)/12;
   out.push({label:'Работа: '+h+' ч/нед. ('+Math.round(fr*100)+'% ставки)',hint:'освободит '+hours276(freed)+' · доход меньше на '+money(lost)+' в месяц',fn:()=>{setWorkHours276(h);back();}});
  }
  if(!gate)out.push({label:'Работа: выбрать часы',hint:'сейчас '+cur+' ч/нед.'+(limit<80?' · лимит '+Math.floor(limit)+' ч':''),fn:hoursMenu});
  const asked=formatAsk276();
  for(const target of ['hybrid','remote']){
   if(!canAskFormat276(target))continue;
   const shorter=freedBy276(L,()=>tempSet276(s.job,{format:target}));
   out.push({label:target==='hybrid'?'Попросить гибрид':'Попросить удалёнку',disabled:!!asked,
    hint:asked?'Руководитель уже отвечал · снова — через '+Math.max(1,12-(s.clock.ticks-asked.tick))+' мес.':'дорога короче примерно на '+hours276(shorter)+' · ответ сразу',
    fn:()=>{askFormat276(target);back();}});
  }
 }
 const t=typeof path16==='function'?path16().study:null,studyLine=q.find(l=>l.key==='study');
 if(t&&t.status!=='paused'&&studyLine&&typeof prog16==='function'&&prog16(t.program)){
  if(!t.partTime276)out.push({label:'Учёба: перейти на заочное',hint:'освободит '+hours276(freedBy276(L,()=>tempSet276(t,{partTime276:true})))+' · учиться вдвое дольше, платёж за месяц вдвое меньше',fn:()=>{setPartTime276(true);back();}});
  const foreign=!(s.citizenships||[]).includes(prog16(t.program).country);
  out.push({label:'Учёба: академический отпуск',hint:'освободит '+hours276(freedBy276(L,()=>tempSet276(t,{status:'paused'})))+' · пройденное сохранится'+(gate&&foreign?' · право на учёбу в стране пересмотрят':''),fn:gate?()=>leaveStudy276(back):pauseConfirm29});
  if(t.partTime276&&!gate)out.push({label:'Учёба: снова очно',hint:'+'+hours276(studyLine.hours)+' в неделю · учиться быстрее',
   fn:()=>{if(gate276({label:'Учёба · снова очно',hours:studyLine.hours,area:'study',go:()=>setPartTime276(false),back:loadMenu29}))setPartTime276(false);back();}});
 }
 for(const l of q.filter(l=>l.area==='business')){
  const b=bizList276().find(b=>b.id===l.businessId);if(!b||skip.business===b.id)continue;
  for(const mode of ['partial','manager']){
   if(time276.units[mode]>=time276.units[l.mode])continue;
   const freed=bizTotal276()-bizTotal276({id:b.id,mode}),m=business263.modes[mode];
   out.push({label:'«'+b.title+'»: '+m.name.toLowerCase(),hint:'освободит '+hours276(freed)+(mode==='manager'?' · оклад управляющему '+money(Math.round(businessW263(b)*1.3)*fxRate86(b.country))+'/мес.':' · меньше заказов'),
    fn:()=>{setBusinessMode263(b.id,mode);back();}});
  }
  if(!gate)out.push({label:'«'+b.title+'»: как вести дело',hint:business263.modes[l.mode]?.name||'',fn:()=>businessModeMenu263(b)});
 }
 const clubs=q.filter(l=>l.area==='clubs');
 if(clubs.length)out.push({label:'Клубы: поставить на паузу',hint:'освободит '+hours276(clubs.reduce((n,l)=>n+l.hours,0)),fn:()=>{pauseClubs276();back();}});
 const plans=pausablePlans276();
 if(plans.length)out.push({label:'Планы: поставить на паузу',hint:'освободит '+hours276(plans.reduce((n,t)=>n+t.hours,0))+' · продолжить можно позже',fn:()=>{pausePlans276();back();}});
 if(!gate){
  if(q.some(l=>l.key.startsWith('book:')))out.push({label:'Рукописи: отложить',fn:booksMenu27});
  if(q.some(l=>l.key==='children'||l.key==='childTransport'))out.push({label:'Дети: няня и помощь',fn:childcareMenu54});
  if(q.some(l=>l.key==='elder'))out.push({label:'Уход за близкими: помощник',fn:generationsMenu58});
  if(q.some(l=>l.key==='pets'))out.push({label:'Питомцы: уход и передержка',fn:petMenu});
  if(q.some(l=>l.key==='chores'))out.push({label:'Домашние дела',fn:householdMenu54});
 }
 return out;
}

// ---------- «Нагрузка»: вся неделя ----------
function weekSections276(L){
 const row=l=>{const r=fact20(l.label,hours276(l.hours));if(l.lighten)r.help=l.lighten;return r;};
 const com=L.lines.filter(l=>l.kind==='commitment'),hl=L.lines.filter(l=>l.kind==='health'),pl=L.lines.filter(l=>l.kind==='plan');
 const out=[section20('Неделя',[fact20('Сил на неделю',hours276(L.budget)),fact20('Обязательства',hours276(L.commitments)),
  ...(L.health?[fact20('Здоровье и усталость',hours276(L.health))]:[]),fact20('Планы',hours276(L.plans)),
  fact20('Свободно для планов',freeText276(L)),fact20('Усталость',Math.round(s.clock.fatigue)+'/100')])];
 if(com.length)out.push(section20('Обязательства',com.map(row)));
 if(hl.length)out.push(section20('Здоровье',hl.map(row)));
 if(pl.length)out.push(section20('Планы',pl.map(row)));
 return out;
}
loadMenu29=function(){
 if(!alive276())return timeBase276.loadMenu29();
 const L=week276(),order=timeOrder276();
 const sections=weekSections276(L);
 sections[0].rows.push(fact20('Чем жертвовать первым',order.map(k=>time276.names[k]).join(' → ')));
 const P=shortParts276(L),N=P.N,what=N>=1?sufferText276(squeeze276(L)):'';
 if(N>=1)sections[0].note='Неделе не хватает '+N+' ч'+restPart276(P)+': '+(what?'меньше времени остаётся '+what+'.':P.Nn>=1?'усталость растёт.':'отдых занимает часы планов.');
 nextDetail20={sections};
 show('Нагрузка и восстановление','',[...lightenOptions276(L,loadMenu29),
  {label:'Чем жертвовать первым',hint:order.map(k=>time276.names[k]).join(' → '),fn:priorityMenu276},
  {label:'Запланировать отдых',hint:'2 ч/нед. · усталость −25',fn:()=>assign('rest')},
  {label:'Здоровье и помощь',fn:healthMenu}]);
};
function priorityMenu276(){
 const order=timeOrder276();
 show('Чем жертвовать первым','Когда неделя не сходится, часы уходят сначала отсюда, потом дальше по списку. Сейчас: '+order.map(k=>time276.names[k]).join(' → ')+'.',[
  ...order.slice(1).map(k=>({label:'Сначала — '+time276.names[k],hint:time276.what[k],fn:()=>{const st=timeState276();st.order=[k,...order.filter(x=>x!==k)];save();priorityMenu276();}})),
  {label:'Как было: '+time276.order.map(k=>time276.names[k]).join(' → '),disabled:order.join()===time276.order.join(),fn:()=>{timeState276().order=null;save();priorityMenu276();}},
  {label:'Назад',fn:loadMenu29}]);
}

// ---------- окно «Неделя не сходится» ----------
function player276(){
 if(time276.auto>0||time276.force>0||!alive276())return false;
 const limit=Error.stackTraceLimit;Error.stackTraceLimit=60;
 let st='';try{st=String(new Error().stack||'');}finally{Error.stackTraceLimit=limit;}
 return !/continue\w*274|transformLife274|startContinue\w*274|respondChild55|catalogChoice24\d|commit246|choice249|workshop\w*249|friends\w*247/.test(st);
}
function forceRun276(fn){time276.force++;try{return fn();}finally{time276.force--;}}
capacity=function(...args){const c=timeBase276.capacity.apply(this,args);return time276.force>0?c+1000:c;};
toast=function(...args){if(time276.swallow)return;return timeBase276.toast.apply(this,args);};
// Окно считает так же, как панель: «Уже занято» — бюджет минус «Свободно для планов» сейчас (или плюс «не хватает»),
// «Не хватит» — ровно то, что панель покажет после того, как вы возьмёте новое; неделя сходится — если после него
// не хватает меньше получаса (time276.shortMin), как и везде.
function gateNumbers276(L,item){
 const B=Math.round(L.budget),I=Math.round(item.hours),after=item.hours-L.free,N=shortH276(L);
 const used=N>=1?B+N:B-Math.max(0,Math.round(L.free)),fits=after<time276.shortMin,miss=fits?0:Math.round(after);
 // Если часть того, чего не хватит, — запланированный отдых, это сказано, как на панели.
 const nr=after-rest276(L),nn=nr>=time276.shortMin?Math.min(miss,Math.round(nr)):0;
 return {B,I,used,after,fits,miss,left:Math.max(0,Math.round(-after)),parts:{N:miss,Nn:nn,R:miss-nn}};
}
// item: {label, hours, area, go, back?, blocked?}. true — можно сразу; false — откроется окно выбора.
// blocked() — действие всё равно не состоится (нет права, денег, не тот город…): окна нет, своё объяснение даст само действие.
function gate276(item){
 if(!item||!(item.hours>0)||!player276())return true;
 try{if(item.blocked&&item.blocked())return true;}catch(e){}
 const L=week276();
 if(gateNumbers276(L,item).fits)return true;
 time276.swallow=true;
 setTimeout(()=>{time276.swallow=false;openGate276(item);},0);
 return false;
}
function openGate276(item){
 if(!alive276())return;
 const L=week276(),g=gateNumbers276(L,item),fits=g.fits,sq=squeeze276(L,{hours:item.hours,area:item.area});
 const com=L.lines.filter(l=>l.kind==='commitment');
 const go=()=>{forceRun276(item.go);if(item.after)item.after();save();render();};
 const back=()=>openGate276(item);
 const sections=[section20('Что добавляется',[fact20(item.label,'+'+g.I+' ч в неделю')]),
  section20('Неделя',[fact20('Сил на неделю',g.B+' ч'),fact20('Уже занято',g.used+' ч'),
   fits?fact20('Свободно останется',g.left+' ч'):fact20('Не хватит',g.miss+' ч'+restPart276(g.parts))])];
 if(com.length)sections.push(section20('Ваши обязательства',com.map(l=>fact20(l.label,hours276(l.hours)))));
 nextDetail20={sections};
 const what=fits?'':sufferText276({...sq,missing:g.miss}),hurt=sq.order.filter(k=>sq.taken[k]>=.5).map(k=>time276.what[k]);
 if(sq.unabsorbed>=.5)hurt.push(time276.what.sleep);
 show(fits?'Теперь неделя сходится':'Неделя не сходится','',[
  ...(fits?[{label:'Взять',hint:item.label,fn:go}]:[]),
  ...(fits?[]:lightenOptions276(L,back,true,item.skip||{})),
  ...(fits?[]:[{label:'Взять всё равно',hint:'Не хватит '+g.miss+' ч'+restPart276(g.parts)+(what?': меньше времени '+what:'')+'. '+[...hurt,'усталость будет расти'].join(', ').replace(/^./,c=>c.toUpperCase())+'.',fn:go}]),
  {label:'Отказаться',fn:()=>{if(item.back)item.back();}}]);
}
// Автоматические процессы окна не вызывают.
function autoRun276(base){return function(...args){time276.auto++;try{return base.apply(this,args);}finally{time276.auto--;}};}
advanceMonth=autoRun276(timeBase276.advanceMonth);
rollYear=autoRun276(timeBase276.rollYear);
start=autoRun276(timeBase276.start);
for(const name of ['importLives','continueAs274'])if(typeof window[name]==='function'){const b=window[name];window[name]=autoRun276(b);}
// Загруженная жизнь: дело «своё дело» из расписания убирается сразу, не через месяц.
if(typeof loadCharacter==='function'){const b=autoRun276(loadCharacter);loadCharacter=function(...args){const out=b.apply(this,args);if(s?.clock)migrateBusiness276();return out;};}

// ---------- входы: новое обязательство по вашему решению ----------
function workHoursNow276(L){return L.lines.filter(l=>l.key==='work').reduce((n,l)=>n+l.hours,0);}
// Проверки самих действий — те же, что в trajectory16 / employment28 / rights31 / language-stays53 / family54 и
// enterprise152. Если действие всё равно не состоится, окно «Неделя не сходится» не открывается: иначе можно урезать
// ставку или перейти на заочное, а потом получить отказ. При ошибке проверки — как раньше, с окном.
function jobBlocked276(id){
 const x=path16(),a=x.jobApplications.find(a=>a.id===id),v=a?.vacancy;
 if(!a||a.status!=='accepted'||!v)return true;
 if(typeof parentalLeave54==='function'&&parentalLeave54('player'))return true;
 if(typeof stayBusy53==='function'&&stayBusy53())return true;
 if(typeof workCheck28==='function'&&workCheck28(v).length)return true;
 if(jobEligibility16(v).why.length)return true;
 if(v.country!==s.country)return true;
 const r=typeof rights31==='function'?rights31(v.country,v):null;
 if(r?!(r.reside&&(v.hours28??40)<=r.hours):!permission16(s.country,'work'))return true;
 if(['city','abroad'].includes(v.format)&&v.city!==residenceCity())return true;
 return false;
}
function studyBlocked276(id,payer='self'){
 const x=path16(),a=x.applications.find(a=>a.id===id),p=a&&prog16(a.program);
 if(!a||!p||a.status!=='accepted'||x.study||s.studyTrack||s.study)return true;
 if(typeof stayBusy53==='function'&&stayBusy53())return true;
 if(s.country!==p.country||residenceCity()!==p.city||!permission16(p.country,'study'))return true;
 payer=String(payer||'self');
 const loan=['loan','familyloan','employerloan'].includes(payer),sponsored=payer.startsWith('employer');
 if(s.age<18&&payer.includes('loan'))return true;
 if(admission16(p).why.length)return true;
 if(sponsored&&!sponsor22(p.id))return true;
 const fee=tuition16(p,a),quote=sponsored?sponsorQuote22(p,a,payer):null,help=quote?quote.company+quote.family:['family','familyloan'].includes(payer)?tuitionHelp(fee,a.funding17):0;
 if(sponsored&&quote.company+1e-6<Math.min(fee*quote.grant.share,localAmount16(quote.grant.cap,quote.grant.country)))return true;
 if(s.age>=18&&['family','familyloan'].includes(payer)&&fee>0&&help<=0)return true;
 if(loan&&activeDebts().some(d=>d.student))return true;
 if(!loan&&expenseAvailable231()+1e-6<(s.age<18?fee:fee-help))return true;
 return false;
}
function bizBlocked276(type,name,specialty=null,additional=false,schoolTrack=null){
 if(!Object.hasOwn(enterpriseTypes152,type)||enterpriseBlock152()||(s.enterprise152?.status==='active'&&!additional))return true;
 if(specialty!==null&&!Object.hasOwn(enterpriseSpecialties153[type],specialty))return true;
 if(typeof enterpriseAvailable253==='function'&&!enterpriseAvailable253(specialty))return true;
 if(specialty==='school196'&&(!schoolTrack||typeof schoolBlock196!=='function'||schoolBlock196(schoolTrack)))return true;
 const title=String(name||'').trim(),{fee,reserve}=enterpriseQuote152(type,specialty);
 return !title||title.length>60||s.cash<fee+reserve;
}
startJob16=function(id,...args){
 const a=path16().jobApplications.find(a=>a.id===id),v=a?.vacancy;
 if(a?.status==='accepted'&&v){
  const h=v.hours28??40,road=(commuteFor16(v)||0)*10/60*Math.min(1,h/40),L=week276();
  const add=h+road-workHoursNow276(L);
  if(!gate276({label:'Работа · '+cleanTitle276(v.title)+' · '+h+' ч',hours:add,area:'work',skip:{work:true},blocked:()=>jobBlocked276(id),go:()=>startJob16(id,...args)}))return false;
 }
 return timeBase276.startJob16.call(this,id,...args);
};
studyStart16=function(id,...args){
 const a=path16().applications.find(a=>a.id===id),p=a&&prog16(a.program),payer=String(args[0]||'self');
 if(p&&!path16().study&&!s.studyTrack&&!s.study){
  // Часы, которые оплачивает компания, неделя не считает (week276) — окно тоже.
  const grant=payer.startsWith('employer')&&typeof sponsor22==='function'?sponsor22(p.id):null;
  const hours=Math.max(0,studyHours276(p)-(grant?.studyHours||0));
  if(!gate276({label:'Учёба · '+(typeof programName26==='function'?programName26(p):p.id),hours,area:'study',blocked:()=>studyBlocked276(id,payer),go:()=>studyStart16(id,...args)}))return false;
 }
 return timeBase276.studyStart16.call(this,id,...args);
};
startEnterprise152=function(type,name,...args){
 const add=bizTotal276({add:'self',title:name})-bizTotal276(),mode=typeof business263!=='undefined'?business263.modes.self?.name||'сам':'сам';
 if(add>0&&!gate276({label:'Своё дело · '+(String(name||'').trim()||'новое')+' · '+String(mode).toLowerCase(),hours:add,area:'business',blocked:()=>bizBlocked276(type,name,...args),go:()=>startEnterprise152(type,name,...args)}))return false;
 return timeBase276.startEnterprise152.call(this,type,name,...args);
};
setBusinessMode263=function(id,mode,...args){
 const b=bizList276().find(b=>b.id===id);
 if(b&&mode!==bizMode276(b)&&typeof business263!=='undefined'&&business263.modes[mode]){
  const add=bizTotal276({id,mode})-bizTotal276();
  if(add>0&&!gate276({label:'«'+b.title+'»: '+business263.modes[mode].name.toLowerCase(),hours:add,area:'business',skip:{business:id},go:()=>setBusinessMode263(id,mode,...args),after:()=>{if(typeof enterpriseMenu152==='function'&&s.enterprise152?.id===id)enterpriseMenu152();}}))return false;
 }
 return timeBase276.setBusinessMode263.call(this,id,mode,...args);
};
// «Рабочая неделя»: больше часов — через ту же проверку.
hoursMenu=function(...args){
 const showBase=show,cur=s?.workHours||jobFull276();
 show=function(title,text,opts=[],...rest){
  show=showBase;
  opts=opts.map(o=>{
   const m=/^(\d+)\s*(ч\/нед\.|часов в неделю)/.exec(o.label||''),h=m?+m[1]:0;
   if(!h||h<=cur||o.disabled)return o;
   const fn=o.fn;
   return {...o,fn:()=>{const add=(h-cur)+(workRoad276(h)-workRoad276(cur));if(gate276({label:'Работа · '+h+' ч/нед.',hours:add,area:'work',skip:{work:true},go:fn}))fn();}};
  });
  return showBase.call(this,title,text,opts,...rest);
 };
 try{return timeBase276.hoursMenu.apply(this,args);}finally{show=showBase;}
};
// Клуб недоступен (вы в языковой поездке, не тот возраст) — окна нет, объяснит сам клуб.
function clubBlocked276(type){return typeof stayBusy53==='function'&&!!stayBusy53()||typeof clubAge23==='function'&&!clubAge23(type);}
joinClub19=function(type,...args){
 const cfg=typeof clubsCatalog19!=='undefined'?clubsCatalog19[type]:null;
 const has=cfg&&clubState19().memberships.some(m=>m.type===type&&clubLocal19(m)&&m.status!=='left');
 if(cfg&&!has&&!gate276({label:'Клуб · '+cfg.name,hours:cfg.hours||0,area:'clubs',blocked:()=>clubBlocked276(type),go:()=>joinClub19(type,...args)}))return false;
 return timeBase276.joinClub19.call(this,type,...args);
};
changeClub19=function(id,status,...args){
 const m=clubState19().memberships.find(m=>m.id===id);
 if(m&&status==='active'&&m.status!=='active'&&!gate276({label:'Клуб · '+(clubsCatalog19[m.type]?.name||m.type),hours:clubsCatalog19[m.type]?.hours||0,area:'clubs',blocked:()=>clubBlocked276(m.type),go:()=>changeClub19(id,status,...args)}))return false;
 return timeBase276.changeClub19.call(this,id,status,...args);
};
// Ухаживать самим нельзя (близкий в другом городе, вы в поездке) — окна нет, как и раньше, ничего не меняется.
function elderBlocked276(p){
 return s.age<18||typeof elderLocal58==='function'&&!elderLocal58(p)||typeof travelActive52==='function'&&travelActive52()?.status==='away'||typeof languageStayActive53==='function'&&!!languageStayActive53();
}
setElderCare58=function(id,mode,...args){
 const p=living(id);
 if(p&&mode==='self'){
  const a=updateAging58(p),now=a.care?.mode==='self'&&a.care.status==='active'?a.care.hours||0:0;
  if(a.need&&!gate276({label:'Уход за близким · '+p.name,hours:a.need-now,area:'family',blocked:()=>elderBlocked276(p),go:()=>setElderCare58(id,mode,...args)}))return false;
 }
 return timeBase276.setElderCare58.call(this,id,mode,...args);
};
if(typeof requestPet38==='function'){
 const petBase276=requestPet38,reasonBase276=petReason38;
 const timeWhy276='Нужно освободить время для ежедневного ухода';
 // Нехватка часов больше не прячет кнопку: о ней скажет окно «Неделя не сходится».
 petReason38=function(...args){
  const why=reasonBase276.apply(this,args);
  // Остальные причины (деньги, места) остаются: проверяем их без учёта часов.
  return why===timeWhy276&&s&&player276()?forceRun276(()=>reasonBase276.apply(this,args)):why;
 };
 requestPet38=function(kind,...args){
  const h=petKinds[kind]?.hours||0;
  if(h&&!gate276({label:'Питомец · '+(petKinds[kind]?.label||kind),hours:h,area:'family',go:()=>requestPet38(kind,...args)}))return false;
  const out=petBase276.call(this,kind,...args);
  // Взятый «всё равно» питомец переезжает через месяц — там тоже не нужна проверка часов.
  if(out&&time276.force>0){const t=s.clock.tasks.filter(t=>t.kind==='queuedAction'&&t.action==='pet').at(-1);if(t)t.payload.force276=true;}
  return out;
 };
 if(typeof executeCommand05==='function'){
  const execBase276=executeCommand05;
  executeCommand05=function(t,...args){return t?.payload?.force276?forceRun276(()=>execBase276.call(this,t,...args)):execBase276.call(this,t,...args);};
 }
}
if(typeof planCourse195==='function'){
 const courseBase276=planCourse195;
 planCourse195=function(track,title,own,key,...args){
  const offer=courses195().contract,h=typeof courseTerms195==='function'&&(own||offer)?courseTerms195(own,offer)?.hours||0:0;
  if(h&&!gate276({label:'Курс · '+(String(title||'').trim()||(typeof trackNames46!=='undefined'?trackNames46[track]:'')||''),hours:h,area:'plans',go:()=>planCourse195(track,title,own,key,...args)}))return false;
  return courseBase276.call(this,track,title,own,key,...args);
 };
}
if(typeof planMentoring194==='function'){
 const mentorBase276=planMentoring194;
 planMentoring194=function(track,role,key,...args){
  const h=role==='class'?4:['learn','teach'].includes(role)?2:0;
  if(h&&!gate276({label:{learn:'Занятия с наставником',teach:'Наставничество',class:'Мастер-класс'}[role],hours:h,area:'plans',go:()=>planMentoring194(track,role,key,...args)}))return false;
  return mentorBase276.call(this,track,role,key,...args);
 };
}
// Подсказки обучения (learning272) про свободные часы — то же число, что «Свободно для планов».
if(typeof freeHours272==='function'){
 const freeBase276=freeHours272;
 freeHours272=function(...args){return alive276()?Math.round(week276().free):freeBase276.apply(this,args);};
}
if(typeof hoursWhy272==='function'){
 const whyBase276=hoursWhy272;
 hoursWhy272=function(...args){return s&&player276()?'':whyBase276.apply(this,args);};
}
if(typeof acceptCreative47==='function'){
 const creativeBase276=acceptCreative47;
 acceptCreative47=function(id,...args){
  const a=creative47().applications.find(a=>a.id===id);
  if(a?.status==='offered'&&a.offer?.hours>0&&!gate276({label:'Заказ · '+a.offer.title,hours:a.offer.hours,area:'plans',go:()=>acceptCreative47(id,...args)}))return false;
  return creativeBase276.call(this,id,...args);
 };
}

/* 276: окна 273.x (windows273.js: taskPace273, taskMonths273, taskLeft273, freeNeed273) считали сроки дел по прежнему
   темпу clock.js — min(1, capacity()/totalHours()), ×0,65 при усталости выше 75 — один на все дела. С 276 у каждого
   дела свой темп (taskPace276): отклики, собеседования, заявки, стипендии, переговоры и документы (time276.always) и дела
   на 0 ч идут при любой нагрузке, отдых при нехватке медленнее, прочие планы — по доле часов, что остаётся планам.
   Без этого окно вакансии при перегрузке писало «ответа не будет» и звало в «Нагрузку», а ответ приходил через месяц. */
function windowPace276(t){
 const L=week276(),sq=squeeze276(L),sqF=squeeze276(L,null,{noRest:true});
 const plan=Math.max(0,1-(sq.f.plans||0))*((s.clock.fatigue||0)>75?.65:1);
 return taskPace276({...t,wait276:undefined},plan,L.custody,Math.max(.25,1-sqF.missing/12));
}
if(typeof taskLeft273==='function'){
 taskLeft273=function(t){
  const p=windowPace276(t),left=Math.max(0,(t.duration||1)-(t.progress||0)),wait=Math.max(0,(t.wait276??-1)-s.clock.ticks-1);
  return p>0?wait+Math.max(1,Math.ceil(left/p-1e-9)):Infinity;
 };
 // Сроки ещё не поданных шагов (taskMonths273 с готовыми месяцами) и строка «Свободного времени — 0 ч» (freeNeed273)
 // во всех окнах 273.x — только у откликов и заявок: резюме и собеседование, приём, стипендия, разговор о прибавке,
 // оплата учёбы компанией. В 276 они идут при любой нагрузке.
 taskMonths273=function(left){return Math.max(1,Math.ceil((+left||0)-1e-9));};
 freeNeed273=function(){return null;};
}

if(s){migrateBusiness276();save();}
