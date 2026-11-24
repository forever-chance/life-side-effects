'use strict';
// Сборка 270: счета.
// Ё-проход 268 (tools/yo_fix.py) считал «счёта» словом «только через ё» и испортил 33 строки с «счета» во множественном
// числе: «Неоплаченные счёта», «Деньги, долги и счёта», «Старые счёта сохранены». В коде они исправлены точечно
// (/* 270: … */ в finance32.js, finance39.js, finance40.js и ещё восьми файлах), а «счёта» внесено в омографы
// text_audit.py и yo_fix.py. Родительный единственного («со счёта», «остаток счёта») остаётся с ё.
// Вместе с текстом испортился ключ долга за бытовые услуги: livingBill32 ищет долг по точному имени кредитора
// 'Бытовые счета · '+страна. Сохранения до 268 хранят 'Бытовые счета · nl', сохранения 268–269 — 'Бытовые счёта · nl',
// а жизнь, которая прошла через обе сборки, — два отдельных долга одному и тому же кредитору.
// Этот файл при открытии сохранения:
// 1. Возвращает «счета» во всех строках состояния, где ё-проход оставил «счёта» во множественном числе: имя кредитора
//    в долгах (creditor32), ключи и кредиторы квитанций finance32/finance39, строки месячного расчёта finance40
//    (подпись, кредитор, ссылки receipt32/receipt39 на эти же квитанции), заявки на помощь близких, снимки долгов,
//    записи журнала и решения («Можно начать закрывать старые счёта»). Ключ квитанции меняется везде одинаково,
//    поэтому ссылки на него не рвутся.
// 2. Сливает долги за бытовые услуги одному кредитору в один: суммы складываются, остаются самое раннее начало,
//    самый ранний срок, наибольшее число пропусков и самый тяжёлый статус; история и договорённости с кредитором
//    сохраняются. Остаётся долг, начатый раньше, на его месте в списке; ссылки на слитый долг в строках месячного
//    расчёта, заявках на помощь и расчётах залога переводятся на оставшийся. В следующем месяце livingBill32 находит
//    именно его.
// Повторный запуск ничего не меняет.

// «счёта» во множественном числе: слово перед ним показывает число (прилагательное во мн. ч., «долги и», «оплатить»).
const billsRe270=/(^|[^А-Яа-яЁё])((?:[Бб]ытовые|[Сс]тарые|[Тт]екущие|[Нн]овые|[Нн]еоплаченные|[Дд]оговорные|[Зз]акрыть|[Оо]платить|[Рр]азобрать)\s|(?:[Дд]олги|[Кк]редиты|[Аа]ренда)\sи\s|[Бб]юджет,\s)счёта(?![А-Яа-яЁё])/g;
const billsKey270='Бытовые счета · ';
function billsText270(v){return v.includes('счёта')?v.replace(billsRe270,'$1$2счета'):v;}
// Все строковые значения состояния (без ключей объектов: имён кредиторов в ключах нет).
function billsTexts270(root){
 let n=0;const seen=new Set(),stack=[root];
 while(stack.length){
  const o=stack.pop();if(!o||typeof o!=='object'||seen.has(o))continue;seen.add(o);
  for(const k of Object.keys(o)){
   const v=o[k];
   if(typeof v==='string'){const out=billsText270(v);if(out!==v){o[k]=out;n++;}}
   else if(v&&typeof v==='object')stack.push(v);
  }
 }
 return n;
}
// Ссылки на слитые долги: строки месячного расчёта (debt, id 'debt:…'), история распределений, заявки на помощь
// (target.debtId, target.rowId), расчёты залога (items[].debt). Снимки долгов для сверки (finance36, finance39.opening)
// не трогаются: это история.
function billsRelink270(map){
 const swap=v=>map.has(v)?map.get(v):v.startsWith('debt:')&&map.has(v.slice(5))?'debt:'+map.get(v.slice(5)):v;
 const seen=new Set(),stack=[s.finance40,s.housing42,s.finance43];
 while(stack.length){
  const o=stack.pop();if(!o||typeof o!=='object'||seen.has(o))continue;seen.add(o);
  for(const k of Object.keys(o)){const v=o[k];if(typeof v==='string')o[k]=swap(v);else if(v&&typeof v==='object')stack.push(v);}
 }
 // Две строки «платёж по долгу» одного месяца теперь про один долг: одна строка, суммы вместе.
 const p=s.finance40?.period;
 if(Array.isArray(p?.rows)){
  const rows=[];
  for(const r of p.rows){
   const same=rows.find(q=>q.id===r.id);
   if(same){same.due=(same.due||0)+(r.due||0);same.paid=(same.paid||0)+(r.paid||0);}else rows.push(r);
  }
  p.rows=rows;
 }
}
// Поля, которые сводятся по всем долгам сразу. Оставшийся долг не берёт их у слитого как недостающие: иначе график
// или история слитого долга попадут в сумму дважды (у старого долга графика нет, у нового есть — платёж удвоился бы).
const billsOwn270=new Set(['balance','principal','paid','missed','started','due','status32','history32','repayment35','previousPlans35','negotiation35','negotiations35','merged270']);
// Одна и та же договорённость (тот же объект или тот же id) — один раз.
function billsUniq270(list){
 const seen=new Set();
 return list.filter(x=>{const k=x&&typeof x==='object'&&x.id!=null?'id:'+x.id:x;if(seen.has(x)||seen.has(k))return false;seen.add(x);seen.add(k);return true;});
}
function billsJoin270(keep,parts){
 const all=[keep,...parts],sum=k=>all.reduce((n,d)=>n+(Number(d[k])||0),0),min=k=>Math.min(...all.map(d=>d[k]).filter(Number.isFinite));
 const live=all.filter(d=>(Number(d.balance)||0)>.01),scheduled=live.length>0&&live.every(d=>d.status32==='scheduled');
 // Всё, что сводится, — с каждого долга по разу, до того как оставшийся долг возьмёт недостающие поля.
 const history=all.flatMap(d=>d.history32||[]),plans=billsUniq270(all.map(d=>d.repayment35).filter(Boolean));
 const earlier=all.flatMap(d=>d.previousPlans35||[]),talks=all.map(d=>d.negotiation35).filter(Boolean),asked=billsUniq270(all.flatMap(d=>d.negotiations35||[]));
 for(const d of parts)for(const k of Object.keys(d))if(keep[k]===undefined&&!billsOwn270.has(k))keep[k]=d[k];
 keep.balance=sum('balance');keep.principal=sum('principal');keep.paid=sum('paid');
 keep.missed=Math.max(...all.map(d=>Number(d.missed)||0));
 if(Number.isFinite(min('started')))keep.started=min('started');
 if(Number.isFinite(min('due')))keep.due=min('due');
 keep.history32=billsUniq270(history).map((h,i)=>[h,i]).sort((a,b)=>(a[0].tick??0)-(b[0].tick??0)||a[1]-b[1]).map(x=>x[0]);
 // График с кредитором: действующие графики складываются в один (платёж и покрытый остаток — сумма,
 // пересмотр одного — пересмотр общего), прочие уходят в прежние договорённости. Если график был только у одного
 // долга, он остаётся как был: покрывает свою часть, остальное — неоплаченный счёт, как у долга с новыми счетами.
 const current=plans.filter(p=>['active','review'].includes(p.status));
 const plan=current.find(p=>p===keep.repayment35)||current[0]||keep.repayment35||plans[0]||null;
 if(plan&&current.length>1){
  const nums=k=>current.map(p=>Number(p[k])).filter(Number.isFinite);
  plan.remaining=nums('remaining').reduce((n,v)=>n+v,0);plan.monthly=nums('monthly').reduce((n,v)=>n+v,0);
  if(nums('next').length)plan.next=Math.min(...nums('next'));if(nums('expectedEnd').length)plan.expectedEnd=Math.max(...nums('expectedEnd'));
  plan.missed=Math.max(0,...nums('missed'));plan.status=current.some(p=>p.status==='review')?'review':'active';
  plan.history=billsUniq270(current.flatMap(p=>p.history||[])).map((h,i)=>[h,i]).sort((a,b)=>(a[0].tick??0)-(b[0].tick??0)||a[1]-b[1]).map(x=>x[0]);
  for(const p of current)if(p!==plan)p.status='merged270';
 }
 const previous=billsUniq270([...earlier,...plans.filter(p=>p!==plan)]).filter(p=>p!==plan);
 if(plan)keep.repayment35=plan;else delete keep.repayment35;
 if(previous.length)keep.previousPlans35=previous;
 // Переговоры: в силе предложение, которое ещё можно принять, иначе последнее по времени.
 const now=s.clock?.ticks??0;
 const talk=talks.find(q=>q.status==='offered'&&q.expires>=now)||[...talks].sort((a,b)=>(b.created??0)-(a.created??0))[0];
 if(talk)keep.negotiation35=talk;
 if(asked.length)keep.negotiations35=asked;
 // Статус: закрыт, если долга нет; по графику — только если весь остаток в действующем графике.
 keep.status32=keep.balance<=.01?'closed':scheduled&&keep.repayment35?.status==='active'?'scheduled':'overdue';
}
function billsMerge270(){
 const groups=new Map();
 for(const d of s.debts||[]){
  if(d?.type!=='bill32'||typeof d.creditor32!=='string'||!d.creditor32.startsWith(billsKey270))continue;
  const key=d.billKind32+'|'+d.creditor32+'|'+d.country;
  if(!groups.has(key))groups.set(key,[]);groups.get(key).push(d);
 }
 const map=new Map(),drop=new Set();
 for(const list of groups.values()){
  if(list.length<2)continue;
  const keep=list.reduce((a,b)=>(b.started??Infinity)<(a.started??Infinity)?b:a),parts=list.filter(d=>d!==keep);
  // Доля каждого до слияния — для журнала долга.
  keep.merged270={tick:s.clock?.ticks??null,ids:parts.map(d=>d.id),balances:list.map(d=>({id:d.id,balance:d.balance||0}))};
  billsJoin270(keep,parts);
  for(const d of parts){drop.add(d);if(d.id&&d.id!==keep.id)map.set(d.id,keep.id);}
 }
 if(!drop.size)return 0;
 for(let i=s.debts.length-1;i>=0;i--)if(drop.has(s.debts[i]))s.debts.splice(i,1);
 if(map.size)billsRelink270(map);
 return drop.size;
}
// Возвращает, сколько строк и долгов поменялось.
function billsMigrate270(){
 if(!s)return 0;
 return billsTexts270(s)+billsMerge270();
}
const billsBase270={loadCharacter,resume};
loadCharacter=function(...args){
 const out=billsBase270.loadCharacter.apply(this,args);
 if(s&&billsMigrate270())save();
 return out;
};
resume=function(...args){
 const before=s,out=billsBase270.resume.apply(this,args);
 if(s&&s!==before&&billsMigrate270())save();
 return out;
};
// Открытие страницы: game.js уже положил в s сохранение из хранилища.
if(s&&billsMigrate270())save();
