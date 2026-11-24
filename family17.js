'use strict';
const base17={start,intro,ensureUX,bioRows,monthlyFinance,monthlyBudget,homeCost,moveHome,relocateWithFamily,beginFamilyMove,resolvePending,financeMenu,action,finishTask,autonomousMonth,tuitionHelp,studyStart16,finishMove16};
const origins17={nl:['нидерландское','фризское','суринамское'],rs:['сербское','черногорское','венгерское'],ru:['русское','татарское','бурятское'],us:['американское','мексиканское','ирландское'],br:['бразильское','португальское','японское'],jp:['японское','рюкюское','корейское'],fr:['французское','бретонское','алжирское'],es:['испанское','каталонское','баскское'],de:['немецкое','турецкое','сербское'],uk:['английское','шотландское','валлийское'],ca:['канадское','франкоканадское','ирландское'],kr:['корейское','китайское','вьетнамское'],cn:['ханьское','чжуанское','хуэйское'],mx:['мексиканское','сапотекское','майя']};
const migrantOrigins17={nl:'rs',rs:'ru',ru:'rs',us:'mx',br:'jp',jp:'br',fr:'es',es:'mx',de:'rs',uk:'fr',ca:'fr',kr:'cn',cn:'kr',mx:'es'};
if (typeof expansion95 !== 'undefined') {
  for (const [id, entry] of Object.entries(expansion95)) {
    origins17[id] = [entry.origin, entry.origin];
    migrantOrigins17[id] = entry.migrant;
  }
}
// Citizenship claims store the rule applied at birth, separately from registration.
function birthCitizenshipClaims166(birth,parents,year=s?.year,month=s?.clock?.month){
 const claims={};
 for(const parent of parents){
  for(const country of parent.citizenships||[]){
   if(!countries[country])continue;
   claims[country]??={basis:'descent',parent:parent.id??'player'};
  }
 }
 if(['us','ca','br','mx'].includes(birth))claims[birth]??={basis:'birthplace'};
 const germanResidence=year<2024||year===2024&&month<5?8:5;
 if(birth==='de'&&parents.some(p=>p.country===birth&&p.permanentResident&&p.residenceYears>=germanResidence))claims.de??={basis:'settled-parent'};
 if(birth==='uk'&&parents.some(p=>p.country===birth&&p.permanentResident))claims.uk??={basis:'settled-parent'};
 const chineseParents=parents.filter(p=>p.citizenships?.includes('cn'));
 if(birth!=='cn'&&claims.cn&&Object.keys(claims).some(id=>id!=='cn')&&
    chineseParents.every(p=>p.country&&p.country!=='cn'&&p.permanentResident))delete claims.cn;
 const automatic=Object.keys(claims);
 const requiresRegistration=(country,limitMonths)=>{
  claims[country]={...claims[country],basis:'registration',limitMonths};
 };
 if(claims.rs&&birth!=='rs'&&automatic.some(id=>id!=='rs')&&
  !(parents.length>1&&parents.every(p=>p.citizenships?.length===1&&p.citizenships[0]==='rs'))){
  requiresRegistration('rs',23*12);
 }
 if(claims.jp&&birth!=='jp'&&automatic.some(id=>id!=='jp'&&claims[id].basis!=='registration')){
  requiresRegistration('jp',3);
 }
 if(claims.de&&birth!=='de'&&automatic.some(id=>id!=='de'&&claims[id].basis!=='registration')){
  const germanParents=parents.filter(p=>p.citizenships?.includes('de'));
  if(germanParents.length&&germanParents.every(p=>p.birthCountry&&p.birthCountry!=='de'&&
     p.country&&p.country!=='de'&&Number.isInteger(p.birthYear)&&p.birthYear>=2000)){
   requiresRegistration('de',12);
  }
 }
 return claims;
}
function birthCitizenships17(birth,parents,claims=birthCitizenshipClaims166(birth,parents)){
 const active=Object.entries(claims).filter(([,claim])=>claim.basis!=='registration').map(([id])=>id);
 // 257: Китай не признаёт двойное гражданство, но это не отменяет гражданство другой страны по рождению или происхождению.
 return active;
}

const familyNameCountries166={
 сербское:'rs',немецкое:'de',польское:'pl',турецкое:'tr',марокканское:'ma',египетское:'eg',
 итальянское:'it',индийское:'in',китайское:'cn',ханьское:'cn',японское:'jp',русское:'ru',
 испанское:'es',мексиканское:'mx',индонезийское:'id',французское:'fr',франкоканадское:'fr',
 нидерландское:'nl',норвежское:'no',американское:'us',бразильское:'br',корейское:'kr',
 тайское:'th',английское:'uk',австралийское:'au',канадское:'ca',южноафриканское:'za'
};
const extendedFamilyNames167={
 румынское:['Ана Елена Иоана Андрея Ралука Симона','Андрей Михай Влад Штефан Раду Ионуц','Попеску Ионеску Думитреску Стан Стоика Драган Марин'],
 венгерское:['Анна Каталин Эстер Река Жофия Агнеш','Адам Балаж Габор Иштван Ласло Миклош','Надь Ковач Тот Сабо Хорват Варга'],
 украинское:['Оксана Олена Соломия Леся Ирина','Андрий Богдан Тарас Остап Микола','Шевченко Коваленко Бондаренко Ткаченко Олейник'],
 португальское:['Инеш Беатриз Мафалда Леонор Мария','Жуан Тьягу Диогу Афонсу Гонсалу','Силва Сантуш Соуза Феррейра Перейра Кошта'],
 алжирское:['Амина Надия Ясмина Лейла Самира','Карим Рашид Малик Ясин Набиль','Бенали Мансури Белькасем Саиди Хамиди'],
 тунисское:['Амина Инес Марьем Сальма Сирина','Анис Хатем Мехди Сами Вади','Бен-Салем Трабелси Мансур Гхарби'],
 бошнякское:['Амина Эмина Лейла Айла Сельма','Амир Аднан Харис Эмир Самир','Ходжич Хаджич Бегович Бешич'],
 каталонское:['Лайя Нурия Мерсе Марта Жудит','Жорди Пау Марк Ориол Жауме','Пужоль Феррер Соле Вила Серра'],
 фризское:['Фемке Йитске Ньенке Тьитске','Сьерд Йелле Вибе Сипке','Дейкстра Хукстра Баума Талсма'],
 вьетнамское:['Линь Май Лан Хыонг Ань','Минь Хюи Куанг Дык Туан','Нгуен Чан Ле Фам Хоанг'],
 бенгальское:['Аниндита Шрея Рита Мита','Ариндам Дипак Абхиджит Дебашиш','Банерджи Сен Дас Датта Гхош'],
 яванское:['Аю Дьюи Ратих Рара','Буди Агус Джоко Вахью','Прасетьо Сантосо Прамоно Видодо']
};
function familyName166(country,gender,origin){
 const pool=extendedFamilyNames167[origin];
 if(pool)return {given:pick(pool[gender==='m'?1:0].split(' ')),surname:pick(pool[2].split(' '))};
 const originCountry=familyNameCountries166[origin];
 const culture=countries[originCountry]?originCountry:country;
 return {given:pick(countries[culture].names[gender==='m'?1:0]),surname:identitySurname(culture,gender)};
}
function assignFamilyName166(person,country,origin){
 const {given,surname}=familyName166(country,person.gender,origin);
 person.givenName166=given;
 person.surname=surname;
 person.name=[given,surname].filter(Boolean).join(' ');
}
function initializeIdentity17(mode='local'){
 const birth=s.birthCountry||s.country;
 const foreign=migrantOrigins17[birth];
 const parents=s.people.filter(p=>['Мать','Отец'].includes(p.role));
 parents.forEach((p,i)=>{
  const foreignParent=mode==='migrant'||mode==='settled'||mode==='mixed'&&(parents.length===1||i===1);
  const settled=mode==='settled';
  const originCountry=foreignParent?foreign:birth;
  const defaultOrigin=origins17[originCountry][0];
  const origin=typeof demographicOrigin165==='function'
   ? demographicOrigin165(originCountry,foreignParent?null:residenceCity(),Math.random(),mode==='minority'?defaultOrigin:null)
   : null;
  p.birthCountry=originCountry;
  p.birthCity=pick(cities[originCountry]||[countries[originCountry].city]);
  p.birthYear=(s.birthYear??s.year)-(p.age-s.age);
  p.citizenships=settled&&foreignParent&&birth!=='cn'&&originCountry!=='cn'?[birth,originCountry]:[settled?birth:originCountry];
  p.origins=[origin??(mode==='minority'?origins17[birth][1]:defaultOrigin)];
  p.residenceYears=foreignParent&&!settled?2:25;
  p.permanentResident=!foreignParent||settled;
  assignFamilyName166(p,originCountry,p.origins[0]);
 });
 const claims=birthCitizenshipClaims166(birth,parents,s.birthYear??s.year,s.birthMonth);
 s.citizenships=birthCitizenships17(birth,parents,claims);
 s.origins=[...new Set(parents.flatMap(p=>p.origins))];
 s.nationality=s.origins.join(' / ');
 s.identity17={familyMode:mode,birthCountry:birth,source:'Сведения родителей при рождении',
  citizenshipClaims166:claims};
 const x=path16();
 x.permits=[{country:birth,basis:s.citizenships.includes(birth)?'Гражданство по правилам рождения':'Проживание с семьей',work:true,study:true,expires:null}];
 const native=mode==='migrant'?country16[foreign][0]:country16[birth][0];
 if(mode==='migrant'){x.native=[];x.languages[country16[birth][0]]=2;}
 x.languages[native]=6;
 if(!x.native.includes(native))x.native.push(native);
}

function parents17(){return s.people.filter(p=>p.alive&&['Мать','Отец'].includes(p.role));}
function ensureFamily17(){if(!s)return;ensureIndividual();s.family17??={version:17,ledger:[],serial:0,lastMonth:s.clock.ticks,requests:{},agreements:{},household:null};const f=s.family17;for(const p of parents17()){p.privateCash??=0;p.finance17??={incomeRatio:{low:.3,mid:.65,high:1.6}[s.background]||.65,expenseRatio:.45,obligations:0,educationPriority:.65};}if(!s.identity17){s.identity17={source:'Сведения старого сохранения'};if(!(s.citizenships?.length||s.citizenship)&&s.birthCountry){s.citizenships=[s.birthCountry];s.identity17.source='Восстановлено из местной семьи прежней модели; происхождение не назначено';}}if(!f.migratedFunding){f.migratedFunding=true;const t=s.path16?.study||s.studyTrack;if(t?.payer==='family'){const a=s.path16?.applications.find(a=>a.id===t.application)||t;const parent=parents17().find(p=>p.inner.trust>=40);if(parent&&!a.funding17){const fee=t.program?tuition16(prog16(t.program),a):tuitionLocal(t);const old=base17.tuitionHelp(fee);a.funding17={parentId:parent.id,share:fee?Math.min(1,old/fee):1,monthlyCap:old,country:s.country,agreedAt:s.clock.ticks,legacy:true};}}}return f;}
function parentAvailable17(p){return p?.alive?Math.max(0,p.privateCash)*fxRate86(p.country):0;}
function transaction17({key,purpose,initiator='player',participants=[],parts=[],debt=null,recurring=null}){const f=ensureFamily17();if(f.ledger.some(e=>e.key===key))return true;if(parts.some(a=>!Number.isFinite(a.amount)||a.amount<0))return false;const sums={};for(const a of parts)sums[a.payer]=(sums[a.payer]||0)+a.amount;for(const [id,amount]of Object.entries(sums)){const available=id==='player'?Math.max(0,s.cash):parentAvailable17(s.people.find(p=>p.id===id));if(available+1e-6<amount)return false;}for(const [id,amount]of Object.entries(sums)){if(id==='player')s.cash-=amount;else{const p=s.people.find(p=>p.id===id);p.privateCash=Math.max(0,p.privateCash-amount*fxRate86(s.country,p.country));}}f.ledger.push({key,tick:s.clock.ticks,purpose,initiator,participants,decisionMakers:Object.keys(sums),parts,country:s.country,debt,recurring});f.ledger=f.ledger.slice(-300);return true;}
function agreement17(a){if(a)return a.funding17;return path16().applications.find(a=>a.id===path16().study?.application)?.funding17||s.studyTrack?.funding17;}
function tuitionQuote17(fee,a){const g=agreement17(a);if(!g)return {help:0,parts:[]};const p=living(g.parentId);if(!p||p.inner.trust<30)return {help:0,parts:[]};const help=Math.min(fee*g.share,g.monthlyCap*fxRate86(g.country),parentAvailable17(p));return {help,parts:help?[{payer:p.id,amount:help}]:[]};}
tuitionHelp=function(fee,agreement){ensureFamily17();return tuitionQuote17(fee,agreement?.funding17?agreement:agreement?{funding17:agreement}:null).help;};
function payTuition17(fee,a,t,pace=1){const useFamily=['family','familyloan'].includes(t.payer),q=useFamily?tuitionQuote17(fee,a):{help:0,parts:[]};const own=Math.max(0,fee-q.help);const loan=t.payer==='familyloan';if(loan&&q.help+1e-6<fee*(agreement17(a)?.share||0)){t.blocked='Семья пока не может внести обещанную долю. Измените финансирование или возьмите отпуск.';return false;}const parts=q.parts.map(p=>({...p,amount:p.amount*pace}));if(!loan&&own)parts.push({payer:'player',amount:own*pace});const key='tuition:'+t.id+':'+s.clock.ticks;if(ensureFamily17().ledger.some(e=>e.key===key))return true;if(!transaction17({key,purpose:'Обучение',participants:['player'],parts,debt:loan?'Студенческий кредит':null,recurring:'месячный платеж'})){t.blocked='Не хватает неоплаченной доли; прогресс сохранен';return false;}s.familyEducation.spent+=q.help*pace/c().cost;return true;}
function educationSupport17(id,parentId){const f=ensureFamily17(),x=path16(),a=x.applications.find(a=>a.id===id),p=living(parentId),program=a&&prog16(a.program);if(!a||!p||!parents17().includes(p))return;const key='tuition:'+id+':'+p.id;if(s.clock.ticks<(f.requests[key]||0))return toast('К этому разговору можно вернуться через полгода.');f.requests[key]=s.clock.ticks+6;const fee=tuition16(program,a),income=countries[p.country].wage*p.finance17.incomeRatio/12,pBudget=parentAvailable17(p),old=!!a.funding17,agePenalty=Math.max(0,s.age-30)*.008;const willingness=bounded(.2+p.inner.trust*.004+p.inner.affection*.002+p.finance17.educationPriority*.2-agePenalty-(fee>pBudget/3?.15:0),.05,.95);if(p.inner.trust<40||pBudget<fee*.6||Math.random()>willingness){log('Родители не обещают оплату',p.name+': сейчас договориться не удалось. Можно выбрать другой источник или вернуться через полгода.','Семья');return;}const sustainable=(income-(countries[p.country].cost*p.finance17.expenseRatio/12)-p.finance17.obligations)*fxRate86(p.country);const remaining=Math.max(1,program.months-(x.study?.program===program.id?x.study.progress:0));const fullyAffordable=pBudget>=fee*remaining+c().cost*.25||pBudget>=fee*6&&sustainable>=fee;const share=fullyAffordable?1:.6;a.funding17={parentId:p.id,share,monthlyCap:fee*share,country:s.country,agreedAt:s.clock.ticks,reviewAt:s.clock.ticks+6};log(old?'Договоренность обновлена':'Родители согласились помогать',`${p.name}: ${pct(share)} оплаты учебы, до ${money(fee*share)}/мес. Платеж идет напрямую из средств родителя; остаток — ваш источник. Наличие денег проверяется при каждом платеже.`,'Образование',true);}
function supportMenu17(id){const a=path16().applications.find(a=>a.id===id);if(!a)return;show('Кто может оплачивать учебу?','Это просьба о прямой оплате, а не перевод денег студенту. Высокий достаток не гарантирует согласия.',parents17().map(p=>({label:p.name,hint:'Доступно '+money(parentAvailable17(p))+' · доверие '+Math.round(p.inner.trust),fn:()=>educationSupport17(id,p.id)})));}
function fundingChange17(){const x=path16(),t=x.study;if(!t)return;const a=x.applications.find(a=>a.id===t.application);show('Оплата текущей программы','Изменение действует со следующего месяца. Долг по уже оформленному кредиту не исчезает.',[{label:'Попросить оплату у родителей',fn:()=>supportMenu17(a.id)},{label:'Личные средства',fn:()=>{if(t.payer.includes('loan'))return toast('Кредит уже оплатил эту программу.');t.payer='self';}},{label:'Семья и мои средства',disabled:!a.funding17,fn:()=>{if(t.payer.includes('loan'))return toast('Кредит уже оформлен.');t.payer='family';}},{label:'Оформить кредит на оставшуюся личную долю',disabled:t.payer.includes('loan')||activeDebts().some(d=>d.student),fn:()=>financeRemaining17(t,a)}]);}
function financeRemaining17(t,a){const p=prog16(t.program),fee=tuition16(p,a),family=!!a.funding17,help=family?fee*a.funding17.share:0,amount=Math.max(0,(fee-help)*(p.months-t.progress));if(s.age<18||amount<=0)return;const debt={id:id16('student'),type:'bank',student:true,pathStudy:true,country:s.country,studyId:t.id,balance:amount,principal:amount,rate:0,payment:0,term:60,paid:0,missed:0,started:s.clock.ticks};s.debts.push(debt);t.payer=family?'familyloan':'loan';log('Личная доля учебы оплачена кредитом',money(amount)+'. Семейная договоренность сохраняется; выплаты после учебы.','Образование');}
function familyRequest17(parentId,kind,ratio=.05){if(s.age<18&&kind==='loan')return toast('До 18 лет расходы оплачивают родители без долга ребёнка.');const f=ensureFamily17(),p=living(parentId);if(!p||!parents17().includes(p)||s.clock.ticks<(f.requests[p.id]||0))return;f.requests[p.id]=s.clock.ticks+6;const amount=c().cost*ratio,available=parentAvailable17(p),chanceOf=bounded(.15+p.inner.trust*.005+p.inner.affection*.002-amount/Math.max(1,available)*.2,.05,.9);if(available<amount*.3||!chance(chanceOf)){log('Помощь пока невозможна',p.name+': сейчас родитель не готов взять этот расход.','Семья');return;}let granted=Math.min(amount,available*.25),type=kind;if(s.age>=18&&kind==='gift'&&chance(.2))type='loan';const reason=type==='loan'?'Заем с возвратом через 12 месяцев':type==='medical'?'Прямая оплата лечения':type==='move'?'Прямая оплата переезда':'Безвозмездная помощь';show('Предложение · '+p.name,reason+': '+money(granted)+'. При отказе деньги не списываются.',[{label:'Принять',fn:()=>{if(type==='medical'){if(!s.illness||s.illness.treated)return;const fee=c().cost*(s.country==='us'?.04:.008);if(granted<fee)return toast('Предложенная помощь меньше стоимости лечения. Можно попросить подарок или заем.');granted=fee;}if(type==='move'){s.family17.moveSupport={parentId:p.id,limit:granted,country:s.country,expires:s.clock.ticks+6};log('Родитель готов оплатить переезд',p.name+': до '+money(granted)+', деньги спишутся при переезде.','Семья');return;}if(!transaction17({key:'aid:'+parentId+':'+s.clock.ticks,purpose:reason,initiator:'player',participants:['player'],parts:[{payer:p.id,amount:granted}],debt:type==='loan'?'family':null}))return toast('У родителя больше нет этой суммы.');if(type==='medical'){s.illness.treated=true;s.illness.left=2;}else{s.cash+=granted;if(type==='loan')s.debts.push({id:id16('family-loan'),type:'friend',personId:p.id,country:s.country,balance:granted,principal:granted,paid:0,rate:0,missed:0,due:s.clock.ticks+12,started:s.clock.ticks});}log('Помощь принята',p.name+' · '+reason+' · '+money(granted),'Семья',true);}},{label:'Отказаться',fn:()=>{}}]);}
function familyFinance17(){ensureFamily17();show('Деньги семьи','Личные накопления и средства родителей разделены. Бюджет домохозяйства — договоренность о расходах, не дополнительный кошелек с дублирующимися деньгами.',parents17().map(p=>({label:p.name+' · '+money(parentAvailable17(p)),hint:'Средства родителя в вашей покупательной способности',fn:()=>show(p.name,'Просьбы ограничены шестью месяцами; возможны отказ, частичная помощь или заем вместо подарка.',[{label:'Попросить помощь без возврата',fn:()=>familyRequest17(p.id,'gift')},{label:'Попросить взаймы',hidden:s.age<18,disabled:s.age<18,fn:()=>familyRequest17(p.id,'loan')},{label:'Попросить оплатить лечение',disabled:!s.illness||s.illness.treated,fn:()=>familyRequest17(p.id,'medical',s.country==='us'?.04:.008)},{label:'Попросить оплатить переезд',fn:()=>familyRequest17(p.id,'move',.12)},{label:'Попросить оплатить университет',disabled:!path16().applications.some(a=>['offered','accepted','enrolled'].includes(a.status)),fn:()=>show('Выберите программу','Договоренность относится к конкретному предложению.',path16().applications.filter(a=>['offered','accepted','enrolled'].includes(a.status)).map(a=>({label:uni16(prog16(a.program)).name,fn:()=>educationSupport17(a.id,p.id)})))}])})));}
function familyMonthly17(){const f=ensureFamily17();if(f.lastMonth===s.clock.ticks)return;f.lastMonth=s.clock.ticks;for(const p of parents17()){const a=p.finance17,income=countries[p.country].wage*a.incomeRatio/12,expenses=countries[p.country].cost*a.expenseRatio/12+a.obligations;p.privateCash=Math.max(0,p.privateCash+income-expenses);a.lastIncome=income;a.lastExpenses=expenses;}if(f.household&&s.housing.mode!=='parents')f.household=null;}
function housingDeal17(parentId){const p=living(parentId);if(!p)return null;const free=parentAvailable17(p)>c().cost*.5&&p.inner.trust>=60&&!s.job;return {parentId,share:free?0:s.job?.15:.05,agreedAt:s.clock.ticks,free,personalRatio:.18};}
function parentLiving17(){const f=ensureFamily17(),h=s.housing;if(h.mode!=='parents'||!h.active)return null;const p=living(h.occupant)||parents17().find(p=>p.country===s.country);if(!p)return null;if(!f.household||f.household.parentId!==p.id)f.household=housingDeal17(p.id);return f.household;}
function householdAdjustment17(){const deal=parentLiving17();if(!deal)return 0;const old=c().cost*.55/12+base17.homeCost();const desired=c().cost*(deal.personalRatio+deal.share)/12;return old-desired;}
homeCost=function(){const deal=parentLiving17();return deal?c().cost*deal.share/12:base17.homeCost()};
monthlyFinance=function(){familyMonthly17();const adjustment=s.age>=18&&typeof settleHousehold39!=='function'?householdAdjustment17():0;base17.monthlyFinance();if(adjustment){const deal=parentLiving17();const correction=c().cost*.55/12+homeCost()-c().cost*(deal.personalRatio+deal.share)/12;s.cash+=correction;s.clock.spent-=correction;const p=living(deal.parentId);if(p)p.privateCash+=homeCost()*fxRate86(s.country,p.country);const support=c().cost*(.55-deal.personalRatio)/12;if(p){const paid=Math.min(parentAvailable17(p),support);transaction17({key:'household:'+s.clock.ticks,purpose:'Проживание взрослого ребенка',initiator:p.id,participants:['player',p.id],parts:[{payer:p.id,amount:paid}],recurring:'месяц'});if(paid<support){s.cash-=support-paid;s.clock.spent+=support-paid;}}}};
monthlyBudget=function(){const b=base17.monthlyBudget(),deal=parentLiving17();if(deal&&s.age>=18){const correction=c().cost*(.55-deal.personalRatio)/12;b.cost-=correction;b.free+=correction;const shortfall=Math.max(0,correction-parentAvailable17(living(deal.parentId)));b.cost+=shortfall;b.free-=shortfall;}return b;};
function relocationCharge17(country,cost,parentId){const f=ensureFamily17(),support=f.moveSupport,p=living(parentId);let payer=null,amount=0;if(s.age<18&&p){payer=p.id;amount=cost;}else if(support&&support.expires>=s.clock.ticks){payer=support.parentId;amount=Math.min(cost,support.limit*fxRate86(support.country));}const parts=[];if(amount)parts.push({payer,amount});if(cost>amount)parts.push({payer:'player',amount:cost-amount});if(!transaction17({key:id16('move-charge'),purpose:'Переезд',participants:['player',parentId].filter(Boolean),parts,recurring:'Новый адрес'}))return false;if(support)f.moveSupport=null;return true;}
relocateWithFamily=function(country,hostId=null,cost=0){ensureFamily17();if(s.age>=18&&country!==s.country&&!permission16(country,'study')){openPath16('mobility');return toast('Сначала необходимо разрешение на проживание.');}if(!relocationCharge17(country,cost,hostId))return toast('У выбранных плательщиков не хватает средств.');base17.relocateWithFamily(country,hostId,0);s.family17.household=hostId?housingDeal17(hostId):null;return true;};
function beginFamilyMove17(parent,country){const f=ensureFamily17();if(!parent?.alive||country===parent.country||f.familyMove)return;const from=parent.country,group=s.people.filter(p=>p.alive&&p.country===from&&(['Мать','Отец'].includes(p.role)||['Брат','Сестра'].includes(p.role)&&p.age<18));const cost=countries[from].cost*.25*fxRate86(from);const payers=group.filter(p=>['Мать','Отец'].includes(p.role));let remaining=cost;const parts=payers.map(p=>{const amount=Math.min(remaining,parentAvailable17(p));remaining-=amount;return {payer:p.id,amount};}).filter(a=>a.amount);if(remaining>0)return log('Семейный переезд отложен','Родители не накопили бюджет. Деньги ребенка не используются.','Семья');f.familyMove={id:id16('family-move'),parentId:parent.id,from,country,participants:group.map(p=>p.id),paymentCountry:s.country,parts,roll:Math.random(),probability:.8};task16('familyMove17','Документы и переезд семьи · '+countries[country].name,3,{moveId:f.familyMove.id},0);s.mobility.lastFamilyTick=s.clock.ticks;log('Родители готовят переезд','Они оформляют разрешения и оплачивают поездку из своих средств. Ответ не гарантирован.','Семья');}
beginFamilyMove=beginFamilyMove17;
function completeFamilyMove17(t){const f=ensureFamily17(),m=f.familyMove;if(!m||m.id!==t.moveId)return;f.familyMove=null;const parent=living(m.parentId);if(!parent||parent.country!==m.from||m.roll>=m.probability)return log('Семейный переезд не состоялся','Документы не одобрены или обстоятельства изменились. Расходы на поездку не списаны.','Семья');const parts=m.parts.map(p=>({...p,amount:p.amount*fxRate86(m.paymentCountry||m.from)}));
 const petTravel=typeof familyPetMove183==='function'?familyPetMove183(m):0;
 if(petTravel)parts.push({payer:parent.id,amount:petTravel});
 if(!transaction17({key:m.id,purpose:petTravel?'Семейная релокация и перевозка питомцев':'Семейная релокация',initiator:parent.id,participants:[...m.participants,...(s.age<18?['player']:[])],parts,recurring:'Новый адрес семьи'}))return log('Семья отложила переезд','На дату отъезда у родителей недостаточно средств.','Семья');for(const id of m.participants){const p=living(id);if(p){const ratio=fxRate86(p.country,m.country);p.privateCash*=ratio;p.country=m.country;p.residence17={country:m.country,basis:'Семейное разрешение',expires:s.clock.ticks+36};}}if(s.age<18&&s.country===m.from){base17.relocateWithFamily(m.country,parent.id,0);s.family17.household=housingDeal17(parent.id);log('Семья переехала','Документы одобрены. Расходы оплатили родители; личные накопления ребенка не использовались.','Семья',true);}else {queueOnce({type:'familyMove',id:parent.id,country:m.country,from:m.from});log('Родители приглашают переехать',parent.name+': '+countries[m.country].name+'. Можно присоединиться или остаться.', 'Семья',true,typeof pendingRef24==='function'?pendingRef24('familyMove'):null);}}
returnParentsMenu=function(){show('Вернуться к родителям','Можно договориться о бесплатном проживании или участии в расходах. Международное возвращение требует права на проживание. Сначала можно попросить родителя оплатить дорогу.',parents17().map(p=>({label:p.name+' · '+countries[p.country].name,hint:'Дорога '+money(c().cost*(p.country===s.country?.015:.12)),disabled:p.inner.trust<40,fn:()=>{const ok=relocateWithFamily(p.country,p.id,c().cost*(p.country===s.country?.015:.12));if(ok)log('Снова под одной крышей','Прежняя аренда прекращена. Личные расходы и согласованная доля бюджета пересчитаны.','Жилье',true);}})))};
function fundingMenu17(id){const a=path16().applications.find(a=>a.id===id),p=prog16(a.program),fee=tuition16(p,a),q=tuitionQuote17(fee,a);show('Финансирование программы',`Учеба после стипендии: ${money(fee)}/мес. Родители по договоренности: ${money(q.help)}. Остаток: ${money(fee-q.help)}. Списывается только текущий месяц; все многолетнее обучение заранее оплачивать не нужно.`,[{label:'Попросить оплату у родителей',fn:()=>supportMenu17(id)},{label:'Начать · свои средства',fn:()=>studyStart16(id,'self')},{label:'Начать · родители и свои средства',disabled:!a.funding17,fn:()=>studyStart16(id,'family')},{label:'Начать · родители и кредит на остаток',hidden:s.age<18,disabled:!a.funding17||s.age<18,fn:()=>startFamilyLoan17(id)},{label:'Начать · кредит на всю учебу',hidden:s.age<18,disabled:s.age<18,fn:()=>studyStart16(id,'loan')}]);}
funding16=fundingMenu17;
function startFamilyLoan17(id){studyStart16(id,'familyloan');}

intro=function(){base17.intro();const app=$('#app');if(app.innerHTML.includes('id="familyOrigin17"'))return;app.innerHTML=app.innerHTML.replace('<button class="primary" onclick="start()"',`<label class="field">Происхождение семьи<select id="familyOrigin17"><option value="random">Случайная семья</option><option value="local">Местная семья граждан страны</option><option value="minority">Местная семья другого происхождения</option><option value="migrant">Семья недавно переехавших мигрантов</option><option value="mixed">Родители из разных стран</option><option value="settled">Родители переехали и уже получили местное гражданство</option></select></label><label class="field">С кем проходит детство<select id="familyHousehold131"><option value="random">Случайно</option><option value="both">С обоими родителями</option><option value="one">С одним родителем</option><option value="unknown">Второй родитель неизвестен</option></select></label><button class="primary" onclick="start()"`);};
// Game design baseline dated 2021-12-31. Values are model inputs.
const familyRates133={
 nl:{singleBirth:0.06,separationPerThousand:10},
 rs:{singleBirth:0.06,separationPerThousand:12},
 ru:{singleBirth:0.1,separationPerThousand:20},
 us:{singleBirth:0.12,separationPerThousand:18},
 br:{singleBirth:0.13,separationPerThousand:14},
 jp:{singleBirth:0.04,separationPerThousand:8},
 fr:{singleBirth:0.1,separationPerThousand:16},
 es:{singleBirth:0.07,separationPerThousand:12},
 de:{singleBirth:0.07,separationPerThousand:12},
 uk:{singleBirth:0.09,separationPerThousand:14},
 ca:{singleBirth:0.09,separationPerThousand:14},
 kr:{singleBirth:0.03,separationPerThousand:8},
 cn:{singleBirth:0.04,separationPerThousand:9},
 mx:{singleBirth:0.11,separationPerThousand:14},
 it:{singleBirth:0.05,separationPerThousand:10},
 au:{singleBirth:0.08,separationPerThousand:14},
 tr:{singleBirth:0.03,separationPerThousand:10},
 za:{singleBirth:0.18,separationPerThousand:14},
 th:{singleBirth:0.08,separationPerThousand:11},
 no:{singleBirth:0.08,separationPerThousand:13},
 in:{singleBirth:0.07,separationPerThousand:11},
 id:{singleBirth:0.06,separationPerThousand:10},
 eg:{singleBirth:0.04,separationPerThousand:8},
 ma:{singleBirth:0.06,separationPerThousand:9},
 pl:{singleBirth:0.04,separationPerThousand:8}
};
function singleParentStart131(unknown=false) {
 const parents=parents17();
 if(parents.length<2)return;
 const caregiver=pick(parents.filter(p=>p.country===s.country).length?
  parents.filter(p=>p.country===s.country):parents);
 const other=parents.find(p=>p!==caregiver);
 s.family17.childhood131={caregiverId:caregiver.id,otherParentId:unknown?null:other.id,
  unknown,contact:!unknown&&chance(.72),support:!unknown&&chance(.55)};
 if(!s.family17.childhood131.contact&&!unknown)other.bond=Math.min(other.bond,25);
 if(s.age<18&&s.housing.mode==='parents')s.housing.occupant=caregiver.id;
 const unions=s.family27?.unions;
 if(unions)s.family27.unions=unions.filter(u=>!originalParents132(u));
 const birth=s.log.find(entry=>entry.age===0&&entry.title==='У этой истории появилось имя');
 if(unknown){
  s.people=s.people.filter(p=>p!==other);
  for(const p of s.people){
   if(p.bio27?.parents)p.bio27.parents=p.bio27.parents.filter(id=>id!==other.id);
  }
  if(s.events54?.known)delete s.events54.known[other.id];
  if(birth)birth.text=s.name+'. '+(s.birthCity||c().city)+'.';
 }
 if(birth)birth.text+=' С рождения ты '+(s.gender==='f'?'жила':'жил')+
  ' с одним из родителей ('+caregiver.name+'). '+(unknown?'Второй родитель неизвестен.':
   'Второй родитель ('+other.name+') '+(other.gender==='f'?'жила':'жил')+' отдельно.');
}

function createGrandparents145(){
 if(typeof familyState27!=='function')return;
 familyState27();
 for(const parent of parents17()){
  for(const [role,gender] of [['Бабушка','f'],['Дедушка','m']]){
   if(parent.bio27.parents.some(id=>s.people.some(p=>p.id===id&&p.gender===gender)))continue;
   const grandparent=person(role,parent.age+rnd(19,34),gender,parent.birthCountry||parent.country);
   assignFamilyName166(grandparent,parent.birthCountry||parent.country,parent.origins?.[0]);
   enrichPerson(grandparent);
   grandparent.privateCash=countries[grandparent.country].cost*.25;
   grandparent.origins=[...(parent.origins||[])];
   grandparent.citizenships=[...(parent.citizenships||[])];
   s.people.push(grandparent);
   if(s.events54?.known)s.events54.known[grandparent.id]=true;
   parent.bio27.parents.push(grandparent.id);
  }
 }
 familyState27();
}

start=function(){
 const mode=$('#familyOrigin17')?.value||'local';
 const household=$('#familyHousehold131')?.value;
 const suppliedName=$('#name')?.value?.trim();
 base17.start();
 ensureFamily17();
 const single=household==='one'||household==='unknown'||
  household==='random'&&chance(familyRates133[s.birthCountry]?.singleBirth??.12);
 if(single)singleParentStart131(household==='unknown'||household==='random'&&chance(.15));
 initializeIdentity17(['local','minority','migrant','mixed','settled'].includes(mode)?mode:pick(['local','local','minority','migrant','mixed','settled']));
 if(!suppliedName){
  const birth=s.birthCountry||s.country;
  s.name=familyName166(birth,s.gender,s.origins.length===1?s.origins[0]:null).given;
  const parent=parents17().find(p=>p.id===s.family17.childhood131?.caregiverId)??parents17()[0];
  if(parent?.surname)s.surname=parent.surname;
 }
 const entry=s.log.find(q=>q.age===0&&q.title==='У этой истории появилось имя');
 s.birthCity??=residenceCity();
 if(entry&&typeof familyBirthText166==='function')entry.text=familyBirthText166();
 ensureFamily17();
 createGrandparents145();
 s.grandparentLines147=true;
 for(const p of parents17())p.privateCash=countries[p.country].cost*({low:.08,mid:.6,high:3}[s.background]||.6);
 save();
 render();
};
ensureUX=function(){base17.ensureUX();ensureFamily17()};
bioRows=function(){const rows=base17.bioRows(),birth=rows.find(r=>r[0]==='origin');birth[1]='Страна рождения';birth[2]=countries[s.birthCountry]?.name||'Нет данных';birth[3]='Место рождения не определяет автоматически гражданство или этническое происхождение.';const origin=rows.find(r=>r[0]==='nationality');origin[1]='Национальное происхождение';origin[2]=s.origins?.join(' / ')||s.nationality||'Не записано';origin[3]='Происхождение семьи. Не влияет на способности, доходы или характер.';return rows;};
financeMenu=function(){show('Личные и семейные деньги','Собственные деньги, подарки, долги и прямая оплата — разные операции.',[{label:'Мой бюджет и долги',fn:base17.financeMenu},{label:'Помощь и бюджет родителей',fn:familyFinance17}]);};
finishTask=function(t){if(t.kind==='familyMove17'){if(['cancelled','paused','completed'].includes(t.state))return;completeFamilyMove17(t);archiveTask05(t,'completed');return;}base17.finishTask(t)};

if(s){ensureFamily17();save();render()}else intro();
