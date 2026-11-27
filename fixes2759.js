'use strict';
// Сборка 275.9 «Крупные покупки»: ипотека, цены машин, своя машина к туристическим местам (просьбы владелицы 27.11,
// пункты 46–48). Таблицы — в fixes2759-data.js. Файл подключается перед windows273.js; то, что объявлено в
// money2734.js (карточка ипотеки), дооборачивается один раз при первом вызове или после загрузки страницы (late2759).
//
// 1. Ипотека (finance43.js mortgageQuote43 / mortgageBuy43; карточка money2734.js).
//    • Доход для банка — устойчивый доход в месяц: зарплата (или пенсия с 67 лет без работы, как раньше), своё дело —
//      прибыль за последние 12 месяцев (выручка минус расходы, ваша доля, после налога taxes266), гонорары за 12 месяцев
//      (заказы creative47 и выплаты по договорам книг creative27, после налога), сдача жилья (аренда минус 8% простоя,
//      после налога) и — при заявке вдвоём — доход партнёра, с которым вы живёте вместе (householdDeal54).
//    • Заявка вдвоём — явный выбор в окне («Заявка вдвоём · Нина» / «Заявка только на вас»). Тогда банк считает доход и
//      расходы на жизнь обоих, а в договоре записан созаёмщик (d.coBorrower2759 = {id, name, since}). Пока вы живёте
//      вместе, платёж входит в общие расходы (sharedBill54): партнёр вносит свою долю, как и за остальное. Разъехались —
//      платёж целиком на вас, как и раньше по договору.
//    • Взнос — 10/20/30/50% как раньше и 60/70/80%, если хватает денег; «Купить целиком · без банка», если денег хватает
//      на цену с оформлением (и переезд, если переезжаете). «Купить без переезда» по-прежнему — покупка без смены адреса.
//    • Правило банка то же: платёж вместе с другими кредитами — не больше 40% дохода, после платежа и расходов на жизнь —
//      не меньше 5% дохода. Причина отказа — с числами («Платёж 6 672 C$ — 80% дохода 8 333 C$/мес., банк даёт до 40%»),
//      у первой причины — кнопка варианта, который проходит («Взнос 60% на 30 лет — платёж 2 672 C$/мес., проходит»).
//      «Рассчитать ипотеку» открывает сразу вариант, который проходит (самый маленький взнос, срок 20, потом 30, потом
//      10 лет); варианты, которые проходят, в списке первыми; на «банк откажет» — коротко почему.
//    • Сохранённые ипотеки не меняются; запланированная до обновления покупка в ипотеку проходит как раньше.
// 2. Цены машин (markets98.js carPrice98, vehicles56.js vehicleValue56).
//    • Новая машина — по таблице примерных настоящих цен (модель × страна, fixes2759-data.js); дорогие «характерные»
//      (Porsche 911, Nissan GT-R, Ford Mustang, Ferrari) — своей ценой, а не множителем бюджетного класса.
//    • С пробегом — цена новой × остаточная стоимость: возраст (1 год ≈ 84%, 3 года ≈ 74%, 5 лет ≈ 64%, 7 лет ≈ 56%,
//      12 лет ≈ 40%, 18 лет ≈ 27%, не ниже 10%) × состояние (100 → 1, 85 → 0,95, 70 → 0,88, 50 → 0,72, 30 → 0,5). Итого
//      3 года и состояние 80 ≈ 69% новой, 5–7 лет ≈ 50–60%, старая или состояние 30 и ниже ≈ 15–25%.
//      Велосипеды: цена новых прежняя (от расходов страны), остаточная стоимость — та же кривая, но быстрее.
//    • Своя машина стоит (продажа, наследство, подарок, «ремонт дороже машины») по рынку её страны сейчас: цена такой
//      же новой там × остаточная стоимость × 0,8 (быстрая продажа), повреждённая — ещё × 0,65. Машина, перевезённая из
//      другой страны, стоит не дороже, чем такая же в стране покупки (по курсу): на перевозке не заработать.
//      Цена покупки (paidPrice) в сохранении не меняется; от неё по-прежнему считаются страховка и стоянка. Уже
//      выставленные предложения живут свои три месяца по старой цене.
//    • С пробегом в «характерном» ряду 18 лет — только старые модели (2CV, SEAT 600, Yugo, «Жук», Нива); нынешние
//      (Crosstrek, Mustang, 911, Mini, Ioniq 5…) — 7 лет, как в остальных рядах.
// 3. Своя машина к туристическим местам (journeys57.js carJourneyWhy57, journeyKm57).
//    • У туристических мест — координаты (fixes2759-data.js); дорога считается как у городов (по прямой × 1,25 + 15 км,
//      туда и обратно) и проходит то же правило: часов за рулём (км / 70, плюс часы автопарома туда и обратно) не больше,
//      чем дней отпуска × 8. Уистлер из Ванкувера — около 300 км туда и обратно.
//    • Нельзя — только где правда не доехать, с понятной причиной: остров без автопарома («Мауи — остров без автопарома:
//      на машине не доехать, только самолёт»), куда нет дорог (Камчатка, Шпицберген), куда машины не возят (Пхи-Пхи,
//      Ко Тао), за море или на другой континент. За границу — внутри одной «дорожной зоны» (Европа с Британией, Турцией,
//      Грузией и Марокко через пролив; Северная Америка; Южная Америка; юг Африки; Таиланд с Малайзией и Сингапуром).
//    • Автопаром (Ибица, Майорка, Тенерифе, Окинава, Санья, Самуи, Ломбок, Крит…) — его часы входят в дорогу, а билет —
//      в расходы на машину («паром»); Гибралтар между Марокко и Испанией — тоже паром.

// ---------- общее ----------

function round3_2759(x){
 if(!Number.isFinite(x)||x<=0)return 0;
 const p=Math.pow(10,Math.max(0,Math.floor(Math.log10(x))-2));
 return Math.round(x/p)*p;
}
// Доля в процентах; у самой границы банка (40%) — с десятой, чтобы «40% дохода» не стояло рядом с «банк даёт до 40%».
function pct2759(x){const r=Math.round(x*100);if(r!==40||Math.abs(x-.4)<1e-9)return r+'%';let v=Math.round(x*1000)/10;if(x>.4&&v<=40)v=40.1;if(x<.4&&v>=40)v=39.9;return String(v).replace('.',',')+'%';}

// ---------- 2. Цены машин ----------

function carNewPrice2759(model,country){
 const row=model&&typeof carNew2759==='object'?carNew2759[model.name]:null,cc=carCountry2759[country];
 if(!row||!cc)return 0;
 const [eur,local]=row;
 return round3_2759(local[country]!=null?local[country]*cc[1]:eur*cc[2]*cc[0]*cc[1]);
}
function bikeNewPrice2759(model,country){
 const k=countries[country];
 return k&&model?Math.round(k.cost*model.price*((model.weights?.[country]||0)?1:1.18)):0; // как vehicleOffer56
}
// Остаточная стоимость: возраст × состояние (см. шапку).
function ageFactor2759(kind,age,keep=false){
 age=Math.max(0,Number(age)||0);
 const [first,rate,floor]=kind==='bike'?[.8,.9,.08]:keep?[.9,.955,.2]:[.9,.935,.1],one=first*rate;
 if(age<1)return 1-(1-one)*age;
 return Math.max(floor,first*Math.pow(rate,age));
}
const conditionPoints2759=[[0,.2],[10,.3],[30,.5],[50,.72],[70,.88],[85,.95],[100,1]];
function conditionFactor2759(cond){
 const c0=Math.max(0,Math.min(100,Number.isFinite(+cond)?+cond:70)),pts=conditionPoints2759;
 for(let i=1;i<pts.length;i++)if(c0<=pts[i][0]){const [x0,y0]=pts[i-1],[x1,y1]=pts[i];return y0+(y1-y0)*(c0-x0)/(x1-x0);}
 return 1;
}
function residual2759(kind,age,cond,model=null){return ageFactor2759(kind,age,kind==='car'&&!!model&&typeof carKeep2759==='object'&&carKeep2759.includes(model.name))*conditionFactor2759(cond);}

const carPriceBase2759=carPrice98;
carPrice98=function(model,country,used,condition,age){
 const n=carNewPrice2759(model,country);
 if(!n)return carPriceBase2759(model,country,used,condition,age);
 if(!used)return n;
 return Math.max(1,round3_2759(n*residual2759('car',age??usedAge2759(model,country),condition??70,model)));
};
// Обычный возраст машины с пробегом: бюджетная — 12 лет, «характерная» старая модель — 18, остальные — 7.
const carOld2759=['Citroën 2CV','SEAT 600','Zastava Yugo','VW Beetle / Vocho','Lada Niva'];
function usedAge2759(model,country){const role=model?.roles?.[country];return role===0?12:role===4&&carOld2759.includes(model.name)?18:7;}

// Возраст своей машины: с года выпуска (v.year) или с покупки, если она была позже.
function vehicleAge2759(v){
 const held=Math.max(0,(s.clock.ticks-(Number.isFinite(v.acquired)?v.acquired:s.clock.ticks))/12),built=Number.isFinite(v.year)?s.year-v.year:0;
 return Math.max(0,held,built);
}
// Цена такой же новой — на рынке, где машина сейчас, но не дороже, чем там, где её купили (в пересчёте по курсу):
// перевезённая из дешёвой страны в дорогую машина не дорожает, а в дешёвую — стоит по местному рынку.
function vehicleMarket2759(v){
 const m=vehicleModel56(v?.model),here=countries[v?.country]?v.country:s.country,from=countries[v?.priceCountry]?v.priceCountry:here;
 if(!m)return 0;
 const at=k=>{const n=m.kind==='car'?carNewPrice2759(m,k):bikeNewPrice2759(m,k),x=n>0?n*fxRate86(k):0;return Number.isFinite(x)&&x>0?x:0;};
 const a=at(here),b=from===here?a:at(from),n=a>0&&b>0?Math.min(a,b):a||b;
 return n?n*residual2759(m.kind,vehicleAge2759(v),v.condition,m):0;
}
const vehicleValueBase2759=vehicleValue56;
vehicleValue56=function(v){
 try{
  const market=vehicleMarket2759(v);
  if(!(market>0))return vehicleValueBase2759(v);
  const value=Math.round(market*.8*(v.damage?.65:1));
  return Number.isFinite(value)?value:vehicleValueBase2759(v);
 }catch(e){console.error(e);return vehicleValueBase2759(v);}
};
// Велосипед с пробегом: та же кривая (раньше — 48% новой × состояние).
const vehicleOfferBase2759=vehicleOffer56;
vehicleOffer56=function(modelId,used=true,...rest){
 const z=s?transportState56():null,before=z?new Set(z.offers.map(q=>q.id)):null;
 const q=vehicleOfferBase2759(modelId,used,...rest);
 try{
  if(q&&before&&!before.has(q.id)&&q.kind==='bike'&&q.used){
   const m=vehicleModel56(q.model),n=bikeNewPrice2759(m,q.country);
   if(n>0)q.price=Math.max(1,Math.round(n*residual2759('bike',q.age,q.condition)));
  }
  // Нынешняя модель в «характерном» ряду с пробегом — 7 лет, а не 18 (vehicles56.js даёт 18 всему ряду).
  if(q&&before&&!before.has(q.id)&&q.kind==='car'&&q.used){
   const m=vehicleModel56(q.model),age=usedAge2759(m,q.country);
   if(m&&age!==q.age){const price=carPrice98(m,q.country,true,q.condition,age);if(Number.isFinite(price)&&price>0){q.age=age;q.price=price;}}
  }
 }catch(e){console.error(e);}
 return q;
};

// ---------- 1. Ипотека ----------

const mortgageDowns2759=[.1,.2,.3,.5,.6,.7,.8],mortgageYears2759=[10,20,30],mortgageLegacy2759=[[.1,10],[.2,20],[.3,20],[.5,10],[.2,30]];
// Заявка вдвоём, выбранная в окне: объявление → id партнёра. Только на время игры (в договор попадает при оформлении).
const mortgageJoint2759={};
function taxKeep2759(){return 1-(typeof taxRate266==='function'?taxRate266():0);}
function mortgagePartner2759(){
 const p=typeof householdDeal54==='function'&&householdDeal54()?currentPartner():null;
 return p?.alive&&p.age>=18&&p.country===s.country?p:null;
}
// Доход партнёра для банка, в месяц. Год — то, что игра уже записала (family54: partnerSalary), а до первого расчёта —
// по тому же правилу, что partnerIncome54 (aging58 → autonomy55 → family54), без побочных действий: ищущий работу или
// учащийся без работы — 0.
function partnerYear2759(p){
 const a=typeof family54==='function'?family54().agreements[p.id]:null;
 if(Number.isFinite(a?.partnerSalary))return a.partnerSalary;
 const w=countries[p.country]?.wage||0,leave=typeof parentalLeave54==='function'&&parentalLeave54(p.id)?.65:1;
 if(p.bio27){const job=p.bio27.job;return job?w*(job.incomeRatio||.8):0;}
 if(p.aging58?.retired)return w*(p.aging58.pensionRatio??.3);
 const job=p.agency55?.job;
 if(job)return w*(job.incomeRatio||.8)*(p.agency55.plan?.kind==='study'?.5:1)*leave;
 return p.occupation&&!/поиск|не работа|учит|пенсия/i.test(p.occupation)?w*.8:0;
}
// Шкала — как у вашей зарплаты. Партнёру игра платит от зарплаты страны (countries[].wage), вам — от зарплат города
// (economy97). Где зарплата страны выше городской (Турция, Египет — в разы), банк считает партнёру ту же долю, но от
// городской зарплаты; где ниже — как есть.
function partnerScale2759(p){
 const w=countries[p.country]?.wage,city=typeof vacancyWage97==='function'?vacancyWage97(p.country,p.city18||residenceCity()):w,k=city/w;
 return Number.isFinite(k)&&k>0?Math.min(1,k):1;
}
function partnerMonthly2759(p){
 if(!p||!p.alive)return 0;
 const v=Math.max(0,partnerYear2759(p))*partnerScale2759(p)/12*fxRate86(p.country);
 return Number.isFinite(v)?v:0;
}
function businessMonthly2759(){
 if(typeof ownedEnterprises168!=='function')return 0;
 let n=0;
 for(const b of ownedEnterprises168()){
  const year=(b.history||[]).filter(h=>h&&h.tick>s.clock.ticks-12&&h.tick<=s.clock.ticks);
  const profit=year.reduce((t,h)=>t+(Number(h.sales)||0)-(Number(h.costs)||0),0);
  if(profit>0)n+=profit/12*(1-(b.partner158?.share||0))*fxRate86(b.country||s.country);
 }
 return n*taxKeep2759();
}
function creativeMonthly2759(){
 const from=s.clock.ticks-12;let n=0;
 if(typeof creative47==='function')for(const a of creative47().applications||[])
  if(a?.status==='completed'&&a.completed>from&&a.completed<=s.clock.ticks&&a.paid>0)n+=a.paid*fxRate86(a.offer?.country||s.country);
 if(typeof creative27==='function')for(const p of creative27().projects||[]){
  if(!p?.contract||!(p.contract.months>0))continue;
  for(const key of p.payments||[]){const t=Number(String(key).split(':').pop());if(t>from&&t<=s.clock.ticks)n+=p.contract.total/p.contract.months*fxRate86(p.contract.country||s.country);}
 }
 return Number.isFinite(n)?n/12*taxKeep2759():0;
}
function rentMonthly2759(){
 let n=0;
 for(const p of s.properties||[])if(p?.rented&&typeof propertyRental41==='function'){const r=propertyRental41(p);if(Number.isFinite(r)&&r>0)n+=r*.92;}
 return n*taxKeep2759();
}
// Доход, который видит банк, в месяц, по частям.
function mortgageIncome2759(jointId=null){
 const parts=[],add=(key,label,v)=>{if(Number.isFinite(v)&&v>=.5)parts.push({key,label,amount:v});};
 if(s.job&&permission16(s.country,'work'))add('job','зарплата',s.job.salary/12);
 else if(s.age>=67)add('pension','пенсия',(s.flags.lastSalary||c().wage)*.38/12);
 add('business','своё дело',businessMonthly2759());
 add('creative','гонорары',creativeMonthly2759());
 add('rent','сдача жилья',rentMonthly2759());
 let partner=null;
 if(jointId){const p=mortgagePartner2759();if(p&&p.id===jointId&&partnerMonthly2759(p)>=.5){partner=p;add('partner',p.name,partnerMonthly2759(p));}}
 return {parts,total:parts.reduce((n,x)=>n+x.amount,0),partner};
}
function otherLoans2759(){return activeDebts().reduce((n,d)=>n+(d.type==='bank'?d.payment*debtRatio(d):d.type==='friend'?d.balance*debtRatio(d)/Math.max(1,d.due-s.clock.ticks):0),0);}
const mortgageNoIncome2759='Нужен подтверждённый доход от работы или пенсии'; // прежняя строка: money2734 ставит к ней кнопку «Вакансии»

// Расчёт ипотеки. Те же проверки и поля, что в finance43.js, плюс доход по частям и причины с числами (details2759).
// Без взноса и срока (только объявление) — вариант, который проходит первым, или 20% на 20 лет, если не проходит ни один.
mortgageQuote43=function(q,down=.2,years=20,live=true,joint){
 if(arguments.length===1&&q){const best=mortgageBest2759(q,true);if(best)return best.x;}
 if(!q||q.kind==='room'||!mortgageDowns2759.includes(down)||!mortgageYears2759.includes(years))return null;
 if(joint===undefined)joint=mortgageJoint2759[q.id]||null;
 const inc=mortgageIncome2759(joint),income=inc.total;
 const principal=q.purchase*(1-down),rate=mortgageRates43[q.country]??.06,payment=installment(principal,rate,years*12),moving=live?c().cost*.015:0,upfront=q.purchase*(down+.03)+moving;
 const b=monthlyBudget(),otherLoans=otherLoans2759(),maintenance=q.purchase*(q.kind==='house'?.00065:.0004);
 let living=Math.max(0,b.cost-(live?homeCost():0))+maintenance;
 if(inc.partner){
  // Вдвоём: расходы на жизнь обоих — ваша часть, доля партнёра в общих расходах и его личные траты (как в partnerIncome54).
  const a=householdDeal54(),p=inc.partner;
  const share=a?Math.min(sharedBill54()*(1-a.share),typeof parentAvailable17==='function'?parentAvailable17(p):Infinity):0;
  living+=(Number.isFinite(share)?share:0)+countries[p.country].cost*.22/12*fxRate86(p.country);
 }
 const left=income-living-otherLoans-payment,reasons=[],details=[];
 const add=(text,detail={})=>{reasons.push(text);details.push({text,...detail});};
 if(!validListing41(q,'buy'))add('Объявление больше не действует');
 if(s.age<18||s.age+years>80)add('Срок должен завершиться до 80 лет');
 if(income<=0)add(mortgageNoIncome2759,{text:'Нужен доход, который видит банк: работа, своё дело, гонорары, сдача жилья или пенсия',short:'нет дохода, который видит банк'});
 if((s.creditBlockedUntil||0)>s.clock.ticks||activeDebts().some(d=>d.missed>=3||d.type==='bill32'&&d.balance>.01&&d.repayment35?.status!=='active'))add('Сначала нужно урегулировать просрочки');
 if(activeDebts().filter(d=>d.mortgage43).length>=2||s.properties.length>=5)add('Достигнут лимит объектов или ипотек');
 if(income>0&&payment+otherLoans>income*.4){
  const loans=otherLoans>=.5?' и другие кредиты '+money(otherLoans):'';
  add('Платёж '+money(payment)+loans+' — '+pct2759((payment+otherLoans)/income)+' дохода '+money(income)+'/мес., банк даёт до 40%',
   {when:income*.4-otherLoans>=.5?'банк даёт до '+money(income*.4-otherLoans)+'/мес.'+(inc.partner?'':' при вашем доходе'):'другие кредиты уже берут '+pct2759(otherLoans/income)+' дохода — сначала погасите часть',
    short:'платёж '+pct2759((payment+otherLoans)/income)+' дохода — банк даёт до 40%',income:true});
 }
 if(income>0&&left<income*.05){
  add(left>=0?'После платежа и расходов на жизнь остаётся '+money(left)+'/мес. — меньше 5% дохода':'Платёж и расходы на жизнь больше дохода на '+money(-left)+'/мес.',
   {when:'доход '+money(income)+'/мес., на жизнь '+money(living)+(otherLoans>=.5?', другие кредиты '+money(otherLoans):'')+', платёж '+money(payment),short:'после платежа и расходов на жизнь остаётся меньше 5%',income:true});
 }
 if(s.cash+.001<upfront)add('Не хватает на взнос, оформление и переезд');
 return {principal,rate,payment,years,down,live,upfront,moving,income,maintenance,reasons,
  details2759:details,incomeParts2759:inc.parts,joint:inc.partner?.id||null,partnerName2759:inc.partner?.name||'',living2759:living,otherLoans2759:otherLoans,left2759:left};
};
// Вариант, который проходит первым: самый маленький взнос, срок 20, потом 30, потом 10 лет.
function mortgageBest2759(q,live=true,joint){
 for(const d of mortgageDowns2759)for(const y of [20,30,10]){const x=mortgageQuote43(q,d,y,live,joint);if(x&&!x.reasons.length)return {down:d,years:y,live,x};}
 return null;
}
function planLabel2759(d,y){return Math.round(d*100)+'% взнос · '+y+' лет';}
function planText2759(d,y){return 'взнос '+Math.round(d*100)+'% на '+y+' лет';}
// Коротко, почему банк откажет (на кнопке варианта).
function shortWhy2759(x){
 if(!x?.reasons?.length)return '';
 const i=0,r=x.reasons[i],d=x.details2759?.[i];
 if(d?.short)return d.short;
 if(r==='Не хватает на взнос, оформление и переезд')return 'не хватает '+money(x.upfront-Math.max(0,s.cash));
 if(r==='Срок должен завершиться до 80 лет')return 'срок должен закончиться до 80 лет';
 if(r==='Сначала нужно урегулировать просрочки')return 'сначала просрочки';
 if(r==='Достигнут лимит объектов или ипотек')return 'уже две ипотеки или пять объектов';
 return String(r).toLowerCase();
}
// Покупка целиком без банка: хватает ли денег на цену с оформлением (и переезд).
function cashBuy2759(q,live){
 const moving=live?c().cost*.015:0,need=q.purchase*1.03+moving;
 return {need,moving,ok:validListing41(q,'buy')&&s.properties.length<5&&s.cash+.001>=need};
}
function queueCashBuy2759(q,live){
 if(!cashBuy2759(q,live).ok)return false;
 if(!live)return queueHouseBuy41(q);
 // Выбрана заявка вдвоём — и без банка переезжаете вдвоём (как написано в строке «Семья»).
 const together=partnerHere2759(mortgageJoint2759[q.id]||null)?.id||null;
 queueCommand05('house2759',{listing:JSON.parse(JSON.stringify(q)),live:true,together},'Купить и переехать · '+q.city);
 return true;
}
// Варианты взноса и срока на окне: прежние пять, плюс 60/70/80% (если хватает денег) со сроком, который проходит, плюс
// выбранный и тот, что проходит первым. Сначала те, что проходят.
function mortgagePlans2759(q,down,years,live){
 const list=[...mortgageLegacy2759],has=(d,y)=>list.some(([a,b])=>a===d&&b===y);
 for(const d of [.6,.7,.8]){
  const probe=mortgageQuote43(q,d,30,live);if(!probe||s.cash+.001<probe.upfront)continue;
  const y=[20,30,10].find(y=>{const x=mortgageQuote43(q,d,y,live);return x&&!x.reasons.length;})||30;
  if(!has(d,y))list.push([d,y]);
 }
 const best=mortgageBest2759(q,live);
 if(best&&!has(best.down,best.years))list.push([best.down,best.years]);
 if(!has(down,years))list.push([down,years]);
 const ok=list.map(([d,y])=>{const x=mortgageQuote43(q,d,y,live);return !!x&&!x.reasons.length;});
 return list.map((p,i)=>({p,i,ok:ok[i]})).sort((a,b)=>(b.ok-a.ok)||a.i-b.i).map(x=>x.p);
}
function incomeLine2759(x){return x.incomeParts2759.map(p=>p.label+' '+money(p.amount)).join(', ');}

// Окно «Ипотека: условия» (как в finance43.js, с новыми вариантами). Карточку поверх строит money2734.js.
mortgageOptions43=function(q,down=.2,years=20,live=true,joint){
 if(q?.id&&joint!==undefined)mortgageJoint2759[q.id]=joint||null;
 const x=mortgageQuote43(q,down,years,live);if(!x)return;
 const rate=String(+(x.rate*100).toFixed(1)).replace('.',','),p=mortgagePartner2759(),pm=partnerMonthly2759(p),cash=cashBuy2759(q,live);
 const best=x.reasons.length?mortgageBest2759(q,live):null;
 const lines=[
  'Цена '+money(q.purchase)+'. Взнос '+Math.round(down*100)+'%: '+money(q.purchase*down)+', оформление '+money(q.purchase*.03)+(live?', переезд '+money(x.moving):'')+'. Нужно сейчас '+money(x.upfront)+'.',
  'Банк оплачивает продавцу '+money(x.principal)+'. Фиксированная ставка '+rate+'%, срок '+years+' лет, платёж '+money(x.payment)+'/мес. Плановая сумма процентов без досрочного погашения '+money(x.payment*years*12-x.principal)+'.',
  x.income>0?'Доход для банка '+money(x.income)+'/мес.: '+incomeLine2759(x)+'. Платёж'+(x.otherLoans2759>=.5?' с другими кредитами':'')+' — '+pct2759((x.payment+x.otherLoans2759)/x.income)+' дохода (банк даёт до 40%), на жизнь уходит '+money(x.living2759)+'/мес.':'',
  x.reasons.length?x.details2759.map(d=>d.text).join('. ')+'.':'Доход и деньги проходят проверку банка.',
  best?'Проходит: '+planText2759(best.down,best.years)+' — платёж '+money(best.x.payment)+'/мес., сразу '+money(best.x.upfront)+'.':'',
  live?'После оформления вы переедете в этот объект.':'Объект покупается без смены вашего адреса.',
  familyLine2759(live,x.joint),
  x.joint?'Заявка вдвоём: '+x.partnerName2759+' — созаёмщик. Пока вы живёте вместе, '+x.partnerName2759+' вносит свою долю платежа вместе с общими расходами.':''
 ].filter(Boolean);
 const opts=[{label:'Запланировать покупку в ипотеку',disabled:!!x.reasons.length,fn:()=>queueMortgage43(q,down,years,live,x.joint)}];
 if(cash.ok)opts.push({label:'Купить целиком · без банка',hint:'сразу '+money(cash.need)+(live?' · переезд в следующем месяце':' · адрес не меняется'),fn:()=>queueCashBuy2759(q,live)});
 for(const [d,y] of mortgagePlans2759(q,down,years,live))opts.push({label:planLabel2759(d,y)+(d===down&&y===years?' · выбрано':''),fn:()=>mortgageOptions43(q,d,y,live)});
 opts.push({label:live?'Купить без переезда':'Купить и переехать',fn:()=>mortgageOptions43(q,down,years,!live)});
 if(p&&pm>=.5){
  const other=mortgageQuote43(q,down,years,live,x.joint?null:p.id);
  opts.push({label:x.joint?'Заявка только на вас':'Заявка вдвоём · '+p.name,hint:'доход для банка '+money(other?.income||0)+'/мес.'+(other&&!other.reasons.length?' · проходит':other?' · банк откажет: '+shortWhy2759(other):''),
   fn:()=>mortgageOptions43(q,down,years,live,x.joint?null:p.id)});
 }
 opts.push({label:'К объявлению',fn:()=>housingOfferDetails41(q)});
 show('Ипотека: условия',lines.join('\n'),opts);
 petInsert38(houseDetails41(q));
};

const queueMortgageBase2759=queueMortgage43;
queueMortgage43=function(q,down,years,live,joint){
 if(joint===undefined)joint=mortgageJoint2759[q?.id]||null;
 const x=mortgageQuote43(q,down,years,live,joint);
 if(!x||x.reasons.length)return false;
 queueCommand05('mortgage43',{listing:JSON.parse(JSON.stringify(q)),down,years,live,joint:x.joint||null},'Купить в ипотеку · '+q.city);
 return true;
};
// Созаёмщик, который живёт с вами, переезжает в купленное жильё вместе с вами. Без этого moveHome (leaveHome) снимал
// «живёте вместе», и платёж, на который банк дал ипотеку вдвоём, с первого месяца ложился на вас одного.
function partnerHere2759(id){
 const p=id?living(id):null;
 return p&&p.id===currentPartner()?.id&&p.country===s.country&&p.age>=18&&(p.cohabit||s.housing?.occupant===p.id)?p:null;
}
function moveTogether2759(id,run){
 const p=partnerHere2759(id);if(!p)return run();
 const mv=moveHome;
 moveHome=function(mode,city,area,propertyId=null,personId=null,...rest){moveHome=mv;return mv.call(this,mode,city,area,propertyId,mode==='own'&&!personId?p.id:personId,...rest);};
 let r;
 try{r=run();}finally{moveHome=mv;}
 try{
  if(p.alive&&s.housing?.occupant===p.id){
   p.cohabit=true;p.separateHome61=false;p.city18=residenceCity();
   const z=family54(),a=z.agreements[p.id];
   if(a){a.country=s.country;a.city=residenceCity();}else z.agreements[p.id]=householdDefault54(p);
  }
 }catch(e){console.error(e);}
 return r;
}
const mortgageBuyBase2759=mortgageBuy43;
mortgageBuy43=function(q,down,years,live,joint){
 if(!q)return false;
 const had=Object.prototype.hasOwnProperty.call(mortgageJoint2759,q.id),prev=mortgageJoint2759[q.id],want=(joint===undefined?prev:joint)||null;
 mortgageJoint2759[q.id]=want;
 const partner=want?mortgagePartner2759():null,p=partner?.id===want?partner:null,before=s.debts.length;
 let ok=false;
 try{ok=moveTogether2759(live&&p?p.id:null,()=>mortgageBuyBase2759(q,down,years,live));}
 finally{if(had)mortgageJoint2759[q.id]=prev;else delete mortgageJoint2759[q.id];}
 if(ok&&p){
  const d=s.debts.slice(before).find(d=>d.mortgage43);
  if(d){d.coBorrower2759={id:p.id,name:p.name,since:s.clock.ticks};log('Ипотека вдвоём',p.name+' — созаёмщик. Пока вы живёте вместе, '+p.name+' вносит свою долю платежа вместе с общими расходами.','Недвижимость');save();}
 }
 return ok;
};
const executeBase2759=executeCommand05;
executeCommand05=function(t){
 if(t?.action==='mortgage43'){
  const p=t.payload||{};
  if(t.country!==s.country||!mortgageBuy43(p.listing,p.down,p.years,p.live,p.joint||null))log('Ипотека не оформлена','К моменту выполнения изменились доход, средства, срок объявления или кредитные условия. Деньги не списаны.','Недвижимость');
  return;
 }
 if(t?.action==='house2759'){
  const p=t.payload||{},n=s.properties.length;
  if(t.country!==s.country||!buyHouse41(p.listing)){log('Покупка не состоялась','Предложение истекло, страна изменилась, не хватает денег или достигнут лимит объектов. Деньги не списаны.','Недвижимость');return;}
  const prop=s.properties.length>n?s.properties.at(-1):null;
  if(p.live&&prop){moveTogether2759(p.together||null,()=>moveHome('own',prop.city,prop.area,prop.id));if(!(s.housing?.mode==='own'&&s.housing.propertyId===prop.id))log('Переезд не состоялся','Жильё куплено, но на переезд сейчас не хватает денег. Переехать можно позже — в «Жильё и дорога».','Недвижимость',true);}
  return;
 }
 return executeBase2759(t);
};
// Общая ипотека входит в общие расходы, пока созаёмщик живёт с вами (family54: доля партнёра — sharedBill54 × (1 − share)).
const sharedBillBase2759=sharedBill54;
sharedBill54=function(...args){
 const base=sharedBillBase2759.apply(this,args);
 try{
  const p=currentPartner();if(!p)return base;
  const extra=s.debts.filter(d=>d.mortgage43&&d.coBorrower2759?.id===p.id&&mortgageTotal43(d)>.001).reduce((n,d)=>n+d.payment*debtRatio(d),0);
  return Number.isFinite(extra)?base+extra:base;
 }catch(e){console.error(e);return base;}
};
// Окно ипотеки: кто созаёмщик.
const mortgageMenuBase2759=mortgageMenu43;
mortgageMenu43=function(id,...rest){
 const d=s.debts.find(d=>d.id===id&&d.mortgage43),co=d?.coBorrower2759;
 if(!co)return mortgageMenuBase2759(id,...rest);
 const old=show,p=living(co.id),together=!!(p&&currentPartner()?.id===p.id&&mortgagePartner2759());
 const note=together?'Пока вы живёте вместе, '+co.name+' вносит свою долю платежа вместе с общими расходами.':p?'Сейчас вы живёте отдельно: платёж целиком на вас.':'Теперь платёж целиком на вас.';
 show=function(t,text,...more){show=old;return old.call(this,t,String(text??'')+'\nСозаёмщик — '+co.name+'. '+note,...more);};
 try{return mortgageMenuBase2759(id,...rest);}finally{show=old;}
};

// Поздние обёртки: карточка ипотеки и объявление (money2734.js грузится после этого файла).
function late2759(){
 if(late2759.done||typeof mortgageBuild2734!=='function'||typeof money2734Base==='undefined')return;
 late2759.done=true;
 // «Рассчитать ипотеку» без взноса и срока — сразу вариант, который проходит; на «банк откажет» — коротко почему.
 const options=mortgageOptions43;
 mortgageOptions43=function(q,...rest){
  if(q&&!rest.length){const best=mortgageBest2759(q,true);if(best)return mortgageOptions43(q,best.down,best.years,true);}
  const live=rest[2]??true,down=rest[0]??.2,years=rest[1]??20;
  const old=show;let done=false;
  show=function(t,text,opts,...more){
   if(done||t!=='Ипотека: условия'||!Array.isArray(opts))return old.call(this,t,text,opts,...more);
   done=true;
   const list=opts.map(o=>{
    const l=String(o?.label||''),k=/^(\d+)% взнос · (\d+) лет/.exec(l);
    const x=k?mortgageQuote43(q,+k[1]/100,+k[2],live):l==='Купить без переезда'||l==='Купить и переехать'?mortgageQuote43(q,down,years,!live):null;
    if(!x||!x.reasons.length||!/банк откажет/.test(o.hint||''))return o;
    return {...o,hint:String(o.hint).replace(/банк откажет(?!:)/,'банк откажет: '+shortWhy2759(x))};
   });
   return old.call(this,t,text,list,...more);
  };
  try{return options.call(this,q,...rest);}finally{show=old;}
 };
 // Карточка: доход для банка, причины с числами, кнопка варианта, который проходит, заявка вдвоём, покупка целиком.
 const build=mortgageBuild2734;
 mortgageBuild2734=function(q,down,years,live,ctx){
  const card=build(q,down,years,live,ctx);
  try{augmentCard2759(card,q,down,years,live);}catch(e){console.error(e);}
  return card;
 };
 // Объявление: на «Рассчитать ипотеку» — вариант, который проходит (mortgageQuote43(q) — он и есть).
 const offer=housingOfferDetails41;
 housingOfferDetails41=function(q,...rest){
  if(!q||q.operation!=='buy')return offer.call(this,q,...rest);
  const old=show;let done=false;
  show=function(t,text,opts,...more){
   if(done||!Array.isArray(opts))return old.call(this,t,text,opts,...more);
   done=true;
   const x=mortgageQuote43(q);
   const list=opts.map(o=>o?.label==='Рассчитать ипотеку'&&x&&o.hint?{...o,hint:String(o.hint).replace(/при взносе \d+% на \d+ лет/,'при взносе '+Math.round(x.down*100)+'% на '+x.years+' лет')+(x.reasons.length?' · банк откажет: '+shortWhy2759(x):'')}:o);
   return old.call(this,t,text,list,...more);
  };
  try{return offer.call(this,q,...rest);}finally{show=old;}
 };
}
// Кто переезжает с вами: заявка вдвоём — партнёр тоже; иначе, как при других переездах (family270.js), партнёр остаётся
// по прежнему адресу, а дети и питомцы едут с вами.
function familyLine2759(live,joint){
 if(!live||typeof familyMoveParts270!=='function')return '';
 const p=partnerHere2759(joint),parts=familyMoveParts270(p?p.id:'');
 if(p)parts.unshift('Переезжаете вдвоём: '+p.name+'.');
 return parts.join(' ');
}
function augmentCard2759(card,q,down,years,live){
 const x=mortgageQuote43(q,down,years,live);if(!x)return;
 const fam=familyLine2759(live,x.joint);
 if(fam){const i=card.rows.findIndex(r=>r.label==='Адрес');card.rows.splice(i<0?card.rows.length:i+1,0,{label:'Семья',value:fam});}
 const at=card.rows.findIndex(r=>r.label==='Платёж');
 if(x.income>0)card.rows.splice(at<0?card.rows.length:at+1,0,{label:'Доход для банка',value:money(x.income)+'/мес.',
  note:[incomeLine2759(x),'платёж'+(x.otherLoans2759>=.5?' с другими кредитами':'')+' — '+pct2759((x.payment+x.otherLoans2759)/x.income)+' дохода, банк даёт до 40%'].join(' · ')});
 // «Не хватает»: строки с числами; у первой без своей кнопки — вариант, который проходит.
 card.need=x.reasons.map((r,i)=>{
  const d=x.details2759[i]||{},old=card.need[i]||{text:r};
  return d.income||d.short?{...old,text:d.text||old.text,when:d.when||old.when,short:d.short}:old;
 });
 if(x.reasons.length){
  const best=mortgageBest2759(q,live),p=mortgagePartner2759(),together=!best&&!x.joint&&p?mortgageBest2759(q,live,p.id):null;
  const slot=card.need.find(n=>n&&!n.fix);
  if(slot&&best&&!(best.down===down&&best.years===years))slot.fix={label:cap2759(planText2759(best.down,best.years))+' — платёж '+money(best.x.payment)+'/мес., проходит',fn:()=>mortgageOptions43(q,best.down,best.years,live)};
  else if(slot&&together)slot.fix={label:'Заявка вдвоём · '+p.name+': '+planText2759(together.down,together.years)+' — платёж '+money(together.x.payment)+'/мес., проходит',fn:()=>mortgageOptions43(q,together.down,together.years,live,p.id)};
  else if(slot&&!best&&x.details2759.some(d=>d.income)){
   const need=needIncome2759(q,live,x.joint);
   if(need>0)slot.when=(slot.when?slot.when+' · ':'')+'банк одобрит при доходе от '+money(need)+'/мес.';
  }
 }
 card.settings=[...(card.settings||[]),/^Заявка вдвоём · /,'Заявка только на вас'];
 if(cashBuy2759(q,live).ok)card.main=[...(card.main||[]),'Купить целиком · без банка'];
 if(x.joint&&!x.reasons.length)card.status={text:'Банк одобрит заявку вдвоём при нынешних доходах и деньгах',tone:'ok'};
 card.more=[...(card.more||[]),{title:'Что считает банк',text:'Устойчивый доход в месяц: зарплату или пенсию, своё дело и гонорары — в среднем за последние 12 месяцев после налога, сдачу жилья, а при заявке вдвоём — и доход того, с кем вы живёте. Платёж вместе с другими кредитами — не больше 40% этого дохода, и после платежа и расходов на жизнь должно оставаться не меньше 5%.'}];
}
function cap2759(t){return t?t[0].toUpperCase()+t.slice(1):t;}
// Какой доход нужен, чтобы прошёл самый лёгкий вариант (самый большой взнос, на который хватает денег, на 30 лет).
function needIncome2759(q,live,joint){
 const d=[...mortgageDowns2759].reverse().find(d=>{const x=mortgageQuote43(q,d,30,live,joint);return x&&s.cash+.001>=x.upfront;})||.1;
 const x=mortgageQuote43(q,d,30,live,joint);if(!x)return 0;
 return round3_2759(Math.max((x.payment+x.otherLoans2759)/.4,(x.living2759+x.otherLoans2759+x.payment)/.95));
}
if(typeof document!=='undefined')document.addEventListener('DOMContentLoaded',late2759);
// На случай вызова раньше DOMContentLoaded (проверки, переход по ссылке): поздние обёртки — при первом обращении.
const lateQuote2759=mortgageQuote43;
mortgageQuote43=function(...args){late2759();return lateQuote2759.apply(this,args);};

// ---------- 3. Своя машина к туристическим местам ----------

function point2759(country,city){
 const p=typeof cityCoordinates173==='object'?cityCoordinates173[country]?.[city]:null;
 if(p)return {lat:p[1],lon:p[0],access:null};
 const t=typeof tourPoints2759==='object'?tourPoints2759[country]?.[city]:null;
 if(t)return {lat:t[0],lon:t[1],access:t[2]||null};
 if(typeof tourAbroad103==='object'&&tourAbroad103[country]&&typeof tourPlaces123==='function'){
  const row=tourPlaces123(country).find(r=>r[0]===city);
  if(row)return {lat:row[3],lon:row[4],access:tourAbroad2759[country]?.[city]||tourAbroad2759[country]?.['*']||null};
 }
 return null;
}
function km2759(a,b){
 const r=Math.PI/180,h=Math.sin((b.lat-a.lat)*r/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin((b.lon-a.lon)*r/2)**2;
 return 12742*Math.asin(Math.sqrt(Math.min(1,h)));
}
function roadZone2759(country){for(const [z,list] of Object.entries(roadZones2759))if(list.includes(country))return z;return country;}
// Материк страны (зона по суше или отдельная страна); острова — отдельно.
const continentZones2759={europe:'eurasia',seasia:'eurasia',namerica:'america',samerica:'america',safrica:'africa'};
const continentCountries2759={cn:'eurasia',in:'eurasia',kr:'eurasia',vn:'eurasia',ae:'eurasia',sa:'eurasia',jo:'eurasia',lb:'eurasia',eg:'africa',tz:'africa',mu:'africa',cu:'america',bs:'america',jm:'america',do:'america'};
const islands2759=['jp','au','nz','tw','id','cy','cu','bs','jm','do','fj','mu','mv','tz'];
function continentOf2759(country){return continentZones2759[roadZone2759(country)]||continentCountries2759[country]||'island:'+country;}
// Туристическое место (не город игры), куда считается дорога своей машиной.
function tourDest2759(d){
 if(!d?.country||!d.city||typeof touristOnly102!=='function'||!touristOnly102(d.country,d.city))return null;
 const home=point2759(s.country,residenceCity()),dest=point2759(d.country,d.city);
 return home&&dest?{home,dest}:null;
}
// Автопаром по дороге: туристическое место с паромом или пролив Марокко — Европа. Паром не нужен, только если вы живёте
// на том же острове (access.same — города игры там, например Денпасар для Убуда); по расстоянию это не решить: с
// материка остров часто ближе порта (Барселона — Ибица, Бангкок — Самуи).
function ferry2759(d){
 const t=tourDest2759(d),a=t?.dest.access,f=a?.ferry;
 if(f&&!(d.country===s.country&&(a.same||[]).includes(residenceCity())))return {hours:f,port:a.port?{lat:a.port[0],lon:a.port[1]}:null};
 if(d&&d.country!==s.country&&[s.country,d.country].includes('ma')&&roadZone2759(d.country)===roadZone2759(s.country))return {hours:1,port:null};
 return null;
}
const journeyKmBase2759=journeyKm57;
// Куда на машине не доехать, машину в цене не считаем: цена — как поездки обычным транспортом (раньше — 800 км или
// пробег через океан). Что машиной нельзя, говорит «Не хватает» с кнопкой «Дорога».
const quoteJourneyBase2759=quoteJourney57;
quoteJourney57=function(d,...rest){
 try{if(d?.journey57?.route==='car'&&carBlocked2759(d))d={...d,journey57:{...d.journey57,route:'public'}};}catch(e){console.error(e);}
 return quoteJourneyBase2759.call(this,d,...rest);
};
// Пробег с разрядами: «10 815 км», а не «10815 км».
const journeySectionsBase2759=journeySections57;
journeySections57=function(...args){
 const list=journeySectionsBase2759.apply(this,args);
 try{for(const sec of list||[])for(const r of sec?.rows||[])if(r?.label==='Примерный пробег')r.value=String(r.value).replace(/^\d{4,}/,n=>Number(n).toLocaleString('ru-RU'));}catch(e){console.error(e);}
 return list;
};
journeyKm57=function(d){
 try{
  const t=tourDest2759(d);
  if(t){const f=ferry2759(d),to=f?.port||t.dest;return Math.round((km2759(t.home,to)*1.25+15)*2);}
 }catch(e){console.error(e);}
 return journeyKmBase2759(d);
};
const journeyCarQuoteBase2759=journeyCarQuote57;
journeyCarQuote57=function(d){
 // Место за границей без городов игры (Зальцбург, Брюгге…): journeys57.js сравнивает его со столицей страны по списку
 // городов — у таких стран списка нет. Тот же расчёт, стоянка без надбавки столицы.
 const q=cities[d?.country]?journeyCarQuoteBase2759(d):(()=>{
  const members=journeyParty57(d),v=vehicle56(d.journey57?.car),km=journeyKm57(d),k=c().cost;
  const r={km,fuel:Math.round(km*k*.000004),parking:Math.round(k*.00018*d.days),ferry:Math.round(s.country==='uk'?k*.008:0),seats:Math.round(members.filter(p=>p.age<12).length*k*.0007),wear:Math.round(km*k*.0000015),vehicle:v?.id||null};
  r.total=r.fuel+r.parking+r.ferry+r.seats+r.wear;return r;
 })();
 try{
  const f=ferry2759(d);
  if(f&&q){const fee=Math.round(c().cost*(.004+.0012*f.hours));q.ferry=(q.ferry||0)+fee;q.total=(q.total||0)+fee;q.ferryHours2759=f.hours;}
 }catch(e){console.error(e);}
 return q;
};
// Куда своей машиной правда не доехать — причина; иначе пусто.
function carBlocked2759(d){
 const place=d.city||countries[d.country]?.name||'Это место';
 const t=typeof touristOnly102==='function'&&touristOnly102(d.country,d.city)?point2759(d.country,d.city):null;
 if(typeof touristOnly102==='function'&&touristOnly102(d.country,d.city)&&!t)return 'Для этого направления выберите общественный транспорт';
 const no=t?.access?.no;
 if(no==='island')return place+' — остров без автопарома: на машине не доехать, только самолёт';
 if(no==='noroad')return place+' — дорог туда нет: на машине не доехать, только самолёт';
 if(no==='boat')return place+' — машины туда не возят, только катер: на машине не доехать';
 if(d.country===s.country)return '';
 if(roadZone2759(d.country)===roadZone2759(s.country))return '';
 if(islands2759.includes(d.country)||islands2759.includes(s.country))return place+' — за морем: на машине не доехать, только самолёт';
 if(continentOf2759(d.country)!==continentOf2759(s.country))return place+' — на другом континенте: на машине не доехать, только самолёт';
 return place+' — на своей машине через границы туда не проехать: только самолёт';
}
// Причины «на машине не доехать» — те же, что «выберите общественный транспорт»: у них в «Не хватает» кнопка «Дорога»
// (trips272.js tripFix272 узнаёт причины по началу строки).
const tripFixBase2759=typeof tripFix272==='function'?tripFix272:null;
if(tripFixBase2759)tripFix272=function(w,ctx,...rest){
 return tripFixBase2759.call(this,typeof w==='string'&&/на машине не доехать|через границы туда не проехать/.test(w)?'Для этого направления поездка на своей машине недоступна':w,ctx,...rest);
};
carJourneyWhy57=function(d){
 const j=d.journey57,why=[];if(j?.route!=='car')return why;
 const block=carBlocked2759(d);if(block)return [block];
 const v=vehicle56(j.car);if(!v||!vehicleUsable56(v)||v.kind!=='car')return ['Нужен свой исправный местный автомобиль и допуск к вождению'];
 if(v.condition<55)why.push('Перед дальней дорогой нужно обслуживание: состояние от 55/100');
 const f=ferry2759(d);
 if(journeyKm57(d)/70+(f?f.hours*2:0)>d.days*8)why.push('Слишком много дороги для выбранной длительности отпуска');
 const members=journeyParty57(d);if(members.some(p=>p.country!==s.country||p.city!==residenceCity()))why.push('Для общей машины все участники должны выезжать из вашего города');
 const carried=j.pets.filter(p=>p.mode==='bring').length;if(members.length+carried>vehicleModel56(v.model).seats)why.push('Не хватает мест: каждому человеку и каждой переноске нужно отдельное место');
 return why;
};
