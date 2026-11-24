'use strict';
// Сборка 270: стартовое окно после перезагрузки.
// onboarding180 держит время, пока стартовое окно («На собственный риск», «У этой истории появилось имя») не прочитано:
// toggleClock и advanceMonth молчат. Само окно он открывает только при рождении (start) и при загрузке из «Персонажей»
// (loadCharacter). Если страницу перезагрузили до ответа, окна не было, а «▶ Продолжить» ничего не делал.
// 1. Открытие страницы: непрочитанное стартовое окно открывается само — после всех файлов, когда bootstrap61 уже
//    отрисовал экран (DOMContentLoaded; если файл подгружен позже, сразу).
// 2. «▶ Продолжить», пока окно не прочитано, открывает его.
// Окно открывается, только если на экране нет другого окна и не идёт обучение. Ответ, как и при рождении, разбирает
// onboarding180 (finishStartup180 → обучение). Полосу strip270 под окном убираем, как после start().
const onboardingBase270={toggleClock};
function startupPending270(){
 return !!s&&!s.dead&&typeof startupNotice180==='function'&&!!startupNotice180()&&!(typeof tutorialActive180==='function'&&tutorialActive180());
}
function reopenStartup270(){
 if(!startupPending270()||$('#modal').open)return false;
 if(typeof modalFrames38!=='undefined')modalFrames38=[];
 showMilestone166(startupNotice180());
 if(typeof placeStripSafe270==='function')placeStripSafe270();
 return true;
}
toggleClock=function(...args){
 if(startupPending270()){reopenStartup270();return;}
 return onboardingBase270.toggleClock.apply(this,args);
};
function startupOnLoad270(){
 if(document.getElementById('app')?.classList.contains('playing'))reopenStartup270();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startupOnLoad270,{once:true});
else startupOnLoad270();
