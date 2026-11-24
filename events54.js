'use strict';
const eventsBase54={autonomousMonth,start,startTask05,finishTask,actionCatalog24,activitiesView,decisionRecord24,decisionActive24,decisionItems24,openDecision24,travelDepartureWhy52,travelPay53,travelPaymentText53,workFraction28,transport16};
function events54(){return s.events54??={last:-1,lastOffer:-100,hosts:{},invitations:[],business:[],lastBusiness:-100,known:Object.fromEntries(s.people.map(p=>[p.id,!!p.alive])),deaths:[]};}
const occasionNames54={wedding:'Свадьба',birthday:'День рождения',housewarming:'Новоселье',funeral:'Прощание',premiere:'Премьера'};
function occasionHosts54(){return s.people.filter(p=>p.alive&&p.age>=18&&p.id!==currentPartner()?.id&&['Друг','Мать','Отец','Брат','Сестра','Ребенок','Сын','Дочь','Родственник'].includes(p.role)&&p.bond>=40);}
function weddingEligible132(host){
 if(host.npcMarried54||host.age<20)return false;
 if(!['Мать','Отец'].includes(host.role))return true;
 if(typeof npcPartner55!=='function')return false;
 const partner=npcPartner55(host);
 return !!partner&&!partner.npcMarried54&&s.clock.ticks-(adultState55(host).pairedAt??s.clock.ticks)>=12
  &&!s.family27?.unions.some(u=>u.status==='together'&&[u.a,u.b].some(id=>id===host.id||id===partner.id));
}
function offerOccasion54(host=null,kind=null,paid=null,deceased=null){const z=events54();if(s.dead||s.age<15||kind!=='funeral'&&(s.clock.ticks-z.lastOffer<4||z.invitations.some(q=>q.status==='offered')))return null;const pool=occasionHosts54();host??=pool.find(p=>s.clock.ticks-(z.hosts[p.id]??-100)>=12);if(!host||!pool.includes(host))return null;const premier=['arts','media'].includes(profession16(host.bio27?.job?.profession)?.field)||/актёр|актер|режисс|театр|музык|писател|худож/i.test(host.occupation||'');kind??=pick(['birthday','housewarming',...(weddingEligible132(host)?['wedding']:[]),...(premier?['premiere']:[])]);if(!occasionNames54[kind]||kind==='wedding'&&!weddingEligible132(host)||kind==='premiere'&&!premier||kind==='birthday'&&s.clock.ticks-(host.lifeEvents54?.birthday??-100)<12||kind==='housewarming'&&s.clock.ticks-(host.lifeEvents54?.housewarming??-100)<36)return null;const country=deceased?.country||host.country,city=deceased?.city18||host.city18||cities[country][0],local=country===s.country&&city===residenceCity();if(s.age<18&&!local)return null;paid??=Math.random()<.3;const q={id:id16('occasion'),host:host.id,kind,partner132:kind==='wedding'&&typeof npcPartner55==='function'?npcPartner55(host)?.id:null,deceased:deceased?.id||null,country,city,local,paid,status:'offered',created:s.clock.ticks,expires:s.clock.ticks+(kind==='funeral'?1:3),fee:local?Math.round(c().cost*.0005):0,title:occasionNames54[kind]+' · '+(deceased?.name||host.name)};
 if(!local){const draft={country,city,days:travelDays52(country).includes(3)?3:7,comfort:'standard',party53:[host.id],pay53:paid?'gift':'split',host53:host.id},quote=groupQuote53(draft);if(groupFundsWhy53(quote).some(w=>!w.startsWith('Не хватает средств на вашу часть')))return null;const invite={id:id16('occasion-trip'),host:host.id,pay:paid?'gift':'split',home:s.country,homeCity:residenceCity(),draft,quote,signature:groupSignature53(draft),status:'offered',created:s.clock.ticks,expires:q.expires,title:q.title,occasion54:q.id};familyTravel53().invitations.push(invite);q.travelInvite=invite.id;q.fee=quote.player;}
 z.invitations.push(q);z.invitations=z.invitations.slice(-100);z.hosts[host.id]=s.clock.ticks;if(kind!=='funeral')z.lastOffer=s.clock.ticks;log(q.title,host.name+' приглашает '+city+' · '+countries[country].name+'. '+(paid?'Приглашающий оплачивает вашу часть.':'Ваша часть: '+money(q.fee)+'.'),'Приглашение',false,local?{kind:'occasion54',id:q.id}:{kind:'tripInvite53',id:q.travelInvite});save();return q;}
function occasionAvailable54(q){return !!(q?.status==='offered'&&q.expires>s.clock.ticks&&living(q.host)&&!s.dead);}
function respondOccasion54(id,accept){const q=events54().invitations.find(q=>q.id===id);if(!occasionAvailable54(q))return false;if(!q.local){const ok=respondTravel53(q.travelInvite,accept);if(ok)q.status=accept?'accepted':'declined';save();return ok;}if(!accept){q.status='declined';save();return true;}if(q.country!==s.country||q.city!==residenceCity()||(q.paid?parentAvailable17(living(q.host)):expenseAvailable231())<q.fee)return false;q.status='active';task16('occasion54',q.title,1,{occasion54:q.id},2);save();return true;}
function occasionMenu54(id){const q=events54().invitations.find(q=>q.id===id);if(!q)return;if(q.travelInvite)return travelInviteMenu53(q.travelInvite);show(q.title,q.city+' · '+countries[q.country].name+'. '+(q.paid?'Приглашающий угощает.':'Ваша часть '+money(q.fee)+'.')+' Отказ не портит отношения.',[{label:'Пойти',disabled:!occasionAvailable54(q)||q.city!==residenceCity()||q.country!==s.country,fn:()=>respondOccasion54(id,true)},{label:'Отказаться',disabled:!occasionAvailable54(q),fn:()=>respondOccasion54(id,false)}]);}
function occasionsMenu54(){show('События близких','Локальные встречи или отдельная поездка с закреплёнными условиями оплаты.',events54().invitations.slice(-25).reverse().map(q=>({label:q.title,hint:q.city+' · '+(q.paid?'Приглашающий угощает':'Своя часть')+' · '+({offered:'Ждёт ответа',active:'В расписании',accepted:'Поездка запланирована',completed:'Состоялось',declined:'Отклонено',expired:'Срок истёк',cancelled:'Отменено'})[q.status],fn:()=>occasionMenu54(q.id)})));}
function businessEligible54(){const p=profession16(s.job?.professionId);return !!(s.age>=18&&!s.dead&&p&&['computing','business','engineering','science','arts','media','law','medicine','education'].includes(p.field)&&permission16(s.country,'work')&&!parentalLeave54('player'));}
function offerBusiness54(){const z=events54(),co=company18();if(!businessEligible54()||!co||co.months<3||s.clock.ticks-z.lastBusiness<12||z.business.some(q=>['offered','accepted'].includes(q.status))||travelActive52()||languageStayActive53())return null;const country=Math.random()<.3?pick(Object.keys(countries).filter(c=>c!==s.country)):s.country,city=pick(cities[country].filter(c=>country!==s.country||c!==residenceCity())),days=travelDays52(country).includes(3)?3:7,draft={country,city,days,comfort:'standard',companion:null},fee=groupBase53.travelQuote52(draft);if(!city||co.budget<fee)return null;const purpose=({computing:'Профильная конференция и встречи с командой',business:'Встреча с клиентами',engineering:'Выезд на объект',science:'Научная конференция',arts:'Работа над проектом и показ',media:'Фестиваль или редакционная поездка',law:'Встреча с клиентом',medicine:'Профессиональная конференция',education:'Семинар и обмен опытом'})[profession16(s.job.professionId).field];const q={id:id16('business-trip'),employer:co.id,home:s.country,homeCity:residenceCity(),...draft,fee,purpose,status:'offered',created:s.clock.ticks,expires:s.clock.ticks+3,visaRoll:Math.random()};z.business.push(q);z.lastBusiness=s.clock.ticks;log('Предложена командировка',purpose+' · '+city+'. Дорогу и проживание оплачивает компания; зарплата сохраняется.','Работа',false,{kind:'business54',id:q.id});save();return q;}
function businessAvailable54(q){return !!(q?.status==='offered'&&q.expires>s.clock.ticks&&businessEligible54()&&company18()?.id===q.employer&&q.home===s.country&&q.homeCity===residenceCity());}
function respondBusiness54(id,accept){const q=events54().business.find(q=>q.id===id);if(!businessAvailable54(q))return false;if(!accept){q.status='declined';save();return true;}const co=company18();if(travelActive52()||languageStayActive53()||co.budget<q.fee)return false;const t={id:id16('business-travel'),country:q.country,city:q.city,days:q.days,comfort:q.comfort,companion:null,home:s.country,homeCity:residenceCity(),fee:0,total53:q.fee,created:s.clock.ticks,departure:s.clock.ticks+(q.country===s.country?1:2),review:s.clock.ticks+1,status:'planned',employer:co.id,hours:s.workHours??40,leaveNeed:0,business54:q.id,documents54:q.country===s.country?'ready':'pending'};travel52().trips.push(t);q.trip=t.id;q.status='accepted';save();return true;}
function businessReview54(){for(const q of events54().business){if(q.status==='offered'&&!businessAvailable54(q)){q.status=q.expires<=s.clock.ticks?'expired':'cancelled';continue;}if(q.status!=='accepted')continue;const t=travel52().trips.find(t=>t.id===q.trip);if(!t){q.status='cancelled';continue;}if(t.status==='completed'){q.status='completed';continue;}if(['cancelled','interrupted','declined'].includes(t.status)){q.status='cancelled';continue;}if(t.documents54==='pending'&&s.clock.ticks>=t.review){t.documents54=q.visaRoll<.9?'ready':'refused';if(t.documents54==='refused'){cancelTravel52(t.id,'Документы для краткой рабочей поездки не согласованы');q.status='cancelled';}}}}
travelDepartureWhy52=function(t){if(!t.business54)return eventsBase54.travelDepartureWhy52(t);if(!businessEligible54()||s.country!==t.home||residenceCity()!==t.homeCity||company18()?.id!==t.employer||(s.workHours??40)!==t.hours)return 'Работа, адрес или условия командировки изменились';if(t.documents54!=='ready')return 'Нет согласованных рабочих документов';if(languageStayActive53())return 'Языковая программа уже запланирована';return '';};
travelPay53=function(t){if(!t.business54)return eventsBase54.travelPay53(t);if(t.companyPaid54)return true;const co=company18();if(!co||co.id!==t.employer||co.budget<t.total53)return false;co.budget-=t.total53;co.history.push({tick:s.clock.ticks,type:'business-trip54',trip:t.id,cost:t.total53});t.companyPaid54=true;return true;};
travelPaymentText53=function(t){return t.business54?'Компания оплатила '+money(t.total53)+', ваша часть 0':eventsBase54.travelPaymentText53(t);};
workFraction28=function(){const t=travelActive52();return t?.business54&&t.status==='away'&&t.departed===s.clock.ticks?travelBase52.workFraction28():eventsBase54.workFraction28();};
transport16=function(...args){const t=travelActive52();return t?.business54&&t.status==='away'&&t.departed===s.clock.ticks?0:eventsBase54.transport16(...args);};
function businessOfferMenu54(id){const q=events54().business.find(q=>q.id===id);if(!q)return;show('Командировка · '+q.city,q.purpose+'. '+q.days+' дней, '+countries[q.country].name+'. Компания оплачивает '+money(q.fee)+' из своего бюджета. Ваша часть 0, зарплата и опыт сохраняются, отпускные дни не расходуются. Для зарубежной поездки компания проверяет временные документы.',[{label:'Согласиться',disabled:!businessAvailable54(q)||!!travelActive52()||!!languageStayActive53(),fn:()=>respondBusiness54(id,true)},{label:'Отказаться без штрафа',disabled:!businessAvailable54(q),fn:()=>respondBusiness54(id,false)},...(q.trip?[{label:'Открыть поездку',fn:()=>travelTripMenu52(q.trip)}]:[])]);}
function businessMenu54(){show('Рабочие командировки','Предложения для профессий с выездами. Расходы ограничены конечным бюджетом компании.',events54().business.slice(-15).reverse().map(q=>({label:q.city+' · '+q.purpose,hint:money(q.fee)+' оплачивает компания',fn:()=>businessOfferMenu54(q.id)})));}
function mortalityAnnual54(p){const age=p.age;let rate=age<15?.00015:age<40?.0005:age<60?.0015:age<70?.008:Math.min(.65,.02*Math.pow(1.1,age-70));if(p.bio27?.health<35)rate*=1.4;return Math.min(.8,rate);}
// Gameplay weights. Fatal outcomes share the existing annual mortality roll.
const parentAccidents143=[
 ['ДТП',40,.05],['Серьёзное падение',30,.02],
 ['Травма на работе',15,.03,p=>!!p.bio27?.job&&/инженер|строител|водител|механик/i.test(p.occupation||p.bio27.job.title||'')],
 ['Бытовой пожар',10,.08],['Происшествие на воде',5,.15,p=>p.agency55?.interests?.includes('sport')&&cities[p.country]?.some(city=>city===p.city18&&/Амстердам|Роттердам|Осло|Сидней|Ванкувер|Барселона|Марсель/.test(city))]
];
const parentDiagnoses143=[
 ['Онкологическое заболевание',30,6,18,.55,'remission'],
 ['Тяжёлая пневмония',25,1,3,.85,'recovery'],
 ['Сердечная недостаточность',20,3,9,.55,'stability',40],
 ['Инсульт',15,3,12,.60,'recovery',40],
 ['Деменция',10,6,12,0,'stability',65]
];
function parentHealthNews143(p,title,text){
 if(typeof notice61==='function')notice61('parentCare136',title,p.name+' · '+text,{personId:p.id});
 else log(title,p.name+' · '+text,'Семья',true);
}
function weightedParentEvent143(rows){
 let roll=Math.random()*rows.reduce((sum,row)=>sum+row[1],0);
 return rows.find(row=>(roll-=row[1])<0)||rows.at(-1);
}
function parentAnnualOutcome143(p){
 const risk=mortalityAnnual54(p);
 if(!['Мать','Отец','Приёмный опекун'].includes(p.role)&&p.id!==s.family17?.care136?.caregiverId)
  return chance(risk)?'':null;
 const state=p.parentHealth143;
 const accidentRate=p.age>=65?.002:.001;
 const cardiacRate=p.age<40?.0002:p.age<60?.001:.0045;
 const illnessRate=p.age<40?.0015:p.age<60?.004:.009;
 const accidents=parentAccidents143.filter(row=>!row[3]||row[3](p));
 if(chance(risk)){
  const total=accidents.reduce((sum,row)=>sum+row[1],0);
  const causes=accidents.map(([name,weight,fatality])=>[name,accidentRate*weight/total*fatality]);
  causes.push(['Инфаркт',cardiacRate*.1]);
  if(state?.status==='active'&&state.kind==='illness')causes.push([state.name,risk*.45]);
  const remaining=risk-causes.reduce((sum,row)=>sum+row[1],0);
  causes.push(['Естественные причины',Math.max(0,remaining)]);
  return weightedParentEvent143(causes)[0];
 }
 if(state?.status==='active')return null;
 if(state?.status==='remission'&&s.clock.ticks-state.since<=36&&chance(.05)){
  state.status='active';state.due=s.clock.ticks+9;
  parentHealthNews143(p,'Болезнь вернулась',state.name+'. Возобновилось лечение.');
  return null;
 }
 const roll=Math.random();
 if(roll<accidentRate){
  const [name]=weightedParentEvent143(accidents);
  p.parentHealth143={kind:'injury',name,status:'active',due:s.clock.ticks+(chance(.16)?rnd(4,9):rnd(1,3))};
  if(chance(.3))p.parentHealth143.careUnavailableUntil=Math.min(p.parentHealth143.due,s.clock.ticks+2);
  parentHealthNews143(p,name,'Началось восстановление.');
 }else if(roll<accidentRate+cardiacRate*.9){
  p.parentHealth143={kind:'injury',name:'Инфаркт',status:'active',due:s.clock.ticks+(chance(1/6)?rnd(4,9):rnd(1,3))};
  if(chance(.55))p.parentHealth143.careUnavailableUntil=Math.min(p.parentHealth143.due,s.clock.ticks+2);
  parentHealthNews143(p,'Инфаркт','Острое состояние удалось пережить. Началось восстановление.');
 }else if(roll<accidentRate+cardiacRate*.9+illnessRate&&!state?.kind){
  const diagnosis=weightedParentEvent143(parentDiagnoses143.filter(row=>p.age>=(row[6]??0)));
  const [name,,min,max]=diagnosis;
  p.parentHealth143={kind:'illness',name,status:'active',due:s.clock.ticks+rnd(min,max)};
  if(chance(name==='Инсульт'||name==='Тяжёлая пневмония'?.5:.15))p.parentHealth143.careUnavailableUntil=Math.min(p.parentHealth143.due,s.clock.ticks+2);
  parentHealthNews143(p,'Поставили диагноз',name+'.');
 }
 return null;
}
function parentHealthMonth143(){
 for(const p of s.people){
  const state=p.parentHealth143;
  if(!p.alive||state?.status!=='active'||state.due>s.clock.ticks)continue;
  if(state.kind==='injury'){
   delete p.parentHealth143;
   parentHealthNews143(p,'Восстановление завершилось',state.name+'.');
   continue;
  }
  const [,,min,max,probability,outcome]=parentDiagnoses143.find(row=>row[0]===state.name);
  if(!chance(probability)){state.due=s.clock.ticks+rnd(min,max);continue;}
  state.status=outcome;state.since=s.clock.ticks;
  if(outcome==='recovery')delete p.parentHealth143;
  parentHealthNews143(p,outcome==='remission'?'Наступила ремиссия':outcome==='stability'?'Состояние стабилизировалось':'Восстановление завершилось',state.name+'.');
 }
}
// Weights apply after searching for a suitable parent or relative.
const childPlacement143={"nl":[44,10],"rs":[44,8],"ru":[28,26],"us":[55,10],"br":[30,15],"jp":[20,55],"fr":[50,15],"es":[42,13],"de":[47,10],"uk":[49,13],"ca":[47,10],"kr":[26,35],"cn":[20,22],"mx":[25,15],"it":[44,14],"au":[48,12],"tr":[23,15],"za":[42,13],"th":[20,20],"no":[49,8],"in":[12,23],"id":[12,22],"eg":[10,22],"ma":[12,23],"pl":[38,14]};
function residentialPlacement143(country){
 const [family,residential]=childPlacement143[country]||[1,0];
 return chance(residential/(family+residential));
}
function custodyActive145(p){
 const term=p.custody145;
 return term?.status==='serving'&&(term.life||term.ends>s.clock.ticks);
}
function careInterruption145(p){
 if(!p)return null;
 if(custodyActive145(p))return 'custody';
 if(p.parentHealth143?.careUnavailableUntil>s.clock.ticks)return 'illness';
 return null;
}
// Each finite band is uniform in months, with decreasing weight per month.
function npcCustodyMonths146(serious){
 const roll=Math.random();
 if(!serious)return roll<.90?rnd(2,6):rnd(7,12);
 if(roll<.65)return rnd(2,6);
 if(roll<.90)return rnd(7,24);
 if(roll<.98)return rnd(25,120);
 return rnd(121,240);
}
function parentCourtMonth145(){
 if(s.dead)return;
 for(const p of s.people.filter(p=>p.alive&&['Мать','Отец','Бабушка','Дедушка','Приёмный опекун'].includes(p.role))){
  const term=p.custody145;
  if(term?.status==='serving'){
   if(custodyActive145(p))continue;
   term.status='released';
   parentHealthNews143(p,'Освобождение близкого','Срок заключения завершился.');
   continue;
  }
  if(term?.status==='pending'){
   if(term.hearing>s.clock.ticks)continue;
   if(!chance(.5)){term.status='closed';continue;}
   term.status='serving';
   term.life=term.serious&&chance(.01);
   term.ends=term.life?null:s.clock.ticks+npcCustodyMonths146(term.serious);
   parentHealthNews143(p,'Заключение близкого',term.life?'Суд назначил пожизненное заключение.':'Срок по решению суда — '+(term.ends-s.clock.ticks)+' мес.');
   continue;
  }
  if(s.clock.ticks%12===0&&p.age>=18&&chance(.0015)){
   p.custody145={status:'pending',hearing:s.clock.ticks+2,serious:chance(.02)};
  }
 }
}
function availableCareAdult144(p){
 return p?.alive&&p.age>=18&&p.country===s.country&&!p.npcMove&&
  !careInterruption145(p);
}
function reviewHealthCare144(){
 if(s.dead||s.age>=18)return;
 const f=ensureFamily17(),temporary=f.temporaryCare144;
 if(temporary){
  const original=living(temporary.parentId);
  if(!original){delete f.temporaryCare144;return;}
  const current=f.care136;
  if(!availableCareAdult144(original)){
   const caregiver=living(current?.caregiverId);
   const reason=careInterruption145(caregiver);
   if(reason){transferCare137(caregiver,reason);return;}
   if(temporary.reason==='custody'&&['foster','residential'].includes(current?.kind)){
    const parent=parents17().find(availableCareAdult144);
    if(parent){
     placeChild140(parent,current.caregiverId,'parent','custodyReturn');
     parentHealthNews143(parent,'Возвращение домой после заключения','Теперь снова может заботиться о вас.');
    }
   }
   return;
  }
  if(!current){delete f.temporaryCare144;return;}
  placeChild140(original,current.caregiverId,temporary.kind,temporary.reason==='custody'?'custodyReturn':'healthReturn');
  if(temporary.longTerm149)f.care136.longTerm149=true;
  delete f.temporaryCare144;
  parentHealthNews143(original,temporary.reason==='custody'?'Возвращение домой после заключения':'Возвращение домой после лечения','Снова может заботиться о вас.');
  return;
 }
 const care=f.care136||f.separation132||f.childhood131;
 const current=living(care?.caregiverId||s.housing.occupant)||
  (!care&&s.housing.mode==='parents'?parents17().find(p=>p.country===s.country):null);
 const reason=careInterruption145(current);
 if(!reason)return;
 if(!care?.caregiverId&&!s.housing.occupant)s.housing.occupant=current.id;
 transferCare137(current,reason);
}
function transferCare137(deceased,reason='loss'){
 if(s.dead||s.age>=18)return;
 const family=ensureFamily17();
 const prior=family.care136||family.separation132||family.childhood131;
 const caregiverId=prior?.caregiverId||s.housing.occupant;
 if(caregiverId?caregiverId!==deceased.id:
  s.housing.mode!=='parents'||!['Мать','Отец'].includes(deceased.role))return;
 const parent=parents17().find(p=>p!==deceased&&availableCareAdult144(p));
 const relative=parent?null:s.people.filter(p=>p!==deceased&&availableCareAdult144(p)&&p.bond>=40&&
  ['Бабушка','Дедушка','Брат','Сестра'].includes(p.role)).sort((a,b)=>b.bond-a.bond)[0];
 const from=residenceCity();
 const foster=!parent&&!relative;
 const residential=foster&&residentialPlacement143(s.country);
 const caregiver=parent||relative||person(residential?'Воспитатель детского дома':'Приёмный опекун',rnd(30,60),undefined,s.country);
 if(foster){
  caregiver.city18=from;
  s.people.push(caregiver);
  enrichPerson(caregiver);
  events54().known[caregiver.id]=true;
 }
 if(reason!=='loss'&&!deceased.custody145?.life)family.temporaryCare144??={parentId:deceased.id,reason,longTerm149:!!prior?.longTerm149,kind:prior?.kind||
  (['Мать','Отец'].includes(deceased.role)?'parent':'relative')};
 placeChild140(caregiver,deceased.id,residential?'residential':foster?'foster':parent?'parent':'relative',reason);
 if(reason!=='loss'){
  parentHealthNews143(caregiver,reason==='custody'?'Временный уход на время заключения':'Временный уход на время лечения','Вы временно живёте здесь. Город — '+residenceCity()+'.');
  return;
 }
 const city=residenceCity();
 const note='После смерти '+deceased.name+(residential?' вас устроили в детский дом. Ваш воспитатель — '+caregiver.name+'.':foster?' вас приняли в приёмную семью. Ваш опекун — '+caregiver.name+'.':' за вами теперь ухаживает '+caregiver.name+'.')+
  (from!==city?' Новый город проживания — '+city+'.':'');
 if(typeof notice61==='function')notice61('parentCare136','Смена опекуна',note,{personId:caregiver.id});
 else log('Смена опекуна',note,'Семья',true);
}
function placeChild140(caregiver,previousId,kind,reason='loss'){
 const family=ensureFamily17(),home=s.housing;
 const city=caregiver.city18||residenceCity();
 if(home.city!==city||home.occupant!==caregiver.id){
  delete home.listing41;
  delete home.display59;
 }
 Object.assign(home,{city,mode:kind==='parent'||kind==='adopted'?'parents':'host',
  occupant:caregiver.id,active:true,propertyId:null});
 family.household=null;
 const history=family.careHistory139??=(family.care136?[family.care136]:[]);
 family.care136={caregiverId:caregiver.id,previousId,tick:s.clock.ticks,
  year:s.year,month:s.clock.month,city,kind,reason};
 history.push(family.care136);
}
function reviewFosterCare140(){
 const care=s.family17?.care136;
 if(s.dead||s.age>=18||s.family17?.temporaryCare144||!['foster','residential'].includes(care?.kind)||!living(care.caregiverId)||
  s.clock.ticks-(care.reviewed140??care.tick)<6)return false;
 care.reviewed140=s.clock.ticks;
 const eligible=p=>availableCareAdult144(p)&&p.bond>=55;
 const parent=parents17().find(eligible);
 const relative=parent?null:s.people.filter(p=>eligible(p)&&
  ['Бабушка','Дедушка','Брат','Сестра'].includes(p.role)).sort((a,b)=>b.bond-a.bond)[0];
 const caregiver=parent||relative;
 if(!caregiver)return false;
 placeChild140(caregiver,care.caregiverId,parent?'parent':'relative','reunion');
 const title=care.kind==='residential'?'Возвращение из детского дома':'Возвращение из приёмной семьи';
 const note=caregiver.name+' теперь может взять вас к себе. Город проживания — '+residenceCity()+'.';
 if(typeof notice61==='function')notice61('parentCare136',title,note,{personId:caregiver.id});
 else log(title,note,'Семья',true);
 return true;
}
// Initial game scenario for domestic adoption by an existing foster caregiver.
function reviewFosterAdoption141(){
 const care=s.family17?.care136;
 if(s.dead||s.family17?.temporaryCare144||s.country!=='nl'||s.age>=10||care?.kind!=='foster'||
  s.family17.adoption141||s.clock.ticks-care.tick<24||
  s.clock.ticks-(care.adoptionReview141??care.tick)<6)return false;
 care.adoptionReview141=s.clock.ticks;
 const guardian=living(care.caregiverId);
 if(!guardian||guardian.country!==s.country||guardian.age-s.age<18||
  guardian.bond<65||guardian.npcMove||s.housing.occupant!==guardian.id||
  parents17().length||guardian.childrenWish==='no'||!chance(.25))return false;
 s.family17.adoption141={parentId:guardian.id,tick:s.clock.ticks,year:s.year,month:s.clock.month};
 placeChild140(guardian,guardian.id,'adopted','adoption');
 const title=s.gender==='f'?'Удочерение после приёмной опеки':'Усыновление после приёмной опеки';
 const note=guardian.name+' теперь ваш юридический родитель. Вы продолжаете жить вместе.';
 if(typeof notice61==='function')notice61('parentCare136',title,note,{personId:guardian.id});
 else log(title,note,'Семья',true);
 return true;
}
function reviewLongTermCare149(){
 const family=s.family17,care=family?.care136;
 if(s.dead||s.age>=18||s.country==='nl'||family?.temporaryCare144||
  !['relative','foster'].includes(care?.kind)||care.longTerm149||
  s.clock.ticks-care.tick<12||parents17().some(p=>!p.custody145?.life||!custodyActive145(p)))return false;
 const guardian=living(care.caregiverId);
 if(!availableCareAdult144(guardian)||guardian.bond<55||s.housing.occupant!==guardian.id)return false;
 placeChild140(guardian,guardian.id,care.kind,'longTerm');
 family.care136.longTerm149=true;
 parentHealthNews143(guardian,'Долгосрочная опека','Вы остаётесь жить здесь. Договорённость действует до совершеннолетия или пересмотра опеки.');
 return true;
}
function mortalityMonth54(){const z=events54();for(const p of s.people){if(z.known[p.id]===true&&!p.alive&&!z.deaths.includes(p.id)){z.deaths.push(p.id);p.died54??={tick:s.clock.ticks,year:s.year,age:p.age};p.cohabit=false;transferCare137(p);const host=occasionHosts54().sort((a,b)=>Number(kin27(b))-Number(kin27(a))||b.bond-a.bond)[0];if(host)offerOccasion54(host,'funeral',false,p);for(const a of family54().helpers)if(a.person===p.id)a.status='ended';for(const n of family54().nannies)if(n.person===p.id)n.status='ended';}z.known[p.id]=!!p.alive;}}
function familyBeginMonth54(){familyMonth54();campBegin54();businessReview54();mortalityMonth54();parentHealthMonth143();parentCourtMonth145();reviewHealthCare144();reviewFosterCare140();reviewFosterAdoption141();reviewLongTermCare149();}
if(!profession16('nanny54'))professions16.push({id:'nanny54',title:'Няня в семье',field:'care',required:null,salary:.85,competition:.25,remote:false,license:false,minSkill:20,language:3,growth:1.3,experience45:0});
function nannyFamilies54(){return s.job?.professionId==='nanny54'?(company18().families54??=[]):[];}
function nannyFamilyMonth54(){if(s.job?.professionId!=='nanny54'||!permission16(s.country,'work')||parentalLeave54('player'))return;const co=company18();if(co.lastNanny54===s.clock.ticks)return;co.lastNanny54=s.clock.ticks;const families=nannyFamilies54();if(!families.length){const parent=person('Родитель воспитанника',rnd(28,45),undefined,s.country),child=person('Подопечный',rnd(2,10),undefined,s.country);parent.city18=child.city18=residenceCity();child.parentId=parent.id;s.people.push(parent,child);enrichPerson(parent);enrichPerson(child);families.push({parent:parent.id,child:child.id,employer:co.id,meetings:0});log('Первое знакомство с рабочей семьёй',parent.name+' и '+child.name+': обсуждаете режим и границы. Люди сохраняются в контактах.','Работа');}for(const f of families){const parent=living(f.parent),child=living(f.child);if(!parent||!child||child.age>=18||parent.country!==s.country||child.country!==s.country)continue;f.meetings++;if(f.meetings%3===0){rel(parent,{trust:1});rel(child,{trust:1,affection:2});}if(f.meetings%6===0){remember(parent,'полгода совместной работы по уходу за ребёнком');remember(child,'няня '+s.name+' помогала с распорядком');}}}
function nannyWorkMenu54(){show('Работа няней','Сохраняются ребёнок и родители. Можно обсудить режим или выбрать занятие с ребёнком.',nannyFamilies54().flatMap(f=>[f.parent,f.child].map(living).filter(Boolean).map(p=>({label:p.name+' · '+p.role,fn:()=>show(p.name,'Рабочее взаимодействие входит в рабочие часы.',[{label:p.id===f.parent?'Обсудить режим и границы':'Почитать или поиграть вместе',disabled:s.clock.tasks.some(t=>t.kind==='nannyInteraction54'&&t.person54===p.id),fn:()=>{task16('nannyInteraction54','Рабочее общение · '+p.name,1,{person54:p.id,employer54:f.employer},0);save();}},{label:'Карточка человека',fn:()=>personDetail(p.id)}])}))));}
startTask05=function(t){if(t.kind==='nannyInteraction54'){if(parentalLeave54('player'))return false;if(!living(t.person54)||s.job?.professionId!=='nanny54'||company18()?.id!==t.employer54){archiveTask05(t,'cancelled');return false;}}if(t.kind==='occasion54'){const q=events54().invitations.find(q=>q.id===t.occasion54);if(q?.status!=='active'||!living(q.host)||q.country!==s.country||q.city!==residenceCity()||s.dead){archiveTask05(t,'cancelled');return false;}if(!q.paid54){if(!transaction17({key:'occasion54:'+q.id,purpose:q.title,initiator:q.host,participants:['player',q.host],parts:[{payer:q.paid?q.host:'player',amount:q.fee}]})){q.status='cancelled';archiveTask05(t,'cancelled');return false;}q.paid54=true;}}return eventsBase54.startTask05(t);};
finishTask=function(t){if(!['occasion54','nannyInteraction54'].includes(t.kind))return eventsBase54.finishTask(t);if(['completed','cancelled','paused'].includes(t.state)||t.progress<t.duration||!startTask05(t))return;if(t.kind==='nannyInteraction54'){const p=living(t.person54);rel(p,{trust:2,affection:1});remember(p,'нашли подход к привычному распорядку');}else{const q=events54().invitations.find(q=>q.id===t.occasion54),p=living(q.host);q.status='completed';q.completed=s.clock.ticks;rel(p,{trust:2,affection:3});remember(p,'побывали вместе: '+q.title);s.mood=clamp(s.mood+(q.kind==='funeral'?-1:3));log(q.title,q.kind==='funeral'?'Удалось побыть с близкими и проститься.':'Провели время вместе.','Общение');}archiveTask05(t,'completed');save();};
autonomousMonth=function(){events54();eventsBase54.autonomousMonth();const z=events54();if(z.last>=s.clock.ticks)return;z.last=s.clock.ticks;mortalityMonth54();businessReview54();nannyFamilyMonth54();for(const q of z.invitations){if(q.travelInvite)q.status=invite53(q.travelInvite)?.status||'cancelled';if(q.status==='offered'&&q.expires<=s.clock.ticks)q.status='expired';if(!q.happened&&s.clock.ticks>q.created){q.happened=true;const p=living(q.host);if(p&&q.kind!=='funeral'){p.lifeEvents54??={};p.lifeEvents54[q.kind]=s.clock.ticks;if(q.kind==='wedding'&&weddingEligible132(p)&&(!q.partner132||npcPartner55(p)?.id===q.partner132)){
 p.npcMarried54=true;p.unavailable18=true;
 const partner=living(q.partner132)||(typeof npcPartner55==='function'?npcPartner55(p):null);
 if(partner){partner.npcMarried54=true;partner.unavailable18=true;}
 if(partner&&['Мать','Отец'].includes(p.role))notice61('parentWedding132','Новый брак родителя',p.name+' и '+partner.name+' вступили в брак.');
}}}}if(s.clock.ticks%4===0)offerOccasion54();if(s.clock.ticks%6===0)offerBusiness54();};
start=function(){eventsBase54.start();events54();save();};
decisionRecord24=function(ref){return ref?.kind==='occasion54'?events54().invitations.find(q=>q.id===ref.id):ref?.kind==='business54'?events54().business.find(q=>q.id===ref.id):eventsBase54.decisionRecord24(ref);};
decisionActive24=function(ref){return ref?.kind==='occasion54'?occasionAvailable54(decisionRecord24(ref)):ref?.kind==='business54'?businessAvailable54(decisionRecord24(ref)):eventsBase54.decisionActive24(ref);};
decisionItems24=function(){return [...eventsBase54.decisionItems24(),...events54().invitations.filter(q=>q.local&&occasionAvailable54(q)).map(q=>({ref:{kind:'occasion54',id:q.id},q,title:q.title,note:q.paid?'Приглашающий угощает':'Своя часть',expires:q.expires})),...events54().business.filter(businessAvailable54).map(q=>({ref:{kind:'business54',id:q.id},q,title:'Командировка · '+q.city,note:q.purpose,expires:q.expires}))];};
openDecision24=function(kind,id){return kind==='occasion54'?occasionMenu54(id):kind==='business54'?businessOfferMenu54(id):eventsBase54.openDecision24(kind,id);};
actionCatalog24=function(){return [...eventsBase54.actionCatalog24(),{id:'occasions54',group:'Люди',label:'События близких',keywords:'свадьба день рождения новоселье похороны премьера',reason:'',fn:occasionsMenu54},{id:'business54',group:'Работа',label:'Рабочие командировки',keywords:'конференция поездка',reason:s.job?'':'Нужна работа',fn:businessMenu54},{id:'nanny-work54',group:'Работа',label:'Семьи и дети: работа няней',keywords:'няня подопечный',reason:s.job?.professionId==='nanny54'?'':'Нужна работа няней',fn:nannyWorkMenu54}];};
activitiesView=function(){return eventsBase54.activitiesView()+(s.job?.professionId==='nanny54'?'<section class="activity-box"><h3>Рабочая семья</h3><button onclick="nannyWorkMenu54()">Ребёнок и родители</button></section>':'');};
