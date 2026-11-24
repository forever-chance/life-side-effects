'use strict';
// Country hours are game baselines, not statutory working-week claims.
const fullHours28={nl:36,fr:35,de:38,uk:40,rs:40,ru:40,us:40,ca:40,es:38,jp:40,kr:40,cn:40,mx:40,br:40};
const employmentBase28={permission16,makeVacancies16,replaceVacancy23,jobEligibility16,startJob16,jobDetailData20,jobsView16,hoursMenu};
function studentWork28(country){const x=path16();let max=0;for(const permit of x.permits){if(permit.country!==country||permit.expires!==null&&permit.expires<=s.clock.ticks)continue;if(permit.work){max=Math.max(max,permit.workHours??80);continue;}if(country!=='uk'||permit.basis!=='study')continue;const a=x.applications.find(a=>a.id===permit.source),p=a&&prog16(a.program);if(!p||!['accepted','enrolled','completed'].includes(a.status))continue;const study=x.study;if(study?.application===a.id&&study.status==='paused')continue;const hours=['bachelor','master','phd'].includes(p.level)?20:p.level==='vocational'?10:0;max=Math.max(max,hours);}return max;}
function workLimit28(country){if((s.citizenships||[]).includes(country)||s.citizenship===country)return 80;return studentWork28(country);}
function workCheck28(v){const why=[],hours=v.hours28??40,limit=workLimit28(v.country);if(v.country===s.country&&hours>limit)why.push(limit?'Статус разрешает до '+limit+' ч/нед.; вакансия требует '+hours:'Нет права на эту работу: нужно разрешение');if(v.country===s.country&&limit<=20&&v.employmentType28==='freelance')why.push('Студенческий статус не разрешает самозанятость');return why;}
permission16=function(country,kind){if(kind!=='work')return employmentBase28.permission16(country,kind);const limit=workLimit28(country);return limit>0&&(!s.job||country!==s.country||(s.workHours??s.job.hours28??40)<=limit);};
function variants28(){const x=path16();if(x.marketVersion28===x.marketKey&&x.vacancies.every(v=>v.hours28))return;x.marketVersion28=x.marketKey;const raw=x.vacancies.filter(v=>!v.variant28);x.vacancies=raw.flatMap(v=>{const full=fullHours28[v.country]||40;return [1,.75,.5,.25].map(f=>({...v,id:v.id+'-fte'+f,variant28:true,fullHours28:full,hours28:Math.round(full*f),fraction28:f,salary:Math.round(v.salary*f),salaryFull28:v.salary,employmentType28:'employee',title:v.title+' · '+Math.round(full*f)+' ч/нед.'}));});}
makeVacancies16=function(){employmentBase28.makeVacancies16();variants28();};
replaceVacancy23=function(v){const oldIds=new Set(path16().vacancies.map(q=>q.id));employmentBase28.replaceVacancy23(v);const q=path16().vacancies.find(q=>!oldIds.has(q.id));if(q){q.hours28=v.hours28;q.fullHours28=v.fullHours28;q.fraction28=v.fraction28;q.salaryFull28=q.salary;q.salary=Math.round(q.salary*q.fraction28);q.variant28=true;q.employmentType28='employee';q.title+=' · '+q.hours28+' ч/нед.';}};
jobEligibility16=function(v){const r=employmentBase28.jobEligibility16(v);r.why.push(...workCheck28(v));return r;};
startJob16=function(id){const a=path16().jobApplications.find(a=>a.id===id);if(!a||workCheck28(a.vacancy).length)return toast('Рабочие часы несовместимы с действующим статусом.');const before=a.status,oldHours=s.workHours;s.workHours=a.vacancy.hours28??40;employmentBase28.startJob16(id);if(a.status!=='employed')s.workHours=oldHours;if(before==='accepted'&&a.status==='employed'){s.workHours=a.vacancy.hours28??40;s.hoursJob=s.job.title;s.job.hours28=s.workHours;s.job.fullHours28=a.vacancy.fullHours28??40;s.job.fraction28=s.workHours/s.job.fullHours28;save();}};
jobDetailData20=function(v,a){const d=employmentBase28.jobDetailData20(v,a);d.sections.unshift(section20('Занятость и право работать',[fact20('Рабочие часы',(v.hours28??40)+' ч/нед.'),fact20('Ставка',Math.round((v.fraction28??1)*100)+'%'),fact20('Зарплата','Указана за фактическую ставку; повторно не уменьшается'),check20('Совместимость со статусом',workCheck28(v).length===0,workCheck28(v).join('; ')||'Часы допустимы либо разрешение оформляется до зарубежного выхода','Выберите меньшую ставку или другое основание проживания.')]));return d;};
function employmentFilter28(value){path16().view.fte28=value;save();render();}
jobsView16=function(){makeVacancies16();const x=path16(),all=x.vacancies,filter=x.view.fte28||'all';let html;try{x.vacancies=all.filter(v=>filter==='all'||String(v.fraction28??1)===filter);html=employmentBase28.jobsView16();}finally{x.vacancies=all;}return html.replace('<h1>Работа и опыт</h1>','<h1>Работа и опыт</h1><label>Желаемая ставка<select onchange="employmentFilter28(this.value)">'+[['all','Любая'],['1','Полная'],['0.75','0,75'],['0.5','0,5'],['0.25','0,25']].map(([id,label])=>`<option value="${id}" ${filter===id?'selected':''}>${label}</option>`).join('')+'</select></label>');};
hoursMenu=function(){
 const job=s.job;
 if(!job)return;
 const full=job.fullHours28||40,limit=workLimit28(s.country);
 const current=s.workHours||full;
 const hours=new Set([.25,.5,.75,1].map(f=>Math.round(full*f)));
 const capped=Math.floor(limit);
 if(capped>0&&capped<full)hours.add(capped);
 const choices=[...hours].sort((a,b)=>a-b).map(hours=>({
   label:hours+' ч/нед. · '+money(job.salary*hours/current)+'/год',
   disabled:hours>limit,
   fn:()=>{
     if(s.job!==job||hours>workLimit28(s.country))return toast('Текущий статус не позволяет выбрать эти часы.');
     job.salary*=hours/(s.workHours||full);
     s.workHours=job.hours28=hours;
     job.fraction28=hours/full;
     s.hoursJob=job.title;
   }
 }));
 show('Рабочая неделя',limit>0?'Оплата меняется пропорционально часам. Лимит текущего статуса — '+Math.floor(limit)+' ч/нед.':'Текущий статус не разрешает работу по этому графику.',choices);
};
function workFraction28(){return s.job?Math.min(1,(s.workHours??40)/(s.job.fullHours28||40)):0;}
