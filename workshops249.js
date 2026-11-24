'use strict';

const workshopEvents249 = ['E0031','E0036','E0039','E0037','E0038'];
const workshopBase249 = {month: catalogMonth245, valid: catalogValid245, open: openDecision24,
  choice: catalogChoice245, resolve: catalogResolve245};

function exhibitionWorks249() {
  const photo = s.hobbies?.photo;
  if (!photo) return [];
  const works = photo.exhibitions249 ??= [];
  // Import completed exhibitions still present in build 248 saves.
  for (const q of catalogState245().events) {
    if (q.event === 'E0040' && q.status === 'resolved' && q.finished !== undefined &&
        q.choice === 'E0040_C01' && q.outcome === data246('E0040').choices[0].outcomes[0].id &&
        !works.some(work => work.id === q.id)) {
      works.push({id:q.id, tick:q.finished, partner:q.person, city:q.city, country:q.country});
    }
  }
  return works;
}

const supplies250 = {photo:'Фотоплёнка', cooking:'Набор пряностей', garden:'Семена редкого сорта'};
const techniques250 = {photo:'Макросъёмка', music:'Импровизация', cooking:'Ферментация',
  garden:'Черенкование', film:'Анализ монтажа', sport:'Тренировка равновесия'};

function practiceDetails250(key) {
  const hobby = s.hobbies?.[key];
  const lines = [];
  if (hobby?.supply250) lines.push(supplies250[key] + ' · на следующее разовое занятие');
  if (hobby?.technique250) lines.push(techniques250[key] + ' · занятий по технике: ' + hobby.technique250.sessions);
  return lines.join('\n');
}

function eligiblePractice250(event,key) {
  if (!practiceEligible248('E0033',key)) return false;
  return event === 'E0037' ? !!supplies250[key] && !s.hobbies[key].supply250
    : !!techniques250[key] && !s.hobbies[key].technique250;
}

function workshopBinding249(event) {
  if (['E0037','E0038'].includes(event)) {
    const keys = Object.keys(s.hobbies || {}).filter(key => eligiblePractice250(event,key));
    return keys.length ? {hobby:pick(keys)} : null;
  }
  if (event === 'E0031') {
    const practiced = Object.keys(s.hobbies || {}).filter(key => practiceEligible248('E0033', key));
    return practiced.length ? {hobby:pick(practiced)} : null;
  }
  const photo = s.hobbies?.photo;
  if (!photo || (event === 'E0039' && photo.firstCommission249)) return null;
  const works = exhibitionWorks249().filter(work => work.country === s.country &&
    work.city === residenceCity() && !(event === 'E0036' && work.contest));
  return works.length ? {hobby:'photo', work:works.at(-1).id} : null;
}

catalogValid245 = function(q) {
  if (!workshopEvents249.includes(q.event)) return workshopBase249.valid(q);
  if (!catalogAvailable245() || s.age < 18 || q.country !== s.country || q.city !== residenceCity()) return false;
  if (['E0037','E0038'].includes(q.event)) return eligiblePractice250(q.event,q.hobby);
  if (q.event === 'E0031') return practiceEligible248('E0033', q.hobby);
  const work = exhibitionWorks249().find(item => item.id === q.work);
  if (!work || work.country !== q.country || work.city !== q.city) return false;
  return q.event === 'E0036' ? !work.contest : !s.hobbies.photo.firstCommission249;
};

catalogMonth245 = function() {
  const state = catalogState245();
  const alreadyRan = state.lastMonth === s.clock.ticks;
  workshopBase249.month();
  if (alreadyRan || !catalogAvailable245() || s.age < 18 || state.events.some(q => q.status === 'offered')) return;
  const scale = {rare:.55, normal:1, frequent:1.65}[state.frequency] || 1;
  for (let i=0; i<workshopEvents249.length; i++) {
    const event = workshopEvents249[(s.clock.ticks+i) % workshopEvents249.length];
    if (!chance(data246(event).p * scale)) continue;
    const binding = workshopBinding249(event);
    if (binding && catalogOffer245(event,binding)) break;
  }
};

function workshopLabel249(q) {
  if (q.event === 'E0037') return hobbies[q.hobby][0] + ' · ' + supplies250[q.hobby];
  if (q.event === 'E0038') return hobbies[q.hobby][0] + ' · ' + techniques250[q.hobby];
  if (!q.work) return hobbies[q.hobby][0];
  const work = exhibitionWorks249().find(item => item.id === q.work);
  const partner = s.people.find(person => person.id === work.partner);
  return 'Выставочная серия · ' + work.city + (partner ? ' · ' + partner.name : '');
}

function terms249(q) {
  if (q.event === 'E0037') return 'Обычная цена ' + money(q.regular) + ' · со скидкой ' + money(q.amount) + '. Материал пригодится на следующем разовом занятии.';
  return q.event === 'E0031' ? 'Стоимость ' + money(q.amount) + ' · 1 месяц · 2 ч/нед.'
    : 'Гонорар ' + money(q.amount) + ' после сдачи · 2 месяца · 2 ч/нед.';
}

function blocked249(q) {
  if (q.event === 'E0037') return expenseAvailable231() < q.amount ? 'Не хватает денег на покупку.' : '';
  if (capacity() - totalHours() < 2) return 'Нужно освободить 2 ч/нед.';
  if (q.event === 'E0031' && expenseAvailable231() < q.amount) return 'Не хватает денег на участие.';
  return '';
}

openDecision24 = function(kind,id) {
  const q = kind === 'catalog245' && decisionRecord24({kind,id});
  if (!q || !workshopEvents249.includes(q.event)) return workshopBase249.open(kind,id);
  if (!catalogActive245(q)) return toast('Срок предложения истёк или обстоятельства изменились.');
  const event = data246(q.event);
  if (q.phase === 'terms') {
    const reason = blocked249(q);
    return show(event.title, workshopLabel249(q) + '\n' + terms249(q), [
      {label:q.event === 'E0037' ? 'Купить за ' + money(q.amount) : q.event === 'E0031' ? 'Оплатить участие' : 'Принять заказ', hint:reason,
        disabled:!!reason, fn:()=>catalogChoice245(id,'acceptTerms')},
      {label:'Отказаться', fn:()=>catalogChoice245(id,'declineTerms')}
    ]);
  }
  show(event.title, workshopLabel249(q) + '\n' + event.text, event.choices.map(choice => ({
    label:choice.title, hint:q.event === 'E0038' && choice === event.choices[0] ? '1 месяц · 2 ч/нед.' : '',
    disabled:q.event === 'E0038' && choice === event.choices[0] && !!blocked249(q), fn:()=>catalogChoice245(id,choice.id)
  })));
};

catalogChoice245 = function(id,choiceId) {
  const q = catalogState245().events.find(item => item.id === id);
  if (!q || !workshopEvents249.includes(q.event)) return workshopBase249.choice(id,choiceId);
  if (!catalogActive245(q)) return false;
  const event = data246(q.event);
  let message;
  if (q.phase === 'terms') {
    if (choiceId === 'acceptTerms') {
      if (blocked249(q)) return false;
      if (['E0031','E0037'].includes(q.event) && !spend231(q.amount,event.title,q.id)) return false;
      if (q.event === 'E0037') {
        s.hobbies[q.hobby].supply250 = q.id;
        q.status = 'resolved';
        message = supplies250[q.hobby] + ' · покупка оплачена: ' + money(q.amount) + '.';
      } else {
        Object.assign(q,{status:'scheduled', hours:2, due:s.clock.ticks+(q.event === 'E0031' ? 1 : 2)});
        message = terms249(q);
      }
    } else if (choiceId === 'declineTerms') {
      q.status = 'resolved';
      message = 'Вы отказались от предложенных условий.';
    } else return false;
  } else {
    const index = event.choices.findIndex(choice => choice.id === choiceId);
    if (index < 0 || (q.event === 'E0038' && index === 0 && blocked249(q))) return false;
    const outcomes = event.choices[index].outcomes;
    const primary = chance(outcomes[0].p);
    const outcome = outcomes[primary ? 0 : 1];
    Object.assign(q,{choice:choiceId, outcome:outcome.id, committed:s.clock.ticks, status:'resolved'});
    message = outcome.text;
    if (index === 0 && primary) {
      if (q.event === 'E0037') {
        const regular = Math.max(2,Math.round(c().cost*.003));
        Object.assign(q,{status:'offered',phase:'terms',expires:s.clock.ticks+1,regular,amount:Math.round(regular*.7)});
      } else if (q.event === 'E0038') {
        Object.assign(q,{status:'scheduled',hours:2,due:s.clock.ticks+1});
        message = 'Пробное занятие запланировано · ' + techniques250[q.hobby] + '.';
      } else if (q.event === 'E0036') {
        Object.assign(q,{status:'scheduled', due:s.clock.ticks+1, hours:0, juryRoll:Math.random()});
      } else {
        Object.assign(q,{status:'offered', phase:'terms', expires:s.clock.ticks+2,
          amount:Math.max(1,Math.round(c().cost*(q.event === 'E0031' ? .004 : .015)))});
      }
    } else if (q.event === 'E0038' && !primary && index === 0) {
      message = 'Для этой техники пока не хватает подготовки. Пробное занятие не назначено.';
    } else if (!primary && index === 1) {
      message = 'Вы решили пока продолжать обычные занятия.';
    } else if (!primary && q.event === 'E0031') {
      message = 'Свободных мест на этот интенсив уже нет.';
    }
  }
  log(event.title,message,'Занятия');
  save();
  render();
  if (q.status === 'offered') openDecision24('catalog245',q.id);
  return true;
};

catalogResolve245 = function(q) {
  if (!workshopEvents249.includes(q.event)) {
    const wasExhibition = q.event === 'E0040' && q.status === 'scheduled';
    const result = workshopBase249.resolve(q);
    if (wasExhibition && q.status === 'resolved') exhibitionWorks249();
    return result;
  }
  if (q.status !== 'scheduled') return;
  if (!catalogValid245(q)) {
    q.status = 'cancelled';
    q.hours = 0;
    if (q.event === 'E0031') s.cash += q.amount;
    log(data246(q.event).title, q.event === 'E0031' ? 'Занятие отменено. Оплата возвращена.' : 'Обстоятельства изменились. Участие отменено.', 'Занятия');
    return;
  }
  if (q.due > s.clock.ticks) return;
  q.status = 'resolved';
  q.hours = 0;
  q.finished = s.clock.ticks;
  const hobby = s.hobbies[q.hobby];
  let message;
  if (q.event === 'E0036') {
    const work = exhibitionWorks249().find(item => item.id === q.work);
    const selected = q.juryRoll < Math.min(.8,.2+(hobby.skill || 0)/150);
    work.contest = {tick:q.finished, selected};
    message = selected ? 'Жюри включило фотосерию в число финалистов.' : 'Жюри рассмотрело серию. В финал она не прошла.';
  } else {
    hobby.sessions++;
    hobby.skill = Math.min(100,(hobby.skill || 0)+1);
    if (q.event === 'E0038') {
      hobby.technique250 = {sessions:1};
      message = 'Освоена техника «' + techniques250[q.hobby] + '». Её можно практиковать на следующих разовых занятиях.';
    } else if (q.event === 'E0039') {
      s.cash += q.amount;
      hobby.firstCommission249 = {work:q.work, tick:q.finished, amount:q.amount};
      message = 'Заказ сдан. Получен гонорар ' + money(q.amount) + '.';
    } else message = 'Мастер-класс завершён. Практика засчитана · ' + hobbies[q.hobby][0] + '.';
  }
  log(data246(q.event).title,message,'Занятия');
};

const finishPractice250 = finishTask;
finishTask = function(task) {
  const hobby = task.kind === 'hobby' && s.hobbies?.[task.hobby];
  const before = hobby?.sessions;
  const result = finishPractice250(task);
  if (!hobby || !(hobby.sessions > before) || task.practice250) return result;
  task.practice250 = true;
  if (hobby.supply250) {
    delete hobby.supply250;
    hobby.skill = Math.min(100,(hobby.skill || 0)+1);
    log('Материал использован', supplies250[task.hobby] + ' · дополнительная практика засчитана.', 'Занятия');
  }
  if (hobby.technique250) {
    hobby.technique250.sessions++;
    if (hobby.technique250.sessions % 3 === 0) hobby.skill = Math.min(100,(hobby.skill || 0)+1);
  }
  return result;
};
