'use strict';
// Сборка 272.2: театральная студия и шум в ленте (отзыв на детскую жизнь: Испания, Валенсия, 8 лет).
//
// 1. Театр. Детская программа студии (catalog245.js) брала пьесы из каталога: для 7–11 лет в нём одна пьеса —
//    «Питер Пэн» (P0329). Каждые четыре месяца студия начинала «новую постановку» — снова «Питер Пэн» — и снова
//    просила выбрать роль: замер на сиде 7 (7–11 лет) — 9 постановок подряд, 9 предложений роли, все «Питер Пэн».
//    Теперь:
//    - детям до 12 лет студия ставит ещё и сказки из каталога детских книг (те же названия, авторы и описания)
//      с ролями отсюда; сначала — то, чего вы ещё не играли ни в одной студии, иначе не одна из последних;
//    - постановка идёт полгода: читка → распределение ролей → три месяца репетиций → премьера;
//    - роль предлагают один раз за постановку — в месяц читки; не выбрали — роль даёт педагог: мальчику — мужскую
//      или общую (звери, игрушки, рассказчик), девочке — женскую или общую; самим можно выбрать любую;
//    - в ленту идут читка (с названием и сюжетом), распределение ролей (ваша роль) и премьера, репетиции — в «Будни»;
//    - карточка клуба и «Программа и участие» показывают пьесу, этап, вашу роль и что дальше, прошлые постановки;
//    - взрослая «Театральная студия» вела две разные пьесы сразу (премьера раз в полгода из language-clubs53
//      и программа каталога): теперь пьеса одна — из программы; постановка language-clubs53 идёт за ней (то же
//      название, премьера в тот же месяц, её запись «Премьера · «…»» и приглашения social86 — как раньше, текст —
//      с вашей ролью); начатая в старом сохранении постановка доигрывается; принятое предложение пьесы (social86) —
//      следующей постановкой, в том числе ответ в первый же месяц участия и принятое ещё на 272; у своей пьесы роли
//      «главная», «второго плана», «эпизодическая» — «Педагог дал вам эпизодическую роль», «Вы играете главную роль»;
//    - этапы книжного клуба («Чтение и первые впечатления», «Обсуждение книги») — в «Будни», как «Книга клуба».
// 2. Лента.
//    - «X: своя жизнь» (autonomy55 adultNote55, aging58 ageNote58): планы, встречи пары, работа, учёба, покупки,
//      питомцы и возрастные этапы близких — в «Будни» («жизнь близких»). Отдельной записью с понятным заголовком —
//      только перемены: расставание, жить отдельно, новая пара, одна семья, переезд в другой город, смерть питомца,
//      а также помощь в быту, в которой участвуете вы. Запись о переменах больше не теряется из-за «новости раз
//      в два месяца»: рутина эту очередь не занимает.
//    - «X: новости» (family27 noteKin27): учёба, диплом, новая работа, прибавка и пенсия родни — в «Будни»; потеря
//      работы — «Потеря работы · X». Смену занятия по-прежнему пишет «У близкого изменилось занятие» (engine05).
//    - «Знакомое лицо · X» (circles48: школа, работа, учёба — раз в два месяца само) — в «Будни» («встречи со знакомыми»).
//    - «Неожиданный личный прогресс» (каталог, E0034): предложение называет занятие и прирост навыка за год
//      («Театр: … навык вырос на 10 за год, теперь 34/100»), не чаще раза в год; без заметного прироста (меньше 3)
//      и итог выбора («Вы записываете результат…») — в «Будни» («успехи в занятиях»).

Object.assign(routine267,{
 'Жизнь близких · будни':'жизнь близких','Знакомое лицо · будни':'встречи со знакомыми',
 'Неожиданный личный прогресс':'успехи в занятиях','Репетиция в студии':'репетиции'
});

function feed2722(){return s.feed2722??={skills:{},progress:-100};}
const monthsIn2722=['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];
function monthAhead2722(k){return months[((s.clock.month+k)%12+12)%12].toLowerCase();}

// ---------- 1. Театральная студия ----------

// Роли для детских инсценировок; названия, авторы и описания — из детских книг каталога (catalog245.books).
// После двоеточия — кого педагог может поставить на роль сам: f — девочку, m — мальчика, n — любого (звери, игрушки,
// сказочные существа, рассказчик). Выбрать сами можно любую роль.
const stageRoles2722={
 B0783:['Алиса:f','Белый Кролик:n','Шляпник:m','Чеширский Кот:n','Червонная Королева:f'],
 B0784:['Дороти:f','Страшила:n','Железный Дровосек:n','Трусливый Лев:n','Волшебник Оз:m'],
 B0785:['Пиноккио:m','Джеппетто:m','Говорящий Сверчок:n','Лиса:n','Кот:n'],
 B0786:['Пеппи:f','Томми:m','Анника:f','Полицейский:m','Учительница:f'],
 B0789:['Герда:f','Кай:m','Снежная королева:f','Маленькая разбойница:f','Бабушка:f'],
 B0790:['Золушка:f','Принц:m','Фея:f','Мачеха:f','Сводная сестра:f'],
 B0791:['Красная Шапочка:f','Волк:n','Бабушка:f','Охотник:m','Мама:f'],
 B0792:['Первый поросёнок:n','Второй поросёнок:n','Третий поросёнок:n','Волк:n','Рассказчик:n'],
 B0793:['Гензель:m','Гретель:f','Ведьма:f','Отец:m','Мачеха:f'],
 B0794:['Осёл:n','Пёс:n','Кот:n','Петух:n','Атаман разбойников:m'],
 B0795:['Красавица:f','Чудовище:n','Отец:m','Старшая сестра:f','Фея:f'],
 B0815:['Мари:f','Щелкунчик:n','Мышиный король:n','Дроссельмейер:m','Фриц:m']
};
// Детская пьеса каталога (роли — в catalog245-data.js), так же.
const playRoleSex2722={P0329:['Питер Пэн:m','Венди:f','Капитан Крюк:m','Динь-Динь:f','Майкл:m']};
const roleSex2722=Object.fromEntries([...Object.entries(stageRoles2722).map(([id,l])=>['S'+id,l]),...Object.entries(playRoleSex2722)].map(([id,l])=>[id,Object.fromEntries(l.map(x=>x.split(':')))]));
// Роль, которую даёт педагог: подходящая по полу или общая; если таких нет — любая.
function autoRole2722(w){
 const roles=w?.roles||[],sex=roleSex2722[w?.id]||{},g=s.gender==='f'||s.gender==='m'?s.gender:'';
 const fit=roles.filter(r=>!g||!sex[r]||sex[r]==='n'||sex[r]===g);
 return pick(fit.length?fit:roles);
}
let kidsStageCache2722=null;
function kidsStage2722(){
 return kidsStageCache2722??=catalog245.books.filter(b=>stageRoles2722[b.id]).map(b=>({id:'S'+b.id,title:b.title,author:b.author,summary:b.summary,country:'Любая',minAge:b.minAge,maxAge:11,roles:stageRoles2722[b.id].map(x=>x.split(':')[0])}));
}
const customRoles2722=['Главная роль','Роль второго плана','Эпизодическая роль'];
// Роли своей пьесы в тексте: «Педагог дал вам эпизодическую роль», «Ваша роль: главная», «… — роль второго плана».
const customRoleText2722={
 'Главная роль':{acc:'главную роль',nom:'главная роль',short:'главная'},
 'Роль второго плана':{acc:'роль второго плана',nom:'роль второго плана',short:'второго плана'},
 'Эпизодическая роль':{acc:'эпизодическую роль',nom:'эпизодическая роль',short:'эпизодическая'}
};
function roleSentence2722(role,auto){
 const c=customRoleText2722[role];
 return c?(auto?'Педагог дал вам ':'Вы играете ')+c.acc+'.':(auto?'Роль дал педагог: ':'Ваша роль — ')+role+'.';
}
function stageWork2722(m,id){
 if(!id)return null;
 if(String(id).startsWith('SB'))return kidsStage2722().find(w=>w.id===id)||null;
 if(String(id).startsWith('U2722-'))return (m?.works2722||[]).find(w=>w.id===id)||null;
 return [...catalog245.books,...catalog245.plays].find(w=>w.id===id)||null;
}
{
 const base=clubWork245;
 clubWork245=function(m){const id=m?.program245?.work;return id&&/^(SB|U2722-)/.test(String(id))?stageWork2722(m,id):base(m);};
}
{
 const base=clubPool245;
 clubPool245=function(m){
  const pool=base(m);
  if(clubKind245(m)!=='play'||s.age>=12)return pool;
  return pool.concat(kidsStage2722().filter(w=>w.minAge<=s.age&&!pool.some(x=>x.title===w.title)));
 };
}
function playHistory2722(){return clubState19().memberships.filter(m=>clubKind245(m)==='play').flatMap(m=>(m.programHistory245||[]).map(p=>({...p,m})));}
function choosePlay2722(m){
 if(m.queued2722){
  const title=m.queued2722;m.queued2722=null;m.works2722??=[];
  const w={id:'U2722-'+(m.works2722.length+1),title,author:'',summary:'Пьеса, которую вы предложили студии.',roles:customRoles2722};
  m.works2722.push(w);return w;
 }
 const pool=clubPool245(m);if(!pool.length)return null;
 // Сначала — то, чего вы ещё не играли ни в одной студии; если всё сыграно — не одна из последних постановок этой студии.
 const all=playHistory2722().sort((a,b)=>(a.finished??0)-(b.finished??0)).map(p=>p.work),used=new Set(all);
 let list=pool.filter(w=>!used.has(w.id));
 if(!list.length){
  const own=(m.programHistory245||[]).map(p=>p.work),recent=new Set(own.slice(-Math.max(1,Math.min(pool.length-1,Math.floor(pool.length/2)))));
  list=pool.filter(w=>!recent.has(w.id));if(!list.length)list=pool;
 }
 return pick(list);
}
function playStage2722(p){return !p?'':p.progress<=1?'читка':p.progress===2?'роли распределены':p.progress<6?'репетиции, '+(p.progress-2)+' из 3':'премьера';}
function playMonth2722(m){
 const club=clubsCatalog19[m.type].name;
 if(!m.program245){
  const w=choosePlay2722(m);if(!w)return false;
  const mode=clubMode245(m);
  m.program245={work:w.id,progress:0,started:s.clock.ticks,role:mode==='auto'&&w.roles.length?autoRole2722(w):null};
  if(mode==='important_only'&&w.roles.length)s.clock.running=false;
 }
 const p=m.program245,w=clubWork245(m);if(!w){m.program245=null;return false;}
 if(p.lastTick===s.clock.ticks)return true;
 p.lastTick=s.clock.ticks;p.progress++;
 const premiere='премьера намечена на '+monthAhead2722(6-p.progress);
 if(p.progress===1){
  log('Читка · «'+w.title+'»',club+': новая постановка. '+(w.author?w.author+' · ':'')+'«'+w.title+'». '+w.summary+' '+(w.roles.length&&!p.role?'Роли распределят в следующем месяце, '+premiere:'П'+premiere.slice(1))+'.','Занятия');
 }else if(p.progress===2){
  if(!p.role&&!p.roleDeclined&&w.roles.length){p.role=autoRole2722(w);p.roleAuto2722=true;}
  const who=p.role?roleSentence2722(p.role,p.roleAuto2722):p.roleDeclined?'Вы участвуете без закреплённой роли, в общих сценах.':'Закреплённых ролей нет, все играют в общих сценах.';
  log('Роль · «'+w.title+'»',club+': роли распределены. '+who+' Впереди три месяца репетиций, '+premiere+'.','Занятия');
 }else if(p.progress<6){
  log('Репетиция в студии',club+' · «'+w.title+'»','Занятия');
 }else{
  const next='Следующую постановку начнут готовить в '+monthsIn2722[(s.clock.month+1)%12]+'.';
  // У взрослой студии премьеру записывает language-clubs53 (там же история для приглашений social86) — текст дополняем.
  if(m.type==='theatre'&&m.theatre53)window.__premiere2722={title:w.title,text:club+' показывает спектакль «'+w.title+'». '+(p.role?roleSentence2722(p.role,false)+' ':'')+next};
  else log('Премьера · «'+w.title+'»',club+' показывает спектакль «'+w.title+'». '+(p.role?roleSentence2722(p.role,false)+' ':'')+next,'Занятия');
  m.programHistory245??=[];m.programHistory245.push({...p,finished:s.clock.ticks});if(m.programHistory245.length>80)m.programHistory245.shift();
  m.program245=null;
 }
 // Взрослая студия: постановка language-clubs53 идёт за программой — то же название, премьера в тот же месяц (12 встреч = 6 месяцев).
 if(m.type==='theatre'&&m.theatre53){m.theatre53.title=w.title;m.theatre53.began=m.sessions-2*p.progress;}
 return true;
}
{
 const base=clubProgramMonth245;
 clubProgramMonth245=function(m){
  const kind=clubKind245(m);
  if(kind==='play')return playMonth2722(m);
  if(kind!=='book')return base(m);
  window.__book2722=true;
  try{return base(m);}finally{window.__book2722=false;}
 };
}
// Взрослая «Театральная студия» (тип theatre) вела две пьесы сразу: постановку language-clubs53 (премьера через 12 встреч,
// приглашения social86) и программу каталога. Теперь пьеса одна — из программы; начатую в старом сохранении постановку
// language-clubs53 программа принимает как есть (то же название и этап), чтобы премьера не потерялась.
const sameTitle2722=(a,b)=>String(a||'').replace(/ё/g,'е')===String(b||'').replace(/ё/g,'е');
// Сохранение 272 сразу после ответа «Предложение принято» (social86): название уже сменилось, постановка ещё не начата
// (began = sessions), проект клуба называется так же, в «Ожидают ответа» — ответ клуба об этой пьесе.
function theatreAccepted2722(m,title){
 const n=String(title||'').replace(/ё/g,'е')+' · ';
 return (life61().notices||[]).some(q=>q.type==='clubAnswer86'&&q.club86===m.id&&q.title==='Предложение принято'&&String(q.note||'').replace(/ё/g,'е').startsWith(n));
}
function theatreAdopt2722(m){
 const t=m.theatre53;if(!t?.title)return;
 if(m.sessions===t.began){
  // Принятое на 272 предложение — следующей постановкой, как и принятое теперь.
  if(m.sessions>0&&m.project86&&!m.project86.proposal&&sameTitle2722(m.project86.title,t.title)&&!sameTitle2722(clubWork245(m)?.title,t.title)&&theatreAccepted2722(m,t.title))m.queued2722=t.title;
  return;
 }
 if(!(m.sessions-t.began>0))return;
 if(m.program245&&sameTitle2722(clubWork245(m)?.title,t.title))return;
 const months=Math.max(0,Math.min(5,Math.floor((m.sessions-t.began)/2)));
 let w=catalog245.plays.find(x=>sameTitle2722(x.title,t.title));
 if(!w){m.works2722??=[];w={id:'U2722-'+(m.works2722.length+1),title:t.title,author:'',summary:'Пьеса, которую студия уже репетирует.',roles:customRoles2722};m.works2722.push(w);}
 m.program245={work:w.id,progress:months,started:s.clock.ticks-months,role:null};
 if(months>=2&&w.roles.length){m.program245.role=autoRole2722(w);m.program245.roleAuto2722=true;}
}
{
 const base=clubMonth19;
 clubMonth19=function(...args){
  const list=clubState19().memberships.filter(m=>m.type==='theatre');
  for(const m of list)if(!m.theatre2722){m.theatre2722=1;theatreAdopt2722(m);}
  // Предложения, которые ждут ответа: social86 отвечает в этом же месяце и сразу меняет название постановки.
  const asked=list.map(m=>({m,q86:m.project86?.proposal||null,title86:m.project86?.title,q53:m.theatre53?.proposal||null}));
  try{return base.apply(this,args);}
  finally{window.__premiere2722=null;for(const x of asked){theatreAnswer2722(x);theatreSync2722(x.m);}}
 };
}
// Принятое предложение — следующей постановкой. Раньше его узнавали по смене названия относительно прошлого месяца,
// и ответ в первый же месяц участия (или первый месяц после загрузки сохранения 272) терялся.
function theatreAnswer2722({m,q86,title86,q53}){
 const p=m.project86,t=m.theatre53;let title=null;
 // social86: при «да» название проекта и постановки — предложенное, постановка начинается заново (began = sessions).
 if(q86&&p&&!p.proposal&&sameTitle2722(p.title,q86.title)&&(!sameTitle2722(title86,q86.title)||t&&t.began===m.sessions&&sameTitle2722(t.title,q86.title)))title=q86.title;
 // language-clubs53 (очень старые сохранения): предложение принимают на премьере.
 if(q53&&t&&!t.proposal&&sameTitle2722(t.title,q53.title))title=q53.title;
 if(title&&!sameTitle2722(title,clubWork245(m)?.title))m.queued2722=title;
}
function theatreSync2722(m){
 const t=m.theatre53,p=m.project86,w=clubWork245(m);if(!t)return;
 const title=w?.title||m.mirror2722||t.title;
 t.title=title;if(p)p.title=title;m.mirror2722=title;
}
// inMenu — для «Программы и участия»: там пьеса и автор уже в заголовке окна и первой строке, без повтора.
function seasonLines2722(m,inMenu=false){
 const kind=clubKind245(m),w=clubWork245(m),p=m.program245;
 if(kind==='book')return w?['Сейчас читают: «'+w.title+'»'+(w.author?' · '+w.author:'')]:[];
 const lines=[];
 if(w&&p){
  if(!inMenu)lines.push('Постановка: «'+w.title+'»'+(w.author?' · '+w.author:''));
  lines.push('Этап: '+playStage2722(p));
  lines.push('Ваша роль: '+(p.role?customRoleText2722[p.role]?.short||p.role:p.roleDeclined?'без закреплённой роли':w.roles.length?'ещё не выбрана':'общие сцены'));
  lines.push('Дальше: '+(p.progress<=1?'распределение ролей в этом месяце, премьера намечена на '+monthAhead2722(5-p.progress):p.progress<6?'премьера намечена на '+monthAhead2722(5-p.progress):'следующая постановка'));
 }else lines.push('Новую пьесу начнут читать в этом месяце'+(m.queued2722?': «'+m.queued2722+'» — ваше предложение.':'.'));
 if(m.queued2722&&p)lines.push('Следующая постановка: «'+m.queued2722+'» — ваше предложение.');
 const done=(m.programHistory245||[]).slice(-3).reverse().map(h=>{const x=stageWork2722(m,h.work);return x?'«'+x.title+'»'+(h.role?' — '+(customRoleText2722[h.role]?.nom||h.role):''):null;}).filter(Boolean);
 if(done.length)lines.push('Прошлые постановки: '+done.join('; ')+'.');
 return lines;
}
{
 const base=clubDetail19;
 clubDetail19=function(id,...args){
  const m=clubState19().memberships.find(m=>m.id===id);
  if(!m||m.graduated67!==undefined||!clubKind245(m))return base.call(this,id,...args);
  const showBase=show;let done=false;
  show=function(title,text,...rest){
   if(!done){done=true;show=showBase;const lines=seasonLines2722(m);if(lines.length){
    // Постановка — над списком участников: её ищут первой.
    text=String(text||'');const at=text.indexOf('\nУчастники: ');
    text=at>=0?text.slice(0,at)+'\n'+lines.join('\n')+text.slice(at):text+'\n'+lines.join('\n');
   }}
   return showBase.call(this,title,text,...rest);
  };
  try{return base.call(this,id,...args);}finally{if(!done)show=showBase;}
 };
}
{
 const base=clubProgramMenu245;
 clubProgramMenu245=function(id){
  const m=clubState19().memberships.find(m=>m.id===id);
  if(!m||clubKind245(m)!=='play')return base(id);
  const active=!s.dead&&m.status==='active'&&clubLocal19(m)&&clubLanguage19(m)&&clubAge23(m.type),w=clubWork245(m),p=m.program245;
  const offer=p&&w&&p.progress<=1&&!p.role&&!p.roleDeclined&&w.roles.length;
  show(w?w.title:'Программа студии',(w&&p?(w.author?w.author+'\n':'')+w.summary+'\n':'')+(offer?'Роли распределяют в этом месяце. Выберите роль сами — иначе её даст педагог.\n':'')+seasonLines2722(m,true).join('\n'),[
   ...(['ask','manual'].includes(clubMode245(m))?[{label:'Участвовать в следующем месяце',disabled:!active||(m.approvedThrough245??-1)>s.clock.ticks,fn:()=>{clubApprove245(id);clubProgramMenu245(id);}}]:[]),
   ...(w?.roles?.length&&p&&p.progress<3?[{label:p.role?'Изменить роль':'Выбрать роль',disabled:!active,fn:()=>clubRoles245(id)}]:[]),
   {label:'Настройки участия',fn:()=>clubSettings245(id)}
  ],{title:clubsCatalog19[m.type].name,open:()=>clubDetail19(id)});
 };
}
// Роль предлагают один раз за постановку — пока идёт читка; после распределения ролей вопрос не возвращается.
{
 const base=decisionActive24;
 decisionActive24=function(ref){
  const r=base(ref);
  if(!r||ref?.kind!=='club245')return r;
  const m=decisionRecord24(ref);
  if(m&&clubKind245(m)==='play'&&clubMode245(m)==='important_only')return (m.program245?.progress??9)<2;
  return r;
 };
}
{
 const base=decisionItems24;
 decisionItems24=function(...args){
  return base.apply(this,args).map(i=>{
   if(i.ref?.kind==='club245'&&clubMode245(i.q)==='important_only'){const w=clubWork245(i.q);return w?{...i,title:'Выбрать роль · «'+w.title+'»',note:clubsCatalog19[i.q.type].name}:i;}
   if(i.ref?.kind==='catalog245'&&i.q?.event==='E0034'&&i.q.title2722)return {...i,title:i.q.title2722};
   return i;
  });
 };
}

// ---------- 2. Лента ----------

// «X: своя жизнь»: что — в «Будни», что — отдельной записью и с каким заголовком.
const lifeNotes2722=[
 [/^Собственный план: /],
 [/^Находят время для отношений/],
 [/^Провели время вместе: (.+?) и (.+?); у них свои договорённости\.?$/,null,(a,b)=>a+' и '+b+' проводят время вместе.'],
 [/^Расстались: (.+?) и (.+?)\./,'Расставание',(a,b)=>a+' и '+b+' расстались.'],
 [/^Решили жить отдельно: (.+?) и (.+?)\./,'Живут отдельно',(a,b)=>a+' и '+b+' решили жить отдельно. С детьми оба продолжают общаться.'],
 [/^Начались отношения: (.+?) и (.+?)\./,'Новая пара',(a,b)=>a+' и '+b+' теперь вместе.'],
 [/^Теперь живут одной семьёй: (.+?) и (.+?)\.?$/,'Одна семья',(a,b)=>a+' и '+b+' теперь живут одной семьёй.'],
 [/^Переезд по собственному решению: (.+?) → (.+?)\./,'Переезд',(a,b,name)=>name+' переезжает в другой город: '+a+' → '+b+'.'],
 [/^Питомец (.+) умер от старости\.?$/,'Не стало питомца',(a,b,name)=>name+': питомец '+a+' умер от старости.'],
 [/^(Новая работа|Поиск работы|Переезд отложен|Регулярно занимается|Обучение завершено|Постоянная работа завершена|Новый возрастной этап|Приобрели квартиру|Взяла? питомца)/],
 [/помощ|присмотр|навещаете|помощник/i,'Помощь в быту',null]
];
function lifeNote2722(text,name=''){
 for(const [re,title,plain]of lifeNotes2722){
  const x=re.exec(String(text||''));if(!x)continue;
  const out=plain?plain(x[1],x[2],name):text;
  return title?{keep:true,title,text:out}:{keep:false,text:out??text};
 }
 return null;
}
{
 const base=adultNote55;
 adultNote55=function(p,text,major=false,...rest){
  const c=lifeNote2722(text,p?.name),w=autonomy55(),was=w.lastNews;
  // Рутина не занимает «новость раз в два месяца», перемена её не ждёт.
  if(c)w.lastNews=-100;window.__note2722=c;
  try{return base.call(this,p,c&&!c.keep?c.text:text,major,...rest);}
  finally{window.__note2722=null;if(c&&(!c.keep||w.lastNews===-100))w.lastNews=was;}
 };
}
// «X: новости» (family27 noteKin27, родня с близостью 55+): учёба, диплом, новая работа, прибавка, пенсия — в «Будни»
// (смену занятия и так показывает «У близкого изменилось занятие», engine05); потеря работы — отдельной записью.
const kinNotes2722=[
 [/^Работа закончилась/,'Потеря работы',(a,b,name)=>name+' ищет новую работу: прежняя закончилась.'],
 [/^(Получен диплом|Началось обучение|Новая работа|Повышение оплаты труда|Завершена постоянная работа)/]
];
function kinNote2722(text,name=''){
 for(const [re,title,plain]of kinNotes2722){const x=re.exec(String(text||''));if(x)return title?{keep:true,title,text:plain(x[1],x[2],name)}:{keep:false,text};}
 return null;
}
if(typeof noteKin27==='function'){
 const base=noteKin27;
 noteKin27=function(p,text,...rest){
  const c=kinNote2722(text,p?.name),f=s.family27,was=f?.lastNews;
  if(c&&f)f.lastNews=-100;window.__kin2722=c;
  try{return base.call(this,p,text,...rest);}
  finally{window.__kin2722=null;if(c&&f&&(!c.keep||f.lastNews===-100))f.lastNews=was;}
 };
}
function growth2722(key){
 const h=s.hobbies?.[key],list=feed2722().skills[key]||[];if(!h)return null;
 const now=h.skill||0,old=list.find(x=>s.clock.ticks-x.t<=12)||list[0];
 const gain=old?Math.round(now-old.v):0,monthsAgo=old?s.clock.ticks-old.t:0;
 return {key,name:hobbies[key]?.[0]||key,gain,now:Math.round(now),months:monthsAgo};
}
{
 const base=catalogOffer245;
 catalogOffer245=function(event,binding,...rest){
  if(event!=='E0034')return base.call(this,event,binding,...rest);
  const f=feed2722();
  if(s.clock.ticks-f.progress<12)return null;
  const best=Object.keys(s.hobbies||{}).map(growth2722).filter(Boolean).sort((a,b)=>b.gain-a.gain)[0];
  if(!best||best.gain<3){log('Неожиданный личный прогресс','','События');return null;}
  const period=best.months>=11?'за год':'за '+best.months+' мес.';
  const title='Получается лучше · '+best.name,text=best.name+': то, что раньше не получалось, вышло с первого раза. Навык вырос на '+best.gain+' '+period+', теперь '+best.now+'/100.';
  window.__progress2722={title,text};
  try{
   const q=base.call(this,event,{...binding,hobby:best.key,skill:s.hobbies[best.key].skill||0},...rest);
   if(q){f.progress=s.clock.ticks;q.title2722=title;q.text2722=text;}
   return q;
  }finally{window.__progress2722=null;}
 };
}
{
 const base=openDecision24;
 openDecision24=function(kind,id,...rest){
  const q=kind==='catalog245'&&s.catalog245?.events.find(q=>q.id===id);
  if(!q||q.event!=='E0034'||!q.title2722)return base.call(this,kind,id,...rest);
  const showBase=show;let done=false;
  show=function(title,text,...more){if(!done){done=true;show=showBase;title=q.title2722;text=q.text2722;}return showBase.call(this,title,text,...more);};
  try{return base.call(this,kind,id,...rest);}finally{if(!done)show=showBase;}
 };
}
{
 const base=log;
 log=function(title,text,tag='',major=false,...rest){
  if(!s)return base.call(this,title,text,tag,major,...rest);
  const key=String(title);
  if(window.__progress2722&&key==='Неожиданный личный прогресс'){const x=window.__progress2722;window.__progress2722=null;return base.call(this,x.title,x.text,tag,major,...rest);}
  // Премьера взрослой студии (language-clubs53) — с названием в «ёлочках», как «Читка · «…»» и «Роль · «…»».
  const prem=tag==='Занятия'&&/^Премьера · (?!«)(.+)$/.exec(key);
  if(prem){
   const pr=window.__premiere2722,head='Премьера · «'+prem[1]+'»';
   if(pr&&sameTitle2722(prem[1],pr.title)){window.__premiere2722=null;return base.call(this,head,pr.text,tag,major,...rest);}
   if(text==='Шесть месяцев репетиций закончились показом студии.')return base.call(this,head,text,tag,major,...rest);
  }
  if(window.__book2722&&tag==='Занятия')return base.call(this,'Книга клуба',text,tag,major,...rest);
  if(tag==='Общение'&&key.startsWith('Знакомое лицо · '))return base.call(this,'Знакомое лицо · будни',text,tag,major,...rest);
  const kin=tag==='Семья'&&/^(.+): новости$/.exec(key);
  if(kin){
   const c=window.__kin2722||kinNote2722(text,kin[1]);window.__kin2722=null;
   if(c&&!c.keep)return base.call(this,'Жизнь близких · будни',text,tag,major,...rest);
   if(c?.keep)return base.call(this,c.title+' · '+kin[1],c.text,tag,major,...rest);
  }
  const own=tag==='Жизнь близких'&&/^(.+): своя жизнь$/.exec(key);
  if(own){
   const c=window.__note2722||lifeNote2722(text,own[1]);window.__note2722=null;
   if(c&&!c.keep)return base.call(this,'Жизнь близких · будни',c.text,tag,major,...rest);
   if(c?.keep)return base.call(this,c.title+' · '+own[1],c.text,tag,major,...rest);
  }
  return base.call(this,title,text,tag,major,...rest);
 };
}
{
 const base=autonomousMonth;
 autonomousMonth=function(...args){
  const r=base.apply(this,args);
  if(s&&!s.dead){const f=feed2722();for(const [key,h] of Object.entries(s.hobbies||{})){const list=f.skills[key]??=[];if(list.at(-1)?.t!==s.clock.ticks)list.push({t:s.clock.ticks,v:h.skill||0});if(list.length>13)list.splice(0,list.length-13);}}
  return r;
 };
}
