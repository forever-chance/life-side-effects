'use strict';
// Under-18 tuition follows the same real parental payment path as application fees.
const educationBase71={payTuition17,programDetailData20,funding16};
payTuition17=function(fee,a,t,pace=1){
 if(s.age>=18)return educationBase71.payTuition17(fee,a,t,pace);
 if(t.paidMonth40===s.clock.ticks)return true;
 if(!tuitionLocation44(t))return false;
 if(!Number.isFinite(fee)||fee<0||!Number.isFinite(pace)||pace<0)return false;
 const amount=fee*pace,key='tuition:'+t.id+':'+s.clock.ticks;
 if(!payExpense23(amount,'Обучение · '+programName26(prog16(t.program)),key)){t.blocked='Родительского бюджета не хватает на оплату обучения';return false;}
 t.paidMonth40=s.clock.ticks;t.blocked=null;return true;
};
programDetailData20=function(p){const d=educationBase71.programDetailData20(p);if(s.age<18)d.sections.push(section20('Оплата до 18 лет',[fact20('Плательщик','Родители — из своего бюджета'),fact20('Личные накопления','Сохраняются; студенческий кредит доступен с 18 лет')]));return d;};

funding16=function(id){
 if(s.age>=18)return educationBase71.funding16(id);
 const x=path16(),a=x.applications.find(a=>a.id===id),p=a&&prog16(a.program);if(!p)return;
 const fee=tuition16(p,a),why=[...admission16(p).why];
 if(a.status!=='accepted')why.push('Сначала примите предложение');
 if(x.study||s.study||s.studyTrack)why.push('Уже идёт другая программа');
 if(p.country!==s.country||p.city!==residenceCity())why.push('Сначала переедьте в город программы');
 if(!permission16(p.country,'study'))why.push('Нужно право учиться');
 if(expenseAvailable231()+.001<fee)why.push('Родительского бюджета не хватает на первый месяц');
 show('Оплата обучения до 18 лет',uni16(p).name+' · '+p.city+'\nПосле стипендии: '+money(fee)+'/мес. До 18 лет родители оплачивают текущие месяцы из своих средств. Личные накопления сохраняются; студенческий кредит доступен с 18.\n'+(why.join('. ')||'Можно начать учёбу.'),[{label:'Начать · оплачивают родители',hidden:s.age<programMinAge16(p),disabled:!!why.length,hint:why.join('; '),fn:()=>studyStart16(id,'family')},{label:'Бюджет и помощь родителей',fn:familyFinance17},{label:'Документы и переезд',fn:()=>openPath16('mobility')}]);
};
