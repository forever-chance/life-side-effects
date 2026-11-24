'use strict';
// Сборка 271: имена и фамилии по странам.
// 1. Пулы из names271-data.js (собирает tools/names271_build.py): имена, фамилии и клички по 25 странам, пулы
//    происхождений. Старые написания (remove) из пулов уходят, но по ним узнаются имена в старых сохранениях.
// 2. Правила стран: частоты фамилий в Корее и Китае, цепочка имён в Египте, общая фамилия в японском браке,
//    обычай страны при свадьбе и разводе NPC, фамилия детей по обычаю страны (у кого фамилия отца, у кого обе).
// 3. Баги из аудита имён 270: фамилия игрока при рождении, сиблинги и бабушки с дедушками со случайными фамилиями,
//    удвоенная фамилия в es/mx/br, «Юн»/«Ян», брак и развод по предложению NPC без выбора фамилии, приёмные дети,
//    повторы имён в семье, порча старых сохранений, рассинхрон имени у друга-подростка и коллеги из истории аренды.
// Уже записанные имена людей не меняются: правила действуют на новых людей и на новые решения.
const names271={data:typeof names271Data==='object'?names271Data:{countries:{},origins:{}},meta:new Map(),life:null};
const east271=['jp','kr','cn'];
function shuffle271(list){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function country271(p){return p===s?(s.birthCountry||s.country):(p?.birthCountry||p?.country||s?.country||'nl');}
function given271(p){return p===s?s.name:p?.givenName166;}
function parts271(p){
 if(!p)return [];
 if(p.surnameParts256?.length)return [...p.surnameParts256];
 return p.surname?[p.surname]:[];
}
function joiner271(p){return p?.surnameJoiner256||' ';}
function setName271(p,given,parts,joiner=' '){
 if(p===s){s.name=given;s.surnameParts256=[...parts];s.surnameJoiner256=joiner;s.surname=parts.join(joiner);return;}
 setPersonName256(p,given,parts,joiner);
}

// ---------- 1. Пулы ----------
const originCulture271={
 татарское:'ru',башкирское:'ru',бурятское:'ru',чеченское:'ru',казахское:'ru',узбекское:'ru',азербайджанское:'ru',
 белорусское:'ru',украинское:'ru',армянское:'ru',грузинское:'ru',силезское:'pl',кашубское:'pl',
 колумбийское:'es',венесуэльское:'es',перуанское:'es',кубинское:'es',пуэрториканское:'es',галисийское:'es',
 баскское:'es',каталонское:'es',португальское:'br'
};
// Род фамилии меняют только ru и pl; двойная фамилия — у испаноязычных и португальских семей.
function originGender271(origin){const c=originCulture271[origin]||familyNameCountries166[origin];return ['ru','pl'].includes(c)?c:null;}
function mergePools271(){
 const out={};
 for(const [cc,d] of Object.entries(names271.data.countries||{})){
  const c=countries[cc];if(!c)continue;
  const rm=d.remove||{};
  ['f','m'].forEach((g,i)=>{const drop=new Set(rm[g]||[]);c.names[i]=[...new Set([...(d[g]||[]),...(c.names[i]||[]).filter(n=>!drop.has(n))])];});
  const dropS=new Set(rm.surnames||[]);
  const r=typeof expansion95==='object'&&expansion95[cc];
  const old=r?(Array.isArray(r.surnames)?r.surnames:[...(r.surnames?.m||[]),...(r.surnames?.f||[])]):(c.surnames||[]);
  // у ru и pl фамилии в пуле — мужская форма, женскую делает genderSurname256
  const norm=n=>['ru','pl'].includes(cc)?genderSurname256(n,'m',cc):n;
  const sur=[...new Set([...(d.surnames||[]),...old.filter(n=>!dropS.has(n)).map(norm)])];
  c.surnames=sur;
  if(r){if(Array.isArray(r.surnames))r.surnames=[...sur];else r.surnames={f:sur.map(n=>genderSurname256(n,'f',cc)),m:[...sur]};}
  out[cc]={f:c.names[0].length,m:c.names[1].length,surnames:sur.length};
 }
 return out;
}
names271.counts=mergePools271();
// Клички: исходные пулы 182 с весами остаются, общие клички страны из 256 (их добавили всем видам и обоим полам)
// уходят, к собакам, кошкам и кроликам добавляются клички своего пола. Сербские буквы и латиница — не в клички.
function mergePets271(){
 const ok=/^[А-Яа-яЁё][А-Яа-яЁё\- ']*$/u;
 for(const cc of Object.keys(countries)){
  const extra=new Set(extraNames256?.[cc]?.pets||[]),d=names271.data.countries?.[cc]?.pets||{};
  for(const kind of Object.keys(petKinds))for(const sex of ['m','f']){
   const key=cc+':'+kind+':'+sex,add=d[kind+':'+sex]||[];
   const pool=(petNamePools182[key]||[]).filter(([n])=>!extra.has(n)&&ok.test(n)&&!add.includes(n)||add.includes(n));
   for(const n of add)if(ok.test(n)&&!pool.some(x=>x[0]===n))pool.push([n,1]);
   if(pool.length)petNamePools182[key]=pool;else delete petNamePools182[key];
  }
 }
}
mergePets271();
// Происхождения: полные пулы (имена обоих полов и фамилии) идут и в extendedFamilyNames167 — по ним names270
// узнаёт, из какого пула имя. Неполные (только имена или только фамилии) добираются по стране.
names271.originKeys=(()=>{
 const keys=new Set([...Object.keys(familyNameCountries166),...Object.keys(extendedFamilyNames167),...Object.values(origins17).flat()]);
 if(typeof demography165==='object')for(const d of Object.values(demography165)){Object.keys(d.base||{}).forEach(k=>keys.add(k));for(const c of Object.values(d.cities||{}))Object.keys(c).forEach(k=>keys.add(k));}
 return keys;
})();
names271.origins={};
for(const [o,v] of Object.entries(names271.data.origins||{})){
 if(!names271.originKeys.has(o))continue;
 names271.origins[o]=v;
 const one=list=>(list||[]).filter(n=>!n.includes(' '));
 if(v.f?.length&&v.m?.length&&v.surnames?.length){
  const old=extendedFamilyNames167[o]?.map(x=>String(x).split(' ').filter(Boolean))||[[],[],[]];
  extendedFamilyNames167[o]=[[...new Set([...one(v.f),...old[0]])].join(' '),[...new Set([...one(v.m),...old[1]])].join(' '),[...new Set([...one(v.surnames),...old[2]])].join(' ')];
 }
}
// Индия: фамилии с пометкой региона идут людям соответствующего происхождения.
names271.regionOrigins={bengal:['бенгальское'],punjab:['панджабское'],west:['маратхское','гуджаратское'],south:['тамильское','телугу','каннада']};
{
 const region=names271.data.countries?.in?.surnameRegion||{};
 for(const [surname,area] of Object.entries(region))for(const o of names271.regionOrigins[area]||[]){
  const v=names271.origins[o]??={};v.surnames=[...new Set([...(v.surnames||[]),surname])];
 }
}
// Родительный падеж не нужен: имена в пулах — только именительный.
function originName271(country,gender,origin){
 const o=names271.origins[origin];if(!o)return null;
 const culture=originCulture271[origin]||familyNameCountries166[origin]||country;
 const c=countries[culture]?culture:country;
 const given=pick(o[gender==='m'?'m':'f']?.length?o[gender==='m'?'m':'f']:countries[c].names[gender==='m'?1:0]);
 let surname=o.surnames?.length?pick(o.surnames):identitySurname(c,gender);
 const g=originGender271(origin);if(g)surname=genderSurname256(surname,gender,g);
 if(['es','br'].includes(originCulture271[origin])&&o.surnames?.length>1)surname=[surname,pick(o.surnames.filter(x=>x!==surname))].join(' ');
 return {given,surname};
}

// ---------- 2. Частоты фамилий (Корея, Китай) ----------
names271.shares={};
for(const [cc,d] of Object.entries(names271.data.countries||{})){
 if(!d.surnameShares?.length||!countries[cc])continue;
 const listed=new Map(d.surnameShares.map(([n,v])=>[n,Number(v)||0]));
 const pool=countries[cc].surnames.filter(n=>!listed.has(n));
 const left=Math.max(0,100-[...listed.values()].reduce((a,b)=>a+b,0));
 const rows=[...listed.entries()];
 if(pool.length&&left>0)for(const n of pool)rows.push([n,left/pool.length]);
 const total=rows.reduce((a,[,v])=>a+v,0);
 names271.shares[cc]=rows.map(([n,v])=>[n,v/total]);
}
function weightedSurname271(cc){
 const rows=names271.shares[cc];let t=Math.random();
 for(const [n,v] of rows){t-=v;if(t<0)return n;}
 return rows.at(-1)[0];
}
{
 const base=identitySurname;
 identitySurname=function(country,gender){
  if(names271.shares[country])return genderSurname256(weightedSurname271(country),gender,country);
  return base(country,gender);
 };
}

// ---------- 3. Египет: имя отца и имя деда ----------
// Полное имя — «Омар Махмуд Ахмед»: личное, отца, деда. Только однословные имена, чтобы было не больше трёх слов.
function egMale271(){const list=countries.eg.names[1].filter(n=>!n.includes(' '));return pick(list);}
function egChainParts271(){const a=egMale271();let b=egMale271();for(let i=0;i<5&&b===a;i++)b=egMale271();return [a,b];}
function egChain271(p){
 if(!p)return false;
 if((p===s?s.nameStyle271:p.nameStyle271)==='chain')return true;
 return false;
}
{
 const base=defaultParts256;
 defaultParts256=function(country,gender){return country==='eg'?egChainParts271():base(country,gender);};
}
function egOrigin271(p){const o=p?.origins?.[0];return !o||['египетское','коптское','нубийское','бедуинское'].includes(o);}

// ---------- 4. Генератор и разбор имён ----------
// name() сам запоминает, из чего собрано имя, и person() больше не угадывает имя и фамилию по строке.
// Раньше «Юн Минджун» разбиралось как имя «Юн» (оно есть среди китайских мужских имён) — и фамилией становилось имя.
name=function(country,gender){
 country=countries[country]?country:'nl';
 if(namesLife!==s){namesLife=s;nameReservations=new Set();}
 if(names271.life!==s){names271.life=s;names271.meta=new Map();}
 const used=new Set([...(s?.people||[]).map(p=>p.name),...nameReservations]);
 const mine=typeof playerNames270==='function'?playerNames270():[];
 let result,meta;
 for(let i=0;i<100;i++){
  const given=pick(countries[country].names[gender==='m'?1:0]),parts=defaultParts256(country,gender);
  result=fullName256(given,parts,country);
  meta={given,parts,joiner:' ',country,gender,style:country==='eg'?'chain':null};
  if(!used.has(result)&&!mine.includes(result))break;
 }
 nameReservations.add(result);
 names271.meta.set(result,meta);
 if(names271.meta.size>800)names271.meta.delete(names271.meta.keys().next().value);
 return result;
};
function givenLists271(country,gender){
 const i=gender==='m'?1:0,c=countries[country],rm=names271.data.countries?.[country]?.remove||{};
 return [...new Set([...(c?.names?.[i]||[]),...(rm[gender==='m'?'m':'f']||[]),...(c?.names?.[1-i]||[])])].sort((a,b)=>b.length-a.length);
}
function parseGiven271(text,country,gender){
 const list=givenLists271(country,gender);
 const start=list.find(n=>text===n||text.startsWith(n+' ')),end=list.find(n=>text.endsWith(' '+n));
 return east271.includes(country)?(end||start||null):(start||null);
}
function nameHas271(text,given){return !!given&&(text===given||text.startsWith(given+' ')||text.endsWith(' '+given));}
// Поля имени заново из того, что видно на экране (имя не меняется).
function rederive271(p){
 const text=String(p.name||'').trim();if(!text||p===s)return;
 const country=country271(p);
 let given=parseGiven271(text,country,p.gender);
 if(!given){const w=text.split(' ');given=east271.includes(country)&&w.length>1?w.at(-1):w[0];}
 const rest=text===given?'':text.startsWith(given+' ')?text.slice(given.length+1):text.slice(0,-given.length-1);
 p.givenName166=given;p.surnameParts256=rest?parseParts256(rest,country,p.gender):[];p.surnameJoiner256=' ';
 p.surname=p.surnameParts256.join(' ');p.name=text;p.naming256=true;
}
{
 const base=identity256;
 identity256=function(p){
  if(!p||p===s||p.naming256)return base(p);
  const text=String(p.name||'').trim(),meta=names271.meta.get(text);
  if(meta&&!p.givenName166){
   setPersonName256(p,meta.given,meta.parts,meta.joiner);p.name=text;p.birthSurname256??=p.surname;
   if(meta.style)p.nameStyle271=meta.style;
   return p;
  }
  const country=country271(p);
  // Поля устарели (имя заменили после создания человека): разбираем то, что видно.
  if(p.givenName166&&text&&!nameHas271(text,p.givenName166)){delete p.givenName166;delete p.surname;}
  if(!p.givenName166&&text){const g=parseGiven271(text,country,p.gender);if(g)p.givenName166=g;}
  const r=base(p);
  // Старое сохранение: порядок слов не переворачиваем («Чжан Цзе» у мигранта во втором поколении остаётся как было).
  if(names271.loading&&text&&p.name!==text&&text.split(' ').sort().join(' ')===p.name.split(' ').sort().join(' '))p.name=text;
  return r;
 };
}

// ---------- 5. Чья фамилия у ребёнка ----------
// Культура фамилии — для рода (Зорин/Зорина): по стране рождения того, от кого фамилия, а не по стране ребёнка.
function cultureOf271(p){
 if(!p)return null;
 const own=p===s?s.surnameCulture271:p.surnameCulture271;if(own)return own;
 const o=p.origins?.[0];const g=o&&(originGender271(o)||familyNameCountries166[o]);
 return g&&countries[g]?g:country271(p);
}
function fatherOf271(list){return list.find(p=>(p===s?s.gender:p.gender)==='m')||null;}
function motherOf271(list,father){return list.find(p=>p!==father&&(p===s?s.gender:p.gender)==='f')||list.find(p=>p!==father)||null;}
// Фамилия для наследования: у es/mx/br и nl — та, что была до брака (официальная), у остальных — нынешняя.
{
 parentParts256=function(p){
  if(p!==s)identity256(p);
  if(p.legalSurnameParts256?.length)return [...p.legalSurnameParts256];
  const c=cultureOf271(p);
  if(['es','mx','br','nl'].includes(c)){
   const pre=p===s?s.preMarriageSurname256:p.marriageName271?.prior;
   if(pre?.parts?.length&&pre.surname!==p.surname)return [...pre.parts];
  }
  const parts=parts271(p);
  return parts.length?parts:parseParts256(p.surname,country271(p),p.gender);
 };
}
const customDefault271={es:'es',mx:'es',br:'br',jp:'jp',kr:'father',cn:'father',eg:'eg'};
function childChoiceList271(child,parents){
 const list=parents.filter(Boolean),country=child.birthCountry||child.country||s.country,out=[];
 const gender=child===s?s.gender:child.gender;
 const conv=(parts,src)=>parts.map(n=>genderSurname256(n,gender,cultureOf271(src)));
 const add=(label,parts,joiner,src,extra={})=>{
  if(!parts?.length||parts.some(x=>!x))return;
  const key=parts.join(joiner);if(out.some(o=>o.parts.join(o.joiner)===key))return;
  out.push({label,parts:[...parts],joiner,culture:src?cultureOf271(src):null,...extra});
 };
 if(!list.length){add('Текущая фамилия',parentParts256(child),joiner271(child),child);return out;}
 const hasPlayer=list.includes(s);
 const label=p=>p===s?'Ваша фамилия':hasPlayer?'Фамилия второго родителя':(p===fatherOf271(list)?'Фамилия отца':'Фамилия матери');
 const father=fatherOf271(list),mother=motherOf271(list,father);
 const first=father&&list.length===2&&father!==mother?father:list[0],second=list.find(p=>p!==first)||null;
 const rule=customDefault271[country]||'father';
 // Египет: имя отца и имя деда; за границей — имя отца как постоянная фамилия.
 if(egChain271(father)||country==='eg'&&father&&cultureOf271(father)==='eg'&&egOrigin271(father)){
  const fp=parts271(father);
  if(country==='eg')add('Имя отца и имя деда',[given271(father),fp[0]||egMale271()],' ',null,{style:'chain'});
  else add('Имя отца как фамилия',[given271(father)],' ',null,{style:'fixed'});
 }else if(country==='eg'&&!father&&list.every(p=>cultureOf271(p)==='eg')){
  add('Имена по мужской линии',egChainParts271(),' ',null,{style:'chain'});
 }
 const pp=p=>parentParts256(p);
 if(rule==='jp'){
  const shared=second&&parts271(first).join(' ')===parts271(second).join(' ');
  if(shared)add('Общая фамилия семьи',conv(parts271(first),first),joiner271(first),first);
  // Ребёнок японца и иностранца записан на японского родителя — его фамилия первой.
  const jpParent=second&&[first,second].filter(p=>cultureOf271(p)==='jp');
  const order=jpParent?.length===1?[jpParent[0],jpParent[0]===first?second:first]:[first,second];
  add(label(order[0]),conv(pp(order[0]),order[0]),joiner271(order[0]),order[0]);
  if(order[1])add(label(order[1]),conv(pp(order[1]),order[1]),joiner271(order[1]),order[1]);
  return out;
 }
 if(['es','br'].includes(rule)&&second){
  const a=conv([inheritedPart256(first)],first)[0],b=conv([inheritedPart256(second)],second)[0];
  const lead=first===s?'сначала ваша':second===s?'сначала второго родителя':'сначала отца';
  const other=first===s?'сначала второго родителя':second===s?'сначала ваша':'сначала матери';
  const pair=rule==='br'&&father&&mother&&father!==mother?[[b,a],[a,b]]:[[a,b],[b,a]];
  const labels=rule==='br'&&father&&mother&&father!==mother?[other,lead]:[lead,other];
  add('Обе: '+labels[0],pair[0],' ',first);add('Обе: '+labels[1],pair[1],' ',second);
  if(hasPlayer)birthOption271(add,conv);
  return out;
 }
 add(label(first),conv(pp(first),first),joiner271(first),first);
 if(second){
  add(label(second),conv(pp(second),second),joiner271(second),second);
  if(!['kr','cn','eg','jp'].includes(country)){
   const a=conv([inheritedPart256(first)],first)[0],b=conv([inheritedPart256(second)],second)[0],j=country==='nl'?' ':'-';
   if(a!==b){add(first===s?'Двойная: сначала ваша':'Двойная: сначала '+(second===s?'второго родителя':'отца'),[a,b],j,first);add(first===s?'Двойная: сначала второго родителя':'Двойная: сначала '+(second===s?'ваша':'матери'),[b,a],j,second);}
  }
 }
 if(hasPlayer)birthOption271(add,conv);
 return out;
}
function birthOption271(add,conv){
 const b=birthSurname271();
 if(b&&b.surname!==s.surname)add('Ваша фамилия при рождении',conv(b.parts,s),b.joiner,s);
}
{
 const base=childChoices256;
 childChoices256=function(child,parents){
  const list=parents.filter(Boolean),country=child.birthCountry||child.country;
  // es и nl: у общих детей пары один порядок фамилий (как было в 256).
  const stored=list.length===2&&s.familyNames256?.[parentKey256(list)];
  if(stored&&['es','nl'].includes(country))return base(child,parents);
  const out=childChoiceList271(child,parents);
  return out.length?out:base(child,parents);
 };
}
function applyChoice271(p,choice){
 if(!choice)return;
 setName271(p,given271(p),choice.parts,choice.joiner);
 if(p===s){s.surnameCulture271=choice.culture||null;if(choice.style)s.nameStyle271=choice.style;}
 else{p.surnameCulture271=choice.culture||null;if(choice.style)p.nameStyle271=choice.style;else if(p.nameStyle271==='chain')delete p.nameStyle271;}
}
// Фамилия при рождении у игрока: её можно вернуть при разводе и дать ребёнку.
function birthSurname271(){
 if(!s)return null;
 if(s.birthSurname271)return s.birthSurname271;
 const pre=s.preMarriageSurname256;
 if(!pre&&!s.people.some(p=>p.married||p.divorced))return {surname:s.surname,parts:parts271(s),joiner:joiner271(s)};
 const parents=s.people.filter(p=>['Мать','Отец'].includes(p.role));
 const old=s.birthSurname256;
 if(old&&parents.some(p=>genderSurname256(p.surname||'',s.gender,cultureOf271(p))===old))return {surname:old,parts:parseParts256(old,country271(s),s.gender),joiner:' '};
 return pre?{surname:pre.surname,parts:[...pre.parts],joiner:pre.joiner||' '}:null;
}

// ---------- 6. Повторы имён в семье ----------
// Ребёнок не получает личное имя живого родителя, брата, сестры, бабушки или дедушки (раньше: мать и дочь Диана,
// два Петра среди братьев). Имя умершего повторять можно — детей называют в честь дедов.
function familyGiven271(p){
 const set=new Set();
 if(p!==s&&s?.name)set.add(s.name);
 const partner=typeof currentPartner==='function'?currentPartner():null;
 for(const q of s?.people||[])if(q!==p&&q.alive!==false&&q.givenName166&&(q===partner||kin27(q)))set.add(q.givenName166);
 return set;
}
function dedupeFamily271(p){
 if(!p||p===s||!p.givenName166||!familyGiven271(p).has(p.givenName166))return false;
 const taken=familyGiven271(p),country=country271(p),parts=parts271(p),joiner=joiner271(p);
 const pool=typeof givenPool270==='function'?givenPool270(p,country):(countries[country]?.names?.[p.gender==='m'?1:0]||[]);
 for(const g of shuffle271(pool)){
  if(taken.has(g))continue;
  const full=fullName256(g,parts,country,joiner);
  if(typeof nameTaken270==='function'&&nameTaken270(p,full))continue;
  setPersonName256(p,g,parts,joiner);
  return true;
 }
 return false;
}
{
 const base=childBirthIdentity166;
 childBirthIdentity166=function(child,parents){
  const r=base(child,parents);
  try{
   const choice=childChoices256(child,parents)[0];
   if(choice){child.surnameCulture271=choice.culture||null;if(choice.style)child.nameStyle271=choice.style;}
   if(dedupeFamily271(child)&&typeof dedupeGiven270==='function')dedupeGiven270(child);
  }catch(e){console.error(e);}
  return r;
 };
}
{
 const base=saveChildName256;
 saveChildName256=function(id,given,index){
  const p=living(id),choice=p&&index>=0?childChoices256(p,childParents256(p))[index]:null;
  const r=base(id,given,index);
  if(r&&p&&choice){p.surnameCulture271=choice.culture||null;if(choice.style)p.nameStyle271=choice.style;}
  return r;
 };
}
// Египет у людей, которым семья выбирает имя по происхождению: в Египте — цепочка имён.
{
 const base=familyName166;
 familyName166=function(country,gender,origin){
  if(origin&&names271.origins[origin])return originName271(country,gender,origin);
  return base(country,gender,origin);
 };
 const assign=assignFamilyName166;
 assignFamilyName166=function(p,country,origin){
  const r=assign(p,country,origin);
  try{
   delete p.nameStyle271;
   if((p.birthCountry||country)==='eg'&&(p.country||country)==='eg'&&egOrigin271({origins:[origin]})){
    setPersonName256(p,p.givenName166,egChainParts271(),' ');p.nameStyle271='chain';p.birthSurname256=p.surname;
    if(typeof dedupeGiven270==='function')dedupeGiven270(p);
   }
  }catch(e){console.error(e);}
  return r;
 };
}

// ---------- 7. Брак и развод ----------
// Как часто при свадьбе один из супругов берёт фамилию другого (обычай, не закон). В Японии у супругов одна фамилия.
const marryRates271={ru:.75,rs:.8,pl:.8,de:.7,nl:0,us:.7,uk:.75,ca:.4,au:.7,za:.7,fr:.6,it:0,es:0,mx:0,br:.5,jp:1,kr:0,cn:0,eg:0,ma:0,tr:.9,th:.5,in:.6,id:0,no:.5};
function takeName271(x,y,how='take'){
 const prior={surname:x.surname,parts:parts271(x),joiner:joiner271(x),culture:cultureOf271(x)};
 const yParts=parts271(y).map(n=>genderSurname256(n,x.gender,cultureOf271(y)));
 const parts=how==='add'?[parts271(x)[0],yParts.at(-1)]:yParts;
 if(!parts.length||parts.some(n=>!n)||parts.join(joiner271(y))===x.surname)return false;
 x.marriageName271={spouse:y===s?'player':y.id,prior,tick:s.clock?.ticks??0};
 setPersonName256(x,x.givenName166,parts,how==='add'?' ':joiner271(y));
 x.surnameCulture271=how==='add'?prior.culture:cultureOf271(y);
 return true;
}
// Пара NPC: кто меняет фамилию. old — поколение бабушек и дедушек: почти всегда, если в стране так принято.
function coupleName271(a,b,country,old=false){
 if(!a||!b||a===s||b===s||a.gender===undefined)return null;
 a.marriageDecided271=b.id;b.marriageDecided271=a.id;
 if(egChain271(a)||egChain271(b))return null;
 let rate=marryRates271[country]??.5;if(old&&rate>0)rate=Math.max(rate,.9);
 const jp=country==='jp'&&cultureOf271(a)==='jp'&&cultureOf271(b)==='jp';
 if(a.gender!==b.gender){
  const wife=a.gender==='f'?a:b,husband=wife===a?b:a;
  if(jp)return takeName271(...(Math.random()<.95?[wife,husband]:[husband,wife]))?wife:null;
  // В Японии в браке с иностранцем каждый сохраняет свою фамилию.
  if(country==='jp')return null;
  if(Math.random()>=rate)return null;
  return takeName271(wife,husband,country==='br'?'add':'take')?wife:null;
 }
 if(jp||Math.random()<rate*.3){const [x,y]=Math.random()<.5?[a,b]:[b,a];return takeName271(x,y)?x:null;}
 return null;
}
function restoreName271(x){
 const prior=x.marriageName271?.prior;if(!prior?.parts?.length)return false;
 setPersonName256(x,x.givenName166,prior.parts,prior.joiner||' ');
 x.surnameCulture271=prior.culture||null;
 delete x.marriageName271;
 return true;
}
// Вместе: общий союз в семейном древе или брак NPC с этим же человеком.
function together271(p,sp){
 if(!p||!sp)return false;
 if(s.family27?.unions?.some(u=>u.status==='together'&&[u.a,u.b].includes(p.id)&&[u.a,u.b].includes(sp.id)))return true;
 return !!(p.npcMarried54&&sp.npcMarried54&&((typeof spouseSoc270==='function'&&spouseSoc270(p)===sp)||p.agency55?.partner===sp.id||sp.agency55?.partner===p.id));
}
// Супруг NPC, с которым ещё не решали вопрос фамилии: только настоящий брак (отметка о браке у обоих).
function npcSpouse271(p){
 if(!p?.alive||!p.npcMarried54)return null;
 let sp=typeof spouseSoc270==='function'?spouseSoc270(p):null;
 if(!sp){const u=s.family27?.unions?.find(u=>u.status==='together'&&[u.a,u.b].includes(p.id));sp=u&&living(u.a===p.id?u.b:u.a);}
 if(!sp&&p.agency55?.partner)sp=living(p.agency55.partner);
 return sp&&sp!==s&&sp.npcMarried54?sp:null;
}
// Раз в месяц: новые браки NPC — по обычаю страны; развод — фамилию обычно возвращают.
function npcNames271(){
 if(!s||s.dead)return;
 for(const p of s.people){
  if(!p.alive||p===s)continue;
  const m=p.marriageName271;
  if(m&&m.spouse!=='player'&&!m.kept){
   const sp=s.people.find(q=>q.id===m.spouse);
   if(sp&&!sp.alive)m.kept=true;
   else if(sp&&!together271(p,sp)){
    const old=p.name;
    if(Math.random()<(p.country==='jp'?1:.8)&&restoreName271(p)){remember(p,(p.gender==='f'?'вернула':'вернул')+' добрачную фамилию: '+p.surname);if(kin27(p)&&p.bond>=40)log('Фамилия после развода · '+p.givenName166,old+' — теперь снова '+p.name+'.','Жизнь близких');}
    else m.kept=true;
   }
  }
  const sp=npcSpouse271(p);
  if(!sp||p.marriageDecided271===sp.id||sp.marriageDecided271===p.id)continue;
  const before=[p.name,sp.name],who=coupleName271(p,sp,p.country||s.country);
  if(who){
   remember(who,(who.gender==='f'?'сменила':'сменил')+' фамилию после свадьбы: '+who.surname);
   if(kin27(who)&&who.bond>=40)log('Новая фамилия · '+who.givenName166,(who===p?before[0]:before[1])+' — теперь '+who.name+'.','Жизнь близких');
  }
 }
}

// Брак игрока: варианты фамилии. already — брак уже заключён (согласие на предложение партнёра).
function marriageNames271(p,finish,already=false){
 identity256(s);identity256(p);
 const valid=()=>!s.dead&&p.alive&&(already?p.married:!s.people.some(q=>q.married));
 const done=surname=>{if(valid())finish(surname);};
 // Египет: при браке имена не меняются.
 if(s.country==='eg'&&(s.birthCountry||s.country)==='eg'){done();return;}
 const mine=cultureOf271(s),theirs=cultureOf271(p);
 const own=s.surname,ownParts=parts271(s),ownJoiner=joiner271(s);
 const takeParts=parts271(p).map(n=>genderSurname256(n,s.gender,theirs)),takeJoiner=joiner271(p),take=takeParts.join(takeJoiner);
 const record=()=>{
  s.birthSurname271??=birthSurname271();
  s.preMarriageSurname256={surname:own,parts:[...ownParts],joiner:ownJoiner,culture:mine};
  if(['nl','es','mx','br'].includes(mine)&&!s.legalSurnameParts256){s.legalSurnameParts256=[...ownParts];s.legalSurname256=own;}
 };
 const apply=(parts,joiner,culture)=>{
  if(!valid())return;
  record();
  const next=parts.join(joiner),changed=next!==own;
  s.surnameParts256=[...parts];s.surnameJoiner256=joiner;
  if(changed)s.surnameCulture271=culture;
  finish(changed?next:undefined);
 };
 const giveParts=ownParts.map(n=>genderSurname256(n,p.gender,mine));
 const partnerTakes=()=>{
  if(!valid())return;
  apply(ownParts,ownJoiner,mine);
  if(takeName271(p,s)){remember(p,(p.gender==='f'?'взяла':'взял')+' вашу фамилию после свадьбы');log('Общая фамилия',p.name+': теперь у вас одна фамилия.','Семья');}
 };
 const partnerName=fullName256(p.givenName166,giveParts,country271(p),ownJoiner);
 const jp=(s.birthCountry||s.country)==='jp'&&country271(p)==='jp';
 if(jp){
  if(own===p.surname){done();return;}
  show('Общая фамилия',namingNote256('jp'),[
   {label:'Ваша · '+own,hint:'Партнёр: '+partnerName,fn:partnerTakes},
   {label:'Партнёра · '+take,fn:()=>apply(takeParts,takeJoiner,theirs)}
  ]);
  return;
 }
 const opts=[{label:'Оставить свою · '+own,fn:()=>apply(ownParts,ownJoiner,mine)}];
 if(take!==own)opts.push({label:'Взять фамилию партнёра · '+take,fn:()=>apply(takeParts,takeJoiner,theirs)});
 if(giveParts.join(ownJoiner)!==p.surname)opts.push({label:'Партнёр возьмёт вашу · '+partnerName,fn:partnerTakes});
 const a=genderSurname256(inheritedPart256(s),s.gender,mine),b=genderSurname256(inheritedPart256(p),s.gender,theirs);
 if(a&&b&&a!==b)opts.push({label:'Соединить фамилии · '+a+'-'+b,fn:()=>apply([a,b],'-',mine)});
 show('Фамилия после свадьбы',namingNote256(s.country),opts);
}
marriageNameOptions256=function(p,finish){return marriageNames271(p,finish,false);};
// Развод: кто менял фамилию, по умолчанию возвращает прежнюю (её вариант — первый), можно оставить нынешнюю.
// Партнёр, который брал вашу фамилию, возвращает свою.
function partnerBack271(p){
 if(p?.marriageName271?.spouse!=='player')return;
 const old=p.name;
 if(restoreName271(p)){remember(p,(p.gender==='f'?'вернула':'вернул')+' добрачную фамилию: '+p.surname);log('Фамилия после развода · '+p.givenName166,old+' — теперь снова '+p.name+'.','Семья');}
}
divorceName256=function(p,finish){
 identity256(s);
 const prior=s.preMarriageSurname256,birth=birthSurname271(),cur=s.surname;
 const end=()=>{finish();partnerBack271(p);};
 const restore=x=>{s.surname=x.surname;s.surnameParts256=[...(x.parts?.length?x.parts:[x.surname])];s.surnameJoiner256=x.joiner||' ';s.surnameCulture271=x.culture||null;};
 const opts=[];
 if(prior&&prior.surname!==cur)opts.push({label:'Вернуть добрачную · '+prior.surname,fn:()=>{restore(prior);end();}});
 if(birth&&birth.surname!==cur&&birth.surname!==prior?.surname)opts.push({label:'Вернуть фамилию при рождении · '+birth.surname,fn:()=>{restore(birth);end();}});
 if(!opts.length){end();return;}
 opts.push({label:'Оставить нынешнюю · '+cur,fn:end});
 show('Фамилия после развода','Выбор касается только вашей фамилии. Имена детей сохранятся.',opts);
};
// Предложение партнёра и развод по его инициативе раньше проходили без выбора фамилии. Теперь после ответа в очереди
// появляется окно с фамилией (оно переживает перезагрузку и не заключает брак второй раз).
if(typeof pendingLabels24==='object'){pendingLabels24.marriageName271='Фамилия после свадьбы';pendingLabels24.divorceName271='Фамилия после развода';}
{
 const base=respondInitiative68;
 respondInitiative68=function(id,accept){
  const q=initiatives68().offers.find(q=>q.id===id),p=q&&living(q.person),was=!!p?.married;
  const r=base(id,accept);
  try{
   if(r&&accept&&p){
    if(q.kind==='marry'&&p.married&&!was){queueOnce({type:'marriageName271',id:p.id});s.clock.running=false;}
    if(q.kind==='divorce'&&!p.married&&was){queueOnce({type:'divorceName271',id:p.id});s.clock.running=false;}
   }
  }catch(e){console.error(e);}
  return r;
 };
}
let teen271=null;
{
 const base=resolvePending;
 resolvePending=function(...args){
  const q=s?.pending?.[0];
  if(q?.type==='marriageName271'||q?.type==='divorceName271'){
   const p=s.people.find(x=>x.id===q.id);
   const drop=()=>{s.pending=s.pending.filter(x=>x!==q);};
   if(!p||(q.type==='marriageName271'&&!p.married)){drop();save();return resolvePending(...args);}
   if(q.type==='marriageName271')return marriageNames271(p,surname=>{drop();if(surname){s.surname=surname;log('Новая фамилия','Ваша фамилия теперь '+surname+'.','Семья');}save();render();},true);
   const before=$('#modal').open;
   divorceName256(p,()=>{drop();save();render();});
   if(!before&&!$('#modal').open&&s.pending.includes(q)){drop();save();}
   return;
  }
  // Друг-подросток: пол — по имени из приглашения (раньше пол выбирался заново и мог не совпасть с именем).
  teen271=q?.type==='teen'&&q.name?{q,tick:s.clock?.ticks}:null;
  if(teen271&&!q.gender271)q.gender271=names271.meta.get(q.name)?.gender||genderByName271(q.name,s.country);
  return base.apply(this,args);
 };
}
function genderByName271(text,country){
 const i=parseGiven271(text,country,'f');if(!i)return pick(['f','m']);
 const f=countries[country]?.names?.[0]?.includes(i)||names271.data.countries?.[country]?.remove?.f?.includes(i);
 return f?'f':'m';
}
{
 const base=person;
 person=function(...args){
  const t=teen271;
  if(t&&args[0]==='Друг'&&args[2]===undefined&&!s.pending.includes(t.q)&&(s.clock?.ticks??0)===t.tick){
   teen271=null;
   const p=base(args[0],args[1],t.q.gender271,args[3]);
   const meta=names271.meta.get(t.q.name);
   if(meta){setPersonName256(p,meta.given,meta.parts,meta.joiner);p.name=t.q.name;}
   else{p.name=t.q.name;rederive271(p);}
   return p;
  }
  return base(...args);
 };
}
// Коллега из истории про аренду: имя заменяли после создания, а поля оставались от прежнего.
if(typeof beginRentStory==='function'){
 const base=beginRentStory;
 beginRentStory=function(...args){
  const r=base.apply(this,args);
  try{const c=s?.rentStory&&s.people.find(p=>p.id===s.rentStory.colleagueId);if(c&&!nameHas271(c.name,c.givenName166))rederive271(c);}catch(e){console.error(e);}
  return r;
 };
}

// ---------- 8. Семья при рождении игрока ----------
// Раньше фамилия игрока бралась у мамы без рода и без папы («Антон Воробьёва»), а сиблинг, бабушки и дедушки
// получали случайные фамилии. Теперь: брак родителей — по обычаю страны, игрок и сиблинги — по правилу страны
// для детей, дедушка и бабушка — по линии своего ребёнка.
let startCtx271=null;
{
 const base=start;
 start=function(...args){
  startCtx271={typed:String($('#name')?.value||'').trim(),done:false};
  try{return base.apply(this,args);}finally{startCtx271=null;}
 };
}
function splitTyped271(text,country,gender){
 const t=text.replace(/\s+/g,' ').trim();if(!t.includes(' '))return {given:t,surname:''};
 const known=givenLists271(country,gender);
 if(known.includes(t))return {given:t,surname:''};
 if(east271.includes(country)){const g=known.find(n=>t.endsWith(' '+n));if(g)return {given:g,surname:t.slice(0,-g.length-1)};}
 const g=known.find(n=>t.startsWith(n+' '));
 if(g)return {given:g,surname:t.slice(g.length+1)};
 const i=t.indexOf(' ');return {given:t.slice(0,i),surname:t.slice(i+1)};
}
function startFamily271(typed){
 const ps=s.people.filter(p=>p.alive&&['Мать','Отец'].includes(p.role));
 const dad=ps.find(p=>p.role==='Отец'),mom=ps.find(p=>p.role==='Мать');
 const birth=s.birthCountry||s.country,ch=s.family17?.childhood131,rule=customDefault271[birth]||'father';
 const origin=s.origins?.length===1?s.origins[0]:null;
 // Имя, введённое при создании: «Имя Фамилия» — фамилия семьи (её получает линия, от которой она идёт к детям).
 let given=s.name,typedParts=null;
 if(typed){
  const sp=splitTyped271(typed,birth,s.gender);given=sp.given;
  if(sp.surname&&birth!=='eg'){
   typedParts=parseParts256(sp.surname,birth,s.gender);
   if(rule==='es'||rule==='br'){
    if(typedParts.length===2&&dad&&mom){
     const put=(p,x)=>{const cur=parts271(p);if(rule==='br')cur[cur.length-1]=x;else cur[0]=x;setPersonName256(p,p.givenName166,cur,' ');};
     put(dad,rule==='br'?typedParts[1]:typedParts[0]);put(mom,rule==='br'?typedParts[0]:typedParts[1]);
    }
   }else for(const p of rule==='jp'?ps:[dad||ps[0]].filter(Boolean))setPersonName256(p,p.givenName166,typedParts.map(n=>genderSurname256(n,p.gender,birth)),' ');
  }
 }
 // Личное имя — по происхождению семьи; если у родителей разные происхождения, но одна культура (семья мигрантов
 // из одной страны), — по этой культуре, а не по стране рождения.
 const cultures=[...new Set(ps.map(cultureOf271))];
 const givenFor271=g=>origin||cultures.length!==1?familyName166(birth,g,origin).given:familyName166(cultures[0],g,null).given;
 if(!typed&&!origin&&cultures.length===1&&cultures[0]!==birth)given=givenFor271(s.gender);
 s.name=given;
 for(const p of ps)p.birthSurname271={surname:p.surname,parts:parts271(p),joiner:joiner271(p),culture:cultureOf271(p)};
 // Родители вместе — фамилия по обычаю страны рождения игрока.
 if(dad&&mom&&!ch)coupleName271(mom,dad,birth);
 const kids=[s,...s.people.filter(p=>p.alive&&['Брат','Сестра'].includes(p.role))];
 const parents=ch?.unknown?ps.filter(p=>p.id===ch.caregiverId):[dad,mom].filter(Boolean);
 for(const k of kids){
  if(k!==s){
   // Сиблинг из той же семьи: та же страна рождения, происхождение и имя из того же источника, что у игрока.
   k.birthCountry=birth;k.origins=[...(s.origins||[])];k.citizenships=[...(s.citizenships||[])];
   k.birthYear=(s.birthYear??s.year)-(k.age-s.age);
   k.givenName166=givenFor271(k.gender);
  }
  const choice=childChoices256(k===s?{gender:s.gender,birthCountry:birth,country:s.country}:k,parents)[0];
  if(choice)applyChoice271(k,choice);
  if(k!==s){k.birthSurname256=k.surname;k.naming256=true;}
 }
 if(typedParts)setName271(s,s.name,typedParts,' ');
 s.birthSurname256=s.surname;
 s.birthSurname271={surname:s.surname,parts:parts271(s),joiner:joiner271(s),culture:cultureOf271(s)};
 // Повторы имён: игрок не тёзка родителей, сиблинг не тёзка игрока и родителей.
 if(!typed){
  const taken=new Set(ps.map(p=>p.givenName166));
  for(let i=0;i<20&&taken.has(s.name);i++)s.name=givenFor271(s.gender);
 }
 for(const k of kids)if(k!==s){dedupeFamily271(k);if(typeof dedupeGiven270==='function')dedupeGiven270(k);}
}
// Бабушка и дедушка — по линии своего ребёнка (родителя игрока).
function grandLine271(gp){
 const parent=s.people.find(p=>p.bio27?.parents?.includes(gp.id)&&['Мать','Отец'].includes(p.role));if(!parent)return;
 const birth=parent.birthSurname271||{parts:parts271(parent),joiner:joiner271(parent),culture:cultureOf271(parent)};
 const culture=birth.culture||cultureOf271(parent),rule=customDefault271[country271(parent)]||'father';
 const bp=birth.parts||[];if(!bp.length)return;
 gp.surnameCulture271=culture;
 const g=x=>genderSurname256(x,gp.gender,culture);
 const keepOwn=parts271(gp);
 if(egChain271(parent)||country271(parent)==='eg'&&egOrigin271(parent)){
  if(gp.gender==='m'){setPersonName256(gp,bp[0]||egMale271(),[bp[1]||egMale271(),egMale271()],' ');gp.nameStyle271='chain';}
 }else if((rule==='es'||rule==='br')&&bp.length>=2){
  const mine=rule==='es'?(gp.gender==='m'?bp[0]:bp[1]):(gp.gender==='m'?bp.at(-1):bp[0]);
  if(mine){const rest=keepOwn.filter(x=>x!==mine);const parts=rule==='es'?[mine,rest[0]||identitySurname(culture,gp.gender)]:[rest[0]||identitySurname(culture,gp.gender),mine];setPersonName256(gp,gp.givenName166,parts.map(g),' ');}
 }else if(gp.gender==='m'||rule==='jp'){
  setPersonName256(gp,gp.givenName166,bp.map(g),birth.joiner||' ');
 }
 gp.birthSurname256=gp.surname;
 // Пара бабушки и дедушки: жена по обычаю (их поколение почти всегда брало фамилию мужа, где так принято).
 const other=s.people.find(q=>q!==gp&&parent.bio27.parents.includes(q.id)&&q.alive&&['Бабушка','Дедушка'].includes(q.role));
 if(other&&gp.gender==='m'&&!other.marriageDecided271&&rule!=='jp'&&!((rule==='es'||rule==='br')&&bp.length>=2))coupleName271(other,gp,country271(parent),true);
 if(other&&rule==='jp'&&other.gender==='f'&&other.surname!==gp.surname)setPersonName256(other,other.givenName166,bp.map(x=>genderSurname256(x,'f',culture)),birth.joiner||' ');
}
{
 const base=createGrandparents145;
 createGrandparents145=function(...args){
  const ctx=startCtx271;
  if(ctx&&!ctx.done){ctx.done=true;try{startFamily271(ctx.typed);}catch(e){console.error(e);}}
  const before=new Set((s?.people||[]).map(p=>p.id));
  const r=base.apply(this,args);
  try{
   const fresh=(s?.people||[]).filter(p=>!before.has(p.id)&&['Бабушка','Дедушка'].includes(p.role));
   for(const gp of fresh.filter(p=>p.gender==='m'))grandLine271(gp);
   for(const gp of fresh.filter(p=>p.gender!=='m'))grandLine271(gp);
   // У дедушки в Египте имя — часть цепочки отца, его не меняем.
   for(const gp of fresh)if(!(gp.nameStyle271==='chain'&&gp.gender==='m')){dedupeFamily271(gp);if(typeof dedupeGiven270==='function')dedupeGiven270(gp);}
   if(ctx){
    const entry=s.log.find(q=>q.age===0&&q.title==='У этой истории появилось имя');
    if(entry&&typeof familyBirthText166==='function')entry.text=familyBirthText166();
   }
  }catch(e){console.error(e);}
  return r;
 };
}

// ---------- 9. Приёмные дети и дети, о которых договорились заранее ----------
function patchRecent271(old,now){
 if(!old||old===now)return;
 for(const e of (s.log||[]).slice(0,8)){if(e.title?.includes(old))e.title=e.title.split(old).join(now);if(e.text?.includes(old))e.text=e.text.split(old).join(now);}
 for(const p of s.people){const h=p.bio27?.history?.at(-1);if(h?.text?.includes(old))h.text=h.text.split(old).join(now);}
}
function adoptName271(child,parents){
 const old=child.name,choice=childChoices256(child,parents)[0];
 if(choice)applyChoice271(child,choice);
 child.birthSurname256=child.surname;
 dedupeFamily271(child);if(typeof dedupeGiven270==='function')dedupeGiven270(child);
 patchRecent271(old,child.name);
}
function homePartner271(){const p=currentPartner();return p&&(p.married||p.cohabit)&&p.country===s.country?p:null;}
{
 const base=autonomousMonth;
 autonomousMonth=function(...args){
  const before=new Set((s?.people||[]).map(p=>p.id));
  const r=base.apply(this,args);
  try{
   for(const p of s.people.filter(p=>!before.has(p.id)&&p.role==='Ребенок'&&p.alive&&p.adopted49&&!p.nameParents256)){
    const partner=p.parentId?living(p.parentId):homePartner271();
    const parents=[s,partner].filter(Boolean);
    p.nameParents256=parents.map(x=>x===s?'player':x.id);
    adoptName271(p,parents);
    p.namePending256=true;s.clock.running=false;
   }
   npcNames271();
  }catch(e){console.error(e);}
  return r;
 };
}
// Ребёнок по плану «Завести ребёнка» (game.js, раз в год): раньше — случайное имя без выбора и без фамилии семьи.
{
 const base=rollYear;
 rollYear=function(...args){
  const before=new Set((s?.people||[]).map(p=>p.id));
  const r=base.apply(this,args);
  try{
   for(const p of s.people.filter(p=>!before.has(p.id)&&p.role==='Ребенок'&&p.alive&&!p.nameParents256&&p.birth49)){
    const other=p.parentId&&living(p.parentId),parents=[s,other||(p.adopted49?homePartner271():null)].filter(Boolean);
    const old=p.name;
    if(p.adopted49){p.nameParents256=parents.map(x=>x===s?'player':x.id);adoptName271(p,parents);}
    else{childBirthIdentity166(p,parents);patchRecent271(old,p.name);}
    p.namePending256=true;s.clock.running=false;
   }
  }catch(e){console.error(e);}
  return r;
 };
}
// Однополая пара NPC: ребёнок приёмный, но фамилия семьи, а не случайная.
{
 const base=birthKin27;
 birthKin27=function(u,adopt=false){
  const p=base(u,adopt);
  try{if(p?.adopted49){const parents=[living(u.a),living(u.b)].filter(Boolean);if(parents.length)adoptName271(p,parents);}}catch(e){console.error(e);}
  return p;
 };
}

// ---------- 10. Старые сохранения ----------
// Разовая правка 255 давала детям фамилию игрока без рода («Мария Петрова» → «Мария Соколов»). Делаем её здесь
// с родом, до 255, и ставим ту же отметку — тогда 255 ничего не трогает.
function oldSave255fix271(){
 for(const p of s.people.filter(p=>!p.naming256&&!['es','mx','br'].includes(p.birthCountry||p.country))){p.name=cleanSurname255(p.name);if(p.surname)p.surname=cleanSurname255(p.surname);}
 const surname=parentSurname255(s);
 if(surname)for(const p of s.people.filter(p=>p.role==='Ребенок'&&!p.adopted49&&p.givenName166&&!p.naming256)){const g=genderSurname256(surname,p.gender,cultureOf271(s));p.surname=g;p.name=p.givenName166+' '+g;}
 s.namesFixed255=true;
}
{
 const base=ensureUX;
 ensureUX=function(...args){
  try{if(s&&!s.namesFixed255&&typeof cleanSurname255==='function')oldSave255fix271();}catch(e){console.error(e);}
  names271.loading=true;
  let r;try{r=base.apply(this,args);}finally{names271.loading=false;}
  try{if(s)for(const p of s.people)if(p.naming256&&p.givenName166&&p.name&&!nameHas271(String(p.name).trim(),p.givenName166))rederive271(p);}catch(e){console.error(e);}
  return r;
 };
}

// ---------- 11. Показ ----------
function playerFullName271(){
 if(!s)return '';
 const parts=parts271(s),c=s.birthCountry||s.country;
 return parts.length?fullName256(s.name,parts,c,joiner271(s)):s.name;
}
// «Дети» в карточке родителя: фамилию не дописываем, если она уже есть в имени (раньше «Фудзимото Кадзуки Фудзимото»).
familyChildNames200=function(parent){
 const ids=new Set(parent.bio27?.children||[]);
 if(['Мать','Отец'].includes(parent.role)||s.family17?.adoption141?.parentId===parent.id)ids.add('player');
 return [...ids].map(id=>id==='player'?s:s.people.find(p=>p.id===id)).filter(Boolean)
  .map(p=>p===s?playerFullName271():p.naming256||!p.surname||p.name.split(' ').includes(p.surname.split(' ')[0])?p.name:p.name+' '+p.surname).join(', ');
};
Object.assign(namingNotes256,{
 eg:'Египет: после личного имени идут имя отца и имя деда — так записано в документах. Общей семейной фамилии нет, при браке имена не меняются. Ребёнку, родившемуся за границей, имя отца обычно записывают как фамилию.',
 jp:'Япония: фамилия выводится перед личным именем. В браке у супругов одна фамилия — чаще мужа, но можно выбрать любую из двух, дети получают её же. В браке с иностранцем каждый сохраняет свою.',
 kr:'Корея: фамилия перед личным именем, у половины страны — Ким, Ли или Пак. При браке фамилию не меняют, дети обычно получают фамилию отца.',
 cn:'Китай: фамилия перед личным именем, чаще всего Ван, Ли или Чжан. При браке фамилию не меняют, дети обычно получают фамилию отца.',
 th:'Таиланд: фамилии появились в начале XX века, и у многих семей своя, ни на чью не похожая. Дети обычно получают фамилию отца, жена может взять фамилию мужа или оставить свою.',
 ma:'Марокко: фамилия наследуется от отца и при браке не меняется.',
 in:'Индия: обычаи зависят от региона и семьи. Чаще всего ребёнку передаётся фамилия отца, жена нередко берёт фамилию мужа.',
 id:'Индонезия: наследуемая фамилия есть не у всех — вторым словом бывает имя отца или просто второе имя. Для единого формата у каждого персонажа есть семейная часть имени.',
 tr:'Турция: фамилия передаётся от отца. При браке жена берёт фамилию мужа и может оставить свою рядом с ней.',
 no:'Норвегия: ребёнку дают фамилию одного из родителей или обе. При браке фамилию супруга можно взять, а можно оставить свою.'
});
