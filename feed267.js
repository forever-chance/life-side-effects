'use strict';
// Сборка 267: лента — «История» и «Будни» (docs/ROADMAP.md, «Время, события, лента», п. 2).
//
// Замер (tools/calibrate_death.js, 4 жизни до 85 лет): около 3 600 вызовов log() за жизнь. Часть рутины уже молча
// выбрасывалась (stories.js, quietTitles: «Разговор между делами» — 316 раз за жизнь), а остальная забивала ленту:
// «Книга клуба» 155 раз, «Первый шаг с другой стороны» 113 (крупным событием), хронические «Симптомы вернулись» /
// «Обострение закончилось» по 64, «Имущество после утраты» 50 (крупным — на смерть любого знакомого), бытовые
// зарисовки по 16–19 раз с одним и тем же текстом. Лента обрезалась до 500 записей — к старости детство исчезало.
// Теперь:
// - рутина собирается в «Будни» — одну строку за три месяца: «Апрель — июнь 2047. Разговоры ×6, книжный клуб ×4…»;
//   туда же попадают зарисовки быта, которые повторяются чаще раза в два года;
// - «Имущество после утраты» — только для родни, близких (близость 50+) и самого игрока;
// - крупные записи не вытесняются из ленты, когда она упирается в 500: уходят старые некрупные.

const routine267={
 'Разговор между делами':'разговоры','Увлечение на свободный вечер':'вечера с увлечением','Поиск между делами':'поиски',
 'Вечер без планов':'вечера без планов','Новая маленькая привычка':'новые привычки','Учеба продолжается':'учёба',
 'Книга клуба':'книжный клуб','Симптомы вернулись':'обострения','Обострение закончилось':null,'Восстановление':'выздоровления',
 'Результат учебного периода':'оценки','Отклик в фоновом поиске':'отклики на вакансии','В расписании появилось дело':'новые дела в расписании',
 'Первый шаг с другой стороны':'приглашения на свидание','Друг расстроился из-за встречи':'отменённые встречи'
};

function feed267(){return s.feed267??={week:{},last:{},since:s.clock?.ticks??0};}

function routineLabel267(title){
 if(Object.hasOwn(routine267,title))return routine267[title];
 return String(title).toLowerCase();
}

// Сначала решаем, куда идёт запись, потом отдаём её дальше по цепочке (stories.js сам выбрасывает свою рутину).
const logBase267=log;
log=function(title,text,tag='',major=false,...rest){
 if(!s)return logBase267.call(this,title,text,tag,major,...rest);
 const f=feed267(),tick=s.clock?.ticks??0,key=String(title);
 if(key==='Имущество после утраты'&&window.__quietEstate267)return;
 const routine=Object.hasOwn(routine267,key);
 // Повторы гасим только у зарисовок быта: другие модули после log() помечают «последнюю запись» (moments59),
 // и погашенная запись увела бы метку на чужую.
 const repeat=!major&&tag==='Быт'&&f.last[key]!=null&&tick-f.last[key]<24;
 if(routine||repeat){
  const label=routineLabel267(key);
  if(label)f.week[label]=(f.week[label]||0)+1;
  return;
 }
 f.last[key]=tick;
 // Место для новой записи освобождаем за счёт самой старой некрупной — крупные остаются навсегда.
 if(s.log.length>=499){
  for(let i=s.log.length-1;i>=0;i--)if(!s.log[i].major){s.log.splice(i,1);break;}
 }
 return logBase267.call(this,title,text,tag,major,...rest);
};

// Раз в три месяца — строка «Будни».
const autonomousMonthBase267=autonomousMonth;
autonomousMonth=function(...args){
 const out=autonomousMonthBase267.apply(this,args);
 if(s&&!s.dead&&s.clock&&s.clock.month%3===2)flushWeekdays267();
 return out;
};

function flushWeekdays267(){
 const f=feed267(),items=Object.entries(f.week).filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
 f.week={};
 if(!items.length)return;
 const m=s.clock.month,from=months[(m+10)%12].toLowerCase(),to=months[m].toLowerCase();
 const text=items.slice(0,6).map(([k,n])=>n>1?k+' ×'+n:k).join(', ')+(items.length>6?' и ещё по мелочи':'')+'.';
 const line=text[0].toUpperCase()+text.slice(1);
 logBase267.call(this,'Будни · '+from+' — '+to,line,'Будни',false);
 if(s.log[0])s.log[0].weekdays267=true;
}

// Наследство: окно и запись — для родни, близких и самого игрока; для дальних знакомых дело ведётся молча.
if(typeof openEstate58==='function'){
 const openEstateBase267=openEstate58;
 openEstate58=function(id,...args){
  const p=id==='player'?null:(typeof estatePerson58==='function'?estatePerson58(id):null);
  window.__quietEstate267=!!p&&!(typeof kin27==='function'&&kin27(p))&&(p.bond??0)<50;
  try{return openEstateBase267.call(this,id,...args);}
  finally{window.__quietEstate267=false;}
 };
}
