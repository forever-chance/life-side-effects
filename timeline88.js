'use strict';

const timelineTopics88 = {
  family: 'Семья', education: 'Образование', career: 'Карьера',
  relationships: 'Отношения', places: 'Переезды', milestones: 'Достижения'
};

const timelineTitles88 = {
  family: /^(У этой истории появилось имя|Совершеннолетие|Первый отдельный адрес|Родители развелись|Смена опекуна|Долгосрочная опека|Родилась младшая сестра|Родился младший брат|В семье появился младший ребёнок|Заключение близкого|Освобождение близкого|Временный уход на время заключения|Возвращение домой после заключения|Временный уход на время лечения|Возвращение домой после лечения|Возвращение из приёмной семьи|Возвращение из детского дома|Поставили диагноз|Наступила ремиссия|Болезнь вернулась|Инфаркт|ДТП|Бытовой пожар|Серьёзное падение|Травма на работе|Происшествие на воде|У(?:сыновление|дочерение) после приёмной опеки|Новый брак родителя|Близкий переехал к вам|Родители переехали|Умер(?:ла)? .+)$/,
  education: /^(Начало учебы|Учеба началась|Учеба прервалась|Учеба приостановлена|Возвращение к учебе|Диплом в руках|Диплом получен|Квалификация получена|Смена школы|Отчисление за успеваемость|Отчисление из платной школы)$/,
  career: /^(Открыто своё дело|Своё дело закрыто|Первый рабочий день|Новый рабочий стол|Повышение|Другая команда|Должность сокращена|Последний рабочий день|Увольнение|Условия работы изменены|Новые условия вступили в силу)$/,
  relationships: /^(Вы решили быть вместе|Вы теперь встречаетесь|Начало отношений|Теперь в браке|Брак завершен|Маршруты разошлись)$/,
  places: /^(Переезд состоялся|Переезд ради учебы|Семья переехала|Новый адрес|Административное возвращение исполнено|Гражданство оформлено)$/,
  milestones: /^(Недвижимость куплена|Объект продан|Жильё куплено в ипотеку|Объект продан с расчётом по ипотеке|Ипотека погашена|Книга опубликована|Стипендия одобрена|Нужен долгосрочный контроль)$/
};

function timelineTopic88(event) {
  if (event.tag === 'Пенсия') return 'career';
  if (event.major && event.tag === 'Семья' && s.people.some(p => ownChild53(p) && event.title === p.name + ' дома')) return 'family';
  if (event.major && ['Новый человек', 'Родительство', 'Рождение', 'Усыновление'].includes(event.tag)
      && / дома$|родился|родилась|усыновл/i.test(event.title)) return 'family';
  return Object.keys(timelineTitles88).find(topic => timelineTitles88[topic].test(event.title));
}

function timelineEntry88(archive, event, live = false) {
  const id = event.timeline88Id ?? (event.timeline88Id = ++archive.serial);
  const topic = timelineTopic88(event);
  if (!topic) return id;
  archive.events[id] ??= timelineSnapshot88(event, topic, live);
  return id;
}

function timelineSnapshot88(event, topic, live = false) {
  const named = s.people.filter(p =>
    event.title === 'Умер ' + p.name || event.title === 'Умерла ' + p.name ||
    (topic === 'family' && ownChild53(p) && event.title === p.name + ' дома') ||
    (topic === 'relationships' && event.text?.startsWith(p.name + ':')));
  const person = event.personId ?? event.decision24?.personId ?? (named.length === 1 ? named[0].id : null);
  return {
    id: event.timeline88Id,
    year: event.year, month: event.month, age: event.age,
    title: event.title, text: event.text, tag: event.tag,
    topic, person: s.people.some(p => p.id === person) ? person : null,
    place: live && topic === 'places' ? {country: s.country, city: residenceCity()} : null
  };
}

function timelineState88() {
  if (s.timeline88) return s.timeline88;
  const archive = s.timeline88 = {serial: 0, events: {}, pins: {}};
  for (const event of [...s.log].reverse()) timelineEntry88(archive, event);
  return archive;
}

const timelineOriginalLog88 = log;
log = function (...args) {
  if (!s) return timelineOriginalLog88(...args);
  const archive = timelineState88();
  const previous = s.log[0];
  const result = timelineOriginalLog88(...args);
  const event = s.log[0];
  if (event && event !== previous) timelineEntry88(archive, event, true);
  return result;
};

function timelineTogglePin88(id) {
  const archive = timelineState88();
  if (archive.pins[id]) {
    delete archive.pins[id];
    if (!archive.events[id]?.topic) delete archive.events[id];
  } else {
    const event = s.log.find(entry => entry.timeline88Id === id);
    if (!event && !archive.events[id]) return;
    if (event) archive.events[id] ??= timelineSnapshot88(event, null);
    archive.pins[id] = true;
  }
  save();
  render();
}

let dossierSection88 = 'dossier';
let timelineFilter88 = 'all';
const timelineOriginalTab88 = setTab;
setTab = function (next) {
  if (next === 'world' && tab !== 'world') dossierSection88 = 'dossier';
  return timelineOriginalTab88(next);
};

function dossierSelect88(section) {
  dossierSection88 = section;
  render();
  if (section === 'family') treeScrollCenter90();
}

function timelineFilterSet88(value) {
  timelineFilter88 = value;
  render();
}

function timelineDate88(event) {
  const date = Number.isFinite(event.year)
    ? [months[event.month], event.year].filter(v => v != null).join(' ') : '';
  return [date, Number.isFinite(event.age) ? years(event.age) : ''].filter(Boolean).join(' · ');
}

// Format archived wording without recalculating historical amounts or changing saves.
function timelineParagraphs243(text) {
  return String(text || '').split(/\n+/).filter(part => part.trim()).flatMap(part => {
    const sentences = typeof Intl.Segmenter === 'function'
      ? Array.from(new Intl.Segmenter('ru', {granularity: 'sentence'}).segment(part), item => item.segment.trim())
      : [part.trim()];
    const paragraphs = [];
    let current = '';
    for (const sentence of sentences) {
      if (current && current.length + sentence.length > 180) {
        paragraphs.push(current); current = '';
      }
      current += (current ? ' ' : '') + sentence;
    }
    if (current) paragraphs.push(current);
    return paragraphs;
  }).map(part => '<p>' + esc(part) + '</p>').join('');
}

function timelineBody243(event) {
  const text = eventDescription204(event.text);
  let match, summary, facts, note;
  if (event.title === 'Новый адрес') {
    if ((match = text.match(/^(.+?)\. Жильё (.+?)\/мес\. Возвращён старый залог (.+?), переезд (.+?), новый залог (.+?)\.\s*([\s\S]*)$/))) {
      summary = match[1];
      facts = [['Жильё в месяц', match[2] + '/мес.'], ['Переезд', match[4]],
        ['Возврат старого залога', match[3]], ['Новый залог', match[5]]];
      note = match[6];
    } else if ((match = text.match(/^(.+?)\. Аренда (.+?)\/мес\. Новый залог (.+?), возвращён прежний (.+?), переезд (.+?)\.\s*([\s\S]*)$/))) {
      summary = match[1];
      facts = [['Аренда в месяц', match[2] + '/мес.'], ['Переезд', match[5]],
        ['Возврат старого залога', match[4]], ['Новый залог', match[3]]];
      note = match[6];
    }
  }
  if (!facts) return '<div class="timeline-body243">' + timelineParagraphs243(text) + '</div>';
  return '<div class="timeline-body243"><p class="timeline-summary243">' + esc(summary) + '</p>' +
    '<dl class="timeline-facts243">' + facts.map(([label, value]) =>
      '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>').join('') + '</dl>' +
    (note ? '<div class="timeline-note243">' + timelineParagraphs243(note) + '</div>' : '') + '</div>';
}

function timelineView88() {
  const archive = timelineState88();
  const filters = {all: 'Все события', ...timelineTopics88, pinned: 'Отмеченные'};
  const entries = Object.values(archive.events)
    .filter(e => timelineFilter88 === 'all' || e.topic === timelineFilter88 ||
      (timelineFilter88 === 'pinned' && archive.pins[e.id]))
    .sort((a, b) => (b.year ?? -1) - (a.year ?? -1) || b.id - a.id);
  let output = '<article class="dossier87"><h1 class="timeline-title88">Хронология</h1>' +
    '<div class="timeline-tools88"><select class="timeline-filter88" aria-label="Фильтр событий" onchange="timelineFilterSet88(this.value)">' +
    Object.entries(filters).map(([id, title]) =>
      '<option value="' + id + '"' + (id === timelineFilter88 ? ' selected' : '') + '>' + title + '</option>'
    ).join('') + '</select></div>';
  if (!entries.length) return output + '<p>В этой подборке пока нет событий.</p></article>';
  let group;
  for (const event of entries) {
    const year = event.year ?? 'Без даты';
    if (year !== group) {
      if (group !== undefined) output += '</ol>';
      output += '<h2 class="timeline-year88">' + esc(String(year)) + '</h2><ol class="timeline-list88">';
      group = year;
    }
    const person = s.people.find(p => p.id === event.person);
    const place = event.place && [event.place.city, countries[event.place.country]?.name].filter(Boolean).join(', ');
    const pinned = Boolean(archive.pins[event.id]);
    const mark = pinned ? 'Снять отметку' : 'Отметить событие';
    output += '<li><button type="button" class="timeline-star88" aria-pressed="' + pinned +
      '" aria-label="' + mark + '" title="' + mark + '" onclick="timelineTogglePin88(' + event.id + ')">' +
      (pinned ? '★' : '☆') + '</button><p class="dossier-muted87 timeline-date88">' +
      esc(timelineDate88(event)) + '</p><h3>' + esc(event.title) + '</h3>' + timelineBody243(event) +
      (place ? '<button type="button" class="small" onclick="timelinePlace88(' + event.id + ')">' + esc(place) + '</button>' : '') +
      (person ? '<button type="button" class="small" onclick="timelinePerson88(' + event.id + ')">Открыть карточку · ' +
        esc(person.name) + '</button>' : '') + '</li>';
  }
  return output + '</ol></article>';
}

function timelinePlace88(id) {
  const place = timelineState88().events[id]?.place;
  if (!place) return;
  const title = [place.city, countries[place.country]?.name].filter(Boolean).join(', ');
  show(title, cityNotes87[place.city] || countryNotes87[place.country] || '');
}

function timelinePerson88(id) {
  const person = timelineState88().events[id]?.person;
  if (person) personDetail(person);
}

world = function () {
  const nav = '<nav class="timeline-tools88 section-tabs243" aria-label="Личное дело">' +
    [['dossier', 'Досье'], ['timeline', 'Хронология'], ['geography', 'География'], ['family', 'Семья']].map(([id, title]) =>
      '<button aria-pressed="' + (id === dossierSection88) + '" onclick="dossierSelect88(\'' + id + '\')">' +
      title + '</button>').join('') + '</nav>';
  return nav + (dossierSection88 === 'family' ? treeView90() : dossierSection88 === 'geography' ? atlasView89() : dossierSection88 === 'timeline' ? timelineView88() : dossierView87());
};
