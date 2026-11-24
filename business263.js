'use strict';
// Сборка 263, слой 3: своё дело — выручка от рынка, часы владельца, цены от индекса страны.
//
// Было (enterprise152.js, enterpriseLocationMonth168):
// - выручка считалась от собственных издержек: (аренда + накладные + 0.7·зарплата) / (1 − переменные) · 1.28,
//   спрос почти всегда выше потолка мощности — дело работало на максимуме и покрывало расходы самой формулой;
// - аренда, зарплаты, реклама — из таблицы в евро по курсу (в Норвегии сотрудник получал треть средней зарплаты);
// - «владелец на месте» значило жить в том же городе, часов в расписании дело не занимало.
// Стало (docs/ROADMAP.md, «Своё дело: что сделать»):
// - цены из таблицы пересчитываются через индекс страны (отношение средних зарплат), а не по курсу;
//   сотрудник получает 0.8 средней месячной зарплаты страны;
// - спрос — сколько работы город купит у этого дела (в «рабочих местах»): база типа × рынок города × навык владельца
//   × приживаемость места (определяется при открытии, 0.45–1.45) × раскачка первого года (с 35%) × свежесть × цены, помещение,
//   реклама, события × U(0.85, 1.15); мощность — владелец (сам 1, частично 0.45, через управляющего 0) + персонал
//   + управляющий; выручка = выработка одного места × min(спрос, мощность);
// - владелец в расписании: сам — 35 ч/нед., частично — 15, через управляющего — 3 (у управляющего оклад 1.3 средней,
//   иногда он ошибается или ворует);
// - свежесть: без ремонта дело теряет 2.5% спроса в год; ремонт возвращает её.

const business263={
 base:{studio:1.45,services:1.8,shop:2.0},     // спрос, «рабочих мест», в среднем городе при прочих равных
 unit:{studio:2.4,services:2.2,shop:3.8},     // выручка одного полного места в месяц, в средних зарплатах
 modes:{
  self:{name:'Сам',hours:35,units:1,hint:'35 ч/нед. · вся выручка ваша'},
  partial:{name:'Частично',hours:15,units:.45,hint:'15 ч/нед. · меньше заказов'},
  manager:{name:'Через управляющего',hours:3,units:0,hint:'3 ч/нед. · оклад управляющему, риск ошибок'}
 }
};

function businessW263(b){return countries[b.country].wage/12;}
// Переопределяются в business265.js; здесь — поведение 263 для трёх исходных видов.
function businessBase263(b){return business263.base[b.type]??1.8;}
function businessUnit263(b){return business263.unit[b.type]??2.2;}
function businessSeason263(b){return 1+.08*Math.sin((s.clock.month??0)/12*2*Math.PI);}
// Дело из старого сохранения не занимало ни часа. Пока владелец не выберет режим, считаем «частично»
// и один раз спрашиваем окном.
function businessMode263(b){
 if(business263.modes[b.mode263])return b.mode263;
 b.mode263='partial';
 if(!b.modeAsked263&&s.pending&&!s.dead){b.modeAsked263=true;s.pending.push({type:'businessMode263',businessId:b.id});}
 return b.mode263;
}

// Цены — от индекса страны, а не по курсу евро.
const enterpriseMarketBase263=enterpriseMarket165;
enterpriseMarket165=function(b,...args){
 const m=enterpriseMarketBase263.call(this,b,...args);
 if(!m)return m;
 const fx=fxRate86('nl',b.country)||1,idx=countries[b.country].wage/countries.nl.wage/fx;
 for(const k of ['rent','advertising','overhead','startup'])m[k]=Math.round(m[k]*idx);
 m.wage=Math.round(businessW263(b)*.8);
 return m;
};

// Новое дело: приживаемость места и режим владельца.
const startEnterpriseBase263=startEnterprise152;
startEnterprise152=function(...args){
 const ok=startEnterpriseBase263.apply(this,args);
 if(ok&&s.enterprise152){
  s.enterprise152.fit263=+(0.45+Math.random()).toFixed(2);
  s.enterprise152.mode263='self';
  s.enterprise152.fresh263=1;
  businessTasks263();
 }
 return ok;
};

function businessPresent263(b){
 return b.country===s.country&&b.city===residenceCity()&&!enterpriseBlock152()&&!travelActive52()&&!s.illness;
}

// Ядро месяца. Переписано целиком: прежняя формула выручки от издержек не совместима с рынком.
// Остальное (аренда с повышением, события, филиал, персонал, закрытие при нехватке денег) — как в enterprise152.
enterpriseLocationMonth168=function(business){
 if(s.dead||business?.status!=='active'||business.last>=s.clock.ticks)return;
 business.last=s.clock.ticks;
 if(business.rentOffer159&&rentDeadline239(business)<=s.clock.ticks){
  business.rentFactor159=(business.rentFactor159??1)*1.15;
  delete business.rentOffer159;
  log('Новая ставка аренды вступила в силу',business.title+' · срок ответа истёк.','Своё дело');
 }
 const W=businessW263(business),mode=businessMode263(business),cfg=business263.modes[mode];
 business.fit263??=1;business.fresh263??=1;
 const model=enterpriseTypes152[business.type],unit=countries[business.country].cost/12;
 const staff=enterpriseStaff155(business),space=enterpriseSpace157(business);
 const present=businessPresent263(business);
 const skill=business.school196&&typeof schoolDemand196==='function'?schoolDemand196(business):.65+s.skill/200;
 const event=present||mode==='manager'?enterpriseEvent153(business):null;
 const pricing=enterprisePrices156[business.prices156??'standard'];
 const ads=business.adUntil156>=s.clock.ticks?1.22:1;
 const market=enterpriseMarket165(business);
 const scenario254=typeof businessModifier254==='function'?key=>businessModifier254(business,key):()=>1;
 const age=s.clock.ticks-(business.opened159??s.clock.ticks);
 const ramp=Math.min(1,.35+.65*age/12);
 business.fresh263*=Math.pow(.975,1/12);
 /* 265: спрос, выработка и сезон — по каждому виду дела (businessBase263 / businessUnit263 / businessSeason263),
    раньше только для студии, услуг и магазина: у 13 видов из каталога 253 спрос был NaN */
 const season=businessSeason263(business);
 const demand=businessBase263(business)*(market?.demand??1)*skill*business.fit263*ramp*business.fresh263*
  pricing.demand*space.demand*ads*scenario254('demand')*(1+(event?.[2]??0))*(.85+Math.random()*.3)*season;
 const capacity=((present?cfg.units:0)+staff.length+(mode==='manager'?1:0))*space.capacity*(business.equipment156?1.12:1);
 const primarySales=Math.round(businessUnit263(business)*W*Math.min(demand,capacity)*pricing.price*scenario254('price'));
 const wage=enterpriseWage155(business);
 const payroll=wage*staff.length+(mode==='manager'?Math.round(W*1.3):0);
 const rent=enterpriseRent157(business);
 const branch=business.branch159&&enterpriseSpaces157[business.branch159.space];
 const branchMarket=branch&&enterpriseMarket165(business,branch);
 const branchRent=branch?(branchMarket?.rent??enterpriseBaseCost157(business)*.6*branch.rent):0;
 const branchSales=branch&&staff.length?Math.round(primarySales*(.35+staff.length*.12)*branch.demand*branch.capacity):0;
 const sales=primarySales+branchSales;
 const variable=market?.variable??.3;
 const production=Math.round(primarySales*variable+(branchMarket?branchSales*branchMarket.variable:branchSales*variable));
 const overhead=scenario254('overhead')*(market?market.overhead+(branchMarket?.overhead??0):unit*model.overhead*(.4+(branch?.22:0)));
 const incidentCosts=Math.round((market?market.overhead:unit*model.overhead)*(event?.[3]??0));
 let managerLoss=0;
 if(mode==='manager'&&chance(.02)){
  managerLoss=Math.round(sales*(.1+Math.random()*.2));
  log(chance(.5)?'Недостача':'Ошибка управляющего',business.title+' · '+(managerLoss?'потеряно '+money(managerLoss)+'. ':'')+
   (chance(.5)?'Касса не сходится уже второй месяц подряд, объяснения звучат всё менее уверенно.':'Заказ сорван, клиент ушёл к конкурентам, а вы узнаёте об этом последним.'),'Своё дело');
 }
 const costs=Math.round(branchRent+rent+overhead+production+(market?market.overhead:unit*model.overhead)*(business.equipment156?.04:0))+payroll+incidentCosts+managerLoss;
 const paid=Math.min(costs,business.cash+sales);
 const wagesPaid=Math.min(payroll,paid);
 for(const worker of staff)worker.privateCash+=Math.min(wage,wagesPaid/Math.max(1,staff.length));
 business.cash+=sales-paid;
 business.history.push({tick:s.clock.ticks,sales,costs,paid,rent,branchRent,branchSales,production,overhead,incidentCosts,cash:business.cash,payroll,wagesPaid,event:event?.[0]??null,demand263:+demand.toFixed(2),capacity263:+capacity.toFixed(2)});
 business.history=business.history.slice(-36);
 if(present&&paid===costs&&!business.rentOffer159&&s.clock.ticks-(business.lastRentOffer159??business.opened159??0)>=12&&
  (business.rentFactor159??1)<1.5&&chance(.08)){
  business.lastRentOffer159=s.clock.ticks;
  business.rentOffer159={id:'enterprise-rent-'+business.id+'-'+s.clock.ticks,space:business.space157??'standard',expires:s.clock.ticks+2};
  log('Предложение повысить аренду',business.title+' · через два месяца ставка вырастет на 15%.','Своё дело',false,{kind:'enterpriseRent239',id:business.rentOffer159.id});
 }
 if(event)log(event[0],business.title+' · '+event[1],'Своё дело');
 if(present&&!event&&paid===costs)enterpriseStory154(business);
 if(age===12&&!business.year263){
  business.year263=true;
  const year=business.history.slice(-12),profit=year.reduce((n,h)=>n+h.sales-h.costs,0);
  log('Первый год',business.title+' · '+(profit>=0?`год закрыт в плюс: ${money(profit)}. Постоянные клиенты уже здороваются по имени.`:`год закрыт в минус: ${money(-profit)}. Клиентов больше, чем в первые месяцы, но пока недостаточно.`),'Своё дело',true);
 }
 if(paid<costs){
  business.status='closed';
  for(const id of business.staff155||[])releaseEnterpriseStaff155(business,id);
  log('Своё дело закрыто',business.title+' · средств на текущие расходы не хватило.','Работа',true);
 }
 businessTasks263();
};

// Владелец в расписании: одно дело на каждое предприятие, часы по режиму.
function businessTasks263(){
 if(!s.clock)return;
 const active=ownedEnterprises168().filter(b=>b.status==='active');
 s.clock.tasks=s.clock.tasks.filter(t=>t.kind!=='business263'||active.some(b=>b.id===t.business263&&businessPresent263(b)));
 for(const b of active){
  if(!businessPresent263(b))continue;
  const cfg=business263.modes[businessMode263(b)];
  let t=s.clock.tasks.find(t=>t.kind==='business263'&&t.business263===b.id);
  if(!t){t={id:'business263-'+b.id,kind:'business263',business263:b.id,progress:0,duration:1e9,hours:cfg.hours,label:''};s.clock.tasks.push(t);}
  t.hours=cfg.hours;t.label='Своё дело · '+b.title+' · '+cfg.name.toLowerCase();
 }
}

function setBusinessMode263(id,mode){
 const b=ownedEnterprises168().find(b=>b.id===id);
 if(!b||b.status!=='active'||!business263.modes[mode]||b.mode263===mode)return false;
 b.mode263=mode;
 log('Своё дело · '+business263.modes[mode].name.toLowerCase(),b.title+' · '+(mode==='self'?'вы снова сами за прилавком.':mode==='partial'?'вы приходите на полдня и держите ключевые дела.':'дела ведёт управляющий, вы проверяете цифры раз в неделю.'),'Своё дело');
 businessTasks263();save();render();return true;
}

function businessModeMenu263(b){
 const last=b.history.slice(-6),profit=last.length?Math.round(last.reduce((n,h)=>n+h.sales-h.costs,0)/last.length):null;
 const manager=Math.round(businessW263(b)*1.3);
 show('Как вы ведёте дело',`Сейчас: ${business263.modes[businessMode263(b)].name.toLowerCase()}. Чем меньше вас в деле, тем меньше оно успевает и тем дороже обходится.`+
  (profit!=null?` За последние месяцы дело приносит в среднем ${money(profit)} в месяц; управляющий стоит ${money(manager)}.`:''),[
  ...Object.entries(business263.modes).map(([id,m])=>({label:m.name,hint:m.hint+(id==='manager'?' · '+money(Math.round(businessW263(b)*1.3))+'/мес.':''),disabled:businessMode263(b)===id,fn:()=>{setBusinessMode263(b.id,id);enterpriseMenu152();}})),
  {label:'Назад',fn:enterpriseMenu152}
 ]);
}

const resolvePendingBase263=resolvePending;
resolvePending=function(...args){
 const q=s.pending[0];
 if(q?.type!=='businessMode263')return resolvePendingBase263.apply(this,args);
 const b=ownedEnterprises168().find(b=>b.id===q.businessId&&b.status==='active');
 const done=mode=>{s.pending.shift();if(b&&mode)setBusinessMode263(b.id,mode);save();render();if(s.pending.length)resolvePending();};
 if(!b)return done(null);
 show('Своё дело · '+b.title,'Дело теперь требует вашего времени: чем меньше вас в нём, тем меньше оно успевает. Как вы его ведёте?',
  Object.entries(business263.modes).map(([id,m])=>({label:m.name,hint:m.hint+(id==='manager'?' · '+money(Math.round(businessW263(b)*1.3))+'/мес.':''),fn:()=>done(id)})));
};

// Ремонт: возвращает свежесть.
function renovationCost263(b){const m=enterpriseMarket165(b);return Math.round((m?.startup??enterpriseBaseCost157(b)*6)*.15);}
const developBase263=developEnterprise156;
developEnterprise156=function(id,choice,...args){
 if(choice!=='renovation263')return developBase263.call(this,id,choice,...args);
 const b=s.enterprise152,cost=b&&renovationCost263(b);
 if(!b||b.id!==id||b.status!=='active'||!businessPresent263(b)||b.cash<cost||(b.fresh263??1)>.97)return false;
 b.cash-=cost;b.fresh263=1;
 log('Ремонт',b.title+' · новые полки, свет и вывеска. Постоянные клиенты говорят, что не узнали место.','Своё дело');
 save();render();return true;
};

// Меню дела и развития: режим владельца, ремонт, спрос и мощность словами.
const enterpriseMenuBase263=enterpriseMenu152;
enterpriseMenu152=function(...args){
 const b=s.enterprise152;
 if(b?.status!=='active')return enterpriseMenuBase263.apply(this,args);
 const showBase=show;
 show=function(title,text,opts=[],...rest){
  show=showBase;
  const h=b.history.at(-1),mode=business263.modes[businessMode263(b)];
  const load=h?.capacity263?(h.demand263>=h.capacity263*1.1?' Клиентов больше, чем успеваете обслужить.':h.demand263<h.capacity263*.7?' Работы меньше, чем рук.':''):'';
  return showBase.call(this,title,text+` Ведёте: ${mode.name.toLowerCase()} (${mode.hours} ч/нед.).`+load,[
   {label:'Как вы ведёте дело',hint:mode.name,fn:()=>businessModeMenu263(b)},...opts],...rest);
 };
 try{return enterpriseMenuBase263.apply(this,args);}
 finally{show=showBase;}
};
const developmentMenuBase263=enterpriseDevelopmentMenu156;
enterpriseDevelopmentMenu156=function(b,...args){
 const showBase=show;
 show=function(title,text,opts=[],...rest){
  show=showBase;
  const fresh=b.fresh263??1,cost=renovationCost263(b);
  const extra={label:'Сделать ремонт',hint:money(cost)+' · клиенты возвращаются',disabled:fresh>.97||b.cash<cost,
   fn:()=>{if(!developEnterprise156(b.id,'renovation263'))toast('Сейчас ремонт недоступен.');else enterpriseMenu152();}};
  const back=opts.length&&/^Назад$/.test(opts.at(-1).label)?[opts.at(-1)]:[];
  return showBase.call(this,title,text+(fresh<.9?' Место выглядит уставшим, часть клиентов это замечает.':''),[...opts.slice(0,opts.length-back.length),extra,...back],...rest);
 };
 try{return developmentMenuBase263.call(this,b,...args);}
 finally{show=showBase;}
};
