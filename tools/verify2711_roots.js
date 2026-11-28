// Проверки сборки 271.1 «Корни названий» (org271-data.js, employers2711.js): корень работодателя взят из списка именно этого
// типа, нумерованные типы дают «Школа № 57» без корня, для каждого варианта своего дела (business-options.json) есть
// названия из его корней, отклонённые пары («Супермаркет «Сити»») нигде не встречаются, названия не пустые и без
// undefined/NaN, доли mix тянут выбор, тип без привязанных корней — прежний путь (корень по тегам), а название,
// записанное до правки, не переименовывается.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2711_roots.js
// BASE=1 — прогон без employers2711.js (видно, какие проверки ловят старое поведение).
// ORG271_DATA=путь — другой org271-data.js.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1';
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const DATA = process.env.ORG271_DATA ? path.resolve(process.env.ORG271_DATA) : path.join(ROOT, 'org271-data.js');
const SRC = path.join(ROOT, 'docs', 'names271', 'roots285');
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };

// Данные читаем независимо от кода игры.
const ORG = new Function(fs.readFileSync(DATA, 'utf8') + ';return org271Data;')();
const ALL = ['nl', 'rs', 'ru', 'us', 'br', 'jp', 'fr', 'es', 'de', 'uk', 'ca', 'kr', 'cn', 'mx', 'it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl'];
const OPTIONS = JSON.parse(fs.readFileSync(path.join(SRC, 'business-options.json'), 'utf8'));
const approved = cc => JSON.parse(fs.readFileSync(path.join(SRC, cc + '.json'), 'utf8'));
const rejectedPairs = cc => {
  const out = new Set();
  for (const suffix of ['.rejected.json', '.spec-rejected.json']) {
    const p = path.join(SRC, cc + suffix);
    if (fs.existsSync(p)) for (const x of JSON.parse(fs.readFileSync(p, 'utf8'))) out.add(x.pair);
  }
  return out;
};
const REJECTED = Object.fromEntries(ALL.map(cc => [cc, rejectedPairs(cc)]));
// Корень → точные типы (по данным сборки): страна → «корень» → Set имён типов.
const typeNamesOf = (cc, row) => new Set((row[5] || []).map(k => ORG.countries[cc].typeNames[k]));
const bizOf = row => new Set((row[6] || []).map(k => ORG.bizIds[k]));
const strip = t => t.replace(/\s*№\s*N$/, '');
const numberedNames = cc => new Set(Object.values(ORG.countries[cc].types).flat().map(i => ORG.types[i]).filter(t => t[3]).map(t => strip(t[0])));
const BAD = /undefined|NaN|null|\[object/;

async function open(browser) {
  const ctx = await browser.newContext();
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = fs.readFileSync(f);
    if (rel === 'offline-game.js') body = '';
    else if (rel === 'org271-data.js' && process.env.ORG271_DATA) body = fs.readFileSync(DATA);
    else if (BASE && rel === 'employers2711.js') body = '';
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
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
  console.log((BASE ? 'BASE: без employers2711.js' : 'код: employers2711.js') + ' · данные ' + path.relative(ROOT, DATA));

  // ---------- 1. Данные: привязки, нумерованные типы, варианты дела, отклонённое ----------
  {
    const problems = { unbound: [], numberedBound: [], numberedForm: [], fewBiz: [], rejected: [], emptyFit: [], dupRoots: [], optionsMissing: [] };
    let numbered = 0, bizVariants = 0, roots = 0;
    for (const cc of ALL) {
      const c = ORG.countries[cc], src = approved(cc);
      if (!c || !c.typeNames || !c.mix || !c.bizOptions) { problems.optionsMissing.push(cc); continue; }
      const types = Object.values(c.types).flat().map(i => ORG.types[i]);
      const names = c.roots.map(r => r[0]);
      if (new Set(names).size !== names.length) problems.dupRoots.push(cc);
      roots += c.roots.length;
      const used = new Map();
      for (const row of c.roots) {
        if (!row[1].length) problems.emptyFit.push(cc + ': ' + row[0]);
        for (const t of typeNamesOf(cc, row)) {
          used.set(t, (used.get(t) || 0) + 1);
          if (REJECTED[cc].has(t + ' «' + row[0] + '»')) problems.rejected.push(cc + ': ' + t + ' «' + row[0] + '»');
        }
      }
      for (const t of types) {
        if (t[3]) {
          numbered++;
          if (!/ № N$/.test(t[0])) problems.numberedForm.push(cc + ': ' + t[0]);
          if (used.get(t[0])) problems.numberedBound.push(cc + ': ' + t[0]);
        } else if (!used.get(t[0])) problems.unbound.push(cc + ': ' + t[0]);
      }
      // каждая пара из исходных файлов roots285 дошла до данных, и наоборот: ничего не потеряно и не придумано
      const was = new Set(src.roots.flatMap(r => r.types.map(t => r.root + '|' + t))), now = new Set(c.roots.flatMap(r => [...typeNamesOf(cc, r)].map(t => r[0] + '|' + t)));
      if (was.size !== now.size || [...was].some(x => !now.has(x))) problems.unbound.push(cc + ': привязки в org271-data.js не совпадают с roots285');
      const ids = c.bizOptions.map(k => ORG.bizIds[k]), want = OPTIONS[cc].map(x => x.id);
      if (JSON.stringify(ids) !== JSON.stringify(want)) problems.optionsMissing.push(cc + ': варианты дела не как в business-options.json');
      for (const id of ids) {
        bizVariants++;
        const n = c.roots.filter(r => bizOf(r).has(id)).length;
        if (n < 3) problems.fewBiz.push(cc + ': ' + id + ' — ' + n);
      }
    }
    check(!problems.optionsMissing.length, 'данные: у 25 стран есть typeNames, mix и варианты дела как в business-options.json', problems.optionsMissing.slice(0, 3).join(' | '));
    check(roots === 8718, 'данные: корней 8718 (ничего не потеряно при сборке)', String(roots));
    check(!problems.dupRoots.length && !problems.emptyFit.length, 'данные: корни страны не повторяются, у каждого есть теги', problems.dupRoots.concat(problems.emptyFit).slice(0, 3).join(' | '));
    check(!problems.unbound.length, 'данные: у каждого обычного типа есть привязанные корни, привязки совпадают с roots285', problems.unbound.slice(0, 3).join(' | '));
    check(numbered === 28 && !problems.numberedForm.length && !problems.numberedBound.length, 'данные: 28 нумерованных типов «… № N», корней у них нет', numbered + ' ' + problems.numberedForm.concat(problems.numberedBound).slice(0, 3).join(' | '));
    check(bizVariants >= 390 && !problems.fewBiz.length, 'данные: у каждого варианта своего дела (' + bizVariants + ') хотя бы три корня', problems.fewBiz.slice(0, 3).join(' | '));
    check(!problems.rejected.length, 'данные: ни одна отклонённая пара не получилась из привязок', problems.rejected.slice(0, 3).join(' | '));
    check(ALL.every(cc => Object.keys(ORG.countries[cc].mix).length === 12), 'данные: mix у каждой страны по 12 сферам');
  }

  const browser = await chromium.launch();

  // ---------- 2. Работодатели по всем городам ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f' });
    const r = await pg.evaluate(() => {
      const out = [];
      for (const cc of Object.keys(countries)) for (const city of cities[cc]) {
        const roster = orgRoster271(cc, city);
        for (const e of roster?.all || []) out.push({ cc, city, field: e.field, type: e.type, root: e.root, name: e.name, numbered: !!e.numbered, bound: !!e.bound2711 });
      }
      return out;
    });
    const bad = { empty: [], root: [], numbered: [], rejected: [], form: [], notBound: [] };
    let numberedRows = 0, boundRows = 0;
    for (const e of r) {
      const c = ORG.countries[e.cc];
      if (!e.name || BAD.test(e.name) || !e.name.trim()) bad.empty.push(e.cc + ' ' + e.city + ': ' + e.name);
      if (REJECTED[e.cc].has(e.name)) bad.rejected.push(e.cc + ': ' + e.name);
      if (e.numbered) {
        numberedRows++;
        const m = /^(.+) № (\d+)$/.exec(e.name);
        if (!m || m[1] !== e.type || +m[2] < 1 || +m[2] > 150 || e.root) bad.numbered.push(e.cc + ': ' + e.name);
        if (!numberedNames(e.cc).has(e.type)) bad.numbered.push(e.cc + ': «' + e.type + '» не нумерованный тип');
      } else {
        if (e.name !== e.type + ' «' + e.root + '»') bad.form.push(e.cc + ': ' + e.name);
        const row = c.roots.find(x => x[0] === e.root);
        if (!row) { bad.root.push(e.cc + ': корня «' + e.root + '» нет в стране'); continue; }
        const has = [...typeNamesOf(e.cc, row)].includes(e.type);
        // тип без привязанных корней (в данных таких нет) — прежний путь по тегам
        const anyBound = c.roots.some(x => typeNamesOf(e.cc, x).has(e.type));
        if (e.bound) { boundRows++; if (!has) bad.root.push(e.cc + ': «' + e.root + '» не из списка типа «' + e.type + '»'); }
        else if (anyBound) bad.notBound.push(e.cc + ': ' + e.name);
      }
    }
    check(r.length > 2000, 'работодатели: рассмотрено названий во всех городах', String(r.length));
    check(!bad.empty.length, 'работодатели: названия не пустые, без undefined/NaN', bad.empty.slice(0, 3).join(' | '));
    check(!bad.root.length && !bad.form.length && !bad.notBound.length && boundRows > 1500, 'работодатели: корень взят из списка именно этого типа (' + boundRows + ')', bad.root.concat(bad.form, bad.notBound).slice(0, 3).join(' | '));
    check(!bad.rejected.length, 'работодатели: ни одной отклонённой пары', bad.rejected.slice(0, 3).join(' | '));
    check(!bad.numbered.length && numberedRows >= 10, 'работодатели: нумерованные дают «Тип № N», без корня (' + numberedRows + ')', bad.numbered.slice(0, 3).join(' | '));
    // нумерованные типы всех 25 стран: в каждом городе, где такой тип попал в набор, имя «№ N»; сводка стран
    const countriesWithNumbers = new Set(r.filter(e => e.numbered).map(e => e.cc));
    check(countriesWithNumbers.size >= 3, 'работодатели: нумерованные встречаются в городах разных стран', [...countriesWithNumbers].join(' '));
    // в сфере «образование» России нет «Школа «Корень»»: у «Школа» есть и обычный тип, и нумерованный, и название у каждого свое
    const sameCity = {};
    for (const e of r) (sameCity[e.cc + '|' + e.city] = sameCity[e.cc + '|' + e.city] || []).push(e.name);
    check(Object.values(sameCity).every(l => new Set(l).size === l.length), 'работодатели: в городе нет двух одинаковых названий');
    const rootsPerCity = Object.entries(sameCity).map(([k, l]) => { const roots = r.filter(e => e.cc + '|' + e.city === k && e.root).map(e => e.root); return roots.length - new Set(roots).size; });
    check(rootsPerCity.filter(n => n > 0).length / rootsPerCity.length < .05, 'работодатели: корни в городе почти не повторяются', rootsPerCity.filter(n => n > 0).length + ' из ' + rootsPerCity.length);
    check(errors.length === 0, 'работодатели: без ошибок страницы', errors.slice(0, 2).join(' | '));

    // ---------- 3. Все типы всех стран: выбор корня ----------
    const all = await pg.evaluate(() => {
      const out = [];
      for (const cc of Object.keys(countries)) {
        const c = orgCountry271(cc);
        for (const [field, list] of Object.entries(c.types)) for (const t of list) {
          if (t.numbered) { out.push({ cc, field, type: t.type, numbered: true }); continue; }
          const bound = c.roots.filter(r => r.typeSet?.has(t.type));
          const picks = [];
          for (let seed = 0; seed < 25; seed++) {
            const used = new Set();
            const r = pickRoot2711(bound, mixOf2711(c, field), orgRng271(orgHash271(cc + t.type + seed)), used);
            picks.push(r?.root);
          }
          out.push({ cc, field, type: t.type, bound: bound.map(r => r.root), picks });
        }
      }
      return out;
    });
    const bad3 = [];
    for (const t of all) {
      if (t.numbered) continue;
      if (!t.bound.length) { bad3.push(t.cc + ': у «' + t.type + '» нет корней'); continue; }
      for (const p of t.picks) {
        if (!p || BAD.test(p) || !t.bound.includes(p)) bad3.push(t.cc + ': «' + t.type + '» → ' + p);
        else if (REJECTED[t.cc].has(t.type + ' «' + p + '»')) bad3.push(t.cc + ': отклонённая пара ' + t.type + ' «' + p + '»');
      }
    }
    check(all.length > 2000 && !bad3.length, 'все типы 25 стран: корень (25 бросков на тип) только из его списка, без отклонённых (' + all.length + ' типов)', bad3.slice(0, 3).join(' | '));

    // ---------- 4. Доли mix ----------
    const mix = await pg.evaluate(() => {
      const share = (cc, field, type, test) => {
        const c = orgCountry271(cc), bound = c.roots.filter(r => r.typeSet?.has(type));
        let hit = 0, n = 600;
        for (let i = 0; i < n; i++) { const r = pickRoot2711(bound, mixOf2711(c, field), orgRng271(i * 7919 + 13), new Set()); if (test(r)) hit++; }
        return hit / n;
      };
      return {
        ruLoan: share('ru', 'computing', 'ИТ-компания', r => r.kind === 'loan'),
        jpLoan: share('jp', 'computing', 'ИТ-компания', r => r.kind === 'loan'),
        ruBanal: share('ru', 'medicine', 'Клиника', r => r.tone === 'банальный'),
        usBanal: share('us', 'medicine', 'Медицинский центр', r => r.tone === 'банальный'),
        krBanalLaw: share('kr', 'medicine', 'Клиника', r => r.tone === 'банальный'),
      };
    });
    check(mix.ruLoan > .3 && mix.ruLoan > mix.jpLoan + .1 && mix.jpLoan < .35, 'mix: у России заимствованные в ИТ чаще, чем у Японии', 'ru ' + mix.ruLoan.toFixed(2) + ', jp ' + mix.jpLoan.toFixed(2));
    check(mix.ruBanal > .35 && mix.ruBanal < .85, 'mix: у российской клиники банальные корни — около половины', 'ru ' + mix.ruBanal.toFixed(2));
    check(mix.krBanalLaw < mix.ruBanal, 'mix: у корейской клиники банальных меньше, чем у российской', 'kr ' + mix.krBanalLaw.toFixed(2) + ' < ru ' + mix.ruBanal.toFixed(2));
    check(errors.length === 0, 'все типы и mix: без ошибок страницы', errors.slice(0, 2).join(' | '));

    // ---------- 5. Нет корней у типа — прежний путь ----------
    const fb = await pg.evaluate(() => {
      // берём любой обычный тип российских наборов и снимаем привязку у всех его корней
      const c = orgCountry271('ru'), type = [...new Set(cities.ru.flatMap(city => orgRoster271('ru', city).all.filter(e => !e.numbered).map(e => e.type)))][0];
      const had = c.roots.filter(r => r.typeSet?.has(type));
      had.forEach(r => r.typeSet.delete(type));
      org271.rosters.clear();
      const names = [];
      for (const city of cities.ru) names.push(...(orgRoster271('ru', city)?.all || []).filter(e => e.type === type).map(e => ({ type, name: e.name, root: e.root, bound: !!e.bound2711 })));
      had.forEach(r => r.typeSet.add(type));
      org271.rosters.clear();
      return { type, names, wasBound: had.length };
    });
    check(BASE || (fb.wasBound > 0 && fb.names.length >= 1 && fb.names.every(x => x.name && !BAD.test(x.name) && x.root && !x.bound && x.name === x.type + ' «' + x.root + '»')), 'тип «' + fb.type + '» без привязанных корней: прежний путь, имя без undefined', fb.names.slice(0, 2).map(x => x.name).join(' | '));
    await ctx.close();
  }

  // ---------- 6. Своё дело: все варианты всех стран ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'm' });
    const variants = [];
    for (const cc of ALL) for (const o of OPTIONS[cc]) variants.push({ cc, id: o.id, kind: o.kind || null });
    const r = await pg.evaluate(variants => {
      return variants.map(v => {
        const [type, specialty] = /^BZ/.test(v.id) ? [v.kind, v.id] : v.id.split(':');
        const shown = [0, 3, 6].flatMap(o => businessNames271(v.cc, type, specialty, o, 3).map(n => n.name));
        const roots = businessRoots271(v.cc, type, specialty).map(r => r.root);
        const second = businessNames271(v.cc, type, specialty, 0, 3, roots.slice(0, 2)).map(n => n.name);
        return { ...v, type, specialty, shown, roots, second };
      });
    }, variants);
    const bad = { few: [], notBound: [], rejected: [], empty: [], dup: [], taken: [] };
    for (const v of r) {
      const c = ORG.countries[v.cc], want = new Set(c.roots.filter(x => bizOf(x).has(v.id)).map(x => x[0]));
      if (v.shown.slice(0, 3).length < 3 || new Set(v.shown.slice(0, 3)).size < 3) bad.few.push(v.cc + '/' + v.id + ': ' + v.shown.slice(0, 3).join(','));
      for (const n of [...v.shown, ...v.roots]) {
        if (!n || BAD.test(n)) bad.empty.push(v.cc + '/' + v.id + ': ' + n);
        else if (!want.has(n)) bad.notBound.push(v.cc + '/' + v.id + ': ' + n);
      }
      if (v.roots.length !== want.size || new Set(v.roots).size !== want.size) bad.dup.push(v.cc + '/' + v.id + ': ' + v.roots.length + ' из ' + want.size);
      if (v.second.some(n => v.roots.slice(0, 2).includes(n))) bad.taken.push(v.cc + '/' + v.id);
    }
    check(r.length === variants.length && variants.length >= 390, 'своё дело: проверено вариантов во всех странах', String(r.length));
    check(!bad.few.length, 'своё дело: у каждого варианта три разных названия', bad.few.slice(0, 3).join(' | '));
    check(!bad.empty.length, 'своё дело: названия не пустые, без undefined/NaN', bad.empty.slice(0, 3).join(' | '));
    check(!bad.notBound.length, 'своё дело: все названия — из корней именно этого варианта', bad.notBound.slice(0, 3).join(' | '));
    check(!bad.dup.length, 'своё дело: businessRoots271 — все корни варианта, без повторов', bad.dup.slice(0, 3).join(' | '));
    check(!bad.taken.length, 'своё дело: занятые названия снова не предлагаются', bad.taken.slice(0, 3).join(' | '));
    check(errors.length === 0, 'своё дело: без ошибок страницы', errors.slice(0, 2).join(' | '));

    // вариант, которого нет в данных страны, — прежний путь по тегам
    const old = await pg.evaluate(() => ({ none: businessNames271('ru', 'studio', 'photo', 0, 3).length, unknown: businessNames271('ru', 'studio', 'нет-такого', 0, 3).length, noSpec: businessNames271('ru', 'shop', null, 0, 3).length }));
    check(old.none === 3 && old.noSpec === 3, 'своё дело: вид без специальности — прежний путь по тегам', JSON.stringify(old));
    await ctx.close();
  }

  // ---------- 7. Старое сохранение: записанное не переименовывается ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f' });
    const r = await pg.evaluate(() => {
      const out = {};
      // название по правилам до 271.1 (корень по тегам): так, как записано в сохранении 271
      const city = residenceCity(), roster = (typeof roots2711Base === 'object' ? roots2711Base.orgRoster271 : orgRoster271)(s.country, city);
      const OLD = roster.byField.medicine[0].name;
      org271.rosters.clear();
      const x = path16(); x.view = { ...x.view, country: s.country, field: 'medicine', format: 'near' }; x.marketKey = null; makeVacancies16();
      for (const v of x.vacancies) { v.employer = OLD; v.employer271 = true; }
      x.jobApplications.push({ id: 'app-old2711', vacancy: { ...x.vacancies[0] }, status: 'rejected', probability: .5 });
      s.job = { title: 'Врач', professionId: 'doctor', employer: OLD, salary: 50000, tenure: 1, format: 'near', workplace: { country: s.country, city } };
      const co = company18(); co.name = OLD; co.employer271 = true;
      out.old = OLD; out.now = employerFor271(s.country, city, 'doctor');
      s.enterprise152 = { id: 'e-old', type: 'shop', specialty: 'books', title: 'Лавка «Старый корень»' };
      if (typeof flushSave264 === 'function') flushSave264();
      const json = JSON.stringify(s), keyMarket = x.marketKey;
      const copy = JSON.parse(json); copy.saveId = 'v2711-roots';
      localStorage.setItem(LIFE_PREFIX + 'v2711-roots', JSON.stringify(copy));
      loadCharacter('v2711-roots'); if ($('#modal').open) closeModal();
      render(); makeVacancies16(); company18();
      const y = path16();
      out.sameMarket = y.marketKey === keyMarket;
      out.vacancies = [...new Set(y.vacancies.map(v => v.employer))];
      out.application = y.jobApplications.find(a => a.id === 'app-old2711')?.vacancy.employer;
      out.job = s.job.employer; out.company = s.job.company18?.name;
      out.title = s.enterprise152?.title;
      return out;
    });
    check(r.sameMarket && r.vacancies.length === 1 && r.vacancies[0] === r.old, 'старое сохранение: записанные вакансии не переименованы', r.vacancies.join(' | ') + ' · было ' + r.old);
    check(r.application === r.old && r.job === r.old && r.company === r.old, 'старое сохранение: отклик, работа и компания — прежние', [r.application, r.job, r.company].join(' | '));
    check(r.title === 'Лавка «Старый корень»', 'старое сохранение: название своего дела не переименовано', r.title);
    check(r.now && !BAD.test(r.now), 'старое сохранение: новый работодатель города собирается по новым правилам', r.now);
    check(errors.length === 0, 'старое сохранение: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 8. Вакансия: живой путь ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f' });
    const r = await pg.evaluate(() => {
      const out = { vac: [], teacher: cities.ru.map(city => employerFor271('ru', city, 'teacher')), doctor: cities.ru.map(city => employerFor271('ru', city, 'doctor')), ruNumbered: cities.ru.flatMap(city => cityEmployers271('ru', city)).filter(n => / № \d+$/.test(n)) };
      for (const f of ['medicine', 'education', 'arts']) {
        const x = path16(); x.view = { ...x.view, country: s.country, field: f, format: 'near' }; x.marketKey = null; makeVacancies16();
        out.vac.push(...x.vacancies.map(v => v.employer));
      }
      return out;
    });
    check(r.vac.length > 20 && r.vac.every(n => n && !BAD.test(n)), 'вакансии: у всех работодатель, без undefined', r.vac.slice(0, 2).join(' | '));
    check(r.teacher.every(n => n && !BAD.test(n)) && r.ruNumbered.length >= 2, 'Россия: в наборах городов есть «… № N», учитель — с названием', r.ruNumbered.slice(0, 3).join(' | ') + ' / ' + r.teacher.slice(0, 2).join(' | '));
    check(r.doctor.every(n => n && !BAD.test(n)), 'врач в России: название без undefined', r.doctor.join(' | '));
    check(errors.length === 0, 'вакансии: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  await browser.close();
  console.log('\n' + pass + '/' + (pass + fail));
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
