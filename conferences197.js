'use strict';

const conferenceFields197={science:'Исследования',engineering:'Инженерные проекты',computing:'Прикладные технологии'};
function conferenceState197(){return path16().conferences197??={last:-12,offer:null,history:[]};}
function conferenceProfile197(){
 const x=path16(),months={};
 for(const [id,n] of Object.entries(x.experience.jobs)){
  const field=profession16(id)?.field;
  if(conferenceFields197[field])months[field]=(months[field]||0)+n;
 }
 return Object.keys(conferenceFields197).map(field=>({field,months:months[field]||0,
  research:x.diplomas.some(d=>d.field===field&&d.level==='phd')||Boolean(x.study?.research>=2&&prog16(x.study.program)?.field===field)}))
  .filter(p=>p.months>=12||p.research).sort((a,b)=>b.months+24*Number(b.research)-a.months-24*Number(a.research))[0];
}
function conferenceTerms197(profile){
 const format=profile.research?'Исследовательский семинар':profile.months>=36?'Профессиональная конференция':'Отраслевая встреча';
 return {title:format+' · '+conferenceFields197[profile.field],field:profile.field,country:s.country,city:residenceCity(),
  fee:Math.round(c().wage*.008),cost:Math.round(c().cost*.0015),ends:s.clock.ticks+3};
}
function conferenceMonth197(){
 if(s.age<18||s.dead)return;
 const state=conferenceState197();
 if(s.clock.ticks-state.last<6||state.offer?.ends>s.clock.ticks&&state.offer.status==='available')return;
 state.last=s.clock.ticks;
 const profile=conferenceProfile197();
 if(!profile||Math.random()>=Math.min(.25,.045+profile.months*.002+(profile.research?.08:0)))return;
 state.offer={...conferenceTerms197(profile),status:'available'};
 log('Приглашение с докладом',state.offer.title+' · ответ доступен в разделе «Конференции и выступления».','Работа',true);
}
function planConference197(invited){
 const profile=conferenceProfile197(),state=conferenceState197();
 if(!profile||s.age<18||s.dead||capacity()-totalHours()<3||
   s.clock.tasks.some(t=>t.kind==='conference197'&&!['completed','cancelled'].includes(t.state)))return false;
 const offer=invited?state.offer:conferenceTerms197(profile);
 if(!offer||invited&&(offer.status!=='available'||offer.ends<=s.clock.ticks||
   offer.country!==s.country||offer.city!==residenceCity()))return false;
 const paid=permission16(s.country,'work')?offer.fee:0;
 const t=task16('conference197',offer.title,2,{event197:{...offer},fee197:paid,invited197:invited,
  accepted197:invited||Math.random()<Math.min(.85,.40+profile.months*.004+(profile.research?.16:0))},3);
 if(!spend231(offer.cost,'Подготовка доклада','conference197:'+t.id)){s.clock.tasks.pop();return false;}
 if(invited)offer.status='accepted';
 save();return true;
}

const conferenceBase197={autonomousMonth,finishTask,actionCatalog24};
autonomousMonth=function(){conferenceBase197.autonomousMonth();conferenceMonth197();};
finishTask=function(t){
 if(t.kind!=='conference197')return conferenceBase197.finishTask(t);
 if(t.progress<t.duration||['completed','cancelled','paused'].includes(t.state)||!startTask05(t))return;
 const e=t.event197;
 if(s.dead||s.country!==e.country||residenceCity()!==e.city||travelActive52()){
  archiveTask05(t,'cancelled');
  log('Выступление сорвалось',e.title+' · вы не смогли присутствовать.','Работа');save();return;
 }
 archiveTask05(t,'completed');
 const fee=t.accepted197&&permission16(e.country,'work')?t.fee197:0;
 if(fee){s.cash+=fee;s.clock.income+=fee;}
 const state=conferenceState197();
 state.history.push({id:t.id,title:e.title,field:e.field,country:e.country,city:e.city,
  tick:s.clock.ticks,status:t.accepted197?'presented':'rejected',fee});
 state.history=state.history.slice(-80);
 if(t.accepted197){
  const skills=path16().experience.skills;
  skills[e.field]=Math.min(100,(skills[e.field]??s.skill)+2);
 }
 log(t.accepted197?'Доклад состоялся':'Заявку отклонили',e.title+(fee?' · гонорар '+money(fee):''),'Работа',true);
 save();
};
function conferenceMenu197(){
 const profile=conferenceProfile197(),state=conferenceState197(),offer=state.offer;
 const available=offer?.status==='available'&&offer.ends>s.clock.ticks&&offer.country===s.country&&offer.city===residenceCity();
 const plan=invited=>{if(!planConference197(invited))toast('Проверь подготовку, расписание и бюджет.');};
 show('Конференции и выступления',profile?'Подготовка доклада занимает два месяца по три часа в неделю.':
  'Для заявки нужен год опыта в профильной профессии или исследовательская подготовка.',[
  ...(available?[{label:'Принять приглашение · '+offer.title,hint:'Подготовка '+money(offer.cost)+' · гонорар '+money(permission16(s.country,'work')?offer.fee:0),fn:()=>plan(true)},
   {label:'Отклонить приглашение',fn:()=>{offer.status='declined';save();conferenceMenu197();}}]:[]),
  ...(profile?[{label:'Подать заявку на доклад',hint:'Подготовка '+money(conferenceTerms197(profile).cost),fn:()=>plan(false)}]:[]),
  {label:'История выступлений',fn:()=>show('История выступлений',state.history.slice().reverse().map(e=>
    e.title+' · '+e.city+' · '+(e.status==='presented'?'доклад состоялся':'заявка отклонена')).join('\n')||'Пока записей нет.',[])}
 ]);
}
actionCatalog24=function(){return [...conferenceBase197.actionCatalog24(),{id:'conference197',group:'Работа',
 label:'Конференции и выступления',keywords:'наука инженерия доклад семинар',reason:s.age<18?'С 18 лет':'',fn:conferenceMenu197}];};
