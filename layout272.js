'use strict';
// Сборка 272: экран не прыгает между вкладками.
// Широкий экран (больше 1000px): над вкладками центра (История / Люди / Личное дело / Траектория) — одна сводка
// постоянной высоты, одинаковая на всех вкладках: последнее событие в одну строку с его итогами («−673 A$»,
// «Самочувствие: лучше»), «Усталость N/100» и «Ожидают ответа · N» со ссылкой на общий список. Она заменяет и карточку
// «Что произошло» в «Истории» (events.js, recentView), и полосу 270 над колонками. Сводка — отдельная клетка грида
// .shell над центральной колонкой, вне колонок-скроллеров: прокрутка ленты и якоря её не видят.
// Телефон (до 1000px): полоса 270 под вкладками Персонаж / История / Действия — одной высоты и на одном месте на всех
// вкладках, кроме «Персонажа». На вкладке «История» — «Ожидают ответа» (и при нуле: «Ожидают ответа · 0», «Пока
// ничего»), на остальных («Люди», «Личное дело», «Траектория», «Действия») — последнее событие. Нажатия и остановка
// часов на «Персонаже» и «Личном деле» — как в strip270.js.
// От карточки «Что произошло» в «Истории» не остаётся ничего (275.1: кнопка сюжета «Вторая связка ключей» убрана).
// «Моя работа» (Траектория): под карточкой текущей работы — самое полное творческое портфолио (направление, работы,
// качество, проекты в работе; остальные портфолио — строками ниже) и своё дело (название, вид, где, итог прошлого
// месяца, предупреждение о минусе). Каждый пункт открывает своё меню.

const layoutBase272={recentView,workOverview58,restorePanels};

function plural272(n,one,few,many){
 const a=Math.abs(n)%100,b=a%10;
 return a>10&&a<20?many:b===1?one:b>=2&&b<=4?few:many;
}
function signed272(n){return (n<0?'−':'+')+money(Math.abs(n));}

// Итоги последнего действия (s.receipts[0], events.js) — только если в нём есть само последнее событие.
// Итоги года не подписываем к одному событию: они про весь год.
function resultTags272(e){
 const r=s?.receipts?.[0];
 if(!e||!r||r.isYear)return [];
 if(!(r.events||[]).some(x=>x&&x.title===e.title&&x.text===e.text))return [];
 return [...(r.changes||[]),...(r.ties||[]).slice(0,2),...(r.goals||[])].filter(Boolean).slice(0,4);
}

// ---------- Телефон: полоса одной высоты ----------
function stripLatestRow272(e){
 const date=stripDate270(e),text=stripText270(e.text).trim(),tags=resultTags272(e);
 return '<div class="strip-row270 strip-latest270"><button class="strip-open270" data-strip-event="'+esc(e.uiId||'')+'" onclick="openHistory270(this.dataset.stripEvent)">'+
  '<span class="strip-body270"><span class="strip-head272"><span class="strip-kicker270">Последнее событие'+(date?' · '+esc(date):'')+'</span>'+
  (tags.length?'<span class="strip-tags272">'+tags.map(esc).join(' · ')+'</span>':'')+'</span>'+
  '<span class="strip-line270"><b class="strip-title270">'+esc(e.title||'')+'</b>'+(text?'<span class="strip-text270"> — '+esc(text)+'</span>':'')+'</span></span>'+
  '<span class="strip-go270" aria-hidden="true">→</span></button></div>';
}
// Пустые строки держат место: полоса не исчезает и не меняет высоту, когда отвечать не на что.
function stripEmptyRow272(kind){
 const waiting=kind==='waiting';
 return '<div class="strip-row270 '+(waiting?'strip-waiting270':'strip-latest270')+' strip-empty272"><div class="strip-open270 strip-static272">'+
  '<span class="strip-body270"><span class="strip-head272"><span class="strip-kicker270">'+(waiting?'Ожидают ответа · <span class="strip-count270">0</span>':'Последнее событие')+'</span></span>'+
  '<span class="strip-line270"><b class="strip-title270">Пока ничего</b>'+(waiting?'<span class="strip-text270"> — просьбы и предложения появятся здесь</span>':'')+'</span></span></div></div>';
}
topStrip270=function(){
 if(stripBlocked270()||!mobile270())return '';
 const v=view270();
 if(v==='character')return '';
 let row;
 if(v==='story'){const items=waitingItems270();row=items.length?stripWaitingRow270(items):stripEmptyRow272('waiting');}
 else{const e=latestEntry270();row=e?stripLatestRow272(e):stripEmptyRow272('latest');}
 return '<section class="top-strip270 strip272" aria-label="Сводка"><div class="strip-inner270">'+row+'</div></section>';
};

// ---------- Широкий экран: сводка над вкладками центра ----------
function summary272(){
 const e=latestEntry270(),items=waitingItems270(),n=items.length;
 const date=e?stripDate270(e):'',text=e?stripText270(e.text).trim():'',tags=resultTags272(e);
 const head='<div class="sum-head272"><span class="sum-kicker272">Что произошло'+(date?' · '+esc(date):'')+'</span>'+
  (s.clock?'<span class="sum-fatigue272">Усталость '+Math.round(s.clock.fatigue)+'/100</span>':'')+
  '<button class="sum-wait272'+(n?'':' sum-zero272')+'" onclick="decisionsMenu24()" title="Все ответы и состояния">Ожидают ответа · <span class="sum-count272">'+n+'</span><span aria-hidden="true"> →</span></button></div>';
 const line=e?'<button class="sum-event272" data-strip-event="'+esc(e.uiId||'')+'" onclick="openHistory270(this.dataset.stripEvent)" title="Открыть в истории">'+
   '<span class="sum-line272"><b class="sum-title272">'+esc(e.title||'')+'</b>'+(text?'<span class="sum-text272"> — '+esc(text)+'</span>':'')+'</span>'+
   (tags.length?'<span class="sum-tags272">'+tags.map(t=>'<span>'+esc(t)+'</span>').join('')+'</span>':'')+
   '<span class="sum-go272" aria-hidden="true">→</span></button>'
  :'<div class="sum-event272 sum-static272"><span class="sum-line272"><b class="sum-title272">Пока ничего не произошло</b></span></div>';
 return '<section class="summary272" aria-label="Что произошло"><div class="sum-card272">'+head+line+'</div></section>';
}
function placeSummary272(){
 const app=document.getElementById('app'),shell=app?.querySelector(':scope>.shell');
 if(!shell)return;
 shell.querySelector(':scope>.summary272')?.remove();
 shell.classList.remove('sum272');
 if(!s||!app.classList.contains('playing')||mobile270()||stripBlocked270())return;
 const center=shell.querySelector(':scope>.center');
 if(!center)return;
 center.insertAdjacentHTML('beforebegin',summary272());
 shell.classList.add('sum272');
 const el=shell.querySelector(':scope>.summary272');
 if(el&&typeof yoScreen269==='function')yoScreen269(el);
}
function placeSummarySafe272(){try{placeSummary272();}catch(e){setTimeout(()=>{throw e;});}}
// Сводка и полоса встают до восстановления прокрутки (restorePanels в конце отрисовки ux05): колонки уже нужной
// высоты, и прокрутка у самого низа списка не упирается в предел более высокой колонки (иначе на ходу часов экран
// сдвигался бы на высоту полосы каждый месяц). Обёртка render из strip270 после отрисовки ставит полосу ещё раз —
// этот повтор пропускаем, он дал бы тот же текст. Вне отрисовки (start, стартовое окно onboarding270) полоса и сводка
// ставятся вместе: под стартовым окном и во время обучения сводки нет, как и полосы.
const placeStripBase272=placeStrip270;
let stripPlaced272=false;
placeStrip270=function(...args){
 if(stripPlaced272){stripPlaced272=false;return;}
 const out=placeStripBase272.apply(this,args);
 placeSummarySafe272();
 return out;
};
restorePanels=function(...args){
 stripPlaced272=false;
 if(s&&document.getElementById('app')?.classList.contains('playing')){
  placeStripSafe270();
  // Флаг живёт до конца текущей отрисовки: если повтор не случился, следующий вызов полосы не пропустится.
  stripPlaced272=true;
  queueMicrotask(()=>{stripPlaced272=false;});
 }
 return layoutBase272.restorePanels.apply(this,args);
};

// Карточки «Что произошло» в «Истории» больше нет (её смысл — в сводке и полосе).
// 275.1: кнопки «История «Вторая связка ключей» →» больше нет — новому взрослому персонажу сразу предлагали снимать
// квартиру с другом. Начатая в сохранении история доигрывается (events.js), новая не начинается.
recentView=function(){return '';};

// ---------- «Моя работа»: портфолио и своё дело ----------
function creativeSummary272(){
 if(typeof ownedPortfolios60!=='function'||typeof portfolio47!=='function')return '';
 const tracks=ownedPortfolios60();
 if(!tracks.length)return '';
 const tasks=typeof creativeTasks47==='function'?creativeTasks47():[];
 const [main,...rest]=tracks,p=portfolio47(main),busy=tasks.filter(t=>t.track===main);
 const work=busy.length===1?'В работе: '+busy[0].label+' · '+Math.floor(busy[0].progress||0)+' из '+busy[0].duration+' мес.':
  busy.length?'В работе: '+busy.length+' '+plural272(busy.length,'проект','проекта','проектов'):'Сейчас в работе ничего нет';
 const mini=k=>{const q=portfolio47(k),n=tasks.filter(t=>t.track===k).length;
  return '<button class="work-mini272" data-track="'+esc(k)+'" onclick="creativeTrackMenu47(this.dataset.track)"><span>'+esc(trackNames46[k]||k)+'</span><small>'+
   q.count+' '+plural272(q.count,'работа','работы','работ')+(q.count?' · '+Math.round(q.quality)+'/100':'')+(n?' · в работе '+n:'')+'</small></button>';};
 return '<section class="path-card work-card272 work-creative272"><div class="eyebrow">Портфолио</div>'+
  '<button class="work-main272" data-track="'+esc(main)+'" onclick="creativeTrackMenu47(this.dataset.track)"><strong>'+esc(trackNames46[main]||main)+'</strong>'+
  '<span>Работ: '+p.count+(p.count?' · качество '+Math.round(p.quality)+'/100':'')+'</span><span>'+esc(work)+'</span></button>'+
  (rest.length?'<div class="work-minis272">'+rest.map(mini).join('')+'</div>':'')+'</section>';
}
// Точки одного дела и сети — одной строкой, как в панели «Моё дело» (enterprisePanel152).
function businessGroups272(){
 if(typeof ownedEnterprises168!=='function')return [];
 const list=ownedEnterprises168(),seen=new Set(),groups=[];
 for(const b of list){
  const net=typeof enterpriseNetwork168==='function'?enterpriseNetwork168(b):null;
  if(net&&seen.has(net.id))continue;
  if(net)seen.add(net.id);
  groups.push({b,net,points:net?list.filter(p=>net.ids.includes(p.id)):[b]});
 }
 return groups;
}
// Итог прошлого месяца: выручка минус расходы по всем точкам, в валюте кошелька (как в меню дела).
function businessMonth272(points){
 let sum=0,cash=0,seen=0;
 for(const p of points){
  const h=p.history?.at(-1),rate=fxRate86(p.country);
  cash+=(Number(p.cash)||0)*rate;
  if(!h)continue;
  seen++;sum+=((Number(h.sales)||0)-(Number(h.costs)||0))*rate;
 }
 return seen?{result:Math.round(sum),cash:Math.round(cash)}:null;
}
function businessItem272(g){
 const {b,net,points}=g;
 const kind=enterpriseSpecialties153[b.type]?.[b.specialty]||enterpriseTypes152[b.type]?.name||'';
 const count=points.reduce((n,p)=>n+1+Number(!!p.branch159),0);
 const cities=[...new Set(points.map(p=>p.city))].filter(Boolean).join(', ');
 const month=businessMonth272(points);
 let resultText='Первый месяц ещё не закрыт',warn='';
 if(month){
  resultText='Прошлый месяц: '+signed272(month.result);
  if(month.result<0){
   const runway=Math.floor(month.cash/-month.result);
   warn='Дело в минусе: расходы больше выручки. '+(runway<1?'Денег на счёте дела почти не осталось: ещё один такой месяц — и дело закроется.':
    runway>=12?'Запаса на счёте дела хватит дольше года.':'Денег на счёте дела хватит примерно на '+runway+' '+plural272(runway,'месяц','месяца','месяцев')+'.');
  }
 }
 const where=cities+(count>1?' · '+count+' '+plural272(count,'точка','точки','точек'):'');
 return '<button class="work-main272 work-business272'+(warn?' work-loss272':'')+'" data-id="'+esc(net?net.id:b.id)+'" data-net="'+(net?'1':'')+'" onclick="openBusiness272(this.dataset.id,!!this.dataset.net)">'+
  '<strong>'+esc(net?.title||b.title||'')+'</strong><span>'+esc([kind,where].filter(Boolean).join(' · '))+'</span>'+
  '<span class="work-result272">'+esc(resultText)+'</span>'+(warn?'<span class="work-warn272">'+esc(warn)+'</span>':'')+'</button>';
}
function openBusiness272(id,network){
 if(network)return enterprisePortfolio168(id);
 if(selectEnterprise168(id))enterpriseMenu152();
}
function businessSummary272(){
 const groups=businessGroups272();
 if(!groups.length)return '';
 return '<section class="path-card work-card272 work-own272"><div class="eyebrow">Своё дело</div>'+groups.map(businessItem272).join('')+'</section>';
}
function workSummary272(){
 const cards=[creativeSummary272(),businessSummary272()].filter(Boolean);
 return cards.length?'<div class="work-sum272'+(cards.length>1?' work-two272':'')+'">'+cards.join('')+'</div>':'';
}
// Сразу под карточкой текущей работы (или «Сейчас без работы») — это первая карточка .path-card в «Моей работе».
workOverview58=function(...args){
 const html=layoutBase272.workOverview58.apply(this,args);
 let extra='';
 try{extra=workSummary272();}catch(e){setTimeout(()=>{throw e;});}
 if(!extra)return html;
 const start=html.indexOf('<section class="path-card"'),end=start<0?-1:html.indexOf('</section>',start);
 if(end<0)return html+extra;
 return html.slice(0,end+10)+extra+html.slice(end+10);
};

(function layoutStyle272(){
 if(document.getElementById('layout272-style'))return;
 const st=document.createElement('style');
 st.id='layout272-style';
 st.textContent=
  // Телефон: полоса постоянной высоты, строки не растягивают её (270 давал max-height и прокрутку).
  '@media(max-width:1000px){#app.playing>.top-strip270.strip272{height:50px;box-sizing:border-box}'+
  '.strip272 .strip-inner270{height:100%;max-height:none;box-sizing:border-box;align-content:center;overflow:hidden}'+
  '.strip272 .strip-row270{min-height:0}}'+
  '@media(max-width:1000px) and (max-height:500px){#app.playing>.top-strip270.strip272{height:36px}}'+
  '.strip-head272{display:flex;align-items:baseline;gap:8px;min-width:0}'+
  '.strip-head272 .strip-kicker270{flex:0 0 auto;max-width:100%}'+
  '.strip-tags272{flex:1 1 auto;min-width:0;text-align:right;font-size:11px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '.top-strip270 .strip-static272,.top-strip270 .strip-static272:hover{background:transparent;cursor:default}'+
  '.strip-empty272 .strip-title270{font-weight:600}'+
  '@media(max-width:1000px) and (max-height:500px){.strip-head272{flex:0 1 auto;max-width:42%}.strip-head272 .strip-kicker270{flex:0 1 auto;max-width:none}}'+
  // Широкий экран: сводка — клетка грида над центральной колонкой; боковые колонки на обе строки.
  '.summary272{display:none}'+
  '@media(min-width:1001px){.playing .shell.sum272{grid-template-rows:auto minmax(0,1fr);row-gap:8px}'+
  '.playing .shell.sum272>.left{grid-column:1;grid-row:1/3}.playing .shell.sum272>.right{grid-column:3;grid-row:1/3}'+
  '.playing .shell.sum272>.center{grid-column:2;grid-row:2}'+
  // Те же поля и та же полоса прокрутки справа, что у колонки под ней: края сводки и вкладок совпадают.
  '.playing .shell.sum272>.summary272{display:block;grid-column:2;grid-row:1;min-width:0;padding:0 8px;overflow:hidden;scrollbar-gutter:stable}}'+
  '.sum-card272{height:62px;box-sizing:border-box;padding:7px 12px;border-radius:8px;background:var(--soft);color:var(--ink);display:grid;grid-template-rows:auto auto;align-content:center;gap:3px;overflow:hidden}'+
  '.sum-head272{display:flex;align-items:center;gap:12px;min-width:0;height:20px}'+
  '.sum-kicker272{flex:1 1 auto;min-width:0;font-size:10px;letter-spacing:.08em;text-transform:uppercase;font-weight:600;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'+
  '.sum-fatigue272{flex:none;font-size:11px;color:var(--muted);white-space:nowrap}'+
  '.summary272 .sum-wait272{flex:none;border:1px solid var(--line);border-radius:6px;padding:1px 8px;font-size:11px;line-height:16px;background:var(--surface);color:var(--ink);white-space:nowrap}'+
  '.summary272 .sum-wait272:hover{background:var(--paper)}'+
  '.summary272 .sum-zero272{background:transparent;color:var(--muted)}'+
  '.summary272 .sum-event272{display:flex;align-items:center;gap:10px;min-width:0;height:26px;margin:0 -6px;padding:0 6px;border:0;border-radius:6px;background:transparent;color:inherit;text-align:left;font:inherit}'+
  '.summary272 button.sum-event272:hover{background:var(--surface)}'+
  '.sum-line272{flex:1 1 auto;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:13px;line-height:20px}'+
  '.sum-title272{font-weight:600}.sum-text272{color:var(--muted)}'+
  '.sum-tags272{flex:0 1 auto;max-width:45%;min-width:0;display:flex;gap:4px;overflow:hidden}'+
  '.sum-tags272 span{flex:none;font-size:10px;line-height:14px;white-space:nowrap;background:var(--surface);border:1px solid var(--line);padding:1px 6px;border-radius:5px}'+
  '.sum-go272{flex:none;color:var(--accent);font-size:14px}'+
  '.story-offer272{margin:0 0 12px}'+
  // «Моя работа»: две карточки рядом, где хватает ширины, иначе одна под другой.
  '.work-sum272{display:grid;grid-template-columns:1fr;gap:12px;margin:12px 0}'+
  '.work-sum272.work-two272{grid-template-columns:repeat(auto-fit,minmax(240px,1fr))}'+
  '.work-sum272 .work-card272{margin:0;padding:12px 13px;min-width:0}'+
  '.work-card272 .eyebrow{margin-bottom:6px}'+
  '.path-card .work-main272{display:grid;gap:3px;width:100%;margin:0 0 6px;padding:9px 11px;text-align:left;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:var(--ink)}'+
  '.path-card .work-main272:hover{background:var(--hover)}'+
  '.work-main272 strong{font-size:15px;overflow-wrap:anywhere}'+
  '.work-main272 span{font-size:12px;line-height:1.45;color:var(--muted)}'+
  '.work-main272 .work-result272{color:var(--ink)}'+
  '.work-main272 .work-warn272{color:var(--red);font-weight:600}'+
  '.path-card .work-loss272{border-color:var(--red)}'+
  '.work-minis272{display:grid;gap:2px}'+
  '.path-card .work-mini272{display:flex;align-items:baseline;justify-content:space-between;gap:8px;width:100%;margin:0;padding:5px 11px;border:0;border-radius:6px;background:transparent;color:var(--ink);text-align:left;font-size:12px}'+
  '.path-card .work-mini272:hover{background:var(--hover)}'+
  '.work-mini272 span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'+
  '.work-mini272 small{flex:none;color:var(--muted);font-size:11px}';
 document.head.appendChild(st);
})();

if(typeof s!=='undefined'&&s&&document.getElementById('app')?.classList.contains('playing'))render();
