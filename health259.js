'use strict';
// Сборка 259: здоровье восстанавливается само, возраст опускает потолок, форма его поднимает.
//
// Раньше здоровье только падало: возраст после 45 каждый год отнимал 1–5, болезни, недоедание
// и переутомление отнимали своё, а вернуть его можно было одним отдыхом в расписании — и тогда
// оно всю жизнь стояло у 100. Теперь:
// - у каждого возраста есть потолок: 100 до 30 лет, 88 в 50, 64 в 70, 44 в 80, 24 в 90;
// - форма (0–100) поднимает потолок на половину расстояния до 100: при форме 60 в 70 лет — 75 вместо 64;
// - ниже потолка здоровье каждый месяц возвращает 6% разрыва, если нет болезни, недоедания и переутомления;
// - выше потолка (после лечения, удачного года) лишнее сходит на 10% в месяц;
// - «Восстановить силы» поднимает здоровье только до потолка;
// - форму дают «Движение» в хобби и спортивные секции, без них она сходит к 20 за год-полтора.

function health259(){
 return s.health259??={fitness:30,lastMonth:-1,fit:null};
}

function ageCeiling259(age){
 if(age<=30)return 100;
 if(age<=50)return 100-.6*(age-30);
 if(age<=70)return 88-1.2*(age-50);
 return Math.max(5,64-2*(age-70));
}

function healthCeiling259(){
 const base=ageCeiling259(s.age);
 return Math.round(base+(100-base)*.5*health259().fitness/100);
}

function healthBlockers259(){
 const out=[];
 if(s.illness)out.push('болезнь');
 const food=typeof finance39==='function'?finance39().food:null;
 if(food&&food.strain>=3)out.push('недоедание');
 if(s.clock&&s.clock.fatigue>=70)out.push('переутомление');
 return out;
}

function addFitness259(n){
 const h=health259();
 h.fitness=Math.max(0,Math.min(100,h.fitness+n));
}

function fitnessWord259(f){
 return f<25?'почти никакая':f<45?'так себе':f<65?'неплохая':f<85?'хорошая':'отличная';
}

// Сцены, когда форма появляется и когда пропадает. Без цифр: цифры — в меню «Самочувствие».
const fitnessScenes259={
 up:[
  ['Лестница больше не событие','На четвёртый этаж вы поднимаетесь, не останавливаясь на площадке, и замечаете это только наверху.'],
  ['Тело помнит','После тренировки хочется есть и спать, а не лежать и жалеть себя. Утром ничего не болит.'],
  ['Второе дыхание','Автобус уже закрывает двери. Вы успеваете — и дышите ровно, как будто не бежали.']
 ],
 down:[
  ['Одышка','Пробежка до автобуса снова заканчивается тем, что вы стоите, держась за поручень, и делаете вид, что всё в порядке.'],
  ['Спина напоминает о себе','Вы наклоняетесь за упавшим ключом и разгибаетесь медленнее, чем наклонялись.'],
  ['Кроссовки в коридоре','Кроссовки стоят на том же месте, где их оставили весной. На них уже лежит пыль.']
 ]
};

function fitnessNotes259(){
 const h=health259();
 if(s.age<12)return;
 if(h.fit!=='up'&&h.fitness>=60){
  h.fit='up';
  const [t,x]=fitnessScenes259.up[Math.floor(Math.random()*fitnessScenes259.up.length)];
  log(t,x,'Форма');
 }else if(h.fit==='up'&&h.fitness<35){
  h.fit='down';
  const [t,x]=fitnessScenes259.down[Math.floor(Math.random()*fitnessScenes259.down.length)];
  log(t,x,'Форма');
 }
}

function healthMonth259(){
 const h=health259();
 if(!s.clock||s.dead||h.lastMonth===s.clock.ticks)return;
 h.lastMonth=s.clock.ticks;
 h.fitness+=(20-h.fitness)*.08;
 const cap=healthCeiling259();
 if(s.health>cap)s.health=clamp(s.health-(s.health-cap)*.1);
 else if(!healthBlockers259().length)s.health=clamp(s.health+(cap-s.health)*.06);
 fitnessNotes259();
}

const autonomousMonthBase259=autonomousMonth;
autonomousMonth=function(...args){
 const out=autonomousMonthBase259.apply(this,args);
 healthMonth259();
 return out;
};

const finishTaskBase259=finishTask;
finishTask=function(t,...args){
 const before=s.health;
 const out=finishTaskBase259.call(this,t,...args);
 if(t&&t.kind==='rest'){
  const top=Math.max(before,healthCeiling259());
  if(s.health>top)s.health=top;
 }
 if(t&&t.kind==='hobby'&&t.hobby==='sport')addFitness259(4);
 return out;
};

// Спортивные секции (взрослая и детская): каждое занятие — +2 к форме.
if(typeof clubMonth19==='function'){
 const clubMonthBase259=clubMonth19;
 clubMonth19=function(...args){
  const sport=()=>clubState19().memberships.filter(m=>clubsCatalog19[m.type]?.hobby==='sport').reduce((n,m)=>n+(m.sessions||0),0);
  const before=sport();
  const out=clubMonthBase259.apply(this,args);
  const gained=sport()-before;
  if(gained>0)addFitness259(2*gained);
  return out;
 };
}

// «Самочувствие» без болезни: что со здоровьем и почему. Болезнь показывает прежнее меню лечения.
const healthMenuBase259=healthMenu;
healthMenu=function(){
 if(s.illness)return healthMenuBase259();
 everydayState();
 const h=health259(),cap=healthCeiling259(),now=Math.round(s.health),blockers=healthBlockers259();
 const lines=[`Здоровье ${now} из 100. В вашем возрасте и с вашей формой оно держится около ${cap}.`];
 if(now<cap-1)lines.push(blockers.length?'Сейчас восстановиться мешает: '+blockers.join(', ')+'.':'Ниже этого уровня здоровье понемногу возвращается само, если высыпаться и нормально есть.');
 lines.push(`Форма ${fitnessWord259(h.fitness)} (${Math.round(h.fitness)} из 100). Её поднимают «Движение» в хобби и спортивные секции, без них она сходит за год-полтора.`);
 show('Самочувствие',lines.join('\n'),[
  {label:'Сон и восстановление',hint:'2 ч/нед., 2 мес. · усталость −25 · настроение +7 · здоровье до '+Math.max(now,cap),fn:()=>assign('rest')},
  {label:s.age<18?'Детские занятия':'Хобби',hint:s.age<18?'':'«Движение» поднимает форму',fn:s.age<18?childActivities23:hobbyMenu}
 ]);
};
