'use strict';
// Сборка 270: мелкие подтверждённые баги общения, событий близких и расписания
// (оценки family-events, npc-whereabouts, conflicts-repetition и аудит time-budget).
//
// а) Свадьба близкого — только при живом партнёре (weddingEligible132 проверял партнёра лишь у матери и отца,
//    треть свадеб проходила «ни с кем»). Свадьба случается в свой срок, даже если позвать вас не вышло
//    (вам меньше 15, ждёт ответа другое приглашение, хозяину за границей не на что позвать): брак записывается
//    обоим, у родственника появляется союз в семье, в древе — «Брак», у супруга в карточке — родство.
//    Если вас позвали, брак записывается сразу после праздника, а не через месяц после приглашения. Вдовство снимает отметку,
//    расставание — запись о браке; если свадьбы не будет, приглашение и поездка на неё отменяются.
// б) Приглашение на событие в другом городе больше не приходит «мёртвым»: своя проверка доступности вместо
//    hostEligible53 (тот пускал только друга, партнёра и родителей с близостью от 50). Хозяин — принимающая сторона,
//    а не попутчик: в свой город он не едет и дорогу себе не оплачивает. Отказ ни на что не влияет.
// в) Встречи знакомых (social49): кофе, прогулка и компания — только в одном городе, иначе созвон.
// г) Ребёнок не может в один и тот же месяц быть и в лагере, и в семейной поездке.
// д) Человек под стражей или в больнице (custody145, careInterruption145) не устраивает событий, не зовёт в поездку
//    и сам не едет попутчиком.
// е) Разговор «сейчас» («Обсудить планы и границы сейчас» → chapter.js / game.js talk): один на человека в месяц,
//    повтор с тем же человеком действует слабее, настроение от таких разговоров убывает, если обходить всех по очереди.
// ж) sceneFlags.overwork держится, пока переработка свежая (до 12 месяцев или пока идёт дополнительный проект).
// з) Часы своего дела считаются один раз — делом business263 в расписании; надбавка enterprise152 к schedule23 снята.
//    Дело нельзя «приостановить» или «прекратить» в списке дел: часы меняет режим (сам, частично, управляющий).
const socialFix270Base={weddingEligible132,offerOccasion54,occasionHosts54,occasionAvailable54,invitationAvailable53,
 hostEligible53,partyCandidate53,socialInvite49,socialPlace49,campWhy54,travelWhy52,travelDepartureWhy52,meetingWhy53,
 slavaHost130,autonomousMonth,rel,act,overtime,finishTask,schedule23,totalHours,pauseTask05,cancelTask,taskList05,
 treeGraph90,personSections42};
// «Обсудить планы и границы сейчас» в clock.js вызывает timeBase.talk (разговор из chapter.js). Подменяем только его.
const talkNowBase270s=timeBase.talk;

function socialFix270(){return s.social270??={version:1,last:-1,weddings:[]};}

// ---------- общее: где человек ----------
function awaySoc270(p){
 const r=p&&typeof careInterruption145==='function'?careInterruption145(p):null;
 return r==='custody'?'Сейчас под стражей':r==='illness'?'Сейчас в больнице':'';
}
function nearSoc270(p){return !!(p?.alive&&p.country===s.country&&(!p.city18||p.city18===residenceCity())&&!awaySoc270(p));}

// ---------- а) свадьбы близких ----------
const weddingChanceSoc270=1/30;   // в месяц для пары, которая вместе от года
// Роли родни, которые roleGenitive268 склоняет: «муж сестры», «жена сына».
const tieRolesSoc270=kinRoles27.filter(r=>r!=='Потомок');

weddingEligible132=function(host){
 if(!host?.alive||host.npcMarried54||host.age<20||typeof npcPartner55!=='function')return false;
 const partner=npcPartner55(host);
 if(!partner||partner.npcMarried54||partner.age<18)return false;
 if(s.clock.ticks-(adultState55(host).pairedAt??s.clock.ticks)<12)return false;
 return !s.family27?.unions?.some(u=>u.status==='together'&&[u.a,u.b].some(id=>id===host.id||id===partner.id)
  &&!([u.a,u.b].includes(host.id)&&[u.a,u.b].includes(partner.id)));
};
function weddingOpenSoc270(id){return socialFix270().weddings.find(w=>w.status==='planned'&&(w.host===id||w.partner===id))||null;}
function linkWeddingSoc270(w,q){q.wedding270=w.id;q.happened=true;w.invite=q.id;w.due=Math.max(w.due,q.expires);}
// Свадьба в плане: через 3–5 месяцев. Если человек может позвать вас, приходит приглашение; если нет — свадьба всё равно будет.
function planWeddingSoc270(host){
 const partner=host?.alive&&npcPartner55(host);
 if(!partner||weddingOpenSoc270(host.id)||weddingOpenSoc270(partner.id))return null;
 const z=socialFix270(),w={id:'wedding270-'+host.id+'-'+s.clock.ticks,host:host.id,partner:partner.id,planned:s.clock.ticks,
  due:s.clock.ticks+rnd(3,5),status:'planned',invite:null,delays:0};
 z.weddings.push(w);
 if(z.weddings.length>200)z.weddings=z.weddings.filter((x,i)=>x.status==='planned'||i>=z.weddings.length-150);
 const q=occasionHosts54().includes(host)?offerOccasion54(host,'wedding'):null;
 if(q)linkWeddingSoc270(w,q);
 return w;
}
// Приглашения на свадьбу, которые создал events54 сам, тоже ведём здесь: брак пишет marrySoc270, а не блок q.happened.
function claimWeddingsSoc270(){
 if(typeof events54!=='function')return;
 for(const q of events54().invitations){
  if(q.kind!=='wedding'||q.wedding270||q.happened)continue;
  const host=living(q.host);
  let w=host&&weddingOpenSoc270(host.id);
  if(!w){
   w={id:'wedding270-'+q.id,host:q.host,partner:q.partner132||(host&&npcPartner55(host)?.id)||null,planned:s.clock.ticks,
    due:q.expires,status:'planned',invite:null,delays:0};
   socialFix270().weddings.push(w);
  }
  linkWeddingSoc270(w,q);
 }
}
function tripAheadSoc270(q){
 const inv=q?.travelInvite&&invite53(q.travelInvite),t=inv?.trip&&travel52().trips.find(t=>t.id===inv.trip);
 return !!t&&['planned','requested','approved'].includes(t.status);
}
function familyUnionSoc270(host,partner){
 if(typeof familyState27!=='function'||!kin27(host)||partner.country!==host.country)return null;
 const f=familyState27();
 let u=f.unions.find(u=>u.status==='together'&&[u.a,u.b].includes(host.id)&&[u.a,u.b].includes(partner.id));
 if(!u){
  if(f.unions.some(u=>u.status==='together'&&[u.a,u.b].some(id=>id===host.id||id===partner.id)))return null;
  partner.bio27??={parents:[],children:[],history:[],education:[],study:null,job:adultState55(partner).job,skill:35,ambition:.5,
   educationWish:.3,childrenWish:partner.childrenWish==='no'?0:visualHash49(partner.id+':family'),last:s.clock.ticks,
   born:s.clock.ticks-partner.age*12,health:90};
  u={id:'union270-'+host.id+'-'+s.clock.ticks,a:host.id,b:partner.id,status:'together',since:adultState55(host).pairedAt??s.clock.ticks,
   nextChild:s.clock.ticks+12,generation58:true};
  f.unions.push(u);
 }
 u.married270=s.clock.ticks;
 return u;
}
function marrySoc270(host,partner,w=null,q=null){
 host.npcMarried54=partner.npcMarried54=true;
 host.unavailable18=partner.unavailable18=true;
 (host.lifeEvents54??={}).wedding=s.clock.ticks;
 host.marriage270={spouse:partner.id,since:s.clock.ticks,via:null};
 partner.marriage270={spouse:host.id,since:s.clock.ticks,via:host.id};
 if(w){w.status='held';w.held=s.clock.ticks;}
 familyUnionSoc270(host,partner);
 const kin=tieRolesSoc270.includes(host.role);
 const tie=kin?' '+partner.name+' теперь '+(partner.gender==='f'?'жена':'муж')+' '+roleGenitive268(host)+'.':'';
 const went=q?(q.status==='completed'?' Вы были среди гостей.':' Вас на свадьбе не было.'):'';
 remember(host,'Поженились: '+host.name+' и '+partner.name);
 if(['Мать','Отец'].includes(host.role))notice61('parentWedding132','Новый брак родителя',host.name+' и '+partner.name+' вступили в брак.'+tie+went);
 else if(kin||q||(host.bond||0)>=40)log('Свадьба · '+host.name,host.name+' и '+partner.name+' поженились.'+tie+went,'Жизнь близких',kin);
}
function unionTogetherSoc270(a,b){return !!s.family27?.unions?.some(u=>u.status==='together'&&[u.a,u.b].includes(a)&&[u.a,u.b].includes(b));}
// Брак из 270 действует, пока оба живы, у обоих отметка о браке и супруг — нынешний партнёр или с ним общий союз.
// Расставание (autonomy55 adultSocial55) снимает npcMarried54 и партнёра, но не marriage270 — поэтому проверяем всякий раз.
function spouseSoc270(p){
 const id=p?.alive&&p.marriage270?.spouse,sp=id&&living(id);
 if(!sp||!p.npcMarried54||!sp.npcMarried54)return null;
 return p.agency55?.partner===sp.id||sp.agency55?.partner===p.id||unionTogetherSoc270(p.id,sp.id)?sp:null;
}
function marriagesSoc270(){
 for(const p of s.people){
  if(!p.alive||!p.marriage270||spouseSoc270(p))continue;
  const sp=s.people.find(x=>x.id===p.marriage270.spouse);
  if(sp?.alive&&sp.marriage270?.spouse===p.id)sp.marriage270=null;
  p.marriage270=null;
 }
}
// Свадьбы не будет: приглашение больше не действует, дело в расписании и поездка снимаются, вам — запись.
function cancelWeddingSoc270(w,q,why=''){
 w.status='cancelled';w.cancelled=s.clock.ticks;
 if(!q)return;
 const known=['offered','active','accepted'].includes(q.status),reason='Свадьбы не будет'+(why?': '+why:'');
 let tripLogged=false;
 if(q.travelInvite){
  const inv=typeof invite53==='function'&&invite53(q.travelInvite),t=inv?.trip&&travel52().trips.find(t=>t.id===inv.trip);
  if(inv?.status==='offered')inv.status='cancelled';
  else if(inv?.status==='accepted'&&t&&['planned','requested','approved'].includes(t.status))tripLogged=cancelTravel52(t.id,reason);
  if(inv)q.status=inv.status;
 }else if(['offered','active'].includes(q.status)){
  q.status='cancelled';
  for(const t of s.clock.tasks)if(t.kind==='occasion54'&&t.occasion54===q.id&&!['completed','cancelled'].includes(t.state))archiveTask05(t,'cancelled');
 }
 if(known&&!tripLogged)log(q.title,reason+'.','Жизнь близких');
}
function awayWhySoc270(p){const a=awaySoc270(p);return a?p.name+' '+a[0].toLowerCase()+a.slice(1):'';}
function weddingsDueSoc270(){
 const events=typeof events54==='function'?events54().invitations:[];
 for(const w of socialFix270().weddings){
  if(w.status!=='planned')continue;
  const host=living(w.host),partner=living(w.partner),q=w.invite&&events.find(q=>q.id===w.invite)||null;
  const pair=!!(host&&partner&&npcPartner55(host)?.id===partner.id);
  // generationPairs58 мог раньше свадьбы сделать их семьёй (npcMarried54 у обоих) — свадьба всё равно в свой срок.
  const each=pair&&host.npcMarried54&&partner.npcMarried54;
  if(!pair||!each&&(host.npcMarried54||partner.npcMarried54)){
   cancelWeddingSoc270(w,q,host&&partner&&!pair?host.name+' и '+partner.name+' расстались':'');continue;
  }
  // Праздник, на котором вы были, — и есть свадьба: брак пишется сразу, а не в плановый месяц.
  if(w.due>s.clock.ticks&&q?.status!=='completed')continue;
  // Вы уже идёте на праздник (дело в расписании или поездка впереди) — свадьба дожидается гостя.
  const guestOnWay=q&&(q.status==='active'||q.status==='accepted'&&tripAheadSoc270(q));
  const away=awaySoc270(host)||awaySoc270(partner);
  if((guestOnWay||away)&&w.delays<4){w.delays++;w.due=s.clock.ticks+(away?2:1);continue;}
  if(away){cancelWeddingSoc270(w,q,awayWhySoc270(host)||awayWhySoc270(partner));continue;}
  marrySoc270(host,partner,w,q);
 }
}
// Бабушки и дедушки здесь не женятся: союза между ними в игре нет, и «новый муж бабушки» при живом дедушке — ошибка.
function weddingsPlanSoc270(){
 if(typeof npcPartner55!=='function')return;
 const own=currentPartner()?.id;
 for(const p of s.people){
  if(!p.alive||p.age<20||p.age>75||!p.agency55?.partner||p.npcMarried54||p.id===own||['Бабушка','Дедушка'].includes(p.role)
   ||!adultEligible55(p)||!weddingEligible132(p))continue;
  const partner=npcPartner55(p);
  if(awaySoc270(p)||awaySoc270(partner)||weddingOpenSoc270(p.id)||weddingOpenSoc270(partner.id))continue;
  if(chance(weddingChanceSoc270*(p.age>60?.5:1)))planWeddingSoc270(p);
 }
}
function unionOtherSoc270(p){
 const us=s.family27?.unions||[],u=us.find(u=>u.status==='together'&&[u.a,u.b].includes(p.id))||us.find(u=>u.status==='widowed'&&[u.a,u.b].includes(p.id));
 return u?(u.a===p.id?u.b:u.a):null;
}
// Вдовство (и старый баг «женат ни на ком»): нет живого супруга — нет отметки о браке, человек снова может жениться.
// Супруг — тот, с кем общий союз, или нынешний партнёр; marriage270 мог остаться от прежнего брака и для этого не годится.
function spouseNowSoc270(p){
 const u=s.family27?.unions?.find(u=>u.status==='together'&&[u.a,u.b].includes(p.id)),other=u&&(u.a===p.id?u.b:u.a);
 if(other&&living(other))return other;
 const cur=p.agency55?.partner;
 return cur&&living(cur)?cur:null;
}
function widowsSoc270(){
 for(const p of s.people){
  if(!p.alive||!p.npcMarried54||spouseNowSoc270(p))continue;
  const dead=[p.marriage270?.spouse,unionOtherSoc270(p),p.agency55?.partner].find(id=>id&&s.people.some(x=>x.id===id&&!x.alive));
  p.npcMarried54=false;
  p.unavailable18=false;
  if(dead)p.widowed270={spouse:dead,tick:s.clock.ticks};
  p.marriage270=null;
 }
}

// ---------- б) событие в другом городе ----------
function hostOffPartySoc270(q,fresh=false){
 const inv=typeof invite53==='function'&&q?.travelInvite&&invite53(q.travelInvite);
 if(!inv||inv.status!=='offered'||inv.hostOff270||!inv.draft?.party53?.includes(q.host))return;
 const draft={...inv.draft,party53:inv.draft.party53.filter(id=>id!==q.host)},quote=groupQuote53(draft);
 inv.draft=draft;inv.quote=quote;inv.signature=groupSignature53(draft);inv.hostOff270=true;
 q.fee=quote.player;
 if(fresh){
  const host=living(q.host),e=s.log.slice(0,10).find(e=>e.title===q.title);
  if(e&&host)e.text=host.name+' зовёт: '+q.city+' · '+countries[q.country].name+'. '+(q.paid?'Приглашающий оплачивает вашу часть.':'Ваша часть: '+money(q.fee)+'.');
 }
}
offerOccasion54=function(...args){
 const q=socialFix270Base.offerOccasion54(...args);
 if(q?.travelInvite)hostOffPartySoc270(q,true);
 return q;
};
invitationAvailable53=function(q){
 if(!q?.occasion54)return socialFix270Base.invitationAvailable53(q);
 const host=living(q.host);
 return !!(q.status==='offered'&&q.expires>s.clock.ticks&&!s.dead&&q.home===s.country&&q.homeCity===residenceCity()&&host&&!awaySoc270(host));
};
// Хозяин больше не в составе поездки: воспоминание о празднике ему — отдельно, когда поездка закончилась.
function occasionMemoriesSoc270(){
 if(typeof events54!=='function')return;
 for(const q of events54().invitations){
  if(!q.travelInvite||q.status!=='completed'||q.hostMemory270)continue;
  q.hostMemory270=true;
  const p=living(q.host),inv=invite53(q.travelInvite),t=inv?.trip&&travel52().trips.find(t=>t.id===inv.trip);
  if(!p||t?.memories53?.includes(p.id))continue;
  rel(p,{trust:2,affection:3});
  remember(p,'побывали вместе: '+q.title);
 }
}

// ---------- в) встречи знакомых только в одном городе ----------
socialInvite49=function(host=null,kind=null){
 if(!host&&s&&!s.dead&&s.age>=6){
  const x=social49(),tick=s.clock.ticks;
  if(tick-x.lastOffer>=3&&!x.invitations.some(q=>['offered','active'].includes(q.status))){
   const pool=socialHosts49().filter(p=>tick-(x.hosts[p.id]?.last??-100)>=9);
   host=pool.sort((a,b)=>(x.hosts[a.id]?.last??-100)-(x.hosts[b.id]?.last??-100)||(b.bond||0)-(a.bond||0))[0]||null;
  }
 }
 if(host&&host.country===s.country&&!nearSoc270(host))kind='call';
 return socialFix270Base.socialInvite49(host,kind);
};
// Компания для встречи — только из своего города (раньше брались по стране).
socialLocal49=function(host){
 const shared=p=>Object.keys(p.contexts48||{}).some(key=>host.contexts48?.[key]);
 return socialHosts49().filter(p=>p.id!==host.id&&nearSoc270(p)).sort((a,b)=>Number(shared(b))-Number(shared(a))||(b.bond||0)-(a.bond||0)).slice(0,2);
};
socialPlace49=function(q){
 if(!socialFix270Base.socialPlace49(q))return false;
 return q.kind==='call'||nearSoc270(living(q.host));
};

// ---------- г) лагерь и семейная поездка ----------
function campTicksSoc270(id){
 const out=[];
 for(const t of s.family54?.camps||[]){
  if(t.child!==id)continue;
  if(t.status==='away'&&t.ends>s.clock.ticks){for(let k=t.departed??s.clock.ticks;k<t.ends;k++)out.push(k);}
  else if(['planned','documents'].includes(t.status))out.push(t.departure);
 }
 return out;
}
function tripTicksSoc270(id){
 return (s.travel52?.trips||[]).filter(t=>['planned','requested','approved','away'].includes(t.status)&&(t.party53||[]).includes(id))
  .map(t=>t.status==='away'?t.departed:t.departure);
}
campWhy54=function(child,kind,country){
 const why=socialFix270Base.campWhy54(child,kind,country),dep=s.clock.ticks+(kind==='abroad'?2:1);
 if(tripTicksSoc270(child).includes(dep))why.push('В месяц смены ребёнок едет в семейную поездку');
 return why;
};
function draftDepartureSoc270(d){
 const dd=typeof extraTravel86==='function'?extraTravel86(d):d;
 if(dd.departure86)return dd.departure86;
 try{return typeof departureMin86==='function'?departureMin86(dd):s.clock.ticks+1;}catch(e){return s.clock.ticks+1;}
}
travelWhy52=function(d,...rest){
 const why=socialFix270Base.travelWhy52(d,...rest);
 if(!d?.party53?.length||!Array.isArray(why))return why;
 const dep=draftDepartureSoc270(d),extra=[];
 for(const id of d.party53){const p=living(id);if(p&&p.age<18&&campTicksSoc270(id).includes(dep))extra.push(p.name+': в этот месяц смена в лагере');}
 return extra.length?[...new Set([...why,...extra])]:why;
};
travelDepartureWhy52=function(t,...rest){
 const r=socialFix270Base.travelDepartureWhy52(t,...rest);
 if(r)return r;
 for(const id of t?.party53||[]){const p=living(id);if(p&&p.age<18&&campTicksSoc270(id).includes(s.clock.ticks))return p.name+' в этот месяц в лагере';}
 return r;
};

// ---------- д) под стражей или в больнице ----------
occasionHosts54=function(){return socialFix270Base.occasionHosts54().filter(p=>!awaySoc270(p));};
occasionAvailable54=function(q){return socialFix270Base.occasionAvailable54(q)&&!awaySoc270(living(q.host));};
hostEligible53=function(p){return socialFix270Base.hostEligible53(p)&&!awaySoc270(p);};
partyCandidate53=function(p){return socialFix270Base.partyCandidate53(p)&&!awaySoc270(p);};
meetingWhy53=function(p,kind){
 const why=socialFix270Base.meetingWhy53(p,kind),a=awaySoc270(p);
 return a&&Array.isArray(why)&&!why.includes(a)?[...why,a]:why;
};
slavaHost130=function(){
 const h=socialFix270Base.slavaHost130();
 if(!h||!awaySoc270(h))return h;
 return s.people.find(p=>p.alive&&p.country==='rs'&&p.bond>=50&&['Мать','Отец','Бабушка','Дедушка'].includes(p.role)
  &&[...String(p.id)].reduce((n,c)=>n+c.codePointAt(0),0)%3===0&&!awaySoc270(p))||null;
};

// ---------- е) разговор «сейчас»: раз в месяц, повтор слабее ----------
let talkCtxSoc270=null;
function decaySoc270(rec,half){return rec?rec.n*Math.pow(.5,Math.max(0,s.clock.ticks-rec.tick)/half):0;}
function talkScaleSoc270(p){return Math.max(.2,1/(1+.6*decaySoc270(p.talk270,6)));}
function talkMoodScaleSoc270(p){return talkScaleSoc270(p)/(1+decaySoc270(s.talkMood270,2));}
function talkLimitedSoc270(o){return typeof o?.fn==='function'&&!/жиль|жить вместе/i.test(o.label||'');}
function scaleHintSoc270(h,k,km){
 return String(h||'').replace(/(доверие|тепло|близость) \+(\d+)/g,(m,w,n)=>w+' +'+Math.round(n*k))
  .replace(/настроение \+(\d+)/g,(m,n)=>'настроение +'+Math.round(n*km))
  .replace(/напряжение [−-](\d+)/g,(m,n)=>'напряжение −'+Math.round(n*k));
}
timeBase.talk=function(id){
 const p=living(id);
 if(!p||s.dead||!s.clock)return talkNowBase270s(id);
 const real=show;let got=null;
 show=function(...a){got=a;};
 try{talkNowBase270s(id);}finally{show=real;}
 if(!got)return;
 const [title,text,options,...rest]=got,done=p.talk270?.tick===s.clock.ticks,k=talkScaleSoc270(p),km=talkMoodScaleSoc270(p);
 const opts=(options||[]).map(o=>{
  if(!talkLimitedSoc270(o))return o;
  if(done)return {...o,disabled:true,hint:'Такой разговор в этом месяце уже был'};
  return {...o,hint:talkHintSoc270(o.hint,k,km),fn:()=>talkRunSoc270(p.id,o.fn)};
 });
 return show(title,text,opts,...rest);
};
// С этим человеком недавно говорили — слабее всё. Говорили с другими — слабее только настроение, и только там, где оно есть.
function talkHintSoc270(h,k,km){
 const base=String(h||'');
 if(k<.99)return scaleHintSoc270(base,k,km)+' · недавно уже говорили, подействует слабее';
 if(km<.99){const x=scaleHintSoc270(base,1,km);if(x!==base)return x+' · такие разговоры недавно уже поднимали настроение';}
 return h;
}
function talkRunSoc270(pid,fn){
 const p=living(pid);if(!p||!s.clock)return;
 if(p.talk270?.tick===s.clock.ticks)return toast('Такой разговор в этом месяце уже был.');
 talkCtxSoc270={pid,k:talkScaleSoc270(p),km:talkMoodScaleSoc270(p)};
 try{return fn();}finally{talkCtxSoc270=null;}
}
act=function(fn){
 const c=talkCtxSoc270;
 if(!c||c.used)return socialFix270Base.act(fn);
 c.used=true;
 return socialFix270Base.act(()=>{
  const p=living(c.pid),m0=s.mood,b0=p?.bond??0;
  c.active=true;try{fn();}finally{c.active=false;}
  const raw=s.mood-m0;
  if(raw>0)s.mood=clamp(m0+Math.round(raw*c.km));
  if(p&&!c.rel&&p.bond>b0){
   const gain=Math.round((p.bond-b0)*c.k);p.bond=clamp(b0+gain);
   const e=s.log.slice(0,3).find(e=>/^Близость \+\d+$/.test(e.tag||''));if(e)e.tag='Близость +'+gain;
  }
  if(p)p.talk270={tick:s.clock.ticks,n:decaySoc270(p.talk270,6)+1};
  if(raw>0)s.talkMood270={tick:s.clock.ticks,n:decaySoc270(s.talkMood270,2)+1};
 });
};
rel=function(p,delta){
 const c=talkCtxSoc270;
 if(c?.active&&p&&p.id===c.pid&&delta){
  c.rel=true;const d={};
  for(const [key,v] of Object.entries(delta))d[key]=(key==='strain'?v<0:v>0)?v*c.k:v;
  return socialFix270Base.rel(p,d);
 }
 return socialFix270Base.rel(p,delta);
};

// ---------- ж) переработка ----------
overtime=function(...args){
 const before=s.flags?.overtimeYear,r=socialFix270Base.overtime(...args);
 if(s.flags&&before!==s.year&&s.flags.overtimeYear===s.year)s.flags.overtimeAt270=s.clock.ticks;
 return r;
};
finishTask=function(t,...args){
 const r=socialFix270Base.finishTask(t,...args);
 if(t?.kind==='overtime'&&t.progress>=t.duration&&s.flags?.overtimeYear===s.year)s.flags.overtimeAt270=s.clock.ticks;
 return r;
};
function overworkSoc270(){
 const f=s.flags||{},active=s.clock.tasks.some(t=>t.kind==='overtime'&&!['cancelled','completed','paused'].includes(t.state));
 const ago=f.overtimeAt270!=null?s.clock.ticks-f.overtimeAt270:f.overtimeYear!=null?12*(s.year-f.overtimeYear):Infinity;
 const recent=active||ago<12,partner=currentPartner();
 for(const p of s.people)if(p.sceneFlags?.overwork&&(!recent||p.id!==partner?.id))p.sceneFlags.overwork=false;
 if(active&&partner){partner.sceneFlags??={};partner.sceneFlags.overwork=true;}
}

// ---------- з) часы своего дела ----------
// enterprise152 прибавлял к schedule23 12/9/7/6 ч (+4 за филиал), а business263 добавил дело на 35/15/3 ч: часы шли дважды.
function enterpriseExtraSoc270(){
 if(typeof ownedEnterprises168!=='function'||enterpriseBlock152()||travelActive52()||s.illness)return 0;
 let n=0;
 for(const b of ownedEnterprises168())if(b.country===s.country&&b.city===residenceCity())n+=[12,9,7,6][enterpriseStaff155(b).length]+(b.branch159?4:0);
 return n;
}
schedule23=function(...args){
 const q=socialFix270Base.schedule23(...args),extra=s?.clock?enterpriseExtraSoc270():0;
 if(extra&&Number.isFinite(extra))q.total-=extra;
 return q;
};
// Дело на паузе из старого сохранения всё равно работает — и часы его тоже идут.
totalHours=function(){
 const n=socialFix270Base.totalHours();
 return n+(s?.clock?.tasks||[]).filter(t=>t.kind==='business263'&&t.state==='paused').reduce((a,t)=>a+(t.hours||0),0);
};
function taskBusinessSoc270(id){
 const t=s?.clock?.tasks.find(t=>t.id===id);
 return t?.kind==='business263'&&typeof ownedEnterprises168==='function'?ownedEnterprises168().find(b=>b.id===t.business263)||null:null;
}
function businessModeSoc270(id){const b=ownedEnterprises168().find(b=>b.id===id);if(b)businessModeMenu263(b);}
pauseTask05=function(id,...args){
 const b=taskBusinessSoc270(id);
 if(!b)return socialFix270Base.pauseTask05(id,...args);
 toast('Часы своего дела зависят от того, как вы его ведёте.');
 businessModeMenu263(b);
};
cancelTask=function(id,...args){
 const b=taskBusinessSoc270(id);
 if(!b)return socialFix270Base.cancelTask(id,...args);
 toast('Часы своего дела зависят от того, как вы его ведёте.');
 businessModeMenu263(b);
};
taskList05=function(...args){
 if(!s?.clock)return socialFix270Base.taskList05(...args);
 if(typeof engineState05==='function')engineState05();
 const tasks=s.clock.tasks,biz=tasks.filter(t=>t.kind==='business263');
 if(!biz.length)return socialFix270Base.taskList05(...args);
 let html='';
 try{s.clock.tasks=tasks.filter(t=>t.kind!=='business263');html=s.clock.tasks.length?socialFix270Base.taskList05(...args):'';}
 finally{s.clock.tasks=tasks;}
 return biz.map(t=>`<div class="task-item"><strong>${esc(t.label)}</strong><span class="task-state">Пока дело открыто</span><small>${t.hours} ч/нед. · часы меняются режимом работы</small><div class="task-controls"><button class="small" onclick="businessModeSoc270('${esc(t.business263)}')">Как вести дело</button></div></div>`).join('')+html;
};

// ---------- родство: древо и карточка ----------
treeGraph90=function(...args){
 const g=socialFix270Base.treeGraph90(...args),key=(a,b)=>[a,b].sort().join('|');
 const married=new Set((s.family27?.unions||[]).filter(u=>u.married270&&u.status==='together').map(u=>key(u.a,u.b)));
 for(const p of s.people)if(spouseSoc270(p))married.add(key(p.id,p.marriage270.spouse));
 for(const e of g.edges)if(e.kind==='partner'&&e.a!=='player'&&e.b!=='player'&&married.has(key(e.a,e.b)))e.kind='married';
 return g;
};
personSections42=function(p,...args){
 const sections=socialFix270Base.personSections42(p,...args),m=p?.marriage270;
 // Только нынешний брак: после расставания или вдовства карточка показывает то, что записала сама игра.
 const spouse=spouseSoc270(p);
 if(!spouse)return sections;
 const row=sections.find(x=>x.title==='Собственная жизнь')?.rows?.find(r=>r.label==='Пара');
 if(row)row.value=spouse.name+' · в браке';
 const via=m.via&&s.people.find(x=>x.id===m.via),about=sections.find(x=>x.title==='О человеке');
 if(via&&tieRolesSoc270.includes(via.role)&&Array.isArray(about?.rows))
  about.rows.splice(1,0,fact20('Родство',(p.gender==='f'?'Жена ':'Муж ')+roleGenitive268(via)+' — '+via.name));
 return sections;
};

// ---------- месяц ----------
function beforeMonthSoc270(){
 claimWeddingsSoc270();
 if(typeof events54==='function')for(const q of events54().invitations)if(q.travelInvite&&q.status==='offered')hostOffPartySoc270(q);
 for(const t of s.clock.tasks)if(t.kind==='business263'&&t.state==='paused')t.state=t.progress>0?'running':'planned';
}
function afterMonthSoc270(){
 const z=socialFix270();
 if(z.last>=s.clock.ticks)return;
 z.last=s.clock.ticks;
 claimWeddingsSoc270();
 weddingsDueSoc270();
 widowsSoc270();
 marriagesSoc270();
 weddingsPlanSoc270();
 occasionMemoriesSoc270();
 overworkSoc270();
}
autonomousMonth=function(...args){
 if(s&&!s.dead&&s.clock)beforeMonthSoc270();
 const r=socialFix270Base.autonomousMonth(...args);
 if(s&&!s.dead&&s.clock)afterMonthSoc270();
 return r;
};
