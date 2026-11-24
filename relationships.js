'use strict';
const relationsBase={action,autonomousMonth,show,resolvePending,activitiesView};
function ensureRelations(){s.familyLife??={lastContact:s.clock.ticks,contactIndex:0,contraception:true,birth:null,affair:null};}
function jobComparison(job){const old=s.job,route=j=>j?.workplace&&s.housing?(j.workplace.city===s.housing.city?(j.workplace.area===s.housing.area?20:55):120):null;return `\n\nСейчас: ${old?old.title+' · '+money(old.salary)+'/год · '+(s.workHours||40)+' ч/нед.':'нет постоянной работы'}.\nПредложение: ${job.title} · ${money(job.salary)}/год · 40 ч/нед.${old?' Разница дохода: '+money(job.salary-old.salary)+'/год.':''}${route(job)!==null?' Дорога: '+(old?commuteMinutes()+' → ':'')+route(job)+' мин. в одну сторону.':' Расположение рабочего места пока не уточнено.'} Принятие заменит нынешнюю работу.`}
show=function(title,text,opts=[]){if(title==='Принять предложение?'&&s.pending[0]?.type==='offer')text+=jobComparison(s.pending[0].job);relationsBase.show(title,text,opts)};
function romanceMenu(){ensureRelations();const p=currentPartner(),ex=s.people.filter(x=>x.alive&&x.age>=18&&x.role==='Бывший партнер');show('Отношения и личная жизнь','Решения другого человека зависят от интереса, доверия и вашей общей истории.',[
 {label:'Знакомства и свидания',fn:()=>relationsBase.action('date')},
 ...(p?[{label:p.married?'Обсудить развод · '+p.name:'Предложить брак · '+p.name,fn:()=>marriageDialog(p.id)},{label:'Закончить романтические отношения',fn:()=>breakup(p.id)}]:[]),
 ...ex.map(x=>({label:'Попробовать снова · '+x.name,disabled:!!p,fn:()=>reconcile(x.id)})),
 ...s.people.filter(x=>x.alive&&x.married&&x.id!==p?.id).map(x=>({label:'Развестись · '+x.name,fn:()=>marriageDialog(x.id)})),
 {label:p?'Связь на стороне':'Близость без отношений',fn:casualMenu},
 {label:'Дети и репродуктивные решения',fn:childrenMenu}
 ])}
function reconcile(id){const p=living(id);if(!p||currentPartner())return;show('Начать заново · '+p.name,'Прошлое не обнулится. Можно предложить вернуться, но согласие не гарантировано.',[{label:'Предложить попробовать снова',fn:()=>{if(p.inner.trust<35||p.inner.strain>65||p.reunionAfter>s.clock.ticks){p.reunionAfter=s.clock.ticks+12;log('Вернуться пока не получается',p.name+': предложение не принято. Нужно уважать этот ответ; вернуться к разговору можно не раньше чем через год.','Отношения');return}p.role='Партнер';p.partnerSince=s.year;p.rejected=false;rel(p,{affection:5});remember(p,'решили попробовать отношения снова');log('Вторая попытка',p.name+': вы снова вместе. Старые воспоминания, доверие и напряжение сохраняются.','Отношения',true)}},{label:'Не сейчас',fn:()=>{}}])}
function marriageDialog(id){const p=living(id);if(!p)return;if(p.married)return show('Развод · '+p.name,'Романтические отношения и совместное жилье — отдельные решения. Здесь заканчивается брак. Юридическое разделение имущества в этой версии не моделируется.',[{label:'Развестись',fn:()=>{const finish=()=>{if(!p.married||s.dead)return;p.married=false;p.divorced=true;rel(p,{strain:8});if(typeof reviewFamilyPermit174==='function')reviewFamilyPermit174(p);log('Брак завершен',p.name+': развод оформлен. Жилье и отношения можно пересмотреть отдельно.','Семья',true)};if(typeof divorceName256==='function')return divorceName256(p,finish);finish();}},...(typeof petSeparationOptions183==='function'?petSeparationOptions183(p):[]),{label:'Отмена',fn:()=>{}}]);show('Предложить брак · '+p.name,'Нужны взаимное доверие и готовность. Брак не означает автоматический переезд или согласие на детей.',[{label:'Сделать предложение',disabled:s.people.some(x=>x.married),fn:()=>{if(p.inner.trust<60||p.inner.strain>45){log('Ответ — пока нет',p.name+' не готов к браку. Отношения могут продолжаться.','Отношения');return}const finish=surname=>{
 if(s.dead||!p.alive||!currentPartner()||currentPartner().id!==p.id||s.people.some(person=>person.married))return;
 if(surname)s.surname=surname;
 p.married=true;
 remember(p,'вы заключили брак');
 log('Теперь в браке',p.name+': вы договорились о браке.'+(surname?' Ваша фамилия теперь '+surname+'.':''),'Семья',true);
};
if(typeof marriageNameOptions256==='function')return marriageNameOptions256(p,finish);
if(s.gender!=='f')return finish();
const surname=p.surname||identitySurname(p.birthCountry||p.country,p.gender);
show('Фамилия после свадьбы','Какую фамилию оставить в документах?',[
 {label:'Оставить свою · '+s.surname,fn:()=>{p.surname??=surname;finish();}},
 {label:'Взять фамилию партнёра · '+surname,fn:()=>{p.surname??=surname;finish(surname);}}
]);}},{label:'Отмена',fn:()=>{}}])}
function casualMenu(){const partner=currentPartner();show(partner?'Связь на стороне':'Близость без обещания отношений','Только взрослые и взаимный интерес. Романтические отношения автоматически не начинаются. Возможны беременность и последствия для доверия.',s.people.filter(p=>p.alive&&p.age>=18&&['Друг','Знакомство','Знакомый','Бывший партнер'].includes(p.role)&&p.id!==partner?.id&&compatible(p)&&p.orientation!=='ace'&&s.orientation!=='ace').map(p=>({label:p.name,hidden:s.age<18,disabled:s.age<18,fn:()=>{if(p.inner.affection<45){log('Интерес не совпал',p.name+' не хочет такой близости.','Отношения');return}log(partner?'Секрет между вами':'Без романтического обещания',p.name+': вы проводите ночь вместе, не договариваясь о паре.','Личная жизнь',true);if(partner)s.familyLife.affair={partnerId:partner.id,otherId:p.id,due:s.clock.ticks+3};pregnancyChance(p,true)}})))}
function childrenMenu(){ensureRelations();const p=currentPartner(),f=s.familyLife;show('Дети','Можно начать путь без многоэтапного плана и без романтической пары. Сроки условные игровые; согласие другого человека обязательно. Любовь не является условием родительства.',[
 {label:'Начать усыновление самостоятельно',hint:'Условный маршрут: 12 месяцев · '+money(c().cost*.1),hidden:s.age<21,disabled:s.age<21||!!f.birth||!!s.flags.childPending||expenseAvailable231()<c().cost*.1,fn:()=>{if(!spend231(c().cost*.1,'relationships'))return;startBirth(null,'adoption')}},
 {label:f.contraception?'Контрацепция: используется':'Контрацепция: не используется',hint:'Влияет на вероятность незапланированной беременности',fn:()=>{f.contraception=!f.contraception;log('Репродуктивное решение',f.contraception?'Вы выбираете контрацепцию. Игровой риск существенно ниже, но не нулевой.':'Вы отказываетесь от контрацепции; риск незапланированной беременности выше.','Личная жизнь')}}
 ])}
function startBirth(id,method){if(s.familyLife.birth||s.flags.childPending)return;s.familyLife.birth={parentId:id,method,due:s.clock.ticks+(method==='adoption'?12:9)};log(method==='adoption'?'Заявка на усыновление':'Беременность подтверждена',method==='adoption'?'Начинается условный годовой маршрут. Романтический партнер не требуется.':'Ожидается ребёнок примерно через девять игровых месяцев. Отношения между взрослыми не меняются автоматически.','Родительство',true)}
function pregnancyChance(p,explicit=false){const f=s.familyLife;if(f.birth||s.flags.childPending||s.pending.some(q=>q.type==='unexpectedPregnancy')||s.age<18||p.age<18||p.gender===s.gender||(s.gender==='f'?s.age:p.age)>=45)return;if(chance(f.contraception?(explicit?.02:.003):(explicit?.3:.06))){queueOnce({type:'unexpectedPregnancy',id:p.id});log('Неожиданная беременность',s.gender==='f'?'Вы узнаёте о беременности. Нужно решить, как поступить.':p.name+' сообщает о беременности. Решение о вынашивании принимает этот человек.','Семья',true)}}
resolvePending=function(){const q=s.pending[0];if(q?.type==='unexpectedPregnancy'){const p=living(q.id);if(!p){s.pending.shift();return}if(s.gender==='f')return show('Беременность не была запланирована','Можно продолжить беременность или прервать её. Романтическая пара не является обязательным условием.',[{label:'Продолжить беременность',fn:()=>{s.pending.shift();startBirth(p.id,'birth')}},{label:'Прервать беременность',fn:()=>{s.pending.shift();log('Решение принято','Вы обращаетесь за медицинской помощью для прерывания беременности. Процедура и правовые ограничения в этой модели не детализируются.','Здоровье')}}]);return show('Разговор о беременности · '+p.name,p.childrenWish==='no'?'Человек решил не продолжать беременность.':'Человек решил продолжить беременность. Вы можете обсудить участие без романтических обещаний.',[{label:p.childrenWish==='no'?'Принять решение':'Участвовать в родительстве',fn:()=>{s.pending.shift();if(p.childrenWish!=='no')startBirth(p.id,'birth');else log('Решение другого человека',p.name+': беременность не продолжается.','Семья')}},{label:'Обсудить отдельное проживание',disabled:p.childrenWish==='no',fn:()=>{s.pending.shift();startBirth(p.id,'birth');log('Родители без пары','Вы сохраняете отдельные адреса. Участие и расходы на ребёнка учитываются; романтические отношения не начинаются.','Семья')}}])}return relationsBase.resolvePending()};
action=function(k){ensureRelations();if(k==='date'&&s.age>=18)return romanceMenu();if(k==='family'&&s.age>=18)return show('Близкие и семья','Общение с семьей и родительство доступны отдельно.',[{label:'Провести время с близкими',fn:()=>pickContact('visit')},{label:'Дети и репродуктивные решения',fn:childrenMenu},...(typeof childEducationMenu==='function'?[{label:'Оплачивать учёбу детей',fn:childEducationMenu}]:[]),{label:'Помощь и семейные разговоры',fn:()=>relationsBase.action('family')}]);return relationsBase.action(k)};
autonomousMonth=function(){ensureRelations();const before=new Set(s.pending);relationsBase.autonomousMonth();if(s.pending.some(q=>q.type==='offer'&&!before.has(q)))s.lastJobOfferTick=s.clock.ticks;const f=s.familyLife;if(f.birth&&s.clock.ticks>=f.birth.due){const b=f.birth;f.birth=null;const child=person('Ребенок',b.method==='adoption'?rnd(1,4):0);child.parentId=b.parentId;child.adopted49=b.method==='adoption';child.birth49={method:b.method,parents:b.method==='adoption'?[]:['player',b.parentId].filter(Boolean)};if(b.method==='birth'&&typeof childBirthIdentity166==='function')childBirthIdentity166(child,[s,living(b.parentId)].filter(Boolean));child.bond=75;s.people.push(child);enrichPerson(child);log(child.name+' дома',b.method==='adoption'?'Вы стали семьей. Привыкание друг к другу займет время.':'Начались дни с новым человеком: сон, кормления и совершенно другой распорядок.','Семья',true)}const p=currentPartner();if(p&&p.country===s.country&&s.orientation!=='ace'&&p.orientation!=='ace'&&!s.pending.length)pregnancyChance(p);resolveAffairConsequences63(f);if(typeof familyEvents05==='function')familyEvents05();};
activitiesView=function(){ensureRelations();const b=s.familyLife.birth;return relationsBase.activitiesView()+(b?`<section class="activity-box"><h3>${b.method==='adoption'?'Ожидание усыновления':'Ожидание ребёнка'}</h3><p>Около ${Math.max(0,b.due-s.clock.ticks)} мес.</p></section>`:'')};

function savedSideRelationships63(f){
  return f?.sideRelationships63??(f?.sideRelationship63?[f.sideRelationship63]:[]);
}

function resolveAffairConsequences63(f){
  const pending=f.sideDiscoveries63||[];
  const due=pending.filter(item=>item.due<=s.clock.ticks);
  if(due.length)f.sideDiscoveries63=pending.filter(item=>item.due>s.clock.ticks);
  const affair=f.affair;
  if(affair&&(affair.due<=s.clock.ticks||due.some(item=>item.partnerId===affair.partnerId&&item.otherId===affair.otherId))){
    f.affair=null;
    due.push(affair);
  }
  const relationships=savedSideRelationships63(f);
  const reported=new Set();
  for(const item of due){
    const side=relationships.find(link=>link.partnerId===item.partnerId&&link.otherId===item.otherId);
    const partner=living(item.partnerId);
    if(!partner||side?.discovered)continue;
    if(side)side.discovered=true;
    f.sideDiscoveries63=f.sideDiscoveries63?.filter(other=>other.partnerId!==item.partnerId||other.otherId!==item.otherId);
    if(reported.has(item.partnerId))continue;
    reported.add(item.partnerId);
    rel(partner,{trust:-30,strain:30});
    remember(partner,'стало известно о связи на стороне');
    log('Секрет перестал быть секретом',partner.name+' узнаёт о связи на стороне. Доверие резко падает; продолжение отношений теперь под вопросом.','Последствие',true);
  }
}
