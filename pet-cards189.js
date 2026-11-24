'use strict';

for(const breed of petBreeds38){
 const imported=petBreedData189[breed.id];
 if(!imported)continue;
 breed.legacyName182??=breed.name;
 breed.name=imported.name_ru;
 breed.searchAliases182=[breed.searchAliases182,imported.name_search_aliases].flat().filter(Boolean);
}

function breedData189(p){
 return petBreedData189[p.breed38]||legacyBreedData189[p.breed38]||(!p.breed38?petBreedData189[p.kind==='rabbit'?'rabbit_domestic':p.kind+'_mixed']:null);
}
function petTrait189(p){
 if(!p.trait189){
  const pool=petTraits189[p.kind]||[];
  if(pool.length)p.trait189=pool[petHash38(p.id)%pool.length];
 }
 return p.trait189;
}
function petWeight189(p){
 const d=breedData189(p);
 if(!d?.adult_weight_min_kg||!d.adult_weight_max_kg)return;
 if(!p.target_adult_weight_kg){
  const hash=part=>petHash38(p.id+part)/2**32;
  const center=(hash('a')+hash('b')+hash('c'))/3;
  const low=Number(d.adult_weight_min_kg),high=Number(d.adult_weight_max_kg);
  p.target_adult_weight_kg=low+(high-low)*center;
 }
 const mature=p.kind==='dog'&&d.size_class==='крупный'?22:p.kind==='rabbit'?8:12;
 const ageFactor=.12+.88*Math.min(1,Math.max(0,p.months)/mature)**.75;
 const health=.88+.12*(p.care39?.condition??100)/100;
 const pregnancy=p.sex38==='f'&&petFamily79().litters.some(l=>l.mother===p.id&&l.status==='expecting')?1.08:1;
 const nutrition=.94+.06*Math.min(1,p.care39?.coverage??1);
 const weight=p.target_adult_weight_kg*ageFactor*health*nutrition*pregnancy;
 if(weight!==p.current_weight_kg){
  p.current_weight_kg=weight;
  p.weight_last_updated_at=s.clock.ticks;
 }
}
function breedFacts189(p){
 const d=breedData189(p);
 if(!d)return '';
 const range=(key,unit)=>d[key.replace('@','min')]&&d[key.replace('@','max')]?d[key.replace('@','min')]+'–'+d[key.replace('@','max')]+' '+unit:'';
 const fields=[['Происхождение',d.origin_ru],['Размер',d.size_class],['Вес взрослого',range('adult_weight_@_kg','кг')],
  ['Рост в холке',p.kind==='dog'?range('height_at_withers_@_cm','см'):''],['Продолжительность жизни',range('lifespan_@_years','лет')],
  ['Темперамент',d.temperament_ru],['Шерсть',d.coat_type_ru],['Линька',d.shedding_ru],['Груминг',d.grooming_frequency_ru],
  ['Активность',d.activity_level_ru],['Время на уход',range('care_hours_week_@','ч/нед.')]];
 return '<section class="breed-facts189"><h3>Характеристики породы</h3>'+
  (d.description_ru?'<p>'+esc(d.description_ru)+'</p>':'')+factTiles20(fields)+'</section>';
}
petAcquireMenu38=function(q){
 if(q.status!=='available')return toast('Этот питомец уже ожидает переезда или живёт дома.');
 q.sex38??=pick(['f','m']);
 q.months??=q.source38==='breeder'?rnd(3,8):rnd(6,36);
 q.name??=suggestPetName182(q.kind,q.sex38);
 const trait=petTrait189(q),cost=c().cost*petSetupFraction98(q),why=petReason38(q.kind,cost);
 petShow38(breedData189(q)?.name_ru||petLabel38(q),'',[
  {label:'Подготовить переезд домой',disabled:!!why,hint:why,fn:()=>requestPet38(q.kind,$('#petName38').value,q.sex38,q)},
  {label:'К списку животных',fn:()=>q.source38==='breeder'?breederMenu(q.kind):petKindsMenu38(q.source38)}
 ], q.source38 === 'breeder'
  ? {title: q.kind === 'cat' ? 'Породистые кошки' : 'Породистые собаки', open: () => breederMenu(q.kind)}
  : {title: q.source38 === 'rehoming' ? 'Бесплатное пристройство' : 'Животные в приюте', open: () => petKindsMenu38(q.source38)});
 petInsert38(breedFacts189(q)+'<section class="pet-offer189"><h3>Предлагаемое животное</h3>'+petArtHTML38(q,true)+
  '<p>'+q.months+' мес. · '+(q.sex38==='f'?'самка':'самец')+' · '+(q.source38==='rehoming'?'Бесплатное пристройство':money(cost))+
  '</p><p>Уход · '+money(petMonthly98(q.kind))+'/мес.</p>'+(trait?'<p>'+esc(trait[1])+'</p>':'')+
  '<label class="field">Кличка<input id="petName38" maxlength="35" value="'+esc(q.name)+'"></label></section>');
 save();
};

function petProfile189(p){
 const rows=factTiles20;
 const age=p.months<12?p.months+' мес.':years(Math.floor(p.months/12));
 const weight=p.current_weight_kg, digits=weight<2?2:1;
 const trait=(p.trait189?.[1]||p.trait||'').trim();
 let html='<div class="pet-profile201">'+rows([
  ['Порода',petLabel38(p)],['Возраст',age],['Пол',p.sex38==='f'?'Самка':p.sex38==='m'?'Самец':'Не указан'],
  ...(Number.isFinite(weight)&&weight>0?[['Вес',weight.toLocaleString('ru',{minimumFractionDigits:digits,maximumFractionDigits:digits})+' кг']]:[])
 ]);
 if(trait)html+='<section><h3>Характер</h3><p>'+esc(trait)+'</p></section>';
 if(!p.alive)return html+'<p>Осталась память.</p></div>';
 const h=petHousehold183(p),q=p.care39;
 const label=id=>id==='player'?'Вы':s.people.find(person=>person.id===id)?.name||'Не записано';
 const ratio=q?fxRate86(q.country):1;
 html+='<section><h3>Уход</h3>'+rows([
  ['Привязанность',Math.round(p.bond)+'/100'],
  ...(q?[['Состояние ухода',Math.round(q.condition)+'/100']]:[]),
  ['Расходы в месяц',money(petMonthly98(p.kind,h.country,h.city)*fxRate86(h.country))],
  ...(q?.tick===s.clock.ticks?[['Оплачено в этом месяце',money(q.paid*ratio)+' из '+money(q.due*ratio)]]:[]),
  ...(p.fixed79?[['Стерилизация','Проведена']]:[])
 ])+'</section><section><h3>Дом и оплата</h3>'+rows([
  ['Город',h.city||'Не записано'],['Владелец',label(h.owner)],
  ...(h.keeper!==h.owner?[['Живёт у',label(h.keeper)]]:[]),
  ...(h.payer!==h.owner?[['Уход оплачивает',label(h.payer)]]:[['Оплата ухода','На владельце']])
 ])+'</section></div>';
 return html;
}

const petDetailsBase189=petDetails;
petDetails=function(id){
 const p=s.pets.find(p=>p.id===id);
 if(!p)return;
 const original=show;
 show=(title,_description,options,...rest)=>original(title,'',options,...rest);
 try{
  const result=petDetailsBase189(id);
  petInsert38(petProfile189(p));
  return result;
 }finally{show=original;}
};
