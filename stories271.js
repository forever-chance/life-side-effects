'use strict';
// Сборка 271: новые сюжеты книг и фильмов (stories271-data.js, собирает tools/stories271_build.py).
// 1. Редактор проектов («Новая рукопись», «Новый фильм»): книги берутся из сюжетов книг, фильмы — из сюжетов фильмов,
//    по жанру и формату, как раньше. У каждого сюжета 15 названий в трёх тонах: игрок выбирает тон
//    (Серьёзно / С иронией / Абсурд) и видит его пять названий. «Похожие сюжеты» — до трёх сюжетов того же вида
//    и жанра, у которых с текущим не меньше двух общих тем.
// 2. Вымышленные премьеры кино (с 2028 года, films269.js) и приглашения в кинопроекты идут из сюжетов фильмов.
//    id новой премьеры — «H<месяц>-<номер>-<сюжет>-<название>»: название и сюжет записаны в самом id, поэтому
//    просмотренный, любимый или клубный фильм находится всегда, даже если пул сюжетов потом вырастет.
// 3. Старые сохранения. Премьеры G<месяц>-<номер> (269–270) собирает прежний генератор из catalog-data189.js — с теми же
//    названиями, сюжетами и режиссёрами. Сохранению, где фильмы уже были (s.films269), новые премьеры начинаются
//    со следующего месяца после первого открытия в 271: всё, что игрок уже видел в прокате и записал, остаётся как было.
//    Старый пул storyEntries189 остаётся загруженным: проекты и приглашения со старыми сюжетами хранят название
//    и сюжет у себя, а storyLookup271 находит и старые номера (FILM-0001, BOOK-0001).

const storyTones271=[['serious','Серьёзно'],['ironic','С иронией'],['absurd','Абсурд']];
const stories271=(typeof storyPool271!=='undefined'?storyPool271:[]).map(r=>({id:r[0],type:r[1],genre:r[2],format:r[3],synopsis:r[4],
 keywords:r[5],titles:{serious:r[6],ironic:r[7],absurd:r[8]},retired:r[9]===1}));
const storyById271=new Map(stories271.map(x=>[x.id,x]));
const storyGroups271=new Map();
for(const x of stories271)if(!x.retired){const k=[x.type,x.genre,x.format].join('|');if(!storyGroups271.has(k))storyGroups271.set(k,[]);storyGroups271.get(k).push(x);}
function storyTitleList271(x){return x?[...x.titles.serious,...x.titles.ironic,...x.titles.absurd]:[];}
function storyFirstSentence271(text){return String(text||'').split(/(?<=[.!?…])\s+(?=[«А-ЯЁA-Z0-9—])/)[0];}
let storyLegacy271=null;
function storyLookup271(id){
 if(storyById271.has(id))return storyById271.get(id);
 if(typeof storyEntries189==='undefined')return null;
 storyLegacy271??=new Map(storyEntries189.map(r=>[r[0],r]));
 const r=storyLegacy271.get(id);
 return r?{id:r[0],type:r[1],genre:r[2],format:r[3],synopsis:r[4],keywords:[],titles:{serious:r[5],ironic:[],absurd:[]},legacy:true}:null;
}
// Похожие сюжеты: тот же вид и жанр, не меньше двух общих тем; сначала больше общих тем, потом тот же формат.
function storySimilar271(x,limit=3){
 if(!x||x.legacy)return [];
 const kw=new Set(x.keywords),h=y=>typeof hash269==='function'?hash269(x.id+y.id):0;
 return stories271.filter(y=>!y.retired&&y!==x&&y.type===x.type&&y.genre===x.genre)
  .map(y=>({y,shared:y.keywords.filter(k=>kw.has(k))})).filter(o=>o.shared.length>=2)
  .sort((a,b)=>b.shared.length-a.shared.length||(b.y.format===x.format)-(a.y.format===x.format)||h(a.y)-h(b.y))
  .slice(0,limit);
}

// ---------- 1. Редактор проектов ----------
const storyFormatNames271={book:{short:'короткая проза',full:'полная проза'},film:{short:'короткий метр',full:'полный метр'}};
function storyGenres271(type){
 const base=[...Object.keys(bookGenre189),...(type==='book'?['Нон-фикшен']:[])];
 // Жанр, который появится только в данных, попадает в список сам (у книг — если такой жанр есть у рукописей).
 for(const x of stories271)if(!x.retired&&x.type===type&&!base.includes(x.genre)&&(type!=='book'||genres27.includes(bookGenre189[x.genre]||x.genre)))base.push(x.genre);
 return base;
}
function storyGroup271(type,genre,format){
 const own=storyGroups271.get([type,genre,format].join('|'));
 if(own?.length)return own;
 return (fallbackGenres189[genre]||[]).flatMap(g=>storyGroups271.get([type,g,format].join('|'))||[]);
}
let storyDraft271=null;
function storyToneSaved271(){const t=s?.storyTone271;return storyTones271.some(([k])=>k===t)?t:'serious';}
function storyForm271(type,key=null){
 storyDraft271={type,key,seen:new Set(),generated:'',entry:null,tone:storyToneSaved271(),title:'',synopsis:'',genre:'',format:'',scale:0};
 show(type==='book'?'Новая рукопись':'Новый фильм','',[{
  label:'Начать проект',fn:()=>{
   readStory271();
   const d=storyDraft271,{title,synopsis,genre,format,scale}=d;
   const story189={id:d.usedId||d.titleId||null,title,synopsis,genre,format};
   if(type==='book'){
    const p=createBook27(title,bookGenre189[genre]||genre,scale,story189);
    if(p)bookMenu27(p.id);else toast('Не удалось начать рукопись. Проверьте возраст и число активных проектов.');
   }else if(!sampleWork47('cinema',key,story189))toast('Не удалось начать съёмку. Проверьте возраст и число активных проектов.');
  }},{label:'Закрыть',fn:()=>{}}]);
 const genres=storyGenres271(type).map(g=>'<option>'+esc(g)+'</option>').join('');
 const tones=storyTones271.map(([k,label])=>`<button type="button" data-tone="${k}" aria-pressed="${k===storyDraft271.tone}" onclick="storyToneSet271('${k}')">${label}</button>`).join('');
 petInsert38(`<div class="story-form189 story-form271" oninput="readStory271()">
  <label class="field">Жанр<select id="storyGenre271" onchange="refreshStory271()">${genres}</select></label>
  <label class="field">Формат<select id="storyFormat271" onchange="refreshStory271()">${type==='book'?
   '<option value="6">Короткая проза · 6 мес.</option><option value="12">Полная проза · 12 мес.</option><option value="24">Полная проза · 24 мес.</option>':
   '<option value="short">Короткометражный фильм</option><option value="full">Полнометражный фильм</option>'}</select></label>
  <label class="field">Краткое содержание<textarea id="storySummary271" rows="4"></textarea></label>
  <button type="button" id="storyPlot271" onclick="suggestStory271(false)">Предложить сюжет</button>
  <label class="field">Название<input id="storyTitle271" maxlength="80"></label>
  <div class="field">Тон названия<div class="story-tones271" role="group" aria-label="Тон названия">${tones}</div></div>
  <div id="storyTitles271" class="story-chips271" aria-live="polite"></div>
  <button type="button" title="Предложить название" onclick="suggestStory271(true)">↻ Предложить название</button>
  <p id="storyNote271" class="story-note271" aria-live="polite"></p>
  <div id="storySimilar271" class="story-similar271"></div></div>`);
 readStory271();
}
function readStory271(){
 const d=storyDraft271,f=$('#storyFormat271');
 if(!d||!f)return;
 const raw=f.value;
 Object.assign(d,{title:$('#storyTitle271').value.trim(),synopsis:$('#storySummary271').value,genre:$('#storyGenre271').value,
  scale:Number(raw),format:raw==='6'||raw==='short'?'short':'full'});
}
function storyNote271(text){const p=$('#storyNote271');if(p)p.textContent=text;}
function storyMatches271(x){
 const d=storyDraft271;
 return !!x&&x.type===d.type&&x.format===d.format&&(x.genre===d.genre||(fallbackGenres189[d.genre]||[]).includes(x.genre)&&!storyGroups271.get([d.type,d.genre,d.format].join('|'))?.length);
}
function refreshStory271(){
 readStory271();
 const d=storyDraft271;
 storyNote271(d.entry&&!storyMatches271(d.entry)?'Можно подобрать сюжет под новые параметры.':'');
}
function storyFresh271(pool){
 const d=storyDraft271;
 let fresh=pool.filter(x=>!d.seen.has(x.id)&&x!==d.entry);
 if(!fresh.length){for(const x of pool)d.seen.delete(x.id);fresh=pool.filter(x=>x!==d.entry);}
 const x=pick(fresh.length?fresh:pool);
 d.seen.add(x.id);
 return x;
}
// Название подставляется само, если поле пустое или в нём название из предыдущей подсказки.
function storyUse271(x,synopsis){
 const d=storyDraft271,auto=!d.title||storyTitleList271(d.entry).includes(d.title);
 d.entry=x;
 if(synopsis){$('#storySummary271').value=d.generated=x.synopsis;d.usedId=x.id;$('#storyPlot271').textContent='Другой сюжет';}
 if(auto){$('#storyTitle271').value=pick(x.titles[d.tone]);d.titleId=x.id;}
 readStory271();
 storyNote271('');
 renderStoryTitles271();
 renderStorySimilar271();
}
function suggestStory271(titleOnly){
 readStory271();
 const d=storyDraft271;
 if(titleOnly&&storyMatches271(d.entry)){
  const list=d.entry.titles[d.tone],i=list.indexOf(d.title);
  $('#storyTitle271').value=list[(i+1)%list.length];d.titleId=d.entry.id;
  readStory271();renderStoryTitles271();
  return;
 }
 const pool=storyGroup271(d.type,d.genre,d.format);
 if(!pool.length){storyNote271('Для этих параметров пока нет заготовок.');return;}
 if(!titleOnly&&d.synopsis.trim()&&d.synopsis!==d.generated&&!window.confirm('Заменить введённое краткое содержание?'))return;
 const x=storyFresh271(pool);
 if(titleOnly){d.title='';storyUse271(x,false);}else storyUse271(x,true);
}
function storyToneSet271(tone){
 const d=storyDraft271;if(!d)return;
 readStory271();
 const before=d.entry?d.entry.titles[d.tone].indexOf(d.title):-1;
 d.tone=tone;if(s)s.storyTone271=tone;
 // Название из подсказки меняется на название того же сюжета в новом тоне.
 if(before>=0){$('#storyTitle271').value=d.entry.titles[tone][before];readStory271();}
 renderStoryTitles271();
}
function storyTitlePick271(i){
 const d=storyDraft271;if(!d?.entry)return;
 $('#storyTitle271').value=d.entry.titles[d.tone][i];
 d.titleId=d.entry.id;
 readStory271();renderStoryTitles271();
}
function storySimilarUse271(id){
 readStory271();
 const d=storyDraft271,x=storyById271.get(id);
 if(!x)return;
 if(d.synopsis.trim()&&d.synopsis!==d.generated&&!window.confirm('Заменить введённое краткое содержание?'))return;
 if(x.format!==d.format)$('#storyFormat271').value=d.type==='book'?(x.format==='short'?'6':'12'):x.format;
 d.seen.add(x.id);
 readStory271();
 storyUse271(x,true);
}
function renderStoryTitles271(){
 const d=storyDraft271,box=$('#storyTitles271');
 if(!box)return;
 document.querySelectorAll('.story-tones271 button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.tone===d.tone)));
 box.innerHTML=d.entry?d.entry.titles[d.tone].map((t,i)=>`<button type="button" aria-pressed="${t===d.title}" onclick="storyTitlePick271(${i})">${esc(t)}</button>`).join(''):'';
}
function renderStorySimilar271(){
 const d=storyDraft271,box=$('#storySimilar271');
 if(!box)return;
 const x=d.entry&&d.usedId===d.entry.id?d.entry:null,list=x?storySimilar271(x):[];
 box.innerHTML=list.length?'<h3>Похожие сюжеты</h3>'+list.map(({y,shared})=>`<button type="button" onclick="storySimilarUse271('${y.id}')">${esc(storyFirstSentence271(y.synopsis))}`+
  `<small>Общие темы: ${esc(shared.join(', '))}${y.format!==x.format?' · '+storyFormatNames271[y.type][y.format]:''}</small></button>`).join(''):'';
}
if(typeof storyForm189==='function'&&typeof bookGenre189!=='undefined'){
 storyForm189=storyForm271;
 // Старые обработчики (окна, открытые до обновления, их уже нет) ведут в новый редактор.
 suggestStory189=(type,titleOnly)=>storyDraft271?suggestStory271(titleOnly):storyForm271(type);
}
{
 const st=document.createElement('style');
 st.textContent='.story-form271>button{margin-block:.15rem}'+
  '.story-tones271,.story-chips271{display:flex;flex-wrap:wrap;align-items:center;gap:.35rem;margin-block:.3rem}'+
  '.story-tones271 button,.story-chips271 button{padding:6px 12px;line-height:1.35;font-size:14px}'+
  '.story-tones271{margin-block:0;gap:.3rem}.story-tones271 button{padding-inline:7px;white-space:nowrap;font-size:13px}'+
  '.story-form271 button[aria-pressed="true"],.story-form271 button[aria-pressed="true"]:hover{background:var(--accent);border-color:var(--accent);color:var(--on-dark)}'+
  '.story-note271:empty{display:none}.story-note271{margin:.4rem 0}'+
  '.story-similar271 h3{font:inherit;font-size:12px;margin:1rem 0 .4rem}'+
  '.story-similar271 button{display:block;width:100%;margin-block:.35rem;line-height:1.45}'+
  '.story-similar271 small{display:block;color:var(--muted);font-size:11px;margin-top:.2rem}';
 document.head.appendChild(st);
}

// ---------- 2. Будущие премьеры и приглашения в кинопроекты ----------
// Режиссёры премьер 269–270 собирались из пулов имён страны. Если names271 загружается после этого файла и меняет
// пулы, старые премьеры собираются на снимке прежних пулов — у уже виденного фильма остаётся тот же режиссёр.
const storyNames271=(()=>{
 if(typeof names271!=='undefined'||typeof countries!=='object')return null;
 const fns={identitySurname:typeof identitySurname==='function'?identitySurname:null,defaultParts256:typeof defaultParts256==='function'?defaultParts256:null,
  surnamePool256:typeof surnamePool256==='function'?surnamePool256:null,genderSurname256:typeof genderSurname256==='function'?genderSurname256:null,
  fullName256:typeof fullName256==='function'?fullName256:null};
 if(Object.values(fns).some(f=>!f))return null;
 const pools={};
 for(const [cc,c] of Object.entries(countries))if(Array.isArray(c?.names))pools[cc]={names:[c.names[0],c.names[1]],surnames:c.surnames,
  exp:typeof expansion95==='object'&&expansion95[cc]?expansion95[cc].surnames:undefined};
 return {pools,fns};
})();
function withOldNames271(fn){
 const L=storyNames271;
 if(!L)return fn();
 // Всё, что подменено, возвращается в finally — даже если подмена оборвалась на полпути.
 const keep=[],fnKeep={identitySurname,defaultParts256,surnamePool256,genderSurname256,fullName256};
 try{
  for(const [cc,p] of Object.entries(L.pools)){
   const c=countries[cc],r=typeof expansion95==='object'?expansion95[cc]:null;
   if(!Array.isArray(c?.names))continue;
   keep.push([c,r,[c.names[0],c.names[1]],c.surnames,r?r.surnames:undefined]);
   c.names[0]=p.names[0];c.names[1]=p.names[1];c.surnames=p.surnames;if(r&&p.exp!==undefined)r.surnames=p.exp;
  }
  ({identitySurname,defaultParts256,surnamePool256,genderSurname256,fullName256}=L.fns);
  return fn();
 }finally{
  for(const [c,r,names,surnames,exp] of keep){c.names[0]=names[0];c.names[1]=names[1];c.surnames=surnames;if(r&&exp!==undefined)r.surnames=exp;}
  ({identitySurname,defaultParts256,surnamePool256,genderSurname256,fullName256}=fnKeep);
 }
}
const filmPool271=stories271.filter(x=>x.type==='film'&&!x.retired).sort((a,b)=>a.id<b.id?-1:a.id>b.id?1:0);
// Тон названия премьеры: комедии чаще с иронией, экспериментальное кино чаще абсурдное, остальное — всерьёз.
const premiereTones271={Комедия:{ironic:.5,absurd:.25,serious:.25},Экспериментальный:{serious:.4,absurd:.35,ironic:.25}};
const premiereTonesDefault271={serious:.6,ironic:.3,absurd:.1};
let premiereCatalog271=null;
function premiereTitleFree271(t){
 premiereCatalog271??=new Set(filmCatalog269.map(f=>String(f.title).toLowerCase().replace(/ё/g,'е')));
 return !premiereCatalog271.has(String(t).toLowerCase().replace(/ё/g,'е'));
}
function premiereTone271(genre,r){
 const w=premiereTones271[genre]||premiereTonesDefault271;
 let t=r;for(const [tone,p] of Object.entries(w)){t-=p;if(t<0)return tone;}
 return 'serious';
}
// Номер названия (0–14: 5 серьёзных, 5 с иронией, 5 абсурдных) для cycle-го круга сюжета: на каждом круге — новое
// название, пока все 15 не будут использованы; названия из каталога фильмов пропускаются.
function premiereTitle271(story,cycle,seed){
 const rand=seeded269((seed^hash269(story.id))>>>0),tones=['serious','ironic','absurd'],start=hash269(seed+':'+story.id)%5,all=storyTitleList271(story);
 let used=new Set(),ti=0;
 for(let c=0;c<=cycle;c++){
  if(used.size>=15)used=new Set();
  const first=premiereTone271(story.genre,rand()),order=[first,...tones.filter(t=>t!==first)];
  ti=-1;
  for(const tone of order){
   const base=tones.indexOf(tone)*5;
   for(let j=0;j<5&&ti<0;j++){const i=base+(start+j)%5;if(!used.has(i)&&premiereTitleFree271(all[i]))ti=i;}
   if(ti>=0)break;
  }
  if(ti<0)ti=tones.indexOf(first)*5+start;
  used.add(ti);
 }
 return ti;
}
let premierePlan271=null;
function premiereOrder271(seed){
 if(premierePlan271?.seed===seed&&premierePlan271.size===filmPool271.length)return premierePlan271.order;
 const order=withSeed269((seed^0x27102710)>>>0,()=>{const a=filmPool271.map((_,i)=>i);for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;});
 premierePlan271={seed,size:filmPool271.length,order};
 return order;
}
const premiereById271=new Map();
function premiereFilm271(ym,k,story,ti){
 const seed=films269().seed,id='H'+ym+'-'+k+'-'+story.id+'-'+ti,key=seed+':'+id;
 if(premiereById271.has(key))return premiereById271.get(key);
 const f=withSeed269((seed^Math.imul(ym*4+k+1,2246822519)^0x271)>>>0,()=>{
  const codes=Object.keys(countries),code=Math.random()<.4?'us':pick(codes),gender=pick(['f','m']);
  const given=pick(countries[code].names[gender==='m'?1:0]);
  const director=typeof fullName256==='function'?fullName256(given,defaultParts256(code,gender),code):given;
  const genre=filmGenreFromStory269[story.genre]||(story.genre==='Нон-фикшен'?'Документальный':story.genre);
  return {id,title:storyTitleList271(story)[ti],director,year:Math.floor(ym/12),month:ym%12+1,origin:countries[code].name,genre,story:story.id,
   minAge:filmGenreAge269[genre]||12,country:'Любая',summary:storyFirstSentence271(story.synopsis),synopsis:story.synopsis,generated:true};
 });
 premiereById271.set(key,f);
 return f;
}
function premiere271(ym,k){
 const seed=films269().seed,L=filmPool271.length;
 if(!L)return null;
 const n=futureSlot269(ym,k),story=filmPool271[premiereOrder271(seed)[n%L]];
 return premiereFilm271(ym,k,story,premiereTitle271(story,Math.floor(n/L),seed));
}
// С какого месяца премьеры идут из новых сюжетов. Новая жизнь — с 2028 года. Сохранение 269–270, где фильмы уже были
// (s.films269 есть, а отметки нет), — со следующего месяца после первого обращения к кино в 271.
if(typeof films269==='function'){
 const films269Base271=films269;
 films269=function(...args){
  const had=!!s?.films269,x=films269Base271.apply(this,args);
  if(x.from271==null)x.from271=had&&s.clock?Math.max(FUTURE_FROM269,filmNow269()+1):FUTURE_FROM269;
  return x;
 };
}
if(typeof futureFilm269==='function'){
 const futureFilmBase271=futureFilm269;
 futureFilm269=function(...args){return withOldNames271(()=>futureFilmBase271.apply(this,args));};
}
if(typeof futureMonth269==='function'){
 const futureMonthBase271=futureMonth269;
 futureMonth269=function(ym){
  if(ym<FUTURE_FROM269||!filmPool271.length||ym<films269().from271)return futureMonthBase271(ym);
  const need=Math.max(0,2-(filmsByMonth269.get(ym)?.length||0));
  return Array.from({length:need},(_,k)=>premiere271(ym,k)).filter(Boolean);
 };
}
if(typeof filmById269==='function'){
 const filmByIdBase271=filmById269;
 filmById269=function(id){
  const m=/^H(\d+)-(\d+)-([A-Z]271-\d+)-(\d+)$/.exec(id||'');
  if(!m)return filmByIdBase271(id);
  const story=storyById271.get(m[3]),ti=Number(m[4]);
  return story&&ti<15?premiereFilm271(Number(m[1]),Number(m[2]),story,ti):null;
 };
}
// Приглашение в кинопроект: сюжет нужного формата, которого не было в приглашениях и нет среди премьер
// пяти лет до и после сегодняшнего месяца.
if(typeof projectStory269==='function'){
 const projectStoryBase271=projectStory269;
 projectStory269=function(format){
  const rows=filmPool271.filter(x=>x.format===format);
  if(!rows.length)return projectStoryBase271(format);
  const x=films269();x.projects??=[];
  const now=filmNow269(),near=new Set();
  for(let ym=Math.max(FUTURE_FROM269,x.from271,now-60);ym<=now+60;ym++)for(const f of futureMonth269(ym))if(f.story)near.add(f.story);
  const recent=new Set(x.projects.slice(-60));
  let pool=rows.filter(r=>!x.projects.includes(r.id)&&!near.has(r.id));
  if(!pool.length)pool=rows.filter(r=>!x.projects.includes(r.id));
  if(!pool.length)pool=rows.filter(r=>!recent.has(r.id));
  const row=pick(pool.length?pool:rows);
  x.projects.push(row.id);if(x.projects.length>300)x.projects.shift();
  const tone=premiereTone271(row.genre,Math.random()),list=row.titles[tone].filter(premiereTitleFree271);
  return {id:row.id,title:pick(list.length?list:row.titles[tone]),synopsis:row.synopsis};
 };
}
