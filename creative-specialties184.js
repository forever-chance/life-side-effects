'use strict';

const specialties184={
 cinema:{screenplay:'Сценарий',direction:'Режиссура',acting:'Актёрство',camera:'Операторская работа',editing:'Монтаж',producing:'Продюсирование'},
 literature:{prose:'Проза',short:'Рассказы',poetry:'Поэзия',drama:'Драматургия'},
 translation:{fiction:'Художественная проза',poetry:'Поэзия'},
 finearts:{illustration:'Иллюстрация',painting:'Живопись',digital:'Цифровое искусство',comics:'Комиксы'},
 music:{composition:'Композиция',performance:'Исполнение',soundtrack:'Саундтрек',arrangement:'Аранжировка'},
 theatre:{acting:'Актёрство',direction:'Режиссура',drama:'Драматургия',stage:'Сценография'},
 journalism:{report:'Репортаж',interview:'Интервью',review:'Рецензия',investigation:'Расследование'},
 publishing:{editing:'Редактура',layout:'Вёрстка'}
};

function creativeFocus184(track,works=creative47().works,random=Math.random){
 const keys=Object.keys(specialties184[track]||{});
 if(!keys.length)return null;
 const recent=works.filter(w=>w.track===track&&keys.includes(w.specialty184)).slice(-12);
 const scores=keys.map(key=>recent.reduce((sum,w,i)=>sum+(w.specialty184===key?(1+i/recent.length)*(.5+w.quality/100):0),0));
 const best=scores.indexOf(Math.max(...scores));
 const same=recent.filter(w=>w.specialty184===keys[best]).length;
 if(same<2||scores.filter(score=>score===scores[best]).length>1)return keys[Math.floor(random()*keys.length)];
 if(random()<([0,0,2/3,.75,.8][same]??.85))return keys[best];
 const alternatives=keys.filter((_,i)=>i!==best);
 return alternatives[Math.floor(random()*alternatives.length)];
}

function creativeBrief184(offer,tier){
 const key=creativeFocus184(offer.track);
 if(!key)return offer;
 offer.specialty184=key;
 offer.level184=tier+1;
 if(tier&&(offer.track!=='cinema'||typeof cinemaInvitation191!=='function')){
  const previous=creative47().works.filter(w=>w.track===offer.track&&w.specialty184===key&&w.quality>=55);
  const best=Math.max(0,...previous.map(w=>w.level184||1));
  const chance=[0,.27,.13,.08,.045,.02][best]||0;
  if(best>=1&&previous.length>=2&&Math.random()<chance){
   offer.level184=best+1;
   offer.skill=Math.min(85,35+best*10);
   offer.samples=Math.min(6,best+1);
   offer.fee=Math.round(offer.fee*(1+best*.6));
   offer.duration+=best;
  }
 }
 const label=specialties184[offer.track][key];
 if(offer.track==='cinema'){
  offer.title=label+' · '+(['','короткий метр','независимый короткий метр','малобюджетный полный метр','сериал или студийный фильм','крупный проект','международный проект'][offer.level184]);
  if(key==='acting'){offer.kind='casting';offer.language=3;}
 }else offer.title=label+' · '+offer.title;
 return offer;
}

const sampleBase184=sampleWork47;
sampleWork47=function(track,key,story189){
 if(key&&!specialties184[track]?.[key])return false;
 if(!sampleBase184(track))return false;
 if(key||story189){
  const task=creativeTasks47().at(-1);
  if(story189)task.story189={...story189,title:story189.title||task.title47};
  task.specialty184=key;
  task.title47=task.label=story189?.title||(key?specialties184[track][key]+' · '+task.title47:task.title47);
  save();
 }
 return true;
};

const trackMenuBase184=creativeTrackMenu47;
creativeTrackMenu47=function(track){
 const keys=Object.entries(specialties184[track]||{});
 if(!keys.length)return trackMenuBase184(track);
 const base=show;
 show=function(title,text,options,...rest){
  return base(title,text,[{label:'Запланировать работу по специализации',fn:()=>show(
   'Специализация · '+trackNames46[track],'Выбранная специализация сохранится в портфолио после завершения работы.',
   keys.map(([key,label])=>({label,fn:()=>track==='cinema'&&typeof storyForm189==='function'?storyForm189('film',key):sampleWork47(track,key)}))
  )},...options],...rest);
 };
 try{return trackMenuBase184(track);}finally{show=base;}
};
