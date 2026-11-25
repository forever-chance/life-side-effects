// Проверки сборки 272, часть «вакансии после перезагрузки» (careers272.js).
// careers45.js при каждой загрузке страницы сбрасывает marketKey, рынок квартала собирается заново с тем же ключом,
// а младшие вакансии (…-junior45) и требования к опыту careers45 к нему не добавлял: careerMarket45 уже равен ключу.
// Проверяется: список до и после перезагрузки один и тот же (id, порядок, число, младшие, опыт, договор, работодатель),
// вакансия, заменённая после отклика, остаётся заменённой, фоновый поиск ничего не портит, в новом квартале рынок
// обновляется как прежде, сохранение владелицы (если есть) открывается с теми же вакансиями; экран «Вакансии» с фильтром
// «Без опыта» на телефоне 390×844 и на компьютере 1280×900 показывает одно и то же число до и после перезагрузки.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify272_careers.js
// BASE=1 — прогон без careers272.js: видно, какие проверки ловят старое поведение.
// OWNER_SAVE=путь — сохранение (формат life-side-effects) для проверки на настоящей жизни; без него проверка пропускается.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const FILE = 'careers272.js';
const OWNER = process.env.OWNER_SAVE || '';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };

// wired: index.html отдаётся с careers272.js перед bootstrap61.js — как будет после подключения.
async function open(browser, { viewport = { width: 1280, height: 900 }, wired = false } = {}) {
  const ctx = await browser.newContext({ viewport });
  const wire = wired && !BASE && !INDEX.includes(FILE);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    if (rel === 'index.html' && wire) body = INDEX.replace('<script src="bootstrap61.js', '<script src="' + FILE + '?v=272"></script><script src="bootstrap61.js');
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [], stacks = [];
  pg.on('pageerror', e => { errors.push(String(e.message)); stacks.push(String(e.stack || e.message)); });
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  return { pg, errors, stacks, ctx, wire };
}
async function addFile(pg, wire) {
  if (!BASE && !wire && !INDEX.includes(FILE)) await pg.addScriptTag({ path: path.join(ROOT, FILE) });
}
async function quiet(pg) {
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
  });
}
async function life(o, country) {
  const { pg } = o;
  await pg.evaluate(c => { const e = document.getElementById('country'); e.value = c; e.dispatchEvent(new Event('change', { bubbles: true })); }, country);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await quiet(pg);
  await addFile(pg, o.wire);
  await pg.evaluate(() => { s.age = 25; s.skill = 80; s.cash = 1e7; s.clock.running = false; s.pending = []; });
}
async function flush(pg) { await pg.evaluate(() => { save(); if (typeof flushSave264 === 'function') flushSave264(); }); }
async function reload(o) {
  await flush(o.pg);
  await o.pg.reload();
  await o.pg.waitForFunction("typeof start==='function'&&typeof s!=='undefined'&&s&&s.clock");
  await quiet(o.pg);
  await addFile(o.pg, o.wire);
}
// Снимок рынка: field=null — текущий вид как есть.
function snap(pg, field = null, format = 'near') {
  return pg.evaluate(([field, format]) => {
    const x = path16();
    if (field) x.view = { ...x.view, country: s.country, field, format };
    makeVacancies16();
    const rows = x.vacancies.map(v => ({ id: v.id, prof: v.profession, title: v.title, exp: v.experience45, entry: !!v.entry45, contract: v.contract45 ? v.contract45.type + ':' + v.contract45.months : '', employer: v.employer || '', salary: v.salary, skill: v.minSkill23 }));
    return { key: x.marketKey, cm: x.careerMarket45, rows, ids: rows.map(r => r.id), juniors: rows.filter(r => r.id.endsWith('-junior45')).length };
  }, [field, format]);
}
const sameRows = (a, b, keys = ['id', 'prof', 'title', 'exp', 'entry', 'contract', 'employer', 'salary', 'skill']) =>
  a.rows.length === b.rows.length && a.rows.every((r, i) => keys.every(k => r[k] === b.rows[i][k]));
const firstDiff = (a, b) => { const i = a.rows.findIndex((r, i) => !b.rows[i] || JSON.stringify(r) !== JSON.stringify(b.rows[i])); return i < 0 ? '' : JSON.stringify(a.rows[i]) + ' → ' + JSON.stringify(b.rows[i] || null); };

// Отклик по-настоящему (applyJob16 → replaceVacancy23), требования к кандидату на время отклика сняты.
function apply(pg, pickJunior) {
  return pg.evaluate(pickJunior => {
    const x = path16(), v = x.vacancies.find(v => pickJunior ? v.id.endsWith('-junior45') : !v.entry45 && !v.id.endsWith('-junior45') && !String(v.id).startsWith('vacancy23'));
    if (!v) return null;
    const keep = jobEligibility16;
    jobEligibility16 = () => ({ why: [], probability: .5 });
    delete x.retry['job-' + v.profession + '-' + v.country];
    const index = x.vacancies.indexOf(v);
    try { applyJob16(v.id); } finally { jobEligibility16 = keep; }
    const now = x.vacancies[index];
    return { from: v.id, to: now && now.id, replaced: !!now && now.id !== v.id, applied: x.jobApplications.some(a => a.vacancy.id === v.id) };
  }, pickJunior);
}

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. Новая жизнь: рынок «Информатика» до и после перезагрузки ----------
  {
    const o = await open(browser);
    await life(o, 'ru');
    const a = await snap(o.pg, 'computing');
    check(a.juniors > 0, 'до перезагрузки: младшие вакансии есть', a.juniors + ' из ' + a.rows.length);
    const dev = a.rows.find(r => r.prof === 'developer' && !r.entry);
    check(dev && dev.exp === 12, 'до перезагрузки: разработчику нужен опыт 12 мес.', dev ? String(dev.exp) : 'нет вакансии');
    await o.pg.evaluate(() => { path16().view.section = 'vacancies58'; });
    await reload(o);
    const raw = await o.pg.evaluate(() => ({ key: path16().marketKey, n: path16().vacancies.length }));
    const b = await snap(o.pg);
    check(b.key === a.key, 'после перезагрузки: тот же ключ рынка', String(raw.key) + ' → ' + b.key);
    check(b.juniors === a.juniors, 'после перезагрузки: младшие вакансии на месте', a.juniors + ' → ' + b.juniors);
    check(b.ids.length === a.ids.length && b.ids.every((id, i) => id === a.ids[i]), 'после перезагрузки: те же id, тот же порядок, то же число', a.ids.length + ' → ' + b.ids.length);
    check(sameRows(a, b), 'после перезагрузки: опыт, договор, работодатель, зарплата и навык — те же', firstDiff(a, b));
    const devB = b.rows.find(r => r.prof === 'developer' && !r.entry);
    check(devB && devB.exp === 12, 'после перезагрузки: опыт разработчику по-прежнему нужен', devB ? String(devB.exp) : 'нет вакансии');
    // ещё одна перезагрузка подряд — без открытия рынка между ними
    await reload(o); await reload(o);
    const c = await snap(o.pg);
    check(sameRows(a, c), 'две перезагрузки подряд: список тот же', firstDiff(a, c));

    // ---------- 2. Отклики: заменённая вакансия остаётся заменённой ----------
    const j = await apply(o.pg, true), r = await apply(o.pg, false);
    check(j && j.replaced && j.applied && r && r.replaced && r.applied, 'отклик на младшую и на обычную вакансию: обе заменены новыми публикациями', JSON.stringify([j && j.to, r && r.to]));
    const d = await snap(o.pg);
    await reload(o);
    const e = await snap(o.pg);
    check(sameRows(d, e), 'после откликов и перезагрузки: список тот же, что до перезагрузки', firstDiff(d, e));
    check(j && !e.ids.includes(j.from) && e.ids.includes(j.to), 'младшая вакансия с откликом не вернулась, новая публикация на её месте', j ? j.from.slice(-30) : '');
    check(e.juniors === a.juniors - 1, 'младших вакансий на одну меньше — по числу откликов', a.juniors + ' → ' + e.juniors);

    // ---------- 3. Фоновый поиск после перезагрузки ----------
    await reload(o);
    const bg = await o.pg.evaluate(() => {
      const x = path16();
      x.search = true; if (s.jobSearch) s.jobSearch.enabled = true; x.lastSearch = -99; x.searchView78 = { ...x.view, field: 'media', format: 'near' };
      x.jobApplications = x.jobApplications.filter(a => !['submitted', 'interview', 'interviewing', 'offered', 'accepted'].includes(a.status));
      s.job = null;
      backgroundJobSearch78();
      x.search = false; if (s.jobSearch) s.jobSearch.enabled = false;
      return { key: x.marketKey, field: x.view.field };
    });
    const f = await snap(o.pg);
    check(bg.field === 'computing' && sameRows(d, f), 'фоновый поиск по другой сфере после перезагрузки: свой список не меняется', firstDiff(d, f));

    // ---------- 4. Новый квартал: рынок обновляется как прежде ----------
    await o.pg.evaluate(() => { for (let i = 0; i < 3; i++) { s.pending = []; if ($('#modal').open) closeModal(); advanceMonth(); } s.pending = []; if ($('#modal').open) closeModal(); s.clock.running = false; });
    const q = await snap(o.pg, 'computing');
    const prefix = 'vac-' + q.key + '-';
    check(q.key !== a.key && q.key.split('|')[3] === String(+a.key.split('|')[3] + 1), 'новый квартал: новый ключ рынка', a.key + ' → ' + q.key);
    check(q.rows.every(r => r.id.startsWith(prefix)), 'новый квартал: все вакансии новые, прежних и заменённых нет', q.rows.filter(r => !r.id.startsWith(prefix)).map(r => r.id).slice(0, 2).join(', '));
    check(q.juniors === a.juniors, 'новый квартал: младших вакансий столько же, сколько в начале прошлого', a.juniors + ' → ' + q.juniors);
    await reload(o);
    const q2 = await snap(o.pg);
    check(sameRows(q, q2), 'новый квартал и перезагрузка: список тот же', firstDiff(q, q2));
    check(o.errors.length === 0, 'новая жизнь: без ошибок страницы', o.errors.slice(0, 2).join(' | '));
    await o.ctx.close();
  }

  // ---------- 5. Сохранение, где список уже пересобран без младших (так было в 271) ----------
  {
    const o = await open(browser);
    await life(o, 'au');
    const a = await snap(o.pg, 'media');
    // ломаем, как ломала перезагрузка в 271: сбрасываем ключ и собираем без careers272
    await o.pg.evaluate(() => {
      const x = path16(); x.marketKey = null;
      if (typeof careers272Base === 'object') careers272Base.makeVacancies16(); else makeVacancies16();
    });
    const broken = await o.pg.evaluate(() => ({ juniors: path16().vacancies.filter(v => v.id.endsWith('-junior45')).length, cm: path16().careerMarket45 === path16().marketKey }));
    // загрузка через «Персонажи», без перезагрузки страницы: сброс из careers45 не случается, в сохранении ключ совпал с отметкой
    await o.pg.evaluate(() => { const id = s.saveId; save(); if (typeof flushSave264 === 'function') flushSave264(); s = null; loadCharacter(id); if ($('#modal').open) closeModal(); s.pending = []; });
    const raw = await o.pg.evaluate(() => path16().marketKey);
    const b = await snap(o.pg);
    check(broken.juniors === 0 && broken.cm, 'сломанный список воспроизведён: младших нет, отметка совпала с ключом', JSON.stringify(broken));
    check(raw === a.key && sameRows(a, b), 'сломанный список: при первом открытии рынок собран заново, младшие вернулись', a.juniors + ' → ' + b.juniors + ' ' + firstDiff(a, b));
    check(o.errors.length === 0, 'сломанный список: без ошибок страницы', o.errors.slice(0, 2).join(' | '));
    await o.ctx.close();
  }

  // ---------- 6. Файл подключён в index.html перед bootstrap61.js ----------
  if (!BASE && !INDEX.includes(FILE)) {
    const o = await open(browser, { wired: true });
    await life(o, 'de');
    const a = await snap(o.pg, 'computing', 'remote');
    await reload(o);
    const b = await snap(o.pg);
    check(o.wire && a.juniors > 0 && sameRows(a, b), 'подключён перед bootstrap61.js: удалёнка, список тот же после перезагрузки', a.juniors + ' → ' + b.juniors + ' ' + firstDiff(a, b));
    check(o.errors.length === 0, 'подключён перед bootstrap61.js: без ошибок страницы', o.errors.slice(0, 2).join(' | '));
    await o.ctx.close();
  }

  // ---------- 7. Экран «Вакансии», фильтр «Без опыта»: телефон и компьютер ----------
  for (const viewport of [{ width: 390, height: 844 }, { width: 1280, height: 900 }]) {
    const o = await open(browser, { viewport });
    await life(o, 'nl');
    const screen = async () => {
      await o.pg.evaluate(() => { const x = path16(); x.view = { ...x.view, country: s.country, format: 'near', fte28: 'all', page: 0 }; openPath16('vacancies58'); });
      await o.pg.selectOption('select[aria-label="Направление"]', 'computing');
      await o.pg.selectOption('select[aria-label="Опыт"]', 'none');
      const text = await o.pg.locator('#vacancy-results180 > p').first().innerText();
      // все страницы списка: «→» нажимается, пока не станет неактивной
      const titles = [];
      for (let i = 0; i < 40; i++) {
        titles.push(...(await o.pg.locator('#vacancy-results180 article h3').allInnerTexts()).map(t => t.replace(/\s+/g, ' ').trim()));
        const next = o.pg.locator('#vacancy-results180 button', { hasText: '→' });
        if (await next.isDisabled()) break;
        await next.click();
      }
      const wide = await o.pg.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
      return { n: parseInt(text, 10), titles, wide };
    };
    const a = await screen();
    await reload(o);
    const b = await screen();
    const tag = viewport.width < 500 ? 'телефон' : 'компьютер';
    check(a.n > 0 && a.n === b.n, tag + ': «Без опыта» — столько же вакансий после перезагрузки', a.n + ' → ' + b.n);
    const junior = list => list.filter(t => /^Младший/.test(t)).length;
    check(a.titles.length === a.n && junior(a.titles) > 0, tag + ': «→» проходит все страницы, младшие вакансии в списке', a.titles.length + ' карточек, младших ' + junior(a.titles));
    check(a.titles.join('|') === b.titles.join('|'), tag + ': после перезагрузки — те же карточки по всем страницам', 'младших ' + junior(a.titles) + ' → ' + junior(b.titles));
    check(a.wide && b.wide, tag + ': без горизонтальной прокрутки');
    check(o.errors.length === 0, tag + ': без ошибок страницы', o.errors.slice(0, 2).join(' | '));
    await o.ctx.close();
  }

  // ---------- 8. Сохранение владелицы ----------
  if (OWNER && fs.existsSync(OWNER)) {
    const raw = fs.readFileSync(OWNER, 'utf8');
    const o = await open(browser);
    await o.pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
    await quiet(o.pg);
    await addFile(o.pg, o.wire);
    const who = await o.pg.evaluate(() => s.name + ' · ' + s.age + ' · ' + s.country + ' · ' + path16().view.field);
    const a = await snap(o.pg);
    const m = await snap(o.pg, 'computing');
    await o.pg.evaluate(() => { const x = path16(); x.view = { ...x.view, field: 'media' }; makeVacancies16(); });
    await reload(o);
    const b = await snap(o.pg);
    check(a.juniors > 0 && sameRows(a, b), 'сохранение владелицы (' + who + '): вакансии те же после перезагрузки', a.juniors + ' → ' + b.juniors + ' ' + firstDiff(a, b));
    const m2 = await snap(o.pg, 'computing');
    check(m.juniors > 0 && m2.juniors === m.juniors && m2.ids.join() === m.ids.join(), 'сохранение владелицы: другой рынок того же квартала — тот же', m.juniors + ' → ' + m2.juniors);
    // В этом сохранении при загрузке страницы падают промежуточные render() из модулей до language-clubs53.js
    // (careers45.js и др. вызывают render() при подключении): clubs19.js activitiesView не находит клуб reading53_en,
    // который регистрирует более поздний language-clubs53.js. Это не рынок вакансий и бывает и без careers272.js;
    // здесь считаются ошибки из файлов работы и вакансий.
    const JOB = /careers\d+\.js|trajectory(-ui)?16\.js|employment28\.js|documents45\.js|specializations46\.js|rights31\.js|teaching26\.js|life23\.js:29|workspaces58\.js|jobs270\.js|employers271\.js/;
    const mine = o.stacks.filter(st => JOB.test(st.split('\n').slice(0, 3).join(' ')));
    const other = o.stacks.filter(st => !mine.includes(st));
    if (other.length) console.log('--   сохранение владелицы: ошибок не из вакансий ' + other.length + ', первая: ' + other[0].split('\n').slice(0, 2).join(' ').replace(/\s+/g, ' ').slice(0, 160));
    check(mine.length === 0, 'сохранение владелицы: без ошибок в коде вакансий', mine.slice(0, 1).join(''));
    await o.ctx.close();
  } else console.log('--   сохранение владелицы не задано (OWNER_SAVE), проверка пропущена');

  await browser.close();
  console.log(`\n${pass} ok, ${fail} fail${BASE ? ' (BASE=1, без ' + FILE + ')' : ''}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
