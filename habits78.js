'use strict';
const habitBase78={autonomousMonth,resolvePending,finishTask,actionCatalog24};
const habitLabels78={smoke:'Курение',drink:'Алкоголь'};

function habits78(){
 return s.habits78??={smoke:{strength:0},drink:{strength:0}};
}

function habitCost78(kind){
 return Math.round(c().cost*(kind==='smoke'?.001:.0015));
}

function useHabit78(kind){
 if(s.age<18||s.dead)return false;
 const habit=habits78()[kind],tick=s.clock.ticks,amount=habitCost78(kind);
 if(habit.used===tick)return false;
 if(!payExpense23(amount,habitLabels78[kind],'habit78:'+kind+':'+tick)){
   toast('Сейчас в бюджете нет '+money(amount)+'.');
   return false;
 }
 const recurring=habit.strength>=3&&!habit.mode;
 const repeated=habit.used!=null&&tick-habit.used<=4;
 habit.strength=Math.min(6,repeated?habit.strength+1:1);
 habit.used=tick;
 if(!recurring)s.mood=clamp(s.mood+(kind==='smoke'?1:2));
 else s.clock.fatigue=clamp(s.clock.fatigue+(kind==='smoke'?1:3));
 log(recurring?habitLabels78[kind]+' · привычка':kind==='smoke'?'Перекур':'Выпивка',
   'Расход за месяц — '+money(amount)+'.'+(habit.strength===3?' Это вошло в привычку. Режим можно изменить в разделе здоровья.':''),'Привычки');
 return true;
}

function habitDetail78(kind){
 const habit=habits78()[kind],tick=s.clock.ticks;
 const mode=habit.mode==='pause'?'Пауза':habit.mode==='limit'?'Сокращение':habit.strength>=3?'Регулярно':habit.strength?'Изредка':'Пока нет привычки';
 const support=currentPartner()||s.people.find(p=>p.alive&&p.bond>=65&&p.age>=18);
 show(habitLabels78[kind],mode+'. Расход в месяц употребления — '+money(habitCost78(kind))+
   '. При регулярном употреблении расход и усталость начисляются каждый месяц. В режиме сокращения и на паузе каждый новый эпизод требует решения.',[
   {label:kind==='smoke'?'Выйти на перекур':'Выпить вечером',disabled:habit.used===tick,fn:()=>useHabit78(kind)},
   {label:'Вернуться к обычному режиму',hidden:!habit.mode,fn:()=>{delete habit.mode;}},
   {label:'Сократить',disabled:!habit.strength||habit.mode==='limit',fn:()=>{habit.mode='limit';}},
   {label:'Сделать паузу',disabled:!habit.strength||habit.mode==='pause',fn:()=>{habit.mode='pause';}},
   {label:support?'Попросить поддержки · '+support.name:'Записать причину для паузы',
    disabled:!habit.mode||!habit.strength||tick-(habit.supported??-6)<3,
    fn:()=>{
      habit.supported=tick;
      habit.strength=Math.max(0,habit.strength-1);
      if(support){
        support.bond=clamp((support.bond||0)+1);
        remember(support,'Разговор о привычках');
      }
      log('Поддержка в паузе',support?'Удалось обсудить перемены с близким человеком.':'Записана причина, к которой можно вернуться.','Привычки');
    }}
 ]);
}

function habitsMenu78(){
 if(s.age<18||s.dead)return;
 menu65('Привычки и поддержка',Object.entries(habitLabels78).map(([kind,label])=>[label,()=>habitDetail78(kind)]),
   'Отдельные решения могут стать регулярной привычкой. Сокращение или пауза доступны в любой момент.');
}

autonomousMonth=function(){
 habitBase78.autonomousMonth();
 if(s.age<18||s.dead)return;
 const habits=habits78(),tick=s.clock.ticks;
 for(const kind of Object.keys(habitLabels78)){
   const habit=habits[kind];
   if(habit.strength>=3&&!habit.mode){
     if(habit.used!==tick&&!useHabit78(kind))habit.mode='limit';
   }else if(habit.strength&&habit.used!==tick&&(habit.mode==='pause'||(tick-habit.used>=4&&tick%3===0))){
     habit.strength--;
   }
 }
 if(tick-(habits.prompt??0)<3||s.pending.some(q=>q.type==='habit78'))return;
 const stressed=s.mood<40||s.clock.fatigue>=65;
 const withCompany=habits.social===tick;
 const choices=[];
 if(tick-(habits.workPrompt??-24)>=24&&s.job&&permission16(s.country,'work')&&!s.job.suspended28)choices.push({kind:'smoke',context:'work'});
 if(withCompany)choices.push({kind:'drink',context:'social'});
 if(stressed)choices.push({kind:pick(['smoke','drink']),context:'stress'});
 const available=choices.filter(q=>habits[q.kind].used!==tick);
 if(!available.length||Math.random()>=.45)return;
 habits.prompt=tick;
 const invitation=pick(available);
 if(invitation.context==='work')habits.workPrompt=tick;
 queueOnce({type:'habit78',...invitation});
};

finishTask=function(t){
 const before=t.state;
 habitBase78.finishTask(t);
 if(s.age>=18&&t.kind==='meeting53'&&before!=='completed'&&t.state==='completed'){
   habits78().social=s.clock.ticks;
 }
};

resolvePending=function(){
 const q=s.pending[0];
 if(q?.type!=='habit78')return habitBase78.resolvePending();
 const prompt={
   work:['Перекур с коллегами','Коллеги выходят на улицу и зовут с собой.'],
   social:['Ещё по одной?','В компании предлагают выпить за встречу.'],
   stress:['Тяжёлый месяц',q.kind==='smoke'?'Хочется выйти на перекур.':'Хочется выпить и закончить на этом день.']
 }[q.context];
 const answer=use=>()=>{
   if(s.pending[0]!==q)return;
   if(use&&!useHabit78(q.kind)){s.pending.shift();if(s.pending.length)resolvePending();return;}
   s.pending.shift();
   if(s.pending.length)resolvePending();
 };
 show(prompt[0],prompt[1],[
   {label:q.kind==='smoke'?'Закурить':'Выпить',hint:money(habitCost78(q.kind)),fn:answer(true)},
   ...(q.context==='work'?[{label:'Пойти, но не курить',fn:()=>{if(s.pending[0]!==q)return;s.mood=clamp(s.mood+1);log('Перерыв с коллегами','Поговорили на улице. Вы не курили.','Работа');answer(false)();}}]:[]),
   {label:q.context==='social'?'Взять безалкогольное':'Пропустить',fn:answer(false)}
 ]);
};

actionCatalog24=function(){
 const list=habitBase78.actionCatalog24();
 if(s.age>=18)list.push({id:'habits78',label:'Привычки и поддержка',keywords:'курение сигареты алкоголь выпивка бросить',fn:habitsMenu78});
 return list;
};

function studyWeekMenu78(){
 const study=path16().study,tick=s.clock.ticks+1;
 if(!study||study.status==='paused')return;
 const planned=study.skipWeek78===tick;
 show(planned?'Отменить пропуск недели?':'Пропустить учебную неделю?',
   'За ближайший месяц прогресс и прирост навыка будут на четверть меньше, оценки снизятся на 3 пункта. Оплата и статус программы сохранятся.',[
   {label:planned?'Вернуться к обычному графику':'Запланировать пропуск',fn:()=>{
     if(path16().study!==study||study.status==='paused'||s.clock.ticks+1!==tick)return;
     if(planned)delete study.skipWeek78;
     else study.skipWeek78=tick;
   }},
   {label:'Назад',fn:()=>{}}
 ]);
}
