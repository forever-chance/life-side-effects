// Проверки сборки 279.1.4 (unis2791.js, trajectory16.js, clubs19.js): постоянные id подготовки к профессии и тихое
// открытие игры с идущей учёбой или клубом языка.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify27914_ids.js
// BASE=1 — вместо нынешних index.html, unis2791.js, trajectory16.js и clubs19.js файлы сборки 279.1.3 (git show REF27913:…, по
//   умолчанию 81b9872): видно, какие проверки ловят прежнее поведение.
// OWNER_SAVE=файл — ещё и настоящее сохранение (экспорт «Ваши персонажи»; берётся последний персонаж).
// UNIS_RESEARCH=all.json — исследовательский файл (не в репозитории): ни одного настоящего названия в файлах игры.
// QUICK=1 — не все 180 городов, а все города Испании, Канады, России, США, Индии и Марокко и по два в остальных странах.
// Что проверяется:
// • файлы: unis2791-data.js тот же, что в 279.1.3; в index.html — unis2791.js, trajectory16.js и clubs19.js с ?v=279.1.4;
// • id: игра открыта, когда герой живёт в каждом из 180 городов 25 стран, — программы подготовки к профессии (вместе с
//   копиями на других языках) и все программы с копиями одни и те же и такие же, как при открытии без героя в стране;
// • прежние программы: при открытии без героя все программы — байт в байт как в 279.1.3; при открытии в городах (все
//   города шести стран и по два в остальных) у 279.1.3 остальные программы те же, а подготовка к профессии, которая
//   получалась только в этом городе, находится по прежнему id (prog16) с тем же заведением, городом, языком и ценой и
//   не попадает в выбор;
// • сохранение 279.1.3, сделанное в Барселоне (учёба, предложение и заявка на таких программах, мать учится на такой же):
//   через «Ваши персонажи» на странице, открытой в Мадриде, при обновлении страницы и при обновлении, когда героиня
//   живёт в Мадриде, — программы те же, учёба доходит до диплома, предложение принимается, заявка получает ответ, мать
//   учится дальше (на учителя); наследница (мать продолжает жизнь) — та же программа и пройденные месяцы;
// • открытие игры с идущей учёбой (Барселона, Касабланка) и сохранения владелицы (клуб чтения на английском на паузе —
//   в 279.1.3 31 ошибка «reading 'name'»): ни одной ошибки в консоли, сценарии
//   после первой отрисовки дорабатывают до конца (обёртки life23.js, readability20.js, family231.js), бюджет — с той же платой
//   за учёбу, что до обновления; месяц без NaN; так же с учёбой на программах до 279.1, которые строят поздние сценарии
//   (учитель по предмету, направление внутри программы, подготовка к профессии 68 — в 279.1.3 от 11 до 41 ошибки);
// • прежний язык 279.1: учёба на подготовке к профессии в Квебеке, которую 279.1.1–279.1.3 не нашли и прежний язык не
//   запомнили (pins пустой), — у англоязычной студентки снова на английском (через «Ваши персонажи» и при обновлении
//   страницы), у франкоязычной — на французском.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const BASE = process.env.BASE === '1', REF = process.env.REF27913 || '81b9872';
const OWNER = process.env.OWNER_SAVE || '', RESEARCH = process.env.UNIS_RESEARCH || '', QUICK = process.env.QUICK === '1';
const PHONE = { width: 390, height: 844 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 1200) : '')); };
const note = t => console.log('     ' + t);
const git = f => { try { return execSync('git -C ' + JSON.stringify(ROOT) + ' show ' + REF + ':' + f, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
const FILES = ['index.html', 'unis2791.js', 'trajectory16.js', 'clubs19.js', 'unis2791-data.js'];
const OLD = Object.fromEntries(FILES.map(f => [f, git(f)]));
const BCN = 'Барселона', MAD = 'Мадрид', CAS = 'Касабланка';
const SIX = ['es', 'ca', 'ru', 'us', 'in', 'ma'];

// Страница игры. old — файлы 279.1.3; light — без картинок (быстрее, ошибки консоли не считаются).
async function open(browser, { old = false, light = false } = {}) {
  const ctx = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 1 });
  const state = { old };
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    // Шрифты и прочее снаружи — пустой ответ, чтобы в консоли не было сетевых ошибок теста.
    if (u.hostname !== 'game.local') return r.fulfill({ status: 200, body: '', headers: { 'content-type': /css/.test(u.pathname + u.search) ? 'text/css' : 'text/plain' } });
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    if (rel === 'blank27914.html') return r.fulfill({ status: 200, body: '<!doctype html><title>.</title>', headers: { 'content-type': 'text/html' } });
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    if (light && /\.(webp|png|jpg|svg)$/.test(rel)) return r.fulfill({ status: 200, body: '', headers: { 'content-type': 'text/plain' } });
    const body = rel === 'offline-game.js' ? '' : state.old && OLD[rel] ? OLD[rel] : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [], logged = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  pg.on('console', m => { if (m.type() === 'error') logged.push(m.text()); });
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&typeof prog16==='function'");
  return { pg, ctx, errors, logged, state };
}
const ready = pg => pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&typeof prog16==='function'");
async function reload(o) { await o.pg.reload(); await ready(o.pg); await helpers(o.pg); }
// Новая жизнь в 18 лет: страна cc, город рождения — city (город страны по умолчанию на время «Родиться»).
async function born(o, cc, city, seed = 279140) {
  await o.pg.evaluate(cc => { if (typeof intro === 'function' && !document.getElementById('country')) intro(); for (const [k, v] of [['startAge', '18'], ['country', cc]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, cc);
  await o.pg.evaluate(([cc, city, seed]) => {
    const keep = countries[cc].city; if (city) countries[cc].city = city;
    const rnd = Math.random; Math.random = seeded269(seed);
    try { [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click(); } finally { countries[cc].city = keep; Math.random = rnd; }
  }, [cc, city, seed]);
  await ready(o.pg);
  await helpers(o.pg);
}
// Снимок программ: подготовка к профессии с копиями (целиком), все программы (id, заведение, язык, цена), копии по странам.
const SNAP = () => {
  window.__hash = list => { let h = 2166136261; for (const t of list) { for (let i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= 10; h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); };
  window.__occ = p => /^profession68-/.test(p.id);
  window.__ids = (all = false) => {
    const occ = programs16.filter(__occ), copies = {};
    for (const p of programs16) if (p.copy27911 || p.english2791) copies[p.country] = (copies[p.country] || 0) + 1;
    const out = { occN: occ.length, occ: __hash(occ.map(p => JSON.stringify(p)).sort()), all: __hash(programs16.map(p => [p.id, p.university, p.language, p.fee, p.months].join('|')).sort()), n: programs16.length, copies: __hash(Object.entries(copies).sort().map(String)), copiesEs: copies.es || 0 };
    if (all) { out.occIds = occ.map(p => p.id); out.full = __hash(programs16.map(p => JSON.stringify(p))); out.retired = typeof retiredPrograms2791 !== 'undefined' ? __hash(retiredPrograms2791.map(p => JSON.stringify(p))) : ''; }
    return out;
  };
};
const helpers0 = pg => pg.evaluate(SNAP);
async function helpers(pg) {
  await pg.evaluate(SNAP);
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    try { if ($('#modal').open) closeModal(); } catch (e) {}
    s.pending = []; s.clock.running = false; if (s.ui05) s.ui05.panel = 'center';
    window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
    window.__month = (n = 1) => { for (let i = 0; i < n; i++) { __close(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } __close(); advanceMonth(); } __close(); };
    window.__nan = () => { const bad = []; const walk = (o, p, d) => { if (d > 7 || !o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if (typeof v === 'number' && !Number.isFinite(v)) bad.push(p + '.' + k); else if (v && typeof v === 'object') walk(v, p + '.' + k, d + 1); } }; walk(s, 's', 0); return bad.slice(0, 5); };
    window.__live = (city, cc = s.country) => { s.country = cc; s.housing.country = cc; s.housing.city = city; if (s.housing.home) s.housing.home.city = city; s.housing.mode = 'rent'; s.housing.active = true; };
    window.__save = () => { save(); if (typeof flushSave264 === 'function') flushSave264(); };
    window.__row = id => { const p = prog16(id); return p ? [p.id, uni16(p)?.name, programName26(p), p.language, p.city, p.fee, p.months] : null; };
  });
}
// Испанская героиня в Барселоне: учёба (до диплома три месяца), предложение и заявка на подготовке к профессии, которая
// у 279.1.3 получалась только при открытии игры в Барселоне; мать учится на такой же. canon — id той же подготовки при
// открытии без героя в стране.
const MAKE_SAVE = canon => {
  const known = new Set(canon), x = path16();
  __live('Барселона', 'es'); x.languages = { es: 6, cat: 6, en: 3 }; x.native = ['es', 'cat']; s.school = s.school || {}; s.school.grades = 80; s.cash = Math.max(s.cash, 5e6);
  x.applications = []; x.jobApplications = []; x.retry = {}; x.diplomas = []; x.study = null; s.job = null;
  const floating = programs16.filter(p => __occ(p) && p.country === 'es' && p.city === 'Барселона' && !known.has(p.id));
  const plain = floating.filter(p => p.language === 'es' && !p.copy27911), cat = floating.filter(p => p.language === 'cat');
  const st = plain.find(p => p.occupation68 === 'doctor') || plain[0], of = cat.find(p => p.occupation68 !== st?.occupation68) || cat[0];
  // Мать учится на учителя (бакалавриат: на магистратуру без диплома её не примут и в наследнице).
  const rel = plain.find(p => p.occupation68 === 'teacher' && p !== st) || plain.find(p => p !== st && p.level === 'bachelor'), ap = plain.find(p => p !== st && p !== rel && p.occupation68 !== of?.occupation68);
  if (!st || !of || !ap || !rel) return { error: 'нет подготовки к профессии только для Барселоны', n: floating.length };
  x.applications.push({ id: 'app27914-study', program: st.id, status: 'enrolled', probability: .8, roll: .1, submitted: s.clock.ticks - 40, scholarship: null });
  x.study = { id: 'study27914', application: 'app27914-study', program: st.id, progress: st.months - 3, payer: 'self', status: 'active', research: 0, grades: 80, badTerms: 0 };
  x.applications.push({ id: 'app27914-offer', program: of.id, status: 'offered', probability: .7, roll: .1, submitted: s.clock.ticks - 2, expires: s.clock.ticks + 18, scholarship: null });
  x.applications.push({ id: 'app27914-apply', program: ap.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
  s.clock.tasks.push({ id: 'process27914', kind: 'pathAdmission', label: 'Приемная комиссия · ' + uni16(ap).name, duration: 2, progress: 0, hours: 2, state: 'planned', application: 'app27914-apply' });
  const mom = s.people.find(p => p.alive && ['Мать', 'Отец'].includes(p.role) && p.bio27) || s.people.find(p => p.alive && p.bio27 && p.age >= 18);
  if (mom) { mom.country = 'es'; mom.city18 = 'Барселона'; mom.privateCash = 1e7; mom.bio27.job = null; mom.bio27.study = { program: rel.id, progress: 2 }; }
  __save();
  return { id: s.saveId, rel: mom?.id || null, relRole: mom?.role || '', ids: { study: st.id, offer: of.id, apply: ap.id, rel: rel.id }, rows: { study: __row(st.id), offer: __row(of.id), apply: __row(ap.id), rel: __row(rel.id) },
    raw: JSON.stringify({ format: 'life-side-effects', version: 1, exportedAt: new Date().toISOString(), lives: [JSON.parse(JSON.stringify(s))] }),
    store: JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]))) };
};
// Что стало с сохранением: те же программы, учёба до диплома, ответ на заявку, предложение принято, мать учится дальше.
const DRIVE = m => {
  const x = path16(), out = { rows: Object.fromEntries(Object.entries(m.ids).map(([k, id]) => [k, __row(id)])), errors: [] };
  const mom = m.rel && s.people.find(p => p.id === m.rel), before = mom?.bio27?.study ? mom.bio27.study.progress : null;
  try {
    __live('Барселона');
    __month(4);
    const d = x.diplomas.find(d => d.program46 === m.ids.study);
    out.diploma = d ? [d.university, d.title] : null;
    out.studyLeft = x.study ? x.study.program : null;
    out.apply = x.applications.find(a => a.id === 'app27914-apply')?.status || null;
    out.mom = mom ? { program: mom.bio27.study?.program || null, progress: mom.bio27.study?.progress ?? null, before, edu: (mom.bio27.education || []).some(e => e.program === m.ids.rel) } : null;
    acceptStudy16('app27914-offer');
    out.offer = x.applications.find(a => a.id === 'app27914-offer')?.status || null;
    const keep = toast, msgs = []; toast = t => msgs.push(t);
    try { studyStart16('app27914-offer', 'self'); } finally { toast = keep; }
    out.offerStudy = x.study ? [x.study.program, prog16(x.study.program)?.language, x.study.status] : null; out.toast = msgs;
    __month(2);
    out.offerProgress = x.study ? x.study.progress : null;
  } catch (e) { out.errors.push(String(e && e.message || e)); }
  out.nan = __nan();
  return out;
};
const driveOk = (r, m) => r.diploma && r.diploma[0] === m.rows.study[1] && !r.studyLeft && ['offered', 'rejected', 'accepted'].includes(r.apply)
  && r.offer === 'accepted' && r.offerStudy && r.offerStudy[0] === m.ids.offer && r.offerStudy[1] === 'cat' && r.offerProgress >= 1
  && (!m.rel || r.mom && (r.mom.program === m.ids.rel && r.mom.progress > r.mom.before || r.mom.edu)) && !r.errors.length && !r.nan.length;
const rowsSame = (r, m) => Object.keys(m.ids).every(k => JSON.stringify(r.rows[k]) === JSON.stringify(m.rows[k]));
// Игра с идущей учёбой: бюджет месяца и учёба — для сравнения до и после обновления страницы.
const BUDGET = () => {
  const x = path16(), t = x.study, a = t && x.applications.find(a => a.id === t.application), p = t && prog16(t.program);
  const b1 = monthlyBudget(), keep = t && t.status; if (t) t.status = 'paused';
  let b0; try { b0 = monthlyBudget(); } finally { if (t) t.status = keep; }
  // Остаток сценариев, которые рисуют в конце, а потом заводят обёртки: в 279.1.3 при открытии с учёбой он не выполнялся.
  const tail = ['logBase23', 'formattedShow20', 'programDetailsBase231'].map(n => { try { return new Function('return typeof ' + n)(); } catch (e) { return n + ': не дошло'; } });
  return { cost: Math.round(b1.cost), free: Math.round(b1.free), study: Math.round(b1.cost - b0.cost), fee: p ? Math.round(tuition16(p, a)) : null, program: t ? t.program : null, progress: t ? t.progress : null, tail };
};
// Учёба на программе id (программы до 279.1: они остаются у прежних вузов), героиня живёт в городе программы.
const STUDY_ON = id => {
  const p = prog16(id); if (!p) return { error: 'нет программы ' + id };
  __live(p.city, p.country); const x = path16(); x.languages = { ...x.languages, [p.language]: 6, [country16[p.country][0]]: 6 }; s.cash = Math.max(s.cash, 5e6); s.job = null;
  x.applications = x.applications.filter(a => a.id !== 'app27914-old');
  x.applications.push({ id: 'app27914-old', program: p.id, status: 'enrolled', probability: .8, roll: .1, submitted: s.clock.ticks - 10, scholarship: null });
  x.study = { id: 'study27914-old', application: 'app27914-old', program: p.id, progress: 3, payer: 'self', status: 'active', research: 0, grades: 80, badTerms: 0 };
  __save();
  return { id: p.id, city: p.city };
};
// Кнопка «Договориться с родителями об оплате» в окне программы (её ставит family231.js после первой отрисовки).
const PARENTS_BTN = () => { const x = path16(); try { programDetails16(x.study.program); } catch (e) { return 'ошибка: ' + e.message; } const t = $('#modal').innerText; try { closeModal(); } catch (e) {} return /Договориться с родителями об оплате/.test(t); };
// Англоязычная (en) или франкоязычная (fr) студентка в Квебеке на подготовке к профессии, которая в 279.1 учила
// по-английски, а с 279.1.1 — по-французски; прежний язык не запомнен (pins пустой: так писали 279.1.1–279.1.3, когда
// программу при открытии игры в другом городе не находили).
const QUEBEC_SAVE = kind => {
  const pool = (typeof aliasPrograms27914 !== 'undefined' ? aliasPrograms27914 : []).concat(programs16);
  const X = pool.find(p => p.country === 'ca' && p.city === 'Квебек' && p.occupation68 === 'doctor' && p.was27911 && p.was27911 !== p.language && !p.copy27911)
    || pool.find(p => p.country === 'ca' && p.city === 'Квебек' && p.occupation68 && p.was27911 && p.was27911 !== p.language && !p.copy27911);
  if (!X) return { error: 'нет подготовки к профессии в Квебеке с прежним языком' };
  const x = path16(); __live('Квебек', 'ca');
  x.languages = kind === 'en' ? { en: 6 } : { fr: 6, en: 2 }; x.native = [kind]; s.cash = Math.max(s.cash, 5e6); s.job = null; s.school = s.school || {}; s.school.grades = 80;
  x.applications = [{ id: 'app27914-q', program: X.id, status: 'enrolled', probability: .8, roll: .1, submitted: s.clock.ticks - 10, scholarship: null }];
  x.study = { id: 'study27914-q', application: 'app27914-q', program: X.id, progress: 5, payer: 'self', status: 'active', research: 0, grades: 80, badTerms: 0 };
  s.unisLang27911 = { pins: {} };
  __save();
  return { id: X.id, was: X.was27911, now: X.language, uni: X.university, raw: JSON.stringify({ format: 'life-side-effects', version: 1, exportedAt: new Date().toISOString(), lives: [JSON.parse(JSON.stringify(s))] }),
    store: JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k => [k, localStorage.getItem(k)]))) };
};
const QUEBEC_STATE = id => {
  const x = path16(), p = prog16(id); let needs = [];
  try { needs = typeof langNeeds2733 === 'function' ? langNeeds2733().map(n => n.l) : []; } catch (e) { needs = ['ошибка: ' + e.message]; }
  const out = { lang: p ? p.language : null, uni: p ? p.university : null, pin: s.unisLang27911?.pins?.[id] || null, needs, p0: x.study?.progress };
  __live('Квебек', 'ca'); try { __month(1); } catch (e) { out.err = e.message; }
  out.p1 = path16().study?.progress; out.blocked = path16().study?.blocked || ''; out.nan = __nan();
  return out;
};
const STUDY_HERE = ([cc, city]) => {
  __live(city, cc); const x = path16(); x.languages = { ...x.languages, [country16[cc][0]]: 6, en: 4, fr: 5, ar: 6 }; s.cash = Math.max(s.cash, 5e6); s.job = null;
  const p = programs16.find(p => p.country === cc && p.city === city && p.level === 'bachelor' && !p.occupation68 && !p.track45 && !p.subject26 && p.copy27911) || programs16.find(p => p.country === cc && p.city === city && p.level === 'bachelor' && !p.occupation68 && !p.track45);
  x.applications.push({ id: 'app27914-here', program: p.id, status: 'enrolled', probability: .8, roll: .1, submitted: s.clock.ticks - 10, scholarship: null });
  x.study = { id: 'study27914-here', application: 'app27914-here', program: p.id, progress: 3, payer: 'self', status: 'active', research: 0, grades: 80, badTerms: 0 };
  __save();
  return p.id;
};

(async () => {
  if (FILES.some(f => !OLD[f])) { console.log('FAIL нет файлов сборки 279.1.3 (git show ' + REF + ') — сравнивать не с чем'); process.exit(1); }
  const browser = await chromium.launch();

  // ---------- 0. Файлы ----------
  {
    const data = fs.readFileSync(path.join(ROOT, 'unis2791-data.js'), 'utf8');
    check('данные: unis2791-data.js тот же, что в 279.1.3 (данные не пересобирались)', data === OLD['unis2791-data.js']);
    const html = BASE ? OLD['index.html'] : fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
    // 276: trajectory16.js и clubs19.js правит и 276 — достаточно, что версия поднята против 279.1.3.
    const ver = (h, f) => (h.match(new RegExp('src="' + f + '\\.js\\?v=([^"]+)"')) || [])[1];
    check('подключение: unis2791.js — ?v=279.1.4, trajectory16.js и clubs19.js — версия поднята, данные — прежние', html.includes('src="unis2791.js?v=279.1.4"') && ['trajectory16', 'clubs19'].every(f => ver(html, f) && ver(html, f) !== ver(OLD['index.html'], f)) && html.includes('src="unis2791-data.js?v=279.1.3"'));
    if (RESEARCH && fs.existsSync(RESEARCH)) {
      const src = JSON.parse(fs.readFileSync(RESEARCH, 'utf8'));
      const real = src.flatMap(c => c.institutions.flatMap(u => [u.real_name, u.real_name_en])).filter(n => n && n.length >= 6);
      const hay = ['unis2791.js', 'unis2791-data.js', 'trajectory16.js', 'index.html'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n') + fs.readFileSync(__filename, 'utf8'), found = [...new Set(real.filter(n => hay.includes(n)))];
      check('данные: ни одного настоящего названия (' + real.length + ') в unis2791*.js, trajectory16.js, index.html и этом тесте', found.length === 0, found.slice(0, 5).join(' | '));
    } else note('UNIS_RESEARCH не задан — сверка с настоящими названиями пропущена');
  }

  // ---------- 1. Одни и те же id при открытии игры в любом городе ----------
  let fresh = null;
  {
    const o = await open(browser, { old: BASE, light: true });
    await helpers0(o.pg);
    fresh = await o.pg.evaluate(() => __ids(true));
    await born(o, 'es', MAD);
    const all = await o.pg.evaluate(() => Object.fromEntries(Object.keys(unis2791Data.countries).map(cc => [cc, cities[cc] || []])));
    const plan = Object.entries(all).flatMap(([cc, list]) => (QUICK && !SIX.includes(cc) ? list.slice(0, 2) : list).map(city => [cc, city]));
    const bad = {}, wrongAt = [], esRows = {};
    const t0 = Date.now();
    for (const [cc, city] of plan) {
      await o.pg.evaluate(([cc, city]) => { __live(city, cc); __save(); }, [cc, city]);
      await reload(o);
      const r = await o.pg.evaluate(cc => ({ at: [s.country, residenceCity()], ids: __ids(), doctor: cc === 'es' ? programs16.filter(p => p.country === 'es' && p.occupation68 === 'doctor').map(p => p.id) : null }), cc);
      if (r.at[0] !== cc || r.at[1] !== city) wrongAt.push([cc, city, r.at]);
      if (cc === 'es') esRows[city] = r.doctor.join(', ') + ' · копий в Испании ' + r.ids.copiesEs;
      const diff = ['occ', 'all', 'n', 'copies'].filter(k => r.ids[k] !== fresh[k]);
      if (diff.length) (bad[cc] ||= []).push(city + ' (' + diff.join(', ') + ')');
    }
    note('открыто ' + plan.length + ' раз (' + Object.keys(all).length + ' стран), ' + Math.round((Date.now() - t0) / 1000) + ' с; подготовка к профессии с копиями — ' + fresh.occN + ' программ, всего программ ' + fresh.n);
    for (const [city, t] of Object.entries(esRows)) note('Испания, игра открыта в городе ' + city + ': подготовка «Врач» — ' + t);
    check('открытие игры: героиня правда живёт в нужном городе (' + plan.length + ' городов)', wrongAt.length === 0, wrongAt.slice(0, 5));
    const nBad = Object.values(bad).reduce((n, l) => n + l.length, 0);
    check('id: подготовка к профессии (и копии на других языках), все программы и копии — одни и те же при открытии игры в любом из ' + plan.length + ' городов и такие же, как без героя в стране', nBad === 0, Object.entries(bad).map(([cc, l]) => cc + ': ' + l.length + ' — ' + l.slice(0, 2).join('; ')).join(' | '));
    check('id: при открытии игры без ошибок страницы', o.errors.length === 0, o.errors.slice(0, 2));
    await o.ctx.close();
  }

  // ---------- 2. Прежние программы: те же, а подготовка «своего города» 279.1.3 находится по id ----------
  {
    const o = await open(browser, { old: true, light: true });
    await helpers0(o.pg);
    const was = await o.pg.evaluate(() => __ids(true));
    check('без героя в стране: все ' + fresh.n + ' программ и прежние программы 250 вузов — байт в байт как в 279.1.3', was.full === fresh.full && was.retired === fresh.retired && was.n === fresh.n, [was.n, fresh.n]);
    await born(o, 'es', MAD);
    const all = await o.pg.evaluate(() => Object.fromEntries(Object.keys(unis2791Data.countries).map(cc => [cc, cities[cc] || []])));
    const plan = Object.entries(all).flatMap(([cc, list]) => (SIX.includes(cc) ? list : list.slice(0, 2)).map(city => [cc, city]));
    const floating = {}, rests = new Set();
    for (const [cc, city] of plan) {
      await o.pg.evaluate(([cc, city]) => { __live(city, cc); __save(); }, [cc, city]);
      await reload(o);
      const r = await o.pg.evaluate(canon => {
        const known = new Set(canon), rest = programs16.filter(p => !__occ(p));
        return { rest: __hash(rest.map(p => JSON.stringify(p))), float: programs16.filter(p => __occ(p) && !known.has(p.id)).map(p => [p.id, JSON.stringify(p)]) };
      }, fresh.occIds);
      for (const [id, json] of r.float) floating[id] = json;
      rests.add(r.rest);
    }
    await o.ctx.close();
    const p = await open(browser, { old: BASE, light: true });
    await helpers0(p.pg);
    const res = await p.pg.evaluate(floating => {
      const live = new Set(programs16.map(p => p.id)), out = { missing: [], differ: [], offered: [], rest: __hash(programs16.filter(p => !__occ(p)).map(p => JSON.stringify(p))), aliases: typeof aliasPrograms27914 !== 'undefined' ? aliasPrograms27914.length : 0 };
      for (const [id, json] of Object.entries(floating)) {
        const q = prog16(id);
        if (!q) { out.missing.push(id); continue; }
        const c = { ...q }; delete c.alias27914;
        if (JSON.stringify(c) !== json) out.differ.push(id);
        if (live.has(id)) out.offered.push(id);
      }
      return out;
    }, floating);
    const ids = Object.keys(floating);
    note('279.1.3, игра открыта в ' + plan.length + ' городах: подготовки к профессии, которая получалась только в своём городе, — ' + ids.length + ' программ (например, ' + ids.filter(i => /^profession68-es-n25-doctor/.test(i)).join(', ') + '); в сборке — ' + res.aliases + ' таких');
    check('279.1.3 в ' + plan.length + ' городах: все программы, кроме подготовки к профессии, те же, что при открытии без героя (и в новой сборке)', rests.size === 1 && rests.has(res.rest), [rests.size]);
    check('подготовка «своего города» 279.1.3 (' + ids.length + '): находится по прежнему id — то же заведение, город, язык, цена, срок', ids.length > 1000 && res.missing.length === 0 && res.differ.length === 0, { missing: res.missing.length, differ: res.differ.length, first: res.missing.slice(0, 3).concat(res.differ.slice(0, 3)) });
    check('подготовка «своего города» 279.1.3: в выбор (programs16) не попадает — у страны одна подготовка к каждой профессии', res.offered.length === 0, res.offered.slice(0, 3));
    await p.ctx.close();
  }

  // ---------- 3. Сохранение 279.1.3 из Барселоны ----------
  let made = null;
  {
    const o = await open(browser, { old: true });
    await born(o, 'es', BCN);
    await o.pg.evaluate(() => { __live('Барселона', 'es'); __save(); });
    await reload(o); // 279.1.3 строит программы при открытии игры — теперь в Барселоне
    made = await o.pg.evaluate(MAKE_SAVE, fresh.occIds);
    check('279.1.3, игра открыта в Барселоне: сохранение с учёбой, предложением и заявкой на подготовке к профессии «только для Барселоны», мать учится на такой же', !made.error && made.rows.study && made.rows.offer && made.rows.apply && made.rows.offer[3] === 'cat' && made.rel && o.errors.length === 0, [made.error, made.rows, made.relRole, o.errors.slice(0, 2)]);
    note('сохранение 279.1.3: учёба ' + made.rows.study?.slice(0, 3).join(' · ') + '; предложение ' + made.rows.offer?.slice(0, 4).join(' · ') + '; заявка ' + made.rows.apply?.[0] + '; ' + (made.relRole || 'близкий') + ' — ' + made.rows.rel?.[0]);
    await o.ctx.close();
  }
  if (!made.error) {
    // а) «Ваши персонажи» на странице, открытой, когда другая героиня жила в Мадриде.
    {
      const o = await open(browser, { old: BASE });
      await born(o, 'es', MAD, 279141);
      await o.pg.evaluate(() => { __live('Мадрид', 'es'); __save(); });
      await reload(o);
      const loaded = await o.pg.evaluate(m => { __close(); importLives(JSON.parse(m.raw)); const ids = vaultIndex().ids; try { loadCharacter(ids[ids.length - 1]); } catch (e) { return String(e.message); } return true; }, made);
      if (loaded !== true) note('«Ваши персонажи»: loadCharacter — ошибка: ' + loaded);
      await helpers(o.pg);
      const d = await o.pg.evaluate(DRIVE, made);
      check('«Ваши персонажи» (игра открыта в Мадриде): учёба, предложение, заявка и учёба матери — те же программы, заведение, язык и цена', rowsSame(d, made), [d.rows, made.rows]);
      check('«Ваши персонажи» (игра открыта в Мадриде): учёба дошла до диплома, заявка получила ответ, предложение принято (на каталанском), мать учится дальше; без ошибок и NaN', driveOk(d, made) && o.errors.length === 0, [d, o.errors.slice(0, 2)]);
      // Наследница: героиня умирает, жизнь продолжает мать — та же программа и пройденные месяцы.
      const h = await o.pg.evaluate(m => {
        const mom = s.people.find(p => p.id === m.rel); if (!mom) return { skipped: 'нет матери' };
        mom.bio27.study = { program: m.ids.rel, progress: 7 }; mom.bio27.job = null; mom.city18 = 'Барселона'; mom.country = 'es';
        s.dead = true; s.ending = 'Жизнь закончилась.'; log('Последняя запись', s.ending, 'Конец', true); if (typeof estateObserve58 === 'function') estateObserve58(); __save(); render();
        continueCache274 = null;
        const cand = continueCandidates274().find(c => c.id === m.rel);
        let ok = false; try { ok = continueAs274(m.rel); } catch (e) { return { error: String(e.message) }; }
        const st = s.path16?.study;
        return { ok, cand: !!cand, study: st ? [st.program, st.progress, st.status] : null, row: st ? __row(st.program) : null, transfer: s.path16?.transfer || null };
      }, made);
      check('наследница: мать продолжает жизнь — та же программа (' + made.ids.rel + ') и пройденные 7 месяцев', h.ok && h.study && h.study[0] === made.ids.rel && h.study[1] >= 7 && JSON.stringify(h.row) === JSON.stringify(made.rows.rel) && o.errors.length === 0, [h, o.errors.slice(0, 2)]);
      await o.ctx.close();
    }
    // б) Обновление страницы: героиня из Барселоны — та, что была открыта; файлы уже новые.
    {
      const o = await open(browser, { old: BASE });
      await o.pg.goto('http://game.local/blank27914.html');
      await o.pg.evaluate(store => { localStorage.clear(); for (const [k, v] of Object.entries(JSON.parse(store))) localStorage.setItem(k, v); }, made.store);
      const before = o.errors.length + o.logged.length;
      await o.pg.goto('http://game.local/index.html'); await ready(o.pg); await helpers(o.pg);
      const loadErr = o.errors.concat(o.logged).slice(before);
      const d = await o.pg.evaluate(DRIVE, made);
      check('обновление страницы (героиня в Барселоне): при открытии ни одной ошибки в консоли', loadErr.length === 0, [loadErr.length, [...new Set(loadErr)].slice(0, 2)]);
      check('обновление страницы (героиня в Барселоне): те же программы, учёба до диплома, ответ на заявку, предложение принято, мать учится дальше', rowsSame(d, made) && driveOk(d, made) && o.errors.length === 0, [d, o.errors.slice(0, 2)]);
      await o.ctx.close();
    }
    // в) Обновление страницы, когда героиня уже живёт в Мадриде (у 279.1.3 программы тогда строились по Мадриду).
    {
      const o = await open(browser, { old: BASE });
      await o.pg.goto('http://game.local/blank27914.html');
      await o.pg.evaluate(store => { localStorage.clear(); for (const [k, v] of Object.entries(JSON.parse(store))) localStorage.setItem(k, v); }, made.store);
      await o.pg.goto('http://game.local/index.html'); await ready(o.pg); await helpers(o.pg);
      await o.pg.evaluate(() => { __live('Мадрид'); __save(); });
      const before = o.errors.length + o.logged.length;
      await reload(o);
      const loadErr = o.errors.concat(o.logged).slice(before);
      const r = await o.pg.evaluate(m => { const x = path16(), p0 = x.study.progress; try { __month(1); } catch (e) {} return { at: residenceCity(), rows: Object.fromEntries(Object.entries(m.ids).map(([k, id]) => [k, __row(id)])), blocked: x.study?.blocked || '', same: x.study?.progress === p0 }; }, made);
      const d = await o.pg.evaluate(DRIVE, made);
      check('обновление страницы (героиня в Мадриде): программы те же — в Барселоне, на том же языке; при открытии без ошибок', r.at === MAD && rowsSame(r, made) && loadErr.length === 0, [r.at, r.rows, made.rows, [...new Set(loadErr)].slice(0, 2)]);
      check('героиня в Мадриде: учёба в Барселоне ждёт («Нужны проживание в городе программы»), после возвращения доходит до диплома; предложение и заявка — как в Барселоне', /проживание/.test(r.blocked) && r.same && driveOk(d, made) && o.errors.length === 0, [r.blocked, r.same, d, o.errors.slice(0, 2)]);
      await o.ctx.close();
    }
  }

  // ---------- 4. Открытие игры с идущей учёбой: ни одной ошибки, бюджет с той же платой ----------
  for (const [cc, city] of [['es', BCN], ['ma', CAS]]) {
    const o = await open(browser, { old: BASE });
    await born(o, cc, city, 279142);
    const id = await o.pg.evaluate(STUDY_HERE, [cc, city]);
    const was = await o.pg.evaluate(BUDGET);
    const before = o.errors.length + o.logged.length;
    await reload(o);
    const loadErr = o.errors.concat(o.logged).slice(before);
    const now = await o.pg.evaluate(BUDGET);
    const after = await o.pg.evaluate(() => { const p0 = path16().study?.progress; __month(1); return { nan: __nan(), progress: path16().study?.progress, p0 }; });
    note(city + ': учёба ' + id + ', плата ' + now.fee + ' в месяц; ошибок при открытии ' + loadErr.length + (loadErr.length ? ' — ' + [...new Set(loadErr)].slice(0, 2).join(' | ') : ''));
    check(city + ': открытие игры с идущей учёбой — ни одной ошибки в консоли', loadErr.length === 0, [loadErr.length, [...new Set(loadErr)].slice(0, 2)]);
    check(city + ': сценарии после отрисовки дорабатывают до конца (обёртки life23.js, readability20.js, family231.js на месте)', now.tail.every(t => t === 'function'), now.tail);
    check(city + ': бюджет месяца после открытия — с той же платой за учёбу, что до обновления (' + now.study + ' = ' + now.fee + ')', now.fee > 0 && Number.isFinite(now.cost) && now.study === now.fee && now.cost === was.cost && now.free === was.free && now.program === id, [was, now]);
    check(city + ': месяц после открытия — учёба идёт, без NaN и ошибок', after.progress === after.p0 + 1 && after.nan.length === 0 && o.errors.length === 0, [after, o.errors.slice(0, 2)]);
    await o.ctx.close();
  }
  // Программы до 279.1 (у прежних вузов): учитель по предмету, направление внутри программы, подготовка к профессии 68.
  for (const [cc, id] of [['es', 'es-u4-education-bachelor-math'], ['es', 'es-u2-arts-bachelor-track45-finearts'], ['es', 'profession68-es-doctor'], ['ru', 'profession68-ru-teacher']]) {
    const o = await open(browser, { old: BASE });
    await born(o, cc, null, 279142);
    const info = await o.pg.evaluate(STUDY_ON, id);
    if (info.error) { check(id + ': программа до 279.1 есть', false, info.error); await o.ctx.close(); continue; }
    const was = await o.pg.evaluate(BUDGET), btn0 = await o.pg.evaluate(PARENTS_BTN);
    const before = o.errors.length + o.logged.length;
    await reload(o);
    const loadErr = o.errors.concat(o.logged).slice(before);
    const now = await o.pg.evaluate(BUDGET), btn1 = await o.pg.evaluate(PARENTS_BTN);
    const after = await o.pg.evaluate(() => { const p0 = path16().study?.progress; __month(1); return { nan: __nan(), progress: path16().study?.progress, p0 }; });
    note(id + ' (' + info.city + '): плата ' + now.fee + ' в месяц; ошибок при открытии ' + loadErr.length + (loadErr.length ? ' — ' + [...new Set(loadErr)].slice(0, 2).join(' | ') : ''));
    check(id + ': открытие игры с идущей учёбой — ни одной ошибки в консоли', loadErr.length === 0, [loadErr.length, [...new Set(loadErr)].slice(0, 2)]);
    check(id + ': сценарии после отрисовки дорабатывают до конца, кнопка «Договориться с родителями об оплате» на месте', now.tail.every(t => t === 'function') && btn0 === true && btn1 === true, [now.tail, btn0, btn1]);
    check(id + ': бюджет после открытия — с той же платой за учёбу (' + now.study + ' = ' + now.fee + '), месяц идёт без NaN', now.fee > 0 && now.study === now.fee && now.cost === was.cost && now.free === was.free && now.program === id && after.progress === after.p0 + 1 && after.nan.length === 0 && o.errors.length === 0, [was, now, after, o.errors.slice(0, 2)]);
    await o.ctx.close();
  }
  if (OWNER && fs.existsSync(OWNER)) {
    const raw = fs.readFileSync(OWNER, 'utf8');
    const o = await open(browser, { old: BASE });
    await o.pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
    await ready(o.pg); await helpers(o.pg);
    const was = await o.pg.evaluate(() => { __save(); return { id: s.saveId, budget: Math.round(monthlyBudget().cost), club: clubState19().memberships.filter(m => m.status !== 'left').map(m => clubsCatalog19[m.type]?.name) }; });
    const before = o.errors.length + o.logged.length;
    await reload(o);
    const loadErr = o.errors.concat(o.logged).slice(before);
    const r = await o.pg.evaluate(BUDGET);
    Object.assign(r, await o.pg.evaluate(() => { const out = { id: s.saveId, budget: Math.round(monthlyBudget().cost), club: clubState19().memberships.filter(m => m.status !== 'left').map(m => clubsCatalog19[m.type]?.name) }; __month(12); out.nan = __nan(); return out; }));
    note('сохранение владелицы: клубы — ' + r.club.join(', ') + '; ошибок при открытии ' + loadErr.length);
    check('сохранение владелицы: открытие игры после обновления — ни одной ошибки в консоли, тот же персонаж, бюджет и клубы', loadErr.length === 0 && r.id === was.id && r.budget === was.budget && JSON.stringify(r.club) === JSON.stringify(was.club) && r.club.every(Boolean), [loadErr.length, [...new Set(loadErr)].slice(0, 2), was, r.budget, r.club]);
    check('сохранение владелицы: сценарии после отрисовки дорабатывают до конца (обёртки life23.js, readability20.js, family231.js на месте)', r.tail.every(t => t === 'function'), r.tail);
    check('сохранение владелицы: год без NaN и ошибок страницы', r.nan.length === 0 && o.errors.length === 0, [r.nan, o.errors.slice(0, 2)]);
    await o.ctx.close();
  } else note('OWNER_SAVE не задан — настоящее сохранение пропущено');

  // ---------- 5. Прежний язык 279.1, который 279.1.1–279.1.3 не запомнили ----------
  for (const kind of ['en', 'fr']) {
    const o = await open(browser, { old: BASE });
    await born(o, 'ca', 'Квебек', 279143);
    const m = await o.pg.evaluate(QUEBEC_SAVE, kind);
    if (m.error) { check('Квебек (' + kind + '): ' + m.error, false); await o.ctx.close(); continue; }
    const want = kind === 'en' ? m.was : m.now, who = kind === 'en' ? 'англоязычная студентка: снова на прежнем языке (' + m.was + ')' : 'франкоязычная студентка: на нынешнем языке (' + m.now + ')';
    const ok = r => r.lang === want && r.uni === m.uni && (kind === 'en' ? r.pin === m.was : !r.pin) && (kind !== 'en' || !r.needs.includes(m.now)) && r.p1 === r.p0 + 1 && !r.blocked && !r.err && r.nan.length === 0;
    // а) обновление страницы: сохранение уже с пустым списком прежних языков
    await o.pg.goto('http://game.local/blank27914.html');
    await o.pg.evaluate(store => { localStorage.clear(); for (const [k, v] of Object.entries(JSON.parse(store))) localStorage.setItem(k, v); }, m.store);
    const before = o.errors.length + o.logged.length;
    await o.pg.goto('http://game.local/index.html'); await ready(o.pg); await helpers(o.pg);
    const loadErr = o.errors.concat(o.logged).slice(before);
    const r1 = await o.pg.evaluate(QUEBEC_STATE, m.id);
    note('Квебек, ' + m.id + ' (в 279.1 — ' + m.was + ', теперь — ' + m.now + '), ' + kind + ': при обновлении страницы язык ' + r1.lang + ', нужны языки: ' + (r1.needs.join(', ') || 'нет'));
    check('Квебек, обновление страницы — ' + who + ', учёба идёт, без ошибок', ok(r1) && loadErr.length === 0 && o.errors.length === 0, [r1, loadErr.slice(0, 2)]);
    await o.ctx.close();
    // б) «Ваши персонажи» на странице, открытой с другой героиней (Москва)
    const q = await open(browser, { old: BASE });
    await born(q, 'ru', 'Москва', 279144);
    const loaded = await q.pg.evaluate(raw => { __close(); importLives(JSON.parse(raw)); const ids = vaultIndex().ids; try { loadCharacter(ids[ids.length - 1]); } catch (e) { return String(e.message); } return true; }, m.raw);
    await helpers(q.pg);
    const r2 = await q.pg.evaluate(QUEBEC_STATE, m.id);
    check('Квебек, «Ваши персонажи» на странице из Москвы — ' + who + ', учёба идёт, без ошибок', loaded === true && ok(r2) && q.errors.length === 0, [loaded, r2, q.errors.slice(0, 2)]);
    await q.ctx.close();
  }

  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: файлы сборки 279.1.3)' : ''));
  process.exit(fail ? 1 : 0);
})();

