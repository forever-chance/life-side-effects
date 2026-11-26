'use strict';
// Сборка 273.7.1 «Транспорт: расчёт»: неделя и деньги дороги до работы (решения владелицы 26.11).
//
// Все числа — из тех функций, что потом ставят часы и списывают деньги, с нужным способом дороги на время вызова
// (option27371): минуты в одну сторону — commuteMinutes() (по ним и усталость месяца), часы дороги — schedule23().road,
// свободно для планов — capacity() минус totalHours(), деньги в месяц — проезд, как его списывает месяц (transport16 →
// payTransport43, trajectory16), плюс vehicleCost56(v).total за каждый свой транспорт, как его списывает
// transportMonth56: постоянная часть (страховка, стоянка) — и когда транспорт стоит, бензин — только когда на нём ездят.
// Поэтому сравнение честное в обе стороны: машина обычно дороже общественного транспорта.
//
// 1. Ловушка дороги. Пешком или на велопрокате до работы в другом городе — 480 и 214 мин в одну сторону: в неделе 0
//    свободных часов, занятия стоят, усталость растёт. Варианты остаются, но серые с причиной («неделя не помещается:
//    480 мин в одну сторону — свободных часов останется 0»): вариант, после которого свободных часов нет, хотя общественным
//    транспортом или своим исправным транспортом они есть (если неделя и так занята работой — серым ничего не становится).
//    selectTransport56 такой вариант не ставит, покупка (buyVehicle56) и «Продолжить за близкого» (transformLife274) не
//    ставят его на дорогу сами — дорога остаётся прежней, и это сказано. Если в сохранении он уже стоит — ничего не меняется само: пункт «Ожидают ответа» «Дорога съедает всю неделю» объясняет
//    и предлагает в одно нажатие лучший разумный способ (общественный транспорт или свой исправный транспорт) — с
//    минутами, часами и деньгами. «Как добираться» показывает у каждого варианта минуты, часы в неделю и деньги в месяц
//    до работы, отмечает текущий; после выбора — «Теперь до работы 17 мин…».
// 2. После переезда выбор дороги сбрасывается на общественный транспорт (observeTransportMove56) и не возвращается —
//    ни после перевозки машины, ни по возвращении в её город, а содержание идёт. Само ничего не переключается: пункт
//    «Fiat Panda стоит без дела · 69 A$/мес.» → «Ездить на ней · 17 мин вместо 20 · ≈ 2,8 ч/нед. вместо 3,3 · 112 A$/мес.
//    вместо 91 A$» (везде, где сравниваются способы дороги, — минуты, часы в неделю и деньги в месяц вместе),
//    «Продать», «Оставить как есть». Пункт есть, пока свой исправный транспорт в вашем городе стоит, а до работы вы
//    добираетесь иначе, и вы ещё не решали про него на этом месте: выбор способа дороги или «Оставить как есть» — ответ до
//    следующего переезда (переезд и перевозка транспорта задают вопрос заново). То же у старых сохранений (у владелицы —
//    Fiat Panda в Сиднее).
// 3. Транспорт в другом городе: «Fiat Panda — в городе Сидней · 69 A$/мес.» → «Перевезти к себе · цена», «Продать · цена»,
//    «Пусть стоит там». Только свой транспорт; пропадает, когда он перевезён, продан, передан или вы ответили.
// 4. Подарок ребёнку упирался в ваш лимит пяти единиц: машину сначала покупают на вас (giftMarket61 → purchaseWhy56).
//    В подарке лимит не проверяется — транспорт сразу уходит ребёнку; а если передать вдруг не вышло и у вас стало бы
//    больше пяти — он всё равно уходит ребёнку. Заодно покупка в подарок больше не сбрасывает вашу дорогу на
//    общественный транспорт (buyVehicle56 выбирал подарок для вас, giveVehicle56 потом ставил «общественный»).
// 5. «Спросить про старый транспорт · имя»: если отдать нечего (нет транспорта, он в плохом состоянии, не погашен
//    кредит) или родитель оставляет транспорт себе — кнопка гаснет с причиной и датой, когда можно спросить снова
//    (12 месяцев; после предложения — как раньше, 24). Причина на вашей стороне (у вас уже пять единиц, ждёт ответа
//    другой подарок) — без даты и проверяется при каждом показе: исправили — можно спросить сразу. Поведение 275.8
//    (fixes2758.js) не тронуто: сама просьба идёт через тот же offerVehicleGift56.
// 6. Ремонт. Порог — тот, что уже в игре: vehicleUsable56 не пускает в дорогу при состоянии 25/100 и ниже или при
//    повреждении. Теперь это видно:
//    (a) пункт «Fiat Panda: нужен ремонт · состояние 24/100» у транспорта, на котором вы ездите: «пока не почините —
//        общественным: 20 мин вместо 17 · 91 A$/мес. вместо 112 A$», «Отремонтировать · цена» (vehicleRepair56 и
//        vehicleRepairQuote56), «Продать как есть · цена», «Не чинить, ездить общественным»; пропадает после ремонта или
//        продажи. Пока открыто происшествие с этим транспортом (прокол, поломка), пункта нет — есть окно происшествия.
//    (b) в карточке при состоянии 35 и ниже — «скоро понадобится ремонт: при 25/100 и ниже не ездит, а пока чаще
//        ломается в дороге» (в панель это не идёт).
//    (b2) поломка в дороге: с 35 до 26 шанс в месяц растёт — у машины с 8% до 40%, у велосипеда с 3% до 14%; выше 35
//        поломок нет. Это новое происшествие «breakdown» в incidents56 со всеми его правилами: одно открытое
//        происшествие за раз и не чаще раза в 6 месяцев (отступ не трогали; калибровка прогоном — машина, которую держат
//        на 26–35 и на которой ездят на работу, ломается 1,1–1,3 раза в год, велосипед — 0,5–0,6, при 60–90 — ни разу).
//        Случается только по дороге на работу. Опоздание — результаты на работе −1 (company18().performance, если
//        она уже есть); эвакуатор (машина, 0,4% годовой стоимости жизни страны) или такси (велосипед, 0,06%) списываются
//        сразу; транспорт получает повреждение «Поломка в дороге» и состояние −3 — не ездит до ремонта.
//    (c) пока транспорт не ездит, дорога идёт общественным транспортом (так считает transportRoute56), бензина нет,
//        страховка и стоянка списываются; карточка говорит, почему не ездит. Точечно в vehicles56.js: сломанный выбранный
//        транспорт изнашивается как стоящий (0,08 в месяц), а не как тот, на котором ездят (0,3).
//    (d) ремонт дороже самой машины — строка «Ремонт 373 A$ — сама машина стоит 36 A$» (карточка, окна ремонта).
// 7. Транспорт — в разделе «Поездки и переезд» (решение владелицы 26.11) и в поиске действий «Переезды».
// Новое в сохранении: transport56.moveSeq27371 (счёт переездов), transport56.ask27371 (когда снова спросить родителя),
// у транспорта idle27371 / left27371 (ответ про стоящий транспорт), происшествия вида breakdown. «×» в «Ожидают ответа»
// откладывает пункт на 3 месяца по ключу темы (topic270): «транспорт:ловушка», «транспорт:стоит», «транспорт:оставлен»,
// «транспорт:ремонт:<id>» — у каждого дела свой, чтобы «×» у велосипедов в другом городе не прятал ремонт машины, на
// которой вы ездите; отложенный ремонт снимается, когда транспорт починили. s.pending и resolvePending не трогаются.
// Файл подключается перед windows273.js.

const fixes27371Base={transportMenu56,vehicleCard56,selectTransport56,observeTransportMove56,transportMonth56,autonomousMonth,
 incidentMenu56,resolveIncident56,decisionRecord24,decisionActive24,decisionItems24,openDecision24,topic270,purchaseWhy56,
 giftMarket61,buyGiftVehicle61,travelHub65,actionCatalog24,bringVehicle56,buyVehicle56,vehicleRepair56,incidentsMenu56,
 transformLife274:typeof transformLife274==='function'?transformLife274:null};
const kind27371='transport27371',topic27371='транспорт',limit27371=25,soft27371=35;
const limitWhy27371='Можно владеть не более чем пятью единицами транспорта';

// ---------- мелочи ----------

function plural27371(n,one,few,many){const a=Math.abs(n)%100,b=a%10;return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many;}
function hrs27371(h){h=Math.max(0,+h||0);return '≈ '+(h<9.95?String(Math.round(h*10)/10).replace('.',','):String(Math.round(h)))+' ч/нед.';}
function cap27371(t){t=String(t||'');return t.charAt(0).toUpperCase()+t.slice(1);}
function low27371(t){t=String(t||'');return t.charAt(0).toLowerCase()+t.slice(1);}
function when27371(tick){try{if(typeof inMonth273==='function')return inMonth273(tick);return 'в '+String(dateLabel86(tick)).toLowerCase();}catch(e){return '';}}
function place27371(country,city){return String(country)+'|'+String(city);}
function seq27371(){return transportState56().moveSeq27371||0;}
function vname27371(v){return vehicleModel56(v?.model)?.name||(v?.kind==='car'?'Машина':'Велосипед');}
function car27371(v){return v?.kind==='car';}
function onIt27371(v){return car27371(v)?'на ней':'на нём';}
function noun27371(v){return car27371(v)?'машина':'велосипед';}
function where27371(v){return 'в городе '+v.city+(v.country!==s.country?' ('+(countries[v.country]?.name||'')+')':'');}
function mine27371(v){return !!v&&v.owner==='player'&&v.status==='owned';}
// Состояние на экране — по ту же сторону порога, что и правило: 25,4 ездит — «26/100», 25 не ездит — «25/100».
function cond27371(v){const c=+v.condition||0;return c>limit27371?Math.max(limit27371+1,Math.round(c)):Math.min(limit27371,Math.round(c));}
function broken27371(v){return mine27371(v)&&(!!v.damage||v.condition<=limit27371);}
function count27371(list){
 const cars=list.filter(car27371).length,bikes=list.length-cars;
 if(!cars)return bikes+' '+plural27371(bikes,'велосипед','велосипеда','велосипедов');
 if(!bikes)return cars+' '+plural27371(cars,'машина','машины','машин');
 return list.length+' '+plural27371(list.length,'единица','единицы','единиц')+' транспорта';
}

// ---------- способ дороги: минуты, часы, деньги ----------

// Работа так, как её передают transport16 и schedule23.
function jobRoute27371(){const w=s.job?.workplace;return w?{...s.job,country:w.country,city:w.city,area:w.area}:null;}
// Проезд до работы, как его списывает месяц (trajectory16 monthlyFinance → payTransport43).
function fare27371(){
 if(!s.job?.professionId||!s.job.workplace||!permission16(s.country,'work'))return 0;
 const v=transport16(jobRoute27371());return Number.isFinite(v)?v:0;
}
// Способ дороги на время вызова; fix — представить этот транспорт отремонтированным (как после vehicleRepair56).
function withMode27371(mode,fn,fix=null){
 const z=transportState56(),old=z.selected,v=fix?vehicle56(fix):null,keep=v?{condition:v.condition,damage:v.damage,unfunded:v.unfunded}:null;
 z.selected=mode;
 if(v){v.condition=Math.max(95,+v.condition||0);v.damage=null;v.unfunded=false;}
 try{return fn();}
 finally{z.selected=old;if(v)Object.assign(v,keep);}
}
function option27371(mode,fix=null){
 return withMode27371(mode,()=>{
  const q=schedule23(),cap=capacity(),plans=totalHours(),fare=fare27371(),minutes=commuteMinutes();
  let upkeep=0,fixed=0;
  for(const v of ownedVehicles56()){const k=vehicleCost56(v);upkeep+=k.total;fixed+=k.fixed;}
  return {mode,minutes:Number.isFinite(minutes)?Math.round(minutes):0,road:Number.isFinite(q.road)?q.road:0,cap,free:cap-plans,fare,upkeep,fixed,money:fare+upkeep};
 },fix);
}
// Способ, которым вы правда добираетесь: выбранный транспорт, если он ездит, иначе пешком / велопрокат / общественный
// (так считает transportRoute56).
function current27371(){const z=transportState56(),v=selectedVehicle56();return v?v.id:['walk','share'].includes(z.selected)?z.selected:'public';}
function modes27371(){const list=['public','walk'];if(s.age>=16)list.push('share');for(const v of ownedVehicles56())list.push(v.id);return list;}
function modeName27371(mode){const v=vehicle56(mode);return v?vname27371(v):({public:'общественный транспорт',walk:'пешком',share:'велопрокат'})[mode]||'общественный транспорт';}
function modeHow27371(mode){const v=vehicle56(mode);return v?(car27371(v)?'на машине':'на своём велосипеде'):({walk:'пешком',share:'на велопрокате'})[mode]||'общественным транспортом';}
// Неделя не помещается: с этим способом свободных часов не остаётся, а лучшим разумным способом (общественный транспорт
// или свой исправный) они правда есть — свободные часы после планов или хотя бы часы недели, если планы её уже заняли.
// Если и лучшим способом свободных часов нет (неделя занята работой), серым ничего не становится: дело не в дороге.
function greyWhy27371(o,ref){
 if(!o||o.mode==='public'||!ref||o===ref||!(o.minutes>0)||o.free>0)return '';
 const v=vehicle56(o.mode);if(v&&!vehicleUsable56(v))return '';
 if(!(ref.free>0||o.cap<=0&&ref.cap>0))return '';
 return 'неделя не помещается: '+o.minutes+' мин в одну сторону — свободных часов останется 0';
}
// all=false — только то, что нужно пунктам панели: текущий способ и разумные (общественный и свой исправный транспорт).
function table27371(all=true){
 const out={},sensible=['public',...ownedVehicles56().filter(vehicleUsable56).map(v=>v.id)];
 for(const m of all?modes27371():[...new Set([current27371(),...sensible])])out[m]=option27371(m);
 const sens=sensible.map(m=>out[m]).filter(Boolean);
 const ref=sens.slice().sort((a,b)=>b.free-a.free||a.minutes-b.minutes||a.money-b.money)[0]||out.public;
 for(const o of Object.values(out))o.grey=greyWhy27371(o,ref);
 return {out,ref,sens:sens.filter(o=>!o.grey).sort((a,b)=>b.free-a.free||a.minutes-b.minutes||a.money-b.money)};
}
function optHint27371(o){return o.minutes+' мин · '+hrs27371(o.road)+' · '+money(o.money)+'/мес.';}
// Сравнение двух способов — всегда время и деньги вместе: «17 мин вместо 20 · ≈ 2,8 ч/нед. вместо 3,3 · 112 A$/мес. вместо 91 A$».
function cmp27371(a,b,pre=''){
 const h=x=>hrs27371(x).replace(/^≈ /,'').replace(/ ч\/нед\.$/,'');
 return a.minutes+' мин вместо '+b.minutes+' · '+hrs27371(a.road)+' вместо '+h(b.road)+' · '+pre+money(a.money)+'/мес. вместо '+money(b.money);
}
// Одинаковые модели в одном списке различаются состоянием («Городской велосипед · 77/100»), при равном состоянии — номером.
function marks27371(list,base=vname27371){
 const out=new Map(),n=new Map(),k=new Map();
 for(const v of list)n.set(base(v),(n.get(base(v))||0)+1);
 for(const v of list)out.set(v.id,n.get(base(v))>1?cond27371(v)+'/100':'');
 const full=v=>base(v)+'|'+out.get(v.id),m=new Map();
 for(const v of list)m.set(full(v),(m.get(full(v))||0)+1);
 for(const v of list)if(m.get(full(v))>1){const i=(k.get(full(v))||0)+1;k.set(full(v),i);out.set(v.id,(out.get(v.id)?out.get(v.id)+', ':'')+'№'+i);}
 return out;
}
function label27371(v,marks,base=vname27371){const m=marks?.get(v.id);return base(v)+(m?' · '+m:'');}
function prose27371(v,marks){const m=marks?.get(v.id);return vname27371(v)+(m?' ('+m+')':'');}
// «Сейчас: общественный транспорт · 20 мин · 91 A$/мес.»
function summary27371(){
 try{const cur=current27371(),o=option27371(cur);return 'Сейчас: '+modeName27371(cur)+(o.minutes>0?' · '+o.minutes+' мин · '+money(o.money)+'/мес.':'');}
 catch(e){return '';}
}
// Почему свой транспорт не ездит — по условиям vehicleUsable56 (vehicles56.js), в том же порядке.
function unusableWhy27371(v){
 if(!v)return '';
 if(!mine27371(v))return 'уже не ваш';
 if(!vehicleLocal56(v))return where27371(v)+' — сначала перевезти к себе';
 if(v.damage)return 'нужен ремонт: '+low27371(v.damage);
 if(v.condition<=limit27371)return 'нужен ремонт: состояние '+cond27371(v)+'/100';
 if(v.unfunded)return 'в этом месяце не хватило денег на содержание';
 if(car27371(v)?s.age<18:s.age<12)return car27371(v)?'водить можно с 18 лет':'с 12 лет';
 if(car27371(v)&&!transportState56().licenses.includes(s.country))return 'нет допуска к вождению ('+(countries[s.country]?.name||'')+')';
 return '';
}
// Неделя не помещается для этого способа — причина для серой кнопки и для selectTransport56.
function modeWhy27371(mode){
 if(!s?.transport56||s.dead)return '';
 if(!['walk','share'].includes(mode)&&!vehicle56(mode))return '';
 const v=vehicle56(mode);if(v&&!vehicleUsable56(v))return '';
 const tb=table27371();return tb.out[mode]?.grey||'';
}
function pickMode27371(mode){
 const ok=selectTransport56(mode);
 if(ok){const o=option27371(mode);toast(o.minutes>0?'Теперь до работы '+o.minutes+' мин · '+hrs27371(o.road)+' · '+money(o.money)+'/мес.':'Способ дороги: '+modeName27371(mode)+'.');}
 return ok;
}

// ---------- «Как добираться» ----------

function commuteMenu27371(){
 if(!s||s.dead)return;
 const tb=table27371(),cur=current27371(),pub=tb.out.public,w=s.job?.workplace,counts=pub.minutes>0,own=ownedVehicles56();
 const place=v=>vname27371(v)+(vehicleLocal56(v)?'':' · '+v.city),marks=marks27371(own,place);
 const lines=[];
 if(!s.job)lines.push('Сейчас нет работы — дорога не считается.');
 else if(!counts)lines.push('Сейчас дорога до работы не считается.');
 else lines.push('До работы: '+w.city+(w.country!==s.country?' ('+(countries[w.country]?.name||'')+')':'')+' · '+(w.country!==s.country?'другая страна':w.city!==residenceCity()?'другой город':w.area===s.housing.area?'рядом с домом':'другой район')+'.');
 if(own.length)lines.push('Свой транспорт обходится в '+money(pub.fixed)+'/мес. при любом выборе'+(own.some(car27371)?', бензин — только если ездить на машине':'')+'.');
 const row=(label,mode,extra={})=>{
  const o=tb.out[mode],v=vehicle56(mode),away=v&&!vehicleLocal56(v),bad=v?(away?'сначала перевезти к себе · '+money(transportMoveQuote56(v)):unusableWhy27371(v)):'',why=bad||o?.grey||'',now=mode===cur&&!bad;
  const hint=[now?'сейчас':'',!bad&&counts&&o?optHint27371(o):''].filter(Boolean).join(' · ');
  return {label,hint,disabled:!!why,why:why?cap27371(why):'',fn:()=>pickMode27371(mode),...extra};
 };
 show('Как добираться',lines.join('\n'),[
  row('Общественный транспорт','public'),
  row('Пешком','walk'),
  row('Велопрокат · оплата через проезд до работы','share',{hidden:s.age<16}),
  // Подписи разные у каждого транспорта (город у того, что не здесь; у одинаковых моделей — состояние): причина серой
  // кнопки привязана к подписи (windows273).
  ...own.map(v=>row(label27371(v,marks,place),v.id))
 ]);
}

// ---------- пункты «Ожидают ответа» ----------

function answered27371(mark,place){return !!mark&&mark.place===place&&mark.seq===seq27371();}
function incidentOpen27371(v){
 try{return (s.incidents56?.events||[]).some(q=>q.vehicle===v.id&&decisionActive24({kind:'incident56',id:q.id}));}catch(e){return false;}
}
function idleRows27371(tb=null){
 if(selectedVehicle56())return [];
 const list=ownedVehicles56().filter(v=>vehicleLocal56(v)&&vehicleUsable56(v)&&!answered27371(v.idle27371,place27371(v.country,v.city)));
 if(!list.length)return [];
 tb??=table27371(false);
 const now=tb.out[current27371()];
 if(!(now?.minutes>0))return [];
 return list.map(v=>({v,o:tb.out[v.id],now})).filter(r=>r.o&&!r.o.grey&&r.o.minutes!==r.now.minutes).sort((a,b)=>a.o.minutes-b.o.minutes);
}
function leftRows27371(){
 const home=place27371(s.country,residenceCity());
 return ownedVehicles56().filter(v=>!vehicleLocal56(v)&&!answered27371(v.left27371,home));
}
function repairRow27371(){
 const z=transportState56(),v=vehicle56(z.selected);
 if(!v||!mine27371(v)||!vehicleLocal56(v)||!broken27371(v)||incidentOpen27371(v))return null;
 if(!withMode27371(v.id,()=>vehicleUsable56(v),v.id))return null;
 return v;
}
// Пункты считаются функциями недели и денег, а decisionItems24, dismissKind59 и quickCard59 зовут их за одну
// перерисовку десяток раз: в пределах одной задачи браузера и того же состояния транспорта, работы и недели — один расчёт.
let memo27371=null;
function sig27371(){
 const z=s.transport56,j=s.job,w=j?.workplace,ev=s.incidents56?.events||[];
 return [s.clock.ticks,s.country,s.housing?.city,s.housing?.area,s.housing?.mode,s.age,z.selected,z.moveSeq27371||0,(z.licenses||[]).join(','),
  w?w.country+'/'+w.city+'/'+w.area:'',j?.format||'',j?.professionId||'',s.workHours??'',Math.round(s.clock.fatigue||0),s.illness?1:0,
  (s.clock.tasks||[]).length,ev.length,ev.filter(q=>q.status==='offered').length,
  (z.vehicles||[]).map(v=>[v.id,v.owner,v.status,v.country,v.city,Math.round((+v.condition||0)*100),v.damage||'',v.unfunded?1:0,
   v.idle27371?.place??'',v.idle27371?.seq??'',v.left27371?.place??'',v.left27371?.seq??''].join(':')).join(';')].join('|');
}
function allItems27371(){
 if(!s||s.dead||!s.transport56||s.age<16)return [];
 const k=sig27371();
 if(memo27371?.k===k)return memo27371.items;
 const items=computeItems27371();
 memo27371={k,items};
 queueMicrotask(()=>{if(memo27371?.k===k)memo27371=null;});
 return items;
}
function computeItems27371(){
 const out=[],cur=current27371(),curV=vehicle56(cur);
 let tb=null;
 // 1. Ловушка: пешком, велопрокатом или на своём велосипеде, и неделя не помещается.
 if(cur!=='public'&&!car27371(curV)){
  tb=table27371(false);const o=tb.out[cur];
  if(o?.grey&&o.road>=tb.ref.road+5)out.push({ref:{kind:kind27371,id:'trap'},q:{id:'trap',type:'trap',mode:cur},
   title:'Дорога съедает всю неделю',note:cap27371(modeName27371(cur))+' · '+o.minutes+' мин в одну сторону · свободных часов 0'});
 }
 // 2. Свой исправный транспорт стоит, а вы добираетесь иначе.
 const idle=idleRows27371(tb);
 if(idle.length){
  const r=idle[0],cost=idle.reduce((n,x)=>n+vehicleCost56(x.v).total,0),marks=marks27371(idle.map(x=>x.v));
  out.push({ref:{kind:kind27371,id:'idle'},q:{id:'idle',type:'idle',vehicles:idle.map(x=>x.v.id)},
   title:(idle.length===1?vname27371(r.v)+' стоит без дела':count27371(idle.map(x=>x.v))+' стоят без дела')+' · '+money(cost)+'/мес.',
   note:(idle.length===1?'Ездить '+onIt27371(r.v):label27371(r.v,marks))+' · '+cmp27371(r.o,r.now)});
 }
 // 3. Свой транспорт в другом городе.
 const left=leftRows27371();
 if(left.length){
  const cost=left.reduce((n,v)=>n+vehicleCost56(v).total,0),v=left[0];
  out.push({ref:{kind:kind27371,id:'left'},q:{id:'left',type:'left',vehicles:left.map(v=>v.id)},
   title:(left.length===1?vname27371(v)+' — '+where27371(v):count27371(left)+' в других городах')+' · '+money(cost)+'/мес.',
   note:left.length===1?'Перевезти к себе · '+money(transportMoveQuote56(v))+(s.age>=18?' · продать · '+money(vehicleValue56(v)):''):[...new Set(left.map(v=>v.city))].join(', ')+' — перевезти или продать'});
 }
 // 4. Транспорт, на котором вы ездите, сломан.
 const rv=repairRow27371();
 if(rv){
  const now=option27371(rv.id),fixed=option27371(rv.id,rv.id);
  out.push({ref:{kind:kind27371,id:'repair:'+rv.id},q:{id:'repair:'+rv.id,type:'repair',vehicle:rv.id},
   title:vname27371(rv)+': нужен ремонт · '+(rv.damage?low27371(rv.damage):'состояние '+cond27371(rv)+'/100'),
   note:now.minutes>0?'пока не почините — общественным '+cmp27371(now,fixed):
    'пока не почините, не ездит · содержание '+money(vehicleCost56(rv).total)+'/мес.'});
 }
 return out;
}
function items27371(){
 let list=[];try{list=allItems27371();}catch(e){console.error(e);return [];}
 return list.filter(i=>!(typeof snoozed270==='function'&&snoozed270(i.ref,i.q)));
}
function record27371(id){try{return allItems27371().find(i=>i.ref.id===id)?.q||null;}catch(e){return null;}}

// Ключ темы для «×» — свой у каждого дела транспорта: «×» у велосипедов в Италии не прячет ремонт машины, на которой вы
// ездите, а ремонт — свой у каждого транспорта и снимается, когда его починили или продали (новая поломка видна сразу).
function topicOf27371(id){
 id=String(id||'');
 if(id.startsWith('repair:'))return topic27371+':ремонт:'+id.slice(7);
 return topic27371+':'+(({trap:'ловушка',idle:'стоит',left:'оставлен'})[id]||id);
}
function unsnoozeRepair27371(vid){
 const z=s?.notices59?.snoozed;if(!z)return;
 delete z[kind27371+':repair:'+vid];delete z[topicOf27371('repair:'+vid)];
}
topic270=function(ref,q,...rest){return ref?.kind===kind27371?topicOf27371(ref.id):fixes27371Base.topic270(ref,q,...rest);};
decisionRecord24=function(ref,...rest){return ref?.kind===kind27371?record27371(ref.id):fixes27371Base.decisionRecord24.call(this,ref,...rest);};
decisionActive24=function(ref,...rest){
 if(ref?.kind===kind27371)return !!(s&&!s.dead&&record27371(ref.id));
 if(ref?.kind==='incident56'&&s?.incidents56){
  // Поломка закрыта, если транспорт уже отремонтирован, продан или передан.
  const q=s.incidents56.events.find(q=>q.id===ref.id);
  if(q?.kind==='breakdown'){const v=vehicle56(q.vehicle);return activeIncident56(q)&&broken27371(v);}
 }
 return fixes27371Base.decisionActive24.call(this,ref,...rest);
};
decisionItems24=function(...args){
 const base=fixes27371Base.decisionItems24.apply(this,args);
 if(!s||s.dead||!s.transport56)return base;
 const mine=items27371();
 // Поломка в дороге — свой выбор в подписи, а не общий «Выбрать помощь и следующий шаг».
 const list=base.map(i=>{
  if(i?.ref?.kind!=='incident56'||i.q?.kind!=='breakdown')return i;
  try{const v=vehicle56(i.q.vehicle);return broken27371(v)?{...i,note:'Отремонтировать · '+money(vehicleRepairQuote56(v))+' или пока не чинить'}:i;}catch(e){return i;}
 });
 return [...mine.filter(i=>i.q.type==='trap'),...list,...mine.filter(i=>i.q.type!=='trap')];
};
openDecision24=function(kind,id,...rest){
 if(kind!==kind27371)return fixes27371Base.openDecision24.call(this,kind,id,...rest);
 const q=record27371(id);
 if(!q)return toast('Это решение уже не нужно.');
 if(q.type==='trap')return trapMenu27371();
 if(q.type==='idle')return idleMenu27371();
 if(q.type==='left')return leftMenu27371();
 if(q.type==='repair')return repairMenu27371(q.vehicle);
};

// ---------- окна пунктов ----------

function trapMenu27371(){
 const tb=table27371(),cur=current27371(),o=tb.out[cur],w=s.job?.workplace;
 if(!o||!w)return commuteMenu27371();
 const lines=['Работа — в городе '+w.city+', а добираетесь вы '+modeHow27371(cur)+': '+o.minutes+' мин в одну сторону, на дорогу уходит '+Math.round(o.road)+' ч в неделю'+
  '. Свободных часов в неделе не остаётся: занятия стоят, усталость растёт быстрее.','Сейчас в месяц на транспорт '+money(o.money)+'.',
  'Можно так — минуты в одну сторону, дорога за неделю, свободное время и деньги в месяц на проезд и свой транспорт:'];
 const opts=tb.sens.map((x,i)=>({label:x.mode==='public'?'Ездить общественным транспортом':'Ездить: '+modeName27371(x.mode),
  hint:x.minutes+' мин · '+hrs27371(x.road)+' · свободно '+Math.max(0,Math.round(x.free))+' ч · '+money(x.money)+'/мес.'+(i===0?' · лучше для недели':''),
  fn:()=>pickMode27371(x.mode)}));
 show('Дорога съедает всю неделю',lines.join('\n'),[...opts,{label:'Все способы дороги',fn:commuteMenu27371}]);
}
function keepIdle27371(ids){
 for(const id of ids){const v=vehicle56(id);if(v)v.idle27371={place:place27371(v.country,v.city),seq:seq27371(),tick:s.clock.ticks};}
 save();render();
}
function idleMenu27371(){
 const rows=idleRows27371();
 if(!rows.length)return toast('Это решение уже не нужно.');
 const now=rows[0].now,cur=current27371(),one=rows.length===1,v0=rows[0].v,marks=marks27371(rows.map(r=>r.v));
 const lines=[];
 for(const {v,o} of rows){
  const k=vehicleCost56(v);
  lines.push(prose27371(v,marks)+' '+(car27371(v)?'исправна':'исправен')+' и стоит '+where27371(v)+'. Содержание '+money(k.total)+'/мес. списывается, и когда '+(car27371(v)?'она стоит':'он стоит')+'.');
  lines.push('Если ездить '+onIt27371(v)+': '+o.minutes+' мин вместо '+now.minutes+', дорога '+hrs27371(o.road)+' вместо '+hrs27371(now.road).replace('≈ ','')+', в месяц на транспорт '+money(o.money)+' вместо '+money(now.money)+'.');
 }
 lines.splice(rows.length===1?1:0,0,'На работу сейчас — '+modeHow27371(cur)+': '+now.minutes+' мин в одну сторону, '+hrs27371(now.road)+', в месяц на транспорт '+money(now.money)+'.');
 const opts=[];
 for(const {v,o} of rows){
  opts.push({label:(one?'Ездить '+onIt27371(v):'Ездить: '+label27371(v,marks))+' · '+o.minutes+' мин вместо '+now.minutes,
   hint:'в месяц на транспорт '+money(o.money)+' вместо '+money(now.money)+' · дорога '+hrs27371(o.road),fn:()=>pickMode27371(v.id)});
 }
 for(const {v} of rows)opts.push(sellOpt27371(v,one?'Продать':'Продать: '+label27371(v,marks)));
 opts.push({label:'Оставить как есть',hint:'дальше — '+modeName27371(cur)+'; до следующего переезда вопроса не будет',fn:()=>keepIdle27371(rows.map(r=>r.v.id))});
 if(one)opts.push({label:car27371(v0)?'Карточка машины':'Карточка велосипеда',fn:()=>vehicleCard56(v0.id)});
 show(one?vname27371(v0)+' стоит без дела':cap27371(count27371(rows.map(r=>r.v)))+' стоят без дела',lines.join('\n'),opts);
}
function keepLeft27371(ids){
 for(const id of ids){const v=vehicle56(id);if(v)v.left27371={place:place27371(s.country,residenceCity()),seq:seq27371(),tick:s.clock.ticks};}
 save();render();
}
function bringOpt27371(v){
 const fee=transportMoveQuote56(v),cash=expenseAvailable231();
 return {label:'Перевезти к себе · '+money(fee),disabled:cash+.001<fee,why:cash+.001<fee?'Не хватает '+money(fee-Math.max(0,cash)):'',
  fn:()=>{if(bringVehicle56(v.id))toast('Перевезли: '+vname27371(v)+' · теперь в городе '+v.city+'.');}};
}
function sellOpt27371(v,label='Продать'){
 const sale=vehicleValue56(v),d=vehicleDebt56(v),debt=d?d.balance*debtRatio(d):0,short=Math.max(0,s.cash)+sale+.001<debt;
 return {label:label+' · '+money(sale),hidden:s.age<18,disabled:short,why:short?'Выручки и денег не хватит, чтобы закрыть кредит '+money(debt):'',fn:()=>sellConfirm27371(v.id)};
}
// «Продать …?» — что изменится: деньги на руки и дорога, если вы на нём ездите.
function sellConfirm27371(id,after=null){
 const v=vehicle56(id);if(!mine27371(v))return;
 const sale=vehicleValue56(v),d=vehicleDebt56(v),debt=d?d.balance*debtRatio(d):0,lines=[];
 lines.push(debt>0?'Выручка '+money(sale)+', кредит '+money(debt)+' погасится из сделки — на руки '+money(Math.max(0,sale-debt))+'.':'Получите '+money(sale)+' на руки.');
 if(selectedVehicle56()===v){
  // После продажи: общественный транспорт, а содержания этого транспорта больше нет.
  const a=option27371(v.id),b=option27371('public'),gone=withMode27371('public',()=>vehicleCost56(v).total);
  if(a.minutes>0)lines.push('Дорога: '+b.minutes+' мин общественным вместо '+a.minutes+', в месяц на транспорт '+money(b.money-gone)+' вместо '+money(a.money)+'.');
 }
 else lines.push('Содержание '+money(vehicleCost56(v).total)+'/мес. больше не будет списываться.');
 show('Продать '+vname27371(v)+'?',lines.join('\n'),[{label:'Подтвердить продажу',fn:()=>{if(sellVehicle56(id))after?.();}},{label:'Назад',fn:()=>vehicleCard56(id)}]);
}
function leftOne27371(v){
 const k=vehicleCost56(v),sale=vehicleValue56(v),fee=transportMoveQuote56(v),car=car27371(v),lines=[];
 lines.push(vname27371(v)+' стоит '+where27371(v)+', а вы живёте в городе '+residenceCity()+'. Содержание '+money(k.total)+'/мес. списывается, пока транспорт ваш.');
 lines.push((car?'Сама машина стоит ':'Сам велосипед стоит ')+money(sale)+', перевезти к себе — '+money(fee)+'.'+(fee>sale?' Перевозка дороже самого транспорта.':''));
 if(car&&!transportState56().licenses.includes(s.country))lines.push('Чтобы ездить здесь, нужен местный допуск к вождению — его пока нет.');
 show(vname27371(v)+' — '+where27371(v),lines.join('\n'),[bringOpt27371(v),sellOpt27371(v),
  {label:'Пусть стоит там',hint:'содержание '+money(k.total)+'/мес. продолжит списываться',fn:()=>keepLeft27371([v.id])},
  {label:car?'Карточка машины':'Карточка велосипеда',fn:()=>vehicleCard56(v.id)}]);
}
function leftMenu27371(){
 const left=leftRows27371();
 if(!left.length)return toast('Это решение уже не нужно.');
 if(left.length===1)return leftOne27371(left[0]);
 const cost=left.reduce((n,v)=>n+vehicleCost56(v).total,0),place=v=>vname27371(v)+' · '+v.city,marks=marks27371(left,place);
 show(cap27371(count27371(left))+' в других городах',
  'Свой транспорт остался там, где вы жили раньше. Вместе он обходится в '+money(cost)+'/мес. — содержание списывается, пока транспорт ваш.',
  [...left.map(v=>({label:label27371(v,marks,place),hint:money(vehicleCost56(v).total)+'/мес. · стоит '+money(vehicleValue56(v))+' · перевезти — '+money(transportMoveQuote56(v)),fn:()=>leftOne27371(v)})),
   {label:'Пусть всё стоит там',hint:'содержание '+money(cost)+'/мес. продолжит списываться',fn:()=>keepLeft27371(left.map(v=>v.id))}]);
}
// «Ремонт 373 A$ — сама машина стоит 36 A$» — когда ремонт дороже самого транспорта.
function repairLine27371(v){
 const rq=vehicleRepairQuote56(v),sale=vehicleValue56(v);
 if(!(rq>sale))return '';
 const after=withMode27371(v.id,()=>vehicleValue56(v),v.id);
 return 'Ремонт '+money(rq)+' — '+(car27371(v)?'сама машина':'сам велосипед')+' стоит '+money(sale)+(after>sale+.5?' (после ремонта — около '+money(after)+')':'')+'.';
}
function repair27371(id){
 const v=vehicle56(id);if(!mine27371(v))return false;
 const cost=vehicleRepairQuote56(v),ok=vehicleRepair56(id);
 if(ok){
  for(const q of s.incidents56?.events||[])if(q.vehicle===id&&q.kind==='breakdown'&&q.status==='offered'){q.status='answered';q.choice='repair';q.answered=s.clock.ticks;}
  log('Ремонт транспорта',vname27371(v)+': '+money(cost)+', состояние '+cond27371(v)+'/100.','Имущество');save();
  toast('Отремонтировано: '+vname27371(v)+' · состояние '+cond27371(v)+'/100.');
 }
 return ok;
}
function repairOpt27371(v){
 const rq=vehicleRepairQuote56(v),cash=expenseAvailable231();
 return {label:'Отремонтировать · '+money(rq),disabled:cash+.001<rq,why:cash+.001<rq?'Не хватает '+money(rq-Math.max(0,cash)):'',fn:()=>repair27371(v.id)};
}
// Строка «пока не почините …» — время и деньги вместе. tail=false — без слов о содержании (в карточке о нём своя строка).
function fallbackLine27371(v,tail=true){
 const now=option27371(v.id),fixed=option27371(v.id,v.id),k=vehicleCost56(v),selected=transportState56().selected===v.id,still=car27371(v)?'она стоит':'он стоит';
 if(!selected)return tail?'Содержание '+money(k.total)+'/мес. списывается и пока '+still+'.':'';
 if(!(now.minutes>0))return tail?'Работы с дорогой сейчас нет; содержание '+money(k.total)+'/мес. списывается, пока '+still+'.':'';
 return 'Пока не почините, ездите общественным: дорога '+now.minutes+' мин вместо '+fixed.minutes+', '+hrs27371(now.road)+' вместо '+hrs27371(fixed.road).replace('≈ ','')+
  ', в месяц на транспорт '+money(now.money)+' вместо '+money(fixed.money)+(tail?' — содержание '+money(k.total)+' списывается и пока '+still:'')+'.';
}
function repairMenu27371(id){
 const v=vehicle56(id);
 if(!broken27371(v))return toast('Это решение уже не нужно.');
 const lines=[(v.damage?cap27371(low27371(v.damage))+', состояние '+cond27371(v)+'/100':'Состояние '+cond27371(v)+'/100')+' — '+noun27371(v)+' не ездит, пока не почините (ездить можно при состоянии выше '+limit27371+').',fallbackLine27371(v)];
 const line=repairLine27371(v);if(line)lines.push(line);
 const opts=[repairOpt27371(v),sellOpt27371(v,'Продать как есть')];
 if(transportState56().selected===v.id)opts.push({label:'Не чинить, ездить общественным',hint:(()=>{const o=option27371('public');return o.minutes>0?optHint27371(o):'';})(),fn:()=>pickMode27371('public')});
 opts.push({label:car27371(v)?'Карточка машины':'Карточка велосипеда',fn:()=>vehicleCard56(v.id)});
 show(vname27371(v)+': нужен ремонт',lines.join('\n'),opts);
}

// ---------- выбор дороги ----------

selectTransport56=function(mode,...rest){
 if(s&&!s.dead&&s.transport56){const why=modeWhy27371(mode);if(why){toast(cap27371(why)+'.');return false;}}
 const ok=fixes27371Base.selectTransport56.call(this,mode,...rest);
 if(ok&&s?.transport56){
  // Выбор способа дороги — ответ и про остальной исправный транспорт в вашем городе (до следующего переезда).
  for(const v of ownedVehicles56())if(v.id!==mode&&vehicleLocal56(v)&&vehicleUsable56(v))v.idle27371={place:place27371(v.country,v.city),seq:seq27371(),tick:s.clock.ticks};
  save();
 }
 return ok;
};
// Покупка: buyVehicle56 сам ставит купленный транспорт на дорогу до работы, мимо selectTransport56. Если на нём неделя
// не помещается (велосипед до работы в другом городе), дорога остаётся прежней — и это сказано в сообщении и в записи.
buyVehicle56=function(id,credit=false,...rest){
 const z=s?.transport56?transportState56():null,prev=z?.selected;
 const v=fixes27371Base.buyVehicle56.call(this,id,credit,...rest);
 if(!v||!z||gift27371>0||z.selected!==v.id||prev===v.id)return v;
 let why='';try{why=modeWhy27371(v.id);}catch(e){console.error(e);}
 if(!why)return v;
 z.selected=prev??'public';
 const name=vname27371(v),o=option27371(v.id),text='На работу — как раньше, '+modeHow27371(current27371())+': '+onIt27371(v)+' дорога '+o.minutes+
  ' мин в одну сторону, свободных часов в неделе не осталось бы.';
 try{const e=(s.log||[]).slice(0,6).find(e=>e.title==='Транспорт приобретён'&&String(e.text||'').startsWith(name));if(e)e.text+=' '+text;}catch(e){console.error(e);}
 toast(name+(car27371(v)?' куплена. ':' куплен. ')+text);
 save();render();
 return v;
};
// Продолжить за близкого (continue274.js) ставит на дорогу первый свой транспорт без проверки — та же защита.
if(fixes27371Base.transformLife274)transformLife274=function(F,...rest){
 const out=fixes27371Base.transformLife274.call(this,F,...rest);
 try{
  const z=F?.transport56;
  if(s===F&&z&&vehicle56(z.selected)&&modeWhy27371(z.selected))z.selected='public';
 }catch(e){console.error(e);}
 return out;
};
// Ремонт: отложенный «×» пункт «нужен ремонт» этого транспорта снимается — новая поломка видна сразу.
vehicleRepair56=function(id,...rest){
 const ok=fixes27371Base.vehicleRepair56.call(this,id,...rest);
 if(ok)try{unsnoozeRepair27371(id);}catch(e){console.error(e);}
 return ok;
};
// Перевозка: в истории транспорта — откуда (город, страна не склоняется), в записи — без «игрового» допуска.
bringVehicle56=function(id,...rest){
 const v=s?.transport56?vehicle56(id):null,from=v?{city:v.city,country:v.country}:null;
 const ok=fixes27371Base.bringVehicle56.call(this,id,...rest);
 if(ok&&v&&from){
  try{
   const h=v.history.at(-1);
   if(h&&/^Перевезён из /.test(h.text))h.text=h.text.replace(/^Перевезён из .+? за /,'Перевезён из города '+from.city+(from.country!==s.country?' ('+(countries[from.country]?.name||'')+')':'')+' за ');
   const e=(s.log||[]).slice(0,6).find(e=>e.title==='Транспорт доставлен'&&/игровой допуск/.test(e.text||''));
   if(e)e.text=e.text.replace('Для вождения нужен местный игровой допуск.','Чтобы ездить, нужен местный допуск к вождению.');
  }catch(e){console.error(e);}
  save();
 }
 return ok;
};
// Переезд: вопрос о стоящем и оставленном транспорте задаётся заново.
observeTransportMove56=function(...args){
 const z=s?.transport56,moved=!!z&&(z.country!==s.country||z.city!==residenceCity());
 const out=fixes27371Base.observeTransportMove56.apply(this,args);
 if(moved)z.moveSeq27371=(z.moveSeq27371||0)+1;
 return out;
};

// ---------- «Транспорт домохозяйства» ----------

// Причина на вашей стороне — проверяется при каждом показе и без даты: исправили — можно спросить сразу.
function askLiveWhy27371(){
 const z=transportState56();
 if(z.gifts.some(q=>q.status==='offered'))return 'сначала ответьте на предложение подарка';
 if(ownedVehicles56().length>=5)return 'у вас уже пять единиц транспорта';
 return '';
}
// Причина на стороне родителя — её запоминают на 12 месяцев.
function askWhy27371(p){
 const z=transportState56();
 const list=z.vehicles.filter(v=>v.owner===p.id&&v.status==='owned');
 if(!list.length)return p.name+': своего транспорта нет';
 const ok=list.filter(v=>v.condition>limit27371);
 if(!ok.length)return p.name+': '+vname27371(list[0])+' в плохом состоянии ('+cond27371(list[0])+'/100), передавать нечего';
 const d=ok.find(v=>vehicleDebt56(v));
 if(d&&ok.every(v=>vehicleDebt56(v)))return p.name+': за '+vname27371(d)+' не погашен кредит';
 return p.name+': пока не '+(p.gender==='f'?'готова':'готов')+' передать транспорт';
}
function askState27371(p){
 const z=transportState56(),t=s.clock.ticks,retry=z.retry?.[p.id]||0,a=z.ask27371?.[p.id];
 if(t<retry){
  const last=z.gifts.filter(q=>q.parent===p.id).at(-1);
  const why=last?.status==='offered'?'предложение уже есть — ответьте на него':last?.status==='declinedByParent'?p.name+': пока оставляет транспорт себе':'вы уже спрашивали';
  return {until:retry,why};
 }
 if(a&&t<a.until&&a.side==='parent')return a;
 return null;
}
function askOpt27371(o,p){
 const live=askLiveWhy27371(),st=live?null:askState27371(p),orig=o.fn;
 const why=live?cap27371(live)+'.':st?cap27371(st.why)+'. Спросить снова можно '+when27371(st.until):'';
 return {...o,disabled:!!o.disabled||!!why,why:o.disabled&&!why?o.why||'':why,fn:()=>{
  const z=transportState56(),n=z.gifts.length,keep=toast;
  toast=function(){};
  try{orig?.();}finally{toast=keep;}
  const q=z.gifts.length>n?z.gifts.at(-1):null;
  if(q?.status==='offered')return;
  const mine=askLiveWhy27371();
  if(q){toast(p.name+': пока оставляет транспорт себе. Спросить снова можно '+when27371(z.retry[p.id])+'.');}
  else if(mine)toast(cap27371(mine)+'.');
  else{
   const reason=askWhy27371(p),until=s.clock.ticks+12;
   (z.ask27371??={})[p.id]={until,why:reason,tick:s.clock.ticks,side:'parent'};save();
   toast(cap27371(reason)+'. Спросить снова можно '+when27371(until)+'.');
  }
  transportMenu56();
 }};
}
transportMenu56=function(...args){
 if(!s||s.dead||!s.transport56)return fixes27371Base.transportMenu56.apply(this,args);
 const old=show,own=ownedVehicles56(),asks=parents17().filter(p=>p.alive&&p.inner.trust>=55);
 show=function(title,text,opts=[],...more){
  show=old;
  let list=opts;
  try{
   let k=0;
   list=opts.map(o=>{
    if(!o||typeof o.label!=='string')return o;
    const v=own[k];
    if(v&&o.label===vname27371(v)&&typeof o.fn==='function'){
     k++;
     const mark=broken27371(v)?' · нужен ремонт':vehicleLocal56(v)&&v.condition<=soft27371?' · скоро ремонт':'';
     return {...o,hint:v.city+' · '+cond27371(v)+'/100'+mark+(selectedVehicle56()===v?' · ездите на работу':'')};
    }
    if(o.label==='Выбрать способ регулярных поездок')return {...o,hint:summary27371(),fn:commuteMenu27371};
    if(o.label.startsWith('Спросить про старый транспорт · ')){
     const p=asks.find(p=>o.label==='Спросить про старый транспорт · '+p.name);
     return p?askOpt27371(o,p):o;
    }
    return o;
   });
  }catch(e){console.error(e);list=opts;}
  return old.call(this,title,text,list,...more);
 };
 try{return fixes27371Base.transportMenu56.apply(this,args);}finally{show=old;}
};

// ---------- карточка своего транспорта ----------

vehicleCard56=function(id,...args){
 const v=s?.transport56?vehicle56(id):null;
 if(!mine27371(v))return fixes27371Base.vehicleCard56.call(this,id,...args);
 const old=show,name=vname27371(v);
 show=function(title,text,opts=[],...more){
  show=old;
  let body=text,list=opts;
  try{
   const car=car27371(v),cur=current27371(),k=vehicleCost56(v),usable=vehicleUsable56(v),selected=selectedVehicle56()===v;
   const commute=option27371(cur).minutes>0;
   const lines=[];
   if(vehicleLocal56(v)){
    if(broken27371(v)){const f=fallbackLine27371(v,false);lines.push('Не ездит: '+(v.damage?low27371(v.damage):'состояние '+cond27371(v)+'/100')+' — нужен ремонт.'+(f?' '+f:''));}
    else if(!usable){const w=unusableWhy27371(v);if(w)lines.push('Не ездит: '+w+'.');}
    else if(selected&&commute)lines.push('Ездите на работу: '+option27371(v.id).minutes+' мин в одну сторону.');
    else if(commute)lines.push('Стоит без дела — на работу вы '+(cur==='walk'?'ходите пешком':'ездите '+modeHow27371(cur))+'.');
    if(!broken27371(v)&&v.condition<=soft27371)lines.push('Скоро понадобится ремонт: при '+limit27371+'/100 и ниже '+noun27371(v)+' не ездит, а пока чаще ломается в дороге.');
   }
   if(v.damage||v.condition<99){const r=repairLine27371(v);if(r)lines.push(r);}
   // Содержание: постоянная часть — и когда транспорт стоит, бензин — только в поездках на работу.
   const drive=usable&&commute?withMode27371(v.id,()=>vehicleCost56(v).total):null;
   const upkeep=selected&&commute?'Содержание '+money(k.total)+'/мес. вместе с поездками на работу; без них — '+money(k.fixed)+'.':
    'Содержание '+money(k.total)+'/мес. — списывается, и когда '+noun27371(v)+' стоит'+(drive!=null&&drive>k.total+.5?'; если ездить на работу — '+money(drive)+' в месяц':'')+'.';
   body=String(text).replace(/состояние \d+\/100/,'состояние '+cond27371(v)+'/100').replace(/Содержание около [^\n]*?\/мес\., топливо и парковка учтены\./,upkeep)
    .replace('Для вождения нужен игровой допуск страны.','Для вождения нужен допуск к вождению в стране, где вы живёте.')
    // Старые записи перевозки: «Перевезён из Италия» — страна не склоняется, на экране «из страны Италия» (данные те же).
    .replace(/^Перевезён из (?!города |страны )(.+?) за /gm,'Перевезён из страны $1 за ');
   if(lines.length){const at=body.indexOf('\n');body=at<0?body+'\n'+lines.join('\n'):body.slice(0,at)+'\n'+lines.join('\n')+body.slice(at);}
   list=opts.map(o=>{
    if(!o||typeof o.label!=='string')return o;
    if(o.label==='Использовать для регулярных поездок'){
     const why=unusableWhy27371(v)||modeWhy27371(v.id);
     if(why)return {...o,disabled:true,why:cap27371(why)};
     if(selected)return {...o,hint:'сейчас'+(commute?' · '+option27371(v.id).minutes+' мин':'')};
     if(!commute)return o;
     const a=option27371(v.id),b=option27371(cur);
     return {...o,hint:cmp27371(a,b,'в месяц на транспорт ')};
    }
    if(o.label.startsWith('Ремонт / обслуживание · ')&&o.disabled&&!(!v.damage&&v.condition>=99)){
     const rq=vehicleRepairQuote56(v);return {...o,why:'Не хватает '+money(rq-Math.max(0,expenseAvailable231()))};
    }
    return o;
   });
  }catch(e){console.error(e);body=text;list=opts;}
  return old.call(this,title,body,list,...more);
 };
 try{return fixes27371Base.vehicleCard56.call(this,id,...args);}finally{show=old;}
};

// ---------- износ и поломка в дороге ----------

// Транспорт, на котором вы ездите, дошёл до порога — запись в «Истории» (раз, пока не починят).
transportMonth56=function(...args){
 const z=s?.transport56,watch=z?ownedVehicles56().filter(v=>v.condition>limit27371&&!v.damage).map(v=>v.id):[];
 const out=fixes27371Base.transportMonth56.apply(this,args);
 try{
  for(const id of watch){
   const v=vehicle56(id);
   if(mine27371(v)&&vehicleLocal56(v)&&v.condition<=limit27371&&z.selected===v.id)
    log(vname27371(v)+': нужен ремонт','Состояние '+cond27371(v)+'/100 — пока не почините, '+noun27371(v)+' не ездит. На работу — общественным транспортом; содержание списывается.','Транспорт');
  }
 }catch(e){console.error(e);}
 return out;
};
// Шанс поломки в месяц: выше 35 — нет; с 35 до 26 у машины растёт с 8% до 40%, у велосипеда — с 3% до 14%. Вместе с
// отступом в 6 месяцев между происшествиями (incidents56) прогоном (30 лет, два зерна): машина, которую держат на 26–35
// и на которой ездят на работу, ломается 1,1–1,3 раза в год, велосипед — 0,5–0,6; при 60–90 — ни разу.
function breakdownChance27371(v){
 if(!mine27371(v)||v.damage)return 0;
 const c=+v.condition;if(!(c>limit27371&&c<=soft27371))return 0;
 const k=(soft27371-c)/(soft27371-limit27371);
 return (car27371(v)?1:.35)*(.08+.32*k);
}
// Транспорт правда везёт вас на работу в этом месяце: выбран, исправен, работа с дорогой и маршрут — на нём.
function drivenToWork27371(v){
 if(!v||selectedVehicle56()!==v||!s.job?.workplace||s.job.format==='remote')return false;
 if(typeof parentalLeave54==='function'&&parentalLeave54('player'))return false;
 const r=transportRoute56(jobRoute27371());return r.mode===v.kind&&r.minutes>0;
}
function createBreakdown27371(v){
 const z=incidents56(),car=car27371(v),t=s.clock.ticks,name=vname27371(v);
 v.damage='Поломка в дороге';v.condition=Math.max(10,v.condition-3);
 const cost=c().cost*(car?.004:.0006),paid=payExpense23(cost,car?'Эвакуатор':'Такси после поломки','breakdown27371:'+v.id+':'+t);
 if(paid)s.clock.spent+=cost;else s.clock.fatigue=clamp(s.clock.fatigue+3);
 const co=s.job?.company18;if(co&&Number.isFinite(co.performance))co.performance=Math.max(0,co.performance-1);
 const text=(car?'По дороге на работу машина сломалась — дальше своим ходом не доехать. ':'По дороге на работу велосипед сломался — дальше на нём не доехать. ')+
  (paid?(car?'Эвакуатор — '+money(cost)+'. ':'До работы — на такси, '+money(cost)+'. '):(car?'На эвакуатор денег не хватило — машину пришлось оставить и вернуться за ней позже. ':'На такси денег не хватило — дальше пешком. '))+
  'На работу вы опоздали.';
 const q={id:id16('incident'),kind:'breakdown',title:name+': поломка в дороге',status:'offered',created:t,expires:t+2,country:s.country,city:residenceCity(),
  rolls:[],actions:[],fee:0,vehicle:v.id,tow27371:paid?cost:0,text};
 v.history.push({tick:t,text:'Поломка в дороге'+(paid?' · '+(car?'эвакуатор ':'такси ')+money(cost):'')});
 z.lastEvent=t;z.events.push(q);s.clock.running=false;
 log(q.title,text,'Происшествие',true,{kind:'incident56',id:q.id});save();
 return q;
}
function breakdownMonth27371(){
 if(!s||s.dead||!s.transport56||!s.incidents56||s.age<12)return;
 const z=incidents56(),v=selectedVehicle56();
 if(!drivenToWork27371(v))return;
 if(z.events.some(q=>q.status==='offered')||s.clock.ticks-z.lastEvent<6)return;
 if(travelActive52()?.status==='away'||languageStayActive53()?.status==='away')return;
 const p=breakdownChance27371(v);
 if(!(p>0)||Math.random()>=p)return;
 const q=createBreakdown27371(v);
 if(q&&!$('#modal').open&&!s.pending.length)incidentMenu56(q.id);
}
autonomousMonth=function(...args){
 const out=fixes27371Base.autonomousMonth.apply(this,args);
 try{breakdownMonth27371();}catch(e){console.error(e);}
 return out;
};
function resolveBreakdown27371(id,choice){
 const q=s.incidents56?.events?.find(q=>q.id===id);
 if(!q||q.kind!=='breakdown'||s.dead)return false;
 const v=vehicle56(q.vehicle);
 if(choice==='repair'){if(!repair27371(q.vehicle))return false;}
 else if(choice!=='later')return false;
 else if(!activeIncident56(q))return false;
 if(q.status==='offered'){q.status='answered';q.choice=choice;q.answered=s.clock.ticks;q.actions.push({choice,tick:s.clock.ticks});}
 if(choice==='later')log('После происшествия',q.title+': ремонт отложен. Пока не почините, на работу — общественным транспортом.','Происшествие');
 save();render();return true;
}
resolveIncident56=function(id,choice,...rest){
 const q=s?.incidents56?.events?.find(q=>q.id===id);
 return q?.kind==='breakdown'?resolveBreakdown27371(id,choice):fixes27371Base.resolveIncident56.call(this,id,choice,...rest);
};
incidentMenu56=function(id,...rest){
 const q=s?.incidents56?.events?.find(q=>q.id===id);
 if(q?.kind!=='breakdown')return fixes27371Base.incidentMenu56.call(this,id,...rest);
 const v=vehicle56(q.vehicle),broken=broken27371(v),active=activeIncident56(q),lines=[q.text];
 if(broken){lines.push(fallbackLine27371(v));const r=repairLine27371(v);if(r)lines.push(r);}
 else lines.push(mine27371(v)?'Уже отремонтировано.':'Этого транспорта у вас больше нет.');
 if(active&&broken&&typeof untilMonth273==='function')lines.push('Ответить можно '+untilMonth273(q.expires)+'.');
 const opts=[];
 if(broken){
  opts.push({...repairOpt27371(v),fn:()=>resolveBreakdown27371(id,'repair')});
  opts.push({label:'Пока не чинить',disabled:!active,why:active?'':'Решение уже принято',fn:()=>resolveBreakdown27371(id,'later')});
  opts.push(sellOpt27371(v,'Продать как есть'));
 }
 if(v)opts.push({label:car27371(v)?'Карточка машины':'Карточка велосипеда',fn:()=>vehicleCard56(v.id)});
 opts.push({label:'Все происшествия и поиски',fn:incidentsMenu56});
 show(q.title,lines.join('\n'),opts);
};

// «Происшествия и поиски»: под каждым — состояние словами, а не служебное «answered» / «expired».
const incidentStatus27371={offered:'ждёт ответа',waiting:'ждёт ответа',answered:'решено',acknowledged:'решено',completed:'решено',expired:'срок ответа прошёл',
 searching:'поиск продолжается',found:'найден, ожидает перевозки',returned:'вернулся домой',recovering:'восстановление',stolen:'украдено'};
incidentsMenu56=function(...args){
 const old=show;
 show=function(title,text,opts=[],...more){
  show=old;
  let list=opts;
  try{
   if(title==='Происшествия и поиски'&&s?.incidents56){
    const events=incidents56().events.slice().reverse().slice(0,30);
    list=opts.map((o,i)=>{
     const q=events[i];if(!o||!q||o.label!==q.title)return o;
     const raw=q.kind==='petEscape'?(q.searchStatus||q.status):q.status,word=incidentStatus27371[raw]??'';
     const st=q.kind==='breakdown'&&q.status==='answered'?(broken27371(vehicle56(q.vehicle))?'ремонт отложен':'решено'):word;
     let at='';try{at=Number.isFinite(q.created)?String(dateLabel86(q.created)).toLowerCase():'';}catch(e){}
     return {...o,hint:[st,at].filter(Boolean).join(' · ')};
    });
   }
  }catch(e){console.error(e);list=opts;}
  return old.call(this,title,text,list,...more);
 };
 try{return fixes27371Base.incidentsMenu56.apply(this,args);}finally{show=old;}
};

// ---------- подарок ребёнку ----------

let gift27371=0;
purchaseWhy56=function(q,credit=false,...rest){
 const why=fixes27371Base.purchaseWhy56.call(this,q,credit,...rest);
 return gift27371>0&&Array.isArray(why)?why.filter(w=>w!==limitWhy27371):why;
};
giftMarket61=function(...args){gift27371++;try{return fixes27371Base.giftMarket61.apply(this,args);}finally{gift27371--;}};
buyGiftVehicle61=function(child,offer,...rest){
 if(!s?.transport56)return fixes27371Base.buyGiftVehicle61.call(this,child,offer,...rest);
 const z=transportState56(),sel=z.selected,before=new Set(z.vehicles.map(v=>v.id));
 let ok=false;gift27371++;
 try{ok=fixes27371Base.buyGiftVehicle61.call(this,child,offer,...rest);}finally{gift27371--;}
 const fresh=z.vehicles.filter(v=>!before.has(v.id));
 // Купили, а передать не вышло: транспорт всё равно уходит ребёнку — иначе у вас стало бы больше пяти.
 const p=living(child);
 for(const v of fresh)if(mine27371(v)&&p&&ownedVehicles56().length>5){
  v.owner=p.id;v.gift61={payer:'player',child:p.id};v.history.push({tick:s.clock.ticks,text:'Передано: '+p.name});ok=true;
 }
 // Подарок не меняет вашу дорогу: buyVehicle56 выбирал его для вас, giveVehicle56 потом ставил общественный транспорт.
 if(z.selected!==sel&&!fresh.some(v=>v.id===sel))z.selected=sel;
 if(fresh.length){save();render();}
 return ok;
};

// ---------- раздел «Поездки и переезд» и поиск ----------

travelHub65=function(...args){
 const old=show;
 show=function(title,text,opts=[],...more){
  show=old;
  const list=title==='Поездки и переезд'&&s&&s.age>=12?[...opts,{label:'Машины, велосипеды и дорога до работы',hint:summary27371(),fn:transportMenu56}]:opts;
  return old.call(this,title,text,list,...more);
 };
 try{return fixes27371Base.travelHub65.apply(this,args);}finally{show=old;}
};
actionCatalog24=function(...args){
 return fixes27371Base.actionCatalog24.apply(this,args).map(a=>a?.id==='transport56'?{...a,group:'Переезды',keywords:(a.keywords||'')+' дорога до работы добираться пешком велопрокат ремонт машины'}:a);
};
