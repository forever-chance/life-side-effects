'use strict';
// Сборка 275.8: три бага из игры владелицы.
//
// 1. Причина смерти. Смерть решает mortality258() раз в год: риск растёт с возрастом и с тем, насколько сглаженное
//    здоровье (s.healthTrend258) ниже обычного. Диагноза игра не выбирает — его выбирает эта строка, конкретный
//    (решение владелицы 26.11), по тому, что игра знает в момент смерти, и по зерну жизни (visualHash49: при
//    перезагрузке не меняется):
//    • 100 лет (смерть обязательна) — «старость»;
//    • тяжёлая болезнь в момент смерти (пневмония, перелом) — она сама, в любом возрасте; если здоровье было
//      подорвано — «на фоне» медленной болезни («пневмония на фоне ХОБЛ»);
//    • здоровье заметно хуже обычного для своих лет (сглаженное здоровье ниже возрастного потолка ageCeiling259 при
//      обычной форме на 6,5 и больше — риск вдвое выше, чем у сверстника, — или привычка одна опускает потолок на 6,5)
//      — болезнь от того, что подорвало здоровье больше всего (привычки — habitPenalty261, остальное — разрыв между
//      потолком и здоровьем, поделённый между болезнью, переутомлением, недоеданием, хронической болезнью, травмой и
//      записями «Истории» за три года): курение — рак лёгких, выявленный поздно, или ХОБЛ; выпивка — цирроз печени;
//      переутомление — сердечная недостаточность или инсульт; недоедание — туберкулёз или сердечная недостаточность;
//      астма — дыхательная недостаточность; недавняя пневмония — её осложнения; иначе — сердечная недостаточность,
//      болезнь почек или рак кишечника. Молниеносный инфаркт (и инсульт, приступ астмы) — только внезапная смерть:
//      здоровье просело неглубоко, а курение, выпивка или переутомление — сейчас (усталость 70 и выше; переутомление
//      только в «Истории» прошлых лет — без инфаркта). «На фоне …» — только болезнь от того, что подорвало здоровье
//      (у травмы, мигрени, аллергии, курения до 40 и выпивки до 30 такой нет — тогда тяжёлая болезнь называется одна,
//      а не придумывается болезнь почек или рак). С 85 лет — «старость и …»;
//    • здоровье обычное для своих лет: с 80 — «старость»; с 60 — чаще болезнь, которую выявили поздно (инсульт, рак),
//      иногда несчастный случай; раньше — несчастный случай: сбила машина (пешком), авария за рулём или на
//      велосипеде — по тому, как вы ездите (transport56), вода, падение (в снежных странах — гололёд). Без подробностей.
//    Причина пишется одним полем s.deathCause2758 в момент смерти, ставится в последнюю запись «Истории» и строкой на
//    финальный экран. У уже умерших в старых сохранениях поля нет — строки нет.
// 2. Подарок транспорта (vehicles56). Окно предлагало «Принять подарок», а respondVehicleGift56 молча возвращало false
//    (кредит за машину, даритель переехал в другую страну, машина уже не у него, у вас пять единиц транспорта, нет
//    денег на велосипед, не тот возраст) — ничего не менялось, решение висело в «Ожидают ответа», а на следующий день
//    рождения то же предложение приходило снова. Текст говорил «Он находится в Варшава» — город дарителя, а не машины.
//    Теперь: окно — карточка 273 («Получите», «Где», «Цена»); «Принять подарок» либо работает, либо серая с причиной
//    (и кнопкой, которая её исправляет, если это возможно); если принять уже нельзя совсем, предложение закрывается
//    сразу и пропадает из «Ожидают ответа», а окно такого предложения — что предлагали, почему не состоится и
//    «Понятно»; «Где» — место самой машины, и если это не ваш город, сказано, что машина останется там и сколько
//    стоит перевезти; от машины, от которой вы отказались или на которую не ответили, даритель больше сам не
//    предлагает, и новый велосипед на день рождения тоже (спросить его снова можно в «Транспорте»); машину с кредитом
//    не предлагает. Велосипед ко дню рождения — не конвейер (решение владелицы 26.11): не дарят, пока у вас есть свой
//    велосипед или если велосипед на день рождения дарили или предлагали за последние 6 лет, и не больше двух за жизнь.
// 3. Комната. Когда вы снимаете комнату без объявления (переезд, «Снять комнату»), панель «Дом» рисует жильё по
//    stableHome59 — и у комнаты была площадь и число комнат всей квартиры («Комната · 4 комн. · 143 м²»). Теперь у
//    комнаты своя площадь 9–25 м² — по той же формуле, что у комнат в объявлениях (makeHouse41: площадь квартиры на
//    число спален, в квартире не меньше трёх комнат и двух спален), число от id жилья, поэтому между показами не
//    меняется; квартира целиком — в строке «Жильё целиком». У общежития площадь своя (10 / 14 м²) и не меняется.
//    Только показ: аренда, цены и расчёты не трогаются (площадь этого жилья нигде в расчётах не участвует).
// Файл подключается перед windows273.js (тот должен оставаться последним перед bootstrap61.js); карточку окна он
// кладёт в nextCard273 в момент вызова, когда windows273.js уже загружен.

const fixes2758Base={mortality258,log,story,vehicleGiftMenu56,respondVehicleGift56,offerVehicleGift56,decisionActive24,
 transportMonth56,transportMenu56,stableHome59,currentHome59};

// ---------- 1. Причина смерти ----------

// Диагнозы. text — в строке «Причина: …»; short — после «старость и …»; gen — после «на фоне …» (только у медленных
// болезней); min — не раньше этого возраста.
const dx2758={
 lung:{text:'рак лёгких — выявили поздно',short:'рак лёгких',gen:'рака лёгких',min:40},
 copd:{text:'ХОБЛ',gen:'ХОБЛ',min:45},
 cirrhosis:{text:'цирроз печени',gen:'цирроза печени',min:30},
 heart:{text:'сердечная недостаточность',gen:'сердечной недостаточности'},
 kidney:{text:'хроническая болезнь почек',gen:'хронической болезни почек'},
 colon:{text:'рак кишечника — выявили поздно',short:'рак кишечника',gen:'рака кишечника',min:40},
 pancreas:{text:'рак поджелудочной железы — выявили поздно',short:'рак поджелудочной железы',gen:'рака поджелудочной железы',min:45},
 tb:{text:'туберкулёз — выявили поздно',short:'туберкулёз',gen:'туберкулёза'},
 breath:{text:'дыхательная недостаточность',gen:'дыхательной недостаточности'},
 stroke:{text:'инсульт',min:35},
 infarct:{text:'молниеносный инфаркт',short:'инфаркт',min:30},
 asthma:{text:'тяжёлый приступ астмы'},
 afterPneumonia:{text:'осложнения после пневмонии'},
 afterFracture:{text:'осложнения после перелома'},
 afterInjury:{text:'осложнения после травмы'}
};
// Что подорвало здоровье → какие болезни. slow — медленные, которые выявляют поздно; sudden — внезапные (инфаркт
// только здесь): когда здоровье ещё не просело глубоко, а риск дают курение, выпивка, переутомление или астма сейчас.
const dxPool2758={
 smoke:{slow:['lung','copd'],sudden:['infarct','stroke']},
 smokePast:{slow:['lung','copd']},
 drink:{slow:['cirrhosis'],sudden:['infarct','stroke']},
 drinkPast:{slow:['cirrhosis']},
 overwork:{slow:['heart','stroke'],sudden:['infarct','stroke']},
 overworkPast:{slow:['heart','stroke']},
 food:{slow:['tb','heart']},
 injury:{slow:['afterInjury']},
 other:{slow:['heart','kidney','colon']},
 asthma:{slow:['breath'],sudden:['asthma']},
 migraine:{slow:['stroke']},
 pneumonia:{slow:['afterPneumonia']},
 fracture:{slow:['afterFracture']}
};
// Выбор по зерну жизни (visualHash49: s.visualSeed33 хранится в сохранении) — не случайный при каждом вызове.
function pick2758(weights,salt){
 const list=Object.entries(weights).filter(([,w])=>w>0),total=list.reduce((a,[,w])=>a+w,0);
 let r=(typeof visualHash49==='function'?visualHash49('death2758:'+salt):.5)*total;
 for(const [k,w] of list)if((r-=w)<0)return k;
 return list[list.length-1]?.[0];
}
// Что опустило здоровье: очки потолка от привычек и разрыв между потолком и сглаженным здоровьем, поделённый между
// тем, что такой разрыв создаёт. Возвращает весомые известные причины (не меньше 2 очков и трети самой большой), по
// убыванию; если известных нет — «другое».
function deathDrags2758(trend){
 const out=[],t=s.clock?.ticks??0;
 const p=typeof habitPenalty261==='function'?habitPenalty261():null;
 if(p)for(const k of ['smoke','drink']){const x=p[k],pts=(x?.now||0)+(x?.lasting||0);if(pts>=1)out.push({key:x.now>0?k:k+'Past',pts});}
 const ceil=typeof healthCeiling259==='function'?healthCeiling259():100,gap=Math.max(0,ceil-trend);
 if(gap>=2){
  const w={},add=(k,n)=>{w[k]=(w[k]||0)+n;};
  if(s.illness)add('illness',s.illness.severity==='тяжёлая'?1.5:1);
  else if(Number.isFinite(s.lastIllnessTick)&&t-s.lastIllnessTick<=24)add('illness',.5);
  const fat=s.clock?.fatigue||0;
  if(fat>=80)add('overwork',1.2);else if(fat>=70)add('overwork',.6);
  const food=typeof finance39==='function'?finance39()?.food:null;
  if(food&&food.strain>=3)add('food',Math.min(2,.8+.05*food.strain));
  for(const c of s.health25?.conditions||[]){
   if(c.flareLeft>0)add('chronic',.4);
   const n=(c.history||[]).filter(h=>h.type==='flare'&&t-h.tick<=36).length;
   if(n)add('chronic',Math.min(.6,.15*n));
  }
  const inj=s.incidents56?.injury;
  if(inj)add('injury',inj.kind==='bikeCrash'?.6:.3);
  const seen={};
  for(const e of s.log||[]){
   if(!(e?.age>=s.age-3))continue;
   const k=e.title==='Самочувствие мешает планам'?'illness':e.title==='Бюджета на питание не хватает'?'food':e.title==='Расписание не помещается в неделю'?'overwork':null;
   if(k)seen[k]=(seen[k]||0)+1;
  }
  if(seen.illness)add('illness',Math.min(.75,.25*seen.illness));
  if(seen.food)add('food',Math.min(.9,.3*seen.food));
  // Переутомление только в записях прошлых лет — уже не «сейчас»: без внезапного инфаркта (как бывший курильщик).
  if(seen.overwork)add(fat>=70?'overwork':'overworkPast',Math.min(1,.25*seen.overwork));
  // Болезнь и травма длятся месяцы и отнимают несколько очков (болезнь −8 и −0,5 в месяц, травма −2…−5): больше
  // этого из многолетнего разрыва им не приписывается — остальное делят другие причины или «другое».
  const cap={illness:10,injury:6},share={},sum=Object.values(w).reduce((a,b)=>a+b,0);
  let extra=sum>0?0:gap;
  for(const [k,n] of Object.entries(w)){share[k]=gap*n/sum;if(cap[k]&&share[k]>cap[k]){extra+=share[k]-cap[k];share[k]=cap[k];}}
  const free=Object.keys(share).filter(k=>!cap[k]),freeW=free.reduce((a,k)=>a+w[k],0);
  if(extra>0){if(freeW>0)for(const k of free)share[k]+=extra*w[k]/freeW;else share.other=extra;}
  for(const [k,pts] of Object.entries(share))out.push({key:k,pts});
 }
 // Диагноз выбирается по тому, что известно (привычки, переутомление, недоедание, болезни, травма): нераспознанный
 // остаток разрыва («другое») — только когда ничего известного нет, даже если он больше.
 const known=out.filter(d=>d.key!=='other'&&d.pts>=2).sort((a,b)=>b.pts-a.pts),top=known[0]?.pts||0;
 return known.length?known.filter(d=>d.pts>=Math.max(2,top*.35)):out.filter(d=>d.key==='other'&&d.pts>=2);
}
// Болезнь в «Истории» за три года (или сейчас): её название из записи «Самочувствие мешает планам».
function recentIllness2758(){
 if(s.illness?.name)return String(s.illness.name);
 for(const e of s.log||[])if(e?.age>=s.age-3&&e.title==='Самочувствие мешает планам')return String(e.text||'').split('.')[0];
 return '';
}
// Набор болезней для того, что подорвало здоровье. Хроническая — по самой частой в обострениях; недавняя болезнь —
// по названию (пневмония, перелом), иначе общий набор.
function dxPoolFor2758(key){
 if(key==='chronic'){
  const t=s.clock?.ticks??0,c=[...(s.health25?.conditions||[])].sort((a,b)=>(b.flareLeft>0)-(a.flareLeft>0)||(b.history||[]).filter(h=>h.type==='flare'&&t-h.tick<=36).length-(a.history||[]).filter(h=>h.type==='flare'&&t-h.tick<=36).length)[0];
  return dxPool2758[c?.id]||dxPool2758.other;
 }
 if(key==='illness'){const n=recentIllness2758();return n==='Пневмония'?dxPool2758.pneumonia:n==='Перелом'?dxPool2758.fracture:dxPool2758.other;}
 return dxPool2758[key]||dxPool2758.other;
}
// Конкретная болезнь. background — для «на фоне …»: только медленные, у которых есть родительный падеж, и только из
// набора того, что подорвало здоровье: нет такой (травма, мигрень, аллергия, курение до 40) — null, общий набор
// (сердце, почки, кишечник) — только для «другого».
function dxFor2758(key,age,deficit,background=false){
 const pool=dxPoolFor2758(key),sudden=!background&&deficit<15&&pool.sudden;
 if(background&&pool===dxPool2758.other&&key!=='other')return null;
 const w={},add=(list,n)=>{for(const id of list||[]){const d=dx2758[id];if(d&&(d.min||0)<=age&&(!background||d.gen))w[id]=(w[id]||0)+n;}};
 add(pool.slow,sudden?2:1);
 if(sudden)add(pool.sudden,1);
 if(!Object.keys(w).length&&(!background||key==='other'))add(dxPool2758.other.slow,1);
 const id=pick2758(w,'dx:'+key+(background?':bg':''));
 return id?dx2758[id]:background?null:dx2758.heart;
}
// Как вы обычно ездите: своя машина или велосипед, который выбран для поездок, велопрокат — или пешком и общественным
// транспортом.
function travel2758(){
 try{
  const v=typeof selectedVehicle56==='function'?selectedVehicle56():null;
  if(v)return v.kind==='car'?'car':'bike';
  if(s.transport56?.selected==='share')return 'bike';
 }catch(e){}
 return 'walk';
}
// Смерть, которую здоровье не объясняет: несчастный случай. Дорога — по тому, как вы ездите; вода — чаще у молодых;
// падение — чаще у пожилых, в снежных странах — на гололёде. В странах с опасными дорогами дорога чаще.
const roadRisk2758=['in','th','za','br','mx','eg','ma','id','tr','cn','ru'],ice2758=['ru','ca','no','pl'];
function externalCause2758(age){
 const road={walk:'сбила машина на пешеходном переходе',bike:'сбила машина, когда вы ехали на велосипеде',car:'авария на дороге, вы были за рулём'};
 const w={},fall=age<30?.4:age<60?1:3;
 w[road[travel2758()]]=(age<60?3:2)*(roadRisk2758.includes(s.country)?1.5:1);
 w['несчастный случай на воде']=age<30?2:age<60?1:.4;
 if(ice2758.includes(s.country)){w['падение на гололёде']=fall*.6;w['неудачное падение с лестницы']=fall*.4;}
 else w['неудачное падение с лестницы']=fall;
 return pick2758(w,'external');
}
// Тяжёлая болезнь в момент смерти — она сама.
function illnessCause2758(name){
 const n=String(name||'');
 return n==='Перелом'?'осложнения после перелома':n.toLocaleLowerCase('ru');
}
// Причина без слова «Причина:» и без точки: «старость», «рак лёгких — выявили поздно», «сбила машина на пешеходном
// переходе», «пневмония на фоне ХОБЛ».
function deathCause2758(forced=false){
 const age=s.age,trend=Number.isFinite(s.healthTrend258)?s.healthTrend258:s.health;
 if(forced||age>=100)return 'старость';
 // Обычное здоровье для своих лет — потолок возраста при обычной форме (20, к ней форма сходит без спорта).
 const base=typeof ageCeiling259==='function'?ageCeiling259(age):100,norm=base+(100-base)*.1,deficit=norm-trend;
 // Привычка, которая одна опускает потолок на 6,5 и больше (риск вдвое, когда здоровье до него дойдёт), — причина,
 // даже если сглаженное здоровье ещё не успело опуститься.
 const p=typeof habitPenalty261==='function'?habitPenalty261():null,habits=p?(p.smoke?.now||0)+(p.smoke?.lasting||0)+(p.drink?.now||0)+(p.drink?.lasting||0):0;
 const worse=deficit>=6.5||habits>=6.5&&deficit>=2,drags=worse?deathDrags2758(trend):[];
 // Тяжёлая болезнь в момент смерти называется в любом возрасте; если здоровье было подорвано — на фоне чего.
 const ill=s.illness;
 if(ill?.name&&ill.severity==='тяжёлая'){
  // На фоне — болезнь от первой по весу причины, у которой она есть; нет ни у одной — болезнь одна.
  let dx=null;
  for(const d of drags)if(d.key!=='illness'&&(dx=dxFor2758(d.key,age,deficit,true)))break;
  return illnessCause2758(ill.name)+(dx?.gen?' на фоне '+dx.gen:'');
 }
 // Здоровье подорвано — болезнь от того, что его подорвало больше всего.
 if(worse){
  const dx=dxFor2758(drags[0]?.key||'other',age,deficit);
  return age>=85?'старость и '+(dx.short||dx.text):dx.text;
 }
 // Здоровье обычное для своих лет: глубокая старость — старость; с 60 — чаще болезнь, которую выявили поздно,
 // иногда несчастный случай; раньше — несчастный случай.
 if(age>=80)return 'старость';
 if(age>=60&&(typeof visualHash49==='function'?visualHash49('death2758:natural'):.5)<(age>=75?.85:.6))
  return dx2758[pick2758(age>=75?{heart:2,stroke:1,colon:1}:{stroke:1,pancreas:1,colon:1,heart:1},'natural:'+(age>=75?'old':'mid'))].text;
 return externalCause2758(age);
}
mortality258=function(...args){
 const out=fixes2758Base.mortality258.apply(this,args);
 // nextYear (game.js): смерть — mortality258() || s.age>=100. Причина считается до записи «Последняя запись».
 try{if(s&&!s.dead&&(out||s.age>=100))s.deathCause2758=deathCause2758(!out);}catch(e){console.error(e);}
 return out;
};
log=function(title,text,tag='',major=false,...rest){
 if(title==='Последняя запись'&&tag==='Конец'&&s?.dead&&s.deathCause2758&&!/Причина: /.test(String(text||'')))
  text=String(text||'').replace(/\s*$/,'')+' Причина: '+s.deathCause2758+'.';
 return fixes2758Base.log.call(this,title,text,tag,major,...rest);
};
story=function(...args){
 const html=fixes2758Base.story.apply(this,args);
 if(!s?.dead||!s.deathCause2758||html.includes('cause2758'))return html;
 return html.replace(/(<div class="end">[\s\S]*?<\/h2>)/,m=>m+'<p class="cause2758">Причина: '+esc(s.deathCause2758)+'</p>');
};

// ---------- 2. Подарок транспорта ----------

// Транспорт подарка: машина или велосипед дарителя, а для велосипеда на день рождения (его ещё покупают) — заготовка
// по модели в городе дарителя. gone2758 — машины, о которой шла речь, уже нет.
function giftVehicle2758(q){
 const v=q?.vehicle?vehicle56(q.vehicle):null;
 if(v)return v;
 const m=q&&vehicleModel56(q.model);
 return m?{id:'gift2758:'+q.id,model:m.id,kind:m.kind,owner:'player',country:q.country,city:q.city,area:'suburb',priceCountry:q.country,
  paidPrice:q.price||0,boughtCondition:100,condition:100,year:s.year,acquired:s.clock.ticks,status:'owned',history:[],fresh2758:!q.vehicle,gone2758:!!q.vehicle}:null;
}
function giftPerson2758(q){return living(q?.parent)||s.people.find(p=>p.id===q?.parent)||null;}
function giftPlace2758(v){
 const here=!!v&&v.country===s.country&&v.city===residenceCity();
 return {here,sameCountry:!!v&&v.country===s.country,city:v?.city||'',text:v?(v.city+(v.country!==s.country?' · '+(countries[v.country]?.name||''):'')):''};
}
function giftUpkeep2758(v){try{return vehicleCost56({...v,owner:'player',status:'owned'}).total;}catch(e){return 0;}}
function giftMove2758(v){try{return transportMoveQuote56(v);}catch(e){return 0;}}
// Почему подарок нельзя принять: closed — уже никогда (предложение закрывается), why — пока нельзя (кнопка серая).
// Те же проверки, что в respondVehicleGift56, по порядку.
function giftCheck2758(q){
 if(!q)return {closed:'Предложение больше не действует',why:[]};
 if(q.status==='accepted')return {closed:'Подарок принят',ok:true,why:[]};
 if(q.status==='declined')return {closed:'Вы отказались от подарка',why:[]};
 if(q.status==='declinedByParent')return {closed:(giftPerson2758(q)?.name||'Даритель')+': пока оставляет транспорт себе',why:[]};
 if(q.status!=='offered'){
  const who=giftPerson2758(q);
  return {closed:q.closed2758||(who&&!living(q.parent)?who.name+(who.gender==='f'?' умерла':' умер')+' — подарок не состоится':'Срок ответа прошёл'),why:[]};
 }
 if(q.expires<s.clock.ticks)return {closed:'Срок ответа прошёл',why:[]};
 const p=living(q.parent),who=giftPerson2758(q),name=who?.name||'Даритель',f=who?.gender==='f';
 if(!p?.alive)return {closed:name+(f?' умерла':' умер')+' — подарок не состоится',why:[]};
 if(p.country!==q.country)return {closed:name+(f?' переехала':' переехал')+' в другую страну — предложение больше не действует',why:[]};
 const v=q.vehicle?vehicle56(q.vehicle):null;
 if(q.vehicle&&(!v||v.owner!==p.id||v.status!=='owned'))return {closed:'Этот транспорт уже продан или передан — предложение больше не действует',why:[]};
 const kind=v?.kind||vehicleModel56(q.model)?.kind,why=[];
 if(v&&vehicleDebt56(v))why.push({text:'За '+(kind==='car'?'эту машину':'этот велосипед')+' не погашен кредит',short:'сначала нужно погасить кредит',fix:{label:'Деньги и обязательства',hint:'кредиты',fn:()=>financeMenu()}});
 if(!q.vehicle&&(p.privateCash||0)<(q.price||0))why.push({text:name+': сейчас не хватает денег на велосипед',short:'у дарителя сейчас нет денег на подарок',when:'может измениться до конца срока ответа'});
 if(ownedVehicles56().length>=5)why.push({text:'У вас уже пять машин и велосипедов — больше владеть нельзя',short:'у вас уже пять единиц транспорта',fix:{label:'Мой транспорт',hint:'продать или передать',fn:()=>transportMenu56()}});
 if(s.age<(kind==='car'?18:12))why.push({text:kind==='car'?'Машину можно принять с 18 лет':'Велосипед можно принять с 12 лет',short:kind==='car'?'с 18 лет':'с 12 лет'});
 return {why};
}
// Отказ игрока: «Отказаться» или срок ответа прошёл без ответа. Предложение, которое закрылось само (даритель умер
// или переехал, транспорт продан), — не отказ.
function giftRefused2758(q){return q.status==='declined'||q.status==='expired'&&(!q.closed2758||q.closed2758==='Срок ответа прошёл');}
function closeGift2758(q,reason){
 if(!q||q.status!=='offered')return false;
 q.status='expired';q.closed2758=reason;q.closedAt2758=s.clock.ticks;
 return true;
}
// Предложения, которые принять уже нельзя совсем, закрываются (срок ответа закрывает transportMonth56).
function sweepGifts2758(note=false){
 if(!s?.transport56)return;
 for(const q of transportState56().gifts){
  if(q.status!=='offered'||q.expires<s.clock.ticks)continue;
  const c=giftCheck2758(q);
  if(c.closed&&closeGift2758(q,c.closed)&&note)log('Подарок не состоялся',(vehicleModel56(q.model)?.name||'Транспорт')+'. '+c.closed+'.','Семья');
 }
}
function giftText2758(q,chk){
 const who=giftPerson2758(q),m=vehicleModel56(q.model);
 // Закрытое предложение ничего не обещает: кто предлагал, что и почему не состоится.
 if(chk?.closed)return (who?.name||'Родитель')+(who?.gender==='f'?' предлагала':' предлагал')+' передать вам транспорт: '+(m?.name||'')+'. '+chk.closed+'.';
 const v=giftVehicle2758(q),place=giftPlace2758(v),move=giftMove2758(v);
 return (who?.name||'Родитель')+' предлагает передать вам транспорт: '+(m?.name||'')+'. Где: '+place.text+'. Содержание после передачи оплачиваете вы'+
  (place.here?'.':'; транспорт останется там, перевезти к себе — около '+money(move)+'.');
}
function giftOpts2758(q,chk,opts){
 // Принять уже нельзя совсем: одна кнопка «Понятно» вместо двух серых — у окна есть выход крупнее «×».
 if(chk.closed)return [{label:'Понятно',fn:()=>{}}];
 return (opts||[]).map(o=>{
  if(!o||typeof o.label!=='string')return o;
  if(o.label==='Принять подарок'){
   const why=chk.closed||chk.why?.[0]?.text||'';
   return why?{...o,disabled:true,why}:o;
  }
  if(o.label==='Отказаться'&&chk.closed)return {...o,disabled:true,why:chk.closed};
  return o;
 });
}
function giftBuild2758(q,chk){
 const who=giftPerson2758(q),m=vehicleModel56(q.model),v=giftVehicle2758(q),place=giftPlace2758(v),upkeep=giftUpkeep2758(v),move=giftMove2758(v);
 const card={rows:[],need:[],more:[],main:['Принять подарок','Отказаться'],side:['Отказаться']};
 const role=who?.role?' · '+String(who.role).toLocaleLowerCase('ru'):'';
 card.sub=who?'Предлагает '+who.name+role:'';
 const what=v?.kind==='car'?'машина':'велосипед',value=!v?'':v.fresh2758?'новый '+what:v.gone2758?what:what+' · '+v.year+' г. · состояние '+Math.round(v.condition)+'/100';
 // Принять уже нельзя совсем: что предлагали и почему не состоится. Ни «Где» (транспорта может уже не быть, а город
 // дарителя — не место машины), ни цены, ни «что будет после передачи»; выход — «Понятно».
 if(chk.closed){
  card.sub=who?(who.gender==='f'?'Предлагала ':'Предлагал ')+who.name+role:'';
  if(value)card.rows.push({label:'Транспорт',value});
  card.status={text:chk.closed,tone:chk.ok?'ok':'bad'};card.main=['Понятно'];card.side=null;
  return card;
 }
 card.rows.push({label:'Получите',value});
 card.rows.push({label:'Где',value:place.text,note:place.here?'там, где вы живёте':(place.sameCountry?'другой город':'другая страна')+' — после передачи транспорт останется там'});
 card.rows.push({label:'Цена',value:'подарок бесплатный · содержание ≈ '+money(upkeep)+'/мес.',note:place.here?'':'перевезти к себе — '+money(move)});
 for(const w of chk.why||[])card.need.push(w);
 const car=v?.kind==='car',lic=transportState56().licenses.includes(s.country);
 card.more.push({title:'Что будет после передачи',text:'Транспорт станет вашим, содержание — около '+money(upkeep)+' в месяц — списывается с месяца передачи.'+
  (place.here?'':' Он останется в городе '+place.city+'; перевезти к себе можно в карточке транспорта, около '+money(move)+'.')+
  (car&&!lic?' Чтобы ездить, нужен допуск к вождению в стране, где вы живёте.':'')});
 card.moreHint='что будет после передачи';
 return card;
}
vehicleGiftMenu56=function(id,...rest){
 const q=s?.transport56&&transportState56().gifts.find(q=>q.id===id);
 if(!q)return fixes2758Base.vehicleGiftMenu56(id,...rest);
 sweepGifts2758(false);
 const chk=giftCheck2758(q),old=show;
 const card=typeof nextCard273!=='undefined'&&!nextCard273;
 if(card)nextCard273={kind:'vehicle-gift',area:'Транспорт',build:()=>giftBuild2758(q,chk)};
 show=function(title,text,opts=[],...more){
  show=old;
  let body=text,list=opts;
  try{body=giftText2758(q,chk);list=giftOpts2758(q,chk,opts);}catch(e){console.error(e);}
  return old.call(this,title,body,list,...more);
 };
 try{return fixes2758Base.vehicleGiftMenu56(id,...rest);}
 finally{
  show=old;if(card&&typeof nextCard273!=='undefined')nextCard273=null;
  // Рисунок машины (vehicle-art74 вставляет его после <h2>) карточка унесла бы в «Все условия»: он идёт под заголовок.
  // Но если есть «Не хватает», главные кнопки не прилипают к низу (правило 273), и на телефоне 360×740 рисунок
  // столкнул бы их за край экрана — тогда он первым в «Подробнее».
  try{
   const d=document.getElementById('modal'),fig=d?.querySelector(':scope > .vehicle-figure74');
   const box=chk.why?.length?d?.querySelector('.more273 .more-body273'):d?.querySelector('.sub273');
   if(fig&&box)box.prepend(fig);
  }catch(e){console.error(e);}
 }
};
respondVehicleGift56=function(id,accept,...rest){
 const q=s?.transport56&&transportState56().gifts.find(q=>q.id===id);
 if(q&&accept&&q.status==='offered'){
  const chk=giftCheck2758(q);
  if(chk.closed){closeGift2758(q,chk.closed);toast(chk.closed+'.');save();render();return false;}
  if(chk.why?.length){toast(chk.why[0].text+'.');return false;}
 }
 const ok=fixes2758Base.respondVehicleGift56(id,accept,...rest);
 if(q&&accept&&!ok&&q.status==='offered')toast('Подарок принять не получилось — предложение осталось в «Ожидают ответа».');
 if(q&&accept&&ok){
  const v=vehicle56(q.received),e=s.log[0];
  if(v&&!vehicleLocal56(v)&&e?.title==='Подарок принят'&&!/ в городе /.test(e.text)){e.text+=' Он в городе '+v.city+(v.country!==s.country?' ('+(countries[v.country]?.name||'')+')':'')+' — перевезти к себе можно в карточке транспорта.';save();}
 }
 return ok;
};
// Сам даритель не предлагает машину с непогашенным кредитом, а на день рождения — и ту, от которой вы уже отказались
// или на которую не ответили. На время вызова такие машины прячутся (статус возвращается сразу же, сохранение
// отложенное — save264).
// Велосипед на день рождения (его даритель ещё покупает, у предложения нет vehicle) прятать нечего, и без своей машины
// vehicles56 предлагает его снова — в том числе вместо спрятанной машины, от которой вы отказались. Поэтому на день
// рождения даритель, от подарка которого вы уже отказались или на который не ответили, новый велосипед не предлагает;
// свою машину или велосипед, о которых речи ещё не было, — предлагает. «Спросить про старый транспорт» — как раньше.
// Велосипед ко дню рождения — не конвейер (решение владелицы 26.11): его не дарят, пока у вас есть свой велосипед
// (в любом состоянии), если велосипед на день рождения уже дарили или предлагали за последние 6 лет (кто угодно), и
// всего не больше двух за жизнь. Это и новый велосипед, и велосипед самого дарителя.
function birthdayBikeBlocked2758(){
 const z=transportState56(),t=s.clock.ticks;
 if(ownedVehicles56().some(v=>v.kind==='bike'))return true;
 const given=z.gifts.filter(q=>q.birthday&&vehicleModel56(q.model)?.kind==='bike');
 return given.length>=2||given.some(q=>t-(Number(q.expires)-3)<72);
}
offerVehicleGift56=function(parent=null,birthday=false,...rest){
 if(!s)return fixes2758Base.offerVehicleGift56(parent,birthday,...rest);
 const z=transportState56();
 const held=z.vehicles.filter(v=>v.status==='owned'&&v.owner!=='player'&&(vehicleDebt56(v)||birthday&&z.gifts.some(q=>q.vehicle===v.id&&q.parent===v.owner&&giftRefused2758(q))));
 if(birthday){
  // Тот же даритель и тот же выбор транспорта, что в offerVehicleGift56 (vehicles56.js).
  const who=parent??parents17().find(p=>p.alive&&p.inner.trust>=55),noBike=birthdayBikeBlocked2758();
  if(who&&noBike)for(const v of z.vehicles)if(v.owner===who.id&&v.kind==='bike'&&v.status==='owned'&&!held.includes(v))held.push(v);
  const own=who&&z.vehicles.some(v=>!held.includes(v)&&v.owner===who.id&&v.status==='owned'&&v.condition>25&&(v.kind==='bike'||s.age>=18));
  if(who&&!own&&(noBike||z.gifts.some(q=>q.parent===who.id&&giftRefused2758(q))))return null;
 }
 for(const v of held)v.status='held2758';
 let q=null;
 try{q=fixes2758Base.offerVehicleGift56(parent,birthday,...rest);}
 finally{for(const v of held)if(v.status==='held2758')v.status='owned';}
 // Запись в «Истории»: где на самом деле транспорт (раньше — город дарителя) и нужна ли перевозка.
 try{
  if(q?.status==='offered'){
   const e=s.log.find(e=>e.decision24?.kind==='vehicle56'&&e.decision24.id===q.id),v=giftVehicle2758(q),place=giftPlace2758(v),who=giftPerson2758(q);
   if(e&&v)e.text=(who?.name||'Родитель')+': '+(vehicleModel56(q.model)?.name||'')+'. '+(place.here?'Можно принять или отказаться.':'Транспорт в городе '+place.city+(v.country!==s.country?' ('+(countries[v.country]?.name||'')+')':'')+' — после передачи его нужно будет перевезти к себе.');
   save();
  }
 }catch(e){console.error(e);}
 return q;
};
decisionActive24=function(ref,...rest){
 if(ref?.kind==='vehicle56'&&s?.transport56){
  const q=transportState56().gifts.find(q=>q.id===ref.id);
  if(q?.status==='offered'&&giftCheck2758(q).closed)return false;
 }
 return fixes2758Base.decisionActive24.call(this,ref,...rest);
};
transportMonth56=function(...args){
 const out=fixes2758Base.transportMonth56.apply(this,args);
 if(s&&!s.dead)sweepGifts2758(true);
 return out;
};
transportMenu56=function(...args){
 if(s&&!s.dead)sweepGifts2758(false);
 return fixes2758Base.transportMenu56.apply(this,args);
};

// ---------- 3. Площадь комнаты ----------

// Комната в квартире (stableHome59 с kind 'room'): площадь — как у комнат в объявлениях (makeHouse41), от площади
// квартиры и числа спален, «качество» — из id жилья, чтобы число не менялось между показами. Квартира целиком
// остаётся в hostArea / hostRooms («Жильё целиком»). Аренда и цены этого жилья не меняются.
// Только жильё, у которого площадь ещё квартиры целиком (areaM2 = hostArea, как его рисует stableHome59): у общежития
// своя площадь 10 / 14 м² (dormListing68), а уже поправленное не пересчитывается.
function roomSize2758(q){
 if(!q||q.kind!=='room'||!q.residenceOnly59||q.dorm68)return q;
 if(Number(q.hostArea)>0&&q.areaM2!==q.hostArea)return q;
 const whole0=Number(q.hostArea)||Number(q.areaM2)||0;
 if(!whole0)return q;
 q.hostArea??=whole0;q.hostRooms??=q.rooms;q.hostBedrooms??=q.bedrooms;
 roomHost2758(q);
 const whole=Number(q.hostArea)||whole0,beds=Math.max(2,Number(q.hostBedrooms)||2);
 const k=typeof visualHash49==='function'?visualHash49(String(q.id)+':room2758'):.5;
 q.areaM2=Math.max(9,Math.min(25,Math.round(whole/(beds+1)*(.65+.2*k))));
 q.rooms=1;q.bedrooms=1;
 return q;
}
// Комнату сдают в квартире не меньше чем из трёх комнат с двумя спальнями (makeHouse41, housePool41). stableHome59
// берёт размер из середины диапазона типа и изредка рисует однушку или двушку с одной спальней — тогда квартира
// берётся того же типа, но побольше: с того размера, где у типа три комнаты и две спальни. Только показ.
function roomHost2758(q){
 if(q.hostRooms>=3&&q.hostBedrooms>=2)return;
 const r=typeof houseType41==='function'?houseType41(q.catalogId):null;
 const at=(range,n)=>Array.isArray(range)&&range[1]>range[0]?(n-.5-range[0])/(range[1]-range[0]):0;
 if(r?.area){const t=Math.min(1,Math.max(at(r.rooms,3),at(r.bedrooms,2)));if(t>0)q.hostArea=Math.max(Number(q.hostArea)||0,Math.round(interpolate41(r.area,t)));}
 q.hostRooms=Math.max(3,Number(q.hostRooms)||0);q.hostBedrooms=Math.max(2,Math.min(q.hostRooms,Number(q.hostBedrooms)||0));
}
stableHome59=function(...args){
 const q=fixes2758Base.stableHome59.apply(this,args);
 try{roomSize2758(q);}catch(e){console.error(e);}
 return q;
};
// Сохранённое жильё для показа (s.housing.display59) — со старой площадью: поправляется при первом показе.
currentHome59=function(...args){
 const info=fixes2758Base.currentHome59.apply(this,args);
 try{if(info?.listing)roomSize2758(info.listing);}catch(e){console.error(e);}
 return info;
};
