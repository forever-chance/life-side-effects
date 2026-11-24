'use strict';
// Authored fictional institutions; all parameters are game balance, never admissions advice.
const lang16={nl:'Нидерландский',sr:'Сербский',ru:'Русский',en:'Английский',pt:'Португальский',ja:'Японский',fr:'Французский',es:'Испанский',de:'Немецкий',ko:'Корейский',zh:'Китайский'};
const country16={nl:['nl',36,24,48,16,'MBO',24],rs:['sr',48,12,36,15,'Профессиональная школа',36],ru:['ru',48,24,48,15,'Колледж после 9 класса',36],us:['en',48,24,60,16,'Community college',24],br:['pt',48,24,48,16,'Технический колледж',24],jp:['ja',48,24,36,16,'Профессиональный колледж',36],fr:['fr',36,24,36,16,'Профессиональный лицей',24],es:['es',48,12,36,16,'Formación profesional',24],de:['de',36,24,48,16,'Ausbildung',36],uk:['en',36,12,48,16,'Further education college',24],ca:['en',48,24,48,16,'College diploma',24],kr:['ko',48,24,48,16,'Junior college',24],cn:['zh',48,36,48,16,'Профессиональный колледж',36],mx:['es',48,24,48,16,'Технический колледж',24]};
if (typeof expansion95 !== 'undefined') {
  for (const [id, entry] of Object.entries(expansion95)) {
    lang16[entry.language] = entry.languageName;
    country16[id] = [entry.language, id === 'au' ? 36 : 48, 24, 36, 16, 'Профессиональный колледж', 24];
  }
}
const fields16={computing:{name:'Информатика',related:['engineering','business'],legacy:['code','qa']},engineering:{name:'Инженерия',related:['computing','science'],legacy:['engineering','architecture']},medicine:{name:'Медицина',related:['science','care'],legacy:['medicine']},care:{name:'Уход и здоровье',related:['medicine','education'],legacy:['nursing']},business:{name:'Экономика и управление',related:['computing','media'],legacy:['marketing']},law:{name:'Право',related:['business'],legacy:['law']},education:{name:'Педагогика',related:['arts','care'],legacy:['teaching']},science:{name:'Естественные науки',related:['engineering','medicine'],legacy:['science']},arts:{name:'Искусство и кино',related:['media'],legacy:['design','sound']},media:{name:'Литература и коммуникации',related:['arts','business'],legacy:['media']},trade:{name:'Ремесла и производство',related:['engineering'],legacy:['electric','craft']},service:{name:'Сервис и гостеприимство',related:['business','care'],legacy:['cook','beauty','service']}};
const levels16={vocational:'Профессиональное образование',bachelor:'Бакалавриат',master:'Магистратура',phd:'PhD',certificate:'Дополнительное образование'};
const profiles16=[
 ['Национальный исследовательский университет',['science','computing','law','business'],92,84,1.3,90,90,80],
 ['Политехнический институт',['engineering','computing','trade'],84,73,1,86,89,88],
 ['Университет искусств и кино',['arts','media'],79,76,1.2,78,85,68],
 ['Медицинский университет',['medicine','care','science'],87,85,1.5,94,91,90],
 ['Региональный университет',['education','business','media','science'],58,48,.65,58,65,63],
 ['Международная бизнес-школа',['business','computing','law'],83,70,2.4,78,81,89],
 ['Университет прикладных наук',['computing','engineering','service','care'],67,53,.85,69,76,86],
 ['Гуманитарная академия',['media','law','education','arts'],72,61,.8,72,79,62],
 ['Технический колледж',['trade','service','computing','care','science','media'],48,32,.35,52,70,83],
 ['Открытый городской университет',['business','education','media','computing'],51,35,.5,48,61,58]
];
const universities16=Object.keys(country16).flatMap((country,ci)=>profiles16.map((x,i)=>({id:country+'-u'+i,country,city:cities[country][i%4],name:x[0]+' «'+['Горизонт','Мост','Кадр','Пульс','Река','Контур','Практика','Диалог','Мастерская','Перспектива'][i]+'» · '+cities[country][i%4],fields:x[1],prestige:x[2],selectivity:x[3],price:x[4],load:x[5],quality:x[6],employment:x[7],scholarships:i===5?.12:i===0?.42:.28,international:i===5||i===0||i===6,profile:i})));
if (typeof expansion95 !== 'undefined') {
  for (const [country, entry] of Object.entries(expansion95)) {
    const generated = universities16.filter(u => u.country === country);
    const locations = Object.values(entry.cities);
    for (const [i, university] of generated.entries()) {
      const city = locations[i % locations.length];
      university.city = city.name;
      university.name = Object.values(city.universities)[Math.floor(i / locations.length)];
    }
  }
}
const programs16=universities16.flatMap(u=>u.fields.flatMap((field,fi)=>{const cfg=country16[u.country],levels=u.profile===8?['vocational','certificate']:u.profile===6?['bachelor','certificate']:u.profile===9?['bachelor','master','certificate']:['bachelor','master','phd','certificate'];return levels.map(level=>({id:u.id+'-'+field+'-'+level,university:u.id,field,level,country:u.country,city:u.city,language:u.international&&field!=='medicine'&&field!=='law'?'en':cfg[0],minLanguage:level==='phd'?5:level==='vocational'||level==='certificate'?3:4,months:level==='vocational'?cfg[6]:level==='certificate'?9:field==='medicine'&&level==='bachelor'?72:cfg[{bachelor:1,master:2,phd:3}[level]],fee:Math.round(countries[u.country].tuition*u.price*(level==='certificate'?.5:level==='phd'?.7:1)*(field==='medicine'?1.3:1)/12),selectivity:Math.min(97,u.selectivity+fi*3+(level==='phd'?10:level==='master'?5:level==='certificate'?-20:0)),hours:Math.round(u.load/10)+(level==='phd'?3:0),difficulty:u.load,quality:u.quality,employment:u.employment,prestige:u.prestige,scholarships:u.scholarships}));}));
const jobSpecs16=[
 ['support','Техническая поддержка','computing',null,.85,.25,true],['qa16','QA-тестировщик','computing',null,1.15,.5,true],['gameqa','Тестировщик игр','computing',null,.95,.65,false],['developer','Разработчик ПО','computing',null,1.7,.7,true],['gameplay','Gameplay-программист','computing',null,1.65,.8,true],['tools','Разработчик инструментов','computing',null,1.8,.7,true],['data','Аналитик данных','computing',null,1.4,.65,true],['sysadmin','Системный администратор','computing',null,1.2,.45,false],
 ['marketer','Маркетолог','business',null,1.15,.55,true],['pmm','Product Marketing Manager','business',null,1.65,.8,true],['community','Комьюнити-менеджер','media',null,1,.65,true],['performance','Специалист по рекламе','business',null,1.3,.6,true],['producer','Продюсер игр','business',null,1.6,.8,true],['accountant','Бухгалтер','business',null,1.1,.45,true],['analyst','Бизнес-аналитик','business',null,1.4,.65,true],
 ['doctor','Врач','medicine','bachelor',1.8,.8,false],['surgeon','Хирург','medicine','master',2.4,.9,false],['nurse','Медсестра / медбрат','care','bachelor',1.1,.45,false],['careworker','Помощник по уходу','care','vocational',.85,.25,false],['lab','Лаборант','science','vocational',1,.4,false],
 ['teacher','Школьный учитель','education','bachelor',1.05,.4,false],['tutor','Репетитор','education',null,.95,.5,true],['lecturer','Преподаватель университета','education','master',1.3,.7,false],['researcher','Исследователь','science','phd',1.6,.85,false],['researchassistant','Ассистент исследования','science','bachelor',1,.7,false],
 ['lawyer','Адвокат','law','master',1.7,.8,false],['paralegal','Помощник юриста','law','vocational',1,.5,false],['civil','Специалист госслужбы','business','bachelor',1,.5,false],
 ['engineer','Инженер-конструктор','engineering','bachelor',1.5,.65,false],['energy','Инженер-энергетик','engineering','bachelor',1.5,.6,false],['technician','Техник производства','trade','vocational',1.05,.35,false],['electrician16','Электромонтажник','trade','vocational',1.15,.3,false],['mechanic16','Автомеханик','trade','vocational',1.1,.35,false],['welder','Сварщик','trade','vocational',1.1,.3,false],['operator','Оператор станков','trade',null,.95,.3,false],
 ['designer','Графический дизайнер','arts',null,1.1,.7,true],['ux','UX-дизайнер','arts',null,1.5,.8,true],['artist','Художник игровых окружений','arts',null,1.4,.8,true],['animator','Аниматор','arts',null,1.3,.75,true],['editor','Монтажер','arts',null,1.15,.65,true],['camera','Ассистент оператора','arts',null,.9,.65,false],['cameraOperator','Оператор кино и телевидения','arts',null,1.3,.75,false],['cinematographer','Оператор-постановщик','arts',null,1.65,.85,false],['sound16','Звукорежиссер','arts',null,1.2,.65,false],['copy','Копирайтер','media',null,.9,.65,true],['journalist','Журналист','media',null,1,.7,true],['bookeditor','Книжный редактор','media',null,1,.7,true],['librarian','Библиотекарь','media','vocational',.85,.4,false],
 ['cook16','Повар','service','vocational',.95,.35,false],['barista','Бариста','service',null,.7,.3,false],['hotel','Администратор отеля','service',null,.8,.4,false],['retail','Продавец','service',null,.7,.25,false],['shiftManager','Менеджер смены магазина','service',null,.92,.4,false],['store','Управляющий магазином','business',null,1.1,.5,false],['logistics','Координатор логистики','business',null,1,.45,false],['warehouse','Сотрудник склада','service',null,.75,.2,false],['hair','Парикмахер','service','vocational',.95,.4,false]
];
const professions16=jobSpecs16.map(([id,title,field,required,salary,competition,remote])=>({id,title,field,required,salary,competition,remote,license:['doctor','surgeon','nurse','lawyer','electrician16'].includes(id),minSkill:required?35:competition>.6?40:15,language:['doctor','surgeon','teacher','lawyer','civil','journalist'].includes(id)?5:3,growth:competition>.6?1.8:1.4}));
const formats16={near:'Рядом с домом',far:'Другой район',commute:'Другой город · поездки',city:'Другой город · переезд',remote:'Удаленно',hybrid:'Гибрид',abroad:'За рубежом · релокация'};

function programName26(p){return fields16[p.field].name+(p.subjectLabel26?' · '+p.subjectLabel26:'');}

function workFraction28(){return 1;}
