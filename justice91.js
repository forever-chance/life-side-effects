'use strict';

// Fictional balance profiles. They are not representations of local law.
const justiceProfiles91 = {
  nl:[16,.85,.35], rs:[18,.55,.48], ru:[16,.72,.30], us:[18,1.15,.30],
  br:[18,.60,.42], jp:[18,.95,.38], fr:[16,.90,.40], es:[16,.75,.48],
  de:[16,1.02,.33], uk:[16,1.08,.29], ca:[16,.83,.44], kr:[18,.92,.37],
  cn:[16,.78,.32], mx:[18,.62,.46],
  it:[16,.83,.39], au:[16,1.02,.32], tr:[18,.74,.40], za:[18,.66,.44],
  th:[18,.64,.41], no:[16,.98,.40], in:[18,.62,.46], id:[18,.60,.45],
  eg:[18,.68,.40], ma:[18,.69,.43], pl:[16,.81,.37]
};
const justiceActs91 = {
  fare:{name:'Безбилетный проезд',fine:.004},
  parking:{name:'Нарушение правил парковки',fine:.005},
  speeding:{name:'Превышение скорости',fine:.009},
  disorder:{name:'Нарушение общественного порядка',fine:.005},
  noise:{name:'Шум в запрещённые часы',fine:.003},
  damage:{name:'Незначительная порча имущества',fine:.006,repair:.009},
  pet:{name:'Нарушение правил содержания животных',fine:.004},
  trade:{name:'Нарушение правил торговли',fine:.007},
  found:{name:'Присвоение найденной вещи',criminal:true,fine:.008,repair:.004,reward:.0015,
    scene:'Нашлась чужая вещь. Её можно вернуть или оставить себе.'},
  shop:{name:'Мелкая кража',criminal:true,fine:.010,repair:.005,reward:.002,
    scene:'В магазине возникла возможность уйти с неоплаченным товаром.'},
  deal:{name:'Мелкая незаконная сделка',criminal:true,fine:.012,repair:.006,reward:.003,
    scene:'Появилась разовая возможность заработать на сомнительной сделке. Ты знаешь, что она незаконна.'}
};
const justiceThefts91 = {
  phone:'Украли телефон',wallet:'Украли кошелёк',bikeTheft:'Украли велосипед',
  bag:'Пропала сумка',carItems:'Украли вещи из машины',burglary:'Кража из жилья'
};
// Gameplay exposure in crowded destinations and quieter towns, not crime statistics.
const theftExposure112 = {
  nl:{'Амстердам':1.2,'Маастрихт':.85},
  rs:{'Белград':1.15,'Суботица':.85},
  ru:{'Москва':1.2,'Сочи':1.15,'Мурманск':.85},
  us:{'Нью-Йорк':1.2,'Лос-Анджелес':1.2,'Майами':1.15},
  fr:{'Париж':1.25,'Страсбург':.9},
  es:{'Барселона':1.25,'Сантьяго-де-Компостела':.85},
  it:{'Рим':1.2,'Флоренция':1.15},
  uk:{'Лондон':1.2,'Белфаст':.9},
  jp:{'Токио':1.15,'Саппоро':.85},
  ca:{'Торонто':1.15,'Галифакс':.85},
  th:{'Бангкок':1.2,'Пхукет':1.15,'Чианграй':.85}
};
function theftFactor112(country=s.country,city=residenceCity()) {
  return theftExposure112[country]?.[city] ?? 1;
}
function pickIncident112(pool) {
  if (!pool.length) return null;
  const factor = theftFactor112();
  const weights = pool.map(kind => Object.hasOwn(justiceThefts91,kind) ? factor : 1);
  let roll = Math.random() * weights.reduce((sum,weight) => sum+weight,0);
  return pool.find((kind,i) => (roll-=weights[i]) < 0) ?? pool.at(-1);
}
// Shared pause: 60–144 months, weighted toward the longer end.
function longCrimePause93() {
  return 60 + Math.floor(Math.max(Math.random(), Math.random()) * 85);
}
const justiceBase91 = {incidentPool56,createIncident56,incidentMenu56,decisionItems24,
  decisionRecord24,decisionActive24,openDecision24,actionCatalog24,autonomousMonth,timelineTopic88};

function justiceState91() {
  return s.justice91 ??= {serial:0,lastMonth:-1,lastMinor:-36,lastChance:-36,
    incidents:[],reports:[],opportunities:[]};
}
function justiceRecord91(rows, prefix, fields) {
  const state = justiceState91();
  const record = {id:prefix+'-'+(++state.serial),tick:s.clock.ticks,country:s.country,
    city:residenceCity(),...fields};
  rows.push(record);
  return record;
}

function justiceOffense91(key, {allowProceeds=true}={}) {
  const act = justiceActs91[key], profile = justiceProfiles91[s.country];
  if (!act || !profile || s.dead || s.age < profile[0] || (act.criminal && s.age < 18)) return null;
  const state = justiceState91(), tick = s.clock.ticks;
  const repeat = state.incidents.filter(q => q.key === key && q.tick >= tick-120).length;
  const detected = Math.random() < Math.min(.9,(act.criminal ? .39 : .66) + .085*repeat);
  const referred = detected && act.criminal && typeof courtRegister94==='function';
  const warned = detected && !act.criminal && !act.repair && !repeat && Math.random() < profile[2];
  const fine = detected && !warned ? Math.round(c().cost*act.fine*profile[1]*(1+Math.min(repeat,3)*.15)) : 0;
  const compensation = detected && act.repair ? Math.round(c().cost*act.repair) : 0;
  const proceeds = allowProceeds && !detected && act.reward && Math.random() < .55 ? Math.round(c().cost*act.reward) : 0;
  const first = act.criminal && !state.incidents.some(q => q.category === 'criminal');
  const q = justiceRecord91(state.incidents,'offense91',{
    key,category:act.criminal?'criminal':'administrative',
    outcome:referred?'pending':!detected?'none':warned?'warning':'assessment',
    fine:referred?0:fine,compensation:referred?0:compensation,paid:0,proceeds
  });
  if (proceeds) { s.cash += proceeds; s.clock.income += proceeds; }
  log(act.name, referred ? 'Обстоятельства проверяются.' : !detected ? (proceeds ? 'Получено '+money(proceeds)+'. ' : '')+'Санкций по эпизоду пока нет.' : warned ? 'Вынесено предупреждение.' :
    ['Назначен платёж',fine ? 'штраф '+money(fine) : '',compensation ? 'компенсация '+money(compensation) : '']
      .filter(Boolean).join(' · ')+'.',first?'Правосудие':'Правонарушение',first);
  if (referred) courtRegister94(q,{fine,compensation});
  return q;
}

function justicePay91(id) {
  const q = justiceState91().incidents.find(q => q.id === id);
  if (!q || s.dead || q.outcome !== 'assessment') return false;
  const due = q.fine+q.compensation-q.paid;
  if (due <= 0) return false;
  const amount = localAmount16(due,q.country);
  if (!payExpense23(amount,'Штраф и компенсация',q.id)) {
    toast('Средств пока не хватает. Платёж остался в юридической истории.');
    return false;
  }
  q.paid += due;
  log('Платёж по правонарушению внесён',money(amount)+'.','Правонарушение');
  save();
  return true;
}

function justiceRecentTheft91() {
  const reports = s.justice91?.reports || [];
  const legacy = (s.incidents56?.events || []).filter(q => Object.hasOwn(justiceThefts91,q.kind));
  const covered = new Set(reports.map(q => q.source));
  return reports.some(q => s.clock.ticks < (q.nextTheft93 ?? q.tick+120)) ||
    legacy.some(q => !covered.has(q.id) && s.clock.ticks < q.created+120);
}
incidentPool56 = function () {
  const pool = justiceBase91.incidentPool56();
  return justiceRecentTheft91() ? pool.filter(k => !Object.hasOwn(justiceThefts91,k)) : pool;
};

function justiceImportTheft91(source) {
  if (!source || !Object.hasOwn(justiceThefts91,source.kind)) return null;
  const rows = justiceState91().reports;
  let report = rows.find(q => q.source === source.id);
  if (report) return report;
  report = justiceRecord91(rows,'theft91',{
    source:source.id,kind:source.kind,country:source.country,city:source.city,tick:source.created,
    status:source.choice === 'report' ? (source.followup && !source.followed ? 'reported' : 'closed') : 'open',
    nextTheft93:source.created + (source.created === s.clock.ticks ? longCrimePause93() : 120),
    due:source.followup ?? null, roll:source.rolls?.[0] ?? .95, notified:false
  });
  return report;
}
createIncident56 = function (kind=null,target=null) {
  kind ??= pickIncident112(incidentPool56());
  if (!kind) return null;
  const event = justiceBase91.createIncident56(kind,target);
  if (justiceImportTheft91(event)) save();
  return event;
};

function justiceNewTheft91(kind) {
  if (s.dead || s.age < 18 || justiceRecentTheft91() || !['bag','carItems','burglary'].includes(kind)) return null;
  const q = justiceRecord91(justiceState91().reports,'theft91',{
    kind,status:'open',notified:true,roll:Math.random(),nextTheft93:s.clock.ticks+longCrimePause93()
  });
  const maxLoss = c().cost*({bag:.006,carItems:.009,burglary:.028})[kind];
  q.loss = Math.min(Math.max(0,s.cash)*.12,maxLoss);
  if (q.loss) payExpense23(q.loss,justiceThefts91[kind],q.id+':loss');
  log(justiceThefts91[kind],q.loss ? 'Утрата наличных и вещей: '+money(q.loss)+'.' : 'Пропали личные вещи.',
    kind==='burglary'?'Правосудие':'Происшествие',kind==='burglary',{kind:'justice91',id:q.id});
  return q;
}

function justiceReportChoice91(id, action) {
  const q = justiceState91().reports.find(q => q.id === id);
  if (!q || s.dead || !['open','reported'].includes(q.status)) return false;
  const local = q.country === s.country && q.city === residenceCity();
  if (action === 'report' && q.status === 'open') {
    q.status = 'reported';
    q.due = s.clock.ticks+2;
  } else if (action === 'ignore' && q.status === 'open') {
    q.status = 'ignored';
  } else if (action === 'protect' && !q.protected && ['phone','wallet','bag'].includes(q.kind)) {
    q.protected = true;
  } else if (action === 'search' && local && !q.searched) {
    q.searched = true;
    s.clock.fatigue = clamp(s.clock.fatigue+4);
  } else if (action === 'witness' && local && !q.witness) {
    q.witness = true;
    s.clock.fatigue = clamp(s.clock.fatigue+3);
  } else return false;
  if (action === 'report' || action === 'ignore') {
    const source = s.incidents56?.events?.find(e => e.id === q.source);
    if (source && source.kind !== 'phone' && source.status === 'offered') {
      source.status = 'answered';
      source.choice = action;
    }
  }
  if (action === 'report') log('Заявление зарегистрировано',justiceThefts91[q.kind]+' · '+q.city+'.','Происшествие');
  save();
  return true;
}

function justiceRecover91(q) {
  const source = s.incidents56?.events?.find(e => e.id === q.source);
  const found = q.roll < .14 + (q.searched ? .09 : 0) + (q.witness ? .08 : 0);
  q.status = found ? 'recovered' : 'closed';
  if (found && q.kind === 'bikeTheft') {
    const bike = vehicle56(source?.vehicle);
    if (bike?.status === 'stolen') {
      bike.status = 'owned';
      bike.condition = Math.max(30,bike.condition-10);
    }
  }
  if (found && q.kind === 'phone' && incidents56().phone !== 'replaced') incidents56().phone = 'returned';
  if (found && q.kind === 'wallet' && source?.loss > 0) {
    const amount = localAmount16(source.loss,source.country);
    s.cash += amount;
    s.clock.income += amount;
  }
  log(found?'Вещи найдены':'Проверка заявления завершена',justiceThefts91[q.kind]+
    (found?'. Имущество возвращено.':'. Имущество пока не нашли.'),'Происшествие');
}

function justiceRespond91(id, accept) {
  const state = justiceState91(), q = state.opportunities.find(q => q.id === id);
  if (!q || q.status !== 'offered' || s.dead || q.expires < s.clock.ticks) return false;
  if (accept && (q.country !== s.country || q.city !== residenceCity() || s.age < 18 ||
      travelActive52()?.status === 'away')) return false;
  q.status = accept?'accepted':'declined';
  if (accept) {
    s.clock.fatigue = clamp(s.clock.fatigue+5);
    q.incident = justiceOffense91(q.key)?.id;
  }
  save();
  return true;
}

function justiceMonth91() {
  const state = justiceState91(), tick = s.clock.ticks;
  if (s.dead || state.lastMonth === tick) return;
  state.lastMonth = tick;
  for (const q of state.reports) if (q.status === 'reported' && q.due !== null && q.due <= tick) {
    const source = s.incidents56?.events?.find(e => e.id === q.source);
    if (source?.followed) q.status = vehicle56(source.vehicle)?.status === 'owned' ? 'recovered' : 'closed';
    else justiceRecover91(q);
  }
  for (const q of state.opportunities) if (q.status === 'offered' && q.expires < tick) q.status = 'expired';
  if (s.age < 18 || travelActive52()?.status === 'away' || languageStayActive53()?.status === 'away') return;
  if (!justiceRecentTheft91() && Math.random() < .0018*theftFactor112()) {
    const car = ownedVehicles56().some(v => v.kind === 'car' && vehicleLocal56(v));
    justiceNewTheft91(pick(['bag',...(car?['carItems']:[]),...(s.housing?.active?['burglary']:[])]));
  }
  if (tick-state.lastMinor >= 36 && Math.random() < .012) {
    state.lastMinor = tick;
    const car = selectedVehicle56()?.kind === 'car';
    const options = [car?'parking':'fare','disorder','noise','damage',...(car?['speeding']:[]),
      ...(s.pets.some(p=>p.alive)?['pet']:[]),...(s.job?.selfEmployed || s.properties?.some(p=>p.status==='rented')?['trade']:[])];
    justiceOffense91(pick(options));
  }
  if (tick-state.lastChance >= 96 && Math.random() < .003) {
    state.lastChance = tick;
    justiceRecord91(state.opportunities,'opportunity91',{key:pick(['found','shop','deal']),
      status:'offered',expires:tick+2});
  }
}

function justiceDate91(q) {
  const date = s.year*12+s.clock.month + q.tick-s.clock.ticks;
  return months[((date%12)+12)%12]+' '+Math.floor(date/12);
}
function justiceReportMenu91(id) {
  const q = justiceState91().reports.find(q => q.id === id);
  if (!q) return;
  q.notified = false;
  const actions = [];
  const add = (action,label) => actions.push({label,fn:()=>{
    justiceReportChoice91(id,action);
    justiceReportMenu91(id);
  }});
  if (!s.dead && ['open','reported'].includes(q.status)) {
    if (q.status === 'open') add('report','Подать заявление в полицию');
    if (q.status === 'open') add('ignore','Оставить без дальнейших действий');
    if (!q.protected && ['phone','wallet','bag'].includes(q.kind)) add('protect','Заблокировать карты или устройство');
    if (q.country === s.country && q.city === residenceCity()) {
      if (!q.searched) add('search','Проверить, можно ли найти вещи');
      if (!q.witness) add('witness','Спросить свидетелей');
    }
  }
  actions.push({label:'К юридической истории',fn:justiceMenu91});
  const statuses = {open:'Заявление ещё не подано',reported:'Заявление зарегистрировано',
    closed:'Проверка завершена',recovered:'Имущество вернули',ignored:'Без дальнейших действий'};
  show(justiceThefts91[q.kind],q.city+' · '+justiceDate91(q)+'\n'+statuses[q.status]+
    (q.protected?' · карты или устройство заблокированы':''),actions);
}
function justiceOpportunityMenu91(id) {
  const q = justiceState91().opportunities.find(q => q.id === id);
  if (!q || q.status !== 'offered' || q.expires < s.clock.ticks) return;
  show('Разовая возможность',justiceActs91[q.key].scene+' Возможны штраф и компенсация.',[
    {label:'Не участвовать',fn:()=>justiceRespond91(id,false)},
    {label:'Сознательно пойти на нарушение',fn:()=>justiceRespond91(id,true)}
  ]);
}
function justiceOffenseMenu91(q) {
  const due = q.fine+q.compensation-q.paid;
  const label = q.category === 'administrative' ? 'Административное нарушение' : 'Незаконное действие';
  const amounts = [q.fine?'Штраф: '+money(localAmount16(q.fine,q.country)):'',
    q.compensation?'Компенсация: '+money(localAmount16(q.compensation,q.country)):''].filter(Boolean);
  show(justiceActs91[q.key].name,[label,q.city,justiceDate91(q),
    ...amounts,q.proceeds ? 'Получено: '+money(localAmount16(q.proceeds,q.country)) : '',q.outcome === 'pending' ? 'Дело рассматривается' : q.outcome === 'warning' ? 'Предупреждение' : q.outcome === 'none' ? 'Санкций нет' :
      due > 0 ? 'Ожидает оплаты' : 'Оплачено'].filter(Boolean).join(' · '),[
    ...(due>0 && !s.dead?[{label:'Оплатить · '+money(localAmount16(due,q.country)),fn:()=>{
      justicePay91(q.id);
      justiceOffenseMenu91(q);
    }}]:[]),
    ...(q.case94?[{label:'Открыть дело',fn:()=>courtMenu94(q.case94)}]:[]),
    {label:'К юридической истории',fn:justiceMenu91}
  ]);
}
function justiceMenu91(page=0) {
  const state = justiceState91();
  for (const q of s.incidents56?.events || []) justiceImportTheft91(q);
  const rows = [...state.incidents.map(q=>({q,label:justiceActs91[q.key].name,fn:()=>justiceOffenseMenu91(q)})),
    ...state.reports.map(q=>({q,label:justiceThefts91[q.kind],fn:()=>justiceReportMenu91(q.id)}))]
    .sort((a,b)=>b.q.tick-a.q.tick);
  const from = page*18;
  show('Правонарушения и заявления','Игровые правила и суммы условны. '+
    (rows.length?'Здесь хранятся эпизоды, платежи и заявления.':'Записей пока нет.'),[
    ...rows.slice(from,from+18).map(r=>({...r,hint:justiceDate91(r.q)+' · '+r.q.city})),
    ...(page?[{label:'Более свежие записи',fn:()=>justiceMenu91(page-1)}]:[]),
    ...(rows.length>from+18?[{label:'Более ранние записи',fn:()=>justiceMenu91(page+1)}]:[])
  ]);
}

incidentMenu56 = function (id) {
  const source = s.incidents56?.events?.find(q=>q.id===id);
  const q = justiceImportTheft91(source);
  if (!q) return justiceBase91.incidentMenu56(id);
  if (source.kind !== 'phone' || !activeIncident56(source)) return justiceReportMenu91(q.id);
  const previous = show;
  show = (title,note,opts,...rest) => previous(title,note,[...opts,
    {label:'Заявление и поиск телефона',fn:()=>justiceReportMenu91(q.id)}],...rest);
  try { return justiceBase91.incidentMenu56(id); } finally { show = previous; }
};

decisionRecord24 = function (ref) {
  if (ref?.kind !== 'justice91') return justiceBase91.decisionRecord24(ref);
  const state = justiceState91();
  return state.reports.find(q=>q.id===ref.id) || state.opportunities.find(q=>q.id===ref.id);
};
decisionActive24 = function (ref) {
  if (ref?.kind !== 'justice91') return justiceBase91.decisionActive24(ref);
  const q = decisionRecord24(ref);
  return !!q && !s.dead && (q.notified && q.status === 'open' ||
    q.status === 'offered' && q.expires >= s.clock.ticks);
};
decisionItems24 = function () {
  const state = justiceState91();
  const rows = [...state.reports,...state.opportunities].map(q=>({q,ref:{kind:'justice91',id:q.id}}))
    .filter(({ref})=>decisionActive24(ref) && (s.notices59?.snoozed?.[ref.kind+':'+ref.id]??-1)<=s.clock.ticks);
  return [...justiceBase91.decisionItems24(),...rows.map(({q,ref})=>({q,ref,
    title:justiceThefts91[q.kind]||'Разовая возможность',note:q.kind?'Заявление и поиск':'Можно отказаться',
    expires:q.expires ?? Infinity}))];
};
openDecision24 = function (kind,id) {
  if (kind !== 'justice91') return justiceBase91.openDecision24(kind,id);
  const q = decisionRecord24({kind,id});
  if (q?.kind) return justiceReportMenu91(id);
  return justiceOpportunityMenu91(id);
};
actionCatalog24 = function () {
  return [...justiceBase91.actionCatalog24(),{id:'justice91',group:'Семья',label:'Правонарушения и заявления',
    keywords:'штраф полиция украли вещи кража компенсация юридическая история',reason:'',fn:justiceMenu91}];
};
autonomousMonth = function () {
  justiceBase91.autonomousMonth();
  justiceMonth91();
};
timelineTopic88 = function (event) {
  return event.tag === 'Правосудие' && event.major ? 'milestones' : justiceBase91.timelineTopic88(event);
};
