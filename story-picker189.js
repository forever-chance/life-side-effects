'use strict';
const storyIndex189=new Map();
const bookGenre189={Драма:'Роман',Комедия:'Роман',Детектив:'Детектив',Триллер:'Детектив',Хоррор:'Хоррор','Научная фантастика':'Фантастика',Фэнтези:'Фэнтези',Романтика:'Роман',Исторический:'Роман',Криминальный:'Детектив',Приключения:'Роман',Экспериментальный:'Роман'};
for(const row of storyEntries189){
 const [,type,genre,format]=row,key=[type,genre,format].join('|');
 if(!storyIndex189.has(key))storyIndex189.set(key,[]);
 storyIndex189.get(key).push(row);
}
const fallbackGenres189={Исторический:['Драма'],Приключения:['Фэнтези','Драма']};
let storyDraft189;
function storyForm189(type,key=null){
 const genres=Object.keys(bookGenre189);
 storyDraft189={seen:new Set(),generated:'',entry:null};
 show(type==='book'?'Новая рукопись':'Новый фильм','',[{
  label:'Начать проект',fn:()=>{
   const {title,synopsis,genre,format,scale}=storyDraft189;
   const story189={id:storyDraft189.usedId||storyDraft189.titleId||null,title,synopsis,genre,format};
   if(type==='book'){
    const p=createBook27(title,bookGenre189[genre]||genre,scale,story189);
    if(p)bookMenu27(p.id);else toast('Не удалось начать рукопись. Проверьте возраст и число активных проектов.');
   }else if(!sampleWork47('cinema',key,story189))toast('Не удалось начать съёмку. Проверьте возраст и число активных проектов.');
  }},{label:'Закрыть',fn:()=>{}}]);
 const genreOptions=[...genres,...(type==='book'?['Нон-фикшен']:[])].map(g=>'<option>'+esc(g)+'</option>').join('');
 petInsert38(`<div class="story-form189" oninput="readStory189()">
  <label class="field">Жанр<select id="storyGenre189" onchange="refreshStory189()">${genreOptions}</select></label>
  <label class="field">Формат<select id="storyFormat189" onchange="refreshStory189()">${type==='book'?
   '<option value="6">Короткая проза · 6 мес.</option><option value="12">Полная проза · 12 мес.</option><option value="24">Полная проза · 24 мес.</option>':
   '<option value="short">Короткометражный фильм</option><option value="full">Полнометражный фильм</option>'}</select></label>
  <label class="field">Название<input id="storyTitle189" maxlength="80"></label>
  <button type="button" title="Предложить название" onclick="suggestStory189('${type}',true)">↻ Предложить название</button>
  <label class="field">Краткое содержание<textarea id="storySummary189" rows="4"></textarea></label>
  <button type="button" onclick="suggestStory189('${type}',false)">Предложить сюжет</button>
  <button type="button" onclick="suggestStory189('${type}',false)">Другой вариант</button>
  <div id="storyOptions189" aria-live="polite"></div></div>`);
 readStory189();
}
function readStory189(){
 const raw=$('#storyFormat189').value;
 Object.assign(storyDraft189,{title:$('#storyTitle189').value.trim(),synopsis:$('#storySummary189').value,
  genre:$('#storyGenre189').value,scale:Number(raw),format:raw==='6'||raw==='short'?'short':'full'});
}
function refreshStory189(){
 readStory189();
 $('#storyOptions189').textContent='Можно подобрать сюжет под новые параметры.';
}
function suggestStory189(type,titleOnly){
 readStory189();
 const d=storyDraft189,key=[type,d.genre,d.format].join('|');
 if(!titleOnly||!d.entry||d.entry.slice(1,4).join('|')!==key){
  const pool=storyIndex189.get(key)||(fallbackGenres189[d.genre]||[]).flatMap(genre=>storyIndex189.get([type,genre,d.format].join('|'))||[]);
  if(!pool.length){$('#storyOptions189').textContent='Для этих параметров пока нет заготовок.';return;}
  if(!titleOnly&&d.synopsis.trim()&&d.synopsis!==d.generated&&!window.confirm('Заменить введённое краткое содержание?'))return;
  const fresh=pool.filter(row=>!d.seen.has(row[0])&&(titleOnly||row[4]!==d.generated));
  if(!fresh.length)for(const row of pool)d.seen.delete(row[0]);
  d.entry=pick(fresh.length?fresh:pool);
  d.seen.add(d.entry[0]);
 }
 if(!titleOnly){$('#storySummary189').value=d.generated=d.entry[4];d.usedId=d.entry[0];}
 $('#storyOptions189').innerHTML=d.entry[5].map((title,i)=>`<button type="button" onclick="selectStoryTitle189(${i})">${esc(title)}</button>`).join('');
 readStory189();
}
function selectStoryTitle189(i){
 $('#storyTitle189').value=storyDraft189.entry[5][i];
 storyDraft189.titleId=storyDraft189.entry[0];
 readStory189();
}
newBookMenu27=()=>storyForm189('book');
