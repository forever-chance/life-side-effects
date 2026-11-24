// Проверки сборки 271, часть «работодатели» (org271-data.js, employers271.js): у города 8–15 разных работодателей,
// работодатель вакансии — из сферы профессии (врач не в «Магазинах «Под Липой»»), корень подходит к типу по тегам,
// названия детерминированы для (страна, город, сфера, зерно); компания по старой работе без работодателя — из сферы;
// вузы — только кириллицей, медицинский профиль называется медицинским, и вакансия врача ведёт в медицинский вуз;
// выбор названия своего дела для 16 видов × 25 стран (ни одного корня без подходящего тега) и само окно открытия;
// старое сохранение не переименовывает записанные вакансии, отклики, работу и компанию; после перезагрузки страницы
// (careers45.js сбрасывает marketKey, рынок собирается заново с теми же id) у вакансий те же работодатели — и в жизни
// 271, и в сохранении 270; набор работодателей города: профессия, чьё название называет место («Актёр театра»,
// «Ассистент аптеки»), — в организации своего вида, когда такая есть в городе, и таблица «не у себя» для ведущего;
// дипломы с прежним названием вуза показываются с нынешним, а в сохранении остаются прежними.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify271_employers.js
// Файлы сборки, ещё не подключённые в index.html, добавляются после загрузки страницы, до «Родиться»:
// names271-data.js, names271.js, org271-data.js, employers271.js.
// ORG271_DATA=путь — взять другой org271-data.js (например, заготовку: python3 tools/org271_build.py --fixture --out=путь).
// BASE=1 — прогон без org271-data.js и employers271.js: видно, какие проверки ловят старое поведение.
// ORG271_CAP=n — потолок организаций на город, если ведущий поменяет orgCityMax271 (по ТЗ 15).
// EMPLOYERS271=путь — взять другой employers271.js (например, прежнюю версию: видно, что ловят новые проверки).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const DATA = process.env.ORG271_DATA ? path.resolve(process.env.ORG271_DATA) : path.join(ROOT, 'org271-data.js');
const CODE = process.env.EMPLOYERS271 ? path.resolve(process.env.EMPLOYERS271) : path.join(ROOT, 'employers271.js');
const BEFORE = ['names271-data.js', 'names271.js'];
const MINE = ['org271-data.js', 'employers271.js'];
const CAP = +process.env.ORG271_CAP || 15;
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };

// Данные читаем и здесь, независимо от employers271.js: проверка не должна верить коду, который проверяет.
const ORG = new Function(fs.readFileSync(DATA, 'utf8') + ';return org271Data;')();
const ALL = ['nl', 'rs', 'ru', 'us', 'br', 'jp', 'fr', 'es', 'de', 'uk', 'ca', 'kr', 'cn', 'mx', 'it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl'];
const fitsTags = (root, tags) => root[1].includes('any') || root[1].some(t => tags.includes(t));
function orgCheck(cc, field, employer) {
  // «Тип «Корень»»: тип из сферы, корень страны, подходящий к типу по тегам
  const m = /^(.+) «(.+)»$/.exec(employer || '');
  if (!m) return 'не «тип «корень»»';
  const c = ORG.countries[cc];
  const types = (c.types[field] || []).map(i => ORG.types[i]).filter(t => t[0] === m[1]);
  if (!types.length) return 'тип «' + m[1] + '» не из сферы ' + field;
  const root = c.roots.find(r => r[0] === m[2]);
  if (!root) return 'корень «' + m[2] + '» не из страны ' + cc;
  if (!types.some(t => fitsTags(root, t[2]))) return 'корень «' + m[2] + '» не подходит к типу «' + m[1] + '»';
  return '';
}

async function addFiles(pg, mine) {
  for (const f of BEFORE) if (!INDEX.includes(f)) await pg.addScriptTag({ path: path.join(ROOT, f) });
  if (mine) for (const f of MINE) if (!INDEX.includes(f)) await pg.addScriptTag({ path: f === 'org271-data.js' ? DATA : f === 'employers271.js' ? CODE : path.join(ROOT, f) });
}
// Перезагрузка с той же жизнью: сохранение читается заново, файлы 271 добавляются после загрузки, как в open.
async function reload(pg, mine) {
  await pg.reload();
  await pg.waitForFunction("typeof start==='function'&&typeof s!=='undefined'&&s&&s.clock");
  await addFiles(pg, mine);
  await pg.evaluate(() => { if ($('#modal').open) closeModal(); s.pending = []; });
}
async function open(browser, { mine = !BASE } = {}) {
  const ctx = await browser.newContext();
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
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  await addFiles(pg, mine);
  await pg.evaluate(() => {
    window.T = {
      click: re => { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test(b.textContent.trim())); if (!b) return false; b.click(); return true; },
      title: () => document.querySelector('#modal h2')?.textContent || '',
      clean: () => { if ($('#modal').open) closeModal(); s.pending = []; },
      // вакансии сферы в городе: страна и дом игрока переставляются на время вызова
      vacancies: (cc, city, field) => {
        const x = path16(), keep = { country: s.country, housing: JSON.parse(JSON.stringify(s.housing)), view: { ...x.view } };
        s.country = cc; Object.assign(s.housing, { country: cc, city, mode: 'rent', occupant: null, active: true }); delete s.housing.listing41;
        try { x.view = { ...x.view, country: cc, field, format: 'near' }; x.marketKey = null; makeVacancies16(); return x.vacancies.filter(v => v.city === city).map(v => ({ id: v.id, profession: v.profession, field: profession16(v.profession).field, title: profession16(v.profession).title, employer: v.employer })); }
        finally { s.country = keep.country; s.housing = keep.housing; x.view = keep.view; x.marketKey = null; }
      },
    };
  });
  return { pg, errors, ctx };
}
async function life(pg, cfg) {
  await pg.evaluate(cfg => {
    if (!document.querySelector('#country')) intro();
    for (const [k, v] of Object.entries({ startAge: '18', name: '', ...cfg })) {
      const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, cfg);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&!document.querySelector('#country')");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = []; s.age = Math.max(s.age, 25); s.cash = 1e9;
  });
}

(async () => {
  console.log((BASE ? 'BASE: без employers271.js' : 'данные: ' + path.relative(ROOT, DATA)) + (ORG.fixture ? ' · FIXTURE (заготовка)' : '') + ' · источник ' + ORG.source);
  const browser = await chromium.launch();
  const fields = ['computing', 'engineering', 'medicine', 'care', 'business', 'law', 'education', 'science', 'arts', 'media', 'trade', 'service'];
  const sample = { ru: 2, us: 1, th: 2, eg: 1, de: 1, in: 1, pl: 1, jp: 1 };

  // ---------- 1. Работодатели вакансий по городам ----------
  let gridA = null;
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f' });
    const r = await pg.evaluate(({ sample, fields }) => {
      const out = {};
      for (const [cc, n] of Object.entries(sample)) for (const city of cities[cc].slice(0, n)) {
        const rows = fields.flatMap(f => T.vacancies(cc, city, f));
        out[cc + '|' + city] = rows;
      }
      return out;
    }, { sample, fields });
    for (const [key, rows] of Object.entries(r)) {
      const [cc, city] = key.split('|');
      const distinct = new Set(rows.map(v => v.employer));
      const bad = rows.map(v => [v, orgCheck(cc, v.field, v.employer)]).filter(([, e]) => e);
      const shops = rows.filter(v => v.field !== 'service' && /^Магазины «/.test(v.employer || ''));
      const doctor = rows.find(v => v.profession === 'doctor');
      check(distinct.size >= 8 && distinct.size <= CAP, `${cc} · ${city}: разных работодателей 8–${CAP}`, `${distinct.size}`);
      check(rows.length > 50 && !bad.length && !shops.length, `${cc} · ${city}: работодатель вакансии — из сферы профессии, корень подходит к типу`,
        bad.length ? bad.slice(0, 2).map(([v, e]) => v.title + ' @ ' + v.employer + ': ' + e).join('; ') : shops.length ? shops[0].title + ' @ ' + shops[0].employer : rows.length + ' вакансий');
      check(doctor && !orgCheck(cc, 'medicine', doctor.employer), `${cc} · ${city}: врач — в медицинской организации`, doctor ? doctor.employer : 'нет вакансии врача');
    }
    // одна профессия в одном городе — одна организация (части ставки и повторный поиск — там же)
    const same = Object.entries(r).every(([, rows]) => { const m = new Map(); return rows.every(v => (m.has(v.profession) ? m.get(v.profession) === v.employer : (m.set(v.profession, v.employer), true))); });
    check(same, 'одна профессия в городе — у одного работодателя');
    gridA = await pg.evaluate(({ fields }) => {
      if (typeof employerName271 !== 'function') return null;
      const out = [];
      for (const cc of ['ru', 'th', 'eg', 'us']) for (const city of cities[cc].slice(0, 3)) for (const f of fields) {
        for (const seed of [0, 1, 7, 'зерно', ...professions16.filter(p => p.field === f).slice(0, 3).map(p => p.id)]) out.push([cc, city, f, seed, employerName271(cc, city, f, seed)]);
      }
      org271.rosters.clear();
      const again = out.map(([cc, city, f, seed]) => employerName271(cc, city, f, seed));
      return { out, again };
    }, { fields });
    check(!!gridA && gridA.out.every((row, i) => row[4] && row[4] === gridA.again[i]), 'employerName271: то же имя после сброса кэша города');
    check(!!gridA && gridA.out.every(([cc, , f, , name]) => !orgCheck(cc, f, name)), 'employerName271: тип из сферы, корень подходит к типу',
      gridA ? (gridA.out.find(([cc, , f, , name]) => orgCheck(cc, f, name)) || []).join(' · ') : 'нет функции');
    // распределение по всем 25 странам и всем городам
    const all = await pg.evaluate(() => {
      if (typeof cityEmployers271 !== 'function') return null;
      const out = {};
      for (const cc of Object.keys(countries)) for (const city of cities[cc]) out[cc + '|' + city] = cityEmployers271(cc, city);
      return out;
    });
    const sizes = all ? Object.values(all).map(l => new Set(l).size) : [];
    check(!!all && Object.keys(all).length >= 150 && sizes.every(n => n >= 8 && n <= CAP), `все города 25 стран: 8–${CAP} работодателей`, all ? `${Object.keys(all).length} городов, от ${Math.min(...sizes)} до ${Math.max(...sizes)}` : 'нет функции');
    const cap = await pg.evaluate(() => typeof orgCityMax271 === 'number' ? orgCityMax271 : null);
    check(cap === CAP, `потолок организаций на город — ${CAP}` + (CAP === 15 ? ' (ТЗ: 8–15)' : ' (ORG271_CAP)'), String(cap));
    check(!!all && Object.entries(all).every(([k, l]) => l.every(n => /^[А-ЯЁ][^A-Za-z]*«[^«»A-Za-z]+»$/.test(n))), 'названия работодателей — кириллица, «тип «корень»»');

    // ---------- 2. Компания, замена вакансии, окно вакансии, сектора locality95 ----------
    const c = await pg.evaluate(() => {
      const out = {};
      const job = id => ({ title: profession16(id).title, professionId: id, salary: 1000, tenure: 0, workplace: { country: s.country, city: residenceCity() } });
      out.companies = ['doctor', 'teacher', 'cook16', 'lawyer', 'developer'].map(id => { s.job = job(id); const co = company18(); return { id, field: profession16(id).field, name: co.name }; });
      s.job = null;
      // замена вакансии: новая профессия — новый работодатель её сферы
      const x = path16(); x.view = { ...x.view, country: s.country, field: 'service', format: 'near' }; x.marketKey = null; makeVacancies16();
      // заменяем вакансию парикмахера, пока не выпадет другая профессия сервиса
      let v = x.vacancies.find(v => v.profession === 'hair') || x.vacancies[0], q = null;
      const from = v.employer;
      for (let i = 0; i < 30; i++) {
        const before = new Set(x.vacancies.map(w => w.id));
        replaceVacancy23(v);
        q = x.vacancies.find(w => !before.has(w.id));
        if (!q || q.profession !== 'hair') break;
        v = q;
      }
      out.replaced = q ? { from, prof: q.profession, field: profession16(q.profession).field, employer: q.employer, own: typeof employerFor271 === 'function' ? employerFor271(q.country, q.city, q.profession) : null } : null;
      // окно вакансии
      const w = x.vacancies.find(q => q.profession === 'retail');
      const d = jobDetailData20(w, null);
      out.detail = (d.sections.find(g => g.title === 'Условия')?.rows || []).map(r => r.label + ': ' + r.value);
      out.detailEmployer = w.employer;
      out.sectors = locality95(s.country, residenceCity())?.employers || null;
      return out;
    });
    for (const co of c.companies) check(!orgCheck('ru', co.field, co.name), `компания по работе без записанного работодателя (${co.id}) — из сферы ${co.field}`, co.name);
    check(c.replaced && c.replaced.prof !== 'hair' && !orgCheck('ru', c.replaced.field, c.replaced.employer) && (BASE || c.replaced.employer === c.replaced.own),
      'replaceVacancy23: у новой вакансии работодатель её профессии', JSON.stringify(c.replaced));
    check(c.detail.some(l => l === 'Работодатель: ' + c.detailEmployer), 'окно вакансии: работодатель в «Условиях»', c.detail.slice(0, 2).join(' · '));
    check(c.sectors && !orgCheck('ru', 'engineering', c.sectors.engineering) && !orgCheck('ru', 'arts', c.sectors.design) && !orgCheck('ru', 'service', c.sectors.retail),
      'locality95: сектора engineering/design/retail — из своих сфер', JSON.stringify(c.sectors));
    check(errors.length === 0, 'работодатели: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // детерминизм между страницами
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'th', gender: 'm' });
    const gridB = await pg.evaluate(rows => typeof employerName271 === 'function' ? rows.map(([cc, city, f, seed]) => employerName271(cc, city, f, seed)) : null, gridA ? gridA.out : []);
    check(!!gridA && !!gridB && gridA.out.every((row, i) => row[4] === gridB[i]), 'employerName271: в другой жизни и другой стране игрока — те же имена');
    const pairs = () => pg.evaluate(() => [...new Set(['medicine', 'service', 'arts'].flatMap(f => T.vacancies('ru', cities.ru[0], f)).map(v => v.profession + '=' + v.employer))].sort());
    const r = await pairs(), again = await pairs();
    check(r.length > 10 && r.join() === again.join() && r.every(x => !/=Магазины «/.test(x) || /^(retail|shiftManager|store|warehouse)=/.test(x)), 'вакансии одного города — те же работодатели при новом рынке', r.slice(0, 2).join(' · '));
    check(errors.length === 0, 'детерминизм: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 3. Вузы ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'in', gender: 'f' });
    const r = await pg.evaluate(() => {
      const foreign = /[A-Za-z\u00C0-\u024F\u0600-\u06FF\u0E00-\u0E7F]/;
      const out = { foreign: universities16.filter(u => foreign.test(u.name)).map(u => u.country + ':' + u.name) };
      out.medical = universities16.filter(u => u.fields.includes('medicine')).map(u => u.country + ':' + u.name);
      out.notMedical = out.medical.filter(n => !/[Мм]едицин/.test(n));
      out.countries = new Set(universities16.map(u => u.country)).size;
      out.hyderabad = universities16.filter(u => u.country === 'in' && u.profile === 3).map(u => u.name);
      out.ru = universities16.filter(u => u.country === 'ru').map(u => u.name);
      // вакансия врача → «Подобрать обязательное образование» → вузы, где учат медицине на бакалавриате
      const x = path16(); x.view = { ...x.view, country: s.country, field: 'medicine', format: 'near' }; x.marketKey = null; makeVacancies16();
      const v = x.vacancies.find(v => v.profession === 'doctor');
      const d = jobDetailData20(v, null), act = (d.actions || []).find(a => /образование/.test(a.label));
      if (act) act.fn();
      out.route = { field: x.view.field, level: x.view.level, section: x.view.section };
      out.programs = [...new Set(programs16.filter(p => p.country === s.country && p.field === 'medicine' && p.level === 'bachelor').map(p => uni16(p).name))];
      openPath16('admission58');
      const text = document.getElementById('app')?.innerText || '';
      out.shown = out.programs.filter(n => text.includes(n.split(' · ')[0]));
      out.oldShown = /Institute of Urban Studies|[\u0600-\u06FF\u0E00-\u0E7F]/.test(text);
      T.clean();
      return out;
    });
    check(r.foreign.length === 0, 'вузы: нет названий латиницей, тайским и арабским письмом', r.foreign.slice(0, 3).join(' | '));
    check(r.countries === 25 && r.notMedical.length === 0 && r.medical.length >= 25, 'вузы: где учат медицине — медицинский вуз по названию', r.notMedical.slice(0, 3).join(' | '));
    check(r.route.field === 'medicine' && r.programs.length && r.programs.every(n => /[Мм]едицин/.test(n)), 'вакансия врача ведёт в медицинский вуз', r.programs.join(' | '));
    check(r.shown.length > 0 && !r.oldShown, 'экран учёбы после вакансии врача: медицинский вуз кириллицей, без «Institute of Urban Studies»', r.shown.join(' | '));
    check(r.ru.includes('Медицинский университет имени Н. П. Семашко · Санкт-Петербург'), 'вузы России — прежние названия', r.ru[3]);
    check(errors.length === 0, 'вузы: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 4. Своё дело: названия для 16 видов × 25 стран ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'm' });
    const r = await pg.evaluate(() => {
      const kinds = Object.keys(enterpriseTypes152), out = { kinds: kinds.length, rows: [] };
      if (typeof businessNames271 !== 'function') return out;
      for (const cc of Object.keys(countries)) for (const kind of kinds) {
        const specs = [null, ...Object.keys(enterpriseSpecialties153[kind]).filter(k => enterpriseAvailable253(k, cc))];
        for (const spec of specs) {
          const shown = [0, 3, 6].flatMap(o => businessNames271(cc, kind, spec, o, 3).map(n => n.name));
          const all = businessRoots271(cc, kind, spec).map(r => r.root);
          const ex = businessNames271(cc, kind, spec, 0, 3, all.slice(0, 2)).map(n => n.name);
          out.rows.push({ cc, kind, spec, shown, all, ex, tags: businessTags271(kind, spec) });
        }
      }
      return out;
    });
    check(r.kinds === 16, 'своё дело: видов дела 16', String(r.kinds));
    const bad = [], short = [], wrongTags = [];
    for (const row of r.rows || []) {
      const want = row.spec && ORG.specialtyTags[row.spec] ? ORG.specialtyTags[row.spec] : ORG.kindTags[row.kind];
      if (JSON.stringify(want) !== JSON.stringify(row.tags)) wrongTags.push(row.cc + '/' + row.kind + '/' + row.spec);
      const roots = ORG.countries[row.cc].roots;
      for (const n of new Set([...row.shown, ...row.all])) { const root = roots.find(x => x[0] === n); if (!root || !fitsTags(root, want)) bad.push(row.cc + '/' + row.kind + (row.spec ? '/' + row.spec : '') + ': ' + n); }
      if (new Set(row.shown.slice(0, 3)).size < 3) short.push(row.cc + '/' + row.kind + (row.spec ? '/' + row.spec : '') + ': ' + row.shown.slice(0, 3).join(','));
      if (row.ex.some(n => row.all.slice(0, 2).includes(n))) bad.push(row.cc + '/' + row.kind + ': занятое название снова предложено');
    }
    const kindRows = (r.rows || []).filter(x => !x.spec);
    check(kindRows.length === 16 * 25, 'выбор названия: все 16 видов × 25 стран', String(kindRows.length));
    check((r.rows || []).length > 400 && bad.length === 0, 'выбор названия: ни одного корня без подходящего тега (вид или специальность)', bad.slice(0, 3).join(' | '));
    check((r.rows || []).length > 400 && short.length === 0, 'выбор названия: всегда три разных названия', short.slice(0, 3).join(' | '));
    check((r.rows || []).length > 400 && wrongTags.length === 0, 'выбор названия: теги специальности, иначе вида', wrongTags.slice(0, 3).join(' | '));
    check(errors.length === 0, 'выбор названия: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 5. Своё дело: окно открытия ----------
  for (const [cc, kind] of [['ru', 'shop'], ['th', 'food253'], ['de', 'studio']]) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: cc, gender: 'f' });
    const r = await pg.evaluate(kind => {
      const out = {};
      const state = () => {
        const box = document.querySelector('#modal .name-picker271'), input = document.getElementById('enterprise-title152');
        return { picker: !!box, names: [...document.querySelectorAll('#modal .name-choice271')].map(b => b.textContent), pressed: [...document.querySelectorAll('#modal .name-choice271[aria-pressed="true"]')].map(b => b.textContent),
          more: !!document.querySelector('#modal .name-more271'), value: input ? input.value : null, title: T.title() };
      };
      enterpriseSpecialtyMenu153(kind);
      const specialty = enterpriseEntries253(kind).find(([k]) => k !== 'school196');
      out.specialty = specialty;
      T.click(new RegExp('^' + specialty[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      out.first = state();
      const second = document.querySelectorAll('#modal .name-choice271')[1];
      if (second) second.click();
      out.second = state();
      const more = document.querySelector('#modal .name-more271');
      if (more) more.click();
      out.more = state();
      const input = document.getElementById('enterprise-title152');
      if (input) { input.value = 'Своё дело на углу'; input.dispatchEvent(new Event('input', { bubbles: true })); }
      out.own = state();
      T.click(/^Открыть$/);
      out.opened = s.enterprise152 ? { title: s.enterprise152.title, type: s.enterprise152.type, specialty: s.enterprise152.specialty } : null;
      T.clean();
      // второе дело: готовое название, без занятых
      enterpriseOpeningMenu168(true);
      T.clean();
      enterpriseSpecialtyMenu153(kind, true);
      T.click(new RegExp('^' + specialty[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      out.secondOpening = state();
      T.click(/^Открыть$/);
      out.titles = ownedEnterprises168().map(b => b.title);
      T.clean();
      // переименование — без выбора
      enterpriseNameMenu159(s.enterprise152);
      out.rename = state();
      T.clean();
      // профессиональная школа
      if (typeof schoolName196 === 'function' && typeof trackNames46 === 'object') { schoolName196(Object.keys(trackNames46)[0]); out.school = { names: [...document.querySelectorAll('#modal .name-choice271')].map(b => b.textContent), value: document.getElementById('schoolTitle196')?.value }; T.clean(); }
      return out;
    }, kind);
    const spec = r.specialty[0], want = ORG.specialtyTags[spec] || ORG.kindTags[kind], roots = ORG.countries[cc].roots;
    const fit = n => { const root = roots.find(x => x[0] === n); return !!root && fitsTags(root, want); };
    check(r.first.picker && r.first.names.length === 3 && r.first.more && r.first.names.every(fit), `${cc} · ${kind}/${spec}: три названия по тегам и «Другие варианты»`, r.first.names.join(', '));
    check(r.first.value === r.first.names[0] && r.first.pressed.join() === r.first.names[0], `${cc} · ${kind}: в поле — первое из предложенных`, r.first.value);
    check(r.second.value === r.first.names[1] && r.second.pressed.join() === r.first.names[1], `${cc} · ${kind}: выбор подставляет название в поле`, r.second.value);
    check(r.more.names.length === 3 && r.more.names.join() !== r.first.names.join() && r.more.names.every(fit), `${cc} · ${kind}: «Другие варианты» — новые подходящие названия`, r.more.names.join(', '));
    check(r.own.pressed.length === 0 && r.opened && r.opened.title === 'Своё дело на углу' && r.opened.specialty === spec, `${cc} · ${kind}: своё название открывает дело`, JSON.stringify(r.opened));
    check(r.secondOpening.picker && !r.secondOpening.names.includes('Своё дело на углу') && r.titles.includes(r.secondOpening.value) && r.titles.length === 2, `${cc} · ${kind}: второе дело — с готовым названием`, r.titles.join(' · '));
    check(r.rename.value !== null && !r.rename.picker, `${cc} · ${kind}: в переименовании выбора нет`);
    if (cc === 'ru') check(r.school && r.school.names.length === 3 && r.school.value === r.school.names[0] && r.school.names.every(n => { const root = roots.find(x => x[0] === n); return root && fitsTags(root, ORG.specialtyTags.school196 || ORG.kindTags.services); }),
      'профессиональная школа: тот же выбор названия', r.school ? r.school.names.join(', ') : 'нет окна');
    check(errors.length === 0, `${cc} · ${kind}: без ошибок страницы`, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 6. Старое сохранение ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'pl', gender: 'm' });
    const r = await pg.evaluate(() => {
      const OLD = 'Магазины «Под Липой»', out = {};
      const x = path16(); x.view = { ...x.view, country: s.country, field: 'medicine', format: 'near' }; x.marketKey = null; makeVacancies16();
      for (const v of x.vacancies) { v.employer = OLD; delete v.employer271; }
      x.jobApplications.push({ id: 'app-old271', vacancy: { ...x.vacancies[0] }, status: 'rejected', probability: .5 });
      s.job = { title: 'Врач', professionId: 'doctor', employer: OLD, salary: 50000, tenure: 1, format: 'near', workplace: { country: s.country, city: residenceCity() } };
      const co = company18(); co.name = OLD; delete co.employer271;
      // работа без работодателя и без компании — как в очень старом сохранении
      if (typeof flushSave264 === 'function') flushSave264();
      const json = JSON.stringify(s), keyMarket = x.marketKey;
      const old = JSON.parse(json); old.saveId = 'v271-employers';
      localStorage.setItem(LIFE_PREFIX + 'v271-employers', JSON.stringify(old));
      loadCharacter('v271-employers'); if ($('#modal').open) closeModal();
      render(); makeVacancies16(); company18();
      const y = path16();
      out.sameMarket = y.marketKey === keyMarket;
      out.vacancies = [...new Set(y.vacancies.map(v => v.employer))];
      out.application = y.jobApplications.find(a => a.id === 'app-old271')?.vacancy.employer;
      out.job = s.job.employer; out.company = s.job.company18.name;
      // старая работа без работодателя: компания появляется уже по-новому
      const legacy = JSON.parse(json); legacy.saveId = 'v271-employers-legacy'; delete legacy.job.employer; delete legacy.job.company18;
      localStorage.setItem(LIFE_PREFIX + 'v271-employers-legacy', JSON.stringify(legacy));
      loadCharacter('v271-employers-legacy'); if ($('#modal').open) closeModal();
      out.legacy = company18().name;
      return out;
    });
    check(r.sameMarket && r.vacancies.length === 1 && r.vacancies[0] === 'Магазины «Под Липой»', 'старое сохранение: записанные вакансии не переименованы', r.vacancies.join(' | '));
    check(r.application === 'Магазины «Под Липой»' && r.job === 'Магазины «Под Липой»' && r.company === 'Магазины «Под Липой»', 'старое сохранение: отклик, работа и компания — прежние', [r.application, r.job, r.company].join(' | '));
    check(!orgCheck('pl', 'medicine', r.legacy), 'сохранение без работодателя: компания врача — медицинская', r.legacy);
    check(errors.length === 0, 'старое сохранение: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 7. Перезагрузка страницы: жизнь 271 ----------
  // careers45.js при загрузке сбрасывает marketKey, и первый makeVacancies16 собирает тот же рынок с теми же id.
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f' });
    const look = field => pg.evaluate(field => {
      const x = path16(); x.view = { ...x.view, country: s.country, field, format: 'near' };
      makeVacancies16();
      return { key: x.marketKey, rows: x.vacancies.map(v => [v.id, v.profession, v.employer]) };
    }, field);
    const a = await look('medicine');
    await pg.evaluate(() => { save(); if (typeof flushSave264 === 'function') flushSave264(); });
    await reload(pg, !BASE);
    const cleared = await pg.evaluate(() => path16().marketKey);
    const b = await look('medicine');
    const same = (was, now) => now.rows.length > 0 && now.rows.every(r => { const o = was.rows.find(q => q[0] === r[0]); return !o || o[2] === r[2]; });
    const doctor = b.rows.find(r => r[1] === 'doctor');
    check(cleared === null && b.key === a.key, 'перезагрузка: рынок вакансий собирается заново с тем же ключом', String(cleared) + ' · ' + b.key);
    check(same(a, b), 'перезагрузка (жизнь 271): у вакансий те же работодатели', b.rows.filter(r => r[1] === 'doctor').map(r => r[2]).slice(0, 1).join(''));
    check(doctor && !orgCheck('ru', 'medicine', doctor[2]), 'перезагрузка: врач — в медицинской организации', doctor ? doctor[2] : 'нет вакансии врача');
    // фоновый поиск после перезагрузки: в сохранении рынок «Уход», поиск собирает его заново с теми же id
    const care2 = await look('care');
    await pg.evaluate(() => { save(); if (typeof flushSave264 === 'function') flushSave264(); });
    await reload(pg, !BASE);
    const bg = await pg.evaluate(() => {
      const x = path16();
      x.search = true; if (s.jobSearch) s.jobSearch.enabled = true; x.lastSearch = -99; x.searchView78 = { ...x.view, country: s.country, field: 'care', format: 'near' };
      x.jobApplications = x.jobApplications.filter(a => !['submitted', 'interview', 'interviewing', 'offered', 'accepted'].includes(a.status));
      s.job = null;
      const n = x.jobApplications.length;
      backgroundJobSearch78();
      const app = x.jobApplications.length > n ? x.jobApplications.at(-1) : null;
      return app ? { id: app.vacancy.id, prof: app.vacancy.profession, employer: app.vacancy.employer } : null;
    });
    const was = bg && care2.rows.find(r => r[0] === bg.id);
    check(bg && !orgCheck('ru', 'care', bg.employer) && (!was || was[2] === bg.employer), 'перезагрузка: фоновый поиск откликается с прежним работодателем сферы', bg ? bg.prof + ' @ ' + bg.employer : 'нет отклика');
    check(errors.length === 0, 'перезагрузка (жизнь 271): без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 8. Перезагрузка: сохранение 270 открывается в 271 ----------
  {
    const { pg, errors, ctx } = await open(browser, { mine: false });
    await life(pg, { country: 'pl', gender: 'm' });
    const a = await pg.evaluate(() => {
      const x = path16(); x.view = { ...x.view, country: s.country, field: 'medicine', format: 'near' }; makeVacancies16();
      const v = x.vacancies.find(v => v.profession === 'doctor');
      x.jobApplications.push({ id: 'app-270', vacancy: { ...v }, status: 'rejected', probability: .5 });
      // диплом 270 из вуза с названием арабским письмом
      const u = universities16.find(u => u.country === 'eg' && u.profile === 3), p = programs16.find(p => p.university === u.id && p.field === 'medicine' && p.level === 'bachelor');
      x.diplomas.push({ id: 'dip-270', field: p.field, level: p.level, track45: p.track45 || null, program46: p.id, profileSchema46: 1, title: levels16[p.level] + ' · ' + programName26(p), university: u.previousName271 || u.name, country: p.country, year: s.year, grade: 80, quality: p.quality, employment: p.employment });
      save(); if (typeof flushSave264 === 'function') flushSave264();
      return { key: x.marketKey, employers: [...new Set(x.vacancies.map(v => v.employer))], doctor: v.employer, uni: u.previousName271 || u.name, uniId: u.id };
    });
    await reload(pg, !BASE);
    const b = await pg.evaluate(uniId => {
      const x = path16(); x.view = { ...x.view, country: s.country, field: 'medicine', format: 'near' }; makeVacancies16();
      const out = { key: x.marketKey, employers: [...new Set(x.vacancies.map(v => v.employer))], app: x.jobApplications.find(a => a.id === 'app-270')?.vacancy.employer };
      // следующий квартал — новые вакансии, у них работодатели 271
      s.clock.ticks += 3; makeVacancies16();
      out.next = x.vacancies.find(v => v.profession === 'doctor')?.employer;
      s.clock.ticks -= 3; x.marketKey = null;
      // дипломы: на экране нынешнее название вуза, в сохранении — прежнее
      const u = universities16.find(u => u.id === uniId);
      out.uniNow = u.name;
      openPath16('education');
      out.education = document.getElementById('app')?.innerText || '';
      out.archive = typeof studyArchive58 === 'function' ? studyArchive58(x) : '';
      out.bio = (bioRows().find(r => r[0] === 'education') || [])[3] || '';
      save(); if (typeof flushSave264 === 'function') flushSave264();
      out.stored = x.diplomas.find(d => d.id === 'dip-270')?.university;
      out.saved = (localStorage.getItem(LIFE_PREFIX + s.saveId) || '').includes(JSON.stringify(out.stored));
      return out;
    }, a.uniId);
    check(b.key === a.key && b.employers.length === a.employers.length && b.employers.every(n => a.employers.includes(n)), 'сохранение 270 после перезагрузки: записанные вакансии не переименованы', b.employers.join(' | '));
    check(b.app === a.doctor, 'сохранение 270 после перезагрузки: отклик — прежний', b.app);
    check(b.next && !orgCheck('pl', 'medicine', b.next), 'сохранение 270: в следующем квартале врач — в медицинской организации', b.next);
    const shown = t => t.includes(b.uniNow) && !t.includes(a.uni);
    check(b.uniNow !== a.uni && shown(b.education) && shown(b.archive) && shown(b.bio), 'диплом 270: на экране учёбы, в архиве и в биографии — нынешнее название вуза', b.bio);
    check(b.stored === a.uni && b.saved, 'диплом 270: в сохранении название вуза прежнее', b.stored);
    check(errors.length === 0, 'сохранение 270 в 271: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 9. Набор работодателей города: профессии у себя ----------
  // Своё место профессий, чьё название его называет, — независимо от employers271.js. При потолке 15 на 30 с лишним
  // видов мест часть профессий неизбежно не у себя; проверяется, что набор города отдаёт места туда, где без них
  // хуже всего, и что профессия идёт в организацию своего вида, если та есть в городе.
  {
    const OWN = {
      stageactor: 'Театр', stagehand: 'Театр', setdesigner: 'Театр', dancer: 'Театр|Танц|самбы|фламенко',
      screenwriter: 'Кино|Аниме|Анимац', filmdirector: 'Кино|Аниме|Анимац', cameraOperator: 'Кино', cameraoperator: 'Кино',
      photographer: 'Фото', studioassistant: 'Фото', galleryassistant: 'Галере', curator: 'Музей|Галере',
      librarian: 'Библиотек', bookshop: 'Книжн', publishingassistant: 'Издательств', rightsmanager: 'Издательств', staffwriter: 'Издательств|Редакц',
      radioeditor: 'Радио', podcasteditor: 'Подкаст|Медиа|Радио', pharmacyassistant: 'Аптек', kindergarten: 'сад', museumeducator: 'Музей',
      teacher: '^Школа$|Лицей', lecturer: 'Колледж|Академ|Институт|Университет', hotel: 'Гостиниц|Отел|Гестхаус|Гостев|Рёкан|Риад|лодж',
      shiftManager: 'Супермаркет|Магазин', store: 'Торгов|Магазин|Супермаркет', mechanic16: 'Автосервис', gameqa: 'Игров', gameplay: 'Игров',
      doctor: 'Клиник|Больниц|Медицин|Лечеб|Хирург|Диагност', surgeon: 'Хирург|Больниц|Клиник|Медицин|Лечеб', lawyer: 'Адвокат|Коллеги|Юридическ|Правов',
      cook16: 'Ресторан|Кафе|Бистро|Траттори|Такери|Идзакая|Пивн|Кафана|Паб|Дайнер|Кебаб|Шурраскари|Тапас|Гостиниц|Отел', hair: 'Салон',
    };
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f' });
    const r = await pg.evaluate(OWN => {
      if (typeof employerFor271 !== 'function') return null;
      const out = { rows: [], code: null };
      for (const cc of Object.keys(countries)) for (const city of cities[cc]) {
        const names = cityEmployers271(cc, city);
        for (const id of Object.keys(OWN)) out.rows.push({ cc, city, id, field: profession16(id).field, title: profession16(id).title, employer: employerFor271(cc, city, id), names });
      }
      // таблица по мере самого кода: у себя / рядом / не у себя
      if (typeof orgMiss271 === 'function' && typeof orgMissLevels271 === 'object') {
        const L = orgMissLevels271, c = { own: 0, near: 0, off: 0, tot: 0 }, off = {};
        for (const cc of Object.keys(countries)) for (const city of cities[cc]) {
          const all = orgRoster271(cc, city).all;
          for (const p of professions16) {
            const name = employerFor271(cc, city, p.id), e = all.find(e => e.name === name), m = orgMiss271(orgPrefs271(p), e);
            c.tot++; if (m === L.own) c.own++; else if (m <= L.near) c.near++; else { c.off++; const k = p.title + ' → ' + e.type; off[k] = (off[k] || 0) + 1; }
          }
        }
        out.code = { ...c, off: c.off, table: Object.entries(off).sort((a, b) => b[1] - a[1]) };
      }
      return out;
    }, OWN);
    const typeOf = name => (/^(.+) «/.exec(name || '') || [])[1] || '';
    const fieldTypes = (cc, field) => new Set((ORG.countries[cc].types[field] || []).map(i => ORG.types[i][0]));
    let hit = 0, inconsistent = [];
    const offTab = {};
    for (const row of r ? r.rows : []) {
      const re = new RegExp(OWN[row.id]), mine = typeOf(row.employer);
      if (re.test(mine)) hit++; else offTab[row.title + ' → ' + mine] = (offTab[row.title + ' → ' + mine] || 0) + 1;
      const types = fieldTypes(row.cc, row.field);
      const available = row.names.map(typeOf).filter(t => types.has(t) && re.test(t));
      if (available.length && !re.test(mine)) inconsistent.push(row.cc + ' · ' + row.city + ': ' + row.title + ' @ ' + row.employer + ' при ' + available[0]);
    }
    const share = r && r.rows.length ? hit / r.rows.length : 0;
    check(!!r && inconsistent.length === 0, 'профессия идёт в организацию своего вида, если та есть в городе', inconsistent.slice(0, 2).join(' | '));
    // порог — для настоящих данных и потолка 15: до исправления 0.382 (места по сферам — жадно и с допуском), сейчас 0.557
    if (!ORG.fixture && CAP === 15) check(share >= 0.5, 'профессии, чьё название называет место, — у себя хотя бы в половине случаев', share.toFixed(3));
    else console.log('     (у себя — ' + share.toFixed(3) + '; порог только для настоящих данных и потолка 15)');
    console.log('     не у себя (профессии, чьё название называет место), городов из ' + (r ? new Set(r.rows.map(x => x.cc + x.city)).size : 0) + ':');
    for (const [k, n] of Object.entries(offTab).sort((a, b) => b[1] - a[1]).slice(0, 14)) console.log('       ' + k + ' · ' + n);
    if (r && r.code) {
      const c = r.code, pc = n => (100 * n / c.tot).toFixed(1) + ' %';
      console.log(`     по мере employers271.js, все профессии × все города: у себя ${pc(c.own)}, рядом ${pc(c.near)}, не у себя ${pc(c.off)}`);
      for (const [k, n] of c.table.slice(0, 12)) console.log('       ' + k + ' · ' + n);
    }
    check(errors.length === 0, 'набор работодателей: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass}/${pass + fail}`);
  process.exit(fail ? 1 : 0);
})();
