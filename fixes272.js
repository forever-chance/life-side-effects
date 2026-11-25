'use strict';
// Сборка 272: мелкие правки по отзывам.
// 1. Болезнь ребёнка младше 12 лет: к врачу ведут и платят родители (notices270), выбирать ребёнку нечего.
//    В окне остаётся одна кнопка «Понятно»; строка о восстановлении — в тексте над ней, а не под кнопками.
//    Окно болезни взрослого не меняется.
// 2. «Попросить отсрочку на три месяца» у долга без графика (долг по бытовым счетам и другие без срока и начала):
//    extendDebt считал новый график банковского кредита и писал «Новый платеж не число … на NaN месяцев».
//    Для такого долга кнопка делает то, что обещает: срок оплаты сдвигается на три месяца, один раз.
{
 const base272=healthMenu;
 healthMenu=function(...args){
  const r=base272.apply(this,args);
  try{
   const ill=s?.illness,m=document.getElementById('modal'),h=m?.querySelector('h2');
   if(ill&&!s.dead&&s.age<12&&m?.open&&h&&h.textContent.trim()===ill.name){
    m.querySelectorAll('.options button').forEach(b=>{if(b.textContent.replace(/\s+/g,' ').trim()!=='Понятно')b.hidden=true;});
    for(const b of [...m.children].filter(x=>x.tagName==='BUTTON'))b.remove();
    const copy=m.querySelector('.dialog-copy20'),tail=[...m.children].filter(x=>x.tagName==='P'&&/Восстановление/.test(x.textContent));
    for(const p of tail){p.remove();if(copy){const q=document.createElement('p');q.textContent=p.textContent.replace(ill.name+' · ','');copy.append(q);}}
   }
  }catch(e){}
  return r;
 };
}
{
 const base272=extendDebt;
 extendDebt=function(id,...args){
  const d=s?.debts?.find(x=>x.id===id);
  if(d&&d.type!=='friend'&&d.balance&&!d.extended&&!(Number.isFinite(d.term)&&Number.isFinite(d.started))){
   d.due=Math.max(Number.isFinite(d.due)?d.due:s.clock.ticks,s.clock.ticks)+3;d.extended=true;
   log('Отсрочка по долгу','Срок оплаты сдвинут на три месяца. Долг остаётся, отсрочка — один раз.','Финансы');
   if(typeof save==='function')save();
   return;
  }
  return base272.call(this,id,...args);
 };
}
