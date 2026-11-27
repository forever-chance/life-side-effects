'use strict';
// Сборка 279.1 «Вузы»: 1304 настоящих по устройству вуза и колледжа во всех 180 городах вместо 250 шаблонных.
// Данные — unis2791-data.js (tools/unis2791_build.py). Названия вымышленные, прототипов в игре нет.
//
// • Новые заведения — в universities16 (id cc-nНОМЕР, номер постоянный), их программы — в programs16. Программы
//   строятся теми же формулами, что в catalog16.js (срок, цена, нагрузка, язык), из вида, престижа, отбора и платы
//   заведения; какие программы у направления на ступени — одно место, fieldProgrammes2791 (его заменит шаг профессий).
// • 250 прежних вузов остаются в universities16 (retired2791), их программы уходят из programs16 в retiredPrograms2791:
//   каталог, подбор учёбы близким и детям, «Где учиться» и прочие выборы видят только новые заведения, а prog16 и uni16
//   по-прежнему находят старые по id — начатая учёба, заявки, дипломы, оплата компанией и история работают как раньше,
//   и прежние названия на экране не меняются. Названия дипломов не трогаются.
// • Ступени по виду (kinds2791): исследовательские, технические и медицинские вузы — бакалавриат, магистратура, PhD и
//   дополнительное образование; университеты, педагогические и юридические — без PhD (PhD при престиже 4–5);
//   бизнес-школы, вузы искусств, консерватории, киношколы, театральные и открытые — бакалавриат, магистратура и
//   дополнительное; вузы прикладных наук — бакалавриат и дополнительное; колледж с бакалавриатом — ещё и профессиональное;
//   колледжи, профессиональные колледжи и учебные центры — профессиональное и дополнительное. Вузу со своей
//   профессиональной школой (турецкие MYO, вокационные факультеты Индонезии, СПО при университете) — ещё и профессиональное.
// • Престиж 1–5 → 48/58/70/82/92 (как у профилей catalog16: от технического колледжа до исследовательского вуза), отбор
//   1–5 → 35/47/59/71/83, плата: символическая ×0,15, низкая ×0,5, средняя ×1, высокая ×1,8, очень высокая ×2,6 к цене
//   страны (countries.tuition), между ступенями — посередине. Дальше — прежние формулы admission16 и tuition16.
// • Язык (english2791): обычно учат на языке страны. Где часть программ на английском (1 — бакалавриат, магистратура и
//   PhD, 2 — только магистратура и PhD), рядом с программой на языке страны есть такая же на английском (id …-en,
//   «… · на английском»), кроме права: свои учатся на родном языке, иностранцы — на английском. Где всё на английском (3),
//   программы на английском, кроме медицины и права, — как у прежних международных вузов.
// • «Берут иностранцев» — только сведения на карточке (иностранцу): в источнике «нет» значит «иностранцев мало, набора
//   для них нет», а не запрет. Заявку иностранец подаёт куда угодно, право учиться нужно к началу учёбы, как раньше.
// • Наследник (continue274), который учился в прежнем вузе, продолжает там же, как до сборки: перевод в прежний вуз
//   своего города или переезд к своему вузу; только если так нельзя — такая же программа нового заведения в своём городе.
// • Каталог программ (admissionView58): сначала заведения вашего города, потом остальные города страны, по престижу и
//   названию; фильтр по направлению, ступени и городу; одна карточка — одно заведение с видом, престижем, платой,
//   направлениями и программами. В окне программы — то же в «О вузе».
// В сохранение нового не пишется ничего, кроме выбранного города в фильтре каталога (path16().view.city2791).
// • 279.1.1: язык заведения из источника (поле данных «fr», «fr+en», «en+fr»; пока только Канада). Французские
//   заведения Монреаля, Квебека, Оттавы и Торонто учат по-французски всему, и праву с медициной тоже; у двуязычных рядом
//   с программой на основном языке — такая же на втором (id …-en или …-fr, «· на английском», «· на французском»):
//   бакалавриат, магистратура, PhD и профессиональные программы, кроме предметов учителя. Подготовка к профессии, одна
//   на страну, у такого заведения есть и на втором языке, и на языке страны. Карточка и «О вузе» называют язык, если он
//   не язык страны. Заявка, предложение или учёба 279.1 на программе, где язык сменился, идёт на прежнем языке, пока она
//   жива: в сохранении s.unisLang27911.pins {id программы: язык} (заполняется при первом чтении сохранения прежней
//   сборки, в том числе восстановленного при открытии игры).

const unis2791On=typeof unis2791Data!=='undefined'&&typeof universities16!=='undefined'&&typeof programs16!=='undefined'&&typeof country16!=='undefined';

// ---------- виды заведений ----------

const BMPC2791=['bachelor','master','phd','certificate'],BMC2791=['bachelor','master','certificate'],VC2791=['vocational','certificate'];
// label — как на карточке после «государственный/частный» (g — род), levels — ступени, phd — с какого престижа есть PhD,
// load и employment — нагрузка и связи с работодателями при престиже 3 (у профилей catalog16 те же диапазоны).
const kinds2791={
 research:{label:'исследовательский университет',g:'m',levels:BMPC2791,load:90,employment:80},
 technical:{label:'технический вуз',g:'m',levels:BMPC2791,load:86,employment:88},
 medical:{label:'медицинский вуз',g:'m',levels:BMPC2791,load:94,employment:90},
 university:{label:'университет',g:'m',levels:BMC2791,phd:4,load:66,employment:66},
 pedagogical:{label:'педагогический вуз',g:'m',levels:BMC2791,phd:4,load:62,employment:62},
 law:{label:'юридический вуз',g:'m',levels:BMC2791,phd:4,load:80,employment:78},
 business:{label:'бизнес-школа',g:'f',levels:BMC2791,load:78,employment:89},
 arts:{label:'вуз искусств и дизайна',g:'m',levels:BMC2791,load:78,employment:68},
 music:{label:'музыкальный вуз',g:'m',levels:BMC2791,load:80,employment:66},
 film:{label:'киношкола',g:'f',levels:BMC2791,load:78,employment:68},
 theatre:{label:'театральный вуз',g:'m',levels:BMC2791,load:78,employment:64},
 open:{label:'открытый университет',g:'m',levels:BMC2791,load:48,employment:58},
 applied:{label:'вуз прикладных наук',g:'m',levels:['bachelor','certificate'],load:69,employment:86},
 dual:{label:'колледж с бакалавриатом',g:'m',levels:['vocational','bachelor','certificate'],load:62,employment:85},
 college:{label:'колледж',g:'m',levels:VC2791,load:54,employment:80},
 vocational:{label:'профессиональный колледж',g:'m',levels:VC2791,load:52,employment:83},
 centre:{label:'учебный центр',g:'m',levels:VC2791,load:50,employment:80}
};
const prestige2791={1:48,2:58,3:70,4:82,5:92},quality2791={1:62,2:68,3:76,4:84,5:90},select2791={1:35,2:47,3:59,4:71,5:83};
const tierMul2791=[.15,.5,1,1.8,2.6];
// Слово при «плата …»: у «бесплатных» вузов цена всё же есть (взносы, ×0,15) — «символическая», не «бесплатно».
const tierWords2791={0:'символическая',.5:'очень низкая',1:'низкая',1.5:'ниже средней',2:'средняя',2.5:'выше средней',3:'высокая',3.5:'высокая',4:'очень высокая'};
function tierPrice2791(t){const lo=Math.floor(t),hi=Math.ceil(t);return lo===hi?tierMul2791[lo]:(tierMul2791[lo]+tierMul2791[hi])/2;}
function kindLevels2791(kind,prestige){const k=kinds2791[kind]||kinds2791.university;return k.phd&&prestige>=k.phd?BMPC2791:k.levels;}
/* 279.1.1: язык заведения. Копии на втором языке — у этих ступеней (сертификаты, как и в 279.1, без копий). */
const copyLevels27911=['bachelor','master','phd','vocational'];
function langPrep27911(l){const n=String(typeof lang16!=='undefined'&&lang16[l]||l).toLowerCase();return n.endsWith('ий')?n.slice(0,-2)+'ом':n;}

// ---------- программы направления: одно место ----------

// Какие программы есть у направления на ступени: общая, профили искусства и медиа (careers45), предметы учителей
// (teaching26) и подготовка к профессиям с обязательным дипломом (careers68) — те же 56 названий, что были в игре.
// base — общая программа этого заведения на этой ступени. Шаг профессий заменит эту функцию своим списком.
// Профили — те, о которых говорит строка программ заведения (консерватория — «Музыка и звук», киношкола — «Кино…»);
// если строка молчит — по виду заведения, у университетов — все. Подготовка к рабочим профессиям (ступень
// «профессиональное») — в каждом колледже с этим направлением; к остальным — одна на страну (как было в careers68),
// её добавляет buildUnis2791: у вуза она совпадала бы с общей программой направления.
const trackWords2791={finearts:/живоп|иллюстр|изобраз|скульпт|(?<![а-яё])граф(ик|ическ)|дизайн|рисун|керамик|ювелир|изящн|художеств|комикс|манг/,
 cinema:/кино|фильм|анимац|сценар|режисс|телевид|видео|экран|(?<![а-яё])монтаж|операторск/,theatre:/театр|актёр|актер|танц|балет|хореограф|сценическ|драм|(?<![а-яё])опер[аынуе]|мюзикл|цирк|кукол/,
 music:/музык|вокал|композ|исполнит|джаз|звук|оркестр|дириж|фортепиан|струнн|духов/,
 literature:/литератур|филолог|редакт|писател|словесн/,publishing:/издат|книж|полиграф/,translation:/перевод|лингвист|язык/,
 journalism:/журналист|медиа|коммуникац|телевид|радио|реклам|связи с общ/};
const trackKind2791={music:['music'],film:['cinema'],theatre:['theatre'],arts:['finearts']};
function tracksFor2791(u,field){
 const all=(typeof studyTracks45!=='undefined'&&studyTracks45[field])||[];
 const text=String(u.programs2791||'').toLowerCase(),said=all.filter(([id])=>trackWords2791[id]?.test(text)).map(([id])=>id);
 const kind=(trackKind2791[u.kind2791]||[]).filter(id=>all.some(([t])=>t===id));
 const keep=new Set([...said,...kind]);
 return keep.size?all.filter(([id])=>keep.has(id)):trackKind2791[u.kind2791]?[]:all;
}
function fieldProgrammes2791(u,base){
 const out=[base],{field,level}=base;
 if(typeof studyTracks45!=='undefined'&&studyTracks45[field]&&['bachelor','master','certificate'].includes(level))
  for(const [track,label] of tracksFor2791(u,field))out.push({...base,id:base.id+'-track45-'+track,track45:track,subjectLabel45:label});
 if(typeof teachingSubjects26!=='undefined'&&field==='education'&&['bachelor','certificate'].includes(level))
  for(const subject of Object.keys(teachingSubjects26))out.push({...base,id:base.id+'-'+subject,subject26:subject,subjectLabel26:teachingSubjects26[subject].name,months:level==='certificate'?12:base.months,minLanguage:4,selectivity:base.selectivity+(subject==='math'||subject==='english'?5:0)});
 if(typeof professions16!=='undefined'&&level==='vocational')for(const role of professions16.filter(r=>r.required===level&&r.field===field))
  out.push(occupationProgramme2791(u,base,role));
 return out;
}
function occupationProgramme2791(u,base,role){
 return {...base,id:'profession68-'+u.id+'-'+role.id,field:role.field,occupation68:role.id,
  subjectLabel68:(typeof vocationalTitles68!=='undefined'&&vocationalTitles68[role.id])||'Подготовка по профессии «'+role.title+'»'};
}
// Та же программа на английском (там, где часть программ на английском): свои учатся на языке страны, иностранцы — на
// английском. Право — только на языке страны (как раньше у международных вузов).
const englishLevels2791={1:['bachelor','master','phd'],2:['master','phd']};
function englishVariant2791(u,base){
 if(base.field==='law'||base.language==='en'||!englishLevels2791[u.english2791]?.includes(base.level))return null;
 return {...base,id:base.id+'-en',language:'en',english2791:true};
}
/* 279.1.1: у двуязычного заведения (данные «fr+en», «en+fr») — те же программы ступени на втором языке, право тоже
   (в Канаде оба языка свои), кроме предметов учителя (у них свой язык предмета). id — id программы и «-en» / «-fr». */
function languageCopies27911(own,lang){
 if(!own.length||!copyLevels27911.includes(own[0].level))return [];
 return own.filter(p=>!p.subject26&&p.language!==lang).map(p=>({...p,id:p.id+'-'+lang,language:lang,copy27911:lang,...(lang==='en'?{english2791:true}:{})}));
}
// Язык программы в 279.1: язык страны, у целиком английских — английский, кроме медицины и права.
function oldLanguage27911(u,field){return u.intl2791&&field!=='medicine'&&field!=='law'?'en':country16[u.country][0];}
// Общая программа — формулы catalog16 (programs16): срок по стране и ступени, цена от countries.tuition, язык, нагрузка.
// Отбор программы: отбор заведения и надбавка ступени, как в catalog16; вместо «+3 за каждое следующее направление»
// (порядок направлений в данных случайный) — медицине +6.
function baseProgramme2791(u,field,level){
 const cfg=country16[u.country];
 return {id:u.id+'-'+field+'-'+level,university:u.id,field,level,country:u.country,city:u.city,
  language:u.lang27911||(u.international&&field!=='medicine'&&field!=='law'?'en':cfg[0]), /* 279.1.1: язык заведения */
  minLanguage:level==='phd'?5:level==='vocational'||level==='certificate'?3:4,
  months:level==='vocational'?cfg[6]:level==='certificate'?9:field==='medicine'&&level==='bachelor'?72:cfg[{bachelor:1,master:2,phd:3}[level]],
  fee:Math.round(countries[u.country].tuition*u.price*(level==='certificate'?.5:level==='phd'?.7:1)*(field==='medicine'?1.3:1)/12),
  selectivity:Math.min(97,u.selectivity+(field==='medicine'?6:0)+(level==='phd'?10:level==='master'?5:level==='certificate'?-20:0)),
  hours:Math.round(u.load/10)+(level==='phd'?3:0),difficulty:u.load,quality:u.quality,employment:u.employment,prestige:u.prestige,scholarships:u.scholarships};
}

// ---------- заведения ----------

const retiredPrograms2791=[];
const unis2791=[];
function makeUni2791(country,row){
 const [n,city,name,kind,pub,fields,prestige,selectivity,tier,foreigners,english,programs,voc,langs]=row;
 const levels=kindLevels2791(kind,prestige);
 const k=kinds2791[kind]||kinds2791.university;
 /* 279.1.1: язык заведения из данных — основной и второй для части программ; нет — как в 279.1 */
 const own=String(langs||'').split('+').filter(l=>typeof lang16!=='undefined'&&lang16[l]),intl=Number(english)===3&&country16[country]?.[0]!=='en';
 return {id:country+'-n'+n,country,city,name,fields:String(fields).split(' ').filter(f=>fields16[f]),
  prestige:prestige2791[prestige],selectivity:select2791[selectivity],price:tierPrice2791(tier),
  load:Math.max(40,Math.min(96,k.load+(prestige-3)*2)),quality:quality2791[prestige],
  employment:Math.max(50,Math.min(95,k.employment+(prestige-3)*2)),
  scholarships:kind==='business'?.12:prestige>=4&&['research','technical','medical'].includes(kind)?.42:.28,
  english2791:own.length||country16[country]?.[0]==='en'?0:Number(english)||0,
  international:!own.length&&intl,
  ...(own.length?{lang27911:own[0],copies27911:own.slice(1),intl2791:intl}:{}),
  kind2791:kind,public2791:!!pub,stars2791:prestige,select2791:selectivity,tier2791:tier,foreigners2791:!!foreigners,
  levels2791:voc&&!levels.includes('vocational')?['vocational',...levels]:levels,programs2791:programs||''};
}
(function buildUnis2791(){
 if(!unis2791On)return;
 for(const u of universities16)u.retired2791=true;
 // Все нынешние программы — прежних вузов (и подготовка к профессиям careers68 при них): в сторону, по id находятся.
 retiredPrograms2791.push(...programs16.splice(0));
 for(const [country,rows] of Object.entries(unis2791Data.countries)){
  if(!country16[country]||!countries[country])continue;
  for(const row of rows){const u=makeUni2791(country,row);if(cities[country]?.includes(u.city)&&u.fields.length)unis2791.push(u);}
 }
 universities16.push(...unis2791);
 const byUni=new Map(),hasRole=new Set();
 for(const u of unis2791){const list=[];byUni.set(u.id,list);for(const field of u.fields)for(const level of u.levels2791){
  const base=baseProgramme2791(u,field,level),en=englishVariant2791(u,base),own=fieldProgrammes2791(u,base);
  list.push(...own);if(en)list.push(en);
  for(const lang of u.copies27911||[])list.push(...languageCopies27911(own,lang)); /* 279.1.1 */
 }}
 for(const list of byUni.values())for(const p of list)if(p.occupation68)hasRole.add(p.country+'|'+p.occupation68);
 // Подготовка к профессии с обязательным вузовским дипломом (и к рабочей, если в стране её направлению на этой ступени
 // не учат нигде) — одна на страну, в самом сильном заведении, где учат этому направлению на этой ступени, а если такого
 // нет — в самом сильном заведении этой ступени (так careers68 брал первую программу ступени): путь есть в каждой стране.
 if(typeof professions16!=='undefined')for(const role of professions16.filter(r=>r.required))for(const country of Object.keys(unis2791Data.countries)){
  if(hasRole.has(country+'|'+role.id))continue;
  const offers=unis2791.filter(u=>u.country===country&&u.levels2791.includes(role.required)),own=offers.filter(u=>u.fields.includes(role.field));
  const host=(own.length?own:offers).sort(rankUni2791)[0];
  if(!host)continue;
  const list=byUni.get(host.id),plain=p=>p.level===role.required&&!p.track45&&!p.subject26&&!p.occupation68;
  const base=list.find(p=>plain(p)&&!p.english2791&&!p.copy27911&&p.field===role.field)||list.find(p=>plain(p)&&!p.english2791&&!p.copy27911); /* 279.1.1: и не копия */
  if(base){
   const occ=occupationProgramme2791(host,{...base,field:role.field},role);list.push(occ);hasRole.add(country+'|'+role.id);
   /* 279.1.1: у двуязычного заведения — и на втором языке, как его другие программы; у заведения не на языке страны —
      ещё и на языке страны: другой такой программы в стране нет (новые id …-en / …-fr, у прежней id и язык заведения) */
   const local=country16[country][0],langs=[...(host.copies27911||[])];
   const extra=host.lang27911&&host.lang27911!==local&&!langs.includes(local);if(extra)langs.push(local);
   for(const lang of langs){const c=languageCopies27911([occ],lang);list.push(...c);if(c.length&&extra&&lang===local)(host.occCopies27911||=[]).push([local,role.title]);}
  }
 }
 // 279.1.1: программа, которая в 279.1 учила на другом языке, помнит его (was27911) — для заявок и учёбы тех лет.
 const uniOf=new Map(unis2791.map(u=>[u.id,u]));
 for(const [id,list] of byUni){const u=uniOf.get(id);if(u.lang27911)for(const p of list){const old=oldLanguage27911(u,p.field);if(!p.copy27911&&p.language!==old)p.was27911=old;}}
 for(const list of byUni.values())programs16.push(...list);
})();

// ---------- поиск по id: Map вместо перебора ----------

const progIndex2791=new Map(),uniIndex2791=new Map();let progCount2791=-1,uniCount2791=-1;
function progIndexed2791(){
 if(progCount2791!==programs16.length+retiredPrograms2791.length){
  progIndex2791.clear();
  // как programs16.find: побеждает первая запись с таким id
  for(const p of programs16)if(!progIndex2791.has(p.id))progIndex2791.set(p.id,p);
  for(const p of retiredPrograms2791)if(!progIndex2791.has(p.id))progIndex2791.set(p.id,p);
  progCount2791=programs16.length+retiredPrograms2791.length;
 }
 return progIndex2791;
}
function uniIndexed2791(){
 if(uniCount2791!==universities16.length){uniIndex2791.clear();for(const u of universities16)if(!uniIndex2791.has(u.id))uniIndex2791.set(u.id,u);uniCount2791=universities16.length;}
 return uniIndex2791;
}
function uniById2791(id){return uniIndexed2791().get(id);}
// Программы страны (для каталога): перебирать 33 тысячи строк на каждую отрисовку — заметно на телефоне.
const byCountry2791=new Map();let byCountryCount2791=-1;
function countryPrograms2791(country){
 if(byCountryCount2791!==programs16.length){byCountry2791.clear();for(const p of programs16){const l=byCountry2791.get(p.country);if(l)l.push(p);else byCountry2791.set(p.country,[p]);}byCountryCount2791=programs16.length;}
 return byCountry2791.get(country)||[];
}

// ---------- 279.1.1: прежний язык у заявок и учёбы 279.1 ----------

// Заявка, предложение или учёба 279.1 на программе, где язык сменился (was27911), идёт на прежнем языке: prog16 отдаёт
// такую же программу на прежнем языке (те же id, название и всё остальное). Список — s.unisLang27911.pins {id: язык}.
// Сохранение прежней сборки (поля нет) получает его при чтении: действующие заявки и учёба игрока на таких программах.
// Новая жизнь — пустой список. Заявка или учёба закончилась — прежний язык больше не действует (pinOf27911), новая заявка
// на ту же программу — уже на нынешнем языке (apply16 снимает привязку), из списка программа уходит при следующем чтении.
const activeApplication27911=['submitted','offered','accepted','enrolled'];
function activePrograms27911(life){
 const x=life&&life.path16;if(!x||typeof x!=='object')return [];
 const ids=(Array.isArray(x.applications)?x.applications:[]).filter(a=>a&&activeApplication27911.includes(a.status)).map(a=>a.program);
 if(x.study&&x.study.program)ids.push(x.study.program);
 return ids;
}
function langPins27911(life){
 if(!life||typeof life!=='object')return;
 const had=life.unisLang27911&&typeof life.unisLang27911==='object'&&life.unisLang27911.pins&&typeof life.unisLang27911.pins==='object'?life.unisLang27911.pins:null,pins={};
 for(const id of activePrograms27911(life)){
  const p=progIndexed2791().get(id);
  if(!p||!p.was27911)continue;
  if(!had)pins[id]=p.was27911;else if(had[id])pins[id]=had[id];
 }
 life.unisLang27911={pins};
}
const pinned27911=new Map();
function pinnedProgramme27911(p,lang){
 const key=p.id+'|'+lang;let q=pinned27911.get(key);
 if(!q||q.source27911!==p){q={...p,language:lang};Object.defineProperty(q,'source27911',{value:p});pinned27911.set(key,q);}
 return q;
}
function pinOf27911(p){const pin=p&&p.was27911&&typeof s!=='undefined'&&s&&s.unisLang27911&&s.unisLang27911.pins&&s.unisLang27911.pins[p.id];return pin&&pin!==p.language&&activePrograms27911(s).includes(p.id)?pin:null;} /* 279.1.1: только пока заявка или учёба жива */

// ---------- порядок: ваш город, престиж, название ----------

function homeCity2791(country){try{return s&&country===s.country?residenceCity():null;}catch(e){return null;}}
function rankUni2791(a,b){
 const home=homeCity2791(a.country);
 return (b.city===home)-(a.city===home)||(b.prestige||0)-(a.prestige||0)||String(a.name).localeCompare(String(b.name),'ru');
}
function rankPrograms2791(list){
 const order=new Map();
 [...new Set(list.map(p=>p.university))].map(uniById2791).filter(Boolean).sort(rankUni2791).forEach((u,i)=>order.set(u.id,i));
 return list.map((p,i)=>[p,i]).sort((a,b)=>(order.get(a[0].university)??1e9)-(order.get(b[0].university)??1e9)||a[1]-b[1]).map(x=>x[0]);
}

// ---------- карточка заведения: вид, престиж, плата, направления ----------

function kindLine2791(u){
 const k=kinds2791[u.kind2791]||kinds2791.university,adj=u.public2791?{m:'государственный',f:'государственная'}[k.g]:{m:'частный',f:'частная'}[k.g];
 return cap2791(adj+' '+k.label);
}
function cap2791(t){t=String(t||'');return t.charAt(0).toUpperCase()+t.slice(1);}
function stars2791(n){return '★'.repeat(n)+'☆'.repeat(5-n);}
function priceWord2791(u){return tierWords2791[u.tier2791]||tierWords2791[Math.round(u.tier2791)]||'';}
function fieldsLine2791(u){return u.fields.map(f=>fields16[f]?.name).filter(Boolean).map((t,i)=>i?t.charAt(0).toLowerCase()+t.slice(1):t).join(', ');}
// На карточке каталога — коротко: у больших университетов «10 из 12 · не учат: …», строка программ — первые шесть.
function fieldsShort2791(u){
 const all=Object.keys(fields16),miss=all.filter(f=>!u.fields.includes(f));
 if(!miss.length)return 'все '+all.length;
 if(u.fields.length>=8)return u.fields.length+' из '+all.length+' · не учат: '+miss.map(f=>fields16[f].name.toLowerCase()).join(', ');
 return fieldsLine2791(u);
}
function programsShort2791(u){const list=String(u.programs2791||'').split(', ').filter(Boolean);return list.slice(0,6).join(', ')+(list.length>6?' и другие':'');}
// Подпись кнопки программы на карточке: у подготовки к профессии — сама профессия.
function chipLabel2791(p){const r=p.occupation68&&!(typeof vocationalTitles68!=='undefined'&&vocationalTitles68[p.occupation68])&&profession16(p.occupation68);return r?r.title+(p.copy27911?' · на '+langPrep27911(p.copy27911):''):programName26(p);} /* 279.1.1: язык копии */
// «Берут иностранцев» / «иностранцев мало» — только тому, кто учится в этой стране как иностранец (нет гражданства и
// вида на жительство). Это сведения, не условие: заявку можно подать и туда, где иностранцев мало.
function foreignNote2791(u){
 if(!u||!s||typeof permission16!=='function')return '';
 let foreign=false;try{foreign=!permission16(u.country,'study');}catch(e){}
 return foreign?(u.foreigners2791?'берут иностранцев':'иностранцев мало'):'';
}
// Язык в «О вузе» — только если у заведения правда есть программы на английском.
function englishLine2791(u){
 const fields=u.fields.filter(f=>f!=='law'),has=englishLevels2791[u.english2791]?.some(l=>u.levels2791.includes(l))&&fields.length;
 if(u.english2791===3)return u.fields.some(f=>f!=='law'&&f!=='medicine')?'Учат на английском, кроме медицины и права.':'';
 return !has?'':u.english2791===1?'Часть программ есть и на английском.':'Магистратура и PhD есть и на английском.';
}
/* 279.1.1: язык заведения, если он не язык страны, и второй язык части программ; подготовка к профессии, одна на страну, —
   ещё и на языке страны («Подготовка по профессии «Помощник юриста» есть и на английском»). */
function languageLine27911(u){
 const local=country16[u.country]?.[0],copies=u.levels2791.some(l=>copyLevels27911.includes(l))?(u.copies27911||[]):[];
 const also=copies.length?'часть программ есть и на '+copies.map(langPrep27911).join(' и '):'';
 const occ=(u.occCopies27911||[]).filter(([l])=>!copies.includes(l)),occLine=occ.length?' Подготовка по профессии '+occ.map(([,t])=>'«'+t+'»').join(', ')+' есть и на '+langPrep27911(occ[0][0])+'.':'';
 if(u.lang27911!==local)return 'Учат на '+langPrep27911(u.lang27911)+(also?', '+also:'')+'.'+occLine;
 return (also?cap2791(also)+'.':'')+occLine;
}
function aboutUni2791(u){
 if(!u?.kind2791)return '';
 const price=priceWord2791(u);
 return [kindLine2791(u)+', престиж '+u.stars2791+' из 5.',price?'Плата: '+price+(u.tier2791===0?', только взносы':'')+'.':'',
  u.lang27911?languageLine27911(u):englishLine2791(u),'Направления: '+fieldsLine2791(u)+'.',
  u.programs2791?'Здесь учат: '+u.programs2791+'.':''].filter(Boolean).join(' ');
}

if(unis2791On){
 prog16=function(id){const p=progIndexed2791().get(id),pin=pinOf27911(p);return pin?pinnedProgramme27911(p,pin):p;}; /* 279.1.1: прежний язык */
 uni16=function(p){return uniIndexed2791().get(p.university);};

 // Программа на английском рядом с такой же на языке страны: в названии — язык (каталог, заявки, учёба, диплом).
 const programNameBase2791=programName26;
 programName26=function(p,...rest){const n=programNameBase2791.call(this,p,...rest);return p?.english2791?n+' · на английском':p?.copy27911?n+' · на '+langPrep27911(p.copy27911):n;}; /* 279.1.1: и на французском */
 // 279.1.1: сохранение прежней сборки при чтении получает список программ с прежним языком (см. langPins27911),
 // новая жизнь — пустой.
 if(typeof parseLife==='function'){
  const parseLifeBase27911=parseLife;
  parseLife=function(...args){const life=parseLifeBase27911.apply(this,args);try{langPins27911(life);}catch(e){console.error(e);}return life;};
 }
 if(typeof start==='function'){
  const startBase27911=start;
  start=function(...args){const out=startBase27911.apply(this,args);try{if(s&&typeof s==='object'&&!s.unisLang27911)s.unisLang27911={pins:{}};}catch(e){console.error(e);}return out;};
 }
 // 279.1.1: старое сохранение из прежнего ключа (resume без «Персонажей») — так же, как при чтении.
 if(typeof resume==='function'){
  const resumeBase27911=resume;
  resume=function(...args){const out=resumeBase27911.apply(this,args);try{if(typeof s!=='undefined'&&s&&typeof s==='object'&&!s.unisLang27911)langPins27911(s);}catch(e){console.error(e);}return out;};
 }
 // 279.1.1: новая заявка на программу, где прежний язык уже не действует (прошлая заявка или учёба закончилась), — на
 // нынешнем языке: привязка снимается до подачи, чтобы и при следующем чтении сохранения она не вернулась.
 if(typeof apply16==='function'){
  const applyBase27911=apply16;
  apply16=function(programId,...rest){
   try{const pins=s&&s.unisLang27911&&s.unisLang27911.pins;if(pins&&pins[programId]&&!activePrograms27911(s).includes(programId))delete pins[programId];}catch(e){console.error(e);}
   return applyBase27911.call(this,programId,...rest);
  };
 }
 // 279.1.1: при обычном открытии игры активного персонажа восстанавливает saves.js при своей загрузке — раньше этой
 // обёртки parseLife. Такой персонаж получает список прежних языков здесь (unis2791.js грузится до bootstrap61.js).
 try{if(typeof s!=='undefined'&&s&&typeof s==='object'&&!s.unisLang27911)langPins27911(s);}catch(e){console.error(e);}
}

// ---------- каталог программ: карточка на заведение ----------

const unisUiBase2791={admissionView58:typeof admissionView58==='function'?admissionView58:null,
 programDetails16:typeof programDetails16==='function'?programDetails16:null,openDecision24:typeof openDecision24==='function'?openDecision24:null,
 trainingPrograms68:typeof trainingPrograms68==='function'?trainingPrograms68:null,teachingMenu26:typeof teachingMenu26==='function'?teachingMenu26:null};
const catalogPage2791=6;
function esc2791(t){return typeof esc==='function'?esc(t):String(t??'');}
function plural2791(n,a,b,c){if(typeof plural273==='function')return plural273(n,a,b,c);n=Math.abs(n)%100;const k=n%10;return n>10&&n<20?c:k===1?a:k>1&&k<5?b:c;}
function pct2791(p){return typeof pct273==='function'?pct273(p):pct(p);}
function span2791(m){return typeof span273==='function'?span273(m):m+' мес.';}
function catalogCity2791(country){const v=path16().view.city2791;return v&&cities[country]?.includes(v)?v:'';}
function catalogGroups2791(){
 const v=path16().view,country=v.country||s.country,city=catalogCity2791(country),byUni=new Map();
 const fits=typeof matchesStudy46==='function'?matchesStudy46:()=>true;
 for(let p of countryPrograms2791(country)){
  if(pinOf27911(p))p=prog16(p.id); /* 279.1.1: ваша заявка или учёба — на прежнем языке */
  if(p.field!==v.field||p.level!==v.level||city&&p.city!==city||!fits(p))continue;
  const g=byUni.get(p.university);if(g)g.push(p);else byUni.set(p.university,[p]);
 }
 return [...byUni].map(([id,ps])=>({u:uniById2791(id),ps})).filter(g=>g.u).sort((a,b)=>rankUni2791(a.u,b.u));
}
function chip2791(p,label){return '<button class="small chip2791" onclick="run16(()=>{programDetails16(\''+esc2791(p.id)+'\')})">'+esc2791(label)+'</button>';}
function uniCard2791(g){
 const u=g.u,ps=g.ps,plain=ps.filter(p=>!p.track45&&!p.subject26&&!p.occupation68);
 const adm=p=>{try{return admission16(p);}catch(e){return {why:[],probability:0};}};
 // Главная программа карточки — та, куда вам проще поступить (на языке страны или на английском).
 let main=plain[0]||ps[0],r=adm(main);
 for(const p of plain.slice(1)){const q=adm(p);if(q.why.length<r.why.length||q.why.length===r.why.length&&q.probability>r.probability){main=p;r=q;}}
 const fee=money(localAmount16(main.fee,main.country)),price=priceWord2791(u),foreign=foreignNote2791(u);
 let need='';
 if(r.why.length){let w=r.why[0];try{if(typeof programNeed273==='function')w=programNeed273(w,main).text||w;}catch(e){}need=w;}
 const terms=levels16[main.level]+' · '+span2791(main.months)+' · '+fee+'/мес.'+(main.language!==country16[u.country]?.[0]?' · на '+langPrep27911(main.language):''); /* 279.1.1: любой язык не страны */
 const chance=need?'<span class="need2791">Не хватает: '+esc2791(need)+(r.why.length>1?' и ещё '+(r.why.length-1):'')+'</span>':'<span class="chance2791">Шанс поступить '+pct2791(r.probability)+'</span>';
 const names=ps.map(p=>[p,chipLabel2791(p)]);
 return '<article class="path-card uni2791" data-uni="'+esc2791(u.id)+'"><h3>'+esc2791(u.name)+'</h3>'+
  '<p class="uni-kind2791">'+esc2791(kindLine2791(u))+' · <span class="stars2791" title="Престиж '+u.stars2791+' из 5" aria-label="Престиж '+u.stars2791+' из 5">'+stars2791(u.stars2791)+'</span></p>'+
  '<p class="uni-terms2791">'+esc2791(terms)+(price?' · плата '+esc2791(price):'')+(foreign?' · '+esc2791(foreign):'')+'<br>'+chance+'</p>'+
  '<div class="uni-progs2791">'+names.map(([p,n])=>chip2791(p,n)).join('')+'</div>'+
  '<p class="uni-about2791">Направления: '+esc2791(fieldsShort2791(u))+(u.programs2791?'<br>Здесь учат: '+esc2791(programsShort2791(u)):'')+'</p></article>';
}
function catalogResults2791(){
 const x=path16(),v=x.view,country=v.country||s.country,groups=catalogGroups2791(),n=groups.length;
 const page=Math.max(0,Math.min(v.page||0,Math.ceil(n/catalogPage2791)-1)),home=homeCity2791(country),city=catalogCity2791(country);
 const here=home&&!city?groups.filter(g=>g.u.city===home).length:0;
 let html='';
 groups.slice(page*catalogPage2791,page*catalogPage2791+catalogPage2791).forEach((g,i)=>{
  const k=page*catalogPage2791+i;
  if(home&&!city){
   if(k===0&&here)html+='<h3 class="uni-city2791">'+esc2791(home)+' · '+here+' '+plural2791(here,'заведение','заведения','заведений')+'</h3>';
   if(k===here)html+='<h3 class="uni-city2791">'+(here?'Другие города':'В городе '+esc2791(home)+' такой программы нет · другие города')+' · '+(n-here)+'</h3>';
  }
  html+=uniCard2791(g);
 });
 const lvl=levels16[v.level]||'',what=(fields16[v.field]?.name||'')+' · '+(v.level==='phd'?lvl:lvl.toLowerCase());
 return '<div class="uni-results2791"><p class="uni-count2791">'+n+' '+plural2791(n,'заведение','заведения','заведений')+' · '+esc2791(what)+(n>catalogPage2791?' · страница '+(page+1)+' из '+Math.ceil(n/catalogPage2791):'')+'</p>'+
  (n?html:'<p class="uni-none2791">'+(city?'В городе '+esc2791(city)+' такой программы нет — выберите «Все города».':'В этой стране такой программы нет — попробуйте другую ступень или направление.')+'</p>')+
  (n>catalogPage2791?'<div class="uni-pager2791">'+button16('←',`path16().view.page=${Math.max(0,page-1)}`,page===0)+button16('→',`path16().view.page=${page+1}`,(page+1)*catalogPage2791>=n)+'</div>':'')+'</div>';
}
function citySelect2791(){
 const v=path16().view,country=v.country||s.country;
 const list=[['','Все города'],...(cities[country]||[]).map(c=>[c,c])];
 return select16('city2791',list,'Город');
}
// Фильтры как у вакансий (work2732): направление, ступень и город — сверху, страна и профиль — в «Ещё фильтры»;
// ссылки («К текущей учёбе», «Заявки на поступление», подготовка к профессиям) — под списком.
let catalogFiltersOpen2791=false;
function catalogFiltersToggle2791(el){catalogFiltersOpen2791=!!el.open;}
function catalogView2791(html){
 const m=/<p>\d+ программ · страница \d+<\/p>/.exec(html);
 if(!m)return html;
 const t=document.createElement('template');t.innerHTML=html.slice(0,m.index);
 const root=t.content,labels=[...root.querySelectorAll('label')].filter(l=>l.querySelector('select'));
 const box=document.createElement('template');box.innerHTML=citySelect2791();labels.push(box.content.querySelector('label'));
 const byName=name=>labels.find(l=>l.querySelector('select').getAttribute('aria-label')===name);
 const top=document.createElement('div');top.className='path-filters filters-main2791';
 for(const name of ['Направление','Ступень','Город']){const l=byName(name);if(l)top.append(l);}
 const more=document.createElement('details');more.className='filters2791';more.setAttribute('ontoggle','catalogFiltersToggle2791(this)');
 if(catalogFiltersOpen2791)more.setAttribute('open','');
 const body=document.createElement('div'),words=[];body.className='path-filters';
 for(const l of labels){if(top.contains(l))continue;body.append(l);const sel=l.querySelector('select'),opt=[...sel.options].find(o=>o.hasAttribute('selected'));
  if(opt&&sel.getAttribute('aria-label')==='Страна'&&opt.value!==s.country)words.push(opt.textContent.trim());
  if(opt&&sel.getAttribute('aria-label')!=='Страна'&&opt.value&&opt.value!=='all')words.push(opt.textContent.trim());}
 more.innerHTML='<summary>Ещё фильтры'+(words.length?'<small>'+esc2791(words.join(' · '))+'</small>':'<small>'+esc2791([...body.querySelectorAll('select')].map(x=>String(x.getAttribute('aria-label')||'').toLowerCase()).filter(Boolean).join(', '))+'</small>')+'</summary>';
 more.append(body);
 const h1=root.querySelector('h1'),links=document.createElement('div');links.className='uni-links2791';
 for(const b of [...root.querySelectorAll('button')])if(!b.closest('label'))links.append(b);
 for(const d of [...root.querySelectorAll('.path-filters')])if(!d.querySelector('label'))d.remove();
 const out=document.createElement('div');
 if(h1)out.append(h1);
 out.append(top,more);
 return out.innerHTML+catalogResults2791()+(links.children.length?links.outerHTML:'');
}

// ---------- окно программы и предложение вуза: «О вузе» ----------

function hookCard2791(kinds,p){
 const u=p&&uniById2791(p.university);
 if(!u?.kind2791||typeof nextCard273==='undefined'||!nextCard273||!kinds.includes(nextCard273.kind)||typeof nextCard273.build!=='function'||nextCard273.hook2791)return;
 const build=nextCard273.build;
 nextCard273.hook2791=true;
 nextCard273.build=function(ctx){
  const card=build.call(this,ctx);
  try{
   const about=(card.more||[]).find(m=>m.title==='О вузе');
   const tail='Качество '+p.quality+', сложность '+p.difficulty+', связи с работодателями '+p.employment+'.';
   // 279.1.1: заявка или учёба тех времён, когда здесь учили на другом языке, — на нём и остаётся.
   const kept=p.was27911&&p.language===p.was27911?' Эта программа — на '+langPrep27911(p.language)+'.':'';
   if(about)about.text=aboutUni2791(u)+kept+' '+tail;
   const foreign=foreignNote2791(u);
   if(foreign&&!String(card.sub||'').includes(foreign))card.sub=(card.sub?card.sub+' · ':'')+foreign;
  }catch(e){console.error(e);}
  return card;
 };
}

// ---------- «Где учиться»: свой город и сильные заведения первыми ----------

if(unis2791On){
 if(unisUiBase2791.admissionView58)admissionView58=function(...a){
  const html=unisUiBase2791.admissionView58.apply(this,a);
  try{return catalogView2791(html);}catch(e){console.error(e);return html;}
 };
 if(unisUiBase2791.programDetails16)programDetails16=function(id,...rest){
  try{hookCard2791(['program'],prog16(id));}catch(e){console.error(e);}
  return unisUiBase2791.programDetails16.call(this,id,...rest);
 };
 if(unisUiBase2791.openDecision24)openDecision24=function(kind,id,...rest){
  if(kind==='study')try{const a=path16().applications.find(a=>a.id===id);hookCard2791(['study-offer'],a&&prog16(a.program));}catch(e){console.error(e);}
  return unisUiBase2791.openDecision24.call(this,kind,id,...rest);
 };
 // Подготовка к профессии: в каждом заведении одна программа — именная, если есть, иначе общая направления.
 if(unisUiBase2791.trainingPrograms68)trainingPrograms68=function(role,country,...rest){
  const list=unisUiBase2791.trainingPrograms68.call(this,role,country,...rest),seen=new Map();
  // 279.1.1: из двух программ заведения на разных языках — та, для которой вам хватает языка.
  const lang=p=>{try{return level16(p.language)>=p.minLanguage;}catch(e){return true;}};
  for(const p of list){const old=seen.get(p.university);if(!old||!old.occupation68&&p.occupation68||!!old.occupation68===!!p.occupation68&&!lang(old)&&lang(p))seen.set(p.university,p);}
  return rankPrograms2791(list.filter(p=>seen.get(p.university)===p));
 };
 // Предметы учителя: у каждой кнопки — заведение (в одном городе их теперь несколько), свой город и сильные — первыми.
 // Общий список — по одному заведению на предмет (как раньше по кнопке на предмет), список предмета — до шести.
 if(unisUiBase2791.teachingMenu26)teachingMenu26=function(subject=null,...rest){
  const old=show;
  show=function(title,text,opts=[],...more){
   show=old;
   try{
    if(title==='Предметные специализации'&&Array.isArray(opts)){
     const x=path16(),level=hasDiploma16('education','bachelor')?'certificate':'bachelor',country=x.view.country||s.country;
     const list=rankPrograms2791(programs16.filter(p=>p.subject26&&(!subject||p.subject26===subject)&&p.country===country&&p.level===level));
     const per=new Map(),pick=list.filter(p=>{const n=per.get(p.subject26)||0;per.set(p.subject26,n+1);return n<(subject?6:1);});
     if(!subject){const order=Object.keys(teachingSubjects26);pick.sort((a,b)=>order.indexOf(a.subject26)-order.indexOf(b.subject26));}
     const tail=opts.filter(o=>!/ мес\.$/.test(o?.label||''));
     opts=[...pick.map(p=>({label:teachingSubjects26[p.subject26].name+' · '+uni16(p).name,hint:levels16[p.level]+' · '+span2791(p.months)+' · '+money(localAmount16(p.fee,p.country))+'/мес.',fn:()=>programDetails16(p.id)})),...tail];
    }
   }catch(e){console.error(e);}
   return old.call(this,title,text,opts,...more);
  };
  try{return unisUiBase2791.teachingMenu26.call(this,subject,...rest);}finally{show=old;}
 };
 // Наследник, учившийся в прежнем вузе (continue274): как до сборки — startContinueStudy274 ищет замену среди прежних
 // программ (перевод в прежний вуз своего города или переезд к своему вузу, весь пройденный срок). Если так не вышло
 // (нельзя переехать и в городе прежнего вуза нет), — обычный путь: такая же программа нового заведения рядом.
 if(typeof startContinueStudy274==='function'){
  const continueBase2791=startContinueStudy274;
  startContinueStudy274=function(tr,...rest){
   let old=null;try{old=tr&&prog16(tr.program);}catch(e){}
   if(old&&uniById2791(old.university)?.retired2791){
    const keep=programs16.splice(0);
    for(const p of retiredPrograms2791)programs16.push(p);
    let ok=false;
    try{ok=continueBase2791.call(this,tr,...rest);}
    finally{programs16.length=0;for(const p of keep)programs16.push(p);}
    if(ok)return true;
   }
   return continueBase2791.call(this,tr,...rest);
  };
 }
}

// ---------- стили ----------

(function unisStyle2791(){
 if(!unis2791On||typeof document==='undefined'||document.getElementById('unis2791-style'))return;
 const st=document.createElement('style');
 st.id='unis2791-style';
 st.textContent=[
  '.trajectory .filters-main2791{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:12px 0 2px}',
  '.filters-main2791 label{min-width:0}.filters-main2791 select{width:100%;min-width:0;min-height:40px}',
  'details.filters2791{margin:0 0 6px}details.filters2791 .path-filters{margin-top:6px}',
  'details.filters2791>summary{cursor:pointer;min-height:40px;display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:500}',
  'details.filters2791>summary small{font-weight:400;color:var(--muted);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}',
  '.uni-results2791{margin-top:4px}.uni-count2791{margin:8px 0 0;font-size:13px;color:var(--muted)}',
  '.trajectory h3.uni-city2791{margin:14px 0 2px;font-size:14px;font-weight:600;font-family:inherit}',
  '.trajectory .uni2791{padding:12px 13px;margin:8px 0}.trajectory .uni2791 h3{margin:0 0 4px;font-size:17px;line-height:1.3;overflow-wrap:anywhere}',
  '.uni2791 p{margin:0 0 6px;font-size:13.5px;line-height:1.45}.uni2791 .uni-kind2791{color:var(--muted)}',
  '.uni2791 .stars2791{color:#b07a1a;letter-spacing:1px;white-space:nowrap}',
  '.uni2791 .chance2791{font-weight:500}.uni2791 .need2791{color:#8a4b16}',
  '.uni2791 .uni-progs2791{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px}',
  '.uni2791 .chip2791{margin:0;min-height:40px;padding:4px 12px;font-size:13px;text-align:left}',
  '.uni2791 .uni-about2791{font-size:12.5px;color:var(--muted);margin:0}',
  '.uni-pager2791{display:flex;gap:8px;margin-top:6px}.uni-links2791{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}',
  '@media(max-width:600px){.filters-main2791{gap:6px}.filters-main2791 label{font-size:12px}.filters-main2791 select{font-size:13px;padding-left:6px;padding-right:2px}}'
 ].join('\n');
 document.head.appendChild(st);
})();
