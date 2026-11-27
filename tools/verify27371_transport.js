// Проверки сборки 273.7.1 (fixes27371.js): транспорт — неделя и деньги дороги до работы.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify27371_transport.js
// BASE=1 — index.html без fixes27371.js (и vehicles56.js как в main): проверки исправлений падают — так видно, что они
// ловят старое поведение. OWNER_SAVE=путь — сохранение владелицы (по умолчанию owner-save.json рядом с рабочей копией,
// если есть); без него эти проверки пропускаются.
// • Сохранение владелицы: Fiat Panda в Сиднее исправна и стоит, дорога — общественным: пункт «Fiat Panda стоит без дела
//   · 69 A$/мес.» → «Ездить на ней · 17 мин вместо 20» с деньгами; два велосипеда в Италии — пункт «2 велосипеда в
//   других городах»; «Ездить на ней» ставит машину, через месяц списано ровно то, что обещал пункт; «×» откладывает
//   пункт по ключу его темы («транспорт:стоит», «транспорт:оставлен», «транспорт:ремонт:<id>») на 3 месяца и не прячет
//   другие дела транспорта; отложенный ремонт снимается после ремонта; машина на 24/100 — пункт «нужен ремонт» со временем и деньгами,
//   ремонт по цене игры, после ремонта пункта нет; пока не ездит — дорога общественным, бензина нет, стоянка и
//   страховка списываются, износ как у стоящей; на 30/100 в карточке «скоро понадобится ремонт», в панели ничего;
//   поломка в дороге — происшествие, эвакуатор по цене страны, опоздание, «нужен ремонт» после «Пока не чинить»,
//   отступ 6 месяцев, в панели «Отремонтировать · цена или пока не чинить», в списке происшествий состояние словами;
//   «Спросить про старый транспорт» гаснет с причиной и датой, а при пяти своих единицах — без даты и оживает после
//   продажи; два одинаковых велосипеда различимы по состоянию; переезд за границу — «Fiat Panda — в
//   городе Сидней», обратно — снова «Ездить на ней»; подарок ребёнку при пяти своих единицах; 24 месяца без ошибок и NaN.
// • Новая жизнь с работой в другом городе: «Пешком» и «Велопрокат» серые с причиной, selectTransport56 их не ставит,
//   у вариантов «Как добираться» минуты, часы и деньги — те же, что у функций игры; сохранение, где уже выбрано «Пешком»,
//   само не меняется — пункт «Дорога съедает всю неделю» с исправлением в одно нажатие; купленный велосипед и «Продолжить
//   за близкого» не ставят на дорогу способ, на котором неделя не помещается; рядом с работой при неделе, занятой работой,
//   «Пешком» не серое; машина в другом городе страны
//   после переезда — «Перевезти к себе», после перевозки — «Ездить на ней».
// • s.pending и resolvePending файл не трогает.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg' };
const BASE = process.env.BASE === '1';
const OWNER = process.env.OWNER_SAVE || [path.join(ROOT, '..', 'owner-save.json')].find(f => fs.existsSync(f)) || '';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (!ok && extra !== '' ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 900) : '')); };

function helpers() {
  window.__still = () => { s.pending = []; s.clock.running = false; s.clock.resumeAfterChoice = false; s.clock.speed = 0; };
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { s.pending = []; if ($('#modal').open) closeModal(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } s.pending = []; if ($('#modal').open) closeModal(); advanceMonth(); } s.pending = []; if ($('#modal').open) closeModal(); __still(); };
  // Способ дороги на время вызова — те же функции игры, что ставят часы и списывают деньги (без fixes27371).
  window.__opt = (mode, repaired = null) => {
    const z = transportState56(), old = z.selected, v = repaired && vehicle56(repaired), keep = v && { condition: v.condition, damage: v.damage };
    z.selected = mode; if (v) { v.condition = 95; v.damage = null; }
    try {
      const w = s.job?.workplace, route = w ? { ...s.job, country: w.country, city: w.city, area: w.area } : null;
      const fare = s.job?.professionId && w && permission16(s.country, 'work') ? transport16(route) : 0;
      const upkeep = ownedVehicles56().reduce((n, v) => n + vehicleCost56(v).total, 0);
      return { minutes: Math.round(commuteMinutes()), road: schedule23().road, cap: capacity(), free: capacity() - totalHours(), fare, upkeep, money: fare + upkeep };
    } finally { z.selected = old; if (v) Object.assign(v, keep); }
  };
  window.__flat = t => String(t || '').replace(/·/g, ' ').replace(/\s+/g, ' ').trim();
  window.__hrs = h => '≈ ' + (h < 9.95 ? String(Math.round(h * 10) / 10).replace('.', ',') : String(Math.round(h))) + ' ч/нед.';
  // Сравнение двух способов: минуты, часы в неделю и деньги в месяц вместе.
  window.__cmp = (a, b, pre = '') => a.minutes + ' мин вместо ' + b.minutes + ' · ' + __hrs(a.road) + ' вместо ' + __hrs(b.road).replace(/^≈ /, '').replace(/ ч\/нед\.$/, '') + ' · ' + pre + money(a.money) + '/мес. вместо ' + money(b.money);
  window.__items = () => decisionItems24().filter(i => i.ref.kind === 'transport27371').map(i => ({ id: i.ref.id, title: i.title, note: i.note }));
  window.__dump = () => {
    const m = document.querySelector('#modal');
    if (!m || !m.open) return null;
    const lbl = b => [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim();
    // Подсказка без «·»: windows273 рисует части подсказки отдельно, разделитель — оформлением (CSS).
    const opts = [...m.querySelectorAll('.options button')].map(b => ({ label: lbl(b), hint: __flat([...b.querySelectorAll('small:not(.why273)')].map(x => x.textContent).join(' ')), why: b.querySelector('small.why273')?.textContent || '', disabled: b.disabled }));
    return { title: m.querySelector('h2')?.textContent || '', text: (m.querySelector('.dialog-copy20')?.innerText || m.querySelector('p')?.innerText || '').replace(/\n+/g, '\n'), opts };
  };
  window.__opts = () => __dump()?.opts || [];
  window.__press = (start) => { const i = [...document.querySelectorAll('#modal .options button')].findIndex(b => b.textContent.replace(/\s+/g, ' ').trim().startsWith(start)); if (i < 0) return false; choose(i); return true; };
  window.__toast = () => document.querySelector('.toast')?.textContent || '';
  window.__spent = (tick, re) => (ensureFamily17().ledger || []).filter(e => e.tick === tick && re.test(e.key)).reduce((n, e) => n + e.parts.reduce((a, p) => a + p.amount, 0), 0);
  window.__nan = () => { const bad = []; const walk = (o, p, d) => { if (d > 6 || !o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if (typeof v === 'number' && !Number.isFinite(v)) bad.push(p + '.' + k); else if (v && typeof v === 'object') walk(v, p + '.' + k, d + 1); } }; walk({ cash: s.cash, health: s.health, mood: s.mood, clock: s.clock, transport56: s.transport56, incidents56: s.incidents56, job: s.job }, 's', 0); return bad.slice(0, 10); };
}

async function page(browser, { country = 'ru', seed = 27371, owner = false, width = 390, height = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    if (rel === 'index.html' && BASE) body = Buffer.from(body.toString('utf8').replace(/<script src="fixes27371\.js[^"]*"><\/script>/, ''));
    // BASE: износ сломанного выбранного транспорта — как до 273.7.1.
    if (rel === 'vehicles56.js' && BASE) body = Buffer.from(body.toString('utf8').replace(/\/\* 27371:[^*]*\*\/selectedVehicle56\(\)===v/, 'z.selected===v.id'));
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage(); const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (owner) {
    const raw = fs.readFileSync(OWNER, 'utf8');
    await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  } else {
    await pg.evaluate(c => { for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, country);
    await pg.evaluate(() => [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click());
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    try { localStorage.clear(); } catch (e) {}
  });
  await pg.evaluate(helpers);
  await pg.evaluate(() => __still());
  return { pg, ctx, errors };
}
const ev = (pg, fn, arg) => pg.evaluate(fn, arg);

(async () => {
  const browser = await chromium.launch();

  // ---------- 0. Файл не трогает очередь окон ----------
  {
    const src = fs.readFileSync(path.join(ROOT, 'fixes27371.js'), 'utf8').replace(/\/\/[^\n]*/g, '');
    check(!/resolvePending\s*=|s\.pending\s*=|s\.pending\.(push|unshift|splice)/.test(src), 'очередь: fixes27371.js не меняет s.pending и resolvePending');
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), order = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    // 275.5: между fixes27371.js и windows273.js — только точечные fixesNNNN.js более поздних сборок (fixes2755.js).
    const between = order.slice(order.indexOf('fixes27371.js') + 1, order.indexOf('windows273.js'));
    check(order.indexOf('fixes27371.js') >= 0 && order.indexOf('fixes27371.js') < order.indexOf('windows273.js') && between.every(f => /^fixes27[5-9]\d+\.js$/.test(f)) && order.indexOf('fixes27371.js') > order.indexOf('fixes2758.js'), 'порядок: fixes27371.js — после fixes2758.js, перед windows273.js (между ними — только поздние fixesNNNN.js)', order.slice(-6));
  }

  // ---------- 1. Сохранение владелицы ----------
  if (OWNER && fs.existsSync(OWNER)) {
    // 1.1 Fiat Panda стоит, два велосипеда в Италии.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const a = await ev(pg, () => {
        const z = transportState56(), fiat = vehicle56('parent-car-4');
        const pub = __opt('public'), car = __opt('parent-car-4');
        const items = __items(), idle = items.find(i => i.id === 'idle'), left = items.find(i => i.id === 'left');
        const out = { selected: z.selected, usable: vehicleUsable56(fiat), upkeep: vehicleCost56(fiat).total, pub, car, items, idle, left,
          wantNote: 'Ездить на ней · ' + __cmp(car, pub),
          wantTitle: 'Fiat Panda стоит без дела · ' + money(vehicleCost56(fiat).total) + '/мес.',
          bikes: ownedVehicles56().filter(v => v.kind === 'bike' && !vehicleLocal56(v)).map(v => v.city + ':' + vehicleCost56(v).total.toFixed(2)) };
        if (idle) { openDecision24('transport27371', 'idle'); out.win = __dump(); }
        // Карточка Fiat Panda: подсказка «Использовать …» — время и деньги вместе; старая запись о перевозке — «из страны Италия».
        if ($('#modal').open) closeModal();
        vehicleCard56('parent-car-4'); out.card = __dump(); out.wantCardHint = __flat(__cmp(car, pub, 'в месяц на транспорт '));
        out.hist = fiat.history.map(h => h.text);
        if ($('#modal').open) closeModal();
        return out;
      });
      check(a.selected === 'public' && a.usable && a.upkeep > 60, 'владелица: Fiat Panda исправна, допуск есть, дорога — общественным, содержание ' + Math.round(a.upkeep) + ' A$/мес. идёт (так в сохранении)', a);
      check(!!a.idle && a.idle.title === a.wantTitle && a.idle.note === a.wantNote, 'владелица: пункт «' + a.wantTitle + '» → «' + a.wantNote + '» (числа — из функций игры)', a.items);
      check(!!a.win && a.win.opts.some(o => o.label === 'Ездить на ней · ' + a.car.minutes + ' мин вместо ' + a.pub.minutes && /в месяц на транспорт/.test(o.hint)) && a.win.opts.some(o => o.label.startsWith('Продать · ')) && a.win.opts.some(o => o.label === 'Оставить как есть'),
        'владелица: окно пункта — «Ездить на ней · 17 мин вместо 20» (с деньгами), «Продать · цена», «Оставить как есть»', a.win);
      check(!!a.card && a.card.opts.some(o => o.label === 'Использовать для регулярных поездок' && o.hint === a.wantCardHint),
        'владелица: в карточке «Использовать для регулярных поездок» — «' + a.wantCardHint + '» (минуты, часы и деньги)', a.card?.opts);
      check(!!a.card && a.hist.some(h => h.startsWith('Перевезён из Италия за ')) && /Перевезён из страны Италия за /.test(a.card.text) && !/Перевезён из Италия/.test(a.card.text),
        'владелица: старая запись «Перевезён из Италия» в карточке — «Перевезён из страны Италия» (в сохранении без изменений)', { hist: a.hist, text: a.card?.text });
      check(a.bikes.length === 2 && !!a.left && /^2 велосипеда в других городах · /.test(a.left.title) && /Неаполь/.test(a.left.note) && /Палермо/.test(a.left.note), 'владелица: два велосипеда в Италии — пункт «' + (a.left?.title || '2 велосипеда в других городах') + '»', { left: a.left, bikes: a.bikes });

      // «Ездить на ней» из пункта: машина выбрана, месяц списывает ровно то, что обещал пункт.
      const b = await ev(pg, () => {
        openDecision24('transport27371', 'idle');
        const pressed = __press('Ездить на ней');
        const z = transportState56(), want = __opt('parent-car-4'), toast = __toast();
        const after = __items().map(i => i.id);
        const t = s.clock.ticks + 1;
        const ledger0 = __spent(t, /./);
        __month(1);
        const fiat = vehicleCost56(vehicle56('parent-car-4'));
        return { pressed, selected: z.selected, minutes: commuteMinutes(), want, toast, after, ticks: s.clock.ticks, t,
          carPaid: __spent(t, /^expense23:transport43:vehicle:parent-car-4:/), farePaid: __spent(t, /^expense23:transport43:\d+$/), allVehicles: __spent(t, /^expense23:transport43:vehicle:/), fiat };
      });
      check(b.pressed && b.selected === 'parent-car-4' && b.minutes === b.want.minutes && !b.after.includes('idle'), 'владелица: «Ездить на ней» ставит Fiat Panda — до работы ' + b.want.minutes + ' мин, пункт пропал', b);
      check(/^Теперь до работы \d+ мин · ≈ [\d,]+ ч\/нед\. · /.test(b.toast), 'владелица: после выбора — «Теперь до работы …»', b.toast);
      check(Math.abs(b.allVehicles + b.farePaid - b.want.money) < .02 && b.farePaid === 0 && Math.abs(b.carPaid - b.want.upkeep + (b.allVehicles - b.carPaid)) < .02,
        'владелица: через месяц списано столько, сколько обещал пункт (' + Math.round(b.want.money) + ' A$: машина с бензином и велосипеды, проезда нет)', b);
      // Транспорт — в разделе «Поездки и переезд» и в поиске «Переезды» (решение владелицы 26.11).
      const h = await ev(pg, () => {
        if ($('#modal').open) closeModal();
        travelHub65(); const row = __opts().find(o => o.label === 'Машины, велосипеды и дорога до работы');
        const a = actionCatalog24().find(a => a.id === 'transport56');
        return { row, group: a?.group, now: __flat('Сейчас: ' + 'Fiat Panda' + ' · ' + commuteMinutes() + ' мин') };
      });
      check(!!h.row && h.row.hint.startsWith(h.now) && h.group === 'Переезды', 'раздел: «Поездки и переезд» → «Машины, велосипеды и дорога до работы» («' + (h.row?.hint || '') + '»), в поиске — «Переезды»', h);
      check(errors.length === 0, 'владелица: без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.2 «×» откладывает пункт по ключу его темы на 3 месяца; у каждого дела транспорта своя тема.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const r = await ev(pg, () => {
        render();
        const rows = [...document.querySelectorAll('.attention-row59')].filter(r => /стоит без дела|в других городах/.test(r.textContent)).map(r => r.querySelector('.quick-close59')?.getAttribute('title') || '');
        const before = __items().map(i => i.id);
        const ok = quickDismiss59('transport27371', 'idle');
        const after = __items().map(i => i.id), z = s.notices59?.snoozed || {}, t = s.clock.ticks;
        const topic = z['транспорт:стоит'];
        s.clock.ticks = t + 2; const at2 = __items().map(i => i.id); s.clock.ticks = t + 3; const at3 = __items().map(i => i.id); s.clock.ticks = t;
        return { rows, before, ok, after, topic, t, at2, at3, keys: Object.keys(z) };
      });
      check(r.rows.length === 2 && r.rows.every(x => x === 'Скрыть на 3 месяца'), 'панель: у пунктов транспорта «×» — «Скрыть на 3 месяца»', r);
      check(r.ok && r.before.includes('idle') && r.before.includes('left') && !r.after.includes('idle') && r.after.includes('left') && r.topic === r.t + 3 && !r.at2.includes('idle') && r.at3.includes('idle'),
        'панель: «×» у «Fiat Panda стоит без дела» откладывает его по теме «транспорт:стоит» на 3 месяца, «2 велосипеда в других городах» остаётся', r);
      // «×» у велосипедов в Италии не прячет «нужен ремонт» машины, на которой вы ездите (находка проверки).
      const b = await ev(pg, () => {
        const z = transportState56(), v = vehicle56('parent-car-4');
        z.selected = v.id; v.condition = 40;
        const ok = quickDismiss59('transport27371', 'left');
        v.condition = 25.2; s.incidents56.lastEvent = s.clock.ticks;
        __month(1);
        const items = __items().map(i => i.id), log = s.log.slice(0, 8).map(e => e.title);
        // «×» у ремонта, потом ремонт и новая поломка: пункт виден сразу, а не через 3 месяца.
        const ok2 = quickDismiss59('transport27371', 'repair:' + v.id);
        const hidden = !__items().some(i => i.id === 'repair:' + v.id);
        s.cash = Math.max(s.cash, 1e5); const fixed = vehicleRepair56(v.id); v.condition = 24;
        const again = __items().some(i => i.id === 'repair:' + v.id);
        return { ok, cond: v.condition, items, log, ok2, hidden, fixed, again, topics: Object.keys(s.notices59?.snoozed || {}) };
      });
      check(b.ok && !b.items.includes('left') && b.items.includes('repair:parent-car-4') && b.log.includes('Fiat Panda: нужен ремонт'),
        'панель: после «×» у велосипедов в Италии пункт «Fiat Panda: нужен ремонт» для машины, на которой вы ездите, всё равно виден', b);
      check(b.ok2 && b.hidden && b.fixed && b.again, 'панель: отложенный «нужен ремонт» снимается после ремонта — новая поломка видна сразу', b);
      check(errors.length === 0, 'панель: без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.3 Нужен ремонт: машина, на которой ездите, на 24/100.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const r = await ev(pg, () => {
        const z = transportState56(), v = vehicle56('parent-car-4');
        z.selected = v.id; v.condition = 24;
        const now = __opt(v.id), fixed = __opt(v.id, v.id), pub = __opt('public'), quote = vehicleRepairQuote56(v), sale = vehicleValue56(v);
        const items = __items(), it = items.find(i => i.id === 'repair:' + v.id);
        const out = { now, fixed, pub, quote, sale, it, items, minutes: commuteMinutes(), variable: vehicleCost56(v).variable, fixedCost: vehicleCost56(v).fixed, fare: transport16({ ...s.job, ...s.job.workplace }),
          wantNote: 'пока не почините — общественным ' + __cmp(now, fixed), wantQuote: 'Отремонтировать · ' + money(quote) };
        if (it) { openDecision24('transport27371', it.id); out.win = __dump(); }
        vehicleCard56(v.id); out.card = __dump();
        // Месяц, пока не ездит: бензина нет, страховка и стоянка списываются, износ как у стоящей.
        if ($('#modal').open) closeModal();
        const c0 = v.condition, t = s.clock.ticks + 1;
        __month(1);
        out.monthCar = __spent(t, /^expense23:transport43:vehicle:parent-car-4:/); out.monthFare = __spent(t, /^expense23:transport43:\d+$/); out.wear = +(c0 - v.condition).toFixed(3);
        return out;
      });
      check(r.minutes === r.pub.minutes && r.variable === 0 && r.fixedCost > 0 && Math.abs(r.monthCar - r.fixedCost) < .02 && Math.abs(r.monthFare - r.pub.fare) < .02,
        'ремонт: пока машина на 24/100, дорога общественным (' + r.pub.minutes + ' мин), бензина нет, страховка и стоянка ' + Math.round(r.fixedCost) + ' A$ списываются', r);
      check(!!r.it && r.it.title === 'Fiat Panda: нужен ремонт · состояние 24/100' && r.it.note === r.wantNote, 'ремонт: пункт «Fiat Panda: нужен ремонт · состояние 24/100» — «' + r.wantNote + '»', r.items);
      check(!!r.win && r.win.opts[0]?.label === r.wantQuote && r.win.opts.some(o => o.label.startsWith('Продать как есть · ')) && /ездите общественным: дорога \d+ мин вместо \d+, .* в месяц на транспорт .* вместо /.test(r.win.text),
        'ремонт: окно — «' + r.wantQuote + '» (цена игры), «Продать как есть», время и деньги вместе', r.win);
      check(!!r.win && r.quote > r.sale && /Ремонт [\d\s\u00a0\u202f]+A\$ — сама машина стоит [\d\s\u00a0\u202f]+A\$/.test(r.win.text),
        'ремонт: ремонт дороже машины — «Ремонт X — сама машина стоит Y»', r.win?.text);
      check(!!r.card && /Не ездит: состояние 24\/100 — нужен ремонт/.test(r.card.text) && r.card.opts.some(o => o.label === 'Использовать для регулярных поездок' && o.disabled && /нужен ремонт/i.test(o.why)),
        'ремонт: карточка говорит, почему не ездит, «Использовать» серая с причиной', r.card);
      check(!!r.card && (r.card.text.match(/списывается/g) || []).length === 1 && /Пока не почините, ездите общественным: дорога \d+ мин вместо \d+/.test(r.card.text),
        'ремонт: в карточке содержание названо один раз (строка «пока не почините» — без повтора о содержании)', r.card?.text);
      check(r.wear < .1, 'ремонт: сломанная машина, которую не водят, изнашивается как стоящая (' + r.wear + ' за месяц, а не 0,3)', r.wear);
      // Ремонт из окна пункта: цена игры, состояние 95, пункта нет, дорога снова на машине.
      const f = await ev(pg, () => {
        const v = vehicle56('parent-car-4'); v.condition = 24; v.damage = null;
        const cash0 = s.cash, quote = vehicleRepairQuote56(v);
        openDecision24('transport27371', 'repair:' + v.id);
        const pressed = __press('Отремонтировать');
        return { pressed, paid: +(cash0 - s.cash).toFixed(2), quote: +quote.toFixed(2), cond: v.condition, items: __items().map(i => i.id), minutes: commuteMinutes(), car: __opt(v.id).minutes, selected: transportState56().selected };
      });
      check(f.pressed && Math.abs(f.paid - f.quote) < .02 && f.cond === 95 && !f.items.some(i => i.startsWith('repair:')) && f.minutes === f.car, 'ремонт: «Отремонтировать» — списано ' + Math.round(f.quote) + ' A$ (vehicleRepairQuote56), состояние 95, пункт пропал, дорога снова на машине', f);
      // Скоро ремонт: на 30/100 — строка в карточке, в панели ничего.
      const g = await ev(pg, () => {
        const v = vehicle56('parent-car-4'); v.condition = 30; v.damage = null;
        const items = __items().map(i => i.id); vehicleCard56(v.id); const card = __dump(); if ($('#modal').open) closeModal();
        return { items, text: card?.text || '' };
      });
      check(/Скоро понадобится ремонт: при 25\/100 и ниже машина не ездит, а пока чаще ломается в дороге\./.test(g.text) && !g.items.some(i => i.startsWith('repair')), 'скоро ремонт: на 30/100 в карточке «скоро понадобится ремонт … чаще ломается в дороге», в панели ничего', g);
      check(errors.length === 0, 'ремонт: без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.4 Поломка в дороге.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const r = await ev(pg, () => {
        const z = transportState56(), v = vehicle56('parent-car-4'), inc = incidents56();
        z.selected = v.id; v.condition = 30; v.damage = null; inc.lastEvent = -99; inc.events.forEach(q => { if (q.status === 'offered') q.status = 'answered'; });
        const chance = typeof breakdownChance27371 === 'function' ? breakdownChance27371(v) : 0;
        const co = s.job.company18, perf0 = co?.performance, cash0 = s.cash, n0 = inc.events.length, tow = c().cost * .004;
        const keep = Math.random; Math.random = () => 0;
        try { if (typeof breakdownMonth27371 === 'function') breakdownMonth27371(); } finally { Math.random = keep; }
        const q = inc.events.slice(n0).find(q => q.kind === 'breakdown');
        const out = { chance, made: !!q, damage: v.damage, cond: v.condition, perf0, perf: co?.performance, paid: +(cash0 - s.cash).toFixed(2), tow: +tow.toFixed(2), title: q?.title, text: q?.text, win: __dump() };
        out.panel = decisionItems24().filter(i => i.ref.kind === 'incident56' && i.ref.id === q?.id).length;
        out.panelNote = decisionItems24().find(i => i.ref.kind === 'incident56' && i.ref.id === q?.id)?.note || '';
        out.wantPanelNote = 'Отремонтировать · ' + money(vehicleRepairQuote56(v)) + ' или пока не чинить';
        out.repairItem = __items().some(i => i.id === 'repair:' + v.id);
        // Отступ 6 месяцев: сразу вторая поломка невозможна.
        Math.random = () => 0; try { if (typeof breakdownMonth27371 === 'function') { v.damage = null; breakdownMonth27371(); v.damage = 'Поломка в дороге'; } } finally { Math.random = keep; }
        out.second = inc.events.filter(q => q.kind === 'breakdown').length;
        // «Пока не чинить» — происшествие закрыто, в панели «нужен ремонт».
        if ($('#modal').open) closeModal();
        if (q) { incidentMenu56(q.id); out.pressed = __press('Пока не чинить'); out.status = q.status; out.repairAfter = __items().find(i => i.id === 'repair:' + v.id) || null; out.incidentAfter = decisionItems24().some(i => i.ref.kind === 'incident56' && i.ref.id === q.id); }
        // «Все происшествия и поиски»: состояние словами, без служебных answered / expired.
        if ($('#modal').open) closeModal();
        incidentsMenu56(); out.list = (__dump()?.opts || []).map(o => ({ label: o.label, hint: o.hint }));
        out.keptChance = typeof breakdownChance27371 === 'function' ? [breakdownChance27371({ ...v, damage: null, condition: 50 }), breakdownChance27371({ ...v, damage: null, condition: 36 }), breakdownChance27371({ ...v, damage: null, condition: 26 }), breakdownChance27371({ ...v, damage: null, condition: 25 })] : null;
        return out;
      });
      check(r.made && r.damage === 'Поломка в дороге' && r.cond === 27 && Math.abs(r.paid - r.tow) < .02 && (r.perf0 == null || r.perf === Math.max(0, r.perf0 - 1)),
        'поломка: машина на 30/100 ломается по дороге на работу — повреждение, состояние −3, эвакуатор ' + Math.round(r.tow) + ' A$ (0,4% стоимости жизни страны), результаты на работе −1', r);
      check(!!r.win && r.win.title === 'Fiat Panda: поломка в дороге' && r.win.opts[0]?.label.startsWith('Отремонтировать · ') && r.win.opts.some(o => o.label === 'Пока не чинить') && /ездите общественным: дорога \d+ мин вместо \d+/.test(r.win.text) && /опоздали/.test(r.win.text),
        'поломка: окно — «Отремонтировать · цена», «Пока не чинить», время и деньги общественным', r.win);
      check(r.panel === 1 && !r.repairItem && r.second === 1, 'поломка: в «Ожидают ответа» — одно происшествие (без второго пункта о ремонте), вторая поломка не раньше чем через 6 месяцев', r);
      check(r.pressed && r.status === 'answered' && !r.incidentAfter && !!r.repairAfter, 'поломка: «Пока не чинить» — происшествие закрыто, в панели «нужен ремонт»', r);
      check(r.panelNote === r.wantPanelNote, 'поломка: в «Ожидают ответа» подпись — «' + r.wantPanelNote + '», а не «Выбрать помощь и следующий шаг»', { note: r.panelNote, want: r.wantPanelNote });
      const brk = (r.list || []).find(o => o.label === 'Fiat Panda: поломка в дороге');
      check(r.list.length > 1 && !r.list.some(o => /answered|expired|offered|acknowledged|completed|searching|returned|recovering/.test(o.hint)) && !!brk && /^ремонт отложен /.test(brk.hint),
        'происшествия: в списке состояние словами («' + (brk?.hint || '') + '»), без answered / expired', r.list);
      check(!!r.keptChance && r.keptChance[0] === 0 && r.keptChance[1] === 0 && r.keptChance[2] > .3 && r.keptChance[3] === 0, 'поломка: выше 35 шанса нет, на 26 — около 40% в месяц, на 25 машина уже не ездит', r.keptChance);
      check(errors.length === 0, 'поломка: без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.5 «Спросить про старый транспорт» не зацикливается.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const r = await ev(pg, () => {
        const press = () => { if (!$('#modal').open || __dump()?.title !== 'Транспорт домохозяйства') transportMenu56(); const ok = __press('Спросить про старый транспорт · Лоренцо Галло'); const toast = __toast(); if (!$('#modal').open) transportMenu56(); const o = __opts().find(o => o.label === 'Спросить про старый транспорт · Лоренцо Галло'); return { ok, toast, disabled: !!o?.disabled, why: o?.why || '' }; };
        const a = press(); const b = press();
        return { a, b };
      });
      check(r.a.disabled && /Fiat Panda в плохом состоянии \(17\/100\)/.test(r.a.why) && /Спросить снова можно в [а-я]+ \d{4}/.test(r.a.why), 'спросить про транспорт: после отказа кнопка серая с причиной и датой («' + r.a.why + '»)', r);
      check(errors.length === 0, 'спросить про транспорт: без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.5б Причина на вашей стороне (пять своих единиц) — кнопка серая без даты и оживает, как только причина ушла.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const r = await ev(pg, () => {
        const z = transportState56(), L = 'Спросить про старый транспорт · Лоренцо Галло';
        const row = () => { if ($('#modal').open) closeModal(); transportMenu56(); const o = __opts().find(o => o.label === L); if ($('#modal').open) closeModal(); return { disabled: !!o?.disabled, why: o?.why || '' }; };
        vehicle56('parent-car-5').condition = 80;
        const tpl = vehicle56('gift-bike-1088');
        for (const id of ['x-bike-1', 'x-bike-2']) z.vehicles.push({ ...JSON.parse(JSON.stringify(tpl)), id, city: residenceCity(), country: s.country, history: [] });
        const own5 = ownedVehicles56().length, five = row();
        // Если кнопку всё же нажать (старая проверка нажимала): причина без даты и не запоминается.
        transportMenu56(); const pressed = __press(L); const toast = __toast(); if ($('#modal').open) closeModal();
        const stored = JSON.stringify(z.ask27371?.['parent-5'] || z.ask27371 || {});
        s.cash = Math.max(s.cash, 1e5); sellVehicle56('x-bike-2');
        const own4 = ownedVehicles56().length, four = row();
        return { own5, five, pressed, toast, stored, own4, four };
      });
      check(r.own5 === 5 && r.five.disabled && /^У вас уже пять единиц транспорта/.test(r.five.why) && !/Спросить снова/.test(r.five.why), 'спросить про транспорт: при пяти своих единицах кнопка серая — «' + r.five.why + '», без даты', r);
      check(r.own4 === 4 && !r.four.disabled && !/пять единиц/.test(r.stored), 'спросить про транспорт: продали одну — кнопка снова доступна (причина на вашей стороне не запоминается на 12 месяцев)', r);
      check(errors.length === 0, 'спросить про транспорт (пять единиц): без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.5в Оба велосипеда владелицы в Сиднее: два одинаковых «Городской велосипед» различимы, тексты без «Велосипед Городской велосипед».
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const r = await ev(pg, () => {
        for (const id of ['gift-bike-1088', 'gift-bike-1733']) Object.assign(vehicle56(id), { city: residenceCity(), country: s.country, area: s.housing.area });
        const items = __items(), idle = items.find(i => i.id === 'idle'), cost = ownedVehicles56().reduce((n, v) => n + vehicleCost56(v).total, 0);
        let win = null; if (idle) { openDecision24('transport27371', 'idle'); win = __dump(); } if ($('#modal').open) closeModal();
        transportMenu56(); __press('Выбрать способ регулярных поездок'); const commute = __dump(); if ($('#modal').open) closeModal();
        const conds = ['gift-bike-1088', 'gift-bike-1733'].map(id => Math.round(vehicle56(id).condition));
        return { idle, want: '3 единицы транспорта стоят без дела · ' + money(cost) + '/мес.', win, commute, conds };
      });
      const uniq = list => new Set(list).size === list.length;
      check(!!r.idle && r.idle.title === r.want, 'три единицы в городе: заголовок пункта — «' + r.want + '»', r.idle);
      check(!!r.win && !/Велосипед Городской велосипед/.test(r.win.text) && /Городской велосипед \(\d+\/100\) исправен/.test(r.win.text) && uniq(r.win.opts.map(o => o.label)) && r.win.opts.some(o => /^Ездить: Городской велосипед · \d+\/100 · \d+ мин вместо \d+$/.test(o.label)),
        'три единицы в городе: в окне «Городской велосипед (' + r.conds[0] + '/100) исправен…», кнопки различимы', r.win);
      check(!!r.commute && uniq(r.commute.opts.map(o => o.label)) && r.commute.opts.filter(o => o.label.startsWith('Городской велосипед · ')).length === 2,
        'три единицы в городе: в «Как добираться» два велосипеда различимы по состоянию', r.commute?.opts.map(o => o.label));
      check(!!r.commute && !/У каждого варианта/.test(r.commute.text) && !/Недоступный транспорт заменяется/.test(r.commute.text) && /^До работы: /.test(r.commute.text),
        'как добираться: вступление — «До работы: …» и содержание, без пересказа правил', r.commute?.text);
      check(errors.length === 0, 'три единицы в городе: без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.6 Переезд за границу и обратно.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const r = await ev(pg, () => {
        const z = transportState56(), job = s.job, home = { ...s.housing };
        z.selected = 'parent-car-4'; const drive = commuteMinutes();
        // Переезд в Рим: работа в Сиднее остаётся за спиной (как relocateWithFamily), Fiat — в Сиднее.
        s.job = null; s.cash = 1e7 / fxRate86('it', 'au'); s.country = 'it'; Object.assign(s.housing, { country: 'it', city: 'Рим', area: 'suburb' }); render();
        const away = { selected: z.selected, items: __items(), upkeep: vehicleCost56(vehicle56('parent-car-4')).total, move: transportMoveQuote56(vehicle56('parent-car-4')), sale: vehicleValue56(vehicle56('parent-car-4')) };
        if (away.items.some(i => i.id === 'left')) { openDecision24('transport27371', 'left'); away.list = __dump(); __press('Fiat Panda · Сидней'); away.win = __dump(); }
        // Обратно в Сидней, та же работа.
        s.country = 'au'; Object.assign(s.housing, home); s.job = job; render();
        const back = { selected: z.selected, minutes: commuteMinutes(), drive, items: __items(), pub: __opt('public'), car: __opt('parent-car-4') };
        return { away, back };
      });
      const leftFiat = r.away.items.find(i => i.id === 'left');
      check(!!leftFiat && /^3 единицы транспорта в других городах · /.test(leftFiat.title) && /Сидней/.test(leftFiat.note) && r.away.list?.opts.some(o => o.label === 'Fiat Panda · Сидней' && o.hint.includes('перевезти')), 'переезд: в Риме — пункт «' + (leftFiat?.title || '…') + '» («' + (leftFiat?.note || '') + '»), в нём «Fiat Panda · Сидней»', r.away);
      check(!!r.away.win && r.away.win.title === 'Fiat Panda — в городе Сидней (Австралия)' && r.away.win.opts.some(o => o.label.startsWith('Перевезти к себе · ')) && r.away.win.opts.some(o => o.label.startsWith('Продать · ')) && /Перевозка дороже самого транспорта/.test(r.away.win.text),
        'переезд: окно — «Перевезти к себе · цена», «Продать · цена», перевозка дороже машины', r.away.win);
      const idle = r.back.items.find(i => i.id === 'idle');
      check(r.back.selected === 'public' && r.back.minutes === r.back.pub.minutes && !!idle && idle.note.startsWith('Ездить на ней · ' + r.back.car.minutes + ' мин вместо ' + r.back.pub.minutes + ' · ') && r.back.car.minutes === r.back.drive,
        'переезд: вернулись в Сидней — сама машина не включилась (общественным ' + r.back.pub.minutes + ' мин), но пункт снова предлагает «Ездить на ней · ' + r.back.car.minutes + ' мин вместо ' + r.back.pub.minutes + '»', r.back);
      check(errors.length === 0, 'переезд: без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.7 Подарок ребёнку при пяти своих единицах транспорта.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true });
      const r = await ev(pg, () => {
        const z = transportState56(), kid = s.people.find(p => p.alive && ownChild53(p) && p.age >= 15 && p.country === s.country && p.city18 === residenceCity());
        s.cash = Math.max(s.cash, 1e6);
        for (let i = 0; i < 2; i++) z.vehicles.push({ id: 'test-bike-' + i, model: 'bike56-city', kind: 'bike', owner: 'player', country: s.country, city: residenceCity(), area: s.housing.area, priceCountry: s.country, paidPrice: 300, boughtCondition: 90, condition: 90, year: s.year, acquired: s.clock.ticks, status: 'owned', history: [], damage: null, unfunded: false, lastPay: s.clock.ticks });
        z.selected = 'parent-car-4';
        const own0 = ownedVehicles56().length;
        giftMarket61(kid.id, 'car');
        const opts = __opts(), first = opts.findIndex(o => !o.disabled);
        const out = { kid: kid.name, own0, n: opts.length, disabled: opts.filter(o => o.disabled).length, hint: opts[0]?.hint };
        if (first >= 0) { choose(first); out.confirm = __dump()?.title; __press('Купить и подарить'); }
        const gift = z.vehicles.filter(v => v.owner === kid.id && v.gift61);
        out.gift = gift.length; out.own = ownedVehicles56().length; out.selected = z.selected; out.over = ownedVehicles56().length > 5;
        return out;
      });
      check(r.own0 === 5 && r.n > 0 && r.disabled === 0, 'подарок ребёнку: при пяти своих единицах машины в подарок доступны (' + r.kid + ')', r);
      check(r.gift === 1 && r.own === 5 && !r.over && r.selected === 'parent-car-4', 'подарок ребёнку: машина у ребёнка, у вас по-прежнему пять, ваша дорога не сбросилась', r);
      check(errors.length === 0, 'подарок ребёнку: без ошибок страницы', errors.slice(0, 3).join(' | '));
      await ctx.close();
    }
    // 1.8 24 месяца на сохранении владелицы (дорога на машине на 30/100 — с поломками): без ошибок и NaN.
    {
      const { pg, ctx, errors } = await page(browser, { owner: true, seed: 271 });
      const r = await ev(pg, () => {
        const z = transportState56(), v = vehicle56('parent-car-4'); z.selected = v.id; v.condition = 31;
        const kinds = {};
        for (let i = 0; i < 24; i++) { __month(1); if (s.dead) break; for (const q of s.incidents56?.events || []) if (q.created === s.clock.ticks) kinds[q.kind] = (kinds[q.kind] || 0) + 1; decisionItems24(); render(); }
        return { nan: __nan(), dead: !!s.dead, age: s.age, kinds, items: __items().map(i => i.id), cash: Math.round(s.cash) };
      });
      check(!r.nan.length && errors.length === 0, 'владелица 24 месяца: без ошибок страницы и NaN (происшествия: ' + JSON.stringify(r.kinds) + ', пункты: ' + r.items.join(', ') + ')', { r, errors: errors.slice(0, 3) });
      await ctx.close();
    }
  } else console.log('-    1. сохранение владелицы не найдено (OWNER_SAVE)');

  // ---------- 2. Новая жизнь: работа в другом городе ----------
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ru', seed: 27371 });
    const got = await ev(pg, () => {
      s.age = 25; s.skill = 80; s.cash = 5e6; const x = path16(); x.experience.skills.computing = 80; x.languages.en = 6; x.languages[country16[s.country][0]] = 6;
      Object.assign(x.view, { country: s.country, field: 'computing', format: 'commute', page: 0, fit68: 'all', fte28: 'all', salary270: 'all', sort270: 'none' });
      makeVacancies16();
      const v = x.vacancies.filter(v => !jobEligibility16(v).why.length && v.fraction28 === 1)[0];
      if (!v) return null;
      applyJob16(v.id); const app = x.jobApplications.at(-1); app.roll = 0; app.interviewRoll = 0;
      __month(1); interview16(app.id); __month(1); acceptJob16(app.id); startJob16(app.id);
      return s.job ? { city: s.job.workplace.city, home: residenceCity() } : null;
    });
    check(!!got && got.city !== got.home, 'новая жизнь: работа в другом городе (' + (got ? got.home + ' → ' + got.city : 'не нашлась') + ')', got);
    if (got) {
      const a = await ev(pg, () => {
        const z = transportState56(), opt = { public: __opt('public'), walk: __opt('walk'), share: __opt('share') };
        const want = {}; for (const k of Object.keys(opt)) want[k] = __flat(opt[k].minutes + ' мин · ' + __hrs(opt[k].road) + ' · ' + money(opt[k].money) + '/мес.');
        transportMenu56(); __press('Выбрать способ регулярных поездок');
        const win = __dump();
        const walk = selectTransport56('walk'), after = z.selected;
        const toast = __toast();
        return { opt, want, win, walk, after, toast };
      });
      const w = a.win?.opts || [], row = l => w.find(o => o.label === l) || {};
      check(a.opt.walk.minutes >= 400 && a.opt.walk.free <= 0 && a.opt.share.minutes >= 200 && a.opt.share.free <= 0 && a.opt.public.free > 0, 'ловушка: пешком ' + a.opt.walk.minutes + ' мин и велопрокатом ' + a.opt.share.minutes + ' мин в одну сторону — свободных часов нет, общественным — ' + Math.round(a.opt.public.free) + ' ч', a.opt);
      check(row('Пешком').disabled && row('Пешком').why === 'Неделя не помещается: ' + a.opt.walk.minutes + ' мин в одну сторону — свободных часов останется 0' && row('Велопрокат · оплата через проезд до работы').disabled && /^Неделя не помещается: \d+ мин/.test(row('Велопрокат · оплата через проезд до работы').why),
        'ловушка: в «Как добираться» «Пешком» и «Велопрокат» серые с причиной «неделя не помещается: N мин в одну сторону — свободных часов останется 0»', w);
      check(row('Общественный транспорт').hint === 'сейчас ' + a.want.public && row('Пешком').hint === a.want.walk && row('Велопрокат · оплата через проезд до работы').hint === a.want.share,
        'как добираться: у вариантов минуты, часы и деньги — как у функций игры, текущий отмечен «сейчас»', w);
      check(a.walk === false && a.after === 'public' && /Неделя не помещается/.test(a.toast), 'ловушка: selectTransport56(«пешком») не ставит способ, который не помещается в неделю', a);

      // Сохранение, где «Пешком» уже выбрано: само не меняется, пункт объясняет и чинит в одно нажатие.
      const b = await ev(pg, () => {
        const z = transportState56(); z.selected = 'walk';
        const items = __items(), trap = items.find(i => i.id === 'trap');
        const out = { items, trap, selected: z.selected, cap0: capacity() };
        if (trap) { openDecision24('transport27371', 'trap'); out.win = __dump(); out.pressed = __press('Ездить общественным транспортом'); }
        out.after = z.selected; out.cap = capacity(); out.left = __items().map(i => i.id); out.pub = __opt('public');
        return out;
      });
      check(b.selected === 'walk' && !!b.trap && b.trap.title === 'Дорога съедает всю неделю' && /^Пешком · \d+ мин в одну сторону · свободных часов 0$/.test(b.trap.note), 'ловушка в старом сохранении: «Пешком» само не меняется, пункт «Дорога съедает всю неделю» — «' + (b.trap?.note || '') + '»', b.items);
      check(!!b.win && b.win.opts.some(o => o.label === 'Ездить общественным транспортом' && new RegExp('^' + b.pub.minutes + ' мин ≈ [\\d,]+ ч/нед\\. свободно \\d+ ч [\\d\\s\\u00a0\\u202f]+₽/мес\\.').test(o.hint)) && b.pressed && b.after === 'public' && b.cap > b.cap0 && !b.left.includes('trap'),
        'ловушка в старом сохранении: «Ездить общественным транспортом» (минуты, часы, свободное время, деньги) — одно нажатие, неделя снова помещается', b);

      // Покупка велосипеда при работе в другом городе: buyVehicle56 сам ставил его на дорогу — ловушка мимо серой кнопки.
      const d = await ev(pg, () => {
        const z = transportState56(), m = vehicleCatalog56.find(m => m.kind === 'bike' && m.weights[s.country]);
        const q = vehicleOffer56(m.id, false), why = purchaseWhy56(q), cap0 = capacity(), sel0 = z.selected;
        const v = buyVehicle56(q.id, false);
        const out = { why, sel0, bought: !!v, name: m.name, selected: z.selected, bike: v?.id, cap0, cap: capacity(), toast: __toast(), log: s.log.slice(0, 6).find(e => e.title === 'Транспорт приобретён')?.text || '', bikeMin: v ? __opt(v.id).minutes : 0, bikeCap: v ? __opt(v.id).cap : null };
        // «Продолжить за близкого» (continue274.js) ставит на дорогу первый свой транспорт без проверки: та же защита.
        if (typeof fixes27371Base !== 'undefined' && fixes27371Base.transformLife274 && v) {
          const keep = fixes27371Base.transformLife274;
          fixes27371Base.transformLife274 = F => { F.transport56.selected = v.id; };
          try { transformLife274(s); } finally { fixes27371Base.transformLife274 = keep; }
          out.cont = z.selected;
        }
        if (v) sellVehicle56(v.id);
        return out;
      });
      check(d.bought && d.sel0 === 'public' && d.bikeCap === 0 && d.selected === 'public' && d.cap === d.cap0, 'покупка: «' + d.name + '» до работы в другом городе (' + d.bikeMin + ' мин, свободных часов 0) куплен, но дорога осталась общественным транспортом (свободно ' + d.cap + ' ч)', d);
      check(d.toast.startsWith(d.name + ' куплен. На работу — как раньше, общественным транспортом: на нём дорога ' + d.bikeMin + ' мин в одну сторону') && d.log.includes('На работу — как раньше, общественным транспортом'), 'покупка: сказано — «' + d.toast + '»', d);
      check(d.cont === 'public', 'продолжить за близкого: первый свой транспорт не ставится на дорогу, если на нём неделя не помещается', d);

      // Машина: куплена дома, переезд в другой город страны — «Перевезти к себе», после перевозки — «Ездить на ней».
      const c = await ev(pg, () => {
        const z = transportState56(); if (!z.licenses.includes(s.country)) z.licenses.push(s.country);
        const m = vehicleCatalog56.find(m => m.kind === 'car' && m.weights[s.country]);
        const home = residenceCity(), other = s.job.workplace.city;
        z.vehicles.push({ id: 'test-car', model: m.id, kind: 'car', owner: 'player', country: s.country, city: home, area: s.housing.area, priceCountry: s.country, paidPrice: c().cost * .3, boughtCondition: 80, condition: 80, year: s.year - 3, acquired: s.clock.ticks, status: 'owned', history: [], damage: null, unfunded: false, lastPay: s.clock.ticks });
        z.selected = 'test-car'; const drive0 = commuteMinutes();
        // Переезд в город работы.
        Object.assign(s.housing, { city: other, area: s.job.workplace.area, mode: 'rent', occupant: null, propertyId: null }); render();
        const moved = { selected: z.selected, items: __items() };
        openDecision24('transport27371', 'left'); moved.win = __dump(); moved.pressed = __press('Перевезти к себе');
        const brought = { local: vehicleLocal56(vehicle56('test-car')), selected: z.selected, items: __items(), pub: __opt('public'), car: __opt('test-car'),
          hist: vehicle56('test-car').history.at(-1)?.text || '', log: s.log.slice(0, 6).filter(e => e.title === 'Транспорт доставлен').map(e => e.text).join(' ') };
        return { home, other, drive0, moved, brought, name: m.name };
      });
      const leftC = c.moved.items.find(i => i.id === 'left'), idleC = c.brought.items.find(i => i.id === 'idle');
      check(c.moved.selected === 'public' && !!leftC && leftC.title.startsWith(c.name + ' — в городе ' + c.home + ' · '), 'переезд в другой город: машина осталась — пункт «' + (leftC?.title || '') + '»', c.moved.items);
      check(c.moved.pressed && c.brought.local && c.brought.selected === 'public' && !c.brought.items.some(i => i.id === 'left') && !!idleC && idleC.note.startsWith('Ездить на ней · ' + c.brought.car.minutes + ' мин вместо ' + c.brought.pub.minutes + ' · '),
        'переезд в другой город: после «Перевезти к себе» машина не включилась сама, пункт «Ездить на ней · ' + c.brought.car.minutes + ' мин вместо ' + c.brought.pub.minutes + '»', c.brought);
      check(c.brought.hist.startsWith('Перевезён из города ' + c.home + ' за ') && !/игров/.test(c.brought.log) && c.brought.log.length > 0, 'перевозка: в истории «' + c.brought.hist + '», в записи без «игрового» допуска', c.brought);

      // Работа в своём городе и районе, неделя занята работой целиком: «Пешком» не серое — дело не в дороге (находка проверки).
      const e = await ev(pg, () => {
        const z = transportState56(); z.selected = 'public';
        const same = residenceCity() === s.job.workplace.city && s.housing.area === s.job.workplace.area;
        let tb = null;
        for (let h = 40; h <= 96; h += 2) { s.workHours = h; tb = typeof table27371 === 'function' ? table27371() : null; if (!tb || tb.ref.cap <= 0) break; }
        const pub = __opt('public'), walk = __opt('walk');
        const out = { same, hours: s.workHours, pub, walk, grey: tb?.out.walk.grey ?? null, ref: tb ? { mode: tb.ref.mode, cap: tb.ref.cap, free: tb.ref.free } : null };
        out.pick = selectTransport56('walk'); out.selected = z.selected; z.selected = 'public'; s.workHours = 40;
        return out;
      });
      check(e.same && e.pub.cap === 0 && e.walk.cap === 0 && e.walk.road > e.pub.road + .5 && e.grey === '' && e.pick === true && e.selected === 'walk',
        'рядом с работой: неделя занята работой (' + e.hours + ' ч) и общественным, и пешком — «Пешком» (' + e.walk.minutes + ' мин) не серое и выбирается', e);
    }
    check(errors.length === 0, 'новая жизнь: без ошибок страницы', errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE: проверки исправлений и должны падать)' : ''));
  process.exit(fail ? 1 : 0);
})();
