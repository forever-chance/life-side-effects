'use strict';
// 272: «Обучение и практика» в портфолио — одно окно направления.
// Раньше кнопка закрывала портфолио и молча переключала центр на «Поступление: каталог программ»; на телефоне
// казалось, что ничего не произошло, а настоящие инструменты (практика, наставник, ученик, мастер-класс, курсы)
// лежали в трёх разных местах. Теперь они собраны в одном окне, а сертификат и программы по-прежнему ведут в каталог —
// с переключением на центральную панель и прокруткой к каталогу.
// «Взять ученика» не срабатывал никогда, если в круге направления никого не было: ученик брался только из уже
// знакомых (circleMember48), а после 24 знакомых по всем кругам жизни новые люди там не появляются. Теперь, когда в
// круге никого нет, находится начинающий из вашего города, моложе вас и с интересом к этому делу; если в круге уже
// есть люди, всё как раньше. Тот же упор был у «Найти наставника» — наставник находится так же.
// Недоступный вариант показывается выключенным с конкретной причиной (возраст, сколько часов не хватает, уже идут
// занятия, пороги портфолио с текущими значениями, документы, нет приглашения); тосты «Проверьте расписание и условия»
// заменены причиной. Те же причины — в «Менторство и мастер-классы» и «Курсы и контракты».

const learningBase272={planMentoring194,creativeTrackMenu47,personSections42};

function capital272(text){return text?text[0].toUpperCase()+text.slice(1):text;}
function freeHours272(){return Math.floor(capacity()-totalHours());}
function monthsLeft272(t){return Math.max(1,Math.ceil((t.duration||0)-(t.progress||0)));}

// Часов в расписании: сколько не хватает.
function hoursWhy272(need){
 const free=freeHours272();
 if(free>=need)return '';
 return 'Не хватает '+(need-free)+' ч/нед. в расписании: свободно '+Math.max(0,free)+' из нужных '+need+
  (free<0?', план и так больше доступного на '+(-free)+' ч':'');
}

// Пороги teachingProfile194 с текущими значениями.
function teachingWhy272(track){
 const w=portfolio47(track),out=[];
 if(w.count<3)out.push('работы в портфолио: нужно 3, сейчас '+w.count);
 if(w.quality<60)out.push('качество лучших работ: нужно от 60, сейчас '+Math.floor(w.quality)+'/100');
 if(profileScore46(track)<55)out.push('навык направления: нужно от 55, сейчас '+Math.floor(profileScore46(track))+'/100');
 return out.length?capital272(out.join('; ')):'';
}

// Право на работу из creativeRights47; про часы — с цифрами.
function rightsWhy272(track,hours){
 const why=creativeRights47({country:s.country,track,hours}).filter(x=>!/с 18 лет/.test(x));
 if(!why.length)return '';
 const r=rights31(s.country,{profession:creativeRoles47[track]});
 const busy=(s.job?(s.workHours??40):0)+creativeTasks47().filter(t=>t.offer47).reduce((n,t)=>n+t.hours,0);
 return why.map(x=>!/рабочих часов/.test(x)?x:r.reside?'По документам можно работать до '+r.hours+' ч/нед.: работа и заказы уже занимают '+busy+
  ', занятия добавят '+hours:'Нет документов, которые дают право работать в этой стране').join('; ');
}

function mentoringTask272(){return s.clock.tasks.find(t=>t.kind==='mentoring194'&&!['completed','cancelled'].includes(t.state));}
function courseTask272(){return s.clock.tasks.find(t=>t.kind==='course195'&&!['completed','cancelled'].includes(t.state));}
function practiceTask272(track){return s.clock.tasks.find(t=>t.kind==='profilePractice46'&&t.track===track&&!['completed','cancelled'].includes(t.state));}
function mentorFee272(){return Math.round(c().cost*.004);}
function classOffer272(){
 const offer=mentoring194().offer;
 return offer?.status==='offered'&&offer.ends>s.clock.ticks&&offer.country===s.country?offer:null;
}

// Причина, по которой planMentoring194 сейчас не сработает; '' — можно. Для 'learn' направление не важно.
function mentoringWhy272(track,role,key=null){
 if(!s||s.dead)return 'Сейчас недоступно';
 if(track&&!formats47[track]||key&&!specialties184[track]?.[key])return 'Для этого направления занятий нет';
 const min=role==='learn'?16:18;
 if(s.age<min)return 'С '+min+' лет';
 if(role==='class'){
  const offer=classOffer272();
  if(!offer)return 'Приглашения провести мастер-класс пока нет: его присылают после законченной работы с качеством от 68';
  if(offer.track!==track)return 'Приглашение пришло по другому направлению: «'+trackNames46[offer.track]+'»';
  if(!living(offer.host))return 'Пригласивший человек больше не может провести встречу';
 }
 if(role!=='learn'){const why=teachingWhy272(track);if(why)return why;}
 const busy=mentoringTask272();
 if(busy)return busy.state==='planned'?'Уже запланированы занятия «'+busy.label+'»':'Уже идут занятия «'+busy.label+'», ещё '+monthsLeft272(busy)+' мес.';
 const hours=role==='class'?4:2;
 const short=hoursWhy272(hours);if(short)return short;
 if(role!=='learn'){const why=rightsWhy272(track,hours);if(why)return why;}
 return '';
}
// Оплата наставника списывается в начале занятий, а не сейчас: не блокируем, а предупреждаем.
function mentorFeeHint272(){
 const fee=mentorFee272(),have=expenseAvailable231();
 return money(fee)+(have<fee?' · сейчас доступно '+money(Math.max(0,have))+': если к началу занятий денег не хватит, их отменят':'');
}

// Причина, по которой planCourse195 сейчас не сработает; '' — можно.
function courseWhy272(track,own){
 if(!s||s.dead)return 'Сейчас недоступно';
 if(!formats47[track])return 'Для этого направления курсов нет';
 if(s.age<18)return 'С 18 лет';
 const teach=teachingWhy272(track);if(teach)return teach;
 const offer=courses195().contract;
 if(own){const p=Math.floor(mentoring194().pedagogy);if(p<12)return 'Педагогическое мастерство: нужно от 12, сейчас '+p+'/100';}
 else if(!offer||offer.status!=='available')return 'Предложения от учебного центра пока нет';
 else if(offer.expires<=s.clock.ticks)return 'Срок ответа на предложение истёк';
 else if(offer.country!==s.country)return 'Предложение из другой страны: нужно быть там';
 else if(offer.track!==track)return 'Предложение по другому направлению: «'+trackNames46[offer.track]+'»';
 const busy=courseTask272();
 if(busy)return (busy.state==='planned'?'Уже запланирован курс «':'Уже идёт курс «')+busy.label+'»';
 const terms=courseTerms195(own,offer);
 const why=hoursWhy272(terms.hours)||rightsWhy272(track,terms.hours);
 if(why||!terms.cost)return why;
 const have=Math.max(0,s.cash);
 return have<terms.cost?'Не хватает денег на подготовку курса: нужно '+money(terms.cost)+', на счету '+money(have):'';
}

function practiceWhy272(track){
 if(!s||s.dead)return 'Сейчас недоступно';
 if(s.age<16)return 'С 16 лет';
 const t=practiceTask272(track);
 if(t)return t.state==='planned'?'Практика уже запланирована':'Практика уже идёт, ещё '+monthsLeft272(t)+' мес.';
 if(profileScore46(track)>=100)return 'Навык уже 100/100: практика ничего не добавит';
 return '';
}
// Практику можно запланировать и без свободных часов, но тогда все планы пойдут медленнее.
function practiceHint272(){
 const free=freeHours272();
 return '3 мес. · 4 ч/нед. · до +10 к навыку'+(free<4?' · свободно '+Math.max(0,free)+' ч/нед.: планы перегрузятся и пойдут медленнее':'');
}

// Человек для занятий, когда круг направления пуст.
const trackHobby272={literature:'literature',publishing:'literature',translation:'literature',journalism:'literature',finearts:'art',cinema:'film',theatre:'theatre',music:'music'};
function mentoringNewcomer272(sc,track,kind){
 const rec=circleRecord48(sc),city=sc.city||residenceCity(),student=kind==='student';
 const hi=Math.min(35,Math.max(16,s.age-2)),lo=Math.min(hi,s.age>=25?18:16);
 const p=socialPerson115('Знакомый',student?rnd(lo,hi):Math.max(30,s.age+rnd(6,16)),sc.country,city,student?'local':'work');
 if(cities[sc.country]?.includes(city))p.city18=city;
 s.people.push(p);enrichPerson(p);
 p.bond=35;p.inner.affection=35;p.inner.trust=40;p.lastBond=35;
 p.contexts48={[sc.key]:student?'student':'mentor'};
 p.occupation=student?'Учится у вас · '+trackNames46[track]:'Опытный специалист · '+sc.title;
 p.careerVariety=true;
 if(student){
  const hobby=trackHobby272[track];
  if(hobbies[hobby])p.interests18=[hobby];
  p.student272={track,since:s.clock.ticks};
 }
 rec.roster.push(p.id);rec.lastNew=s.clock.ticks;
 circleHistory48('Познакомились: '+sc.title,p);
 return p;
}
function mentoringPerson272(sc,track,role,base){
 if(role==='learn')return base(sc,true)||mentoringNewcomer272(sc,track,'mentor');
 const members=circleRecord48(sc).roster.map(id=>living(id)).filter(p=>p&&p.contexts48?.[sc.key]!=='mentor');
 const own=members.find(p=>p.contexts48?.[sc.key]==='student');
 if(own)return own;
 if(members.length){const p=base(sc,false);return p&&p.contexts48?.[sc.key]!=='mentor'?p:members[circleRecord48(sc).meetings%members.length];}
 return mentoringNewcomer272(sc,track,'student');
}

planMentoring194=function(track,role,key=null,...rest){
 if(role==='class'||!formats47[track])return learningBase272.planMentoring194.call(this,track,role,key,...rest);
 const scope=mentoringScope194(track,key),base=circleMember48;
 circleMember48=function(sc,mentor=false,...more){
  if(sc?.key!==scope.key)return base.call(this,sc,mentor,...more);
  return mentoringPerson272(sc,track,role,(x,m)=>base.call(this,x,m,...more));
 };
 try{return learningBase272.planMentoring194.call(this,track,role,key,...rest);}
 finally{circleMember48=base;}
};

function startMentoring272(track,role,key=null){
 const why=mentoringWhy272(track,role,key);
 if(why){toast(why+'.');return false;}
 if(!planMentoring194(track,role,key)){toast('Не получилось договориться о занятиях. Попробуйте в следующем месяце.');return false;}
 const t=mentoringTask272(),p=t&&living(t.person194);
 toast((t?.label||'Занятия запланированы')+(p?' — '+p.name:'')+'. '+(role==='class'?'Один месяц, 4 ч/нед.':'Три месяца по 2 ч/нед.'));
 return true;
}

// Выбор специализации: причина на виду, тост — с причиной. back — куда вернуться.
chooseMentorSpecialty195=function(track,role,back=null){
 const why=mentoringWhy272(track,role);
 const options=[[null,trackNames46[track]],...Object.entries(specialties184[track]||{})];
 const title={learn:'Найти наставника',teach:'Взять ученика'}[role]||'Специализация';
 const terms=role==='learn'?'Три месяца по 2 ч/нед. · '+mentorFeeHint272()+'.':'Три месяца по 2 ч/нед.';
 show(title+' · '+trackNames46[track],why?why+'.':terms+' Выберите, чем будете заниматься.',[
  ...options.map(([key,label])=>({label,disabled:!!why,fn:()=>startMentoring272(track,role,key)})),
  {label:'Назад',fn:back||mentoringMenu194}
 ]);
};

function mentorTracks272(){return Object.keys(formats47).filter(track=>ownedPortfolios60().includes(track)||profileScore46(track)>0);}
function teachTracks272(){return Object.keys(formats47).filter(track=>ownedPortfolios60().includes(track)||teachingProfile194(track));}
function noTeachTrack272(){return s.age<18?'С 18 лет':'Нужно портфолио направления: от 3 работ, качество от 60, навык от 55';}

mentoringMenu194=function(){
 const state=mentoring194(),offer=classOffer272(),tracks=mentorTracks272(),teach=teachTracks272();
 const learnWhy=mentoringWhy272(null,'learn'),classWhy=offer?mentoringWhy272(offer.track,'class'):'';
 show('Менторство и мастер-классы','Педагогическое мастерство · '+state.pedagogy+'/100',[
  ...(offer?[{label:'Провести мастер-класс · '+trackNames46[offer.track],hint:classWhy||money(offer.fee)+' · 1 мес. · 4 ч/нед.',
    disabled:!!classWhy,fn:()=>startMentoring272(offer.track,'class')},
   {label:'Отклонить приглашение',fn:()=>{offer.status='declined';save();mentoringMenu194();}}]:[]),
  {label:'Найти наставника',hint:learnWhy||'Три месяца · 2 ч/нед. · '+mentorFeeHint272(),disabled:!!learnWhy,
   fn:()=>show('Выбрать направление','Три месяца · 2 ч/нед. · '+mentorFeeHint272(),
    (tracks.length?tracks:Object.keys(formats47)).map(track=>({label:trackNames46[track],fn:()=>chooseMentorSpecialty195(track,'learn')})))},
  ...(teach.length?teach.map(track=>{const why=mentoringWhy272(track,'teach');
    return {label:'Взять ученика · '+trackNames46[track],hint:why||'3 мес. · 2 ч/нед.',disabled:!!why,fn:()=>chooseMentorSpecialty195(track,'teach')};}):
   [{label:'Взять ученика',hint:noTeachTrack272(),disabled:true,fn:()=>{}}]),
  ...(typeof courseMenu195==='function'?[{label:'Курсы и контракты',fn:courseMenu195}]:[]),
  {label:'История занятий',fn:()=>show('История занятий',state.history.slice().reverse().map(item=>
   (specialties184[item.track]?.[item.key195]||trackNames46[item.track])+' · '+(s.people.find(p=>p.id===item.person)?.name||'Участник')+' · '+(item.success?'с прогрессом':'занятие состоялось')).join('\n')||'Пока пусто.',[])}
 ]);
};

courseMenu195=function(){
 const state=courses195(),offer=state.contract,ped=mentoring194().pedagogy;
 const available=offer?.status==='available'&&offer.expires>s.clock.ticks&&offer.country===s.country;
 const plan=(track,title,own,key)=>{
  const why=courseWhy272(track,own);
  if(why)return toast(why+'.');
  if(!planCourse195(track,title,own,key))return toast('Курс не получилось запланировать. Попробуйте в следующем месяце.');
  const t=courseTask272(),terms=courseTerms195(own,offer);
  toast((t?.label||'Курс')+' — '+terms.months+' мес. по '+terms.hours+' ч/нед.');
 };
 const contractWhy=available?courseWhy272(offer.track,false):'';
 show('Курсы и контракты','Педагогическое мастерство · '+ped+'/100',[
  ...(available?[{label:'Контракт · '+(specialties184[offer.track]?.[offer.key]||trackNames46[offer.track]),
   hint:contractWhy||'3 мес. · 5 ч/нед. · '+money(offer.fee),disabled:!!contractWhy,fn:()=>plan(offer.track,'',false,offer.key)},
   {label:'Отказаться от контракта',fn:()=>{offer.status='declined';save();courseMenu195();}}]:
   [{label:'Контракт с учебным центром',hint:'Предложения пока нет: учебные центры зовут после удачных занятий с учениками',disabled:true,fn:()=>{}}]),
  ...(teachTracks272().length?teachTracks272():[null]).map(track=>{
   const why=track?courseWhy272(track,true):noTeachTrack272(),terms=courseTerms195(true);
   return {label:'Авторский курс'+(track?' · '+trackNames46[track]:''),hint:why||'4 мес. · 6 ч/нед. · подготовка '+money(terms.cost),disabled:!!why,fn:()=>{
    show('Авторский курс','4 мес. · 6 ч/нед. · подготовка '+money(terms.cost)+'. Доход зависит от числа участников, дошедших до конца.',
     [{label:'Запустить курс',fn:()=>plan(track,$('#courseTitle195')?.value||'',true)},
      {label:'Назад',fn:courseMenu195}]);
    petInsert38('<label class="field">Название<input id="courseTitle195" maxlength="80"></label>');
   }};
  }),
  ...(typeof schoolOpening196==='function'?[{label:'Открыть профессиональную школу',hint:schoolBlock196(),disabled:!!schoolBlock196(),fn:schoolOpening196}]:[]),
  {label:'Завершённые курсы · '+state.history.length,fn:()=>show('Завершённые курсы',
   state.history.slice().reverse().map(r=>r.title+' · '+r.graduated+'/'+r.enrolled+
   ' выпускников · +'+r.learned+' баллов подготовки · '+money(r.paid-r.cost)+' после расходов').join('\n')||'Пока пусто.',[])}
 ]);
};

// Каталог программ: центр, а на телефоне — переключение на центральную панель и прокрутка к каталогу.
function learningLevel272(track){return hasDiploma16(trackField46(track),'bachelor')?'master':'bachelor';}
function learningScroll272(){
 const panel=document.querySelector('[data-panel="center"]');
 const head=panel?.querySelector('.trajectory h1');
 if(!panel||!head)return;
 panel.scrollTop=0;
 const box=panel.getBoundingClientRect(),bottom=Math.min(box.bottom,innerHeight);
 if(head.getBoundingClientRect().bottom>bottom)panel.scrollTop=head.getBoundingClientRect().top-box.top-8;
 const r=head.getBoundingClientRect();
 if(r.top<0||r.bottom>innerHeight)scrollBy(0,r.top-Math.min(80,innerHeight/5));
}
function learningCatalog272(track,level){
 profileEducation46(track,level);
 if(s?.ui05&&s.ui05.panel!=='center'){s.ui05.panel='center';render();}
 setTimeout(learningScroll272,0);
}

function learningMenu272(track){
 if(!s||!formats47[track])return;
 const w=portfolio47(track),state=mentoring194(),offer=classOffer272();
 const back=()=>learningMenu272(track),practice=practiceTask272(track),busy=mentoringTask272(),course=courseTask272();
 const now=[practice&&'практика, ещё '+monthsLeft272(practice)+' мес.',busy&&busy.label,course&&course.label].filter(Boolean);
 const text='Навык '+Math.floor(profileScore46(track))+'/100 · работ: '+w.count+' · качество лучших трёх: '+Math.floor(w.quality)+'/100\n'+
  'Педагогическое мастерство: '+Math.floor(state.pedagogy)+'/100 · свободно в расписании: '+Math.max(0,freeHours272())+' ч/нед.'+
  (now.length?'\nСейчас: '+now.join(', ')+'.':'');
 const practiceWhy=practiceWhy272(track),learnWhy=mentoringWhy272(track,'learn'),teachWhy=mentoringWhy272(track,'teach');
 const classWhy=mentoringWhy272(track,'class'),host=offer&&living(offer.host);
 const contract=courses195().contract,contractHere=contract?.status==='available'&&contract.expires>s.clock.ticks&&contract.country===s.country;
 const level=learningLevel272(track);
 show('Обучение и практика · '+trackNames46[track],text,[
  {label:'Запланировать практику',hint:practiceWhy||practiceHint272(),disabled:!!practiceWhy,fn:()=>{
   const why=practiceWhy272(track);
   if(why)return toast(why+'.');
   if(practiceProfile46(track))toast('Практика · '+trackNames46[track]+' — три месяца по 4 ч/нед.');
  }},
  {label:'Найти наставника',hint:learnWhy||'3 мес. · 2 ч/нед. · '+mentorFeeHint272(),disabled:!!learnWhy,fn:()=>chooseMentorSpecialty195(track,'learn',back)},
  {label:'Взять ученика',hint:teachWhy||'3 мес. · 2 ч/нед.',disabled:!!teachWhy,fn:()=>chooseMentorSpecialty195(track,'teach',back)},
  {label:'Провести мастер-класс',hint:classWhy||(host?'Приглашение: '+host.name+' · ':'')+money(offer.fee)+' · 1 мес. · 4 ч/нед.',disabled:!!classWhy,
   fn:()=>startMentoring272(track,'class')},
  {label:'Курсы и контракты',hint:contractHere?'Есть предложение вести курс':course?(course.state==='planned'?'Запланирован курс «':'Идёт курс «')+course.label+'»':'Контракт учебного центра или свой курс',fn:courseMenu195},
  {label:'Подготовительный сертификат',hint:'Дополнительное образование по профилю · откроется каталог программ',fn:()=>learningCatalog272(track,'certificate')},
  {label:'Программы обучения',hint:levels16[level]+' по профилю · откроется каталог программ',fn:()=>learningCatalog272(track,level)},
  {label:'Назад',fn:()=>creativeTrackMenu47(track)}
 ]);
}

// Портфолио: «Обучение и практика» открывает окно направления, а не каталог.
creativeTrackMenu47=function(track,...args){
 const showBase=show;
 show=function(title,text,opts=[],...rest){
  show=showBase;
  return showBase.call(this,title,text,(opts||[]).map(o=>o?.label==='Обучение и практика'?
   {...o,hint:'Практика, наставник, ученики, курсы и программы',fn:()=>learningMenu272(track)}:o),...rest);
 };
 try{return learningBase272.creativeTrackMenu47.call(this,track,...args);}
 finally{show=showBase;}
};

// Карточка человека: ученик подписан учеником, а не «учебной группой».
personSections42=function(p,...rest){
 const out=learningBase272.personSections42.call(this,p,...rest);
 const links=Object.entries(p?.contexts48||{});
 if(!links.some(([,role])=>role==='student'))return out;
 const section=out?.find?.(x=>x.title==='Где пересекались');
 if(section)section.rows=section.rows.map((row,i)=>links[i]?.[1]==='student'?fact20(p.gender==='f'?'Ваша ученица':'Ваш ученик',row.value):row);
 return out;
};
