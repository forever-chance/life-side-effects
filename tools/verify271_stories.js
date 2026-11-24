// Проверки сборки 271, часть «сюжеты» (stories271-data.js, stories271.js): редактор проектов берёт книги из сюжетов книг,
// фильмы — из сюжетов фильмов, по жанру и формату; тон названия (Серьёзно / С иронией / Абсурд) показывает пять своих
// названий; «Похожие сюжеты» — тот же вид и жанр, не меньше двух общих тем; в пуле нет повторов названий; будущие
// премьеры — из полнометражных сюжетов фильмов, приглашения в кинопроекты — из сюжетов фильмов, и не меняются при
// пересчёте; сохранение 270, где фильмы уже были, видит те же премьеры (название, сюжет, режиссёр), новые — со следующего
// месяца; stories271 стоит в index.html после names270.js и до всех names271*.js.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify271_stories.js
// Страницы. «Сборка 271» — index.html; файлы, ещё не подключённые в index.html, добавляются после загрузки страницы,
// до «Родиться», в настоящем порядке: stories271-data, stories271, names271-data, names271, names271-freq-data,
// names271-freq (пока stories271 не подключён, теги names271* убираются из index.html и тоже добавляются после него).
// «270» — index.html без тегов всех новых файлов 271 (в имени номер 271): так «до» — это и правда 270, даже когда всё
// уже подключено. Премьеры G… сверяются ещё и с эталоном, снятым со сборки 270 (GOLDEN_G270 ниже).
// BASE=1 — сборка 271 без stories271 (его теги убираются и из index.html): видно, какие проверки ловят старое поведение.
// GOLDEN=1 — напечатать эталон премьер G… со страницы «270» (только если премьеры 270 изменены сознательно).
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { spawnSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', GOLDEN = process.env.GOLDEN === '1';
const exists = f => fs.existsSync(path.join(ROOT, f));
const MINE = ['stories271-data.js', 'stories271.js'];
// names271* при загрузке меняют пулы имён и identitySurname / defaultParts256 — stories271 должен идти раньше всех.
const NAMES = ['names271-data.js', 'names271.js', 'names271-freq-data.js', 'names271-freq.js'].filter(exists);
const reEsc = f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const tagRe = (f, g = '') => new RegExp('<script[^>]+src="' + reEsc(f) + '(\\?[^"]*)?"[^>]*>\\s*</script>', g);
const srcs = html => [...html.matchAll(/<script[^>]+src="([^"?]+)(\?[^"]*)?"/g)].map(m => m[1]);
const wired = f => srcs(INDEX).includes(f);
const strip = (html, files) => files.reduce((h, f) => h.replace(tagRe(f, 'g'), ''), html);
// Новые файлы 271 — всё, в чьём имени есть номер 271 (старые файлы, поправленные в 271, остаются).
const NEW271 = srcs(INDEX).filter(f => /(^|\D)271(\D|$)/.test(path.basename(f)));
// Что раздаётся вместо index.html и что добавляется после загрузки.
function pageSetup(variant) {
  if (variant === '270') return { html: strip(INDEX, [...NEW271, ...MINE, ...NAMES]), add: [] };
  // Неверный порядок для проверки защиты: names271-freq раньше stories271.
  if (variant === 'freq-first') return { html: strip(INDEX, [...MINE, ...NAMES]), add: [...NAMES.filter(f => /freq/.test(f)), ...MINE, ...NAMES.filter(f => !/freq/.test(f))] };
  if (BASE) return { html: strip(INDEX, MINE), add: NAMES.filter(f => !wired(f)) };
  if (MINE.every(wired)) return { html: INDEX, add: NAMES.filter(f => !wired(f)) };
  return { html: strip(INDEX, [...MINE, ...NAMES]), add: [...MINE, ...NAMES] };
}
// Порядок в index.html: stories271-data.js, stories271.js после names270.js, до всех names271*.js и до bootstrap61.js.
// null — stories271 ещё не подключён.
function orderProblems(html) {
  const list = srcs(html), at = f => list.indexOf(f), out = [];
  if (!MINE.every(f => list.includes(f))) return null;
  if (at('stories271-data.js') > at('stories271.js')) out.push('stories271-data.js после stories271.js');
  if (at('names270.js') < 0 || at('stories271-data.js') < at('names270.js')) out.push('stories271 не после names270.js');
  for (const f of list.filter(f => /^names271.*\.js$/.test(f))) if (at(f) < at('stories271.js')) out.push(f + ' раньше stories271.js');
  if (at('bootstrap61.js') >= 0 && at('stories271.js') > at('bootstrap61.js')) out.push('stories271.js после bootstrap61.js');
  return out;
}
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

// Эталон премьер G… сборки 270: зёрна SEEDS, месяцы с 2028 по 2059 год, k = 0 и 1, строки
// «id|название|режиссёр|страна|жанр|кратко|сюжет» через перевод строки → sha1. Снят GOLDEN=1 с дерева сборки 270
// (git archive 97e440e) и совпал со страницей «270» рабочего дерева 271.
const G270 = { seeds: [11, 4242, 777777], from: 2028 * 12, to: 2060 * 12 };
const GOLDEN_G270 = { count: 2304, sha1: '633ba84849d804f6d5a3d59dbdda59882fea3ff9', first: [
  'G24336-0|Третье королевство|Лив де Бур|Нидерланды|Фэнтези|Метеоролог по имени Вера наследует лавку, где продают не вещи, а обещания, и обнаруживает долг, оставленный предыдущей владелицей.|FILM-0274',
  'G24336-1|Всё ещё здесь|Константин Волков|Россия|Драма|История сотрудница музея складывается из описаний потерянных вещей, которые разные люди находят в степном посёлке.|FILM-0488'] };
const gList = pg => pg.evaluate(G => {
  const x = films269(), keep = x.seed, out = [];
  try {
    for (const seed of G.seeds) { x.seed = seed; for (let ym = G.from; ym < G.to; ym++) for (const k of [0, 1]) { const f = filmById269('G' + ym + '-' + k); out.push(f ? [f.id, f.title, f.director, f.origin, f.genre, f.summary, f.story].join('|') : 'null:G' + ym + '-' + k); } }
  } finally { x.seed = keep; }
  return out;
}, G270);
const gDigest = list => ({ count: list.length, sha1: crypto.createHash('sha1').update(list.join('\n')).digest('hex'), first: list.slice(0, 2) });

async function open(browser, ctx, variant = 'game') {
  ctx = ctx || await browser.newContext();
  if (!ctx.__routed) {
    ctx.__routed = true;
    await ctx.route('**/*', r => {
      const u = new URL(r.request().url());
      if (u.hostname !== 'game.local') return r.abort();
      const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
      if (rel === 'index.html') return r.fulfill({ status: 200, body: pageSetup(u.searchParams.get('page') || 'game').html, headers: { 'content-type': 'text/html' } });
      const f = path.join(ROOT, rel);
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
      r.fulfill({ status: 200, body: rel === 'offline-game.js' ? '' : fs.readFileSync(f), headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
    });
  }
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html?page=' + variant);
  // Со своими сохранениями в хранилище игра может открыться не на экране рождения — его откроет life().
  await pg.waitForFunction("typeof start==='function'&&typeof intro==='function'&&!!document.querySelector('#app,main,body')");
  await pg.waitForTimeout(300);
  for (const f of pageSetup(variant).add) await pg.addScriptTag({ path: path.join(ROOT, f) });
  const loaded = await pg.evaluate(() => ({ stories: typeof storyPool271 !== 'undefined' && typeof storyForm271 === 'function', names: typeof names271 !== 'undefined', freq: typeof freq271 !== 'undefined' }));
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
  return { pg, errors, ctx, loaded };
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
  if (GOLDEN) {
    const A = await open(browser, null, '270');
    await life(A.pg);
    console.log('const GOLDEN_G270 = ' + JSON.stringify(gDigest(await gList(A.pg))) + ';', A.loaded, A.errors.slice(0, 2));
    await browser.close();
    return;
  }
  const books = DATA.stories.filter(x => x.type === 'book' && !x.retired), films = DATA.stories.filter(x => x.type === 'film' && !x.retired);
  const fullFilms = films.filter(x => x.format === 'full');

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
    // Исходники данных — в репозитории (docs/stories271), и stories271-data.js собран из них: пересборка ничего не меняет.
    const SRC = path.join(ROOT, 'docs', 'stories271'), script = fs.readFileSync(path.join(ROOT, 'tools', 'stories271_build.py'), 'utf8');
    const srcFiles = fs.existsSync(SRC) ? fs.readdirSync(SRC) : [];
    const env = { ...process.env }; delete env.STORIES271_DIR; delete env.STORIES271_OUT;
    const run = spawnSync('python3', [path.join(ROOT, 'tools', 'stories271_build.py'), '--check'], { cwd: '/', env, encoding: 'utf8' });
    const m = /номера сохранены: (\d+), новые: (\d+), снятые: (\d+), ошибок: (\d+)/.exec(run.stdout || '');
    const retired = DATA.stories.filter(x => x.retired).length;
    check(srcFiles.includes('themes.json') && srcFiles.some(f => /^book-\d+\.json$/.test(f)) && srcFiles.some(f => /^film-\d+\.json$/.test(f)) && !/['"]\/tmp\//.test(script),
      'исходники: themes.json, book-*.json, film-*.json лежат в docs/stories271, скрипт сборки читает их по умолчанию', srcFiles.join(', ') || 'нет docs/stories271');
    check(run.status === 0 && m && +m[1] === DATA.stories.length - retired && +m[2] === 0 && +m[3] === retired && +m[4] === 0,
      `исходники: stories271-data.js собран из docs/stories271 — номера на месте, новых нет (${m ? m.slice(1).join('/') : '—'})`, (run.stdout || '').slice(-200) + (run.stderr || '').slice(-200));
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
    const L = fullFilms.length, first = list.slice(0, L), titles = list.map(x => x[1]);
    check(list.length > 1500 && list.every(x => /^H\d+-\d-F271-\d{4}-\d{1,2}$/.test(x[0])), `премьеры: с 2028 года идут из сюжетов фильмов, id с сюжетом и названием (${list.length} премьер до 2111)`, list.slice(0, 2).map(x => x[0]).join(', '));
    check(list.every(x => { const st = DATA.byId.get(x[4]); return st && st.type === 'film' && titlesOf(st).includes(x[1]) && st.synopsis.startsWith(x[3]); }), 'премьеры: название и краткое содержание — из сюжета фильма', list[0] && list[0].slice(1, 4).join(' · '));
    const shorts = list.filter(x => DATA.byId.get(x[4])?.format !== 'full');
    check(shorts.length === 0, `премьеры: в прокат выходят только полнометражные сюжеты, как в 269 (${fullFilms.length} сюжетов)`, `${shorts.length} коротких: ` + shorts.slice(0, 2).map(x => x[0] + ' «' + x[1] + '»').join(', '));
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
    // Окно — до пяти лет, но не больше 4/5 полнометражных сюжетов (две премьеры в месяц): иначе свободных не останется.
    const PW = Math.max(12, Math.min(60, Math.floor(fullFilms.length / 5)));
    const inv = await pg.evaluate(W => {
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
      for (let ym = now - W; ym <= now + W; ym++) for (const f of futureMonth269(ym)) near.push(f.story);
      return { out, near, log: s.log.find(e => e.title === 'Приглашение в новый проект')?.text || '' };
    }, PW);
    const got = inv.out.filter(Boolean);
    const badInv = got.filter(p => { const st = DATA.byId.get(p.id); return !st || st.type !== 'film' || !titlesOf(st).includes(p.title) || st.synopsis !== p.synopsis || inv.near.includes(p.id) || st.format !== (p.level <= 2 ? 'short' : 'full'); });
    check(got.length >= 4 && badInv.length === 0 && new Set(got.map(p => p.id)).size === got.length, `приглашения: сюжет фильма своего формата, не из премьер ±${PW} мес., без повторов (${got.length})`, JSON.stringify(badInv[0] || inv.out).slice(0, 300));
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
    // Страница «270» (index.html без файлов 271): жизнь в 2040 году, фильмы смотрели, любимый — вымышленная премьера.
    const ctx = await browser.newContext();
    const A = await open(browser, ctx, '270');
    check(!A.loaded.stories && !A.loaded.names && !A.loaded.freq, 'страница «270»: без stories271, names271 и names271-freq' + (NEW271.length ? ` (убраны из index.html: ${NEW271.join(', ')})` : ''), JSON.stringify(A.loaded));
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
    const gA = await gList(A.pg), dA = gDigest(gA);
    check(dA.count === GOLDEN_G270.count && dA.sha1 === GOLDEN_G270.sha1, `страница «270»: премьеры G… (${dA.count}, три зерна) — как в эталоне сборки 270`, JSON.stringify([dA.first, GOLDEN_G270.first]));
    await A.pg.close();
    // Та же игра — сборка 271 со всеми names271*: сохранение загружается, всё виденное — то же самое.
    const B = await open(browser, ctx);
    note(`сборка 271: ${BASE ? 'без stories271 (BASE=1)' : MINE.every(wired) ? 'stories271 в index.html' : 'stories271 добавлен после загрузки'}` + `; names271: ${B.loaded.names ? 'есть' : 'нет'}, names271-freq: ${B.loaded.freq ? 'есть' : 'нет'}`);
    check(await B.pg.evaluate(() => typeof storyNames271 !== 'undefined' && !!storyNames271 && typeof storyNamesLate271 !== 'undefined' && storyNamesLate271.length === 0), 'сборка 271: снимок имён 270 снят до names271 и names271-freq — у старых премьер прежние режиссёры');
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
    check(sameDir.length === before.gen.length, 'старое сохранение: у премьер G… тот же режиссёр' + (B.loaded.names || B.loaded.freq ? ' (names271' + (B.loaded.freq ? ' и names271-freq' : '') + ' загружены после stories271)' : ''), `${sameDir.length}/${before.gen.length}: ` + JSON.stringify([before.gen.find((f, i) => after.gen[i]?.director !== f.director)?.director, after.gen[before.gen.findIndex((f, i) => after.gen[i]?.director !== f.director)]?.director]));
    const gB = await gList(B.pg), dB = gDigest(gB), gDiff = gA.map((x, i) => [x, gB[i]]).filter(([a, b]) => a !== b);
    check(dB.count === GOLDEN_G270.count && dB.sha1 === GOLDEN_G270.sha1, `сборка 271: премьеры G… для трёх зёрен — те же название, режиссёр, страна и сюжет, что в эталоне 270 (отличий от «270»: ${gDiff.length}/${gA.length})`, JSON.stringify(gDiff.slice(0, 2)));
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

  // ---------- 4. Порядок файлов ----------
  {
    // Проверка порядка сама: на правильном и неправильных порядках.
    const tag = f => `<script src="${f}?v=271"></script>`, html = list => list.map(tag).join('');
    const good = html(['names270.js', ...MINE, 'names271-data.js', 'names271.js', 'names271-freq-data.js', 'names271-freq.js', 'bootstrap61.js']);
    const bads = [['names270.js', 'names271-data.js', 'names271.js', 'names271-freq-data.js', 'names271-freq.js', ...MINE, 'bootstrap61.js'],
      ['names270.js', 'names271-freq-data.js', 'names271-freq.js', ...MINE, 'names271-data.js', 'names271.js', 'bootstrap61.js'],
      [...MINE, 'names270.js', 'names271.js', 'bootstrap61.js'], ['names270.js', 'stories271.js', 'stories271-data.js', 'bootstrap61.js']];
    check(orderProblems(good).length === 0 && bads.every(b => orderProblems(html(b)).length > 0), 'порядок: проверка различает верный порядок и неверные (names271*, names271-freq* раньше stories271)',
      JSON.stringify([orderProblems(good), ...bads.map(b => orderProblems(html(b)))]));
    const real = orderProblems(INDEX);
    if (real === null) note('порядок в index.html не проверен: stories271 ещё не подключён. Нужен: names270.js → ' + [...MINE, ...NAMES].join(' → ') + ' → … → bootstrap61.js');
    else check(real.length === 0, 'порядок в index.html: stories271-data.js, stories271.js — после names270.js, до всех names271*.js и до bootstrap61.js', real.join('; '));
    // Если names271-freq всё же загрузился раньше, снимок не снимается (иначе в нём были бы уже подменённые пулы).
    if (NAMES.some(f => /freq/.test(f))) {
      const { pg, errors, ctx } = await open(browser, null, 'freq-first');
      const r = await pg.evaluate(() => typeof storyNames271 === 'undefined' ? null : { snap: !!storyNames271, late: typeof storyNamesLate271 === 'undefined' ? [] : storyNamesLate271 });
      check(r && !r.snap && r.late.includes('names271-freq.js'), 'неверный порядок (names271-freq раньше stories271) замечен: снимка имён нет, storyNamesLate271 называет файл', JSON.stringify(r));
      check(errors.length === 0, 'неверный порядок: без ошибок страницы', errors.slice(0, 2).join(' | '));
      await ctx.close();
    }
  }
  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без stories271)' : ''));
  process.exit(fail ? 1 : 0);
})();
