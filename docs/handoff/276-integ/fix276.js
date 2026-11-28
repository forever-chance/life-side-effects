/* 276: окна 273.x (windows273.js: taskPace273, taskMonths273, taskLeft273, freeNeed273) считали сроки дел по прежнему
   темпу clock.js — min(1, capacity()/totalHours()), ×0,65 при усталости выше 75 — один на все дела. С 276 у каждого
   дела свой темп (taskPace276): отклики, собеседования, заявки, стипендии, переговоры и документы (time276.always) и дела
   на 0 ч идут при любой нагрузке, отдых при нехватке медленнее, прочие планы — по доле часов, что остаётся планам.
   Без этого окно вакансии при перегрузке писало «ответа не будет» и звало в «Нагрузку», а ответ приходил через месяц. */
function windowPace276(t){
 const L=week276(),sq=squeeze276(L),sqF=squeeze276(L,null,{noRest:true});
 const plan=Math.max(0,1-(sq.f.plans||0))*((s.clock.fatigue||0)>75?.65:1);
 return taskPace276({...t,wait276:undefined},plan,L.custody,Math.max(.25,1-sqF.missing/12));
}
if(typeof taskLeft273==='function'){
 taskLeft273=function(t){
  const p=windowPace276(t),left=Math.max(0,(t.duration||1)-(t.progress||0)),wait=Math.max(0,(t.wait276??-1)-s.clock.ticks-1);
  return p>0?wait+Math.max(1,Math.ceil(left/p-1e-9)):Infinity;
 };
 // Сроки ещё не поданных шагов (taskMonths273 с готовыми месяцами) и строка «Свободного времени — 0 ч» (freeNeed273)
 // во всех окнах 273.x — только у откликов и заявок: резюме и собеседование, приём, стипендия, разговор о прибавке,
 // оплата учёбы компанией. В 276 они идут при любой нагрузке.
 taskMonths273=function(left){return Math.max(1,Math.ceil((+left||0)-1e-9));};
 freeNeed273=function(){return null;};
}
