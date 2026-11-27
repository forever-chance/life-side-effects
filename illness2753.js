'use strict';
// Сборка 275.3: болезни и поездки.
// Было: любая болезнь из «Самочувствия» и любая травма закрывали поездки целиком, на весь срок — и ветрянка, и нарушение
// сна, и сезонный насморк (journeys57: healthJourneyWhy57). Запланированная поездка стояла месяцами, а «Перенести дату
// поездки» была серой. Языковую программу при этом принимали даже с пневмонией.
// Стало — правило по каждому состоянию (illRules2753):
// • нельзя: ветрянка, пока заразна (весь срок); пневмония — весь срок; свежий перелом — первые 2 месяца; кишечная
//   инфекция и отит — первый месяц; травма — пока не организована первая помощь;
// • можно, но отдых меньше: простуда, растяжение, нарушение сна, боль в спине, мигрень, артроз, перелом после двух
//   месяцев, травма после первой помощи — отдых и настроение от поездки вдвое меньше, настроения не меньше +1;
//   сезонный ринит — почти без цены (отдых на 1 меньше);
// • хронические обострения — только пометка, как и раньше без запрета.
// Правило смотрит на месяц отъезда, а не на сегодня: поездку можно спланировать на месяц после выздоровления.
// Дети: больной ребёнок в поездке не пускает, только пока помощь не организована или если ему «заметно хуже»; с 14 лет
// при лёгкой болезни ни «вы ухаживаете», ни присмотр дома отъезду не мешают; младше 14 — как раньше, через присмотр.
// Тексты детских причин прежние (их ищут по тексту trips272 и проверки).
// Тот же запрет — для приглашений, командировок (в том числе в окне предложения) и языковой программы за границей
// (отъезд на неё ждёт выздоровления, в списке программ — «Ждёт выздоровления»).
// Отложенная из-за болезни поездка: «Поездка ждёт выздоровления», «Перенести дату поездки» доступна и предлагает
// месяцы после выздоровления; «Выбрать месяц и год» тоже снимает отсрочку. Если болезнь держит только месяц отъезда —
// «Поездка сдвинулась на месяц», без отсрочки. Отсрочка снимается в начале месяца перед отъездом («Поездка снова по
// плану»), причина в «Ожидают ответа» и в «Подробнее» — как сейчас (после лечения срок короче).
// Командировка: пометки без обещаний про отдых, при переносе — ни слова про деньги и отпуск.
// Ребёнок до 12 лет, семейная поездка (notices270): с ветрянкой «Поехать с …» серая, с лёгкой болезнью — настроения меньше.
// Итог поездки (travel52: travelEndMonth52, точечная правка /* 275.3 */) говорит, что отдых был меньше и почему.
// Сроки болезней и лечение не меняются (иначе нужен новый прогон смертности): только то, когда можно ехать.
// В сохранении новое: t.ill2753 (чем болели при отъезде), t.hold57.health2753 (отсрочка из-за болезни),
// t.hold57.sick2753 (в причинах отсрочки есть болезнь — своя или ребёнка), у языковой программы — hold2753. В старых
// сохранениях их нет: такие поездки считаются поездками здоровым, их отсрочку снимает family270, как раньше.

// Файлы сборок 270–273 проверки с BASE=1 убирают по одному: без такого файла его обёртка здесь просто не ставится.
const have2753=f=>typeof f==='function'?f:null;
const illness2753Base={healthJourneyWhy57,holdJourney57,travelBeginMonth52,travelTripMenu52,returnTravel86,decisionItems24,
 languageStayWhy53,languageStayMonth53,languageStayMenu53,businessOfferMenu54,familyBeginMonth54,autonomousMonth,
 tripFix272:have2753(typeof tripFix272==='undefined'?null:tripFix272),
 tripInsertReady272:have2753(typeof tripInsertReady272==='undefined'?null:tripInsertReady272),
 tripCard273:have2753(typeof tripCard273==='undefined'?null:tripCard273),
 rescheduleWhy273:have2753(typeof rescheduleWhy273==='undefined'?null:rescheduleWhy273),
 familyCareKids270:have2753(typeof familyCareKids270==='undefined'?null:familyCareKids270)};

// ---------- правило по состояниям ----------

// block: 'all' — весь срок; число — первые N месяцев после начала. why(n) — причина в «Чтобы поехать, не хватает»
// (n — через сколько месяцев от сегодня можно уехать). cost: 'half' — отдых и настроение вдвое меньше, 'light' — почти
// без цены. note — пометка в окне поездки, work — та же пометка у командировки (отдыха она не даёт, обещать «отдохнёте
// меньше» там нечего; без work пометка общая), trip и without — для записи об итоге поездки.
const illRules2753={
 'Ветряная оспа':{block:'all',why:n=>'Ветряная оспа заразна: в дорогу — через '+n+' мес.'},
 'Пневмония':{block:'all',why:n=>'С пневмонией в дорогу рано: ещё '+n+' мес.'},
 'Перелом':{block:2,why:n=>'Перелом ещё свежий: в дорогу — через '+n+' мес.',cost:'half',
  note:'Перелом ещё заживает: гулять много не получится',work:'Перелом ещё заживает: в командировке будет тяжелее',trip:'Перелом ещё заживал, гуляли мало.',without:'без перелома'},
 'Кишечная инфекция':{block:1,why:()=>'Кишечная инфекция: этот месяц лучше переждать дома'},
 'Отит':{block:1,why:()=>'Отит: этот месяц лучше переждать дома'},
 'Респираторная инфекция':{cost:'half',note:'Простуда ещё не прошла: в дороге будет тяжелее',
  trip:'Простуда поехала с вами: больше лежали, чем гуляли.',without:'без простуды'},
 'Растяжение связок':{cost:'half',note:'Растяжение ещё не прошло: гулять много не получится',work:'Растяжение ещё не прошло: в командировке будет тяжелее',
  trip:'Нога ещё болела, далеко не уходили.',without:'без растяжения'},
 'Нарушение сна':{cost:'half',note:'Нарушение сна поедет с вами: отдохнёте меньше обычного',work:'Нарушение сна поедет с вами: в командировке будет тяжелее',
  trip:'Спалось и там неважно, но смена обстановки помогла.',without:'без нарушения сна'},
 'Боль в спине':{cost:'half',note:'Спина будет напоминать о себе в дороге: отдохнёте меньше обычного',work:'Спина будет напоминать о себе всю командировку',
  trip:'Спина напоминала о себе всю дорогу.',without:'без боли в спине'},
 'Мигрень':{cost:'half',note:'Мигрень может забрать пару дней поездки',work:'Мигрень может забрать пару дней командировки',
  trip:'Мигрень забрала пару дней поездки.',without:'без мигрени'},
 'Обострение артроза':{cost:'half',note:'Артроз: меньше ходьбы, больше скамеек',work:'Артроз: в командировке будет тяжелее',
  trip:'Больше сидели на скамейках, чем ходили.',without:'без артроза'},
 'Сезонный аллергический ринит':{cost:'light',note:'Возьмите платки: аллергия едет с вами',
  trip:'Аллергия ездила с вами, но почти не мешала.',without:'без аллергии'}
};
// Болезнь не из таблицы (другой модуль, будущая сборка): тяжёлая — нельзя весь срок, остальные — можно, отдых меньше.
function illRule2753(a){
 const r=illRules2753[a?.name];
 if(r)return r;
 const name=String(a?.name||'Болезнь');
 return a?.severity==='тяжёлая'?{block:'all',why:n=>name+': в дорогу — через '+n+' мес.'}:
  {cost:'half',note:name+': отдохнёте меньше обычного',work:name+': в командировке будет тяжелее',trip:null,without:null};
}
// Травмы (incidents56): до первой помощи нельзя, после — можно, отдых меньше.
const injuryRules2753={
 ankle:{why:'Нога: сначала покажитесь врачу',note:'Нога ещё не зажила: гулять много не получится',work:'Нога ещё не зажила: в командировке будет тяжелее',
  trip:'Нога ещё не зажила, гуляли меньше, чем хотелось.',without:'без травмы'},
 bikeCrash:{why:'После столкновения: сначала покажитесь врачу',note:'После столкновения ещё всё болит: гулять много не получится',work:'После столкновения ещё всё болит: в командировке будет тяжелее',
  trip:'После столкновения ещё всё болело, гуляли мало.',without:'без травмы'}
};
// Хронические обострения (health25): поездке не мешают, только пометка.
const chronicNotes2753={allergy:'Возьмите платки: аллергия едет с вами',migraine:'Обострение мигрени: таблетки — в ручную кладь',
 asthma:'Астма: ингалятор — в ручную кладь',dermatitis:'Дерматит: возьмите привычный крем',arthrosis:'Артроз: меньше ходьбы, больше скамеек'};
const chronicWork2753={arthrosis:'Артроз: в командировке будет тяжелее'};

// Причины, которые выдало это правило: по ним «Самочувствие» находит, что открыть, а отсрочка — что она из-за болезни.
const healthTexts2753=new Map();
function mark2753(text,kind){healthTexts2753.set(text,kind);return text;}

// ---------- месяц отъезда и состояние к нему ----------

// Болезнь игрока убывает в конце месяца (everyday: autonomousMonth), травма и болезнь ребёнка — в начале (familyBeginMonth54),
// отъезд проверяется в начале месяца (travelBeginMonth52), после familyBeginMonth54 и до autonomousMonth. Между ходами
// последний обработанный месяц — текущий, в начале хода — прошлый.
let begin2753=-1,auto2753=-1;
familyBeginMonth54=function(...args){
 if(s?.clock)begin2753=s.clock.ticks;
 return illness2753Base.familyBeginMonth54.apply(this,args);
};
autonomousMonth=function(...args){
 if(s?.clock)auto2753=s.clock.ticks;
 return illness2753Base.autonomousMonth.apply(this,args);
};
function processed2753(){const t=s.clock.ticks;return begin2753===t&&auto2753!==t?t-1:t;}

// Месяц отъезда: выбранный в черновике, у запланированной поездки — её дата; не раньше ближайшего возможного.
function dep2753(d){
 let D=NaN;
 try{
  const dd=typeof extraTravel86==='function'?extraTravel86(d):d;
  // Без family270 (проверки с BASE=1) — то же правило, что в familyCareDeparture270: у запланированной поездки её дата.
  D=typeof familyCareDeparture270==='function'?familyCareDeparture270(dd):(dd?.departure86??dd?.departure??
   (dd?.editTrip57&&travel52().trips.find(t=>t.id===dd.editTrip57)?.departure)??s.clock.ticks+1);
 }catch(e){console.error(e);}
 if(!Number.isFinite(D))D=s.clock.ticks+1;
 return Math.max(D,processed2753()+1);
}

// Болезнь игрока в месяц отъезда D: сколько месяцев ещё осталось и какой это месяц болезни. Болезнь, которая кончается
// в сам месяц D, поездке уже не мешает: игрок видит «Восстановление: ещё 3 мес.» (social86), и через три месяца он здоров —
// поездка внутри месяца идёт уже после выздоровления (в конце месяца итог поездки пишется после записи «Восстановление»).
function illAt2753(D){
 const a=s.illness;
 if(!a||!(a.left>0))return null;
 const rem=a.left-Math.max(0,D-1-processed2753());
 if(rem<=1)return null;
 const start=Number.isFinite(s.lastIllnessTick)&&s.lastIllnessTick<=s.clock.ticks?s.lastIllnessTick:-1e9;
 return {a,rem,elapsed:D-start};
}
// Травма в месяц D: ждёт ли первой помощи (без ответа помощь организуют сами после срока происшествия) и не закончилась ли.
function injuryAt2753(D){
 const z=s.incidents56,j=z?.injury;
 if(!j)return null;
 const q=(z.events||[]).find(q=>q.id===j.id);
 let waiting=j.status==='waiting',ends=j.ends;
 if(waiting&&q&&q.status==='offered'&&Number.isFinite(q.expires)&&D>q.expires){waiting=false;ends=q.expires+3;}
 if(Number.isFinite(ends)&&D>=ends)return null;
 return {j,q,waiting};
}
function chronicAt2753(D){
 const h=s.health25;
 if(!h?.conditions)return [];
 return h.conditions.filter(q=>q.flareLeft>0&&q.flareLeft-Math.max(0,D-1-processed2753())>1);
}
function playerBlocked2753(D){
 const inj=injuryAt2753(D);
 if(inj?.waiting)return true;
 const il=illAt2753(D);
 if(!il)return false;
 const r=illRule2753(il.a);
 return r.block==='all'||Number.isFinite(r.block)&&il.elapsed<=r.block;
}
// Через сколько месяцев от сегодня можно уехать (первый месяц не раньше D, когда болезнь уже не держит).
function waitN2753(D){
 let x=D;
 while(x<D+60&&playerBlocked2753(x))x++;
 return Math.max(1,x-s.clock.ticks);
}
// Самочувствие игрока к месяцу D: block — причина «не хватает», note — пометка, rec — что записать на поездку при отъезде.
// work — командировка: пометки без обещаний про отдых.
function playerAt2753(D,work=false){
 const out={block:'',note:'',notes:[],rec:null};
 if(s.dead)return out;
 const inj=injuryAt2753(D),il=illAt2753(D);
 if(inj){
  const r=injuryRules2753[inj.j.kind]||injuryRules2753.ankle;
  if(inj.waiting){out.block=mark2753(r.why,'injury');return out;}
  out.notes.push(work&&r.work||r.note);out.rec={kind:'injury',key:inj.j.kind in injuryRules2753?inj.j.kind:'ankle',cost:'half'};
 }
 if(il){
  const r=illRule2753(il.a);
  if(r.block==='all'||Number.isFinite(r.block)&&il.elapsed<=r.block){out.block=mark2753(r.why(waitN2753(D)),'illness');out.notes=[];out.rec=null;return out;}
  if(r.cost){
   out.notes.unshift(work&&r.work||r.note);
   // Две цены сразу не складываются: остаётся большая.
   if(!out.rec||out.rec.cost==='light')out.rec={kind:'illness',name:il.a.name,severity:il.a.severity||'',cost:r.cost};
  }
 }
 for(const q of chronicAt2753(D)){const n=work&&chronicWork2753[q.id]||chronicNotes2753[q.id];if(n&&!out.notes.includes(n))out.notes.push(n);}
 out.note=out.notes.slice(0,2).join('. ');
 return out;
}

// ---------- дети ----------

function childReq2753(ill){return typeof childhood55==='function'?childhood55().requests.find(q=>q.id===ill.id):null;}
// Болезнь ребёнка в месяц D: срок — ill.ends; пока решение не принято — до конца срока ответа (потом помощь организуют сами).
function childIllAt2753(p,D){
 const ill=p?.child55?.illness;
 if(ill?.status!=='active')return null;
 const q=childReq2753(ill);
 const ends=Number.isFinite(ill.ends)?ill.ends:q&&Number.isFinite(q.expires)?q.expires+1:Infinity;
 return D<ends?ill:null;
}
function childWaiting2753(p,D){
 const ill=p?.child55?.illness;
 if(!ill||ill.stage!=='waiting')return false;
 const q=childReq2753(ill);
 return !q||q.status!=='offered'||!Number.isFinite(q.expires)||D<=q.expires;
}
// Лёгкая болезнь, помощь уже организована: такого ребёнка можно брать в поездку.
function childMild2753(p,D){
 const ill=childIllAt2753(p,D);
 return !!ill&&ill.severity!=='moderate'&&!ill.complicated&&!childWaiting2753(p,D);
}
// С 14 лет при лёгкой болезни после осмотра ребёнку не нужен взрослый рядом.
function teenOk2753(p,D){return (p?.age??0)>=14&&childMild2753(p,D);}
function childNote2753(p){return p.name+' ещё не поправил'+(p.gender==='f'?'ась':'ся')+': возьмите лекарства в дорогу';}

// ---------- проверка поездки ----------

// Заменяет journeys57 и обёртку homecare59 целиком: те же детские причины и тексты, но к месяцу отъезда и с новыми правилами.
healthJourneyWhy57=function(d){
 if(!d||d.stayHome86||!s?.clock)return '';
 const D=dep2753(d),me=playerAt2753(D);
 if(me.block)return me.block;
 const party=partyIds53(d);
 for(const id of party){
  const p=living(id);
  if(p&&childIllAt2753(p,D)&&!childMild2753(p,D))return p.name+' болеет: сначала восстановление';
 }
 const kids=typeof ownChildren55==='function'?ownChildren55():[];
 let why='';
 if(kids.some(p=>!party.includes(p.id)&&childLocal55(p)&&childIllAt2753(p,D)?.self&&p.child55.illness.careUntil>D&&!teenOk2753(p,D)))
  why='Сейчас вы ухаживаете за заболевшим ребёнком';
 if(!why)for(const p of kids){
  const ill=childIllAt2753(p,D);
  if(childLocal55(p)&&ill&&!ill.caregiver&&!campAway54(p.id)&&!party.includes(p.id)&&!teenOk2753(p,D)){why=p.name+': перед отъездом нужен присмотр во время болезни';break;}
 }
 if(!why)return '';
 // homecare59: дома остаётся взрослый для каждого больного ребёнка, решения уже приняты — уехать можно.
 if(typeof childrenAtHome59==='function'&&typeof childGuardianHome59==='function'){
  const ill=childrenAtHome59(d).filter(p=>childIllAt2753(p,D)&&!teenOk2753(p,D));
  if(ill.every(p=>!childWaiting2753(p,D)&&childGuardianHome59(p,d)))return '';
 }
 return why;
};

// Присмотр дома (family270): младше 12 — всегда; старше — только больной к месяцу отъезда и не подросток с лёгкой болезнью.
if(illness2753Base.familyCareKids270)familyCareKids270=function(d,...rest){
 const list=illness2753Base.familyCareKids270(d,...rest);
 if(!d||!list.length)return list;
 const D=dep2753(d);
 return list.filter(p=>p.age<12||childIllAt2753(p,D)&&!teenOk2753(p,D));
};

// Пометка в окне поездки: чем болеете (и что это значит для отдыха), больной ребёнок в поездке, обострение.
// work — командировка.
function tripNotes2753(d,work=false){
 if(!d||d.stayHome86||!s?.clock)return '';
 const D=dep2753(d),me=playerAt2753(D,work);
 if(me.block)return '';
 const notes=[...me.notes];
 for(const id of partyIds53(d)){const p=living(id);if(p&&childIllAt2753(p,D)&&childMild2753(p,D))notes.push(childNote2753(p));}
 return notes.slice(0,2).join('. ');
}

// ---------- «Самочувствие» и кнопки ----------

function healthFix2753(w){
 const kind=healthTexts2753.get(w);
 if(kind==='illness')return {label:'Самочувствие',fn:()=>s.illness?healthMenu():incidentsMenu56()};
 if(kind==='injury'){
  const id=s.incidents56?.injury?.id,q=id&&(s.incidents56.events||[]).find(q=>q.id===id);
  return {label:'Самочувствие',fn:()=>q&&typeof incidentMenu56==='function'?incidentMenu56(id):incidentsMenu56()};
 }
 // Ребёнку ещё не организовали помощь — кнопка ведёт прямо в окно помощи.
 const m=/^(.+) болеет: сначала восстановление$/.exec(w);
 if(m){
  const p=(typeof ownChildren55==='function'?ownChildren55():[]).find(p=>p.name===m[1]&&p.child55?.illness?.status==='active'&&p.child55.illness.stage==='waiting');
  if(p&&typeof childHealthMenu55==='function')return {label:'Здоровье · '+p.name,fn:()=>childHealthMenu55(p.child55.illness.id)};
 }
 return null;
}
if(illness2753Base.tripFix272)tripFix272=function(w,ctx,...rest){
 try{const f=healthFix2753(w);if(f)return f;}catch(e){console.error(e);}
 return illness2753Base.tripFix272(w,ctx,...rest);
};

// Окно 273: пометка — к строке «Получите»; у отсроченной из-за болезни поездки — своё состояние.
if(illness2753Base.tripCard273)tripCard273=function(kind,d,t,...rest){
 const card=illness2753Base.tripCard273(kind,d,t,...rest);
 if(!card||typeof card.build!=='function'||!['trip-draft','trip-invite','trip'].includes(kind))return card;
 const build=card.build;
 card.build=ctx=>{
  const c=build(ctx);
  try{
   const row=c?.rows?.find(r=>r.label==='Получите');
   let note='';
   if(kind==='trip'&&t){
    if(t.status==='completed')note=illDoneNote2753(t);
    else if(pendingJourney57(t))note=tripNotes2753(tripDraft57(t),!!t.business54);
    if(pendingJourney57(t)&&t.hold57?.health2753&&healthJourneyWhy57(tripDraft57(t)))c.status={text:t.business54?'Командировка ждёт выздоровления':'Поездка ждёт выздоровления',tone:'wait'};
   }else if(d)note=tripNotes2753(d);
   if(row&&note)row.note=row.note?row.note+' · '+note:note;
  }catch(e){console.error(e);}
  return c;
 };
 return card;
};
// Окно без карточки (старый блок trips272): пометка под «Можно ехать».
if(illness2753Base.tripInsertReady272)tripInsertReady272=function(why,ctx,...rest){
 const r=illness2753Base.tripInsertReady272(why,ctx,...rest);
 try{
  const box=document.querySelector('#modal .ready272.ready272-ok');
  if(box&&!box.querySelector('.ready2753-note')&&ctx?.kind!=='journey'){
   const d=ctx.d||(ctx.t&&tripDraft57(ctx.t)),note=d?tripNotes2753(d,!!ctx.t?.business54):'';
   if(note){const p=document.createElement('p');p.className='ready272-note ready2753-note';p.textContent=note;(box.querySelector('.ready2722-panel')||box).append(p);}
  }
 }catch(e){console.error(e);}
 return r;
};

// ---------- отсрочка и новая дата ----------

// Поездку держит болезнь (своя или ребёнка): уже отложена из-за неё или болезнь мешает к месяцу отъезда.
function healthHeld2753(t){
 if(!t||!pendingJourney57(t))return false;
 if(t.hold57?.health2753)return true;
 try{return !!healthJourneyWhy57(tripDraft57(t));}catch(e){console.error(e);return false;}
}
function healthOkAt2753(t,D){
 try{return !healthJourneyWhy57({...tripDraft57(t),departure86:D,departure:D});}catch(e){console.error(e);return false;}
}
// Первый месяц, когда можно уехать: не раньше ближайшей возможной даты (отпуск, визы) и после выздоровления.
function firstOk2753(t){
 const d=tripDraft57(t);
 let D=typeof departureMin86==='function'?departureMin86(d):s.clock.ticks+1;
 const stop=D+60;
 while(D<stop&&!healthOkAt2753(t,D))D++;
 return D;
}
function monthWord2753(D){try{return typeof inMonth273==='function'?inMonth273(D):'в '+String(dateLabel86(D)).toLowerCase();}catch(e){return '';}}
// Перенос на выбранный месяц: отсрочка снимается, рабочий отпуск снова на согласование (как rescheduleJourney57).
function healthMove2753(id,D){
 const t=travel52().trips.find(t=>t.id===id);
 if(!pendingJourney57(t)||!Number.isInteger(D)||D<=s.clock.ticks)return false;
 if(s.country!==t.home||residenceCity()!==t.homeCity)return false;
 const co=company18();
 if(t.leaveNeed&&!t.business54&&(co?.id!==t.employer||(s.workHours??40)!==t.hours))return false;
 if(t.business54){t.leaveNeed=0;t.leaveUsed=0;}
 t.hold57=null;
 t.departure=D;
 t.review=s.clock.ticks+1;
 t.status=t.leaveNeed?'requested':'planned';
 t.rescheduled57=(t.rescheduled57||0)+1;
 // Командировку оплачивает компания, отпуск на неё не нужен: про деньги и отпуск ей не пишется.
 if(t.business54)log('Дата командировки изменена',t.city+': отъезд '+monthWord2753(D)+'.','Отдых');
 else log('Дата поездки изменена',t.city+': отъезд '+monthWord2753(D)+'.'+(t.leaveNeed?' Отпуск снова отправлен на согласование.':'')+' Деньги пока не списаны.','Отдых');
 save();
 return true;
}
function healthDateMenu2753(id){
 const t=travel52().trips.find(t=>t.id===id);
 if(!pendingJourney57(t))return travelTripMenu52(id);
 const why=healthJourneyWhy57(tripDraft57(t)),first=firstOk2753(t);
 const options=[];
 for(let k=0;k<6;k++){
  const D=first+k;
  options.push({label:dateLabel86(D),hint:[k===0?(why?'первый месяц, когда можно ехать':'ближайший возможный месяц'):'',t.leaveNeed?'отпуск согласуют заново':''].filter(Boolean).join(' · '),
   fn:()=>{healthMove2753(id,D);travelTripMenu52(id);}});
 }
 options.push({label:'Другой месяц',fn:()=>tripCalendar86({...tripDraft57(t),departure86:first})});
 options.push({label:'Вернуться к поездке',fn:()=>travelTripMenu52(id)});
 show(t.business54?'Новая дата командировки':'Новая дата поездки',(why?why+(/\.$/.test(why)?' ':'. '):'')+'Выберите месяц, когда в дорогу уже можно.'+(t.business54?'':' Деньги и отпуск спишут только при отъезде.'),options,
  {title:'Поездка · '+t.city,open:()=>travelTripMenu52(id)});
}
// «Выбрать месяц и год» (travel86) у поездки, которую держит болезнь: дата меняется и отсрочка снимается, если к этой
// дате уже можно ехать; если ещё рано — календарь открывается снова, на первом месяце, когда можно.
returnTravel86=function(d,...rest){
 const t=d?.editTrip57&&travel52().trips.find(t=>t.id===d.editTrip57);
 if(t&&pendingJourney57(t)&&Number.isInteger(d.departure86)&&d.departure86!==t.departure&&healthHeld2753(t)){
  if(!healthOkAt2753(t,d.departure86)){
   // Окно календаря уже закрыто (choose): открываем его снова на первом месяце, когда можно.
   const first=firstOk2753(t);
   toast('К этому месяцу в дорогу ещё рано. Ближайший — '+String(dateLabel86(first)).toLowerCase()+'.');
   return tripCalendar86({...d,departure86:first});
  }
  if(healthMove2753(t.id,d.departure86)){
   if(d.childcare86)t.childcare86=d.childcare86;
   return travelTripMenu52(t.id);
  }
 }
 return illness2753Base.returnTravel86(d,...rest);
};
// «Перенести дату поездки» у поездки, которую держит болезнь: выбор месяца после выздоровления, а не «через месяц».
travelTripMenu52=function(id,...rest){
 const t=travel52().trips.find(t=>t.id===id);
 if(!t)return illness2753Base.travelTripMenu52(id,...rest);
 const held=healthHeld2753(t),old=show;
 show=function(title,text,opts=[],...more){
  try{
   const lost=illDoneFact2753(t);
   if(lost&&nextDetail20?.sections?.[0]?.rows)nextDetail20.sections[0].rows.push(fact20('Самочувствие',lost));
   // «Ожидание решения · Причина» — как сейчас, а не как в месяц отсрочки (лечение могло сократить срок).
   const wait=t.hold57&&nextDetail20?.sections?.find?.(x=>x?.title==='Ожидание решения');
   if(wait){
    const why=holdWhy2753(t);
    if(why&&!why.length)nextDetail20.sections.splice(nextDetail20.sections.indexOf(wait),1);
    else if(why){const f=wait.rows?.find(r=>r?.label==='Причина');if(f)f.value=why.join('; ');}
   }
   if(held&&Array.isArray(opts))opts=opts.map(o=>o?.label==='Перенести дату поездки'?{...o,disabled:!t.journey57?.accepted,why:t.journey57?.accepted?'':'Сначала подтвердите дорогу и уход',hint:'Выбрать месяц после выздоровления'+(t.leaveNeed?' · отпуск согласуют заново':''),fn:()=>healthDateMenu2753(id)}:o);
  }catch(e){console.error(e);}
  return old.call(this,title,text,opts,...more);
 };
 try{return illness2753Base.travelTripMenu52(id,...rest);}finally{show=old;}
};
// Карточка 273 делала «Перенести дату» серой («сначала поправьте дорогу и уход») при любой причине — болезнь перенос не
// мешает: в новом окне только месяцы, когда уже можно ехать.
if(illness2753Base.rescheduleWhy273)rescheduleWhy273=function(t,...rest){
 if(!healthHeld2753(t))return illness2753Base.rescheduleWhy273(t,...rest);
 if(s.country!==t.home||residenceCity()!==t.homeCity)return 'вы переехали — поездку нужно спланировать заново';
 const co=company18();
 if(t.leaveNeed&&!t.business54&&(co?.id!==t.employer||(s.workHours??40)!==t.hours))return 'часы работы изменились — так отпуск не согласовать';
 return '';
};
// Отъезд в месяц D уже ничто не держит (так же, как это проверяет family270 у отложенной поездки: дорога подтверждена,
// адрес и состав прежние, причин нет). Болезнь здесь смотрится к месяцу D.
function journeyClear2753(t,D){
 if(!pendingJourney57(t)||!t.journey57?.accepted)return false;
 if(s.country!==t.home||residenceCity()!==t.homeCity||partyIds53(t).some(id=>!living(id)))return false;
 try{return !journeyWhy57({...tripDraft57(t),departure86:D,departure:D}).length;}catch(e){console.error(e);return false;}
}
// Причины отсрочки сейчас, к дате отъезда отложенной поездки (лечение могло сократить срок, ребёнку могли организовать
// помощь). null — пересчитывать не нужно: отсрочка не из-за болезни, дорога не подтверждена или поездку отменят (переезд).
function holdWhy2753(t){
 const h=t?.hold57;
 if(!h||!(h.sick2753||h.health2753)||!pendingJourney57(t)||!t.journey57?.accepted)return null;
 if(s.country!==t.home||residenceCity()!==t.homeCity||partyIds53(t).some(id=>!living(id)))return null;
 try{return journeyWhy57(tripDraft57(t));}catch(e){console.error(e);return null;}
}
// Отсрочка из-за болезни: своя запись и своё название в «Ожидают ответа». Если болезнь (своя или ребёнка) держит только
// этот месяц, отсрочки нет: поездка сдвигается на месяц одной записью, без решения и без остановки времени.
holdJourney57=function(t,reason,...rest){
 let h='';
 try{h=healthJourneyWhy57(tripDraft57(t));}catch(e){console.error(e);}
 const sick=!!h&&String(reason).split('; ').includes(h);
 if(sick&&!t.hold57&&journeyClear2753(t,s.clock.ticks+1)){
  t.departure=s.clock.ticks+1;
  log(t.business54?'Командировка сдвинулась на месяц':'Поездка сдвинулась на месяц',
   reason+(/\.$/.test(reason)?' ':'. ')+'К следующему месяцу это уже не помешает — отъезд '+monthWord2753(t.departure)+'.'+(t.business54?'':' Деньги и отпуск пока не списаны.'),
   'Отдых',true);
  return;
 }
 if(!sick||reason!==h){
  const r=illness2753Base.holdJourney57(t,reason,...rest);
  if(sick&&t.hold57)t.hold57.sick2753=true;
  return r;
 }
 const first=!t.hold57;
 t.hold57??={created:s.clock.ticks};
 t.hold57.reason=reason;
 t.hold57.health2753=true;
 t.hold57.sick2753=true;
 t.departure=s.clock.ticks+1;
 if(first){
  s.clock.running=false;
  log(t.business54?'Командировка ждёт выздоровления':'Поездка ждёт выздоровления',
   reason+(/\.$/.test(reason)?' ':'. ')+(t.business54?'':'Деньги и отпуск не списаны. ')+'Можно выбрать новую дату или отменить без расходов.',
   'Отдых',true,{kind:'journey57',id:t.id});
  save();
 }
};
// Причина в «Ожидают ответа» — как сейчас, к дате отъезда: «ещё 3 мес.» не висит после лечения, а если к отъезду
// болезнь уже не мешает, решать нечего — пункта нет (поездка уедет по плану, карточка говорит то же).
decisionItems24=function(...args){
 const list=illness2753Base.decisionItems24.apply(this,args);
 if(!Array.isArray(list))return list;
 const out=[];
 for(const i of list){
  const t=i?.ref?.kind==='journey57'?i.q:null;
  if(!t?.hold57||!(t.hold57.sick2753||t.hold57.health2753)){out.push(i);continue;}
  const why=holdWhy2753(t);
  if(why&&!why.length)continue;
  let h='';
  try{h=why?healthJourneyWhy57(tripDraft57(t)):'';}catch(e){console.error(e);}
  const note=why?why.join('; '):t.hold57.reason,health=why?!!h&&why.length===1&&why[0]===h:!!t.hold57.health2753;
  out.push(health?{...i,title:(t.business54?'Командировка ждёт выздоровления · ':'Поездка ждёт выздоровления · ')+t.city,note}:{...i,note});
 }
 return out;
};

// ---------- отъезд: что записать на поездку ----------

travelBeginMonth52=function(...args){
 const r=illness2753Base.travelBeginMonth52.apply(this,args);
 try{
  const t=travelActive52();
  if(t?.status==='away'&&t.departed===s.clock.ticks&&!('ill2753' in t)){
   t.ill2753=t.stayHome86?null:playerAt2753(s.clock.ticks).rec;
  }else if(t&&pendingJourney57(t)&&t.hold57&&t.journey57?.accepted){
   // Причина отсрочки пересчитывается каждый месяц: «ещё 3 мес.» не должно висеть, когда осталось меньше.
   const d=tripDraft57(t),why=journeyWhy57(d),h=healthJourneyWhy57(d);
   if(why.length){t.hold57.reason=why.join('; ');t.hold57.health2753=!!h&&why.length===1&&why[0]===h;if(h)t.hold57.sick2753=true;}
   // К отъезду (в начале следующего месяца) болезнь уже не мешает: отсрочка снимается сейчас, а не через месяц
   // (family270 сняла бы её только в сам месяц отъезда, и весь этот месяц «Ожидают ответа» спорили бы с карточкой).
   else if((t.hold57.sick2753||t.hold57.health2753)&&journeyClear2753(t,t.departure)){
    t.hold57=null;
    log(t.business54?'Командировка снова по плану':'Поездка снова по плану',t.city+': к следующему месяцу причина задержки отпадёт, отъезд '+monthWord2753(t.departure)+'.','Отдых');
   }
  }
 }catch(e){console.error(e);}
 return r;
};
function illWithout2753(q){
 if(!q)return '';
 const r=q.kind==='injury'?injuryRules2753[q.key]:illRule2753({name:q.name,severity:q.severity});
 return r?.without||'';
}
function cap2753(t){t=String(t||'');return t.charAt(0).toUpperCase()+t.slice(1);}
// Прошедшая поездка с болезнью: что болезнь забрала. В карточке — строкой под «Получите», в «Подробнее» — фактом
// «Самочувствие». Если болезнь ничего не забрала (день в дороге: половина от 1 — снова 1, а настроение не меньше +1),
// ничего и не пишется.
function illDoneLost2753(t){
 const q=t?.ill2753;
 if(t?.status!=='completed'||!q||!Number.isFinite(q.base))return null;
 const rest=q.base!==t.recovery,mood=Number.isFinite(q.baseMood)&&Number.isFinite(q.mood)&&q.baseMood!==q.mood;
 return rest||mood?{q,rest,mood,without:illWithout2753(q)||'без болезни'}:null;
}
function illDoneNote2753(t){
 const x=illDoneLost2753(t);
 if(!x)return '';
 return x.rest?'Усталость −'+t.recovery+' — '+x.without+' было бы −'+x.q.base:'Настроение +'+x.q.mood+' — '+x.without+' было бы +'+x.q.baseMood;
}
function illDoneFact2753(t){
 const x=illDoneLost2753(t);
 if(!x)return '';
 return cap2753(x.without)+' '+(x.rest?'усталость была бы −'+x.q.base+(x.mood?', настроение +'+x.q.baseMood:''):'настроение было бы +'+x.q.baseMood);
}
// Итог поездки с болезнью (travel52: travelEndMonth52 зовёт отсюда). Командировка и «Отпуск дома» — как раньше.
// Отдых и настроение вдвое меньше (с округлением), настроения не меньше +1; при сезонном рините отдых на 1 меньше.
function tripIllEnd2753(t){
 const q=t?.ill2753;
 if(!q||t.business54||t.stayHome86||!travelComfort52[t.comfort])return null;
 const base=Math.round(t.days*travelComfort52[t.comfort].recovery),baseMood=Math.min(8,2+Math.floor(t.days/3));
 const light=q.cost==='light',rec=light?(base>1?base-1:base):Math.round(base/2),mood=light?baseMood:Math.max(1,Math.round(baseMood/2));
 const r=q.kind==='injury'?injuryRules2753[q.key]:illRule2753({name:q.name,severity:q.severity});
 // Отдых тот же (день в дороге: половина от 1 — снова 1), а настроение меньше — запись говорит про настроение.
 const moodOnly=rec===base&&mood<baseMood;
 let text;
 if(r?.trip&&r.without)
  text=r.trip+' '+(moodOnly?'Усталость снизилась на '+rec+', настроение +'+mood+' — '+r.without+' было бы +'+baseMood+'.':
   rec===base?'Усталость снизилась на '+rec+'.':rec>0?'Усталость снизилась на '+rec+' — '+r.without+' было бы '+base+'.':
   'Отдохнуть почти не получилось — '+r.without+' усталость снизилась бы на '+base+'.');
 else text=moodOnly?'Самочувствие подвело, радости от поездки меньше: настроение +'+mood+' вместо +'+baseMood+'.':
  rec===base?'Усталость снизилась на '+rec+'.':'Самочувствие подвело, отдохнули меньше, чем хотелось: усталость снизилась на '+rec+' вместо '+base+'.';
 q.base=base;q.recovery=rec;q.baseMood=baseMood;q.mood=mood;
 return {recovery:rec,mood,text};
}

// ---------- командировка и языковая программа ----------

// Предложение командировки: то же правило к месяцу отъезда.
businessOfferMenu54=function(id,...rest){
 const q=typeof events54==='function'?events54().business.find(q=>q.id===id):null;
 if(!q||q.status!=='offered'||!s?.clock)return illness2753Base.businessOfferMenu54(id,...rest);
 const me=playerAt2753(s.clock.ticks+(q.country===s.country?1:2),true);
 if(!me.block&&!me.note)return illness2753Base.businessOfferMenu54(id,...rest);
 const old=show;
 show=function(title,text,opts=[],...more){
  if(Array.isArray(opts))opts=opts.map(o=>o?.label==='Согласиться'?(me.block?{...o,disabled:true,why:me.block}:{...o,hint:me.note}):o);
  return old.call(this,title,text,opts,...more);
 };
 try{return illness2753Base.businessOfferMenu54(id,...rest);}finally{show=old;}
};
// Языковая программа уезжает в конце месяца ответа (language-stays53): правило смотрит на следующий месяц.
function stayDeparture2753(country){return s.clock.ticks+(permission16(country,'study')?1:3)+1;}
languageStayWhy53=function(country,months,...rest){
 const why=illness2753Base.languageStayWhy53(country,months,...rest);
 try{
  if(!s.dead&&s.age>=18&&countries[country]&&country!==s.country){const me=playerAt2753(stayDeparture2753(country));if(me.block&&!why.includes(me.block))why.push(me.block);}
 }catch(e){console.error(e);}
 return why;
};
// Отъезд на программу ждёт выздоровления: ответ по визе приходит как раньше, отъезд — когда в дорогу уже можно.
languageStayMonth53=function(...args){
 try{
  const z=languageStays53(),t=languageStayActive53();
  if(z.last<s.clock.ticks&&!s.dead&&t&&['visa','ready'].includes(t.status)&&s.clock.ticks>=t.review&&t.home===s.country&&t.homeCity===residenceCity()){
   const me=playerAt2753(s.clock.ticks+1);
   if(me.block&&!(t.status==='visa'&&t.roll>=.88)){
    if(t.status==='visa'){
     t.status='ready';
     log('Временное разрешение получено','Только для языковой программы. Оно не даёт права на постоянный переезд или работу.','Документы');
    }
    t.review=s.clock.ticks+1;
    if(!t.hold2753){
     t.hold2753={created:s.clock.ticks};
     log('Языковая программа ждёт выздоровления',me.block+(/\.$/.test(me.block)?' ':'. ')+'Программа не оплачена; поедете, когда в дорогу будет можно, или отмените заявку без доплаты.','Учёба',true);
    }
   }
  }
 }catch(e){console.error(e);}
 return illness2753Base.languageStayMonth53.apply(this,args);
};
// В списке «Курсы в стране языка» у такой программы — «Ждёт выздоровления», а не «Готово к отъезду».
languageStayMenu53=function(...args){
 const list=languageStays53().trips.slice(-8).reverse(),old=show;
 show=function(title,text,opts=[],...more){
  try{
   if(title==='Курсы в стране языка'&&Array.isArray(opts)&&list.some(t=>t.hold2753)){
    const wait=!!playerAt2753(s.clock.ticks+1).block;
    opts=opts.map((o,i)=>{const t=list[i];return o&&t&&t.hold2753&&t.status==='ready'&&wait?{...o,hint:'Ждёт выздоровления'}:o;});
   }
  }catch(e){console.error(e);}
  return old.call(this,title,text,opts,...more);
 };
 try{return illness2753Base.languageStayMenu53.apply(this,args);}finally{show=old;}
};

// ---------- семейная поездка ребёнка (notices270) ----------

// До 12 лет приглашение мамы или папы — окно «Поехать с … / Остаться дома» (familyTripGo270), поездка в нём проходит
// сразу. То же правило: ветрянка, пока заразна, — «Поехать» серая с причиной; с болезнью, которая не держит, — можно, но
// настроения от поездки вдвое меньше (не меньше +1), в записи — почему.
if(typeof familyTripInvite270==='function'&&typeof familyTripGo270==='function'){
 const goBase2753=familyTripGo270,inviteBase2753=travelInviteMenu53;
 const familyMe2753=q=>{
  try{return s?.clock&&!s.dead?playerAt2753(dep2753({...q.draft,invite53:q.id})):null;}catch(e){console.error(e);return null;}
 };
 const familyMood2753=me=>me?.rec?.cost==='half'?2:4;
 travelInviteMenu53=function(id,...rest){
  const q=typeof invite53==='function'?invite53(id):null;
  if(!q||!familyTripInvite270(q)||!invitationAvailable53(q))return inviteBase2753(id,...rest);
  const me=familyMe2753(q);
  if(!me||!me.block&&!me.note)return inviteBase2753(id,...rest);
  const old=show;
  show=function(title,text,opts=[],...more){
   try{
    if(Array.isArray(opts))opts=opts.map(o=>typeof o?.label==='string'&&/^Поехать с /.test(o.label)?
     me.block?{...o,disabled:true,why:me.block}:
     {...o,hint:[String(o.hint||'').replace(/Настроение \+4/,'Настроение +'+familyMood2753(me)),me.note].filter(Boolean).join(' · ')}:o);
   }catch(e){console.error(e);}
   return old.call(this,title,text,opts,...more);
  };
  try{return inviteBase2753(id,...rest);}finally{show=old;}
 };
 familyTripGo270=function(id,...rest){
  const q=typeof invite53==='function'?invite53(id):null;
  const me=q&&familyTripInvite270(q)&&invitationAvailable53(q)?familyMe2753(q):null;
  if(me?.block){if(typeof toast==='function')toast(me.block);return false;}
  const m0=s?.mood;
  const ok=goBase2753(id,...rest);
  try{
   if(ok&&me?.rec){
    if(Number.isFinite(m0))s.mood=clamp(m0+familyMood2753(me));
    const r=me.rec.kind==='injury'?injuryRules2753[me.rec.key]:illRule2753({name:me.rec.name,severity:me.rec.severity});
    const e=r?.trip&&s.log.slice(0,8).find(e=>e.title==='Семейная поездка · '+q.draft.city);
    if(e&&!e.text.includes(r.trip))e.text=e.text+' '+r.trip;
    save();if(typeof render==='function')render();
   }
  }catch(e){console.error(e);}
  return ok;
 };
}
