'use strict';
// 2021 gameplay estimates for lodging, meals and a modest day out.
const travelDailyLocal100 = {
 nl:95,rs:4469,ru:3583,us:153,uk:92,fr:100,de:97,es:75,ca:164,br:297,
 mx:1203,jp:13690,kr:127910,cn:419,it:83,au:194,tr:990,za:1117,th:1969,
 no:1329,in:3370,id:792010,eg:748,ma:462,pl:267
};

function baseTravelStay105(d) {
 if(d.stayHome86)return 0;
 const abroad=typeof tourAbroad103==='object'&&tourAbroad103[d.country];
 if(abroad)return tourPlace123(d.country,d.city)[1]*d.days*travelComfort52[d.comfort].daily/1.7;
 const currency=economy97.countries[d.country], daily=travelDailyLocal100[d.country];
 if(!currency||!daily)return null;
 return daily/currency.fx*d.days*travelComfort52[d.comfort].daily/1.7;
}

function travelLodging105(d){
 const stay=baseTravelStay105(d);
 const factor=typeof lodgingSeason105==='function'?lodgingSeason105(d).factor:1;
 return stay==null?null:stay*.45*factor;
}

function travelStay100(d){
 const base=baseTravelStay105(d);
 return base==null?null:base*.55+travelLodging105(d);
}

function travelSharedSaving100(d, partySize) {
 const lodging=travelLodging105(d);
 if(!lodging || partySize<2)return 0;
 // The lodging portion is shared by up to two travelers per room.
 return lodging*(partySize-Math.ceil(partySize/2))*fxRates86[s.country];
}

// Indicative public-transport gateways. Transfers are flat gameplay estimates.
const travelGateways113 = {
 nl:['Амстердам',25], rs:['Белград',28], ru:['Москва',65], us:['Нью-Йорк',85],
 uk:['Лондон',35], fr:['Париж',34], de:['Франкфурт',30], es:['Мадрид',28],
 ca:['Торонто',75], br:['Сан-Паулу',58], mx:['Мехико',48], jp:['Токио',42],
 kr:['Сеул',30], cn:['Пекин',55], it:['Рим',28], au:['Сидней',85],
 tr:['Стамбул',32], za:['Йоханнесбург',50], th:['Бангкок',30], no:['Осло',40],
 in:['Нью-Дели',32], id:['Джакарта',40], eg:['Каир',25], ma:['Касабланка',27], pl:['Варшава',24]
};

function travelTransfers113(d){
 if(!d.city||d.stayHome86||d.country===s.country)return [];
 return [[s.country,residenceCity()],[d.country,d.city]].flatMap(([country,city],i)=>{
  const gateway=travelGateways113[country];
  if(!gateway||city===gateway[0])return [];
  const hub=gateway[0];
  return [{from:i?hub:city,to:i?city:hub,fee:gateway[1]}];
 });
}

function residentialDistance173(from, fromCity, to, toCity){
 const a=cityCoordinates173[from]?.[fromCity],b=cityCoordinates173[to]?.[toCity];
 if(!a||!b)return null;
 const rad=Math.PI/180;
 const h=Math.sin((a[1]-b[1])*rad/2)**2+Math.cos(a[1]*rad)*Math.cos(b[1]*rad)*Math.sin((a[0]-b[0])*rad/2)**2;
 return 12742*Math.asin(Math.sqrt(Math.min(1,h)));
}

function residentialFare173(country,city){
 const km=residentialDistance173(s.country,residenceCity(),country,city);
 if(km===null)return null;
 const domestic=country===s.country;
 const market=domestic?Math.max(.4,Math.min(1.25,travelDailyLocal100[country]/economy97.countries[country].fx/95)):1;
 const price=domestic?(12+Math.min(km,600)*.12+Math.max(0,km-600)*.065)*market:65+km*.078;
 return Math.max(5,Math.round(price/5)*5);
}

function publicFare113(d){
 if(d.stayHome86)return 0;
 return (residentialFare173(d.country,d.city)??travelFare86(d.country,d.city))+travelTransfers113(d).reduce((sum,leg)=>sum+leg.fee,0);
}

function holidayIncome113(person){
 const country=person.country;
 const recorded=person.finance17?.lastIncome;
 const typical=vacancyWage97(country,person.city18)/12;
 return Math.max(0,recorded??typical*(person.finance17?.incomeRatio??.65))*fxRate86(country);
}
