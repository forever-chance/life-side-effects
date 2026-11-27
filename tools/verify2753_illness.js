// Проверки сборки 275.3: болезни и поездки (illness2753.js и точечная правка travel52: travelEndMonth52).
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2753_illness.js
// BASE=1 — прогон без illness2753.js: видно, какие проверки ловят старое поведение.
// SAVE=файл (или OWNER_SAVE) — ещё и на настоящем сохранении (экспорт «Ваши персонажи»; берётся последний персонаж).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', SAVE = process.env.SAVE || process.env.OWNER_SAVE || '';
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (!ok && extra !== '' ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : '')); };
const note = t => console.log('     ' + t);

async function page(browser, { viewport = { width: 390, height: 844 }, raw = null } = {}) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && BASE ? INDEX.replace(/<script src="illness2753\.js[^"]*"><\/script>/, '') : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (raw) await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  else {
    await pg.evaluate(() => { const e = document.getElementById('country'); e.value = 'nl'; e.dispatchEvent(new Event('change', { bubbles: true })); });
    await pg.click('text=Родиться');
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
  });
  await pg.evaluate(helpers);
  return { pg, ctx, errors };
}

// Помощники внутри страницы.
function helpers() {
  window.__lbl = b => [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
  window.__title = () => document.querySelector('#modal h2')?.textContent || '';
  window.__opts = () => [...document.querySelectorAll('#modal .options button')].map(b => ({ label: __lbl(b), disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '', hint: [...b.querySelectorAll('small')].map(x => x.textContent).join(' | ') }));
  window.__opt = label => __opts().find(o => o.label === label) || null;
  window.__clickOpt = label => { const b = [...document.querySelectorAll('#modal .options button')].find(b => __lbl(b) === label && !b.disabled); if (!b) return false; b.click(); return true; };
  window.__tick = () => new Promise(r => setTimeout(r, 0));
  // Карточка 273 (или старый блок trips272, если карточки нет).
  window.__card = () => {
    const m = document.querySelector('#modal');
    const rows = [...m.querySelectorAll('.top273 .row273')].map(r => ({ label: r.querySelector('dt')?.textContent || '', value: r.querySelector('dd')?.childNodes[0]?.textContent || '', note: r.querySelector('dd small')?.textContent || '' }));
    const need = [...m.querySelectorAll('.need273:not([hidden]) .fix273')].map(e => ({ text: e.querySelector('span')?.textContent || '', fix: e.tagName === 'BUTTON' ? e.querySelector('small')?.textContent || '' : null }));
    const main = [...m.querySelectorAll('.main273 button')].map(b => ({ label: __lbl(b), disabled: b.disabled, why: b.querySelector('.why273')?.textContent || '' }));
    const box = m.querySelector('.ready272');
    const old = box ? { ok: box.classList.contains('ready272-ok'), items: [...box.querySelectorAll('li.ready2722-why,.ready272-item')].map(e => e.dataset?.why || e.textContent), note: box.querySelector('.ready272-note')?.textContent || '' } : null;
    return { title: __title(), card: !!m.querySelector('.top273'), rows, got: rows.find(r => r.label === 'Получите') || null, need, status: m.querySelector('.status273')?.textContent || '', main, old };
  };
  window.__needFix = text => { const b = [...document.querySelectorAll('#modal .need273 button.fix273')].find(b => b.querySelector('span')?.textContent === text); if (!b) return false; b.click(); return true; };
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { s.pending = []; if ($('#modal').open) closeModal(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } s.pending = []; if ($('#modal').open) closeModal(); advanceMonth(); } s.pending = []; if ($('#modal').open) closeModal(); };
  // Взрослый без работы, живёт один в съёмной квартире, родители в другом городе: дома никто не остаётся.
  window.__base = (age = 40) => { s.age = age; s.cash = 5e6; s.job = null; s.clock.running = false; activateHome(); const list = cities[s.country]; moveHome('rent', list[0], 'center'); for (const q of parents17()) q.city18 = list[3]; s.pending = []; if ($('#modal').open) closeModal(); __clear(); };
  window.__clear = () => { s.illness = null; s.lastIllnessTick = s.clock.ticks; if (s.incidents56) { s.incidents56.injury = null; s.incidents56.lastEvent = s.clock.ticks; } if (s.health25) for (const q of s.health25.conditions || []) q.flareLeft = 0; travel52().trips = travel52().trips.filter(t => !['planned', 'requested', 'approved', 'away'].includes(t.status)); if (typeof languageStays53 === 'function') languageStays53().trips = []; s.pending = []; if ($('#modal').open) closeModal(); };
  window.__trip = (i = 0, extra = {}) => ({ country: s.country, city: cities[s.country].filter(c => c !== residenceCity())[i], days: 7, comfort: 'simple', companion: null, party53: [], pay53: 'all', ...extra });
  window.__row = name => diseases23.find(r => r[0] === name);
  // Болезнь, начавшаяся ago месяцев назад; left — сколько месяцев ещё осталось.
  window.__ill = (name, left = null, ago = 0) => { const r = __row(name); s.illness = { name: r[0], severity: r[3], left: left ?? r[4], recovery23: r[5], treated: false }; s.lastIllnessTick = s.clock.ticks - ago; return s.illness; };
  window.__kid = (age, gender = 'f') => { const k = person('Ребенок', age, gender, s.country); k.bond = 75; k.birth49 = { method: 'birth', parents: ['player'] }; k.parentId = null; k.city18 = residenceCity(); s.people.push(k); enrichPerson(k); familyState27(); k.bio27.parents = ['player']; childState55(k).lastIllness = -100; return k; };
  window.__kidIll = (k, severity = 'mild') => { const q = beginChildIllness55(k, severity); if ($('#modal').open) closeModal(); return q; };
  window.__book = (extra = {}) => { travelDraftMenu52(__trip(0, extra)); const ok = bookTravel52(journeyDraft57(__trip(0, extra))); closeModal(); return ok ? travel52().trips.at(-1) : null; };
  window.__logs = (re, n = 30) => s.log.slice(0, n).filter(e => re.test(e.title || '')).map(e => ({ title: e.title, text: e.text }));
  // Отложенная поездка глазами игрока: пункт «Ожидают ответа», «не хватает» в карточке и «Подробнее · Причина».
  window.__view = async t => {
    const dec = decisionItems24().find(i => i.ref.kind === 'journey57' && i.ref.id === t.id) || null;
    const v = { now: s.clock.ticks, status: t.status, hold: !!t.hold57, left: s.illness?.left ?? 0, dec: dec ? { title: dec.title, note: dec.note } : null };
    if (['planned', 'requested', 'approved'].includes(t.status)) {
      travelTripMenu52(t.id); await __tick();
      const c = __card();
      v.need = c.need.map(n => n.text); v.cardStatus = c.status;
      v.reason = (/Причина(.+?)Оплата/.exec(document.querySelector('#modal .all273')?.textContent || '') || [])[1] || null;
      closeModal();
    }
    return v;
  };
  window.__feed = re => s.log.find(e => re.test(e.title || '')) || (Array.isArray(s.routine267) ? null : null);
}

async function draftCard(pg, setup) {
  return pg.evaluate(async setup => {
    __clear();
    const d = new Function('return (' + setup + ')()')();
    travelDraftMenu52(d || __trip());
    await __tick();
    const c = __card();
    closeModal();
    return c;
  }, setup.toString());
}

// ---------- 1. Таблица: каждая болезнь в месяц, когда началась ----------

async function partTable(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const want = {
    'Ветряная оспа': { block: /^Ветряная оспа заразна: в дорогу — через 2 мес\.$/ },
    'Пневмония': { block: /^С пневмонией в дорогу рано: ещё 4 мес\.$/ },
    'Перелом': { block: /^Перелом ещё свежий: в дорогу — через 3 мес\.$/ },
    'Кишечная инфекция': { block: /^Кишечная инфекция: этот месяц лучше переждать дома$/ },
    'Отит': { block: /^Отит: этот месяц лучше переждать дома$/ },
    'Респираторная инфекция': { note: 'Простуда ещё не прошла: в дороге будет тяжелее' },
    'Растяжение связок': { note: 'Растяжение ещё не прошло: гулять много не получится' },
    'Нарушение сна': { note: 'Нарушение сна поедет с вами: отдохнёте меньше обычного' },
    'Боль в спине': { note: 'Спина будет напоминать о себе в дороге: отдохнёте меньше обычного' },
    'Мигрень': { note: 'Мигрень может забрать пару дней поездки' },
    'Обострение артроза': { note: 'Артроз: меньше ходьбы, больше скамеек' },
    'Сезонный аллергический ринит': { note: 'Возьмите платки: аллергия едет с вами' },
  };
  const names = await pg.evaluate(() => diseases23.map(r => r[0]));
  check('в таблице болезней все 12 состояний из разведки', names.length === 12 && names.every(n => want[n]), names);
  for (const name of names) {
    const w = want[name];
    const c = await draftCard(pg, `()=>{__ill(${JSON.stringify(name)});return __trip();}`);
    const plan = c.main.find(b => b.label === 'Запланировать поездку');
    if (w.block) {
      const item = c.need.find(n => w.block.test(n.text));
      check(name + ': нельзя — «' + (item?.text || w.block.source) + '», кнопка «Самочувствие»', !!item && item.fix === 'Самочувствие', c.need);
      check(name + ': «Запланировать поездку» серая', !!plan && plan.disabled, c.main);
    } else {
      check(name + ': можно ехать, пометка к «Получите»: «' + w.note + '»', c.need.length === 0 && /можно ехать/i.test(c.status) && !!c.got && c.got.note === w.note, { need: c.need, status: c.status, got: c.got });
      check(name + ': «Запланировать поездку» доступна', !!plan && !plan.disabled, c.main);
    }
  }
  // Окно без карточки 273 (старый блок готовности trips272): пометка под «Можно ехать», причина и «Самочувствие» в блоке.
  const plain = await pg.evaluate(async () => {
    const real = tripCard273; tripCard273 = () => null;
    try {
      __clear(); __ill('Нарушение сна');
      travelDraftMenu52(__trip()); await __tick();
      const ok = __card(); closeModal();
      __clear(); __ill('Пневмония');
      travelDraftMenu52(__trip()); await __tick();
      const no = __card(); const fix = [...document.querySelectorAll('#modal .ready2722-act')].map(b => b.textContent); closeModal();
      return { ok, no, fix };
    } finally { tripCard273 = real; __clear(); }
  });
  check('без карточки: «Можно ехать», под ней пометка о нарушении сна', !plain.ok.card && plain.ok.old?.ok && plain.ok.old.note === 'Нарушение сна поедет с вами: отдохнёте меньше обычного', plain.ok.old);
  check('без карточки: «Чтобы поехать, не хватает» — пневмония и кнопка «Самочувствие»', !plain.no.card && plain.no.old && !plain.no.old.ok && plain.no.old.items.some(t => /^С пневмонией в дорогу рано/.test(t)) && plain.fix.includes('Самочувствие'), { old: plain.no.old, fix: plain.fix });
  // Старой формулировки «на всё» больше нет.
  const old = await draftCard(pg, `()=>{__ill('Нарушение сна');return __trip();}`);
  check('нет прежней причины «Перед поездкой нужно восстановиться…»', !JSON.stringify(old).includes('Перед поездкой нужно восстановиться'), old.need);
}

// ---------- 2. Месяц отъезда, а не сегодня ----------

async function partDates(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const r = await pg.evaluate(async () => {
    const out = {};
    const card = async d => { travelDraftMenu52(d); await __tick(); const c = __card(); closeModal(); return c; };
    __clear(); __ill('Пневмония', 2);
    out.pnNext = await card(__trip());
    out.pnLate = await card(__trip(0, { departure86: s.clock.ticks + 2 }));
    __clear(); __ill('Пневмония', 3);
    out.pnEdge = await card(__trip(0, { departure86: s.clock.ticks + 2 }));
    __clear(); __ill('Кишечная инфекция', 1, 1); // началась в прошлом месяце
    out.gut2 = await card(__trip());
    __clear(); __ill('Перелом', 3, 2); // третий месяц перелома
    out.fracture3 = await card(__trip());
    __clear(); __ill('Перелом', 4, 1); // второй месяц
    out.fracture2 = await card(__trip());
    __clear(); __ill('Нарушение сна', 2);
    out.sleepEnds = await card(__trip(0, { departure86: s.clock.ticks + 2 })); // к отъезду уже прошло
    __clear();
    return out;
  });
  const pn = c => c.need.find(n => /пневмони/i.test(n.text));
  check('пневмония, «Восстановление: ещё 2 мес.»: отъезд в следующем месяце — нельзя, «ещё 2 мес.»', !!pn(r.pnNext) && /ещё 2 мес\./.test(pn(r.pnNext).text), r.pnNext.need);
  check('пневмония: поездку можно запланировать на месяц, когда болезнь кончится (через 2 мес.), без пометки', !pn(r.pnLate) && r.pnLate.need.length === 0 && !r.pnLate.got?.note && !r.pnLate.main.find(b => b.label === 'Запланировать поездку')?.disabled, { need: r.pnLate.need, got: r.pnLate.got });
  check('пневмония, осталось 3 мес.: через 2 мес. — ещё рано, «ещё 3 мес.»', !!pn(r.pnEdge) && /ещё 3 мес\./.test(pn(r.pnEdge).text), r.pnEdge.need);
  check('кишечная инфекция со второго месяца — свободно, без пометки', r.gut2.need.length === 0 && !r.gut2.got?.note, r.gut2);
  check('перелом на третьем месяце — можно, пометка «Перелом ещё заживает…»', r.fracture3.need.length === 0 && r.fracture3.got?.note === 'Перелом ещё заживает: гулять много не получится', r.fracture3);
  check('перелом на втором месяце — ещё нельзя, «через 2 мес.»', r.fracture2.need.some(n => n.text === 'Перелом ещё свежий: в дорогу — через 2 мес.'), r.fracture2.need);
  check('нарушение сна кончится до отъезда — пометки нет', r.sleepEnds.need.length === 0 && !r.sleepEnds.got?.note, r.sleepEnds.got);
}

// ---------- 3. Травма и хроника ----------

async function partInjury(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const r = await pg.evaluate(async () => {
    const out = {};
    __clear();
    s.incidents56.lastEvent = -100;
    const q = createIncident56('ankle');
    if ($('#modal').open) closeModal();
    out.created = !!q;
    travelDraftMenu52(__trip()); await __tick();
    out.waiting = __card();
    out.fixed = __needFix('Нога: сначала покажитесь врачу');
    await __tick();
    out.fixTitle = __title();
    out.fixOpts = __opts().map(o => o.label);
    closeModal();
    if (q) resolveIncident56(q.id, 'clinic');
    travelDraftMenu52(__trip()); await __tick();
    out.after = __card();
    closeModal();
    __clear();
    // Хроническое обострение — только пометка.
    const c = condition25('migraine') || diagnose25('migraine');
    if (c) c.flareLeft = 2;
    travelDraftMenu52(__trip()); await __tick();
    out.chronic = __card();
    closeModal();
    if (c) c.flareLeft = 0;
    return out;
  });
  check('травма: происшествие «Подвернули ногу» создано', r.created);
  check('травма без первой помощи: «Нога: сначала покажитесь врачу» с кнопкой «Самочувствие»', r.waiting.need.some(n => n.text === 'Нога: сначала покажитесь врачу' && n.fix === 'Самочувствие'), r.waiting.need);
  check('«Самочувствие» открывает само происшествие с выбором помощи', r.fixed && r.fixOpts.some(l => /осмотр|помощ/i.test(l)), { title: r.fixTitle, opts: r.fixOpts });
  check('после первой помощи — можно ехать, пометка «Нога ещё не зажила…»', r.after.need.length === 0 && r.after.got?.note === 'Нога ещё не зажила: гулять много не получится', r.after);
  check('обострение хронической мигрени — можно ехать, только пометка', r.chronic.need.length === 0 && r.chronic.got?.note === 'Обострение мигрени: таблетки — в ручную кладь', r.chronic);
}

// ---------- 4. Отложенная поездка: ждёт выздоровления, перенос даты ----------

async function partHold(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const r = await pg.evaluate(async () => {
    const out = {};
    __clear();
    const t = __book();
    out.booked = !!t;
    if (!t) return out;
    __ill('Пневмония', 4);
    __month(1);
    out.held = { status: t.status, hold: t.hold57 ? { reason: t.hold57.reason, health: !!t.hold57.health2753 } : null, departure: t.departure, now: s.clock.ticks, left: s.illness?.left };
    out.log = __logs(/Поездка ждёт|Поездка ожидает/)[0] || null;
    out.decision = decisionItems24().find(i => i.ref.kind === 'journey57' && i.ref.id === t.id) || null;
    travelTripMenu52(t.id); await __tick();
    out.card = __card();
    out.move = __opt('Перенести дату поездки');
    out.clicked = __clickOpt('Перенести дату поездки');
    await __tick();
    out.menuTitle = __title();
    out.menu = __opts().map(o => o.label + (o.hint ? ' (' + o.hint + ')' : ''));
    // Первый месяц, когда можно: тот, в котором пневмония кончается («Восстановление: ещё left мес.»).
    out.expect = dateLabel86(s.clock.ticks + s.illness.left);
    out.firstLabel = __opts()[0]?.label;
    __clickOpt(out.expect);
    await __tick();
    out.afterMove = { status: t.status, hold: t.hold57, departure: t.departure, expected: s.clock.ticks + s.illness.left, title: __title() };
    out.moveLog = __logs(/Дата поездки изменена/)[0] || null;
    closeModal();
    const departAt = t.departure;
    const seen = [];
    for (let i = 0; i < 8 && t.status !== 'completed'; i++) { __month(1); seen.push({ now: s.clock.ticks, status: t.status, ill: s.illness?.name || null, hold: !!t.hold57 }); }
    out.seen = seen;
    out.departed = t.departed;
    out.departAt = departAt;
    out.ill2753 = 'ill2753' in t ? t.ill2753 : 'нет поля';
    return out;
  });
  check('поездка запланирована', r.booked);
  if (!r.booked) return;
  check('пневмония до отъезда: поездку держат, отсрочка помечена как из-за болезни', r.held.hold && r.held.hold.health && r.held.status !== 'away', r.held);
  check('в ленте — «Поездка ждёт выздоровления», с новой датой и отменой без расходов', r.log && r.log.title === 'Поездка ждёт выздоровления' && /^С пневмонией в дорогу рано: ещё \d+ мес\. Деньги и отпуск не списаны\. Можно выбрать новую дату или отменить без расходов\.$/.test(r.log.text), r.log);
  check('«Ожидают ответа»: «Поездка ждёт выздоровления · город» и причина', r.decision && /^Поездка ждёт выздоровления · /.test(r.decision.title) && /пневмони/i.test(r.decision.note), r.decision);
  check('карточка поездки: состояние «Поездка ждёт выздоровления», в «не хватает» — пневмония и «Самочувствие»', /Поездка ждёт выздоровления/.test(r.card.status) && r.card.need.some(n => /^С пневмонией в дорогу рано/.test(n.text) && n.fix === 'Самочувствие'), { status: r.card.status, need: r.card.need });
  check('«Перенести дату поездки» доступна (не серая)', r.move && !r.move.disabled, r.move);
  check('перенос открывает «Новая дата поездки» с месяцами после выздоровления', r.clicked && r.menuTitle === 'Новая дата поездки' && r.firstLabel === r.expect, { title: r.menuTitle, first: r.firstLabel, expect: r.expect, menu: r.menu });
  check('после выбора месяца отсрочки нет, дата — выбранный месяц', !r.afterMove.hold && r.afterMove.departure === r.afterMove.expected && r.afterMove.status === 'planned', r.afterMove);
  check('в ленте — «Дата поездки изменена»', !!r.moveLog && /отъезд в /.test(r.moveLog.text), r.moveLog);
  check('поездка уехала ровно в выбранный месяц и уже здоровым', r.departed === r.departAt && r.seen.every(x => x.status !== 'away' || !x.ill) && r.ill2753 === null, { departed: r.departed, departAt: r.departAt, seen: r.seen, ill: r.ill2753 });
}

// Болезнь держит только месяц отъезда — поездка сдвигается на месяц одной записью, без отсрочки и решения.
// Держит дольше — отсрочка, а снимается она в начале месяца перед отъездом («Поездка снова по плану»), не в сам месяц.
async function partRelease(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const r = await pg.evaluate(() => {
    const run = left => {
      __clear();
      const t = __book();
      if (!t) return { booked: false };
      __ill('Ветряная оспа', left);
      const seen = [];
      for (let i = 0; i < 6 && !['away', 'completed'].includes(t.status); i++) {
        __month(1);
        seen.push({ now: s.clock.ticks, status: t.status, hold: !!t.hold57, dep: t.departure, ill: s.illness?.left ?? 0, dec: decisionItems24().some(i => i.ref.kind === 'journey57' && i.ref.id === t.id) });
      }
      return { booked: true, city: t.city, seen, departed: t.departed, shift: __logs(/сдвинулась на месяц/), held: __logs(/Поездка ждёт выздоровления/), released: __logs(/Поездка снова по плану/) };
    };
    return { one: run(2), two: run(3) };
  });
  const one = r.one, two = r.two;
  check('ветрянка держит только месяц отъезда: «Поездка сдвинулась на месяц», без отсрочки и без пункта в «Ожидают ответа»', one.booked && one.shift.length === 1 && /^Ветряная оспа заразна: в дорогу — через 1 мес\. К следующему месяцу это уже не помешает — отъезд в .+ \d{4}\. Деньги и отпуск пока не списаны\.$/.test(one.shift[0].text) && one.held.length === 0 && one.seen.every(x => !x.hold && !x.dec), one);
  check('…и поездка уезжает в следующем месяце, когда ветрянка уже кончается', one.booked && one.seen.length === 2 && one.departed === one.seen[1].now && ['away', 'completed'].includes(one.seen[1].status), one.seen);
  check('ветрянка на 3 мес.: поездка ждёт выздоровления', two.booked && two.held.length === 1 && two.seen[0]?.hold && two.seen[0]?.dec, two);
  check('отсрочка снимается в начале месяца перед отъездом: «Поездка снова по плану — к следующему месяцу причина задержки отпадёт…»', two.booked && two.released.length === 1 && new RegExp('^' + two.city + ': к следующему месяцу причина задержки отпадёт, отъезд в .+ \\d{4}\\.$').test(two.released[0].text) && two.seen.length === 3 && !two.seen[1].hold && !two.seen[1].dec && two.seen[1].status === 'planned' && two.seen[1].dep === two.seen[2].now, { released: two.released, seen: two.seen });
  check('после отсрочки поездка уехала здоровой, ровно в месяц выздоровления', two.booked && two.departed === two.seen[2]?.now && two.seen.every(x => !(x.status === 'away' || x.status === 'completed') || x.ill === 0), two.seen);
}

// «Ожидают ответа», карточка поездки и «Подробнее» говорят одно и то же: каждый месяц отсрочки, после лечения и когда
// болезнь ребёнка к отъезду проходит.
async function partHoldSync(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const r = await pg.evaluate(async () => {
    const view = __view;
    const out = {};
    // Пневмония на 4 мес.: каждый месяц.
    __clear();
    let t = __book();
    if (!t) return { booked: false };
    __ill('Пневмония', 4);
    out.months = [];
    for (let i = 0; i < 6 && !['away', 'completed'].includes(t.status); i++) { __month(1); out.months.push(await view(t)); }
    out.city = t.city;
    out.released = __logs(/Поездка снова по плану/);
    // Лечение посреди отсрочки: срок короче — и в «Ожидают ответа», и в «Подробнее».
    __clear();
    t = __book();
    __ill('Пневмония', 4);
    __month(1);
    out.before = await view(t);
    s.illness.treated = true; s.illness.left = 2; // как после «Обратиться к врачу»
    out.treated = await view(t);
    __month(1);
    out.treatedNext = await view(t);
    // Подросток 15, «заметно хуже», вы наблюдаете: к следующему месяцу болезнь проходит.
    __clear();
    const k = __kid(15, 'f');
    t = __book();
    respondChildHealth55(__kidIll(k, 'moderate').id, 'monitor');
    __month(1);
    out.teen = await view(t);
    out.teenShift = __logs(/сдвинулась на месяц|ждёт выздоровления|ожидает решения/);
    s.people = s.people.filter(p => p.id !== k.id);
    __clear();
    return out;
  });
  if (r.booked === false) return check('отсрочка и «Ожидают ответа»: поездка запланирована', false);
  const same = v => v.dec ? v.need.includes(v.dec.note) && v.reason === v.dec.note : v.need.length === 0;
  const held = r.months.filter(v => v.need);
  check('каждый месяц отсрочки: «Ожидают ответа» и карточка говорят одно (пункт есть — та же причина в «не хватает» и в «Подробнее»; нет — в карточке ничего не мешает)', held.length >= 2 && held.every(same), held);
  check('в последний месяц перед отъездом пункта уже нет: болезнь к отъезду кончается, отъезд — в начале следующего месяца', held.length >= 2 && !held.at(-1).dec && !held.at(-1).hold && held.at(-1).need.length === 0 && r.released.length === 1 && r.months.at(-1).status !== 'planned', { last: held.at(-1), released: r.released, end: r.months.at(-1) });
  check('пока отсрочка, причина считает месяцы вниз: «ещё 3 мес.», «ещё 2 мес.»', held[0]?.dec?.note === 'С пневмонией в дорогу рано: ещё 3 мес.' && held[1]?.dec?.note === 'С пневмонией в дорогу рано: ещё 2 мес.', held.map(v => v.dec?.note));
  check('после лечения: в «Ожидают ответа» и в «Подробнее» — новый срок «ещё 2 мес.», как в карточке', r.before.dec?.note === 'С пневмонией в дорогу рано: ещё 3 мес.' && r.treated.dec?.note === 'С пневмонией в дорогу рано: ещё 2 мес.' && same(r.treated), { before: r.before, treated: r.treated });
  check('после лечения отсрочка снимается в начале месяца перед отъездом', !r.treatedNext.hold && !r.treatedNext.dec && r.treatedNext.need.length === 0, r.treatedNext);
  check('подросток 15 болеет «заметно хуже» только до отъезда: в «Ожидают ответа» нет пункта, которому в карточке нечего исправить', same(r.teen) && !!r.teen.need && (r.teen.dec !== null) === (r.teen.need.length > 0), { teen: r.teen, logs: r.teenShift });
}

// «Выбрать месяц и год» (travel86) у поездки, которую держит болезнь: рано — отказ, после выздоровления — перенос.
async function partCalendar(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const r = await pg.evaluate(async () => {
    __clear();
    const t = __book();
    if (!t) return { booked: false };
    __ill('Пневмония', 5);
    __month(1);
    const out = { booked: true, held: !!t.hold57?.health2753, left: s.illness?.left };
    tripCalendar86(tripDraft57(t));
    const set = tick => { const d = travelDate86(tick); $('#tripYear86').value = d.year; $('#tripMonth86').value = d.month; __clickOpt('Выбрать дату'); };
    set(s.clock.ticks + 2);
    await __tick();
    out.early = { hold: !!t.hold57, departure: t.departure, title: __title(), preset: dateLabel86(s.clock.ticks + 12 * ($('#tripYear86')?.value - s.year) + ($('#tripMonth86')?.value - s.clock.month)), first: dateLabel86(s.clock.ticks + s.illness.left) };
    set(s.clock.ticks + s.illness.left);
    await __tick();
    out.late = { hold: !!t.hold57, departure: t.departure, want: s.clock.ticks + s.illness.left, title: __title() };
    closeModal();
    return out;
  });
  check('«Выбрать месяц и год»: пневмония — поездка ждёт', r.booked && r.held, r);
  check('«Выбрать месяц и год» на месяц, когда ещё нельзя, — отсрочка остаётся, календарь снова открыт на первом месяце, когда можно', r.early && r.early.hold && r.early.title === 'Месяц и год отдыха' && r.early.preset === r.early.first, r.early);
  check('«Выбрать месяц и год» на месяц, когда уже можно, — отсрочка снята, дата новая', r.late && !r.late.hold && r.late.departure === r.late.want && /^Поездка · /.test(r.late.title), r.late);
}

// ---------- 5. Поездка с болезнью: отдых меньше и запись говорит почему ----------

async function partCost(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const r = await pg.evaluate(async () => {
    const out = {};
    const run = (name, comfort = 'simple', days = 7) => {
      __clear();
      const t = __book({ comfort, days });
      if (!t) return { booked: false };
      if (name) __ill(name, 5);
      s.clock.fatigue = 60; s.mood = 50;
      let f0 = null, m0 = null;
      const realEnd = travelEndMonth52;
      travelEndMonth52 = function (...a) { const x = travel52().trips.find(x => x.status === 'away' && x.departed === s.clock.ticks); if (x) { f0 = s.clock.fatigue; m0 = s.mood; } const res = realEnd.apply(this, a); if (x) { x.__df = f0 - s.clock.fatigue; x.__dm = s.mood - m0; } return res; };
      try { __month(1); } finally { travelEndMonth52 = realEnd; }
      const entry = s.log.find(e => e.title === 'Поездка осталась в памяти') || null;
      return { booked: true, status: t.status, recovery: t.recovery, df: t.__df, dm: t.__dm, ill: t.ill2753 ?? null, held: !!t.hold57, text: entry?.text || '' };
    };
    out.sleep = run('Нарушение сна');
    { const t = travel52().trips.filter(t => t.status === 'completed').at(-1); travelTripMenu52(t.id); await __tick(); out.doneCard = { got: [...document.querySelectorAll('#modal .row273')].map(e => e.textContent), all: document.querySelector('#modal .all273')?.textContent || '' }; closeModal(); }
    out.healthy = run(null);
    out.rhinitis = run('Сезонный аллергический ринит');
    out.cold1 = run('Респираторная инфекция', 'simple', 1);
    { const t = travel52().trips.filter(t => t.status === 'completed').at(-1); travelTripMenu52(t.id); await __tick(); out.cold1Card = { note: __card().got?.note || '', all: document.querySelector('#modal .all273')?.textContent || '' }; closeModal(); }
    out.back14 = run('Боль в спине', 'comfortable', 14);
    __clear();
    return out;
  });
  check('нарушение сна в поездке: поездка не задержана и прошла', r.sleep.booked && !r.sleep.held && r.sleep.status === 'completed', r.sleep);
  check('на поездке записано, чем болели при отъезде', r.sleep.ill && r.sleep.ill.name === 'Нарушение сна' && r.sleep.ill.cost === 'half', r.sleep.ill);
  check('здоровым: 7 дн. «Экономно» — усталость −4, настроение +4 (как раньше)', r.healthy.recovery === 4 && r.healthy.dm === 4, r.healthy);
  check('с нарушением сна: усталость −2 вместо −4, настроение +2 вместо +4', r.sleep.recovery === 2 && r.sleep.dm === 2, r.sleep);
  check('запись: «Спалось и там неважно… Усталость снизилась на 2 — без нарушения сна было бы 4.»', /Спалось и там неважно, но смена обстановки помогла\. Усталость снизилась на 2 — без нарушения сна было бы 4\./.test(r.sleep.text), r.sleep.text);
  check('карточка прошедшей поездки: «Усталость −2 — без нарушения сна было бы −4»', r.sleep && r.doneCard.got.some(t => t.includes('Усталость −2 — без нарушения сна было бы −4')) && r.doneCard.all.includes('Без нарушения сна усталость была бы −4'), r.doneCard);
  check('сезонный ринит — почти без цены: усталость −3 вместо −4, настроение как здоровым', r.rhinitis.recovery === 3 && r.rhinitis.dm === 4 && /Аллергия ездила с вами, но почти не мешала/.test(r.rhinitis.text), r.rhinitis);
  check('день в дороге с простудой: настроение +1 вместо +2 (не меньше +1), отдых −1 (половина округляется)', r.cold1.dm === 1 && r.cold1.recovery === 1, r.cold1);
  check('запись дня с простудой говорит, что забрала болезнь: «… Усталость снизилась на 1, настроение +1 — без простуды было бы +2.»', /Простуда поехала с вами: больше лежали, чем гуляли\. Усталость снизилась на 1, настроение \+1 — без простуды было бы \+2\./.test(r.cold1.text), r.cold1.text);
  check('карточка того дня: под «Получите» — «Настроение +1 — без простуды было бы +2», в «Подробнее» — «Без простуды настроение было бы +2», а не «усталость была бы −1»', r.cold1Card.note === 'Настроение +1 — без простуды было бы +2' && r.cold1Card.all.includes('СамочувствиеБез простуды настроение было бы +2') && !r.cold1Card.all.includes('усталость была бы −1'), r.cold1Card);
  check('«Подробнее» с нарушением сна называет и усталость, и настроение', r.doneCard.all.includes('Без нарушения сна усталость была бы −4, настроение +4'), r.doneCard.all);
  check('14 дн. «С комфортом» со спиной: усталость −7 вместо −14, настроение +3 вместо +6', r.back14.recovery === 7 && r.back14.dm === 3 && /без боли в спине было бы 14\./.test(r.back14.text), r.back14);
}

// ---------- 6. Дети ----------

async function partKids(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(38));
  const r = await pg.evaluate(async () => {
    const out = {};
    const card = async d => { travelDraftMenu52(d); await __tick(); const c = __card(); closeModal(); return c; };
    __clear();
    const k = __kid(8, 'f');
    out.kid = k.name;
    const q = __kidIll(k, 'mild');
    out.partyWaiting = await card(__trip(0, { party53: [k.id] }));
    travelDraftMenu52(__trip(0, { party53: [k.id] })); await __tick();
    out.fixLabel = __card().need.find(n => n.text === k.name + ' болеет: сначала восстановление')?.fix || null;
    __needFix(k.name + ' болеет: сначала восстановление'); await __tick();
    out.fixTitle = __title();
    closeModal();
    respondChildHealth55(q.id, 'clinic');
    out.partyMild = await card(__trip(0, { party53: [k.id] }));
    out.homeMild = await card(__trip());
    // «Заметно хуже» — нельзя, даже после осмотра.
    const k2 = __kid(9, 'm');
    const q2 = __kidIll(k2, 'moderate');
    respondChildHealth55(q2.id, 'clinic');
    out.partyModerate = await card(__trip(0, { party53: [k2.id] }));
    s.people = s.people.filter(p => p.id !== k.id && p.id !== k2.id);
    // Подросток 16, лёгкая болезнь, вы наблюдаете сами: ваша поездка не закрыта.
    const t = __kid(16, 'm');
    const q3 = __kidIll(t, 'mild');
    respondChildHealth55(q3.id, 'monitor');
    out.teen = await card(__trip());
    out.teenSelf = !!t.child55.illness.self;
    // Подросток с болезнью «заметно хуже» — как раньше.
    t.child55.illness.severity = 'moderate';
    out.teenModerate = await card(__trip());
    s.people = s.people.filter(p => p.id !== t.id);
    // Граница: с 14 лет — можно, в 13 — как раньше.
    const t14 = __kid(14, 'f');
    respondChildHealth55(__kidIll(t14, 'mild').id, 'monitor');
    out.teen14 = await card(__trip());
    s.people = s.people.filter(p => p.id !== t14.id);
    const t13 = __kid(13, 'm');
    respondChildHealth55(__kidIll(t13, 'mild').id, 'monitor');
    out.teen13 = await card(__trip());
    s.people = s.people.filter(p => p.id !== t13.id);
    // Ребёнок 10, лёгкая болезнь, вы ухаживаете — как раньше: нужен присмотр.
    const y = __kid(10, 'f');
    const q4 = __kidIll(y, 'mild');
    respondChildHealth55(q4.id, 'monitor');
    out.young = await card(__trip());
    s.people = s.people.filter(p => p.id !== y.id);
    return out;
  });
  const sick = c => c.need.some(n => n.text === r.kid + ' болеет: сначала восстановление');
  check('ребёнок в поездке, помощь ещё не организована: «Имя болеет: сначала восстановление»', sick(r.partyWaiting), r.partyWaiting.need);
  check('кнопка ведёт в окно помощи ребёнку', r.fixLabel === 'Здоровье · ' + r.kid && /заболел/.test(r.fixTitle), { fix: r.fixLabel, title: r.fixTitle });
  check('после осмотра, лёгкая болезнь: ребёнка можно взять, пометка «… ещё не поправилась: возьмите лекарства в дорогу»', !sick(r.partyMild) && r.partyMild.need.length === 0 && r.partyMild.got?.note === r.kid + ' ещё не поправилась: возьмите лекарства в дорогу', { need: r.partyMild.need, got: r.partyMild.got });
  check('ребёнок 8 лет болеет дома без взрослого — нужен присмотр (как раньше)', r.homeMild.need.some(n => n.text.startsWith(r.kid)), r.homeMild.need);
  check('«заметно хуже» — нельзя и после осмотра', r.partyModerate.need.some(n => / болеет: сначала восстановление$/.test(n.text)), r.partyModerate.need);
  check('подросток 16, лёгкая болезнь, вы наблюдаете: ваша поездка не закрыта', r.teenSelf && r.teen.need.length === 0, r.teen.need);
  check('подросток 16, «заметно хуже»: «Сейчас вы ухаживаете за заболевшим ребёнком»', r.teenModerate.need.some(n => n.text === 'Сейчас вы ухаживаете за заболевшим ребёнком'), r.teenModerate.need);
  check('подросток ровно 14, лёгкая болезнь, вы наблюдаете: поездка не закрыта', r.teen14.need.length === 0, r.teen14.need);
  check('ребёнок 13, лёгкая болезнь, вы наблюдаете: поездка закрыта, как раньше', r.teen13.need.some(n => /ухаживаете за заболевшим ребёнком|присмотр/.test(n.text)), r.teen13.need);
  check('ребёнок 10, вы ухаживаете: поездка закрыта, как раньше', r.young.need.some(n => /ухаживаете за заболевшим ребёнком|присмотр/.test(n.text)), r.young.need);
}

// ---------- 7. Языковая программа и командировка ----------

async function partStayBusiness(P) {
  const { pg } = P;
  await pg.evaluate(() => __base(40));
  const r = await pg.evaluate(async () => {
    const out = {};
    __clear();
    // Отъезд на программу — через 1 мес. (есть право на учёбу) или после визы, через 3: проверяем путь с визой, он длиннее.
    const perm = permission16; permission16 = (c, kind, ...a) => c === 'de' && kind === 'study' ? false : perm(c, kind, ...a);
    const lead = permission16('de', 'study') ? 1 : 3;
    __ill('Пневмония', lead + 3);
    out.pnWhy = languageStayWhy53('de', 1);
    __clear();
    __ill('Нарушение сна', 4);
    out.sleepWhy = languageStayWhy53('de', 1);
    // Заявка принята, потом пневмония: программа ждёт.
    __clear();
    s.clock.tasks = []; s.studyTrack = null; if (path16().study) path16().study = null; languageStays53().retry = 0;
    out.applyWhy = languageStayWhy53('de', 1);
    out.applied = applyLanguageStay53('de', 1);
    const st = languageStayActive53();
    if (st) st.roll = .5; // без случайного отказа в визе
    __ill('Пневмония', lead + 2);
    const seen = [];
    for (let i = 0; i < 7 && st && st.status !== 'away' && st.status !== 'returned'; i++) {
      __month(1); seen.push({ now: s.clock.ticks, status: st.status, ill: s.illness?.left ?? 0 });
      if (!out.menuHint && st.status === 'ready' && st.hold2753 && s.illness?.left > 1) { languageStayMenu53(); await __tick(); out.menuHint = __opts()[0] || null; closeModal(); }
    }
    out.stay = { seen, status: st?.status, departed: st?.departed, log: __logs(/Языковая программа ждёт/, 80)[0] || null };
    permission16 = perm;
    __clear();
    // Командировка: пневмония — ждёт выздоровления; сезонный ринит — едет. Нужна работа с выездами.
    const prof = professions16.find(p => p.field === 'computing');
    s.job = { title: prof.title, employer: 'Контур', professionId: prof.id, salary: c().wage, tenure: 1, format: 'office', language: country16[s.country][0], allowedCountries: [s.country], workplace: { country: s.country, city: residenceCity(), area: 'center' } };
    s.workHours = 40;
    const co = company18(); co.budget = 1e6;
    const offer = { id: 'bo-1', employer: co.id, home: s.country, homeCity: residenceCity(), country: s.country, city: cities[s.country].filter(c => c !== residenceCity())[0], days: 3, comfort: 'standard', companion: null, fee: 500, purpose: 'Встреча с клиентами', status: 'offered', created: s.clock.ticks, expires: s.clock.ticks + 3, visaRoll: .5 };
    events54().business.push(offer);
    __ill('Пневмония', 4); businessOfferMenu54('bo-1'); await __tick(); out.offerPn = __opt('Согласиться'); closeModal();
    __ill('Нарушение сна', 4); businessOfferMenu54('bo-1'); await __tick(); out.offerSleep = __opt('Согласиться'); closeModal();
    events54().business = events54().business.filter(q => q.id !== 'bo-1');
    __clear();
    const bt = (ill, id) => { const t = { id, country: s.country, city: cities[s.country].filter(c => c !== residenceCity())[0], days: 3, comfort: 'standard', companion: null, home: s.country, homeCity: residenceCity(), fee: 0, total53: 500, created: s.clock.ticks, departure: s.clock.ticks + 1, review: s.clock.ticks + 1, status: 'planned', employer: co.id, hours: 40, leaveNeed: 0, business54: id, documents54: 'ready' }; travel52().trips.push(t); if (ill) __ill(ill, 4); __month(1); const res = { status: t.status, hold: t.hold57 ? { reason: t.hold57.reason, health: !!t.hold57.health2753 } : null, log: __logs(/ждёт выздоровления|ожидает решения/)[0] || null }; travel52().trips = travel52().trips.filter(x => x.id !== t.id); __clear(); return res; };
    out.btPn = bt('Пневмония', 'bt-pn');
    out.btRh = bt('Сезонный аллергический ринит', 'bt-rh');
    // Командировка в карточке: с нарушением сна — пометка без обещаний про отдых; отложенная — перенос без слов про деньги и отпуск.
    { const t = { id: 'bt-card', country: s.country, city: cities[s.country].filter(c => c !== residenceCity())[0], days: 3, comfort: 'standard', companion: null, home: s.country, homeCity: residenceCity(), fee: 0, total53: 500, created: s.clock.ticks, departure: s.clock.ticks + 1, review: s.clock.ticks + 1, status: 'planned', employer: co.id, hours: 40, leaveNeed: 0, business54: 'bt-card', documents54: 'ready' };
      travel52().trips.push(t);
      __ill('Нарушение сна', 4); travelTripMenu52(t.id); await __tick(); out.btCard = __card().got?.note || ''; closeModal();
      __ill('Пневмония', 4); __month(1);
      travelTripMenu52(t.id); await __tick(); __clickOpt('Перенести дату поездки'); await __tick();
      out.btMenu = { title: __title(), text: document.querySelector('#modal')?.textContent || '', first: __opts()[0]?.label || '' };
      __clickOpt(out.btMenu.first); await __tick();
      out.btMove = __logs(/^Дата (поездки|командировки) изменена$/)[0] || null;
      closeModal();
      travel52().trips = travel52().trips.filter(x => x.id !== t.id); __clear(); }
    s.job = null;
    return out;
  });
  check('языковая программа с пневмонией: в причинах — «С пневмонией в дорогу рано…»', r.pnWhy.some(w => /^С пневмонией в дорогу рано: ещё \d+ мес\.$/.test(w)), r.pnWhy);
  check('языковая программа с нарушением сна: болезнь не мешает', !r.sleepWhy.some(w => /сна|болезн|восстанов/i.test(w)), r.sleepWhy);
  check('заявка на программу принята', r.applied === true, { applied: r.applied, why: r.applyWhy });
  check('пневмония до отъезда на программу: отъезд ждёт выздоровления, запись в ленте', r.stay.log && r.stay.log.title === 'Языковая программа ждёт выздоровления' && r.stay.seen.some(x => x.status === 'ready' && x.ill > 0), r.stay);
  check('в списке программ — «Ждёт выздоровления»', !!r.menuHint && /Германия · 1 мес\./.test(r.menuHint.label) && r.menuHint.hint === 'Ждёт выздоровления', r.menuHint);
  check('программа уезжает в месяц, когда болезнь кончается, не раньше',r.stay.status === 'away' && r.stay.seen.every(x => x.status !== 'away' || x.ill <= 1), r.stay);
  check('предложение командировки с пневмонией: «Согласиться» серая, под ней причина', r.offerPn && r.offerPn.disabled && /^С пневмонией в дорогу рано: ещё \d+ мес\.$/.test(r.offerPn.why), r.offerPn);
  check('предложение командировки с нарушением сна: «Согласиться» доступна, пометка в подсказке', r.offerSleep && !r.offerSleep.disabled && r.offerSleep.hint.includes('Нарушение сна поедет с вами'), r.offerSleep);
  check('…и пометка без обещаний про отдых: «Нарушение сна поедет с вами: в командировке будет тяжелее»', r.offerSleep && r.offerSleep.hint.includes('Нарушение сна поедет с вами: в командировке будет тяжелее') && !/отдохн/.test(r.offerSleep.hint), r.offerSleep);
  check('карточка командировки с нарушением сна: «в командировке будет тяжелее», не «отдохнёте меньше»', r.btCard === 'Нарушение сна поедет с вами: в командировке будет тяжелее', r.btCard);
  check('отложенная командировка: «Новая дата командировки» без «Деньги и отпуск спишут…»', r.btMenu.title === 'Новая дата командировки' && /^С пневмонией в дорогу рано/.test(r.btMenu.text.replace(/^.*?Новая дата командировки/, '')) && !/Деньги|отпуск/.test(r.btMenu.text), r.btMenu);
  check('перенос командировки: «Дата командировки изменена», без «Деньги пока не списаны»', r.btMove && r.btMove.title === 'Дата командировки изменена' && !/Деньги/.test(r.btMove.text), r.btMove);
  check('командировка с пневмонией: «Командировка ждёт выздоровления»', r.btPn.hold && r.btPn.hold.health && r.btPn.log?.title === 'Командировка ждёт выздоровления', r.btPn);
  check('командировка с сезонным ринитом — едет', !r.btRh.hold && ['away', 'completed'].includes(r.btRh.status), r.btRh);
}

// ---------- 7б. Ребёнок до 12 лет: семейная поездка с мамой или папой (notices270) ----------

async function partFamilyChild(P) {
  const { pg } = P;
  const r = await pg.evaluate(async () => {
    const out = {};
    s.age = 8; s.clock.running = false;
    __clear();
    const parents = parents17().filter(p => p.alive && ['Мать', 'Отец'].includes(p.role));
    for (const p of parents) { p.bond = 90; p.inner.trust = 90; p.inner.strain = 0; p.city18 = residenceCity(); p.country = s.country; p.privateCash = 1e7; p.finance17 = { ...(p.finance17 || {}), lastIncome: 1e6 }; }
    const offer = () => {
      const x = familyTravel53(); x.lastOffer = -100; x.hosts = {};
      for (const q of x.invitations) if (q.status === 'offered') q.status = 'declined';
      for (const p of parents) { const q = offerTravel53(p, 'gift'); if ($('#modal').open) closeModal(); if (q) return q; }
      return null;
    };
    out.parents = parents.length;
    __ill('Ветряная оспа');
    const q = offer();
    out.offered = !!q;
    if (!q) return out;
    out.family = typeof familyTripInvite270 === 'function' && familyTripInvite270(q);
    travelInviteMenu53(q.id); await __tick();
    out.title = __title();
    out.go = __opts().find(o => /^Поехать с /.test(o.label)) || null;
    out.stay = __opt('Остаться дома');
    closeModal();
    out.goResult = familyTripGo270(q.id);
    if ($('#modal').open) closeModal();
    out.status = q.status;
    out.went = __logs(/^Семейная поездка/).filter(e => /^Съездили/.test(e.text)).length;
    // Простуда: можно, но настроения вдвое меньше, запись говорит почему.
    __clear(); __ill('Респираторная инфекция');
    const q2 = offer();
    out.offered2 = !!q2;
    if (!q2) return out;
    travelInviteMenu53(q2.id); await __tick();
    out.go2 = __opts().find(o => /^Поехать с /.test(o.label)) || null;
    s.mood = 50;
    out.clicked2 = !!out.go2 && __clickOpt(out.go2.label); await __tick();
    if ($('#modal').open) closeModal();
    out.dm2 = s.mood - 50;
    out.status2 = q2.status;
    out.log2 = s.log.slice(0, 6).find(e => e.title === 'Семейная поездка · ' + q2.draft.city && /^Съездили/.test(e.text))?.text || '';
    __clear();
    return out;
  });
  if (!r.offered) return check('ребёнок 8 лет: приглашение в семейную поездку', false, r);
  check('ребёнок 8 лет, приглашение мамы или папы — окно «Семейная поездка»', r.family && /^Семейная поездка · /.test(r.title), r.title);
  check('ветрянка: «Поехать с …» серая, под ней «Ветряная оспа заразна: в дорогу — через … мес.»; «Остаться дома» доступна', r.go && r.go.disabled && /^Ветряная оспа заразна: в дорогу — через \d+ мес\.$/.test(r.go.why) && r.stay && !r.stay.disabled, { go: r.go, stay: r.stay });
  check('ветрянка: заразного ребёнка в поездку не везут (приглашение ждёт ответа, записи «Съездили…» нет)', r.goResult === false && r.status === 'offered' && r.went === 0, { go: r.goResult, status: r.status, went: r.went });
  check('простуда: «Поехать с …» доступна, в подсказке «Настроение +2» и пометка', r.offered2 && r.go2 && !r.go2.disabled && /Настроение \+2/.test(r.go2.hint) && r.go2.hint.includes('Простуда ещё не прошла: в дороге будет тяжелее'), r.go2);
  check('простуда: съездили, настроение +2 вместо +4, в записи — «Простуда поехала с вами…»', r.clicked2 && r.status2 === 'family270' && r.dm2 === 2 && /Простуда поехала с вами: больше лежали, чем гуляли\.$/.test(r.log2), { dm: r.dm2, status: r.status2, log: r.log2 });
}

// ---------- 8. Сохранение владелицы ----------

async function partOwner(browser, raw) {
  const P = await page(browser, { raw });
  const { pg } = P;
  const r = await pg.evaluate(async () => {
    const out = { age: s.age, country: s.country, trips: travel52().trips.length, illness: s.illness?.name || null };
    if (s.age < 18 || s.dead) { out.skip = true; return out; }
    const keep = { illness: s.illness, last: s.lastIllnessTick };
    s.cash = Math.max(s.cash, 5e6);
    // Своя запланированная поездка владелицы: та же болезнь в её карточке.
    const a = travelActive52();
    out.active = a ? a.city + ' · ' + a.status : null;
    if (a && pendingJourney57(a)) {
      const tripCard = async ill => { s.illness = null; if (ill) __ill(ill, 4); travelTripMenu52(a.id); await __tick(); const c = __card(); c.move = __opt('Перенести дату поездки'); closeModal(); return c; };
      out.activeSleep = await tripCard('Нарушение сна');
      out.activePn = await tripCard('Пневмония');
      cancelTravel52(a.id);
    }
    const card = async ill => { s.illness = null; if (ill) __ill(ill, 4); travelDraftMenu52(__trip()); await __tick(); const c = __card(); closeModal(); return c; };
    out.sleep = await card('Нарушение сна');
    out.pn = await card('Пневмония');
    // Новая поездка на сохранении, потом пневмония: «Перенести дату поездки» доступна и предлагает месяц после выздоровления.
    s.illness = null;
    const t2 = (() => { travelDraftMenu52(__trip()); const ok = bookTravel52(journeyDraft57(__trip())); closeModal(); return ok ? travel52().trips.at(-1) : null; })();
    if (t2) {
      __ill('Пневмония', 4);
      travelTripMenu52(t2.id); await __tick();
      out.move = { opt: __opt('Перенести дату поездки'), clicked: __clickOpt('Перенести дату поездки') };
      await __tick();
      Object.assign(out.move, { title: __title(), first: __opts()[0]?.label || '', expect: dateLabel86(Math.max(departureMin86(tripDraft57(t2)), s.clock.ticks + s.illness.left)) });
      closeModal(); cancelTravel52(t2.id); s.illness = null;
    } else out.move = null;
    // Отсрочка на сохранении: каждый месяц «Ожидают ответа» и карточка говорят одно.
    s.illness = null;
    const t3 = (() => { travelDraftMenu52(__trip()); const ok = bookTravel52(journeyDraft57(__trip())); closeModal(); return ok ? travel52().trips.at(-1) : null; })();
    out.sync = [];
    if (t3) {
      // С работой отъезд не в следующем месяце (отпуск согласуют): болезнь длиннее на эти месяцы — к отъезду поездка ждёт, как на новой жизни.
      __ill('Пневмония', Math.max(0, t3.departure - s.clock.ticks - 1) + 4);
      out.syncDep = t3.departure - s.clock.ticks;
      for (let i = 0; i < 8 && pendingJourney57(t3); i++) { __month(1); out.sync.push(await __view(t3)); }
      if (pendingJourney57(t3)) cancelTravel52(t3.id);
      s.illness = null;
    }
    // Открыть последние поездки владелицы — без ошибок.
    for (const t of travel52().trips.slice(-6)) { travelTripMenu52(t.id); await __tick(); closeModal(); }
    s.illness = keep.illness; s.lastIllnessTick = keep.last;
    // Несколько месяцев с поездкой и мигренью: поездку не держат, при отъезде мигрень записана.
    s.illness = null;
    const t = (() => { travelDraftMenu52(__trip()); const ok = bookTravel52(journeyDraft57(__trip())); closeModal(); return ok ? travel52().trips.at(-1) : null; })();
    out.booked = !!t;
    __ill('Мигрень', 5);
    const seen = [];
    for (let i = 0; i < 3 && t && !['away', 'completed', 'cancelled', 'declined'].includes(t.status); i++) { __month(1); seen.push({ status: t.status, hold: t.hold57?.reason || null, ill: s.illness?.name || null }); }
    out.seen = seen;
    out.after = t ? { status: t.status, reason: t.reason || null, ill: 'ill2753' in t ? t.ill2753 : 'нет поля', hold: t.hold57 || null } : null;
    out.nan = ['cash', 'health', 'mood'].filter(k => !Number.isFinite(s[k])).concat(Number.isFinite(s.clock.fatigue) ? [] : ['fatigue']);
    return out;
  });
  note('сохранение: ' + r.country + ', ' + r.age + ' лет, поездок ' + r.trips + (r.active ? ', запланирована ' + r.active : '') + (r.illness ? ', болеет: ' + r.illness : ''));
  if (r.skip) check('сохранение: персонаж взрослый', false, r);
  else {
    if (r.activeSleep) {
      check('сохранение, своя поездка: нарушение сна — пометка к «Получите», болезнь не в «не хватает»', r.activeSleep.got?.note?.includes('Нарушение сна поедет с вами: отдохнёте меньше обычного') && !r.activeSleep.need.some(n => /сна|восстанов/i.test(n.text)), { got: r.activeSleep.got, need: r.activeSleep.need });
      check('сохранение, своя поездка: пневмония — «С пневмонией в дорогу рано…» и «Самочувствие»', r.activePn.need.some(n => /^С пневмонией в дорогу рано/.test(n.text) && n.fix === 'Самочувствие'), r.activePn.need);
      // Своя поездка владелицы может быть серой по другой причине (часы работы изменились после согласования отпуска) — это верно; болезнь серой её не делает.
      check('сохранение, своя поездка с пневмонией: «Перенести дату поездки» не серая из-за болезни', r.activePn.move && (!r.activePn.move.disabled || /переехали|часы работы/.test(r.activePn.move.why)), r.activePn.move);
    } else note('у персонажа нет запланированной поездки');
    check('сохранение: нарушение сна — болезнь поездке не мешает', !r.sleep.need.some(n => /сна|восстанов|болезн/i.test(n.text)), r.sleep.need);
    check('сохранение: нарушение сна — пометка к «Получите»', r.sleep.got?.note === 'Нарушение сна поедет с вами: отдохнёте меньше обычного', r.sleep.got);
    check('сохранение: пневмония — «С пневмонией в дорогу рано…» и «Самочувствие»', r.pn.need.some(n => /^С пневмонией в дорогу рано/.test(n.text) && n.fix === 'Самочувствие'), r.pn.need);
    check('сохранение, новая поездка с пневмонией: «Перенести дату поездки» доступна, первый месяц — после выздоровления', r.move && r.move.opt && !r.move.opt.disabled && r.move.clicked && r.move.title === 'Новая дата поездки' && r.move.first === r.move.expect, r.move);
    const sickDec = r.sync.filter(v => v.need && v.dec && /ждёт выздоровления/.test(v.dec.title));
    note('сохранение, отсрочка по месяцам: ' + r.sync.map(v => v.status + (v.dec ? ' «' + v.dec.note + '»' : v.need ? (v.need.length ? ' [' + v.need.join('; ') + ']' : ' можно ехать') : '')).join(' → '));
    check('сохранение, отсрочка из-за пневмонии: «Ожидают ответа» и карточка говорят одно каждый месяц', r.sync.length > 0 && sickDec.length >= 2 && sickDec.every(v => v.need.includes(v.dec.note) && v.reason === v.dec.note) && r.sync.filter(v => v.need && v.need.length === 0).every(v => !v.dec), { dep: r.syncDep, sync: r.sync });
    check('сохранение: поездку с мигренью не держат из-за болезни', r.booked && r.seen.every(x => !x.hold || !/мигрен|восстанов/i.test(x.hold)), r.seen);
    if (r.after && ['away', 'completed'].includes(r.after.status)) check('сохранение: при отъезде записано «Мигрень»', r.after.ill?.name === 'Мигрень', r.after);
    else note('поездка на сохранении не уехала по другой причине: ' + JSON.stringify(r.after));
    check('сохранение: без NaN', r.nan.length === 0, r.nan);
  }
  check('сохранение: без ошибок страницы', P.errors.length === 0, P.errors.slice(0, 5));
  await P.ctx.close();
}

(async () => {
  const browser = await chromium.launch();
  try {
    for (const [name, fn] of [['таблица', partTable], ['даты', partDates], ['травма', partInjury], ['отсрочка', partHold], ['сама', partRelease], ['совпадает', partHoldSync], ['календарь', partCalendar], ['цена', partCost], ['дети', partKids], ['программа и командировка', partStayBusiness], ['ребёнок и семейная поездка', partFamilyChild]]) {
      const P = await page(browser);
      try { await fn(P); } catch (e) { check(name + ': проверка дошла до конца', false, String(e.message || e).slice(0, 300)); }
      check(name + ': без ошибок страницы', P.errors.length === 0, P.errors.slice(0, 5));
      await P.ctx.close();
    }
    if (SAVE && fs.existsSync(SAVE)) await partOwner(browser, fs.readFileSync(SAVE, 'utf8'));
    else note('SAVE не задан: проверка только на новых жизнях');
  } finally { await browser.close(); }
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE)' : ''));
  process.exit(fail ? 1 : 0);
})();
