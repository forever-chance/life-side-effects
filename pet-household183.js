'use strict';

function petHousehold183(p) {
 if (!p.household183) {
  const parent=p.familyGift67&&s.age<18?parents17().find(childLocal55):null;
  const keeper=parent?.id||'player';
  p.household183={owner:keeper,keeper,payer:keeper,country:s.country,city:residenceCity()};
 }
 const h=p.household183;
 const person=h.keeper==='player'?null:living(h.keeper);
 if(h.keeper==='player'&&h.country===s.country)h.city=residenceCity();
 if(person){
  h.country=person.country;
  h.city=personCity62(person)||cities[person.country][0];
 }
 return h;
}

function petAtHome183(p) {
 const h=petHousehold183(p);
 if (h.keeper==='player') return h.country===s.country&&h.city===residenceCity();
 return h.country===s.country&&living(h.keeper)&&
   (s.housing.occupant===h.keeper||currentPartner()?.id===h.keeper&&currentPartner().cohabit||
    s.housing.mode==='parents'&&s.age<18&&parents17().some(x=>x.id===h.keeper))&&
   (!living(h.keeper).city18||h.city===residenceCity());
}

function petHouseholdCandidates183(p) {
 const h=petHousehold183(p);
 return s.people.filter(person=>person.alive&&person.age>=18&&childLocal55(person)&&
  (parents17().includes(person)||['Партнер','Бывший партнер'].includes(person.role)||person.divorced)&&
  ((person.inner?.trust??0)>=45||person.id===h.owner)&&
  s.pets.filter(other=>other!==p&&other.alive&&petHousehold183(other).keeper===person.id).length<2);
}

function assignPetHome183(id,keeper) {
 const p=s.pets.find(p=>p.id===id&&p.alive);
 if(!p||s.clock.tasks.some(t=>t.petId===id&&!['completed','cancelled'].includes(t.state))||s.age<18||s.dead||p.away57||p.tripCare57?.status==='active')return false;
 const h=petHousehold183(p),owner=living(h.owner);
 if(h.country!==s.country||h.city!==residenceCity()||
    owner&&(owner.inner?.trust??0)<45&&keeper!==owner.id)return false;
 if(keeper==='player'&&!petAtHome183(p)&&
   (petSlots38()>=5||capacity()-totalHours()<petKinds[p.kind].hours))return false;
 if(keeper!=='player'&&!petHouseholdCandidates183(p).some(x=>x.id===keeper))return false;
 Object.assign(h,{owner:keeper,keeper,payer:keeper});
 const who=keeper==='player'?'с вами':'у '+living(keeper).name;
 p.notes.push('Новый дом: '+who+'.');
 log('Дом питомца · '+p.name,'Теперь живёт '+who+'. Там же оплачивают уход.','Животные',true);
 save();
 return true;
}

const petDetailsBase183=petDetails;
petDetails=function(id){
 const p=s.pets.find(p=>p.id===id&&p.alive);
 if(!p)return petDetailsBase183(id);
 const h=petHousehold183(p),here=petAtHome183(p);
 const label=id=>id==='player'?'Вы':s.people.find(person=>person.id===id)?.name||'Близкий';
 const baseShow=show;
 show=function(title,description,options,...rest){
  return baseShow(title,description+'\nВладелец: '+label(h.owner)+'. Дом: '+h.city+
   ' · '+label(h.keeper)+'. Уход оплачивает: '+label(h.payer)+'.',[
    ...(here&&s.age>=18&&h.keeper!=='player'&&h.payer!=='player'?[{
     label:'Взять оплату ухода на себя',fn:()=>{h.payer='player';save();petDetails(id);}
    }]:[]),
    ...(here&&h.keeper!=='player'&&h.payer==='player'&&(living(h.keeper)?.inner?.trust??0)>=45?[{
     label:'Договориться, чтобы уход оплачивал владелец',fn:()=>{h.payer=h.keeper;save();petDetails(id);}
    }]:[]),
    ...(here?options.filter(option=>option.label!=='Все животные'):[]),
    ...(s.age>=18&&h.country===s.country&&h.city===residenceCity()?[
     ...(h.keeper!=='player'?[{label:'Забрать к себе',fn:()=>{if(assignPetHome183(id,'player'))petDetails(id);}}]:[]),
     ...petHouseholdCandidates183(p).filter(person=>person.id!==h.keeper).map(person=>({
      label:'Передать питомца · '+person.name,fn:()=>{if(assignPetHome183(id,person.id))petDetails(id);}
     }))
    ]:[]),
    {label:'Все животные',fn:petMenu}
   ],...rest);
 };
 try{return petDetailsBase183(id);}finally{show=baseShow;}
};

function petMovePlan183(target,home,ids) {
 const local=s.pets.filter(p=>p.alive&&petAtHome183(p)&&petHousehold183(p).keeper==='player');
 if(target.country===s.country)return {cost:0,pets:local};
 const pets=local.filter(p=>(ids??[]).includes(p.id));
 const staying=local.filter(p=>!pets.includes(p));
 const unavailable=(ids??[]).some(id=>!pets.some(p=>p.id===id));
 const blocked=unavailable?'Состав питомцев изменился. Пересчитайте переезд.':staying.length?'Выберите перевозку для всех питомцев или заранее договоритесь об их новом доме.':
  pets.length&&home==='dorm'?'В общежитие заселяются без питомцев.':
  pets.some(p=>p.away57||p.tripCare57?.status==='active')?'Питомец должен вернуться домой до отъезда.':'';
 const unit=c().cost*.012+countries[target.country].cost*.008*fxRate86(target.country);
 return {pets,cost:pets.length*unit,blocked};
}

function finishPetMove183(plan,country,city) {
 for(const p of plan.pets){
  Object.assign(p.household183,{country,city});
  if(plan.cost)p.notes.push('Переезд · '+city+', '+countries[country].name+'.');
 }
}

const leaveHomeBase183=leaveHome;
leaveHome=function(...args){
 for(const p of s.pets)if(p.alive)petHousehold183(p);
 return leaveHomeBase183(...args);
};

const petHoursBase183=petHours;
petHours=function(){
 return petHoursBase183()-s.pets.filter(p=>p.alive&&!petAtHome183(p)).reduce((hours,p)=>hours+petKinds[p.kind].hours,0);
};

function settleFamilyPetCare183(){
 for(const p of s.pets.filter(p=>p.alive)){
  const h=petHousehold183(p);
  if(h.payer==='player')continue;
  const payer=living(h.payer);
  const rate=fxRate86(h.country);
  const due=petMonthly98(p.kind,h.country,h.city);
  const paid=Math.min(due*rate,parentAvailable17(payer));
  const funded=paid>0&&transaction17({
   key:'pet-family-care:'+p.id+':'+s.clock.ticks,purpose:'Уход за питомцем · '+p.name,
   initiator:h.payer,participants:[h.payer],parts:[{payer:h.payer,amount:paid}]
  });
  p.care39??={strain:0,condition:100};
  Object.assign(p.care39,{tick:s.clock.ticks,country:h.country,due,paid:funded?paid/rate:0});
  applyPetFunding39(p,true);
 }
}

function movePetsMenu183(kind,id,home,parent){
 const target=moveTarget68(kind,id);
 const local=s.pets.filter(p=>p.alive&&petAtHome183(p)&&petHousehold183(p).keeper==='player');
 if(!local.length)return false;
 const ids=local.map(p=>p.id),plan=petMovePlan183(target,home,ids);
 show('Питомцы и переезд',local.map(p=>p.name).join(', ')+'. В смету входят переноска, осмотр и документы по упрощённым игровым правилам.',
  [{label:'Взять с собой · '+money(plan.cost),hint:plan.blocked,disabled:!!plan.blocked,
    fn:()=>moveConfirm68(kind,id,home,parent,ids)},
   ...local.map(p=>({label:'Договориться о доме · '+p.name,fn:()=>petDetails(p.id)})),
   {label:'Другое жильё',fn:()=>moveOptions68(kind,id)}]);
 return true;
}

function petSeparationOptions183(partner){
 if(!partner.cohabit&&s.housing.occupant!==partner.id)return [];
 return s.pets.filter(p=>p.alive&&petAtHome183(p)).map(p=>({
  label:'Договориться о доме · '+p.name,fn:()=>petDetails(p.id)
 }));
}

const relocateFamilyBase183=relocateWithFamily;
relocateWithFamily=function(country,hostId=null,cost=0){
 if(country===s.country)return relocateFamilyBase183(country,hostId,cost);
 const pets=s.pets.filter(p=>p.alive&&petAtHome183(p)&&petHousehold183(p).keeper==='player');
 if(!pets.length)return relocateFamilyBase183(country,hostId,cost);
 const confirm=()=>{
  const plan=petMovePlan183({country},'family',pets.map(p=>p.id));
  if(plan.blocked)return toast(plan.blocked);
  const moved=relocateFamilyBase183(country,hostId,cost+plan.cost);
  if(moved) {
   finishPetMove183(plan,country,residenceCity());
   save();
  }
  return moved;
 };
 const plan=petMovePlan183({country},'family',pets.map(p=>p.id));
 show('Питомцы и переезд',pets.map(p=>p.name).join(', ')+'. Перевозка оплачивается вместе с дорогой.',[
  {label:'Взять с собой · '+money(plan.cost),disabled:!!plan.blocked,hint:plan.blocked,fn:confirm},
  ...pets.map(p=>({label:'Договориться о доме · '+p.name,fn:()=>petDetails(p.id)}))
 ]);
 return false;
};

function familyPetMove183(move){
 const pets=s.pets.filter(p=>p.alive&&move.participants.includes(petHousehold183(p).keeper)&&
  p.household183.country===move.from);
 return pets.length*(countries[move.from].cost*.012*fxRate86(move.from)+
  countries[move.country].cost*.008*fxRate86(move.country));
}

function emergencyPets183(country){
 const ids=s.pets.filter(p=>p.alive&&petAtHome183(p)&&petHousehold183(p).keeper==='player').map(p=>p.id);
 return petMovePlan183({country},'room',ids);
}
