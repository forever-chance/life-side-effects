'use strict';
// Сборка 273.1: карточка человека и карточка ребёнка на окне-карточке windows273.js.
// Карточка человека (personDetail): наверху — кто вам этот человек, как у вас дела (близость словами и числом, доверие,
// напряжение), что у него сейчас (работа, учёба, план, здоровье, если есть о чём сказать), ваша последняя встреча и
// просьбы, которые ждут вашего ответа (срок — последний месяц, когда ещё можно ответить). Действия с человеком — на
// первом экране: главные крупно, остальные строкой «Ещё». Вся прежняя таблица — характер, общая история, биография,
// новости — в «Подробнее», новые записи сверху, с датами вместо «Месяц 591», без повторов верха.
// Карточка ребёнка (childOverview55): наверху школа и успеваемость с датой следующей проверки, кружки с усталостью,
// болезнь; «Уход» и «Конкурсы» стоят среди вариантов, а не под ними, «Открыть карточку» — в подвале окна, как «Назад».
// Как устроено:
// • Обёртка функции окна подменяет show() только для окна с именем человека: кладёт карточку в nextCard273, приводит
//   таблицу nextDetail20 к виду для показа (даты, порядок, без пустых строк и повтора верха). В сохранении ничего не
//   меняется: таблицу считает personSections42, как раньше, правится только то, что уходит на экран.
// • Кнопки, которые обёртки 54–256 дописывают прямо в #modal (школа ребёнка, имя ребёнка, «Уход», «Конкурсы»…), после
//   отрисовки переносятся к вариантам — в главные, в строку «Ещё», в подвал («Открыть карточку») или в «Подробнее»
//   («Имя и фамилия ребёнка», «Предложить тайные отношения», пока условия не выполнены). Узлы двигаются вместе со своим
//   onclick, поэтому нажатие ведёт туда же, куда раньше.
// • Числа наверху — те же, что в таблице игры: близость, доверие и напряжение (p.inner), успеваемость (p.school.grades,
//   как в schoolMenu), доверие и усталость ребёнка (childState55), помощь в быту (p.aging58.need). Проверка оценок —
//   в первый месяц, номер которого делится на 3, как в academicsMonth. Просьбы — из decisionItems24, кнопка открывает
//   то же окно, что «Ожидают ответа».
// • Без windows273.js файл ничего не делает.

const people2731Ready=typeof layout273==='function'&&typeof windows273Base!=='undefined';
const peopleBase2731={personDetail,childOverview55};

// ---------- слова ----------

function closeWord2731(n){return n>=85?'очень близки':n>=65?'близки':n>=45?'тепло':n>=25?'прохладно':'холодно';}
function strainWord2731(n){return n>=60?'сильное':n>=35?'заметное':'';}
function trustWord2731(n){return n<25?'очень низкое':n<45?'низкое':'';}
function gradeWord2731(n){return n>=85?'отлично':n>=65?'хорошо':n>=40?'средне':'ниже порога';}
// Кто вам этот человек — именительный падеж, по полу. Хранимые роли («Партнер») сравниваются как есть, свой ребёнок —
// через ownChild53. Ролей без женской формы в карте нет: «Няня», «Потомок», «Автор», «Пара ребёнка» одинаковы.
// Сотрудник, который ушёл из вашего дела, хранит прежнюю роль, а занятие у него «Бывший сотрудник · …» (enterprise152,
// business-events254) — под именем пишется то же, что в занятии.
function former2731(p){return p.role==='Сотрудник своего дела'&&/^Бывший сотрудник( · |$)/.test(String(p.occupation||''));}
function roleWord2731(p){
 const f=p.gender==='f',r=String(p.role||''),pair=p.married?(f?'Жена':'Муж'):(f?'Партнёрша':'Партнёр');
 if(typeof sideRelationship63==='function'&&sideRelationship63(p.id))return f?'Тайная партнёрша':'Тайный партнёр';
 if(typeof ownChild53==='function'&&ownChild53(p))return f?'Дочь':'Сын';
 if(former2731(p))return f?'Бывшая сотрудница':'Бывший сотрудник';
 const fem={'Бывший партнер':'Бывшая партнёрша','Друг':'Подруга','Внук':'Внучка','Внук / внучка':'Внучка','Знакомый':'Знакомая',
  'Родственник':'Родственница','Партнёр близкого':'Партнёрша близкого','Друг ребёнка':'Подруга ребёнка',
  'Сотрудник своего дела':'Сотрудница своего дела','Клиент':'Клиентка','Покупатель':'Покупательница','Заказчик':'Заказчица',
  'Гость':'Гостья','Ученик':'Ученица','Зритель':'Зрительница','Хозяин питомца':'Хозяйка питомца','Турист':'Туристка',
  'Подопечный':'Подопечная'};
 const male={'Бывший партнер':'Бывший партнёр','Внук / внучка':'Внук'};
 if(/^Ребё?нок$/.test(r))return f?'Дочь':'Сын'; // хранимое «Ребенок» — без ё (сравнивается со старыми сохранениями)
 if(r==='Партнер'||r==='Партнёр')return pair;
 return (f?fem[r]:male[r])||r;
}
function rel2731(p){return {close:Math.round(p.inner?.affection??p.bond??0),trust:Math.round(p.inner?.trust||0),strain:Math.round(p.inner?.strain||0)};}
function relRow2731(p){
 const r=rel2731(p),t=trustWord2731(r.trust),st=strainWord2731(r.strain);
 return {label:'Отношения',value:'Близость '+r.close+' · '+closeWord2731(r.close),note:'доверие '+r.trust+(t?' ('+t+')':'')+' · напряжение '+r.strain+(st?' ('+st+')':'')};
}
function tiredWord2731(n){return n>=75?'очень устаёт':n>=50?'устаёт':'в норме';}
// Усталость ребёнка копится от секций (childMonth55), поэтому она стоит в строке «Кружки». Без секций — отдельной
// строкой, только если есть о чём сказать.
function childTired2731(p){const a=p.child55;return !!a&&(a.illness?.status==='active'||(a.clubs||[]).some(m=>clubsCatalog19[m.type])||Math.round(a.fatigue)>=50);}
// Следующая проверка оценок: academicsMonth работает в ход, после которого номер месяца (x.ticks++) делится на 3.
function nextTerm2731(){const t=s.clock.ticks;return t+3-t%3;}
function where2731(p){
 if(!p.alive)return '';
 if(p.role==='Партнер'&&p.cohabit)return 'живёте вместе';
 if(typeof ownChild53==='function'&&ownChild53(p)&&p.age<18&&typeof childLocal55==='function'&&childLocal55(p))return 'живёт с вами';
 let city='';try{city=typeof personCity62==='function'?personCity62(p):p.city18||'';}catch(e){city=p.city18||'';}
 const abroad=p.country&&p.country!==s.country?countries[p.country]?.name||'':'';
 return [city,abroad].filter(Boolean).join(', ');
}
// «Месяц 591» → «Ноябрь 2069».
function monthLabel2731(label){const m=/^Месяц (-?\d+)$/.exec(String(label||''));return m&&typeof dateLabel86==='function'?dateLabel86(+m[1]):null;}
// Сырые значения в записях: «обсудили его собственные планы: discuss» (autonomy55) и подобные.
function cleanText2731(t){
 return String(t??'').replace(/([^.])\.\.(?!\.)/g,'$1.').replace(/обсудили его собственные планы: (support|distance|discuss)/g,(_,k)=>({support:'поддержали собственный план',distance:'договорились попробовать на расстоянии',discuss:'попросили время, чтобы обсудить собственный план'})[k]);
}

// ---------- таблица для показа ----------

const emptyValues2731=new Set(['Нет записанных сведений','Нет записанных детей','Нет сведений','Не записано','Не учится','Пока без нового большого плана','Не требуется','Пока не назначена','Пока выбирает']);
// Строки «О человеке», которые уже стоят наверху карточки: «Связь» и «Возраст» — в подписи под именем, «Где живёт» —
// там же городом (у живых), «Отношения» и «Занятие» — строками наверху. Тайные отношения подпись называет сама
// («Тайный партнёр»), поэтому «Связь» уходит и у них.
const topRows2731=new Set(['Связь','Возраст','Отношения','Занятие']);
function tidyDetail2731(detail,kind,p){
 if(!detail?.sections)return detail;
 const sections=[];
 // Помощь в быту наверху — строкой «Здоровье» (personBuild2731), пара — примечанием к «Сейчас».
 const helpTop=kind==='person'&&p?.alive&&p.aging58?.need>0&&p.child55?.illness?.status!=='active';
 for(const g of detail.sections){
  if(!g)continue;
  let rows=(g.rows||[]).map(r=>({...r,value:cleanText2731(r.value)}));
  if(kind==='person'&&g.title==='О человеке')rows=rows.filter(r=>!topRows2731.has(r.label)&&!(p?.alive&&r.label==='Где живёт')||r.label==='Занятие'&&p&&former2731(p))
   .map(r=>r.label==='Занятие'&&p.gender==='f'?{...r,value:String(r.value).replace(/^Бывший сотрудник/,'Бывшая сотрудница')}:r);
  if(kind==='person'&&p?.alive&&g.title==='Собственная жизнь')rows=rows.filter(r=>r.label!=='Пара');
  if(helpTop&&g.title==='Возраст и помощь')rows=rows.filter(r=>r.label!=='Помощь');
  if(kind==='child'&&g.title==='Что важно ребёнку')rows=rows.filter(r=>r.label!=='Интересы'&&!(r.label==='Усталость'&&p&&childTired2731(p)));
  rows=rows.filter(r=>!(r.ok===undefined&&emptyValues2731.has(String(r.value).trim()))&&!(r.label==='Самостоятельность'&&String(r.value)==='100/100')&&!(r.label==='Пара'&&r.value==='В отношениях с вами'));
  if(g.title==='Возраст и помощь'&&rows.length===1&&rows[0].label==='Этап')rows=[];
  // История: даты вместо номеров месяцев, новые сверху.
  const dated=rows.length&&rows.every(r=>monthLabel2731(r.label));
  if(dated)rows=rows.map(r=>({...r,label:monthLabel2731(r.label)})).reverse();
  const memories=rows.length&&rows.every(r=>/^Воспоминание \d+$/.test(r.label));
  if(memories)rows=rows.map(r=>{const m=/^(\d{4}): ([\s\S]*)$/.exec(r.value);return m?{...r,label:m[1],value:m[2].charAt(0).toUpperCase()+m[2].slice(1)}:r;}).reverse();
  if(!rows.length&&!g.note)continue;
  sections.push({...g,rows});
 }
 return {...detail,sections};
}

// ---------- просьбы человека из «Ожидают ответа» ----------

// Последний месяц, в котором на просьбу ещё можно ответить. Срок у просьб считается по-разному: одни ждут и в месяц
// срока (aging58, social68, childhood67, vehicles56: q.expires>=ticks), другие — только до него (children55, autonomy55,
// social49, events54, circles48, family-travel53, romance54: q.expires>ticks, в месяц срока — «expired»). Поэтому
// карточка не гадает по виду, а спрашивает саму игру — decisionActive24 в месяц срока; это только чтение.
function lastTick2731(it){
 const e=it?.expires,c=s.clock,t=c.ticks;
 if(!Number.isFinite(e)||typeof decisionActive24!=='function')return null;
 let on=true;
 try{c.ticks=e;on=!!decisionActive24(it.ref);}catch(err){on=true;}finally{c.ticks=t;}
 const last=on?e:e-1;
 return last>=t?last:null;
}
function asks2731(p){
 if(typeof decisionItems24!=='function'||s.dead)return [];
 let items=[];try{items=decisionItems24();}catch(e){return [];}
 const mine=it=>{const q=it.q;if(!q||typeof q!=='object')return false;return Object.entries(q).some(([k,v])=>v===p.id&&k!=='decisionId24');};
 return items.filter(mine).slice(0,4).map(it=>{
  // Имя уже стоит заголовком карточки: «Имя · …», «… · Имя» и «Имя: …» (просьба о помощи в быту, aging58) — без него.
  let title=String(it.title||'').replace(p.name+' · ','').replace(' · '+p.name,'');
  if(title.startsWith(p.name+': '))title=title.slice(p.name.length+2);
  if(title===p.name||!title)title=String(it.note||'Ждёт ответа');
  title=title.charAt(0).toUpperCase()+title.slice(1);
  const last=typeof untilMonth273==='function'?lastTick2731(it):null;
  return {text:title,fix:{label:'Ответить',hint:last===null?'':untilMonth273(last),fn:()=>openDecision24(it.ref.kind,it.ref.id)}};
 });
}

// ---------- последняя встреча ----------

// Встречи в общей истории (remember): встреча из meetings53 (её название), общая поездка, приезд в гости, разговор после
// переезда — эти четыре ставят и p.contactTick05, месяц встречи; праздник или приглашение (events54, social270),
// встреча вне работы (circles48), подростковая встреча (romance54), общее место (chapter.js) — только год записи.
const metTick2731=[/^Побывали вместе: /,/^Вы приезжали в гости: /,/^Нашли время для разговора после переезда/];
const metYear2731=[/^побывали вместе: /,/^Встретились вне работы и учёбы: /,/^подростковая встреча: /,/^встреча: /];
function lastMet2731(p){
 const names=new Set(typeof meetingKinds53==='object'&&meetingKinds53?Object.values(meetingKinds53).map(k=>k?.name).filter(Boolean):[]);
 const mem=Array.isArray(p.memories)?p.memories:[];
 for(let i=mem.length-1;i>=0;i--){
  const m=/^(\d{4}): ([\s\S]*)$/.exec(String(mem[i]||''));if(!m)continue;
  const text=m[2].trim(),ticked=names.has(text)||metTick2731.some(re=>re.test(text));
  if(!ticked&&!metYear2731.some(re=>re.test(text)))continue;
  // Месяц — у последней такой записи, если p.contactTick05 из того же года (раньше записи не было).
  let when=m[1]+' год';
  if(ticked&&Number.isFinite(p.contactTick05)&&typeof dateLabel86==='function'){const d=String(dateLabel86(p.contactTick05));if(d.endsWith(' '+m[1]))when=d;}
  // Праздник у самого человека записан как «побывали вместе: День рождения · Имя» — в его карточке имя не повторяем.
  let t=cleanText2731(text);
  if(t.endsWith(' · '+p.name))t=t.slice(0,-(p.name.length+3));
  return {value:when,note:t.charAt(0).toUpperCase()+t.slice(1)};
 }
 return null;
}

// ---------- карточка человека ----------

const personMain2731=['Общение и встречи','Пара и совместный быт','Возраст, пенсия и помощь','Школа, успеваемость и кружки'];
function personBuild2731(p,ctx){
 const card={rows:[],need:[],more:[],main:[],settings:[],settingsTitle:'Ещё',allTitle:'Вся карточка',moreHint:'',text:false};
 const raw=ctx.raw2731||ctx.detail,kinRow=rows273(raw).find(r=>r.label==='Родство'),kin=(typeof kinLabel274==='function'?kinLabel274(p):'')||kinRow?.value||roleWord2731(p);
 const died=p.died274||p.died54;
 card.sub=[kin,p.alive?years(p.age):died?'не стало в '+died.year+' году, в '+years(died.age):'',where2731(p)].filter(Boolean).join(' · ');
 if(!p.alive){
  card.area='Память';
  const was=rows273(raw).find(r=>r.section==='Прежняя жизнь'&&r.label==='Годы')?.value;
  const note=cleanText2731(p.deathNote||'Умерший близкий'),last=/^Последняя общая запись: (?:(\d{4}): )?([\s\S]*)$/.exec(note);
  if(last)card.rows.push({label:'Последняя запись',value:last[2].charAt(0).toUpperCase()+last[2].slice(1),note:[last[1],was].filter(Boolean).join(' · ')});
  else card.rows.push({label:'Память',value:note,note:was||''});
  card.pull2731=true;
  return card;
 }
 card.area='Близкие';
 card.rows.push(relRow2731(p));
 // Что у человека сейчас: школа ребёнка, работа или учёба, собственный план, пара.
 const own=typeof ownChild53==='function'&&ownChild53(p);
 let now='',nowNote=[];
 if(own&&p.age>=6&&p.age<18&&p.school)now=(schools[p.school.type]?.name||'Школа')+' · успеваемость '+Math.round(p.school.grades)+'/100';
 else{
  let study='';if(p.bio27?.study)try{study=programName26(prog16(p.bio27.study.program))||'программа';}catch(e){study='программа';}
  // Занятие — как в таблице игры (portraits49 показывает у детей «Учёба» или «Раннее детство»).
  // Бывший сотрудник вашего дела: это уже сказано под именем, а чем человек занят теперь, игра не знает — в «Сейчас»
  // не пишем, занятие остаётся в «Подробнее».
  const job=former2731(p)?'':String(rowValue273(raw,'Занятие','О человеке')||p.occupation||'').trim();
  now=[study?'учится · '+study:'',job&&job!=='Не записано'&&!(study&&job==='Учёба')?job:''].filter(Boolean).join(' · ');
  now=now.charAt(0).toUpperCase()+now.slice(1);
  if(!now&&p.age<18)now=p.age<6?'Раннее детство':'Учёба';
 }
 const a=p.agency55;
 if(p.age>=18&&a?.plan&&typeof adultPlanNames55!=='undefined')nowNote.push('план: '+lower273(adultPlanNames55[a.plan.kind]||'свой план')+(a.plan.blocked?' · '+lower273(a.plan.blocked):''));
 // Пара — из таблицы игры (autonomy55, social270): npcPartner55 сам заводит состояние человека, карточке это не нужно.
 const pair=String(rowValue273(raw,'Пара','Собственная жизнь')||'');
 if(pair&&!['Не записано','В отношениях с вами'].includes(pair))nowNote.push(/ · в браке$/.test(pair)?'в браке: '+pair.replace(/ · в браке$/,''):'в паре: '+pair);
 if(now||nowNote.length)card.rows.push({label:'Сейчас',value:now||nowNote.shift().replace(/^./,c=>c.toUpperCase()),note:nowNote.join(' · ')});
 // Здоровье — только если есть о чём сказать: болезнь ребёнка, помощь в быту, слабое здоровье.
 const ill=p.child55?.illness?.status==='active',ag=p.aging58,care=ag?.care;
 if(ill)card.rows.push({label:'Здоровье',value:'Болеет',note:'обычные занятия пока на паузе'});
 else if(ag?.need>0)card.rows.push({label:'Здоровье',value:'Нужна помощь в быту',note:ag.need+' ч/нед. · '+(care?({self:'помогаете вы',relative:'помогает '+(living(care.helper)?.name||'близкий'),servicePlayer:'помощник за ваш счёт',serviceSelf:'помощника оплачивает '+(p.gender==='f'?'сама':'сам')})[care.mode]+(care.status==='active'?'':' · на паузе'):'регулярной помощи нет')});
 else if(Number.isFinite(p.bio27?.health)&&p.bio27.health<50)card.rows.push({label:'Здоровье',value:'Слабое · '+Math.round(p.bio27.health)+'/100'});
 // Последняя встреча — у тех, с кем вы не живёте под одной крышей.
 if(!['живёте вместе','живёт с вами'].includes(where2731(p))){const met=lastMet2731(p);if(met)card.rows.push({label:'Последняя встреча',...met});}
 card.need=asks2731(p);card.needTitle='Ждёт вашего ответа';
 // Действия: главные крупно (только доступные), остальные — строкой «Ещё».
 const labels=(ctx.opts||[]).filter(o=>o&&!o.hidden&&typeof o.label==='string').map(o=>o);
 const helpNeeded=ag?.need>0;
 for(const l of personMain2731){
  const o=labels.find(o=>o.label===l);
  if(l==='Возраст, пенсия и помощь'&&o&&!helpNeeded)continue;
  if(l==='Школа, успеваемость и кружки'||o&&!o.disabled)card.main.push(l);
 }
 card.settings=labels.map(o=>o.label).filter(l=>!card.main.includes(l)&&!/^Закрыть$/.test(l));
 // Имя и фамилия ребёнка — настройка, а не действие с человеком: в «Подробнее» («Другие действия»). Новорождённый без
 // имени и так стоит в «Ждёт вашего ответа» (names256).
 card.toMore=['Имя и фамилия ребёнка'];
 card.pull2731=true;
 return card;
}

// ---------- карточка ребёнка ----------

const childMain2731=['Школа и успеваемость','Уход: декрет, няня и помощь','Записать на кружок или секцию'];
// «Велосипед или машина в подарок» и секции ребёнка (пауза, возобновление) — в «Подробнее», среди других действий.
// «Открыть карточку» — переход в другое окно, как «Назад»: в подвал окна (правило К4), чтобы «Ещё» не уходило за край
// экрана маленького телефона.
const childMore2731=['Конкурсы и школьные соревнования'],childFoot2731=['Открыть карточку'];
function childBuild2731(p,ctx){
 const card={kind:'child',area:'Дети',rows:[],need:[],more:[],main:[],settings:[],settingsTitle:'Ещё',allTitle:'Вся карточка',moreHint:''};
 const a=childState55(p);
 card.sub=[roleWord2731(p),years(p.age),where2731(p)].filter(Boolean).join(' · ');
 // Наверху — школа, кружки и здоровье. Тип школы — подсказкой на кнопке «Школа и успеваемость» (как без карточки),
 // близость и доверие — в карточке человека и в «Подробнее»: верх должен помещаться на маленьком телефоне.
 if(p.age>=6&&p.age<18&&p.school){
  const g=Math.round(p.school.grades),bad=p.school.badTerms||0;
  // Порог — как в gradeTerm (family-school.js): ниже 40 на проверке — предупреждение, два раза подряд — перевод
  // из платной школы в государственную или повторное освоение трудных тем.
  card.rows.push({label:'Школа',value:'Успеваемость '+g+'/100 · '+gradeWord2731(g),
   note:'проверка оценок '+inMonth273(nextTerm2731())+(g<40?(bad?(p.school.type!=='public'?': если снова ниже 40 — перевод в государственную школу':': если снова ниже 40 — повторное освоение трудных тем'):': если ниже 40 — предупреждение'):'')});
 }else if(p.age<6)card.status={text:'Раннее детство · в школу с 6 лет',tone:'ok'};
 const clubs=(a.clubs||[]).filter(m=>clubsCatalog19[m.type]),on=clubs.filter(m=>m.status==='active');
 const ill=a.illness?.status==='active',tired=Math.round(a.fatigue),tiredText='усталость '+tired+'/100 · '+tiredWord2731(tired);
 // Секции на паузе видны в «Подробнее» кнопками «Пауза»; наверху — те, что идут, и усталость от них.
 if(clubs.length)card.rows.push({label:'Кружки',value:on.length?on.map(m=>clubsCatalog19[m.type].name).join(', '):'Все на паузе',note:ill?'':tiredText});
 // Болеет — как в карточке человека: занятия на паузе (childMonth55 пропускает секции), усталость без «в норме».
 if(ill)card.rows.push({label:'Здоровье',value:'Болеет',note:'обычные занятия пока на паузе · усталость '+tired+'/100'+(tired>=50?' · '+tiredWord2731(tired):'')});
 else if(!clubs.length&&tired>=50)card.rows.push({label:'Здоровье',value:'Устаёт',note:tiredText});
 const interests=(a.interests||[]).map(t=>clubsCatalog19[t]?.name).filter(Boolean);
 if(interests.length)card.more.push({title:'Интересы',text:interests.join(', ')+'.'});
 card.need=asks2731(p);card.needTitle='Ждёт вашего ответа';
 const opts=(ctx.opts||[]).filter(o=>o&&!o.hidden&&typeof o.label==='string');
 for(const l of childMain2731){const o=opts.find(o=>o.label===l);if(!o||!o.disabled)card.main.push(l);}
 // Рендерер берёт карточку, только если среди вариантов show() есть главная кнопка. «Уход» дописывается в #modal
 // позже, поэтому без доступной школы и кружков главных кнопок нет — всё уходит в «Ещё».
 if(!card.main.some(l=>opts.some(o=>o.label===l))&&!card.status)card.main=[];
 card.settings=[...childMain2731.filter(l=>!card.main.includes(l)),...childMore2731];
 card.toFoot=childFoot2731;
 card.pull2731=true;
 return card;
}

// ---------- кнопки, дописанные в #modal ----------

function btnLabel2731(b){return optLabel273(b)||b.querySelector('strong')?.textContent.replace(/\s+/g,' ').trim()||'';}
// Кнопка romance63 («Предложить встречаться», «Предложить тайные отношения») несёт в подсказке все невыполненные
// условия через «;». В строке «Ещё» — только первое и сколько ещё (все условия — в окне самой кнопки). «Предложить
// тайные отношения», пока условия не выполнены, уходит в «Подробнее»: у игрока в паре она иначе стоит на виду в карточке
// почти каждого знакомого. Возвращает, куда кнопку поставить: 'more' или ''.
function romance2731(b){
 if(!b.classList.contains('relationship-button63'))return '';
 const sm=b.querySelector('small'),hint=String(sm?.textContent||'').trim();
 if(!sm||/^(Есть взаимная симпатия|Вы встречаетесь)/.test(hint))return '';
 const list=hint.split(';').map(x=>x.trim()).filter(Boolean);
 if(list.length>1){const n=list.length-1;sm.textContent=list[0]+' · и ещё '+n+' '+plural273(n,'условие','условия','условий');}
 return btnLabel2731(b)==='Предложить тайные отношения'?'more':'';
}
// Что лежит в «Подробнее» — подпись под словом «Подробнее» собирается из того, что там на самом деле есть.
const moreWords2731={
 person:[['характер',x=>x.sec.has('Характерная реплика')||x.rows.has('О человеке/Характер')],['общая история',x=>x.sec.has('Общая история')],
  ['новости',x=>x.sec.has('Новости близкого')],['биография',x=>x.sec.has('Биография')],['своя жизнь',x=>x.sec.has('Собственная жизнь')],
  ['образование',x=>x.sec.has('Образование и семья')],['возраст и помощь',x=>x.sec.has('Возраст и помощь')],['прежняя жизнь',x=>x.sec.has('Прежняя жизнь')],
  ['другие действия',x=>x.acts.length>0]],
 child:[['интересы',x=>x.info.has('Интересы')],['секции',x=>x.acts.some(l=>x.clubs.has(l))],['подарок',x=>x.acts.includes('Велосипед или машина в подарок')],
  ['доверие',x=>x.rows.has('Что важно ребёнку/Доверие')],['своя история',x=>x.sec.has('Своя история')],
  ['другие действия',x=>x.acts.some(l=>!x.clubs.has(l)&&l!=='Велосипед или машина в подарок')]]
};
function moreHint2731(d,kind){
 const more=d.querySelector('details.more273');if(!more)return '';
 const sec=new Set(),rows=new Set();
 for(const g of more.querySelectorAll('.detail-section20')){
  const title=g.querySelector('h3')?.textContent.trim()||'',r=[...g.querySelectorAll('.detail-row20 dt')];
  if(!r.length)continue;sec.add(title);for(const dt of r)rows.add(title+'/'+dt.textContent.trim());
 }
 const info=new Set([...more.querySelectorAll('.info273 h4')].map(h=>h.textContent.trim()));
 const acts=[...more.querySelectorAll('.others273 > button,.orig273 > button')].filter(b=>!b.hidden).map(btnLabel2731);
 const clubs=new Set(typeof clubsCatalog19==='object'?Object.values(clubsCatalog19).map(c=>c?.name).filter(Boolean):[]);
 const x={sec,rows,info,acts,clubs};
 return (moreWords2731[kind]||[]).filter(([,f])=>{try{return f(x);}catch(e){return false;}}).slice(0,3).map(([w])=>w).join(', ');
}
// Переносит дописанные обёртками кнопки к вариантам: подпись из card.main — в главные, card.toMore — в «Подробнее»
// («Другие действия»), card.toFoot — в подвал, остальные — в «Ещё».
function pull2731(card){
 const d=document.getElementById('modal');
 if(!d||!card?.pull2731||card273!==card)return;
 const main=d.querySelector('.main273'),set=d.querySelector('.setopts273'),others=d.querySelector('.others273'),foot=d.querySelector('.foot273');
 if(!main||!set)return;
 const toMore=card.toMore||[],toFoot=card.toFoot||[];
 for(const b of [...d.querySelectorAll('button')]){
  if(b.closest('.options,.modal-closebar38,.need273,.chips273')||b.classList.contains('fix273'))continue;
  const l=btnLabel2731(b);
  if(foot&&toFoot.includes(l)){foot.append(b);continue;}
  if(others&&(toMore.includes(l)||romance2731(b)==='more')){others.append(b);continue;}
  if(card.kind==='child'&&!card.main.includes(l)&&!card.settings.includes(l))continue;
  (card.main.includes(l)?main:set).append(b);
 }
 const order=(list,b)=>{const i=list.indexOf(btnLabel2731(b));return i<0?99:i;};
 [...main.children].sort((x,y)=>order(card.main,x)-order(card.main,y)).forEach(b=>main.append(b));
 [...set.children].sort((x,y)=>order(card.settings,x)-order(card.settings,y)).forEach(b=>set.append(b));
 d.querySelector('.set273').hidden=!set.children.length;
 if(foot)foot.hidden=!foot.children.length;
 const orig=d.querySelector('.options.orig273'),h=d.querySelector('.others-h273');
 if(h)h.hidden=!(orig?.children.length||others?.children.length);
 // Портрет — рядом с именем, а не на весь первый экран.
 const pic=d.querySelector('.person-portrait42'),sub=d.querySelector('.sub273');
 if(pic&&sub&&pic.parentElement!==sub){pic.classList.add('pic2731');sub.prepend(pic);}
 // «Подробнее» карточки человека и ребёнка — сразу вся таблица, без второго «Вся карточка».
 const all=d.querySelector('.more273 details.all273');
 if(all&&!all.open)all.open=true;
 // Подпись «Подробнее» — по тому, что в нём есть.
 const sum=d.querySelector('details.more273 > summary');
 if(sum){
  const hint=moreHint2731(d,card.kind);card.moreHint=hint;
  let sm=sum.querySelector('small');
  if(!hint)sm?.remove();
  else{if(!sm){sm=document.createElement('small');sum.append(sm);}sm.textContent=hint;}
 }
 if(typeof yo273==='function')yo273();
}

// Причина у серой кнопки, если вариант её не знает.
function whyFor2731(kind,p,label){
 if(kind==='person'&&label==='Помощь и временное жильё')return 'Просить о таком можно только взрослых';
 if(kind==='child'&&label==='Записать на кружок или секцию')return typeof childLocal55==='function'&&!childLocal55(p)?'Сначала нужен совместный адрес':p.age<5?'С 5 лет':'';
 return '';
}
// Окно с именем человека получает карточку; другие окна внутри той же функции проходят как есть.
function withCard2731(p,kind,build,run){
 const old=show;let done=false;
 show=function(title,text,opts=[],...more){
  if(done||title!==p.name)return old(title,text,opts,...more);
  done=true;
  const raw=nextDetail20;
  if(nextDetail20)try{nextDetail20=tidyDetail2731(nextDetail20,kind,p);}catch(e){console.error(e);}
  opts=(opts||[]).map(o=>{const w=o&&o.disabled&&!o.hidden&&!o.why&&whyFor2731(kind,p,o.label);return w?{...o,why:w}:o;});
  nextCard273={kind,build:ctx=>build({...ctx,raw2731:raw})};
  try{return old(title,text,opts,...more);}finally{nextCard273=null;}
 };
 let r;
 try{r=run();}finally{show=old;}
 // card273 — карточка, которую рендерер собрал из build: её и раскладываем, сразу и после его микрозадачи.
 const c=card273;
 if(c&&c.pull2731&&c.kind===kind){
  try{pull2731(c);}catch(e){console.error(e);}
  queueMicrotask(()=>{try{pull2731(c);}catch(e){console.error(e);}});
 }
 return r;
}

if(people2731Ready){
 personDetail=function(id,...rest){
  const p=s?.people?.find(p=>p.id===id);
  if(!p||nextCard273)return peopleBase2731.personDetail(id,...rest);
  return withCard2731(p,'person',ctx=>({kind:'person',...personBuild2731(p,ctx)}),()=>peopleBase2731.personDetail(id,...rest));
 };
 childOverview55=function(id,...rest){
  const p=s?.people?.find(p=>p.id===id);
  if(!p||!p.alive||nextCard273)return peopleBase2731.childOverview55(id,...rest);
  return withCard2731(p,'child',ctx=>childBuild2731(p,ctx),()=>peopleBase2731.childOverview55(id,...rest));
 };
}

// ---------- стили ----------

(function peopleStyle2731(){
 if(!people2731Ready||typeof document==='undefined'||document.getElementById('people2731-style'))return;
 const st=document.createElement('style');
 st.id='people2731-style';
 st.textContent=[
  '#modal:has(.pic2731) .eyebrow,#modal:has(.pic2731) h2,#modal:has(.pic2731) .sub273{padding-right:84px}',
  '#modal .sub273 .pic2731{position:absolute;top:50px;right:18px;margin:0;display:block}',
  '#modal .sub273 .pic2731 .large33{width:70px;height:86px}',
  '#modal:has(.pic2731) dl.top273{margin-top:22px}',
  '@media(min-width:700px){#modal:has(.pic2731) dl.top273{margin-top:30px}}',
  '#modal .more273[data-kind="person"] details.all273>summary,#modal .more273[data-kind="child"] details.all273>summary{display:none}',
  '#modal .more273[data-kind="person"] details.all273,#modal .more273[data-kind="child"] details.all273{margin-top:6px}',
  '#modal .setopts273 .relationship-button63 strong{font-weight:500}',
  '@media(min-width:700px){#modal .sub273 .pic2731{right:28px}#modal .sub273 .pic2731 .large33{width:84px;height:102px}',
  ' #modal:has(.pic2731) .eyebrow,#modal:has(.pic2731) h2,#modal:has(.pic2731) .sub273{padding-right:100px}}',
  // Маленький телефон (360 px): портрет меньше, строки верха плотнее — чтобы главные кнопки и «Ещё» помещались
  // на первый экран и у ребёнка с секциями и просьбой.
  '@media(max-width:380px){#modal .sub273 .pic2731 .large33{width:56px;height:69px}',
  ' #modal:has(.pic2731) .eyebrow,#modal:has(.pic2731) h2,#modal:has(.pic2731) .sub273{padding-right:66px}',
  ' #modal:has(.pic2731) dl.top273{margin-top:14px}',
  ' #modal:has(> details.more273[data-kind="person"]) .row273,#modal:has(> details.more273[data-kind="child"]) .row273{padding:6px 0;grid-template-columns:68px minmax(0,1fr);gap:8px}}'
 ].join('\n');
 document.head.appendChild(st);
})();
