'use strict';

// Gameplay thresholds for a settlement route. They do not encode legal eligibility.
function settlementQuote124() {
 const country = s.country;
 const residence = citizenshipState231();
 const permit = path16().permits.find(p => p.country===country && p.permanent);
 const months = residence.country===country ? Math.max(0,s.clock.ticks-residence.since) : 0;
 const required = Math.min(60,citizenshipRules231[country].months);
 const reasons = [];
 if (s.dead || s.age<18) reasons.push('Подача доступна совершеннолетнему персонажу');
 if (citizenRight31(country) || permit) reasons.push('Бессрочное право проживания уже есть');
 if (months<required) reasons.push('До минимального срока ещё '+(required-months)+' мес.');
 const qualifying = path16().permits.some(p=>validPermit31(p,country)&&p.work&&p.study&&!studyPermit31(p));
 if (!qualifying) reasons.push('Нужно действующее разрешение на проживание с правом работы и учёбы');
 const fee = Math.round(c().cost*.01);
 return {country,months,required,reasons,fee};
}

function settle124(expectedCountry) {
 const q = settlementQuote124();
 if (q.country!==expectedCountry || q.reasons.length || expenseAvailable231()<q.fee) return false;
 if (!spend231(q.fee,'Постоянное проживание')) return false;
 path16().permits.push({country:q.country,basis:'ПМЖ',permanent:true,work:true,study:true,expires:null});
 log('Получено постоянное проживание',countries[q.country].name+'. Разрешение бессрочное.','Документы',true);
 save();
 return true;
}

function settlementMenu124() {
 const q = settlementQuote124();
 show('Постоянное проживание','Игровая процедура. Срок проживания '+q.months+' из '+q.required+' мес. Сбор '+money(q.fee)+'.\n'+q.reasons.join('. '),[
  {label:'Оформить ПМЖ',disabled:!!q.reasons.length||expenseAvailable231()<q.fee,fn:()=>{
   if (!settle124(q.country)) toast('Условия оформления изменились.');
   settlementMenu124();
  }},
  {label:'Все документы',fn:()=>openPath16('mobility')}
 ]);
}
