'use strict';

const showcases198={
 cinema:['Фестиваль независимого кино','Приз программы'],
 literature:['Литературный конкурс','Премия жюри'],
 finearts:['Кураторская выставка','Приз выставки'],
 music:['Музыкальный смотр','Приз программы'],
 theatre:['Фестиваль камерного театра','Приз жюри']
};

function showcaseResult198(quality,roll){
 return roll<Math.max(0,(quality-65)/200)?'winner':
  roll<Math.min(.80,.15+quality/140)?'selected':'rejected';
}

function submitShowcase198(id){
 const work=creative47().works.find(w=>w.id===id), event=showcases198[work?.track];
 if(!event||work.showcase198||work.quality<40||s.dead||s.age<16||
   s.clock.tasks.some(t=>t.kind==='showcase198'&&!['completed','cancelled'].includes(t.state)))return false;
 work.showcase198={status:'submitted',event:event[0]};
 task16('showcase198',event[0]+' · '+work.title,2,{work198:id,roll198:Math.random()},1);
 save();
 return true;
}

const showcaseBase198={finishTask,cancelTask};
finishTask=function(t){
 if(t.kind!=='showcase198')return showcaseBase198.finishTask(t);
 if(t.progress<t.duration||['completed','cancelled','paused'].includes(t.state))return;
 const work=creative47().works.find(w=>w.id===t.work198);
 if(s.dead||work?.showcase198?.status!=='submitted'){archiveTask05(t,'cancelled');save();return;}
 const status=showcaseResult198(work.quality,t.roll198);
 Object.assign(work.showcase198,{status,tick:s.clock.ticks});
 archiveTask05(t,'completed');
 const title=status==='winner'?showcases198[work.track][1]:status==='selected'?'Работа прошла отбор':'Работа не прошла отбор';
 log(title,work.showcase198.event+' · «'+work.title+'».','Творчество',true);
 if(status!=='rejected')cinemaInvitation191(work);
 save();
};
cancelTask=function(id){
 const task=s.clock.tasks.find(t=>t.id===id);
 if(task?.kind==='showcase198'&&!['completed','cancelled'].includes(task.state)){
  const work=creative47().works.find(w=>w.id===task.work198);
  if(work?.showcase198?.status==='submitted')work.showcase198.status='withdrawn';
 }
 return showcaseBase198.cancelTask(id);
};

function showcaseLabel198(work){
 const result=work.showcase198;
 if(!result)return '';
 return result.event+' · '+({submitted:'на рассмотрении',winner:showcases198[work.track][1],
  selected:'в программе',rejected:'отказ',withdrawn:'заявка отозвана'})[result.status];
}
