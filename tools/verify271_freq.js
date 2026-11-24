// Проверки сборки 271, часть «частоты» (names271-freq-data.js, names271-freq.js): имена по году рождения и частоте,
// фамилии по частоте, Корея и Китай по долям, пасхалки «Иван Иванов» и «Томас Томас», полный тёзка из names270.js.
// Стенд: поток имён русского игрока 1990 года рождения — знакомые 1925–2025 годов рождения, больше всего ровесников,
// потом родители, дети, бабушки и дедушки. Считается среднее по многим «жизням», не одна случайная.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify271_freq.js
// Файлы сборки, ещё не подключённые в index.html, добавляются после загрузки страницы, до «Родиться»: names271-data.js,
// names271.js, names271-freq-data.js, names271-freq.js.
// BASE=1 — прогон без names271-freq (names271 остаётся): видно, какие проверки ловят старое поведение.
// LIVES=n — сколько «жизней» в стенде (по умолчанию 120: среднее на 150 женщин держится в ±0.2).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const LIVES = Number(process.env.LIVES) || 120;
// Данные частот читаются и здесь: в BASE=1 их нет на странице, а списки эпох для проверок нужны.
const FREQ = Function(fs.readFileSync(path.join(ROOT, 'names271-freq-data.js'), 'utf8').replace(/^'use strict';/, '') + ';return namesFreq271Data;')();
const BEFORE = ['names271-data.js', 'names271.js'];
const MINE = ['names271-freq-data.js', 'names271-freq.js'];
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };
const info = (label, extra) => console.log('     ' + label + (extra ? ' — ' + extra : ''));

async function open(browser) {
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
  for (const f of [...BEFORE, ...(BASE ? [] : MINE)]) if (!INDEX.includes(f)) await pg.addScriptTag({ path: path.join(ROOT, f) });
  return { pg, errors, ctx };
}
async function life(pg, cfg) {
  await pg.evaluate(cfg => {
    if (!document.querySelector('#country')) intro();
    for (const [k, v] of Object.entries({ startAge: '0', name: '', familyOrigin17: 'local', familyHousehold131: 'two', ...cfg })) {
      const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, cfg);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&!document.querySelector('#country')");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    s.pending = [];
    // Помощник стенда: год рождения знакомого — смесь вокруг года рождения игрока (ровесники, родители, дети,
    // бабушки и дедушки, немного случайных), 1925–2025.
    window.F = {
      gauss: () => { let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
      year: me => {
        const x = Math.random();
        const y = x < .5 ? me + 8 * F.gauss() : x < .65 ? me - 28 + 6 * F.gauss() : x < .75 ? me - 55 + 6 * F.gauss() : x < .9 ? me + 30 + 5 * F.gauss() : 1925 + Math.random() * 100;
        return Math.max(1925, Math.min(2025, Math.round(y)));
      },
      // Новый человек с годом рождения y через обычный person(): текущий год 2030, возраст = 2030 − y.
      born: (y, g, c) => { s.year = 2030; return person('Знакомый', 2030 - y, g, c || s.country); },
      reset: () => { nameReservations = new Set(); },
    };
  });
}

(async () => {
  const browser = await chromium.launch();
  // ---------- 1. Стенд: русский игрок 1990 года рождения ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f' });
    const t0 = Date.now();
    const r = await pg.evaluate(LIVES => {
      s.birthYear = 1990; s.year = 2030; s.age = 40;
      const out = { lives: LIVES, ek: 0, an: 0, iv: 0, perLife: [] };
      for (let l = 0; l < LIVES; l++) {
        F.reset();
        let ek = 0, an = 0, iv = 0;
        for (let i = 0; i < 300; i++) {
          const female = i < 150, p = F.born(F.year(1990), female ? 'f' : 'm');
          if (/^Иванова?$/.test(p.surname || '')) iv++;
          if (female && p.givenName166 === 'Екатерина') ek++;
          if (female && p.givenName166 === 'Анастасия') an++;
        }
        out.ek += ek; out.an += an; out.iv += iv; out.perLife.push([ek, an, iv]);
      }
      out.pool = countries.ru.names[0].length;
      // Эпохи — отдельные выборки по 4000 женщин: родившиеся в 1930–1964, 1985–2000, 2011–2025.
      const sample = (a, b) => { F.reset(); const c = {}; for (let i = 0; i < 4000; i++) { const g = F.born(a + Math.floor(Math.random() * (b - a + 1)), 'f').givenName166; c[g] = (c[g] || 0) + 1; } return c; };
      const era = { old: sample(1930, 1964), young: sample(1985, 2000), kids: sample(2011, 2025) };
      const share = (e, names) => names.reduce((a, n) => a + (era[e][n] || 0), 0) / 4000;
      out.galinaOld = share('old', ['Галина']); out.galinaYoung = share('young', ['Галина']);
      out.newKids = share('kids', ['Софья', 'София', 'Ева']); out.newOld = share('old', ['Софья', 'София', 'Ева']);
      const top = e => Object.entries(era[e]).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([n, k]) => n + ' ' + (k / 40).toFixed(1) + '%').join(', ');
      out.top = { old: top('old'), young: top('young'), kids: top('kids') };
      out.galinaRank = Object.entries(era.old).sort((a, b) => b[1] - a[1]).findIndex(([n]) => n === 'Галина') + 1;
      return out;
    }, LIVES);
    const ms = Date.now() - t0, L = r.lives, uni = 1 / r.pool;
    const band = i => { const v = r.perLife.map(x => x[i]).sort((a, b) => a - b); return `в одной жизни обычно ${v[Math.floor(L * .1)]}–${v[Math.floor(L * .9)]}`; };
    check(r.ek / L >= 2 && r.ek / L <= 4, 'ru 1990: Екатерина — 2–4 на 150 женщин', `${(r.ek / L).toFixed(2)} в среднем (${band(0)}), при равных весах ${(150 * uni).toFixed(2)}`);
    check(r.an / L >= 2 && r.an / L <= 4, 'ru 1990: Анастасия — 2–4 на 150 женщин', `${(r.an / L).toFixed(2)} в среднем (${band(1)})`);
    check(r.iv / L >= 2 && r.iv / L <= 4, 'ru 1990: Иванов(а) — 2–4 на 300 человек', `${(r.iv / L).toFixed(2)} в среднем (${band(2)})`);
    check(r.galinaOld >= 1.5 * uni && r.galinaOld >= 2.5 * r.galinaYoung, 'ru: Галина — частое имя у родившихся до 1965', `${(r.galinaOld * 100).toFixed(1)}% (место ${r.galinaRank}), у родившихся в 1985–2000 ${(r.galinaYoung * 100).toFixed(1)}%, равные веса ${(uni * 100).toFixed(1)}%`);
    check(r.newKids >= 1.5 * 3 * uni && r.newKids >= 3 * r.newOld, 'ru: Софья, София, Ева — у родившихся после 2010', `${(r.newKids * 100).toFixed(1)}%, до 1965 — ${(r.newOld * 100).toFixed(1)}%, равные веса ${(3 * uni * 100).toFixed(1)}%`);
    info('чаще всего до 1965', r.top.old); info('чаще всего 1985–2000', r.top.young); info('чаще всего после 2010', r.top.kids);
    info('скорость стенда', `${L * 300 + 12000} человек за ${ms} мс`);
    check(errors.length === 0, 'стенд ru: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // ---------- 2. Корея: Ли ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'kr', gender: 'm' });
    const r = await pg.evaluate(LIVES => {
      s.birthYear = 1990; s.year = 2030; s.age = 40;
      let li = 0, kim = 0;
      for (let l = 0; l < LIVES; l++) { F.reset(); for (let i = 0; i < 150; i++) { const p = F.born(F.year(1990), i % 2 ? 'f' : 'm'); if (p.surname === 'Ли') li++; if (p.surname === 'Ким') kim++; } }
      return { li: li / LIVES, kim: kim / LIVES };
    }, LIVES);
    check(r.li >= 15 && r.li <= 28, 'kr: около 20 Ли на 150 корейцев', `Ли ${r.li.toFixed(1)}, Ким ${r.kim.toFixed(1)}`);
    check(errors.length === 0, 'kr: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // ---------- 3. Эпохи, 2050+, пулы происхождения, все страны, точки входа ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'm' });
    const r = await pg.evaluate(data => {
      const out = {};
      const only = era => Object.entries(data).filter(([k]) => k.split(':')[1] === era).flatMap(([, v]) => v.split('|'));
      const oldOnly = new Set(only('old')), newOnly = new Set(only('new'));
      const shareAt = (y, set, n = 3000) => { F.reset(); let k = 0; for (let i = 0; i < n; i++) if (set.has(F.born(y, 'f').givenName166)) k++; return k / n; };
      // С 2050 половина имён выбирается как у родившихся до 1965 (только old), половина — как в 2015 (только new).
      out.old1950 = shareAt(1950, oldOnly); out.old2015 = shareAt(2015, oldOnly); out.old2070 = shareAt(2070, oldOnly); out.old1995 = shareAt(1995, oldOnly);
      out.new1950 = shareAt(1950, newOnly); out.new2015 = shareAt(2015, newOnly); out.new2070 = shareAt(2070, newOnly);
      // Пул происхождения (татарское) — равновероятно, год рождения не влияет.
      const dist = y => { const c = {}; s.year = 2030; for (let i = 0; i < 4000; i++) { const p = { age: 2030 - y, gender: 'f' }; assignFamilyName166(p, 'ru', 'татарское'); c[p.givenName166] = (c[p.givenName166] || 0) + 1; } return c; };
      const a = dist(1940), b = dist(2020), keys = new Set([...Object.keys(a), ...Object.keys(b)]);
      let tv = 0; for (const k of keys) tv += Math.abs((a[k] || 0) - (b[k] || 0)) / 4000; out.originTV = tv / 2;
      const pool = String(extendedFamilyNames167['татарское']?.[0] || '').split(' ');
      out.originInPool = [...keys].every(k => pool.includes(k));
      // Все страны: имена есть, нет перекоса (одно имя не больше 12% у 200 человек одной эпохи), нет ошибок.
      out.countries = {};
      for (const c of Object.keys(countries)) {
        const row = {};
        for (const y of [1950, 2015]) for (const g of ['f', 'm']) {
          F.reset(); const k = {};
          for (let i = 0; i < 200; i++) { const p = F.born(y, g, c); k[p.givenName166] = (k[p.givenName166] || 0) + 1; }
          row[y + g] = Math.max(...Object.values(k)) / 200;
        }
        F.reset(); const sur = {};
        for (let i = 0; i < 300; i++) { const p = F.born(1990, i % 2 ? 'f' : 'm', c); const k = genderSurname256(p.surnameParts256?.[0] || p.surname, 'm', c); sur[k] = (sur[k] || 0) + 1; }
        row.surname = Math.max(...Object.values(sur)) / 300;
        out.countries[c] = row;
      }
      // Год рождения в точках входа: новорождённый — текущий год, игрок при создании — год рождения.
      if (typeof birthYear271f === 'function') {
        const seen = []; const keep = familyName166;
        familyName166 = function (...args) { seen.push(birthYear271f()); return keep.apply(this, args); };
        try {
          s.year = 2031; const child = person('Ребенок', 0, 'f', 'ru'); childBirthIdentity166(child, [s]);
          out.newborn = seen.slice(); seen.length = 0;
          const grown = person('Друг', 44, 'm', 'ru'); seen.length = 0; assignFamilyName166(grown, 'ru', null); out.assign = seen.slice();
          // name() сразу после person(): год только что созданного человека; когда он уже среди людей — год игрока.
          const fresh = person('Знакомый', 2031 - 1950, 'f', 'ru'); out.lastFresh = birthYear271f(); s.people.push(fresh); out.lastJoined = birthYear271f(); out.playerYear = s.birthYear; s.people.pop();
        } finally { familyName166 = keep; }
      }
      return out;
    }, FREQ.countries.ru.f);
    const pc = x => (x * 100).toFixed(1) + '%';
    check(r.old1995 < r.old1950 / 3 && Math.abs(r.old2070 - (r.old1950 + r.old2015) / 2) < .035 && r.old2070 > 1.5 * r.old2015, 'ru: с 2050 «старые» имена возвращаются — половина имён как до 1965', `только old: 1950 ${pc(r.old1950)}, 1995 ${pc(r.old1995)}, 2015 ${pc(r.old2015)}, 2070 ${pc(r.old2070)}`);
    check(Math.abs(r.new2070 - (r.new1950 + r.new2015) / 2) < .035 && r.new2070 < .8 * r.new2015, 'ru: с 2050 «новые» имена — другая половина', `только new: 1950 ${pc(r.new1950)}, 2015 ${pc(r.new2015)}, 2070 ${pc(r.new2070)}`);
    check(r.originInPool && r.originTV < .12, 'пул происхождения (татарское): имена из пула, год рождения не влияет', `расхождение 1940/2020 ${r.originTV.toFixed(3)}`);
    // Корея и Китай — по долям: Ким около 20%, Ван около 8%.
    const skew = Object.entries(r.countries).filter(([c, v]) => Object.entries(v).some(([k, x]) => x > (k === 'surname' && ['kr', 'cn'].includes(c) ? .26 : .12))).map(([c, v]) => c + ' ' + JSON.stringify(v));
    check(Object.keys(r.countries).length === 25 && !skew.length, 'все 25 стран: имена и фамилии без перекоса (одно не больше 12%, фамилия в kr/cn — по долям)', skew.slice(0, 4).join('; '));
    if (!BASE) {
      check(r.newborn?.length && r.newborn.every(y => y === 2031), 'новорождённый: имя по текущему году', JSON.stringify(r.newborn));
      check(r.assign?.length && r.assign.every(y => y === 2031 - 44), 'assignFamilyName166: год рождения по возрасту', JSON.stringify(r.assign));
      check(r.lastFresh === 1950 && r.lastJoined === r.playerYear, 'name() сразу после person(): год нового человека, а не игрока', `${r.lastFresh} / ${r.lastJoined}`);
    }
    // Игрок при создании жизни (с рождения и с 18 лет): имя по году его рождения, а не прошлой жизни.
    if (!BASE) for (const startAge of ['0', '18']) {
      const st = await pg.evaluate(startAge => {
        intro();
        for (const [k, v] of Object.entries({ country: 'ru', gender: 'f', startAge, name: '', familyOrigin17: 'local', familyHousehold131: 'two' })) { const e = document.getElementById(k); if (e) { e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }
        const seen = [], keep = familyName166;
        familyName166 = function (...args) { if (freq271.stack.length === 1 && s?.people?.length) seen.push(birthYear271f()); return keep.apply(this, args); };
        try { start(); } finally { familyName166 = keep; }
        if ($('#modal').open) closeModal();
        return { seen, birth: s.birthYear, age: s.age, year: s.year };
      }, startAge);
      check(st.seen.length && st.seen.every(y => y === st.birth), `игрок (старт с ${startAge}): имя по году его рождения`, JSON.stringify(st));
    }
    check(errors.length === 0, 'эпохи и страны: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // ---------- 4. Пасхалки: «Иван Иванов» и «Томас Томас» ----------
  for (const country of ['us', 'es', 'ru', 'kr']) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country, gender: 'f' });
    const r = await pg.evaluate(c => {
      if (typeof eggState271f !== 'function') return { missing: true };
      const out = {}, norm = x => String(x || '').toLowerCase().replace(/ё/g, 'е');
      s.age = 30;
      const d = namesFreq271Data.countries[c] || {};
      const mentions = n => s.log.filter(e => String(e.title || '').includes(n) || String(e.text || '').includes(n)).length;
      // Частота: решается раз на жизнь; срок — 6–60 лет.
      const keep = s.nameEggs271; let pair = 0, dbl = 0, lo = 99, hi = 0;
      for (let i = 0; i < 20000; i++) { s.nameEggs271 = null; const st = eggState271f(); if (st.pair.on) pair++; if (st.double.on) dbl++; lo = Math.min(lo, st.pair.at, st.double.at); hi = Math.max(hi, st.pair.at, st.double.at); }
      s.nameEggs271 = keep;
      out.rate = { pair: pair / 20000, double: dbl / 20000, lo, hi, pairs: (d.pairs || []).length, doubles: (d.doubles || []).length };
      const on = kind => ({ pair: { on: kind === 'pair', at: 0, done: false }, double: { on: kind === 'double', at: 0, done: false } });
      // Первый подходящий знакомый: у людей с именем своего происхождения (portraits49) пасхалки нет, берём следующего.
      const make = (role, age, push) => { for (let i = 0; i < 40; i++) { const p = person(role, age, 'm', c); if (p.nameEgg271) { if (push) { s.people.push(p); render(); } return p; } } return null; };
      // Пара: не родня, нужный пол (все пары в данных мужские), один раз, без записи в ленте.
      if (out.rate.pairs) {
        s.nameEggs271 = on('pair');
        const woman = person('Друг', 30, 'f', c), kin = person('Брат', 30, 'm', c), egg = make('Друг', 30, true) || {};
        const next = person('Друг', 31, 'm', c); s.people.push(next); render();
        const sur = egg.surnameParts256 || [];
        out.pair = { woman: woman.name, womanEgg: !!woman.nameEgg271, kinEgg: !!kin.nameEgg271, egg: egg.name, kind: egg.nameEgg271, done: s.nameEggs271.pair.done, next: next.name, nextEgg: !!next.nameEgg271, mentions: mentions(egg.name),
          fromData: (d.pairs || []).some(([g, n]) => norm(g) === norm(egg.givenName166) && norm(genderSurname256(n, egg.gender, c)) === norm(sur[0])),
          two: ['es', 'mx', 'br'].includes(c) ? sur.length === 2 && sur[0] !== sur[1] : sur.length === 1 };
        // Кандидат так и не попал в жизнь — следующий знакомый.
        s.nameEggs271 = on('pair');
        const ghost = make('Знакомство', 25, false); s.clock.ticks += 1; render();
        const cleared = !s.nameEggs271.pair.pending && !s.nameEggs271.pair.done;
        const real = make('Знакомый', 27, true);
        out.retry = { ghost: !!ghost, cleared, real: real?.nameEgg271 === 'pair', done: s.nameEggs271.pair.done };
        // Имя переписали после создания (как у коллеги в events.js) — ждём следующего.
        s.nameEggs271 = on('pair');
        const col = make('Знакомый', 33, false) || {}, was = col.nameEgg271; col.name = name(c, 'm'); s.people.push(col); render();
        const pendingAfter = !!s.nameEggs271.pair.pending, doneAfter = s.nameEggs271.pair.done;
        const after = make('Знакомый', 34, true);
        out.overwrite = { was, pendingAfter, doneAfter, colEgg: !!col.nameEgg271, after: after?.nameEgg271 === 'pair', done: s.nameEggs271.pair.done };
        // Раньше срока — нет.
        s.nameEggs271 = on('pair'); s.nameEggs271.pair.at = s.age + 5;
        out.early = !!make('Друг', 30, false);
      }
      // Двойник: имя = фамилия (в es/mx/br — первая фамилия).
      if (out.rate.doubles) {
        s.nameEggs271 = on('double');
        const dbl = make('Друг', 30, true) || {};
        const sur = dbl.surnameParts256 || [];
        out.double = { name: dbl.name, kind: dbl.nameEgg271, done: s.nameEggs271.double.done, mentions: mentions(dbl.name),
          ok: ['es', 'mx', 'br'].includes(c) ? sur.length === 2 && sur[0] === dbl.givenName166 && sur[1] !== sur[0] : sur.length === 1 && sur[0] === dbl.givenName166 && dbl.name === dbl.givenName166 + ' ' + dbl.givenName166 };
      }
      return out;
    }, country);
    if (BASE) { check(false, `${country}: пасхалки (в BASE их нет)`); await ctx.close(); continue; }
    const rt = r.rate;
    const want = (k, rate) => (rt[k + 's'] ? Math.abs(rt[k] - rate) < (k === 'pair' ? .012 : .008) : rt[k] === 0);
    check(want('pair', 1 / 15) && want('double', 1 / 30) && rt.lo === 6 && rt.hi === 60, `${country}: жизни с парой — 1/15, с двойником — 1/30 (если в данных страны есть), срок 6–60 лет`, JSON.stringify(rt));
    if (r.pair) {
      const p = r.pair;
      check(p.fromData && p.two && p.kind === 'pair' && p.done && !p.nextEgg && p.mentions === 0, `${country}: «${p.egg}» — пара из данных, один раз, без записи в ленте`, `следующий: ${p.next}`);
      check(!p.womanEgg && !p.kinEgg, `${country}: не родня и нужного пола`, `${p.woman}`);
      check(r.retry.ghost && r.retry.cleared && r.retry.real && r.retry.done, `${country}: кандидат, не попавший в жизнь, уступает следующему`, JSON.stringify(r.retry));
      check(r.overwrite.was === 'pair' && !r.overwrite.pendingAfter && !r.overwrite.doneAfter && !r.overwrite.colEgg && r.overwrite.after && r.overwrite.done, `${country}: имя переписали после создания — пасхалка у следующего`, JSON.stringify(r.overwrite));
      check(!r.early, `${country}: не раньше срока`);
    }
    if (r.double) check(r.double.ok && r.double.kind === 'double' && r.double.done && r.double.mentions === 0, `${country}: двойник «${r.double.name}»`);
    check(errors.length === 0, `${country}: пасхалки без ошибок страницы`, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // ---------- 5. Полный тёзка из names270.js с частотами ----------
  for (const country of ['ru', 'kr', 'es']) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country, gender: 'm' });
    const r = await pg.evaluate(c => {
      const out = {};
      identity256(s);
      const mine = playerNames270();
      // Генератор с частотами всё равно не выдаёт полное имя игрока.
      let hits = 0;
      for (let i = 0; i < 3000; i++) { nameReservations = new Set(); if (mine.includes(name(c, s.gender))) hits++; }
      out.hits = hits;
      // Живой тёзка не игрока — второй получает другое имя.
      const a = person('Друг', 40, 'f', c), b = person('Коллега', 35, 'f', c);
      b.givenName166 = a.givenName166; b.surname = a.surname; b.surnameParts256 = [...a.surnameParts256]; b.name = a.name;
      s.people.push(a, b); dedupeGiven270(b);
      out.living = [a.name, b.name];
      const count = () => s.log.filter(e => e.title === 'Полный тёзка').length;
      const home = s.birthCountry || s.country;
      // Тёзка: один раз, с записью.
      s.namesake270 = { on: true, at: 0, done: false };
      const twin = person('Друг', 30, s.gender, home); s.people.push(twin); render();
      out.twin = { mine: mine.includes(twin.name), logged: count(), done: s.namesake270.done };
      // Имя кандидата переписали после создания (коллега в events.js, свидание в game.js): записи с чужим именем нет,
      // тёзкой становится следующий.
      s.namesake270 = { on: true, at: 0, done: false };
      const col = person('Знакомый', 33, s.gender, home), wasTwin = mine.includes(col.name);
      col.name = name(s.country, col.gender); s.people.push(col); render();
      const wrong = s.log.filter(e => e.title === 'Полный тёзка' && !mine.some(n => String(e.text).includes(n))).length;
      const next = person('Знакомый', 34, s.gender, home); s.people.push(next); render();
      out.overwrite = { wasTwin, wrong, nextMine: mine.includes(next.name), logged: count(), done: s.namesake270.done };
      // Частота жизней с тёзкой.
      const rate = cc => { let n = 0; const keep = s.namesake270, kb = s.birthCountry; s.birthCountry = cc; for (let i = 0; i < 20000; i++) { s.namesake270 = null; if (namesakeState270().on) n++; } s.namesake270 = keep; s.birthCountry = kb; return n / 20000; };
      out.rate = { nl: rate('nl'), kr: rate('kr'), cn: rate('cn') };
      return out;
    }, country);
    check(r.hits === 0, `${country}: генератор с частотами не выдаёт полное имя игрока`, `совпадений ${r.hits} из 3000`);
    check(r.living[0] !== r.living[1], `${country}: живой тёзка получает другое имя`, r.living.join(' / '));
    check(r.twin.mine && r.twin.logged === 1 && r.twin.done, `${country}: полный тёзка — один раз, с записью`, JSON.stringify(r.twin));
    check(r.overwrite.wasTwin && r.overwrite.wrong === 0 && r.overwrite.nextMine && r.overwrite.logged === 2 && r.overwrite.done, `${country}: имя тёзки переписали после создания — нет записи с чужим именем, тёзка — следующий`, JSON.stringify(r.overwrite));
    check(Math.abs(r.rate.nl - .02) < .006 && Math.abs(r.rate.kr - 1 / 15) < .012 && Math.abs(r.rate.cn - 1 / 15) < .012, `${country}: жизни с тёзкой — 1/50, Корея и Китай — 1/15`, JSON.stringify(r.rate));
    check(errors.length === 0, `${country}: тёзки без ошибок страницы`, errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  // ---------- 6. Скорость: name() при длинной броне имён ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f' });
    const r = await pg.evaluate(() => {
      nameReservations = new Set(); for (let i = 0; i < 4000; i++) name('ru', i % 2 ? 'f' : 'm');
      const t = performance.now(); for (let i = 0; i < 2000; i++) name('ru', i % 2 ? 'f' : 'm');
      const n = (performance.now() - t) / 2000;
      const t2 = performance.now(); for (let i = 0; i < 1000; i++) person('Знакомый', 20 + i % 50);
      return { name: n, person: (performance.now() - t2) / 1000 };
    });
    info('скорость', `name() ${r.name.toFixed(3)} мс при брони 4000 имён, person() ${r.person.toFixed(3)} мс`);
    check(r.name < 2 && errors.length === 0, 'name(): не дольше 2 мс при длинной брони, без ошибок', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }
  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без names271-freq)' : ''));
  process.exit(fail ? 1 : 0);
})();
