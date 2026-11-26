// Проверки сборки 273.1 (people2731.js): карточка человека (personDetail) и карточка ребёнка (childOverview55).
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2731_people.js
// BASE=1 — прогон без people2731.js (windows273.js остаётся): видно, какие проверки ловят старое поведение.
// SAVE=файл — ещё и на настоящем сохранении (экспорт «Ваши персонажи»; берётся последний персонаж). Без него — только
// две новые жизни. SHOTS=папка — снимки окон на этом сохранении и карточек ребёнка на новой жизни «до» (без people2731.js)
// и «после», 390 и 1280.
// Что проверяется:
// • все кнопки действий с человеком (главные и строка «Ещё») видны без прокрутки на 390×844 и на 1280×800; где была
//   первая кнопка без карточки (экран по счёту);
// • набор кнопок окна совпадает с окном без people2731.js — ни одна не потерялась, новых нет, кроме кнопок «Ответить»
//   у просьб; у каждой та же доступность и обработчик; каждая нажимается и ведёт туда же (то же окно, то же состояние);
// • числа наверху равны числам игры: близость, доверие и напряжение — строке «Отношения» таблицы personSections42,
//   доверие и усталость ребёнка — таблице childOverview55, успеваемость — окну schoolMenu, помощь в быту — строке
//   aging58; проверка оценок случается в тот месяц, что написан в карточке (academicsMonth → gradeTerm);
// • просьба ребёнка из «Ожидают ответа» стоит наверху и открывает то же окно, что openDecision24;
// • в «Подробнее» даты вместо «Месяц 591», новые записи сверху, без сырого «discuss»;
// • «Подробнее» запоминается по виду окна и не попадает в сохранение;
// • срок у просьбы («Ответить · до конца …») — последний месяц, в котором она ещё в «Ожидают ответа» (время идёт
//   по-настоящему; просьбы ребёнка ждут только до месяца срока, просьба о помощи в быту — и в нём);
// • на 360×740 (маленький телефон) у детей с секцией и просьбой все главные кнопки и строка «Ещё» видны без прокрутки,
//   «Открыть карточку» — в подвале окна;
// • тайные отношения: «Связь» в «Подробнее» не говорит «Друг», заголовок «Другие действия» цел, без карточки «Связь» —
//   «Тайный партнёр», как раньше (social255);
// • все живые люди (на сохранении — все 150+): роль под именем по полу, бывший сотрудник не спорит с «Сейчас»,
//   в «Подробнее» нет повторов верха («Где живёт», «Пара», «Помощь»), подпись «Подробнее» обещает только то, что в нём
//   есть, «Предложить тайные отношения» с невыполненными условиями — не в «Ещё», в «Ещё» у этой кнопки одно условие;
// • «Последняя встреча»: после настоящей встречи (planMeeting53) — её месяц и название;
// • ошибок на странице нет.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', SAVE = process.env.SAVE || '', SHOTS = process.env.SHOTS || '';
const PHONE = { width: 390, height: 844 }, WIDE = { width: 1280, height: 800 }, SMALL = { width: 360, height: 740 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 900) : '')); };
const note = t => console.log('     ' + t);

async function page(browser, { viewport = PHONE, base = BASE, raw = null, country = 'ru', seed = 2731 } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && base ? INDEX.replace(/<script src="people2731\.js[^"]*"><\/script>/g, '') : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (raw) await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  else {
    await pg.evaluate(c => { for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, country);
    await pg.evaluate(seed => { Math.random = seeded269(seed); [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click(); }, seed);
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = []; s.clock.running = false;
    try { localStorage.clear(); } catch (e) {}
  });
  await pg.evaluate(helpers);
  return { pg, ctx, errors };
}

// Помощники внутри страницы.
function helpers() {
  // Подпись — текст самой кнопки без подсказок <small>; у кнопки «Предложить встречаться» (romance63) — <strong>.
  // У кнопки просьбы — её исправление («Ответить · до …»).
  window.__label = b => b.classList.contains('fix273') ? (b.querySelector('small')?.textContent || '').replace(/\s+/g, ' ').trim() : ([...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('') || b.querySelector('strong')?.textContent || '').replace(/\s+/g, ' ').trim();
  window.__buttons = () => [...document.querySelectorAll('#modal button')].filter(b => !b.closest('.modal-closebar38'));
  window.__labels = () => __buttons().map(b => ({ label: __label(b), disabled: b.disabled, option: !!b.closest('.options'), handler: !!(b.onclick || b.getAttribute('onclick')), fix: b.classList.contains('fix273'), place: b.closest('.main273') ? 'main' : b.closest('.setopts273') ? 'more' : b.closest('.foot273') ? 'foot' : b.closest('details.more273') ? 'details' : b.closest('.need273') ? 'need' : 'plain' }));
  window.__title = () => $('#modal').open ? document.querySelector('#modal h2')?.textContent || '' : '(закрыто)';
  window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
  // Положение кнопки: в пределах экрана без прокрутки и номер «экрана» окна, на котором она стоит.
  window.__where = b => {
    const m = $('#modal'); m.scrollTop = 0;
    const r = b.getBoundingClientRect(), mr = m.getBoundingClientRect(), y = r.top - mr.top + m.scrollTop;
    return { label: __label(b), fold: r.top >= mr.top && r.bottom <= Math.min(mr.bottom, innerHeight) + 0.5 && r.height > 0, screen: Math.floor(y / m.clientHeight) + 1, y: Math.round(y), h: Math.round(r.height), foldAt: Math.round(Math.min(mr.bottom, innerHeight) - mr.top), modalH: m.scrollHeight, disabled: b.disabled };
  };
  window.__top = () => Object.fromEntries([...document.querySelectorAll('#modal .top273 .row273')].map(r => [r.querySelector('dt').textContent, { value: r.querySelector('dd').childNodes[0]?.textContent || '', note: r.querySelector('dd small')?.textContent || '' }]));
  window.__need = () => [...document.querySelectorAll('#modal .need273 .fix273')].map(e => ({ text: e.querySelector('span')?.textContent || '', fix: e.tagName === 'BUTTON', small: e.querySelector('small')?.textContent || '' }));
  window.__month = (n = 1) => { for (let i = 0; i < n; i++) { __close(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } __close(); advanceMonth(); } __close(); };
  // Таблица окна, как её отдала игра (nextDetail20 в момент show() с этим заголовком).
  window.__table = (fn, title) => { let t = null; const real = show; show = function (x, ...r) { if (t === null && x === title) t = nextDetail20 ? JSON.parse(JSON.stringify(nextDetail20)) : {}; return real.call(this, x, ...r); }; try { fn(); } finally { show = real; } return t; };
  window.__row = (t, label, section) => (t?.sections || []).flatMap(g => (g.rows || []).map(r => ({ ...r, section: g.title }))).find(r => r.label === label && (!section || r.section === section))?.value || '';
  // Состояние жизни для сравнения «нажали — пришли туда же»: без служебных полей, как в modal38.
  window.__sig = () => { const t = JSON.stringify(s, (k, v) => ['savedAt', 'saveId', 'running', 'resumeAfterChoice', 'choiceActive', 'view', 'tab', 'showAllPeople', 'serial'].includes(k) ? undefined : v); let h = 0; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0; return h; };
  window.__press = label => {
    const b = __buttons().find(b => __label(b) === label);
    if (!b) return { missing: label };
    if (b.disabled) return { disabled: true };
    try { b.click(); } catch (e) { return { error: String(e) }; }
    return { title: __title(), sig: __sig() };
  };
  window.__snap = () => { window.__saved = JSON.stringify(s); };
  window.__restore = () => { __close(); s = JSON.parse(window.__saved); s.pending = []; s.clock.running = false; Math.random = seeded269(2731); };
  window.save = function () {}; if (typeof flushSave264 === 'function') window.flushSave264 = function () {};
}

// Сценарии готовят жизнь и возвращают окна: [вид, функция, id]. Новая жизнь готовится один раз и потом загружается
// одинаково в оба режима.
function setupOwner() {
  const v = [], P = currentPartner(), alive = s.people.filter(p => p.alive);
  const add = (key, fn, p) => { if (p && !v.some(x => x[1] === fn && x[2] === p.id)) v.push([key, fn, p.id]); };
  add('партнёр', 'personDetail', P);
  add('взрослый ребёнок', 'personDetail', alive.filter(p => ownChild53(p) && p.age >= 18).sort((a, b) => b.bond - a.bond)[0]);
  add('мать', 'personDetail', alive.find(p => p.role === 'Мать'));
  add('отец', 'personDetail', alive.find(p => p.role === 'Отец'));
  add('друг', 'personDetail', alive.filter(p => p.role === 'Друг').sort((a, b) => b.bond - a.bond)[0]);
  add('внук', 'personDetail', alive.find(p => p.age < 18));
  add('партнёр близкого', 'personDetail', alive.find(p => p.role === 'Партнёр близкого'));
  add('партнёрша близкого', 'personDetail', alive.find(p => p.role === 'Партнёр близкого' && p.gender === 'f'));
  add('бывший сотрудник', 'personDetail', alive.find(p => p.role === 'Сотрудник своего дела' && /^Бывший сотрудник/.test(p.occupation || '')));
  add('знакомый', 'personDetail', alive.filter(p => p.role === 'Знакомый' && p.age >= 18).sort((a, b) => b.bond - a.bond)[0]);
  add('память', 'personDetail', s.people.filter(p => !p.alive && p.died54).at(-1));
  // Тайные отношения с другом и со знакомым (romance63, social255): у игрока есть партнёр.
  if (P) {
    const used = new Set(v.map(x => x[2]));
    const picks = ['Друг', 'Знакомый'].map(role => alive.find(p => p.role === role && p.age >= 18 && !used.has(p.id))).filter(Boolean);
    s.familyLife.sideRelationships63 = picks.map(p => ({ otherId: p.id, since: s.clock.ticks - 5, status: 'active' }));
    for (const p of picks) add('тайная связь · ' + p.role.toLowerCase(), 'personDetail', p);
  }
  return v;
}
function setupFresh() {
  s.age = 38; s.year += 20; for (const q of s.people) q.age += 20; s.cash += 900000;
  const p = person('Знакомый', 39, 'm'); p.city18 = residenceCity(); s.people.push(p); enrichPerson(p);
  p.role = 'Партнер'; p.partnerSince = s.year - 16; p.cohabit = true; p.married = true; p.inner.affection = 80; p.inner.trust = 75; p.bond = 80;
  const mk = (age, g) => { const c = person('Ребенок', age, g); c.parentId = p.id; c.birth49 = { method: 'birth', parents: ['player', p.id] }; c.bond = 75; c.city18 = residenceCity(); s.people.push(c); enrichPerson(c); return c; };
  const k3 = mk(3, 'm'), k7 = mk(7, 'f'), k9 = mk(9, 'f'), k12 = mk(12, 'm'), k15 = mk(15, 'm'), k17 = mk(17, 'f');
  familySchoolState(); familyState27(); ensureRelations();
  // У девятилетней — секция и усталость, у двенадцатилетнего — три секции (одна на паузе) и сильная усталость,
  // у семилетней — болезнь, у пятнадцатилетнего — частная школа и низкие оценки.
  const a9 = childState55(k9); a9.clubs.push({ id: 'verify2731-club', type: 'kidsArt23', status: 'active', sessions: 12 }); a9.fatigue = 63;
  const a12 = childState55(k12), types = Object.keys(clubsCatalog19);
  a12.clubs.push({ id: 'verify2731-c1', type: types[0], status: 'paused', sessions: 3 }, { id: 'verify2731-c2', type: types[1], status: 'active', sessions: 5 }, { id: 'verify2731-c3', type: types[2], status: 'active', sessions: 5 }); a12.fatigue = 81;
  const a7 = childState55(k7); a7.illness = { status: 'active', name: 'грипп' }; a7.fatigue = 40;
  k15.school.type = 'private'; k15.school.grades = 36; k15.school.badTerms = 1;
  try { childOffer55(k9, 'club'); } catch (e) {}
  try { childOffer55(k15, 'introduce'); } catch (e) {}
  try { childOffer55(k12, 'camp'); } catch (e) {}
  try { childOffer55(k17, 'introduce'); } catch (e) {}
  const mom = s.people.find(q => q.alive && q.role === 'Мать');
  if (mom) {
    mom.age = 72; updateAging58(mom);
    // Помощь в быту, которую мать оплачивает сама (aging58: care.mode 'serviceSelf'), и её просьба о помощи — срок
    // включительно (aging58: q.expires>=ticks), в отличие от просьб ребёнка.
    mom.aging58.need = Math.max(mom.aging58.need || 0, 3); mom.aging58.care = { mode: 'serviceSelf', status: 'active' };
    generations58().requests.push({ id: 'verify2731-elder', person: mom.id, status: 'offered', created: s.clock.ticks, expires: s.clock.ticks + 4, title: mom.name + ': нужна помощь в быту' });
  }
  const friend = s.people.find(q => q.alive && q.role === 'Друг');
  if (friend) { friend.country = s.country; friend.city18 = residenceCity(); }
  // Умерший друг: запись о смерти — как в events54 (died54) и game.js (deathNote).
  const gone = person('Друг', 40, 'f'); s.people.push(gone); enrichPerson(gone); remember(gone, 'обсудили его собственные планы: discuss');
  gone.alive = false; gone.deathNote = 'Последняя общая запись: ' + gone.memories.at(-1) + '.'; gone.died54 = { tick: s.clock.ticks - 2, year: s.year, age: 40 };
  // Новости близкого с номерами месяцев (autonomy55) у матери.
  if (mom) { const ag = adultState55(mom); ag.history.push({ tick: s.clock.ticks - 30, text: 'Собственный план: Своё увлечение' }, { tick: s.clock.ticks - 4, text: 'Завершён план: Своё увлечение' }); }
  return [['партнёр', 'personDetail', p.id], ['дочь 9 · человек', 'personDetail', k9.id], ['дочь 9 · ребёнок', 'childOverview55', k9.id],
    ['сын 15 · ребёнок', 'childOverview55', k15.id], ['сын 15 · человек', 'personDetail', k15.id], ['сын 3 · ребёнок', 'childOverview55', k3.id], ['сын 3 · человек', 'personDetail', k3.id],
    ['дочь 7 болеет · ребёнок', 'childOverview55', k7.id], ['сын 12 · ребёнок', 'childOverview55', k12.id], ['сын 12 · человек', 'personDetail', k12.id],
    ['дочь 17 · ребёнок', 'childOverview55', k17.id], ['дочь 17 · человек', 'personDetail', k17.id],
    ...(mom ? [['мать', 'personDetail', mom.id]] : []), ...(friend ? [['друг', 'personDetail', friend.id]] : []), ['память', 'personDetail', gone.id]];
}
function setupTeen() {
  // Игроку 16: «Помощь и временное жильё» спрятана, у близких — «Дружеские встречи и занятия».
  s.age = 16; for (const q of s.people) q.age = Math.max(1, q.age - 2);
  const alive = s.people.filter(p => p.alive);
  const v = [];
  for (const p of [alive.find(p => p.role === 'Мать'), alive.find(p => p.role === 'Отец'), alive.find(p => p.role === 'Друг'), alive.find(p => ['Брат', 'Сестра'].includes(p.role))]) if (p) v.push([p.role, 'personDetail', p.id]);
  return v;
}

async function prepare(browser, name, opts) {
  const P = await page(browser, { ...opts, base: true });
  await P.pg.evaluate(() => { Math.random = seeded269(27311); });
  const v = await P.pg.evaluate(name === 'owner' ? setupOwner : name === 'teen' ? setupTeen : setupFresh);
  const raw = await P.pg.evaluate(() => JSON.stringify({ format: 'life-side-effects', version: 1, lives: [s] }));
  await P.ctx.close();
  return { v, raw };
}

// Снимок окна: кнопки, где они, верх карточки, таблица игры.
async function look(pg, win) {
  return pg.evaluate(async ([kind, fn, id]) => {
    __close(); window[fn](id); await new Promise(r => setTimeout(r, 0));
    const p = s.people.find(p => p.id === id);
    const b = __buttons(), lbls = __labels();
    const actions = b.filter(x => x.closest('.main273,.setopts273')).map(__where);
    const firstBase = b.find(x => !x.classList.contains('fix273') && !x.closest('.foot273') && !/^Закрыть$/.test(__label(x)));
    return { kind, title: __title(), labels: lbls, actions, first: firstBase ? __where(firstBase) : null, top: __top(), need: __need(), card: !!document.querySelector('#modal .top273'), area: document.querySelector('#modal .eyebrow')?.textContent || '', sub: document.querySelector('#modal .sub273')?.textContent || '', pic: !!document.querySelector('#modal .sub273 .person-portrait42'), hadPic: !!document.querySelector('#modal .person-portrait42'), name: p?.name || '', role: p?.role || '', links: [...document.querySelectorAll('#modal .detail-row20')].filter(r => r.querySelector('dt')?.textContent.trim() === 'Связь').map(r => r.querySelector('dd')?.textContent.trim() || ''), othersH: document.querySelector('#modal .others-h273')?.textContent || null };
  }, win);
}

async function scenario(browser, name, prep) {
  const out = {};
  // Снимки: все окна на сохранении и карточки ребёнка на новой жизни (у взрослых детей сохранения карточки ребёнка нет).
  const shot = w => SHOTS && (name === 'owner' || name === 'family' && w[1] === 'childOverview55');
  const modes = [['base', true, PHONE], ['new', false, PHONE], ['wide', false, WIDE], ['small', false, SMALL], ...(SHOTS && name !== 'teen' ? [['widebase', true, WIDE]] : [])];
  for (const [mode, base, vp] of modes) {
    if (BASE && mode !== 'base') continue;
    const P = await page(browser, { raw: prep.raw, base, viewport: vp });
    await P.pg.evaluate(() => __snap());
    const r = { wins: {}, press: {}, tables: {} };
    for (const w of prep.v) {
      await P.pg.evaluate(() => __restore());
      r.wins[w[0]] = await look(P.pg, w);
      if (shot(w)) {
        const file = path.join(SHOTS, name + '-' + w[0].replace(/[^a-zа-яё0-9]+/gi, '_') + '-' + vp.width + '-' + (base ? 'before' : 'after') + '.png');
        await P.pg.evaluate(() => { $('#modal').scrollTop = 0; });
        await P.pg.screenshot({ path: file });
      }
      if (mode === 'base') r.tables[w[0]] = await P.pg.evaluate(([k, fn, id]) => { __restore(); const p = s.people.find(p => p.id === id); return __table(() => window[fn](id), p.name); }, w);
      // Тайные отношения без карточки: «Связь» в таблице (social255) — «Тайный партнёр», как было.
      if (mode === 'base' && /^тайная связь/.test(w[0])) r.side = { ...(r.side || {}), [w[0]]: await P.pg.evaluate(async ([k, fn, id]) => { __restore(); __close(); window[fn](id); await new Promise(r => setTimeout(r, 0)); return [...document.querySelectorAll('#modal .detail-row20')].find(r => r.querySelector('dt')?.textContent === 'Связь')?.querySelector('dd')?.textContent || null; }, w) };
    }
    // Каждая кнопка: нажать в том же состоянии и записать, куда привело (только телефон).
    if (mode === 'base' || mode === 'new') for (const w of prep.v) {
      for (const l of r.wins[w[0]].labels) {
        if (l.fix) continue;
        await P.pg.evaluate(() => __restore());
        await P.pg.evaluate(async ([k, fn, id]) => { __close(); window[fn](id); await new Promise(r => setTimeout(r, 0)); }, w);
        r.press[w[0] + ' / ' + l.label] = await P.pg.evaluate(label => __press(label), l.label);
      }
    }
    if (mode === 'new') { r.extra = await extraChecks(P.pg, prep.v); r.sweep = await sweep(P.pg, name === 'owner' ? null : prep.v); }
    r.errors = P.errors.slice();
    out[mode] = r;
    await P.ctx.close();
  }
  return out;
}

// Проверки, которые не сводятся к сравнению с окном без карточки: числа, даты, просьбы, «Подробнее».
async function extraChecks(pg, wins) {
  return pg.evaluate(async wins => {
    const x = { nums: [], more: null, dates: [], asks: [], school: [] };
    const num = (t, re) => { const m = re.exec(t || ''); return m ? +m[1] : null; };
    for (const [k, fn, id] of wins) {
      __restore(); const p = s.people.find(p => p.id === id); if (!p?.alive) continue;
      __close(); window[fn](id); await new Promise(r => setTimeout(r, 0));
      const top = __top(), rel = top['Отношения'] || {};
      const card = { close: num(rel.value, /Близость (\d+)/), trust: num(rel.note, /доверие (\d+)/), strain: num(rel.note, /напряжение (\d+)/) };
      // Таблица игры — personSections42, строка «Отношения».
      const t = personSections42(p).find(g => g.title === 'О человеке')?.rows.find(r => r.label === 'Отношения')?.value || '';
      const game = { close: num(t, /Близость (\d+)/), trust: num(t, /доверие (\d+)/), strain: num(t, /напряжение (\d+)/) };
      const row = { k, card, game, ok: JSON.stringify(card) === JSON.stringify(game) };
      if (fn === 'childOverview55') {
        // Доверие и усталость — из таблицы окна ребёнка, успеваемость — из окна школы. Близость и доверие ребёнка
        // наверху карточки ребёнка не стоят (они в карточке человека): «Доверие» остаётся в «Подробнее».
        const shown = [...document.querySelectorAll('#modal .more273 .detail-row20')].find(r => r.querySelector('dt')?.textContent.trim() === 'Доверие')?.querySelector('dd')?.textContent || '';
        const base = __table(() => peopleBase2731.childOverview55(id), p.name);
        row.card = { trust: num(shown, /^(\d+)/) }; row.game = null;
        row.trustTable = num(__row(base, 'Доверие'), /^(\d+)/); row.ok = !top['Отношения'] && row.trustTable !== null && row.trustTable === row.card.trust;
        const tired = [top['Кружки'], top['Здоровье']].map(r => r ? r.value + ' ' + r.note : '').join(' '); if (/усталость/.test(tired)) { row.tired = num(tired, /усталость (\d+)/); row.tiredTable = num(__row(base, 'Усталость'), /^(\d+)/); row.ok = row.ok && row.tired === row.tiredTable; }
        if (p.age >= 6 && p.age < 18) {
          __close(); let text = ''; const real = show; show = function (tt, tx, ...r) { if (!text) text = String(tx || ''); return real.call(this, tt, tx, ...r); }; try { schoolMenu(id); } finally { show = real; }
          row.grades = num(top['Школа']?.value, /Успеваемость (\d+)\/100/); row.gradesGame = num(text, /Успеваемость (\d+)\/100/); row.ok = row.ok && row.grades === row.gradesGame && row.grades !== null;
          // Проверка оценок: в какой месяц gradeTerm на самом деле посмотрит на этого ребёнка.
          const promised = (/проверка оценок (в [^·:]+?)(?:[:·]|$)/.exec(top['Школа']?.note || '') || [])[1]?.trim() || null;
          // Месяц проверки — тот, что игрок увидит после хода (во время хода x.month ещё прежний): тик записываем, дату берём после.
          let tick = null; const gt = gradeTerm; gradeTerm = function (a, pid, kind) { if (pid === id && kind === 'school' && tick === null) tick = s.clock.ticks; return gt.apply(this, arguments); };
          try { for (let i = 0; i < 4 && tick === null; i++) __month(1); } finally { gradeTerm = gt; }
          const when = tick === null ? null : inMonth273(tick);
          x.school.push({ k, promised, when, warn: top['Школа']?.note || '', grades: row.grades });
        }
      }
      if (p.aging58?.need > 0) { row.help = num(top['Здоровье']?.note, /^(\d+) ч\/нед/); row.helpTable = num(personSections42(p).find(g => g.title === 'Возраст и помощь')?.rows.find(r => r.label === 'Помощь')?.value, /^(\d+)/); row.ok = row.ok && row.help === row.helpTable; }
      x.nums.push(row);
    }
    // Просьбы: строка наверху и кнопка «Ответить» открывает то же окно, что «Ожидают ответа».
    for (const [k, fn, id] of wins) {
      __restore(); const p = s.people.find(p => p.id === id); if (!p?.alive) continue;
      const items = decisionItems24().filter(it => Object.entries(it.q || {}).some(([key, v]) => v === id && key !== 'decisionId24'));
      if (!items.length) continue;
      __close(); window[fn](id); await new Promise(r => setTimeout(r, 0));
      const need = __need(), b = document.querySelector('#modal .need273 button.fix273');
      let via = null; if (b) { b.click(); via = __title(); }
      __restore(); __close(); openDecision24(items[0].ref.kind, items[0].ref.id); const want = __title();
      x.asks.push({ k, need, via, want, count: items.length });
    }
    // «Подробнее»: даты, порядок, сырые значения; запоминается по виду окна.
    for (const [k, fn, id] of wins) {
      __restore(); __close(); window[fn](id); await new Promise(r => setTimeout(r, 0));
      const d = document.querySelector('#modal details.more273'); if (!d) continue;
      d.open = true;
      const all = document.querySelector('#modal .more273').innerText;
      const months = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
      const order = [...document.querySelectorAll('#modal .more273 .detail-section20, #modal .more273 section')].map(sec => [...sec.querySelectorAll('.detail-row20 dt, dt')].map(dt => dt.textContent.trim())).map(list => list.map(l => { const m = /^(\S+) (\d{4})$/.exec(l); return m && months.includes(m[1]) ? +m[2] * 12 + months.indexOf(m[1]) : /^\d{4}$/.test(l) ? +l * 12 + 11 : null; }).filter(n => n !== null)).filter(l => l.length > 1);
      x.dates.push({ k, rawMonth: /Месяц \d+/.test(all), raw: /\b(discuss|support|distance)\b/.test(all), sorted: order.every(l => l.every((n, i) => !i || n <= l[i - 1])), sections: order.length, table: !!document.querySelector('#modal .more273 .detail20') });
      d.open = false;
    }
    { const [k, fn, id] = wins.find(w => w[1] === 'personDetail' && s.people.find(p => p.id === w[2])?.alive);
      const ch = wins.find(w => w[1] === 'childOverview55');
      const d = () => document.querySelector('#modal details.more273');
      __restore(); try { localStorage.clear(); } catch (e) {}
      __close(); window[fn](id); const was = d()?.open; d()?.querySelector('summary')?.click(); await new Promise(r => setTimeout(r, 30));
      __close(); window[fn](id); const kept = d()?.open;
      let other = null; if (ch) { __close(); childOverview55(ch[2]); other = d()?.open; }
      __close(); window[fn](id); d()?.querySelector('summary')?.click(); await new Promise(r => setTimeout(r, 30)); __close(); window[fn](id); const closed = d()?.open;
      let stored = null; try { stored = localStorage.getItem('more273:person'); } catch (e) {}
      x.more = { was, kept, other, closed, stored, inSave: JSON.stringify(s).includes('more273') }; __close(); }
    // Срок просьб: время идёт по-настоящему, для каждой просьбы из карточки записываем последний месяц, в котором она
    // ещё в «Ожидают ответа». Карточка должна назвать именно его.
    {
      __restore();
      const mine = id => it => Object.entries(it.q || {}).some(([key, v]) => v === id && key !== 'decisionId24');
      const track = [];
      for (const [k, fn, id] of wins) {
        const p = s.people.find(p => p.id === id); if (!p?.alive) continue;
        const items = decisionItems24().filter(mine(id)).slice(0, 4); if (!items.length) continue;
        __close(); window[fn](id); await new Promise(r => setTimeout(r, 0));
        const need = __need();
        items.forEach((it, i) => track.push({ k, kind: it.ref.kind, ref: it.ref, title: it.title, expires: it.expires, card: need[i]?.small || '', last: null }));
      }
      __close();
      const seen = new Set();
      for (const tr of track) { const key = tr.ref.kind + ':' + tr.ref.id; if (seen.has(key)) tr.dup = true; seen.add(key); }
      for (let m = 0; m < 14 && track.some(tr => tr.last === null || decisionItems24().some(it => it.ref.kind === tr.ref.kind && it.ref.id === tr.ref.id)); m++) {
        const listed = decisionItems24();
        for (const tr of track) if (listed.some(it => it.ref.kind === tr.ref.kind && it.ref.id === tr.ref.id)) tr.last = s.clock.ticks;
        __month(1);
      }
      x.deadlines = track.filter(tr => !tr.dup && Number.isFinite(tr.expires)).map(tr => ({ k: tr.k, kind: tr.kind, title: tr.title, card: tr.card, want: tr.last === null ? null : 'Ответить · ' + untilMonth273(tr.last), expiresMonth: dateLabel86(tr.expires) }));
    }
    // «Последняя встреча»: настоящая встреча с другом (planMeeting53 → ход времени → finishTask).
    {
      __restore();
      const f = wins.map(w => s.people.find(p => p.id === w[2])).find(p => p?.alive && p.role === 'Друг' && p.age >= 18);
      if (f && typeof planMeeting53 === 'function') {
        const before = f.contactTick05 ?? null; let planned = null;
        try { planned = planMeeting53(f.id, 'board'); } catch (e) { planned = String(e); }
        __close();
        for (let i = 0; i < 4 && (f.contactTick05 ?? null) === before; i++) __month(1);
        const p = s.people.find(p => p.id === f.id);
        __close(); personDetail(p.id); await new Promise(r => setTimeout(r, 0));
        const top = __top()['Последняя встреча'] || null;
        x.meeting = { who: p.name, planned: !!planned, tick: p.contactTick05 ?? null, top, want: p.contactTick05 != null && p.contactTick05 !== before ? { value: dateLabel86(p.contactTick05), note: meetingKinds53.board.name } : null };
        __close();
      }
    }
    __restore();
    return x;
  }, wins);
}

// Все живые люди (на сохранении — все; на новых жизнях — окна сценария): то, что видно в карточке сразу и в
// «Подробнее», без сравнения с BASE.
async function sweep(pg, wins) {
  return pg.evaluate(async wins => {
    __restore();
    const ids = wins ? [...new Set(wins.map(w => w[2]))] : s.people.filter(p => p.alive).map(p => p.id);
    const male = /^(Партнёр близкого|Друг ребёнка|Сотрудник своего дела|Клиент|Покупатель|Заказчик|Гость|Ученик|Зритель|Хозяин питомца|Турист|Подопечный|Знакомый|Друг|Внук|Родственник|Бывший партнёр|Бывший сотрудник|Партнёр|Муж|Сын)$/;
    const female = /^(Партнёрша близкого|Подруга ребёнка|Сотрудница своего дела|Клиентка|Покупательница|Заказчица|Гостья|Ученица|Зрительница|Хозяйка питомца|Туристка|Подопечная|Знакомая|Подруга|Внучка|Родственница|Бывшая партнёрша|Бывшая сотрудница|Партнёрша|Жена|Дочь)$/;
    const out = { n: 0, gender: [], former: [], repeats: [], hints: [], romance: [], help: [], ill: [], met: 0, kids: 0 };
    const words = { person: { 'характер': x => x.sec.has('Характерная реплика') || x.rows.has('О человеке/Характер'), 'общая история': x => x.sec.has('Общая история'), 'новости': x => x.sec.has('Новости близкого'), 'биография': x => x.sec.has('Биография'), 'своя жизнь': x => x.sec.has('Собственная жизнь'), 'образование': x => x.sec.has('Образование и семья'), 'возраст и помощь': x => x.sec.has('Возраст и помощь'), 'прежняя жизнь': x => x.sec.has('Прежняя жизнь'), 'другие действия': x => x.acts.length > 0 },
      child: { 'интересы': x => x.info.has('Интересы'), 'секции': x => x.acts.some(l => x.clubs.has(l)), 'подарок': x => x.acts.includes('Велосипед или машина в подарок'), 'доверие': x => x.rows.has('Что важно ребёнку/Доверие'), 'своя история': x => x.sec.has('Своя история'), 'другие действия': x => x.acts.length > 0 } };
    const clubs = new Set(Object.values(clubsCatalog19).map(c => c.name));
    const look = kind => {
      const m = $('#modal'), more = m.querySelector('details.more273');
      const sec = new Set(), rows = new Set(), list = [];
      for (const g of more?.querySelectorAll('.detail-section20') || []) { const title = g.querySelector('h3')?.textContent.trim() || ''; const r = [...g.querySelectorAll('.detail-row20')]; if (!r.length) continue; sec.add(title); for (const row of r) { const l = row.querySelector('dt')?.textContent.trim() || ''; rows.add(title + '/' + l); list.push({ section: title, label: l, value: row.querySelector('dd')?.textContent.trim() || '' }); } }
      const info = new Set([...more?.querySelectorAll('.info273 h4') || []].map(h => h.textContent.trim()));
      const acts = [...more?.querySelectorAll('.others273 > button, .orig273 > button') || []].filter(b => !b.hidden).map(__label);
      const hint = more?.querySelector(':scope > summary small')?.textContent.trim() || '';
      return { sec, rows, list, info, acts, clubs, hint, sub: m.querySelector('.sub273')?.textContent.trim() || '', top: __top() };
    };
    for (const id of ids) {
      for (const fn of ['personDetail', 'childOverview55']) {
        const p = s.people.find(p => p.id === id); if (!p) continue;
        if (fn === 'childOverview55' && !(p.alive && ownChild53(p) && p.age < 18)) continue;
        __close(); window[fn](id); await new Promise(r => setTimeout(r, 0));
        if (!document.querySelector('#modal .top273')) continue;
        const kind = fn === 'personDetail' ? 'person' : 'child', x = look(kind), who = p.name + ' (' + p.role + ', ' + p.gender + ')';
        out.n++; if (kind === 'child') out.kids++;
        // Роль под именем — по полу.
        const role = x.sub.split(' · ')[0];
        if (p.gender === 'f' && male.test(role) || p.gender === 'm' && female.test(role)) out.gender.push(who + ': ' + x.sub);
        // Бывший сотрудник: под именем «Бывший сотрудник», «Сейчас» этого не повторяет и не спорит.
        if (/^Сотрудни(к|ца) своего дела$/.test(role) && /^Бывш/.test(x.top['Сейчас']?.value || '') || /^Бывш(ий|ая) сотрудни/.test(role) && /^Бывш/.test(x.top['Сейчас']?.value || '') || p.role === 'Сотрудник своего дела' && /^Бывший сотрудник/.test(p.occupation || '') && !/^Бывш(ий|ая) сотрудни/.test(role)) out.former.push(who + ': ' + x.sub + ' / ' + JSON.stringify(x.top['Сейчас'] || null));
        // Помощь в быту: «сам» / «сама» по полу.
        const health = (x.top['Здоровье']?.value || '') + ' ' + (x.top['Здоровье']?.note || '');
        if (p.gender === 'f' && /оплачивает сам(?![а-яё])/.test(health) || p.gender === 'm' && /оплачивает сама/.test(health)) out.help.push(who + ': ' + health);
        // Болеющий ребёнок: без «в норме», с тем же примечанием, что в карточке человека.
        if (/^Болеет/.test(x.top['Здоровье']?.value || '') && (/в норме/.test(health) || !/обычные занятия пока на паузе/.test(health))) out.ill.push(who + ' (' + kind + '): ' + health);
        // «Подробнее» не повторяет верх.
        if (kind === 'person' && p.alive) {
          const rep = [];
          if (x.rows.has('О человеке/Где живёт')) rep.push('Где живёт');
          if (/(в браке|в паре): /.test((x.top['Сейчас']?.value || '') + ' ' + (x.top['Сейчас']?.note || '')) && x.rows.has('Собственная жизнь/Пара')) rep.push('Пара');
          if (/ч\/нед\./.test(x.top['Здоровье']?.note || '') && x.rows.has('Возраст и помощь/Помощь')) rep.push('Помощь');
          if (x.rows.has('О человеке/Связь')) rep.push('Связь');
          if (rep.length) out.repeats.push(who + ': ' + rep.join(', '));
        }
        // Подпись «Подробнее» обещает только то, что в нём есть.
        const bad = x.hint ? x.hint.split(', ').filter(w => !(words[kind][w] && words[kind][w](x))) : [];
        if (bad.length) out.hints.push(who + ' (' + kind + '): «' + x.hint + '» — нет: ' + bad.join(', '));
        // Кнопка romance63 в «Ещё»: одно условие; «Предложить тайные отношения» — только когда условия выполнены.
        for (const b of document.querySelectorAll('#modal .setopts273 .relationship-button63')) {
          const l = __label(b), h = b.querySelector('small')?.textContent || '';
          if (h.includes(';') || l === 'Предложить тайные отношения' && !/^Есть взаимная симпатия/.test(h)) out.romance.push(who + ': ' + l + ' — ' + h);
        }
        if (x.top['Последняя встреча']) out.met++;
      }
    }
    __close(); __restore();
    return out;
  }, wins);
}

function compare(name, out, prep) {
  const B = out.base, N = out.new, W = out.wide, S = out.small;
  for (const [k, fn] of prep.v) {
    const b = B.wins[k], n = N.wins[k], w = W?.wins[k], sm = S?.wins[k];
    if (!n) { check(`${name} · ${k}: окно открылось`, false, 'нет окна'); continue; }
    check(`${name} · ${k}: окно-карточка («${n.area}», ${n.sub})`, n.card && n.title === b.title && n.title === n.name, { base: b.title, new: n.title, area: n.area });
    const lost = b.labels.filter(l => !n.labels.some(m => m.label === l.label)).map(l => l.label);
    const extra = n.labels.filter(m => !m.fix && !b.labels.some(l => l.label === m.label)).map(m => m.label);
    check(`${name} · ${k}: ни одна кнопка не потерялась, новых нет`, !lost.length && !extra.length, { lost, extra });
    const state = b.labels.filter(l => { const m = n.labels.find(m => m.label === l.label); return m && (m.disabled !== l.disabled || m.handler !== l.handler); }).map(l => l.label);
    check(`${name} · ${k}: у каждой кнопки та же доступность и обработчик`, !state.length, state);
    const diff = Object.keys(B.press).filter(key => key.startsWith(k + ' / ') && JSON.stringify(B.press[key]) !== JSON.stringify(N.press[key])).map(key => ({ key, base: B.press[key], new: N.press[key] }));
    check(`${name} · ${k}: каждая кнопка нажимается и ведёт туда же`, !diff.length, diff);
    const off = n.actions.filter(a => !a.fold).map(a => a.label + ' ' + a.y + 'px');
    check(`${name} · ${k}: все кнопки действий (${n.actions.length}) видны без прокрутки на 390×844` + (b.first ? ` (без карточки первая — ${b.first.screen}-й экран, ${b.first.y} px)` : ''), n.actions.length > 0 || n.area === 'Память' ? !off.length : false, { off, actions: n.actions });
    if (w) { const offW = w.actions.filter(a => !a.fold).map(a => a.label); check(`${name} · ${k}: кнопки видны без прокрутки на 1280×800`, !offW.length, offW); }
    // Маленький телефон: главные кнопки и строка «Ещё» — тоже без прокрутки (кроме «Подробнее» и подвала).
    if (sm) { const offS = sm.actions.filter(a => !a.fold).map(a => a.label + ' ' + a.y + '–' + (a.y + a.h) + 'px'); check(`${name} · ${k}: главные кнопки и «Ещё» видны без прокрутки на 360×740` + (sm.actions.length ? ` (последняя — ${sm.actions.at(-1).y + sm.actions.at(-1).h} px)` : ''), !offS.length, { off: offS, fold: sm.actions[0]?.foldAt }); }
    if (fn === 'childOverview55' && b.labels.some(l => l.label === 'Открыть карточку')) check(`${name} · ${k}: «Открыть карточку» — в подвале окна, переход, как «Назад»`, n.labels.find(l => l.label === 'Открыть карточку')?.place === 'foot', n.labels.find(l => l.label === 'Открыть карточку'));
    const placed = n.labels.filter(l => !l.fix && !/^Закрыть$/.test(l.label) && l.place === 'plain').map(l => l.label);
    check(`${name} · ${k}: дописанные кнопки стоят среди вариантов, а не под ними`, !placed.length, placed);
    if (b.hadPic) check(`${name} · ${k}: портрет рядом с именем`, n.pic, n);
    check(`${name} · ${k}: каждая строка «Ждёт вашего ответа» — кнопка`, n.need.every(x => x.fix), n.need);
    note(`${k}: было ${b.first ? b.first.screen + '-й экран (' + b.first.y + ' px из ' + b.first.modalH + ')' : 'кнопок нет'}, стало: ${n.actions.map(a => a.label + ' ' + a.y).join(', ') || '—'} px из ${n.actions[0]?.modalH ?? '?'}; на 1280 — последняя ${w?.actions.at(-1)?.y ?? '?'} px`);
  }
  const e = N.extra;
  for (const r of e.nums) check(`${name} · ${r.k}: числа наверху — из таблиц игры (${r.game ? 'близость ' + r.card.close + ', ' : ''}доверие ${r.card.trust}${r.game ? ', напряжение ' + r.card.strain : ' — в «Подробнее»'}${r.grades != null ? ', успеваемость ' + r.grades : ''}${r.tired != null ? ', усталость ' + r.tired : ''}${r.help != null ? ', помощь ' + r.help + ' ч/нед.' : ''})`, r.ok, r);
  for (const r of e.school) {
    check(`${name} · ${r.k}: проверка оценок — в тот месяц, что в карточке (${r.promised})`, !!r.promised && r.promised === r.when, r);
    if (r.grades < 40) check(`${name} · ${r.k}: оценки ниже 40 — карточка говорит, что будет`, /ниже 40/.test(r.warn), r);
  }
  for (const r of e.asks) check(`${name} · ${r.k}: просьба наверху, «Ответить» открывает то же окно («${r.want}»)`, r.need.length === Math.min(r.count, 4) && r.need.every(n => n.fix) && r.via === r.want, r);
  for (const r of e.dates) check(`${name} · ${r.k}: «Подробнее» — даты вместо «Месяц N», новые сверху, без сырых значений`, r.table && !r.rawMonth && !r.raw && r.sorted, r);
  // Срок просьб: последний месяц в «Ожидают ответа» (время шло по-настоящему) — тот, что в карточке.
  for (const r of e.deadlines || []) check(`${name} · ${r.k}: срок просьбы «${r.title}» (${r.kind}) — последний месяц, когда на неё ещё можно ответить (${r.want}; срок в игре — ${r.expiresMonth})`, !!r.want && r.card === r.want, r);
  if (name === 'family') check(`${name}: проверены сроки и просьб ребёнка (до месяца срока), и просьбы о помощи (включительно)`, (e.deadlines || []).some(r => r.kind === 'child55') && (e.deadlines || []).some(r => r.kind === 'elder58'), (e.deadlines || []).map(r => r.kind));
  if (e.meeting) check(`${name} · ${e.meeting.who}: после встречи «Последняя встреча» — её месяц и название (${e.meeting.want?.value} · ${e.meeting.want?.note})`, !!e.meeting.want && e.meeting.top?.value === e.meeting.want.value && e.meeting.top?.note === e.meeting.want.note, e.meeting);
  else if (name === 'family') check(`${name}: встреча с другом для «Последней встречи» состоялась`, false, 'нет друга');
  // Тайные отношения: «Связь» в «Подробнее» не говорит прежнюю роль, «Другие действия» целы; без карточки — как было.
  for (const [k] of prep.v.filter(w => /^тайная связь/.test(w[0]))) {
    const n = N.wins[k];
    check(`${name} · ${k}: под именем — «Тайный партнёр», «Связь: ${n.role}» нет, заголовок «Другие действия» цел`, /^Тайн(ый партнёр|ая партнёрша) · /.test(n.sub) && !n.links.includes(n.role) && n.othersH === 'Другие действия', { sub: n.sub, links: n.links, othersH: n.othersH });
    check(`${name} · ${k}: без карточки «Связь» — «Тайный партнёр», как раньше`, B.side?.[k] === 'Тайный партнёр', B.side?.[k]);
  }
  // Все живые люди.
  const sw = N.sweep;
  if (sw) {
    note(`${name}: просмотрено карточек — ${sw.n} (детских ${sw.kids}), с «Последней встречей» — ${sw.met}`);
    check(`${name}: роль под именем — по полу (${sw.n} карточек)`, !sw.gender.length, sw.gender.slice(0, 8));
    check(`${name}: бывший сотрудник не спорит с «Сейчас»`, !sw.former.length, sw.former.slice(0, 8));
    check(`${name}: «помощника оплачивает сам/сама» — по полу`, !sw.help.length, sw.help.slice(0, 8));
    check(`${name}: у болеющего ребёнка — «обычные занятия пока на паузе», без «в норме»`, !sw.ill.length, sw.ill.slice(0, 8));
    check(`${name}: «Подробнее» не повторяет верх («Где живёт», «Пара», «Помощь», «Связь»)`, !sw.repeats.length, sw.repeats.slice(0, 8));
    check(`${name}: подпись «Подробнее» обещает только то, что в нём есть`, !sw.hints.length, sw.hints.slice(0, 8));
    check(`${name}: в «Ещё» у кнопки отношений одно условие, «Предложить тайные отношения» — только когда можно`, !sw.romance.length, sw.romance.slice(0, 8));
  }
  if (e.more) check(`${name}: «Подробнее» запоминается по виду окна, не в сохранении`, e.more.was === false && e.more.kept === true && (e.more.other === null || e.more.other === false) && e.more.closed === false && e.more.stored === '0' && !e.more.inSave, e.more);
  const months = Object.values(B.tables).some(t => JSON.stringify(t || {}).match(/"Месяц \d+"/));
  if (months) note(`${name}: без карточки в таблицах есть «Месяц N»`);
  check(`${name}: ошибок на странице нет`, !B.errors.length && !N.errors.length && !(W?.errors.length) && !(S?.errors.length), { base: B.errors, new: N.errors, wide: W?.errors, small: S?.errors });
}

(async () => {
  const browser = await chromium.launch();
  try {
    if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
    const runs = [];
    if (SAVE && fs.existsSync(SAVE)) runs.push(['owner', { raw: fs.readFileSync(SAVE, 'utf8') }]);
    else note('SAVE не задан: проверка только на новых жизнях');
    runs.push(['family', { country: 'ru', seed: 2731 }], ['teen', { country: 'au', seed: 2732 }]);
    for (const [name, opts] of runs) {
      const prep = await prepare(browser, name, opts);
      note(`${name}: окна — ${prep.v.map(w => w[0]).join(', ')}`);
      const out = await scenario(browser, name, prep);
      if (BASE) { for (const [k] of prep.v) { const b = out.base.wins[k]; check(`${name} · ${k}: окно-карточка`, b.card, b.title); if (b.first) check(`${name} · ${k}: первая кнопка видна без прокрутки на 390×844`, b.first.fold, b.first); } continue; }
      compare(name, out, prep);
    }
    const order = [...INDEX.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    check('people2731.js подключён сразу после windows273.js', BASE || order[order.indexOf('windows273.js') + 1] === 'people2731.js', order.slice(-4));
  } finally { await browser.close(); }
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без people2731.js)' : ''));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
