'use strict';
// Сборка 271: частота имён и фамилий (данные — names271-freq-data.js, собирает tools/names271_freq_build.py).
// 1. Личное имя зависит от года рождения. У имени в данных есть эпохи, когда его давали (old — до ~1965,
//    mid — ~1960–1985, modern — ~1985–2010, new — с ~2005), и частота 1–3. Вес имени — вес частоты, если год
//    рождения попадает в его эпоху, иначе пятая часть. Год рождения: person(роль, возраст) — текущий год минус
//    возраст; assignFamilyName166 — по возрасту человека; новорождённый — текущий год; игрок при создании — год его
//    рождения; name() без человека — по только что созданному человеку, иначе по игроку. С 2050 года половина
//    имён — «новые», половина — «старые»: имена возвращаются примерно через век. Имена из пулов происхождения
//    (extendedFamilyNames167) не взвешиваются.
// 2. Фамилии — по частоте 1–3 (в обычной жизни 2–4 Иванова на ~300 человек). Корея и Китай — по долям: их задаёт
//    names271.js, здесь — запасной вариант, если там долей нет.
// 3. Пасхалки, без записи в ленте: примерно в одной жизни из 15 среди новых знакомых из вашей страны попадается
//    пара вроде «Иван Иванов», в одной из 30 — человек, у которого имя и фамилия совпадают («Томас Томас»; в es/mx/br
//    совпадает первая фамилия). Механизм как у полного тёзки в names270.js: решается раз на жизнь, срабатывает на
//    человеке, созданном в случайном возрасте 6–60 лет; если этот кандидат так и не попал в жизнь — ждём следующего.
// 4. Полный тёзка (names270.js): если имя кандидата переписали после создания (свидание, коллега, друг-подросток),
//    запись «Полный тёзка» больше не выходит с чужим именем — ждём следующего кандидата.
// Здесь обёрнуты только устойчивые точки: name, person, familyName166, assignFamilyName166, childBirthIdentity166,
// identitySurname, defaultParts256, start; внутренности names271.js не трогаются.
const freq271={
 data:typeof namesFreq271Data==='object'?namesFreq271Data:{countries:{},shares:{}},
 // Калибровка стендом (tools/verify271_freq.js): русская жизнь 1990 года рождения — 2–4 Екатерины и 2–4 Анастасии
 // на 150 женщин, 2–4 Иванова на 300 человек. Екатерину давали в трёх эпохах из четырёх, поэтому круче нельзя:
 // при (1, 3, 8) Екатерин уже около пяти, при (1, 2, 3) — 3.8, у самого края; при (1, 2, 2.5) эпохи почти не видны.
 tier:[0,1,2,2.75],   // вес имени по частоте 1–3
 resid:.2,            // доля веса имени вне его эпохи
 surTier:[0,1,2,3],   // вес фамилии по частоте 1–3
 eras:{old:1,mid:2,modern:4,new:8},
 rates:{pair:1/15,double:1/30},
 kin:new Set(['Бабушка','Дедушка','Приёмный опекун','Мать','Отец','Брат','Сестра','Сиблинг','Ребенок','Сын','Дочь','Внук','Внучка','Внук / внучка','Племянник','Племянница','Потомок','Родственник','Партнер','Партнёр','Супруг','Супруга']),
 given:new Map(),     // «cc:пол» → Map(имя без регистра и ё → {mask, tier}) или null
 surnames:new Map(),  // cc → Map(фамилия → частота) или null
 shareRows:new Map(), // «cc:пол:длина пула» → накопленные доли (запасной вариант для kr/cn)
 sorted:new WeakMap(),// пул имён → он же по убыванию длины (разбор имени)
 stack:[],            // годы рождения текущих вызовов (число или функция)
 last:null,           // только что созданный человек: {p, year}
 lastName:null        // последнее имя, которое выдал name()
};
const east271f=['jp','kr','cn'];
function norm271f(x){return String(x||'').toLowerCase().replace(/ё/g,'е').replace(/[-‐–]/g,' ').replace(/\s+/g,' ').trim();}
function eraMask271f(year){
 if(!Number.isFinite(year))return 0;
 if(year>=2050)return Math.random()<.5?freq271.eras.new:freq271.eras.old;
 let m=0;
 if(year<1965)m|=freq271.eras.old;
 if(year>=1960&&year<1986)m|=freq271.eras.mid;
 if(year>=1985&&year<2011)m|=freq271.eras.modern;
 if(year>=2005)m|=freq271.eras.new;
 return m;
}
function givenMap271f(cc,gender){
 const key=cc+':'+gender;
 if(freq271.given.has(key))return freq271.given.get(key);
 const src=freq271.data.countries?.[cc]?.[gender];let map=null;
 if(src&&Object.keys(src).length){
  map=new Map();
  for(const [k,list] of Object.entries(src)){
   const [t,eras]=k.split(':'),tier=Number(t)||1;
   const mask=String(eras||'').split(',').reduce((m,e)=>m|(freq271.eras[e]||0),0)||15;
   for(const n of String(list).split('|'))if(n&&!map.has(norm271f(n)))map.set(norm271f(n),{mask,tier});
  }
 }
 freq271.given.set(key,map);
 return map;
}
function givenWeight271f(map,given,mask){
 const e=map.get(norm271f(given));
 if(!e)return freq271.tier[1];
 return freq271.tier[e.tier]*((e.mask&mask)?1:freq271.resid);
}
// Взвешенное имя из пула: случайное имя принимается с вероятностью вес / наибольший вес.
function drawGiven271f(list,map,mask){
 const top=freq271.tier[3];let g=list[0];
 for(let i=0;i<60;i++){g=list[Math.floor(Math.random()*list.length)];if(Math.random()*top<givenWeight271f(map,g,mask))return g;}
 return g;
}
function surnameMap271f(cc){
 if(freq271.surnames.has(cc))return freq271.surnames.get(cc);
 const src=freq271.data.countries?.[cc]?.s;let map=null;
 if(src&&Object.keys(src).length){
  map=new Map();
  const put=(n,t)=>{const k=norm271f(n);if(k&&!map.has(k))map.set(k,t);};
  for(const [t,list] of Object.entries(src))for(const n of String(list).split('|'))put(n,Number(t)||1);
  // Женская и мужская форма (Иванов / Иванова) — одна фамилия с одной частотой.
  if(typeof genderSurname256==='function')for(const [t,list] of Object.entries(src))for(const n of String(list).split('|')){put(genderSurname256(n,'f',cc),Number(t)||1);put(genderSurname256(n,'m',cc),Number(t)||1);}
 }
 freq271.surnames.set(cc,map);
 return map;
}
function surnameWeight271f(map,surname){const t=map.get(norm271f(surname));return freq271.surTier[t||1];}

// ---------- Год рождения того, кому сейчас выбирают имя ----------
function playerYear271f(){
 if(!s)return null;
 const y=Number.isFinite(s.birthYear)?s.birthYear:Number(s.year)-Number(s.age);
 return Number.isFinite(y)?y:null;
}
function birthYear271f(){
 const top=freq271.stack[freq271.stack.length-1];
 if(top!==undefined){const y=typeof top==='function'?top():top;return Number.isFinite(y)?y:null;}
 // name() сразу после person(): «p.name=name(...)» у свидания, коллеги, внука — год того, кого только что создали.
 const last=freq271.last;
 if(last&&!(s?.people||[]).includes(last.p))return last.year;
 return playerYear271f();
}
function withYear271f(year,fn){
 if(typeof year!=='function'&&!Number.isFinite(year))return fn();
 freq271.stack.push(year);
 try{return fn();}finally{freq271.stack.pop();}
}
function personYear271f(p,age){
 if(!s||!Number.isFinite(Number(s.year)))return null;
 const a=Number(age);
 if(age!==undefined&&age!==null&&age!==''&&Number.isFinite(a))return Number(s.year)-a;
 return Number.isFinite(p?.birthYear)?p.birthYear:null;
}

// ---------- 1. Личные имена ----------
function sortedPool271f(list){
 let out=freq271.sorted.get(list);
 if(!out||out.n!==list.length){out={n:list.length,names:[...list].sort((a,b)=>b.length-a.length)};freq271.sorted.set(list,out);}
 return out.names;
}
// Личное имя в готовом полном имени — по пулу страны (у jp/kr/cn оно в конце).
function givenOf271f(full,cc,gender){
 const list=countries[cc]?.names?.[gender==='m'?1:0];if(!list?.length)return null;
 const text=String(full||'');
 for(const n of sortedPool271f(list)){
  if(text===n)return n;
  if(east271f.includes(cc)?text.endsWith(' '+n):text.startsWith(n+' '))return n;
 }
 return null;
}
{
 const base=name;
 name=function(country,gender){
  const cc=countries[country]?country:'nl',sex=gender==='m'?'m':'f';
  const map=givenMap271f(cc,sex),mask=map?eraMask271f(birthYear271f()):0;
  let r;
  if(!mask){r=base.apply(this,arguments);freq271.lastName=r;return r;}
  // Имя от базового генератора (он следит за повторами и тёзками игрока) принимается с вероятностью вес / наибольший
  // вес; отклонённое имя снимается с брони, чтобы не занимать его в этой жизни.
  for(let i=0;i<40;i++){
   const before=typeof nameReservations==='object'&&nameReservations?nameReservations.size:-1;
   r=base.apply(this,arguments);
   const g=givenOf271f(r,cc,sex);
   if(i===39||!g||Math.random()*freq271.tier[3]<givenWeight271f(map,g,mask))break;
   if(before>=0&&nameReservations.size>before)nameReservations.delete(r);
  }
  freq271.lastName=r;
  return r;
 };
}
{
 const base=familyName166;
 familyName166=function(country,gender,origin){
  const r=base.apply(this,arguments);
  try{
   // Имя из пула происхождения — как было, равновероятно.
   if(!r?.given||origin&&typeof extendedFamilyNames167==='object'&&extendedFamilyNames167[origin])return r;
   const oc=origin&&typeof familyNameCountries166==='object'?familyNameCountries166[origin]:null;
   const cc=countries[oc]?oc:countries[country]?country:null;if(!cc)return r;
   const sex=gender==='m'?'m':'f',list=countries[cc].names?.[sex==='m'?1:0];
   const map=givenMap271f(cc,sex);
   if(!map||!list?.includes(r.given))return r;
   const mask=eraMask271f(birthYear271f());
   if(mask)r.given=drawGiven271f(list,map,mask);
  }catch(e){console.error(e);}
  return r;
 };
}

// ---------- 2. Фамилии ----------
function shareSurname271f(cc,gender){
 const rows=freq271.data.shares?.[cc];if(!rows?.length||typeof surnamePool256!=='function')return null;
 const pool=surnamePool256(cc,gender),key=cc+':'+gender+':'+pool.length;
 let cum=freq271.shareRows.get(key);
 if(!cum){
  const listed=new Map(rows.map(([n,v])=>[norm271f(genderSurname256(n,gender,cc)),Number(v)||0]));
  const rest=pool.filter(n=>!listed.has(norm271f(n)));
  const left=Math.max(0,100-rows.reduce((a,[,v])=>a+(Number(v)||0),0));
  let t=0;cum=[];
  for(const n of pool){const v=listed.get(norm271f(n))??(rest.length?left/rest.length:0);if(v>0){t+=v;cum.push([n,t]);}}
  freq271.shareRows.set(key,cum);
 }
 if(!cum.length)return null;
 const x=Math.random()*cum[cum.length-1][1];
 return (cum.find(([,v])=>x<v)||cum[cum.length-1])[0];
}
{
 const base=identitySurname;
 identitySurname=function(country,gender){
  const cc=countries[country]?country:'nl';
  try{
   if(freq271.data.shares?.[cc]){
    // Доли уже задаёт names271.js — не взвешиваем второй раз.
    if(typeof names271==='object'&&names271?.shares?.[cc])return base.apply(this,arguments);
    const r=shareSurname271f(cc,gender);if(r)return r;
   }
  }catch(e){console.error(e);}
  const map=surnameMap271f(cc);
  let r=base.apply(this,arguments);
  if(!map)return r;
  for(let i=0;i<40&&Math.random()*freq271.surTier[3]>=surnameWeight271f(map,r);i++)r=base.apply(this,arguments);
  return r;
 };
}
// es, mx, br: вторая фамилия тоже по частоте (первую уже взвесила identitySurname).
if(typeof defaultParts256==='function'){
 const base=defaultParts256;
 defaultParts256=function(country,gender){
  let r=base.apply(this,arguments);
  const cc=countries[country]?country:'nl',map=['es','mx','br'].includes(cc)?surnameMap271f(cc):null;
  if(!map||r?.length!==2)return r;
  for(let i=0;i<40&&Math.random()*freq271.surTier[3]>=surnameWeight271f(map,r[1]);i++)r=base.apply(this,arguments);
  return r;
 };
}

// ---------- Точки входа: чей год рождения ----------
{
 const base=person;
 person=function(role,age){
  const y=personYear271f(null,age);
  const p=withYear271f(y,()=>base.apply(this,arguments));
  try{
   if(p&&Number.isFinite(y)){
    const mark={p,year:y};freq271.last=mark;
    if(typeof queueMicrotask==='function')queueMicrotask(()=>{if(freq271.last===mark)freq271.last=null;});
   }
   eggTake271f(p);
  }catch(e){console.error(e);}
  return p;
 };
}
{
 const base=assignFamilyName166;
 assignFamilyName166=function(p){return withYear271f(personYear271f(p,p?.age),()=>base.apply(this,arguments));};
}
{
 const base=childBirthIdentity166;
 childBirthIdentity166=function(){return withYear271f(s&&Number.isFinite(Number(s.year))?Number(s.year):null,()=>base.apply(this,arguments));};
}
// Игрок: при создании жизни — год его рождения (s заменяется внутри start, поэтому год читается в момент выбора).
{
 const base=start;
 start=function(){return withYear271f(playerYear271f,()=>base.apply(this,arguments));};
}

// ---------- 3. Пасхалки: «Иван Иванов» и «Томас Томас» ----------
function eggState271f(){
 if(!s)return null;
 if(!s.nameEggs271){
  const d=freq271.data.countries?.[s.birthCountry||s.country];
  const one=(kind,list)=>({on:!!list?.length&&Math.random()<freq271.rates[kind],at:6+Math.floor(Math.random()*55),done:false});
  s.nameEggs271={pair:one('pair',d?.pairs),double:one('double',d?.doubles)};
 }
 return s.nameEggs271;
}
// Написание из пула игры (Пётр, а не Петр; «ван дер Мерве»), если имя там есть.
function spelling271f(list,n){const k=norm271f(n);return (list||[]).find(x=>norm271f(x)===k)||n;}
function eggOptions271f(cc,kind,gender){
 const d=freq271.data.countries?.[cc],i=gender==='m'?1:0,pool=countries[cc]?.names?.[i]||[];
 const fits=g=>pool.some(x=>norm271f(x)===norm271f(g))||!!givenMap271f(cc,gender==='m'?'m':'f')?.has(norm271f(g));
 if(kind==='pair')return (d?.pairs||[]).filter(([g])=>fits(g));
 return (d?.doubles||[]).filter(g=>fits(g)).map(g=>[g,g]);
}
function eggName271f(p,cc,kind){
 const opts=eggOptions271f(cc,kind,p.gender);if(!opts.length)return null;
 const [g0,s0]=opts[Math.floor(Math.random()*opts.length)];
 const given=spelling271f(countries[cc].names[p.gender==='m'?1:0],g0);
 let sur=kind==='double'?given:spelling271f(countries[cc].surnames,s0);
 if(kind==='pair'&&typeof genderSurname256==='function')sur=genderSurname256(sur,p.gender,cc);
 const parts=[sur];
 // es, mx, br: две фамилии — совпадает первая, вторая обычная.
 if(['es','mx','br'].includes(cc)){
  let second=identitySurname(cc,p.gender);
  for(let i=0;i<10&&norm271f(second)===norm271f(sur);i++)second=identitySurname(cc,p.gender);
  if(norm271f(second)!==norm271f(sur))parts.push(second);
 }
 return {given,parts};
}
function eggTake271f(p){
 if(!p||!s||p===s||p.namesake270||p.nameEgg271)return;
 // Имя, заданное не генератором (приглашение друга-подростка, тёзка), не трогаем: его уже видели.
 if(p.name!==freq271.lastName)return;
 const st=eggState271f();if(!st)return;
 const home=s.birthCountry||s.country;
 if(freq271.kin.has(p.role)||(p.country||s.country)!==home||!countries[home])return;
 for(const kind of ['pair','double']){
  const k=st[kind];
  if(!k?.on||k.done||k.pending||s.age<k.at)continue;
  const n=eggName271f(p,home,kind);if(!n)continue;
  const full=fullName256(n.given,n.parts,home,' ');
  if(typeof nameTaken270==='function'&&nameTaken270(p,full))continue;
  setPersonName256(p,n.given,n.parts,' ');
  p.birthSurname256=p.surname;p.nameEgg271=kind;delete p.nameStyle271;
  if(typeof nameReservations==='object'&&nameReservations)nameReservations.add(p.name);
  k.pending={id:p.id,name:p.name,tick:s.clock?.ticks??0};
  return;
 }
}
// Кандидат попал в жизнь с этим именем — пасхалка состоялась. Имя переписали или кандидат так и не появился —
// ждём следующего.
function eggCheck271f(){
 const st=s?.nameEggs271;if(!st)return;
 for(const kind of ['pair','double']){
  const k=st[kind];if(!k?.pending||k.done)continue;
  const p=(s.people||[]).find(q=>q.id===k.pending.id);
  if(p&&p.name===k.pending.name){k.done=true;k.pending=null;continue;}
  if(p){delete p.nameEgg271;k.pending=null;continue;}
  if((s.clock?.ticks??0)>k.pending.tick)k.pending=null;
 }
}

// ---------- 4. Полный тёзка: имя переписали после создания ----------
if(typeof namesakeCheck270==='function'&&typeof playerNames270==='function'){
 const base=namesakeCheck270;
 namesakeCheck270=function(){
  try{
   const st=s?.namesake270;
   if(st?.pending&&!st.done){
    const p=(s.people||[]).find(q=>q.id===st.pending.id);
    if(p&&!playerNames270().includes(p.name)){delete p.namesake270;st.pending=null;return;}
   }
  }catch(e){console.error(e);}
  return base.apply(this,arguments);
 };
}
{
 const base=ensureUX;
 ensureUX=function(){const r=base.apply(this,arguments);try{eggCheck271f();}catch(e){console.error(e);}return r;};
}
