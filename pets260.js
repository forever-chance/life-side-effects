'use strict';
// Сборка 260, слой 2: питомцы — то, что уже происходит, становится видно.
// - смерть питомца дома: окно с прощанием вместо строки в ленте, память у близких;
// - смерть питомца не дома: звонит тот, у кого он жил (раньше — полная тишина);
// - питомцы близких людей: запись в ленте и возможность написать;
// - помёт: окно при рождении и когда малыши подросли;
// - просьба ребёнка о питомце: родитель учитывает животных, которые уже живут дома.

function petFemale260(p){return p?.sex38==='f';}
function petVerb260(p,m,f){return petFemale260(p)?f:m;}

function petLife260(p){
 const y=Math.floor((p.months||0)/12);
 return y>=1?'в '+years(y):'совсем '+petVerb260(p,'маленьким','маленькой');
}

function petDetail260(p){
 if(p.trait){
  const t=String(p.trait).trim().replace(/[.!]+$/,'');
  return `Дома все знали: ${p.name} ${t[0].toLowerCase()+t.slice(1)}.`;
 }
 const note=(p.notes||[]).find(n=>!/Жизнь закончилась/.test(n));
 return note||'';
}

function petHousemates260(){
 return s.people.filter(p=>p.alive&&childLocal55(p)&&
  (p.role==='Партнер'&&p.cohabit||['Ребенок','Сын','Дочь'].includes(p.role)&&p.age<25||
   s.age<18&&['Мать','Отец','Брат','Сестра'].includes(p.role)));
}

// Перехватываем смерть до petMonth: он сам отметил бы её одной строкой «Тихий дом».
const petMonthBase260=petMonth;
petMonth=function(...args){
 const dying=[];
 for(const p of s.pets||[]){
  if(!p.alive||(p.months||0)+1<p.life)continue;
  const home=typeof petAtHome183!=='function'||petAtHome183(p);
  const keeper=typeof petHousehold183==='function'?petHousehold183(p).keeper:'player';
  p.months++;
  p.alive=false;
  p.notes.push('Жизнь закончилась в '+s.year+' году.');
  dying.push({p,home,keeper});
 }
 const out=petMonthBase260.apply(this,args);
 for(const d of dying)petDeath260(d);
 return out;
};

function petDeath260({p,home,keeper}){
 if(home){
  s.mood=clamp(s.mood-12);
  for(const person of petHousemates260())remember(person,`Не стало ${p.kind==='dog'?'собаки':p.kind==='cat'?'кошки':'кролика'} по кличке ${p.name}`);
  s.pending.push({type:'petFarewell260',petId:p.id});
  return;
 }
 const person=keeper!=='player'?living(keeper):null;
 s.mood=clamp(s.mood-6);
 if(person){
  s.pending.push({type:'petNews260',petId:p.id,personId:person.id});
 }else{
  log('Сообщение о питомце',`Приходит сообщение: ${p.name} ${petVerb260(p,'умер','умерла')} ${petLife260(p)}. Последнее время ${petVerb260(p,'он','она')} жил${petVerb260(p,'','а')} не с вами.`,'Утрата',true);
 }
}

function petFarewellOptions260(p){
 const fee=Math.max(1,Math.round(c().cost*.004));
 const house=(s.properties||[]).some(q=>q.kind==='house'&&q.country===s.country);
 const done=(note,title,text)=>{
  s.pending.shift();
  p.notes.push(note);
  p.farewell260=title;
  log(title,text,'Утрата',true);
  save();render();
  if(s.pending.length)resolvePending();
 };
 return [
  ...(house?[{label:'Похоронить у дома',hint:'Бесплатно · место, куда можно прийти',fn:()=>done('Похоронен'+petVerb260(p,'','а')+' во дворе у дома.','Прощание',`Вы выбираете место под деревом во дворе. ${p.name} теперь всегда рядом с домом.`)}]:[]),
  {label:'Кремировать и забрать прах',hint:money(fee)+' · урна останется дома',disabled:expenseAvailable231()<fee,fn:()=>{
   if(!spend231(fee,'Кремация: '+p.name,'pet260:'+p.id))return;
   done('Прах дома.','Прощание',`Через неделю из клиники отдают маленькую урну. Вы ставите её туда, где ${p.name} любил${petVerb260(p,'','а')} лежать.`);
  }},
  {label:'Оставить в клинике',hint:'Бесплатно',fn:()=>done('Остал'+petVerb260(p,'ся','ась')+' в клинике.','Прощание',`Вы подписываете бумаги и забираете домой пустую переноску. Ошейник оставляете себе.`)}
 ];
}

function petFarewell260(q){
 const p=s.pets.find(x=>x.id===q.petId);
 if(!p){s.pending.shift();return resolvePending();}
 const together=(p.withYou||0)>=12?` Вместе вы прожили ${years(Math.floor(p.withYou/12))}.`:'';
 show(p.name,`${p.name} ${petVerb260(p,'умер','умерла')} ${petLife260(p)}.${together} ${petDetail260(p)}\nВ доме непривычно тихо.`,petFarewellOptions260(p));
}

function petNews260(q){
 const p=s.pets.find(x=>x.id===q.petId),person=living(q.personId);
 if(!p||!person){s.pending.shift();return resolvePending();}
 const near=childLocal55(person);
 const done=(text,delta)=>{
  s.pending.shift();
  if(delta)rel(person,delta);
  log('Звонок',text,'Утрата',true);
  save();render();
  if(s.pending.length)resolvePending();
 };
 show('Звонит '+person.name,`${person.name}: «${p.name} ${petVerb260(p,'умер','умерла')}. Тихо, во сне. Я подумал${person.gender==='f'?'а':''}, тебе надо знать».`,[
  ...(near?[{label:'Приехать',hint:'Заметно ближе · общее воспоминание',fn:()=>{remember(person,'Вы приехали, когда умер'+petVerb260(p,'','а')+' '+p.name);done(`Вы приезжаете в тот же вечер. ${person.name} ставит чайник, и вы долго вспоминаете, каким ${p.name} был${petVerb260(p,'','а')} в первый год.`,{affection:3,trust:2});}}]:[]),
  {label:'Поговорить по телефону',hint:'Немного ближе',fn:()=>done(`Вы говорите почти час. ${person.name} рассказывает, как всё было, и в конце благодарит, что вы позвонили.`,{affection:1,trust:1})},
  {label:'Сказать, что сейчас не можете говорить',fn:()=>done(`Вы обещаете перезвонить. ${p.name} — ещё одна строчка в длинном дне.`,null)}
 ]);
}

// Питомцы близких: estates58 сообщает о смерти заметкой в карточке человека. Добавляем запись в ленту.
if(typeof ageNote58==='function'){
 const ageNoteBase260=ageNote58;
 ageNote58=function(p,text,...args){
  const out=ageNoteBase260.call(this,p,text,...args);
  const m=/^Питомец (.+) умер от старости\.$/.exec(String(text||''));
  if(m&&p&&p.alive&&(p.bond>=50||typeof kin27==='function'&&kin27(p)&&p.bond>=35)&&!s.dead){
   s.pending.push({type:'petCondolence260',personId:p.id,petName:m[1]});
  }
  return out;
 };
}

function petCondolence260(q){
 const person=living(q.personId);
 if(!person){s.pending.shift();return resolvePending();}
 const done=(text,delta)=>{
  s.pending.shift();
  if(delta){rel(person,delta);remember(person,'Вы написали, когда умер питомец '+q.petName);}
  log('У близких',text,'Люди');
  save();render();
  if(s.pending.length)resolvePending();
 };
 show('Сообщение · '+person.name,`${person.name} пишет коротко: «${q.petName}… Сегодня утром. От старости».`,[
  {label:'Написать в ответ',hint:'Ближе',fn:()=>done(`Вы пишете несколько строк. В ответ приходит фотография: ${q.petName} на подоконнике, лет десять назад.`,{affection:2,trust:1})},
  {label:'Не сейчас',fn:()=>done(`Новость от близких: питомец по кличке ${q.petName} умер от старости.`,null)}
 ]);
}

// Помёт: окно при рождении и когда малыши подросли.
if(typeof petFamilyMonth79==='function'){
 const petFamilyMonthBase260=petFamilyMonth79;
 petFamilyMonth79=function(...args){
  const out=petFamilyMonthBase260.apply(this,args);
  if(s.dead||!s.petFamily79)return out;
  const tick=s.clock.ticks;
  for(const l of petFamily79().litters){
   if(l.status!=='born')continue;
   if(!l.born260){l.born260=true;s.pending.push({type:'litter260',litterId:l.id,stage:'born'});}
   else if(!l.ready260&&tick>=l.ready&&l.young.some(q=>q.status==='available')){l.ready260=true;s.pending.push({type:'litter260',litterId:l.id,stage:'ready'});}
  }
  return out;
 };
}

function litter260(q){
 const l=petFamily79().litters.find(x=>x.id===q.litterId);
 const open=()=>{s.pending.shift();save();litterMenu79(l);};
 const later=()=>{s.pending.shift();save();render();if(s.pending.length)resolvePending();};
 if(!l||l.status!=='born'){s.pending.shift();return resolvePending();}
 const young=l.young.filter(x=>x.status==='available'),names=young.map(x=>x.name).join(', ');
 const mother=litterTitle80(l);
 if(q.stage==='born'){
  const n=l.young.length;
  return show('Помёт · '+mother,`${n===1?'Родился один малыш':n<5?'Родились '+n+' малыша':'Родились '+n+' малышей'}: ${names}. Пока они с матерью. Через два месяца можно будет решить, кого оставить, а кого пристроить.`,[
   {label:'Посмотреть малышей',fn:open},
   {label:'Хорошо',fn:later}
  ]);
 }
 show('Малыши подросли',`${names} уже носятся по дому. Пора решать, кто останется, а кому искать новый дом.`+
  (l.externalMother?' Одного можно оставить себе, остальных пристроит хозяин самки.':' Тех, кого не пристроят за четыре месяца, заберут волонтёры.'),[
  {label:'Решить сейчас',fn:open},
  {label:'Позже',hint:'Решить можно в меню животных',fn:later}
 ]);
}

const resolvePendingBase260=resolvePending;
resolvePending=function(...args){
 const q=s.pending[0];
 if(q?.type==='petFarewell260')return petFarewell260(q);
 if(q?.type==='petNews260')return petNews260(q);
 if(q?.type==='petCondolence260')return petCondolence260(q);
 if(q?.type==='litter260')return litter260(q);
 return resolvePendingBase260.apply(this,args);
};

// Просьба о питомце: раньше родитель не смотрел, сколько животных уже дома (только предел в пять).
if(typeof askParent67==='function'){
 const askParentBase260=askParent67;
 askParent67=function(kind,breed=null,...args){
  if(!petKinds[kind]||requestWhy67(kind))return askParentBase260.call(this,kind,breed,...args);
  const home=s.pets.filter(p=>p.alive&&(typeof petAtHome183!=='function'||petAtHome183(p)));
  if(!home.length||!chance(Math.min(.85,.3+.2*home.length)))return askParentBase260.call(this,kind,breed,...args);
  const parent=parents17().filter(childLocal55).sort((a,b)=>parentAvailable17(b)-parentAvailable17(a))[0];
  if(!parent)return askParentBase260.call(this,kind,breed,...args);
  childhood67().requests[kind]={tick:s.clock.ticks,kind,parent:parent.id,status:'declined'};
  const first=home[0];
  const line=home.length===1
   ?`«А кто будет следить за двумя? ${first.name} и так требует внимания. Давай вернёмся к этому через год».`
   :`«Дома уже ${home.map(p=>p.name).join(' и ')}. Ещё одного мы не потянем. Через год поговорим».`;
  log('Разговор с родителем',parent.name+': '+line,'Семья');
  save();render();
  return false;
 };
}
