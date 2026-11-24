'use strict';

const underworldBase92 = {autonomousMonth,finishTask,decisionItems24,decisionRecord24,
  decisionActive24,openDecision24,actionCatalog24};

const underworldTasks92 = [
  {name:'Сомнительная доставка',description:'Просит передать чужую вещь, полученную незаконно.',hours:3},
  {name:'Закрытая сделка',description:'Просит помочь с незаконной перепродажей. Детали остаются за кадром.',hours:4},
  {name:'Разовое поручение',description:'Просит прикрыть незаконную сделку своим участием.',hours:4}
];

function underworldState92() {
  return s.underworld92 ??= {contacts:{},offers:[],serial:0,lastMonth:-1,
    nextInitial:36,nextRepeat:0,paused:false};
}
function underworldLocal92(p) {
  return p?.alive && p.age>=18 && p.country===s.country && personCity62(p)===residenceCity();
}
function underworldAway92() {
  return travelActive52()?.status==='away' || languageStayActive53()?.status==='away';
}
function underworldEligible92(p) {
  const state = underworldState92(), contact = state.contacts[p?.id];
  return underworldLocal92(p) && !contact?.blocked &&
    (contact?.next ?? 0) <= s.clock.ticks && p.bond >= 25 &&
    !['Мать','Отец'].includes(p.role) && !ownChild53(p);
}
function underworldContact92(id) {
  return underworldState92().contacts[id] ??= {trust:0,completed:0,next:0,
    optedIn:false,blocked:false,invitation:'none'};
}
function underworldOffer92(p,kind,group=null) {
  const state = underworldState92(), tick = s.clock.ticks;
  if (state.paused || s.dead || s.age<18 || !(group ? underworldLocal92(p) : underworldEligible92(p)) ||
      state.offers.some(q=>['offered','scheduled'].includes(q.status))) return null;
  const contact = underworldContact92(p.id);
  if (kind==='invite' && (contact.completed<3 || contact.trust<30 || contact.invitation!=='none')) return null;
  if (!group && kind==='task' && tick < (contact.optedIn ? state.nextRepeat : state.nextInitial)) return null;
  const task = rnd(0,underworldTasks92.length-1);
  const promise = group && kind==='task' ? Math.floor(Math.min(group.funds*.35,
    c().cost*(group.strategy==='quiet'?.004:.006)*group.rank/3)) : kind==='task' ? Math.round(Math.min(c().cost*.004,Math.max(0,p.privateCash||0)*.33)) : 0;
  if (kind==='task' && promise <= 0) return null;
  const q = {id:'underworld92-'+(++state.serial),kind,contact:p.id,task,promise,
    country:s.country,city:residenceCity(),created:tick,expires:tick+3,status:'offered',roll:Math.random()};
  if (group) {
    q.group93=group.id;
    if (kind==='task') q.hours93=group.rank+2;
  }
  state.offers.push(q);
  if (kind==='invite') contact.invitation='offered';
  if (!group && kind==='task' && contact.optedIn) state.nextRepeat = tick+6;
  if (!group && kind==='task' && !contact.optedIn) state.nextInitial = tick+longCrimePause93();
  log(underworldTitle93(q),
    p.name+' хочет поговорить наедине. Можно отказаться.','Знакомые',false,{kind:'underworld92',id:q.id});
  return q;
}
function underworldAvailability92(q) {
  return !!q && !s.dead && !underworldState92().paused && q.status==='offered' &&
    q.expires>=s.clock.ticks && q.country===s.country && q.city===residenceCity() &&
    underworldLocal92(living(q.contact));
}

function underworldRespond92(id,answer) {
  const state = underworldState92(), q = state.offers.find(x=>x.id===id);
  if (!underworldAvailability92(q)) return false;
  const contact = underworldContact92(q.contact), tick = s.clock.ticks;
  const p = living(q.contact);
  if (q.kind==='promotion') return organizationPromote93(q,answer);
  if (q.group93 && ['decline','block','report'].includes(answer)) {
    q.status='declined';
    if (answer!=='decline') return underworldLeave92(), true;
    const group=organizationActive93();
    if (group) group.trust=Math.max(0,group.trust-2);
    save();
    return true;
  }
  if (['decline','block','report'].includes(answer)) {
    q.status=answer==='decline'?'declined':answer==='block'?'blocked':'reported';
    contact.trust=Math.max(0,contact.trust-4);
    const next=tick+longCrimePause93();
    contact.next=next;
    contact.optedIn=false;
    state.nextInitial=next;
    if (answer!=='decline') contact.blocked=true;
    if (q.kind==='invite') contact.invitation=q.status;
    if (answer==='report') log('Сообщение о предложении',p.name+
      ' · сообщение зарегистрировано. Виновность не установлена.','Происшествие');
  } else if (answer==='accept' && q.kind==='task' && q.informed) {
    const hours=q.hours93 ?? underworldTasks92[q.task].hours;
    if (underworldAway92() || s.health<35 || s.illness || capacity()-totalHours()<hours) {
      toast('На поручение сейчас не хватает времени или сил.');
      return false;
    }
    q.status='scheduled';
    contact.optedIn=true;
    state.nextRepeat=Math.max(state.nextRepeat,tick+6);
    const plan=task16('underworld92','Неофициальное поручение',1,{offer92:q.id},hours);
    q.plan=plan.id;
  } else if (answer==='meet' && q.kind==='invite' && q.informed) {
    if (underworldAway92() || s.illness || capacity()-totalHours()<2) return false;
    q.status='scheduled';
    q.plan=task16('underworld92','Встреча со знакомым',1,{offer92:q.id},2).id;
    contact.invitation='scheduled';
  } else return false;
  save();
  return true;
}

finishTask = function(t) {
  if (t.kind!=='underworld92') return underworldBase92.finishTask(t);
  const state=underworldState92(), q=state.offers.find(x=>x.id===t.offer92);
  if (!q || q.status!=='scheduled' || q.plan!==t.id || ['paused','completed','cancelled'].includes(t.state)) return;
  const p=living(q.contact), contact=underworldContact92(q.contact);
  if (s.dead || state.paused || contact.blocked || !underworldLocal92(p) ||
      s.country!==q.country || residenceCity()!==q.city || underworldAway92() || s.illness || s.health<35) {
    q.status='cancelled';
    if (q.kind==='invite') contact.invitation='cancelled';
    archiveTask05(t,'cancelled');
    return;
  }
  if (!startTask05(t)) return;
  q.finished=s.clock.ticks;
  q.status='completed';
  s.clock.fatigue=clamp(s.clock.fatigue+5);
  archiveTask05(t,'completed');
  if (q.kind==='invite') {
    contact.invitation='met';
    log('Встреча о сотрудничестве','Вы и '+p.name+' поговорили. Вступление не оформлено.','Знакомые');
    return;
  }
  if (q.group93) {
    organizationFinish93(q);
    return;
  }
  const success=q.roll<Math.min(.88,.67+contact.trust*.002);
  const share=!success || q.roll<.08 ? 0 : q.roll<.24 ? .5 : 1;
  q.paid=Math.floor(Math.min(q.promise*share,Math.max(0,p.privateCash||0)));
  q.success=success;
  if (q.paid>0) {
    p.privateCash-=q.paid;
    s.cash+=q.paid;
    s.clock.income+=q.paid;
  }
  contact.trust=Math.max(0,Math.min(100,contact.trust+(success?12:-8)));
  if (success) contact.completed++;
  const incident=justiceOffense91('deal',{allowProceeds:false});
  q.incident=incident?.id;
  log('Поручение закончено',(success?'Поручение выполнено. ':'Договорённость сорвалась. ')+
    (q.paid?'Получено '+money(q.paid)+'.':'Оплаты не было.'),'Знакомые');
};

function underworldMonth92() {
  const state=underworldState92(), tick=s.clock.ticks;
  if (state.lastMonth===tick || s.dead) return;
  state.lastMonth=tick;
  for (const q of state.offers) {
    const contact=underworldContact92(q.contact);
    if (q.status==='offered' && q.expires<tick) {
      q.status='expired';
      if (q.kind==='invite') contact.invitation='expired';
    }
    if (q.status==='scheduled' && !s.clock.tasks.some(t=>t.id===q.plan && !['cancelled','completed'].includes(t.state))) {
      q.status='cancelled';
      if (q.kind==='invite') contact.invitation='cancelled';
    }
  }
  if (state.paused || s.age<18 || underworldAway92() ||
      state.offers.some(q=>['offered','scheduled'].includes(q.status))) return;
  const group=organizationActive93();
  if (group) {
    organizationMonth93(group);
    return;
  }
  const known=s.people.filter(p=>state.contacts[p.id]?.optedIn && underworldEligible92(p));
  if (known.length && tick>=state.nextRepeat) {
    const ready=known.filter(p=>{
      const a=state.contacts[p.id];
      return a.completed>=3 && a.trust>=30 && a.invitation==='none';
    });
    if (ready.length && Math.random()<.12 && underworldOffer92(pick(ready),'invite')) return;
    if (Math.random()<.14) underworldOffer92(pick(known),'task');
  } else if (tick>=state.nextInitial && Math.random()<(s.cash<c().cost*.06?.0035:.002)) {
    const candidates=s.people.filter(p=>underworldEligible92(p) && (p.privateCash||0)>=c().cost*.002);
    if (candidates.length) underworldOffer92(pick(candidates),'task');
  }
}

function underworldMenu92(id,details=false) {
  const q=underworldState92().offers.find(x=>x.id===id);
  if (!underworldAvailability92(q)) return;
  if (q.kind==='promotion') return organizationPromotionMenu93(q);
  const p=living(q.contact), task=underworldTasks92[q.task];
  if (details) q.informed=true;
  const invitation=q.kind==='invite';
  const description=invitation ? 'Знакомый предлагает встретиться и обсудить более регулярное сотрудничество.' :
    (q.group93 ? organizationActive93()?.name || p.name : p.name)+' предлагает '+money(localAmount16(q.promise,q.country))+' за небольшое поручение.';
  show(invitation?'Приглашение на встречу':'Сомнительное предложение',description+
    (details ? invitation ? ' Разговор займёт 2 ч/нед. в течение месяца. Решение о вступлении принимается отдельно.' :
      ' '+task.description+' '+(q.hours93 ?? task.hours)+' ч/нед. на месяц. Возможны неоплата и юридические последствия.' : ''),[
    details ? {label:invitation?'Назначить встречу':'Согласиться на поручение',fn:()=>underworldRespond92(id,invitation?'meet':'accept')} :
      {label:'Узнать подробности',fn:()=>underworldMenu92(id,true)},
    {label:'Отказаться',fn:()=>underworldRespond92(id,'decline')},
    {label:'Прекратить такие контакты',fn:()=>underworldRespond92(id,'block')},
    {label:'Сообщить в полицию',fn:()=>underworldRespond92(id,'report')}
  ]);
}

function underworldLeave92() {
  const state=underworldState92();
  organizationLeave93();
  state.paused=true;
  for (const q of state.offers) if (['offered','scheduled'].includes(q.status)) {
    q.status='cancelled';
    const task=s.clock.tasks.find(t=>t.id===q.plan);
    if (task) {
      archiveTask05(task,'cancelled');
      s.clock.tasks = s.clock.tasks.filter(t=>t.id!==task.id);
    }
  }
  save();
  underworldActivity92();
}
function underworldActivity92() {
  const state=underworldState92();
  const active=state.offers.filter(q=>underworldAvailability92(q)||q.status==='scheduled');
  const contacts=Object.entries(state.contacts).filter(([,c])=>!c.blocked);
  const names=contacts.map(([id,c])=>{
    const p=s.people.find(x=>x.id===id);
    return p ? p.name+(c.completed?' · поручений выполнено '+c.completed:'') : '';
  }).filter(Boolean);
  const group=organizationActive93();
  const level=Object.values(state.contacts).some(c=>c.completed>=3) ? 'Проверенный исполнитель' :
    Object.values(state.contacts).some(c=>c.optedIn) ? 'Исполнитель поручений' : 'Разовые предложения';
  show('Неофициальная деятельность',(state.paused?'Сотрудничество прекращено.':group?
    organizationRoles93[group.rank]+' · '+group.name:level)+
    (names.length?'\n'+names.join('\n'):''),[
    ...organizationOptions93(group),
    ...active.map(q=>({label:underworldTitle93(q),
      hint:q.status==='scheduled'?'В расписании':q.promise?'Обещано '+money(localAmount16(q.promise,q.country)):'Ожидает ответа',
      disabled:q.status==='scheduled',fn:()=>underworldMenu92(q.id)})),
    ...(!state.paused?[{label:'Прекратить сотрудничество',fn:underworldLeave92}]:[])
  ]);
}
decisionRecord24 = function(ref) {
  return ref?.kind==='underworld92' ? underworldState92().offers.find(q=>q.id===ref.id) :
    underworldBase92.decisionRecord24(ref);
};
decisionActive24 = function(ref) {
  return ref?.kind==='underworld92' ? underworldAvailability92(decisionRecord24(ref)) :
    underworldBase92.decisionActive24(ref);
};
decisionItems24 = function() {
  const rows=underworldState92().offers.filter(q=>underworldAvailability92(q) &&
    (s.notices59?.snoozed?.['underworld92:'+q.id]??-1)<=s.clock.ticks);
  return [...underworldBase92.decisionItems24(),...rows.map(q=>({q,ref:{kind:'underworld92',id:q.id},
    title:underworldTitle93(q),
    note:living(q.contact)?.name || '',expires:q.expires}))];
};
openDecision24 = function(kind,id) {
  return kind==='underworld92' ? underworldMenu92(id) : underworldBase92.openDecision24(kind,id);
};
actionCatalog24 = function() {
  const actions=underworldBase92.actionCatalog24();
  if (!s.underworld92?.offers.length) return actions;
  return [...actions,{id:'underworld92',group:'Семья',label:'Неофициальная деятельность',
    keywords:'поручения предложения знакомые сотрудничество',reason:'',fn:underworldActivity92}];
};
autonomousMonth = function() {
  underworldBase92.autonomousMonth();
  underworldMonth92();
};

const organizationRoles93 = {3:'Участник организации',4:'Доверенный участник',5:'Руководитель'};

function underworldTitle93(q) {
  if (q.kind==='invite') return 'Приглашение на встречу';
  if (q.kind==='promotion') return 'Предложение новой роли';
  return q.group93 ? 'Поручение организации' : 'Сомнительное предложение';
}

function organizationActive93() {
  const state=underworldState92();
  return state.organizations93?.find(group=>group.id===state.membership93 && group.status==='active') || null;
}

function organizationJoin93(id) {
  const state=underworldState92(), offer=state.offers.find(q=>q.id===id);
  const host=offer && living(offer.contact);
  if (s.dead || s.age<18 || state.paused || organizationActive93() || offer?.kind!=='invite' ||
      offer.status!=='completed' || offer.joined93 || offer.refused93 || !underworldLocal92(host) ||
      offer.country!==s.country || offer.city!==residenceCity() || underworldAway92()) return false;
  const seed=Math.floor(Math.min(Math.max(0,host.privateCash||0)*.3,c().cost*.025));
  if (seed<1) return false;
  const partner=s.people.find(p=>p.id!==host.id && underworldEligible92(p) && p.bond>=45);
  const members=partner ? [host.id,partner.id] : [host.id];
  const style=offer.task%3;
  const group={id:'organization93-'+offer.id, name:['Круг посредников','Частная контора','Закрытый круг'][style],
    specialty:['Незаконная перепродажа','Финансовые махинации','Сомнительные сделки'][style],
    country:s.country,city:residenceCity(),host:host.id,leader:host.id,members:[...members,'player'],
    funds:seed,cap:Math.max(seed,c().cost*.05),heat:0,rank:3,trust:30,completed:0,
    rankStarted:s.clock.ticks,nextOffer:s.clock.ticks+4,nextPromotion:0,status:'active',
    strategy:'standard',history:[]};
  host.privateCash-=seed;
  offer.joined93=true;
  (state.organizations93 ??= []).push(group);
  state.membership93=group.id;
  organizationHistory93(group,'Вступление в организацию',group.name,true);
  save();
  return true;
}

function organizationHistory93(group,title,note,major=false) {
  group.history.push({tick:s.clock.ticks,title,note});
  log(title,note,major?'Правосудие':'Знакомые',major);
}

function organizationFinish93(q) {
  const group=organizationActive93();
  if (!group || group.id!==q.group93 || group.country!==s.country || group.city!==residenceCity()) return;
  const success=q.roll<Math.min(.88,.60+group.trust*.003);
  const proceeds=success ? Math.min(group.cap-group.funds,q.promise*.7) : -Math.min(group.funds,q.promise*.22);
  group.funds+=proceeds;
  const share=!success || q.roll<.07 ? 0 : q.roll<.22 ? .5 : 1;
  q.paid=Math.floor(Math.min(q.promise*share,group.funds));
  group.funds-=q.paid;
  s.cash+=q.paid;
  s.clock.income+=q.paid;
  q.success=success;
  if (success) group.completed++;
  group.trust=clamp(group.trust+(success?8:-10));
  group.heat=clamp(group.heat+(group.strategy==='quiet'?2:5)+(success?0:4));
  const incident=justiceOffense91('deal',{allowProceeds:false});
  q.incident=incident?.id;
  organizationHistory93(group,success?'Поручение выполнено':'Поручение сорвалось',
    q.paid ? 'Выплачено '+money(q.paid)+'.' : 'Оплаты не было.');
}

function organizationMonth93(group) {
  if (group.country!==s.country || group.city!==residenceCity() || s.clock.ticks<group.nextOffer) return;
  const contacts=group.members.map(living).filter(underworldLocal92);
  const contact=contacts.find(p=>p.id===group.host) || contacts[0];
  if (!contact) return;
  if (group.leader!=='player' && !living(group.leader)) group.leader=contact.id;
  const promotable=group.rank<5 && group.trust>=(group.rank===3?60:80) &&
    group.completed>=(group.rank===3?4:9) && s.clock.ticks-group.rankStarted>=18 &&
    s.clock.ticks>=group.nextPromotion;
  if (promotable && Math.random()<.16 && underworldOffer92(contact,'promotion',group)) {
    group.nextPromotion=s.clock.ticks+24;
    return;
  }
  if (Math.random()<.22 && underworldOffer92(contact,'task',group)) group.nextOffer=s.clock.ticks+4;
}

function organizationPromote93(q,answer) {
  const group=organizationActive93();
  if (!group || group.id!==q.group93 || group.rank>=5 || !['accept','decline'].includes(answer)) return false;
  q.status=answer==='accept'?'completed':'declined';
  if (answer==='accept') {
    group.rank++;
    group.rankStarted=s.clock.ticks;
    if (group.rank===5) group.leader='player';
    organizationHistory93(group,'Новая роль в организации',organizationRoles93[group.rank]+' · '+group.name,true);
  }
  save();
  return true;
}
function organizationPromotionMenu93(q) {
  const group=organizationActive93();
  if (!group) return;
  show('Предложение новой роли',organizationRoles93[group.rank+1]+' · '+group.name+
    '. Новые поручения потребуют больше времени.',[
    {label:'Принять роль',fn:()=>underworldRespond92(q.id,'accept')},
    {label:'Остаться на прежней роли',fn:()=>underworldRespond92(q.id,'decline')}
  ]);
}

function organizationLeave93() {
  const group=organizationActive93();
  if (!group) return;
  group.status='left';
  group.left=s.clock.ticks;
  group.members=group.members.filter(id=>id!=='player');
  if (group.leader==='player') group.leader=group.members.find(id=>id!=='player' && living(id)) || null;
  underworldState92().membership93=null;
  organizationHistory93(group,'Выход из организации',group.name,true);
}
function organizationOptions93(group) {
  if (group) return [
    {label:'Организация и её история',fn:()=>organizationMenu93(group)},
    ...(!s.dead && group.rank===5?[{label:'Сменить приоритет работы',fn:()=>organizationStrategy93(group)}]:[])
  ];
  const offer=[...underworldState92().offers].reverse().find(q=>q.kind==='invite' &&
    q.status==='completed' && !q.joined93 && !q.refused93 && underworldLocal92(living(q.contact)) &&
    q.country===s.country && q.city===residenceCity());
  if (!offer || underworldState92().paused || s.dead) {
    return (underworldState92().organizations93 || []).map(previous=>({
      label:previous.name+' · история',fn:()=>organizationMenu93(previous)
    }));
  }
  return [{label:'Решение после встречи',fn:()=>show('Решение после встречи',
    'Можно вступить в местную группу и получать поручения из её общей кассы. Это отдельное решение.',[
      {label:'Вступить',fn:()=>{if (organizationJoin93(offer.id)) underworldActivity92();}},
      {label:'Остаться независимым',fn:()=>{offer.refused93=true;save();underworldActivity92();}}
    ])}];
}

function organizationMenu93(group) {
  const name=id=>id==='player'?s.name:s.people.find(p=>p.id===id)?.name;
  const people=group.members.filter(id=>id!=='player').map(name).filter(Boolean).join(', ');
  const exposure=group.heat>=55?'высокая':group.heat>=25?'заметная':'низкая';
  show(group.name,[group.city,group.specialty,'Руководитель: '+(name(group.leader)||'—'),
    'Участники: '+people,'Касса: '+money(localAmount16(group.funds,group.country)),
    'Известность полиции: '+exposure,'\n'+group.history.slice(-8).map(e=>e.title+' · '+e.note).join('\n')].join(' · '),
    [{label:'К деятельности',fn:underworldActivity92}]);
}
function organizationStrategy93(group) {
  if (s.dead || organizationActive93()!==group || group.rank!==5) return;
  show('Приоритет работы','Меньшие суммы снижают внимание полиции. Обычный режим даёт более крупные поручения.',[
    ...[['quiet','Снизить активность'],['standard','Обычный режим']].map(([strategy,label])=>({label,fn:()=>{
      group.strategy=strategy;
      organizationHistory93(group,'Сменился приоритет',label);
      save();
      underworldActivity92();
    }}))
  ]);
}
