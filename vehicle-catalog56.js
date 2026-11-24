'use strict';
// Game prices are relative to local annual living costs, not real market quotes.
const carRows56={uk:['Ford Fiesta','Vauxhall Corsa','Nissan Qashqai','Range Rover Sport','Mini Cooper'],fr:['Peugeot 206','Renault Clio','Peugeot 3008','DS 7','Citroën 2CV'],kr:['Kia Morning','Hyundai Avante','Kia Sorento','Genesis G80','Hyundai Ioniq 5'],cn:['Wuling Mini EV','BYD Qin Plus','BYD Song Plus','NIO ET7','Xiaomi SU7'],nl:['Opel Corsa','Kia Picanto','Toyota Yaris Cross','Volvo XC40','Škoda Elroq'],rs:['Fiat Punto','Škoda Fabia','Škoda Octavia','BMW X5','Zastava Yugo'],ru:['Lada 2107','Lada Granta','Haval Jolion','Geely Monjaro','Lada Niva'],us:['Honda Civic','Toyota Camry','Ford F-150','Cadillac Escalade','Ford Mustang'],br:['Volkswagen Gol','Fiat Mobi','Chevrolet Onix','Jeep Commander','Fiat Strada'],jp:['Suzuki Alto','Honda N-Box','Toyota Prius','Toyota Alphard','Nissan GT-R'],es:['SEAT Ibiza','Dacia Sandero','SEAT Arona','CUPRA Formentor','SEAT 600'],de:['Volkswagen Polo','Volkswagen Golf','Volkswagen Passat','Mercedes E-Class','Porsche 911'],ca:['Honda Civic','Toyota Corolla','Toyota RAV4','Lexus RX','Subaru Crosstrek'],mx:['Nissan March','Nissan Versa','Nissan NP300','BMW X5','VW Beetle / Vocho']};
const vehicleRoles56=['Бюджетная','Городская','Семейная','Премиум','Характерная'];
const vehicleCatalog56=[];
for(const [country,names] of Object.entries(carRows56))names.forEach((name,role)=>{let m=vehicleCatalog56.find(m=>m.kind==='car'&&m.name===name);if(!m){m={id:'car56-'+vehicleCatalog56.filter(m=>m.kind==='car').length,name,kind:'car',price:[.42,.7,1.15,2.6,1.05][role],seats:role===2?5:role===4?4:5,roles:{},weights:{}};vehicleCatalog56.push(m);}m.roles[country]=role;m.weights[country]=5;});
if (typeof carMarkets95 !== 'undefined') {
  for (const [country, models] of Object.entries(carMarkets95)) {
    for (const [index, name] of models.entries()) {
      const premium = /Ferrari|BMW|Mercedes|Polestar|Alfa Romeo Giulia/.test(name);
      const role = premium ? 3 : index < 2 ? 0 : index < 5 ? 1 : 2;
      let model = vehicleCatalog56.find(entry => entry.name === name);
      if (!model) {
        const slug = name.normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/-$/,'');
        model = {id:'car95-'+slug,name,kind:'car',price:name==='Ferrari Roma'?11:[.42,.78,1.28,3.4][role],
          seats:name==='Ferrari Roma'?2:5,roles:{},weights:{}};
        vehicleCatalog56.push(model);
      }
      model.roles[country] = role;
      model.weights[country] = premium ? 1 : index < 5 ? 5 : 3;
    }
    carRows56[country] = models;
  }
}
const bikeRows56=[['city','Городской велосипед',.016],['retro','Классический / omafiets',.02],['trekking','Гибрид / trekking',.033],['mtb','Горный MTB',.035],['road','Шоссейный велосипед',.065],['folding','Складной велосипед',.045],['electric','Электровелосипед',.12],['cargo','Грузовой / bakfiets',.19],['seat','Семейный с детским креслом',.04],['mamachari','Mamachari',.03],['bmx','BMX / трюковой',.025]];
const bikePresets56={uk:['trekking','folding','road'],fr:['city','trekking','road'],kr:['city','folding'],cn:['city','electric','folding'],nl:['retro','cargo','electric','seat','city'],rs:['mtb','city','retro','trekking'],ru:['city','mtb','retro','folding'],us:['trekking','mtb','electric','road'],br:['city','mtb','road'],jp:['mamachari','electric','folding','seat'],es:['city','road','mtb'],de:['trekking','city','electric','cargo','road'],ca:['trekking','mtb','city','electric'],mx:['city','mtb','cargo']};
if (typeof expansion95 !== 'undefined') {
  for (const id of Object.keys(expansion95)) bikePresets56[id] = ['city','trekking','mtb'];
}
for(const [id,name,price] of bikeRows56)vehicleCatalog56.push({id:'bike56-'+id,name,kind:'bike',price,seats:['cargo','seat','mamachari'].includes(id)?2:1,weights:Object.fromEntries(Object.entries(bikePresets56).filter(([,ids])=>ids.includes(id)).map(([c])=>[c,5]))});
const mobilityRules56={nl:{bike:.52,car:1.05,parking:.035},jp:{bike:.65,car:1.05,parking:.025},us:{bike:.95,car:.53,parking:.012},ca:{bike:.88,car:.58,parking:.014},rs:{bike:.8,car:.7,parking:.009},ru:{bike:.9,car:.67,parking:.009},uk:{bike:.7,car:.8,parking:.022},fr:{bike:.65,car:.85,parking:.022},de:{bike:.62,car:.76,parking:.02},es:{bike:.72,car:.8,parking:.018},kr:{bike:.72,car:.88,parking:.022},cn:{bike:.68,car:.85,parking:.02},br:{bike:.9,car:.7,parking:.012},mx:{bike:.9,car:.7,parking:.012}};

if (typeof expansion95 !== 'undefined') {
  Object.assign(mobilityRules56,{
    it:{bike:.76,car:.85,parking:.027}, au:{bike:.85,car:.63,parking:.019},
    tr:{bike:.92,car:.80,parking:.018}, za:{bike:.95,car:.60,parking:.015},
    th:{bike:.84,car:.82,parking:.019}, no:{bike:.71,car:.78,parking:.025},
    in:{bike:.86,car:.90,parking:.015}, id:{bike:.88,car:.84,parking:.016},
    eg:{bike:.95,car:.86,parking:.015}, ma:{bike:.89,car:.78,parking:.014},
    pl:{bike:.72,car:.72,parking:.016}
  });
}
