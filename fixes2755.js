'use strict';
// Сборка 275.5: мелкие баги из игры владелицы (scout/owner-requests-2511.md: разбор п. 27, п. 30, п. 35).
//
// 1. Прокрутка окна. Действие внутри окна закрывает его (choose → closeModal) и рисует то же окно заново: закрытый
//    <dialog> теряет прокрутку, длинное окно прыгало наверх. А новое окно, нарисованное поверх прокрученного без
//    закрытия, наоборот, наследовало чужую прокрутку (заголовок уходил под полоску «×»). Теперь в пределах одного
//    открытия окна прокрутка запоминается по заголовку (цифры в заголовке не важны): то же окно после действия и
//    «Назад» к прежнему окну — на прежнем месте, другое окно — сверху. Закрыли окно — память сброшена.
// 2. «Запросить разрешение» / «Подать на разрешение» (relocation68: applyPermit16 молча возвращает false) — серая
//    кнопка с причиной и датой: запрет после принудительного выезда, заявка уже подана, срок повторной заявки, не
//    хватает на сбор, основание больше не действует; при вызове в обход кнопки — сообщение с той же причиной.
// 3. «Будни» убраны (решение владелицы): рутина по-прежнему не идёт в «Историю» (feed267), но и строки раз в три
//    месяца больше нет. Уже записанные строки «Будни» в старых сохранениях остаются в «Истории» как были. Фильм
//    киноклуба виден в карточке клуба («Последний показ», «До этого»); там же раньше стояло «Новую пьесу начнут читать
//    в этом месяце» — карточка киноклуба считала его театральной студией (feed2722 seasonLines2722).
// 4. Приглашение на свидание называет вид: «Оскар Маккарти зовёт в кино». Вид выбирается при приглашении из восьми
//    видов свиданий (meetingKinds53 + social255: ресторан, прогулка, кино, выставка, пикник, концерт, настольная игра,
//    готовить вместе) — по сезону, деньгам, профессии и планам человека; у подростков — из подростковых встреч
//    (romance54, social68). В окне — часы и ваша часть расходов, «Предложить другое» — другой вид. Кино — через
//    афишу. Приглашение от человека не может «не принять» он сам: согласие ставит встречу без броска кубика
//    (раньше romance18 → planMeeting53 бросал кубик и мог написать «не принимает приглашение»). Старые приглашения
//    без вида — прогулка, как раньше.
// 5. Инициатива партнёра «подготовиться к родительству» и разговор «А ты вообще хочешь детей?» — только если вы
//    живёте в одном городе (у «съехаться» и свидания проверка уже была). Разговор, пока вы врозь, откладывается и
//    вернётся, когда вы снова будете рядом.
// 6. Подростковая пара: «Обсудить расставание» снова в окне встреч (social68 переписал окно romance54 и потерял эту
//    кнопку — расстаться подростку было нельзя совсем, ни рядом, ни после переезда). На расстоянии — по видеосвязи
//    или в переписке. Пара подростков, которые живут в разных городах, со временем расходится сама: через три месяца
//    врозь — запись «Всё реже на связи», дальше с каждым месяцем шанс, что отношения сойдут на нет, растёт.
// 7. Новоселье: хозяин, с которым вы живёте (родитель, у которого вы живёте, сосед по квартире), не зовёт вас на своё
//    новоселье — это ваш общий дом. Уже пришедшее такое приглашение закрывается. Второй родитель, который после
//    развода или с вашего рождения живёт отдельно (пусть и в том же городе), зовёт на своё новоселье, как раньше.
// В сохранении новое только необязательное: date2755 у приглашения (вид свидания), apart2755 и fadeNote2755 у
// подростка-партнёра. Деньги и часы — те же функции игры: свидание стоит как то же свидание из меню.

// Обёртка ставится, только если файл с исходной функцией подключён (страница сохранения 272 без feed2722.js и т. п.).
const fixes2755Base=Object.fromEntries(['show','closeModal','backModal38','applyPermit16','relocationCard68','flushWeekdays267',
 'seasonLines2722','initiativeWhy68','initiativeMenu68','respondInitiative68','offerInitiative68','decisionItems24','resolvePending',
 'queueOnce','log','teenDateMenu54','autonomousMonth','offerOccasion54','occasionAvailable54','invitationAvailable53']
 .map(k=>[k,typeof window[k]==='function'?window[k]:null]));

// ---------- мелочи ----------
function inMonth2755(tick){return typeof inMonth273==='function'?inMonth273(tick):'в '+String(dateLabel86(tick)).toLowerCase();}
function sinceMonth2755(tick){return typeof sinceMonth273==='function'?sinceMonth273(tick):'с '+String(dateLabel86(tick)).toLowerCase();}
function apart2755(p){return !!p&&(p.country!==s.country||!!p.city18&&p.city18!==residenceCity());}
(()=>{
 if(typeof document==='undefined'||!document.head)return;
 const st=document.createElement('style');
 st.textContent='.path-card small.why2755{display:block;margin:0 0 8px;font-size:12px;line-height:1.45;color:var(--muted)}';
 document.head.appendChild(st);
})();

// ---------- 1. Прокрутка окна ----------
const scroll2755={map:new Map(),seq:0};
function winKey2755(){const h=document.getElementById('modal')?.querySelector?.('h2');return h?String(h.textContent||'').replace(/\d+/g,'#').replace(/\s+/g,' ').trim():'';}
function scrollNote2755(){const d=document.getElementById('modal');if(!d?.open)return;const k=winKey2755();if(k)scroll2755.map.set(k,d.scrollTop||0);}
// После всей цепочки show() и раскладки windows273 (она перекладывает окно сразу и ещё раз в микрозадаче).
function scrollApply2755(){
 const seq=++scroll2755.seq;
 queueMicrotask(()=>queueMicrotask(()=>{
  if(seq!==scroll2755.seq)return;
  try{const d=document.getElementById('modal');if(!d?.open)return;const k=winKey2755();d.scrollTop=k&&scroll2755.map.has(k)?scroll2755.map.get(k):0;}catch(e){console.error(e);}
 }));
}
(()=>{
 const d=typeof document!=='undefined'&&document.getElementById('modal');if(!d?.addEventListener)return;
 d.addEventListener('scroll',scrollNote2755,{passive:true});
 // Окно закрыли насовсем (а не перерисовали после действия) — память прокрутки сброшена.
 d.addEventListener('close',()=>setTimeout(()=>{if(!d.open)scroll2755.map.clear();},0));
})();
if(fixes2755Base.show)show=function(...args){
 try{scrollNote2755();}catch(e){}
 const r=fixes2755Base.show.apply(this,args);
 scrollApply2755();
 return r;
};
if(fixes2755Base.closeModal)closeModal=function(...args){try{scrollNote2755();}catch(e){}return fixes2755Base.closeModal.apply(this,args);};
if(fixes2755Base.backModal38)backModal38=function(...args){try{scrollNote2755();}catch(e){}const r=fixes2755Base.backModal38.apply(this,args);scrollApply2755();return r;};

// ---------- 2. Причина у «Запросить разрешение» ----------
// Те же проверки и в том же порядке, что в applyPermit16 (relocation68.js): возраст, основание, разрешение уже есть,
// запрет после принудительного выезда (migration30 reentry30), заявка на рассмотрении, срок повторной заявки, сбор
// c().cost × 0,004 (за учёбу и переезд к родителю его может оплатить родитель).
function permitFee2755(){return c().cost*.004;}
function permitWhy2755(kind,id,country){
 if(!s||s.dead||!countries[country])return '';
 const x=path16(),key='permit-'+kind+'-'+country;
 if(s.age<(kind==='study'?17:18))return 'Заявку можно подать с '+(kind==='study'?17:18)+' лет';
 if(typeof permitCovered128==='function'&&permitCovered128(kind,country))return '';
 if(!permitSource16(kind,id,country))return 'Основание для заявки больше не действует';
 const ban=migration30().reentry30?.[country]||0;
 if(s.clock.ticks<ban&&!citizenRight31(country))return 'Новая заявка — '+sinceMonth2755(ban)+': до этого действует запрет после принудительного выезда';
 const app=(x.permitApplications||[]).find(a=>a.country===country&&a.status==='submitted');
 if(app){
  const t=s.clock.tasks.find(t=>t.kind==='pathPermit'&&t.application===app.id&&!['completed','cancelled'].includes(t.state));
  const end=t?(Number.isFinite(t.calendarStart68)?t.calendarStart68:s.clock.ticks-Math.floor(t.progress||0))+(t.duration||3):(app.started68??s.clock.ticks)+3;
  return 'Заявка уже подана · ответ '+inMonth2755(Math.max(end,s.clock.ticks));
 }
 if(s.clock.ticks<(x.retry?.[key]||0))return 'Повторная заявка — '+sinceMonth2755(x.retry[key]);
 const fee=permitFee2755(),a=kind==='study'&&x.applications.find(a=>a.id===id),parent=living(a?.funding17?.parentId)||parents17().find(p=>p.id===id);
 if(!(parent&&parentAvailable17(parent)>=fee)&&expenseAvailable231()<fee)return 'На оформление нужно '+money(fee)+' — доступно '+money(Math.max(0,expenseAvailable231()));
 return '';
}
if(fixes2755Base.applyPermit16)applyPermit16=function(kind,id,country,...rest){
 let why='';try{why=permitWhy2755(kind,id,country);}catch(e){console.error(e);}
 if(why){toast(why+'.');return false;}
 return fixes2755Base.applyPermit16.call(this,kind,id,country,...rest);
};
if(fixes2755Base.relocationCard68)relocationCard68=function(r,...rest){
 const html=fixes2755Base.relocationCard68.call(this,r,...rest);
 try{
  const why=r&&permitWhy2755(r.kind,r.id,r.country);
  if(!why)return html;
  return html.replace(/<button class="small"\s*(?:disabled\s*)?onclick="([^"]*applyPermit16[^"]*)">(Запросить разрешение|Подать на разрешение)<\/button>/,
   (m,code,label)=>'<button class="small" disabled onclick="'+code+'">'+label+'</button><small class="why2755">'+esc(why)+'</small>');
 }catch(e){console.error(e);return html;}
};

// ---------- 3. Без «Будни»; фильм киноклуба — в карточке клуба ----------
// Рутина по-прежнему считается в feed267().week (и не попадает в «Историю»), раз в три месяца счётчики просто
// обнуляются — строки больше нет.
if(fixes2755Base.flushWeekdays267)flushWeekdays267=function(){feed267().week={};};
function filmLines2755(m){
 const list=(m.films269||[]).slice(-4).reverse().map(id=>filmById269(id)).filter(Boolean);
 if(!list.length)return ['Первый фильм покажут на ближайшей встрече клуба.'];
 const [last,...prev]=list;
 return ['Последний показ'+(Number.isFinite(m.filmTick269)?' — '+inMonth2755(m.filmTick269):'')+': '+filmLabel269(last)+', реж. '+last.director+'.',
  ...(prev.length?['До этого: '+prev.map(f=>'«'+f.title+'»').join(', ')+'.']:[])];
}
if(fixes2755Base.seasonLines2722)seasonLines2722=function(m,...rest){
 try{if(typeof filmClub269==='function'&&filmClub269(m))return filmLines2755(m);}catch(e){console.error(e);}
 return fixes2755Base.seasonLines2722.call(this,m,...rest);
};

// ---------- 4. Вид свидания в приглашении ----------
const dateKinds2755=['restaurant','dateWalk','dateCinema255','dateMuseum255','datePicnic255','dateConcert255','dateBoard255','dateCook255'];
const datePhrase2755={restaurant:'в ресторан',dateWalk:'на прогулку',dateCinema255:'в кино',dateMuseum255:'на выставку',
 datePicnic255:'на пикник',dateConcert255:'на концерт',dateBoard255:'сыграть в настольную игру',dateCook255:'приготовить ужин вместе'};
// Подростки: встречи из окна romance54 / social68 (без собаки, записок и плейлистов — на них не «зовут»).
const teenKinds2755=['walk','cinema','picnic','fair','photo','school','cooking'];
const teenPhrase2755={walk:'погулять',cinema:'в кино',picnic:'на пикник',fair:'на ярмарку',photo:'на фотопрогулку',school:'на школьный вечер',cooking:'испечь печенье вместе'};
function teenDate2755(p){return s.age<18||p.age<18;}
function warm2755(){
 const m=s.clock.month;
 if(['th','in','id','eg','mx'].includes(s.country))return true;
 return ['au','za','br'].includes(s.country)?(m>=9||m<=2):(m>=3&&m<=8);
}
function kindCost2755(k,teen){
 if(teen)return k==='cinema'?.0003:k==='walk'?0:(teenDates68[k]?.[1]||0);
 return meetingKinds53[k]?.fee||0;
}
function kindName2755(k,teen){return teen?({walk:'Прогулка',cinema:'Кино'})[k]||teenDates68[k]?.[0]||k:meetingKinds53[k]?.name||k;}
function kindLabel2755(k,teen){return teen?({walk:'Позвать погулять',cinema:'Сходить в кино'})[k]||teenDates68[k]?.[0]||k:meetingKinds53[k]?.name||k;}
function kindPhrase2755(k,teen){return (teen?teenPhrase2755:datePhrase2755)[k]||(teen?'погулять':'на прогулку');}
function kindHours2755(k,teen){return teen?2:meetingKinds53[k]?.hours||2;}
function kindWhy2755(p,k,teen){
 if(!p?.alive)return 'Недоступно';
 if(teen){
  const why=typeof teenWhy68==='function'?teenWhy68(p,k):'';
  if(why)return why;
  return expenseAvailable231()<c().cost*kindCost2755(k,true)?'Не хватает средств':'';
 }
 return (meetingWhy53(p,k)||[]).join('; ');
}
function kindShort2755(k,teen){const fee=kindCost2755(k,teen);return kindHours2755(k,teen)+' ч/нед. · '+(fee?money(c().cost*fee):'без расходов');}
// Вес вида: обычные встречи чаще, профессия и планы человека подсказывают своё, пикник — только в тёплые месяцы,
// дорогое при пустом кошельке — реже. Виды, на которые сейчас нельзя (деньги, одна встреча за раз), не выпадают.
function pickDate2755(p){
 const teen=teenDate2755(p),kinds=(teen?teenKinds2755:dateKinds2755).filter(k=>(!/icnic/.test(k)||warm2755())&&!kindWhy2755(p,k,teen));
 if(!kinds.length)return teen?'walk':'dateWalk';
 const occ=String(p.occupation||'')+' '+String(p.bio27?.job?.title||''),funds=Math.max(0,expenseAvailable231());
 const base={restaurant:2,dateWalk:3,dateCinema255:3,dateMuseum255:1.5,datePicnic255:2,dateConcert255:1.5,dateBoard255:1.5,dateCook255:1.5,
  walk:3,cinema:3,picnic:2,fair:1.5,photo:1.5,school:1.5,cooking:1.5};
 const w=kinds.map(k=>{
  let x=base[k]||1;
  if(/Concert/.test(k)&&/музык|певиц|певец|вокал|звукорежисс|диджей|композит|концерт/i.test(occ))x*=3;
  if((/Museum/.test(k)||k==='photo')&&/худож|дизайн|куратор|фотограф|реставрат|архитект|иллюстр|галере|музе/i.test(occ))x*=3;
  if((/Cook/.test(k)||k==='cooking')&&/повар|кондитер|пекар|шеф/i.test(occ))x*=3;
  if(/inema/.test(k)&&/актёр|актер|актрис|режисс|сценар|оператор|кино/i.test(occ))x*=2;
  if(/Board/.test(k)&&/программ|разработ|аналит|инженер|математ|игр/i.test(occ))x*=2;
  if(p.want==='travel'&&/Walk|Picnic|^walk|^picnic/.test(k))x*=1.5;
  if(p.want==='roots'&&/Cook|cooking/.test(k))x*=1.5;
  if(p.want==='career'&&k==='restaurant')x*=1.5;
  if(p.cohabit&&/Cook|Board/.test(k))x*=1.5;
  if(c().cost*kindCost2755(k,teen)>funds*.15)x*=.3;
  return x;
 });
 let r=Math.random()*w.reduce((a,b)=>a+b,0);
 for(let i=0;i<kinds.length;i++){r-=w[i];if(r<0)return kinds[i];}
 return kinds[kinds.length-1];
}
function dateKindOf2755(p,q){const teen=teenDate2755(p),k=q?.date2755;return (teen?teenKinds2755:dateKinds2755).includes(k)?k:teen?'walk':'dateWalk';}
function dateTitle2755(p,q){return p.name+' зовёт '+kindPhrase2755(dateKindOf2755(p,q),teenDate2755(p));}
function dateLine2755(p,k){
 const teen=teenDate2755(p),fee=kindCost2755(k,teen);
 return kindName2755(k,teen)+': '+kindHours2755(k,teen)+' ч/нед. на месяц, '+(fee?'ваша часть — '+money(c().cost*fee):'без расходов')+'.';
}
// Встреча по приглашению: человек сам позвал — согласие ставит встречу в расписание без броска кубика
// (как respondInitiative68 для прогулки). Деньги и часы — как у того же свидания из меню.
function planDate2755(p,k){
 const teen=teenDate2755(p),why=kindWhy2755(p,k,teen);
 if(why){toast(why+'.');return false;}
 if(teen)return !!planTeenDate54(p.id,k);
 const cfg=meetingKinds53[k];
 p.meetingAfter53=s.clock.ticks+2;
 task16('meeting53',cfg.name+' · '+p.name,1,{person53:p.id,meeting53:k,home53:s.country,city53:residenceCity(),partner53:currentPartner()?.id===p.id,startCostRatio:cfg.fee},cfg.hours);
 return true;
}
// Кино — через афишу (films269: фильм цепляется к встрече через window.__filmChoice269 и task16).
function withFilm2755(k,title,run){
 if(!['dateCinema255','cinema'].includes(k)||typeof filmPicker269!=='function')return run();
 return filmPicker269({title},f=>{window.__filmChoice269=f?.id||null;try{run();}finally{window.__filmChoice269=null;}});
}
// «Предложить другое»: остальные виды с часами и ценой. Подпись варианта — как в меню встреч, поэтому «Свидание в
// кино» / «Сходить в кино» сами открывают афишу (films269 ловит их по точной подписи).
function otherDates2755(p,current,done){
 const teen=teenDate2755(p);
 show('Предложить другое · '+p.name,p.name+' зовёт '+kindPhrase2755(current,teen)+'. Можно предложить другую встречу.',
  (teen?teenKinds2755:dateKinds2755).filter(k=>k!==current&&(!/icnic/.test(k)||warm2755())).map(k=>{const why=kindWhy2755(p,k,teen);
   return {label:kindLabel2755(k,teen),hint:why||kindShort2755(k,teen),disabled:!!why,fn:()=>done(k)};}));
}
// Путь 1: инициатива близкого (social68, вид 'date').
if(fixes2755Base.offerInitiative68)offerInitiative68=function(p,kind,...rest){
 if(kind!=='date'||!p||initiativeWhy68(p,kind))return fixes2755Base.offerInitiative68.call(this,p,kind,...rest);
 const k=pickDate2755(p),old=initiativeNames68.date;
 initiativeNames68.date='зовёт '+kindPhrase2755(k,teenDate2755(p));
 let q;
 try{q=fixes2755Base.offerInitiative68.call(this,p,kind,...rest);}finally{initiativeNames68.date=old;}
 if(q)q.date2755=k;
 return q;
};
if(fixes2755Base.respondInitiative68)respondInitiative68=function(id,accept,...rest){
 const q=initiatives68().offers.find(q=>q.id===id),p=q&&living(q.person);
 if(!accept||q?.kind!=='date'||!p)return fixes2755Base.respondInitiative68.call(this,id,accept,...rest);
 if(!initiativeValid68(q))return false;
 if(!planDate2755(p,dateKindOf2755(p,q)))return false;
 q.status='accepted';
 save();render();return true;
};
if(fixes2755Base.initiativeMenu68)initiativeMenu68=function(id,...rest){
 const q=initiatives68().offers.find(q=>q.id===id),p=q&&living(q.person);
 if(!p||q.kind!=='date')return fixes2755Base.initiativeMenu68.call(this,id,...rest);
 const teen=teenDate2755(p),k=dateKindOf2755(p,q),valid=initiativeValid68(q),why=valid?kindWhy2755(p,k,teen):'';
 show(dateTitle2755(p,q),dateLine2755(p,k)+'\nРешение принимаете вы. Согласие на одну встречу не означает согласия на остальное.',[
  {label:'Согласиться',hint:why||kindShort2755(k,teen),disabled:!valid||!!why,fn:()=>withFilm2755(k,kindLabel2755(k,teen),()=>respondInitiative68(id,true))},
  {label:'Предложить другое',hint:'Другая встреча вместо этой',disabled:!valid,fn:()=>otherDates2755(p,k,x=>{q.date2755=x;return respondInitiative68(id,true);})},
  {label:'Не сейчас',disabled:!valid,fn:()=>respondInitiative68(id,false)},
  {label:'Открыть карточку',fn:()=>personDetail(p.id)}
 ]);
};
if(fixes2755Base.decisionItems24)decisionItems24=function(...args){
 const list=fixes2755Base.decisionItems24.apply(this,args);
 try{
  return list.map(it=>{
   if(it?.ref?.kind!=='initiative68')return it;
   const q=it.q||initiatives68().offers.find(x=>x.id===it.ref.id),p=q&&living(q.person);
   return q?.kind==='date'&&p?{...it,title:dateTitle2755(p,q)}:it;
  });
 }catch(e){console.error(e);return list;}
};
// Путь 2: приглашение в очереди окон (social255 / clock.js → queueOnce({type:'romance'}) → romance18 resolvePending).
let dateNote2755=null;
if(fixes2755Base.queueOnce)queueOnce=function(event,...rest){
 try{
  if(event?.type==='romance'&&!event.date2755){
   const p=living(event.id);
   if(p&&s.age>=18&&p.age>=18){event.date2755=pickDate2755(p);dateNote2755={text:p.name+' предлагает встретиться.',line:p.name+' зовёт '+kindPhrase2755(event.date2755,false)+'.'};}
  }
 }catch(e){console.error(e);}
 return fixes2755Base.queueOnce.call(this,event,...rest);
};
if(fixes2755Base.log)log=function(title,text,...rest){
 if(dateNote2755&&title==='Приглашение на свидание'&&text===dateNote2755.text){text=dateNote2755.line;dateNote2755=null;}
 return fixes2755Base.log.call(this,title,text,...rest);
};
function romanceWindow2755(q,p,opts){
 const k=dateKindOf2755(p,q),why=kindWhy2755(p,k,false),friendly=(opts||[]).find(o=>o?.label==='Оставить общение дружеским');
 const take=()=>{const i=s.pending.indexOf(q);if(i>=0)s.pending.splice(i,1);};
 return {title:dateTitle2755(p,q),text:dateLine2755(p,k)+'\nСогласие означает только встречу, а не начало отношений.',opts:[
  {label:'Запланировать встречу',hint:why||kindShort2755(k,false),disabled:!!why,fn:()=>withFilm2755(k,kindLabel2755(k,false),()=>{if(planDate2755(p,k))take();save();})},
  {label:'Предложить другое',hint:'Другое свидание вместо этого',fn:()=>otherDates2755(p,k,x=>{if(planDate2755(p,x))take();save();})},
  ...(friendly?[friendly]:[])
 ]};
}

// ---------- 5. Дети — только в одном городе ----------
if(fixes2755Base.initiativeWhy68)initiativeWhy68=function(p,kind,...rest){
 const why=fixes2755Base.initiativeWhy68.call(this,p,kind,...rest);
 if(why||kind!=='children')return why;
 return coupleLocal54(p)?'':'Вы живёте в разных городах';
};

// Очередь окон: свидание (п. 4) и разговор о детях (п. 5).
if(fixes2755Base.resolvePending)resolvePending=function(...args){
 const q=s?.pending?.[0];
 if(q?.type==='npcChildren'){
  const p=living(q.id);
  if(p&&currentPartner()?.id===p.id&&!coupleLocal54(p)){
   // Пока вы врозь, разговор откладывается: chapter.js задаст его снова в годовом цикле, когда вы будете рядом
   // (запись в журнале событий engine05 снимаем — разговор не был показан, повтор не должен ждать 48 месяцев).
   s.pending.shift();if(p.sceneFlags)p.sceneFlags.childTalk=false;
   if(q.ledgerKey05&&s.eventLedger05?.[q.ledgerKey05])delete s.eventLedger05[q.ledgerKey05];
   save();
   return resolvePending(...args);
  }
 }
 if(q?.type!=='romance')return fixes2755Base.resolvePending.apply(this,args);
 const p=living(q.id);
 if(!p)return fixes2755Base.resolvePending.apply(this,args);
 const original=show,title=p.name+' приглашает на свидание';
 show=function(t,text,opts,...rest){
  if(t===title){
   show=original;
   try{const v=romanceWindow2755(q,p,opts);return original.call(this,v.title,v.text,v.opts,...rest);}catch(e){console.error(e);}
  }
  return original.call(this,t,text,opts,...rest);
 };
 try{return fixes2755Base.resolvePending.apply(this,args);}finally{if(show!==original)show=original;}
};

// ---------- 6. Подростковая пара: расставание, в том числе на расстоянии ----------
function endTeen2755(p,distance){
 p.role='Бывший партнер';p.cohabit=false;p.bond=clamp((p.bond||0)-20);s.mood=clamp(s.mood-8);
 delete p.apart2755;delete p.fadeNote2755;
 remember(p,distance?'расстались на расстоянии':'расстались');
 log('Вы расстались',distance?'Вы и '+p.name+' решаете больше не встречаться: на расстоянии отношения не держатся. Общие воспоминания остаются.':
  'Вы и '+p.name+' решаете больше не встречаться. Разговор трудный, но честный. Общие воспоминания остаются.','Расставание',true);
}
function teenBreakup2755(id){
 const p=living(id);if(!p||currentPartner()?.id!==id||s.dead)return;
 const away=apart2755(p);
 show('Расстаться · '+p.name+'?',away?'Вы живёте далеко друг от друга, поэтому сказать это можно только по видеосвязи или в переписке. Общие воспоминания останутся.':
  'Разговор будет трудным. Общие воспоминания останутся.',[
  {label:'Расстаться',hint:'настроение −8',fn:()=>act(()=>{if(currentPartner()?.id===id)endTeen2755(p,away);})},
  {label:'Пока не говорить',fn:()=>teenDateMenu54(id)}
 ]);
}
if(fixes2755Base.teenDateMenu54)teenDateMenu54=function(id,...rest){
 const p=typeof teenPerson54==='function'&&teenPerson54(id);
 if(!p||s.dead||currentPartner()?.id!==id)return fixes2755Base.teenDateMenu54.call(this,id,...rest);
 const original=show,away=apart2755(p);
 show=function(title,text,opts,...r){
  show=original;
  if(Array.isArray(opts)){
   if(away)text=String(text||'')+'\nВы живёте далеко друг от друга: '+p.name+' — '+personCity62(p)+' · '+countries[p.country].name+'. Встретиться пока нельзя, поговорить — можно.';
   opts=[...opts,{label:'Обсудить расставание',hint:away?'По видеосвязи или в переписке':'Трудный разговор',fn:()=>teenBreakup2755(id)}];
  }
  return original.call(this,title,text,opts,...r);
 };
 try{return fixes2755Base.teenDateMenu54.call(this,id,...rest);}finally{if(show!==original)show=original;}
};
// Подростковые отношения на расстоянии угасают сами: три месяца врозь — «Всё реже на связи», с четвёртого месяца
// шанс, что пара разойдётся, растёт на 8% в месяц (до 60%). Встретились в одном городе — счёт заново.
let teenTick2755='';
function teenDistance2755(){
 const p=currentPartner(),tick=s.saveId+':'+s.clock.ticks;
 if(!p?.alive||s.dead||!(s.age<18||p.age<18)||teenTick2755===tick)return;
 teenTick2755=tick;
 if(!apart2755(p)){if(p.apart2755!=null){delete p.apart2755;delete p.fadeNote2755;}return;}
 p.apart2755??=s.clock.ticks;
 const months=s.clock.ticks-p.apart2755;
 if(months>=3&&!p.fadeNote2755){
  p.fadeNote2755=true;rel(p,{affection:-3});
  log('Всё реже на связи',p.name+': сообщения всё короче, созвоны переносятся. На расстоянии отношения держатся с трудом.','Отношения');
  return;
 }
 const risk=months<4?0:Math.min(.6,.08*(months-3));
 if(risk&&chance(risk)){
  p.role='Бывший партнер';p.cohabit=false;p.bond=clamp((p.bond||0)-10);s.mood=clamp(s.mood-3);
  delete p.apart2755;delete p.fadeNote2755;
  remember(p,'отношения на расстоянии сошли на нет');
  log('Отношения сошли на нет',p.name+': вы всё реже писали друг другу и однажды поняли, что больше не пара. Общие воспоминания остаются.','Расставание',true);
 }
}
if(fixes2755Base.autonomousMonth)autonomousMonth=function(...args){
 const out=fixes2755Base.autonomousMonth.apply(this,args);
 try{if(s&&!s.dead)teenDistance2755();}catch(e){console.error(e);}
 return out;
};

// ---------- 7. Новоселье того, с кем вы живёте ----------
// householdMembers59 (homecare59) в режиме «у родителей» считает домочадцами всех живых Мать/Отец в городе, а после
// развода (family27 separateParents132) или у единственного родителя с рождения (family17 singleParentStart131)
// второй родитель живёт отдельно — его новоселье как раз уместно. Поэтому родитель — домочадец, только если это тот,
// у кого вы живёте, или он вместе с ним (союз родителей «together» в family27).
function livesWith2755(p){
 if(!p||!s.housing)return false;
 const h=s.housing,f=s.family17;
 if(h.occupant===p.id)return true;
 if(currentPartner()?.id===p.id&&p.cohabit)return true;
 if(h.mode!=='parents'||!['Мать','Отец'].includes(p.role))return false;
 if(typeof householdMembers59!=='function'||!householdMembers59().some(q=>q.id===p.id))return false;
 if(p.id===f?.separation132?.otherParentId||p.id===f?.childhood131?.otherParentId)return false;
 const host=living(h.occupant)||living(f?.household?.parentId);
 if(!host||host.id===p.id)return true;
 return (s.family27?.unions||[]).some(u=>u.status==='together'&&[u.a,u.b].includes(p.id)&&[u.a,u.b].includes(host.id));
}
if(fixes2755Base.offerOccasion54)offerOccasion54=function(host=null,kind=null,paid=null,deceased=null,...rest){
 try{
  const z=events54();
  if(!deceased&&kind!=='funeral'&&!(s.dead||s.age<15||s.clock.ticks-z.lastOffer<4||z.invitations.some(q=>q.status==='offered'))){
   const h=host??occasionHosts54().find(p=>s.clock.ticks-(z.hosts[p.id]??-100)>=12);
   if(h&&livesWith2755(h)){
    if(kind==='housewarming')return null;
    if(kind==null){
     // Тот же выбор вида, что в offerOccasion54 (events54.js), без новоселья.
     const premier=['arts','media'].includes(profession16(h.bio27?.job?.profession)?.field)||/актёр|актер|режисс|театр|музык|писател|худож/i.test(h.occupation||'');
     kind=pick(['birthday',...(weddingEligible132(h)?['wedding']:[]),...(premier?['premiere']:[])]);host=h;
    }
   }
  }
 }catch(e){console.error(e);}
 return fixes2755Base.offerOccasion54.call(this,host,kind,paid,deceased,...rest);
};
if(fixes2755Base.occasionAvailable54)occasionAvailable54=function(q,...rest){
 if(q?.kind==='housewarming'&&livesWith2755(living(q.host)))return false;
 return fixes2755Base.occasionAvailable54.call(this,q,...rest);
};
if(fixes2755Base.invitationAvailable53)invitationAvailable53=function(q,...rest){
 if(q?.occasion54){const o=events54().invitations.find(x=>x.id===q.occasion54);if(o?.kind==='housewarming'&&livesWith2755(living(o.host)))return false;}
 return fixes2755Base.invitationAvailable53.call(this,q,...rest);
};
