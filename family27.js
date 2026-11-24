'use strict';
const kinRoles27=['Бабушка','Дедушка','Приёмный опекун','Мать','Отец','Брат','Сестра','Ребенок','Сын','Дочь','Внук','Внучка','Племянник','Племянница','Потомок','Родственник'];
function kin27(p){return kinRoles27.includes(p.role)||!!p.bio27;}
function familyState27(){if(!s)return null;s.family27??={version:1,last:s.clock.ticks,unions:[]};const f=s.family27;for(const p of s.people.filter(kin27)){if(p.bio27)continue;enrichPerson(p);p.bio27={parents:p.role==='Ребенок'?['player',...(p.parentId?[p.parentId]:[])]:p.parentId?[p.parentId]:[],children:[],history:[],education:[],study:null,job:null,skill:30,ambition:Math.random(),educationWish:Math.random(),childrenWish:p.childrenWish==='no'?0:Math.random(),last:s.clock.ticks,born:s.clock.ticks-p.age*12,health:90};if(['Мать','Отец'].includes(p.role))p.bio27.job={legacy:true,title:p.occupation,incomeRatio:p.finance17?.incomeRatio||.65};}
 if(!f.linked){f.linked=true;const ps=s.people.filter(p=>['Мать','Отец'].includes(p.role));for(const p of s.people.filter(p=>['Брат','Сестра'].includes(p.role)))p.bio27.parents=ps.map(p=>p.id);if(ps.length===2&&!s.family17?.childhood131)f.unions.push({id:id16('union27'),a:ps[0].id,b:ps[1].id,status:'together',since:s.clock.ticks,legacy:true});}
 for(const p of s.people.filter(kin27))for(const id of p.bio27.parents){const parent=s.people.find(q=>q.id===id);if(parent?.bio27&&!parent.bio27.children.includes(p.id))parent.bio27.children.push(p.id);}return f;}
function noteKin27(p,text){p.bio27.history.push({tick:s.clock.ticks,text});if(p.bio27.history.length>100)p.bio27.history.shift();if(p.bond>=55&&s.clock.ticks-(s.family27.lastNews??-100)>=6){s.family27.lastNews=s.clock.ticks;log(p.name+': новости',text,'Семья');}}
function birthKin27(union,adopt=false){familyState27();const a=living(union.a),b=living(union.b);if(!a||!b||(union.status!=='together'&&!(union.status==='separated'&&originalParents132(union)))||!Number.isFinite(union.due)||union.due>s.clock.ticks||union.finished===s.clock.ticks)return null;union.finished=s.clock.ticks;union.due=null;union.nextChild=s.clock.ticks+48;const role=['Мать','Отец'].includes(a.role)||['Мать','Отец'].includes(b.role)?'Сиблинг':['Брат','Сестра'].includes(a.role)||['Брат','Сестра'].includes(b.role)?'Племянник':'Потомок';const p=person(role,adopt?2:0,pick(['f','m']),a.country);p.role=role==='Сиблинг'?(p.gender==='f'?'Сестра':'Брат'):role==='Племянник'?(p.gender==='f'?'Племянница':'Племянник'):role;p.parentId=a.id;p.adopted49=adopt;p.birth49={method:adopt?'adoption':'birth',parents:adopt?[]:[a.id,b.id]};p.city18=a.city18||cities[a.country][0];if(!adopt&&typeof childBirthIdentity166==='function')childBirthIdentity166(p,[a,b]);s.people.push(p);familyState27();p.bio27.parents=[a.id,b.id];p.bio27.adopted=adopt;for(const parent of [a,b]){if(!parent.bio27.children.includes(p.id))parent.bio27.children.push(p.id);noteKin27(parent,(adopt?'В семье появился приёмный ребёнок: ':'Родился ребёнок: ')+p.name);}
 if(role==='Сиблинг'){
  const title=adopt?'В семье появился младший ребёнок':p.gender==='f'?'Родилась младшая сестра':'Родился младший брат';
  const text=p.name+' теперь в вашей семье.';
  if(typeof notice61==='function')notice61('parentCare136',title,text,{personId:p.id});
  else log(title,text,'Семья',true);
 }
 return p;}
function npcEligible27(p,job){return !job.required||p.bio27.education.some(d=>d.field===job.field&&['bachelor','master','phd'].indexOf(d.level)>=['bachelor','master','phd'].indexOf(job.required));}
// Gameplay distributions from family_circumstances_2021_game_config.json.
const familySize142={
 nl:{"low":[20.0,25.2,35.5,14.3,5.0],"middle":[20.0,25.2,35.5,14.3,5.0],"high":[20.8,25.5,35.1,13.8,4.8]},
 rs:{"low":[20.0,25.2,35.5,14.3,5.0],"middle":[22.6,26.3,34.2,12.7,4.2],"high":[24.3,26.9,33.4,11.8,3.6]},
 ru:{"low":[20.0,25.2,35.5,14.3,5.0],"middle":[22.6,26.3,34.2,12.7,4.2],"high":[24.3,26.9,33.4,11.8,3.6]},
 us:{"low":[17.6,24.0,36.5,15.8,6.1],"middle":[17.6,24.0,36.5,15.8,6.1],"high":[18.3,24.4,36.2,15.4,5.7]},
 br:{"low":[17.4,23.8,36.5,16.0,6.3],"middle":[20.0,25.2,35.5,14.3,5.0],"high":[21.6,25.9,34.8,13.3,4.4]},
 jp:{"low":[28.6,28.1,31.0,9.7,2.6],"middle":[28.6,28.1,31.0,9.7,2.6],"high":[29.6,28.3,30.4,9.3,2.4]},
 fr:{"low":[15.5,22.7,37.1,17.4,7.3],"middle":[15.5,22.7,37.1,17.4,7.3],"high":[16.3,23.2,36.9,16.8,6.8]},
 es:{"low":[31.9,28.8,29.0,8.3,2.0],"middle":[31.9,28.8,29.0,8.3,2.0],"high":[32.6,28.9,28.6,8.1,1.8]},
 de:{"low":[20.0,25.2,35.5,14.3,5.0],"middle":[20.0,25.2,35.5,14.3,5.0],"high":[20.8,25.5,35.1,13.8,4.8]},
 uk:{"low":[20.0,25.2,35.5,14.3,5.0],"middle":[20.0,25.2,35.5,14.3,5.0],"high":[20.8,25.5,35.1,13.8,4.8]},
 ca:{"low":[25.5,27.3,32.7,11.2,3.3],"middle":[25.5,27.3,32.7,11.2,3.3],"high":[26.4,27.6,32.2,10.8,3.0]},
 kr:{"low":[48.1,28.6,19.1,3.6,0.6],"middle":[48.1,28.6,19.1,3.6,0.6],"high":[49.0,28.5,18.6,3.4,0.5]},
 cn:{"low":[32.6,28.9,28.6,8.1,1.8],"middle":[35.5,29.2,26.8,7.0,1.5],"high":[37.1,29.3,25.8,6.5,1.3]},
 mx:{"low":[9.6,17.9,37.4,22.3,12.8],"middle":[11.8,19.9,37.7,20.4,10.2],"high":[13.2,21.0,37.6,19.2,9.0]},
 it:{"low":[28.6,28.1,31.0,9.7,2.6],"middle":[28.6,28.1,31.0,9.7,2.6],"high":[29.6,28.3,30.4,9.3,2.4]},
 au:{"low":[17.6,24.0,36.5,15.8,6.1],"middle":[17.6,24.0,36.5,15.8,6.1],"high":[18.3,24.4,36.2,15.4,5.7]},
 tr:{"low":[15.1,22.4,37.3,17.7,7.5],"middle":[17.6,24.0,36.5,15.8,6.1],"high":[19.3,24.8,35.8,14.7,5.4]},
 za:{"low":[5.0,12.3,34.0,26.8,21.9],"middle":[8.8,17.1,37.2,23.1,13.8],"high":[13.3,21.2,37.6,19.1,8.8]},
 th:{"low":[29.2,28.3,30.6,9.5,2.4],"middle":[31.9,28.8,29.0,8.3,2.0],"high":[33.7,29.0,27.9,7.7,1.7]},
 no:{"low":[20.0,25.2,35.5,14.3,5.0],"middle":[20.0,25.2,35.5,14.3,5.0],"high":[20.8,25.5,35.1,13.8,4.8]},
 in:{"low":[4.4,11.3,33.0,27.4,23.9],"middle":[13.7,21.4,37.5,18.8,8.6],"high":[20.8,25.5,35.1,13.8,4.8]},
 id:{"low":[5.0,12.3,34.0,26.8,21.9],"middle":[8.8,17.1,37.2,23.1,13.8],"high":[13.3,21.2,37.6,19.1,8.8]},
 eg:{"low":[1.3,5.1,22.4,28.1,43.1],"middle":[3.2,9.4,30.5,28.3,28.6],"high":[6.0,13.8,35.3,25.8,19.1]},
 ma:{"low":[4.1,10.9,32.4,27.6,25.0],"middle":[7.5,15.7,36.5,24.3,16.0],"high":[11.8,19.9,37.7,20.4,10.2]},
 pl:{"low":[25.8,27.4,32.6,11.1,3.1],"middle":[28.6,28.1,31.0,9.7,2.6],"high":[30.2,28.5,30.0,9.0,2.3]}
};
function familySizeTarget142(union,a,b){
 if(Number.isInteger(union.targetChildren142))return union.targetChildren142;
 const income=[a,b].reduce((total,p)=>total+(p.bio27.job?.incomeRatio??p.bio27.pension??0),0);
 const tier=income<1.1?'low':income>=2.6?'high':'middle';
 const weights=familySize142[a.country]?.[tier];
 if(!weights)return 3;
 let roll=Math.random()*weights.reduce((sum,weight)=>sum+weight,0);
 const index=weights.findIndex(weight=>(roll-=weight)<0);
 return union.targetChildren142=index<0?4:index;
}
function unionChildCount142(a,b){
 const children=new Set([...a.bio27.children,...b.bio27.children]);
 if([a.role,b.role].some(role=>['Мать','Отец'].includes(role)))children.add('player');
 return children.size;
}
function familyMonth27(){const f=familyState27();if(f.last>=s.clock.ticks)return;f.last=s.clock.ticks;
 if(s.age<18&&!s.dead){
  const union=f.unions.find(u=>u.status==='together'&&originalParents132(u));
  const parents=union&&[living(union.a),living(union.b)];
  const rate=familyRates133[s.country]?.separationPerThousand??0;
  if(parents?.every(p=>p?.country===s.country)&&rate>0&&chance(1-(1-rate/1000)**(1/12)))separateParents132(union);
 }for(const p of s.people.filter(kin27)){const b=p.bio27;if(!p.alive){b.job=null;b.study=null;continue;}b.skill=Math.min(100,b.skill+.05);if(p.age<18)continue;
 if(b.study){const st=b.study,pr=prog16(st.program),fee=pr.fee;if(p.privateCash>=fee&&p.country===pr.country){p.privateCash-=fee;st.progress++;if(st.progress>=pr.months){b.education.push({program:pr.id,field:pr.field,level:pr.level,year:s.year});noteKin27(p,'Получен диплом: '+programName26(pr));b.study=null;}}}
 if(s.clock.ticks%12!==0)continue;
 if(p.age>=67&&b.job){b.pension=b.job.incomeRatio*.38;b.job=null;p.occupation='Пенсия';noteKin27(p,'Завершена постоянная работа, назначена игровая пенсия.');}
 if(p.age<67&&!b.job&&!b.study){const pool=professions16.filter(j=>!j.license&&j.id!=='teacher'&&npcEligible27(p,j));if(chance(.45)){const job=pick(pool);b.job={profession:job.id,title:job.title,incomeRatio:job.salary,months:0};p.occupation=job.title;noteKin27(p,'Новая работа: '+job.title);}else if(b.educationWish>.5&&b.education.length===0){const pr=programs16.find(q=>q.country===p.country&&q.level==='bachelor'&&q.field===(b.ambition>.6?'computing':'education'));if(pr&&p.privateCash>pr.fee*6){b.study={program:pr.id,progress:0};noteKin27(p,'Началось обучение: '+programName26(pr));}}}
 if(b.job){b.job.months=(b.job.months||0)+12;if(chance(.04)){b.job=null;p.occupation='Поиск работы';noteKin27(p,'Работа закончилась; начат поиск.');}else if(b.ambition>.5&&chance(.12)){b.job.incomeRatio*=1.07;noteKin27(p,'Повышение оплаты труда на 7%.');}}
 }
 for(const u of f.unions){const a=living(u.a),b=living(u.b);if(!a||!b){if(u.status==='together')u.status='widowed';continue;}if(u.due&&u.due<=s.clock.ticks){birthKin27(u,u.adopt);continue;}if(s.clock.ticks%12||u.status!=='together'||u.due||s.clock.ticks<(u.nextChild||0))continue;const mother=[a,b].find(p=>p.gender==='f');if(!mother||mother.age<22||mother.age>42||Math.min(a.bio27.childrenWish,b.bio27.childrenWish)<.45||unionChildCount142(a,b)>=familySizeTarget142(u,a,b)||a.privateCash+b.privateCash<countries[a.country].cost*.3)continue;if(chance(.12)){u.due=s.clock.ticks+9;u.adopt=chance(.12);u.nextChild=s.clock.ticks+48;}}
}
const familyBase27={familyMonthly17,autonomousMonth,npcCard,personDetail};
familyMonthly17=function(){familyState27();for(const p of parents17()){const b=p.bio27;if(b)p.finance17.incomeRatio=p.alive?(b.job?.incomeRatio??b.pension??0):0;}familyBase27.familyMonthly17();parentSupport132();for(const p of s.people.filter(p=>kin27(p)&&p.alive&&p.age>=18&&!parents17().includes(p))){const b=p.bio27;if(b.walletTick===s.clock.ticks)continue;b.walletTick=s.clock.ticks;p.privateCash=Math.max(0,p.privateCash+(countries[p.country].wage*(b.job?.incomeRatio??b.pension??0)-countries[p.country].cost*.65)/12);}};
autonomousMonth=function(){familyBase27.autonomousMonth();familyMonth27();};
function biography27(id){familyState27();const p=s.people.find(p=>p.id===id);if(!p?.bio27)return;const b=p.bio27;nextDetail20={sections:[section20('Жизнь родственника',[fact20('Занятие',p.alive?p.occupation:'Умерший родственник'),fact20('Образование',b.education.map(d=>fields16[d.field].name+' · '+levels16[d.level]).join(', ')||'Ранее полученное образование не записано'),fact20('Учёба сейчас',b.study?programName26(prog16(b.study.program))+' · '+b.study.progress+' мес.':'Не учится'),fact20('Родители',b.parents.map(id=>s.people.find(p=>p.id===id)?.name||'Не записано').join(', ')||'Нет сведений'),fact20('Дети',familyChildNames200(p)||'Нет записанных детей')]),section20('Биография',b.history.slice(-15).map(h=>fact20('Месяц '+h.tick,h.text)))]};show(p.name,'',[{label:'Общение',fn:()=>familyBase27.personDetail(id)}]);}
npcCard=function(p,compact=false){const html=familyBase27.npcCard(p,compact);return kin27(p)?html.replace('</article>',`<button class="small" onclick="biography27('${esc(p.id)}')">Биография</button></article>`):html;};


function originalParents132(union) {
 return !!union?.legacy && [union.a,union.b].every(id=>s.people.some(p=>p.id===id&&['Мать','Отец'].includes(p.role)));
}

function separateParents132(union) {
 if(!originalParents132(union)||union.status!=='together')return false;
 const parents=[living(union.a),living(union.b)];
 if(!parents.every(Boolean))return false;
 const caregiver=parents.find(p=>p.id===s.housing.occupant)||parents.find(p=>p.country===s.country)||parents[0];
 const other=parents.find(p=>p!==caregiver);
 union.status='separated';
 union.changed55=s.clock.ticks;
 union.ended132={year:s.year,month:s.clock.month,age:s.age};
 for(const p of parents){
  const agency=adultState55(p);
  if(parents.some(other=>other!==p&&other.id===agency.partner))agency.partner=null;
  p.npcMarried54=false;
  p.unavailable18=false;
 }
 if(s.age<18){
  if(s.housing.mode==='parents'&&caregiver.country===s.country)s.housing.occupant=caregiver.id;
  s.family17.separation132={caregiverId:caregiver.id,otherParentId:other.id,
   contact:chance(.78),support:chance(.65),lastPaidTick:null};
  if(!s.family17.separation132.contact)other.bond=Math.min(other.bond,25);
 }
 const terms=s.family17.separation132;
 const text=parents.map(p=>p.name).join(' и ')+' развелись.'+(s.age<18?
  ' Вы остаётесь '+(caregiver.gender==='f'?'с мамой':'с папой')+' ('+caregiver.name+'). '+(terms.contact?'Со вторым родителем можно общаться.':'Регулярного общения со вторым родителем пока нет.')+
  (terms.support?' Предусмотрены алименты.':' Регулярных выплат пока нет.'):'');
 notice61('parentDivorce132','Родители развелись',text);
 return true;
}

function parentSupport132() {
 const terms=s.family17?.separation132||s.family17?.childhood131;
 if(!terms?.support||s.age>=18||s.dead||terms.lastPaidTick===s.clock.ticks)return;
 const payer=living(terms.otherParentId),recipient=living(terms.caregiverId);
 if(!payer||!recipient)return;
 const amount=Math.min(parentAvailable17(payer),countries[payer.country].wage*.08/12*fxRate86(payer.country));
 if(amount<=0)return;
 if(!transaction17({key:'parent-support:'+s.clock.ticks,purpose:'Алименты',initiator:payer.id,
  participants:[payer.id,recipient.id],parts:[{payer:payer.id,amount}]}))return;
 recipient.privateCash+=amount*fxRate86(s.country,recipient.country);
 terms.lastPaidTick=s.clock.ticks;
 terms.lastPaid=amount;
 terms.lastPaidCountry=s.country;
}

// Original parent links also apply to adult starts and existing saves.
function familyChildNames200(parent){
 const ids=new Set(parent.bio27?.children||[]);
 if(['Мать','Отец'].includes(parent.role)||s.family17?.adoption141?.parentId===parent.id)ids.add('player');
 return [...ids].map(id=>id==='player'?s:s.people.find(p=>p.id===id))
  .filter(Boolean).map(p=>p.surname&&!p.name.endsWith(' '+p.surname)?p.name+' '+p.surname:p.name).join(', ');
}
