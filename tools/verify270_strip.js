// Сборка 270, strip270.js: верхняя полоса на телефоне и на широком экране, остановка часов на «Персонаже»
// и «Личном деле». Игра раздаётся с диска, сервер не нужен:  node tools/verify270_strip.js
// Файлы сборки 270, которых ещё нет в index.html, подгружаются после старта жизни в порядке сборки,
// чтобы полоса проверялась вместе с соседними частями. Последний прогон раздаёт index.html, в который эти файлы
// вписаны перед bootstrap61.js (как их подключит сборка), и проходит рождение, стартовое окно и обучение
// настоящими нажатиями.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const ORDER = ['films269.js', 'display269.js', 'notices270.js', 'family270.js', 'social270.js', 'jobs270.js', 'strip270.js', 'texts270.js', 'names270.js', 'onboarding270.js'];
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1280, height: 900 };
// 272 (layout272.js): на телефоне «Люди», «Траектория», «Личное дело» — одна строка последнего события, на широком
// экране вместо полосы — сводка над вкладками центра (подробно — tools/verify272_layout.js). Здесь те же места
// проверяются по-новому, когда layout272.js подключён.
const L272 = process.env.L272 === '1' || fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').includes('layout272.js');

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

// index.html с файлами 270 перед bootstrap61.js: на диске index.html не меняется, правка только в ответе.
async function pageFinal(browser, viewport) {
  const ctx = await browser.newContext({ viewport });
  const injected = [];
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    if (rel === 'index.html') {
      const html = body.toString();
      const add = ORDER.filter(x => fs.existsSync(path.join(ROOT, x)) && !html.includes('src="' + x));
      injected.splice(0, injected.length, ...add);
      body = html.replace('<script src="bootstrap61.js', add.map(x => '<script src="' + x + '?v=270"></script>').join('') + '<script src="bootstrap61.js');
    }
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  return { pg, errors, ctx, injected };
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
// Контраст текста полосы с фоном под ним (WCAG), для строки последнего события.
const contrast = () => {
  const rgb = c => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
  const lum = ({ r, g, b }) => { const f = v => (v /= 255) <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; return .2126 * f(r) + .7152 * f(g) + .0722 * f(b); };
  const bg = n => { for (; n; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.a >= 1) return c; } return { r: 255, g: 255, b: 255 }; };
  const ratio = n => { const a = lum(rgb(getComputedStyle(n).color)), b = lum(bg(n)); return +((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toFixed(2); };
  const row = document.querySelector('#app>.top-strip270 .strip-latest270');
  return { kicker: ratio(row.querySelector('.strip-kicker270')), text: ratio(row.querySelector('.strip-text270')), title: ratio(row.querySelector('.strip-title270')) };
};
// Подпись строки над записью или в одну строку с ней.
const kickerInline = () => {
  const row = document.querySelector('#app>.top-strip270 .strip-row270'), k = row.querySelector('.strip-kicker270').getBoundingClientRect(), l = row.querySelector('.strip-line270').getBoundingClientRect();
  return { inline: l.left >= k.right - 1 && k.top < l.bottom && l.top < k.bottom, above: k.bottom <= l.top + 1 };
};
const go = (pg, panel, t) => pg.evaluate(([panel, t]) => { s.pending = []; if ($('#modal').open) closeModal(); s.clock.running = false; if (panel) s.ui05.panel = panel; if (t) tab = t; render(); }, [panel, t]);

(async () => {
  const browser = await chromium.launch();

  // 1. Телефон, 390px.
  {
    const { pg, errors, ctx, loaded } = await page(browser, { startAge: '18', country: 'nl' }, PHONE);
    console.log('подгружены после старта: ' + (loaded.join(', ') || 'ничего'));
    check('телефон: strip270 загружен и считает экран узким', await pg.evaluate(() => typeof topStrip270 === 'function' && mobile270()), {});

    // Записи, которые полоса должна пропустить: рутина (feed267 — не в ленту; строки «Будни» с 275.5 нет), тихая
    // запись, рутинное знакомство. Последним настоящим событием остаётся «Проверка полосы».
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
    check('лента: рутина не в истории, строки «Будни» нет (275.5)', !feed.clubInLog && !feed.weekdays && feed.first === feed.routineContact, feed);

    await go(pg, 'right', 'story');
    let st = await pg.evaluate(strip);
    check('телефон «Действия»: сверху последнее событие, без списка ответов', st.shown && st.latest && !st.waiting, st);
    check('телефон «Действия»: пропущены рутина, знакомство и тихая запись', st.latestTitle === 'Проверка полосы', { title: st.latestTitle, feed });
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

    // Подпись и текст читаются: не меньше 4.5:1 и без наведения, и при наведении.
    await go(pg, 'right', 'story');
    check('телефон стоя: подпись строки над записью, а не в одну строку', (await pg.evaluate(kickerInline)).above, await pg.evaluate(kickerInline));
    const c0 = await pg.evaluate(contrast);
    await pg.hover('#app>.top-strip270 .strip-latest270 .strip-open270');
    await wait(400);
    const c1 = await pg.evaluate(contrast);
    await pg.mouse.move(0, 0);
    check('контраст полосы: подпись, заголовок и текст не меньше 4.5:1, при наведении тоже', [c0, c1].every(c => c.kicker >= 4.5 && c.text >= 4.5 && c.title >= 4.5), { c0, c1 });

    // Запись без описания (или описание, которое eventDescription204 убирает целиком) — без висящего « — ».
    const bare = await pg.evaluate(() => {
      const out = {};
      for (const [k, text] of [['пусто', ''], ['хвост', 'Работодатель и накопленный стаж сохраняются.']]) {
        log('Запись без описания · ' + k, text, 'Проверка', true); render();
        const row = document.querySelector('#app>.top-strip270 .strip-latest270');
        out[k] = { title: row?.querySelector('.strip-title270')?.textContent, span: !!row?.querySelector('.strip-text270'), line: row?.querySelector('.strip-line270')?.textContent };
      }
      log('С описанием', 'Обычное описание.', 'Проверка', true); render();
      out.full = document.querySelector('#app>.top-strip270 .strip-latest270 .strip-line270')?.textContent;
      return out;
    });
    check('запись без описания: только заголовок, без « — »', bare['пусто'].title === 'Запись без описания · пусто' && !bare['пусто'].span && !/—/.test(bare['пусто'].line) && bare['хвост'].title === 'Запись без описания · хвост' && !bare['хвост'].span && !/—/.test(bare['хвост'].line) && bare.full === 'С описанием — Обычное описание.', bare);

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
    // Первым в полосе стоит разговор с родственником (усталость ушла в конец) — нажатие открывает именно его.
    await pg.click('#app>.top-strip270 .strip-waiting270 .strip-open270');
    const m = await pg.evaluate(() => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '' }));
    check('нажатие на решение: открыто само решение', st.waitingTitle === 'Разговор с родственником' && m.open && m.title.includes(setup.name), { m, st: st.waitingTitle });
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); });
    await pg.click('#app>.top-strip270 .strip-all270');
    const all = await pg.evaluate(() => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '' }));
    check('«Все»: общий список ответов', all.open && /Ожидают/.test(all.title), all);
    // id с кавычками и угловыми скобками доходит до openDecision24 как есть.
    await pg.evaluate(() => {
      if ($('#modal').open) closeModal();
      window.__strip270 = { items: decisionItems24, open: openDecision24, calls: [] };
      decisionItems24 = () => [{ ref: { kind: 'test270', id: `a'b"c<d>` }, q: {}, title: 'Проверка «кавычек»', note: '' }];
      openDecision24 = (kind, id) => window.__strip270.calls.push([kind, id]);
      render();
    });
    await pg.click('#app>.top-strip270 .strip-waiting270 .strip-open270');
    const calls = await pg.evaluate(() => { const x = window.__strip270; decisionItems24 = x.items; openDecision24 = x.open; render(); return { calls: x.calls, all: !!document.querySelector('.strip-all270') }; });
    check('решение с кавычками в id открывается тем же id', calls.calls.length === 1 && calls.calls[0][0] === 'test270' && calls.calls[0][1] === `a'b"c<d>`, calls);
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); s.pending = [{ type: 'familyContact05', id: s.people.find(p => p.alive && ['Мать', 'Отец'].includes(p.role))?.id }].filter(q => q.id); decisionState24(); s.clock.running = false; });

    // «Люди» и «Траектория» — обе строки.
    for (const [t, label] of [['people', 'Люди'], ['trajectory', 'Траектория']]) {
      await pg.evaluate(t => { s.clock.running = false; s.ui05.panel = 'center'; tab = t; render(); }, t);
      st = await pg.evaluate(strip);
      if (L272) check('телефон «' + label + '» (272): только последнее событие', st.shown && st.latest && !st.waiting, st);
      else check('телефон «' + label + '»: и последнее событие, и ответы', st.shown && st.latest && st.waiting, st);
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
    if (L272) check('телефон «Личное дело» (272): последнее событие', st.shown && st.latest && !st.waiting, st);
    else check('телефон «Личное дело»: полосы нет', !st.shown, st);
    await pg.evaluate(() => { tab = 'plans'; render(); });
    st = await pg.evaluate(strip);
    if (L272) check('телефон: старая вкладка «plans» (рисуется как «Личное дело», 272) — последнее событие', st.shown && st.latest, st);
    else check('телефон: старая вкладка «plans» (рисуется как «Личное дело») — полосы нет', !st.shown, st);

    // Время стоит на «Персонаже» и «Личном деле» и идёт дальше, когда игрок уходит.
    const run = () => pg.evaluate(() => { s.pending = []; if ($('#modal').open) closeModal(); s.clock.choiceActive = false; s.clock.resumeAfterChoice = false; s.dead = false; s.clock.speed = 8; s.clock.running = true; clockStamp = Date.now(); clockCarry = 0; render(); return s.clock.ticks; });
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

    // Год настоящих месяцев (advanceMonth): «Будни» и итоги года в полосу не попадают, полоса — первая настоящая запись «Истории».
    const year = await pg.evaluate(() => {
      s.ui05.panel = 'right'; tab = 'story'; s.clock.running = false;
      const seen = new Set();
      for (let i = 0; i < 14; i++) {
        s.pending = []; if ($('#modal').open) closeModal(); s.pending = [];
        advanceMonth();
        for (const e of s.log.slice(0, 8)) seen.add(e.tag);
      }
      s.pending = []; if ($('#modal').open) closeModal(); s.pending = []; s.clock.running = false; render();
      const title = document.querySelector('#app>.top-strip270 .strip-latest270 .strip-title270')?.textContent;
      const box = document.createElement('div'); box.innerHTML = story();
      const arts = [...box.querySelectorAll('article.event')].map(a => ({ title: a.querySelector('h3')?.textContent, tag: a.querySelector('.tag')?.textContent }));
      return { title, first: arts.find(a => !['Будни', 'Годовая сводка'].includes(a.tag))?.title, top: arts.slice(0, 4), weekdays: seen.has('Будни'), summary: seen.has('Годовая сводка'), ticks: s.clock.ticks };
    });
    check('год настоящих месяцев: полоса — первая настоящая запись «Истории», итоги года пропущены, «Будни» нет (275.5)', year.title && year.title === year.first && year.summary && !year.weekdays && !/^Будни|^Итоги прожитого года/.test(year.title), year);

    // Возраст в строке часов — с правильным окончанием.
    const ages = await pg.evaluate(() => { const age = s.age, out = {}; for (const n of [21, 22, 25, 31, 44, 111]) { s.age = n; out[n] = clockView().match(/· (\d+ \S+)<\/small>/)?.[1]; } s.age = age; render(); return out; });
    check('часы: «21 год», «22 года», «25 лет», «31 год», «44 года», «111 лет»', ages[21] === '21 год' && ages[22] === '22 года' && ages[25] === '25 лет' && ages[31] === '31 год' && ages[44] === '44 года' && ages[111] === '111 лет', ages);

    // Очень длинное событие не даёт горизонтальной прокрутки.
    await pg.evaluate(() => { log('Очень длинное название события, которое не помещается в одну строку на телефоне и не должно раздвигать экран вбок ни при каком раскладе', 'Длинное описание '.repeat(30), 'Проверка', true); s.ui05.panel = 'center'; tab = 'people'; render(); });
    lay = await pg.evaluate(layout);
    st = await pg.evaluate(strip);
    check('длинное событие: нет горизонтальной прокрутки, полоса в одну-две строки', st.latest && !lay.pageScrollX && !lay.stripOverflow && !lay.wide && lay.stripHeight < 110, { lay, st: { ...st, text: '' } });

    // Поворот через 1000px: на «Люди» с «Персонажа» — широкий экран показывает событие и не держит часы.
    await pg.evaluate(() => { s.clock.running = false; s.ui05.panel = 'left'; tab = 'people'; render(); });
    const before = await pg.evaluate(() => ({ st: !!document.querySelector('#app>.top-strip270'), hold: clockHold270() }));
    await pg.setViewportSize(WIDE);
    await wait(300);
    const wide = await pg.evaluate(() => ({ st: !!document.querySelector(typeof summary272 === 'function' ? '.summary272 .sum-event272' : '#app>.top-strip270 .strip-latest270'), waiting: !!document.querySelector('#app>.top-strip270 .strip-waiting270'), hold: clockHold270(), mobile: mobile270() }));
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
      if (L272) {
        const sum = await pg.evaluate(() => ({ strip: !!document.querySelector('#app>.top-strip270'), title: document.querySelector('.summary272 .sum-title272')?.textContent || '', rows: getComputedStyle(document.getElementById('app')).gridTemplateRows.split(' ').length }));
        check('широкий «' + label + '» (272): полосы нет, сверху сводка с последним событием', !sum.strip && sum.rows === 3 && sum.title === 'Событие для широкого экрана', sum);
        continue;
      }
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
    await pg.click(L272 ? '.summary272 .sum-event272' : '#app>.top-strip270 .strip-latest270 .strip-open270');
    const r = await pg.evaluate(() => ({ tab, st: !!document.querySelector('#app>.top-strip270'), active: document.querySelector('.center .tabs .active')?.textContent }));
    check(L272 ? 'широкий (272): нажатие на сводку открывает «Историю»' : 'широкий: нажатие открывает «Историю», полоса исчезает', r.tab === 'story' && !r.st && r.active === 'История', r);

    check('широкий: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  // 3. Итоговый порядок: файлы 270 в index.html перед bootstrap61.js, рождение, стартовое окно, обучение
  // и часы — настоящими нажатиями.
  {
    const { pg, errors, ctx, injected } = await pageFinal(browser, PHONE);
    console.log('в index.html перед bootstrap61.js: ' + (injected.join(', ') || 'ничего (уже подключены)'));
    const state = () => ({
      notice: typeof startupNotice180 === 'function' && !!startupNotice180(), tut: tutorialActive180(), step: s.onboarding180?.step,
      modal: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '',
      strip: !!document.querySelector('#app>.top-strip270'), hold: clockHold270(),
      waitingTitle: document.querySelector('#app>.top-strip270 .strip-waiting270 .strip-title270')?.textContent || ''
    });
    const clk = () => ({ ticks: s.clock.ticks, running: s.clock.running, modal: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '', pending: s.pending.length, label: document.querySelector('.clock-bar small')?.textContent || '', button: document.querySelector('.clock-controls .primary')?.textContent || '' });
    await pg.selectOption('#startAge', '18');
    await pg.selectOption('#country', 'nl');
    await pg.click('text=Родиться');
    await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
    const birth = await pg.evaluate(state);
    check('итоговый порядок: strip270 подключён из index.html', await pg.evaluate(() => typeof topStrip270 === 'function' && [...document.scripts].some(x => /^strip270\.js/.test(x.getAttribute('src') || ''))), injected);
    check('рождение: стартовое окно открыто, полосы под ним нет', birth.notice && birth.modal && !birth.tut && !birth.strip, birth);

    // Перезагрузка со стартовым окном: окно открывается само (onboarding270.js), полосы под ним нет.
    await pg.evaluate(() => { if (typeof flushSave264 === 'function') flushSave264(); });
    await pg.reload();
    await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&document.getElementById('app').classList.contains('playing')");
    const re = await pg.evaluate(state);
    check('перезагрузка до ответа на стартовое окно: окно открылось само, полосы под ним нет', re.notice && re.modal && !re.tut && !re.strip && re.title === birth.title, { re, birth: birth.title });
    // Окно закрыто без ответа: строка «Ожидают ответа» на «Истории» ведёт к нему.
    await pg.evaluate(() => { HTMLDialogElement.prototype.close.call($('#modal')); render(); });
    await pg.click('.mobile-panels button:has-text("История")');
    const waiting = await pg.evaluate(state);
    check('окно закрыто без ответа: полоса ведёт к нему', waiting.notice && !waiting.modal && !waiting.tut && waiting.strip && waiting.waitingTitle === birth.title, { waiting, birth: birth.title });
    await pg.click('#app>.top-strip270 .strip-waiting270 .strip-open270');
    const reopened = await pg.evaluate(state);
    check('нажатие на полосу: открыто стартовое окно', reopened.modal && reopened.notice && reopened.title === birth.title, reopened);
    await pg.click('#modal .options button:has-text("Понятно")');

    // Обучение: все шаги кнопкой «Далее», на каждом — без полосы и без остановки часов.
    const steps = [];
    for (let i = 0; i < 20; i++) {
      const t = await pg.evaluate(state);
      if (!t.tut) break;
      steps.push({ step: t.step, strip: t.strip, hold: t.hold });
      const last = await pg.evaluate(() => onboarding180().step === tutorialSteps180.length - 1);
      await pg.click('#tutorial180 .tutorial-buttons180 button:has-text("' + (last ? 'Начать жизнь' : 'Далее') + '")');
    }
    const total = await pg.evaluate(() => tutorialSteps180.length);
    check('обучение: все ' + total + ' шагов без полосы и без остановки часов', steps.length === total && steps.every((t, i) => t.step === i && !t.strip && !t.hold), steps);
    const done = await pg.evaluate(() => ({ tut: tutorialActive180(), status: s.onboarding180?.status, blocked: stripBlocked270(), strip: !!document.querySelector('#app>.top-strip270'), want: waitingItems270().length > 0 && s.ui05.panel === 'center' && tab === 'story' }));
    check('после обучения полоса вернулась', !done.tut && done.status === 'finished' && !done.blocked && done.strip === done.want, done);

    // Часы: «Персонаж», 8×, «▶ Продолжить» — месяцы стоят; событие из очереди открывается; «История» — время пошло.
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); s.pending = []; });
    await pg.click('.mobile-panels button:has-text("Персонаж")');
    await pg.click('.clock-controls button[onclick="setSpeed(8)"]');
    if (!(await pg.evaluate(() => s.clock.running))) await pg.click('.clock-controls .primary');
    const k0 = await pg.evaluate(clk);
    await wait(1600);
    let k = await pg.evaluate(clk);
    check('часы (кнопки): на «Персонаже» месяцы стоят, подпись объясняет почему', k0.running && k.running && k.ticks === k0.ticks && /Время стоит, пока открыт персонаж/.test(k.label) && /Пауза/.test(k.button), { k0, k });
    const parent = await pg.evaluate(() => { const p = s.people.find(p => p.alive && ['Мать', 'Отец'].includes(p.role)); s.pending.push({ type: 'familyContact05', id: p.id }); return p.name; });
    await wait(800);
    k = await pg.evaluate(clk);
    check('часы (кнопки): событие из очереди на «Персонаже» открывается само, месяцы не идут', k.modal && k.title.includes(parent) && k.ticks === k0.ticks, { k, parent });
    for (let i = 0; i < 4 && (await pg.evaluate(() => $('#modal').open)); i++) await pg.click('#modal .options button:not([disabled]) >> nth=0');
    await wait(1200);
    k = await pg.evaluate(clk);
    check('часы (кнопки): после ответа на «Персонаже» ход возвращён, месяцы по-прежнему стоят', !k.modal && k.running && k.ticks === k0.ticks, { k0, k });
    await pg.click('.mobile-panels button:has-text("История")');
    await wait(1600);
    k = await pg.evaluate(clk);
    check('часы (кнопки): ушли на «Историю» — время пошло', k.ticks > k0.ticks, { k0, k });
    await pg.evaluate(() => { if ($('#modal').open) closeModal(); s.pending = []; if (s.clock.running) toggleClock(); s.clock.running = false; render(); });

    // Телефон боком, 844×390: обе строки полосы в одну строку каждая, под колонку остаётся место.
    await pg.setViewportSize({ width: 844, height: 390 });
    await wait(300);
    await pg.evaluate(() => { const p = s.people.find(p => p.alive && ['Мать', 'Отец'].includes(p.role)); s.clock.fatigue = 75; s.pending = [{ type: 'familyContact05', id: p.id }]; decisionState24(); });
    for (const label of ['Люди', 'Траектория']) {
      await pg.click('.center .tabs button:has-text("' + label + '")');
      const st = await pg.evaluate(strip), lay = await pg.evaluate(layout), inl = await pg.evaluate(kickerInline);
      check('телефон боком 844×390, «' + label + '»: ' + (L272 ? 'последнее событие (272)' : 'обе строки') + ', полоса до 80px, колонке больше 100px', st.latest && st.waiting !== L272 && lay.stripHeight <= 80 && lay.shellBottom - lay.shellTop > 100 && inl.inline && !lay.pageScrollX && !lay.stripOverflow && !lay.wide, { st: { ...st, text: '' }, lay, inl });
    }
    await pg.setViewportSize(PHONE);
    await wait(300);
    const lay = await pg.evaluate(layout), inl = await pg.evaluate(kickerInline);
    check('обратно стоя: подпись снова над записью', inl.above && lay.stripHeight < 110, { lay, inl });

    check('итоговый порядок: без ошибок страницы', !errors.length, errors);
    await ctx.close();
  }

  await browser.close();
  const bad = results.filter(r => !r.ok);
  console.log(`\n${results.length - bad.length}/${results.length} проверок прошли` + (bad.length ? '; не прошли: ' + bad.map(r => r.name).join('; ') : ''));
  process.exit(bad.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
