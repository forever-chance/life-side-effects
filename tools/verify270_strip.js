// Сборка 270, strip270.js: верхняя полоса на телефоне и на широком экране, остановка часов на «Персонаже»
// и «Личном деле». Игра раздаётся с диска, сервер не нужен:  node tools/verify270_strip.js
// Файлы сборки 270, которых ещё нет в index.html, подгружаются после старта жизни в порядке сборки,
// чтобы полоса проверялась вместе с соседними частями.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const ORDER = ['films269.js', 'display269.js', 'notices270.js', 'family270.js', 'social270.js', 'jobs270.js', 'strip270.js', 'texts270.js'];
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1280, height: 900 };

async function page(browser, cfg, viewport) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  for (const [k, v] of Object.entries(cfg))
    await pg.evaluate(([k, v]) => { const e = document.getElementById(k); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, [k, v]);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
  });
  const loaded = [];
  for (const f of ORDER) {
    if (!fs.existsSync(path.join(ROOT, f))) continue;
    if (await pg.evaluate(f => [...document.scripts].some(x => (x.getAttribute('src') || '').split('?')[0] === f), f)) continue;
    await pg.addScriptTag({ path: path.join(ROOT, f) });
    loaded.push(f);
  }
  return { pg, errors, ctx, loaded };
}

const results = [];
const check = (name, ok, info) => { results.push({ name, ok: !!ok }); console.log((ok ? 'ok   ' : 'FAIL ') + name + (ok ? '' : '  ' + JSON.stringify(info).slice(0, 500))); };
const wait = ms => new Promise(r => setTimeout(r, ms));

// Полоса как её видит игрок.
const strip = () => {
  const el = document.querySelector('#app>.top-strip270');
  if (!el) return { shown: false, latest: false, waiting: false };
  const r = el.getBoundingClientRect();
  const row = c => el.querySelector('.' + c);
  return {
    shown: true, height: r.height, top: r.top, bottom: r.bottom,
    latest: !!row('strip-latest270'), waiting: !!row('strip-waiting270'),
    latestTitle: row('strip-latest270')?.querySelector('.strip-title270')?.textContent || '',
    latestId: row('strip-latest270')?.querySelector('[data-strip-event]')?.dataset.stripEvent || '',
    waitingTitle: row('strip-waiting270')?.querySelector('.strip-title270')?.textContent || '',
    count: +(row('strip-count270')?.textContent || 0), all: !!el.querySelector('.strip-all270'),
    text: el.textContent, overflowX: el.scrollWidth > el.clientWidth + 1
  };
};
// Раскладка: полоса между навигацией и колонками, без горизонтальной прокрутки, колонки до низа экрана.
const layout = () => {
  const app = document.getElementById('app'), shell = app.querySelector(':scope>.shell'), st = app.querySelector(':scope>.top-strip270');
  const de = document.documentElement, sh = shell.getBoundingClientRect();
  // Вылезающий за край элемент считается, только если его не обрезает ближайший предок с overflow (многоточие).
  const clipped = n => { for (let a = n.parentElement; a && a !== app; a = a.parentElement) if (getComputedStyle(a).overflowX !== 'visible') return a.getBoundingClientRect().right <= innerWidth + 1; return false; };
  const wide = [...document.querySelectorAll('#app *')].filter(n => { const r = n.getBoundingClientRect(); return r.width && r.right > innerWidth + 1 && getComputedStyle(n).position !== 'fixed' && !clipped(n); }).length;
  return {
    pageScrollX: de.scrollWidth > innerWidth + 1 || document.body.scrollWidth > innerWidth + 1,
    stripOverflow: st ? st.scrollWidth > st.clientWidth + 1 : false,
    shellTop: sh.top, shellBottom: sh.bottom, stripBottom: st ? st.getBoundingClientRect().bottom : null,
    stripHeight: st ? st.getBoundingClientRect().height : null, innerHeight, innerWidth, wide,
    rows: getComputedStyle(app).gridTemplateRows
  };
};
const go = (pg, panel, t) => pg.evaluate(([panel, t]) => { if ($('#modal').open) closeModal(); s.pending = []; s.clock.running = false; if (panel) s.ui05.panel = panel; if (t) tab = t; render(); }, [panel, t]);

(async () => {
  const browser = await chromium.launch();

  // 1. Телефон, 390px.
  {
    const { pg, errors, ctx, loaded } = await page(browser, { startAge: '18', country: 'nl' }, PHONE);
    console.log('подгружены после старта: ' + (loaded.join(', ') || 'ничего'));
    check('телефон: strip270 загружен и считает экран узким', await pg.evaluate(() => typeof topStrip270 === 'function' && mobile270()), {});

    // Записи, которые полоса должна пропустить: рутина (feed267 — в «Будни»), тихая запись, рутинное знакомство,
    // сама строка «Будни». Последним настоящим событием остаётся «Проверка полосы».
    const feed = await pg.evaluate(() => {
      s.clock.running = false;
      log('Проверка полосы', 'Ребенок пошёл в первый класс, и в доме стало тихо по утрам.', 'Семья', true);
      const top = s.log[0].title;
      log('Книга клуба', 'Рутина', 'Хобби');
      log('Разговор между делами', 'Тихая запись', 'Быт');
      log('Новое знакомство · Анна', 'Рутинное знакомство', 'Новый человек');
      const routineContact = s.log[0].title;
      feed267().week = { разговоры: 3 };
      flushWeekdays267();
      return { top, routineContact, first: s.log[0].title, weekdays: !!s.log[0].weekdays267, clubInLog: s.log.slice(0, 5).some(e => e.title === 'Книга клуба') };
    });
    check('лента: рутина ушла в «Будни», а не в историю', !feed.clubInLog && feed.weekdays && /^Будни/.test(feed.first), feed);

    await go(pg, 'right', 'story');
    let st = await pg.evaluate(strip);
    check('телефон «Действия»: сверху последнее событие, без списка ответов', st.shown && st.latest && !st.waiting, st);
    check('телефон «Действия»: пропущены «Будни», знакомство и тихая запись', st.latestTitle === 'Проверка полосы', { title: st.latestTitle, feed });
    check('телефон «Действия»: ё в хранимых значениях (Ребёнок)', /Ребёнок пошёл/.test(st.text) && !/Ребенок/.test(st.text), st.text);
    let lay = await pg.evaluate(layout);
    check('телефон «Действия»: полоса видна (не сжата гридом) и стоит над колонками', lay.stripHeight > 20 && lay.stripHeight < 110 && Math.abs(lay.stripBottom - lay.shellTop) < 1.5 && Math.abs(lay.shellBottom - lay.innerHeight) < 1.5, lay);
    check('телефон «Действия»: нет горизонтальной прокрутки', !lay.pageScrollX && !lay.stripOverflow && !lay.wide, lay);

    // Совпадает с первой записью «Истории», которую видит игрок (story() с его фильтрами), кроме «Будни» и итогов года.
    const firstStory = await pg.evaluate(() => {
      const box = document.createElement('div'); box.innerHTML = story();
      const a = [...box.querySelectorAll('article.event')].find(a => !['Будни', 'Годовая сводка'].includes(a.querySelector('.tag')?.textContent));
      return { title: a?.querySelector('h3')?.textContent, id: a?.dataset.eventId };
    });
    check('телефон «Действия»: это та же запись, что первая в «Истории»', firstStory.title === st.latestTitle && firstStory.id === st.latestId, { firstStory, st });

    // Нажатие открывает «Историю» на этой записи.
    await pg.click('#app>.top-strip270 .strip-latest270 .strip-open270');
    const opened = await pg.evaluate(id => {
      const panel = document.querySelector('[data-panel="center"]'), a = panel.querySelector('[data-event-id="' + id + '"]');
      const pr = panel.getBoundingClientRect(), ar = a?.getBoundingClientRect();
      return { panel: s.ui05.panel, tab, visible: !!a && getComputedStyle(panel).display !== 'none' && ar.top >= pr.top - 1 && ar.top < pr.bottom - 40 };
    }, st.latestId);
    check('нажатие на событие: открыта «История», запись на экране', opened.panel === 'center' && opened.tab === 'story' && opened.visible, opened);

    // «История»: сверху то, что ждёт ответа. Ответ (свидание) раньше состояния здоровья (усталость).
    const setup = await pg.evaluate(() => {
      s.clock.running = false;
      const p = s.people.find(p => p.alive && ['Мать', 'Отец'].includes(p.role));
      s.clock.fatigue = 70;
      s.pending = [{ type: 'familyContact05', id: p.id }];
      decisionState24();
      tab = 'story'; s.ui05.panel = 'center'; render();
      return { name: p.name, items: decisionItems24().map(i => i.ref.kind + ':' + i.title) };
    });
    st = await pg.evaluate(strip);
    const total = await pg.evaluate(() => decisionItems24().length);
    const firstAnswer = await pg.evaluate(() => decisionItems24().find(i => i.ref.kind !== 'health58')?.title);
    check('телефон «История»: сверху «Ожидают ответа», без последнего события', st.shown && st.waiting && !st.latest, { st, setup });
    check('телефон «История»: число совпадает с decisionItems24, первым — ответ, а не усталость', st.count === total && total >= 2 && st.waitingTitle === firstAnswer && !/^Усталость/.test(st.waitingTitle) && setup.items.some(x => /^health58:Усталость/.test(x)) && st.all, { st, total, firstAnswer, setup });
    // Первым ставим разговор с родственником и нажимаем: должно открыться именно это решение.
    await pg.evaluate(() => { const old = decisionItems24; window.__strip270Items = old; decisionItems24 = () => { const a = old(); return a.filter(i => i.ref.kind === 'pending').concat(a.filter(i => i.ref.kind !== 'pending')); }; render(); });
    st = await pg.evaluate(strip);
    await pg.click('#app>.top-strip270 .strip-waiting270 .strip-open270');
    const m = await pg.evaluate(() => { decisionItems24 = window.__strip270Items; return { open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '' }; });
    check('нажатие на решение: открыто само решение', st.waitingTitle === 'Разговор с родственником' && m.open && m.title.includes(setup.name), { m, st: st.waitingTitle });
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); });
    await pg.click('#app>.top-strip270 .strip-all270');
    const all = await pg.evaluate(() => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '' }));
    check('«Все»: общий список ответов', all.open && /Ожидают/.test(all.title), all);
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); s.pending = [{ type: 'familyContact05', id: s.people.find(p => p.alive && ['Мать', 'Отец'].includes(p.role))?.id }].filter(q => q.id); decisionState24(); s.clock.running = false; });

    // «Люди» и «Траектория» — обе строки.
    for (const [t, label] of [['people', 'Люди'], ['trajectory', 'Траектория']]) {
      await pg.evaluate(t => { s.clock.running = false; s.ui05.panel = 'center'; tab = t; render(); }, t);
      st = await pg.evaluate(strip);
      check('телефон «' + label + '»: и последнее событие, и ответы', st.shown && st.latest && st.waiting, st);
      lay = await pg.evaluate(layout);
      check('телефон «' + label + '»: две строки не съедают экран, без горизонтальной прокрутки', lay.stripHeight < 110 && Math.abs(lay.stripBottom - lay.shellTop) < 1.5 && !lay.pageScrollX && !lay.stripOverflow && !lay.wide, lay);
    }

    // «Персонаж» и «Личное дело» — без полосы.
    await pg.evaluate(() => { s.clock.running = false; s.ui05.panel = 'left'; tab = 'story'; render(); });
    st = await pg.evaluate(strip);
    check('телефон «Персонаж»: полосы нет', !st.shown, st);
    lay = await pg.evaluate(layout);
    check('телефон «Персонаж»: раскладка как раньше (4 строки, колонки до низа)', lay.rows.split(' ').length === 4 && Math.abs(lay.shellBottom - lay.innerHeight) < 1.5, lay);
    await pg.evaluate(() => { s.ui05.panel = 'center'; setTab('world'); });
    st = await pg.evaluate(strip);
    check('телефон «Личное дело»: полосы нет', !st.shown, st);
    await pg.evaluate(() => { tab = 'plans'; render(); });
    st = await pg.evaluate(strip);
    check('телефон: старая вкладка «plans» (рисуется как «Личное дело») — полосы нет', !st.shown, st);

    // Время стоит на «Персонаже» и «Личном деле» и идёт дальше, когда игрок уходит.
    const run = () => pg.evaluate(() => { if ($('#modal').open) closeModal(); s.pending = []; s.dead = false; s.clock.speed = 8; s.clock.running = true; clockStamp = Date.now(); clockCarry = 0; render(); return s.clock.ticks; });
    const after = () => pg.evaluate(() => ({ ticks: s.clock.ticks, running: s.clock.running, label: document.querySelector('.clock-bar small')?.textContent || '', button: document.querySelector('.clock-controls .primary')?.textContent || '' }));
    await pg.evaluate(() => { s.ui05.panel = 'left'; tab = 'story'; });
    let t0 = await run();
    await wait(1600);
    let a = await after();
    check('часы: на «Персонаже» месяцы не идут, флаг хода не сбит', a.ticks === t0 && a.running, { t0, a });
    check('часы: на «Персонаже» подпись говорит, что время стоит', /Время стоит, пока открыт персонаж/.test(a.label) && /Пауза/.test(a.button), a);
    // Окно на «Персонаже»: settleChoice возвращает running=true, но время всё равно стоит.
    await pg.evaluate(() => show('Проверка', 'Окно на экране персонажа.', [{ label: 'Хорошо', fn: () => {} }]));
    await pg.evaluate(() => choose(0));
    await wait(1200);
    a = await after();
    check('часы: после окна на «Персонаже» время по-прежнему стоит', a.ticks === t0 && a.running, { t0, a });
    await pg.evaluate(() => panelSelect('center'));
    await wait(1600);
    a = await after();
    check('часы: ушли с «Персонажа» — время пошло', a.ticks > t0, { t0, a });

    await pg.evaluate(() => { s.ui05.panel = 'center'; tab = 'world'; });
    t0 = await run();
    await wait(1600);
    a = await after();
    check('часы: на «Личном деле» месяцы не идут', a.ticks === t0 && a.running && /пока открыто личное дело/.test(a.label), { t0, a });
    await pg.evaluate(() => { if (!$('#modal').open) setTab('people'); });
    await wait(1600);
    a = await after();
    check('часы: ушли с «Личного дела» — время пошло', a.ticks > t0, { t0, a });

    // Игрок сам поставил паузу на «Персонаже» — после ухода пауза остаётся.
    await pg.evaluate(() => { s.ui05.panel = 'left'; tab = 'story'; });
    t0 = await run();
    await pg.evaluate(() => toggleClock());
    a = await after();
    check('часы: пауза игрока на «Персонаже» — подпись «Пауза»', !a.running && /Пауза/.test(a.label) && /Продолжить/.test(a.button), a);
    await pg.evaluate(() => panelSelect('center'));
    await wait(1200);
    a = await after();
    check('часы: после паузы игрока и ухода с «Персонажа» время стоит', a.ticks === t0 && !a.running, { t0, a });

    // Действия и История на ходу: месяцы идут, полоса перерисовывается вместе с экраном.
    await pg.evaluate(() => { s.ui05.panel = 'right'; tab = 'story'; });
    t0 = await run();
    await wait(1600);
    a = await after();
    st = await pg.evaluate(strip);
    check('часы: на «Действиях» время идёт, полоса на месте', a.ticks > t0 && st.shown && st.latest, { t0, a, st });
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); s.pending = []; s.clock.running = false; });

    // Возраст в строке часов — с правильным окончанием.
    const ages = await pg.evaluate(() => { const age = s.age, out = {}; for (const n of [21, 22, 25, 31, 44, 111]) { s.age = n; out[n] = clockView().match(/· (\d+ \S+)<\/small>/)?.[1]; } s.age = age; render(); return out; });
    check('часы: «21 год», «22 года», «25 лет», «31 год», «44 года», «111 лет»', ages[21] === '21 год' && ages[22] === '22 года' && ages[25] === '25 лет' && ages[31] === '31 год' && ages[44] === '44 года' && ages[111] === '111 лет', ages);

    // Очень длинное событие не даёт горизонтальной прокрутки.
    await pg.evaluate(() => { log('Очень длинное название события, которое не помещается в одну строку на телефоне и не должно раздвигать экран вбок ни при каком раскладе', 'Длинное описание '.repeat(30), 'Проверка', true); s.ui05.panel = 'center'; tab = 'people'; render(); });
    lay = await pg.evaluate(layout);
    st = await pg.evaluate(strip);
    check('длинное событие: нет горизонтальной прокрутки, полоса в одну-две строки', st.latest && !lay.pageScrollX && !lay.stripOverflow && !lay.wide && lay.stripHeight < 110, { lay, st: { ...st, text: '' } });

    // Обучение и стартовое окно — полоса не мешает подсветке.
    const tut = await pg.evaluate(() => { const old = window.tutorialActive180; tutorialActive180 = () => true; const html = topStrip270(), hold = clockHold270(); tutorialActive180 = old; return { html, hold }; });
    check('обучение: полосы нет, часы не держим', tut.html === '' && !tut.hold, tut);

    // Поворот через 1000px: на «Люди» с «Персонажа» — широкий экран показывает событие и не держит часы.
    await pg.evaluate(() => { s.clock.running = false; s.ui05.panel = 'left'; tab = 'people'; render(); });
    const before = await pg.evaluate(() => ({ st: !!document.querySelector('#app>.top-strip270'), hold: clockHold270() }));
    await pg.setViewportSize(WIDE);
    await wait(300);
    const wide = await pg.evaluate(() => ({ st: !!document.querySelector('#app>.top-strip270 .strip-latest270'), waiting: !!document.querySelector('#app>.top-strip270 .strip-waiting270'), hold: clockHold270(), mobile: mobile270() }));
    await pg.setViewportSize(PHONE);
    await wait(300);
    const back = await pg.evaluate(() => ({ st: !!document.querySelector('#app>.top-strip270'), hold: clockHold270() }));
    check('поворот: телефон «Персонаж» → широкий (событие сверху, часы идут) → телефон (без полосы)', !before.st && before.hold && wide.st && !wide.waiting && !wide.hold && !wide.mobile && !back.st && back.hold, { before, wide, back });

    check('телефон: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 2. Широкий экран, 1280px.
  {
    const { pg, errors, ctx } = await page(browser, { startAge: '18', country: 'de' }, WIDE);
    check('широкий: экран не считается узким', await pg.evaluate(() => !mobile270()), {});
    await pg.evaluate(() => { s.clock.running = false; log('Событие для широкого экрана', 'Описание события.', 'Проверка', true); const p = s.people.find(p => p.alive && ['Мать', 'Отец'].includes(p.role)); if (p) { s.pending = [{ type: 'familyContact05', id: p.id }]; decisionState24(); } });
    const pend = await pg.evaluate(() => decisionItems24().length);

    await pg.evaluate(() => { s.ui05.panel = 'center'; tab = 'story'; render(); });
    let st = await pg.evaluate(strip);
    check('широкий «История»: полосы нет', !st.shown, st);
    let lay = await pg.evaluate(layout);
    check('широкий «История»: раскладка как раньше (3 строки, колонки до низа)', lay.rows.split(' ').length === 3 && Math.abs(lay.shellBottom - lay.innerHeight) < 1.5, lay);

    for (const [t, label] of [['people', 'Люди'], ['world', 'Личное дело'], ['trajectory', 'Траектория']]) {
      await pg.evaluate(t => { s.clock.running = false; tab = t; render(); }, t);
      st = await pg.evaluate(strip);
      check('широкий «' + label + '»: сверху последнее событие, без ответов', st.shown && st.latest && !st.waiting && st.latestTitle === 'Событие для широкого экрана', { st, pend });
      lay = await pg.evaluate(layout);
      check('широкий «' + label + '»: полоса над колонками, колонки до низа, без горизонтальной прокрутки', lay.stripHeight > 20 && lay.stripHeight < 80 && Math.abs(lay.stripBottom - lay.shellTop) < 1.5 && Math.abs(lay.shellBottom - lay.innerHeight) < 1.5 && !lay.pageScrollX && !lay.stripOverflow && !lay.wide, lay);
    }
    check('широкий: ответы есть, но в полосу не попадают', pend >= 1, { pend });

    // Сохранение с телефона (панель «Персонаж») не держит часы на широком экране, «Личное дело» тоже.
    const t0 = await pg.evaluate(() => { s.pending = []; s.ui05.panel = 'left'; tab = 'world'; s.clock.speed = 8; s.clock.running = true; clockStamp = Date.now(); clockCarry = 0; render(); return s.clock.ticks; });
    await wait(1600);
    const a = await pg.evaluate(() => ({ ticks: s.clock.ticks, label: document.querySelector('.clock-bar small')?.textContent || '' }));
    check('широкий: панель «Персонаж» из сохранения и «Личное дело» часы не держат', a.ticks > t0 && !/Время стоит/.test(a.label), { t0, a });
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); s.pending = []; s.clock.running = false; s.ui05.panel = 'center'; tab = 'people'; render(); });

    // Нажатие — «История», полоса уходит.
    await pg.click('#app>.top-strip270 .strip-latest270 .strip-open270');
    const r = await pg.evaluate(() => ({ tab, st: !!document.querySelector('#app>.top-strip270'), active: document.querySelector('.center .tabs .active')?.textContent }));
    check('широкий: нажатие открывает «Историю», полоса исчезает', r.tab === 'story' && !r.st && r.active === 'История', r);

    check('широкий: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} проверок прошли` + (bad.length ? '; не прошли: ' + bad.map(r => r.name).join('; ') : ''));
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
