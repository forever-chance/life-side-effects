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
function futureFilm269(ym,k){
 const key=films269().seed+':'+ym+':'+k;
 if(futureCache269.has(key))return futureCache269.get(key);
 if(!filmStories269.length)return null;
 const f=withSeed269(films269().seed^Math.imul(ym,2654435761)^k*97,()=>{
  const row=pick(filmStories269),codes=Object.keys(countries),code=Math.random()<.4?'us':pick(codes),gender=pick(['f','m']);
  const plain=row[5].filter(x=>!/[—:]/.test(x)),title=pick(plain.length?plain:row[5]);
  // Не name(): он помнит выданные имена и во второй раз дал бы другого режиссёра.
  const given=pick(countries[code].names[gender==='m'?1:0]);
  const director=typeof fullName256==='function'?fullName256(given,defaultParts256(code,gender),code):given;
  const genre=filmGenreFromStory269[row[2]]||'Драма';
  return {id:'G'+ym+'-'+k,title,director,year:Math.floor(ym/12),month:ym%12+1,origin:countries[code].name,genre,
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
  const text=hobbyFilmText269(t.label||'',s.hobbies?.film?.interest??70);
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
 if(entry){const f=filmInCinema269({age});if(f){filmSeen269(f,'cinema');entry.text+=' Смотрели '+filmLabel269(f)+'.';}}
 return out;
};

// 2. Семейный поход в кино по детской просьбе.
if(typeof askParent67==='function'){
 const askParentBase269=askParent67;
 askParent67=function(kind,...args){
  if(kind!=='outing'||!s)return askParentBase269.call(this,kind,...args);
  const {out,added}=newEntries269(()=>askParentBase269.call(this,kind,...args));
  const entry=out&&added.find(e=>/поход в кино/i.test(e.title));
  if(entry){const f=filmInCinema269({age:s.age,children:s.age<12});if(f){filmSeen269(f,'family',10);entry.text+=' Смотрели '+filmLabel269(f)+'.';}}
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

// 4. Своё дело «Кинотеатр»: репертуар в меню.
if(typeof enterpriseMenu152==='function'){
 const enterpriseMenuBase269=enterpriseMenu152;
 enterpriseMenu152=function(...args){
  const b=s?.enterprise152;
  if(b?.status!=='active'||typeof businessName265!=='function'||!/Кинотеатр/.test(businessName265(b)))return enterpriseMenuBase269.apply(this,args);
  const now=filmsNow269(3,{country:b.country,age:18}).slice(0,4);
  const line=now.length?' В прокате: '+now.map(f=>'«'+f.title+'»').join(', ')+'.':'';
  const showBase=show;
  show=function(title,text,...rest){show=showBase;return showBase.call(this,title,text+line,...rest);};
  try{return enterpriseMenuBase269.apply(this,args);}finally{show=showBase;}
 };
}

// 5. Увлечение «Кино»: сколько посмотрено и любимый фильм.
if(typeof practiceDetails250==='function'){
 const practiceDetailsBase269=practiceDetails250;
 practiceDetails250=function(key,...args){
  const base=practiceDetailsBase269.call(this,key,...args);
  if(key!=='film')return base;
  return [base,filmStats269()].filter(Boolean).join('\n');
 };
}
