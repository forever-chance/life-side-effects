'use strict';
// Сборка 271: работодатели, вузы и названия своего дела.
//
// СОСТОЯНИЕ: код закончен, прошёл ревью сборки 271 (замечания исправлены) и проверен tools/verify271_employers.js
// и на заготовке данных, и на org-roots.json. Данные — только в org271-data.js. Когда
// docs/names271/org-roots.json обновится (или придёт заново), достаточно запустить  python3 tools/org271_build.py
// и  node tools/verify271_employers.js  — этот файл не меняется. Открытый вопрос к ведущему — потолок
// orgCityMax271 (см. «Набор работодателей города»): это одна константа, тест берёт её из ORG271_CAP.
//
// 1. Работодатели. У города постоянный набор не больше чем из 15 организаций (orgCityMax271): по одной на каждую из
//    12 сфер и 3 сверх того. Название — «<тип> «<корень>»»: тип из сферы профессии, корень страны, который подходит к
//    типу по тегам. Набор зависит только от страны и города, поэтому одна и та же клиника в Казани остаётся той же
//    клиникой. Места делятся так, чтобы профессиям города в сумме было как можно больше «у себя» (orgProfFit271:
//    своё место, где такая работа тоже бывает, название профессии само называет место). Внутри сферы вакансия идёт
//    в ту организацию, где профессии лучше: врач не работает в «Магазинах «Под Липой»», актёр театра — в театре.
//    Но 15 мест на 30 с лишним видов мест не хватает: при 15 часть профессий работает рядом (повар и бариста — в
//    гостинице, пекарь — в супермаркете, фотограф — в творческой студии) или не у себя (библиотекарь — в
//    издательстве, музейный куратор — на киностудии). Таблица по всем городам — tools/verify271_employers.js, раздел 9.
//    Обёртки: makeVacancies16 — новые id получают работодателя 271, вакансия, собранная заново с прежним id (после
//    загрузки страницы рынок строится снова), — прежнего работодателя; replaceVacancy23 — новая вакансия получает
//    работодателя своей профессии; company18 — только когда компания создаётся впервые и у работы нет записанного
//    работодателя; locality95 — три старых «сектора» (engineering/design/retail) теперь тоже из набора города.
//    Уже записанные вакансии, отклики, работа и компания в сохранении не переименовываются.
//    Окно вакансии показывает работодателя в разделе «Условия».
// 2. Вузы. Названия латиницей, тайским и арабским письмом (у 11 поздних стран — «Institute of Urban Studies» без
//    связи с профилем) заменены русскими по профилю вуза: медицинский профиль называется медицинским, поэтому
//    вакансия врача ведёт в медицинский вуз. Прежнее имя — в u.previousName271. Дипломы в сохранениях хранят
//    название строкой и не меняются; восстановление специализации старых дипломов (ensureSpecialties46) сверяет их
//    с прежними названиями, а на экране (учёба, архив учёбы, биография) показывается нынешнее название вуза.
// 3. Своё дело. В окне открытия под полем «Название» — три названия из корней, подходящих виду дела
//    (specialtyTags[специальность], иначе kindTags[вид]; корни с any — в конце), кнопка «Другие варианты» и
//    своё название в том же поле. Работает и для профессиональной школы (schoolOpening196).
const org271={data:null,rosters:new Map(),opening:null};

// ---------- Данные ----------
function orgHash271(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
function orgRng271(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function orgShuffle271(list,rand){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function orgData271(){
 if(org271.data)return org271.data;
 const d=typeof org271Data==='object'&&org271Data?org271Data:null;
 if(!d)return null;
 const types=(d.types||[]).map(([type,field,fit])=>({type,field,fit:new Set(fit)}));
 const countries={};
 for(const [cc,c] of Object.entries(d.countries||{})){
  const roots=(c.roots||[]).map(([root,fit,kind,gloss])=>({root,fit:new Set(fit),kind,gloss:gloss||''}));
  const byField={};
  for(const [field,ids] of Object.entries(c.types||{})){
   // тип без подходящего корня не берём: название из него не собрать
   byField[field]=ids.map(i=>types[i]).filter(t=>t&&roots.some(r=>rootFits271(r,t.fit)));
  }
  countries[cc]={roots,types:byField};
 }
 org271.data={fixture:!!d.fixture,kindTags:d.kindTags||{},specialtyTags:d.specialtyTags||{},countries};
 return org271.data;
}
function rootFits271(r,tags){if(r.fit.has('any'))return true;for(const t of tags)if(r.fit.has(t))return true;return false;}
function orgCountry271(country){return orgData271()?.countries[country]||null;}

// ---------- Профессия → какие организации ей подходят ----------
// Теги профессии — к fit типа (для профессий без своих слов: любая организация сферы с общим тегом ей подходит).
const orgFieldPrefs271={computing:['tech'],engineering:['build-industry','tech'],medicine:['health-care'],care:['health-care'],
 business:['finance-law'],law:['finance-law'],education:['kids-education'],science:['tech'],arts:['creative-media'],
 media:['creative-media'],trade:['craft-repair','build-industry'],service:[]};
const orgProfPrefs271={
 support:['tech','services-home'],gameqa:['tech','creative-media'],gameplay:['tech','creative-media'],data:['tech','finance-law'],sysadmin:['tech','services-home'],
 analyst:['finance-law','tech'],logistics:['build-industry','travel-hotel','trade-shop'],marketer:['creative-media','finance-law'],
 performance:['creative-media','finance-law'],pmm:['tech','creative-media'],producer:['creative-media','tech'],store:['trade-shop','food'],
 careworker:['health-care','services-home'],nanny54:['services-home','kids-education'],pharmacyassistant:['health-care','trade-shop'],socialworker:['health-care','services-home'],
 lab:['health-care','tech'],museumeducator:['creative-media','kids-education','travel-hotel'],
 technician:['build-industry'],electrician16:['services-home','build-industry'],mechanic16:['craft-repair','services-home'],
 welder:['build-industry','craft-repair'],operator:['build-industry'],tailor:['craft-repair','beauty'],landscaper:['services-home','craft-repair'],
 ux:['creative-media','tech'],artist:['creative-media','tech'],animator:['creative-media','tech'],curator:['creative-media','travel-hotel'],
 galleryassistant:['creative-media','trade-shop'],restorer:['creative-media','craft-repair'],
 bookshop:['creative-media','trade-shop','kids-education'],librarian:['kids-education','creative-media'],community:['creative-media','tech'],podcasteditor:['creative-media','tech'],
 baker:['food','cafe-bar'],barista:['cafe-bar','food'],cook16:['food','cafe-bar'],cleaner:['services-home'],courier:['services-home'],
 dogwalker38:['pets','services-home'],groomer38:['pets','beauty'],hair:['beauty'],hotel:['travel-hotel'],
 retail:['trade-shop','food'],shiftManager:['trade-shop','food'],warehouse:['trade-shop','services-home']
};
// [своё место, где тоже бывает, название профессии само называет место] — слова из названий типов.
// «Своё» — организация её вида (актёр — театр, пекарь — пекарня), «рядом» — где такая работа обычна
// (повар — в гостинице, бухгалтер — в любой конторе), иначе — общий тег или ничего общего. Если название
// профессии называет место («Актёр театра», «Ассистент аптеки»), несовпадение заметнее: вес двойной.
const orgHotel271='Гостиниц|Отел|Гестхаус|Гостев|Рёкан|Риад|лодж',orgBake271='Пекарн|Булочн|Кондитер';
const orgProfFit271={
 support:['Сервисный центр|ИТ-компания|Облачн','.'],qa16:['ИТ-компания|Студия разработки|Игров|Веб-студ|Облачн','.'],
 gameqa:['Игров','Студия разработки|ИТ-компания',1],gameplay:['Игров','Студия разработки',1],
 developer:['Студия разработки|ИТ-компания|Облачн|Веб-студ','.'],tools:['Студия разработки|ИТ-компания|Игров|Облачн','.'],
 data:['Лаборатория данных|Аналит|Облачн','.'],sysadmin:['ИТ-компания|Облачн|Сервисный центр','.'],
 marketer:['Маркетинг|Реклам','Цифров|Консалт'],pmm:['Маркетинг','Реклам|Консалт'],performance:['Реклам|Маркетинг',''],
 accountant:['Бухгалтер','.'],analyst:['Аналит|Консалт','Бухгалтер|Маркетинг'],store:['Торгов|Магазин|Супермаркет','',1],
 logistics:['Логист','Торгов'],hrassistant:['Кадров','.'],recruiter:['Кадров','.'],
 lawyer:['Адвокат|Коллеги|Юридическ|Правов','Патент'],paralegal:['Юридическ|Нотари|Правов|Адвокат|Коллеги','Патент'],
 doctor:['Клиник|Больниц|Медицин|Лечеб','Диагност|Хирург'],surgeon:['Хирург|Больниц','Клиник|Медицин|Лечеб'],
 nurse:['Патронаж|Ухода|Реабилит|Пансионат|Центр здоровья','Помощи|Социальн'],careworker:['Ухода|Помощи|Пансионат|Реабилит|Патронаж','Социальн'],
 socialworker:['Социальн|Помощи','Ухода|Патронаж|Пансионат'],pharmacyassistant:['Аптек','',1],nanny54:['Помощи на дому|Патронаж','Социальн|Ухода'],
 lab:['Лаборатор','Исследоват|Научн|Опытн'],researcher:['Исследоват|Научн|Обсерват','Лаборатор|Технопарк|Опытн'],
 researchassistant:['Исследоват|Научн|Лаборатор','Обсерват|Технопарк|Опытн'],
 teacher:['^Школа$|Лицей','Колледж|Языков|Школа|Академ',1],tutor:['Репетитор|Учебн|Языков','Школ|Лицей'],
 lecturer:['Колледж|Академ','Учебн|Лицей',1],kindergarten:['сад','',1],museumeducator:['Музей','Учебн',1],
 engineer:['Конструктор|Инженер|Проект|Техническ','Архитект|Энерг|Строит|Инжинир'],energy:['Энергет','Инженер|Инжинир|Технич|Проект'],
 technician:['Завод|Фабрик|Цех','Мастерск|Верф|Лесопил|варн|Винодел|Артел'],electrician16:['Электромонтаж','Завод|Цех|Фабрик|Автосервис'],
 mechanic16:['Автосервис','^Мастерская$|Цех',1],welder:['Завод|Цех|Верф','Фабрик|^Мастерская$'],operator:['Завод|Фабрик|Цех','Мастерск|Лесопил'],
 tailor:['Ателье|Ткацк|батика','Фабрик|Цех|^Мастерская$|кожи'],
 designer:['Дизайн|Творческ','Анимац|Аниме|Фото'],ux:['Дизайн','Творческ|Анимац'],artist:['Анимац|Аниме|Творческ','Дизайн|Кино'],
 animator:['Анимац|Аниме','Кино|Творческ'],editor:['Кино|Анимац|Аниме','Звукозап|Творческ|Фото'],camera:['Кино','Фото|Анимац'],
 cameraOperator:['Кино','Фото',1],cameraoperator:['Кино','Фото',1],cinematographer:['Кино','Фото|Театр'],sound16:['Звукозап|Кино','Театр|Анимац'],
 illustrator:['Дизайн|Творческ','Анимац|Галере'],bookdesigner:['Дизайн|Творческ',''],
 photographer:['Фото','Кино|Творческ',1],studioassistant:['Фото','Творческ|Кино',1],galleryassistant:['Галере','Творческ',1],
 curator:['Галере|Музей','',1],restorer:['Галере|Музей|Творческ','Ателье'],
 stagehand:['Театр','Кино|самбы|фламенко|Танц',1],lightingtech:['Театр|Кино','Фото|Звукозап'],setdesigner:['Театр','Кино',1],
 stageactor:['Театр','Кино',1],dancer:['Театр|Танц|самбы|фламенко','',1],musician:['Звукозап|Театр','Кино|самбы|фламенко'],
 screenwriter:['Кино|Аниме|Анимац','Театр',1],filmdirector:['Кино|Аниме|Анимац','Театр',1],
 community:['Медиа|Подкаст|Редакц','Информац|Издат|Радио'],copy:['Редакц|Медиа|Издат|Информац','Радио|Подкаст'],
 journalist:['Редакц|Информацион|Радио|Медиа','Подкаст|Издат'],bookeditor:['Издательств','Редакц'],
 librarian:['Библиотек','',1],publishingassistant:['Издательств','Редакц|Книжн',1],proofreader:['Издательств|Редакц|Информац','Медиа'],
 literarytranslator:['Издательств','Редакц|Информац'],literaryagent:['Издательств','Книжн|Редакц'],rightsmanager:['Издательств','Медиа',1],
 archiveassistant:['Библиотек|Архив','Издат|Редакц|Информац'],archivist:['Библиотек|Архив','Редакц|Информац|Издат'],
 bookshop:['Книжн','Библиотек|Издат',1],staffwriter:['Издательств|Редакц','Медиа',1],radioeditor:['Радио','Подкаст|Медиа',1],podcasteditor:['Подкаст|Медиа|Радио','',1],
 cook16:['Ресторан|Кафе|Бистро|Траттори|Такери|Идзакая|Пивн|Кафана|Паб|Дайнер|Кебаб|Шурраскари|Тапас',orgHotel271+'|'+orgBake271],
 barista:['Кафе|Кофейн|Чайн','Ресторан|Бистро|Дайнер|Джелатер|Траттори|'+orgBake271+'|'+orgHotel271],
 hotel:[orgHotel271,'',1],retail:['Супермаркет|Магазин',orgBake271+'|Джелатер'],shiftManager:['Супермаркет|Магазин','',1],
 warehouse:['Супермаркет|Курьер|Склад',''],hair:['Салон красоты','Салон|Баня|Хаммам|'+orgHotel271],groomer38:['Салон',''],
 baker:[orgBake271,'Кафе|Кофейн|Ресторан|Бистро|Траттори|Дайнер|Супермаркет'],
 cleaner:['Клининг',orgHotel271+'|Баня|Хаммам|Супермаркет'],courier:['Курьер','Супермаркет|Ресторан|Кафе|'+orgBake271]
};
// «Не по себе» в организации: 0 — своё место, 3 — рядом, 7 — та же область по тегам, 10 — ничего общего.
// У профессий без своих слов (Специалист госслужбы, Садовник…) — 0 при общем теге, иначе 10.
const orgMissLevels271={own:0,near:3,tag:7,none:10};
const orgPrefsCache271=new Map();
function orgPrefs271(p){
 const key=p?.id||'field:'+(p?.field||'');
 if(orgPrefsCache271.has(key))return orgPrefsCache271.get(key);
 const fit=orgProfFit271[p?.id]||[];
 const q={id:p?.id||null,pref:orgProfPrefs271[p?.id]||orgFieldPrefs271[p?.field]||[],own:fit[0]?new RegExp(fit[0],'i'):null,
  near:fit[1]?new RegExp(fit[1],'i'):null,weight:fit[2]?2:1};
 orgPrefsCache271.set(key,q);
 return q;
}
function orgTagScore271(q,t){let n=0;for(const x of q.pref)if(t.fit.has(x))n++;return n;}
function orgMiss271(q,t){
 const L=orgMissLevels271;
 if(q.own){if(q.own.test(t.type))return L.own;if(q.near&&q.near.test(t.type))return L.near;return orgTagScore271(q,t)?L.tag:L.none;}
 return !q.pref.length||orgTagScore271(q,t)?L.own:L.none;
}
function orgSetCost271(profs,set){let sum=0;for(const q of profs){let m=Infinity;for(const t of set)m=Math.min(m,orgMiss271(q,t));sum+=q.weight*m;}return sum;}
function orgSubsets271(list,k){
 const out=[],acc=[];
 const walk=start=>{if(acc.length===k){out.push([...acc]);return;}for(let i=start;i<=list.length-(k-acc.length);i++){acc.push(list[i]);walk(i+1);acc.pop();}};
 walk(0);
 return out;
}

// ---------- Набор работодателей города ----------
// Потолок — 15 организаций на город (ТЗ: 8–15): по одной на каждую из 12 сфер (иначе вакансии сферы некуда деть)
// и 3 сверх того. Своих мест у профессий около 30 (театр, киностудия, кафе, гостиница, аптека, библиотека…), поэтому
// при 15 часть профессий работает не у себя. Места делятся так, чтобы сумма «не по себе» по всем профессиям города
// (orgMiss271 × вес) была наименьшей: точный перебор наборов типов внутри сферы и распределение мест между сферами.
// Из наборов, которые хуже лучшего не больше чем на orgTolerance271 и ни одной профессии, чьё название называет
// место, не хуже, берётся один по зерну города — так города одной страны отличаются. На настоящих данных при 15
// не у себя остаются, например: библиотекарь и редактор радио — в издательстве, музейный куратор — на киностудии,
// воспитатель детского сада — в лицее, грумер — в супермаркете, управляющий магазином — в
// маркетинговом агентстве (таблица — tools/verify271_employers.js, раздел 9). Потолок — одна константа:
// не у себя при 15 — 11 % профессий, при 20 — 4 %, при 24 — меньше 1 %.
const orgCityMax271=15,orgTolerance271=3;
function orgRoster271(country,city){
 const key=country+'|'+city;
 if(org271.rosters.has(key))return org271.rosters.get(key);
 const c=orgCountry271(country);
 if(!c||typeof fields16!=='object'){org271.rosters.set(key,null);return null;}
 const rand=orgRng271(orgHash271('orgRoster271|'+key));
 const fields=Object.keys(fields16).filter(f=>c.types[f]?.length);
 const spare=Math.max(0,orgCityMax271-fields.length);
 // для каждой сферы и каждого числа k её организаций — набор типов с наименьшей суммой (из почти равных — по зерну)
 const plan=fields.map(f=>{
  const profs=(typeof professions16==='object'?professions16:[]).filter(p=>p.field===f).map(orgPrefs271);
  const strict=profs.filter(q=>q.weight>1),best=[];
  for(let k=1;k<=Math.min(c.types[f].length,spare+1,8);k++){
   const all=orgSubsets271(c.types[f],k).map(set=>({set,cost:orgSetCost271(profs,set)}));
   const min=all.reduce((m,x)=>Math.min(m,x.cost),Infinity),first=all.find(x=>x.cost===min);
   // ради разнообразия городов профессия, чьё название называет место, хуже устроена не становится
   const keep=strict.map(q=>orgSetCost271([q],first.set));
   const near=all.filter(x=>x.cost<=min+orgTolerance271&&strict.every((q,i)=>orgSetCost271([q],x.set)<=keep[i]));
   best.push(near[Math.floor(rand()*near.length)]);
  }
  return {field:f,best};
 });
 // места между сферами: каждой хотя бы одно, всего не больше потолка, сумма — наименьшая; при равной — меньше мест
 let states=new Map([[0,{cost:0,ks:[]}]]);
 for(const g of plan){
  const next=new Map();
  for(const [used,st] of states)g.best.forEach((b,i)=>{
   const u=used+i+1;if(u>Math.max(orgCityMax271,fields.length))return;
   const cost=st.cost+b.cost,cur=next.get(u);
   if(!cur||cost<cur.cost)next.set(u,{cost,ks:[...st.ks,i]});
  });
  states=next;
 }
 let done=null;
 for(const [used,st] of [...states].sort((a,b)=>a[0]-b[0]))if(!done||st.cost<done.cost)done={...st,used};
 // корни: сначала те, что подходят к типу по тегам, корни с any — потом; в городе корни не повторяются
 const roots=orgShuffle271(c.roots,rand),usedRoots=new Set(),names=new Set(),byField={},all=[];
 plan.forEach((g,gi)=>{
  byField[g.field]=[];
  for(const t of g.best[done.ks[gi]].set){
   const fit=roots.filter(r=>rootFits271(r,t.fit));
   const ranked=[...fit.filter(r=>!r.fit.has('any')),...fit.filter(r=>r.fit.has('any'))];
   const r=ranked.find(r=>!usedRoots.has(r.root)&&!names.has(t.type+' «'+r.root+'»'))||ranked.find(r=>!names.has(t.type+' «'+r.root+'»'));
   if(!r)continue;
   usedRoots.add(r.root);
   const e={field:g.field,type:t.type,fit:t.fit,root:r.root,name:t.type+' «'+r.root+'»'};
   names.add(e.name);byField[g.field].push(e);all.push(e);
  }
 });
 const out={country,city,byField,all,cost:done.cost};
 org271.rosters.set(key,out);
 return out;
}
// Внутри сферы — организация, где профессии лучше всего: своё место, потом «рядом», потом по тегам; из равных — по зерну.
function pickEmployer271(list,q,seed){
 if(!list?.length)return null;
 const scores=list.map(t=>orgMiss271(q,t)*10-orgTagScore271(q,t)),min=Math.min(...scores);
 const top=list.filter((_,i)=>scores[i]===min);
 return top[orgHash271(seed)%top.length];
}
// Работодатель вакансии: сфера профессии, внутри неё — ближайший профессии тип. Одна профессия в одном городе —
// всегда одна и та же организация.
function employerFor271(country,city,professionId,seed=professionId){
 const r=orgRoster271(country,city);if(!r)return null;
 const p=typeof profession16==='function'?profession16(professionId):null;
 const field=p?.field&&r.byField[p.field]?.length?p.field:'business';
 return pickEmployer271(r.byField[field],orgPrefs271(p||{field}),String(seed??''))?.name||null;
}
// Общая форма: страна, город, сфера, зерно. Зерно — id профессии этой сферы (тогда выбор как у вакансии) или
// любое значение (тогда одна из организаций сферы по хэшу).
function employerName271(country,city,field,seed=0){
 const r=orgRoster271(country,city),list=r?.byField[field];if(!list?.length)return null;
 const p=typeof seed==='string'&&typeof profession16==='function'?profession16(seed):null;
 if(p&&p.field===field)return employerFor271(country,city,seed);
 return list[orgHash271(String(seed))%list.length].name;
}
function cityEmployers271(country,city){return orgRoster271(country,city)?.all.map(e=>e.name)||[];}

// ---------- Обёртки вакансий и компании ----------
const employers271Base={makeVacancies16,replaceVacancy23,company18,locality95,jobDetailData20};
function employVacancy271(v,force=false){
 if(!v||!v.profession||!v.country||(v.employer271&&!force))return;
 const name=employerFor271(v.country,v.city,v.profession);
 if(name){v.employer=name;v.employer271=true;}
}
// Рынок с тем же ключом собирается заново с теми же id: после загрузки страницы careers45.js сбрасывает marketKey,
// фоновый поиск (backgroundJobSearch78) — тоже. База ставит такой вакансии работодателя по старой карте секторов,
// поэтому у пересобранной вакансии с прежним id работодатель берётся из прежней (записанной) вакансии: и имя 271,
// и имя из сохранения 270 остаются. Новые id получают работодателя 271.
function keepEmployer271(old,v){
 if(!old.employer)return employVacancy271(v);
 v.employer=old.employer;
 if(old.employer271)v.employer271=true;else delete v.employer271;
}
makeVacancies16=function(...args){
 const prev=new Map((path16()?.vacancies||[]).map(v=>[v.id,v]));
 const out=employers271Base.makeVacancies16.apply(this,args);
 for(const v of path16()?.vacancies||[]){
  const old=prev.get(v.id);
  if(!old)employVacancy271(v);
  else if(old!==v)keepEmployer271(old,v);
 }
 return out;
};
replaceVacancy23=function(v,...rest){
 const x=path16(),before=new Set((x?.vacancies||[]).map(q=>q.id));
 const out=employers271Base.replaceVacancy23.call(this,v,...rest);
 // новая вакансия собрана из {...v}: профессия могла смениться, а работодатель остался от старой
 for(const q of path16()?.vacancies||[])if(!before.has(q.id))employVacancy271(q,true);
 return out;
};
company18=function(...args){
 const j=s?.job,fresh=!!j&&!j.company18;
 const co=employers271Base.company18.apply(this,args);
 if(fresh&&co&&j===s.job&&!j.employer&&!co.employer271){
  const name=employerFor271(j.workplace?.country||s.country,j.workplace?.city||residenceCity(),j.professionId);
  if(name){co.name=name;co.employer271=true;}
 }
 return co;
};
locality95=function(country,city){
 const base=employers271Base.locality95(country,city),r=orgRoster271(country,city);
 if(!r)return base;
 const sector=(field,id)=>employerFor271(country,city,id)||r.byField[field]?.[0]?.name;
 return {...(base||{}),name:base?.name||city,
  employers:{engineering:sector('engineering','engineer'),design:sector('arts','designer'),retail:sector('service','retail')},
  employers271:Object.fromEntries(Object.entries(r.byField).map(([f,list])=>[f,list.map(e=>e.name)]))};
};
jobDetailData20=function(v,...rest){
 const d=employers271Base.jobDetailData20.call(this,v,...rest);
 if(v?.employer&&Array.isArray(d?.sections)){
  const g=d.sections.find(g=>g.title==='Условия')||d.sections[0];
  if(g&&Array.isArray(g.rows)&&!g.rows.some(r=>r.label==='Работодатель'))g.rows.unshift(fact20('Работодатель',v.employer));
 }
 return d;
};

// ---------- Вузы ----------
// Профили (catalog16 profiles16): 0 исследовательский университет, 1 политех, 2 искусство и кино, 3 медицина,
// 4 региональный, 5 бизнес-школа, 6 прикладные науки, 7 гуманитарная академия, 8 колледж, 9 открытый университет.
// У первых 14 стран — перевод прежних названий (institutionNames32), у поздних 11 — новые. ru не трогаем.
const uniNames271={
 nl:['Университет Ньивстад','Технический университет Ватердам','Академия изобразительного искусства и кино','Медицинский институт Велдховен','Университет на Сингеле','Бизнес-школа Нордхавен','Высшая профессиональная школа «Де Каде»','Академия Синт-Лауренс','Колледж Рейнпорт','Открытый университет Вестерланд'],
 rs:['Университет имени Светозара Марковича','Технический университет «Дунав»','Академия искусств «Сава»','Медицинский университет «Милена»','Университет Западной Моравы','Бизнес-школа «Дорчол»','Высшая школа прикладных наук «Мост»','Гуманитарная академия имени Бранко Радичевича','Профессиональный колледж «Тамиш»','Открытый университет «Видик»'],
 us:['Университет Уиткомб','Технологический институт Эшфорд','Школа искусств Беллуэзер','Медицинский колледж Нортбридж','Университет Сидар-Вэлли','Бизнес-школа Мерсер-Бэй','Политехнический институт Лейкхерст','Колледж Святой Элинор','Общественный колледж Редвуд','Открытый университет Уэстхейвен'],
 br:['Университет Вали-ду-Ипе','Политехнический институт Серра-Азул','Школа искусств и кино «Маре»','Университет медицинских наук «Аурора»','Университет Риу-Клару-Нову','Бизнес-школа Порту-Сул','Институт прикладных технологий «Арара»','Гуманитарный институт имени Сесилии Мейрелес','Технический колледж «Каминьюс»','Открытый университет Оризонти-Сул'],
 jp:['Университет Сэйран','Технологический университет Хокуё','Университет искусств Мидзуки','Медицинский университет Синсэй','Университет Аобадай','Университет менеджмента Коё','Университет науки и технологий Минато','Гуманитарный университет Цукисиро','Профессиональная школа Сакурагава','Открытый университет Хикари'],
 fr:['Университет де Рив','Политехнический институт Монфокон','Школа искусств и кино «Северный свет»','Медицинский факультет Вальбрюн','Университет Валь-дез-Орм','Бизнес-школа Сен-Клер','Высший институт ремёсел Луары','Институт словесности имени Симоны Вейль','Технический лицей «Липы»','Открытый университет Дё-Рив'],
 es:['Университет Валье-Кларо','Политехнический университет Сьерра-Бланка','Школа искусств и кино «Ла Линтерна»','Университет медицинских наук Сан-Габриэль','Университет Вега-Нуэва','Бизнес-школа Пуэрто-дель-Соль','Высший технологический институт «Леванте»','Гуманитарная академия имени Марии Самбрано','Центр профессионального образования «Лос-Оливос»','Открытый университет Средиземноморья'],
 de:['Университет Хоэнрид','Технический университет Фалькенау','Высшая школа искусства и кино «Моргенрот»','Медицинская высшая школа Линденфельс','Университет на Вальдзее','Высшая торговая школа Нордхафен','Высшая школа прикладных наук Тальхайм','Гуманитарная академия имени Ханны Арендт','Профессиональный колледж «Мюленбах»','Открытая высшая школа Вестмарк'],
 uk:['Университет Олдервик','Технологический институт Нортмир','Школа искусства и кино Брайарфорд','Медицинская школа Святого Освина','Университет Уичкомб','Бизнес-школа Кингсуэлл','Столичный институт Истбридж','Гуманитарный колледж Хартуэлл','Колледж дополнительного образования Фенвик','Открытый университет Уэстмур'],
 ca:['Университет Силверпайн','Технологический институт Лорентиан-Бэй','Школа искусств и кино «Клёны»','Медицинский колледж Нортшор','Университет Прери-Кроссинг','Бизнес-школа Харборлайт','Политехнический институт Мейпл-Кост','Гуманитарный колледж Сент-Обен','Общественный колледж Клируотер','Открытый университет Нортерн-Рич'],
 kr:['Университет Хэсоль','Университет науки и технологий Тонхэ','Университет искусств Пёльбит','Медицинский университет Сэбом','Университет Ханыль','Университет менеджмента Мирэ','Технический университет Чхонрим','Гуманитарный университет Дасом','Профессиональный колледж Нури','Открытый университет Ханбит'],
 cn:['Университет Цинхэ','Политехнический университет Бэйлин','Институт искусств Юньшань','Медицинский университет Миндэ','Университет Хуайчэн','Бизнес-институт Цзиньхай','Институт прикладных технологий Дунъюань','Гуманитарный институт Вэньчуань','Профессионально-технический институт Синъюань','Открытый университет Чэнгуан'],
 mx:['Университет Валье-дель-Мескит','Политехнический институт Сьерра-дель-Вьенто','Школа искусств и кино «Люсьернага»','Университет медицинских наук Санта-Элена','Университет Рио-Насьенте','Бизнес-школа Пуэрта-дель-Мар','Технологический институт Ла-Каньяда','Гуманитарный колледж имени Росарио Кастельянос','Технический колледж «Лос-Ауэуэтес»','Открытый университет Альтиплано'],
 it:['Университет Чинкве-Торри','Политехнический институт Монте-Альто','Академия искусств и кино «Лантерна»','Медицинский университет Санта-Кьяра','Университет Валле-Верде','Бизнес-школа Порта-Нуова','Институт прикладных наук «Ольмо»','Гуманитарная академия имени Наталии Гинзбург','Технический колледж «Ле Фонти»','Открытый университет Адриатики'],
 au:['Университет Блэквуд','Технологический институт Айронбарк','Школа искусства и кино Солтбуш','Медицинская школа Уоттл-Крик','Университет Ривербенд','Бизнес-школа Харбор-Пойнт','Политехнический институт Саутерн-Кросс','Гуманитарный колледж Ред-Гам','Колледж профессионального обучения «Банксия»','Открытый университет Аутбэк'],
 tr:['Университет Гюнешли','Технический университет Демирли','Академия искусств и кино «Фенер»','Медицинский университет Сельви','Университет Ешильвади','Бизнес-школа Кёпрю','Институт прикладных наук «Чынар»','Гуманитарная академия «Лале»','Профессиональный колледж «Тезгях»','Открытый университет Гёкъюзю'],
 za:['Университет Протея','Технологический институт Хайвелд','Школа искусств и кино «Убунту»','Медицинская школа Фейнбос','Университет Кару','Бизнес-школа Тейбл-Бэй','Политехнический институт Вааль','Гуманитарный колледж «Импала»','Технический колледж «Баобаб»','Открытый университет Драконовых гор'],
 th:['Университет Мэнам','Технологический институт Сайтонг','Академия искусств и кино «Дуангдао»','Медицинский университет Чайяпхрук','Университет Пхукхао','Бизнес-школа Тхонгфа','Институт прикладных наук «Нонгнам»','Гуманитарная академия «Буабан»','Технический колледж «Малай»','Открытый университет Ситхонг'],
 no:['Университет Фьелльхейм','Технический университет Нордвик','Академия искусства и кино «Нурдлюс»','Медицинская высшая школа Бьёркли','Университет Эльвеланн','Бизнес-школа Хавнебю','Высшая школа прикладных наук Фоссе','Гуманитарная академия имени Сигрид Унсет','Профессиональная школа Стейнвик','Открытый университет Вестланн'],
 in:['Университет Нилгири','Технологический институт Сахьядри','Академия искусств и кино «Чандни»','Медицинский университет Аарогья','Университет Нармада','Бизнес-школа Сангам','Институт прикладных наук «Удьям»','Гуманитарная академия имени Савитрибай Пхуле','Технический колледж «Вишвакарма»','Открытый университет Гьяндип'],
 id:['Университет Нусантара-Райя','Технологический институт Мерапи','Академия искусств и кино «Ваянг»','Медицинский университет Сехат-Сентоса','Университет Сунгай-Биру','Бизнес-школа Пелабухан','Институт прикладных наук «Бамбу»','Гуманитарная академия имени Картини','Технический колледж «Бенгкел»','Открытый университет Кепулауан'],
 eg:['Университет Эн-Нур','Политехнический институт Эль-Фаджр','Академия искусств и кино «Эль-Камар»','Медицинский университет Эш-Шифа','Университет Эль-Вади','Бизнес-школа Эль-Мина','Институт прикладных наук «Эль-Мустакбаль»','Гуманитарная академия имени Таха Хусейна','Технический колледж «Эль-Варша»','Открытый университет Эль-Афак'],
 ma:['Университет Атлас','Политехнический институт Бурегрег','Академия искусств и кино «Зеллидж»','Медицинский университет Эр-Рахма','Университет Сус','Бизнес-школа Эль-Марса','Институт прикладных наук «Аргания»','Гуманитарная академия имени Фатимы аль-Фихри','Технический колледж «Тадлакт»','Открытый университет Сахель'],
 pl:['Университет Бялы-Брег','Политехнический университет Карконоше','Академия искусств и кино «Гвязда»','Медицинский университет Злоты-Лас','Университет Подгуже','Бизнес-школа Старе-Място','Высшая школа прикладных наук «Явор»','Гуманитарная академия имени Виславы Шимборской','Технический колледж «Кузня»','Открытый университет Поморье']
};
const foreignScript271=/[A-Za-z\u00C0-\u024F\u0600-\u06FF\u0E00-\u0E7F]/;
(function renameUniversities271(){
 if(typeof universities16==='undefined')return;
 for(const u of universities16){
  const name=uniNames271[u.country]?.[u.profile];
  if(!name||!foreignScript271.test(u.name||''))continue;
  u.previousName271=u.name;
  u.name=name+' · '+u.city;
 }
})();
// Старые дипломы без специализации сверяются по названию вуза, записанному при выпуске (ensureSpecialties46,
// вызывается и из save): на время сверки у переименованных вузов прежние названия.
const renamedUnis271=typeof universities16==='undefined'?[]:universities16.filter(u=>u.previousName271);
const previousUniNames271=new Set(renamedUnis271.map(u=>u.previousName271));
if(typeof ensureSpecialties46==='function'&&renamedUnis271.length){
 const uniSpecialtiesBase271=ensureSpecialties46;
 ensureSpecialties46=function(...args){
  if(!s||!(path16()?.diplomas||[]).some(d=>!d.track45&&previousUniNames271.has(d.university)))return uniSpecialtiesBase271.apply(this,args);
  const now=renamedUnis271.map(u=>u.name);
  renamedUnis271.forEach(u=>{u.name=u.previousName271;});
  try{return uniSpecialtiesBase271.apply(this,args);}finally{renamedUnis271.forEach((u,i)=>{u.name=now[i];});}
 };
}
// Диплом хранит название вуза строкой, и в сохранении оно остаётся прежним (по нему сверяется ensureSpecialties46).
// На экране — нынешнее название: учёба (educationView16), архив учёбы (studyArchive58) и биография (bioRows).
// Одно прежнее название бывает у вузов разных стран, поэтому сначала по стране диплома.
const uniRenamed271=new Map();
for(const u of renamedUnis271){
 uniRenamed271.set(u.country+'|'+u.previousName271,u.name);
 const same=uniRenamed271.get('|'+u.previousName271);
 uniRenamed271.set('|'+u.previousName271,same===undefined||same===u.name?u.name:null);
}
function currentUniName271(name,country){
 if(!previousUniNames271.has(name))return name;
 return uniRenamed271.get(country+'|'+name)||uniRenamed271.get('|'+name)||name;
}
function diplomaRenames271(){
 const out=new Map();
 for(const d of path16()?.diplomas||[]){
  const now=currentUniName271(d.university,d.country);
  if(now!==d.university)out.set(d.university,now);
 }
 return [...out].sort((a,b)=>b[0].length-a[0].length);
}
function renameUniText271(text,pairs,html){
 if(typeof text!=='string')return text;
 for(const [from,to] of pairs){const a=html?esc(from):from;if(text.includes(a))text=text.split(a).join(html?esc(to):to);}
 return text;
}
const uniDisplayBase271={educationView16:typeof educationView16==='function'?educationView16:null,
 studyArchive58:typeof studyArchive58==='function'?studyArchive58:null,bioRows:typeof bioRows==='function'?bioRows:null};
if(renamedUnis271.length){
 for(const k of ['educationView16','studyArchive58'])if(uniDisplayBase271[k])window[k]=function(...args){
  const html=uniDisplayBase271[k].apply(this,args);
  const pairs=s?diplomaRenames271():[];
  return pairs.length?renameUniText271(html,pairs,true):html;
 };
 if(uniDisplayBase271.bioRows)bioRows=function(...args){
  const rows=uniDisplayBase271.bioRows.apply(this,args);
  const pairs=s?diplomaRenames271():[];
  if(pairs.length&&Array.isArray(rows))for(const r of rows)if(Array.isArray(r))for(let i=0;i<r.length;i++)r[i]=renameUniText271(r[i],pairs,false);
  return rows;
 };
}

// ---------- Своё дело: выбор названия ----------
function businessTags271(type,specialty){
 const d=orgData271();if(!d)return [];
 return (specialty&&d.specialtyTags[specialty])||d.kindTags[type]||[];
}
// Все корни страны, подходящие виду дела, в порядке показа: сначала по тегам вида, потом корни с any.
function businessRoots271(country,type,specialty,seed=''){
 const c=orgCountry271(country),tags=businessTags271(type,specialty);
 if(!c||!tags.length)return [];
 const rand=orgRng271(orgHash271('business271|'+country+'|'+type+'|'+(specialty||'')+'|'+seed));
 const fit=orgShuffle271(c.roots.filter(r=>rootFits271(r,tags)),rand);
 return [...fit.filter(r=>!r.fit.has('any')),...fit.filter(r=>r.fit.has('any'))];
}
function businessNames271(country,type,specialty,offset=0,count=3,exclude=[],seed=''){
 const skip=new Set(exclude.map(x=>String(x).trim().toLowerCase()));
 const list=businessRoots271(country,type,specialty,seed).filter(r=>!skip.has(r.root.toLowerCase()));
 if(list.length<=count)return list.map(r=>({name:r.root,gloss:r.gloss}));
 return Array.from({length:count},(_,i)=>list[(offset+i)%list.length]).map(r=>({name:r.root,gloss:r.gloss}));
}
function takenBusinessNames271(){
 const owned=typeof ownedEnterprises168==='function'?ownedEnterprises168():[s?.enterprise152].filter(Boolean);
 return [...owned.map(b=>b.title),...(s?.enterpriseNetworks168||[]).map(n=>n.title)].filter(Boolean);
}
function namePickerHTML271(ctx,offset){
 const taken=takenBusinessNames271(),names=businessNames271(s.country,ctx.type,ctx.specialty,offset,3,taken,ctx.seed);
 if(!names.length)return '';
 const skip=new Set(taken.map(x=>String(x).trim().toLowerCase()));
 const more=businessRoots271(s.country,ctx.type,ctx.specialty,ctx.seed).filter(r=>!skip.has(r.root.toLowerCase())).length>3;
 return names.map(n=>'<button type="button" class="name-choice271" data-name="'+esc(n.name)+'"'+(n.gloss?' title="'+esc(n.gloss)+'"':'')+
   ' aria-pressed="false" onclick="pickBusinessName271(this)">'+esc(n.name)+'</button>').join('')+
  (more?'<button type="button" class="name-more271" onclick="moreBusinessNames271(this)">Другие варианты</button>':'');
}
function pickerInput271(box){return document.getElementById(box?.dataset.input||'');}
function markPicked271(box){
 const value=(pickerInput271(box)?.value||'').trim();
 box.querySelectorAll('.name-choice271').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.name===value)));
}
function pickBusinessName271(button){
 const box=button.closest('.name-picker271'),input=pickerInput271(box);
 if(!input)return;
 input.value=button.dataset.name;
 markPicked271(box);
}
function moreBusinessNames271(button){
 const box=button.closest('.name-picker271');
 if(!box)return;
 const ctx={type:box.dataset.type,specialty:box.dataset.specialty||null,seed:box.dataset.seed};
 const offset=(+box.dataset.offset||0)+3;
 box.dataset.offset=String(offset);
 box.querySelector('.name-options271').innerHTML=namePickerHTML271(ctx,offset);
 markPicked271(box);
}
function namePicker271(inputId,ctx){
 const input=document.getElementById(inputId),label=input?.closest('label');
 if(!input||!label||label.parentElement?.querySelector('.name-picker271'))return;
 ctx.seed=String(s.clock?.ticks??0)+'|'+takenBusinessNames271().length;
 const options=namePickerHTML271(ctx,0);
 if(!options)return;
 label.insertAdjacentHTML('afterend','<div class="name-picker271" data-input="'+inputId+'" data-type="'+esc(ctx.type)+
  '" data-specialty="'+esc(ctx.specialty||'')+'" data-seed="'+esc(ctx.seed)+'" data-offset="0">'+
  '<p class="sub">Можно взять готовое название или вписать своё.</p><div class="name-options271">'+options+'</div></div>');
 const box=label.parentElement.querySelector('.name-picker271'),first=box.querySelector('.name-choice271');
 if(first)input.value=first.dataset.name;
 markPicked271(box);
 input.addEventListener('input',()=>markPicked271(box));
}
(function namePickerStyle271(){
 if(document.getElementById('employers271-style'))return;
 const st=document.createElement('style');
 st.id='employers271-style';
 st.textContent='.name-picker271{margin-top:8px}.name-picker271 .sub{margin:0 0 8px}'+
  '.name-options271{display:flex;flex-wrap:wrap;gap:8px}'+
  '.name-options271 button{padding:7px 12px;line-height:1.4;border:1px solid var(--line);border-radius:7px}'+
  '.name-options271 button[aria-pressed="true"]{background:var(--accent);border-color:var(--accent);color:var(--on-dark)}'+
  '.name-options271 .name-more271{border-style:dashed}';
 document.head.appendChild(st);
})();
// Окно открытия дела (enterpriseSpecialtyMenu153) рисует фасад, потом поле «Название»: вид и специальность берём
// из вызова фасада. Окно переименования — без выбора: там нет кнопки «Открыть».
const namePickerBase271={petInsert38,enterpriseFacadeGallery166};
enterpriseFacadeGallery166=function(b,...rest){
 org271.opening=b&&!b.id&&b.type?{type:b.type,specialty:b.specialty||null}:null;
 return namePickerBase271.enterpriseFacadeGallery166.call(this,b,...rest);
};
petInsert38=function(html,...rest){
 const out=namePickerBase271.petInsert38.call(this,html,...rest);
 try{
  const text=String(html||'');
  if(text.includes('id="enterprise-title152"')){
   const ctx=org271.opening;org271.opening=null;
   const opening=[...document.querySelectorAll('#modal .options button')].some(b=>b.textContent.trim()==='Открыть');
   if(ctx&&opening)namePicker271('enterprise-title152',ctx);
  }else if(text.includes('id="schoolTitle196"'))namePicker271('schoolTitle196',{type:'services',specialty:'school196'});
 }catch(e){}
 return out;
};
