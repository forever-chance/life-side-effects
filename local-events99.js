'use strict';

// Public seasonal activities. The month is a gameplay window, not a claim
// that every city observes a particular tradition on the same date.
const localCalendar99 = {
 nl:[12,'Синтерклаас','В районе устраивают праздник и мастерскую подарков.'],
 rs:[7,'Летний музыкальный вечер','В городе готовят летний концерт на открытом воздухе.'],
 ru:[12,'Новогодняя ярмарка','В центре открылись ярмарка и праздничный каток.'],
 us:[10,'Хэллоуин в районе','Соседи украшают дома и зовут на прогулку по району.'],
 uk:[11,'Bonfire Night','В парке готовят вечерний праздник с фейерверком.'],
 fr:[6,'Fête de la Musique','На улицах и площадях вечером будут бесплатные концерты.'],
 de:[12,'Зимняя ярмарка','На городской площади открылись праздничные киоски.'],
 es:[1,'Кавалькада волхвов','По городу пройдёт праздничное шествие.'],
 ca:[7,'День Канады','В парке готовят концерт и площадку для пикника.'],
 br:[6,'Festa Junina','На районной площади готовят танцы и угощения.'],
 mx:[11,'Día de Muertos','В городе открывается выставка, посвящённая памяти близких.'],
 jp:[4,'Ханами','Знакомые обсуждают прогулку и пикник под цветущими деревьями.'],
 kr:[4,'Весенний фестиваль','В парке устроили прогулки и выступления к сезону цветения.'],
 cn:[4,'Весенняя прогулка','В районе на весенних выходных предлагают встретиться в парке.'],
 it:[8,'Ferragosto','На августовских выходных в городе устраивают вечер на открытом воздухе.'],
 au:[12,'Летний пикник','Знакомые предлагают встретиться на летнем барбекю.'],
 tr:[10,'День Республики','На городской площади пройдёт открытый концерт.'],
 za:[9,'Heritage Day','В районе устраивают встречу с музыкой и общим столом.'],
 th:[4,'Сонгкран','На нескольких улицах готовят водный праздник.'],
 no:[5,'17 мая','В центре готовят шествие и выступления.'],
 in:[11,'Осенний фестиваль огней','На местной площади готовят открытый вечер с огнями и музыкой.'],
 id:[8,'День независимости','Соседи готовят игры и небольшие соревнования на улице.'],
 eg:[4,'Весенние выходные','Знакомые собираются на весенний пикник.'],
 ma:[6,'Музыкальный вечер','В районе готовят открытый концерт и уличный рынок.'],
 pl:[12,'Зимняя ярмарка','В центре открылись праздничные лавки и выставка.']
};

// An additional public outing for each country gives the year a second window.
const localOutings100 = {
 nl:[4,'День короля','На улице разворачивают блошиный рынок. Знакомые собираются пройтись между палатками.'],
 rs:[6,'Выходные у реки','Знакомые зовут к реке. Можно взять с собой еду или просто встретиться на набережной.'],
 ru:[7,'Летний вечер во дворе','Соседи вынесли столы во двор. Кто-то принёс чай, кто-то предлагает сыграть в настольную игру.'],
 us:[7,'Летний пикник в парке','В парке готовят вечерний концерт. Знакомые предлагают занять место на траве.'],
 uk:[5,'Викторина по соседству','В районе проводят вечернюю викторину. Команде знакомых не хватает ещё одного человека.'],
 fr:[7,'Вечер на площади','Знакомые зовут прогуляться. На площади готовят открытый концерт и столы с угощениями.'],
 de:[9,'Осенняя ярмарка','У площади открыли ярмарку. Знакомые собираются посмотреть мастерские и послушать музыку.'],
 es:[9,'Вечерняя фиеста','Знакомые предлагают дождаться, пока спадёт жара, и выйти на районную площадь.'],
 ca:[2,'Выходные на катке','В парке открыли каток. Можно покататься или просто встретиться у входа.'],
 br:[12,'Музыкальный вечер на улице','После дневной жары на площади выступают местные музыканты.'],
 mx:[12,'Вечерняя ярмарка','Уличные лавки открылись до позднего вечера. Знакомые предлагают встретиться у площади.'],
 jp:[8,'Летний фестиваль','На улице зажгли фонари. Знакомые зовут прогуляться между киосками.'],
 kr:[10,'Осенний пикник','Знакомые зовут в парк. Можно принести еду или просто пройтись среди деревьев.'],
 cn:[9,'Вечер фонарей','В районе открылась выставка фонарей. Знакомые собираются заглянуть после ужина.'],
 it:[5,'Ярмарка ремёсел','На площади открылись мастерские. Знакомые предлагают заглянуть на выставку.'],
 au:[1,'Вечер у воды','Знакомые зовут на вечернюю прогулку у воды и предлагают принести что-нибудь к столу.'],
 tr:[5,'Чай во дворе','Соседи вынесли столики. Можно заглянуть на чай и поговорить или устроить тихий вечер дома.'],
 za:[4,'Общий стол во дворе','Знакомые готовят браай и зовут на общий стол. Можно прийти на время.'],
 th:[11,'Лойкратхонг','Знакомые зовут смотреть на огни у воды. Можно просто пройтись вдоль берега.'],
 no:[6,'Sankthans','Знакомые предлагают встретиться на летнем вечере у воды.'],
 in:[7,'Рынок после дождя','На площади снова открылись лавки. Знакомые собираются пройтись, пока дождь стих.'],
 id:[7,'Вечер соседей','В районе собираются на небольшой вечер с музыкой и едой.'],
 eg:[10,'Вечер после жары','Знакомые зовут на прогулку и предлагают встретиться, когда станет прохладнее.'],
 ma:[10,'Прогулка по рынку','Знакомые предлагают встретиться у рынка и пройтись по лавкам.'],
 pl:[5,'Длинные выходные','В парке готовят небольшой пикник. Знакомые предлагают взять плед и встретиться там.']
};

const namedHolidays130 = {
 nl: ['День короля','Синтерклаас'],
 th: ['Сонгкран','Лойкратхонг']
};

// Gregorian Easter (Meeus/Jones/Butcher). The game offers outings by month.
function easter178(year){
 const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4;
 const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
 const h=(19*a+b-d-g+15)%30,l=(32+2*e+2*Math.floor(c/4)-h-c%4)%7;
 const m=Math.floor((a+11*h+22*l)/451),day=h+l-7*m+114;
 return Date.UTC(year,Math.floor(day/31)-1,day%31+1);
}
function holidayDate178(country,year){
 const day=86400000;
 if(country==='br')return new Date(easter178(year)-47*day);
 if(country==='es')return new Date(easter178(year)-2*day);
 if(country==='us'||country==='ca'){
  const month=country==='us'?10:9;
  const first=new Date(Date.UTC(year,month,1));
  return new Date(Date.UTC(year,month,1+((country==='us'?4:1)-first.getUTCDay()+7)%7+(country==='us'?21:7)));
 }
 return null;
}
const addedHolidays178={
 br:['Карнавал','В городе готовятся к карнавалу. Можно посмотреть выступление или встретиться с близкими.'],
 es:['Semana Santa','В городе готовятся к Страстной неделе. Можно провести время с близкими или посмотреть шествие.'],
 us:['День благодарения','Есть повод собраться за столом с близкими.'],
 ca:['День благодарения','Знакомые обсуждают, где собраться на осенний обед.']
};
function regionalHoliday178(country,city,month){
 if(country==='uk'&&city==='Белфаст'&&month===3)return [3,'День святого Патрика','В центре Белфаста готовится шествие.'];
 return null;
}
function slavaHost130() {
 if(s.country!=='rs')return null;
 return s.people.find(p=>p.alive&&p.country==='rs'&&p.bond>=50
  &&['Мать','Отец','Бабушка','Дедушка'].includes(p.role)
  &&[...String(p.id)].reduce((sum,character)=>sum+character.codePointAt(0),0)%3===0);
}

const localEventsBase99={autonomousMonth,decisionRecord24,decisionActive24,decisionItems24,openDecision24};
function localEvent99() {
 if(s.dead || s.age<6 || travelActive52() || courtCustody94()) return;
 const tick=s.clock.ticks, previous=s.localEvent99, season=localCalendar99[s.country];
 if(!season || decisionActive24({kind:'local99',id:previous?.id})) return;
 const window=s.clock.month+1;
 const outing=localOutings100[s.country];
 const host=window===12?slavaHost130():null;
 const date=holidayDate178(s.country,s.year);
 const special=date?.getUTCMonth()+1===window?[window,...addedHolidays178[s.country]]:regionalHoliday178(s.country,residenceCity(),window);
 const event=host?[12,'Семейная слава',host.name+' приглашает на семейный обед по случаю славы.']:
  season[0]===window?season:special|| (outing?.[0]===window?outing:null);
 const holiday=host||event&&event===special||namedHolidays130[s.country]?.includes(event?.[1]);
 const holidayKey=holiday?s.country+':'+event[1]:null;
 if(holidayKey){
  const last=s.localHolidayOffers130?.[holidayKey]??(previous?.title===event[1]&&previous.country===s.country?previous.tick:-24);
  if(tick-last<10)return;
 }else if(tick-(previous?.tick??-24)<6)return;
 const recent=s.lastNeighborhood104?.[s.country]??-24;
 const candidate=!event&&tick-recent>=18&&typeof neighborhoodOffer104==='function'
  ?neighborhoodOffer104(s.country,residenceCity(),window):null;
 const incident=candidate&&chance(.75)?candidate:null;
 if(!chance(event ? .55 : incident ? .085 : .045)) return;
 if(holidayKey)(s.localHolidayOffers130??={})[holidayKey]=tick;
 if(incident)(s.lastNeighborhood104??={})[s.country]=tick;
 const contact=s.people.filter(p=>p.alive&&p.age>=6&&p.country===s.country&&(!p.city18||p.city18===residenceCity())&&p.bond>=40);
 const family=holiday?contact.find(p=>['Мать','Отец','Бабушка','Дедушка','Брат','Сестра','Партнер','Ребенок','Сын','Дочь'].includes(p.role)):null;
 s.localEvent99={id:'local99-'+tick,tick,expires:tick+2,status:'offered',country:s.country,city:residenceCity(),
  title:event?event[1]:incident?.title||'Вечер в районе',
  text:event?event[2]:incident?.text||'На этой неделе в районе будет встреча на открытом воздухе. Можно заглянуть ненадолго или провести вечер по-своему.',
  ...(incident?{neighborhood104:incident}:{}),
  companion:host?.id??(contact.length?pick(contact).id:null),holiday130:!!holiday,family178:host?.id||family?.id||null,price:Math.max(1,Math.round(c().cost*.0008))};
}

function localChoice99(id,choice) {
 const q=s.localEvent99;
 if(!decisionActive24({kind:'local99',id}))return false;
 if(q.neighborhood104&&typeof neighborhoodChoice104==='function')return neighborhoodChoice104(q,choice);
 if(!['free','paid','rest','skip','family'].includes(choice))return false;
 const relative=choice==='family'&&living(q.family178);
 if(choice==='family'&&(!relative||relative.country!==s.country||relative.city18&&relative.city18!==residenceCity()))return false;
 if(choice==='paid'&&(s.age<18||expenseAvailable231()<q.price||!spend231(q.price,q.title,q.id)))return false;
 q.status=choice==='skip'?'declined':choice==='rest'?'rested':'attended';
 if(choice==='rest'){
  s.clock.fatigue=clamp(s.clock.fatigue-4);
  log(q.title,'Вы остались дома и немного отдохнули.','Быт');
 }else if(choice!=='skip'){
  s.mood=clamp(s.mood+(choice==='paid'?5:3));
  const companion=relative||(q.companion&&living(q.companion));
  const attendedTogether=companion?.country===s.country
   && (q.title==='Семейная слава'||!companion.city18||companion.city18===residenceCity());
  if(attendedTogether){companion.bond=clamp(companion.bond+(relative?4:2));if(relative)remember(companion,'Провели праздник вместе: '+q.title);}
  if(q.holiday130)s.clock.fatigue=clamp(s.clock.fatigue+2);
  log(q.title,attendedTogether?'Провели время вместе: '+companion.name+'.':'Вы провели немного времени на местном празднике.','Быт');
 }
 save();
 return true;
}

autonomousMonth=function(){localEventsBase99.autonomousMonth();localEvent99();};
decisionRecord24=function(ref){
 if(ref?.kind!=='local99')return localEventsBase99.decisionRecord24(ref);
 return s.localEvent99?.id===ref.id?s.localEvent99:null;
};
decisionActive24=function(ref){
 if(ref?.kind!=='local99')return localEventsBase99.decisionActive24(ref);
 const q=decisionRecord24(ref);
 return !!(q&&!s.dead&&q.status==='offered'&&q.country===s.country&&q.city===residenceCity()&&q.expires>=s.clock.ticks&&!travelActive52()&&!courtCustody94());
};
decisionItems24=function(){
 const items=localEventsBase99.decisionItems24(),q=s.localEvent99,ref={kind:'local99',id:q?.id};
 if(decisionActive24(ref)&&(s.notices59?.snoozed?.['local99:'+q.id]??-1)<=s.clock.ticks)items.push({q,ref,title:q.title,note:q.city,expires:q.expires});
 return items;
};
openDecision24=function(kind,id){
 if(kind!=='local99')return localEventsBase99.openDecision24(kind,id);
 if(!decisionActive24({kind,id}))return toast('Приглашение уже закрыто.');
 const q=s.localEvent99;
 if(q.neighborhood104&&typeof neighborhoodMenu104==='function')return neighborhoodMenu104(q);
 show(q.title,q.text,[
  {label:'Заглянуть ненадолго',fn:()=>localChoice99(id,'free')},
  ...(q.family178&&living(q.family178)?[{label:'Провести праздник вместе · '+living(q.family178).name,fn:()=>localChoice99(id,'family')}]:[]),
  ...(s.age>=18?[{label:'Зайти и взять угощение · '+money(q.price),disabled:expenseAvailable231()<q.price,fn:()=>localChoice99(id,'paid')}]:[]),
  {label:'Отдохнуть дома',fn:()=>localChoice99(id,'rest')},
  {label:'Пропустить',fn:()=>localChoice99(id,'skip')}
 ]);
};
