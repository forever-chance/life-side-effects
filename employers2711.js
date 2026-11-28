'use strict';
// Сборка 271.1 «Корни названий»: работодатели и своё дело берут корень по точному типу и варианту дела,
// а не по широкому тегу уместности («Радиостанция «Кинопанорама»» больше не получается).
//
// Подключается СРАЗУ ПОСЛЕ employers271.js (обёртки видят только то, что загружено раньше), employers271.js не менялся.
// Данные — org271-data.js (python3 tools/org271_merge.py → tools/org271_build.py): у корня привязки types (точные типы
// страны) и biz (варианты своего дела: «studio:photo», «services:hair», «shop:books» или id каталога 253 «BZ014»),
// у типа numbered («Школа № N», «Городская поликлиника № N»), у страны mix (доли по сферам) и bizOptions.
//
// 1. Работодатели (orgRoster271). Набор типов города выбирает employers271.js, как раньше; этот файл после него
//    перевыбирает корень каждого типа: из корней, привязанных именно к этому типу. Вид корня (meaning/loan/local) и
//    «банальность» (tone «банальный») тянутся по mix сферы страны — например, в России в ИТ половина названий
//    заимствованные, а в Японии почти все местные. Корня в городе не повторяются, пока хватает других. Нумерованный
//    тип корня не берёт: «Школа № 57», номер — по зерну города и типа. Типу, к которому в стране не привязан ни один
//    корень, остаётся прежний путь (корень по тегам уместности из employers271.js). Для сопоставления с профессиями
//    нумерованный тип называется без номера («Школа», «Детский сад»): регулярки employers271.js работают как раньше.
// 2. Своё дело (businessRoots271). Для варианта из bizOptions страны (id — «вид:специальность» или BZ-id) показываются
//    только корни, привязанные к нему; их меньше трёх — добираются теги вида (прежний путь). Варианта нет в данных —
//    прежний путь целиком. Корни с any-тегом больше не идут в конец «на всякий случай»: у варианта они не нужны.
// Сохранённое не переименовывается: записанные вакансии, отклики, работа и компания хранят строку названия, а
// пересобранная вакансия с прежним id берёт работодателя из записанной (keepEmployer271) — новое поведение только у
// вновь создаваемых. Данные без привязок (заготовка, старый org271-data.js) — всё как в 271.
// Без employers271.js (тесты строят «жизнь 270» без файлов 271) файл ничего не делает: ready=false.
const roots2711={ready:typeof orgData271==='function'&&typeof orgRoster271==='function'&&typeof businessRoots271==='function'&&
  typeof orgPrefs271==='function'&&typeof orgMiss271==='function'&&typeof orgProfFit271==='object',fallbackMix:{meaning:.1,loan:.2,local:.7,banal:.4},numberedSuffix:/\s*№\s*N$/};
const roots2711Base=roots2711.ready?{orgData271,orgRoster271,businessRoots271,orgPrefs271,orgMiss271}:{};

// ---------- Профессии и новые типы ----------
// В типах 271.1 появились «Кинотеатр», «Автокинотеатр», «Дом культуры»: «Кино» из регулярок employers271.js ловило бы
// и кинотеатр, и сценарист шёл бы в кинотеатр. Кинотеатр — не место съёмок: «Кино» теперь только киностудия и
// кинокомпания; осветитель и звукорежиссёр (lightingtech, sound16) могут работать и в кинотеатре — «рядом». Дом
// культуры — рядом для артистов, рабочих сцены, сценографов и музыкантов.
const orgHouse2711='Дом культуры|Дворец культуры';
if(roots2711.ready){
 // Регулярки без учёта регистра: «Театр» ловил и «Кинотеатр», «Фильмтеатр» — тоже отсекаем.
 for(const k of Object.keys(orgProfFit271))orgProfFit271[k]=orgProfFit271[k].map(x=>typeof x==='string'?
  x.replace(/Кино/g,'Кино(?!театр)').replace(/Театр/g,'(?<!Кино|Фильм)Театр'):x);
 for(const k of ['lightingtech','sound16']){const f=orgProfFit271[k];if(f)f[1]=f[1]?f[1]+'|Кинотеатр':'Кинотеатр';}
 for(const k of ['stageactor','stagehand','setdesigner','musician','dancer']){
  const f=orgProfFit271[k];
  if(f)f[1]=f[1]?f[1]+'|'+orgHouse2711:orgHouse2711;
 }
 orgPrefsCache271.clear();
}
// Школьный учитель — главная профессия сферы «образование», но в 271 её вес был таким же, как у детского сада и музейного
// педагога. С новыми типами («Учебный центр», «Музей» в каждой стране) набор сферы из одного учебного центра выходил
// «дешевле» набора со школой — и учитель оказывался в учебном центре. Вес ×2 ставит школу (в том числе «Школа № N») на место.
const orgWeights2711={teacher:4};
if(roots2711.ready)orgPrefs271=function(p){
 const q=roots2711Base.orgPrefs271.apply(this,arguments);
 if(q?.id&&orgWeights2711[q.id])q.weight=orgWeights2711[q.id];
 return q;
};

// Нумерованное учреждение («Школа № 57», «Городская поликлиника № 4») — государственное, самое обычное для школ и
// больниц страны, но по тегам и названиям оно равно частному «Школа», «Клиника», и в наборе города выигрывал жребий
// (11 городов из 180). Полбалла «не по себе» в его пользу (у своего места получается −0,5) ставит его вперёд при равных.
if(roots2711.ready)orgMiss271=function(q,t){
 const m=roots2711Base.orgMiss271.apply(this,arguments);
 return t?.numbered?m-.5:m;
};

// ---------- Данные: привязки поверх разобранных данных 271 ----------
// roots2711Base.orgData271() собирает страны так, как в 271; здесь к корням добавляются tone, typeSet, biz, к
// странам — mix и bizOptions, а нумерованные типы получают имя без номера (label — как в данных).
if(roots2711.ready)orgData271=function(){
 const d=roots2711Base.orgData271.apply(this,arguments);
 if(!d||d.enriched2711!==undefined)return d;
 d.enriched2711=false;
 const raw=typeof org271Data==='object'&&org271Data?org271Data:null;
 if(!raw||!Array.isArray(raw.bizIds)||!Array.isArray(raw.tones))return d;
 const table=(raw.types||[]).map(([type,field,fit,numbered])=>({type:numbered?type.replace(roots2711.numberedSuffix,''):type,
  label:type,field,fit:new Set(fit),numbered:!!numbered}));
 for(const [cc,rc] of Object.entries(raw.countries||{})){
  const c=d.countries[cc];
  if(!c||!Array.isArray(rc.typeNames))continue;
  rc.roots.forEach((row,i)=>{
   const r=c.roots[i];if(!r)return;
   r.tone=raw.tones[row[4]]||'';
   r.typeSet=new Set((row[5]||[]).map(k=>rc.typeNames[k]));
   r.biz=new Set((row[6]||[]).map(k=>raw.bizIds[k]));
  });
  // та же проверка, что в 271: тип, к которому по тегам не подходит ни один корень, в набор не попадает
  const byField={};
  for(const [field,ids] of Object.entries(rc.types||{}))byField[field]=ids.map(i=>table[i]).filter(t=>t&&c.roots.some(r=>rootFits271(r,t.fit)));
  c.types=byField;
  c.mix=rc.mix||{};
  c.bizOptions=new Set((rc.bizOptions||[]).map(k=>raw.bizIds[k]));
 }
 d.enriched2711=true;
 return d;
};

// ---------- Работодатели ----------
function mixOf2711(c,field){return c?.mix?.[field]||roots2711.fallbackMix;}
// Корень для типа: вид по долям meaning/loan/local, «банальность» по доле banal. Если нужного сочетания среди
// привязанных корней нет — сначала отпускается вид, потом банальность. Из неиспользованных в городе корней, если есть.
function pickRoot2711(bound,mix,rand,used){
 let pool=bound.filter(r=>!used.has(r.root));
 if(!pool.length)pool=bound;
 const weights=['meaning','loan','local'].map(k=>[k,Math.max(0,+mix[k]||0)]),sum=weights.reduce((n,[,w])=>n+w,0);
 let x=rand()*(sum||1),kind='local';
 for(const [k,w] of weights){x-=w;if(x<0){kind=k;break;}}
 const wantBanal=rand()<(+mix.banal||0),banal=r=>r.tone==='банальный'===wantBanal;
 const tiers=[pool.filter(r=>r.kind===kind&&banal(r)),pool.filter(banal),pool.filter(r=>r.kind===kind),pool];
 const tier=tiers.find(a=>a.length);
 return tier[Math.floor(rand()*tier.length)];
}
// Номер нумерованного типа: чаще маленькие, редко за сотню; от города и типа, не от жизни.
function numberFor2711(rand){return 1+Math.floor(rand()*rand()*150);}
function assignRoots2711(out,country,city){
 const c=orgCountry271(country);
 if(!c||!c.mix||!out?.all?.length)return;
 const rand=orgRng271(orgHash271('roots2711|'+country+'|'+city)),used=new Set();
 // корни, уже занятые типами без привязки (прежний путь), другим типам города не отдаём
 for(const e of out.all){
  const t=(c.types[e.field]||[]).find(t=>t.type===e.type);
  if(t&&!t.numbered&&!c.roots.some(r=>r.typeSet?.has(e.type)))used.add(e.root);
 }
 for(const e of out.all){
  // «Школа» и «Школа № N» — два типа с одним названием (регулярки employers271.js их не различают): если в наборе
  // города одна запись, половину таких мест занимают государственные, с номером; если две — одна обычная, одна с номером
  const plain=(c.types[e.field]||[]).find(x=>x.type===e.type&&!x.numbered),twin=(c.types[e.field]||[]).find(x=>x.type===e.type&&x.numbered);
  let t=plain||twin;
  if(plain&&twin){
   const same=out.all.filter(x=>x.field===e.field&&x.type===e.type);
   t=same.length>1?(same[0]===e?plain:twin):(rand()<.5?twin:plain);
  }
  if(!t)continue;
  if(t.numbered){
   const n=numberFor2711(rand),name=t.label.replace(roots2711.numberedSuffix,' № '+n);
   e.root='';e.name=name;e.numbered=true;e.bound2711=true;
   continue;
  }
  const bound=c.roots.filter(r=>r.typeSet?.has(e.type));
  if(!bound.length)continue;
  const r=pickRoot2711(bound,mixOf2711(c,e.field),rand,used);
  e.root=r.root;e.name=e.type+' «'+r.root+'»';e.bound2711=true;
  used.add(r.root);
 }
 out.assigned2711=true;
}
if(roots2711.ready)orgRoster271=function(country,city){
 const out=roots2711Base.orgRoster271.apply(this,arguments);
 if(out&&!out.assigned2711)assignRoots2711(out,country,city);
 return out;
};

// ---------- Своё дело ----------
// Вариант дела: «вид:специальность» у студий, услуг и магазинов, BZ-id у видов каталога 253.
function bizId2711(type,specialty){
 if(!specialty)return null;
 return /^BZ\d+$/.test(specialty)?specialty:type+':'+specialty;
}
if(roots2711.ready)businessRoots271=function(country,type,specialty,seed=''){
 const c=orgCountry271(country),id=bizId2711(type,specialty);
 if(c?.bizOptions&&id&&c.bizOptions.has(id)){
  const list=c.roots.filter(r=>r.biz?.has(id));
  if(list.length){
   const out=orgShuffle271(list,orgRng271(orgHash271('business2711|'+country+'|'+id+'|'+seed)));
   if(out.length>=3)return out;
   // корней мало — добираем по тегам вида, как в 271
   const have=new Set(out.map(r=>r.root));
   return [...out,...roots2711Base.businessRoots271.apply(this,arguments).filter(r=>!have.has(r.root))];
  }
 }
 return roots2711Base.businessRoots271.apply(this,arguments);
};
