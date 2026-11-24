'use strict';
// Explicit v32 adapters. Editorial numeric ranges and disabled chain edges are never executed.
const catalogBase245={autonomousMonth,decisionRecord24,decisionActive24,decisionItems24,openDecision24,finishTask};
function catalogState245(){return s.catalog245??={revision:32,lastMonth:-1,serial:0,events:[],cooldowns:{},skills:{},frequency:'normal'};}
function catalogAvailable245(){return !s.dead&&s.age>=6&&!travelActive52()&&!courtCustody94();}
function catalogFriend245(p){return p?.alive&&p.role==='Друг'&&!p.social17?.inactive&&p.country===s.country&&(!p.city18||p.city18===residenceCity());}
function catalogPet245(id){const p=s.pets.find(p=>p.id===id);return p?.alive&&petAtHome183(p)?p:null;}
function catalogValid245(q){
 if(!catalogAvailable245()||q.country!==s.country||q.city!==residenceCity())return false;
 if(q.event==='E0081')return !!catalogPet245(q.pet);
 if(q.event==='E0091')return catalogFriend245(living(q.person));
 if(q.event==='E0034')return !!s.hobbies[q.hobby]&&(s.hobbies[q.hobby].skill||0)>=q.skill;
 return false;
}
function catalogOffer245(event,binding){
 const f=catalogState245(),e=catalog245.events.find(e=>e.id===event),now=s.clock.ticks;
 if(!e||!catalogAvailable245()||f.events.some(q=>q.status==='offered')||now-(f.cooldowns[event]??-100)<e.cooldown)return null;
 const q={id:'catalog245-'+(++f.serial),event,status:'offered',tick:now,expires:now+1,country:s.country,city:residenceCity(),...binding};
 if(!catalogValid245(q))return null;
 f.events.push(q);f.cooldowns[event]=now;s.clock.running=false;
 log(e.title,e.text,'События',false,{kind:'catalog245',id:q.id});return q;
}
function catalogActive245(q){return !!q&&q.status==='offered'&&s.clock.ticks<q.expires&&catalogValid245(q);}
function catalogChoice245(id,choice){
 const q=catalogState245().events.find(q=>q.id===id),e=catalog245.events.find(e=>e.id===q?.event),c=e?.choices.find(c=>c.id===choice);
 if(!catalogActive245(q)||!c)return false;
 const action=Number(choice.slice(-2));
 if(q.event==='E0034'&&action===2&&!catalogFriend245(living(q.person)))return false;
 if(q.event==='E0081'&&action===2&&(capacity()-totalHours()<1||s.clock.tasks.some(t=>t.kind==='petCare38'&&t.petId===q.pet)))return false;
 if(q.event==='E0091'&&action<=2&&capacity()-totalHours()<2)return false;
 // One committed choice per instance, persisted before a result can be replayed.
 q.choice=choice;q.status='resolved';q.committed=s.clock.ticks;
 const primary=chance(c.outcomes[0].p),o=c.outcomes[primary?0:1];q.outcome=o.id;
 if(q.event==='E0034'){
  const h=s.hobbies[q.hobby];h.milestones245??=[];h.milestones245.push({tick:s.clock.ticks,skill:q.skill,shared:action===2,outcome:o.id});
  if(action===2)remember(living(q.person),'Обсудили прогресс в занятиях: '+(hobbies[q.hobby]?.[0]||q.hobby));
 }else if(q.event==='E0081'){
  const p=catalogPet245(q.pet);p.notes??=[];
  p.notes.push('После занятий получилось выполнить команду; навык ещё требует повторения.');
  if(action===1)p.bond=clamp(p.bond+1);
  else if(primary){q.status='scheduled';q.due=s.clock.ticks+1;q.hours=1;}
 }else if(q.event==='E0091'){
  const p=living(q.person);
  if(action===1&&primary){q.status='scheduled';q.due=s.clock.ticks+1;q.hours=2;}
  else if(action===2&&primary){q.status='scheduled';q.due=s.clock.ticks+2;q.hours=2;}
  else if(action===3){if(!primary)p.bond=clamp(p.bond-2);remember(p,'Не получилось договориться о помощи с переездом.');}
 }
 log(e.title,o.text,'События');save();render();return true;
}
function catalogResolve245(q){
 if(q.status!=='scheduled'||q.due>s.clock.ticks)return;
 q.status='resolved';q.finished=s.clock.ticks;
 if(!catalogValid245(q)||s.clock.fatigue>90){q.status='cancelled';log('Планы изменились','Запланированное занятие или помощь не состоялись: обстоятельства изменились.','События');return;}
 if(q.event==='E0081'){
  const p=catalogPet245(q.pet);p.training38=(p.training38||0)+1;p.bond=clamp(p.bond+2);s.clock.fatigue=clamp(s.clock.fatigue+1);
  log('Закрепление команды',p.name+': дополнительное занятие состоялось. Повторения помогли закрепить навык.','Животное');
 }else if(q.event==='E0091'){
  const p=living(q.person);p.bond=clamp(p.bond+3);s.clock.fatigue=clamp(s.clock.fatigue+2);remember(p,'Помощь с коробками во время переезда.');
  log('Помощь с переездом',p.name+': удалось разобрать и перенести коробки. Друг благодарит за помощь.','Отношения');
 }
}
function catalogMonth245(){
 const f=catalogState245(),tick=s.clock.ticks;if(f.lastMonth===tick)return;f.lastMonth=tick;
 for(const q of f.events){if(q.status==='offered'&&!catalogActive245(q))q.status='expired';catalogResolve245(q);}
 const gains=[];for(const [key,h] of Object.entries(s.hobbies||{})){const prior=f.skills[key];if(prior!==undefined&&(h.skill||0)>prior)gains.push(key);f.skills[key]=h.skill||0;}
 if(!catalogAvailable245())return;
 const scale={rare:.55,normal:1,frequent:1.65}[f.frequency]||1;
 const friend=s.people.find(catalogFriend245);
 if(gains.length&&chance(.035*scale))catalogOffer245('E0034',{hobby:gains[0],skill:s.hobbies[gains[0]].skill,person:friend?.id});
 if(friend&&s.age>=16&&chance(.045*scale))catalogOffer245('E0091',{person:friend.id});
 // Keep audit records bounded, preserving unresolved operations.
 if(f.events.length>120)f.events=f.events.filter(q=>['offered','scheduled'].includes(q.status)||tick-q.tick<120);
}
finishTask=function(t){
 const p=t.kind==='petCare38'&&t.care==='train'?catalogPet245(t.petId):null,prior=p?.training38||0;
 const result=catalogBase245.finishTask(t);
 if(p&&(p.training38||0)>prior&&chance(.35))catalogOffer245('E0081',{pet:p.id,training:p.training38});
 return result;
};
const catalogHours245=totalHours;
totalHours=function(){return catalogHours245()+((s?.catalog245?.events)||[]).filter(q=>q.status==='scheduled'&&q.due>=s.clock.ticks).reduce((n,q)=>n+(q.hours||0),0);};

// Club attendance and programmes use canonical membership IDs and real completed sessions.
function clubKind245(m){if(m.type==='debate67')return null;const cfg=clubsCatalog19[m.type];return cfg?.hobby==='literature'||cfg?.reading53?'book':cfg?.hobby==='theatre'?'play':null;}
function clubMode245(m){return m.programMode245||'important_only';}
function clubParticipation245(m){
 if(!clubKind245(m))return true;
 const mode=clubMode245(m);return !['ask','manual'].includes(mode)||(m.approvedThrough245??-1)>=s.clock.ticks;
}
function clubPool245(m){
 const kind=clubKind245(m),country=countries[m.country]?.name;
 return (kind==='book'?catalog245.books:catalog245.plays).filter(w=>w.minAge<=s.age&&(s.age>=14||w.children||kind==='play')&&(w.country==='Любая'||w.country===country));
}
function clubWork245(m){return [...catalog245.books,...catalog245.plays].find(w=>w.id===m.program245?.work);}
function clubChooseWork245(m){
 const pool=clubPool245(m),used=new Set((m.programHistory245||[]).map(p=>p.work)),fresh=pool.filter(w=>!used.has(w.id));
 const work=pick(fresh.length?fresh:pool);if(!work)return;
 m.program245={work:work.id,progress:0,started:s.clock.ticks,role:clubKind245(m)==='play'&&clubMode245(m)==='auto'&&work.roles.length?pick(work.roles):null};
 if(clubKind245(m)==='play'&&clubMode245(m)==='important_only'&&work.roles.length)s.clock.running=false;
 log(clubKind245(m)==='book'?'Книга клуба':'Новая постановка',work.author+' · «'+work.title+'». '+work.summary,'Занятия');
}
function clubProgramMonth245(m){
 if(!clubKind245(m))return false;
 if(!m.program245)clubChooseWork245(m);
 const p=m.program245,w=clubWork245(m);if(!w)return false;if(p.lastTick===s.clock.ticks)return true;
 p.lastTick=s.clock.ticks;p.progress++;
 const play=clubKind245(m)==='play',target=play?4:2;
 const stage=play?['Читка','Разбор сцен','Репетиция','Показ'][p.progress-1]:['Чтение и первые впечатления','Обсуждение книги'][p.progress-1];
 log(stage+' · «'+w.title+'»',w.author+'. '+(p.progress===1?w.summary:play&&p.role?'Ваша роль: '+p.role+'.':'Участники клуба обсуждают работу.') ,'Занятия');
 if(p.progress>=target){m.programHistory245??=[];m.programHistory245.push({...p,finished:s.clock.ticks});if(m.programHistory245.length>80)m.programHistory245.shift();m.program245=null;}
 return true;
}
function clubApprove245(id){
 const m=clubState19().memberships.find(m=>m.id===id);
 if(!m||s.dead||m.status!=='active'||!clubLocal19(m)||!clubLanguage19(m)||!clubAge23(m.type))return false;
 m.approvedThrough245=s.clock.ticks+1;save();render();return true;
}
function clubSettings245(id){
 const m=clubState19().memberships.find(m=>m.id===id);if(!m)return;
 const modes=[['auto','Всегда автоматически'],['important_only','Автоматически, кроме важных решений'],['ask','Спрашивать каждый месяц'],['manual','Только вручную']];
 show('Участие в клубе','Обычные встречи дают практику и продвигают программу. Роль в спектакле выбирается отдельно. В ручном режиме и при ожидании ответа посещений и взноса нет.',modes.map(([mode,label])=>({label:(clubMode245(m)===mode?'✓ ':'')+label,fn:()=>{m.programMode245=mode;delete m.approvedThrough245;save();clubSettings245(id);}})),{title:clubsCatalog19[m.type].name,open:()=>clubDetail19(id)});
}
function clubProgramMenu245(id){
 const m=clubState19().memberships.find(m=>m.id===id);if(!m)return;
 const active=!s.dead&&m.status==='active'&&clubLocal19(m)&&clubLanguage19(m)&&clubAge23(m.type),w=clubWork245(m),p=m.program245;
 const history=(m.programHistory245||[]).slice(-5).reverse().map(p=>[...catalog245.books,...catalog245.plays].find(w=>w.id===p.work)?.title).filter(Boolean);
 show(w?w.title:'Программа клуба',w?w.author+'\n'+w.summary+'\nЗавершено месяцев: '+p.progress+(p.role?'\nВаша роль: '+p.role:''):'Следующее произведение будет выбрано на занятии. '+(history.length?'Недавние работы: '+history.join('; ')+'.':''),[
  ...(['ask','manual'].includes(clubMode245(m))?[{label:'Участвовать в следующем месяце',disabled:!active||(m.approvedThrough245??-1)>s.clock.ticks,fn:()=>{clubApprove245(id);clubProgramMenu245(id);}}]:[]),
  ...(w?.roles?.length&&p.progress<3?[{label:p.role?'Изменить роль':'Выбрать роль для репетиции',disabled:!active,fn:()=>clubRoles245(id)}]:[]),
  {label:'Настройки участия',fn:()=>clubSettings245(id)}
 ],{title:clubsCatalog19[m.type].name,open:()=>clubDetail19(id)});
}
function clubRoles245(id){
 const m=clubState19().memberships.find(m=>m.id===id),w=m&&clubWork245(m);if(!w?.roles?.length)return;
 const work=w.id;
 show('Роль · '+w.title,'Можно выбрать роль для работы на занятиях или участвовать в читке без закреплённой роли.',w.roles.map(role=>({label:role,fn:()=>{if(m.status!=='active'||!clubLocal19(m)||m.program245?.work!==work||m.program245.progress>=3)return;m.program245.role=role;save();clubProgramMenu245(id);}})).concat([{label:'Участвовать без закреплённой роли',fn:()=>{if(m.program245?.work!==work)return;m.program245.role=null;m.program245.roleDeclined=true;save();clubProgramMenu245(id);}}]),{title:w.title,open:()=>clubProgramMenu245(id)});
}
function catalogMenu245(){
 show('Частота новых событий','Частота бытовых событий из нового каталога. Она не меняет риск тяжёлых событий или старые сюжетные линии.',['rare','normal','frequent'].map((mode,i)=>({label:(catalogState245().frequency===mode?'✓ ':'')+['Реже','Обычно','Чаще'][i],fn:()=>{catalogState245().frequency=mode;save();catalogMenu245();}})));
}
autonomousMonth=function(){catalogBase245.autonomousMonth();catalogMonth245();};
decisionRecord24=function(ref){if(ref?.kind==='catalog245')return s.catalog245?.events.find(q=>q.id===ref.id)||null;if(ref?.kind==='club245')return clubState19().memberships.find(m=>m.id===ref.id)||null;return catalogBase245.decisionRecord24(ref);};
decisionActive24=function(ref){
 if(ref?.kind==='catalog245')return catalogActive245(decisionRecord24(ref));
 if(ref?.kind==='club245'){const m=decisionRecord24(ref);return !!m&&catalogAvailable245()&&clubKind245(m)&&m.status==='active'&&clubLocal19(m)&&clubLanguage19(m)&&clubAge23(m.type)&&((clubMode245(m)==='ask'&&(m.approvedThrough245??-1)<=s.clock.ticks)||(clubMode245(m)==='important_only'&&clubKind245(m)==='play'&&m.program245&&m.program245.progress<3&&!m.program245.role&&!m.program245.roleDeclined));}
 return catalogBase245.decisionActive24(ref);
};
decisionItems24=function(){
 const items=catalogBase245.decisionItems24();
 for(const q of s.catalog245?.events||[]){const ref={kind:'catalog245',id:q.id};if(catalogActive245(q)&&(s.notices59?.snoozed['catalog245:'+q.id]??-1)<=s.clock.ticks)items.push({q,ref,title:catalog245.events.find(e=>e.id===q.event).title,note:q.city,expires:q.expires});}
 for(const m of clubState19().memberships){const ref={kind:'club245',id:m.id};if(decisionActive24(ref)&&(s.notices59?.snoozed['club245:'+m.id]??-1)<=s.clock.ticks)items.push({q:m,ref,title:(clubMode245(m)==='important_only'?'Роль в постановке · ':'Следующий месяц · ')+clubsCatalog19[m.type].name,note:m.city,expires:s.clock.ticks+1});}
 return items;
};
openDecision24=function(kind,id){
 if(kind==='club245')return clubProgramMenu245(id);
 if(kind!=='catalog245')return catalogBase245.openDecision24(kind,id);
 const q=decisionRecord24({kind,id});if(!catalogActive245(q))return toast('Ситуация уже закрыта или обстоятельства изменились.');
 const e=catalog245.events.find(e=>e.id===q.event),name=q.pet?catalogPet245(q.pet)?.name:q.person?living(q.person)?.name:hobbies[q.hobby]?.[0];
 show(e.title,(name?name+'\n':'')+e.text,e.choices.map(c=>({label:c.title,disabled:(q.event==='E0034'&&c.id.endsWith('02')&&!catalogFriend245(living(q.person)))||(q.event==='E0081'&&c.id.endsWith('02')&&(capacity()-totalHours()<1||s.clock.tasks.some(t=>t.kind==='petCare38'&&t.petId===q.pet)))||(q.event==='E0091'&&!c.id.endsWith('03')&&capacity()-totalHours()<2),fn:()=>catalogChoice245(id,c.id)})));
};
