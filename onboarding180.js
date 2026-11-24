'use strict';

const onboardingBase180={start,choose,closeModal,render,header,toggleClock,setSpeed,advanceMonth,loadCharacter};
function onboarding180(){return s?.onboarding180;}
function tutorialActive180(){return onboarding180()?.status==='active';}
function startupNotice180(){
 const state=onboarding180();
 return state?.status==='new'&&life61().notices.find(n=>n.type==='milestone166'&&n.milestoneAge===state.startAge&&n.status!=='read');
}
start=function(){
 onboardingBase180.start();
 if(!s)return;
 s.onboarding180={status:'new',startAge:s.age,step:0};
 const notice=startupNotice180();
 if(notice){
  const clock=s.clock;
  s.onboarding180.clock={running:!!(clock.running||clock.resumeAfterChoice),speed:clock.speed};
  modalFrames38=[];
  showMilestone166(notice);
 }
 save();
};
loadCharacter=function(id){
 const result=onboardingBase180.loadCharacter(id);
 const notice=startupNotice180();
 if(notice)showMilestone166(notice);
 return result;
};
function finishStartup180(skip){
 const notice=startupNotice180();
 if(!notice)return false;
 notice.status='read';
 if(skip)s.hideMilestonePopups180=true;
 const clock=onboarding180().clock;
 onboardingBase180.closeModal();
 beginTutorial180(clock);
 return true;
}
choose=function(i){
 if(startupNotice180()&&$('#modal').open)return finishStartup180(i===1);
 return onboardingBase180.choose(i);
};
closeModal=function(){
 if(startupNotice180()&&$('#modal').open)return finishStartup180(false);
 return onboardingBase180.closeModal();
};
function beginTutorial180(previous=null){
 const state=s.onboarding180??={};
 Object.assign(state,{status:'active',step:0,demo:false,original:{tab,panel:s.ui05.panel,dossier:dossierSection88,section:path16().view.section},clock:previous||{running:!!(s.clock.running||s.clock.resumeAfterChoice),speed:s.clock.speed}});
 s.clock.running=false;s.clock.resumeAfterChoice=false;s.clock.choiceActive=false;
 setTutorialStep180(0);
}
function endTutorial180(status){
 const state=onboarding180();
 if(!tutorialActive180())return;
 state.status=status;
 if($('#modal').open)onboardingBase180.closeModal();
 tab=state.original.tab;s.ui05.panel=state.original.panel;
 dossierSection88=state.original.dossier;path16().view.section=state.original.section;
 s.clock.speed=state.clock.speed;
 s.clock.running=state.clock.running&&!s.dead&&!s.pending.length;
 s.clock.choiceActive=false;s.clock.resumeAfterChoice=false;
 clockCarry=0;clockStamp=Date.now();save();render();
}
toggleClock=function(){if(!tutorialActive180()&&!startupNotice180())return onboardingBase180.toggleClock();};
setSpeed=function(v){if(!tutorialActive180())return onboardingBase180.setSpeed(v);};
advanceMonth=function(){if(!tutorialActive180()&&!startupNotice180())return onboardingBase180.advanceMonth();};

const tutorialSteps180=[
 ['История', 'Здесь разворачивается ваша жизнь. События, случайности, решения и их последствия появляются в истории. Предыдущие события можно просмотреть в любой момент.', '.center .tabs button[onclick*="story"]'],
 ['Действия и решения', 'Некоторые события требуют вашего решения. Доступный вариант можно выбрать, а иногда потребуется отдельное подтверждение. Недоступный вариант нельзя нажать: рядом обычно указана причина.', '.right button[onclick*="decisionsMenu24"]'],
 ['Личное дело','Здесь хранится информация о персонаже: кто вы, откуда, через что прошли и кто составляет вашу семью.', '.center .tabs button[onclick*="world"]'],
 ['Досье','Основные данные персонажа и обстоятельства начала жизни.', '.timeline-tools88 button[onclick*="dossier\x27"]'],
 ['Хронология','Значимые события жизни в порядке их появления.', '.timeline-tools88 button[onclick*="timeline\x27"]'],
 ['География','Здесь видны места рождения, проживания и поездок.', '.timeline-tools88 button[onclick*="geography\x27"]'],
 ['Семья','Здесь можно проследить родственные связи в семейном древе.', '.timeline-tools88 button[onclick*="family\x27"]'],
 ['Траектория','Здесь можно управлять направлением своей жизни: учёбой, карьерой и развитием навыков.', '.center .tabs button[onclick*="trajectory"]'],
 ['Люди','Здесь находятся родственники, друзья, знакомые и партнёры. Открой карточку, чтобы посмотреть отношения и доступные действия.', '.center .tabs button[onclick*="people"]'],
 ['Карточка человека','В карточке видны сведения о человеке и способы общения, доступные сейчас. Здесь можно просто прочитать подробности.', '.center .contact-name64 button'],
 ['Боковая панель','В разделе «Действия» можно проверить расписание, открыть сведения о доме и перейти к доступным занятиям.', '.right .schedule-panel59'],
 ['Управление временем','На паузе игровой календарь стоит. Кнопки 0,5×–8× меняют скорость, а «Продолжить» запускает время. Сейчас календарь остаётся на паузе.', '.clock-controls'],
 ['Начало жизни','Теперь можно начинать. Остальные возможности будут открываться по мере взросления и развития персонажа. Обучение можно повторить через «Помощь».', null]
];
function setTutorialStep180(step){
 if(!tutorialActive180())return;
 const state=onboarding180();
 if(step>=tutorialSteps180.length)return endTutorial180('finished');
 if($('#modal').open)onboardingBase180.closeModal();
 state.step=Math.max(0,step);state.demo=false;
 s.ui05.panel=[1,10].includes(step)?'right':'center';
 if(step===0)tab='story';
 if(step===7)path16().view.section='education';
 if(step>=3&&step<=6){tab='world';dossierSection88=['dossier','timeline','geography','family'][step-3];}
 if(step===8||step===9)tab='people';
 s.clock.running=false;save();render();
 const target=tutorialTarget180();
 target?.scrollIntoView?.({block:'nearest',inline:'nearest'});
 drawTutorial180();
}
function tutorialTarget180(){
 const step=onboarding180()?.step;
 if(step===9&&$('#modal').open)return $('#modal h2');
 if(step===9){
  const section=document.querySelector?.('.center details[data-ui-key="people-parents"]')||document.querySelector?.('.center details[data-ui-key^="people-"]');
  if(section)section.open=true;
 }
 const selector=tutorialSteps180[step]?.[2];
 return selector?document.querySelector(selector):null;
}
function tutorialHighlight180(target){
 if(!target)return null;
 let bounds=target.getBoundingClientRect();
 if(target.matches('.tabs button,.timeline-tools88 button')){
  const label=document.createRange();
  label.selectNodeContents(target);
  const text=label.getBoundingClientRect();
  if(text.width&&text.height)bounds=text;
 }
 const padding=6;
 return {left:bounds.left-padding,right:bounds.right+padding,
  top:bounds.top-padding,bottom:bounds.bottom+padding};
}
function drawTutorial180(){
 if(!document.querySelectorAll)return;
 document.querySelector('#tutorial180')?.remove();
 if(!tutorialActive180())return;
 const state=onboarding180(),step=state.step,[title,copy]=tutorialSteps180[step];
 const modal=$('#modal').open;
 const target=tutorialTarget180(),box=tutorialHighlight180(target);
 const screenW=window.innerWidth,screenH=window.innerHeight;
 const root=document.createElement('aside');root.id='tutorial180';root.setAttribute('aria-label','Обучение');
 const childText=step===7?(s.age<17?' Учёба, работа и другие самостоятельные решения будут открываться с возрастом.':' Здесь доступны программы обучения, вакансии и профессиональная подготовка. Финансы и отношения открываются из «Действий».'):'';
 const demonstration=step===1?'<div class="tutorial-demo180"><button type="button" onclick="tutorialDemo180()">'+(state.demo?'Подтвердить учебный ответ':'Выбрать учебный ответ')+'</button><button type="button" disabled>Пример недоступного ответа</button><small>Тренировка. Игровое событие и последствия не создаются.</small></div>':'';
 root.innerHTML='<div class="tutorial-tip180" role="region"><strong>'+esc(title)+'</strong><p>'+esc(copy+childText)+'</p>'+demonstration+'<div class="tutorial-buttons180">'+
  (step?'<button onclick="setTutorialStep180('+ (step-1)+')">Назад</button>':'')+
  '<button onclick="nextTutorial180()">'+(step===12?'Начать жизнь':'Далее')+'</button><button onclick="endTutorial180(\'skipped\')">Пропустить обучение</button></div></div>';
 const left=box?Math.max(0,Math.min(screenW,box.left)):0,right=box?Math.max(left,Math.min(screenW,box.right)):0;
 const top=box?Math.max(0,Math.min(screenH,box.top)):0,bottom=box?Math.max(top,Math.min(screenH,box.bottom)):0;
 const gaps=right>left&&bottom>top?[[0,0,screenW,top],[0,bottom,screenW,screenH-bottom],[0,top,left,bottom-top],[right,top,screenW-right,bottom-top]]:[[0,0,screenW,screenH]];
 if(!modal)for(const [x,y,w,h] of gaps){
  const shade=document.createElement('div');shade.className='tutorial-shade180';
  Object.assign(shade.style,{left:x+'px',top:y+'px',width:w+'px',height:h+'px'});root.prepend(shade);
 }
 (modal?$('#modal'):document.body).append(root);
 const tip=root.querySelector('.tutorial-tip180');
 if(!modal){
  const height=tip.getBoundingClientRect().height;
  const below=screenH-bottom,above=top;
  const horizontal=height+16>Math.max(below,above)&&Math.max(left,screenW-right)>=260;
  if(horizontal)tip.style.width=Math.min(tip.offsetWidth,Math.max(left,screenW-right)-16)+'px';
  if(horizontal)tip.style.left=(left>=screenW-right?8:right+8)+'px';
  else tip.style.left=Math.max(8,Math.min(screenW-tip.offsetWidth-8,left))+'px';
  tip.style.top=(horizontal?8:below>=height+16?bottom+8:Math.max(8,above-height-8))+'px';
  tip.style.maxHeight=Math.max(80,horizontal?screenH-16:Math.max(below,above)-16)+'px';
 }
}
function tutorialDemo180(){
 if(onboarding180().demo)setTutorialStep180(2);
 else {onboarding180().demo=true;save();drawTutorial180();}
}
function nextTutorial180(){
 const n=onboarding180().step;
 if(n===7){tab='trajectory';path16().view.section='education';}
 setTutorialStep180(n+1);
}
render=function(){
 const r=onboardingBase180.render();
 if(tutorialActive180())drawTutorial180();
 else document.querySelector?.('#tutorial180')?.remove();
 return r;
};
document.addEventListener('click',event=>{
 if(!tutorialActive180()||event.target.closest?.('#tutorial180'))return;
 const n=onboarding180().step;
 if([1,9].includes(n)&&$('#modal').open&&event.target.closest?.('#modal button.close'))return;
 const target=tutorialTarget180();
 if(!target?.contains(event.target)||[10,11,12].includes(n)||$('#modal').open){
  event.preventDefault();event.stopImmediatePropagation();return;
 }
 if(n===1){
  event.preventDefault();event.stopImmediatePropagation();
  if(decisionItems24().some(item=>item.ref.kind!=='life61'||item.q?.type!=='milestone166')){
   decisionsMenu24();drawTutorial180();
  }else tutorialDemo180();
  return;
 }
 if(n===7)path16().view.section='education';
 setTimeout(()=>{if(!tutorialActive180()||onboarding180().step!==n)return;
  if(n===9)drawTutorial180();else setTutorialStep180(n+1);
 },0);
},true);
let tutorialLayoutFrame180;
function scheduleTutorialLayout180(){
 if(!tutorialActive180()||tutorialLayoutFrame180)return;
 tutorialLayoutFrame180=window.requestAnimationFrame?.(()=>{tutorialLayoutFrame180=null;drawTutorial180();});
}
document.addEventListener('scroll',event=>{if(!event.target.closest?.('#tutorial180'))scheduleTutorialLayout180();},true);
window.addEventListener('resize',scheduleTutorialLayout180);
header=function(...args){
 const markup=onboardingBase180.header(...args);
 return markup.replace('<button onclick="about()">Об игре</button>','').replace('</nav>','<button type="button" class="help-icon181" onclick="helpMenu180()" aria-label="Помощь" title="Помощь"><span aria-hidden="true">?</span></button></nav>');
};
function helpMenu180(){
 show('Помощь',s?'Настройки подсказок действуют для текущего персонажа.':'',[
  {label:'Об игре',fn:about},
  ...(s?[
  {label:'Пройти обучение заново',fn:()=>beginTutorial180()},
  {label:'Показывать игровые подсказки · '+(s.hintsDisabled180?'выкл.':'вкл.'),fn:()=>{s.hintsDisabled180=!s.hintsDisabled180;helpMenu180();}},
  {label:'Показывать возрастные попапы · '+(s.hideMilestonePopups180?'выкл.':'вкл.'),fn:()=>{s.hideMilestonePopups180=!s.hideMilestonePopups180;helpMenu180();}},
  ]:[]),
  {label:'Закрыть',fn:()=>{}}
 ]);
}

const searchAliases180={
 'norwich_terrier':'норвич norwich','jack_russell_terrier':'джек рассел jrt','american_staffordshire_terrier':'амстафф amstaff',
 'ibizan_hound':'ибиценская борзая podenco','exotic_shorthair':'экзот exotic','birman':'бирманская birman',
 'british':'британец bsh','maine-coon':'мейнкун maine coon','german-shepherd':'овчарка gsd',
 developer:'программист software developer engineer',gameplay:'геймплей game programmer',
 qa16:'qa тестировщик тестирование quality assurance',gameqa:'qa тестировщик игр',
 pmm:'pmm продуктовый маркетинг',camera:'camera assistant кино',cameraOperator:'кинооператор camera operator',
 cinematographer:'оператор постановщик dop',retail:'продавец кассир retail',shiftManager:'администратор менеджер смены'
};
function searchKey180(value){
 return String(value??'').toLocaleLowerCase('ru').replace(/ё/g,'е').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
}
function searchMatches180(query,...values){
 const haystack=searchKey180(values.filter(Boolean).join(' '));
 return searchKey180(query).split(' ').every(word=>haystack.includes(word));
}
function breedMatches180(breed,query){
 return searchMatches180(query,breed.name,breed.official,breed.id,breed.searchAliases182,breed.legacyName182,searchAliases180[breed.id]);
}
function professionMatches180(profession,query,vacancy=null){
 if(!profession)return false;
 const tracks=vacancy?.profile46?.tracks||roleProfiles46[profession.id]?.tracks||[];
 const subject=vacancy?.subject26&&teachingSubjects26[vacancy.subject26]?.title;
 return searchMatches180(query,profession.title,profession.id,fields16[profession.field]?.name,
  searchAliases180[profession.id],vacancy?.title,subject,...tracks.map(id=>trackNames46[id]));
}
function searchBar180(id,placeholder,handler,value=''){
 return '<div class="catalog-search180"><label><input type="search" id="'+id+'" aria-label="'+placeholder+'" placeholder="'+placeholder+'" value="'+esc(value)+'" oninput="'+handler+'(this.value)"></label><button type="button" onclick="clearSearch180(\''+id+'\')">Очистить</button></div>';
}
function clearSearch180(id){
 const input=$('#'+id);
 if(!input)return;
 input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
}
const breedMenuBase180=breederMenu;
breederMenu=function(kind){
 if(!kind)return breedMenuBase180(kind);
 breedMenuBase180(kind);
 const dialog=$('#modal');
 const options=dialog.querySelector?.('.options');
 if(!options)return;
 options.insertAdjacentHTML('beforebegin',searchBar180('breed-search180','Найти породу...','filterBreeds180')+
  '<p id="breed-empty180" hidden role="status">Породы не найдены</p>');
 const breeds=breederBreeds98(kind);
 Array.from(options.children).forEach((button,i)=>{if(breeds[i])button.dataset.breed180=breeds[i].id;});
};
function filterBreeds180(query){
 const buttons=$('#modal').querySelectorAll('[data-breed180]');
 let found=false;
 for(const button of buttons){
  const match=breedMatches180(petBreed38(button.dataset.breed180),query);
  button.hidden=!match;found||=match;
 }
 $('#breed-empty180').hidden=found;
}
let vacancyQuery180={life:null,text:''};
function vacancySearch180(){
 if(vacancyQuery180.life!==s.saveId)vacancyQuery180={life:s.saveId,text:''};
 return vacancyQuery180.text;
}
function vacancySearchMatches180(v){
 const query=vacancySearch180();
 return !searchKey180(query)||professionMatches180(profession16(v.profession),query,v)&&
  !jobEligibility16(v).why.length&&(v.country!==s.country||permission16(v.country,'work'));
}
function filterVacancies180(value){
 vacancySearch180();vacancyQuery180.text=value;path16().view.page=0;
 const result=$('#vacancy-results180');
 if(result){
  const tmp=document.createElement('div');tmp.innerHTML=vacanciesView58();
  result.innerHTML=tmp.querySelector('#vacancy-results180').innerHTML;
 }
}
function professionCatalog180(){
 show('Каталог профессий','Должности и специализации. Условия трудоустройства проверяются отдельно в конкретной вакансии.',[]);
 const dialog=$('#modal');
 dialog.innerHTML=dialog.innerHTML.replace('<div class="options">',searchBar180('profession-search180','Найти профессию...','filterProfessions180')+
  '<div id="profession-results180">'+professionRows180('')+'</div><div class="options">');
}
function professionRows180(query){
 return professions16.filter(p=>professionMatches180(p,query)).map(p=>
  '<p><strong>'+esc(p.title)+'</strong><br><small>'+esc(fields16[p.field]?.name||'')+
  '</small></p>').join('')||'<p role="status">Профессии не найдены</p>';
}
function filterProfessions180(query){$('#profession-results180').innerHTML=professionRows180(query);}


const hints180={
 education:['Учёба и поступление','Открой программу, чтобы сравнить условия, стоимость и требования. Подача заявки, принятие предложения и начало учёбы — отдельные шаги.'],
 jobs:['Поиск работы','Вакансии можно сравнить по оплате, графику и требованиям. Отклики, собеседования и предложения работодателей находятся в «Заявках и ответах».'],
 career:['Карьерные переговоры','Выбери тему разговора с работодателем. Если поступит предложение, открой его и сравни должность, оплату и условия до принятия.'],
 finance:['Бюджет','В бюджете видны доходы, текущие расходы и долги. Семейная помощь и доли расходов зависят от действующих договорённостей.'],
 housing:['Жильё','Сравни аренду, залог и ежемесячные расходы. Покупка, заселение и сдача недвижимости оформляются отдельными действиями.'],
 business:['Своё дело','Перед открытием сравни стартовые вложения и ежемесячные расходы. Деньги компании и личный бюджет учитываются отдельно.'],
 family:['Отношения и семья','Открой карточку человека, чтобы увидеть доступные способы общения. Встреча, отношения и совместный быт требуют отдельных решений.'],
 migration:['Переезд и документы','Сначала проверь основание и права в стране назначения. Заявка на документы и сам переезд оформляются отдельно.'],
 crime:['Правосудие','Здесь можно открыть происшествие или дело и проверить, какие действия доступны сейчас. Последующие решения появляются по мере развития дела.']
};
function hintHTML180(key){
 const [title,copy]=hints180[key];
 return '<span class="context-hint180"><button type="button" class="hint-trigger187" aria-label="Справка: '+esc(title)+
  '" aria-expanded="false" onclick="toggleHint187(this)">?</button>'+
  '<span class="hint-copy187">'+esc(copy)+'</span></span>';
}
function toggleHint187(button){
 button.setAttribute('aria-expanded',String(button.getAttribute('aria-expanded')!=='true'));
}
function headingHint187(html,key,tag){
 return html.replace(new RegExp('<'+tag+'([^>]*)>(.*?)</'+tag+'>','s'),(heading,attrs,content)=>
  '<div class="hint-heading187"><'+tag+attrs+'>'+content+'</'+tag+'>'+hintHTML180(key)+'</div>');
}

function attachHint180(key,fn){
 return function(...args){
  const previous=show;
  let opened=false;
  show=function(...params){opened=true;return previous(...params);};
  try{return fn(...args);}
  finally{
   show=previous;
   if(opened&&!tutorialActive180()){
    const dialog=$('#modal');
    dialog.innerHTML=headingHint187(dialog.innerHTML,key,'h2');
   }
  }
 };
}
financeMenu=attachHint180('finance',financeMenu);
housingMenu=attachHint180('housing',housingMenu);
romanceMenu=attachHint180('family',romanceMenu);
familyHub65=attachHint180('family',familyHub65);
enterpriseMenu152=attachHint180('business',enterpriseMenu152);
justiceMenu91=attachHint180('crime',justiceMenu91);
careerMenu18=attachHint180('career',careerMenu18);
workControls16=careerMenu18;
const trajectoryBase180=trajectoryView16;
trajectoryView16=function(){
 const html=trajectoryBase180();
 const key={jobs:'jobs',vacancies58:'jobs',admission58:'education',education:'education',mobility:'migration'}[path16().view.section];
 if(!key||tutorialActive180()||s.age<(key==='education'?17:key==='jobs'?16:18))return html;
 return headingHint187(html,key,/<h1(?:\s|>)/.test(html)?'h1':'h2');
};
