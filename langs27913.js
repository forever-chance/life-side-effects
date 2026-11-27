'use strict';
// Сборка 279.1.3 (решения владелицы 27.11: «можно добавить местные языки, но и испанский пусть будет в униках»; кто на
// них говорит и где их учить — «по городам»). Три местных языка Испании: каталанский (Барселона и Валенсия, в Валенсии
// его называют валенсийским), галисийский (Сантьяго-де-Компостела) и баскский (Бильбао). Испанский остаётся языком
// страны: работе, учёбе, документам и допуску его хватает везде, местный язык ничего не закрывает и нигде не нужен.
// • Ключи — 'cat', 'glg', 'eus' (не 'ca': так в игре зовут Канаду). Языки заводятся в lang16 и в клубы по языкам до
//   unis2791.js: вузы читают lang16 при загрузке (копии программ на местном языке — unis2791.js, unis2791-data.js).
// • Родной — смотря какая семья (решение ведущего: все новые жизни Испании рождаются в Валенсии, городе страны по
//   умолчанию, и родной по одному городу дал бы каталанский каждой героине). Дома на местном языке говорит часть семей
//   (home27913): в Барселоне около 55 %, в Валенсии около 35 %, в Сантьяго-де-Компостела около 50 %, в Бильбао около 25 %;
//   семья мигрантов — никогда. Семья, где один из родителей каталонского (галисийского, баскского) происхождения
//   (demography165), говорит на нём чаще. Жребий — из случайного ряда самой жизни при рождении (start), результат
//   записан в родных языках, поэтому не меняется. Без родного местного языка ребёнок осваивает его в школе, а жизнь с
//   18 лет в этом городе сразу получает школьный уровень (Барселона B2, Валенсия и Сантьяго B1, Бильбао A2).
//   Наследник (continue274), родившийся в таком городе, — по тем же долям (жребий по его id; ребёнок умершего героя, у
//   которого язык был родным, — родной); выученное в школе остаётся. Старые сохранения не меняются.
// • Школа: кто живёт в таком городе и ходит в школу, понемногу осваивает местный язык — так же, как переехавшие дети
//   осваивают язык школы (schoolStep73: до B1 быстрее, дальше медленнее), но не выше школьного уровня города. Дети игрока —
//   тоже. Первая оценка школьных языков (initSchoolLanguages73: старое сохранение без них, новый ребёнок в семье) местного
//   языка не даёт — только месяцы, прожитые в городе после этой сборки.
// • Курсы и практика местного языка, разговорные и читательские клубы — только в его городах (languageTask16,
//   joinClub19); цена и срок — как у любого курса (languageLesson16). Начатые курс или практика после переезда из
//   города встают на паузу и продолжаются, когда вы вернётесь. Люди из клуба местного языка говорят и по-испански.
// • «Языки»: карточка местного языка — тому, кто живёт в его городе, знает его или учит; остальным её нет. Подсказку
//   «Местный язык» (не «Язык страны») и причины у кнопок курсов вне города даёт langs27913-hints.js.
// В сохранение нового поля не пишется: только уровень языка в path16().languages (и в schoolLanguages73 у детей).

// called — как язык зовут в этом городе, если иначе: [именительный, творительный].
const local27913={
 cat:{name:'Каталанский',country:'es',cities:['Барселона','Валенсия'],called:{'Валенсия':['валенсийский','валенсийским']}},
 glg:{name:'Галисийский',country:'es',cities:['Сантьяго-де-Компостела']},
 eus:{name:'Баскский',country:'es',cities:['Бильбао']}
};
// Доля семей, где дома говорят на местном языке (with — один из родителей этого происхождения, without — остальные,
// кроме мигрантов), и школьный уровень города (2 — A2, 3 — B1, 4 — B2). Доли подобраны под происхождения demography165
// при «Случайной семье»: без мигрантов выходит около 55 %, 35 %, 50 % и 25 % (verify27913_langs.js).
const home27913={
 'Барселона':{origin:'каталонское',with:.9,without:.3,school:4},
 'Валенсия':{without:.35,school:3},
 'Сантьяго-де-Компостела':{origin:'галисийское',with:.75,without:.07,school:3},
 'Бильбао':{origin:'баскское',with:.45,without:.02,school:2}
};
function homeChance27913(city,origins){
 const h=home27913[city];if(!h)return 0;
 return h.origin&&Array.isArray(origins)&&origins.includes(h.origin)?h.with:h.without;
}
function schoolCap27913(city){return home27913[city]?.school??5;}
function hash27913(v){let h=2166136261;for(const c of String(v))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h/4294967296;}
function isLocal27913(l){return Object.prototype.hasOwnProperty.call(local27913,l);}
function cityLanguage27913(country,city){
 for(const [l,r] of Object.entries(local27913))if(r.country===country&&r.cities.includes(city))return l;
 return null;
}
function homeCity27913(){try{return typeof s!=='undefined'&&s?residenceCity():null;}catch(e){return null;}}
function here27913(l){const r=local27913[l];return !!(r&&typeof s!=='undefined'&&s&&s.country===r.country&&r.cities.includes(homeCity27913()));}
// «в городах Барселона и Валенсия», «в городе Бильбао» — названия городов не склоняются.
function citiesText27913(l){const c=local27913[l]?.cities||[];return c.length>1?'в городах '+c.slice(0,-1).join(', ')+' и '+c[c.length-1]:'в городе '+c[0];}
function calledHere27913(l,city){return local27913[l]?.called?.[city]||null;}
function langLower27913(l){return String((typeof lang16!=='undefined'&&lang16[l])||l).toLowerCase();}
function langGenitive27913(l){const n=langLower27913(l);return n.endsWith('ий')?n.slice(0,-2)+'ого':n;}
function localTaskLive27913(l){return !!(typeof s!=='undefined'&&s&&(s.clock?.tasks||[]).some(t=>t.kind==='pathLanguage'&&t.language===l&&!['completed','cancelled'].includes(t.state)));}

// ---------- языки и клубы ----------

if(typeof lang16!=='undefined')for(const [l,r] of Object.entries(local27913))if(!lang16[l])lang16[l]=r.name;
// Клубы по языкам (language-clubs53.js) заведены для языков, что были до этой сборки; местным — такие же, как испанским.
if(typeof clubsCatalog19!=='undefined'&&typeof lang16!=='undefined')for(const l of Object.keys(local27913))for(const kind of ['speaking53_','reading53_']){
 const tpl=clubsCatalog19[kind+'es'];
 if(tpl&&!clubsCatalog19[kind+l])clubsCatalog19[kind+l]={...tpl,name:String(tpl.name).replace(lang16.es,lang16[l]),language53:l,topics:[...(tpl.topics||[])]};
}

// ---------- родной язык ----------

// Новая жизнь, родившаяся в городе местного языка: дома на нём говорят не во всех семьях (home27913) — жребий из
// случайного ряда жизни при рождении. Семья мигрантов (s.identity17 — 'migrant'; в Испании это семья из Мексики, родной
// у неё тоже испанский) — без жребия. Не родной, а жизнь начинается с 18 лет в этом городе — школьный уровень города.
function birthNative27913(){
 if(typeof s==='undefined'||!s||typeof path16!=='function')return;
 const country=s.birthCountry||s.country,city=s.birthCity,l=cityLanguage27913(country,city),x=path16();
 if(!l||!x||!x.languages||!Array.isArray(x.native))return;
 const family=s.identity17?.familyMode!=='migrant'&&x.native.includes(country16[country]?.[0]);
 if(family&&Math.random()<homeChance27913(city,s.origins)){
  x.languages[l]=6;
  if(!x.native.includes(l))x.native.push(l);
  return;
 }
 if(s.age>=18&&s.country===country&&homeCity27913()===city)x.languages[l]=Math.max(Number(x.languages[l])||0,schoolCap27913(city));
}
// Продолжение за близкого: родной — по стране рождения (continue274). Родился в городе местного языка — родной по тем же
// долям семей (жребий по id человека, а не из случайного ряда); ребёнок умершего героя, у которого этот язык был родным,
// — родной. Иначе взрослому — школьный уровень города. Что ребёнок выучил в школе, остаётся.
function heirLocal27913(F,R,O=null){
 const x=F&&F.path16;if(!x||!R||!x.languages||!Array.isArray(x.native))return;
 const country=R.birthCountry||R.country,city=R.birthCity,l=cityLanguage27913(country,city);
 if(l&&x.native.includes(country16[country]?.[0])){
  const parent=/^(Реб[её]нок|Сын|Дочь)$/.test(String(R.role||''))&&(O?.path16?.native||[]).includes(l);
  if(parent||hash27913((R.id||R.name||'')+':home27913')<homeChance27913(city,R.origins)){x.languages[l]=6;if(!x.native.includes(l))x.native.push(l);}
  else if((Number(F.age??R.age)||0)>=18)x.languages[l]=Math.max(Number(x.languages[l])||0,schoolCap27913(city));
 }
 const school=R.schoolLanguages73&&R.schoolLanguages73.languages;
 if(school&&typeof school==='object')for(const k of Object.keys(local27913)){const v=Number(school[k]);if(Number.isFinite(v)&&v>0)x.languages[k]=Math.max(x.languages[k]||0,Math.min(6,v));}
}

// ---------- обёртки ----------

const base27913={start:typeof start==='function'?start:null,
 schoolProgram73:typeof schoolProgram73==='function'?schoolProgram73:null,schoolStep73:typeof schoolStep73==='function'?schoolStep73:null,
 initSchoolLanguages73:typeof initSchoolLanguages73==='function'?initSchoolLanguages73:null,newClubMember19:typeof newClubMember19==='function'?newClubMember19:null,
 startTask05:typeof startTask05==='function'?startTask05:null,pauseTask05:typeof pauseTask05==='function'?pauseTask05:null,
 schoolLanguageDetails73:typeof schoolLanguageDetails73==='function'?schoolLanguageDetails73:null,
 languageTask16:typeof languageTask16==='function'?languageTask16:null,languagesView16:typeof languagesView16==='function'?languagesView16:null,
 languageClubsMenu53:typeof languageClubsMenu53==='function'?languageClubsMenu53:null,joinClub19:typeof joinClub19==='function'?joinClub19:null,
 transformLife274:typeof transformLife274==='function'?transformLife274:null,dossierPlace87:typeof dossierPlace87==='function'?dossierPlace87:null};

if(base27913.start)start=function(...args){
 const out=base27913.start.apply(this,args);
 try{birthNative27913();}catch(e){console.error(e);}
 return out;
};
if(base27913.transformLife274)transformLife274=function(F,O,R,...rest){
 const out=base27913.transformLife274.call(this,F,O,R,...rest);
 try{heirLocal27913(F,R,O);}catch(e){console.error(e);}
 return out;
};

// Школа в городе местного языка: программа знает этот язык (local27913) и школьный уровень города (localCap27913), шаг
// месяца прибавляет его, как язык школы. Первая оценка (initSchoolLanguages73) — без местного языка: она считает прошлые
// школьные годы по нынешнему городу и дала бы его задним числом старому сохранению, открытому через «Ваши персонажи»
// (при обновлении страницы оценка идёт раньше этого файла — и там его нет).
let quiet27913=0;
if(base27913.initSchoolLanguages73)initSchoolLanguages73=function(...args){
 quiet27913++;
 try{return base27913.initSchoolLanguages73.apply(this,args);}finally{quiet27913--;}
};
if(base27913.schoolProgram73)schoolProgram73=function(country,type,identity,city,...rest){
 const p=base27913.schoolProgram73.call(this,country,type,identity,city,...rest);
 try{const l=!quiet27913&&p&&cityLanguage27913(country,city);if(l&&l!==p.medium){p.local27913=l;p.localCap27913=schoolCap27913(city);}}catch(e){console.error(e);}
 return p;
};
if(base27913.schoolStep73)schoolStep73=function(map,program,age,grades=65,attendance=1,...rest){
 const out=base27913.schoolStep73.call(this,map,program,age,grades,attendance,...rest);
 try{
  const l=program&&program.local27913;
  if(l&&map&&age>=6){
   const g=Number.isFinite(grades)?Math.max(0,Math.min(100,grades)):65,a=Number.isFinite(attendance)?attendance:1;
   const quality=.65+.35*g/100,child=age<10?.7:1,before=Number(map[l])||0,cap=Math.min(5,Number(program.localCap27913)||5);
   if(before<cap)map[l]=Math.min(cap,before+(before<3?.12:.055)*quality*child*a);
  }
 }catch(e){console.error(e);}
 return out;
};
if(base27913.schoolLanguageDetails73)schoolLanguageDetails73=function(person=null,...rest){
 const text=base27913.schoolLanguageDetails73.call(this,person,...rest);
 try{
  const city=person?.city18||homeCity27913(),country=person?.country||s.country,l=cityLanguage27913(country,city);
  if(l){const called=calledHere27913(l,city);return String(text).replace(/^(Язык обучения: [^.\n]*\.)/,'$1\nМестный язык — '+langLower27913(l)+(called?' (здесь его называют '+called[1]+')':'')+': в школе его тоже учат.');}
 }catch(e){console.error(e);}
 return text;
};

// Курсы и практика местного языка — только в его городах.
if(base27913.languageTask16)languageTask16=function(language,mode,...rest){
 if(isLocal27913(language)&&!here27913(language)){
  if(typeof toast==='function')toast('Курсы и практика '+langGenitive27913(language)+' — только '+citiesText27913(language)+'.');
  return;
 }
 return base27913.languageTask16.call(this,language,mode,...rest);
};
// «Языки»: карточка местного языка — если вы живёте в его городе, знаете его или учите.
function localShown27913(l){const x=path16();return (x.native||[]).includes(l)||(x.languages[l]||0)>0||here27913(l)||localTaskLive27913(l);}
function localCards27913(html){
 if(typeof document==='undefined')return html;
 const box=document.createElement('div');box.innerHTML=html;
 let changed=false;
 for(const card of [...box.querySelectorAll('.path-card')]){
  const calls=[...card.querySelectorAll('button')].map(b=>b.getAttribute('onclick')||'').join(' ');
  const m=/(?:languageTask16|declareNative16)\('(\w+)'/.exec(calls);
  if(!m||!isLocal27913(m[1]))continue;
  if(!localShown27913(m[1])){card.remove();changed=true;continue;}
  const called=here27913(m[1])&&calledHere27913(m[1],homeCity27913());
  if(called){const p=document.createElement('p');p.className='sub called27913';p.textContent='Здесь его называют '+called[1]+'.';card.querySelector('h3')?.after(p);changed=true;}
 }
 return changed?box.innerHTML:html;
}
if(base27913.languagesView16)languagesView16=function(...args){
 const html=base27913.languagesView16.apply(this,args);
 try{return localCards27913(html);}catch(e){console.error(e);return html;}
};
// Клубы местного языка — только в его городах: в списке «Клубы по языкам» их нет, записаться нельзя.
if(base27913.languageClubsMenu53)languageClubsMenu53=function(...args){
 const old=show;let done=false;
 show=function(title,text,opts=[],...more){
  if(done)return old.call(this,title,text,opts,...more);
  done=true;
  let list=opts;
  try{const hide=Object.keys(local27913).filter(l=>!here27913(l)).map(l=>lang16[l]+' · ');if(Array.isArray(opts))list=opts.filter(o=>!hide.some(h=>String(o?.label||'').startsWith(h)));}catch(e){console.error(e);}
  return old.call(this,title,text,list,...more);
 };
 try{return base27913.languageClubsMenu53.apply(this,args);}finally{show=old;}
};
if(base27913.joinClub19)joinClub19=function(type,...rest){
 const l=typeof clubsCatalog19!=='undefined'&&clubsCatalog19[type]?.language53;
 if(l&&isLocal27913(l)&&!here27913(l)){
  if(typeof toast==='function')toast('Клубы '+langGenitive27913(l)+' — только '+citiesText27913(l)+'.');
  return;
 }
 return base27913.joinClub19.call(this,type,...rest);
};
// Люди из клуба местного языка — местные, говорят и по-испански: language18 — язык страны, иначе испаноязычному,
// который только учит каталанский, они не «свои» (localSocial19) и с ними «не хватает общего языка» (romance63).
if(base27913.newClubMember19)newClubMember19=function(m,...rest){
 const out=base27913.newClubMember19.call(this,m,...rest);
 try{const p=out&&out.candidate,home=country16[m?.country||s.country]?.[0];if(p&&isLocal27913(p.language18)&&home)p.language18=home;}catch(e){console.error(e);}
 return out;
};
// Курс и практика местного языка вне его городов не идут: после переезда занятие встаёт на паузу (часы не заняты,
// пройденное сохранено) и продолжается, когда вы снова живёте в одном из этих городов. Пауза, поставленная вами, —
// ваша: её не снимаем.
function awayTask27913(t){return !!(t&&t.kind==='pathLanguage'&&isLocal27913(t.language)&&!['completed','cancelled'].includes(t.state));}
if(base27913.startTask05)startTask05=function(t,...rest){
 try{
  if(awayTask27913(t)){
   if(!here27913(t.language)){
    if(t.state!=='paused'){
     t.away27913=t.state;t.state='paused';
     if(typeof log==='function')log((/· практика$/.test(t.label)?'Практика':'Курс')+' на паузе',t.label+': '+langLower27913(t.language)+' учат только '+citiesText27913(t.language)+'. Пройденное сохранено — занятия продолжатся, когда вы снова будете там жить.','Учёба');
    }
    return false;
   }
   if(t.away27913!=null){if(t.state==='paused')t.state=t.away27913;delete t.away27913;}
  }
 }catch(e){console.error(e);}
 return base27913.startTask05.call(this,t,...rest);
};
if(base27913.pauseTask05)pauseTask05=function(id,...rest){
 try{
  const t=s?.clock?.tasks?.find(t=>t.id===id);
  if(awayTask27913(t)&&t.state==='paused'&&t.away27913!=null&&!here27913(t.language)){
   if(typeof toast==='function')toast(t.label+': занятия — только '+citiesText27913(t.language)+'.');
   return;
  }
 }catch(e){console.error(e);}
 return base27913.pauseTask05.call(this,id,...rest);
};
// Досье места: в городе местного языка — и он («Основная языковая среда: Испанский; местный язык — каталанский.»).
if(base27913.dossierPlace87)dossierPlace87=function(country,city,...rest){
 const html=base27913.dossierPlace87.call(this,country,city,...rest);
 try{
  const l=cityLanguage27913(country,city);
  if(l){const called=calledHere27913(l,city);return String(html).replace(/(Основная языковая среда: [^<.]*)\.<\/p>/,'$1; местный язык — '+langLower27913(l)+(called?' (здесь его называют '+called[1]+')':'')+'.</p>');}
 }catch(e){console.error(e);}
 return html;
};
