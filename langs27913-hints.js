'use strict';
// Сборка 279.1.3: подсказки о местных языках Испании (langs27913.js) во вкладке «Языки» и в окнах. Подключается после
// study2733.js и windows273.js — их функции здесь обёрнуты.
// • Сверху «Языков» — «Местный язык · Барселона», если другой подсказки нет (нужного для учёбы или работы, языка страны,
//   идущих занятий): тому, кто живёт в городе местного языка, если он не родной и не C2. Не «Язык страны»: для работы и
//   учёбы хватает испанского — так и написано на карточке.
// • Вне городов местного языка кнопки курса, практики и клуба — серые, с причиной («курсы — только в городах Барселона и
//   Валенсия»); в окне программы, где местный язык нужен, вместо кнопки курса — то же объяснение (и в «Нужен язык», и в
//   «Все условия»: кнопки «Изучать язык · Каталанский» там нет — «Языки» вне этих городов карточку не показывают).
//   Курс, вставший на паузу после переезда, — «курс на паузе — учат только в городах …».

function localTip27913(){
 if(typeof s==='undefined'||!s||typeof cityLanguage27913!=='function')return null;
 const city=homeCity27913(),l=cityLanguage27913(s.country,city),x=path16();
 if(!l||!lang16[l]||(x.native||[]).includes(l)||level16(l)>=6)return null;
 return {l,need:level16(l)+1,why:city,eyebrow:'Местный язык',local27913:true};
}
function localPanel27913(html){
 if(typeof document==='undefined')return html;
 const box=document.createElement('div');box.innerHTML=html;
 const card=[...box.querySelectorAll('.need2733')].find(c=>/^Местный язык/.test(c.querySelector('.eyebrow')?.textContent||''));
 const tip=card&&localTip27913();
 if(!tip)return html;
 // Строка уровня — как у языка страны: следующий уровень и сколько к нему готово (не «Нужно … — у вас …»).
 const have=Number(path16().languages[tip.l])||0,line=card.querySelector('.target2733');
 if(line)line.textContent='Следующий уровень — '+cefr16[Math.min(6,tip.need)]+': готово '+Math.round((have%1)*100)+'%';
 const home=country16[s.country]?.[0],note=document.createElement('p');
 note.className='sub';note.textContent='Для работы и учёбы хватает '+langGenitive27913(home)+'.';
 (card.querySelector('.called27913')||line||card.querySelector('h3'))?.after(note);
 return box.innerHTML;
}

const hints27913={langTop2733:typeof langTop2733==='function'?langTop2733:null,languagesPanel2733:typeof languagesPanel2733==='function'?languagesPanel2733:null,
 lessonHint2733:typeof lessonHint2733==='function'?lessonHint2733:null,clubWhy2733:typeof clubWhy2733==='function'?clubWhy2733:null,
 langNeed273:typeof langNeed273==='function'?langNeed273:null,programDetailData20:typeof programDetailData20==='function'?programDetailData20:null};

if(typeof isLocal27913==='function'){
 if(hints27913.langTop2733)langTop2733=function(...args){
  const top=hints27913.langTop2733.apply(this,args);
  if(top)return top;
  try{return localTip27913();}catch(e){console.error(e);return top;}
 };
 if(hints27913.languagesPanel2733)languagesPanel2733=function(html,...rest){
  const out=hints27913.languagesPanel2733.call(this,html,...rest);
  try{return localPanel27913(out);}catch(e){console.error(e);return out;}
 };
 if(hints27913.lessonHint2733)lessonHint2733=function(l,mode,...rest){
  const h=hints27913.lessonHint2733.call(this,l,mode,...rest);
  try{
   if(isLocal27913(l)&&h&&!here27913(l)){
    const t=s.clock.tasks.find(t=>t.kind==='pathLanguage'&&t.language===l&&!['completed','cancelled'].includes(t.state));
    if(t)return {hint:(/· практика$/.test(t.label)?'практика':'курс')+' на паузе — учат только '+citiesText27913(l),disabled:true};
    if(!h.disabled)return {hint:(mode==='practice'?'практика':'курсы')+' — только '+citiesText27913(l),disabled:true};
   }
  }catch(e){console.error(e);}
  return h;
 };
 if(hints27913.clubWhy2733)clubWhy2733=function(type,...rest){
  const why=hints27913.clubWhy2733.call(this,type,...rest);
  if(why)return why;
  try{const l=clubsCatalog19[type]?.language53;if(l&&isLocal27913(l)&&!here27913(l))return 'только '+citiesText27913(l);}catch(e){console.error(e);}
  return why;
 };
 // 279.1.3: окно программы на местном языке, если вы живёте не в его городе: кнопка «Изучать язык · …» вела в «Языки», где
 // карточки этого языка нет, — её нет; в «Все условия» вместо «Пройдите курс…» — где этот язык учат.
 if(hints27913.programDetailData20)programDetailData20=function(p,...rest){
  const d=hints27913.programDetailData20.call(this,p,...rest);
  try{
   const l=p?.language;
   if(d&&isLocal27913(l)&&!here27913(l)){
    const name='Язык · '+lang16[l],why='Курсы и практика '+langGenitive27913(l)+' — только '+citiesText27913(l)+'.';
    for(const g of d.sections||[])for(const r of g.rows||[])if(r&&r.label===name&&!r.ok&&r.help)r.help=why;
    if(Array.isArray(d.actions))d.actions=d.actions.filter(a=>a?.label!=='Изучать язык · '+lang16[l]);
   }
  }catch(e){console.error(e);}
  return d;
 };
 if(hints27913.langNeed273)langNeed273=function(lang,need,back,...rest){
  const r=hints27913.langNeed273.call(this,lang,need,back,...rest);
  try{if(r&&r.fix&&isLocal27913(lang)&&!here27913(lang)){const {fix,...keep}=r;return {...keep,when:'курсы — только '+citiesText27913(lang)};}}catch(e){console.error(e);}
  return r;
 };
}
