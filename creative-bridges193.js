'use strict';

// A completed work can introduce the author to a related craft.
const creativeBridges193={
 'literature:prose':['cinema','screenplay','Адаптация прозы для короткого метра'],
 'literature:drama':['cinema','screenplay','Сценарий по пьесе'],
 'cinema:screenplay':['theatre','drama','Инсценировка сценария'],
 'cinema:direction':['theatre','direction','Камерная постановка'],
 'theatre:acting':['cinema','acting','Роль в короткометражке'],
 'theatre:drama':['cinema','screenplay','Адаптация пьесы для кино'],
 'finearts:illustration':['publishing','layout','Иллюстрированное издание'],
 'music:composition':['music','soundtrack','Музыка к короткому метру'],
 'journalism:report':['literature','prose','Документальная проза']
};

function bridgeChance193(quality,count,targetSkill){
 if(quality<65||count<2||targetSkill<20)return 0;
 return Math.min(.12,.035+(quality-65)*.0015+Math.min(5,count-2)*.005);
}

function creativeBridge193(work){
 const route=creativeBridges193[work.track+':'+work.specialty184];
 if(!route||s.age<18||s.dead)return;
 const x=creative47();
 if(s.clock.ticks<(x.nextBridge193??0)||x.applications.some(a=>a.offer.bridge193&&a.status==='offered'))return;
 const [track,key,brief]=route;
 const count=x.works.filter(w=>w.track===work.track&&w.specialty184===work.specialty184&&w.quality>=65).length;
 const chance=bridgeChance193(work.quality,count,profileScore46(track));
 if(!chance||Math.random()>=chance)return;
 const offer={id:id16('creative-bridge'),track,title:brief,country:s.country,kind:'invitation',
  bridge193:true,sourceWork191:work.id,specialty184:key,level184:1,hours:5,duration:2,
  fee:Math.round(c().wage*.016),skill:20,samples:0,quality:0,language:key==='acting'?3:2,
  created:s.clock.ticks,expires:s.clock.ticks+3};
 if(creativeCheck47(offer).why.length)return;
 x.applications.push({id:id16('creativeApp47'),offer,status:'offered',tick:s.clock.ticks,until:offer.expires});
 x.nextBridge193=s.clock.ticks+9;
 log('Приглашение в смежный проект','Работа «'+work.title+'» привлекла внимание. В «Портфолио и заказах» появилось предложение «'+brief+'».','Творчество',true);
}
