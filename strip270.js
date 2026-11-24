'use strict';
// Сборка 270: верхняя полоса.
// Телефон (ширина до 1000px, тот же порог, что в style.css):
//  - «Действия» — сверху последнее событие из истории;
//  - «История» — сверху то, что ждёт ответа;
//  - «Люди» и «Траектория» — и то и другое;
//  - «Персонаж» и «Личное дело» — без полосы, но время стоит, пока они открыты, и идёт дальше, когда игрок уходит.
// Широкий экран: полоса только с последним событием, когда в центре открыта не «История».
// Нажатие на событие открывает «Историю» на этой записи, нажатие на решение — само решение.
// Полоса — отдельная строка грида #app вне колонок-скроллеров: запоминание прокрутки (capturePanels/restorePanels)
// и якоря ленты её не видят.

const stripBase270={render,clockView,pulse};
const stripMq270=typeof window.matchMedia==='function'?window.matchMedia('(max-width:1000px)'):null;
function mobile270(){return !!stripMq270?.matches;}

// Что открыто сейчас: на телефоне — вкладка внизу шапки (Персонаж / История / Действия) и вкладка центра,
// на широком экране — только вкладка центра (s.ui05.panel может остаться от телефона, её не смотрим).
// ux05 рисует world() для любой вкладки, кроме story/people/trajectory (в том числе для старой 'plans'),
// поэтому всё остальное — «Личное дело».
function centerView270(){return ['story','people','trajectory'].includes(tab)?tab:'world';}
function view270(){
 const center=centerView270();
 if(!mobile270())return center;
 const panel=s?.ui05?.panel;
 return panel==='left'?'character':panel==='right'?'actions':center;
}
function stripBlocked270(){
 return !s||(typeof tutorialActive180==='function'&&tutorialActive180())||(typeof startupNotice180==='function'&&!!startupNotice180());
}
// Какие строки полосы показывать.
function stripRows270(){
 if(stripBlocked270())return {latest:false,waiting:false};
 const v=view270();
 if(!mobile270())return {latest:v!=='story',waiting:false};
 return {latest:['actions','people','trajectory'].includes(v),waiting:['story','people','trajectory'].includes(v)};
}

// Последняя запись «Истории» — с теми же фильтрами, что у story(): без тихих записей (stories.js) и без
// рутинных знакомств (dashboard58). Рутина в s.log не попадает вовсе (feed267), а сводку «Будни» и итоги года
// пропускаем: это не событие. Если ничего другого нет — первая видимая запись.
function visibleEntry270(e){
 return !!e&&!(typeof quietEntry==='function'&&quietEntry(e))&&!(typeof routineContact58==='function'&&routineContact58(e));
}
function latestEntry270(){
 const list=s?.log||[];
 return list.find(e=>visibleEntry270(e)&&!e.weekdays267&&e.tag!=='Будни'&&e.tag!=='Годовая сводка')||list.find(visibleEntry270)||null;
}
// То, что ждёт ответа: decisionItems24 по имени в момент вызова — её оборачивают и более поздние файлы.
// Сначала ответы (по сроку), потом состояния здоровья — они висят долго и не требуют ответа к сроку.
function waitingItems270(){
 if(!s||s.dead||typeof decisionItems24!=='function')return [];
 const items=decisionItems24()||[];
 return items.filter(i=>i?.ref?.kind!=='health58').concat(items.filter(i=>i?.ref?.kind==='health58'));
}

function stripDate270(e){return ((e.month!==undefined&&typeof months!=='undefined'&&months[e.month]?months[e.month]+' ':'')+(e.year??'')).trim();}
function stripText270(text){return typeof eventDescription204==='function'?eventDescription204(text||''):String(text||'');}
// id записей и решений идут через data-атрибуты: в onclick строкой их пришлось бы экранировать дважды.
function stripLatestRow270(e){
 const date=stripDate270(e);
 return '<div class="strip-row270 strip-latest270"><button class="strip-open270" data-strip-event="'+esc(e.uiId||'')+'" onclick="openHistory270(this.dataset.stripEvent)">'+
  '<span class="strip-body270"><span class="strip-kicker270">Последнее событие'+(date?' · '+esc(date):'')+'</span>'+
  '<span class="strip-line270"><b class="strip-title270">'+esc(e.title||'')+'</b><span class="strip-text270"> — '+esc(stripText270(e.text))+'</span></span></span>'+
  '<span class="strip-go270" aria-hidden="true">→</span></button></div>';
}
function stripWaitingRow270(items){
 const i=items[0],kind=String(i.ref.kind),id=String(i.ref.id);
 return '<div class="strip-row270 strip-waiting270"><button class="strip-open270" data-strip-kind="'+esc(kind)+'" data-strip-id="'+esc(id)+'" onclick="stripDecision270(this)">'+
  '<span class="strip-body270"><span class="strip-kicker270">Ожидают ответа · <span class="strip-count270">'+items.length+'</span></span>'+
  '<span class="strip-line270"><b class="strip-title270">'+esc(i.title||'')+'</b>'+(i.note?'<span class="strip-text270"> — '+esc(i.note)+'</span>':'')+'</span></span>'+
  '<span class="strip-go270" aria-hidden="true">→</span></button>'+
  (items.length>1?'<button class="strip-all270" onclick="decisionsMenu24()" aria-label="Все ответы и состояния" title="Все ответы и состояния">Все</button>':'')+'</div>';
}
function stripDecision270(el){openDecision24(el.dataset.stripKind,el.dataset.stripId);}
function topStrip270(){
 const want=stripRows270();
 let rows='';
 if(want.latest){const e=latestEntry270();if(e)rows+=stripLatestRow270(e);}
 if(want.waiting){const items=waitingItems270();if(items.length)rows+=stripWaitingRow270(items);}
 return rows?'<section class="top-strip270" aria-label="Сводка"><div class="strip-inner270">'+rows+'</div></section>':'';
}

function placeStrip270(){
 const app=document.getElementById('app');
 if(!app)return;
 app.querySelector(':scope>.top-strip270')?.remove();
 app.classList.remove('strip270');
 if(!s||!app.classList.contains('playing'))return;
 const html=topStrip270();
 if(!html)return;
 const anchor=app.querySelector(':scope>.mobile-panels')||app.querySelector(':scope>.clock-bar');
 if(!anchor)return;
 anchor.insertAdjacentHTML('afterend',html);
 app.classList.add('strip270');
 // display269 проходит по экрану буквой ё внутри своей обёртки render — до того, как появилась полоса.
 const el=app.querySelector(':scope>.top-strip270');
 if(el&&typeof yoScreen269==='function')yoScreen269(el);
}

render=function(...args){
 const out=stripBase270.render.apply(this,args);
 // Ошибка полосы не должна ломать отрисовку и то, что идёт после render() (save() в panelSelect и т. п.),
 // но и прятать её нельзя: отдаём её странице отдельно.
 try{placeStrip270();}catch(e){setTimeout(()=>{throw e;});}
 return out;
};

// «История» на нужной записи: вкладка центра, на телефоне — центральная панель, прокрутка к записи.
function openHistory270(id){
 if(!s)return;
 capturePanels();
 s.ui05.panel='center';
 if(tab!=='story')setTab('story');else render();
 const panel=document.querySelector('[data-panel="center"]');
 if(panel){
  const target=id?[...panel.querySelectorAll('[data-event-id]')].find(n=>n.dataset.eventId===id):null;
  if(target){
   const tabs=panel.querySelector('.tabs')?.offsetHeight||0;
   panel.scrollTop+=target.getBoundingClientRect().top-panel.getBoundingClientRect().top-tabs-8;
   target.classList.add('strip-target270');
   setTimeout(()=>target.classList.remove('strip-target270'),1800);
  }else panel.scrollTop=0;
  capturePanels();
 }
 save();
}

// Время стоит на «Персонаже» и «Личном деле» (только телефон). s.clock.running не трогаем: после закрытия
// любого окна settleChoice вернул бы его, и пауза игрока смешалась бы с этой. Поэтому держим сам ход часов.
function clockHold270(){
 return !!s&&!s.dead&&!!s.clock&&mobile270()&&['character','world'].includes(view270())&&!(typeof tutorialActive180==='function'&&tutorialActive180());
}
pulse=function(now,...rest){
 if(s&&s.clock?.running&&clockHold270()){clockStamp=now;clockCarry=0;return;}
 return stripBase270.pulse.call(this,now,...rest);
};
clockView=function(...args){
 let html=stripBase270.clockView.apply(this,args);
 if(!s)return html;
 // Возраст в строке часов — с правильным окончанием («31 год», «22 года»), а не «31 лет».
 html=html.replace(/ · (\d+) лет<\/small>/,(m,n)=>' · '+years(+n)+'</small>');
 if(s.clock?.running&&!s.pending.length&&clockHold270())
  html=html.replace('Жизнь идёт своим ходом',view270()==='character'?'Время стоит, пока открыт персонаж':'Время стоит, пока открыто личное дело');
 return html;
};

// Поворот экрана или смена ширины через 1000px: полоса и остановка часов должны поменяться сразу.
function stripMediaChange270(){
 const app=document.getElementById('app');
 if(s&&app?.classList.contains('playing'))render();
}
if(stripMq270){
 if(typeof stripMq270.addEventListener==='function')stripMq270.addEventListener('change',stripMediaChange270);
 else if(typeof stripMq270.addListener==='function')stripMq270.addListener(stripMediaChange270);
}

(function stripStyle270(){
 if(document.getElementById('strip270-style'))return;
 const st=document.createElement('style');
 st.id='strip270-style';
 // Пятая строка грида: без неё полоса сжимается до 0px. Колонки-скроллеры прибиты к последней строке, поэтому
 // скрытая на широком экране навигация (display:none, не занимает строку) ничего не сдвигает.
 st.textContent=
  '#app.playing.strip270{grid-template-rows:auto auto auto auto minmax(0,1fr)}#app.playing.strip270>.shell{grid-row:-2}'+
  '.top-strip270{min-width:0;max-width:100%;overflow:hidden;background:var(--soft);border-bottom:1px solid var(--line);color:var(--ink)}'+
  '.strip-inner270{max-width:1700px;margin:0 auto;padding:6px 26px;display:grid;gap:2px;max-height:22vh;overflow-y:auto;overflow-x:hidden}'+
  '.strip-row270{display:flex;align-items:stretch;gap:6px;min-width:0}'+
  '.top-strip270 .strip-open270{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:10px;border:0;border-radius:6px;padding:5px 8px;background:transparent;color:inherit;text-align:left;line-height:1.35}'+
  '.top-strip270 .strip-open270:hover{background:var(--hover)}'+
  '.strip-body270{flex:1 1 auto;min-width:0;display:block}'+
  '.strip-kicker270{display:block;font-size:10px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;color:var(--accent);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '.strip-line270{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px}'+
  '.strip-title270{font-weight:600}.strip-text270{color:var(--muted)}'+
  '.strip-go270{flex:none;color:var(--accent);font-size:15px}'+
  '.top-strip270 .strip-all270{flex:none;align-self:center;border:1px solid var(--line);border-radius:6px;padding:6px 10px;font-size:12px;background:transparent;color:inherit}'+
  '.event.strip-target270{background:var(--highlight);border-radius:0 8px 8px 0;transition:background .6s}'+
  '@media(max-width:1000px){.strip-inner270{padding:4px 12px;max-height:24vh}.top-strip270 .strip-open270{padding:5px 6px}}'+
  '@media(max-width:460px){.strip-inner270{padding:3px 8px}.strip-line270{font-size:12px}}';
 document.head.appendChild(st);
})();

if(typeof s!=='undefined'&&s&&document.getElementById('app')?.classList.contains('playing'))render();
