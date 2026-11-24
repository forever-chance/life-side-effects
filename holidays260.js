'use strict';
// Сборка 260, слой 2: праздники и прогулки в районе (local-events99.js).
// Эффект у вариантов был всегда (настроение, близость, усталость), но игрок его не видел,
// а в ленте писалось «Вы провели немного времени на местном празднике».
// Настроение и близость в подсказках — словами: show() в events.js вырезает их числа из любых подсказок.

const holidayScenes260=[
 'Музыка, очередь за едой, кто-то из знакомых машет издалека.',
 'Толпа, огни и разговоры, которые продолжаются всю дорогу домой.',
 'Шумно, тесно и почему-то хорошо.',
 'Дети носятся между взрослыми, на углу продают что-то жареное и сладкое.',
 'Кто-то включает песню, которую знают все, и пол-улицы подпевает.'
];

function holidayScene260(){return holidayScenes260[Math.floor(Math.random()*holidayScenes260.length)];}

function holidayCompanion260(q){
 const p=q.companion&&living(q.companion);
 return p&&p.country===s.country&&(q.title==='Семейная слава'||!p.city18||p.city18===residenceCity())?p:null;
}

const openDecisionBase260=openDecision24;
openDecision24=function(kind,id,...args){
 const q=s.localEvent99;
 if(kind!=='local99'||!q||q.neighborhood104||!decisionActive24({kind,id}))return openDecisionBase260.call(this,kind,id,...args);
 const friend=holidayCompanion260(q),family=q.family178&&living(q.family178);
 const tired=q.holiday130?' · усталость +2':'';
 const withFriend=friend?' · ближе: '+friend.name:'';
 show(q.title,q.text,[
  {label:'Заглянуть ненадолго',hint:'Настроение лучше'+withFriend+tired,fn:()=>localChoice99(id,'free')},
  ...(family?[{label:'Провести праздник вместе · '+family.name,hint:'Настроение лучше · заметно ближе · общее воспоминание'+tired,fn:()=>localChoice99(id,'family')}]:[]),
  ...(s.age>=18?[{label:'Зайти и взять угощение · '+money(q.price),hint:'Настроение заметно лучше'+withFriend+tired,disabled:expenseAvailable231()<q.price,fn:()=>localChoice99(id,'paid')}]:[]),
  {label:'Отдохнуть дома',hint:'Усталость −4',fn:()=>localChoice99(id,'rest')},
  {label:'Пропустить',hint:'Ничего не меняется',fn:()=>localChoice99(id,'skip')}
 ]);
};

// Запись в ленте называет праздник и людей.
const localChoiceBase260=localChoice99;
localChoice99=function(id,choice,...args){
 const q=s.localEvent99;
 if(!q||q.neighborhood104)return localChoiceBase260.call(this,id,choice,...args);
 const logBase=log;
 log=function(title,text,...rest){
  if(title===q.title){
   if(text==='Вы остались дома и немного отдохнули.')text=`Пока все отмечают «${q.title}», вы остаётесь дома и отсыпаетесь.`;
   else if(text==='Вы провели немного времени на местном празднике.')text=`Вы заглядываете на «${q.title}». ${holidayScene260()}`;
   else if(/^Провели время вместе: /.test(text)){
    const name=text.replace(/^Провели время вместе: /,'').replace(/\.$/,'');
    text=`«${q.title}». ${name} рядом весь вечер. ${holidayScene260()}`;
   }
  }
  return logBase.call(this,title,text,...rest);
 };
 try{return localChoiceBase260.call(this,id,choice,...args);}
 finally{log=logBase;}
};
