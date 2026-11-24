'use strict';
// Сборка 265: экономика по каждому виду дела.
//
// В 263 спрос и выработка были заданы только для студии, услуг и магазина. Каталог 253 добавляет ещё 13 видов
// (кафе, кинотеатры, фермы, гостиницы…), у них спрос получался NaN, а за ним выручка и деньги дела.
// И даже внутри «магазина» доля переменных расходов в таблице — от 33–61% у цветочного до 65–86% у продуктового:
// с одной выработкой на всех продуктовый всегда в минусе.
// Теперь:
// - спрос в среднем городе — 1.8 «рабочих места» для любого вида; разброс даёт приживаемость места и рынок;
// - выработка одного места рассчитывается для каждого дела из его собственных цифр — аренды и накладных обычного
//   помещения в его городе и доли переменных расходов — так, чтобы хорошо устроенное малое дело (владелец и сотрудник
//   при среднем спросе) кормило владельца примерно на уровне средней зарплаты. Дорогое помещение по-прежнему дороже,
//   а дело с большой арендой (гостиница) в одиночку не тянется;
// - кинотеатр отдаёт прокатчикам около половины билетной выручки: переменные расходы 47% (в каталоге было 16%);
// - сезонность по виду: туризм, прокат, фермы и размещение — летом сильнее, культура и досуг — зимой.

const businessSeason265={
 tourism253:[.3,6],rental253:[.3,6],farm253:[.25,7],lodging253:[.25,6],
 culture253:[.15,0],leisure253:[.12,0],food253:[.1,6]
};

let UNIT_K265=2.4;
function businessName265(b){return typeof businessById253!=='undefined'?businessById253[b.specialty]?.name||'':'';}

const enterpriseMarketBase265=enterpriseMarket165;
enterpriseMarket165=function(b,...args){
 const m=enterpriseMarketBase265.call(this,b,...args);
 if(m&&/Кинотеатр/.test(businessName265(b)))m.variable=.47;
 return m;
};

businessBase263=function(b){return 1.8;};

businessUnit263=function(b){
 if(Number.isFinite(b.unit265))return b.unit265;
 const W=businessW263(b),m=enterpriseMarket165(b,enterpriseSpaces157.standard);
 const fixed=m?m.rent+m.overhead:enterpriseBaseCost157(b)*(.6+.4);
 const variable=Math.min(.85,m?.variable??.3);
 // Владелец и сотрудник при спросе 1.8: выручка·(1 − переменные) = доход владельца (1.1 W) + сотрудник (0.8 W) + постоянные.
 b.unit265=+((UNIT_K265*W+fixed)/(1.8*(1-variable))/W).toFixed(3);
 return b.unit265;
};

businessSeason263=function(b){
 const [amp,peak]=businessSeason265[b.type]||[.08,3];
 return 1+amp*Math.cos(((s.clock.month??0)-peak)/12*2*Math.PI);
};

// Сохранения, где дело из каталога успело получить NaN (сборка 263): деньги дела — запас на два месяца, история — без NaN.
function repairBusiness265(){
 if(!s||typeof ownedEnterprises168!=='function')return;
 for(const b of ownedEnterprises168()){
  if(b.status!=='active')continue;
  if(!Number.isFinite(b.cash)){
   const m=enterpriseMarket165(b);
   b.cash=Math.round(2*((m?m.rent+m.overhead:enterpriseBaseCost157(b))+enterpriseWage155(b)*enterpriseStaff155(b).length));
   b.repair265=true;
  }
  b.history=(b.history||[]).filter(h=>Number.isFinite(h.sales)&&Number.isFinite(h.costs)&&Number.isFinite(h.cash));
 }
}
const loadCharacterBase265=loadCharacter;
loadCharacter=function(...args){const out=loadCharacterBase265.apply(this,args);repairBusiness265();return out;};
const autonomousMonthBase265=autonomousMonth;
autonomousMonth=function(...args){repairBusiness265();return autonomousMonthBase265.apply(this,args);};
if(s)repairBusiness265();
