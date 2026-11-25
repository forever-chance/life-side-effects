'use strict';
// Сборка 272, поездки: уход за питомцами одним выбором и «чего не хватает» наверху окна.
// 1. «Питомцы на время поездки»: «Всех с собой», «Всех к близкому» (человек выбирается один раз), «Ситтер для всех»,
//    «Всех в гостиницу», а если дома кто-то остаётся — «Всех оставить дома», на поездку в один день — «Всех дома на день».
//    Каждый питомец получает ровно тот же план, что и при выборе по одному (те же поля, что в journeyPetMenu57), поэтому
//    цена (journeyPetFee57), часы ухода (petHours) и оплата при отъезде не меняются. Исключения — по-прежнему по одному.
//    «Всех к близкому» — один разговор: одно решение на всех (один бросок вместо броска на каждого), а правило
//    requestPetHelper57 «один человек берёт не больше трёх животных» осталось; остальным сразу предлагается другой близкий
//    или платный уход.
// 2. Последний выбор запоминается (s.trips272) при бронировании и при подтверждении нового плана: в следующей поездке
//    каждому питомцу ставится его прошлый уход, новому питомцу — последний общий выбор. Близкий — тот же человек, но
//    согласие на новую поездку нужно заново (кнопка в блоке готовности). «Дома с домочадцами» не запоминается как
//    выбор: такой питомец снова получает уход по умолчанию (домочадцы, если кто-то остаётся, иначе гостиница).
//    Планы уже запланированных поездок не трогаются: память применяется только к новому черновику.
// 3. Наверху окна поездки (черновик, приглашение, «Дорога и уход», карточка запланированной поездки) — блок
//    «Чтобы поехать, не хватает»: те же причины, что игра проверяет сама (travelWhy52 → journeyWhy57, присмотр за детьми
//    и болезни из family270/homecare59, деньги, отпуск, визы; для запланированной поездки — travelDepartureWhy52),
//    каждая кнопкой к исправлению. Ничего не мешает — «Можно ехать». Раздел «Готовность» внизу с причинами убирается,
//    чтобы не повторяться.

const trips272Base={journeyDraft57,journeyPetsMenu57,bookTravel52,applyJourney57,travelDraftMenu52,travelInviteMenu53,
 journeyDraftMenu57,travelTripMenu52,requestPetHelper57};

function trips272(){return s.trips272??={version:1,pets:{},bulk:null};}

// ---------- общий выбор ----------

const tripModes272=['bring','relative','sitter','hotel','household','home'];
function tripModeName272(mode){return mode==='home'?'Дома на день':careNames57[mode]||'Уход не выбран';}
function tripPlan272(petId,mode,helper=null,agreement=null){
 // Тот же план, что ставит journeyPetMenu57 (set) и homecare59 («Оставить дома»).
 return mode==='household'?{pet:petId,mode,helper,agreement:null,auto59:true}:{pet:petId,mode,helper,agreement,manual62:true,auto59:false};
}
function tripFeeAll272(d,mode,ids=null){
 return livePets57().filter(p=>!ids||ids.includes(p.id)).reduce((n,p)=>n+journeyPetFee57(d,{pet:p.id,mode}),0);
}
function tripSetAll272(d,mode,helper=null,ids=null){
 d=journeyDraft57(d);
 const j=copyJourney57(d.journey57),live=livePets57(),only=ids?new Set(ids):null;
 const keep=new Map(j.pets.filter(q=>live.some(p=>p.id===q.pet)).map(q=>[q.pet,q]));
 j.pets=live.map(p=>!only||only.has(p.id)?tripPlan272(p.id,mode,helper):keep.get(p.id)||tripPlan272(p.id,d.days===1?'home':'hotel'));
 if(!only)j.bulk272={mode,helper};
 return {...d,journey57:j};
}
function tripSameAll272(d,mode,helper=null){
 const plans=d.journey57?.pets||[];
 return plans.length>1&&plans.every(q=>q.mode===mode&&(!helper||q.helper===helper));
}
function tripNames272(list){return list.map(p=>p.name).join(', ');}

function tripBulkOptions272(d,ids=null){
 const pets=livePets57().filter(p=>!ids||ids.includes(p.id)),n=pets.length,home=homeHelpers59(d)[0],helpers=petHelpers57(d);
 const all=!ids,mark=(mode,helper)=>all&&tripSameAll272(d,mode,helper)?'Выбрано · ':'';
 const fee=mode=>money(tripFeeAll272(d,mode,ids))+' за '+d.days+' дн.';
 const words=all?{bring:'Всех с собой',relative:'Всех к близкому',sitter:'Ситтер для всех',hotel:'Всех в гостиницу',household:'Всех оставить дома',home:'Всех дома на день'}
  :{bring:'Остальных с собой',relative:'Остальных к другому близкому',sitter:'Ситтер для остальных',hotel:'Остальных в гостиницу',household:'Остальных оставить дома',home:'Остальных дома на день'};
 const go=(mode,helper=null)=>journeyPetsMenu57(tripSetAll272(d,mode,helper,ids));
 return [
  ...(home?[{label:words.household+' · '+home.name,hint:mark('household',home.id)+'Обычный уход домочадцев · без отдельной платы',fn:()=>go('household',home.id)}]:[]),
  ...(d.days===1?[{label:words.home,hint:mark('home')+'Обычный уход',fn:()=>go('home')}]:[]),
  {label:words.bring,hint:mark('bring')+fee('bring'),fn:()=>go('bring')},
  {label:words.relative,hint:helpers.length?'Без оплаты'+(n>3?' · один человек возьмёт не больше трёх':' · нужен ответ'):'Сейчас некого попросить',disabled:!helpers.length,fn:()=>tripHelperMenu272(d,pets.map(p=>p.id))},
  {label:words.sitter,hint:mark('sitter')+fee('sitter'),fn:()=>go('sitter')},
  {label:words.hotel,hint:mark('hotel')+fee('hotel'),fn:()=>go('hotel')}
 ];
}

function tripPetHint272(d,plan){
 if(!plan)return 'Уход не выбран';
 const who=['relative','household'].includes(plan.mode)?living(plan.helper)?.name:'',fee=journeyPetFee57(d,plan);
 return tripModeName272(plan.mode)+(who?' · '+who:'')+(fee?' · '+money(fee):'');
}

journeyPetsMenu57=function(d,...rest){
 d=tripAddMissing272(journeyDraft57(d));
 const pets=livePets57();
 const old=show;
 show=function(title,text,opts=[],...more){
  const own=opts.length===pets.length+1;
  const rows=own?opts.map((o,i)=>i<pets.length?{...o,hint:tripPetHint272(d,d.journey57.pets.find(q=>q.pet===pets[i].id))}:o):opts;
  if(pets.length<2)return old(title,text,rows,...more);
  return old(title,'Можно выбрать уход сразу для всех, а потом поменять его кому-то одному. Пропавшие животные остаются в отдельном поиске.',[...tripBulkOptions272(d),...rows],...more);
 };
 try{return trips272Base.journeyPetsMenu57(d,...rest);}finally{show=old;}
};

// «Всех к близкому»: один человек на всех выбранных питомцев.
function tripHelperMenu272(d,ids){
 d=journeyDraft57(d);
 const pets=livePets57().filter(p=>ids.includes(p.id)),z=journeys57();
 const helpers=petHelpers57(d).slice().sort((a,b)=>(b.inner?.trust||0)-(a.inner?.trust||0));
 show('Кого попросить','Присмотреть нужно: '+tripNames272(pets)+'. Спросите одного человека сразу обо всех — больше трёх животных никто не возьмёт. Отказ отношений не портит.',[
  ...helpers.map(h=>{
   const said=pets.map(p=>[p,z.agreements.find(q=>q.key===d.journey57.id+':'+p.id+':'+h.id)]).filter(([,q])=>q);
   const yes=said.filter(([,q])=>q.status==='agreed').map(([p])=>p),no=said.filter(([,q])=>q.status==='refused').map(([p])=>p);
   const hint=[h.role,yes.length?'Уже договорились: '+tripNames272(yes):'',no.length===pets.length?'Сейчас не может':''].filter(Boolean).join(' · ');
   return {label:h.name,hint,disabled:no.length===pets.length,fn:()=>tripAskAll272(d,h.id,ids)};
  }),
  {label:'Вернуться к питомцам',fn:()=>journeyPetsMenu57(d)}
 ],{title:'Питомцы на время поездки',open:()=>journeyPetsMenu57(d)});
}

function tripAskAll272(d,personId,ids){
 d=journeyDraft57(d);
 const h=living(personId),pets=livePets57().filter(p=>ids.includes(p.id));
 if(!h||!pets.length)return journeyPetsMenu57(d);
 // Один разговор — одно решение: каждый питомец получает ту же запись согласия, что и при просьбе по одному
 // (requestPetHelper57), но с общим броском. Отдельные записи в истории заменяет одна общая.
 const roll=Math.random(),realLog=log,realRandom=Math.random,answers=[];
 log=function(){};Math.random=()=>roll;
 try{for(const p of pets)answers.push([p,requestPetHelper57(d,p.id,h.id)]);}
 finally{log=realLog;Math.random=realRandom;}
 const j=copyJourney57(d.journey57);
 for(const [p,q] of answers)if(q?.status==='agreed'){j.pets=j.pets.filter(x=>x.pet!==p.id);j.pets.push(tripPlan272(p.id,'relative',h.id,q.id));}
 j.pets.sort((a,b)=>livePets57().findIndex(p=>p.id===a.pet)-livePets57().findIndex(p=>p.id===b.pet));
 const yes=answers.filter(([,q])=>q?.status==='agreed').map(([p])=>p),no=answers.filter(([,q])=>q?.status!=='agreed').map(([p])=>p);
 const full=yes.length===livePets57().length;
 if(full)j.bulk272={mode:'relative',helper:h.id};
 const next={...d,journey57:j},f=h.gender==='f';
 if(yes.length)log(yes.length>1?'Договорились о питомцах':'Договорились о питомце',h.name+' '+(f?'согласна':'согласен')+' присмотреть на '+d.days+' дн.: '+tripNames272(yes)+'.'+(no.length?' Не получилось: '+tripNames272(no)+'.':''),'Животное');
 else log('С присмотром не договорились',h.name+' сейчас не может присмотреть: '+tripNames272(no)+'. Можно выбрать другого близкого или платный уход.','Животное');
 save();
 const cap=yes.length&&no.length&&yes.length+tripAgreedElse272(next,h.id,yes)>=3;
 const text=yes.length?(h.name+' '+(f?'согласна':'согласен')+' присмотреть: '+tripNames272(yes)+'.'+(no.length?(cap?' Больше трёх животных один человек не возьмёт.':'')+' Без присмотра пока: '+tripNames272(no)+'.':''))
  :h.name+' в этот раз не может. Можно попросить другого близкого или выбрать платный уход.';
 show('Присмотр · '+h.name,text,[
  ...(no.length?tripBulkOptions272(next,no.map(p=>p.id)):[]),
  {label:'Питомцы и присмотр',fn:()=>journeyPetsMenu57(next)},
  {label:'Вернуться к плану',fn:()=>journeyReturn57(next)}
 ],{title:'Питомцы на время поездки',open:()=>journeyPetsMenu57(next)});
}
// Пауза в полгода после просьбы (requestPetHelper57) ставилась и на согласие: близкий, который присмотрел за питомцем
// в прошлой поездке, для следующей в те же полгода «не может» — и по одному, и разом, и по памяти выбора.
// Теперь пауза остаётся только после отказа.
requestPetHelper57=function(d,petId,personId,...rest){
 const z=journeys57(),key=petId+':'+personId;
 if(s.clock.ticks<(z.retry[key]||0)&&z.agreements.filter(q=>q.pet===petId&&q.person===personId).at(-1)?.status==='agreed')delete z.retry[key];
 return trips272Base.requestPetHelper57(d,petId,personId,...rest);
};
function tripAgreedElse272(d,personId,yes){
 return journeys57().agreements.filter(q=>q.plan===d.journey57.id&&q.person===personId&&q.status==='agreed'&&!yes.some(p=>p.id===q.pet)).length;
}

// ---------- память выбора ----------

function tripRemember272(t){
 const j=t?.journey57;
 if(!j||t.stayHome86||!Array.isArray(j.pets))return;
 const z=trips272(),alive=new Set((s.pets||[]).filter(p=>p.alive).map(p=>p.id));
 for(const plan of j.pets)if(tripModes272.includes(plan.mode))z.pets[plan.pet]={mode:plan.mode,helper:plan.helper||null,tick:s.clock.ticks};
 for(const id of Object.keys(z.pets))if(!alive.has(id))delete z.pets[id];
 if(j.bulk272&&tripModes272.includes(j.bulk272.mode))z.bulk={mode:j.bulk272.mode,helper:j.bulk272.helper||null};
 save();
}
function tripRecallOne272(d,plan,want){
 if(!want)return false;
 if(['bring','sitter','hotel'].includes(want.mode)){Object.assign(plan,tripPlan272(plan.pet,want.mode));return true;}
 if(want.mode==='home'){if(d.days!==1)return false;Object.assign(plan,tripPlan272(plan.pet,'home'));return true;}
 if(want.mode==='relative'){const h=living(want.helper);if(!h||!petHelpers57(d).some(p=>p.id===h.id))return false;Object.assign(plan,tripPlan272(plan.pet,'relative',h.id));return true;}
 return false; // household: решает автоматический уход домочадцев
}
function tripRecall272(d){
 const z=s.trips272;
 if(!z||!d?.journey57||d.stayHome86)return d;
 for(const plan of d.journey57.pets||[])tripRecallOne272(d,plan,z.pets?.[plan.pet]||z.bulk);
 return d;
}
// Питомец, появившийся после начала черновика: его прошлый уход или последний общий выбор, иначе как в игре.
function tripAddMissing272(d){
 const j=d.journey57;
 if(!j||d.stayHome86)return d;
 const z=s.trips272;
 for(const p of livePets57())if(!j.pets.some(q=>q.pet===p.id)){
  const plan={pet:p.id,mode:d.days===1?'home':'hotel',helper:null,agreement:null}; // как в journeyPetsMenu57
  tripRecallOne272(d,plan,z?.pets?.[p.id]||z?.bulk);
  j.pets.push(plan);
 }
 return d;
}

journeyDraft57=function(d,...rest){
 const fresh=!!d&&!d.journey57&&!(d.invite53&&invite53(d.invite53)?.journey57)&&!travel52().trips.includes(d);
 const draft=trips272Base.journeyDraft57(d,...rest);
 return fresh?tripRecall272(draft):draft;
};

bookTravel52=function(d,...rest){
 const before=new Set(travel52().trips.map(t=>t.id)),ok=trips272Base.bookTravel52(d,...rest);
 if(ok)try{tripRemember272(travel52().trips.find(t=>!before.has(t.id)));}catch(e){console.error(e);}
 return ok;
};
applyJourney57=function(id,d,...rest){
 const ok=trips272Base.applyJourney57(id,d,...rest);
 if(ok)try{tripRemember272(travel52().trips.find(t=>t.id===id));}catch(e){console.error(e);}
 return ok;
};

// ---------- «Чтобы поехать, не хватает» ----------

function tripCareSummary272(d){
 const plans=d?.journey57?.pets||[];
 if(!plans.length)return '';
 const count={};
 for(const q of plans)count[q.mode]=(count[q.mode]||0)+1;
 const fee=plans.reduce((n,q)=>n+journeyPetFee57(d,q),0),modes=Object.keys(count);
 const text=modes.length===1&&plans.length>1?'Все: '+tripModeName272(modes[0]):modes.map(m=>tripModeName272(m)+(plans.length>1?': '+count[m]:'')).join(' · ');
 return text+(fee?' · '+money(fee):'');
}

const tripPetWhy272=/^(.+?): (выберите уход|на несколько дней нужен присмотр|нет действующего согласия близкого|дома не остаётся доступного взрослого)$/;

function tripPersonByName272(list,w,tail){return list.find(p=>w===p.name+tail||w.startsWith(p.name+tail));}

// Кнопка-исправление для одной причины. ctx.kind: draft (черновик или приглашение), journey («Дорога и уход»), trip (карточка).
function tripFix272(w,ctx){
 const t=ctx.t,d=ctx.d||(t&&tripDraft57(t)),draft=ctx.kind==='draft',plan=()=>ctx.kind==='trip'?journeyDraftMenu57(tripDraft57(t)):null;
 const has=name=>typeof globalThis[name]==='function';
 const fix=(label,fn)=>({label,fn});
 if(/^(Состав питомцев изменился; пересмотрите уход|Нужно выбрать уход за питомцами)$/.test(w))return fix('Питомцы и присмотр',()=>journeyPetsMenu57(d));
 if(w==='Нужно подтвердить уход за питомцами и новый бюджет')return ctx.kind==='trip'?fix('Дорога и уход',plan):null;
 if(/нужен присмотр на время поездки$|нужен присмотр во время болезни$|дома нужен взрослый или согласованный присмотр$|договоритесь о присмотре на время поездки$/.test(w))return has('childcareMenu86')?fix('Присмотр за детьми',()=>childcareMenu86(d)):null;
 if(/ болеет: сначала восстановление$/.test(w)){const p=tripPersonByName272(ownChildren55(),w,' болеет');return p?fix('Здоровье · '+p.name,()=>childOverview55(p.id)):null;}
 if(w==='Сейчас вы ухаживаете за заболевшим ребёнком'){const p=ownChildren55().find(p=>p.child55?.illness?.status==='active'&&p.child55.illness.self);return p?fix('Здоровье · '+p.name,()=>childOverview55(p.id)):null;}
 if(/^Перед поездкой нужно восстановиться/.test(w))return fix('Самочувствие',()=>s.illness?healthMenu():incidentsMenu56());
 if(w==='Перед поездкой договоритесь о замене в уходе за пожилым близким'){const p=s.people.find(p=>p.alive&&p.aging58?.care?.mode==='self');return p&&has('elderMenu58')?fix('Уход · '+p.name,()=>elderMenu58(p.id)):null;}
 if(/^(На выбранный бюджет не хватает доступных средств|Не хватает средств на вашу часть|Не хватает на няню на время поездки|К отъезду не хватает доступных средств)$/.test(w))return fix('Деньги',()=>tripMoneyMenu272(ctx));
 if(/: не хватает средств на согласованную часть$/.test(w))return draft&&!d.invite53?fix('Кто платит',()=>paymentMenu53(d)):null;
 if(/^(Недостаточно накопленных дней отпуска|Не хватает дней отпуска)$/.test(w))return draft?fix('Отпуск',()=>tripLeaveMenu272(d)):fix('Перенести дату',()=>tripCalendar86(tripDraft57(t)));
 if(/^Отпуск за свой счёт (сейчас|больше) недоступен$/.test(w))return draft?fix('Оплачиваемый отпуск',()=>returnTravel86({...d,unpaid86:false})):null;
 if(/^Недостаточно времени для подготовки к выбранной дате$|в этот месяц смена в лагере$|^Вернуться к согласованию можно через /.test(w))return draft?fix('Выбрать дату',()=>tripCalendar86(d)):null;
 if(/: нужны .+ на оформление$|: документы ещё не готовы или истекли$/.test(w))return has('visaMenu86')?fix('Визы и документы',()=>visaMenu86(draft?d:tripDraft57(t))):null;
 if(w==='Попутчик сейчас недоступен')return draft&&!d.party53?fix('Попутчик',()=>travelEdit52(d,'companion')):draft?fix('Состав поездки',()=>partyMenu53(d)):null;
 if(w==='Сначала завершите или отмените текущую поездку'){const a=travelActive52();return a?fix('Текущая поездка · '+a.city,()=>travelTripMenu52(a.id)):null;}
 if(w==='Выберите другой город')return fix('Куда поехать',()=>travelMenu52());
 if(/^(Проверьте длительность и бюджет|Для всего маршрута нужен более длительный отпуск)$/.test(w))return draft?fix('Длительность',()=>travelEdit52(d,'days')):null;
 if(/^(Проверьте состав поездки|Участник сейчас недоступен)$|: нужен взрослый родитель в составе поездки$/.test(w))return draft&&!d.invite53?fix('Состав поездки',()=>partyMenu53(d)):null;
 if(w==='Выберите способ оплаты')return draft&&!d.invite53?fix('Кто платит',()=>paymentMenu53(d)):null;
 if(/^Перед дальней дорогой нужно обслуживание/.test(w))return fix('Машина',()=>transportMenu56());
 if(/^(Для этого направления выберите общественный транспорт|Нужен свой исправный местный автомобиль|Для этого направления поездка на своей машине недоступна|Слишком много дороги|Для общей машины все участники|Не хватает мест)/.test(w))
  return ctx.kind==='trip'?fix('Дорога и уход',plan):fix('Дорога',()=>journeyTransportMenu57(d));
 return null;
}

// Причины в том виде, как их показывает игра; одинаковые причины для нескольких питомцев — одной строкой.
function tripReadyItems272(why,ctx){
 const pets=livePets57(),groups=new Map(),items=[];
 for(const w of why){
  const m=tripPetWhy272.exec(w),pet=m&&pets.find(p=>p.name===m[1]);
  if(pet){
   if(!groups.has(m[2])){const g={tail:m[2],pets:[]};groups.set(m[2],g);items.push(g);}
   const g=groups.get(m[2]);if(!g.pets.includes(pet))g.pets.push(pet);
   continue;
  }
  const fix=tripFix272(w,ctx);
  // «Не хватает на бюджет» и «не хватает на вашу часть» — одна и та же нехватка денег: одной строкой.
  if(fix?.label==='Деньги'&&items.some(i=>i.fix?.label==='Деньги'))continue;
  items.push({text:w,fix});
 }
 const d=ctx.d||(ctx.t&&tripDraft57(ctx.t)),plan=()=>journeyDraftMenu57(tripDraft57(ctx.t));
 return items.map(g=>{
  if(!g.pets)return g;
  const text=tripNames272(g.pets)+': '+g.tail;
  if(ctx.kind==='trip')return {text,fix:{label:'Дорога и уход',fn:plan}};
  const plans=g.pets.map(p=>d.journey57?.pets?.find(q=>q.pet===p.id));
  const helper=g.tail==='нет действующего согласия близкого'&&plans.every(q=>q?.mode==='relative'&&q.helper===plans[0]?.helper)&&petHelpers57(d).find(h=>h.id===plans[0]?.helper);
  if(helper)return {text,fix:{label:'Попросить · '+helper.name,fn:()=>tripAskAll272(d,helper.id,g.pets.map(p=>p.id))}};
  return {text,fix:g.pets.length>1?{label:'Питомцы и присмотр',fn:()=>journeyPetsMenu57(d)}:{label:'Выбрать уход',fn:()=>journeyPetMenu57(d,g.pets[0].id)}};
 });
}

// Причины для запланированной поездки: то же, что travelDepartureWhy52 проверит при отъезде, план дороги и ухода
// целиком (journeyWhy57) и деньги к отъезду (как travelPay53). Отложенная поездка проверяется заново, как в family270.
function tripTripWhy272(t){
 if(!pendingJourney57(t))return null;
 const had='hold57' in t,hold=t.hold57;
 let dep='',plan=[];
 t.hold57=null;
 try{dep=travelDepartureWhy52(t)||'';}catch(e){console.error(e);}
 finally{if(had)t.hold57=hold;else delete t.hold57;}
 try{plan=journeyWhy57(tripDraft57(t));}catch(e){console.error(e);}
 // Проверка отъезда возвращает одну причину или весь план одной строкой через «; » (а в самих причинах «; » тоже бывает).
 const why=dep&&dep!==plan.join('; ')?[dep]:[];
 why.push(...plan);
 if(!t.paid&&!t.partyPaid53&&!t.companyPaid54){
  if(t.party53&&t.quote53&&!t.business54)why.push(...groupFundsWhy53(t.quote53));
  else{const due=t.business54?(t.journey57?.quote?.extra57||0):(t.fee||0);if(due&&expenseAvailable231()+1e-6<due)why.push('К отъезду не хватает доступных средств');}
 }
 return tripLater272(t,why);
}
// До отъезда документы и лагерь проверяются на месяц отъезда, а не на сегодня.
function tripLater272(t,why){
 if(s.clock.ticks>=t.departure)return why;
 return why.filter(w=>{
  if(/: документы ещё не готовы или истекли$/.test(w))return typeof visaNeeds86!=='function'||visaNeeds86({...tripDraft57(t),departure86:t.departure}).length>0;
  if(/ в этот месяц в лагере$/.test(w)&&typeof campTicksSoc270==='function'){const p=tripPersonByName272((t.party53||[]).map(living).filter(Boolean),w,' в этот месяц');return !p||campTicksSoc270(p.id).includes(t.departure);}
  return true;
 });
}

function tripCollect272(ctx){
 if(ctx.invite){const q=invite53(ctx.invite);if(!q)return null;ctx.d=journeyDraft57({...q.draft,invite53:ctx.invite});}
 const det=nextDetail20;
 if(!det?.sections)return null;
 const idx=det.sections.findIndex(g=>g.title==='Готовность'||g.title==='Перед согласием');
 let why=idx>=0?det.sections[idx].rows.filter(r=>r.label==='Нужно').map(r=>r.value):null;
 if(ctx.kind==='draft'&&ctx.d.invite53){
  const q=invite53(ctx.d.invite53);
  if(!q||!invitationAvailable53(q))return null;
  why=why||[];
 }
 if(ctx.kind==='journey'){
  const t=ctx.t;if(!pendingJourney57(t))return null;
  const saved=new Set(journeyWhy57(tripDraft57(t)));
  // Свой план окно проверяет само (journeyWhy57 с новым бюджетом); из проверки отъезда — только то, что не про план и не про деньги.
  why=[...(why||[]),...(tripTripWhy272(t)||[]).filter(w=>!saved.has(w)&&!tripPetWhy272.test(w)&&
   !['Нужно подтвердить уход за питомцами и новый бюджет','К отъезду не хватает доступных средств','Не хватает средств на вашу часть'].includes(w))];
 }
 if(ctx.kind==='trip')why=tripTripWhy272(ctx.t);
 if(!why)return null;
 why=[...new Set(why.filter(Boolean))];
 // Причины переехали наверх; пустой раздел (так бывает в «Дорога и уход») тоже не нужен.
 if(idx>=0&&(why.length||!det.sections[idx].rows.length))det.sections.splice(idx,1);
 return why;
}

function tripInsertReady272(why,ctx){
 const modal=$('#modal'),h2=modal?.querySelector?.('h2');
 if(!h2||modal.querySelector('.ready272'))return;
 const home=ctx.kind==='draft'&&ctx.d.stayHome86,items=tripReadyItems272(why,ctx),start=modalFns.length;
 const box=document.createElement('section');
 box.className='ready272 '+(items.length?'ready272-missing':'ready272-ok');
 if(!items.length){
  const held=ctx.t?.hold57&&ctx.kind!=='draft';
  box.innerHTML='<h3>'+(home?'Можно отдыхать':'Можно ехать')+'</h3>'+(held?'<p class="ready272-note">Отъезд — в начале следующего месяца.</p>':'');
 }else{
  let k=0;
  box.innerHTML='<h3>'+(home?'Чтобы начать отпуск, не хватает:':'Чтобы поехать, не хватает:')+'</h3><div class="ready272-list">'+items.map(item=>{
   if(!item.fix)return '<p class="ready272-item ready272-info">'+esc(item.text)+'</p>';
   modalFns.push(item.fix.fn);
   return '<button type="button" class="ready272-item" onclick="choose('+(start+k++)+')">'+esc(item.text)+'<small>'+esc(item.fix.label)+'</small></button>';
  }).join('')+'</div>';
 }
 h2.insertAdjacentElement('afterend',box);
}

let tripHook272=null;
function tripHooked272(ctx,run){
 if(tripHook272)return run();
 const old=show;
 tripHook272=ctx;
 show=function(title,text,opts=[],...rest){
  if(ctx.done)return old(title,text,opts,...rest);
  ctx.done=true;
  let why=null;
  try{why=tripCollect272(ctx);}catch(e){console.error(e);}
  const d=ctx.d||(ctx.t&&tripDraft57(ctx.t)),list=d?.journey57?.pets?.length?opts.map(o=>typeof o?.label==='string'&&/^Питомцы и присмотр/.test(o.label)?{...o,hint:tripCareSummary272(d)}:o):opts;
  const r=old(title,text,list,...rest);
  try{if(why)tripInsertReady272(why,ctx);}catch(e){console.error(e);}
  return r;
 };
 try{return run();}finally{show=old;tripHook272=null;}
}

// Черновик получает план дороги и ухода сразу, чтобы кнопки блока работали с тем же планом, что и окно. План приглашения
// хранится в самом приглашении: его берём уже после того, как окно его записало.
travelDraftMenu52=function(d,...rest){
 if(d?.invite53)return tripHooked272({kind:'draft',invite:d.invite53,d},()=>trips272Base.travelDraftMenu52(d,...rest));
 if(d)d=journeyDraft57(d);
 return tripHooked272({kind:'draft',d},()=>trips272Base.travelDraftMenu52(d,...rest));
};
travelInviteMenu53=function(id,...rest){
 if(!invite53(id))return trips272Base.travelInviteMenu53(id,...rest);
 return tripHooked272({kind:'draft',invite:id,d:{invite53:id}},()=>trips272Base.travelInviteMenu53(id,...rest));
};
journeyDraftMenu57=function(d,...rest){
 const t=d?.editTrip57&&travel52().trips.find(t=>t.id===d.editTrip57);
 if(!t)return trips272Base.journeyDraftMenu57(d,...rest);
 return tripHooked272({kind:'journey',d,t},()=>trips272Base.journeyDraftMenu57(d,...rest));
};
travelTripMenu52=function(id,...rest){
 const t=travel52().trips.find(t=>t.id===id);
 if(!t||!pendingJourney57(t))return trips272Base.travelTripMenu52(id,...rest);
 return tripHooked272({kind:'trip',t},()=>trips272Base.travelTripMenu52(id,...rest));
};

// Деньги: что можно поменять в самой поездке и куда смотреть в финансах.
function tripMoneyMenu272(ctx){
 const d=ctx.d,t=ctx.t,draft=ctx.kind==='draft';
 let due=0;
 try{
  if(draft)due=travelQuote52(d)+(typeof familySitterFee270==='function'?familySitterFee270(extraTravel86(d)):0);
  else due=(t.business54?(t.journey57?.quote?.extra57||0):(t.fee||0))+(typeof familySitterFee270==='function'&&!t.sitterPaid270?familySitterFee270(tripDraft57(t)):0);
 }catch(e){console.error(e);}
 const have=expenseAvailable231(),gap=Math.max(0,due-have),dd=draft?d:tripDraft57(t),care=(dd.journey57?.pets||[]).reduce((n,q)=>n+journeyPetFee57(dd,q),0);
 const back=draft?()=>journeyReturn57(d):()=>travelTripMenu52(t.id);
 show('Деньги на поездку','Ваша часть — '+money(due)+', доступно сейчас — '+money(have)+(gap?'. Не хватает '+money(gap)+'.':'.'),[
  ...(draft&&!d.invite53&&!d.stayHome86?[{label:'Бюджет · '+travelComfort52[d.comfort].name,fn:()=>travelEdit52(d,'comfort')},{label:'Длительность · '+d.days+' дн.',fn:()=>travelEdit52(d,'days')}]:[]),
  ...(care?[{label:'Питомцы и присмотр',hint:'Уход сейчас · '+money(care),fn:()=>draft?journeyPetsMenu57(d):journeyDraftMenu57(tripDraft57(t))}]:[]),
  {label:'Финансы',fn:()=>financeMenu()},
  {label:'Вернуться к поездке',fn:back}
 ]);
}

// Отпуск: за свой счёт, короче или позже.
function tripLeaveMenu272(d){
 const leave=travelLeave52(),need=travelWorkDays52(d.days)*travelFraction52();
 show('Дни отпуска','Нужно '+need.toFixed(1)+' рабочих дн., накоплено '+(leave?leave.balance.toFixed(1):'0')+'.',[
  ...(typeof unpaidAllowed86==='function'&&unpaidAllowed86()&&!d.unpaid86?[{label:'Взять отпуск за свой счёт',hint:'Без зарплаты за рабочие дни отсутствия',fn:()=>returnTravel86({...d,unpaid86:true})}]:[]),
  {label:'Поехать на меньший срок',fn:()=>travelEdit52(d,'days')},
  {label:'Выбрать дату позже',hint:'Дни отпуска копятся каждый месяц',fn:()=>tripCalendar86(d)},
  {label:'Вернуться к поездке',fn:()=>journeyReturn57(d)}
 ]);
}

(function tripStyle272(){
 if(typeof document==='undefined'||document.getElementById('trips272-style'))return;
 const st=document.createElement('style');
 st.id='trips272-style';
 st.textContent='#modal .ready272{margin:4px 0 18px;padding:14px 16px;border-radius:10px;background:#f1e2d6;border-left:3px solid #b57e3d}'+
  '#modal .ready272 h3{font-family:inherit;font-size:15px;font-weight:700;margin:0;line-height:1.4}'+
  '#modal .ready272-missing h3{margin-bottom:10px}'+
  '#modal .ready272-list{display:grid;gap:8px}'+
  '#modal .ready272-item{display:block;width:100%;box-sizing:border-box;text-align:left;white-space:normal;overflow-wrap:anywhere;line-height:1.45;padding:10px 12px;font-size:14px;margin:0}'+
  '#modal button.ready272-item small{display:block;margin-top:4px;font-size:12px;color:var(--accent,#8a4b16)}'+
  '#modal p.ready272-info{border:1px dashed var(--line,#d8c4b8);border-radius:8px;color:var(--ink,#302321)}'+
  '#modal .ready272-ok{background:#e4ece0;border-left-color:#6f8f62}'+
  '#modal p.ready272-note{margin:6px 0 0;font-size:13px;line-height:1.5}'+
  '@media(max-width:600px){#modal .ready272{padding:12px}#modal .ready272-item{font-size:13px;padding:9px 10px}}';
 document.head.appendChild(st);
})();

