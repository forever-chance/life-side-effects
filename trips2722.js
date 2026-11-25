'use strict';
// Сборка 272.2: действие сразу под плашкой готовности в окне поездки (trips272).
// Было: зелёная «Можно ехать» — а кнопка «Запланировать поездку» в самом конце длинного списка; в жёлтой «Чтобы
// поехать, не хватает» решения были прямо внутри плашки и выглядели как подписи, а не как кнопки.
// Стало: плашка говорит, что с поездкой; сразу под ней — кнопки. Всё готово — та же кнопка согласия, что и внизу окна
// («Запланировать поездку», «Согласиться и запланировать», «Подтвердить новый план и бюджет»), нижняя остаётся на месте.
// Чего-то не хватает — в плашке список причин, под ней по кнопке на каждую причину, у которой есть решение.
// Кнопки решений — те же, что были в плашке 272 (тот же обработчик), поменялся только вид и место.
const tripConfirm2722=/^(Запланировать поездку|Запросить отпуск и запланировать поездку|Запросить отпуск и запланировать|Запланировать отдых|Согласиться и запланировать|Подтвердить новый план и бюджет)$/;
function tripOptionLabel2722(b){
 return [...b.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').replace(/\s+/g,' ').trim();
}
function tripReadyLayout2722(){
 const modal=document.getElementById('modal'),box=modal?.querySelector('.ready272');
 if(!box||box.dataset.v2722)return;
 box.dataset.v2722='1';
 const panel=document.createElement('div');
 panel.className='ready2722-panel';
 const acts=document.createElement('div');
 acts.className='ready2722-acts';
 if(box.classList.contains('ready272-ok')){
  panel.append(...box.childNodes);
  const confirm=[...modal.querySelectorAll('.options button')].find(b=>!b.disabled&&!b.hidden&&tripConfirm2722.test(tripOptionLabel2722(b)));
  if(confirm){
   const go=document.createElement('button');
   go.type='button';go.className='ready2722-go';go.textContent=tripOptionLabel2722(confirm);
   go.addEventListener('click',()=>confirm.click());
   acts.append(go);
  }
 }else{
  const list=box.querySelector('.ready272-list'),items=list?[...list.children]:[];
  const ul=document.createElement('ul');
  ul.className='ready2722-list';
  const labels=new Map();
  for(const item of items){
   const li=document.createElement('li');
   li.className='ready2722-why';
   if(item.tagName==='BUTTON'){
    const text=item.childNodes[0]?.textContent||'',fix=item.querySelector('small')?.textContent||'';
    li.textContent=text;li.dataset.fix=fix;
    item.textContent=fix;item.dataset.why=text;
    item.className='ready272-item ready2722-act';
    acts.append(item);
    labels.set(fix,(labels.get(fix)||0)+1);
   }else li.textContent=item.textContent;
   ul.append(li);
  }
  // Две одинаковые кнопки (уход для двух питомцев по отдельности) различаются строкой причины.
  for(const b of acts.children)if(labels.get(b.textContent)>1){const sm=document.createElement('small');sm.textContent=b.dataset.why;b.append(sm);}
  if(list)list.replaceWith(ul);
  panel.append(...box.childNodes);
 }
 box.append(panel);
 if(acts.children.length)box.append(acts);
}
{
 const base2722=tripInsertReady272;
 tripInsertReady272=function(...args){
  const r=base2722.apply(this,args);
  try{tripReadyLayout2722();}catch(e){console.error(e);}
  return r;
 };
}
(function tripStyle2722(){
 if(typeof document==='undefined'||document.getElementById('trips2722-style'))return;
 const st=document.createElement('style');
 st.id='trips2722-style';
 st.textContent='#modal .ready272[data-v2722]{background:none;border:0;padding:0;border-radius:0}'+
  '#modal .ready2722-panel{padding:14px 16px;border-radius:10px;background:#f1e2d6;border-left:3px solid #b57e3d}'+
  '#modal .ready272-ok .ready2722-panel{background:#e4ece0;border-left-color:#6f8f62}'+
  '#modal .ready272[data-v2722] h3{margin:0}'+
  '#modal .ready2722-list{margin:8px 0 0;padding-left:20px;font-size:14px;line-height:1.45;color:var(--ink,#302321)}'+
  '#modal .ready2722-list li+li{margin-top:4px}'+
  '#modal .ready2722-acts{display:grid;gap:8px;margin-top:10px}'+
  '#modal button.ready2722-act{display:block;width:100%;box-sizing:border-box;margin:0;padding:11px 15px;border:1px solid #b57e3d;border-radius:7px;background:var(--paper,#f7ede8);text-align:left;font-size:14px;font-weight:600;line-height:1.45;white-space:normal;overflow-wrap:anywhere;color:var(--accent,#8a4b16)}'+
  '#modal button.ready2722-act small{display:block;margin-top:3px;font-size:12px;font-weight:400;color:var(--muted,#715348)}'+
  '#modal button.ready2722-go{display:block;width:100%;box-sizing:border-box;margin:0;padding:13px 15px;border:0;border-radius:7px;background:var(--green,#4d6b46);color:#fff;text-align:center;font-size:14px;font-weight:600;line-height:1.4}'+
  '@media(max-width:600px){#modal .ready2722-panel{padding:12px}#modal button.ready2722-act{font-size:13px;padding:10px 12px}}';
 document.head.appendChild(st);
})();
