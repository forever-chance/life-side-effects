'use strict';

function mentoring194(){
 return creative47().mentoring194??={pedagogy:0,lastOffer:-12,offer:null,history:[]};
}
function teachingProfile194(track){
 const works=portfolio47(track);
 return works.count>=3&&works.quality>=60&&profileScore46(track)>=55;
}
function mentoringScope194(track,key){
 return {key:'creative-mentor:'+s.country+':'+track+(key?':'+key:''),kind:'work',title:trackNames46[track],
  country:s.country,city:residenceCity(),track};
}
function mentoringFee194(hours){
 return Math.round(c().wage*.004*hours/3);
}
function planMentoring194(track,role,key=null){
 if(key&&!specialties184[track]?.[key])return false;
 if(!['learn','teach','class'].includes(role)||!formats47[track]||s.dead||s.age<(role==='learn'?16:18)||
   s.clock.tasks.some(t=>t.kind==='mentoring194'&&!['completed','cancelled'].includes(t.state)))return false;
 const state=mentoring194(),offer=state.offer;
 const hours=role==='class'?4:2;
 if(capacity()-totalHours()<hours)return false;
 if(role!=='learn'&&(!teachingProfile194(track)||creativeRights47({country:s.country,track,hours}).length))return false;
 if(role==='class'&&(offer?.status!=='offered'||offer.track!==track||offer.country!==s.country||offer.ends<=s.clock.ticks))return false;
 const scope=mentoringScope194(track,key);
 const roster=circleRecord48(scope).roster.map(living).filter(Boolean);
 const student=roster.find(p=>p.mentored194?.[track]!=null);
 const person=role==='class'?living(offer.host):role==='teach'&&student?student:circleMember48(scope,role==='learn');
 if(!person||role==='teach'&&person.contexts48?.[scope.key]==='mentor')return false;
 const title={learn:'Занятия с наставником',teach:'Наставничество',class:'Мастер-класс'}[role];
 task16('mentoring194',title+' · '+(specialties184[track]?.[key]||trackNames46[track]),role==='class'?1:3,
  {track,key195:key,role194:role,person194:person.id,country194:s.country,fee194:role==='class'?offer.fee:0,
   startCostRatio:role==='learn'?.004:0},hours);
 if(role==='class')offer.status='accepted';
 save();
 return true;
}

function masterClassOffer194(work){
 if(s.dead||s.age<18||!specialties184[work.track]||work.quality<68||!teachingProfile194(work.track))return;
 const state=mentoring194();
 if(s.clock.ticks-state.lastOffer<12||state.offer?.status==='offered'&&state.offer.ends>s.clock.ticks)return;
 const chance=Math.min(.35,.12+state.pedagogy*.005);
 if(Math.random()>=chance||creativeRights47({country:s.country,track:work.track,hours:4}).length)return;
 const host=circleMember48(mentoringScope194(work.track),true);
 if(!host)return;
 state.lastOffer=s.clock.ticks;
 state.offer={track:work.track,host:host.id,work:work.id,ends:s.clock.ticks+3,country:s.country,
  fee:mentoringFee194(4),status:'offered'};
 log('Приглашение провести мастер-класс',host.name+' предлагает разобрать работу «'+work.title+'». Ответить можно в разделе «Менторство и мастер-классы».','Творчество',true);
}

const mentoringTaskBase194={startTask05,finishTask};
startTask05=function(t){
 if(t.kind==='mentoring194'){
  if(['completed','cancelled','paused'].includes(t.state))return false;
  if(s.dead||s.country!==t.country194||!living(t.person194)||
    t.role194!=='learn'&&creativeRights47({country:t.country194,track:t.track,hours:t.hours}).length){
   archiveTask05(t,'cancelled');
   log('Занятие отменено',t.label+' · изменились обстоятельства.','Творчество');
   return false;
  }
 }
 return mentoringTaskBase194.startTask05(t);
};
finishTask=function(t){
 if(t.kind!=='mentoring194')return mentoringTaskBase194.finishTask(t);
 if(t.progress<t.duration||!startTask05(t))return;
 const p=living(t.person194),state=mentoring194(),learn=t.role194==='learn';
 const success=Math.random()<Math.min(.92,.68+state.pedagogy*.003+(p.inner?.trust||0)*.002);
 if(learn&&success){
  const skills=specialtyState46().skills;
  skills[t.track]=Math.min(100,profileScore46(t.track)+4);
 }else if(!learn&&success){
  state.pedagogy=Math.min(100,state.pedagogy+(t.role194==='class'?4:3));
  if(t.role194==='teach'){
   p.mentored194??={};
   p.mentored194[t.track]=Math.min(100,(p.mentored194[t.track]||0)+4);
  }
 }
 if(t.fee194){s.cash+=t.fee194;s.clock.income+=t.fee194;}
 rel(p,{trust:success?4:1});
 const result=success?(learn?'Профильная подготовка выросла.':'Педагогическое мастерство выросло.'):'Занятия состоялись, но заметного прогресса пока нет.';
 circleHistory48(t.label+'. '+result,p);
 state.history.push({tick:s.clock.ticks,track:t.track,key195:t.key195,person:p.id,role:t.role194,success});
 state.history=state.history.slice(-60);
 if(!learn&&success&&typeof courseOffer195==='function')courseOffer195(t.track,t.key195);
 archiveTask05(t,'completed');
 log(t.label,result+(t.fee194?' Гонорар: '+money(t.fee194)+'.':''),'Творчество');
 save();
};

function mentoringMenu194(){
 const state=mentoring194(),offer=state.offer;
 const available=offer?.status==='offered'&&offer.ends>s.clock.ticks&&offer.country===s.country;
 const start=(track,role)=>{if(!planMentoring194(track,role))toast('Проверьте свободное время, подготовку и право на работу.');};
 const tracks=Object.keys(formats47).filter(track=>ownedPortfolios60().includes(track)||profileScore46(track)>0);
 show('Менторство и мастер-классы','Педагогическое мастерство · '+state.pedagogy+'/100',[
  ...(available?[{label:'Провести мастер-класс · '+trackNames46[offer.track],hint:money(offer.fee)+' · 1 мес. · 4 ч/нед.',fn:()=>start(offer.track,'class')},
   {label:'Отклонить приглашение',fn:()=>{offer.status='declined';save();mentoringMenu194();}}]:[]),
  {label:'Найти наставника',disabled:s.age<16,fn:()=>show('Выбрать направление','Три месяца · 2 ч/нед. · '+money(c().cost*.004),
   (tracks.length?tracks:Object.keys(formats47)).map(track=>({label:trackNames46[track],fn:()=>chooseMentorSpecialty195(track,'learn')})))},
  ...tracks.filter(teachingProfile194).map(track=>({label:'Взять ученика · '+trackNames46[track],hint:'3 мес. · 2 ч/нед.',fn:()=>chooseMentorSpecialty195(track,'teach')})),
  ...(typeof courseMenu195==='function'?[{label:'Курсы и контракты',fn:courseMenu195}]:[]),
  {label:'История занятий',fn:()=>show('История занятий',state.history.slice().reverse().map(item=>
   (specialties184[item.track]?.[item.key195]||trackNames46[item.track])+' · '+(s.people.find(p=>p.id===item.person)?.name||'Участник')+' · '+(item.success?'с прогрессом':'занятие состоялось')).join('\n')||'Пока пусто.',[])}
 ]);
}
