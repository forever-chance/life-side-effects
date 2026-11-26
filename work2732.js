'use strict';
// Сборка 273, шаг 2: работа. Окна и панели переходят на шаблон карточки windows273.js.
// 1. «Моя работа» (панель траектории) — одна карточка текущей работы: предложение руководителя наверху с «Принять» и
//    «Отклонить», деньги в месяц, «Повышение зарплаты» с шансом и суммой прямо на кнопке, часы. Остальные действия
//    работодателя (отделы, история, условия, перевод, обучение, договор, «Уволиться») — в «Подробнее» той же карточки.
//    Фоновый поиск: что он ищет, видно рядом с переключателем, фильтры меняются там же.
// 2. Окна работодателя — «Действия по текущей работе» (меню из шести тем) и «Зарплата, повышение и внутренние
//    вакансии» — одна карточка: в меню тем добавлены варианты окна зарплаты, наверху деньги, шанс прибавки и
//    предложение руководителя (любое, и о новых условиях тоже), главные кнопки на первом экране. Если прибавку
//    просить рано, каждая причина — с датой или кнопкой, которая помогает («Дополнительный проект», выбор проекта).
// 3. «Уволиться» — через окно «Что изменится»: доход, разрешение на работу, по которому игрок работает, что дальше.
//    Отклонить предложение руководителя (и из «Обязанности и условия») и отказаться от оффера из «Заявок» — тоже с
//    подтверждением.
// 4. «Вакансии»: видны три фильтра, остальные и поиск по названию свёрнуты в «Ещё фильтры»; одна карточка на вакансию
//    с выбором часов (ставки 40/30/20/10 ч — кнопками на карточке, с договором, если он у ставки другой), на карточке
//    шанс оффера или «Не хватает: …» (и повторный отклик раньше срока).
// 5. Внутренние вакансии — зарплата в месяц и разница с нынешней на каждой.
// 6. История работы («История изменений», «Карьерная история») и «Перспективы в компании» — датами и словами.
// Подписи вариантов и заголовки окон не меняются (их ловят обёртки и тесты по точной подписи), новые кнопки только
// добавляются. Числа — из функций игры: шанс прибавки — careerChance18 (тот, что бросает negotiate18), сумма — по
// правилу careerOffer18, шанс оффера — jobEligibility16 × собеседование (как в windows273), даты — dateLabel86.
// В сохранении ничего нового: «Подробнее» запоминается по виду в localStorage, как в windows273; «Ещё фильтры»
// списка вакансий раскрыты, только пока игрок в списке.
// Подтверждения — обычные окна show(): очередь событий s.pending и resolvePending они не трогают.
// Без windows273.js (проверка BASE) файл ничего не меняет.

const work2732Ready=typeof layout273==='function'&&typeof jobDeclineAsk273==='function'&&typeof company18==='function';
const work2732Base={careerMenu18,workOverview58,vacanciesView58,requestCard58,openDecision24,hoursMenu,openPath16,
 salary:typeof base21!=='undefined'?base21.careerMenu18:null,
 conditionsMenu21:typeof conditionsMenu21==='function'?conditionsMenu21:null,
 careerHistory21:typeof careerHistory21==='function'?careerHistory21:null};
// Правила прибавки — как в career18.js: negotiate18 ставит разговор на 2 мес. по 1 ч/нед. и повтор через 6 мес.,
// careerOffer18 при согласии даёт +12%, а в 3 случаях из 10 (resultRoll < 0,3) — только +5%.
const raise2732={full:1.12,part:1.05,partShare:.3,months:2,hours:1,again:6};
// Обучение за счёт работодателя — как в acceptCareer18: 3 мес. по 3 ч/нед. Дополнительный проект (duties.overtime в
// clock.js) по завершении даёт +5 к результатам (finishTask в career18.js).
const training2732={months:3,hours:3},project2732={gain:5};
let panelFns2732=[],vacFiltersOpen2732=false;

// ---------- мелочи ----------

function money2732(n){return money(Math.abs(n));}
// Строка careerChance18().factors: результаты копятся по 0,15 в месяц и приходят дробью («81.05000000000004/100»).
function factors2732(f){return String(f||'').replace(/\d+\.\d+/g,n=>num273(n));}
function months2732(n){return n>0?n+' мес. в компании':'первый месяц в компании';}
function diff2732(now,was){const d=now-was;return Math.abs(d)<1?'столько же, сколько сейчас':'на '+money2732(d)+(d<0?' меньше':' больше')+' нынешней';}
function cap2732(t){t=String(t||'');return t.charAt(0).toUpperCase()+t.slice(1);}
function attr2732(t){return esc(String(t??''));}
// Окно, которое вызывающий код откроет через show(), — забрать варианты, ничего не рисуя. Подсказка «?» (onboarding180)
// дописывается в уже открытое окно после show(): на время сбора она отключена, чтобы не трогать чужое окно.
function capture2732(fn){
 const old=show,det=typeof nextDetail20!=='undefined'?nextDetail20:null,card=nextCard273,ta=typeof tutorialActive180==='function'?tutorialActive180:null;
 let got=null;
 show=function(title,text,opts){if(!got)got={title:String(title??''),text:String(text??''),opts:Array.isArray(opts)?opts.filter(Boolean):[]};};
 if(ta)tutorialActive180=()=>true;
 try{fn();}catch(e){console.error(e);}
 finally{show=old;if(ta)tutorialActive180=ta;if(typeof nextDetail20!=='undefined')nextDetail20=det;nextCard273=card;}
 return got;
}
// Временная подмена show() на одно окно: поправить варианты и текст до рендерера (как в windows273).
function withShow2732(fn,patch,card=null){
 const old=show;let done=false;
 if(card)nextCard273=card;
 show=function(title,text,opts=[],...more){
  if(done)return old(title,text,opts,...more);
  done=true;
  let t=text,list=opts;
  try{const r=patch(String(title??''),String(text??''),Array.isArray(opts)?opts:[]);if(r){t=r.text??t;list=r.opts??list;}}catch(e){console.error(e);}
  return old(title,t,list,...more);
 };
 try{return fn();}finally{show=old;if(card)nextCard273=null;}
}

// ---------- текущая работа: деньги, договор, предложения, разговоры ----------

function contract2732(j){
 const q=j?.contract45;
 if(!q)return '';
 if(q.type==='permanent')return 'бессрочный договор';
 return Number.isFinite(q.until)?'срочный договор до '+month273(q.until,monthOf273):'срочный договор';
}
function offers2732(){
 const c=company18();
 return (c?.offers||[]).filter(o=>decisionActive24({kind:'career',id:o.id}));
}
function offerName2732(o){return o.kind==='conditions21'?'новые условия работы':lower273(careerKinds18[o.kind]||'новые условия');}
function talk2732(){
 const c=company18(),q=(c?.requests||[]).find(q=>q.status==='pending');
 if(!q)return null;
 const t=liveTask273('careerNegotiation18',t=>t.requestId===q.id);
 return {q,text:'Разговор: '+lower273(careerKinds18[q.kind]||'условия работы')+(t?' · '+answerIn273(taskLeft273(t)):'')};
}
// Прибавка: шанс — careerChance18 со всеми обёртками (его же берёт negotiate18), сумма — по careerOffer18.
function raiseInfo2732(){
 const j=s.job,e=careerChance18('salary'),full=Math.round(j.salary*raise2732.full)-j.salary,part=Math.round(j.salary*raise2732.part)-j.salary;
 return {e,full,part,answer:taskMonths273(raise2732.months,raise2732.hours),again:s.clock.ticks+raise2732.again};
}
// Причины, по которым нельзя просить, — словами: {text, when} с датой или {text, fix} с кнопкой, которая это исправляет
// (те же варианты окна работодателя, opts). Сырые строки careerChance18 и его обёрток (agreements21, content32,
// development22) на экран не выходят.
function raiseWhy2732(w,opts=[]){
 const c=company18(),t=s.clock.ticks,opt=l=>(opts||[]).find(o=>o?.label===l&&!o.disabled&&typeof o.fn==='function');let m;
 if((m=/^Повторный разговор через (\d+) мес\./.exec(w)))return {text:'Повторный разговор',when:sinceMonth273(t+ +m[1])};
 if((m=/^До согласованного пересмотра (\d+) мес\./.exec(w)))return {text:'Согласованный пересмотр',when:sinceMonth273(t+ +m[1])};
 if(/^Нужно хотя бы 6 месяцев в компании/.test(w))return {text:'Нужно 6 мес. в компании',when:sinceMonth273(t+Math.max(1,6-(c?.months||0)))};
 if(/^Другой разговор ещё не завершен/.test(w)){const k=talk2732();return {text:'Сначала закончится другой разговор',when:k&&/ответ/.test(k.text)?k.text.replace(/^.*? · /,''):'после ответа'};}
 if(/^Сначала ответьте на текущее предложение/.test(w))return {text:'Сначала ответьте на предложение руководителя',when:'оно наверху'};
 // После «Вернёмся к разговору после результатов» (finishNegotiation18): нужны результаты не ниже порога.
 if((m=/^Сначала результаты (\d+)\/100/.exec(w))){
  const text='Нужны результаты '+m[1]+'/100, сейчас '+num273(c?.performance||0);
  const run=liveTask273('overtime',k=>!k.employer22||k.employer22===c?.id);
  if(run)return {text,when:'проект идёт, '+answerIn273(taskLeft273(run),'закончится','стоит — в неделе нет свободных часов')+' · +'+project2732.gain+' к результатам'};
  const o=opt('Дополнительный проект'),d=typeof duties!=='undefined'?duties.overtime:null;
  if(o)return {text,fix:{label:'Дополнительный проект',hint:'+'+project2732.gain+' к результатам'+(d?' · '+d.duration+' мес. по '+d.hours+' ч/нед.':''),fn:o.fn}};
  return {text,when:'результаты растут с проектами и подготовкой'};
 }
 if(/^Сначала выберите проект/.test(w)){
  const q=(c?.requests||[]).find(q=>q.projectChoice32&&!q.reviewed21);
  return {text:'Нужно выбрать проект для пересмотра',fix:q&&typeof projectMenu32==='function'?{label:'Выбрать проект',hint:'его итог учтут при пересмотре',fn:()=>projectMenu32(q.id)}:null,when:'в «Проекты и условия повышения»'};
 }
 if((m=/^Нужно завершить проект «(.+)»/.exec(w))){
  const q=[...(c?.requests||[])].reverse().find(q=>q.project22&&q.project22.status!=='completed'),k=q&&(s.clock.tasks||[]).find(k=>k.id===q.project22.id&&!['completed','cancelled'].includes(k.state));
  return {text:'Завершить проект «'+m[1]+'»',when:k?answerIn273(taskLeft273(k),'закончится','стоит — в неделе нет свободных часов'):'проект в расписании'};
 }
 if(/^Нет действующего права на работу/.test(w))return {text:'Нет права на работу в этой стране',fix:{label:'Документы и переезд',hint:'разрешения и сроки',fn:()=>openPath16('mobility')}};
 return {text:w,when:''};
}
// На кнопке: в окне — срок, часы и когда можно снова (шанс и сумма стоят наверху окна); на панели — шанс, сумма и
// когда ответ, остальное в «Подробнее». Серая кнопка — первая причина с датой или с тем, что поможет.
function raiseHint2732(r,panel,opts=[]){
 if(r.e.why.length){const w=raiseWhy2732(r.e.why[0],opts);return w.text+(w.when?' — '+w.when:w.fix?' — поможет «'+w.fix.label+'»':'');}
 if(panel)return 'шанс '+pct273(r.e.probability)+' · +'+money(r.full/12)+'/мес. · '+answerIn273(r.answer);
 return [raise2732.months+' мес. · '+raise2732.hours+' ч/нед.',answerIn273(r.answer),'если откажут — снова '+sinceMonth273(r.again)].join(' · ');
}
// Разрешение, по которому игрок работает сейчас: rights31 (его же проверяет permission16) берёт любое действующее
// рабочее разрешение страны, не только выданное под нынешнюю работу. Продлевает его documents45 при любой работе.
// Учебное или семейное основание от увольнения не зависит — его не показываем.
function workPermit2732(){
 if(typeof citizenRight31==='function'&&citizenRight31(s.country))return null;
 const r=typeof rights31==='function'?rights31(s.country):null;
 if(r?.citizen)return null;
 if(r?.permit&&r.permit.basis==='work')return r.permit;
 const ok=p=>typeof validPermit31==='function'?validPermit31(p,s.country):p.country===s.country&&(p.expires===null||p.expires>s.clock.ticks);
 return path16().permits.find(p=>p.country===s.country&&p.basis==='work'&&ok(p))||null;
}

// ---------- окно работодателя: меню тем и «Зарплата, повышение…» одной карточкой ----------

// Варианты меню тем и окна зарплаты — одним списком, без повторов. Подписи прежние; меняются подсказки и то,
// что открывают «Уволиться», «Предложение: …» и «Внутренние вакансии и перевод».
function employerOpts2732(hub,pay,back){
 const seen=new Set(),out=[],r=raiseInfo2732();
 for(const o of [...hub,...pay]){
  const l=o?.label;
  if(typeof l!=='string'||seen.has(l))continue;
  seen.add(l);
  out.push(patchOpt2732(o,r,back));
 }
 // Предложение руководителя о новых условиях (conditions21) в этих окнах своей кнопки не имело — только через
 // «Обязанности и условия». Подпись — та же, что там; открывает то же окно, что «Ожидают ответа».
 const cond=offers2732().find(q=>q.kind==='conditions21');
 if(cond&&!seen.has(offerCondLabel2732))out.push({label:offerCondLabel2732,hint:'принять или отклонить',fn:()=>openDecision24('career',cond.id)});
 return out;
}
const offerCondLabel2732='Предложение руководителя';
function patchOpt2732(o,r,back){
 const l=o.label,c=company18(),j=s.job;
 if(l==='Уволиться')return {...o,hint:'сначала покажем, что изменится',fn:()=>quitAsk2732(o.fn,back)};
 // Серая «Повышение зарплаты»: причина с датой — под подписью (mainWhy карточки), без сырой строки careerChance18.
 if(l==='Повышение зарплаты')return {...o,hint:o.disabled?'':raiseHint2732(r,false)};
 if(l==='Повышение в должности'&&!o.disabled){const n=promotion178(j,c),e=careerChance18('promotion');
  return {...o,hint:(n?jobTitle270(n.title)+' · '+money(n.salary/12)+'/мес. · ':'')+'шанс '+pct273(e.probability)+' · '+raise2732.months+' мес. · '+raise2732.hours+' ч/нед.'};}
 if(l==='Обучение за счёт работодателя'&&!o.disabled)return {...o,hint:'шанс '+pct273(careerChance18('training').probability)+' · потом '+training2732.months+' мес. по '+training2732.hours+' ч/нед., платит компания'};
 if(l==='Изменить рабочие часы')return {...o,hint:'сейчас '+(s.workHours??40)+' ч/нед.'};
 if(l==='Внутренние вакансии и перевод')return {...o,fn:()=>withShow2732(o.fn,internalPatch2732)};
 if(l==='История изменений')return {...o,fn:()=>withShow2732(o.fn,historyPatch2732)};
 if(l==='Обсудить карьерные перспективы')return {...o,fn:()=>withShow2732(o.fn,prospectsPatch2732)};
 // Срок ответа уже стоит в строке состояния наверху — на кнопке не повторяется.
 if(/^Предложение: /.test(l)){const list=offers2732().filter(q=>q.kind!=='conditions21'&&'Предложение: '+careerKinds18[q.kind]===l),q=list[0];
  if(q)return {...o,hint:'принять или отклонить',fn:()=>offerWin2732(q,o.fn)};}
 return o;
}
function employerCard2732(hubOnly){
 return {kind:'employer',area:'Работа',title:jobTitle270(s.job.title),h2:'sub',build:ctx=>employerBuild2732(ctx,hubOnly)};
}
function employerBuild2732(ctx,hubOnly){
 const j=s.job,c=company18(),r=raiseInfo2732(),offer=offers2732()[0],talk=talk2732();
 const card={rows:[],need:[],more:[],main:[],foot:[foot273]};
 let minutes=0;try{minutes=j.format==='remote'?0:Math.round(commuteMinutes()||0);}catch(e){}
 card.sub=[(s.workHours??40)+' ч/нед.',typeof jobFormatNow270==='function'?jobFormatNow270(j):'',minutes>0?minutes+' мин дороги':'',months2732(c.months)].filter(Boolean).join(' · ');
 if(offer)card.status={text:'Предложение руководителя: '+offerName2732(offer)+' · ответить '+untilMonth273(offer.expires),tone:'wait'};
 else if(talk)card.status={text:talk.text,tone:'wait'};
 // Рядом с предложением нынешняя зарплата подписана «Сейчас»: «Получите» читалось бы как то, что дадут.
 const offerPay=offer&&offer.kind!=='conditions21'&&Number.isFinite(offer.salary);
 card.rows.push({label:offerPay?'Сейчас':'Получите',value:money(j.salary/12)+'/мес. на руки',note:contract2732(j)});
 if(offerPay)card.rows.push({label:'Предлагают',value:money(offer.salary/12)+'/мес.',note:[diff2732(offer.salary/12,j.salary/12),jobTitle270(offer.title)!==jobTitle270(j.title)?jobTitle270(offer.title):''].filter(Boolean).join(' · ')});
 else if(offer?.kind==='conditions21'){let t='';try{t=workEffect21(offer);}catch(e){}if(t)card.rows.push({label:'Предлагают',value:t});}
 if(!r.e.why.length)card.chance={label:'Шанс прибавки',p:r.e.probability,note:'+12% — это +'+money(r.full/12)+'/мес.; в 3 случаях из 10 соглашаются только на +5%'};
 else if(!offer&&!talk){card.needTitle='Прибавку пока не попросить';card.need=r.e.why.map(w=>raiseWhy2732(w,ctx.opts));}
 const offerLabels=offers2732().map(q=>q.kind==='conditions21'?offerCondLabel2732:'Предложение: '+careerKinds18[q.kind]);
 card.main=[...offerLabels.slice(0,1),'Повышение зарплаты','Изменить рабочие часы'];
 if(r.e.why.length)card.mainWhy=raiseHint2732(r,false,ctx.opts);
 if(!r.e.why.length)card.more.push({title:'Почему '+pct273(r.e.probability),text:factors2732(r.e.factors)+'.'});
 card.more.push({title:'В год',text:money(j.salary)+' на руки.'});
 // Отделы — только в меню тем: в окне «Зарплата, повышение…» их нет.
 card.moreHint=(r.e.why.length?'':'почему '+pct273(r.e.probability)+', ')+(hubOnly?'отделы, ':'')+'история, уволиться';
 return card;
}
// Сами окна: меню тем (careerMenu18 из development22) и окно зарплаты (base21.careerMenu18 из readability20).
function employerWin2732(base,hubOnly){
 const c=s?.job&&company18();
 if(!c||nextCard273)return base();
 const pay=hubOnly?capture2732(()=>work2732Base.salary())?.opts||[]:[];
 return withShow2732(base,(title,text,opts)=>({opts:hubOnly?employerOpts2732(opts,pay,()=>workControls16()):employerOpts2732([],opts,()=>base21.careerMenu18())}),employerCard2732(hubOnly));
}

// ---------- история и перспективы: даты и слова вместо «Месяц 454» и «business-trip54» ----------

const historyKinds2732={initial:'Начало работы',salary:'Прибавка',promotion:'Повышение в должности',transfer:'Перевод в другую команду',
 training:'Обучение за счёт работодателя',redundancy:'Сокращение',conditions21:'Новые условия работы','conditions-refused':'Условия не изменили',
 format246:'Новый формат работы','education-funding':'Образование за счёт компании','project-review':'Проект не закрыт в срок',
 project:'Проект завершён','business-trip54':'Командировка',collaboration48:'Совместный проект'};
const talkOutcomes2732={offer:'согласились',conditions:'вернутся после результатов',refused:'отказ'};
function historyWhat2732(h){
 if(h.type==='negotiation')return 'Разговор: '+lower273(careerKinds18[h.kind]||'условия работы')+(talkOutcomes2732[h.outcome]?' — '+talkOutcomes2732[h.outcome]:'');
 return historyKinds2732[h.type]||careerKinds18[h.kind||h.type]||'Изменение в работе';
}
// Пояснение к событию: проект — его название, формат — словами (catalog246 пишет «Формат работы: near»).
function historyNote2732(h){
 let n=String(h.note||'');
 if(h.type==='format246')n=n.replace(/^Формат работы: ([a-z]+)$/,(m,k)=>lower273(formats16[k]||k));
 if(h.type==='project'||h.type==='project-review')n=n.replace(/^[^:]*: /,'');
 if(!n&&h.type==='collaboration48')n=h.title||'';
 return n;
}
function historyLine2732(h){
 const parts=[dateLabel86(h.tick),historyWhat2732(h),historyNote2732(h)];
 if(h.type!=='collaboration48'&&h.title&&Number.isFinite(h.salary))parts.push(jobTitle270(h.title)+' · '+money(h.salary/12)+'/мес.');
 if(h.type==='business-trip54'&&Number.isFinite(h.cost))parts.push('расходы '+money(h.cost));
 return parts.filter(Boolean).join(' · ');
}
// «История изменений» (career18): строка на событие.
function historyPatch2732(title){
 const c=company18();
 if(title!=='Карьера в компании'||!c)return null;
 return {text:c.history.slice(-20).map(historyLine2732).join('\n')||'Изменений пока не было.'};
}
// «Перспективы в компании» (career18): «повторное обсуждение после месяца 467» — датой.
function prospectsPatch2732(title,text){
 if(title!=='Перспективы в компании')return null;
 return {text:text.replace(/повторное обсуждение после месяца (\d+)/g,(m,t)=>'повторное обсуждение '+sinceMonth273(+t)).replace(/Результаты (\d+\.\d+)\/100/g,(m,n)=>'Результаты '+num273(n)+'/100')};
}
// «Карьерная история» (agreements21) — таблица nextDetail20: «Игровой месяц 454», разделы «Месяц N» — датами и словами.
function careerHistory2732(...a){
 const c=company18();
 if(!c||!work2732Base.careerHistory21)return work2732Base.careerHistory21?.apply(this,a);
 const old=show;
 show=function(title,...rest){
  show=old;
  if(title==='Карьерная история'&&typeof section20==='function'&&typeof fact20==='function')nextDetail20={sections:[
   section20('У работодателя',[fact20('Начало',Number.isFinite(c.startedAt21)?dateLabel86(c.startedAt21):'—'),fact20('Стаж',c.months+' мес.'),fact20('Обязанности',c.duties21?.label||'По текущей должности')]),
   ...c.history.slice(-20).reverse().map(h=>section20(dateLabel86(h.tick),[fact20('Что было',[historyWhat2732(h),historyNote2732(h)].filter(Boolean).join(' · ')),
    ...(h.type!=='collaboration48'&&h.title&&Number.isFinite(h.salary)?[fact20('Должность',jobTitle270(h.title)),fact20('Оплата',money(h.salary/12)+'/мес. на руки')]:[]),
    ...(h.department?[fact20('Отдел',h.department)]:[]),...(h.type==='business-trip54'&&Number.isFinite(h.cost)?[fact20('Расходы',money(h.cost))]:[])]))]};
  return old.call(this,title,...rest);
 };
 try{return work2732Base.careerHistory21.apply(this,a);}finally{show=old;}
}

// ---------- предложение руководителя ----------

function offerWin2732(o,open){
 const again=()=>offerWin2732(o,open);
 return withShow2732(open,(title,text,opts)=>({opts:opts.map(q=>q?.label==='Отклонить'?{...q,hint:'с подтверждением',fn:()=>offerDeclineAsk2732(o,q.fn,again)}:q)}),
  {kind:'career-offer',area:'Работа',title:cap2732(offerName2732(o)),h2:'sub',build:ctx=>offerBuild2732(o,ctx)});
}
function offerBuild2732(o,ctx){
 const j=s.job,card={rows:[],need:[],more:[],main:['Принять','Отклонить'],foot:[foot273]};
 card.sub=company18()?.name||'';
 card.status={text:'Ответить '+untilMonth273(o.expires),tone:'wait'};
 if(o.kind==='conditions21'){let t='';try{t=workEffect21(o);}catch(e){}if(t)card.rows.push({label:'Изменится',value:t});}
 else if(j){
  card.rows.push({label:'Получите',value:money(o.salary/12)+'/мес. на руки',note:diff2732(o.salary/12,j.salary/12)});
  if(jobTitle270(o.title)!==jobTitle270(j.title)||o.department&&o.department!==(j.department||'Основная команда'))card.rows.push({label:'Должность',value:[jobTitle270(o.title),o.department].filter(Boolean).join(' · ')});
  if(o.kind==='training')card.rows.push({label:'Обучение',value:trainingLine2732()});
  card.more.push({title:'В год',text:money(o.salary)+' на руки вместо '+money(j.salary)+'.'});
 }
 return card;
}
function trainingLine2732(){return training2732.months+' мес. · '+training2732.hours+' ч/нед. · платит компания';}
// Окно «Обязанности и условия» (agreements21): у «Предложение руководителя» — окно «Новые условия» с «Отклонить»,
// который отклонял сразу. Предложения в нём — в том же порядке, что фильтр conditionsMenu21.
function conditionsPatch2732(title,text,opts){
 if(title!=='Обязанности и условия')return null;
 const list=(company18()?.offers||[]).filter(o=>o.kind==='conditions21'&&o.status==='offered'&&o.expires>=s.clock.ticks);
 let i=0;
 return {opts:opts.map(q=>{
  if(q?.label!==offerCondLabel2732||typeof q.fn!=='function')return q;
  const o=list[i++];if(!o)return q;
  const open=q.fn,win=()=>withShow2732(open,(t,x,list2)=>t!=='Новые условия'?null:{opts:list2.map(b=>b?.label==='Отклонить'&&typeof b.fn==='function'?{...b,hint:'с подтверждением',fn:()=>offerDeclineAsk2732(o,b.fn,win)}:b)});
  return {...q,fn:win};
 })};
}
function offerDeclineAsk2732(o,decline,back){
 const j=s.job;
 show('Отклонить?','Предложение «'+offerName2732(o)+'» закроется, вернуть его будет нельзя.'+(j?' Останутся прежние условия: '+jobTitle270(j.title)+', '+money(j.salary/12)+'/мес. на руки.':''),[
  {label:'Да, отклонить',fn:()=>decline()},
  {label:'Вернуться к предложению',fn:()=>back&&back()}
 ]);
}

// ---------- «Уволиться»: что изменится ----------

function quitAsk2732(quit,back){
 const j=s.job,c=company18();
 if(!j)return;
 const p=workPermit2732(),x=path16();
 nextCard273={kind:'quit',area:'Работа',title:'Уволиться?',h2:'sub',build:()=>{
  const card={rows:[],need:[],more:[],main:['Да, уволиться','Остаться на работе'],foot:[]};
  card.sub=[jobTitle270(j.title),c?.name].filter(Boolean).join(' · ');
  card.rows.push({label:'Доход',value:money(j.salary/12)+'/мес. на руки — больше не будет',note:'со следующего месяца, пока не найдёте новую работу'});
  if(p)card.rows.push(p.expires===null?{label:'Документы',value:'бессрочное разрешение на работу остаётся'}:{label:'Документы',value:'разрешение на работу действует до '+month273(p.expires,monthOf273),note:'продлить его без работы нельзя'});
  card.rows.push({label:'Время',value:'+'+(s.workHours??40)+' ч/нед. свободного времени',note:x.search?'фоновый поиск включён':'фоновый поиск выключен — включается на «Моей работе»'});
  card.rows.push({label:'Сохранится',value:'опыт, история работы и дипломы'});
  // «Подробнее» не пустое: деньги за год и стаж, который останется в истории работы.
  card.more.push({title:'В год',text:money(j.salary)+' на руки — столько приносила эта работа.'});
  if(c)card.more.push({title:'Стаж',text:months2732(c.months).replace(/^первый месяц в компании$/,'меньше месяца в компании')+' — останется в истории работы.'});
  card.moreHint='в год, стаж';
  return card;
 }};
 try{
  show('Что изменится','',[
   {label:'Да, уволиться',fn:()=>quit()},
   {label:'Остаться на работе',fn:()=>back&&back()}
  ]);
 }finally{nextCard273=null;}
}

// ---------- внутренние вакансии: зарплата в месяц и разница с нынешней ----------

function internalPatch2732(title,text,opts){
 if(title!=='Другая команда, тот же работодатель'||!s.job)return null;
 const list=internalVacancies18();
 if(list.length!==opts.length)return null;
 const now=s.job.salary/12,common=careerChance18('salary');
 const out=opts.map((o,i)=>{
  const v=list[i];
  if(!v||o.label!==v.title)return o;
  const e=careerChance18('transfer',v),exp=/релевантный опыт (\d+) мес\./.exec(e.factors||'');
  const tail=e.why.length?e.why.join('; '):'шанс '+pct273(e.probability)+(exp?' · опыт по профессии '+exp[1]+' мес.':'');
  return {...o,hint:money(v.salary/12)+'/мес. на руки · '+diff2732(v.salary/12,now)+' · '+tail};
 });
 return {opts:out,text:'Сейчас вы получаете '+money(now)+'/мес. на руки. Шанс перевода зависит от того же, что и прибавка: '+lower273(factors2732(common.factors))+', и от опыта по новой профессии. Разговор — '+raise2732.months+' мес. по '+raise2732.hours+' ч/нед., '+answerIn273(taskMonths273(raise2732.months,raise2732.hours))+'.\n'+text};
}

// ---------- «Рабочая неделя»: какие часы сейчас и сколько в месяц ----------

function hoursPatch2732(title,text,opts){
 if(title!=='Рабочая неделя'||!s.job)return null;
 const now=s.workHours||s.job.fullHours28||40;
 return {opts:opts.map(o=>{const m=/^(\d+) ч\/нед\./.exec(o?.label||'');if(!m)return o;const h=+m[1];
  return {...o,hint:h===now?'сейчас':money(s.job.salary*h/now/12)+'/мес. на руки'};})};
}

// ---------- «Моя работа» ----------

function panelBtn2732(fn,label,hint,disabled,cls='small'){
 const k=panelFns2732.push(fn)-1;
 return '<button class="'+cls+'" '+(disabled?'disabled':'')+' onclick="run16(()=>{panelOpt2732('+k+')})">'+esc(label)+(hint?'<small>'+esc(hint)+'</small>':'')+'</button>';
}
function panelOpt2732(k){const fn=panelFns2732[k];if(typeof fn==='function')fn();}
function workCard2732(sec){
 const j=s.job,c=company18(),r=raiseInfo2732(),x=path16();
 const hub=capture2732(()=>work2732Base.careerMenu18())?.opts||[],pay=capture2732(()=>work2732Base.salary())?.opts||[];
 const opts=employerOpts2732(hub,pay,null),byLabel=l=>opts.find(o=>o.label===l);
 const head=sec.querySelector('h2'),line=sec.querySelector('p');
 const offer=offers2732()[0],talk=talk2732();
 let html='<div class="eyebrow">ТЕКУЩАЯ РАБОТА</div>';
 if(head){head.classList.add('sr2732');html+=head.outerHTML;}
 html+='<div class="title2732">'+esc(jobTitle270(j.title))+'</div>';
 // Строка под названием, одна на всё: работодатель, формат, часы и дорога («20 мин дороги», как в окне работодателя),
 // чтобы главная кнопка поднялась к первому экрану телефона.
 const sub=line?line.innerHTML.replace(/^([^<]*?) · (\d+ ч\/нед\.)/,(m,a,h)=>a+' · '+esc(typeof jobFormatNow270==='function'?jobFormatNow270(j):'')+' · '+h)
  .replace(/<br>Дорога до работы: (в среднем )?(\d+) мин\. в одну сторону/,(m,avg,n)=>' · '+(avg||'')+n+' мин дороги'):'';
 if(sub)html+='<p class="sub2732">'+sub+'</p>';
 const offerPay=offer&&offer.kind!=='conditions21'&&Number.isFinite(offer.salary);
 if(offer){
  html+='<div class="status2732">Предложение руководителя: '+esc(offerName2732(offer))+' · ответить '+esc(untilMonth273(offer.expires))+'</div>';
  const d=capture2732(()=>work2732Base.openDecision24('career',offer.id));
  const acc=d?.opts.find(o=>o.label==='Принять'),dec=d?.opts.find(o=>o.label==='Отклонить');
  // Обучение меняет не зарплату, а неделю: сколько месяцев и часов, видно до «Принять».
  if(offer.kind==='training')html+='<p class="offer2732">Обучение: '+esc(trainingLine2732())+'</p>';
  else if(offerPay)html+='<p class="offer2732">'+esc(money(offer.salary/12)+'/мес. на руки · '+diff2732(offer.salary/12,j.salary/12)+(jobTitle270(offer.title)!==jobTitle270(j.title)?' · '+jobTitle270(offer.title):''))+'</p>';
  else{let t='';try{t=workEffect21(offer);}catch(e){}if(t)html+='<p class="offer2732">'+esc(t)+'</p>';}
  html+='<div class="offer-btns2732">'+(acc?panelBtn2732(acc.fn,'Принять','',false,'small main2732'):'')+(dec?panelBtn2732(()=>offerDeclineAsk2732(offer,dec.fn,null),'Отклонить','',false):'')+'</div>';
 }else if(talk)html+='<div class="status2732">'+esc(talk.text)+'</div>';
 // Деньги в месяц — одной строкой; рядом с предложением о зарплате это «Сейчас».
 const now=offerPay&&offer.kind!=='training';
 html+='<p class="money2732">'+(now?'Сейчас: ':'')+'<b>'+esc(money(j.salary/12)+'/мес.')+'</b> на руки'+(contract2732(j)?' · '+esc(contract2732(j)):'')+'</p>';
 const ask=byLabel('Повышение зарплаты'),hours=byLabel('Изменить рабочие часы');
 html+='<div class="main2732">'+
  (ask?panelBtn2732(ask.fn,'Повышение зарплаты',raiseHint2732(r,true,opts),!!ask.disabled,'small main2732'):'')+
  button16('Условия и рабочие часы','hoursMenu()')+
  '</div>';
 // «Подробнее»: всё остальное — те же варианты, что в окне работодателя, и прежние кнопки карточки.
 const skip=new Set(['Повышение зарплаты','Изменить рабочие часы',offerCondLabel2732,...offers2732().filter(q=>q.kind!=='conditions21').map(q=>'Предложение: '+careerKinds18[q.kind])]);
 const rest=opts.filter(o=>!skip.has(o.label)&&!o.hidden);
 const info=[];
 if(!r.e.why.length)info.push('<p><b>Прибавка.</b> +12% — это +'+esc(money(r.full/12))+'/мес.; в 3 случаях из 10 соглашаются только на +5% (+'+esc(money(r.part/12))+'/мес.). Разговор — '+raise2732.months+' мес. по '+raise2732.hours+' ч/нед.; если откажут, снова можно '+esc(sinceMonth273(r.again))+'.</p>',
  '<p><b>Почему '+pct273(r.e.probability)+'.</b> '+esc(factors2732(r.e.factors))+'.</p>');
 else{const why=r.e.why.map(w=>raiseWhy2732(w,opts));info.push('<p><b>Прибавку пока не попросить.</b> '+esc(why.map(w=>w.text+(w.when?' — '+w.when:'')).join('; '))+'.</p>');}
 info.push('<p><b>В год.</b> '+esc(money(j.salary))+' на руки.</p>');
 const open=moreOpen273('work-panel');
 html+='<details class="more2732" data-kind="work-panel" ontoggle="moreToggle273(this)"'+(open?' open':'')+'><summary>Подробнее<small>'+
  (r.e.why.length?'':'почему '+pct273(r.e.probability)+', ')+'отделы, история, договор, уволиться</small></summary><div class="more-body2732">'+info.join('')+
  '<div class="others2732">'+button16('Действия по текущей работе','workControls16()')+(j.contract45?button16('Срок трудового договора','contractMenu45()'):'')+
  rest.map(o=>panelBtn2732(o.fn,o.label,o.disabled?(o.why||o.hint||''):'',!!o.disabled)).join('')+'</div></div></details>';
 sec.innerHTML=html;
 sec.classList.add('work-card2732');
}
// Фоновый поиск: что ищет — строкой у переключателя, фильтры — там же. Пока поиск выключен, это фильтры списка
// вакансий (с ними он и включится, toggleSearch16); включён — его собственные (searchView78).
function searchView2732(){const x=path16();return x.search?(x.searchView78??={...x.view}):x.view;}
function searchFilter2732(key,value){
 const x=path16();
 if(!x.search)return filter16(key,value);
 const v=searchView2732();v[key]=value;
 if(key==='field'&&'track46' in v)v.track46='all';
 save();render();
}
function searchSelect2732(key,entries,label,v){
 const cur=v[key]??entries[0][0];
 return '<label>'+esc(label)+'<select aria-label="Фоновый поиск · '+attr2732(label)+'" onchange="searchFilter2732(\''+key+'\',this.value)">'+
  entries.map(([id,name])=>'<option value="'+attr2732(id)+'"'+(String(cur)===String(id)?' selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>';
}
const searchKeys2732=[
 ['country','Страна',()=>Object.entries(countries).map(([id,c])=>[id,c.name])],
 ['field','Направление',()=>Object.entries(fields16).map(([id,f])=>[id,f.name])],
 ['format','Формат',()=>Object.entries(formats16)],
 ['salary270','Зарплата от',v=>typeof salaryStepAmount270==='function'?[['all','Любая'],...salarySteps270.map(k=>[String(k),money(salaryStepAmount270(k,v))+'/год'])]:null],
 ['fte28','Ставка',()=>[['all','Любая'],['1','Полная'],['0.75','0,75'],['0.5','0,5'],['0.25','0,25']]],
 ['experience45','Опыт',()=>[['all','Любой опыт'],['none','Без опыта']]],
 ['documents45','Документы',()=>[['all','Любые условия'],['ready','Без нового разрешения на работу'],['after-offer','Отклик до оформления разрешения']]],
 ['contract45','Договор',()=>[['all','Любой договор'],['fixed','Срочный'],['permanent','Бессрочный']]],
 ['fit68','Соответствие',()=>[['all','Все вакансии'],['ready','Подходят сейчас'],['apply','Можно откликнуться, документы позже']]]
];
// Включённый фильтр — словами для строки «Ищет: …» и «Ещё фильтры»: «полная ставка», «срочный договор», без
// «мне» из подписей старых фильтров. Значение по умолчанию (all, у «Порядка» — none) не показывается.
const filterWords2732={
 fte28:{'1':'полная ставка','0.75':'ставка 0,75','0.5':'ставка 0,5','0.25':'ставка 0,25'},
 experience45:{none:'без опыта'},
 documents45:{ready:'без нового разрешения на работу','after-offer':'отклик до оформления разрешения'},
 contract45:{fixed:'срочный договор',permanent:'бессрочный договор'},
 fit68:{ready:'подходят сейчас',apply:'можно откликнуться, документы позже'},
 sort270:{salary:'сначала выше зарплата'}
};
function filterWord2732(key,value,text){
 if(value===undefined||value===null||value==='all'||key==='sort270'&&value==='none'||key==='country'&&value===s.country)return '';
 return filterWords2732[key]?.[value]||(key==='salary270'?'от '+text:key==='country'||key==='field'?text:lower273(text).replace(/ · /g,', '));
}
function searchSummary2732(v){
 const out=[];
 for(const [key,label,list] of searchKeys2732){
  const entries=list(v);if(!entries)continue;
  const cur=v[key]??entries[0][0];
  const e=entries.find(([id])=>String(id)===String(cur));
  if(!e)continue;
  const w=key==='field'||key==='format'?(key==='field'?e[1]:lower273(e[1]).replace(/ · /g,', ')):filterWord2732(key,String(cur),e[1]);
  if(w)out.push(w);
 }
 return out.join(' · ');
}
function searchBlock2732(){
 const x=path16(),v=searchView2732(),on=!!x.search;
 let state='';
 // Те же условия, что в backgroundJobSearch78: возраст, отклики в работе, свободные часы, раз в три месяца.
 if(on){
  const busy=x.jobApplications.some(a=>['submitted','interview','interviewing','offered','accepted'].includes(a.status));
  state=s.age<16?'начнёт откликаться с 16 лет':s.age>=67?'не идёт: после 67 лет фоновый поиск не откликается':
   busy?'ждёт, пока закончатся нынешние отклики':capacity()<=totalHours()?'стоит: в неделе нет свободных часов':'следующая проверка '+inMonth273(Math.max(s.clock.ticks+1,(x.lastSearch??0)+3));
 }
 const main=['field','format','salary270'],sel=k=>{const d=searchKeys2732.find(q=>q[0]===k);const e=d&&d[2](v);return e?searchSelect2732(k,e,d[1],v):'';};
 const open=moreOpen273('search-filters');
 return '<div class="search2732"><p><b>Фоновый поиск: '+(on?'включён':'выключен')+'</b>'+(state?' · '+esc(state):'')+'<br>'+
  (on?'Ищет: ':'Будет искать: ')+esc(searchSummary2732(v))+'</p>'+
  button16(on?'Остановить фоновый поиск':'Включить фоновый поиск','toggleSearch16()')+
  '<div class="path-filters filters-main2732">'+main.map(sel).join('')+'</div>'+
  '<details class="filters2732" data-kind="search-filters" ontoggle="moreToggle273(this)"'+(open?' open':'')+'><summary>Ещё фильтры поиска</summary><div class="path-filters">'+
  searchKeys2732.map(q=>q[0]).filter(k=>!main.includes(k)).map(sel).join('')+'</div></details>'+
  '<p class="sub2732">'+(on?'Раз в три месяца откликается на первую подходящую вакансию, пока нет других откликов.':'Включится с этими фильтрами — их можно поменять здесь или в списке вакансий.')+'</p></div>';
}
function workPanel2732(html){
 const t=document.createElement('template');
 t.innerHTML=html;
 const root=t.content,cards=[...root.querySelectorAll('section.path-card')];
 const jobCard=cards.find(x=>/ТЕКУЩАЯ РАБОТА/i.test(x.querySelector('.eyebrow')?.textContent||''));
 panelFns2732=[];
 if(jobCard&&s.job&&company18())workCard2732(jobCard);
 // Ярлыки («Каталог профессий», «Профессиональные навыки», портфолио, своё дело) — под первой карточкой и сводкой 272,
 // чтобы карточка работы стояла на первом экране. Без работы туда же поднимается «Следующая работа».
 const first=cards[0],sum=root.querySelector('.work-sum272'),after=sum||first,short=root.querySelector('.workspace-shortcuts58');
 const next=cards.find(x=>/^\s*Следующая работа/.test(x.querySelector('h3')?.textContent||''));
 if(next){
  const p=[...next.querySelectorAll('p')].find(p=>/^Фоновый поиск:/.test(p.textContent.trim())),b=[...next.querySelectorAll('button')].find(b=>/фоновый поиск$/.test(b.textContent.trim()));
  if(p&&b){p.remove();b.outerHTML=searchBlock2732();}
  if(!s.job&&after&&next!==after)after.after(next);
 }
 if(short&&after)(next&&!s.job?next:after).after(short);
 const d=document.createElement('div');d.append(root);
 return d.innerHTML;
}

// ---------- «Вакансии»: три фильтра, одна карточка на вакансию с выбором часов, шанс на карточке ----------

const vacMain2732=['Направление','Формат','Зарплата от'];
// Ставки одной вакансии (employment28: …-fte1, -fte0.75, -fte0.5, -fte0.25) — одна карточка. Младшая должность
// (careers45, …-junior45) и кампус (rights31) — свои карточки.
function vacGroup2732(id){return String(id).replace(/-fte[\d.]+/,'');}
function vacPay2732(v){return typeof vacancyPay270==='function'?vacancyPay270(v):localAmount16(v.salary,v.country);}
function vacList2732(){
 const x=path16(),v=x.view;
 const filtered=x.vacancies.filter(q=>(typeof vacancySearchMatches180!=='function'||vacancySearchMatches180(q))&&(typeof matchesCareer45!=='function'||matchesCareer45(q))&&(!v.fte28||v.fte28==='all'||String(q.fraction28??1)===v.fte28));
 const groups=new Map();
 for(const q of filtered){const k=vacGroup2732(q.id);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(q);}
 const list=[...groups.values()].map(g=>{const sorted=[...g].sort((a,b)=>vacPay2732(b)-vacPay2732(a)||(b.fraction28??1)-(a.fraction28??1));return {rep:sorted[0],all:sorted};});
 if(v.sort270==='salary')list.sort((a,b)=>vacPay2732(b.rep)-vacPay2732(a.rep));
 return list;
}
function vacFit2732(q){
 const r=jobEligibility16(q),x=path16();
 // Повторный отклик на ту же профессию в этой стране — не раньше срока (applyJob16 откажет, окно вакансии пишет то же).
 const retry=x.retry?.['job-'+q.profession+'-'+q.country]||0,rows=[];
 if(s.clock.ticks<retry)rows.push('повторный отклик на эту профессию — '+sinceMonth273(retry));
 if(!r.why.length&&!rows.length){const p=r.probability*interviewChance273(r.probability);return '<span class="chance2732">Шанс оффера '+pct273(p)+' · '+chanceWord273(p)+'</span>';}
 try{const p=profession16(q.profession);rows.push(...r.why.map(w=>jobNeed273(w,q,p).text));}catch(e){rows.push(...r.why);}
 return '<span class="need2732">Не хватает: '+esc(rows.slice(0,2).join('; '))+(rows.length>2?' и ещё '+(rows.length-2):'')+'</span>';
}
// Договор ставки — коротко: у ставок одной вакансии он бывает разный (employment28 тянет его для каждой отдельно).
function vacContract2732(q){const c=q.contract45;return !c?'':c.type==='permanent'?'бессрочный':'срочный'+(Number.isFinite(c.months)?' · '+c.months+' мес.':'');}
function vacCard2732(g){
 const q=g.rep,head=typeof vacancyHeadHTML270==='function'?vacancyHeadHTML270(q):esc(q.title);
 const meta=typeof vacancyMeta270==='function'?vacancyMeta270(q):esc(q.city);
 const others=g.all.filter(o=>o!==q),mine=vacContract2732(q);
 // Кнопка — сразу под заголовком: на телефоне первая карточка с кнопкой помещается на первый экран.
 // На кнопке другой ставки — её договор, если он не такой, как у ставки карточки (строка условий ниже — про неё).
 return '<article class="path-card vac2732"><h3 class="vacancy-head270">'+head+'</h3><div class="vac-row2732">'+button16('Условия и отклик',"jobDetails16('"+q.id+"')")+
  (others.length?'<span class="vac-hours2732"><span>Другие часы:</span>'+others.map(o=>{const k=vacContract2732(o);
   return '<button class="small chip2732" title="'+attr2732(money(vacPay2732(o)/12)+'/мес.')+'" onclick="run16(()=>{jobDetails16(\''+attr2732(o.id)+'\')})">'+(o.hours28??Math.round((o.fraction28??1)*40))+' ч'+(k&&k!==mine?'<small>'+esc(k)+'</small>':'')+'</button>';}).join('')+'</span>':'')+
  '</div><p class="vac-fit2732">'+vacFit2732(q)+'<br>'+meta+'</p>'+(typeof careerBadge45==='function'?careerBadge45(q):'')+'</article>';
}
// Строка «N вакансий · страница K» стоит первой в разметке (её читают по первому абзацу списка), а на экране — под
// карточками, у стрелок: над первой карточкой она отнимала строку первого экрана.
function vacResults2732(){
 const x=path16(),v=x.view,list=vacList2732(),n=list.length,page=Math.min(v.page||0,Math.max(0,Math.ceil(n/6)-1));
 return '<div id="vacancy-results180" class="vac-results2732"><p class="vac-count2732">'+n+' '+plural273(n,'вакансия','вакансии','вакансий')+' · страница '+(page+1)+'</p>'+
  list.slice(page*6,page*6+6).map(vacCard2732).join('')+(n?'':'<p class="vac-none2732">Под выбранные фильтры вакансий пока нет.</p>')+
  '<div class="vac-pager2732">'+button16('←',`path16().view.page=${Math.max(0,page-1)}`,page===0)+button16('→',`path16().view.page=${page+1}`,(page+1)*6>=n)+'</div></div>';
}
// Ключ фильтра по подписи списка: так «Ещё фильтры» называют включённые словами filterWords2732.
const vacKeys2732={'Страна':'country','Желаемая ставка':'fte28','Опыт':'experience45','Документы':'documents45','Договор':'contract45','Соответствие требованиям':'fit68','Соответствие':'fit68','Порядок':'sort270'};
// «Ещё фильтры» раскрыты, пока игрок в списке (меняет фильтры, листает, ищет); при новом открытии списка — свёрнуты,
// чтобы первая вакансия оставалась на первом экране. В localStorage и в сохранение не пишется.
function vacFiltersToggle2732(el){vacFiltersOpen2732=!!el.open;}
function vacFilters2732(root){
 const labels=[...root.querySelectorAll('label')].filter(l=>l.querySelector('select'));
 if(!labels.length)return;
 const top=document.createElement('div');top.className='path-filters filters-main2732';
 const more=document.createElement('details');more.className='filters2732';more.dataset.kind='vacancy-filters';more.setAttribute('ontoggle','vacFiltersToggle2732(this)');
 if(vacFiltersOpen2732)more.setAttribute('open','');
 const body=document.createElement('div');body.className='path-filters';
 const anchor=labels[0].closest('.path-filters')||labels[0];
 anchor.before(top,more);
 const active=[];
 for(const name of vacMain2732){const l=labels.find(l=>l.querySelector('select').getAttribute('aria-label')===name);if(l)top.append(l);}
 for(const l of labels){
  if(top.contains(l))continue;
  body.append(l);
  const sel=l.querySelector('select'),opt=[...sel.options].find(o=>o.hasAttribute('selected'))||sel.options[0];
  const name=sel.getAttribute('aria-label'),key=vacKeys2732[name]||name,val=opt?.value;
  const w=val?filterWord2732(key,val,opt.textContent.trim()):'';
  if(w)active.push(w);
 }
 // Поиск по названию — тоже в «Ещё фильтры»; найденное слово видно на строке «Ещё фильтры».
 const find=root.querySelector('.catalog-search180');
 if(find)body.prepend(find);
 let query='';try{query=typeof vacancySearch180==='function'?vacancySearch180().trim():'';}catch(e){}
 if(query)active.unshift('«'+query+'»');
 more.innerHTML='<summary>Ещё фильтры'+(active.length?'<small>'+esc(active.join(' · '))+'</small>':'')+'</summary>';
 more.append(body);
 for(const d of [...root.querySelectorAll('.path-filters')])if(d!==top&&d!==body&&!d.querySelector('label,.catalog-search180'))d.remove();
}
function vacView2732(html){
 const at=html.indexOf('<div id="vacancy-results180">');
 const t=document.createElement('template');
 t.innerHTML=at<0?html:html.slice(0,at);
 const root=t.content;
 vacFilters2732(root);
 // «К моей работе», «Отклики и офферы» и «Квалификации преподавателя» — под списком: первые две есть и в разделах
 // траектории над экраном.
 const links=document.createElement('div');links.className='vac-links2732';
 for(const b of [...root.children].filter(e=>e.tagName==='BUTTON'))if(!/^(←|→)$/.test(b.textContent.trim()))links.append(b);
 const d=document.createElement('div');d.append(root);
 return d.innerHTML+vacResults2732()+(links.children.length?links.outerHTML:'');
}

// ---------- «Заявки»: срок ответа датой, отказ с подтверждением ----------

// Статусы без подписи в status16 (documents45 пишет «ended45», когда кончился срочный договор) — словами.
const requestStatus2732={ended45:'Срочный договор закончился',ended:'Работа закончилась'};
function requestPatch2732(html,a){
 const active=requestActive58.work.includes(a.status);
 if(!status16[a.status]&&requestStatus2732[a.status])html=html.replace(' · '+esc(a.status),()=>' · '+requestStatus2732[a.status]);
 html=html.replace(/ · ответить за \d+ мес\./,()=>active&&Number.isFinite(a.expires)?' · ответить '+untilMonth273(a.expires):'');
 if(decisionActive24({kind:'job',id:a.id})){
  const b=button16('Отказаться',"jobDeclineAsk273('"+a.id+"')");
  html=html.replace(/<\/article>\s*$/,()=>b+'</article>');
 }
 return html;
}

// ---------- обёртки ----------

if(work2732Ready){
 careerMenu18=function(...a){return employerWin2732(()=>work2732Base.careerMenu18.apply(this,a),true);};
 workControls16=careerMenu18;
 // Окно «Зарплата, повышение и внутренние вакансии» открывается через base21.careerMenu18 (меню тем development22 и
 // agreements21 берут функцию оттуда в момент нажатия) — та же карточка.
 if(work2732Base.salary)base21.careerMenu18=function(...a){return employerWin2732(()=>work2732Base.salary.apply(this,a),false);};
 openDecision24=function(kind,id,...rest){
  if(kind!=='career'||nextCard273)return work2732Base.openDecision24.call(this,kind,id,...rest);
  const o=decisionRecord24({kind,id});
  if(!o||!decisionActive24({kind,id}))return work2732Base.openDecision24.call(this,kind,id,...rest);
  return offerWin2732(o,()=>work2732Base.openDecision24.call(this,kind,id,...rest));
 };
 hoursMenu=function(...a){return withShow2732(()=>work2732Base.hoursMenu.apply(this,a),hoursPatch2732);};
 // «Обязанности и условия» → «Предложение руководителя» → «Новые условия»: «Отклонить» — с тем же подтверждением.
 if(work2732Base.conditionsMenu21)conditionsMenu21=function(...a){return withShow2732(()=>work2732Base.conditionsMenu21.apply(this,a),conditionsPatch2732);};
 if(work2732Base.careerHistory21)careerHistory21=careerHistory2732;
 // Список вакансий открывается заново — «Ещё фильтры» свёрнуты.
 openPath16=function(section,...a){if(section==='vacancies58')vacFiltersOpen2732=false;return work2732Base.openPath16.call(this,section,...a);};
 workOverview58=function(...a){
  const html=work2732Base.workOverview58.apply(this,a);
  try{return workPanel2732(html);}catch(e){console.error(e);return html;}
 };
 vacanciesView58=function(...a){
  const html=work2732Base.vacanciesView58.apply(this,a);
  try{return vacView2732(html);}catch(e){console.error(e);return html;}
 };
 requestCard58=function(a,kind,...rest){
  const html=work2732Base.requestCard58.call(this,a,kind,...rest);
  if(kind!=='work'||!a?.vacancy)return html;
  try{return requestPatch2732(html,a);}catch(e){console.error(e);return html;}
 };
}

// ---------- стили ----------

(function workStyle2732(){
 if(!work2732Ready||typeof document==='undefined'||document.getElementById('work2732-style'))return;
 const st=document.createElement('style');
 st.id='work2732-style';
 st.textContent=[
  '.trajectory .sr2732{position:absolute!important;width:1px;height:1px;margin:0;padding:0;overflow:hidden;clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap}',
  '.work-card2732 .title2732{font-family:"Prata",Georgia,serif;font-size:23px;line-height:1.25;margin:4px 0 2px;overflow-wrap:anywhere}',
  '.work-card2732 .sub2732,.search2732 .sub2732{font-size:13px;line-height:1.5;color:var(--muted);margin:0}',
  '.work-card2732 .status2732{display:table;margin:8px 0 0;font-size:12.5px;line-height:1.35;background:var(--soft);border-radius:99px;padding:5px 11px 5px 24px;position:relative}',
  '.work-card2732 .status2732::before{content:"";position:absolute;left:10px;top:50%;width:8px;height:8px;margin-top:-4px;border-radius:50%;background:var(--accent)}',
  '.work-card2732 .offer2732{margin:6px 0 0;font-size:14px}',
  '.work-card2732 .offer-btns2732,.work-card2732 .main2732{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
  '.work-card2732 .offer-btns2732 button,.work-card2732 .main2732 button{margin:0;min-height:40px;flex:1 1 220px;text-align:left}',
  '.work-card2732 button small{display:block;font-size:11.5px;line-height:1.4;color:var(--muted);font-weight:400;margin-top:2px}',
  '.work-card2732 button.main2732{background:var(--ink);color:var(--paper);border-color:var(--ink)}',
  '.work-card2732 button.main2732 small{color:inherit;opacity:.85}',
  '.work-card2732 button.main2732[disabled]{background:#d9ccc6;border-color:#cbbcb5;color:#6d5d58}',
  '.work-card2732 .money2732{margin:8px 0 0;font-size:14px;line-height:1.45}.work-card2732 .money2732 b{font-size:15.5px;font-weight:600}',
  '.work-card2732 details.more2732{margin-top:12px;border-top:1px solid var(--line)}',
  '.work-card2732 details.more2732>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;min-height:40px;padding:4px 2px;font-size:14px;font-weight:500}',
  '.work-card2732 details.more2732>summary::-webkit-details-marker{display:none}',
  '.work-card2732 details.more2732>summary small{font-weight:400;color:var(--muted);font-size:12px;margin-right:auto}',
  '.work-card2732 details.more2732>summary::after{content:"▸";margin-left:auto;color:var(--muted);transition:transform .15s}',
  '.work-card2732 details.more2732[open]>summary::after{transform:rotate(90deg)}',
  '.work-card2732 .more-body2732 p{font-size:13px;line-height:1.55;color:var(--muted);margin:6px 0}',
  '.work-card2732 .others2732{display:grid;grid-template-columns:minmax(0,1fr);gap:6px;margin-top:8px}',
  '.work-card2732 .others2732 button{margin:0;min-height:40px;text-align:left}',
  '@media(min-width:700px){.work-card2732 .others2732{grid-template-columns:repeat(2,minmax(0,1fr))}}',
  '.search2732{margin-top:8px}.search2732>p{margin:6px 0}',
  '.trajectory .filters-main2732{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 2px}',
  '.filters-main2732 label{min-width:0}.filters-main2732 select{width:100%;min-width:0;min-height:40px}',
  'details.filters2732{margin:0 0 6px}details.filters2732 .path-filters{margin-top:6px}',
  '.trajectory .vac2732{padding:12px 13px;margin:8px 0}.trajectory .vac2732 h3{margin:0 0 6px}.vac2732 .vac-fit2732{margin:8px 0 4px}.vac2732 p.sub{margin:0}',
  'details.filters2732>summary{cursor:pointer;min-height:40px;display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:500}',
  'details.filters2732>summary small{font-weight:400;color:var(--muted);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}',
  'details.filters2732 .catalog-search180{flex:1 1 100%;margin:0 0 4px;min-width:0}',
  '.vac2732 .vac-row2732{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px}',
  '.vac2732 .vac-row2732>button{margin:0;min-height:40px}',
  '.vac2732 .vac-hours2732{display:flex;flex-wrap:wrap;align-items:center;gap:6px}',
  '.vac2732 .vac-hours2732>span{font-size:12px;color:var(--muted)}',
  '.vac2732 .chip2732{margin:0;min-height:40px;padding:4px 10px;font-size:12.5px}',
  '.vac2732 .chance2732{font-weight:500}.vac2732 .need2732{color:#8a4b16}',
  '.vac-results2732{display:flex;flex-direction:column}.vac-results2732>.vac-count2732{order:1;margin:10px 0 0;font-size:13px;color:var(--muted)}.vac-results2732>.vac-pager2732{order:2}',
  '.vac2732 .chip2732 small{display:block;font-size:10.5px;line-height:1.2;color:var(--muted);font-weight:400}',
  '.vac-links2732{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
  '@media(max-width:600px){.filters-main2732{gap:6px}.filters-main2732 label{font-size:12px}.filters-main2732 select{font-size:13px;padding-left:6px;padding-right:2px}',
  ' .trajectory .vac2732 h3{font-size:17px;line-height:1.3}}'
 ].join('\n');
 document.head.appendChild(st);
})();

if(work2732Ready&&typeof s!=='undefined'&&s&&document.getElementById('app')?.classList.contains('playing'))render();
