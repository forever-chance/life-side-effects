'use strict';
// Сборка 270: уведомления и возраст.
// 1. «×» в панели «Ожидают ответа» прячет пункт на 3 месяца и действует на все пункты, в том числе на те, что
//    добавлены обёртками позже quick-dismiss59.js (восстановление, имя ребёнка, события своего дела, аренда).
//    Где генератор пересоздаёт запись с новым id, отсрочка привязана к теме: человек, счета, событие, хозяин поездки.
//    Для просьбы о помощи пожилому близкому, помощи родителей на жизнь и местных событий «×» — это отказ.
// 2. Ребёнок не получает просьб об уходе за пожилыми: до 16 лет помощь берёт на себя взрослый родственник,
//    в 16–17 — одно уведомление и необязательная лёгкая помощь, с 18 — как раньше, но с «Не сейчас».
// 3. Наследство несовершеннолетнего принимает опекун; деньги и доли ждут 18 лет, отказа за ребёнка нет.
// 4. Помощь родителей на жизнь: «Справлюсь сам» — повтор не раньше чем через год.
// 5. Старые счета: «×» откладывает на 3 месяца, окно после отсрочки само не открывается, автоигра не останавливается.
// 6. До 12 лет лечение выбирают родители, поездка родителей — семейная, без виз, дороги и питомцев.
// 7. Возрастные причины в «Найти действие», тексты: «Тяжесть в игровой модели», «от тебя потребуется».
const notices270Base={decisionItems24,quickDismiss59,dismissKind59,quickCard59,elderCareMonth58,elderCareAvailable58,elderMenu58,
 schedule23,prepareEstate58,respondEstate58,estatesMonth58,estateCaseMenu58,livingOffer68,livingMenu68,checkBills61,
 travelInviteMenu53,offerTravel53,healthMenu,autonomousMonth,incidentMenu56,actionCatalog24};
const snoozeMonths270=3;

// ---------- 1. Отсрочка и отказ из панели ----------
function topic270(ref,q){
 const k=ref?.kind;
 if(k==='elder58')return q?.person?'elder58:'+q.person:null;
 if(k==='life61')return q?.type==='bills'?'life61:bills':null;
 if(k==='local99')return q?.title?'local99:'+(q.country||'')+':'+q.title:null;
 if(k==='tripInvite53')return q?.host?'tripInvite53:'+q.host:null;
 if(k==='health58'||k==='recovery86'){
  if(ref.id==='illness')return 'health:illness:'+(s.lastIllnessTick??s.illness?.name??'');
  if(ref.id==='injury')return 'health:injury:'+((typeof incidents56==='function'&&incidents56().injury?.id)||'');
 }
 return null;
}
function snoozed270(ref,q){
 const z=s?.notices59?.snoozed;if(!z)return false;
 const t=s.clock.ticks,topic=topic270(ref,q);
 return (z[ref.kind+':'+ref.id]??-1)>t||!!topic&&(z[topic]??-1)>t;
}
function pruneSnoozed270(){
 const z=s?.notices59?.snoozed;if(!z||!s.clock)return;
 for(const k of Object.keys(z))if(!(z[k]>s.clock.ticks))delete z[k];
}
function familyTripInvite270(q){return !!q&&s.age<12&&q.status==='offered'&&['Мать','Отец'].includes(living(q.host)?.role);}
decisionItems24=function(){
 const all=notices270Base.decisionItems24();
 if(!s||s.dead)return all;
 const health=new Map(all.filter(i=>i.ref.kind==='health58').map(i=>[i.ref.id,i])),out=[];
 for(let i of all){
  const k=i.ref.kind;
  // 270: одна карточка на болезнь или травму — срок восстановления переносится в карточку здоровья.
  if(k==='recovery86'&&health.has(i.ref.id)){
   const h=health.get(i.ref.id),left=String(i.q?.note||i.note||'');
   if(left&&!/ещё \d/.test(h.note))h.note=h.note.replace(/ · восстановление продолжается$/,'')+' · '+left.charAt(0).toLowerCase()+left.slice(1);
   continue;
  }
  if(snoozed270(i.ref,i.q))continue;
  if(k==='elder58'&&!elderRequestVisible270(i.q))continue;
  if(k==='estate58'&&s.age<18)continue;
  if(k==='tripInvite53'&&familyTripInvite270(i.q))i={...i,title:'Семейная поездка · '+i.q.draft.city,note:'Поехать с семьёй или остаться дома'};
  out.push(i);
 }
 return out;
};
dismissKind59=function(ref){
 const mode=notices270Base.dismissKind59(ref);
 if(!mode)return mode;
 return ['elder58','living68','local99'].includes(ref?.kind)?'decline':mode;
};
function dismissLabel270(ref,mode){
 const q=decisionRecord24(ref);
 if(ref.kind==='elder58')return q?.teen270?'Прочитано':'Не сейчас';
 if(ref.kind==='living68')return 'Справлюсь сам';
 if(ref.kind==='local99')return 'Пропустить';
 if(ref.kind==='tripInvite53'&&familyTripInvite270(q))return 'Остаться дома';
 if(mode==='decline')return 'Отказаться';
 if(ref.kind==='life61'&&q&&!['bills','bookReady'].includes(q.type))return 'Убрать из списка';
 return 'Скрыть на 3 месяца';
}
quickCard59=function(i){
 const html=notices270Base.quickCard59(i),mode=dismissKind59(i.ref);
 if(!mode)return html;
 const old=mode==='decline'?'Отказаться':'Напомнить в следующем месяце',label=esc(dismissLabel270(i.ref,mode));
 return html.replace('aria-label="'+old+':','aria-label="'+label+':').replace('title="'+old+'"','title="'+label+'"');
};
quickDismiss59=function(kind,id){
 const ref={kind,id},mode=dismissKind59(ref);
 if(!mode||!s||s.dead)return false;
 const q=decisionRecord24(ref),t=s.clock.ticks,topic=topic270(ref,q);
 if(kind==='elder58')return declineElder270(q?.person,q);
 if(kind==='living68')return declineLiving270();
 if(kind==='local99'){const ok=localChoice99(id,'skip');if(ok)render();return ok;}
 if(kind==='life61'&&q?.type==='bills')return postponeBills270(q);
 if(kind==='tripInvite53'&&familyTripInvite270(q))return familyTripStay270(id);
 const ok=notices270Base.quickDismiss59(kind,id);
 if(!ok)return ok;
 const z=notices59().snoozed;
 if(mode==='snooze'){
  if(topic&&(kind==='health58'||kind==='recovery86'))delete z[kind+':'+id];
  else z[kind+':'+id]=t+snoozeMonths270;
 }
 if(topic)z[topic]=t+snoozeMonths270;
 pruneSnoozed270();save();render();return ok;
};

// ---------- 2. Уход за пожилыми и возраст игрока ----------
function elderRequestVisible270(q){
 if(!q)return false;
 if(s.age<16)return false;
 if(s.age<18)return !!q.teen270;
 return true;
}
function elderCareLoad270(id){
 return s.people.filter(x=>x.alive&&x.aging58?.care?.status==='active'&&x.aging58.care.helper===id).reduce((n,x)=>n+(x.aging58.care.hours||0),0);
}
function elderFamilyHelper270(p){
 const strict=elderHelpers58(p);
 const pool=strict.length?strict:s.people.filter(q=>q.alive&&q.id!==p.id&&q.age>=18&&q.age<80&&kin27(q)&&!q.aging58?.need&&q.country===p.country);
 const rank=q=>(['Мать','Отец'].includes(q.role)?0:(p.bio27?.children||[]).includes(q.id)||(q.bio27?.parents||[]).includes(p.id)?1:2);
 return pool.sort((a,b)=>rank(a)-rank(b)||elderCareLoad270(a.id)-elderCareLoad270(b.id))[0]||null;
}
function familyCare270(p,a){
 if(!a.need||!p.alive)return null;
 const t=s.clock.ticks,care=a.care;
 if(care?.status==='active'&&care.family270){
  if(care.mode==='relative'&&elderCareAvailable58(p,care)){care.until=t+6;care.hours=a.need;return care;}
  if(care.mode==='serviceSelf')return care;
 }
 if(care?.status==='active'&&!care.family270)return care;
 const helper=elderFamilyHelper270(p),fee=elderCareFee58(p),base={hours:a.need,fee,country:p.country,city:p.city18||cities[p.country][0],status:'active',until:t+6,lastPaid:-1,family270:true};
 if(helper){
  a.care={mode:'relative',helper:helper.id,...base};
  ageNote58(p,'Помощь в быту взяла на себя семья: '+helper.name+'.');
  return a.care;
 }
 if((p.privateCash||0)>=fee){
  a.care={mode:'serviceSelf',helper:null,...base};
  ageNote58(p,'Помощника в быту наняли за собственные средства.');
  return a.care;
 }
 return null;
}
elderCareAvailable58=function(p,care){
 if(care===undefined)care=agingPerson58(p).care;
 if(care?.family270&&care.mode==='relative'&&care.status==='active'){
  const h=living(care.helper);
  return !!(p.alive&&h&&h.age>=18&&!h.aging58?.need&&care.until>=s.clock.ticks);
 }
 return notices270Base.elderCareAvailable58(p,care);
};
function lightHelpActive270(p){
 const l=p.aging58?.light270;
 return !!(l&&p.alive&&!s.dead&&s.age>=16&&agingPerson58(p).need&&elderLocal58(p)&&travelActive52()?.status!=='away');
}
function lightHours270(){return s.people.filter(p=>p.aging58?.light270&&lightHelpActive270(p)).length*2;}
elderCareMonth58=function(p){
 const t=s.clock.ticks,a=updateAging58(p),z=generations58(),minor=s.age<18&&!s.dead;
 if(minor){
  familyCare270(p,a);
  for(const q of z.requests)if(q.person===p.id&&q.status==='offered'&&!q.teen270)q.status='expired';
 }
 // Не больше одной новой просьбы в месяц: бабушки и дедушки не просят хором каждые 12 месяцев.
 const block=minor||z.lastNew270===t,last=a.lastRequest,count=z.requests.length;
 if(block)a.lastRequest=t;
 try{notices270Base.elderCareMonth58(p);}finally{if(block)a.lastRequest=last;}
 if(z.requests.length>count){z.lastNew270=t;a.lastRequest=t+Math.floor(Math.random()*4);}
 if(s.age>=16&&s.age<18&&!s.dead)teenElderNotice270(p,a);
 if(a.light270&&lightHelpActive270(p)){
  const before=a.uncovered;a.uncovered=Math.max(0,before-2);
  if(before>=5&&a.uncovered<5&&p.bio27)p.bio27.health=Math.min(100,p.bio27.health+.08);
  if(t%3===0)rel(p,{trust:1});
 }
};
function teenElderNotice270(p,a){
 if(!a.need||a.teenNotice270!=null||!(kin27(p)||p.bond>=50))return null;
 const t=s.clock.ticks,care=a.care,helper=care?.status==='active'&&care.mode==='relative'?living(care.helper):null;
 a.teenNotice270=t;
 const q={id:id16('elder-request'),person:p.id,status:'offered',created:t,expires:t+6,title:p.name+': нужна помощь в быту',teen270:true};
 generations58().requests.push(q);
 log(q.title,(helper?'Основную помощь взяла на себя семья: '+helper.name+'. ':care?.status==='active'?'Помощника уже нашли. ':'Взрослые ищут, кто будет помогать. ')+'Можно навещать и помогать по мелочи — 2 ч/нед.','Семья',true,{kind:'elder58',id:q.id});
 return q;
}
function declineElder270(person,q=null){
 const p=living(person);if(!p)return false;
 const t=s.clock.ticks,list=generations58().requests.filter(r=>r.person===person&&r.status==='offered');
 if(!list.length)return false;
 for(const r of list){r.status=r.teen270?'read':'declined';r.decided270=t;}
 if(!list.some(r=>r.teen270)){
  agingPerson58(p).lastRequest=t;
  notices59().snoozed['elder58:'+person]=t+12;
 }
 save();render();return true;
}
function setLightHelp270(id,on){
 const p=living(id);if(!p||s.dead||s.age<16)return false;
 const a=agingPerson58(p);
 if(on){
  if(!a.need||!elderLocal58(p)||capacity()-totalHours()<2)return false;
  a.light270={since:s.clock.ticks};
  ageNote58(p,'Вы навещаете и помогаете по мелочи: 2 ч/нед.');
 }else{a.light270=null;ageNote58(p,'Вы больше не навещаете регулярно.');}
 for(const q of generations58().requests)if(q.person===p.id&&q.status==='offered'&&q.teen270)q.status='read';
 save();render();return true;
}
schedule23=function(){
 const q=notices270Base.schedule23();
 const h=s?.people?lightHours270():0;
 if(h){q.elder58=(q.elder58||0)+h;q.care+=h;q.total+=h;}
 return q;
};
elderMenu58=function(id){
 const p=living(id);if(!p)return notices270Base.elderMenu58(id);
 const a=updateAging58(p),old=show,offered=generations58().requests.filter(q=>q.person===id&&q.status==='offered');
 show=function(title,text,opts,...rest){
  let list=opts,note=text;
  const tail=list.length&&list.at(-1).label==='Семья и поколения'?list.slice(-1):[];
  const head=tail.length?list.slice(0,-1):list;
  if(s.age<18){
   const care=a.care?.status==='active'?a.care:null,helper=care?.mode==='relative'?living(care.helper):null;
   note=(a.need?(helper?'Основную помощь взяла на себя семья: '+helper.name+'.':care?'Помощника уже нашли.':'Взрослые ищут, кто будет помогать.'):'Помощь в быту не нужна.')+(text?'\n'+text:'');
   const extra=[];
   if(a.need&&s.age>=16)extra.push(a.light270
    ?{label:'Перестать навещать',fn:()=>setLightHelp270(id,false)}
    :{label:'Навещать и помогать по мелочи · 2 ч/нед.',hint:'Без денег и договоров · доверие растёт',disabled:!elderLocal58(p)||capacity()-totalHours()<2,fn:()=>setLightHelp270(id,true)});
   if(offered.some(q=>q.teen270))extra.push({label:'Прочитано',fn:()=>declineElder270(id)});
   list=[...extra,...tail];
  }else{
   const extra=[];
   if(a.light270)extra.push({label:'Перестать навещать',fn:()=>setLightHelp270(id,false)});
   if(offered.some(q=>!q.teen270))extra.push({label:'Не сейчас',hint:'Следующая просьба — не раньше чем через 12 мес.',fn:()=>declineElder270(id)});
   list=[...head,...extra,...tail];
  }
  return old(title,note,list,...rest);
 };
 try{return notices270Base.elderMenu58(id);}finally{show=old;}
};

// ---------- 3. Наследство несовершеннолетнего ----------
const guardianWord270={Мать:'мама',Отец:'папа',Бабушка:'бабушка',Дедушка:'дедушка',Тетя:'тётя',Тётя:'тётя',Дядя:'дядя',Брат:'брат',Сестра:'сестра'};
function estateGuardian270(q){
 const adults=s.people.filter(p=>p.alive&&p.age>=18&&p.id!==q.person);
 return adults.find(p=>['Мать','Отец'].includes(p.role))||adults.filter(kin27).sort((a,b)=>(b.bond||0)-(a.bond||0))[0]||null;
}
function holdEstate270(q){
 const h=q?.heirs.find(h=>h.person==='player'&&h.status==='pending');
 if(!h)return false;
 const g=estateGuardian270(q),cash=(q.distributable??q.cash??0)*h.share;
 Object.assign(h,{status:'accepted',held270:true,guardian270:g?.id||null,cash,heldAt270:s.clock.ticks});
 const who=g?(guardianWord270[g.role]||'опекун')+' — '+g.name:'опекун';
 log('Наследство · '+q.name,'Ваша доля — '+Math.round(h.share*100)+'%. До 18 лет её хранит '+who+': '+money(localAmount16(cash,q.country))+' и доли имущества перейдут к вам в день совершеннолетия.','Семья',true);
 return true;
}
function releaseEstates270(){
 if(!s?.estates58||s.dead||s.age<18)return 0;
 let n=0;
 for(const q of estates58().cases)for(const h of q.heirs){
  if(h.person!=='player'||!h.held270||h.released270!=null)continue;
  h.status='pending';
  const ok=claimEstate58(q,h);
  h.released270=s.clock.ticks;
  if(!ok){h.status='accepted';continue;}
  n++;
  log('Наследство перешло к вам',q.name+': '+money(localAmount16(h.cash,q.country))+' и ваши доли имущества. До 18 лет их хранил опекун.','Имущество',true);
 }
 if(n){save();render();}
 return n;
}
prepareEstate58=function(q){
 if(s.dead||s.age>=18||q.status!=='preparing'||s.clock.ticks<q.ready)return notices270Base.prepareEstate58(q);
 const heirs=heirs58(q.person);
 if(!heirs.some(h=>h.person==='player'))return notices270Base.prepareEstate58(q);
 settleEstateDebts58(q);
 q.heirs=heirs.map(h=>({...h,status:'pending'}));
 q.status='ready';
 for(const h of q.heirs.filter(h=>h.person!=='player'))claimEstate58(q,h);
 holdEstate270(q);
 finishEstate58(q);
};
respondEstate58=function(id,accept){
 if(s&&!s.dead&&s.age<18){
  const q=estates58().cases.find(q=>q.id===id);
  if(!q||q.status!=='ready'||!holdEstate270(q))return false;
  finishEstate58(q);save();render();return true;
 }
 return notices270Base.respondEstate58(id,accept);
};
estatesMonth58=function(){
 if(s&&!s.dead&&s.age<18&&s.estates58)
  for(const q of estates58().cases)if(q.status==='ready'&&q.heirs.some(h=>h.person==='player'&&h.status==='pending')){holdEstate270(q);finishEstate58(q);}
 const r=notices270Base.estatesMonth58();
 releaseEstates270();
 return r;
};
estateCaseMenu58=function(id){
 const q=estates58().cases.find(q=>q.id===id),h=q?.heirs.find(h=>h.person==='player'),old=show;
 show=function(title,text,opts,...rest){
  for(const sec of nextDetail20?.sections||[])if(/^Игровой порядок: /.test(sec.note||''))sec.note=sec.note.replace(/^Игровой порядок: /,'Порядок наследования: ');
  let list=opts,note=text;
  if(s.age<18||h?.held270&&h.released270==null){
   list=opts.filter(o=>!/^(Принять свою долю|Отказаться от своей доли)$/.test(o.label));
   const g=h?.guardian270&&living(h.guardian270);
   if(h)note=(text?text+'\n':'')+'Вашу долю хранит '+(g?(guardianWord270[g.role]||'опекун')+' — '+g.name:'опекун')+'. Деньги и доли имущества перейдут к вам в 18 лет.';
  }
  return old(title,note,list,...rest);
 };
 try{return notices270Base.estateCaseMenu58(id);}finally{show=old;}
};

// ---------- 4. Помощь родителей на жизнь ----------
livingOffer68=function(){
 const z=students68();
 if(z.offer?.status==='declined'&&z.offer.declined270!=null&&s.clock.ticks-z.offer.declined270>=12)z.offer=null;
 return notices270Base.livingOffer68();
};
function declineLiving270(){
 const q=livingOffer68();if(!q)return false;
 q.status='declined';q.declined270=s.clock.ticks;
 save();render();return true;
}
livingMenu68=function(){
 const old=show,q=livingOffer68();
 show=function(title,text,opts,...rest){
  const list=q?[...opts.slice(0,1),{label:'Справлюсь сам',hint:'Предложение вернётся не раньше чем через 12 мес.',fn:declineLiving270},...opts.slice(1)]:opts;
  return old(title,text,list,...rest);
 };
 try{return notices270Base.livingMenu68();}finally{show=old;}
};

// ---------- 5. Старые счета ----------
function postponeBills270(q){
 q.status='later';
 const z=life61(),t=s.clock.ticks;
 z.nextBills=Math.max(z.nextBills||0,t+snoozeMonths270);
 notices59().snoozed['life61:bills']=t+snoozeMonths270;
 pruneSnoozed270();save();render();return true;
}
checkBills61=function(){
 const z=s&&life61(),last=z?.notices.filter(q=>q.type==='bills').at(-1);
 if(last?.status!=='later')return notices270Base.checkBills61();
 // После отсрочки — тихое напоминание: окно само не открывается и автоигра не останавливается.
 const running=s.clock.running,q=notices270Base.checkBills61();
 if(q){s.clock.running=running;q.quiet270=true;}
 return null;
};

// ---------- 6. Дети: лечение и семейные поездки ----------
function parentsTreat270(){
 const a=s?.illness;
 if(!a||a.treated||s.dead||s.age>=12)return false;
 const severity=a.severity||'средняя',fee=c().cost*(s.country==='us'?.04:.008)*(severity==='тяжёлая'?2:1),recovery=a.recovery23||2;
 if(canPay23(fee)&&payExpense23(fee,'Лечение: '+a.name,'health:'+s.lastIllnessTick+':'+a.name)){a.treated=true;a.left=recovery;a.parents270='doctor';}
 else{a.treated=true;a.left=recovery+2;a.parents270='free';}
 const text=a.name+'. '+(a.parents270==='doctor'?'Родители отвели к врачу и оплатили приём':'Родители записали к врачу без оплаты')+', восстановление — около '+a.left+' мес.';
 const e=s.log.slice(0,8).find(e=>e.title==='Самочувствие мешает планам'&&String(e.text||'').startsWith(a.name));
 if(e)e.text=text;else log(a.parents270==='doctor'?'Родители отвели к врачу':'Родители записали к врачу',text,'Здоровье');
 return true;
}
healthMenu=function(){
 const a=s?.illness,small=!!a&&s.age<12&&!s.dead;
 if(small)parentsTreat270();
 const old=show;
 show=function(title,text,opts,...rest){
  let note=String(text??'').replace('Тяжесть в игровой модели: ','Тяжесть: '),list=opts;
  if(small&&a===s.illness&&title===a.name){
   note='Тяжесть: '+(a.severity||'средняя')+'.\nЛечение выбрали родители: '+(a.parents270==='doctor'?'приём у врача, его оплатили они.':'помощь без оплаты, поэтому восстановление идёт дольше.');
   list=[{label:'Детские занятия',fn:childActivities23},{label:'Понятно',fn:()=>{}}];
  }
  return old(title,note,list,...rest);
 };
 try{return notices270Base.healthMenu();}finally{show=old;}
};
autonomousMonth=function(...args){
 const r=notices270Base.autonomousMonth(...args);
 if(s&&!s.dead){parentsTreat270();pruneSnoozed270();}
 return r;
};
function familyTripParents270(q){
 const x=familyTravel53();
 for(const id of q.draft?.party53||[]){
  const p=living(id);
  if(p&&['Мать','Отец'].includes(p.role)&&id!==q.host)x.hosts[id]={last:s.clock.ticks,count:x.hosts[id]?.count||0};
 }
}
function familyTripGo270(id){
 const q=invite53(id);
 if(!familyTripInvite270(q)||!invitationAvailable53(q))return false;
 q.status='family270';q.decided270=s.clock.ticks;
 familyTripParents270(q);
 for(const [pid,amount] of Object.entries(q.quote?.charges||{})){
  const p=pid!=='player'&&living(pid);
  if(p)p.privateCash=Math.max(0,(p.privateCash||0)-amount/(fxRate86(p.country)||1));
 }
 s.mood=clamp(s.mood+4);
 for(const pid of q.draft.party53||[]){const p=living(pid);if(p&&['Мать','Отец','Брат','Сестра'].includes(p.role)){rel(p,{affection:2});remember(p,'Семейная поездка: '+q.draft.city);}}
 log('Семейная поездка · '+q.draft.city,'Съездили всей семьёй: '+q.draft.city+', '+q.draft.days+' дн. Дорогу, документы и присмотр за питомцами взяли на себя родители.','Отдых',true);
 save();render();return true;
}
function familyTripStay270(id){
 const q=invite53(id);
 if(!q||!respondTravel53(id,false))return false;
 familyTripParents270(q);
 const party=q.draft?.party53||[],r=s.people.filter(p=>p.alive&&p.age>=18&&kin27(p)&&!party.includes(p.id)&&p.country===s.country).sort((a,b)=>(b.bond||0)-(a.bond||0))[0];
 log('Семейная поездка · '+q.draft.city,'Родители съездили в '+q.draft.city+', а вы остались дома'+(r?' с родственниками: '+r.name:'')+'.','Отдых');
 save();render();return true;
}
travelInviteMenu53=function(id,...rest){
 const q=invite53(id);
 if(!familyTripInvite270(q)||!invitationAvailable53(q))return notices270Base.travelInviteMenu53(id,...rest);
 const d=q.draft;
 show('Семейная поездка · '+d.city,'Родители собираются в '+d.city+' ('+travelName103(d.country)+') на '+d.days+' дн. и зовут вас с собой. Дорогу, документы и присмотр за питомцами берут на себя они.',[
  {label:'Поехать с семьёй',hint:'Настроение +4 · ближе с родителями',fn:()=>familyTripGo270(id)},
  {label:'Остаться дома с родственником',fn:()=>familyTripStay270(id)}
 ]);
};
offerTravel53=function(...args){
 const q=notices270Base.offerTravel53(...args);
 if(familyTripInvite270(q)){
  const e=s.log.slice(0,8).find(e=>e.title===q.title);
  q.title='Семейная поездка · '+q.draft.city;
  if(e){e.title=q.title;e.text='Родители собираются в '+q.draft.city+' на '+q.draft.days+' дн. и зовут вас с собой.';}
 }
 return q;
};
incidentMenu56=function(id){
 if(!s||s.age>=18)return notices270Base.incidentMenu56(id);
 const q=incidents56().events.find(q=>q.id===id),fee=q?localAmount16(q.fee,q.country):0,old=show;
 show=function(title,text,opts,...rest){
  const list=opts.map(o=>/^(Организовать осмотр|Заменить телефон|Заменить колесо) · /.test(o.label)?{...o,hint:expenseAvailable231()>=fee?'Оплатят родители':'У родителей сейчас не хватает денег'}:o);
  return old(title,text,list,...rest);
 };
 try{return notices270Base.incidentMenu56(id);}finally{show=old;}
};

// ---------- 7. Возрастные причины в «Найти действие» ----------
const actionAges270={vacancies58:14,jobReplies58:14,applications:14,admission58:16,dorm68:16,training68:16,
 finance32:18,agreements:18,transport56:12,estates58:18,justice91:18,court94:18,teaching26:18,crisis29:18};
actionCatalog24=function(){
 const list=notices270Base.actionCatalog24(),age=s?.age??0;
 for(const a of list){const min=actionAges270[a.id];if(min&&age<min&&!a.reason)a.reason='С '+min+' лет';}
 return list;
};

// ---------- Тексты каталога 245: «вы» вместо «ты» ----------
// Хранимые id событий и выборов не меняются: правится только текст в памяти при загрузке.
const youWords270={ты:'вы',тебя:'вас',тебе:'вам',тобой:'вами',твой:'ваш',твоя:'ваша',твоё:'ваше',твое:'ваше',твои:'ваши',
 твоего:'вашего',твоей:'вашей',твоих:'ваших',твоим:'вашим',твоими:'вашими',твою:'вашу',твоему:'вашему',твоём:'вашем'};
const youRe270=new RegExp('(?<![А-Яа-яЁё])('+Object.keys(youWords270).join('|')+')(?![А-Яа-яЁё])','gi');
const youVerbEnd270={ешься:'етесь',ёшься:'ётесь',ишься:'итесь',ешь:'ете',ёшь:'ёте',ишь:'ите'};
const youVerbRe270=/(?<![А-Яа-яЁё])([А-Яа-яЁё]+?)(ешься|ёшься|ишься|ешь|ёшь|ишь)(?![А-Яа-яЁё])/g;
function youText270(text){
 if(typeof text!=='string')return text;
 return text.split(/(«[^»]*»)/).map(part=>{
  if(part.startsWith('«'))return part;
  youRe270.lastIndex=0;
  if(!youRe270.test(part))return part;
  youRe270.lastIndex=0;
  return part.replace(youVerbRe270,(w,stem,end)=>['лишь','тишь','мышь','глушь','чушь'].includes(w.toLowerCase())?w:stem+youVerbEnd270[end])
   .replace(youRe270,w=>{const v=youWords270[w.toLowerCase()];return w[0]===w[0].toUpperCase()?v[0].toUpperCase()+v.slice(1):v;});
 }).join('');
}
if(typeof catalog245==='object'&&catalog245?.events)for(const e of catalog245.events){
 e.text=youText270(e.text);e.title=youText270(e.title);
 for(const c of e.choices||[]){c.title=youText270(c.title);for(const o of c.outcomes||[])o.text=youText270(o.text);}
}
