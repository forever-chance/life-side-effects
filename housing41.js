'use strict';
// Each listing is a persisted, local-currency unit; the illustration identifies its building.
const housingBase41={ensureHome,leaveHome,moveHome,homeCost,buyProperty,propertyMenu,housingMenu,monthlyFinance,save,executeCommand05};
const homeKinds41={room:'Комната',flat:'Квартира',house:'Дом'};
function housingState41(){s.housingMarket41??={version:1,serial:0,markets:{},used:[],lastRepairs:-1};return s.housingMarket41;}
function housingListing41(){const h=s.housing,q=h?.listing41;return q&&h.active&&h.mode==='rent'&&q.country===s.country&&q.city===h.city&&q.area===h.area?q:null;}
ensureHome=function(){housingBase41.ensureHome();if(!s)return;housingState41();const h=s.housing;if(h.listing41&&(!housingListing41()||h.mode!=='rent')){delete h.listing41;delete h.maintenance41;}};
function houseType41(id){return houseCatalog41.find(r=>r.id===id);}
function homeLocal41(value,country){return value*fxRate86(country);}
function houseMoney41(value,country=s.country){return Math.round(value).toLocaleString('ru-RU')+' '+countries[country].currency;}
function propertyMaintenance41(p){return propertyValue(p)*(p.listing41?(p.kind==='house'?.00065:.0004):.001);}
function propertyRental41(p){return p.listing41?homeLocal41(p.listing41.rent,p.country):propertyValue(p)*.004;}
homeCost=function(){const h=s.housing,q=housingListing41();if(q)return q.rent/(q.kind==='room'?1:h.occupant?2:1);if(h?.active&&h.mode==='own'){const p=s.properties.find(p=>p.id===h.propertyId);if(p?.listing41)return propertyMaintenance41(p)/(h.occupant?2:1);}return housingBase41.homeCost();};
leaveHome=function(){housingBase41.leaveHome();delete s.housing.listing41;delete s.housing.maintenance41;};
function interpolate41(range,t){return range[0]+(range[1]-range[0])*Math.max(0,Math.min(1,t));}
function roundHouse41(n,step=10){return Math.round(n/step)*step;}
function housePool41(country,kind,area){const all=houseCatalog41.filter(r=>r.country===country&&(kind==='room'?r.rooms[1]>=3&&r.bedrooms[1]>=2:r.kind===kind));const local=all.filter(r=>r.areas.includes(area));return local.length?local:all;}
function constructionYears41(r,year=s.year){const shift=r.years[0]>=2000&&r.years[1]===2026?Math.max(0,year-2026):0;return r.years.map(y=>y+shift);}
function makeHouse41(r,city,area,tier,kind,operation){
 const quality=tier==='low'?.12+Math.random()*.20:.68+Math.random()*.22;
 const size=tier==='low'?.08+Math.random()*.32:.56+Math.random()*.38;
 const areaM2=Math.round(interpolate41(r.area,size));let rooms=Math.round(interpolate41(r.rooms,size)),bedrooms=Math.min(rooms,Math.round(interpolate41(r.bedrooms,size)));
 if(kind==='room'){rooms=Math.max(3,rooms);bedrooms=Math.max(2,bedrooms);}
 const floors=rnd(...r.floors),construction=constructionYears41(r),year=rnd(construction[0],Math.min(construction[1],s.year));
 // A shared size quantile, local €/m² level, condition and district drive both prices.
 const cityIndex=cities[r.country].indexOf(city),cityLevel=[.10,.70,.42,.34][cityIndex]??.3;
 const rateLevel=Math.min(1,Math.max(0,.07+cityLevel*.30+(area==='center'?.24:0)+quality*.32));
 const amount=(range)=>{const lo=range[0]/r.area[0],hi=range[1]/r.area[1];return Math.max(range[0],Math.min(range[1],areaM2*interpolate41([lo,hi],rateLevel)));};
 let purchase=Math.max(r.purchase[0],Math.min(r.purchase[1],roundHouse41(amount(r.purchase),100)));let rent=Math.max(r.rent[0],Math.min(r.rent[1],roundHouse41(amount(r.rent))));
 let roomRent=Math.max(r.roomRent[0],Math.min(r.roomRent[1],roundHouse41(interpolate41(r.roomRent,Math.min(.98,rateLevel*.7+quality*.3)))));
 if(kind==='room')rent=Math.min(r.rent[1],Math.max(rent,roundHouse41(roomRent*1.6)));
 const local = typeof housingQuote97==='function' && housingQuote97(r.country,city,area,areaM2,quality);
 if(local)({purchase,rent,roomRent}=local);
 const roomArea=kind==='room'?Math.max(8,Math.min(24,Math.round(areaM2/(bedrooms+1)*( .65+quality*.2)))):null;
 return {id:'listing41-'+(++housingState41().serial),catalogId:r.id,country:r.country,city,area,kind,hostKind:r.kind,operation,tier,year,floors,floor:r.kind==='flat'?rnd(1,floors):null,areaM2:kind==='room'?roomArea:areaM2,rooms:kind==='room'?1:rooms,bedrooms:kind==='room'?1:bedrooms,hostArea:areaM2,hostRooms:rooms,hostBedrooms:bedrooms,condition:quality<.4?'Жилое, простой ремонт':'Хорошее состояние',purchase,rent:kind==='room'?roomRent:rent,wholeRent:rent,created:s.clock.ticks,expires:s.clock.ticks+3};
}
function market41(operation,kind,city=residenceCity()){
 ensureHome();if(!['rent','buy'].includes(operation)||!homeKinds41[kind]||operation==='buy'&&kind==='room'||!cities[s.country].includes(city))return null;
 const f=housingState41(),key=[s.country,city,kind,operation].join('|');let m=f.markets[key];if(m&&m.expires>s.clock.ticks)return m;
 const listings=[];
 for(const area of ['center','suburb']){
  const pool=housePool41(s.country,kind,area);if(!pool.length)continue;
  const candidates=pool.flatMap(r=>['low','high'].map(t=>makeHouse41(r,city,area,t,kind,operation)));
  const price=q=>operation==='buy'?q.purchase:q.rent;candidates.sort((a,b)=>price(a)-price(b));
  const low=candidates.find(q=>q.tier==='low')||candidates[0];const high=[...candidates].reverse().find(q=>q.tier==='high'&&q.catalogId!==low.catalogId&&price(q)>price(low))||[...candidates].reverse().find(q=>price(q)>price(low))||candidates.at(-1);
  listings.push({...low,tier:'low'},{...high,tier:'high'});
 }
 m={key,country:s.country,city,kind,operation,created:s.clock.ticks,expires:s.clock.ticks+3,listings};f.markets[key]=m;
 // Keep the market bounded without changing an open listing's snapshot.
 const old=Object.keys(f.markets);for(const k of old.slice(0,Math.max(0,old.length-40)))delete f.markets[k];return m;
}
function validListing41(q,operation=q?.operation){return !!q&&q.country===s.country&&!s.dead&&s.age>=18&&q.operation===operation&&q.expires>s.clock.ticks&&!housingState41().used.includes(q.id)&&Object.values(housingState41().markets).some(m=>m.listings.some(x=>x.id===q.id&&JSON.stringify(x)===JSON.stringify(q)));}
function houseFigure41(q){const r=houseType41(q.catalogId);return r?'<figure class="house-figure41"><img src="'+r.image+'" alt="'+esc(r.name)+'" width="320" height="360"><figcaption>'+esc(q.kind==='house'?'Этот дом целиком':q.kind==='room'?'Здание, в котором сдаётся комната':'Здание, в котором находится квартира')+'</figcaption></figure>':'';}
function houseFactRows41(q){
 return [
  ['Тип жилья',homeKinds41[q.kind]],['Район',[q.city,districts[q.area]?.name].filter(Boolean).join(' · ')],
  ['Площадь',q.areaM2!=null?q.areaM2+' м²':null],['Комнаты',q.rooms],
  ['Отдельные спальни',q.bedrooms===0?'Нет':q.bedrooms],
  ['Год постройки',q.year],
  ...(q.kind==='flat'?[['Этаж',q.floor!=null?[q.floor,q.floors].filter(n=>n!=null).join(' из '):null]]:
   q.kind==='house'?[['Этажей',q.floors]]:[
    ['Общие помещения','Кухня и санузел'],
    ['Жильё целиком',q.hostRooms&&q.hostArea?q.hostRooms+' комн. · '+q.hostArea+' м²':null]
   ]),
  ['Состояние',q.condition]
 ];
}
function houseDescription41(q){
 return houseFactRows41(q).filter(([,value])=>value!=null&&value!=='')
  .map(([label,value])=>label+' · '+value).join('\n');
}
function houseDetails41(q,extra=[]){
 return houseFigure41(q)+factTiles20([...houseFactRows41(q),...extra]);
}
function housingSearch41(operation){ensureHome();show(operation==='rent'?'Какое жильё снять?':'Какое жильё купить?','Выберите тип и город. В подборке — четыре конкретных предложения: центр и пригород, дешевле и дороже. '+(typeof housingQuote97==='function'?'Цены рассчитаны по игровым данным города.':'Цены взяты из каталога.'),(operation==='rent'?['room','flat','house']:['flat','house']).map(kind=>({label:homeKinds41[kind],fn:()=>housingCity41(operation,kind)})),{title:'Жильё и дорога',open:housingMenu});}
function housingCity41(operation,kind){show('Где искать · '+homeKinds41[kind], 'Выберите город; поездки до работы пересчитаются после переезда.',cities[s.country].map(city=>({label:city+(city===residenceCity()?' · текущий город':''),fn:()=>housingOffers41(operation,kind,city)})),{title:operation==='rent'?'Какое жильё снять?':'Какое жильё купить?',open:()=>housingSearch41(operation)});}
rentalMenu=function(){housingSearch41('rent');};
purchaseMenu=function(){housingSearch41('buy');};
function housingOffers41(operation,kind,city){const m=market41(operation,kind,city);if(!m)return;const available=m.listings.filter(q=>!housingState41().used.includes(q.id));show((operation==='rent'?'Аренда':'Покупка')+' · '+homeKinds41[kind]+' · '+city,'',available.map(q=>({label:districts[q.area].name+' · '+(q.tier==='low'?'Дешевле':'Дороже')+' · '+houseMoney41(operation==='buy'?q.purchase:q.rent)+(operation==='rent'?'/мес.':''),hint:q.areaM2+' м² · '+q.rooms+' комн. · '+q.year+' г. · '+houseType41(q.catalogId).name,fn:()=>housingOfferDetails41(q)})).concat([{label:'Другой город или тип жилья',fn:()=>housingSearch41(operation)}]),{title:'Где искать · '+homeKinds41[kind],open:()=>housingCity41(operation,kind)});
 const d=$('#modal');
 const cityInfo=typeof placeReference190==='function'?placeReference190(s.country,city,'Подробнее',false,true):'';
 d.innerHTML=d.innerHTML.replace('<p></p>',()=>cityInfo?'<details class="place-reference190 housing-city-reference41"><summary>О городе</summary>'+cityInfo+'</details>':'');
 const buttons=d.querySelectorAll?.('.options > button');if(buttons)available.forEach((q,i)=>{buttons[i]?.classList.add('house-offer41');buttons[i]?.insertAdjacentHTML('afterbegin',houseFigure41(q));});d.classList?.add('housing-market41');
}
function houseMoveQuote41(q){const moving=c().cost*.015,refund=(s.housing.deposit||0)*fxRate86(s.housing.depositCountry||s.country),deposit=q.rent;return {moving,refund,deposit,needed:Math.max(0,moving+deposit-refund)};}
function housingOfferDetails41(q){
 const r=houseType41(q.catalogId);
 if(!r)return;
 const buy=q.operation==='buy',total=q.purchase*1.03;
 const quote=buy?null:houseMoveQuote41(q);
 const deposit=typeof depositTerms43==='function'&&!buy?depositTerms43(q.country):null;
 const wage=typeof vacancyWage97==='function'?vacancyWage97(q.country,q.city):0;
 const localAmount=houseMoney41;
 const costs=buy?[
  ['Цена',localAmount(q.purchase)],['С оформлением',localAmount(total)],
  ['Содержание',localAmount(q.purchase*(q.kind==='house'?.00065:.0004))+'/мес.'],
  ['Цена в средних годовых зарплатах',wage>0?(q.purchase/wage).toLocaleString('ru-RU',{maximumFractionDigits:1}):null]
 ]:[
  ['Аренда',localAmount(q.rent)+'/мес.'],['Залог',localAmount(quote.deposit)],['Переезд',localAmount(quote.moving)],
  ['Возврат прежнего залога',quote.refund>0?localAmount(quote.refund):null],
  ['Нужно при переезде',localAmount(quote.needed)],
  ['Доля средней месячной зарплаты',wage>0?Math.round(q.rent/wage*1200)+'%':null]
 ];
 show(r.name,'',[
  ...(buy&&typeof mortgageOptions43==='function'?[{label:'Рассчитать ипотеку',fn:()=>mortgageOptions43(q)}]:[]),
  {label:buy?'Запланировать покупку':'Снять и переехать',
   disabled:!validListing41(q)||(buy?s.properties.length>=5||s.cash<total:s.cash<quote.needed),
   fn:()=>buy?queueHouseBuy41(q):rentHouse41(q)},
  {label:'К предложениям',fn:()=>housingOffers41(q.operation,q.kind,q.city)}
 ],{title:(buy?'Покупка':'Аренда')+' · '+homeKinds41[q.kind]+' · '+q.city,open:()=>housingOffers41(q.operation,q.kind,q.city)});
 const notes=buy?'Покупка с оплатой всей суммы не меняет адрес проживания.':
  'Коммунальные платежи считаются отдельно.'+(deposit?' Залог возвращается через '+deposit.delay+
  ' мес. после выезда. Из залога могут вычесть подтверждённую задолженность по аренде.':'');
 const dialog=$('#modal');
 dialog.innerHTML=dialog.innerHTML.replace('<p></p>',()=>houseDetails41(q)+
  '<section class="house-costs41"><h3>Расходы</h3>'+factTiles20(costs)+
  '<p class="note">'+esc(notes)+'</p></section>');
}
function rentHouse41(q){ensureHome();if(!validListing41(q,'rent'))return false;const x=houseMoveQuote41(q);if(Math.max(0,s.cash)+.001<x.needed)return false;activateHome();leaveHome();if(!spend231(x.moving+x.deposit,'Переезд и залог'))return false;Object.assign(s.housing,{mode:'rent',room40:q.kind==='room',city:q.city,area:q.area,propertyId:null,occupant:null,deposit:x.deposit,depositCountry:s.country,listing41:JSON.parse(JSON.stringify(q)),maintenance41:newMaintenance41()});housingState41().used.push(q.id);ensureLease40();log('Новый адрес',q.city+' · '+districts[q.area].name+' · '+homeKinds41[q.kind]+', '+q.areaM2+' м². Аренда '+money(q.rent)+'/мес. Новый залог '+money(x.deposit)+', возвращён прежний '+money(x.refund)+', переезд '+money(x.moving)+'. Старые счета сохранены.','Жилье',true);save();render();return true;}
function queueHouseBuy41(q){if(!validListing41(q,'buy'))return false;queueCommand05('house41',{listing:JSON.parse(JSON.stringify(q))},'Купить '+homeKinds41[q.kind].toLowerCase()+' · '+q.city);return true;}
function buyHouse41(q){if(!validListing41(q,'buy')||s.properties.length>=5||s.cash+.001<q.purchase*1.03)return false;if(!spend231(q.purchase*1.03,'Покупка недвижимости'))return false;const p={id:id16('home41'),country:q.country,city:q.city,area:q.area,kind:q.kind,price:q.purchase,rented:false,listing41:JSON.parse(JSON.stringify(q)),maintenance41:newMaintenance41()};s.properties.push(p);housingState41().used.push(q.id);log('Недвижимость куплена',homeKinds41[q.kind]+' · '+q.city+', '+q.areaM2+' м². Цена с оформлением '+money(q.purchase*1.03)+'.','Недвижимость',true);return true;}
executeCommand05=function(t){if(t.action!=='house41')return housingBase41.executeCommand05(t);if(t.country!==s.country||!buyHouse41(t.payload?.listing))log('Покупка не состоялась','Предложение истекло, страна изменилась, не хватает денег или достигнут лимит объектов. Деньги не списаны.','Жилье');};
// Compatibility for older scheduled purchases retains their original semantics.
propertyMenu=function(id){const p=s.properties.find(x=>x.id===id);if(!p)return;if(!p.listing41)return housingBase41.propertyMenu(id);const q=p.listing41,occupied=s.housing.propertyId===id;show(homeKinds41[p.kind]+' · '+p.city,'Стоимость '+money(propertyValue(p))+'. Содержание '+money(propertyMaintenance41(p))+'/мес. Возможная аренда '+money(propertyRental41(p))+'/мес., бывают простои. '+(occupied?'Вы живёте здесь.':p.rented?'Объект сдаётся.':'Объект свободен.'),[{label:'Переехать сюда',disabled:occupied||p.rented||p.country!==s.country,fn:()=>moveHome('own',p.city,p.area,p.id)},{label:p.rented?'Завершить сдачу с уведомлением':'Сдавать',disabled:occupied||!!p.noticeUntil,fn:()=>{if(p.rented){p.noticeUntil=s.clock.ticks+2;log('Уведомление арендаторам','Аренда закончится через два месяца.','Недвижимость');}else{p.rented=true;log('Объект выставлен в аренду',p.city+': доход со следующего месяца при отсутствии простоя.','Недвижимость');}propertyMenu(id);}},{label:'Состояние и ремонт'+(p.maintenance41?.issue?' · есть поломка':''),fn:()=>repairMenu41('property',p.id)},{label:'Продать',disabled:p.rented||!!p.noticeUntil,fn:()=>sellMenu(id)},{label:'Назад',fn:housingMenu}]);petInsert38(houseDetails41(q));};
housingMenu=function(){ensureHome();const h=s.housing,q=housingListing41()||(h.mode==='own'?s.properties.find(p=>p.id===h.propertyId)?.listing41:null);show('Жильё и дорога',h.city+' · '+districts[h.area].name+'. '+(q?homeKinds41[q.kind]+' · '+q.areaM2+' м² · '+q.year+' г.':h.mode==='parents'?'У родителей':h.mode==='host'?'У близкого человека':h.mode==='own'?'Собственное жильё':h.room40?'Аренда комнаты':'Аренда')+'\nРасходы на жильё '+money(homeCost())+'/мес. '+(s.job?'Дорога до работы '+commuteMinutes()+' мин. в одну сторону.':'Пока нет рабочего маршрута.'),[{label:'Снять комнату, квартиру или дом',fn:rentalMenu},{label:'Купить квартиру или дом',fn:purchaseMenu},{label:'С кем жить / разъехаться / к родителям',fn:householdMenu},...(q?[{label:'Состояние жилья и ремонт',fn:()=>h.mode==='own'?repairMenu41('property',h.propertyId):repairMenu41('rental')}]:[]),{label:'Искать работу ближе к дому',disabled:!s.job,fn:()=>{assign('search');const t=s.clock.tasks.find(t=>t.kind==='search');if(t){t.probability=jobChance(true);t.nearHome={country:s.country,city:h.city,area:h.area};t.label='Искать работу рядом · '+h.city;}}},...s.properties.map(p=>({label:homeKinds41[p.kind]+' · '+p.city+' · '+(p.rented?'сдаётся':'в собственности'),fn:()=>propertyMenu(p.id)}))]);if(q)petInsert38(houseFigure41(q));};
function newMaintenance41(){return {since:s.clock.ticks,next:s.clock.ticks+18,lastCheck:-1,lastMajor:-1000,issue:null,history:[]};}
function repairTarget41(type,id){if(type==='property'){const p=s.properties.find(p=>p.id===id);return p?.listing41?{record:p,q:p.listing41,owner:true}:null;}const q=housingListing41();return q?{record:s.housing,q,owner:false}:null;}
function repairRisk41(q,year=s.year){const age=Math.max(0,year-q.year);return age<=4?.18:age>=80?.28:age>=45?.16:.06;}
function createRepair41(target){const {record,q,owner}=target,m=record.maintenance41??=newMaintenance41(),age=Math.max(0,s.year-q.year);if(m.issue)return null;const major=owner&&age>=45&&s.clock.ticks-m.lastMajor>=120&&chance(.05);let title,detail;
 if(major){title=q.kind==='house'?'Протечка старой кровли':'Ремонт общедомовых коммуникаций';detail=q.kind==='house'?'Нужен ремонт участка кровли, а не замена крыши целиком.':'Нужен взнос за ремонт общих труб. Это доля квартиры, не стоимость работ для всего здания.';}
 else if(age<=4){[title,detail]=pick([['Регулировка окон','После усадки окна закрываются неплотно. Нужна регулировка.'],['Недоделка вентиляции','Вытяжка шумит и требует настройки.'],['Мелкая протечка соединения','Нужно подтянуть соединение и заменить уплотнение.']]);}
 else if(age>=45){[title,detail]=pick([['Износ сантехники','Потёк старый смеситель. Достаточно ремонта или замены детали.'],['Проблема с проводкой','Износилась розетка на одной линии. Нужен электрик.'],['Сквозняк из окна','Уплотнитель износился; менять все окна не требуется.']]);}
 else [title,detail]=pick([['Неисправность замка','Механизм входного замка заедает.'],['Небольшая протечка','Износился уплотнитель под раковиной.'],['Регулировка отопления','Один клапан требует обслуживания.']]);
 const warranty=owner&&age<=2,country=q.country,base=countries[country].cost,cost=!owner||warranty?0:roundHouse41(base*(major?.18+Math.random()*.15:.008+Math.random()*.016));
 const issue={id:id16('repair41'),title,detail,cost,country,major,warranty,created:s.clock.ticks,status:'open',due:null};m.issue=issue;m.next=s.clock.ticks+24;if(major)m.lastMajor=s.clock.ticks;log(title,q.city+': '+detail+' '+(!owner?'Ремонт за счёт владельца; можно отправить заявку из меню жилья.':warranty?'В игровом договоре действует гарантия: ремонт бесплатный.':'Оценка ремонта '+houseMoney41(cost,country)+'. Решение доступно в меню объекта.'),'Жилье',true);return issue;
}
function finishRepair41(target){const m=target.record.maintenance41,issue=m.issue;if(!issue)return;m.history.push({...issue,status:'repaired',completed:s.clock.ticks});m.history=m.history.slice(-20);m.issue=null;m.next=Math.max(m.next,s.clock.ticks+24);log('Жильё отремонтировано',target.q.city+': '+issue.title.toLowerCase()+'. '+(target.owner?'Работы завершены.':'Расходы оплатил владелец.'),'Жилье');}
function housingRepairsMonth41(){const f=housingState41();if(f.lastRepairs>=s.clock.ticks||s.dead)return;f.lastRepairs=s.clock.ticks;const targets=[...s.properties.filter(p=>p.listing41).map(p=>repairTarget41('property',p.id)),...(housingListing41()?[repairTarget41('rental')]:[])];for(const t of targets){const m=t.record.maintenance41??=newMaintenance41();if(m.lastCheck>=s.clock.ticks)continue;m.lastCheck=s.clock.ticks;if(m.issue?.status==='requested'&&m.issue.due<=s.clock.ticks){finishRepair41(t);continue;}if(s.age<18||m.issue||s.clock.ticks<m.next)continue;if(chance(repairRisk41(t.q)/12))createRepair41(t);}}
function repairAction41(type,id,issueId){const t=repairTarget41(type,id),issue=t?.record.maintenance41?.issue;if(!issue||issue.id!==issueId||issue.status!=='open'||s.dead||s.age<18)return false;if(t.owner){const cost=homeLocal41(issue.cost,issue.country);if(s.cash+.001<cost)return false;if(!spend231(cost,'Ремонт жилья'))return false;s.clock.spent+=cost;finishRepair41(t);}else{issue.status='requested';issue.due=s.clock.ticks+1;log('Заявка владельцу отправлена',t.q.city+': ремонт запланирован на следующий месяц, без оплаты со стороны арендатора.','Жилье');}save();return true;}
function repairMenu41(type,id=null){const t=repairTarget41(type,id);if(!t)return;const m=t.record.maintenance41??=newMaintenance41(),i=m.issue;show('Состояние жилья',houseType41(t.q.catalogId).name+' · '+t.q.year+' г.\n'+(i?i.title+'. '+i.detail+'\n'+(i.status==='requested'?'Заявка принята, работы в следующем месяце.':t.owner?'Ремонт '+money(homeLocal41(i.cost,i.country))+(i.warranty?' · по гарантии':'')+'.':'Ремонт оплачивает владелец. Подайте заявку.'):'Открытых поломок нет. Последний ремонт: '+(m.history.at(-1)?.title||'не требовался')+'.')+'\nПоломки редкие; после события минимум два года без новых поломок. Нерешённые проблемы не создают новые счета каждый месяц.',[...(i&&i.status==='open'?[{label:t.owner?'Заказать ремонт':'Сообщить владельцу',disabled:t.owner&&s.cash<homeLocal41(i.cost,i.country),fn:()=>{repairAction41(type,id,i.id);repairMenu41(type,id);}}]:[]),{label:'Вернуться к жилью',fn:type==='property'?()=>propertyMenu(id):housingMenu}]);}
monthlyFinance=function(){housingState41();housingBase41.monthlyFinance();housingRepairsMonth41();};
save=function(){if(s){housingState41();housingState41().used=housingState41().used.slice(-240);}return housingBase41.save();};
if(s){ensureHome();save();render();}
