// Проверки сборки 271, часть «сюжеты» (stories271-data.js, stories271.js): редактор проектов берёт книги из сюжетов книг,
// фильмы — из сюжетов фильмов, по жанру и формату; тон названия (Серьёзно / С иронией / Абсурд) показывает пять своих
// названий; «Похожие сюжеты» — тот же вид и жанр, не меньше двух общих тем; в пуле нет повторов названий; будущие
// премьеры и приглашения в кинопроекты — из сюжетов фильмов и не меняются при пересчёте; сохранение 270, где фильмы
// уже были, видит те же премьеры (название, сюжет, режиссёр), новые — со следующего месяца.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify271_stories.js
// Файлы сборки, ещё не подключённые в index.html, добавляются после загрузки страницы, до «Родиться».
// BASE=1 — прогон без stories271: видно, какие проверки ловят старое поведение.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const MINE = ['stories271-data.js', 'stories271.js'];
const NAMES = ['names271-data.js', 'names271.js'];
const wired = f => new RegExp('<script[^>]+src="' + f.replace('.', '\\.') + '(\\?[^"]*)?"').test(INDEX);
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra && !ok ? ' — ' + String(extra).slice(0, 400) : '')); };
const note = text => console.log('     ' + text);

// Данные пула читаются здесь, в Node: так проверки сравнивают с ними и в прогоне BASE=1, где файлов в игре нет.
const DATA = (() => {
  const src = fs.readFileSync(path.join(ROOT, 'stories271-data.js'), 'utf8'), head = 'const storyPool271=';
  const rows = JSON.parse(src.slice(src.indexOf(head) + head.length, src.lastIndexOf('];') + 1));
  const themes = JSON.parse(src.match(/const storyThemes271=(\[.*?\]);/)[1]);
  const stories = rows.map(r => ({ id: r[0], type: r[1], genre: r[2], format: r[3], synopsis: r[4], keywords: r[5], titles: { serious: r[6], ironic: r[7], absurd: r[8] }, retired: r[9] === 1 }));
  return { stories, themes, bySynopsis: new Map(stories.map(x => [x.synopsis, x])), byId: new Map(stories.map(x => [x.id, x])) };
})();
const titlesOf = x => [...x.titles.serious, ...x.titles.ironic, ...x.titles.absurd];

async function open(browser, ctx, extra = { before: [], after: [] }) {
  ctx = ctx || await browser.newContext();
  if (!ctx.__routed) {
    ctx.__routed = true;
    await ctx.route('**/*', r => {
      const u = new URL(r.request().url());
      if (u.hostname !== 'game.local') return r.abort();
      const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
      const f = path.join(ROOT, rel);
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
      r.fulfill({ status: 200, body: rel === 'offline-game.js' ? '' : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
    });
  }
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  // Со своими сохранениями в хранилище игра может открыться не на экране рождения — его откроет life().
  await pg.waitForFunction("typeof start==='function'&&typeof intro==='function'&&!!document.querySelector('#app,main,body')");
  await pg.waitForTimeout(300);
  for (const f of extra.before || []) if (!wired(f)) await pg.addScriptTag({ path: path.join(ROOT, f) });
  if (!BASE && !extra.base) for (const f of MINE) if (!wired(f)) await pg.addScriptTag({ path: path.join(ROOT, f) });
  for (const f of extra.after || []) if (!wired(f)) await pg.addScriptTag({ path: path.join(ROOT, f) });
  await pg.evaluate(() => {
    window.Q = {
      form: () => document.querySelector('#modal .story-form189'),
      sel: i => document.querySelectorAll('#modal .story-form189 select')[i],
      set: (i, v) => { const e = Q.sel(i); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); },
      btn: re => [...document.querySelectorAll('#modal .story-form189 button')].find(b => re.test(b.textContent.trim())),
      press: re => { const b = Q.btn(re); if (!b) return false; b.click(); return true; },
      synopsis: () => document.querySelector('#modal .story-form189 textarea')?.value || '',
      title: () => document.querySelector('#modal .story-form189 input')?.value || '',
      chips: () => [...document.querySelectorAll('#modal .story-chips271 button, #modal #storyOptions189 button')].map(b => b.textContent.trim()),
      tones: () => [...document.querySelectorAll('#modal .story-tones271 button')].map(b => b.textContent.trim()),
      similar: () => [...document.querySelectorAll('#modal .story-similar271 button')].map(b => ({ text: b.childNodes[0].textContent, small: b.querySelector('small')?.textContent || '' })),
      start: () => { const b = [...document.querySelectorAll('#modal .options button')].find(b => /Начать проект/.test(b.textContent)); b.click(); },
      clean: () => { if ($('#modal').open) closeModal(); s.pending = []; },
    };
  });
  return { pg, errors, ctx };
}
async function life(pg, cfg = {}) {
  await pg.evaluate(cfg => {
    if (!document.querySelector('#country')) intro();
    for (const [k, v] of Object.entries({ startAge: '18', country: 'nl', ...cfg })) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }
  }, cfg);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&!document.querySelector('#country')");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    Q.clean(); s.age = 30; s.cash = 1e8;
  });
}
// Премьеры с 2028 года по месяц end: [id, название, режиссёр, кратко, сюжет, жанр].
const premieres = (pg, from, to) => pg.evaluate(([from, to]) => {
  const out = [];
  for (let ym = from; ym < to; ym++) for (const f of futureMonth269(ym)) out.push([f.id, f.title, f.director, f.summary, f.story, f.genre, ym]);
  return out;
}, [from, to]);

(async () => {
  const browser = await chromium.launch();
  const books = DATA.stories.filter(x => x.type === 'book' && !x.retired), films = DATA.stories.filter(x => x.type === 'film' && !x.retired);

  // ---------- 0. Данные пула ----------
  {
    const all = DATA.stories.filter(x => !x.retired), seen = new Map(), dup = [];
    for (const x of all) for (const t of titlesOf(x)) { const k = t.toLowerCase().replace(/ё/g, 'е'); if (seen.has(k)) dup.push(t + ' (' + seen.get(k) + ', ' + x.id + ')'); else seen.set(k, x.id); }
    check(dup.length === 0, `пул: ни одно название не повторяется (${seen.size} названий у ${all.length} сюжетов)`, dup.slice(0, 5).join('; '));
    const bad = all.filter(x => !['serious', 'ironic', 'absurd'].every(t => x.titles[t].length === 5) || x.keywords.length < 3 || x.keywords.length > 5 ||
      new Set(x.keywords).size !== x.keywords.length || x.keywords.some(k => !DATA.themes.includes(k)) || !['short', 'full'].includes(x.format) ||
      !new RegExp('^' + (x.type === 'book' ? 'B' : 'F') + '271-\\d{4}$').test(x.id));
    check(bad.length === 0, 'пул: 15 названий (по 5 в тоне), 3–5 тем из themes.json, номера B271-/F271-', bad.slice(0, 3).map(x => x.id).join(', '));
    check(new Set(DATA.stories.map(x => x.id)).size === DATA.stories.length && books.length > 0 && films.length > 0, `пул: номера не повторяются; книг ${books.length}, фильмов ${films.length}`);
    const glued = all.flatMap(titlesOf).filter(t => /\s[—–-]\s/.test(t));
    check(glued.length === 0, 'пул: нет названий, склеенных через тире', glued.slice(0, 3).join('; '));
  }

  // ---------- 1. Редактор проектов ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg);
    // 1.1 Сюжет по жанру и формату: книги — из книг, фильмы — из фильмов.
    const picks = await pg.evaluate(() => {
      const out = [];
      for (const type of ['book', 'film']) {
        storyForm189(type);
        const genres = [...Q.sel(0).options].map(o => o.value), formats = [...Q.sel(1).options].map(o => o.value);
        for (const g of genres) for (const f of formats) {
          Q.set(0, g); Q.set(1, f);
          for (let i = 0; i < 2; i++) { const before = Q.synopsis(); Q.press(/^(Предложить сюжет|Другой сюжет|Другой вариант)$/); out.push({ type, genre: g, format: f === '6' || f === 'short' ? 'short' : 'full', synopsis: Q.synopsis(), changed: Q.synopsis() !== before }); }
        }
        Q.clean();
      }
      return out;
    });
    const fallback = { Исторический: ['Драма'], Приключения: ['Фэнтези', 'Драма'] };
    const wrong = picks.filter(p => { const x = DATA.bySynopsis.get(p.synopsis); return !x || x.type !== p.type || x.format !== p.format || (x.genre !== p.genre && !(fallback[p.genre] || []).includes(x.genre)); });
    check(picks.length > 40 && wrong.length === 0, `редактор: сюжет из своего пула — книги из книг, фильмы из фильмов, жанр и формат как выбраны (${picks.length} подсказок)`,
      wrong.slice(0, 2).map(p => `${p.type}/${p.genre}/${p.format}: ${p.synopsis.slice(0, 60)}`).join(' | '));
    check(picks.filter(p => p.type === 'book' && p.genre === 'Нон-фикшен').every(p => DATA.bySynopsis.get(p.synopsis)?.genre === 'Нон-фикшен'), 'редактор: у книг есть нон-фикшен');
    check(picks.every(p => p.changed), 'редактор: «Другой сюжет» каждый раз даёт новый сюжет', picks.filter(p => !p.changed).length);

    // 1.2 Тон названия: три кнопки, у каждой — пять своих названий.
    const tone = await pg.evaluate(() => {
      storyForm189('book'); Q.set(0, 'Детектив'); Q.set(1, '12'); Q.press(/^Предложить сюжет$/);
      const out = { tones: Q.tones(), synopsis: Q.synopsis(), title: Q.title(), by: {} };
      for (const label of ['Серьёзно', 'С иронией', 'Абсурд']) { Q.press(new RegExp('^' + label + '$')); out.by[label] = Q.chips(); }
      // Выбранное название в серьёзном тоне → тот же номер в абсурдном.
      Q.press(/^Серьёзно$/); const chips = [...document.querySelectorAll('#modal .story-chips271 button')]; if (chips[2]) chips[2].click();
      out.picked = Q.title(); Q.press(/^Абсурд$/); out.switched = Q.title();
      // ↻ — следующее название того же тона.
      Q.press(/Предложить название/); out.next = Q.title();
      Q.press(/^С иронией$/); Q.press(/Предложить название/); out.ironicNext = Q.title();
      Q.start(); const p = creative27().projects.at(-1); out.project = p ? { id: p.story189?.id, title: p.title, synopsis: p.story189?.synopsis, genre: p.genre } : null;
      Q.clean();
      return out;
    });
    const x = DATA.bySynopsis.get(tone.synopsis);
    check(tone.tones.join('|') === 'Серьёзно|С иронией|Абсурд', 'редактор: три тона — Серьёзно, С иронией, Абсурд', tone.tones.join('|'));
    check(x && tone.by['Серьёзно'].join('|') === x.titles.serious.join('|') && tone.by['С иронией'].join('|') === x.titles.ironic.join('|') && tone.by['Абсурд'].join('|') === x.titles.absurd.join('|'),
      'редактор: в каждом тоне — пять названий этого тона у этого сюжета', JSON.stringify(tone.by).slice(0, 300));
    check(x && x.titles.serious.includes(tone.title), 'редактор: название подставляется само из выбранного тона', tone.title);
    check(x && tone.picked === x.titles.serious[2] && tone.switched === x.titles.absurd[2], 'редактор: смена тона меняет подсказанное название на то же место в новом тоне', `${tone.picked} → ${tone.switched}`);
    check(x && tone.next === x.titles.absurd[3] && x.titles.ironic.includes(tone.ironicNext), '«↻ Предложить название» — следующее название выбранного тона', `${tone.next} / ${tone.ironicNext}`);
    check(tone.project && /^B271-\d{4}$/.test(tone.project.id || '') && tone.project.title === tone.ironicNext && tone.project.synopsis === tone.synopsis && tone.project.genre === 'Детектив',
      'редактор: рукопись начинается с выбранным сюжетом и названием', JSON.stringify(tone.project));

    // 1.3 Фильм по специальности: сюжет фильма, номер F271-.
    const film = await pg.evaluate(() => {
      const key = Object.keys(specialties184.cinema)[0];
      storyForm189('film', key); Q.set(0, 'Хоррор'); Q.set(1, 'short'); Q.press(/^Предложить сюжет$/); Q.press(/^С иронией$/);
      const out = { synopsis: Q.synopsis(), title: Q.title() };
      const before = creativeTasks47().length; Q.start();
      const t = creativeTasks47().at(-1); out.task = creativeTasks47().length > before ? { id: t.story189?.id, title: t.story189?.title, format: t.story189?.format } : null;
      Q.clean(); return out;
    });
    const fx = DATA.bySynopsis.get(film.synopsis);
    check(fx && fx.type === 'film' && fx.genre === 'Хоррор' && fx.format === 'short' && fx.titles.ironic.includes(film.title), 'редактор: фильм по специальности — сюжет фильма и название в выбранном тоне', film.synopsis.slice(0, 80));
    check(film.task && /^F271-\d{4}$/.test(film.task.id || '') && film.task.title === film.title && film.task.format === 'short', 'редактор: съёмка начинается с сюжетом F271-', JSON.stringify(film.task));

    // 1.4 Похожие сюжеты.
    const sim = await pg.evaluate(() => {
      const out = [];
      for (const [type, genre, format] of [['book', 'Драма', '6'], ['film', 'Комедия', 'full'], ['book', 'Фэнтези', '24'], ['film', 'Триллер', 'short']]) {
        storyForm189(type); Q.set(0, genre); Q.set(1, format);
        let tries = 0; Q.press(/^Предложить сюжет$/);
        while (!Q.similar().length && tries++ < 40) Q.press(/^Другой сюжет$/);
        const r = { type, genre, synopsis: Q.synopsis(), similar: Q.similar() };
        if (r.similar.length) { document.querySelector('#modal .story-similar271 button').click(); r.after = Q.synopsis(); r.format = Q.sel(1).value; r.chips = Q.chips(); r.title = Q.title(); }
        out.push(r); Q.clean();
      }
      return out;
    });
    const simBad = [];
    for (const r of sim) {
      const cur = DATA.bySynopsis.get(r.synopsis);
      if (!cur || !r.similar.length || r.similar.length > 3) { simBad.push(`${r.type}/${r.genre}: ${r.similar.length} похожих`); continue; }
      for (const o of r.similar) {
        const y = DATA.stories.find(y => y.synopsis.startsWith(o.text) && y.type === r.type && y.id !== cur.id);
        const shared = y ? y.keywords.filter(k => cur.keywords.includes(k)) : [];
        if (!y || y.genre !== cur.genre || shared.length < 2 || !o.small.includes(shared.slice(0, 2).join(', '))) simBad.push(`${r.type}/${r.genre}: ${o.text.slice(0, 50)} (${shared.join(',')})`);
      }
      const y = DATA.bySynopsis.get(r.after);
      if (!y || !r.similar[0] || !y.synopsis.startsWith(r.similar[0].text) || (y.format === 'short') !== ['6', 'short'].includes(r.format) || r.chips.join('|') !== y.titles[['serious', 'ironic', 'absurd'].find(t => y.titles[t].includes(r.chips[0])) || 'serious'].join('|'))
        simBad.push(`${r.type}/${r.genre}: выбор похожего не сменил сюжет, формат или названия`);
    }
    check(simBad.length === 0, 'редактор: «Похожие сюжеты» — до трёх, тот же вид и жанр, не меньше двух общих тем; выбор меняет сюжет, формат и названия', simBad.slice(0, 3).join(' | '));

    // 1.5 Старые номера сюжетов (catalog-data189.js) и проекты из старых сохранений.
    const old = await pg.evaluate(() => {
      const out = {};
      out.lookup = typeof storyLookup271 === 'function' ? [storyLookup271('FILM-0001'), storyLookup271('BOOK-0001')].map(x => x && x.synopsis === storyEntries189.find(r => r[0] === x.id)[4]) : [false];
      const row = storyEntries189.find(r => r[1] === 'book');
      const p = createBook27(row[5][0], 'Роман', 12, { id: row[0], title: row[5][0], synopsis: row[4], genre: row[2], format: row[3] });
      if (p) { bookMenu27(p.id); out.menu = $('#modal').innerText.includes(row[4].slice(0, 40)); Q.clean(); }
      return out;
    });
    check(old.lookup.every(Boolean), 'старые сюжеты: номера FILM-/BOOK- из catalog-data189.js находятся', JSON.stringify(old));
    check(old.menu, 'старые сюжеты: рукопись со старым сюжетом открывается, сюжет виден', JSON.stringify(old));
    check(errors.length === 0, 'редактор: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 2. Будущие премьеры и приглашения (новая жизнь) ----------
  let lifeList = null;
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg);
    await pg.evaluate(() => { films269().seed = 777; s.year = 2030; s.clock.month = 0; });
    const list = await premieres(pg, 2028 * 12, 2111 * 12);
    lifeList = list;
    const r = await pg.evaluate(list => {
      const out = { from: s.films269.from271, byId: 0, total: list.length };
      for (const [id, title, director, summary] of list) { const f = filmById269(id); if (f && f.title === title && f.director === director && f.summary === summary) out.byId++; }
      // Пересчёт с пустыми кэшами (как после перезагрузки) даёт тот же список.
      futureCache269.clear(); if (typeof premiereById271 !== 'undefined') { premiereById271.clear(); premierePlan271 = null; }
      out.again = [];
      for (let ym = 2028 * 12; ym < 2111 * 12; ym++) for (const f of futureMonth269(ym)) out.again.push(f.id + '|' + f.title + '|' + f.director);
      return out;
    }, list);
    const L = films.length, first = list.slice(0, L), titles = list.map(x => x[1]);
    check(list.length > 1500 && list.every(x => /^H\d+-\d-F271-\d{4}-\d{1,2}$/.test(x[0])), `премьеры: с 2028 года идут из сюжетов фильмов, id с сюжетом и названием (${list.length} премьер до 2111)`, list.slice(0, 2).map(x => x[0]).join(', '));
    check(list.every(x => { const st = DATA.byId.get(x[4]); return st && st.type === 'film' && titlesOf(st).includes(x[1]) && st.synopsis.startsWith(x[3]); }), 'премьеры: название и краткое содержание — из сюжета фильма', list[0] && list[0].slice(1, 4).join(' · '));
    check(new Set(first.map(x => x[4])).size === Math.min(L, first.length), `премьеры: сюжеты не повторяются, пока не кончатся (${L} сюжетов)`);
    check(new Set(titles).size === titles.length, `премьеры: ни одно название не повторяется за всю жизнь (${titles.length})`, titles.length - new Set(titles).size);
    check(r.byId === list.length, 'премьеры: по id находится тот же фильм — название, режиссёр, сюжет', `${r.byId}/${list.length}`);
    check(r.again.join() === list.map(x => x[0] + '|' + x[1] + '|' + x[2]).join(), 'премьеры: после пересчёта с пустыми кэшами — те же фильмы');
    check(r.from === 2028 * 12, 'премьеры: в новой жизни новые сюжеты с 2028 года', r.from);
    const tones = { serious: 0, ironic: 0, absurd: 0 }, comedy = { serious: 0, ironic: 0, absurd: 0 };
    for (const x of list) { const st = DATA.byId.get(x[4]); if (!st) continue; const t = ['serious', 'ironic', 'absurd'].find(t => st.titles[t].includes(x[1])); tones[t]++; if (st.genre === 'Комедия') comedy[t]++; }
    note(`тон названий премьер: ${JSON.stringify(tones)}, у комедий ${JSON.stringify(comedy)}`);
    check(tones.serious > tones.ironic && tones.ironic > tones.absurd && tones.absurd > 0 && comedy.ironic > comedy.serious, 'премьеры: чаще всерьёз, комедии чаще с иронией, абсурд — изредка', JSON.stringify({ tones, comedy }));

    // Приглашение в кинопроект: сюжет фильма нужного формата, не из премьер ближайших пяти лет.
    const inv = await pg.evaluate(() => {
      s.year = 2047; s.clock.month = 3; Q.clean();
      const x = creative47(), spec = Object.keys(specialties184.cinema)[0], r0 = Math.random, out = [];
      for (let i = 0; i < 6; i++) {
        x.works.push({ id: 'v' + i, track: 'cinema', specialty184: spec, quality: 95, level184: i < 3 ? 1 : 4, title: 'Проба ' + i }); x.nextCinema191 = 0;
        x.applications.forEach(a => a.status = 'declined');
        Math.random = () => 0.001; try { cinemaInvitation191(x.works.at(-1)); } finally { Math.random = r0; }
        const a = x.applications.find(a => a.offer.sourceWork191 === 'v' + i);
        out.push(a?.offer.project269 ? { ...a.offer.project269, level: a.offer.level184 } : null);
      }
      const now = filmNow269(), near = [];
      for (let ym = now - 60; ym <= now + 60; ym++) for (const f of futureMonth269(ym)) near.push(f.story);
      return { out, near, log: s.log.find(e => e.title === 'Приглашение в новый проект')?.text || '' };
    });
    const got = inv.out.filter(Boolean);
    const badInv = got.filter(p => { const st = DATA.byId.get(p.id); return !st || st.type !== 'film' || !titlesOf(st).includes(p.title) || st.synopsis !== p.synopsis || inv.near.includes(p.id) || st.format !== (p.level <= 2 ? 'short' : 'full'); });
    check(got.length >= 4 && badInv.length === 0 && new Set(got.map(p => p.id)).size === got.length, `приглашения: сюжет фильма своего формата, не из премьер ±5 лет, без повторов (${got.length})`, JSON.stringify(badInv[0] || inv.out).slice(0, 300));
    check(got.length && inv.log.includes(got.at(-1).title), 'приглашения: в записи — название проекта и сюжет', inv.log.slice(0, 200));
    check(errors.length === 0, 'премьеры: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // Та же жизнь (то же зерно) на другой странице — те же премьеры.
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'jp' });
    await pg.evaluate(() => { films269().seed = 777; });
    const list = await premieres(pg, 2028 * 12, 2111 * 12);
    check(list.map(x => x.slice(0, 3).join('|')).join() === lifeList.map(x => x.slice(0, 3).join('|')).join(), 'премьеры: на другой странице с тем же зерном — те же id, названия и режиссёры');
    check(errors.length === 0, 'премьеры (вторая страница): без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 3. Сохранение 270 с уже виденными премьерами ----------
  {
    // Страница без файлов 271: жизнь в 2040 году, фильмы смотрели, любимый — вымышленная премьера.
    const ctx = await browser.newContext();
    const A = await open(browser, ctx, { base: true });
    await life(A.pg);
    const before = await A.pg.evaluate(() => {
      s.films269 = { seen: {}, recent: [], fav: null, favScore: -1, seed: 424242 }; s.year = 2040; s.clock.month = 4;
      const now = filmNow269(), gen = [];
      for (let ym = now - 60; ym <= now; ym++) for (const f of futureMonth269(ym)) gen.push({ id: f.id, title: f.title, director: f.director, summary: f.summary, genre: f.genre });
      const shown = filmsNow269(3, { age: 30 }).map(f => f.id), avail = filmsAvailable269({ age: 30 }).map(f => f.id);
      gen.slice(-12).forEach((f, i) => filmSeen269(filmById269(f.id), 'cinema', i === 3 ? 1000 : 0));
      s.clock.tasks.push({ id: 'film-task', kind: 'hobby', hobby: 'film', label: 'Кино', duration: 1, progress: 0, hours: 2, film269: gen.at(-1).id });
      const oldProject = projectStory269('full');
      const st = JSON.parse(JSON.stringify(s)); st.saveId = 'v271-films'; localStorage.setItem(LIFE_PREFIX + 'v271-films', JSON.stringify(st));
      const kid = JSON.parse(JSON.stringify(s)); kid.saveId = 'v271-early'; kid.year = 2020; kid.films269 = { seen: {}, recent: [], fav: null, favScore: -1, seed: 99 };
      localStorage.setItem(LIFE_PREFIX + 'v271-early', JSON.stringify(kid));
      return { gen, shown, avail, stats: filmStats269(), fav: s.films269.fav, now, month: futureMonth269(now).map(f => f.id), oldProject };
    });
    await A.pg.close();
    // Та же игра с файлами 271: сохранение загружается, всё виденное — то же самое.
    const extra = fs.existsSync(path.join(ROOT, 'names271.js')) && !wired('names271.js') ? { after: NAMES } : {};
    const strictDirector = !wired('names271.js') || MINE.every(wired);
    const B = await open(browser, ctx, extra);
    await life(B.pg);
    const after = await B.pg.evaluate(before => {
      loadCharacter('v271-films'); Q.clean();
      const out = { gen: before.gen.map(f => { const g = filmById269(f.id); return g ? { id: g.id, title: g.title, director: g.director, summary: g.summary, genre: g.genre } : null; }) };
      out.shown = filmsNow269(3, { age: 30 }).map(f => f.id); out.avail = filmsAvailable269({ age: 30 }).map(f => f.id); out.stats = filmStats269();
      out.month = futureMonth269(before.now).map(f => f.id); out.from = s.films269.from271;
      out.task = filmById269(s.clock.tasks.find(t => t.id === 'film-task')?.film269)?.title;
      out.oldProject = s.films269.projects?.includes(before.oldProject.id);
      // Следующий месяц: новые премьеры — из сюжетов фильмов 271, прошлые месяцы не меняются.
      s.clock.month = 5;
      out.next = futureMonth269(before.now + 1).map(f => f.id);
      out.pastStill = futureMonth269(before.now).map(f => f.id);
      // Сохранение и загрузка: отметка 271 остаётся.
      const st = JSON.parse(JSON.stringify(s)); st.saveId = 'v271-films2'; localStorage.setItem(LIFE_PREFIX + 'v271-films2', JSON.stringify(st));
      loadCharacter('v271-films2'); out.fromAfterLoad = s.films269.from271;
      loadCharacter('v271-early'); Q.clean(); films269(); out.earlyFrom = s.films269.from271;
      s.year = 2031; out.early = futureMonth269(2031 * 12).map(f => f.id);
      return out;
    }, before);
    const same = before.gen.filter((f, i) => { const g = after.gen[i]; return g && g.title === f.title && g.summary === f.summary && g.genre === f.genre; });
    const sameDir = before.gen.filter((f, i) => after.gen[i]?.director === f.director);
    check(before.gen.length > 50 && same.length === before.gen.length, `старое сохранение: вымышленные премьеры G… — те же название, сюжет и жанр (${same.length}/${before.gen.length})`,
      JSON.stringify([before.gen.find((f, i) => !same.includes(f)), after.gen[before.gen.findIndex(f => !same.includes(f))]]));
    if (strictDirector) check(sameDir.length === before.gen.length, 'старое сохранение: у премьер G… тот же режиссёр' + (extra.after ? ' (и с names271, подключённым после stories271)' : ''), `${sameDir.length}/${before.gen.length}: ` + JSON.stringify([before.gen.find((f, i) => after.gen[i]?.director !== f.director)?.director, after.gen[before.gen.findIndex((f, i) => after.gen[i]?.director !== f.director)]?.director]));
    else note(`режиссёры G… не сверяются: names271 уже в index.html, а stories271 ещё нет — в настоящем порядке stories271 должен идти раньше names271 (совпало ${sameDir.length}/${before.gen.length})`);
    check(after.shown.join() === before.shown.join() && after.avail.join() === before.avail.join(), 'старое сохранение: в прокате и в репертуаре этого месяца — те же фильмы', `${after.shown.join()} / ${before.shown.join()}`);
    check(after.stats === before.stats && after.task === before.gen.at(-1).title, 'старое сохранение: любимый фильм, счёт просмотров и запланированный фильм — те же', `${after.stats} / ${before.stats}`);
    check(after.month.join() === before.month.join() && after.pastStill.join() === before.month.join(), 'старое сохранение: месяц загрузки остаётся прежним и после перехода месяца', after.month.join());
    check(after.from === before.now + 1 && after.fromAfterLoad === before.now + 1, 'старое сохранение: новые сюжеты — со следующего месяца, отметка сохраняется', `${after.from} / ${after.fromAfterLoad} / ${before.now + 1}`);
    check(after.next.length > 0 && after.next.every(id => /^H\d+-\d-F271-\d{4}-\d+$/.test(id)), 'старое сохранение: со следующего месяца премьеры — из сюжетов фильмов 271', after.next.join());
    check(after.oldProject, 'старое сохранение: прежние приглашения (старые номера сюжетов) остаются в списке', before.oldProject.id);
    check(after.earlyFrom === 2028 * 12 && after.early.every(id => /^H/.test(id)) && after.early.length > 0, 'сохранение до 2028 года: все вымышленные премьеры — новые', `${after.earlyFrom} ${after.early.join()}`);
    check(B.errors.length === 0 && A.errors.length === 0, 'старое сохранение: без ошибок страницы', [...A.errors, ...B.errors].slice(0, 2).join(' | '));
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без stories271)' : ''));
  process.exit(fail ? 1 : 0);
})();
