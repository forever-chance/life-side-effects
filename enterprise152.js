'use strict';

const enterpriseTypes152={
 studio:{name:'Творческая студия',opening:.06,reserve:.06,overhead:.45},
 services:{name:'Мастерская услуг',opening:.10,reserve:.08,overhead:.60},
 shop:{name:'Небольшой магазин',opening:.17,reserve:.12,overhead:.85}
};
const enterpriseSpecialties153={
 studio:{photo:'Фотостудия',design:'Студия дизайна',publishing:'Малое издательство'},
 services:{hair:'Парикмахерская',grooming:'Салон груминга',repair:'Ремонтная мастерская',school196:'Профессиональная школа'},
 shop:{books:'Книжный магазин',flowers:'Цветочная лавка',grocery:'Продуктовый магазин'}
};
const enterpriseEvents153={
 studio:[['Крупный заказ','Клиент заказал серию работ.',.45,0],['Срыв заказа','Клиент отменил проект.',-.35,0]],
 services:[['Рекомендации клиентов','На этой неделе прибавилось записей.',.40,0],['Поломка оборудования','Часть выручки ушла на ремонт.',0,.45]],
 shop:[['Удачные продажи','Товары хорошо разошлись.',.40,0],['Сбой поставки','Пришлось доплатить за срочную закупку.',-.15,.30]]
};
const specialtyEvents153={
 school196:['Набор по рекомендации','Выпускники рассказали о занятиях, и на курс записались новые ученики.',.40,0],
 photo:['Съёмка для журнала','Редакция забронировала студию на несколько дней.',.55,0],
 design:['Заказ на фирменный стиль','Новый клиент заказал оформление бренда.',.50,0],
 publishing:['Допечатка тиража','Книжные запросили дополнительные экземпляры.',.45,.15],
 hair:['Полная запись перед праздником','Клиенты заняли свободные окна.',.45,0],
 grooming:['Запись перед выставкой','Владельцы собак записались на подготовку к выставке.',.45,0],
 repair:['Партия заказов на ремонт','Местная фирма привезла несколько вещей на починку.',.45,.10],
 books:['Встреча с автором','После встречи выросли продажи книг.',.50,.10],
 flowers:['Заказ на свадьбу','Поступил крупный заказ на цветы.',.55,.15],
 grocery:['Часть поставки испортилась','Пришлось списать товар и заменить его.',-.10,.40]
};
function enterpriseEvent153(business){
 if(s.clock.ticks-(business.lastEvent153??-12)<4||!chance(.20))return null;
 const choices=(business.school196?[
  ['Набор не заполнился','Часть мест осталась свободной.',-.30,0],
  ['Приглашённый преподаватель','Занятие привлекло новую аудиторию.',.25,.15]
 ]:enterpriseEvents153[business.type]).concat(specialtyEvents153[business.specialty]?[specialtyEvents153[business.specialty]]:[]);
 const different=choices.filter(event=>event[0]!==business.previousEvent153);
 const event=pick(different);
 business.lastEvent153=s.clock.ticks;
 business.previousEvent153=event[0];
 return event;
}
const enterpriseStories154={
 studio:['В студии нашли старый набросок','На обороте — список дел, написанный в день открытия.'],
 services:['За работой заговорили о районе','У каждого своя версия того, что раньше было на этой улице.'],
 shop:['Кто-то поправил витрину','Соседский ребёнок переставил ценники по цветам. Пришлось вернуть их на места.']
};
const clientStories154=[
 ['Клиент вернулся с благодарностью','В прошлый раз всё получилось именно так, как хотелось.',4],
 ['Разговор с постоянным клиентом','За обычным заказом разговор зашёл о жизни в районе.',2],
 ['Клиенту пришлось подождать','Обговорили, как в следующий раз лучше договориться о времени.',-3]
];
function enterpriseStory154(business){
 const tick=s.clock.ticks;
 if(tick-(business.lastStory154??-12)<3||!chance(.25))return;
 business.lastStory154=tick;
 if(chance(.5)){
  const [title,note]=enterpriseStories154[business.type];
  log(title,business.title+' · '+note,'Своё дело');
  return;
 }
 const clients=business.clients154??=[];
 const local=clients.map(living).filter(p=>p&&p.country===business.country&&p.city18===business.city);
 let client;
 if(local.length&&(!chance(.3)||clients.length>=3))client=pick(local);
 else if(clients.length<3){
  client=person('Клиент',rnd(22,65),undefined,business.country,business.city);
  client.city18=business.city;
  s.people.push(client);
  clients.push(client.id);
 }
 if(!client)return;
 const [title,note,trust]=pick(clientStories154);
 rel(client,{trust});
 remember(client,note);
 log(title,business.title+' · '+client.name+'. '+note,'Своё дело');
}
const enterpriseDefault165={studio:'photo',services:'repair',shop:'books'};
function enterpriseMarket165(b,space=enterpriseSpace157(b)){
 if(typeof businessMarket165==='undefined'||(b.id&&!b.market165))return null;
 const cities=businessMarket165[b.country];
 const profile=b.specialty??enterpriseDefault165[b.type];
 const row=(typeof enterpriseRow253==='function'?enterpriseRow253(b,cities):null)??cities?.[b.city]?.[profile]??cities?.[countries[b.country]?.city]?.[profile];
 if(!row)return null;
 const [rent,wage,advertising,overhead,variable,startup,demand]=row;
 const location=space===enterpriseSpaces157.compact?0:space===enterpriseSpaces157.street ? .55 : .20;
 const money165=(range,level)=>Math.round((range[0]+(range[1]-range[0])*level)*fxRate86('nl',b.country));
 return {rent:money165(rent,location),wage:money165(wage,.25),
  advertising:money165(advertising,location),overhead:money165(overhead,location),
  variable:variable[0]+(variable[1]-variable[0])*location,
  startup:money165(startup,location),demand};
}
function enterpriseQuote152(type,specialty=null){
 const b={type,specialty,country:s.country,city:residenceCity()};
 const market=enterpriseMarket165(b);
 if(market){
  const reserve=(market.rent+market.advertising+market.overhead)*2;
  return {fee:Math.max(0,market.startup-reserve),reserve};
 }
 const model=enterpriseTypes152[type];
 return {fee:Math.round(c().cost*model.opening),reserve:Math.round(c().cost*model.reserve)};
}
function enterpriseBlock152(){
 if(s.dead||s.age<18)return 'Доступно совершеннолетним.';
 if(courtCustody94())return 'Дождись окончания срока.';
 if(!permission16(s.country,'work'))return 'Нужно право на работу в стране.';
 return '';
}
// Keep each location's operating books and ownership terms intact.
function ownedEnterprises168(){
 return [...new Set([s.enterprise152,...(s.otherEnterprises168||[])])].filter(b=>b?.status==='active');
}
function selectEnterprise168(id){
 const business=ownedEnterprises168().find(item=>item.id===id);
 if(!business)return false;
 const others=ownedEnterprises168().filter(item=>item!==business);
 s.enterprise152=business;
 s.otherEnterprises168=others;
 save();
 return true;
}
function enterpriseNetwork168(business){
 return (s.enterpriseNetworks168||[]).find(network=>network.ids.includes(business?.id));
}
function formEnterpriseNetwork168(ids,name){
 const title=String(name||'').trim();
 if(enterpriseBlock152()||!title||title.length>60||!Array.isArray(ids))return false;
 const selected=ownedEnterprises168().filter(b=>ids.includes(b.id));
 const first=selected[0];
 if(selected.length<2||selected.length!==ids.length||!first.specialty||
    selected.some(b=>b.specialty!==first.specialty||b.type!==first.type||enterpriseNetwork168(b)))return false;
 s.enterpriseNetworks168??=[];
 s.enterpriseNetworks168.push({id:id16('network'),title,ids:selected.map(b=>b.id)});
 log('Создана сеть',title+' · '+selected.map(b=>b.title).join(', ')+'.','Работа',true);
 save();render();return true;
}
function enterprisePanel152(){
 const businesses=ownedEnterprises168();
 if(!businesses.length)return '';
 const seen=new Set();
 const cards=[];
 for(const b of businesses){
  const network=enterpriseNetwork168(b);
  if(network&&seen.has(network.id))continue;
  if(network)seen.add(network.id);
  const points=network?businesses.filter(point=>network.ids.includes(point.id)):[b];
  const pointCount=points.reduce((sum,point)=>sum+1+Number(!!point.branch159),0);
  const title=network?.title||b.title;
  const profile=enterpriseSpecialties153[b.type]?.[b.specialty]||enterpriseTypes152[b.type]?.name;
  const locations=[...new Set(points.map(point=>point.city))].filter(Boolean).join(' · ');
  const facade=enterpriseFacade166(b,b.space157??'standard');
  const link=network?'enterprisePortfolio168(this.dataset.id)':'if(selectEnterprise168(this.dataset.id))enterpriseMenu152()';
  cards.push(`<button type="button" class="home-portrait59 home-compact60${facade?'':' no-facade152'}" data-id="${esc(network?.id||b.id)}" onclick="${link}">
   ${facade?`<img src="assets/business/${facade}.webp" alt="" loading="lazy">`:''}
   <span class="home-copy60"><strong>${esc(title)}</strong>
    ${profile?`<span>${esc(profile)}</span>`:''}
    ${locations?`<span>${esc(locations)}</span>`:''}
    ${network||pointCount>1?`<span>Сеть · ${pointCount} ${pointCount===1?'точка':pointCount>=2&&pointCount<=4?'точки':'точек'}</span>`:''}
   </span></button>`);
 }
 return '<section class="activity-box enterprise-panel152"><h3>Моё дело</h3>'+cards.join('')+'</section>';
}
function enterprisePortfolio168(networkId){
 const network=(s.enterpriseNetworks168||[]).find(item=>item.id===networkId);
 const businesses=ownedEnterprises168().filter(b=>!network||network.ids.includes(b.id));
 const candidates=businesses.filter(b=>b.specialty&&!enterpriseNetwork168(b));
 const eligible=candidates.filter(b=>candidates.some(other=>other!==b&&other.specialty===b.specialty&&other.type===b.type));
 show(network?.title||'Мои предприятия',network?'Выбери точку сети.':'У каждой точки свой счёт, сотрудники и история. Сеть объединяет заведения под общим названием.',[
  ...businesses.map(b=>({
   label:b.title,hint:[b.city,network?null:enterpriseNetwork168(b)?.title].filter(Boolean).join(' · '),
   fn:()=>{if(selectEnterprise168(b.id))enterpriseMenu152();}
  })),
  ...(eligible.length?[{label:'Создать сеть',fn:()=>enterpriseNetworkMenu168(eligible)}]:[]),
  network?{label:'Все предприятия',fn:enterprisePortfolio168}:
   {label:'Открыть ещё одно дело',disabled:!!enterpriseBlock152(),fn:()=>enterpriseOpeningMenu168(true)}
 ]);
}
function enterpriseNetworkMenu168(eligible){
 show('Создать сеть','Выбери специализацию. В сеть войдут выбранные действующие заведения.',[
  ...eligible.filter((b,i)=>eligible.findIndex(other=>other.specialty===b.specialty)===i).map(b=>({
   label:enterpriseSpecialties153[b.type][b.specialty],
   fn:()=>{
    const group=eligible.filter(other=>other.specialty===b.specialty);
    show('Точки сети','Выбери как минимум два заведения.',[
     {label:'Объединить',fn:()=>{
      const ids=group.filter((_,i)=>$('#network-point168-'+i)?.checked).map(item=>item.id);
      if(formEnterpriseNetwork168(ids,$('#network-title168')?.value))enterprisePortfolio168();
      else {toast('Выбери две точки и введи название.');}
     }},
     {label:'Назад',fn:enterprisePortfolio168}
    ]);
    petInsert38('<label class="field">Название сети<input id="network-title168" maxlength="60"></label>'+
     group.map((item,i)=>'<label><input type="checkbox" id="network-point168-'+i+'" checked> '+esc(item.title+' · '+item.city)+'</label>').join('<br>'));
   }
  })),
  {label:'Назад',fn:enterprisePortfolio168}
 ]);
}
function startEnterprise152(type,name,specialty=null,additional=false,schoolTrack=null){
 if(!Object.hasOwn(enterpriseTypes152,type)||enterpriseBlock152()||(s.enterprise152?.status==='active'&&!additional))return false;
 if(specialty!==null&&!Object.hasOwn(enterpriseSpecialties153[type],specialty))return false;
 if(typeof enterpriseAvailable253==='function'&&!enterpriseAvailable253(specialty))return false;
 if(specialty==='school196'&&(!schoolTrack||typeof schoolBlock196!=='function'||schoolBlock196(schoolTrack)))return false;
 const title=String(name||'').trim();
 const {fee,reserve}=enterpriseQuote152(type,specialty);
 if(!title||title.length>60||s.cash<fee+reserve)return false;
 const others=ownedEnterprises168();
 s.cash-=fee+reserve;
 s.otherEnterprises168=others;
 s.enterprise152={id:id16('enterprise'),title,type,specialty,...(schoolTrack&&specialty==='school196'?{school196:{track:schoolTrack}}:{}),country:s.country,city:residenceCity(),
  market165:typeof businessMarket165!=='undefined',status:'active',cash:reserve,opened159:s.clock.ticks,last:s.clock.ticks,history:[]};
 log('Открыто своё дело',title+' · '+residenceCity()+'.','Работа',true);
 save();render();return true;
}
const enterpriseStaffLimit155=3;
function enterpriseStaff155(business){
 return (business.staff155||[]).map(living).filter(p=>p&&p.country===business.country&&p.city18===business.city);
}
function enterpriseWage155(business){
 return enterpriseMarket165(business)?.wage??Math.round(countries[business.country].wage/12*.16);
}
function hireEnterprise155(id){
 const business=s.enterprise152;
 if(business?.id!==id||business.status!=='active'||enterpriseBlock152()||
  business.country!==s.country||business.city!==residenceCity()||travelActive52())return false;
 const wage=enterpriseWage155(business),staff=enterpriseStaff155(business);
 if(staff.length>=enterpriseStaffLimit155)return false;
 if(business.cash<wage*(staff.length+1)*2)return false;
 const worker=person('Сотрудник своего дела',rnd(20,60),undefined,business.country,business.city);
 worker.city18=business.city;
 enrichPerson(worker);
 worker.occupation='Сотрудник · '+business.title;
 s.people.push(worker);
 business.staff155=[...staff.map(p=>p.id),worker.id];
 log('Сотрудник принят',worker.name+' · '+money(wage)+'/мес.','Своё дело');
 save();render();return true;
}
function releaseEnterpriseStaff155(business,id){
 business.staff155=(business.staff155||[]).filter(personId=>personId!==id);
 const worker=living(id);
 if(worker)worker.occupation='Бывший сотрудник · '+business.title;
}
function dismissEnterprise155(businessId,workerId){
 const business=s.enterprise152;
 if(s.dead||business?.status!=='active'||business.id!==businessId||
  !business.staff155?.includes(workerId))return false;
 releaseEnterpriseStaff155(business,workerId);
 log('Сотрудник ушёл из дела',living(workerId)?.name||business.title,'Своё дело');
 save();render();return true;
}
const enterprisePrices156={low:{label:'Ниже рынка',price:.9,demand:1.18},
 standard:{label:'Средние цены',price:1,demand:1},
 high:{label:'Выше рынка',price:1.18,demand:.76}};
function enterpriseInvestment156(business,kind){
 const market=enterpriseMarket165(business);
 if(market)return kind==='advertising'?market.advertising*3:Math.round(market.startup*.12);
 const overhead=countries[business.country].cost/12*enterpriseTypes152[business.type].overhead;
 return Math.round(overhead*(kind==='advertising' ? .35 : .85));
}
function developEnterprise156(id,choice){
 const b=s.enterprise152;
 if(!b||b.id!==id||b.status!=='active'||enterpriseBlock152()||b.country!==s.country||
  b.city!==residenceCity()||travelActive52()||s.illness)return false;
 if(Object.hasOwn(enterprisePrices156,choice)){
  if((b.prices156??'standard')===choice)return false;
  b.prices156=choice;
 }else{
  if(choice==='advertising'){
   if((b.adUntil156??0)>s.clock.ticks)return false;
  }else if(choice!=='equipment'||b.equipment156)return false;
  const cost=enterpriseInvestment156(b,choice);
  if(b.cash<cost)return false;
  b.cash-=cost;
  if(choice==='advertising')b.adUntil156=s.clock.ticks+3;
  else b.equipment156=true;
 }
 save();render();return true;
}
function enterpriseDevelopmentMenu156(b){
 const apply=choice=>{if(!developEnterprise156(b.id,choice))toast('Сейчас это изменение недоступно.');else enterpriseMenu152();};
 const adMonths=Math.max(0,(b.adUntil156??s.clock.ticks)-s.clock.ticks);
 show('Развитие дела','Текущие цены: '+enterprisePrices156[b.prices156??'standard'].label+
  '. Реклама: '+(adMonths?adMonths+' мес. осталось':'не запущена')+
  '. Оборудование: '+(b.equipment156?'обновлено.':'базовое.'),[
  ...Object.entries(enterprisePrices156).map(([id,price])=>({label:price.label,
   hint:Math.round(price.price*100)+'% цены · '+Math.round(price.demand*100)+'% спроса',
   disabled:(b.prices156??'standard')===id,fn:()=>apply(id)})),
  {label:'Запустить рекламу на 3 месяца',hint:money(enterpriseInvestment156(b,'advertising'))+' · больше спроса',
   disabled:!!adMonths||b.cash<enterpriseInvestment156(b,'advertising'),fn:()=>apply('advertising')},
  {label:'Обновить оборудование',hint:money(enterpriseInvestment156(b,'equipment'))+' · больше заказов и выше расходы',
   disabled:!!b.equipment156||b.cash<enterpriseInvestment156(b,'equipment'),fn:()=>apply('equipment')},
  {label:'Назад',fn:enterpriseMenu152}
 ]);
}
const enterpriseSpaces157={
 compact:{name:'Компактное помещение',rent:.72,demand:.92,capacity:.82},
 standard:{name:'Обычное помещение',rent:1,demand:1,capacity:1},
 street:{name:'Помещение на оживлённой улице',rent:1.28,demand:1.32,capacity:1.18}
};
function enterpriseFacade166(b,key,salt='main'){
 const pool=typeof businessArt166==='undefined'?[]:businessArt166[b.country]||[];
 const ranked=pool.map(([id,tier,use])=>({id,score:(tier===key?4:0)+(use===b.specialty?4:use===b.type?2:0)}));
 if(!ranked.length)return '';
 const best=Math.max(...ranked.map(row=>row.score));
 const matches=ranked.filter(row=>row.score===best);
 const seed=[b.country,b.city,b.specialty,key,salt].join('|');
 const hash=[...seed].reduce((value,char)=>Math.imul(value^char.charCodeAt(0),16777619)>>>0,2166136261);
 const main=salt==='branch'?enterpriseFacade166(b,key):null;
 const distinct=matches.filter(row=>row.id!==main);
 const options=distinct.length?distinct:matches;
 return options[hash%options.length].id;
}
function enterpriseFacadeGallery166(b,keys,branch=false){
 const html=keys.map(key=>{
  const id=enterpriseFacade166(b,key,branch?'branch':'main');
  return id?'<figure><img src="assets/business/'+id+'.webp" alt="" decoding="async"><figcaption>'+
   esc(enterpriseSpaces157[key].name)+'</figcaption></figure>':'';
 }).join('');
 if(html)petInsert38('<div class="business-facades166">'+html+'</div>');
}
function enterpriseSpace157(b){return enterpriseSpaces157[b.space157??'standard'];}
function enterpriseBaseCost157(b){return countries[b.country].cost/12*enterpriseTypes152[b.type].overhead;}
function enterpriseRent157(b,space=enterpriseSpace157(b)){
 const rent=enterpriseMarket165(b,space)?.rent??enterpriseBaseCost157(b)*.6*space.rent;
 return rent*(space===enterpriseSpace157(b)?(b.rentFactor159??1):1);
}
function enterpriseMoveCost157(b,space){return Math.round(enterpriseRent157(b,space)*.8);}
function enterpriseMoveBlock157(b){
 return enterpriseBlock152()||((b.country!==s.country||b.city!==residenceCity()||travelActive52()||s.illness)?'Нужно быть в городе, где работает дело.':'');
}
function moveEnterprise157(id,key){
 const b=ownedEnterprises168().find(business=>business.id===id);
 if(!b||b.id!==id||b.status!=='active'||!Object.hasOwn(enterpriseSpaces157,key)||
  (b.space157??'standard')===key||enterpriseMoveBlock157(b)||b.moved157===s.clock.ticks)return false;
 const cost=enterpriseMoveCost157(b,enterpriseSpaces157[key]);
 if(b.cash<cost)return false;
 b.cash-=cost;
 b.space157=key;
 delete b.rentFactor159;
 delete b.rentOffer159;
 b.moved157=s.clock.ticks;
 log('Бизнес сменил помещение',b.title+' · '+enterpriseSpaces157[key].name+'. Переезд обошёлся в '+money(cost)+'.','Работа',true);
 save();render();return true;
}
function enterprisePremisesMenu157(b){
 show('Помещение бизнеса','Сейчас: '+enterpriseSpace157(b).name+'. Новая аренда применяется со следующего месячного расчёта.',[
  ...Object.entries(enterpriseSpaces157).map(([key,space])=>{
   const cost=enterpriseMoveCost157(b,space);
   return {label:space.name,hint:money(enterpriseRent157(b,space))+'/мес. аренда · '+money(cost)+' переезд · '+Math.round(space.demand*100)+'% обычного спроса',
    disabled:(b.space157??'standard')===key||!!enterpriseMoveBlock157(b)||b.moved157===s.clock.ticks||b.cash<cost,
    fn:()=>show('Сменить помещение?',space.name+' · '+money(cost)+' со счёта дела.',[
     {label:'Переехать',fn:()=>{if(moveEnterprise157(b.id,key))enterpriseMenu152();else toast('Переезд сейчас недоступен.');}},
     {label:'Назад',fn:()=>enterprisePremisesMenu157(b)}
    ])};
  }),{label:'Назад',fn:enterpriseMenu152}
 ]);
 enterpriseFacadeGallery166(b,Object.keys(enterpriseSpaces157));
}
function branchQuote159(b,key){
 const space=enterpriseSpaces157[key];
 return enterpriseMarket165(b,space)?.startup??(Math.round(countries[b.country].cost*enterpriseTypes152[b.type].opening)+Math.round(enterpriseRent157(b,space)*2));
}
function buyBranch159(id,key){
 const b=s.enterprise152;
 if(!b||b.id!==id||b.status!=='active'||!b.specialty||!Object.hasOwn(enterpriseSpaces157,key)||
  enterpriseMoveBlock157(b)||b.branch159||!enterpriseStaff155(b).length)return false;
 const price=branchQuote159(b,key);
 if(b.cash<price)return false;
 b.cash-=price;
 b.branch159={space:key,price,opened:s.clock.ticks};
 log('Бизнес стал сетью',b.title+' · куплена вторая точка.','Работа',true);
 save();render();return true;
}
function branchMenu159(b){
 show('Купить вторую точку','Та же специализация и общий счёт. Для покупки нужен хотя бы один сотрудник.',[
  ...Object.entries(enterpriseSpaces157).map(([key,space])=>({label:space.name,
   hint:money(branchQuote159(b,key))+' · аренда '+money(enterpriseRent157(b,space))+'/мес.',
   disabled:b.cash<branchQuote159(b,key)||!enterpriseStaff155(b).length||!!enterpriseMoveBlock157(b),
   fn:()=>{if(buyBranch159(b.id,key))enterpriseMenu152();else toast('Покупка сейчас недоступна.');}})),
  {label:'Назад',fn:enterpriseMenu152}
 ]);
 enterpriseFacadeGallery166(b,Object.keys(enterpriseSpaces157),true);
}
function rentBusiness239(id){
 return ownedEnterprises168().find(b=>b.rentOffer159?.id===id);
}
function rentDeadline239(b){
 return b.rentOffer159.expires??((b.lastRentOffer159??s.clock.ticks)+2);
}
function respondRent159(id,choice){
 const b=rentBusiness239(id),offer=b?.rentOffer159;
 if(b?.status!=='active'||!offer||offer.id!==id||!['accept','negotiate','move'].includes(choice))return false;
 if(choice==='move'&&!moveEnterprise157(b.id,offer.space==='compact'?'standard':'compact'))return false;
 if(choice!=='move')b.rentFactor159=(b.rentFactor159??1)*(choice==='negotiate'&&chance(.65)?1.06:1.15);
 delete b.rentOffer159;
 log('Решение по аренде',b.title+' · '+(choice==='move'?'выбрано другое помещение.':'новая аренда '+money(enterpriseRent157(b))+'/мес.'),'Работа');
 save();render();return true;
}
function rentMenu159(id){
 const b=rentBusiness239(id);
 if(!b||rentDeadline239(b)<=s.clock.ticks)return;
 show('Арендодатель повышает плату',b.title+' · новая аренда '+money(enterpriseRent157(b)*1.15)+'/мес. Через '+(rentDeadline239(b)-s.clock.ticks)+' мес. новая ставка вступит в силу автоматически.',[
  {label:'Согласиться',fn:()=>respondRent159(id,'accept')},
  {label:'Поторговаться',fn:()=>respondRent159(id,'negotiate')},
  {label:'Съехать в другое помещение',fn:()=>{if(!respondRent159(id,'move'))toast('Переезд сейчас недоступен.');}}
 ]);
}
function enterpriseMonth152(){
 for(const business of ownedEnterprises168())enterpriseLocationMonth168(business);
}
function enterpriseLocationMonth168(business){
 if(s.dead||business?.status!=='active'||business.last>=s.clock.ticks)return;
 business.last=s.clock.ticks;
 if(business.rentOffer159&&rentDeadline239(business)<=s.clock.ticks){
  business.rentFactor159=(business.rentFactor159??1)*1.15;
  delete business.rentOffer159;
  log('Новая ставка аренды вступила в силу',business.title+' · срок ответа истёк.','Своё дело');
 }
 const model=enterpriseTypes152[business.type],unit=countries[business.country].cost/12;
 const staff=enterpriseStaff155(business),space=enterpriseSpace157(business);
 const present=business.country===s.country&&business.city===residenceCity()&&!enterpriseBlock152()&&!travelActive52()&&!s.illness;
 const skill=business.school196&&typeof schoolDemand196==='function'?schoolDemand196(business):.65+s.skill/200;
 const event=present?enterpriseEvent153(business):null;
 const capacity=present?[1,1.34,1.55,1.67][staff.length]:[0,.58,.79,.91][staff.length];
 const pricing=enterprisePrices156[business.prices156??'standard'];
 const ads=business.adUntil156>=s.clock.ticks?1.22:1;
 const market=enterpriseMarket165(business);
 const scenario254=typeof businessModifier254==='function'?key=>businessModifier254(business,key):()=>1;
 const demand=scenario254('demand')*(market?.demand??1)*skill*(.55+Math.random()*1.3)*pricing.demand*space.demand*ads*(1+(event?.[2]??0));
 const limit=capacity*1.85*space.capacity*(business.equipment156?1.18:1);
 const turnover=market?(market.rent+market.overhead+market.wage*.7)/(1-market.variable)*1.28:unit*model.overhead;
 const primarySales=Math.round(turnover*Math.min(limit,demand*capacity*(business.equipment156?1.12:1))*pricing.price*scenario254('price'));
 const wage=enterpriseWage155(business);
 const payroll=wage*staff.length;
 const rent=enterpriseRent157(business);
 const branch=business.branch159&&enterpriseSpaces157[business.branch159.space];
 const branchMarket=branch&&enterpriseMarket165(business,branch);
 const branchRent=branch?(branchMarket?.rent??enterpriseBaseCost157(business)*.6*branch.rent):0;
 const branchSales=branch&&staff.length?Math.round(primarySales*(.35+staff.length*.12)*branch.demand*branch.capacity):0;
 const sales=primarySales+branchSales;
 const production=market?Math.round(primarySales*market.variable+(branchMarket?branchSales*branchMarket.variable:0)):0;
 const overhead=scenario254('overhead')*(market?market.overhead+(branchMarket?.overhead??0):
  unit*model.overhead*(.4+(branch ? .22 : 0)));
 const incidentCosts=Math.round((market?market.overhead:unit*model.overhead)*(event?.[3]??0));
 const costs=Math.round(branchRent+rent+overhead+production+
  (market?market.overhead:unit*model.overhead)*(business.equipment156?.04:0))+payroll+incidentCosts;
 const paid=Math.min(costs,business.cash+sales);
 const wagesPaid=Math.min(payroll,paid);
 for(const worker of staff)worker.privateCash+=wagesPaid/staff.length;
 business.cash+=sales-paid;
 business.history.push({tick:s.clock.ticks,sales,costs,paid,rent,branchRent,branchSales,production,overhead,incidentCosts,cash:business.cash,payroll,wagesPaid,event:event?.[0]??null});
 business.history=business.history.slice(-36);
 if(present&&paid===costs&&!business.rentOffer159&&s.clock.ticks-(business.lastRentOffer159??business.opened159??0)>=12&&
  (business.rentFactor159??1)<1.5&&chance(.08)){
  business.lastRentOffer159=s.clock.ticks;
  business.rentOffer159={id:'enterprise-rent-'+business.id+'-'+s.clock.ticks,space:business.space157??'standard',expires:s.clock.ticks+2};
  log('Предложение повысить аренду',business.title+' · через два месяца ставка вырастет на 15%.','Своё дело',false,{kind:'enterpriseRent239',id:business.rentOffer159.id});
 }
 if(event)log(event[0],business.title+' · '+event[1],'Своё дело');
 if(present&&!event&&paid===costs)enterpriseStory154(business);
 if(paid<costs){
  business.status='closed';
  for(const id of business.staff155||[])releaseEnterpriseStaff155(business,id);
  log('Своё дело закрыто',business.title+' · средств на текущие расходы не хватило.','Работа',true);
 }
}
function enterprisePartnerTerms158(b){
 const share=.25;
 return {share,contribution:Math.max(1,Math.ceil(Math.max(b.cash,enterpriseBaseCost157(b)*2)*share/(1-share)))};
}
function enterprisePartnerCandidates158(b){
 return s.people.filter(p=>p.alive&&p.age>=18&&p.country===b.country&&
  (!p.city18||p.city18===b.city)&&p.bond>=50&&
  (p.married||['Партнер','Друг','Мать','Отец','Бабушка','Дедушка','Брат','Сестра','Родственник','Сын','Дочь'].includes(p.role))&&
  !b.staff155?.includes(p.id)&&!(typeof careInterruption145==='function'&&careInterruption145(p)));
}
function inviteEnterprisePartner158(id,personId){
 const b=s.enterprise152;
 if(!b||b.id!==id||b.status!=='active'||b.partner158||enterpriseMoveBlock157(b)||
  s.clock.ticks<(b.partnerRetry158??0))return false;
 const p=enterprisePartnerCandidates158(b).find(candidate=>candidate.id===personId);
 const {share,contribution}=enterprisePartnerTerms158(b);
 if(!p||p.privateCash<contribution)return false;
 b.partnerRetry158=s.clock.ticks+3;
 if(!chance(clamp(p.bond)/100)){
  log('Совладелец отказался',p.name+' пока не готов вложиться.','Своё дело');
  save();render();return false;
 }
 p.privateCash-=contribution;
 b.cash+=contribution;
 b.partner158={id:p.id,share,contribution,joined:s.clock.ticks};
 log('У дела появился совладелец',p.name+' · доля 25% · вклад '+money(contribution)+'.','Своё дело');
 save();render();return true;
}
function distributeEnterprise158(b,payout){
 const partner=b.partner158&&s.people.find(p=>p.id===b.partner158.id);
 const share=b.partner158?.share??0;
 const partnerAmount=Math.floor(payout*share);
 const ownerAmount=(payout-partnerAmount)*fxRate86(b.country);
 if(partner)partner.privateCash=(partner.privateCash||0)+partnerAmount*fxRate86(b.country,partner.country);
 else if(share)b.unclaimedShare158=(b.unclaimedShare158||0)+partnerAmount;
 b.cash-=payout;
 s.cash+=ownerAmount;
 return ownerAmount;
}
function buyOutEnterprise158(id){
 const b=s.enterprise152,partner=b?.partner158&&living(b.partner158.id);
 if(!b||b.id!==id||b.status!=='active'||!partner||enterpriseMoveBlock157(b))return false;
 const amount=Math.max(b.partner158.contribution,Math.ceil(b.cash*b.partner158.share));
 if(s.cash<amount)return false;
 s.cash-=amount;
 partner.privateCash+=amount*fxRate86(b.country,partner.country);
 delete b.partner158;
 log('Доля совладельца выкуплена',partner.name+' · '+money(amount)+'.','Своё дело');
 save();render();return true;
}
function enterprisePartnerMenu158(b){
 const partner=b.partner158&&s.people.find(p=>p.id===b.partner158.id);
 if(b.partner158){
  const amount=Math.max(b.partner158.contribution,Math.ceil(b.cash*b.partner158.share));
  return show('Совладелец', (partner?.name||'Совладелец')+' · доля 25%. Вклад: '+money(b.partner158.contribution*fxRate86(b.country))+'.',[
   {label:'Выкупить долю · '+money(amount*fxRate86(b.country)),disabled:!partner?.alive||s.cash<amount||!!enterpriseMoveBlock157(b),
    fn:()=>{if(buyOutEnterprise158(b.id))enterpriseMenu152();else toast('Выкуп сейчас недоступен.');}},
   {label:'Назад',fn:enterpriseMenu152}
  ]);
 }
 const {contribution}=enterprisePartnerTerms158(b);
 const candidates=enterprisePartnerCandidates158(b);
 show('Предложить долю 25%','Вклад '+money(contribution*fxRate86(b.country))+' поступит на счёт дела.',[
  ...candidates.map(p=>({label:p.name,disabled:p.privateCash<contribution||!!enterpriseMoveBlock157(b)||
   s.clock.ticks<(b.partnerRetry158??0),fn:()=>{
    if(inviteEnterprisePartner158(b.id,p.id))enterpriseMenu152();else toast('Договориться о доле сейчас не получилось.');
   }})),{label:'Назад',fn:enterpriseMenu152}
 ]);
}
function drawEnterprise152(id){
 const business=s.enterprise152;
 if(s.dead||business?.id!==id||business.status!=='active'||business.cash<=0||
    business.country!==s.country||business.city!==residenceCity()||enterpriseBlock152())return false;
 const branch=business.branch159&&enterpriseSpaces157[business.branch159.space];
 const market=enterpriseMarket165(business);
 const branchMarket=branch&&enterpriseMarket165(business,branch);
 const extra=branchMarket?branchMarket.rent+branchMarket.overhead:branch?enterpriseBaseCost157(business)*(.6*branch.rent+.22):0;
 const reserve=Math.round((extra+(market?.overhead??enterpriseBaseCost157(business)*.4)*(business.equipment156?1.04:1)+enterpriseRent157(business))*2)+enterpriseWage155(business)*enterpriseStaff155(business).length*2;
 const payout=Math.max(0,business.cash-reserve);
 if(!payout)return false;
 const income=distributeEnterprise158(business,payout);
 s.clock.income+=income;
 log('Выплата из своего дела',business.title+' · твоя доля '+money(income)+'.','Работа');
 save();render();return true;
}
function closeEnterprise152(id){
 const business=s.enterprise152;
 if(s.dead||business?.id!==id||business.status!=='active')return false;
 distributeEnterprise158(business,business.cash);business.status='closed';
 for(const id of business.staff155||[])releaseEnterpriseStaff155(business,id);
 log('Своё дело закрыто',business.title+'.','Работа',true);
 save();render();return true;
}
function renameEnterprise159(id,name){
 const business=s.enterprise152,title=String(name||'').trim();
 if(!business||business.id!==id||business.status!=='active'||s.dead||
  !title||title.length>60||title===business.title)return false;
 business.title=title;
 for(const worker of enterpriseStaff155(business))worker.occupation='Сотрудник · '+title;
 save();render();return true;
}
function enterpriseNameMenu159(business){
 show('Название дела','Название будет общим для всех точек.',[
  {label:'Сохранить название',fn:()=>{
   if(renameEnterprise159(business.id,$('#enterprise-title152')?.value))enterpriseMenu152();
   else toast('Введи новое название длиной до 60 знаков.');
  }},{label:'Назад',fn:enterpriseMenu152}
 ]);
 petInsert38('<label class="field">Название<input id="enterprise-title152" maxlength="60" value="'+esc(business.title)+'"></label>');
}
function enterpriseMenu152(){
 const business=s.enterprise152;
 if(business?.status!=='active'&&ownedEnterprises168().length){enterprisePortfolio168();return;}
 if(business?.status==='active'){
  const branch=business.branch159;
  const month=business.history.at(-1),staff=enterpriseStaff155(business),wage=enterpriseWage155(business);
  const amount=n=>money(n*fxRate86(business.country));
  const profile=enterpriseSpecialties153[business.type][business.specialty]||enterpriseTypes152[business.type].name;
  const network=enterpriseNetwork168(business);
  show(business.title,(network?'Сеть «'+network.title+'» · ':'')+profile+(business.school196?' · '+trackNames46[business.school196.track]:'')+(branch?' · сеть из двух точек. Точка 2 — '+enterpriseSpaces157[branch.space].name:'')+' · '+business.city+' · '+enterpriseSpace157(business).name+' · На счёте дела '+amount(business.cash)+'. Команда: '+staff.length+'/3. Зарплаты: '+amount(staff.length*wage)+'/мес.'+
   (month?'. За последний месяц выручка '+amount(month.sales)+', оплачено '+amount(month.paid)+'.'+(month.event?' Событие месяца — '+month.event+'.':''):'.'),[
    ...(business.rentOffer159?[{label:'Арендодатель повышает плату',fn:()=>rentMenu159(business.rentOffer159.id)}]:[]),
    ...(!branch&&business.specialty?[{label:'Купить вторую точку',fn:()=>branchMenu159(business)}]:[]),
    {label:'Мои предприятия и сети',fn:enterprisePortfolio168},
    {label:'Переименовать',fn:()=>enterpriseNameMenu159(business)},
    {label:business.partner158?'Совладелец · 25%':'Пригласить совладельца',fn:()=>enterprisePartnerMenu158(business)},
    {label:'Сменить помещение',fn:()=>enterprisePremisesMenu157(business)},
    {label:'Цены, реклама и оборудование',fn:()=>enterpriseDevelopmentMenu156(business)},
    {label:'Нанять сотрудника',hint:amount(wage)+'/мес. · 8 ч/нед.',disabled:staff.length>=3||business.cash<wage*(staff.length+1)*2,fn:()=>{
     if(!hireEnterprise155(business.id))toast('Проверь резерв и доступность дела.');
    }},
    ...staff.map(worker=>({label:'Сотрудник · '+worker.name,fn:()=>show(worker.name,'Работает 8 часов в неделю.',[
     {label:'Открыть карточку',fn:()=>personDetail(worker.id)},
     {label:'Прекратить сотрудничество',fn:()=>dismissEnterprise155(business.id,worker.id)},
     {label:'Назад',fn:enterpriseMenu152}
    ])})),
    ...(business.clients154||[]).map(living).filter(Boolean).map(client=>({
     label:'Клиент · '+client.name,hint:'Доверие '+Math.round(client.inner.trust)+'/100',fn:()=>personDetail(client.id)
    })),
    {label:'Перевести остаток сверх резерва себе',fn:()=>{if(!drawEnterprise152(business.id))toast('Нет средств сверх резерва или дело сейчас недоступно.');}},
    ...(typeof businessJournal254==='function'?[{label:'Дела предприятия',fn:()=>businessJournal254(business.id)}]:[]),
    {label:'Закрыть дело…',fn:()=>show('Закрыть дело?',business.title+' прекратит работу. Остаток счёта будет распределён по долям.',[
     {label:'Закрыть',fn:()=>closeEnterprise152(business.id)},{label:'Назад',fn:enterpriseMenu152}])}
   ]);
  enterpriseFacadeGallery166(business,[business.space157??'standard']);
  if(branch)enterpriseFacadeGallery166(business,[branch.space],true);
  return;
 }
 return enterpriseOpeningMenu168(false);
}
function enterpriseOpeningMenu168(additional){
 const reason=enterpriseBlock152();
 if(reason)return toast(reason);
 show('Открыть своё дело','Понадобятся деньги на запуск и резерв для первых месяцев.',Object.entries(enterpriseTypes152).filter(([type])=>enterpriseEntries253(type).length).map(([type,model])=>{
  const minimum=Math.min(...enterpriseEntries253(type).map(([key])=>{
   const {fee,reserve}=enterpriseQuote152(type,key);
   return fee+reserve;
  }));
  return {label:model.name,hint:'От '+money(minimum),
   fn:()=>enterpriseSpecialtyMenu153(type,additional)};

 }));
}
function enterpriseSpecialtyMenu153(type,additional=false){
 show(enterpriseTypes152[type].name,'Выбери специализацию.',[
  ...enterpriseEntries253(type).map(([specialty,label])=>{
   const {fee,reserve}=enterpriseQuote152(type,specialty);
   if(specialty==='school196'&&typeof schoolOpening196==='function')return {label,hint:schoolBlock196()||money(fee+reserve)+' на запуск с резервом',fn:schoolBlock196()?professionalSkills251:schoolOpening196};
   const market=enterpriseMarket165({type,specialty,country:s.country,city:residenceCity()});
   return {label,hint:money(fee+reserve)+' на запуск с резервом',fn:()=>{
   const costs=market?'Аренда '+money(market.rent)+'/мес. · найм '+money(market.wage)+'/мес. за сотрудника · прочие расходы '+money(market.overhead)+'/мес. · себестоимость '+Math.round(market.variable*100)+'% выручки.':'';
   show(label,money(fee)+' на запуск · '+money(reserve)+' в резерв. '+costs,[{label:'Открыть',disabled:s.cash<fee+reserve,fn:()=>{
    if(!startEnterprise152(type,$('#enterprise-title152')?.value,specialty,additional))toast('Проверь название и доступные средства.');
   }},{label:'Назад',fn:()=>enterpriseSpecialtyMenu153(type,additional)}]);
   enterpriseFacadeGallery166({city:residenceCity(),country:s.country,type,specialty},['standard']);
   petInsert38('<label class="field">Название<input id="enterprise-title152" maxlength="60" value="'+esc(label)+'"></label>');
  }};}),{label:'Назад',fn:enterpriseMenu152}
 ]);
}
const enterpriseBase152={autonomousMonth,actionCatalog24,schedule23,decisionRecord24,decisionActive24,decisionItems24,openDecision24};
decisionRecord24=function(ref){
 if(ref?.kind!=='enterpriseRent239')return enterpriseBase152.decisionRecord24(ref);
 const business=rentBusiness239(ref.id);
 return business?{...business.rentOffer159,expires:rentDeadline239(business)}:null;
};
decisionActive24=function(ref){
 if(ref?.kind!=='enterpriseRent239')return enterpriseBase152.decisionActive24(ref);
 const offer=decisionRecord24(ref);
 return !!(s&&!s.dead&&offer&&offer.expires>s.clock.ticks);
};
decisionItems24=function(){
 const offers=ownedEnterprises168().filter(b=>b.rentOffer159).flatMap(b=>{
  const ref={kind:'enterpriseRent239',id:b.rentOffer159.id};
  if(!decisionActive24(ref))return [];
  const q=decisionRecord24(ref);
  return [{ref,q,title:'Новая аренда · '+b.title,note:'Ставка +15% при пропуске срока',expires:q.expires}];
 });
 return [...enterpriseBase152.decisionItems24(),...offers].sort((a,b)=>(a.expires??Infinity)-(b.expires??Infinity));
};
openDecision24=function(kind,id){
 if(kind!=='enterpriseRent239')return enterpriseBase152.openDecision24(kind,id);
 if(decisionActive24({kind,id}))return rentMenu159(id);
 return toast('Срок ответа по аренде истёк.');
};
autonomousMonth=function(){enterpriseBase152.autonomousMonth();enterpriseMonth152();};
actionCatalog24=function(){return [...enterpriseBase152.actionCatalog24(),{id:'enterprise152',group:'Работа',
 label:'Своё дело',keywords:'бизнес мастерская магазин студия',reason:enterpriseBlock152(),fn:enterpriseMenu152}];};
schedule23=function(){
 const plan=enterpriseBase152.schedule23();
 if(!enterpriseBlock152()&&!travelActive52()&&!s.illness){
  for(const business of ownedEnterprises168()){
   if(business.country===s.country&&business.city===residenceCity()){
    plan.total+=[12,9,7,6][enterpriseStaff155(business).length]+(business.branch159?4:0);
   }
  }
 }
 return plan;
};

function enterpriseAvailable253(key,country=s.country){
 const entry=typeof businessById253==='undefined'?null:businessById253[key];
 return !entry||entry.country===countries[country]?.name;
}
function enterpriseEntries253(type){
 return Object.entries(enterpriseSpecialties153[type]).filter(([key])=>enterpriseAvailable253(key));
}
