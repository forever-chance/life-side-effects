'use strict';
// Each scene is a persisted case belonging to one operating enterprise.
// Numeric editorial effect ranges and unreviewed followup edges are not executable.
const businessBase254={month:autonomousMonth,record:decisionRecord24,active:decisionActive24,items:decisionItems24,open:openDecision24,event:enterpriseEvent153,close:closeEnterprise152};
const businessIndex254=Object.fromEntries(businessEvents254.map(e=>[e.id,e]));
function businessState254(b){return b.cases254??={serial:0,lastMonth:-1,cooldowns:{},cases:[],ledger:[],modifiers:[],receivables:[],allocations:{}};}
function businessFind254(id){return ownedEnterprises168().find(b=>b.id===id);}
function businessCase254(id){for(const b of ownedEnterprises168()){const q=b.cases254?.cases.find(q=>q.id===id);if(q)return {b,q};}return null;}
function businessLocal254(b){return !!b&&b.status==='active'&&!enterpriseBlock152()&&!travelActive52()&&b.country===s.country&&b.city===residenceCity();}
function businessValid254(b,q){return businessLocal254(b)&&q.business===b.id&&q.country===b.country&&q.city===b.city&&q.specialty===b.specialty&&(!q.worker||enterpriseStaff155(b).some(p=>p.id===q.worker))&&(!q.partner||b.partner158?.id===q.partner)&&(!q.customer||!!living(q.customer));}
function businessActive254(b,q){return businessValid254(b,q)&&['offered','proposal'].includes(q.status)&&s.clock.ticks<q.expires;}
function businessModifier254(b,key){return (b.cases254?.modifiers||[]).filter(m=>m.until>=s.clock.ticks).reduce((value,m)=>value*(m[key]??1),1);}
function businessEligible254(b,e){
 if(!businessLocal254(b)||!b.history?.length||e.businesses.length&&!e.businesses.includes(b.specialty))return false;
 if(['staff','process'].includes(e.kind)&&!enterpriseStaff155(b).length)return false;
 if(e.kind==='rent'&&!b.rentOffer159)return false;
 if(e.kind==='liquidity'&&b.cash>enterpriseRent157(b)*2)return false;
 if(e.kind==='expansion'&&!b.partner158)return false;
 if(e.kind==='invest'&&!enterprisePartnerCandidates158(b).length)return false;
 if(e.kind==='payment'&&!businessState254(b).receivables.some(r=>r.status==='overdue'))return false;
 return true;
}
function businessOffer254(b,event){
 const e=businessIndex254[event],st=businessState254(b),tick=s.clock.ticks;
 if(!e||!businessEligible254(b,e)||st.cases.some(q=>['offered','proposal','saleProposal','scheduled'].includes(q.status))||tick-(st.cooldowns[event]??-1000)<e.cooldown)return null;
 const h=b.history.at(-1),market=enterpriseMarket165(b),unit=Math.max(1,Math.round(market?.overhead??enterpriseBaseCost157(b)*.4));
 const q={id:b.id+'-case254-'+(++st.serial),business:b.id,specialty:b.specialty,country:b.country,city:b.city,event,tick,expires:tick+2,status:'offered',unit,entity:{id:b.id+'-operation254-'+st.serial,kind:e.kind,status:'open',historyTick:h.tick}};
 if(['staff','process'].includes(e.kind))q.worker=enterpriseStaff155(b)[0].id;
 if(e.kind==='expansion')q.partner=b.partner158.id;
 if(['booking','class','complaint','contract','loyalty','project','rental','revision','tour','weather','wholesale'].includes(e.kind)){
  let customer=(b.clients154||[]).map(living).find(p=>p?.alive);
  if(!customer){customer=person('Клиент',rnd(22,65),undefined,b.country,b.city);customer.city18=b.city;s.people.push(customer);b.clients154??=[];b.clients154.push(customer.id);}
  q.customer=customer.id;q.entity.customer=customer.id;
 }
 if(e.kind==='rent')q.rent=b.rentOffer159.id;
 if(e.kind==='payment')q.receivable=st.receivables.find(r=>r.status==='overdue').id;
 // Allocate evidence from actual paid operating accounts; the same sale or purchase
 // cannot finance multiple refunds/claims. Creation itself transfers no money.
 const allocation=st.allocations[h.tick]??={sales:0,production:0};
 q.salesBacking=Math.max(0,Math.min(unit,Math.floor(h.sales*.12)-allocation.sales));
 q.costBacking=Math.max(0,Math.min(unit,Math.floor(Math.min(h.production||0,h.paid||0)*.12)-allocation.production));
 allocation.sales+=q.salesBacking;allocation.production+=q.costBacking;
 st.cases.push(q);st.cooldowns[event]=tick;s.clock.running=false;
 log(e.title,b.title+' · '+e.text,'Своё дело',false,{kind:'business254',id:q.id});return q;
}
// [operation, cost in monthly overhead units, extra contract revenue, success, failure]
const businessPlans254={
 attendance:[['advertise',.35,0,'Реклама размещена; спрос на следующие показы увеличился.','Реклама размещена, но заметного прироста зрителей нет.'],['reduce',0,0,'Расписание показов сокращено на три месяца.','Минимальное расписание по договору сохранено.']],
 booking:[['reschedule',0,0,'Запись перенесена, место подтверждено.','Клиент отказался от новой даты.'],['penalty',0,0,'Клиент уведомлён; требование по отмене зарегистрировано.','Клиент оспаривает условие отмены.'],['decline',0,0,'Запись отменена без штрафа.','Запись отменена без штрафа.']],
 class:[['contract',.35,.65,'Дополнительная группа завершила занятия; оплата поступила на счёт дела.','Группу не удалось провести; затраты на подготовку не вернулись.'],['decline',0,0,'Дополнительная группа не открыта.','Дополнительная группа не открыта.']],
 competition:[['improve',.3,0,'Обновлённое предложение привлекло клиентов.','Обновление не дало ожидаемого результата.'],['advertise',.35,0,'Кампания привлекла клиентов.','Кампания не дала прироста спроса.'],['decline',0,0,'Ассортимент и цены сохранены.','Ассортимент и цены сохранены.']],
 complaint:[['repair',.2,0,'Проблема устранена; обращение гостя закрыто.','Проблему полностью устранить не удалось; обращение остаётся в журнале.'],['refund',0,0,'Компенсация перечислена из средств предприятия.','Гость отказался от предложенной компенсации; деньги не списаны.'],['ignore',0,0,'Жалоба оставлена без ответа; спрос временно снизился.','Жалоба оставлена без ответа; спрос временно снизился.']],
 contract:[['contract',.6,1,'Заказ выполнен и оплачен.','Заказ выполнен, но клиент задержал оплату. Счёт сохранён как задолженность.'],['contract',.45,.8,'Заказ выполнен на пересмотренных условиях и оплачен.','Клиент не подтвердил новые условия; подготовительные расходы остались.'],['decline',0,0,'Заказ отклонён, обязательства не приняты.','Заказ отклонён, обязательства не приняты.']],
 damage:[['claim',.05,0,'Страховое обращение зарегистрировано. Выплата не подтверждена.','Страховщик не подтвердил покрытие. Выплаты нет.'],['report',0,0,'Заявление зарегистрировано. Дело остаётся открытым.','Имущество не восстановлено; заявление остаётся без результата.'],['repair',.5,0,'Повреждение устранено, ремонт оплачен.','Ремонт задержался; оплаченная заявка остаётся открытой.']],
 demand:[['shift',.2,0,'Дополнительная смена отработана; пропускная способность временно выросла.','Дополнительную смену организовать не удалось.'],['reduce',0,0,'Приём заказов временно ограничен.','Приём заказов временно ограничен.']],
 event:[['contract',.65,1.05,'Специальное мероприятие проведено, дополнительная выручка учтена.','Мероприятие отменилось; подготовительные расходы не возмещены.'],['decline',0,0,'Специальное мероприятие отклонено.','Специальное мероприятие отклонено.']],
 expansion:[['branch',0,0,'',''],['decline',0,0,'Расширение отложено.','Расширение отложено.'],['decline',0,0,'Расширение отклонено.','Расширение отклонено.']],
 harvest:[['protect',.4,0,'Защитные меры помогли сохранить объём продукции.','Защита не спасла весь объём: продажи на три месяца снижены.'],['protect',.25,0,'План поставок скорректирован; основные заказы сохранены.','Замена поставок не удалась; продажи на три месяца снижены.'],['loss',0,0,'Потери объёма учтены в продажах следующих трёх месяцев.','Потери объёма учтены в продажах следующих трёх месяцев.']],
 inspection:[['documents',0,0,'Документы проверены; проверка закрыта.','Запрошены дополнительные документы; проверка остаётся открытой.'],['repair',.35,0,'Недочёты устранены и отмечены в акте проверки.','Часть недочётов осталась; повторная проверка ещё не закрыта.']],
 invest:[['partner',0,0,'',''],['finance',0,0,'',''],['decline',0,0,'Предложение инвестора отклонено.','Предложение инвестора отклонено.']],
 liquidity:[['finance',0,0,'',''],['reduce',0,0,'Расходы и объём работы снижены на три месяца.','Расходы и объём работы снижены на три месяца.'],['close',0,0,'','']],
 loyalty:[['loyalty',.1,0,'Программа для постоянных клиентов действует три месяца.','Клиент не заинтересовался предложением.'],['decline',0,0,'Условия для клиента оставлены без изменений.','Условия для клиента оставлены без изменений.']],
 payment:[['collect',0,0,'Клиент погасил подтверждённый счёт.','Клиент не оплатил счёт; задолженность сохранена.'],['collect',0,0,'Клиент оплатил счёт по согласованному графику.','Платёж по графику задерживается; задолженность сохранена.'],['collect',.1,0,'После претензии задолженность погашена.','Претензия не привела к оплате; задолженность сохранена.']],
 process:[['improve',.25,0,'Пилот завершён; эффективность на три месяца выросла.','Пилот завершён без улучшений.'],['decline',0,0,'Предложение сотрудника отклонено.','Предложение сотрудника отклонено.']],
 project:[['contract',.45,.8,'Проект передан заказчику и оплачен.','Проект передан, но счёт ещё не оплачен.'],['contract',.35,.65,'Проект завершён на пересмотренных условиях и оплачен.','Пересмотренные условия не подтверждены; подготовительные расходы остались.']],
 rent:[['rent',0,0,'',''],['premises',0,0,'',''],['close',0,0,'','']],
 rental:[['recover',0,0,'Инвентарь возвращён; договор проката закрыт.','Инвентарь не возвращён; договор отмечен как неисполненный.'],['claim',.05,0,'Страховое обращение зарегистрировано; выплаты пока нет.','Страховщик не подтвердил покрытие; выплаты нет.'],['report',0,0,'Заявление зарегистрировано, инвентарь остаётся невозвращённым.','По заявлению нет результата; инвентарь остаётся невозвращённым.']],
 review:[['equipment',0,0,'',''],['decline',0,0,'Объём производства сохранён.','Объём производства сохранён.']],
 revision:[['repair',.25,0,'Переделка завершена и передана заказчику.','Заказчик не принял переделку; спор остаётся открытым.'],['dispute',0,0,'Претензия рассмотрена; первоначальные условия сохранены.','Спор остался открытым.'],['refund',0,0,'Часть оплаты возвращена заказчику.','Заказчик не согласился на частичный возврат; деньги сохранены.']],
 sale:[['sale',0,0,'',''],['decline',0,0,'Предложение о продаже отклонено.','Предложение о продаже отклонено.']],
 season:[['price',0,0,'Новые цены применены к будущим продажам.','Новые цены применены к будущим продажам.'],['hire',0,0,'','']],
 staff:[['hire',0,0,'',''],['reduce',0,0,'Объём работы временно сокращён под доступный состав.','Объём работы временно сокращён под доступный состав.'],['reduce',0,0,'Смена закрыта; объём работы временно сокращён.','Смена закрыта; объём работы временно сокращён.']],
 stock:[['discount',0,0,'Скидка на партию действует три месяца; результат зависит от продаж.','Скидка не привлекла покупателей.'],['return',0,0,'Поставщик принял возврат, стоимость партии возмещена.','Поставщик отказался от возврата.'],['writeoff',0,0,'Неликвидная партия списана. Её закупка уже учтена в расходах.','Неликвидная партия списана. Её закупка уже учтена в расходах.']],
 supply:[['supplier',.3,0,'Срочная поставка получена, ассортимент восстановлен.','Срочная поставка задержалась; ассортимент временно сокращён.'],['reduce',0,0,'Ассортимент сокращён на три месяца.','Ассортимент сокращён на три месяца.'],['return',0,0,'Возврат по оплаченному заказу поступил на счёт.','Поставщик оспорил возврат; денег не поступило.']],
 tour:[['contract',.2,.35,'Дополнительный маршрут проведён, доплата получена.','Дополнительный маршрут отменён; подготовительные расходы остались.'],['decline',0,0,'Согласованный маршрут сохранён.','Согласованный маршрут сохранён.']],
 weather:[['reschedule',0,0,'Бронирование перенесено на согласованную дату.','Новая дата не подошла; бронирование отменено.'],['refund',0,0,'Возврат по бронированию перечислен.','Сумма возврата оспаривается; платёж пока не проведён.'],['reschedule',.1,0,'Альтернативный маршрут согласован и проведён.','Альтернативный маршрут отменён из-за погоды.']],
 wholesale:[['contract',.7,1.15,'Согласованная партия поставлена, покупатель оплатил счёт.','Партия поставлена, но покупатель задержал оплату.'],['contract',.6,1.05,'Партия поставлена на пересмотренных условиях и оплачена.','Покупатель не согласился с новыми условиями; подготовительные расходы остались.']]
};
function businessPlan254(b,q,index){
 const e=businessIndex254[q.event],choice=e.choices[index];if(!choice)return null;
 const template=businessPlans254[e.kind]?.[index];if(!template)return null;
 const [op,cost,revenue,success,failure]=template;
 const plan={op,cost:Math.round(cost*q.unit),revenue:Math.round(revenue*q.unit),success,failure,p:choice.p,months:op==='contract'?2:1};
 if(choice.label==='Повысить цену'||choice.label==='Поднять цену'){plan.op='price';plan.success=plan.failure='Новые цены применены к будущим продажам.';}
 if(choice.label==='Поблагодарить'){plan.op='thanks';plan.cost=0;plan.success=plan.failure='Постоянному клиенту передана благодарность.';}
 if(choice.label==='Скидка'&&e.kind==='loyalty'){plan.op='discount';plan.success='Скидка для постоянных клиентов действует три месяца.';plan.failure='Клиент не воспользовался скидкой.';}
 if(choice.label==='Согласиться'&&e.kind==='rent')plan.op='rentAccept';
 if(choice.label==='Без изменений'){plan.op='decline';plan.success=plan.failure='План работы сохранён без изменений.';}
 if(plan.op==='refund'){plan.cost=q.salesBacking;plan.revenue=0;}
 if(plan.op==='return')plan.revenue=q.costBacking;
 if(plan.op==='collect')plan.revenue=businessState254(b).receivables.find(r=>r.id===q.receivable&&r.status==='overdue')?.amount||0;
 return plan;
}
function businessWhy254(b,q,plan){
 if(!businessActive254(b,q))return 'Ситуация больше не действует.';
 if(!plan)return 'Нет подходящего действия.';
 if(b.cash<plan.cost)return 'Недостаточно денег на счёте предприятия.';
 if(plan.op==='shift'&&!enterpriseStaff155(b).length)return 'Для дополнительной смены нужны сотрудники.';
 if(['refund','return'].includes(plan.op)&&!(plan.op==='refund'?q.salesBacking:q.costBacking))return 'Нет подтверждённой оплаченной суммы для возврата.';
 if(plan.op==='sale'&&(b.partner158||businessState254(b).receivables.some(r=>r.status==='overdue')))return 'Для продажи нужно урегулировать долю совладельца и неоплаченные счета.';
 if(plan.op==='collect'&&!plan.revenue)return 'Счёт уже закрыт.';
 if(['rent','rentAccept'].includes(plan.op)&&b.rentOffer159?.id!==q.rent)return 'Условия аренды уже изменились.';
 return '';
}
function businessMoney254(b,q,key,amount,note){
 const st=businessState254(b),id=q.id+':'+key;if(st.ledger.some(r=>r.id===id)||!Number.isFinite(amount)||amount<0&&b.cash< -amount)return false;
 b.cash+=amount;st.ledger.push({id,case:q.id,entity:q.entity.id,tick:s.clock.ticks,amount,note,country:b.country});return true;
}
function businessApply254(b,q,success){
 if(q.status!=='scheduled'||s.clock.ticks<q.due)return false;
 if(!businessValid254(b,q)){businessCancel254(b,q);return false;}
 const p=q.plan,st=businessState254(b);q.status='resolved';q.entity.status=success?'completed':'unresolved';q.finished=s.clock.ticks;
 if(success&&p.revenue){
  businessMoney254(b,q,'receipt',p.revenue,'Оплата по делу');
  if(p.op==='collect'){const r=st.receivables.find(r=>r.id===q.receivable);if(r)r.status='paid';}
 }
 if(!success&&p.op==='contract'&&q.choiceIndex===0&&['contract','project','wholesale'].includes(businessIndex254[q.event].kind))st.receivables.push({id:q.id+':invoice',case:q.id,amount:p.revenue,status:'overdue',country:b.country});
 const modifier={case:q.id,until:s.clock.ticks+3};
 if(success&&['advertise','improve','loyalty','shift'].includes(p.op))modifier.demand=1.12;
 if(p.op==='reduce'){modifier.demand=.85;modifier.overhead=.85;}
 if(p.op==='loss'||p.op==='ignore'||!success&&['protect','supplier'].includes(p.op))modifier.demand=.8;
 if(success&&p.op==='discount'){modifier.demand=1.1;modifier.price=.94;}
 if(success&&p.op==='writeoff')q.entity.status='written_off';
 if(['claim','report','penalty'].includes(p.op))q.entity.status=success?'request_registered':'request_rejected';
 if(!success&&p.op==='recover')modifier.demand=.9;
 if(modifier.demand||modifier.overhead)st.modifiers.push(modifier);
 if(success&&p.op==='price')b.prices156='high';
 if(!success&&p.op==='refund'){businessMoney254(b,q,'refund-release',p.cost,'Возврат зарезервированной компенсации');}
 const note=success?p.success:p.failure;q.result=note;
 if(q.customer&&living(q.customer))remember(living(q.customer),b.title+' · '+note);
 log(businessIndex254[q.event].title,b.title+' · '+note,'Своё дело');return true;
}
function businessNative254(b,q,p){
 selectEnterprise168(b.id);
 if(p.op==='hire'){
  if(q.event!=='E0399')return hireEnterprise155(b.id);
  const oldStaff=[...(b.staff155||[])];b.staff155=oldStaff.filter(id=>id!==q.worker);
  if(!hireEnterprise155(b.id)){b.staff155=oldStaff;return false;}
  const former=living(q.worker);if(former)former.occupation='Бывший сотрудник · '+b.title;return true;
 }
 if(p.op==='equipment')return developEnterprise156(b.id,'equipment');
 if(p.op==='rent'||p.op==='rentAccept')return respondRent159(q.rent,p.op==='rent'?'negotiate':'accept');
 if(p.op==='branch'){branchMenu159(b);return true;}
 if(p.op==='premises'){enterprisePremisesMenu157(b);return true;}
 if(p.op==='partner'){enterprisePartnerMenu158(b);return true;}
 if(p.op==='finance'){businessFunding254(b.id);return true;}
 if(p.op==='close'){show('Закрыть дело?',b.title+' прекратит работу. Остаток счёта распределяется по долям.',[{label:'Закрыть',fn:()=>closeEnterprise152(b.id)},{label:'Назад',fn:()=>businessJournal254(b.id)}]);return true;}
 return false;
}
function businessCommit254(id,index){
 const found=businessCase254(id);if(!found)return false;const {b,q}=found,p=businessPlan254(b,q,index);if(businessWhy254(b,q,p))return false;
 if(['hire','equipment','rent','rentAccept','branch','premises','partner','finance','close'].includes(p.op)){
  if(!businessNative254(b,q,p))return false;
  q.status='resolved';q.choiceIndex=index;q.entity.status='handed_off';q.result='Открыто действие по предприятию; окончательные условия подтверждаются отдельно.';save();return true;
 }
 if(p.op==='sale'){
  if(b.partner158)return false;
  q.plan={...p,revenue:Math.round(enterpriseMarket165(b)?.startup*.6||q.unit*6)};q.status='saleProposal';q.choiceIndex=index;save();return businessSaleMenu254(b,q);
 }
 if(!businessMoney254(b,q,'cost',-p.cost,'Подтверждённые расходы по делу'))return false;
 q.plan=p;q.choiceIndex=index;q.status='scheduled';q.due=s.clock.ticks+p.months;q.roll=Math.random();q.entity.status='in_progress';
 if(['decline','ignore','loss','price','thanks','writeoff','reduce'].includes(p.op)){q.due=s.clock.ticks;businessApply254(b,q,true);}
 log('Решение по делу',b.title+' · '+businessIndex254[q.event].choices[index].label+(q.status==='scheduled'?' · результат через '+p.months+' мес.':''),'Своё дело');save();render();return true;
}
function businessSaleMenu254(b,q){
 show('Предложение о покупке',b.title+' · цена активов '+money(q.plan.revenue*fxRate86(b.country))+' плюс остаток счёта. После продажи предприятие перестанет принадлежать тебе.',[{label:'Продать предприятие',fn:()=>businessSell254(b.id,q.id)},{label:'Отказаться',fn:()=>{q.status='resolved';q.result='Предложение о покупке отклонено.';save();enterpriseMenu152();}}]);return true;
}
function businessSell254(id,caseId){
 const b=businessFind254(id),q=b?.cases254?.cases.find(q=>q.id===caseId);
 if(!q||q.status!=='saleProposal'||!businessValid254(b,q)||b.partner158||s.clock.ticks>=q.expires)return false;
 if(b.cases254.receivables.some(r=>r.status==='overdue'))return false;
 if(!businessMoney254(b,q,'sale',q.plan.revenue,'Продажа активов'))return false;
 q.status='resolved';q.entity.status='sold';selectEnterprise168(b.id);closeEnterprise152(b.id);save();return true;
}
function businessOpen254(id){
 const found=businessCase254(id);if(!found)return;const {b,q}=found,e=businessIndex254[q.event];
 if(q.status==='saleProposal'&&businessValid254(b,q))return businessSaleMenu254(b,q);
 if(!businessActive254(b,q))return toast('Ситуация больше не действует.');
 show(e.title,b.title+' · '+b.city+'\n'+e.text,e.choices.map((choice,index)=>{const p=businessPlan254(b,q,index),why=businessWhy254(b,q,p);return {label:choice.label,hint:why,disabled:!!why,fn:()=>{
  const native=['hire','equipment','rent','rentAccept','branch','premises','partner','finance','close','sale'].includes(p.op);
  let details=native?'Следующий шаг откроет условия действия для этого предприятия.': 'Расход со счёта: '+money(p.cost*fxRate86(b.country))+'. '+(p.revenue?'Оплата при успешном завершении: '+money(p.revenue*fxRate86(b.country))+'. ':'')+'Срок: '+p.months+' мес.\nПри успехе: '+p.success+'\nИначе: '+p.failure;
  if(p.op==='hire')details='Найм постоянного сотрудника: '+money(enterpriseWage155(b)*fxRate86(b.country))+'/мес. Нужен резерв на две зарплаты.';
  if(p.op==='equipment')details='Стоимость оборудования: '+money(enterpriseInvestment156(b,'equipment')*fxRate86(b.country))+'.';
  show(choice.label,b.title+'\n'+details,[{label:'Подтвердить',fn:()=>{if(!businessCommit254(id,index))toast('Действие больше недоступно.');}},{label:'Назад',fn:()=>businessOpen254(id)}]);
 }};}));
}
function businessFunding254(id){
 const b=businessFind254(id);if(!b)return;
 const unit=Math.max(1,Math.round(enterpriseRent157(b))),token=id16('business-funding254');
 show('Финансирование дела',b.title+' · пополнение из личных средств. Если берёшь личный кредит, долг остаётся твоим даже после закрытия предприятия.',[
  ...[1,3].map(n=>({label:'Внести '+money(unit*n*fxRate86(b.country)),disabled:!businessLocal254(b)||s.cash<unit*n*fxRate86(b.country),fn:()=>{if(businessFund254(id,unit*n,token))businessJournal254(id);else toast('Пополнение сейчас недоступно.');}})),
  {label:'Рассмотреть личный кредит',fn:financeMenu},{label:'Назад',fn:()=>businessJournal254(id)}
 ]);
}
function businessFund254(id,amount,token){
 const b=businessFind254(id);if(!businessLocal254(b)||!Number.isFinite(amount)||amount<=0||!token)return false;
 const st=businessState254(b),price=amount*fxRate86(b.country);
 if(st.ledger.some(r=>r.id===token)||s.cash<price)return false;
 s.cash-=price;b.cash+=amount;st.ledger.push({id:token,tick:s.clock.ticks,amount,note:'Вклад владельца',country:b.country});save();render();return true;
}
function businessJournal254(id){
 const b=businessFind254(id);if(!b)return;const st=businessState254(b);
 show('Дела предприятия',b.title+' · '+st.receivables.filter(r=>r.status==='overdue').length+' неоплаченных счетов',[
  ...st.cases.slice(-20).reverse().map(q=>({label:businessIndex254[q.event].title,hint:({offered:'Нужен ответ',scheduled:'В работе до месяца '+q.due,resolved:'Решение выполнено',expired:'Срок ответа истёк',cancelled:'Отменено',saleProposal:'Предложение о покупке'})[q.status]||q.status,fn:()=>businessActive254(b,q)||q.status==='saleProposal'?businessOpen254(q.id):show(businessIndex254[q.event].title,q.result||'Дело '+q.entity.status,[{label:'Назад',fn:()=>businessJournal254(id)}])})),
  {label:'Пополнить счёт предприятия',fn:()=>businessFunding254(id)},
  {label:'Операции по счёту',fn:()=>show('Операции по делам',st.ledger.slice(-30).map(r=>r.note+' · '+money(r.amount*fxRate86(b.country))).join('\n')||'Пока нет операций.',[{label:'Назад',fn:()=>businessJournal254(id)}])},
  {label:'Назад',fn:enterpriseMenu152}
 ]);
}
function businessCancel254(b,q){
 if(q.status==='scheduled'&&q.plan?.op==='refund')businessMoney254(b,q,'refund-release',q.plan.cost,'Возврат резерва отменённой компенсации');
 q.status='cancelled';q.entity.status='cancelled';q.result='Контекст дела изменился; дальнейшие действия отменены.';
}
function businessMonth254(){
 const tick=s.clock.ticks;let offered=ownedEnterprises168().some(b=>b.cases254?.cases.some(q=>['offered','saleProposal'].includes(q.status)));
 for(const b of ownedEnterprises168()){
  const st=businessState254(b);if(st.lastMonth===tick)continue;st.lastMonth=tick;
  for(const q of st.cases){
   if(['offered','proposal','saleProposal','scheduled'].includes(q.status)&&!businessValid254(b,q)){businessCancel254(b,q);}
   if(['offered','proposal','saleProposal'].includes(q.status)&&tick>=q.expires){q.status='expired';q.entity.status='expired';}
   if(q.status==='scheduled'&&q.due<=tick)businessApply254(b,q,q.roll<q.plan.p);
  }
  st.modifiers=st.modifiers.filter(m=>m.until>=tick);
  if(offered||!businessLocal254(b))continue;
  const candidates=businessEvents254.filter(e=>businessEligible254(b,e)),offset=tick%Math.max(1,candidates.length);
  const scale={rare:.55,normal:1,frequent:1.65}[s.catalog245?.frequency]||1;
  for(const e of candidates.slice(offset).concat(candidates.slice(0,offset)))if(chance(e.p*scale)&&businessOffer254(b,e.id)){offered=true;break;}
 }
}
autonomousMonth=function(){const result=businessBase254.month();businessMonth254();return result;};
// New catalogue enterprises receive interactive incidents instead of duplicate automatic incidents.
enterpriseEvent153=function(b){return businessById253[b.specialty]?null:businessBase254.event(b);};
decisionRecord24=function(ref){return ref?.kind==='business254'?businessCase254(ref.id)?.q:businessBase254.record(ref);};
decisionActive24=function(ref){if(ref?.kind!=='business254')return businessBase254.active(ref);const found=businessCase254(ref.id);return !!found&&(businessActive254(found.b,found.q)||found.q.status==='saleProposal'&&businessValid254(found.b,found.q)&&s.clock.ticks<found.q.expires);};
decisionItems24=function(){return [...businessBase254.items(),...ownedEnterprises168().flatMap(b=>(b.cases254?.cases||[]).filter(q=>decisionActive24({kind:'business254',id:q.id})).map(q=>({ref:{kind:'business254',id:q.id},q,title:businessIndex254[q.event].title,note:b.title,expires:q.expires})))];};
openDecision24=function(kind,id){return kind==='business254'?businessOpen254(id):businessBase254.open(kind,id);};

closeEnterprise152=function(id){
 const b=s.enterprise152;if(!b||b.id!==id||b.status!=='active'||s.dead)return false;
 for(const q of b.cases254?.cases||[])if(['offered','proposal','saleProposal','scheduled'].includes(q.status))businessCancel254(b,q);
 return businessBase254.close(id);
};
