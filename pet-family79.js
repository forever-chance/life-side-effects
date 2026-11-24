'use strict';
const petFamilyBase79={autonomousMonth,resolvePending,petDetails,petMenu,transferPetToNPC58};
const streetAnimals79={ru:.12,rs:.12,br:.12,mx:.12,nl:.04};

function petFamily79(){
 return s.petFamily79??={lastFind:-12,litters:[]};
}

function ownedPet79(id){
 return s.pets.find(p=>p.id===id&&p.alive&&(typeof petAtHome183!=='function'||petAtHome183(p))&&!p.away57&&p.tripCare57?.status!=='active');
}

function placePet79(q,source,price){
 const id='placement79:'+q.id;
 if(s.pets.some(p=>p.command38===id))return false;
 const why=petReason38(q.kind,c().cost*price);
 if(why){toast(why);return false;}
 const payload={...q,source38:source,price};
 if(!completePet38({id,country:s.country,payload}))return false;
 const pet=s.pets.find(p=>p.command38===id);
 pet.months=q.months??12;
 if(typeof petWeight189==='function')petWeight189(pet);
 if(q.mother)pet.parents79=[q.mother,q.father];
 if(q.pedigree81)pet.pedigree81=q.pedigree81;
 if(q.health184)pet.health184={...q.health184};
 if(q.litterId182){pet.litterId182=q.litterId182;pet.notes.push('Родился в помёте '+q.litterId182+'.');}
 return true;
}

function streetDecision79(q){
 const z=petFamily79();
 const cat=q.kind==='cat',name=cat?'кошку':'собаку';
 const answer=check=>()=>{
   if(s.pending[0]!==q)return;
   s.pending.shift();
   if(check){
     z.find={...q,id:q.findId,due:s.clock.ticks+1,status:'checking'};
     log('Поиск хозяев','Местная служба проверит чип и объявления.','Животные');
   }
   if(s.pending.length)resolvePending();
 };
 petShow38('На улице замечено животное','Во дворе вы заметили '+name+' без видимого хозяина.',[
   {label:'Сообщить местной службе',fn:answer(true)},
   {label:'Пройти мимо',fn:answer(false)}
 ],null);
 petInsert38(petArtHTML38(q,true));
}

function streetHome79(q){
 if(petFamily79().find!==q||q.status!=='available'||q.country!==s.country||q.city!==residenceCity())return;
 const price=petKinds[q.kind].adopt;
 petShow38('Животное из вашего района','Хозяина не нашли. Животное осмотрели, и сейчас оно ждёт нового дома. Обустройство — '+money(c().cost*price)+'.',[
   {label:'Забрать домой',disabled:!!petReason38(q.kind,c().cost*price),fn:()=>{
     if(placePet79(q,'street',price))q.status='placed';
   }},
   {label:'Оставить на попечении службы',fn:()=>{q.status='shelter';}}
 ]);
 petInsert38(petArtHTML38(q,true));
}

function activeLitter79(id){
 return petFamily79().litters.find(l=>(l.mother===id||l.externalMother&&l.father===id)&&
   (l.status==='expecting'||l.young.some(q=>q.status==='available')));
}

function petPartners79(mother){
 if(!canBreed79(mother)||mother.sex38!=='f'||activeLitter79(mother.id))return [];
 return s.pets.filter(p=>p.kind===mother.kind&&p.sex38==='m'&&canBreed79(p)&&!activeLitter79(p.id)&&
   !p.parents79?.includes(mother.id)&&!mother.parents79?.includes(p.id)&&
   !p.parents79?.some(id=>mother.parents79?.includes(id)));
}

function canBreed79(p){
 return !!p&&ownedPet79(p.id)===p&&['cat','dog'].includes(p.kind)&&p.months>=18&&
   p.months<(p.kind==='dog'?84:96)&&!p.fixed79;
}

function breedingOffer80(p){
 const q=p?.breeding80?.offer;
 return q?.country===s.country&&q?.city===residenceCity()&&q.expires>s.clock.ticks?q:null;
}

function breedingOfferMenu80(id){
 const p=ownedPet79(id),q=breedingOffer80(p);
 if(!q||!canBreed79(p)||activeLitter79(id))return;
 const fee=c().cost*.012;
 petShow38('Предложение о вязке · '+p.name,
   q.owner+' предлагает познакомить питомцев. '+q.name+' · '+petLabel38(q)+' · '+Math.floor(q.months/12)+' г. Осмотр и первичный уход — '+money(fee)+'.'+
   (p.sex38==='m'?' Помёт останется у хозяина самки. Из него можно будет выбрать одного малыша.':' Помёт останется у вас.'),[
   {label:'Согласиться',disabled:expenseAvailable231()<fee,fn:()=>{
     if(breedingOffer80(p)!==q||!canBreed79(p)||activeLitter79(id))return;
     const externalMother=p.sex38==='m';
     if(createLitter80(externalMother?q:p,externalMother?p:q,externalMother)){
       delete p.breeding80.offer;
       p.breeding80.next=s.clock.ticks+8;
     }
   }},
   {label:'Отклонить',fn:()=>{
     if(p.breeding80.offer===q){
       delete p.breeding80.offer;
       p.breeding80.next=s.clock.ticks+3;
     }
   }}
 ]);
 petInsert38(petArtHTML38(q,true));
}

function breedingOffersMonth80(){
 const tick=s.clock.ticks;
 for(const p of s.pets){
   if(p.sex38==='f'&&!p.breeding80)p.breeding80={enabled:true,next:tick};
   const b=p.breeding80;
   if(!b?.enabled||!p.breed38||!canBreed79(p)||activeLitter79(p.id)||
      breedingOffer80(p)||tick<b.next)continue;
   const id=id16('match80');
   b.offer={id,kind:p.kind,breed38:p.breed38,sex38:p.sex38==='m'?'f':'m',
     owner:name(s.country),name:pick(petKinds[p.kind].names),months:rnd(24,60),
     art38:petArtFor38(p.kind,p.breed38,id),country:s.country,city:residenceCity(),expires:tick+4};
   b.next=tick+4;
   log('Предложение о вязке',p.name+' · кандидат той же породы. Ответить можно в меню животных.','Животные');
 }
}

function petVet79(id){
 const p=ownedPet79(id);
 if(!p||s.age<18||s.dead||!['cat','dog'].includes(p.kind))return;
 const litter=activeLitter79(id),expecting=litter?.status==='expecting'&&!litter.externalMother;
 const fee=c().cost*.006,breedingFee=c().cost*.012;
 const partners=petPartners79(p),offer=breedingOffer80(p);
 petShow38('Ветеринар и разведение · '+p.name,
   p.fixed79?'Стерилизация уже проведена.':expecting?'Ожидается помёт.':'Для планирования помёта нужны два взрослых питомца одного вида. В стоимость входит первичный уход.',[
   {label:(p.sex38==='m'?'Кастрация':'Стерилизация')+' · '+money(fee),disabled:expecting||!!p.fixed79||p.months<6||expenseAvailable231()<fee,fn:()=>{
     if(ownedPet79(id)!==p||p.fixed79||p.months<6||expecting)return;
     if(!payExpense23(fee,'Ветеринарная процедура','fixed79:'+id))return toast('На процедуру не хватает средств.');
     p.fixed79=true;
     log(p.name+' · операция проведена','Отметка сохранена в карточке питомца.','Животные');
   }},
   ...(p.breed38&&canBreed79(p)?[{
     label:p.breeding80?.enabled?'Приостановить предложения о вязке':'Получать предложения о вязке',
     hint:'От местных хозяев питомцев той же породы',fn:()=>{
       const enabled=!p.breeding80?.enabled;
       p.breeding80={enabled,next:s.clock.ticks+1};
     }
   },...(offer?[{label:'Посмотреть кандидата · '+offer.name,fn:()=>breedingOfferMenu80(id)}]:[])]:[]),
   ...partners.map(other=>({label:'Запланировать помёт · '+other.name,hint:money(breedingFee)+' · осмотр и первичный уход',
     disabled:expenseAvailable231()<breedingFee,fn:()=>planLitter79(id,other.id)})),
   {label:'Назад к питомцу',fn:()=>petDetails(id)}
 ]);
}

function planLitter79(motherId,fatherId){
 const mother=ownedPet79(motherId),father=ownedPet79(fatherId);
 if(s.age<18||s.dead||!father||!petPartners79(mother).includes(father))return false;
 return createLitter80(mother,father,false);
}

function createLitter80(mother,father,externalMother){
 const id=id16('litter79'),fee=c().cost*.012;
 if(!payExpense23(fee,'Осмотр и уход за помётом','litter79:'+id))return false;
 petFamily79().litters.push({id,mother:mother.id,father:father.id,motherName:mother.name,externalMother,kind:mother.kind,
   pedigree81:litterPedigree81(mother,father),
   breed38:mother.breed38===father.breed38?mother.breed38:null,due:s.clock.ticks+2,status:'expecting',young:[]});
 log('Ожидается помёт',mother.name+' · рождение примерно через два игровых месяца.','Животные');
 return true;
}

function litterTitle80(litter){
 return s.pets.find(p=>p.id===litter.mother)?.name||litter.motherName||'питомец';
}

function litterListing80(litter){
 if(litter.externalMother||!['expecting','born'].includes(litter.status))return;
 const list=litter.listing80;
 if(list?.active){
   list.active=false;
   list.waiting=[];
 }else litter.listing80={active:true,waiting:[],next:s.clock.ticks+1};
 litterMenu79(litter);
}

function litterMenu79(litter){
 const young=litter.young.filter(q=>q.status==='available');
 const list=litter.listing80,ready=s.clock.ticks>=litter.ready;
 const expecting=litter.status==='expecting',price=litterPrice81(litter);
 const description=expecting?'Ожидается ещё '+Math.max(0,litter.due-s.clock.ticks)+' мес.':
   litter.externalMother?'Можно оставить одного малыша. Остальных пристраивает хозяин самки.':
   'Малышей можно оставить дома при наличии места и времени. Через четыре месяца после того, как они подрастут, волонтёры заберут оставшихся.';
 const options=young.flatMap(q=>[
   {label:'Оставить дома · '+q.name,disabled:!ready||!!petReason38(q.kind),fn:()=>{
     const keep=name=>{
       if(q.status!=='available'||s.clock.ticks<litter.ready||
          !placePet79({...q,name,litterId182:litter.id,months:s.clock.ticks-litter.due},'litter',0))return;
       q.status='placed';q.name=name;
       if(litter.externalMother)for(const other of young)if(other.status==='available')other.status='rehomed';
       save();litterMenu79(litter);
     };
     if(typeof openPetName182==='function')openPetName182(q,keep,{title:'Помёт · '+litterTitle80(litter),open:()=>litterMenu79(litter)});
     else keep(q.name);
   }},
   ...(!litter.externalMother?[{label:'Пристроить · '+q.name,disabled:!ready,fn:()=>{
     if(q.status!=='available'||s.clock.ticks<litter.ready)return;
     const adopter=list?.active&&list.waiting.shift();
     q.status='rehomed';
     log(q.name+' · новый дом',adopter?'Забирает '+adopter+' из листа ожидания.':'Волонтёры помогли с пристройством.','Животные');
     litterMenu79(litter);
   }}]:[]),
   ...(!litter.externalMother&&list?.active&&list.waiting.length&&price?[{
     label:'Передать по объявлению · '+q.name+' · '+money(price),disabled:!ready,
     fn:()=>{
       if(q.status!=='available'||!list.active||!list.waiting.length||s.clock.ticks<litter.ready)return;
       const adopter=list.waiting.shift();
       q.status='rehomed';
       s.cash+=litterPrice81(litter);
       log(q.name+' · новый дом',adopter+' забирает малыша по объявлению. Получено '+money(litterPrice81(litter))+'.','Животные');
       litterMenu79(litter);
     }
   }]:[])
 ]);
 if(!litter.externalMother&&(expecting||young.length))options.push({
   label:list?.active?'Снять объявление':expecting?'Открыть лист ожидания':'Опубликовать объявление о помёте',
   hint:list?.active?'Лист ожидания будет закрыт':'Заинтересованные хозяева появятся со временем',
   fn:()=>litterListing80(litter)
 });
 petShow38('Помёт · '+litterTitle80(litter),description+(price?' Цена по родословной — '+money(price)+'.':'')+
   (list?.active?' Лист ожидания · '+(list.waiting.join(', ')||'пока пуст')+'.':''),
   [...options,{label:'Назад к животным',fn:petMenu}]);
 if(litter.young.length)petInsert38('<div class="litter-grid182">'+litter.young.map(q=>
  '<article>'+petArtHTML38(q)+'<strong>'+esc(q.name)+'</strong><small>'+
  esc(petLabel38(q)+' · '+(q.sex38==='f'?'самка':'самец'))+'</small><small>'+
  esc(({available:'Ищет дом',placed:'Остался дома',rehomed:'Пристроен'})[q.status]||q.status)+
  '</small><small>'+esc(q.id)+'</small></article>').join('')+'</div>');
}

function litterListingMonth80(litter,tick){
 const list=litter.listing80;
 if(!list?.active||tick<list.next)return;
 const places=litter.status==='expecting'?3:litter.young.filter(q=>q.status==='available').length;
 if(!places&&litter.status!=='expecting'){
   list.active=false;
   list.waiting=[];
   return;
 }
 if(list.waiting.length<places){
   const owner=name(s.country);
   if(!list.waiting.includes(owner))list.waiting.push(owner);
 }
 list.next=tick+1;
}

function petFamilyMonth79(){
 if(s.dead||s.age<18)return;
 const z=petFamily79(),tick=s.clock.ticks,q=z.find;
 if(q?.status==='checking'&&tick>=q.due){
   q.status=q.owner?'owner':'available';
   q.until=tick+4;
   log(q.owner?'Хозяин нашёлся':'Животное ищет дом',q.owner?'Животное вернулось домой.':'Ответ службы доступен в разделе «Животные дома».','Животные');
 }
 if(q?.status==='available'&&tick>=q.until)q.status='shelter';
 breedingOffersMonth80();
 for(const litter of z.litters){
   litterListingMonth80(litter,tick);
   if(litter.status==='born'&&tick>=litter.ready+4){
     const waiting=litter.young.filter(q=>q.status==='available');
     if(waiting.length){
       for(const q of waiting)q.status='rehomed';
       log(litter.externalMother?'Хозяин забрал оставшихся малышей':'Волонтёры забрали малышей','Оставшимся животным подберут дома.','Животные');
     }
   }
   if(litter.status!=='expecting'||tick<litter.due)continue;
   if(!litter.externalMother&&!s.pets.some(p=>p.id===litter.mother&&p.alive)){
     litter.status='closed';
     log('Помёт больше не ожидается','Событие завершено.','Животные');
     continue;
   }
   litter.status='born';
   litter.ready=tick+2;
   for(let i=0,n=rnd(1,3);i<n;i++){
     const id=litter.id+':'+i,{kind,breed38,mother,father}=litter;
     const names=petKinds[kind].names.filter(name=>!litter.young.some(q=>q.name===name)),sex38=pick(['f','m']);
     litter.young.push({id,litterId182:litter.id,kind,breed38,mother,father,name:typeof suggestPetName182==='function'?suggestPetName182(kind,sex38,s.country,litter.young.map(q=>q.name)):pick(names),sex38,
        ...(typeof litterTraits184==='function'?litterTraits184(id,mother,father,kind,breed38):{art38:petArtFor38(kind,breed38,id)}),pedigree81:litter.pedigree81,status:'available'});
   }
   log('Родился помёт','Малышей можно будет оставить или пристроить через два месяца.','Животные');
 }
 const rate=streetAnimals79[s.country];
 if(rate&&tick-z.lastFind>=12&&!['checking','available'].includes(q?.status)&&
   !s.pending.some(q=>q.type==='street79')&&chance(rate)){
   z.lastFind=tick;
   const kind=s.country==='nl'||chance(.65)?'cat':'dog',id=id16('stray79');
   queueOnce({type:'street79',findId:id,kind,art38:petArtFor38(kind,null,id),
     country:s.country,city:residenceCity(),owner:chance(s.country==='nl'?.65:.35)});
 }
}

autonomousMonth=function(){
 petFamilyBase79.autonomousMonth();
 petFamilyMonth79();
};

resolvePending=function(){
 const q=s.pending[0];
 if(q?.type==='street79')return streetDecision79(q);
 return petFamilyBase79.resolvePending();
};

petMenu=function(){
 if(s.age<18||s.dead)return petFamilyBase79.petMenu();
 const z=petFamily79(),q=z.find,baseShow=show;
 show=function(title,text,opts,...rest){
   const rows=z.litters.filter(l=>l.status==='expecting'||l.young.some(q=>q.status==='available')).map(l=>({
     label:'Помёт · '+litterTitle80(l),fn:()=>litterMenu79(l)
   }));
   for(const p of s.pets){
     const offer=breedingOffer80(p);
     if(offer&&canBreed79(p)&&!activeLitter79(p.id)){
       rows.unshift({label:'Предложение о вязке · '+p.name,fn:()=>breedingOfferMenu80(p.id)});
     }
   }
   if(q?.status==='available'&&q.country===s.country&&q.city===residenceCity()){
     rows.unshift({label:'Животное из вашего района',fn:()=>streetHome79(q)});
   }
   return baseShow(title,text,[...opts,...rows],...rest);
 };
 try{return petFamilyBase79.petMenu();}finally{show=baseShow;}
};

petDetails=function(id){
 const p=ownedPet79(id);
 if(s.age<18||s.dead||!p||!['cat','dog'].includes(p.kind))return petFamilyBase79.petDetails(id);
 const baseShow=show;
 show=function(title,text,opts,...rest){
   return baseShow(title,text+(p.fixed79?' · Стерилизация проведена.':''),[
     ...opts.slice(0,-1),{label:'Ветеринар и разведение',fn:()=>petVet79(id)},
     ...(typeof petCheckup184==='function'?[{label:'Профилактический осмотр',hint:money(petMonthly98(p.kind)*.65),disabled:p.health184?.checked===s.clock.ticks,fn:()=>petCheckup184(id)}]:[]),...opts.slice(-1)
   ],...rest);
 };
 try{return petFamilyBase79.petDetails(id);}finally{show=baseShow;}
};

transferPetToNPC58=function(id,person){
 if(activeLitter79(id)&&!activeLitter79(id).externalMother)return toast('Передачу можно обсудить после пристройства помёта.');
 return petFamilyBase79.transferPetToNPC58(id,person);
};
