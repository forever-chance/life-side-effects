'use strict';
// Сборка 269: ё в хранимых значениях — только на экране.
// Роли и статусы «Ребенок», «Учеба», «Тетя», «Ждет решения», «Живет» записаны в сохранениях без ё, и код сравнивает
// их со старыми сохранениями, поэтому сами значения не меняются. После каждой отрисовки текст на экране
// проходит через замену: меняются только текстовые узлы, атрибуты (onclick с id и ролями) не трогаются.
const yoDisplay269={Ребенок:'Ребёнок',Ребенка:'Ребёнка',Ребенку:'Ребёнку',Ребенком:'Ребёнком',Ребенке:'Ребёнке',
 Учеба:'Учёба',Учебы:'Учёбы',Учебе:'Учёбе',Учебу:'Учёбу',Учебой:'Учёбой',Тетя:'Тётя',Тети:'Тёти',Ждет:'Ждёт',Живет:'Живёт'};
for(const [k,v] of Object.entries(yoDisplay269))yoDisplay269[k.toLowerCase()]=v.toLowerCase();
const yoDisplayRe269=new RegExp('(?<![А-Яа-яЁё])('+Object.keys(yoDisplay269).join('|')+')(?![А-Яа-яЁё])','g');
function yoText269(text){return String(text).replace(yoDisplayRe269,w=>yoDisplay269[w]);}
function yoScreen269(root=document.body){
 if(!root)return;
 const walk=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>/^(SCRIPT|STYLE|TEXTAREA)$/.test(n.parentNode?.nodeName)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 for(let n=walk.nextNode();n;n=walk.nextNode()){
  const v=n.nodeValue;
  if(v.length>2&&yoDisplayRe269.test(v)){yoDisplayRe269.lastIndex=0;n.nodeValue=yoText269(v);}
  yoDisplayRe269.lastIndex=0;
 }
}
for(const fn of ['render','show']){
 if(typeof window[fn]!=='function')continue;
 const base=window[fn];
 window[fn]=function(...args){const out=base.apply(this,args);try{yoScreen269(fn==='show'?document.getElementById('modal'):document.body);}catch(e){}return out;};
}
