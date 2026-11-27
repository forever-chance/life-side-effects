// Проверки сборки 279.1 (unis2791.js, unis2791-data.js): 1304 вуза и колледжа во всех городах вместо 250 шаблонных.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2791_unis.js
// BASE=1 — прогон без unis2791-data.js и unis2791.js: видно, какие проверки ловят старое поведение.
// OWNER_SAVE=файл — ещё и настоящее сохранение (экспорт «Ваши персонажи»; берётся последний персонаж): старые вузы,
//   дипломы, заявки и учёба близких открываются и идут дальше.
// UNIS_RESEARCH=all.json — исследовательский файл (не в репозитории): ни одного настоящего названия в файлах игры.
// SHOTS=папка — снимки каталога на 390×844 (Ванкувер, Нью-Йорк).
// Что проверяется:
// • данные: в каждом городе игры есть заведение, в двух первых городах страны — все 12 направлений; Нью-Йорк и
//   Ванкувер; в файлах игры нет настоящих названий, ссылок и английских слов (кроме кодов направлений и видов);
// • старые id (cc-uN) и все 6025 прежних программ находятся по id с прежними названиями, но в выбор не попадают;
// • поступление и цена: числа конечные, по странам в том же диапазоне, что были (сводка печатается);
// • сохранение прежней сборки с заявкой, учёбой, дипломом, подготовкой к профессии и учёбой близкого — открывается,
//   учёба идёт в прежнем вузе до диплома, названия не меняются, страница без ошибок;
// • каталог на 390×844: фильтр направления, ступени и города, сначала свой город, карточка с видом, престижем,
//   платой, направлениями и программами; «берут иностранцев» — только иностранцу; окно программы — «О вузе»;
// • выбор учёбы близким, «Где учиться» и предметы учителя — только новые заведения, без ошибок.
// • 279.1.1: копии «· на французском» у двуязычных заведений Канады в счёт названий не входят (их проверяет
//   verify27911_quebec.js), английские копии Канады могут быть и у права (оба языка свои).
// • после рецензии: язык — свой с английским B1 учится на бакалавриате по всем направлениям двух первых городов, рядом
//   с программой на языке страны есть такая же «· на английском»; «берут иностранцев» — сведения, не запрет; плата
//   «символическая», а не «бесплатно»; «PhD» в счётчике; предметы учителя — по заведению на предмет; наследник прежнего
//   вуза едет к нему, как до сборки; в данных нет кальки «магистерство».
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', SHOTS = process.env.SHOTS || '';
const OWNER = process.env.OWNER_SAVE || '', RESEARCH = process.env.UNIS_RESEARCH || '';
const PHONE = { width: 390, height: 844 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 1200) : '')); };
const note = t => console.log('     ' + t);
const strip = html => html.replace(/<script src="unis2791(-data)?\.js[^"]*"><\/script>/g, '');

async function open(browser, { base = BASE, raw = null, seed = 2791, country = 'ca', age = '18', viewport = PHONE } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && base ? strip(INDEX) : fs.readFileSync(f);
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
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = []; s.clock.running = false; s.ui05.panel = 'center';
    window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
    window.__month = (n = 1) => { for (let i = 0; i < n; i++) { __close(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } __close(); advanceMonth(); } __close(); };
    window.__nan = () => { const bad = []; const walk = (o, p, d) => { if (d > 7 || !o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if (typeof v === 'number' && !Number.isFinite(v)) bad.push(p + '.' + k); else if (v && typeof v === 'object') walk(v, p + '.' + k, d + 1); } }; walk(s, 's', 0); return bad.slice(0, 5); };
  });
  return { pg, ctx, errors };
}

// Числа поступления и цены по странам: отбор программ, «типичный» шанс (оценки 70, подготовка 50, язык как нужно) и цена
// в месяц в валюте страны — по бакалавриату и по всем ступеням.
const NUMBERS = () => {
  const out = {};
  const med = a => { const b = a.slice().sort((x, y) => x - y); return b.length ? b[Math.floor(b.length / 2)] : null; };
  for (const c of Object.keys(countries)) {
    const ps = programs16.filter(p => p.country === c), bs = ps.filter(p => p.level === 'bachelor');
    const chance = p => Math.max(.05, Math.min(.95, .55 + 70 * .004 + 50 * .002 - p.selectivity * .006));
    out[c] = { n: ps.length, unis: new Set(ps.map(p => p.university)).size, selMin: Math.min(...ps.map(p => p.selectivity)), selMax: Math.max(...ps.map(p => p.selectivity)),
      chanceBa: med(bs.map(chance)), feeMin: Math.min(...ps.map(p => p.fee)), feeMax: Math.max(...ps.map(p => p.fee)), feeBa: med(bs.map(p => p.fee)),
      finite: ps.every(p => [p.fee, p.selectivity, p.months, p.hours, p.quality, p.employment, p.prestige].every(Number.isFinite) && p.fee >= 0 && p.months > 0) };
  }
  return out;
};

// Язык: свой (родной язык страны, английский B1 — потолок английского в обычной школе) и бакалавриат. По каждому городу
// страны — сколько направлений бакалавриата открыто из тех, которым там учат; в двух первых городах — какие закрыты и
// учат ли им там только заведения целиком на английском. Иностранец с английским B2 без языка страны — есть ли ему
// программы на английском (бакалавриат или магистратура).
const LANG_ACCESS = () => {
  const x = path16(), keep = { languages: x.languages, permits: x.permits, diplomas: x.diplomas, grades: s.school?.grades, age: s.age };
  const plain = p => !p.track45 && !p.subject26 && !p.occupation68;
  const out = { closed: [], allEnglish: [], foreignNone: [], share: {} };
  s.school = s.school || {}; s.school.grades = 75; s.age = 18; x.diplomas = [];
  try {
    for (const c of Object.keys(countries)) {
      const local = country16[c][0];
      if (local === 'en') continue;
      x.languages = { [local]: 6, en: 3.5 };
      x.permits = [{ country: c, basis: 'probe', work: true, study: true, expires: null }];
      const ps = programs16.filter(p => p.country === c && p.level === 'bachelor' && plain(p)), share = { open: 0, offered: 0 };
      cities[c].forEach((city, i) => {
        const here = ps.filter(p => p.city === city), offered = new Set(here.map(p => p.field)), open = new Set(here.filter(p => !admission16(p).why.length).map(p => p.field));
        share.offered += offered.size; share.open += open.size;
        if (i > 1) return;
        for (const f of offered) if (!open.has(f)) {
          const allEn = here.filter(p => p.field === f).every(p => uni16(p)?.english2791 === 3);
          (allEn ? out.allEnglish : out.closed).push(c + ':' + city + ' ' + f);
        }
      });
      out.share[c] = share;
      x.languages = { en: 4 }; x.permits = [];
      if (!programs16.some(p => p.country === c && ['bachelor', 'master'].includes(p.level) && plain(p) && p.language === 'en')) out.foreignNone.push(c);
    }
  } finally { x.languages = keep.languages; x.permits = keep.permits; x.diplomas = keep.diplomas; s.school.grades = keep.grades; s.age = keep.age; }
  return out;
};

(async () => {
  const browser = await chromium.launch();

  // ---------- 0. Файлы игры: нет настоящих названий и английских слов ----------
  {
    const dataPath = path.join(ROOT, 'unis2791-data.js'), codePath = path.join(ROOT, 'unis2791.js');
    const data = fs.existsSync(dataPath) ? fs.readFileSync(dataPath, 'utf8') : '', code = fs.existsSync(codePath) ? fs.readFileSync(codePath, 'utf8') : '';
    let parsed = null;
    try { parsed = JSON.parse(/const unis2791Data=(\{[\s\S]*\});\s*$/.exec(data)[1]); } catch (e) {}
    const rows = parsed ? Object.entries(parsed.countries).flatMap(([c, r]) => r.map(x => [c, ...x])) : [];
    const FIELDS = ['computing', 'engineering', 'medicine', 'care', 'business', 'law', 'education', 'science', 'arts', 'media', 'trade', 'service'];
    const english = rows.filter(r => [r[3], r[12]].some(t => /[A-Za-zÀ-ɏ]{2,}|(?<![0-9])[A-Za-zÀ-ɏ]/.test(t)) || String(r[6]).split(' ').some(f => !FIELDS.includes(f)));
    check('данные: 1304 заведения в 25 странах, у каждого id страна-nНОМЕР без повторов', rows.length === 1304 && Object.keys(parsed?.countries || {}).length === 25 && new Set(rows.map(r => r[0] + '-n' + r[1])).size === 1304, rows.length);
    check('данные: нет real_name, real_name_en, source и ссылок', !/real_name|real_name_en|"source"|https?:|www\./.test(data + code), (data + code).match(/real_name|source|https?:\/\/\S+/)?.[0] || '');
    check('данные: названия и строки программ — по-русски, без английских слов', parsed && english.length === 0, english.slice(0, 3).map(r => r[3] + ' | ' + r[12]).join(' || '));
    // испанское magisterio — «подготовка учителей»; «магистерство» прочтут как опечатку в «магистратура»
    check('данные: без кальки «магистерство»', parsed && !/магистерств/i.test(data), (data.match(/[^,"]*магистерств[^,"]*/i) || [''])[0]);
    check('данные: язык обучения 0–3 у каждого заведения', parsed && rows.every(r => [0, 1, 2, 3].includes(r[11])), rows.filter(r => ![0, 1, 2, 3].includes(r[11])).slice(0, 3).map(r => r[3]));
    if (RESEARCH && fs.existsSync(RESEARCH) && parsed) {
      const src = JSON.parse(fs.readFileSync(RESEARCH, 'utf8'));
      const real = src.flatMap(c => c.institutions.flatMap(u => [u.real_name, u.real_name_en])).filter(n => n && n.length >= 6);
      const hay = data + code, found = [...new Set(real.filter(n => hay.includes(n)))];
      check('данные: ни одного настоящего названия (' + real.length + ' из исследования) в unis2791-data.js и unis2791.js', found.length === 0, found.slice(0, 5).join(' | '));
    } else note('UNIS_RESEARCH не задан — сверка с настоящими названиями пропущена');
  }

  // ---------- 1. Прежняя сборка: эталон названий, программ и чисел; сохранение со старыми вузами ----------
  let ref = null, oldRaw = null;
  {
    const { pg, ctx, errors } = await open(browser, { base: true, country: 'ru', seed: 27911 });
    ref = await pg.evaluate(() => ({
      unis: universities16.map(u => [u.id, u.name, u.city, u.fields.join(' ')]),
      programs: programs16.map(p => [p.id, uni16(p).name, p.field, p.level, p.fee, p.selectivity, programName26(p)]),
      names: [...new Set(programs16.map(p => programName26(p)))].sort(),
    }));
    ref.numbers = await pg.evaluate(NUMBERS);
    ref.lang = await pg.evaluate(LANG_ACCESS);
    // Сохранение прежней сборки: заявка (подана), учёба (идёт), диплом, подготовка к профессии (предложение), учёба близкого.
    oldRaw = await pg.evaluate(() => {
      const x = path16(); s.cash = Math.max(s.cash, 5e6); x.languages.ru = 6; x.languages.en = 6;
      const here = programs16.filter(p => p.country === s.country && p.city === residenceCity());
      const pick = (lvl, f) => here.find(p => p.level === lvl && !p.track45 && !p.subject26 && !p.occupation68 && (!f || f(p)));
      const st = pick('bachelor'), ap = pick('bachelor', p => p.field !== st.field), dip = pick('certificate'), occ = programs16.find(p => p.country === s.country && p.occupation68 === 'nurse');
      x.applications.push({ id: 'app-old-1', program: ap.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
      s.clock.tasks.push({ id: 'process-old-1', kind: 'pathAdmission', label: 'Приемная комиссия · ' + uni16(ap).name, duration: 2, progress: 0, hours: 2, state: 'planned', application: 'app-old-1' });
      x.applications.push({ id: 'app-old-2', program: st.id, status: 'enrolled', probability: .8, roll: .1, submitted: s.clock.ticks - 3, scholarship: null });
      x.study = { id: 'study-old-1', application: 'app-old-2', program: st.id, progress: st.months - 2, payer: 'self', status: 'active', research: 0, grades: 80, badTerms: 0 };
      x.applications.push({ id: 'app-old-3', program: occ.id, status: 'offered', probability: .7, roll: .1, submitted: s.clock.ticks - 2, expires: s.clock.ticks + 18, scholarship: null });
      x.diplomas.push({ id: 'diploma-old-1', field: dip.field, level: dip.level, subject26: null, track45: null, program46: dip.id, profileSchema46: 1, title: levels16[dip.level] + ' · ' + programName26(dip), university: uni16(dip).name, country: dip.country, year: s.year - 1, grade: 75, quality: dip.quality, employment: dip.employment });
      x.educationHistory.push({ id: 'study-old-0', program: dip.id, progress: dip.months, status: 'completed', ended: s.clock.ticks - 6, grades: 75 });
      // родня с биографией family27 (familyState27 заводит bio27): учёба близкого в прежнем вузе
      const rel = s.people.find(p => p.alive && p.age >= 18 && p.age < 60 && typeof kin27 === 'function' && kin27(p));
      let relStudy = null;
      if (rel && typeof familyState27 === 'function' && (familyState27(), rel.bio27)) { const b = rel.bio27; b.education ??= []; const pr = programs16.find(q => q.country === rel.country && q.level === 'bachelor' && !q.occupation68); b.study = { program: pr.id, progress: 3 }; b.education.push({ program: pr.id, field: pr.field, level: pr.level, year: s.year - 2 }); relStudy = { id: rel.id, program: pr.id, uni: uni16(pr).name }; }
      window.__old = { study: [st.id, uni16(st).name, st.months], apply: [ap.id, uni16(ap).name], occ: [occ.id, uni16(occ).name, programName26(occ)], dip: [dip.id, uni16(dip).name], rel: relStudy };
      save(); if (typeof flushSave264 === 'function') flushSave264();
      return JSON.stringify({ format: 'life-side-effects', version: 1, exportedAt: new Date().toISOString(), lives: [JSON.parse(JSON.stringify(s))] });
    });
    ref.old = await pg.evaluate(() => window.__old);
    check('прежняя сборка: эталон снят без ошибок страницы', errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  note('прежняя сборка: ' + ref.unis.length + ' вузов, ' + ref.programs.length + ' программ, ' + ref.names.length + ' названий программ');

  // ---------- 2. Новые заведения: города, направления, Нью-Йорк и Ванкувер ----------
  {
    const { pg, ctx, errors } = await open(browser, { country: 'ca' });
    const r = await pg.evaluate(() => {
      const fresh = universities16.filter(u => !u.retired2791 && !/-u\d+$/.test(u.id));
      const missing = [], short = [];
      for (const c of Object.keys(countries)) {
        for (const city of cities[c]) if (!fresh.some(u => u.country === c && u.city === city)) missing.push(c + ':' + city);
        for (const city of cities[c].slice(0, 2)) { const f = new Set(fresh.filter(u => u.country === c && u.city === city).flatMap(u => u.fields)); if (f.size < 12) short.push(c + ':' + city + ' ' + f.size); }
      }
      const city = (c, n) => fresh.filter(u => u.country === c && u.city === n);
      const ny = city('us', 'Нью-Йорк'), van = city('ca', 'Ванкувер');
      const progs = (us, test) => programs16.filter(p => us.some(u => u.id === p.university) && test(p));
      return { fresh: fresh.length, countries: new Set(fresh.map(u => u.country)).size, missing, short, cities: Object.values(cities).flat().length,
        ny: ny.map(u => u.name), nyFields: new Set(ny.flatMap(u => u.fields)).size, van: van.map(u => u.name), vanFields: new Set(van.flatMap(u => u.fields)).size,
        vanMed: progs(van, p => p.field === 'medicine' && p.level === 'bachelor').map(p => uni16(p).name),
        vanFilm: progs(van, p => p.track45 === 'cinema').map(p => uni16(p).name),
        nyLaw: progs(ny, p => p.field === 'law' && p.level === 'master').map(p => uni16(p).name),
        nyTrade: progs(ny, p => p.field === 'trade' && p.level === 'vocational').map(p => uni16(p).name),
        // 279.1.1: копии на втором языке (английском или французском) — те же программы с языком в названии
        names: [...new Set(programs16.filter(p => !p.english2791 && !p.copy27911).map(p => programName26(p)))].sort(),
        enBad: programs16.filter(p => p.english2791).filter(p => { const b = prog16(p.id.replace(/-en$/, '')); return !b || b.language === 'en' || p.language !== 'en' || p.field === 'law' && !p.copy27911 || programName26(p) !== programName26(b) + ' · на английском'; }).map(p => p.id).slice(0, 5),
        enCount: programs16.filter(p => p.english2791).length,
        stale: programs16.filter(p => uni16(p)?.retired2791).length, inChoice: programs16.filter(p => /^[a-z]{2}-u\d+-/.test(p.id) || /^profession68-[a-z]{2}-[a-z0-9]+$/.test(p.id)).length };
    });
    check('новые заведения: ' + r.fresh + ' в ' + r.countries + ' странах', r.fresh === 1304 && r.countries === 25, r.fresh);
    check('в каждом из ' + r.cities + ' городов игры есть заведение', r.cities === 180 && r.missing.length === 0, r.missing.slice(0, 8));
    check('в двух первых городах каждой страны — все 12 направлений', r.short.length === 0, r.short.slice(0, 8));
    check('Нью-Йорк: ' + r.ny.length + ' заведений, ' + r.nyFields + ' направлений, право в магистратуре и рабочие профессии', r.ny.length >= 10 && r.nyFields === 12 && r.nyLaw.length > 0 && r.nyTrade.length > 0, r);
    check('Ванкувер: ' + r.van.length + ' заведений, все 12 направлений, медицина и кино', r.van.length >= 6 && r.vanFields === 12 && r.vanMed.length > 0 && r.vanFilm.includes('Киношкола Йейлтаун · Ванкувер'), { van: r.van, med: r.vanMed, film: r.vanFilm });
    check('программы: те же ' + ref.names.length + ' названий, что были', JSON.stringify(r.names) === JSON.stringify(ref.names), r.names.filter(n => !ref.names.includes(n)).concat(ref.names.filter(n => !r.names.includes(n))));
    check('программы на английском (' + r.enCount + '): рядом с такой же на языке страны, «… · на английском», без права', r.enCount > 0 && r.enBad.length === 0, r.enBad);
    check('прежние вузы в выбор не попадают: в programs16 нет их программ', r.stale === 0 && r.inChoice === 0, [r.stale, r.inChoice]);
    note('Нью-Йорк: ' + r.ny.join(', '));
    note('Ванкувер: ' + r.van.join(', '));

    // старые id → прежние названия; все прежние программы находятся
    const o = await pg.evaluate(ref => {
      const badU = ref.unis.filter(([id, name]) => uni16({ university: id })?.name !== name).map(x => x[0]);
      const badP = ref.programs.filter(([id, uni, field, level, fee, sel, label]) => { const p = prog16(id); return !p || uni16(p).name !== uni || p.field !== field || p.level !== level || p.fee !== fee || p.selectivity !== sel || programName26(p) !== label; }).map(x => x[0]);
      return { badU, badP };
    }, { unis: ref.unis, programs: ref.programs });
    check('250 прежних вузов находятся по id с прежними названиями', o.badU.length === 0, o.badU.slice(0, 5));
    check('все ' + ref.programs.length + ' прежних программ находятся по id: вуз, направление, ступень, цена, отбор, название', o.badP.length === 0, o.badP.slice(0, 5));

    // поступление и цена по странам
    const nums = await pg.evaluate(NUMBERS);
    const off = [];
    for (const [c, b] of Object.entries(ref.numbers)) {
      const n = nums[c];
      // Цена по данным: бесплатные государственные вузы дешевле прежнего шаблона, частные — дороже; граница — в 10 раз
      // дешевле или в 4 раза дороже по медиане и не дороже 2,5 прежних максимумов. Шанс — в пределах 15 п. п.
      if (!n || !n.finite || n.feeMin <= 0 || n.selMin < 15 || n.selMax > 97 || n.feeBa > b.feeBa * 4 || n.feeBa < b.feeBa * .1 || n.feeMax > b.feeMax * 2.5 || Math.abs(n.chanceBa - b.chanceBa) > .15) off.push(c);
    }
    check('поступление и цена: числа конечные, по странам в прежнем диапазоне', off.length === 0, off.map(c => c + ' ' + JSON.stringify({ base: ref.numbers[c], now: nums[c] })).slice(0, 3));
    note('страна: заведений было→стало · типичный шанс на бакалавриат было→стало · цена бакалавриата в месяц (медиана) было→стало · цена от–до стало');
    for (const c of Object.keys(nums)) { const b = ref.numbers[c], n = nums[c]; note(c + ': ' + b.unis + '→' + n.unis + ' · ' + Math.round(b.chanceBa * 100) + '→' + Math.round(n.chanceBa * 100) + '% · ' + b.feeBa + '→' + n.feeBa + ' · ' + n.feeMin + '–' + n.feeMax); }

    // Язык: свой (родной язык страны, английский B1 — потолок английского в обычной школе) поступает на бакалавриат по
    // каждому направлению, которому в этом городе учат на бакалавриате; иностранец с английским B2 и без языка страны
    // находит программы на английском (бакалавриат или магистратура) в каждой стране.
    const lang = await pg.evaluate(LANG_ACCESS);
    const worse = Object.keys(lang.share).filter(c => ref.lang.share[c] && lang.share[c].open / lang.share[c].offered < ref.lang.share[c].open / ref.lang.share[c].offered - 1e-9);
    // Закрыто может быть только там, где этому направлению в городе учат лишь заведения целиком на английском (как прежние
    // международные вузы): так в источнике, например, у сервиса в Мумбаи.
    check('язык: свой с английским B1 поступает на бакалавриат по всем направлениям двух первых городов страны (кроме тех, где учат только на английском)', lang.closed.length === 0, lang.closed.slice(0, 8));
    if (lang.allEnglish.length) note('только на английском (в источнике так): ' + lang.allEnglish.join('; '));
    check('язык: доля «город × направление» бакалавриата, открытая своему с английским B1, не меньше прежней ни в одной стране', worse.length === 0, worse.map(c => c + ' ' + JSON.stringify([ref.lang.share[c], lang.share[c]])));
    check('язык: в каждой стране есть программы на английском для иностранцев', lang.foreignNone.length === 0, lang.foreignNone);
    note('открыто своему с английским B1 «город × направление» бакалавриата, было → стало: ' + Object.keys(lang.share).map(c => c + ' ' + (ref.lang.share[c] ? ref.lang.share[c].open + '/' + ref.lang.share[c].offered : '—') + '→' + lang.share[c].open + '/' + lang.share[c].offered).join(' · '));
    const gate = await pg.evaluate(() => {
      const x = path16(), keep = x.languages; x.languages = { en: 6, pt: 6 };
      try {
        const u = universities16.find(u => u.country === 'br' && u.kind2791 && !u.foreigners2791), p = u && programs16.find(q => q.university === u.id && q.level === 'bachelor');
        const words = typeof priceWord2791 === 'function' ? [...new Set(universities16.filter(u => u.kind2791).map(priceWord2791))] : [];
        return { perm: permission16('br', 'study'), why: p ? admission16(p).why : ['нет заведения'], words };
      } finally { x.languages = keep; }
    });
    check('«иностранцев мало» — не запрет: иностранец без права учиться подаёт заявку, как раньше', !gate.perm && !gate.why.some(w => /иностран/i.test(w)), gate.why);
    check('плата словом не спорит с ценой: «символическая», а не «бесплатно»', gate.words.length > 0 && !gate.words.some(w => /бесплат/.test(w)) && gate.words.includes('символическая'), gate.words);
    check('новые заведения: без ошибок страницы', errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 3. Каталог на телефоне ----------
  {
    const { pg, ctx, errors } = await open(browser, { country: 'ca', seed: 27912 });
    // Живём в Ванкувере: переезд записью (город проживания), язык — свободный английский.
    const look = async (setup) => {
      await pg.evaluate(setup);
      await pg.evaluate(() => { __close(); s.ui05.panel = 'center'; openPath16('admission58'); });
      await pg.waitForTimeout(60);
      return pg.evaluate(() => {
        const t = document.querySelector('[data-panel="center"] .trajectory') || document.querySelector('.trajectory'), h1 = t?.querySelector('h1');
        const panel = document.querySelector('[data-panel="center"]');
        if (panel) panel.scrollTop = 0; scrollTo(0, 0);
        if (h1) { const top = h1.getBoundingClientRect().top; if (panel && panel.scrollHeight > panel.clientHeight) panel.scrollTop += top - 8; else scrollBy(0, top - 8); }
        const sel = [...t.querySelectorAll('select')].map(x => x.getAttribute('aria-label'));
        const cards = [...t.querySelectorAll('.uni2791')], first = cards[0], r = first?.getBoundingClientRect(), btn = first?.querySelector('.chip2791')?.getBoundingClientRect();
        const heads = [...t.querySelectorAll('.uni-city2791')].map(h => h.textContent);
        return { sel, cards: cards.map(c => ({ name: c.querySelector('h3').textContent, text: c.innerText })), heads, count: t.querySelector('.uni-count2791')?.textContent || '',
          firstTop: r ? Math.round(r.top) : null, chipBottom: btn ? Math.round(btn.bottom) : null, h: innerHeight, wide: document.scrollingElement.scrollWidth <= innerWidth + 1,
          mainRow: (() => { const m = t.querySelector('.filters-main2791'); return m ? [...m.querySelectorAll('select')].map(x => x.getAttribute('aria-label')) : []; })(), text: t.innerText };
      });
    };
    const van = await look(() => { const x = path16(); s.housing.city = 'Ванкувер'; if (s.housing.home) s.housing.home.city = 'Ванкувер'; x.languages.en = 6; x.view = { ...x.view, section: 'admission58', country: 'ca', field: 'arts', level: 'bachelor', page: 0, city2791: '' }; });
    const home = await pg.evaluate(() => residenceCity());
    check('каталог 390×844: фильтры «Направление», «Ступень», «Город» в одной строке', ['Направление', 'Ступень', 'Город'].every(k => van.mainRow.includes(k)), van.mainRow);
    check('каталог 390×844: первая карточка и её первая программа — на первом экране', van.firstTop !== null && van.chipBottom !== null && van.chipBottom <= van.h, van);
    check('каталог: без прокрутки вбок', van.wide);
    if (home === 'Ванкувер') check('каталог: сначала ваш город (Ванкувер), потом другие города', van.heads[0]?.startsWith('Ванкувер') && van.cards.length > 0 && /Ванкувер$/.test(van.cards[0].name), van.heads);
    else note('город проживания не Ванкувер (' + home + ') — порядок «сначала свой город» проверен ниже');
    const card = van.cards[0]?.text || '';
    check('карточка заведения: вид по-русски, престиж звёздами, плата, направления, программы', /(Государственн|Частн)/.test(card) && /★/.test(card) && /плата /.test(card) && /Направления: /.test(card) && /Здесь учат: /.test(card), card);
    check('карточка заведения: без латиницы', !/[A-Za-z]{2,}/.test(van.cards.map(c => c.text).join(' ')), van.cards.map(c => c.text).join(' ').match(/[A-Za-z]{2,}/)?.[0]);
    check('карточка заведения: гражданину «берут иностранцев» не пишется', !/иностранц/.test(van.text));
    // порядок внутри группы: престиж, потом название
    const order = await pg.evaluate(() => { if (typeof catalogGroups2791 !== 'function') return [[1]]; const g = catalogGroups2791(); const home = residenceCity(); return g.map(x => [x.u.city === home ? 0 : 1, -x.u.stars2791, x.u.name]); });
    const sorted = order.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2].localeCompare(b[2], 'ru'));
    check('каталог: сначала свой город, внутри — по престижу, потом по названию', JSON.stringify(order) === JSON.stringify(sorted), order.slice(0, 6));
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await pg.screenshot({ path: path.join(SHOTS, 'catalog-vancouver-390.png') }); }
    // фильтр города
    const only = await look(() => { const x = path16(); x.view = { ...x.view, country: 'ca', field: 'medicine', level: 'bachelor', page: 0, city2791: 'Торонто' }; });
    check('фильтр «Город»: только заведения Торонто', only.cards.length > 0 && only.cards.every(c => / · Торонто$|Торонто/.test(c.name)) && only.heads.length === 0, only.cards.map(c => c.name));
    // Нью-Йорк: иностранцу из Канады — «берут иностранцев» и причина у тех, кто не берёт
    const ny = await look(() => { const x = path16(); x.view = { ...x.view, country: 'us', field: 'trade', level: 'vocational', page: 0, city2791: 'Нью-Йорк' }; });
    const foreign = await pg.evaluate(() => {
      const us = universities16.filter(u => u.country === 'us' && u.kind2791), yes = us.find(u => u.foreigners2791), no = us.find(u => !u.foreigners2791);
      const p = no && programs16.find(q => q.university === no.id);
      const note = u => typeof foreignNote2791 === 'function' && u ? foreignNote2791(u) : null;
      return { perm: permission16('us', 'study'), yes: note(yes), no: note(no), why: p ? admission16(p).why : [] };
    });
    check('Нью-Йорк, вид из Канады: ' + ny.cards.length + ' заведений с рабочими профессиями', ny.cards.length >= 1, ny.count);
    check('иностранцу: «берут иностранцев» или «иностранцев мало» на карточке, без запрета в «Не хватает»', !foreign.perm && foreign.yes === 'берут иностранцев' && foreign.no === 'иностранцев мало' && !foreign.why.some(w => /иностран/i.test(w)), foreign);
    // счётчик: «PhD» латиницей как в фильтре, не «phd»
    const phd = await look(() => { const x = path16(); x.view = { ...x.view, country: 'ca', field: 'law', level: 'phd', page: 0, city2791: '' }; });
    check('счётчик каталога: ступень «PhD», как в фильтре', /· PhD/.test(phd.count) && !/phd/.test(phd.count), phd.count);
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, 'catalog-newyork-390.png') });
    // окно программы: «О вузе» с видом и престижем
    const win = await pg.evaluate(() => {
      __close(); const p = programs16.find(q => q.country === 'ca' && q.city === 'Ванкувер' && q.field === 'medicine' && q.level === 'bachelor');
      programDetails16(p.id);
      const m = $('#modal'), text = m.open ? m.innerText : '';
      const det = [...m.querySelectorAll('details')]; det.forEach(d => d.open = true);
      return { open: m.open, title: m.querySelector('h2')?.textContent || '', text: m.innerText, name: uni16(p).name };
    });
    check('окно программы: «О вузе» — вид, престиж, направления', win.open && /О вузе/.test(win.text) && /исследовательский университет, престиж \d из 5/i.test(win.text) && /Направления: /.test(win.text), win.text.slice(0, 600));
    // окно программы прежнего вуза открывается (название прежнее)
    const oldWin = await pg.evaluate(() => { __close(); programDetails16('ca-u3-medicine-bachelor'); const m = $('#modal'); const t = m.open ? m.innerText : ''; __close(); return { t, name: uni16(prog16('ca-u3-medicine-bachelor')).name }; });
    check('окно программы прежнего вуза открывается с прежним названием', oldWin.t.includes(oldWin.name.split(' · ')[0]) || oldWin.t.includes('Медицин'), oldWin.t.slice(0, 300));
    // «Где учиться» на профессию и предметы учителя — новые заведения, свой город первым, подписи без повторов
    const menus = await pg.evaluate(() => {
      __close(); const out = {};
      const tp = trainingPrograms68('nurse', 'ca'); out.training = tp.slice(0, 4).map(p => uni16(p).name); out.trainingOld = tp.filter(p => uni16(p).retired2791).length; out.trainingDup = tp.length - new Set(tp.map(p => p.university)).size;
      trainingMenu68('hair', 'ca'); out.hair = [...document.querySelectorAll('#modal button')].map(b => b.textContent.trim()).filter(Boolean).slice(0, 14); __close();
      path16().view.country = 'ca'; teachingMenu26(); const labels = [...document.querySelectorAll('#modal .options button, #modal button')].map(b => b.textContent.trim()).filter(t => / · /.test(t));
      out.teach = labels; out.teachDup = labels.length - new Set(labels).size; out.subjects = Object.keys(teachingSubjects26).length;
      out.teachSubj = new Set(labels.map(l => l.split(' · ')[0])).size; out.teachH = $('#modal').scrollHeight; __close();
      return out;
    });
    check('«Где учиться»: новые заведения, по одному на заведение', menus.training.length > 0 && menus.trainingOld === 0 && menus.trainingDup === 0, menus);
    check('«Где учиться · Парикмахер»: «Парикмахерское искусство» в колледжах', menus.hair.some(t => /Парикмахерское искусство/.test(t)), menus.hair);
    check('предметы учителя: заведение на кнопке, по одному на предмет (' + menus.teach.length + ' кнопок, высота ' + menus.teachH + ')', menus.teach.length > 0 && menus.teach.length <= menus.subjects && menus.teachSubj === menus.teach.length && menus.teachDup === 0, menus.teach.slice(0, 6));
    check('каталог и окна: без ошибок страницы', errors.length === 0, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 4. Сохранение прежней сборки: учёба в прежнем вузе идёт до диплома ----------
  {
    const { pg, ctx, errors } = await open(browser, { raw: oldRaw });
    const r = await pg.evaluate(old => {
      const x = path16(), out = {};
      const name = id => { const p = prog16(id); return p ? uni16(p).name : null; };
      out.names = { study: name(old.study[0]), apply: name(old.apply[0]), occ: name(old.occ[0]), dip: name(old.dip[0]), occLabel: prog16(old.occ[0]) ? programName26(prog16(old.occ[0])) : null };
      openPath16('education'); out.edu = document.querySelector('.trajectory')?.innerText || '';
      if (typeof openRequests58 === 'function') openRequests58('study'); else openPath16('applications'); out.req = document.querySelector('.trajectory')?.innerText || '';
      out.dossier = typeof dossierOccupation87 === 'function' ? dossierOccupation87() : '';
      try { openDecision24('study', 'app-old-3'); out.offer = $('#modal').open ? $('#modal').innerText : ''; } catch (e) { out.offer = 'ERR ' + e.message; }
      __close();
      out.before = x.study.progress;
      return out;
    }, ref.old);
    check('старое сохранение: учёба, заявка, подготовка к профессии и диплом — прежние вузы', r.names.study === ref.old.study[1] && r.names.apply === ref.old.apply[1] && r.names.occ === ref.old.occ[1] && r.names.dip === ref.old.dip[1] && r.names.occLabel === ref.old.occ[2], { now: r.names, was: ref.old });
    check('старое сохранение: «Моя учёба» и «Заявки» показывают прежние названия', r.edu.includes(ref.old.study[1].split(' · ')[0]) && r.req.includes(ref.old.apply[1].split(' · ')[0]), r.edu.slice(0, 400));
    check('старое сохранение: в досье — программа учёбы', /Учёба · /.test(r.dossier), r.dossier);
    check('старое сохранение: предложение прежнего вуза открывается', /Подготовка по профессии|Медсестр|Уход/.test(r.offer) || r.offer.includes(ref.old.occ[1].split(' · ')[0]), r.offer.slice(0, 300));
    const after = await pg.evaluate(old => {
      __month(6);
      const x = path16(), d = x.diplomas.find(d => d.program46 === old.study[0]), a = x.applications.find(a => a.id === 'app-old-1');
      const rel = old.rel && s.people.find(p => p.id === old.rel.id);
      return { study: x.study?.program || null, diploma: d ? { title: d.title, uni: d.university } : null, apply: a?.status, old: x.diplomas.find(d => d.id === 'diploma-old-1')?.university,
        rel: rel ? { study: rel.bio27?.study?.program || null, edu: (rel.bio27?.education || []).map(e => e.program), found: [rel.bio27?.study?.program, ...(rel.bio27?.education || []).map(e => e.program)].filter(Boolean).every(id => !!prog16(id)), uni: prog16(old.rel.program) ? uni16(prog16(old.rel.program)).name : null } : null, nan: __nan() };
    }, ref.old);
    check('старое сохранение: учёба в прежнем вузе закончилась дипломом с его названием', after.diploma && after.diploma.uni === ref.old.study[1], after);
    check('старое сохранение: поданная заявка в прежний вуз получила ответ', ['offered', 'rejected'].includes(after.apply), after.apply);
    check('старое сохранение: прежний диплом не переименован', after.old === ref.old.dip[1], after.old);
    if (ref.old.rel) check('старое сохранение: учёба близкого в прежнем вузе — без ошибок, программа находится', after.rel && after.rel.found && after.rel.edu.includes(ref.old.rel.program) && after.rel.uni === ref.old.rel.uni, after.rel);
    check('старое сохранение: без NaN и ошибок страницы', after.nan.length === 0 && errors.length === 0, [after.nan, errors.slice(0, 2)]);
    await ctx.close();
  }

  // ---------- 4б. Наследник прежнего вуза: как до сборки — переезд к своему вузу, пройденное засчитано полностью ----------
  if (ref.old.rel) {
    const { pg, ctx, errors } = await open(browser, { raw: oldRaw });
    const r = await pg.evaluate(old => {
      const x = path16(), p = prog16(old.rel.program), pool = typeof retiredPrograms2791 !== 'undefined' ? retiredPrograms2791 : programs16;
      const away = cities[p.country].find(c => c !== p.city && !pool.some(q => q.city === c && q.field === p.field && q.level === p.level));
      if (!away || p.country !== s.country) return { skip: true };
      x.study = null; x.applications = x.applications.filter(a => a.status !== 'enrolled'); s.job = null; s.housing.city = away; s.housing.mode = 'rent';
      const ok = startContinueStudy274({ program: p.id, progress: 10 }, true);
      return { ok, away, city: residenceCity(), want: p.city, program: x.study?.program, progress: x.study?.progress, uni: x.study && uni16(prog16(x.study.program)).name, wantUni: uni16(p).name };
    }, ref.old);
    if (r.skip) note('наследник: нет города без такой же прежней программы — проверка пропущена');
    else check('наследник прежнего вуза (из города ' + r.away + '): переезд к своему вузу, пройдено 10 из 10', r.ok && r.city === r.want && r.program === ref.old.rel.program && r.progress === 10 && r.uni === r.wantUni && errors.length === 0, r);
    await ctx.close();
  }

  // ---------- 5. Новая жизнь: близкие и дети учатся в новых заведениях ----------
  {
    const { pg, ctx, errors } = await open(browser, { country: 'in', age: '30', seed: 27913 });
    const r = await pg.evaluate(() => {
      const picked = [], real = Math.random;
      // Взрослые близкие сами решают учиться (autonomy55): план учёбы — из programs16 страны.
      for (const p of s.people.filter(p => p.alive && p.age >= 18 && p.age < 60)) {
        try { if (typeof adultEligible55 !== 'function' || !adultEligible55(p)) continue; const a = adultState55(p); a.plan = null; a.nextReview = 0; p.privateCash = 1e12; if (p.bio27) p.bio27.study = null; startAdultPlan55(p, 'study'); if (a.plan?.program) picked.push(a.plan.program); } catch (e) {}
      }
      // Родня в семейном древе (family27): без работы и с желанием учиться — поступает на бакалавриат.
      try {
        const f = familyState27(); Math.random = () => .99;
        for (const p of s.people.filter(p => p.alive && p.bio27 && p.age >= 18 && p.age < 60)) { const b = p.bio27; b.job = null; b.study = null; b.education = []; b.educationWish = 1; p.privateCash = 1e12; }
        f.last = -1; familyMonth27();
      } catch (e) {} finally { Math.random = real; }
      for (const p of s.people) { const st = p.bio27?.study; if (st?.program) picked.push(st.program); }
      __month(12);
      return { picked: [...new Set(picked)], old: picked.filter(id => uni16(prog16(id) || { university: '' })?.retired2791), missing: picked.filter(id => !prog16(id)), nan: __nan() };
    });
    check('близкие выбирают учёбу в новых заведениях (выборов: ' + r.picked.length + ')', r.picked.length > 0 && r.old.length === 0 && r.missing.length === 0, r);
    check('близкие и дети: без NaN и ошибок страницы', r.nan.length === 0 && errors.length === 0, [r.nan, errors.slice(0, 2)]);
    await ctx.close();
  }

  // ---------- 6. Настоящее сохранение владелицы ----------
  if (OWNER && fs.existsSync(OWNER)) {
    const raw = fs.readFileSync(OWNER, 'utf8');
    const { pg, ctx, errors } = await open(browser, { raw });
    const r = await pg.evaluate(() => {
      const x = path16(), ids = [...x.applications.map(a => a.program), ...x.educationHistory.map(h => h.program), ...x.diplomas.map(d => d.program46).filter(Boolean)];
      const people = s.people.flatMap(p => [p.bio27?.study?.program, ...(p.bio27?.education || []).map(e => e.program), p.agency55?.plan?.program].filter(Boolean));
      const out = { missing: [...ids, ...people].filter(id => !prog16(id)), dip: x.diplomas.map(d => d.university) };
      openPath16('education'); out.edu = document.querySelector('.trajectory')?.innerText || '';
      openPath16('admission58'); out.cat = document.querySelectorAll('.uni2791').length;
      __month(12);
      out.nan = __nan(); out.dip2 = x.diplomas.map(d => d.university);
      return out;
    });
    check('сохранение владелицы: все программы из заявок, истории, дипломов и учёбы близких находятся', r.missing.length === 0, r.missing.slice(0, 5));
    check('сохранение владелицы: дипломы не переименованы, каталог открывается', JSON.stringify(r.dip) === JSON.stringify(r.dip2) && r.cat > 0, r);
    check('сохранение владелицы: год без NaN и ошибок страницы', r.nan.length === 0 && errors.length === 0, [r.nan, errors.slice(0, 2)]);
    await ctx.close();
  } else note('OWNER_SAVE не задан — настоящее сохранение пропущено');

  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без unis2791-data.js и unis2791.js)' : ''));
  process.exit(fail ? 1 : 0);
})();
