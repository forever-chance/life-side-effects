'use strict';
const socialBase17={finishTask,autonomousMonth,npcCard};
function socialState17(){s.social17??={lastEncounter:-10,lastMonth:-1,attempts:0};return s.social17;}
function socialStage17(p){const n=p.social17?.meetings||0;return p.social17?.inactive?'Давнее знакомство':n>=10&&p.bond>=75?'Близкая дружба':n>=6&&p.bond>=60?'Дружба':n>=3?'Приятельство':n>=2?'Регулярное общение':'Первое знакомство';}
function socialTouch17(p,source){p.social17??={meetings:0,circles:[],last:s.clock.ticks};p.social17.meetings++;p.social17.last=s.clock.ticks;p.social17.inactive=false;if(source&&!p.social17.circles.includes(source))p.social17.circles.push(source);p.bond=clamp(p.bond+4);p.inner.affection=clamp(p.inner.affection+3);if(p.social17.meetings>=6&&p.bond>=60&&['Знакомство','Знакомый'].includes(p.role))p.role='Друг';}
function socialEncounter17(source='Местные мероприятия',manual=true,city=null){const f=socialState17();if(s.age<6||s.dead||f.lastEncounter===s.clock.ticks)return;f.lastEncounter=s.clock.ticks;f.attempts+=manual?1:0;const contacts=s.people.filter(p=>p.alive&&['Друг','Знакомство','Знакомый'].includes(p.role));const active=contacts.filter(p=>!p.social17?.inactive),local=contacts.filter(p=>p.country===s.country&&(!city||p.city18===city));const target=4+(s.social||40)/12+Math.min(10,f.attempts/12);const novelty=.6/(1+Math.pow(active.length/target,3));if(local.length&&(!chance(novelty))){const contextual=local.filter(p=>p.social17?.circles.includes(source));const p=pick(contextual.length?contextual:local);socialTouch17(p,source);if(manual)log('Знакомое лицо',p.name+': разговор продолжился. '+socialStage17(p)+'.','Общение');return;}if(!chance(.7)){if(manual)log('Разговор без продолжения','Вы перекинулись несколькими словами. Контактами обмениваться не стали.','Общение');return;}const p=socialPerson115('Знакомый',Math.max(s.age<18?6:18,s.age+rnd(-3,4)),s.country,city||residenceCity());p.bond=rnd(30,45);s.people.push(p);enrichPerson(p);socialTouch17(p,source);remember(p,'познакомились: '+source);log('Новое знакомство · '+p.name,source+'. Разговор оказался достаточно интересным, чтобы обменяться контактами. Дружба еще впереди.','Общение',true);}
autonomousMeeting=function(){socialEncounter17('Местные мероприятия',true)};
meet=function(romantic){if(romantic)return identityBase.meet(true);assign('meet')};
finishTask=function(t){if(['cancelled','paused','completed'].includes(t.state))return;socialBase17.finishTask(t);if(['visit','talk'].includes(t.kind)){const p=living(t.targetId);if(p&&['Друг','Знакомство','Знакомый'].includes(p.role))socialTouch17(p);}};
autonomousMonth=function(){socialBase17.autonomousMonth();const f=socialState17();if(f.lastMonth===s.clock.ticks)return;f.lastMonth=s.clock.ticks;for(const p of s.people){if(p.social17&&s.clock.ticks-p.social17.last>36){p.social17.inactive=true;if(s.clock.ticks%12===0)p.bond=clamp(p.bond-2);}}if(s.clock.ticks%6===0&&(s.job||path16().study||s.studyTrack)){const remote=s.job?.format==='remote';if(chance(remote?.22:.5))socialEncounter17(path16().study||s.studyTrack?'Учеба':'Работа',false);}};
npcCard=function(p,compact=false){const html=socialBase17.npcCard(p,compact);return p.social17?html.replace('</h3>',`</h3><p class="sub">${esc(socialStage17(p))} · ${esc(p.social17.circles.join(', '))}</p>`):html;};

// Selected origins from Amsterdam O&S, INSEE 2021 and the Pittsburgh ACS-based
// report. The meeting odds and weights are gameplay tuning, not census shares.
const socialMigration115 = {
 'nl:Амстердам': [.12, [['ma',3],['tr',3],['it',2],['uk',2],['de',2],['fr',2],['in',1],['es',1]]],
 'fr:Париж': [.10, [['ma',4],['cn',3],['tr',1],['us',1],['br',1]]],
 'us:Питтсбург': [.06, [['cn',5],['in',4],['kr',1],['it',1]]],
 'de:Берлин': [.09, [['tr',5],['pl',3]]],
 'uk:Лондон': [.13, [['in',5],['pl',3],['it',2],['fr',2]]],
 'ca:Торонто': [.13, [['cn',5],['in',4]]],
 'au:Сидней': [.12, [['cn',5],['in',4],['uk',3]]]
};

// Gameplay estimates. Country pools contain places with supported name and citizenship data.
const socialCountry175={
 nl:[.09,'pl tr ma id de'],rs:[.06,'ru tr de'],ru:[.05,'rs cn tr in'],
 us:[.11,'mx in cn ca kr'],br:[.025,'jp it es'],jp:[.025,'cn kr br id'],
 fr:[.09,'ma it es tr pl'],es:[.10,'ma it fr br'],de:[.11,'tr pl it rs'],
 uk:[.11,'in pl it fr cn'],ca:[.14,'in cn fr uk us'],kr:[.035,'cn th id'],
 cn:[.012,'kr jp in id'],mx:[.025,'us es ca'],it:[.075,'ma eg pl'],
 au:[.15,'uk cn in id'],tr:[.045,'ru de eg rs'],za:[.055,'in uk cn'],
 th:[.045,'cn jp in'],no:[.11,'pl de uk'],in:[.012,'th uk cn'],
 id:[.012,'cn in jp'],eg:[.025,'tr ma in'],ma:[.025,'fr es eg'],pl:[.03,'de ru in']
};
const socialHubs175={
 nl:['Роттердам','Гаага','Эйндховен'],rs:['Белград','Нови-Сад'],ru:['Москва','Санкт-Петербург'],
 us:['Нью-Йорк','Лос-Анджелес','Сан-Франциско','Майами'],br:['Сан-Паулу'],jp:['Токио','Осака','Нагоя'],
 fr:['Марсель','Лион'],es:['Мадрид','Барселона','Малага'],de:['Франкфурт','Мюнхен','Гамбург'],
 uk:['Бирмингем','Манчестер'],ca:['Ванкувер','Монреаль'],kr:['Сеул','Инчхон'],cn:['Шанхай','Пекин','Шэньчжэнь'],
 mx:['Мехико','Канкун'],it:['Милан','Рим'],au:['Мельбурн','Перт'],tr:['Стамбул','Анталья'],
 za:['Йоханнесбург','Кейптаун'],th:['Бангкок','Пхукет'],no:['Осло','Ставангер'],in:['Мумбаи','Нью-Дели','Бенгалуру'],
 id:['Джакарта','Денпасар'],eg:['Каир','Хургада'],ma:['Касабланка','Танжер'],pl:['Варшава','Краков','Вроцлав']
};
function socialMigrationProfile175(country,city){
 const local=socialMigration115[country+':'+city];
 if(local)return local;
 const national=socialCountry175[country];
 if(!national)return null;
 const [base, origins]=national;
 const hub=socialHubs175[country]?.includes(city);
 return [base*(hub?1.35:1),origins.split(' ').map((origin,i)=>[origin,Math.max(1,4-i)])];
}

const socialExposure129 = {school:.85,study:1.5,course:1.1,work:1.2,internationalWork:1.65,club:1.1};
const secondGeneration129 = .65;

function socialOrigin129(country,city,context) {
 const profile = socialMigrationProfile175(country,city);
 if (!profile) return null;
 const [base,candidates] = profile;
 const origins=candidates.filter(([id])=>countries[id]);
 if(!origins.length)return null;
 const firstGeneration = base*(socialExposure129[context]??1);
 const draw = Math.random();
 if (draw >= firstGeneration+base*secondGeneration129) return null;
 let roll = Math.random()*origins.reduce((sum,[,weight])=>sum+weight,0);
 const origin = origins.find(([,weight])=>(roll-=weight)<0)?.[0];
 return origin ? {origin, bornLocally:draw>=firstGeneration} : null;
}

function socialPerson115(role,age,country=s.country,city=residenceCity(),context='local') {
 const background = socialOrigin129(country,city,context);
 const p = person(role,age,undefined,background?.origin??country,background?null:city);
 p.country = country;
 if (cities[country]?.includes(city)) p.city18 = city;
 if (background) {
  const {origin,bornLocally} = background;
  p.birthCountry = bornLocally ? country : origin;
  p.citizenships = bornLocally&&['us','ca'].includes(country) ? [country] : [origin];
  p.originSource49 = 'city-migration';
  p.migration129 = {familyOrigin:origin,generation:bornLocally?2:1};
 }
 return p;
}
