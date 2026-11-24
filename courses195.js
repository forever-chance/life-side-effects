'use strict';

function chooseMentorSpecialty195(track,role){
 const options=[[null,trackNames46[track]],...Object.entries(specialties184[track]||{})];
 show('Специализация','',[...options.map(([key,label])=>({label,fn:()=>{
  if(!planMentoring194(track,role,key))toast('Занятие пока недоступно. Проверьте расписание и условия.');
 }})),{label:'Назад',fn:mentoringMenu194}]);
}

function courses195(){
 return mentoring194().courses195??={contract:null,lastOffer:-12,history:[]};
}
function courseOffer195(track,key){
 const m=mentoring194(),cState=courses195();
 if(m.pedagogy<6||s.clock.ticks-cState.lastOffer<12||
   cState.contract?.expires>s.clock.ticks&&cState.contract.status==='available'||
   Math.random()>=.35)return;
 cState.lastOffer=s.clock.ticks;
 cState.contract={id:id16('course-contract'),track,key,country:s.country,
  expires:s.clock.ticks+3,status:'available',fee:Math.round(c().wage*.06)};
 log('Предложили вести курс','Местный учебный центр предлагает цикл занятий по направлению «'+
  (specialties184[track]?.[key]||trackNames46[track])+'». Договор доступен в разделе «Курсы и контракты».','Творчество',true);
}

function courseTerms195(own,offer){
 return own?{months:4,hours:6,fee:Math.round(c().wage*.012),cost:Math.round(c().cost*.015)}:
  {months:3,hours:5,fee:offer.fee,cost:0};
}

function planCourse195(track,title,own,key=null){
 if(!formats47[track]||s.dead||s.age<18||!teachingProfile194(track))return false;
 const state=courses195(),offer=state.contract;
 if(own?mentoring194().pedagogy<12:!offer||offer.track!==track||offer.country!==s.country||
   offer.status!=='available'||offer.expires<=s.clock.ticks)return false;
 if(s.clock.tasks.some(t=>t.kind==='course195'&&!['completed','cancelled'].includes(t.state)))return false;
 const terms=courseTerms195(own,offer);
 if(capacity()-totalHours()<terms.hours||creativeRights47({country:s.country,track,hours:terms.hours}).length)return false;
 const label=String(title||'').trim().slice(0,80)||'Курс · '+(specialties184[track]?.[key]||trackNames46[track]);
 const task=task16('course195',label,terms.months,{track,key195:key,country195:s.country,
  own195:own,fee195:terms.fee,cost195:terms.cost},terms.hours);
 if(terms.cost&&!spend231(terms.cost,'Подготовка курса · '+label,'course195:'+task.id)){
  s.clock.tasks.pop();
  return false;
 }
 if(!own)offer.status='accepted';
 save();
 return true;
}

const coursesBase195={startTask05,finishTask};
startTask05=function(t){
 if(t.kind==='course195'){
  if(['completed','cancelled','paused'].includes(t.state))return false;
  if(s.dead||creativeRights47({country:t.country195,track:t.track,hours:t.hours}).length){
   archiveTask05(t,'cancelled');
   log('Курс прерван',t.label+' · изменились условия работы.','Творчество');
   return false;
  }
 }
 return coursesBase195.startTask05(t);
};
finishTask=function(t){
 if(t.kind!=='course195')return coursesBase195.finishTask(t);
 if(t.progress<t.duration||!startTask05(t))return;
 const state=mentoring194();
 const enrolled=t.own195?rnd(3,12):rnd(8,16);
 const graduated=Math.round(enrolled*(.45+state.pedagogy*.004+Math.random()*.12));
 const learned=Math.round(3+state.pedagogy*.08+profileScore46(t.track)*.04);
 const paid=t.own195?graduated*t.fee195:t.fee195;
 archiveTask05(t,'completed');
 s.cash+=paid;
 s.clock.income+=paid;
 state.pedagogy=Math.min(100,state.pedagogy+(graduated/enrolled>=.6?5:2));
 const history=courses195().history;
 history.push({id:t.id,title:t.label,track:t.track,key:t.key195,enrolled,graduated,learned,paid,cost:t.cost195});
 if(history.length>60)history.shift();
 log('Курс завершён',t.label+' · выпускников '+graduated+' из '+enrolled+'. Подготовка группы: +'+learned+' баллов. Доход: '+money(paid)+'.','Творчество',true);
 save();
};

function courseMenu195(){
 const state=courses195(),offer=state.contract;
 const available=offer?.status==='available'&&offer.expires>s.clock.ticks&&offer.country===s.country;
 const plan=(track,title,own,key)=>{
  if(!planCourse195(track,title,own,key))toast('Проверьте расписание, средства и право на работу.');
 };
 show('Курсы и контракты','Педагогическое мастерство · '+mentoring194().pedagogy+'/100',[
  ...(available?[{label:'Контракт · '+(specialties184[offer.track]?.[offer.key]||trackNames46[offer.track]),
   hint:'3 мес. · 5 ч/нед. · '+money(offer.fee),fn:()=>plan(offer.track,'',false,offer.key)},
   {label:'Отказаться от контракта',fn:()=>{offer.status='declined';save();courseMenu195();}}]:[]),
  ...Object.keys(formats47).filter(track=>mentoring194().pedagogy>=12&&teachingProfile194(track)).map(track=>({
   label:'Авторский курс · '+trackNames46[track],fn:()=>{
    const terms=courseTerms195(true);
    show('Авторский курс','4 мес. · 6 ч/нед. · подготовка '+money(terms.cost)+'. Доход зависит от числа участников, дошедших до конца.',
     [{label:'Запустить курс',fn:()=>plan(track,$('#courseTitle195').value,true)},
      {label:'Назад',fn:courseMenu195}]);
    petInsert38('<label class="field">Название<input id="courseTitle195" maxlength="80"></label>');
   }
  })),
  ...(typeof schoolOpening196==='function'?[{label:'Открыть профессиональную школу',hint:schoolBlock196(),disabled:!!schoolBlock196(),fn:schoolOpening196}]:[]),
  {label:'Завершённые курсы · '+state.history.length,fn:()=>show('Завершённые курсы',
   state.history.slice().reverse().map(r=>r.title+' · '+r.graduated+'/'+r.enrolled+
   ' выпускников · +'+r.learned+' баллов подготовки · '+money(r.paid-r.cost)+' после расходов').join('\n')||'Пока пусто.',[])}
 ]);
}
