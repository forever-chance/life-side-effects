// Проверки сборки 279.1.3 (langs27913.js, langs27913-hints.js, unis2791.js, unis2791-data.js): местные языки Испании —
// каталанский (Барселона, Валенсия), галисийский (Сантьяго-де-Компостела), баскский (Бильбао).
// Игра раздаётся с диска, сервер не нужен:  node tools/verify27913_langs.js
// BASE=1 — вместо нынешних index.html, unis2791.js и unis2791-data.js файлы сборки 279.1.2 (git show REF27912:…, по
//   умолчанию a2c4b97; новых файлов сборки тогда нет): видно, какие проверки ловят прежнее поведение.
// OWNER_SAVE=файл — ещё и настоящее сохранение (экспорт «Ваши персонажи»; берётся последний персонаж).
// UNIS_RESEARCH=all.json — исследовательский файл (не в репозитории): ни одного настоящего названия в файлах игры.
// Город рождения новой жизни в игре — город страны по умолчанию (countries[cc].city; в Испании — Валенсия); родиться в
// другом городе тест даёт, меняя этот город перед «Родиться». Валенсию тест проверяет и без подмены.
// Что проверяется:
// • данные: строки 279.1.2 те же, у 28 заведений Испании в конце '' и 'cat+es' / 'glg+es' / 'eus+es' / 'en+es';
//   ключи языков не совпадают с кодами стран и прежними языками;
// • id: все программы 279.1.2 на месте с тем же вузом, ценой, отбором, сроком, названием и языком (сверка с git show);
//   новые — только копии «-cat», «-glg», «-eus» в Испании и «-en» у Института бизнеса Кастельяна, язык в названии;
// • родной язык новой жизни — смотря какая семья (решение ведущего): из 200 рождений в Валенсии (без подмены города)
//   каталанский родной у 25–45 % семей без мигрантов, в Мадриде (100) — ни у кого, Барселона, Сантьяго и Бильбао (по
//   120) — около 55, 50 и 25 % (границы 40–75, 35–68, 12–40); у мигрантов — никогда; в семье, где говорят на нём, — родной вместе с испанским (с 0 и
//   с 18 лет), иначе с 18 лет — школьный уровень города (Барселона B2, Валенсия и Сантьяго B1, Бильбао A2); тот же сид —
//   тот же результат;
// • ребёнок, переехавший из Мадрида в Барселону в 7 лет, к 12 знает каталанский; в Мадриде — нет; в Бильбао с рождения —
//   к 12 баскский A2, не выше;
// • курсы: в Барселоне и Валенсии каталанский учить можно (цена и срок как у любого курса), в Мадриде — нет; галисийский —
//   в Сантьяго, баскский — в Бильбао; «Языки» — «Местный язык · Барселона», не «Язык страны»; клубы — только в городе;
//   окно программы на каталанском из Мадрида — без «Изучать язык» (вело в «Языки» без карточки), с причиной в условиях;
//   курс из Барселоны в Мадриде на паузе и продолжается после возвращения; знакомый из клуба каталанского — испаноязычный;
// • вузы: карточка в Барселоне — «· на каталанском», «Учат на каталанском и испанском.», Валенсия — «Каталанский здесь
//   называют валенсийским.»; каталаноязычной со слабым испанским открыты все 12 заведений Барселоны; испаноязычной —
//   каждая программа на испанском, как в 279.1.2; у Института бизнеса Кастельяна — и на английском, и на испанском;
// • работа в Барселоне: испаноязычной — те же вакансии, язык и причины, что в 279.1.2; каталанский не нужен нигде;
// • сохранение 279.1.2 с учёбой, предложением и заявкой в Барселоне — тот же язык, учёба до диплома, и при открытии игры
//   после обновления; родные языки старой жизни не меняются; новый ключ языка в старом сохранении ничего не ломает;
//   сохранение без школьных языков (старше сборки 73) в Барселоне — без каталанского задним числом (и при обновлении);
// • наследник: ребёнок героя с родным баскским — родной, иначе по долям семей (Валенсия 25–45 %), взрослому — школьный;
// • сохранение владелицы — год без ошибок и NaN.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const BASE = process.env.BASE === '1', REF = process.env.REF27912 || 'a2c4b97';
const OWNER = process.env.OWNER_SAVE || '', RESEARCH = process.env.UNIS_RESEARCH || '';
const PHONE = { width: 390, height: 844 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 1200) : '')); };
const note = t => console.log('     ' + t);
const git = f => { try { return execSync('git -C ' + JSON.stringify(ROOT) + ' show ' + REF + ':' + f, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
const FILES = ['index.html', 'unis2791.js', 'unis2791-data.js'];
const NEW = ['langs27913.js', 'langs27913-hints.js'];
const OLD = Object.fromEntries(FILES.map(f => [f, git(f)]));
const parseData = text => { try { return JSON.parse(/const unis2791Data=(\{[\s\S]*\});\s*$/.exec(text)[1]); } catch (e) { return null; } };
const BCN = 'Барселона', VAL = 'Валенсия', MAD = 'Мадрид', SCQ = 'Сантьяго-де-Компостела', BIO = 'Бильбао';
// Заведения Испании, где источник называет местный язык (и английский у Кастельяны), — как печатает
// python3 tools/unis2791_build.py all.json --check: 'es cat+es': 18, 'es eus+es': 5, 'es glg+es': 4, 'es en+es': 1.
const SPEC = { [BCN]: ['cat+es', 12], [VAL]: ['cat+es', 6], [SCQ]: ['glg+es', 4], [BIO]: ['eus+es', 5], [MAD]: ['en+es', 1] };
const PREP = { cat: 'каталанском', glg: 'галисийском', eus: 'баскском', en: 'английском' };
const CASTELLANA = 'Институт бизнеса Кастельяна · Мадрид';

async function open(browser, { old = false, raw = null, seed = 27913, age = '0', city = null, origin = null } = {}) {
  const ctx = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 1 });
  const state = { old: old || BASE };
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || state.old && NEW.includes(rel)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : state.old && OLD[rel] ? OLD[rel] : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (raw) await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  else await born(pg, { seed, age, city, origin });
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await helpers(pg);
  return { pg, ctx, errors, state };
}
// Новая жизнь в Испании; city — где родиться (город страны по умолчанию на время «Родиться»).
async function born(pg, { seed = 27913, age = '0', city = null, origin = null } = {}) {
  await pg.evaluate(([age, origin]) => { if (typeof intro === 'function' && !document.getElementById('country')) intro(); for (const [k, v] of [['startAge', age], ['country', 'es'], ['familyOrigin17', origin]]) { const e = document.getElementById(k); if (!e || v == null) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, [age, origin]);
  await pg.evaluate(([seed, city]) => {
    const keep = countries.es.city; if (city) countries.es.city = city;
    Math.random = seeded269(seed);
    try { [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click(); } finally { countries.es.city = keep; }
  }, [seed, city]);
}
async function helpers(pg) {
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = []; s.clock.running = false; s.ui05.panel = 'center';
    window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
    window.__month = (n = 1) => { for (let i = 0; i < n; i++) { __close(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } __close(); advanceMonth(); } __close(); };
    window.__nan = () => { const bad = []; const walk = (o, p, d) => { if (d > 7 || !o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if (typeof v === 'number' && !Number.isFinite(v)) bad.push(p + '.' + k); else if (v && typeof v === 'object') walk(v, p + '.' + k, d + 1); } }; walk(s, 's', 0); return bad.slice(0, 5); };
    window.__live = city => { s.housing.city = city; if (s.housing.home) s.housing.home.city = city; s.housing.mode = 'rent'; s.housing.active = true; };
    window.__speaker = (langs, native) => { const x = path16(); x.languages = { ...langs }; x.native = [].concat(native); s.age = Math.max(18, s.age); s.school = s.school || {}; s.school.grades = 75; x.diplomas = []; x.applications = []; x.jobApplications = []; x.retry = {}; s.skill = 40; x.experience.skills = {}; x.experience.fields = {}; x.experience.projects = []; s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'pathLanguage'); };
    window.__plain = p => !p.track45 && !p.subject26 && !p.occupation68;
    window.__ok = p => { const r = admission16(p); return !r.why.length && r.probability > 0; };
    window.__tab = () => { __close(); s.ui05.panel = 'center'; openPath16('languages'); return document.querySelector('[data-panel="center"] .trajectory') || document.querySelector('.trajectory'); };
    // Вакансии «рядом с домом» по всем направлениям: id, должность, город, язык и причины (одинаковый Math.random).
    window.__jobs = () => {
      const x = path16(), view = { ...x.view }, out = [];
      Object.keys(fields16).forEach((field, i) => {
        x.view = { ...view, section: 'jobs', country: 'es', field, format: 'near', page: 0 }; x.marketKey = null;
        const keep = Math.random; Math.random = seeded269(5000 + i);
        try { makeVacancies16(); } finally { Math.random = keep; }
        for (const v of x.vacancies) out.push([v.id, v.title, v.city, v.language, jobEligibility16(v).why.join(' | ')]);
      });
      x.view = view; return out;
    };
  });
}
async function catalog(pg, view) {
  await pg.evaluate(view => { __close(); const x = path16(); x.view = { ...x.view, section: 'admission58', country: 'es', page: 0, city2791: '', ...view }; s.ui05.panel = 'center'; openPath16('admission58'); }, view);
  await pg.waitForTimeout(60);
  return pg.evaluate(() => {
    const t = document.querySelector('[data-panel="center"] .trajectory') || document.querySelector('.trajectory');
    return [...(t ? t.querySelectorAll('.uni2791') : [])].map(c => ({ name: c.querySelector('h3').textContent, terms: c.querySelector('.uni-terms2791')?.innerText || '', chips: [...c.querySelectorAll('.chip2791')].map(b => b.textContent) }));
  });
}
// Учащиеся: заведения города — [название, программ бакалавриата и профессионального (общих) на языке lang, открыто].
const OPEN_FN = ([cities, langs, native, lang]) => {
  __speaker(langs, native);
  const out = {};
  for (const c of cities) {
    __live(c);
    out[c] = universities16.filter(u => u.country === 'es' && u.city === c && u.kind2791).map(u => {
      const ps = programs16.filter(p => p.university === u.id && ['bachelor', 'vocational'].includes(p.level) && __plain(p) && (!lang || p.language === lang));
      return [u.name, ps.length, ps.filter(__ok).length, !!u.langs27912];
    });
  }
  return out;
};
// Испаноязычная в Барселоне: причины и шанс по каждой программе Испании на испанском (admission16).
const ADMIT_FN = () => {
  __live('Барселона'); __speaker({ es: 6, en: 2 }, 'es');
  return Object.fromEntries(programs16.filter(p => p.country === 'es' && p.language === 'es').map(p => { const r = admission16(p); return [p.id, r.why.join(' | ') + ' · ' + Math.round(r.probability * 1000)]; }));
};
// Сохранение 279.1.2 в Барселоне: учёба в «Монжуик» (информатика), предложение «Льобрегат» (экономика), заявка в
// «Тибидабо» (инженерия) с приёмной комиссией. Всё на испанском.
const MAKE_SAVE = status => {
  __live('Барселона'); __speaker({ es: 6, en: 3 }, 'es'); s.cash = Math.max(s.cash, 5e6);
  const x = path16(), uni = n => universities16.find(u => u.name === n);
  const pick = (n, f, l) => programs16.find(p => p.university === uni(n)?.id && p.field === f && p.level === l && __plain(p) && p.language === 'es');
  const st = pick('Университет Монжуик · Барселона', 'computing', 'bachelor'), of = pick('Автономный университет Льобрегат · Барселона', 'business', 'bachelor'), ap = pick('Политехнический университет Тибидабо · Барселона', 'engineering', 'bachelor');
  x.applications.push({ id: 'app27913-study', program: st.id, status: 'enrolled', probability: .8, roll: .1, submitted: s.clock.ticks - 40, scholarship: null });
  x.study = { id: 'study27913', application: 'app27913-study', program: st.id, progress: st.months - 3, payer: 'self', status: 'active', research: 0, grades: 80, badTerms: 0 };
  x.applications.push({ id: 'app27913-offer', program: of.id, status, probability: .7, roll: .1, submitted: s.clock.ticks - 2, expires: s.clock.ticks + 18, ...(status === 'accepted' ? { accepted: s.clock.ticks } : {}), scholarship: null });
  x.applications.push({ id: 'app27913-apply', program: ap.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
  s.clock.tasks.push({ id: 'process27913', kind: 'pathAdmission', label: 'Приемная комиссия · ' + uni16(ap).name, duration: 2, progress: 0, hours: 2, state: 'planned', application: 'app27913-apply' });
  const row = p => [p.id, uni16(p).name, programName26(p), p.language];
  window.__old = { study: row(st), offer: row(of), apply: row(ap), langs: JSON.stringify(x.languages), native: x.native.join() };
  save(); if (typeof flushSave264 === 'function') flushSave264();
  return { raw: JSON.stringify({ format: 'life-side-effects', version: 1, exportedAt: new Date().toISOString(), lives: [JSON.parse(JSON.stringify(s))] }), old: window.__old, id: s.saveId };
};

(async () => {
  if (FILES.some(f => !OLD[f])) { console.log('FAIL нет файлов сборки 279.1.2 (git show ' + REF + ') — сравнивать не с чем'); process.exit(1); }
  const browser = await chromium.launch();

  // ---------- 0. Данные ----------
  {
    const dataText = BASE ? OLD['unis2791-data.js'] : fs.readFileSync(path.join(ROOT, 'unis2791-data.js'), 'utf8');
    const now = parseData(dataText), was = parseData(OLD['unis2791-data.js']);
    const diff = [], got = {};
    for (const [cc, rows] of Object.entries(was?.countries || {})) {
      const by = new Map((now?.countries?.[cc] || []).map(r => [r[0], r]));
      for (const r of rows) {
        const n = by.get(r[0]);
        if (!n || JSON.stringify(n.slice(0, r.length)) !== JSON.stringify(r)) { diff.push(cc + '-n' + r[0]); continue; }
        if (n.length === r.length) continue;
        if (cc !== 'es' || r.length !== 13 || n.length !== 15 || n[13] !== '') { diff.push(cc + '-n' + r[0] + ' ' + JSON.stringify(n.slice(13))); continue; }
        const k = n[1] + ' ' + n[14]; got[k] = (got[k] || 0) + 1;
      }
      if ((now?.countries?.[cc] || []).length !== rows.length) diff.push(cc + ' число');
    }
    const want = Object.fromEntries(Object.entries(SPEC).map(([c, [spec, n]]) => [c + ' ' + spec, n]));
    check('данные: строки 279.1.2 те же, меняются только заведения Испании — в конце пустое поле и «местный язык+es»', now && diff.length === 0, diff.slice(0, 8));
    check('данные: Барселона 12 и Валенсия 6 — cat+es, Сантьяго 4 — glg+es, Бильбао 5 — eus+es, Кастельяна — en+es', JSON.stringify(Object.fromEntries(Object.entries(got).sort())) === JSON.stringify(Object.fromEntries(Object.entries(want).sort())), got);
    const castellana = (now?.countries?.es || []).find(r => r[2] === CASTELLANA);
    check('данные: у Института бизнеса Кастельяна — en+es, у остальных заведений Мадрида поля нет', castellana && castellana[14] === 'en+es' && (now?.countries?.es || []).filter(r => r[1] === MAD && r[2] !== CASTELLANA).every(r => r.length === 13), castellana);
    const shipped = [...NEW.map(f => fs.existsSync(path.join(ROOT, f)) ? fs.readFileSync(path.join(ROOT, f), 'utf8') : ''), BASE ? OLD['unis2791.js'] : fs.readFileSync(path.join(ROOT, 'unis2791.js'), 'utf8'), dataText].join('\n');
    check('данные: нет real_name, source и ссылок', !/real_name|"source"|https?:|www\./.test(shipped));
    // Подключение: langs27913.js — до вузов (они читают lang16 при загрузке), после continue274.js; подсказки — после
    // study2733.js и windows273.js, до bootstrap61.js; оба файла — в offline-assets.json (одна строка, по алфавиту).
    const html = BASE ? OLD['index.html'] : fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    const order = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]), at = f => order.indexOf(f);
    check('подключение: langs27913.js — после continue274.js, перед unis2791-data.js; langs27913-hints.js — после study2733.js и windows273.js, перед bootstrap61.js', at('langs27913.js') > at('continue274.js') && at('langs27913.js') === at('unis2791-data.js') - 1 && at('langs27913-hints.js') > at('study2733.js') && at('langs27913-hints.js') > at('windows273.js') && at('langs27913-hints.js') < at('bootstrap61.js') && at('continue274.js') >= 0, order.slice(at('continue274.js'), at('unis2791.js') + 1).concat(['…'], order.slice(at('study2733.js'), at('bootstrap61.js') + 1)));
    const assetsText = (BASE ? git('offline-assets.json') : fs.readFileSync(path.join(ROOT, 'offline-assets.json'), 'utf8')) || '[]', assets = JSON.parse(assetsText);
    check('офлайн: langs27913.js и langs27913-hints.js — в offline-assets.json, одной строкой, по алфавиту', NEW.every(f => assets.includes(f)) && JSON.stringify(assets) === JSON.stringify([...assets].sort()) && !/\n/.test(assetsText) && /v=279\.1\.3/.test(html), NEW.filter(f => !assets.includes(f)));
    if (RESEARCH && fs.existsSync(RESEARCH)) {
      const src = JSON.parse(fs.readFileSync(RESEARCH, 'utf8'));
      const real = src.flatMap(c => c.institutions.flatMap(u => [u.real_name, u.real_name_en])).filter(n => n && n.length >= 6);
      const hay = shipped + fs.readFileSync(__filename, 'utf8') + fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), found = [...new Set(real.filter(n => hay.includes(n)))];
      check('данные: ни одного настоящего названия (' + real.length + ') в unis2791-data.js, unis2791.js, langs27913*.js, index.html и этом тесте', found.length === 0, found.slice(0, 5).join(' | '));
    } else note('UNIS_RESEARCH не задан — сверка с настоящими названиями пропущена');
  }

  // ---------- 1. Сборка 279.1.2: эталон ----------
  const ref = {};
  {
    const { pg, ctx, errors } = await open(browser, { old: true, seed: 279131, age: '18', city: BCN });
    ref.programs = await pg.evaluate(() => programs16.map(p => [p.id, p.university, p.field, p.level, p.fee, p.selectivity, p.months, p.minLanguage, programName26(p), p.language, p.country]));
    ref.chips = await pg.evaluate(() => Object.fromEntries(programs16.map(p => [p.id, chipLabel2791(p)])));
    ref.born = await pg.evaluate(() => [s.birthCity, path16().native.join(), JSON.stringify(path16().languages)]);
    ref.cat = await pg.evaluate(OPEN_FN, [['Барселона', 'Валенсия', 'Бильбао', 'Сантьяго-де-Компостела'], { es: 2, en: 1, cat: 6, eus: 6, glg: 6 }, ['cat', 'eus', 'glg'], null]);
    ref.admit = await pg.evaluate(ADMIT_FN);
    ref.jobsEs = await pg.evaluate(B => { __live(B); __speaker({ es: 6, en: 2 }, 'es'); return __jobs(); }, BCN);
    ref.keys = await pg.evaluate(() => [Object.keys(lang16), Object.keys(countries)]);
    ref.save = await pg.evaluate(MAKE_SAVE, 'offered');
    check('279.1.2: эталон снят без ошибок, учёба и заявки в Барселоне — испанский', errors.length === 0 && ref.save.old.study[3] === 'es' && ref.save.old.offer[3] === 'es' && ref.save.old.apply[3] === 'es', [errors.slice(0, 2), ref.save.old]);
    await ctx.close();
  }
  const opened = m => Object.values(m).flat().filter(r => r[2] > 0).length, total = m => Object.values(m).flat().length;
  {
    const [langs, ccs] = ref.keys, keys = ['cat', 'glg', 'eus'];
    check('ключи языков cat, glg, eus — не коды стран (Канада — ca) и не прежние языки', keys.every(k => !langs.includes(k) && !ccs.includes(k)) && ccs.includes('ca'), ref.keys);
  }

  // ---------- 2. Новая сборка: программы и карточки ----------
  {
    const { pg, ctx, errors } = await open(browser, { seed: 279131, age: '18', city: MAD });
    const ids = await pg.evaluate(([programs, PREP, CASTELLANA]) => {
      const known = new Map(programs.map(r => [r[0], r])), out = { missing: [], changed: [], added: 0, addedBad: [], per: {}, incomplete: [], cast: [] };
      for (const r of programs) {
        const p = prog16(r[0]);
        if (!p) { out.missing.push(r[0]); continue; }
        const now = [p.id, p.university, p.field, p.level, p.fee, p.selectivity, p.months, p.minLanguage, programName26(p), p.language, p.country];
        if (JSON.stringify(now) !== JSON.stringify(r)) out.changed.push(r[0]);
      }
      const cast = universities16.find(u => u.name === CASTELLANA);
      for (const p of programs16) if (!known.has(p.id)) {
        out.added++;
        const m = /^(.*)-(cat|glg|eus|en)$/.exec(p.id), base = m && known.get(m[1]);
        out.per[m ? m[2] : '?'] = (out.per[m ? m[2] : '?'] || 0) + 1;
        if (!m || !base || p.country !== 'es' || !p.copy27912 || p.language !== m[2] || base[9] !== 'es' || (m[2] === 'en') !== (p.university === cast?.id) || programName26(p) !== base[8] + ' · на ' + PREP[m[2]] || p.fee !== base[4] || p.selectivity !== base[5] || p.months !== base[6] || p.university !== base[1] || p.level === 'certificate' || p.subject26) out.addedBad.push(p.id);
      }
      // У каждой программы заведения на двух языках в Испании (ступени с копиями) — такая же на другом языке.
      const by = new Map();
      for (const p of programs16) { const l = by.get(p.university); if (l) l.push(p); else by.set(p.university, [p]); }
      let pairs = 0;
      for (const u of universities16.filter(u => u.country === 'es' && u.langs27912)) for (const p of by.get(u.id) || []) {
        if (p.copy27911 || p.subject26 || !['bachelor', 'master', 'phd', 'vocational'].includes(p.level)) continue;
        const other = u.langs27912.find(l => l !== p.language) || null;
        if (p.english2791 && u.id !== cast.id) continue;   // английский 279.1 у части программ — без копий
        const twin = p.copy27911 ? null : prog16(p.id + '-' + other) || (p.language !== 'es' ? prog16(p.id.replace(/-(cat|glg|eus|en)$/, '')) : null);
        pairs++; if (!twin || twin.language !== other) out.incomplete.push(p.id + ' → ' + other);
      }
      out.pairs = pairs; out.unis = universities16.filter(u => u.country === 'es' && u.langs27912).map(u => u.city + ' ' + u.langs27912.join('+'));
      // Кастельяна: каждая программа ступеней с копиями — и на английском, и на испанском.
      const cps = (by.get(cast.id) || []).filter(p => ['bachelor', 'master'].includes(p.level));
      const key = p => p.id.replace(/-en$/, '');
      const langsOf = new Map(); for (const p of cps) { const k = key(p); langsOf.set(k, (langsOf.get(k) || '') + p.language); }
      out.cast = [...langsOf].filter(([, l]) => ![...l.matchAll(/en|es/g)].map(m => m[0]).sort().join() === 'en,es').map(([k, l]) => k + ':' + l);
      out.castN = langsOf.size; out.castLaw = cps.filter(p => p.field === 'law').map(p => p.language).sort().join('/');
      return { ...out, missing: out.missing.slice(0, 5), changed: out.changed.slice(0, 5), addedBad: out.addedBad.slice(0, 5), incomplete: out.incomplete.slice(0, 5) };
    }, [ref.programs, PREP, CASTELLANA]);
    check('id: все ' + ref.programs.length + ' программ 279.1.2 на месте — вуз, направление, ступень, цена, отбор, срок, название и язык', ids.missing.length === 0 && ids.changed.length === 0, { missing: ids.missing, changed: ids.changed });
    check('id: новые (' + ids.added + ') — только копии «-cat», «-glg», «-eus» в Испании и «-en» у Кастельяны, язык в названии, без сертификатов и предметов учителя', ids.added > 0 && ids.addedBad.length === 0 && !ids.per['?'], [ids.addedBad, ids.per]);
    note('новые копии: ' + JSON.stringify(ids.per) + '; заведений на двух языках в Испании ' + ids.unis.length);
    check('заведения Испании на двух языках (' + ids.unis.length + '): у каждой программы есть такая же на другом языке (' + ids.pairs + ' пар)', ids.unis.length === 28 && ids.pairs > 0 && ids.incomplete.length === 0, [ids.incomplete, ids.unis]);
    check('Кастельяна (Мадрид): все ' + ids.castN + ' программ бакалавриата и магистратуры — и на английском, и на испанском (право тоже: ' + ids.castLaw + ')', ids.castN > 0 && ids.cast.length === 0 && ids.castLaw === 'en/en/es/es', ids.cast);

    // Каталаноязычная (испанский A2): заведения Барселоны, Валенсии, Бильбао и Сантьяго на местном языке.
    const cat = await pg.evaluate(OPEN_FN, [[BCN, VAL, BIO, SCQ], { es: 2, en: 1, cat: 6, eus: 6, glg: 6 }, ['cat', 'eus', 'glg'], null]);
    const both = c => cat[c].filter(r => r[3]);
    check('каталаноязычная со слабым испанским: в Барселоне все ' + both(BCN).length + ' заведений открыты (в 279.1.2 — ' + ref.cat[BCN].filter(r => r[2] > 0).length + ' из ' + ref.cat[BCN].length + ')', both(BCN).length === 12 && cat[BCN].every(r => r[3] && r[2] > 0) && ref.cat[BCN].every(r => r[2] === 0), [cat[BCN], ref.cat[BCN]]);
    check('то же в Валенсии (6 с валенсийским), Бильбао (5) и Сантьяго (4): у всех есть программы на местном языке, шанс больше нуля', both(VAL).length === 6 && both(BIO).length === 5 && both(SCQ).length === 4 && [VAL, BIO, SCQ].every(c => both(c).every(r => r[2] > 0)), cat);
    note('со слабым испанским и родным местным открыто: 279.1.2 — ' + opened(ref.cat) + ' из ' + total(ref.cat) + ' заведений четырёх городов, теперь — ' + opened(cat));
    const admit = await pg.evaluate(ADMIT_FN);
    const admitBad = Object.entries(ref.admit).filter(([id, v]) => admit[id] !== v);
    check('испаноязычная: каждая программа Испании на испанском (' + Object.keys(ref.admit).length + ') на месте, причины и шанс — как в 279.1.2', admitBad.length === 0 && Object.keys(ref.admit).every(id => id in admit), admitBad.slice(0, 3).map(([id, v]) => [id, v, admit[id]]));

    // Карточки и «О вузе».
    await pg.evaluate(B => { __live(B); __speaker({ es: 6, en: 2 }, 'es'); }, BCN);
    const bcnEs = await catalog(pg, { field: 'computing', level: 'bachelor', city2791: BCN });
    const mj = bcnEs.find(c => /Монжуик/.test(c.name));
    check('карточка «Монжуик» испаноязычной: кнопки «Информатика» и «Информатика · на каталанском», язык не пишется, «Шанс поступить»', mj && mj.chips.includes('Информатика') && mj.chips.includes('Информатика · на каталанском') && !/· на /.test(mj.terms) && /Шанс поступить/.test(mj.terms), mj || bcnEs.map(c => c.name));
    await pg.evaluate(B => { __live(B); __speaker({ es: 2, en: 1, cat: 6 }, ['cat']); }, BCN);
    const bcnCat = await catalog(pg, { field: 'computing', level: 'bachelor', city2791: BCN });
    const wide = await pg.evaluate(() => document.documentElement.scrollWidth);
    const mj2 = bcnCat.find(c => /Монжуик/.test(c.name));
    check('карточка «Монжуик» каталаноязычной: «· на каталанском», «Шанс поступить»; на телефоне без прокрутки вбок', mj2 && /· на каталанском/.test(mj2.terms) && /Шанс поступить/.test(mj2.terms) && bcnCat.every(c => !/Не хватает: Испанский/.test(c.terms)) && wide <= PHONE.width, [mj2, wide]);
    const apply = await pg.evaluate(() => {
      const u = universities16.find(u => u.name === 'Университет Монжуик · Барселона'), p = programs16.find(p => p.university === u.id && p.field === 'computing' && p.level === 'bachelor' && p.language === 'cat' && __plain(p));
      if (!p) return { none: true };
      s.cash = Math.max(s.cash, 5e6);
      const msgs = [], keep = toast; toast = t => msgs.push(t);
      try { apply16(p.id); } finally { toast = keep; }
      const a = path16().applications.find(a => a.program === p.id);
      return { id: p.id, status: a?.status, msgs, name: programName26(p) };
    });
    check('каталаноязычная подаёт заявку на «Информатика · на каталанском» в «Монжуик»', apply.status && ['submitted', 'offered', 'accepted'].includes(apply.status) && apply.name === 'Информатика · на каталанском', apply);
    const about = await pg.evaluate(() => { const a = n => aboutUni2791(universities16.find(u => u.name === n)); return { bcn: a('Университет Монжуик · Барселона'), born: a('Университет Борн · Барселона'), val: a('Университет Турия · Валенсия'), valEs: a('Католический университет Сан-Луис Бельтран · Валенсия'), bio: a('Университет Нервион · Бильбао'), scq: a('Университет Сар · Сантьяго-де-Компостела'), cas: a('Институт бизнеса Кастельяна · Мадрид'), mad: a('Университет Мансанарес · Мадрид') }; });
    check('«О вузе»: Барселона — «Учат на каталанском и испанском.», у «Борн» и «Часть программ есть и на английском.»', /Учат на каталанском и испанском\./.test(about.bcn) && /Учат на каталанском и испанском\. Часть программ есть и на английском\./.test(about.born), about);
    check('«О вузе»: Валенсия — «Учат на каталанском и испанском. Каталанский здесь называют валенсийским.»; католический университет Валенсии (только испанский) — без языка', /Учат на каталанском и испанском\. Каталанский здесь называют валенсийским\./.test(about.val) && !/Учат на|валенсийск/.test(about.valEs), [about.val, about.valEs]);
    check('«О вузе»: Бильбао — «Учат на баскском и испанском.», Сантьяго — «Учат на галисийском и испанском.», Кастельяна — «Учат на английском и испанском.», другие вузы Мадрида — без языка', /Учат на баскском и испанском\./.test(about.bio) && /Учат на галисийском и испанском\./.test(about.scq) && /Учат на английском и испанском\./.test(about.cas) && !/Учат на /.test(about.mad), about);
    await pg.evaluate(B => { __live(B); __speaker({ es: 6, en: 2 }, 'es'); }, BIO);
    const bio = await catalog(pg, { field: 'engineering', level: 'bachelor', city2791: BIO });
    const nv = bio.find(c => /Нервион/.test(c.name));
    check('карточка в Бильбао: «Нервион» — «Инженерия» и «Инженерия · на баскском»', nv && nv.chips.includes('Инженерия') && nv.chips.includes('Инженерия · на баскском'), nv || bio);
    const chips = await pg.evaluate(old => {
      const out = { same: 0, bad: [], fresh: 0 };
      for (const p of programs16) { const was = old[p.id], now = chipLabel2791(p); if (was === undefined) { out.fresh++; if (!/ · на (каталанском|галисийском|баскском|английском)$/.test(now)) out.bad.push([p.id, now]); continue; } if (was === now) out.same++; else out.bad.push([p.id, was, now]); }
      return { ...out, bad: out.bad.slice(0, 5) };
    }, ref.chips);
    check('подписи кнопок: прежние (' + chips.same + ') — как в 279.1.2, новые (' + chips.fresh + ') — с языком', chips.bad.length === 0 && chips.fresh > 0, chips.bad);
    check('вузы: без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 3. Родной язык: смотря какая семья ----------
  // Решение ведущего (279.1.3): город рождения новой жизни в Испании — Валенсия (город страны по умолчанию), поэтому
  // местный язык родной не всем, а части семей: Барселона около 55 %, Валенсия около 35 %, Сантьяго около 50 %, Бильбао
  // около 25 % (семьи мигрантов — никогда). Доли считаются по семьям без мигрантов; каждые 40 рождений — новая вкладка
  // (иначе хранилище персонажей переполняется и «Родиться» перестаёт создавать новую жизнь).
  const BIRTHS = async ({ city = null, age = '0', origin = null, n = 40, seed = 2791300 }) => {
    const rows = [], errs = [];
    let o = null;
    for (let i = 0; i < n; i++) {
      if (i % 40 === 0) { if (o) { errs.push(...o.errors); await o.ctx.close(); } o = await open(browser, { seed: seed + i, age, city, origin }); }
      else { await born(o.pg, { seed: seed + i, age, city, origin }); await o.pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock"); }
      rows.push(await o.pg.evaluate(() => { const x = path16(); return { id: s.saveId, city: s.birthCity, home: residenceCity(), mode: s.identity17?.familyMode, native: x.native.join(), langs: x.languages, origins: s.origins || [], age: s.age }; }));
    }
    if (o) { errs.push(...o.errors); await o.ctx.close(); }
    return { rows, errs };
  };
  const LOCAL = { [BCN]: 'cat', [VAL]: 'cat', [SCQ]: 'glg', [BIO]: 'eus', [MAD]: '' };
  const NAME = { cat: 'каталанский', glg: 'галисийский', eus: 'баскский' };
  const SCHOOL = { [BCN]: 4, [VAL]: 3, [SCQ]: 3, [BIO]: 2 };
  {
    let errs = [];
    const share = r => { const fam = r.rows.filter(x => x.mode !== 'migrant'), nat = fam.filter(x => /(^|,)(cat|glg|eus)(,|$)/.test(x.native)); return { all: r.rows.length, fam: fam.length, nat: nat.length, p: fam.length ? Math.round(nat.length / fam.length * 1000) / 10 : 0, mig: r.rows.filter(x => x.mode === 'migrant' && /(cat|glg|eus)/.test(x.native)).length, unique: new Set(r.rows.map(x => x.id)).size }; };
    const sane = (r, city) => r.rows.every(x => { const l = LOCAL[city], nat = l && x.native.split(',').includes(l); return x.city === city && x.native.split(',').includes('es') && (nat ? x.langs[l] === 6 : !(x.langs[l] > 0)) && Object.keys(x.langs).every(k => k === 'es' || k === l || k === 'en'); });
    // Валенсия — без подмены города: так рождается каждая новая жизнь в Испании.
    const val = await BIRTHS({ n: 200, seed: 2791300 }); errs = errs.concat(val.errs);
    const v = share(val);
    note('Валенсия (город по умолчанию), 200 рождений: семей без мигрантов ' + v.fam + ', каталанский родной — ' + v.nat + ' (' + v.p + ' %); от всех рождений — ' + Math.round(v.nat / v.all * 1000) / 10 + ' %');
    check('200 рождений в Валенсии (город по умолчанию, без подмены): каталанский родной у ' + v.p + ' % семей (нужно 25–45 %), у мигрантов — ни у кого', v.unique === 200 && sane(val, VAL) && v.p >= 25 && v.p <= 45 && v.mig === 0, v);
    const mad = await BIRTHS({ city: MAD, n: 100, seed: 2791600 }); errs = errs.concat(mad.errs);
    const m = share(mad);
    check('100 рождений в Мадриде: местного языка родным нет ни у кого (' + m.nat + ')', m.unique === 100 && sane(mad, MAD) && m.nat === 0 && mad.rows.every(x => !['cat', 'glg', 'eus'].some(k => k in x.langs)), m);
    // Рождение в игре от сида целиком не зависит (дата в зерне внешности), поэтому доли от прогона к прогону гуляют на
    // несколько процентов (Барселона 52–73 %, Сантьяго 49–65 %, Бильбао 20–31 % в пяти прогонах): границы — с запасом.
    for (const [city, lo, hi, seed] of [[BCN, 40, 75, 2791800], [SCQ, 35, 68, 2792000], [BIO, 12, 40, 2792200]]) {
      const r = await BIRTHS({ city, n: 120, seed }); errs = errs.concat(r.errs);
      const q = share(r);
      note(city + ', 120 рождений: ' + NAME[LOCAL[city]] + ' родной у ' + q.nat + ' из ' + q.fam + ' семей без мигрантов (' + q.p + ' %)');
      check(city + ', 120 рождений: ' + NAME[LOCAL[city]] + ' родной у ' + q.p + ' % семей (нужно ' + lo + '–' + hi + ' %), у мигрантов — ни у кого', q.unique === 120 && sane(r, city) && q.p >= lo && q.p <= hi && q.mig === 0, q);
    }
    // Одна жизнь на каждый город — родной (с 0 и с 18 лет) и не родной с 18 лет: школьный уровень города.
    const pickRow = async (city, age, want, seed) => { for (let k = 0; k < 6; k++) { const r = await BIRTHS({ city, age, n: 10, seed: seed + k * 10 }); errs = errs.concat(r.errs); const x = r.rows.find(x => x.mode !== 'migrant' && x.native.split(',').includes(LOCAL[city]) === want); if (x) return x; } return null; };
    for (const city of [BCN, VAL, SCQ, BIO]) {
      const l = LOCAL[city];
      for (const age of ['0', '18']) {
        const x = await pickRow(city, age, true, 2792400 + Object.keys(SCHOOL).indexOf(city) * 1000 + +age);
        check('родилась в городе ' + city + ' (с ' + age + ' лет) в семье, где дома говорят на нём: родные — испанский и ' + NAME[l], x && x.city === city && x.native.split(',').sort().join() === ['es', l].sort().join() && x.langs.es === 6 && x.langs[l] === 6, x);
      }
      const y = await pickRow(city, '18', false, 2796400 + Object.keys(SCHOOL).indexOf(city) * 1000);
      check('с 18 лет в городе ' + city + ', дома ' + NAME[l] + ' не родной: школьный уровень — ' + ['', 'A1', 'A2', 'B1', 'B2'][SCHOOL[city]], y && y.city === city && y.age === 18 && y.native === 'es' && y.langs[l] === SCHOOL[city], y);
    }
    // Мадрид с 18 лет — местного языка нет; семья мигрантов в Барселоне — родной язык семьи, с 18 лет — школьный B2.
    const md = await BIRTHS({ city: MAD, age: '18', n: 5, seed: 2799000 }); errs = errs.concat(md.errs);
    check('с 18 лет в Мадриде: только испанский, местных языков нет', md.rows.every(x => x.city === MAD && x.native === 'es' && !['cat', 'glg', 'eus'].some(k => k in x.langs)), md.rows);
    const mig = await BIRTHS({ city: BCN, origin: 'migrant', n: 6, seed: 2799100 }); errs = errs.concat(mig.errs);
    const mig18 = await BIRTHS({ city: BCN, age: '18', origin: 'migrant', n: 3, seed: 2799200 }); errs = errs.concat(mig18.errs);
    check('семья мигрантов (из Мексики) в Барселоне: каталанский не родной ни разу (6 рождений); с 18 лет — школьный B2', mig.rows.every(x => x.mode === 'migrant' && x.city === BCN && !x.native.includes('cat') && !(x.langs.cat > 0)) && mig18.rows.every(x => x.mode === 'migrant' && !x.native.includes('cat') && x.langs.cat === 4), [mig.rows.map(x => [x.mode, x.native, x.langs.cat]), mig18.rows.map(x => [x.mode, x.native, x.langs.cat])]);
    // Жребий — один раз при рождении (из случайного ряда жизни; само рождение в игре от сида не зависит целиком — дата
    // в зерне внешности), дальше записан в родных языках: после обновления страницы и года жизни — тот же.
    {
      const o = await open(browser, { seed: 2799300, age: '0', city: BCN });
      const got = { yes: null, no: null };
      for (let i = 0; i < 12 && (!got.yes || !got.no); i++) {
        if (i) { await born(o.pg, { seed: 2799300 + i, age: '0', city: BCN }); await o.pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock"); }
        await helpers(o.pg);
        const r = await o.pg.evaluate(() => ({ id: s.saveId, mode: s.identity17?.familyMode, native: path16().native.join() }));
        if (r.mode !== 'migrant') got[r.native.includes('cat') ? 'yes' : 'no'] ??= r.id;
      }
      const after = {};
      for (const [k, id] of Object.entries(got)) {
        if (!id) continue;
        await o.pg.evaluate(id => { __close(); loadCharacter(id); }, id);
        await helpers(o.pg);
        await o.pg.evaluate(() => { save(); if (typeof flushSave264 === 'function') flushSave264(); });
        await o.pg.reload(); await o.pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&typeof prog16==='function'"); await helpers(o.pg);
        after[k] = await o.pg.evaluate(id => { const a = [s.saveId === id, path16().native.join(), path16().languages.cat || 0]; __month(13); return [...a, path16().native.join(), path16().languages.cat || 0, s.age]; }, id);
      }
      errs = errs.concat(o.errors.filter(e => !/reading 'fee'/.test(e)));
      await o.ctx.close();
      check('родной местный язык записан один раз: после обновления страницы и года жизни — тот же (каталанский родной — остаётся, не родной — не появляется)', after.yes && after.no && after.yes[0] && after.yes[1] === 'es,cat' && after.yes[3] === 'es,cat' && after.yes[4] === 6 && after.no[0] && after.no[1] === 'es' && after.no[3] === 'es' && after.no[2] === 0, after);
    }
    check('новые жизни: без ошибок страницы', errs.length === 0, errs.slice(0, 2));
  }

  // ---------- 4. Школа: переезд в Барселону в 7 лет ----------
  // Город держится тот же, пока семья в Испании. Семейный переезд за границу (family-school.js, family17.js) на время
  // проверки выключен; если семья всё же уехала — другой сид.
  const GROW = ([moveAt, to, lang = 'cat']) => {
    const out = { born: path16().native.join(), left: false };
    for (const f of ['beginFamilyMove', 'beginFamilyMove17', 'relocateWithFamily']) if (typeof window[f] === 'function') window[f] = () => {};
    const stay = city => { if (s.country !== 'es') { out.left = true; return false; } if (residenceCity() !== city) __live(city); return true; };
    while (s.age < moveAt && !s.dead) { if (!stay('Мадрид')) return out; __month(1); }
    out.at7 = [s.age, residenceCity(), path16().languages[lang] || 0];
    while (s.age < 12 && !s.dead) { if (!stay(to)) return out; __month(1); }
    out.at12 = [s.age, residenceCity(), Math.round((path16().languages[lang] || 0) * 100) / 100, level16(lang)];
    out.es = level16('es');
    out.school = schoolLanguageDetails73();
    out.nan = __nan();
    return out;
  };
  {
    let pg, ctx, errors, r;
    for (const seed of [279135, 279145, 279155]) {
      ({ pg, ctx, errors } = await open(browser, { seed, age: '0', city: MAD, origin: 'local' }));
      r = await pg.evaluate(GROW, [7, BCN]);
      if (!r.left) break;
      note('семья уехала из Испании (сид ' + seed + ') — другой сид'); await ctx.close();
    }
    if (!r.left) note('переезд в Барселону в 7 лет: каталанский в 7 — ' + r.at7[2] + ', в 12 — ' + r.at12[2] + ' (уровень ' + r.at12[3] + ')');
    check('ребёнок из Мадрида, в 7 лет переехал в Барселону: к 12 годам знает каталанский (хотя бы A1), испанский родной', !r.left && r.at7[2] === 0 && r.at12[0] === 12 && r.at12[1] === BCN && r.at12[3] >= 1 && r.es === 6, r);
    check('«Школа» в Барселоне: «Местный язык — каталанский: в школе его тоже учат.»', /Местный язык — каталанский: в школе его тоже учат\./.test(r.school), r.school);
    check('школа: без ошибок страницы и NaN', errors.length === 0 && r.nan.length === 0, [errors.slice(0, 2), r.nan]);
    // Ребёнок, который до 12 лет живёт в Мадриде, — без каталанского.
    let m = null;
    for (const seed of [279136, 279146, 279156]) {
      await born(pg, { seed, age: '0', city: MAD, origin: 'local' });
      await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
      await helpers(pg);
      m = await pg.evaluate(GROW, [12, MAD]);
      if (!m.left) break;
      note('семья уехала из Испании (сид ' + seed + ') — другой сид');
    }
    check('ребёнок, который до 12 лет живёт в Мадриде: каталанского нет', m && !m.left && m.at12[0] === 12 && m.at12[1] === MAD && m.at12[2] === 0, m);
    // Школа учит местному языку не выше школьного уровня города: в Бильбао с рождения (родилась в Мадриде) — к 12 баскский A2.
    let bq = null;
    for (const seed of [279137, 279147, 279157]) {
      await born(pg, { seed, age: '0', city: MAD, origin: 'local' });
      await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
      await helpers(pg);
      bq = await pg.evaluate(GROW, [0, BIO, 'eus']);
      if (!bq.left) break;
      note('семья уехала из Испании (сид ' + seed + ') — другой сид');
    }
    check('ребёнок из семьи без баскского, с рождения живёт в Бильбао: к 12 годам баскский — школьный A2, не выше', bq && !bq.left && bq.at12[1] === BIO && bq.at12[2] === 2 && bq.at12[3] === 2, bq);
    // Дети игрока в школе: такой же шаг месяца в их школьных языках (schoolLanguages73).
    const npc = await pg.evaluate(() => {
      __speaker({ es: 6 }, 'es'); s.age = 35; __live('Барселона');
      const k = person('Ребенок', 8, 'f', 'es'); k.bond = 75; k.city18 = 'Барселона'; k.birth49 = { method: 'birth', parents: ['player'] }; s.people.push(k); enrichPerson(k); if (typeof familyState27 === 'function') { familyState27(); if (k.bio27) k.bio27.parents = ['player']; }
      const before = k.schoolLanguages73?.languages?.cat || 0;
      __month(12);
      return { own: typeof ownChild53 === 'function' && ownChild53(k), before, after: Math.round((k.schoolLanguages73?.languages?.cat || 0) * 100) / 100, sections: (personSections42(k) || []).map(x => JSON.stringify(x)).join(' ').includes('Каталанский') };
    });
    check('ребёнок игрока в школе в Барселоне: за год каталанский растёт в школьных языках, виден в карточке', npc.own && npc.after > npc.before && npc.sections, npc);
    check('школа (дети): без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 5. Курсы, «Языки», клубы, работа ----------
  {
    const { pg, ctx, errors } = await open(browser, { seed: 279136, age: '18', city: MAD, origin: 'local' });
    const r = await pg.evaluate(([B, V, M, S, O]) => {
      const out = {}, msgs = [], keep = toast; toast = t => msgs.push(t);
      try {
        for (const [city, lang] of [[B, 'cat'], [V, 'cat'], [M, 'cat'], [S, 'glg'], [M, 'glg'], [O, 'eus'], [B, 'eus']]) {
          __live(city); __speaker({ es: 6, en: 2 }, 'es'); s.age = 30; s.cash = 1e6;
          const cash = s.cash, L = languageLesson16('course');
          languageTask16(lang, 'course');
          const t = s.clock.tasks.find(t => t.kind === 'pathLanguage' && t.language === lang);
          out[city + ' ' + lang] = t ? [t.label, t.duration, Math.round((cash - s.cash) * 100) / 100, Math.round(L.cost * 100) / 100, L.months] : null;
        }
      } finally { toast = keep; }
      out.msgs = msgs;
      return out;
    }, [BCN, VAL, MAD, SCQ, BIO]);
    const ok = k => r[k] && r[k][2] === r[k][3] && r[k][1] === r[k][4];
    check('курсы каталанского: в Барселоне и Валенсии можно, цена и срок как у любого курса (' + (r[BCN + ' cat'] || []).join(' · ') + '); в Мадриде — нет', ok(BCN + ' cat') && ok(VAL + ' cat') && r[MAD + ' cat'] === null, r);
    check('курсы галисийского — в Сантьяго (не в Мадриде), баскского — в Бильбао (не в Барселоне); причина — «только в городе …»', ok(SCQ + ' glg') && r[MAD + ' glg'] === null && ok(BIO + ' eus') && r[BCN + ' eus'] === null && r.msgs.includes('Курсы и практика каталанского — только в городах Барселона и Валенсия.') && r.msgs.includes('Курсы и практика баскского — только в городе Бильбао.'), r);
    const tab = await pg.evaluate(([B, V, M]) => {
      const out = {}, txt = () => __tab()?.innerText || '', cards = re => [...(__tab()?.querySelectorAll('.path-card') || [])].filter(c => re.test(c.querySelector('h3')?.textContent || '')).map(c => c.innerText);
      __live(B); __speaker({ es: 6, en: 2 }, 'es'); s.age = 30; path16().vacancies = [];
      out.bcnTop = langTop2733(); out.bcn = txt();
      __live(V); out.valTop = langTop2733(); out.val = txt();
      __live(M); out.madTop = langTop2733(); out.mad = txt(); out.madCards = cards(/Каталанский|Галисийский|Баскский/);
      path16().languages.cat = 2.4; out.madCat = cards(/Каталанский/);
      // мигрантка в Барселоне: испанский A2 — «Язык страны · Испания», не каталанский
      __live(B); __speaker({ ar: 6, es: 2 }, 'ar'); out.migTop = langTop2733();
      // каталанский родной, живёт в Барселоне: местной подсказки нет
      __speaker({ es: 6, cat: 6 }, ['es', 'cat']); out.nativeTop = langTop2733();
      return out;
    }, [BCN, VAL, MAD]);
    check('«Языки» в Барселоне: «Местный язык · Барселона» — каталанский, «Для работы и учёбы хватает испанского.», не «Язык страны»', tab.bcnTop && tab.bcnTop.l === 'cat' && tab.bcnTop.eyebrow === 'Местный язык' && /МЕСТНЫЙ ЯЗЫК · БАРСЕЛОНА|Местный язык · Барселона/i.test(tab.bcn) && /Для работы и учёбы хватает испанского\./.test(tab.bcn) && !/Язык страны/i.test(tab.bcn), [tab.bcnTop, tab.bcn.slice(0, 500)]);
    check('«Языки» в Валенсии: тот же каталанский и «Здесь его называют валенсийским.»', tab.valTop && tab.valTop.l === 'cat' && /Здесь его называют валенсийским\./.test(tab.val), [tab.valTop, tab.val.slice(0, 500)]);
    check('«Языки» в Мадриде: подсказки о местных языках нет, карточек каталанского, галисийского и баскского нет', tab.madTop === null && tab.madCards.length === 0 && !/Каталанский|Галисийский|Баскский/.test(tab.mad), [tab.madTop, tab.madCards]);
    check('«Языки» в Мадриде, каталанский A2: карточка есть, кнопки курса и практики — «только в городах Барселона и Валенсия»', tab.madCat.length === 1 && /курсы — только в городах Барселона и Валенсия/.test(tab.madCat[0]) && /практика — только в городах Барселона и Валенсия/.test(tab.madCat[0]), tab.madCat);
    check('«Языки» в Барселоне: мигрантке со слабым испанским — «Язык страны · Испания» (испанский); родному каталанскому — подсказки нет', tab.migTop && tab.migTop.l === 'es' && tab.migTop.eyebrow === 'Язык страны' && tab.nativeTop === null, [tab.migTop, tab.nativeTop]);
    const clubs = await pg.evaluate(([B, M]) => {
      const out = {}, labels = () => { const o = []; const keep = show; show = (t, x, opts) => { o.push(...(opts || []).map(q => q.label)); }; try { languageClubsMenu53(); } finally { show = keep; } return o; };
      __speaker({ es: 6, cat: 3 }, 'es'); s.age = 30;
      __live(M); out.mad = labels().filter(l => /Каталанский/.test(l));
      const msgs = [], keep = toast; toast = t => msgs.push(t);
      try { joinClub19('speaking53_cat'); } finally { toast = keep; }
      out.madJoin = clubState19().memberships.filter(m => m.type === 'speaking53_cat').length; out.msgs = msgs;
      __live(B); out.bcn = labels().filter(l => /Каталанский/.test(l));
      joinClub19('speaking53_cat'); out.bcnJoin = clubState19().memberships.filter(m => m.type === 'speaking53_cat' && m.city === B).length;
      clubState19().memberships = clubState19().memberships.filter(m => m.type !== 'speaking53_cat');
      return out;
    }, [BCN, MAD]);
    check('клубы каталанского: в Мадриде их нет в списке и записаться нельзя, в Барселоне — есть, запись проходит', clubs.mad.length === 0 && clubs.madJoin === 0 && clubs.bcn.length === 1 && clubs.bcnJoin === 1, clubs);
    // Окно программы на каталанском, если живёте в Мадриде: вместо кнопки курса — где его учат.
    const need = await pg.evaluate(M => { __live(M); __speaker({ es: 6 }, 'es'); const r = langNeed273('cat', 4, () => {}); return { text: r.text, when: r.when || '', fix: !!r.fix }; }, MAD);
    check('окно программы на каталанском из Мадрида: «Каталанский B2 — у вас A0», вместо курса — «курсы — только в городах Барселона и Валенсия»', need.text === 'Каталанский B2 — у вас A0' && !need.fix && need.when === 'курсы — только в городах Барселона и Валенсия', need);
    // Работа в Барселоне.
    const jobsEs = await pg.evaluate(B => { __live(B); __speaker({ es: 6, en: 2 }, 'es'); return __jobs(); }, BCN);
    check('работа в Барселоне, испаноязычная: те же вакансии, язык и причины, что в 279.1.2 (' + jobsEs.length + ')', jobsEs.length > 0 && JSON.stringify(jobsEs) === JSON.stringify(ref.jobsEs), jobsEs.filter((r, i) => JSON.stringify(r) !== JSON.stringify(ref.jobsEs[i])).slice(0, 3));
    const jobsCat = await pg.evaluate(B => { __live(B); __speaker({ es: 6, en: 2, cat: 0 }, 'es'); const a = __jobs(); __speaker({ es: 6, en: 2, cat: 6 }, ['es', 'cat']); const b = __jobs(); return { a, b }; }, BCN);
    check('работа в Барселоне: каталанский не нужен ни в одной вакансии (знаете ли вы его или нет — те же причины)', jobsCat.a.every(r => !['cat', 'glg', 'eus'].includes(r[3]) && !/Каталанский|Галисийский|Баскский/.test(r[4])) && JSON.stringify(jobsCat.a.map(r => r[4])) === JSON.stringify(jobsCat.b.map(r => r[4])) && JSON.stringify(jobsCat.a.map(r => r[4])) === JSON.stringify(ref.jobsEs.map(r => r[4])), [jobsCat.a.filter(r => /Каталанский/.test(r[4]) || ['cat', 'glg', 'eus'].includes(r[3])).slice(0, 3), jobsCat.a.filter((r, i) => r[4] !== jobsCat.b[i]?.[4]).slice(0, 2)]);
    const dossier = await pg.evaluate(() => [dossierPlace87('es', 'Барселона'), dossierPlace87('es', 'Валенсия'), dossierPlace87('es', 'Мадрид')].map(h => (/Основная языковая среда: [^<]*/.exec(h) || [''])[0]));
    check('досье места: Барселона — «местный язык — каталанский», Валенсия — «(здесь его называют валенсийским)», Мадрид — как раньше', /Испанский; местный язык — каталанский\.$/.test(dossier[0]) && /местный язык — каталанский \(здесь его называют валенсийским\)\.$/.test(dossier[1]) && dossier[2] === 'Основная языковая среда: Испанский.', dossier);
    // Окно программы на каталанском (кнопка вуза в каталоге) из Мадрида: кнопки «Изучать язык · Каталанский» нет — она
    // вела в «Языки», где карточки каталанского вне Барселоны и Валенсии нет; в «Все условия» — где его учат.
    const win = await pg.evaluate(([M, B]) => {
      const out = {}, p = programs16.find(p => p.country === 'es' && p.city === B && p.language === 'cat' && p.level === 'bachelor' && __plain(p));
      const look = () => { __close(); programDetails16(p.id); const d = $('#modal'); [...d.querySelectorAll('details')].forEach(x => x.open = true); const r = { text: d.open ? d.innerText : '', buttons: [...d.querySelectorAll('button')].map(b => b.textContent.trim()) }; __close(); return r; };
      out.id = p && p.id;
      if (!p) return { id: null, mad: { text: '', buttons: [] }, bcn: { text: '', buttons: [] } };
      __live(M); __speaker({ es: 6, en: 2 }, 'es'); out.mad = look();
      __live(B); out.bcn = look();
      return out;
    }, [MAD, BCN]);
    check('окно программы на каталанском из Мадрида: нет «Изучать язык · Каталанский» и «Пройдите курс…», в условиях — «Курсы и практика каталанского — только в городах Барселона и Валенсия.»', win.id && !win.mad.buttons.some(b => /Изучать язык · Каталанский/.test(b)) && /Курсы и практика каталанского — только в городах Барселона и Валенсия\./.test(win.mad.text) && !/Пройдите курс или продолжайте практику/.test(win.mad.text), [win.id, win.mad.buttons, win.mad.text.slice(0, 900)]);
    check('то же окно в Барселоне: «Изучать язык · Каталанский» есть (курсы здесь)', win.bcn.buttons.some(b => /Изучать язык · Каталанский/.test(b)), win.bcn.buttons);
    // Курс, начатый в Барселоне, после переезда в Мадрид встаёт на паузу и продолжается после возвращения.
    const pause = await pg.evaluate(([B, M]) => {
      const out = {}, x = path16(), task = () => s.clock.tasks.find(t => t.kind === 'pathLanguage' && t.language === 'cat');
      __live(B); __speaker({ es: 6, en: 2 }, 'es'); s.age = 30; s.cash = 1e6; s.clock.fatigue = 0;
      languageTask16('cat', 'course'); const t = task();
      out.started = t && [t.label, t.state, t.duration];
      __month(1); out.bcn1 = [task()?.state, Math.round((task()?.progress || 0) * 100) / 100];
      __live(M); __month(4);
      out.mad = [task()?.state, Math.round((task()?.progress || 0) * 100) / 100, x.languages.cat || 0];
      if (task()) { const h1 = totalHours(); task().state = 'running'; const h2 = totalHours(); task().state = 'paused'; out.hoursFree = task().hours > 0 && Math.abs(h2 - h1 - task().hours) < 1e-9; }
      out.log = s.log.slice(0, 40).map(q => q.title + ': ' + q.text).filter(q => /на паузе/.test(q));
      const msgs = [], keep = toast; toast = m => msgs.push(m);
      try { if (task()) pauseTask05(task().id); } finally { toast = keep; }
      out.toggle = [task()?.state, msgs];
      out.card = [...(__tab()?.querySelectorAll('.path-card') || [])].filter(c => /Каталанский/.test(c.querySelector('h3')?.textContent || '')).map(c => c.innerText);
      __live(B); __month(5);
      out.back = [task() ? task().state : 'готово', x.languages.cat || 0];
      return out;
    }, [BCN, MAD]);
    check('курс каталанского из Барселоны: в Мадриде на паузе (прогресс не растёт, часы свободны, запись «Курс на паузе»), сам не снимается', pause.started && pause.bcn1[1] > 0 && pause.mad[0] === 'paused' && pause.mad[1] === pause.bcn1[1] && pause.mad[2] === 0 && pause.hoursFree && pause.log.length === 1 && /Курс на паузе: Каталанский · курс: каталанский учат только в городах Барселона и Валенсия/.test(pause.log[0]) && pause.toggle[0] === 'paused' && pause.toggle[1].length === 1, pause);
    check('«Языки» в Мадриде с курсом на паузе: карточка каталанского — «курс на паузе — учат только в городах Барселона и Валенсия»', pause.card.length === 1 && /курс на паузе — учат только в городах Барселона и Валенсия/.test(pause.card[0]), pause.card);
    check('вернулась в Барселону: курс продолжился и закончился, каталанский +0,55', pause.back[0] === 'готово' && Math.abs(pause.back[1] - .55) < 1e-9, pause.back);
    // Люди из клуба каталанского говорят и по-испански: испаноязычной, которая только учит каталанский, они «свои».
    const club = await pg.evaluate(B => {
      __live(B); __speaker({ es: 6, cat: 1.2 }, 'es'); s.age = 25; s.cash = 1e6;
      joinClub19('speaking53_cat');
      const m = clubState19().memberships.find(m => m.type === 'speaking53_cat' && m.status === 'active');
      if (!m) return null;
      const c = newClubMember19(m).candidate; c.gender = s.gender === 'f' ? 'm' : 'f'; c.orientation = 'hetero'; s.orientation = 'hetero'; c.role = 'Друг'; c.alive = true; c.age = 25; s.people.push(c);
      const out = { lang: c.language18, city: c.city18, local: localSocial19(c), romance: relationshipReasons63(c) };
      s.people = s.people.filter(p => p !== c); clubState19().memberships = clubState19().memberships.filter(x => x !== m);
      return out;
    }, BCN);
    check('клуб каталанского в Барселоне: новый знакомый говорит по-испански — «свой», «не хватает общего языка» нет', club && club.lang === 'es' && club.city === BCN && club.local && !club.romance.some(r => /общего языка/.test(r)), club);
    check('курсы, «Языки», работа: без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 6. Сохранение 279.1.2 с учёбой в Барселоне ----------
  {
    const { pg, ctx, errors } = await open(browser, { raw: ref.save.raw });
    const old = ref.save.old;
    const r = await pg.evaluate(old => {
      const x = path16(), row = id => { const p = prog16(id); return p ? [p.id, uni16(p).name, programName26(p), p.language] : null; };
      const out = { pins: JSON.stringify(s.unisLang27911 || null), study: row(old.study[0]), offer: row(old.offer[0]), apply: row(old.apply[0]), langs: JSON.stringify(x.languages), native: x.native.join() };
      programDetails16(old.study[0]); [...$('#modal').querySelectorAll('details')].forEach(d => d.open = true); out.win = $('#modal').open ? $('#modal').innerText : ''; __close();
      acceptStudy16('app27913-offer'); out.accepted = x.applications.find(a => a.id === 'app27913-offer')?.status;
      return out;
    }, old);
    check('сохранение 279.1.2: учёба, предложение и заявка — те же id, вуз, название и язык (испанский)', ['study', 'offer', 'apply'].every(k => JSON.stringify(r[k]) === JSON.stringify(old[k])), { now: [r.study, r.offer, r.apply], was: old });
    check('сохранение 279.1.2: родные языки и уровни не изменились (без каталанского задним числом), список прежних языков пуст', r.langs === old.langs && r.native === old.native && r.pins === '{"pins":{}}', [r.langs, old.langs, r.native, r.pins]);
    check('сохранение 279.1.2: окно учёбы — «Язык: Испанский», «Учат на каталанском и испанском»; предложение принимается', /Язык: Испанский/.test(r.win) && /Учат на каталанском и испанском/.test(r.win) && r.accepted === 'accepted', [r.win.slice(0, 500), r.accepted]);
    const after = await pg.evaluate(old => {
      __month(5);
      const x = path16(), d = x.diplomas.find(d => d.program46 === old.study[0]);
      return { diploma: d ? [d.title, d.university] : null, apps: x.applications.filter(a => a.id === 'app27913-apply').map(a => a.status), langs: [old.apply[0], old.offer[0]].map(id => prog16(id).language), nan: __nan() };
    }, old);
    check('сохранение 279.1.2: учёба дошла до диплома с прежним названием вуза; заявка получила ответ, язык прежний', after.diploma && after.diploma[1] === old.study[1] && after.apps.length === 1 && ['offered', 'rejected', 'accepted'].includes(after.apps[0]) && after.langs.join() === 'es,es', after);
    // Новый ключ языка в старом сохранении: всё, что перебирает языки, работает.
    const keys = await pg.evaluate(() => {
      const x = path16(); x.languages.cat = 2.2; x.languages.eus = .4;
      const k = s.people.find(p => p.alive) || null; if (k) { k.schoolLanguages73 = k.schoolLanguages73 || { languages: {}, last: s.clock.ticks, initialized: true, history: [] }; k.schoolLanguages73.languages.glg = 1.5; }
      const out = {};
      out.tab = (__tab()?.innerText || '').slice(0, 200);
      const keep = show; let got = 0; show = (t, x, o) => { got = (o || []).length; }; try { languageClubsMenu53(); } finally { show = keep; } out.clubs = got;
      if (k) try { out.person = (personSections42(k) || []).length; } catch (e) { out.person = 'ошибка: ' + e.message; }
      __month(2); out.nan = __nan();
      save(); if (typeof flushSave264 === 'function') flushSave264();
      return out;
    });
    check('новый ключ языка в старом сохранении: «Языки», клубы, карточка человека и два месяца — без ошибок и NaN', keys.clubs > 0 && typeof keys.person === 'number' && keys.nan.length === 0 && errors.length === 0, [keys, errors.slice(0, 2)]);
    await ctx.close();
  }
  // Обычное открытие игры после обновления: персонаж записан файлами 279.1.2, страница перезагружена уже с новыми.
  {
    const { pg, ctx, errors, state } = await open(browser, { old: true, seed: 279137, age: '18', city: BCN });
    const made = await pg.evaluate(MAKE_SAVE, 'accepted');
    state.old = BASE;
    const before = errors.length;
    await pg.reload();
    await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&typeof prog16==='function'");
    await helpers(pg);
    // Известное с 279.1 (не эта сборка): при загрузке страницы с идущей учёбой ранние скрипты считают плату до загрузки
    // вузов — «reading 'fee'» в консоли, на игру не влияет. Считаем отдельно.
    const loadErrors = errors.splice(before);
    note('ошибки при загрузке страницы с идущей учёбой: ' + loadErrors.length + (loadErrors.length ? ' — ' + [...new Set(loadErrors)].join(' | ') : ''));
    check('открытие игры после обновления: при загрузке — только известная с 279.1 ошибка платы до загрузки вузов', loadErrors.every(e => /reading 'fee'/.test(e)), loadErrors);
    const r = await pg.evaluate(m => {
      const x = path16(), ids = ['study', 'offer', 'apply'].map(k => m.old[k][0]);
      const out = { same: s.saveId === m.id, pins: JSON.stringify(s.unisLang27911 || null), rows: ids.map(id => { const p = prog16(id); return p ? [p.id, uni16(p).name, programName26(p), p.language] : null; }), langs: JSON.stringify(x.languages), native: x.native.join() };
      x.study = null;
      const msgs = [], keep = toast; toast = t => msgs.push(t);
      try { studyStart16('app27913-offer', 'self'); } finally { toast = keep; }
      out.study = x.study?.program || null; out.lang = x.study ? prog16(x.study.program).language : null; out.toast = msgs;
      return out;
    }, made);
    check('открытие игры после обновления: тот же персонаж, программы и язык прежние (испанский), родные языки те же', r.same && JSON.stringify(r.rows) === JSON.stringify(['study', 'offer', 'apply'].map(k => made.old[k])) && r.rows.every(x => x[3] === 'es') && r.pins === '{"pins":{}}' && r.langs === made.old.langs && r.native === made.old.native, [r.rows, made.old, r.pins, r.langs, made.old.langs]);
    check('открытие игры после обновления: учёба по принятому предложению «Льобрегат» начинается — на испанском', r.study === made.old.offer[0] && r.lang === 'es', [r.study, r.lang, r.toast]);
    check('открытие игры после обновления: после загрузки без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // Сохранение старше сборки 73 (без школьных языков), герой родился и учился в Мадриде, живёт в Барселоне: первая оценка
  // школьных языков при открытии — та же, что в 279.1.2, без каталанского задним числом (и через «Ваши персонажи», и
  // при обновлении страницы). Второй школьный язык оценка выбирает по id сохранения, поэтому импорт — с одним и тем же
  // id, а обновление страницы — с одного и того же снимка хранилища.
  {
    const A = await open(browser, { old: true, seed: 279139, age: '18', city: MAD, origin: 'local' });
    const made = await A.pg.evaluate(B => {
      __live(B); path16().languages = { es: 6 }; path16().native = ['es'];
      const raw = JSON.parse(JSON.stringify(s)); delete raw.schoolLanguages73;
      delete s.schoolLanguages73; save(); if (typeof flushSave264 === 'function') flushSave264();
      return { raw: JSON.stringify({ format: 'life-side-effects', version: 1, exportedAt: new Date().toISOString(), lives: [raw] }), born: s.birthCity, home: residenceCity() };
    }, BCN);
    const langs = pg => pg.evaluate(() => JSON.stringify(Object.fromEntries(Object.entries(path16().languages).map(([k, v]) => [k, Math.round(v * 1000) / 1000]))));
    const viaImport = async old => {
      const o = await open(browser, { old, seed: 279140, age: '18', city: MAD });
      await o.pg.evaluate(raw => { __close(); const keep = charId; charId = () => 'import27913'; try { importLives(JSON.parse(raw)); } finally { charId = keep; } loadCharacter('import27913'); }, made.raw);
      await helpers(o.pg);
      const r = { l: await langs(o.pg), id: await o.pg.evaluate(() => s.saveId), errors: o.errors.slice() };
      await o.ctx.close();
      return r;
    };
    const iOld = await viaImport(true), iNew = await viaImport(false);
    // Обновление страницы: снимок хранилища до первого открытия, открыть файлами 279.1.2, вернуть снимок, открыть новыми.
    await A.pg.goto('http://game.local/blank27913.html');
    const snap = await A.pg.evaluate(() => JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]))));
    const reopen = async old => {
      await A.pg.goto('http://game.local/blank27913.html');
      await A.pg.evaluate(snap => { localStorage.clear(); for (const [k, v] of Object.entries(JSON.parse(snap))) localStorage.setItem(k, v); }, snap);
      A.state.old = old;
      await A.pg.goto('http://game.local/index.html');
      await A.pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&typeof prog16==='function'");
      return langs(A.pg);
    };
    const rOld = await reopen(true), rNew = await reopen(BASE);
    const rErr = A.errors.slice();
    await A.ctx.close();
    note('старое сохранение без школьных языков (родилась в Мадриде, живёт в Барселоне): «Ваши персонажи» 279.1.2 — ' + iOld.l + ', 279.1.3 — ' + iNew.l + '; обновление 279.1.2 — ' + rOld + ', 279.1.3 — ' + rNew);
    check('сохранение без школьных языков, живёт в Барселоне: через «Ваши персонажи» — те же языки, что в 279.1.2 (оценка школы прошла), без каталанского', made.born === MAD && made.home === BCN && iOld.id === 'import27913' && iNew.id === 'import27913' && /"en"/.test(iOld.l) && iNew.l === iOld.l && !/"(cat|glg|eus)"/.test(iNew.l) && iNew.errors.length === 0, [iOld, iNew]);
    check('то же сохранение при обновлении страницы: те же языки, что в 279.1.2, без каталанского', /"en"/.test(rOld) && rNew === rOld && !/"(cat|glg|eus)"/.test(rNew) && rErr.length === 0, [rOld, rNew, rErr.slice(0, 2)]);
  }

  // ---------- 7. Наследник ----------
  {
    const { pg, ctx, errors } = await open(browser, { seed: 279138, age: '18', city: MAD });
    const r = await pg.evaluate(() => {
      if (typeof heirLocal27913 !== 'function') return null;
      const mk = (age = 30) => ({ age, path16: { languages: { es: 6 }, native: ['es'] } });
      // id, для которого жребий семьи в Бильбао не выпал (hash27913 ≥ доли), — чтобы проверить и родного, и школьный уровень.
      let id = 0; if (typeof hash27913 === 'function') while (hash27913('heir' + id + ':home27913') < .5) id++;
      const out = {};
      const a = mk(); heirLocal27913(a, { id: 'heir' + id, role: 'Ребенок', birthCountry: 'es', birthCity: 'Бильбао', origins: ['баскское'] }, { path16: { native: ['es', 'eus'] } }); out.a = a.path16;
      const a2 = mk(); heirLocal27913(a2, { id: 'heir' + id, role: 'Брат', birthCountry: 'es', birthCity: 'Бильбао', origins: ['баскское'] }, { path16: { native: ['es', 'eus'] } }); out.a2 = a2.path16;
      const b = mk(10); heirLocal27913(b, { id: 'heir-b', birthCountry: 'es', birthCity: 'Мадрид', schoolLanguages73: { languages: { cat: 2.5, en: 3 } } }); out.b = b.path16;
      const c = { age: 30, path16: { languages: { ar: 6, es: 3 }, native: ['ar'] } }; heirLocal27913(c, { id: 'heir-c', birthCountry: 'ma', birthCity: 'Барселона' }); out.c = c.path16;
      // Доля среди близких, родившихся в Валенсии: как у новых жизней (около 35 %).
      let n = 0; for (let i = 0; i < 400; i++) { const f = mk(); heirLocal27913(f, { id: 'p-' + i.toString(36) + '-v', role: 'Брат', birthCountry: 'es', birthCity: 'Валенсия', origins: ['испанское'] }, { path16: { native: ['es'] } }); if (f.path16.native.includes('cat')) n++; }
      out.val = n / 4;
      return out;
    });
    check('наследник: ребёнок героя, у которого баскский был родным, родился в Бильбао — баскский родной; брат с тем же жребием — школьный A2', r && r.a.native.join() === 'es,eus' && r.a.languages.eus === 6 && r.a2.native.join() === 'es' && r.a2.languages.eus === 2, r && [r.a, r.a2]);
    check('наследник: школьный каталанский ребёнка остаётся; родившийся не в Испании — без местного', r && r.b.languages.cat === 2.5 && !('en' in r.b.languages) && r.b.native.join() === 'es' && !r.c.languages.cat, r && [r.b, r.c]);
    check('наследник, родившийся в Валенсии: каталанский родной у ' + (r && r.val) + ' % (400 близких; нужно 25–45 %)', r && r.val >= 25 && r.val <= 45, r && r.val);
    check('наследник: без ошибок страницы', errors.length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 8. Настоящее сохранение владелицы ----------
  if (OWNER && fs.existsSync(OWNER)) {
    const raw = fs.readFileSync(OWNER, 'utf8');
    const { pg, ctx, errors } = await open(browser, { raw });
    const r = await pg.evaluate(() => {
      const x = path16(), out = { langs: JSON.stringify(x.languages), native: x.native.join(), dip: x.diplomas.map(d => d.university) };
      out.tab = (__tab()?.innerText || ''); out.local = /Каталанский|Галисийский|Баскский/.test(out.tab); out.tab = out.tab.slice(0, 200);
      __month(12);
      out.nan = __nan(); out.dip2 = x.diplomas.map(d => d.university); out.langs2 = Object.keys(x.languages).filter(k => ['cat', 'glg', 'eus'].includes(k));
      return out;
    });
    check('сохранение владелицы: открывается, местных языков нет ни в «Языках», ни в уровнях, дипломы не переименованы', !r.local && r.langs2.length === 0 && JSON.stringify(r.dip) === JSON.stringify(r.dip2), r);
    check('сохранение владелицы: год без NaN и ошибок страницы', r.nan.length === 0 && errors.length === 0, [r.nan, errors.slice(0, 2)]);
    await ctx.close();
  } else note('OWNER_SAVE не задан — настоящее сохранение пропущено');

  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: файлы сборки 279.1.2)' : ''));
  process.exit(fail ? 1 : 0);
})();
