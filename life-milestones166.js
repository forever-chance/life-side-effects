'use strict';

function familyBirthText166(){
 const location=[s.birthCity||residenceCity(),countries[s.birthCountry||s.country]?.name].filter(Boolean).join(', ');
 const parents=parents17().map(p=>p.name);
 const childhood=s.family17?.childhood131;
 const caregiver=childhood&&living(childhood.caregiverId);
 const home=caregiver
  ? 'Дома за вами ухаживает '+caregiver.name+'. '+(childhood.unknown?'О втором родителе ничего не известно.':'Второй родитель живёт отдельно.')
  : parents.length?'Дома вас встречают '+parents.join(' и ')+'.':'';
 const means={low:'Дома внимательно считают расходы.',mid:'На обычную жизнь семье хватает.',high:'У семьи есть накопления на непредвиденное.'};
 const passports=(s.citizenships||[]).map(id=>countries[id]?.name).filter(Boolean);
 const registration=Object.entries(s.identity17?.citizenshipClaims166||{})
  .filter(([,claim])=>claim.basis==='registration').map(([id])=>countries[id].name);
 return location+'. '+home+' '+(means[s.background]||'')+
  (passports.length?' Гражданство при рождении — '+passports.join(', ')+'.':'')+
  (registration.length?' Для получения гражданства в '+registration.join(', ')+' нужна регистрация рождения.':'');
}

const ageMilestones166={
 3:['Мир размером с дом','За порогом уже есть куда пойти. Можно записаться в дошкольную секцию или попросить родителей завести питомца. Решение о питомце остаётся за ними.'],
 6:['Чужие правила','У вас теперь есть своя парта. Начинается младшая школа, а вместе с ней появляются уроки, оценки и школьные знакомства.'],
 15:['Репетиция самостоятельности','Некоторые встречи теперь могут значить чуть больше. Можно ходить на свидания с ровесниками и решить вместе, хотите ли вы стать парой.'],
 16:['Первые свои деньги','Теперь можно искать подработку. Если хочется попробовать творческое дело, уже можно делать первые работы для портфолио.'],
 17:['Куда после школы','Можно подавать заявки на бакалавриат. У программ разные требования к языку, подготовке и оценкам.'],
 18:['На собственный риск','Открываются полноценная карьера, своё дело и оплачиваемые творческие заказы. Первые работы из портфолио могут пригодиться.'],
 67:['Время выбирать свой ритм','В игре наступил пенсионный возраст. Если была постоянная работа, она завершается, и можно получать пенсию.']
};

const illustratedMilestones178=new Set([0,3,6,15,16,17,18,67]);
function showMilestone166(notice){
 const initial=typeof startupNotice180==='function'&&startupNotice180()===notice;
 show(notice.title,notice.note,[{label:initial?'Понятно':'Прочитано',fn:()=>{notice.status='read';}},...(initial?[{label:'Пропускать в будущем',fn:()=>{}}]:[])]);
 const dialog=$('#modal');
 if(initial)dialog.innerHTML=dialog.innerHTML.replace('<div class="options">','<div class="options milestone-options214">');
 if(!illustratedMilestones178.has(notice.milestoneAge))return;
 const markup='<div class="milestone-frame200"><img class="milestone-art178" src="assets/milestones/age-'+notice.milestoneAge+'.webp" width="440" height="440" alt=""></div>';
 dialog.innerHTML=dialog.innerHTML.replace('</h2>','</h2>'+markup);
}
function queueMilestone166(age,title,body,popup=true){
 if(!s||s.dead)return;
 const state=s.milestones166??={};
 if(state[age])return;
 state[age]=true;
 const birth=age===0&&s.log.find(entry=>entry.age===0&&entry.title===title);
 const notice=notice61('milestone166',title,body,{milestoneAge:age});
 if(birth){
  birth.text=body;
  birth.decision24=s.log.shift().decision24;
 }
 if(popup&&!s.hideMilestonePopups180&&!$('#modal').open&&!s.pending.length)showMilestone166(notice);
}

const milestoneBase166={start,rollYear,openDecision24};
start=function(){
 const baby=$('#startAge')?.value!=='18';
 const result=milestoneBase166.start();
 if(baby&&s?.age===0){
  queueMilestone166(0,'У этой истории появилось имя','Вы родились. '+familyBirthText166(),typeof startupNotice180!=='function');
  save();
 }else if(s?.age===18){
  queueMilestone166(18,...ageMilestones166[18],typeof startupNotice180!=='function');
  save();
 }
 return result;
};
rollYear=function(){
 const before=s.age;
 const result=milestoneBase166.rollYear();
 const milestone=ageMilestones166[s.age];
 if(s.age>before&&milestone)queueMilestone166(s.age,...milestone);
 return result;
};
openDecision24=function(kind,id){
 const notice=kind==='life61'&&decisionRecord24({kind,id});
 if(notice?.type==='milestone166'&&liveNotice61(notice))return showMilestone166(notice);
 return milestoneBase166.openDecision24(kind,id);
};

function childBirthIdentity166(child,parents){
 child.birthCountry=child.country;
 const claims=birthCitizenshipClaims166(child.country,parents);
 child.citizenships=birthCitizenships17(child.country,parents,claims);
 child.birthYear=s.year;
 child.origins=[...new Set(parents.flatMap(p=>p.origins||[]))];
 child.identity17={citizenshipClaims166:claims};
 assignFamilyName166(child,child.country,child.origins.length===1?child.origins[0]:null);
}

function birthRegistrationAvailable167(claim){
 const ageMonths=s.age*12+(Number.isInteger(s.birthMonth)?(s.clock.month-s.birthMonth+12)%12:0);
 return !s.dead&&claim?.basis==='registration'&&ageMonths<(claim.limitMonths??23*12);
}
function registerBirthCitizenship166(id){
 const claim=s.identity17?.citizenshipClaims166?.[id];
 if(!birthRegistrationAvailable167(claim)||s.citizenships.includes(id))return false;
 s.citizenships.push(id);
 claim.basis='registered-descent';
 log('Гражданство по происхождению',countries[id].name+' · рождение зарегистрировано.','Документы',true);
 save();
 render();
 return true;
}
const birthMobility166=mobilityView16;
mobilityView16=function(){
 const claims=Object.entries(s.identity17?.citizenshipClaims166||{});
 const pending=claims.filter(([id,claim])=>birthRegistrationAvailable167(claim)&&!s.citizenships?.includes(id));
 const registration=pending.map(([id])=>button16(
  'Зарегистрировать рождение · '+countries[id].name,"birthCitizenshipMenu166('"+id+"')")).join('');
 return registration+birthMobility166();
};
function birthCitizenshipMenu166(id){
 const claim=s.identity17?.citizenshipClaims166?.[id];
 if(!birthRegistrationAvailable167(claim))return;
 const limit=claim.limitMonths??276;
 const deadline=limit===3?'до трёх месяцев':limit===12?'до первого дня рождения':'до 23 лет';
 show('Гражданство по происхождению',
  'Регистрация доступна '+deadline+'. '+
  'После регистрации в списке гражданств появится '+countries[id].name+'.',
  [{label:'Зарегистрировать',fn:()=>registerBirthCitizenship166(id)},{label:'Позже',fn:()=>{}}]);
}
