'use strict';
// Game estimates supplied in game_national_differences_2021.docx.
// City rows: monthly net wage, monthly one-bedroom rent, purchase per square metre.
const economy97 = {effectiveFrom:'2021-12-31',gameEstimate:true,countries:{
  "nl": {"currency": "EUR", "fx": 1, "fxProvisional": false, "salary": 2350, "cities": {"Амстердам": [2938, 1888, 7590], "Роттердам": [2444, 1416, 5060], "Утрехт": [2585, 1593, 5980], "Гаага": [2468, 1440, 5336], "Эйндховен": [2491, 1345, 4922], "Гронинген": [2092, 991, 3818], "Маастрихт": [2162, 1121, 4278]}},
  "rs": {"currency": "RSD", "fx": 117.5821, "fxProvisional": false, "salary": 65860, "cities": {"Белград": [84300, 55700, 264600], "Нови-Сад": [69150, 42150, 204620], "Ниш": [54660, 28600, 130540], "Крагуевац": [53340, 26340, 123480], "Суботица": [60590, 34620, 160520], "Чачак": [52030, 25590, 112900], "Нови-Пазар": [54000, 25970, 116420]}},
  "ru": {"currency": "RUB", "fx": 85.3004, "fxProvisional": false, "salary": 55450, "cities": {"Москва": [94260, 60900, 296850], "Санкт-Петербург": [72080, 44950, 222630], "Новосибирск": [49350, 24940, 108840], "Казань": [52670, 29000, 129870], "Екатеринбург": [55450, 29580, 128630], "Мурманск": [59880, 32770, 127400], "Сочи": [57110, 42050, 191710]}},
  "us": {"currency": "USD", "fx": 1.1326, "fxProvisional": false, "salary": 3681, "cities": {"Нью-Йорк": [5595, 3695, 12150], "Лос-Анджелес": [4491, 3285, 9429], "Новый Орлеан": [3129, 1560, 3436], "Чикаго": [4049, 2053, 5448], "Сан-Франциско": [6147, 4024, 13410], "Бостон": [4896, 2743, 8381], "Майами": [3681, 2053, 6076]}},
  "uk": {"currency": "GBP", "fx": 0.84028, "fxProvisional": false, "salary": 2143, "cities": {"Лондон": [3171, 2013, 8193], "Манчестер": [2143, 902, 2622], "Бирмингем": [1907, 741, 2392], "Глазго": [2036, 855, 2687], "Эдинбург": [2228, 1092, 3834], "Белфаст": [1886, 684, 1966], "Бристоль": [2143, 1092, 3670]}},
  "fr": {"currency": "EUR", "fx": 1, "fxProvisional": false, "salary": 2150, "cities": {"Париж": [3074, 1742, 9408], "Лион": [2322, 960, 4118], "Марсель": [2021, 790, 3372], "Бордо": [2150, 867, 3692], "Тулуза": [2300, 867, 3621], "Лилль": [1914, 697, 2769], "Страсбург": [2279, 876, 3550]}},
  "de": {"currency": "EUR", "fx": 1, "fxProvisional": false, "salary": 2350, "cities": {"Берлин": [2632, 1134, 5110], "Мюнхен": [3149, 1378, 6497], "Гамбург": [2702, 1176, 5366], "Франкфурт": [3102, 1260, 5548], "Кёльн": [2538, 1050, 4672], "Лейпциг": [2021, 655, 2628], "Дрезден": [2138, 722, 2884]}},
  "es": {"currency": "EUR", "fx": 1, "fxProvisional": false, "salary": 1600, "cities": {"Мадрид": [1936, 1116, 4116], "Барселона": [2000, 1224, 4606], "Валенсия": [1600, 756, 2622], "Севилья": [1360, 540, 1764], "Малага": [1520, 706, 2572], "Бильбао": [1696, 842, 3185], "Сантьяго-де-Компостела": [1344, 540, 1862]}},
  "ca": {"currency": "CAD", "fx": 1.4393, "fxProvisional": false, "salary": 3958, "cities": {"Торонто": [5383, 2664, 9236], "Монреаль": [4829, 2110, 7051], "Ванкувер": [5620, 2911, 10920], "Оттава": [4433, 1925, 5959], "Калгари": [4671, 1848, 5710], "Квебек": [3760, 1463, 4618], "Галифакс": [3246, 1232, 3824]}},
  "br": {"currency": "BRL", "fx": 6.3101, "fxProvisional": false, "salary": 3029, "cities": {"Сан-Паулу": [4089, 2855, 11030], "Рио-де-Жанейро": [3332, 2562, 10740], "Бразилиа": [3877, 2196, 8563], "Салвадор": [2423, 1244, 4717], "Ресифи": [2423, 1189, 4644], "Белу-Оризонти": [2938, 1702, 6168], "Порту-Алегри": [2908, 1501, 5660]}},
  "mx": {"currency": "MXN", "fx": 23.1438, "fxProvisional": false, "salary": 12030, "cities": {"Мехико": [15650, 12350, 41250], "Гвадалахара": [14200, 9285, 29810], "Монтеррей": [16610, 11650, 39920], "Пуэбла": [10710, 6688, 22090], "Мерида": [11670, 7554, 23950], "Оахака": [10110, 7082, 26620], "Канкун": [12030, 10230, 37260]}},
  "jp": {"currency": "JPY", "fx": 130.38, "fxProvisional": false, "salary": 286840, "cities": {"Токио": [410180, 166470, 1055560], "Осака": [321260, 111970, 659720], "Киото": [321260, 113950, 671200], "Йокогама": [321260, 109000, 573670], "Нагоя": [332730, 99090, 579410], "Саппоро": [243810, 80260, 458940], "Фукуока": [272490, 82240, 476150]}},
  "kr": {"currency": "KRW", "fx": 1346.38, "fxProvisional": false, "salary": 2625440, "cities": {"Сеул": [3675620, 1893010, 18364620], "Пусан": [2782970, 996320, 8597980], "Инчхон": [2809220, 1095950, 9432740], "Тэгу": [2310390, 727310, 5425910], "Тэджон": [2861730, 1095950, 8514510], "Кванджу": [2284130, 787090, 5843290], "Чеджу": [2231620, 946510, 8764930]}},
  "cn": {"currency": "CNY", "fx": 7.1947, "fxProvisional": false, "salary": 7364, "cities": {"Пекин": [10970, 8187, 53140], "Шанхай": [12150, 7992, 56600], "Шэньчжэнь": [11190, 6784, 43430], "Гуанчжоу": [9721, 5302, 32340], "Чэнду": [6775, 2807, 16170], "Ханчжоу": [8984, 4366, 23100], "Сиань": [6112, 2690, 17560]}},
  "it": {"currency": "EUR", "fx": 1, "fxProvisional": false, "salary": 1650, "cities": {"Рим": [1848, 1050, 4350], "Милан": [2244, 1320, 5820], "Неаполь": [1304, 638, 2640], "Флоренция": [1650, 825, 3750], "Болонья": [1683, 772, 3150], "Турин": [1700, 788, 3240], "Палермо": [1254, 548, 2190]}},
  "au": {"currency": "AUD", "fx": 1.5615, "fxProvisional": false, "salary": 5049, "cities": {"Сидней": [6968, 3729, 14830], "Мельбурн": [6513, 3157, 11890], "Брисбен": [5655, 2368, 7883], "Перт": [6211, 2368, 7749], "Аделаида": [5150, 1894, 6413], "Канберра": [6160, 2052, 6680], "Хобарт": [4039, 1618, 5411]}},
  "tr": {"currency": "TRY", "fx": 15.2335, "fxProvisional": false, "salary": 8683, "cities": {"Стамбул": [11810, 9030, 29250], "Анкара": [9986, 6060, 18280], "Измир": [9204, 6060, 19740], "Анталья": [9812, 7070, 22480], "Бурса": [9551, 5525, 16450], "Газиантеп": [7207, 4159, 12430], "Трабзон": [7207, 4456, 13340]}},
  "za": {"currency": "ZAR", "fx": 18.0625, "fxProvisional": false, "salary": 14770, "cities": {"Кейптаун": [17730, 13400, 36710], "Йоханнесбург": [21420, 13660, 33330], "Претория": [17430, 9859, 22520], "Дурбан": [13590, 7178, 17790], "Гкеберха": [13440, 6746, 17120], "Блумфонтейн": [12260, 6054, 15310], "Стелленбос": [17430, 13400, 40540]}},
  "th": {"currency": "THB", "fx": 37.653, "fxProvisional": false, "salary": 21580, "cities": {"Бангкок": [32810, 21990, 153590], "Чиангмай": [22020, 10250, 60550], "Паттайя": [21580, 15000, 92300], "Пхукет": [23740, 18490, 109280], "Хатъяй": [20070, 8997, 51690], "Кхонкэн": [16620, 7748, 44300], "Чианграй": [18350, 8122, 49470]}},
  "no": {"currency": "NOK", "fx": 9.9888, "fxProvisional": false, "salary": 31460, "cities": {"Осло": [41850, 19570, 88130], "Берген": [32720, 13910, 63680], "Тронхейм": [32720, 12970, 55020], "Ставангер": [38070, 14380, 64190], "Тромсё": [32720, 12380, 50940], "Кристиансанн": [30840, 11670, 52980], "Олесунн": [31460, 12610, 56040]}},
  "in": {"currency": "INR", "fx": 84.2292, "fxProvisional": false, "salary": 37920, "cities": {"Мумбаи": [52700, 41630, 191570], "Нью-Дели": [41710, 27300, 117960], "Бенгалуру": [63700, 41630, 179300], "Хайдарабад": [47390, 29120, 111350], "Ченнаи": [39810, 23890, 101920], "Калькутта": [35640, 22070, 92480], "Джайпур": [31090, 17740, 84930]}},
  "id": {"currency": "IDR", "fx": 16100.42, "fxProvisional": false, "salary": 7435170, "cities": {"Джакарта": [11078400, 7593570, 46550620], "Сурабая": [7881280, 4276840, 23032860], "Бандунг": [6766000, 3753140, 21335700], "Джокьякарта": [6245540, 3578580, 19880990], "Денпасар": [9219610, 6022490, 35882770], "Медан": [6840360, 3840430, 19880990], "Макасар": [6617300, 3796790, 19880990]}},
  "eg": {"currency": "EGP", "fx": 17.868, "fxProvisional": false, "salary": 6230, "cities": {"Каир": [8286, 5895, 23780], "Александрия": [6043, 4176, 16090], "Гиза": [7414, 5077, 18230], "Луксор": [4672, 3193, 11390], "Асуан": [4859, 2743, 9256], "Хургада": [6604, 5118, 18230], "Шарм-эш-Шейх": [6230, 5158, 18510]}},
  "ma": {"currency": "MAD", "fx": 10.555, "fxProvisional": false, "salary": 4620, "cities": {"Касабланка": [6607, 4351, 16280], "Рабат": [5452, 3881, 13650], "Марракеш": [5174, 4116, 16800], "Фес": [3973, 2411, 8400], "Танжер": [5082, 3087, 10500], "Агадир": [4481, 3146, 10820], "Мекнес": [3604, 2234, 7770]}},
  "pl": {"currency": "PLN", "fx": 4.5969, "fxProvisional": false, "salary": 4413, "cities": {"Варшава": [6046, 3694, 16990], "Краков": [5031, 2703, 11680], "Вроцлав": [5296, 2928, 12260], "Гданьск": [4634, 2455, 10140], "Познань": [4545, 2320, 9557], "Лодзь": [4016, 1757, 7240], "Люблин": [3883, 1802, 7530]}}
}};
// Design estimates for existing cities omitted by the 175-city specification.
Object.assign(economy97.countries.us.cities, {'Питтсбург':[3600,1250,2850], 'Остин':[4200,1650,4800]});
Object.assign(economy97.countries.br.cities, {'Куритиба':[3150,1500,6900], 'Флорианополис':[3300,2050,9100]});
Object.assign(economy97.countries.fr.cities, {'Нант':[2200,780,4100]});

function economyCity97(country, city) {
 const profile = economy97.countries[country];
 const row = profile?.cities[city];
 if (!row) return null;
 const [wage,rent,purchaseM2] = row;
 return {wage,rent,purchaseM2,fx:profile.fx};
}
// Serbia still uses EUR in existing saves. Keep the ledger denomination until
// every stored amount can be migrated together.
function economyLocal97(value,country) {
 return country==='rs' ? value/economy97.countries.rs.fx : value;
}
function vacancyWage97(country,city) {
 const local = economyCity97(country,city);
 return local ? economyLocal97(local.wage,country)*12 : countries[country].wage;
}
function housingQuote97(country,city,area,areaM2,quality) {
 const local = economyCity97(country,city);
 if (!local) return null;
 const toLocal = value => economyLocal97(value,country);
 const district = area==='center' ? 1.12 : .87;
 const condition = .80+quality*.36;
 const size = Math.pow(areaM2/45,.72);
 const rent = toLocal(local.rent)*district*condition*size;
 const purchase = toLocal(local.purchaseM2)*district*condition*areaM2;
 return {purchase:roundHouse41(purchase,100),rent:roundHouse41(rent),
   roomRent:roundHouse41(toLocal(local.rent)*district*condition*.44)};
}

// An offer freezes its rate when published. Employers can have a flat scale,
// or pay a premium that grows with experience and levels off after 20 years.
function vacancyExperience97(profession, employerKey) {
 const experience = path16().experience;
 const exact = experience.jobs?.[profession.id] ??
  (s.job?.professionId===profession.id ? (s.job.tenure || 0)*12 : 0);
 const adjacent = Math.max(0,(experience.fields?.[profession.field] || 0)-exact);
 const months = Math.max(0,exact)+Math.min(48,adjacent)*.25;
 let hash = 2166136261;
 for(const char of employerKey) hash = Math.imul(hash ^ char.charCodeAt(0),16777619);
 const scale = (hash >>> 0)%100;
 const maxPremium = scale<22 ? 0 : .12+.43*(scale-22)/77;
 return 1 + maxPremium * Math.log1p(Math.min(months,240)/24)/Math.log(11);
}
function vacancySalary97(country,city,profession,marketFactor,employerKey) {
 return Math.round(vacancyWage97(country,city)*profession.salary*marketFactor*
  vacancyExperience97(profession,employerKey));
}

// In-game estimate based on the city rent index, dampened for everyday goods.
function cityExpenseFactor126(country, city, sensitivity) {
 const profile = economy97.countries[country];
 const local = economyCity97(country,city);
 if (!local) return 1;
 const rents = Object.values(profile.cities).map(row=>row[1]).sort((a,b)=>a-b);
 const typical = rents[Math.floor(rents.length/2)];
 return Math.max(.8,Math.min(1.3,1+(local.rent/typical-1)*sensitivity));
}

function cityFood126(kids) {
 return c().cost*(.18+kids*.12)/12*cityExpenseFactor126(s.country,residenceCity(),.24);
}
