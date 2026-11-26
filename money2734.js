'use strict';
// Сборка 273.4: деньги и жильё на окне-карточке (windows273.js).
// • «Финансы»: наверху месяц — сколько приходит, уходит и остаётся (monthlyBudget: тот же расчёт, что в «Долгах и
//   бюджете», в Досье и при проверке кредита и ипотеки). Неоплаченные счета — главными кнопками, на кнопке — чем грозит
//   неоплата. Конвертер, автоплатежи, лимиты, залоги, кредиты — в «Подробнее». Убран второй вход в «Распределение денег»
//   («Приоритеты и ручное распределение денег» вела туда же, куда «Автоплатежи: приоритеты и лимиты») и петля
//   «Кризис и возвращение» → «Пересмотреть долги и платежи» → «Финансы»: назад в «Финансы» ведёт стрелка окна.
// • «Жильё и дорога»: наверху — где и почём вы живёте и сколько ехать до работы; главные кнопки — то, что нужно сейчас
//   (нет жилья, долг по аренде, временно у близкого, поломка, пора от родителей, общежитие, своё жильё).
// • Объявление аренды и покупки: наверху «в месяц» и «нужно при переезде» — houseMoveQuote41, по которому rentHouse41
//   списывает залог и переезд; у покупки — цена с оформлением, которую спишет buyHouse41.
// • «Ипотека: условия»: «нужно сейчас» и платёж наверху, платёж и сумма на руки на каждом варианте — mortgageQuote43,
//   по которому mortgageBuy43 оформляет ипотеку.
// • Переезд по пути (relocation68): одно окно «Подтвердить переезд» вместо трёх («Бюджет переезда», «Кто оплачивает
//   переезд?», «Подтвердить переезд»). Жильё и кто платит выбираются в нём же, рядом «Что поменять»; цифры — moveQuote68,
//   по которому finishMove16 потом списывает деньги. С питомцами за границу — как раньше: сначала «Питомцы и переезд».
// Только показ: ни одна формула денег, аренды, ипотеки и переезда не меняется, подписи кнопок и заголовки окон те же,
// в сохранении ничего нового. «Подробнее» запоминается по виду окна, как в windows273.js.
// После рецензии: старый неоплаченный счёт не считается расходом месяца (месяц его сам не списывает); главных кнопок
// в «Финансах» не больше трёх; аренда сравнивается с нынешним жильём, только где разница точная; жильё у близкого
// при переезде — то, что начислит месяц (homeCost нового адреса), а не 5% из запаса moveQuote68; даты вместо
// «через месяц»; код страны в подписи счёта — словами (только на экране).

const money2734Base={financeMenu,housingMenu,housingOfferDetails41,housingOffers41,mortgageOptions43,moveOptions68,movePayers68,moveConfirm68};

// ---------- общее ----------

// Карточка для первого show() внутри fn, если заголовок подходит. edit меняет текст и варианты до цепочки show(),
// after дописывает что-то сразу после того, как цепочка нарисовала окно (до кода, который вызвал show).
function cardCall2734(card,fn,{title=null,edit=null,after=null}={}){
 if(typeof nextCard273==='undefined'||nextCard273)return fn(); // без windows273.js — окно как раньше
 const old=show;let done=false;
 nextCard273=card;
 show=function(t,text,opts=[],...more){
  if(done)return old.call(this,t,text,opts,...more);
  done=true;
  if(title&&!(title instanceof RegExp?title.test(String(t)):t===title)){nextCard273=null;return old.call(this,t,text,opts,...more);}
  let x=text,o=Array.isArray(opts)?opts:[];
  if(edit)try{const r=edit(String(t),x,o);if(r){if(r.text!==undefined)x=r.text;if(r.opts)o=r.opts;}}catch(e){console.error(e);}
  const r=old.call(this,t,x,o,...more);
  if(after)try{after();}catch(e){console.error(e);}
  return r;
 };
 try{return fn();}finally{show=old;nextCard273=null;}
}
// Варианты в нужном порядке: сначала по списку (строки и выражения), остальные — как были.
function order2734(opts,list){
 const rank=o=>{const l=String(o?.label||'');const i=list.findIndex(x=>x instanceof RegExp?x.test(l):x===l);return i<0?list.length:i;};
 return opts.map((o,i)=>({o,i,r:rank(o)})).sort((a,b)=>a.r-b.r||a.i-b.i).map(x=>x.o);
}
function hint2734(o,extra){return extra?{...o,hint:[o.hint,extra].filter(Boolean).join(' · ')}:o;}
function count2734(n,one,few,many){return n+' '+plural273(n,one,few,many);}
function place2734(city,area){return [city,districts[area]?.name].filter(Boolean).join(' · ');}

// ---------- «Финансы» ----------

const financeDup2734='Приоритеты и ручное распределение денег'; // вела туда же, куда «Автоплатежи: приоритеты и лимиты»
const financeLoop2734=['Пересмотреть долги и платежи','Долги и платежи']; // из «Кризиса» обратно в «Финансы»
// Подпись долга — как в finance32.
function debtLabel2734(d){return (d.type==='bill32'?d.creditor32:d.type==='bank'?'Кредит':s.people.find(p=>p.id===d.personId)?.name||'Заём')+' · '+money(d.balance*debtRatio(d));}
function lease2734(){return (s.finance40?.leases||[]).find(q=>q.id===s.housing?.lease40&&q.status==='active')||null;}
// Счёт за жильё по нынешнему договору (finance40 выставляет его кредитору lease.creditor, как rentArrears42).
function leaseBill2734(d,lease=lease2734()){return !!lease&&d.billKind32==='rent'&&d.creditor32===lease.creditor&&d.country===lease.country;}
function offered2734(d){return d.negotiation35?.status==='offered'&&d.negotiation35.expires>=s.clock.ticks;}
// Чем грозит неоплата счёта: аренда — состояние договора (housing42), график — его платёж (finance35). Договор с
// режимом own — это содержание своего жилья, parents/host — ваша доля у близкого: «прежний договор» — только если
// кредитор не нынешний договор.
function billRisk2734(d){
 const p=d.repayment35;
 if(p?.status==='active')return 'по графику '+money(p.monthly*debtRatio(d))+'/мес.';
 if(p?.status==='review')return 'график нужно пересмотреть';
 if(d.billKind32==='rent'){
  const lease=lease2734();
  if(!leaseBill2734(d,lease))return 'долг по прежнему договору; без процентов и штрафов';
  if(lease.mode==='own')return 'содержание вашего жилья; без процентов и штрафов';
  if(lease.mode==='parents'||lease.mode==='host')return 'ваша доля расходов на жильё; без процентов и штрафов';
  const a=s.housing42?.leases?.[lease.id];
  if(a?.status==='notice'&&Number.isFinite(a.deadline))return 'не оплатите и не договоритесь — договор аренды закончится '+inMonth273(a.deadline);
  if(a?.status==='warning')return 'предупреждение по аренде; после трёх неоплаченных месяцев — срок на погашение';
 }
 return 'без процентов и штрафов';
}
// Сколько от счёта monthlyBudget кладёт в долги месяца, хотя месяц его сам не спишет: finance35 (billDue35) берёт
// неоплаченный счёт без графика целиком, а у счёта с графиком — часть сверх графика; списывается же только платёж
// по графику (debtDue40), старое гасится кнопкой. Для «Уходит» и «Остаётся» эта часть вычитается.
function billOld2734(d){const p=d.repayment35;return (['active','review'].includes(p?.status)?Math.max(0,d.balance-p.remaining):d.balance)*debtRatio(d);}
// Учёба, за которую в этом месяце платите вы: своя (trajectory16, education.js) или ребёнка (education.sponsored).
function studyPaid2734(){
 const t=typeof path16==='function'?path16().study:null;
 return !!(t&&t.status!=='paused'&&!['loan','familyloan'].includes(t.payer)&&!String(t.payer||'').startsWith('employer'))||!!s.studyTrack||s.people.some(p=>p.alive&&p.education?.sponsored);
}
// Два самых срочных счёта: аренда с предупреждением или сроком, предложение кредитора, потом по сумме.
function billsTop2734(bills){
 const lease=lease2734(),a=lease?s.housing42?.leases?.[lease.id]:null;
 const rank=d=>leaseBill2734(d,lease)&&a?.status==='notice'?0:leaseBill2734(d,lease)&&a?.status==='warning'?1:offered2734(d)?2:3;
 return bills.map(d=>({d,r:rank(d),n:d.balance*debtRatio(d)})).sort((x,y)=>x.r-y.r||y.n-x.n).map(x=>x.d);
}
function financeBuild2734(ctx){
 const b=monthlyBudget(),q=financialSummary32(),bills=activeDebts().filter(d=>d.type==='bill32'),loans=activeDebts().filter(d=>d.type!=='bill32');
 const old=bills.reduce((n,d)=>n+billOld2734(d),0),debt=Math.max(0,b.debt-old);
 const support=(b.familySupport21||0),income=b.income+support,out=b.cost+debt,left=b.free+old;
 const card={rows:[],need:[],more:[],main:[],foot:[]};
 const kids=typeof childBudget150==='function'?childBudget150().benefit:0,family=(b.familyLiving68||0)+support,own=b.income-kids-(b.familyLiving68||0);
 const from=[own>=1?(s.job?'зарплата':s.age>=67?'пенсия':'пособие'):'',kids>=1?'пособие на детей':'',family>=1?'помощь родителей':''].filter(Boolean);
 card.rows.push({label:'Приходит',value:income>=1?money(income)+'/мес.':'постоянного дохода нет',note:from.join(' · ')});
 const usual='обычные расходы'+(studyPaid2734()?' и учёба':'');
 if(s.age<18&&out<1)card.rows.push({label:'Уходит',value:'жильё, еду и учёбу оплачивают взрослые'});
 else card.rows.push({label:'Уходит',value:money(out)+'/мес.',note:debt>=1&&b.cost>=1?usual+' '+money(b.cost)+' · платежи по долгам '+money(debt):debt>=1?'платежи по долгам':usual});
 card.rows.push({label:'Остаётся',value:left>=0?money(left)+'/мес.':'не хватает '+money(-left)+'/мес.',note:s.cash>=1?'на счёте сейчас '+money(s.cash):s.cash<=-1?'на счёте минус '+money(-s.cash):'на счёте ничего'});
 if(loans.length){
  const total=q.debt-q.bills;
  card.rows.push({label:'Кредиты',value:money(total),note:[q.due>=1?'по графику в этом месяце '+money(q.due):'',loans.map(d=>d.mortgage43?'ипотека':d.type==='bank'?'кредит':'заём у близкого').filter((x,i,a)=>a.indexOf(x)===i).join(', ')].filter(Boolean).join(' · ')});
 }
 const blocked=s.clock.ticks<(s.creditBlockedUntil||0);
 if(bills.length){
  card.status={text:'Не оплачено '+money(q.bills)+' · '+count2734(bills.length,'счёт','счёта','счетов')+(blocked?' · новые кредиты — '+sinceMonth273(s.creditBlockedUntil):''),tone:'bad'};
  // Главных кнопок не больше трёх: погасить из резерва и два самых срочных счёта. Предложение кредитора встаёт
  // вместо кнопки своего счёта, остальные счета — в «Подробнее».
  const top=billsTop2734(bills).slice(0,2);
  card.main=['Погасить старые счета с резервом',...top.map(d=>offered2734(d)?'Предложение кредитора · '+d.creditor32:debtLabel2734(d).replace(/\s+/g,' '))]; // подписи кнопок сравниваются без неразрывных пробелов
  card.mainWhy=safeRepayment61()<=0?'Свободных денег сверх месяца обычных расходов нет':'';
  if(bills.length>top.length)card.mainNote='Ещё '+count2734(bills.length-top.length,'счёт','счёта','счетов')+' — в «Подробнее».';
 }else if(blocked)card.status={text:'Новые кредиты — '+sinceMonth273(s.creditBlockedUntil)+': были просрочки',tone:'bad'};
 card.more.push({title:'Как считается месяц',text:'Приходит — '+(from.length?from.join(', '):'постоянных поступлений нет')+'. Уходит — жильё, еда, бытовые счета, учёба, питомцы, транспорт и платежи по долгам и графикам. Старые неоплаченные счета месяц сам не списывает: их можно погасить кнопкой или договориться о графике. Это обычный месяц по нынешним договорам: разовые траты, гонорары и выплаты своего дела сюда не входят.'});
 card.moreHint=['расходы','кредиты','автоплатежи','конвертер'].join(', ');
 card.allTitle='Все суммы';
 return card;
}
function financeOpts2734(opts){
 const bills=activeDebts().filter(d=>d.type==='bill32'),hints=new Map(bills.map(d=>[debtLabel2734(d),billRisk2734(d)]));
 const loans=new Set(activeDebts().filter(d=>d.type!=='bill32').map(debtLabel2734));
 const sum=safeRepayment61(),offers=new Map(bills.filter(offered2734).map(d=>['Предложение кредитора · '+d.creditor32,d]));
 let list=opts.map(o=>{
  if(!o||typeof o.label!=='string')return o;
  if(o.label===financeDup2734)return {...o,hidden:true};
  if(o.label==='Кризис и возвращение'&&typeof o.fn==='function'){const fn=o.fn;return {...o,fn:()=>noLoop2734(fn)};}
  if(o.label==='Погасить старые счета с резервом')return hint2734(o,sum>0?'направить '+money(sum)+', месяц обычных расходов останется':'');
  if(hints.has(o.label))return hint2734(o,hints.get(o.label));
  // Предложение кредитора: график, который примет acceptBillTerms35, и срок ответа.
  const d=offers.get(o.label),n=d?.negotiation35;if(d)return hint2734(o,'график '+money(n.monthly*debtRatio(d))+'/мес.'+(n.kind==='deferral'?' после трёх месяцев отсрочки':'')+' · ответить '+untilMonth273(n.expires));
  return o;
 });
 return order2734(list,['Фактические расходы и нехватка средств','Кредиты и прежние финансовые действия',...loans,'Помощь родителей',
  'Автоплатежи: приоритеты и лимиты','Дополнительные лимиты: транспорт, медицина, секции, объекты','Учебный период: взносы и доплата',
  'Машины, велосипеды и их расходы','Возврат и удержания из залога','Сверить исторический дефицит','Кризис и возвращение']);
}
// «Кризис и возвращение» из «Финансов»: без кнопки обратно в «Финансы» — назад ведёт стрелка окна. Если окно кризиса
// при открытии что-то записало в жизнь (в первый раз crisis29 заводит свою запись), modal38 забывает историю и стрелка
// закроет окно — тогда кнопка обратно остаётся.
function noLoop2734(fn){
 const old=show,sig=typeof modalSignature38==='function'?modalSignature38():null;let done=false;
 show=function(t,text,opts=[],...more){
  if(done)return old.call(this,t,text,opts,...more);
  done=true;
  const back=sig!==null&&modalSignature38()===sig;
  return old.call(this,t,text,(Array.isArray(opts)?opts:[]).map(o=>back&&o&&financeLoop2734.includes(o.label)&&o.fn===financeMenu?{...o,hidden:true}:o),...more);
 };
 try{return fn();}finally{show=old;}
}
// Таблица «Деньги и обязательства» уходит в «Подробнее»: без нулей и без «Кредитоспособность: проверяется при заявке».
function financeTable2734(){
 const g=nextDetail20?.sections?.[0];
 if(!g||!Array.isArray(g.rows))return;
 g.rows=g.rows.filter(r=>!(/^0 \S+$/.test(String(r.value).trim())||r.label==='Кредитоспособность'&&/^Проверяется при заявке/.test(String(r.value))));
}
// Конвертер валют travel86 встаёт в таблицу; переносим его в «Подробнее» отдельным разделом перед таблицей.
function financeConverter2734(){
 const d=document.getElementById('modal'),conv=d?.querySelector('.currency-converter86'),all=d?.querySelector('.more273 .all273');
 if(!conv||!all||conv.closest('.infos273,.conv2734'))return;
 conv.querySelector('.currency-heading86 small')?.remove();
 const box=document.createElement('section');box.className='conv2734';box.append(conv);all.before(box);
}
// Сырой код страны в подписи счёта (creditor32 = 'Бытовые счета · ru', у самых первых договоров
// 'Жильё · ru · Москва · rent') — на экране словами: своя страна не пишется, чужая — названием. Меняется только
// текст кнопки, как в display269: o.label, choose(i) и перехватчики прежние; прежняя подпись — в data-label2734.
function creditorText2734(t){
 return String(t).replace(/(Бытовые счета|Жиль[её]) · ([a-z]{2})(?: · ([^·]+?) · (?:rent|own|parents|host|unstable42))?(?= · |$)/,
  (m,what,code,city)=>[what,city?.trim(),code!==s.country?countries[code]?.name||'':''].filter(Boolean).join(' · '));
}
function creditorButtons2734(){
 for(const b of document.querySelectorAll('#modal .options button')){
  if(b.dataset.label2734)continue;
  const nodes=[...b.childNodes].filter(n=>n.nodeType===3),l=nodes.map(n=>n.textContent).join(''),t=creditorText2734(l);
  if(t===l)continue;
  b.dataset.label2734=optLabel273(b);
  nodes.forEach((n,i)=>{n.textContent=i?'':t;});
 }
}
financeMenu=function(...args){
 return cardCall2734({kind:'finance',area:'Деньги',build:financeBuild2734},()=>{
  const r=money2734Base.financeMenu(...args);
  financeConverter2734();
  return r;
 },{title:'Финансы',edit:(t,text,opts)=>{financeTable2734();return {opts:financeOpts2734(opts)};},
  // После второй раскладки карточки (её микрозадача поставлена раньше): главные кнопки уже разобраны по подписи.
  // Если за это время открылось другое окно (seq273 сменился), его не трогаем.
  after:()=>{const seq=seq273;queueMicrotask(()=>{if(seq===seq273)try{creditorButtons2734();}catch(e){console.error(e);}});}});
};

// ---------- «Жильё и дорога» ----------

const L2734={rent:'Снять комнату, квартиру или дом',buy:'Купить квартиру или дом',with:'С кем жить / разъехаться / к родителям',
 unstable:'Нет постоянного жилья · варианты помощи',lease:'Договор, просрочки и помощь',repair:'Состояние жилья и ремонт',
 near:'Искать работу ближе к дому',dorm:'Студенческое общежитие',living:'Регулярная помощь родителей на жизнь',
 invest:'Купить для сдачи / сдавать своё жильё',transport:'Транспорт домохозяйства',deposits:'Возврат прежних залогов'};
const property2734=/^(Комната|Квартира|Дом) · .+ · (в собственности|сдаётся)$/;
function propertyLabel2734(p){return homeKinds41[p.kind]+' · '+p.city+' · '+(p.rented?'сдаётся':'в собственности');} // как в housing41
function housingNow2734(){
 const h=s.housing,lease=(s.finance40?.leases||[]).find(q=>q.id===h.lease40&&q.status==='active');
 const a=lease&&h.mode==='rent'?s.housing42?.leases?.[lease.id]:null,arrears=lease&&h.mode==='rent'&&typeof rentArrears42==='function'?rentArrears42(lease):[];
 const stay=typeof activeStay42==='function'&&s.housing42?activeStay42():null,own=h.mode==='own'?s.properties.find(p=>p.id===h.propertyId):null;
 const q=housingListing41()||own?.listing41||null,issue=(h.mode==='own'?own?.maintenance41:h.maintenance41)?.issue;
 const mortgage=own?.mortgageId43?s.debts.find(d=>d.id===own.mortgageId43&&d.mortgage43&&mortgageTotal43(d)>.001):null;
 const programs=path16().applications.filter(x=>['accepted','enrolled'].includes(x.status)).map(x=>prog16(x.program)).filter(Boolean);
 const dorm=!q?.dorm68&&programs.some(p=>typeof dormEligible68==='function'&&dormEligible68(p)&&p.country===s.country);
 const help=typeof youngSupport68==='function'&&youngSupport68()&&students68().support?.status!=='active'&&['parents','host','rent'].includes(h.mode)&&!own;
 return {h,a,arrears,stay,own,q,issue:issue?.status==='open'?issue:null,mortgage,dorm,help};
}
function housingBuild2734(ctx){
 const x=housingNow2734(),h=x.h,card={rows:[],need:[],more:[],main:[],foot:[],settings:[]};
 card.sub=place2734(h.city,h.area);
 // Где и как живёте.
 const what=x.q?[homeKinds41[x.q.kind],x.q.areaM2!=null?x.q.areaM2+' м²':'',x.q.year?x.q.year+' г.':''].filter(Boolean).join(' · '):'';
 const host=(h.mode==='host'||h.mode==='parents')&&living(h.occupant);
 const tenure=h.mode==='unstable42'?'':h.mode==='own'?'своё жильё'+(x.mortgage?' · в ипотеке':''):h.mode==='parents'?'у родителей':h.mode==='host'?(host?'у '+roleGenitive268(host)+' · '+host.name:'у близкого'):x.q?.dorm68?'студенческое общежитие':h.room40?'аренда комнаты':'аренда';
 if(what||tenure)card.rows.push({label:'Сейчас',value:[what,tenure].filter(Boolean).join(' · ')});
 // Сколько это стоит в месяц: homeCost — то, что месячный расчёт выставит за жильё.
 const cost=homeCost();
 if(h.mode!=='unstable42'){
  if(s.age<18)card.rows.push({label:'В месяц',value:'платят взрослые'});
  else card.rows.push({label:'В месяц',value:cost>=1?money(cost)+'/мес.':'бесплатно',
   note:[h.mode==='own'?'содержание':h.mode==='rent'?(h.occupant&&x.q?.kind!=='room'?'ваша половина аренды':'аренда'):x.stay?'ваш вклад':'ваша доля расходов',
    x.mortgage?'ипотека '+money(x.mortgage.payment*debtRatio(x.mortgage))+'/мес.':'',
    // Коммунальные отдельно только у обычной аренды и своего жилья: в общежитии они входят в плату (enterDorm68), у
    // родителей и близких отдельной строки за них нет.
    h.mode==='own'||h.mode==='rent'&&!x.q?.dorm68?'коммунальные — отдельно':''].filter(Boolean).join(' · ')});
 }
 const way=s.job?commuteMinutes():0;
 if(way>0)card.rows.push({label:'Дорога',value:way+' мин до работы в одну сторону'});
 // Что сейчас происходит — одной строкой; и что нужно сделать первым.
 const due=x.arrears.reduce((n,d)=>n+d.balance*debtRatio(d),0);
 if(h.mode==='unstable42'){card.status={text:'Нет постоянного жилья',tone:'bad'};card.main=[L2734.unstable,L2734.rent,L2734.with];}
 else if(x.a&&['warning','notice'].includes(x.a.status)&&due>.01){
  card.status={text:'Аренда не оплачена: '+money(due)+(x.a.status==='notice'&&Number.isFinite(x.a.deadline)?' · договор закончится '+inMonth273(x.a.deadline):' · предупреждение'),tone:'bad'};
  card.main=[L2734.lease,L2734.rent];
 }else if(x.a?.status==='agreement'&&due>.01){card.status={text:'Долг по аренде гасится по графику: '+money(due),tone:'wait'};card.main=[L2734.lease,L2734.rent];}
 // Временно у близкого: у кого — в строке «Сейчас», в статусе — срок. Когда срок вышел (housing42: notice), адрес
 // пропадёт в месяц grace — это и есть последний срок.
 else if(x.stay){
  const over=x.stay.status==='notice',grace=Number.isFinite(x.stay.grace)?x.stay.grace:x.stay.end+1;
  card.status=over?{text:'Срок проживания вышел · найдите жильё до '+month273(grace,monthOf273),tone:'bad'}:{text:'Временное проживание · до '+month273(x.stay.end,monthOf273),tone:'wait'};
  card.main=over?[L2734.rent,L2734.lease]:[L2734.lease,L2734.rent];
 }
 else if(h.mode==='own')card.main=[x.own?propertyLabel2734(x.own):'',L2734.buy,L2734.rent].filter(Boolean);
 else if(h.mode==='parents'||h.mode==='host')card.main=[L2734.rent,...(x.dorm?[L2734.dorm]:[]),...(x.help?[L2734.living]:[])];
 else card.main=[...(x.dorm?[L2734.dorm]:[]),L2734.rent,L2734.buy];
 // Поломка — первой, если нет ничего срочнее (без жилья, долг по аренде, временно у близкого); иначе — после срочного.
 if(x.issue){
  if(!card.status){card.status={text:'Поломка: '+lower273(x.issue.title)+(x.issue.cost>0?' · ремонт '+houseMoney41(x.issue.cost,x.issue.country):''),tone:'wait'};card.main=[L2734.repair,...card.main];}
  else card.main=[...card.main.slice(0,2),L2734.repair];
 }
 if(way>=60&&!card.main.includes(L2734.near))card.main.push(L2734.near);
 card.main=card.main.filter((l,i,a)=>a.indexOf(l)===i).slice(0,3);
 // Своя недвижимость, кроме той, где живёте, — рядом, одной строкой.
 card.settings=s.properties.filter(p=>p!==x.own).map(propertyLabel2734).filter(l=>!card.main.includes(l));
 card.settingsTitle='Ваша недвижимость';
 card.moreHint='другие действия, дом целиком';
 return card;
}
function housingOpts2734(opts){
 return order2734(opts,[L2734.rent,L2734.buy,L2734.with,property2734,L2734.repair,L2734.lease,L2734.unstable,L2734.near,L2734.transport,L2734.invest,L2734.deposits,L2734.living,L2734.dorm]);
}
housingMenu=function(...args){
 return cardCall2734({kind:'housing',area:'Жильё',build:housingBuild2734},()=>money2734Base.housingMenu(...args),
  {title:'Жильё и дорога',edit:(t,text,opts)=>({opts:housingOpts2734(opts)})});
};

// ---------- объявления аренды и покупки ----------

function offerWhy2734(q){
 if(s.age<18)return {text:'Снять или купить жильё — с 18 лет',when:'через '+count2734(18-s.age,'год','года','лет')};
 return {text:'Объявление больше не действует',when:'посмотрите свежие предложения'};
}
// Аренда против нынешнего жилья. Разница с homeCost() точна, только если вы сейчас снимаете сами: rentHouse41 ставит
// новую аренду вместо прежней. Своё жильё остаётся за вами — его содержание (и ипотека) продолжатся сверх аренды
// (housing.js: содержание объектов, где вы не живёте). У родителей, близких, в общежитии и с партнёром месяц
// пересчитывается иначе — там сравнения нет.
function rentVsNow2734(q){
 const h=s.housing;
 if(s.age<18||!h?.active)return '';
 if(h.mode==='rent'&&!h.occupant&&!h.listing41?.dorm68&&!currentPartner()?.cohabit){
  const diff=q.rent-homeCost();
  return Math.abs(diff)<1?'столько же, сколько сейчас':'на '+houseMoney41(Math.abs(diff))+(diff<0?' меньше':' больше')+', чем сейчас';
 }
 const own=h.mode==='own'&&s.properties.find(p=>p.id===h.propertyId);
 if(own&&typeof propertyMaintenance41==='function'){
  const m=own.mortgageId43?s.debts.find(d=>d.id===own.mortgageId43&&d.mortgage43&&mortgageTotal43(d)>.001):null;
  return 'плюс содержание своего жилья '+money(propertyMaintenance41(own))+'/мес.'+(m?' и ипотека '+money(m.payment*debtRatio(m))+'/мес.':'');
 }
 return '';
}
// «8,1 средней годовой зарплаты», но «6 средних годовых зарплат».
function wages2734(n){
 const r=Math.round(n*10)/10,t=r.toLocaleString('ru-RU',{maximumFractionDigits:1});
 return Number.isInteger(r)?t+' '+plural273(r,'средняя годовая зарплата','средние годовые зарплаты','средних годовых зарплат'):t+' средней годовой зарплаты';
}
function offerBuild2734(q,ctx){
 const buy=q.operation==='buy',card={rows:[],need:[],more:[],main:[],foot:['К предложениям']};
 const wage=typeof vacancyWage97==='function'?vacancyWage97(q.country,q.city):0;
 card.title=homeKinds41[q.kind]+(q.areaM2!=null?' · '+q.areaM2+' м²':'');card.h2='sub';
 card.sub=place2734(q.city,q.area)+(q.year?' · '+q.year+' г.':'');
 if(!buy){
  const x=houseMoveQuote41(q),terms=typeof depositTerms43==='function'?depositTerms43(q.country):null;
  card.rows.push({label:'В месяц',value:houseMoney41(q.rent)+'/мес.',note:[wage>0?Math.round(q.rent/wage*1200)+'% средней зарплаты':'',rentVsNow2734(q),'коммунальные — отдельно'].filter(Boolean).join(' · ')});
  card.rows.push({label:'При переезде',value:x.needed>=.5?houseMoney41(x.needed):'хватит прежнего залога',note:['залог '+houseMoney41(x.deposit),'переезд '+houseMoney41(x.moving),x.refund>=.5?'минус прежний залог '+houseMoney41(x.refund):''].filter(Boolean).join(' · ')});
  if(!validListing41(q,'rent'))card.need.push(offerWhy2734(q));
  else if(s.cash+.001<x.needed)card.need.push({text:'Не хватает '+houseMoney41(x.needed-Math.max(0,s.cash))+' на переезд',fix:{label:'Финансы',hint:'у вас '+money(Math.max(0,s.cash)),fn:()=>financeMenu()}});
  card.main=['Снять и переехать'];
  if(terms)card.more.push({title:'Залог',text:'Вернут через '+count2734(terms.delay,'месяц','месяца','месяцев')+' после выезда; из него могут вычесть неоплаченную аренду.'});
  card.moreHint='дом, залог';
  return card;
 }
 const total=q.purchase*1.03,upkeep=q.purchase*(q.kind==='house'?.00065:.0004); // как в housingOfferDetails41 и buyHouse41
 card.rows.push({label:'Цена',value:houseMoney41(total),note:'с оформлением · объявление '+houseMoney41(q.purchase)+(wage>0?' · '+wages2734(q.purchase/wage):'')});
 card.rows.push({label:'В месяц',value:houseMoney41(upkeep)+'/мес.',note:'содержание · коммунальные — отдельно'});
 const cash=!validListing41(q,'buy')?offerWhy2734(q):s.properties.length>=5?{text:'У вас уже пять объектов — больше купить нельзя',when:'сначала продайте один'}:s.cash+.001<total?{text:'Не хватает '+houseMoney41(total-Math.max(0,s.cash))+' на покупку целиком',when:'у вас '+money(Math.max(0,s.cash))+'; можно в ипотеку'}:null;
 if(cash)card.need.push(cash);
 card.main=cash?['Рассчитать ипотеку','Запланировать покупку']:['Запланировать покупку','Рассчитать ипотеку'];
 card.mainNote='Покупка целиком не меняет адрес: жить там можно после покупки.';
 card.moreHint='дом';
 return card;
}
housingOfferDetails41=function(q,...rest){
 if(!q||!houseType41(q.catalogId))return money2734Base.housingOfferDetails41(q,...rest);
 const buy=q.operation==='buy';
 return cardCall2734({kind:buy?'buy-offer':'rent-offer',area:'Жильё',build:ctx=>offerBuild2734(q,ctx)},()=>money2734Base.housingOfferDetails41(q,...rest),{
  edit:(t,text,opts)=>{
   const m=buy&&typeof mortgageQuote43==='function'?mortgageQuote43(q):null;
   // Покупка и ипотека встают в план (queueCommand05) и проходят со следующим месяцем.
   return {opts:opts.map(o=>o?.label==='Рассчитать ипотеку'&&m?hint2734(o,'платёж '+money(m.payment)+'/мес. при взносе 20% на 20 лет · сразу '+money(m.upfront)):
    o?.label==='Запланировать покупку'?hint2734(o,'покупка '+inMonth273(s.clock.ticks+1)):o)};
  },
  // housingOfferDetails41 ставит дом и расходы на место пустого <p> окна; карточка этот <p> убирает, поэтому ставим
  // пустой <p> в «Подробнее» — туда они и встанут.
  after:()=>{const all=document.querySelector('#modal .all-body273');if(all&&!document.querySelector('#modal p:empty'))all.insertAdjacentHTML('beforeend','<p></p>');}
 });
};
// Список объявлений: на каждом — сколько нужно при переезде (аренда) или с оформлением (покупка).
housingOffers41=function(operation,kind,city,...rest){
 const old=show;let done=false;
 show=function(t,text,opts=[],...more){
  if(done)return old.call(this,t,text,opts,...more);
  done=true;
  let list=opts;
  try{
   const m=market41(operation,kind,city),available=m?m.listings.filter(q=>!housingState41().used.includes(q.id)):[];
   list=opts.map((o,i)=>{const q=available[i];if(!q||!o)return o;
    if(operation==='buy')return hint2734(o,'с оформлением '+houseMoney41(q.purchase*1.03));
    const x=houseMoveQuote41(q);return hint2734(o,'при переезде '+(x.needed>=.5?houseMoney41(x.needed):'хватит прежнего залога'));});
  }catch(e){console.error(e);}
  return old.call(this,t,text,list,...more);
 };
 try{return money2734Base.housingOffers41(operation,kind,city,...rest);}finally{show=old;}
};

// ---------- «Ипотека: условия» ----------

function mortgageNeed2734(w,q,x,down){
 if(w==='Не хватает на взнос, оформление и переезд')return {text:'Не хватает '+money(x.upfront-Math.max(0,s.cash))+' на взнос, оформление'+(x.live?' и переезд':''),when:'у вас '+money(Math.max(0,s.cash))+(down>.1?'; с меньшим взносом нужно меньше':'')};
 if(w==='Платёж и расходы не проходят проверку дохода')return {text:'Платёж велик для вашего дохода',when:'возьмите срок дольше или взнос больше'};
 if(w==='Срок должен завершиться до 80 лет')return {text:'Ипотека должна закончиться до 80 лет',when:'выберите срок короче'};
 if(w==='Нужен подтверждённый доход от работы или пенсии')return {text:'Нужен доход от работы или пенсия',fix:{label:'Вакансии',fn:()=>openPath16('jobs')}};
 if(w==='Сначала нужно урегулировать просрочки')return {text:'Сначала разберитесь с просрочками',fix:{label:'Финансы',fn:()=>financeMenu()}};
 if(w==='Достигнут лимит объектов или ипотек')return {text:'Уже две ипотеки или пять объектов',when:'больше банк не даст'};
 if(w==='Объявление больше не действует')return offerWhy2734(q);
 return {text:w};
}
function mortgageBuild2734(q,down,years,live,ctx){
 const x=mortgageQuote43(q,down,years,live),card={rows:[],need:[],more:[],main:['Запланировать покупку в ипотеку'],foot:['К объявлению'],settings:[/^\d+% взнос · \d+ лет/,'Купить без переезда','Купить и переехать']};
 card.sub=[homeKinds41[q.kind]+(q.areaM2!=null?' · '+q.areaM2+' м²':''),place2734(q.city,q.area),money(q.purchase)].join(' · ');
 card.status=x.reasons.length?null:{text:'Банк одобрит при нынешних доходе и деньгах',tone:'ok'};
 card.rows.push({label:'Нужно сейчас',value:money(x.upfront),note:['взнос '+Math.round(down*100)+'% '+money(q.purchase*down),'оформление '+money(q.purchase*.03),live?'переезд '+money(x.moving):''].filter(Boolean).join(' · ')});
 card.rows.push({label:'Платёж',value:money(x.payment)+'/мес.',note:[count2734(years,'год','года','лет'),'ставка '+String(+(x.rate*100).toFixed(1)).replace('.',',')+'%','переплата '+money(x.payment*years*12-x.principal),'плюс содержание '+money(x.maintenance)+'/мес.'].join(' · ')});
 card.rows.push({label:'Адрес',value:live?'переедете сюда '+inMonth273(s.clock.ticks+1):'не меняется — купите без переезда'}); // queueMortgage43: со следующим месяцем
 for(const w of x.reasons)card.need.push(mortgageNeed2734(w,q,x,down));
 card.settingsTitle='Взнос и срок';
 card.more.push({title:'Как это работает',text:'Ставка не меняется весь срок. Досрочно гасить можно без комиссии.'}); // сколько банк платит продавцу — в тексте окна
 card.moreHint='дом, как считается';
 return card;
}
mortgageOptions43=function(q,down=.2,years=20,live=true,...rest){
 if(!q||!mortgageQuote43(q,down,years,live))return money2734Base.mortgageOptions43(q,down,years,live,...rest);
 return cardCall2734({kind:'mortgage',area:'Жильё',build:ctx=>mortgageBuild2734(q,down,years,live,ctx)},()=>money2734Base.mortgageOptions43(q,down,years,live,...rest),{
  title:'Ипотека: условия',
  edit:(t,text,opts)=>{
   // На варианте — только то, что у него не как наверху: платёж и сколько нужно сразу; «банк откажет», если так.
   const cur=mortgageQuote43(q,down,years,live);
   const plan=(d,y,l)=>{const m=mortgageQuote43(q,d,y,l);if(!m)return '';return [Math.abs(m.payment-cur.payment)>=.5?'платёж '+money(m.payment)+'/мес.':'',Math.abs(m.upfront-cur.upfront)>=.5?'сразу '+money(m.upfront):'',m.reasons.length?'банк откажет':''].filter(Boolean).join(' · ');};
   const list=opts.map(o=>{
    const l=String(o?.label||''),k=/^(\d+)% взнос · (\d+) лет/.exec(l);
    if(k)return hint2734(o,plan(+k[1]/100,+k[2],live));
    if(l==='Купить без переезда'||l==='Купить и переехать')return hint2734(o,plan(down,years,!live));
    return o;
   });
   // Оговорки про «игровую» ставку и проверку — обычными словами; ставка с запятой, как наверху.
   const x=String(text??'').replace('Фиксированная игровая ставка','Фиксированная ставка').replace('Доход и средства проходят игровую проверку.','Доход и деньги проходят проверку банка.').replace(/(\d)\.(\d)%/g,(m,a,b)=>a+(b==='0'?'':','+b)+'%');
   return {text:x,opts:list};
  }
 });
};

// ---------- переезд по пути: одно окно ----------

const moveHomes2734={dorm:'Место в общежитии',family:'Жить у близкого',room:'Недорогая комната'};
function moveHomeList2734(kind,id){const t=moveTarget68(kind,id);return t?[...(t.p&&dormEligible68(t.p)?['dorm']:[]),...(t.host?['family']:[]),'room']:[];} // как в moveOptions68
function moveDefault2734(kind,id){return moveHomeList2734(kind,id).find(h=>moveQuote68(kind,id,h))||null;}
// За границу с питомцами окно «Питомцы и переезд» встаёт перед подтверждением — тогда, как раньше, сначала выбор жилья.
function movePetsFirst2734(kind,id){
 const t=moveTarget68(kind,id);
 return !!t&&t.country!==s.country&&typeof movePetsMenu183==='function'&&s.pets.some(p=>p.alive&&petAtHome183(p)&&petHousehold183(p).keeper==='player');
}
// Сколько в месяц будет стоить жильё после переезда — homeCost() при том адресе, который поставит finishMove16.
// Комната и общежитие — аренда из moveQuote68 (её же finishMove16 пишет в договор). У близкого moveQuote68 берёт
// 5% для запаса — это расчёт, его не трогаем, а месяц начислит другое: у мамы и папы — долю по их договорённости
// (family17, housingDeal17: 15% с работой, без работы может быть 0), у партнёра — долю дома (housing.js). Поэтому
// homeCost() считается на время с новым адресом (за границу — ещё со страной и без работы, как в finishMove16),
// потом всё возвращается как было; договорённость родителей, если её завела проверка, тоже.
function moveRent2734(q){
 if(q.home!=='family'||!q.host)return localAmount16(q.rent,q.country);
 const keep={housing:s.housing,country:s.country,job:s.job},f=s.family17,deal=f?.household,abroad=q.country!==s.country;let v=null;
 try{
  s.housing={...s.housing,active:true,country:q.country,city:q.city,area:'suburb',mode:['Мать','Отец'].includes(q.host.role)?'parents':'host',propertyId:null,occupant:q.host.id,room40:false};
  if(abroad){s.country=q.country;s.job=null;}
  v=homeCost();
 }catch(e){console.error(e);v=null;}
 finally{Object.assign(s,keep);if(f)f.household=deal;else delete s.family17;}
 return Number.isFinite(v)?(abroad?localAmount16(v,q.country):v):null;
}
function moveRentText2734(v){return v===null?'доля по договорённости':v>=1?money(v)+'/мес.':'без платы';}
function moveBuild2734(kind,id,home,parent,petIds,ctx){
 const q=moveQuote68(kind,id,home,parent,petIds),card={rows:[],need:[],more:[],main:['Запланировать переезд'],foot:[],settings:[...Object.values(moveHomes2734),'Свои средства',/^Попросить оплатить · /]};
 if(!q)return {main:[]};
 const p=parent&&living(parent);
 // Город уже в заголовке; за границу — страна.
 card.sub=q.country!==s.country?countries[q.country].name:'';
 card.rows.push({label:'Жильё',value:(home==='family'&&q.host?'у '+roleGenitive268(q.host)+' · '+q.host.name:lower273(moveHomes2734[home]))+' · '+moveRentText2734(moveRent2734(q))});
 const parts=[['дорога и вещи',q.travel],['залог',q.deposit>0?localAmount16(q.deposit,q.country):0],['питомцы',q.petPlan.cost]].filter(([,n])=>n>=1);
 card.rows.push({label:'Разово',value:money(q.upfront+q.petPlan.cost),note:[parts.length>1?parts.map(([l,n])=>l+' '+money(n)).join(' · '):parts.map(([l])=>l).join(''),q.family>=1&&p?(q.own>=1?p.name+' платит '+money(q.family)+', вы '+money(q.own):'всё платит '+p.name):''].filter(Boolean).join(' · ')});
 card.rows.push({label:'Нужно иметь',value:money(q.needed),note:q.reserve>=1?'из них '+money(q.reserve)+' — запас на первый месяц, он остаётся у вас'+(q.stipend>=1?' (стипендия '+money(q.stipend)+'/мес. его уменьшает)':''):''});
 const line=typeof familyMoveLine270==='function'?familyMoveLine270(q.country!==s.country?'abroad':''):'';
 if(line)card.rows.push({label:'Семья',value:line});
 card.need=moveBlocks2734(kind,id,q);
 // queueMove68: оформление — один календарный месяц (safeguards68, calendarMonth68), тогда же finishMove16 списывает деньги.
 card.mainNote='Переезд '+inMonth273(s.clock.ticks+1)+', разовые расходы спишут тогда же.';
 card.settingsTitle='Жильё';
 card.moreHint='из чего сумма, другие действия';
 return card;
}
// Те же проверки, что у queueMove68. Без них кнопка «Запланировать переезд» нажималась, окно закрывалось, а переезд
// в план не вставал; теперь она серая, причина — первой строкой «Не хватает».
function moveBlocks2734(kind,id,q){
 const need=[],age=kind==='study'?17:18;
 if(q.petPlan.blocked)need.push({text:q.petPlan.blocked});
 if(s.clock.tasks.some(t=>t.kind==='pathMove'&&!['completed','cancelled'].includes(t.state)))need.push({text:'Другой переезд уже оформляется',when:'дождитесь его'});
 if(s.age<age)need.push({text:'Переезд — с '+age+' лет',when:'через '+count2734(age-s.age,'год','года','лет')});
 if(!permitSource16(kind,id,q.country))need.push({text:kind==='family'?'Переехать можно к маме, папе или партнёру, если между вами доверие':'Основание для переезда больше не действует',when:kind==='family'?'сначала наладьте отношения':'посмотрите «Документы и переезд»'});
 if(!permission16(q.country,kind==='work'?'work':'study'))need.push({text:kind==='work'?'Нет разрешения на работу в стране':kind==='study'?'Нет разрешения на учёбу в стране':'Нет разрешения жить в стране',fix:{label:'Документы и переезд',fn:()=>openPath16('mobility')}});
 if(Math.max(0,s.cash)+.01<q.needed)need.push({text:'Не хватает '+money(q.needed-Math.max(0,s.cash))+' своих денег',fix:{label:'Финансы',hint:'у вас '+money(Math.max(0,s.cash)),fn:()=>financeMenu()}});
 return need;
}
function moveOpts2734(kind,id,home,parent,petIds,opts){
 const target=moveTarget68(kind,id),chips=[];
 for(const h of moveHomeList2734(kind,id)){
  const x=moveQuote68(kind,id,h,parent,petIds);
  chips.push(x?{label:moveHomes2734[h],hint:h===home?'сейчас':'разово '+money(x.upfront+x.petPlan.cost)+' · жильё '+moveRentText2734(moveRent2734(x)).replace(/^доля /,''),fn:()=>moveConfirm68(kind,id,h,parent,petIds)}:
   {label:moveHomes2734[h],disabled:true,why:'Жить можно у мамы, папы или партнёра',fn:()=>{}});
 }
 chips.push({label:'Свои средства',hint:parent?'':'сейчас',fn:()=>moveConfirm68(kind,id,home,null,petIds)});
 for(const p of parents17().filter(p=>(p.inner?.trust??0)>=45))chips.push({label:'Попросить оплатить · '+p.name,hint:[parent===p.id?'сейчас':'','доступно '+money(parentAvailable17(p))].filter(Boolean).join(' · '),fn:()=>moveConfirm68(kind,id,home,p.id,petIds)}); // как в movePayers68
 chips.push({label:'Договориться о регулярной помощи',fn:livingMenu68});
 const q=moveQuote68(kind,id,home,parent,petIds),blocked=q?moveBlocks2734(kind,id,q).length>0:false;
 const list=opts.map(o=>o?.label==='Другой вариант жилья'?{...o,fn:()=>money2734Base.moveOptions68(kind,id)}:o?.label==='Запланировать переезд'&&blocked?{...o,disabled:true}:o);
 return target?[...list,...chips]:list;
}
moveConfirm68=function(kind,id,home,parent=null,petIds=null,...rest){
 const target=moveTarget68(kind,id);
 if(!target||!moveQuote68(kind,id,home,parent,petIds))return money2734Base.moveConfirm68(kind,id,home,parent,petIds,...rest);
 return cardCall2734({kind:'move',area:'Переезд',build:ctx=>moveBuild2734(kind,id,home,parent,petIds,ctx)},()=>money2734Base.moveConfirm68(kind,id,home,parent,petIds,...rest),{
  title:/^Подтвердить переезд · /,edit:(t,text,opts)=>({opts:moveOpts2734(kind,id,home,parent,petIds,opts)}),after:movePayRow2734
 });
};
// «Что поменять» в переезде — два ряда: «Жильё» и «Кто платит», у каждого своя отметка «сейчас». Кнопки только
// переносятся в соседний контейнер .options: варианты, их порядок и choose(i) те же.
function movePayRow2734(){
 const set=document.querySelector('#modal .set273'),box=set?.querySelector('.setopts273');
 if(!set||!box||set.querySelector('.pay2734'))return;
 const pay=[...box.querySelectorAll(':scope > button')].filter(b=>/^(Свои средства|Попросить оплатить · )/.test(optLabel273(b)));
 if(!pay.length)return;
 const h=document.createElement('h4');h.className='pay2734h';h.textContent='Кто платит';
 const row=document.createElement('div');row.className='options setopts273 pay2734';row.append(...pay);
 set.append(h,row);
}
// «Бюджет переезда» и «Кто оплачивает переезд?» больше не отдельные шаги: сразу окно подтверждения с выбором в нём.
const merge2734=()=>typeof nextCard273!=='undefined'; // без windows273.js выбор жилья и плательщика негде показать
moveOptions68=function(kind,id,...rest){
 const home=moveDefault2734(kind,id);
 if(!merge2734()||!home||movePetsFirst2734(kind,id))return money2734Base.moveOptions68(kind,id,...rest);
 return moveConfirm68(kind,id,home);
};
movePayers68=function(kind,id,home,...rest){
 if(!merge2734()||!moveQuote68(kind,id,home))return money2734Base.movePayers68(kind,id,home,...rest);
 return moveConfirm68(kind,id,home);
};

// ---------- стили ----------

(function moneyStyle2734(){
 if(typeof document==='undefined'||document.getElementById('money2734-style'))return;
 const st=document.createElement('style');
 st.id='money2734-style';
 st.textContent=[
  '#modal .conv2734{margin:14px 0 0}',
  '#modal .conv2734 .currency-converter86{margin:0}',
  '#modal .set273 h4.pay2734h{margin-top:12px}',
  '@media(max-width:620px){#modal .house-offer41 img{height:150px}#modal .house-offer41 .house-figure41{margin-bottom:8px}}'
 ].join('\n');
 document.head.appendChild(st);
})();
