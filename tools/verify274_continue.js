// Проверки сборки 274 (continue274.js): братья и сёстры при рождении и младшие, продолжение за любого живого из древа.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify274_continue.js
// BASE=1 — прогон без continue274.js: видно, какие проверки ловят старое поведение.
// OWNER_SAVE=путь — дополнительно: настоящее сохранение (последний персонаж), смерть и продолжение за ребёнка; если
// подключён save275.js (сборка 275) — ещё перенос: копия всех жизней → очистка → «Восстановить из файла» → «Открыть
// продолжение →».
// QUICK=1 — меньше рождений и жизней.
// CONTINUE274=путь — проверить другую версию continue274.js (например, до исправлений), без правки index.html.
const fs = require('fs'), path = require('path'), os = require('os');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1', QUICK = process.env.QUICK === '1';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };

async function page(browser, opts = {}) {
  const ctx = await browser.newContext(opts);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    // 274: index.html уже подключает continue274.js; при BASE=1 или CONTINUE274 тег вырезается.
    const strip = rel === 'index.html' && (BASE || process.env.CONTINUE274);
    const body = rel === 'offline-game.js' ? '' : strip ? INDEX.replace(/<script src="continue274\.js[^"]*"><\/script>/, '') : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  if (!BASE && (process.env.CONTINUE274 || !INDEX.includes('continue274.js'))) await pg.addScriptTag({ path: process.env.CONTINUE274 || path.join(ROOT, 'continue274.js') });
  // Общие помощники страницы.
  await pg.evaluate(() => {
    window.__born = (country, startAge = '0', household = 'random') => {
      try { localStorage.clear(); } catch (e) {}
      s = null; intro();
      const set = (id, v) => { const e = document.getElementById(id); if (e) e.value = v; };
      set('country', country); set('startAge', startAge); set('name', ''); set('familyHousehold131', household);
      start();
      try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
      if ($('#modal').open) closeModal();
      s.pending = [];
    };
    window.__months = n => {
      for (let i = 0; i < n && !s.dead; i++) {
        s.pending = []; if ($('#modal').open) closeModal();
        s.clock.running = false; advanceMonth();
        s.pending = []; if ($('#modal').open) closeModal();
        /* 279.1.1: если в месяц дня рождения было окно, advanceMonth (clock.js) откладывает год (yearDue), а игра проводит его
           после ответа (pulse); без этого год пропадал и через 18 лет вам было 17. */
        if (s.clock.yearDue && !s.dead && typeof rollYear === 'function') { try { transact('year', rollYear); } catch (e) {} s.pending = []; if ($('#modal').open) closeModal(); }
      }
    };
    window.__bad = () => {
      const out = [];
      for (const k of ['cash', 'health', 'mood', 'age', 'year']) if (!Number.isFinite(Number(s[k]))) out.push(k + '=' + s[k]);
      for (const p of s.people) if (!Number.isFinite(Number(p.age)) || p.privateCash !== undefined && !Number.isFinite(Number(p.privateCash))) out.push(p.name + ':' + p.age + '/' + p.privateCash);
      return out;
    };
  });
  return { pg, errors, ctx };
}

// Семья в трёх поколениях: персонаж 80 лет, супруга, двое детей, у старшего ребёнка партнёр и двое внуков,
// у младшего — ребёнок; брат персонажа с дочерью (племянница). Круг персонажа: подруга, работник и клиент его дела,
// няня, друг внучки. o.home — свой дом в Риме, где персонаж жил с супругой. Всё создаётся функциями игры.
function buildFamily(o = {}) {
  // Оба родителя: при «случайной» семье примерно в одном рождении из 150 матери или отца нет, и mk() ниже падал.
  __born('it', '18', 'both');
  const P = s;
  P.age = 80; P.year += 62; P.birthYear = P.year - 80; P.clock.ticks += 62 * 12;
  const ticks = P.clock.ticks;
  for (const p of s.people) { p.age += 62; if (['Мать', 'Отец', 'Бабушка', 'Дедушка'].includes(p.role)) p.alive = false; }
  for (const p of s.people.filter(p => ['Брат', 'Сестра'].includes(p.role))) p.alive = false;
  const mk = (role, age, gender, parents, city) => {
    const p = person(role, age, gender, 'it');
    p.city18 = city || 'Рим';
    if (parents.length && typeof childBirthIdentity166 === 'function') { const pp = parents.map(id => id === 'player' ? s : s.people.find(q => q.id === id)); childBirthIdentity166(p, pp); }
    p.birthYear = s.year - age;
    s.people.push(p); familyState27();
    p.bio27.parents = parents.slice(); p.bio27.born = ticks - age * 12;
    for (const id of parents) { const q = s.people.find(x => x.id === id); if (q?.bio27 && !q.bio27.children.includes(p.id)) q.bio27.children.push(p.id); }
    p.privateCash = countries.it.cost * 0.5;
    return p;
  };
  const mother = s.people.find(p => p.role === 'Мать'), father = s.people.find(p => p.role === 'Отец');
  const brother = mk('Брат', 77, 'm', [mother.id, father.id], 'Милан'); brother.role = 'Брат';
  const brotherWife = person('Партнёр близкого', 75, 'f', 'it'); brotherWife.city18 = 'Милан'; s.people.push(brotherWife);
  s.family27.unions.push({ id: 'u-bro', a: brother.id, b: brotherWife.id, status: 'together', since: ticks - 500, married270: ticks - 500 });
  familyState27();
  const niece = mk('Племянница', 45, 'f', [brother.id, brotherWife.id], 'Милан'); niece.role = 'Племянница';
  const spouse = person('Партнер', 78, P.gender === 'f' ? 'm' : 'f', 'it'); spouse.city18 = 'Рим'; spouse.married = true; spouse.role = 'Партнер'; s.people.push(spouse);
  familyState27();
  const kid1 = mk('Ребенок', 52, 'f', ['player', spouse.id], 'Турин'); kid1.role = 'Ребенок';
  const kid2 = mk('Ребенок', 48, 'm', ['player', spouse.id], 'Рим'); kid2.role = 'Ребенок';
  const inlaw = person('Партнёр близкого', 53, 'm', 'it'); inlaw.city18 = 'Турин'; s.people.push(inlaw);
  s.family27.unions.push({ id: 'u-kid1', a: kid1.id, b: inlaw.id, status: 'together', since: ticks - 300, married270: ticks - 300 });
  familyState27();
  const g1 = mk('Внучка', 15, 'f', [kid1.id, inlaw.id], 'Турин'); g1.role = 'Внучка';
  const g2 = mk('Внук', 22, 'm', [kid1.id, inlaw.id], 'Турин'); g2.role = 'Внук';
  const g3 = mk('Внук', 12, 'm', [kid2.id], 'Рим'); g3.role = 'Внук';
  const friend = person('Друг', 79, 'f', 'it'); friend.city18 = 'Турин'; friend.orientation = 'hetero'; friend.bond = 60; s.people.push(friend);
  const worker = person('Сотрудник своего дела', 40, 'm', 'it'); worker.city18 = 'Рим'; s.people.push(worker);
  const client = person('Клиент', 50, 'f', 'it'); client.city18 = 'Рим'; s.people.push(client);
  const nanny = person('Няня', 45, 'f', 'it'); nanny.city18 = 'Рим'; s.people.push(nanny);
  const kidFriend = person('Друг ребёнка', 15, 'f', 'it'); kidFriend.city18 = 'Турин'; kidFriend.childFriend55 = g1.id; s.people.push(kidFriend);
  if (o.home) {
    const prop = { id: 'home-274test', country: 'it', city: 'Рим', area: 'suburb', kind: 'house', price: countries.it.cost * 11.7, rented: false };
    s.properties.push(prop);
    Object.assign(s.housing, { country: 'it', city: 'Рим', area: 'suburb', mode: 'own', propertyId: prop.id, active: true, occupant: spouse.id });
    spouse.cohabit = true;
  }
  if (o.pet) s.pets.push({ ...shelterRoll38('cat'), id: id16('pet'), name: 'Мурка', kind: 'cat', months: 30, withYou: 30, sex38: 'f', life: 150, alive: true, bond: 50, trait: pick(petKinds.cat.traits), notes: [], lastCare: -1 });
  s.cash = countries.it.cost * 4;
  // Смерть персонажа — как в игре: запись, наследство распределяется между живыми наследниками.
  s.dead = true; s.ending = 'Жизнь закончилась раньше, чем закончились все планы.';
  log('Последняя запись', s.ending, 'Конец', true);
  estateObserve58();
  save(); if (typeof flushSave264 === 'function') flushSave264();
  render();
  return { brother: brother.id, niece: niece.id, spouse: spouse.id, kid1: kid1.id, kid2: kid2.id, inlaw: inlaw.id, g1: g1.id, g2: g2.id, g3: g3.id, deadSave: s.saveId,
    friend: friend.id, worker: worker.id, client: client.id, nanny: nanny.id, kidFriend: kidFriend.id, brotherWife: brotherWife.id };
}


(async () => {
  const browser = await chromium.launch();
  const { pg, errors, ctx } = await page(browser);

  // ---------- 1. Старшие братья и сёстры при рождении: 50 рождений на регион ----------
  const regions = { 'Восточная Азия': ['kr', 'jp', 'cn'], 'Европа': ['it', 'es', 'de', 'pl'], 'Америка и Австралия': ['us', 'br', 'mx', 'au'], 'Египет, Индия, Индонезия': ['eg', 'in', 'id'] };
  const N = QUICK ? 15 : 50;
  const stats = {};
  for (const [region, list] of Object.entries(regions)) {
    const r = await pg.evaluate(([list, N]) => {
      const out = { older: [], total: [], only: 0, motherBad: 0, fatherBad: 0, half: 0, longGap: 0, maxOlder: 0, surnameMismatch: [], linkBad: 0, errors: 0 };
      for (let i = 0; i < N; i++) {
        try { __born(list[i % list.length]); } catch (e) { out.errors++; continue; }
        const mother = s.people.find(p => p.role === 'Мать'), father = s.people.find(p => p.role === 'Отец');
        const sibs = s.people.filter(p => ['Брат', 'Сестра'].includes(p.role));
        const planned = (s.siblings274?.plan || []).filter(q => q.status === 'planned').length;
        out.older.push(sibs.length); out.total.push(sibs.length + planned);
        if (!sibs.length && !planned) out.only++;
        out.maxOlder = Math.max(out.maxOlder, sibs.length);
        const ages = sibs.map(p => p.age).sort((a, b) => a - b);
        let prev = 0; for (const a of ages) { if (a - prev >= 10) out.longGap++; prev = a; }
        for (const p of sibs) {
          if (p.half274) { out.half++; continue; }
          if (mother && (mother.age - p.age < 16 || mother.age - p.age > 45)) out.motherBad++;
          if (father && father.age - p.age < 16) out.fatherBad++;
          const pp = p.bio27?.parents || [];
          // Второй родитель неизвестен (один родитель с рождения): старшие — дети того, кто есть.
          if ((mother || father) && [mother, father].filter(Boolean).some(q => !pp.includes(q.id) || !q.bio27.children.includes(p.id))) out.linkBad++;
          const root = x => String(x || '').replace(/(ая|ий|ой|ый|а)$/, '');
          if (root(p.surname) !== root(s.surname) && s.birthCountry !== 'eg') out.surnameMismatch.push(p.name + ' / ' + s.name + ' ' + s.surname);
        }
      }
      return out;
    }, [list, N]);
    const avg = a => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    stats[region] = { older: avg(r.older), total: avg(r.total), only: r.only / N };
    console.log(`     ${region}: старших в среднем ${avg(r.older).toFixed(2)}, всего с младшими по плану ${avg(r.total).toFixed(2)}, единственных детей ${Math.round(100 * r.only / N)}%, макс. старших ${r.maxOlder}, по одному родителю ${r.half}, разрывов 10+ лет ${r.longGap}`);
    check(r.errors === 0, region + ': рождение без ошибок', r.errors ? r.errors + ' ошибок' : '');
    check(r.maxOlder <= 4, region + ': старших не больше четырёх', 'макс. ' + r.maxOlder);
    check(r.motherBad === 0 && r.fatherBad === 0, region + ': возраст матери при рождении старших 16–45, отца — от 16', 'мать ' + r.motherBad + ', отец ' + r.fatherBad);
    check(r.linkBad === 0, region + ': старшие связаны с родителями в древе (с обоими, если оба известны)', r.linkBad + '');
    check(r.surnameMismatch.length <= Math.ceil(N * 0.1), region + ': фамилия старших совпадает с вашей', r.surnameMismatch.slice(0, 3).join('; '));
  }
  check(stats['Восточная Азия'].total < stats['Египет, Индия, Индонезия'].total, 'в Восточной Азии братьев и сестёр меньше, чем в Египте, Индии, Индонезии',
    stats['Восточная Азия'].total.toFixed(2) + ' < ' + stats['Египет, Индия, Индонезия'].total.toFixed(2));
  /* 279.1.1: доля из 50 случайных рождений — в среднем около 35%, разброс от прогона к прогону около 7%: строгая граница 20%
     срабатывала примерно в 2–3% прогонов (ровно 10 из 50). Граница 15% — три разброса от среднего. */
  check(stats['Восточная Азия'].only >= 0.15 && stats['Восточная Азия'].only < 0.6, 'единственных детей в Восточной Азии 15–60%', Math.round(stats['Восточная Азия'].only * 100) + '%');
  check(stats['Египет, Индия, Индонезия'].only < 0.2, 'единственных детей в Египте, Индии, Индонезии меньше 20%', Math.round(stats['Египет, Индия, Индонезия'].only * 100) + '%');
  const ranges = { 'Восточная Азия': [0.5, 1.4], 'Европа': [0.7, 1.7], 'Америка и Австралия': [0.9, 2.0], 'Египет, Индия, Индонезия': [1.6, 3.4] };
  check(Object.entries(ranges).every(([k, [a, b]]) => stats[k].total >= a && stats[k].total <= b), 'среднее число братьев и сестёр (со старшими и младшими по плану) правдоподобно по регионам',
    Object.entries(stats).map(([k, x]) => k + ' ' + x.total.toFixed(2)).join(', '));

  // Старое поколение: для родившихся в 1970 детей больше, чем в 2025 (таблица по году рождения).
  const dec = await pg.evaluate(() => typeof familyLambda274 === 'function' ? [familyLambda274('it', 1970), familyLambda274('it', 2025), familyLambda274('eg', 2025)] : null);
  check(dec && dec[0] > dec[1] && dec[2] > dec[1], 'по году рождения: в 1970 больше детей, чем в 2025; в Египте больше, чем в Италии', JSON.stringify(dec));

  // 1б. Родители не вместе с вашего рождения (один родитель; второй известен или нет): старшие братья и сёстры есть,
  // общие для обоих родителей, если второй известен; младших от этой пары по плану нет.
  const single = await pg.evaluate(N => {
    const out = { n: 0, withSib: 0, sibs: 0, full: 0, half: 0, oneN: 0, oneOk: 0, planned: 0, motherBad: 0, errors: [] };
    for (let i = 0; i < N; i++) {
      try { __born(['eg', 'in', 'id', 'mx', 'br', 'us', 'fr', 'it'][i % 8], '0', i % 4 === 3 ? 'unknown' : 'one'); } catch (e) { out.errors.push(String(e.message).slice(0, 80)); continue; }
      const mother = s.people.find(p => p.role === 'Мать'), father = s.people.find(p => p.role === 'Отец');
      const sibs = s.people.filter(p => ['Брат', 'Сестра'].includes(p.role));
      out.n++; if (sibs.length) out.withSib++; out.sibs += sibs.length;
      out.planned += (s.siblings274?.plan || []).filter(q => q.status === 'planned').length;
      for (const p of sibs) {
        const pp = p.bio27?.parents || [];
        if (mother && father) { if (pp.includes(mother.id) && pp.includes(father.id)) out.full++; else out.half++; }
        else { out.oneN++; if (pp.includes((mother || father).id)) out.oneOk++; }
        if (mother && pp.includes(mother.id) && (mother.age - p.age < 16 || mother.age - p.age > 45)) out.motherBad++;
      }
    }
    return out;
  }, QUICK ? 24 : 80);
  console.log(`     один родитель с рождения: ${single.n} рождений, со старшими ${single.withSib}, в среднем ${(single.sibs / Math.max(1, single.n)).toFixed(2)}, общих для обоих ${single.full}, по одному родителю ${single.half}, при неизвестном втором ${single.oneN}`);
  check(!single.errors.length && single.withSib >= single.n * 0.3, 'один родитель с рождения: у многих есть старшие братья и сёстры', single.withSib + ' из ' + single.n + (single.errors.length ? '; ' + single.errors[0] : ''));
  check(single.full >= 1 && single.full >= single.half * 3, 'родители не вместе: старшие — общие дети обоих (по маме или по папе — редко)', single.full + ' / ' + single.half);
  check(single.oneOk === single.oneN && single.motherBad === 0, 'второй родитель неизвестен: старшие — дети того, с кем вы живёте; возраст матери правдоподобный', single.oneOk + '/' + single.oneN + ', мать ' + single.motherBad);
  check(single.planned === 0, 'родители не вместе: младших от этой пары по плану нет', String(single.planned));

  // ---------- 2. Младшие: 20 жизней до 18 лет ----------
  const LIVES = QUICK ? 6 : 20;
  const lives = [];
  for (let i = 0; i < LIVES; i++) {
    const country = ['it', 'eg', 'in', 'mx', 'us', 'fr', 'tr', 'id', 'br', 'za'][i % 10];
    const before = errors.length;
    const r = await pg.evaluate(c => {
      __born(c);
      const mother = s.people.find(p => p.role === 'Мать'), father = s.people.find(p => p.role === 'Отец');
      const older = new Set(s.people.filter(p => ['Брат', 'Сестра'].includes(p.role)).map(p => p.id));
      __months(18 * 12);
      const young = s.people.filter(p => ['Брат', 'Сестра'].includes(p.role) && !older.has(p.id));
      const graph = typeof treeGraph90 === 'function' ? treeGraph90() : { edges: [] };
      const entries = s.log.filter(e => /^У вас родил(ся брат|ась сестра|ись)/.test(e.title)).map(e => e.title);
      return {
        country: c, age: s.age, dead: s.dead, entries,
        // Кроме плана 274, младшие появляются и обычным путём игры (family27: birthKin27): у родителя с новым партнёром —
        // брат или сестра по маме или по папе без пометки half274, а в 12% таких рождений — приёмный ребёнок (связь в
        // древе «adopted», запись «В семье появился младший ребёнок», а не «У вас родился…»). Это не ошибки.
        young: young.map(p => ({ src: p.half274 || (s.siblings274?.born || []).includes(p.id) ? 'план' : 'игра', name: p.name, role: p.role, gender: p.gender, age: p.age, surname: p.surname,
          half: p.half274 || ((p.bio27?.parents || []).length === 2 && (p.bio27.parents.includes(mother?.id) !== p.bio27.parents.includes(father?.id)) ? 'игра' : null),
          adopted: !!(p.bio27?.adopted || p.adopted49),
          parents: p.bio27?.parents || [], fullParents: !!(mother && father && p.bio27?.parents?.includes(mother.id) && p.bio27?.parents?.includes(father.id)),
          inTree: graph.edges.some(e => e.b === p.id && ['birth', 'kin', ...(p.bio27?.adopted || p.adopted49 ? ['adopted'] : [])].includes(e.kind)), roleOk: p.role === (p.gender === 'f' ? 'Сестра' : 'Брат') })),
        player: s.surname, motherAge: mother?.age, separated: s.family27?.unions?.find(u => u.legacy)?.status,
        bad: __bad()
      };
    }, country);
    r.newErrors = errors.slice(before);
    lives.push(r);
  }
  const withYoung = lives.filter(l => l.young.length);
  console.log('     младшие по жизням: ' + lives.map(l => l.country + ':' + l.young.length + (l.separated !== 'together' ? '(' + (l.separated || 'один родитель') + ')' : '')).join(' '));
  check(withYoung.length >= Math.ceil(LIVES * 0.25), 'младшие братья и сёстры рождаются хотя бы в четверти жизней', withYoung.length + ' из ' + LIVES);
  const allYoung = lives.flatMap(l => l.young.map(y => ({ ...y, player: l.player, life: l })));
  check(allYoung.every(y => y.roleOk), 'роль младших — «Брат» или «Сестра» по полу');
  check(allYoung.every(y => y.inTree), 'младшие связаны с родителями в древе');
  // Родившийся через 10–11 месяцев после вас до вашего первого дня рождения ровесник по целым годам: возраст растёт у всех в ваш день рождения.
  /* 279.1.1: приёмные не в счёт — family27 (birthKin27) берёт приёмного ребёнка двухлетним, и взятый, пока вам меньше двух,
     старше вас. */
  check(allYoung.every(y => y.adopted || y.age <= y.life.age), 'возраст младших не больше вашего (кроме приёмных)', allYoung.filter(y => !y.adopted && y.age > y.life.age).map(y => y.name + ' ' + y.age + ' / ' + y.life.age + (y.half ? ' ' + y.half : '')).join('; '));
  const full = allYoung.filter(y => !y.half);
  const root = x => String(x || '').replace(/(ая|ий|ой|ый|а)$/, '');
  check(full.filter(y => root(y.surname) !== root(y.player) && y.life.country !== 'eg').length <= Math.ceil(full.length * 0.1), 'фамилия младших — семейная', full.filter(y => y.surname !== y.player).map(y => y.name + '/' + y.player).slice(0, 3).join('; '));
  check(full.every(y => y.fullParents), 'родные младшие — дети обоих родителей');
  check(lives.every(l => l.entries.length >= (l.young.some(y => !y.adopted) ? 1 : 0)), 'в ленте есть запись «У вас родился брат — …» или «родилась сестра»', lives.flatMap(l => l.entries).slice(0, 2).join('; '));
  check(lives.every(l => !l.bad.length), 'нет NaN после 18 лет', lives.flatMap(l => l.bad).slice(0, 3).join('; '));
  check(lives.every(l => !l.newErrors.length), 'нет ошибок страницы за 18 лет', lives.flatMap(l => l.newErrors).slice(0, 2).join(' | '));

  // Старое сохранение: задним числом никто не появляется; план — только на будущее.
  const legacy = await pg.evaluate(() => {
    if (typeof siblingState274 !== 'function') return { same: false, plan: false };
    __born('eg');
    delete s.siblings274;
    const n = s.people.length;
    if (typeof siblingState274 === 'function') siblingState274();
    return { same: s.people.length === n, plan: (s.siblings274?.plan || []).every(q => q.tick > s.clock.ticks) };
  });
  check(legacy.same && legacy.plan, 'старое сохранение: никто не появляется задним числом, план младших — только на будущее');

  // Старший брат или сестра по маме (от её прежних отношений): фамилия — мамина до брака с вашим отцом, не фамилия отца.
  // Старт с такой семьёй вызывается принудительно: размер семьи 2, вы младший, ветка «разрыв 10–20 лет», сторона — мама.
  const halfName = await pg.evaluate(() => {
    const out = [];
    if (typeof siblingsAtStart274 !== 'function') return out;
    for (const c of ['ru', 'rs', 'pl', 'tr', 'ru', 'rs', 'pl', 'tr']) {
      if (out.filter(x => x.half).length >= 2) break;
      __born(c, '0', 'both');
      const mother = s.people.find(p => p.role === 'Мать'), father = s.people.find(p => p.role === 'Отец');
      const prior = mother?.marriageName271?.prior;
      if (!prior?.parts?.length || !father) continue;
      for (const p of s.people.filter(p => ['Брат', 'Сестра'].includes(p.role))) removeStartSibling274(p);
      const keep = { roll: familySizeRoll274, gap: siblingGap274, random: Math.random };
      const queue = [0.99, 0.01, 0.5, 0.5, 0.9];
      familySizeRoll274 = () => 2; siblingGap274 = () => 30;
      Math.random = () => queue.length ? queue.shift() : keep.random();
      try { delete s.siblings274; siblingsAtStart274(); }
      finally { familySizeRoll274 = keep.roll; siblingGap274 = keep.gap; Math.random = keep.random; }
      const half = s.people.find(p => p.half274 === 'mother');
      out.push({ c, half: half?.name || null, age: half?.age, surname: half?.surname || null, prior: prior.surname, mother: mother.surname, father: father.surname, parents: (half?.bio27?.parents || []).length });
    }
    return out;
  });
  {
    const root = x => String(x || '').replace(/(ая|ий|ой|ый|а)$/, '');
    const cases = halfName.filter(x => x.half);
    check(cases.length >= 1 && cases.every(x => root(x.surname) === root(x.prior) && root(x.surname) !== root(x.father) && x.parents === 1),
      'старший брат или сестра по маме носит фамилию мамы до брака с вашим отцом', JSON.stringify(cases.map(x => [x.c, x.half, x.prior, x.father])));
  }

  // ---------- 2б. Обычная жизнь без продолжения: смерть на смене года при открытой «Истории» ----------
  // Финал рисуется прямо из nextYear. Наследство оформляется не при отрисовке, а как без файла части (estates58 после
  // смены года): «Итоги прожитого года» показывают настоящий остаток, запись о наследстве идёт после них.
  const normalDeath = await pg.evaluate(() => {
    __born('de', '18'); __months(3);
    s.cash += 50000; tab = 'story'; render();
    s.age = 99; let guard = 0;
    while (!s.dead && guard++ < 30) { s.pending = []; if ($('#modal').open) closeModal(); s.clock.running = false; advanceMonth(); }
    const sum = s.log.findIndex(e => e.title === 'Итоги прожитого года');
    const est = s.log.findIndex(e => e.title === 'Имущество после утраты' && String(e.text).startsWith(s.name + ':'));
    const m = sum >= 0 ? String(s.log[sum].text).match(/Остаток: ([^.]*)\./) : null;
    return { dead: !!s.dead, sum, est, left: m?.[1] || null, leftNum: m ? Number(m[1].replace(/[^\d-]/g, '')) : null, finalized: !!estates58().finalized,
      button: document.body.innerHTML.includes('Продолжить за близкого') || !(typeof continueCandidates274 === 'function' && continueCandidates274().some(c => !c.disabled)) };
  });
  check(normalDeath.dead && normalDeath.leftNum > 0 && normalDeath.est >= 0 && normalDeath.est < normalDeath.sum && normalDeath.finalized && normalDeath.button,
    'обычная жизнь: при смерти «Итоги прожитого года» с настоящим остатком, наследство оформляется после них', JSON.stringify(normalDeath));

  // ---------- 3. Продолжить за близкого: семья в трёх поколениях ----------
  try {
  const ids = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const endBtn = await pg.evaluate(() => document.body.innerHTML.includes('Продолжить за близкого'));
  check(endBtn, 'на финале есть кнопка «Продолжить за близкого»');
  const cands = await pg.evaluate(() => typeof continueCandidates274 === 'function' ? continueCandidates274().map(c => ({ id: c.id, name: c.p.name, label: c.label, age: c.age, inh: c.inheritance, minor: c.minor?.text || '', city: c.city })) : []);
  const labelOf = id => cands.find(c => c.id === id)?.label;
  console.log('     выбор: ' + cands.map(c => c.label + ' ' + c.age + (c.minor ? ' (' + c.minor + ')' : '')).join(', '));
  check(['Внучка', 'Внук'].includes(labelOf(ids.g1)) && labelOf(ids.niece) === 'Племянница' && labelOf(ids.brother) === 'Брат' && ['Дочь', 'Сын'].includes(labelOf(ids.kid1)),
    'в выборе внуки, дети, брат и племянница — с родством', [labelOf(ids.g1), labelOf(ids.niece), labelOf(ids.brother), labelOf(ids.kid1)].join(', '));
  check(['Жена', 'Муж'].includes(labelOf(ids.spouse)), 'в выборе супруг или супруга', labelOf(ids.spouse) || 'нет');
  check(!cands.some(c => c.id === ids.inlaw), 'зять (партнёр ребёнка) не предлагается');
  check(cands.find(c => c.id === ids.kid1)?.inh?.includes('%') && cands.find(c => c.id === ids.niece)?.inh?.includes('не входит'), 'у каждого — доля наследства или «не входит в круг наследников»',
    cands.find(c => c.id === ids.kid1)?.inh + ' / ' + cands.find(c => c.id === ids.niece)?.inh);
  check(cands.find(c => c.id === ids.g1)?.minor?.includes('Живёт у'), 'у несовершеннолетней внучки указано, с кем живёт', cands.find(c => c.id === ids.g1)?.minor);

  // Наследство до продолжения (для сравнения).
  const heirsBefore = await pg.evaluate(() => { const q = estates58().cases.find(q => q.person === 'player'); return q ? q.heirs.map(h => [h.person, +h.share.toFixed(4)]).sort() : null; });

  // 3а. Продолжить за внучку (15 лет).
  const before = errors.length;
  const asG = await pg.evaluate(ids => {
    const deadName = playerFullName274(s), deadId = s.saveId;
    const g1 = s.people.find(p => p.id === ids.g1), kid1 = s.people.find(p => p.id === ids.kid1), kid2 = s.people.find(p => p.id === ids.kid2), inlaw = s.people.find(p => p.id === ids.inlaw);
    const g2 = s.people.find(p => p.id === ids.g2), g3 = s.people.find(p => p.id === ids.g3), spouse = s.people.find(p => p.id === ids.spouse), brother = s.people.find(p => p.id === ids.brother), niece = s.people.find(p => p.id === ids.niece);
    const names = { g1: g1.name, kid1: kid1.name, kid2: kid2.name, inlaw: inlaw.name, g2: g2.name, g3: g3.name, spouse: spouse.name, brother: brother.name, niece: niece.name };
    const cash = g1.privateCash, age = g1.age, city = g1.city18, gender = g1.gender;
    const ok = continueAs274(ids.g1);
    const r = s.people.find(p => p.died274);
    const tree = treeView90();
    return {
      ok, deadId, newId: s.saveId, name: s.name + ' ' + s.surname, expected: names.g1, age: s.age, expAge: age, gender: s.gender === gender, city: residenceCity(), expCity: city,
      cash: Math.round(s.cash), expCash: Math.round(cash), housing: { mode: s.housing.mode, occupant: s.people.find(p => p.id === s.housing.occupant)?.name || null },
      roles: { dead: r ? { role: r.role, label: r.kin274, alive: r.alive } : null, kid1: roleOfId(ids.kid1), kid2: roleOfId(ids.kid2), inlaw: roleOfId(ids.inlaw), g2: roleOfId(ids.g2), g3: roleOfId(ids.g3),
        spouse: roleOfId(ids.spouse), brother: roleOfId(ids.brother), niece: roleOfId(ids.niece), kidFriend: roleOfId(ids.kidFriend) },
      names, tree: { html: tree.length, has: [names.kid1, names.kid2, names.g3, names.spouse, names.inlaw].map(n => tree.includes(n)), dead: tree.includes(deadName), labels: ['Двоюродный брат', 'Дядя', 'Бабушка'].map(l => tree.includes(l)) },
      heirs: (() => { const q = estates58().cases.find(q => q.person === r?.id); return q ? q.heirs.map(h => [h.person, +h.share.toFixed(4)]).sort() : null; })(),
      log: s.log.slice(0, 2).map(e => e.title + ': ' + e.text), oldLife: readLife(deadId)?.continued274 || null, dead: s.dead
    };
    function roleOfId(id) { const p = s.people.find(p => p.id === id); return p ? { role: p.role, label: p.kin274 || null } : null; }
  }, ids);
  console.log('     внучка: ' + asG.log[0]);
  console.log('     роли: ' + Object.entries(asG.roles).map(([k, v]) => k + '=' + (v ? v.role + (v.label ? '/' + v.label : '') : '—')).join(', '));
  check(asG.ok && !asG.dead && asG.name === asG.expected, 'продолжение за внучку: новый персонаж — она', asG.name);
  check(asG.age === asG.expAge && asG.gender && asG.city === asG.expCity, 'возраст, пол и город — из её записи', asG.age + ', ' + asG.city);
  check(Math.abs(asG.cash - asG.expCash) <= 1, 'её деньги переходят в бюджет', asG.cash + ' / ' + asG.expCash);
  check(asG.roles.dead?.role === 'Дедушка' || asG.roles.dead?.role === 'Бабушка', 'умерший — «Дедушка» или «Бабушка»', JSON.stringify(asG.roles.dead));
  check(asG.roles.kid1?.role === 'Мать' && asG.roles.inlaw?.role === 'Отец', 'её родители — «Мать» и «Отец»', JSON.stringify([asG.roles.kid1, asG.roles.inlaw]));
  check(asG.roles.kid2?.role === 'Дядя', 'брат матери — «Дядя»', JSON.stringify(asG.roles.kid2));
  check(asG.roles.g2?.role === 'Брат', 'родной брат — «Брат»', JSON.stringify(asG.roles.g2));
  check(asG.roles.g3?.role === 'Родственник' && asG.roles.g3?.label === 'Двоюродный брат', 'сын дяди — двоюродный брат', JSON.stringify(asG.roles.g3));
  check(asG.roles.spouse?.role === 'Бабушка' || asG.roles.spouse?.role === 'Дедушка', 'супруг умершего — бабушка или дедушка', JSON.stringify(asG.roles.spouse));
  check(asG.roles.brother?.label?.startsWith('Двоюродн') && asG.roles.niece?.label?.startsWith('Двоюродн'), 'брат умершего и его дочь — двоюродные дед и тётя', JSON.stringify([asG.roles.brother, asG.roles.niece]));
  check(asG.housing.mode === 'parents' && asG.housing.occupant === asG.names.kid1, 'несовершеннолетняя живёт с мамой', JSON.stringify(asG.housing));
  check(asG.roles.kidFriend?.role === 'Друг', 'её подруга (друг ребёнка у умершего) — её «Друг»', JSON.stringify(asG.roles.kidFriend));
  check(asG.tree.html > 0 && asG.tree.has.every(Boolean) && asG.tree.dead, 'древо рисуется: родители, дядя, двоюродный брат, бабушка и умерший', JSON.stringify(asG.tree));
  check(JSON.stringify(asG.heirs.map(([p, sh]) => [p === 'player' ? ids.g1 : p, sh]).sort()) === JSON.stringify(heirsBefore), 'наследство — как было: те же наследники и доли', JSON.stringify(heirsBefore));
  check(asG.oldLife?.saveId === asG.newId, 'прежняя жизнь сохранена завершённой и помнит продолжение');
  const runG = await pg.evaluate(() => { const age = s.age; __months(36); return { age: s.age, dead: s.dead, bad: __bad(), people: s.people.length }; });
  check(runG.age >= asG.age + 3 || runG.dead, 'игра идёт ещё три года', asG.age + ' → ' + runG.age);
  check(!runG.bad.length, 'нет NaN за три года', runG.bad.join('; '));
  check(errors.length === before, 'нет ошибок страницы при продолжении и за три года', errors.slice(before, before + 3).join(' | '));
  // Новая жизнь несёт весь мир прежней: она хранится сжатой с первой записи, и резервная копия помещается.
  const store = await pg.evaluate(() => {
    save(); flushSave264(); save(); flushSave264();
    const key = LIFE_PREFIX + s.saveId;
    return { packed: String(localStorage.getItem(key) || '').startsWith(PACKED_LIFE), backup: !!localStorage.getItem(key + '-backup'), read: !!readLife(s.saveId) };
  });
  check(store.packed && store.backup && store.read, 'новая жизнь хранится сжатой, резервная копия есть', JSON.stringify(store));
  // Перенос сохранений (резервная копия всех персонажей → очистка → восстановление из файла): saveId у всех новые,
  // «Открыть продолжение» в прежней жизни всё равно ведёт в продолжение.
  const moved = await pg.evaluate(() => {
    flushSave264();
    const lives = vaultIndex().ids.map(id => readLife(id)).filter(Boolean), name = s.name;
    localStorage.clear(); s = null;
    importLives({ format: 'life-side-effects', version: 1, lives });
    const deadId = vaultIndex().ids.find(id => readLife(id)?.continued274);
    loadCharacter(deadId);
    const btn = document.body.innerHTML.includes('Открыть продолжение');
    openContinued274();
    return { btn, name, now: s.name, dead: !!s.dead, from: !!s.continuedFrom274 };
  });
  check(moved.btn && !moved.dead && moved.from && moved.now === moved.name, 'после восстановления из файла «Открыть продолжение» ведёт в новую жизнь', JSON.stringify(moved));

  // 3б. Продолжить за племянницу: та же семья заново.
  const fam2 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const before2 = errors.length;
  const asN = await pg.evaluate(ids => {
    const deadName = playerFullName274(s);
    const get = id => s.people.find(p => p.id === id);
    const names = { niece: get(ids.niece).name, brother: get(ids.brother).name, kid1: get(ids.kid1).name, g1: get(ids.g1).name, spouse: get(ids.spouse).name };
    const ok = continueAs274(ids.niece);
    const roleOfId = id => { const p = s.people.find(p => p.id === id); return p ? { role: p.role, label: p.kin274 || null } : null; };
    const tree = treeView90();
    return { ok, name: s.name + ' ' + s.surname, names, city: residenceCity(), housing: s.housing.mode,
      roles: { dead: (p => p ? { role: p.role, label: p.kin274 || null } : null)(s.people.find(p => p.died274)), brother: roleOfId(ids.brother), kid1: roleOfId(ids.kid1), g1: roleOfId(ids.g1), spouse: roleOfId(ids.spouse) },
      tree: [names.brother, names.kid1, deadName].map(n => tree.includes(n)) };
  }, fam2);
  console.log('     племянница: ' + Object.entries(asN.roles).map(([k, v]) => k + '=' + (v ? v.role + (v.label ? '/' + v.label : '') : '—')).join(', '));
  check(asN.ok && asN.name === asN.names.niece && asN.city === 'Милан', 'продолжение за племянницу: она, её город', asN.name + ', ' + asN.city);
  check(['Дядя', 'Тетя'].includes(asN.roles.dead?.role), 'умерший — «Дядя» или «Тетя»', JSON.stringify(asN.roles.dead));
  check(asN.roles.brother?.role === 'Отец', 'брат умершего — её «Отец»', JSON.stringify(asN.roles.brother));
  check(asN.roles.kid1?.label?.startsWith('Двоюродн') && asN.roles.g1?.label?.startsWith('Двоюродн'), 'дети умершего — двоюродные, внуки — двоюродные племянники', JSON.stringify([asN.roles.kid1, asN.roles.g1]));
  check(asN.roles.spouse?.role === 'Партнёр близкого', 'вдова или вдовец умершего — пара близкого', JSON.stringify(asN.roles.spouse));
  check(asN.tree.every(Boolean), 'древо племянницы: отец, двоюродная сестра, умерший дядя', JSON.stringify(asN.tree));
  const runN = await pg.evaluate(() => { __months(36); return { bad: __bad() }; });
  check(!runN.bad.length && errors.length === before2, 'за племянницу игра идёт три года без ошибок', errors.slice(before2, before2 + 3).join(' | '));

  // 3в. Продолжить за ребёнка (обычный путь «за сына или дочь»).
  const fam3 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const before3 = errors.length;
  const asK = await pg.evaluate(ids => {
    const deadName = playerFullName274(s), get = id => s.people.find(p => p.id === id);
    const names = { kid2: get(ids.kid2).name, kid1: get(ids.kid1).name, g3: get(ids.g3).name, spouse: get(ids.spouse).name };
    const ok = continueAs274(ids.kid2);
    const roleOfId = id => { const p = s.people.find(p => p.id === id); return p ? { role: p.role, label: p.kin274 || null } : null; };
    return { ok, name: s.name + ' ' + s.surname, names, housing: s.housing.mode, job: s.job?.title || null, roles: { dead: (p => p ? { role: p.role, label: p.kin274 || null } : null)(s.people.find(p => p.died274)), kid1: roleOfId(ids.kid1), g3: roleOfId(ids.g3), spouse: roleOfId(ids.spouse) } };
  }, fam3);
  check(asK.ok && asK.name === asK.names.kid2, 'продолжение за сына', asK.name);
  check(['Отец', 'Мать'].includes(asK.roles.dead?.role) && ['Отец', 'Мать'].includes(asK.roles.spouse?.role), 'умерший и его супруга — родители', JSON.stringify([asK.roles.dead, asK.roles.spouse]));
  check(asK.roles.kid1?.role === 'Сестра' && asK.roles.g3?.role === 'Ребенок', 'сестра — «Сестра», свой сын — «Ребенок»', JSON.stringify([asK.roles.kid1, asK.roles.g3]));
  const runK = await pg.evaluate(() => { __months(36); return { bad: __bad() }; });
  check(!runK.bad.length && errors.length === before3, 'за сына игра идёт три года без ошибок', errors.slice(before3, before3 + 3).join(' | '));

  // 3г. Внук, у которого умер отец: живёт у близкого взрослого (бабушки), по правилам опеки ребёнка-игрока.
  const fam4 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const before5 = errors.length;
  const asR = await pg.evaluate(ids => {
    const get = id => s.people.find(p => p.id === id);
    get(ids.kid2).alive = false;
    const spouse = get(ids.spouse).name;
    const c = continueCandidates274().find(c => c.id === ids.g3);
    const note = c?.minor?.text || '';
    // Лечение и заключение: человек в списке с пометкой; за того, кто в заключении, продолжить нельзя.
    get(ids.g2).parentHealth143 = { careUnavailableUntil: s.clock.ticks + 3 };
    get(ids.niece).custody145 = { status: 'serving', life: false, ends: s.clock.ticks + 5 };
    get(ids.brother).custody145 = { status: 'serving', life: true, ends: null };
    continueCache274 = null;
    const list = continueCandidates274();
    const ill = list.find(c => c.id === ids.g2), jailed = list.find(c => c.id === ids.niece), lifer = list.find(c => c.id === ids.brother);
    const ok = continueAs274(ids.g3);
    const host = s.people.find(p => p.id === s.housing.occupant);
    const mode = s.housing.mode, care = s.family17?.care136?.kind;
    for (let i = 0; i < 12; i++) { s.pending = []; if ($('#modal').open) closeModal(); s.clock.running = false; advanceMonth(); }
    return { ok, note, spouse, mode, host: host?.name, hostRole: host?.role, care, ill: ill?.care || '', illDisabled: !!ill?.disabled, jailed: jailed?.care || '', jailedDisabled: !!jailed?.disabled,
      lifer: lifer?.care || '', liferDisabled: !!lifer?.disabled, bad: __bad() };
  }, fam4);
  check(asR.note.includes('Будет жить у бабушки') || asR.note.includes('Будет жить у дедушки'), 'внук без родителей рядом — будет жить у бабушки или дедушки', asR.note);
  check(asR.ok && asR.mode === 'host' && asR.host === asR.spouse && asR.care === 'relative', 'после продолжения живёт у бабушки или дедушки: опека как у ребёнка-игрока', JSON.stringify([asR.mode, asR.hostRole, asR.care]));
  check(asR.ill.includes('лечении') && !asR.illDisabled, 'на лечении — в списке с пометкой, выбрать можно', asR.ill);
  check(asR.jailed.includes('заключении') && !asR.jailedDisabled && asR.lifer.includes('пожизненный') && asR.liferDisabled,
    'в заключении — в списке с пометкой: конечный срок — выбрать можно, пожизненный — нельзя', asR.jailed + ' / ' + asR.lifer);
  check(!asR.bad.length && errors.length === before5, 'за внука у бабушки год без ошибок', errors.slice(before5, before5 + 3).join(' | '));

  // 3д. Продолжить за вдову или вдовца: умерший — «Партнер» (брак), дети — свои, брат умершего — родня супруга.
  const fam5 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const before6 = errors.length;
  const asW = await pg.evaluate(ids => {
    const get = id => s.people.find(p => p.id === id);
    const names = { kid1: get(ids.kid1).name, brother: get(ids.brother).name, g1: get(ids.g1).name };
    const ok = continueAs274(ids.spouse);
    const roleOfId = id => { const p = s.people.find(p => p.id === id); return p ? { role: p.role, label: p.kin274 || null } : null; };
    const d = s.people.find(p => p.died274);
    for (let i = 0; i < 12; i++) { s.pending = []; if ($('#modal').open) closeModal(); s.clock.running = false; advanceMonth(); }
    return { ok, dead: d && { role: d.role, married: !!d.married, label: d.kin274 }, kid1: roleOfId(ids.kid1), brother: roleOfId(ids.brother), g1: roleOfId(ids.g1), partner: currentPartner()?.name || null, tree: treeView90().includes(d?.name), bad: __bad() };
  }, fam5);
  check(asW.ok && asW.dead?.role === 'Партнер' && asW.dead?.married && !asW.partner, 'вдова или вдовец: умерший — супруг, нынешнего партнёра нет', JSON.stringify(asW.dead));
  check(asW.kid1?.role === 'Ребенок' && asW.g1?.role === 'Внучка', 'общие дети — «Ребенок», внуки — внуки', JSON.stringify([asW.kid1, asW.g1]));
  check(asW.brother?.role === 'Родственник' && /Родня (мужа|жены)/.test(asW.brother?.label || ''), 'брат умершего — родня супруга', JSON.stringify(asW.brother));
  check(asW.tree && !asW.bad.length && errors.length === before6, 'вдова или вдовец: древо и год без ошибок', errors.slice(before6, before6 + 3).join(' | '));

  const advance = n => { for (let i = 0; i < n; i++) { s.pending = []; if ($('#modal').open) closeModal(); s.clock.running = false; advanceMonth(); } };
  const advanceSrc = 'const advance=' + advance.toString() + ';';

  // 3е. Вдова или вдовец в своём доме, где жили вместе: остаётся там совладельцем, а не уходит в аренду.
  const fam6 = await pg.evaluate(new Function('o', 'return (' + buildFamily.toString() + ')(o)'), { home: true });
  const before7 = errors.length;
  /* 279.1.1: год без смерти — вдове или вдовцу 78 лет, риск умереть за год около 3% (mortality258), и тогда «через год вы
     живёте там же» и «продали свою долю» не выполняются по другой причине. */
  const asH = await pg.evaluate(new Function('ids', advanceSrc + `
    const keepMort = mortality258; mortality258 = () => false;
    try {
    const ok = continueAs274(ids.spouse);
    const mode = s.housing.mode, city = s.housing.city, prop = s.properties.find(p => p.id === s.housing.propertyId);
    const a = prop && estates58().assets.find(a => a.id === prop.familyRecord58), part = a?.owners?.player || 0;
    let opts = []; const keep = show; show = (t, x, o) => { opts = o || []; };
    try { if (prop) propertyMenu(prop.id); } finally { show = keep; }
    const locked = opts.filter(o => /Продать|Сдава|аренд/i.test(o.label || ''));
    const cost = homeCost();
    // Содержание дома за три месяца: вы платите только свою долю (строка «Содержание доли жилья»), строка жилья — 0.
    const full = a ? a.property.price * (a.property.kind === 'house' ? .00065 : .0004) : 0, upkeep = { rent: 0, share: 0 };
    for (let m = 0; m < 3; m++) {
      const t = s.clock.ticks + 1;
      advance(1);
      upkeep.rent += (s.finance32?.receipts || []).filter(r => r.tick === t && r.kind === 'rent').reduce((n, r) => n + (r.paid || 0), 0);
      upkeep.share += (s.family17?.ledger || []).filter(e => String(e.key).includes('family-share58:' + a?.id + ':' + t)).reduce((n, e) => n + (e.parts ? e.parts.reduce((x, q) => x + q.amount, 0) : e.amount || 0), 0);
    }
    upkeep.expected = 3 * full * part;
    advance(9);
    const stay = s.housing.mode === 'own' && s.housing.propertyId === prop?.id && s.properties.some(p => p.id === prop?.id);
    const sold = a ? sellShare58(a.id) : false;
    return { ok, mode, city, share: !!prop?.share274, part, locked: locked.length > 0 && locked.every(o => o.disabled), cost, upkeep, stay, sold, after: s.housing.mode, props: s.properties.length,
      text: s.log.find(e => e.title === 'История семьи продолжается')?.text || '', bad: __bad() };
    } finally { mortality258 = keepMort; }`), fam6);
  console.log('     вдова в своём доме: ' + asH.text);
  check(asH.ok && asH.mode === 'own' && asH.city === 'Рим' && asH.share && asH.part > 0 && asH.part < 1, 'вдова или вдовец остаётся в доме, где жили вместе, — совладельцем', JSON.stringify([asH.mode, asH.city, asH.share, asH.part]));
  check(asH.locked && asH.stay && Number.isFinite(asH.cost), 'дом с долей нельзя продать или сдать целиком; через год вы живёте там же', JSON.stringify([asH.locked, asH.stay, asH.cost]));
  check(asH.upkeep.rent < 0.5 && asH.upkeep.expected > 0 && Math.abs(asH.upkeep.rent + asH.upkeep.share - asH.upkeep.expected) <= 2,
    'содержание дома с долей — только по своей доле (доли других не оплачиваются второй раз)', JSON.stringify(asH.upkeep));
  check(asH.sold && asH.after === 'rent' && asH.props === 0, 'продали свою долю — переезд в аренду', JSON.stringify([asH.sold, asH.after, asH.props]));
  check(!asH.bad.length && errors.length === before7, 'совладелец: год без ошибок', errors.slice(before7, before7 + 3).join(' | '));

  // Взрослая дочь 20 лет жила с отцом в его доме, другого родителя рядом нет: остаётся дома совладелицей.
  const before7b = errors.length;
  const asC = await pg.evaluate(new Function(advanceSrc + `
    __born('it', '18', 'both');
    const P = s; P.age = 46; P.year += 28; P.birthYear = P.year - 46; P.clock.ticks += 28 * 12;
    for (const p of s.people) { p.age += 28; if (['Мать', 'Отец', 'Бабушка', 'Дедушка', 'Брат', 'Сестра'].includes(p.role)) p.alive = false; }
    const city = 'Болонья', other = 'Палермо';
    const prop = { id: 'home-274child', country: 'it', city, area: 'center', kind: 'flat', price: countries.it.cost * 13, rented: false };
    s.properties.push(prop);
    Object.assign(s.housing, { country: 'it', city, area: 'center', mode: 'own', propertyId: prop.id, active: true, occupant: null });
    const mk = (age, gender, c) => { const p = person('Ребенок', age, gender, 'it'); p.city18 = c; childBirthIdentity166(p, [s]); p.birthYear = s.year - age; s.people.push(p); familyState27(); p.bio27.parents = ['player']; p.bio27.born = s.clock.ticks - age * 12; p.role = 'Ребенок'; return p; };
    const d = mk(20, 'f', city), son = mk(23, 'm', other);
    s.dead = true; s.ending = 'Жизнь закончилась.'; log('Последняя запись', s.ending, 'Конец', true); estateObserve58(); save(); flushSave264(); render();
    const ok = continueAs274(d.id);
    const own = s.properties.find(p => p.id === s.housing.propertyId);
    const out = { ok, mode: s.housing.mode, city: s.housing.city, share: !!own?.share274, part: own ? estates58().assets.find(a => a.id === own.familyRecord58)?.owners?.player || 0 : 0 };
    advance(6);
    out.stay = s.housing.mode === 'own' && s.properties.some(p => p.id === own?.id); out.bad = __bad();
    return out;`));
  check(asC.ok && asC.mode === 'own' && asC.city === 'Болонья' && asC.share && asC.part > 0 && asC.part < 1 && asC.stay, 'взрослая дочь, жившая с отцом в его квартире, остаётся там совладелицей', JSON.stringify(asC));
  check(!asC.bad.length && errors.length === before7b, 'дочь-совладелица: полгода без ошибок', errors.slice(before7b, before7b + 3).join(' | '));

  // Вдова переехала из дома с долей в аренду: в следующем месяце за дом — только строка своей доли, без полного
  // «Содержания объекта» (копия дома в s.properties убирается до расчёта месяца).
  const fam6b = await pg.evaluate(new Function('o', 'return (' + buildFamily.toString() + ')(o)'), { home: true, pet: true });
  const before7c = errors.length;
  const asMove = await pg.evaluate(new Function('ids', advanceSrc + `
    const kid2 = s.people.find(p => p.id === ids.kid2);
    const petBefore = estates58().pets.filter(r => r.pet.name === 'Мурка').map(r => (r.owner === ids.kid2 ? 'kid2' : r.owner) + ':' + r.status);
    const ok = continueAs274(ids.spouse);
    const cat = estates58().pets.find(r => r.pet.name === 'Мурка');
    const pets = { before: petBefore, mine: s.pets.map(p => p.name), record: cat ? (cat.owner === ids.kid2 ? 'kid2' : cat.owner) + ':' + cat.status : null,
      text: /Питом(ец|цы) оста/.test(s.log.find(e => e.title === 'История семьи продолжается')?.text || '') };
    const prop = s.properties.find(p => p.id === s.housing.propertyId), a = prop && estates58().assets.find(a => a.id === prop.familyRecord58);
    s.cash += 100000;
    const moved = moveHome('rent', s.housing.city, 'center');
    const t = s.clock.ticks + 1; advance(1);
    const object = (s.finance32?.receipts || []).filter(r => r.tick === t && String(r.creditor || '').includes(prop?.id || '?')).map(r => r.kind + ':' + Math.round(r.paid));
    const share = (s.family17?.ledger || []).filter(e => String(e.key).includes('family-share58:' + a?.id + ':' + t)).length;
    return { ok, pets, share274: !!prop?.share274, moved: moved !== false && s.housing.mode === 'rent', object, share, copies: s.properties.filter(p => p.share274).length, part: a?.owners?.player || 0, bad: __bad() };`), fam6b);
  check(asMove.ok && asMove.share274 && asMove.moved && !asMove.object.length && asMove.share === 1 && asMove.copies === 0 && asMove.part > 0,
    'переехали из дома с долей: в следующем месяце — только строка своей доли, без полного содержания объекта', JSON.stringify(asMove));
  check(asMove.pets.mine.includes('Мурка') && asMove.pets.record === 'player:withPlayer' && asMove.pets.text,
    'кошка умершего остаётся дома с вдовой, которая продолжает (а не уходит в приют или к родне)', JSON.stringify(asMove.pets));
  check(!asMove.bad.length && errors.length === before7c, 'переезд из дома с долей без ошибок', errors.slice(before7c, before7c + 3).join(' | '));

  // Студент без денег продолжает учёбу в кредит: кредит — только на оставшиеся месяцы, а не на всю программу.
  const fam7b = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const asLoan = await pg.evaluate(ids => {
    const g2 = s.people.find(p => p.id === ids.g2); g2.privateCash = 0; g2.bio27.job = null; g2.occupation = 'Поиск работы';
    const pr = programs16.find(q => q.country === 'it' && q.city === g2.city18 && q.level === 'bachelor' && tuition16(q, {}) > 0)
      || programs16.find(q => q.country === 'it' && q.city === g2.city18 && tuition16(q, {}) > 0);
    if (!pr) return { skipped: 'нет платной программы' };
    g2.bio27.study = { program: pr.id, progress: Math.floor(pr.months / 2) };
    continueCache274 = null;
    const keepHelp = tuitionHelp; tuitionHelp = () => 0;
    let ok; try { ok = continueAs274(ids.g2); } finally { tuitionHelp = keepHelp; }
    const x = path16(), st = x.study, p = st && prog16(st.program);
    const fee = p ? tuition16(p, x.applications.find(a => a.id === st.application) || {}) : 0;
    const d = (s.debts || []).find(d => d.pathStudy && d.studyId === st?.id);
    return { ok, payer: st?.payer, progress: st?.progress, months: p?.months, fee: Math.round(fee), balance: d ? Math.round(d.balance) : null, principal: d ? Math.round(d.principal) : null,
      expected: p ? Math.round(fee * (p.months - st.progress)) : null };
  }, fam7b);
  check(asLoan.ok && asLoan.payer === 'loan' && asLoan.progress > 0 && Math.abs(asLoan.balance - asLoan.expected) <= 1 && Math.abs(asLoan.principal - asLoan.expected) <= 1,
    'студент без денег: студенческий кредит — только на оставшиеся месяцы программы', JSON.stringify(asLoan));

  // Работа из карточки: записи о работе нет, но «Занятие» — профессия из каталога; занятие не профессия — «без работы»
  // в списке и в первой записи.
  const fam7c = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const asCard = await pg.evaluate(ids => {
    const kid2 = s.people.find(p => p.id === ids.kid2), niece = s.people.find(p => p.id === ids.niece);
    kid2.bio27.job = null; kid2.bio27.study = null; kid2.occupation = 'Администратор отеля'; kid2.professionalYears = 20;
    niece.bio27.job = null; niece.bio27.study = null; niece.occupation = 'Книжный магазин';
    continueCache274 = null;
    const list = continueCandidates274(), c2 = list.find(c => c.id === kid2.id), cn = list.find(c => c.id === niece.id);
    const ok = continueAs274(kid2.id);
    return { ok, kid2Work: c2?.work ?? null, nieceWork: cn?.work ?? null, job: s.job?.title || null, tenure: s.job?.tenure ?? null,
      text: s.log.find(e => e.title === 'История семьи продолжается')?.text || '' };
  }, fam7c);
  check(asCard.ok && /^Администратор отеля/.test(asCard.job || '') && asCard.kid2Work === '', 'записи о работе нет, но в карточке профессия: новая жизнь начинается с этой работой', JSON.stringify(asCard));
  check(asCard.nieceWork === 'Без работы', 'занятие в карточке — не профессия: в списке «Без работы»', JSON.stringify(asCard.nieceWork));
  const fam7d = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const asIdle = await pg.evaluate(ids => {
    const niece = s.people.find(p => p.id === ids.niece);
    niece.bio27.job = null; niece.bio27.study = null; niece.occupation = 'Книжный магазин';
    continueCache274 = null;
    const ok = continueAs274(ids.niece);
    return { ok, job: s.job?.title || null, text: s.log.find(e => e.title === 'История семьи продолжается')?.text || '' };
  }, fam7d);
  check(asIdle.ok && !asIdle.job && asIdle.text.includes('Работы сейчас нет.'), 'без работы — сказано в первой записи новой жизни', asIdle.text);

  // Своё жильё в другом городе (унаследованная квартира): жизнь продолжается в городе, где человек живёт (Милан, как в
  // списке), с женой; квартира в Риме остаётся его собственностью.
  const fam7e = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const asCity = await pg.evaluate(ids => {
    const b = s.people.find(p => p.id === ids.brother), wife = s.people.find(p => p.id === ids.brotherWife);
    b.bio27.job = null; b.occupation = 'Пенсия';
    const q = makeHouse41(housePool41('it', 'flat', 'suburb')[0], 'Рим', 'suburb', 'low', 'flat', 'buy');
    addNPCProperty58(b, { id: id16('npc-home'), country: 'it', city: 'Рим', area: 'suburb', kind: 'flat', price: q.purchase, rented: false, listing41: q, maintenance41: newMaintenance41() }, { [b.id]: 1 }, 'inheritance');
    continueCache274 = null;
    const c = continueCandidates274().find(c => c.id === b.id);
    const ok = continueAs274(b.id);
    const w = s.people.find(p => p.id === wife?.id);
    return { ok, list: c?.city, city: residenceCity(), mode: s.housing.mode, props: s.properties.map(p => p.city + (p.share274 ? ' (доля)' : '')), wife: w ? { city: w.city18, cohabit: !!w.cohabit, married: !!w.married } : null,
      text: s.log.find(e => e.title === 'История семьи продолжается')?.text || '' };
  }, fam7e);
  check(asCity.ok && asCity.list === 'Милан, Италия' && asCity.city === 'Милан' && asCity.props.includes('Рим') && asCity.wife?.city === 'Милан' && asCity.wife?.cohabit,
    'своё жильё в другом городе: жизнь продолжается в городе из списка, с женой; квартира в Риме остаётся своей', JSON.stringify(asCity));

  // 3ж. Студент: учёба из записи продолжается; круг умершего — знакомые без свиданий, его дело и няня уходят.
  const fam7 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const before8 = errors.length;
  const asS = await pg.evaluate(new Function('ids', advanceSrc + `
    const get = id => s.people.find(p => p.id === id);
    const g2 = get(ids.g2); g2.orientation = 'hetero'; g2.gender = 'm'; g2.bio27.job = null;
    const pr = programs16.find(q => q.country === 'it' && q.city === g2.city18 && q.level === 'bachelor') || programs16.find(q => q.country === 'it' && q.level === 'bachelor');
    g2.bio27.study = { program: pr.id, progress: 20 };
    continueCache274 = null;
    const ok = continueAs274(ids.g2);
    const st = s.path16?.study, friend = get(ids.friend);
    const out = { ok, program: pr.id, study: st ? { program: st.program, progress: st.progress, status: st.status } : null, transfer: s.path16?.transfer || null,
      friendRole: friend?.role, friendCompatible: friend ? compatible(friend) : null, left: [ids.worker, ids.client, ids.nanny, ids.kidFriend].filter(id => get(id)).length,
      text: s.log.find(e => e.title === 'История семьи продолжается')?.text || '' };
    const invites = [], keepQ = queueOnce;
    queueOnce = function (q, ...a) { if (q?.type === 'romance' && get(q.id)?.inherited274) invites.push(get(q.id).name); return keepQ.call(this, q, ...a); };
    try { advance(36); } finally { queueOnce = keepQ; }
    out.invites = invites; out.bad = __bad();
    return out;`), fam7);
  console.log('     студент: ' + asS.text);
  check(asS.ok && asS.study?.program && asS.study.progress >= 14 && !asS.transfer, 'студент: учёба продолжается в той же или такой же программе, пройденное засчитано', JSON.stringify([asS.program, asS.study, asS.transfer]));
  check(asS.friendRole === 'Знакомый' && asS.friendCompatible === false && !asS.invites.length, 'подруга умершего — знакомая; свиданий от круга умершего за три года нет', JSON.stringify([asS.friendRole, asS.friendCompatible, asS.invites.slice(0, 3)]));
  check(asS.left === 0, 'работник и клиент его дела, няня и друг сестры уходят из списка', String(asS.left));
  check(!asS.bad.length && errors.length === before8, 'студент: три года без ошибок', errors.slice(before8, before8 + 3).join(' | '));

  // 3з. Опека — по правилам ребёнка-игрока: родитель, который переезжает, её не берёт; тётя и дядя — тоже;
  // без родителей, бабушек, дедушек и взрослых братьев и сестёр — приёмная семья или детский дом.
  const fam8 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const before9 = errors.length;
  const asF = await pg.evaluate(new Function('ids', advanceSrc + `
    const get = id => s.people.find(p => p.id === id);
    get(ids.kid1).npcMove = { due: s.year + 1, country: 'fr' };
    get(ids.kid2).alive = false; get(ids.spouse).alive = false;
    continueCache274 = null;
    const list = continueCandidates274(), g1 = list.find(c => c.id === ids.g1), g3 = list.find(c => c.id === ids.g3);
    const ok = continueAs274(ids.g3);
    const care = s.family17?.care136, host = s.people.find(p => p.id === s.housing.occupant), mode = s.housing.mode;
    advance(12);
    return { g1: g1?.minor?.text || '', g3: g3?.minor?.text || '', g3kind: g3?.minor?.kind || '', ok, kind: care?.kind, hostRole: host?.role, mode, bad: __bad() };`), fam8);
  check(asF.g1.includes('Живёт у папы'), 'мама, которая собирается переезжать, опеку не берёт — внучка живёт у папы', asF.g1);
  check(asF.g3kind === 'foster' && !/тёт|дяд/i.test(asF.g3), 'тётя и дядя опеку автоматически не берут — как у ребёнка-игрока', asF.g3);
  check(asF.ok && ['foster', 'residential'].includes(asF.kind) && ['Приёмный опекун', 'Воспитатель детского дома'].includes(asF.hostRole) && asF.mode === 'host',
    'без родителей, бабушек, дедушек и взрослых братьев и сестёр — приёмная семья или детский дом', JSON.stringify([asF.kind, asF.hostRole, asF.mode]));
  check(!asF.bad.length && errors.length === before9, 'опека: год без ошибок', errors.slice(before9, before9 + 3).join(' | '));

  // 3и. Продолжение за мать умершего: отец — её муж (союз родителей), наследник по закону, как до перехода.
  const before10 = errors.length;
  const asM = await pg.evaluate(() => {
    __born('de', '18', 'both');
    const P = s; P.age = 40; P.year += 22; P.birthYear = P.year - 40; P.clock.ticks += 22 * 12;
    for (const p of s.people) { p.age += 22; if (['Бабушка', 'Дедушка'].includes(p.role)) p.alive = false; }
    const mother = s.people.find(p => p.role === 'Мать'), father = s.people.find(p => p.role === 'Отец');
    const union = s.family27.unions.find(u => u.legacy)?.status;
    s.dead = true; s.ending = 'Жизнь закончилась.'; log('Последняя запись', s.ending, 'Конец', true); estateObserve58(); save(); flushSave264(); render();
    const before = spouse58(mother.id) === father.id, fatherName = father.name;
    const ok = continueAs274(mother.id), partner = currentPartner();
    return { ok, union, before, partner: partner?.name === fatherName, married: !!partner?.married, label: partner?.kin274 || '', spouse: !!partner && spouse58('player') === partner.id };
  });
  check(asM.ok && asM.union === 'together' && asM.before && asM.partner && asM.married && asM.spouse, 'за мать умершего: отец — её муж и наследник по закону, как до перехода', JSON.stringify(asM));

  // Брак родителей через два продолжения: персонаж → его дочь → после её смерти за бабушку. Дедушка — её муж и наследник.
  const before10b = errors.length;
  const hop = await pg.evaluate(() => {
    __born('de', '18', 'both');
    const P = s; P.age = 50; P.year += 32; P.birthYear = P.year - 50; P.clock.ticks += 32 * 12;
    for (const p of s.people) { p.age += 32; if (['Бабушка', 'Дедушка'].includes(p.role)) p.alive = false; }
    const mother = s.people.find(p => p.role === 'Мать'), father = s.people.find(p => p.role === 'Отец');
    if (!mother || !father || s.family27.unions.find(u => u.legacy)?.status !== 'together') return { skipped: 'родители не вместе' };
    mother.alive = true; father.alive = true;
    const kid = person('Ребенок', 24, 'f', 'de'); kid.city18 = residenceCity(); childBirthIdentity166(kid, [s]); kid.birthYear = s.year - 24;
    s.people.push(kid); familyState27(); kid.bio27.parents = ['player']; kid.bio27.born = s.clock.ticks - 24 * 12; kid.role = 'Ребенок';
    const die = () => { s.dead = true; s.ending = 'Жизнь закончилась.'; log('Последняя запись', s.ending, 'Конец', true); estateObserve58(); save(); flushSave264(); render(); };
    die();
    const ok1 = continueAs274(kid.id);
    die();
    continueCache274 = null;
    const c = continueCandidates274().find(c => c.id === mother.id);
    const ok2 = c ? continueAs274(mother.id) : false;
    const partner = currentPartner();
    return { ok1, cand: c?.label || null, ok2, partner: partner?.id === father.id, married: !!partner?.married, label: partner?.kin274 || '', spouse: !!partner && spouse58('player') === partner.id };
  });
  check(hop.skipped || hop.ok1 && hop.ok2 && hop.partner && hop.married && hop.spouse, 'брак родителей переживает два продолжения: за бабушку — дедушка её муж и наследник', JSON.stringify(hop));
  check(errors.length === before10b, 'два продолжения подряд без ошибок', errors.slice(before10b, before10b + 3).join(' | '));

  // Пометка «знакомы через умершего» (inherited274) считается заново при каждом продолжении: жена дяди в жизни
  // племянницы — пара близкого, а при продолжении за самого дядю — его жена, без пометки.
  const inh = await pg.evaluate(() => {
    __born('de', '18', 'both');
    const P = s; P.age = 50; P.year += 32; P.birthYear = P.year - 50; P.clock.ticks += 32 * 12;
    for (const p of s.people) { p.age += 32; if (['Бабушка', 'Дедушка', 'Мать', 'Отец', 'Брат', 'Сестра'].includes(p.role)) p.alive = false; }
    const mother = s.people.find(p => p.role === 'Мать'), father = s.people.find(p => p.role === 'Отец');
    if (!mother || !father) return { skipped: 'нет родителей' };
    const mk = (role, age, gender, parents) => {
      const p = person(role, age, gender, 'de'); p.city18 = residenceCity(); p.birthYear = s.year - age; s.people.push(p); familyState27();
      p.bio27.parents = parents.slice(); p.bio27.born = s.clock.ticks - age * 12;
      for (const id of parents) { const q = s.people.find(x => x.id === id); if (q?.bio27 && !q.bio27.children.includes(p.id)) q.bio27.children.push(p.id); }
      p.role = role; return p;
    };
    const bro = mk('Брат', 47, 'm', [mother.id, father.id]);
    const wife = person('Партнёр близкого', 46, 'f', 'de'); wife.city18 = bro.city18; s.people.push(wife); familyState27();
    s.family27.unions.push({ id: 'u-bro274', a: bro.id, b: wife.id, status: 'together', since: s.clock.ticks - 200, married270: s.clock.ticks - 200 });
    const kid = mk('Ребенок', 24, 'f', ['player']);
    const die = () => { s.dead = true; s.ending = 'Жизнь закончилась.'; log('Последняя запись', s.ending, 'Конец', true); estateObserve58(); save(); flushSave264(); render(); };
    die();
    const ok1 = continueAs274(kid.id);
    const wifeB = !!s.people.find(p => p.id === wife.id)?.inherited274;
    die(); continueCache274 = null;
    const ok2 = continueAs274(bro.id);
    const w = s.people.find(p => p.id === wife.id);
    return { ok1, ok2, wifeB, role: w?.role, label: w?.kin274 || null, inherited: !!w?.inherited274 };
  });
  check(inh.skipped || inh.ok1 && inh.ok2 && inh.wifeB && inh.role === 'Партнер' && !inh.inherited,
    'пометка «знакомы через умершего» не переходит в следующее продолжение: жена дяди при продолжении за него — жена, без пометки', JSON.stringify(inh));

  // 3к. Продолжение за того, кто отбывает конечный срок: заключение продолжается, по окончании — освобождение.
  const fam9 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const before11 = errors.length;
  const asJ = await pg.evaluate(new Function('ids', advanceSrc + `
    const niece = s.people.find(p => p.id === ids.niece);
    niece.custody145 = { status: 'serving', life: false, ends: s.clock.ticks + 4 };
    continueCache274 = null;
    const ok = continueAs274(ids.niece);
    const inside = courtCustody94(), job = !!s.job;
    advance(6);
    let list = ''; const keep = show; show = (t, x, o) => { list = (o || []).map(q => q.label).join(' | '); };
    try { courtList94(); } finally { show = keep; }
    return { ok, inside, job, after: courtCustody94(), released: s.log.some(e => e.title === 'Освобождение'), list, bad: __bad() };`), fam9);
  check(asJ.ok && asJ.inside && !asJ.job, 'за того, кто в заключении: срок продолжается, работы на это время нет', JSON.stringify([asJ.ok, asJ.inside, asJ.job]));
  check(!asJ.after && asJ.released && asJ.list.includes('Приговор до начала этой истории'), 'по окончании срока — освобождение; дело видно в «Расследования и суд»', JSON.stringify([asJ.after, asJ.released, asJ.list]));
  check(!asJ.bad.length && errors.length === before11, 'заключение и освобождение без ошибок', errors.slice(before11, before11 + 3).join(' | '));

  // 3к2. Работник дела умершего умер незадолго до него, его наследство ещё оформляется: запись о нём остаётся в списке,
  // дело закрывается в новой жизни без ошибок (без записи prepareEstate58 падал каждый месяц).
  const fam11 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const before12 = errors.length;
  const asCase = await pg.evaluate(new Function('ids', advanceSrc + `
    const w = s.people.find(p => p.id === ids.worker); w.alive = false;
    const q = openEstate58(ids.worker);
    const ok = continueAs274(ids.kid2);
    let err = null;
    try { advance(5); } catch (e) { err = String(e.message || e).slice(0, 160); }
    const c = estates58().cases.find(x => x.id === q?.id);
    return { opened: !!q, ok, err, status: c?.status || null, kept: !!s.people.find(p => p.id === ids.worker && !p.alive), month: s.clock.ticks };`), fam11);
  check(asCase.opened && asCase.ok && !asCase.err && asCase.status && asCase.status !== 'preparing' && asCase.kept && errors.length === before12,
    'наследство умершего работника ещё оформлялось: в новой жизни дело идёт дальше без ошибок', JSON.stringify(asCase) + ' ' + errors.slice(before12, before12 + 2).join(' | '));

  // 3м. Подростковая пара (children55: child55.relationship, до 18 лет): продолжение за 16-летнюю дочь — её пара остаётся
  // парой, как после «Предложить встречаться» (romance54: «Партнер», teenPair54, живёте порознь, встречи подростков), а не
  // становится «Знакомым» из круга умершего с близостью 30 и без свиданий. Через год вы всё ещё вместе.
  const before13 = errors.length;
  const teen = await pg.evaluate(new Function(advanceSrc + `
    __born('it', '18', 'both');
    const P = s; P.age = 45; P.year += 27; P.birthYear = P.year - 45; P.clock.ticks += 27 * 12;
    for (const p of s.people) { p.age += 27; if (['Бабушка', 'Дедушка'].includes(p.role)) p.alive = false; }
    const kid = person('Ребенок', 16, 'f', 'it'); kid.city18 = residenceCity(); childBirthIdentity166(kid, [s]); kid.birthYear = s.year - 16; kid.orientation = 'hetero';
    s.people.push(kid); familyState27(); kid.bio27.parents = ['player']; kid.bio27.born = s.clock.ticks - 16 * 12; kid.role = 'Ребенок';
    const pair = ensureChildPartner55(kid);
    s.dead = true; s.ending = 'Жизнь закончилась.'; log('Последняя запись', s.ending, 'Конец', true); estateObserve58(); save(); flushSave264(); render();
    const ok = continueAs274(kid.id);
    const p = s.people.find(q => q.id === pair?.id);
    let menu = ''; const keep = show; show = t => { menu = t; };
    try { romanceMenu(); } finally { show = keep; }
    const out = { ok, made: !!pair, role: p?.role, bond: p?.bond, inherited: !!p?.inherited274, compatible: !!p && compatible(p), current: !!p && currentPartner()?.id === p.id,
      teen: !!p && teenExisting54(p), cohabit: !!p?.cohabit, menu };
    advance(12);
    out.after = !!p && currentPartner()?.id === p.id && p.role === 'Партнер'; out.age = s.age; out.bad = __bad();
    return out;`));
  check(teen.ok && teen.made && teen.role === 'Партнер' && !teen.inherited && teen.compatible && teen.current && teen.teen && !teen.cohabit && /^Встречи/.test(teen.menu),
    'подросток в паре: после продолжения пара остаётся парой (встречаетесь, живёте порознь), а не знакомым умершего', JSON.stringify(teen));
  check(teen.after && !teen.bad.length && errors.length === before13, 'подростковая пара: через год вы вместе, без ошибок', JSON.stringify([teen.after, teen.age]) + ' ' + errors.slice(before13, before13 + 2).join(' | '));

  // 3н. Подпись «Родство · Кем приходится» — по нынешнему древу: партнёрша сына, за которого продолжили, после свадьбы —
  // «Жена», после развода — «Бывшая жена», а не «Партнёрша», как в момент перехода. На карточке в древе — то же.
  const fam12 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const kinNow = await pg.evaluate(ids => {
    const kid2 = s.people.find(p => p.id === ids.kid2);
    const wife = person('Партнёр близкого', 46, 'f', 'it'); wife.city18 = kid2.city18; wife.orientation = 'hetero'; s.people.push(wife); familyState27();
    adultState55(kid2).partner = wife.id; adultState55(wife).partner = kid2.id;
    save(); flushSave264(); continueCache274 = null;
    const ok = continueAs274(ids.kid2);
    const w = s.people.find(p => p.id === wife.id);
    const shown = () => {
      const sec = personSections42(w).find(x => x && x.title === 'Родство');
      const card = treeCard90(treeGraph90(), w.id, { x: 0, y: 0 });
      return { section: (JSON.stringify(sec || '').match(/Кем приходится","value":"([^"]*)"/) || [])[1] || null, card: (card.match(/<small>([^<]*)<\/small>/) || [])[1] || null };
    };
    const out = { ok, stored: w?.kin274 || null, start: shown() };
    w.married = true; out.married = shown();
    w.married = false; w.divorced = true; w.role = 'Бывший партнер'; out.divorced = shown();
    return out;
  }, fam12);
  check(kinNow.ok && kinNow.start.section === 'Партнёрша' && kinNow.married.section === 'Жена' && kinNow.divorced.section === 'Бывшая жена' && kinNow.start.card === 'Партнёрша' && kinNow.married.card !== 'Партнёрша',
    'подпись родства меняется вместе с браком и разводом: «Партнёрша» → «Жена» → «Бывшая жена»', JSON.stringify(kinNow));

  // 3о. Достаток семьи у несовершеннолетнего — по тому, у кого он живёт, а не по своим деньгам с наследством: сирота,
  // получивший всё наследство, — не «обеспеченная семья», и в 18 лет нет записи «Родители готовы оплачивать университет».
  // Последний родитель умер в год вашего совершеннолетия — тоже нет.
  const before14 = errors.length;
  const means = await pg.evaluate(new Function(advanceSrc + `
    const res = {};
    for (const variant of ['orphan', 'lastParent']) {
      __born('it', '18', 'both');
      const P = s; P.age = 45; P.year += 27; P.birthYear = P.year - 45; P.clock.ticks += 27 * 12;
      for (const p of s.people) { p.age += 27; if (['Бабушка', 'Дедушка', 'Брат', 'Сестра'].includes(p.role)) p.alive = false; }
      const age = variant === 'orphan' ? 16 : 17;
      const kid = person('Ребенок', age, 'f', 'it'); kid.city18 = residenceCity(); childBirthIdentity166(kid, [s]); kid.birthYear = s.year - age;
      s.people.push(kid); familyState27(); kid.bio27.parents = ['player']; kid.bio27.born = s.clock.ticks - age * 12; kid.role = 'Ребенок';
      let dad = null;
      if (variant === 'lastParent') {
        // Отец — бывший партнёр умершей (не наследник), обеспеченный: ребёнок живёт у него.
        dad = person('Бывший партнер', 47, 'm', 'it'); dad.city18 = kid.city18; dad.orientation = 'hetero'; s.people.push(dad); enrichPerson(dad); familyState27();
        kid.bio27.parents.push(dad.id); if (dad.bio27) dad.bio27.children.push(kid.id); dad.privateCash = countries.it.cost * 8;
      }
      s.cash = countries.it.cost * 8;
      s.dead = true; s.ending = 'Жизнь закончилась.'; log('Последняя запись', s.ending, 'Конец', true); estateObserve58(); save(); flushSave264(); render();
      const ok = continueAs274(kid.id), bg = s.background;
      const keepOutcome = parentAnnualOutcome143;
      if (dad) parentAnnualOutcome143 = p => p.id === dad.id ? 'болезнь' : null;
      try { advance(variant === 'orphan' ? 26 : 13); } finally { parentAnnualOutcome143 = keepOutcome; }
      const e = s.log.find(e => e.title === 'Совершеннолетие');
      res[variant] = { ok, bg, age: s.age, bg18: s.background, text: e?.text || null, parents: s.people.filter(p => p.alive && ['Мать', 'Отец'].includes(p.role)).length, bad: __bad() };
    }
    return res;`));
  check(means.orphan.ok && means.orphan.bg !== 'high' && means.orphan.text && !/Родители готовы оплачивать/.test(means.orphan.text) && means.orphan.parents === 0,
    'сирота с наследством: достаток не «обеспеченная семья», в 18 лет родители не «готовы оплачивать университет»', JSON.stringify(means.orphan));
  check(means.lastParent.ok && means.lastParent.bg === 'high' && means.lastParent.text && !/Родители готовы оплачивать/.test(means.lastParent.text) && means.lastParent.parents === 0 && means.lastParent.bg18 !== 'high',
    'достаток — по родителю, у которого живёте; он умер в год совершеннолетия — в записи о 18 годах родители не платят', JSON.stringify(means.lastParent));
  check(!means.orphan.bad.length && !means.lastParent.bad.length && errors.length === before14, 'достаток семьи: два года без ошибок', errors.slice(before14, before14 + 2).join(' | '));

  // 3п. Супруг в другом городе (у пар NPC города часто разные): никто не переезжает, но первая запись новой жизни говорит
  // «Вы и Имя живёте в разных городах: …». Если город один — такой фразы нет (см. 3д: брат с женой в Милане).
  const fam13 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const apart = await pg.evaluate(ids => {
    const inlaw = s.people.find(p => p.id === ids.inlaw); inlaw.city18 = 'Неаполь'; save(); flushSave264(); continueCache274 = null;
    const ok = continueAs274(ids.kid1);
    const h = s.people.find(p => p.id === ids.inlaw);
    return { ok, me: residenceCity(), him: h?.city18, name: h?.name, role: h?.role, married: !!h?.married, text: s.log.find(e => e.title === 'История семьи продолжается')?.text || '' };
  }, fam13);
  check(apart.ok && apart.role === 'Партнер' && apart.married && apart.me === 'Турин' && apart.him === 'Неаполь' && apart.text.includes('Вы и ' + apart.name + ' живёте в разных городах: Турин и Неаполь.'),
    'супруг в другом городе: никто не переехал, в первой записи — «Вы и Имя живёте в разных городах»', JSON.stringify(apart));
  check(asCity.ok && !/живёте в разных/.test(asCity.text), 'супруги в одном городе: фразы о разных городах нет', asCity.text);

  // 3л. Хранилище заполнено: новая жизнь не записалась — продолжение отменяется, прежняя жизнь остаётся открытой и без
  // ссылки на продолжение, о причине — сообщение. Место появилось — продолжить можно.
  const fam10 = await pg.evaluate(new Function('return (' + buildFamily.toString() + ')()'));
  const asFull = await pg.evaluate(ids => {
    const deadId = s.saveId, idsBefore = vaultIndex().ids.slice(), toasts = [], keepToast = toast;
    toast = function (m, ...r) { toasts.push(String(m)); return keepToast.call(this, m, ...r); };
    const proto = Storage.prototype, keepSet = proto.setItem;
    proto.setItem = function (k, v) {
      if (String(k).startsWith(LIFE_PREFIX) && !String(k).startsWith(LIFE_PREFIX + deadId)) throw new DOMException('Хранилище заполнено', 'QuotaExceededError');
      return keepSet.call(this, k, v);
    };
    let ok;
    try { ok = continueAs274(ids.kid2); } finally { proto.setItem = keepSet; toast = keepToast; }
    flushSave264();
    const stored = readLife(deadId);
    const out = { ok, sameLife: s.saveId === deadId, dead: !!s.dead, link: !!s.continued274, storedLink: !!stored?.continued274, ids: vaultIndex().ids.length, idsBefore: idsBefore.length,
      active: vaultIndex().active === deadId, toast: toasts.some(t => /не хватило места/.test(t)), button: document.body.innerHTML.includes('Продолжить за близкого') };
    out.again = continueAs274(ids.kid2);
    out.againStored = out.again && !!readLife(s.saveId)?.continuedFrom274 && !!readLife(deadId)?.continued274;
    return out;
  }, fam10);
  check(asFull.ok === false && asFull.sameLife && asFull.dead && !asFull.link && !asFull.storedLink && asFull.ids === asFull.idsBefore && asFull.active && asFull.toast && asFull.button,
    'хранилище заполнено: продолжение отменено, прежняя жизнь открыта и без ссылки на продолжение, есть сообщение', JSON.stringify(asFull));
  check(asFull.again && asFull.againStored, 'место появилось — продолжить можно, обе жизни записаны', JSON.stringify([asFull.again, asFull.againStored]));
  } catch (e) {
    check(false, 'продолжение за близкого: раздел не выполнился', String(e.message).split('\n')[0].slice(0, 200));
  }

  // ---------- 4. Настоящее сохранение (по желанию) ----------
  if (process.env.OWNER_SAVE && fs.existsSync(process.env.OWNER_SAVE)) try {
    const raw = fs.readFileSync(process.env.OWNER_SAVE, 'utf8');
    const before4 = errors.length;
    const own = await pg.evaluate(raw => {
      localStorage.clear(); s = null;
      importLives(JSON.parse(raw));
      const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]);
      const who = s.name;
      s.dead = true; s.ending = 'Последние годы здоровье требовало все больше внимания.';
      log('Последняя запись', s.ending, 'Конец', true);
      estateObserve58(); render();
      const list = continueCandidates274();
      // Сын или дочь без записи о работе, у кого в карточке профессия из каталога (на сохранении владелицы — дочь 26 лет,
      // «Администратор отеля»): новая жизнь должна начаться с этой работой.
      const kids = list.filter(c => c.label === 'Сын' || c.label === 'Дочь');
      const cardJob = kids.find(c => c.age >= 18 && c.age < 67 && !c.p.bio27?.job && !c.p.agency55?.job && !c.p.bio27?.study && professions16.some(j => j.title === c.p.occupation));
      const kid = cardJob || kids[0];
      const out = { who, list: list.map(c => c.label + ' ' + c.p.name + ' ' + c.age + (c.work ? ' (' + c.work + ')' : '')), kid: kid?.p.name,
        cardJob: cardJob ? { name: cardJob.p.name, occupation: cardJob.p.occupation } : null };
      out.ok = kid ? continueAs274(kid.id) : false;
      out.job = s.job?.title || null;
      out.name = s.name + ' ' + s.surname; out.age = s.age; out.city = residenceCity();
      const dead = s.people.find(p => p.died274);
      out.dead = dead ? dead.role + '/' + (dead.kin274 || '') : null;
      out.roles = s.people.filter(p => p.kin274 || ['Мать', 'Отец', 'Брат', 'Сестра', 'Ребенок', 'Партнер', 'Бабушка', 'Дедушка', 'Внук', 'Внучка'].includes(p.role)).map(p => p.role + (p.kin274 ? '/' + p.kin274 : '') + ' ' + p.name).slice(0, 14);
      out.tree = treeView90().length;
      save(); flushSave264(); save(); flushSave264();
      out.backup = !!localStorage.getItem(LIFE_PREFIX + s.saveId + '-backup');
      out.circle = ['Сотрудник своего дела', 'Клиент', 'Няня'].filter(r => s.people.some(p => p.role === r));
      return out;
    }, raw);
    console.log('     сохранение владелицы: ' + own.who + ' → ' + own.name + ', ' + own.age + ', ' + own.city + '; умерший — ' + own.dead);
    console.log('     ' + own.roles.join('; '));
    check(own.ok, 'сохранение 271/272: продолжение за ребёнка работает', own.kid || 'нет ребёнка');
    check(!own.cardJob || String(own.job || '').startsWith(own.cardJob.occupation), 'сохранение владелицы: без записи о работе, но с профессией в карточке — новая жизнь с этой работой',
      JSON.stringify([own.cardJob, own.job]));
    check(own.backup, 'сохранение владелицы: у новой жизни есть резервная копия (хранилище не переполнено)');
    check(!own.circle.length, 'сохранение владелицы: работники и клиенты дела умершего, няни — не в списке нового персонажа', own.circle.join(', '));
    const runO = await pg.evaluate(() => { __months(36); return { bad: __bad(), age: s.age }; });
    check(!runO.bad.length && errors.length === before4, 'сохранение владелицы: три года без ошибок', errors.slice(before4, before4 + 3).join(' | '));
  } catch (e) {
    check(false, 'сохранение владелицы: раздел не выполнился', String(e.message).split('\n')[0].slice(0, 200));
  }

  // ---------- 5. Сохранение владелицы и перенос (вместе со сборкой 275: save275.js) ----------
  // Смерть → продолжение за ребёнка → «Скачать резервную копию всех персонажей» → очистка браузера → «Восстановить из
  // файла» (настоящий выбор файла) → «Добавить сохранения» → прежняя жизнь → «Открыть продолжение →».
  if (process.env.OWNER_SAVE && fs.existsSync(process.env.OWNER_SAVE) && !BASE) {
    if (!INDEX.includes('save275.js')) console.log('     перенос сохранения владелицы: пропуск — нет save275.js (без него файл больше 5 МБ не восстанавливается)');
    else try {
      const raw = fs.readFileSync(process.env.OWNER_SAVE, 'utf8');
      const E = await page(browser, { acceptDownloads: true });
      const beforeE = E.errors.length;
      const prep = await E.pg.evaluate(raw => {
        localStorage.clear(); s = null;
        importLives(JSON.parse(raw));
        const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]);
        s.pending = []; if ($('#modal').open) closeModal();
        s.dead = true; s.ending = 'Последние годы здоровье требовало все больше внимания.';
        log('Последняя запись', s.ending, 'Конец', true); estateObserve58(); render();
        const kid = continueCandidates274().find(c => c.label === 'Сын' || c.label === 'Дочь');
        const ok = kid ? continueAs274(kid.id) : false;
        save(); flushSave264();
        return { ok, name: s.name + ' ' + s.surname, lives: vaultIndex().ids.length };
      }, raw);
      const [dl] = await Promise.all([E.pg.waitForEvent('download'), E.pg.evaluate(() => exportLives())]);
      const file = path.join(os.tmpdir(), 'verify274-export-' + process.pid + '.json');
      await dl.saveAs(file);
      const size = fs.statSync(file).size;
      await E.pg.evaluate(() => { flushSave264(); s = null; localStorage.clear(); intro(); openLives(); });
      const [fc] = await Promise.all([E.pg.waitForEvent('filechooser'),
        E.pg.evaluate(() => [...document.querySelectorAll('#modal button')].find(b => /Восстановить из файла/.test(b.textContent)).click())]);
      await fc.setFiles(file);
      await E.pg.waitForFunction(() => $('#modal').open && /Восстановить персонажей/.test(document.querySelector('#modal').innerText), null, { timeout: 60000 });
      await E.pg.evaluate(() => [...document.querySelectorAll('#modal button')].find(b => /Добавить сохранения/.test(b.textContent)).click());
      const back = await E.pg.evaluate(() => {
        const ids = vaultIndex().ids, dead = ids.find(id => readLife(id)?.continued274);
        if (!dead) return { lives: ids.length, dead: false };
        loadCharacter(dead); if ($('#modal').open) closeModal();
        const btn = [...document.querySelectorAll('#app button')].find(b => /Открыть продолжение/.test(b.textContent));
        const had = !!btn; btn?.click();
        if ($('#modal').open) closeModal();
        return { lives: ids.length, dead: true, had, now: s.name + ' ' + s.surname, alive: !s.dead, from: !!s.continuedFrom274 };
      });
      try { fs.unlinkSync(file); } catch (e) {}
      console.log('     перенос: файл ' + (size / 1048576).toFixed(2) + ' МБ, жизней ' + prep.lives + ' → ' + back.lives + ', открыто: ' + back.now);
      check(prep.ok && back.dead && back.lives === prep.lives && back.had && back.alive && back.from && back.now === prep.name,
        'сохранение владелицы: продолжение → копия всех жизней → очистка → «Восстановить из файла» → «Открыть продолжение →»', JSON.stringify({ size, prep, back }));
      check(E.errors.length === beforeE, 'перенос сохранения владелицы без ошибок страницы', E.errors.slice(beforeE, beforeE + 3).join(' | '));
      await E.ctx.close();
    } catch (e) {
      check(false, 'перенос сохранения владелицы: раздел не выполнился', String(e.message).split('\n')[0].slice(0, 200));
    }
  }

  console.log(`\n${pass} ok, ${fail} fail`);
  await ctx.close();
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
