'use strict';
// Сборка 273.3: учёба на окнах-карточках windows273.js.
// • «Моя учёба»: наверху — сколько осталось (дата окончания по темпу monthPath16), оценки и когда грозит
//   академический отпуск по успеваемости, цена в месяц и кто платит. Школьнику — только школа. Остальное —
//   в «Подробнее».
// • Предложение вуза (openDecision24 'study'): принять место, выбрать, кто платит, и начать учёбу — в одном окне.
//   Варианты оплаты — те же кнопки «Начать · …», что в «Финансировании программы» (funding16 со всеми обёртками),
//   с суммой в месяц и причиной, если начать нельзя. Разрешение на учёбу и переезд — строками «Не хватает» с кнопками.
// • «Языки»: нужный язык сверху и подсвечен; у курса, практики, клуба и курсов в стране языка на кнопке цена, часы
//   и прирост. Языки на A0 — под «Все языки».
// • Стипендия — кнопкой с ценой и шансом в карточке заявки и в окне программы после подачи. Просьбы к родителям
//   и к компании — с шансом на кнопке.
// Числа — из функций игры: tuition16, tuitionQuote17, sponsorQuote22, scholarship16, languageLesson16,
// languageStayPrice53, clubFee19, languageRate72, studyLoad273, mobilityData24, moveQuote68, dateLabel86.
// Отказ от места — через окно «Что изменится» (как увольнение в 273.2). Нулевых сумм в подсказках нет.
// Подписи кнопок и заголовки не меняются; новые кнопки — «Начать · …» в окне предложения (те же, что в окне оплаты),
// «Подать на стипендию», «Попросить оплату у родителей», «Ответ и следующие шаги» и кнопки «Не хватает».
// В сохранении ничего нового: «Подробнее» запоминается по виду окна в этом браузере, как в windows273.js.
// Без windows273.js файл ничего не меняет.

const study2733On=typeof layout273==='function'&&typeof programBuild273==='function'&&typeof studyLoad273==='function';
const study2733Base={studyOverview58,languagesView16,requestCard58,openDecision24,programDetails16,supportMenu17,
 sponsorProgram22,sponsorMenu22,languageStayMenu53,languageClubsMenu53,actionCatalog24,programBuild273:study2733On?programBuild273:null};

// ---------- мелочи ----------

function span2733(m){m=Math.max(0,Math.ceil(m-1e-9));const y=Math.floor(m/12),r=m%12;return [y?y+' '+plural273(y,'год','года','лет'):'',r?r+' мес.':''].filter(Boolean).join(' ')||'меньше месяца';}
function level2733(n){return String(Math.round(n*100)/100).replace('.',',');}
// «ещё 0,2 уровня», «1 уровень», «4 уровня», «5 уровней»: дробь — всегда «уровня».
function levels2733(n){const t=level2733(n);return t+' '+(t.includes(',')?'уровня':plural273(+t,'уровень','уровня','уровней'));}
function cap2733(t){t=String(t||'');return t.charAt(0).toUpperCase()+t.slice(1);}
function studyApp2733(p){return path16().applications.find(a=>a.program===p.id&&['submitted','offered','accepted','enrolled'].includes(a.status))||null;}
function nextCheck2733(){const t=s.clock.ticks;return t+3-t%3;} // проверки оценок — в месяц, когда ticks % 3 === 0
function btn2733(label,code,hint='',disabled=false){return button16(label,code,disabled).replace(/<\/button>$/,hint?'<small>'+esc(hint)+'</small></button>':'</button>');}
function details2733(kind,summary,hint,body){return '<details class="more2733" data-kind="'+esc(kind)+'" ontoggle="moreToggle273(this)"'+(moreOpen273(kind)?' open':'')+'><summary>'+esc(summary)+(hint?'<small>'+esc(hint)+'</small>':'')+'</summary><div class="more-body2733">'+body+'</div></details>';}
function rowsHTML2733(rows){return '<dl class="rows2733">'+rows.filter(r=>r&&r.value).map(r=>'<div><dt>'+esc(r.label)+'</dt><dd>'+esc(r.value)+(r.note?'<small>'+esc(r.note)+'</small>':'')+'</dd></div>').join('')+'</dl>';}
function label2733(b){return [...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').replace(/\s+/g,' ').trim();}

// ---------- стипендия ----------

// Как в scholarshipApply16: заявка c().cost × 0,001, шанс scholarship16, конкурс — задача на 2 мес. (task16, 2 ч/нед.).
// Платит тот же, кто в payApplication231: до 18 лет — взрослые семьи, при договорённости с родителем — родитель, иначе вы.
const scholarStep2733={months:2,hours:2};
function scholarFee2733(){return c().cost*.001;}
function scholarPayer2733(a){
 const g=ensureFamily17().educationPlans231?.[a.program],q=g&&living(g.parentId);
 if(s.age<18)return {name:'родители',have:expenseAvailable231()};
 if(q)return {name:q.name,have:parentAvailable17(q)};
 return {name:'',have:Math.max(0,s.cash)};
}
function scholarWhy2733(a){
 const fee=scholarFee2733(),pay=scholarPayer2733(a);
 return pay.have+1e-6<fee?'На заявку нужно '+money(fee)+' — доступно '+money(Math.max(0,pay.have)):'';
}
function scholarHint2733(p,a){
 const pay=a?scholarPayer2733(a):{name:''};
 return 'заявка '+money(scholarFee2733())+(pay.name?(s.age<18?' · платят ':' · платит ')+pay.name:'')+' · шанс '+pct273(scholarship16(p))+' · '+scholarStep2733.months+' мес. по '+scholarStep2733.hours+' ч/нед. · '+answerIn273(taskMonths273(scholarStep2733.months,scholarStep2733.hours));
}
function scholarState2733(a){
 const sc=a?.scholarship;if(!sc)return '';
 if(sc.status==='submitted'){const k=liveTask273('pathScholarship',k=>k.application===a.id);return 'стипендия: '+(k?answerIn273(taskLeft273(k)):'на рассмотрении');}
 if(sc.status==='awarded')return 'стипендия покрывает '+pct273(sc.coverage||0)+' цены'+(sc.stipend?' и даёт пособие на жизнь':'');
 return 'в стипендии отказали';
}
function scholarOpt2733(p,a,back){
 if(!a||a.scholarship||!['submitted','offered','accepted','enrolled'].includes(a.status))return null;
 const why=scholarWhy2733(a);
 return {label:'Подать на стипендию',hint:scholarHint2733(p,a),disabled:!!why,why,fn:()=>{scholarshipApply16(a.id);back();}};
}

// ---------- окно программы после подачи ----------

function programOpts2733(p,a,opts){
 const retry=path16().retry[p.id]||0;
 const list=opts.map(o=>{
  if(o?.label!=='Подать заявку'||o.why)return o;
  // Заявка уже есть или не прошёл срок повторной подачи: apply16 откажет — кнопка серая с причиной.
  const why=a?(a.status==='enrolled'?'Вы уже учитесь на этой программе':a.status==='submitted'?'Заявка уже подана':'Есть предложение о зачислении'):s.clock.ticks<retry?'Повторная заявка — '+sinceMonth273(retry):'';
  return why?{...o,disabled:true,why}:o;
 });
 const add=[];
 if(a&&['offered','accepted'].includes(a.status)&&decisionActive24({kind:'study',id:a.id}))
  add.push({label:'Ответ и следующие шаги',hint:a.status==='offered'?'принять место, оплата и начало учёбы — в одном окне':'оплата и начало учёбы',fn:()=>openDecision24('study',a.id)});
 const sch=scholarOpt2733(p,a,()=>programDetails16(p.id));if(sch)add.push(sch);
 if(!add.length)return list;
 const i=list.findIndex(o=>o?.label==='Назад к каталогу');
 return i<0?[...list,...add]:[...list.slice(0,i),...add,...list.slice(i)];
}
function programCard2733(card,p){
 const a=studyApp2733(p),retry=path16().retry[p.id]||0,co='Попросить компанию оплатить эту программу';
 // Просьба к компании — задача на 2 мес. по 1 ч/нед. (requestSponsor22): к шансу — когда ответ.
 if(card.pay?.hints&&/^шанс /.test(card.pay.hints[co]||''))card.pay.hints[co]+=' · '+answerIn273(taskMonths273(2,1));
 if(!a){if(s.clock.ticks<retry&&!admission16(p).why.length)card.mainWhy='Повторная заявка — '+sinceMonth273(retry);return;}
 const sch=!a.scholarship&&['submitted','offered','accepted','enrolled'].includes(a.status);
 card.main=[...(['offered','accepted'].includes(a.status)&&decisionActive24({kind:'study',id:a.id})?['Ответ и следующие шаги']:[]),...(sch?['Подать на стипендию']:[])];
 const st=scholarState2733(a);
 if(st&&card.status?.text)card.status={...card.status,text:card.status.text+' · '+st};
}

// ---------- карточка заявки в «Заявках и ответах» ----------

function requestStudy2733(html,a){
 const p=prog16(a.program);if(!p)return html;
 const head=esc(uni16(p).name)+' · '+esc(status16[a.status]||a.status)+'<br>Стипендия: ',i=html.indexOf(head),j=i<0?-1:html.indexOf('</p>',i);
 if(j>0){
  let when='';
  if(a.status==='submitted'){const k=liveTask273('pathAdmission',k=>k.application===a.id);if(k)when=answerIn273(taskLeft273(k));}
  else if(a.status==='offered'&&Number.isFinite(a.expires))when='ответить '+untilMonth273(a.expires);
  const sch=a.scholarship?cap2733(scholarState2733(a)):'Стипендия не подана';
  html=html.slice(0,i)+esc(uni16(p).name)+' · '+esc(status16[a.status]||a.status)+(when?' · '+esc(when):'')+'<br>'+esc(sch)+html.slice(j);
 }
 const old=button16('Подать на стипендию',"scholarshipApply16('"+a.id+"')");
 if(html.includes(old)){const why=scholarWhy2733(a);html=html.replace(old,()=>btn2733('Подать на стипендию',"scholarshipApply16('"+a.id+"')",why||scholarHint2733(p,a),!!why));}
 return html;
}

// ---------- предложение вуза: принять, оплата и начало в одном окне ----------

// Плательщик по подписи кнопки в окне оплаты (fundingMenu17, development22, education71) — то, что передаётся studyStart16.
const startPayers2733={'Начать · свои средства':'self','Начать · родители и свои средства':'family','Начать · родители и кредит на остаток':'familyloan',
 'Начать · кредит на всю учёбу':'loan','Начать · компания, семья и свои средства':'employer','Начать · компания, семья и кредит на остаток':'employerloan','Начать · оплачивают родители':'family'};
// Варианты окна оплаты — вызовом funding16 со всеми обёртками, без показа окна.
function fundingCapture2733(id){
 const real=show,detail=nextDetail20,card=nextCard273;let got=null;
 show=function(title,text,opts){if(!got)got={title:String(title??''),text:String(text??''),opts:Array.isArray(opts)?opts.slice():[]};};
 try{funding16(id);}catch(e){console.error(e);}finally{show=real;nextDetail20=detail;nextCard273=card;}
 return got;
}
// Зачёт при переводе — как в studyStart16 (с transferCredit46).
function studyCredits2733(p){
 const x=path16();if(!x.transfer)return 0;const old=prog16(x.transfer.program);if(!old)return 0;
 let credits=old.field===p.field&&old.level===p.level&&old.subject26===p.subject26?Math.min(x.transfer.progress*.7,p.months*.6):old.level===p.level&&fields16[p.field].related.includes(old.field)?Math.min(x.transfer.progress*.25,p.months*.25):0;
 if(typeof transferCredit46==='function')credits=transferCredit46(old,p,x.transfer.progress,credits);
 return credits;
}
// Сколько в месяц и кто платит — те же суммы, что спишут payTuition17 со всеми обёртками (tuition44, development22,
// family231) и studyStart16 (кредит на всю учёбу или остаток).
function payLine2733(a,p,payer){
 const fee=tuition16(p,a),left=Math.max(0,p.months-studyCredits2733(p));
 if(s.age<18)return fee>=.5?'родители — '+money(fee)+' в месяц из своего бюджета':'учёба бесплатна — стипендия покрывает всё';
 if(payer.startsWith('employer')){const q=sponsorQuote22(p,a,payer),parts=[];
  if(q.company>=.5)parts.push('компания '+money(q.company));if(q.family>=.5)parts.push('родители '+money(q.family));
  if(q.own>=.5)parts.push(payer==='employerloan'?'остаток '+money(q.own)+' в кредит':'вы '+money(q.own));
  return parts.length?parts.join(' · ')+' в месяц':'учёба бесплатна';}
 if(fee<.5)return 'учёба бесплатна — стипендия покрывает всё';
 const q=['family','familyloan'].includes(payer)?tuitionQuote17(fee,a):{help:0};
 if(payer==='self')return 'вы — '+money(fee)+' в месяц';
 if(['family','familyloan'].includes(payer)&&!a.funding17)return '';
 // Нулей не пишем: родители платят всё — так и сказано; не платят — кнопка серая с причиной (startWhy2733).
 const own=Math.max(0,fee-q.help);
 if(['family','familyloan'].includes(payer)&&q.help<.5)return '';
 if(payer==='family')return own<.5?'родители платят всё — '+money(q.help)+' в месяц':'родители '+money(q.help)+' · вы '+money(own)+' в месяц';
 if(payer==='familyloan')return own<.5?'родители платят всё — '+money(q.help)+' в месяц · кредит не понадобится':'родители '+money(q.help)+' в месяц · кредит '+money(own*left)+' под 5%';
 if(payer==='loan')return 'сейчас платить не нужно · кредит '+money(fee*left)+' под 5%, 60 платежей после учёбы';
 return '';
}
// Почему начать нельзя — те же проверки и в том же порядке, что в studyStart16 (и language-stays53). Пусто — начнётся.
const readyWhys2733=['Сначала переезд в город программы','Нужно право учиться в стране программы'];
function startWhy2733(a,p,payer){
 const x=path16();
 if(typeof stayBusy53==='function'&&stayBusy53())return 'Сначала вернитесь с языковых курсов';
 if(a.status!=='accepted')return 'Сначала примите предложение';
 if(x.study||s.studyTrack||s.study)return 'Уже идёт другая программа';
 if(s.country!==p.country||residenceCity()!==p.city)return readyWhys2733[0];
 if(!permission16(p.country,'study'))return readyWhys2733[1];
 if(s.age<18&&payer.includes('loan'))return 'Кредит — с 18 лет';
 const req=admission16(p).why;if(req.length)return req[0];
 const sponsored=payer.startsWith('employer');
 if(sponsored&&!sponsor22(p.id))return 'Компания не оплачивает эту программу';
 const fee=tuition16(p,a),quote=sponsored?sponsorQuote22(p,a,payer):null,help=quote?quote.company+quote.family:['family','familyloan'].includes(payer)?tuitionHelp(fee,a.funding17):0;
 if(sponsored&&quote.company+1e-6<Math.min(fee*quote.grant.share,localAmount16(quote.grant.cap,quote.grant.country)))return 'Компании не хватает бюджета на первый месяц';
 if(s.age>=18&&['family','familyloan'].includes(payer)&&fee>0&&help<=0)return a.funding17?'Сейчас родители не могут платить':'Сначала договоритесь с родителями';
 if(['loan','familyloan','employerloan'].includes(payer)&&activeDebts().some(d=>d.student))return 'Уже есть студенческий кредит';
 if(payer==='loan'&&fee<.5)return 'Учёба бесплатна — кредит не нужен'; // studyStart16 оформил бы кредит на 0
 if(!['loan','familyloan','employerloan'].includes(payer)){const need=s.age<18?fee:fee-help,have=expenseAvailable231();if(have+1e-6<need)return 'На первый месяц нужно '+money(need)+' — доступно '+money(Math.max(0,have));}
 return '';
}
// Разрешение на учёбу — те же проверки, что в applyPermit16 (relocation68: взнос c().cost × 0,004, 3 мес., без ваших часов).
function permitFee2733(){return c().cost*.004;}
function permitPayer2733(a){const q=living(a?.funding17?.parentId);return q&&parentAvailable17(q)>=permitFee2733()?q:null;}
function permitWhy2733(a,country){
 const x=path16(),key='permit-study-'+country;
 if(s.age<17)return 'Заявку можно подать с 17 лет';
 if(!permitSource16('study',a.id,country))return 'После того как вы примете предложение';
 if(s.clock.ticks<(migration30().reentry30[country]||0)&&!citizenRight31(country))return 'Новая заявка — '+sinceMonth273(migration30().reentry30[country]);
 if(s.clock.ticks<(x.retry[key]||0))return 'Повторная заявка — '+sinceMonth273(x.retry[key]);
 if(!permitPayer2733(a)&&expenseAvailable231()<permitFee2733())return 'На оформление нужно '+money(permitFee2733());
 return '';
}
// Разрешение и переезд — календарные задачи (safeguards68: calendarKinds68): идут месяц за месяцем без ваших часов,
// усталость и занятость их не замедляют. Ответ — в месяц «начало + срок».
function calendarEnd2733(k){return (Number.isFinite(k.calendarStart68)?k.calendarStart68:s.clock.ticks-Math.floor(k.progress||0))+(k.duration||1);}
// Переезд — как в moveOptions68 → movePayers68 → moveConfirm68 → queueMove68 (relocation68, а не прежняя модель
// mobilityData24): жильё — общежитие, если можно, или недорогая комната; разовые расходы может взять родитель с доверием
// от 45; на счёте нужно иметь q.needed (разовые расходы и резерв на месяц, резерв не списывается); оформление —
// один календарный месяц. Самый дешёвый из этих вариантов.
function moveBest2733(a,p){
 if(typeof moveQuote68!=='function')return null;
 const homes=[...(typeof dormEligible68==='function'&&dormEligible68(p)?['dorm']:[]),'room'],payers=[null,...parents17().filter(q=>(q.inner?.trust??0)>=45).map(q=>q.id)];
 let best=null;
 for(const h of homes)for(const pid of payers){const q=moveQuote68('study',a.id,h,pid,[]);if(q&&!q.petPlan?.blocked&&(!best||q.needed<best.needed-1e-6))best=q;}
 if(best)best.several=homes.length>1||payers.length>1;
 return best;
}
// «общежитие: 9 222 E£ разово — может оплатить Мина · резерв 17 354 E£ на счёте» — без нулей; жильё названо, если
// вариантов несколько (это самый дешёвый).
function moveHint2733(q){
 const who=q.family>=.5&&living(q.parent)?.name,up=q.own>=.5&&q.family>=.5?money(q.own)+' разово, ещё '+money(q.family)+' может оплатить '+who:q.family>=.5?money(q.family)+' разово — может оплатить '+who:q.own>=.5?money(q.own)+' разово':'';
 return [q.several?(q.home==='dorm'?'общежитие':'комната')+':':'',up,q.reserve>=.5?(up?'· ':'')+'резерв '+money(q.reserve)+' на счёте':'',!up&&q.reserve<.5?'без расходов':''].filter(Boolean).join(' ');
}
function readyNeed2733(a,p){
 const d=mobilityData24('study',a.id),out=[],cname=countries[p.country]?.name||'';
 if(!d)return out;
 if(!d.permit){
  const text='Право учиться: '+cname+' — нет';
  if(d.pending){const app=path16().permitApplications.find(q=>q.country===p.country&&q.status==='submitted'),k=app&&liveTask273('pathPermit',k=>k.application===app.id);out.push({text,when:'заявка подана · '+(k?'ответ '+inMonth273(calendarEnd2733(k)):'на рассмотрении')});}
  else{const why=permitWhy2733(a,p.country),q=permitPayer2733(a);
   out.push(why?{text,when:lower273(why)}:{text,fix:{label:'Подать на разрешение',hint:money(permitFee2733())+(q?' · платит '+q.name:'')+' · 3 мес. без ваших часов · ответ '+inMonth273(s.clock.ticks+3),fn:()=>{applyPermit16('study',a.id,p.country);openDecision24('study',a.id);}}});}
 }
 if(!d.here){
  const text='Переезд в город программы: '+residenceCity()+' → '+p.city,k=liveTask273('pathMove',()=>true);
  if(k)out.push({text,when:'переезд уже готовится · '+inMonth273(calendarEnd2733(k))});
  else if(!d.source)out.push({text,when:'после того как вы примете предложение'});
  else if(!d.permit)out.push({text,when:'после разрешения на учёбу'});
  else if(s.age<17)out.push({text,when:'переезд на учёбу — с 17 лет'});
  else{
   const q=moveBest2733(a,p),gap=q?q.needed-Math.max(0,s.cash):0;
   if(!q)out.push({text,fix:{label:'Подготовить переезд',hint:'жильё и бюджет',fn:()=>move16('study',a.id)}});
   else if(gap>.01)out.push({text,when:'нужно иметь на счёте '+money(q.needed)+' — не хватает '+money(gap)});
   else out.push({text,fix:{label:'Подготовить переезд',hint:moveHint2733(q)+' · 1 мес. без ваших часов · переезд '+inMonth273(s.clock.ticks+1),fn:()=>move16('study',a.id)}});
  }
 }
 return out;
}
// Шанс, что родитель согласится оплачивать, — та же формула, что в educationSupport17; там же доля и срок повтора.
function supportOdds2733(a,p,q){
 const f=ensureFamily17(),x=path16(),key='tuition:'+a.id+':'+q.id;
 if(s.clock.ticks<(f.requests[key]||0))return {blocked:true,text:'снова можно '+sinceMonth273(f.requests[key])};
 const fee=tuition16(p,a),pBudget=parentAvailable17(q),income=countries[q.country].wage*q.finance17.incomeRatio/12,agePenalty=Math.max(0,s.age-30)*.008;
 const willing=bounded(.2+q.inner.trust*.004+q.inner.affection*.002+q.finance17.educationPriority*.2-agePenalty-(fee>pBudget/3?.15:0),.05,.95);
 if(q.inner.trust<40)return {blocked:true,text:'сейчас не согласится — доверие ниже 40'};
 if(pBudget<fee*.6)return {blocked:true,text:'сейчас не потянет: свободных денег меньше '+money(fee*.6)};
 const sustainable=(income-(countries[q.country].cost*q.finance17.expenseRatio/12)-q.finance17.obligations)*fxRate86(q.country);
 const remaining=Math.max(1,p.months-(x.study?.program===p.id?x.study.progress:0));
 const full=pBudget>=fee*remaining+c().cost*.25||pBudget>=fee*6&&sustainable>=fee;
 // educationSupport17 ставит перерыв на полгода при любом ответе: на кнопке — месяц, когда можно спросить снова (М3).
 return {blocked:false,p:willing,share:full?'вся цена':'60% цены',again:'если откажет, снова можно '+inMonth273(s.clock.ticks+6),text:'шанс '+pct273(willing)+' · '+(full?'вся цена':'60% цены')+' · если откажет, снова можно '+inMonth273(s.clock.ticks+6)};
}
function supportHint2733(a,p){
 const list=parents17().map(q=>({q,o:supportOdds2733(a,p,q)})),open=list.filter(x=>!x.o.blocked).sort((x,y)=>y.o.p-x.o.p);
 if(open.length){const o=open[0].o;return 'шанс '+pct273(o.p)+' · '+o.share+(list.length>1?' · '+open[0].q.name:'')+' · '+o.again;}
 return list.length?list[0].o.text:'';
}
function offerPay2733(a,p){
 const fee=tuition16(p,a);
 if(s.age<18)return fee>=.5?'родители — '+money(fee)+'/мес. из своего бюджета':'учёба бесплатна';
 if(fee<.5)return 'учёба бесплатна — стипендия покрывает всё';
 const g=typeof sponsor22==='function'&&sponsor22(p.id);
 // Цена в месяц уже в строке «Цена»: здесь только кто платит и доли, если платит не один; нулей нет.
 if(g){const q=sponsorQuote22(p,a,'employer'),parts=[q.company>=.5?'компания '+money(q.company):'',q.family>=.5?'родители '+money(q.family):'',q.own>=.5?'вы '+money(q.own):''].filter(Boolean);
  return parts.length===1?parts[0].split(' ')[0]+' — вся цена':parts.length?parts.join(' · ')+' в месяц':'вы или кредит на всю учёбу';}
 const help=a.funding17?tuitionQuote17(fee,a).help:0,own=Math.max(0,fee-help);
 return help>=.5?(own<.5?'родители — вся цена':'родители '+money(help)+' · вы '+money(own)+' в месяц или остаток в кредит'):'вы или кредит на всю учёбу';
}
function offerBuild2733(a,p,ctx,fund){
 const t=s.clock.ticks,load=studyLoad273(p),fee=tuition16(p,a),slow=load.pace<1;
 const card={rows:[],need:readyNeed2733(a,p),more:[],main:[],foot:['Все решения'],needTitle:'Чтобы начать учёбу, не хватает',
  settings:['Попросить оплату у родителей','Договориться с родителями','Подать на стипендию'],settingsTitle:'Чтобы платить меньше'};
 const sub=[];if(!ctx.title.includes(p.city))sub.push(p.city);if(p.country!==s.country)sub.push(countries[p.country]?.name||'');
 if(sub.filter(Boolean).length)card.sub=sub.filter(Boolean).join(', ');
 if(a.status==='offered'){
  card.status={text:'Предложение о зачислении'+(Number.isFinite(a.expires)?' · ответить '+untilMonth273(a.expires):''),tone:'wait'};
  card.main=['Принять предложение','Отказаться от места'];
  card.mainNote='Потом в этом же окне — кто платит и начало учёбы';
 }else{
  const starts=(fund?.opts||[]).filter(o=>o&&!o.hidden&&startPayers2733[o.label]).map(o=>o.label);
  card.main=starts.length?starts:['Выбрать оплату и начать учёбу'];
  card.status={text:'Место принято · '+(card.need.length?'сначала документы и переезд':'выберите, кто платит, и начните учёбу'),tone:'ok'};
 }
 card.rows.push({label:'Получите',value:diploma273[p.level]+' · '+(slow?'≈ ':'')+span273(load.months),note:'окончание не раньше '+month273(t+load.months,monthOf273)+(slow?' · по программе '+span273(p.months):'')});
 const sc=a.scholarship?.status==='awarded'&&a.scholarship.coverage>0;
 card.rows.push({label:'Цена',value:fee>=.5?money(fee)+'/мес.'+(sc?' после стипендии':'')+' · всего '+(slow?'≈ ':'')+money(fee*load.months):'бесплатно — стипендия покрывает всё',
  // Шанс стипендии — на кнопке «Подать на стипендию»; здесь только её состояние, если заявка уже подана.
  note:[hours273(load.hours),scholarState2733(a)].filter(Boolean).join(' · ')});
 if(a.status==='offered')card.rows.push({label:'Платить',value:offerPay2733(a,p)});
 // Своя причина у каждой серой кнопки «Начать · …» (mainWhy273 ставит всем первую строку «Не хватает»).
 card.whys=Object.fromEntries((ctx.opts||[]).filter(o=>o&&o.disabled&&startPayers2733[o.label]&&o.why).map(o=>[o.label,o.why]));
 if(s.age>=18)card.more.push({title:'Кредит',text:'5% годовых, 60 платежей после окончания или прекращения учёбы. Проживание кредит не оплачивает.'});
 card.more.push({title:'О вузе',text:'Качество '+p.quality+', сложность '+p.difficulty+', престиж '+p.prestige+', связи с работодателями '+p.employment+'.'});
 card.moreHint=(s.age>=18?'кредит, ':'')+'вуз, все условия';
 return card;
}
function offerOpts2733(a,p,opts,fund){
 const id=a.id,back=()=>openDecision24('study',id),have=new Set(opts.map(o=>o?.label));
 // Отказ от места не отменить: сначала короткое «Что изменится».
 const list=opts.map(o=>o?.label==='Отказаться от места'?{...o,fn:()=>studyDeclineAsk2733(id)}:o);
 const add=[],parents=s.age>=18&&parents17().length?supportHint2733(a,p):'',ready=a.status==='accepted'?readyNeed2733(a,p):[];
 if(a.status==='accepted'&&fund)for(const o of fund.opts){
  if(!o||o.hidden||typeof o.label!=='string'||have.has(o.label))continue;
  have.add(o.label);
  const payer=startPayers2733[o.label];
  if(payer){
   let why=startWhy2733(a,p,payer)||(o.disabled?(typeof o.why==='string'&&o.why||o.hint||'Сейчас недоступно'):'');
   // Не хватает права учиться или переезда — причина та же, что первая строка «Не хватает» (design.md, К3):
   // без разрешения переезд не начать, и «Сначала переезд» при «Подать на разрешение» сбивало бы с толку.
   if(ready.length&&readyWhys2733.includes(why))why=ready[0].text;
   add.push({...o,hint:payLine2733(a,p,payer),disabled:!!why,why});
  }else if(['Попросить оплату у родителей','Договориться с родителями'].includes(o.label))add.push({...o,hint:parents||o.hint});
  else add.push(o);
 }
 if(a.status==='offered'&&parents&&!have.has('Попросить оплату у родителей'))add.push({label:'Попросить оплату у родителей',hint:parents,fn:()=>supportMenu17(id)});
 const sch=scholarOpt2733(p,a,back);if(sch)add.push(sch);
 const i=list.findIndex(o=>o?.label==='Все решения');
 return i<0?[...list,...add]:[...list.slice(0,i),...add,...list.slice(i)];
}
// Окно «Что изменится» — как у увольнения в 273.2 (work2732.js): заголовок-вопрос, строки последствий, две кнопки.
function studyDeclineAsk2733(id){
 const a=path16().applications.find(a=>a.id===id),p=a&&prog16(a.program);
 if(!p||!decisionActive24({kind:'study',id}))return;
 const retry=path16().retry[p.id]||0;
 nextCard273={kind:'study-decline',area:'Учёба',title:'Отказаться от места?',h2:'sub',build:()=>{
  const card={sub:levels16[p.level]+' · '+programName26(p)+' · '+uni16(p).name,rows:[],need:[],more:[],main:['Да, отказаться','Вернуться к предложению'],foot:[]};
  card.rows.push({label:'Место',value:'закроется, вернуть его будет нельзя'});
  card.rows.push({label:'Снова подать',value:(s.clock.ticks<retry?sinceMonth273(retry):'можно сразу')+', конкурс заново'});
  if(a.scholarship?.status==='awarded')card.rows.push({label:'Стипендия',value:'пропадёт вместе с местом'});
  if(a.funding17)card.rows.push({label:'Родители',value:'договорённость об оплате этой учёбы закончится'});
  card.more.push({title:'Предложение',text:a.status==='offered'&&Number.isFinite(a.expires)?'Ответить нужно '+untilMonth273(a.expires)+'. До тех пор место ваше.':'Место принято, учёба ещё не началась.'});
  card.moreHint='срок ответа';
  return card;
 }};
 try{
  show('Что изменится','',[
   {label:'Да, отказаться',fn:()=>declineDecision24('study',id)},
   {label:'Вернуться к предложению',fn:()=>openDecision24('study',id)}
  ]);
 }finally{nextCard273=null;}
}

// ---------- «Моя учёба» ----------

// Темп учёбы — как в monthPath16: max(0,25, min(1, свободные часы / (занятия + нагрузка программы))). Поездки не учтены:
// они временные.
function studyPace2733(p){return Math.max(.25,Math.min(1,capacity()/Math.max(1,totalHours()+(p.hours||0))));}
// «в 1,5 раза медленнее»; когда до «в 1 раз» округляется — «немного медленнее».
function slower2733(pace){const n=num273(1/pace);return +n.replace(',','.')<1.05?'немного медленнее':'в '+n+' раза медленнее';}
function payerText2733(t,p,a){
 const fee=tuition16(p,a);
 if(s.age<18)return 'платят родители';
 if(t.payer==='loan'){const d=s.debts.find(d=>d.pathStudy&&d.studyId===t.id);return 'оплачено кредитом'+(d?' · долг '+money(d.balance):'');}
 // Нулей не пишем (design.md 1.2, п. 15): кто сейчас не платит — словами.
 if(t.payer.startsWith('employer')){const q=sponsorQuote22(p,a,t.payer);if(q.company>=.5&&q.family<.5&&q.own<.5)return 'платит компания';const parts=[q.company>=.5?'компания '+money(q.company):'компания сейчас не платит',q.family>=.5?'родители '+money(q.family):'',q.own>=.5?(t.payer==='employerloan'?'остаток в кредит ':'вы ')+money(q.own):''];return parts.filter(Boolean).join(' · ');}
 if(['family','familyloan'].includes(t.payer)){
  const q=tuitionQuote17(fee,a),own=Math.max(0,fee-q.help),rest=t.payer==='familyloan'?'остальное в кредит':'вы '+money(own);
  if(!agreement17(a))return t.payer==='familyloan'?'договорённости с родителями нет · остальное в кредит':'платите вы — договорённости с родителями нет';
  if(q.help<.5)return t.payer==='familyloan'?'родители сейчас не платят · остальное в кредит':'родители сейчас не платят — платите вы';
  return own<.5?'платят родители':'родители '+money(q.help)+' · '+rest;
 }
 return 'платите вы';
}
function studyTop2733(t,p){
 const a=path16().applications.find(a=>a.id===t.application),fee=tuition16(p,a),pace=studyPace2733(p),left=Math.max(0,p.months-(t.progress||0));
 const months=Math.ceil(left/pace-1e-9),paused=t.status==='paused',now=s.clock.ticks,rows=[];
 // Пока учёба стоит (пауза, неоплаченный период, нет права учиться), дата окончания не считается: вместо неё — причина.
 const stopped=!paused&&!!t.blocked;
 rows.push({label:'Осталось',value:paused?'академический отпуск · ещё '+span2733(left)+' учёбы':stopped?'учёба стоит · ещё '+span2733(left)+' учёбы':left<=0?'программа пройдена':(pace<1?'≈ ':'')+span2733(months)+' · до '+month273(now+months,monthOf273),
  note:stopped?t.blocked:[!paused&&pace<1?slower2733(pace)+': не хватает часов':'',p.level==='phd'?'исследование: '+(t.research||0)+' из 4 этапов':''].filter(Boolean).join(' · ')});
 // Проверка раз в квартал (monthPath16): +1, если в неделе есть свободные часы, иначе −3; три раза подряд ниже 30 —
 // академический отпуск. Пока учёба стоит, проверок нет.
 const up=capacity()>totalHours(),next=Math.max(0,Math.min(100,Math.round(t.grades)+(up?1:-3)));
 rows.push({label:'Оценки',value:Math.round(t.grades)+'/100'+(paused||stopped?'':' → '+next+' '+inMonth273(nextCheck2733())),
  note:paused||stopped?'':t.badTerms>=2?'ещё раз ниже 30 — академический отпуск':t.badTerms?'ещё два раза ниже 30 — академический отпуск':'ниже 30 три раза подряд — академический отпуск'});
 // Кредит на всю учёбу — одной фразой («оплачено кредитом · долг …»); бесплатно — без «кто платит».
 rows.push({label:'Цена',value:t.payer==='loan'&&s.age>=18?payerText2733(t,p,a):fee>=.5?money(fee)+'/мес.'+(paused?' после отпуска':'')+' · '+payerText2733(t,p,a):'бесплатно',note:scholarState2733(a)});
 return rows;
}
function pupilTop2733(){
 familySchoolState();
 const a=s.school,paid=a.type!=='public',rows=[];
 const after=paid?'перевод в государственную школу':'школа назначит повторное освоение тем';
 rows.push({label:'Успеваемость',value:Math.round(a.grades)+'/100 · проверка '+inMonth273(nextCheck2733()),
  note:a.badTerms?'уже было предупреждение: если и эта проверка ниже 40 — '+after:'ниже 40 — предупреждение, две проверки подряд — '+after});
 if(typeof schoolLanguageSummary73==='function'){const l=schoolLanguageSummary73();if(l)rows.push({label:'Языки',value:l});}
 return rows;
}
function appsTop2733(){
 const x=path16(),rows=[],act=x.applications.filter(a=>['submitted','offered','accepted'].includes(a.status));
 const offer=act.find(a=>['offered','accepted'].includes(a.status)&&decisionActive24({kind:'study',id:a.id}));
 if(offer){const p=prog16(offer.program);rows.push({label:'Поступление',value:(offer.status==='offered'?'предложение о зачислении':'место принято')+' · '+uni16(p).name,note:offer.status==='offered'&&Number.isFinite(offer.expires)?'ответить '+untilMonth273(offer.expires):'осталось выбрать оплату и начать'});}
 const sub=act.filter(a=>a.status==='submitted');
 if(sub.length){const k=sub.map(a=>liveTask273('pathAdmission',k=>k.application===a.id)).filter(Boolean).map(taskLeft273).sort((a,b)=>a-b)[0];
  rows.push({label:'Заявки',value:sub.length+' на рассмотрении'+(Number.isFinite(k)?' · '+answerIn273(k):'')});}
 return {rows,offer};
}
function studyPanel2733(html){
 const box=document.createElement('div');box.innerHTML=html;
 const x=path16(),t=x.study,p=t&&prog16(t.program),h1=box.querySelector('h1');
 if(!h1)return html;
 const secs=[...box.children].filter(e=>e.matches('section'));
 const byEyebrow=w=>secs.find(e=>e.querySelector(':scope > .eyebrow')?.textContent.trim()===w);
 const byHead=w=>secs.find(e=>e.querySelector(':scope > h2, :scope > h3')?.textContent.trim()===w);
 const take=(sec,labels)=>labels.map(l=>sec&&[...sec.querySelectorAll('button')].find(b=>label2733(b)===l||l instanceof RegExp&&l.test(label2733(b)))).filter(Boolean);
 let kind,title='',sub='',rows=[],main=[],from=null;
 const pupil=byEyebrow('ШКОЛА'),next=byHead('Следующее образование');
 if(p){
  kind='study-panel';from=byEyebrow('ТЕКУЩАЯ ПРОГРАММА');title=programName26(p);
  sub=[levels16[p.level],uni16(p).name].join(' · ');
  rows=studyTop2733(t,p);
  // В отпуске занятий нет — наверху «Возобновить» и оплата; если учёба стоит из-за оплаты — сначала оплата.
  main=take(from,t.status==='paused'?['Возобновить учёбу','Оплата текущей учёбы']:[...(t.blocked?['Оплата текущей учёбы']:[]),'Занятия по программе',...(p.level==='phd'?['Следующий этап исследования']:[]),...(t.blocked?[]:['Оплата текущей учёбы'])]);
 }else if(pupil){
  kind='school-panel';from=pupil;title=pupil.querySelector('h2')?.textContent||'Школа';
  rows=pupilTop2733();
  main=take(pupil,[/^(Подтянуть оценки|Дополнительные занятия в расписании)$/,'Школьные мероприятия','Выбор школы']);
 }else if(s.age<6&&byHead('Сейчас нет активной программы')){
  // До школы (школа — с 6 лет, familySchoolState): вузов наверху нет (design.md 3.6), только когда школа.
  kind='preschool-panel';from=byHead('Сейчас нет активной программы');title='До школы';
  rows=[{label:'Школа',value:ageWhen2733(6)}];
 }else if(byHead('Сейчас нет активной программы')){
  kind='nostudy-panel';from=byHead('Сейчас нет активной программы');title='Сейчас нет активной программы';
  const ap=appsTop2733();rows=ap.rows;
  // Вуз — нынешним названием (employers271: в дипломе хранится прежнее).
  if(!rows.length){const d=x.diplomas.filter(d=>!d.legacy).at(-1);if(d)rows.push({label:'Последний диплом',value:d.title+(d.year?' · '+d.year:''),note:typeof currentUniName271==='function'?currentUniName271(d.university,d.country):d.university||''});}
  main=take(next,['Каталог программ и поступление',/^Заявки на поступление · \d+$/]);
  if(ap.offer){const b=document.createElement('div');b.innerHTML=button16('Ответ и следующие шаги',"openDecision24('study','"+ap.offer.id+"')");main.unshift(b.firstChild);}
 }else return html;
 // Школьнику с ответом вуза — тоже наверх.
 if(kind==='school-panel'){const ap=appsTop2733();if(ap.offer){rows.push(...ap.rows.slice(0,1));const b=document.createElement('div');b.innerHTML=button16('Ответ и следующие шаги',"openDecision24('study','"+ap.offer.id+"')");main.unshift(b.firstChild);}}
 const top=document.createElement('section');top.className='path-card top2733';top.dataset.state=kind;
 top.innerHTML='<h2>'+esc(title)+'</h2>'+(sub?'<p class="sub2733">'+esc(sub)+'</p>':'')+rowsHTML2733(rows)+'<div class="main2733"></div>';
 const mainBox=top.querySelector('.main2733');for(const b of main)mainBox.append(b);
 // Остальное — в «Подробнее» в прежнем порядке: прежняя карточка без перенесённых кнопок и её сведений.
 if(from){for(const e of [...from.children])if(e.matches('.eyebrow,h2,p'))e.remove();if(!from.querySelector('button'))from.remove();else{const h=document.createElement('h3');h.textContent=kind==='study-panel'?'Ещё по программе':kind==='school-panel'?'Ещё по школе':'Учёба';from.prepend(h);}}
 if(next&&!next.querySelector('button'))next.remove();
 const tasks=secs.find(e=>e.querySelector(':scope > h3')?.textContent.trim()==='Сейчас в расписании');
 const rest=[...box.children].filter(e=>e!==h1&&e!==tasks&&!e.matches('.headline-help187,.heading-hint187'));
 const hint=kind==='preschool-panel'?'навыки, языки, поступление':kind==='school-panel'?'навыки, языки, поступление, общежитие':'навыки, языки, дипломы, общежитие';
 // «Подробнее» запоминается для «Моей учёбы» одно на все состояния: студент, школьник, без программы.
 const more=document.createElement('div');more.innerHTML=details2733('study-panel','Подробнее',hint,'');
 const body=more.querySelector('.more-body2733');for(const e of rest)body.append(e);
 h1.after(top);top.after(...(tasks?[tasks]:[]),more.firstChild);
 return box.innerHTML;
}

// ---------- «Языки» ----------

// Нужный язык: требование вашей учёбы или заявок, потом откликов на работу, потом вакансий в списке, потом язык
// страны, где вы живёте. Для каждого — уровень, который нужен, и для чего.
function langNeeds2733(){
 const x=path16(),out=[];
 const add=(l,need,why,kind)=>{if(!lang16[l]||level16(l)>=need)return;const o=out.find(o=>o.l===l);if(!o)out.push({l,need,why,kind});else if(need>o.need)Object.assign(o,{need,why});};
 for(const a of x.applications.filter(a=>['submitted','offered','accepted','enrolled'].includes(a.status))){const p=prog16(a.program);if(p)add(p.language,p.minLanguage,levels16[p.level]+' · '+programName26(p),'study');}
 for(const a of x.jobApplications.filter(a=>['submitted','interview','interviewing','offered','accepted'].includes(a.status))){const p=profession16(a.vacancy.profession);if(p)add(a.vacancy.language,p.language,jobTitle270(a.vacancy.title),'job');}
 if(s.age>=16){const count={};for(const v of x.vacancies||[]){const p=profession16(v.profession);if(p&&level16(v.language)<p.language){const k=v.language+':'+p.language;count[k]=(count[k]||0)+1;}}
  const best=Object.entries(count).sort((a,b)=>b[1]-a[1])[0];if(best){const [l,n]=best[0].split(':');add(l,+n,best[1]+' '+plural273(best[1],'вакансия','вакансии','вакансий')+' в списке','vacancy');}}
 return out;
}
function langTop2733(){
 const x=path16(),need=langNeeds2733()[0];
 if(need)return {...need,eyebrow:need.kind==='study'?'Нужен для учёбы':need.kind==='job'?'Нужен для работы':'Нужен для вакансий'};
 const home=country16[s.country]?.[0];
 if(home&&lang16[home]&&!x.native.includes(home)&&level16(home)<6)return {l:home,need:level16(home)+1,why:countries[s.country].name,eyebrow:'Язык страны'};
 const busy=s.clock.tasks.find(t=>t.kind==='pathLanguage'&&!['completed','cancelled'].includes(t.state));
 if(busy)return {l:busy.language,need:Math.min(6,level16(busy.language)+1),why:'',eyebrow:'Сейчас изучаете'};
 return null;
}
// Курс и практика — languageLesson16: то, что спишет languageTask16 и прибавит задача pathLanguage.
function lessonHint2733(l,mode){
 const L=languageLesson16(mode),t=s.clock.tasks.find(t=>t.kind==='pathLanguage'&&t.language===l&&!['completed','cancelled'].includes(t.state));
 if(level16(l)>=6)return {hint:'уже C2',disabled:true};
 if(t)return {hint:(t.label.endsWith('курс')?'курс':'практика')+' '+answerIn273(taskLeft273(t),'идёт, закончится','стоит — в неделе нет свободных часов'),disabled:true};
 return {hint:L.months+' мес. · '+L.hours+' ч/нед. · '+(L.cost>=.5?money(L.cost)+' сразу':'бесплатно')+' · +'+level2733(L.gain)+' уровня'};
}
// Разговорный клуб этого языка — те же условия, что в joinClub19 и languageClubsMenu53; прирост — languageRate72.
function clubButton2733(l){
 const type='speaking53_'+l,cfg=clubsCatalog19[type];if(!cfg)return '';
 const m=clubState19().memberships.find(m=>m.type===type&&clubLocal19(m)&&m.status!=='left');
 if(m)return btn2733('Открыть · '+cfg.name,"clubDetail19('"+m.id+"')",m.status==='active'?'вы в клубе · '+money(c().cost*cfg.fee)+'/мес.':'клуб на паузе');
 const rate=typeof languageRate72==='function'?languageRate72(type,path16().languages[l]||0):0;
 const busy=clubState19().memberships.filter(m=>m.status==='active').reduce((n,m)=>n+clubsCatalog19[m.type].hours,0)+cfg.hours>capacity();
 const why=clubWhy2733(type)||(level16(l)<1?'с A1':typeof stayBusy53==='function'&&stayBusy53()?'после возвращения с курсов':busy?'не хватает свободного времени':'');
 return btn2733(cfg.name,"joinClub19('"+type+"')",why||cfg.hours+' ч/нед. · '+money(c().cost*cfg.fee)+'/мес. · до +'+level2733(rate)+' уровня в месяц',!!why);
}
// joinClub19 молча ничего не делает, если клуб не по возрасту (clubAge23: у языковых клубов — с 18 лет).
function clubWhy2733(type){
 const cfg=clubsCatalog19[type];if(!cfg||s.dead)return 'недоступно';
 if(typeof clubAge23==='function'&&!clubAge23(type))return s.age<(cfg.minAge??18)?ageWhen2733(cfg.minAge??18):'не по возрасту';
 return '';
}
// «с 18 лет, через 5 лет» — как в design.md 1.2.
function ageWhen2733(age){const n=age-s.age;return 'с '+age+' '+plural273(age,'года','лет','лет')+(n>0?', через '+(n===1?'год':n+' '+plural273(n,'год','года','лет')):'');}
// Курсы в стране языка — languageStayPrice53 и languageStayWhy53; +0,28 уровня за месяц на курсах (languageStayMonth53).
function stayCountries2733(l){return Object.keys(countries).filter(c=>c!==s.country&&country16[c]?.[0]===l);}
function stayButton2733(l){
 const list=stayCountries2733(l);if(!list.length)return '';
 const why=languageStayWhy53(list[0],1).find(w=>!/^Не хватает/.test(w))||'';
 return btn2733('Курсы в стране языка',"languageStayMenu53('"+l+"')",(why?lower273(why):stayPrice2733(list,true)+' · полный день · +0,28 уровня в месяц'),false);
}
// Цена программы — languageStayPrice53: у неё постоянная часть, поэтому месяц на долгой программе дешевле. Показываем
// оба края (1 и 6 мес.) и отдельно заявку c().cost × 0,002 (applyLanguageStay53 списывает её при подаче).
function stayPrice2733(list,from){
 const lo=m=>Math.min(...list.map(c=>languageStayPrice53(c,m))),pre=from&&list.length>1?'от ':'';
 return '1 мес. — '+pre+money(lo(1))+', 6 мес. — '+pre+money(lo(6))+' · заявка '+money(c().cost*.002);
}
function languagesPanel2733(html){
 const box=document.createElement('div');box.innerHTML=html;
 const x=path16(),cards=new Map();
 for(const card of box.querySelectorAll('.path-card')){
  const m=/languageTask16\('(\w+)','course'\)/.exec([...card.querySelectorAll('button')].map(b=>b.getAttribute('onclick')||'').join(' '));
  if(m)cards.set(m[1],card);
 }
 if(!cards.size)return html;
 // Подсказки у курса и практики — на каждой карточке.
 for(const [l,card] of cards)for(const b of card.querySelectorAll('button.language-lesson186')){
  const mode=/'practice'\)/.test(b.getAttribute('onclick')||'')?'practice':'course',h=lessonHint2733(l,mode),sm=b.querySelector('small');
  if(sm)sm.textContent=h.hint;if(h.disabled)b.disabled=true;
 }
 const top=langTop2733(),h1=box.querySelector('h1');
 if(top&&cards.get(top.l)){
  const card=cards.get(top.l),have=x.languages[top.l]||0,lv=level16(top.l),gap=Math.max(0,top.need-have);
  card.classList.add('need2733');
  const head=document.createElement('div');head.className='eyebrow';head.textContent=top.eyebrow+(top.why?' · '+top.why:'');card.prepend(head);
  const line=document.createElement('p');line.className='target2733';
  // Одна строка вместо двух: прежнюю «Подготовка к следующему уровню: 80%» заменяет эта.
  const next=top.eyebrow==='Язык страны'||top.eyebrow==='Сейчас изучаете';
  line.textContent=next?(lv>=6?'C2 — высший уровень':'Следующий уровень — '+cefr16[Math.min(6,top.need)]+': готово '+Math.round((have%1)*100)+'%'):'Нужно '+cefr16[top.need]+' — у вас '+cefr16[lv]+' · ещё '+levels2733(gap);
  for(const e of card.querySelectorAll(':scope > p'))if(/^Подготовка к следующему уровню/.test(e.textContent.trim()))e.remove();
  card.querySelector('h3')?.after(line);
  const extra=document.createElement('div');extra.className='lang-more2733';extra.innerHTML=clubButton2733(top.l)+stayButton2733(top.l);
  const last=[...card.querySelectorAll('button.language-lesson186')].at(-1);if(last)last.after(extra);else card.append(extra);
  (h1||box.firstChild).after(card);
 }
 // Языки на A0 без прогресса и занятий — под «Все языки».
 const zero=[...cards].filter(([l,card])=>card!==cards.get(top?.l)&&!x.native.includes(l)&&(x.languages[l]||0)<=0&&!s.clock.tasks.some(t=>t.kind==='pathLanguage'&&t.language===l&&!['completed','cancelled'].includes(t.state))).map(([,card])=>card);
 if(zero.length){
  const more=document.createElement('div');more.innerHTML=details2733('languages-all','Все языки · '+zero.length,'на уровне A0','');
  const body=more.querySelector('.more-body2733');zero[0].before(more.firstChild);for(const c of zero)body.append(c);
 }
 return box.innerHTML;
}
// Окно «Курсы в стране языка»: с языком — только страны этого языка; у страны — цена месяца; у срока — прирост уровня.
function stayDuration2733(fn){return function(){const old=show;show=function(title,text,opts=[],...rest){
  if(title==='Продолжительность')opts=opts.map(o=>{const m=/^(\d+) мес\./.exec(o?.label||'');return m?{...o,hint:'+'+level2733(Math.min(6,.28*+m[1]))+' уровня · '+(o.hint||'')}:o;});
  return old(title,text,opts,...rest);};try{return fn();}finally{show=old;}};}

// «Клубы по языкам» → язык: у каждого формата — часы, взнос (clubFee19) и прирост за полный месяц (languageRate72).
function clubFormats2733(fn){return function(){const old=show;show=function(title,text,opts=[],...rest){
  opts=opts.map(o=>{
   const type=Object.keys(clubsCatalog19).find(k=>clubsCatalog19[k].language53&&o?.label===clubsCatalog19[k].name);
   if(!type)return o;const cfg=clubsCatalog19[type],rate=typeof languageRate72==='function'?languageRate72(type,path16().languages[cfg.language53]||0):0;
   // Не по возрасту joinClub19 ничего не делает — кнопка серая с причиной, а не с ценой.
   const age=clubWhy2733(type);if(age)return {...o,disabled:true,why:cap2733(age),hint:cap2733(age)};
   return {...o,hint:(o.hint?o.hint+' · ':'')+cfg.hours+' ч/нед. · '+money(c().cost*cfg.fee)+'/мес. · до +'+level2733(rate)+' уровня в месяц'};
  });
  return old(title,text,opts,...rest);};try{return fn();}finally{show=old;}};}

// ---------- обёртки ----------

if(study2733On){
 programDetails16=function(id,...rest){
  const p=prog16(id);
  if(!p)return study2733Base.programDetails16(id,...rest);
  const a=studyApp2733(p),retry=path16().retry[p.id]||0;
  if(!a&&!(s.clock.ticks<retry))return study2733Base.programDetails16(id,...rest);
  const old=show;let done=false;
  show=function(title,text,opts=[],...more){
   if(done)return old(title,text,opts,...more);
   done=true;
   let list=opts;try{list=programOpts2733(p,a,opts);}catch(e){console.error(e);}
   return old(title,text,list,...more);
  };
  try{return study2733Base.programDetails16(id,...rest);}finally{show=old;}
 };
 programBuild273=function(p,ctx){
  const card=study2733Base.programBuild273(p,ctx);
  try{programCard2733(card,p);}catch(e){console.error(e);}
  return card;
 };
 requestCard58=function(a,kind,...rest){
  const html=study2733Base.requestCard58(a,kind,...rest);
  if(kind!=='study'||!a)return html;
  try{return requestStudy2733(html,a);}catch(e){console.error(e);return html;}
 };
 openDecision24=function(kind,id,...rest){
  if(kind!=='study'||nextCard273)return study2733Base.openDecision24(kind,id,...rest);
  const a=path16().applications.find(a=>a.id===id),p=a&&prog16(a.program);
  if(!p||!decisionActive24({kind,id}))return study2733Base.openDecision24(kind,id,...rest);
  let fund=null;if(a.status==='accepted')fund=fundingCapture2733(id);
  const old=show;let done=false;
  nextCard273={kind:'study-offer',area:'Учёба',title:levels16[p.level]+' · '+programName26(p),h2:'sub',build:ctx=>offerBuild2733(a,p,ctx,fund)};
  show=function(title,text,opts=[],...more){
   if(done)return old(title,text,opts,...more);
   done=true;
   let list=opts;try{list=offerOpts2733(a,p,opts,fund);}catch(e){console.error(e);}
   return old(title,text,list,...more);
  };
  try{return study2733Base.openDecision24(kind,id,...rest);}finally{show=old;nextCard273=null;}
 };
 const mainWhyBase2733=mainWhy273;
 mainWhy273=function(card,...rest){
  const r=mainWhyBase2733(card,...rest);
  if(card?.whys)for(const b of document.querySelectorAll('#modal .main273 button')){
   const w=card.whys[optLabel273(b)];if(!b.disabled||!w)continue;
   let sm=b.querySelector('.why273');if(!sm){sm=document.createElement('small');sm.className='why273';b.append(sm);}
   sm.dataset.card273='1';sm.textContent=w;
  }
  return r;
 };
 // «Кто может оплачивать учёбу?»: у каждого родителя — шанс, доля и когда спросить снова.
 supportMenu17=function(id,...rest){
  const a=path16().applications.find(a=>a.id===id),p=a&&prog16(a.program);
  if(!p)return study2733Base.supportMenu17(id,...rest);
  const old=show,list=parents17();let done=false;
  show=function(title,text,opts=[],...more){
   if(done)return old(title,text,opts,...more);
   done=true;
   const out=opts.map((o,i)=>{const q=list[i];if(!q||o?.label!==q.name)return o;try{const h=supportOdds2733(a,p,q);return {...o,hint:(o.hint?o.hint+' · ':'')+h.text,disabled:!!(o.disabled||h.blocked),why:h.blocked?h.text:''};}catch(e){return o;}});
   return old(title,text,out,...more);
  };
  try{return study2733Base.supportMenu17(id,...rest);}finally{show=old;}
 };
 // «Запрос работодателю»: шанс, часы и когда ответ — на кнопке «Отправить запрос».
 sponsorProgram22=function(id,...rest){
  const p=prog16(id),old=show;let done=false;
  if(!p||typeof sponsorEligibility22!=='function')return study2733Base.sponsorProgram22(id,...rest);
  show=function(title,text,opts=[],...more){
   if(done)return old(title,text,opts,...more);
   done=true;
   let list=opts;try{const e=sponsorEligibility22(p);list=opts.map(o=>o?.label!=='Отправить запрос'?o:{...o,hint:e.why.length?'':'шанс '+pct273(e.probability)+' · оплата может быть частичной · 2 мес. по 1 ч/нед. · '+answerIn273(taskMonths273(2,1)),why:e.why[0]||''});}catch(e){console.error(e);}
   return old(title,text,list,...more);
  };
  try{return study2733Base.sponsorProgram22(id,...rest);}finally{show=old;}
 };
 // «Образование за счёт компании» → «Выбрать программу» вела в «Мою учёбу»; теперь — в каталог программ.
 sponsorMenu22=function(...args){
  const old=show;let done=false;
  show=function(title,text,opts=[],...more){
   if(done)return old(title,text,opts,...more);
   done=true;
   return old(title,text,opts.map(o=>o?.label==='Выбрать программу'?{...o,fn:()=>openPath16('admission58')}:o),...more);
  };
  try{return study2733Base.sponsorMenu22(...args);}finally{show=old;}
 };
 languageStayMenu53=function(lang,...rest){
  const old=show;let done=false;
  show=function(title,text,opts=[],...more){
   if(done)return old(title,text,opts,...more);
   done=true;
   let list=opts;
   // 273.3.1: без «игровой модели» во вступлении (правило «Текст»).
   text=String(text??'').replace(' Визовое решение — условная игровая модель, не правила реальных стран.',' Где нет права на учёбу, нужна виза: ответ — до 3 месяцев, иногда отказывают.');
   try{
    const prefix=lang&&lang16[lang]?lang16[lang]+' · ':'';
    list=opts.filter(o=>!prefix||!/ · /.test(o?.label||'')||String(o.label).startsWith(prefix)||o.hint).map(o=>{
     const c=Object.keys(countries).find(k=>o?.label===lang16[country16[k]?.[0]]+' · '+countries[k].name);
     return c?{...o,hint:stayPrice2733([c],false)+' · +0,28 уровня в месяц',fn:stayDuration2733(o.fn)}:o;
    });
   }catch(e){console.error(e);}
   return old(title,text,list,...more);
  };
  try{return study2733Base.languageStayMenu53(...rest);}finally{show=old;}
 };
 languageClubsMenu53=function(...args){
  const old=show;let done=false;
  show=function(title,text,opts=[],...more){
   if(done)return old(title,text,opts,...more);
   done=true;
   return old(title,text,opts.map(o=>o&&typeof o.fn==='function'?{...o,fn:clubFormats2733(o.fn)}:o),...more);
  };
  try{return study2733Base.languageClubsMenu53(...args);}finally{show=old;}
 };
 studyOverview58=function(...args){
  const html=study2733Base.studyOverview58(...args);
  try{return studyPanel2733(html);}catch(e){console.error(e);return html;}
 };
 languagesView16=function(...args){
  const html=study2733Base.languagesView16(...args);
  try{return languagesPanel2733(html);}catch(e){console.error(e);return html;}
 };
 // Поиск: «стипендия» находит заявки и стипендии (в ключевых словах было только «стипендии»).
 actionCatalog24=function(...args){
  return study2733Base.actionCatalog24(...args).map(a=>a.id==='applications'&&!/стипендия/.test(a.keywords||'')?{...a,keywords:(a.keywords||'')+' стипендия'}:a);
 };
}

// ---------- стили ----------

(function studyStyle2733(){
 if(!study2733On||typeof document==='undefined'||document.getElementById('study2733-style'))return;
 const st=document.createElement('style');
 st.id='study2733-style';
 st.textContent=[
  '.trajectory .top2733{border-left:3px solid var(--accent)}',
  '.trajectory .top2733 h2{margin:0 0 2px}',
  '.trajectory .sub2733{font-size:13px;line-height:1.45;color:var(--muted);margin:0}',
  '.trajectory dl.rows2733{margin:10px 0 0;border-top:1px solid var(--line)}',
  '.trajectory .rows2733>div{display:grid;grid-template-columns:78px minmax(0,1fr);gap:8px;padding:5px 0;border-bottom:1px solid var(--line)}',
  '.trajectory .rows2733 dt{font-size:12px;color:var(--muted);padding-top:2px}',
  '.trajectory .rows2733 dd{margin:0;font-size:14px;line-height:1.4;overflow-wrap:anywhere}',
  '.trajectory .rows2733 dd small{display:block;font-size:12px;line-height:1.35;color:var(--muted);margin-top:2px}',
  '.trajectory .main2733{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:12px}.trajectory .main2733:empty{display:none}',
  '.trajectory .main2733 button{display:block;width:100%;min-height:44px;margin:0;font-weight:500;text-align:center}',
  '.trajectory .main2733 button:first-child:not([disabled]){background:var(--ink);color:var(--paper);border-color:var(--ink)}',
  '.trajectory details.more2733{margin-top:14px;border-top:1px solid var(--line)}',
  '.trajectory details.more2733>summary{list-style:none;cursor:pointer;display:flex;align-items:center;gap:8px;min-height:44px;font-size:14px;font-weight:500}',
  '.trajectory details.more2733>summary::-webkit-details-marker{display:none}',
  '.trajectory details.more2733>summary small{font-weight:400;color:var(--muted);font-size:12px;margin-right:auto}',
  '.trajectory details.more2733>summary::after{content:"▸";margin-left:auto;color:var(--muted);transition:transform .15s}',
  '.trajectory details.more2733[open]>summary::after{transform:rotate(90deg)}',
  '.trajectory .need2733{border-left:3px solid #b57e3d;background:#fbf2e8}',
  '.trajectory .need2733 .eyebrow{color:#8a4b16}',
  '.trajectory .target2733{font-size:14px;font-weight:500;margin:4px 0 6px}',
  '.trajectory .language-lesson186 small,.trajectory .lang-more2733 button small,.trajectory .main2733 button small{display:block;font-size:11.5px;font-weight:400;line-height:1.35;opacity:.85}',
  '.trajectory .lang-more2733{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}',
  '.trajectory .lang-more2733 button{width:auto;margin:0;text-align:left}',
  // 273.3.1: тёмные главные кнопки 273.2 («Моя работа») держат свой цвет подсказки.
  '.trajectory .path-card button.small:not(.main2732) small{display:block;font-size:11.5px;line-height:1.35;color:var(--muted)}'
 ].join('\n');
 document.head.appendChild(st);
})();
