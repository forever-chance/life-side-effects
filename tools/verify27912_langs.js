// Проверки сборки 279.1.2 (unis2791.js, unis2791-data.js, точечно trajectory16.js и study2733.js): два языка обучения в
// Марокко, Индии, Египте, Турции и единичных заведениях ещё пяти стран; работа в Монреале и Квебеке и по-французски.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify27912_langs.js
// BASE=1 — вместо нынешних unis2791.js, unis2791-data.js, trajectory16.js, study2733.js и cinema191.js файлы сборки 279.1.1
//   (git show REF27911:…, по умолчанию 026e06f): видно, какие проверки ловят прежнее поведение.
// OWNER_SAVE=файл — ещё и настоящее сохранение (экспорт «Ваши персонажи»; берётся последний персонаж).
// UNIS_RESEARCH=all.json — исследовательский файл (не в репозитории): ни одного настоящего названия в файлах игры.
// Что проверяется:
// • данные: строки 279.1.1 те же, у заведений на двух языках в конце '' и 'fr+ar' / 'en+hi'…; по странам — сколько;
//   Испания, Канада, бенгальские заведения Калькутты — без изменений;
// • id: все программы 279.1.1 на месте с тем же вузом, ценой, отбором, сроком, названием и языком; новые — только копии
//   «-fr», «-ar», «-hi», «-tr», «-en»… с языком в названии; программы Канады — те же, что в 279.1.1;
// • у каждой программы заведения на двух языках (ступени с копиями) есть такая же на втором языке;
// • Марокко: арабоязычная 18 лет поступает в Касабланке и Рабате в заведения, где источник называет французский, —
//   на арабском; франкоязычная — на французском; карточка и «О вузе»;
// • кнопки карточки у заведения на двух языках подписаны обе («Информатика · на английском» и «· на хинди»), у прочих
//   заведений (и в Канаде) подписи как в 279.1.1;
// • Индия: 18 лет, хинди родной и английский A2, — в прежде целиком английские заведения Мумбаи и Нью-Дели (копии на
//   хинди); медицина и право таких заведений есть и на английском;
// • Египет и Турция: у английских и французского заведений есть копии на арабском и турецком;
// • сохранение 279.1.1 с учёбой, предложением и заявкой в Марокко и Индии — тот же язык и названия, учёба до диплома,
//   и при обычном открытии игры после обновления (перезагрузка страницы);
// • работа: франкоязычная (французский родной, английский A2) в Монреале и Квебеке может откликаться, язык не мешает,
//   допуск, творческие заказы и приглашения в кино — тоже; англоязычному в Монреале — те же вакансии, что в 279.1.1;
//   Оттава — как была; подсказка «Язык страны» в Монреале называет французский;
// • сохранение 279.1.1 франкоязычной в Монреале с вакансиями на английском: после обновления «Языки» сразу, до списка
//   вакансий, — «Язык страны · Монреаль — французский и английский», не «Нужен для вакансий»;
// • сохранение владелицы — без ошибок.
// 279.1.3: Испания (местные языки — 'cat+es', 'glg+es', 'eus+es' и 'en+es' у Кастельяны, копии copy27912) здесь
//   пропускается — её проверяет verify27913_langs.js; остальные страны сверяются, как раньше.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const BASE = process.env.BASE === '1', REF = process.env.REF27911 || '026e06f';
const OWNER = process.env.OWNER_SAVE || '', RESEARCH = process.env.UNIS_RESEARCH || '';
const PHONE = { width: 390, height: 844 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 1200) : '')); };
const note = t => console.log('     ' + t);
const git = f => { try { return execSync('git -C ' + JSON.stringify(ROOT) + ' show ' + REF + ':' + f, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
const FILES = ['unis2791.js', 'unis2791-data.js', 'trajectory16.js', 'study2733.js', 'cinema191.js'];
const OLD = Object.fromEntries(FILES.map(f => [f, git(f)]));
const parseData = text => { try { return JSON.parse(/const unis2791Data=(\{[\s\S]*\});\s*$/.exec(text)[1]); } catch (e) { return null; } };
// Заведения на двух языках по странам (как печатает python3 tools/unis2791_build.py all.json --check).
const BOTH = { ma: 40, in: 62, eg: 15, tr: 12, nl: 2, fr: 1, kr: 3, cn: 3, th: 2 };
const LOCAL = { ma: 'ar', in: 'hi', eg: 'ar', tr: 'tr', nl: 'nl', fr: 'fr', kr: 'ko', cn: 'zh', th: 'th' };
const EXPECT = {
  'Университет Мулай Юсеф · Касабланка': 'fr+ar', 'Высшая инженерная школа «Аль-Джазари» · Касабланка': 'fr+ar',
  'Высший институт журналистики и коммуникации Удайя · Рабат': 'fr+ar',   // французский назван вторым — в Марокко тоже
  'Университет Салсетт · Мумбаи': 'en+hi', 'Национальный технологический институт Махараштры · Мумбаи': 'en+hi',
  'Американский университет Гарден-Сити · Каир': 'en+ar', 'Немецкий университет Эт-Тагамоа · Каир': 'en+ar', 'Франкоязычный университет «Тауфик аль-Хаким» · Александрия': 'fr+ar',
  'Университет Ешилькёй · Стамбул': 'en+tr', 'Университет Бейоглу · Стамбул': 'fr+tr', 'Университет Мехмет Тунчель · Стамбул': 'en+tr',
  'Высшая отельная школа «Ворбюрг» · Гаага': 'en+nl', 'Школа менеджмента Гран-Плас · Лилль': 'en+fr', 'Институт науки и технологий Капчхон · Тэджон': 'en+ko',
  'Университет Цзюлун · Шэньчжэнь': 'en+zh', 'Российско-китайский университет Дунцзян · Шэньчжэнь': 'ru+zh', 'Университет Дой-Тунг · Чианграй': 'en+th',
  'Международный университет Сен-Мартен · Бангкок': 'en+th',
  // не меняются: бенгальский (игра не знает), арабский с французским частью в Египте; Испания — с 279.1.3 (verify27913_langs.js)
  'Университет искусств имени Бонкима · Калькутта': '', 'Университет Мукаттам · Каир': ''
};
const PREP = { fr: 'французском', ar: 'арабском', hi: 'хинди', tr: 'турецком', en: 'английском', nl: 'нидерландском', ko: 'корейском', zh: 'китайском', ru: 'русском', th: 'тайском' };
const CASA = 'Касабланка', RABAT = 'Рабат', MUMBAI = 'Мумбаи', DELHI = 'Нью-Дели', MONTREAL = 'Монреаль', QUEBEC = 'Квебек', OTTAWA = 'Оттава';

// state.old — какие файлы раздавать; можно сменить до pg.reload() (обновление игры при открытом персонаже).
async function open(browser, { old = false, raw = null, seed = 27912, country = 'ca', age = '18' } = {}) {
  const ctx = await browser.newContext({ viewport: PHONE, deviceScaleFactor: 1 });
  const state = { old: old || BASE };
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : state.old && OLD[rel] ? OLD[rel] : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (raw) await pg.evaluate(raw => { importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]); }, raw);
  else {
    await pg.evaluate(([country, age]) => { for (const [k, v] of [['startAge', age], ['country', country]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, [country, age]);
    await pg.evaluate(seed => { Math.random = seeded269(seed); [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click(); }, seed);
  }
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await helpers(pg);
  return { pg, ctx, errors, state };
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
    window.__speaker = (langs, native) => { const x = path16(); x.languages = { ...langs }; x.native = [native]; s.age = 18; s.school = s.school || {}; s.school.grades = 75; x.diplomas = []; x.applications = []; x.jobApplications = []; x.retry = {}; s.skill = 40; x.experience.skills = {}; x.experience.fields = {}; x.experience.projects = []; };
    window.__plain = p => !p.track45 && !p.subject26 && !p.occupation68;
    window.__ok = p => { const r = admission16(p); return !r.why.length && r.probability > 0; };
    // Вакансии «рядом с домом» по всем направлениям: id, должность, город, язык и причины (одинаковый Math.random).
    window.__jobs = () => {
      const x = path16(), view = { ...x.view }, out = [];
      Object.keys(fields16).forEach((field, i) => {
        x.view = { ...view, section: 'jobs', country: 'ca', field, format: 'near', page: 0 }; x.marketKey = null;
        const keep = Math.random; Math.random = seeded269(4000 + i);
        try { makeVacancies16(); } finally { Math.random = keep; }
        for (const v of x.vacancies) out.push([v.id, v.title, v.city, v.language, jobEligibility16(v).why.join(' | ')]);
      });
      x.view = view; return out;
    };
  });
}
async function catalog(pg, country, view) {
  await pg.evaluate(([country, view]) => { __close(); const x = path16(); x.view = { ...x.view, section: 'admission58', country, page: 0, city2791: '', ...view }; s.ui05.panel = 'center'; openPath16('admission58'); }, [country, view]);
  await pg.waitForTimeout(60);
  return pg.evaluate(() => {
    const t = document.querySelector('[data-panel="center"] .trajectory') || document.querySelector('.trajectory');
    return [...(t ? t.querySelectorAll('.uni2791') : [])].map(c => ({ name: c.querySelector('h3').textContent, text: c.innerText, terms: c.querySelector('.uni-terms2791')?.innerText || '', chips: [...c.querySelectorAll('.chip2791')].map(b => b.textContent) }));
  });
}
// Учащиеся: сколько заведений города с данным полем языков открыты (бакалавриат и профессиональное, общие программы).
const OPEN_FN = ([country, cities, langs, native, lang]) => {
  __speaker(langs, native);
  const out = {};
  for (const c of cities) {
    __live(c);
    const us = universities16.filter(u => u.country === country && u.city === c && u.kind2791);
    out[c] = us.map(u => { const ps = programs16.filter(p => p.university === u.id && ['bachelor', 'vocational'].includes(p.level) && __plain(p) && (!lang || p.language === lang)); return [u.name, ps.length, ps.filter(__ok).length, !!u.langs27912, !!u.international]; });
  }
  return out;
};
// Приглашение в кино после работы (cinemaInvitation191): четыре работы качества 95, случайность почти ноль — приглашение
// будет, если не мешает язык. Возвращает для каждого [город, языки, родной] названия приглашений.
const CINEMA_FN = cases => {
  const out = [];
  for (const [city, langs, native] of cases) {
    __live(city); __speaker(langs, native); s.age = 30; s.job = null;
    const x = creative47(), before = x.applications.length, works = x.works;
    x.nextCinema191 = 0;
    const spec = Object.keys(specialties184.cinema)[0], work = { id: 'w27912', track: 'cinema', specialty184: spec, quality: 95, level184: 2, title: 'Проба' };
    x.works = [...(works || []), ...[1, 2, 3, 4].map(i => ({ ...work, id: 'w27912-' + i }))];
    const keep = Math.random; Math.random = () => 0.001;
    let got = [];
    try { cinemaInvitation191(work); got = x.applications.slice(before).map(a => a.offer.title); } catch (e) { got = ['ошибка: ' + e.message]; } finally { Math.random = keep; }
    x.applications = x.applications.slice(0, before); x.works = works;
    out.push([city, native, got]);
  }
  return out;
};
const CINEMA_CASES = [['Монреаль', { fr: 6, en: 1 }, 'fr'], ['Квебек', { fr: 6, en: 1 }, 'fr'], ['Монреаль', { en: 6, fr: 1 }, 'en'], ['Оттава', { fr: 6, en: 1 }, 'fr']];
// Сохранение 279.1.1: в Касабланке, арабский родной, французский и английский B2; учёба в «Мулай Юсеф» (арабский),
// предложение (offerName), заявка в «Аль-Джазари» (арабский, с приёмной комиссией), заявки в Индию — медицина целиком
// английского вуза (хинди) и информатика «Махараштры» (английский).
const MAKE_SAVE = ([city, status, offerName, offerField]) => {
  __live(city); __speaker({ ar: 6, fr: 4, en: 4, hi: 0 }, 'ar'); s.cash = Math.max(s.cash, 5e6);
  const x = path16(), uni = n => universities16.find(u => u.name === n);
  const pick = (n, f, l) => programs16.find(p => p.university === uni(n)?.id && p.field === f && p.level === l && __plain(p));
  const st = pick('Университет Мулай Юсеф · Касабланка', 'computing', 'bachelor'), of = pick(offerName, offerField, 'bachelor'), inEn = pick('Национальный технологический институт Махараштры · Мумбаи', 'computing', 'bachelor');
  const ap = pick('Высшая инженерная школа «Аль-Джазари» · Касабланка', 'engineering', 'bachelor');
  const med = programs16.find(p => p.country === 'in' && p.field === 'medicine' && p.level === 'bachelor' && __plain(p) && uni16(p).international);
  x.applications.push({ id: 'app27912-study', program: st.id, status: 'enrolled', probability: .8, roll: .1, submitted: s.clock.ticks - 40, scholarship: null });
  x.study = { id: 'study27912', application: 'app27912-study', program: st.id, progress: st.months - 3, payer: 'self', status: 'active', research: 0, grades: 80, badTerms: 0 };
  x.applications.push({ id: 'app27912-offer', program: of.id, status, probability: .7, roll: .1, submitted: s.clock.ticks - 2, expires: s.clock.ticks + 18, ...(status === 'accepted' ? { accepted: s.clock.ticks } : {}), scholarship: null });
  x.applications.push({ id: 'app27912-apply', program: ap.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
  x.applications.push({ id: 'app27912-med', program: med.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
  if (inEn.id !== of.id) x.applications.push({ id: 'app27912-in', program: inEn.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
  s.clock.tasks.push({ id: 'process27912', kind: 'pathAdmission', label: 'Приемная комиссия · ' + uni16(ap).name, duration: 2, progress: 0, hours: 2, state: 'planned', application: 'app27912-apply' });
  const row = p => [p.id, uni16(p).name, programName26(p), p.language];
  window.__old = { study: row(st), offer: row(of), apply: row(ap), med: row(med), inEn: row(inEn) };
  save(); if (typeof flushSave264 === 'function') flushSave264();
  return { raw: JSON.stringify({ format: 'life-side-effects', version: 1, exportedAt: new Date().toISOString(), lives: [JSON.parse(JSON.stringify(s))] }), old: window.__old, id: s.saveId };
};

(async () => {
  if (FILES.some(f => !OLD[f])) { console.log('FAIL нет файлов сборки 279.1.1 (git show ' + REF + ') — сравнивать не с чем'); process.exit(1); }
  const browser = await chromium.launch();

  // ---------- 0. Данные ----------
  {
    const dataText = BASE ? OLD['unis2791-data.js'] : fs.readFileSync(path.join(ROOT, 'unis2791-data.js'), 'utf8');
    const codeText = BASE ? OLD['unis2791.js'] : fs.readFileSync(path.join(ROOT, 'unis2791.js'), 'utf8');
    const now = parseData(dataText), was = parseData(OLD['unis2791-data.js']);
    const diff = [], both = {}, specs = {};
    for (const [cc, rows] of Object.entries(was?.countries || {})) {
      const by = new Map((now?.countries?.[cc] || []).map(r => [r[0], r]));
      for (const r of rows) {
        const n = by.get(r[0]);
        if (!n || JSON.stringify(n.slice(0, r.length)) !== JSON.stringify(r)) { diff.push(cc + '-n' + r[0]); continue; }
        specs[n[2]] = n[14] || '';
        if (n.length === r.length || cc === 'es') continue;   // 279.1.3: Испания — verify27913_langs.js
        if (cc === 'ca' || r.length !== 13 || n.length !== 15 || n[13] !== '' || !new RegExp('^[a-z]{2}\\+' + LOCAL[cc] + '$').test(n[14]) || n[14].startsWith(LOCAL[cc] + '+')) diff.push(cc + '-n' + r[0] + ' ' + JSON.stringify(n.slice(13)));
        else both[cc] = (both[cc] || 0) + 1;
      }
      if ((now?.countries?.[cc] || []).length !== rows.length) diff.push(cc + ' число');
    }
    check('данные: строки 279.1.1 те же, у заведений на двух языках в конце — пустое поле и «язык источника+язык страны»', now && diff.length === 0, diff.slice(0, 8));
    check('данные: на двух языках — ' + Object.entries(BOTH).map(([k, v]) => k + ' ' + v).join(', ') + ' (Канада — нет; Испания — verify27913_langs.js)', JSON.stringify(Object.fromEntries(Object.entries(both).sort())) === JSON.stringify(Object.fromEntries(Object.entries(BOTH).sort())), both);
    const bad = Object.entries(EXPECT).filter(([n, v]) => specs[n] !== v).map(([n, v]) => n + ': ' + JSON.stringify(specs[n]) + ' вместо ' + JSON.stringify(v));
    check('данные: примеры по источнику (Марокко — и где французский вторым; бенгальский и арабский с частью французского в Египте — без изменений)', bad.length === 0, bad);
    check('данные: нет real_name, source и ссылок', !/real_name|"source"|https?:|www\./.test(dataText + codeText));
    if (RESEARCH && fs.existsSync(RESEARCH)) {
      const src = JSON.parse(fs.readFileSync(RESEARCH, 'utf8'));
      const real = src.flatMap(c => c.institutions.flatMap(u => [u.real_name, u.real_name_en])).filter(n => n && n.length >= 6);
      const extra = ['trajectory16.js', 'study2733.js', 'cinema191.js'].map(f => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
      const hay = dataText + codeText + extra + fs.readFileSync(__filename, 'utf8'), found = [...new Set(real.filter(n => hay.includes(n)))];
      check('данные: ни одного настоящего названия (' + real.length + ') в unis2791-data.js, unis2791.js, trajectory16.js, study2733.js, cinema191.js и этом тесте', found.length === 0, found.slice(0, 5).join(' | '));
    } else note('UNIS_RESEARCH не задан — сверка с настоящими названиями пропущена');
  }

  // ---------- 1. Сборка 279.1.1: эталон ----------
  const ref = {};
  {
    const { pg, ctx, errors } = await open(browser, { old: true, seed: 279121, country: 'ma' });
    ref.programs = await pg.evaluate(() => programs16.map(p => [p.id, p.university, p.field, p.level, p.fee, p.selectivity, p.months, p.minLanguage, programName26(p), p.language, p.country]));
    ref.chips = await pg.evaluate(() => Object.fromEntries(programs16.map(p => [p.id, chipLabel2791(p)])));
    ref.maAr = await pg.evaluate(OPEN_FN, ['ma', [CASA, RABAT], { ar: 6, fr: 1, en: 1 }, 'ar', null]);
    ref.maFr = await pg.evaluate(OPEN_FN, ['ma', [CASA, RABAT], { fr: 6, ar: 1, en: 1 }, 'fr', null]);
    ref.inHi = await pg.evaluate(OPEN_FN, ['in', [MUMBAI, DELHI], { hi: 6, en: 2 }, 'hi', null]);
    ref.save = await pg.evaluate(MAKE_SAVE, [CASA, 'offered', 'Национальный технологический институт Махараштры · Мумбаи', 'computing']);
    check('279.1.1: эталон снят без ошибок, учёба и заявки — арабский, английский, арабский, хинди', errors.length === 0 && ref.save.old.study[3] === 'ar' && ref.save.old.offer[3] === 'en' && ref.save.old.apply[3] === 'ar' && ref.save.old.med[3] === 'hi' && ref.save.old.inEn[3] === 'en', [errors.slice(0, 2), ref.save.old]);
    await ctx.close();
  }
  {
    const { pg, ctx } = await open(browser, { old: true, seed: 279123, country: 'ca' });
    const jobsOld = async (city, langs, native) => pg.evaluate(([city, langs, native]) => { __live(city); __speaker(langs, native); return __jobs(); }, [city, langs, native]);
    ref.anglo = await jobsOld(MONTREAL, { en: 6, fr: 1 }, 'en');
    ref.francoMtl = await jobsOld(MONTREAL, { fr: 6, en: 2 }, 'fr');
    ref.francoQc = await jobsOld(QUEBEC, { fr: 6, en: 2 }, 'fr');
    ref.francoOtt = await jobsOld(OTTAWA, { fr: 6, en: 2 }, 'fr');
    ref.hintOtt = await pg.evaluate(O => { __live(O); __speaker({ fr: 6, en: 2 }, 'fr'); path16().vacancies = []; return JSON.stringify(langTop2733()); }, OTTAWA);
    ref.hintMtl = await pg.evaluate(M => { __live(M); __speaker({ en: 6, fr: 1 }, 'en'); path16().vacancies = []; return JSON.stringify(langTop2733()); }, MONTREAL);
    ref.cinema = await pg.evaluate(CINEMA_FN, CINEMA_CASES);
    await ctx.close();
  }
  const langBlocked = rows => rows.filter(r => /Английский|Французский/.test(r[4])).length;
  const free = rows => rows.filter(r => !r[4]).length;
  note('279.1.1: франкоязычной в Монреале язык мешает в ' + langBlocked(ref.francoMtl) + ' из ' + ref.francoMtl.length + ' вакансий, в Квебеке — ' + langBlocked(ref.francoQc) + ' из ' + ref.francoQc.length);

  // ---------- 2. Новая сборка: программы ----------
  {
    const { pg, ctx, errors } = await open(browser, { seed: 279121, country: 'ma' });
    const ids = await pg.evaluate(([programs, PREP, LOCAL]) => {
      const known = new Map(programs.map(r => [r[0], r])), out = { missing: [], changed: [], added: 0, addedBad: [], per: {}, caNew: [], incomplete: [] };
      for (const r of programs) {
        const p = prog16(r[0]);
        if (!p) { out.missing.push(r[0]); continue; }
        const now = [p.id, p.university, p.field, p.level, p.fee, p.selectivity, p.months, p.minLanguage, programName26(p), p.language, p.country];
        if (JSON.stringify(now) !== JSON.stringify(r)) out.changed.push(r[0]);
      }
      for (const p of programs16) if (!known.has(p.id)) {
        if (p.country === 'es' && p.copy27912) continue;   // 279.1.3: копии Испании — verify27913_langs.js
        out.added++;
        const m = /^(.*)-([a-z]{2})$/.exec(p.id), base = m && known.get(m[1]);
        out.per[p.country] = (out.per[p.country] || 0) + 1;
        if (p.country === 'ca') out.caNew.push(p.id);
        if (!m || !base || !p.copy27912 || p.language !== m[2] || base[9] === m[2] || !(p.country in LOCAL) || programName26(p) !== base[8] + ' · на ' + PREP[m[2]] || p.fee !== base[4] || p.selectivity !== base[5] || p.months !== base[6] || p.university !== base[1] || p.level === 'certificate' || p.subject26) out.addedBad.push(p.id);
      }
      // У каждой программы заведения на двух языках (ступени с копиями, кроме предметов учителя) — такая же на обоих.
      const by = new Map();
      for (const p of programs16) { const l = by.get(p.university); if (l) l.push(p); else by.set(p.university, [p]); }
      let pairs = 0;
      for (const u of universities16.filter(u => u.langs27912 && u.country !== 'es')) for (const p of by.get(u.id) || []) {
        if (p.copy27911 || p.english2791 || p.subject26 || !['bachelor', 'master', 'phd', 'vocational'].includes(p.level)) continue;
        for (const l of u.langs27912) { if (p.language === l) continue; pairs++; const c = prog16(p.id + '-' + l); if (!c || c.language !== l) out.incomplete.push(p.id + ' → ' + l); }
      }
      out.pairs = pairs;
      out.unis = universities16.filter(u => u.langs27912 && u.country !== 'es').length;
      return { ...out, missing: out.missing.slice(0, 5), changed: out.changed.slice(0, 5), addedBad: out.addedBad.slice(0, 5), incomplete: out.incomplete.slice(0, 5), caNew: out.caNew.slice(0, 5) };
    }, [ref.programs, PREP, LOCAL]);
    check('id: все ' + ref.programs.length + ' программ 279.1.1 на месте — вуз, направление, ступень, цена, отбор, срок, название и язык', ids.missing.length === 0 && ids.changed.length === 0, { missing: ids.missing, changed: ids.changed });
    check('id: новые (' + ids.added + ') — копии «-fr», «-ar», «-hi», «-tr», «-en»… той же программы, язык в названии, без сертификатов и предметов учителя', ids.added > 0 && ids.addedBad.length === 0, ids.addedBad);
    check('Канада: программы те же, что в 279.1.1 (новых нет)', ids.caNew.length === 0 && !ids.per.ca, ids.caNew);
    check('заведения на двух языках (' + ids.unis + '): у каждой программы есть такая же на втором языке (' + ids.pairs + ' пар)', ids.unis === Object.values(BOTH).reduce((a, b) => a + b, 0) && ids.pairs > 0 && ids.incomplete.length === 0, ids.incomplete);
    note('новые копии по странам: ' + JSON.stringify(ids.per));
    ref.perCountry = ids.per;

    // Марокко: арабоязычная и франкоязычная 18 лет в Касабланке и Рабате.
    const ar = await pg.evaluate(OPEN_FN, ['ma', [CASA, RABAT], { ar: 6, fr: 1, en: 1 }, 'ar', 'ar']);
    const fr = await pg.evaluate(OPEN_FN, ['ma', [CASA, RABAT], { fr: 6, ar: 1, en: 1 }, 'fr', 'fr']);
    const frUnis = c => ar[c].filter(r => r[3]);
    check('Марокко: в Касабланке (' + frUnis(CASA).length + ') и Рабате (' + frUnis(RABAT).length + ') заведения, где источник называет французский, — у всех есть программы на арабском, арабоязычной шанс больше нуля', [CASA, RABAT].every(c => frUnis(c).length >= 5 && frUnis(c).every(r => r[1] > 0 && r[2] > 0)), ar);
    check('Марокко: те же заведения — и на французском, франкоязычной шанс больше нуля', [CASA, RABAT].every(c => fr[c].filter(r => r[3]).length === frUnis(c).length && fr[c].filter(r => r[3]).every(r => r[1] > 0 && r[2] > 0)), fr);
    const openUnis = (m, c) => m[c].filter(r => r[2] > 0).length;
    note('франкоязычная в Касабланке: было ' + openUnis(ref.maFr, CASA) + ' из ' + ref.maFr[CASA].length + ' заведений, стало ' + openUnis(fr, CASA) + '; в Рабате ' + openUnis(ref.maFr, RABAT) + ' → ' + openUnis(fr, RABAT) + '; арабоязычной в Касабланке ' + openUnis(ref.maAr, CASA) + ' → ' + openUnis(ar, CASA));
    check('Марокко: арабоязычной открыто не меньше, чем в 279.1.1', [CASA, RABAT].every(c => openUnis(ar, c) >= openUnis(ref.maAr, c)), [ar, ref.maAr]);
    await pg.evaluate(C => { __live(C); __speaker({ fr: 6, ar: 1, en: 1 }, 'fr'); }, CASA);
    const casaFr = await catalog(pg, 'ma', { field: 'computing', level: 'bachelor', city2791: CASA });
    const my = casaFr.find(c => /Мулай Юсеф/.test(c.name));
    check('карточка в Касабланке, франкоязычной: «Мулай Юсеф» — «· на французском», «Шанс поступить», кнопка «Информатика · на французском»', my && /· на французском/.test(my.terms) && /Шанс поступить/.test(my.terms) && my.chips.includes('Информатика · на французском') && my.chips.includes('Информатика'), my || casaFr.map(c => c.name));
    await pg.evaluate(C => { __live(C); __speaker({ ar: 6, fr: 1, en: 1 }, 'ar'); }, CASA);
    const casaAr = await catalog(pg, 'ma', { field: 'computing', level: 'bachelor', city2791: CASA });
    const my2 = casaAr.find(c => /Мулай Юсеф/.test(c.name));
    check('карточка в Касабланке, арабоязычной: «Мулай Юсеф» — язык не пишется (язык страны), «Шанс поступить»', my2 && !/· на /.test(my2.terms) && /Шанс поступить/.test(my2.terms), my2);
    const law = await pg.evaluate(() => {
      const u = universities16.find(u => u.name === 'Университет Мулай Юсеф · Касабланка'), ps = programs16.filter(p => p.university === u.id && p.field === 'law' && p.level === 'bachelor' && __plain(p));
      __speaker({ fr: 6, ar: 1, en: 1 }, 'fr');
      return { langs: ps.map(p => p.language).sort().join('/'), fr: ps.filter(p => p.language === 'fr').map(p => [programName26(p), admission16(p).why]), about: aboutUni2791(u) };
    });
    check('«Мулай Юсеф»: право на арабском и на французском, франкоязычной французский не мешает; «О вузе» — «Учат на французском и арабском.»', law.langs === 'ar/fr' && law.fr.every(r => !r[1].length) && /Учат на французском и арабском\./.test(law.about), law);

    // Индия: хинди родной, английский A2.
    const hi = await pg.evaluate(OPEN_FN, ['in', [MUMBAI, DELHI], { hi: 6, en: 2 }, 'hi', 'hi']);
    const intl = (m, c) => m[c].filter(r => r[4]);
    check('Индия: прежде целиком английские заведения Мумбаи (' + intl(hi, MUMBAI).length + ') и Нью-Дели (' + intl(hi, DELHI).length + ') — у всех есть программы на хинди, шанс больше нуля', [MUMBAI, DELHI].every(c => intl(hi, c).length >= 3 && intl(hi, c).every(r => r[1] > 0 && r[2] > 0)), hi);
    note('хинди и английский A2: в Мумбаи было ' + openUnis(ref.inHi, MUMBAI) + ' из ' + ref.inHi[MUMBAI].length + ' заведений, стало ' + openUnis(hi, MUMBAI) + '; в Нью-Дели ' + openUnis(ref.inHi, DELHI) + ' → ' + openUnis(hi, DELHI) + '; целиком английских в 279.1.1 открыто ' + [MUMBAI, DELHI].map(c => intl(ref.inHi, c).filter(r => r[2] > 0).length).join(' и '));
    const med = await pg.evaluate(() => {
      __speaker({ en: 6, hi: 1 }, 'en');
      const us = universities16.filter(u => u.kind2791 && u.country === 'in' && u.international && u.fields.some(f => f === 'medicine' || f === 'law'));
      const rows = [];
      for (const u of us) for (const f of ['medicine', 'law']) if (u.fields.includes(f)) {
        const ps = programs16.filter(p => p.university === u.id && p.field === f && p.level === 'bachelor' && __plain(p));
        rows.push([u.name, f, ps.map(p => p.language).sort().join('/'), ps.filter(p => p.language === 'en').some(__ok)]);
      }
      const u = universities16.find(u => u.kind2791 && u.country === 'in' && u.international && u.city === 'Мумбаи');
      return { rows, about: aboutUni2791(u) };
    });
    check('Индия: медицина и право целиком английских заведений (' + med.rows.length + ') — на хинди и на английском, англоязычному шанс больше нуля', med.rows.length >= 5 && med.rows.every(r => r[2] === 'en/hi' && r[3]), med.rows);
    check('Индия: «О вузе» — «Учат на английском и хинди.»', /Учат на английском и хинди\./.test(med.about), med.about);
    await pg.evaluate(M => { __live(M); __speaker({ hi: 6, en: 2 }, 'hi'); }, MUMBAI);
    const mum = await catalog(pg, 'in', { field: 'computing', level: 'bachelor', city2791: MUMBAI });
    const shut = mum.filter(c => /Не хватает: Английский/.test(c.terms));
    check('карточки в Мумбаи (' + mum.length + '): нигде «Не хватает: Английский B2», у английских заведений кнопки «· на хинди»', mum.length >= 3 && shut.length === 0 && mum.some(c => c.chips.some(t => / · на хинди$/.test(t))), mum.map(c => c.name + ' | ' + c.terms + ' | ' + c.chips.join(', ')));
    const nit = mum.find(c => /Махараштры/.test(c.name));
    check('карточка в Мумбаи: «Махараштры» — кнопки «Информатика · на английском» и «Информатика · на хинди»', nit && nit.chips.includes('Информатика · на английском') && nit.chips.includes('Информатика · на хинди') && !nit.chips.includes('Информатика'), nit);
    await pg.evaluate(() => { __live('Каир'); __speaker({ ar: 6, en: 1, fr: 1 }, 'ar'); });
    const cairo = await catalog(pg, 'eg', { field: 'business', level: 'bachelor', city2791: 'Каир' });
    const wide = await pg.evaluate(() => document.documentElement.scrollWidth);
    const gc = cairo.find(c => /Гарден-Сити/.test(c.name)), af = cairo.find(c => /Аль-Фустат/.test(c.name));
    check('карточки в Каире (телефон): «Гарден-Сити» — «Экономика и управление · на английском» и «· на арабском»; «Аль-Фустат» (один язык) — как в 279.1.1; без прокрутки вбок', gc && gc.chips.includes('Экономика и управление · на английском') && gc.chips.includes('Экономика и управление · на арабском') && !gc.chips.includes('Экономика и управление') && af && af.chips.includes('Экономика и управление') && af.chips.includes('Экономика и управление · на английском') && wide <= PHONE.width, [gc, af, wide]);
    // Подписи кнопок карточки по всем программам: у заведения на двух языках программа не на языке страны подписана
    // языком; у прочих заведений (и во всей Канаде) — та же подпись, что в 279.1.1; одной подписи — один язык.
    const chips = await pg.evaluate(([old, PREP]) => {
      const out = { same: 0, ca: 0, labelled: 0, bad: [], mixed: [] }, langs = new Map();
      for (const p of programs16) {
        const u = uni16(p), now = chipLabel2791(p), was = old[p.id];
        if (u?.langs27912) { const k = u.id + '|' + p.field + '|' + p.level + '|' + now, l = langs.get(k) || new Set(); l.add(p.language); langs.set(k, l); }
        if (was === undefined) continue;   // новая копия: подпись — её название (проверено выше)
        if (!u?.langs27912 || p.language === country16[p.country][0] || / · на [^ ]+$/.test(was)) { if (now === was) { out.same++; if (p.country === 'ca') out.ca++; } else out.bad.push([p.id, was, now]); continue; }
        if (now === was + ' · на ' + PREP[p.language]) out.labelled++; else out.bad.push([p.id, was, now]);
      }
      for (const [k, l] of langs) if (l.size > 1) out.mixed.push(k + ' → ' + [...l].join('/'));
      return { ...out, bad: out.bad.slice(0, 5), mixed: out.mixed.slice(0, 5), nmixed: out.mixed.length };
    }, [ref.chips, PREP]);
    note('подписи кнопок: как в 279.1.1 — ' + chips.same + ' (Канада ' + chips.ca + '), с языком прежней программы — ' + chips.labelled);
    check('кнопки карточки: у заведений на двух языках прежняя программа не на языке страны подписана языком (' + chips.labelled + '), остальные (' + chips.same + ', Канада ' + chips.ca + ') — как в 279.1.1', chips.labelled > 0 && chips.bad.length === 0 && chips.ca > 0, chips.bad);
    check('кнопки карточки: у заведения на двух языках одна подпись — один язык', chips.nmixed === 0, chips.mixed);

    // Египет и Турция, единичные заведения.
    const et = await pg.evaluate(() => {
      const out = {};
      for (const [cc, local, langs, native] of [['eg', 'ar', { ar: 6, en: 1, fr: 1 }, 'ar'], ['tr', 'tr', { tr: 6, en: 1, fr: 1 }, 'tr']]) {
        __speaker(langs, native);
        out[cc] = universities16.filter(u => u.country === cc && u.langs27912).map(u => {
          const ps = programs16.filter(p => p.university === u.id && ['bachelor', 'vocational'].includes(p.level) && __plain(p) && p.language === local);
          return [u.name, u.langs27912.join('+'), ps.length, ps.filter(__ok).length];
        });
      }
      const about = n => aboutUni2791(universities16.find(u => u.name === n));
      out.about = { cairo: about('Американский университет Гарден-Сити · Каир'), alex: about('Франкоязычный университет «Тауфик аль-Хаким» · Александрия'), ist: about('Университет Мехмет Тунчель · Стамбул'), bey: about('Университет Бейоглу · Стамбул'),
        ru: about('Российско-китайский университет Дунцзян · Шэньчжэнь'), nl: about('Высшая отельная школа «Ворбюрг» · Гаага') };
      return out;
    });
    check('Египет (' + et.eg.length + '): у английских и французского заведений есть программы на арабском, арабоязычному шанс больше нуля', et.eg.length === BOTH.eg && et.eg.every(r => r[2] > 0 && r[3] > 0), et.eg);
    check('Турция (' + et.tr.length + '): у английских и французского заведений есть программы на турецком, турецкоязычному шанс больше нуля', et.tr.length === BOTH.tr && et.tr.every(r => r[2] > 0 && r[3] > 0), et.tr);
    check('«О вузе»: Каир — «Учат на английском и арабском.», Александрия — «на французском и арабском», Стамбул — «на английском и турецком», «на французском и турецком»', /Учат на английском и арабском\./.test(et.about.cairo) && /Учат на французском и арабском\./.test(et.about.alex) && /Учат на английском и турецком\./.test(et.about.ist) && /Учат на французском и турецком\./.test(et.about.bey), et.about);
    check('«О вузе»: Шэньчжэнь — «Учат на русском и китайском.», Гаага — «на английском и нидерландском» (Испания — verify27913_langs.js)', /Учат на русском и китайском\./.test(et.about.ru) && /Учат на английском и нидерландском\./.test(et.about.nl), et.about);
    check('новая сборка (программы): без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 3. Сохранение 279.1.1 с учёбой в Марокко и заявками в Индии ----------
  {
    const { pg, ctx, errors } = await open(browser, { raw: ref.save.raw });
    const old = ref.save.old;
    const r = await pg.evaluate(old => {
      const x = path16(), row = id => { const p = prog16(id); return p ? [p.id, uni16(p).name, programName26(p), p.language] : null; };
      const out = { pins: JSON.stringify(s.unisLang27911 || null), study: row(old.study[0]), offer: row(old.offer[0]), apply: row(old.apply[0]), med: row(old.med[0]) };
      programDetails16(old.study[0]); [...$('#modal').querySelectorAll('details')].forEach(d => d.open = true); out.win = $('#modal').open ? $('#modal').innerText : ''; __close();
      acceptStudy16('app27912-offer'); out.accepted = x.applications.find(a => a.id === 'app27912-offer')?.status;
      return out;
    }, old);
    check('сохранение 279.1.1: учёба, предложение и заявки — те же id, вуз, название и язык (арабский, английский, арабский, хинди)', ['study', 'offer', 'apply', 'med'].every(k => JSON.stringify(r[k]) === JSON.stringify(old[k])), { now: [r.study, r.offer, r.apply, r.med], was: old });
    check('сохранение 279.1.1: список прежних языков пуст (язык не менялся), окно учёбы — «Язык: Арабский», «Учат на французском и арабском»', r.pins === '{"pins":{}}' && /Язык: Арабский/.test(r.win) && /Учат на французском и арабском/.test(r.win), [r.pins, r.win.slice(0, 600)]);
    check('сохранение 279.1.1: предложение из Мумбаи принимается', r.accepted === 'accepted', r.accepted);
    const after = await pg.evaluate(old => {
      __month(5);
      const x = path16(), d = x.diplomas.find(d => d.program46 === old.study[0]);
      return { diploma: d ? [d.title, d.university] : null, apps: x.applications.filter(a => a.id === 'app27912-apply').map(a => a.status), langs: [old.apply[0], old.med[0], old.offer[0]].map(id => prog16(id).language), nan: __nan() };
    }, old);
    check('сохранение 279.1.1: учёба дошла до диплома с прежним названием вуза', after.diploma && after.diploma[1] === old.study[1], after);
    check('сохранение 279.1.1: заявка в «Аль-Джазари» получила ответ, язык программ прежний', after.apps.length === 1 && ['offered', 'rejected', 'accepted'].includes(after.apps[0]) && after.langs.join() === 'ar,hi,en', after);
    check('сохранение 279.1.1: без NaN и ошибок страницы', after.nan.length === 0 && errors.length === 0, [after.nan, errors.slice(0, 2)]);
    await ctx.close();
  }
  // Обычное открытие игры после обновления: персонаж записан файлами 279.1.1, страница перезагружена уже с новыми.
  {
    const { pg, ctx, errors, state } = await open(browser, { old: true, seed: 279124, country: 'ma' });
    const made = await pg.evaluate(MAKE_SAVE, [CASA, 'accepted', 'Высший институт торговли и управления Анфа · Касабланка', 'business']);
    state.old = BASE;
    const before = errors.length;
    await pg.reload();
    await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&typeof prog16==='function'");
    await helpers(pg);
    // Известное с 279.1 (не эта сборка): идёт учёба в новом заведении — пока страница грузится, бюджет считают ранние
    // скрипты (render в конце trajectory-ui16, family17, career18, clubs19), а программ новых заведений ещё нет
    // (unis2791.js грузится позже): «reading 'fee'» в консоли, на игру не влияет. Считаем отдельно.
    const loadErrors = errors.splice(before);
    note('ошибки при загрузке страницы с идущей учёбой: ' + loadErrors.length + (loadErrors.length ? ' — ' + [...new Set(loadErrors)].join(' | ') : ''));
    check('открытие игры после обновления: при загрузке — только известная с 279.1 ошибка бюджета до загрузки вузов', loadErrors.every(e => /reading 'fee'/.test(e)), loadErrors);
    const r = await pg.evaluate(m => {
      const x = path16(), ids = ['study', 'offer', 'apply', 'med', 'inEn'].map(k => m.old[k][0]);
      const out = { same: s.saveId === m.id, pins: JSON.stringify(s.unisLang27911 || null), rows: ids.map(id => { const p = prog16(id); return p ? [p.id, uni16(p).name, programName26(p), p.language] : null; }) };
      x.study = null;
      const msgs = [], keep = toast; toast = t => msgs.push(t);
      try { studyStart16('app27912-offer', 'self'); } finally { toast = keep; }
      out.study = x.study?.program || null; out.lang = x.study ? prog16(x.study.program).language : null; out.toast = msgs;
      return out;
    }, made);
    check('открытие игры после обновления: тот же персонаж, программы и язык прежние (арабский, арабский, арабский, хинди, английский)', r.same && JSON.stringify(r.rows) === JSON.stringify(['study', 'offer', 'apply', 'med', 'inEn'].map(k => made.old[k])) && r.rows.map(x => x[3]).join() === 'ar,ar,ar,hi,en' && r.pins === '{"pins":{}}', [r.rows, made.old, r.pins]);
    check('открытие игры после обновления: учёба по принятому предложению «Анфа» начинается — на арабском, как было', r.study === made.old.offer[0] && r.lang === 'ar', [r.study, r.lang, r.toast]);
    check('открытие игры после обновления: после загрузки без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 4. Работа в Монреале и Квебеке ----------
  {
    const { pg, ctx, errors } = await open(browser, { seed: 279123, country: 'ca' });
    const jobs = async (city, langs, native) => pg.evaluate(([city, langs, native]) => { __live(city); __speaker(langs, native); return __jobs(); }, [city, langs, native]);
    const anglo = await jobs(MONTREAL, { en: 6, fr: 1 }, 'en');
    check('англоязычный в Монреале: те же вакансии, язык и причины, что в 279.1.1 (' + anglo.length + ')', anglo.length > 0 && JSON.stringify(anglo) === JSON.stringify(ref.anglo), anglo.filter((r, i) => JSON.stringify(r) !== JSON.stringify(ref.anglo[i])).slice(0, 3));
    for (const [city, was] of [[MONTREAL, ref.francoMtl], [QUEBEC, ref.francoQc]]) {
      const rows = await jobs(city, { fr: 6, en: 2 }, 'fr');
      check('франкоязычная (английский A2) в городе ' + city + ': язык не мешает ни в одной из ' + rows.length + ' вакансий (было мешал в ' + langBlocked(was) + '), откликнуться можно на ' + free(rows) + ' (было ' + free(was) + ')', rows.length === was.length && langBlocked(was) > 0 && langBlocked(rows) === 0 && free(rows) > free(was) && rows.every((r, i) => r[0] === was[i][0] && r[3] === 'fr'), rows.filter(r => /Английский|Французский/.test(r[4]) || r[3] !== 'fr').slice(0, 3));
    }
    const ott = await jobs(OTTAWA, { fr: 6, en: 2 }, 'fr');
    check('франкоязычная в Оттаве: как в 279.1.1 — вакансии на английском, нужен английский', JSON.stringify(ott) === JSON.stringify(ref.francoOtt) && langBlocked(ott) > 0, ott.filter((r, i) => JSON.stringify(r) !== JSON.stringify(ref.francoOtt[i])).slice(0, 3));
    const applied = await pg.evaluate(M => {
      __live(M); __speaker({ fr: 6, en: 2 }, 'fr');
      const x = path16(), out = {};
      x.view = { ...x.view, section: 'jobs', country: 'ca', field: 'service', format: 'near', page: 0 }; x.marketKey = null; makeVacancies16();
      const v = x.vacancies.find(v => !jobEligibility16(v).why.length);
      out.vacancy = v ? [v.title, v.city, v.language] : null;
      if (v) { const msgs = [], keep = toast; toast = t => msgs.push(t); try { applyJob16(v.id); } finally { toast = keep; } out.toast = msgs; }
      out.apps = x.jobApplications.map(a => [a.vacancy.city, a.vacancy.language, a.status]);
      // окно вакансии: язык — французский, без «Английский»
      const w = x.vacancies.find(v => v.language === 'fr');
      __close(); if (w) { jobDetails16(w.id); [...$('#modal').querySelectorAll('details')].forEach(d => d.open = true); out.win = $('#modal').open ? $('#modal').innerText : ''; __close(); }
      // фоновый поиск
      x.jobApplications = []; x.retry = {}; x.search = true; x.searchView78 = { ...x.view }; x.lastSearch = -100;
      try { backgroundJobSearch78(); } catch (e) { out.searchError = String(e); }
      out.search = x.jobApplications.map(a => [a.vacancy.city, a.vacancy.language, a.status]);
      x.search = false; x.jobApplications = [];
      return out;
    }, MONTREAL);
    check('франкоязычная в Монреале: отклик на вакансию принят — на французском', applied.vacancy && applied.apps.length === 1 && applied.apps[0][0] === MONTREAL && applied.apps[0][1] === 'fr', applied);
    check('окно вакансии в Монреале: язык французский, английского не требует', applied.win && /Французский/.test(applied.win) && !/Английский B/.test(applied.win), (applied.win || '').slice(0, 600));
    check('фоновый поиск работы в Монреале откликается за франкоязычную', applied.search.length === 1 && applied.search[0][1] === 'fr', applied);
    const lic = await pg.evaluate(([M, O]) => {
      const out = {};
      for (const c of [M, O]) {
        __live(c); __speaker({ fr: 6, en: 2 }, 'fr'); s.cash = Math.max(s.cash, 5e6);
        const p = profession16('nurse'), x = path16();
        x.diplomas = [{ field: p.field, level: p.required || 'bachelor', title: 'тест', university: 'тест', year: s.year }];
        s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'pathLicense');
        const msgs = [], keep = toast; toast = t => msgs.push(t);
        try { license16('nurse', 'ca'); } finally { toast = keep; }
        out[c] = { toast: msgs, task: s.clock.tasks.some(t => t.kind === 'pathLicense' && t.profession === 'nurse') };
        s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'pathLicense'); x.diplomas = [];
      }
      return out;
    }, [MONTREAL, OTTAWA]);
    check('профессиональный допуск (медсестра): в Монреале франкоязычная подаёт, в Оттаве нужен английский', lic[MONTREAL].task && !lic[MONTREAL].toast.length && !lic[OTTAWA].task && lic[OTTAWA].toast.some(t => /местный язык/.test(t)), lic);
    const cre = await pg.evaluate(([M, O]) => {
      const out = {};
      for (const c of [M, O]) {
        __live(c); __speaker({ fr: 6, en: 2 }, 'fr');
        const list = creativeMarket47().filter(o => o.language > 2);
        out[c] = list.map(o => creativeCheck47(o).why.filter(w => /^Язык страны/.test(w)).length);
      }
      return out;
    }, [MONTREAL, OTTAWA]);
    check('творческие заказы и пробы: в Монреале «Язык страны» не мешает, в Оттаве — как раньше', cre[MONTREAL].length > 0 && cre[MONTREAL].every(n => n === 0) && cre[OTTAWA].some(n => n > 0), cre);
    const cin = await pg.evaluate(CINEMA_FN, CINEMA_CASES), got = (rows, i) => rows[i][2].length;
    note('приглашение в кино (французский родной, английский A1): 279.1.1 — ' + ref.cinema.map(r => r[0] + ' ' + r[1] + ' ' + r[2].length).join(', ') + '; теперь — ' + cin.map(r => r[0] + ' ' + r[1] + ' ' + r[2].length).join(', '));
    check('приглашение в кино после работы: франкоязычной в Монреале и Квебеке — есть (в 279.1.1 не было), англоязычному в Монреале — есть, как было, в Оттаве франкоязычной — нет, как было', got(cin, 0) === 1 && got(cin, 1) === 1 && got(cin, 2) === 1 && got(cin, 3) === 0 && got(ref.cinema, 0) === 0 && got(ref.cinema, 2) === 1 && got(ref.cinema, 3) === 0 && !cin.some(r => r[2].some(t => /ошибка/.test(t))), [cin, ref.cinema]);
    const hint = await pg.evaluate(([M, O]) => {
      const out = {};
      __live(M); __speaker({ en: 6, fr: 1 }, 'en'); path16().vacancies = [];
      out.anglo = langTop2733();
      openPath16('languages'); out.panel = document.querySelector('.trajectory')?.innerText || '';
      __live(O); __speaker({ fr: 6, en: 2 }, 'fr'); path16().vacancies = [];
      out.ott = JSON.stringify(langTop2733());
      return out;
    }, [MONTREAL, OTTAWA]);
    check('подсказка «Язык страны» в Монреале (англоязычному): французский — «Монреаль — французский и английский»', hint.anglo && hint.anglo.l === 'fr' && hint.anglo.eyebrow === 'Язык страны' && hint.anglo.why === 'Монреаль — французский и английский' && /Язык страны · Монреаль — французский и английский/i.test(hint.panel), [hint.anglo, ref.hintMtl, hint.panel.slice(0, 300)]);
    check('подсказка в Оттаве (франкоязычной) — как в 279.1.1: английский, «Канада»', hint.ott === ref.hintOtt && /"l":"en"/.test(hint.ott) && /Канада/.test(hint.ott), [hint.ott, ref.hintOtt]);
    check('работа: без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // Сохранение 279.1.1 франкоязычной в Монреале: список вакансий открыт ещё прежней сборкой (вакансии на английском) и
  // отклик на английскую вакансию; игра обновилась (перезагрузка страницы), «Языки» открыты раньше списка вакансий.
  {
    const { pg, ctx, errors, state } = await open(browser, { old: true, seed: 279125, country: 'ca' });
    const made = await pg.evaluate(M => {
      __live(M); __speaker({ fr: 6, en: 2 }, 'fr'); s.age = 24; s.skill = 60;
      const x = path16();
      x.view = { ...x.view, section: 'vacancies58', country: 'ca', field: 'service', format: 'near', page: 0 }; x.marketKey = null;
      openPath16('vacancies58');
      const out = { hint: langTop2733(), langs: [...new Set(x.vacancies.map(v => v.language))].join() };
      const v = x.vacancies[0];
      x.jobApplications.push({ id: 'job27912', vacancy: { ...v }, status: 'submitted', probability: .5, roll: .9, submitted: s.clock.ticks });
      out.app = v.language; out.hintApp = langTop2733().eyebrow;
      save(); if (typeof flushSave264 === 'function') flushSave264();
      return out;
    }, MONTREAL);
    state.old = BASE;
    await pg.reload();
    await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&typeof prog16==='function'");
    await helpers(pg);
    const r = await pg.evaluate(() => {
      const x = path16(), out = { city: residenceCity(), stored: [...new Set(x.vacancies.map(v => v.language))].join(), hint: langTop2733() };
      out.after = [...new Set(x.vacancies.map(v => v.language))].join();
      openPath16('languages');
      const t = document.querySelector('.trajectory')?.innerText || '';
      out.panel = t.slice(0, 400);
      x.view = { ...x.view, section: 'vacancies58' }; openPath16('vacancies58');
      out.list = [...new Set(x.vacancies.map(v => v.language))].join(); out.hint2 = langTop2733();
      out.app = x.jobApplications.map(a => [a.vacancy.language, jobEligibility16(a.vacancy).why.filter(w => /Английский/.test(w)).length]);
      return out;
    });
    note('279.1.1, франкоязычная в Монреале: «' + made.hint.eyebrow + ' · ' + made.hint.why + '», вакансии ' + made.langs + '; после обновления до списка вакансий: «' + r.hint.eyebrow + ' · ' + r.hint.why + '»');
    check('сохранение 279.1.1 франкоязычной в Монреале: в прежней сборке «Нужен для вакансий» (английский) — эталон', made.hint.eyebrow === 'Нужен для вакансий' && made.hint.l === 'en' && made.langs === 'en', made);
    check('после обновления «Языки» до списка вакансий: «Язык страны · Монреаль — французский и английский», не «Нужен для вакансий» и не «Нужен для работы»; вакансии — на французском', r.city === MONTREAL && r.hint && r.hint.eyebrow === 'Язык страны' && r.hint.why === 'Монреаль — французский и английский' && /Язык страны · Монреаль — французский и английский/i.test(r.panel) && !/Нужен для (вакансий|работы)/i.test(r.panel) && r.after === 'fr', r);
    check('после обновления: подсказка та же, что после открытия списка вакансий; отклику на английскую вакансию английский не нужен', JSON.stringify(r.hint) === JSON.stringify(r.hint2) && r.list === 'fr' && r.app.length === 1 && r.app[0][1] === 0, r);
    check('после обновления (вакансии): без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 5. Настоящее сохранение владелицы ----------
  if (OWNER && fs.existsSync(OWNER)) {
    const raw = fs.readFileSync(OWNER, 'utf8');
    const { pg, ctx, errors } = await open(browser, { raw });
    const r = await pg.evaluate(() => {
      const x = path16(), out = { pins: JSON.stringify(s.unisLang27911 || null), dip: x.diplomas.map(d => d.university), apps: x.applications.map(a => a.program + ':' + a.status + ':' + (prog16(a.program)?.language || '')) };
      openPath16('admission58'); out.cat = document.querySelectorAll('.uni2791').length;
      __month(12);
      out.nan = __nan(); out.dip2 = x.diplomas.map(d => d.university); out.apps2 = x.applications.map(a => a.program + ':' + (prog16(a.program)?.language || ''));
      return out;
    });
    check('сохранение владелицы: открывается, дипломы не переименованы, каталог есть', JSON.stringify(r.dip) === JSON.stringify(r.dip2) && r.cat > 0, r);
    check('сохранение владелицы: год без NaN и ошибок страницы', r.nan.length === 0 && errors.length === 0, [r.nan, errors.slice(0, 2)]);
    await ctx.close();
  } else note('OWNER_SAVE не задан — настоящее сохранение пропущено');

  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: файлы сборки 279.1.1)' : ''));
  process.exit(fail ? 1 : 0);
})();
