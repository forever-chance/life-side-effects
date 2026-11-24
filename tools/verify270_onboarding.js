// Сборка 270, onboarding270.js: стартовое окно («На собственный риск», «У этой истории появилось имя») после
// перезагрузки страницы открывается само, «▶ Продолжить» до ответа открывает его, ответ запускает обучение как раньше,
// рождение с 0 и с 18 лет не меняется. Всё — настоящими нажатиями.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify270_onboarding.js
// Если onboarding270.js ещё нет в index.html, части 1–3 подгружают его через addScriptTag после файлов 270
// (после каждой перезагрузки заново), а часть 4 раздаёт index.html, в который он вписан перед bootstrap61.js,
// как его подключит сборка (на диске index.html не меняется).
// BASE=1 — прогон без onboarding270.js (файл отдаётся пустым, даже если он уже есть в index.html): видно, какие
// проверки ловят старое поведение.
// Часть 5 работает, когда onboarding270.js уже вписан в index.html: проверяет, что strip270.js и verify270_strip.js
// больше не ждут, что окно после перезагрузки само не возвращается.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1';
const FILE = 'onboarding270.js';
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const IN_INDEX = INDEX.includes('src="' + FILE);
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1280, height: 900 };
const results = [];
const check = (name, ok, extra) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok || extra === undefined ? '' : ' — ' + JSON.stringify(extra))); };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const PLAYING = "typeof s!=='undefined'&&s&&s.clock&&document.getElementById('app').classList.contains('playing')";

// fix: подключать ли onboarding270.js; inject: вписать его в index.html перед bootstrap61.js (часть 4).
async function context(browser, viewport, { fix = !BASE, inject = false } = {}) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' || (rel === FILE && !fix) ? '' : fs.readFileSync(f);
    if (rel === 'index.html' && fix && inject && !IN_INDEX)
      body = String(body).replace('<script src="bootstrap61.js', '<script src="' + FILE + '?v=270"></script><script src="bootstrap61.js');
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  return { ctx, pg, errors, fix, inject };
}
// После открытия и каждой перезагрузки: файл, которого нет в index.html, — через addScriptTag после файлов 270.
async function attach(t) {
  if (!t.fix || t.inject || IN_INDEX) return;
  if (await t.pg.evaluate(() => typeof reopenStartup270 === 'function')) return;
  await t.pg.addScriptTag({ path: path.join(ROOT, FILE) });
}
async function open(t) {
  await t.pg.goto('http://game.local/index.html');
  await t.pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  await attach(t);
}
async function birth(t, age, country = 'nl') {
  await t.pg.selectOption('#startAge', String(age));
  await t.pg.selectOption('#country', country);
  await t.pg.click('text=Родиться');
  await t.pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
}
async function reload(t) {
  await t.pg.evaluate(() => { if (typeof flushSave264 === 'function') flushSave264(); });
  await t.pg.reload();
  await t.pg.waitForFunction(PLAYING);
  await attach(t);
}

// Снимок экрана и состояния — в странице.
function state() {
  const d = $('#modal'), n = typeof startupNotice180 === 'function' ? startupNotice180() : null;
  return {
    modal: d.open, title: d.open ? d.querySelector('h2')?.textContent || '' : '',
    h2: d.open ? d.querySelectorAll('h2').length : 0, art: d.open ? d.querySelectorAll('.milestone-art178').length : 0,
    labels: d.open ? [...d.querySelectorAll('.options>button')].map(b => b.textContent) : [],
    close: d.open ? d.querySelector('button.close')?.getAttribute('aria-label') || '' : '',
    frames: typeof modalFrames38 !== 'undefined' ? modalFrames38.length : -1,
    notice: !!n, noticeTitle: n?.title || '', startAge: s.onboarding180?.startAge,
    tut: tutorialActive180(), status: s.onboarding180?.status, step: s.onboarding180?.step, tutEl: !!document.querySelector('#tutorial180'),
    running: !!s.clock.running, choiceActive: !!s.clock.choiceActive, resume: !!s.clock.resumeAfterChoice, ticks: s.clock.ticks,
    obClock: JSON.stringify(s.onboarding180?.clock || null), pending: s.pending.length,
    strip: !!document.querySelector('#app>.top-strip270'), panel: s.ui05?.panel, tab,
    milestones: life61().notices.filter(x => x.type === 'milestone166' && x.milestoneAge === s.onboarding180?.startAge).length,
    hidePopups: !!s.hideMilestonePopups180, id: s.saveId, name: s.name + ' ' + s.surname,
    button: document.querySelector('.clock-controls .primary')?.textContent || ''
  };
}
// Окно открыто ровно одно и это стартовое окно.
const oneNotice = (st, title) => st.modal && st.notice && st.title === title && st.noticeTitle === title && st.h2 === 1 && st.art === 1 &&
  same(st.labels, ['Понятно', 'Пропускать в будущем']) && st.frames === 0 && st.close === 'Закрыть' && st.milestones === 1 && !st.tut && st.status === 'new';
const tutorialStarted = st => !st.modal && !st.notice && st.tut && st.status === 'active' && st.step === 0 && st.tutEl && !st.running && st.tab === 'story';
// Для сравнения рождений: всё, кроме имени, id, даты.
const birthView = st => { const { id, name, ticks, ...rest } = st; return rest; };
// «Понятно» настоящим нажатием. Без файла (BASE=1) окна после перезагрузки нет: открываем его так же, как строка
// «Ожидают ответа» в полосе (openDecision24), чтобы прогон дошёл до конца.
async function understood(pg) {
  await pg.evaluate(() => { const n = startupNotice180(); if (n && !$('#modal').open) openDecision24('life61', n.id); });
  await pg.click('#modal .options button:has-text("Понятно")');
}
async function clickNext(pg, state) {
  const steps = [];
  for (let i = 0; i < 20; i++) {
    const t = await pg.evaluate(state);
    if (!t.tut) break;
    steps.push(t.step);
    const last = await pg.evaluate(() => onboarding180().step === tutorialSteps180.length - 1);
    await pg.click('#tutorial180 .tutorial-buttons180 button:has-text("' + (last ? 'Начать жизнь' : 'Далее') + '")');
  }
  return steps;
}

(async () => {
  const browser = await chromium.launch();
  console.log((BASE ? 'BASE=1: без ' + FILE : 'с ' + FILE) + (IN_INDEX ? ' (уже в index.html)' : ' (не в index.html: addScriptTag, в части 4 — вписан перед bootstrap61.js)'));

  // 1. Телефон, рождение в 18, «Действия», перезагрузки, «▶ Продолжить», «Понятно», обучение.
  {
    const t = await context(browser, PHONE), pg = t.pg;
    await open(t);
    await birth(t, 18);
    const b = await pg.evaluate(state);
    const TITLE = 'На собственный риск';
    check('1. рождение в 18: стартовое окно открыто, одно, полосы под ним нет', oneNotice(b, TITLE) && !b.strip, b);
    // Игрок был на «Действиях», где полоса показывает только последнее событие.
    await pg.evaluate(() => { s.ui05.panel = 'right'; save(); });
    await reload(t);
    let r = await pg.evaluate(state);
    check('1. перезагрузка до ответа: окно открылось само, одно, полосы под ним нет', oneNotice(r, TITLE) && !r.strip && r.id === b.id, r);
    check('1. перезагрузка: панель «Действия» сохранена, часы стоят', r.panel === 'right' && !r.running && r.ticks === b.ticks, r);
    await reload(t);
    r = await pg.evaluate(state);
    check('1. ещё одна перезагрузка с открытым окном: по-прежнему ровно одно окно', oneNotice(r, TITLE) && !r.strip, r);
    // Окно закрыто без ответа (как было до 270 после перезагрузки) — «▶ Продолжить» открывает его, время не идёт.
    await pg.evaluate(() => { if ($('#modal').open) HTMLDialogElement.prototype.close.call($('#modal')); render(); });
    const c0 = await pg.evaluate(state);
    await pg.click('.clock-controls .primary');
    await pg.waitForTimeout(700);
    const c1 = await pg.evaluate(state);
    check('1. окно закрыто без ответа: на «Действиях» «▶ Продолжить»', !c0.modal && c0.notice && /Продолжить/.test(c0.button) && c0.panel === 'right', c0);
    check('1. «▶ Продолжить» до ответа открывает стартовое окно, время стоит', oneNotice(c1, TITLE) && !c1.strip && !c1.running && c1.ticks === c0.ticks, c1);
    await understood(pg);
    const a = await pg.evaluate(state);
    check('1. «Понятно»: окно прочитано, обучение с первого шага', tutorialStarted(a) && !a.hidePopups, a);
    // Перезагрузка посреди обучения: окна нет, обучение на месте, «▶ Продолжить» молчит, как раньше.
    await reload(t);
    r = await pg.evaluate(state);
    check('1. перезагрузка после ответа: окна нет, обучение на месте', !r.modal && !r.notice && r.tut && r.status === 'active' && r.tutEl, r);
    const steps = await clickNext(pg, state);
    const total = await pg.evaluate(() => tutorialSteps180.length);
    const f = await pg.evaluate(state);
    check('1. обучение проходится до конца (' + total + ' шагов)', steps.length === total && steps.every((x, i) => x === i) && !f.tut && f.status === 'finished' && !f.modal, { steps, f });
    await reload(t);
    r = await pg.evaluate(state);
    check('1. перезагрузка после обучения: окна нет', !r.modal && !r.notice && !r.tut && r.status === 'finished', r);
    await pg.click('.clock-controls .primary');
    await pg.waitForTimeout(300);
    const g = await pg.evaluate(state);
    check('1. после обучения «▶ Продолжить» работает как обычно', (g.running || g.modal && g.title !== TITLE) && !g.notice, g);
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); if (s.clock.running) toggleClock(); });
    check('1. без ошибок страницы', !t.errors.length, t.errors);
    await t.ctx.close();
  }

  // 2. Широкий экран: жизнь A с непрочитанным окном, новая жизнь B, загрузка A из «Персонажей».
  {
    const t = await context(browser, WIDE), pg = t.pg;
    await open(t);
    await birth(t, 18, 'jp');
    const A = await pg.evaluate(state);
    // Как будто окно A осталось без ответа в прошлый раз, а потом игрок начал новую жизнь.
    await pg.evaluate(() => { flushSave264(); HTMLDialogElement.prototype.close.call($('#modal')); save(); s = null; intro(); });
    await birth(t, 18, 'de');
    const B = await pg.evaluate(state);
    await pg.click('#modal .options button:has-text("Понятно")');
    await pg.click('#tutorial180 button:has-text("Пропустить обучение")');
    await pg.click('button[onclick="openLives()"]');
    await pg.click('#modal .life-open21:has-text("' + A.name + '")');
    const L = await pg.evaluate(state);
    check('2. «Персонажи»: загрузка жизни с непрочитанным окном открывает его, одно', L.id === A.id && L.id !== B.id && oneNotice(L, 'На собственный риск') && !L.strip, L);
    await pg.click('#modal .options button:has-text("Понятно")');
    const La = await pg.evaluate(state);
    check('2. «Персонажи»: «Понятно» запускает обучение', tutorialStarted(La), La);
    check('2. без ошибок страницы', !t.errors.length, t.errors);
    await t.ctx.close();
  }

  // 3. Рождение с 0 и с 18 лет: с файлом и без него — одинаково (окно, кнопки, часы, полоса; после «Понятно» — обучение).
  for (const age of [0, 18]) {
    const views = [];
    for (const fix of [!BASE, false]) {
      const t = await context(browser, PHONE, { fix }), pg = t.pg;
      await open(t);
      await birth(t, age);
      const b = await pg.evaluate(state);
      await pg.click('#modal .options button:has-text("Понятно")');
      const a = await pg.evaluate(state);
      views.push({ b: birthView(b), a: birthView(a), errors: t.errors.slice() });
      await t.ctx.close();
    }
    const [mine, old] = views;
    const title = age ? 'На собственный риск' : 'У этой истории появилось имя';
    check('3. рождение с ' + age + ': стартовое окно и обучение', oneNotice(mine.b, title) && !mine.b.strip && tutorialStarted(mine.a), mine);
    check('3. рождение с ' + age + ': так же, как без ' + FILE, same(mine, old), { mine, old });
    check('3. рождение с ' + age + ': без ошибок страницы', !mine.errors.length && !old.errors.length, [mine.errors, old.errors]);
  }

  // 4. Итоговый порядок: onboarding270.js из index.html перед bootstrap61.js; перезагрузка с 18 и с 0.
  for (const age of [18, 0]) {
    const t = await context(browser, PHONE, { inject: true }), pg = t.pg;
    await open(t);
    const loaded = await pg.evaluate(f => typeof reopenStartup270 === 'function' && [...document.scripts].some(x => (x.getAttribute('src') || '').split('?')[0] === f), FILE);
    if (age === 18) check('4. итоговый порядок: ' + FILE + ' подключён из index.html', loaded, loaded);
    await birth(t, age, 'br');
    const b = await pg.evaluate(state);
    const title = age ? 'На собственный риск' : 'У этой истории появилось имя';
    await pg.evaluate(() => { s.ui05.panel = 'right'; save(); });
    await reload(t);
    const r = await pg.evaluate(state);
    check('4. итоговый порядок, рождение с ' + age + ': после перезагрузки окно открылось само, одно', oneNotice(b, title) && oneNotice(r, title) && !r.strip && r.id === b.id, r);
    await understood(pg);
    const a = await pg.evaluate(state);
    check('4. итоговый порядок, рождение с ' + age + ': «Понятно» запускает обучение', tutorialStarted(a), a);
    check('4. итоговый порядок, рождение с ' + age + ': без ошибок страницы', !t.errors.length, t.errors);
    await t.ctx.close();
  }

  // 5. Соседи по сборке. Когда onboarding270.js уже в index.html, strip270.js и verify270_strip.js не должны ждать
  // старого поведения «после перезагрузки окно само не возвращается»: иначе verify270_strip.js падает на нажатии
  // под открытым окном. Заодно — что ни одна проверка в verify270_strip.js не повторена (правка его части 3).
  if (!IN_INDEX) console.log('5. соседи по сборке: ' + FILE + ' ещё не в index.html — проверки пропущены');
  else {
    const src = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
    const strip = src('strip270.js'), test = src('tools/verify270_strip.js');
    check('5. strip270.js: в комментарии нет «окно само не возвращается», есть ' + FILE, !/окно само не возвращается/.test(strip) && strip.includes(FILE));
    check('5. verify270_strip.js: после перезагрузки не ждёт закрытого стартового окна', !/само окно не возвращается|окна нет, полоса ведёт к нему/.test(test));
    const names = [...test.matchAll(/check\('((?:[^'\\]|\\.)*)',/g)].map(m => m[1]);
    const dup = names.filter((x, i) => names.indexOf(x) !== i);
    check('5. verify270_strip.js: ни одна проверка не повторена (' + names.length + ')', names.length > 20 && !dup.length, dup);
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} проверок прошли` + (bad.length ? '; не прошли: ' + bad.map(r => r.name).join('; ') : ''));
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
