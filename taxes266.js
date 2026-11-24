'use strict';
// Сборка 266: налоги (docs/ROADMAP.md, «Налоги и стоки»).
// Зарплата в игре и так «на руки», поэтому облагается только то, что игрок зарабатывает сам: выплаты из своего дела,
// творческие гонорары и сдача жилья. Ставка упрощённая, по стране, 20–30%. Налог за год списывается вместе с итогами
// прожитого года — строкой в той же записи. Если денег не хватает, остаток переходит в недоимку и через год
// списывается с пеней 10%.

const taxRates266={nl:.3,rs:.2,ru:.2,us:.25,br:.25,jp:.25,fr:.3,es:.25,de:.3,uk:.25,ca:.25,kr:.22,cn:.2,mx:.25,
 it:.3,au:.25,tr:.2,za:.25,th:.2,no:.3,in:.2,id:.2,eg:.2,ma:.2,pl:.2};

function taxRate266(country=s.country){return taxRates266[country]??.25;}
function tax266(){return s.tax266??={business:0,creative:0,rent:0,arrears:0};}

// Выплаты из своего дела.
const distributeBase266=distributeEnterprise158;
distributeEnterprise158=function(...args){
 const income=distributeBase266.apply(this,args);
 if(s&&Number.isFinite(income)&&income>0)tax266().business+=income;
 return income;
};

// Гонорары: заказ оплачивается при завершении работы.
const finishTaskBase266=finishTask;
finishTask=function(t,...args){
 const apps=typeof creative47==='function'&&s?creative47().applications:[];
 const before=new Set(apps.filter(a=>a.status==='completed').map(a=>a.id));
 const out=finishTaskBase266.call(this,t,...args);
 for(const a of apps)if(a.status==='completed'&&!before.has(a.id)&&a.paid>0)tax266().creative+=a.paid;
 return out;
};

// Сдача жилья: доход начисляется в месячном цикле жилья; для налога — ожидаемая сумма с учётом простоя (8% месяцев).
const autonomousMonthBase266=autonomousMonth;
autonomousMonth=function(...args){
 const out=autonomousMonthBase266.apply(this,args);
 if(s&&!s.dead&&typeof propertyRental41==='function')
  for(const p of s.properties||[])if(p.rented){const r=propertyRental41(p);if(Number.isFinite(r)&&r>0)tax266().rent+=r*.92;}
 return out;
};

// Итоги года: налог строкой в той же записи.
const rollYearBase266=rollYear;
rollYear=function(...args){
 const out=rollYearBase266.apply(this,args);
 if(!s||s.dead)return out;
 const t=tax266(),base=t.business+t.creative+t.rent,rate=taxRate266();
 const due=Math.round(base*rate+t.arrears*1.1);
 if(due<=0){t.business=t.creative=t.rent=0;return out;}
 const paid=payExpense23(due,'Налог за год','tax266:'+s.year)?due:0;
 const parts=[t.business&&'своё дело',t.creative&&'гонорары',t.rent&&'сдача жилья'].filter(Boolean);
 const line=paid?` Налог ${Math.round(rate*100)}% с дохода (${parts.join(', ')})${t.arrears?' и прошлогодняя недоимка с пеней':''}: ${money(due)}.`
  :` Налог ${money(due)} заплатить не из чего — он перейдёт на следующий год с пеней 10%.`;
 t.arrears=paid?0:due;
 t.business=t.creative=t.rent=0;
 const entry=s.log.find(e=>e.title==='Итоги прожитого года'&&e.year===s.year);
 if(entry)entry.text+=line;else log('Налоги',line.trim(),'Деньги');
 return out;
};

// Подсказки: ставка видна там, где появляется доход.
if(typeof enterpriseMenu152==='function'){
 const enterpriseMenuBase266=enterpriseMenu152;
 enterpriseMenu152=function(...args){
  const b=s.enterprise152;
  if(b?.status!=='active')return enterpriseMenuBase266.apply(this,args);
  const showBase=show;
  show=function(title,text,...rest){show=showBase;return showBase.call(this,title,text+` С выплат из дела — налог ${Math.round(taxRate266(b.country)*100)}% в конце года.`,...rest);};
  try{return enterpriseMenuBase266.apply(this,args);}finally{show=showBase;}
 };
}
if(typeof creativeTrackMenu47==='function'){
 const creativeMenuBase266=creativeTrackMenu47;
 creativeTrackMenu47=function(...args){
  const showBase=show;
  show=function(title,text,...rest){show=showBase;return showBase.call(this,title,text+` С гонораров — налог ${Math.round(taxRate266()*100)}% в конце года.`,...rest);};
  try{return creativeMenuBase266.apply(this,args);}finally{show=showBase;}
 };
}
