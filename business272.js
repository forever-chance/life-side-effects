'use strict';
// Сборка 272: своё дело — по видам, люди на точках, удержание сотрудника, предупреждения до закрытия;
// книги — куда нести рукопись (отзывы владелицы из жизни издателя в Сиднее, 52 года). Данные — business272-data.js.
//
// 1. Вид дела (bzKind272): 24 профиля на 16 видов (у трёх исходных видов — по специальности: издательство не
//    фотостудия). Общие тексты событий 152/154/254/263/266 проходят через замены вида (bzText272) — у издательства
//    не «клиенты» и «наплыв покупателей после отзыва», а авторы, тиражи и рецензии; у кинотеатра — зрители.
//    Не приходят: «Партнёр предлагает новую точку», если расширение уже есть (так у владелицы набежали «три филиала»),
//    и «Крупный клиент не оплатил счёт» там, где крупных заказчиков со счетами не бывает.
// 2. Расширение по виду: второе помещение — только там, где оно имеет смысл (кафе, кинотеатр, магазин, салон…);
//    издательство запускает серию, студия собирает вторую команду, бюро — новый маршрут, производство — вторую
//    линию: без аренды, с расходами на запуск и своими людьми.
// 3. Люди на точках. Было: владелец «сам» считался полным рабочим местом в каждом своём деле, а сотрудники
//    филиала — ещё и в первой точке. Стало: на все дела у владельца одно рабочее место (часы делятся), сотрудники
//    распределяются между точками, точке нужно crew мест. Точка работает столько смен, на сколько хватает людей:
//    выручка почти пропорциональна покрытию, без людей точка закрыта (выручки нет, аренда идёт), недоукомплектованная
//    быстрее стареет. Владелец «сам» в единственном деле держит свою точку целиком — как в 263. Открыть второе дело
//    или точку без людей — с понятным предупреждением и предложением нанять; старые сохранения, где людей теперь
//    не хватает, — одно окно «Кто где работает» в первый месяц.
// 4. Сотрудник уходит: прибавка +10/20/35%, согласие зависит от размера прибавки, внешнего предложения, оплаты
//    против рынка, доверия и близости. Ответ — сразу в окне, в ленте с именем и в карточке дела (кто остался и за
//    сколько, кто ушёл и когда).
// 5. Закрытие только после предупреждения. Устойчивый минус (за год и за квартал) или запас меньше чем на полгода —
//    красный статус в карточке и пункт «Ожидают ответа» с причиной; пара сезонных месяцев в минусе — только заметка.
//    Когда деньги по нынешним цифрам кончатся за 3 месяца или появляется долг — датированное предупреждение
//    «через N мес. дело закроется, если…» с выбором: вложить деньги, сократить расходы, продать, закрыть самому.
//    До срока дело работает в долг поставщикам; закрытие — только в срок и со ссылкой на предупреждение. Один хороший
//    месяц предупреждение не снимает; если к сроку долга нет, срок сдвигается по нынешним цифрам (одной записью).
// 6. Книги: прежний издатель (охотнее, если вы у него издавались), новый издатель, своё издательство (без оплаты,
//    книга в каталоге, выручка — делу), самиздат. После отказа: другому издателю — через 2 месяца (было 6),
//    тому же — через 6, самиздат и своё издательство — сразу (было: тоже через 6).

// ---------- 0. Общее ----------
const bz272={with:null,ctx:null,credit:Math.pow(2,40)};
const bzIn272=['январе','феврале','марте','апреле','мае','июне','июле','августе','сентябре','октябре','ноябре','декабре'];
const bzOf272=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
function bzPlural272(n,one,few,many){const a=Math.abs(Math.round(n))%100,d=a%10;return a>10&&a<20?many:d===1?one:d>=2&&d<=4?few:many;}
function bzMonths272(n){n=Math.max(1,Math.round(n));return n+' '+bzPlural272(n,'месяц','месяца','месяцев');}
function bzDate272(tick){const n=s.year*12+(s.clock.month??0)+tick-s.clock.ticks;return {year:Math.floor(n/12),month:((n%12)+12)%12};}
function bzWhen272(tick){const d=bzDate272(tick);return 'в '+bzIn272[d.month]+' '+d.year;}
function bzSince272(tick){const d=bzDate272(tick);return 'с '+bzOf272[d.month]+' '+d.year;}
function bzMoney272(b,n){return money((Number(n)||0)*fxRate86(b.country));}
function bzOwned272(){try{return typeof ownedEnterprises168==='function'&&s?ownedEnterprises168():[];}catch(e){return [];}}
function bzById272(id){return bzOwned272().find(b=>b.id===id&&b.status==='active')||null;}
function bzDot272(t){t=String(t||'');return /\.$/.test(t)?t:t+'.';}
function bzCap272(t){t=String(t||'');return t.charAt(0).toUpperCase()+t.slice(1);}
function bzMode272(b){return typeof business263!=='undefined'&&business263.modes[b?.mode263]?b.mode263:'partial';}
function bzCases272(b){
 if(!b)return null;
 if(typeof businessState254==='function')return businessState254(b);
 const st=b.cases254??={};st.modifiers??=[];return st;
}

// ---------- 1. Вид дела и тексты ----------
const bzExpandDefault272={mode:'branch',acc:'вторую точку',nom:'вторая точка',cap:'Вторая точка',label:'Купить вторую точку',close:'Закрыть вторую точку',
 badge:'2 точки',closed:'вторая точка закрыта',where:'на второй точке',text:'Та же специализация и общий счёт, но своя аренда и свои люди.',
 log:['Бизнес стал сетью','куплена вторая точка.'],pitch:'Совладелец считает, что предприятие готово открыть вторую точку. Для этого потребуются вложения и новый персонал.'};
const bzSpecialties272={photo:'photo',design:'design',publishing:'publishing',hair:'salon',grooming:'grooming',repair:'repair',books:'bookshop',flowers:'florist',grocery:'grocery'};
const bzTypes272={food253:'food',leisure253:'leisure',trade253:'trade',mixed253:'mixed',craft253:'craft',farm253:'farm',service253:'service',
 lodging253:'lodging',creative253:'creative',rental253:'rental',production253:'production',tourism253:'tourism',studio:'photo',services:'repair',shop:'bookshop'};
function bzKind272(b){
 if(!b)return 'repair';
 const sp=b.specialty;
 if(b.school196||sp==='school196')return 'school';
 if(bzSpecialties272[sp])return bzSpecialties272[sp];
 const entry=typeof businessById253!=='undefined'?businessById253[sp]:null;
 const type=entry?.type||b.type;
 if(type==='culture253')return /Кинотеатр/.test(entry?.name||'')?'cinema':'theatre';
 return bzTypes272[type]||'repair';
}
const bzProfileCache272={};
function bzProfile272(b){const k=bzKind272(b);return bzProfileCache272[k]??=bzBuild272(k);}
function bzBuild272(k){
 const d=bzDefaults272,p=bzKinds272[k]||{};
 const prof={...d,...p,key:k,mode:{...d.mode,...(p.mode||{})},competitor:{...d.competitor,...(p.competitor||{})},
  slip:[p.slip?.[0]||d.slip[0],p.slip?.[1]||d.slip[1]],e254:p.e254||{},expand:{...bzExpandDefault272,...(p.expand||{})}};
 prof.custom=!!p.expand;
 prof.swaps=bzSwaps272(prof);
 return prof;
}
// «клиент» в общих текстах — словом вида, в нужном падеже. Только в общих текстах: события каталога 254,
// написанные для своего дела, не трогаем («Неожиданный крупный клиент» кафаны — заказчик банкета, не гость).
const bzClientRe272=/(^|[^А-Яа-яЁё])([Кк])лиент(ами|ам|ов|ом|ы|у|а)?(?![А-Яа-яЁё])/g;
const bzCase272={'':0,'а':1,'у':2,'ом':3,'ы':4,'ов':5,'ам':6,'ами':7};
function bzWho272(text,who){
 const f=bzWords272[who];if(!f)return text;
 return String(text).replace(bzClientRe272,(m,pre,k,suf)=>{const w=f[bzCase272[suf||'']];return pre+(k==='К'?bzCap272(w):w);});
}
function bzGeneric272(){
 const d=bzDefaults272,out=[d.busy,d.reno[1],d.reno[2],d.tired,d.firstYear[0],d.firstYear[1],d.slip[1],d.competitor.text,d.competitor.price,d.competitor.reno[1],'Клиент · '];
 if(typeof businessIndex254!=='undefined')for(const e of Object.values(businessIndex254)){
  if(e.businesses.length)continue;
  out.push(e.title,e.text,...e.choices.map(c=>c.label));
  for(const r of (typeof businessPlans254!=='undefined'?businessPlans254[e.kind]:null)||[])if(['competition','payment'].includes(e.kind))out.push(r[3],r[4]);
 }
 if(typeof enterpriseEvents153!=='undefined')for(const t of ['studio','services','shop'])for(const e of enterpriseEvents153[t]||[])out.push(e[0],e[1]);
 if(typeof clientStories154!=='undefined')for(const c of clientStories154)out.push(c[0],c[1]);
 return [...new Set(out.filter(t=>typeof t==='string'&&/лиент/.test(t)))];
}
function bzSwaps272(p){
 const d=bzDefaults272,out=new Map();
 const add=(a,b)=>{if(typeof a==='string'&&typeof b==='string'&&a&&a!==b&&!out.has(a))out.set(a,b);};
 add(d.busy,p.busy);add(d.idle,p.idle);add(d.ad[0],p.ad[0]);add('· '+d.ad[1],'· '+p.ad[1]);
 add(d.reno[2],p.reno[2]);add(d.reno[1],p.reno[1]);add(d.reno[0],p.reno[0]);add(d.tired,p.tired);
 add(d.firstYear[0],p.firstYear[0]);add(d.firstYear[1],p.firstYear[1]);
 for(const m of ['self','partial','manager'])add(d.mode[m],p.mode[m]);
 add(d.slip[0],p.slip[0]);add(d.slip[1],p.slip[1]);
 add(d.competitor.text,p.competitor.text);add(d.competitor.price,p.competitor.price);add(d.competitor.ad,p.competitor.ad);add(d.competitor.reno[1],p.competitor.reno[1]);
 add(d.landlord,p.landlord);
 if(typeof businessIndex254!=='undefined'){
  const plans=typeof businessPlans254!=='undefined'?businessPlans254:{};
  for(const [id,o] of Object.entries(p.e254||{})){
   const e=businessIndex254[id];if(!e)continue;
   add(e.title,o.title);add(e.text,o.text);
   (o.choices||[]).forEach((l,i)=>add(e.choices[i]?.label,l));
   (o.results||[]).forEach((r,i)=>{const t=plans[e.kind]?.[i];if(t){add(t[3],r[0]);add(t[4],r[1]);}});
  }
  const x=businessIndex254.E0402;
  if(x&&p.custom){add(x.title,'Совладелец предлагает '+p.expand.acc);add(x.text,p.expand.pitch);}
 }
 if(p.custom){add('Купить вторую точку',p.expand.label);add('Бизнес стал сетью',p.expand.log[0]);add('куплена вторая точка.',p.expand.log[1]);}
 if(p.who)for(const t of bzGeneric272())add(t,bzWho272(t,p.who));
 if(p.role!==d.role)add('Клиент · ',p.role+' · ');
 return [...out].sort((a,b)=>b[0].length-a[0].length);
}
function bzText272(b,text){
 if(typeof text!=='string'||!b)return text;
 let t=text;
 for(const [from,to] of bzProfile272(b).swaps)if(t.includes(from))t=t.split(from).join(to);
 return t;
}
// Пока идёт расчёт, окно или запись по делу b, окна и записи говорят словами его вида.
function bzWith272(b,fn,...args){
 if(typeof fn!=='function')return;
 if(!b)return fn(...args);
 const prev=bz272.with;bz272.with=b;
 try{return fn(...args);}finally{bz272.with=prev;}
}
const bzShowBase272=show;
show=function(title,text,opts=[],...rest){
 const b=bz272.with;
 if(!b)return bzShowBase272.call(this,title,text,opts,...rest);
 const t=x=>bzText272(b,x);
 return bzShowBase272.call(this,t(title),t(text),(opts||[]).map(o=>o&&typeof o==='object'?{...o,label:t(o.label),hint:t(o.hint),
  fn:typeof o.fn==='function'?(...a)=>bzWith272(b,o.fn,...a):o.fn}:o),...rest);
};
const bzLogBase272=log;
log=function(title,text,...rest){
 const b=bz272.with;
 // Закрытие ядром 263 после предупреждения (не должно случаться: до срока ядро не закрывает) — со ссылкой на него.
 if(b&&title==='Своё дело закрыто'&&b.final272&&typeof text==='string'&&!/Предупреждение пришло/.test(text))text+=' Предупреждение пришло '+bzWhen272(b.final272.at)+'.';
 return bzLogBase272.call(this,b?bzText272(b,title):title,b?bzText272(b,text):text,...rest);
};

// ---------- 2. События и истории по виду ----------
enterpriseStory154=function(business){
 const p=bzProfile272(business),tick=s.clock.ticks;
 if(tick-(business.lastStory154??-12)<3||!chance(.25))return;
 business.lastStory154=tick;
 if(chance(.5)){
  const [title,note]=p.story||enterpriseStories154[business.type]||enterpriseStories154.services;
  log(title,business.title+' · '+note,'Своё дело');
  return;
 }
 const clients=business.clients154??=[];
 const local=clients.map(living).filter(q=>q&&q.country===business.country&&q.city18===business.city);
 let client;
 if(local.length&&(!chance(.3)||clients.length>=3))client=pick(local);
 else if(clients.length<3){
  client=person('Клиент',rnd(22,65),undefined,business.country,business.city);
  client.city18=business.city;s.people.push(client);clients.push(client.id);
 }
 if(!client)return;
 const [title,note,trust]=pick(p.clients||clientStories154);
 rel(client,{trust});remember(client,note);
 log(title,business.title+' · '+client.name+'. '+note,'Своё дело');
};
// Издательство: свои события вместо «Крупного заказа» и «Срыва заказа» студии.
const bzEvent153Base272=enterpriseEvent153;
enterpriseEvent153=function(b,...a){
 const p=bzProfile272(b);
 if(!p.ev153||b.school196||(typeof businessById253!=='undefined'&&businessById253[b.specialty]))return bzEvent153Base272.call(this,b,...a);
 if(s.clock.ticks-(b.lastEvent153??-12)<4||!chance(.20))return null;
 const choices=p.ev153.concat(specialtyEvents153[b.specialty]?[specialtyEvents153[b.specialty]]:[]);
 const different=choices.filter(e=>e[0]!==b.previousEvent153);
 const event=pick(different.length?different:choices);
 b.lastEvent153=s.clock.ticks;b.previousEvent153=event[0];
 return event;
};
// События каталога 254: не приходят там, где им не место.
function bzOff272(b,e){
 if(!b||!e)return false;
 const p=bzProfile272(b);
 if((p.off254||[]).includes(e.id))return 'вид';
 if(e.kind==='expansion'&&b.branch159)return 'уже есть';
 if(e.kind==='payment'&&!p.b2b)return 'нет заказчиков со счетами';
 if(e.kind==='rent'&&b.ownPremises266)return 'своё помещение';
 return false;
}
if(typeof businessEligible254==='function'){
 const bz254Base272={eligible:businessEligible254,offer:businessOffer254,open:businessOpen254,journal:businessJournal254,apply:businessApply254,commit:businessCommit254,funding:businessFunding254};
 businessEligible254=function(b,e,...a){if(bzOff272(b,e))return false;return bz254Base272.eligible.call(this,b,e,...a);};
 businessOffer254=function(b,...a){return bzWith272(b,()=>bz254Base272.offer.call(this,b,...a));};
 businessApply254=function(b,...a){return bzWith272(b,()=>bz254Base272.apply.call(this,b,...a));};
 businessOpen254=function(id,...a){return bzWith272(businessCase254(id)?.b,()=>bz254Base272.open.call(this,id,...a));};
 businessCommit254=function(id,...a){return bzWith272(businessCase254(id)?.b,()=>bz254Base272.commit.call(this,id,...a));};
 businessJournal254=function(id,...a){return bzWith272(businessFind254(id),()=>bz254Base272.journal.call(this,id,...a));};
 businessFunding254=function(id,...a){return bzWith272(businessFind254(id),()=>bz254Base272.funding.call(this,id,...a));};
}
const bzModeBase272=setBusinessMode263;
setBusinessMode263=function(id,...a){return bzWith272(bzById272(id),()=>bzModeBase272.call(this,id,...a));};
const bzDevelopBase272=developEnterprise156;
developEnterprise156=function(id,...a){return bzWith272(bzById272(id),()=>bzDevelopBase272.call(this,id,...a));};

// ---------- 3. Люди на точках ----------
function bzNeed272(b){return bzProfile272(b).crew||1;}
// Владелец один: «сам» — одно рабочее место на все дела, где он сейчас есть; при нескольких делах часы делятся.
function bzOwnerShares272(){
 const list=bzOwned272().filter(b=>b.status==='active'&&businessPresent263(b));
 const req=list.map(b=>business263.modes[bzMode272(b)]?.units||0);
 const R=req.reduce((a,x)=>a+x,0),k=R>1?1/R:1;
 return {map:new Map(list.map((b,i)=>[b.id,req[i]*k])),R,k,count:req.filter(x=>x>0).length};
}
// Точка работает, только когда там кто-то есть. Покрытие — доля смен, на которые хватает людей: люди на точке / crew.
// Спрос закрытых смен теряется, под часы работы подстраиваются немногие (пол — 10% при любом покрытии выше нуля):
// половина смен — чуть больше половины выручки. Мощность — по людям, как в 263. Без людей точка закрыта: выручки нет,
// аренда и прочие расходы идут. Сверх этого недоукомплектованная точка быстрее стареет (свежесть 263).
function bzMult272(c){return c<=0?0:c>=1?1:.1+.9*c;}
function bzPct272(c){return Math.round(100*Math.max(0,Math.min(1,c)));}
// Владелец «сам», который не делит себя между делами, держит свою точку целиком, как в 263: он за прилавком
// с открытия до закрытия. Иначе каждый — своя доля рабочего места: частично — 0.45, доля владельца в нескольких
// делах, сотрудник — 1, управляющий — 1. Сотрудники — туда, где покрытие меньше, пока вторая точка не наберёт
// своё; дальше — в первую.
function bzPlan272(b,{branch=!!b?.branch159}={}){
 const need=bzNeed272(b),present=businessPresent263(b),mode=bzMode272(b);
 const sh=bzOwnerShares272(),share=present?(sh.map.get(b.id)??0):0,mgr=mode==='manager'?1:0;
 const whole=present&&mode==='self'&&sh.k>=1&&share>=1;
 const own=whole?need:share;
 const staff=enterpriseStaff155(b).map(p=>p.id),mainIds=[],branchIds=[];
 let main=own+mgr,br=0;
 for(const id of staff){
  if(branch&&br<need&&br<main){branchIds.push(id);br++;}
  else{mainIds.push(id);main++;}
 }
 const covMain=Math.min(1,main/need),covBranch=branch?Math.min(1,br/need):1;
 return {need,present,mode,share,whole,own,shares:sh,mgr,mainIds,branchIds,main,branch:br,covMain,covBranch,multMain:bzMult272(covMain),multBranch:bzMult272(covBranch)};
}
// Почему в первой точке никого: владельца нет на месте.
function bzAway272(){
 if(typeof travelActive52==='function'&&travelActive52())return 'вы в поездке';
 if(s.illness)return 'вы болеете';
 if(typeof enterpriseBlock152==='function'&&enterpriseBlock152())return 'вас нет на месте';
 return 'вы не в городе дела';
}
function bzUnitMode272(b){return !!b?.branch159?.unit272;}
function bzBranchWhere272(b){const x=bzProfile272(b).expand;return bzUnitMode272(b)||x.mode==='branch'?x.where:bzExpandDefault272.where;}
// Вторая точка (или серия, команда…) без людей.
function bzBranchIdle272(b){
 const x=bzProfile272(b).expand,own=bzUnitMode272(b)||x.mode==='branch',closed=own?x.closed:bzExpandDefault272.closed;
 if(!bzUnitMode272(b)&&/ закрыт[аоы]?$/.test(closed))return bzCap272(closed)+': некому работать.';
 return bzBranchName272(b)+' простаивает: некому работать.';
}
function bzBranchName272(b){
 const x=bzProfile272(b).expand;
 if(!b.branch159)return x.cap;
 return bzUnitMode272(b)||x.mode==='branch'?x.cap:bzExpandDefault272.cap;
}
function bzUnitQuote272(b){return Math.round(branchQuote159(b,'standard')*.4);}
function bzUnitMonthly272(b){
 const m=enterpriseMarket165(b,enterpriseSpaces157.standard);
 return Math.round(m?.5*m.overhead+.25*m.rent:enterpriseBaseCost157(b)*.35);
}

// Месяц точки: ядро 263 считает первую точку с долей владельца и её сотрудниками, вторую точку — этот файл.
// До срока последнего предупреждения ядро не закрывает дело: недостача уходит в долг (счёт дела ниже нуля).
const bzMonthBase272=enterpriseLocationMonth168;
enterpriseLocationMonth168=function(b,...args){
 if(!b||!s||s.dead||b.status!=='active'||!(b.last<s.clock.ticks))return bzMonthBase272.call(this,b,...args);
 const tick=s.clock.ticks,fin=b.final272;
 bzModelCheck272();
 bzStaffSync272(b);
 if(fin&&tick>=fin.until&&b.cash<0){bzCloseDebt272(b);return;}
 const plan=bzPlan272(b),cfg=business263.modes[plan.mode];
 // Покрытие ноль — мощность и так ноль (никого нет), спрос не трогаем: по нему считается вторая точка.
 const modMult=plan.covMain>0?plan.multMain:1;
 const c={b,tick,plan,modMult,staff:b.staff155,branch:b.branch159,mode:plan.mode,units:cfg?.units,credit:0,modifier:null,restored:false,branchIds:plan.branchIds};
 if(c.branch){b.staff155=plan.mainIds.slice();delete b.branch159;}
 if(cfg)cfg.units=plan.share;
 if(modMult<1){const st=bzCases272(b);if(st){c.modifier={case:'coverage272',until:tick,demand:modMult};st.modifiers.push(c.modifier);}}
 // Своё помещение (266): арендодателя нет — и предложения поднять аренду тоже (263 его всё равно присылал).
 if(b.ownPremises266){delete b.rentOffer159;c.ownPremises=true;c.lastRent=b.lastRentOffer159;b.lastRentOffer159=tick;}
 // Пока дело не закрыто по сроку предупреждения, ядро 263 его не закрывает: недостача уходит в долг.
 c.credit=bz272.credit;b.cash+=c.credit;
 const prev=bz272.ctx;bz272.ctx=c;
 let out;
 try{out=bzWith272(b,()=>bzMonthBase272.call(this,b,...args));}
 finally{bzRestore272(c);bz272.ctx=prev;}
 bzWith272(b,()=>bzAfterMonth272(b,c));
 return out;
};
function bzRestore272(c){
 if(!c||c.restored)return;
 c.restored=true;const b=c.b;
 if(c.branch){
  const now=b.staff155||[];
  b.staff155=(c.staff||[]).filter(id=>!(c.plan.mainIds.includes(id)&&!now.includes(id)));
  b.branch159=c.branch;
  if(b.status!=='active')for(const id of c.branchIds)if(b.staff155.includes(id))releaseEnterpriseStaff155(b,id);
 }
 const cfg=business263.modes[c.mode];if(cfg&&c.units!=null)cfg.units=c.units;
 if(c.modifier&&b.cases254?.modifiers)b.cases254.modifiers=b.cases254.modifiers.filter(m=>m!==c.modifier);
 if(c.ownPremises){if(c.lastRent===undefined)delete b.lastRentOffer159;else b.lastRentOffer159=c.lastRent;}
 if(c.credit){
  b.cash-=c.credit;
  const h=b.history?.at(-1);
  if(h&&h.tick===c.tick&&h.cash>=c.credit/2)h.cash-=c.credit;
  c.credit=0;
 }
}
// Ядро 263 зовёт businessTasks263() последним — до прибавок и ухода сотрудников в 266: здесь всё возвращается на место.
const bzTasksBase272=businessTasks263;
businessTasks263=function(...a){
 const c=bz272.ctx;if(c&&!c.restored)bzRestore272(c);
 const out=bzTasksBase272.apply(this,a);
 bzHours272();
 return out;
};
function bzHours272(){
 if(!s?.clock?.tasks)return;
 const sh=bzOwnerShares272();
 for(const t of s.clock.tasks){
  if(t.kind!=='business263')continue;
  const b=bzById272(t.business263),cfg=b&&business263.modes[bzMode272(b)];
  if(!cfg)continue;
  t.hours=cfg.units>0?Math.max(1,Math.round(cfg.hours*sh.k)):cfg.hours;
 }
}
function bzAfterMonth272(b,c){
 const h=b.history?.at(-1);
 if(!h||h.tick!==c.tick)return;
 bzStaffSync272(b);
 if(b.status!=='active'){delete b.final272;delete b.loss272;return;}
 if(c.branch&&b.branch159)bzBranchMonth272(b,c.plan,h,c.modMult);
 if(b.bookIncome272>0){const x=Math.round(b.bookIncome272);b.cash+=x;h.sales+=x;h.books272=x;b.bookIncome272=0;}
 for(const [id,v] of Object.entries(b.bonus266||{})){const w=enterpriseStaff155(b).find(p=>p.id===id);if(w&&v>0)w.privateCash=(w.privateCash||0)+v;}
 if(c.plan.covMain<1)b.fresh263=(b.fresh263??1)*(1-.02*(1-c.plan.covMain));
 h.cover272=+c.plan.covMain.toFixed(2);
 if(!c.plan.present)h.away272=true;
 h.cash=b.cash;
 if(b.final272&&c.tick>=b.final272.until&&b.cash<0){bzCloseDebt272(b);return;}
 bzWarn272(b);
}
function bzBranchMonth272(b,plan,h,modMult=plan.multMain){
 const unit=bzUnitMode272(b),W=businessW263(b),space=enterpriseSpace157(b);
 const bs=unit?enterpriseSpaces157.standard:enterpriseSpaces157[b.branch159.space]||enterpriseSpaces157.standard;
 const base=(h.demand263||0)/Math.max(.01,(space.demand||1)*(modMult||1));
 const demand=base*(unit?.8:bs.demand*.85)*plan.multBranch;
 const cap=plan.branch*(unit?1:bs.capacity)*(b.equipment156?1.12:1);
 const pricing=enterprisePrices156[b.prices156??'standard'],mod=k=>typeof businessModifier254==='function'?businessModifier254(b,k):1;
 const sales=Math.round(businessUnit263(b)*W*Math.min(demand,cap)*pricing.price*mod('price'));
 const market=enterpriseMarket165(b),bm=enterpriseMarket165(b,bs);
 const rent=unit?0:(bm?.rent??enterpriseBaseCost157(b)*.6*bs.rent);
 const over=(unit?bzUnitMonthly272(b):(bm?.overhead??enterpriseBaseCost157(b)*.22))*mod('overhead');
 const production=Math.round(sales*(bm?.variable??market?.variable??.3));
 const wage=enterpriseWage155(b),workers=plan.branchIds.map(living).filter(Boolean),payroll=wage*workers.length;
 for(const w of workers)w.privateCash=(w.privateCash||0)+wage;
 const costs=Math.round(rent+over+production)+payroll;
 b.cash+=sales-costs;
 Object.assign(h,{sales:h.sales+sales,costs:h.costs+costs,paid:h.paid+costs,branchSales:sales,branchRent:Math.round(rent),
  production:(h.production||0)+production,payroll:(h.payroll||0)+payroll,wagesPaid:(h.wagesPaid||0)+payroll,cash:b.cash,
  branch272:{units:plan.branch,cover:+plan.covBranch.toFixed(2),demand:+demand.toFixed(2),capacity:+cap.toFixed(2),costs}});
}

// ---------- 4. Расширение по виду ----------
function bzHireOption272(b,back){
 const staff=enterpriseStaff155(b),wage=enterpriseWage155(b);
 return {label:'Нанять сотрудника',hint:bzMoney272(b,wage)+'/мес.'+(staff.length>=3?' · команда уже полная':''),
  disabled:staff.length>=3||b.cash<wage*(staff.length+1)*2,fn:()=>{selectEnterprise168(b.id);if(!hireEnterprise155(b.id))toast('Проверьте резерв на две зарплаты и то, что вы в городе дела.');back();}};
}
branchMenu159=function(b){
 if(!b)return;
 return bzWith272(b,()=>{
  if(b.branch159)return bzBranchManage272(b);
  const x=bzProfile272(b).expand,staff=enterpriseStaff155(b),block=enterpriseMoveBlock157(b);
  const plan=bzPlan272(b,{branch:true}),back=()=>branchMenu159(b);
  const lines=[x.text];
  if(!staff.length)lines.push('Работать там некому: в деле нет ни одного сотрудника. Сначала наймите людей — вы сами останетесь на первой точке.');
  else if(!plan.branchIds.length)lines.push('Все сотрудники нужны на первой точке: '+x.where+' работать будет некому. Наймите ещё людей.');
  else{
   const names=plan.branchIds.map(id=>living(id)?.name).filter(Boolean).join(', ');
   lines.push(bzCap272(x.where)+' будет работать '+names+'.'+(plan.covBranch<1?' Одного человека мало: '+x.nom+' будет работать примерно на '+bzPct272(plan.covBranch)+'%.':'')+
    (plan.covMain<1?' На первой точке людей не хватит — она будет работать примерно на '+bzPct272(plan.covMain)+'%.':''));
  }
  if(x.mode==='unit'){
   const price=bzUnitQuote272(b),monthly=bzUnitMonthly272(b);
   lines.push('Запуск — '+bzMoney272(b,price)+', дальше — около '+bzMoney272(b,monthly)+' в месяц плюс зарплаты.');
   return show(x.cap,lines.join('\n'),[
    {label:x.label,hint:bzMoney272(b,price)+' со счёта дела',disabled:!staff.length||b.cash<price||!!block,
     fn:()=>{if(bzBuyUnit272(b.id))enterpriseMenu152();else toast(block||'Сейчас это недоступно.');}},
    bzHireOption272(b,back),{label:'Назад',fn:enterpriseMenu152}]);
  }
  show(x.cap,lines.join('\n'),[
   ...Object.entries(enterpriseSpaces157).map(([key,space])=>({label:space.name,
    hint:bzMoney272(b,branchQuote159(b,key))+' · аренда '+bzMoney272(b,enterpriseRent157(b,space))+'/мес.',
    disabled:b.cash<branchQuote159(b,key)||!staff.length||!!block,
    fn:()=>{if(buyBranch159(b.id,key))enterpriseMenu152();else toast(block||'Покупка сейчас недоступна.');}})),
   bzHireOption272(b,back),{label:'Назад',fn:enterpriseMenu152}]);
  enterpriseFacadeGallery166(b,Object.keys(enterpriseSpaces157),true);
 });
};
const bzBuyBranchBase272=buyBranch159;
buyBranch159=function(id,key,...a){
 const b=s.enterprise152;
 if(b&&bzProfile272(b).expand.mode==='unit')return false;
 return bzWith272(b,()=>bzBuyBranchBase272.call(this,id,key,...a));
};
function bzBuyUnit272(id){
 const b=s.enterprise152;
 if(!b||b.id!==id||b.status!=='active'||b.branch159||bzProfile272(b).expand.mode!=='unit'||enterpriseMoveBlock157(b)||!enterpriseStaff155(b).length)return false;
 const price=bzUnitQuote272(b);
 if(b.cash<price)return false;
 b.cash-=price;
 b.branch159={space:'standard',price,opened:s.clock.ticks,unit272:true};
 const x=bzProfile272(b).expand;
 log(x.log[0],b.title+' · '+x.log[1],'Работа',true);
 save();render();return true;
}
function bzBranchManage272(b){
 return bzWith272(b,()=>{
  const x=bzProfile272(b).expand,unit=bzUnitMode272(b),plan=bzPlan272(b),h=b.history?.at(-1),name=bzBranchName272(b);
  const people=plan.branchIds.map(id=>living(id)?.name).filter(Boolean);
  const legacy=!unit&&x.mode==='unit';
  const lines=[name+(unit?'':' · '+enterpriseSpaces157[b.branch159.space]?.name)+'.',
   people.length?(legacy?'Там':bzCap272(x.where))+' работают: '+people.join(', ')+'.':'Работать там некому: все сотрудники нужны на первой точке.',
   h?.branch272?'За прошлый месяц: выручка '+bzMoney272(b,h.branchSales)+', расходы '+bzMoney272(b,h.branch272.costs)+'.':''];
  const close=legacy?bzExpandDefault272.close:x.close,closed=legacy?bzExpandDefault272.closed:x.closed;
  show(name,lines.filter(Boolean).join('\n'),[
   bzHireOption272(b,()=>bzBranchManage272(b)),
   {label:close,hint:unit?'Её расходы прекратятся со следующего месяца':'Аренда прекратится со следующего месяца; вложенное не вернуть',
    fn:()=>show(close+'?',b.title+' · '+closed+'. Сотрудники остаются в деле.',[
     {label:close,fn:()=>{if(bzCloseBranch272(b.id,closed))enterpriseMenu152();}},
     {label:'Назад',fn:()=>bzBranchManage272(b)}])},
   {label:'Назад',fn:enterpriseMenu152}]);
 });
}
function bzCloseBranch272(id,closed){
 const b=bzById272(id);
 if(!b?.branch159)return false;
 delete b.branch159;
 log('Дело сократилось',b.title+' · '+(closed||bzProfile272(b).expand.closed)+'.','Своё дело',true);
 save();render();return true;
}

// ---------- 5. Сотрудники: прибавка, кто остался, кто ушёл ----------
function bzStaffLog272(b,p,event,extra={}){
 const id=typeof p==='string'?p:p?.id,who=typeof p==='string'?(s.people.find(x=>x.id===p)||null):p;
 if(!b||!id)return;
 (b.staffLog272??=[]).push({id,name:who?.name||'',g:who?.gender||'',event,tick:s.clock.ticks,...extra});
 b.staffLog272=b.staffLog272.slice(-40);
}
// Кто был в деле в прошлый раз (staffSeen272) и кого нет сейчас — ушёл, каким бы путём: уход 266, замена
// в событии 254 «Найти», закрытие. Первый раз — только запомнить состав.
function bzStaffSync272(b,before){
 if(!b)return;
 const now=b.staff155||[],seen=[...new Set([...(before||[]),...(b.staffSeen272||[])])];
 if(before||Array.isArray(b.staffSeen272))for(const id of seen)if(!now.includes(id)){
  bzStaffLog272(b,id,b.status==='active'?'left':'closed');
  if(b.bonus266)delete b.bonus266[id];
 }
 b.staffSeen272=[...now];
}
const bzHireBase272=hireEnterprise155;
hireEnterprise155=function(id,...a){
 const b=s?.enterprise152,before=[...(b?.staff155||[])];
 const ok=bzHireBase272.call(this,id,...a);
 if(ok&&b){
  for(const pid of b.staff155||[])if(!before.includes(pid))bzStaffLog272(b,s.people.find(p=>p.id===pid),'hired',{pay:enterpriseWage155(b)});
  bzStaffSync272(b);
 }
 return ok;
};
const bzDismissBase272=dismissEnterprise155;
dismissEnterprise155=function(bid,wid,...a){
 const b=s?.enterprise152,p=s?.people.find(x=>x.id===wid);
 const ok=bzDismissBase272.call(this,bid,wid,...a);
 if(ok&&b){
  bzStaffLog272(b,p||wid,'dismissed');if(b.bonus266)delete b.bonus266[wid];
  if(Array.isArray(b.staffSeen272))b.staffSeen272=b.staffSeen272.filter(id=>id!==wid);
  bzStaffSync272(b);
 }
 return ok;
};
// Шанс остаться: прибавка против внешнего предложения, оплата против рынка, доверие и близость.
function bzStay272(b,p,cur,r,outside){
 const offer=cur*(1+r/100),gap=offer/Math.max(1,outside),wage=enterpriseWage155(b)||1;
 const trust=p.inner?.trust??50,bond=p.bond??40;
 const mood=Math.max(-.2,Math.min(.2,(trust-50)/250+(bond-40)/300));
 const market=Math.max(-.1,Math.min(.1,(cur/wage-1)*.3));
 return Math.max(.05,Math.min(.95,.62+2*(gap-1)+mood+market));
}
function bzChanceWords272(pr){return pr>=.75?'скорее всего останется':pr>=.5?'может остаться':pr>=.3?'вряд ли, но шанс есть':'почти наверняка всё равно уйдёт';}
function bzLeave272(q){
 const b=bzById272(q.businessId),p=living(q.personId);
 if(!b||!p||!(b.staff155||[]).includes(p.id)){
  if(b&&b.leaving266?.id===q.personId)delete b.leaving266;
  s.pending.shift();save();render();if(s.pending.length)resolvePending();return;
 }
 return bzWith272(b,()=>{
  const wage=enterpriseWage155(b),cur=wage+(b.bonus266?.[p.id]||0);
  q.outside272??=Math.round(cur*(1.08+Math.random()*.25));
  const offers=[10,20,35].map(r=>{
   const pay=Math.round(cur*(1+r/100)),pr=bzStay272(b,p,cur,r,q.outside272);
   return {label:'Предложить +'+r+'% · '+bzMoney272(b,pay)+'/мес.',hint:bzChanceWords272(pr),fn:()=>bzLeaveAnswer272(b,p,r,pay,pr)};
  });
  show('Сотрудник уходит',p.name+': «Мне предложили место получше. Я не хочу уходить со скандалом — просто говорю заранее».\nСейчас '+p.name+' получает '+bzMoney272(b,cur)+' в месяц.',[
   ...offers,
   {label:'Отпустить',hint:'Через месяц рук станет меньше',fn:()=>{
    s.pending.shift();bzStaffLog272(b,p,'released');
    log('Сотрудник уходит',b.title+' · '+p.name+' доработает месяц.','Своё дело');
    save();render();if(s.pending.length)resolvePending();}}
  ]);
 });
}
function bzLeaveAnswer272(b,p,r,pay,pr){
 s.pending.shift();
 const ok=Math.random()<pr,f=p.gender==='f',wage=enterpriseWage155(b);
 if(ok){
  (b.bonus266??={})[p.id]=Math.max(0,pay-wage);delete b.leaving266;rel(p,{trust:3});
  bzStaffLog272(b,p,'raise',{pay,pct:r});
  log('Сотрудник остаётся',b.title+' · '+p.name+' остаётся за '+bzMoney272(b,pay)+' в месяц (+'+r+'%).','Своё дело',true);
 }else{
  bzStaffLog272(b,p,'refused',{pay,pct:r});
  log('Сотрудник уходит',b.title+' · '+p.name+': прибавка +'+r+'% не помогла, через месяц место будет свободно.','Своё дело',true);
 }
 save();render();
 const next=()=>{if(s.pending.length)resolvePending();};
 const staff=enterpriseStaff155(b);
 show(p.name,ok?(f?'Согласилась':'Согласился')+' остаться за '+bzMoney272(b,pay)+' в месяц. Прибавка — с этого месяца.':
  'Всё равно уходит: надбавка не помогла. Через месяц '+p.name+' освободит место.',[
  ...(ok?[]:[{label:'Нанять замену заранее',hint:bzMoney272(b,wage)+'/мес.',disabled:staff.length>=3||b.cash<wage*(staff.length+1)*2,
   fn:()=>{selectEnterprise168(b.id);if(!hireEnterprise155(b.id))toast('Проверьте резерв на две зарплаты и то, что вы в городе дела.');next();}}]),
  {label:'Хорошо',fn:next}]);
}
function bzStaffLines272(b){
 const x=bzProfile272(b).expand,plan=bzPlan272(b),wage=enterpriseWage155(b),hist=b.staffLog272||[],lines=[];
 const team=enterpriseStaff155(b).map(p=>{
  const bonus=b.bonus266?.[p.id]||0,raise=[...hist].reverse().find(e=>e.id===p.id&&e.event==='raise');
  return p.name+' — '+bzMoney272(b,wage+bonus)+'/мес.'+(raise?' (прибавка +'+raise.pct+'% '+bzSince272(raise.tick)+')':bonus>0?' (с прибавкой)':'')+
   (plan.branchIds.includes(p.id)?', '+(bzUnitMode272(b)||x.mode==='branch'?x.where:bzExpandDefault272.where):'');
 });
 if(team.length)lines.push(bzDot272('Команда: '+team.join('; ')));
 const gone=hist.filter(e=>['left','dismissed','closed'].includes(e.event)).slice(-4).map(e=>{
  const refused=hist.some(r=>r.id===e.id&&r.event==='refused'&&r.tick<=e.tick&&e.tick-r.tick<=2);
  const went=e.g==='f'?'ушла':'ушёл';
  return e.name+' — '+(e.event==='dismissed'?'вы отпустили '+bzWhen272(e.tick):went+' '+bzWhen272(e.tick))+(refused?' (прибавка не помогла)':'');
 });
 if(gone.length)lines.push(bzDot272('Ушли: '+gone.join('; ')));
 return lines;
}

// ---------- 6. Предупреждения до закрытия ----------
// Прогноз: дальше месяцы идут как последние (полгода и год, в первый год — квартал), по кругу — в прежнем порядке
// и от последнего месяца назад; берётся худший (у издательства владелицы убыток рос: по полугоду в прежнем порядке
// деньги «кончались» на полгода позже, чем на деле). runway — первый месяц, который счёт дела уже не оплатит:
// 1 — следующий, 0 — долг уже есть, Infinity — за два года денег не кончится.
// Уровни:
//  final — долг или деньги кончатся за 3 месяца: датированное предупреждение, закрытие только в этот срок;
//  loss  — устойчивый минус (за год или с открытия, и за последний квартал) или запаса меньше чем на полгода:
//          красный статус, пункт «Ожидают ответа», запись в ленте;
//  ramp  — первый год (263: спрос с 35%), минус, но запаса больше чем на полгода: заметка в карточке;
//  dip   — пара месяцев в минусе, а за год дело в плюсе (сезон): заметка в карточке, без тревоги.
// Предупреждение снимается, только когда дело в безопасности: долга нет, квартал в плюсе и запаса больше чем на полгода.
function bzProject272(pls,cash){
 if(cash<0)return 0;
 const run=list=>{let c=cash;for(let m=1;m<=24&&list.length;m++){const pl=list[(m-1)%list.length];if(c+pl<0)return m;c+=pl;}return Infinity;};
 return Math.min(run(pls),run([...pls].reverse()));
}
function bzH272(b){const t=b.history?.at(-1)?.tick??s.clock.ticks;return bzHealth272(b.history,b.cash,t-(b.opened159??t-99));}
function bzHealth272(hist,cash,age=Infinity){
 hist=hist||[];
 const all=hist.map(h=>(h.sales||0)-(h.costs||0)),n=all.length;
 const last3=all.slice(-3),sum3=last3.reduce((a,x)=>a+x,0),sumY=all.slice(-12).reduce((a,x)=>a+x,0);
 let streak=0;for(let i=n-1;i>=0&&all[i]<0;i--)streak++;
 const debt=cash<0?Math.round(-cash):0;
 const runway=n?Math.min(bzProject272(all.slice(-(age<12?3:6)),cash),age>=12&&n>=12?bzProject272(all.slice(-12),cash):Infinity):Infinity;
 // «В среднем −X в месяц»: за серию месяцев в минусе (не меньше квартала, не больше года).
 const win=all.slice(-Math.min(12,Math.max(3,streak))),avg=win.reduce((a,x)=>a+x,0)/Math.max(1,win.length),negs=last3.filter(x=>x<0);
 const burn=avg<0?Math.max(1,Math.round(-avg)):negs.length?Math.max(1,Math.round(-negs.reduce((a,x)=>a+x,0)/negs.length)):0;
 const losing=n>=3&&sumY<0&&sum3<0;
 const concern=n>=2&&sum3<0&&runway<=6;
 // Снять последнее предупреждение: денег больше чем на полгода и запас хотя бы на два худших месяца из последних шести
 // (иначе при чередовании плохих и хороших месяцев угроза «миновала» бы после каждого хорошего).
 const worst=Math.max(0,-Math.min(0,...all.slice(-6)));
 const relief=!debt&&runway>6&&cash>=2*worst,safe=relief&&sum3>=0;
 const level=debt>0||n>=2&&runway<=3&&(sum3<0||streak>0)?'final':
  losing||concern?(age<12&&runway>6?'ramp':'loss'):
  sum3<0||streak>=2?(age<12?'ramp':sumY>=0?'dip':'ok'):'ok';
 return {level,losing,concern,relief,safe,streak,burn,worst,runway,debt,cash,age,sum3,sumY,months:Math.min(12,n)};
}
// Срок последнего предупреждения: месяц, который счёт уже не оплатит, но не раньше чем через два месяца.
function bzFinalMonths272(hl){return hl.debt||!(hl.runway>=3)?2:3;}
function bzCause272(b){
 const h=b.history?.at(-1);if(!h)return '';
 const sh=bzOwnerShares272();
 if(h.cover272===0)return 'Точка закрыта: некому работать'+(h.away272?' — '+bzAway272():'')+'. Выручки нет, а аренда и расходы идут.';
 if(h.branch272&&h.branch272.units===0)return bzBranchIdle272(b)+(bzUnitMode272(b)?' Расходы идут без выручки.':' Аренда и расходы там идут без выручки.');
 if(h.cover272!=null&&h.cover272<1)return 'Людей не хватает: '+(sh.count>1?'вас делят '+sh.count+' '+bzPlural272(sh.count,'дело','дела','дел')+', а ':'')+'на точке меньше людей, чем ей нужно: она работает примерно на '+bzPct272(h.cover272)+'%, место стареет.';
 if(h.branch272&&h.branchSales<h.branch272.costs)return bzCap272(bzBranchName272(b))+' не окупается: выручка '+bzMoney272(b,h.branchSales)+', расходы '+bzMoney272(b,h.branch272.costs)+' в месяц.';
 if(h.capacity263&&h.demand263<h.capacity263*.7)return 'Работы меньше, чем рук: зарплаты и аренда не окупаются.';
 if(h.sales&&h.rent+h.branchRent>h.sales*.35)return 'Аренда съедает '+Math.round(100*(h.rent+(h.branchRent||0))/h.sales)+'% выручки.';
 if(bzMode272(b)==='manager')return 'Управляющий обходится дороже, чем приносит дело.';
 return '';
}
function bzRunwayText272(hl){
 if(hl.debt)return 'Денег на счёте нет: долг поставщикам и арендодателю — ';
 if(!(hl.runway<=24))return 'Запаса на счёте хватит надолго, но лучше разобраться сейчас.';
 if(hl.runway>12)return 'Запаса на счёте хватит больше чем на год.';
 if(hl.runway<=1)return 'Денег на счёте не хватит даже на следующий месяц.';
 return 'Запаса на счёте хватит примерно на '+bzMonths272(hl.runway-1)+'.';
}
function bzReason272(b,hl=bzH272(b)){
 const parts=[];
 if(hl.burn&&(hl.losing||hl.concern||hl.level==='final'))parts.push((hl.streak>=2?'В минусе '+bzMonths272(hl.streak)+' подряд':'В минусе')+': в среднем −'+bzMoney272(b,hl.burn)+' в месяц.');
 parts.push(hl.debt?bzRunwayText272(hl)+bzMoney272(b,hl.debt)+'.':bzRunwayText272(hl));
 const cause=bzCause272(b);if(cause)parts.push(cause);
 return parts.join(' ');
}
// Статусы дела: деньги (final / loss / ramp / dip) и люди (staff). В карточке — оба, в панели — главный.
function bzStatuses272(b){
 if(!b||b.status!=='active')return [];
 const hl=bzH272(b),t=s.clock.ticks,out=[],h=b.history?.at(-1);
 if(b.final272){
  const left=b.final272.until-t;
  out.push({level:'final',until:b.final272.until,label:'Закроется '+bzWhen272(b.final272.until)+', если ничего не изменить',
   text:(left>0?'Дело закроется '+bzWhen272(b.final272.until)+', если ничего не изменить.':'Дело закроется в этом месяце, если денег не хватит.')+' '+bzReason272(b,hl)});
 }else if(hl.level==='loss'||hl.level==='final')out.push({level:'loss',label:'Дело в минусе',text:bzReason272(b,hl)});
 else if(hl.level==='ramp')out.push({level:'ramp',label:'Первый год: пока в минусе',text:'Первый год: дело ещё набирает обороты и пока в минусе — в среднем −'+bzMoney272(b,hl.burn)+' в месяц. '+bzRunwayText272(hl)});
 else if(hl.level==='dip')out.push({level:'dip',label:'',text:'В минусе '+bzMonths272(Math.max(1,hl.streak))+' подряд, но за '+bzMonths272(hl.months)+' дело в плюсе: '+bzMoney272(b,hl.sumY)+'. Похоже на сезон.'});
 const closed=h?.cover272===0||h?.branch272&&h.branch272.units===0;
 if(h?.cover272!=null&&h.cover272<1||closed)out.push({level:'staff',label:closed?'Точка закрыта: некому работать':'Людей не хватает',text:bzCause272(b)});
 return out.map(x=>({...x,label:bzText272(b,x.label),text:bzText272(b,x.text)}));
}
const bzRank272={final:5,loss:4,staff:3,ramp:2,dip:1};
function bzStatus272(b){return bzStatuses272(b).sort((x,y)=>bzRank272[y.level]-bzRank272[x.level])[0]||null;}
function bzRed272(st){return st&&(st.level==='final'||st.level==='loss');}
function bzWarn272(b){
 const t=s.clock.ticks,hl=bzH272(b),fin=b.final272;
 if(fin){
  // Снимается, только когда до закрытия далеко: долга нет и денег по нынешним цифрам хватит больше чем на полгода
  // (ставится — при трёх месяцах). «Выправилось» — если к тому же последний квартал в плюсе; иначе (вложили деньги)
  // остаётся красный статус «Дело в минусе».
  if(hl.relief){
   if(hl.safe)log('Дело выправилось',b.title+' · угроза закрытия миновала: долга нет, последние месяцы в плюсе, запаса на счёте больше чем на полгода.','Своё дело',true);
   else log('Угроза закрытия отступила',b.title+' · '+bzRunwayText272(hl)+' Но дело всё ещё в минусе.','Своё дело',true);
   b.finalLast272={at:fin.at,until:fin.until,cleared:t};delete b.final272;
   if(hl.safe)delete b.loss272;else b.loss272??={at:t};
   return;
  }else{
   // Срок настал, а долга нет: денег хватило дольше, чем казалось. Новый срок — по нынешним цифрам (не раньше чем
   // через два месяца), одной записью без окна: закрытие всегда приходится на последний названный срок.
   if(t>=fin.until){
    const n=Math.max(2,Math.min(3,hl.runway));
    fin.until=t+n;fin.moved=(fin.moved||0)+1;
    log('Срок сдвинулся',b.title+' · денег хватило дольше, чем казалось, но угроза не миновала: дело закроется '+bzWhen272(fin.until)+', если ничего не изменить. '+bzReason272(b,hl),'Своё дело',true);
   }
   b.loss272??={at:t};
   return;
  }
 }
 if(hl.level==='final'){
  b.loss272??={at:t};
  const n=bzFinalMonths272(hl),prev=b.finalLast272,again=prev&&t-prev.cleared<=6;
  // Снова под угрозой вскоре после того, как выправилось: срок прежний, если он ещё впереди, и без нового окна.
  const until=again&&prev.until>t?prev.until:t+n;
  b.final272={at:t,until};
  log('Дело может закрыться',b.title+' · через '+bzMonths272(until-t)+', '+bzWhen272(until)+', дело закроется, если ничего не изменить. '+bzReason272(b,hl),'Своё дело',true);
  if(!(t-(b.finalPopup272??-99)<=6)&&!s.pending.some(q=>q.type==='bzFinal272'&&q.businessId===b.id)){b.finalPopup272=t;s.pending.push({type:'bzFinal272',businessId:b.id});}
  return;
 }
 if(hl.level==='loss'){
  if(!b.loss272){
   b.loss272={at:t};
   if(t-(b.lossLog272??-99)>=6){b.lossLog272=t;log('Дело в минусе',b.title+' · '+bzReason272(b,hl),'Своё дело',true);}
  }
  return;
 }
 // Красный статус уходит, только когда последний квартал снова в плюсе.
 if(b.loss272&&hl.sum3>=0)delete b.loss272;
}
function bzCloseDebt272(b){
 const debt=Math.round(-b.cash),when=b.final272?bzWhen272(b.final272.at):'';
 b.cash=0;b.status='closed';
 for(const q of b.cases254?.cases||[])if(['offered','proposal','saleProposal','scheduled'].includes(q.status)&&typeof businessCancel254==='function')businessCancel254(b,q);
 const before=[...(b.staff155||[])];
 for(const id of before)releaseEnterpriseStaff155(b,id);
 bzStaffSync272(b,before);
 log('Своё дело закрыто',b.title+' · долг '+bzMoney272(b,debt)+' не погашен к сроку.'+(when?' Предупреждение пришло '+when+'.':''),'Работа',true);
 delete b.final272;delete b.loss272;
 businessTasks263();save();
}
// Закрыть самому или продать: долг дела закрывается вместе с ним, остаток счёта — по долям.
const bzCloseBase272=closeEnterprise152;
closeEnterprise152=function(id,...a){
 const b=s?.enterprise152;let debt=0;
 if(b&&b.id===id&&b.status==='active'&&b.cash<0){debt=-b.cash;b.cash=0;}
 const before=[...(b?.staff155||[])];
 const ok=bzWith272(b,()=>bzCloseBase272.call(this,id,...a));
 if(ok&&b){bzStaffSync272(b,before);delete b.final272;delete b.loss272;}
 else if(debt&&b)b.cash=-debt;
 return ok;
};
function bzSalePrice272(b){
 const m=enterpriseMarket165(b);
 return Math.max(0,Math.round((m?.startup??enterpriseBaseCost157(b)*6)*.3*(b.fresh263??1)*Math.min(1.2,b.fit263??1)));
}
function bzSell272(id){
 const b=bzById272(id);if(!b)return false;
 const price=bzSalePrice272(b),staff=[...(b.staff155||[])];
 b.cash=Math.max(0,b.cash+price);
 selectEnterprise168(b.id);
 const logBase=log;
 log=function(title,text,...rest){
  if(title==='Своё дело закрыто'&&String(text).startsWith(b.title))return logBase.call(this,'Своё дело продано',b.title+' · покупатель заплатил '+bzMoney272(b,price)+' и забрал дело вместе с долгами и людьми.',...rest);
  return logBase.call(this,title,text,...rest);
 };
 let ok;
 try{ok=closeEnterprise152(b.id);}finally{log=logBase;}
 if(ok){b.sold272=s.clock.ticks;for(const pid of staff){const w=living(pid);if(w)w.occupation='Сотрудник · '+b.title;}}
 return ok;
}
function bzDeposit272(id,amount){
 const b=bzById272(id);if(!b||!(amount>0))return false;
 const price=amount*fxRate86(b.country);
 if(s.cash<price)return false;
 s.cash-=price;b.cash+=amount;
 bzCases272(b)?.ledger?.push({id:id16('bz-deposit272'),tick:s.clock.ticks,amount,note:'Вклад владельца',country:b.country});
 log('Деньги в дело',b.title+' · вы вносите '+bzMoney272(b,amount)+' из личных средств.','Своё дело');
 bzWarn272(b);save();render();return true;
}
function bzWarnMenu272(b,fromPending=false){
 if(!b||b.status!=='active')return;
 return bzWith272(b,()=>{
  const hl=bzH272(b),fin=b.final272,t=s.clock.ticks,lines=[];
  if(fin&&fin.until>t)lines.push('Через '+bzMonths272(fin.until-t)+', '+bzWhen272(fin.until)+', дело «'+b.title+'» закроется, если ничего не изменить.');
  else if(fin)lines.push('Срок предупреждения прошёл: дело «'+b.title+'» закроется в первый же месяц, когда не хватит денег.');
  else lines.push('Дело «'+b.title+'» теряет деньги.');
  lines.push(bzReason272(b,hl));
  lines.push('На счёте дела — '+bzMoney272(b,b.cash)+'. Личные деньги — '+money(s.cash)+'.');
  show(fin?'Дело может закрыться':'Дело в минусе',lines.join('\n'),[
   {label:'Вложить деньги',hint:'Из личных средств на счёт дела',fn:()=>bzDepositMenu272(b)},
   {label:'Сократить расходы',hint:'Люди, вторая точка, помещение, управляющий',fn:()=>bzCutMenu272(b)},
   {label:'Продать дело',hint:'Покупатель даёт '+bzMoney272(b,bzSalePrice272(b))+(hl.debt?' и берёт долги на себя':''),fn:()=>bzSellMenu272(b)},
   {label:'Закрыть дело самому',hint:'Остаток счёта — по долям',fn:()=>show('Закрыть дело?',b.title+' прекратит работу. Остаток счёта распределится по долям'+(hl.debt?', долг закроется вместе с делом':'')+'.',[
    {label:'Закрыть',fn:()=>{selectEnterprise168(b.id);closeEnterprise152(b.id);}},{label:'Назад',fn:()=>bzWarnMenu272(b)}])},
   {label:'Открыть дело',fn:()=>{if(selectEnterprise168(b.id))enterpriseMenu152();}},
   {label:fromPending?'Решить позже':'Назад',hint:fin?'Предупреждение останется в «Ожидают ответа»':'',fn:()=>{if(fromPending&&s.pending.length)resolvePending();}}
  ]);
 });
}
function bzDepositMenu272(b){
 const hl=bzH272(b),h=b.history?.at(-1),rate=fxRate86(b.country);
 const burn=Math.max(hl.burn,Math.round((h?.costs||0)*.15),1);
 const amounts=[...new Set([hl.debt+burn*3,hl.debt+burn*6].map(x=>Math.max(1,Math.round(x))))];
 show('Вложить деньги','Деньги уйдут на счёт дела. Если для этого взять личный кредит, долг останется вашим даже после закрытия дела.',[
  ...amounts.map((a,i)=>({label:'Внести '+bzMoney272(b,a),hint:(i===0?(hl.debt?'долг и запас на три месяца':'запас на три месяца'):'запас на полгода')+' · у вас '+money(s.cash),
   disabled:s.cash<a*rate,fn:()=>{if(bzDeposit272(b.id,a))bzWarnMenu272(b);else toast('Не хватает личных денег.');}})),
  {label:'Рассмотреть личный кредит',fn:financeMenu},
  {label:'Назад',fn:()=>bzWarnMenu272(b)}
 ]);
}
function bzCutMenu272(b){
 return bzWith272(b,()=>{
  const x=bzProfile272(b).expand,wage=enterpriseWage155(b),t=s.clock.ticks,opts=[];
  if(b.branch159){
   const close=bzUnitMode272(b)||x.mode==='branch'?x.close:bzExpandDefault272.close;
   const closed=bzUnitMode272(b)||x.mode==='branch'?x.closed:bzExpandDefault272.closed;
   opts.push({label:close,hint:'Минус её аренда и расходы',fn:()=>{if(bzCloseBranch272(b.id,closed))bzCutMenu272(b);}});
  }
  for(const p of enterpriseStaff155(b))opts.push({label:'Отпустить · '+p.name,hint:'−'+bzMoney272(b,wage+(b.bonus266?.[p.id]||0))+'/мес. · рук станет меньше',
   fn:()=>{selectEnterprise168(b.id);dismissEnterprise155(b.id,p.id);bzCutMenu272(b);}});
  if(bzMode272(b)==='manager')opts.push({label:'Вести дело самому',hint:'Без оклада управляющему · '+bzMoney272(b,Math.round(businessW263(b)*1.3))+'/мес.',
   fn:()=>{setBusinessMode263(b.id,'self');bzCutMenu272(b);}});
  if((b.space157??'standard')!=='compact')opts.push({label:'Переехать в помещение поменьше',hint:'Аренда ниже, но и места меньше',
   fn:()=>{if(selectEnterprise168(b.id))enterprisePremisesMenu157(b);}});
  const cut=(b.cases254?.modifiers||[]).some(m=>m.case==='cut272'&&m.until>=t);
  opts.push({label:'Урезать расходы на 3 месяца',hint:cut?'Уже урезаны':'Прочие расходы −20%, работы тоже меньше',disabled:cut,fn:()=>{
   bzCases272(b).modifiers.push({case:'cut272',until:t+3,overhead:.8,demand:.9});
   log('Расходы урезаны',b.title+' · на три месяца: меньше закупок, короче часы работы.','Своё дело');save();bzCutMenu272(b);}});
  opts.push({label:'Назад',fn:()=>bzWarnMenu272(b)});
  show('Сократить расходы','Что можно урезать прямо сейчас. Каждое решение действует со следующего месяца.',opts);
 });
}
function bzSellMenu272(b){
 const price=bzSalePrice272(b),net=Math.max(0,b.cash+price),share=b.partner158?.share??0;
 show('Продать дело','Покупатель готов забрать «'+b.title+'» как есть'+(b.cash<0?', вместе с долгами,':'')+' и заплатить '+bzMoney272(b,price)+
  '. Вам после расчёта — '+bzMoney272(b,net*(1-share))+(share?' (с учётом доли совладельца)':'')+'. Сотрудники переходят к новому владельцу.',[
  {label:'Продать',fn:()=>{if(!bzSell272(b.id))toast('Продать сейчас не получилось.');}},
  {label:'Назад',fn:()=>bzWarnMenu272(b)}]);
}

// ---------- 7. Карточка дела и панель ----------
function bzReserve272(b){
 const branch=b.branch159&&enterpriseSpaces157[b.branch159.space],market=enterpriseMarket165(b),bm=branch&&enterpriseMarket165(b,branch);
 const extra=bm?bm.rent+bm.overhead:branch?enterpriseBaseCost157(b)*(.6*branch.rent+.22):0;
 const reserve=Math.round((extra+(market?.overhead??enterpriseBaseCost157(b)*.4)*(b.equipment156?1.04:1)+enterpriseRent157(b))*2)+enterpriseWage155(b)*enterpriseStaff155(b).length*2;
 return Math.min(Math.max(0,b.cash),reserve);
}
function bzCardText272(b,text){
 const x=bzProfile272(b).expand,unit=bzUnitMode272(b),plan=bzPlan272(b),lines=[];
 let t=String(text||'').replace(/\/мес\.\./g,'/мес.');
 if(b.branch159){
  const label=unit?x.badge:(x.mode==='branch'?x.badge+': '+x.nom:'две точки')+' — '+(enterpriseSpaces157[b.branch159.space]?.name||'').toLowerCase();
  t=t.replace(/ · сеть из двух точек\. Точка 2 — [^·]+?(?= · )/,' · '+label);
 }
 const task=s.clock.tasks?.find(q=>q.kind==='business263'&&q.business263===b.id);
 if(task&&plan.shares.k<1)t=t.replace(/\((\d+) ч\/нед\.\)\./,'(около '+task.hours+' ч/нед.: вас делят '+plan.shares.count+' '+bzPlural272(plan.shares.count,'дело','дела','дел')+').');
 lines.push(...bzStaffLines272(b));
 if(plan.covMain<=0)lines.push('Точка закрыта: некому работать — '+bzAway272()+(enterpriseStaff155(b).length?', а все сотрудники '+bzBranchWhere272(b):', сотрудников нет')+'. Выручки нет, а аренда и расходы идут.');
 else if(plan.covMain<1)lines.push('На точку людей не хватает: ей нужно около '+String(plan.need).replace('.',',')+' рабочего места, а есть '+String(+plan.main.toFixed(2)).replace('.',',')+'. Она работает примерно на '+bzPct272(plan.covMain)+'%, место стареет быстрее.');
 if(b.branch159&&plan.branch===0)lines.push(bzBranchIdle272(b)+(bzUnitMode272(b)?' Расходы идут без выручки.':' Аренда и расходы там идут без выручки.'));
 else if(b.branch159&&plan.covBranch<1)lines.push(bzCap272(bzBranchName272(b))+': людей не хватает — работает примерно на '+bzPct272(plan.covBranch)+'%.');
 const cat=b.catalogue272||[];
 if(cat.length)lines.push('Ваши книги в каталоге: '+cat.slice(-5).map(e=>'«'+e.title+'»').join(', ')+'.');
 return t+(lines.length?'\n'+lines.join('\n'):'');
}
function bzCardOpts272(b,opts){
 const out=[],status=bzStatus272(b),x=bzProfile272(b).expand,plan=bzPlan272(b),wage=enterpriseWage155(b);
 const red=bzStatuses272(b).find(bzRed272);
 if(red)out.push({label:red.level==='final'?'Дело может закрыться':'Дело в минусе',hint:'Причина и что можно сделать',fn:()=>bzWarnMenu272(b)});
 for(const o of opts){
  if(!o){out.push(o);continue;}
  if(o.label==='Купить вторую точку'&&b.branch159)continue;
  if(/^Сотрудник · /.test(o.label)){
   const p=enterpriseStaff155(b).find(w=>o.label==='Сотрудник · '+w.name);
   if(p){const pay=wage+(b.bonus266?.[p.id]||0);out.push({...o,hint:bzMoney272(b,pay)+'/мес.'+(plan.branchIds.includes(p.id)?' · '+(bzUnitMode272(b)||x.mode==='branch'?x.where:bzExpandDefault272.where):'')});continue;}
  }
  if(o.label==='Нанять сотрудника'&&(plan.covMain<1||plan.covBranch<1)){out.push({...o,hint:o.hint+' · людей не хватает'});continue;}
  if(o.label==='Перевести остаток сверх резерва себе'){
   const fn=o.fn;
   out.push({...o,fn:()=>{
    const hl=bzH272(b),left=bzReserve272(b),after=bzHealth272(b.history,left,hl.age);
    if(!(hl.burn&&(hl.losing||after.concern||after.level==='final')))return fn();
    show('Перевести деньги себе?','После перевода на счёте дела останется '+bzMoney272(b,left)+'. Дело теряет в среднем '+bzMoney272(b,hl.burn)+' в месяц. '+bzRunwayText272(after),[
     {label:'Перевести',fn},{label:'Назад',fn:enterpriseMenu152}]);
   }});
   continue;
  }
  out.push(o);
 }
 if(b.branch159){
  const i=out.findIndex(o=>o?.label==='Мои предприятия и сети');
  out.splice(Math.max(0,i),0,{label:bzBranchName272(b),hint:'Люди, выручка, закрыть',fn:()=>bzBranchManage272(b)});
 }
 return out;
}
// Для других экранов («Моя работа»): статус дела и подпись расширения по виду.
function bzBadge272(b){
 if(!b?.branch159)return '';
 const x=bzProfile272(b).expand;
 return bzUnitMode272(b)||x.mode==='branch'?x.badge:'две точки';
}
function bzStatusHTML272(st){
 if(!st)return '';
 if(Array.isArray(st))return st.map(bzStatusHTML272).join('');
 return '<p class="'+(bzRed272(st)?'bz-warn272':'bz-note272')+'">'+esc(st.text)+'</p>';
}
const bzMenuBase272=enterpriseMenu152;
enterpriseMenu152=function(...args){
 const b=s?.enterprise152;
 if(b?.status!=='active')return bzMenuBase272.apply(this,args);
 return bzWith272(b,()=>{
  const showBase=show;
  show=function(title,text,opts=[],...rest){
   show=showBase;
   const out=showBase.call(this,title,bzCardText272(b,text),bzCardOpts272(b,opts||[]),...rest);
   try{const h2=$('#modal').querySelector?.('h2');const html=bzStatusHTML272(bzStatuses272(b));if(h2&&html)h2.insertAdjacentHTML('afterend',html);}catch(e){}
   return out;
  };
  try{return bzMenuBase272.apply(this,args);}finally{show=showBase;}
 });
};
if(typeof enterprisePanel152==='function'){
 const bzPanelBase272=enterprisePanel152;
 enterprisePanel152=function(...a){
  let html=bzPanelBase272.apply(this,a);
  try{
   const parts=html.split('<button type="button" class="home-portrait59');
   html=parts[0]+parts.slice(1).map(chunk=>{
    const id=/data-id="([^"]*)"/.exec(chunk)?.[1]||'';
    const net=(s.enterpriseNetworks168||[]).find(n=>n.id===id);
    const list=net?bzOwned272().filter(b=>net.ids.includes(b.id)&&b.status==='active'):[bzOwned272().find(b=>b.id===id&&b.status==='active')].filter(Boolean);
    if(!list.length)return chunk;
    const st=list.map(bzStatus272).filter(x=>x&&x.label).sort((a,b)=>bzRank272[b.level]-bzRank272[a.level])[0];
    if(!net&&list[0].branch159){
     const b=list[0],x=bzProfile272(b).expand;
     const badge=bzUnitMode272(b)||x.mode==='branch'?bzCap272(x.badge):'Две точки';
     chunk=chunk.replace(/<span>Сеть · 2 точки<\/span>/,'<span>'+esc(badge)+'</span>');
    }
    if(st)chunk=chunk.replace(/<\/span><\/button>/,'<span class="'+(bzRed272(st)?'bz-warn272':'bz-note272')+'">'+esc(st.label)+'</span></span></button>');
    return chunk;
   }).join('<button type="button" class="home-portrait59');
  }catch(e){}
  return html;
 };
}
(function bzStyle272(){
 if(typeof document==='undefined'||document.getElementById('bz-style272'))return;
 const st=document.createElement('style');st.id='bz-style272';
 st.textContent='.bz-warn272{color:var(--red);font-weight:600}.bz-note272{color:var(--muted)}#modal p.bz-warn272,#modal p.bz-note272{margin:.3em 0 .6em}';
 document.head.appendChild(st);
})();

// ---------- 8. Открыть ещё одно дело: вас на всех не хватит ----------
function bzOthersHere272(){return bzOwned272().filter(b=>b.status==='active'&&businessPresent263(b)&&(business263.modes[bzMode272(b)]?.units||0)>0);}
function bzOpeningWarn272(others){
 const o=others[0],n=others.length+1;
 return 'Вы уже ведёте '+(others.length>1?others.length+' '+bzPlural272(others.length,'дело','дела','дел'):'«'+o.title+'»')+' сами. На '+n+' '+bzPlural272(n,'дело','дела','дел')+
  ' вас не хватит: каждое получит часть ваших часов, и без сотрудников новое дело будет работать вполсилы. Наймите людей сразу после открытия или передайте '+(others.length>1?'одно из дел':'«'+o.title+'»')+' управляющему.';
}
if(typeof enterpriseSpecialtyMenu153==='function'){
 const bzSpecialtyBase272=enterpriseSpecialtyMenu153;
 enterpriseSpecialtyMenu153=function(type,additional=false,...a){
  const others=bzOthersHere272();
  if(!others.length)return bzSpecialtyBase272.call(this,type,additional,...a);
  const showBase=show;
  show=function(title,text,opts=[],...rest){
   show=showBase;
   return showBase.call(this,title,text,(opts||[]).map(o=>o&&typeof o.fn==='function'&&o.label!=='Назад'?{...o,fn:(...x)=>{
    const inner=show;
    show=function(t2,x2,o2,...r2){show=inner;return inner.call(this,t2,x2+'\n'+bzOpeningWarn272(others),o2,...r2);};
    try{return o.fn(...x);}finally{show=inner;}
   }}:o),...rest);
  };
  try{return bzSpecialtyBase272.call(this,type,additional,...a);}finally{show=showBase;}
 };
}
const bzStartBase272=startEnterprise152;
startEnterprise152=function(...args){
 const others=bzOthersHere272().map(b=>b.id),had=new Set(bzOwned272().map(b=>b.id));
 const ok=bzStartBase272.apply(this,args);
 if(ok&&s.enterprise152&&!had.has(s.enterprise152.id))s.enterprise152.model272=s.clock.ticks;
 if(ok&&others.length&&s.enterprise152&&!others.includes(s.enterprise152.id))s.pending.push({type:'bzHire272',businessId:s.enterprise152.id,others});
 return ok;
};
// Дело из сохранения до 272: сотрудник второй точки считался и в первой, а владелец «сам» — целиком в каждом своём
// деле. В первый месяц 272 по таким делам, где людей теперь не хватает, — одно окно: кто где работает и что сделать.
function bzModelCheck272(){
 if(!s||s.dead)return;
 const list=bzOwned272().filter(b=>b.status==='active'&&b.model272==null);
 if(!list.length)return;
 for(const b of list)b.model272=s.clock.ticks;
 const hit=list.filter(b=>{
  const p=bzPlan272(b),shared=p.share>0&&p.shares.count>1&&p.shares.k<1;
  return (b.branch159&&!b.branch159.unit272||shared)&&(p.covMain<1||!!b.branch159&&p.covBranch<1);
 });
 if(hit.length&&!s.pending.some(q=>q.type==='bzModel272'))s.pending.push({type:'bzModel272',ids:hit.map(b=>b.id)});
}
function bzWhoWhere272(b){
 const p=bzPlan272(b),name=id=>living(id)?.name,mgr=p.mgr?['управляющий']:[];
 const you=p.share>0?[p.whole?'вы':p.mode==='partial'&&p.shares.k>=1?'вы полдня':'вы часть дня']:[];
 const main=[...you,...mgr,...p.mainIds.map(name).filter(Boolean)],br=p.branchIds.map(name).filter(Boolean);
 const pct=c=>c<=0?'закрыта: некому работать':c<1?'работает примерно на '+bzPct272(c)+'%':'работает в полную силу';
 if(!b.branch159)return '«'+b.title+'»: на точке — '+(main.length?main.join(', '):'никого')+', она '+pct(p.covMain)+'.';
 return '«'+b.title+'»: в первой точке — '+(main.length?main.join(', '):'никого')+', она '+pct(p.covMain)+'; '+bzBranchWhere272(b)+' — '+(br.length?br.join(', '):'никого')+', '+
  (p.branch===0?'там некому работать':p.covBranch<1?'работает примерно на '+bzPct272(p.covBranch)+'%':'в полную силу')+'.';
}
function bzModelMenu272(q){
 s.pending.shift();save();
 const list=(q.ids||[]).map(bzById272).filter(Boolean),next=()=>{if(s.pending.length)resolvePending();};
 if(!list.length)return next();
 const b=list[0];
 return bzWith272(b,()=>{
  const sh=bzOwnerShares272();
  const lines=['Один человек не может стоять в двух местах сразу: точка работает, только когда там кто-то есть.'];
  if(sh.count>1&&sh.k<1)lines.push('Вас делят '+sh.count+' '+bzPlural272(sh.count,'дело','дела','дел')+': каждому достаётся часть ваших часов.');
  lines.push(...list.map(bzWhoWhere272));
  const h=b.history?.at(-1);
  if(h)lines.push('«'+b.title+'» за прошлый месяц: выручка '+bzMoney272(b,h.sales)+', расходы '+bzMoney272(b,h.costs)+'.');
  const opts=[];
  opts.push({...bzHireOption272(b,()=>{}),label:'Нанять сотрудника в «'+b.title+'»',fn:()=>{selectEnterprise168(b.id);if(!hireEnterprise155(b.id))toast('Проверьте резерв на две зарплаты и то, что вы в городе дела.');next();}});
  if(b.branch159){
   const x=bzProfile272(b).expand,own=bzUnitMode272(b)||x.mode==='branch';
   opts.push({label:own?x.close:bzExpandDefault272.close,hint:bzUnitMode272(b)?'Расходы прекратятся со следующего месяца':'Аренда прекратится со следующего месяца; вложенное не вернуть',
    fn:()=>{bzCloseBranch272(b.id,own?x.closed:bzExpandDefault272.closed);next();}});
  }
  if(bzMode272(b)!=='manager')opts.push({label:'Передать «'+b.title+'» управляющему',hint:bzMoney272(b,Math.round(businessW263(b)*1.3))+'/мес. · управляющий весь день на месте',
   fn:()=>{setBusinessMode263(b.id,'manager');next();}});
  if(bzMode272(b)==='partial'&&sh.k>=1)opts.push({label:'Вести «'+b.title+'» самому',hint:business263.modes.self.hint,fn:()=>{setBusinessMode263(b.id,'self');next();}});
  for(const o of list.slice(1))opts.push({label:'Открыть «'+o.title+'»',fn:()=>{if(selectEnterprise168(o.id))enterpriseMenu152();}});
  opts.push({label:'Открыть «'+b.title+'»',fn:()=>{if(selectEnterprise168(b.id))enterpriseMenu152();}});
  opts.push({label:'Позже',fn:next});
  show('Кто где работает',lines.join('\n'),opts);
 });
}
function bzHireMenu272(q){
 s.pending.shift();save();
 const b=bzById272(q.businessId),next=()=>{if(s.pending.length)resolvePending();};
 if(!b)return next();
 return bzWith272(b,()=>{
  const sh=bzOwnerShares272(),task=s.clock.tasks?.find(t=>t.kind==='business263'&&t.business263===b.id),wage=enterpriseWage155(b);
  const old=(q.others||[]).map(bzById272).filter(Boolean)[0];
  show('Кто будет работать в «'+b.title+'»','Дело открыто. Здесь пока работаете только вы, а вас делят '+sh.count+' '+bzPlural272(sh.count,'дело','дела','дел')+': на каждое — около '+(task?.hours??Math.round(35*sh.k))+' ч в неделю. Без людей дело будет работать примерно на '+bzPct272(bzPlan272(b).covMain)+'%.',[
   {label:'Нанять сотрудника',hint:bzMoney272(b,wage)+'/мес. · нужен резерв на две зарплаты',disabled:b.cash<wage*2,fn:()=>{selectEnterprise168(b.id);if(!hireEnterprise155(b.id))toast('Проверьте резерв на две зарплаты.');next();}},
   ...(old?[{label:'Передать «'+old.title+'» управляющему',hint:bzMoney272(old,Math.round(businessW263(old)*1.3))+'/мес.',fn:()=>{setBusinessMode263(old.id,'manager');next();}}]:[]),
   {label:'Позже',fn:next}
  ]);
 });
}

// ---------- 9. Окна в очереди и «Ожидают ответа» ----------
if(typeof pendingLabels24==='object'){
 pendingLabels24.bzFinal272='Дело может закрыться';
 pendingLabels24.bzHire272='Кто будет работать в новом деле';
 pendingLabels24.bzModel272='Кто где работает';
 pendingLabels24.staffLeave266??='Сотрудник уходит';
 pendingLabels24.competitor266??='Конкурент рядом';
 pendingLabels24.landlord266??='Помещение продают';
 pendingLabels24.businessMode263??='Как вы ведёте дело';
}
const bzPendingBase272=resolvePending;
resolvePending=function(...a){
 const q=s?.pending?.[0];
 if(q?.type==='staffLeave266')return bzLeave272(q);
 if(q?.type==='bzHire272')return bzHireMenu272(q);
 if(q?.type==='bzModel272')return bzModelMenu272(q);
 if(q?.type==='bzFinal272'){
  s.pending.shift();save();
  const b=bzById272(q.businessId);
  if(!b?.final272){if(s.pending.length)return resolvePending();return;}
  return bzWarnMenu272(b,true);
 }
 return bzWith272(q?.businessId?bzById272(q.businessId):null,()=>bzPendingBase272.apply(this,a));
};
function bzRecord272(id){
 const m=/^(final|loss):(.+)$/.exec(String(id||''));if(!m)return null;
 const b=bzById272(m[2]);if(!b)return null;
 if(m[1]==='final'&&b.final272)return {id,status:'offered',businessId:b.id,expires:b.final272.until};
 if(m[1]==='loss'&&b.loss272&&!b.final272&&['loss','final'].includes(bzH272(b).level))return {id,status:'offered',businessId:b.id};
 return null;
}
function bzItems272(){
 const out=[];
 for(const b of bzOwned272()){
  if(b.status!=='active')continue;
  for(const kind of ['final','loss']){
   const ref={kind:'bz272',id:kind+':'+b.id},q=bzRecord272(ref.id);if(!q)continue;
   const snoozed=typeof snoozed270==='function'?snoozed270(ref,q):((s.notices59?.snoozed?.[ref.kind+':'+ref.id]??-1)>s.clock.ticks);
   if(snoozed)continue;
   const hl=bzH272(b);
   out.push(kind==='final'?{ref,q,title:'Дело закроется · '+b.title,note:b.final272.until>s.clock.ticks?bzWhen272(b.final272.until)+', если ничего не изменить':'в первый же месяц, когда не хватит денег',expires:b.final272.until}:
    {ref,q,title:'Дело в минусе · '+b.title,note:'−'+bzMoney272(b,hl.burn)+' в месяц · '+(!(hl.runway<=12)?'запас больше года':hl.runway<=1?'денег не хватит на следующий месяц':'запаса на '+bzMonths272(hl.runway-1))});
  }
 }
 return out;
}
const bzDecisionBase272={decisionRecord24,decisionActive24,decisionItems24,openDecision24};
decisionRecord24=function(ref){return ref?.kind==='bz272'?bzRecord272(ref.id):bzDecisionBase272.decisionRecord24(ref);};
decisionActive24=function(ref){return ref?.kind==='bz272'?!!(s&&!s.dead&&bzRecord272(ref.id)):bzDecisionBase272.decisionActive24(ref);};
decisionItems24=function(...a){
 const base=bzDecisionBase272.decisionItems24.apply(this,a);
 if(!s||s.dead)return base;
 const out=base.map(i=>{
  if(i?.ref?.kind!=='business254')return i;
  const b=typeof businessCase254==='function'?businessCase254(i.ref.id)?.b:null;
  return b?{...i,title:bzText272(b,i.title)}:i;
 });
 return [...out,...bzItems272()].sort((a,b)=>(a.expires??Infinity)-(b.expires??Infinity));
};
openDecision24=function(kind,id,...a){
 if(kind==='bz272'){const q=bzRecord272(id);if(!q)return toast('Это решение уже не нужно.');return bzWarnMenu272(bzById272(q.businessId));}
 const b=kind==='business254'&&typeof businessCase254==='function'?businessCase254(id)?.b:kind==='enterpriseRent239'&&typeof rentBusiness239==='function'?rentBusiness239(id):null;
 return bzWith272(b,()=>bzDecisionBase272.openDecision24.call(this,kind,id,...a));
};

// ---------- 10. Книги: прежний издатель, новый, своё издательство, самиздат ----------
function bookHouses272(){return bzOwned272().filter(b=>b.status==='active'&&bzKind272(b)==='publishing');}
function bookPublisherPool272(country=s.country){
 const own=new Set(bzOwned272().map(b=>String(b.title||'').toLowerCase()));
 let city=[],gen=[];
 try{city=typeof orgRoster271==='function'?(orgRoster271(country,residenceCity())?.all||[]).filter(e=>/^Издательство/.test(e.type)).map(e=>e.name):[];}catch(e){}
 try{gen=typeof businessNames271==='function'?businessNames271(country,'studio','publishing',0,12,[...own],'pub272').map(n=>'Издательство «'+n.name+'»'):[];}catch(e){}
 const fallback=['Издательство «Полка»','Издательство «Тихий дом»','Издательство «Корешок»','Издательство «Новая страница»','Издательство «Северный ветер»'];
 return [...new Set([...city,...gen,...fallback])].filter(n=>!own.has(n.replace(/^Издательство «|»$/g,'').toLowerCase()));
}
function bookPublishers272(){
 const x=creative27(),pubs=x.publishers272??={};
 // Книги из старых сохранений, вышедшие у издателя без имени: у них один и тот же прежний издатель.
 const orphans=x.projects.filter(p=>p.status==='published'&&p.route!=='self'&&!p.house272&&!p.publisher272);
 if(orphans.length){
  const id='pub272-0',name=pubs[id]?.name||bookPublisherPool272(orphans[0].contract?.country||s.country)[0];
  pubs[id]??={name,books:0};
  for(const p of orphans){p.publisher272={id,name};pubs[id].books++;}
 }
 return pubs;
}
function bookPrev272(){
 const pubs=bookPublishers272(),list=Object.entries(pubs).filter(([,v])=>v.books>0);
 if(!list.length)return null;
 const [id,v]=list.sort((a,b)=>b[1].books-a[1].books)[0];
 return {id,name:v.name,books:v.books};
}
function bookNewPublisher272(p){
 const pubs=bookPublishers272(),used=new Set(Object.values(pubs).filter(v=>v.books>0).map(v=>v.name));
 const refused=new Set(Object.entries(p.refused272||{}).filter(([,until])=>until>s.clock.ticks).map(([id])=>pubs[id]?.name));
 const pool=bookPublisherPool272().filter(n=>!used.has(n)&&!refused.has(n));
 const name=pool.length?pool[[...String(p.id)].reduce((a,c)=>a+c.charCodeAt(0),0)%pool.length]:bookPublisherPool272()[0];
 let id=Object.entries(pubs).find(([,v])=>v.name===name)?.[0];
 if(!id){id='pub272-'+(Object.keys(pubs).length+1);pubs[id]={name,books:0};}
 return {id,name};
}
function bookSubmit272(id,target){
 const x=creative27(),p=x.projects.find(p=>p.id===id),t=s.clock.ticks;
 if(!p||!['ready','rejected'].includes(p.status)||t<(p.retry||0))return false;
 const pub=target==='prev'?bookPrev272():bookNewPublisher272(p);
 if(!pub||(p.refused272?.[pub.id]??-1)>t)return false;
 submitBook27(id,false);
 if(p.status!=='review')return false;
 p.publisher272={id:pub.id,name:pub.name};
 const books=bookPublishers272()[pub.id]?.books||0;
 const bonus=target==='prev'&&books>0?Math.min(.2,.08+.04*(books-1)):0;
 if(bonus)p.roll=Math.max(0,p.roll-bonus);
 const h=p.history.at(-1);if(h&&h.tick===t)h.text='Рукопись отправлена · '+pub.name;
 save();return true;
}
function bookSelf272(id){
 const p=creative27().projects.find(p=>p.id===id);if(!p)return false;
 const keep=p.retry;p.retry=0;
 submitBook27(id,true);
 if(p.status!=='review'){p.retry=keep;return false;}
 return true;
}
function bookHouse272(id,bid){
 const x=creative27(),p=x.projects.find(p=>p.id===id),b=bzById272(bid),t=s.clock.ticks;
 if(!p||!b||!['ready','rejected'].includes(p.status)||bzKind272(b)!=='publishing')return false;
 p.attempts++;p.route='self';p.house272=b.id;p.status='review';p.due=t+2;
 p.roll=Math.random();p.marketRoll=Math.random();p.criticsRoll=Math.random();
 p.history.push({tick:t,text:'Рукопись ушла в своё издательство «'+b.title+'»'});
 log('Рукопись в своём издательстве',p.title+' · «'+b.title+'» выпустит книгу без оплаты, выход через два месяца.','Творчество');
 save();return true;
}
function bookOptions272(p,opts){
 const i=opts.findIndex(o=>o?.label==='Отправить издателю'),j=opts.findIndex(o=>/^Издать самостоятельно/.test(o?.label||''));
 if(i<0&&j<0)return opts;
 const t=s.clock.ticks,prev=bookPrev272(),houses=bookHouses272(),wait=Math.max(0,(p.retry||0)-t),mine=[];
 if(prev){
  const refused=(p.refused272?.[prev.id]??0)>t,left=Math.max(wait,refused?p.refused272[prev.id]-t:0);
  mine.push({label:'Прежнему издателю · '+prev.name,hint:refused?'Отказали в этот раз · снова через '+bzMonths272(left):left>0?'Можно через '+bzMonths272(left):
   'Вы уже издавались у них — берут охотнее · ответ через 3 месяца',disabled:left>0,fn:()=>{if(!bookSubmit272(p.id,'prev'))toast('Сейчас отправить не получится.');bookMenu27(p.id);}});
 }
 mine.push({label:prev?'Новому издателю':'Отправить издателю',hint:wait>0?'Можно через '+bzMonths272(wait):'Ответ через 3 месяца',disabled:wait>0,
  fn:()=>{if(!bookSubmit272(p.id,'new'))toast('Сейчас отправить не получится.');bookMenu27(p.id);}});
 for(const b of houses)mine.push({label:'В своё издательство · '+b.title,hint:'Без оплаты · выручка — на счёт издательства · выход через 2 месяца',
  fn:()=>{if(!bookHouse272(p.id,b.id))toast('Сейчас это недоступно.');bookMenu27(p.id);}});
 if(j>=0)mine.push({...opts[j],disabled:false,hint:houses.length?'Своё издательство выпустит без оплаты':opts[j].hint,
  fn:()=>{if(!bookSelf272(p.id))toast('Не хватает денег на выпуск.');bookMenu27(p.id);}});
 const out=[];let placed=false;
 opts.forEach((o,k)=>{if(k===i||k===j){if(!placed){out.push(...mine);placed=true;}return;}out.push(o);});
 return out;
}
const bookMenuBase272=bookMenu27;
bookMenu27=function(id,...a){
 const p=creative27().projects.find(p=>p.id===id);
 if(!p||!['ready','rejected'].includes(p.status))return bookMenuBase272.call(this,id,...a);
 const showBase=show;
 show=function(title,text,opts=[],...rest){show=showBase;return showBase.call(this,title,text,bookOptions272(p,opts||[]),...rest);};
 try{return bookMenuBase272.call(this,id,...a);}finally{show=showBase;}
};
const bookMonthBase272=creativeMonth27;
creativeMonth27=function(...a){
 const x=creative27(),t=s.clock.ticks,advance=x.last<t;
 if(!advance)return bookMonthBase272.apply(this,a);
 const reviewing=x.projects.filter(p=>p.status==='review');
 // Книги своего издательства: выплаты идут на счёт дела, а не автору.
 const house=x.projects.filter(p=>p.status==='published'&&p.house272&&bzById272(p.house272)&&p.contract&&p.paidMonths<p.contract.months&&t>p.released);
 for(const p of house){const key=p.id+':'+t;if(!p.payments.includes(key))p.payments.push(key);}
 const houseNow=new Set(reviewing.filter(p=>p.house272).map(p=>p.title));
 const pubOf=title=>reviewing.find(p=>p.title===title&&!p.house272&&p.route!=='self')?.publisher272;
 const logBase=log;
 log=function(title,text,...rest){
  let tx=String(text??'');
  const name=tx.split(/:| · /)[0];
  if(title==='Отказ издателя'){
   const pub=pubOf(name);
   tx=name+(pub?' · '+pub.name+' отказало':'')+': рукопись остаётся вашей. Другому издателю можно отправить через два месяца, этому — через полгода. '+
    (bookHouses272().length?'В своё издательство или самостоятельно — хоть сейчас.':'Самостоятельно — хоть сейчас.');
  }else if(title==='Книга опубликована'&&houseNow.has(name)){
   const p=reviewing.find(q=>q.title===name&&q.house272),b=p&&bzById272(p.house272);
   if(b)tx=tx.replace('Авторские выплаты ограничены договором на два года.','Книга вышла в «'+b.title+'»: два года выручка от неё идёт на счёт издательства.');
  }else if(title==='Книга опубликована'){
   const pub=pubOf(name);if(pub)tx=tx.replace(name+' · ',name+' · '+pub.name+' · ');
  }
  return logBase.call(this,title,tx,...rest);
 };
 let out;
 try{out=bookMonthBase272.apply(this,a);}finally{log=logBase;}
 for(const p of house){
  const b=bzById272(p.house272);if(!b)continue;
  const amt=p.contract.total/p.contract.months*fxRate86(p.contract.country,b.country);
  b.bookIncome272=(b.bookIncome272||0)+amt;p.paidMonths++;p.houseIncome272=(p.houseIncome272||0)+amt;
 }
 for(const p of reviewing){
  if(p.status==='rejected'){
   const pub=p.publisher272;
   if(pub)(p.refused272??={})[pub.id]=t+6;
   p.retry=t+2;
   const h=p.history.at(-1);if(h&&h.tick===t&&pub&&h.text==='Издатель отказал')h.text='Отказ · '+pub.name;
  }else if(p.status==='published'){
   if(p.house272){
    const b=bzById272(p.house272);
    if(b){
     (b.catalogue272??=[]).push({book:p.id,title:p.title,tick:t,critics:p.critics,audience:p.audience});
     if(p.audience>=60)bzCases272(b).modifiers.push({case:'book272',until:t+12,demand:1+Math.min(.1,p.audience/1000)});
     log('Новая книга в каталоге',b.title+' · «'+p.title+'» — ваша собственная книга.','Своё дело');
    }
   }else if(p.route!=='self'&&p.publisher272){
    const pubs=bookPublishers272();(pubs[p.publisher272.id]??={name:p.publisher272.name,books:0}).books++;
   }
  }
 }
 return out;
};

// ---------- 11. Таблица соответствия (для проверки и отчёта) ----------
// Строки — тексты и действия, столбцы — 24 вида; ok — подходит как есть, text — свой текст вида, off — не приходит.
function bzFitTable272(){
 const kinds=Object.keys(bzKinds272),rows=[];
 const fake=k=>{const sp=Object.entries(bzSpecialties272).find(([,v])=>v===k)?.[0];
  if(k==='school')return {type:'services',specialty:'school196',school196:{}};
  if(sp)return {type:Object.keys(enterpriseSpecialties153).find(t=>enterpriseSpecialties153[t][sp]),specialty:sp};
  const type=Object.entries(bzTypes272).find(([t,v])=>v===k&&t.endsWith('253'))?.[0]||(k==='cinema'||k==='theatre'?'culture253':'');
  const entry=(typeof businessCatalog253!=='undefined'?businessCatalog253:[]).find(e=>e.type===type&&(k==='cinema'?/Кинотеатр/.test(e.name):k==='theatre'?!/Кинотеатр/.test(e.name):true));
  return {type,specialty:entry?.id};};
 const B=Object.fromEntries(kinds.map(k=>[k,fake(k)]));
 const cell=(k,a,off)=>off?'off':bzText272(B[k],a)!==a?'text':'ok';
 const add=(name,fn)=>rows.push([name,...kinds.map(k=>{try{return fn(k,B[k]);}catch(e){return '?';}})]);
 const typeOf=b=>b.type;
 for(const t of ['studio','services','shop'])(enterpriseEvents153[t]||[]).forEach(e=>add('152 '+t+' · '+e[0],(k,b)=>typeOf(b)!==t||b.school196?'—':bzProfile272(b).ev153?'text':cell(k,e[0]+' '+e[1])));
 add('152 своё событие специальности',(k,b)=>specialtyEvents153[b.specialty]?'ok':'—');
 add('154 история места',(k,b)=>bzProfile272(b).story?'text':'ok');
 add('154 истории клиентов',(k,b)=>bzProfile272(b).clients?'text':clientStories154.some(c=>bzText272(b,c[1])!==c[1]||bzText272(b,c[0])!==c[0])?'text':'ok');
 if(typeof businessIndex254!=='undefined')for(const e of Object.values(businessIndex254).filter(e=>!e.businesses.length)){
  add('254 '+e.id+' '+e.title,(k,b)=>{const why=bzOff272({...b,branch159:null},e);if(why)return 'off';const t=[e.title,e.text,...e.choices.map(c=>c.label)].join('|');return bzText272(b,t)!==t?'text':'ok';});
 }
 add('254 E0402 при уже открытом расширении',(k,b)=>bzOff272({...b,branch159:{}},businessIndex254.E0402)?'off':'ok');
 add('254 E0397 и 263 повышение аренды при своём помещении (266)',(k,b)=>bzOff272({...b,ownPremises266:true},businessIndex254.E0397)?'off':'ok');
 add('254 события своего дела (BZ)',(k,b)=>b.specialty&&businessById253?.[b.specialty]?'ok':'—');
 const d=bzDefaults272;
 add('263 загрузка (много/мало работы)',(k,b)=>cell(k,d.busy+' '+d.idle));
 add('263 как вы ведёте дело',(k,b)=>cell(k,d.mode.self+d.mode.partial+d.mode.manager));
 add('263 первый год',(k,b)=>cell(k,d.firstYear.join(' ')));
 add('263 ошибки управляющего',(k,b)=>cell(k,d.slip.join(' ')));
 add('263 ремонт',(k,b)=>cell(k,d.reno.join(' ')+d.tired));
 add('266 конкурент рядом',(k,b)=>cell(k,d.competitor.text+d.competitor.price+d.competitor.ad+d.competitor.reno[1]));
 add('266 помещение продают',(k,b)=>cell(k,d.landlord));
 add('266 сотрудник уходит (272: прибавка и ответ)',()=>'text');
 add('156 реклама',(k,b)=>cell(k,d.ad.join(' · ')));
 add('159 расширение',(k,b)=>bzProfile272(b).expand.mode==='unit'?'unit':'branch');
 add('159 людей на точку (crew; владелец «сам» в одном деле держит точку целиком)',(k,b)=>String(bzNeed272(b)));
 return {kinds,rows};
}

// «Моя работа» (layout272): красная рамка рисовалась по одному прошлому месяцу, и сезонный минус в прибыльный год
// выглядел как беда; новая серия или команда считалась второй точкой. Теперь строка под делом — тот же статус, что в карточке: красное — только «Дело в минусе» и
// «Закроется …»; точка без людей — тоже красным; первый год — без красного, сезон — без строки.
{
 const base272=businessItem272;
 businessItem272=function(g,...rest){
  const html=base272.call(this,g,...rest);
  try{
   const list=(g?.points||[]).map(b=>({b,st:bzStatus272(b)})).filter(x=>x.st&&x.st.level!=='dip')
    .sort((x,y)=>bzRank272[y.st.level]-bzRank272[x.st.level]);
   const box=document.createElement('div');box.innerHTML=html;
   const btn=box.firstElementChild;if(!btn)return html;
   btn.querySelector('.work-warn272')?.remove();btn.classList.remove('work-loss272');
   // Серия, команда, маршрут или линия — не вторая точка: «Издательство · Сидней · с новой серией», а не «2 точки».
   const pts=g?.points||[],sub=btn.querySelector('strong+span');
   if(sub&&pts.some(bzUnitMode272)){
    const b0=g.b,kind=enterpriseSpecialties153[b0.type]?.[b0.specialty]||enterpriseTypes152[b0.type]?.name||'';
    const count=pts.reduce((n,p)=>n+1+Number(!!p.branch159&&!bzUnitMode272(p)),0),cities=[...new Set(pts.map(p=>p.city))].filter(Boolean).join(', ');
    const badges=[...new Set(pts.filter(bzUnitMode272).map(bzBadge272).filter(Boolean))];
    sub.textContent=[kind,cities+(count>1?' · '+count+' '+plural272(count,'точка','точки','точек'):''),...badges].filter(Boolean).join(' · ');
   }
   const top=list[0];
   if(top){
    const {b,st}=top,red=bzRed272(st)||st.level==='staff'&&/закрыт/.test(st.label);
    const text=st.level==='loss'?st.label+'. '+bzText272(b,bzRunwayText272(bzH272(b))):st.label;
    const span=document.createElement('span');span.className=red?'work-warn272':'work-note272';span.textContent=text;
    btn.append(span);if(red)btn.classList.add('work-loss272');
   }
   return box.innerHTML;
  }catch(e){console.error(e);return html;}
 };
}
