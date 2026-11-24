'use strict';
const romanceBase63={personDetail,meetingsMenu53,finishTask,romanceSearch18,romanceMenu,actionCatalog24};
const relationshipRoles63=['Друг','Знакомый','Знакомство'];
function modernDates63(p){return (p.memories||[]).filter(m=>['Свидание в ресторане','Свидание на прогулке'].some(name=>m===name||m.endsWith(': '+name))).length;}
function relationshipProgress63(p){if(!p||!relationshipRoles63.includes(p.role)||s.age<18||p.age<18)return p?.romance18;const n=modernDates63(p);if(!p.relationshipBridge63){p.relationshipBridge63=true;if(n){p.romance18??={dates:0,mutual:false,after:0};p.romance18.dates=(p.romance18.dates||0)+n;const lastNative=romanceState18().history.filter(h=>h.id===p.id).at(-1),latest=(s.taskArchive05||[]).filter(t=>t.kind==='meeting53'&&t.state==='completed'&&['Свидание в ресторане','Свидание на прогулке'].some(name=>t.label===name+' · '+p.name)).reduce((tick,t)=>Math.max(tick,t.tick),-Infinity);if(!lastNative||lastNative.outcome==='Взаимная симпатия'||latest>lastNative.tick)p.romance18.mutual=true;}}return p.romance18;}
function relationshipReasons63(p,secret=false){const why=[];if(!p?.alive||s.dead)return ['Сейчас отношения недоступны'];if(!secret&&currentPartner())why.push('У вас уже есть партнёр');if(s.age<18||p.age<18){if(!(s.age>=15&&s.age<18&&p.age>=15&&p.age<18&&teenEligible54(p)))why.push('Подростковые отношения доступны только между подходящими ровесниками от 15 лет');if((p.teen54?.dates||0)<2)why.push('Нужно завершить два свидания');if(!p.teen54?.mutual)why.push('Пока нет взаимной симпатии');return why;}relationshipProgress63(p);if(!relationshipRoles63.includes(p.role))why.push('Для этой связи предложение недоступно');if(!compatible(p))why.push('Нет взаимной романтической совместимости');if(p.married||p.npcMarried54||p.unavailable18)why.push('Человек сейчас недоступен для новых отношений');if(p.rejected)why.push('Раньше человек выбрал остаться знакомыми');if(p.country!==s.country||p.city18&&p.city18!==residenceCity())why.push('Для начала отношений нужны встречи в одном городе');if(p.language18&&level16(p.language18)<3)why.push('Пока не хватает общего языка');if(p.format18==='casual')why.push('Человек ищет общение без отношений');if((p.romance18?.dates||0)<2)why.push('Нужно завершить два свидания · сейчас '+(p.romance18?.dates||0));if(!p.romance18?.mutual)why.push('Пока нет взаимной симпатии');return [...new Set(why)];}
function relationshipMenu63(id){const p=living(id);if(!p)return;if(sideRelationship63(id))return sideRelationshipMenu63(id);const secret=!!currentPartner()&&s.age>=18&&p.age>=18;const why=secret?sideRelationshipReasons63(p):relationshipReasons63(p),teen=s.age<18||p.age<18,r=teen?p.teen54:p.romance18;show('Предложить встречаться · '+p.name,'Завершённых свиданий: '+(r?.dates||0)+'. '+(r?.mutual?'Есть взаимная симпатия.':'Взаимная симпатия пока не сложилась.')+'\n'+(why.length?why.join('. '):'Можно обсудить начало отношений. Брак и совместное жильё остаются отдельными решениями.'),[{label:secret?'Предложить тайные отношения':'Предложить встречаться',hint:why.join('; '),disabled:why.length>0,fn:()=>secret?proposeSideRelationship63(id):proposeRelationship18(id)},{label:'Пригласить на свидание',disabled:teen?!teenEligible54(p):!relationshipRoles63.includes(p.role)||p.country!==s.country||p.city18!==residenceCity(),fn:()=>teen?teenDateMenu54(id):meetingsMenu53(id)}]);}
proposeRelationship18=function(id){const p=living(id);if(currentPartner()&&s.age>=18&&p?.age>=18)return proposeSideRelationship63(id);if(relationshipReasons63(p).length)return false;if(s.age<18||p.age<18)return proposeTeenPair54(id);show('Обсудить отношения · '+p.name,'Симпатия взаимна. Предложить стать парой?',[{label:'Предложить встречаться',fn:()=>acceptRelationship63(id)},{label:'Продолжить знакомство',fn:()=>relationshipMenu63(id)}]);return true;};
const sideRelationshipLimit63=3;
function activeSideRelationships63(){
  return savedSideRelationships63(s.familyLife).filter(link=>living(link.otherId));
}
function sideRelationship63(id){
  return activeSideRelationships63().find(link=>link.otherId===id)||null;
}
function saveSideRelationships63(relationships){
  s.familyLife.sideRelationships63=relationships;
  delete s.familyLife.sideRelationship63;
}
function sideRelationshipReasons63(p){
  if(!currentPartner()||s.age<18||!(p?.age>=18))return ['Тайная связь доступна взрослому персонажу, у которого уже есть партнёр'];
  if(sideRelationship63(p.id))return ['Вы уже встречаетесь'];
  if(activeSideRelationships63().length>=sideRelationshipLimit63)return ['Достигнут лимит: три связи на стороне'];
  return relationshipReasons63(p,true);
}
function proposeSideRelationship63(id){
  const p=living(id);
  if(sideRelationshipReasons63(p).length)return false;
  const partnerId=currentPartner().id;
  show('Тайные отношения · '+p.name,'Симпатия взаимна. Вы можете договориться встречаться тайно. Если партнёр узнаёт, это ударит по доверию.',[
    {label:'Начать тайные отношения',fn:()=>acceptSideRelationship63(id,partnerId)},
    {label:'Продолжить знакомство',fn:()=>relationshipMenu63(id)}
  ]);
  return true;
}
function acceptSideRelationship63(id,partnerId){
  const p=living(id);
  if(sideRelationshipReasons63(p).length||currentPartner()?.id!==partnerId)return false;
  ensureRelations();
  saveSideRelationships63([...activeSideRelationships63(),{partnerId,otherId:id,startedTick:s.clock.ticks,discovered:false}]);
  const pending=s.familyLife.sideDiscoveries63??=[];
  if(!pending.some(item=>item.partnerId===partnerId&&item.otherId===id)){
    pending.push({partnerId,otherId:id,due:s.clock.ticks+3});
  }
  remember(p,'договорились встречаться тайно');
  log('Тайные отношения',p.name+': вы договорились встречаться тайно.','Отношения',true);
  save();render();
  return true;
}
function endSideRelationship63(id){
  if(!sideRelationship63(id))return false;
  const p=living(id);
  saveSideRelationships63(activeSideRelationships63().filter(link=>link.otherId!==id));
  remember(p,'завершили отдельную романтическую связь');
  log('Романтическая связь закончилась',p.name+': вы решили больше не встречаться.','Отношения',true);
  save();render();
  return true;
}
function sideRelationshipMenu63(id){
  const relationship=sideRelationship63(id),p=living(id);
  if(!relationship)return;
  show('Отдельные отношения · '+p.name,relationship.discovered?'Основной партнёр узнал об этой связи.':'Вы продолжаете встречаться.',[
    {label:'Пригласить на свидание',fn:()=>meetingsMenu53(id)},
    {label:'Закончить отношения',fn:()=>show('Расстаться · '+p.name+'?','Это завершит вашу отдельную романтическую связь.',[
      {label:'Закончить отношения',fn:()=>endSideRelationship63(id)},
      {label:'Вернуться',fn:()=>sideRelationshipMenu63(id)}
    ])}
  ]);
}
function relationshipAction63(p){
  if(sideRelationship63(p.id))return {label:'Отдельные отношения',hint:'Вы встречаетесь'};
  if(currentPartner()&&s.age>=18&&p.age>=18)return {label:'Предложить тайные отношения',hint:sideRelationshipReasons63(p).join('; ')||'Есть взаимная симпатия и два свидания'};
  return {label:'Предложить встречаться',hint:relationshipReasons63(p).join('; ')||'Есть взаимная симпатия и два свидания'};
}
function acceptRelationship63(id){const p=living(id);if(relationshipReasons63(p).length)return false;if(s.age<18||p.age<18)return proposeTeenPair54(id);p.role='Партнер';p.partnerSince=s.year;p.cohabit=false;const r=romanceState18();r.search=false;r.format='relationship';r.pool=[];remember(p,'после нескольких встреч договорились быть парой');log('Вы решили быть вместе',p.name+': вы оба согласны начать отношения.','Отношения',true);save();render();return true;}
finishTask=function(t){const p=t.kind==='meeting53'&&living(t.person53),romantic=!!p&&meetingKinds53[t.meeting53]?.romantic&&s.age>=18&&p.age>=18,wasLive=!['completed','cancelled','paused'].includes(t.state);if(romantic)relationshipProgress63(p);const result=romanceBase63.finishTask(t);if(romantic&&wasLive&&t.state==='completed'&&p.alive){p.romance18??={dates:0,mutual:false,after:0};p.romance18.dates=(p.romance18.dates||0)+1;p.romance18.mutual=true;p.romance18.after=Math.max(p.romance18.after||0,s.clock.ticks+1);p.relationshipBridge63=true;save();}return result;};
function relationshipContact63(p){return !!p?.alive&&(s.age>=18&&p.age>=18&&relationshipRoles63.includes(p.role)||s.age>=15&&s.age<18&&p.age>=15&&p.age<18&&p.role!=='Партнер'&&teenEligible54(p));}
personDetail=function(id){const p=living(id);if(p)relationshipProgress63(p);romanceBase63.personDetail(id);if(relationshipContact63(p)){const action=relationshipAction63(p);$('#modal').innerHTML+='<button class="relationship-button63" onclick="relationshipMenu63(\''+esc(id)+'\')"><strong>'+esc(action.label)+'</strong><small>'+esc(action.hint)+'</small></button>';}};
meetingsMenu53=function(id){const p=living(id);if(s.age<18||p?.age<18||!relationshipContact63(p))return romanceBase63.meetingsMenu53(id);const old=show;show=function(title,text,opts,...rest){return old(title,text,[{...relationshipAction63(p),fn:()=>relationshipMenu63(id)},...opts],...rest);};try{return romanceBase63.meetingsMenu53(id);}finally{show=old;}};
romanceSearch18=function(){for(const p of s.people)relationshipProgress63(p);return romanceBase63.romanceSearch18();};
function relationshipsMenu63(){show('Предложить встречаться','Выберите знакомого. Готовность и причины видны в карточке; общение и свидания не начинают отношения автоматически.',s.people.filter(relationshipContact63).map(p=>({label:p.name,hint:relationshipAction63(p).hint,fn:()=>relationshipMenu63(p.id)})));}
romanceMenu=function(){const old=show;show=function(title,text,opts,...rest){return old(title,text,[{label:'Предложить встречаться знакомому',fn:relationshipsMenu63},...opts],...rest);};try{return romanceBase63.romanceMenu();}finally{show=old;}};
actionCatalog24=function(){return [...romanceBase63.actionCatalog24(),{id:'relationship63',group:'Люди',label:'Предложить встречаться',keywords:'пара отношения взаимная симпатия знакомый друг',reason:s.age<15?'С 15 лет':'',fn:relationshipsMenu63}];};
