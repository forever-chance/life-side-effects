'use strict';
const dossierBase87={start,world};
const tenure87={parents:'Живёт у родителей',host:'Живёт у близких',rent:'Аренда',own:'Собственное жильё',dorm:'Общежитие',unstable42:'Постоянного жилья нет'};
const countryNotes87={
 nl:'Мягкий морской климат, частые дожди и небольшие расстояния между городами. Жильё занимает заметную часть бюджета; рядом с университетами и сферой услуг доступны профессиональные программы MBO.',
 rs:'Континентальный климат с жарким летом и прохладной зимой. Местные доходы сравнительно невысоки; университетское и профессиональное образование дают разные пути на рынок труда.',
 ru:'Климат и повседневные условия заметно различаются между регионами. Наряду с университетами доступны колледжи; крупные города объединяют промышленность, услуги и административную работу.',
 us:'Большая страна с разными климатическими зонами и городскими рынками труда. Университетское образование может требовать крупных расходов; community college даёт более короткий профессиональный путь.',
 br:'От тропического севера до более прохладного юга условия жизни сильно различаются. Достаток семьи влияет на доступные образовательные возможности; в больших городах сосредоточены услуги и деловая жизнь.',
 jp:'Для большей части страны характерны выраженные сезоны и влажное лето. Городская жизнь тесно связана с железнодорожным транспортом; наряду с университетами доступны профессиональные колледжи.',
 fr:'Климат меняется от атлантического побережья до средиземноморского юга. Университетские и профессиональные программы соседствуют с рынком услуг, промышленности и государственных профессий.',
 es:'Внутренние районы отличаются жарким летом, побережья — более мягким климатом. Помимо университетов есть профессиональные программы; услуги, торговля и туризм заметны в городской экономике.',
 de:'Умеренный климат с выраженной сменой сезонов. Промышленность и услуги дополняют друг друга; профессиональная подготовка Ausbildung — отдельный путь к квалификации.',
 uk:'Морской климат обычно означает мягкую зиму и переменчивую погоду. В крупных городах много работы в услугах; университеты и further education предлагают разные образовательные маршруты.',
 ca:'Расстояния велики, а климат существенно зависит от региона; на большей части территории зимы холодные. Английская и французская языковые среды соседствуют; университеты и колледжи дают разные варианты подготовки.',
 kr:'Жаркое влажное лето сменяется холодной зимой. Крупные агломерации объединяют промышленность, технологии и услуги; университетское и профессиональное образование играют заметную роль в карьере.',
 cn:'Климат и городская среда сильно различаются между севером, югом и внутренними районами. Большие города объединяют производство, технологии и услуги; образовательный путь может идти через университет или профессиональный колледж.',
 mx:'Высота над уровнем моря заметно влияет на климат: условия внутренних плато отличаются от побережий. Промышленность, торговля и услуги соседствуют; доступны университеты и технические колледжи.'};
// Editorial geography only. These descriptions never create facts in a character's history.
const cityNotes87={
 'Утрехт':'Компактный университетский город с каналами и крупным железнодорожным узлом. Велосипед и поезд связывают повседневные маршруты с остальной страной.',
 'Амстердам':'Столичный город с каналами, плотной застройкой и международной деловой средой. Трамваи, метро и велосипеды соседствуют на ограниченном городском пространстве.',
 'Роттердам':'Портовый город с современной архитектурой и тесной связью с логистикой. Метро и трамваи соединяют районы по обе стороны речной среды.',
 'Гронинген':'Университетский центр на севере страны. Компактное ядро города удобно для велосипедных поездок, а студенческая жизнь заметна в повседневной среде.',
 'Нови-Сад':'Город на Дунае с университетом и спокойным по сравнению со столицей масштабом. Исторический центр соседствует с жилыми кварталами и промышленными территориями.',
 'Белград':'Столица у слияния Савы и Дуная, где сосредоточены административная и деловая жизнь. Плотные центральные улицы сменяются крупными жилыми массивами за реками.',
 'Ниш':'Крупный город юга Сербии и транспортный узел. Университетская среда соседствует с промышленными районами и историческим центром.',
 'Суботица':'Северный город у венгерской границы с заметной архитектурой сецессии. Многоязычная культурная среда отличает его от других сербских городов.',
 'Екатеринбург':'Крупный промышленный и деловой центр Урала. Городская среда сочетает заводскую историю, широкие проспекты и современные жилые районы.',
 'Москва':'Столица и крупнейшая агломерация страны с разнообразным рынком труда. Метро связывает удалённые районы, но расстояния остаются существенной частью повседневной жизни.',
 'Казань':'Столица Татарстана на Волге с русской и татарской культурной средой. Университеты, промышленность и услуги формируют разные профессиональные маршруты.',
 'Санкт-Петербург':'Большой город на Неве с историческим центром, каналами и портовой инфраструктурой. Университеты, культура и промышленность соседствуют в одной агломерации.',
 'Питтсбург':'Город на холмах у слияния рек, выросший вокруг промышленности. Сегодня университетская и медицинская среда соседствует с наследием стальных предприятий.',
 'Чикаго':'Большой город на озере Мичиган с высотным центром и протяжёнными жилыми районами. Железные дороги, торговля и деловые услуги заметны в его экономике.',
 'Бостон':'Город с плотным историческим ядром и сильной университетской средой. Образование и медицина соседствуют с технологической и деловой работой.',
 'Остин':'Столица Техаса с университетом и технологической средой. Жаркий климат и растянутая застройка влияют на ежедневные поездки.',
 'Куритиба':'Город на южном плато Бразилии с более прохладным климатом, чем на тропическом побережье. Организация автобусного транспорта — заметная часть городской среды.',
 'Сан-Паулу':'Крупная агломерация с высотной застройкой и разнообразным деловым рынком. Повседневные маршруты часто проходят на значительные расстояния.',
 'Рио-де-Жанейро':'Прибрежный город между бухтами, пляжами и горными склонами. Туризм и услуги соседствуют с большими различиями между жилыми районами.',
 'Флорианополис':'Город частично расположен на острове Санта-Катарина. Пляжи, университетская среда и технологические компании дополняют туристическую экономику.',
 'Осака':'Крупный торговый город региона Кансай с плотной застройкой. Развитая железнодорожная сеть связывает его с соседними городами агломерации.',
 'Токио':'Огромная столичная агломерация с множеством деловых центров. Железные дороги определяют повседневные маршруты между работой и жилыми районами.',
 'Киото':'Бывшая столица с историческими кварталами и многочисленными университетами. Туристическая среда соседствует с обычными жилыми районами и современной экономикой.',
 'Фукуока':'Большой город на острове Кюсю у моря. Торговые связи и услуги сочетаются с более компактным центром, чем у крупнейших японских агломераций.',
 'Лион':'Город у слияния Роны и Соны с промышленной и университетской историей. Старые кварталы соседствуют с современными деловыми районами.',
 'Париж':'Столичная агломерация с плотным историческим центром. Метро и пригородные поезда соединяют жилые районы с большим рынком услуг и образования.',
 'Тулуза':'Город юго-запада Франции с заметной авиационной промышленностью. Университеты и инженерная работа дополняют исторический центр из розового кирпича.',
 'Нант':'Город на Луаре с портовой и промышленной историей. Перестроенные промышленные территории соседствуют с жилыми кварталами и культурными площадками.',
 'Валенсия':'Средиземноморский город с портом и протяжённым зелёным пространством в бывшем русле Турии. Торговля и услуги соседствуют с университетской средой.',
 'Мадрид':'Столица на внутреннем плато с жарким летом и прохладной зимой. Административная и деловая работа сосредоточена вокруг большой транспортной сети.',
 'Барселона':'Прибрежный город с плотной квартальной сеткой и портом. Туризм, промышленность и услуги делят ограниченное городское пространство.',
 'Севилья':'Город Андалусии на Гвадалквивире с особенно жарким летом. Исторический центр и административная работа соседствуют с туристической экономикой.',
 'Лейпциг':'Город с торговой, издательской и музыкальной историей. Трамвайная сеть связывает центр с жилыми и бывшими промышленными районами.',
 'Берлин':'Столица с несколькими городскими центрами и разнообразной застройкой. Государственная работа, культура и услуги сосуществуют в большой агломерации.',
 'Гамбург':'Портовый город на Эльбе с сильной логистической средой. Вода, мосты и торговая история заметны в структуре городской жизни.',
 'Мюнхен':'Город юга Германии у подножия альпийского региона. Инженерные отрасли, университеты и деловые услуги формируют широкий рынок квалифицированной работы.',
 'Манчестер':'Большой город с промышленной историей и университетами. Бывшие фабричные районы соседствуют с современными жилыми и деловыми кварталами.',
 'Лондон':'Крупная столичная агломерация с международной деловой средой. Метро и пригородные железные дороги связывают удалённые районы с несколькими центрами занятости.',
 'Бристоль':'Город юго-запада Англии с портовой историей. Авиационная отрасль, университеты и творческие профессии соседствуют в холмистой городской среде.',
 'Эдинбург':'Столица Шотландии с историческим центром на холмах. Государственные учреждения, университеты и культурная жизнь заметны в городской экономике.',
 'Оттава':'Столица Канады на границе англоязычной и франкоязычной среды. Государственная работа и технологии занимают заметное место в городской жизни.',
 'Торонто':'Большая агломерация на озере Онтарио с многоязычной средой. Финансы и услуги сосредоточены в высотном центре, а жилые районы простираются далеко за его пределы.',
 'Монреаль':'Крупный франкоязычный город на острове в системе реки Святого Лаврентия. Университеты и культурная среда соседствуют с технологиями и промышленностью.',
 'Ванкувер':'Тихоокеанский город между морем и горами. Порт, услуги и экранные индустрии дополняют городскую экономику; климат мягче, чем во многих внутренних районах Канады.',
 'Пусан':'Крупный портовый город на юго-востоке Кореи. Морские перевозки и услуги соседствуют с жилыми районами между холмами и побережьем.',
 'Сеул':'Большая столичная агломерация на реке Хан. Метро связывает плотные жилые районы с административными, технологическими и деловыми центрами.',
 'Тэджон':'Город центральной Кореи с научно-исследовательской средой. Институты и университеты дополняют его роль транспортного узла.',
 'Инчхон':'Портовый город рядом с Сеулом, связанный с международным аэропортом. Логистика соседствует с новыми жилыми и деловыми районами.',
 'Чэнду':'Большой город Сычуаньской котловины с мягким влажным климатом. Услуги, университеты и технологические отрасли дополняют региональную экономику.',
 'Шанхай':'Крупный портовый и финансовый центр в устье Янцзы. Высотные деловые районы соседствуют с плотной жилой застройкой и промышленными территориями.',
 'Пекин':'Столица с административной и университетской средой. Кольцевые дороги и метро связывают историческое ядро с удалёнными жилыми районами.',
 'Гуанчжоу':'Город дельты Жемчужной реки с жарким влажным климатом. Торговля и производство тесно связаны с окружающей агломерацией.',
 'Пуэбла':'Город мексиканского нагорья с историческим центром. Промышленность и университетская среда дополняют его региональную роль.',
 'Мехико':'Огромная столица на высокогорном плато. Административная работа, образование и услуги сосредоточены в агломерации с большими расстояниями.',
 'Гвадалахара':'Крупный город западной Мексики с промышленной и технологической средой. Историческое ядро соседствует с обширными жилыми районами.',
 'Монтеррей':'Промышленный и деловой город северо-востока Мексики в окружении гор. Производство и квалифицированная работа заметны в его экономике.'};
function dossierCopy87(v){return v==null?null:JSON.parse(JSON.stringify(v));}
function dossierParents87(){return s.people.filter(p=>['Мать','Отец'].includes(p.role)||s.bio27?.parents?.includes(p.id));}
function dossierHome87(){const h=s.housing||{},host=s.people.find(p=>p.id===h.occupant)||(h.mode==='parents'?dossierParents87().find(p=>p.alive&&p.country===s.country):null);return {mode:h.mode,country:h.country,city:h.city,area:(h.listing41||host?.home59?.listing||h.display59?.listing)?.area||h.area,host:host?.id,listing:dossierCopy87(h.listing41||s.properties?.find(p=>p.id===h.propertyId)?.listing41||host?.home59?.listing||h.display59?.listing)};}
function dossierParentSnapshot87(p){return {id:p.id,name:p.name,role:p.role,country:p.country,birthCountry:p.birthCountry||null,birthCity:p.birthCity||null,origins:dossierCopy87(p.origins||[]),citizenships:dossierCopy87(p.citizenships||[]),occupation:p.occupation||null,education:dossierCopy87(p.bio27?.education||[]),privateCash:Number.isFinite(p.privateCash)?p.privateCash:null,income:p.alive&&p.finance17&&Number.isFinite(p.finance17.lastIncome)?p.finance17.lastIncome:p.alive&&p.finance17&&Number.isFinite(p.finance17.incomeRatio)?countries[p.country].wage*p.finance17.incomeRatio/12:null};}
function createDossier87(newLife=false){const entry=(s.log||[]).find(q=>q.age===0&&q.title==='У этой истории появилось имя'),atBirth=newLife&&s.age===0,country=s.birthCountry||s.identity17?.birthCountry||null;const city=s.birthCity||entry&&cities[country]?.find(city=>entry.text?.includes(city))||null;return {version:1,openedAge:s.age,birth:{country,city,year:Number.isFinite(s.birthYear)?s.birthYear:entry?.year??(atBirth?s.year:null),month:Number.isInteger(s.birthMonth)?s.birthMonth:atBirth?s.clock.month:null,background:s.background??null,origins:dossierCopy87(s.origins||[]),familyMode:s.identity17?.familyMode||null,caregiverId:s.family17?.childhood131?.caregiverId??null,unknownParent:!!s.family17?.childhood131?.unknown,parents:atBirth?dossierParents87().map(dossierParentSnapshot87):null,siblings:atBirth?s.people.filter(p=>['Брат','Сестра'].includes(p.role)).map(p=>({id:p.id,name:p.name,role:p.role})):null,home:atBirth?dossierHome87():null},atBirth};}
function dossier87(){if(!s.dossier87){s.dossier87=createDossier87(false);save();}return s.dossier87;}
start=function(){dossierBase87.start();s.dossier87=createDossier87(true);save();render();};
function dossierCash87(value,country=s.country){return Number.isFinite(value)?Math.round(value).toLocaleString('ru-RU')+' '+(countries[country]?.currency||''):'Не записано';}
function dossierFact87(label,value){return '<div><dt>'+esc(label)+'</dt><dd>'+esc(value??'Не записано')+'</dd></div>';}
function dossierCard87(title,content){return '<section class="dossier-card87"><h2>'+esc(title)+'</h2>'+content+'</section>';}
function dossierEducation87(p){return (p.bio27?.education||p.education||[]).map(q=>[levels16[q.level],fields16[q.field]?.name].filter(Boolean).join(' · ')).filter(Boolean).join('; ');}
function dossierOccupation87(){const study=s.path16?.study;if(study&&study.status!=='paused'){const program=prog16(study.program); /* 2791: прежние программы ушли из programs16 (unis2791.js), по id их находит prog16 */return [s.job?.title,'Учёба'+(program?' · '+programName26(program):'')].filter(Boolean).join('; ');}if(s.job)return s.job.title;if(s.age<6)return 'Дошкольное детство';if(s.age<18)return 'Школа';if(s.studyTrack||s.study)return 'Учёба';if(s.age>=67)return 'Пенсия';if(s.creative47?.applications?.some(a=>a.status==='active')||s.business)return 'Самостоятельная деятельность';return 'Без постоянной работы';}
function dossierPlace87(country,city,area=null){if(!countries[country])return '<p>Место не записано.</p>';let html='<h3>'+esc(countries[country].name)+'</h3><p>'+esc(countryNotes87[country]||'')+'</p><p>Основная языковая среда: '+esc(lang16[country16[country]?.[0]]||'не записана')+'.</p>';if(city){const reference=typeof places190!=='undefined'&&places190[country+'|'+city];
 html+='<h3>'+esc(city)+'</h3>'+(reference?placeReference190(country,city,'Подробнее',false,true):
  cityNotes87[city]?'<p>'+esc(cityNotes87[city])+'</p>':'');const index=cities[country]?.indexOf(city);if(index>=0&&index<4)html+='<p>Уровень цен предложения жилья: '+['более доступный среди представленных городов страны','наиболее высокий среди представленных городов страны','повышенный среди представленных городов страны','средний среди представленных городов страны'][index]+'.</p>';}if(area&&districts[area])html+='<h3>'+esc(districts[area].name)+'</h3><p>'+esc(area==='center'?'Центральный район. В жилых предложениях стоимость аренды выше, чем в пригороде.':area==='suburb'?'Пригородный район. Аренда обычно обходится дешевле, чем в центре.':'')+'</p>';return html;}
function dossierBirthStory87(b){
 const parts=[];
 const background={low:'В те годы семья жила скромно: денег хватало впритык.',mid:'Денег в семье хватало на привычную жизнь.',high:'Семья жила в достатке.'}[b.background];
 if(background)parts.push(background);
 const caregiverId=b.caregiverId??s.family17?.childhood131?.caregiverId;
 const caregiver=caregiverId&&(b.parents?.find(p=>p.id===caregiverId)||s.people.find(p=>p.id===caregiverId));
 if(caregiver){
  parts.push((caregiver.role==='Мать'?'С рождения вас растила ':'С рождения вас растил ')+caregiver.name+'.');
  parts.push(b.unknownParent?'Второй родитель неизвестен.':'Второй родитель жил отдельно.');
 }
 if(b.siblings?.length){
  const why=s.gender==='f'?'Когда вы родились':'Когда вы родились';
  const names=b.siblings.map(p=>(p.role==='Сестра'?'старшая сестра ':'старший брат ')+p.name);
  parts.push(why+', в семье '+(names.length===1?(b.siblings[0].role==='Сестра'?'уже была ':'уже был '):'уже были ')+names.join(', ')+'.');
 }
 if(b.home){
  const {mode,listing}=b.home;
  const home={parents:'Вы жили у родителей',host:'Вы жили у близких',rent:'Семья снимала жильё',own:'У семьи было своё жильё',dorm:'Семья жила в общежитии',unstable42:'Постоянного жилья у семьи тогда не было'}[mode];
  if(home)parts.push(home+(listing?' ('+(homeKinds41[listing.kind]||'жильё').toLocaleLowerCase('ru')+', '+listing.rooms+' комн., '+listing.areaM2+' м²)':'')+'.');
 }
 if(b.familyMode==='migrant')parts.push('Семья незадолго до вашего рождения переехала в эту страну.');
 return parts.length?'<p>'+esc(parts.join(' '))+'</p>':'';
}

const dossierArtCountries114 = new Set('jp de es rs uk cn nl tr no au us ma ca fr eg ru mx id th br kr pl it in za'.split(' '));

function dossierArt114(country, affluent) {
 if (!dossierArtCountries114.has(country)) return '';
 const tier = affluent ? 'affluent' : 'modest';
 const alternate = (country === 'ma' && affluent || country === 'mx' && !affluent) &&
   characterHash43(s.name + '|' + s.birthYear + '|' + country) % 2 === 1;
 const file = country + '-' + tier + (alternate ? '-2' : '') + '.webp';
 return '<img class="dossier-place-art114" src="dossier-art114/' + file +
   '" alt="' + esc('Иллюстрация жилого района · ' + countries[country].name) +
   '" loading="lazy" decoding="async">';
}

function dossierAffluent114(birth, budget, parents) {
 const reference = vacancyWage97(s.country, residenceCity()) / 12;
 if (s.age < 18) {
  const incomes = parents.filter(p => p.alive && p.country === s.country)
    .map(p => p.finance17?.lastIncome).filter(Number.isFinite);
  return incomes.length ? incomes.reduce((sum, income) => sum + income, 0) / incomes.length >= reference * 1.2
    : birth.background === 'high';
 }
 return budget.income >= reference * 1.2;
}

function dossierSeparatedParents132(){
 const terms=s.family17?.separation132||s.family17?.childhood131;
 if(!terms||typeof terms.contact!=='boolean')return '';
 const caregiver=s.people.find(p=>p.id===terms.caregiverId);
 const other=s.people.find(p=>p.id===terms.otherParentId);
 const support=s.age>=18?'Период детских выплат завершён':!terms.support?'Регулярных выплат нет':
  terms.lastPaidTick==null?'Алименты предусмотрены; выплат пока не было':
  'Последний перевод · '+dossierCash87(terms.lastPaid,terms.lastPaidCountry);
 return dossierCard87('Когда родители живут отдельно','<dl>'+
  dossierFact87('Первоначально жил с',caregiver?.name)+
  dossierFact87('Второй родитель',terms.unknown?'Неизвестен':other?.name)+
  dossierFact87('Общение',terms.unknown?'Нет контакта':!other?.alive?'Родитель умер':terms.contact?'Общение сохраняется':'Регулярного общения нет')+
  dossierFact87('Поддержка',support)+'</dl>');
}

function dossierParentCards207(atBirth, parents){
 const saved=new Map((atBirth||[]).map(p=>[p.id,p]));
 const current=new Map(parents.map(p=>[p.id,p]));
 const ids=new Set([...saved.keys(),...current.keys()]);
 const agreements=s.family17?.longTerm21?.agreements||[];
 const citizenship=p=>(p.citizenships||[]).map(id=>countries[id]?.name||id).join(', ');
 const birthPlace=p=>[p.birthCity,countries[p.birthCountry]?.name].filter(Boolean).join(', ');
 const cash=(amount,country,monthly=false)=>Number.isFinite(amount)?dossierCash87(amount,country)+(monthly?'/мес.':''):'Не записано';
 const rows=items=>'<dl>'+items.map(([label,value])=>dossierFact87(label,value)).join('')+'</dl>';
 const cards=[...ids].map(id=>{
  const then=saved.get(id),now=current.get(id),parent=now||then;
  const support=agreements.filter(a=>a.parentId===id&&a.payer!=='player'&&
   ['active','paused','review'].includes(a.status)&&(!Number.isFinite(a.end)||a.end>s.clock.ticks));
  const supportText=support.map(a=>[
   supportTypes21[a.type]||'Помощь',cash(a.amount,a.country,true),a.status==='active'?'':statuses21[a.status]
  ].filter(Boolean).join(' · ')).join(' / ');
  const educationThen=then&&dossierEducation87(then);
  const educationNow=now&&dossierEducation87(now);
  const nowRows=now?[
   ['Занятие',now.alive?now.occupation||'Не записано':'Остаётся в семейной истории'],
   ...(citizenship(now)&&citizenship(now)!==(then&&citizenship(then))?[['Гражданство',citizenship(now)]]:[]),
   ...(educationNow&&educationNow!==educationThen?[['Образование',educationNow]]:[]),
   ...(now.alive?[
    ['Личные накопления',cash(now.privateCash,now.country)],
    ['Последний доход',cash(now.finance17?.lastIncome,now.country,true)],
    ['Регулярная помощь',supportText||'Нет действующих договорённостей']
   ]:[])
  ]:[];
  const thenRows=then?[
   ['Занятие',then.occupation||'Не записано'],['Гражданство',citizenship(then)||'Не записано'],
   ['Образование',educationThen||'Не записано'],['Доход',cash(then.income,then.country,true)],
   ['Накопления',cash(then.privateCash,then.country)]
  ]:[];
  const origin=(now?.origins?.length?now.origins:then?.origins||[]).join(' / ');
  const place=(now&&birthPlace(now))||(then&&birthPlace(then));
  return '<details><summary>'+esc(parent.role+' · '+parent.name+(now&&!now.alive?' · умер'+(now.gender==='f'?'ла':''):''))+'</summary>'+
   (origin||place?rows([...(origin?[['Происхождение',origin]]:[]),...(place?[['Место рождения',place]]:[])]):'')+
   (thenRows.length?'<h4>При вашем рождении</h4>'+rows(thenRows):'')+ // 270: «вы» вместо «ты» в заголовке
   (nowRows.length?'<h4>Сейчас</h4>'+rows(nowRows):'')+
   (now?'<button class="small" data-person="'+esc(id)+'" onclick="personDetail(this.dataset.person)">Открыть карточку</button>':'')+'</details>';
 });
 return cards.length?'<h3>Родители</h3><div class="dossier-pair207 dossier-parents207">'+cards.join('')+'</div>':'';
}
function dossierView87(){const archive=dossier87(),b=archive.birth,h=dossierHome87(),q=h.listing,budget=monthlyBudget(),parents=dossierParents87(),partner=currentPartner(),children=s.people.filter(p=>p.alive&&ownChild53(p)&&p.age<18),birthDate=b.year==null?'Дата не записана':(b.month==null?'':months[b.month]+' ')+b.year,marital=bioRows().find(row=>row[0]==='marital')?.[2]||'Не записано';const citizens=(s.citizenships||[s.citizenship].filter(Boolean)).map(id=>countries[id]?.name||id).join(', ')||'Не записано';const residence=[residenceCity(),c().name].filter(Boolean).join(', ');let html='<article class="dossier87 dossier-content243"><header class="dossier-cover87"><p class="eyebrow">Личное дело · досье</p><h1>'+esc(s.name+' '+(s.surname||''))+'</h1><p>'+esc(years(s.age))+' · '+esc([dossierOccupation87(),residence].filter(Boolean).join(' · '))+'</p></header>';
html+=dossierCard87('Общие сведения','<dl>'+dossierFact87('Рождение',birthDate+' · '+[b.city,countries[b.country]?.name].filter(Boolean).join(', '))+dossierFact87('Гражданство',citizens)+dossierFact87('Сейчас живёт',residence)+dossierFact87('Семейное положение',marital)+'</dl>');
if(typeof originReference190==='function'){
 const originNote=originReference190(s).html;
 html+=dossierCard87('Происхождение','<dl>'+
 dossierFact87('Национальное происхождение',origins190(s).join(' / ')||'Не записано')+
 dossierFact87('Гражданство',citizens)+
 dossierFact87('Место рождения',[b.city,countries[b.country]?.name].filter(Boolean).join(', ')||'Не записано')+
 '</dl>'+(originNote?'<div class="dossier-origin-note87">'+originNote+'</div>':''));
}
const sameCity=b.country===s.country&&b.city===residenceCity();
const birthPlace=sameCity
 ? '<p>'+esc([b.city,countries[b.country]?.name,districts[b.home?.area]?.name].filter(Boolean).join(' · '))+'</p>'
 : dossierPlace87(b.country,b.city,b.home?.area);
html+=dossierCard87(s.gender==='f'?'Семья, в которой вы родились':'Семья, в которой вы родились',
 dossierArt114(b.country,b.background==='high')+
 (countries[b.country]?'<h3>Место рождения</h3>'+birthPlace:'')+
 dossierBirthStory87(b)+dossierParentCards207(b.parents,parents));
html+=dossierSeparatedParents132();
const care=s.family17?.care136;
const careHistory=s.family17?.careHistory139||(care?[care]:[]);
if(careHistory.length)html+=dossierCard87('Смена опекуна','<dl>'+careHistory.map(entry=>{
 const date=Number.isFinite(entry.year)?[months[entry.month],entry.year].filter(Boolean).join(' '):'Дата не записана';
 const role=entry.reason==='longTerm'?'Долгосрочная опека':entry.reason==='custody'?'Проживание на время заключения':entry.reason==='custodyReturn'?'Возвращение домой после заключения':entry.reason==='illness'?'Временное проживание на время лечения':entry.reason==='healthReturn'?'Возвращение домой после лечения':entry.kind==='residential'?'Детский дом':entry.reason==='adoption'?'Усыновление или удочерение':entry.reason==='reunion'?'Возвращение из приёмной семьи':entry.kind==='foster'?'Приёмный опекун':'После смерти родителя заботу взял на себя';
 const name=s.people.find(p=>p.id===entry.caregiverId)?.name;
 return dossierFact87(role,[name,entry.city,date].filter(Boolean).join(' · '));
}).join('')+'</dl>');
const circumstances='<p>'+esc((tenure87[h.mode]||'Жилищный статус не записан')+(h.host?' · '+(s.people.find(p=>p.id===h.host)?.name||'близкий'):'')+(partner?.cohabit&&partner.country===s.country?'. Вместе с партнёром: '+partner.name:'')+'.')+'</p><dl>'+dossierFact87('Жильё',q?(homeKinds41[q.kind]||'Жильё')+' · '+q.rooms+' комн. · '+q.areaM2+' м²':'Подробности не записаны')+dossierFact87('Занятие',dossierOccupation87())+dossierFact87('Дети до 18 лет',children.length?children.map(p=>p.name).join(', '):'Нет')+dossierFact87('Хватает ли дохода',s.age<18?'Основные расходы несут взрослые':['parents','host'].includes(h.mode)?'Жильё предоставляют близкие':budget.income>=budget.cost+budget.debt?'Доход покрывает расходы и платежи':'Дохода не хватает на расходы и платежи')+'</dl><button onclick="currentHomeMenu59()">Открыть жильё</button>';
const finances='<dl>'+dossierFact87('Накопления',money(s.cash))+dossierFact87('Доход от работы',s.job?money(s.job.salary/12)+'/мес.':'Нет постоянной зарплаты')+dossierFact87('Все поступления',money(budget.income)+'/мес.')+dossierFact87('Расходы на жизнь',money(budget.cost)+'/мес.')+dossierFact87('Обязательные платежи',money(budget.debt)+'/мес.')+dossierFact87('Общий долг',(s.debts||[]).filter(d=>d.balance>0).length?money(s.debts.filter(d=>d.balance>0).reduce((sum,d)=>sum+d.balance*debtRatio(d),0)):'Нет')+dossierFact87('Недвижимость',(s.properties||[]).length?String(s.properties.length):'Нет записанных объектов')+'</dl><button onclick="financeMenu()">Открыть бюджет</button>';
html+=dossierCard87('Текущие обстоятельства',
 (s.country!==b.country?dossierArt114(s.country,dossierAffluent114(b,budget,parents)):'')+
 dossierPlace87(s.country,residenceCity(),h.area)+
 '<div class="dossier-pair207 dossier-current207"><section><h3>Быт и семья</h3>'+circumstances+
 '</section><section><h3>Личные деньги</h3>'+finances+'</section></div>');
return html+'</article>';}
world=function(){return dossierView87();};
