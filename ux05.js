'use strict';
const uxBase={intro,render};
let renderedLife=null,renderedTab=null,scrollMemory={};
function ensureUX(){if(!s)return;ensureClock();ensureIndividual();ensureHome();ensureRelations();familySchoolState();ensureStories();everydayState();engineState05();s.ui05??={panel:'center',open:{}};s.ui05.open??={};s.ui05.eventSerial??=0;for(const e of s.log)if(!e.uiId)e.uiId='event-'+(++s.ui05.eventSerial);}
function capturePanels(){if(!s||renderedLife!==s.saveId)return;for(const key of ['left','center','right']){const el=document.querySelector('[data-panel="'+key+'"]');if(!el)continue;const id=key==='center'?key+':'+renderedTab:key;const data={top:el.scrollTop||0};if(key==='center'&&renderedTab==='story'&&data.top>20&&el.querySelectorAll&&el.getBoundingClientRect){const top=el.getBoundingClientRect().top;const anchor=Array.from(el.querySelectorAll('[data-event-id]')).find(n=>n.getBoundingClientRect().bottom>top+50);if(anchor)data.anchor={id:anchor.dataset.eventId,offset:anchor.getBoundingClientRect().top-top};}scrollMemory[id]=data;}}
function restorePanels(){for(const el of document.querySelectorAll?.('[data-ui-key]')||[]){el.open=!!s.ui05.open[el.dataset.uiKey];el.ontoggle=()=>{s.ui05.open[el.dataset.uiKey]=el.open;save()};}for(const key of ['left','center','right']){const el=document.querySelector('[data-panel="'+key+'"]');if(!el)continue;const pos=scrollMemory[key==='center'?key+':'+tab:key];if(pos){el.scrollTop=pos.top;if(pos.anchor&&el.querySelector){const anchor=el.querySelector('[data-event-id="'+pos.anchor.id+'"]');if(anchor)el.scrollTop+=anchor.getBoundingClientRect().top-el.getBoundingClientRect().top-pos.anchor.offset;}}}}

function panelSelect(panel){capturePanels();s.ui05.panel=panel;render();save()}
intro=function(){const el=$('#app');el.className='';uxBase.intro()};
function disclosure(key,label,content,count=''){return `<details data-ui-key="${key}"><summary>${esc(label)}${count!==''?` <span class="count">${count}</span>`:''}</summary>${content}</details>`}
function bioRows(){const parents=s.people.filter(p=>['Мать','Отец'].includes(p.role)),children=s.people.filter(p=>p.role==='Ребенок'),spouse=s.people.find(p=>p.married&&p.alive),partner=currentPartner(),lateSpouse=s.people.find(p=>p.married&&!p.alive);const education=s.qualifications?.length?s.qualifications.map(id=>careerBy(id)?.title||id).join(', '):s.degree?'Высшее образование':s.age<6?'До школы':s.age<18?schools[s.school?.type||'public'].name:'Школьное образование';return [
 ['residence','Живет',residenceCity()+', '+c().name,'Текущий адрес персонажа. '+(s.housing?.mode==='parents'?'Живёт у родителей.':'')],
 ['origin','Происхождение',countries[s.birthCountry]?.name||'Нет данных','Известна страна рождения. Этническое происхождение из нее не выводится.'],
 ['nationality','Национальность',s.nationality||'Не указана','Национальность и гражданство — разные сведения. В старых сохранениях национальность не записана.'],
 ['citizenship','Гражданство',Array.isArray(s.citizenships)?s.citizenships.map(x=>countries[x]?.name||x).join(', '):s.citizenship?(countries[s.citizenship]?.name||s.citizenship):'Нет данных','Гражданство не присваивается по стране рождения или переезда.'],
 ['marital','Отношения',spouse?'В браке · '+spouse.name:lateSpouse?'Вдовство':partner?'Партнер · '+partner.name:s.people.some(p=>p.divorced)?'В разводе':'Без партнера','Юридический брак, романтическая связь и совместное жилье учитываются отдельно.'],
 ['family','Семья',`Родителей: ${parents.filter(p=>p.alive).length}`+(children.length?' · детей: '+children.length:''),
  [...parents.map(p=>p.name+(p.alive?'':' — умер'+(p.gender==='f'?'ла':''))),
   ...(children.length?['Дети: '+children.map(p=>p.name+(p.alive?'':' — умер'+(p.gender==='f'?'ла':''))).join(', ')]:[]),
   'Умершие близкие остаются в истории отношений'].join('. ')+'.'],
 ['education','Образование',education,(s.studyTrack?'Сейчас: '+careerBy(s.studyTrack.id).title+'. ':'')+education],
 ['work','Профессия',s.job?.title||'Нет текущей работы',s.job?`${s.job.title}. ${money(s.job.salary)}/год · ${s.workHours||40} ч/нед.`:'Текущая работа в сохранении отсутствует.']];}
function bioDetail(id){const row=bioRows().find(r=>r[0]===id);if(row)show(row[1],row[2]+'\n\n'+row[3],[{label:'Понятно',fn:()=>{}}])}
function profileVitals188(){
 const income=s.dead?0:s.age>=18?monthlyBudget().income:s.job?.salary/12||0;
 const stats=[['Здоровье',s.health],['Настроение',s.mood],['Усталость',s.clock.fatigue]];
 return `<section class="profile-vitals188" aria-label="Накопления и состояние">
  <button type="button" class="profile-balance188" onclick="financeMenu()">
   <span>Накопления</span><strong>${money(s.cash)}</strong>
   ${income>0?`<small>Доход · ${money(income)}/мес.</small>`:''}
  </button>
  <div class="profile-meters188">${stats.map(([label,value])=>{
   const n=Math.round(clamp(value||0));
   return `<div><span>${label}</span><div class="profile-meter188" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${n}" style="--fill188:${n}%"><b aria-hidden="true">${n}%</b></div></div>`;
  }).join('')}</div></section>`;
}
function profileSubtitle219(){
 const stem={hetero:'Гетеросексуал',gay:'Гомосексуал',bi:'Бисексуал',ace:'Асексуал'}[s.orientation];
 const label=s.age<14?'Детство':stem?stem+(s.gender==='f'?'ьна':'ен'):'';
 return [years(s.age),label].filter(Boolean).join(' · ');
}
function profile05(){
 const biography=bioRows().map(([id,label,value,hint])=>{
  if(id==='nationality'){
   if(typeof originReference190!=='function'||!originReference190(s).hasGlossary)return '';
   return `<div><dt>${esc(label)}</dt><dd>${originInline190(value)}</dd></div>`;
  }
  return `<div><dt>${esc(label)}</dt><dd><button class="bio-value" title="${esc(hint)}" aria-label="${esc(label+': '+value+'. Подробнее')}" onclick="bioDetail('${id}')">${esc(value)}</button></dd></div>`;
 }).join('');
 return `<section class="profile"><div class="avatar">${esc(s.name[0])}</div><div><h2>${esc(s.name)} ${esc(s.surname)}</h2><p>${esc(profileSubtitle219())}</p></div></section>${profileVitals188()}<dl class="biography">${biography}</dl>`;
}
function relationGroups(){const cats=[['origin','Семья происхождения'],['partner','Партнер / супруг'],['descendants','Дети и потомки'],['romance','Романтические связи и бывшие'],['friends','Друзья'],['contacts','Знакомые']];return cats.map(([id,label])=>{const list=s.people.filter(p=>{const roles=new Set([p.role,...(p.relationshipRoles||[])]);if(id==='origin')return [...roles].some(x=>['Мать','Отец','Брат','Сестра','Сиблинг','Бабушка','Дедушка','Тетя','Дядя','Родственник'].includes(x));if(id==='partner')return roles.has('Партнер')||p.married;if(id==='descendants')return [...roles].some(x=>['Ребенок','Сын','Дочь','Внук','Внучка','Потомок'].includes(x));if(id==='romance')return p.divorced||[...roles].some(x=>['Бывший партнер','Романтическая связь','Любовник','Любовница'].includes(x));if(id==='friends')return roles.has('Друг');return !p.married&&![...roles].some(x=>['Мать','Отец','Брат','Сестра','Сиблинг','Бабушка','Дедушка','Тетя','Дядя','Родственник','Партнер','Ребенок','Сын','Дочь','Внук','Внучка','Потомок','Бывший партнер','Романтическая связь','Любовник','Любовница','Друг'].includes(x));}).sort((a,b)=>Number(b.alive)-Number(a.alive)+(0)||((b.inner?.affection||b.bond||0)+(b.inner?.trust||0))-((a.inner?.affection||a.bond||0)+(a.inner?.trust||0))||a.name.localeCompare(b.name,'ru'));return{id,label,list}})}
function npcCard(p,compact=false){return `<article class="person-card ${compact?'compact':''}" data-npc-id="${esc(p.id)}"><div class="eyebrow">${esc(p.role)}${p.married?' · супруг':''} · ${years(p.age)}${p.alive?'':' · умер'+(p.gender==='f'?'ла':'')}</div><h3>${esc(p.name)}</h3><p>${p.alive?esc(countries[p.country]?.name||'Место не указано')+' · близость '+Math.round(p.inner?.affection||p.bond||0)+'/100':esc(p.deathNote||'Сохраняется в семейной истории.')}</p>${!compact?`<p>${esc(p.trait?.[1]||'')} ${p.alive&&p.age>=18?'Занятие: '+esc(p.occupation||'не указано')+'.':''}</p><p>Доверие ${Math.round(p.inner?.trust||0)} · напряжение ${Math.round(p.inner?.strain||0)}</p>${p.memories?.length?`<p class="sub">${esc(p.memories.slice(-2).join(' · '))}</p>`:''}`:''}${p.alive&&!s.dead?`<div class="btns"><button class="small" onclick="visit('${esc(p.id)}')">Встреча</button>${s.age>=6?`<button class="small" onclick="talk('${esc(p.id)}')">Разговор</button>`:''}${compact?`<button class="small" onclick="personDetail('${esc(p.id)}')">Подробнее</button>`:p.role==='Партнер'?`<button class="small" onclick="breakup('${esc(p.id)}')">Расстаться</button>`:''}</div>`:''}</article>`}
function personDetail(id){const p=s.people.find(p=>p.id===id);if(!p)return;show(p.name,`${p.role} · ${years(p.age)}. ${p.alive?'Живёт в '+(countries[p.country]?.name||'неизвестной стране'):p.deathNote||'Умерший близкий'}.\n${p.trait?.[1]||''}\n${p.memories?.slice(-4).join('\n')||'Записанных воспоминаний пока нет.'}`,p.alive?[{label:'Запланировать встречу',fn:()=>visit(id)},{label:'Поговорить',fn:()=>talk(id)}]:[{label:'Закрыть',fn:()=>{}}])}
function familyRelationGroups166(){
 const families=[
  ['parents','Родители',['Мать','Отец']],
  ['siblings','Братья и сёстры',['Брат','Сестра','Сиблинг']],
  ['grandparents','Бабушки и дедушки',['Бабушка','Дедушка']]
 ];
 return relationGroups().flatMap(group=>{
  if(group.id!=='origin')return [group];
  const remaining=new Set(group.list);
  const sections=families.map(([id,label,roles])=>({
   id,label,list:group.list.filter(p=>{
    if(!remaining.has(p)||![p.role,...(p.relationshipRoles||[])].some(role=>roles.includes(role)))return false;
    remaining.delete(p);
    return true;
   })
  }));
  return [...sections,{id:'origin',label:'Другие родственники',list:[...remaining]}];
 });
}
function groupedPeople(compact){return `<div class="relationship-groups">${familyRelationGroups166().map(g=>disclosure((compact?'side-':'people-')+g.id,g.label,g.list.map(p=>npcCard(p,compact)).join('')||'<p class="sub">Пока никого.</p>',g.list.length)).join('')}</div>`}
people=function(){return '<div class="chapter"><h1>Отношения</h1></div>'+groupedPeople(false)};
function groupedActions(){const labels=[['life','Быт и здоровье',['rest','pets','finance','housing','explore']],['career','Работа и учёба',['work','learn']],['people','Люди и семья',['family','date','friend']],['future','Планы и переезды',['plans','move']]];const actions=actionList();return `<section class="actions"><h3>Действия</h3>${labels.map(([key,label,keys])=>{const list=actions.filter(a=>keys.includes(a[0]));return list.length?disclosure('actions-'+key,label,list.map(a=>`<button onclick="action('${a[0]}')" ${s.dead?'disabled':''}>${esc(a[1])} ↗</button>`).join(''),list.length):''}).join('')}${actions.filter(a=>!labels.some(x=>x[2].includes(a[0]))).map(a=>`<button onclick="action('${a[0]}')">${esc(a[1])} ↗</button>`).join('')}</section>`}
render=function(){if(!s)return intro();capturePanels();ensureUX();if(renderedLife!==s.saveId){scrollMemory={};renderedLife=s.saveId;}$('#app').className='playing mobile-'+s.ui05.panel;$('#app').innerHTML=header()+clockView()+`<nav class="mobile-panels" aria-label="Области игры">${[['left','Персонаж'],['center','История'],['right','Действия']].map(([id,title])=>`<button aria-pressed="${s.ui05.panel===id}" onclick="panelSelect('${id}')">${title}</button>`).join('')}</nav><main class="shell"><aside class="left game-panel" data-panel="left" aria-label="Персонаж и отношения" tabindex="0">${profile05()}<h3 class="section-title">Отношения</h3>${groupedPeople(true)}</aside><section class="center game-panel" data-panel="center" aria-label="Лента и подробности" tabindex="0"><div class="tabs">${[['story','История'],['people','Люди'],['world','Личное дело'],['trajectory','Траектория']].map(([id,label])=>`<button class="${tab===id?'active':''}" onclick="setTab('${id}')">${label}</button>`).join('')}</div>${tab==='story'?recentView()+story():tab==='people'?people():tab==='trajectory'&&typeof trajectoryView16==='function'?trajectoryView16():world()}</section><aside class="right game-panel" data-panel="right" aria-label="Действия и планы" tabindex="0">${groupedActions()}${s.age>=18?planSummary():''}${activitiesView()}</aside></main>`;renderedTab=tab;restorePanels();};
if(s){ensureUX();save();render()}
