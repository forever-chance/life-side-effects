'use strict';
// Сборка 261, слой 3: курение и алкоголь — цена, здоровье, зависимость.
//
// Было (habits78.js): месяц курения стоил 0.1% годовых расходов (в Норвегии около 260 kr), здоровье
// не трогалось, «бросить» значило нажать «Пауза» — сила привычки таяла сама на единицу в месяц.
// Стало:
// - цена от зарплаты страны: регулярное курение 7% месячной зарплаты, регулярная выпивка 5%, тяжёлая 9%;
// - пока привычка регулярная, потолок здоровья (health259) ниже: курение −2 (сильное −3.5), выпивка −1 (тяжёлая −3);
// - стаж оставляет след: −0.2 потолка за год курения (до −9; год сильного курения считается за 1.5),
//   −0.0625 за год выпивки (до −7; год тяжёлой выпивки считается за четыре);
//   до 40 лет след почти не заметен (×0.3), к 50 — в полную силу; после отказа тает на 3% в год;
//   калибровка — в CHANGES-261.txt (цель: сильное курение с 18 лет отнимает около 10 лет жизни, тяжёлая выпивка — 8–9);
// - с силы 4 это зависимость: пауза даёт ломку на 2–3 месяца (настроение −3, усталость +5 в месяц),
//   сила тает вдвое медленнее, в тяжёлые месяцы тянет сорваться — шанс 30–60%;
//   поддержка близкого (×0.6) и группа поддержки в расписании (×0.5) его снижают;
// - регулярная привычка больше не держит усталость у 100: утомляет только тяжёлая выпивка, +1 в месяц;
// - тяжёлая выпивка (сила 5+) даёт события: ссора с партнёром, предупреждение на работе, ночь в участке за рулём;
// - близкие замечают и заговаривают об этом.

// Регулярная привычка в habits78 давала усталость каждый месяц: курение +1, выпивка +3. Пока привычки не трогали
// здоровье, это был их единственный минус. Но +3 съедает весь естественный отдых (−3 в месяц), и у пьющего
// усталость годами стоит у 100, а с 259 переутомление само отнимает здоровье и вдвое замедляет восстановление.
// Здоровье теперь берёт потолок, поэтому усталость: курение и обычная выпивка 0, тяжёлая выпивка +1 (похмелье).
const useHabitBase261=useHabit78;
useHabit78=function(kind,...args){
 const h=habits78()[kind],before=s.clock.fatigue,recurring=h.strength>=3&&!h.mode;
 const ok=useHabitBase261.call(this,kind,...args);
 if(ok&&recurring)s.clock.fatigue=clamp(before+(kind==='drink'&&h.strength>=5?1:0));
 return ok;
};

function habit261(kind){
 const h=habits78()[kind];
 h.years261??=0;
 return h;
}

function habitRegular261(h){return h.strength>=3&&!h.mode;}

function quitTask261(){return s.clock.tasks.find(t=>t.kind==='quit261'&&t.state!=='cancelled');}

// Цена за месяц употребления. Разовый эпизод дешевле регулярного месяца.
habitCost78=function(kind){
 const h=habits78()[kind],month=c().wage/12;
 const share=kind==='smoke'?(h.strength>=3?.07:.005):(h.strength>=5?.09:h.strength>=3?.05:.02);
 return Math.max(1,Math.round(month*share));
};

function habitPenalty261(){
 const ageK=s.age<40?.3:s.age<50?.6:1;
 const sm=habit261('smoke'),dr=habit261('drink');
 const smoke={now:habitRegular261(sm)?(sm.strength>=5?3.5:2):0,lasting:Math.min(9,sm.years261*.2)*ageK};
 const drink={now:habitRegular261(dr)?(dr.strength>=5?3:1):0,lasting:Math.min(7,dr.years261*.0625)*ageK};
 return {smoke,drink,total:smoke.now+smoke.lasting+drink.now+drink.lasting};
}

const healthCeilingBase261=healthCeiling259;
healthCeiling259=function(...args){
 return Math.max(5,Math.round(healthCeilingBase261.apply(this,args)-habitPenalty261().total));
};

const healthNotesBase261=healthNotes259;
healthNotes259=function(...args){
 const lines=healthNotesBase261.apply(this,args),p=habitPenalty261();
 for(const [kind,label,past] of [['smoke','Курение','Годы курения'],['drink','Выпивка','Годы выпивки']]){
  const x=p[kind];
  if(x.now>=1)lines.push(`${label} сейчас опускает этот уровень на ${Math.round(x.now+x.lasting)}.`);
  else if(x.lasting>=1)lines.push(`${past} всё ещё сказываются: уровень ниже на ${Math.round(x.lasting)}.`);
 }
 return lines;
};

function relapseChance261(h){
 let p=Math.min(.6,.3+.1*Math.max(0,h.strength-4));
 if(s.clock.ticks-(h.supported??-12)<3)p*=.6;
 if(quitTask261())p*=.5;
 return p;
}

function riskWord261(p){return p<.25?'скорее всего получится':p<.4?'может не получиться':'рискованно';}

const autonomousMonthBase261=autonomousMonth;
autonomousMonth=function(...args){
 const before={smoke:habits78().smoke.strength,drink:habits78().drink.strength};
 const out=autonomousMonthBase261.apply(this,args);
 if(s.age>=18&&!s.dead)habitMonth261(before);
 return out;
};

function habitMonth261(before){
 const tick=s.clock.ticks,hs=habits78();
 for(const kind of ['smoke','drink']){
  const h=habit261(kind);
  if(h.used===tick&&h.strength>=3)h.years261+=(h.strength>=5?(kind==='smoke'?1.5:4):1)/12;
  else if(!habitRegular261(h))h.years261*=.9975;
  // Зависимость: на паузе сила тает вдвое медленнее, если не ходить в группу поддержки.
  if(before[kind]>=4&&h.strength<before[kind]&&h.mode==='pause'&&!quitTask261()&&tick%2===1)h.strength=before[kind];
  // Начало отказа при зависимости — ломка.
  if(h.mode&&h.mode!==h.lastMode261&&h.strength>=4&&!h.withdrawal261){
   h.withdrawal261=h.strength>=6?3:2;
   h.pauseStart261=tick;
   log(kind==='smoke'?'Без сигарет':'Без выпивки',kind==='smoke'
    ?'Первые дни без сигарет. Раздражает всё: очередь, звонок, собственные руки, которые не знают, куда себя деть.'
    :'Первые вечера без бокала. Сон не идёт, а тишина на кухне громче обычного.','Привычки');
  }
  h.lastMode261=h.mode;
  if(h.withdrawal261>0){
   if(h.used===tick)h.withdrawal261=0;
   else{s.mood=clamp(s.mood-3);s.clock.fatigue=clamp(s.clock.fatigue+5);h.withdrawal261--;}
  }
  // Тяга в тяжёлый месяц.
  const hard=s.mood<40||s.clock.fatigue>=65||h.withdrawal261>0;
  if(h.mode&&h.strength>=4&&hard&&h.used!==tick&&!s.pending.some(q=>q.type==='craving261'||q.type==='habit78')&&chance(.5))
   s.pending.push({type:'craving261',kind});
 }
 const dr=habit261('drink');
 if(habitRegular261(dr)&&dr.strength>=5&&tick-(dr.event261??-12)>=6&&chance(.15))drinkEvent261(dr);
 const sm=habit261('smoke');
 const worried=habitRegular261(dr)&&dr.strength>=5?'drink':habitRegular261(sm)&&sm.strength>=5?'smoke':null;
 if(worried&&tick-(hs.concern261??-24)>=12&&chance(.12)&&!s.pending.some(q=>q.type==='concern261')){
  const p=concernPerson261();
  if(p){hs.concern261=tick;s.pending.push({type:'concern261',kind:worried,personId:p.id});}
 }
}

function concernPerson261(){
 const partner=currentPartner();
 if(partner&&childLocal55(partner))return partner;
 return s.people.find(p=>p.alive&&p.age>=18&&childLocal55(p)&&(['Мать','Отец','Брат','Сестра'].includes(p.role)&&p.bond>=50||p.bond>=70))||null;
}

function drinkEvent261(h){
 h.event261=s.clock.ticks;
 const partner=currentPartner(),car=typeof ownedVehicles56==='function'&&ownedVehicles56().some(v=>v.kind==='car');
 const options=[];
 if(partner&&childLocal55(partner))options.push('partner');
 if(s.job&&!s.job.suspended28)options.push('work');
 if(car&&chance(.25))options.push('car');
 if(!options.length)options.push('morning');
 const kind=pick(options);
 if(kind==='partner'){
  rel(partner,{strain:6,trust:-3});
  remember(partner,'Ссора из-за выпивки');
  log('Ссора',`${partner.name}: «Ты опять ${s.gender==='f'?'пришла':'пришёл'} в два ночи. Я не знаю, с кем я сегодня разговариваю». Утром оба делают вид, что ничего не было.`,'Привычки',true);
 }else if(kind==='work'){
  h.workWarn261=(h.workWarn261||0)+1;
  s.mood=clamp(s.mood-2);
  log('Разговор с начальством',h.workWarn261>=2
   ?'Второе опоздание после выходных за полгода. Вас просят зайти и закрыть дверь. Разговор короткий и очень вежливый — это хуже, чем если бы на вас накричали.'
   :'Вы приходите к одиннадцати, а на столе записка: «Зайдите, когда сможете». Никто не спрашивает, где вы были. Всем и так понятно.','Привычки',true);
 }else if(kind==='car'){
  const fine=Math.round(c().wage*.05);
  payExpense23(fine,'Штраф: вождение в нетрезвом виде','dui261:'+s.clock.ticks);
  s.health=clamp(s.health-10);
  s.mood=clamp(s.mood-6);
  log('Ночь в участке',`Проверка на выезде с парковки. Остаток ночи — в участке, утром — штраф ${money(fine)} и ушибленное плечо от неудачного торможения за минуту до этого.`,'Привычки',true);
 }else{
  s.clock.fatigue=clamp(s.clock.fatigue+6);
  log('Утро',`Вы не помните, как добрались домой. Телефон показывает три пропущенных и сообщение, которое лучше было не отправлять.`,'Привычки');
 }
}

function craving261(q){
 const h=habit261(q.kind),p=relapseChance261(h),smoke=q.kind==='smoke';
 const done=()=>{s.pending.shift();save();render();if(s.pending.length)resolvePending();};
 const slip=reason=>{
  const months=h.pauseStart261!=null?s.clock.ticks-h.pauseStart261:0;
  delete h.mode;h.withdrawal261=0;
  if(!useHabit78(q.kind)){done();return;}
  log('Срыв',(reason?reason+' ':'')+(months>=2?`Пауза продержалась ${months} мес.`:'Пауза не продержалась и пары месяцев.')+' Привычка вернулась в обычный режим.','Привычки',true);
  done();
 };
 show(smoke?'Тянет закурить':'Тянет выпить',smoke
  ?'Вечер, ничего не происходит, а рука сама проверяет карман куртки, где раньше лежала пачка.'
  :'Холодильник открыт уже третий раз за вечер. На полке стоит то, что вы обещали себе не покупать.',[
  {label:smoke?'Закурить':'Выпить',hint:money(habitCost78(q.kind))+' · пауза закончится',fn:()=>slip('')},
  {label:'Перетерпеть',hint:riskWord261(p)+' · настроение хуже',fn:()=>{
   if(chance(p))return slip('Вы держались, но не выдержали.');
   s.mood=clamp(s.mood-2);
   log('Выдержали',smoke?'Вы выходите на балкон без сигареты и стоите там, пока не проходит.':'Вы ставите чайник и сидите на кухне, пока не становится легче. Становится.','Привычки');
   done();
  }}
 ]);
}

function concern261(q){
 const p=living(q.personId),h=habit261(q.kind),smoke=q.kind==='smoke';
 if(!p){s.pending.shift();return resolvePending();}
 const done=text=>{s.pending.shift();log('Разговор',text,'Привычки',true);save();render();if(s.pending.length)resolvePending();};
 show('Разговор · '+p.name,smoke
  ?`${p.name}: «Ты куришь больше, чем я помню. Я не читаю нотаций — просто слышу, как ты кашляешь по утрам».`
  :`${p.name}: «Я не считаю бокалы. Но я замечаю, что без них у тебя теперь не бывает вечеров».`,[
  {label:'Попросить помочь бросить',hint:'Ближе · пауза с поддержкой',fn:()=>{
   h.mode='pause';h.supported=s.clock.ticks;rel(p,{affection:2,trust:3});remember(p,smoke?'Просили помочь бросить курить':'Просили помочь бросить пить');
   done(`${p.name} не говорит «наконец-то». Просто кивает и спрашивает, чем помочь.`);
  }},
  {label:'Согласиться сократить',hint:'Режим сокращения',fn:()=>{
   h.mode='limit';rel(p,{trust:1});
   done('Вы обещаете сократить. Звучит неубедительно даже для вас самих, но разговор заканчивается мирно.');
  }},
  {label:'Отмахнуться',hint:'Напряжение между вами',fn:()=>{
   rel(p,{strain:4,affection:-1});remember(p,'Отмахнулись от разговора о привычке');
   done(`«Это моё дело». ${p.name} больше не поднимает тему. Это не значит, что перестаёт замечать.`);
  }}
 ]);
}

const resolvePendingBase261=resolvePending;
resolvePending=function(...args){
 const q=s.pending[0];
 if(q?.type==='craving261')return craving261(q);
 if(q?.type==='concern261')return concern261(q);
 return resolvePendingBase261.apply(this,args);
};

// Группа поддержки: дело в расписании.
duties.quit261={name:'Группа поддержки',duration:3,hours:2};

const finishTaskBase261=finishTask;
finishTask=function(t,...args){
 const out=finishTaskBase261.call(this,t,...args);
 if(t&&t.kind==='quit261'){
  for(const kind of ['smoke','drink']){
   const h=habit261(kind);
   if(!h.strength)continue;
   h.strength=Math.max(0,h.strength-2);
   if(h.strength&&!h.mode)h.mode='pause';
  }
  log('Три месяца в группе','По вторникам, в зале с пластиковыми стульями. Чужие истории оказываются слишком похожими на вашу. Тянет теперь реже.','Привычки',true);
 }
 return out;
};

// Меню привычки: честные цифры и группа поддержки.
const habitDetailBase261=habitDetail78;
habitDetail78=function(kind,...args){
 const showBase=show;
 show=function(title,text,opts=[],...rest){
  const h=habit261(kind),p=habitPenalty261()[kind];
  const mode=h.mode==='pause'?'Пауза':h.mode==='limit'?'Сокращение':h.strength>=3?'Регулярно':h.strength?'Изредка':'Пока нет привычки';
  const lines=[mode+'.'];
  if(h.strength>=3)lines.push(`Месяц ${kind==='smoke'?'курения':'выпивки'} обходится в ${money(habitCost78(kind))}.`);
  if(p.now+p.lasting>=1)lines.push(`Здоровье держится на ${Math.round(p.now+p.lasting)} ниже, чем могло бы.`);
  if(h.strength>=4)lines.push('Это уже зависимость: первые месяцы без неё будут тяжёлыми, а в плохие месяцы будет тянуть сорваться. Поддержка близких и группа помогают.');
  lines.push('В режиме сокращения и на паузе каждый новый эпизод требует решения.');
  const task=quitTask261();
  // «Обсудить с Нина» — имя не склоняется; переносим его после точки.
  opts=opts.map(o=>/^Обсудить с /.test(o.label||'')?{...o,label:'Попросить поддержки · '+o.label.replace(/^Обсудить с /,'')}:o);
  opts=[...opts,{label:task?'Группа поддержки уже в расписании':'Записаться в группу поддержки',hint:'2 ч/нед., 3 мес. · срывы реже',disabled:!!task||h.strength<3,fn:()=>assign('quit261')}];
  return showBase.call(this,title,lines.join(' '),opts,...rest);
 };
 try{return habitDetailBase261.call(this,kind,...args);}
 finally{show=showBase;}
};
