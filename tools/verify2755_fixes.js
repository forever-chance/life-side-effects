// Проверки сборки 275.5 (fixes2755.js): мелкие баги из игры владелицы.
// Игра раздаётся с диска, сервер не нужен:  node tools/verify2755_fixes.js   (BASE=1 — без fixes2755.js: видно, что
// проверки ловят старое поведение).
// 1. Прокрутка: то же окно после действия внутри него — на прежнем месте (длинное окно и «Программа клуба» на
//    телефоне), «Назад» — к прежнему месту, другое окно поверх прокрученного — сверху, заново открытое — сверху.
// 2. «Запросить разрешение»: запрет после принудительного выезда, нехватка денег, уже поданная заявка — серая кнопка
//    с причиной и датой, при вызове в обход — сообщение; без причины кнопка доступна и заявка подаётся.
// 3. Без «Будни»: полгода рутины — ни одной строки «Будни», рутина в «Историю» не идёт; старая строка «Будни» из
//    сохранения видна в «Истории»; в карточке киноклуба — последний показ и фильмы до него, а не «Новую пьесу…».
// 4. Свидание: в приглашении назван вид (из восьми; пикник — в тёплые месяцы), часы и цена; «Согласиться» ставит
//    этот вид, кино — через афишу, «Предложить другое» — другой вид; старое приглашение — прогулка; приглашение из
//    очереди окон называет вид и не отказывает само себе; подростковое приглашение — подростковая встреча.
// 5. Дети: партнёр в другом городе не предлагает подготовку к родительству, разговор «о детях» откладывается; рядом —
//    как раньше; «съехаться» на расстоянии — нельзя, как и было.
// 6. Подростковая пара: «Обсудить расставание» рядом и на расстоянии, расставание проходит; пара в разных городах
//    расходится сама за несколько месяцев («Всё реже на связи» → «Отношения сошли на нет»), пара рядом — нет.
// 7. Новоселье: родитель, с которым вы живёте (и подросток у единственного родителя), не зовёт на новоселье — ни
//    явным видом, ни случайным; пришедшее такое приглашение закрывается; родитель, живущий отдельно, — зовёт.
//    Второй родитель после развода и у единственного родителя с рождения жив и живёт в том же городе, но отдельно, —
//    зовёт на своё новоселье (и случайным событием тоже), а тот, у кого вы живёте, — нет.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const BASE = process.env.BASE === '1';
let pass = 0, fail = 0;
const check = (ok, label, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'ok   ' : 'FAIL ') + label + (!ok && extra !== '' ? ' — ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 700) : '')); };

async function page(browser, { country = 'ru', seed = 2755, width = 390, height = 844 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript(seed => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, seed);
  await ctx.route('**/*', r => {
    const u = new URL(r.request().url());
    if (u.hostname !== 'game.local') return r.abort();
    const rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
    const f = path.join(ROOT, rel);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' });
    let body = rel === 'offline-game.js' ? '' : fs.readFileSync(f);
    if (rel === 'index.html' && BASE) body = Buffer.from(body.toString('utf8').replace(/<script src="fixes2755\.js[^"]*"><\/script>/, ''));
    r.fulfill({ status: 200, body, headers: { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' } });
  });
  const pg = await ctx.newPage(); const errors = [];
  pg.on('pageerror', e => errors.push(String(e.message)));
  await pg.goto('http://game.local/index.html');
  await pg.waitForFunction("typeof start==='function'&&document.querySelector('#country')");
  await pg.evaluate(c => { for (const [k, v] of [['startAge', '18'], ['country', c]]) { const e = document.getElementById(k); if (!e) continue; e.value = v; e.dispatchEvent(new Event('change', { bubbles: true })); } }, country);
  await pg.evaluate(() => [...document.querySelectorAll('button')].find(b => /Родиться/.test(b.textContent)).click());
  await pg.waitForFunction("typeof s!=='undefined'&&s&&s.clock");
  await pg.evaluate(() => {
    try { if (typeof startupNotice180 === 'function' && startupNotice180()) finishStartup180(false); if (typeof tutorialActive180 === 'function' && tutorialActive180()) endTutorial180('skipped'); } catch (e) {}
    if ($('#modal').open) closeModal();
    // Время стоит: месяцы двигает сама проверка.
    s.pending = []; s.clock.running = false; s.clock.resumeAfterChoice = false; s.clock.speed = 0;
    try { localStorage.clear(); } catch (e) {}
    window.__still = () => { s.clock.running = false; s.clock.resumeAfterChoice = false; s.clock.speed = 0; };
    // Месяц как в игре: очередь окон и открытое окно его останавливают (advanceMonth), поэтому перед месяцем — пусто.
    window.__month = () => { s.pending = []; if ($('#modal').open) closeModal(); advanceMonth(); window.__still(); };
    window.__win = () => ({ open: $('#modal').open, title: document.querySelector('#modal h2')?.textContent || '', text: [...document.querySelectorAll('#modal p')].map(p => p.textContent).join('\n'),
      opts: [...document.querySelectorAll('#modal .options button')].map(b => ({ label: [...b.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').replace(/\s+/g, ' ').trim(), hint: b.querySelector('small')?.textContent || '', disabled: b.disabled })) });
    window.__click = re => { const b = [...document.querySelectorAll('#modal .options button')].find(b => re.test(b.textContent)); if (!b) return false; b.click(); return true; };
    // Человек рядом: взрослый знакомый того же города (romanceEligible18, совместимость), без родства.
    window.__adult = (age = 26) => { const p = person('Знакомый', age, undefined, s.country); p.city18 = residenceCity(); s.people.push(p); enrichPerson(p); s.orientation = 'straight'; p.orientation = 'straight'; p.gender = s.gender === 'f' ? 'm' : 'f'; p.bond = 70; p.inner.trust = 60; p.inner.strain = 10; return p; };
    window.__away = p => { p.country = s.country === 'de' ? 'fr' : 'de'; p.city18 = cities[p.country][0]; };
  });
  return { pg, ctx, errors };
}
const ev = (pg, fn, arg) => pg.evaluate(fn, arg);

(async () => {
  const browser = await chromium.launch();

  // ---------- 1. Прокрутка окна ----------
  {
    const { pg, ctx, errors } = await page(browser);
    await ev(pg, () => {
      window.__n = 0;
      window.__long = () => show('Длинное окно', 'Текст окна', Array.from({ length: 40 }, (_, i) => ({ label: 'Пункт ' + i + (i === 30 ? ' · нажато ' + window.__n : ''), hint: 'подсказка', fn: () => { window.__n++; __long(); } })).concat([{ label: 'Открыть другое окно', fn: () => __other() }]));
      window.__other = () => show('Другое окно', 'Текст', Array.from({ length: 40 }, (_, i) => ({ label: 'Вариант ' + i, fn: () => __long() })));
      __long();
    });
    await pg.waitForTimeout(60);
    await ev(pg, () => { $('#modal').scrollTop = 900; });
    await pg.waitForTimeout(80);
    await ev(pg, () => __click(/Пункт 30/));
    await pg.waitForTimeout(120);
    const same = await ev(pg, () => ({ title: $('#modal h2').textContent, top: $('#modal').scrollTop, n: window.__n }));
    check(same.n === 1 && same.title === 'Длинное окно' && same.top === 900, 'прокрутка: действие внутри длинного окна — окно то же, прокрутка на месте (900 px), а не наверху', same);
    await ev(pg, () => { $('#modal').scrollTop = 700; });
    await pg.waitForTimeout(60);
    await ev(pg, () => __click(/Открыть другое окно/));
    await pg.waitForTimeout(120);
    const other = await ev(pg, () => ({ title: $('#modal h2').textContent, top: $('#modal').scrollTop }));
    check(other.title === 'Другое окно' && other.top === 0, 'прокрутка: другое окно поверх прокрученного — сверху', other);
    await ev(pg, () => { if (typeof backModal38 === 'function') backModal38(); else __long(); });
    await pg.waitForTimeout(120);
    const back = await ev(pg, () => ({ title: $('#modal h2').textContent, top: $('#modal').scrollTop }));
    check(back.title === 'Длинное окно' && back.top === 700, 'прокрутка: «Назад» к прежнему окну — на том же месте (700 px)', back);
    // Другое окно поверх прокрученного без закрытия (как приглашение в поездку поверх карточки).
    await ev(pg, () => { $('#modal').scrollTop = 500; });
    await pg.waitForTimeout(60);
    await ev(pg, () => __other());
    await pg.waitForTimeout(120);
    const over = await ev(pg, () => ({ title: $('#modal h2').textContent, top: $('#modal').scrollTop }));
    check(over.title === 'Другое окно' && over.top === 0, 'прокрутка: окно, нарисованное поверх прокрученного без закрытия, не наследует его прокрутку', over);
    await ev(pg, () => closeModal());
    await pg.waitForTimeout(60);
    await ev(pg, () => __long());
    await pg.waitForTimeout(120);
    const fresh = await ev(pg, () => $('#modal').scrollTop);
    check(fresh === 0, 'прокрутка: закрытое и заново открытое окно — сверху', fresh);
    await ev(pg, () => closeModal());
    check(!errors.length, 'прокрутка: без ошибок страницы', errors);
    await ctx.close();
  }
  // Настоящее окно на телефоне: «Программа клуба» → «Участвовать в следующем месяце» рисует то же окно.
  {
    const { pg, ctx, errors } = await page(browser, { width: 360, height: 420 });
    await ev(pg, () => {
      s.cash = 1e7; path16().languages[activityLanguage86('book')] = 6; joinClub19('book');
      const m = clubState19().memberships.find(m => m.type === 'book'); m.programMode245 = 'ask';
      s.clock.ticks++; clubProgramMonth245(m); clubProgramMenu245(m.id);
    });
    await pg.waitForTimeout(80);
    const a = await ev(pg, () => { const d = $('#modal'); d.scrollTop = 9999; return { top: d.scrollTop, title: $('#modal h2').textContent }; });
    await pg.waitForTimeout(80);
    await ev(pg, () => __click(/Участвовать в следующем месяце/));
    await pg.waitForTimeout(120);
    const b = await ev(pg, () => ({ top: $('#modal').scrollTop, title: $('#modal h2').textContent, approved: clubState19().memberships.find(m => m.type === 'book').approvedThrough245 >= s.clock.ticks }));
    check(a.top > 20 && b.approved && b.title === a.title && b.top === a.top, 'прокрутка: «Программа клуба» на телефоне 360×420 — после «Участвовать в следующем месяце» на том же месте (' + a.top + ' px)', { a, b });
    check(!errors.length, 'прокрутка (клуб): без ошибок страницы', errors);
    await ctx.close();
  }

  // ---------- 2. «Запросить разрешение» ----------
  {
    const { pg, ctx, errors } = await page(browser);
    const r = await ev(pg, () => {
      const m = s.people.find(p => p.alive && p.role === 'Мать'); m.country = 'de'; m.city18 = cities.de[0]; m.inner.trust = 60;
      const card = () => { const div = document.createElement('div'); div.innerHTML = mobilityView16(); const a = [...div.querySelectorAll('article.path-card')].find(a => a.textContent.includes('Близкий · ' + m.name)); if (!a) return null; const b = [...a.querySelectorAll('button')].find(b => /разрешение/.test(b.textContent)); return { btn: b?.textContent, disabled: !!b?.disabled, why: a.querySelector('small')?.textContent || '' }; };
      const tst = () => document.querySelector('.toast')?.textContent || '';
      const tryApply = () => { document.querySelector('.toast')?.remove(); const n = path16().permitApplications.length; const ok = applyPermit16('family', m.id, 'de'); return { ok, toast: tst(), added: path16().permitApplications.length - n }; };
      const out = {};
      out.free = card();
      const ban = s.clock.ticks + 7; migration30().reentry30.de = ban; out.banMonth = 'с ' + String(dateLabel86(ban)).split(' ')[1];
      out.ban = card(); out.banTry = tryApply();
      migration30().reentry30.de = 0;
      const cash = s.cash; s.cash = 0; const pc = m.privateCash; m.privateCash = 0;
      out.money = card(); out.moneyTry = tryApply();
      s.cash = cash + 1e6; m.privateCash = pc;
      out.first = tryApply();
      out.sub = card(); out.subTry = tryApply();
      // Срок повторной заявки: заявку рассмотрели (не на рассмотрении), а три месяца с подачи ещё не прошли.
      for (const a of path16().permitApplications) a.status = 'rejected';
      out.retry = card();
      return out;
    });
    check(r.free && !r.free.disabled && !r.free.why, 'разрешение: без препятствий кнопка «Запросить разрешение» доступна', r.free);
    check(r.ban?.disabled && /^Новая заявка — с [а-я]+ \d{4}: до этого действует запрет после принудительного выезда$/.test(r.ban.why) && r.ban.why.includes(r.banMonth.split(' ')[0]), 'разрешение: запрет после выезда — серая кнопка, «' + (r.ban?.why || '') + '»', r.ban);
    check(!r.banTry.ok && r.banTry.toast === r.ban?.why + '.' && r.banTry.added === 0, 'разрешение: вызов в обход кнопки при запрете — сообщение с той же причиной, заявки нет', r.banTry);
    check(r.money?.disabled && /^На оформление нужно .+ — доступно .+$/.test(r.money.why) && !r.moneyTry.ok && r.moneyTry.toast.startsWith('На оформление нужно'), 'разрешение: не хватает на сбор — «' + (r.money?.why || '') + '»', r);
    check(r.first.ok && r.first.added === 1, 'разрешение: без препятствий заявка подаётся', r.first);
    check(r.sub?.disabled && /^Заявка уже подана · ответ в [а-я]+ \d{4}$/.test(r.sub.why) && !r.subTry.ok && r.subTry.added === 0 && /^Заявка уже подана/.test(r.subTry.toast), 'разрешение: заявка уже на рассмотрении — «' + (r.sub?.why || '') + '»', r);
    check(r.retry?.disabled && /^Повторная заявка — с [а-я]+ \d{4}$/.test(r.retry.why), 'разрешение: срок повторной заявки — «' + (r.retry?.why || '') + '»', r.retry);
    check(!errors.length, 'разрешение: без ошибок страницы', errors);
    await ctx.close();
  }

  // ---------- 3. Без «Будни», киноклуб ----------
  {
    const { pg, ctx, errors } = await page(browser);
    const r = await ev(pg, () => {
      const out = {};
      // Старая строка «Будни» из сохранения.
      s.log.unshift({ title: 'Будни · январь — март', text: 'Разговоры ×3, вечера с увлечением.', tag: 'Будни', age: s.age, year: s.year, weekdays267: true });
      const n0 = s.log.length;
      for (let i = 0; i < 6; i++) { log('Разговор между делами', 'Пара слов.', 'Общение'); log('Увлечение на свободный вечер', 'Вечер.', 'Хобби'); __month(); }
      out.weekdays = s.log.filter(e => e.tag === 'Будни' || /^Будни · /.test(e.title)).map(e => e.title);
      out.routine = s.log.filter(e => ['Разговор между делами', 'Увлечение на свободный вечер'].includes(e.title)).length;
      tab = 'story'; render();
      out.oldVisible = [...document.querySelectorAll('article.event')].some(a => /Будни · январь — март/.test(a.textContent));
      // Киноклуб.
      s.cash = 1e7; path16().languages[activityLanguage86('cinema269')] = 6; joinClub19('cinema269');
      const m = clubState19().memberships.find(m => m.type === 'cinema269');
      clubDetail19(m.id); out.card0 = __win().text; closeModal();
      for (let i = 0; i < 3; i++) { s.clock.ticks++; clubProgramMonth245(m); }
      out.films = m.films269.map(id => filmById269(id)?.title);
      clubDetail19(m.id); out.card = __win().text; closeModal();
      out.when = String(dateLabel86(m.filmTick269)).split(' ')[1];
      return out;
    });
    check(r.weekdays.length === 1 && r.weekdays[0] === 'Будни · январь — март', 'без «Будни»: полгода рутины — ни одной новой строки «Будни» (была только старая)', r.weekdays);
    check(r.routine === 0, 'без «Будни»: рутина («Разговор между делами», «Увлечение на свободный вечер») в «Историю» не идёт', r.routine);
    check(r.oldVisible, 'без «Будни»: старая строка «Будни» из сохранения видна в «Истории»', '');
    check(/Первый фильм покажут на ближайшей встрече клуба\./.test(r.card0) && !/пьес/i.test(r.card0), 'киноклуб: в карточке до первого показа — «Первый фильм покажут…», а не «Новую пьесу начнут читать…»', r.card0);
    const last = r.films.at(-1), prev = r.films.slice(0, -1).reverse();
    check(new RegExp('Последний показ — в [а-я]+ ' + r.when + ': «' + last.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '» \\(\\d{4}\\), реж\\. ').test(r.card) && r.card.includes('До этого: ' + prev.map(t => '«' + t + '»').join(', ') + '.') && !/пьес/i.test(r.card),
      'киноклуб: в карточке клуба — последний показ с месяцем и режиссёром и фильмы до него', r.card);
    check(!errors.length, 'без «Будни»: без ошибок страницы', errors);
    await ctx.close();
  }

  // ---------- 4. Вид свидания в приглашении ----------
  {
    const { pg, ctx, errors } = await page(browser);
    const r = await ev(pg, () => {
      const out = {};
      s.cash = 1e6;
      for (const x of s.people) if (x.role === 'Партнер') x.role = 'Бывший партнер';
      const p = __adult(); p.role = 'Партнер'; p.partnerSince = s.year - 1;
      const z = initiatives68();
      const offer = () => { z.offers = []; z.cooldowns = {}; z.lastOffer = -100; return offerInitiative68(p, 'date'); };
      // Вид — из восьми, пикник — только в тёплые месяцы.
      const kinds = m => { s.clock.month = m; const c = {}; for (let i = 0; i < 120; i++) { const q = offer(); const k = q?.date2755 || '(без вида)'; c[k] = (c[k] || 0) + 1; } return c; };
      out.winter = kinds(0); out.summer = kinds(6);
      s.clock.month = 6;
      const q = offer();
      out.logTitle = s.log.find(e => e.title.startsWith(p.name + ' '))?.title || '';
      out.item = decisionItems24().find(it => it.ref?.kind === 'initiative68' && it.ref.id === q.id)?.title || '';
      out.phrase = { restaurant: 'в ресторан', dateWalk: 'на прогулку', dateCinema255: 'в кино', dateMuseum255: 'на выставку', datePicnic255: 'на пикник', dateConcert255: 'на концерт', dateBoard255: 'сыграть в настольную игру', dateCook255: 'приготовить ужин вместе' }[q.date2755];
      initiativeMenu68(q.id); out.win0 = __win().title; closeModal();
      q.date2755 = 'restaurant';
      initiativeMenu68(q.id); out.win = __win();
      const n0 = s.clock.tasks.length, cash0 = s.cash;
      __click(/^Согласиться/);
      const t = s.clock.tasks.length > n0 ? s.clock.tasks.at(-1) : null;
      out.task = t && { label: t.label, kind: t.meeting53, cost: t.startCostRatio, hours: t.hours, partner: t.partner53 };
      out.status = q.status; out.cash = s.cash === cash0;
      out.fee = money(c().cost * meetingKinds53.restaurant.fee);
      // Кино — через афишу.
      s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'meeting53'); p.meetingAfter53 = 0;
      const q2 = offer(); q2.date2755 = 'dateCinema255';
      if ($('#modal').open) closeModal();
      initiativeMenu68(q2.id); out.cinemaTitle = __win().title;
      __click(/^Согласиться/); out.poster = __win();
      const film = out.poster.opts.find(o => /^«/.test(o.label));
      __click(/^«/);
      const t2 = s.clock.tasks.at(-1);
      out.cinemaTask = t2 && { kind: t2.meeting53, film: t2.film269 ? filmById269(t2.film269)?.title : null, picked: film?.label };
      // «Предложить другое».
      s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'meeting53'); p.meetingAfter53 = 0;
      const q3 = offer(); q3.date2755 = 'dateWalk';
      if ($('#modal').open) closeModal();
      initiativeMenu68(q3.id); __click(/^Предложить другое/); out.other = __win();
      __click(/^Свидание за настольной игрой/);
      const t3 = s.clock.tasks.at(-1);
      out.otherTask = t3 && t3.kind === 'meeting53' ? t3.meeting53 : null; out.otherStatus = q3.status;
      // Старое приглашение без вида — прогулка.
      s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'meeting53'); p.meetingAfter53 = 0;
      const q4 = offer(); delete q4.date2755;
      if ($('#modal').open) closeModal();
      initiativeMenu68(q4.id); out.oldTitle = __win().title;
      respondInitiative68(q4.id, true); out.oldTask = s.clock.tasks.at(-1)?.meeting53;
      if ($('#modal').open) closeModal();
      return out;
    });
    const eight = ['restaurant', 'dateWalk', 'dateCinema255', 'dateMuseum255', 'datePicnic255', 'dateConcert255', 'dateBoard255', 'dateCook255'];
    const ks = Object.keys(r.summer);
    check(ks.length >= 6 && ks.every(k => eight.includes(k)) && !r.winter.datePicnic255 && (r.summer.datePicnic255 || 0) > 0, 'свидание: вид — из восьми видов свиданий (летом ' + ks.length + ' видов), пикник зимой не выпадает', { winter: r.winter, summer: r.summer });
    check(!!r.phrase && r.win0 === r.logTitle && r.item === r.logTitle && r.logTitle.endsWith(' зовёт ' + r.phrase) && /зовёт в ресторан$/.test(r.win?.title || ''), 'свидание: вид назван — «' + r.logTitle + '» в окне, в «Истории» и в «Ожидают ответа»', { win0: r.win0, log: r.logTitle, item: r.item, phrase: r.phrase, win: r.win?.title });
    check(r.win && r.win.text.startsWith('Свидание в ресторане: 3 ч/нед. на месяц, ваша часть — ' + r.fee + '.') && r.win.opts.map(o => o.label).join('|') === 'Согласиться|Предложить другое|Не сейчас|Открыть карточку', 'свидание: в окне часы и ваша часть, кнопки «Согласиться», «Предложить другое», «Не сейчас»', r.win);
    check(r.task && r.task.kind === 'restaurant' && r.task.label.startsWith('Свидание в ресторане · ') && Math.abs(r.task.cost - 0.0012) < 1e-9 && r.task.hours === 3 && r.task.partner && r.status === 'accepted', 'свидание: «Согласиться» ставит ресторан — цена и часы как у «Свидание в ресторане» из меню', r.task);
    check(/зовёт в кино$/.test(r.cinemaTitle) && r.poster.title === 'Свидание в кино' && r.cinemaTask?.kind === 'dateCinema255' && r.cinemaTask.film && r.cinemaTask.picked?.startsWith('«' + r.cinemaTask.film + '»'), 'свидание: кино — сначала афиша, выбранный фильм цепляется к встрече', { title: r.cinemaTitle, poster: r.poster?.title, task: r.cinemaTask });
    check(r.other.title.startsWith('Предложить другое · ') && r.other.opts.length >= 6 && !r.other.opts.some(o => o.label === 'Свидание на прогулке') && r.otherTask === 'dateBoard255' && r.otherStatus === 'accepted', 'свидание: «Предложить другое» — остальные виды, выбранный ставится вместо прогулки', { other: r.other?.opts?.map(o => o.label), task: r.otherTask });
    check(/зовёт на прогулку$/.test(r.oldTitle) && r.oldTask === 'dateWalk', 'свидание: старое приглашение без вида — прогулка, как раньше', { title: r.oldTitle, task: r.oldTask });
    // Приглашение из очереди окон (social255 → romance18): вид назван, согласие не превращается в «не принимает приглашение».
    const b = await ev(pg, () => {
      if ($('#modal').open) closeModal();
      for (const x of s.people) if (x.role === 'Партнер') x.role = 'Бывший партнер';
      s.clock.tasks = s.clock.tasks.filter(t => t.kind !== 'meeting53');
      const p = __adult(28); p.rejected = false;
      s.pending = []; queueOnce({ type: 'romance', id: p.id });
      const q = s.pending[0]; if (!q) return { win: __win(), noQueue: compatible(p) };
      q.date2755 = 'dateMuseum255';
      resolvePending(); const win = __win();
      const r0 = Math.random; Math.random = () => .999;
      const n0 = s.clock.tasks.length;
      try { __click(/^Запланировать встречу/); } finally { Math.random = r0; }
      const t = s.clock.tasks.length > n0 ? s.clock.tasks.at(-1) : null;
      return { win, task: t && t.meeting53, pending: s.pending.length, refused: s.log.slice(0, 4).some(e => e.title === 'В этот раз не получилось') };
    });
    check(/зовёт на выставку$/.test(b.win.title) && b.win.text.startsWith('Свидание на выставке: 2 ч/нед. на месяц') && b.win.opts.some(o => o.label === 'Предложить другое') && b.win.opts.some(o => o.label === 'Оставить общение дружеским'), 'свидание из очереди окон: «… зовёт на выставку», часы и цена, «Предложить другое»', b.win);
    check(b.task === 'dateMuseum255' && !b.refused && b.pending === 0, 'свидание из очереди окон: «Запланировать встречу» ставит выставку и не пишет «В этот раз не получилось»', b);
    // Подростковое приглашение — подростковая встреча.
    const t = await ev(pg, () => {
      if ($('#modal').open) closeModal();
      for (const x of s.people) if (x.role === 'Партнер') x.role = 'Бывший партнер';
      s.age = 16; s.clock.month = 6;
      const p = person('Знакомый', 16, undefined, s.country); p.city18 = residenceCity(); s.people.push(p); enrichPerson(p);
      p.gender = s.gender === 'f' ? 'm' : 'f'; p.orientation = 'straight'; s.orientation = 'straight';
      p.role = 'Партнер'; p.teenPair54 = { started: s.clock.ticks, ages: [16, 16] }; p.partnerSince = s.year; p.bond = 70;
      const z = initiatives68(); z.offers = []; z.cooldowns = {}; z.lastOffer = -100;
      const q = offerInitiative68(p, 'date');
      if (!q) return { why: initiativeWhy68(p, 'date') };
      q.date2755 = 'fair';
      initiativeMenu68(q.id); const win = __win();
      __click(/^Согласиться/);
      const task = s.clock.tasks.at(-1);
      return { win, task: task && { kind: task.kind, teen: task.teenKind54, label: task.label } };
    });
    check(t.win && /зовёт на ярмарку$/.test(t.win.title) && t.task?.kind === 'teenMoment68' && t.task.teen === 'fair', 'свидание подростков: «… зовёт на ярмарку» — подростковая встреча «Сходить на ярмарку»', t);
    check(!errors.length, 'свидание: без ошибок страницы', errors);
    await ctx.close();
  }

  // ---------- 5. Дети — только в одном городе ----------
  {
    const { pg, ctx, errors } = await page(browser);
    const r = await ev(pg, () => {
      const out = {};
      s.age = 30;
      for (const x of s.people) if (x.role === 'Партнер') x.role = 'Бывший партнер';
      const p = __adult(30); p.role = 'Партнер'; p.partnerSince = s.year - 4; p.childrenWish = 'yes'; p.sceneFlags = {};
      const z = initiatives68(); const offer = k => { z.offers = []; z.cooldowns = {}; z.lastOffer = -100; return offerInitiative68(p, k); };
      out.localWhy = initiativeWhy68(p, 'children');
      __away(p);
      out.awayWhy = initiativeWhy68(p, 'children'); out.awayOffer = !!offer('children');
      out.cohabitAway = initiativeWhy68(p, 'cohabit');
      // Другой город той же страны — тоже врозь.
      p.country = s.country; p.city18 = cities[s.country].find(c => c !== residenceCity());
      out.cityWhy = initiativeWhy68(p, 'children');
      // Разговор «о детях» из годового цикла (chapter.js → parenthood65).
      s.pending = []; p.sceneFlags.childTalk = true; queueOnce({ type: 'npcChildren', id: p.id });
      const key = s.pending[0]?.ledgerKey05;
      resolvePending(); out.talk = __win(); if ($('#modal').open) closeModal();
      out.pending = s.pending.length; out.childTalk = p.sceneFlags.childTalk;
      // Разговор не был показан — повторить его можно (журнал событий engine05 не держит его 48 месяцев).
      out.again = !!key && !s.eventLedger05[key];
      // Снова рядом — как раньше.
      p.city18 = residenceCity();
      out.backWhy = initiativeWhy68(p, 'children');
      s.pending = [{ type: 'npcChildren', id: p.id }];
      resolvePending(); out.talkLocal = __win(); if ($('#modal').open) closeModal();
      return out;
    });
    check(r.localWhy === '', 'дети: рядом партнёр может предложить подготовку к родительству', r.localWhy);
    check(r.awayWhy === 'Вы живёте в разных городах' && !r.awayOffer && r.cityWhy === 'Вы живёте в разных городах', 'дети: партнёр в другой стране и в другом городе не предлагает подготовку к родительству', r);
    check(!!r.cohabitAway, 'съехаться: на расстоянии нельзя (как и было) — «' + r.cohabitAway + '»', r.cohabitAway);
    check(!r.talk.open && r.pending === 0 && r.childTalk === false && r.again, 'дети: разговор «о детях», пока вы врозь, не показывается и вернётся позже', r);
    check(r.backWhy === '' && r.talkLocal.open && /родительств/.test(r.talkLocal.title), 'дети: снова в одном городе — предложение и разговор как раньше', r.talkLocal.title);
    check(!errors.length, 'дети: без ошибок страницы', errors);
    await ctx.close();
  }

  // ---------- 6. Подростковая пара: расставание и отношения на расстоянии ----------
  {
    const { pg, ctx, errors } = await page(browser);
    const r = await ev(pg, () => {
      const out = {};
      s.age = 16;
      for (const x of s.people) if (x.role === 'Партнер') x.role = 'Бывший партнер';
      const teen = () => { const p = person('Знакомый', 16, undefined, s.country); p.city18 = residenceCity(); s.people.push(p); enrichPerson(p);
        p.role = 'Партнер'; p.cohabit = false; p.teenPair54 = { started: s.clock.ticks, ages: [16, 16] }; p.partnerSince = s.year; p.bond = 60; return p; };
      const p = teen();
      romanceMenu(); out.local = __win(); closeModal();
      __away(p);
      romanceMenu(); out.away = __win();
      __click(/^Обсудить расставание/); out.confirm = __win();
      __click(/^Расстаться/);
      out.role = p.role; out.partner = currentPartner()?.id || null;
      out.log = s.log.find(e => e.title === 'Вы расстались')?.text || '';
      if ($('#modal').open) closeModal();
      // Пара в разных странах расходится сама.
      const q = teen(); __away(q);
      const roles = [];
      for (let i = 0; i < 18 && q.role === 'Партнер'; i++) { __month(); roles.push(q.role); }
      out.fadeMonths = roles.length; out.fadeRole = q.role;
      out.fadeLog = s.log.filter(e => ['Всё реже на связи', 'Отношения сошли на нет'].includes(e.title)).map(e => e.title + ': ' + e.text).reverse();
      // Пара рядом — нет.
      const w = teen(); w.inner.strain = 5;
      for (let i = 0; i < 18; i++) __month();
      out.localRole = w.role;
      return out;
    });
    const label = w => w?.opts?.find(o => o.label === 'Обсудить расставание');
    check(!!label(r.local) && !label(r.local).disabled, 'подростки: «Обсудить расставание» есть в окне встреч пары (рядом)', r.local?.opts?.map(o => o.label));
    check(!!label(r.away) && !label(r.away).disabled && /По видеосвязи/.test(label(r.away).hint) && /Вы живёте далеко друг от друга: .+ — .+ · .+\./.test(r.away.text), 'подростки: после переезда в другую страну расстаться можно — по видеосвязи или в переписке', r.away);
    check(/^Расстаться · .+\?$/.test(r.confirm.title) && r.role === 'Бывший партнер' && !r.partner && /на расстоянии отношения не держатся/.test(r.log), 'подростки: расставание на расстоянии проходит — «' + r.log + '»', r);
    check(r.fadeRole === 'Бывший партнер' && r.fadeMonths <= 14 && r.fadeLog.length === 2 && /^Всё реже на связи: /.test(r.fadeLog[0]) && /^Отношения сошли на нет: /.test(r.fadeLog[1]), 'подростки: пара в разных странах расходится сама (за ' + r.fadeMonths + ' мес.): «Всё реже на связи» → «Отношения сошли на нет»', r);
    check(r.localRole === 'Партнер', 'подростки: пара в одном городе за полтора года сама не расходится', r.localRole);
    check(!errors.length, 'подростки: без ошибок страницы', errors);
    await ctx.close();
  }

  // ---------- 7. Новоселье того, с кем вы живёте ----------
  {
    const { pg, ctx, errors } = await page(browser);
    const r = await ev(pg, () => {
      const out = {}, z = events54();
      const reset = () => { z.lastOffer = -100; z.invitations = z.invitations.filter(q => q.status !== 'offered'); z.hosts = {}; for (const p of s.people) if (p.lifeEvents54) p.lifeEvents54 = {}; };
      const mom = s.people.find(p => p.alive && p.role === 'Мать'), dad = s.people.find(p => p.alive && p.role === 'Отец');
      mom.bond = 80; if (dad) dad.bond = 80;
      out.mode = s.housing.mode; out.home = householdMembers59().map(p => p.role).sort().join(',');
      reset(); const q1 = offerOccasion54(mom, 'housewarming'); out.explicit = q1 ? q1.title : null;
      const kinds = {}; for (let i = 0; i < 60; i++) { reset(); const q = offerOccasion54(mom); if (q) kinds[q.kind] = (kinds[q.kind] || 0) + 1; }
      out.kinds = kinds;
      // Родители вместе, вы живёте у мамы: папа тоже живёт с вами — на его новоселье не зовут.
      s.housing.occupant = mom.id;
      if (dad) { out.together = (s.family27?.unions || []).some(u => u.status === 'together' && [u.a, u.b].includes(mom.id) && [u.a, u.b].includes(dad.id)); reset(); const qd = offerOccasion54(dad, 'housewarming'); out.dadExplicit = qd ? qd.title : null; }
      // Подросток у единственного родителя: отца нет, живёте у мамы.
      s.age = 16; if (dad) dad.alive = false; s.housing.occupant = mom.id;
      const teen = {}; for (let i = 0; i < 60; i++) { reset(); const q = offerOccasion54(); if (q) teen[q.kind + (q.host === mom.id ? ':мама' : '')] = (teen[q.kind + (q.host === mom.id ? ':мама' : '')] || 0) + 1; }
      out.teen = teen;
      // Пришедшее раньше приглашение на новоселье мамы закрывается.
      reset();
      const old = { id: 'occasion-old', host: mom.id, kind: 'housewarming', country: s.country, city: residenceCity(), local: true, paid: false, status: 'offered', created: s.clock.ticks, expires: s.clock.ticks + 3, fee: 0, title: 'Новоселье · ' + mom.name };
      z.invitations.push(old);
      out.oldAvailable = occasionAvailable54(old);
      out.oldInList = decisionItems24().some(it => it.ref?.id === old.id || it.q === old || it.title === old.title);
      z.invitations = z.invitations.filter(q => q !== old);
      // Взрослый живёт отдельно — мама в том же городе зовёт на новоселье.
      s.age = 30; if (dad) dad.alive = true;
      s.housing.mode = 'rent'; s.housing.occupant = null;
      out.homeAlone = householdMembers59().map(p => p.role).join(',');
      reset(); const q2 = offerOccasion54(mom, 'housewarming'); out.separate = q2 ? q2.title : null;
      return out;
    });
    check(r.mode === 'parents' && /Мать/.test(r.home), 'новоселье: в начале жизни вы живёте с родителями (' + r.home + ')', r);
    check(r.explicit === null, 'новоселье: мама, с которой вы живёте, не зовёт на своё новоселье', r.explicit);
    check(!r.kinds.housewarming && Object.values(r.kinds).reduce((a, b) => a + b, 0) > 0, 'новоселье: случайное событие мамы, с которой вы живёте, — что угодно, кроме новоселья', r.kinds);
    check(r.together === true && r.dadExplicit === null, 'новоселье: родители вместе, вы живёте у мамы — папа, который живёт с вами, на своё новоселье не зовёт', r);
    check(!Object.keys(r.teen).some(k => k === 'housewarming:мама'), 'новоселье: подросток у единственного родителя не получает приглашения на её новоселье', r.teen);
    check(r.oldAvailable === false && !r.oldInList, 'новоселье: уже пришедшее приглашение мамы, с которой вы живёте, закрыто', r);
    check(r.homeAlone === '' && /^Новоселье · /.test(r.separate || ''), 'новоселье: мама, которая живёт отдельно, зовёт на новоселье, как раньше', r);
    check(!errors.length, 'новоселье: без ошибок страницы', errors);
    await ctx.close();
  }

  // ---------- 7б. Второй родитель живёт отдельно в том же городе ----------
  // Подросток 15 лет у родителей. После развода (separateParents132) и у единственного родителя с рождения
  // (singleParentStart131) второй родитель жив и живёт в том же городе, но не с вами: его новоселье — как раньше.
  {
    const { pg, ctx, errors } = await page(browser, { seed: 2757 });
    const r = await ev(pg, () => {
      const out = {}, z = events54();
      const reset = () => { z.lastOffer = -100; z.invitations = z.invitations.filter(q => q.status !== 'offered'); z.hosts = {}; for (const p of s.people) if (p.lifeEvents54) p.lifeEvents54 = {}; };
      const mom = s.people.find(p => p.alive && p.role === 'Мать'), dad = s.people.find(p => p.alive && p.role === 'Отец');
      s.age = 15; s.housing.mode = 'parents'; s.housing.occupant = mom.id;
      for (const p of [mom, dad]) { p.country = s.country; p.city18 = residenceCity(); p.bond = 80; p.inner.affection = 80; }
      const probe = tag => {
        const t = s.family17.separation132 || s.family17.childhood131, other = living(t.otherParentId), carer = living(t.caregiverId);
        other.bond = 80; other.inner.affection = 80;
        const o = { other: other.role, carer: carer.role, sameCity: other.city18 === residenceCity() && other.country === s.country, home: householdMembers59().map(p => p.role).sort().join(',') };
        reset(); const q1 = offerOccasion54(other, 'housewarming'); o.otherHw = q1 ? q1.title : null;
        reset(); const q2 = offerOccasion54(carer, 'housewarming'); o.carerHw = q2 ? q2.title : null;
        const kinds = {}; for (let i = 0; i < 80; i++) { reset(); const q = offerOccasion54(other); if (q) kinds[q.kind] = (kinds[q.kind] || 0) + 1; }
        o.otherKinds = kinds;
        out[tag] = o;
      };
      // Развод: союз родителей «вместе», вы живёте у мамы.
      s.family27.unions = (s.family27.unions || []).filter(u => !originalParents132(u));
      const union = { id: 'union-2755', a: mom.id, b: dad.id, status: 'together', since: s.clock.ticks, legacy: true };
      s.family27.unions.push(union);
      delete s.family17.separation132; delete s.family17.childhood131;
      out.separated = separateParents132(union);
      probe('divorce');
      // С рождения у одного родителя: второй жив, общение есть.
      delete s.family17.separation132;
      let tries = 0; do { delete s.family17.childhood131; s.housing.occupant = mom.id; singleParentStart131(false); } while (!s.family17.childhood131?.contact && tries++ < 30);
      probe('single');
      return out;
    });
    for (const [tag, label] of [['divorce', 'после развода'], ['single', 'у единственного родителя с рождения']]) {
      const o = r[tag] || {};
      check(o.sameCity && /Мать/.test(o.home) && /Отец/.test(o.home), 'новоселье ' + label + ': второй родитель жив и в том же городе (' + o.home + ')', r);
      check(/^Новоселье · /.test(o.otherHw || ''), 'новоселье ' + label + ': второй родитель (' + o.other + '), который живёт отдельно, зовёт на своё новоселье — «' + o.otherHw + '»', o);
      check((o.otherKinds?.housewarming || 0) > 0, 'новоселье ' + label + ': среди случайных событий второго родителя есть новоселье', o.otherKinds);
      check(o.carerHw === null, 'новоселье ' + label + ': родитель, у которого вы живёте (' + o.carer + '), на своё новоселье не зовёт', o.carerHw);
    }
    check(r.separated === true, 'новоселье: развод родителей прошёл', r.separated);
    check(!errors.length, 'новоселье (второй родитель): без ошибок страницы', errors);
    await ctx.close();
  }

  // ---------- 8. Подключение ----------
  {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), order = [...html.matchAll(/<script src="([^"?]+)/g)].map(m => m[1]);
    check(order.indexOf('fixes2755.js') > 0 && order.indexOf('fixes2755.js') === order.indexOf('windows273.js') - 1, 'подключение: fixes2755.js — сразу перед windows273.js', order.slice(-12));
    const assets = fs.readFileSync(path.join(ROOT, 'offline-assets.json'), 'utf8');
    const list = JSON.parse(assets);
    check(list.includes('fixes2755.js') && JSON.stringify([...list].sort()) === JSON.stringify(list) && !assets.endsWith('\n') && !/\n/.test(assets), 'офлайн: fixes2755.js в offline-assets.json, список одной строкой по алфавиту', '');
  }

  await browser.close();
  console.log(`\n${pass}/${pass + fail}` + (BASE ? ' (BASE=1: без fixes2755.js)' : ''));
  process.exit(fail ? 1 : 0);
})();
