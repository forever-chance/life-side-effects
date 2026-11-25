// Проверки сборки 271, часть «имена» (names271-data.js, names271.js): пулы по странам после слияния, частоты фамилий
// в Корее и Китае, Египет (имя отца и деда), Япония (общая фамилия в браке), обычай страны при свадьбе и разводе NPC,
// фамилия детей по правилу страны, и баги аудита имён 270 — фамилия игрока при рождении, сиблинги, бабушки и дедушки,
// удвоенная фамилия в es/mx/br, «Юн»/«Ян», брак и развод по предложению NPC, приёмные дети, повторы имён в семье,
// друг-подросток и коллега из истории аренды, «Дети» в карточке, старые сохранения.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify271_names.js
// Файлы сборки, ещё не подключённые в index.html, добавляются после загрузки страницы, до «Родиться».
// BASE=1 — прогон без names271: видно, какие проверки ловят старое поведение.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const MINE = ['names271-data.js', 'names271.js'];
// Доли фамилий kr/cn из файла данных: с ними сравниваются частоты в игре (в BASE=1 их в игре нет — проверка падает).
const DATA = (() => { try { return new Function(fs.readFileSync(path.join(ROOT, 'names271-data.js'), 'utf8') + ';return names271Data;')(); } catch (e) { return { countries: {}, origins: {} }; } })();
const shareOf = (cc, n) => Number((DATA.countries[cc]?.surnameShares || []).find(x => x[0] === n)?.[1]) || 0;
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };

async function open(browser, { mine = !BASE, before = [] } = {}) {
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
  for (const f of before) if (!INDEX.includes(f)) await pg.addScriptTag({ path: path.join(ROOT, f) });
  if (mine) for (const f of MINE) if (!INDEX.includes(f)) await pg.addScriptTag({ path: path.join(ROOT, f) });
  await pg.evaluate(() => {
    window.T = {
      click: re => { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; },
      modal: () => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '', buttons: [...document.querySelectorAll('#modal .options button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()) }),
      clean: () => { if ($('#modal').open) closeModal(); s.pending = []; },
      mk: (role, age, g, country) => { const p = person(role, age, g, country || s.country); s.people.push(p); enrichPerson(p); p.inner.trust = 95; p.inner.strain = 0; p.inner.affection = 90; p.bond = 90; p.partnerSince = s.year; p.childrenWish = 'yes'; p.orientation = 'hetero'; return p; },
      birth: (pid, method) => { s.familyLife.birth = null; s.flags.childPending = null; startBirth(pid, method); s.familyLife.birth.due = s.clock.ticks; const before = new Set(s.people.map(p => p.id)); autonomousMonth(); if ($('#modal').open) closeModal(); s.pending = []; return s.people.find(p => !before.has(p.id) && p.role === 'Ребенок'); },
      months: n => { for (let i = 0; i < n; i++) { if ($('#modal').open) closeModal(); s.pending = []; s.clock.running = true; advanceMonth(); } if ($('#modal').open) closeModal(); s.pending = []; },
      words: x => String(x || '').split(/[\s-]+/).filter(Boolean),
      repeats: x => { const w = String(x || '').split(/[\s-]+/).filter(Boolean); return w.length !== new Set(w).size; },
    };
  });
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
    s.pending = []; s.orientation = 'hetero';
  });
}

(async () => {
  const browser = await chromium.launch();
  // ---------- 1. Пулы, клички, происхождения ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'nl', gender: 'f' });
    const r = await pg.evaluate(() => {
      const out = { counts: {}, bad: [], clash: [] };
      const late = ['it', 'au', 'tr', 'za', 'th', 'no', 'in', 'id', 'eg', 'ma', 'pl'];
      const okRe = /^[А-Яа-яЁё][А-Яа-яЁё’' \-]*$/u;
      for (const cc of Object.keys(countries)) {
        const f = countries[cc].names[0], m = countries[cc].names[1], sf = surnamePool256(cc, 'f'), sm = surnamePool256(cc, 'm');
        out.counts[cc] = { f: f.length, m: m.length, surnames: sm.length };
        for (const n of [...f, ...m, ...sf, ...sm]) if (!okRe.test(n)) out.bad.push(cc + ':' + n);
        if (cc !== 'eg') { const given = new Set([...f, ...m]); for (const n of new Set([...sf, ...sm])) if (given.has(n)) out.clash.push(cc + ':' + n); }
        if (typeof names271Data === 'object') {
          const d = names271Data.countries[cc];
          out.counts[cc].dataOk = !!d && d.f.every(n => f.includes(n)) && d.m.every(n => m.includes(n));
        }
      }
      out.late = late.map(cc => out.counts[cc]);
      out.ru = { alyona: countries.ru.names[0].includes('Алёна'), alena: countries.ru.names[0].includes('Алена'), sasha: countries.ru.names[0].includes('Саша'), misha: countries.ru.names[1].includes('Миша'), fyodorova: surnamePool256('ru', 'f').includes('Фёдорова'), fedorova: surnamePool256('ru', 'f').includes('Федорова') };
      out.particles = [...countries.nl.surnames, ...surnamePool256('za', 'f')].filter(n => /^(Ван|Де|Дю|Ле) /.test(n));
      out.za = ['Сипхо', 'Сифо'].filter(n => countries.za.names[1].includes(n));
      out.th = { n: surnamePool256('th', 'm').length, sisuk: surnamePool256('th', 'm').includes('Сисук'), srisuk: surnamePool256('th', 'm').includes('Срисук') };
      // клички
      const extras = cc => new Set(extraNames256[cc]?.pets || []);
      out.pets = {};
      for (const cc of ['ru', 'rs', 'jp', 'eg', 'pl']) {
        const ex = extras(cc), seen = { rabbit: new Set(), dog: new Set() };
        for (let i = 0; i < 300; i++) { seen.rabbit.add(suggestPetName182('rabbit', i % 2 ? 'm' : 'f', cc)); seen.dog.add(suggestPetName182('dog', 'm', cc)); }
        const pools = Object.keys(petKinds).flatMap(k => ['m', 'f'].map(x => (petNamePools182[cc + ':' + k + ':' + x] || []).length));
        out.pets[cc] = { rabbitExtras: [...seen.rabbit].filter(n => ex.has(n)), dogExtras: [...seen.dog].filter(n => ex.has(n)), rabbitKinds: seen.rabbit.size, minPool: Math.min(...pools), bad: Object.keys(petNamePools182).filter(k => k.startsWith(cc + ':')).flatMap(k => petNamePools182[k].map(x => x[0])).filter(n => !okRe.test(n)) };
      }
      // происхождение
      const tat = [];
      for (let i = 0; i < 40; i++) tat.push(familyName166('ru', 'f', 'татарское'));
      const pool = typeof names271Data === 'object' ? names271Data.origins['татарское'] : null;
      out.tatar = { sample: tat.slice(0, 3).map(x => x.given + ' ' + x.surname), fromPool: !!pool && tat.every(x => pool.f.includes(x.given)), gendered: tat.every(x => !/(ов|ев|ин)$/.test(x.surname)) };
      return out;
    });
    console.log('Пулы после слияния (жен./муж./фамилий):', Object.entries(r.counts).map(([cc, v]) => `${cc} ${v.f}/${v.m}/${v.surnames}`).join(', '));
    check(r.late.every(v => v.f >= 30 && v.m >= 30 && v.surnames >= 30), 'поздние страны: не меньше 30 имён на пол и 30 фамилий', r.late.map(v => `${v.f}/${v.m}/${v.surnames}`).join(' '));
    check(Object.keys(r.counts).length === 25 && Object.values(r.counts).every(v => v.dataOk === true), 'все 25 стран: пулы игры содержат списки names271Data');
    check(r.bad.length === 0, 'имена и фамилии — только русская кириллица (без ђ ј љ, латиницы)', r.bad.slice(0, 6).join(', '));
    check(r.clash.length === 0, 'фамилия не совпадает с личным именем той же страны (кроме Египта)', r.clash.slice(0, 8).join(', '));
    check(r.ru.alyona && !r.ru.alena && !r.ru.sasha && !r.ru.misha && r.ru.fyodorova && !r.ru.fedorova, 'ru: ё (Алёна, Фёдорова), без Саша/Миша во взрослых пулах', JSON.stringify(r.ru));
    check(r.particles.length === 0 && r.za.length === 0, 'nl/za: частицы строчные («ван дер Мерве»), za без Сипхо/Сифо', [...r.particles, ...r.za].join(', '));
    check(r.th.n >= 240 && r.th.sisuk && !r.th.srisuk, 'Таиланд: 240+ фамилий в новой транскрипции (Сисук, не Срисук)', JSON.stringify(r.th));
    check(Object.values(r.pets).every(p => !p.rabbitExtras.length && !p.dogExtras.length && p.rabbitKinds >= 25 && p.minPool >= 30 && !p.bad.length), 'клички: у кроликов свои, по полу; общие клички 256 не подмешаны всем видам; без сербских букв', JSON.stringify(r.pets).slice(0, 300));
    check(r.tatar.fromPool && r.tatar.gendered, 'происхождение «татарское»: имя из своего пула, фамилия в женской форме', r.tatar.sample.join(', '));
    check(errors.length === 0, 'пулы: без ошибок страницы', errors.slice(0, 2).join(' | '));
    // ---------- 2. Частоты фамилий, разбор имён ----------
    const f = await pg.evaluate(() => {
      const share = (cc, names) => { const n = 100000, c = {}; for (let i = 0; i < n; i++) { const x = identitySurname(cc, 'm'); c[x] = (c[x] || 0) + 1; } return Object.fromEntries(names.map(k => [k, Math.round((c[k] || 0) / n * 10000) / 100])); };
      const out = { kr: share('kr', ['Ким', 'Ли', 'Пак']), cn: share('cn', ['Ван', 'Ли', 'Чжан']) };
      // «Юн», «Ян»: все сочетания фамилии и личного имени
      const parse = (cc, gender) => { let bad = 0, total = 0; const ex = []; for (const sur of countries[cc].surnames.slice(0, 40)) for (const g of countries[cc].names[gender === 'm' ? 1 : 0].slice(0, 30)) { const p = { id: 'x', role: 'Знакомый', name: sur + ' ' + g, gender, country: cc, birthCountry: cc, alive: true }; identity256(p); total++; if (p.surname !== sur || p.givenName166 !== g) { bad++; if (ex.length < 3) ex.push(sur + ' ' + g + ' → ' + p.givenName166 + '|' + p.surname); } } return { bad, total, ex }; };
      out.kr2 = parse('kr', 'm'); out.cn2 = parse('cn', 'f'); out.cn3 = parse('cn', 'm');
      const fixed = ['Юн Минджун', 'Юн Чану'].map(n => { const p = { id: 'y', role: 'Друг', name: n, gender: 'm', country: 'kr', birthCountry: 'kr', alive: true }; identity256(p); return p.surname + '|' + p.givenName166; });
      out.yun = fixed;
      // живые NPC из генератора
      let live = 0;
      const liveEx = [];
      for (const cc of ['kr', 'cn', 'jp', 'eg', 'es', 'ru']) for (let i = 0; i < 60; i++) { const p = person('Знакомый', 30, i % 2 ? 'm' : 'f', cc); const parts = p.surnameParts256 || []; const words = p.name.split(' '); const ok = words.includes(String(p.givenName166).split(' ')[0]) && parts.join(' ') === p.surname && parts.every(x => p.name.includes(x)) && p.name.split(' ').length === (p.givenName166 + ' ' + p.surname).split(' ').length; if (!ok) { live++; if (liveEx.length < 4) liveEx.push(cc + ' ' + p.name + ' [' + p.givenName166 + '|' + p.surname + ']'); } }
      out.live = live; out.liveEx = liveEx;
      out.eg = Array.from({ length: 30 }, () => name('eg', 'm')).filter(n => n.split(' ').length !== 3);
      return out;
    });
    // Частые фамилии — с той же долей, что в таблице (остаток таблицы не раздувает их): 4 сигмы на 100 000 имён
    // (Ким ±0.5, Ван ±0.35); раздутие остатком — Ким +0.9, Ван +1.5.
    const sigma4 = v => 4 * Math.sqrt(v / 100 * (1 - v / 100) / 100000) * 100 + .05;
    const near = (cc, got) => Object.entries(got).every(([n, v]) => shareOf(cc, n) > 0 && Math.abs(v - shareOf(cc, n)) < sigma4(shareOf(cc, n)));
    const want = (cc, got) => Object.keys(got).map(n => n + ' ' + shareOf(cc, n)).join(', ');
    check(near('kr', f.kr) && shareOf('kr', 'Ким') > 20, 'Корея: фамилии по частоте из таблицы (Ким ~21%, Ли ~15%, Пак ~8%)', JSON.stringify(f.kr) + ' / таблица ' + want('kr', f.kr));
    check(near('cn', f.cn), 'Китай: фамилии по частоте из таблицы (Ван, Ли, Чжан ~7%), без раздувания на 20%', JSON.stringify(f.cn) + ' / таблица ' + want('cn', f.cn));
    check(f.kr2.bad === 0 && f.cn2.bad === 0 && f.cn3.bad === 0, 'разбор «фамилия имя»: «Юн», «Ян» и др. не меняются местами', `kr ${f.kr2.bad}/${f.kr2.total}, cn ${f.cn2.bad + f.cn3.bad}/${f.cn2.total + f.cn3.total} ${f.kr2.ex.concat(f.cn2.ex).join('; ')}`);
    check(f.yun.every(x => x.startsWith('Юн|')), 'kr «Юн Минджун»: фамилия Юн', f.yun.join(', '));
    check(f.live === 0, 'новые NPC: имя, фамилия и полное имя согласованы (kr, cn, jp, eg, es, ru)', 'расхождений ' + f.live + ' ' + f.liveEx.join('; '));
    check(f.eg.length === 0, 'Египет: имя из трёх слов — личное, отца, деда', f.eg.slice(0, 3).join(', '));
    await ctx.close();
  }

  // ---------- 3. Семья при рождении ----------
  {
    const { pg, errors, ctx } = await open(browser);
    const rows = [];
    for (const [country, gender] of [['ru', 'm'], ['ru', 'f'], ['pl', 'm'], ['pl', 'f'], ['rs', 'm'], ['de', 'f'], ['es', 'f'], ['mx', 'm'], ['br', 'm'], ['jp', 'f'], ['kr', 'm'], ['cn', 'f'], ['eg', 'm'], ['eg', 'f'], ['th', 'm'], ['nl', 'f'], ['tr', 'm'], ['in', 'f']]) {
      for (let k = 0; k < 2; k++) {
        await life(pg, { country, gender });
        rows.push(await pg.evaluate(() => {
          const birth = s.birthCountry || s.country, ps = s.people.filter(p => ['Мать', 'Отец'].includes(p.role));
          const dad = ps.find(p => p.role === 'Отец'), mom = ps.find(p => p.role === 'Мать');
          const birthParts = p => p.birthSurname271?.parts || p.marriageName271?.prior?.parts || p.surnameParts256 || [p.surname];
          const gs = (x, g, c) => genderSurname256(x, g, c);
          const masc = x => genderSurname256(genderSurname256(String(x || ''), 'm', 'ru'), 'm', 'pl');
          const cu = p => p.birthCountry || p.country;
          const sib = s.people.filter(p => ['Брат', 'Сестра'].includes(p.role));
          const grand = r => s.people.filter(p => p.role === r);
          const lineOf = (gp) => ps.find(p => p.bio27?.parents?.includes(gp.id));
          const res = { tag: birth + ':' + s.gender, player: s.name + ' ' + s.surname, mom: mom?.name, dad: dad?.name, sib: sib.map(p => p.name), gp: [...grand('Дедушка'), ...grand('Бабушка')].map(p => p.name + ' (' + lineOf(p)?.role + ')'), problems: [] };
          const P = m => res.problems.push(m);
          const sp = s.surnameParts256?.length ? s.surnameParts256 : [s.surname];
          // фамилия игрока
          if (dad && mom) {
            if (['es', 'mx'].includes(birth)) { if (sp[0] !== birthParts(dad)[0] || sp[1] !== birthParts(mom)[0]) P('es: не [отец, мать]'); }
            else if (birth === 'br') { if (sp[0] !== birthParts(mom).at(-1) || sp[1] !== birthParts(dad).at(-1)) P('br: не [мать, отец]'); }
            else if (birth === 'jp') { const jpPs = ps.filter(p => cu(p) === 'jp'); const want = dad.surname === mom.surname ? dad.surname : jpPs.length === 1 ? jpPs[0].surname : dad.surname; if (s.surname !== want) P('jp: не общая/японского родителя'); }
            else if (birth === 'eg' && cu(dad) === 'eg') { if (sp[0] !== dad.givenName166 || sp[1] !== birthParts(dad)[0]) P('eg: не имя отца и деда'); }
            else if (masc(s.surname) !== masc(birthParts(dad).join(' ')) && masc(s.surname) !== masc(dad.surname)) P('не фамилия отца: ' + s.surname + ' / ' + dad.surname);
          }
          if (['ru', 'pl'].includes(birth) && s.gender === 'm' && /(ова|ева|ина|ская|цкая)$/.test(s.surname)) P('мужчина с женской фамилией');
          if (['ru', 'pl'].includes(birth) && s.gender === 'f' && /(ов|ев|ин|ский|цкий)$/.test(s.surname)) P('женщина с мужской фамилией');
          // сиблинги
          for (const b of sib) {
            const same = masc(b.surname) === masc(s.surname);
            // 274: брат или сестра по маме или по папе (half274) — фамилия и происхождение от своих родителей.
            if (!same && !b.half274) P('сиблинг с другой фамилией: ' + b.name);
            if ((b.birthCountry || b.country) !== birth) P('сиблинг родился в другой стране');
            if (!b.half274 && (b.origins || []).join('/') !== (s.origins || []).join('/')) P('у сиблинга другое происхождение');
            if (b.givenName166 === s.name) P('сиблинг — тёзка игрока');
          }
          // бабушки и дедушки
          for (const gp of grand('Дедушка')) {
            const line = lineOf(gp); if (!line) continue;
            const bp = birthParts(line), rule = ['es', 'mx'].includes(cu(line)) ? 'es' : cu(line) === 'br' ? 'br' : cu(line) === 'eg' ? 'eg' : 'father';
            const gpp = gp.surnameParts256 || [gp.surname];
            if (rule === 'es' && bp.length > 1 && gpp[0] !== bp[0]) P('es: дедушка не по линии: ' + gp.name);
            else if (rule === 'br' && bp.length > 1 && gpp.at(-1) !== bp.at(-1)) P('br: дедушка не по линии: ' + gp.name);
            else if (rule === 'eg' && gp.givenName166 !== bp[0]) P('eg: дедушка — не имя из цепочки: ' + gp.name);
            else if (rule === 'father' && masc(gp.surname) !== masc(bp.join(' '))) P('дедушка не по линии: ' + gp.name + ' / ' + line.name);
          }
          // повторы
          const living = [s, ...s.people.filter(p => p.alive)];
          const full = living.map(p => p === s ? s.name + ' ' + s.surname : p.name);
          if (new Set(full).size !== full.length) P('два одинаковых полных имени в семье');
          if (mom && s.gender === 'f' && mom.givenName166 === s.name) P('мама и дочь — тёзки');
          if (dad && s.gender === 'm' && dad.givenName166 === s.name) P('папа и сын — тёзки');
          const entry = s.log.find(e => e.title === 'У этой истории появилось имя');
          if (entry && ps.some(p => !entry.text.includes(p.name))) P('в записи о рождении старые имена родителей');
          return res;
        }));
      }
    }
    const bad = rows.filter(r => r.problems.length);
    for (const r of bad.slice(0, 6)) console.log('     ', r.tag, r.player, '| мама', r.mom, '| папа', r.dad, '| сиблинги', r.sib.join(', '), '|', r.gp.join(', '), '→', r.problems.join('; '));
    const has = re => rows.filter(r => r.problems.some(p => re.test(p)));
    check(!has(/женской|мужской|не фамилия отца|es:|br:|jp:|eg: не имя/).length, 'фамилия игрока при рождении — по правилу страны и в своём роде (36 жизней, 15 стран)', has(/женской|мужской|не фамилия отца|es:|br:|jp:|eg: не имя/).map(r => r.tag + ' ' + r.player).slice(0, 4).join('; '));
    check(!has(/сиблинг/).length, 'сиблинг: фамилия, страна рождения и происхождение как у игрока', has(/сиблинг/).map(r => r.sib.join(', ')).slice(0, 3).join('; '));
    check(!has(/дедушка/).length, 'дедушка — по линии своего ребёнка (у es/br — своя часть, у Египта — имя из цепочки)', has(/дедушка/).map(r => r.gp.join(', ')).slice(0, 2).join('; '));
    check(!has(/одинаковых|тёзки/).length, 'в семье нет полных тёзок, мама и дочь, папа и сын — разные имена', has(/одинаковых|тёзки/).map(r => r.tag).join(', '));
    check(!has(/записи о рождении/).length, 'запись о рождении — с нынешними именами родителей');
    const eg = rows.find(r => r.tag.startsWith('eg'));
    console.log('      пример eg:', eg?.player, '| папа', eg?.dad, '|', eg?.gp.join(', '));
    // Имя, введённое при создании
    await life(pg, { country: 'ru', gender: 'f', name: 'Анна Даль' });
    const typed = await pg.evaluate(() => ({ name: s.name, surname: s.surname, dad: s.people.find(p => p.role === 'Отец')?.surname }));
    check(typed.name === 'Анна' && typed.surname === 'Даль' && typed.dad === 'Даль', 'введено «Анна Даль»: имя Анна, фамилия Даль, у папы та же', JSON.stringify(typed));
    await life(pg, { country: 'pl', gender: 'f', name: 'Ewa' });
    const typed2 = await pg.evaluate(() => ({ name: s.name, surname: s.surname, dad: s.people.find(p => p.role === 'Отец')?.surname, want: genderSurname256(s.people.find(p => p.role === 'Отец')?.surname || '', 'f', 'pl') }));
    check(!/(ский|цкий)$/.test(typed2.surname) && (!typed2.dad || typed2.surname === typed2.want), 'введено только имя: фамилия семьи в женской форме (pl)', JSON.stringify(typed2));
    check(errors.length === 0, 'старт: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 4. Брак, развод, дети (ru, es, nl) ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'f', startAge: '18' });
    const r = await pg.evaluate(() => {
      const out = {};
      s.age = 28; const birthName = s.surname;
      const p1 = T.mk('Партнер', 29, 'm');
      marriageDialog(p1.id); T.click(/Сделать предложение/);
      out.m1 = T.modal();
      const join = out.m1.buttons.find(b => /Соединить/.test(b)) || '';
      T.click(/Соединить/); T.clean();
      out.join = { label: join, result: s.surname, log: (s.log.find(e => e.title === 'Теперь в браке') || {}).text };
      // развод — вернуть добрачную
      marriageDialog(p1.id); T.click(/Развестись/); out.d1 = T.modal(); T.click(/Сохранить нынешнюю|Оставить нынешнюю/); T.clean();
      p1.role = 'Бывший партнер';
      // второй брак — оставить свою (двойную), затем развод: фамилия при рождении доступна
      const p2 = T.mk('Партнер', 30, 'm');
      marriageDialog(p2.id); T.click(/Сделать предложение/); T.click(/Оставить свою/); T.clean();
      out.keepLog = (s.log.find(e => e.title === 'Теперь в браке') || {}).text;
      marriageDialog(p2.id); T.click(/Развестись/); out.d2 = T.modal(); T.click(/при рождении/) || T.click(/Сохранить нынешнюю|Оставить нынешнюю/); T.clean();
      out.afterD2 = s.surname; out.birthName = birthName;
      p2.role = 'Бывший партнер';
      // предложение партнёра: окно фамилии через очередь
      const p3 = T.mk('Партнер', 31, 'm'); p3.cohabit = true;
      const q = offerInitiative68(p3, 'marry');
      out.npc = { offered: !!q };
      if (q) {
        respondInitiative68(q.id, true);
        out.npc.pending = s.pending.map(x => x.type);
        if ($('#modal').open) closeModal();
        resolvePending(); out.npc.modal = T.modal();
        const before = s.surname;
        T.click(/Взять фамилию партнёра/); if ($('#modal').open) closeModal();
        out.npc.surname = s.surname; out.npc.want = genderSurname256(p3.surname, 'f', 'ru'); out.npc.pre = s.preMarriageSurname256?.surname; out.npc.before = before; out.npc.married = p3.married;
        out.npc.pendingAfter = s.pending.filter(x => x.type === 'marriageName271').length;
        // развод по инициативе партнёра
        s.pending = [];
        const d = offerInitiative68(p3, 'divorce');
        if (d) { respondInitiative68(d.id, true); if ($('#modal').open) closeModal(); resolvePending(); out.npc.divorce = T.modal(); T.click(/Вернуть добрачную/); if ($('#modal').open) closeModal(); out.npc.afterDivorce = s.surname; }
        else out.npc.divorceWhy = initiativeWhy68(p3, 'divorce');
      }
      return out;
    });
    const [a, b] = (r.join.label.split('·')[1] || '').trim().split('-');
    check(r.join.label && r.join.label.includes(r.join.result), 'брак: «Соединить фамилии» — подсказка совпадает с итогом', `${r.join.label} → ${r.join.result}`);
    check(!/(ов|ев|ин)$/.test(a || '') && !/(ов|ев|ин)$/.test(b || ''), 'брак: обе части двойной фамилии в женской форме', r.join.result);
    check(r.keepLog && !/Ваша фамилия теперь/.test(r.keepLog), 'брак: «Оставить свою» — без «Ваша фамилия теперь …» в записи', r.keepLog);
    check(r.d2.buttons.some(b => /при рождении/.test(b) && b.includes(r.birthName)) && r.afterD2 === r.birthName, 'второй развод: можно вернуть фамилию при рождении', r.d2.buttons.join(' | ') + ' → ' + r.afterD2);
    check(r.npc.offered && r.npc.modal?.title === 'Фамилия после свадьбы' && r.npc.surname === r.npc.want && r.npc.pre === r.npc.before && r.npc.married && r.npc.pendingAfter === 0, 'предложение партнёра: окно фамилии через очередь, брак один', JSON.stringify(r.npc).slice(0, 300));
    check(r.npc.divorce?.open && r.npc.divorce.title === 'Фамилия после развода' && r.npc.divorce.buttons.some(b => /^Вернуть добрачную/.test(b)) && r.npc.afterDivorce === r.npc.before, 'развод по инициативе партнёра: окно с «Вернуть добрачную», фамилия вернулась', JSON.stringify({ d: r.npc.divorce, after: r.npc.afterDivorce, why: r.npc.divorceWhy }));
    // es: удвоение после фамилии супруга; ru-мама за границей
    await life(pg, { country: 'es', gender: 'f', startAge: '18' });
    const es = await pg.evaluate(() => {
      s.age = 28; const own = [...s.surnameParts256];
      const p1 = T.mk('Партнер', 29, 'm');
      marriageDialog(p1.id); T.click(/Сделать предложение/); T.click(/Взять фамилию партнёра/); T.clean();
      const c1 = T.birth(p1.id, 'birth');
      const menu = childChoices256(c1, childParents256(c1)).map(o => o.label + ' · ' + o.parts.join(o.joiner));
      return { player: s.surname, own, partner: p1.surname, partnerParts: [...(p1.surnameParts256 || [p1.surname])], child: c1.surname, parts: c1.surnameParts256, menu };
    });
    check((!T_repeats(es.child) || es.partnerParts[0] === es.own[0]) && es.parts[0] === es.partnerParts[0] && es.parts[1] === es.own[0], 'es: после фамилии супруга у ребёнка [отец, мать при рождении], без «Мартинес Мартинес»', `${es.player} → ${es.child} | ${es.menu.join(' / ')}`);
    check(new Set(es.menu.map(x => x.split(' · ')[1])).size === es.menu.length, 'es: в меню фамилии ребёнка нет одинаковых вариантов', es.menu.join(' / '));
    // es: семья колумбийского, венесуэльского, перуанского происхождения — две фамилии двумя частями, у ребёнка ровно две
    await life(pg, { country: 'es', gender: 'f', startAge: '18' });
    const co = await pg.evaluate(() => {
      s.age = 28; const own = [...s.surnameParts256];
      const origins = ['колумбийское', 'венесуэльское', 'перуанское', 'португальское', 'каталонское'], spaced = [];
      let total = 0;
      for (let i = 0; i < 200; i++) {
        const o = origins[i % origins.length], p = person('Знакомый', 30, i % 2 ? 'm' : 'f', 'es');
        p.origins = [o]; assignFamilyName166(p, 'es', o); total++;
        const parts = p.surnameParts256 || [];
        if (parts.length !== 2 || parts.some(x => x.includes(' ')) || parts.join(' ') !== p.surname) spaced.push(o + ': ' + p.name + ' ' + JSON.stringify(parts));
      }
      const dad = T.mk('Партнер', 29, 'm'); dad.origins = ['колумбийское']; assignFamilyName166(dad, 'es', 'колумбийское');
      const dadParts = [...(dad.surnameParts256 || [])];
      marriageDialog(dad.id); T.click(/Сделать предложение/); T.click(/Оставить свою/); T.clean();
      const c = T.birth(dad.id, 'birth');
      const menu = c ? childChoices256(c, childParents256(c)).map(o => o.parts) : [];
      return { spaced: spaced.slice(0, 4), n: spaced.length, total, dad: dad.name, dadParts, own, child: c?.surnameParts256, menu };
    });
    check(co.n === 0, 'es: колумбийская и другая испаноязычная семья — две фамилии двумя частями', `${co.n}/${co.total} ` + co.spaced.join('; '));
    // (у мамы своя фамилия может быть из двух слов — «Айт Талеб» в марокканской семье; это одна фамилия)
    check(co.dadParts.length === 2 && co.child?.length === 2 && co.child[0] === co.dadParts[0] && co.child[1] === co.own[0] && co.dadParts.every(w => !w.includes(' ')) && co.menu.every(x => x.length <= 2 && !x.some(w => co.dadParts.join(' ') === w)), 'es: ребёнок отца колумбийского происхождения — ровно [первая отца, первая матери], без трёх фамилий', `${co.dad} ${JSON.stringify(co.dadParts)} + ${JSON.stringify(co.own)} → ${JSON.stringify(co.child)} | меню ${JSON.stringify(co.menu)}`);
    await life(pg, { country: 'ru', gender: 'f', startAge: '18' });
    const abroad = await pg.evaluate(() => {
      s.age = 30; s.country = 'nl'; s.housing.city = cities.nl[0];
      const p1 = T.mk('Партнер', 31, 'm', 'nl');
      const c = { id: 'kid', role: 'Ребенок', gender: 'm', age: 0, country: 'nl', birthCountry: 'nl', alive: true };
      // мамина фамилия в мужской форме; несклоняемая («Черных», «Шевченко») — как есть
      const fem = s.surname, masc = genderSurname256(fem, 'm', 'ru'), all = childChoices256(c, [s, p1]).map(o => o.parts.join(o.joiner));
      return { fem, masc, born: s.birthCountry, all, mine: all.filter(x => x.split(/[\s-]/).includes(masc)), femLeft: fem !== masc && all.some(x => x.split(/[\s-]/).includes(fem)) };
    });
    check(abroad.born === 'ru' && abroad.mine.length && !abroad.femLeft, 'сын русской мамы в Нидерландах: фамилия мамы в мужской форме', JSON.stringify(abroad));
    check(errors.length === 0, 'брак и развод: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 5. Япония, Египет, Корея ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'jp', gender: 'f', startAge: '18' });
    const jp = await pg.evaluate(() => {
      const out = {}; s.age = 28;
      const p1 = T.mk('Партнер', 30, 'm', 'jp'); p1.birthCountry = 'jp';
      marriageDialog(p1.id); T.click(/Сделать предложение/); out.m = T.modal();
      const mine = s.surname, theirs = p1.surname;
      T.click(/^Ваша/); T.clean();
      out.partnerAfter = p1.surname; out.mine = mine; out.theirs = theirs; out.married = p1.married;
      const c = T.birth(p1.id, 'birth');
      out.child = c && childChoices256(c, childParents256(c)).map(o => o.label + ' · ' + o.parts.join(o.joiner));
      out.childSurname = c?.surname;
      marriageDialog(p1.id); T.click(/Развестись/); T.clean();
      out.partnerBack = p1.surname;
      p1.role = 'Бывший партнер';
      // берёт фамилию партнёра — при разводе первым идёт «Вернуть добрачную»
      const p2 = T.mk('Партнер', 31, 'm', 'jp'); p2.birthCountry = 'jp';
      marriageDialog(p2.id); T.click(/Сделать предложение/); T.click(/^Партнёра/); T.clean();
      out.took = s.surname === p2.surname;
      marriageDialog(p2.id); T.click(/Развестись/); out.div = T.modal(); T.click(/Вернуть добрачную|Сохранить нынешнюю|Оставить нынешнюю/); T.clean();
      out.p2married = p2.married;
      p2.role = 'Бывший партнер';
      // с иностранцем — свободный выбор, каждый со своей
      const p3 = T.mk('Партнер', 31, 'm', 'us'); p3.birthCountry = 'us';
      marriageDialog(p3.id); T.click(/Сделать предложение/); out.foreign = T.modal(); T.clean();
      return out;
    });
    check(jp.m.title === 'Общая фамилия' && jp.m.buttons.length === 2, 'Япония, оба из Японии: общая фамилия — «ваша» или «партнёра»', jp.m.title + ' | ' + jp.m.buttons.join(' | '));
    check(jp.married && jp.partnerAfter === jp.mine, 'Япония: выбрали вашу — партнёр тоже переименован', `${jp.theirs} → ${jp.partnerAfter}`);
    check(jp.child && /Общая фамилия семьи/.test(jp.child[0]) && !jp.child.some(x => /Двойная|Обе/.test(x)) && jp.childSurname === jp.mine, 'Япония: ребёнок получает общую фамилию, двойной нет', (jp.child || []).join(' / '));
    check(jp.partnerBack === jp.theirs, 'Япония, развод: партнёр возвращает свою фамилию', jp.partnerBack);
    check(jp.took && /^Вернуть добрачную/.test(jp.div.buttons[0] || ''), 'Япония, развод: кто менял — по умолчанию возвращает прежнюю', jp.div.buttons.join(' | '));
    check(jp.foreign.title === 'Фамилия после свадьбы' && /Оставить свою/.test(jp.foreign.buttons[0] || ''), 'Япония и иностранец: каждый со своей, выбор свободный', jp.foreign.buttons.join(' | '));
    // «Японец» везде один: родился в Японии. Пара NPC, оба из Японии, у мужа китайское происхождение — общая фамилия;
    // родившийся за границей — со своей. Ребёнок таких родителей с разными фамилиями — первой фамилия отца.
    const jpn = await pg.evaluate(() => {
      const mk = (g, born, origin) => { const p = T.mk('Знакомый', 30, g, 'jp'); p.birthCountry = born; if (origin) p.origins = [origin]; return p; };
      const out = {};
      const a = mk('m', 'jp', 'китайское'), b = mk('f', 'jp', 'японское');
      setPersonName256(a, a.givenName166, ['Ло'], ' '); setPersonName256(b, b.givenName166, ['Кикути'], ' ');
      if (typeof coupleName271 === 'function') coupleName271(a, b, 'jp');
      out.both = { a: a.surname, b: b.surname };
      const c = mk('m', 'cn', 'китайское'), d = mk('f', 'jp', 'японское');
      setPersonName256(c, c.givenName166, ['Ван'], ' '); setPersonName256(d, d.givenName166, ['Икэда'], ' ');
      if (typeof coupleName271 === 'function') coupleName271(c, d, 'jp');
      out.mixed = { c: c.surname, d: d.surname };
      const e = mk('m', 'jp', 'корейское'), f = mk('f', 'jp', 'японское');
      setPersonName256(e, e.givenName166, ['Сим'], ' '); setPersonName256(f, f.givenName166, ['Катаяма'], ' ');
      const kid = { id: 'kjp', role: 'Ребенок', gender: 'f', age: 0, country: 'jp', birthCountry: 'jp', alive: true };
      out.kid = childChoices256(kid, [e, f]).map(o => o.parts.join(o.joiner));
      const kid2 = { id: 'kjp2', role: 'Ребенок', gender: 'f', age: 0, country: 'jp', birthCountry: 'jp', alive: true };
      out.kid2 = childChoices256(kid2, [c, d]).map(o => o.parts.join(o.joiner));
      return out;
    });
    // Бразилия: мама итальянского происхождения добавила фамилию мужа («Паола Корси Коста») — ребёнок «Корси Коста», не «Коста Коста»
    const brm = await pg.evaluate(() => {
      const mom = T.mk('Знакомый', 30, 'f', 'br'), dad = T.mk('Знакомый', 32, 'm', 'br');
      mom.birthCountry = dad.birthCountry = 'br'; mom.origins = ['итальянское']; dad.origins = ['бразильское'];
      setPersonName256(mom, mom.givenName166, ['Корси'], ' '); setPersonName256(dad, dad.givenName166, ['Коррейя', 'Коста'], ' ');
      const rnd = Math.random; Math.random = () => 0.1;
      try { if (typeof coupleName271 === 'function') coupleName271(mom, dad, 'br'); else { setPersonName256(mom, mom.givenName166, ['Корси', 'Коста'], ' '); } } finally { Math.random = rnd; }
      const kid = { id: 'kbr', role: 'Ребенок', gender: 'm', age: 0, country: 'br', birthCountry: 'br', alive: true };
      return { mom: mom.surname, kid: childChoices256(kid, [dad, mom]).map(o => o.parts.join(o.joiner)) };
    });
    check(brm.mom === 'Корси Коста' && brm.kid[0] === 'Корси Коста' && !brm.kid.some(x => T_repeats(x)), 'Бразилия: мама добавила фамилию мужа — у ребёнка её своя фамилия и фамилия отца, без «Коста Коста»', JSON.stringify(brm));
    check(jpn.both.a === jpn.both.b && jpn.mixed.c === 'Ван' && jpn.mixed.d === 'Икэда' && jpn.kid[0] === 'Сим' && jpn.kid2[0] === 'Икэда', 'Япония: «японец» — родился в Японии (общая фамилия NPC, фамилия ребёнка), происхождение не важно', JSON.stringify(jpn));
    await life(pg, { country: 'eg', gender: 'm', startAge: '18' });
    const eg = await pg.evaluate(() => {
      const out = {}; s.age = 28;
      out.player = s.name + ' ' + s.surname;
      const p1 = T.mk('Партнер', 27, 'f', 'eg'); p1.birthCountry = 'eg';
      const before = [s.surname, p1.surname];
      marriageDialog(p1.id); T.click(/Сделать предложение/); out.modal = T.modal().title; T.clean();
      out.same = s.surname === before[0] && p1.surname === before[1]; out.married = p1.married;
      const c = T.birth(p1.id, 'birth');
      out.child = c?.surnameParts256; out.want = [s.name, (s.surnameParts256 || [])[0]];
      out.childWords = c?.name.split(' ').length;
      const abroad = { id: 'k2', role: 'Ребенок', gender: 'f', age: 0, country: 'nl', birthCountry: 'nl', alive: true };
      out.abroad = childChoices256(abroad, [s, p1])[0]?.parts;
      const noDad = { id: 'k3', role: 'Ребенок', gender: 'f', age: 0, country: 'eg', birthCountry: 'eg', alive: true };
      const ch = childChoices256(noDad, [p1])[0];
      out.noDad = ch?.parts; out.male = countries.eg.names[1];
      return out;
    });
    check(eg.married && eg.same && eg.modal !== 'Фамилия после свадьбы', 'Египет: брак без окна фамилии, имена не меняются', eg.player + ' · ' + eg.modal);
    check(eg.child && eg.child[0] === eg.want[0] && eg.child[1] === eg.want[1] && eg.childWords === 3, 'Египет: ребёнок — своё имя, имя отца, имя деда', JSON.stringify(eg.child) + ' / ' + JSON.stringify(eg.want));
    check(eg.abroad && eg.abroad.length === 1 && eg.abroad[0] === eg.want[0], 'Египет, ребёнок родился за границей: имя отца — постоянная фамилия', JSON.stringify(eg.abroad));
    check(eg.noDad && eg.noDad.length === 2 && eg.noDad.every(n => eg.male.includes(n)), 'Египет, отец неизвестен: случайная цепочка мужских имён', JSON.stringify(eg.noDad));
    await life(pg, { country: 'kr', gender: 'f', startAge: '18' });
    const kr = await pg.evaluate(() => {
      s.age = 28; const p1 = T.mk('Партнер', 29, 'm', 'kr'); p1.birthCountry = 'kr';
      marriageDialog(p1.id); T.click(/Сделать предложение/); T.click(/Оставить свою/); T.clean();
      const c = T.birth(p1.id, 'birth');
      return { child: c?.surname, dad: p1.surname, menu: childChoices256(c, childParents256(c)).map(o => o.label) };
    });
    check(kr.child === kr.dad && !kr.menu.some(x => /Двойная/.test(x)), 'Корея: ребёнок по умолчанию с фамилией отца, без двойной', JSON.stringify(kr));
    const notes = await pg.evaluate(() => ['eg', 'jp', 'kr', 'cn', 'th', 'ma', 'in', 'id', 'tr', 'no'].map(c => [c, namingNote256(c)]));
    const dflt = await pg.evaluate(() => namingNote256('xx'));
    check(notes.every(([, n]) => n !== dflt && !/игров(ая|ой) модел/.test(n)), 'заметки об именах для eg, jp, kr, cn, th, ma, in, id, tr, no', notes.filter(([, n]) => n === dflt).map(([c]) => c).join(', '));
    check(errors.length === 0, 'Япония, Египет, Корея: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 6. Приёмные дети, NPC, друг-подросток, коллега, карточка ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'm', startAge: '18' });
    const r = await pg.evaluate(() => {
      const out = {}; s.age = 30;
      const p1 = T.mk('Партнер', 29, 'f');
      marriageDialog(p1.id); T.click(/Сделать предложение/); T.click(/Оставить свою/); T.clean();
      const fam = g => [genderSurname256(s.surname, g, 'ru'), genderSurname256(p1.surname, g, 'ru')];
      const a1 = T.birth(null, 'adoption');
      out.adopt = { name: a1?.name, ok: !!a1 && fam(a1.gender).includes(a1.surname), parents: a1?.nameParents256, pending: !!a1?.namePending256 };
      // по плану (game.js nextYear)
      const before = new Set(s.people.map(p => p.id));
      s.familyLife.birth = null; s.flags.childPending = { due: s.year, method: 'adoption', partnerId: p1.id }; s.pending = [];
      rollYear(); if ($('#modal').open) closeModal(); s.pending = [];
      const a2 = s.people.find(p => !before.has(p.id) && p.role === 'Ребенок');
      out.plan = { name: a2?.name, ok: !!a2 && fam(a2.gender).includes(a2.surname), pending: !!a2?.namePending256, decision: !!a2 && decisionItems24().some(d => d.ref?.id === a2.id) };
      // однополая пара NPC
      familyState27();
      const sis = T.mk('Сестра', 32, 'f'); sis.bio27 = { parents: [], children: [], history: [], education: [], study: null, job: null, skill: 35, ambition: .5, educationWish: .3, childrenWish: 1, last: s.clock.ticks, born: s.clock.ticks - 384, health: 90 };
      const wife = T.mk('Партнёр близкого', 31, 'f'); wife.bio27 = { ...sis.bio27, children: [], history: [] };
      const u = { id: 'u271', a: sis.id, b: wife.id, status: 'together', since: s.clock.ticks, due: s.clock.ticks };
      s.family27.unions.push(u);
      const kid = birthKin27(u);
      out.sameSex = { name: kid?.name, adopted: !!kid?.adopted49, ok: !!kid && [sis, wife].some(x => genderSurname256(x.surname, kid.gender, 'ru') === kid.surname) };
      // свадьба и развод NPC: обычай страны
      const bro = T.mk('Брат', 30, 'm'); bro.bio27 = { ...sis.bio27, children: [], history: [] };
      const bride = T.mk('Партнёр близкого', 29, 'f'); bride.bio27 = { ...sis.bio27, children: [], history: [] };
      bro.npcMarried54 = bride.npcMarried54 = true; adultState55(bro).partner = bride.id; adultState55(bride).partner = bro.id;
      s.family27.unions.push({ id: 'u272', a: bro.id, b: bride.id, status: 'together', since: s.clock.ticks });
      const maiden = bride.surname, rnd = Math.random; Math.random = () => 0.1;
      try { if (typeof npcNames271 === 'function') npcNames271(); else autonomousMonth(); } finally { Math.random = rnd; }
      out.npcWed = { maiden, now: bride.surname, want: genderSurname256(bro.surname, 'f', 'ru') };
      s.family27.unions.find(x => x.id === 'u272').status = 'separated'; bro.npcMarried54 = bride.npcMarried54 = false; adultState55(bro).partner = null; adultState55(bride).partner = null;
      Math.random = () => 0.1;
      try { if (typeof npcNames271 === 'function') npcNames271(); else autonomousMonth(); } finally { Math.random = rnd; }
      out.npcWed.after = bride.surname;
      // повтор имени в семье: ребёнку выпало имя мамы
      const keep = familyName166; familyName166 = () => ({ given: p1.givenName166, surname: 'Тест' });
      let c3; try { c3 = T.birth(p1.id, 'birth'); } finally { familyName166 = keep; }
      out.dup = { mom: p1.givenName166, kid: c3?.givenName166, gender: c3?.gender };
      if ($('#modal').open) closeModal(); s.pending = [];
      // друг-подросток
      s.age = 15; out.teen = [];
      for (let i = 0; i < 12; i++) {
        const g = i % 2 ? 'f' : 'm'; const qn = name(s.country, g);
        s.pending = [{ type: 'teen', name: qn }]; resolvePending(); T.click(/репетицию/);
        const f = s.people.at(-1); out.teen.push({ qn, g, name: f.name, gender: f.gender, given: f.givenName166, surname: f.surname });
        if ($('#modal').open) closeModal(); s.pending = [];
      }
      // отказ от приглашения: имя из него не достаётся другу, которого в тот же месяц создаёт что-то другое
      out.teenLeak = [];
      for (let i = 0; i < 6; i++) {
        const qn = name(s.country, i % 2 ? 'f' : 'm');
        s.pending = [{ type: 'teen', name: qn }]; resolvePending(); T.click(/Остаться/);
        if ($('#modal').open) closeModal(); s.pending = [];
        const p = person('Друг', s.age);
        if (p.name === qn) out.teenLeak.push(qn);
      }
      // приёмный ребёнок мамы и её партнёрши: в карточке «В семье появился младший ребёнок» — нынешнее имя
      const mom = s.people.find(p => p.role === 'Мать' && p.alive);
      if (mom) {
        mom.bio27 ??= { parents: [], children: [], history: [], education: [], study: null, job: null, skill: 35, ambition: .5, educationWish: .3, childrenWish: 1, last: s.clock.ticks, born: s.clock.ticks - mom.age * 12, health: 90 };
        const wife2 = T.mk('Партнёр близкого', mom.age, 'f'); wife2.bio27 = { parents: [], children: [], history: [], education: [], study: null, job: null, skill: 35, ambition: .5, educationWish: .3, childrenWish: 1, last: s.clock.ticks, born: s.clock.ticks - wife2.age * 12, health: 90 };
        s.family27.unions = s.family27.unions.filter(x => !([x.a, x.b].includes(mom.id) && x.status === 'together'));
        const u3 = { id: 'u273', a: mom.id, b: wife2.id, status: 'together', since: s.clock.ticks, due: s.clock.ticks };
        s.family27.unions.push(u3);
        const kid2 = birthKin27(u3);
        const notes = (life61().notices || []).filter(n => n.personId === kid2?.id);
        out.adoptNotice = { kid: kid2?.name, adopted: !!kid2?.adopted49, notes: notes.map(n => n.title + ': ' + n.note), ok: !!kid2 && notes.length > 0 && notes.every(n => String(n.note).includes(kid2.name)) };
        if ($('#modal').open) closeModal(); s.pending = [];
      }
      // коллега из истории про аренду
      s.age = 25; s.rentStory = null; s.people = s.people.filter(p => p.role !== 'Друг');
      try { beginRentStory(); } catch (e) { out.rentErr = e.message; }
      const col = s.rentStory && s.people.find(p => p.id === s.rentStory.colleagueId);
      out.rent = col && { name: col.name, given: col.givenName166, surname: col.surname };
      if ($('#modal').open) closeModal(); s.pending = [];
      return out;
    });
    check(r.adopt.ok && r.adopt.pending && (r.adopt.parents || []).length === 2, 'усыновление в браке: фамилия семьи, оба родителя в выборе имени', JSON.stringify(r.adopt));
    check(r.plan.ok && r.plan.pending && r.plan.decision, 'ребёнок по плану (раз в год): фамилия семьи и решение «Выбрать имя ребёнку»', JSON.stringify(r.plan));
    check(r.sameSex.adopted && r.sameSex.ok, 'однополая пара NPC: у приёмного ребёнка фамилия одного из родителей', JSON.stringify(r.sameSex));
    check(r.npcWed.now === r.npcWed.want && r.npcWed.after === r.npcWed.maiden, 'свадьба NPC в России: жена берёт фамилию мужа; после развода — возвращает', JSON.stringify(r.npcWed));
    check(r.dup.kid && r.dup.kid !== r.dup.mom, 'новорождённая не тёзка мамы', JSON.stringify(r.dup));
    const teenBad = r.teen.filter(t => t.name !== t.qn || t.gender !== t.g || !t.name.split(' ').includes(t.given));
    check(teenBad.length === 0, 'друг-подросток: пол по имени из приглашения, поля имени совпадают', teenBad.slice(0, 2).map(t => JSON.stringify(t)).join('; '));
    check(r.teenLeak.length === 0, 'друг-подросток: после отказа имя из приглашения не достаётся другому новому другу', r.teenLeak.join(', '));
    check(r.adoptNotice?.ok, 'приёмный ребёнок мамы: в карточке «В семье появился младший ребёнок» — нынешнее имя', JSON.stringify(r.adoptNotice));
    check(r.rent && r.rent.name.split(' ').includes(r.rent.given) && r.rent.name.includes(r.rent.surname), 'коллега из истории про аренду: имя и фамилия совпадают с видимым именем', JSON.stringify(r.rent || r.rentErr));
    await life(pg, { country: 'jp', gender: 'm' });
    const card = await pg.evaluate(() => {
      const ps = s.people.filter(p => ['Мать', 'Отец'].includes(p.role));
      const sib = T.mk('Брат', 3, 'm', 'jp'); sib.birthCountry = 'jp'; familyState27(); sib.bio27.parents = ps.map(p => p.id); familyState27();
      return ps.map(p => familyChildNames200(p));
    });
    check(card.every(t => t.split(', ').every(n => !T_repeats(n))), '«Дети» в карточке родителя: фамилия не повторяется («Фудзимото Кадзуки Фудзимото»)', card.join(' / '));
    check(errors.length === 0, 'приёмные, NPC, подросток: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 7. Старые сохранения ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'ru', gender: 'm', startAge: '18' });
    const r = await pg.evaluate(() => {
      s.age = 30;
      const p1 = T.mk('Партнер', 29, 'f');
      marriageDialog(p1.id); T.click(/Сделать предложение/); T.click(/Оставить свою/); T.clean();
      T.birth(p1.id, 'birth'); T.birth(p1.id, 'birth');
      // мигранты во втором поколении с порядком «фамилия имя», корейский друг «Юн Минджун»
      const z = person('Знакомый', 30, 'm', 'nl'); z.name = 'Чжан Цзе'; z.birthCountry = 'nl'; s.people.push(z);
      const y = person('Друг', 30, 'm', 'kr'); y.name = 'Юн Минджун'; y.birthCountry = 'kr'; s.people.push(y);
      for (const q of [z, y]) for (const k of ['naming256', 'surnameParts256', 'surnameJoiner256', 'birthSurname256', 'givenName166', 'surname']) delete q[k];
      if (typeof flushSave264 === 'function') flushSave264();
      const snap = () => new Map([['PLAYER', s.name + '|' + s.surname], ...s.people.map(p => [p.id, p.name])]);
      const before = snap(), json = JSON.stringify(s), out = {};
      const variants = {
        same: x => x,
        strip256: x => { for (const p of [x, ...x.people]) for (const k of ['naming256', 'surnameParts256', 'surnameJoiner256', 'birthSurname256', 'legalSurnameParts256', 'legalSurname256', 'preMarriageSurname256', 'nameParents256', 'namePending256', 'nameChosen256', 'marriageName271', 'birthSurname271', 'surnameCulture271', 'nameStyle271']) delete p[k]; delete x.familyNames256; return x; },
        strip166: x => { for (const p of [x, ...x.people]) { for (const k of ['naming256', 'surnameParts256', 'surnameJoiner256', 'birthSurname256', 'nameParents256', 'namePending256', 'nameChosen256', 'givenName166', 'inheritedSurname255', 'marriageName271', 'birthSurname271', 'surnameCulture271', 'nameStyle271']) delete p[k]; if (p !== x) delete p.surname; } delete x.familyNames256; return x; },
      };
      for (const [k, f] of Object.entries(variants)) {
        const lifeObj = f(JSON.parse(json)); lifeObj.saveId = 'v271-' + k;
        localStorage.setItem(LIFE_PREFIX + 'v271-' + k, JSON.stringify(lifeObj));
        loadCharacter('v271-' + k); if ($('#modal').open) closeModal();
        const after = snap(), diffs = [];
        for (const [id, v] of before) if (after.get(id) !== v) diffs.push(v + ' → ' + after.get(id));
        out[k] = diffs;
        if (k === 'strip166') out.yun = s.people.find(p => p.name === 'Юн Минджун')?.surname;
      }
      // до 255: детям давали фамилию игрока без рода
      const old = JSON.parse(json);
      for (const p of [old, ...old.people]) for (const k of ['naming256', 'surnameParts256', 'surnameJoiner256', 'birthSurname256', 'nameParents256', 'namePending256', 'nameChosen256']) delete p[k];
      delete old.namesFixed255; delete old.familyNames256;
      for (const p of old.people.filter(p => p.role === 'Ребенок')) { delete p.surname; p.name = p.givenName166 + ' ' + (p.gender === 'f' ? 'Петрова' : 'Петров'); }
      old.saveId = 'v271-pre255'; localStorage.setItem(LIFE_PREFIX + 'v271-pre255', JSON.stringify(old));
      loadCharacter('v271-pre255'); if ($('#modal').open) closeModal();
      out.pre255 = s.people.filter(p => p.role === 'Ребенок').map(p => ({ g: p.gender, name: p.name, surname: p.surname, want: genderSurname256(s.surname, p.gender, 'ru') }));
      out.player = s.surname;
      return out;
    });
    check(r.same.length === 0, 'сохранение и загрузка: имена не меняются', r.same.slice(0, 3).join('; '));
    check(r.strip256.length === 0, 'старое сохранение (до 256): имена не меняются', r.strip256.slice(0, 3).join('; '));
    check(r.strip166.length === 0 && r.yun === 'Юн', 'старое сохранение (до 166): имена и порядок слов не меняются, «Юн Минджун» — фамилия Юн', r.strip166.slice(0, 3).join('; ') + ' · ' + r.yun);
    check(r.pre255.length && r.pre255.every(p => p.surname === p.want), 'сохранение до 255: дети получают фамилию игрока в своём роде', JSON.stringify(r.pre255));
    check(errors.length === 0, 'старые сохранения: без ошибок страницы', errors.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 8. Сохранение 270 с женатыми парами NPC: после обновления фамилии не меняются задним числом ----------
  {
    const A = await open(browser, { mine: false });
    await life(A.pg, { country: 'ru', gender: 'm', startAge: '30' });
    const json = await A.pg.evaluate(() => {
      // пары, поженившиеся ещё в 270: друзья через свадьбу соцсвязей 270 и брат с женой из семейного древа
      const couples = [];
      for (const [r1, r2] of [['Друг', 'Знакомый'], ['Коллега', 'Знакомый'], ['Знакомый', 'Друг']]) {
        const a = T.mk(r1, 32, 'm'), b = T.mk(r2, 31, 'f');
        adultState55(a).partner = b.id; adultState55(b).partner = a.id; marrySoc270(a, b); couples.push(a.id, b.id);
      }
      familyState27();
      const bio = () => ({ parents: [], children: [], history: [], education: [], study: null, job: null, skill: 35, ambition: .5, educationWish: .3, childrenWish: 1, last: s.clock.ticks, born: s.clock.ticks - 360, health: 90 });
      const bro = T.mk('Брат', 33, 'm'), wife = T.mk('Партнёр близкого', 31, 'f'); bro.bio27 = bio(); wife.bio27 = bio();
      bro.npcMarried54 = wife.npcMarried54 = true; adultState55(bro).partner = wife.id; adultState55(wife).partner = bro.id;
      s.family27.unions.push({ id: 'u270old', a: bro.id, b: wife.id, status: 'together', since: s.clock.ticks });
      couples.push(bro.id, wife.id);
      T.clean();
      if (typeof flushSave264 === 'function') flushSave264();
      s.oldCouples = couples;
      // как в настоящем сохранении 270 (если names271 уже подключён в index.html, страница A — тоже 271)
      const o = JSON.parse(JSON.stringify(s)); delete o.names271v;
      for (const p of o.people) delete p.marriageDecided271;
      return JSON.stringify(o);
    });
    const baseErrors = A.errors.slice();
    await A.ctx.close();
    const { pg, errors, ctx } = await open(browser);
    await life(pg, { country: 'nl', gender: 'f' });
    const r = await pg.evaluate(json => {
      const o = JSON.parse(json); o.saveId = 'v271-old270';
      localStorage.setItem(LIFE_PREFIX + o.saveId, JSON.stringify(o));
      loadCharacter(o.saveId); if ($('#modal').open) closeModal(); s.pending = [];
      const ids = new Set(s.oldCouples), snap = () => new Map(s.people.filter(p => ids.has(p.id)).map(p => [p.id, p.name]));
      const before = snap(), married = s.people.filter(p => ids.has(p.id) && p.npcMarried54).length;
      T.months(3);
      // и ещё один месячный проход имён с «выпавшим» обычаем: без отметки 271 каждая пара сменила бы фамилию
      if (typeof npcNames271 === 'function') { const rnd = Math.random; Math.random = () => 0.1; try { npcNames271(); } finally { Math.random = rnd; } }
      const after = snap(), diffs = [];
      for (const [id, v] of before) if (after.get(id) && after.get(id) !== v) diffs.push(v + ' → ' + after.get(id));
      const logs = s.log.filter(e => /^Новая фамилия|^Фамилия после/.test(e.title)).map(e => e.title + ': ' + e.text);
      return { n: before.size, married, diffs, logs };
    }, json);
    check(r.n === 8 && r.married === 8 && r.diffs.length === 0 && r.logs.length === 0, 'сохранение 270: уже женатые пары NPC после загрузки и трёх месяцев — с прежними фамилиями, без «Новая фамилия»', JSON.stringify(r).slice(0, 300));
    check(errors.length === 0 && baseErrors.length === 0, 'сохранение 270: без ошибок страницы', [...baseErrors, ...errors].slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ---------- 9. Порядок с stories271: премьеры 269–270, уже виденные в старой жизни, — с теми же режиссёрами ----------
  // stories271.js снимает пулы 270, только если names271 ещё не загружен; поэтому names271 идёт после него.
  if (fs.existsSync(path.join(ROOT, 'stories271.js')) && fs.existsSync(path.join(ROOT, 'stories271-data.js'))) {
    const directors = async (opts) => {
      const { pg, errors, ctx } = await open(browser, opts);
      await life(pg, { country: 'ru', gender: 'f', startAge: '20' });
      const out = await pg.evaluate(() => {
        if (typeof films269 !== 'function' || typeof futureFilm269 !== 'function') return null;
        const st = films269(); st.seed = 123456789;
        return [2028 * 12, 2028 * 12 + 5, 2029 * 12 + 2, 2031 * 12 + 7].map(ym => { const f = futureFilm269(ym, 0); return f && /^G/.test(f.id) ? f.id + ' ' + f.director : null; }).filter(Boolean);
      });
      await ctx.close();
      return { out, errors };
    };
    const STORIES = ['stories271-data.js', 'stories271.js'];
    const base = await directors({ mine: false });
    const ordered = await directors({ before: STORIES });
    if (!base.out?.length || ordered.errors.length) console.log('skip порядок с stories271: ' + (ordered.errors[0] || 'нет премьер G'));
    else check(JSON.stringify(ordered.out) === JSON.stringify(base.out), 'порядок stories271 → names271: у премьер 269–270 те же режиссёры', ordered.out.join(', '));
  }
  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без names271)' : ''));
  process.exit(fail ? 1 : 0);
})();
function T_repeats(x) { const w = String(x || '').split(/[\s-]+/).filter(Boolean); return w.length !== new Set(w).size; }
