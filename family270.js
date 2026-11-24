'use strict';
// Сборка 270, семья: три бага из писем игрока.
// 1. «Пригласить к себе» больше не переносит игрока в город гостя. Хозяином жилья гость считается только в режимах
//    «у родителей» и «у близкого» (repairHome62, currentHome59). Близкого из другого города зовут через «Переезд с семьёй»
//    (familyMoveMenu61 / inviteFollow61): три месяца, согласие, помощь с дорогой. Список «С кем жить» показывает город.
// 2. Любой переезд игрока внутри страны (moveHome, rentHouse41, acceptStay42, relocateWithFamily, «Вернуться к родителям»,
//    общежитие, переезд по учёбе или работе) забирает несовершеннолетних детей, которые жили с ним, как relocation68
//    finishMove16. Правило одно: ребёнок в вашем городе живёт с вами и переезжает с вами, даже если второй родитель
//    остаётся (опеки в игре нет); ребёнок в другом городе со вторым родителем живёт с ним. Перед переездом в окне видно,
//    кто едет с вами и что партнёр остаётся по прежнему адресу; после — запись в ленте, в том числе после переезда
//    в другую страну. Переезд партнёра следом (inviteMove) больше не забирает ребёнка, который живёт со вторым
//    родителем в другом городе.
// 3. Починка сохранений: игрок, которого «Пригласить к себе» увезло в город гостя, возвращается в город своей аренды;
//    несовершеннолетние дети, оставшиеся в другом городе без второго родителя рядом, снова живут с игроком
//    (в сохранении — сразу, в игре — если так и остались к следующему месяцу).
// 4. Питомцы: в поездке и при переезде учитываются только ваши питомцы (хозяин — вы или ваш несовершеннолетний
//    ребёнок, который живёт с вами). Собака мамы или партнёра остаётся с хозяином, гостиница за неё не начисляется,
//    отложенная из-за неё поездка сама возвращается в план. Питомец умершего близкого вашим сам по себе не становится.
// 5. Дети младше 12 лет и поездки: одно правило вместо двух (travel86 childcareWhy86 и homecare59 childrenCareWhy59).
//    Присмотр на поездку — взрослый дома, второй родитель, бабушка или дедушка, близкий, няня по договору, няня
//    на время поездки (оплата при отъезде) или лагерь с проживанием, который совпадает с поездкой. «Отпуск дома»
//    присмотра не требует. Отложенная поездка каждый месяц проверяется заново и уезжает, когда причина отпала.
const family270Base={repairHome62,personCity62,currentHome59,moveHome,rentHouse41,acceptStay42,relocateWithFamily,finishMove16,
 returnParentsMenu,householdMenu,householdMenu54,finishTask,livePets57,petPlanWhy57,tripDraft57,travelBeginMonth52,
 travelDepartureWhy52,travelWhy52,childrenCareWhy59,childGuardianHome59,childcareWhy86,childcareMenu86,childrenHome86,
 travelOptions86,ensureUX,show,moveConfirm68,enterDorm68,finishReturn29};

function familyState270(){return s.family270??={version:1};}

// ---------- 1. Адрес: гость не тянет игрока в свой город ----------

repairHome62=function(){
 if(!s?.housing||!cities[s.country])return;
 const h=s.housing,hosted=['parents','host'].includes(h.mode);
 /* 270: хозяин жилья — только когда игрок живёт у него; в аренде и своём жилье гость переезжает к игроку */
 const host=hosted?(living(h.occupant)||living(s.family17?.household?.parentId)):null;
 const own=h.mode==='own'&&s.properties?.find(p=>p.id===h.propertyId&&p.country===s.country);
 for(const p of s.properties||[])propertyAddress62(p);
 for(const a of s.estates58?.assets||[])if(a.type==='property')propertyAddress62(a.property);
 const history=s.path16?.residenceHistory?.filter(r=>r.country===s.country).at(-1);
 h.city=fallbackCity62(s.country,own?.city,host?.country===s.country?host.city18:null,h.city,
  h.listing41?.country===s.country?h.listing41.city:null,s.job?.workplace?.country===s.country?s.job.workplace.city:null,history?.city,c().city);
 if(h.listing41?.country===s.country&&!validCity62(s.country,h.listing41.city))h.listing41.city=h.city;
 if(h.display59&&(h.display59.listing?.country!==s.country||h.display59.listing?.city!==h.city))delete h.display59;
 for(const p of s.people||[])personCity62(p);
};

// Игрок живёт у друга (режим «у близкого»): родитель из старой записи family17 не переезжает в город друга.
personCity62=function(p){
 const h=s?.housing;
 if(p&&cities[p.country]&&h?.mode==='host'&&p.country===s.country&&h.occupant!==p.id&&living(h.occupant)&&s.family17?.household?.parentId===p.id){
  p.city18=fallbackCity62(p.country,p.city18,p.home59?.country===p.country?p.home59.city:null,h.city);
  return p.city18;
 }
 return family270Base.personCity62(p);
};

currentHome59=function(){
 const h=s?.housing;
 if(!h||!h.occupant||['parents','host','unstable42'].includes(h.mode))return family270Base.currentHome59();
 ensureHome();
 const property=h.mode==='own'&&s.properties.find(p=>p.id===h.propertyId);
 if(property||housingListing41()||['parents','host'].includes(h.mode)||!h.occupant)return family270Base.currentHome59();
 // Сосед по аренде — не хозяин квартиры: показываем своё жильё игрока.
 const key=[s.country,h.city,h.area,h.mode,h.lease40||'legacy'].join(':');
 if(h.display59?.key!==key)h.display59={key,listing:stableHome59(s.country,h.city,h.area||'center',s.saveId+':'+key,h.room40?'room':'flat')};
 return {listing:h.display59.listing,tenure:'rent',host:null};
};

function familyCohabitant270(){
 const p=currentPartner();
 if(p?.alive&&(p.cohabit||s.housing?.occupant===p.id))return p;
 const q=s.housing&&!['parents','host'].includes(s.housing.mode)&&living(s.housing.occupant);
 return q||null;
}

function familyMoveParts270(kind=''){
 if(!s||s.dead||s.age<18)return [];
 const parts=[],kids=ownChildren55().filter(childLocal55).map(p=>p.name),stay=familyCohabitant270();
 // За границу питомцев выбирают отдельно (movePetsMenu183), строка о них там не нужна.
 const pets=kind==='abroad'?[]:livePets57().map(p=>p.name),one=pets.length===1;
 const petList=pets.join(', ');
 if(kids.length&&pets.length)parts.push('С вами переезжают дети: '+kids.join(', ')+'; '+(one?'ваш питомец':'ваши питомцы')+' тоже: '+petList+'.');
 else if(kids.length)parts.push('С вами переезжают дети: '+kids.join(', ')+'.');
 else if(pets.length)parts.push(one?'С вами переезжает ваш питомец: '+petList+'.':'С вами переезжают ваши питомцы: '+petList+'.');
 if(stay&&stay.id!==kind)parts.push(stay.name+' остаётся по прежнему адресу: жить вместе вы перестанете.');
 return parts;
}
function familyMoveLine270(kind=''){return familyMoveParts270(kind).join(' ');}

// Кнопки, после которых игрок переезжает. В окне подтверждения дописываем, кто едет и кто остаётся.
// «Запланировать переезд» (relocation68) бывает и внутри страны, и за границу: вид берём из цели переезда.
let familyPathKind270=null;
moveConfirm68=function(kind,id,...rest){
 const prev=familyPathKind270;
 try{const target=moveTarget68(kind,id);familyPathKind270=target&&target.country!==s.country?'abroad':'';}catch(e){familyPathKind270='abroad';}
 try{return family270Base.moveConfirm68(kind,id,...rest);}finally{familyPathKind270=prev;}
};
const familyMoveLabels270={'Снять и переехать':'','Переехать сюда':'','Согласиться и переехать':'','Запланировать переезд':()=>familyPathKind270??'abroad',
 'Переехать к этому человеку':'','Вернуться к родителям':''};
function familyMoveKind270(label){const k=familyMoveLabels270[label];return typeof k==='function'?k():k;}
show=function(title,text,opts=[],...rest){
 try{
  if(s&&!s.dead&&s.age>=18&&Array.isArray(opts)){
   // Продажа жилья, в котором вы живёте, тоже переезд: в аренду того же района.
   const sell=title==='Продать объект?'&&/Одновременно переедете/.test(text);
   const o=opts.find(o=>o&&Object.hasOwn(familyMoveLabels270,o.label)&&!o.disabled&&!o.move270);
   const line=o?familyMoveLine270(familyMoveKind270(o.label)):sell?familyMoveLine270():'';
   if(line&&typeof text==='string'&&text.trim())text=text+'\n'+line;
   else if(line&&o)opts=opts.map(x=>x===o?{...x,hint:[x.hint,line].filter(Boolean).join(' · ')}:x);
  }
 }catch(e){console.error(e);}
 return family270Base.show.call(this,title,text,opts,...rest);
};

returnParentsMenu=function(...args){
 const original=show;
 show=function(title,text,opts,...rest){
  show=original;
  const line=familyMoveLine270();
  return original.call(this,title,line&&typeof text==='string'?text+'\n'+line:text,opts,...rest);
 };
 try{return family270Base.returnParentsMenu(...args);}finally{show=original;}
};

// «С кем жить»: город виден, человека из другого города зовут переехать, а не «к себе» мгновенно.
function familyHouseholdList270(){
 const h=s.housing;
 return closeCircle().filter(p=>p.age>=18&&p.country===s.country&&p.id!==h.occupant);
}

householdMenu=function(...args){
 const original=show;
 show=function(title,text,opts=[],...rest){
  if(title==='С кем жить?'){
   show=original;
   try{
    text=String(text).replace('Дети и животные остаются с вами.','Несовершеннолетние дети и ваши питомцы при любом переезде остаются с вами.');
    const list=familyHouseholdList270(),n=list.length;
    if(n&&opts.length>=n&&opts.slice(-n).every((o,i)=>o?.label===list[i].name+' · '+list[i].role)){
     const here=residenceCity();
     opts=[...opts.slice(0,opts.length-n),...list.map(p=>{const city=personCity62(p);
      return {label:p.name+' · '+p.role,hint:city===here?undefined:'Живёт: '+city,fn:()=>familyHouseholdPerson270(p.id)};})];
    }
   }catch(e){console.error(e);}
  }
  return original.call(this,title,text,opts,...rest);
 };
 try{return family270Base.householdMenu(...args);}finally{show=original;}
};

function familyInviteHere270(id){
 const p=living(id),h=s.housing;
 if(!p||p.age<18||p.country!==s.country||(p.inner?.trust??0)<45||h.occupant||['parents','host'].includes(h.mode))return false;
 if(personCity62(p)!==residenceCity())return familyMoveMenu61(p.id);
 activateHome();h.occupant=p.id;p.cohabit=p.role==='Партнер';p.city18=residenceCity();
 remember(p,'договорились жить вместе');
 log('Ещё один комплект ключей',p.name+': теперь вы живёте вместе и делите расходы на жильё · '+residenceCity()+'.','Жилье',true);
 save();
 return true;
}

function familyHouseholdPerson270(id){
 const p=living(id);if(!p)return householdMenu();
 const h=s.housing,city=personCity62(p),here=residenceCity(),local=city===here,trust=p.inner?.trust??0;
 const parent=['Мать','Отец'].includes(p.role),hosted=['parents','host'].includes(h.mode);
 const parts=familyMoveParts270(p.id);
 if(parts.length&&/^С вами/.test(parts[0]))parts[0]=parts[0][0].toLowerCase()+parts[0].slice(1);
 const line=parts.length?'Если переедете вы, '+parts.join(' '):'';
 const text=trust<45?'Сейчас человек не готов жить вместе.':
  local?'Человек готов обсудить совместный быт. Расходы и свободное время изменятся.':
  p.name+' живёт в другом городе: '+city+'. Жить вместе получится, только если кто-то из вас переедет.';
 const why=local?'':followWhy61(p,familyDestination61());
 show('Обсудить совместную жизнь · '+p.name,text+(line&&trust>=45?'\n'+line:''),[
  local?{label:'Пригласить к себе',disabled:trust<45||!!h.occupant||hosted,fn:()=>familyInviteHere270(p.id)}:
   {label:'Пригласить переехать к себе',hint:hosted?'Сначала нужно своё жильё':why||'Три месяца · '+money(c().cost*.1)+' · нужно согласие',
    disabled:trust<45||hosted||!!h.occupant&&h.occupant!==p.id,fn:()=>familyMoveMenu61(p.id)},
  {label:parent?'Вернуться к родителям':'Переехать к этому человеку',hint:local?undefined:'Переезд · '+city,disabled:trust<45,move270:true,
   fn:()=>moveHome(parent?'parents':'host',cities[s.country][0],'suburb',null,p.id)}
 ]);
}

householdMenu54=function(...args){
 const p=currentPartner();
 if(p?.alive&&p.country===s.country&&!p.cohabit&&s.housing?.occupant!==p.id&&personCity62(p)!==residenceCity()){
  const city=personCity62(p),why=followWhy61(p,familyDestination61());
  return show('Быт и договорённости',p.name+' живёт в другом городе: '+city+'. Для общего быта сначала решите, кто к кому переезжает.',[
   {label:'Пригласить переехать к себе',hint:why||'Три месяца · '+money(c().cost*.1)+' · нужно согласие',disabled:!!why,fn:()=>familyMoveMenu61(p.id)},
   {label:'Переехать к партнёру',hint:'Переезд · '+city,disabled:(p.inner?.trust??0)<45,fn:()=>familyHouseholdPerson270(p.id)},
   {label:'Общение на расстоянии',fn:()=>meetingsMenu53(p.id)}
  ]);
 }
 return family270Base.householdMenu54(...args);
};

// ---------- 2. Переезд игрока: дети едут с ним, партнёра не оставляют молча ----------

// Пока идёт переезд, починка в ensureUX молчит: moveHome сам вызывает render() до того, как дети переехали,
// и без этого дети «возвращались» записью «Дети снова живут с вами» вместо записи о переезде.
let familyMoveDepth270=0;
function familyWithMove270(run){
 if(familyMoveDepth270||!s||s.dead)return run();
 const from={country:s.country,city:residenceCity()},stay=familyCohabitant270();
 const kids=new Map(ownChildren55().map(p=>[p.id,{country:p.country,city:p.city18||null}]));
 familyMoveDepth270++;
 let result;
 try{result=run();}finally{familyMoveDepth270--;}
 try{familyAfterMove270(from,stay,kids);}catch(e){console.error(e);}
 return result;
}

function familyAfterMove270(from,stay,before){
 if(!s||s.dead||s.age<18)return;
 const city=residenceCity(),abroad=s.country!==from.country,moved=[];
 if(abroad||city!==from.city){
  for(const p of ownChildren55()){
   const b=before?.get(p.id);
   if(!b||b.country!==from.country||p.country!==s.country)continue;
   // Внутри страны едут дети, которые жили с вами; за границу — те, кого переезд уже перевёз в новую страну.
   if(!abroad&&b.city&&b.city!==from.city)continue;
   p.city18=city;
   p.lastMove={...(p.lastMove||{}),initiator:'family',from:from.country,to:s.country,year:s.year,city};
   childNote55(p,'Переезд вместе с семьёй · '+city);
   moved.push(p.name);
  }
 }
 if(moved.length)log('Дети переехали с вами',city+': '+moved.join(', ')+'.','Семья',true);
 if(stay?.alive&&!stay.cohabit&&s.housing?.occupant!==stay.id){
  const there=personCity62(stay);
  log('Живёте раздельно',stay.name+' остаётся по прежнему адресу · '+there+'.','Отношения',true);
 }
}

moveHome=function(...args){return familyWithMove270(()=>family270Base.moveHome(...args));};
rentHouse41=function(...args){return familyWithMove270(()=>family270Base.rentHouse41(...args));};
acceptStay42=function(...args){return familyWithMove270(()=>family270Base.acceptStay42(...args));};
relocateWithFamily=function(...args){return familyWithMove270(()=>family270Base.relocateWithFamily(...args));};
finishMove16=function(...args){return familyWithMove270(()=>family270Base.finishMove16(...args));};
enterDorm68=function(...args){return familyWithMove270(()=>family270Base.enterDorm68(...args));};
finishReturn29=function(...args){return familyWithMove270(()=>family270Base.finishReturn29(...args));};

// Второй взрослый родитель ребёнка, который живёт в его городе: тогда ребёнок живёт с ним, а не брошен.
function familyCustodian270(child){
 const ids=new Set([...(child?.bio27?.parents||[]),...(child?.birth49?.parents||[]),child?.parentId].filter(id=>id&&id!=='player'));
 for(const id of ids){
  const q=living(id);
  if(q&&q.age>=18&&q.country===child.country&&personCity62(q)===child.city18)return q;
 }
 return null;
}

finishTask=function(t,...rest){
 if(t?.kind!=='inviteMove'||!s)return family270Base.finishTask(t,...rest);
 const here=residenceCity(),keep=ownChildren55().filter(p=>p.country===s.country&&p.city18&&p.city18!==here)
  .map(p=>({p,city:p.city18,keeper:familyCustodian270(p)})).filter(x=>x.keeper);
 const result=family270Base.finishTask(t,...rest);
 /* 270: inviteMove забирал к игроку всех детей страны, даже тех, кто живёт со вторым родителем */
 for(const x of keep)if(x.keeper.alive&&x.keeper.country===x.p.country&&personCity62(x.keeper)===x.city)x.p.city18=x.city;
 return result;
};

// ---------- 3. Починка сохранений ----------

// «Пригласить к себе» до 270 переносило игрока в город гостя, хотя аренда оставалась в прежнем городе.
// Договор аренды тогда сменился без возврата залога (endLease40 не вызывался) — по этому и узнаём.
function familyOldCity270(){
 const h=s.housing;
 if(h?.mode!=='rent'||!h.occupant||!living(h.occupant)||typeof finance40!=='function')return null;
 const leases=finance40().leases||[],active=leases.find(q=>q.id===h.lease40&&q.status==='active');
 if(!active||active.country!==s.country)return null;
 if(active.city!==h.city)return active.mode===h.mode&&validCity62(s.country,active.city)?active.city:null;
 if(!String(active.signature||'').endsWith('|'+h.occupant))return null;
 const prev=leases.filter(q=>q!==active&&q.status==='ended'&&q.end===active.start&&q.country===s.country&&q.mode===active.mode&&
  q.city!==active.city&&q.depositReturned===undefined&&validCity62(s.country,q.city)).at(-1);
 return prev?.city||null;
}

function familyRepairCity270(){
 const old=familyOldCity270();
 if(!old)return false;
 const h=s.housing,p=living(h.occupant);
 h.city=old;delete h.display59;
 ensureHome();
 personCity62(p);
 if(p.role==='Партнер')p.cohabit=true;
 log('Снова дома · '+old,p.name+(p.gender==='f'?' переехала':' переехал')+' к вам, как вы и договаривались. Адрес аренды прежний, дети и ваши питомцы живут с вами.','Жилье',true);
 return true;
}

function familyStrayChildren270(){
 const city=residenceCity();
 return ownChildren55().filter(p=>p.country===s.country&&p.city18&&p.city18!==city&&!familyCustodian270(p)&&
  !(typeof campAway54==='function'&&campAway54(p.id)));
}

// Сохранение чинится сразу при первой проверке. Дальше ребёнок возвращается, только если он оказался в другом городе
// без второго родителя и так и остался к следующему месяцу: адрес игрока бывает мгновенно пересчитан туда и обратно
// внутри одного месяца (repairHome62 при смене хозяина в режиме «у родителей»), и детей за таким скачком не тянем.
function familyRepair270(){
 if(!s||s.dead||s.age<18||!s.housing||!Array.isArray(s.people)||!s.clock)return;
 const z=familyState270(),now=s.clock.ticks;
 if(z.cityChecked===undefined){z.cityChecked=now;familyRepairCity270();}
 const stray=familyStrayChildren270(),first=z.strayChecked===undefined;
 z.strayChecked??=now;
 if(!stray.length){delete z.stray;return;}
 const seen=z.stray||{},due=stray.filter(p=>first||Number.isInteger(seen[p.id])&&seen[p.id]<now);
 z.stray=Object.fromEntries(stray.filter(p=>!due.includes(p)).map(p=>[p.id,seen[p.id]??now]));
 if(!due.length)return;
 const city=residenceCity();
 for(const p of due){p.city18=city;childNote55(p,'Снова живёт с вами · '+city);}
 log('Дети снова живут с вами',city+': '+due.map(p=>p.name).join(', ')+'.','Семья',true);
 save();
}

ensureUX=function(...args){
 const result=family270Base.ensureUX(...args);
 try{if(!familyMoveDepth270)familyRepair270();}catch(e){console.error(e);}
 return result;
};

// ---------- 4. Питомцы: только ваши ----------

function familyPetMine270(p){
 if(!p?.alive)return false;
 if(typeof petHousehold183!=='function')return true;
 const h=petHousehold183(p);
 if(h.keeper==='player')return petAtHome183(p);
 // Чужой питомец ваш, только если хозяин — ваш несовершеннолетний ребёнок, который живёт с вами.
 // Собака умершего близкого (estates58 её не трогает) вашей сама по себе не становится, как и в 269.
 const keeper=living(h.keeper);
 return !!keeper&&keeper.age<18&&ownChild53(keeper)&&childLocal55(keeper)&&h.country===s.country;
}

livePets57=function(){return (s?.pets||[]).filter(familyPetMine270);};

function familyLivePlans270(d){
 const plans=d?.journey57?.pets;
 if(!Array.isArray(plans))return d;
 const ids=new Set(livePets57().map(p=>p.id)),kept=plans.filter(p=>ids.has(p.pet));
 return kept.length===plans.length?d:{...d,journey57:{...d.journey57,pets:kept}};
}

petPlanWhy57=function(d,...rest){return family270Base.petPlanWhy57(familyLivePlans270(d),...rest);};

function familyPrunePets270(t){
 const j=t?.journey57;
 if(!j||!Array.isArray(j.pets)||!pendingJourney57(t)||t.paid||t.partyPaid53||t.companyPaid54)return;
 const ids=new Set(livePets57().map(p=>p.id)),kept=j.pets.filter(p=>ids.has(p.pet));
 if(kept.length===j.pets.length)return;
 j.pets=kept;
 if(!kept.length)j.accepted=true;
 try{
  const q=quoteJourney57(tripDraft57(t));
  j.quote=q;
  if(!t.business54){t.fee=q.player;t.total53=q.total;if(t.party53)t.quote53=copyJourney57(q);}
 }catch(e){console.error(e);}
}

tripDraft57=function(t,...rest){familyPrunePets270(t);return family270Base.tripDraft57(t,...rest);};

// ---------- 5. Дети младше 12 лет и поездки: одно правило ----------

function familyCareDeparture270(d){
 if(Number.isInteger(d?.departure86))return d.departure86;
 if(Number.isInteger(d?.departure))return d.departure;
 const t=d?.editTrip57&&travel52().trips.find(t=>t.id===d.editTrip57);
 if(Number.isInteger(t?.departure))return t.departure;
 return typeof departureMin86==='function'?departureMin86(d):s.clock.ticks+1;
}

function familyCampCovers270(id,tick){
 return family54().camps.some(c=>c.child===id&&c.kind!=='local'&&
  (['planned','documents'].includes(c.status)&&c.departure===tick||c.status==='away'&&c.ends>tick&&(c.departed??c.departure??tick)<=tick));
}

function familyCareKids270(d){
 if(!d||d.stayHome86||s.age<18)return [];
 const party=new Set(partyIds53(d));
 return ownChildren55().filter(p=>childLocal55(p)&&!party.has(p.id)&&(p.age<12||p.child55?.illness?.status==='active'));
}

function familyLocalAdult270(p,party){
 return !!(p&&p.alive&&p.age>=18&&p.country===s.country&&(!p.city18||p.city18===residenceCity())&&!party.has(p.id)&&
  !p.illness&&p.child55?.illness?.status!=='active');
}

function familyCoParent270(child,p){
 return !!(p&&([...(child.bio27?.parents||[]),...(child.birth49?.parents||[])].includes(p.id)||child.parentId===p.id));
}
function familyGrandparent270(child,p){
 if(!p)return false;
 if(parents17().some(q=>q.id===p.id))return true;
 return [...(child.bio27?.parents||[]),child.parentId].some(id=>id&&id!=='player'&&living(id)?.bio27?.parents?.includes(p.id));
}

function familyCareFor270(child,d){
 const party=new Set(partyIds53(d)),dep=familyCareDeparture270(d);
 if(familyCampCovers270(child.id,dep))return {kind:'camp',who:null,label:'Лагерь с проживанием'};
 const home=homeHelpers59(d).find(q=>q.id!==child.id);
 if(home)return {kind:'household',who:home,label:'Дома остаётся '+home.name};
 const ill=child.child55?.illness;
 if(ill?.caregiver&&!party.has(ill.caregiver)){const q=childCaregiver55(child).find(q=>q.id===ill.caregiver);if(q)return {kind:'illness',who:q,label:'Присмотр · '+q.name};}
 const a=d?.childcare86?.[child.id];
 if(a?.status==='accepted'){
  if(a.helper==='nanny270')return {kind:'sitter',who:null,label:'Няня на время поездки'};
  const q=living(a.helper);
  if(familyLocalAdult270(q,party))return {kind:'agreement',who:q,label:'Присмотр · '+q.name};
 }
 const rel=family54().helpers.find(x=>x.child===child.id&&helperAvailable54(x)&&!party.has(x.person)&&living(x.person));
 if(rel)return {kind:'relative',who:living(rel.person),label:'Помогает · '+living(rel.person).name};
 const nanny=family54().nannies.find(n=>n.child===child.id&&nannyAvailable54(n)&&!party.has(n.person));
 if(nanny&&living(nanny.person))return {kind:'nanny',who:living(nanny.person),label:'Няня · '+living(nanny.person).name};
 return null;
}

function familySitterKids270(d){
 return familyCareKids270(d).filter(p=>d?.childcare86?.[p.id]?.status==='accepted'&&d.childcare86[p.id].helper==='nanny270'&&
  !['camp','household'].includes(familyCareFor270(p,d)?.kind));
}
function familySitterFee270(d,count=null){
 const n=count??familySitterKids270(d).length;
 return n>0?Math.round(c().wage/250*.7*Math.max(1,d?.days||1)*(1+.4*(n-1))):0;
}

childrenCareWhy59=function(d){
 const kids=familyCareKids270(d).filter(p=>!familyCareFor270(p,d));
 return kids.length?[kids.map(p=>p.name).join(', ')+': нужен присмотр на время поездки']:[];
};
childGuardianHome59=function(p,d){
 const care=familyCareFor270(p,d);
 return care?care.who||{id:null,name:care.label}:null;
};
// Второе правило travel86 больше не нужно: всё решает childrenCareWhy59, а он откладывает поездку, а не отменяет её.
childcareWhy86=function(){return '';};
childrenHome86=function(d){return familyCareKids270(extraTravel86(d));};

function familyCareSummary270(d){
 const kids=familyCareKids270(d),open=kids.filter(p=>!familyCareFor270(p,d)),fee=familySitterFee270(d);
 if(open.length)return open.map(p=>p.name).join(', ')+': нужно договориться';
 return 'Все дети под присмотром'+(fee?' · няня '+money(fee):'');
}

travelOptions86=function(d,...rest){
 return family270Base.travelOptions86(d,...rest).map(o=>o?.label==='Присмотр за детьми'?{...o,hint:familyCareSummary270(extraTravel86(d))}:o);
};

function familyCareHelpers270(d,child){
 const party=new Set(partyIds53(d)),rank=p=>familyCoParent270(child,p)?0:familyGrandparent270(child,p)?1:2;
 return s.people.filter(p=>p.id!==child.id&&familyLocalAdult270(p,party)&&(p.inner?.trust??p.bond??0)>=40&&p.role!=='Няня')
  .sort((a,b)=>rank(a)-rank(b)||(b.inner?.trust??0)-(a.inner?.trust??0)).slice(0,8);
}

function familyAskCare270(d,childId,helperId){
 const child=living(childId),h=living(helperId);
 if(!child||!h)return childcareMenu86(d);
 s.careRequests86??={};
 const key=childId+':'+helperId,old=s.careRequests86[key];
 if(old?.status==='declined'&&old.tick+3>s.clock.ticks)return toast('После отказа нужно подождать три месяца.');
 const close=(familyCoParent270(child,h)||familyGrandparent270(child,h))&&(h.inner?.trust??0)>=50;
 const yes=close||(h.bond??0)>=60||Math.random()<.65;
 const a={helper:h.id,status:yes?'accepted':'declined',tick:s.clock.ticks,until:familyCareDeparture270(d)+1};
 s.careRequests86[key]=a;
 d={...d,childcare86:{...(d.childcare86||{}),[childId]:a}};
 log(yes?'Присмотр согласован':'Пока не получилось договориться','Присмотр · '+child.name+': '+h.name+(yes?' — договорились.':' в этот раз не может.'),'Семья');
 return returnTravel86(d);
}

function familySetSitter270(d,ids){
 const care={...(d.childcare86||{})};
 for(const id of ids)care[id]={helper:'nanny270',status:'accepted',tick:s.clock.ticks,until:familyCareDeparture270(d)+1};
 return returnTravel86({...d,childcare86:care});
}

function familyChildCareMenu270(d,id){
 d=extraTravel86(d);
 const p=living(id);
 if(!p)return childcareMenu86(d);
 const care=familyCareFor270(p,d),a=d.childcare86?.[id],helpers=familyCareHelpers270(d,p);
 const one=familySitterFee270(d,1);
 show('Присмотр · '+p.name,care?care.label+'.':'Пока никто не договорился присмотреть.',[
  ...helpers.map(h=>{const old=s.careRequests86?.[id+':'+h.id],wait=old?.status==='declined'&&old.tick+3>s.clock.ticks;
   return {label:h.name+' · '+h.role,hint:wait?'Недавно отказ · можно позже':a?.helper===h.id&&a.status==='accepted'?'Договорились':undefined,
    disabled:wait,fn:()=>familyAskCare270(d,id,h.id)};}),
  {label:'Няня на время поездки',hint:money(one)+' · оплата при отъезде',fn:()=>familySetSitter270(d,[id])},
  ...(p.age>=6?[{label:'Лагерь с проживанием',hint:'Если смена совпадёт с поездкой',fn:()=>campChildMenu54(id)}]:[]),
  ...(a?.status==='accepted'?[{label:'Отменить договорённость',fn:()=>{const next={...(d.childcare86||{})};delete next[id];returnTravel86({...d,childcare86:next});}}]:[]),
  {label:'Назад',fn:()=>childcareMenu86(d)}
 ]);
}

childcareMenu86=function(d){
 d=extraTravel86(d);
 const kids=familyCareKids270(d),open=kids.filter(p=>!familyCareFor270(p,d)),fee=familySitterFee270(d);
 show('С кем останутся дети',kids.length?'На время поездки рядом с детьми младше 12 лет должен быть взрослый.'+(fee?' Няня: '+money(fee)+' за поездку, оплата при отъезде.':''):'Присмотр не нужен: дети едут с вами или уже под присмотром.',[
  ...kids.map(p=>{const care=familyCareFor270(p,d);return {label:p.name,hint:care?care.label:'Нужно договориться',fn:()=>familyChildCareMenu270(d,p.id)};}),
  ...(open.length>1?[{label:'Няня для всех детей',hint:money(familySitterFee270(d,familySitterKids270(d).length+open.length)-fee)+' · оплата при отъезде',fn:()=>familySetSitter270(d,open.map(p=>p.id))}]:[]),
  {label:'Уход за детьми: няня, лагеря, помощь близких',fn:childcareMenu54},
  {label:'Вернуться к поездке',fn:()=>returnTravel86(d)}
 ]);
};

travelWhy52=function(d,...rest){
 const why=family270Base.travelWhy52(d,...rest);
 try{
  const draft=extraTravel86(d),fee=familySitterFee270(draft);
  if(fee&&expenseAvailable231()+1e-6<fee+travelQuote52(draft))why.push('Не хватает на няню на время поездки');
 }catch(e){console.error(e);}
 return [...new Set(why)];
};

travelDepartureWhy52=function(t,...rest){
 const why=family270Base.travelDepartureWhy52(t,...rest);
 if(why||!t)return why;
 const fee=t.sitterPaid270?0:familySitterFee270(tripDraft57(t));
 if(fee&&expenseAvailable231()+1e-6<fee+(t.business54||t.paid?0:(t.fee||0)))return 'Не хватает на няню на время поездки';
 return why;
};

// Отложенная поездка каждый месяц проверяется заново: если причины больше нет, она уезжает по плану.
function familyReviewHold270(){
 for(const t of travel52().trips)if(pendingJourney57(t))familyPrunePets270(t);
 const t=travelActive52();
 if(!t||!pendingJourney57(t)||!t.hold57||!t.journey57?.accepted)return;
 if(s.country!==t.home||residenceCity()!==t.homeCity)return;
 const hold=t.hold57;
 t.hold57=null;
 let why=['?'];
 try{why=journeyWhy57(tripDraft57(t));}catch(e){console.error(e);}
 if(why.length){t.hold57=hold;return;}
 t.departure=Math.min(t.departure??s.clock.ticks,s.clock.ticks);
 log('Поездка снова по плану',t.city+': причина задержки отпала, отъезд в этом месяце.','Отдых');
}

function familyPaySitters270(){
 for(const t of travel52().trips){
  if(t.status!=='away'||t.departed!==s.clock.ticks||t.sitterPaid270)continue;
  const fee=familySitterFee270(tripDraft57(t));
  if(!fee)continue;
  if(payExpense23(fee,'Няня на время поездки · '+t.city,'sitter270:'+t.id))t.sitterPaid270=fee;
 }
}

travelBeginMonth52=function(...args){
 try{familyReviewHold270();}catch(e){console.error(e);}
 const result=family270Base.travelBeginMonth52(...args);
 try{familyPaySitters270();}catch(e){console.error(e);}
 return result;
};
