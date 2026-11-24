'use strict';
// Navigation history contains UI frames only; committed actions invalidate it.
const modalBase38={show,choose,closeModal};
let modalFrames38=[],modalChoosing38=false,modalCandidate38=null,modalRestoring38=false,modalParent38=null;
function modalSignature38(){return s?JSON.stringify(s,(key,value)=>['savedAt','running','resumeAfterChoice','choiceActive','view','tab','showAllPeople','serial'].includes(key)?undefined:key==='pet38'?{...value,offers:undefined}:value):'menu';}
function modalFrame38(){const d=$('#modal');return {parent:modalParent38,viewRef:s?.path16?.view||null,view:s?.path16?.view?{...s.path16.view}:null,title:d.querySelector?.('h2')?.textContent||/<h2>([\s\S]*?)<\/h2>/.exec(d.innerHTML)?.[1]||'',nodes:d.childNodes?[...d.childNodes]:null,html:d.innerHTML,fns:modalFns.slice(),scroll:d.scrollTop||0,fields:[...(d.querySelectorAll?.('input,select,textarea')||[])].map(e=>({id:e.id,value:e.value,checked:e.checked})),signature:modalSignature38()};}
function modalBar38(){const d=$('#modal');if(!d.querySelector)return;const close=d.querySelector('button.close');if(!close)return;close.setAttribute('onclick','backModal38()');close.setAttribute('aria-label',modalFrames38.length||modalParent38?'Назад':'Закрыть');close.title=modalFrames38.length||modalParent38?'Назад к предыдущему меню':'Закрыть';let bar=d.querySelector('.modal-closebar38');if(!bar){bar=document.createElement('div');bar.className='modal-closebar38';bar.append(close);}if(d.firstElementChild!==bar)d.prepend(bar);}
show=function(title,text,opts=[],parent=null){const d=$('#modal'),frame=modalCandidate38||(d.open?modalFrame38():null);if(!modalRestoring38&&frame&&frame.title!==title){const parent=modalFrames38.findIndex(f=>f.title===title);if(parent>=0)modalFrames38=modalFrames38.slice(0,parent);else if(modalParent38?.title!==title)modalFrames38.push(frame);modalFrames38=modalFrames38.slice(-12);}modalCandidate38=null;modalBase38.show(title,text,opts);modalParent38=parent;modalBar38();};
choose=function(index){const before=modalSignature38();modalCandidate38=modalFrame38();modalChoosing38=true;try{return modalBase38.choose(index);}finally{modalChoosing38=false;modalCandidate38=null;if(modalSignature38()!==before||!$('#modal').open)modalFrames38=[];modalBar38();}};
closeModal=function(){if(!modalChoosing38&&!modalRestoring38){modalFrames38=[];modalCandidate38=null;modalParent38=null;}return modalBase38.closeModal();};
// Search results use their own launcher rather than choose(); retain that parent too.
const launchActionBase38=launchAction24;
launchAction24=function(id){const before=modalSignature38();modalCandidate38=$('#modal').open?modalFrame38():null;modalChoosing38=true;try{return launchActionBase38(id);}finally{modalChoosing38=false;modalCandidate38=null;if(modalSignature38()!==before||!$('#modal').open)modalFrames38=[];modalBar38();}};
function backModal38(){const d=$('#modal'),last=modalFrames38.at(-1);if(modalParent38&&last?.title!==modalParent38.title){const parent=modalParent38;modalRestoring38=true;try{return parent.open();}finally{modalRestoring38=false;}}const frame=modalFrames38.pop();if(!frame)return closeModal();modalRestoring38=true;try{if(frame.nodes&&d.replaceChildren)d.replaceChildren(...frame.nodes);else d.innerHTML=frame.html;modalFns=frame.fns;modalParent38=frame.parent;if(frame.view&&s?.path16){const view=frame.viewRef||s.path16.view||{};Object.assign(view,frame.view);s.path16.view=view;}for(const f of frame.fields){const el=f.id&&d.querySelector?.('#'+f.id);if(el){el.value=f.value;el.checked=f.checked;}}if(!d.open)d.showModal();d.scrollTop=frame.scroll;modalBar38();}finally{modalRestoring38=false;}}
{
 const d=$('#modal');let outside=false;
 const isOutside=e=>{if(e.target!==d)return false;const r=d.getBoundingClientRect?.();return r&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom);};
 d.addEventListener('cancel',e=>{e.preventDefault();backModal38();});
 d.addEventListener('pointerdown',e=>{outside=isOutside(e);});
 d.addEventListener('click',e=>{if(outside&&isOutside(e)){e.preventDefault();closeModal();}outside=false;});
 if(typeof MutationObserver!=='undefined')new MutationObserver(()=>modalBar38()).observe(d,{childList:true});
}
