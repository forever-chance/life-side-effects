'use strict';
// Presentation changes keep the original action and document records.
const interfaceBase70={groupedActions,schedulePanel59,petsPanel59,homePanel59,npcCard,actionCatalog24,activitiesView,meetingsMenu53};
groupedActions=function(){return interfaceBase70.groupedActions().replace(/Ожидают ответа и внимания · (\d+)/g,'Ожидают ответа <span class="attention-count70">$1</span>');};
schedulePanel59=function(){return interfaceBase70.schedulePanel59().replace(dashButton58('Нагрузка','loadMenu29()')+dashButton58('История дел','taskArchive65()'),'<div class="schedule-tools70"><button class="small" onclick="loadMenu29()">Нагрузка</button><button class="small quiet70" onclick="taskArchive65()">История дел</button></div>');};
function panelPlus70(label,code){return '<button class="panel-plus70" onclick="'+code+'" aria-label="'+label+'" title="'+label+'">+</button>';}
petsPanel59=function(){let html=interfaceBase70.petsPanel59();html=html.replace(/<h3>(Животные · \d+)<\/h3>/,(_,title)=>'<div class="panel-heading70"><h3>'+title+'</h3>'+(panelPlus70(s.age<18?'Животные и просьбы родителям':'Животные: уход, приют и покупка',s.age<18?'childPets70()':'petMenu()'))+'</div>');return html.replace(/<button onclick="petMenu\(\)">[\s\S]*?<\/button>/,'');};
homePanel59=function(){return interfaceBase70.homePanel59().replace('<h3>Дом</h3>','<div class="panel-heading70"><h3>Дом</h3>'+panelPlus70('Жильё и управление',s.age<18?'currentHomeMenu59()':'housingMenu()')+'</div>').replace(dashButton58('Жильё и подробности','currentHomeMenu59()'),'');};
currentHomeMenu59=function(){
 const info=currentHome59();
 if(!info?.listing)return housingMenu();
 const q=info.listing;
 show('Дом · '+q.city,'',[{label:'Управлять жильём',hidden:s.age<18,fn:housingMenu}]);
 const d=$('#modal');
 d.innerHTML=d.innerHTML.replace('<p></p>','').replace('<div class="options"></div>','');
 const tenure=info.host?(npcHome59(info.host).tenure==='own'?'В собственности близкого':'Близкий снимает жильё'):
  info.tenure==='own'?'Собственное жильё':'Аренда';
 const host=info.host?`<div class="house-host70"><span>${esc(info.host.name)}</span>
  <button class="small quiet70" data-id="${esc(info.host.id)}" onclick="personDetail(this.dataset.id)">Карточка</button></div>`:'';
 d.innerHTML+=houseFigure41(q)+'<div class="house-description70">'+factTiles20([
  ...houseFactRows41(q),['Проживание',tenure],['Расходы на жильё',money(homeCost())+'/мес.']
 ])+host+'</div>';
};
npcCard=function(p,...args){return interfaceBase70.npcCard(p,...args).replace(/<button\b[^>]*onclick="(?:talk|visit)\('[^']*'\)"[^>]*>[\s\S]*?<\/button>/g,'').replace(/<div class="btns">\s*<\/div>/g,'');};
function ageReason70(reason){return /(?:[СсДд]оступно\s+с|[Сс]\s+\d+\s+лет|[Сс]о школьного возраста|[Дд]ля возраста\s+\d+|Жильё пока устраивают родители|Приобретение животных доступно|Эти встречи доступны взрослым)/.test(reason||'');}
actionCatalog24=function(){return interfaceBase70.actionCatalog24().filter(a=>!ageReason70(a.reason)).map(a=>s.age<18&&a.id==='parenthood65'?{...a,label:'Детство и семья',keywords:'родители просьбы подарки друзья школа'}:a);};
activitiesView=function(){let html=interfaceBase70.activitiesView();if(s.age<16&&!s.job)html=html.replace(dashButton58('Моя работа',"openPath16('jobs')")+dashButton58('Моя учёба',"openPath16('education')")+dashButton58('Отклики на работу · '+requestCount58('work'),"openRequests58('work')"),dashButton58('Моя учёба',"openPath16('education')"));if(s.age<18)html=html.replace('<strong>Дети и родительство</strong><small>Стать родителем, школа, кружки и уход</small>','<strong>Детство и семья</strong><small>Просьбы родителям, друзья и школьные события</small>');return html;};
meetingsMenu53=function(id){const original=show;show=function(title,text,opts,...rest){return original(title,text+'\nВ счётчик свиданий входят ресторан и романтическая прогулка. Визит домой, совместные занятия и ONS не считаются свиданиями.',opts,...rest);};try{return interfaceBase70.meetingsMenu53(id);}finally{show=original;}};
function docCountry70(id){return countries[id]?.name||id||'Не записано';}
function docSection70(title,body){return '<section class="document-card70"><h3>'+title+'</h3>'+body+'</section>';}
mobilityView16=function(){const x=path16(),r=rights31(s.country),active=x.permits.filter(p=>validPermit31(p,p.country)&&!citizenRight31(p.country)),citizens=[...new Set([...(s.citizenships||[]),s.citizenship].filter(k=>countries[k]))];
 const sources=[...x.applications.filter(a=>['accepted','enrolled'].includes(a.status)&&prog16(a.program)).map(a=>{const p=prog16(a.program);return {kind:'study',id:a.id,country:p.country,city:p.city,label:'Учёба · '+uni16(p).name};}),...x.jobApplications.filter(a=>['accepted','employed'].includes(a.status)).map(a=>({kind:'work',id:a.id,country:a.vacancy.country,city:a.vacancy.city,label:'Работа · '+a.vacancy.title})),...s.people.filter(p=>p.alive&&['Мать','Отец','Партнер'].includes(p.role)&&(p.inner?.trust||0)>=50&&p.country!==s.country).map(p=>({kind:'family',id:p.id,country:p.country,city:personCity62(p),label:'Близкий · '+p.name}))];
 const localSources=sources.filter(q=>q.country===s.country);
 const moveSources=sources.filter(q=>q.country!==s.country||q.city!==residenceCity());
 const status='<dl class="document-facts70"><div><dt>Живёте</dt><dd>'+esc(residenceCity()+' · '+docCountry70(x.residence))+'</dd></div><div><dt>Гражданство</dt><dd>'+esc(citizens.map(docCountry70).join(', ')||'Не записано')+'</dd></div><div><dt>Права здесь</dt><dd>'+(r.reside?'Проживание':'Нет основания проживания')+' · '+(r.study?'учёба разрешена':'учёба не подтверждена')+' · '+(r.citizen?'работа разрешена':'работа '+Math.floor(r.hours)+' ч/нед.')+'</dd></div></dl>'+button16('Подробности прав','rightsMenu31()');
 const permits=active.map(p=>'<div class="document-permit70"><strong>'+esc(docCountry70(p.country))+'</strong><span>'+esc(({work:'Работа',study:'Учёба','legacy-study':'Учёба',family:'Семья'})[p.basis]||p.basis)+' · '+(p.expires===null?'Без срока':Math.max(0,p.expires-s.clock.ticks)+' мес. осталось')+'</span></div>').join('');
 const admin=adminItems45().filter(q=>q.type!=='citizenship').map(q=>button16(q.title,"openAdmin45('"+q.id+"')")).join('');
 const pending=x.permitApplications.filter(a=>a.status==='submitted');
 const processing=pending.map(a=>'<div class="document-permit70"><strong>'+esc(docCountry70(a.country))+'</strong><span>Документы рассматриваются</span></div>').join('');
 const familiar=new Set([s.birthCountry,...citizens,...x.residenceHistory.map(h=>h.country),
  ...(s.atlasHomes89||[]).map(h=>h.country),...(s.family17?.citizenship231?.history||[]).map(h=>h.country)]);
 const destinations=Object.keys(countries).filter(c=>s.age>=18&&c!==s.country&&permission16(c,'study'));
 const buttons=(known)=>destinations.filter(c=>familiar.has(c)===known)
  .map(c=>button16((known?'Вернуться · ':'Переехать · ')+docCountry70(c),"move16('return','"+c+"')")+(typeof placeReference190==='function'?placeReference190(c,cities[c][0]):'')).join('');
 const back=buttons(true),newHomes=buttons(false);
 const history=x.residenceHistory.map(h=>'<p>'+esc(docCountry70(h.country)+(h.city?' · '+h.city:''))+' <small>· с игрового месяца '+h.from+'</small></p>').join('');
 const results=x.permitApplications.filter(a=>a.status!=='submitted').slice(-12).reverse().map(a=>'<p>'+esc(docCountry70(a.country)+' · '+(status16[a.status]||a.status))+'</p>').join('');
 return '<div class="documents70"><h2>Документы и переезды</h2>'+docSection70('Сейчас',status)+(permits||admin?docSection70('Разрешения и продление',permits+'<div class="document-actions70">'+admin+'</div>'):'')+(processing?docSection70('На рассмотрении',processing):'')+(s.age>=17&&localSources.length?docSection70('Смена основания проживания',localSources.filter(q=>s.age>=18||q.kind==='study').map(q=>relocationCard68(q,true)).join('')):'')+docSection70('Переезд',s.age<17?'<p class="sub">Переезд и документы пока организуют родители.</p>':(moveSources.filter(q=>s.age>=18||q.kind==='study').length?moveSources.filter(q=>s.age>=18||q.kind==='study').map(q=>relocationCard68(q)).join(''):'<p class="sub">Примите предложение учёбы или работы, либо выберите близкого, к которому можно переехать.</p>')+'<div class="document-actions70">'+button16('Найти учёбу',"openPath16('education')")+button16('Найти работу',"openPath16('jobs')")+button16('Кто едет со мной','familyMoveMenu61()')+'</div>')+(typeof settlementMenu124==='function'?docSection70('Постоянное проживание',button16('Проверить условия ПМЖ','settlementMenu124()')):'')+docSection70('Гражданство',button16('Срок и условия','naturalizationMenu45()')+button16('Оформление через семью','citizenshipMenu231()'))+(back?docSection70('Возвращение',back):'')+(newHomes?docSection70('Переезд по действующему праву',newHomes):'')+'<details class="document-history70"><summary>История проживания и документов</summary>'+history+results+'</details></div>';
};

contactsHub65=function(){menu65('Люди и отношения',[['Контакты',()=>setTab('people'),'Имя, страна и город'],...familyContactRows65(),...(s.age>=15?[['Знакомства и личная жизнь',romanceMenu,'Встречи, пара и совместный быт']]:[]),['Приглашения знакомых',socialMenu49],...(s.age>=6?[['Коллеги и одногруппники',circlesMenu48]]:[]),['Семейная поддержка',familyAgreements21],['Возраст и помощь близким',generationsMenu58],['Личные истории',settlingMenu51]]);};

function childPets70(){show('Животные дома','Питомцы семьи и просьбы родителям. Попросить кошку можно с 5 лет, кролика — с 6, собаку — с 7.',[...s.pets.filter(p=>p.alive).map(p=>({label:p.name,fn:()=>petDetails(p.id)})),...Object.entries(wishes67).filter(([kind,cfg])=>petKinds[kind]&&s.age>=cfg[1]&&s.age<18).map(([kind,cfg])=>({label:'Попросить · '+petKinds[kind].label,hint:requestWhy67(kind),disabled:!!requestWhy67(kind),fn:()=>parentPetChoice68(kind)}))]);}
