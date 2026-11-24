'use strict';
const petStoriesBase81={petDetails,finishTask,startTask05,autonomousMonth};
const petTitles81=['Участник','Призёр выставки','Победитель породы','Лучший на выставке'];

function petTitle81(p){
 return Math.max(0,...(p.shows81||[]).map(q=>q.rank));
}

function pedigree81(p){
 if(p.pedigree81)return p.pedigree81;
 if(p.breed38&&(p.source38==='breeder'||p.owner))return {source:'Заводчик',parents:[]};
 return null;
}

function pedigreeParent81(p){
 return {name:p.name,owner:p.owner,rank:petTitle81(p),parents:pedigree81(p)?.parents.map(q=>({name:q.name,rank:q.rank}))||[]};
}

function litterPedigree81(mother,father){
 return mother.breed38&&mother.breed38===father.breed38&&pedigree81(mother)&&pedigree81(father)?
   {source:'Домашний помёт',parents:[pedigreeParent81(mother),pedigreeParent81(father)]}:null;
}

function litterPrice81(litter){
 if(!litter.pedigree81)return 0;
 const titleScore=litter.pedigree81.parents.reduce((n,p)=>n+p.rank,0);
 return Math.round(c().cost*petBreed38(litter.breed38).price*(1+titleScore*.06));
}

function petShowReason81(p){
 if(s.dead||s.age<18||!ownedPet79(p.id)||!p.breed38||p.months<9||!pedigree81(p))return 'Нужны породистый питомец от 9 месяцев и родословная.';
 if(s.clock.ticks<(p.nextShow81||0)||s.clock.tasks.some(t=>t.kind==='petShow81'&&t.petId===p.id&&t.state!=='cancelled'))return 'Следующая выставка пока недоступна.';
 if(activeLitter79(p.id)&&p.sex38==='f')return 'Сначала нужно закончить уход за помётом.';
 if(capacity()-totalHours()<2)return 'Нужны 2 свободных часа в неделю.';
 if(expenseAvailable231()<c().cost*.003)return 'Не хватает на взнос.';
 return '';
}

function petRecords81(id){
 const p=ownedPet79(id);
 if(!p)return;
 const d=pedigree81(p),reason=petShowReason81(p);
 const ancestors=d?.parents.map((q,i)=>(i===0?'Мать':'Отец')+' — '+q.name+
   (q.rank?' ('+petTitles81[q.rank]+')':'')+(q.parents.length?' · родители '+q.parents.map(g=>g.name).join(' и '):''));
 const history=(p.shows81||[]).map(q=>q.year+' · '+q.city+' · '+petTitles81[q.rank]);
 petShow38('Родословная и выставки · '+p.name,
   [d?'Документы · '+d.source:'Подтверждённой родословной пока нет.',...(ancestors||[]),
    ...(history.length?history:['История выставок пока пуста.'])].join('\n'),[
   {label:'Записаться на выставку · '+money(c().cost*.003),hint:reason||'2 ч/нед. · один месяц',disabled:!!reason,fn:()=>{
     if(petShowReason81(p))return;
     s.clock.tasks.push({id:id16('pet-show81'),kind:'petShow81',petId:id,country:s.country,city:residenceCity(),
       label:'Выставка · '+p.name,duration:1,progress:0,hours:2,state:'planned',startCostRatio:.003});
   }},
   {label:'К питомцу',fn:()=>petDetails(id)}
 ]);
}

function petEpisode81(p,id,title,body){
 const z=petFamily79();
 if(s.dead||!p||z.episodeTick81===s.clock.ticks||s.clock.ticks-(p.episode81?.[id]??-20)<8)return false;
 z.episodeTick81=s.clock.ticks;
 (p.episode81??={})[id]=s.clock.ticks;
 (p.notes??=[]).push(body);
 log(title,body,'Животные');
 return true;
}

function petHomeEpisodes81(){
 const pets=s.pets.filter(p=>ownedPet79(p.id));
 if(!pets.length||!chance(.22))return;
 const p=pick(pets);
 const child=children54().find(q=>q.age>=4&&(!q.city18||q.city18===residenceCity()));
 const scenes=[
   ['box','Коробка принята','Новая лежанка осталась пустой. '+p.name+' спит в коробке, в которой её привезли.'],
   ['socks','Пропавший носок',p.name+' обнаружил носок раньше, чем удалось найти второй.']
 ];
 if(p.kind==='cat')scenes.push(['fur','Комок шерсти',p.name+' срыгнул комок шерсти на пол. Из всех поверхностей выбрана та, по которой ходят босиком.']);
 if(child&&['cat','dog'].includes(p.kind))scenes.push(['bed','Новое место для сна',p.name+' теперь засыпает на краю кровати, где спит '+child.name+'.']);
 const choices=scenes.filter(([id])=>s.clock.ticks-(p.episode81?.[id]??-20)>=8);
 if(choices.length)petEpisode81(p,...pick(choices));
}

startTask05=function(t){
 if(['petShow81','petCafe81'].includes(t.kind)&&!['cancelled','completed','paused'].includes(t.state)){
   const p=ownedPet79(t.petId);
   if(!p||t.country!==s.country||t.city!==residenceCity()||
      t.kind==='petShow81'&&(!pedigree81(p)||p.sex38==='f'&&activeLitter79(p.id))){
     archiveTask05(t,'cancelled');
     return false;
   }
 }
 return petStoriesBase81.startTask05(t);
};

finishTask=function(t){
 if(t.kind==='petShow81'||t.kind==='petCafe81'){
   if(['cancelled','completed','paused'].includes(t.state)||t.progress<t.duration)return;
   const p=ownedPet79(t.petId);
   if(!startTask05(t))return;
   if(t.kind==='petCafe81'){
     petEpisode81(p,'cafe','Знакомство за соседним столиком',p.name+' пошёл знакомиться с соседями по столику на террасе кафе. Кофе остался остывать.');
   }else{
     const score=rnd(0,65)+Math.min(20,(p.training38||0)*4)+Math.round(p.bond*.25);
     const rank=score>=87?3:score>=72?2:score>=52?1:0;
     (p.shows81??=[]).push({rank,tick:s.clock.ticks,year:s.year,city:t.city});
     p.nextShow81=s.clock.ticks+6;
     log('Выставка · '+p.name,petTitles81[rank]+' · '+t.city+'. Результат внесён в историю.','Животные');
   }
   archiveTask05(t,'completed');
   return;
 }
 const walked=t.kind==='petCare38'&&t.care==='walk'&&!petState38().completed.includes(t.id);
 petStoriesBase81.finishTask(t);
 if(walked&&petState38().completed.includes(t.id)&&chance(.4)){
   const p=ownedPet79(t.petId);
   if(p)petEpisode81(p,'stick','Палка с прогулки',p.name+' притащил домой палку, которая едва прошла в дверь.');
 }
};

autonomousMonth=function(){
 petStoriesBase81.autonomousMonth();
 petHomeEpisodes81();
};

petDetails=function(id){
 const p=ownedPet79(id);
 if(!p||s.dead||!['dog','cat'].includes(p.kind))return petStoriesBase81.petDetails(id);
 const baseShow=show;
 show=function(title,text,opts,...rest){
   const cafe=p.kind==='dog'&&s.age>=18;
   return baseShow(title,text,[
     ...opts.slice(0,-1),{label:'Родословная и выставки',fn:()=>petRecords81(id)},
     ...(cafe?[{label:'Сходить в кафе с собакой',hint:'Терраса · 1 ч/нед. на один месяц',
       disabled:capacity()-totalHours()<1||s.clock.tasks.some(t=>t.kind==='petCafe81'),
       fn:()=>{s.clock.tasks.push({id:id16('pet-cafe81'),kind:'petCafe81',petId:id,country:s.country,city:residenceCity(),
         label:'Кафе · '+p.name,duration:1,progress:0,hours:1,state:'planned'});}
     }]:[]),...opts.slice(-1)
   ],...rest);
 };
 try{return petStoriesBase81.petDetails(id);}finally{show=baseShow;}
};
