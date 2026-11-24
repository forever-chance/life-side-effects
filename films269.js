'use strict';
// Сборка 269: каталог фильмов в игре (films269-data.js, собирается из docs/films.csv).
// - Увлечение «Кино»: у ретроспективы, фильма с обсуждением и домашней программы теперь есть настоящие фильмы.
// - Киноклуб: новый клуб с 14 лет, раз в месяц участия — фильм клуба (в ленту идёт через «Будни»).
// - Походы в кино с друзьями, свидания в кино, подростковое «Кино» и семейный поход в кино из детской просьбы
//   называют фильм, который сейчас идёт в прокате.
// - Своё дело «Кинотеатр»: в меню виден текущий репертуар.
// - Что вы смотрели и любимый фильм видны в увлечении «Кино».
// Каталог заканчивается анонсами 2029 года, а жизнь в игре идёт до 2110-х. С 2028 года каждый месяц, где в каталоге
// меньше двух премьер, добирается вымышленными фильмами из сюжетов редактора проектов (catalog-data189.js). Режиссёров
// и сюжеты подбирает генератор с зерном жизни, поэтому они не хранятся в сохранении и не меняются при загрузке.

const filmsById269=new Map(filmCatalog269.map(f=>[f.id,f]));
const filmsByMonth269=new Map();
for(const f of filmCatalog269)if(f.month){const k=f.year*12+f.month-1;if(!filmsByMonth269.has(k))filmsByMonth269.set(k,[]);filmsByMonth269.get(k).push(f);}
const FUTURE_FROM269=2028*12;
const filmGenreFromStory269={Драма:'Драма',Комедия:'Комедия',Детектив:'Детектив',Триллер:'Триллер',Хоррор:'Хоррор','Научная фантастика':'Фантастика',
 Фэнтези:'Фэнтези',Романтика:'Мелодрама',Исторический:'Исторический',Криминальный:'Криминал',Приключения:'Приключения',Экспериментальный:'Драма'};
const filmGenreAge269={Хоррор:18,Триллер:16,Криминал:16};
const filmGenrePlural269={Драма:'драмы',Анимация:'мультфильмы',Комедия:'комедии',Боевик:'боевики',Фантастика:'фантастика',Триллер:'триллеры',
 Криминал:'криминальные истории',Приключения:'приключения',Хоррор:'фильмы ужасов',Фэнтези:'фэнтези',Военный:'военное кино',Исторический:'исторические фильмы',
 Детектив:'детективы',Биография:'фильмы о реальных людях',Мелодрама:'мелодрамы',Мюзикл:'мюзиклы',Вестерн:'вестерны'};
const filmStories269=typeof storyEntries189!=='undefined'?storyEntries189.filter(r=>r[1]==='film'&&r[3]==='full'):[];

function films269(){
 const x=s.films269??={seen:{},recent:[],fav:null,favScore:-1};
 x.seed??=Math.floor(Math.random()*2**31);
 return x;
}
function filmNow269(){return s.year*12+(s.clock?.month??0);}
function filmDate269(f){return f.year*12+(f.month||1)-1;}
function filmReleased269(f,now=filmNow269()){return filmDate269(f)<=now;}

// Вымышленные премьеры будущего: детерминированно по зерну жизни и месяцу.
function seeded269(seed){let a=seed>>>0;return ()=>{a=a+0x6D2B79F5>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
function withSeed269(seed,fn){const r=Math.random;Math.random=seeded269(seed);try{return fn();}finally{Math.random=r;}}
const futureCache269=new Map();
// Вымышленные премьеры идут по перемешанному списку сюжетов: пока список не кончится (лет на двадцать), ни один сюжет
// не повторяется; на втором круге у сюжета другое название. Сюжеты для приглашений в проекты берутся с другого конца.
let futurePlan269=null;
function futureOrder269(){
 const seed=films269().seed;
 if(futurePlan269?.seed===seed)return futurePlan269;
 const order=withSeed269(seed^0x5bd1e995,()=>{const a=filmStories269.map((_,i)=>i);for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;});
 return futurePlan269={seed,order,prefix:[0]};
}
// Порядковый номер вымышленной премьеры с января 2028 года.
function futureSlot269(ym,k=0){
 const plan=futureOrder269(),pre=plan.prefix;
 for(let m=FUTURE_FROM269+pre.length-1;m<ym;m++)pre.push(pre.at(-1)+Math.max(0,2-(filmsByMonth269.get(m)?.length||0)));
 return pre[Math.max(0,ym-FUTURE_FROM269)]+k;
}
function storyTitles269(row){const plain=row[5].filter(x=>!/[—:]/.test(x));return plain.length?plain:row[5];}
// Название премьеры: вариант сюжета, которого не было среди последних 200 премьер и нет в каталоге —
// у разных сюжетов бывают одинаковые варианты названий.
let filmTitles269=null;
function futureTitle269(n){
 const plan=futureOrder269(),L=filmStories269.length;plan.titles??=[];
 filmTitles269??=new Set(filmCatalog269.map(f=>f.title));
 while(plan.titles.length<=n){
  const i=plan.titles.length,row=filmStories269[plan.order[i%L]],cycle=Math.floor(i/L),recent=new Set(plan.titles.slice(-200));
  const plain=storyTitles269(row),rot=list=>list.map((_,j)=>list[(cycle+j)%list.length]);
  // Сначала простые названия, потом составные (с тире) — простых на все сюжеты не хватает.
  const variants=[...rot(plain),...rot(row[5].filter(v=>!plain.includes(v)))];
  // Если у сюжета все варианты недавно были, название берётся из соседних сюжетов списка.
  let title=variants.find(v=>!recent.has(v)&&!filmTitles269.has(v));
  for(let j=1;!title&&j<L;j++)title=filmStories269[plan.order[(i+j)%L]][5].find(v=>!recent.has(v)&&!filmTitles269.has(v));
  plan.titles.push(title||plain[cycle%plain.length]);
 }
 return plan.titles[n];
}
function futureFilm269(ym,k){
 const key=films269().seed+':'+ym+':'+k;
 if(futureCache269.has(key))return futureCache269.get(key);
 if(!filmStories269.length)return null;
 const plan=futureOrder269(),n=futureSlot269(ym,k),L=filmStories269.length,row=filmStories269[plan.order[n%L]],title=futureTitle269(n);
 const f=withSeed269(films269().seed^Math.imul(n+1,2654435761),()=>{
  const codes=Object.keys(countries),code=Math.random()<.4?'us':pick(codes),gender=pick(['f','m']);
  // Не name(): он помнит выданные имена и во второй раз дал бы другого режиссёра.
  const given=pick(countries[code].names[gender==='m'?1:0]);
  const director=typeof fullName256==='function'?fullName256(given,defaultParts256(code,gender),code):given;
  const genre=filmGenreFromStory269[row[2]]||'Драма';
  return {id:'G'+ym+'-'+k,title,director,year:Math.floor(ym/12),month:ym%12+1,origin:countries[code].name,genre,story:row[0],
   minAge:filmGenreAge269[genre]||12,country:'Любая',summary:String(row[4]).split(/(?<=\.)\s/)[0],generated:true};
 });
 futureCache269.set(key,f);
 return f;
}
function futureMonth269(ym){
 if(ym<FUTURE_FROM269)return [];
 const need=Math.max(0,2-(filmsByMonth269.get(ym)?.length||0));
 return Array.from({length:need},(_,k)=>futureFilm269(ym,k)).filter(Boolean);
}
function filmById269(id){
 if(filmsById269.has(id))return filmsById269.get(id);
 const m=/^G(\d+)-(\d+)$/.exec(id||'');
 return m?futureFilm269(Number(m[1]),Number(m[2])):null;
}
function filmLabel269(f){return `«${f.title}» (${f.year})`;}

// Что можно посмотреть: по возрасту, стране проката и дате. Вымышленные премьеры — за последние пять лет:
// классика остаётся в репертуаре, проходные новинки забываются.
function filmsAvailable269(o={}){
 const age=o.age??s.age,code=o.country??s.country,countryName=countries[code]?.name,now=o.now??filmNow269();
 const fits=f=>f.minAge<=age&&(age>=12||f.minAge<=6)&&(f.country==='Любая'||f.country===countryName)&&filmReleased269(f,now)
  &&(!o.genre||f.genre===o.genre)&&(!o.top||f.top250)&&(!o.children||f.minAge<=6);
 const pool=filmCatalog269.filter(fits);
 for(let ym=Math.max(FUTURE_FROM269,now-60);ym<=now;ym++)for(const f of futureMonth269(ym))if(fits(f))pool.push(f);
 return pool;
}
// В прокате: вышли за последние months месяцев.
function filmsNow269(months=3,o={}){
 const now=o.now??filmNow269();
 return filmsAvailable269(o).filter(f=>now-filmDate269(f)<months).sort((a,b)=>filmDate269(b)-filmDate269(a));
}
// Выбор фильма: сначала то, чего вы ещё не видели.
function filmPick269(pool,skip=new Set()){
 const x=films269(),fresh=pool.filter(f=>!x.seen[f.id]&&!skip.has(f.id)),rest=pool.filter(f=>!skip.has(f.id));
 return pick(fresh.length?fresh:rest.length?rest:pool)||null;
}
// Фильм в кинотеатре: премьера, а если премьер для этого возраста нет — повторный показ.
function filmInCinema269(o={}){
 const now=filmsNow269(3,o);
 if(now.length)return filmPick269(now);
 const classics=filmsAvailable269({...o,top:!o.children});
 return filmPick269(classics.length?classics:filmsAvailable269(o));
}
function filmList269(films){
 const names=films.map(filmLabel269);
 return names.length>1?names.slice(0,-1).join(', ')+' и '+names.at(-1):names.join('');
}

// Запомнить просмотр; любимым становится фильм с самой сильной оценкой.
function filmSeen269(f,how='',bonus=0){
 if(!f||!s)return;
 const x=films269();
 x.seen[f.id]=(x.seen[f.id]||0)+1;
 x.recent=[f.id,...x.recent.filter(id=>id!==f.id)].slice(0,12);
 const score=Math.random()*100+(f.top250?Math.max(0,25-f.top250/10):0)+bonus;
 if(score>x.favScore){x.fav=f.id;x.favScore=Math.round(score);}
}
function filmStats269(){
 const x=s?.films269;if(!x)return '';
 const n=Object.keys(x.seen).length,fav=filmById269(x.fav);
 if(!n)return '';
 return 'Посмотрено фильмов: '+n+(fav?'. Любимый — '+filmLabel269(fav)+', реж. '+fav.director:'')+'.';
}

// Новые записи ленты, появившиеся за время вызова fn (лента растёт с начала).
function newEntries269(fn){
 const before=s?.log?.[0];
 const out=fn();
 const added=[];
 for(const e of s?.log||[]){if(e===before)break;added.push(e);}
 return {out,added};
}

// 1. Увлечение «Кино».
function hobbyFilmText269(label,interest){
 const age=s.age,warm=interest>65;
 if(/ретроспектив/i.test(label)){
  const byDirector=new Map();
  for(const f of filmsAvailable269({age}))if(!f.generated)for(const d of f.director.split(', ')){if(!byDirector.has(d))byDirector.set(d,[]);byDirector.get(d).push(f);}
  const options=[...byDirector.entries()].filter(([,list])=>list.length>=3);
  if(options.length){
   const [director,list]=pick(options),shown=[...list].sort(()=>Math.random()-.5).slice(0,3).sort((a,b)=>a.year-b.year),best=pick(shown);
   shown.forEach(f=>filmSeen269(f,'retro',f===best?15:0));
   return `Ретроспектива · ${director}. Показывают ${filmList269(shown)}. Главное впечатление — «${best.title}». ${best.summary}`
    +(warm?' Хочется досмотреть остальное.':'');
  }
 }
 if(/программ/i.test(label)){
  const all=filmsAvailable269({age}),genres=Object.keys(filmGenrePlural269).filter(g=>all.filter(f=>f.genre===g).length>=3);
  if(genres.length){
   const genre=pick(genres),pool=all.filter(f=>f.genre===genre),shown=[];
   while(shown.length<3){const f=filmPick269(pool,new Set(shown.map(f=>f.id)));if(!f||shown.includes(f))break;shown.push(f);}
   const best=pick(shown);
   shown.forEach(f=>filmSeen269(f,'home',f===best?10:0));
   return `Программа на три вечера — ${filmGenrePlural269[genre]}: ${shown.map(f=>'«'+f.title+'»').join(', ')}. Лучший вечер — «${best.title}» (${best.year}).`
    +(warm?' Следующую программу хочется собрать побыстрее.':' Третий вечер ушёл на телефон.');
  }
 }
 const f=filmPick269(filmsAvailable269({age}));
 if(!f)return null;
 filmSeen269(f,'talk',warm?10:0);
 return `${filmLabel269(f)}, реж. ${f.director}. ${f.summary} `+(warm?'После показа вы ещё долго спорите о финале.':'Обсуждение выходит вежливым и коротким.');
}

const finishTaskBase269=finishTask;
finishTask=function(t,...args){
 if(!s||s.dead||!t)return finishTaskBase269.call(this,t,...args);
 if(t.kind==='hobby'&&t.hobby==='film'){
  const interest=s.hobbies?.film?.interest??70;
  const text=t.film269!==undefined?cinemaVisitText269(t.film269,interest):hobbyFilmText269(t.label||'',interest);
  if(!text)return finishTaskBase269.call(this,t,...args);
  const logBase=log;
  log=function(title,body,...rest){if(title===t.label){log=logBase;return logBase.call(this,title,text,...rest);}return logBase.call(this,title,body,...rest);};
  try{return finishTaskBase269.call(this,t,...args);}finally{log=logBase;}
 }
 const cinema=t.kind==='meeting53'&&['cinema','dateCinema255'].includes(t.meeting53)||t.kind==='teenDate54'&&t.teenKind54==='cinema';
 if(!cinema)return finishTaskBase269.call(this,t,...args);
 const p=living(t.person53||t.person54),age=Math.min(s.age,p?.age??s.age);
 const {out,added}=newEntries269(()=>finishTaskBase269.call(this,t,...args));
 const entry=added.find(e=>/кино/i.test(e.title))||added.find(e=>p&&String(e.text).includes(p.name));
 if(entry){const f=filmById269(t.film269)||filmInCinema269({age});if(f){filmSeen269(f,'cinema',t.film269?10:0);entry.text+=' Смотрели '+filmLabel269(f)+'.';}}
 return out;
};
// Поход в кино из увлечения: фильм выбран заранее или решается у кассы.
function cinemaVisitText269(id,interest){
 const f=filmById269(id)||filmInCinema269({age:s.age});
 if(!f)return null;
 filmSeen269(f,'cinema',id?10:0);
 return `${filmLabel269(f)}, реж. ${f.director}. ${f.summary} `+(interest>65?'Из зала вы выходите последними: титры досмотрены до конца.':'Попкорн закончился раньше фильма.');
}

// 2. Семейный поход в кино по детской просьбе.
if(typeof askParent67==='function'){
 const askParentBase269=askParent67;
 askParent67=function(kind,...args){
  if(kind!=='outing'||!s)return askParentBase269.call(this,kind,...args);
  const {out,added}=newEntries269(()=>askParentBase269.call(this,kind,...args));
  const entry=out&&added.find(e=>/поход в кино/i.test(e.title));
  if(entry){const f=filmById269(window.__filmChoice269)||filmInCinema269({age:s.age,children:s.age<12});if(f){filmSeen269(f,'family',10);entry.text+=' Смотрели '+filmLabel269(f)+'.';}}
  return out;
 };
}

// 3. Киноклуб.
clubsCatalog19.cinema269={name:'Киноклуб',minAge:14,hobby:'film',hours:2,fee:.0015,
 topics:['Показ и спор о финале','Вечер короткого метра','Фильм, который все видели, но никто не помнит концовку']};
if(typeof clubTraining72!=='undefined')clubTraining72.cinema269=[['profile','cinema',.3]];
if(typeof routine267!=='undefined')routine267['Фильм клуба']='киноклуб';
function filmClub269(m){return clubsCatalog19[m?.type]?.hobby==='film';}
if(typeof clubKind245==='function'){
 const clubKindBase269=clubKind245;
 clubKind245=function(m){return filmClub269(m)?'film':clubKindBase269(m);};
}
if(typeof clubProgramMonth245==='function'){
 const clubProgramBase269=clubProgramMonth245;
 clubProgramMonth245=function(m){
  if(!filmClub269(m))return clubProgramBase269(m);
  if(m.filmTick269===s.clock.ticks)return true;
  m.filmTick269=s.clock.ticks;
  m.films269??=[];
  const recent=filmsNow269(6,{country:m.country}),pool=recent.length&&chance(.4)?recent:filmsAvailable269({country:m.country});
  const f=filmPick269(pool,new Set(m.films269));
  if(!f)return false;
  m.films269.push(f.id);if(m.films269.length>60)m.films269.shift();
  filmSeen269(f,'club',5);
  log('Фильм клуба',`${filmLabel269(f)}, реж. ${f.director}. ${f.summary}`,'Занятия');
  return true;
 };
}
if(typeof clubProgramMenu245==='function'){
 const clubProgramMenuBase269=clubProgramMenu245;
 clubProgramMenu245=function(id){
  const m=clubState19().memberships.find(m=>m.id===id);
  if(!filmClub269(m))return clubProgramMenuBase269(id);
  const list=(m.films269||[]).slice(-6).reverse().map(filmById269).filter(Boolean),last=list[0];
  show(last?last.title:'Программа клуба',last?`${filmLabel269(last)}, реж. ${last.director}\n${last.summary}`+(list.length>1?'\nДо этого: '+list.slice(1).map(f=>'«'+f.title+'»').join(', ')+'.':''):'Первый фильм выберут на ближайшем показе.',[
   ...(['ask','manual'].includes(clubMode245(m))?[{label:'Участвовать в следующем месяце',disabled:m.status!=='active'||(m.approvedThrough245??-1)>s.clock.ticks,fn:()=>{clubApprove245(id);clubProgramMenu245(id);}}]:[]),
   {label:'Настройки участия',fn:()=>clubSettings245(id)}
  ],{title:clubsCatalog19[m.type].name,open:()=>clubDetail19(id)});
 };
}

// 4. Своё дело «Кинотеатр» — ниже, в разделе 8.

// 5. Увлечение «Кино»: сколько посмотрено и любимый фильм.
if(typeof practiceDetails250==='function'){
 const practiceDetailsBase269=practiceDetails250;
 practiceDetails250=function(key,...args){
  const base=practiceDetailsBase269.call(this,key,...args);
  if(key!=='film')return base;
  return [base,filmStats269()].filter(Boolean).join('\n');
 };
}

// 6. Выбор фильма. Везде, где есть «Сходить в кино», «Свидание в кино» и «Семейный поход в кино», сначала открывается
// афиша; выбранный фильм цепляется к встрече через task16 (или к детской просьбе) и называется в записи.
function hash269(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619);return h>>>0;}
function poster269(o={}){
 const now=filmsNow269(3,o).slice(0,7);
 if(now.length>=4)return now.map(f=>({f,rerun:false}));
 const ym=filmNow269(),classics=filmsAvailable269({...o,top:!o.children}).filter(f=>!now.includes(f))
  .sort((a,b)=>hash269((o.seed||'')+ym+a.id)-hash269((o.seed||'')+ym+b.id)).slice(0,4-now.length);
 return [...now.map(f=>({f,rerun:false})),...classics.map(f=>({f,rerun:true}))];
}
function filmPicker269(o,done){
 const list=poster269({age:o.age??s.age,children:o.children});
 window.__filmPicking269=true;
 try{
  show(o.title||'Что смотрим?','Афиша на этот месяц. Можно выбрать заранее или решить уже у кассы.',[
   ...list.map(({f,rerun})=>({label:'«'+f.title+'» ('+f.year+')',hint:[f.genre,f.minAge+'+',rerun?'повторный показ':'премьера'].join(' · ')+'. '+f.summary,fn:()=>done(f)})),
   {label:'Решить у кассы',hint:'Фильм выберете на месте',fn:()=>done(null)}
  ]);
 }finally{window.__filmPicking269=false;}
}
const cinemaOptions269={'Сходить в кино':'any','Свидание в кино':'any','Семейный поход в кино':'family'};
function filmHobbyStart269(f){
 if(!canPay23(c().cost*.002))return toast('На это занятие пока не хватает денег.');
 if(s.clock.tasks.some(t=>t.kind==='hobby'))return toast('Одно занятие уже запланировано.');
 if(typeof startTask05!=='function'&&!spend231(c().cost*.002,'everyday'))return;
 const label=f?'Кино · «'+f.title+'»':'Сходить в кино';
 s.clock.tasks.push({startCostRatio:typeof startTask05==='function'?.002:0,id:'hobby-'+s.clock.ticks,kind:'hobby',hobby:'film',label,duration:1,progress:0,hours:2,film269:f?.id||null});
 log('План на свободный вечер',label+'.','Хобби');save();render();
}
const showBase269=show;
show=function(title,text,opts=[],...rest){
 if(s&&!s.dead&&Array.isArray(opts)&&!window.__filmPicking269){
  opts=opts.map(o=>{
   const kind=cinemaOptions269[o?.label];
   if(!kind||o.disabled||o.film269||typeof o.fn!=='function')return o;
   return {...o,film269:true,fn:()=>filmPicker269({title:o.label,children:kind==='family'&&s.age<12},f=>{
    window.__filmChoice269=f?.id||null;
    try{o.fn();}finally{window.__filmChoice269=null;}
   })};
  });
  if(title===hobbies.film?.[0]&&opts.some(o=>o?.label===hobbies.film[1])&&!opts.some(o=>o?.film269))
   opts=[...opts,{label:'Сходить в кино',film269:true,hint:'Фильм по выбору · 2 ч/нед. · '+money(c().cost*.002),fn:()=>filmPicker269({title:'Кино'},filmHobbyStart269)}];
 }
 return showBase269.call(this,title,text,opts,...rest);
};
if(typeof task16==='function'){
 const task16Base269=task16;
 task16=function(...args){
  const before=s?.clock?.tasks?.length??0,out=task16Base269.apply(this,args);
  if(window.__filmChoice269&&s.clock.tasks.length>before)s.clock.tasks.at(-1).film269=window.__filmChoice269;
  return out;
 };
}

// 7. Приглашение в кинопроект — конкретный проект: название и сюжет из редактора проектов. Короткий метр — короткие
// сюжеты, дальше полнометражные; сюжеты берутся с конца того же списка, из которого идут будущие премьеры, и не повторяются.
function projectStory269(format){
 const x=films269();x.projects??=[];
 const rows=storyEntries189.filter(r=>r[1]==='film'&&r[3]===format&&!x.projects.includes(r[0]));
 let pool=rows;
 if(format==='full'&&filmStories269.length){
  const plan=futureOrder269(),L=filmStories269.length,ahead=Math.min(L,futureSlot269(filmNow269()+60)),used=new Set();
  for(let n=0;n<ahead;n++)used.add(filmStories269[plan.order[n%L]][0]);
  pool=rows.filter(r=>!used.has(r[0]));
  if(!pool.length)pool=rows;
 }
 const row=pick(pool);if(!row)return null;
 x.projects.push(row[0]);if(x.projects.length>300)x.projects.shift();
 return {id:row[0],title:pick(storyTitles269(row)),synopsis:row[4]};
}
if(typeof cinemaInvitation191==='function'){
 const cinemaInvitationBase269=cinemaInvitation191;
 cinemaInvitation191=function(work,...args){
  if(!s||typeof creative47!=='function')return cinemaInvitationBase269.call(this,work,...args);
  const x=creative47(),before=new Set(x.applications.map(a=>a.id));
  const {out,added}=newEntries269(()=>cinemaInvitationBase269.call(this,work,...args));
  const a=x.applications.find(a=>!before.has(a.id)&&a.offer.sourceWork191===work.id);
  if(a){
   const o=a.offer,role=specialties184.cinema[o.specialty184]||'',scale=o.title.split(' · ').slice(1).join(' · ');
   const story=projectStory269((o.level184||1)<=2?'short':'full');
   if(story){
    o.project269=story;
    o.title=story.title+' · '+(scale||role);
    const entry=added.find(e=>e.title==='Приглашение в новый проект');
    if(entry)entry.text=`После работы «${work.title}» вам предлагают проект «${story.title}» — ${lowerFirst269(scale.replace(' · ',', '))}, за вами — ${lowerFirst269(role)}. ${story.synopsis} Ответить можно в разделе «Портфолио и заказы».`;
   }
  }
  return out;
 };
}
function lowerFirst269(text){return text?text[0].toLowerCase()+text.slice(1):'';}
if(typeof offerMenu47==='function'){
 const offerMenuBase269=offerMenu47;
 offerMenu47=function(id,application=false,...args){
  const x=creative47(),o=(application?x.applications.find(a=>a.id===id)?.offer:null)||x.offers.find(o=>o.id===id);
  if(!o?.project269)return offerMenuBase269.call(this,id,application,...args);
  const showBase=show,role=specialties184.cinema[o.specialty184];
  show=function(title,text,...rest){
   show=showBase;
   // Карточка предложения собирается из разделов (nextDetail20), текст окна в ней не виден.
   if(typeof nextDetail20!=='undefined'&&nextDetail20?.sections&&typeof section20==='function')
    nextDetail20.sections.unshift(section20('Проект',[fact20('Название',o.project269.title),fact20('Сюжет',o.project269.synopsis),...(role?[fact20('За вами',role)]:[])]));
   return showBase.call(this,title,`«${o.project269.title}». ${o.project269.synopsis}\n`+text,...rest);
  };
  try{return offerMenuBase269.call(this,id,application,...args);}finally{show=showBase;}
 };
}

// 8. Своё дело «Кинотеатр»: репертуар, сеансы и отчёт по фильмам.
// У каждого фильма своя тяга зрителя (зависит от фильма и самого кинотеатра, премьера собирает больше, повторный
// показ — меньше). Зал фильма вмещает до 1.2 его средней тяги на своих сеансах. Сеансы поровну — спрос кинотеатра
// ровно такой, как без этой системы (множитель 1); перекладывать сеансы с провалов на хиты — до +15%, наоборот — до −15%.
// Отчёт приходит раз в три месяца (можно раз в полгода или выключить — тогда сеансы делятся поровну).
const CINEMA_SESSIONS269=42;
function cinemaBusiness269(b){return !!b&&typeof businessName265==='function'&&/Кинотеатр/.test(businessName265(b));}
function cinemaState269(b){return b.cinema269??={every:3,next:s.clock.ticks+3,weights:{},period:{},months:0};}
function cinemaRepertoire269(b){
 return poster269({country:b.country,age:18,seed:b.id}).slice(0,5).map(({f,rerun})=>{
  const age=Math.max(0,filmNow269()-filmDate269(f)),base=.45+(hash269(b.id+f.id)%1000)/1000*1.3;
  return {f,rerun,appeal:base*(rerun?.7:[1.15,1,.8][Math.min(2,age)])};
 });
}
function cinemaPlan269(b){
 const st=cinemaState269(b),rep=cinemaRepertoire269(b);
 if(!rep.length)return {rep,mult:1};
 const w=rep.map(r=>st.every?st.weights[r.f.id]??1:1),mean=w.reduce((a,x)=>a+x,0)/w.length;
 rep.forEach((r,i)=>{r.share=w[i]/mean;r.sessions=Math.max(1,Math.round(CINEMA_SESSIONS269*w[i]/(mean*rep.length)));r.att=Math.min(r.appeal,1.2*r.share);r.fill=Math.min(1,r.appeal/(1.2*r.share));});
 const even=rep.reduce((a,r)=>a+Math.min(r.appeal,1.2),0),got=rep.reduce((a,r)=>a+r.att,0);
 return {rep,mult:even>0?Math.max(.85,Math.min(1.15,got/even)):1};
}
if(typeof enterpriseLocationMonth168==='function'){
 const cinemaMonthBase269=enterpriseLocationMonth168;
 enterpriseLocationMonth168=function(b,...args){
  if(!cinemaBusiness269(b)||b.status!=='active')return cinemaMonthBase269.call(this,b,...args);
  const plan=cinemaPlan269(b),tick=s.clock.ticks,before=b.last;
  (b.cases254??={}).modifiers??=[];
  b.cases254.modifiers=b.cases254.modifiers.filter(m=>m.case!=='cinema269');
  if(plan.mult!==1)b.cases254.modifiers.push({case:'cinema269',until:tick,demand:plan.mult});
  const out=cinemaMonthBase269.call(this,b,...args);
  const h=b.history?.at(-1);
  if(b.last===before||!h||h.tick!==tick||!plan.rep.length)return out;
  const st=cinemaState269(b),att=plan.rep.reduce((a,r)=>a+r.att,0)||1,share=plan.rep.reduce((a,r)=>a+r.share,0)||1;
  for(const r of plan.rep){
   const p=st.period[r.f.id]??={title:r.f.title,year:r.f.year,rerun:r.rerun,revenue:0,cost:0,sessions:0,fill:0,months:0};
   p.revenue+=(h.sales||0)*r.att/att;p.cost+=(h.costs||0)*r.share/share;p.sessions=r.sessions;p.fill+=r.fill;p.months++;
  }
  st.months++;
  if(st.every&&tick>=st.next&&!s.pending.some(q=>q.businessId===b.id)){st.next=tick+st.every;s.pending.push({type:'cinemaReport269',businessId:b.id});}
  return out;
 };
}
function cinemaReportText269(b){
 const st=cinemaState269(b),rows=Object.values(st.period).filter(p=>p.months).sort((x,y)=>(y.revenue-y.cost)-(x.revenue-x.cost));
 if(!rows.length)return 'Отчёт появится после первого месяца работы.';
 return rows.map(p=>{const profit=Math.round(p.revenue-p.cost);
  return `«${p.title}»${p.rerun?' (повторный показ)':''}: ${p.sessions} сеансов в неделю, зал заполнен на ${Math.round(100*p.fill/p.months*.9)}%, `+(profit>=0?'прибыль '+money(profit):'убыток '+money(-profit))+'.';}).join('\n');
}
function cinemaMenu269(id,report=false){
 const b=ownedEnterprises168().find(b=>b.id===id&&b.status==='active');
 const close=()=>{if(report){s.pending.shift();save();render();if(s.pending.length)resolvePending();}else{save();enterpriseMenu152();}};
 if(!b){if(report){s.pending.shift();if(s.pending.length)resolvePending();}return;}
 const st=cinemaState269(b),plan=cinemaPlan269(b),rep=plan.rep;
 const months=Math.max(1,st.months),text=(report?`Отчёт за ${months} мес.\n`:'')+cinemaReportText269(b)+
  '\n\nСейчас в прокате: '+rep.map(r=>'«'+r.f.title+'» — '+r.sessions+' сеансов в неделю').join(', ')+'.';
 const ranked=[...rep].sort((x,y)=>y.appeal/y.share-x.appeal/x.share),best=ranked[0],worst=ranked.at(-1);
 const reset=()=>{st.period={};st.months=0;};
 show(report?'Кинотеатр · отчёт по фильмам':'Репертуар и сеансы',text,[
  ...(st.every&&best&&worst&&best!==worst?[{label:'Добавить сеансов «'+best.f.title+'»',hint:'Сеансы снимаются с «'+worst.f.title+'»',fn:()=>{
   st.weights[best.f.id]=Math.min(3,(st.weights[best.f.id]??1)*1.5);st.weights[worst.f.id]=Math.max(.34,(st.weights[worst.f.id]??1)/1.5);
   log('Сеансы перераспределены',b.title+' · больше сеансов у «'+best.f.title+'», меньше у «'+worst.f.title+'».','Своё дело');reset();close();}}]:[]),
  ...(Object.values(st.weights).some(w=>w!==1)?[{label:'Сеансы поровну между фильмами',fn:()=>{st.weights={};reset();close();}}]:[]),
  {label:(st.every===3?'✓ ':'')+'Отчёт раз в три месяца',fn:()=>{st.every=3;st.next=s.clock.ticks+3;reset();close();}},
  {label:(st.every===6?'✓ ':'')+'Отчёт раз в полгода',fn:()=>{st.every=6;st.next=s.clock.ticks+6;reset();close();}},
  {label:(!st.every?'✓ ':'')+'Без отчётов',hint:'Сеансы делятся поровну, кинотеатр работает сам',fn:()=>{st.every=0;st.weights={};reset();close();}},
  {label:report?'Оставить как есть':'Назад',fn:()=>{if(report)reset();close();}}
 ]);
}
if(typeof resolvePending==='function'){
 const resolvePendingBase269=resolvePending;
 resolvePending=function(...args){
  const q=s?.pending?.[0];
  if(q?.type==='cinemaReport269')return cinemaMenu269(q.businessId,true);
  return resolvePendingBase269.apply(this,args);
 };
}
if(typeof enterpriseMenu152==='function'){
 const enterpriseMenuBase269=enterpriseMenu152;
 enterpriseMenu152=function(...args){
  const b=s?.enterprise152;
  if(b?.status!=='active'||!cinemaBusiness269(b))return enterpriseMenuBase269.apply(this,args);
  const rep=cinemaPlan269(b).rep,line=rep.length?' В прокате: '+rep.map(r=>'«'+r.f.title+'»').join(', ')+'.':'';
  const showBase=show;
  show=function(title,text,opts=[],...rest){show=showBase;return showBase.call(this,title,text+line,[...opts,{label:'Репертуар и сеансы',hint:'Какие фильмы приносят деньги, какие нет',fn:()=>cinemaMenu269(b.id)}],...rest);};
  try{return enterpriseMenuBase269.apply(this,args);}finally{show=showBase;}
 };
}
