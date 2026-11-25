'use strict';
// Сборка 273, шаг 1: причина под серой кнопкой в старых окнах, которые ещё не переведены на карточку.
// Такие окна передают в show() только disabled:true, а почему — знает лишь условие рядом. Здесь для каждого окна
// записано то же условие словами. Окно находится по заголовку (строка, выражение или функция), кнопка — по подписи.
// windows273.js (show) берёт отсюда причину, если у варианта нет своих why/reason, и ставит её под подписью.
// Ничего не меняет в игре и в сохранении: только читает состояние в момент показа окна.
// Новое окно с серыми кнопками лучше сразу давать вариантам поле why — тогда сюда ничего добавлять не нужно.

const why273=[];
function addWhy273(title,why){why273.push({title,why});}
function money273(n){return money(Math.max(0,n));}
function since273(tick){const [m,y]=String(dateLabel86(tick)).split(' ');const of={Январь:'января',Февраль:'февраля',Март:'марта',Апрель:'апреля',Май:'мая',Июнь:'июня',Июль:'июля',Август:'августа',Сентябрь:'сентября',Октябрь:'октября',Ноябрь:'ноября',Декабрь:'декабря'};return 'снова можно с '+(of[m]||String(m).toLowerCase())+' '+y;}

// «Нагрузка и восстановление» (crisis29).
addWhy273('Нагрузка и восстановление',label=>{
 if(label==='Сократить рабочие часы и доход'&&!s.job)return 'Сейчас у вас нет работы';
 if(label==='Академический отпуск: последствия'&&!path16().study)return 'Сейчас вы не учитесь';
 return '';
});

// «Распределение денег» (finance40).
addWhy273('Распределение денег',label=>{
 if(label!=='Распределить остаток денег сейчас')return '';
 if(typeof period40==='function'&&!period40())return 'Счета этого месяца ещё не выставлены';
 if(typeof unpaidRows40==='function'&&!unpaidRows40().length)return 'Неоплаченных счетов нет';
 if(s.cash<=0)return 'Свободных денег нет';
 return '';
});

// «Поездки и отпуск» (travel52): новая поездка — когда закончится текущая.
addWhy273('Поездки и отпуск',label=>{
 if(!['Поездка по стране','Отпуск за границей'].includes(label))return '';
 if(s.age<18)return 'Самостоятельные поездки — с 18 лет';
 const t=typeof travelActive52==='function'&&travelActive52();
 return t?'Сначала закончится поездка · '+t.city:'';
});

// «Трудовой договор» (documents45).
addWhy273('Трудовой договор',label=>{
 const q=s.job?.contract45,t=s.clock.ticks;
 if(!q)return '';
 if(label==='Запросить продление договора'){
  if(q.type!=='fixed')return 'Договор бессрочный — продлевать нечего';
  if(q.pending)return 'Разговор о продлении уже идёт';
  if(q.until-t>3)return 'Продление обсуждают за 3 месяца до конца договора — '+since273(q.until-3).replace('снова можно ','можно ');
  if(t<(q.retry||0))return 'После отказа '+since273(q.retry);
 }
 if(label==='Принять предложенное продление на 12 месяцев'){
  if(!q.offer)return 'Работодатель пока не предлагал продление';
  if(q.offer.expires<t)return 'Срок ответа на предложение прошёл';
 }
 return '';
});

// «Быт и договорённости» (family54).
addWhy273('Быт и договорённости',label=>{
 const p=typeof currentPartner==='function'?currentPartner():null,a=typeof householdDeal54==='function'?householdDeal54():null;
 if(!p)return 'У вас нет партнёра';
 const local=typeof coupleLocal54==='function'?coupleLocal54(p):true;
 const away=()=>s.age<18||p.age<18?'Это решают с 18 лет':p.country!==s.country?'Партнёр живёт в другой стране':'Партнёр живёт в другом городе';
 if(label==='Обсудить съезд'||label==='Обсудить раздельное жильё')return local?'':away();
 if(label==='Запланировать время вдвоём')return '';
 if(!local)return away();
 if(['Распределить общие расходы','Распределить домашние дела'].includes(label))return p.cohabit?'':'Вы живёте раздельно';
 if(!p.cohabit)return 'Вы живёте раздельно';
 if(!a)return 'Сначала договоритесь о расходах или делах';
 if(label==='Дать друг другу тихий вечер'&&a.lastAlone===s.clock.ticks)return 'Тихий вечер в этом месяце уже был';
 return '';
});

// «Постоянное проживание» (settlement124) и «Гражданство новой страны» (documents45): первая причина из той же проверки.
addWhy273('Постоянное проживание',label=>{
 if(label!=='Оформить ПМЖ'||typeof settlementQuote124!=='function')return '';
 const q=settlementQuote124();
 if(q.reasons?.length)return q.reasons[0];
 return expenseAvailable231()<q.fee?'На сбор нужно '+money273(q.fee)+' — сейчас доступно '+money273(expenseAvailable231()):'';
});
addWhy273('Гражданство новой страны',label=>{
 if(label!=='Начать процедуру гражданства'||typeof naturalizationQuote45!=='function')return '';
 const q=naturalizationQuote45();
 if(q.reasons?.length)return q.reasons[0];
 return s.cash<q.fee?'На сбор нужно '+money273(q.fee)+' — сейчас есть '+money273(s.cash):'';
});
// «Гражданство семьи» (family231).
addWhy273('Гражданство семьи',label=>{
 if(label!=='Согласиться на оформление'||typeof citizenshipState231!=='function')return '';
 const q=citizenshipState231().application;
 return q?.status==='processing'?'Родители уже оформляют документы':q?.status==='completed'?'Гражданство уже оформлено':q?.status==='cancelled'?'Оформление отменено':'Срок проживания для семейного оформления ещё не набран';
});

// «Помощь родителей на жизнь» (students68).
addWhy273('Помощь родителей на жизнь',label=>{
 const z=typeof students68==='function'?students68():null,plan=z?.support;
 const age=()=>s.age<18?'Помощь на жизнь — с 18 лет':'Помощь на жизнь — до 25 лет, при учёбе до 30';
 const amount=()=>{try{return livingQuote68().amount;}catch(e){return 1;}};
 if(label==='Договориться о ежемесячной помощи'){
  if(typeof youngSupport68==='function'&&!youngSupport68())return age();
  if(amount()<1)return 'Родителям сейчас нечем помочь';
 }
 if(label==='Остановить регулярную помощь'&&plan?.status!=='active')return 'Регулярной помощи сейчас нет';
 if(label==='Попросить помочь закрыть старые счета'){
  if(typeof youngSupport68==='function'&&!youngSupport68())return age();
  if(typeof billDebts61==='function'&&!billDebts61().length)return 'Старых счетов нет';
  if(amount()<1)return 'Родителям сейчас нечем помочь';
 }
 return '';
});

// «Оплата текущей учёбы» (development22).
addWhy273('Оплата текущей учёбы',label=>{
 const t=path16().study;
 if(!t)return '';
 if(['loan','familyloan'].includes(t.payer))return 'Учёба оплачивается кредитом — способ оплаты уже не поменять';
 const a=path16().applications.find(a=>a.id===t.application),g=typeof sponsor22==='function'?sponsor22(t.program):null;
 if(/^Компания/.test(label)&&!g)return 'Компания не оплачивает эту программу';
 if(label==='Компания, родители и помесячный кредит'&&typeof activeDebts==='function'&&activeDebts().some(d=>d.student&&d.studyId!==t.id))return 'Уже есть учебный кредит за другую программу';
 if(label==='Родители и личные средства'&&!a?.funding17)return 'Родители не договаривались платить за эту учёбу';
 return '';
});

// «Жильё и дорога» (housing, housing41).
addWhy273('Жильё и дорога',label=>label==='Искать работу ближе к дому'&&!s.job?'Сейчас у вас нет работы':'');

// «Счёт учебного периода» (tuition44).
addWhy273('Счёт учебного периода',label=>{
 const t=typeof tuitionCurrent44==='function'?tuitionCurrent44():null,i=t&&tuitionInvoice44(t);
 if(!t)return '';
 if(label==='Внести указанную сумму'||label==='Закрыть счёт с помощью семьи / компании'){
  const q=tuitionQuote44(t,i);
  if(q.reason)return q.reason;
  if(i?.status==='funded')return 'Счёт этого периода уже оплачен';
  if(t.paidMonth40===s.clock.ticks)return 'За этот месяц уже заплачено';
  if(typeof tuitionLocation44==='function'&&!tuitionLocation44(t))return 'Платить можно, пока вы в стране учёбы';
  return '';
 }
 if(label==='Вернуть незачтённый взнос и взять перерыв')return !i?'Счёта за этот период ещё нет':i.status==='funded'?'Счёт уже оплачен — возвращать нечего':'Счёт закрыт';
 return '';
});

// «… · возраст и помощь» (aging58).
addWhy273(/ · возраст и помощь$/,label=>{
 if(label==='Обсудить помощника за счёт близкого')return 'Своих денег на помощника не хватает';
 if(/^Нанять помощника · /.test(label))return 'Свободных денег меньше, чем стоит помощник: доступно '+money273(expenseAvailable231());
 if(/^Помогать самому · /.test(label))return 'Вы живёте в разных городах';
 return '';
});

// Просьбы детей (children55): та же проверка childRequestWhy55, что выключает кнопку.
addWhy273(title=>!!s.childhood55?.requests?.some(q=>q.title===title),(label,o,title)=>{
 if(!['Разрешить и организовать','Разрешить один перерыв','Выслушать и поддержать','Обсудить и отложить решение'].includes(label))return '';
 const q=childhood55().requests.find(q=>q.title===title&&(q.status==='offered'||typeof childRequestActive55!=='function'||childRequestActive55(q)))||childhood55().requests.find(q=>q.title===title);
 if(!q)return '';
 if(label==='Обсудить и отложить решение')return 'Разговор закрыт или срок ответа истёк';
 const why=typeof childRequestWhy55==='function'?childRequestWhy55(q):[];
 return why[0]||'';
});
