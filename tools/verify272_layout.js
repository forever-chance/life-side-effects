// Проверки сборки 272, часть «раскладка» (layout272.js): экран не прыгает между вкладками.
// Телефон: полоса под вкладками Персонаж / История / Действия — одной высоты и на одном месте на «Истории» (все четыре
// вкладки центра) и «Действиях», на «Персонаже» её нет; на вкладке «История» — «Ожидают ответа» (и при нуле),
// на остальных — последнее событие. Нажатия и остановка часов — как в strip270.
// Широкий экран: одна сводка над вкладками центра, одинаковая на всех четырёх вкладках; карточки «Что произошло»
// и полосы 270 нет. «Моя работа»: портфолио и своё дело под текущей работой, каждый пункт открывает своё меню.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify272_layout.js
// BASE=1 — прогон без layout272.js: видно, какие проверки ловят старое поведение.
// OWNER=путь/к/сохранению.json — ещё один прогон на настоящем сохранении (последний персонаж из файла).
// EXTRA=a.js,b.js — соседние файлы сборки, ещё не подключённые в index.html: подгружаются перед layout272.js.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const PHONE = { width: 390, height: 844 }, LAND = { width: 844, height: 390 }, WIDE = { width: 1280, height: 900 }, MID = { width: 1024, height: 768 };
let pass = 0, fail = 0;
const check = (ok, label, extra) => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (ok || extra === undefined ? '' : '  ' + JSON.stringify(extra).slice(0, 600))); };
const wait = ms => new Promise(r => setTimeout(r, ms));

async function page(browser, viewport, owner) {
  const ctx = await browser.newContext({ viewport });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, body: rel === 'offline-game.js' ? '' : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&typeof importLives==='function'&&document.querySelector('#country')");
  if (owner) {
    await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, fs.readFileSync(owner, 'utf8'));
  } else {
    for (const [k, v] of Object.entries({ country: 'au', startAge: '18' }))
      await pg.evaluate(([k, v]) => { const e = document.getElementById(k); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }, [k, v]);
    await pg.click('text=Родиться');
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.clock.running = false;
  });
  for (const f of (process.env.EXTRA || '').split(',').filter(f => f && !INDEX.includes(f))) await pg.addScriptTag({ path: path.join(ROOT, f) });
  if (!BASE && !INDEX.includes('layout272.js')) await pg.addScriptTag({ path: path.join(ROOT, 'layout272.js') });
  await pg.evaluate(() => { if ($('#modal').open) closeModal(); render(); });
  return { pg, ctx, errors };
}

// Что видит игрок на телефоне: полоса и верх видимой колонки под ней.
const phoneView = () => {
  const app = document.getElementById('app'), st = app.querySelector(':scope>.top-strip270');
  const panel = [...document.querySelectorAll('.game-panel')].find(p => getComputedStyle(p).display !== 'none');
  const tabs = panel?.querySelector('.tabs');
  const de = document.documentElement;
  return {
    panel: s.ui05.panel, tab, strip: !!st,
    stripTop: st ? +st.getBoundingClientRect().top.toFixed(1) : null, stripHeight: st ? +st.getBoundingClientRect().height.toFixed(1) : null,
    contentTop: panel ? +panel.getBoundingClientRect().top.toFixed(1) : null, tabsTop: tabs ? +tabs.getBoundingClientRect().top.toFixed(1) : null,
    kind: st?.querySelector('.strip-waiting270') ? 'waiting' : st?.querySelector('.strip-latest270') ? 'latest' : '',
    count: +(st?.querySelector('.strip-count270')?.textContent ?? -1), title: st?.querySelector('.strip-title270')?.textContent || '',
    text: st?.textContent.replace(/\s+/g, ' ').trim() || '', recent: !!document.querySelector('.recent-strip'),
    scrollX: de.scrollWidth > innerWidth + 1, stripOverflow: st ? st.scrollWidth > st.clientWidth + 1 : false
  };
};
// Широкий экран: сводка, вкладки центра и колонки.
const wideView = () => {
  const app = document.getElementById('app'), sum = document.querySelector('.summary272'), center = document.querySelector('.shell>.center');
  const r = n => { if (!n) return null; const b = n.getBoundingClientRect(); return { top: +b.top.toFixed(1), height: +b.height.toFixed(1), left: +b.left.toFixed(1), right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1) }; };
  return {
    tab, sum: r(sum), card: r(sum?.querySelector('.sum-card272')), tabs: r(center?.querySelector('.tabs')), center: r(center),
    left: r(document.querySelector('.shell>.left')), right: r(document.querySelector('.shell>.right')),
    strip: !!app.querySelector(':scope>.top-strip270'), recent: !!document.querySelector('.recent-strip'),
    text: sum?.textContent.replace(/\s+/g, ' ').trim() || '', title: sum?.querySelector('.sum-title272')?.textContent || '',
    count: +(sum?.querySelector('.sum-count272')?.textContent ?? -1), tags: [...(sum?.querySelectorAll('.sum-tags272 span') || [])].map(n => n.textContent),
    scrollX: document.documentElement.scrollWidth > innerWidth + 1, overflow: sum ? sum.scrollWidth > sum.clientWidth + 1 : false
  };
};
const spread = (list, key) => { const v = list.map(x => x[key]).filter(x => x !== null && x !== undefined); return v.length ? Math.max(...v) - Math.min(...v) : Infinity; };
// Нажатие настоящей мышью; если элемента нет (BASE=1), проверка ниже просто не пройдёт, без ожидания в 30 секунд.
const tap = async (pg, sel) => { if (!(await pg.$(sel))) return false; await pg.click(sel); return true; };
const reset = pg => pg.evaluate(() => { if ($('#modal').open) closeModal(); s.clock.running = false; });
// Свидание с родителем в очереди — настоящий пункт «Ожидают ответа».
const addPending = pg => pg.evaluate(() => {
  const p = s.people.find(p => p.alive && ['Мать', 'Отец'].includes(p.role));
  s.pending = [{ type: 'familyContact05', id: p.id }];
  decisionState24();
  render();
  return { name: p.name, n: decisionItems24().length };
});
const clearPending = pg => pg.evaluate(() => { s.pending = []; if (typeof decisionState24 === 'function') decisionState24(); render(); return decisionItems24().length; });
// Последняя запись и итог действия с тегами (как после настоящего действия, events.js).
const addEvent = pg => pg.evaluate(() => {
  log('Проверка сводки', 'Сосед принёс пирог и остался на чай: разговор затянулся до вечера, и стало легче.', 'Семья', true);
  const e = s.log[0];
  s.receipts ??= [];
  s.receipts.unshift({ year: s.year, title: e.title, text: e.text, changes: ['−120 A$', 'Самочувствие: лучше'], ties: [], goals: [], events: [{ title: e.title, text: e.text }], isYear: false });
  render();
  return { title: e.title, id: e.uiId };
});

async function phoneTour(pg, label) {
  // Настоящие нажатия: вкладки внизу шапки и вкладки центра.
  const tour = [['История', 'История'], ['История', 'Люди'], ['История', 'Личное дело'], ['История', 'Траектория'], ['Действия', null], ['Персонаж', null], ['История', 'История']];
  const out = [];
  for (const [main, sub] of tour) {
    await pg.click('.mobile-panels button:text-is("' + main + '")');
    if (sub) await pg.click('.shell>.center .tabs button:text-is("' + sub + '")');
    await wait(30);
    out.push({ main, sub, ...(await pg.evaluate(phoneView)) });
  }
  const shown = out.filter(x => x.main !== 'Персонаж');
  return { out, shown, character: out.find(x => x.main === 'Персонаж') };
}

async function phone(browser) {
  const { pg, ctx, errors } = await page(browser, PHONE);
  const ev = await addEvent(pg);
  await clearPending(pg);
  // Ноль ответов: кроме очереди решения дают и состояния (помощь родителей, здоровье) — на этот обход их нет.
  await pg.evaluate(() => { window.__items272 = decisionItems24; decisionItems24 = () => []; render(); });
  let t = await phoneTour(pg, 'нет ответов');
  await pg.evaluate(() => { decisionItems24 = window.__items272; render(); });
  check(t.shown.every(x => x.strip), 'телефон: полоса на «Истории» (все 4 вкладки центра) и «Действиях»', t.shown.map(x => [x.main, x.sub, x.strip]));
  check(!t.character.strip, 'телефон: на «Персонаже» полосы нет', t.character);
  check(spread(t.shown, 'stripHeight') < 0.5 && spread(t.shown, 'stripTop') < 0.5, 'телефон: полоса одной высоты и на одном месте (' + t.shown[0].stripHeight + 'px)', t.shown.map(x => [x.sub || x.main, x.stripTop, x.stripHeight]));
  check(spread(t.shown, 'contentTop') < 0.5, 'телефон: содержимое под полосой начинается с одного y на всех вкладках (' + t.shown[0].contentTop + ')', t.shown.map(x => [x.sub || x.main, x.contentTop]));
  check(spread(t.shown.filter(x => x.main === 'История'), 'tabsTop') < 0.5, 'телефон: вкладки центра на одном y', t.shown.map(x => [x.sub, x.tabsTop]));
  const story = t.out[0];
  check(story.kind === 'waiting' && story.count === 0 && /Ожидают ответа · 0/.test(story.text) && /Пока ничего/.test(story.text), 'телефон «История»: «Ожидают ответа · 0 — пока ничего» и при нуле', story);
  const others = t.shown.filter(x => !(x.main === 'История' && x.sub === 'История'));
  check(others.every(x => x.kind === 'latest' && x.title === ev.title), 'телефон «Люди», «Личное дело», «Траектория», «Действия»: последнее событие', others.map(x => [x.sub || x.main, x.kind, x.title]));
  check(others.every(x => /−120 A\$/.test(x.text)), 'телефон: итог события (−120 A$) в полосе', others.map(x => x.text));
  check(t.out.every(x => !x.recent), 'телефон: карточки «Что произошло» нет', t.out.map(x => x.recent));
  check(t.out.every(x => !x.scrollX && !x.stripOverflow), 'телефон: без горизонтальной прокрутки', t.out.map(x => [x.scrollX, x.stripOverflow]));

  // Есть ответы: та же высота, число из decisionItems24, нажатие открывает решение.
  const pend = await addPending(pg);
  t = await phoneTour(pg, 'есть ответ');
  const story2 = t.out[0];
  check(story2.kind === 'waiting' && story2.count === pend.n && story2.count > 0, 'телефон «История»: «Ожидают ответа · ' + pend.n + '»', story2);
  check(spread(t.shown, 'stripHeight') < 0.5 && spread(t.shown, 'contentTop') < 0.5 && Math.abs(t.shown[0].contentTop - story.contentTop) < 0.5, 'телефон: с ответами полоса той же высоты и на том же месте', t.shown.map(x => [x.sub || x.main, x.stripHeight, x.contentTop]));
  check(t.out.filter(x => x.main === 'История' && x.sub !== 'История').every(x => x.kind === 'latest'), 'телефон «Люди», «Личное дело», «Траектория»: только последнее событие, без второй строки', t.out.map(x => [x.sub, x.kind]));
  await tap(pg, '#app>.top-strip270 .strip-waiting270 .strip-open270');
  let m = await pg.evaluate(() => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '' }));
  check(m.open && m.title.includes(pend.name), 'телефон: нажатие на «Ожидают ответа» открывает само решение', m);
  await reset(pg);
  await clearPending(pg);

  // Нажатие на последнее событие («Действия») открывает «Историю» на этой записи.
  await pg.click('.mobile-panels button:text-is("Действия")');
  await tap(pg, '#app>.top-strip270 .strip-latest270 .strip-open270');
  const op = await pg.evaluate(id => {
    const panel = document.querySelector('[data-panel="center"]'), a = [...panel.querySelectorAll('[data-event-id]')].find(n => n.dataset.eventId === id);
    const r = a?.getBoundingClientRect(), p = panel.getBoundingClientRect();
    return { panel: s.ui05.panel, tab, found: !!a, mark: !!a?.classList.contains('strip-target270'), visible: !!r && r.top >= p.top - 1 && r.top < p.bottom };
  }, ev.id);
  check(op.panel === 'center' && op.tab === 'story' && op.found && op.mark && op.visible, 'телефон: нажатие на событие открывает «Историю» на этой записи', op);

  // Часы: «Персонаж» и «Личное дело» держат время, «Действия» — нет (strip270).
  const run = () => pg.evaluate(() => { s.pending = []; if ($('#modal').open) closeModal(); s.clock.choiceActive = false; s.clock.resumeAfterChoice = false; s.clock.speed = 8; s.clock.running = true; clockStamp = Date.now(); clockCarry = 0; render(); return s.clock.ticks; });
  for (const [panel, tb, label, moves] of [['left', 'story', 'Персонаж', false], ['center', 'world', 'Личное дело', false], ['right', 'story', 'Действия', true]]) {
    await pg.evaluate(([p, t]) => { s.ui05.panel = p; tab = t; }, [panel, tb]);
    const t0 = await run();
    await wait(1600);
    const a = await pg.evaluate(() => { const x = { ticks: s.clock.ticks, label: document.querySelector('.clock-bar small')?.textContent || '' }; s.clock.running = false; return x; });
    check(moves ? a.ticks > t0 : a.ticks === t0, 'часы: на «' + label + '» ' + (moves ? 'время идёт' : 'месяцы не идут'), { t0, a });
  }
  await reset(pg);
  // Ход времени на «Действиях» не сдвигает колонку.
  const v1 = await pg.evaluate(() => { s.ui05.panel = 'right'; render(); return document.querySelector('[data-panel="right"]').getBoundingClientRect().top; });
  await pg.evaluate(() => { for (let i = 0; i < 3; i++) advanceMonth(); s.pending = []; if ($('#modal').open) closeModal(); render(); });
  const v2 = await pg.evaluate(() => document.querySelector('[data-panel="right"]').getBoundingClientRect().top);
  check(Math.abs(v1 - v2) < 0.5, 'телефон: после трёх месяцев колонка на том же месте', { v1, v2 });

  check(!errors.length, 'телефон: без ошибок страницы', errors);
  await ctx.close();
}

async function landscape(browser) {
  const { pg, ctx, errors } = await page(browser, LAND);
  await addEvent(pg);
  const out = [];
  for (const [p, t] of [['center', 'story'], ['center', 'people'], ['center', 'world'], ['center', 'trajectory'], ['right', 'story']]) {
    await pg.evaluate(([p, t]) => { s.ui05.panel = p; tab = t; render(); }, [p, t]);
    out.push(await pg.evaluate(phoneView));
  }
  check(out.every(x => x.strip) && spread(out, 'stripHeight') < 0.5 && spread(out, 'contentTop') < 0.5, 'телефон боком: полоса одной высоты (' + out[0].stripHeight + 'px), содержимое с одного y', out.map(x => [x.tab, x.panel, x.stripHeight, x.contentTop]));
  check(out.every(x => !x.scrollX && !x.stripOverflow), 'телефон боком: без горизонтальной прокрутки', out);
  check(!errors.length, 'телефон боком: без ошибок страницы', errors);
  await ctx.close();
}

async function wide(browser, viewport, name) {
  const { pg, ctx, errors } = await page(browser, viewport);
  const ev = await addEvent(pg);
  await clearPending(pg);
  const tour = async () => {
    const out = [];
    for (const sub of ['История', 'Люди', 'Личное дело', 'Траектория', 'История']) {
      await pg.click('.shell>.center .tabs button:text-is("' + sub + '")');
      await wait(30);
      out.push({ sub, ...(await pg.evaluate(wideView)) });
    }
    return out;
  };
  let out = await tour();
  check(out.every(x => x.sum), name + ': сводка над вкладками на всех четырёх вкладках', out.map(x => [x.sub, !!x.sum]));
  check(out.every(x => x.sum && x.tabs && x.sum.bottom <= x.tabs.top + 0.5 && x.sum.left >= x.left.right && x.sum.right <= x.right.left), name + ': сводка над вкладками центра, между колонкой персонажа и колонкой действий', out[0]);
  const card = out.map(x => x.card || {});
  check(spread(card, 'height') < 0.5 && spread(card, 'top') < 0.5, name + ': высота сводки не меняется между вкладками (' + (out[0].card?.height) + 'px)', card.map(c => [c.top, c.height]));
  check(spread(out.map(x => x.tabs || {}), 'top') < 0.5, name + ': вкладки центра на одном y', out.map(x => x.tabs?.top));
  check(new Set(out.map(x => x.text)).size === 1, name + ': содержимое сводки одно и то же на всех вкладках', out.map(x => x.text));
  check(out.every(x => !x.strip && !x.recent), name + ': ни полосы 270, ни карточки «Что произошло»', out.map(x => [x.strip, x.recent]));
  const fat = await pg.evaluate(() => Math.round(s.clock.fatigue));
  const n0 = await pg.evaluate(() => decisionItems24().length);
  check(out[0].title === ev.title && out[0].text.includes('Усталость ' + fat + '/100') && out[0].count === n0 && out[0].text.includes('Ожидают ответа · ' + n0), name + ': последнее событие, «Усталость ' + fat + '/100», «Ожидают ответа · ' + n0 + '»', out[0]);
  check(out[0].tags.join('|') === '−120 A$|Самочувствие: лучше', name + ': итоги события тегами', out[0].tags);
  check(out.every(x => !x.scrollX && !x.overflow), name + ': без горизонтальной прокрутки', out.map(x => [x.scrollX, x.overflow]));

  const pend = await addPending(pg);
  const out2 = await tour();
  check(out2.every(x => x.count === pend.n) && spread(out2.map(x => x.card || {}), 'height') < 0.5 && Math.abs(out2[0].card.height - out[0].card.height) < 0.5, name + ': с ответами — «Ожидают ответа · ' + pend.n + '», высота та же', out2.map(x => [x.count, x.card?.height]));
  await tap(pg, '.summary272 .sum-wait272');
  let m = await pg.evaluate(() => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '' }));
  check(m.open && /Ожидают/.test(m.title), name + ': «Ожидают ответа →» открывает общий список', m);
  await reset(pg);
  await clearPending(pg);
  await pg.click('.shell>.center .tabs button:text-is("Люди")');
  await tap(pg, '.summary272 .sum-event272');
  const op = await pg.evaluate(id => {
    const panel = document.querySelector('[data-panel="center"]'), a = [...panel.querySelectorAll('[data-event-id]')].find(n => n.dataset.eventId === id);
    const r = a?.getBoundingClientRect(), p = panel.getBoundingClientRect();
    return { tab, found: !!a, mark: !!a?.classList.contains('strip-target270'), visible: !!r && r.top >= p.top - 1 && r.top < p.bottom };
  }, ev.id);
  check(op.tab === 'story' && op.found && op.mark && op.visible, name + ': нажатие на событие открывает «Историю» на этой записи', op);
  // Обучение и стартовое окно: сводки нет, как и полосы.
  const blocked = await pg.evaluate(() => { const keep = tutorialActive180; tutorialActive180 = () => true; render(); const x = !!document.querySelector('.summary272'); tutorialActive180 = keep; render(); return { during: x, after: !!document.querySelector('.summary272') }; });
  check(!blocked.during && blocked.after, name + ': во время обучения сводки нет, после — есть', blocked);
  // Часы на широком экране «Личное дело» не держат (strip270).
  await pg.evaluate(() => { tab = 'world'; s.ui05.panel = 'left'; s.clock.speed = 8; s.clock.running = true; clockStamp = Date.now(); clockCarry = 0; render(); });
  const t0 = await pg.evaluate(() => s.clock.ticks);
  await wait(1600);
  const t1 = await pg.evaluate(() => { const t = s.clock.ticks; s.clock.running = false; s.pending = []; if ($('#modal').open) closeModal(); return t; });
  check(t1 > t0, name + ': часы идут на любой вкладке', { t0, t1 });
  check(!errors.length, name + ': без ошибок страницы', errors);
  await ctx.close();
}

// «Моя работа»: портфолио и своё дело под карточкой текущей работы.
async function work(browser, viewport, name) {
  const { pg, ctx, errors } = await page(browser, viewport);
  const setup = await pg.evaluate(() => {
    s.cash += 900000;
    const ok = [startEnterprise152('shop', 'Полка', 'books')];
    const a = s.enterprise152;
    ok.push(startEnterprise152('shop', 'Полка на набережной', 'books', true));
    const b = s.enterprise152;
    ok.push(formEnterpriseNetwork168([a.id, b.id], 'Книжные «Полка»'));
    ok.push(startEnterprise152('studio', 'Светлая комната', 'photo', true));
    const c = s.enterprise152;
    a.history.push({ tick: s.clock.ticks, sales: 9000, costs: 12000, paid: 12000, cash: a.cash });
    b.history.push({ tick: s.clock.ticks, sales: 7000, costs: 6500, paid: 6500, cash: b.cash });
    c.history.push({ tick: s.clock.ticks, sales: 11000, costs: 8000, paid: 8000, cash: c.cash });
    const w = (track, q, i) => creative47().works.push({ id: 'v272-' + track + i, track, quality: q, tick: s.clock.ticks, kind: 'sample', title: 'Проба ' + i });
    for (let i = 0; i < 5; i++) w('literature', 60 + i * 5, i);
    w('journalism', 48, 0); w('journalism', 52, 1);
    portfolioState60().tracks.push('music');
    s.ui05.panel = 'center'; tab = 'trajectory'; path16().view.section = 'jobs'; render();
    return { ok, net: s.enterpriseNetworks168.find(n => n.title === 'Книжные «Полка»')?.id, studio: c.id, main: ownedPortfolios60()[0], names: ownedPortfolios60().map(k => trackNames46[k]) };
  });
  check(setup.ok.every(Boolean), name + ': стенд — два магазина в сети и фотостудия', setup);
  const v = await pg.evaluate(() => {
    const box = document.querySelector('.work-sum272'), r = n => { const b = n.getBoundingClientRect(); return { top: Math.round(b.top), left: Math.round(b.left), bottom: Math.round(b.bottom), width: Math.round(b.width) }; };
    const prev = box?.previousElementSibling;
    return {
      found: !!box, after: prev?.classList.contains('path-card') ? prev.querySelector('.eyebrow')?.textContent || prev.querySelector('h2')?.textContent : null,
      first: prev === document.querySelector('[data-panel="center"] .path-card'),
      cards: box ? [...box.children].map(r) : [], creative: box?.querySelector('.work-creative272')?.textContent.replace(/\s+/g, ' ') || '',
      own: box?.querySelector('.work-own272')?.textContent.replace(/\s+/g, ' ') || '',
      minis: [...(box?.querySelectorAll('.work-mini272') || [])].map(n => n.textContent.replace(/\s+/g, ' ')),
      loss: [...(box?.querySelectorAll('.work-loss272') || [])].map(n => n.querySelector('strong').textContent),
      scrollX: document.documentElement.scrollWidth > innerWidth + 1,
      has2721: typeof bzStatus272 === 'function'
    };
  });
  check(v.found && v.first, name + ': сводка сразу под карточкой текущей работы', v);
  check(/Литературоведение и редактура/.test(v.creative) && /Работ: 5/.test(v.creative) && /качество 75\/100/.test(v.creative), name + ': главное портфолио — направление, работы, качество', v.creative);
  check(v.minis.length === 2 && /Журналистика.*2 работы.*50\/100/.test(v.minis.join('|')) && /Музыка.*0 работ/.test(v.minis.join('|')), name + ': остальные портфолио — строками', v.minis);
  check(/Книжные «Полка»/.test(v.own) && /Книжный магазин/.test(v.own) && /2 точки/.test(v.own) && /Светлая комната/.test(v.own) && /Фотостудия/.test(v.own), name + ': своё дело — название, вид, точки', v.own);
  check(/Прошлый месяц: −2\s?500 A\$/.test(v.own) && /Прошлый месяц: \+3\s?000 A\$/.test(v.own), name + ': итог прошлого месяца по сети и по студии', v.own);
  if (!v.has2721) check(v.loss.length === 1 && v.loss[0] === 'Книжные «Полка»' && /Дело в минусе/.test(v.own), name + ': предупреждение о минусе только у сети в минусе', v);
  else {
    // 272.1: строка под делом — статус из карточки (bzStatus272). Новое дело в минусе — «Первый год», без красного;
    // дело старше года в устойчивом минусе — красная рамка «Дело в минусе».
    check(v.loss.length === 0 && /Первый год: пока в минусе/.test(v.own), name + ': новое дело в минусе — «Первый год», без красной рамки', v);
    const old = await pg.evaluate(() => {
      const net = s.enterpriseNetworks168.find(n => n.title === 'Книжные «Полка»'), pts = ownedEnterprises168().filter(b => net.ids.includes(b.id)), t = s.clock.ticks;
      for (const b of pts) { b.opened159 = t - 30; b.history = []; for (let k = 12; k >= 0; k--) b.history.push({ tick: t - k, sales: 6000, costs: 9000, paid: 9000, cash: 20000 }); b.cash = 20000; }
      render();
      const box = document.querySelector('.work-sum272');
      return { loss: [...(box?.querySelectorAll('.work-loss272') || [])].map(n => n.querySelector('strong').textContent), own: box?.querySelector('.work-own272')?.textContent.replace(/\s+/g, ' ') || '' };
    });
    check(old.loss.length === 1 && old.loss[0] === 'Книжные «Полка»' && /Дело в минусе/.test(old.own), name + ': дело в устойчивом минусе — красная рамка только у него', old);
  }
  if (viewport.width > 1000) check(v.cards.length === 2 && Math.abs(v.cards[0].top - v.cards[1].top) < 2 && v.cards[1].left > v.cards[0].left + v.cards[0].width - 2, name + ': портфолио и дело — рядом в две колонки', v.cards);
  else check(v.cards.length === 2 && v.cards[1].top >= v.cards[0].bottom, name + ': портфолио и дело — одно под другим', v.cards);
  check(!v.scrollX, name + ': без горизонтальной прокрутки', v);
  // Каждый пункт открывает своё меню.
  const modal = () => pg.evaluate(() => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '', ent: s.enterprise152?.id }));
  await tap(pg, '.work-creative272 .work-main272');
  let m = await modal();
  check(m.open && m.title === 'Портфолио · ' + setup.names[0], name + ': главное портфолио открывает своё меню', m);
  await reset(pg);
  await tap(pg, '.work-mini272:has-text("Журналистика")');
  m = await modal();
  check(m.open && m.title === 'Портфолио · Журналистика', name + ': строка портфолио открывает своё меню', m);
  await reset(pg);
  await tap(pg, '.work-business272:has-text("Книжные «Полка»")');
  m = await modal();
  check(m.open && m.title === 'Книжные «Полка»', name + ': сеть открывает выбор точки', m);
  await reset(pg);
  await pg.evaluate(() => render());
  await tap(pg, '.work-business272:has-text("Светлая комната")');
  m = await modal();
  check(m.open && m.ent === setup.studio && /Светлая комната/.test(m.title), name + ': дело открывает своё меню', m);
  await reset(pg);
  check(!errors.length, name + ': без ошибок страницы', errors);
  await ctx.close();
}

// Настоящее сохранение (OWNER=…): полоса и сводка постоянны, портфолио на месте.
async function owner(browser, file) {
  {
    const { pg, ctx, errors } = await page(browser, PHONE, file);
    const t = await phoneTour(pg, 'сохранение');
    check(t.shown.every(x => x.strip) && !t.character.strip && spread(t.shown, 'stripHeight') < 0.5 && spread(t.shown, 'contentTop') < 0.5, 'сохранение, телефон: полоса постоянна', t.out.map(x => [x.sub || x.main, x.strip, x.stripHeight, x.contentTop, x.kind]));
    const w = await pg.evaluate(() => { s.ui05.panel = 'center'; tab = 'trajectory'; path16().view.section = 'jobs'; render(); return { text: document.querySelector('.work-sum272')?.textContent.replace(/\s+/g, ' ') || '', main: trackNames46[ownedPortfolios60()[0]] }; });
    check(!w.main || w.text.includes(w.main), 'сохранение: «Моя работа» показывает портфолио ' + w.main, w);
    check(!errors.length, 'сохранение, телефон: без ошибок страницы', errors);
    await ctx.close();
  }
  {
    const { pg, ctx, errors } = await page(browser, WIDE, file);
    const out = [];
    for (const sub of ['История', 'Люди', 'Личное дело', 'Траектория']) {
      await pg.click('.shell>.center .tabs button:text-is("' + sub + '")');
      out.push(await pg.evaluate(wideView));
    }
    check(out.every(x => x.sum) && spread(out.map(x => x.card || {}), 'height') < 0.5 && spread(out.map(x => x.tabs || {}), 'top') < 0.5, 'сохранение, широкий: сводка постоянна', out.map(x => [x.card?.height, x.tabs?.top]));
    check(!errors.length, 'сохранение, широкий: без ошибок страницы', errors);
    await ctx.close();
  }
}

(async () => {
  const browser = await chromium.launch();
  console.log(BASE ? 'BASE=1: без layout272.js' : INDEX.includes('layout272.js') ? 'layout272.js из index.html' : 'layout272.js подгружен после старта');
  await phone(browser);
  await landscape(browser);
  await wide(browser, WIDE, 'широкий 1280');
  await wide(browser, MID, 'широкий 1024');
  await work(browser, WIDE, '«Моя работа», широкий');
  await work(browser, PHONE, '«Моя работа», телефон');
  if (process.env.OWNER) await owner(browser, process.env.OWNER);
  await browser.close();
  console.log(`\n${pass} ok, ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
