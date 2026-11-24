'use strict';
const workspaceBase58={trajectoryView16,actionCatalog24,programDetails16,profileEducation46};
const requestActive58={study:['submitted','offered','accepted','enrolled'],work:['submitted','interview','interviewing','offered','accepted']};
function requestCount58(kind){return (kind==='study'?path16().applications:path16().jobApplications).filter(a=>requestActive58[kind].includes(a.status)).length;}
function workspaceLinks58(kind){return kind==='work'?button16('Вакансии',"openPath16('vacancies58')")+button16('Отклики, собеседования и офферы · '+requestCount58('work'),"openRequests58('work')"):button16('Каталог программ и поступление',"openPath16('admission58')")+button16('Заявки на поступление · '+requestCount58('study'),"openRequests58('study')");}
function activeTaskCards58(kind){const work=/overtime|career|company|client|creative|nanny/i,study=/pathResearch|pathSkill|profilePractice|study|pathLanguage|^academics$/i;const tasks=s.clock.tasks.filter(t=>!['completed','cancelled'].includes(t.state)&&(kind==='work'?work:study).test(t.kind)&&(t.kind!=='academics'||t.studentId==='self'));return tasks.length?'<section class="path-card"><h3>Сейчас в расписании</h3>'+tasks.map(t=>'<p><strong>'+esc(t.label)+'</strong><br>'+Math.floor(t.progress||0)+' / '+t.duration+' мес. · '+t.hours+' ч/нед.'+(t.state==='paused'?' · на паузе':'')+'</p>').join('')+'</section>':'';}
function workOverview58(){const j=s.job,co=j&&company18(),x=path16();return '<h1>Моя работа</h1><div class="workspace-shortcuts58">'+
 (typeof professionCatalog180==='function'?button16('Каталог профессий','professionCatalog180()'):'')+
 button16('Профессиональные навыки','professionalSkills251()')+
 (s.age>=16?button16('Проекты и портфолио','creativeMenu47()'):'')+
 (s.age>=18?button16('Своё дело','enterpriseMenu152()'):'')+
 '</div>'+(j?'<section class="path-card"><div class="eyebrow">ТЕКУЩАЯ РАБОТА</div><h2>'+esc(j.title)+'</h2><p>'+esc(co?.name||'Текущий работодатель')+' · '+(s.workHours??40)+' ч/нед.<br>'+money(j.salary)+'/год · '+esc(formats16[j.format]||'Очная работа')+'</p>'+button16('Действия по текущей работе','workControls16()')+button16('Условия и рабочие часы','hoursMenu()')+(j.contract45?button16('Срок трудового договора','contractMenu45()'):'')+'</section>':'<section class="path-card"><h2>Сейчас без работы</h2><p>Вакансии и уже отправленные отклики открываются отдельно.</p></section>')+activeTaskCards58('work')+'<section class="path-card"><h3>Следующая работа</h3>'+workspaceLinks58('work')+'<p>Фоновый поиск: '+(x.search?'включён · '+esc(fields16[(x.searchView78||x.view).field]?.name||'')+' · по фильтрам при включении':'выключен')+'</p>'+button16(x.search?'Остановить фоновый поиск':'Включить фоновый поиск','toggleSearch16()')+'</section>'+
 experienceCard58(x.experience);}
function experienceCard58(experience){
 const duration=value=>{
  const months=Math.floor(Number(value)||0);
  if(months<=0)return 'Нет стажа';
  const fullYears=Math.floor(months/12),rest=months%12;
  return [fullYears?years(fullYears):'',rest?rest+' мес.':''].filter(Boolean).join(' ');
 };
 const fields=Object.entries(experience.fields).filter(([,months])=>months>=1).sort((a,b)=>b[1]-a[1]);
 return '<section class="path-card work-experience58"><h3>Опыт и профессиональные навыки</h3>'+
  factTiles20([['Общий стаж',duration(experience.total)],
   ...fields.map(([id,months])=>[fields16[id]?.name||'Другая сфера',duration(months)])])+
  button16('Профильная подготовка','profileMenu46()')+'</section>';
}
function professionalSkills251(){
 const experience=path16().experience;
 const score=value=>(Math.floor(value*10)/10).toLocaleString('ru-RU')+' / 100';
 const fields=Object.entries(fields16).map(([key,field])=>fact20(field.name,score(experience.skills[key]||s.skill)));
 const profiles=Object.entries(trackNames46).map(([key,name])=>fact20(name,score(profileScore46(key))));
 const subjects=Object.keys(teachingSubjects26).filter(teachingQualified26).map(key=>teachingSubjects26[key].name);
 nextDetail20={sections:[
  section20('Преподавание',[fact20('Педагогическое мастерство',score(mentoring194().pedagogy)),
    fact20('Предметная квалификация',subjects.join(', ')||'Пока нет')],teachingGuide251()),
  section20('Навыки по сферам',fields,'При первом отклике в новой сфере учитывается общая подготовка. Дальше баллы растут с учёбой, работой и практикой.'),
  section20('Профильные навыки',profiles)
 ]};
 show('Профессиональные навыки','',[
  {label:'Наставничество и мастер-классы',fn:mentoringMenu194},
  {label:'Курсы и контракты',fn:courseMenu195},
  {label:'Профильная подготовка и практика',fn:profileMenu46}
 ]);
}

function pupilCard251(){
 familySchoolState();
 const school=s.school;
 const studying=s.clock.tasks.some(t=>t.kind==='academics'&&t.studentId==='self'&&t.schoolKind==='school'&&!['cancelled','completed'].includes(t.state));
 return '<section class="path-card"><div class="eyebrow">ШКОЛА</div><h2>'+esc(schools[school.type]?.name||'Школа')+'</h2><p>Успеваемость · '+Math.round(school.grades)+'/100</p>'+
  button16(studying?'Дополнительные занятия в расписании':'Подтянуть оценки',"improveGrades('self','school')",studying)+
  button16('Школьные мероприятия','schoolEvents67()')+button16('Выбор школы','schoolMenu()')+'</section>';
}
const studentActivities252 = {
 grades: {label:'Подтянуть оценки', kind:'studyRevision252', months:2, hours:3, effect:'До +8 к оценкам'},
 practice: {label:'Пройти профильную практику', kind:'pathSkill', months:3, hours:4, effect:'До +8 к оценкам и профессиональному навыку'}
};

function studentActivityReason252(study,activity) {
 if (!study || study.status !== 'active') return 'Занятия доступны после возвращения к учёбе.';
 const program=prog16(study.program);
 if (!program || study.blocked) return study.blocked || 'Программа недоступна.';
 if (s.dead || courtCustody94() || s.country!==program.country || residenceCity()!==program.city || !permission16(program.country,'study')) return 'Для занятий нужно находиться в городе программы и иметь право учиться.';
 const active=s.clock.tasks.filter(task=>!['completed','cancelled'].includes(task.state));
 if (active.some(task=>task.studyActivity252 && task.studyId===study.id)) return 'Дополнительные занятия уже в расписании.';
 if (activity.kind==='pathSkill' && active.some(task=>task.kind==='pathSkill' && task.field===program.field)) return 'Практика по этому направлению уже в расписании.';
 if (activity.kind==='studyRevision252' && study.grades>=100) return 'Оценки уже достигли 100.';
 if (capacity()-totalHours()<activity.hours) return 'Недостаточно свободного времени.';
 return '';
}

function studentActivitiesMenu252() {
 const study=path16().study;
 if (!study) return;
 const program=prog16(study.program);
 show('Занятия по программе',programName26(program)+' · оценки '+Math.round(study.grades)+'/100',
  Object.values(studentActivities252).map(activity=>{
   const reason=studentActivityReason252(study,activity);
   return {label:activity.label,hint:[activity.months+' мес.',activity.hours+' ч/нед.',activity.effect,reason].filter(Boolean).join(' · '),
    disabled:!!reason,fn:()=>{
     const current=path16().study;
     if (current?.id!==study.id || current.program!==program.id || studentActivityReason252(current,activity)) return;
     task16(activity.kind,activity.label+' · '+fields16[program.field].name,activity.months,
       {studyActivity252:true,studyId:study.id,program252:program.id,field:program.field},activity.hours);
     save();render();
    }};
  }));
}

function studyOverview58(){const x=path16(),t=x.study,p=t&&prog16(t.program);return '<h1>Моя учёба</h1><div class="workspace-shortcuts58">'+
 button16('Профессиональные навыки','professionalSkills251()')+button16('Профильная подготовка и практика','profileMenu46()')+
 button16('Изучение языков',"openPath16('languages')")+'</div>'+(!t&&s.age>=6&&s.age<18?pupilCard251():'')+(p?'<section class="path-card"><div class="eyebrow">ТЕКУЩАЯ ПРОГРАММА</div><h2>'+esc(programName26(p))+'</h2><p>'+esc(uni16(p).name)+' · '+levels16[p.level]+'<br>'+Math.floor(t.progress)+' / '+p.months+' мес. · оценки '+Math.round(t.grades)+'/100<br>'+esc(t.status==='paused'?'Академический отпуск':t.blocked||'Учёба продолжается')+'</p>'+button16('Занятия по программе','studentActivitiesMenu252()')+button16(t.status==='paused'?'Возобновить учёбу':'Обсудить академический отпуск','pauseStudy16()')+(t.status==='paused'?'':button16(t.skipWeek78===s.clock.ticks+1?'Отменить пропуск недели':'Пропустить учебную неделю','studyWeekMenu78()'))+button16('Оплата текущей учёбы','tuitionMenu44()')+button16('Изменить источник оплаты','fundingChange17()')+button16('Перевод или прекращение учёбы','studyExitMenu16()')+(p.level==='phd'?button16('Следующий этап исследования','research16()',t.research>=4||t.status==='paused'):'')+'</section>':s.studyTrack||(s.study&&(s.age<6||s.age>=18))?'<section class="path-card"><h2>Продолжается прежняя программа</h2>'+(s.studyTrack?button16('Подтянуть оценки','improveGrades()'):'')+button16('Управлять текущей программой','base16.careerMenu()')+'</section>':s.age>=6&&s.age<18?'':'<section class="path-card"><h2>Сейчас нет активной программы</h2><p>Поступление и ответы учебных заведений открываются отдельно.</p></section>')+activeTaskCards58('study')+'<section class="path-card"><h3>Следующее образование</h3>'+workspaceLinks58('study')+'</section>'+studyArchive58(x);}
function studyArchive58(path){
 const history=path.educationHistory.slice().reverse();
 const matched=new Set();
 const endYear=tick=>Number.isFinite(tick)?Math.floor((s.year*12+s.clock.month+tick-s.clock.ticks)/12):null;
 const meta=(level,school,country,year)=>[
  ['Уровень',levels16[level]],['Учебное заведение',school],
  ['Страна',countries[country]?.name],['Год',year]
 ];
 const score=value=>Number.isFinite(value)?Math.round(value)+'/100':null;
 const monthsLabel=value=>Number.isFinite(value)?Math.floor(value)+' мес.':null;
 const card=(title,items)=>'<article class="study-record58"><h4>'+esc(title)+'</h4>'+factTiles20(items)+'</article>';
 const completed=path.diplomas.slice().reverse().map(d=>{
  const program=d.program46&&prog16(d.program46);
  const related=history.find(h=>d.program46&&h.status==='completed'&&h.program===d.program46&&!matched.has(h)&&
   (d.year==null||endYear(h.ended)===d.year));
  if(related)matched.add(related);
  const title=program ? programName26(program) : d.title||fields16[d.field]?.name||'Диплом';
  return card(title,[
   ...meta(program?d.level:null,d.university,d.country,d.year??endYear(related?.ended)),
   ['Оценка',score(d.grade??related?.grades)],['Срок обучения',monthsLabel(related?.progress)]
  ]);
 });
 const other=history.filter(h=>!matched.has(h)).map(h=>{
  const program=prog16(h.program);
  const title=program?programName26(program):'Учебная программа';
  return card(title,[
   ['Статус',h.status==='transfer'?'Перевод':status16[h.status]||'Не записан'],
   ...meta(program?.level,program?uni16(program)?.name:null,program?.country,endYear(h.ended)),
   ['Пройдено',monthsLabel(h.progress)],['Оценка',score(h.grades)]
  ]);
 });
 const entries=(heading,cards)=>cards.length?'<h4 class="study-record-group58">'+heading+'</h4>'+
  '<div class="study-records58">'+cards.join('')+'</div>':'';
 return '<section class="path-card study-archive58"><h3>Дипломы и история обучения</h3>'+
  (completed.length||other.length?entries('Завершённое образование',completed)+entries('История обучения',other):
   '<p class="sub">Дипломов и записей об обучении пока нет.</p>')+'</section>';
}

function vacanciesView58(){const x=path16(),v=x.view;v.experience45??='all';v.documents45??='all';v.contract45??='all';makeVacancies16();const filtered=x.vacancies.filter(q=>(typeof vacancySearchMatches180!=='function'||vacancySearchMatches180(q))&&(typeof matchesCareer45!=='function'||matchesCareer45(q))&&(!v.fte28||v.fte28==='all'||String(q.fraction28??1)===v.fte28)),page=Math.min(v.page||0,Math.max(0,Math.ceil(filtered.length/6)-1));return '<h1>Вакансии</h1>'+(v.field==='education'?button16('Квалификации преподавателя','teachingMenu26()'):'')+button16('К моей работе',"openPath16('jobs')")+button16('Отклики и офферы · '+requestCount58('work'),"openRequests58('work')")+pathFilters16(true)+'<label>Желаемая ставка<select aria-label="Желаемая ставка" onchange="employmentFilter28(this.value)">'+[['all','Любая'],['1','Полная'],['0.75','0,75'],['0.5','0,5'],['0.25','0,25']].map(([id,name])=>'<option value="'+id+'" '+(v.fte28===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label>'+(typeof searchBar180==='function'?searchBar180('vacancy-search180','Найти профессию...','filterVacancies180',vacancySearch180()):'')+'<div id="vacancy-results180"><p>'+filtered.length+' вакансий · страница '+(page+1)+'</p>'+filtered.slice(page*6,page*6+6).map(q=>'<article class="path-card"><h3>'+esc(q.title)+'</h3>'+careerBadge45(q)+'<p>'+esc(q.city)+' · '+countries[q.country].name+' · '+formats16[q.format]+'<br>'+money(localAmount16(q.salary,q.country))+'/год<br>'+esc(jobEligibility16(q).why.join('; ')||'Можно откликнуться')+'</p>'+button16('Условия и отклик',"jobDetails16('"+q.id+"')")+'</article>').join('')+(filtered.length?'':'<p>Под выбранные фильтры вакансий пока нет.</p>')+button16('←',`path16().view.page=${Math.max(0,page-1)}`,page===0)+button16('→',`path16().view.page=${page+1}`,(page+1)*6>=filtered.length)+'</div>';}
function admissionView58(){const x=path16(),v=x.view,filtered=programs16.filter(p=>p.country===v.country&&p.field===v.field&&p.level===v.level&&matchesStudy46(p)),page=Math.min(v.page||0,Math.max(0,Math.ceil(filtered.length/6)-1));return '<h1>Поступление: каталог программ</h1>'+(v.field==='education'?button16('Предметные квалификации преподавателя','teachingMenu26()'):'')+button16('К текущей учёбе',"openPath16('education')")+button16('Заявки на поступление · '+requestCount58('study'),"openRequests58('study')")+pathFilters16()+'<p>'+filtered.length+' программ · страница '+(page+1)+'</p>'+filtered.slice(page*6,page*6+6).map(p=>'<article class="path-card"><h3>'+esc(programName26(p))+'</h3><p>'+esc(uni16(p).name.includes(p.city)?uni16(p).name:uni16(p).name+' · '+p.city)+'<br>'+levels16[p.level]+' · '+p.months+' мес. · '+money(localAmount16(p.fee,p.country))+'/мес.<br>'+esc(admission16(p).why.join('; ')||'Шанс поступления '+pct(admission16(p).probability))+'</p>'+button16('Условия и подача',"programDetails16('"+p.id+"')")+'</article>').join('')+button16('←',`path16().view.page=${Math.max(0,page-1)}`,page===0)+button16('→',`path16().view.page=${page+1}`,(page+1)*6>=filtered.length);}
function openRequests58(kind){path16().view.requestTab58=kind;openPath16('applications');}
function requestCard58(a,kind){if(kind==='work')return '<article class="path-card"><h3>'+esc(a.vacancy.title)+'</h3><p>'+esc(a.vacancy.city)+' · '+esc(status16[a.status]||a.status)+(a.expires!==undefined?' · ответить за '+Math.max(0,a.expires-s.clock.ticks)+' мес.':'')+'</p>'+button16(a.status==='interview'?'Перейти к собеседованию':a.status==='offered'?'Рассмотреть оффер':a.status==='accepted'?'Оформить выход на работу':'Открыть отклик',"jobDetails16('"+a.id+"',true)")+'</article>';const p=prog16(a.program);if(!p)return '';return '<article class="path-card"><h3>'+esc(programName26(p))+'</h3><p>'+esc(uni16(p).name)+' · '+esc(status16[a.status]||a.status)+'<br>Стипендия: '+(a.scholarship?esc(status16[a.scholarship.status]||a.scholarship.status):'не подана')+'</p>'+(['offered','accepted'].includes(a.status)?button16('Ответ и следующие шаги',"openDecision24('study','"+a.id+"')"):'')+(['submitted','offered','accepted','enrolled'].includes(a.status)&&!a.scholarship?button16('Подать на стипендию',"scholarshipApply16('"+a.id+"')"):'')+(['offered','accepted','enrolled'].includes(a.status)?button16('Оплата и помощь семьи',"supportMenu17('"+a.id+"')"):'')+'</article>';}
function requestsView58(){const x=path16(),kind=x.view.requestTab58,buttons='<div class="request-tabs58 section-tabs243" role="group" aria-label="Тип заявок">'+['study','work'].map(k=>'<button aria-pressed="'+(kind===k)+'" onclick="run16(()=>openRequests58(\''+k+'\'))">'+(k==='study'?'Заявки на поступление':'Отклики на работу')+' · '+requestCount58(k)+'</button>').join('')+'</div>';if(!['study','work'].includes(kind))return '<h1>Заявки и ответы</h1>'+buttons+'<p>Выберите поступление или работу. Собеседования и офферы находятся в откликах на работу.</p>';const all=kind==='study'?x.applications:x.jobApplications,active=all.filter(a=>requestActive58[kind].includes(a.status)).slice().sort((a,b)=>{const order={interview:0,offered:1,accepted:2,interviewing:3,submitted:4,enrolled:5};return (order[a.status]??9)-(order[b.status]??9)||(a.expires??Infinity)-(b.expires??Infinity);}),archive=all.filter(a=>!requestActive58[kind].includes(a.status));return '<h1>Заявки и ответы</h1>'+buttons+'<h2>'+(kind==='study'?'Поступление и стипендии':'Собеседования, офферы и отклики')+'</h2>'+(active.map(a=>requestCard58(a,kind)).join('')||'<p>Активных '+(kind==='study'?'заявок на поступление':'откликов')+' пока нет.</p>')+'<details><summary>Архив · '+archive.length+'</summary>'+archive.slice().reverse().map(a=>requestCard58(a,kind)).join('')+'</details>';}
trajectoryView16=function(){const section=path16().view.section,views={jobs:workOverview58,education:studyOverview58,applications:requestsView58,vacancies58:vacanciesView58,admission58:admissionView58,languages:languagesView16,mobility:mobilityView16};return '<div class="trajectory"><nav class="path-nav section-tabs243" aria-label="Работа, учёба и заявки">'+[['jobs','Моя работа'],['education','Моя учёба'],['applications','Заявки и ответы'],['languages','Языки'],['mobility','Документы и переезд']].map(([id,name])=>'<button class="'+(id===section?'active':'')+'" aria-pressed="'+(id===section)+'" onclick="openPath16(\''+id+'\')">'+name+'</button>').join('')+'</nav>'+(views[section]||studyOverview58)()+'</div>';};
programDetails16=function(id){const old=show;show=function(title,text,opts,...rest){return old(title,text,opts.map(q=>q.label==='Назад к каталогу'?{...q,fn:()=>openPath16('admission58')}:q),...rest);};try{return workspaceBase58.programDetails16(id);}finally{show=old;}};
profileEducation46=function(...args){const old=openPath16;openPath16=function(section){return old(section==='education'?'admission58':section);};try{return workspaceBase58.profileEducation46(...args);}finally{openPath16=old;}};
actionCatalog24=function(){return [...workspaceBase58.actionCatalog24().map(a=>a.id==='education'?{...a,label:'Моя учёба: текущая программа и действия'}:a.id==='jobs'?{...a,label:'Моя работа: текущие дела и условия'}:a.id==='applications'?{...a,label:'Заявки на поступление и отклики на работу',keywords:a.keywords+' стипендии собеседования офферы ответы'}:a),{id:'vacancies58',group:'Работа',label:'Каталог вакансий',keywords:'вакансии поиск работы без опыта без визы',reason:'',fn:()=>openPath16('vacancies58')},{id:'admission58',group:'Учёба',label:'Поступление: университеты и программы',keywords:'вуз колледж бакалавр магистр подать заявку',reason:'',fn:()=>openPath16('admission58')},{id:'jobReplies58',group:'Работа',label:'Мои собеседования и офферы',keywords:'отклики интервью собеседования ответы предложения',reason:'',fn:()=>openRequests58('work')}];};
