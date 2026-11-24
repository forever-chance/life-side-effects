'use strict';
// Сборка 270: уведомления и возраст.
// 1. «×» в панели «Ожидают ответа» прячет пункт на 3 месяца (если у решения срок раньше — до месяца перед сроком)
//    и действует на все пункты, в том числе на те, что
//    добавлены обёртками позже quick-dismiss59.js (восстановление, имя ребёнка, события своего дела, аренда).
//    Где генератор пересоздаёт запись с новым id, отсрочка привязана к теме: человек, счета, болезнь или травма, хозяин поездки.
//    Для просьбы о помощи пожилому близкому, помощи родителей на жизнь и местных событий «×» — это отказ.
// 2. Ребёнок не получает просьб об уходе за пожилыми: до 16 лет помощь берёт на себя взрослый родственник,
//    в 16–17 — одно уведомление и необязательная лёгкая помощь, с 18 — как раньше, но с «Не сейчас». Помощь,
//    которую семья взяла на себя, продолжается и после 18 лет, пока помощник может помогать.
// 3. Наследство несовершеннолетнего принимает опекун; деньги и доли ждут 18 лет, отказа за ребёнка нет.
// 4. Помощь родителей на жизнь: «Справлюсь сам(а)» — повтор не раньше чем через год, но передумать можно в меню.
// 5. Старые счета: «×» откладывает на 3 месяца, первое напоминание после отсрочки не открывает окно и не останавливает автоигру.
// 6. До 12 лет лечение выбирают родители; поездка родителей — семейная: поехать или остаться дома с близким.
// 7. Возрастные причины в «Найти действие», тексты: «Тяжесть в игровой модели», «от тебя потребуется».
const notices270Base={decisionItems24,quickDismiss59,dismissKind59,quickCard59,elderCareMonth58,elderCareAvailable58,elderMenu58,
 schedule23,prepareEstate58,respondEstate58,estatesMonth58,estateCaseMenu58,livingOffer68,livingMenu68,agreeLiving68,checkBills61,repayMenu61,
 travelInviteMenu53,offerTravel53,healthMenu,autonomousMonth,incidentMenu56,actionCatalog24};
const snoozeMonths270=3;

// ---------- 1. Отсрочка и отказ из панели ----------
function topic270(ref,q){
 const k=ref?.kind;
 if(k==='elder58')return q?.person?'elder58:'+q.person:null;
 if(k==='life61')return q?.type==='bills'?'life61:bills':null;
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
// У многих решений свой срок (аренда, события дела, приглашения, суд, документы на пребывание): скрытый пункт
// возвращается не позже чем за месяц до него (документы — за три), чтобы ответить можно было до последствий по умолчанию.
function snoozeUntil270(ref,q,item=null){
 const t=s.clock.ticks;let end=t+snoozeMonths270,deadline=null,margin=1;
 if(ref.kind==='safety68'){
  margin=3;
  deadline=q?.type==='family'?safety68().family[q.country]?.expires:q?.type==='study'?path16().permits.find(p=>p.documentId45===q.document)?.expires:null;
 }else{
  const list=[item?.expires,q?.expires,ref.kind==='court94'?q?.due:null].filter(Number.isFinite);
  if(list.length)deadline=Math.min(...list);
 }
 if(Number.isFinite(deadline))end=Math.min(end,deadline-margin);
 return Math.max(t+1,end);
}
function decisionItem270(ref){return notices270Base.decisionItems24().find(i=>i.ref.kind===ref.kind&&i.ref.id===ref.id)||null;}
function declineWord270(){return s?.gender==='f'?'Справлюсь сама':'Справлюсь сам';}
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
  if(k==='elder58'&&i.q.teen270){const p=living(i.q.person);i={...i,note:p&&elderLocal58(p)?'Можно навещать и помогать по мелочи':'Живёт далеко — можно звонить и приезжать в гости'};}
  if(k==='estate58'&&s.age<18)continue;
  if(k==='tripInvite53'&&familyTripInvite270(i.q))i={...i,title:'Семейная поездка · '+i.q.draft.city,note:'Поехать или остаться дома'};
  out.push(i);
 }
 return out;
};
dismissKind59=function(ref){
 const mode=notices270Base.dismissKind59(ref);
 if(!mode)return mode;
 return ['elder58','living68','local99'].includes(ref?.kind)?'decline':mode;
};
function dismissLabel270(ref,mode,item=null){
 const q=decisionRecord24(ref);
 if(ref.kind==='elder58')return q?.teen270?'Прочитано':'Не сейчас';
 if(ref.kind==='living68')return declineWord270();
 if(ref.kind==='local99')return 'Пропустить';
 if(ref.kind==='tripInvite53'&&familyTripInvite270(q))return 'Остаться дома';
 if(mode==='decline')return 'Отказаться';
 if(ref.kind==='life61'&&q&&!['bills','bookReady'].includes(q.type))return 'Убрать из списка';
 if(ref.kind==='life61'&&q?.type==='bills')return 'Скрыть на 3 месяца';
 const left=snoozeUntil270(ref,q,item)-s.clock.ticks;
 return left>=snoozeMonths270?'Скрыть на 3 месяца':left<=1?'Напомнить в следующем месяце':'Напомнить ближе к сроку';
}
quickCard59=function(i){
 const html=notices270Base.quickCard59(i),mode=dismissKind59(i.ref);
 if(!mode)return html;
 const old=mode==='decline'?'Отказаться':'Напомнить в следующем месяце',label=esc(dismissLabel270(i.ref,mode,i));
 return html.replace('aria-label="'+old+':','aria-label="'+label+':').replace('title="'+old+'"','title="'+label+'"');
};
quickDismiss59=function(kind,id){
 const ref={kind,id},mode=dismissKind59(ref);
 if(!mode||!s||s.dead)return false;
 const q=decisionRecord24(ref),topic=topic270(ref,q),item=mode==='snooze'?decisionItem270(ref):null;
 if(kind==='elder58')return declineElder270(q?.person,q);
 if(kind==='living68')return declineLiving270();
 if(kind==='local99'){const ok=localChoice99(id,'skip');if(ok)render();return ok;}
 if(kind==='life61'&&q?.type==='bills')return postponeBills270(q);
 if(kind==='tripInvite53'&&familyTripInvite270(q))return familyTripStay270(id);
 const ok=notices270Base.quickDismiss59(kind,id);
 if(!ok)return ok;
 // Срок самого пункта ограничивает только «скрыть»; после отказа тема (хозяин поездки и т. п.) молчит 3 месяца.
 const z=notices59().snoozed,until=mode==='snooze'?snoozeUntil270(ref,q,item):s.clock.ticks+snoozeMonths270;
 if(mode==='snooze'){
  if(topic&&(kind==='health58'||kind==='recovery86'))delete z[kind+':'+id];
  else z[kind+':'+id]=until;
 }
 if(topic)z[topic]=until;
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
// Договорённость, которую семья заключила, пока игрок был младше, продлевается и после 18 лет, пока помощник может
// помогать: иначе все такие договорённости истекали в один месяц через полгода после совершеннолетия.
function renewFamilyCare270(p,a){
 const care=a.care;
 if(!a.need||care?.status!=='active'||!care.family270||care.mode!=='relative'||!elderCareAvailable58(p,care))return false;
 care.until=s.clock.ticks+6;care.hours=a.need;return true;
}
function familyCare270(p,a){
 if(!a.need||!p.alive||!kin27(p))return null;
 const t=s.clock.ticks,care=a.care;
 if(care?.status==='active'&&care.family270){
  if(renewFamilyCare270(p,a))return care;
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
  return !!(p.alive&&h&&h.age>=18&&!h.aging58?.need&&(!h.country||h.country===p.country)&&care.until>=s.clock.ticks);
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
 }else if(!s.dead)renewFamilyCare270(p,a);
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
 const t=s.clock.ticks,z=generations58();
 // Одно уведомление на человека и не чаще раза в три месяца, даже если помощь нужна сразу нескольким.
 if(!a.need||a.teenNotice270!=null||!kin27(p)||(z.lastTeen270??-99)>t-3)return null;
 const care=a.care,helper=care?.status==='active'&&care.mode==='relative'?living(care.helper):null;
 a.teenNotice270=t;z.lastTeen270=t;
 const q={id:id16('elder-request'),person:p.id,status:'offered',created:t,expires:t+6,title:p.name+': нужна помощь в быту',teen270:true};
 z.requests.push(q);
 log(q.title,(helper?'Основную помощь взяла на себя семья: '+helper.name+'. ':care?.status==='active'?'Помощника уже нашли. ':'Взрослые ищут, кто будет помогать. ')+(elderLocal58(p)?'Можно навещать и помогать по мелочи — 2 ч/нед.':'Живёт далеко — можно звонить и приезжать в гости.'),'Семья',true,{kind:'elder58',id:q.id});
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
  let list=opts;
  const tail=list.length&&list.at(-1).label==='Семья и поколения'?list.slice(-1):[];
  const head=tail.length?list.slice(0,-1):list;
  if(s.age<18){
   const extra=[];
   if(a.need&&s.age>=16)extra.push(a.light270
    ?{label:'Перестать навещать',fn:()=>setLightHelp270(id,false)}
    :{label:'Навещать и помогать по мелочи · 2 ч/нед.',hint:!elderLocal58(p)?'Живёт далеко':capacity()-totalHours()<2?'Не хватает свободных часов':'Без денег и договоров · доверие растёт',disabled:!elderLocal58(p)||capacity()-totalHours()<2,fn:()=>setLightHelp270(id,true)});
   if(offered.some(q=>q.teen270))extra.push({label:'Прочитано',fn:()=>declineElder270(id)});
   list=[...extra,...tail];
  }else{
   const extra=[];
   if(a.light270)extra.push({label:'Перестать навещать',fn:()=>setLightHelp270(id,false)});
   if(offered.some(q=>!q.teen270))extra.push({label:'Не сейчас',hint:'Следующая просьба — не раньше чем через 12 мес.',fn:()=>declineElder270(id)});
   list=[...head,...extra,...tail];
  }
  return old(title,text,list,...rest);
 };
 try{return notices270Base.elderMenu58(id);}finally{show=old;}
};

// ---------- 3. Наследство несовершеннолетнего ----------
const guardianWord270={Мать:'мама',Отец:'папа',Бабушка:'бабушка',Дедушка:'дедушка',Тетя:'тётя',Тётя:'тётя',Дядя:'дядя',Брат:'брат',Сестра:'сестра'};
function guardianText270(g){return g?(guardianWord270[g.role]||'опекун')+' — '+g.name:'опекун';}
function estateGuardian270(q){
 const adults=s.people.filter(p=>p.alive&&p.age>=18&&p.id!==q.person);
 return adults.find(p=>['Мать','Отец'].includes(p.role))||adults.filter(kin27).sort((a,b)=>(b.bond||0)-(a.bond||0))[0]||null;
}
function holdEstate270(q){
 const h=q?.heirs.find(h=>h.person==='player'&&h.status==='pending');
 if(!h)return false;
 const g=estateGuardian270(q),cash=(q.distributable??q.cash??0)*h.share;
 Object.assign(h,{status:'accepted',held270:true,guardian270:g?.id||null,cash,heldAt270:s.clock.ticks});
 log('Наследство · '+q.name,'Ваша доля — '+Math.round(h.share*100)+'%: '+money(localAmount16(cash,q.country))+(q.claims?.length?' и доли имущества':'')+'. До 18 лет её хранит '+guardianText270(g)+', потом всё перейдёт к вам.','Семья',true);
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
  const g=h.guardian270?s.people.find(p=>p.id===h.guardian270):null;
  log('Наследство перешло к вам',q.name+': '+money(localAmount16(h.cash,q.country))+(q.claims?.length?' и ваши доли имущества':'')+'. До 18 лет долю '+(['мама','бабушка','тётя','сестра'].includes(guardianWord270[g?.role])?'хранила ':'хранил ')+guardianText270(g)+'.','Имущество',true);
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
  let list=opts;
  if(s.age<18||h?.held270&&h.released270==null){
   list=opts.filter(o=>!/^(Принять свою долю|Отказаться от своей доли)$/.test(o.label));
   const g=h?.held270&&living(h.guardian270);
   if(h?.held270)nextDetail20?.sections?.[0]?.rows.push(fact20('До 18 лет долю хранит',guardianText270(g||null)));
  }
  return old(title,text,list,...rest);
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
function livingDeclined270(){const q=s&&students68().offer;return q?.status==='declined'&&q.declined270!=null?q:null;}
// После отказа передумать можно в любой момент: кнопка в меню снова открывает предложение.
agreeLiving68=function(...args){
 const q=livingDeclined270();
 if(q)q.status='offered';
 const ok=notices270Base.agreeLiving68(...args);
 if(q&&!ok&&q.status==='offered')q.status='declined';
 return ok;
};
livingMenu68=function(){
 const old=show,q=livingOffer68(),declined=livingDeclined270();
 show=function(title,text,opts,...rest){
  const note=declined?String(text??'').replace('Нужно один раз принять регулярную помощь.','Вы отказались от регулярной помощи. Если передумаете, договориться можно здесь.'):text;
  const list=q?[...opts.slice(0,1),{label:declineWord270(),hint:'Предложение вернётся не раньше чем через 12 мес.',fn:declineLiving270},...opts.slice(1)]:opts;
  return old(title,note,list,...rest);
 };
 try{return notices270Base.livingMenu68();}finally{show=old;}
};

// ---------- 5. Старые счета ----------
function postponeBills270(q){
 const z=life61(),t=s.clock.ticks;
 q.status='later';q.postponed270=t;
 z.nextBills=Math.max(z.nextBills||0,t+snoozeMonths270);
 notices59().snoozed['life61:bills']=t+snoozeMonths270;
 pruneSnoozed270();save();render();return true;
}
checkBills61=function(){
 const z=s&&life61(),last=z?.notices.filter(q=>q.type==='bills').at(-1);
 if(last?.status!=='later'||last.postponed270==null||s.clock.ticks-last.postponed270>snoozeMonths270+1)return notices270Base.checkBills61();
 // Первое напоминание после отсрочки — тихое: окно само не открывается и автоигра не останавливается.
 const running=s.clock.running,q=notices270Base.checkBills61();
 if(q){s.clock.running=running;q.quiet270=true;}
 return null;
};
// «Напомнить через три месяца» в окне счетов — та же отсрочка, что и «×».
repayMenu61=function(id,...rest){
 const old=show;
 show=function(title,text,opts,...more){
  const list=opts.map(o=>o.label==='Напомнить через три месяца'?{...o,fn:()=>{const q=life61().notices.find(q=>q.id===id);return q?postponeBills270(q):o.fn();}}:o);
  return old(title,text,list,...more);
 };
 try{return notices270Base.repayMenu61(id,...rest);}finally{show=old;}
};

// ---------- 6. Дети: лечение и семейные поездки ----------
function parentsTreat270(){
 const a=s?.illness;
 if(!a||a.treated||s.dead||s.age>=12)return false;
 const severity=a.severity||'средняя',fee=c().cost*(s.country==='us'?.04:.008)*(severity==='тяжёлая'?2:1),recovery=a.recovery23||2;
 if(canPay23(fee)&&payExpense23(fee,'Лечение: '+a.name,'health:'+s.lastIllnessTick+':'+a.name)){a.treated=true;a.left=recovery;a.parents270='doctor';}
 else{a.treated=true;a.left=recovery+2;a.parents270='free';}
 const text=a.name+'. '+(a.parents270==='doctor'?'Родители отвели к врачу и оплатили приём':'Родители выбрали бесплатную помощь')+', восстановление — около '+a.left+' мес.';
 const e=s.log.slice(0,8).find(e=>e.title==='Самочувствие мешает планам'&&String(e.text||'').startsWith(a.name));
 if(e)e.text=text;else log(a.parents270==='doctor'?'Родители отвели к врачу':'Родители выбрали бесплатную помощь',text,'Здоровье');
 return true;
}
healthMenu=function(){
 const a=s?.illness,small=!!a&&s.age<12&&!s.dead;
 if(small)parentsTreat270();
 const old=show;
 show=function(title,text,opts,...rest){
  let note=String(text??'').replace('Тяжесть в игровой модели: ','Тяжесть: '),list=opts;
  if(small&&a===s.illness&&title===a.name){
   note='Тяжесть: '+(a.severity||'средняя')+'.\n'+({doctor:'Родители отвели к врачу и оплатили приём.',free:'Родители выбрали бесплатную помощь, поэтому восстановление идёт дольше.'}[a.parents270]||'Лечение уже идёт.');
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
// Кто едет: «родители» — только если в поездке оба, иначе мама или папа. Город — после двоеточия, без склонения.
const tripWords270={
 Мать:{nom:'мама',dat:'маме',ins:'мамой',pron:'она',call:'зовёт',take:'берёт',took:'взяла',went:'съездила'},
 Отец:{nom:'папа',dat:'папе',ins:'папой',pron:'он',call:'зовёт',take:'берёт',took:'взял',went:'съездил'},
 both:{nom:'родители',dat:'родителям',ins:'родителями',pron:'они',call:'зовут',take:'берут',took:'взяли',went:'съездили'}};
const cap270=x=>x.charAt(0).toUpperCase()+x.slice(1);
function tripWho270(q){
 const party=(q?.draft?.party53||[]).map(id=>living(id)).filter(Boolean),host=living(q?.host);
 const parents=party.filter(p=>['Мать','Отец'].includes(p.role));
 const w=parents.length>=2?tripWords270.both:tripWords270[host?.role]||tripWords270.both;
 return {...w,others:party.filter(p=>!parents.includes(p)&&p.id!==q.host)};
}
function tripPets270(){return typeof livePets57==='function'?livePets57().length>0:(s.pets||[]).some(p=>p.alive);}
function tripDuties270(){return tripPets270()?'Дорогу, документы и присмотр за питомцами':'Дорогу и документы';}
function tripSitter270(q){
 const party=q?.draft?.party53||[],home=residenceCity();
 const pool=s.people.filter(p=>p.alive&&p.age>=18&&p.age<80&&!p.aging58?.need&&p.id!==q.host&&!party.includes(p.id)&&guardianWord270[p.role]
  &&p.country===s.country&&(!p.city18||p.city18===home));
 const rank=p=>['Мать','Отец'].includes(p.role)?0:['Бабушка','Дедушка'].includes(p.role)?1:2;
 return pool.sort((a,b)=>rank(a)-rank(b)||(b.bond||0)-(a.bond||0))[0]||null;
}
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
 const w=tripWho270(q),duties=tripDuties270();
 q.status='family270';q.decided270=s.clock.ticks;
 familyTripParents270(q);
 for(const [pid,amount] of Object.entries(q.quote?.charges||{})){
  const p=pid!=='player'&&living(pid);
  if(p)p.privateCash=Math.max(0,(p.privateCash||0)-amount/(fxRate86(p.country)||1));
 }
 s.mood=clamp(s.mood+4);
 for(const pid of q.draft.party53||[]){const p=living(pid);if(p&&['Мать','Отец','Брат','Сестра'].includes(p.role)){rel(p,{affection:2});remember(p,'Семейная поездка: '+q.draft.city);}}
 log('Семейная поездка · '+q.draft.city,'Съездили с '+w.ins+': '+q.draft.city+', '+q.draft.days+' дн. '+duties+' '+w.pron+' '+w.took+' на себя.','Отдых',true);
 save();render();return true;
}
function familyTripStay270(id){
 const q=invite53(id);
 if(!q)return false;
 const w=tripWho270(q),r=tripSitter270(q);
 if(!respondTravel53(id,false))return false;
 familyTripParents270(q);
 log('Семейная поездка · '+q.draft.city,cap270(w.nom)+' '+w.went+' без вас: '+q.draft.city+', '+q.draft.days+' дн. Вы остались дома'+(r?', с вами — '+guardianWord270[r.role]+', '+r.name:'')+'.','Отдых');
 save();render();return true;
}
travelInviteMenu53=function(id,...rest){
 const q=invite53(id);
 if(!familyTripInvite270(q)||!invitationAvailable53(q))return notices270Base.travelInviteMenu53(id,...rest);
 const d=q.draft,w=tripWho270(q),r=tripSitter270(q);
 show('Семейная поездка · '+d.city,cap270(w.nom)+' '+w.call+' вас в поездку: '+d.city+(d.country!==s.country?' ('+travelName103(d.country)+')':'')+', '+d.days+' дн. '+tripDuties270()+' '+w.pron+' '+w.take+' на себя.'+(w.others.length?(w.others.length>1?' Также едут: ':' Также едет: ')+w.others.map(p=>p.name).join(', ')+'.':''),[
  {label:'Поехать с '+w.ins,hint:'Настроение +4 · ближе к '+w.dat,fn:()=>familyTripGo270(id)},
  {label:'Остаться дома',hint:r?'С вами — '+guardianWord270[r.role]+', '+r.name:'',fn:()=>familyTripStay270(id)}
 ]);
};
offerTravel53=function(...args){
 const q=notices270Base.offerTravel53(...args);
 if(familyTripInvite270(q)){
  const e=s.log.slice(0,8).find(e=>e.title===q.title),w=tripWho270(q);
  if(e){e.title='Семейная поездка · '+q.draft.city;e.text=cap270(w.nom)+' '+w.call+' вас в поездку: '+q.draft.city+', '+q.draft.days+' дн.';}
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
// Работа и заявки — с 16, как в jobEligibility16 («Работа с 16 лет») и у пункта «Вакансии и поиск работы».
// Для пунктов из списка возраст — первая причина: ребёнку не нужно читать «До 25 лет» или «Доступно совершеннолетним».
const actionAges270={vacancies58:16,jobReplies58:16,applications:16,admission58:16,dorm68:16,training68:16,
 finance32:18,agreements:18,transport56:12,estates58:18,justice91:18,court94:18,teaching26:18,crisis29:18,living68:18,enterprise152:18};
actionCatalog24=function(){
 const list=notices270Base.actionCatalog24(),age=s?.age??0;
 return list.map(a=>{const min=actionAges270[a.id];return min&&age<min?{...a,reason:'С '+min+' лет'}:a;});
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
