'use strict';

const friendshipEvents247 = ['E0095', 'E0096', 'E0098', 'E0092', 'E0033', 'E0040'];
const previous247 = { valid: catalogValid245, month: catalogMonth245, resolve: catalogResolve245,
  choice: catalogChoice245, open: openDecision24 };

function localContact247(person) {
  return person?.alive && !person.social17?.inactive && person.country === s.country &&
    (!person.city18 || person.city18 === residenceCity());
}

function secretClub247(club) {
  return club.status === 'active' && club.sessions > 0 && clubLocal19(club);
}

function oldFriend248(person) {
  const contact = person?.social17;
  return person?.alive && person.role === 'Друг' && contact?.inactive &&
    contact.meetings >= 6 && s.clock.ticks - contact.last > 36 &&
    person.country === s.country && person.city18 === residenceCity();
}

function practiceEligible248(event, key) {
  const hobby = s.hobbies?.[key];
  if (!hobbies[key] || !(hobby?.sessions >= 3)) return false;
  return event === 'E0033' || key === 'photo';
}

function friendBinding247(event) {
  if (event === 'E0092') {
    const contacts = s.people.filter(oldFriend248);
    return contacts.length ? {person: pick(contacts).id} : null;
  }
  const friends = s.people.filter(catalogFriend245);
  if (!friends.length) return null;
  if (event === 'E0033' || event === 'E0040') {
    const practiced = Object.keys(s.hobbies || {}).filter(key => practiceEligible248(event, key));
    return practiced.length ? {person: pick(friends).id, hobby: pick(practiced)} : null;
  }
  if (event !== 'E0095') return { person: pick(friends).id };
  for (const club of clubState19().memberships.filter(secretClub247)) {
    const known = club.roster.filter(slot => slot.personId).map(slot => living(slot.personId)).filter(localContact247);
    const teller = known.find(catalogFriend245);
    const others = known.filter(person => person !== teller);
    if (teller && others.length >= 2) {
      return { person: teller.id, subject: others[0].id, listener: others[1].id, club: club.id };
    }
  }
  return null;
}

catalogValid245 = function(record) {
  if (!friendshipEvents247.includes(record.event)) return previous247.valid(record);
  if (!catalogAvailable245() || s.age < 16 || record.country !== s.country ||
      record.city !== residenceCity()) return false;
  if (record.event === 'E0092') return oldFriend248(living(record.person));
  if (!catalogFriend245(living(record.person))) return false;
  if (record.event === 'E0033' || record.event === 'E0040') return practiceEligible248(record.event, record.hobby);
  if (record.event !== 'E0095') return true;
  const club = clubState19().memberships.find(item => item.id === record.club);
  const participants = [record.person, record.subject, record.listener];
  return !!club && secretClub247(club) && new Set(participants).size === 3 &&
    participants.every(id => localContact247(living(id)) && club.roster.some(slot => slot.personId === id));
};

catalogMonth245 = function() {
  const state = catalogState245();
  const alreadyProcessed = state.lastMonth === s.clock.ticks;
  previous247.month();
  if (alreadyProcessed || !catalogAvailable245() || s.age < 16 || state.events.some(q => q.status === 'offered')) return;
  const frequency = {rare: .55, normal: 1, frequent: 1.65}[state.frequency] || 1;
  for (let i = 0; i < friendshipEvents247.length; i++) {
    const event = friendshipEvents247[(s.clock.ticks + i) % friendshipEvents247.length];
    if (!chance(data246(event).p * frequency)) continue;
    const binding = friendBinding247(event);
    if (binding && catalogOffer245(event, binding)) break;
  }
};

function needsProjectTime247(record, index) {
  if (index !== 0) return false;
  const hours = {E0098: 3, E0033: 1, E0040: 2}[record.event] || 0;
  return hours > 0 && capacity() - totalHours() < hours;
}

openDecision24 = function(kind, id) {
  const record = kind === 'catalog245' && decisionRecord24({kind, id});
  if (!record || !friendshipEvents247.includes(record.event)) return previous247.open(kind, id);
  if (!catalogActive245(record)) return toast('Обстоятельства изменились.');
  const event = data246(record.event);
  const details = [living(record.person).name, event.text];
  if (record.hobby) details.push(hobbies[record.hobby][0]);
  if (record.subject) details.push('В разговоре речь о человеке по имени ' + living(record.subject).name + '.');
  const choices = event.choices.map((choice, index) => ({
    label: record.listener && index === 1 ? 'Рассказать · ' + living(record.listener).name : choice.title,
    hint: index === 0 ? ({E0098: '2 месяца · 3 ч/нед.', E0033: '1 месяц · 1 ч/нед.', E0040: '2 месяца · 2 ч/нед.'}[record.event] || '') : '',
    disabled: needsProjectTime247(record, index),
    fn: () => catalogChoice245(id, choice.id)
  }));
  show(event.title, details.join('\n'), choices);
};

catalogChoice245 = function(id, choiceId) {
  const record = catalogState245().events.find(q => q.id === id);
  if (!record || !friendshipEvents247.includes(record.event)) return previous247.choice(id, choiceId);
  const event = data246(record.event);
  const index = event.choices.findIndex(choice => choice.id === choiceId);
  if (index < 0 || !catalogActive245(record) || needsProjectTime247(record, index)) return false;
  const friend = living(record.person);
  const outcomes = event.choices[index].outcomes;
  const primary = chance(outcomes[0].p);
  const outcome = outcomes[primary ? 0 : 1];
  Object.assign(record, {status: 'resolved', committed: s.clock.ticks, choice: choiceId, outcome: outcome.id});
  let message = outcome.text;
  if (record.event === 'E0092') {
    if (index === 0 && primary) {
      socialTouch17(friend);
      remember(friend, 'Возобновили общение после долгого перерыва.');
    } else if (index === 1 && !primary) {
      Object.assign(record, {status: 'scheduled', due: s.clock.ticks + 1, hours: 0});
      message = 'Вы прошли мимо. Друг заметил вас.';
    } else if (index === 0) {
      remember(friend, 'Случайная встреча в кафе закончилась неловким разговором.');
    }
  } else if (record.event === 'E0033' || record.event === 'E0040') {
    const lesson = record.event === 'E0033';
    if (primary && (index === 0 || !lesson)) {
      const months = lesson ? 1 : 2;
      const delay = index === 1 ? 1 : 0;
      // Postponement reserves no hours. Next month the player can accept the available slot.
      Object.assign(record, {status: 'scheduled', revisit: Boolean(delay),
        due: s.clock.ticks + (delay || months), hours: delay ? 0 : months});
    } else if (lesson && index === 1 && !primary) {
      rel(friend, {strain: 2});
    }
    remember(friend, message);
  } else if (record.event === 'E0095') {
    if (index === 0) {
      rel(friend, primary ? {trust: 2} : {strain: 1});
    } else {
      const listener = living(record.listener);
      remember(listener, 'Вы рассказали секрет о человеке по имени ' + living(record.subject).name + '.');
      if (primary) {
        remember(friend, 'В клубе узнали о нашем личном разговоре.');
        rel(friend, {trust: -4, strain: 2});
        message = 'Друг узнал, что вы пересказали его историю. Теперь он меньше вам доверяет.';
      } else rel(listener, {trust: -1});
    }
  } else if (record.event === 'E0096') {
    rel(friend, index === 0 && primary ? {trust: 2, strain: -2} : {strain: 2});
    remember(friend, message);
  } else if (index === 0 && primary) {
    Object.assign(record, {status: 'scheduled', due: s.clock.ticks + 2, hours: 3});
    message += ' На проект отведено два месяца по три часа в неделю.';
  } else {
    remember(friend, message);
  }
  log(event.title, friend.name + ' · ' + message, 'Отношения');
  save();
  render();
  return true;
};

catalogResolve245 = function(record) {
  if (!['E0098','E0033','E0040','E0092'].includes(record.event)) return previous247.resolve(record);
  if (record.status !== 'scheduled') return;
  const valid = catalogValid245(record);
  if (valid && record.due > s.clock.ticks) return;
  record.hours = 0;
  record.finished = s.clock.ticks;
  if (!valid || (record.event !== 'E0092' && !record.revisit && s.clock.fatigue > 90)) {
    record.status = 'cancelled';
    log(data246(record.event).title, 'Обстоятельства изменились, и планы пришлось отменить.', 'Отношения');
    return;
  }
  record.status = 'resolved';
  const friend = living(record.person);
  if (record.revisit) {
    if (catalogState245().events.some(q => q !== record && catalogActive245(q))) {
      record.status = 'scheduled';
      record.due = s.clock.ticks + 1;
      return;
    }
    record.revisit = false;
    record.status = 'offered';
    record.expires = s.clock.ticks + 1;
    s.clock.running = false;
    log('Пора решить насчёт выставки', friend.name + ' предлагает вернуться к фотопроекту.', 'Отношения', false, {kind:'catalog245', id:record.id});
    return;
  }
  if (record.event === 'E0092') {
    remember(friend, 'После встречи в кафе пришло короткое сообщение.');
    log('Сообщение после встречи', friend.name + ' пишет: «Кажется, мы виделись в кафе. Как ты?»', 'Отношения');
    return;
  }
  if (record.hobby) {
    const hobby = s.hobbies[record.hobby];
    hobby.sessions++;
    hobby.skill = Math.min(100, (hobby.skill || 0) + 1);
    socialTouch17(friend);
    const result = record.event === 'E0033' ? 'Состоялось первое занятие' : 'Готова совместная серия для фотовыставки';
    remember(friend, result + ' · ' + hobbies[record.hobby][0]);
    log(result, friend.name + ' · ' + hobbies[record.hobby][0], 'Занятия');
    return;
  }
  rel(friend, {trust: 3, affection: 1});
  remember(friend, 'Вместе довели небольшой проект до конца.');
  log('Совместный проект завершён', friend.name + ' · За два месяца вы выполнили намеченную работу.', 'Отношения');
};
