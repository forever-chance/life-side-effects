'use strict';
// Сборка 266: события своего дела (docs/ROADMAP.md, «Своё дело: что сделать», п. 4).
// У каждого события есть последствие по умолчанию, ответ его меняет:
// - конкурент открылся рядом: спрос ×0.82 на два года, затем ×0.92 ещё на три (модификаторы 254);
//   ответ — цены ниже рынка, реклама, ремонт или ничего;
// - арендодатель продаёт помещение: новый хозяин поднимает аренду на 25%; можно выкупить помещение — тогда аренды нет;
// - ключевой сотрудник уходит: через месяц уходит; прибавка 20% удерживает его с вероятностью 70%.
// Частота: конкурент — 1.5% в месяц после первого года, продажа помещения — 0.6% в месяц после второго,
// уход сотрудника — 1% в месяц на каждого сотрудника после первого года.

function businessById266(id){return ownedEnterprises168().find(b=>b.id===id&&b.status==='active');}

const businessMonthBase266=enterpriseLocationMonth168;
enterpriseLocationMonth168=function(b,...args){
 const before=b?.last;
 const out=businessMonthBase266.call(this,b,...args);
 if(!b||b.status!=='active'||b.last===before)return out;
 const tick=s.clock.ticks,age=tick-(b.opened159??tick),staff=enterpriseStaff155(b);
 // Прибавки удержанным сотрудникам и уход тех, кого не удержали.
 const bonus=Object.entries(b.bonus266||{}).filter(([id])=>staff.some(p=>p.id===id)).reduce((n,[,v])=>n+v,0);
 if(bonus){b.cash-=bonus;const h=b.history.at(-1);if(h){h.costs+=bonus;h.paid+=bonus;}}
 if(b.leaving266&&tick>=b.leaving266.at){
  const p=living(b.leaving266.id);
  if(p&&(b.staff155||[]).includes(p.id)){releaseEnterpriseStaff155(b,p.id);log('Сотрудник ушёл',`${b.title} · ${p.name} забирает кружку и фотографию со стола. Рук стало меньше.`,'Своё дело');}
  delete b.leaving266;
 }
 const free=!s.pending.some(q=>q.businessId===b.id);
 if(free&&age>=12&&!b.competitor266&&chance(.015)){
  b.competitor266=tick;
  (b.cases254??={}).modifiers??=[];
  b.cases254.modifiers.push({case:'competitor266',until:tick+24,demand:.89},{case:'competitor266',until:tick+60,demand:.92});
  s.pending.push({type:'competitor266',businessId:b.id});
 }else if(free&&age>=24&&!b.ownPremises266&&!b.landlord266&&chance(.006)){
  b.landlord266=tick;
  b.rentFactor159=(b.rentFactor159??1)*1.25;
  s.pending.push({type:'landlord266',businessId:b.id});
 }else if(free&&age>=12&&staff.length&&!b.leaving266&&chance(.01*staff.length)){
  const p=pick(staff);
  b.leaving266={id:p.id,at:tick+1};
  s.pending.push({type:'staffLeave266',businessId:b.id,personId:p.id});
 }
 return out;
};

// Своё помещение — без аренды.
const enterpriseRentBase266=enterpriseRent157;
enterpriseRent157=function(b,space=enterpriseSpace157(b),...args){
 if(b?.ownPremises266&&space===enterpriseSpace157(b))return 0;
 return enterpriseRentBase266.call(this,b,space,...args);
};

function premisesPrice266(b){return Math.round(enterpriseRentBase266(b)/(b.rentFactor159??1)*100);}

function businessEvent266(q){
 const b=businessById266(q.businessId);
 const done=text=>{s.pending.shift();if(text)log(text[0],b.title+' · '+text[1],'Своё дело',true);save();render();if(s.pending.length)resolvePending();};
 if(!b)return done(null);
 if(q.type==='competitor266'){
  const ad=enterpriseInvestment156(b,'advertising'),fresh=b.fresh263??1,reno=typeof renovationCost263==='function'?renovationCost263(b):Infinity;
  return show('Конкурент рядом',`Через дорогу открывается такое же дело: свежая вывеска, скидки на открытие, очередь в первый день. Часть ваших клиентов уже заглянула туда «просто посмотреть».`,[
   {label:'Снизить цены',hint:'Цены ниже рынка · больше клиентов, меньше с каждого',disabled:b.prices156==='low',fn:()=>{b.prices156='low';done(['Ответ конкуренту','вы снижаете цены. Постоянные клиенты это замечают.']);}},
   {label:'Запустить рекламу',hint:money(ad)+' · 3 месяца',disabled:(b.adUntil156??0)>s.clock.ticks||b.cash<ad,fn:()=>{b.cash-=ad;b.adUntil156=s.clock.ticks+3;done(['Ответ конкуренту','листовки, объявления и скидка для тех, кто вернётся.']);}},
   {label:'Сделать ремонт',hint:money(reno)+' · место станет свежее',disabled:fresh>.97||b.cash<reno,fn:()=>{b.cash-=reno;b.fresh263=1;done(['Ответ конкуренту','ремонт: новый свет, новая вывеска, старые клиенты.']);}},
   {label:'Ничего не делать',hint:'Спрос ниже на ближайшие годы',fn:()=>done(['Конкурент рядом','вы решаете не суетиться. Посмотрим, кто продержится дольше.'])}
  ]);
 }
 if(q.type==='landlord266'){
  const price=premisesPrice266(b),available=b.cash+s.cash;
  return show('Помещение продают',`Хозяин помещения продаёт его. Новый владелец приходит знакомиться с ноутбуком и таблицей: аренда с этого месяца на четверть выше. Или помещение можно выкупить самим.`,[
   {label:'Выкупить помещение',hint:money(price)+' · аренды больше не будет',disabled:available<price,fn:()=>{
    const fromBusiness=Math.max(0,Math.min(b.cash,price));if(price>fromBusiness&&!spend231(price-fromBusiness,'Выкуп помещения: '+b.title,'premises266:'+b.id))return toast('Не хватает денег на выкуп.');b.cash-=fromBusiness;
    b.ownPremises266=true;b.rentFactor159=(b.rentFactor159??1)/1.25;delete b.rentOffer159;
    done(['Своё помещение','ключи от помещения теперь ваши. Аренды больше нет, ремонт — тоже ваша забота.']);
   }},
   {label:'Платить новую аренду',hint:'Аренда +25%',fn:()=>done(['Новый арендодатель','вы подписываете новый договор. Ставка выше, разговор вежливый.'])}
  ]);
 }
 if(q.type==='staffLeave266'){
  const p=living(q.personId),wage=enterpriseWage155(b);
  if(!p||!(b.staff155||[]).includes(p.id)){delete b.leaving266;return done(null);}
  return show('Сотрудник уходит',`${p.name}: «Мне предложили место получше. Я не хочу уходить со скандалом — просто говорю заранее».`,[
   {label:'Предложить прибавку',hint:money(Math.round(wage*.2))+'/мес. · скорее всего останется',fn:()=>{
    if(chance(.7)){(b.bonus266??={})[p.id]=Math.round(wage*.2);delete b.leaving266;rel(p,{trust:3});done(['Сотрудник остаётся',p.name+' остаётся. Прибавка — с этого месяца.']);}
    else done(['Сотрудник уходит',p.name+' благодарит, но уже решил'+(p.gender==='f'?'а':'')+'. Через месяц место будет свободно.']);
   }},
   {label:'Отпустить',hint:'Через месяц рук станет меньше',fn:()=>done(['Сотрудник уходит',p.name+' доработает месяц.'])}
  ]);
 }
}

const resolvePendingBase266=resolvePending;
resolvePending=function(...args){
 const q=s.pending[0];
 if(['competitor266','landlord266','staffLeave266'].includes(q?.type))return businessEvent266(q);
 return resolvePendingBase266.apply(this,args);
};
