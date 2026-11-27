// Проверки сборки 279.1.1 (unis2791.js, unis2791-data.js): французские заведения Канады учат по-французски.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify27911_quebec.js
// BASE=1 — вместо нынешних unis2791.js и unis2791-data.js файлы сборки 279.1 (git show REF279:…, по умолчанию 3b05201):
//   видно, какие проверки ловят прежнее поведение.
// OWNER_SAVE=файл — ещё и настоящее сохранение (экспорт «Ваши персонажи»; берётся последний персонаж).
// UNIS_RESEARCH=all.json — исследовательский файл (не в репозитории): ни одного настоящего названия в файлах игры.
// Что проверяется:
// • данные: меняется только язык канадских заведений (новое поле в конце строки), Монреаль и Квебек — как в источнике;
// • id: все программы 279.1 на месте с тем же вузом, направлением, ступенью, ценой, отбором, сроком и названием; язык
//   сменился только у французских заведений Канады; новые id — только копии «-en»/«-fr» у двуязычных;
// • франкоязычная 18 лет в Монреале и в Квебеке поступает на французские программы (шанс больше нуля), на карточке —
//   «· на французском», в «О вузе» — «Учат на французском»;
// • англоязычный со слабым французским в Монреале: английские заведения и английские копии открыты;
// • сохранение 279.1 с учёбой, предложением и заявкой в Монреале и Квебеке: язык прежний (английский), названия прежние,
//   предложение принимается, учёба идёт до диплома; новая заявка — уже на французском;
// • подготовка к профессии, одна на страну, у французского или двуязычного заведения — и на английском;
// • обычное открытие игры после обновления (персонаж 279.1 восстановлен при загрузке страницы): предложение и заявки —
//   на английском, учёба начинается; заявке отказали — та же программа уже по-французски, и после чтения сохранения тоже;
// • новая жизнь — пустой список прежних языков; сохранение владелицы — без ошибок.
const fs = require('fs'), path = require('path'), { execSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const BASE = process.env.BASE === '1', REF = process.env.REF279 || '3b05201';
const OWNER = process.env.OWNER_SAVE || '', RESEARCH = process.env.UNIS_RESEARCH || '';
const PHONE = { width: 390, height: 844 };
let pass = 0, fail = 0;
const check = (label, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra !== '' && !ok ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 1200) : '')); };
const note = t => console.log('     ' + t);
const git = f => { try { return execSync('git -C ' + JSON.stringify(ROOT) + ' show ' + REF + ':' + f, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { return null; } };
const OLD = { 'unis2791.js': git('unis2791.js'), 'unis2791-data.js': git('unis2791-data.js') };
const parseData = text => { try { return JSON.parse(/const unis2791Data=(\{[\s\S]*\});\s*$/.exec(text)[1]); } catch (e) { return null; } };
const MONTREAL = 'Монреаль', QUEBEC = 'Квебек';
// Как в источнике (поле «languages»): '' — английский (язык страны), 'fr' — французский, 'fr+en' — французский и часть на английском.
const EXPECT = {
  'Университет Фробишер · Монреаль': '', 'Университет Атуотер · Монреаль': '', 'Колледж Вестмаунт · Монреаль': '',
  'Университет Виль-Мари · Монреаль': 'fr', 'Политехническая школа Жак-Картье · Монреаль': 'fr', 'Университет Латинского квартала · Монреаль': 'fr',
  'Высшая техническая школа Гриффинтаун · Монреаль': 'fr', 'Институт туризма и гостеприимства Сен-Луи · Монреаль': 'fr',
  'Высшая коммерческая школа Сен-Жак · Монреаль': 'fr+en', 'Школа строительных ремёсел Лашин · Монреаль': 'fr+en', 'Высшая театральная школа Плато · Монреаль': 'fr+en',
  'Университет Сен-Валье · Квебек': 'fr', 'Дистанционный университет Шодьер · Квебек': 'fr', 'Колледж Сен-Рок · Квебек': 'fr',
  'Школа гостиничного дела Вьё-Кебек · Квебек': 'fr', 'Школа строительных ремёсел Шарлсбур · Квебек': 'fr', 'Консерватория Гранд-Алле · Квебек': 'fr'
};

// state.old — какие файлы вузов раздавать; можно сменить до pg.reload() (обновление игры при открытом персонаже).
async function open(browser, { old = false, raw = null, seed = 27911, country = 'ca', age = '18' } = {}) {
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
// Окна при старте закрыть и помощники (после pg.reload() — заново).
async function helpers(pg) {
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = []; s.clock.running = false; s.ui05.panel = 'center';
    window.__close = () => { if ($('#modal').open) closeModal(); s.pending = []; };
    window.__month = (n = 1) => { for (let i = 0; i < n; i++) { __close(); if (s.clock.yearDue && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} } __close(); advanceMonth(); } __close(); };
    window.__nan = () => { const bad = []; const walk = (o, p, d) => { if (d > 7 || !o || typeof o !== 'object') return; for (const [k, v] of Object.entries(o)) { if (typeof v === 'number' && !Number.isFinite(v)) bad.push(p + '.' + k); else if (v && typeof v === 'object') walk(v, p + '.' + k, d + 1); } }; walk(s, 's', 0); return bad.slice(0, 5); };
    // Жить в городе: город проживания — запись housing (переезд без окон).
    window.__live = city => { s.housing.city = city; if (s.housing.home) s.housing.home.city = city; s.housing.mode = 'rent'; s.housing.active = true; };
    window.__speaker = (langs, native) => { const x = path16(); x.languages = { ...langs }; x.native = [native]; s.age = 18; s.school = s.school || {}; s.school.grades = 75; x.diplomas = []; x.applications = []; x.retry = {}; };
    window.__plain = p => !p.track45 && !p.subject26 && !p.occupation68;
  });
}

// Каталог «Поступление» с фильтром: карточки заведений (название, текст, подписи кнопок программ).
async function catalog(pg, view) {
  await pg.evaluate(view => { __close(); const x = path16(); x.view = { ...x.view, section: 'admission58', country: 'ca', page: 0, city2791: '', ...view }; s.ui05.panel = 'center'; openPath16('admission58'); }, view);
  await pg.waitForTimeout(60);
  return pg.evaluate(() => {
    const t = document.querySelector('[data-panel="center"] .trajectory') || document.querySelector('.trajectory');
    return [...(t ? t.querySelectorAll('.uni2791') : [])].map(c => ({ name: c.querySelector('h3').textContent, text: c.innerText, terms: c.querySelector('.uni-terms2791')?.innerText || '', chips: [...c.querySelectorAll('.chip2791')].map(b => b.textContent) }));
  });
}

(async () => {
  if (!OLD['unis2791.js'] || !OLD['unis2791-data.js']) { console.log('FAIL нет файлов сборки 279.1 (git show ' + REF + ') — сравнивать не с чем'); process.exit(1); }
  const browser = await chromium.launch();

  // ---------- 0. Данные: меняется только язык канадских заведений ----------
  {
    const dataText = BASE ? OLD['unis2791-data.js'] : fs.readFileSync(path.join(ROOT, 'unis2791-data.js'), 'utf8');
    const codeText = BASE ? OLD['unis2791.js'] : fs.readFileSync(path.join(ROOT, 'unis2791.js'), 'utf8');
    const now = parseData(dataText), was = parseData(OLD['unis2791-data.js']);
    const diff = [], specs = {};
    for (const [cc, rows] of Object.entries(was?.countries || {})) {
      const by = new Map((now?.countries?.[cc] || []).map(r => [r[0], r]));
      for (const r of rows) {
        const n = by.get(r[0]);
        if (!n || JSON.stringify(n.slice(0, 13)) !== JSON.stringify(r) || n.length > 13 && (cc !== 'ca' || typeof n[13] !== 'string')) diff.push(cc + '-n' + r[0]);
        if (cc === 'ca' && n) specs[n[2]] = n[13] || '';
      }
      if ((now?.countries?.[cc] || []).length !== rows.length) diff.push(cc + ' число');
    }
    check('данные: строки 279.1 те же, у канадских — только язык обучения в конце', now && diff.length === 0, diff.slice(0, 8));
    const bad = Object.entries(EXPECT).filter(([name, spec]) => specs[name] !== spec).map(([name, spec]) => name + ': ' + JSON.stringify(specs[name]) + ' вместо ' + JSON.stringify(spec));
    const city = c => Object.keys(specs).filter(n => n.endsWith(' · ' + c));
    check('данные: Монреаль (' + city(MONTREAL).length + ') и Квебек (' + city(QUEBEC).length + ') — язык как в источнике', bad.length === 0 && [...city(MONTREAL), ...city(QUEBEC)].every(n => n in EXPECT), bad.concat([...city(MONTREAL), ...city(QUEBEC)].filter(n => !(n in EXPECT))));
    note('язык не по стране: ' + Object.entries(specs).filter(([, v]) => v).map(([n, v]) => n.split(' · ')[0] + ' (' + n.split(' · ')[1] + ') ' + v).join('; '));
    check('данные: нет real_name, source и ссылок', !/real_name|"source"|https?:|www\./.test(dataText + codeText));
    if (RESEARCH && fs.existsSync(RESEARCH)) {
      const src = JSON.parse(fs.readFileSync(RESEARCH, 'utf8'));
      const real = src.flatMap(c => c.institutions.flatMap(u => [u.real_name, u.real_name_en])).filter(n => n && n.length >= 6);
      const mine = fs.readFileSync(__filename, 'utf8'), hay = dataText + codeText + mine, found = [...new Set(real.filter(n => hay.includes(n)))];
      check('данные: ни одного настоящего названия (' + real.length + ') в unis2791-data.js, unis2791.js и этом тесте', found.length === 0, found.slice(0, 5).join(' | '));
    } else note('UNIS_RESEARCH не задан — сверка с настоящими названиями пропущена');
  }

  // ---------- 1. Сборка 279.1: эталон программ и сохранение с учёбой в Монреале ----------
  let ref = null, oldRaw = null;
  {
    const { pg, ctx, errors } = await open(browser, { old: true, seed: 27911 });
    ref = await pg.evaluate(() => ({ programs: programs16.map(p => [p.id, p.university, p.field, p.level, p.fee, p.selectivity, p.months, p.minLanguage, programName26(p), p.language]) }));
    // Франкоязычная 18 лет в Монреале в 279.1: сколько заведений Монреаля и Квебека ей открыто (для сводки).
    ref.franco = await pg.evaluate(([M, Q]) => {
      __live(M); __speaker({ fr: 6, en: 2 }, 'fr');
      const open = c => [...new Set(programs16.filter(p => p.country === 'ca' && p.city === c && ['bachelor', 'vocational'].includes(p.level) && __plain(p) && !admission16(p).why.length).map(p => uni16(p).name))];
      return { [M]: open(M), [Q]: open(Q) };
    }, [MONTREAL, QUEBEC]);
    // Сохранение 279.1: англоязычный со слабым французским живёт в Монреале, учится в Виль-Мари (тогда — по-английски),
    // у него предложение из Сен-Валье (Квебек) и поданная заявка в Жак-Картье.
    oldRaw = await pg.evaluate(M => {
      __live(M); __speaker({ en: 6, fr: 1 }, 'en'); s.cash = Math.max(s.cash, 5e6);
      const x = path16(), uni = n => universities16.find(u => u.name === n);
      const pick = (n, f, l) => programs16.find(p => p.university === uni(n)?.id && p.field === f && p.level === l && __plain(p));
      const st = pick('Университет Виль-Мари · Монреаль', 'computing', 'bachelor'), of = pick('Университет Сен-Валье · Квебек', 'business', 'bachelor'), ap = pick('Политехническая школа Жак-Картье · Монреаль', 'engineering', 'bachelor');
      x.applications.push({ id: 'app27911-study', program: st.id, status: 'enrolled', probability: .8, roll: .1, submitted: s.clock.ticks - 40, scholarship: null });
      x.study = { id: 'study27911', application: 'app27911-study', program: st.id, progress: st.months - 3, payer: 'self', status: 'active', research: 0, grades: 80, badTerms: 0 };
      x.applications.push({ id: 'app27911-offer', program: of.id, status: 'offered', probability: .7, roll: .1, submitted: s.clock.ticks - 2, expires: s.clock.ticks + 18, scholarship: null });
      x.applications.push({ id: 'app27911-apply', program: ap.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
      s.clock.tasks.push({ id: 'process27911', kind: 'pathAdmission', label: 'Приемная комиссия · ' + uni16(ap).name, duration: 2, progress: 0, hours: 2, state: 'planned', application: 'app27911-apply' });
      const row = p => [p.id, uni16(p).name, programName26(p), p.language, admission16(p).why.length];
      window.__old = { study: row(st), offer: row(of), apply: row(ap) };
      save(); if (typeof flushSave264 === 'function') flushSave264();
      return JSON.stringify({ format: 'life-side-effects', version: 1, exportedAt: new Date().toISOString(), lives: [JSON.parse(JSON.stringify(s))] });
    }, MONTREAL);
    ref.old = await pg.evaluate(() => window.__old);
    check('279.1: эталон снят без ошибок, учёба и предложение 279.1 — на английском', errors.length === 0 && ['study', 'offer', 'apply'].every(k => ref.old[k][3] === 'en' && ref.old[k][4] === 0), [errors.slice(0, 2), ref.old]);
    note('279.1: франкоязычной открыто в Монреале ' + ref.franco[MONTREAL].length + ', в Квебеке ' + ref.franco[QUEBEC].length + ' заведений');
    await ctx.close();
  }

  // ---------- 2. Новая сборка: id, франкоязычная и англоязычный ----------
  {
    const { pg, ctx, errors } = await open(browser, { seed: 27912 });
    const ids = await pg.evaluate(programs => {
      const known = new Set(programs.map(r => r[0])), out = { missing: [], changed: [], lang: [], langBad: [], added: [], addedBad: [], counts: {} };
      for (const [id, uni, field, level, fee, sel, months, minLang, name, language] of programs) {
        const p = prog16(id);
        if (!p) { out.missing.push(id); continue; }
        if (p.university !== uni || p.field !== field || p.level !== level || p.fee !== fee || p.selectivity !== sel || p.months !== months || p.minLanguage !== minLang || programName26(p) !== name) out.changed.push(id);
        if (p.language !== language) { out.lang.push(id); const u = uni16(p); if (p.country !== 'ca' || !u.lang27911 || p.language !== u.lang27911 || language !== 'en') out.langBad.push(id); }
      }
      for (const p of programs16) if (!known.has(p.id)) {
        out.added.push(p.id);
        const base = programs.find(r => r[0] === p.id.replace(/-(en|fr)$/, ''));
        if (p.country !== 'ca' || !p.copy27911 || !p.id.endsWith('-' + p.copy27911) || !base || p.language !== p.copy27911 || programName26(p) !== base[8] + ' · на ' + (p.copy27911 === 'en' ? 'английском' : 'французском')) out.addedBad.push(p.id);
      }
      return { ...out, missing: out.missing.slice(0, 5), changed: out.changed.slice(0, 5), langBad: out.langBad.slice(0, 5), addedBad: out.addedBad.slice(0, 5), langCount: out.lang.length, addedCount: out.added.length,
        fr: out.lang.filter(id => prog16(id).city === 'Монреаль' || prog16(id).city === 'Квебек').length };
    }, ref.programs);
    check('id: все ' + ref.programs.length + ' программ 279.1 на месте — вуз, направление, ступень, цена, отбор, срок, название', ids.missing.length === 0 && ids.changed.length === 0, { missing: ids.missing, changed: ids.changed });
    check('id: язык сменился (' + ids.langCount + ', из них ' + ids.fr + ' в Монреале и Квебеке) только у французских заведений Канады — с английского на французский', ids.langCount > 0 && ids.fr > 0 && ids.langBad.length === 0, ids.langBad);
    check('id: новые (' + ids.addedCount + ') — только копии «-en»/«-fr» у двуязычных заведений Канады, «… · на английском» / «… · на французском»', ids.addedCount > 0 && ids.addedBad.length === 0, ids.addedBad);

    // Франкоязычная 18 лет: Монреаль и Квебек.
    const franco = await pg.evaluate(([M, Q]) => {
      __speaker({ fr: 6, en: 2 }, 'fr');
      const out = {};
      for (const c of [M, Q]) {
        __live(c);
        const us = universities16.filter(u => u.country === 'ca' && u.city === c && u.kind2791 && u.lang27911 && u.lang27911.startsWith('fr'));
        out[c] = us.map(u => {
          const ps = programs16.filter(p => p.university === u.id && ['bachelor', 'vocational'].includes(p.level) && __plain(p) && p.language === 'fr');
          const ok = ps.filter(p => { const r = admission16(p); return !r.why.length && r.probability > 0; });
          return [u.name, ps.length, ok.length];
        });
      }
      return out;
    }, [MONTREAL, QUEBEC]);
    const shut = c => franco[c].filter(r => !r[2]).map(r => r[0]);
    check('франкоязычная в Монреале: французские программы во всех ' + franco[MONTREAL].length + ' французских заведениях, шанс больше нуля', franco[MONTREAL].length === 8 && shut(MONTREAL).length === 0, franco[MONTREAL]);
    check('франкоязычная в Квебеке: французские программы во всех ' + franco[QUEBEC].length + ' заведениях, шанс больше нуля', franco[QUEBEC].length === 6 && shut(QUEBEC).length === 0, franco[QUEBEC]);
    note('было в 279.1 → стало: Монреаль ' + ref.franco[MONTREAL].length + ' → ' + franco[MONTREAL].filter(r => r[2]).length + ' французских заведений, Квебек ' + ref.franco[QUEBEC].length + ' → ' + franco[QUEBEC].filter(r => r[2]).length);
    await pg.evaluate(M => __live(M), MONTREAL);
    const mtl = await catalog(pg, { field: 'computing', level: 'bachelor', city2791: MONTREAL });
    const vm = mtl.find(c => /Виль-Мари/.test(c.name));
    check('карточка в Монреале: «Университет Виль-Мари» — «· на французском» и «Шанс поступить»', vm && /· на французском/.test(vm.terms) && /Шанс поступить/.test(vm.terms), mtl.map(c => c.name + ' | ' + c.terms));
    const fro = mtl.find(c => /Фробишер/.test(c.name));
    check('карточка в Монреале: у английского «Фробишер» язык не пишется (язык страны)', fro && !/· на /.test(fro.terms), fro);
    await pg.evaluate(Q => __live(Q), QUEBEC);
    const qc = await catalog(pg, { field: 'computing', level: 'bachelor', city2791: QUEBEC });
    check('карточки в Квебеке: все «· на французском» с шансом поступить (' + qc.length + ')', qc.length >= 2 && qc.every(c => /· на французском/.test(c.terms) && /Шанс поступить/.test(c.terms)), qc.map(c => c.name + ' | ' + c.terms));
    check('карточки: без латиницы', !/[A-Za-z]{2,}/.test(mtl.concat(qc).map(c => c.text).join(' ')), mtl.concat(qc).map(c => c.text).join(' ').match(/[A-Za-z]{2,}/)?.[0]);
    const win = await pg.evaluate(() => {
      __close(); const p = programs16.find(q => uni16(q).name === 'Университет Виль-Мари · Монреаль' && q.field === 'medicine' && q.level === 'bachelor' && __plain(q));
      programDetails16(p.id); const m = $('#modal'); [...m.querySelectorAll('details')].forEach(d => d.open = true);
      const t = m.open ? m.innerText : ''; __close(); return t;
    });
    check('окно программы: «О вузе» — «Учат на французском», медицина на французском', /Учат на французском/.test(win) && /Французский/.test(win) && !/Английский B/.test(win), win.slice(0, 900));

    // Англоязычный со слабым французским в Монреале.
    const anglo = await pg.evaluate(M => {
      __live(M); __speaker({ en: 6, fr: 1 }, 'en');
      const us = universities16.filter(u => u.country === 'ca' && u.city === M && u.kind2791);
      const rows = us.map(u => { const ps = programs16.filter(p => p.university === u.id && ['bachelor', 'vocational'].includes(p.level) && __plain(p)); const ok = ps.filter(p => !admission16(p).why.length); return [u.name, ok.length, [...new Set(ok.map(p => p.language))].join('/'), ok.map(p => programName26(p))[0] || '']; });
      const vm = programs16.find(p => uni16(p).name === 'Университет Виль-Мари · Монреаль' && p.level === 'bachelor' && __plain(p));
      return { rows, vmWhy: admission16(vm).why };
    }, MONTREAL);
    const row = n => anglo.rows.find(r => r[0] === n) || [n, 0, '', ''];
    const englishOk = ['Университет Фробишер · Монреаль', 'Университет Атуотер · Монреаль', 'Колледж Вестмаунт · Монреаль'].every(n => row(n)[1] > 0 && row(n)[2] === 'en');
    const copiesOk = ['Высшая коммерческая школа Сен-Жак · Монреаль', 'Школа строительных ремёсел Лашин · Монреаль', 'Высшая театральная школа Плато · Монреаль'].every(n => row(n)[1] > 0 && row(n)[2] === 'en' && / · на английском$/.test(row(n)[3]));
    check('англоязычный со слабым французским в Монреале: «Фробишер», «Атуотер», «Вестмаунт» открыты', englishOk, anglo.rows);
    check('англоязычный: у «Сен-Жак», «Лашин», «Плато» открыты программы «· на английском»', copiesOk, anglo.rows);
    check('англоязычный: в «Виль-Мари» не хватает французского B2', anglo.vmWhy.includes('Французский B2'), anglo.vmWhy);
    const hec = await catalog(pg, { field: 'business', level: 'bachelor', city2791: MONTREAL });
    const h = hec.find(c => /Сен-Жак/.test(c.name));
    check('карточка «Сен-Жак»: кнопки на французском и «· на английском», англоязычному шанс — на английской', h && h.chips.some(t => / · на английском$/.test(t)) && h.chips.some(t => !/ · на /.test(t)) && /Шанс поступить/.test(h.terms) && !/на французском/.test(h.terms), h);
    // 279.1.1 (рецензия): подготовка к профессии, одна на страну, — у двуязычного «Плато» и на английском, у французского
    // «Сен-Луи» ещё и на языке страны; англоязычному «Где учиться на эту профессию» — без требования французского.
    const occ = await pg.evaluate(() => {
      const out = {};
      for (const role of ['paralegal', 'curator', 'restorer']) {
        const ps = programs16.filter(p => p.country === 'ca' && p.occupation68 === role);
        out[role] = { at: [...new Set(ps.map(p => uni16(p).name))], langs: [...new Set(ps.map(p => p.language))].sort().join('/'),
          train: trainingPrograms68(role, 'ca').filter(p => p.occupation68 === role).map(p => [uni16(p).name, p.language, admission16(p).why.filter(w => /Французский|Английский/.test(w))]) };
      }
      out.about = aboutUni2791(uni16(programs16.find(p => p.country === 'ca' && p.occupation68 === 'paralegal')));
      return out;
    });
    const roles = ['paralegal', 'curator', 'restorer'];
    check('«О вузе» у «Сен-Луи»: учат на французском, подготовка по профессии «Помощник юриста» есть и на английском', /Учат на французском\. Подготовка по профессии «Помощник юриста» есть и на английском\./.test(occ.about), occ.about);
    check('подготовка к профессии, одна на страну («Помощник юриста» в «Сен-Луи», «Музейный куратор» и «Реставратор» в «Плато»): на французском и на английском', roles.every(r => occ[r].at.length === 1 && occ[r].langs === 'en/fr'), occ);
    check('англоязычному «Где учиться» на эти профессии — программа без требования французского', roles.every(r => occ[r].train.length > 0 && occ[r].train.every(x => x[1] === 'en' && !x[2].length)), occ);
    const plateau = await catalog(pg, { field: 'arts', level: 'master', city2791: MONTREAL });
    const pl = plateau.find(c => /Плато/.test(c.name));
    check('карточка «Плато» (магистратура): «Музейный куратор» и «Музейный куратор · на английском»', pl && pl.chips.includes('Музейный куратор') && pl.chips.includes('Музейный куратор · на английском'), pl && pl.chips);
    const fresh = await pg.evaluate(() => JSON.stringify(s.unisLang27911 || null));
    check('новая жизнь: список прежних языков пуст', fresh === '{"pins":{}}', fresh);
    check('новая сборка: без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 3. Сохранение 279.1: учёба, предложение и заявка — на прежнем языке ----------
  {
    const { pg, ctx, errors } = await open(browser, { raw: oldRaw });
    const r = await pg.evaluate(old => {
      const x = path16(), row = id => { const p = prog16(id); return p ? [p.id, uni16(p).name, programName26(p), p.language, admission16(p).why.length] : null; };
      const out = { pins: JSON.stringify(s.unisLang27911 || null), study: row(old.study[0]), offer: row(old.offer[0]), apply: row(old.apply[0]) };
      programDetails16(old.study[0]); [...$('#modal').querySelectorAll('details')].forEach(d => d.open = true); out.win = $('#modal').open ? $('#modal').innerText : ''; __close();
      openPath16('education'); out.edu = document.querySelector('.trajectory')?.innerText || '';
      acceptStudy16('app27911-offer'); out.accepted = x.applications.find(a => a.id === 'app27911-offer')?.status;
      // Новая заявка в то же заведение — уже по-французски.
      const other = programs16.find(p => p.university === prog16(old.study[0]).university && p.level === 'bachelor' && p.field !== prog16(old.study[0]).field && __plain(p));
      out.other = other ? [other.language, admission16(other).why] : null;
      return out;
    }, ref.old);
    const pins = JSON.parse(r.pins || 'null');
    check('сохранение 279.1: учёба, предложение и заявка — в списке прежнего языка (английский)', pins && ['study', 'offer', 'apply'].every(k => pins.pins?.[ref.old[k][0]] === 'en') && Object.keys(pins.pins).length === 3, r.pins);
    check('сохранение 279.1: программы на английском, названия вуза и программы прежние, язык не мешает', ['study', 'offer', 'apply'].every(k => JSON.stringify(r[k]) === JSON.stringify(ref.old[k])), { now: [r.study, r.offer, r.apply], was: ref.old });
    check('сохранение 279.1: окно учёбы — «Английский», «Эта программа — на английском», «Моя учёба» с прежним названием', /Язык: Английский/.test(r.win) && /Эта программа — на английском/.test(r.win) && !/Французский B/.test(r.win) && r.edu.includes(ref.old.study[1].split(' · ')[0]), r.win.slice(0, 500));
    check('сохранение 279.1: предложение из Квебека принимается', r.accepted === 'accepted', r.accepted);
    check('сохранение 279.1: новая заявка в то же заведение — на французском, с требованием французского', r.other && r.other[0] === 'fr' && r.other[1].includes('Французский B2'), r.other);
    const after = await pg.evaluate(old => {
      __month(5);
      const x = path16(), d = x.diplomas.find(d => d.program46 === old.study[0]), a = x.applications.find(a => a.id === 'app27911-apply');
      return { diploma: d ? [d.title, d.university] : null, apply: a?.status, study: x.study?.program || null, nan: __nan(), pins: JSON.stringify(s.unisLang27911) };
    }, ref.old);
    check('сохранение 279.1: учёба дошла до диплома с прежним названием вуза', after.diploma && after.diploma[1] === ref.old.study[1], after);
    check('сохранение 279.1: заявка 279.1 получила ответ', ['offered', 'rejected', 'accepted'].includes(after.apply), after.apply);
    check('сохранение 279.1: без NaN и ошибок страницы', after.nan.length === 0 && errors.length === 0, [after.nan, errors.slice(0, 2)]);
    // Ещё раз открыть: список прежних языков сохраняется, пока заявка жива.
    const again = await pg.evaluate(() => { save(); if (typeof flushSave264 === 'function') flushSave264(); const life = readLife(s.saveId); return JSON.stringify(life?.unisLang27911 || null); });
    const p2 = JSON.parse(again || 'null');
    check('сохранение 279.1: после записи и чтения прежний язык у живого предложения остаётся', p2 && p2.pins?.[ref.old.offer[0]] === 'en', again);
    // Рецензия 279.1.1: заявке 279.1 отказали, через год англоязычный подаёт снова на ту же программу — она уже французская.
    const re = await pg.evaluate(old => {
      const x = path16(), id = old.apply[0], a = x.applications.find(a => a.id === 'app27911-apply');
      a.status = 'rejected'; x.retry[id] = 0;
      const out = { lang: prog16(id).language }, msgs = [], keep = toast; toast = t => msgs.push(t);
      try { apply16(id); } finally { toast = keep; }
      out.toast = msgs; out.apps = x.applications.filter(q => q.program === id).map(q => q.status);
      save(); if (typeof flushSave264 === 'function') flushSave264();
      out.pins = JSON.stringify(readLife(s.saveId)?.unisLang27911 || null);
      return out;
    }, ref.old);
    check('сохранение 279.1: заявке отказали — программа уже на французском, повторно без французского не подать, привязки нет', re.lang === 'fr' && re.toast.some(t => /Французский B2/.test(t)) && re.apps.join() === 'rejected' && !(JSON.parse(re.pins || 'null')?.pins || {})[ref.old.apply[0]], re);
    await ctx.close();
  }

  // ---------- 3б. Обычное открытие игры после обновления (рецензия 279.1.1) ----------
  // Активного персонажа восстанавливает saves.js при своей загрузке, раньше обёртки parseLife: жизнь записана файлами
  // 279.1 (принятое предложение и заявки в Монреале), страница перезагружена уже с файлами 279.1.1.
  {
    const { pg, ctx, errors, state } = await open(browser, { old: true, seed: 27913 });
    const made = await pg.evaluate(M => {
      __live(M); __speaker({ en: 6, fr: 1 }, 'en'); s.cash = Math.max(s.cash, 5e6);
      const x = path16(), uni = n => universities16.find(u => u.name === n);
      const pick = (n, f, l) => programs16.find(p => p.university === uni(n)?.id && p.field === f && p.level === l && __plain(p));
      const acc = pick('Университет Виль-Мари · Монреаль', 'computing', 'bachelor'), sub = pick('Политехническая школа Жак-Картье · Монреаль', 'engineering', 'bachelor');
      const occ = programs16.find(p => p.country === 'ca' && p.occupation68 === 'paralegal');
      x.applications.push({ id: 'app27911-acc', program: acc.id, status: 'accepted', probability: .8, roll: .1, submitted: s.clock.ticks - 4, expires: s.clock.ticks + 18, accepted: s.clock.ticks, scholarship: null });
      x.applications.push({ id: 'app27911-sub', program: sub.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
      x.applications.push({ id: 'app27911-occ', program: occ.id, status: 'submitted', probability: .9, roll: .1, submitted: s.clock.ticks, scholarship: null });
      save(); if (typeof flushSave264 === 'function') flushSave264();
      return { id: s.saveId, active: vaultIndex().active, acc: acc.id, sub: sub.id, occ: occ.id, langs: [acc.language, sub.language, occ.language], other: pick('Университет Виль-Мари · Монреаль', 'business', 'bachelor').id };
    }, MONTREAL);
    state.old = BASE;
    await pg.reload();
    await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&typeof prog16==='function'");
    await helpers(pg);
    const r = await pg.evaluate(m => {
      const x = path16(), ids = [m.acc, m.sub, m.occ], out = { same: s.saveId === m.id, pins: JSON.stringify(s.unisLang27911 || null), lang: ids.map(id => prog16(id).language), why: ids.map(id => admission16(prog16(id)).why) };
      const msgs = [], keep = toast; toast = t => msgs.push(t);
      try { studyStart16('app27911-acc', 'self'); } finally { toast = keep; }
      out.study = x.study?.program || null; out.toast = msgs;
      return out;
    }, made);
    const pins = JSON.parse(r.pins || 'null');
    check('открытие игры после обновления: тот же персонаж, заявки 279.1 были на английском', r.same && made.active === made.id && made.langs.every(l => l === 'en'), [made, r.same]);
    check('открытие игры после обновления: принятое предложение и заявки 279.1 — в списке прежнего языка', pins && [made.acc, made.sub, made.occ].every(id => pins.pins?.[id] === 'en'), r.pins);
    check('открытие игры после обновления: программы на английском, французский не нужен', r.lang.every(l => l === 'en') && r.why.every(w => !w.length), [r.lang, r.why]);
    check('открытие игры после обновления: учёба по принятому предложению 279.1 начинается', r.study === made.acc, [r.study, r.toast]);
    // Заявке 279.1 отказали, через год — снова на ту же программу: уже по-французски. Англоязычному не хватает французского;
    // франкоязычная подаёт, и после записи и чтения (выбрать персонажа в «Персонажах») язык остаётся французским.
    const again = await pg.evaluate(m => {
      const x = path16(), a = x.applications.find(a => a.id === 'app27911-sub'), out = {};
      a.status = 'rejected'; x.retry[m.sub] = 0;
      out.langAfterEnd = prog16(m.sub).language;
      const msgs = [], keep = toast; toast = t => msgs.push(t);
      try { apply16(m.sub); } finally { toast = keep; }
      out.angloToast = msgs; out.angloApps = x.applications.filter(q => q.program === m.sub).map(q => q.status);
      x.languages = { fr: 6, en: 2 }; x.native = ['fr'];
      apply16(m.sub); apply16(m.other);
      out.francoApps = x.applications.filter(q => q.program === m.sub || q.program === m.other).map(q => q.program + ':' + q.status);
      save(); if (typeof flushSave264 === 'function') flushSave264();
      loadCharacter(s.saveId);
      out.pins = JSON.stringify(s.unisLang27911 || null);
      out.lang = [prog16(m.sub).language, prog16(m.other).language, prog16(m.acc).language];
      out.why = [m.sub, m.other].map(id => admission16(prog16(id)).why);
      return out;
    }, made);
    const p2 = JSON.parse(again.pins || 'null');
    check('отказ по заявке 279.1: прежний язык больше не действует — программа на французском', again.langAfterEnd === 'fr', again);
    check('повторная заявка англоязычного на ту же программу — нужен французский, заявки нет', again.angloToast.some(t => /Французский B2/.test(t)) && again.angloApps.join() === 'rejected', again);
    check('франкоязычная: новые заявки на французском и после чтения сохранения (учёба 279.1 — по-прежнему на английском)', again.francoApps.filter(x => /:submitted$/.test(x)).length === 2 && again.lang.join() === 'fr,fr,en' && again.why.every(w => !w.length) && p2 && !p2.pins?.[made.sub] && !p2.pins?.[made.other] && p2.pins?.[made.acc] === 'en', again);
    check('открытие игры после обновления: без ошибок страницы и NaN', errors.length === 0 && (await pg.evaluate(() => __nan())).length === 0, errors.slice(0, 2));
    await ctx.close();
  }

  // ---------- 4. Настоящее сохранение владелицы ----------
  if (OWNER && fs.existsSync(OWNER)) {
    const raw = fs.readFileSync(OWNER, 'utf8');
    const { pg, ctx, errors } = await open(browser, { raw });
    const r = await pg.evaluate(() => {
      const x = path16(), out = { pins: JSON.stringify(s.unisLang27911 || null), dip: x.diplomas.map(d => d.university), apps: x.applications.map(a => a.program + ':' + a.status) };
      openPath16('admission58'); out.cat = document.querySelectorAll('.uni2791').length;
      __month(12);
      out.nan = __nan(); out.dip2 = x.diplomas.map(d => d.university);
      return out;
    });
    check('сохранение владелицы: открывается, дипломы не переименованы, каталог есть', JSON.stringify(r.dip) === JSON.stringify(r.dip2) && r.cat > 0 && /"pins"/.test(r.pins), r);
    check('сохранение владелицы: год без NaN и ошибок страницы', r.nan.length === 0 && errors.length === 0, [r.nan, errors.slice(0, 2)]);
    note('сохранение владелицы: прежний язык — ' + r.pins);
    await ctx.close();
  } else note('OWNER_SAVE не задан — настоящее сохранение пропущено');

  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: файлы вузов сборки 279.1)' : ''));
  process.exit(fail ? 1 : 0);
})();
