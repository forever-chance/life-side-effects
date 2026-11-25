// Проверки сборки 272.2 (feed2722.js): театральная студия и шум в ленте.
//   node tools/verify2722_feed.js            BASE=1 — без feed2722.js; SEED=7 — зерно случайности
// 1. Ребёнок в Испании (Валенсия) с рождения; с 8 лет — «Кукольный театр», после 10 — «Школьная театральная студия»,
//    до 11 лет: пьесы не повторяются подряд, роль предлагают не больше раза за постановку, в карточке клуба видны
//    пьеса, этап, роль и что дальше; в ленте — читка, роль и премьера с названием, репетиции — в «Будни».
// 2. Лента той же жизни: нет «X: своя жизнь», «Знакомое лицо · X», «Неожиданный личный прогресс»; «Получается лучше»
//    называет занятие и прирост, не чаще раза в год. Счётчики записей по видам и 10 примеров — в выводе.
// 3. Точечно: заметки близких (что в «Будни», что отдельной записью), E0034, старое сохранение посреди постановки.
// 4. Взрослая «Театральная студия»: одна пьеса на карточке и в премьере, принятое предложение — следующей постановкой.
// 5. Взрослая студия, своя пьеса: предложили в месяц вступления и месяцем позже; сохранение 272 (без feed2722.js),
//    где предложение ждёт ответа или уже принято, открыто страницей с feed2722.js — пьеса идёт следующей постановкой.
//    Роли педагога по полу ребёнка; роли своей пьесы — «Педагог дал вам эпизодическую роль».
//   FEED=путь — раздать вместо feed2722.js другой файл (например, версию до исправления), чтобы увидеть, что ловят проверки.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const BASE = process.env.BASE === '1';
const SEED = +(process.env.SEED || 7);
const FEED = process.env.FEED ? path.resolve(process.env.FEED) : null;
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (extra ? ' — ' + extra : '')); };

// old: страница сначала без feed2722.js (сохранение 272), reopen() — та же жизнь из хранилища уже с ним.
async function newPage(browser, { old = false } = {}) {
  const ctx = await browser.newContext(), served = { feed: !old };
  await ctx.addInitScript(seed => { let x = seed >>> 0 || 1; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }, SEED);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? '' : rel === 'feed2722.js' && FEED ? fs.readFileSync(FEED) : fs.readFileSync(f);
    if (rel === 'index.html') {
      let t = body.toString('utf8');
      if (BASE || !served.feed) t = t.replace(/<script src="feed2722\.js[^"]*"><\/script>/, '');
      else if (!/feed2722\.js/.test(t)) t = t.replace('<script src="bootstrap61.js', '<script src="feed2722.js"></script><script src="bootstrap61.js');
      body = Buffer.from(t);
    }
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage(); const errors = []; pg.on('pageerror', e => errors.push(e.message));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  return { pg, errors, served };
}
// Сохранение — в хранилище, страница перезагружается уже с feed2722.js и открывает ту же жизнь.
async function reopen(P) {
  await P.pg.evaluate(() => { save(); flushSave264(); });
  P.served.feed = true;
  await P.pg.reload();
  await P.pg.waitForFunction("typeof start==='function'&&document.readyState==='complete'");
  await P.pg.evaluate(() => { if (!(typeof s !== 'undefined' && s)) resume(); });
  await P.pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await P.pg.evaluate(helpers);
}
async function born(pg, age) {
  await pg.selectOption('#country', 'es');
  if (age) await pg.selectOption('#startAge', String(age));
  await pg.click('text=Родиться'); await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(helpers);
}
function helpers() {
  try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
  if ($('#modal').open) closeModal();
  // Семья остаётся в Испании: проверяем студию, а не переезды.
  beginFamilyMove = function () { return false; }; if (typeof completeFamilyMove17 === 'function') completeFamilyMove17 = function () { return false; };
  window.__answer = () => { let g = 0; while ($('#modal').open && g++ < 8) { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].filter(b => !/Пропускать в будущем|ереех|ереезд|ересел|Уехать|эмигр|Сменить город|в другой город|Выйти из клуба|Приостановить/i.test(b.textContent)); if (!b.length) { closeModal(); break; } b[Math.floor(Math.random() * b.length)].click(); } if ($('#modal').open) closeModal(); };
  window.__month = () => { let g = 0; while (g++ < 30) { if ($('#modal').open) { __answer(); continue; } if (s.pending.length) { resolvePending(); __answer(); continue; } if (s.clock.yearDue) { transact('year', rollYear); __answer(); continue; } break; } advanceMonth(); __answer(); };
}
// Счётчики ленты по видам: имена и названия в заголовке сворачиваются.
const kind = t => t.replace(/^.*: своя жизнь$/, 'X: своя жизнь').replace(/^.*: новости$/, 'X: новости').replace(/«[^»]*»/g, '«…»').replace(/ · (?!«).*$/, ' · …').replace(/^Будни.*/, 'Будни');

(async () => {
  const browser = await chromium.launch();
  // ---------- 1–2. Детская жизнь ----------
  const A = await newPage(browser);
  await born(A.pg, 0);
  const child = await A.pg.evaluate(() => {
    const out = { productions: [], cards: [], menus: [], errs: [], months: 0 };
    const offers = {};
    let joinedAt = null;
    const club = () => clubState19().memberships.find(m => m.status === 'active' && clubKind245(m) === 'play');
    while (!s.dead && s.age < 11 && out.months < 160) {
      try { __month(); } catch (e) { out.errs.push(String(e && e.stack || e).slice(0, 300)); }
      out.months++;
      if (s.age >= 8 && joinedAt === null) { joinedAt = s.clock.ticks; out.logBefore = s.log.length; joinClub19('puppets67'); if ($('#modal').open) closeModal(); joinClub19('kidsBook23'); if ($('#modal').open) closeModal(); out.city = residenceCity(); }
      if (joinedAt === null) continue;
      if (!club() && s.age >= 10 && !clubState19().memberships.some(m => m.type === 'stage67')) { joinClub19('stage67'); if ($('#modal').open) closeModal(); }
      const m = club(); if (!m) continue;
      const p = m.program245, w = clubWork245(m);
      if (p && w) {
        const key = m.id + ':' + p.started;
        let rec = out.productions.find(x => x.key === key);
        if (!rec) { rec = { key, club: clubsCatalog19[m.type].name, work: w.id, title: w.title, started: p.started, offerMonths: 0, offerTitles: [] }; out.productions.push(rec); }
        const items = decisionItems24().filter(i => i.ref.kind === 'club245' && i.q.id === m.id);
        if (items.length) { rec.offerMonths++; rec.offerTitles.push(items[0].title); }
        if (items.length && Math.random() < .5) { clubRoles245(m.id); const b = [...document.querySelectorAll('#modal .options button:not([disabled])')]; if (b.length) b[0].click(); if ($('#modal').open) closeModal(); }
        rec.role = p.role; rec.lastProgress = p.progress;
        if (out.cards.length < 6 && [1, 3].includes(p.progress)) {
          clubDetail19(m.id); out.cards.push($('#modal').innerText.replace(/\n+/g, ' | ').slice(0, 900)); closeModal();
          if (out.menus.length < 2) { clubProgramMenu245(m.id); out.menus.push($('#modal').innerText.replace(/\n+/g, ' | ').slice(0, 700)); closeModal(); }
        }
      }
    }
    out.age = s.age; out.country = s.country; out.cityEnd = residenceCity();
    out.log = s.log.map(e => ({ t: e.title, x: e.text, tag: e.tag, y: e.year, m: e.month, age: e.age }));
    out.joinedAt = joinedAt;
    return out;
  });
  const P = child.productions;
  console.log('\nДетская жизнь: ' + child.months + ' мес., ' + child.age + ' лет, ' + child.country + ' · ' + child.cityEnd + (child.errs.length ? ', ошибки: ' + child.errs.length : ''));
  console.log('Постановки (' + P.length + '):'); for (const x of P) console.log('  ' + x.club + ' · «' + x.title + '» · с ' + x.started + ' · роль: ' + (x.role || '—') + ' · предложений роли (месяцев): ' + x.offerMonths);
  let run = 1, maxRun = P.length ? 1 : 0; for (let i = 1; i < P.length; i++) { run = P[i].work === P[i - 1].work ? run + 1 : 1; maxRun = Math.max(maxRun, run); }
  check(P.length >= 5, 'студия: за три года не меньше пяти постановок', String(P.length));
  check(maxRun < 2, 'студия: одна и та же пьеса не идёт два раза подряд (было: «Питер Пэн» 9 раз подряд)', 'подряд максимум ' + maxRun);
  check(new Set(P.map(x => x.work)).size === P.length, 'студия: за детство пьесы не повторяются', P.map(x => x.title).join(' → ').slice(0, 300));
  const pp = P.filter(x => /Питер Пэн/.test(x.title)).length;
  check(pp <= 1, 'студия: «Питер Пэн» не больше одного раза', String(pp));
  check(P.every(x => x.offerMonths <= 1), 'студия: роль предлагают не больше одного раза за постановку', P.map(x => x.offerMonths).join(','));
  check(P.filter(x => x.offerMonths === 1).length >= 3, 'студия: роль всё же предлагают (раз в постановку)', P.filter(x => x.offerMonths === 1).length + ' из ' + P.length);
  check(P.every(x => x.offerTitles.every(t => t.includes('«' + x.title + '»'))), 'студия: в «Ожидают ответа» — название пьесы', [...new Set(P.flatMap(x => x.offerTitles))].slice(0, 3).join(' | '));
  const feedSince = child.log.slice(0, child.log.length - child.logBefore);
  const done = P.filter(x => feedSince.some(e => e.t === 'Премьера · «' + x.title + '»'));
  check(P.every(x => feedSince.some(e => e.t === 'Читка · «' + x.title + '»' && e.x.includes(x.title))), 'лента: у каждой постановки запись «Читка · «…»» с названием и сюжетом');
  check(P.filter(x => x.lastProgress >= 2 || done.includes(x)).every(x => feedSince.some(e => e.t === 'Роль · «' + x.title + '»' && /роль|роли/i.test(e.x))), 'лента: распределение ролей — запись «Роль · «…»»');
  check(done.length >= 4 && done.every(x => feedSince.some(e => e.t === 'Премьера · «' + x.title + '»' && (!x.role || e.x.includes(x.role)))), 'лента: премьера с названием и вашей ролью', done.length + ' премьер');
  check(!feedSince.some(e => /^(Репетиция|Разбор сцен|Показ|Новая постановка)/.test(e.t)), 'лента: репетиции не отдельными записями');
  check(feedSince.some(e => e.tag === 'Будни' && /репетиции/.test(e.x)), 'лента: репетиции — в «Будни»', (feedSince.find(e => e.tag === 'Будни' && /репетиции/.test(e.x)) || {}).x || '');
  const card = child.cards.find(c => /Этап: репетиции/.test(c)) || child.cards[0] || '';
  check(child.cards.length && child.cards.every(c => /Постановка: «/.test(c) && /Этап: /.test(c) && /Ваша роль: /.test(c) && /Дальше: /.test(c)), 'карточка клуба: пьеса, этап, роль и что дальше', card.slice(card.indexOf('Постановка'), card.indexOf('Постановка') + 260));
  check(child.menus.length && child.menus.every(x => /Этап: /.test(x) && /Ваша роль: /.test(x) && /Дальше: /.test(x)), '«Программа и участие»: этап, роль и что дальше', (child.menus[0] || '').slice(0, 200));
  check(child.menus.length && child.menus.every(x => !/Постановка: «/.test(x)), '«Программа и участие»: пьеса и автор — в заголовке, без повтора строкой «Постановка: …»', (child.menus[0] || '').slice(0, 300));
  // Лента той же жизни.
  const counts = {}; for (const e of feedSince) { const k = kind(e.t) + ' [' + e.tag + ']'; counts[k] = (counts[k] || 0) + 1; }
  console.log('\nЛента с 8 лет: ' + feedSince.length + ' записей; по видам:');
  for (const [k, n] of Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 16)) console.log('  ' + String(n).padStart(3) + '  ' + k);
  console.log('Примеры (10 последних, кроме «Будни»):'); for (const e of feedSince.filter(e => e.tag !== 'Будни').slice(0, 10)) console.log('  ' + e.age + ' лет · ' + e.t + ' — ' + String(e.x).slice(0, 150));
  const all = child.log;
  check(!all.some(e => /: своя жизнь$/.test(e.t)), 'лента: нет «X: своя жизнь»', String(all.filter(e => /: своя жизнь$/.test(e.t)).length));
  check(!all.some(e => /^Знакомое лицо · /.test(e.t)), 'лента: нет «Знакомое лицо · X»', String(all.filter(e => /^Знакомое лицо · /.test(e.t)).length));
  check(!all.some(e => /Провели время вместе: .* у них свои договорённости/.test(e.x)), 'лента: нет «Провели время вместе: X и Y; у них свои договорённости»');
  check(!all.some(e => e.t === 'Неожиданный личный прогресс'), 'лента: нет «Неожиданный личный прогресс» без подробностей', String(all.filter(e => e.t === 'Неожиданный личный прогресс').length));
  const prog = all.filter(e => /^Получается лучше · /.test(e.t));
  check(prog.every(e => /Навык вырос на \d+ .*теперь \d+\/100/.test(e.x)), '«Получается лучше»: занятие и прирост навыка', prog.map(e => e.t + ' — ' + e.x).join(' | ').slice(0, 220));
  const progTicks = prog.map(e => e.y * 12 + (e.m || 0)).sort((a, b) => a - b);
  check(progTicks.every((t, i) => !i || t - progTicks[i - 1] >= 12), '«Получается лучше»: не чаще раза в год', progTicks.join(','));
  const weekdays = all.filter(e => e.tag === 'Будни').map(e => e.x).join(' ');
  check(/встречи со знакомыми/.test(weekdays) && /жизнь близких/.test(weekdays), '«Будни»: встречи со знакомыми и жизнь близких', '');
  check(!child.errs.length && !A.errors.length, 'детская жизнь: без ошибок страницы', (child.errs[0] || A.errors[0] || '').slice(0, 200));

  // ---------- 3. Точечно ----------
  const unit = await A.pg.evaluate(() => {
    const r = {};
    const p = s.people.find(p => p.alive && p.age >= 18 && p.age < 60 && !p.dead) || s.people[0];
    const was = p.bond; p.bond = 70; const name = p.name;
    const note = text => { const n = s.log.length, top = s.log[0]; adultNote55(p, text); const e = s.log[0] !== top ? s.log[0] : null; return e ? e.title + ' — ' + e.text : null; };
    r.routine = ['Собственный план: Сменить работу', 'Провели время вместе: ' + name + ' и Эльвира Карраско Сантана; у них свои договорённости.', 'Новая работа: Повар. Квалификация проверена, зарплата и расходы учитываются в личном кошельке.', 'Регулярно занимается: Театр. Это его собственное время и круг общения.'].map(note);
    r.keep = ['Расстались: ' + name + ' и Эльвира Карраско Сантана. Общая история сохранилась.', 'Начались отношения: ' + name + ' и Эльвира Карраско Сантана. Можно познакомиться, но решения остаются за ними.', 'Переезд по собственному решению: Валенсия → Мадрид. Обустройство оплачено своими деньгами.'].map(note);
    r.history = (p.agency55?.history || []).slice(-6).map(h => h.text);
    const top = s.log[0]; ageNote58(p, 'Питомец Тофу умер от старости.'); r.pet = s.log[0] !== top ? s.log[0].title + ' — ' + s.log[0].text : null;
    const top2 = s.log[0]; ageNote58(p, 'Приобрели квартиру в Валенсия за собственные накопления.'); r.flat = s.log[0] !== top2 ? s.log[0].title : null;
    p.bond = was;
    // Новости родни (family27): прибавка — в «Будни», потеря работы — отдельной записью.
    const kin = s.people.find(q => q.alive && q.bio27);
    if (kin) {
      const b = kin.bond; kin.bond = 80; s.family27.lastNews = -100;
      const top4 = s.log[0]; noteKin27(kin, 'Повышение оплаты труда на 7%.'); r.kinRaise = s.log[0] !== top4 ? s.log[0].title : null;
      const top5 = s.log[0]; noteKin27(kin, 'Работа закончилась; начат поиск.'); r.kinLoss = s.log[0] !== top5 ? s.log[0].title + ' — ' + s.log[0].text : null;
      kin.bond = b;
    }
    // E0034: прирост за год известен — запись с занятием и цифрами; второй раз в том же году — нет.
    s.hobbies.theatre ??= { interest: 60, sessions: 0, skill: 20 };
    if (s.feed2722) { s.feed2722.progress = -100; s.feed2722.skills.theatre = [{ t: s.clock.ticks - 12, v: (s.hobbies.theatre.skill || 0) - 9 }]; }
    const st = catalogState245(); st.events.forEach(q => { if (q.status === 'offered') q.status = 'expired'; }); st.cooldowns.E0034 = -100;
    const top3 = s.log[0]; const q = catalogOffer245('E0034', { hobby: 'theatre', skill: s.hobbies.theatre.skill });
    r.e0034 = q && s.log[0] !== top3 ? s.log[0].title + ' — ' + s.log[0].text : null;
    r.e0034item = q ? (decisionItems24().find(i => i.ref.kind === 'catalog245' && i.q.id === q.id) || {}).title : null;
    if (q) { q.status = 'expired'; st.cooldowns.E0034 = -100; }
    r.e0034again = !!catalogOffer245('E0034', { hobby: 'theatre', skill: s.hobbies.theatre.skill });
    // Старое сохранение: постановка посреди прежнего цикла (прогресс 2, роль не выбрана) — роль уже не спрашивают, постановка доходит до премьеры.
    const m = clubState19().memberships.find(m => m.status === 'active' && clubKind245(m) === 'play') || null;
    if (m) {
      m.program245 = { work: 'P0329', progress: 2, started: s.clock.ticks - 2, role: null };
      r.oldOffer = decisionActive24({ kind: 'club245', id: m.id });
      const before = s.log.length; let g = 0; while (m.program245 && g++ < 8) __month();
      r.oldPremiere = s.log.slice(0, Math.max(0, s.log.length - before + 5)).some(e => /^Премьера · «Питер Пэн/.test(e.title)) || (m.programHistory245 || []).some(h => h.work === 'P0329');
      r.oldMonths = g;
    }
    return r;
  });
  console.log('\nТочечно:'); console.log('  рутина близких: ' + JSON.stringify(unit.routine)); console.log('  перемены: ' + unit.keep.join(' | ')); console.log('  E0034: ' + unit.e0034);
  check(unit.routine.every(x => x === null), 'заметки близких: план, «провели время», работа, увлечение — не в ленте');
  check(unit.keep.length === 3 && /^Расставание · .* — .* и Эльвира Карраско Сантана расстались\.$/.test(unit.keep[0] || '') && /^Новая пара · .* теперь вместе\.$/.test(unit.keep[1] || '') && /^Переезд · .* переезжает в другой город: Валенсия → Мадрид\.$/.test(unit.keep[2] || ''), 'заметки близких: расставание, новая пара и переезд — отдельной записью, простой фразой', unit.keep.join(' | '));
  check(unit.history.some(t => /проводят время вместе\.$/.test(t)) && !unit.history.some(t => /у них свои договорённости/.test(t)), 'карточка близкого: «… проводят время вместе» вместо «у них свои договорённости»', unit.history.join(' | ').slice(0, 200));
  check(unit.kinRaise === null && /^Потеря работы · (.+) — \1 ищет новую работу: прежняя закончилась\.$/.test(unit.kinLoss || ''), 'новости родни: прибавка — «Будни», потеря работы — запись, даже сразу после другой новости', unit.kinRaise + ' | ' + unit.kinLoss);
  check(!all.some(e => /: новости$/.test(e.t) && e.tag === 'Семья'), 'лента: нет «X: новости» (учёба, работа, прибавка родни)', all.filter(e => /: новости$/.test(e.t)).map(e => e.x).join(' | ').slice(0, 200));
  check(/^Не стало питомца · .*: питомец Тофу умер от старости\.$/.test(unit.pet || '') && unit.flat === null, 'возрастные заметки: смерть питомца — запись, покупка квартиры — «Будни»', (unit.pet || '') + ' | ' + unit.flat);
  const e34 = /^Получается лучше · (.+?) — (.+?): .*Навык вырос на (\d+) за год, теперь \d+\/100\.$/.exec(unit.e0034 || '');
  check(!!e34 && e34[1] === e34[2] && +e34[3] >= 9 && unit.e0034item === 'Получается лучше · ' + e34[1], 'E0034: занятие и прирост за год в записи и в «Ожидают ответа»', unit.e0034 + ' | ' + unit.e0034item);
  check(unit.e0034again === false, 'E0034: второй раз в том же году — нет');
  check(unit.oldOffer === false && unit.oldPremiere, 'старое сохранение посреди постановки: роль не спрашивают, постановка доходит до премьеры', JSON.stringify({ offer: unit.oldOffer, premiere: unit.oldPremiere, months: unit.oldMonths }));

  // Роль от педагога (не выбрали сами; режим «всегда автоматически») — по полу: мальчику не дают женских ролей,
  // девочке — мужских; звери, игрушки и рассказчик — кому угодно. Списки — свои, не из игры.
  const female = ['Алиса', 'Червонная Королева', 'Дороти', 'Пеппи', 'Анника', 'Учительница', 'Герда', 'Снежная королева', 'Маленькая разбойница', 'Бабушка', 'Золушка', 'Фея', 'Мачеха', 'Сводная сестра', 'Красная Шапочка', 'Мама', 'Гретель', 'Ведьма', 'Красавица', 'Старшая сестра', 'Мари', 'Венди', 'Динь-Динь'];
  const male = ['Шляпник', 'Волшебник Оз', 'Пиноккио', 'Джеппетто', 'Томми', 'Полицейский', 'Кай', 'Принц', 'Охотник', 'Гензель', 'Отец', 'Атаман разбойников', 'Дроссельмейер', 'Фриц', 'Питер Пэн', 'Капитан Крюк', 'Майкл'];
  const roles = await A.pg.evaluate(() => {
    const g0 = s.gender, age0 = s.age, out = { m: {}, f: {}, works: 0 };
    const works = [...(typeof kidsStage2722 === 'function' ? kidsStage2722() : []).map(w => w.id), 'P0329'];
    out.works = works.length; s.age = 9;
    for (const g of ['m', 'f']) {
      s.gender = g;
      for (const id of works) for (let i = 0; i < 25; i++) {
        // Распределение ролей (месяц после читки) и новая постановка в режиме «всегда автоматически».
        const a = { id: 'probe-' + g, type: 'puppets67', programMode245: 'important_only', program245: { work: id, progress: 1, started: s.clock.ticks - 1, role: null, lastTick: -1 } };
        clubProgramMonth245(a); if (a.program245?.role) (out[g][a.program245.role] = (out[g][a.program245.role] || 0) + 1);
        const b = { id: 'probe-' + g, type: 'puppets67', programMode245: 'auto', program245: null };
        clubProgramMonth245(b); if (b.program245?.role) (out[g][b.program245.role] = (out[g][b.program245.role] || 0) + 1);
      }
    }
    s.gender = g0; s.age = age0;
    return out;
  });
  const boyBad = Object.keys(roles.m).filter(r => female.includes(r)), girlBad = Object.keys(roles.f).filter(r => male.includes(r));
  console.log('  роли от педагога · мальчик: ' + Object.keys(roles.m).join(', ').slice(0, 300) + '\n  роли от педагога · девочка: ' + Object.keys(roles.f).join(', ').slice(0, 300));
  check(roles.works >= 13 && Object.keys(roles.m).length >= 13 && boyBad.length === 0, 'роль от педагога: мальчику — мужская или общая (не «Красная Шапочка», «Герда», «Венди», «Мачеха»…)', boyBad.join(', '));
  check(Object.keys(roles.f).length >= 13 && girlBad.length === 0, 'роль от педагога: девочке — женская или общая (не «Принц», «Отец», «Полицейский», «Атаман разбойников»…)', girlBad.join(', '));

  // ---------- 4. Взрослая студия ----------
  const B = await newPage(browser);
  await born(B.pg, 18);
  const adult = await B.pg.evaluate(() => {
    const out = { mismatch: [], productions: [], errs: [], cards: [] };
    // Взнос студии не проверяем: здесь важна программа, а не бюджет восемнадцатилетнего.
    const pay = payExpense23; payExpense23 = function (amount, purpose, key, ...rest) { return String(key).startsWith('club:') ? true : pay.call(this, amount, purpose, key, ...rest); };
    joinClub19('theatre'); if ($('#modal').open) closeModal();
    const m = clubState19().memberships.find(m => m.type === 'theatre');
    if (!m) return { error: 'no theatre membership' };
    clubDetail19(m.id); closeModal();
    let proposed = false;
    for (let i = 0; i < 26 && !s.dead; i++) {
      try { __month(); } catch (e) { out.errs.push(String(e).slice(0, 200)); }
      if (m.status !== 'active') { m.status = 'active'; m.blocked = null; }
      const w = clubWork245(m), p = m.program245;
      if (w && p) {
        if (theatre53(m).title !== w.title || (m.project86 && m.project86.title !== w.title)) out.mismatch.push(i + ': ' + theatre53(m).title + ' / ' + w.title);
        let rec = out.productions.find(x => x.started === p.started); if (!rec) { rec = { started: p.started, title: w.title, offerMonths: 0 }; out.productions.push(rec); }
        if (decisionItems24().some(x => x.ref.kind === 'club245' && x.q.id === m.id)) rec.offerMonths++;
        if (!proposed && p.progress === 2) { proposed = true; proposeClub86(m.id, 'Своя пьеса'); if ($('#modal').open) closeModal(); if (m.project86?.proposal) m.project86.proposal.roll = .1; }
        if (out.cards.length < 1 && p.progress === 3) { clubDetail19(m.id); out.cards.push($('#modal').innerText.replace(/\n+/g, ' | ').slice(0, 900)); closeModal(); }
      }
    }
    out.queued = m.queued2722 || null;
    out.premieres = s.log.filter(e => /^Премьера · /.test(e.title)).map(e => ({ t: e.title, x: e.text })).reverse();
    out.unquoted = s.log.filter(e => /^Премьера · (?!«)/.test(e.title)).map(e => e.title);
    // Старое сохранение (до 272.2): language-clubs53 репетирует «Три сестры» 11 встреч, программа — другую пьесу.
    const old = { id: id16('club'), type: 'theatre', country: s.country, city: residenceCity(), language: m.language, status: 'active', joined: s.clock.ticks, progress: 0, sessions: 40, totalPaid: 0, lastPaid: -1, lastProcessed: -1, lastRoster: s.clock.ticks, roster: [], program245: { work: 'P0001', progress: 1, started: s.clock.ticks - 1, role: 'Гамлет' }, theatre53: { title: 'Три сестры', began: 29, proposal: null, history: [] } };
    m.status = 'left'; clubState19().memberships.push(old);
    const before = s.log.length; let g = 0; while (g++ < 3 && !(old.theatre53.history || []).length) { if (old.status !== 'active') { old.status = 'active'; old.blocked = null; } __month(); }
    const fresh = s.log.slice(0, s.log.length - before);
    out.migrated = { months: g, premiere: fresh.filter(e => e.title === 'Премьера · «Три сестры»').length, other: fresh.filter(e => /^Премьера · /.test(e.title) && e.title !== 'Премьера · «Три сестры»').length, history: (old.programHistory245 || []).map(h => h.work).join(',') + ' ' + (old.theatre53.history || []).map(h => h.title).join(','), next: old.theatre53.title };
    out.feed = s.log.filter(e => /^(Читка|Роль|Премьера) · /.test(e.title) || /^Премьера · /.test(e.title)).map(e => e.title).reverse();
    return out;
  });
  console.log('\nВзрослая студия: ' + (adult.productions || []).map(x => '«' + x.title + '»').join(' → '));
  console.log('  лента: ' + (adult.feed || []).join(' | ').slice(0, 400));
  check(!adult.error && adult.mismatch.length === 0, 'взрослая студия: на карточке и в приглашениях та же пьеса, что в программе', (adult.mismatch || []).slice(0, 3).join(' ; ') || adult.error || '');
  const prem = (adult.premieres || []);
  check(prem.length >= 3 && prem.every(e => (adult.productions || []).some(x => e.t === 'Премьера · «' + x.title + '»')) && new Set(prem.map(e => e.t)).size === prem.length, 'взрослая студия: премьеры только пьес программы, по одной (нет второй пьесы language-clubs53)', prem.map(e => e.t).join(' | '));
  check(adult.unquoted && adult.unquoted.length === 0, 'взрослая студия: «Премьера · «…»» — название в «ёлочках», как у читки и роли (было «Премьера · Йерма»)', (adult.unquoted || []).join(' | '));
  check(prem.every(e => /показывает спектакль «.+»\. (Ваша роль — .+\. |Вы играете (главную роль|роль второго плана|эпизодическую роль)\. )?Следующую постановку начнут готовить в /.test(e.x)), 'взрослая студия: в премьере — спектакль, ваша роль и что дальше', (prem[0] || {}).x || '');
  check(adult.migrated && adult.migrated.premiere === 1 && adult.migrated.other === 0 && /Три сестры/.test(adult.migrated.history || ''), 'взрослая студия, старое сохранение: начатая постановка доигрывается до премьеры', JSON.stringify(adult.migrated));
  check((adult.productions || []).every(x => x.offerMonths <= 1), 'взрослая студия: роль — не больше раза за постановку', (adult.productions || []).map(x => x.offerMonths).join(','));
  check((adult.productions || []).some(x => x.title === 'Своя пьеса') && (adult.feed || []).includes('Читка · «Своя пьеса»'), 'взрослая студия: принятое предложение — следующей постановкой', (adult.productions || []).map(x => x.title).join(' → '));
  check(adult.cards && /Постановка: «/.test(adult.cards[0] || '') && /Ваша роль: /.test(adult.cards[0] || ''), 'взрослая студия: карточка с пьесой и ролью', (adult.cards && adult.cards[0] || '').slice(0, 300));
  check(!(adult.errs || []).length && !B.errors.length, 'взрослая студия: без ошибок страницы', ((adult.errs || [])[0] || B.errors[0] || '').slice(0, 200));

  // ---------- 5. Взрослая студия: своя пьеса ----------
  // Было: ответ «Предложение принято» в первый же месяц участия (или в первый месяц после загрузки сохранения 272)
  // терялся — название затиралось пьесой программы; в сохранении 272 с уже принятым предложением — тоже.
  const join = () => {
    const pay = payExpense23; payExpense23 = function (amount, purpose, key, ...rest) { return String(key).startsWith('club:') ? true : pay.call(this, amount, purpose, key, ...rest); };
    joinClub19('theatre'); if ($('#modal').open) closeModal();
    const m = clubState19().memberships.find(m => m.type === 'theatre' && m.status === 'active');
    clubDetail19(m.id); closeModal();
    return m.id;
  };
  const months = ([id, n]) => {
    const m = clubState19().memberships.find(m => m.id === id), errs = [];
    for (let i = 0; i < n && !s.dead; i++) { try { __month(); } catch (e) { errs.push(String(e).slice(0, 200)); } if (m.status !== 'active') { m.status = 'active'; m.blocked = null; } }
    return errs;
  };
  const propose = id => { proposeClub86(id, 'Моя пьеса'); if ($('#modal').open) closeModal(); const m = clubState19().memberships.find(m => m.id === id); if (m.project86?.proposal) m.project86.proposal.roll = .1; };
  const follow = ([id, n]) => {
    const pay = payExpense23; payExpense23 = function (amount, purpose, key, ...rest) { return String(key).startsWith('club:') ? true : pay.call(this, amount, purpose, key, ...rest); };
    const m = clubState19().memberships.find(m => m.id === id), before = s.log.length, out = { errs: [], cards: [] };
    for (let i = 0; i < n && !s.dead; i++) {
      try { __month(); } catch (e) { out.errs.push(String(e).slice(0, 200)); }
      if (m.status !== 'active') { m.status = 'active'; m.blocked = null; }
      const w = typeof clubWork245 === 'function' && clubWork245(m);
      if (w && w.title === 'Моя пьеса' && m.program245?.progress === 3 && !out.cards.length) { clubDetail19(m.id); out.cards.push($('#modal').innerText.replace(/\n+/g, ' | ')); closeModal(); }
    }
    out.feed = s.log.slice(0, s.log.length - before).reverse().filter(e => /^(Читка|Роль|Премьера|Предложение принято)/.test(e.title)).map(e => e.title + ' — ' + e.text);
    return out;
  };
  const cases = [];
  for (const [label, opt] of [['вступили и сразу предложили', { delay: 0 }], ['предложили через месяц', { delay: 1 }], ['сохранение 272: предложение ждёт ответа', { old: 'asked' }], ['сохранение 272: предложение уже принято', { old: 'accepted' }]]) {
    const P = await newPage(browser, { old: !!opt.old });
    await born(P.pg, 18);
    const id = await P.pg.evaluate(join);
    const errs = [];
    if (opt.old) {
      // Как в сохранении 272: три месяца в студии, предложение; во втором случае ответ пришёл ещё на 272.
      errs.push(...await P.pg.evaluate(months, [id, 3]));
      await P.pg.evaluate(propose, id);
      if (opt.old === 'accepted') errs.push(...await P.pg.evaluate(months, [id, 1]));
      await reopen(P);
    } else {
      errs.push(...await P.pg.evaluate(months, [id, opt.delay]));
      await P.pg.evaluate(propose, id);
    }
    const r = await P.pg.evaluate(follow, [id, 16]);
    r.errs.unshift(...errs); r.page = P.errors; r.label = label; cases.push(r);
    await P.pg.context().close();
  }
  for (const r of cases) {
    console.log('\n' + r.label + ':\n  ' + r.feed.map(x => x.slice(0, 140)).join('\n  '));
    const own = r.feed.filter(x => /«Моя пьеса»/.test(x.split(' — ')[0]));
    check(own.some(x => x.startsWith('Читка · «Моя пьеса» — ')) && own.some(x => x.startsWith('Премьера · «Моя пьеса» — ')), 'своя пьеса (' + r.label + '): принятое предложение — следующей постановкой, от читки до премьеры', r.feed.map(x => x.split(' — ')[0]).join(' | ').slice(0, 300));
    const role = own.find(x => x.startsWith('Роль · «Моя пьеса»')) || '';
    check(/(Педагог дал вам|Вы играете) (главную роль|роль второго плана|эпизодическую роль)\./.test(role) && !r.feed.some(x => /(Роль дал педагог: |Ваша роль — )(Главная роль|Роль второго плана|Эпизодическая роль)/.test(x)), 'своя пьеса (' + r.label + '): «Педагог дал вам эпизодическую роль», а не «Роль дал педагог: Эпизодическая роль»', role.slice(0, 200));
    if (r.cards.length) check(/Ваша роль: (главная|второго плана|эпизодическая|без закреплённой роли)( \||$)/.test(r.cards[0]), 'своя пьеса (' + r.label + '): в карточке «Ваша роль: эпизодическая»', (/Ваша роль: [^|]*/.exec(r.cards[0]) || [''])[0]);
    check(!r.errs.length && !r.page.length, 'своя пьеса (' + r.label + '): без ошибок страницы', (r.errs[0] || r.page[0] || '').slice(0, 200));
  }
  await browser.close();
  console.log(`\n${pass}/${pass + fail}`); process.exit(fail ? 1 : 0);
})();
