'use strict';
// Сборка 262, слой 3: творческие гонорары и рост.
//
// Было: гонорар задавался при создании предложения — c().wage·0.012 (первая ступень) или ·0.035 (вторая),
// у постоянного заказчика до +30%, в кино c().wage·0.013·уровень. Сороковая работа оплачивалась как первая.
// Уровень выше выпадал лотереей раз в три месяца: 27% / 13% / 8% / 4.5% / 2%.
// Стало (docs/ROADMAP.md, «Карьеры и прогрессия»):
// - одна кривая для всех творческих гонораров: × (1 + 0.6·log2(1 + работ/5)) × репутация;
//   «работ» — законченные работы в профиле (заказ — 1, своя работа для портфолио — 0.5);
// - репутация по профилю (s.reputation262, 0.8–3): растёт от хороших заказов, отборов и наград,
//   падает от провалов, без работы за год тает на 10% к 0.8; видна в меню профиля цифрой и словом;
// - повышение по порогу: три заказа уровня L с качеством от 55 в одной специализации — и при ближайшем
//   обновлении предложений (раз в три месяца) приходит заказ уровня L+1. Случайное раннее повышение осталось.

function reputation262(track){
 const r=s.reputation262??={};
 r[track]??={value:1,last:s.clock?.ticks??0,awards:{}};
 return r[track];
}

function reputationWord262(v){
 return v<1.1?'новичок':v<1.6?'знают в городе':v<2.2?'знают в профессии':v<2.7?'известное имя':'звезда страны';
}

function workCount262(track){
 return creative47().works.filter(w=>w.track===track).reduce((n,w)=>n+(w.kind==='paid'?1:.5),0);
}

function feeFactor262(track){
 return (1+.6*Math.log2(1+workCount262(track)/5))*reputation262(track).value;
}

function applyFee262(offer){
 if(!offer||offer.fee262||!offer.track)return offer;
 offer.fee=Math.round(offer.fee*feeFactor262(offer.track));
 offer.fee262=true;
 return offer;
}

// Рынок: порог повышения и кривая гонорара.
const creativeBriefBase262=creativeBrief184;
creativeBrief184=function(offer,tier,...args){
 const title=offer.title,fee=offer.fee,duration=offer.duration;
 const out=creativeBriefBase262.call(this,offer,tier,...args);
 if(tier&&out.track!=='cinema'&&specialties184[out.track]){
  const step=levelStep262(out.track);
  if(step&&(out.level184||1)<=step.level){
   const L=step.level;
   out.specialty184=step.key;
   out.level184=L+1;
   out.skill=Math.min(85,35+L*10);
   out.samples=Math.min(6,L+1);
   out.fee=Math.round(fee*(1+L*.6));
   out.duration=duration+L;
   out.title=specialties184[out.track][step.key]+' · '+title;
   out.step262=true;
  }
 }
 return applyFee262(out);
};

// Самый высокий уровень L, на котором в одной специализации три заказа с качеством от 55, а уровня L+1 ещё нет.
function levelStep262(track){
 const works=creative47().works.filter(w=>w.track===track&&w.kind==='paid'&&w.specialty184);
 let best=null;
 for(const key of Object.keys(specialties184[track]||{})){
  const mine=works.filter(w=>w.specialty184===key);
  const top=Math.max(0,...mine.map(w=>w.level184||1));
  if(!top||top>=6)continue;
  if(mine.filter(w=>(w.level184||1)===top&&w.quality>=55).length>=3&&(!best||top>best.level))best={key,level:top};
 }
 return best;
}

// Постоянные заказчики и кино создают предложения сами — тот же множитель.
if(typeof clientInvitation50==='function'){
 const clientInvitationBase262=clientInvitation50;
 clientInvitation50=function(...args){
  const a=clientInvitationBase262.apply(this,args);
  if(a?.offer)applyFee262(a.offer);
  return a;
 };
}
if(typeof cinemaInvitation191==='function'){
 const cinemaInvitationBase262=cinemaInvitation191;
 cinemaInvitation191=function(...args){
  const apps=creative47().applications,n=apps.length;
  const out=cinemaInvitationBase262.apply(this,args);
  for(const a of apps.slice(n))applyFee262(a.offer);
  return out;
 };
}

// Репутация: законченные заказы, провалы, отборы и награды, таяние без работы.
const finishTaskBase262=finishTask;
finishTask=function(t,...args){
 const n=creative47().works.length;
 const out=finishTaskBase262.call(this,t,...args);
 const w=creative47().works[n];
 if(w&&creative47().works.length>n&&w.kind==='paid'){
  const r=reputation262(w.track),before=r.value;
  r.value=Math.max(.8,Math.min(3,r.value+(w.quality>=35?.05*(w.quality-50)/50+.02*((w.level184||1)-1):-.1)));
  r.last=s.clock.ticks;
  if(w.quality<35)log('Провал',`«${w.title}» встречают холодно. Пару недель знакомые аккуратно не спрашивают, как дела.`,'Творчество',true);
  else if(reputationWord262(r.value)!==reputationWord262(before)&&r.value>before)
   log('Имя',reputationScene262(r.value),'Творчество',true);
 }
 return out;
};

function reputationScene262(v){
 return v<1.6?'В городе начинают узнавать вашу фамилию в титрах и афишах. Иногда звонят без рекомендации.':
  v<2.2?'Коллеги по цеху знают, кто вы. Приглашения приходят раньше, чем вы успеваете их искать.':
  v<2.7?'Ваше имя теперь само по себе аргумент в разговоре о бюджете.':
  `О вас пишут без пояснения, кто вы ${s.gender==='f'?'такая':'такой'}. Это одновременно приятно и немного пугает.`;
}

const autonomousMonthBase262=autonomousMonth;
autonomousMonth=function(...args){
 const out=autonomousMonthBase262.apply(this,args);
 if(s.dead||!s.reputation262&&!creative47().works.length)return out;
 const tick=s.clock.ticks;
 for(const w of creative47().works){
  const st=w.showcase198?.status;
  if(!['winner','selected'].includes(st))continue;
  const r=reputation262(w.track);
  if(r.awards[w.id])continue;
  r.awards[w.id]=st;
  r.value=Math.min(3,r.value+(st==='winner'?.25:.1));
  r.last=tick;
 }
 if(tick%12===0)for(const r of Object.values(s.reputation262||{}))if(tick-r.last>=12)r.value=.8+(r.value-.8)*.9;
 return out;
};

// Меню профиля: репутация цифрой и словом, во что она превращается.
const creativeTrackMenuBase262=creativeTrackMenu47;
creativeTrackMenu47=function(track,...args){
 const showBase=show;
 show=function(title,text,opts,...rest){
  const r=reputation262(track),f=feeFactor262(track);
  return showBase.call(this,title,text+`\nРепутация: ${reputationWord262(r.value)} (${r.value.toFixed(1)}). Гонорары сейчас ×${f.toFixed(1)} к начальным: опыт растёт с каждой работой, репутация — от хороших работ и наград и тает без работы.`,opts,...rest);
 };
 try{return creativeTrackMenuBase262.call(this,track,...args);}
 finally{show=showBase;}
};
