'use strict';

const cinemaScales191=['','Короткий метр','Независимый короткий метр','Малобюджетный полный метр','Сериал или студийный фильм','Крупный проект','Международный проект'];

function cinemaInvitationLevel191(level,quality,experience,random=Math.random){
 if(quality<55||experience<2)return 0;
 const jump=[0,.075,.12,.075,.04,.02][level]||0;
 const roll=random(),factor=.55+.45*(quality-55)/45;
 if(level<=4&&quality>=85&&experience>=4&&roll<.008*factor)return level+2;
 if(jump&&roll<jump*factor)return level+1;
 return level<=2&&roll<.20*factor?2:0;
}

function cinemaInvitation191(work){
 const x=creative47(),specialty=work.specialty184;
 if(work.track!=='cinema'||!specialties184.cinema[specialty]||s.dead||s.age<18||
   s.clock.ticks<(x.nextCinema191??0)||x.applications.some(a=>a.offer.sourceWork191&&a.status==='offered'))return;
 const experience=x.works.filter(w=>w.track==='cinema'&&w.specialty184===specialty&&w.quality>=55).length;
 const recognition=work.showcase198?.status;
 const boost=recognition==='winner'?12:recognition==='selected'?5:0;
 const level=cinemaInvitationLevel191(work.level184||1,Math.min(100,work.quality+boost),experience);
 if(!level)return;
 const workType=level===3&&Math.random()<.22?'Сериал · эпизод':cinemaScales191[level];
 const o={id:id16('cinema-invite'),track:'cinema',title:specialties184.cinema[specialty]+' · '+workType,
  country:s.country,kind:'invitation',sourceWork191:work.id,specialty184:specialty,level184:level,
  hours:Math.min(12,4+level),duration:level+1,fee:Math.round(c().wage*.013*level),language:2,
  skill:0,samples:0,quality:0,created:s.clock.ticks,expires:s.clock.ticks+3};
 if(creativeRights47(o).length||level16(country16[o.country][0])<o.language)return;
 x.applications.push({id:id16('creativeApp47'),offer:o,status:'offered',tick:s.clock.ticks,until:o.expires});
 x.nextCinema191=s.clock.ticks+6;
 log('Приглашение в новый проект','После работы «'+work.title+'» вам предложили проект «'+o.title+'». Ответить можно в разделе «Портфолио и заказы».','Творчество',true);
}

function cinemaPortfolio191(){
 const works=creative47().works.filter(w=>w.track==='cinema');
 return Object.entries(specialties184.cinema).flatMap(([id,label])=>{
  const count=works.filter(w=>w.specialty184===id).length;
  return count?[label+' · '+count]:[];
 }).join(', ');
}
