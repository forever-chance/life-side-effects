'use strict';
// Game estimates, nominal local currency at the 2021 baseline.
// Pairs: new city car, pedigree dog from a breeder.
const marketBaselines98 = {"nl":[17360,1350],"rs":[1950400,70560],"ru":[1203160,55450],"us":[15450,1812],"uk":[14070,1218],"fr":[16280,1280],"de":[15960,1350],"es":[15500,1050],"ca":[22760,2231],"br":[118350,4733],"mx":[398180,16660],"jp":[1980470,202090],"kr":[19199380,1615660],"cn":[98480,5920],"it":[16580,1100],"au":[27210,2563],"tr":[401400,10660],"za":[312780,12970],"th":[698460,21960],"no":[201270,17480],"in":[1083970,40440],"id":[280596800,8889880],"eg":[369710,8010],"ma":[192040,5250],"pl":[72680,4137]};

function carPrice98(model,country,used,condition,age) {
 const baseline=economyLocal97(marketBaselines98[country][0],country);
 const role=model.roles?.[country] ?? Object.values(model.roles||{})[0] ?? 1;
 const local=!!model.weights[country];
 const classFactor=[.78,1,1.65,3.5,1.1][role] || 1;
 const modelFactor=Math.max(.8,Math.min(1.35,model.price/[.42,.7,1.15,2.6,1.05][role]));
 const exotic=model.name==='Ferrari Roma'?7.5:1;
 const typicalAge=role===0?12:role===4?18:7;
 const ageFactor=Math.max(.5,Math.min(1.55,Math.pow(.94,(age??typicalAge)-typicalAge)));
 const resale=used?(role===0?.30:role===4?.55:.44)*condition/100*ageFactor:1;
 return Math.round(baseline*classFactor*modelFactor*exotic*resale*(local?1:1.18));
}

function dogCareFactor98(country) {
 const eur=marketBaselines98[country][1]/economy97.countries[country].fx;
 return Math.max(.72,Math.min(1.45,.65+eur/3300));
}

function petMonthly98(kind,country=s.country,city=country===s.country?residenceCity():null) {
 const localFactor=city?cityExpenseFactor126(country,city,.16):1;
 return countries[country].cost*petKinds[kind].monthly/12*localFactor*(['dog','cat'].includes(kind)?dogCareFactor98(country):1);
}

function breederMarket179(breed,country=s.country){
 return typeof petBreedPrices179==='object'?petBreedPrices179[breed.id]?.[country]:null;
}
function breederAvailability179(breed,country=s.country){
 return ({common:'часто у заводчиков',uncommon:'встречается у заводчиков',rare:'редкая порода',import_only:'под заказ или импорт'})[breederMarket179(breed,country)?.[1]]||'';
}
function breederPrice98(breed,country=s.country) {
 const market=breederMarket179(breed,country);
 if(market)return Math.round(economyLocal97(market[0],country));
 if(breed.kind!=='dog') return Math.round(countries[country].cost*breed.price*
  (breed.kind==='cat'?dogCareFactor98(country):1));
 const baseline=economyLocal97(marketBaselines98[country][1],country);
 const typical=petBreeds38.filter(b=>b.kind==='dog'&&!breederMarket179(b,country)).map(b=>b.price).sort((a,b)=>a-b);
 const median=typical[Math.floor(typical.length/2)];
 return Math.round(baseline*Math.max(.55,Math.min(2.35,breed.price/median)));
}

function petSetupFraction98(q) {
 const breed=q.source38==='breeder'&&petBreed38(q.breed38);
 if(breed) return breederPrice98(breed)/c().cost;
 if(q.source38==='rehoming')return 0;
 return petKinds[q.kind].adopt*(q.kind==='dog'&&q.source38==='shelter'?dogCareFactor98(s.country):1);
}

const dogSpotlight98 = {
 nl:['labrador','schipperke'],rs:['german-shepherd','labrador'],ru:['samoyed','husky'],
 us:['labrador','poodle'],uk:['corgi','labrador'],fr:['french-bulldog','poodle'],
 de:['german-shepherd','dachshund'],es:['poodle','labrador'],ca:['labrador','husky'],
 br:['poodle','french-bulldog'],mx:['chihuahua','pug'],jp:['shiba','poodle'],
 kr:['poodle','pug'],cn:['pug','poodle'],it:['poodle','labrador'],
 au:['labrador','poodle'],tr:['german-shepherd','rottweiler'],za:['rottweiler','labrador'],
 th:['poodle','pug'],no:['husky','samoyed'],in:['labrador','pug'],
 id:['poodle','shiba'],eg:['saluki','german-shepherd'],ma:['saluki','german-shepherd'],
 pl:['german-shepherd','dachshund']
};

function breederBreeds98(kind,country=s.country) {
 const featured=kind==='dog' ? dogSpotlight98[country] || [] : [];
 return petBreeds38.filter(b=>b.kind===kind).sort((a,b)=>Number(featured.includes(b.id))-Number(featured.includes(a.id)));
}
