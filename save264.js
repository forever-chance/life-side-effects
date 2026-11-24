'use strict';
// Сборка 264: отложенное сохранение.
//
// Замер (tools/save_bench.js, персонаж 42 лет, состояние ~800 КБ): один save() — 14–18 мс (проверка жизни, чтение
// прежней версии, сериализация, разбор прежней версии для резервной копии, две записи). Клик по варианту окна вызывает
// save() шесть раз подряд (закрытие окна, выбор, перерисовка, обёртки) и занимает 170 мс, из них 115 — сохранение.
// Теперь вызовы копятся, а настоящая запись идёт раз в 0.4 с — уже после того, как клик отработал.
// Сразу пишется: при ручном сохранении, при закрытии и сворачивании вкладки, перед любым чтением сохранения обратно
// (список персонажей, загрузка, экспорт, экран новой жизни). Запоминается, чью жизнь записать: если игра успела
// переключиться на другого персонажа или обнулить s («Начать новую жизнь»), записывается та, что была.

const saveNow264=save;
let saveTarget264=null,saveTimer264=null;

function flushSave264(){
 if(saveTimer264){clearTimeout(saveTimer264);saveTimer264=null;}
 const target=saveTarget264;
 saveTarget264=null;
 if(!target)return true;
 if(target===s)return saveNow264();
 const current=s;
 s=target;
 try{return saveNow264();}
 finally{s=current;}
}

save=function(){
 if(!s)return flushSave264()&&false;
 if(typeof manualSave!=='undefined'&&manualSave){saveTarget264=s;return flushSave264();}
 if(saveTarget264&&saveTarget264!==s)flushSave264();
 saveTarget264=s;
 if(!saveTimer264)saveTimer264=setTimeout(flushSave264,400);
 return true;
};

// Всё, что читает сохранение обратно или меняет персонажа, сначала дописывает отложенное.
const flushFirst264=fn=>function(...args){flushSave264();return fn.apply(this,args);};
if(typeof loadCharacter==='function')loadCharacter=flushFirst264(loadCharacter);
if(typeof openLives==='function')openLives=flushFirst264(openLives);
if(typeof exportLives==='function')exportLives=flushFirst264(exportLives);
if(typeof pickSaveFile==='function')pickSaveFile=flushFirst264(pickSaveFile);
intro=flushFirst264(intro);
if(typeof readLife==='function'){
 const readLifeBase264=readLife;
 readLife=function(id,...args){
  if(saveTarget264&&saveTarget264.saveId===id)flushSave264();
  return readLifeBase264.call(this,id,...args);
 };
}

window.addEventListener('pagehide',flushSave264);
window.addEventListener('beforeunload',flushSave264);
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushSave264();});
