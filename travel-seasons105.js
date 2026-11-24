'use strict';

// Game demand profiles, not claims about historical hotel prices.
const demandSeasons105 = {
 summer:{high:[6,7,8],low:[11,1,2]},
 winterSun:{high:[12,1,2],low:[6,7,8]},
 southern:{high:[12,1,2],low:[5,6,7]},
 ski:{high:[12,1,2,3],low:[5,10,11]},
 double:{high:[12,1,2,7,8],low:[4,5,10]},
 shoulder:{high:[3,4,10,11],low:[6,7,8]},
 city:{high:[5,6,9,12],low:[1,2]}
};
const abroadSeasons105 = {
 gr:'summer',pt:'summer',be:'city',me:'summer',al:'summer',hr:'summer',
 ae:'winterSun',vn:'summer',bs:'winterSun',do:'winterSun',jm:'winterSun',cy:'summer',
 tn:'summer',at:'double',cu:'winterSun',ar:'southern',uy:'southern',cl:'southern',
 tw:'city',sg:'city',my:'city',nz:'double',fj:'summer',ge:'summer',mu:'winterSun',
 tz:'double',zw:'summer',mz:'summer',dk:'summer',mv:'winterSun',sa:'winterSun',
 jo:'shoulder',lb:'summer'
};
const citySeasons105 = {
 nl:{'Тексел':'summer','Зандворт':'summer','Домбург':'summer'},
 fr:{'Канны':'summer','Ницца':'summer','Анси':'summer','Шамони':'double'},
 es:{'Ибица':'summer','Майорка':'summer','Тенерифе':'winterSun'},
 it:{'Амальфитанское побережье':'summer','Чинкве-Терре':'summer','Доломиты':'double'},
 au:{'Голд-Кост':'southern','Байрон-Бей':'southern'},
 no:{'Лофотены':'summer','Флом':'summer'},
 pl:{'Закопане':'double','Сопот':'summer','Карпач':'ski'},
 ca:{'Уистлер':'double','Банф':'double','Мон-Трамблан':'ski'},
 jp:{'Хакуба':'ski','Окинава':'summer'},
 tr:{'Бодрум':'summer','Фетхие':'summer','Мармарис':'summer'},
 th:{'Краби':'winterSun','Пхи-Пхи':'winterSun','Хуахин':'winterSun'},
 eg:{'Эль-Гуна':'shoulder','Марса-Алам':'shoulder','Дахаб':'shoulder'},
 ru:{'Красная Поляна':'ski'}
};

function lodgingSeason105(d){
 if(d.stayHome86||d.business54)return {factor:1,label:''};
 const kind=citySeasons105[d.country]?.[d.city]||abroadSeasons105[d.country];
 const season=demandSeasons105[kind];
 if(!season)return {factor:1,label:''};
 const month=travelDate86(d.departure86||departureMin86(d)).month+1;
 if(season.high.includes(month))return {factor:1.25,label:'Высокий сезон'};
 if(season.low.includes(month))return {factor:.85,label:'Низкий сезон'};
 return {factor:1,label:'Обычный сезон'};
}

function lodgingSeasonLabel105(d){
 const season=lodgingSeason105(d);
 if(!season.label)return '';
 const percent=Math.round((season.factor-1)*100);
 return season.label+(percent?' · жильё '+(percent>0?'+':'−')+Math.abs(percent)+'%':'');
}
