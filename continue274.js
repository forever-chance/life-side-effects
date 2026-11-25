'use strict';
// Сборка 274: семейное древо.
//
// 1. Братья и сёстры. До 274 при рождении появлялся не больше чем один старший брат или сестра (65%), младшие почти
//    не рождались: союзу родителей нужны были желание детей у обоих от 0,45, свободные деньги и мать до 42 лет, а
//    размер семьи считал игрока и старшего. Теперь размер семьи, в которой вы родились, бросается один раз по стране
//    и году рождения (в Корее, Японии, Китае, Италии, Испании меньше детей, в Египте, Индии, Индонезии больше, в
//    старших поколениях больше); ваше место среди детей — случайное. Старшие (0–4) создаются сразу, младшие
//    рождаются по плану, пока родители вместе, живы и мать в подходящем возрасте. Промежутки обычно 1–8 лет; примерно
//    в одной семье из двадцати — разрыв в 10–20 лет: поздний ребёнок или намного старший брат или сестра от прежних
//    отношений одного из родителей. У родителя с новым партнёром в любом вашем возрасте может родиться брат или сестра
//    по маме или по папе. Близнецы — редко. В старых сохранениях задним числом никто не появляется: план младших
//    составляется с момента обновления, если вы ещё ребёнок.
//
// 2. Продолжить за близкого. После смерти — кнопка на финале: выбор из всех живых, кто связан с умершим по древу
//    (дети, внуки, братья и сёстры и их потомки, родители, тёти и дяди, двоюродные), и из супруга или партнёра. Для
//    каждого — кем приходится умершему, возраст, город и доля наследства (наследство уже распределено по закону и от
//    выбора не зависит). Выбранный человек становится новым персонажем: новая жизнь в «Персонажах», прежняя остаётся
//    завершённой. Его возраст, пол, страна, город, работа, учёба, деньги, доли имущества, машины и питомцы берутся из
//    его записи; все люди получают роли относительно него по древу (умерший — «Дедушка», «Отец», «Дядя»…). Люди без
//    связи по древу — круг умершего: они остаются знакомыми (без свиданий), а работники и клиенты его дела, няни и
//    подопечные уходят. Вдова или вдовец остаётся в доме, где жили вместе, если там есть доля. Несовершеннолетний живёт
//    с родителем, а без родителя — с бабушкой, дедушкой, взрослыми братом или сестрой или в
//    приёмной семье или детском доме, по тем же правилам, что у ребёнка-игрока. Кто на лечении или в заключении — в
//    списке с пометкой; срок заключения продолжается в новой жизни как приговор персонажа (court94), за того, кто
//    отбывает пожизненный срок, продолжить нельзя. Древо показывает боковые линии: тёть и дядь, двоюродных, племянников.
//
// Роли: хранятся те, что уже есть в игре («Мать», «Ребенок», «Тетя», «Внук», «Родственник», «Партнёр близкого»…);
// двоюродные, прадеды, свёкры, мачехи — роль «Родственник» или «Партнёр близкого» с подписью в p.kin274 (на карточке,
// в древе, в разделе «Родство»).
//
// Подключается после business272.js, последним перед bootstrap61.js.

// ---------- 1. Братья и сёстры ----------

// Среднее число детей в семье, где дети есть, для родившихся около 2025 года.
const familyMean274={kr:1.55,jp:1.7,cn:1.65,it:1.7,es:1.7,pl:1.8,de:1.8,ca:1.85,th:1.8,rs:1.85,ru:1.9,nl:1.95,uk:2,no:2,
 us:2.1,au:2.05,fr:2.15,br:2.1,mx:2.45,tr:2.4,za:2.55,ma:2.7,id:2.7,in:2.8,eg:3.2};
function familyLambda274(country,year){
 const m=familyMean274[country]??2,y=Number.isFinite(Number(year))?Number(year):2025;
 const f=Math.max(.85,Math.min(2.1,1+.018*(2025-y)));
 return Math.min(3.6,(m-1)*f);
}
// Размер семьи глазами родившегося ребёнка: в больших семьях больше детей, поэтому вес n·P(n).
// youngest — глазами младшего ребёнка (родители расстались к его рождению): у каждой семьи один младший, вес P(n).
function familySizeRoll274(country,year,youngest=false){
 const l=familyLambda274(country,year),w=[];let p=Math.exp(-l);
 for(let n=1;n<=8;n++){w.push(youngest?p:n*p);p=p*l/n;}
 let r=Math.random()*w.reduce((a,b)=>a+b,0);
 for(let i=0;i<w.length;i++)if((r-=w[i])<0)return i+1;
 return 8;
}
const siblingGaps274=[[1,.10],[2,.25],[3,.22],[4,.15],[5,.11],[6,.08],[7,.05],[8,.04]];
function siblingGap274(){
 if(Math.random()<.02)return 0;// близнецы
 let r=Math.random(),years=8;
 for(const [y,w] of siblingGaps274)if((r-=w)<0){years=y;break;}
 return Math.max(10,years*12+rnd(-5,5));
}
function originalParents274(){
 const mother=s.people.find(p=>p.role==='Мать'),father=s.people.find(p=>p.role==='Отец');
 return {mother,father};
}
function originalUnion274(){
 return s.family27?.unions?.find(u=>typeof originalParents132==='function'?originalParents132(u):u.legacy)||null;
}
function childrenOf274(...ids){return s.people.filter(p=>ids.every(id=>(p.bio27?.parents||[]).includes(id)));}
function siblingState274(){
 if(!s)return null;
 if(s.siblings274)return s.siblings274;
 // Старое сохранение: младшие — только с этого момента и только пока вы ребёнок.
 s.siblings274={version:1,legacy:true,plan:[],born:[]};
 // Взрослому в старом сохранении братья и сёстры не добавляются вовсе, в том числе от новых партнёров родителей.
 if(s.dead||s.age>=18){s.siblings274.adult=true;return s.siblings274;}
 const {mother,father}=originalParents274(),u=originalUnion274();
 if(!mother?.alive||!father?.alive||u?.status!=='together')return s.siblings274;
 const N=familySizeRoll274(s.birthCountry||s.country,s.birthYear??s.year-s.age),order=rnd(1,N);
 const younger=N-order-childrenOf274(mother.id,father.id).filter(p=>p.age<s.age).length;
 const birthTick=s.clock.ticks-s.age*12;
 let offset=0;
 for(let i=0;i<younger;i++){
  offset+=Math.max(10,siblingGap274());
  const tick=birthTick+offset,motherAge=mother.age+(tick-s.clock.ticks)/12;
  if(tick>s.clock.ticks&&motherAge<=44)s.siblings274.plan.push({tick,kind:'full',twins:Math.random()<.02,status:'planned'});
 }
 s.siblings274.target=N;
 return s.siblings274;
}
function personAgeShift274(p,delta){
 if(!p||!delta)return;
 p.age+=delta;
 if(Number.isFinite(p.birthYear))p.birthYear-=delta;
 if(p.bio27&&Number.isFinite(p.bio27.born))p.bio27.born-=delta*12;
}
function shiftParentAge274(parent,delta){
 if(!parent||delta<=0)return;
 personAgeShift274(parent,delta);
 for(const id of parent.bio27?.parents||[])personAgeShift274(s.people.find(p=>p.id===id),delta);
}
function removeStartSibling274(p){
 s.people=s.people.filter(q=>q!==p);
 for(const q of s.people)if(q.bio27?.children)q.bio27.children=q.bio27.children.filter(id=>id!==p.id);
 for(const z of [s.events54?.known,s.generations58?.known,s.visual49?.holders])if(z)delete z[p.id];
}
// Новый брат или сестра: те же шаги, что у ребёнка в союзе (birthKin27), с фамилией по правилам names271.
function makeSibling274(parents,age,gender=pick(['f','m']),opts={}){
 const mother=parents.find(p=>p.gender==='f')||parents[0];
 const country=opts.country||mother.country||s.country;
 const p=person('Сиблинг',age,gender,country);
 p.role=gender==='f'?'Сестра':'Брат';
 p.parentId=mother.id;
 p.adopted49=false;
 p.birth49={method:'birth',parents:parents.map(q=>q.id)};
 p.city18=opts.city||mother.city18||cities[country]?.[0];
 const year=s.year-age;
 const name=()=>{if(typeof childBirthIdentity166==='function')childBirthIdentity166(p,parents);};
 if(typeof withYear271f==='function')withYear271f(year,name);else name();
 p.birthYear=year;
 if(opts.half)p.half274=opts.half;
 s.people.push(p);
 if(typeof familyState27==='function')familyState27();
 if(p.bio27){p.bio27.parents=parents.map(q=>q.id);p.bio27.born=s.clock.ticks-age*12;}
 for(const parent of parents)if(parent.bio27&&!parent.bio27.children.includes(p.id))parent.bio27.children.push(p.id);
 if(s.events54?.known)s.events54.known[p.id]=true;
 if(s.generations58?.known)s.generations58.known[p.id]=true;
 return p;
}
// Старший брат или сестра по маме родились до её брака с вашим отцом: фамилия — та, что была у мамы до этого брака
// (names271 уже дал ей фамилию мужа), а не фамилия вашего отца.
function priorSurname274(p,mother){
 const prior=mother?.marriageName271?.prior;
 if(!p||!prior?.parts?.length||typeof setPersonName256!=='function')return;
 const g=n=>typeof genderSurname256==='function'?genderSurname256(n,p.gender,prior.culture||mother.country):n;
 setPersonName256(p,p.givenName166||String(p.name).split(' ')[0],prior.parts.map(g),prior.joiner||' ');
 p.birthSurname256=p.surname;
 if(prior.culture)p.surnameCulture271=prior.culture;
}
// При рождении: сколько старших, сколько младших по плану, промежутки и возраст родителей.
function siblingsAtStart274(){
 const {mother,father}=originalParents274();
 const startSibs=s.people.filter(p=>['Брат','Сестра'].includes(p.role));
 const z=s.siblings274={version:1,plan:[],born:[],started:s.clock.ticks};
 const year=s.birthYear??(s.year-s.age),country=s.birthCountry||s.country;
 const both=mother&&father&&originalUnion274()?.status==='together';
 // Без родителей в записи — как было: стартовый брат или сестра остаются без изменений.
 if(!mother&&!father)return z;
 // Родители не вместе с вашего рождения (один родитель, childhood131): старшие — общие дети обоих, если второй
 // родитель известен, иначе дети того, с кем вы живёте. Вы — младший ребёнок этой пары: младших по плану нет,
 // брат или сестра по маме или по папе могут появиться у родителя с новым партнёром.
 const N=familySizeRoll274(country,year,!both),order=both?rnd(1,N):N;
 let older=Math.min(4,order-1),younger=both?N-order:0;
 z.target=N;
 // Промежутки между детьми (в месяцах), от вас к старшим и от вас к младшим.
 const olderGaps=Array.from({length:older},siblingGap274).map((g,i)=>i===0?Math.max(10,g):g);
 const youngerGaps=Array.from({length:younger},()=>Math.max(10,siblingGap274()));
 let half=null,late=false;
 if(Math.random()<.05){
  if(older>=1&&(younger===0||Math.random()<.5)){olderGaps[older-1]=rnd(10,20)*12+rnd(0,11);half=!mother?'father':!father?'mother':Math.random()<.6?'father':'mother';}
  else if(both){if(!younger){younger=1;youngerGaps.push(10);}youngerGaps[younger-1]=rnd(10,20)*12+rnd(0,11);late=true;}
 }
 const ages=[];let acc=0;
 for(const g of olderGaps){acc+=g;ages.push(acc);}
 // Возраст родителей при рождении каждого ребёнка: 18–44 у матери, от 18 у отца.
 const atBirth=p=>p?p.age-s.age:0;
 const need=(p,list)=>p&&list.length?Math.max(...list)/12+18+rnd(0,3):0;
 if(mother){
  const mine=()=>ages.filter((a,i)=>!(half==='father'&&i===ages.length-1));
  let want=need(mother,mine());
  while(want>44&&ages.length){ages.pop();older--;half=null;want=need(mother,mine());}
  if(want>atBirth(mother))shiftParentAge274(mother,Math.ceil(want-atBirth(mother)));
 }
 if(father){
  const want=need(father,[...ages.slice(0,older)].filter((a,i)=>!(half==='mother'&&i===older-1)));
  if(want>atBirth(father))shiftParentAge274(father,Math.min(58,Math.ceil(want))-atBirth(father));
 }
 // Старшие: игровой стартовый брат или сестра становится младшим из старших, остальные создаются.
 const pool=[...startSibs];
 ages.slice(0,older).forEach((months,i)=>{
  const isHalf=half&&i===older-1;
  const parents=isHalf?[half==='father'?father:mother].filter(Boolean):[mother,father].filter(Boolean);
  const age=s.age+Math.floor(months/12)+(months%12>=6?1:0);
  let p=!isHalf&&pool.length?pool.shift():null;
  if(p){personAgeShift274(p,age-p.age);}
  else{
   p=makeSibling274(parents,age,pick(['f','m']),{half:isHalf?half:null,city:isHalf&&Math.random()<.4?pick(cities[parents[0].country]||[parents[0].city18]):null});
   if(isHalf&&half==='mother')priorSurname274(p,mother);
  }
  if(isHalf)p.half274=half;
 });
 pool.forEach(removeStartSibling274);
 // Младшие: по плану от вашего рождения. При старте с 18 лет те, кто родился за кадром, появляются сразу.
 const birthTick=s.clock.ticks-s.age*12;let offset=0;
 youngerGaps.forEach((g,i)=>{
  offset+=g;
  const tick=birthTick+offset,motherAge=mother.age+(tick-s.clock.ticks)/12;
  if(motherAge>44+(late&&i===youngerGaps.length-1?1:0))return;
  z.plan.push({tick,kind:late&&i===youngerGaps.length-1?'late':'full',twins:Math.random()<.02,status:'planned'});
 });
 const u=originalUnion274();
 if(u)u.targetChildren142=Math.max(u.targetChildren142||0,N);
 for(const q of z.plan.filter(q=>q.tick<=s.clock.ticks))siblingBirth274(q,true);
 if(s.dossier87?.birth?.siblings&&s.age===0)
  s.dossier87.birth.siblings=s.people.filter(p=>['Брат','Сестра'].includes(p.role)).map(p=>({id:p.id,name:p.name,role:p.role}));
 return z;
}
function childWord274(n){return n%10===1&&n%100!==11?'ребёнок':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'ребёнка':'детей';}
function announceSiblings274(kids,parents,half){
 const names=kids.map(p=>p.name);
 let title;
 if(kids.length===1)title=kids[0].gender==='f'?'У вас родилась сестра — '+names[0]:'У вас родился брат — '+names[0];
 else{
  const g=new Set(kids.map(p=>p.gender));
  title='У вас родились '+(g.size>1?'брат и сестра':g.has('f')?'сёстры':'братья')+' — '+names.join(' и ');
 }
 let text;
 if(half){
  const own=parents.find(p=>['Мать','Отец'].includes(p.role)),other=parents.find(p=>p!==own);
  text=(kids.length>1?'Близнецы. ':'')+(own?.role==='Мать'?'По маме':'По папе')+': второй родитель — '+(other?.name||'новый партнёр')+'.';
 }else{
  const all=childrenOf274(...parents.map(p=>p.id)).length+(parents.every(p=>['Мать','Отец'].includes(p.role))?1:0);
  text=(kids.length>1?'Близнецы. ':'')+'Теперь в семье '+all+' '+childWord274(all)+'. Мама — '+(parents.find(p=>p.role==='Мать')?.name||'')+', папа — '+(parents.find(p=>p.role==='Отец')?.name||'')+'.';
 }
 log(title,text,'Семья',true);
}
function siblingBirth274(q,quiet=false){
 const {mother,father}=originalParents274(),u=originalUnion274(),z=s.siblings274;
 const age=Math.max(0,Math.floor((s.clock.ticks-q.tick)/12));
 if(s.dead||!mother?.alive||!father?.alive||u?.status!=='together'||mother.country!==father.country){q.status='skipped';return [];}
 if(mother.age-age>(q.kind==='late'?45:44)){q.status='skipped';return [];}
 if(q.kind!=='late'&&z?.target&&childrenOf274(mother.id,father.id).length+1>=z.target){q.status='skipped';return [];}
 const kids=[makeSibling274([mother,father],age)];
 if(q.twins)kids.push(makeSibling274([mother,father],age,Math.random()<.7?kids[0].gender:pick(['f','m'])));
 q.status='born';q.ids=kids.map(p=>p.id);
 z.born.push(...q.ids);
 if(!quiet)announceSiblings274(kids,[mother,father],false);
 return kids;
}
// Брат или сестра по маме или по папе: родитель с новым партнёром, в любом вашем возрасте.
function halfSiblingYear274(){
 const z=siblingState274();
 if(!z||s.dead||z.adult)return;
 for(const parent of s.people.filter(p=>p.alive&&['Мать','Отец'].includes(p.role))){
  const u=s.family27?.unions?.find(u=>u.status==='together'&&[u.a,u.b].includes(parent.id)&&!(typeof originalParents132==='function'&&originalParents132(u)));
  if(!u)continue;
  const other=living(u.a===parent.id?u.b:u.a);
  if(!other||['Мать','Отец'].includes(other.role)||other.country!==parent.country||other.gender===parent.gender)continue;
  const woman=[parent,other].find(p=>p.gender==='f');
  if(woman.age<20||woman.age>43||s.clock.ticks-(u.since??s.clock.ticks)>120||childrenOf274(parent.id,other.id).length>=2)continue;
  if(z.halfTick&&s.clock.ticks-z.halfTick<18)continue;
  if(Math.random()>=.1)continue;
  const pair=parent.gender==='f'?[parent,other]:[other,parent];
  const kids=[makeSibling274(pair,0,pick(['f','m']),{half:parent.role==='Мать'?'mother':'father',city:parent.city18})];
  if(Math.random()<.02)kids.push(makeSibling274(pair,0,pick(['f','m']),{half:parent.role==='Мать'?'mother':'father',city:parent.city18}));
  z.halfTick=s.clock.ticks;z.born.push(...kids.map(p=>p.id));
  announceSiblings274(kids,[parent,other],true);
 }
}
function siblingMonth274(){
 if(!s||s.dead)return;
 const z=siblingState274();
 if(!z)return;
 for(const q of z.plan.filter(q=>q.status==='planned'&&q.tick<=s.clock.ticks))siblingBirth274(q);
 if(s.clock.ticks%12===0)halfSiblingYear274();
}

// ---------- 2. Родство между любыми двумя людьми ----------

// Круг умершего, который уходит из списка: его дело, договоры с нянями, подопечные и опекуны (см. transformLife274).
const circleDrop274=new Set(['Сотрудник своего дела','Клиент','Няня','Подопечный','Родитель воспитанника','Воспитатель детского дома','Приёмный опекун']);
// Граф семьи: родители каждого (id → множество id) и пары. 'player' — персонаж этого сохранения.
function kinGraph274(st){
 const people=new Map([['player',st],...(st.people||[]).map(p=>[p.id,p])]);
 const parents=new Map(),has=id=>people.has(id)||String(id).startsWith('virtual:');
 const add=(child,parent)=>{if(!parent||child===parent||!has(parent)||!has(child))return;if(!parents.has(child))parents.set(child,new Set());parents.get(child).add(parent);};
 for(const p of st.people||[])if(['Мать','Отец'].includes(p.role))add('player',p.id);
 if(st.family17?.adoption141?.parentId)add('player',st.family17.adoption141.parentId);
 for(const p of st.people||[]){
  const ids=new Set([...(p.bio27?.parents||[]),...(p.birth49?.parents||[])]);
  if(p.parentId)ids.add(p.parentId);
  if(['Ребенок','Сын','Дочь'].includes(p.role))ids.add('player');
  for(const id of ids)add(p.id,id);
  for(const c of p.bio27?.children||[])if(c!=='player')add(c,p.id);
 }
 // Старые записи без связей: брат или сестра без родителей, бабушка и дедушка без детей.
 const own=[...(parents.get('player')||[])];
 for(const p of st.people||[]){
  if(['Брат','Сестра','Сиблинг'].includes(p.role)&&!parents.get(p.id)?.size){
   if(own.length)own.forEach(id=>add(p.id,id));
   else{add('player','virtual:parent');add(p.id,'virtual:parent');}
  }
 }
 for(const p of st.people||[]){
  if(!['Бабушка','Дедушка'].includes(p.role))continue;
  if([...parents.values()].some(set=>set.has(p.id)))continue;
  const target=own.length===1?own[0]:'virtual:parent';
  if(target==='virtual:parent')add('player','virtual:parent');
  add(target,p.id);
 }
 for(const p of st.people||[])if(['Внук','Внучка','Внук / внучка','Потомок'].includes(p.role)&&!parents.get(p.id)?.size){add('virtual:child','player');add(p.id,'virtual:child');}
 // Пары: союзы родни, брак и отношения персонажа, партнёры NPC.
 const partners=new Map();
 const pair=(a,b,status,married)=>{if(!a||!b||a===b||!people.has(a)||!people.has(b))return;for(const [x,y] of [[a,b],[b,a]]){if(!partners.has(x))partners.set(x,new Map());const old=partners.get(x).get(y);if(!old||old.status!=='current')partners.get(x).set(y,{status,married:!!(married||old?.married)});}};
 // Брак: отмеченный (married270), союз ваших родителей (legacy) и семьи, которые NPC создали сами (generation58), —
 // наследство (spouse58) считает супругами всех, кто в союзе «вместе» или овдовел.
 for(const u of st.family27?.unions||[]){
  const status=u.status==='together'?'current':u.status==='widowed'?'widowed':'former';
  pair(u.a,u.b,status,u.married270||u.legacy||u.generation58||people.get(u.a)?.npcMarried54&&people.get(u.b)?.npcMarried54);
 }
 for(const p of st.people||[]){
  if(p.married||p.role==='Партнер')pair('player',p.id,p.alive===false||st.dead?'widowed':'current',p.married);
  else if(p.divorced||p.role==='Бывший партнер')pair('player',p.id,'former',p.divorced);
  const q=p.agency55?.partner;
  if(q&&people.has(q)&&!partners.get(p.id)?.has(q))pair(p.id,q,'current',p.npcMarried54&&people.get(q)?.npcMarried54);
  // Пара подростка (children55: child55.relationship) — до 18 лет; в 18 её забирает agency55.partner, и дальше
  // child55 не обновляется, поэтому с agency55 считается только он.
  const t=p.child55?.relationship;
  if(!p.agency55&&p.alive!==false&&t?.status==='together'&&people.get(t.person)?.alive!==false&&!partners.get(p.id)?.has(t.person))pair(p.id,t.person,'current',false);
  const w=p.aging58?.lastSpouse58;
  if(w&&people.has(w))pair(p.id,w,'widowed',true);
 }
 return {people,parents,partners};
}
function kinAncestors274(g,id){
 const out=new Map([[id,0]]);let frontier=[id];
 for(let d=1;d<=10&&frontier.length;d++){
  const next=[];
  for(const x of frontier)for(const p of g.parents.get(x)||[])if(!out.has(p)){out.set(p,d);next.push(p);}
  frontier=next;
 }
 return out;
}
function kinBlood274(g,a,b){
 if(a===b)return {u:0,d:0};
 const A=kinAncestors274(g,a),B=kinAncestors274(g,b);
 let best=null;
 for(const [id,u] of A)if(B.has(id)){const d=B.get(id);if(!best||u+d<best.u+best.d||u+d===best.u+best.d&&u<best.u)best={u,d,via:id};}
 if(best&&best.u===1&&best.d===1){
  const pa=g.parents.get(a)||new Set(),pb=g.parents.get(b)||new Set(),shared=[...pa].filter(x=>pb.has(x));
  best.half=shared.length===1&&pa.size>1||shared.length===1&&pb.size>1;
  best.sharedParent=shared[0];
 }
 return best;
}
// Название родства: роль — из тех, что уже хранит игра; подпись — для экрана (с ё).
function kinTitle274(rel,gender,g){
 const f=gender==='f',{u,d}=rel;
 if(u===0&&d===0)return {role:'Вы',label:'Вы'};
 if(d===0){
  if(u===1)return {role:f?'Мать':'Отец',label:f?'Мать':'Отец'};
  if(u===2)return {role:f?'Бабушка':'Дедушка',label:f?'Бабушка':'Дедушка'};
  return {role:'Родственник',label:'Пра'+'пра'.repeat(u-3)+(f?'бабушка':'дедушка')};
 }
 if(u===0){
  if(d===1)return {role:'Ребенок',label:f?'Дочь':'Сын'};
  if(d===2)return {role:f?'Внучка':'Внук',label:f?'Внучка':'Внук'};
  return {role:'Потомок',label:'Пра'+'пра'.repeat(d-3)+(f?'внучка':'внук')};
 }
 if(u===1&&d===1){
  if(!rel.half)return {role:f?'Сестра':'Брат',label:f?'Сестра':'Брат'};
  const via=g?.people.get(rel.sharedParent);
  return {role:f?'Сестра':'Брат',label:(f?'Сестра':'Брат')+(via?.gender==='f'?' по маме':via?.gender==='m'?' по папе':'')};
 }
 if(u===1&&d===2)return {role:f?'Племянница':'Племянник',label:f?'Племянница':'Племянник'};
 if(u===1)return {role:'Родственник',label:f?'Внучатая племянница':'Внучатый племянник'};
 if(u===2&&d===1)return {role:f?'Тетя':'Дядя',label:f?'Тётя':'Дядя'};
 if(u===2&&d===2)return {role:'Родственник',label:f?'Двоюродная сестра':'Двоюродный брат'};
 if(u===2&&d===3)return {role:'Родственник',label:f?'Двоюродная племянница':'Двоюродный племянник'};
 if(u===3&&d===1)return {role:'Родственник',label:f?'Двоюродная бабушка':'Двоюродный дедушка'};
 if(u===3&&d===2)return {role:'Родственник',label:f?'Двоюродная тётя':'Двоюродный дядя'};
 if(u===3&&d===3)return {role:'Родственник',label:f?'Троюродная сестра':'Троюродный брат'};
 return {role:'Родственник',label:f?'Дальняя родственница':'Дальний родственник'};
}
function kinPartnerLabel274(x,y,yTitle,link){
 const f=x.gender==='f',current=link.status!=='former';
 if(current&&yTitle.role==='Мать'||current&&yTitle.role==='Отец')return f?'Мачеха':'Отчим';
 if(current&&link.married&&['Ребенок','Брат','Сестра','Внук','Внучка'].includes(yTitle.role))return f?'Невестка':'Зять';
 const prefix=link.status==='former'?(link.married?(f?'Бывшая жена':'Бывший муж'):(f?'Бывшая партнёрша':'Бывший партнёр')):link.married?(f?'Жена':'Муж'):(f?'Партнёрша':'Партнёр');
 return prefix+' '+roleGenitive268({role:yTitle.role,gender:y.gender});
}
// Кем x приходится root по древу. kind: blood — кровное родство, partner — пара root, inlaw — пара кровного
// родственника, spouseKin — родня пары root. null — связи по древу нет.
function kinRelation274(g,root,x){
 if(x===root)return {kind:'self',role:'Вы',label:'Вы'};
 const X=g.people.get(x);if(!X)return null;
 const blood=kinBlood274(g,root,x);
 if(blood)return {kind:'blood',...blood,...kinTitle274(blood,X.gender,g)};
 const mine=g.partners.get(root)?.get(x);
 if(mine)return {kind:'partner',status:mine.status,married:mine.married,role:mine.status==='former'?'Бывший партнер':'Партнер',
  label:mine.status==='former'?(mine.married?(X.gender==='f'?'Бывшая жена':'Бывший муж'):(X.gender==='f'?'Бывшая партнёрша':'Бывший партнёр')):mine.married?(X.gender==='f'?'Жена':'Муж'):(X.gender==='f'?'Партнёрша':'Партнёр')};
 let best=null;
 for(const [y,link] of g.partners.get(x)||[]){
  const rel=kinBlood274(g,root,y);
  if(!rel)continue;
  if(!best||rel.u+rel.d<best.rel.u+best.rel.d||link.status==='current'&&best.link.status!=='current')best={y,rel,link};
 }
 if(best){
  const Y=g.people.get(best.y),title=kinTitle274(best.rel,Y.gender,g);
  return {kind:'inlaw',role:'Партнёр близкого',label:kinPartnerLabel274(X,Y,title,best.link),via:best.y};
 }
 for(const [p,link] of g.partners.get(root)||[]){
  if(link.status==='former')continue;
  const rel=kinBlood274(g,p,x);
  if(!rel)continue;
  const P=g.people.get(p),R=g.people.get(root),f=X.gender==='f';
  const label=rel.u===1&&rel.d===0?(R?.gender==='f'?(f?'Свекровь':'Свёкор'):(f?'Тёща':'Тесть')):
   rel.u===0&&rel.d===1?(f?'Падчерица':'Пасынок'):'Родня '+(P?.gender==='f'?'жены':'мужа');
  return {kind:'spouseKin',role:'Родственник',label,via:p};
 }
 return null;
}
function kinCloseness274(rel){
 if(!rel)return 30;
 if(rel.kind==='partner')return rel.status==='former'?30:80;
 if(rel.kind==='blood'){const n=rel.u+rel.d;return n<=1?76:n===2?62:n===3?48:38;}
 if(rel.kind==='inlaw')return 45;
 return 40;
}

// ---------- 3. Кого можно выбрать ----------

let continuing274=false;
// Дело о наследстве умершего. settle — только по нажатию (окно выбора, переход): финал рисуется прямо из nextYear,
// и оформление наследства во время отрисовки опередило бы «Итоги прожитого года» (остаток стал бы 0). Обычно к
// этому моменту наследство уже оформлено (estates58: rollYear, mortalityMonth54).
function continueEstate274(settle=false){
 if(typeof estates58!=='function')return null;
 const z=estates58();
 if(settle&&s.dead&&!z.finalized&&typeof finalizePlayerEstate58==='function'){try{finalizePlayerEstate58();}catch(e){console.error(e);}}
 return z.cases.find(q=>q.person==='player')||null;
}
function inheritanceNote274(q,id){
 const h=q?.heirs?.find(h=>h.person===id);
 if(!h)return 'Наследство: не входит в круг наследников';
 const paid=q.payments?.find(p=>p.person===id),cash=paid?.cash||0;
 const assets=(q.claims||[]).filter(c=>(typeof estateAsset58==='function'?estateAsset58(c.asset):null)?.owners?.[id]>0).length;
 return 'Наследство: '+Math.round(h.share*100)+'%'+(cash>0?', '+money(localAmount16(cash,q.country)):'')+(assets?' и доли имущества':'');
}
function careNote274(p){
 const reason=typeof careInterruption145==='function'?careInterruption145(p):null;
 if(reason==='custody')return p.custody145?.life?'Отбывает пожизненный срок':'Сейчас в заключении, ещё '+Math.max(1,(p.custody145?.ends||s.clock.ticks)-s.clock.ticks)+' мес.';
 if(reason==='illness')return 'Сейчас на лечении';
 return '';
}
// Работа человека: запись о работе (bio27, agency55), а без неё — профессия из каталога, которую показывает карточка
// («Занятие»), если человек не учится. Не профессия («Пенсия», «Поиск работы», «Сотрудник · …») — работы нет.
const noJobOccupation274=/пенсия|поиск работы|учится|бывш|·/i;
function personStudy274(p){return p?.bio27?.study||(p?.agency55?.plan?.kind==='study'&&p.agency55.plan.program?p.agency55.plan:null);}
function occupationJob274(p){
 const title=String(p?.occupation||'').trim();
 if(!title||!(p.age>=18)||noJobOccupation274.test(title)||typeof professions16==='undefined')return null;
 const prof=professions16.find(q=>q.title===title);
 if(!prof)return null;
 return {profession:prof.id,title:prof.title,incomeRatio:prof.salary||.8,months:Math.max(0,Math.min(p.professionalYears||0,(p.age||18)-18))*12,occupation274:true};
}
function personJob274(p){return p?.bio27?.job||p?.agency55?.job||(!personStudy274(p)&&occupationJob274(p))||null;}
function workNote274(p){
 if(!p||p.age<18||p.age>=67||/пенсия/i.test(p.occupation||'')||personJob274(p)||personStudy274(p))return '';
 if(typeof custodyActive145==='function'&&custodyActive145(p))return '';
 return 'Без работы';
}
let continueCache274=null;
function continueCandidates274(){
 if(!s?.dead)return [];
 const key=[s.saveId,s.people.length,s.people.filter(p=>p.alive).length,s.log.length,s.estates58?.finalized].join('|');
 if(continueCache274?.life===s&&continueCache274.key===key)return continueCache274.list;
 const list=continueCandidatesFresh274();
 continueCache274={life:s,key,list};
 return list;
}
function continueCandidatesFresh274(){
 const g=kinGraph274(s),q=continueEstate274(),out=[];
 for(const p of s.people){
  if(!p.alive)continue;
  const rel=kinRelation274(g,'player',p.id);
  if(!rel||!(rel.kind==='blood'||rel.kind==='partner'&&rel.status!=='former'))continue;
  const care=careNote274(p);
  // Конечный срок продолжается и в новой жизни (custodyCase274); за того, кто отбывает пожизненный срок, продолжить нельзя.
  const custody=typeof custodyActive145==='function'&&custodyActive145(p)&&p.custody145?.life;
  const city=[p.city18||cities[p.country]?.[0],countries[p.country]?.name].filter(Boolean).join(', ');
  const minor=p.age<18?minorHome274(s,g,p):null;
  out.push({id:p.id,p,rel,label:rel.label,age:p.age,city,inheritance:inheritanceNote274(q,p.id),care,minor,work:workNote274(p),
   disabled:custody?'Пожизненный срок: продолжить за этого человека нельзя':'',
   order:rel.kind==='partner'?1.5:rel.u+rel.d+(rel.d===0?.4:0)});
 }
 return out.sort((a,b)=>a.order-b.order||b.age-a.age);
}
// С кем будет жить несовершеннолетний — по правилам ребёнка-игрока (transferCare137): родитель, который может заботиться
// (как availableCareAdult144: взрослый, в той же стране, без переезда, не в заключении и не на лечении), иначе бабушка,
// дедушка, взрослые брат или сестра (близость к ним после перехода от 54, порог 40 выполнен), иначе приёмная семья или
// детский дом (residentialPlacement143 по стране).
function careAdult274(q,country){
 return !!q&&q.alive!==false&&q.age>=18&&q.country===country&&!q.npcMove&&!(typeof careInterruption145==='function'&&careInterruption145(q));
}
function minorHome274(st,g,p){
 const parents=[...(g.parents.get(p.id)||[])].map(id=>id==='player'?null:g.people.get(id)).filter(q=>careAdult274(q,p.country));
 const parent=parents.find(q=>(q.city18||'')===(p.city18||''))||parents[0];
 if(parent)return {id:parent.id,kind:'parent',text:'Живёт у '+roleGenitive268({role:parent.gender==='f'?'Мать':'Отец',gender:parent.gender})+' — '+parent.name};
 const adults=(st.people||[]).filter(q=>q.id!==p.id&&careAdult274(q,p.country))
  .map(q=>({q,rel:kinBlood274(g,p.id,q.id)}))
  .filter(x=>x.rel&&(x.rel.u===2&&x.rel.d===0||x.rel.u===1&&x.rel.d===1)&&kinCloseness274({kind:'blood',...x.rel})-8>=40)
  .sort((a,b)=>((a.q.city18||'')===(p.city18||'')?0:1)-((b.q.city18||'')===(p.city18||'')?0:1)||(b.q.bond??0)-(a.q.bond??0));
 const r=adults[0];
 if(r){const t=kinTitle274(r.rel,r.q.gender,g);return {id:r.q.id,kind:'relative',text:'Будет жить у '+roleGenitive268({role:t.role,gender:r.q.gender})+' — '+r.q.name};}
 return {id:null,kind:'foster',text:'Взрослых родных, которые могут взять опеку, нет: ребёнка примут приёмная семья или детский дом'};
}

// ---------- 4. Переход к новому персонажу ----------

function remapIds274(value,map){
 if(Array.isArray(value))return value.map(v=>remapIds274(v,map));
 if(value&&typeof value==='object'){
  const out={};
  for(const [k,v] of Object.entries(value))out[Object.prototype.hasOwnProperty.call(map,k)?map[k]:k]=remapIds274(v,map);
  return out;
 }
 return typeof value==='string'&&Object.prototype.hasOwnProperty.call(map,value)?map[value]:value;
}
function playerFullName274(st){
 const parts=st.surnameParts256?.length?st.surnameParts256:(st.surname?[st.surname]:[]);
 try{if(parts.length&&typeof fullName256==='function')return fullName256(st.name,parts,st.birthCountry||st.country,st.surnameJoiner256||' ');}catch(e){}
 return [st.name,st.surname].filter(Boolean).join(' ');
}
// Запись умершего персонажа среди людей новой жизни.
function deceasedRecord274(O,id){
 const g=kinGraph274(O);
 const parents=[...(g.parents.get('player')||[])].filter(x=>!String(x).startsWith('virtual:'));
 const children=O.people.filter(p=>g.parents.get(p.id)?.has('player')).map(p=>p.id);
 return {id,name:playerFullName274(O),givenName166:O.name,surname:O.surname,surnameParts256:O.surnameParts256?[...O.surnameParts256]:undefined,
  surnameJoiner256:O.surnameJoiner256,birthSurname256:O.birthSurname256,gender:O.gender,age:O.age,role:'Родственник',
  trait:pick(traits),bond:70,alive:false,orientation:O.orientation,country:O.country,birthCountry:O.birthCountry||O.country,
  birthYear:O.birthYear??(O.year-O.age),birthCity:O.birthCity,origins:[...(O.origins||[])],citizenships:[...(O.citizenships||[])],
  city18:O.housing?.city||countries[O.country]?.city,memories:[],lastVisit:O.year,occupation:O.job?.title?String(O.job.title).split(' · ')[0]:'Пенсия',
  portrait33:O.portrait33,appearance49:O.appearance49,character43:O.character43,inner:{trust:70,affection:70,desire:0,strain:5},
  died274:{year:O.year,age:O.age,saveId:O.saveId,ending:O.ending||''},
  bio27:{parents,children,history:[],education:[],study:null,job:null,skill:O.skill??40,ambition:.5,educationWish:.5,childrenWish:0,
   last:O.clock?.ticks??0,born:(O.clock?.ticks??0)-O.age*12,health:0}};
}
// Достаток семьи (s.background): деньги и запись «Совершеннолетие» в 18 лет, помощь с учёбой. Взрослый — по своим
// деньгам. Несовершеннолетний — по деньгам того, у кого будет жить (minorHome274): его собственные деньги — это в
// основном наследство, а не достаток семьи. Без родителей — не выше среднего: при 'high' в 18 лет игра пишет
// «Родители готовы оплачивать университет».
function pickBackground274(R,minor=null,O=null){
 const cost=countries[R.country]?.cost||1,level=(cash,hi,lo)=>cash>hi*cost?'high':cash<lo*cost?'low':'mid';
 if(!(R.age<18))return level(R.privateCash||0,3,.2);
 const carer=minor?.id?(O?.people||[]).find(p=>p.id===minor.id):null,cash=Number(carer?.privateCash);
 if(minor?.kind==='parent'&&carer)return Number.isFinite(cash)?level(cash,2,.25):['low','mid','high'].includes(O?.background)?O.background:'mid';
 const capped=x=>x==='high'?'mid':x;
 if(carer)return capped(Number.isFinite(cash)?level(cash,2,.25):O?.background||'mid');
 return capped(level(R.privateCash||0,3,.2));
}
// Новая жизнь создаётся обычным рождением (все модули получают свои начальные записи), а потом в неё переносятся
// мир прежней жизни (люди, союзы, имущество семьи, машины, портреты) и данные выбранного человека.
function continueAs274(id){
 if(!s?.dead||continuing274)return false;
 continueEstate274(true);
 const cand=continueCandidates274().find(c=>c.id===id);
 if(!cand||cand.disabled)return false;
 const old=s;
 if(typeof flushSave264==='function'){save();flushSave264();}
 const O=JSON.parse(JSON.stringify(old)),R=O.people.find(p=>p.id===id);
 if(!R)return false;
 continuing274=true;
 try{
  if($('#modal').open)closeModal();
  intro();
  const set=(k,v)=>{const e=document.getElementById(k);if(e&&v!=null){e.value=v;}};
  set('country',R.country);set('gender',R.gender);set('startAge',R.age>=18?'18':'0');
  set('name',(R.givenName166||String(R.name).split(' ')[0]).slice(0,35));
  set('orientation',['hetero','gay','bi','ace'].includes(R.orientation)?R.orientation:'hetero');
  set('background',pickBackground274(R,cand.minor,O));
  start();
 }finally{continuing274=false;}
 if(s===old||!s)return false;
 try{
  if(typeof startupNotice180==='function'&&startupNotice180())finishStartup180(false);
  if(typeof tutorialActive180==='function'&&tutorialActive180())endTutorial180('skipped');
 }catch(e){console.error(e);}
 if($('#modal').open)closeModal();
 const deceasedId='life274-'+(O.saveId||Date.now().toString(36));
 const F=s;
 // Не вышло: заготовка новой жизни удаляется, остаётся прежняя завершённая жизнь без ссылки на продолжение.
 const undo=message=>{
  if(typeof flushSave264==='function')flushSave264();
  dropLife274(F.saveId,old.saveId);
  delete old.continued274;
  s=old;save();if(typeof flushSave264==='function')flushSave264();
  render();toast(message);
  return false;
 };
 try{transformLife274(F,O,R,deceasedId,cand.minor);}
 catch(e){console.error(e);return undo('Продолжить за этого человека не получилось. Прежняя жизнь сохранена.');}
 // Сначала записывается новая жизнь, и запись проверяется: в заполненном хранилище save() только показывает
 // подсказку, и без проверки прежняя жизнь ссылалась бы на продолжение, которого нет среди сохранений.
 packFirstWrite274(F);
 if(typeof treeLife90!=='undefined')treeLife90=null;
 tab='story';
 save();if(typeof flushSave264==='function')flushSave264();
 if(!lifeStored274(F,deceasedId))
  return undo('Новой жизни не хватило места в браузере. Прежняя жизнь сохранена. Скачайте копию в «Персонажах» и удалите ненужные жизни, тогда можно будет продолжить.');
 // Прежняя жизнь помнит, за кого продолжили: saveId и постоянный ключ (lineage = id умершего в новой жизни), который
 // переживает экспорт и восстановление из файла (importLives выдаёт жизням новые saveId).
 old.continued274={saveId:F.saveId,lineage:deceasedId,name:playerFullName274(F),label:cand.label,year:F.year};
 s=old;save();if(typeof flushSave264==='function')flushSave264();
 s=F;save();if(typeof flushSave264==='function')flushSave264();
 render();
 return true;
}
// Новая жизнь действительно лежит в хранилище (основная запись, не резервная копия заготовки) и есть в списке жизней.
function lifeStored274(F,deceasedId){
 try{
  if(typeof LIFE_PREFIX==='undefined'||typeof parseLife!=='function')return true;
  const life=parseLife(localStorage.getItem(LIFE_PREFIX+F.saveId));
  return !!life&&life.saveId===F.saveId&&life.continuedFrom274?.id===deceasedId&&(typeof vaultIndex!=='function'||vaultIndex().ids.includes(F.saveId));
 }catch(e){console.error(e);return false;}
}
function dropLife274(id,activeId){
 if(!id)return;
 try{
  if(typeof LIFE_PREFIX!=='undefined')for(const key of [LIFE_PREFIX+id,LIFE_PREFIX+id+'-backup','life-plain275-'+id])localStorage.removeItem(key);
  if(typeof forgetWrite275==='function')forgetWrite275(id);
  if(typeof vaultIndex==='function'&&typeof ARCHIVE!=='undefined'){const index=vaultIndex();index.ids=index.ids.filter(x=>x!==id);index.active=activeId;localStorage.setItem(ARCHIVE,JSON.stringify(index));}
 }catch(e){console.error(e);}
}
// Новая жизнь несёт весь мир прежней (люди, имущество семьи) и на большом сохранении упирается в лимит хранилища:
// резервная копия тогда молча не пишется. Первая запись сразу сжата (packLife), дальше writeLife сжимает сам, раз
// прежняя копия сжата, и резервная копия помещается.
function packFirstWrite274(F){
 try{
  if(typeof packLife!=='function'||typeof LIFE_PREFIX==='undefined'||typeof validLife!=='function'||!F?.saveId||!validLife(F))return false;
  const key=LIFE_PREFIX+F.saveId,raw=packLife(JSON.stringify({...F,savedAt:new Date().toISOString()}));
  if(!raw.startsWith(PACKED_LIFE))return false;
  localStorage.removeItem(key+'-backup');
  localStorage.setItem(key,raw);
  loadedSave={id:F.saveId,raw};
  return true;
 }catch(e){console.error(e);return false;}
}
function transformLife274(F,O,R,deceasedId,pref=null){
 const map={player:deceasedId,[R.id]:'player'};
 const g=kinGraph274(O);
 const ticks=O.clock?.ticks??0;
 // Роли относительно нового персонажа.
 const rels=new Map();
 for(const p of O.people)if(p.id!==R.id)rels.set(p.id,kinRelation274(g,R.id,p.id));
 rels.set('player',kinRelation274(g,R.id,'player'));
 const D=deceasedRecord274(O,deceasedId);
 let people=[...O.people.filter(p=>p.id!==R.id).map(p=>remapIds274(p,map)),remapIds274(D,map)];
 const byNew=id=>id===deceasedId?'player':id;
 const dropped=new Set();
 // Умершие, чьё наследство ещё оформляется (estates58: дело не закрыто), остаются в списке: дело читает их запись
 // каждый месяц (prepareEstate58 → settleEstateDebts58), без неё — ошибка.
 const openEstate=new Set((O.estates58?.cases||[]).filter(q=>q.status!=='settled').map(q=>q.person));
 for(const p of people){
  const rel=rels.get(byNew(p.id));
  const oldRole=p.role;
  delete p.married;delete p.divorced;p.cohabit=false;delete p.kin274;
  if(rel){
   p.role=rel.role;
   if(rel.label&&rel.label!==rel.role)p.kin274=rel.label;
   if(rel.kind==='partner'){
    if(rel.status==='current'||rel.status==='widowed'){p.married=!!rel.married;p.cohabit=rel.status==='current'&&(p.city18||'')===(R.city18||'');}
    if(rel.status==='former'&&rel.married)p.divorced=true;
    if(p.agency55){p.agency55.partner=null;}
    p.npcMarried54=false;
    // Подростковая пара (одному из вас нет 18): как после «Предложить встречаться» (romance54) — встречаетесь, живёте
    // порознь; совершеннолетие отношения не прекращает.
    if(rel.status==='current'&&!rel.married&&Math.min(R.age,p.age)<18){
     p.cohabit=false;p.teenPair54??={started:R.child55?.relationship?.person===p.id&&Number.isFinite(R.child55.relationship.since)?R.child55.relationship.since:ticks,ages:[R.age,p.age]};
     p.partnerSince??=O.year;delete p.childPartner55;
    }
   }
   // Пометка «знакомы через умершего» — по родству с новым персонажем; с прошлого продолжения она не переносится
   // (дедушка или муж с этой пометкой при смерти снимал бы 2 настроения, а не 12).
   if(rel.kind==='inlaw'||rel.kind==='spouseKin'||rel.kind==='blood'&&rel.u+rel.d>=4)p.inherited274=true;else delete p.inherited274;
   const close=kinCloseness274(rel);
   p.bond=Math.round(Math.max(10,Math.min(95,close+rnd(-8,8))));
   p.inner={trust:Math.max(10,Math.min(95,close+rnd(-10,6))),affection:Math.max(10,Math.min(95,close+rnd(-6,8))),desire:rel.kind==='partner'&&rel.status==='current'?55:0,strain:rnd(2,12)};
  }else{
   // Без связи по древу — круг умершего: друзья, знакомые, клубы, коллеги. Для нового персонажа это знакомые
   // (роль «Знакомый», близость не выше 30, свидания от них не приходят, см. compatible ниже). Работники и клиенты
   // его дела, няни и подопечные по его договорам уходят из списка: дела и договоров у нового персонажа нет.
   // Друг выбранного ребёнка остаётся его другом, друг вашего ребёнка (для вдовы или вдовца) — другом ребёнка.
   const friendOf=p.childFriend55||p.childFriend54;
   if(oldRole==='Друг ребёнка'&&friendOf==='player'){p.role='Друг';}
   else if(oldRole==='Друг ребёнка'&&rels.get(byNew(friendOf))?.role==='Ребенок'){}
   else if((oldRole==='Друг ребёнка'||circleDrop274.has(oldRole))&&!openEstate.has(p.id)){dropped.add(p.id);continue;}
   else{
    p.inherited274=true;
    p.role=p.id===deceasedId?'Родственник':'Знакомый';
    p.bond=Math.min(p.bond??30,30);
    p.inner={trust:Math.min(p.inner?.trust??30,30),affection:Math.min(p.inner?.affection??30,30),desire:0,strain:Math.min(p.inner?.strain??5,10)};
   }
  }
  // Общие воспоминания были с умершим («вы помогли…»): остаются только записи о собственной жизни человека.
  p.memories=p.id===deceasedId?[]:(p.memories||[]).filter(m=>!/(^|[^А-Яа-яЁё])(вы|вас|вам|вами|ваш[а-яё]*)(?![А-Яа-яЁё])/i.test(m)).slice(-4);
  p.lastVisit=O.year;p.lastBond=p.bond;
  if(p.aging58?.care&&['self','servicePlayer'].includes(p.aging58.care.mode))p.aging58.care=null;
  delete p.cohabit274;
 }
 people=people.filter(p=>!dropped.has(p.id));
 // Союзы: пары с новым персонажем живут в его записи (партнёр, брак), а не в списке союзов родни.
 const unions=remapIds274(O.family27?.unions||[],map).filter(u=>u.a!=='player'&&u.b!=='player');
 for(const p of O.people){
  if(!(p.married||p.divorced||['Партнер','Бывший партнер'].includes(p.role)))continue;
  const pid=p.id===R.id?null:p.id;
  if(!pid)continue;
  const status=p.divorced||p.role==='Бывший партнер'?'divorced':'widowed';
  if(!unions.some(u=>[u.a,u.b].includes(deceasedId)&&[u.a,u.b].includes(pid)))
   unions.push({id:'union274-'+pid,a:deceasedId,b:pid,status,since:ticks-12*Math.max(0,O.year-(p.metYear||O.year)),...(p.married||p.divorced?{married270:ticks}:{})});
 }
 const parentsOfR=[...(g.parents.get(R.id)||[])].map(id=>map[id]??id);
 for(const u of unions){
  const legacy=!!(parentsOfR.length===2&&parentsOfR.includes(u.a)&&parentsOfR.includes(u.b));
  // Брак родителей прежнего персонажа держался на пометке legacy; она переходит к родителям нового, а брак остаётся
  // браком и в следующих продолжениях.
  if(u.legacy&&!legacy&&!u.married270)u.married270=(u.since??ticks)||1;
  u.legacy=legacy;
  if(u.status==='together'&&(!people.find(p=>p.id===u.a)?.alive||!people.find(p=>p.id===u.b)?.alive))u.status='widowed';
 }
 // Если новый персонаж — вдова или вдовец умершего: запись умершего — «Партнер».
 const Dnew=people.find(p=>p.id===deceasedId);
 if(Dnew&&rels.get('player')?.kind==='partner'){Dnew.married=!!rels.get('player').married;}
 // Основные данные персонажа — из его записи.
 F.people=people;
 F.name=R.givenName166||String(R.name).split(' ')[0];
 F.surname=R.surname||'';
 if(R.surnameParts256)F.surnameParts256=[...R.surnameParts256];else delete F.surnameParts256;
 F.surnameJoiner256=R.surnameJoiner256||' ';
 F.birthSurname256=R.birthSurname256||R.surname||'';
 for(const k of ['surnameCulture271','nameStyle271','naming256','nameChosen256'])if(R[k]!==undefined)F[k]=R[k];
 F.gender=R.gender;F.orientation=['hetero','gay','bi','ace'].includes(R.orientation)?R.orientation:F.orientation;
 F.country=R.country;F.birthCountry=R.birthCountry||R.country;
 F.birthCity=R.birthCity||R.city18||cities[F.country]?.[0];
 F.citizenships=[...(R.citizenships?.length?R.citizenships:[F.birthCountry])];
 F.origins=[...(R.origins||F.origins||[])];
 F.nationality=F.origins.join(' / ');
 F.identity17={...(R.identity17||{}),birthCountry:F.birthCountry,source:'Сведения семьи',familyMode:F.birthCountry===F.country?'local':'settled'};
 F.age=R.age;F.year=O.year;F.birthYear=O.year-R.age;
 F.birthMonth=Number.isInteger(R.birthMonth274)?R.birthMonth274:rnd(0,11);
 F.clock.ticks=ticks;F.clock.month=O.clock?.month??F.clock.month;
 F.clock.running=false;F.clock.resumeAfterChoice=false;F.clock.choiceActive=false;F.clock.tasks=[];F.clock.yearDue=false;
 F.lastAnnual=O.year;
 F.cash=Math.max(0,R.privateCash||0);
 F.health=Math.max(30,Math.min(100,R.bio27?.health??85));
 if(R.parentHealth143?.careUnavailableUntil>ticks)F.health=Math.min(F.health,50);
 F.mood=55;
 F.skill=Math.round(Math.max(10,Math.min(90,R.bio27?.skill??R.agency55?.skill??35)));
 for(const k of ['portrait33','appearance49','character43'])if(R[k])F[k]=JSON.parse(JSON.stringify(R[k]));
 F.visual49=remapIds274(O.visual49||F.visual49||{},map);
 for(const id of dropped)if(F.visual49?.holders)delete F.visual49.holders[id];
 if(F.visual49?.holders&&R.portrait33?.id)F.visual49.holders.player=R.portrait33.id;
 F.history=[];F.pending=[];F.dead=false;delete F.ending;delete F.continued274;
 F.continuedFrom274={saveId:O.saveId,name:D.name,id:deceasedId,label:rels.get('player')?.label||'Родственник',year:O.year,age:O.age};
 // Семья, союзы, наследство, машины и питомцы семьи.
 F.family27={...remapIds274(O.family27||{version:1},map),unions,linked:true,last:ticks};
 F.grandparentLines147=true;
 if(F.family17){for(const k of ['childhood131','separation132','care136','temporaryCare144','careHistory139','adoption141'])delete F.family17[k];F.family17.household=null;F.family17.lastMonth=ticks;}
 F.estates58={...remapIds274(O.estates58||{},map),will:null,finalized:false,last:ticks-1};
 F.estates58.assets??=[];F.estates58.pets??=[];F.estates58.cases??=[];F.estates58.petOffers??=[];F.estates58.purchases??={};
 for(const a of F.estates58.assets)a.inPlayer=false;
 const t=F.transport56||{};
 t.vehicles=remapIds274(O.transport56?.vehicles||[],map).filter(v=>v.owner!==deceasedId);
 t.selected=t.vehicles.some(v=>v.owner==='player'&&v.status==='owned')?t.vehicles.find(v=>v.owner==='player'&&v.status==='owned').id:'public';
 t.country=F.country;t.lastAge=F.age;
 F.transport56=t;
 F.pets=[];
 for(const r of F.estates58.pets.filter(r=>r.owner==='player'&&r.status==='owned'&&r.pet?.alive)){
  r.status='withPlayer';delete r.pet.household183;r.pet.notes=[...(r.pet.notes||[]),'Живёт с вами с самого начала этой истории.'];F.pets.push(r.pet);
 }
 F.events54={...(F.events54||{}),known:Object.fromEntries(people.map(p=>[p.id,!!p.alive])),invitations:[],hosts:{}};
 F.generations58={...(F.generations58||{}),known:Object.fromEntries(people.map(p=>[p.id,!!p.alive])),requests:[],retry:{},last:ticks-1};
 delete F.siblings274;
 // Документы и языки.
 const x=F.path16;
 if(x){
  x.permits=[...new Set(F.citizenships)].map(country=>({country,basis:'Гражданство',work:true,study:true,expires:null}));
  if(!F.citizenships.includes(F.country))x.permits.push({country:F.country,basis:'Вид на жительство',work:true,study:true,expires:null});
  const native=country16?.[F.birthCountry]?.[0];
  x.languages={};x.native=native?[native]:[];
  if(native)x.languages[native]=6;
  const local=country16?.[F.country]?.[0];
  if(local&&!x.languages[local])x.languages[local]=Math.min(5.5,2+F.age/6);
  for(const [lang,level] of Object.entries(R.languages54||{}))x.languages[lang]=Math.max(x.languages[lang]||0,Math.min(6,level));
  const edu=R.bio27?.education?.length?R.bio27.education:R.agency55?.education||[];
  x.diplomas=edu.filter(d=>d?.field&&d?.level).map((d,i)=>{const pr=typeof prog16==='function'?prog16(d.program):null;const u=pr&&typeof uni16==='function'?uni16(pr):null;
   return {id:'diploma274-'+i,field:d.field,level:d.level,subject26:null,track45:null,program46:d.program||null,
    title:(levels16?.[d.level]||d.level)+' · '+(fields16?.[d.field]?.name||d.field),university:u?.name||'',country:pr?.country||F.country,year:d.year||O.year,grade:75,quality:60,employment:55};});
  const st=R.bio27?.study||(R.agency55?.plan?.kind==='study'&&R.agency55.plan.program?{program:R.agency55.plan.program,progress:Math.round(R.agency55.plan.progress||0)}:null);
  if(st?.program)x.transfer={program:st.program,progress:Math.round(st.progress||0)};
  x.jobApplications=[];x.applications=[];x.study=null;
 }
 F.study=null;F.job=null;F.qualifications=[];
 // Дом: несовершеннолетний — с родителем, близким взрослым или в приёмной семье; взрослый — своё жильё или аренда.
 const city=R.city18&&cities[F.country]?.includes(R.city18)?R.city18:cities[F.country]?.[0];
 F.housing={country:F.country,city,area:'suburb',mode:F.age<18?'parents':'rent',active:true,occupant:null,propertyId:null,deposit:0};
 F.properties=[];
 for(const a of F.estates58.assets)if((a.owners?.player||0)>0&&typeof syncEstateAsset58==='function'){const keep=s;s=F;try{syncEstateAsset58(a);}catch(e){console.error(e);}finally{s=keep;}}
 return finishTransform274(F,O,R,D,rels,city,pref);
}
// Совместное жильё: семейное имущество (estates58), где у нового персонажа есть доля, а он там жил — с умершим
// (пара, которая жила вместе, или взрослый, к которому переехали) или в своём доме вместе с другими владельцами
// (residents). Целиком своё жильё приходит само (syncEstateAsset58). Вызывается при s===F.
function continueHome274(F,O,R,childAtHome=false){
 const assets=(F.estates58?.assets||[]).filter(a=>a.type==='property'&&a.property&&(a.owners?.player||0)>0&&a.property.country===F.country&&!a.property.rented);
 const h=O.housing||{};
 // Жили вместе: пара (cohabit), человек, к которому переехали (occupant), супруг в том же городе или взрослый сын
 // или дочь до 24 лет в том же городе, у которых другого родителя рядом нет (childAtHome).
 const withDeceased=h.mode==='own'&&h.propertyId&&(R.cohabit||h.occupant===R.id||childAtHome||R.married&&R.alive!==false&&(R.city18||'')===(h.city||''));
 return withDeceased&&assets.find(a=>a.property.id===h.propertyId)||
  assets.find(a=>(a.residents||[]).includes('player')&&(!R.city18||a.property.city===R.city18))||null;
}
// Доля в доме, где вы живёте: объект в s.properties с пометкой share274. Продать или сдать его целиком нельзя
// (propertyMenu, sellMenu ниже). Содержание дома платит каждый владелец по своей доле (npcAssetsMonth58): вы — строкой
// «Содержание доли жилья», остальные — из своих денег; homeCost за такой дом — 0, иначе доли других оплачивались бы
// дважды. Продали долю — объект уходит; выкупили остальные — становится целиком вашим.
function shareHome274(a){
 const p={...copyJourney57(a.property),rented:false,familyRecord58:a.id,share274:true};
 delete p.mortgageId43;delete p.noticeUntil;
 s.properties.push(p);
 a.inPlayer=false;
 return p;
}
function shareSync274(a){
 if(!s?.properties||a?.type!=='property'||!a.property)return;
 delete a.property.share274;
 const p=s.properties.find(p=>p.id===a.property.id&&p.share274);
 if(!p)return;
 const part=a.owners?.player||0;
 if(part>=1-1e-8&&Object.keys(a.owners).length===1){delete p.share274;a.inPlayer=true;return;}
 if(part>0)return;
 s.properties=s.properties.filter(q=>q!==p);
 if(!s.dead&&s.housing?.mode==='own'&&s.housing.propertyId===p.id){
  Object.assign(s.housing,{mode:'rent',propertyId:null,occupant:null});
  log('Новое жильё','Ваша доля в '+(p.kind==='house'?'доме':'квартире')+' продана. Теперь вы снимаете жильё: '+residenceCity()+'.','Жилье',true);
 }
}
// Переехали из дома, где у вас доля: в списке ваших объектов он больше не нужен (доля остаётся в семейном имуществе).
function shareTidy274(){
 if(!s?.properties?.some(p=>p.share274))return;
 s.properties=s.properties.filter(p=>!p.share274||s.housing?.mode==='own'&&s.housing.propertyId===p.id&&(estateAsset58(p.familyRecord58)?.owners?.player||0)>0);
}
function shareOf274(id){
 const p=s?.properties?.find(p=>p.id===id&&p.share274);
 return p?{p,part:estateAsset58(p.familyRecord58)?.owners?.player||0}:null;
}
function finishTransform274(F,O,R,D,rels,city,pref=null){
 const prev=s;s=F;
 try{
  let homeNote='';
  // Жил ли человек в одном доме с умершим (для питомцев умершего ниже).
  const h0=O.housing||{},sameCity=(R.city18||'')===(h0.city||'');
  let livedWith=false;
  if(F.age<18){
   livedWith=['Мать','Отец'].includes(rels.get('player')?.role)&&sameCity;
   // Тот же выбор, что показан в списке (pref), если человек всё ещё может взять заботу; иначе — заново по тем же правилам.
   const g=kinGraph274(F),fresh=minorHome274(F,g,{...R,id:'player',city18:city});
   const home=pref?.id&&pref.kind===fresh.kind&&careAdult274(living(pref.id),F.country)?pref:fresh;
   const carer=home.id&&living(home.id);
   if(carer&&home.kind==='parent'){F.housing={...F.housing,city:carer.city18||city,mode:'parents',occupant:carer.id};homeNote='Вы живёте у '+roleGenitive268(carer)+' — '+carer.name+'.';}
   else if(carer&&typeof placeChild140==='function'){placeChild140(carer,deceasedOf274(),'relative','loss');homeNote='Вы живёте у '+roleGenitive268(carer)+' — '+carer.name+'.';}
   else if(typeof placeChild140==='function'){
    const residential=typeof residentialPlacement143==='function'&&residentialPlacement143(F.country);
    const guardian=person(residential?'Воспитатель детского дома':'Приёмный опекун',rnd(30,60),undefined,F.country);
    guardian.city18=city;s.people.push(guardian);enrichPerson(guardian);if(F.events54?.known)F.events54.known[guardian.id]=true;
    placeChild140(guardian,deceasedOf274(),residential?'residential':'foster','loss');
    homeNote=residential?'Вас устроили в детский дом. Ваш воспитатель — '+guardian.name+'.':'Опеку оформила приёмная семья. Ваш опекун — '+guardian.name+'.';
   }
   const parents=F.people.filter(p=>p.alive&&['Мать','Отец'].includes(p.role));
   const u=F.family27.unions.find(u=>u.legacy);
   if(u&&u.status!=='together'&&parents.length===2&&F.family17){
    const carer=living(F.housing.occupant),other=parents.find(p=>p!==carer);
    if(carer&&other)F.family17.separation132={caregiverId:carer.id,otherParentId:other.id,contact:true,support:Math.random()<.65,lastPaidTick:null};
   }
  }else{
   // Дом, где человек жил (с умершим или в своём совместном жилье), остаётся его домом, если у него там есть доля.
   const parentHere=F.people.some(p=>p.alive&&['Мать','Отец'].includes(p.role)&&p.country===F.country&&(p.city18||'')===(city||''));
   const childAtHome=['Мать','Отец'].includes(rels.get('player')?.role)&&F.age<24&&!parentHere&&(R.city18||'')===(O.housing?.city||'');
   livedWith=!!(R.cohabit||h0.occupant===R.id||R.married&&sameCity||childAtHome);
   const shared=continueHome274(F,O,R,childAtHome);
   let own=shared&&F.properties.find(p=>p.id===shared.property.id);
   if(shared&&!own)own=shareHome274(shared);
   // Своё жильё — в городе, где человек живёт (его показывают список и карточка). Жильё в другом городе (часто
   // унаследованное) остаётся его собственностью, но жить он продолжает там, где жил.
   const cityKnown=!!(R.city18&&cities[F.country]?.includes(R.city18));
   const free=F.properties.filter(p=>p.country===F.country&&!p.rented&&!p.share274);
   own=own||free.find(p=>(p.city||'')===(city||''))||(!cityKnown&&free[0])||null;
   const elsewhere=!own&&free[0];
   // Подростковая пара (teenPair54, одному нет 18) живёт порознь: у родителя остаются, как без пары.
   const partner=F.people.find(p=>p.alive&&p.role==='Партнер'&&!(p.teenPair54&&Math.min(F.age,p.age)<18));
   if(own){
    F.housing={...F.housing,city:own.city||city,area:own.area||'suburb',mode:'own',propertyId:own.id};
    const part=own.share274?estateAsset58(own.familyRecord58)?.owners?.player||0:1;
    homeNote=own.share274?'Вы остаётесь там, где жили: вам принадлежит '+Math.round(part*100)+'% '+(own.kind==='house'?'дома':'квартиры')+'.':
     'Вы живёте в своём жилье: '+(own.city||city)+'.';
   }
   else{
    const parent=F.age<24&&!partner&&F.people.find(p=>p.alive&&['Мать','Отец'].includes(p.role)&&p.country===F.country&&(p.city18||'')===(city||''));
    if(parent){F.housing={...F.housing,mode:'parents',occupant:parent.id};homeNote='Вы пока живёте у '+roleGenitive268(parent)+' — '+parent.name+'.';}
    else homeNote='Вы снимаете жильё: '+city+'.';
    if(elsewhere)homeNote+=' '+(elsewhere.kind==='house'?'Ваш дом':'Ваша квартира')+' в другом городе остаётся за вами: '+elsewhere.city+'.';
   }
   if(partner&&(partner.city18||'')===(F.housing.city||''))partner.cohabit=true;
  }
  // Питомцы умершего, которых при оформлении наследства отдали в приют или родне (defaultPetHome58 знает только
  // кровную родню): кто жил с умершим и остаётся в том же городе, тот и оставляет их дома.
  const kept=livedWith&&(F.housing.city||'')===(h0.city||'')?keepDeceasedPets274(F,D.id):[];
  if(kept.length)homeNote+=' '+(kept.length>1?'Питомцы остаются с вами: ':'Питомец остаётся с вами: ')+kept.join(', ')+'.';
  if(F.family17&&typeof ensureFamily17==='function')ensureFamily17();
  if(typeof familyState27==='function')familyState27();
  // Работа — по профессии из записи (или из карточки, personJob274), если такая вакансия есть в городе; иначе та же
  // профессия без вакансии. Срок заключения, начатый до этой истории, продолжается: работы и учёбы на это время нет.
  const jailed=custodyCase274(R);
  const job=personJob274(R);
  let jobNote='';
  if(jailed){}
  else if(F.age>=16&&job&&!/пенсия/i.test(R.occupation||'')){
   if(startContinueJob274(job,city))jobNote='Работа: '+String(F.job.title).split(' · ')[0]+'.';
   // Профессия только из карточки и с допуском (врач, юрист…): без записи о дипломе — без работы.
   else if(job.title&&!(job.occupation274&&typeof profession16==='function'&&profession16(job.profession)?.license)){
    F.job={title:job.title,salary:Math.round(countries[F.country].wage*(job.incomeRatio||.8)),tenure:Math.floor((job.months||0)/12),professionId:job.profession||null,format:'near',workplace:{country:F.country,city:F.housing.city,area:'center'}};
    jobNote='Работа: '+job.title+'.';
   }
  }else if(R.age>=67||/пенсия/i.test(R.occupation||''))jobNote='На пенсии.';
  // Учёба — та же программа (или такая же в вашем городе) с тем же сроком; не вышло — частичный зачёт при новом поступлении.
  const tr=F.path16?.transfer,trProg=tr?.program&&typeof prog16==='function'?prog16(tr.program):null;
  const progName=p=>typeof programName26==='function'?programName26(p):p.id;
  let studyNote='';
  // Взрослый без своего жилья, пары рядом и работы переезжает в город программы (у NPC город учёбы не хранится).
  const canMove=F.age>=18&&['rent','parents'].includes(F.housing.mode)&&!F.job&&!F.people.some(p=>p.alive&&p.role==='Партнер'&&p.cohabit);
  if(trProg&&!jailed&&startContinueStudy274(tr,canMove)){
   const st=F.path16.study,p=prog16(st.program);
   if(F.housing.study274){delete F.housing.study274;homeNote='Вы переехали ближе к месту учёбы и снимаете жильё.';}
   studyNote='Учёба: '+progName(p)+', пройдено '+Math.floor(st.progress)+' из '+p.months+' мес.';
  }
  else if(trProg)studyNote='Учёба по программе «'+progName(trProg)+'» прервалась: при новом поступлении часть результатов зачтут.';
  if(!jailed&&!jobNote&&!F.job&&F.age>=18&&F.path16?.study?.status!=='active')jobNote='Работы сейчас нет.';
  // Супруг или партнёр живёт в другом городе или стране (у пар NPC города часто разные): никто никуда не переезжает,
  // но об этом сказано сразу — по городу, где вы живёте после всех переездов выше.
  const spouse=F.age>=18&&F.people.find(p=>p.alive&&p.role==='Партнер'&&!(p.teenPair54&&Math.min(F.age,p.age)<18));
  let apartNote='';
  if(spouse){
   const here=F.housing.city||city,there=spouse.city18||cities[spouse.country]?.[0]||'';
   if(spouse.country&&spouse.country!==F.country)apartNote='Вы и '+spouse.name+' живёте в разных странах: '+countries[F.country].name+' и '+(countries[spouse.country]?.name||spouse.country)+'.';
   else if(there&&there!==here)apartNote='Вы и '+spouse.name+' живёте в разных городах: '+here+' и '+there+'.';
  }
  // Первая запись новой жизни. Хроника, лента и «Что изменилось» начинаются заново: в них было рождение-заготовка.
  F.log=[];
  F.timeline88={serial:0,events:{},pins:{}};
  F.feed267={week:{},last:{},since:F.clock.ticks};
  delete F.changes68;
  const rel=rels.get('player');
  const dName=D.name,dRole=rel?.label||'Родственник';
  const care=careNote274(R);
  const text=[(dRole+' — '+dName+' — '+(D.gender==='f'?'умерла':'умер')+' в '+O.year+' году, в '+years(O.age)+'.'),
   'Вам '+years(F.age)+', '+(F.housing.city||city)+', '+countries[F.country].name+'.',homeNote,apartNote,jobNote,studyNote,
   inheritanceNote274(F.estates58.cases.find(q=>q.person===D.id),'player').replace('Наследство: не входит в круг наследников','По закону наследство досталось другим близким')+'.',
   care?care+'.':''].filter(Boolean).join(' ');
  log('История семьи продолжается',text,'Начало',true);
  const first=F.log.find(e=>e.title==='История семьи продолжается');if(first)first.continued274=true;
  if(typeof dossier87==='function'){delete F.dossier87;dossier87();if(F.dossier87)F.dossier87.continuedFrom274={...F.continuedFrom274};}
  F.social=Math.round(F.people.filter(p=>p.alive).reduce((a,p)=>a+(p.bond||0),0)/Math.max(1,F.people.filter(p=>p.alive).length));
  if(typeof ensureHome==='function')ensureHome();
 }finally{s=prev;}
 return F;
}
function deceasedOf274(){return s.continuedFrom274?.id||null;}
function keepDeceasedPets274(F,deceasedId){
 const z=F.estates58,kept=[];
 if(!z)return kept;
 for(const q of z.petOffers||[]){
  if(q.person!==deceasedId)continue;
  const r=(z.pets||[]).find(r=>r.id===q.record);
  if(!r?.pet?.alive||r.owner==='player'||!['rehomed','owned','waiting'].includes(r.status))continue;
  r.owner='player';r.status='withPlayer';delete r.pet.household183;
  r.pet.notes=[...(r.pet.notes||[]),'После утраты хозяина живёт дома, с вами.'];
  if(!F.pets.some(p=>p.id===r.pet.id))F.pets.push(r.pet);
  q.status='accepted';kept.push(r.pet.name);
 }
 return kept;
}
function startContinueJob274(job,city){
 try{
  const prof=typeof profession16==='function'&&job.profession?profession16(job.profession):null;
  if(!prof||typeof makeVacancies16!=='function'||typeof startJob16!=='function')return false;
  const x=path16();
  const view={...x.view};
  x.view={...x.view,section:'jobs',country:s.country,field:prof.field,format:'near'};x.marketKey=null;
  makeVacancies16();
  const v=(x.vacancies||[]).find(v=>v.profession===prof.id);
  x.view=view;x.marketKey=null;
  if(!v)return false;
  // Человек работал там годами: бессрочный договор, а не срочный на два года.
  const before=s.job,a={id:'continue274-job',vacancy:{...v,city:s.housing.city||v.city,country:s.country,contract45:{type:'permanent',months:null}},status:'accepted',probability:1};
  x.jobApplications.push(a);
  const keepToast=toast;
  toast=()=>{};
  try{startJob16(a.id);}finally{toast=keepToast;}
  if(!s.job||s.job===before){x.jobApplications=x.jobApplications.filter(q=>q!==a);return false;}
  s.job.tenure=Math.floor((job.months||0)/12);
  return true;
 }catch(e){console.error(e);return false;}
}

function startContinueStudy274(tr,canMove=false){
 const keepHousing={...s.housing};
 try{
  const old=prog16(tr.program),city=residenceCity();
  if(!old||typeof studyStart16!=='function'||typeof programs16==='undefined')return false;
  const here=q=>q.country===s.country&&q.city===city;
  let p=here(old)?old:programs16.filter(q=>here(q)&&q.field===old.field&&q.level===old.level)
   .sort((a,b)=>(a.subject26===old.subject26?0:1)-(b.subject26===old.subject26?0:1))[0];
  if(!p&&canMove&&old.country===s.country&&cities[s.country]?.includes(old.city)){
   p=old;
   delete s.housing.listing41;delete s.housing.display59;
   Object.assign(s.housing,{city:old.city,area:'suburb',mode:'rent',occupant:null,propertyId:null,active:true,study274:true});
  }
  if(!p)return false;
  const x=path16();
  // Человек уже учился на этой программе: язык обучения у него на нужном уровне.
  x.languages??={};
  const need=[[p.language,p.minLanguage],[typeof teachingSubjects26!=='undefined'?teachingSubjects26[p.subject26]?.language:null,4]];
  for(const [lang,level] of need)if(lang&&Number.isFinite(level))x.languages[lang]=Math.max(x.languages[lang]||0,level);
  const a={id:'continue274-study',program:p.id,status:'accepted',probability:1,roll:0,submitted:s.clock.ticks,accepted:s.clock.ticks,scholarship:null};
  x.applications.push(a);
  const keepTransfer=x.transfer,keepToast=toast;
  x.transfer=null;toast=()=>{};
  try{for(const payer of s.age<18?['family','self']:['self','family','loan']){studyStart16(a.id,payer);if(x.study)break;}}
  finally{toast=keepToast;}
  if(!x.study){x.applications=x.applications.filter(q=>q!==a);x.transfer=keepTransfer;s.housing=keepHousing;return false;}
  // Пройденное засчитывается полностью в той же программе и по правилам перевода — в такой же в вашем городе.
  const done=Math.max(0,Math.round(tr.progress||0));
  x.study.progress=Math.min(p.months-1,p===old?done:Math.max(x.study.progress||0,done*.7));
  // Студенческий кредит studyStart16 выдал на всю программу (зачёт выше не прошёл через x.transfer): только на
  // оставшиеся месяцы, сумма и основной долг вместе.
  const left=Math.max(0,p.months-x.study.progress)/Math.max(1,p.months);
  for(const d of s.debts||[])if(d.pathStudy&&d.studyId===x.study.id){d.balance*=left;d.principal*=left;}
  return true;
 }catch(e){console.error(e);s.housing=keepHousing;return false;}
}
// Заключение выбранного человека (custody145, конечный срок) становится делом с приговором, как у персонажа
// (court94: courtCustody94 приостанавливает работу, учёбу и поездки, по окончании — «Освобождение»).
if(typeof justiceActs91!=='undefined')justiceActs91.prior274??={name:'Приговор до начала этой истории'};
function custodyCase274(R){
 const term=R?.custody145;
 if(term?.status!=='serving'||term.life||!(term.ends>s.clock.ticks)||typeof justiceRecord91!=='function'||typeof courtCases94!=='function')return false;
 justiceRecord91(courtCases94(),'case94',{incident:null,key:'prior274',status:'convicted',decided:s.clock.ticks,
  sentence:{kind:'custody',starts:s.clock.ticks,ends:term.ends},witnesses:false,complaint:false,roll:0,fine:0,compensation:0,age:s.age,
  history:[{tick:s.clock.ticks,status:'convicted',note:'Срок назначен до начала этой истории.'}]});
 return true;
}

// ---------- 5. Экран: финал, выбор, древо ----------

function continueMenu274(){
 continueEstate274(true);
 const list=continueCandidates274();
 if(!list.length){show('Продолжить историю семьи','Живых родных, связанных с этой жизнью по семейному древу, нет.',[{label:'Понятно',fn:()=>{}}]);return;}
 show('Продолжить историю семьи','Чью жизнь продолжить? Наследство уже распределено по закону и от вашего выбора не зависит.',
  list.map(c=>({label:c.p.name+' · '+c.label+' · '+years(c.age),
   hint:[c.city,c.inheritance,c.minor?.text,c.work,c.care,c.disabled].filter(Boolean).join(' · '),
   disabled:!!c.disabled,fn:()=>continueConfirm274(c.id)})));
}
function continueConfirm274(id){
 const c=continueCandidates274().find(c=>c.id===id);
 if(!c)return;
 const p=c.p;
 const text=c.label+' — '+p.name+', '+years(p.age)+'. '+c.city+'. '+(c.minor?c.minor.text+'. ':'')+c.inheritance+'.'+(c.work?' '+c.work+'.':'')+(c.care?' '+c.care+'.':'')+
  ' Эта жизнь останется в «Персонажах» завершённой, а новая начнётся с того же года.';
 show('Продолжить за: '+p.name,text,[{label:'Продолжить за этого человека',disabled:!!c.disabled,fn:()=>continueAs274(id)},{label:'Назад к списку',fn:continueMenu274}]);
}
function continueEndHTML274(){
 if(!s?.dead)return '';
 if(s.continued274)return '<p class="continue274">История продолжена: '+esc(s.continued274.name)+' ('+esc(String(s.continued274.label||'').toLocaleLowerCase('ru'))+').</p>'+
  '<button class="primary" onclick="openContinued274()">Открыть продолжение →</button> ';
 const n=continueCandidates274().filter(c=>!c.disabled).length;
 return n?'<button class="primary" onclick="continueMenu274()">Продолжить за близкого →</button> ':'';
}
// Продолжение ищется по saveId, а после переноса сохранений — по постоянному ключу (continuedFrom274.id). Нет его
// среди сохранений (удалено или не перенесено) — можно снова выбрать, за кого продолжить.
function findContinued274(link){
 if(!link||typeof readLife!=='function')return null;
 if(link.saveId&&readLife(link.saveId)?.continuedFrom274)return link.saveId;
 if(!link.lineage||typeof vaultIndex!=='function')return null;
 for(const id of vaultIndex().ids){
  if(id===s?.saveId)continue;
  if(readLife(id)?.continuedFrom274?.id===link.lineage)return id;
 }
 return null;
}
function openContinued274(){
 const link=s?.continued274;
 if(!link)return;
 const id=findContinued274(link);
 if(!id){
  delete s.continued274;save();render();
  toast('Продолжения этой истории нет среди сохранений. Можно снова выбрать, за кого продолжить.');
  continueMenu274();
  return;
 }
 if(id!==link.saveId){link.saveId=id;save();}
 loadCharacter(id);
}
const continueBase274={start,story,autonomousMonth,rollYear,treeCard90,personSections42,birthKin27,compatible,syncEstateAsset58,homeCost,propertyMenu,sellMenu,monthlyFinance,moveHome};
start=function(...args){
 const r=continueBase274.start.apply(this,args);
 if(!continuing274&&s&&!s.siblings274){try{siblingsAtStart274();save();render();}catch(e){console.error(e);}}
 return r;
};
autonomousMonth=function(...args){
 const r=continueBase274.autonomousMonth.apply(this,args);
 try{siblingMonth274();}catch(e){console.error(e);}
 try{shareTidy274();}catch(e){console.error(e);}
 return r;
};
// Люди, которых вы знаете через умершего (его друзья и знакомые, пары родни, дальние родственники) при близости ниже
// 50 уходят тише: игра снимает 12 настроения за смерть любого человека из списка, а в продолжении в нём весь круг
// прежней жизни. Здесь за такого человека — 2.
// Продолжение за несовершеннолетнего: в 18 лет при достатке 'high' игра пишет «Родители готовы оплачивать университет».
// Если живых родителей нет (умерли после перехода или в этот же год), достаток — средний, и запись — как при среднем.
function parentsAlive274(){return s.people.some(p=>p.alive&&['Мать','Отец'].includes(p.role));}
rollYear=function(...args){
 const watch=s?.continuedFrom274&&!s.dead?s.people.filter(p=>p.alive&&p.inherited274&&(p.bond??0)<50):[];
 const mood=s?.mood;
 const coming18=!!(s?.continuedFrom274&&!s.dead&&s.age===17);
 if(coming18&&s.background==='high'&&!parentsAlive274())s.background='mid';
 const keepLog=log,adultLog=function(title,text,...rest){
  if(title==='Совершеннолетие'&&s.background==='high'&&!parentsAlive274()){text=String(text).replace('Родители готовы оплачивать университет.','Семья помогла накопить на первые шаги.');s.background='mid';}
  return keepLog.call(this,title,text,...rest);
 };
 if(coming18)log=adultLog;
 let r;
 try{r=continueBase274.rollYear.apply(this,args);}finally{if(log===adultLog)log=keepLog;}
 const gone=watch.filter(p=>!p.alive).length;
 if(gone&&Number.isFinite(mood)&&s.mood<mood)s.mood=Math.min(mood,clamp(s.mood+10*gone));
 return r;
};
// Младший брат или сестра, родившиеся в союзе родителей обычным путём (birthKin27), получают ту же запись в ленте,
// что и по плану: «У вас родился брат — Имя» вместо уведомления «Родился младший брат».
birthKin27=function(u,adopt=false,...rest){
 const keep=typeof notice61==='function'?notice61:null;let caught=false;
 if(keep)notice61=function(type,title,...args){if(type==='parentCare136'&&/^Родил(ся|ась) младш/.test(String(title))){caught=true;return null;}return keep.call(this,type,title,...args);};
 let p;
 try{p=continueBase274.birthKin27.call(this,u,adopt,...rest);}finally{if(keep)notice61=keep;}
 if(caught&&p){
  const parents=[u.a,u.b].map(id=>s.people.find(q=>q.id===id)).filter(Boolean);
  try{announceSiblings274([p],parents,!parents.every(q=>['Мать','Отец'].includes(q.role)));}catch(e){console.error(e);}
 }
 return p;
};
// Знакомые из круга умершего не зовут на свидания и не становятся парой, пока вы сами не сблизились (близость от 45):
// в продолжении их десятки, и все случайные приглашения шли бы от ровесников прежнего персонажа.
compatible=function(p,...rest){
 if(p?.inherited274&&(p.bond??0)<45)return false;
 return continueBase274.compatible.call(this,p,...rest);
};
syncEstateAsset58=function(a,...rest){
 const r=continueBase274.syncEstateAsset58.call(this,a,...rest);
 try{shareSync274(a);}catch(e){console.error(e);}
 return r;
};
homeCost=function(...args){
 const cost=continueBase274.homeCost.apply(this,args),h=s?.housing,share=h?.active!==false&&h?.mode==='own'&&shareOf274(h.propertyId);
 return share&&Number.isFinite(cost)?0:cost;
};
// Переехали из дома с долей: копия в s.properties убирается до расчёта месяца, иначе monthlyFinance взял бы за неё
// полное «Содержание объекта» поверх строки доли.
monthlyFinance=function(...args){
 try{shareTidy274();}catch(e){console.error(e);}
 return continueBase274.monthlyFinance.apply(this,args);
};
moveHome=function(...args){
 const r=continueBase274.moveHome.apply(this,args);
 try{shareTidy274();}catch(e){console.error(e);}
 return r;
};
propertyMenu=function(id,...rest){
 const share=shareOf274(id);
 if(!share)return continueBase274.propertyMenu.call(this,id,...rest);
 const original=show;
 show=function(title,text,opts=[],...more){
  show=original;
  const note=' Вам принадлежит '+Math.round(share.part*100)+'%. Продать или сдать жильё целиком без других владельцев нельзя; свою долю можно продать в разделе «Наследство и семейное имущество».';
  return original.call(this,title,String(text||'')+note,opts.map(q=>/Продать|Сдава|аренд|Выставить/i.test(q?.label||'')?{...q,disabled:true}:q),...more);
 };
 try{return continueBase274.propertyMenu.call(this,id,...rest);}finally{show=original;}
};
sellMenu=function(id,...rest){
 if(shareOf274(id))return toast('Жильё принадлежит вам не целиком. Свою долю можно продать в разделе «Наследство и семейное имущество».');
 return continueBase274.sellMenu.call(this,id,...rest);
};
story=function(...args){
 const html=continueBase274.story.apply(this,args);
 if(!s?.dead)return html;
 const extra=continueEndHTML274();
 return extra?html.replace('<button onclick="newLife()">',extra+'<button onclick="newLife()">'):html;
};
// Подпись родства (p.kin274 — была ли она при переходе) считается заново по нынешнему древу: брак, развод, расставание,
// новая пара родни меняют её («Партнёрша» → «Жена»). Показывается, только пока роль в игре та же, что по древу.
function kinLabel274(p,g=null){
 if(!p?.kin274||!s?.people)return '';
 try{const rel=kinRelation274(g||kinGraph274(s),'player',p.id);return rel&&rel.role===p.role&&rel.label!==rel.role?rel.label:'';}
 catch(e){console.error(e);return '';}
}
// Древо рисует карточки по одной: граф семьи строится один раз на отрисовку (её граф — ключ).
const kinTreeGraphs274=new WeakMap();
personSections42=function(p,...rest){
 const sections=continueBase274.personSections42(p,...rest);
 const kin=kinLabel274(p);
 if(kin&&typeof section20==='function')sections.splice(1,0,section20('Родство',[fact20('Кем приходится',kin)]));
 if(p?.died274&&typeof section20==='function')sections.splice(1,0,section20('Прежняя жизнь',[fact20('Годы',(p.birthYear??'')+' — '+p.died274.year),fact20('Возраст',years(p.died274.age))]));
 return sections;
};
treeCard90=function(graph,id,pos){
 const html=continueBase274.treeCard90(graph,id,pos),p=graph.people.get(id);
 if(!p?.kin274||p.married||p.divorced||id==='player')return html;
 if(graph&&typeof graph==='object'&&!kinTreeGraphs274.has(graph))kinTreeGraphs274.set(graph,kinGraph274(s));
 const kin=kinLabel274(p,graph&&typeof graph==='object'?kinTreeGraphs274.get(graph):null);
 return kin?html.replace(/<small>[^<]*<\/small>/,'<small>'+esc(kin)+'</small>'):html;
};
// 274: раскладка древа с боковыми линиями — дети предков (тёти, дяди), их дети (двоюродные), дети братьев и сестёр
// (племянники) и их пары. Раньше раскладка спускалась только по линии персонажа.
treeLayout90=function(graph,root){
 const parents=new Map(),children=new Map(),side=new Map();
 const add=(map,id,target)=>{if(!map.has(id))map.set(id,new Set());map.get(id).add(target);};
 for(const edge of graph.edges){
  if(treeParentKinds90.has(edge.kind)){add(parents,edge.b,edge.a);add(children,edge.a,edge.b);}
  else{add(side,edge.a,edge.b);add(side,edge.b,edge.a);}
 }
 const placed=new Map([[root,0]]),ancestors=new Set(),collateral=new Set(),anchor=new Map();
 function walk(links,step,branch){
  if(treeHidden90.has(branch))return;
  let frontier=[root];
  for(let level=1;level<=treeDepth90&&frontier.length;level++){
   const next=[];
   for(const id of frontier)for(const related of links.get(id)||[]){
    if(placed.has(related))continue;
    placed.set(related,step*level);if(step<0)ancestors.add(related);
    next.push(related);
   }
   frontier=next;
  }
 }
 walk(parents,-1,'parents');
 walk(children,1,'children');
 if(!treeHidden90.has('side')){
  for(const parent of parents.get(root)||[])for(const sibling of children.get(parent)||[])if(!placed.has(sibling)){placed.set(sibling,0);collateral.add(sibling);}
  // Боковые линии: от каждого предка вниз, не глубже уровня детей персонажа.
  const floor=Math.max(1,Math.min(treeDepth90-1,2));
  let frontier=[...ancestors,...collateral];
  for(let guard=0;guard<6&&frontier.length;guard++){
   const next=[];
   for(const id of frontier){
    const level=placed.get(id);
    if(level>=floor)continue;
    for(const child of children.get(id)||[]){
     if(placed.has(child))continue;
     placed.set(child,level+1);collateral.add(child);next.push(child);
    }
   }
   frontier=next;
  }
  for(const [id,level] of [...placed]){
   for(const related of side.get(id)||[]){
    if(placed.has(related))continue;
    const p=graph.people.get(related);
    const offset=id==='player'&&['Бабушка','Дедушка'].includes(p.role)?-2:id==='player'&&['Внук','Внучка'].includes(p.role)?2:0;
    placed.set(related,level+offset);anchor.set(related,id);
    if(collateral.has(id))collateral.add(related);
   }
  }
 }
 const rows=new Map();
 for(const [id,level] of placed){if(!rows.has(level))rows.set(level,[]);rows.get(level).push(id);}
 // В ряду — сначала прямая линия, потом боковые ветви; пара стоит рядом с тем, через кого попала в древо.
 const order=new Map([...placed.keys()].map((id,i)=>[id,i]));
 const key=id=>[collateral.has(id)?1:0,order.get(anchor.get(id)??id),anchor.has(id)?1:0];
 for(const row of rows.values())row.sort((a,b)=>{const x=key(a),y=key(b);return x[0]-y[0]||x[1]-y[1]||x[2]-y[2];});
 const width=Math.max(...[...rows.values()].map(row=>row.length))*182+28;
 const levels=[...rows.keys()].sort((a,b)=>a-b);
 const positions=new Map();
 levels.forEach((level,i)=>{const row=rows.get(level);row.forEach((id,j)=>positions.set(id,{x:(width-row.length*182)/2+j*182+8,y:14+i*174}));});
 return {positions,width,height:levels.length*174};
};
if(s){try{siblingState274();}catch(e){console.error(e);}}
