'use strict';
// Сборка 272.2: «Имя хочет жить в другом городе» — в каком, не говорилось: город выбирался только в момент переезда
// (autonomy55, план 'home': visualHash49(plan.id) по городам страны, кроме нынешнего). Выбор однозначный, поэтому
// город считается заранее тем же правилом и попадает в заголовок решения: «Имя хочет переехать: Город».
// Сам переезд не меняется: он по-прежнему выбирает город при завершении плана, и это тот же город, пока партнёр
// не переехал раньше сам.
function partnerMoveCity2722(p,plan){
 if(!p||!plan||typeof cities!=='object'||!cities[p.country])return null;
 const here=p.city18||cities[p.country][0],list=cities[p.country].filter(c=>c!==here);
 if(!list.length||typeof visualHash49!=='function')return null;
 return list[Math.floor(visualHash49(plan.id)*list.length)];
}
function partnerMoveTitles2722(){
 if(!s||typeof autonomy55!=='function')return;
 for(const q of autonomy55().decisions||[]){
  if(q.kind!=='move'||q.status!=='offered'||q.city2722)continue;
  const p=living(q.person),a=p&&typeof adultState55==='function'?adultState55(p):null,plan=a?.plan;
  if(!plan||plan.id!==q.plan)continue;
  const city=partnerMoveCity2722(p,plan);
  if(!city)continue;
  q.city2722=city;
  // Если город назначения — ваш город, человек переезжает к вам, а не «куда-то».
  const mine=typeof residenceCity==='function'&&residenceCity()===city;
  q.title=p.name+(mine?' хочет переехать к вам: ':' хочет переехать: ')+city;
  // Запись в истории (и верхняя полоса, если она последняя) появилась раньше, чем решение получило город: та же строка.
  for(const e of (s.log||[]).slice(0,60))if(e?.decision24?.kind==='agency55'&&e.decision24.id===q.id)e.title=q.title;
 }
}
{
 const ensureBase2722=ensureUX;
 ensureUX=function(...args){const r=ensureBase2722.apply(this,args);try{partnerMoveTitles2722();}catch(e){}return r;};
}
