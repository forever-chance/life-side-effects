'use strict';
// Сборка 275.4: мелкие ошибки, которые нашла разведка.
// 1. Мастер-класс. Хозяина приглашения игра брала только из круга направления (circleMember48). Когда этот круг пуст,
//    а знакомых по кругам в жизни уже 24, новых людей там не появляется, и приглашение молча не создавалось: у взрослого
//    персонажа его не было никогда. Теперь хозяин находится сам, как ученик и наставник в 272 (learning272.js): человек
//    из круга направления, ваш наставник по этому делу из вашего города или новый опытный специалист из вашего города.
//    Прежний хозяин приглашает снова, только пока живёт в вашем городе: если уехал он или вы, приглашает кто-то из
//    вашего города (и при неполном круге тоже). Шанс, частота, гонорар и известность не менялись.
// 2. Приглашение провести мастер-класс и предложение учебного центра вести курс видны в «Ожидают ответа», пока ответить
//    можно в этой стране. «×» прячет пункт по теме (notices270: masterClass2754, course2754) и возвращает его за месяц
//    до срока ответа.
// 3. После переезда в другую страну у «Провести мастер-класс» и у контракта учебного центра причина — «пришло из другой
//    страны», а не «приглашения пока нет».
// 4. «Найти действие»: «в гости», «навестить», «съездить», «позвать», «пригласить» → «Люди и общение» (у каждого
//    человека — «Общение и встречи»: «В гости» и «Встреча и совместное время»), «съездить» → ещё и «Поездки и отпуск»;
//    «брак», «замуж», «расписаться», «свадьба» → «Личная жизнь» («Брак или развод»); «мастер-класс», «курс», «ученик»,
//    «наставник» → «Менторство и мастер-классы» (окно было и раньше, но в поиске его не было). Новых действий нет.

const base2754={masterClassOffer194,mentoringWhy272,mentoringMenu194,courseMenu195,decisionRecord24,decisionActive24,
 decisionItems24,openDecision24,topic270,snoozeUntil270,actionCatalog24};
const classKind2754='masterClass2754',courseKind2754='course2754';

// ---------- 1. Хозяин мастер-класса, когда круг направления пуст ----------
// Живёт в вашем городе вашей страны, не родня и не партнёр.
function classHostHere2754(p){
 if(!p||!p.alive||p.id==='player'||p.country!==s.country)return false;
 if((typeof personCity62==='function'?personCity62(p):p.city18||residenceCity())!==residenceCity())return false;
 return currentPartner()?.id!==p.id&&!(typeof kin27==='function'&&kin27(p));
}
function classHostFits2754(p){return !!p&&p.age>=25&&p.age<=75&&classHostHere2754(p);}
// Новый опытный специалист из вашего города: как mentoringNewcomer272, но не старше 64 лет — у пожилого автора
// приглашает не девяностолетний коллега.
function classHostNew2754(sc){
 const rec=circleRecord48(sc),city=residenceCity();
 const p=socialPerson115('Знакомый',Math.min(64,Math.max(30,s.age+rnd(6,16))),sc.country,city,'work');
 if(cities[sc.country]?.includes(city))p.city18=city;
 s.people.push(p);enrichPerson(p);
 p.bond=35;p.inner.affection=35;p.inner.trust=40;p.lastBond=35;
 p.contexts48={[sc.key]:'mentor'};
 p.occupation='Опытный специалист · '+sc.title;
 p.careerVariety=true;
 rec.roster.push(p.id);rec.lastNew=s.clock.ticks;
 circleHistory48('Познакомились: '+sc.title,p);
 return p;
}
function classHost2754(sc,track){
 const own=circleRecord48(sc).roster.map(id=>living(id)).find(p=>classHostFits2754(p)&&p.contexts48?.[sc.key]!=='student');
 if(own)return own;
 const scope='creative-mentor:'+s.country+':'+track;
 const mentor=s.people.find(p=>classHostFits2754(p)&&Object.entries(p.contexts48||{}).some(([k,role])=>role==='mentor'&&(k===scope||k.startsWith(scope+':'))));
 return mentor||classHostNew2754(sc);
}
masterClassOffer194=function(work,...rest){
 const track=work?.track;
 if(!s||!track||!formats47[track])return base2754.masterClassOffer194.call(this,work,...rest);
 const key=mentoringScope194(track).key,member=circleMember48;
 // Круг отдаёт прежнего хозяина или старшего коллегу, не глядя, где тот живёт. Если уехал он или вы, приглашает
 // кто-то из вашего города. Человек, которого круг только что создал, и так из вашего города.
 circleMember48=function(sc,...more){
  if(sc?.key!==key)return member.call(this,sc,...more);
  const n=s.people.length,p=member.call(this,sc,...more);
  if(p&&(s.people.length>n||classHostHere2754(p)))return p;
  return classHost2754(sc,track);
 };
 try{return base2754.masterClassOffer194.call(this,work,...rest);}
 finally{circleMember48=member;}
};

// ---------- 2. «Ожидают ответа» ----------
// Записи читаются без создания: у жизни без творчества в сохранении ничего не появляется.
function classOfferSaved2754(){return s?.creative47?.mentoring194?.offer||null;}
function courseOfferSaved2754(){return s?.creative47?.mentoring194?.courses195?.contract||null;}
function classId2754(o){return 'class:'+(o.work||'')+':'+(o.ends??'');}
function classOfferHere2754(){
 const o=classOfferSaved2754();
 return o&&s&&!s.dead&&s.age>=18&&o.status==='offered'&&o.ends>s.clock.ticks&&o.country===s.country&&living(o.host)?o:null;
}
function courseOfferHere2754(){
 const o=courseOfferSaved2754();
 return o&&s&&!s.dead&&s.age>=18&&o.status==='available'&&o.expires>s.clock.ticks&&o.country===s.country?o:null;
}
decisionRecord24=function(ref,...rest){
 if(ref?.kind===classKind2754){const o=classOfferSaved2754();return o&&classId2754(o)===ref.id?o:null;}
 if(ref?.kind===courseKind2754){const o=courseOfferSaved2754();return o&&o.id===ref.id?o:null;}
 return base2754.decisionRecord24.call(this,ref,...rest);
};
decisionActive24=function(ref,...rest){
 if(ref?.kind===classKind2754){const o=classOfferHere2754();return !!o&&classId2754(o)===ref.id;}
 if(ref?.kind===courseKind2754){const o=courseOfferHere2754();return !!o&&o.id===ref.id;}
 return base2754.decisionActive24.call(this,ref,...rest);
};
function classItems2754(){
 const out=[],o=classOfferHere2754(),c=courseOfferHere2754();
 if(o){
  const ref={kind:classKind2754,id:classId2754(o)};
  if(!snoozed270(ref,o))out.push({ref,q:{...o,expires:o.ends},title:'Мастер-класс · '+trackNames46[o.track],
   note:'Приглашает '+living(o.host).name+' · '+money(o.fee)+' · 1 мес. по 4 ч/нед.',expires:o.ends});
 }
 if(c){
  const ref={kind:courseKind2754,id:c.id};
  const terms=courseTerms195(false,c);
  if(!snoozed270(ref,c))out.push({ref,q:c,title:'Вести курс · '+(specialties184[c.track]?.[c.key]||trackNames46[c.track]),
   note:'Учебный центр · '+terms.months+' мес. по '+terms.hours+' ч/нед. · '+money(terms.fee),expires:c.expires});
 }
 return out;
}
decisionItems24=function(...args){
 const list=base2754.decisionItems24.apply(this,args);
 if(!s||s.dead)return list;
 const add=classItems2754();
 return add.length?[...list,...add].sort((a,b)=>(a.expires??Infinity)-(b.expires??Infinity)):list;
};
openDecision24=function(kind,id,...rest){
 if(kind!==classKind2754&&kind!==courseKind2754)return base2754.openDecision24.call(this,kind,id,...rest);
 if(!decisionActive24({kind,id}))return toast(kind===classKind2754?'Приглашение уже закрыто или недоступно.':'Предложение уже закрыто или недоступно.');
 return kind===classKind2754?mentoringMenu194():courseMenu195();
};
// Ключ темы: приглашение на мастер-класс и контракт учебного центра бывают только по одному за раз.
topic270=function(ref,q,...rest){
 if(ref?.kind===classKind2754||ref?.kind===courseKind2754)return ref.kind;
 return base2754.topic270.call(this,ref,q,...rest);
};
// Срок приглашения хранится в ends, а не в expires: без этого «×» спрятал бы его на 3 месяца, то есть до конца срока.
snoozeUntil270=function(ref,q,item=null,...rest){
 if(ref?.kind===classKind2754&&!Number.isFinite(item?.expires)&&Number.isFinite(q?.ends))item={...(item||{}),expires:q.ends};
 return base2754.snoozeUntil270.call(this,ref,q,item,...rest);
};

// ---------- 3. Приглашение и контракт из другой страны ----------
function abroadOffer2754(o,open){return o&&s&&open(o)&&o.country!==s.country&&countries[o.country]?o:null;}
function classAbroad2754(){return abroadOffer2754(classOfferSaved2754(),o=>o.status==='offered'&&o.ends>s.clock.ticks);}
function courseAbroad2754(){return abroadOffer2754(courseOfferSaved2754(),o=>o.status==='available'&&o.expires>s.clock.ticks);}
function classAbroadWhy2754(o,track){
 const where=countries[o.country].name;
 if(track&&o.track!==track)return 'Приглашение пришло по другому направлению («'+trackNames46[o.track]+'») и из другой страны ('+where+')';
 return 'Приглашение пришло из другой страны ('+where+'): провести мастер-класс можно только там';
}
mentoringWhy272=function(track,role,...rest){
 const why=base2754.mentoringWhy272.call(this,track,role,...rest);
 if(role!=='class'||!/^Приглашения провести мастер-класс пока нет/.test(why))return why;
 const o=classAbroad2754();
 return o?classAbroadWhy2754(o,track):why;
};
// В «Менторство и мастер-классы» приглашение из другой страны видно выключенным, с причиной.
mentoringMenu194=function(...args){
 const o=classAbroad2754();
 if(!o||classOfferHere2754())return base2754.mentoringMenu194.apply(this,args);
 const old=show;
 show=function(title,text,opts=[],...rest){
  show=old;
  return old.call(this,title,text,[{label:'Провести мастер-класс · '+trackNames46[o.track],hint:classAbroadWhy2754(o),disabled:true,fn:()=>{}},...(opts||[])],...rest);
 };
 try{return base2754.mentoringMenu194.apply(this,args);}
 finally{show=old;}
};
courseMenu195=function(...args){
 const o=courseAbroad2754();
 if(!o)return base2754.courseMenu195.apply(this,args);
 const old=show;
 show=function(title,text,opts=[],...rest){
  show=old;
  return old.call(this,title,text,(opts||[]).map(x=>x?.label==='Контракт с учебным центром'?
   {...x,hint:'Предложение пришло из другой страны ('+countries[o.country].name+'): вести курс можно только там'}:x),...rest);
 };
 try{return base2754.courseMenu195.apply(this,args);}
 finally{show=old;}
};

// ---------- 4. «Найти действие» ----------
const searchWords2754={
 people:'гости навестить съездить позвать пригласить встреча визит',
 travel52:'съездить',
 relations:'брак замуж выйти расписаться свадьба'
};
actionCatalog24=function(...args){
 const list=base2754.actionCatalog24.apply(this,args).map(a=>searchWords2754[a.id]?{...a,keywords:(a.keywords||'')+' '+searchWords2754[a.id]}:a);
 if(typeof mentoringMenu194==='function'&&!list.some(a=>a.id==='mentoring2754'))list.push({id:'mentoring2754',group:'Работа',
  label:'Менторство и мастер-классы',keywords:'мастер-класс курс курсы ученик ученица наставник наставница наставничество преподавание обучение практика',
  reason:s&&s.age<16?'С 16 лет':'',fn:()=>mentoringMenu194()});
 return list;
};
