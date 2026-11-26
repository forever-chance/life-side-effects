// Проверки сборки 275.8 (fixes2758.js): причина смерти, подарок транспорта, площадь комнаты.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2758_fixes.js   (BASE=1 — без fixes2758.js: видно, что
// проверки ловят старое поведение).
// • Причина смерти — конкретная (решение владелицы 26.11): в последней записи «Истории» и строкой на финальном экране.
//   По сценариям, по многим зёрнам жизни: обычное здоровье в 40 — несчастный случай по тому, как вы ездите (пешком —
//   сбила машина на переходе, за рулём — авария, на велосипеде — сбила машина), вода у молодых; курение — рак лёгких
//   или ХОБЛ (инфаркт только внезапно), бывший курильщик — без инфаркта, выпивка — цирроз; переутомление (инфаркт —
//   только при усталости сейчас, не по записям прошлых лет); тяжёлая болезнь в момент смерти — она сама, «на фоне» —
//   только болезнь от того, что подорвало здоровье (у травмы, мигрени, аллергии, курения до 40 — болезнь одна, без
//   придуманной болезни почек или рака); глубокая старость — «старость». Причина не меняется между вызовами и после
//   перезагрузки; во всех сочетаниях нет повторов слов, «внезапная смерть», «здоровье, подорванное»; у умершего из
//   старого сохранения (без поля причины) строки нет.
// • Подарок машины: даритель живёт в Варшаве, машина в Монреале, вы — в Германии: в окне место машины, а не «в Варшава»,
//   принять можно, перевозка названа; машина с кредитом — «Принять подарок» серая с причиной, а не молча ничего не
//   делает; даритель переехал в другую страну — предложение закрывается; после отказа и после истёкшего срока та же
//   машина на дни рождения не предлагается снова, и велосипед вместо неё тоже. Велосипед ко дню рождения не конвейер:
//   за 20 дней рождения не больше двух (даже если вы их принимаете и продаёте), не чаще раза в 6 лет, и ни одного,
//   пока у вас есть свой. Закрытое предложение не обещает передачу. На телефоне 360×740 с «Не хватает» кнопки окна
//   на первом экране.
// • Комната без объявления: площадь комнаты 9–25 м², одна комната, квартира целиком — отдельно; старое сохранённое
//   жильё для показа поправляется, аренда и расходы на жильё не меняются; общежитие остаётся 10 / 14 м²; квартира,
//   где сдают комнату, — не меньше трёх комнат и двух спален по всем странам.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const BASE = process.env.BASE === '1';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (!ok && extra !== '' ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 700) : '')); };

async function page(browser, { country = 'ru', seed = 2758, width = 390, height = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    if (rel === 'index.html' && BASE) body = Buffer.from(body.toString('utf8').replace(/<script src="fixes2758\.js[^"]*"><\/script>/, ''));
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage(); const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  await pg.evaluate(c => { for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, country);
  await pg.evaluate(() => [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click());
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    // Время стоит: месяцы двигает сама проверка.
    s.pending = []; s.clock.running = false; s.clock.resumeAfterChoice = false; s.clock.speed = 0;
    try { localStorage.clear(); } catch (e) {}
    window.__still = () => { s.clock.running = false; s.clock.resumeAfterChoice = false; s.clock.speed = 0; };
    // Предложение по просьбе: родитель соглашается (иначе при случайном roll > 0,8 он сам оставляет транспорт себе).
    window.__offerGift = p => { const r = Math.random; Math.random = () => .1; try { return offerVehicleGift56(p, false); } finally { Math.random = r; } };
  });
  return { pg, ctx, errors };
}

// Состояние в момент смерти: возраст, здоровье, привычки, болезнь, усталость, недоедание, как вы ездите.
function deathState(o) {
  if ($('#modal').open) closeModal();
  s.pending = [];
  s.age = o.age;
  s.health = o.health; s.healthTrend258 = o.health;
  s.illness = o.illness || null; s.lastIllnessTick = o.illnessAgo != null ? s.clock.ticks - o.illnessAgo : -1000; s.clock.fatigue = o.fatigue ?? 10;
  if (typeof finance39 === 'function') finance39().food.strain = o.food ?? 0;
  // Хронические болезни (мигрень, аллергия: обострение сейчас и flares обострений за последние месяцы) и травма после
  // велоаварии.
  if (s.health25 || o.conditions?.length) chronicState25().conditions = (o.conditions || []).map(id => ({ id, diagnosed: 0, mode: 'off', flareLeft: 1, history: Array.from({ length: o.flares || 0 }, (_, i) => ({ tick: s.clock.ticks - 2 - 3 * i, type: 'flare', note: '' })) }));
  if (s.incidents56 || o.injury) incidents56().injury = o.injury ? { id: 'death-inj', kind: o.injury, status: 'recovering', ends: s.clock.ticks + 2 } : null;
  const h = habits78().smoke; h.strength = o.smoke && !o.quit ? 6 : 0; delete h.mode; h.years261 = o.smoke || 0; h.used = o.smoke && !o.quit ? s.clock.ticks : -1;
  const d = habits78().drink; d.strength = o.drink && !o.quit ? 6 : 0; delete d.mode; d.years261 = o.drink || 0; d.used = o.drink && !o.quit ? s.clock.ticks : -1;
  // Возраст в «Истории» старше: записи прошлых лет не влияют.
  for (const e of s.log) e.age = Math.min(e.age, 10);
  // Переутомление в «Истории» два года назад (не сейчас).
  for (let j = 0; j < (o.overworkLog || 0); j++) s.log.unshift({ title: 'Расписание не помещается в неделю', text: 'Не успеваете.', age: o.age - 2, year: s.year - 2, tag: 'Время' });
  const z = transportState56();
  z.vehicles = z.vehicles.filter(v => !/^death-/.test(v.id)); z.selected = o.travel === 'share' ? 'share' : 'public';
  if (o.travel === 'car' || o.travel === 'bike') {
    const m = o.travel === 'car' ? vehicleCatalog56.find(m => m.kind === 'car') : vehicleModel56('bike56-city');
    z.vehicles.push({ id: 'death-' + o.travel, model: m.id, kind: m.kind, owner: 'player', country: s.country, city: residenceCity(), area: 'suburb', priceCountry: s.country, paidPrice: 100, boughtCondition: 90, condition: 90, year: s.year - 2, acquired: s.clock.ticks, status: 'owned', history: [], lastPay: s.clock.ticks });
    z.selected = 'death-' + o.travel; if (!z.licenses.includes(s.country)) z.licenses.push(s.country);
  }
}
// Смерть в следующем годе с заданным состоянием. deathChance258 → 1 (или 0: смерть только в 100 лет). want — зерно
// жизни подбирается так, чтобы выпала именно эта причина (проверка, что она достижима и доходит до экрана).
function dieWith([o, stateSrc]) {
  const deathState = eval('(' + stateSrc + ')');
  deathState(o);
  let seed = null;
  if (o.want && typeof deathCause2758 === 'function') {
    for (let i = 0; i < 400 && seed == null; i++) { s.visualSeed33 = 'v2758-' + i; if (deathCause2758() === o.want) seed = s.visualSeed33; }
    if (seed == null) return { notFound: true, sample: deathCause2758() };
  }
  s.age = o.age - 1;
  const dc = deathChance258; deathChance258 = () => o.roll ?? 1;
  try { rollYear(); } finally { deathChance258 = dc; }
  render();
  const last = s.log.find(e => e.title === 'Последняя запись');
  return { dead: !!s.dead, age: s.age, cause: s.deathCause2758 ?? null, last: last?.text || '', end: document.querySelector('.end')?.innerText || '', line: document.querySelector('.end .cause2758')?.textContent || '' };
}
// Все причины для состояния по 80 зёрнам жизни (вызов deathCause2758 напрямую, без смерти).
function causesFor([o, stateSrc]) {
  const deathState = eval('(' + stateSrc + ')');
  deathState(o);
  const out = {}, seed0 = s.visualSeed33, cause = typeof deathCause2758 === 'function' ? deathCause2758 : () => '(без причины: BASE)';
  for (let i = 0; i < 80; i++) { s.visualSeed33 = 'v2758-' + i; const c = cause(); out[c] = (out[c] || 0) + 1; }
  s.visualSeed33 = seed0;
  return out;
}
const words = t => (t.toLocaleLowerCase('ru').match(/[а-яё]{4,}/g) || []);
const repeated = t => { const w = words(t); return w.find((x, i) => w.indexOf(x) !== i) || null; };

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. Причина смерти ----------
  const ROAD = { walk: 'сбила машина на пешеходном переходе', car: 'авария на дороге, вы были за рулём', bike: 'сбила машина, когда вы ехали на велосипеде' };
  const WATER = 'несчастный случай на воде', STAIRS = 'неудачное падение с лестницы', ICE = 'падение на гололёде';
  const PNEUMONIA = { name: 'Пневмония', severity: 'тяжёлая', left: 3, recovery23: 2, treated: false };
  // Полный путь: смерть в rollYear → последняя запись «Истории» и строка на финальном экране.
  const cases = [
    { name: 'сто лет', o: { age: 100, health: 30, roll: 0 }, want: 'старость' },
    { name: 'пешеход в 40 лет при хорошем здоровье', o: { age: 40, health: 95, travel: 'walk', want: ROAD.walk } },
    { name: 'водитель в 40 лет при хорошем здоровье', o: { age: 40, health: 95, travel: 'car', want: ROAD.car } },
    { name: 'курильщик в 56 лет', o: { age: 56, health: 60, smoke: 40, want: 'рак лёгких — выявили поздно' } },
    { name: 'пьющий в 50 лет', o: { age: 50, health: 30, drink: 30, want: 'цирроз печени' } },
    { name: 'пневмония у курильщика в 70 лет', o: { age: 70, health: 40, smoke: 50, illness: PNEUMONIA, want: 'пневмония на фоне ХОБЛ' } },
    { name: 'пневмония в 45 лет при обычном здоровье', o: { age: 45, health: 92, illness: PNEUMONIA }, want: 'пневмония' }
  ];
  for (const c of cases) {
    const want = c.want || c.o.want;
    const { pg, ctx, errors } = await page(browser, { country: 'de', seed: 2758 + cases.indexOf(c) });
    const r = await pg.evaluate(dieWith, [c.o, deathState.toString()]);
    check(!r.notFound, 'смерть: ' + c.name + ' — причина «' + want + '» достижима', r);
    if (r.notFound) { await ctx.close(); continue; }
    check(r.dead && r.age === c.o.age, 'смерть: ' + c.name + ' — персонаж умер в ' + c.o.age, r);
    check(r.last.endsWith('Причина: ' + want + '.'), 'смерть: ' + c.name + ' — в последней записи «Истории» «Причина: ' + want + '»', r.last);
    check(r.line === 'Причина: ' + want, 'смерть: ' + c.name + ' — строка на финальном экране', r.end.replace(/\n+/g, ' | '));
    check(!/NaN|undefined|null/.test(r.last + r.end), 'смерть: ' + c.name + ' — без NaN и пустых значений', r.last);
    if (c === cases[1]) {
      // Причина хранится: после перезагрузки (сохранение → загрузка) та же.
      const again = await pg.evaluate(() => { const before = s.deathCause2758; if (typeof flushSave264 === 'function') flushSave264(); const raw = JSON.stringify(s); s = JSON.parse(raw); render(); return { before, after: s.deathCause2758, line: document.querySelector('.end .cause2758')?.textContent || '', again: typeof deathCause2758 === 'function' ? deathCause2758() : null }; });
      check(again.after === again.before && again.line === 'Причина: ' + again.before && again.again === again.before, 'смерть: причина не меняется после перезагрузки и при повторном расчёте', again);
      // Старое сохранение умершего: поля нет — строки нет, ничего не придумывается.
      const old = await pg.evaluate(() => { delete s.deathCause2758; render(); return document.querySelector('.end')?.innerText || ''; });
      check(!/Причина/.test(old) && /Завершенная жизнь|ЗАВЕРШЕННАЯ ЖИЗНЬ|Завершённая жизнь/i.test(old), 'смерть: умерший из старого сохранения — без строки причины', old.replace(/\n+/g, ' | '));
    }
    check(errors.length === 0, 'смерть: ' + c.name + ' — без ошибок страницы', errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // Сценарии по 80 зёрнам жизни: какие причины вообще выпадают.
  {
    const scen = [
      // [название, страна, состояние, допустимые причины, обязательные причины]
      ['обычное здоровье в 40, пешком', 'de', { age: 40, health: 95, travel: 'walk' }, [ROAD.walk, WATER, STAIRS], [ROAD.walk, WATER, STAIRS]],
      ['обычное здоровье в 40, общественный транспорт, Россия (гололёд)', 'ru', { age: 40, health: 95 }, [ROAD.walk, WATER, STAIRS, ICE], [ROAD.walk, ICE]],
      ['обычное здоровье в 40, своя машина', 'de', { age: 40, health: 95, travel: 'car' }, [ROAD.car, WATER, STAIRS], [ROAD.car]],
      ['обычное здоровье в 30, свой велосипед', 'nl', { age: 30, health: 98, travel: 'bike' }, [ROAD.bike, WATER, STAIRS], [ROAD.bike]],
      ['обычное здоровье в 22, велопрокат', 'fr', { age: 22, health: 99, travel: 'share' }, [ROAD.bike, WATER, STAIRS], [ROAD.bike, WATER]],
      ['обычное здоровье в 17', 'us', { age: 17, health: 99 }, [ROAD.walk, WATER, STAIRS], [ROAD.walk, WATER]],
      ['курит сейчас, 56 лет, здоровье 70 (просело неглубоко)', 'de', { age: 56, health: 70, smoke: 40 }, ['рак лёгких — выявили поздно', 'ХОБЛ', 'молниеносный инфаркт', 'инсульт'], ['рак лёгких — выявили поздно', 'ХОБЛ', 'молниеносный инфаркт']],
      ['курил много лет и бросил, 70 лет, здоровье 35', 'de', { age: 70, health: 35, smoke: 45, quit: true }, ['рак лёгких — выявили поздно', 'ХОБЛ'], ['рак лёгких — выявили поздно', 'ХОБЛ']],
      ['пьёт сейчас, 50 лет, здоровье 45', 'de', { age: 50, health: 45, drink: 30 }, ['цирроз печени', 'молниеносный инфаркт', 'инсульт'], ['цирроз печени']],
      ['пьёт сейчас, 50 лет, здоровье 20 (просело глубоко)', 'de', { age: 50, health: 20, drink: 30 }, ['цирроз печени'], ['цирроз печени']],
      ['переутомление, 55 лет, здоровье 40', 'de', { age: 55, health: 40, fatigue: 95 }, ['сердечная недостаточность', 'инсульт'], ['сердечная недостаточность', 'инсульт']],
      // Инфаркт — только переутомление сейчас: усталость 85 — молниеносный инфаркт возможен; переутомление только в
      // «Истории» двухлетней давности, сейчас отдохнули (усталость 5), — без инфаркта.
      ['переутомление сейчас, 50 лет, здоровье 81 (просело неглубоко)', 'de', { age: 50, health: 81, fatigue: 85 }, ['сердечная недостаточность', 'инсульт', 'молниеносный инфаркт'], ['сердечная недостаточность', 'инсульт', 'молниеносный инфаркт']],
      ['переутомление два года назад, сейчас отдохнули, 50 лет, здоровье 81', 'de', { age: 50, health: 81, fatigue: 5, overworkLog: 6 }, ['сердечная недостаточность', 'инсульт'], ['сердечная недостаточность', 'инсульт']],
      ['недоедание, 50 лет, здоровье 40', 'de', { age: 50, health: 40, food: 6 }, ['туберкулёз — выявили поздно', 'сердечная недостаточность'], ['туберкулёз — выявили поздно']],
      ['болезнь три месяца назад, 65 лет, здоровье 40', 'de', { age: 65, health: 40, illnessAgo: 3 }, ['сердечная недостаточность', 'хроническая болезнь почек', 'рак кишечника — выявили поздно'], []],
      ['тяжёлая пневмония у курильщика, 70 лет', 'de', { age: 70, health: 40, smoke: 50, illness: PNEUMONIA }, ['пневмония на фоне рака лёгких', 'пневмония на фоне ХОБЛ'], ['пневмония на фоне ХОБЛ']],
      ['тяжёлая пневмония в 45 при обычном здоровье', 'de', { age: 45, health: 92, illness: PNEUMONIA }, ['пневмония'], ['пневмония']],
      // «На фоне …» — только болезнь от того, что подорвало здоровье; у травмы, мигрени, аллергии, курения до 40 её нет —
      // тяжёлая болезнь одна, без придуманной болезни почек или рака кишечника.
      ['тяжёлый перелом после велоаварии, 40 лет, здоровье 80', 'de', { age: 40, health: 80, injury: 'bikeCrash', illness: { name: 'Перелом', severity: 'тяжёлая', left: 3 } }, ['осложнения после перелома'], ['осложнения после перелома']],
      ['мигрень и тяжёлая пневмония, 45 лет, здоровье 70', 'de', { age: 45, health: 70, conditions: ['migraine'], illness: PNEUMONIA }, ['пневмония'], ['пневмония']],
      ['аллергия и тяжёлая пневмония, 50 лет, здоровье 60', 'de', { age: 50, health: 60, conditions: ['allergy'], illness: PNEUMONIA }, ['пневмония'], ['пневмония']],
      ['курит с юности, 30 лет, тяжёлая пневмония, здоровье 75', 'de', { age: 30, health: 75, smoke: 12, illness: PNEUMONIA }, ['пневмония'], ['пневмония']],
      ['пьёт, 26 лет, тяжёлая пневмония, здоровье 90', 'de', { age: 26, health: 90, drink: 8, illness: PNEUMONIA }, ['пневмония'], ['пневмония']],
      // Сильнее всего — мигрень (у неё «на фоне» нет), следом недоедание: на фоне — его болезнь, не придуманная.
      ['мигрень с частыми обострениями, недоедание и тяжёлая пневмония, 45 лет, здоровье 50', 'de', { age: 45, health: 50, conditions: ['migraine'], flares: 4, food: 3, illness: PNEUMONIA }, ['пневмония на фоне туберкулёза', 'пневмония на фоне сердечной недостаточности'], ['пневмония на фоне туберкулёза']],
      ['недоедание и тяжёлый перелом, 40 лет, здоровье 50', 'de', { age: 40, health: 50, food: 6, illness: { name: 'Перелом', severity: 'тяжёлая', left: 3 } }, ['осложнения после перелома на фоне туберкулёза', 'осложнения после перелома на фоне сердечной недостаточности'], ['осложнения после перелома на фоне туберкулёза']],
      ['перелом в 78 при обычном здоровье', 'de', { age: 78, health: 50, illness: { name: 'Перелом', severity: 'тяжёлая', left: 5, recovery23: 3, treated: false } }, ['осложнения после перелома'], ['осложнения после перелома']],
      ['обычное здоровье в 82', 'de', { age: 82, health: 40 }, ['старость'], ['старость']],
      ['курильщик в 88, здоровье 5', 'de', { age: 88, health: 5, smoke: 60 }, ['старость и рак лёгких', 'старость и ХОБЛ', 'старость и инфаркт', 'старость и инсульт'], []],
      ['обычное здоровье в 65', 'de', { age: 65, health: 74, travel: 'walk' }, ['инсульт', 'рак поджелудочной железы — выявили поздно', 'рак кишечника — выявили поздно', 'сердечная недостаточность', ROAD.walk, WATER, STAIRS], ['инсульт', STAIRS]]
    ];
    const { pg, ctx, errors } = await page(browser, { country: 'de' });
    for (const [name, country, o, allowed, must] of scen) {
      const r = await pg.evaluate(([o, src, country, st]) => { const prev = s.country; s.country = country; try { return eval('(' + src + ')')([o, st]); } finally { s.country = prev; } }, [o, causesFor.toString(), country, deathState.toString()]).catch(e => ({ error: String(e) }));
      const got = Object.keys(r);
      check(!r.error && got.length && got.every(c => allowed.includes(c)), 'причина по сценарию: ' + name + ' — только ' + allowed.join(' / '), r);
      check(must.every(c => got.includes(c)), 'причина по сценарию: ' + name + ' — выпадают ' + (must.join(' / ') || '(любые из допустимых)'), r);
    }
    // Инфаркт — только внезапная смерть при курении, выпивке или переутомлении сейчас; у остальных его нет.
    const calm = await pg.evaluate(([cf, src]) => { const f = eval('(' + cf + ')'), all = {}; for (const o of [{ age: 70, health: 35, smoke: 45, quit: true }, { age: 50, health: 20, drink: 30 }, { age: 40, health: 95 }, { age: 65, health: 74 }, { age: 62, health: 40, food: 6 }, { age: 50, health: 81, fatigue: 5, overworkLog: 6 }, { age: 48, health: 78, fatigue: 10, overworkLog: 12 }]) Object.assign(all, f([o, src])); return all; }, [causesFor.toString(), deathState.toString()]);
    check(!Object.keys(calm).some(c => /инфаркт/.test(c)), 'инфаркт не выпадает без курения, выпивки или переутомления сейчас', calm);
    // Грамматика всех сочетаний: возраст, здоровье, привычки, болезнь, усталость, недоедание, транспорт, страна.
    const sweep = await pg.evaluate(src => {
      const st = eval('(' + src + ')'), out = {}, rnd = Math.random;
      let a = 2758; const r = () => { a = (a * 1103515245 + 12345) >>> 0; return a / 4294967296; };
      const C = ['ru', 'de', 'in', 'no', 'jp', 'br', 'eg', 'us'];
      for (let i = 0; i < 600; i++) {
        const o = { age: 16 + Math.floor(r() * 84), health: Math.round(r() * 100), smoke: r() < .3 ? Math.round(r() * 60) : 0, drink: r() < .2 ? Math.round(r() * 40) : 0, quit: r() < .3, fatigue: r() < .2 ? 90 : 10, food: r() < .15 ? 6 : 0,
          illnessAgo: r() < .3 ? Math.floor(r() * 30) : null, illness: r() < .1 ? { name: r() < .5 ? 'Пневмония' : 'Перелом', severity: 'тяжёлая', left: 3 } : null, travel: ['walk', 'car', 'bike', 'share'][Math.floor(r() * 4)],
          injury: r() < .1 ? 'bikeCrash' : null, conditions: r() < .1 ? [['migraine', 'asthma', 'allergy', 'arthrosis'][Math.floor(r() * 4)]] : [], overworkLog: r() < .15 ? 6 : 0 };
        if (o.age < 18 && o.travel === 'car') o.travel = 'walk';
        const prev = s.country; s.country = C[i % C.length]; st(o); s.visualSeed33 = 'g' + i;
        try { const c = typeof deathCause2758 === 'function' ? deathCause2758() : ''; out[c] = (out[c] || 0) + 1; } finally { s.country = prev; }
      }
      Math.random = rnd;
      return out;
    }, deathState.toString());
    const all = Object.keys(sweep);
    const bad = all.filter(c => !c || /NaN|undefined|null|внезапная смерть|здоровье, подорванное|здоровье было в порядке|обычным для своих лет/.test(c) || repeated(c) || /\s{2}|^\s|\s$|[.]$/.test(c));
    check(all.length >= 15 && bad.length === 0, 'грамматика: ' + all.length + ' разных причин в 600 сочетаниях — без повторов слов, без «внезапная смерть», «здоровье, подорванное», пустых значений', bad.length ? bad : all);
    check(errors.length === 0, 'причина по сценарию: без ошибок страницы', errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  // ---------- 2. Подарок транспорта ----------
  {
    const { pg, ctx, errors } = await page(browser, { country: 'de' });
    const setup = () => {
      const z = transportState56(), father = s.people.find(p => p.role === 'Отец' && p.alive);
      father.inner.trust = 80; father.country = 'pl'; father.city18 = 'Варшава'; father.privateCash = 1e6; father.vehicleSeeded56 = true;
      for (const p of parents17()) if (p !== father) p.inner.trust = 10;
      const m = vehicleCatalog56.find(m => m.name === 'Honda Civic');
      // Машина куплена, когда семья жила в Канаде; отец потом переехал в Варшаву, машина осталась в Монреале.
      z.vehicles = z.vehicles.filter(v => v.owner !== father.id && v.id !== 'car-t');
      z.vehicles.push({ id: 'car-t', model: m.id, kind: 'car', owner: father.id, country: 'ca', city: 'Монреаль', area: 'suburb', priceCountry: 'ca', paidPrice: 9000, boughtCondition: 67, condition: 67, year: s.year - 14, acquired: s.clock.ticks, status: 'owned', history: [] });
      z.gifts = []; z.retry = {};
      s.age = 18; z.lastAge = 18;
      return father.id;
    };
    const card = id => {
      if ($('#modal').open) closeModal();
      openDecision24('vehicle56', id);
      const m = $('#modal'), acc = [...m.querySelectorAll('button')].find(b => /^Принять подарок/.test(b.textContent.trim()));
      const main = [...m.querySelectorAll('.main273 button')].filter(b => !b.hidden).map(b => ({ t: b.textContent.replace(/\s+/g, ' ').trim(), d: b.disabled, h: Math.round(b.getBoundingClientRect().height) }));
      return { open: m.open, text: m.innerText.replace(/\n+/g, ' | '), acc: acc ? { disabled: acc.disabled, text: acc.textContent.replace(/\s+/g, ' ').trim() } : null, main, sub: m.querySelector('.sub273')?.textContent || '' };
    };
    // Закрытое предложение: ничего не обещает (ни «Где», ни цены, ни «после передачи»), даритель — в прошедшем времени,
    // выход — «Понятно» во весь рост, а не только «×».
    const closedCard = (w, label) => {
      check(!/Где \||Цена \||бесплатн|после передачи|Получите/.test(w.text), label + ' — окно не обещает передачу (нет «Где», «Цена», «после передачи»)', w.text);
      check(/^Предлагал/.test(w.sub), label + ' — «Предлагал…» в прошедшем времени', w.sub);
      check(w.main.some(b => b.t === 'Понятно' && !b.d && b.h >= 40) && !w.main.some(b => /^Принять подарок/.test(b.t)), label + ' — кнопка «Понятно» не меньше 40 px вместо серых кнопок', w.main);
    };

    // а) Отец в Варшаве, машина в Монреале, вы в Германии.
    const a = await pg.evaluate(([setupSrc, cardSrc]) => {
      const setup = eval(setupSrc), card = eval(cardSrc); __still();
      const fid = setup(), q = __offerGift(living(fid));
      const entry = s.log.find(e => e.decision24?.id === q.id)?.text || '';
      const w = card(q.id);
      const btn = [...document.querySelectorAll('#modal button')].find(b => /^Принять подарок/.test(b.textContent.trim()));
      btn?.click();
      const v = vehicle56('car-t');
      return { status: q.status, w, entry, owner: v.owner, where: v.city, log0: s.log[0]?.title + ': ' + s.log[0]?.text, inList: decisionItems24().some(i => i.ref.id === q.id) };
    }, [setup.toString(), card.toString()]);
    check(!/в Варшава|находится в Варшава/.test(a.w.text) && /Монреаль/.test(a.w.text), 'подарок: в окне место машины (Монреаль), а не «в Варшава»', a.w.text);
    check(/перевез/i.test(a.w.text) && /останется/.test(a.w.text), 'подарок: машина в другой стране — сказано, что она останется там и сколько стоит перевезти', a.w.text);
    check(/Монреаль/.test(a.entry) && !/Варшава/.test(a.entry), 'подарок: запись в «Истории» — где машина на самом деле', a.entry);
    check(a.status === 'accepted' && a.owner === 'player' && !a.inList, 'подарок: «Принять подарок» работает — машина ваша, решение закрыто', a);
    check(/Монреаль/.test(a.log0), 'подарок: после принятия сказано, что машина в Монреале', a.log0);

    // б) Машина с непогашенным кредитом.
    const b = await pg.evaluate(([setupSrc, cardSrc]) => {
      const setup = eval(setupSrc), card = eval(cardSrc); __still();
      const fid = setup(), q = __offerGift(living(fid));
      // Кредит появляется у машины после предложения (как у машины, доставшейся по наследству вместе с кредитом).
      const d = { id: 'loan-t', type: 'bank', country: 'ca', balance: 3000, principal: 3000, rate: .1, payment: 100, term: 36, paid: 0, missed: 0, started: s.clock.ticks };
      s.debts.push(d); vehicle56('car-t').loan = d.id;
      const w = card(q?.id);
      const btn = [...document.querySelectorAll('#modal button')].find(b => /^Принять подарок/.test(b.textContent.trim()));
      if (btn && !btn.disabled) btn.click();
      const after = { status: q?.status, owner: vehicle56('car-t').owner, open: $('#modal').open, toast: document.querySelector('.toast')?.textContent || '' };
      // Даритель сам не предлагает машину с кредитом.
      if ($('#modal').open) closeModal();
      transportState56().gifts = []; transportState56().retry = {};
      const again = __offerGift(living(fid));
      return { w, after, again: again ? again.vehicle : null };
    }, [setup.toString(), card.toString()]);
    const silent = b.w.acc && !b.w.acc.disabled && b.after.status === 'offered' && b.after.owner !== 'player';
    check(!silent, 'подарок с кредитом: «Принять подарок» не нажимается молча без результата', b);
    check(b.w.acc && b.w.acc.disabled && /кредит/.test(b.w.acc.text), 'подарок с кредитом: «Принять подарок» серая, причина — кредит', b.w);
    check(b.again !== 'car-t', 'подарок с кредитом: даритель сам такую машину не предлагает', b.again);

    // в) Даритель переехал в другую страну после предложения: принять нельзя — предложение закрывается.
    const c = await pg.evaluate(([setupSrc, cardSrc]) => {
      const setup = eval(setupSrc), card = eval(cardSrc); __still();
      s.debts = s.debts.filter(d => d.id !== 'loan-t');
      const fid = setup(), q = __offerGift(living(fid));
      living(fid).country = 'it'; living(fid).city18 = 'Рим';
      const inList = decisionItems24().some(i => i.ref.id === q.id);
      const w = card(q.id);
      const btn = [...document.querySelectorAll('#modal button')].find(b => /^Принять подарок/.test(b.textContent.trim()));
      if (btn && !btn.disabled) btn.click();
      if ($('#modal').open) closeModal();
      s.clock.ticks++; transportMonth56();
      return { inList, w, status: q.status, owner: vehicle56('car-t').owner, inListAfter: decisionItems24().some(i => i.ref.id === q.id) };
    }, [setup.toString(), card.toString()]);
    check(!c.inList && !c.inListAfter, 'подарок: даритель переехал — предложение пропадает из «Ожидают ответа»', c);
    check(c.owner !== 'player' && (!c.w.acc || c.w.acc.disabled) && /переехал/.test(c.w.text), 'подарок: даритель переехал — окно говорит почему, кнопка не обещает подарок', c.w);
    closedCard(c.w, 'подарок: даритель переехал');

    // в2) Машины уже нет (продана или передана): «Где» не берётся из города дарителя на момент предложения.
    const c2 = await pg.evaluate(([setupSrc, cardSrc]) => {
      const setup = eval(setupSrc), card = eval(cardSrc); __still();
      const fid = setup(), q = __offerGift(living(fid)), z = transportState56();
      z.vehicles = z.vehicles.filter(v => v.id !== 'car-t');
      const w = card(q.id);
      if ($('#modal').open) closeModal();
      return { w, status: q.status };
    }, [setup.toString(), card.toString()]);
    check(/продан или передан/.test(c2.w.text) && !/Варшава/.test(c2.w.text), 'подарок: машины уже нет — не «Где · Варшава» (город дарителя)', c2.w.text);
    closedCard(c2.w, 'подарок: машины уже нет');

    // г) Отказ и д) истёкший срок: на следующие дни рождения та же машина не возвращается — и вместо неё не приходит
    // новый велосипед от того же дарителя. Велосипед на день рождения (его ещё покупают, vehicle нет), от которого
    // отказались или на который не ответили, тоже не возвращается. Спросить в «Транспорте» по-прежнему можно.
    for (const [what, mode] of [['машина', 'отказ'], ['машина', 'срок'], ['велосипед', 'отказ'], ['велосипед', 'срок']]) {
      const r = await pg.evaluate(([setupSrc, what, mode]) => {
        const setup = eval(setupSrc); __still();
        const fid = setup(), z = transportState56(), rnd = Math.random;
        if (what === 'велосипед') z.vehicles = z.vehicles.filter(v => v.id !== 'car-t');
        s.age = 30; z.lastAge = 30;
        let q; Math.random = () => .1; try { q = offerVehicleGift56(living(fid), what === 'велосипед'); } finally { Math.random = rnd; }
        const first = q ? { vehicle: q.vehicle, model: q.model, status: q.status } : null;
        if (!q) return { first };
        if (mode === 'отказ') respondVehicleGift56(q.id, false);
        else { s.clock.ticks += 4; transportMonth56(); }
        const closed = { status: q.status, inList: decisionItems24().some(i => i.ref.id === q.id) };
        const offers = [];
        try {
          for (let y = 0; y < 8; y++) {
            s.age++; s.clock.ticks += 12; Math.random = () => .1; transportMonth56(); Math.random = rnd;
            for (const g of z.gifts.filter(g => g.status === 'offered')) { offers.push({ age: s.age, vehicle: g.vehicle, model: g.model }); respondVehicleGift56(g.id, false); }
          }
        } finally { Math.random = rnd; }
        let ask = null;
        if (what === 'машина') { z.retry = {}; const a = __offerGift(living(fid)); ask = a ? { vehicle: a.vehicle, status: a.status } : null; if (a?.status === 'offered') respondVehicleGift56(a.id, false); }
        return { first, closed, offers, ask };
      }, [setup.toString(), what, mode]);
      const label = 'подарок: ' + what + ', ' + mode;
      check(r.first && r.first.status === 'offered' && (what === 'машина' ? r.first.vehicle === 'car-t' : !r.first.vehicle), label + ' — первое предложение на день рождения', r.first);
      if (!r.closed) continue;
      check(r.closed.status !== 'offered' && !r.closed.inList, label + ' — предложение закрыто', r.closed);
      check(!r.offers.some(o => o.vehicle === 'car-t'), label + ' — та же машина на дни рождения больше не предлагается', r.offers);
      check(r.offers.length === 0, label + ' — на дни рождения ничего не возвращается, и велосипед вместо машины тоже', r.offers);
      if (what === 'машина') check(r.ask && r.ask.vehicle === 'car-t' && r.ask.status === 'offered', label + ' — спросить в «Транспорте» по-прежнему можно', r.ask);
    }
    // Тот же даритель, другой транспорт, о котором речи не было: на день рождения предлагается.
    const fresh = await pg.evaluate(setupSrc => {
      const setup = eval(setupSrc); __still();
      const fid = setup(), z = transportState56(), rnd = Math.random;
      z.vehicles = z.vehicles.filter(v => v.id !== 'car-t');
      s.age = 30; z.lastAge = 30;
      let q; Math.random = () => .1; try { q = offerVehicleGift56(living(fid), true); } finally { Math.random = rnd; }
      respondVehicleGift56(q.id, false);
      const m = vehicleCatalog56.find(m => m.name === 'Honda Civic');
      z.vehicles.push({ id: 'car-n', model: m.id, kind: 'car', owner: fid, country: 'pl', city: 'Варшава', area: 'suburb', priceCountry: 'pl', paidPrice: 9000, boughtCondition: 80, condition: 80, year: s.year - 3, acquired: s.clock.ticks, status: 'owned', history: [] });
      s.clock.ticks += 30; s.age++;
      let n; Math.random = () => .1; try { n = offerVehicleGift56(null, true); } finally { Math.random = rnd; }
      if (n?.status === 'offered') respondVehicleGift56(n.id, false);
      z.vehicles = z.vehicles.filter(v => v.id !== 'car-n');
      return n ? n.vehicle : null;
    }, setup.toString());
    check(fresh === 'car-n', 'подарок: после отказа от велосипеда новая машина того же дарителя на день рождения предлагается', fresh);

    // Велосипед ко дню рождения — не конвейер (решение владелицы 26.11). 20 дней рождения подряд, каждый раз выпадает
    // предложение (Math.random = 0,1), у дарителя денег сколько угодно и нет своего транспорта: а) вы принимаете
    // велосипед и продаёте его, как владелица; б) вы отказываетесь. Предложений не больше двух и не чаще раза в 6 лет.
    for (const mode of ['принять и продать', 'отказаться', 'не отвечать']) {
      const r = await pg.evaluate(([setupSrc, mode]) => {
        const setup = eval(setupSrc); __still();
        const fid = setup(), z = transportState56(), rnd = Math.random;
        z.vehicles = z.vehicles.filter(v => v.id !== 'car-t' && v.owner !== 'player');
        s.age = mode === 'принять и продать' ? 18 : 12; z.lastAge = s.age; s.cash = 1e6;
        const offers = [];
        try {
          for (let y = 0; y < 20; y++) {
            s.age++; s.clock.ticks += 12; Math.random = () => .1; transportMonth56(); Math.random = rnd;
            for (const g of z.gifts.filter(g => g.status === 'offered')) {
              offers.push({ age: s.age, model: g.model, vehicle: g.vehicle, from: g.parent });
              if (mode === 'принять и продать') { respondVehicleGift56(g.id, true); const v = vehicle56(g.received); if (v) sellVehicle56(v.id); }
              else if (mode === 'отказаться') respondVehicleGift56(g.id, false);
              else { s.clock.ticks += 4; transportMonth56(); }
            }
          }
        } finally { Math.random = rnd; }
        return { offers, owned: ownedVehicles56().map(v => v.model) };
      }, [setup.toString(), mode]);
      const bikes = r.offers.filter(o => /bike/.test(o.model));
      const gaps = bikes.slice(1).map((o, i) => o.age - bikes[i].age);
      check(bikes.length >= 1 && bikes.length <= 2, 'велосипед на день рождения, ' + mode + ' — за 20 дней рождения 1–2 предложения, а не каждые два года', r.offers);
      check(gaps.every(g => g >= 6), 'велосипед на день рождения, ' + mode + ' — не чаще раза в 6 лет', r.offers);
    }
    // Свой велосипед (даже старый, 15/100) — велосипед на день рождения не дарят, ни новый, ни дарителя.
    const ownBike = await pg.evaluate(setupSrc => {
      const setup = eval(setupSrc); __still();
      const fid = setup(), z = transportState56(), rnd = Math.random, m = vehicleModel56('bike56-city');
      z.vehicles = z.vehicles.filter(v => v.id !== 'car-t' && v.owner !== 'player');
      z.vehicles.push({ id: 'bike-mine', model: m.id, kind: 'bike', owner: 'player', country: s.country, city: residenceCity(), area: 'suburb', priceCountry: s.country, paidPrice: 100, boughtCondition: 60, condition: 15, year: s.year - 9, acquired: s.clock.ticks, status: 'owned', history: [], lastPay: s.clock.ticks });
      z.vehicles.push({ id: 'bike-dad', model: m.id, kind: 'bike', owner: fid, country: 'pl', city: 'Варшава', area: 'suburb', priceCountry: 'pl', paidPrice: 100, boughtCondition: 90, condition: 80, year: s.year - 2, acquired: s.clock.ticks, status: 'owned', history: [] });
      s.age = 14; z.lastAge = 14; const offers = [];
      try { for (let y = 0; y < 6; y++) { s.age++; s.clock.ticks += 12; Math.random = () => .1; transportMonth56(); Math.random = rnd; for (const g of z.gifts.filter(g => g.status === 'offered')) { offers.push({ age: s.age, model: g.model, vehicle: g.vehicle }); respondVehicleGift56(g.id, false); } } }
      finally { Math.random = rnd; }
      z.vehicles = z.vehicles.filter(v => !/^bike-(mine|dad)$/.test(v.id));
      return offers;
    }, setup.toString());
    check(!ownBike.some(o => /bike/.test(o.model)), 'велосипед на день рождения: пока у вас есть свой велосипед — не дарят (ни новый, ни велосипед дарителя)', ownBike);
    check(errors.length === 0, 'подарок: без ошибок страницы', errors.slice(0, 3).join(' | '));
    await ctx.close();

    // Телефон 360×740: с «Не хватает» (кредит, пять единиц транспорта) главные кнопки не прилипают к низу (правило 273),
    // поэтому рисунок машины не стоит над строками — иначе «Отказаться» уходит за край экрана. Без «Не хватает» рисунок
    // под заголовком.
    const narrow = await page(browser, { country: 'de', width: 360, height: 740 });
    const fit = await narrow.pg.evaluate(setupSrc => {
      const setup = eval(setupSrc); __still();
      const out = {};
      for (const kind of ['кредит', 'пять единиц транспорта', 'без препятствий']) {
        const fid = setup(), q = __offerGift(living(fid)), z = transportState56();
        const extra = [];
        if (kind === 'кредит') { const d = { id: 'loan-n', type: 'bank', country: 'ca', balance: 3000, principal: 3000, rate: .1, payment: 100, term: 36, paid: 0, missed: 0, started: s.clock.ticks }; s.debts.push(d); vehicle56('car-t').loan = d.id; }
        if (kind === 'пять единиц транспорта') for (let i = 0; i < 5; i++) { const id = 'five-' + i; extra.push(id); z.vehicles.push({ id, model: 'bike56-city', kind: 'bike', owner: 'player', country: s.country, city: residenceCity(), area: 'suburb', priceCountry: s.country, paidPrice: 100, boughtCondition: 90, condition: 90, year: s.year, acquired: s.clock.ticks, status: 'owned', history: [], lastPay: s.clock.ticks }); }
        if ($('#modal').open) closeModal();
        openDecision24('vehicle56', q.id);
        const m = $('#modal'), box = m.getBoundingClientRect(), fig = m.querySelector('.vehicle-figure74');
        const main = [...m.querySelectorAll('.main273 button')].filter(b => !b.hidden).map(b => { const r = b.getBoundingClientRect(); return { t: b.textContent.replace(/\s+/g, ' ').trim().slice(0, 40), top: Math.round(r.top), bottom: Math.round(r.bottom) }; });
        out[kind] = { main, modalBottom: Math.round(Math.min(box.bottom, innerHeight)), need: !!m.querySelector('.need273, [class*="need"]') && /Не хватает/.test(m.innerText), fig: fig ? (fig.closest('.more273') ? 'Подробнее' : fig.closest('.sub273') ? 'под заголовком' : 'другое место') : 'нет' };
        closeModal();
        s.debts = s.debts.filter(d => d.id !== 'loan-n'); z.vehicles = z.vehicles.filter(v => !extra.includes(v.id));
      }
      return out;
    }, setup.toString());
    for (const kind of ['кредит', 'пять единиц транспорта']) {
      const r = fit[kind];
      check(r.main.length >= 2 && r.main.every(b => b.bottom <= r.modalBottom), 'подарок на телефоне 360×740, ' + kind + ' — главные кнопки на первом экране, «Отказаться» не за краем', r);
      check(r.fig !== 'под заголовком', 'подарок на телефоне 360×740, ' + kind + ' — рисунок не над строками', r);
    }
    check(fit['без препятствий'].fig === 'под заголовком' && fit['без препятствий'].main.every(b => b.bottom <= fit['без препятствий'].modalBottom), 'подарок на телефоне 360×740 без препятствий — рисунок под заголовком, кнопки видны', fit['без препятствий']);
    check(narrow.errors.length === 0, 'подарок на телефоне: без ошибок страницы', narrow.errors.slice(0, 3).join(' | '));
    await narrow.ctx.close();
  }

  // ---------- 3. Площадь комнаты ----------
  {
    const { pg, ctx, errors } = await page(browser, { country: 'ru' });
    const r = await pg.evaluate(() => {
      __still();
      // Комната без объявления (переезд, «Снять комнату»): жильё для показа рисует stableHome59.
      Object.assign(s.housing, { mode: 'rent', room40: true, city: residenceCity(), area: 'center' });
      delete s.housing.listing41; delete s.housing.display59;
      const cost = homeCost();
      const q = currentHome59().listing, first = { kind: q.kind, area: q.areaM2, rooms: q.rooms, hostArea: q.hostArea, hostRooms: q.hostRooms, rent: q.rent };
      render();
      const panel = document.querySelector('.home-panel59 strong')?.textContent || '';
      currentHomeMenu59();
      const menu = $('#modal').innerText.replace(/\n+/g, ' | ');
      closeModal();
      const again = currentHome59().listing.areaM2;
      // Старое сохранение: жильё для показа уже записано с площадью квартиры.
      const key = s.housing.display59.key;
      s.housing.display59 = { key, listing: { ...s.housing.display59.listing, areaM2: 143, rooms: 4, bedrooms: 3, hostArea: 143, hostRooms: 4, hostBedrooms: 3 } };
      const oldRent = s.housing.display59.listing.rent;
      const fixed = currentHome59().listing;
      return { first, panel, menu, again, cost, costAfter: homeCost(), old: { area: fixed.areaM2, rooms: fixed.rooms, hostArea: fixed.hostArea, rent: fixed.rent, oldRent } };
    });
    check(r.first.kind === 'room' && r.first.area >= 9 && r.first.area <= 25 && r.first.rooms === 1, 'комната: площадь 9–25 м², одна комната', r.first);
    check(r.first.hostArea > r.first.area && r.first.hostRooms >= 2, 'комната: квартира целиком — отдельно', r.first);
    check(new RegExp('Комната · 1 комн\\. · ' + r.first.area + ' м²').test(r.panel), 'комната: панель «Дом» — площадь комнаты', r.panel);
    check(new RegExp('Площадь \\| ' + r.first.area + ' м²').test(r.menu) && new RegExp('Жильё целиком \\| ' + r.first.hostRooms + ' комн\\. · ' + r.first.hostArea + ' м²').test(r.menu), 'комната: окно «Дом» — площадь комнаты и квартира целиком', r.menu);
    check(r.again === r.first.area, 'комната: площадь не меняется между показами', r);
    check(r.old.area >= 9 && r.old.area <= 25 && r.old.rooms === 1 && r.old.hostArea === 143, 'комната: старое сохранённое жильё для показа поправлено', r.old);
    check(r.old.rent === r.old.oldRent && r.cost === r.costAfter, 'комната: аренда и расходы на жильё не меняются', r);
    // Общежитие: площадь своя (место в двухместной комнате 10 м², отдельная комната 14 м²) — показ её не меняет.
    const dorm = await pg.evaluate(() => {
      const out = {};
      for (const kind of ['shared', 'single']) {
        const p = { id: 'prog-t-' + kind, country: s.country, city: residenceCity(), level: 'bachelor' };
        const q = dormListing68(p, kind), fresh = q.areaM2;
        Object.assign(s.housing, { mode: 'rent', room40: true, city: residenceCity(), area: 'suburb', listing41: q });
        delete s.housing.display59;
        const shown = currentHome59().listing.areaM2;
        render();
        out[kind] = { fresh, shown, stored: s.housing.listing41.areaM2, panel: document.querySelector('.home-panel59 strong')?.textContent || '' };
      }
      delete s.housing.listing41;
      return out;
    });
    check(dorm.shared.fresh === 10 && dorm.shared.shown === 10 && dorm.shared.stored === 10 && /10 м²/.test(dorm.shared.panel), 'общежитие: место в двухместной комнате — 10 м², показ не меняет', dorm.shared);
    check(dorm.single.fresh === 14 && dorm.single.shown === 14 && dorm.single.stored === 14 && /14 м²/.test(dorm.single.panel), 'общежитие: отдельная комната — 14 м², показ не меняет', dorm.single);
    // Квартира, где сдают комнату: не однушка — не меньше трёх комнат и двух спален (как makeHouse41), по всем странам.
    const host = await pg.evaluate(() => {
      const bad = [];
      let n = 0;
      for (const c of Object.keys(countries)) for (const city of (cities[c] || []).slice(0, 3)) for (const area of ['center', 'suburb']) for (let i = 0; i < 12; i++) {
        const q = stableHome59(c, city, area, 'host2758:' + i, 'room');
        if (!q) continue; n++;
        if (!(q.hostRooms >= 3 && q.hostBedrooms >= 2 && q.areaM2 >= 9 && q.areaM2 <= 25 && q.areaM2 < q.hostArea && q.rooms === 1)) bad.push({ c, city, area, i, area2: q.areaM2, hostArea: q.hostArea, hostRooms: q.hostRooms, hostBedrooms: q.hostBedrooms });
      }
      return { n, bad: bad.slice(0, 5), nBad: bad.length };
    });
    check(host.n > 1000 && host.nBad === 0, 'комната: квартира целиком не меньше трёх комнат и двух спален, комната 9–25 м² (' + host.n + ' жилищ по 25 странам)', host);
    check(errors.length === 0, 'комната: без ошибок страницы', errors.slice(0, 3).join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})();
