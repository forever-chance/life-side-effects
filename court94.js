'use strict';

const courtBase94={familyBeginMonth54,workFraction28,capacity,travelWhy52,travelDepartureWhy52,
  studyMonth,decisionRecord24,decisionActive24,decisionItems24,openDecision24,
  actionCatalog24,jobEligibility16,underworldAway92,startTask05,save};
const courtCountries94={
  nl:[.57,2,4],rs:[.58,2,5],ru:[.56,3,6],us:[.59,3,6],br:[.57,2,5],
  jp:[.60,2,6],fr:[.57,2,5],es:[.56,2,4],de:[.59,2,5],uk:[.58,3,5],
  ca:[.59,2,4],kr:[.60,3,5],cn:[.58,3,6],mx:[.56,2,5],
  it:[.58,2,5],au:[.60,3,6],tr:[.58,2,5],za:[.60,2,5],
  th:[.57,2,4],no:[.61,2,4],in:[.59,2,6],id:[.58,2,5],
  eg:[.57,3,5],ma:[.58,2,5],pl:[.59,2,4]
};
const courtStatuses94={review:'Проверка обстоятельств',question:'Вызов на беседу',
  charged:'Обвинение предъявлено',closed:'Дело закрыто без обвинения',
  acquitted:'Оправдание',convicted:'Виновность установлена судом',ended:'Прекращено'};

function courtCases94(){return justiceState91().cases94 ??= [];}
function courtById94(id){return s.justice91?.cases94?.find(q=>q.id===id);}
function courtRegister94(incident,amounts){
  if (incident.case94) return courtById94(incident.case94);
  const witnesses=Math.random() < (incident.key==='shop'?.65:.35);
  const complaint=Math.random() < (incident.key==='found'?.45:.65);
  const q=justiceRecord91(courtCases94(),'case94',{
    incident:incident.id,key:incident.key,status:'review',due:s.clock.ticks+1,
    witnesses,complaint,roll:Math.random(),fine:amounts.fine,
    compensation:amounts.compensation,age:s.age,history:[{tick:s.clock.ticks,status:'review'}]
  });
  incident.case94=q.id;
  return q;
}
function courtTransition94(q,status,note,major=false){
  q.status=status;
  q.history.push({tick:s.clock.ticks,status,note});
  log(courtStatuses94[status],note,major?'Правосудие':'Правонарушение',major,{kind:'court94',id:q.id});
}
function courtSeverity94(q){
  const previous=courtCases94().filter(c=>c.id!==q.id && c.status==='convicted' &&
    c.decided<=s.clock.ticks && c.decided>=s.clock.ticks-96).length;
  return (q.key==='deal'?1:0)+Math.min(3,previous);
}
function courtSentenceActive94(kind){
  return s?.justice91?.cases94?.some(q=>q.sentence?.kind===kind &&
    q.sentence.starts<=s.clock.ticks && s.clock.ticks<q.sentence.ends) || false;
}
function courtCustody94(){return !s?.dead && courtSentenceActive94('custody');}
function courtCanCustody94(){
  // Community service keeps care running in lives with dependent children or pets.
  return !s.people.some(p=>p.alive && ownChild53(p) && p.age<18) &&
    !s.pets.some(p=>p.alive) && !s.incidents56?.missing?.some(q=>q.status==='searching'||q.status==='found') &&
    !courtCustody94() && !travelActive52() && !languageStayActive53();
}
function courtResolve94(q,incident){
  const [threshold,maxCustody,probation]=courtCountries94[q.country];
  const evidence=.23+(q.witnesses?.27:0)+(q.complaint?.23:0)+q.roll*.24;
  q.decided=s.clock.ticks;
  if (evidence < threshold+(q.lawyer?.11:0)+(q.statement?.035:0)) {
    incident.outcome='none';
    courtTransition94(q,'acquitted','Представленных сведений недостаточно для признания виновности.',true);
    return;
  }
  const severity=courtSeverity94(q);
  incident.fine=q.fine;
  incident.compensation=q.compensation;
  incident.outcome='assessment';
  let kind='payment',months=0;
  if (severity>=4 && q.age>=21 && courtCanCustody94()) {
    kind='custody'; months=maxCustody;
  } else if (severity>=3 || courtSentenceActive94('probation')) {
    kind='service'; months=2;
  } else if (severity>=2) {
    kind='probation'; months=probation;
  }
  q.sentence={kind,starts:s.clock.ticks,ends:s.clock.ticks+months};
  const note={payment:'Назначены денежные санкции.',service:'Назначены общественные работы на два месяца.',
    probation:'Условное наказание. Новое дело может изменить последствия.',
    custody:'Начался короткий срок заключения. Работа, учёба и поездки приостановлены.'};
  if(kind==='custody') {
    for (const t of s.clock.tasks) if (t.kind==='underworld92' && !['cancelled','completed'].includes(t.state)) {
      archiveTask05(t,'cancelled');
    }
  }
  courtTransition94(q,'convicted',note[kind],true);
  if(kind==='custody') log('Начало заключения',months+' мес. по решению суда.','Правосудие',true);
}
function courtMonth94(){
  if(s.dead) return;
  for(const q of courtCases94()){
    if(q.sentence && !q.released && q.sentence.kind!=='payment' && q.sentence.ends<=s.clock.ticks){
      q.released=true;
      log(q.sentence.kind==='custody'?'Освобождение':'Срок наказания завершён',
        'Ограничения по этому делу завершились.', 'Правосудие', q.sentence.kind==='custody');
    }
    if(q.due>s.clock.ticks || !['review','question','charged'].includes(q.status)) continue;
    const incident=justiceState91().incidents.find(e=>e.id===q.incident);
    if(!incident) {q.status='ended';continue;}
    if(q.status==='review'){
      if(!q.witnesses && !q.complaint && q.roll<.6){
        incident.outcome='none';
        courtTransition94(q,'closed','Не подтвердились основания для обвинения.');
      }else{
        q.due=s.clock.ticks+2;
        courtTransition94(q,'question','Можно изложить свою позицию или дождаться проверки.');
      }
    }else if(q.status==='question'){
      q.due=s.clock.ticks+2;
      courtTransition94(q,'charged','Назначено рассмотрение. Доступна юридическая помощь.',true);
    }else courtResolve94(q,incident);
  }
}
function courtHelp94(q){
  if(s.dead || q.status!=='charged' || q.lawyer || q.due<=s.clock.ticks) return false;
  const fee=localAmount16(countries[q.country].cost*.003,q.country);
  if(!payExpense23(fee,'Юридическая помощь',q.id+':lawyer')){toast('Не хватает средств на консультацию.');return false;}
  q.lawyer=true;
  save();
  return true;
}
function courtMenu94(id){
  const q=courtById94(id);
  if(!q) return;
  const terms=q.sentence && q.sentence.kind!=='payment' && !s.dead ? Math.max(0,q.sentence.ends-s.clock.ticks) : 0;
  const detail=[courtStatuses94[q.status],q.city,q.history.at(-1)?.note,
    q.lawyer?'Юридическая помощь оформлена':'',terms?'Осталось месяцев: '+terms:''].filter(Boolean).join('\n');
  const opts=[];
  if(!s.dead && q.status==='question' && !q.statement) opts.push({label:'Изложить свою позицию',fn:()=>{
    q.statement=true;save();courtMenu94(id);
  }});
  if(!s.dead && q.status==='charged' && !q.lawyer) opts.push({label:'Получить юридическую помощь · '+
    money(localAmount16(countries[q.country].cost*.003,q.country)),fn:()=>{courtHelp94(q);courtMenu94(id);}});
  const incident=justiceState91().incidents.find(e=>e.id===q.incident);
  if(incident?.outcome==='assessment') opts.push({label:'Штраф и компенсация',fn:()=>justiceOffenseMenu91(incident)});
  opts.push({label:'К списку дел',fn:courtList94});
  show('Дело · '+justiceActs91[q.key].name,detail,opts);
}
function courtList94(){
  show('Расследования и суд','Условная правовая модель игры. Обвинение и судебное решение хранятся отдельно.',[
    ...[...courtCases94()].reverse().map(q=>({label:justiceActs91[q.key].name,
      hint:s.dead && ['review','question','charged'].includes(q.status)?'Рассмотрение прекращено':courtStatuses94[q.status],
      fn:()=>courtMenu94(q.id)}))
  ]);
}
familyBeginMonth54=function(){
  courtMonth94();
  return courtBase94.familyBeginMonth54();
};
save=function(){
  if(s?.dead){
    for(const q of s.justice91?.cases94||[]){
      if(!['review','question','charged'].includes(q.status)) continue;
      q.status='ended';
      q.history.push({tick:s.clock.ticks,status:'ended',note:'Рассмотрение прекращено после смерти.'});
      const episode=s.justice91.incidents.find(e=>e.id===q.incident);
      if(episode?.outcome==='pending') episode.outcome='none';
    }
  }
  return courtBase94.save();
};
startTask05=function(t){return !courtCustody94() && courtBase94.startTask05(t);};
workFraction28=function(){return courtCustody94()?0:courtBase94.workFraction28();};
capacity=function(){
  if(courtCustody94()) return 0;
  return Math.max(0,courtBase94.capacity()-(courtSentenceActive94('service')?5:0));
};
studyMonth=function(){if(!courtCustody94()) return courtBase94.studyMonth();};
underworldAway92=function(){return courtCustody94()||courtBase94.underworldAway92();};
travelWhy52=function(...args){
  return [...courtBase94.travelWhy52(...args),...(courtCustody94()?['Поездки приостановлены на время заключения']:[])];
};
travelDepartureWhy52=function(...args){
  return courtCustody94()?'Поездки приостановлены на время заключения':courtBase94.travelDepartureWhy52(...args);
};
jobEligibility16=function(...args){
  const result=courtBase94.jobEligibility16(...args);
  if(courtCustody94()) result.why.push('Работа приостановлена на время заключения');
  return result;
};
decisionRecord24=function(ref){
  return ref?.kind==='court94'?courtById94(ref.id):courtBase94.decisionRecord24(ref);
};
decisionActive24=function(ref){
  if(ref?.kind!=='court94') return courtBase94.decisionActive24(ref);
  const q=courtById94(ref.id);
  return !s.dead && !!q && (q.status==='question'&&!q.statement || q.status==='charged'&&!q.lawyer);
};
decisionItems24=function(){
  const items=courtBase94.decisionItems24();
  for(const q of s.justice91?.cases94||[]){
    const ref={kind:'court94',id:q.id};
    if(decisionActive24(ref) && (s.notices59?.snoozed?.['court94:'+q.id]??-1)<=s.clock.ticks){
      items.push({q,ref,title:courtStatuses94[q.status],note:justiceActs91[q.key].name,expires:q.due});
    }
  }
  return items;
};
openDecision24=function(kind,id){return kind==='court94'?courtMenu94(id):courtBase94.openDecision24(kind,id);};
actionCatalog24=function(){
  return [...courtBase94.actionCatalog24(),{id:'court94',group:'Семья',label:'Расследования и суд',
    keywords:'полиция обвинение адвокат штраф заключение',reason:'',fn:courtList94}];
};
