'use strict';
// Сборка 270: зарплата и формат работы — сразу на виду.
// 1. Вакансии: заголовок карточки «Профессия · зарплата/год · Формат» («Удалённо», «Гибрид», «Офис · рядом с домом» и т. д.),
//    под ним — часы, город и страна. Формат в фильтре и в карточке вакансии назван так же.
// 2. Фильтр «Зарплата от» (шаги — доли средней зарплаты страны вакансий, хранится в path16().view.salary270 как доля,
//    поэтому при смене страны пороги пересчитываются) и порядок «Сначала выше зарплата» (path16().view.sort270).
//    Порог проверяется в matchesCareer45, поэтому его учитывает и фоновый поиск: он берёт фильтры на момент включения.
// 3. Отклики и офферы (requestCard58), окно вакансии и оффера (jobDetails16 / jobDetailData20), внутренние вакансии
//    в разговоре о карьере и «Моя работа» показывают зарплату и формат так же.
// Суммы — как раньше: money(localAmount16(v.salary, v.country)) у вакансий и откликов, money(salary) у текущей работы
// и внутренних вакансий. Хранимые поля (format, salary, title) не меняются — только то, что на экране.
const jobs270Base={vacanciesView58,requestCard58,workOverview58,matchesCareer45,jobDetails16,jobDetailData20,show};

const jobFormats270={near:'Офис · рядом с домом',far:'Офис · другой конец города',commute:'Офис · поездки в другой город',
 city:'Офис · переезд в другой город',abroad:'Офис · переезд за рубеж',remote:'Удалённо',hybrid:'Гибрид'};
// Подписи формата в фильтре, окне вакансии и записи о первом рабочем дне — те же, что в карточке.
Object.assign(formats16,jobFormats270);
function jobFormat270(format){return jobFormats270[format]||'Офис';}
// Формат текущей работы: место работы сравнивается с нынешним домом, а не с тем, что было при найме.
// Работа в другом городе той же страны называется так же, как вакансия «поездки в другой город»: подпись не меняется
// после выхода на работу. «Переезд» после переезда уже не к месту — тогда формат считается по месту работы.
function jobFormatNow270(j){
 if(!j)return '';
 if(j.format==='remote'||j.format==='hybrid')return jobFormat270(j.format);
 const w=j.workplace;
 if(!w||!w.city)return jobFormat270(j.format);
 if(w.country&&w.country!==s.country)return 'Офис · в другой стране';
 if(w.city!==residenceCity())return jobFormats270.commute;
 if(!w.area||!s.housing?.area)return jobFormat270(j.format);
 return w.area===s.housing.area?jobFormats270.near:jobFormats270.far;
}
// Часы уже есть в строке под заголовком, в названии они лишние (и у текущей работы устаревают после смены графика).
function jobTitle270(title){return String(title||'').replace(/\s*·\s*\d+\s*ч\/нед\.\s*$/,'');}
function vacancyPay270(v){return localAmount16(v.salary,v.country);}
function jobHead270(title,pay,format){return jobTitle270(title)+' · '+money(pay)+'/год · '+format;}
function jobHeadHTML270(title,pay,format){
 return esc(jobTitle270(title))+' · <span class="pay270" style="white-space:nowrap">'+esc(money(pay))+'/год</span> · <span class="format270">'+esc(format)+'</span>';
}
function vacancyHead270(v){return jobHead270(v.title,vacancyPay270(v),jobFormat270(v.format));}
function vacancyHeadHTML270(v){return jobHeadHTML270(v.title,vacancyPay270(v),jobFormat270(v.format));}
function vacancyMeta270(v){return [v.hours28?v.hours28+' ч/нед.':'',v.city,countries[v.country]?.name||''].filter(Boolean).map(esc).join(' · ');}

// Зарплатный фильтр. Шаги — доли средней зарплаты страны, суммы округлены до двух значащих цифр в текущей валюте.
const salarySteps270=[.25,.5,.75,1,1.25,1.5,2,3];
function roundPay270(n){if(!(n>0))return 0;const step=Math.pow(10,Math.max(0,Math.floor(Math.log10(n))-1));return Math.round(n/step)*step;}
// Страна вакансий — по тому же правилу, что в makeVacancies16 (trajectory16.js): «Офис · переезд за рубеж» при своей
// стране в фильтре показывает вакансии первой другой страны.
function vacancyCountry270(view=path16().view){
 const c=view?.format==='abroad'&&view.country===s.country?Object.keys(countries).find(k=>k!==s.country):view?.country;
 return countries[c]?c:s.country;
}
function salaryStepAmount270(k,view=path16().view){const c=vacancyCountry270(view);return roundPay270(localAmount16(countries[c].wage*k,c));}
function salaryFloor270(view=path16().view){const k=Number(view?.salary270);return k>0?salaryStepAmount270(k,view):0;}
function salaryFits270(v,view=path16().view){const floor=salaryFloor270(view);return !floor||Math.round(vacancyPay270(v))>=floor;}
function salaryFilters270(){
 const v=path16().view;
 return '<div class="path-filters salary-filters270">'+
  select16('salary270',[['all','Любая'],...salarySteps270.map(k=>[String(k),money(salaryStepAmount270(k,v))+'/год'])],'Зарплата от')+
  select16('sort270',[['none','Как в объявлениях'],['salary','Сначала выше зарплата']],'Порядок')+'</div>';
}
matchesCareer45=function(v){return jobs270Base.matchesCareer45(v)&&salaryFits270(v);};

// Список вакансий: тот же экран, но по порядку «Сначала выше зарплата» базе отдаётся отсортированная копия,
// а у каждой карточки заголовок и строка под ним собираются заново.
vacanciesView58=function(){
 const x=path16(),view=x.view;
 makeVacancies16();
 const all=x.vacancies;
 const list=view.sort270==='salary'?all.map((q,i)=>[q,i]).sort((a,b)=>vacancyPay270(b[0])-vacancyPay270(a[0])||a[1]-b[1]).map(r=>r[0]):all;
 let html;
 x.vacancies=list;
 try{html=jobs270Base.vacanciesView58();}
 finally{if(x.vacancies===list&&list!==all){for(const q of list)if(!all.includes(q))all.push(q);x.vacancies=all;}}
 const byId=new Map(x.vacancies.map(q=>[q.id,q]));
 html=html.replace(/<article class="path-card">[\s\S]*?<\/article>/g,card=>{
  const id=(card.match(/jobDetails16\(&#39;([^&]+)&#39;\)/)||[])[1],q=id&&byId.get(id);
  if(!q)return card;
  const head='<h3>'+esc(q.title)+'</h3>';
  const meta='<p>'+esc(q.city)+' · '+countries[q.country].name+' · '+formats16[q.format]+'<br>'+money(localAmount16(q.salary,q.country))+'/год<br>';
  return card.replace(head,()=>'<h3 class="vacancy-head270">'+vacancyHeadHTML270(q)+'</h3>').replace(meta,()=>'<p>'+vacancyMeta270(q)+'<br>');
 });
 const at=html.indexOf('aria-label="Желаемая ставка"'),end=at<0?-1:html.indexOf('</label>',at);
 const filters=salaryFilters270();
 if(end>=0)return html.slice(0,end+8)+filters+html.slice(end+8);
 const results=html.indexOf('<div id="vacancy-results180">');
 return results>=0?html.slice(0,results)+filters+html.slice(results):html+filters;
};

// Отклики, собеседования и офферы.
requestCard58=function(a,kind){
 const html=jobs270Base.requestCard58(a,kind);
 if(kind!=='work'||!a?.vacancy)return html;
 const v=a.vacancy,hours=v.hours28?esc(v.hours28+' ч/нед.')+' · ':'';
 return html.replace('<h3>'+esc(v.title)+'</h3><p>',()=>'<h3 class="vacancy-head270">'+vacancyHeadHTML270(v)+'</h3><p>'+hours);
};

// Окно вакансии и оффера: в заголовке — зарплата и формат, «Условия» и «Деньги и дорога» — первыми.
jobDetails16=function(id,application=false){
 const x=path16(),a=application&&x.jobApplications.find(a=>a.id===id),v=a?a.vacancy:x.vacancies.find(v=>v.id===id);
 if(!v)return jobs270Base.jobDetails16(id,application);
 const old=show,head=vacancyHead270(v);
 show=function(title,...rest){return old(title===v.title?head:title,...rest);};
 try{return jobs270Base.jobDetails16(id,application);}finally{show=old;}
};
jobDetailData20=function(v,a){
 const d=jobs270Base.jobDetailData20(v,a);
 const top=['Условия','Деньги и дорога'].map(t=>d.sections.find(g=>g.title===t)).filter(Boolean);
 d.sections=[...top,...d.sections.filter(g=>!top.includes(g))];
 return d;
};

// «Моя работа»: заголовок «Должность · зарплата/год · Формат», строкой ниже — дорога. У гибрида это среднее
// на день (часть дней дома), как в окне вакансии, поэтому «в среднем».
workOverview58=function(){
 const html=jobs270Base.workOverview58(),j=s.job;
 if(!j)return html;
 const head='<h2>'+esc(j.title)+'</h2>';
 const line='<br>'+money(j.salary)+'/год · '+esc(formats16[j.format]||'Очная работа')+'</p>';
 const minutes=j.format==='remote'?0:Math.round(commuteMinutes()||0);
 return html.replace(head,()=>'<h2 class="job-head270">'+jobHeadHTML270(j.title,j.salary,jobFormatNow270(j))+'</h2>')
  .replace(line,()=>(minutes>0?'<br>Дорога до работы: '+(j.format==='hybrid'?'в среднем ':'')+minutes+' мин. в одну сторону':'')+'</p>');
};

// Внутренние вакансии в разговоре о карьере: зарплата и формат — в названии варианта, в подсказке — шансы.
function internalOptions270(opts){
 const list=internalVacancies18();
 if(!s.job||list.length!==opts.length)return opts;
 const format=jobFormatNow270(s.job);
 return opts.map((o,i)=>{
  const v=list[i];
  if(!v||o.label!==v.title)return o;
  const prefix=money(v.salary)+'/год · ',rest=typeof o.hint==='string'&&o.hint.startsWith(prefix)?o.hint.slice(prefix.length):null;
  // Без суммы впереди подсказка начинается с заглавной, как у соседних вариантов («Шанс 59%»).
  return {...o,label:jobHead270(v.title,v.salary,format),hint:rest===null?o.hint:rest.charAt(0).toUpperCase()+rest.slice(1)};
 });
}
show=function(title,text,opts,...rest){
 if(title==='Другая команда, тот же работодатель'&&Array.isArray(opts)&&opts.length){
  try{opts=internalOptions270(opts);}catch(e){}
 }
 return jobs270Base.show.call(this,title,text,opts,...rest);
};
