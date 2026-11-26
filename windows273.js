'use strict';
// Сборка 273, шаг 1: окно-карточка и три окна на нём — вакансия (с откликом, собеседованием и оффером), программа вуза,
// поездка (черновик, приглашение, карточка, «Дорога и уход»).
// Наверху окна — то, ради чего его открыли: что получите, во что обойдётся (деньги, часы, сроки), шанс, если исход
// случайный, и чего не хватает — каждая строка кнопкой, которая это исправляет. Под этим 1–3 главные кнопки.
// Остальное свёрнуто в «Подробнее»: из чего сложился шанс, другие действия, вся прежняя таблица и текст окна.
// Как устроено:
// • Окно передаёт данные, а не HTML: обёртка функции окна кладёт карточку в nextCard273, обёртка show() её забирает.
//   Эта обёртка show() — самая внешняя из постоянных: файл подключается последним перед bootstrap61.js.
// • Сначала вся цепочка show() рисует окно как раньше (заголовок, варианты, modalFns, стек «назад» modal38), потом
//   layout273 перекладывает готовые узлы по шаблону — сразу и ещё раз в микрозадаче, чтобы подхватить кнопки, которые
//   вызывающий код дописывает в #modal после show() (family231, development22, openDecision24, trips272).
// • Подписи вариантов и текст <h2> не меняются: их ловят обёртки по точной подписи (films269, trips2722, workspaces58)
//   и тесты. Индексы choose(i) тоже: двигаются узлы, а не варианты. Все варианты остаются в контейнерах .options.
// • Кнопки «Не хватает» добавляют свои функции в конец modalFns и вызываются через choose(k), как в trips272. Они стоят
//   вне .options, чтобы прогонщик не нажимал их как обычные варианты.
// • Числа наверху — из тех же функций, что потом бросают кубик, ставят часы и списывают деньги: шанс работы —
//   jobEligibility16 (резюме × собеседование, как в finishTask), шанс поступления — admission16, часы учёбы —
//   schedule23, цена — tuition16, деньги поездки — таблица самой поездки и quoteJourney57, даты — dateLabel86.
// • В сохранении ничего нового. «Подробнее» запоминается по виду окна в localStorage этого браузера.
// • Второй проход (вид и тексты): card.table(row, section, detail) — что из старой таблицы не показывать и в «Все условия»
//   (макеты «Убрано»: повтор заголовка, очевидное, нули, оговорки про «игровое»); card.opts(list) — поправить подсказку
//   или сделать вариант серым с причиной (подписи не меняются); card.drop — дописанные кнопки, которые заменил вариант
//   карточки; card.side — вторая главная кнопка в один ряд с первой («Принять оффер» · «Отказаться»);
//   card.mainSecondary — единственная главная кнопка не главного вида (отмена поездки); need[].short — короткая причина
//   под серой главной кнопкой. Главные кнопки прилипают к низу экрана телефона, только если среди них есть доступная и
//   «Не хватает» пусто. Всё, что нажимают, на телефоне не ниже 44 px.
// Окна без карточки рисуются как раньше, с двумя общими исправлениями: у серой кнопки видна причина (поле why или
// reason варианта), а текст окна с таблицей nextDetail20 больше не пропадает — он стоит над таблицей.
// Новая постоянная обёртка show(), подключённая после этого файла, увидит уже переложенное окно; новые кнопки окна
// кладите в варианты show(), а не дописывайте в #modal.

const windows273Base={show,jobDetails16,programDetails16,travelDraftMenu52,travelInviteMenu53,travelTripMenu52,
 journeyDraftMenu57,tripInsertReady272,educationPlanMenu231};
let nextCard273=null,card273=null,ctx273=null,seq273=0;

// ---------- мелочи ----------

const monthIn273={Январь:'январе',Февраль:'феврале',Март:'марте',Апрель:'апреле',Май:'мае',Июнь:'июне',Июль:'июле',
 Август:'августе',Сентябрь:'сентябре',Октябрь:'октябре',Ноябрь:'ноябре',Декабрь:'декабре'};
const monthOf273={Январь:'января',Февраль:'февраля',Март:'марта',Апрель:'апреля',Май:'мая',Июнь:'июня',Июль:'июля',
 Август:'августа',Сентябрь:'сентября',Октябрь:'октября',Ноябрь:'ноября',Декабрь:'декабря'};
function month273(tick,forms){const [m,y]=String(dateLabel86(tick)).split(' ');return (forms[m]||String(m).toLowerCase())+' '+y;}
function inMonth273(tick){return 'в '+month273(tick,monthIn273);}
function sinceMonth273(tick){return 'с '+month273(tick,monthOf273);}
function untilMonth273(tick){return 'до конца '+month273(tick,monthOf273);}
function pct273(p){return Math.round(p*100)+'%';}
function chanceWord273(p){const n=Math.round(p*100);return n<25?'маловероятно':n<50?'скорее нет':n<75?'скорее да':n<95?'вероятно':'почти наверняка';}
function plural273(n,one,few,many){const a=Math.abs(n)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many;}
function span273(months){if(months>=12&&months%12===0){const y=months/12;return y+' '+plural273(y,'год','года','лет');}return months+' мес.';}
function hours273(h){return '≈ '+Math.round(h)+' ч/нед.';}
function num273(n){n=+n;return Number.isFinite(n)?(Math.abs(n-Math.round(n))<.05?String(Math.round(n)):n.toFixed(1).replace('.',',')):'';}
function lower273(t){t=String(t||'');return t.charAt(0).toLowerCase()+t.slice(1);}
function optLabel273(b){return [...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').replace(/\s+/g,' ').trim();}
function is273(label,list){return (list||[]).some(x=>x instanceof RegExp?x.test(label):x===label);}
function moreOpen273(kind){try{return localStorage.getItem('more273:'+kind)==='1';}catch(e){return false;}}
function moreToggle273(el){try{localStorage.setItem('more273:'+el.dataset.kind,el.open?'1':'0');}catch(e){}}
function rows273(detail){return (detail?.sections||[]).flatMap(g=>(g.rows||[]).map(r=>({...r,section:g.title})));}
function rowValue273(detail,label,section){return rows273(detail).find(r=>r.label===label&&(!section||r.section===section))?.value||'';}
// Темп занятий — как в advanceMonth (clock.js): min(1, свободные часы / часы занятий), при усталости больше 75 — ×0,65.
// extra — часы занятия, которого ещё нет в расписании. Нет свободных часов — темп 0: занятие стоит на месте.
function taskPace273(extra=0){try{return Math.max(0,Math.min(1,capacity()/Math.max(1,totalHours()+extra))*(s.clock.fatigue>75?.65:1));}catch(e){return 1;}}
function taskMonths273(left,extra=0){const p=taskPace273(extra);return p>0?Math.max(1,Math.ceil(left/p-1e-9)):Infinity;}
function taskLeft273(t){return taskMonths273(Math.max(0,(t.duration||1)-(t.progress||0)));}
// «ответ примерно в марте 2073», или честно, что без свободных часов ответа не будет.
function answerIn273(months,word='ответ',stuck='ответа не будет, пока в неделе нет свободных часов'){return Number.isFinite(months)?word+' примерно '+inMonth273(s.clock.ticks+months):stuck;}
// Строка «Не хватает» про свободное время: без него занятие стоит на месте (темп 0).
function freeNeed273(hours,what){
 if(taskPace273(hours)>0)return null;
 return {text:'Свободного времени — в неделе сейчас 0 ч',fix:typeof loadMenu29==='function'?{label:'Нагрузка и время',hint:'без свободных часов '+what+' не сдвинется',fn:()=>loadMenu29()}:null,when:'без свободных часов '+what+' не сдвинется'};
}
function liveTask273(kind,test){return (s.clock.tasks||[]).find(t=>t.kind===kind&&!['completed','cancelled'].includes(t.state)&&test(t));}
const foot273=/^(Назад|Закрыть|Вернуться|К предложениям|Все решения|Карточка поездки)/;
function cap273(t){t=String(t||'');return t.charAt(0).toUpperCase()+t.slice(1);}
function days273(n){return n+' '+plural273(n,'день','дня','дней');}
function zero273(t){return /^0(\D|$)/.test(String(t??'').replace(/\s/g,''));}
// Оговорки про «игровую модель» (правило «Текст» в ROADMAP) из старых таблиц и причин — обычными словами. Только то,
// что попадает в окна 273: правила стран (rights31), таблица программы (readability20), визы (visas86).
const ungame273List=[
 [/Игровой лимит работы на учебном основании: /g,'Лимит работы на учебном основании: '],
 [/Учебное основание в игре не даёт права на работу/g,'Учебное основание не даёт права на работу'],
 [/Консервативный игровой маршрут с проверкой документов на подработку/g,'Подработка — после проверки документов'],
 [/Очная программа в условно аккредитованном игровом вузе; /g,'Очная программа; '],
 [/; (\d+) ч — игровой лимит нагрузки, не национальный закон/g,'; до $1 ч/нед.'],
 [/; (\d+) ч — игровой лимит/g,'; до $1 ч/нед.'],
 [/Этот игровой студенческий маршрут не поддерживает самозанятость/g,'На студенческом статусе самозанятость недоступна'],
 [/ в игровой модели/g,''],
 [/Игровые программы и параметры; суммы/g,'Суммы'],
 [/ игровых мес\./g,' мес.']
];
function ungame273(t){t=String(t??'');if(!/игров/i.test(t))return t;for(const [re,to] of ungame273List)t=t.replace(re,to);return t;}
// «52 лет», «24 месяцев» из старых строк — с правильным окончанием.
function plurals273(t){return String(t??'').replace(/(\d+) лет(?![а-яё])/g,(m,n)=>n+' '+plural273(+n,'год','года','лет')).replace(/(\d+) месяцев(?![а-яё])/g,(m,n)=>n+' '+plural273(+n,'месяц','месяца','месяцев'));}
// Таблица окна для «Все условия» — копия без того, что макеты убрали (повтор заголовка, очевидное для этого персонажа,
// нули, оговорки про игру). keep(row, section) → false (убрать), true (оставить) или новая строка. Карточка считает свои
// числа по полной таблице. Раздел готовности поездки не трогается: его читает trips272.
function tableCopy273(detail,keep){
 const sections=[];
 for(const g of detail.sections||[]){
  const rows=[],ready=/^(Готовность|Перед согласием)$/.test(g.title);
  for(const r of g.rows||[]){
   let k=true;if(!ready)try{k=keep(r,g,detail);}catch(e){console.error(e);}
   if(k===false)continue;
   const row=k&&typeof k==='object'?k:r;
   rows.push({...row,value:plurals273(ungame273(row.value)),...(row.help?{help:ungame273(row.help)}:{})});
  }
  if(!rows.length&&!ready)continue;
  sections.push({...g,rows,note:g.note?ungame273(g.note):g.note});
 }
 return {...detail,sections};
}

// ---------- show(): карточка, причины у серых кнопок, текст окна ----------

show=function(title,text,opts=[],...rest){
 const card=nextCard273,detail=nextDetail20;
 nextCard273=null;
 const seq=++seq273;
 // Убранное по макетам (повтор заголовка, очевидное, нули, оговорки про игру) не попадает и в «Все условия»: таблица
 // рисуется из копии без этих строк. Карточка считает свои числа по полной таблице (ctx.detail). Подписи вариантов
 // не меняются (их ловят по точной подписи), card.opts может поправить только подсказки и доступность.
 if(card&&detail?.sections&&typeof card.table==='function')try{nextDetail20=tableCopy273(detail,card.table);}catch(e){console.error(e);}
 if(card&&typeof card.opts==='function'&&Array.isArray(opts))try{opts=card.opts(opts);}catch(e){console.error(e);}
 const r=windows273Base.show.call(this,title,text,opts,...rest);
 card273=null;ctx273=null;
 const ctx={title:String(title??''),text:String(text??''),opts:Array.isArray(opts)?opts:[],detail,seq};
 let c=null;
 if(card)try{c=typeof card.build==='function'?{...card,...card.build(ctx)}:card;}catch(e){console.error(e);c=null;}
 // Карточка без главной кнопки и без статуса, который объясняет, почему её нет, — тупик: такое окно рисуется как раньше.
 if(c&&!mainFound273(c,ctx.opts)&&!c.status?.text)c=null;
 try{
  if(c){
   card273=c;ctx273=ctx;
   layout273(c,ctx);yo273();
   queueMicrotask(()=>{if(seq===seq273&&card273===c)try{layout273(c,ctx);yo273();}catch(e){console.error(e);}});
  }else if(detail&&ctx.text.trim())textBack273(ctx.text);
  whyDisabled273(ctx.opts,c?.disabledWhy||'',ctx.title);
 }catch(e){console.error(e);}
 return r;
};
function mainFound273(card,opts){
 if(!card.main?.length)return true;
 return (opts||[]).some(o=>o&&!o.hidden&&typeof o.label==='string'&&is273(o.label.replace(/\s+/g,' ').trim(),card.main));
}

function textHTML273(text){
 return '<div class="dialog-copy20 text273">'+String(text).split(/\n+/).map(t=>t.trim()).filter(Boolean).map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>';
}
// Окно с таблицей nextDetail20: readability20 ставит таблицу на место текста, и текст пропадал. Теперь он над таблицей.
function textBack273(text){
 const d=document.getElementById('modal'),det=d?.querySelector('.detail20');
 if(!det||d.querySelector('.text273'))return;
 det.insertAdjacentHTML('beforebegin',textHTML273(text));
}
// Серая кнопка: причина под подписью, если вариант её знает (why или reason) и её ещё нет в подсказке. Иначе — причина
// из таблицы окон why273 (fixes273.js: старые окна, где причину знает только условие disabled) или общая причина карточки.
function whyDisabled273(opts,fallback='',title=''){
 const d=document.getElementById('modal');
 if(!d)return;
 const why=new Map();let table=null;
 // Таблица окон смотрится, только если у серого варианта нет своей причины.
 const lookup=()=>table??=typeof why273!=='undefined'&&Array.isArray(why273)?why273.filter(w=>{try{return w.title instanceof RegExp?w.title.test(title):typeof w.title==='function'?!!w.title(title):w.title===title;}catch(e){return false;}}):[];
 for(const o of opts||[]){
  if(!o||!o.disabled||typeof o.label!=='string')continue;
  const label=o.label.replace(/\s+/g,' ').trim();
  let w=typeof o.why==='string'?o.why:typeof o.reason==='string'?o.reason:'';
  if(!w)for(const t of lookup()){if(w)break;try{w=t.why(label,o,title)||'';}catch(e){console.error(e);}}
  if(!w)w=fallback;
  if(w)why.set(label,w);
 }
 if(!why.size)return;
 for(const b of d.querySelectorAll('.options button[disabled]')){
  if(b.querySelector('.why273'))continue;
  const w=why.get(optLabel273(b)),hint=[...b.querySelectorAll('small')].map(x=>x.textContent).join(' ');
  if(!w||hint.replace(/\s+/g,' ').includes(w))continue;
  const sm=document.createElement('small');sm.className='why273';sm.textContent=w;b.append(sm);
 }
}

// ---------- разметка карточки ----------

// display269 меняет хранимые «Учеба», «Ребенок» на экране сразу после show(); строки карточки появляются позже.
function yo273(){try{if(typeof yoScreen269==='function')yoScreen269(document.getElementById('modal'));}catch(e){}}
function el273(tag,cls){const e=document.createElement(tag);if(cls)e.className=cls;return e;}
function topRows273(card){
 const out=[],c=card.chance;
 const chance=c&&Number.isFinite(c.p)?'<div class="row273 chance273"><dt>'+esc(c.label||'Шанс')+'</dt><dd><b>'+pct273(c.p)+'</b> · '+chanceWord273(c.p)+(c.note?'<small>'+esc(c.note)+'</small>':'')+'</dd></div>':'';
 if(card.chanceFirst)out.push(chance);
 for(const r of card.rows||[])if(r&&r.value)out.push('<div class="row273"><dt>'+esc(r.label||'')+'</dt><dd>'+esc(r.value)+(r.note?'<small>'+esc(r.note)+'</small>':'')+'</dd></div>');
 if(!card.chanceFirst)out.push(chance);
 if(card.pay)out.push('<div class="row273 pay273"><dt>'+esc(card.pay.label||'Платить')+'</dt><dd><span>'+esc(card.pay.value||'')+'</span><span class="chips273"></span></dd></div>');
 return out.join('');
}
// «Не хватает»: каждая строка — кнопка исправления (choose(k) по новым функциям в конце modalFns) или дата.
function needHTML273(card){
 const list=(card.need||[]).filter(n=>n&&n.text);
 if(!list.length)return '';
 const start=modalFns.length;let k=0;
 const row=n=>{
  if(n.fix&&typeof n.fix.fn==='function'){
   modalFns.push(n.fix.fn);
   return '<button type="button" class="fix273" onclick="choose('+(start+k++)+')"><span>'+esc(n.text)+'</span><small>'+esc(n.fix.label+(n.fix.hint?' · '+n.fix.hint:''))+'</small></button>';
  }
  return '<div class="fix273 nofix273"><span>'+esc(n.text)+'</span>'+(n.when?'<small>'+esc(n.when)+'</small>':'')+'</div>';
 };
 const head=list.slice(0,3).map(row).join(''),rest=list.slice(3);
 return '<h4>'+esc(card.needTitle||'Не хватает')+'</h4>'+head+(rest.length?'<details class="needmore273"><summary>ещё '+rest.length+'</summary>'+rest.map(row).join('')+'</details>':'');
}
function infoHTML273(card){
 return (card.more||[]).filter(m=>m&&m.text).map(m=>'<section class="info273"><h4>'+esc(m.title)+'</h4><p>'+esc(m.text)+'</p></section>').join('');
}
function setStatus273(status){
 const e=document.querySelector('#modal .status273');
 if(!e)return;
 e.hidden=!status?.text;e.textContent=status?.text||'';e.dataset.tone=status?.tone||'wait';
}

function layout273(card,ctx){
 const d=document.getElementById('modal'),h2=d?.querySelector('h2');
 if(!d||!h2)return;
 if(!d.querySelector('.top273')){
  const eb=[...d.children].find(e=>e.classList.contains('eyebrow'));
  if(eb&&card.area){eb.textContent=card.area;eb.classList.add('area273');}
  if(card.title){const t=el273('div','title273');t.textContent=card.title;h2.before(t);}
  if(card.h2==='sub')h2.classList.add('h2sub273');else if(card.h2==='hide')h2.classList.add('sr273');
  const nodes=[];
  if(card.sub){const e=el273('div','sub273');e.textContent=card.sub;nodes.push(e);}
  const st=el273('div','status273');nodes.push(st);
  const top=el273('dl','top273');top.innerHTML=topRows273(card);nodes.push(top);
  const need=el273('section','need273');need.innerHTML=needHTML273(card);nodes.push(need);
  nodes.push(el273('div','options main273'));
  if(card.mainNote){const e=el273('p','mnote273');e.textContent=card.mainNote;nodes.push(e);}
  const set=el273('section','set273');set.innerHTML='<h4>'+esc(card.settingsTitle||'Что поменять')+'</h4><div class="options setopts273"></div>';nodes.push(set);
  const more=el273('details','more273');
  more.dataset.kind=card.kind;more.setAttribute('ontoggle','moreToggle273(this)');
  more.innerHTML='<summary>Подробнее'+(card.moreHint?'<small>'+esc(card.moreHint)+'</small>':'')+'</summary><div class="more-body273"><div class="infos273">'+infoHTML273(card)+
   '</div><h4 class="others-h273">Другие действия</h4><div class="others273"></div><details class="all273"><summary>'+esc(card.allTitle||'Все условия')+'</summary><div class="all-body273"></div></details></div>';
  if(moreOpen273(card.kind))more.open=true;
  nodes.push(more);
  nodes.push(el273('div','options foot273'));
  h2.after(...nodes);
  setStatus273(card.status);
 }
 adopt273(card,ctx,d,h2);
}

// Раскладывает то, что нарисовала цепочка show() и дописал вызывающий код. Можно звать сколько угодно раз.
function adopt273(card,ctx,d,h2){
 const mine='.title273,.sub273,.status273,.top273,.need273,.main273,.set273,.more273,.foot273,.mnote273';
 const main=d.querySelector('.main273'),setBox=d.querySelector('.setopts273'),foot=d.querySelector('.foot273'),
  others=d.querySelector('.others273'),allBody=d.querySelector('.all-body273'),chips=d.querySelector('.chips273');
 if(!main||!others||!allBody)return;
 // Прежние варианты — в «Подробнее», под «Другие действия».
 let orig=d.querySelector('.options.orig273');
 if(!orig){orig=[...d.querySelectorAll('.options')].find(o=>!o.closest(mine));if(orig)orig.classList.add('orig273');}
 if(orig&&orig.nextElementSibling!==others)others.before(orig);
 // Текст окна и таблица — в «Все условия». Поля ввода остаются на виду, над главными кнопками.
 // Решается один раз, при первой раскладке: если цепочка show() нарисовала текст абзацем, он сам уйдёт в «Все условия»,
 // иначе (таблица nextDetail20 заняла место текста) текст добавляется. Свои узлы карточки (подпись под главными
 // кнопками .mnote273) — не текст окна: из-за них текст программы вуза пропадал.
 if(card.text!==false&&ctx.text.trim()&&!allBody.dataset.text273){
  allBody.dataset.text273=d.querySelector(':scope > p:not(.mnote273), :scope > .dialog-copy20:not(.text273)')?'own':'added';
  if(allBody.dataset.text273==='added')allBody.insertAdjacentHTML('afterbegin',textHTML273(ctx.text));
 }
 /* 2732: подсказка «?» (onboarding180, attachHint180) переписывает окно после show() и заворачивает <h2> в
    div.hint-heading187 — эта обёртка остаётся на месте заголовка, а не уходит в «Все условия» вместе с <h2>. */
 const headBox=[...d.children].find(e=>e!==h2&&e.contains(h2));
 for(const e of [...d.children]){
  if(e===h2||e===headBox||e.matches(mine)||e.matches('.modal-closebar38,.eyebrow,.options,button'))continue;
  if(e.matches('input,select,textarea,label,form'))main.before(e);
  else if(e.matches('p')&&!e.textContent.trim()&&!e.children.length)e.remove();
  else allBody.append(e);
 }
 // Кнопки по подписи: главные, «Что поменять», подвал; остальные остаются в «Другие действия».
 const labels=new Set([...d.querySelectorAll('.options button')].map(optLabel273));
 if(orig)for(const b of [...orig.querySelectorAll(':scope > button')]){
  const l=optLabel273(b);
  if(is273(l,card.main))main.append(b);
  else if(card.settings&&is273(l,card.settings))setBox.append(b);
  else if(is273(l,card.foot||[foot273]))foot.append(b);
 }
 // Кнопки, дописанные прямо в #modal: дубль варианта убираем, главные — наверх, оплата — в строку «Платить».
 for(const b of [...d.querySelectorAll('button')]){
  if(b.closest('.options,.modal-closebar38,.need273,.chips273,.others273')||b.classList.contains('fix273')||headBox?.contains(b))continue; /* 2732: «?» у заголовка */
  const l=b.textContent.replace(/\s+/g,' ').trim();
  // card.drop — дописанные кнопки, которые карточка заменила своим вариантом (отказ из «Ожидают ответа», navigation24).
  if(labels.has(l)||card.drop&&is273(l,card.drop)){b.remove();continue;}
  if(chips&&card.pay&&is273(l,card.pay.chips)){chips.append(b);continue;}
  others.append(b);
 }
 if(chips&&card.pay?.hints)for(const b of chips.querySelectorAll('button'))if(!b.querySelector('small')){const h=card.pay.hints[b.textContent.trim()];if(h){const sm=document.createElement('small');sm.textContent=h;b.append(sm);}}
 // Порядок главных — как в карточке.
 const order=b=>{const l=optLabel273(b);const i=(card.main||[]).findIndex(x=>x instanceof RegExp?x.test(l):x===l);return i<0?99:i;};
 [...main.children].sort((a,b)=>order(a)-order(b)).forEach(b=>main.append(b));
 // «Принять оффер» и «Отказаться» — в один ряд, как в макете; отказ — по своей ширине.
 const kids=[...main.children].filter(b=>!b.hidden);
 main.classList.toggle('pair273',kids.length===2&&!!card.side&&is273(optLabel273(kids[1]),card.side));
 main.classList.toggle('second273',!!card.mainSecondary);
 // Вариант, который стоит кнопкой в «Не хватает», не повторяется в «Других действиях».
 for(const b of orig?orig.querySelectorAll(':scope > button'):[])b.hidden=!!card.hideOpts?.includes(optLabel273(b));
 mainWhy273(card);
 d.querySelector('.set273').hidden=!setBox.children.length;
 d.querySelector('.others-h273').hidden=!(orig?.children.length||others.children.length);
 d.querySelector('.all273').hidden=!allBody.children.length;
 foot.hidden=!foot.children.length;
 d.querySelector('.need273').hidden=!d.querySelector('.need273').children.length;
}
// Серая главная кнопка: причина под подписью — первая строка «Не хватает», коротко («сначала нужен профиль …»).
// На телефоне главные кнопки прилипают к низу экрана, только если среди них есть доступная и «Не хватает» пусто:
// серая кнопка не должна закрывать кнопку, которая её исправляет.
function mainWhy273(card){
 const first=(card.need||[]).find(n=>n&&n.text),why=card.mainWhy||first?.short||first?.text||'';
 const main=document.querySelector('#modal .main273'),need=document.querySelector('#modal .need273');
 for(const b of main?main.querySelectorAll('button'):[]){
  let sm=b.querySelector('.why273');
  if(!b.disabled||!why){if(sm&&sm.dataset.card273)sm.remove();continue;}
  if(!sm){sm=document.createElement('small');sm.className='why273';b.append(sm);}
  sm.dataset.card273='1';sm.textContent=why;
 }
 if(main)main.classList.toggle('stick273',!card.mainSecondary&&[...main.querySelectorAll('button')].some(b=>!b.disabled&&!b.hidden)&&!(need&&!need.hidden&&need.children.length));
}

// ---------- вакансия, отклик, собеседование, оффер ----------

// Этапы отклика — те же, что ставят applyJob16 (резюме: task16 на 1 мес. по 2 ч/нед.) и interview16 (1 мес. по 3 ч/нед.).
const jobSteps273={resume:{months:1,hours:2},interview:{months:1,hours:3}};
function interviewChance273(p){return Math.min(.95,p+.15);} // как в finishTask: interviewRoll < min(.95, probability+.15)
// Нужен ли переезд к выходу на работу. Тогда о нём говорит отдельная строка «Переезд», а не вторая строка заголовка.
function jobMove273(v){return v.format!=='remote'&&(['city','abroad'].includes(v.format)&&v.city!==residenceCity()||v.country!==s.country);}
function workPlace273(v){
 if(v.format==='remote')return 'удалённо';
 if(jobMove273(v))return v.format==='hybrid'?'гибрид':'офис';
 let m=0;try{m=Math.round(commuteFor16(v)||0);}catch(e){}
 return (v.format==='hybrid'?'гибрид':'офис')+(m>0?', '+m+' мин дороги':'');
}
function jobCitizen273(v){try{return !!rights31(v.country,v).citizen;}catch(e){return v.country===s.country;}}
// Договор словами: «срочный договор на 2 года», «бессрочный договор».
function contract273(value){const m=/^(.+?) · (\d+) мес\.$/.exec(value||'');return m?lower273(m[1])+' на '+span273(+m[2]):lower273(value);}
// «Все условия» вакансии без того, что макет убрал: источник, повтор города и статуса, ставка 100%, очевидное для
// гражданина (правила страны, право работать, разрешение), «Переезд не требуется», проживание в том же городе.
function vacancyTable273(v){
 const citizen=jobCitizen273(v),here=v.country===s.country&&v.city===residenceCity();
 return (r,g)=>{
  const l=r.label,val=String(r.value??'');
  if(g.title==='Условия'&&['Источник','Где','Статус заявки'].includes(l))return false;
  if(l==='Ставка'&&val==='100%')return false;
  if(l==='Оформление'&&/не требуется/.test(val))return false;
  if(l==='Базовое проживание'&&here)return false;
  if(g.title==='Правила страны'&&citizen)return false;
  if(citizen&&['Совместимость со статусом','Право работать в стране вакансии'].includes(l))return false;
  if(l==='Повторная подача'&&r.ok===true)return false;
  if(l==='Местоположение для выхода'&&/не требуется/.test(val))return false;
  return true;
 };
}
// Текст окна вакансии (он в «Все условия»): без источника и без проживания в том же городе.
function vacancyText273(v,text){
 let t=String(text??'').replace(/ ?Источник: [^.\n]*\./,'');
 if(v.country===s.country&&v.city===residenceCity())t=t.replace(/ ?Проживание около [^\n]*?пересчитается\./,'');
 return plurals273(ungame273(t));
}
// Выполненные требования одной строкой, как в макете: только настоящие, строчными, без очевидного для этого персонажа.
// levels — с уровнями («английский C1 (нужно B1)»); skip(row) — что ещё не писать.
function metList273(detail,{section=null,levels=true,skip=()=>false}={}){
 const out=[],last=[];
 for(const r of rows273(detail)){
  if(r.ok!==true||section&&r.section!==section||skip(r))continue;
  const l=r.label,v=String(r.value||''),need=/^(.+?) \/ нужно (.+)$/.exec(v),lv=need&&levels?' '+need[1]+' (нужно '+need[2]+')':'';
  let m;
  if(/^(Повторная подача|Срок повторной подачи)$/.test(l)||(l==='Опыт'||l==='Местоположение для выхода')&&/не требуется/.test(v))continue;
  if(l==='Возраст')out.push('возраст');
  else if((m=/^Язык · (.+)$/.exec(l)))out.push(lower273(m[1])+lv);
  else if(l==='Профессиональные навыки')out.push('навыки'+lv);
  else if(l==='Совместимость со статусом')out.push('часы по вашему статусу');
  else if(l==='Право работать в стране вакансии')out.push('право работать');
  else if(l==='Профиль'){const name=v.split(' · ')[0].trim();last.push(name?'профиль «'+name+'»':'профиль');}
  else out.push(lower273(l));
 }
 return [...out,...last];
}
function jobStatus273(a){
 const t=s.clock.ticks;
 if(a.status==='submitted'){const k=liveTask273('pathJob',k=>k.application===a.id);return {text:'Резюме отправлено'+(k?' · '+answerIn273(taskLeft273(k)):''),tone:'wait'};}
 if(a.status==='interview')return {text:'Приглашение на собеседование'+(Number.isFinite(a.expires)?' · ответить '+untilMonth273(a.expires):''),tone:'wait'};
 if(a.status==='interviewing'){const k=liveTask273('pathInterview',k=>k.application===a.id);return {text:'Собеседование идёт'+(k?' · '+answerIn273(taskLeft273(k)):''),tone:'wait'};}
 if(a.status==='offered')return {text:'Оффер'+(Number.isFinite(a.expires)?' · ответить '+untilMonth273(a.expires):''),tone:'wait'};
 if(a.status==='accepted')return {text:'Оффер принят · осталось выйти на работу',tone:'ok'};
 if(a.status==='employed'){const v=a.vacancy,now=s.job&&s.job.employer===v.employer&&s.job.professionId===v.profession;return {text:now?'Вы работаете здесь':'Вы здесь работали',tone:'ok'};}
 return {text:lower273(status16[a.status]||'Отклик закрыт').replace(/^./,c=>c.toUpperCase()),tone:'bad'};
}
function jobStepsText273(a){
 const R=jobSteps273.resume,I=jobSteps273.interview,iv='собеседование — '+I.months+' мес. по '+I.hours+' ч/нед.';
 if(!a)return 'резюме — '+R.months+' мес. по '+R.hours+' ч/нед., '+answerIn273(taskMonths273(R.months,R.hours))+'; потом '+iv;
 if(a.status==='submitted')return 'потом '+iv;
 if(a.status==='interview')return iv;
 return '';
}
// Язык: курс именно этого языка, с ценой, часами и приростом (languageLesson16 — то, что спишет languageTask16).
function langNeed273(lang,need,back){
 const name=lang16[lang],have=cefr16[level16(lang)]||cefr16[0],text=name+' '+cefr16[need]+' — у вас '+have,short='сначала '+lower273(name)+' '+cefr16[need];
 const t=liveTask273('pathLanguage',t=>t.language===lang);
 if(t)return {text,short,when:'занятия '+answerIn273(taskLeft273(t),'идут, закончатся','стоят — в неделе нет свободных часов')};
 const L=languageLesson16('course');
 return {text,short,fix:{label:'Курс · '+name,hint:L.months+' мес. · '+L.hours+' ч/нед. · '+money(L.cost)+' сразу · +'+String(L.gain).replace('.',',')+' уровня',fn:()=>{languageTask16(lang,'course');back();}}};
}
function skillNeed273(field,need,back){
 const have=Math.round(path16().experience.skills[field]||s.skill),text='Подготовка '+need+' — у вас '+have,short='сначала подготовка '+need;
 const t=liveTask273('pathSkill',t=>t.field===field);
 if(t)return {text,short,when:'практика '+answerIn273(taskLeft273(t),'идёт, закончится','стоит — в неделе нет свободных часов')};
 return {text,short,fix:{label:'Практика · '+fields16[field].name,hint:'3 мес. · 4 ч/нед.',fn:()=>{skillTask16(field);back();}}}; // как в skillTask16
}
// Каждая причина из jobEligibility16 (trajectory16 и обёртки careers45, specializations46, teaching26, employment28,
// rights31, court94) — строкой с кнопкой, которая её исправляет, или с объяснением, когда исправить действием нельзя.
function jobNeed273(w,v,p){
 const back=()=>jobDetails16(v.id),jobs=view=>()=>{Object.assign(path16().view,{page:0},view);openPath16('jobs');};
 if(w===lang16[v.language]+' '+cefr16[p.language])return langNeed273(v.language,p.language,back);
 if(/^Работа с 16 лет/.test(w))return {text:'Работа — с 16 лет',when:'через '+(16-s.age)+' '+plural273(16-s.age,'год','года','лет')};
 if(/^Обязателен диплом/.test(w))return {text:w,fix:{label:'Где получить диплом',hint:levels16[p.required]+' · '+fields16[p.field].name,fn:()=>educationRoute20(p.field,p.required)}};
 if(/^Нужен профессиональный допуск/.test(w))return {text:w,fix:{label:'Подать на допуск',fn:()=>{license16(p.id,v.country);back();}}};
 if(/^Работодатель не нанимает резидентов/.test(w)){const list=(v.allowedCountries||[]).map(k=>countries[k]?.name||k).join(', ');
  return {text:'Работодатель нанимает только из стран: '+list,fix:{label:'Переезд и документы',hint:list,fn:()=>openPath16('mobility')}};}
 let m=/^Профессиональная подготовка от (\d+)/.exec(w);
 if(m)return skillNeed273(p.field,+m[1],back);
 m=/^Профильная подготовка: .+ от (\d+)\/100$/.exec(w);
 if(m&&v.profile46&&typeof profileScore46==='function'){
  const track=[...v.profile46.tracks].sort((a,b)=>profileScore46(b)-profileScore46(a))[0],text='Профильная подготовка «'+trackNames46[track]+'» '+m[1]+' — у вас '+Math.round(profileScore46(track));
  const t=liveTask273('profilePractice46',t=>t.track===track);
  if(t)return {text,when:'практика '+answerIn273(taskLeft273(t),'идёт, закончится','стоит — в неделе нет свободных часов')};
  if(s.age<16||typeof practiceProfile46!=='function')return {text,fix:{label:'Профильное обучение',hint:trackNames46[track],fn:()=>profileEducation46(track,'certificate')}};
  return {text,fix:{label:'Практика · '+trackNames46[track],hint:'3 мес. · 4 ч/нед. · до +10',fn:()=>{practiceProfile46(track);back();}}}; // как в practiceProfile46
 }
 m=/^Профильная квалификация: (.+?) · (.+)$/.exec(w);
 if(m&&v.profile46&&typeof profileEducation46==='function'){
  const q=v.profile46,track=q.tracks[0],level=q.degree&&!hasDiploma16(p.field,q.degree)?q.degree:'certificate';
  return {text:'Профильная квалификация: '+m[1]+' · '+m[2],fix:{label:'Профильное обучение',hint:levels16[level]+' · '+trackNames46[track],fn:()=>profileEducation46(track,level)}}; // как «Подобрать профильное обучение»
 }
 m=/^Нужен релевантный опыт: (\d+)/.exec(w);
 if(m){const have=typeof relevantExperience45==='function'?Math.floor(relevantExperience45(v)):0;
  return {text:'Опыт по профессии — '+m[1]+' мес., у вас '+have,fix:{label:'Вакансии без опыта',hint:fields16[p.field].name,fn:jobs({experience45:'none',field:p.field})}};}
 m=/^Нужна предметная квалификация: (.+)$/.exec(w);
 if(m&&typeof teachingMenu26==='function')return {text:w,fix:{label:'Обучение по предмету',hint:m[1],fn:()=>teachingMenu26(v.subject26)}};
 m=/^(.+) C1 для преподавания$/.exec(w);
 if(m){const sub=typeof teachingSubjects26!=='undefined'&&teachingSubjects26[v.subject26];if(sub?.language)return langNeed273(sub.language,5,back);}
 // Часы: статус разрешает меньше, чем требует вакансия — та же работа на меньшую ставку.
 m=/^Статус разрешает до (\d+) ч\/нед\.|^Студенческий лимит (\d+) ч\/нед\./.exec(w);
 if(m){const limit=+(m[1]||m[2]),full=v.fullHours28??40,f=[.75,.5,.25].find(f=>full*f<=limit);
  return {text:w.replace(/;.*/,'')+(m[1]?', вакансия — '+(v.hours28??40)+' ч/нед.':''),...(f?{fix:{label:'Вакансии на меньшую ставку',hint:'до '+limit+' ч/нед.',fn:jobs({fte28:String(f)})}}:{when:'нужна вакансия до '+limit+' ч/нед.'})};}
 if(/^Нет права на эту работу/.test(w))return {text:w,fix:{label:'Документы',hint:'разрешение на работу',fn:()=>openPath16('mobility')}};
 if(/самозанятость/.test(w))return {text:'На студенческом статусе самозанятость недоступна',when:'пока вы на студенческом статусе'};
 if(/заключения/.test(w))return {text:w,when:'до конца заключения'};
 return {text:ungame273(w)};
}
function vacancyBuild273(v,a,ctx){
 const x=path16(),p=profession16(v.profession),r=jobEligibility16(v),pay=localAmount16(v.salary,v.country),month=pay/12,stage=a?.status||null;
 const card={rows:[],need:[],more:[],main:[],foot:[foot273]};
 card.sub=[v.employer,v.city+(v.country!==s.country?', '+(countries[v.country]?.name||''):''),workPlace273(v)].filter(Boolean).join(' · ');
 if(a)card.status=jobStatus273(a);
 const cur=s.job&&stage!=='employed'?s.job.salary/12:null,diff=cur==null?0:month-cur;
 card.rows.push({label:'Получите',value:money(month)+'/мес. на руки',note:cur==null?'':Math.abs(diff)<1?'столько же, сколько сейчас':'на '+money(Math.abs(diff))+(diff<0?' меньше':' больше')+' нынешней'});
 const contract=rowValue273(ctx.detail,'Тип','Трудовой договор');
 card.rows.push({label:'Цена',value:[(v.hours28??40)+' ч/нед.',contract?contract273(contract):''].filter(Boolean).join(' · '),note:['interview','submitted'].includes(stage)||!a?jobStepsText273(a):''});
 if(jobMove273(v))card.rows.push({label:'Переезд',value:v.country!==s.country?'к выходу на работу нужны переезд и разрешение на работу':'к выходу на работу нужен переезд'});
 const resume=a?a.probability:r.probability,iv=interviewChance273(resume);
 if(!a&&!r.why.length||stage==='submitted')card.chance={label:'Шанс оффера',p:resume*iv};
 else if(stage==='interview'||stage==='interviewing')card.chance={label:'Шанс оффера',p:iv};
 if(card.chance)card.more.push({title:'Почему '+pct273(card.chance.p),text:(stage==='interview'||stage==='interviewing'?'Резюме прошло, осталось собеседование: '+pct273(iv)+'.':'Резюме '+pct273(resume)+' × собеседование '+pct273(iv)+'.')+(a?' Шанс резюме посчитан, когда вы его отправили.':' '+r.factors+'.')});
 if(!a){
  for(const w of r.why)card.need.push(jobNeed273(w,v,p));
  const retry=x.retry['job-'+v.profession+'-'+v.country]||0;
  if(s.clock.ticks<retry)card.need.push({text:'Повторный отклик на эту профессию в этой стране',when:sinceMonth273(retry)});
  const free=freeNeed273(jobSteps273.resume.hours,'резюме');if(free)card.need.push(free);
  card.main=['Отправить резюме'];
  // Как поднять шанс: законченные работы своего профиля (портфолио, career45) — пока резюме не отправлено.
  const port=rowValue273(ctx.detail,'Подходящие работы','Портфолио'),gain=/до (\d+) процентн/.exec(rowValue273(ctx.detail,'Влияние','Портфолио'));
  if(card.chance&&port&&gain){const parts=port.split(' · ').map(t=>/^(.+): (\d+)$/.exec(t.trim())).filter(Boolean),have=parts.reduce((n,m)=>n+ +m[2],0);
   if(parts.length)card.more.push({title:'Как поднять шанс',text:'Законченные работы своего профиля ('+parts.map(m=>lower273(m[1])).join(', ')+') — до +'+gain[1]+' п. п. '+(have?'Сейчас их '+have+'.':'Сейчас таких работ нет.')});}
 }else{
  // Отказ — свой вариант карточки «Отказаться» (с подтверждением); кнопку navigation24 с той же целью карточка убирает.
  card.main=['Пройти собеседование','Принять оффер','Выйти на работу','Документы и переезд','Отказаться'];
  card.side=['Отказаться'];card.drop=['Отказаться от предложения / собеседования'];
 }
 card.more.push({title:'В год',text:money(pay)+' на руки'+(s.job&&stage!=='employed'?'; сейчас '+money(s.job.salary):'')+'.'});
 const citizen=jobCitizen273(v);
 const met=metList273(ctx.detail,{skip:r=>citizen&&['Совместимость со статусом','Право работать в стране вакансии'].includes(r.label)});
 if(met.length)card.more.push({title:card.need.length?'Остальное выполнено':'Требования выполнены',text:cap273(met.join(', '))+'.'});
 // Договор и дорога: срок договора, дорога от нынешнего дома (если переезд не нужен), рост ставки.
 const deal=[],term=rowValue273(ctx.detail,'Срок','Трудовой договор'),road=rowValue273(ctx.detail,'Дорога в одну сторону'),fare=rowValue273(ctx.detail,'Транспорт'),grow=/^([\d.]+)×/.exec(rowValue273(ctx.detail,'Потенциал роста'));
 if(contract)deal.push(cap273(contract273(contract))+(term&&/выхода на работу/.test(term)?' — срок считается с выхода на работу':'')+'.');
 const withRoad=road&&v.format!=='remote'&&!jobMove273(v);
 if(withRoad)deal.push('Дорога '+road+' в одну сторону'+(fare&&!zero273(fare)?', транспорт '+fare.replace(/\.$/,''):'')+'.');
 if(grow)deal.push('Рост — до '+grow[1].replace('.',',')+' базовой ставки.');
 if(deal.length)card.more.push({title:withRoad?'Договор и дорога':'Договор',text:deal.join(' ')});
 card.moreHint=(card.chance?'почему '+pct273(card.chance.p)+', ':'')+'требования, договор';
 return card;
}
// Отказ от отклика: на первом экране рядом с «Принять», поэтому с коротким подтверждением.
function jobDeclineAsk273(id){
 const a=path16().jobApplications.find(a=>a.id===id);
 if(!a||!decisionActive24({kind:'job',id}))return;
 show('Отказаться?',(a.status==='offered'||a.status==='accepted'?'Оффер «'+jobTitle270(a.vacancy.title)+'» закроется, вернуть его будет нельзя.':'Собеседование «'+jobTitle270(a.vacancy.title)+'» не состоится, отклик закроется.')+(s.job?' Нынешняя работа не меняется.':''),[
  // После отказа окно отклика открывается снова, уже со статусом: окно остаётся открытым, и очередь событий s.pending
  // не двигается — как раньше, когда отказ из «Ожидают ответа» шёл мимо choose() и просто закрывал окно.
  {label:'Да, отказаться',fn:()=>{declineDecision24('job',id);jobDetails16(id,true);}},
  {label:'Вернуться к отклику',fn:()=>jobDetails16(id,true)}
 ]);
}
function vacancyOpts273(v,a,id,opts){
 let list=opts;
 if(a&&decisionActive24({kind:'job',id})&&!list.some(o=>o?.label==='Отказаться')){
  const i=list.findIndex(o=>o?.label==='Закрыть'),decline={label:'Отказаться',fn:()=>jobDeclineAsk273(id)};
  list=i<0?[...list,decline]:[...list.slice(0,i),decline,...list.slice(i)];
 }
 return list;
}
jobDetails16=function(id,application=false,...rest){
 const x=path16(),a=application&&x.jobApplications.find(a=>a.id===id),v=a?a.vacancy:x.vacancies.find(v=>v.id===id);
 if(!v||nextCard273)return windows273Base.jobDetails16(id,application,...rest);
 const old=show;let done=false;
 nextCard273={kind:'vacancy',area:'Работа',title:jobTitle270(v.title),h2:'hide',table:vacancyTable273(v),build:ctx=>vacancyBuild273(v,a||null,ctx)};
 show=function(title,text,opts=[],...more){
  if(done)return old(title,text,opts,...more);
  done=true;
  let list=opts,body=text;try{list=vacancyOpts273(v,a||null,id,opts);body=vacancyText273(v,text);}catch(e){console.error(e);}
  return old(title,body,list,...more);
 };
 try{return windows273Base.jobDetails16(id,application,...rest);}finally{show=old;nextCard273=null;}
};

// ---------- программа вуза ----------

const diploma273={vocational:'диплом о профессиональном образовании',bachelor:'диплом бакалавра',master:'диплом магистра',phd:'степень PhD',certificate:'сертификат'};
// Часы, которые посчитает расписание, если учиться на этой программе: schedule23 с этой программой вместо нынешней.
function studyHours273(p){return studyLoad273(p).hours;}
// Как пойдёт учёба при нынешней неделе — те же формулы, что в monthPath16 (trajectory16.js), с этой программой в расписании:
// темп = max(0,25, min(1, свободные часы / (занятия + нагрузка программы))), оценки раз в квартал +1, если свободных часов
// больше, чем занятий, иначе −3. Плата за месяц (tuition44) берётся целиком при любом темпе — поэтому «всего» = цена × месяцы.
function studyLoad273(p){
 const x=path16(),old=x.study,mine=old&&old.program===p.id&&old.status!=='paused';
 const out={hours:0,pace:1,cap:0,tasks:0,total:0,falls:false,months:p.months,left:p.months};
 try{
  if(!mine)x.study={id:'hours273',program:p.id,status:'active',payer:'self',progress:0,grades:70,badTerms:0,startedAt:s.clock.ticks};
  const q=schedule23();out.hours=q.study;out.total=q.total;
  out.cap=capacity();out.tasks=totalHours();
  out.pace=Math.max(.25,Math.min(1,out.cap/Math.max(1,out.tasks+(p.hours||0))));
  out.falls=!(out.cap>out.tasks);
 }catch(e){console.error(e);}finally{x.study=old;}
 out.left=Math.max(0,p.months-(mine?old.progress||0:0));
 out.months=Math.max(1,Math.ceil(out.left/out.pace-1e-9));
 out.budget=typeof weekBudget29==='function'?weekBudget29():56;
 return out;
}
function certFor273(p){
 const same=prog16(String(p.id).replace('-'+p.level,'-certificate'));
 if(same&&same.level==='certificate'&&same.field===p.field)return same;
 const list=(typeof programs16!=='undefined'?programs16:[]).filter(q=>q.level==='certificate'&&q.field===p.field&&(q.track45||null)===(p.track45||null));
 return list.find(q=>q.city===p.city)||list.find(q=>q.country===p.country)||null;
}
// «Все условия» программы без того, что макет убрал: «Где», «Ступень», «Направление», «Длительность» (есть в заголовке
// и в «Получите»), выполненные проверки по одной (они — строкой «Остальное выполнено»), шанс и ответ комиссии (наверху,
// датой), проживание в том же городе.
function programTable273(p){
 const here=p.country===s.country&&p.city===residenceCity();
 return (r,g)=>{
  if(g.title==='Программа'&&['Где','Ступень','Направление','Длительность'].includes(r.label))return false;
  if(g.title==='Что нужно для заявки'&&r.ok===true)return false;
  if(['Шанс поступления','Ответ комиссии'].includes(r.label))return false;
  if(r.label==='Проживание'&&here)return false;
  return true;
 };
}
// Текст окна программы (в «Все условия»): «24 месяца», без проживания в том же городе.
function programText273(p,text){
 let t=plurals273(String(text??''));
 if(p.country===s.country&&p.city===residenceCity())t=t.replace(/ ?Базовое проживание [^\n]*?бюджет\./,'');
 // Срок ответа — датой наверху; «через 2 месяца доступного времени» не пишем.
 t=t.replace(/, ответ через \d+ месяц[а-я]* доступного времени;/,';');
 return ungame273(t);
}
function programNeed273(w,p){
 const back=()=>programDetails16(p.id);
 if(w===lang16[p.language]+' '+cefr16[p.minLanguage])return langNeed273(p.language,p.minLanguage,back);
 if(w==='Не достигнут возраст начала программы'){const min=programMinAge16(p),n=Math.max(1,Math.ceil(min-s.age));return {text:'Возраст — с '+min+' лет',when:'через '+n+' '+plural273(n,'год','года','лет')};}
 if(w==='Нужен диплом бакалавра')return {text:w,short:'сначала нужен диплом бакалавра',fix:{label:'Бакалавриат',hint:fields16[p.field].name,fn:()=>educationRoute20(p.field,'bachelor')}};
 if(w==='Нужна профильная магистратура')return {text:w,short:'сначала нужна профильная магистратура',fix:{label:'Магистратура',hint:fields16[p.field].name,fn:()=>educationRoute20(p.field,'master')}};
 if(/сертификат/.test(w)){
  // «Для магистратуры нужен профиль «X» или подготовительный сертификат» — как в макете: профиль и что есть у вас.
  const track=/«([^»]+)»/.exec(w)?.[1],general=track&&hasDiploma16(p.field,'bachelor');
  const text=track?'Профиль «'+track+'» — '+(general?'у вас общий бакалавриат':'его у вас нет'):w,short=track?'сначала нужен профиль «'+track+'»':'сначала подготовительный сертификат';
  const cp=certFor273(p);
  if(cp){let hint=span273(cp.months)+' · '+money(tuition16(cp,null))+'/мес. · '+hours273(studyHours273(cp));try{hint+=' · шанс '+pct273(admission16(cp).probability);}catch(e){}return {text,short,fix:{label:'Подготовительный сертификат',hint,fn:()=>programDetails16(cp.id)}};}
  return {text,short,fix:{label:'Подготовительные программы',fn:()=>educationRoute20(p.field,'certificate')}};
 }
 return {text:ungame273(w)};
}
function parentOdds273(p){
 const list=(typeof parents17==='function'?parents17():[]).map(q=>{try{return {q,o:educationPlanOdds231(p,q)};}catch(e){return null;}}).filter(Boolean);
 const f=ensureFamily17(),open=list.filter(x=>!(s.clock.ticks<(f.requests?.['plan231:'+p.id+':'+x.q.id]||0)));
 const best=open.filter(x=>!x.o.blocked).sort((a,b)=>b.o.willing-a.o.willing)[0];
 if(best)return 'шанс '+pct273(best.o.willing)+(open.length>1?' · '+best.q.name:'');
 if(open.length)return 'сейчас не смогут';
 const again=Math.min(...list.map(x=>f.requests?.['plan231:'+p.id+':'+x.q.id]||0));
 return list.length&&Number.isFinite(again)?'снова можно '+sinceMonth273(again):'';
}
function programBuild273(p,ctx){
 const x=path16(),r=admission16(p),a=x.applications.find(q=>q.program===p.id&&['submitted','offered','accepted','enrolled'].includes(q.status));
 const fee=tuition16(p,a||null),load=studyLoad273(p),hours=load.hours,appFee=c().cost*.003,retry=x.retry[p.id]||0,t=s.clock.ticks;
 const admitTask=a?.status==='submitted'&&liveTask273('pathAdmission',k=>k.application===a.id),admit=admitTask?taskLeft273(admitTask):taskMonths273(2,2);
 const plan=ensureFamily17().educationPlans231?.[p.id],planParent=plan&&living(plan.parentId),grant=typeof sponsor22==='function'?sponsor22(p.id):null;
 const card={rows:[],need:[],more:[],main:['Подать заявку'],foot:['Назад к каталогу',foot273],chanceFirst:true};
 const sub=[];if(!ctx.title.includes(p.city))sub.push(p.city);if(p.country!==s.country)sub.push(countries[p.country]?.name||'');
 if(sub.length)card.sub=sub.filter(Boolean).join(', ');
 if(a){
  if(a.status==='submitted')card.status={text:'Заявка подана'+(admitTask?' · '+answerIn273(admit):''),tone:'wait'};
  else if(a.status==='offered')card.status={text:'Предложение о зачислении'+(Number.isFinite(a.expires)?' · ответить '+untilMonth273(a.expires):''),tone:'wait'};
  else if(a.status==='accepted')card.status={text:'Место принято · осталось выбрать оплату и начать',tone:'ok'};
  else card.status={text:'Вы учитесь на этой программе',tone:'ok'};
 }
 if(!a||a.status==='submitted')card.chance={label:'Шанс поступить',p:a?a.probability:r.probability};
 // Срок и «всего» — при нынешней неделе: если на учёбу не хватает времени, она идёт медленнее, а платить надо каждый месяц.
 const slow=load.pace<1,enrolled=a?.status==='enrolled',start=enrolled||a&&a.status!=='submitted'?0:Number.isFinite(admit)?admit:2;
 card.rows.push({label:'Получите',value:diploma273[p.level]+' · '+(enrolled?'осталось ':'')+(slow?'≈ ':'')+span273(load.months),
  note:'окончание не раньше '+month273(t+start+load.months,monthOf273)+(slow?enrolled?' · без перегрузки — '+span273(Math.ceil(load.left-1e-9)):' · по программе '+span273(p.months):'')});
 card.rows.push({label:'Цена',value:money(fee)+'/мес. · '+(enrolled?'ещё ':'всего ')+(slow?'≈ ':'')+money(fee*load.months),note:hours273(hours)+(a?'':' · '+answerIn273(admit))});
 // До 18 лет заявку и учёбу оплачивают взрослые семьи (spend231 → payExpense23), а не карманные деньги.
 const adults=s.age<18?(typeof minorExpenseAdults137==='function'?minorExpenseAdults137():parents17()).filter(Boolean):[];
 const payer=planParent?planParent.name+' · '+pct273(plan.share)+' учёбы':s.age<18?(adults.length?adults.map(q=>q.name).join(', '):'родители'):grant?'компания и вы':'вы';
 const chips=[...(s.job?['Попросить компанию оплатить эту программу']:[]),...(s.age<26||plan?['Договориться с родителями об оплате']:[])];
 const hints={};
 if(s.job&&typeof sponsorEligibility22==='function'){try{const e=sponsorEligibility22(p);hints['Попросить компанию оплатить эту программу']=e.why.length?lower273(e.why[0]):'шанс '+pct273(e.probability);}catch(e){}}
 try{const h=parentOdds273(p);if(h)hints['Договориться с родителями об оплате']=h;}catch(e){}
 card.pay={label:'Платить',value:payer,chips,hints};
 if(!a){
  for(const w of r.why)card.need.push(programNeed273(w,p));
  if(t<retry)card.need.push({text:'Повторная заявка на эту программу',when:sinceMonth273(retry)});
  const free=freeNeed273(2,'заявка');if(free)card.need.push(free);
  if(!plan&&expenseAvailable231()<appFee)card.need.push({text:'На заявку нужно '+money(appFee)+' — сейчас доступно '+money(Math.max(0,expenseAvailable231())),fix:{label:'Финансы',fn:()=>financeMenu()}});
  card.mainNote='Стипендия — отдельной заявкой после подачи, шанс '+pct273(scholarship16(p));
 }
 if(slow||load.falls){
  // Насколько дольше — уже в «Получите» («≈ 8 лет … по программе 2 года»), здесь — коротко, чтобы кнопка «Подать заявку»
  // оставалась на первом экране телефона.
  const k=1/load.pace,times=num273(k),word=Number.isInteger(+times)?plural273(+times,'раз','раза','раз'):'раза';
  const effect=load.falls?'оценки будут падать':'учёба пойдёт в '+times+' '+word+' медленнее';
  card.need.push({text:'Свободного времени — '+Math.max(0,Math.round(load.cap))+' ч/нед.',short:'сначала нужно свободное время',
   fix:typeof loadMenu29==='function'?{label:'Нагрузка и время',hint:effect,fn:()=>loadMenu29()}:null,when:effect});
 }
 const sel=p.selectivity;
 // Почему: оценки, подготовка, язык при нужном уровне; селективность — один раз, словом и числом.
 const factors=String(r.factors||'').replace(/,\s*конкурс \d+\/100/,'').replace(/язык ([A-C][0-2]|—)/,(m,l)=>lower273(lang16[p.language])+' '+l+(cefr16[p.minLanguage]?' при нужном '+cefr16[p.minLanguage]:''));
 card.more.push({title:'Почему '+pct273(a?a.probability:r.probability),text:factors+'. Программа отбирает '+(sel>=80?'строго':sel>=60?'средне':'мягко')+' — '+sel+' из 100.'+(a?' Шанс посчитан, когда вы подали заявку.':'')});
 // Выполненное одной строкой. Подготовка по направлению не пишется, если «Не хватает» говорит о профиле: галочка
 // «Профиль подтверждён» спорила с красной строкой.
 const aboutProfile=card.need.some(n=>/профил|сертификат/i.test(n.text));
 const met=metList273(ctx.detail,{section:'Что нужно для заявки',levels:false,skip:r=>aboutProfile&&r.label==='Подготовка по направлению'});
 if(met.length)card.more.push({title:card.need.length?'Остальное выполнено':'Требования выполнены',text:cap273(met.join(', '))+'.'});
 // Кто платит: вы помесячно, компания и родители — с тем же шансом, что на кнопках строки «Платить».
 const monthly=money(fee)+' за каждый месяц учёбы';
 const who=[planParent?planParent.name+' платит '+pct273(plan.share)+' учёбы, остальное — вы.':payer==='вы'?'Вы — '+monthly+'.':grant?'Компания оплачивает часть, остальное — вы.':cap273(payer)+' — '+monthly+'.'];
 if(hints['Попросить компанию оплатить эту программу'])who.push('Компания может оплатить программу: '+hints['Попросить компанию оплатить эту программу']+'.');
 const ph=hints['Договориться с родителями об оплате'];
 if(ph&&s.age>=18)who.push('Родители могут оплатить часть: '+(/^шанс (\d+%) · (.+)$/.test(ph)?ph.replace(/^шанс (\d+%) · (.+)$/,'$2 — шанс $1'):ph)+'.');
 card.more.push({title:'Кто платит',text:who.join(' ')});
 // Что даёт: навык, профессии, оговорка про допуск — из раздела «Что даёт программа».
 const skill=/^(.+?) · растёт/.exec(rowValue273(ctx.detail,'Навык','Что даёт программа'))?.[1],jobsList=rowValue273(ctx.detail,'Профессии','Что даёт программа').split(',').map(t=>t.trim()).filter(Boolean);
 const gives=[];
 if(skill)gives.push('Навык «'+skill+'» растёт с каждым оплаченным периодом.');
 if(jobsList.length)gives.push('Профессии: '+jobsList.slice(0,4).map(lower273).join(', ')+(jobsList.length>4?' и ещё '+(jobsList.length-4):'')+'.');
 if(rowValue273(ctx.detail,'Допуск к работе','Что даёт программа'))gives.push('Диплом не заменяет опыт, язык и документы, которых требует работа.');
 if(gives.length)card.more.push({title:'Что даёт',text:gives.join(' ')});
 card.more.push({title:'О вузе',text:'Качество '+p.quality+', сложность '+p.difficulty+', престиж '+p.prestige+', связи с работодателями '+p.employment+'.'});
 card.moreHint='почему '+pct273(a?a.probability:r.probability)+', кто платит'+(gives.length?', что даёт':'');
 return card;
}
programDetails16=function(id,...rest){
 const p=prog16(id);
 if(!p||nextCard273)return windows273Base.programDetails16(id,...rest);
 const old=show;let done=false;
 nextCard273={kind:'program',area:'Учёба',title:levels16[p.level]+' · '+programName26(p),h2:'sub',table:programTable273(p),build:ctx=>programBuild273(p,ctx)};
 show=function(title,text,opts=[],...more){
  if(done)return old(title,text,opts,...more);
  done=true;
  let list=opts,body=text;
  try{
   const hours=studyHours273(p),r=admission16(p),fee=c().cost*.003,plan=ensureFamily17().educationPlans231?.[p.id],payer=plan&&living(plan.parentId);
   // Часы — те, что посчитает расписание, а не надбавка из каталога; «Подать заявку» не прячется, а сереет с причиной.
   for(const row of rows273(nextDetail20))if(row.label==='Нагрузка'&&row.section==='Программа'){const real=(nextDetail20.sections.find(g=>g.title===row.section)?.rows||[]).find(q=>q.label==='Нагрузка');if(real)real.value=hours273(hours);}
   body=programText273(p,String(text??'').replace(/\d+(?:[.,]\d+)? ч\/нед\. дополнительной нагрузки/,hours273(hours)+' по расписанию'));
   list=opts.map(o=>o?.label!=='Подать заявку'?o:{...o,hidden:false,disabled:!!(o.disabled||o.hidden),hint:'заявка '+money(fee)+(payer?' · платит '+payer.name:''),why:r.why[0]||''});
  }catch(e){console.error(e);}
  return old(title,body,list,...more);
 };
 try{return windows273Base.programDetails16(id,...rest);}finally{show=old;nextCard273=null;}
};
// Родители в «Оплате программы родителями»: шанс на кнопке — тот же, что бросает requestEducationPlan231.
educationPlanMenu231=function(programId,...rest){
 const p=prog16(programId),old=show;
 if(!p||typeof educationPlanOdds231!=='function')return windows273Base.educationPlanMenu231(programId,...rest);
 show=function(title,text,opts=[],...more){
  const f=ensureFamily17(),list=opts.map(o=>{
   const q=parents17().find(q=>o?.label===q.name+' · обсудить оплату');
   if(!q)return o;
   const again=f.requests?.['plan231:'+p.id+':'+q.id]||0;
   if(s.clock.ticks<again)return {...o,hint:(o.hint?o.hint+' · ':'')+'снова можно '+sinceMonth273(again)};
   try{const odds=educationPlanOdds231(p,q);return {...o,hint:(o.hint?o.hint+' · ':'')+(odds.blocked?'сейчас не сможет':'шанс '+pct273(odds.willing)+' · если откажет, снова через полгода')};}catch(e){return o;}
  });
  return old(title,text,list,...more);
 };
 try{return windows273Base.educationPlanMenu231(programId,...rest);}finally{show=old;}
};

// ---------- поездка: черновик, приглашение, карточка, «Дорога и уход» ----------

function partyText273(d){
 const names=[...((d.party53||[]).map(id=>living(id)?.name).filter(Boolean)),...(d.companion&&!(d.party53||[]).includes(d.companion)?[living(d.companion)?.name].filter(Boolean):[])];
 return names.length?'вы и '+names.join(', '):s.gender==='f'?'вы одна':'вы один';
}
// Где питомец на время поездки — как в плане ухода (journeys57): «у папы · Арьян Сандху», «с вами», «в зоогостинице».
function careWhere273(q){
 const h=q.helper&&living(q.helper);
 return q.mode==='bring'?'с вами':q.mode==='hotel'?'в зоогостинице':q.mode==='sitter'?'с ситтером':q.mode==='home'?'дома':
  q.mode==='relative'?(h?'у '+(typeof roleGenitive268==='function'?roleGenitive268(h):h.name)+' · '+h.name:'у близкого'):q.mode==='household'?'дома'+(h?' · '+h.name:''):'уход не выбран';
}
function careGroups273(d){
 const pets=livePets57(),plans=d?.journey57?.pets||[],groups=[];
 for(const p of pets){const q=plans.find(q=>q.pet===p.id);const w=q?careWhere273(q):'уход не выбран';const g=groups.find(g=>g.w===w);if(g)g.names.push(p.name);else groups.push({w,names:[p.name]});}
 return groups.map(g=>g.names.join(', ')+' — '+g.w).join('\n');
}
// «Собаки», если все питомцы — собаки (как в макете), иначе «Питомцы».
function petsLabel273(){const k=[...new Set(livePets57().map(p=>p.kind))];return k.length===1?{dog:'Собаки',cat:'Кошки'}[k[0]]||'Питомцы':'Питомцы';}
function num273of(t){return +String(t??'').split(' · ')[0].replace(/[^\d,.-]/g,'').replace(',','.');}
// «Все условия» поездки без того, что макет убрал: нули («· 0 A$» у питомцев у близких, «Дополнительно за ваш счёт 0»),
// «Дополнительно за ваш счёт» (это та же сумма за питомцев — она в «Кто где»), «Полная цена», равная вашей части,
// «Состояние» карточки (оно наверху).
function tripTable273(kind){
 return (r,g,detail)=>{
  const v=String(r.value??''),l=r.label;
  if(l==='Дополнительно за ваш счёт')return false;
  if(l==='Состояние'&&kind==='trip')return false;
  if(l==='Полная цена'){const mine=rows273(detail).find(q=>/^Ваша часть/.test(q.label));if(mine&&num273of(mine.value)===num273of(v))return false;}
  if(zero273(v)&&!['Длительность','На сколько'].includes(l))return false;
  if(/ · 0[\s ][^·\d]*$/.test(v))return {...r,value:v.replace(/ · 0[\s ][^·\d]*$/,'')};
  return true;
 };
}
// «Подробнее» поездки: кто где (с ценой ухода), дорога, кто платит; у «Дороги и ухода» — из чего цена.
function tripMore273(ctx,kind,d,q){
 const more=[],rows=rows273(ctx.detail),pets=livePets57(),plans=d?.journey57?.pets||[];
 const care=rows.filter(r=>r.section==='Дорога и уход'&&pets.some(p=>p.name===r.label));
 if(care.length){
  const groups=[];
  for(const r of care){
   const parts=String(r.value).split(' · '),fee=parts.length>1&&/\d/.test(parts.at(-1))?parts.pop():'',pet=pets.find(p=>p.name===r.label),plan=pet&&plans.find(q=>q.pet===pet.id);
   const where=plan?careWhere273(plan):lower273(parts.join(' · ')).replace(/^взять с собой$/,'с вами').replace(/^зоогостиница$/,'в зоогостинице').replace(/^оставить близкому/,'у близкого');
   let g=groups.find(g=>g.where===where);if(!g)groups.push(g={where,names:[],fees:[]});g.names.push(r.label);g.fees.push(fee);
  }
  more.push({title:'Кто где',text:groups.map(g=>g.names.join(', ')+' — '+g.where+' · '+(g.fees.every(f=>!f||zero273(f))?'бесплатно':g.fees.every(f=>f===g.fees[0])?(g.names.length>1?'по ':'')+g.fees[0]:g.fees.join(', '))).join('\n')});
 }
 const way=rows.find(r=>r.section==='Дорога и уход'&&r.label==='Способ')?.value,legs=rows.filter(r=>r.section==='Дорога и уход'&&r.label==='Пересадка').map(r=>r.value);
 if(way)more.push({title:'Дорога',text:cap273(lower273(way))+(legs.length?', пересадка '+legs.join(', '):'')+'.'});
 if(kind==='trip-road'&&q){
  const pay=q.player,petsFee=(q.care57||[]).reduce((n,x)=>n+(x.fee||0),0),car=q.car57?.total||0,trip=pay-petsFee-car;
  const parts=['Сама поездка '+money(trip)];if(petsFee>0)parts.push((petsLabel273()==='Собаки'?'собаки ':'питомцы ')+money(petsFee));if(car>0)parts.push('машина '+money(car));
  const who=(q.total>pay+.5?'Ваша часть — '+money(pay)+' из '+money(q.total)+'.':'Платите вы.')+' До отъезда поездку можно отменить без расходов.';
  // Без питомцев и машины цена — сама поездка: число уже наверху, второй раз не пишем.
  more.push(petsFee>0||car>0?{title:'Из чего цена',text:parts.join(', ')+'. '+who}:{title:'Оплата',text:who});
 }else{
  const payRows=rows.filter(r=>r.section==='Кто оплачивает'&&!zero273(r.value));
  const extra=rows.find(r=>r.label==='Дополнительно за ваш счёт'&&!zero273(r.value));
  // Платите только вы — сумма уже наверху, здесь без неё.
  const onlyYou=payRows.length===1&&payRows[0].label==='Вы';
  if(payRows.length)more.push({title:'Кто платит',text:onlyYou?'Платите вы'+(extra?', из них '+extra.value+' — уход и дорога':'')+'.':payRows.map(r=>r.label+' — '+r.value).join(', ')+(extra?'; уход и дорога — за ваш счёт, '+extra.value:'')+'.'});
 }
 return more;
}
// Документы поездки в подсказке: «ESTA, оформление 1 мес.», а не «esta, 1 мес.».
function docsHint273(h){const names={visa:'виза',eta:'ETA',esta:'ESTA',keta:'K-ETA',evisa:'электронная виза'};return String(h??'').replace(/: (visa|eta|esta|keta|evisa), (\d+) мес\./g,(m,k,n)=>': '+names[k]+', оформление '+n+' мес.');}
// «Перенести дату поездки» ничего не делает, если rescheduleJourney57 откажет (journeys57) — кнопка серая с причиной.
function rescheduleWhy273(t){
 try{
  if(typeof pendingJourney57==='function'&&!pendingJourney57(t))return '';
  if(s.country!==t.home||residenceCity()!==t.homeCity)return 'вы переехали — поездку нужно спланировать заново';
  const co=company18();
  if(t.leaveNeed&&(co?.id!==t.employer||(s.workHours??40)!==t.hours))return 'часы работы изменились — так отпуск не согласовать';
  const d=tripDraft57(t);if(journeyWhy57(d,quoteJourney57(d)).length)return 'сначала поправьте дорогу и уход';
 }catch(e){console.error(e);}
 return '';
}
// Строка «Цена»: деньги и зарплата за свой счёт; если денег нет — дни отпуска; если нет ничего — строки нет.
function priceRow273(price,leave){
 let v=price?price+leave.extra:leave.extra.replace(/^ \+ /,''),n=leave.note;
 if(!v&&n){v=n;n='';}
 return v?{label:'Цена',value:v,note:n}:null;
}
function tripBuild273(kind,ctx,d,t){
 const val=l=>rowValue273(ctx.detail,l);
 const card={rows:[],need:[],more:[],main:[tripConfirm2722],foot:[foot273],settings:[]};
 const mine=val('Ваша часть')||val('Ваша часть по приглашению'),full=val('Полная цена')||val('Всего');
 if(kind==='trip-road'){
  const q=quoteJourney57(d),old=t.journey57?.quote?.player;
  card.sub=days273(t.days)+' · '+(Number.isFinite(t.departure)?lower273(dateLabel86(t.departure))+' · ':'')+partyText273(t);
  const pets=careGroups273(d);
  if(pets)card.rows.push({label:petsLabel273(),value:pets});
  const diff=Number.isFinite(old)?q.player-old:0;
  card.rows.push({label:'Цена',value:money(q.player)+(Math.abs(diff)>=1?' вместо '+money(old):''),note:Math.abs(diff)>=1?'на '+money(Math.abs(diff))+(diff<0?' меньше':' больше')+' спишут при отъезде':''});
  card.main=['Подтвердить новый план и бюджет'];card.settings=['Выбрать дорогу','Питомцы и присмотр'];card.foot=['Карточка поездки',foot273];
  card.more=tripMore273(ctx,kind,d,q);
  card.moreHint=card.more.map(m=>lower273(m.title)).join(', ');
  return card;
 }
 if(kind==='trip'){
  card.sub=(Number.isFinite(t.departure)?dateLabel86(t.departure)+' · ':'')+partyText273(t);
  card.status={text:travelStatuses52[t.status]||'',tone:['cancelled','declined'].includes(t.status)?'bad':'wait'};
  card.rows.push({label:'Получите',value:days273(t.days)+' · '+t.city+' · '+travelName103(t.country)});
  let price=mine||val('Цена при отъезде')||val('Оплачено');
  if(zero273(price)){const who=rows273(ctx.detail).find(r=>r.section==='Кто оплачивает'&&!zero273(r.value)&&r.label!=='Вы');price=who?'платит '+who.label:'';}
  const row=priceRow273(price&&price+(full&&full!==mine&&!price.startsWith(full)&&!zero273(full)?' · всего '+full:''),tripLeave273(t,t.leaveUsed?'used':'trip'));
  if(row)card.rows.push(row);
  // Отмена — обычной (не главной) кнопкой под верхом, а не ссылкой в подвале; к низу экрана не прилипает.
  card.main=['Отменить без расходов'];card.mainSecondary=true;
  card.settings=['Дорога и уход за питомцами','Перенести дату поездки','Выбрать месяц и год'];card.foot=[foot273];
  card.more=tripMore273(ctx,kind,tripDraft57(t),null);
  card.moreHint=card.more.map(m=>lower273(m.title)).join(', ');
  return card;
 }
 // Черновик и приглашение.
 const when=val('Отъезд')||val('Начало'),inv=d.invite53?invite53(d.invite53):null,dd=inv?{...d,...['departure86','childcare86','unpaid86'].reduce((o,k)=>(inv.draft[k]!==undefined&&(o[k]=inv.draft[k]),o),{})}:d;
 card.sub=[when,partyText273(d)].filter(Boolean).join(' · ');
 card.rows.push({label:'Получите',value:d.stayHome86?'отпуск дома · '+days273(d.days):days273(d.days)+' · '+d.city+' · '+travelName103(d.country)});
 const row=priceRow273(tripPrice273(mine,full,inv),tripLeave273(dd,'draft'));
 if(row)card.rows.push(row);
 card.more=tripMore273(ctx,kind,d,null);
 card.moreHint=card.more.map(m=>lower273(m.title)).join(', ');
 if(kind==='trip-invite'){
  const q=invite53(d.invite53);
  if(q&&!invitationAvailable53(q)){
   // Прошедшее или закрытое приглашение: состояние наверху, кнопка «Открыть поездку», если поездка есть; настройки
   // серые в «Других действиях» с причиной.
   const st=inviteState273(q),price=card.rows.find(r=>r.label==='Цена');
   if(price){price.note='';if(q.status!=='accepted'){const h=living(q.host);price.value=price.value.replace(/^платит /,h?.gender==='f'?'платила ':'платил ');}}
   card.status={text:st,tone:q.status==='accepted'||q.status==='completed'?'ok':'bad'};
   card.main=['Открыть поездку'];card.settings=[];card.disabledWhy=st;
   return card;
  }
  card.main=[tripConfirm2722,'Отказаться без расходов'];card.settings=['Выбрать дорогу','Питомцы и присмотр',/^Дата · /];
 }
 else card.settings=[/^Дата · /,/^Оплачиваемый отпуск$/,/^Отпуск за свой сч/,/^Дорога · /,/^Питомцы и присмотр/,/^Длительность · /,/^Бюджет · /,/^Состав поездки · /,/^Кто платит/,/^Попутчик · /];
 return card;
}
// Отпуск и зарплата: оплачиваемый отпуск списывается при отъезде (travel52), за свой счёт отпуск не тратится, но в месяц
// отъезда зарплата меньше на долю рабочих дней поездки из 22 (clock.js) — эта сумма тоже цена поездки.
function tripLeave273(d,mode){
 if(!s.job||!d||typeof travelWorkDays52!=='function')return {note:'',extra:''};
 const work=travelWorkDays52(d.days);
 if(d.unpaid86){
  const lost=s.job.salary/12*Math.min(1,work/22);
  return {note:num273(work)+' раб. дн. без оплаты — отпуск не тратится',extra:lost>=1?' + '+money(lost)+' зарплаты':''};
 }
 const need=mode==='used'?d.leaveUsed:mode==='trip'?d.leaveNeed||0:work*(typeof travelFraction52==='function'?travelFraction52():1);
 if(!(need>0))return {note:'',extra:''};
 if(mode==='used')return {note:'отпуск '+num273(need)+' дн. — списан',extra:''};
 const bal=typeof travelLeave52==='function'?travelLeave52():null,left=bal&&Number.isFinite(bal.balance)?bal.balance-need:null;
 return {note:'отпуск '+num273(need)+' дн.'+(left==null?'':left>=0?' · останется '+num273(left):' · не хватает '+num273(-left)),extra:''};
}
// Цена черновика и приглашения: нули не пишем. Ваша часть — ноль: платит приглашающий (или не вы); всего ноль — строки нет.
function tripPrice273(mine,full,q){
 const total=full&&!zero273(full)?full:'';
 if(mine&&zero273(mine)){const h=q&&living(q.host);return total?(q?'платит '+(h?h.name:'приглашающий'):'вы не платите')+' · всего '+total:'';}
 const price=mine||total;
 return price+(price&&total&&mine&&total!==mine?' · всего '+total:'');
}
function inviteState273(q){
 return q.status==='accepted'?'Поездка запланирована':q.status==='completed'||q.status==='family270'?'Поездка завершена':q.status==='declined'?'Вы отказались от приглашения':'Приглашение закрыто';
}
function tripCard273(kind,d,t){
 return {kind,area:'Поездки',table:tripTable273(kind),opts:list=>tripOpts273(kind,t,list),build:ctx=>tripBuild273(kind,ctx,d,t)};
}
// Подсказка «Оформить документы» — названиями документов; «Перенести дату поездки» серая с причиной, когда перенос
// не сработает (подпись та же — её ловят по точной подписи).
function tripOpts273(kind,t,list){
 return list.map(o=>{
  if(!o||typeof o.label!=='string')return o;
  if(/^Оформить документы/.test(o.label)&&o.hint)return {...o,hint:docsHint273(o.hint)};
  if(kind==='trip'&&t&&o.label==='Перенести дату поездки'&&!o.disabled){const why=rescheduleWhy273(t);if(why)return {...o,disabled:true,why,hint:''};}
  return o;
 });
}
travelDraftMenu52=function(d,...rest){
 if(!d||nextCard273)return windows273Base.travelDraftMenu52(d,...rest);
 nextCard273=tripCard273(d.invite53?'trip-invite':'trip-draft',d,null);
 try{return windows273Base.travelDraftMenu52(d,...rest);}finally{nextCard273=null;}
};
travelInviteMenu53=function(id,...rest){
 const q=typeof invite53==='function'?invite53(id):null;
 // Семейная поездка ребёнка (notices270) — своё окно «Поехать с … / Остаться дома», оно остаётся как было.
 if(!q||nextCard273||typeof familyTripInvite270==='function'&&familyTripInvite270(q)&&invitationAvailable53(q))return windows273Base.travelInviteMenu53(id,...rest);
 nextCard273=tripCard273('trip-invite',{...q.draft,invite53:id},null);
 try{return windows273Base.travelInviteMenu53(id,...rest);}finally{nextCard273=null;}
};
travelTripMenu52=function(id,...rest){
 const t=travel52().trips.find(t=>t.id===id);
 if(!t||nextCard273)return windows273Base.travelTripMenu52(id,...rest);
 nextCard273=tripCard273('trip',null,t);
 try{return windows273Base.travelTripMenu52(id,...rest);}finally{nextCard273=null;}
};
journeyDraftMenu57=function(d,...rest){
 const t=d?.editTrip57&&travel52().trips.find(t=>t.id===d.editTrip57);
 if(!t||nextCard273)return windows273Base.journeyDraftMenu57(d,...rest);
 nextCard273=tripCard273('trip-road',d,t);
 try{return windows273Base.journeyDraftMenu57(d,...rest);}finally{nextCard273=null;}
};
// Причина готовности без кнопки (у trips272 для неё нет исправления): что будет и что можно сделать.
// Согласованный отпуск больше не действует (сменились работодатель, часы или право на работу): перенос даты этого
// не исправит (rescheduleJourney57 откажет), при отъезде поездка отменится сама, без расходов.
function tripReapprove273(text,ctx){
 if(!/нужно новое согласование|заново проверить оплачиваемый отпуск/.test(text)||ctx?.kind==='draft'||!ctx?.t)return null;
 // Причина — словами игры (её же ищут проверки 272), под ней — что именно изменилось и что будет.
 const t=ctx.t,co=company18(),hours=s.workHours??40;
 const what=/^Право на работу/.test(text)?'':co&&co.id===t.employer&&Number.isFinite(t.hours)&&t.hours!==hours?'отпуск согласовали на '+num273(t.hours)+' ч/нед., сейчас '+num273(hours)+' — ':'';
 return {text:ungame273(text),short:'отпуск нужно согласовать заново',when:what+'при отъезде поездка отменится сама, без расходов',reapprove:true};
}
const tripShort273={'Сначала завершите или отмените текущую поездку':'сначала текущая поездка'};
function tripWhen273(text,ctx){
 const planned=ctx?.kind!=='draft';
 if(/нужно новое согласование|заново проверить оплачиваемый отпуск/.test(text))return planned?'поездку можно отменить без расходов и запланировать заново':'отпуск согласуют, когда вы запланируете поездку';
 return planned?'без этого поездка не начнётся':'без этого поездку не запланировать';
}
// Блок готовности trips272/trips2722 становится полем need карточки: те же причины и те же кнопки-исправления.
tripInsertReady272=function(why,ctx,...rest){
 const c=card273,box=document.querySelector('#modal .need273');
 if(!c||!String(c.kind).startsWith('trip')||!box)return windows273Base.tripInsertReady272(why,ctx,...rest);
 try{
  const items=tripReadyItems272(why,ctx),home=ctx.kind==='draft'&&ctx.d?.stayHome86;
  if(items.length){
   // Документы — прямо тем вариантом окна, который их оформляет («Оформить документы · 31 A$»), а не общим меню виз;
   // в «Других действиях» он тогда не повторяется.
   const docs=(ctx273?.opts||[]).find(o=>o&&!o.disabled&&!o.hidden&&/^Оформить документы/.test(o.label||'')&&typeof o.fn==='function');
   c.hideOpts=[];
   c.need=items.map(i=>{
    const text=ungame273(i.text),short=tripShort273[i.text];
    if(docs&&/: нужны .+ на оформление$/.test(i.text)){if(!c.hideOpts.includes(docs.label))c.hideOpts.push(docs.label);return {text,short,fix:{label:docs.label,hint:docs.hint||'',fn:docs.fn}};}
    return tripReapprove273(i.text,ctx)||{text,short,fix:i.fix?{label:i.fix.label,fn:i.fix.fn}:null,when:i.fix?'':tripWhen273(i.text,ctx)};
   });
   c.needTitle=home?'Чтобы начать отпуск, не хватает':'Чтобы поехать, не хватает';
   box.innerHTML=needHTML273(c);box.hidden=false;
   for(const b of document.querySelectorAll('#modal .orig273 > button'))b.hidden=c.hideOpts.includes(optLabel273(b));
   // Отпуск согласовывали на прежние часы — статус «Отпуск согласован» больше не верен.
   if(c.kind==='trip'&&c.need.some(n=>n.reapprove))setStatus273({text:'Нужно новое согласование отпуска',tone:'bad'});
  }else{
   const held=ctx.t?.hold57&&ctx.kind!=='draft',st=c.status?.text;
   setStatus273({text:(st?st+' · ':'')+(home?'можно отдыхать':'можно ехать')+(held?' · отъезд в начале следующего месяца':''),tone:'ok'});
   const e=document.querySelector('#modal .status273');if(e&&!st)e.textContent=e.textContent.charAt(0).toUpperCase()+e.textContent.slice(1);
  }
  mainWhy273(c);yo273();
 }catch(e){console.error(e);return windows273Base.tripInsertReady272(why,ctx,...rest);}
};

// ---------- стили ----------

(function windowsStyle273(){
 if(typeof document==='undefined'||document.getElementById('windows273-style'))return;
 const st=document.createElement('style');
 st.id='windows273-style';
 st.textContent=[
  '#modal:has(> .top273){width:min(760px,calc(100vw - 24px));max-width:none}',
  '#modal .area273{margin-bottom:0}',
  '#modal .title273{font-family:"Prata",Georgia,serif;font-size:26px;line-height:1.22;margin:8px 0 4px;overflow-wrap:anywhere}',
  '#modal h2.h2sub273{font-family:inherit;font-size:13px;line-height:1.5;font-weight:400;color:var(--muted);margin:0}',
  '#modal .sr273{position:absolute!important;width:1px;height:1px;margin:0;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}',
  '#modal h2.sr273+.sub273,#modal .title273+.sub273{margin-top:0}',
  '#modal .sub273{font-size:13px;line-height:1.5;color:var(--muted);margin-top:2px}',
  '#modal .status273{display:table;margin-top:10px;font-size:12.5px;line-height:1.3;background:var(--soft);border-radius:99px;padding:5px 11px 5px 24px;position:relative}',
  '#modal .status273::before{content:"";position:absolute;left:10px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:var(--accent)}',
  '#modal .status273[data-tone="ok"]::before{background:#55704e}#modal .status273[data-tone="bad"]::before{background:var(--red,#a0503c)}',
  '#modal .status273[hidden],#modal .need273[hidden],#modal .set273[hidden],#modal .foot273[hidden],#modal .all273[hidden],#modal .others-h273[hidden]{display:none}',
  '#modal dl.top273{margin:14px 0 0;border-top:1px solid var(--line)}',
  '#modal .row273{display:grid;grid-template-columns:76px minmax(0,1fr);gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}',
  '#modal .row273 dt{font-size:12px;color:var(--muted);padding-top:2px}',
  '#modal .row273 dd{margin:0;font-size:14.5px;line-height:1.45;overflow-wrap:anywhere;white-space:pre-line}',
  '#modal .row273 dd small{display:block;font-size:12px;line-height:1.45;color:var(--muted);margin-top:3px;white-space:normal}',
  '#modal .chance273{align-items:center}#modal .chance273 dd{font-size:14px;color:var(--muted)}',
  '#modal .chance273 b{font-family:"Prata",Georgia,serif;font-weight:400;font-size:27px;line-height:1;color:var(--ink);vertical-align:-3px}',
  '#modal .chips273{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}#modal .chips273:empty{display:none}',
  '#modal .chips273 button{display:block;width:auto;margin:0;font-size:12.5px;line-height:1.35;border:1px solid var(--line);background:var(--paper);border-radius:7px;padding:6px 10px;min-height:40px;text-align:left;color:var(--ink)}',
  '#modal .chips273 button small{display:block;font-size:11px;color:var(--muted)}',
  '#modal .need273{margin-top:14px}',
  '#modal .need273 h4{font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.04em;color:#8a4b16;margin:0 0 2px}',
  '#modal .fix273{display:block;width:100%;box-sizing:border-box;margin:6px 0 0;text-align:left;font:inherit;color:var(--ink);background:#fbf2e8;border:1px solid #e2c39d;border-left:3px solid #b57e3d;border-radius:7px;padding:9px 30px 9px 11px;position:relative}',
  '#modal button.fix273::after{content:"→";position:absolute;right:11px;top:50%;transform:translateY(-50%);color:#8a4b16;font-size:16px}',
  '#modal .nofix273{background:transparent;border:0;border-radius:0;padding:6px 0 4px 16px}',
  '#modal .nofix273::before{content:"";position:absolute;left:3px;top:14px;width:6px;height:6px;border-radius:50%;background:#b57e3d}',
  '#modal .fix273 span{display:block;font-size:14px;line-height:1.4;font-weight:500}',
  '#modal .fix273 small{display:block;font-size:12px;line-height:1.45;color:var(--muted);margin-top:3px}',
  '#modal .needmore273 summary{cursor:pointer;font-size:12.5px;color:var(--muted);padding:11px 0 0;min-height:40px;box-sizing:border-box}',
  '#modal .main273{display:grid;gap:8px;margin-top:16px}#modal .main273:empty{display:none}',
  '#modal .main273 button{text-align:center;font-weight:500;background:var(--ink);color:var(--paper);border:1px solid var(--ink);border-radius:7px;padding:12px 14px;line-height:1.4}',
  '#modal .main273 button+button,#modal .main273.second273 button{background:transparent;color:var(--ink);border-color:var(--line)}',
  '#modal .main273.pair273{grid-template-columns:minmax(0,1fr) auto}#modal .main273.pair273 button+button{padding-left:18px;padding-right:18px}',
  '#modal .main273 button small{color:inherit;opacity:.85;font-size:12px;font-weight:400}',
  // Подсказка главной кнопки и кнопок «Платить» — в той же строке («Подать заявку · заявка 112 A$»), причина серой — ниже.
  '#modal .main273 button small:not(.why273),#modal .chips273 button small{display:inline}',
  '#modal .main273 button small:not(.why273)::before,#modal .chips273 button small::before{content:" · "}',
  '#modal .main273 button[disabled]{background:#d9ccc6;border-color:#cbbcb5;color:#6d5d58;opacity:1}',
  '#modal .options button small.why273{display:block;color:#8a4b16;opacity:1}',
  '#modal .main273 button[disabled] small.why273{color:#6d4a2e}',
  '#modal .mnote273{font-size:12px;line-height:1.45;color:var(--muted);text-align:center;margin:7px 0 0}',
  '#modal .set273{margin-top:16px}',
  '#modal .set273 h4,#modal .more-body273 h4{font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--muted);margin:0 0 4px}',
  '#modal .setopts273{display:flex;flex-wrap:wrap;gap:6px;margin:0}',
  '#modal .setopts273 button{width:auto;margin:0;font-size:12.5px;line-height:1.35;padding:6px 10px;min-height:40px;border:1px solid var(--line);background:var(--paper);border-radius:7px;text-align:left}',
  '#modal .setopts273 button small{display:block;font-size:11px}',
  '#modal details.more273{margin-top:16px;border-top:1px solid var(--line)}',
  '#modal details.more273>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;padding:12px 2px;font-size:14px;font-weight:500}',
  '#modal details.more273>summary::-webkit-details-marker{display:none}',
  '#modal details.more273>summary small{font-weight:400;color:var(--muted);font-size:12px;margin-right:auto}',
  '#modal details.more273>summary::after{content:"▸";margin-left:auto;color:var(--muted);transition:transform .15s}',
  '#modal details.more273[open]>summary::after{transform:rotate(90deg)}',
  '#modal .more-body273{padding:0 0 6px}',
  '#modal .info273{margin:10px 0 0}#modal .info273 p{font-size:13px;line-height:1.55;color:var(--muted);margin:0}',
  '#modal .others-h273{margin-top:14px!important}',
  '#modal .more-body273 .orig273{display:grid;gap:6px;margin-top:6px;grid-template-columns:minmax(0,1fr)}',
  '#modal .more-body273 .orig273>button,#modal .others273>button{display:block;width:100%;min-height:40px;margin:0;font-size:13px;line-height:1.45;text-align:left;border:1px solid var(--line);border-radius:7px;background:transparent;padding:8px 11px;color:var(--ink)}',
  '#modal .more-body273 .orig273>button[hidden]{display:none}',
  '#modal .others273{display:grid;gap:6px;margin-top:6px}#modal .others273:empty{display:none}',
  '#modal details.all273{margin-top:14px}',
  '#modal details.all273>summary{cursor:pointer;font-size:13px;color:var(--muted);padding:10px 0;min-height:40px;box-sizing:border-box}',
  '#modal .all-body273 .detail20{margin:6px 0 10px}',
  '#modal .foot273{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:6px;padding-top:10px;border-top:1px solid var(--line)}',
  '#modal .foot273 button{width:auto;min-height:40px;margin:0;font-size:13px;border:0;background:none;padding:4px 0;color:var(--muted);text-decoration:underline;text-decoration-color:var(--line);text-underline-offset:3px}',
  '#modal .info273 p{white-space:pre-line}',
  '@media(max-width:600px){#modal:has(> .top273){padding-left:18px;padding-right:18px}',
  ' #modal:has(> .top273) .modal-closebar38{margin-left:-18px;margin-right:-18px}',
  ' #modal .title273{font-size:24px}',
  ' #modal .main273.stick273{position:sticky;bottom:-32px;z-index:6;background:var(--surface);padding:10px 0 12px;margin-bottom:-12px}',
  // Телефон: всё, что нажимают пальцем, не ниже 44 px.
  ' #modal .setopts273 button,#modal .chips273 button,#modal .foot273 button,#modal .more-body273 .orig273>button,#modal .others273>button{min-height:44px}',
  ' #modal details.all273>summary,#modal .needmore273 summary{min-height:44px;padding-top:12px}',
  ' #modal details.more273>summary{min-height:44px}}',
  '@media(min-width:700px){#modal dl.top273{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;border:0}',
  ' #modal .row273{display:block;border:1px solid var(--line);border-radius:9px;padding:10px 12px;background:var(--paper)}',
  ' #modal .row273 dt{padding:0 0 4px}#modal .pay273{grid-column:1/-1}',
  ' #modal .main273{display:flex;flex-wrap:wrap}#modal .main273 button{flex:1 1 200px}#modal .main273.pair273 button+button{flex:0 0 auto}',
  ' #modal .infos273{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 24px}',
  ' #modal .more-body273 .orig273,#modal .others273{grid-template-columns:repeat(2,minmax(0,1fr))}}'
 ].join('\n');
 document.head.appendChild(st);
})();
