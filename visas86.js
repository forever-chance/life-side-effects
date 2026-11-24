'use strict';
const schengen86=['nl','fr','es','de','it','pl','no','gr','pt','be','hr','at','dk'];
function visaState86(){return s.visas86??={documents:[]};}
function passports86(p){return [...new Set((Array.isArray(p.citizenships)?p.citizenships:[p.citizenship||p.birthCountry17||p.country]).filter(id=>countries[id]))];}
// Month-level tourist rules for the game's ordinary-passport catalogue.
const ukVisa106 = ['ru','cn','rs','tr','za','th','in','id','eg','ma'];
const ukEuropeanEta106 = ['nl','fr','es','de','it','pl','no'];
const canadaVisa106 = [...ukVisa106,'br'];
const russianEvisa110 = ['nl','fr','es','de','it','pl','no','jp','mx','cn','in','id','tr'];
const usWaiver111 = ['nl','fr','es','de','uk','jp','kr','au','it','no','pl'];
const russianVisa110 = ['uk','us','ca','au','eg','ma'];

function touristRule106(passport,target,route,date){
 const month=date.year*12+date.month;
 if(target==='us'){
  if(passport==='ca')return 'free';
  if(!usWaiver111.includes(passport)||passport==='pl'&&month<2019*12+10)return 'visa';
  return route==='car'&&month<2022*12+9?'free':'esta';
 }
 if(target==='ru'){
  if(russianEvisa110.includes(passport))return month>=2023*12+7?'evisa':'visa';
  if(russianVisa110.includes(passport))return 'visa';
 }
 if(target==='uk'){
  if(ukVisa106.includes(passport))return 'visa';
  const rollout=2025*12+(ukEuropeanEta106.includes(passport)?3:0);
  return month>=rollout?'eta':'free';
 }
 if(target==='br'&&['us','ca','au'].includes(passport)){
  if(month<2019*12+5)return 'visa';
  return month>=2025*12+3?'evisa':'free';
 }
 if(target==='ca'){
  if(passport==='us')return 'free';
  if(canadaVisa106.includes(passport)||passport==='mx'&&month>=2024*12+2)return 'visa';
  return route==='car'?'free':'eta';
 }
 return null;
}

function canadaConditionalEta106(passport,date){
 const month=date.year*12+date.month;
 if(passport==='br')return month>=2017*12+4;
 if(passport==='mx')return month>=2024*12+2;
 return ['ma','th'].includes(passport)&&month>=2023*12+5;
}

function visaRule86(passport,target,route='public',date=travelDate86(s.clock.ticks)){if(passport===target)return 'free';const timed=touristRule106(passport,target,route,date);if(timed)return timed;if(schengen86.includes(target))return ['ru','cn','tr','za','th','in','id','eg','ma'].includes(passport)?'visa':'free';if(target==='rs')return 'free';if(target==='ru')return 'free';if(target==='br')return 'free';if(target==='jp')return ['ru','cn'].includes(passport)?'visa':'free';if(target==='kr')return passport==='cn'?'visa':['ru','rs','br','mx'].includes(passport)?'keta':'free';if(target==='cn')return ['us','mx'].includes(passport)?'visa':'free';if(target==='mx')return ['rs','cn'].includes(passport)?'visa':['ru','br'].includes(passport)?route==='car'?'visa':'evisa':'free';return 'visa';}
function visaZone86(country,date=travelDate86(s.clock.ticks)){
 return schengen86.includes(country)&&(country!=='hr'||date.year>=2023)?'schengen':country;
}
function touristDocumentMatches110(q,country,dep,route){
 const zone=visaZone86(country,travelDate86(dep));
 if(country==='ca'&&route==='car'&&q.kind==='eta')return false;
 return visaValid86(q,dep,zone)||(country==='hr'&&(
  visaValid86(q,dep,'hr')||!q.single&&visaValid86(q,dep,'schengen')
 ));
}
function visaValid86(q,tick,zone){return q.zone===zone&&q.ready<=tick&&q.expires>tick&&(!q.single||!q.used);}
function visaRequirement86(person,d){if(d.stayHome86||d.country===s.country)return null;const p=person==='player'?s:living(person);if(!p)return null;const passports=passports86(p);if(!passports.length)return {person,name:p.name,country:d.country,kind:'noPassport',lead:0,fee:0};const dep=d.departure86||s.clock.ticks+3,date=travelDate86(dep),route=d.journey57?.route,zone=visaZone86(d.country,date),permits=p===s?path16().permits:[p.residence17].filter(Boolean),active=q=>q&&(q.expires==null||q.expires>dep);if((zone==='schengen'||d.country==='hr')&&permits.some(q=>visaZone86(q.country,date)==='schengen'&&active(q)))return null;const docs=visaState86().documents.filter(q=>q.person===person);if(docs.some(q=>touristDocumentMatches110(q,d.country,dep,route)))return null;if(d.country==='mx'&&(docs.some(q=>['us','ca','uk','jp','schengen'].includes(q.zone)&&q.kind==='visa'&&visaValid86(q,dep,q.zone))||permits.some(q=>(['us','ca','uk','jp'].includes(q.country)||visaZone86(q.country,date)==='schengen')&&active(q)&&(q.permanent||q.basis==='permanent'))))return null;let choices=passports.map(passport=>({passport,kind:visaRule86(passport,d.country,route,date)}));if(d.country==='ca'&&route!=='car'&&docs.some(q=>q.zone==='us'&&q.kind==='visa'&&visaValid86(q,dep,'us')||q.zone==='ca'&&q.kind==='visa'&&q.ready>=dep-120))choices=choices.map(q=>q.kind==='visa'&&canadaConditionalEta106(q.passport,date)?{...q,kind:'eta'}:q);const rank={free:0,eta:1,esta:1,keta:1,evisa:2,visa:3};choices.sort((a,b)=>rank[a.kind]-rank[b.kind]);const best=choices[0];if(best.kind==='free')return null;return {person,name:p.name,zone,country:d.country,...best,lead:best.kind==='visa'?(d.country==='us'?3:2):d.country==='br'?2:1,fee:best.kind==='visa'?(d.country==='us'?180:90):best.kind==='evisa'?70:20};}
function visaNeeds86(d){return ['player',...partyIds53(d)].map(id=>visaRequirement86(id,d)).filter(Boolean);}
function visaLead86(d){return Math.max(0,...visaNeeds86(d).map(q=>q.lead));}
function visaWhy86(d){return visaNeeds86(d).map(q=>q.kind==='noPassport'?q.name+': нет гражданства с паспортом в игровой модели':q.name+': нужны '+({visa:'виза',eta:'ETA',esta:'ESTA',keta:'K-ETA',evisa:'электронная виза'}[q.kind])+' и '+q.lead+' мес. на оформление');}
function visaValidity86(q){if(q.zone==='schengen')return pick([12,12,12,36,60]);if(q.kind==='eta')return q.country==='ca'?60:24;if(q.kind==='esta')return 24;if(q.kind==='keta')return 36;if(q.country==='us')return q.passport==='ru'?36:120;if(q.country==='ca')return 120;if(q.country==='uk')return 6;if(q.country==='jp')return 3;if(q.country==='ru'&&q.kind==='evisa'){const date=travelDate86(s.clock.ticks);return date.year*12+date.month>=2025*12+7?4:2;}if(q.country==='mx'&&q.kind==='evisa')return 1;if(q.country==='br')return q.passport==='us'?120:60;return 3;}
function applyVisas86(d){d=extraTravel86(d);const needs=visaNeeds86(d),dep=d.departure86||departureMin86(d);if(!needs.length)return returnTravel86(d);if(needs.some(q=>q.kind==='noPassport'))return toast('Сначала нужен паспорт для выезда.');if(needs.some(q=>s.clock.ticks+q.lead>dep))return toast('На оформление к этой дате не хватает времени.');const quote=baseJourneyQuote57(journeyDraft57(d)),charges={};for(const q of needs){q.payer=quote.rows.find(r=>r.person===q.person)?.payer||'player';charges[q.payer]=(charges[q.payer]||0)+q.fee*fxRates86[s.country];}const key=id16('visa86');if(!transaction17({key,purpose:'Туристические документы',participants:['player',...partyIds53(d)],parts:Object.entries(charges).map(([payer,amount])=>({payer,amount}))}))return toast('Не хватает средств у плательщика документов.');for(const q of needs){const validity=visaValidity86(q),ready=Math.max(s.clock.ticks+q.lead,dep-(validity===1?0:1));visaState86().documents.push({...q,id:key+':'+q.person,ready,expires:ready+validity,validity,single:q.country==='jp'||q.kind==='evisa'&&['ru','mx'].includes(q.country),used:false});}log('Документы поданы','Готовность к '+dateLabel86(dep)+'. Сбор оплачен и не возвращается при отмене поездки.','Документы');save();returnTravel86({...d,departure86:dep});}
function visaBook86(t,d){t.visaIds86=visaState86().documents.filter(q=>['player',...partyIds53(d)].includes(q.person)&&touristDocumentMatches110(q,t.country,t.departure,d.journey57?.route)).map(q=>q.id);}
function visaDepartureWhy86(t){const needs=visaNeeds86({...tripDraft57(t),departure86:s.clock.ticks});return needs.length?needs[0].name+': документы ещё не готовы или истекли':'';}
const visaOptionsBase86=travelOptions86;
travelOptions86=function(d){const needs=visaNeeds86(d);return [...visaOptionsBase86(d),...(needs.length&&!needs.some(q=>q.kind==='noPassport')?[{label:'Оформить документы · '+money(needs.reduce((n,q)=>n+q.fee,0)*fxRates86[s.country]),hint:needs.map(q=>q.name+': '+q.kind+', '+q.lead+' мес.').join('; '),fn:()=>applyVisas86(d)}]:[]),{label:'Визы и условия въезда',fn:()=>visaMenu86(d)}];};
function visaMenu86(d){const docs=visaState86().documents.filter(q=>['player',...partyIds53(d)].includes(q.person)&&(q.zone===visaZone86(d.country,travelDate86(d.departure86||s.clock.ticks+3))||d.country==='hr'&&['hr','schengen'].includes(q.zone)));show('Туристические документы',(typeof tourAbroad103==='object'&&tourAbroad103[d.country]?'Для этого направления действуют упрощённые игровые правила.\n':'')+'Упрощённые туристические правила. Часть требований зависит от месяца выезда. Электронные разрешения: 1 месяц, обычные визы: 2, США: 3; электронная виза Бразилии: 2. Сборы округлены для игры. Срок действия не равен разрешённой длительности визита. Шенген на 1, 3 или 5 лет — игровое упрощение, в том числе для россиян.\n'+(visaWhy86(d).join('\n')||'Дополнительные документы для выбранного маршрута не нужны.')+'\n'+docs.map(q=>payerLabel53(q.person)+': '+q.kind+' · готовность '+dateLabel86(q.ready)+' · до '+dateLabel86(q.expires)+(q.used?' · въезд использован':'')).join('\n'),[{label:'К поездке',fn:()=>returnTravel86(d)}]);}
const visaEndBase86=travelEndMonth52;
travelEndMonth52=function(){visaEndBase86();for(const t of travel52().trips)if(t.status==='completed'&&!t.visaUsed86){t.visaUsed86=true;for(const id of t.visaIds86||[]){const q=visaState86().documents.find(q=>q.id===id);if(q?.single)q.used=true;}}};
