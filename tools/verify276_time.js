// Проверки сборки 276 — одна неделя на всё (time276.js и точечные правки clock.js, life23.js, trajectory16.js,
// creative27.js, clubs19.js):
// 1) журнал недели week276(): строки и суммы сходятся со schedule23 / totalHours / capacity, «Свободно для планов»
//    в панели и сводке = бюджет − обязательства − здоровье − планы (может быть меньше нуля), удалёнка и гибрид,
//    болезнь и травма, часы учёбы в карточке программы = часы в неделе;
// 2) своё дело — одно обязательство по режиму, без дела в расписании; старое дело на паузе из сохранения — один раз;
// 3) месяц: отдых, документы, отклики и дела на 0 ч идут при нуле свободных часов, отдых не добавляет усталости,
//    давно замершие дела старого сохранения — по два в месяц; усталость растёт от нехватки;
// 4) нехватка бьёт по конкретному: оценки и темп учёбы, смены в своём деле, результаты на работе, близкие;
//    «Чем жертвовать первым»; первая запись в «Истории», дальше — «Будни»; часы работы не сбрасываются на 40;
// 5) окно «Неделя не сходится» на каждом входе по решению игрока, облегчить неделю, «Взять всё равно», «Отказаться»;
//    без окна — когда всё помещается и на автоматических путях; телефон 390×844;
// 6) сохранение владелицы: 3 года вперёд без ошибок, NaN и залпа окон;
// 7) исправления по проверке: заочно и кредит, одно число нехватки, отдых и «почти перегрузка», подсказки, отклики,
//    проверки действия раньше окна (работа, учёба, своё дело, клуб, уход за близким), академ из окна, оплата компанией,
//    долгая нехватка без упора в 100;
// 8) баланс по прогонам: нехватка не легче почти занятой недели, отдых при большой нехватке медленнее, оценки не ниже −4.
// 9) решения владелицы после исправлений: пока неделя не сходится, отдых снимает усталость только до границы
//    (base + per × нехватка, не выше cap — time276.floor), неделя сошлась — границы нет; здоровье теряется, пока неделя не
//    сходится: при усталости ≥ 70 в полную силу, ниже — долю нехватка / strain.hours; потеря растёт с длительностью и
//    заменяет прежнее −1 при усталости выше 80 (276, 28.11: и когда неделя сходится — не −1, а как месяц перегрузки),
//    одна запись в «Истории».
// 10) проверка баланса после решений (27.11): «не сходится» с получаса нехватки везде (экран, граница, здоровье); неделя
//    сошлась сразу после перегрузки — не дороже, чем оставить перегрузку; счёт перегрузки не растёт дальше места, где
//    потеря уже max, после 12 месяцев без перегрузки — новая запись; отдых в расписании не отменяет потерю здоровья при
//    нехватке (она зависит и от часов нехватки), только смягчает; отдых в неделе с нехваткой прибавляет здоровью меньше;
//    запись в «Истории» и строки «Самочувствия» — когда потеря уже заметна; восстановление здоровья при нехватке
//    медленнее (как при переутомлении), не вдвойне при переутомлении.
// 11) вторая проверка баланса (27.11): в месяц, когда кончается отдых, полчаса сверх сил не дешевле недели, которая сходится;
//    при усталости ниже 70 отдых смягчает потерю при любой нехватке (доля не больше strain.soft); одно число нехватки — с
//    отдыхом, часть-отдых названа, «Неделя не помещается» — только если не сходится и без отдыха; окно на половинах часа —
//    как панель после; полчаса — граница и для того, кто отдаёт часы, и для настроения.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify276_time.js
// BASE=1 — без time276.js (тег снимается из index.html; точечные правки в старых файлах без него ничего не меняют).
// OWNER_SAVE=путь — сохранение владелицы (по умолчанию owner-save.json рядом с рабочей копией, если есть).
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp' };
const INDEX = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const BASE = process.env.BASE === '1';
const OWNER = process.env.OWNER_SAVE || [path.join(ROOT, '..', 'owner-save.json')].find(f => fs.existsSync(f)) || '';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (ok || extra === '' ? '' : ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 900))); };

async function open(browser, viewport) {
  const ctx = await browser.newContext(viewport ? { viewport } : {});
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    const body = rel === 'offline-game.js' ? '' : rel === 'index.html' && BASE ? INDEX.replace(/<script src="time276\.js[^"]*"><\/script>/g, '') : fs.readFileSync(f);
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage();
  const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  await pg.evaluate(() => {
    window.T = {
      wait: (ms = 30) => new Promise(r => setTimeout(r, ms)),
      title: () => document.querySelector('#modal')?.open ? document.querySelector('#modal h2')?.textContent || '' : '',
      text: () => document.querySelector('#modal')?.open ? document.querySelector('#modal').innerText : '',
      buttons: () => [...document.querySelectorAll('#modal .options button')].map(b => ({ label: b.childNodes[0]?.textContent?.trim() || b.textContent.trim(), hint: b.querySelector('small')?.textContent || '', disabled: b.disabled })),
      click: async re => { const b = [...document.querySelectorAll('#modal .options button:not([disabled])')].find(b => re.test((b.childNodes[0]?.textContent || b.textContent).trim())); if (!b) return false; b.click(); await T.wait(); return true; },
      clean: () => { if ($('#modal').open) closeModal(); s.pending = []; },
      seed: n => { let x = n >>> 0 || 1; Math.random = () => { x ^= x << 13; x >>>= 0; x ^= x >>> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; },
      month: (n = 1) => { for (let i = 0; i < n; i++) { T.clean(); s.illness = null; advanceMonth(); } T.clean(); },
      force: fn => typeof forceRun276 === 'function' ? forceRun276(fn) : fn(),
      free: () => typeof week276 === 'function' ? week276().free : capacity() - totalHours(),
      other: () => s.housing.area === 'center' ? 'suburb' : 'center',
      job: (hours = 40, area = s.housing.area, prof = 'accountant', format) => {
        const p = professions16.find(p => p.id === prof) || professions16[0];
        s.job = { title: p.title, employer: 'Контур', professionId: p.id, salary: c().wage, tenure: 2, format: format || (area === s.housing.area ? 'near' : 'far'), language: country16[s.country][0], allowedCountries: [s.country],
          workplace: { country: s.country, city: residenceCity(), area }, hours28: hours, fullHours28: 40, fraction28: hours / 40 };
        s.workHours = hours; s.hoursJob = s.job.title; return s.job;
      },
      prog: (level = 'bachelor') => programs16.find(p => p.country === s.country && p.city === residenceCity() && p.level === level) || programs16.find(p => p.country === s.country && p.level === level),
      study: (level = 'bachelor') => {
        const x = path16(), p = T.prog(level), aid = 'app-t' + Math.random().toString(36).slice(2);
        x.applications.push({ id: aid, program: p.id, status: 'enrolled' });
        x.study = { id: 'study-' + aid, application: aid, program: p.id, progress: 0, payer: 'self', status: 'active', research: 0, grades: 60, badTerms: 0 };
        return x.study;
      },
      kid: (age, parents = ['player']) => { const k = person('Ребенок', age); k.bond = 75; k.birth49 = { method: 'birth', parents }; k.city18 = residenceCity(); s.people.push(k); enrichPerson(k); return k; },
      partner: () => { const p = person('Партнер', s.age + 1); p.cohabit = true; p.partnerSince = s.year - 3; p.city18 = residenceCity(); p.country = s.country; s.people.push(p); enrichPerson(p); return p; },
    };
  });
  return { pg, errors, ctx };
}
async function life(pg, country = 'nl') {
  await pg.evaluate(c => {
    if (!document.querySelector('#country')) intro();
    for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); }
  }, country);
  await pg.click('text=Родиться');
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock&&!document.querySelector('#country')");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    T.clean(); s.age = 30; s.cash = 1e7; s.skill = 60; s.illness = null; s.health = 85; s.clock.fatigue = 15;
    s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction');
    // Город, где есть бакалавриат: иначе T.study() попадает в программу другого города, и учёба не идёт (и окна нет).
    const bp = programs16.find(p => p.country === s.country && p.level === 'bachelor');
    if (bp && !programs16.some(p => p.country === s.country && p.city === residenceCity() && p.level === 'bachelor')) s.housing.city = bp.city;
    // Местный язык свободно: иначе в части случайных жизней (семья из другой страны) работа и клубы недоступны по языку.
    const lang = country16[s.country][0]; path16().languages[lang] = Math.max(path16().languages[lang] || 0, 5);
  });
}
const ev = async (pg, fn, arg) => { try { return await pg.evaluate(fn, arg); } catch (e) { console.log('     (страница: ' + String(e.message).split('\n').slice(0, process.env.STACK ? 6 : 1).join(' | ') + ')'); return { error: String(e.message) }; } };
const near = (a, b, eps = .06) => Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= eps;

(async () => {
  console.log(BASE ? 'BASE: без time276.js' : 'time276.js' + (INDEX.includes('time276.js') ? ' (из index.html)' : ' (нет в index.html!)'));
  const browser = await chromium.launch();

  // ---------- 1. Журнал недели ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, () => {
      const out = {};
      T.job(40, T.other()); const st = T.study(), p = prog16(st.program);
      const q = schedule23(), L = week276();
      const sum = k => L.lines.filter(l => l.kind === k).reduce((n, l) => n + l.hours, 0);
      out.L = { budget: L.budget, com: L.commitments, hl: L.health, pl: L.plans, free: L.free, cap: L.capacity };
      out.q = q.total; out.tot = totalHours(); out.capNow = capacity(); out.sum = { com: sum('commitment'), hl: sum('health'), pl: sum('plan') };
      out.work = L.lines.find(l => l.key === 'work'); out.studyLine = L.lines.find(l => l.key === 'study');
      out.studyHours = studyHours276(p); out.detail = programDetailData20(p).sections.flatMap(g => g.rows).find(r => r.label === 'Нагрузка')?.value;
      out.panel = schedulePanel59().match(/Свободно для планов: [^<·]*/)?.[0]?.trim(); out.act = activitiesView().match(/Свободно для планов: [^<·]*/)?.[0]?.trim();
      out.notice = healthNotices58().find(i => i.ref.id === 'fatigue')?.note;
      // удалёнка и гибрид
      const raw = commuteFor16({ ...s.job, country: s.country, city: residenceCity(), area: s.job.workplace.area, format: 'far' }) * 10 / 60;
      s.job.format = 'remote'; out.remoteRoad = week276().lines.find(l => l.key === 'work').road;
      s.job.format = 'hybrid'; out.hybridRoad = week276().lines.find(l => l.key === 'work').road; out.rawRoad = raw;
      s.job.format = 'far';
      // болезнь, травма, усталость
      s.illness = { name: 'Респираторная инфекция', severity: 'лёгкая', left: 2 }; incidents56().injury = { kind: 'test', left: 2 }; s.clock.fatigue = 65;
      const H = week276(); out.health = H.lines.filter(l => l.kind === 'health').map(l => [l.key, l.hours]); out.hfree = H.free; out.hcap = capacity();
      out.hcapCalc = Math.max(0, Math.max(0, Math.floor(H.budget - H.commitments - (H.health - 4))) - 4);
      s.illness = null; incidents56().injury = null; s.clock.fatigue = 15;
      // планы: дело, клуб, рукопись
      assign('learn'); T.force(() => joinClub19(Object.keys(clubsCatalog19).find(k => clubAge23(k) && !clubsCatalog19[k].language53)));
      const P = week276(); out.planLines = P.lines.filter(l => l.kind === 'plan').map(l => [l.key.split(':')[0], l.hours]); out.planSum = P.plans; out.planTot = totalHours();
      out.free2 = P.free; out.panel2 = schedulePanel59().match(/Свободно для планов: [^<·]*/)?.[0]?.trim();
      return out;
    });
    if (r.error) check(false, '1. журнал недели', r.error);
    else {
      check(near(r.L.com, r.q) && near(r.L.pl, r.tot) && near(r.sum.com, r.L.com) && near(r.sum.pl, r.L.pl) && near(r.sum.hl, r.L.hl), '1. строки недели складываются в schedule23().total и totalHours()', r);
      check(near(r.L.free, r.L.budget - r.L.com - r.L.hl - r.L.pl), '1. свободно = бюджет − обязательства − здоровье − планы', r.L);
      check(r.L.free < 0 && r.panel === 'Свободно для планов: не хватает ' + Math.round(-r.L.free) + ' ч/нед.' && r.act === r.panel, '1. «Свободно для планов» в панели и сводке — из недели, бывает «не хватает» (округление до часа)', { panel: r.panel, act: r.act, free: r.L.free });
      check(r.capNow === Math.max(0, Math.floor(r.L.budget - r.L.com - r.L.hl)), '1. capacity() = бюджет − обязательства − здоровье (как раньше)', { cap: r.capNow, L: r.L });
      check(r.work && near(r.work.hours, 40 + r.work.road) && r.work.road > 8, '1. работа одной строкой с дорогой (другой район)', r.work);
      check(r.remoteRoad === 0 && near(r.hybridRoad, Math.round(r.rawRoad * 6 * .4) / 6, .2), '1. удалёнка — дорога 0, гибрид — 40% дороги', { remote: r.remoteRoad, hybrid: r.hybridRoad, raw: r.rawRoad });
      check(r.studyLine && near(r.studyLine.hours, r.studyHours) && r.detail === Math.round(r.studyHours) + ' ч/нед.', '1. часы учёбы: в неделе и в карточке программы одни и те же', { line: r.studyLine?.hours, hours: r.studyHours, detail: r.detail });
      check(/^Неделе не хватает \d+ ч/.test(r.notice || ''), '1. сводка: «Неделе не хватает N ч» при перегрузке из одних обязательств', r.notice);
      check(JSON.stringify(r.health) === JSON.stringify([['illness', 6], ['fatigue', 2], ['injury', 4]]) && r.hcap === r.hcapCalc, '1. здоровье: болезнь 6, усталость 65 → 2, травма 4; capacity() вычитает то же', r);
      check(r.planLines.some(x => x[0] === 'task') && r.planLines.some(x => x[0] === 'club') && near(r.planSum, r.planTot), '1. планы: дело и клуб строками, сумма = totalHours()', { planLines: r.planLines, planSum: r.planSum, planTot: r.planTot });
      check(r.panel2 === 'Свободно для планов: не хватает ' + Math.round(-r.free2) + ' ч/нед.', '1. планы уменьшают «Свободно» в панели', { panel: r.panel2, free: r.free2 });
    }
    check(!errors.length, '1. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 2. Своё дело — одно обязательство ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      const out = {}, sch0 = schedule23().total, tot0 = totalHours();
      T.force(() => startEnterprise152('services', 'Мастерская', 'hair')); T.clean();
      const b = s.enterprise152, line = () => week276().lines.find(l => l.key === 'business:' + b.id);
      out.mode = b.mode263; out.self = { sch: schedule23().total - sch0, tot: totalHours() - tot0, line: line()?.hours, label: line()?.label, tasks: s.clock.tasks.filter(t => t.kind === 'business263').length };
      setBusinessMode263(b.id, 'partial'); out.partial = line()?.hours; setBusinessMode263(b.id, 'manager'); out.manager = line()?.hours;
      T.force(() => setBusinessMode263(b.id, 'self'));
      // Второе дело, тоже «сам»: владелец один, часы делятся.
      T.force(() => startEnterprise152('services', 'Вторая', 'hair', true)); T.clean();
      out.two = week276().lines.filter(l => l.area === 'business').map(l => l.hours);
      const b2 = s.enterprise152; closeEnterprise152?.(b2.id); T.clean();
      // Старое сохранение: дело в расписании, да ещё на паузе.
      s.clock.tasks.push({ id: 'business263-' + b.id, kind: 'business263', business263: b.id, progress: 3, duration: 1e9, hours: 35, label: 'Своё дело · ' + b.title + ' · сам', state: 'paused' });
      out.old = { sch: schedule23().total - sch0, tot: totalHours() - tot0, lines: week276().lines.filter(l => l.area === 'business').map(l => l.hours) };
      T.month(1);
      out.migrated = s.clock.tasks.filter(t => t.kind === 'business263').length;
      out.list = taskList05();
      return out;
    });
    if (r.error) check(false, '2. своё дело', r.error);
    else {
      check(r.mode === 'self' && r.self.line === 35 && near(r.self.sch, 35) && r.self.tot === 0 && r.self.tasks === 0, '2. «сам» — 35 ч в обязательствах, не в делах расписания', r.self);
      check(r.partial === 15 && r.manager === 3, '2. «частично» 15, «через управляющего» 3', r);
      check(JSON.stringify(r.two) === '[18,18]', '2. два дела «сам» — одно рабочее место владельца, часы пополам', r.two);
      check(near(r.old.sch, 35) && r.old.tot === 0 && JSON.stringify(r.old.lines) === '[35]', '2. дело на паузе из старого сохранения — часы один раз', r.old);
      check(r.migrated === 0 && !/business263|Как вести дело/.test(r.list), '2. дела «своё дело» уходят из расписания после месяца', r);
    }
    check(!errors.length, '2. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 3. Месяц: темп и усталость ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, () => {
      const out = {};
      T.job(40, T.other()); T.study(); T.job(40, T.other());
      out.free0 = T.free();
      // Отдых, переговоры, отклик, документы на 0 ч и обычный план — при нехватке часов.
      assign('rest'); assign('learn');
      const x = path16();
      task16('workTerms21', 'Разговор о нагрузке', 2, {}, 2);
      task16('papers276', 'Документы', 2, {}, 0);
      const ids = Object.fromEntries(s.clock.tasks.map(t => [t.kind, t.id]));
      const f0 = s.clock.fatigue;
      T.month(1);
      const prog = k => s.clock.tasks.find(t => t.id === ids[k])?.progress ?? (s.taskArchive05.find(a => a.id === ids[k])?.state === 'completed' ? 'done' : 'gone');
      out.m1 = { rest: prog('rest'), learn: prog('learn'), terms: prog('workTerms21'), nat: prog('papers276'), fatigue: s.clock.fatigue - f0, miss: s.time276?.month?.missing };
      T.month(1);
      out.m2 = { rest: prog('rest'), learn: prog('learn'), terms: prog('workTerms21'), nat: prog('papers276') };
      // Отдых не добавляет усталости за перегрузку: свободного ровно 1 ч, отдых 2 ч.
      s.job = null; path16().study = null; s.clock.tasks = []; s.clock.fatigue = 30;
      task16('learn', 'Подготовка', 6, {}, Math.max(1, Math.floor(T.free()) - 1)); assign('rest');
      out.restFree = T.free(); T.month(1); out.restMiss = s.time276?.month?.missingNoRest; out.restFatigue = s.clock.fatigue;
      return out;
    });
    if (r.error) check(false, '3. месяц', r.error);
    else {
      // Отдых при нехватке идёт медленнее (см. 8б), но не стоит.
      check(r.free0 < 0 && r.m1.rest > 0 && r.m1.terms === 1 && (r.m1.nat === 'done' || r.m1.nat >= 1) && r.m1.learn === 0, '3. при нехватке: отдых, переговоры и документы идут, обычный план стоит', r.m1);
      check((r.m2.rest === 'done' || r.m2.rest > r.m1.rest) && r.m2.terms === 'done', '3. переговоры завершаются в срок, отдых продолжается', r.m2);
      check(r.m1.miss > 0 && r.m1.fatigue > 0, '3. усталость растёт от нехватки часов (работа + очная учёба)', r.m1);
      check(r.restFree < 0 && (BASE || r.restMiss === 0) && r.restFatigue <= 31, '3. отдых сверх свободного не добавляет усталости за перегрузку (не +5, как раньше)', { free: r.restFree, miss: r.restMiss, fatigue: r.restFatigue });
    }
    check(!errors.length, '3. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 3б. Старое сохранение: замершие дела — не пачкой ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, () => {
      const now = s.clock.ticks;
      for (let i = 0; i < 6; i++) s.clock.tasks.push({ id: 'old-rest-' + i, kind: 'rest', label: 'Восстановить силы', duration: 2, hours: 2, progress: 1.5, state: 'running', startedAtTick: now - 40 - i });
      delete s.time276;
      const done = () => s.taskArchive05.filter(a => /^old-rest-/.test(a.id) && a.state === 'completed').length;
      const out = [];
      for (let m = 0; m < 4; m++) { T.month(1); out.push(done()); }
      return out;
    });
    if (r.error) check(false, '3б. замершие дела', r.error);
    else check(r[0] <= 2 && r[1] <= 4 && r[3] === 6, '3б. давно замершие дела старого сохранения завершаются по два в месяц', r);
    check(!errors.length, '3б. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 4. Нехватка бьёт по конкретному ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, () => {
      const out = {};
      T.seed(5);
      T.job(40, T.other()); const st = T.study();
      const g0 = st.grades;
      T.month(3);
      const m = s.time276?.month;
      out.study = { grades: st.grades - g0, progress: st.progress, f: m?.f?.study, miss: m?.missing };
      out.note = s.log.filter(e => e.title === 'Неделя не помещается').map(e => ({ text: e.text, major: e.major }));
      out.routine = typeof feed267 === 'function' ? feed267().week['тяжёлые недели'] || 0 : 0;
      out.weekdays = s.log.filter(e => e.weekdays267).map(e => e.text);
      // Заочно: вдвое меньше часов, вдвое меньше платёж и темп.
      const p = prog16(st.program), a = path16().applications.find(a => a.id === st.application);
      const h1 = week276().lines.find(l => l.key === 'study').hours, fee1 = tuition16(p, a), pr1 = st.progress;
      setPartTime276(true);
      out.part = { h: week276().lines.find(l => l.key === 'study').hours / h1, fee: tuition16(p, a) / fee1, label: week276().lines.find(l => l.key === 'study').label };
      T.month(1); out.part.pace = st.progress - pr1;
      setPartTime276(false);
      // Работа первой: результаты падают.
      timeState276().order = ['work', 'plans', 'clubs', 'business', 'study', 'family'];
      const c = company18(), p0 = c.performance;
      T.month(3);
      out.work = { perf: c.performance - p0, f: s.time276.month.f.work, strain: s.time276.workStrain, risk: layoffRisk231(c) };
      timeState276().order = null;
      // Близкие первыми: партнёр и ребёнок.
      path16().study = null; T.job(40, T.other());
      const pt = T.partner(), kid = T.kid(1, ['player', pt.id]);
      timeState276().order = ['family', 'plans', 'clubs', 'business', 'study', 'work'];
      const a0 = pt.inner.affection, s0 = pt.inner.strain, k0 = kid.inner.affection;
      out.famFree = week276().free;
      T.month(3);
      out.family = { aff: pt.inner.affection - a0, strain: pt.inner.strain - s0, kid: kid.inner.affection - k0, f: s.time276.month.f.family };
      timeState276().order = null;
      // Название должности сменилось — часы прежние.
      T.job(20, s.housing.area); s.job.title += ' · грейд 2';
      T.month(1); out.hours = s.workHours;
      return out;
    });
    if (r.error) check(false, '4. последствия', r.error);
    else {
      const want = Math.round((1 - 8 * r.study.f) * 10) / 10;
      check(r.study.f > .1 && r.study.f < .5 && near(r.study.grades, want, .35) && r.study.grades > -3, '4. учёба: оценки за квартал по доле нехватки (не −3 разом)', { ...r.study, want });
      check(r.study.progress > 1.8 && r.study.progress < 3, '4. учёба: темп ~1 − 0,75·доля, не 0,25', r.study);
      check(r.note.length === 1 && r.note[0].major && /Не хватает \d+ ч: меньше времени остаётся на учёбу/.test(r.note[0].text), '4. первый месяц перегрузки — одна запись в «Истории» с цифрами', r.note);
      check(r.routine + r.weekdays.filter(t => /тяжёлые недели/.test(t)).length >= 1, '4. следующие месяцы — в «Буднях»', { routine: r.routine, weekdays: r.weekdays });
      check(near(r.part.h, .5, .01) && near(r.part.fee, .5, .01) && /заочно/.test(r.part.label) && r.part.pace < .55, '4. заочно: вдвое меньше часов, платёж и темп', r.part);
      check(r.work.f > 0 && r.work.perf < 0 && r.work.strain > 0, '4. работа первой: результаты понемногу падают, риск сокращения выше', r.work);
      check(r.famFree < 0 && r.family.f > 0 && r.family.aff < 0 && r.family.strain > 0 && r.family.kid < 0, '4. близкие первыми: меньше тепла с партнёром и ребёнком', r.family);
      check(r.hours === 20, '4. часы работы не сбрасываются на 40 при смене названия должности', r.hours);
    }
    check(!errors.length, '4. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 4б. Своё дело: перегруженный владелец закрывает меньше смен, но не ниже нижней границы ----------
  // Решение владелицы: от одной перегрузки дело не закрывается — смены владельца не ниже уровня, при котором дело,
  // прибыльное при полном присмотре, уходит в минус только из-за нехватки часов. Сравнение: та же жизнь без границы.
  if (!BASE) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      T.seed(9);
      const out = {};
      T.force(() => startEnterprise152('services', 'Мастерская', 'hair')); T.clean();
      const b = s.enterprise152; b.cash = 2e4;
      const last = () => { const h = b.history.at(-1); return { cover: h?.cover272, profit: h ? Math.round(h.sales - h.costs) : null }; };
      // Первые месяцы дело в минусе (раскачка) — перегрузка его не трогает, часы уходят дальше по списку.
      T.job(40, T.other()); T.study();
      T.month(2);
      out.early = { ...last(), floor: s.time276.month.floors[b.id], fb: s.time276.month.fb[b.id], study: s.time276.month.f.study, miss: s.time276.month.missing };
      // Год без перегрузки — дело встаёт на ноги.
      s.job = null; path16().study = null; T.month(12);
      out.full = last();
      // Снова перегрузка: работа в другом районе + очная учёба (~40 ч не хватает), дело первым в списке жертв.
      const snap = JSON.stringify(s);
      const run = () => {
        T.seed(21); const bb = s.enterprise152; T.job(40, T.other()); T.study(); timeState276().order = ['business', 'plans', 'clubs', 'study', 'family', 'work'];
        const rows = [];
        for (let i = 0; i < 18 && bb.status === 'active'; i++) { T.month(1); const h = bb.history.at(-1), m = s.time276.month; rows.push({ cover: h.cover272, profit: h.sales - h.costs, floor: m.floors[bb.id], fb: m.fb[bb.id], f: m.f.business, miss: m.missing, away: !!h.away272 }); }
        return { status: bb.status, warned: !!bb.final272, rows, mean: rows.reduce((n, x) => n + x.profit, 0) / Math.max(1, rows.length), cash: Math.round(bb.cash) };
      };
      out.floor = run();
      s = JSON.parse(snap); const keep = bizFloor276; bizFloor276 = () => 0; out.none = run(); bizFloor276 = keep;
      return out;
    });
    if (r.error) check(false, '4б. своё дело', r.error);
    else {
      check(r.early.floor === 1 && r.early.fb === 0 && r.early.cover === 1 && r.early.study > 0, '4б. дело в минусе (первые месяцы): перегрузка смены не трогает, часы уходят дальше по списку', r.early);
      const x = r.floor.rows;
      check(r.full.profit > 0 && x.length && x.some(y => y.floor > 0 && y.floor < 1 && y.cover < 1) && x.filter(y => !y.away).every(y => near(y.cover, 1 - y.fb, .02) && y.cover >= y.floor - .02 && (y.floor < 1 || y.cover === 1)), '4б. прибыльное дело: смены владельца = 1 − доля нехватки, но не ниже границы', { full: r.full, rows: x.map(y => [y.floor, y.cover, Math.round(y.profit)]) });
      check(r.floor.status === 'active' && !r.floor.warned && r.floor.mean > 0, '4б. с границей: 18 месяцев перегрузки — дело живо и в плюсе', { status: r.floor.status, mean: Math.round(r.floor.mean), cash: r.floor.cash });
      check(r.none.mean < 0 || r.none.status !== 'active' || r.none.warned, '4б. без границы та же перегрузка уводит дело в минус (проверка ловит отсутствие границы)', { status: r.none.status, mean: Math.round(r.none.mean), warned: r.none.warned, covers: r.none.rows.slice(0, 3).map(y => y.cover) });
    }
    check(!errors.length, '4б. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 5. Окно «Неделя не сходится» ----------
  {
    const { pg, errors, ctx } = await open(browser, { width: 390, height: 844 });
    await life(pg, 'nl');
    const r = await ev(pg, async () => {
      const out = {};
      T.job(40, T.other());
      admission16 = () => ({ why: [] });
      const x = path16(), p = T.prog(), aid = 'app-g';
      x.applications.push({ id: aid, program: p.id, status: 'accepted' });
      const free0 = T.free(), need = typeof studyHours276 === 'function' ? studyHours276(p) : 30;
      out.ret = studyStart16(aid, 'self'); await T.wait();
      out.win = { title: T.title(), text: T.text(), buttons: T.buttons(), wide: document.querySelector('#modal').scrollWidth, toast: !!document.querySelector('.toast') };
      // «Не хватит» — то, что панель покажет, когда учёба добавится (вторая проверка: округляется сама нехватка).
      out.expect = { need: Math.round(need), miss: Math.round(need - free0) };
      await T.click(/^Отказаться/); out.refused = !path16().study && !T.title();
      // Облегчить: 75% ставки — окно пересчитывается.
      const sal = s.job.salary;
      studyStart16(aid, 'self'); await T.wait();
      await T.click(/^Работа: 30 ч/); out.light = { hours: s.workHours, salary: s.job.salary / sal, title: T.title(), buttons: T.buttons().map(b => b.label) };
      await T.click(/^Взять$/); out.taken = !!path16().study;
      // «Взять всё равно».
      path16().study = null; x.applications.find(a => a.id === aid).status = 'accepted'; T.job(40, T.other());
      studyStart16(aid, 'self'); await T.wait(); await T.click(/^Взять всё равно/); out.anyway = !!path16().study;
      // Остальные входы: работа, своё дело, режим дела, часы, клуб, питомец, уход, наставник, творческий заказ.
      const seen = {};
      const tryGate = async (key, fn) => { T.clean(); await fn(); await T.wait(); seen[key] = { title: T.title(), buttons: T.buttons().map(b => b.label) }; T.clean(); };
      // Вакансия, которую действие действительно примет (язык, страна, требования), — иначе окна нет (см. 7.)
      const v = { ...(path16().vacancies[0] || {}), id: 'vac-g', title: 'Бухгалтер · 40 ч/нед.', hours28: 40, fullHours28: 40, format: 'far', country: s.country, city: residenceCity(), area: T.other(), profession: 'accountant', salary: c().wage, employer: 'Новый', language: country16[s.country][0], allowedCountries: [s.country] };
      out.vacOk = !jobEligibility16(v).why.length;
      x.jobApplications.push({ id: 'ja-g', vacancy: v, status: 'accepted' });
      T.job(20, s.housing.area);
      await tryGate('job', () => startJob16('ja-g'));
      T.job(40, T.other());
      s.cash = 1e9;
      // Как в форме открытия дела: при отказе базы она пишет тост «Проверь название…» — при окне его быть не должно.
      document.querySelectorAll('.toast').forEach(e => e.remove());
      await tryGate('business', () => { if (!startEnterprise152('services', 'Мастерская', 'hair')) toast('Проверь название и доступные средства.'); });
      out.bizToast = [...document.querySelectorAll('.toast')].some(e => /Проверь название/.test(e.textContent));
      T.force(() => startEnterprise152('services', 'Мастерская', 'hair')); T.clean(); const b = s.enterprise152; T.force(() => setBusinessMode263(b.id, 'partial'));
      await tryGate('mode', () => setBusinessMode263(b.id, 'self'));
      out.modeStill = b.mode263;
      s.workHours = 30; s.job.hours28 = 30;
      await tryGate('hours', async () => { hoursMenu(); await T.wait(); await T.click(/^40 ч\/нед/); });
      const club = Object.keys(clubsCatalog19).find(k => clubAge23(k) && !clubsCatalog19[k].language53);
      await tryGate('club', () => joinClub19(club));
      await tryGate('pet', () => requestPet38('dog', 'Тест'));
      // (в части случайных жизней матери нет — тогда новая, с полной биографией: иначе bio27.parents пуст и проверка падает)
      const mom = s.people.find(p => p.role === 'Мать') || (() => { const m = person('Мать', 92); s.people.push(m); enrichPerson(m); return m; })();
      mom.alive = true; mom.age = 95; mom.bio27 = mom.bio27 || {}; mom.bio27.health = 30; mom.bio27.parents ??= []; mom.country = s.country; mom.city18 = residenceCity();
      await tryGate('elder', () => setElderCare58(mom.id, 'self'));
      await tryGate('mentor', () => planMentoring194('finearts', 'learn'));
      const a = { id: 'cr-g', status: 'offered', until: s.clock.ticks + 3, offer: { id: 'o-g', title: 'Обложка', track: 'finearts', hours: 8, duration: 2, fee: 1000, country: s.country, kind: 'order' } };
      creative47().applications.push(a);
      await tryGate('creative', () => acceptCreative47('cr-g'));
      out.seen = seen;
      // Питомец «всё равно»: переезжает через месяц, проверка часов там не мешает.
      requestPet38('cat', 'Мурка'); await T.wait(); await T.click(/^Взять всё равно/);
      out.petTask = s.clock.tasks.find(t => t.kind === 'queuedAction' && t.action === 'pet')?.payload?.force276 === true;
      const pets0 = s.pets.filter(p => p.alive).length; T.month(1); out.petAdopted = s.pets.filter(p => p.alive).length > pets0;
      // Когда помещается — без окна. Автоматические пути — без окна.
      s.job = null; s.clock.tasks = []; for (const b of ownedEnterprises168()) if (b.status === 'active') T.force(() => setBusinessMode263(b.id, 'manager'));
      const club2 = Object.keys(clubsCatalog19).filter(k => clubAge23(k) && !clubsCatalog19[k].language53 && !clubState19().memberships.some(m => m.type === k))[0];
      out.fitFree = T.free(); joinClub19(club2); await T.wait(); out.fitTitle = T.title(); out.fitNoWindow = !T.title().includes('Неделя') && clubState19().memberships.some(m => m.type === club2 && m.status === 'active');
      out.fitClub = { club2, hours: clubsCatalog19[club2]?.hours, status: clubState19().memberships.filter(m => m.type === club2).map(m => m.status) };
      T.job(40, T.other()); T.study(); T.clean();
      const club3 = Object.keys(clubsCatalog19).filter(k => clubAge23(k) && !clubsCatalog19[k].language53 && !clubState19().memberships.some(m => m.type === k))[0];
      window.continueAs274 = function continueAs274() { return joinClub19(club3); };
      continueAs274(); await T.wait(); out.autoNoWindow = !/Неделя/.test(T.title());
      const catalogChoice245x = function catalogChoice245x() { return requestPet38('dog', 'Катало'); };
      catalogChoice245x(); await T.wait(); out.catalogNoWindow = !/Неделя/.test(T.title());
      return out;
    });
    if (r.error) check(false, '5. окно', r.error);
    else {
      const w = r.win, labels = w.buttons.map(b => b.label);
      check(r.ret === false && w.title === 'Неделя не сходится', '5. учёба при занятой неделе — окно «Неделя не сходится»', w.title);
      check(w.text.includes('+' + r.expect.need + ' ч в неделю') && w.text.includes('Не хватит\n' + r.expect.miss + ' ч'), '5. окно: что добавляется и сколько не хватит — числа недели', { exp: r.expect, text: w.text.slice(0, 400) });
      check(labels.includes('Работа: 30 ч/нед. (75% ставки)') && labels.includes('Работа: 20 ч/нед. (50% ставки)') && labels.includes('Попросить гибрид') && labels.at(-2) === 'Взять всё равно' && labels.at(-1) === 'Отказаться', '5. окно: ставка 75/50%, гибрид, «Взять всё равно», «Отказаться»', labels);
      check(/доход меньше на .* в месяц/.test(w.buttons[0].hint) && /учёбу/.test(w.buttons.find(b => b.label === 'Взять всё равно').hint), '5. в подсказках — деньги в месяц и что пострадает', w.buttons.map(b => b.hint));
      check(w.wide <= 390 && !w.toast, '5. окно на телефоне без горизонтальной прокрутки, без лишнего тоста', w);
      check(r.refused, '5. «Отказаться» — учёба не начата', r.refused);
      check(r.light.hours === 30 && near(r.light.salary, .75, .001) && r.light.title === 'Теперь неделя сходится' && r.light.buttons[0] === 'Взять' && r.taken, '5. «Работа: 30 ч» — окно пересчитано, «Взять» начинает учёбу', r.light);
      check(r.anyway, '5. «Взять всё равно» начинает учёбу', r.anyway);
      for (const k of ['job', 'business', 'mode', 'hours', 'club', 'pet', 'elder', 'mentor', 'creative'])
        check(r.seen[k]?.title === 'Неделя не сходится', '5. окно на входе: ' + k, r.seen[k]);
      check(!r.seen.job?.buttons.some(l => /^Работа:/.test(l)), '5. новая работа: не предлагает урезать прежнюю', r.seen.job?.buttons);
      check(r.modeStill === 'partial' && !r.seen.mode?.buttons.some(l => /Мастерская.*частично/.test(l)), '5. режим дела: до решения режим прежний, то же дело не предлагается «облегчить»', { mode: r.modeStill, b: r.seen.mode?.buttons });
      check(!r.bizToast, '5. своё дело: без тоста «Проверь название» при окне', r.bizToast);
      check(r.petTask && r.petAdopted, '5. питомец «всё равно» переезжает через месяц', { task: r.petTask, adopted: r.petAdopted });
      check(r.fitNoWindow, '5. когда помещается — без окна', { free: r.fitFree, title: r.fitTitle, club: r.fitClub });
      check(r.autoNoWindow && r.catalogNoWindow, '5. продолжение жизни и события каталога — без окна', r);
    }
    check(!errors.length, '5. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 5б. «Нагрузка» и «Чем жертвовать первым» ----------
  {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, async () => {
      const out = {};
      T.job(38, s.housing.area, 'literaryagent'); T.force(() => startEnterprise152('services', 'Мастерская', 'hair')); T.clean();
      const pt = T.partner(); T.kid(1, ['player', pt.id]); assign('learn');
      loadMenu29(); out.text = T.text(); out.buttons = T.buttons().map(b => b.label);
      await T.click(/^«Мастерская»: частично/); out.mode = s.enterprise152.mode263; out.back = T.title();
      loadMenu29(); await T.click(/^Чем жертвовать первым/); out.prTitle = T.title();
      await T.click(/^Сначала — работа/); out.order = timeState276().order?.slice(0, 2) || [];
      Math.random = () => .99; loadMenu29(); await T.click(/^Попросить гибрид/); out.refusedFormat = s.job.format;
      loadMenu29(); out.again = T.buttons().find(b => /^Попросить гибрид/.test(b.label)); T.clean();
      timeState276().format = null;
      Math.random = () => .01; loadMenu29(); await T.click(/^Попросить удалёнку/); out.format = s.job.format; out.road = week276().lines.find(l => l.key === 'work').road;
      out.formatLog = s.log.slice(0, 3).map(e => e.title + ': ' + e.text);
      return out;
    });
    if (r.error) check(false, '5б. нагрузка', r.error);
    else {
      check(['Работа · ', 'Своё дело · Мастерская · сам', 'Дети · уход', 'Планы', 'Чем жертвовать первым'].every(t => r.text.includes(t)), '5б. «Нагрузка»: все строки недели и порядок жертв', r.text.slice(0, 600));
      check(r.mode === 'partial' && r.back === 'Нагрузка и восстановление', '5б. режим дела меняется прямо из «Нагрузки»', r);
      check(r.prTitle === 'Чем жертвовать первым' && r.order[0] === 'work', '5б. «Чем жертвовать первым» меняет порядок', r.order);
      check(r.refusedFormat !== 'hybrid' && r.again?.disabled && /через \d+ мес/.test(r.again.hint), '5б. отказ в гибриде: повторить можно через год', { f: r.refusedFormat, again: r.again });
      check(r.format === 'remote' && r.road === 0, '5б. попросить удалёнку: формат меняется, дорога 0', { f: r.format, road: r.road, log: r.formatLog });
    }
    check(!errors.length, '5б. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 7. Исправления по проверке: деньги, одно число нехватки, отдых, подсказки, отклики ----------
  if (!BASE) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, async () => {
      const out = {};
      // а) Заочно и кредит на остаток: кредит — на полную цену остатка (половина платежа × вдвое больше месяцев).
      {
        T.seed(12); s.age = 25; const st = T.study(); const p = prog16(st.program), a = path16().applications.find(a => a.id === st.application);
        st.progress = 6; const snap = JSON.stringify(s);
        out.feeFull = tuition16(p, a); financeRemaining17(st, a); T.clean(); out.loanFull = (s.debts || []).filter(d => d.student).map(d => d.principal)[0];
        s = JSON.parse(snap); const st2 = path16().study, a2 = path16().applications.find(x => x.id === st2.application);
        setPartTime276(true); T.clean(); out.feePart = tuition16(p, a2);
        financeRemaining17(st2, a2); T.clean(); out.loanPart = (s.debts || []).filter(d => d.student).map(d => d.principal)[0];
        s = JSON.parse(snap); T.clean();
      }
      // б) Одно число нехватки: панель, «Ожидают ответа», «Нагрузка», запись в «Истории» (отдых — тоже часы недели).
      {
        s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); path16().study = null; delete s.time276;
        T.job(40, T.other()); T.study(); assign('rest');
        const L = week276(); out.b = { free: L.free, N: Math.round(-L.free), R: Math.round(-L.free) - Math.round(-(L.free + rest276(L))) };
        out.b.panel = schedulePanel59().match(/Свободно для планов: [^<·]*/)?.[0]?.trim();
        out.b.notice = healthNotices58().find(i => i.ref.id === 'fatigue')?.note;
        loadMenu29(); out.b.menu = (T.text().match(/Неделе не хватает[^\n]*/) || [''])[0]; T.clean();
        T.month(1); const e = s.log.find(e => e.title === 'Неделя не помещается'); out.b.entry = e?.text; out.b.mMiss = s.time276.month.missing;
      }
      // в) Отдых не переводит месяц через порог «почти перегрузка» (+1 вместо −3).
      {
        s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); path16().study = null; T.job(40, s.housing.area); s.clock.fatigue = 30;
        const A = T.free(), P = .8 * A - .8;
        task16('verify276', 'Подготовка', 6, {}, P);
        const snap = JSON.stringify(s);
        T.month(1); out.c = { noRest: s.time276.month.fatigue };
        s = JSON.parse(snap); assign('rest'); out.c.free = T.free(); T.month(1); out.c.rest = s.time276.month.fatigue;
      }
      // г) «Работа: 30 ч» при больном ребёнке: подсказка — те часы, что неделя на самом деле освобождает.
      {
        s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); T.job(40, T.other()); T.kid(3);
        const keep = selfChildCare55; selfChildCare55 = () => true;
        const L = week276(), op = lightenOptions276(L, () => {}, true).find(x => /75%/.test(x.label));
        out.d = { hint: op?.hint, line: L.lines.find(l => l.key === 'work')?.label };
        const W0 = L.free; op.fn(); T.clean(); out.d.real = week276().free - W0; out.d.shown = +(/освободит (\d+) ч/.exec(op.hint || '') || [])[1];
        selfChildCare55 = keep; s.people = s.people.filter(p => p.role !== 'Ребенок');
      }
      // д) Отклики на вакансии при нехватке часов идут, а не стоят.
      {
        s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); T.job(60, T.other()); T.study();
        s.jobSearch.enabled = false; assign('search'); const t = s.clock.tasks.find(t => t.kind === 'search');
        s.clock.tasks.push({ id: 'auto-search-v', kind: 'search', label: 'Отклики на вакансии', careerId: s.jobSearch.careerId, autoSearch: true, duration: 3, progress: 0, hours: 5, probability: 0 });
        out.e = { free: T.free() }; T.month(1);
        const pr = id => s.clock.tasks.find(x => x.id === id)?.progress ?? 'done';
        out.e.search = pr(t.id); out.e.auto = pr('auto-search-v'); out.e.plans = s.time276.month.f.plans;
        path16().study = null;
      }
      return out;
    });
    if (r.error) check(false, '7. исправления', r.error);
    else {
      check(near(r.feePart, r.feeFull / 2, 1) && r.loanFull > 0 && near(r.loanPart, r.loanFull, 1), '7а. заочно: платёж за месяц вдвое меньше, а кредит на остаток — на полную цену', { fee: [r.feeFull, r.feePart], loan: [r.loanFull, r.loanPart] });
      const b = r.b, nums = t => (String(t || '').match(/\((\d+) ч\)/g) || []).map(x => +x.slice(1, -3));
      // Вторая проверка: число одно (с отдыхом), и часть, которая сама отдых, названа — «из них 2 ч — отдых».
      check(b.N >= 1 && b.R === 2 && b.panel === 'Свободно для планов: не хватает ' + b.N + ' ч/нед., из них 2 ч — отдых' && b.notice?.startsWith('Неделе не хватает ' + b.N + ' ч (из них 2 ч — отдых)') && b.menu.startsWith('Неделе не хватает ' + b.N + ' ч (из них 2 ч — отдых)'), '7б. одно число нехватки в панели, «Ожидают ответа» и «Нагрузке» (с отдыхом), часть-отдых названа', b);
      check(nums(b.menu).reduce((n, x) => n + x, 0) === b.N, '7б. «на что меньше времени» в «Нагрузке» складывается в ту же нехватку', { menu: b.menu, N: b.N });
      const m = /Нужно около (\d+) ч в неделю, а сил хватает на (\d+) ч\. Не хватает (\d+) ч \(из них 2 ч — отдых\)/.exec(b.entry || '');
      check(m && +m[1] - +m[2] === +m[3] && +m[3] === Math.round(b.mMiss) && nums(b.entry).reduce((n, x) => n + x, 0) === +m[3], '7б. запись в «Истории»: нужно − сил = не хватает, части складываются', b.entry);
      check(r.c.noRest === -3 && r.c.rest === r.c.noRest, '7в. отдых не переводит месяц в «почти перегрузку» (усталость та же, что без отдыха)', r.c);
      check(Math.abs(r.d.shown - r.d.real) <= .5 && /Работа · .* 20 ч/.test(r.d.line || ''), '7г. больной ребёнок: «освободит N ч» = сколько неделя освобождает на самом деле', r.d);
      check(r.e.free < 0 && r.e.search >= 1 && r.e.auto >= 1, '7д. отклики на вакансии и поиск работы идут при нехватке часов', r.e);
    }
    check(!errors.length, '7. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 8. Баланс по прогонам: шкала усталости без провала, отдых при большой нехватке, потолок оценок ----------
  if (!BASE) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, async () => {
      const out = {};
      const reset = () => { s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); path16().study = null; s.people = s.people.filter(p => !['Партнер', 'Ребенок'].includes(p.role)); delete s.time276; T.clean(); };
      // а) Неделя с нехваткой 1,5 ч (дела) утомляет не меньше, чем почти занятая неделя без нехватки.
      {
        reset(); T.seed(5); T.job(40, s.housing.area); s.clock.fatigue = 30;
        const A = T.free(), snap = JSON.stringify(s);
        task16('verify276', 'Подготовка', 6, {}, A - .5); T.month(1); out.a = { near: s.time276.month.fatigue, nearFree: s.time276.month.free };
        s = JSON.parse(snap); task16('verify276', 'Подготовка', 6, {}, A + 1.5); T.month(1); out.a.short = s.time276.month.fatigue; out.a.shortMiss = s.time276.month.missing;
        // Небольшая нехватка из одних обязательств при усталости 100: восстановление не быстрее свободной недели (−3).
        s = JSON.parse(snap); s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); T.study();
        const f0 = T.free(); s.workHours = s.job.hours28 = 40 + f0 + .7; s.clock.fatigue = 100;
        out.a.small = { free: T.free() }; T.month(1); out.a.small.delta = s.time276.month.fatigue;
      }
      // б) Отдых при большой нехватке: идёт, но вчетверо медленнее и не гасит перегрузку; без нехватки — в срок.
      {
        reset(); T.seed(7); T.job(60, T.other()); T.study(); s.clock.fatigue = 15; assign('rest');
        const rest = () => s.clock.tasks.find(t => t.kind === 'rest');
        out.b = { free: T.free() }; T.month(1); out.b.p1 = rest()?.progress; out.b.pace = s.time276.month.restPace;
        let done = 0; const fat = [];
        for (let i = 0; i < 11; i++) { if (!rest()) { assign('rest'); done++; } T.month(1); fat.push(Math.round(s.clock.fatigue)); }
        out.b.done = done + (rest() ? 0 : 1); out.b.fat = fat;
        reset(); T.job(30, s.housing.area); assign('rest'); out.b.freeOk = T.free(); T.month(1); out.b.p1free = rest()?.progress;
      }
      // в) Оценки за квартал при доле нехватки учёбы 1: не ниже −4; при 0,25 — как раньше, −1.
      {
        const st = timeState276(); st.studyF = [3, 3]; out.c = { full: studyGrade276() }; st.studyF = [.75, 3]; out.c.quarter = studyGrade276();
      }
      return out;
    });
    if (r.error) check(false, '8. баланс', r.error);
    else {
      check(r.a.nearFree >= 0 && r.a.shortMiss >= 1 && r.a.short >= r.a.near, '8а. нехватка 1,5 ч утомляет не меньше, чем почти занятая неделя (было +0,15 против +1)', r.a);
      check(r.a.small.free < -.5 && r.a.small.delta >= -3 - 1e-9, '8а. при усталости 100 и небольшой нехватке восстановление не быстрее свободной недели (−3)', r.a.small);
      check(r.b.free < -12 && r.b.pace === .25 && near(r.b.p1, .25, .01), '8б. отдых при нехватке 12 ч и больше идёт вчетверо медленнее, но идёт', r.b);
      check(r.b.done >= 1 && Math.max(...r.b.fat.slice(-4)) >= 25, '8б. отдых в расписании не гасит большую перегрузку (усталость за год ≥ 25), но завершается', r.b);
      check(r.b.freeOk >= 0 && r.b.p1free === 1, '8б. без нехватки отдых идёт в полную силу', { free: r.b.freeOk, p: r.b.p1free });
      check(r.c.full === -4 && r.c.quarter === -1, '8в. оценки за квартал: при учёбе без часов −4 (было −7), при доле 0,25 — −1', r.c);
    }
    check(!errors.length, '8. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 9. Решения владелицы после исправлений: отдых при нехватке и здоровье при долгой перегрузке ----------
  // а) Пока неделя не сходится, отдых снимает усталость только до границы (base + per × нехватка, не выше cap); граница не
  //    поднимает усталость, которая и так ниже; неделя сошлась — границы нет, отдых снимает усталость до конца.
  // б) Здоровье теряется, только пока неделя не сходится И усталость не ниже 70; растёт с длительностью; одна запись;
  //    при нехватке прежнее −1 из clock.js (усталость выше 80) не добавляется, при неделе, которая сходится, — clock.js, но
  //    как месяц перегрузки (276, 28.11), не −1.
  if (!BASE) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, () => {
      const out = {};
      const reset = () => { s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); path16().study = null; s.people = s.people.filter(p => !['Партнер', 'Ребенок'].includes(p.role)); delete s.time276; T.clean(); s.birthMonth = (s.clock.month + 6) % 12; };
      // Нехватка d ч без отдыха: работа на d ч больше, чем помещается (усталость задаётся заранее — она тоже часы недели).
      // Болезнь снимается заранее: T.month её убирает, и 6 ч болезни иначе исчезали бы из недели прямо в проверке (9б «нехватка 0 ч»).
      const short = (d, fatigue) => { s.illness = null; s.clock.fatigue = fatigue; T.job(40, s.housing.area); const f = T.free(); s.workHours = s.job.hours28 = 40 + f + d; return -T.free(); };
      // То же, но нехватка из планов (дело на d ч сверх свободного): без «работы сверх сил», усталость сама сходит.
      const shortPlan = (d, fatigue) => { s.illness = null; s.clock.fatigue = fatigue; T.job(40, s.housing.area); task16('verify276', 'Подготовка', 60, {}, T.free() + d); return -T.free(); };
      const restRun = () => { assign('rest'); const fat = []; let n = 0; while (s.clock.tasks.some(t => t.kind === 'rest') && n++ < 10) { T.month(1); fat.push(+s.clock.fatigue.toFixed(2)); } return { fat, m: { ...s.time276.month } }; };
      // а1) нехватка 4 ч, усталость 30, отдых — до границы (около 16–18), не ниже
      reset(); T.seed(21); out.a1 = { miss: shortPlan(4, 30) }; Object.assign(out.a1, restRun());
      // а2) неделя сходится (работа 30 ч): отдых снимает усталость ниже той границы, границы нет
      reset(); T.seed(21); s.clock.fatigue = 30; T.job(30, s.housing.area); out.a2 = { free: T.free() }; Object.assign(out.a2, restRun());
      // а3) нехватка 5 ч без отдыха: усталость сама сходит (здесь быстрее обычного — равновесие ниже границы), но не ниже границы
      reset(); T.seed(22); out.a3 = { miss: shortPlan(5, 50), fat: [], floors: [] }; const keepR = time276.recover; time276.recover = .3;
      for (let i = 0; i < 12; i++) { T.month(1); out.a3.fat.push(+s.clock.fatigue.toFixed(2)); out.a3.floors.push(s.time276.month.floor); } time276.recover = keepR; out.a3.m = { ...s.time276.month };
      // а4) нехватка 3 ч, усталость 4 — граница её не поднимает
      reset(); T.seed(23); out.a4 = { miss: shortPlan(3, 4) }; T.month(1); out.a4.after = s.clock.fatigue; out.a4.floor = s.time276.month.floor;
      // а5) большая нехватка (30 ч): граница не выше cap
      reset(); T.seed(24); out.a5 = { miss: short(30, 80) }; T.month(1); out.a5.floor = s.time276.month.floor;
      // б) здоровье: один и тот же месяц с правилом и без (те же случайные числа)
      // each — перед каждым месяцем (держит ту же неделю: случайное сокращение или усталость ниже 70 не должны менять проверку).
      const healthMonth = (setup, months = 1, each = null) => {
        reset(); setup(); const snap = JSON.stringify(s), S = time276.strain, keep = { ...S };
        const logs = () => s.log.filter(e => e.title === 'Перегрузка сказывается на здоровье').length, l0 = logs();
        T.seed(31); const h0 = s.health; for (let i = 0; i < months; i++) { each?.(); T.month(1); } const withRule = { h: s.health - h0, pen: s.time276.month.strainPen || 0, strain: s.time276.strain || 0, fat: s.clock.fatigue, miss: s.time276.month.missingNoRest, log: logs() - l0 };
        s = JSON.parse(snap); S.base = 0; S.grow = 0; S.max = 0; T.seed(31); const h1 = s.health; for (let i = 0; i < months; i++) { each?.(); T.month(1); } Object.assign(S, keep);
        withRule.diff = +(withRule.h - (s.health - h1)).toFixed(3); return withRule;
      };
      const strong = () => { s.health = 80; short(20, 90); };
      out.b1 = healthMonth(strong);
      const dq = Math.round(time276.strain.hours / 4);                          // четверть strain.hours: потеря ещё меньше note
      out.b2 = healthMonth(() => { s.health = 80; short(dq, 55); });          // нехватка, но усталость ниже 70
      out.b3 = healthMonth(() => { s.health = 80; s.clock.fatigue = 90; T.job(30, s.housing.area); });  // усталость 90, неделя сходится
      let H = 0; const keepWeek = () => { if (!s.job) T.job(H, s.housing.area); s.workHours = s.job.hours28 = H; s.clock.fatigue = Math.max(s.clock.fatigue, 90); };
      out.b4 = healthMonth(() => { strong(); H = s.job.hours28; }, 13, keepWeek);   // год с лишним перегрузки: штраф растёт
      // Кто снимает здоровье за месяц: при нехватке — только time276.js (прежнее −1 из clock.js при усталости выше 80 не
      // добавляется), при неделе, которая сходится, — clock.js (276, 28.11: −base, как месяц перегрузки).
      const traced = (setup) => {
        reset(); setup(); T.seed(33); let h = s.health; const src = {};
        Object.defineProperty(s, 'health', { configurable: true, enumerable: true, get() { return h; }, set(v) { const d = v - h; if (d < 0) { const line = (new Error().stack || '').split('\n').slice(2).find(l => /\/[\w-]+\.js/.test(l)) || ''; const f = (line.match(/\/([\w-]+\.js)/) || [])[1] || '?'; src[f] = +((src[f] || 0) + d).toFixed(3); } h = v; } });
        T.month(1); const v = s.health; delete s.health; s.health = v; return { src, pen: s.time276.month.strainPen || 0, F1: s.time276.month.F1, miss: s.time276.month.missingNoRest };
      };
      out.b5 = traced(strong);
      out.b6 = traced(() => { s.health = 80; s.clock.fatigue = 90; T.job(30, s.housing.area); });
      // «Самочувствие» и «Ожидают ответа» говорят об этом
      reset(); T.seed(32); strong(); T.month(2); out.notice = healthNotices58().find(x => x.ref?.id === 'fatigue')?.note; s.illness = null; healthMenu(); out.menu = T.text(); T.clean();
      out.S = { ...time276.strain }; out.F = { ...time276.floor };
      return out;
    });
    if (r.error) check(false, '9. отдых и перегрузка', r.error);
    else {
      const fl = d => Math.min(r.F.cap, r.F.base + r.F.per * d), n = x => String(Math.round(x * 100) / 100).replace('.', ',');
      check(r.a1.miss >= 3.5 && r.a1.m.floor >= fl(2.5) - .01 && Math.min(...r.a1.fat) >= fl(2.5) - .01 && near(r.a1.fat.at(-1), r.a1.m.floor, .5) && r.a1.m.floorHeld > 0, '9а. нехватка 4 ч: отдых снимает усталость только до границы (' + r.F.base + ' + ' + String(r.F.per).replace('.', ',') + ' × нехватка)', r.a1);
      check(r.a2.free >= 0 && !(r.a2.m.floor > 0) && r.a2.fat.at(-1) < fl(2.5) - 3, '9а. неделя сошлась: границы нет, отдых снимает усталость до конца', r.a2);
      check(r.a3.miss >= 4.5 && r.a3.floors.every(f => f > 0) && r.a3.fat.every((f, i) => f >= Math.min(r.a3.floors[i], i ? r.a3.fat[i - 1] : 50) - .01) && r.a3.fat[0] < 50 && Math.min(...r.a3.fat) >= Math.min(...r.a3.floors) - .01 && Math.min(...r.a3.fat) < 50 - 5, '9а. нехватка без отдыха: усталость сходит сама, но не ниже границы', r.a3);
      check(r.a4.floor > 10 && r.a4.after < 10, '9а. граница не поднимает усталость, которая и так ниже', r.a4);
      check(r.a5.floor === r.F.cap, '9а. большая нехватка: граница не выше ' + r.F.cap, r.a5);
      check(r.b1.miss >= 1 && r.b1.fat >= r.S.fatigue && near(r.b1.pen, r.S.base, .001) && near(r.b1.diff, -r.S.base, .02) && r.b1.log === 1, '9б. нехватка и усталость ≥ ' + r.S.fatigue + ': здоровье −' + n(r.S.base) + ' за месяц, одна запись в «Истории»', r.b1);
      check(r.b2.miss >= r.S.hours / 4 - 1 && r.b2.fat < r.S.fatigue && near(r.b2.pen, r.S.base * Math.min(1, r.b2.miss / r.S.hours), .003) && near(r.b2.diff, -r.b2.pen, .02) && r.b2.pen < r.S.note && !r.b2.log, '9б. нехватка ' + Math.round(r.b2.miss) + ' ч, усталость ниже ' + r.S.fatigue + ': здоровье теряет долю нехватка / ' + r.S.hours + ' (' + n(r.b2.pen) + ' за месяц), записи ещё нет', r.b2);
      // 276: решение владелицы 28.11 — неделя сошлась при усталости выше 80 и счёте 0: как месяц перегрузки (−base), не −1.
      check(!(r.b3.miss >= 1) && r.b3.fat >= r.S.fatigue && !r.b3.pen && near(r.b3.diff, -r.S.base, .02), '9б. усталость высокая, но неделя сходится: правила нехватки молчат, выше 80 — −' + n(r.S.base) + ', как месяц перегрузки', r.b3);
      check(r.b4.strain === 13 && near(r.b4.pen, Math.min(r.S.max, r.S.base + r.S.grow), .001) && r.b4.diff < -13 * r.S.base * .8 && r.b4.log === 1, '9б. год перегрузки: потеря за месяц растёт (' + n(r.S.base) + ' → ' + n(Math.min(r.S.max, r.S.base + r.S.grow)) + '), запись одна', r.b4);
      check(r.b5.F1 > 80 && r.b5.miss >= 1 && !r.b5.src['clock.js'] && near(r.b5.src['time276.js'], -r.S.base, .001), '9б. при нехватке и усталости выше 80 здоровье снимает только новое правило (−' + n(r.S.base) + '), не прежнее −1 из clock.js', r.b5);
      check(r.b6.F1 > 80 && !(r.b6.miss >= 1) && near(r.b6.src['clock.js'], -r.S.base, .001) && !r.b6.src['time276.js'], '9б. неделя сходится, усталость выше 80: clock.js снимает −' + n(r.S.base) + ' (как месяц перегрузки), а не −1', r.b6);
      check(/здоровье сдаёт/.test(r.notice || '') && /отдых снимает усталость только до \d+/.test(r.menu) && /здоровье теряет около \d/.test(r.menu), '9. «Ожидают ответа» и «Самочувствие» говорят о границе и о здоровье', { notice: r.notice, menu: r.menu.slice(0, 600) });
    }
    check(!errors.length, '9. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 10. Проверка баланса после решений владелицы ----------
  // а) «Не сходится» — с получаса нехватки везде: 0,6 ч на экране — «не хватает 1 ч», и правила видят то же (граница
  //    отдыха, строки «Самочувствия», здоровье по новому правилу); 0,4 ч — «0 ч», неделя сходится, как раньше.
  // б) Неделя сошлась сразу после долгой перегрузки (усталость 95): clock.js снимает не больше, чем стоила перегрузка, а не −1;
  //    за год «облегчить без отдыха» и «почти облегчить» (0,8 ч) не дороже, чем «оставить нехватку 10 ч». Без перегрузки — −base
  //    (276, 28.11: как месяц перегрузки, не −1).
  // в) 10 лет перегрузки: счёт не дальше strainTop276() (там потеря уже max); 3 года без перегрузки — первый месяц новой
  //    дешевле max, и в «Истории» новая запись.
  // г) Отдых при большой нехватке: граница выше порога усталости — отдых снимает часть усталости, но здоровье при перегрузке
  //    теряется; при нехватке 8 ч отдых по-прежнему выводит из переутомления.
  if (!BASE) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, () => {
      const out = {};
      T.clean(); s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); path16().study = null; s.people = s.people.filter(p => !['Партнер', 'Ребенок'].includes(p.role)); delete s.time276;
      s.birthMonth = (s.clock.month + 6) % 12; s.health = 80; T.job(40, T.other());
      const snap = JSON.stringify(s);
      // Нехватка d ч без отдыха (d < 0 — свободно −d): часы работы подгоняются в несколько шагов (усталость — тоже часы недели).
      const fit = d => { for (let i = 0; i < 6; i++) { const L = week276(), fr = L.free + rest276(L); s.workHours = s.job.hours28 = Math.max(1, s.workHours + fr + d); } return squeeze276(week276(), null, { noRest: true }).missing; };
      // Кто снимает здоровье: по файлам (time276.js — правило перегрузки, clock.js — −1 при усталости выше 80).
      let src = {};
      const trace = () => { let h = s.health; src = {}; Object.defineProperty(s, 'health', { configurable: true, enumerable: true, get() { return h; }, set(v) { const d = v - h; if (d < 0) { const line = (new Error().stack || '').split('\n').slice(2).find(l => /\/[\w-]+\.js/.test(l)) || ''; const f = (line.match(/\/([\w-]+\.js)/) || [])[1] || '?'; src[f] = (src[f] || 0) + d; } h = v; } }); };
      const reset = (F, k = 0, seed = 51) => { s = JSON.parse(snap); trace(); T.seed(seed); s.clock.fatigue = F; const st = timeState276(); st.strain = k; if (k) st.strainEp = { start: s.clock.ticks }; };
      const month = () => { const a = { ...src }; T.month(1); const take = f => +((src[f] || 0) - (a[f] || 0)).toFixed(3); return { t: take('time276.js'), c: take('clock.js'), m: { ...s.time276.month } }; };
      const keepJob = d => { if (!s.job) T.job(40, T.other()); return fit(d); };
      // а
      out.a = [0.4, 0.6].map(d => { reset(85); const dd = fit(d), L = week276();
        const row = { d: +dd.toFixed(2), ui: freeText276(L), notice: healthNotices58().find(x => x.ref?.id === 'fatigue')?.note || '', notes: healthNotes259().filter(x => /отдых снимает|здоровье теряет/.test(x)).length };
        const x = month(); return { ...row, short: x.m.short, floor: x.m.floor, t: x.t, c: x.c }; });
      // б
      reset(95, 40); fit(-3); out.b40 = { ...month(), cap: strainLoss276(40) };
      reset(95, 0); fit(-3); out.b0 = month();
      const year = (k, d) => { reset(95, k); let loss = 0; for (let i = 0; i < 12; i++) { keepJob(d); const x = month(); loss += x.t + x.c; } return +loss.toFixed(2); };
      out.b = { stay: year(40, 10), fits: year(40, -3), almost: year(40, 0.8), stay6: year(6, 10), fits6: year(6, -3) };
      // в
      reset(90); const logs = () => s.log.filter(e => e.title === 'Перегрузка сказывается на здоровье').length;
      for (let i = 0; i < 120; i++) { keepJob(10); s.clock.fatigue = Math.max(s.clock.fatigue, 90); T.month(1); }
      const top = typeof strainTop276 === 'function' ? strainTop276() : null;
      out.c = { k10: timeState276().strain, top, atTop: top && strainLoss276(top), belowTop: top && strainLoss276(top - 1), max: time276.strain.max };
      for (let i = 0; i < 36; i++) { keepJob(-3); T.month(1); }
      out.c.kBreak = timeState276().strain; out.c.epAfter = !!timeState276().strainEp;
      const n0 = logs(); s.clock.fatigue = 90; fit(10); const x = month(); out.c.back = -x.t; out.c.newLog = logs() - n0;
      // г) 4 года одной и той же нехватки с отдыхом в расписании и без: потеря здоровья от перегрузки (strainPen) за 2-й…4-й год.
      const restRun = (d, rest) => { reset(30); if (rest) assign('rest'); let pen = 0, hot = 0, F = 0, hi = 0, w = 0, dd = 0;
        for (let i = 0; i < 48; i++) { if (rest && !s.clock.tasks.some(t => t.kind === 'rest' && !['completed', 'cancelled'].includes(t.state))) assign('rest'); keepJob(d); month(); const m = s.time276.month;
          if (i >= 12) { pen -= m.strainPen || 0; F += s.clock.fatigue; if (m.strainPen > 0) hot++; if (s.clock.fatigue >= time276.strain.fatigue) hi++; w += m.strainShare || 0; dd += m.missingNoRest || 0; } }
        return { pen: +pen.toFixed(2), hot, hi, F: +(F / 36).toFixed(1), w: +(w / 36).toFixed(2), d: +(dd / 36).toFixed(2), floor: s.time276.month.floor, miss: s.time276.month.missingNoRest }; };
      // Нехватка в проверке — средняя за 2-й…4-й год (d), а не последнего месяца (miss): случай в последний месяц мог её снять.
      const dh = Math.round(time276.strain.hours / 2);
      out.d = { big: restRun(22, true), bigNo: restRun(22, false), small: restRun(dh, true), smallNo: restRun(dh, false) };
      // д) Отдых, который заканчивается в этом месяце: в неделе с нехваткой d = hours / 2 он прибавляет здоровью 4 × (1 − d / hours),
      //    в неделе, которая сходится, — полные 4 (здоровье ниже потолка, чтобы health259 не срезал прибавку).
      const restDone = (d, k = 0) => { reset(30, k); s.health = 50; assign('rest'); const t = s.clock.tasks.find(t => t.kind === 'rest'); t.progress = t.duration - .1; keepJob(d);
        let h = s.health; const fn = {}; Object.defineProperty(s, 'health', { configurable: true, enumerable: true, get() { return h; }, set(v) { const dd = v - h; if (dd) { const line = (new Error().stack || '').split('\n').slice(2).find(l => /\/[\w-]+\.js/.test(l)) || ''; const m = line.match(/at (?:([\w$.<>]+) )?\(?[^()]*\/([\w-]+\.js)/) || []; const k = (m[2] || '?') + ':' + String(m[1] || '?').replace(/^Object\./, ''); fn[k] = +((fn[k] || 0) + dd).toFixed(3); } h = v; } });
        T.month(1); const v = s.health; delete s.health; s.health = v; const done = !s.clock.tasks.some(x => x.id === t.id);
        return { done, d: s.time276.month.missingNoRest, short: s.time276.month.short, gain: +((fn['clock.js:finishTask'] || 0) + (fn['time276.js:finishTask'] || 0)).toFixed(3), base: fn['clock.js:finishTask'] || 0, cut: fn['time276.js:finishTask'] || 0, k: s.time276.month.restHealth ?? 1 }; };
      const topK = strainTop276();
      out.e = { short: restDone(dh), fits: restDone(-3), afterTop: restDone(-3, topK), afterHalf: restDone(-3, Math.round(topK / 2)), top: topK };
      { reset(30, topK); s.illness = null; keepJob(-3); out.e.note = healthNotes259().filter(x => /После долгой перегрузки/.test(x)); reset(30, 2); s.illness = null; keepJob(-3); out.e.noteLow = healthNotes259().filter(x => /После долгой перегрузки/.test(x)); }
      // е) Нехватка в четверть strain.hours, усталость низкая (отдых в расписании): потеря сначала меньше note — записи нет, «Самочувствие» молчит
      //    о здоровье; когда за месяцы дойдёт до note — одна запись «Перегрузка сказывается на здоровье» и строка в «Самочувствии».
      reset(30); assign('rest'); const logs2 = () => s.log.filter(e => e.title === 'Перегрузка сказывается на здоровье');
      const f0 = { notes: [], first: null, at: null, text: '' }; let lastPen = 0;
      for (let i = 0; i < 72; i++) { if (!s.clock.tasks.some(t => t.kind === 'rest' && !['completed', 'cancelled'].includes(t.state))) assign('rest'); s.clock.fatigue = Math.min(s.clock.fatigue, 40); s.illness = null; keepJob(Math.round(time276.strain.hours / 4));
        if (i === 0) f0.notes0 = healthNotes259().filter(x => /здоровье теряет/.test(x)); month(); const m = s.time276.month; lastPen = m.strainPen || 0;
        if (f0.first == null) f0.first = lastPen; if (f0.at == null && logs2().length) { f0.at = i; f0.penAt = lastPen; f0.text = logs2()[0].text; f0.prevPen = f0.prev; } f0.prev = lastPen; }
      // Болезнь за 72 месяца могла снять работу или часы: та же неделя и перед чтением «Самочувствия».
      s.illness = null; keepJob(Math.round(time276.strain.hours / 4)); f0.logs = logs2().length; f0.notes = healthNotes259().filter(x => /здоровье теряет/.test(x)); f0.notice = healthNotices58().find(x => x.ref?.id === 'fatigue')?.note || ''; f0.F = s.clock.fatigue; f0.last = lastPen;
      out.f = f0;
      // ж) Восстановление здоровья ниже потолка: при нехватке от strain.hours и низкой усталости — вдвое медленнее, как при
      //    переутомлении; при половине — на четверть; при усталости от 70 — только «переутомление» (не вдвойне); неделя
      //    сходится — полная скорость. «Самочувствие» называет причину.
      const rec = (F, d) => { reset(F); s.illness = null; keepJob(d); s.health = 50; const b = healthBlockers259(); return { d: +shortNoRest276().toFixed(2), b: b.map(x => x[0] + ' ' + x[1].toFixed(3)), rate: recoveryRate259() }; };
      out.g = { full: rec(30, time276.strain.hours + 2), half: rec(30, time276.strain.hours / 2), tired: rec(85, 10), fits: rec(30, -3) };
      reset(30); s.illness = null; keepJob(time276.strain.hours + 2); s.health = 50; T.clean(); healthMenu(); out.g.menu = T.text(); T.clean();
      out.F = { ...time276.floor }; out.S = { ...time276.strain }; out.min = time276.shortMin;
      return out;
    });
    if (r.error) check(false, '10. проверка баланса', r.error);
    else {
      const [a4, a6] = r.a, fl = d => Math.min(r.F.cap, r.F.base + r.F.per * d), n = x => String(Math.round(x * 100) / 100).replace('.', ',');
      check(r.min === .5 && a4.d < .5 && a4.ui === '0 ч/нед.' && !a4.short && !(a4.floor > 0) && !a4.notes && near(a4.c, -r.S.base, .001) && !a4.t, '10а. нехватка 0,4 ч: «0 ч», неделя сходится — правила нехватки молчат, выше 80 из clock.js −' + n(r.S.base), a4);
      check(a6.d >= .5 && a6.ui === 'не хватает 1 ч/нед.' && /не хватает 1 ч/.test(a6.notice) && a6.short && a6.floor > 0 && a6.notes === 2 && !a6.c && near(a6.t, -r.S.base, .001), '10а. нехватка 0,6 ч: на экране «не хватает 1 ч», и правила видят то же — граница отдыха, «Самочувствие», здоровье по новому правилу', a6);
      check(!r.b40.m.short && r.b40.m.F1 > 80 && near(r.b40.c, -Math.min(1, r.b40.cap), .001) && r.b40.cap < 1 && !r.b40.t, '10б. неделя сошлась после долгой перегрузки, усталость выше 80: −' + String(Math.round(Math.min(1, r.b40.cap) * 100) / 100).replace('.', ',') + ' (сколько стоила перегрузка), а не −1', r.b40);
      check(!r.b0.m.short && near(r.b0.c, -r.S.base, .001), '10б. без перегрузки (счёт 0), усталость выше 80, неделя сходится: −' + n(r.S.base) + ', как месяц перегрузки (не прежнее −1)', r.b0);
      check(r.b.fits >= r.b.stay && r.b.almost >= r.b.stay - .05 && r.b.fits6 >= r.b.stay6, '10б. за год: облегчить неделю (или почти) без отдыха не дороже, чем оставить нехватку 10 ч', r.b);
      check(r.c.k10 === r.c.top && near(r.c.atTop, r.c.max, 1e-9) && r.c.belowTop < r.c.max, '10в. 10 лет перегрузки: счёт ' + r.c.k10 + ' мес. — там, где потеря уже max, дальше не растёт', r.c);
      check(r.c.kBreak <= Math.max(0, r.c.top - 36) && !r.c.epAfter && r.c.back < r.c.max - .2 && r.c.newLog === 1, '10в. 3 года без перегрузки: новая начинается мягко (−' + String(Math.round(r.c.back * 100) / 100).replace('.', ',') + ', а не −' + String(r.c.max).replace('.', ',') + ') и с новой записью в «Истории»', r.c);
      const { big, bigNo, small, smallNo } = r.d;
      check(big.d >= 20 && big.F < r.S.fatigue && bigNo.F >= r.S.fatigue && big.hot >= 32 && big.pen < 0 && big.pen <= bigNo.pen * (r.S.soft - .1) && big.pen > bigNo.pen * (r.S.soft + .05), '10г. отдых при нехватке 22 ч: усталость ниже (' + Math.round(big.F) + ' против ' + Math.round(bigNo.F) + '), потерю здоровья смягчает, но не отменяет — ' + n(-big.pen) + ' за 3 года против ' + n(-bigNo.pen) + ' без отдыха', r.d);
      check(small.d >= r.S.hours / 2 - 1 && small.F < r.S.fatigue && small.hot >= 32 && near(small.w, Math.min(r.S.soft, small.d / r.S.hours), .05) && small.pen < 0 && small.pen >= smallNo.pen * 1.2 && small.pen > big.pen, '10г. отдых при нехватке ' + Math.round(small.d) + ' ч: выводит из переутомления, здоровье теряет долю ' + n(small.w) + ' (как без отдыха при той же нехватке и усталости ниже ' + r.S.fatigue + '; меньше, чем при 22 ч)', { small, smallNo });
      check(r.e.short.done && r.e.short.short && near(r.e.short.base, 4, .001) && near(r.e.short.gain, 4 * Math.max(0, 1 - r.e.short.d / r.S.hours), .01) && r.e.short.cut < 0, '10д. отдых закончился в неделе с нехваткой ' + Math.round(r.e.short.d) + ' ч: здоровье +' + n(r.e.short.gain) + ' вместо +4', r.e);
      check(r.e.fits.done && !r.e.fits.short && near(r.e.fits.gain, 4, .001) && !r.e.fits.cut, '10д. отдых в неделе, которая сходится (без перегрузки до этого): здоровье +4, как раньше', r.e.fits);
      // Отдых заканчивается в finishTask раньше strainMonth276 — счёт перегрузки в этот момент тот, что был до месяца.
      check(r.e.afterTop.done && !r.e.afterTop.short && near(r.e.afterTop.gain, 0, .001) && r.e.afterHalf.done && near(r.e.afterHalf.gain, 4 * (1 - Math.round(r.e.top / 2) / r.e.top), .01) && r.e.note.length === 1 && !r.e.noteLow.length,
        '10д. сразу после долгой перегрузки (счёт ' + r.e.top + ') отдых здоровью не прибавляет, на полпути — +' + n(r.e.afterHalf.gain) + '; «Самочувствие» говорит об этом', r.e);
      check(r.f.first > 0 && r.f.first < r.S.note && !r.f.notes0.length && r.f.at > 0 && r.f.penAt >= r.S.note - 1e-9 && r.f.prevPen < r.S.note && r.f.logs === 1 && /^Неделе не хватает около \d+ ч(, из них 2 ч — отдых)?, и даже без сильной усталости здоровье начинает сдавать/.test(r.f.text) && r.f.notes.length === 1 && /^Неделя не сходится: здоровье теряет около/.test(r.f.notes[0]) && /здоровье сдаёт/.test(r.f.notice) && r.f.F < r.S.fatigue,
        '10е. нехватка ' + Math.round(r.S.hours / 4) + ' ч при низкой усталости: потеря сначала ' + n(r.f.first) + ' (без записи и строки), через ' + r.f.at + ' мес. доходит до ' + n(r.S.note) + ' — одна запись и строка в «Самочувствии»', r.f);
      const g = r.g, full = .06;
      check(g.full.b.length === 1 && /^неделе не хватает часов 0\.500$/.test(g.full.b[0]) && near(g.full.rate, full / 2, 1e-9), '10ж. нехватка ' + Math.round(g.full.d) + ' ч при усталости 30: восстановление здоровья вдвое медленнее, как при переутомлении', g.full);
      check(g.half.b.length === 1 && near(g.half.rate, full * (1 - .5 * g.half.d / r.S.hours), 1e-6), '10ж. нехватка ' + Math.round(g.half.d) + ' ч: медленнее на долю нехватки', g.half);
      check(g.tired.b.length === 1 && /^переутомление/.test(g.tired.b[0]) && near(g.tired.rate, full / 2, 1e-9), '10ж. усталость 85: только «переутомление», не вдвойне', g.tired);
      check(!g.fits.b.length && near(g.fits.rate, full, 1e-9), '10ж. неделя сходится: полная скорость', g.fits);
      check(/медленнее: неделе не хватает часов/.test(g.menu), '10ж. «Самочувствие» называет причину', g.menu.slice(0, 400));
    }
    check(!errors.length, '10. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 11. Вторая проверка баланса (27.11, после решений владелицы) ----------
  // а) Месяц, когда кончается «Восстановить силы»: неделя на полчаса сверх сил стоит здоровью не меньше, чем неделя, которая
  //    сходится (доля перегрузки — по усталости до отдыха, как −1 выше 80 в clock.js); при счёте 0 — решение владелицы (−1).
  // б) Отдых смягчает потерю при любой нехватке: при усталости ниже 70 доля не больше strain.soft.
  // в) Одно число нехватки: на экране — с отдыхом, и если часть его — отдых, это сказано; «Неделя не помещается» и пункт
  //    «Ожидают ответа» — только когда неделя не сходится и без отдыха.
  // г) Окно на точных половинах часа: «Не хватит» = что панель покажет после, и неделя сходится — с получаса, как везде.
  // д) Полчаса — граница и для того, кто отдаёт часы (squeeze276), и для настроения.
  if (!BASE) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'nl');
    const r = await ev(pg, () => {
      const out = {};
      T.clean(); s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); path16().study = null; s.people = s.people.filter(p => !['Партнер', 'Ребенок'].includes(p.role)); delete s.time276;
      s.birthMonth = (s.clock.month + 6) % 12; s.health = 70; T.job(40, T.other());
      const snap = JSON.stringify(s);
      // Нехватка без отдыха d (d < 0 — свободно −d): часы работы подгоняются в несколько шагов.
      const noRest = () => { const L = week276(); return -(L.free + rest276(L)); };
      const fit = d => { for (let i = 0; i < 8; i++) { const L = week276(), fr = L.free + rest276(L); s.workHours = s.job.hours28 = Math.max(1, s.workHours + fr + d); } return noRest(); };
      let fn = {};
      const trace = () => { let h = s.health; fn = {}; Object.defineProperty(s, 'health', { configurable: true, enumerable: true, get() { return h; }, set(v) { const dd = v - h; if (dd) { const line = (new Error().stack || '').split('\n').slice(2).find(l => /\/[\w-]+\.js/.test(l)) || ''; const m = line.match(/at (?:([\w$.<>]+) )?\(?[^()]*\/([\w-]+\.js)/) || []; const k = (m[2] || '?') + ':' + String(m[1] || '?').replace(/^Object\./, ''); fn[k] = +((fn[k] || 0) + dd).toFixed(4); } h = v; } }); };
      const reset = (F, k = 0, seed = 61) => { s = JSON.parse(snap); trace(); T.seed(seed); s.clock.fatigue = F; const st = timeState276(); st.strain = k; st.strainCool = 0; st.strainEp = k ? { start: 0, logged: true } : null; if (k) st.strainLog = s.clock.ticks; };
      // Потеря от правил перегрузки за месяц: правило 276, −1 из clock.js выше 80, урезка прибавки отдыха.
      const loss = () => Object.entries(fn).filter(([k]) => /^time276\.js:(strainMonth276|finishTask)$/.test(k) || (/^clock\.js:/.test(k) && !/finishTask/.test(k))).reduce((n, [, v]) => n + v, 0);
      const one = (F, k, d, rest) => { reset(F, k, 900 + F + k); if (rest) { assign('rest'); const t = s.clock.tasks.find(t => t.kind === 'rest'); t.progress = t.duration - 1e-4; }
        const dd = fit(d); T.clean(); s.illness = null; advanceMonth(); T.clean(); const m = s.time276.month;
        return { d: +dd.toFixed(2), short: m.short, F1: m.F1, after: +s.clock.fatigue.toFixed(1), L: +loss().toFixed(3), w: m.strainShare || 0, restDone: rest ? !s.clock.tasks.some(t => t.kind === 'rest') : null }; };
      // а
      out.grid = [];
      for (const rest of [false, true]) for (const k of [1, 6, 12, 29]) for (const F of [75, 85, 95]) out.grid.push({ rest, k, F, fits: one(F, k, .4, rest), short: one(F, k, .6, rest) });
      out.k0 = { fits: one(90, 0, .4, true), short: one(90, 0, .6, true), base: time276.strain.base };
      // б
      const S = time276.strain;
      out.share = { low: [6, 12, 22, 40].map(d => strainShare276(d, 40)), high: strainShare276(22, S.fatigue), soft: S.soft, hours: S.hours };
      // в
      const texts = () => { const L = week276(); return { panel: (schedulePanel59().match(/Свободно для планов: [^<·]*/) || [''])[0].trim(), notice: healthNotices58().find(i => i.ref?.id === 'fatigue')?.note || '',
        menu: (() => { loadMenu29(); const x = (T.text().match(/Неделе не хватает[^\n]*/) || [''])[0]; T.clean(); return x; })(), notes: healthNotes259().filter(x => /неделе не хватает/i.test(x)) }; };
      reset(20); assign('rest'); fit(-.2); out.onlyRest = texts(); out.onlyRest.d = +noRest().toFixed(2); T.month(1); out.onlyRest.m = { ...s.time276.month }; out.onlyRest.log = s.log.filter(e => /^Неделя (не помещается|снова не сходится)$/.test(e.title)).length;
      reset(20); assign('rest'); fit(1); out.withRest = texts(); T.month(1); out.withRest.entry = s.log.find(e => e.title === 'Неделя не помещается')?.text || '';
      // г
      reset(20); const snap2 = JSON.stringify(s);
      const gate = (free, I) => { s = JSON.parse(snap2); for (let i = 0; i < 8; i++) { const L = week276(); s.workHours = s.job.hours28 = s.workHours + (L.free - free); }
        const L = week276(), g = gateNumbers276(L, { hours: I }), before = freeText276(L);
        let win = null; const sb = show; show = function (title) { win = { title, rows: (nextDetail20?.sections || []).flatMap(x => x.rows || []).map(r => (r.label || r[0]) + ': ' + (r.value || r[1])) }; };
        try { openGate276({ label: 'Проверка', hours: I, area: 'work', go: () => {} }); } finally { show = sb; nextDetail20 = null; }
        s.workHours = s.job.hours28 = s.workHours + I; const after = freeText276(week276());
        return { free: +L.free.toFixed(2), I, fits: g.fits, title: win?.title, rows: win?.rows.filter(x => /^(Сил|Уже занято|Не хватит|Свободно останется)/.test(x)), before, after }; };
      out.gate = [gate(.5, 1), gate(1.5, 1), gate(1.5, 2), gate(-.5, 1), gate(.49, 1)];
      // д
      reset(20); fit(.3); T.month(1); out.small = { ...s.time276.month };
      reset(20); fit(.6); T.month(1); out.half = { ...s.time276.month };
      return out;
    });
    if (r.error) check(false, '11. вторая проверка баланса', r.error);
    else {
      const bad = r.grid.filter(x => !(x.fits.d < .5 && x.short.d >= .5 && !x.fits.short && x.short.short && x.short.L <= x.fits.L + 1e-6));
      check(!bad.length, '11а. неделя на полчаса сверх сил не дешевле той, что сходится: счёт 1–29, усталость 75–95, с отдыхом, который кончается в этом месяце, и без', bad.slice(0, 3));
      const rd = r.grid.filter(x => x.rest);
      check(rd.every(x => x.short.restDone && x.short.after < x.short.F1 && x.short.w === 1), '11а. доля перегрузки — по усталости до отдыха этого месяца (как −1 выше 80), а не после него', rd.slice(0, 2).map(x => x.short));
      // 276: решение владелицы 28.11 — без перегрузки до этого (счёт 0) неделя, которая сходится, при усталости выше 80 стоит
      // как месяц перегрузки (−base), не прежнее −1; первый месяц нехватки (правило 276 и урезка отдыха) — не дешевле.
      check(near(r.k0.fits.L, -r.k0.base, .001) && r.k0.short.short && r.k0.short.L <= r.k0.fits.L + 1e-6, '11а. счёт 0, усталость выше 80: неделя сходится — −' + String(r.k0.base).replace('.', ',') + ' (как месяц перегрузки), первый месяц нехватки — не дешевле', r.k0);
      const sh = r.share;
      check(sh.soft < 1 && sh.high === 1 && near(sh.low[0], Math.min(sh.soft, 6 / sh.hours), 1e-9) && sh.low.slice(1).every(v => near(v, sh.soft, 1e-9)), '11б. усталость ниже 70: доля перегрузки не больше ' + String(sh.soft).replace('.', ',') + ' при любой нехватке — отдых смягчает всегда; при усталости от 70 — полная', sh);
      const o = r.onlyRest, w = r.withRest;
      check(o.d < .5 && o.panel === 'Свободно для планов: не хватает 2 ч/нед. — это отдых' && !/Неделе не хватает/.test(o.notice) && /^Неделе не хватает 2 ч — это отдых: /.test(o.menu) && !o.notes.length && !o.m.short && !o.log, '11в. не хватает только часов отдыха: панель так и говорит, в «Ожидают ответа» и «Истории» — ничего, правила перегрузки молчат', o);
      check(w.panel === 'Свободно для планов: не хватает 3 ч/нед., из них 2 ч — отдых' && w.notice.startsWith('Неделе не хватает 3 ч (из них 2 ч — отдых)') && w.menu.startsWith('Неделе не хватает 3 ч (из них 2 ч — отдых)') &&
        w.notes.length === 1 && /^Пока неделе не хватает 3 ч \(из них 2 ч — отдых\), отдых снимает усталость только до 12/.test(w.notes[0]) && /Не хватает 3 ч \(из них 2 ч — отдых\)/.test(w.entry), '11в. не хватает 1 ч и 2 ч отдыха: везде «3 ч, из них 2 ч — отдых» — панель, «Ожидают ответа», «Нагрузка», «Самочувствие», «История»', w);
      const [g1, g2, g3, g4, g5] = r.gate, row = (g, k) => (g.rows || []).find(x => x.startsWith(k)) || '';
      check(!g1.fits && g1.title === 'Неделя не сходится' && row(g1, 'Не хватит') === 'Не хватит: 1 ч' && g1.after === 'не хватает 1 ч/нед.', '11г. свободно 0,5 + 1 ч: окно «Не хватит 1 ч» — и панель после покажет то же', g1);
      check(g2.fits && g2.title === 'Теперь неделя сходится' && row(g2, 'Свободно останется') === 'Свободно останется: 1 ч' && g2.after === '1 ч/нед.' && !g3.fits && row(g3, 'Не хватит') === 'Не хватит: 1 ч' && g3.after === 'не хватает 1 ч/нед.', '11г. свободно 1,5: +1 ч — сходится, +2 ч — «Не хватит 1 ч», как панель после', [g2, g3]);
      check(g4.before === 'не хватает 1 ч/нед.' && row(g4, 'Уже занято') === 'Уже занято: ' + (+row(g4, 'Сил').replace(/\D+/g, '') + 1) + ' ч' && row(g4, 'Не хватит') === 'Не хватит: 2 ч' && g4.after === 'не хватает 2 ч/нед.' && !g5.fits && g5.after === 'не хватает 1 ч/нед.', '11г. уже не хватает 1 ч: «Уже занято» = сил + 1, «Не хватит 2 ч», как панель после', [g4, g5]);
      check(r.small.missing === 0 && r.small.missingNoRest === 0 && Object.values(r.small.f).every(v => v === 0) && !r.small.short && r.half.missing >= .5 && r.half.short && Object.values(r.half.taken).reduce((n, v) => n + v, 0) >= .5, '11д. нехватка 0,3 ч: никто часов не отдаёт и настроение не страдает (граница полчаса и тут); 0,6 ч — отдают', { small: r.small, half: { missing: r.half.missing, taken: r.half.taken } });
    }
    check(!errors.length, '11. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 7е. Окно: проверки действия раньше окна, академ из окна, числа, оплата компанией, тексты ----------
  if (!BASE) {
    const { pg, errors, ctx } = await open(browser, { width: 390, height: 844 });
    await life(pg, 'nl');
    const r = await ev(pg, async () => {
      const out = {};
      const toastText = () => [...document.querySelectorAll('.toast')].map(e => e.textContent).join(' | ');
      const clearToast = () => document.querySelectorAll('.toast').forEach(e => e.remove());
      const x = path16();
      // 1) Учёба в другом городе: окна нет, сразу объяснение действия.
      T.job(40, T.other()); admission16 = () => ({ why: [] });
      const p = T.prog(), other = programs16.find(q => q.country === s.country && q.city !== residenceCity() && q.level === 'bachelor');
      x.applications.push({ id: 'app-city', program: other.id, status: 'accepted' });
      clearToast(); out.city = { ret: studyStart16('app-city', 'self') }; await T.wait(); out.city.title = T.title(); out.city.toast = toastText(); T.clean();
      // 2) Работа, требования которой не выполнены (нет языка): окна нет, тост действия.
      const v = { id: 'vac-bad', title: 'Бухгалтер', hours28: 40, fullHours28: 40, format: 'far', country: s.country, city: residenceCity(), area: T.other(), profession: 'accountant', salary: c().wage, employer: 'Новый' };
      x.jobApplications.push({ id: 'ja-bad', vacancy: v, status: 'accepted' });
      // Неделя не сходится: сейчас 20 ч рядом с домом, новая — 40 ч в другом районе, свободного меньше прибавки.
      T.job(20, s.housing.area); task16('verify276', 'Подготовка', 6, {}, T.free() - 5);
      clearToast(); const free0 = T.free(); startJob16('ja-bad'); await T.wait(); out.job = { free: free0, title: T.title(), toast: toastText(), employer: s.job.employer }; T.clean();
      s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'verify276'); T.job(40, T.other());
      // 3) Своё дело без денег и без названия: окна нет.
      s.cash = 10; out.poor = { ret: startEnterprise152('services', 'Мастерская', 'hair') }; await T.wait(); out.poor.title = T.title(); T.clean();
      s.cash = 1e9; out.noname = { ret: startEnterprise152('services', '   ', 'hair') }; await T.wait(); out.noname.title = T.title(); T.clean();
      // 4) Текст окна своего дела: режим «сам», как везде.
      startEnterprise152('services', 'Мастерская', 'hair'); await T.wait(); out.bizText = T.text(); T.clean();
      // 5) Академический отпуск прямо из окна: окно пересчитывается, работа ещё не взята.
      T.study();
      const v2 = { id: 'vac-ok', title: 'Бухгалтер · 40 ч/нед.', hours28: 40, fullHours28: 40, format: 'far', country: s.country, city: residenceCity(), area: T.other(), profession: 'accountant', salary: c().wage, employer: 'Новое место', language: country16[s.country][0], allowedCountries: [s.country] };
      x.jobApplications.push({ id: 'ja-ok', vacancy: v2, status: 'accepted' }); T.job(20, s.housing.area);
      startJob16('ja-ok'); await T.wait(); out.leave = { title0: T.title() };
      await T.click(/^Учёба: академический отпуск/); out.leave.title = T.title(); out.leave.study = path16().study?.status; out.leave.employer = s.job.employer;
      await T.click(/^Взять/); out.leave.after = s.job.employer; T.clean();
      // 6) Числа окна: свободно 2,7 (на панели 3) и клуб на 3 ч — помещается; свободно 2,4 (на панели 2) — «Не хватит 1 ч».
      s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); x.study = null; T.job(40, s.housing.area);
      for (const m of clubState19().memberships) m.status = 'left';
      const club = 'photo', h = clubsCatalog19[club].hours;
      const setFree = f => { s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'verify276'); task16('verify276', 'Подготовка', 6, {}, T.free() - f); };
      setFree(h - .3); out.fit = { free: T.free(), panel: schedulePanel59().match(/Свободно для планов: [^<·]*/)?.[0]?.trim() };
      joinClub19(club); await T.wait(); out.fit.title = T.title(); out.fit.joined = clubState19().memberships.some(m => m.type === club && m.status === 'active'); out.fit.toast = toastText(); T.clean();
      for (const m of clubState19().memberships) m.status = 'left';
      setFree(h - .6); out.miss = { free: T.free(), panel: schedulePanel59().match(/Свободно для планов: [^<·]*/)?.[0]?.trim() };
      joinClub19(club); await T.wait(); out.miss.title = T.title(); out.miss.text = T.text(); out.miss.anyway = T.buttons().find(b => b.label === 'Взять всё равно')?.hint; T.clean();
      // 7) Учёба за счёт компании: окно считает без часов, которые даёт компания.
      s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); T.job(40, T.other());
      x.applications.push({ id: 'app-emp', program: p.id, status: 'accepted' });
      // (без studyBlocked276 — версия без исправления — проверка всё равно доходит до окна и показывает его числа)
      const keepS = sponsor22, keepB = typeof studyBlocked276 === 'function' ? studyBlocked276 : null; sponsor22 = () => ({ studyHours: 4, share: 1, cap: 1e9, country: s.country }); if (keepB) studyBlocked276 = () => false;
      studyStart16('app-emp', 'employer'); await T.wait(); out.emp = { text: T.text(), want: Math.round(studyHours276(p) - 4) }; T.clean();
      sponsor22 = keepS; if (keepB) studyBlocked276 = keepB;
      // 8) Ответ на свой отклик («offer»): становится предложением в разделе работы — дальше «Выйти на работу» идёт через startJob16 и окно.
      const job = generateJob(s.jobSearch.careerId || 'office') || { title: 'Оператор', salary: c().wage, careerId: 'office' };
      const before = s.job; s.pending = [{ type: 'offer', job }]; resolvePending(); await T.wait();
      out.offer = { same: s.job === before, app: x.jobApplications.filter(a => /legacy-offer/.test(a.id)).map(a => a.status), title: T.title() }; T.clean();
      // 9) Клуб во время языковой поездки: окна нет, сразу объяснение клуба. Неделя при этом не сходится.
      s.clock.tasks = s.clock.tasks.filter(t => t.kind === 'queuedAction'); T.job(40, T.other()); T.study();
      for (const m of clubState19().memberships) m.status = 'left';
      const keepSB = stayBusy53; stayBusy53 = () => true;
      clearToast(); out.away = { free: T.free(), ret: joinClub19(club) }; await T.wait(); out.away.title = T.title(); out.away.toast = toastText(); T.clean();
      stayBusy53 = keepSB;
      // 10) Уход за близким в другом городе: ухаживать самим нельзя — окна нет (и уход не назначен).
      // (не мать: с ней вы можете жить в одном доме, и её город — ваш)
      const mom = person('Тетя', 95); s.people.push(mom); enrichPerson(mom);
      mom.alive = true; mom.bio27 = mom.bio27 || {}; mom.bio27.health = 30; mom.bio27.parents ??= []; mom.country = s.country; mom.city18 = other.city;
      out.elderSetup = { city: mom.city18, home: residenceCity() };
      out.elder = { need: updateAging58(mom).need, free: T.free(), ret: setElderCare58(mom.id, 'self') }; await T.wait(); out.elder.title = T.title(); out.elder.care = updateAging58(mom).care?.mode || null; T.clean();
      x.study = null;
      return out;
    });
    if (r.error) check(false, '7е. окно', r.error);
    else {
      check(r.city.ret !== false && !r.city.title && /переезд/.test(r.city.toast), '7е. учёба в другом городе: окна нет, сразу «Сначала организуйте переезд…»', r.city);
      check(r.job.free < 20 && !r.job.title && /Требования вакансии/.test(r.job.toast) && r.job.employer === 'Контур', '7е. работа с невыполненными требованиями при занятой неделе: окна нет, тост действия', r.job);
      check(r.poor.ret === false && !r.poor.title && r.noname.ret === false && !r.noname.title, '7е. своё дело без денег или без названия: окна нет', { poor: r.poor, noname: r.noname });
      check(/Своё дело · Мастерская · сам\n/.test(r.bizText) && !/· сами/.test(r.bizText), '7е. окно своего дела: режим «сам», как везде', r.bizText.slice(0, 300));
      check(r.leave.title0 === 'Неделя не сходится' && /^(Теперь неделя сходится|Неделя не сходится)$/.test(r.leave.title) && r.leave.study === 'paused' && r.leave.employer === 'Контур' && r.leave.after === 'Новое место', '7е. «академический отпуск» из окна: окно пересчитано, работа берётся оттуда же', r.leave);
      check(r.fit.panel === 'Свободно для планов: 3 ч/нед.' && !r.fit.title && r.fit.joined, '7е. свободно 2,7 (на панели 3) — клуб на 3 ч без окна', r.fit);
      check(r.miss.panel === 'Свободно для планов: 2 ч/нед.' && r.miss.title === 'Неделя не сходится' && r.miss.text.includes('Не хватит\n1 ч') && /^Не хватит 1 ч/.test(r.miss.anyway || '') && !/Не хватит 0 ч/.test(r.miss.text), '7е. свободно 2,4 (на панели 2) — «Не хватит 1 ч», никогда «0 ч»', r.miss);
      check(r.emp.text.includes('+' + r.emp.want + ' ч в неделю'), '7е. учёба за счёт компании: в окне часы без тех, что даёт компания', { want: r.emp.want, text: r.emp.text.slice(0, 200) });
      check(r.offer.same && r.offer.app.includes('offered') && r.offer.title !== 'Принять предложение?', '7е. ответ на отклик не берёт работу сам: становится предложением в разделе работы', r.offer);
      check(r.away.free < 0 && !r.away.title && /после возвращения/.test(r.away.toast), '7е. клуб в языковой поездке: окна нет, сразу «Клуб дома доступен после возвращения»', r.away);
      check(r.elderSetup.city !== r.elderSetup.home && r.elder.need > r.elder.free && r.elder.ret === false && !r.elder.title && r.elder.care !== 'self', '7е. уход за близким в другом городе: окна нет, уход не назначен', { ...r.elder, ...r.elderSetup });
    }
    check(!errors.length, '7е. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 7ж. Долгая умеренная нехватка: усталость держится, а не упирается в 100 ----------
  if (!BASE) {
    const { pg, errors, ctx } = await open(browser);
    await life(pg, 'au');
    const r = await ev(pg, () => {
      T.seed(7);
      T.job(38, s.housing.area); T.force(() => startEnterprise152('services', 'Мастерская', 'hair')); T.clean();
      s.enterprise152.cash = 1e6; const snap = JSON.stringify(s); T.seed(7);
      const run = () => { const f = []; for (let i = 0; i < 60; i++) { T.month(1); f.push(Math.round(s.clock.fatigue)); } return { f, miss: s.time276.month.missing, paid: s.time276.month.paid }; };
      const out = { with: run() };
      // Без восстановления усталость стоит у 100; здоровье при этом не трогаем (иначе случайная болезнь меняет неделю).
      s = JSON.parse(snap); T.seed(7); const keep = time276.recover, keepS = { ...time276.strain }; time276.recover = 0; time276.strain.max = 0; time276.strain.base = 0; out.without = run(); time276.recover = keep; Object.assign(time276.strain, keepS);
      return out;
    });
    if (r.error) check(false, '7ж. усталость', r.error);
    else {
      const tail = r.with.f.slice(-24);
      check(Math.max(...tail) < 80 && Math.max(...tail) - Math.min(...tail) < 15, '7ж. работа 38 ч + своё дело «сам» 5 лет: усталость держится ниже 80', { last: tail, miss: r.with.miss, paid: r.with.paid });
      check(Math.max(...r.without.f) >= 95, '7ж. без восстановления та же неделя упирается в 100 (проверка ловит отсутствие исправления)', r.without.f.join(' '));
    }
    check(!errors.length, '7ж. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  }

  // ---------- 6. Сохранение владелицы: 3 года вперёд ----------
  if (OWNER && fs.existsSync(OWNER)) {
    const { pg, errors, ctx } = await open(browser);
    const raw = fs.readFileSync(OWNER, 'utf8');
    const r = await ev(pg, raw => {
      try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); } catch (e) {}
      importLives(JSON.parse(raw)); const ids = vaultIndex().ids; loadCharacter(ids[ids.length - 1]);
      if ($('#modal').open) closeModal();
      T.seed(11);
      const out = { name: s.name, age: s.age, before: typeof week276 === 'function' ? (() => { const L = week276(); return { budget: Math.round(L.budget), com: Math.round(L.commitments), pl: Math.round(L.plans), free: Math.round(L.free), lines: L.lines.map(l => l.label + ' ' + Math.round(l.hours)) }; })() : null, windows: [], nan: [] };
      const bad = (o, p = '') => { if (typeof o === 'number' && !Number.isFinite(o)) out.nan.push(p); else if (o && typeof o === 'object' && out.nan.length < 5) for (const k in o) bad(o[k], p + '.' + k); };
      for (let m = 0; m < 36 && !s.dead; m++) {
        let n = 0;
        if ($('#modal').open) closeModal();
        advanceMonth();
        for (let k = 0; k < 12 && (s.pending.length || $('#modal').open); k++) {
          if (!$('#modal').open && s.pending.length) resolvePending();
          if (!$('#modal').open) { s.pending.shift(); continue; }
          n++;
          const bs = [...document.querySelectorAll('#modal .options button:not([disabled])')];
          const pick = bs.find(b => /^(Отказаться|Позже|Не сейчас|Понятно|Прочитано|Закрыть)/.test(b.textContent.trim())) || bs[0];
          if (pick) pick.click(); else closeModal();
        }
        out.windows.push(n);
      }
      bad(s);
      out.after = { age: s.age, dead: !!s.dead, fatigue: Math.round(s.clock.fatigue), health: Math.round(s.health), cash: Math.round(s.cash), job: s.job?.title, hours: s.workHours, overload: s.log.filter(e => e.title === 'Неделя не помещается').length };
      return out;
    }, raw);
    if (r.error) check(false, '6. сохранение владелицы', r.error);
    else {
      console.log('   владелица: ' + r.name + ', ' + r.age + ' · неделя до: ' + JSON.stringify(r.before));
      console.log('   окон по месяцам: ' + r.windows.join(' ') + ' · после: ' + JSON.stringify(r.after));
      check(r.windows.length >= 36 || r.after.dead, '6. владелица: 3 года вперёд', r.after);
      check(r.windows[0] <= 3 && Math.max(...r.windows) <= 6, '6. владелица: без залпа окон (первый месяц и любой)', r.windows);
      check(!r.nan.length, '6. владелица: без NaN', r.nan);
    }
    check(!errors.length, '6. без ошибок страницы', errors.slice(0, 3));
    await ctx.close();
  } else console.log('-    6. сохранение владелицы не найдено (OWNER_SAVE)');

  await browser.close();
  console.log('\n' + pass + '/' + (pass + fail) + ' проверок прошли');
  process.exit(fail ? 1 : 0);
})();
